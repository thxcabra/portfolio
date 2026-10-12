// The console: a GBA body around the 240x160 screen, integer scaling, the buttons (keyboard,
// mouse, touch), the sound switch and the page background. Games are cartridges: they get the
// screen and the buttons and know nothing about scaling or input devices.
import { DATA } from './data.js';
import { fitScale, coverScale, pickNext, discPath, rrectPath } from './logic.js';
import { setEnabled, sfx, cry } from './sound.js';
import cart from './carts/center/index.js';

const W = 400, H = 196;
const SPEEDS = { slow: 30, mid: 60, fast: 120 };   // characters per second
const KEYS = {
  ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
  w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right',
  z: 'a', Z: 'a', ' ': 'a', x: 'b', X: 'b', Escape: 'b', Enter: 'start', Shift: 'select',
  q: 'l', Q: 'l', e: 'r', E: 'r',
};
const DPAD = new Set(['up', 'down', 'left', 'right']);

const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage blocked: just don't remember */ } },
};
const saved = store.get('lang', null);
const lang = saved === 'pt' || saved === 'en' ? saved : navigator.language?.toLowerCase().startsWith('pt') ? 'pt' : 'en';
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
let soundOn = store.get('sound', false) === true;
let bg = null;

const $gba = document.getElementById('gba'), $screen = document.getElementById('screen');
const t = (k) => DATA.ui[lang][k] ?? DATA.ui.pt[k] ?? k;
const api = {
  sfx, cry, store, reduced, t,
  talk: (k) => DATA.talk[lang][k] ?? DATA.talk.pt[k] ?? [k],
  cps: () => SPEEDS[store.get('textSpeed', 'fast')] ?? SPEEDS.fast,
};

// ---------- body: SVG on the game-pixel grid, geometric, no logos ----------
const INK = '#1c1638', BODY = '#4b3f8f', HI = '#6a5cb5', LO = '#31285f', KEY = '#2a2a32', KEY_INK = '#101014';
const path = (d, fill, cls = '') => `<path d="${d}" fill="${fill}"${cls && ` class="${cls}"`}/>`;
const box = (x, y, w, h, fill, ink, ins = [2, 1]) => path(rrectPath(x, y, w, h, ins), ink) + path(rrectPath(x + 2, y + 2, w - 4, h - 4, ins.slice(1)), fill);
const disc = (x, y, d, fill, ink) => path(discPath(x, y, d), ink) + path(discPath(x + 2, y + 2, d - 4), fill);
// Layout (game px): 68px side columns. Left: d-pad, then START and SELECT below it, as on the real GBA.
// Right: A/B, then the speaker with the sound switch. Every control keeps >= 10px from the screen bezel.
const GRILL = Array.from({ length: 16 }, (_, i) => `M${356 + (i % 4) * 8} ${108 + Math.floor(i / 4) * 8}h4v4h-4z`).join('');
const BODY_SVG = `<svg class="body" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true">
  ${box(0, 0, W, H, BODY, INK, [6, 3, 2, 1, 1])}
  ${path('M8 4h384v2h-384z', HI)}${path('M8 188h384v2h-384z', LO)}
  ${box(68, 6, 264, 182, '#2c2c34', KEY_INK, [3, 1, 1])}
  ${path('M78 10h244v164h-244z', KEY_INK)}
  ${path(discPath(14, 12, 6), '#78f878')}
  <g class="g-dpad">${path(rrectPath(27, 56, 14, 36, [1]) + rrectPath(16, 67, 36, 14, [1]), KEY_INK)}${path(rrectPath(29, 58, 10, 32, []) + rrectPath(18, 69, 32, 10, []), KEY)}</g>
  <g class="g-start">${box(20, 116, 28, 8, KEY, KEY_INK, [1])}</g><g class="g-select">${box(20, 146, 28, 8, KEY, KEY_INK, [1])}</g>
  <g class="g-a">${disc(366, 46, 22, '#c8c8d0', KEY_INK)}</g><g class="g-b">${disc(342, 64, 22, '#c8c8d0', KEY_INK)}</g>
  ${path(discPath(344, 112, 6), '#2a3a2a', 'led-sound')}
  ${path(GRILL, LO)}
</svg>`;
const btn = (name, x, y, w, h, text = '', cls = 'hw') =>
  `<button type="button" class="${cls}" data-btn="${name}" tabindex="-1" aria-label="${name}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px">${text}</button>`;
const CONTROLS = [
  btn('up', 27, 56, 14, 12), btn('down', 27, 80, 14, 12), btn('left', 16, 67, 12, 14), btn('right', 40, 67, 12, 14),
  btn('start', 14, 112, 40, 28), btn('select', 14, 142, 40, 28),
  btn('a', 366, 46, 22, 22, 'A', 'hw round'), btn('b', 342, 64, 22, 22, 'B', 'hw round'),
  btn('sound', 338, 104, 54, 52),
].join('');
const LABELS = `<p class="label name">${DATA.trainer.name}</p><p class="label sel">SELECT</p><p class="label sta">START</p><p class="label snd">${t('opt_sound')}</p>`;

// ---------- buttons ----------
const held = new Set();
function press(name, down) {
  if (down === held.has(name)) return;
  if (down) held.add(name);
  else held.delete(name);
  if (DPAD.has(name)) $gba.classList.toggle('p-dpad', [...held].some((n) => DPAD.has(n)));
  else $gba.classList.toggle(`p-${name}`, down);
  cart.button(name, down);
}
let unlocked = false;
function unlock() {
  if (unlocked) return;
  unlocked = true;
  setEnabled(soundOn);   // browsers only allow audio after a gesture
}
function toggleSound() {
  soundOn = !soundOn;
  store.set('sound', soundOn);
  setEnabled(soundOn);
  document.body.classList.toggle('sound-on', soundOn);
  sfx('select');
}

addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const name = KEYS[e.key];
  if (!name) return;
  e.preventDefault();
  unlock();
  press(name, true);
});
addEventListener('keyup', (e) => {
  const name = KEYS[e.key];
  if (name) press(name, false);
});
addEventListener('blur', () => [...held].forEach((n) => press(n, false)));   // let go of everything when the tab loses focus

$gba.addEventListener('pointerdown', (e) => {
  unlock();
  const hw = e.target.closest('[data-btn]');
  if (hw) {
    e.preventDefault();
    if (hw.dataset.btn === 'sound') return toggleSound();
    hw.setPointerCapture(e.pointerId);
    return press(hw.dataset.btn, true);
  }
  if (e.target.closest('#screen')) {
    const r = $screen.getBoundingClientRect();
    cart.pointer(((e.clientX - r.left) / r.width) * 240, ((e.clientY - r.top) / r.height) * 160);
  }
});
for (const type of ['pointerup', 'pointercancel']) {
  $gba.addEventListener(type, (e) => {
    const hw = e.target.closest('[data-btn]');
    if (hw && hw.dataset.btn !== 'sound') press(hw.dataset.btn, false);
  });
}

// ---------- layout + background video ----------
function fitBg() {
  if (!bg) return;
  const w0 = bg.videoWidth || 240, h0 = bg.videoHeight || 160;
  const kb = coverScale(w0, h0, innerWidth, innerHeight, devicePixelRatio || 1);
  const w = w0 * kb, h = h0 * kb;
  Object.assign(bg.style, { width: `${w}px`, height: `${h}px`, left: `${Math.floor((innerWidth - w) / 2)}px`, top: `${Math.floor((innerHeight - h) / 2)}px` });
}
function fit() {
  document.documentElement.style.setProperty('--k', fitScale(W, H, innerWidth - 16, innerHeight - 16, devicePixelRatio || 1));
  fitBg();
}
async function startVideo() {
  if (reduced() || navigator.connection?.saveData || innerHeight > innerWidth) return;
  let clips = [];
  try {
    clips = await (await fetch('assets/video/clips.json')).json();
  } catch {
    return;
  }
  if (!clips.length) return;
  const video = Object.assign(document.createElement('video'), { className: 'bg-video', muted: true, playsInline: true });
  const dim = Object.assign(document.createElement('div'), { className: 'bg-dim' });
  let cur = -1;
  const next = () => {
    cur = pickNext(cur, clips.length, Math.random());
    video.src = `assets/video/${clips[cur]}`;
    video.play().catch(() => {});
  };
  video.addEventListener('loadedmetadata', fitBg);
  video.addEventListener('ended', next);
  video.addEventListener('error', () => { video.remove(); dim.remove(); bg = null; });
  document.body.prepend(video, dim);
  bg = video;
  next();
}

// ---------- power on ----------
$gba.insertAdjacentHTML('afterbegin', BODY_SVG);
$gba.insertAdjacentHTML('beforeend', LABELS + CONTROLS);
document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en';
document.body.classList.toggle('sound-on', soundOn);
addEventListener('resize', fit);
fit();
Promise.all([document.fonts.load('16px Gen3'), document.fonts.load('16px "Gen3 Small"')]).finally(() => {
  document.body.classList.add('ready');
  cart.start($screen, api);
});
startVideo();
