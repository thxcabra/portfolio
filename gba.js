// The console: a GBA body around the 240x160 screen, integer scaling, the buttons (keyboard,
// mouse, touch), the sound switch and the page background. Games are cartridges: they get the
// screen and the buttons and know nothing about scaling or input devices.
import { DATA } from './data.js';
import { fitScale, coverScale, pickNext, discPath, rrectPath } from './logic.js';
import { setEnabled, sfx, cry } from './sound.js';
import cart from './carts/center/index.js';

const W = 352, H = 208;
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
const GRILL = Array.from({ length: 16 }, (_, i) => `M${318 + (i % 4) * 8} ${150 + Math.floor(i / 4) * 8}h4v4h-4z`).join('');
const BODY_SVG = `<svg class="body" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true">
  <g class="g-l">${box(16, 0, 72, 12, LO, INK)}</g><g class="g-r">${box(264, 0, 72, 12, LO, INK)}</g>
  ${box(0, 4, W, H - 4, BODY, INK, [6, 3, 2, 1, 1])}
  ${path('M8 8h336v2h-336z', HI)}${path('M8 202h336v2h-336z', LO)}
  ${box(44, 8, 264, 180, '#2c2c34', KEY_INK, [3, 1, 1])}
  ${path('M54 12h244v164h-244z', KEY_INK)}
  ${path(discPath(14, 20, 6), '#78f878')}
  <g class="g-dpad">${path(rrectPath(19, 82, 14, 36, [1]) + rrectPath(8, 93, 36, 14, [1]), KEY_INK)}${path(rrectPath(21, 84, 10, 32, []) + rrectPath(10, 95, 32, 10, []), KEY)}</g>
  <g class="g-a">${disc(326, 78, 20, '#c8c8d0', KEY_INK)}</g><g class="g-b">${disc(310, 104, 20, '#c8c8d0', KEY_INK)}</g>
  <g class="g-select">${box(126, 190, 24, 8, KEY, KEY_INK, [1])}</g><g class="g-start">${box(202, 190, 24, 8, KEY, KEY_INK, [1])}</g>
  ${path(discPath(324, 138, 6), '#2a3a2a', 'led-sound')}
  ${path(GRILL, LO)}
</svg>`;
const btn = (name, x, y, w, h, text = '', cls = 'hw') =>
  `<button type="button" class="${cls}" data-btn="${name}" tabindex="-1" aria-label="${name}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px">${text}</button>`;
const CONTROLS = [
  btn('up', 19, 82, 14, 12), btn('down', 19, 106, 14, 12), btn('left', 8, 93, 12, 14), btn('right', 32, 93, 12, 14),
  btn('a', 326, 78, 20, 20, 'A', 'hw round'), btn('b', 310, 104, 20, 20, 'B', 'hw round'),
  btn('select', 122, 186, 32, 16), btn('start', 198, 186, 32, 16),
  btn('l', 16, 0, 72, 12), btn('r', 264, 0, 72, 12),
  btn('sound', 314, 132, 34, 48),
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
