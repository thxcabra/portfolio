// FireRed's opening GAME FREAK scene (intro.c, GFScene_*): the navy band opens, a shooting star crosses it
// shedding sparkles, the name fades in among sparkles, the logo fades in, and it all fades back into the
// band. T counts frames from the one where the star appears (the scene starts at T−8, ends after T474).
import { blendLevels, alpha8, starPos, nextSeed, gfWindow } from '../../logic.js';

const FPS = 59.7275;
const SPOTS = [[72, 80], [136, 74], [168, 80], [120, 80], [104, 86], [88, 74], [184, 74], [56, 86], [152, 86]];
const BIG_ORDER = [0, 4, 8, 3, 7, 2, 6, 1, 5];
const FIRST = -8, LAST = 474;
const load = (src) => Object.assign(new Image(), { src });
const sheet = () => Object.assign(document.createElement('canvas'), { width: 240, height: 160 });

export function createIntro(root, { onDone, onStar = () => {} }) {
  root.innerHTML = '<canvas class="layer intro" width="240" height="160"></canvas>';
  const ctx = root.querySelector('canvas').getContext('2d');
  ctx.fillRect(0, 0, 240, 160);
  const art = {
    text: load('assets/intro/gf-text.png'), logo: load('assets/intro/gf-logo.png'), star: load('assets/intro/star.png'),
    small: load('assets/intro/sparkles-small.png'), big: load('assets/intro/sparkles-big.png'),
  };
  let data = null, layers = null;
  let raf = 0, last = 0, acc = 0, T = FIRST - 1, done = false;
  let star = null, seed = 354128453, yMod = 0;
  let trail = [], small = [], big = [];

  const cache = new Map();
  function blended(key, src, eva, evb) {   // BLDALPHA over the navy band: (EVA·top + EVB·navy) >> 4
    const k = `${key}-${eva}-${evb}`;
    if (!cache.has(k)) {
      const img = new ImageData(new Uint8ClampedArray(src.data), 240, 160);
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) if (d[i + 3]) for (let c = 0; c < 3; c++) d[i + c] = alpha8(d[i + c], data.navy[c], eva, evb);
      const c = sheet();
      c.getContext('2d').putImageData(img, 0, 0);
      cache.set(k, c);
    }
    return cache.get(k);
  }

  function updateSmall(s) {   // SpriteCB_SparklesSmall_Name
    if (s.timer) {
      s.timer -= 1;
      s.by += 1;
      s.y = s.by >> 4;
      if (s.y > 86) {
        s.y = 74;
        s.by = 74 << 4;
      }
      if (s.ended) {
        if (s.state === 0) {
          s.x += 26;
          if (s.x > 188) [s.x, s.state] = [376 - s.x, 1];
        } else {
          s.x -= 26;
          if (s.x < 52) [s.x, s.state] = [104 - s.x, 0];
        }
        Object.assign(s, { mode: 'once', a: 0, ended: false });
      }
    } else {
      if (s.loops) return false;
      if (s.ended) Object.assign(s, { mode: 'loop', a: 0, ended: false });
      s.by += 4;
      s.y = s.by >> 4;
      if (++s.end > 50) return false;
    }
    s.a += 1;   // 4 tiles × 4 frames; the one-shot holds its last tile one frame more
    if (s.mode === 'once' && s.a >= 17) s.ended = true;
    return true;
  }

  function step() {
    T += 1;
    trail = trail.filter((s) => {   // SpriteCB_SparklesSmall_Star
      s.bx += s.sx;
      s.by += s.sy;
      s.t += 1;
      s.x = (s.bx & 0xffff) >> 5;
      s.y = s.by >> 5;
      if (s.t > 90) s.hidden = !s.hidden;
      return s.t <= 120 && s.y >= 0 && s.y <= 160;
    });
    if (T === 0) {   // IntroCB_GF_Star: the star and MUS_GAME_FREAK start together
      star = { n: 0 };
      onStar();
    }
    if (star) {   // SpriteCB_Star
      star.n += 1;
      Object.assign(star, starPos(star.n, data.sine));
      if (star.n % 8) {
        seed = nextSeed(seed);
        const xMod = ((seed >>> 16) & 7) + 2, dy = yMod;
        yMod = yMod >= 3 ? -3 : yMod + 1;
        const x = star.x + xMod, y = star.y + star.y2 + dy;
        if (x > 0 && x < 240) trail.push({ bx: x << 5, by: y << 5, sx: xMod, sy: dy, t: 0, x, y, hidden: false });
      }
      if (star.x < -8) star = null;
    }
    small = small.filter(updateSmall);
    if (T >= 37 && T <= 156 && (T - 30) % 7 === 0) {   // GFScene_Task_NameSparklesSmall: every 7 frames, 18 in all
      const k = (T - 30) / 7;
      const [x, y] = SPOTS[(k - 1) % 9];
      small.push({ x, y, by: y << 4, timer: 120, loops: k > 9 ? 1 : 0, state: 0, mode: 'once', a: 0, ended: false, end: 0 });
    }
    big = big.filter((s) => ++s.age < 33);
    if (T >= 122 && T <= 202 && (T - 122) % 10 === 0) {   // GFScene_Task_NameSparklesBig: every 10 frames, 9 in all
      const [x, y] = SPOTS[BIG_ORDER[(T - 122) / 10]];
      big.push({ x, y, age: 0 });
    }
    if (T >= LAST) finish();
  }

  const smallTile = (s) => (s.mode === 'once' ? Math.min(3, (s.a - 1) >> 2) : ((s.a - 1) >> 2) % 4);
  const drawSmall = (k, x, y) => ctx.drawImage(art.small, (k & 1) * 8, (k >> 1) * 8, 8, 8, x - 4, y - 4, 8, 8);

  function draw() {
    const [top, bottom] = gfWindow(T);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, 240, 160);
    if (bottom <= top) return;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, top, 240, bottom - top);   // WIN1: nothing shows outside the band's window
    ctx.clip();
    ctx.fillStyle = `rgb(${data.navy})`;
    ctx.fillRect(0, 24, 240, 112);   // BG3: navy on rows 24–135
    if (T >= 311 && T <= 342) ctx.drawImage(blended('logo', layers.logoPx, ...blendLevels(0, 16, 16, 0, 16, T - 310)), 0, 0);   // the logo sprite, under BG2
    if (T >= 163 && T < 258) ctx.drawImage(blended('text', layers.textPx, ...blendLevels(0, 16, 16, 0, 48, T - 162)), 0, 0);
    else if (T >= 258 && T < 342) ctx.drawImage(layers.text, 0, 0);
    else if (T >= 342 && T <= 434) ctx.drawImage(layers.full, 0, 0);
    else if (T > 434 && T < 474) ctx.drawImage(blended('full', layers.fullPx, ...blendLevels(16, 0, 0, 16, 20, T - 434)), 0, 0);
    for (const s of big) ctx.drawImage(art.big, 0, Math.min(3, s.age >> 3) * 32, 32, 32, s.x - 16, s.y - 16, 32, 32);
    for (const s of small) drawSmall(smallTile(s), s.x, s.y);
    for (const s of trail) if (!s.hidden) drawSmall(((s.t - 1) >> 2) % 4, s.x, s.y);
    if (star) ctx.drawImage(art.star, star.x - 8, star.y + star.y2 - 8);
    ctx.restore();
  }

  function tick(now) {
    acc = Math.min(acc + (last ? now - last : 0), 200);
    last = now;
    let stepped = false;
    for (; acc >= 1000 / FPS && !done; acc -= 1000 / FPS) {
      step();
      stepped = true;
    }
    if (done) return;
    if (stepped) draw();
    raf = requestAnimationFrame(tick);
  }

  function finish() {
    if (done) return;
    done = true;
    cancelAnimationFrame(raf);
    onDone();
  }

  Promise.all([fetch('assets/intro/intro.json').then((r) => r.json()), ...Object.values(art).map((i) => i.decode())])
    .then(([json]) => {
      if (done) return;
      data = json;
      const text = sheet(), full = sheet(), logo = sheet();
      text.getContext('2d').drawImage(art.text, 48, 72);
      logo.getContext('2d').drawImage(art.logo, 104, 38);
      full.getContext('2d').drawImage(art.logo, 104, 38);   // T342: the logo is copied into BG2 and the name blitted over it
      full.getContext('2d').drawImage(art.text, 48, 72);
      const px = (c) => c.getContext('2d').getImageData(0, 0, 240, 160);
      layers = { text, full, textPx: px(text), fullPx: px(full), logoPx: px(logo) };
      raf = requestAnimationFrame(tick);
    })
    .catch(() => finish());   // missing art: go straight on to the title

  return {
    stop() {
      done = true;
      cancelAnimationFrame(raf);
    },
  };
}
