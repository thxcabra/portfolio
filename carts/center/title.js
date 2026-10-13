// FireRed's title screen as title_screen.c runs it. The entrance (INIT..FADEIN, 263 frames): a light
// band sweeps Charizard's silhouette, Charizard fades in grey, the border wipes in, the bars slide in
// from the right, three flashes, then the logo and Charizard fade from white into colour. Then the
// steady screen: the flame sprites (same RNG, seed, waves and 62 free sprite slots), the shine
// sweeping the logo every 574 frames and PRESS START blinking 60 frames on, 30 off. Everything is
// stepped at the GBA's frame rate.
import { nextSeed, titleEntrance, fade8, grey8, brighten8 } from '../../logic.js';

const FPS = 59.7275;
const FLAME_X = [4, 16, 26, 32, 48, 200, 216, 224, 232, 60, 76, 92, 108, 128, 144];
const MAX_FLAMES = 62;   // 64 sprites minus the blank sprite and the slash
const ENTRANCE = 263;    // RUN starts on this frame
const load = (src) => Object.assign(new Image(), { src });
const sheet = (...imgs) => {
  const c = Object.assign(document.createElement('canvas'), { width: 240, height: 160 });
  imgs.forEach((i) => c.getContext('2d').drawImage(i, 0, 0));
  return c;
};
const pixels = (c) => c.getContext('2d').getImageData(0, 0, 240, 160);

// The entrance's drawing: layers as pixels, recoloured per frame like the game's palette effects.
function entranceDrawer(canvas, [back, bars, press, charizard, logo]) {
  const ctx = canvas.getContext('2d');
  const cache = new Map();
  const variant = (key, base, fn) => {
    if (!cache.has(key)) {
      const img = new ImageData(new Uint8ClampedArray(base.data), 240, 160);
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) if (d[i + 3]) [d[i], d[i + 1], d[i + 2]] = fn(d[i], d[i + 1], d[i + 2]);
      const c = sheet();
      c.getContext('2d').putImageData(img, 0, 0);
      cache.set(key, c);
    }
    return cache.get(key);
  };
  const barsSheet = sheet(bars, press);   // BG2: the bars and PRESS START
  const barsPx = pixels(barsSheet), cz = pixels(sheet(charizard)), lg = pixels(sheet(logo));
  const toWhite = (y) => (r, g, b) => [fade8(r, 30, y), fade8(g, 30, y), fade8(b, 31, y)];   // RGB(30,30,31)
  const toBlack = (y) => (r, g, b) => [fade8(r, 0, y), fade8(g, 0, y), fade8(b, 0, y)];
  const grey = (to) => (r, g, b) => { const v = grey8(r, g, b); return to(v, v, v); };
  const bandSheet = sheet();
  const band = new ImageData(240, 160);

  return (M) => {
    const s = titleEntrance(M);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, 240, 160);
    if (s.border) ctx.drawImage(back, 0, 0, s.border, 160, 0, 0, s.border, 160);
    if (s.bars === 'black') ctx.drawImage(variant('bars-black', barsPx, () => [0, 0, 0]), 0, 0);
    else if (s.bars !== 'hidden') ctx.drawImage(barsSheet, 0, 0, 240 - s.bars, 160, s.bars, 0, 240 - s.bars, 160);
    const c = s.charizard;
    const fade = c.to === 'white' ? toWhite(c.y) : toBlack(c.y);
    ctx.drawImage(variant(`cz-${c.src}-${c.to}-${c.y}`, cz, c.src === 'grey' ? grey(fade) : fade), 0, 0);
    if (s.band !== null) {   // BLDY over the black Charizard: EVY 15 on the centre line, one less per line away
      band.data.fill(0);
      for (let y = Math.max(0, s.band - 15); y <= Math.min(159, s.band + 15); y++) {
        const v = brighten8(0, 15 - Math.abs(y - s.band));
        for (let x = 0; x < 240; x++) {
          const i = (y * 240 + x) * 4;
          if (cz.data[i + 3]) band.data.set([v, v, v, 255], i);
        }
      }
      bandSheet.getContext('2d').putImageData(band, 0, 0);
      ctx.drawImage(bandSheet, 0, 0);
    }
    if (s.logo !== null) ctx.drawImage(variant(`logo-${s.logo}`, lg, toWhite(s.logo)), 0, 0);
  };
}

export function createTitle(root, { reduced, entrance = false }) {
  root.innerHTML = `<div class="title">
    <img class="layer" src="assets/title/back.png" alt="">
    <canvas class="layer flames" width="240" height="160"></canvas>
    <img class="layer" src="assets/title/bars.png" alt="">
    <img class="layer press" src="assets/title/press.png" alt="PRESS START">
    <img class="layer" src="assets/title/charizard.png" alt="">
    <img class="layer" src="assets/title/logo.png" alt="Pokémon FireRed Version">
    <canvas class="layer lit" width="240" height="160"></canvas>
  </div>`;
  const title = root.querySelector('.title');
  if (reduced) return { stop() {}, leave: () => Promise.resolve(), skip() {}, entering: false };
  const [flameCtx, litCtx] = [...title.querySelectorAll('canvas')].map((c) => c.getContext('2d'));
  const press = title.querySelector('.press');
  const art = { flames: load('assets/title/flames.png'), lit: load('assets/title/lit.png'), slash: load('assets/title/slash.png') };

  let entering = entrance, M = 0, drawEntrance = null, cover = null;
  if (entering) {
    cover = Object.assign(document.createElement('canvas'), { width: 240, height: 160, className: 'layer entrance' });
    cover.getContext('2d').fillRect(0, 0, 240, 160);   // black until the layers are decoded
    title.append(cover);
    const imgs = [...title.querySelectorAll('img')];   // back, bars, press, charizard, logo
    Promise.all(imgs.map((i) => i.decode().catch(() => {}))).then(() => { drawEntrance = entranceDrawer(cover, imgs); });
  }
  function finishEntrance() {   // RUN: the steady layers under the cover take over
    entering = false;
    cover?.remove();
  }

  let seed = 30840;
  const rand = () => (seed = nextSeed(seed)) >>> 16;
  let frame = 0, timer = 0, delay = 0, off = 0;
  let flames = [];
  const slash = { x: -32, y: 27, timer: 540, on: false };

  function spawn(x, y, xs, ys, visible) {
    if (flames.length < MAX_FLAMES) flames.push({ px: x * 16, py: y * 16, xs, ys, n: 0, visible });
  }

  function step() {
    frame += 1;
    if (frame > 1 && ++timer >= delay) {   // Task_FlameSpawner: seeds on its first frame, then a wave every 18
      timer = 0;
      delay = 18;
      rand();
      let xs = (rand() % 4) - 2, ys = (rand() % 8) - 16;
      const y = (rand() % 3) + 116, x = rand() % 240;
      spawn(x, y, xs, ys, rand() % 16 >= 8);
      for (const fx of FLAME_X) {
        spawn(off + fx, y, xs, ys, true);
        xs = (rand() % 4) - 2;
        ys = (rand() % 8) - 16;
      }
      off = (off + 1) % 4;
    }
    flames = flames.filter((f) => {   // SpriteCallback_TitleScreenFlame
      f.n += 1;
      f.px -= f.xs;
      f.py += f.ys;
      f.x = f.px >> 4;
      f.y = f.py >> 4;
      return f.x >= -8 && f.y >= 16 && f.y <= 200 && f.n < 59;
    });
    if (!slash.on) {   // SpriteCallback_Slash
      if (--slash.timer === 0) slash.on = true;
    } else {
      slash.x += 9;
      if (slash.x === 67) slash.y -= 7;
      if (slash.x === 148) slash.y += 7;
      if (slash.x > 272) Object.assign(slash, { x: -32, timer: 540, on: false });
    }
  }

  function draw() {
    flameCtx.clearRect(0, 0, 240, 160);
    for (const f of [...flames].sort((a, b) => a.y - b.y)) {   // lower on screen = drawn on top
      if (!f.visible) continue;
      const tile = Math.min(9, Math.floor((f.n + 2) / 6));   // 3 frames, then 6 per tile, last one held
      flameCtx.drawImage(art.flames, 0, tile * 16, 16, 16, f.x - 8, f.y - 8, 16, 16);
    }
    litCtx.clearRect(0, 0, 240, 160);
    if (slash.on) {   // the shine is an OBJ window: only logo pixels inside it get BLDY 13
      litCtx.globalCompositeOperation = 'source-over';
      litCtx.drawImage(art.slash, slash.x - 32, slash.y - 32);
      litCtx.globalCompositeOperation = 'source-in';
      litCtx.drawImage(art.lit, 0, 0);
    }
    press.style.visibility = frame % 90 < 60 ? 'visible' : 'hidden';
  }

  let raf = 0, last = 0, acc = 0;
  function tick(now) {
    acc = Math.min(acc + (last ? now - last : 0), 200);   // a hidden tab doesn't fast-forward
    last = now;
    let stepped = false;
    for (; acc >= 1000 / FPS; acc -= 1000 / FPS) {
      stepped = true;
      if (!entering) step();
      else if (drawEntrance && ++M >= ENTRANCE) finishEntrance();
    }
    if (stepped) {
      if (entering) drawEntrance?.(M);
      else if (art.flames.complete) draw();
    }
    raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame(tick);
  // START on the title (scene CRY): the cry plays, 90 frames go by, then everything fades to white
  // (0 to 16 in steps of 2, about 9 frames).
  const leave = () => new Promise((resolve) => {
    setTimeout(() => {
      title.classList.add('to-white');
      setTimeout(resolve, 9000 / FPS);
    }, 90000 / FPS);
  });
  return {
    stop: () => cancelAnimationFrame(raf),
    leave,
    skip: () => entering && finishEntrance(),   // a button during the entrance: straight to RUN, as in the game
    get entering() { return entering; },
  };
}
