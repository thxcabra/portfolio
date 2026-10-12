// FireRed's title screen as title_screen.c runs it once the intro is over: the flame sprites
// (same RNG, seed, waves and 62 free sprite slots), the shine sweeping the logo every 574 frames
// and PRESS START blinking 60 frames on, 30 off. Stepped at the GBA's frame rate.
const FPS = 59.7275;
const FLAME_X = [4, 16, 26, 32, 48, 200, 216, 224, 232, 60, 76, 92, 108, 128, 144];
const MAX_FLAMES = 62;   // 64 sprites minus the blank sprite and the slash
const load = (src) => Object.assign(new Image(), { src });

export function createTitle(root, { reduced }) {
  root.innerHTML = `<div class="title">
    <img class="layer" src="assets/title/back.png" alt="">
    <canvas class="layer flames" width="240" height="160"></canvas>
    <img class="layer" src="assets/title/front.png" alt="Pokémon FireRed Version">
    <canvas class="layer lit" width="240" height="160"></canvas>
    <img class="layer press" src="assets/title/press.png" alt="PRESS START">
  </div>`;
  if (reduced) return { stop() {} };
  const [flameCtx, litCtx] = [...root.querySelectorAll('canvas')].map((c) => c.getContext('2d'));
  const press = root.querySelector('.press');
  const art = { flames: load('assets/title/flames.png'), lit: load('assets/title/lit.png'), slash: load('assets/title/slash.png') };

  let seed = 30840;
  const rand = () => (seed = (Math.imul(seed, 1103515245) + 24691) >>> 0) >>> 16;
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
      step();
      stepped = true;
    }
    if (stepped && art.flames.complete) draw();
    raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame(tick);
  return { stop: () => cancelAnimationFrame(raf) };
}
