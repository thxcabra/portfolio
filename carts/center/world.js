import { DIRS, around, pathToAny } from '../../logic.js';

export const BEHAVIOR = { COUNTER: 0x80, BOOKSHELF: 0x81, PC: 0x83, REGION_MAP: 0x85, STAIRS: 0x6a, DOOR_MAT: 0x65 };
const CLICKABLE = new Set([BEHAVIOR.COUNTER, BEHAVIOR.BOOKSHELF, BEHAVIOR.PC, BEHAVIOR.REGION_MAP, BEHAVIOR.STAIRS]);
const STEP = 266;       // ms per tile: 16 frames at 60 fps, as in the game
const RUN_STEP = 133;   // holding B
const TURN = 90;        // a quick tap only turns around; holding walks
const FRAMES = { down: [0, 3, 4], up: [1, 5, 6], left: [2, 7, 8], right: [2, 7, 8] };   // standing, step A, step B
const OPPOSITE = { up: 'down', down: 'up', left: 'right', right: 'left' };

function draw(p) {
  p.el.style.left = `${p.px}px`;
  p.el.style.top = `${p.py - 16}px`;
  p.el.style.zIndex = String(p.py);
  p.el.style.backgroundPosition = `${-FRAMES[p.dir][p.frame] * 16}px 0`;
  p.el.classList.toggle('flip', p.dir === 'right');
  Object.assign(p.el.dataset, { x: p.x, y: p.y, dir: p.dir });
}

function person(layer, id, x, y, dir) {
  const el = document.createElement('i');
  el.className = 'person';
  el.style.backgroundImage = `url(assets/world/people/${id}.png)`;
  layer.append(el);
  const p = { el, id, x, y, dir, px: x * 16, py: y * 16, frame: 0, to: null, parity: false };
  draw(p);
  return p;
}

export function createWorld(root, map, hooks) {
  root.insertAdjacentHTML('beforeend', `<img class="layer" src="assets/world/center-floor.png" alt="" draggable="false">
    <div class="people"></div>
    <img class="layer" src="assets/world/center-over.png" alt="" draggable="false">`);
  const layer = root.querySelector('.people');
  const player = person(layer, 'red', 7, 8, 'up');
  player.el.dataset.me = '';
  const npcs = map.people.map((n) => Object.assign(person(layer, n.id, n.x, n.y, 'down'), { home: { x: n.x, y: n.y }, wander: n.wander, next: 0 }));
  const people = [player, ...npcs];

  let order = [];          // held directions, last pressed wins
  let running = false;
  let turnAt = 0;
  let path = [];
  let pathDone = null;
  let frozen = false;
  let lastBump = 0;
  let raf = 0;

  const inside = (x, y) => x >= 0 && y >= 0 && x < map.w && y < map.h;
  const occupied = (x, y) => people.some((p) => (p.x === x && p.y === y) || (p.to && p.to.x === x && p.to.y === y));
  const free = (x, y) => inside(x, y) && !map.walls[y][x] && !occupied(x, y);
  const walkable = (x, y) => free(x, y) && map.behavior[y][x] !== BEHAVIOR.STAIRS;

  function startStep(p, dir, dur, now) {
    const [dx, dy] = DIRS[dir];
    Object.assign(p, { dir, from: { x: p.x, y: p.y }, to: { x: p.x + dx, y: p.y + dy }, t0: now, dur, parity: !p.parity });
  }

  function tick(p, now) {
    if (!p.to) return;
    const k = Math.min(1, (now - p.t0) / p.dur);
    p.px = Math.round((p.from.x + (p.to.x - p.from.x) * k) * 16);
    p.py = Math.round((p.from.y + (p.to.y - p.from.y) * k) * 16);
    p.frame = k < 0.5 ? (p.parity ? 1 : 2) : 0;
    if (k >= 1) {
      Object.assign(p, { x: p.to.x, y: p.to.y, to: null, frame: 0 });
    }
    draw(p);
  }

  function tryWalk(dir, now) {
    const [dx, dy] = DIRS[dir];
    const to = { x: player.x + dx, y: player.y + dy };
    player.dir = dir;
    draw(player);
    if (hooks.blocked(to, dir, { x: player.x, y: player.y })) {
      order = [];
      path = [];
      pathDone = null;
      return false;
    }
    if (!free(to.x, to.y)) {
      if (now - lastBump > 533) { lastBump = now; hooks.bump(); }   // SE_WALL_HIT every 32 frames while held
      return false;
    }
    startStep(player, dir, running ? RUN_STEP : STEP, now);
    return true;
  }

  function wanderTick(n, now) {
    if (!n.wander || n.to || frozen) return;
    if (!n.next) n.next = now + 1500 + Math.random() * 2000;
    if (now < n.next) return;
    n.next = now + 1500 + Math.random() * 2000;
    const dir = Object.keys(DIRS)[Math.floor(Math.random() * 4)];
    const [dx, dy] = DIRS[dir];
    const nx = n.x + dx, ny = n.y + dy;
    n.dir = dir;
    if (Math.abs(nx - n.home.x) <= 1 && Math.abs(ny - n.home.y) <= 1 && walkable(nx, ny)) startStep(n, dir, STEP, now);
    else draw(n);
  }

  function facing() {
    const [dx, dy] = DIRS[player.dir];
    return { x: player.x + dx, y: player.y + dy };
  }

  function act() {
    if (player.to) return;
    const f = facing();
    let who = npcs.find((p) => p.x === f.x && p.y === f.y);
    if (!who && map.behavior[f.y]?.[f.x] === BEHAVIOR.COUNTER) {   // talk across the counter, as in the game
      const [dx, dy] = DIRS[player.dir];
      who = npcs.find((p) => p.x === f.x + dx && p.y === f.y + dy);
    }
    if (who) {
      who.dir = OPPOSITE[player.dir];
      draw(who);
      return hooks.interact({ person: who.id });
    }
    hooks.interact({ x: f.x, y: f.y, behavior: map.behavior[f.y]?.[f.x] ?? 0 });
  }

  // Standing spots for reaching a tile: next to it, or across a counter.
  function goalsFor(t) {
    const goals = around(t);
    for (const [face, [dx, dy]] of Object.entries(DIRS)) {
      if (map.behavior[t.y - dy]?.[t.x - dx] === BEHAVIOR.COUNTER) goals.push({ x: t.x - 2 * dx, y: t.y - 2 * dy, face });
    }
    return goals;
  }

  function frame(now) {
    if (!player.to && !frozen) {
      if (path.length) {
        if (!tryWalk(path.shift(), now)) path = [];
      } else if (pathDone) {
        const done = pathDone;
        pathDone = null;
        done();
      } else {
        const dir = order[order.length - 1];
        if (dir && now - turnAt >= TURN) tryWalk(dir, now);
      }
    }
    for (const p of people) {
      if (p !== player) wanderTick(p, now);
      tick(p, now);
    }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  return {
    button(name, down) {
      if (DIRS[name]) {
        order = order.filter((d) => d !== name);
        if (!down) return;
        order.push(name);
        path = [];
        pathDone = null;
        if (!player.to && name !== player.dir) {
          player.dir = name;
          turnAt = performance.now();
          draw(player);
        }
      } else if (name === 'b') {
        running = down;
      } else if (name === 'a' && down && !frozen) {
        act();
      }
    },
    pointer(px, py) {
      if (frozen) return;
      const tx = Math.floor(px / 16), ty = Math.floor(py / 16);
      const who = npcs.find((p) => p.x === tx && (p.y === ty || p.y - 1 === ty));   // sprites are two tiles tall
      const b = map.behavior[ty]?.[tx] ?? 0;
      if (!who && b === BEHAVIOR.DOOR_MAT && tx === player.x && ty === player.y) {
        hooks.blocked({ x: tx, y: ty + 1 }, 'down', { x: tx, y: ty });
        return;
      }
      const target = who || (CLICKABLE.has(b) ? { x: tx, y: ty } : null);
      const goals = target ? goalsFor(target) : [{ x: tx, y: ty }];
      const route = pathToAny(walkable, player, goals);
      if (!route) return;
      order = [];
      path = route.steps;
      pathDone = () => {
        if (route.face) {
          player.dir = route.face;
          draw(player);
        }
        if (!target) return;
        if (b === BEHAVIOR.STAIRS && !who) tryWalk(route.face, performance.now());
        else act();
      };
    },
    freeze(on) {
      frozen = on;
      if (on) {
        order = [];
        path = [];
        pathDone = null;
      }
    },
    stop() {
      cancelAnimationFrame(raf);
    },
  };
}
