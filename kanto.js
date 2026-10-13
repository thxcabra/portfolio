// The page behind the GBA: Route 1, Pallet Town and the sea below it, drawn from the game's own map
// data (assets/kanto/kanto.json, tools/build_assets.py) at the GBA screen's pixel size. Outside the maps
// the game's border block (trees) repeats. Sea, shore and flowers animate on the game's timing
// (tileset_anims.c), the people wander as their movement types say (event_object_movement.c) and the
// camera drifts up and down the map, one pixel every 3 frames. With reduced motion it stands still.
import { pingPong } from './logic.js';

const FPS = 59.7275;
const FRAMES = { down: [0, 3, 4], up: [1, 5, 6], left: [2, 7, 8], right: [2, 7, 8] };   // standing, step A, step B
const STEP = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const MOVES = {   // allowed directions and the facing they start with (gInitialMovementTypeFacingDirections)
  wander_around: [['up', 'down', 'left', 'right'], 'down'],
  wander_up_and_down: [['up', 'down'], 'up'],
  wander_left_and_right: [['left', 'right'], 'left'],
  face_up: [[], 'up'],
};
const DELAYS = [32, 64, 96, 128];   // gMovementDelaysMedium
const CAMERA = 3;                   // frames per pixel of drift
const rand = (n) => Math.floor(Math.random() * n);

export async function startKanto({ reduced }) {
  const data = await (await fetch('assets/kanto/kanto.json')).json();
  const bytes = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const tiles = bytes(data.tiles);
  const pals = data.pals.map((p) => p.map(([r, g, b]) => ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0));
  const anims = Object.values(data.anims).map((a) => ({ ...a, frames: a.frames.map(bytes), cur: 0, cells: [] }));
  const sheets = {};
  await Promise.all([...new Set(data.people.map((p) => p.id))].map((id) => {
    sheets[id] = Object.assign(new Image(), { src: `assets/kanto/people/${id}.png` });
    return sheets[id].decode();
  }));
  const people = data.people.map((p) => {
    const [dirs, dir] = MOVES[p.move] ?? MOVES.face_up;
    return { ...p, home: { x: p.x, y: p.y }, dirs, dir, frame: 0, n: -1, wait: DELAYS[rand(4)], parity: false };
  });

  const view = Object.assign(document.createElement('canvas'), { className: 'kanto' });
  const ctx = view.getContext('2d');
  const dim = Object.assign(document.createElement('div'), { className: 'bg-dim' });
  document.body.prepend(view, dim);
  const map = document.createElement('canvas');
  const mctx = map.getContext('2d');
  let img = null, px = null, pw = 0, M = -1, V = -1, k = 1, vw = 0, vh = 0;

  // A tile's pixels: from the current animation frame when the tile is animated.
  function tile(t) {
    for (const a of anims) if (t >= a.start && t < a.start + a.count) return [a.frames[a.cur], (t - a.start) * 64];
    return [tiles, t * 64];
  }
  const metaAt = (cx, cy) => {
    const x = cx - M, y = cy - V;
    return x >= 0 && y >= 0 && x < data.w && y < data.h ? data.map[y * data.w + x] : data.border[(y & 1) * 2 + (x & 1)];
  };
  function drawCell(cx, cy) {
    const entries = data.metas[metaAt(cx, cy)];
    const base = cy * 16 * pw + cx * 16;
    for (let y = 0; y < 16; y++) px.fill(pals[0][0], base + y * pw, base + y * pw + 16);   // the backdrop
    entries.forEach((e, n) => {
      const [src, off] = tile(e & 0x3ff), hf = e >> 10 & 1, vf = e >> 11 & 1, pal = pals[e >> 12];
      const o = base + ((n >> 1) & 1) * 8 * pw + (n & 1) * 8;
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          const v = src[off + (vf ? 7 - y : y) * 8 + (hf ? 7 - x : x)];
          if (v) px[o + y * pw + x] = pal[v];
        }
      }
    });
  }
  // The whole map with M border columns on each side and V border rows above and below.
  function render() {
    const cols = data.w + 2 * M, rows = data.h + 2 * V;
    map.width = pw = cols * 16;
    map.height = rows * 16;
    img = new ImageData(pw, map.height);
    px = new Uint32Array(img.data.buffer);
    anims.forEach((a) => { a.cells = []; });
    for (let cy = 0; cy < rows; cy++) {
      for (let cx = 0; cx < cols; cx++) {
        drawCell(cx, cy);
        const ts = data.metas[metaAt(cx, cy)].map((e) => e & 0x3ff);
        for (const a of anims) if (ts.some((t) => t >= a.start && t < a.start + a.count)) a.cells.push([cx, cy]);
      }
    }
    mctx.putImageData(img, 0, 0);
  }

  // Sizes: the visible canvas has one pixel per game pixel and is scaled like the GBA (--k).
  function fit() {
    k = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--k')) || 1;
    vw = Math.ceil(innerWidth / k);
    vh = Math.ceil(innerHeight / k);
    const m = Math.max(2, Math.ceil((vw - data.w * 16) / 32) + 1), v = Math.max(1, Math.ceil((vh - data.h * 16) / 32) + 1);
    if (m !== M || v !== V) {
      [M, V] = [m, v];
      render();
    }
    Object.assign(view, { width: vw, height: vh });
    Object.assign(view.style, { width: `${vw * k}px`, height: `${vh * k}px`, left: `${Math.floor((innerWidth - vw * k) / 2)}px`, top: `${Math.floor((innerHeight - vh * k) / 2)}px` });
    draw();
  }

  // The camera starts on Pallet Town and drifts north first.
  let timer = 0, t = null;
  const span = () => data.h * 16 - vh;
  function camera() {
    const s = span();
    if (t === null) t = CAMERA * (2 * Math.max(s, 0) - Math.max(0, Math.min(s, 50 * 16 - Math.floor(vh / 2))));   // row 50: Pallet's middle
    return [M * 16 + data.w * 8 - Math.floor(vw / 2), V * 16 + (s > 0 ? pingPong(Math.floor(t / CAMERA), s) : Math.floor(s / 2))];
  }

  const busy = (x, y, me) => people.some((p) => p !== me && ((p.x === x && p.y === y) || (p.to && p.to.x === x && p.to.y === y)));
  function blocked(p, dir) {
    const x = p.x + STEP[dir][0], y = p.y + STEP[dir][1];
    return Math.abs(x - p.home.x) > p.rx || Math.abs(y - p.home.y) > p.ry || x < 0 || y < 0 || x >= data.w || y >= data.h
      || data.walls[y * data.w + x] === '1' || busy(x, y, p);
  }
  // MovementType_WanderAround: wait 32–128 frames, face a random allowed way, walk a tile if it's free.
  function move(p) {
    if (!p.dirs.length) return;
    if (p.to) {
      p.n += 1;
      p.frame = p.n < 8 ? (p.parity ? 1 : 2) : 0;
      if (p.n === 16) Object.assign(p, { x: p.to.x, y: p.to.y, to: null, frame: 0, wait: DELAYS[rand(4)] });
      return;
    }
    if (--p.wait > 0) return;
    p.dir = p.dirs[rand(p.dirs.length)];
    if (blocked(p, p.dir)) return void (p.wait = DELAYS[rand(4)]);
    Object.assign(p, { to: { x: p.x + STEP[p.dir][0], y: p.y + STEP[p.dir][1] }, n: 0, parity: !p.parity });
  }

  function step() {
    timer = (timer + 1) % 640;
    t += 1;
    for (const a of anims) {
      if (timer % a.every !== a.phase) continue;
      a.cur = Math.floor(timer / a.every) % a.frames.length;
      for (const [cx, cy] of a.cells) {
        drawCell(cx, cy);
        mctx.putImageData(img, 0, 0, cx * 16, cy * 16, 16, 16);
      }
    }
    people.forEach(move);
  }

  function draw() {
    const [cx, cy] = camera();
    ctx.drawImage(map, cx, cy, vw, vh, 0, 0, vw, vh);
    for (const p of [...people].sort((a, b) => a.y - b.y)) {
      const off = p.to ? p.n : 0;
      const x = (M + p.x) * 16 + STEP[p.dir][0] * off - cx, y = (V + p.y) * 16 + STEP[p.dir][1] * off - 16 - cy;
      ctx.save();
      if (p.dir === 'right') ctx.setTransform(-1, 0, 0, 1, x + 16, y);
      else ctx.translate(x, y);
      ctx.drawImage(sheets[p.id], FRAMES[p.dir][p.frame] * 16, 0, 16, 32, 0, 0, 16, 32);
      ctx.restore();
    }
  }

  let last = 0, acc = 0;
  function tick(now) {
    acc = Math.min(acc + (last ? now - last : 0), 200);   // a hidden tab pauses; no fast-forward after it
    last = now;
    let stepped = false;
    for (; acc >= 1000 / FPS; acc -= 1000 / FPS) {
      step();
      stepped = true;
    }
    if (stepped) draw();
    requestAnimationFrame(tick);
  }
  fit();
  if (!reduced()) requestAnimationFrame(tick);
  return { fit };
}
