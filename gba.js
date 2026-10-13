// The console: a GBA body around the 240x160 screen, integer scaling, the buttons (keyboard,
// mouse, touch), the sound switch and the page background. Games are cartridges: they get the
// screen and the buttons and know nothing about scaling or input devices.
import { DATA } from './data.js';
import { fitScale, centerBox, discPath, rrectPath, corner, TEXT_SPEEDS } from './logic.js';
import { setVolume, sfx, cry } from './sound.js';
import cart from './carts/center/index.js';
import { startKanto } from './kanto.js';
import { createSimple } from './simple.js';

const KEYS = {
  ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
  w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right',
  z: 'a', Z: 'a', ' ': 'a', Enter: 'a', x: 'b', X: 'b', Backspace: 'b', Escape: 'start', Shift: 'select',
  q: 'l', Q: 'l', e: 'r', E: 'r',
};
const DPAD = new Set(['up', 'down', 'left', 'right']);

const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage blocked: just don't remember */ } },
};
const saved = store.get('lang', null);
let lang = saved === 'pt' || saved === 'en' ? saved : navigator.language?.toLowerCase().startsWith('pt') ? 'pt' : 'en';
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
let volume = store.get('volume', store.get('sound', false) === true ? 2 : 0);   // 0–3; old saves had sound: true
let lastVolume = volume || 2;
let kanto = null;   // the page background, once it has loaded

const $gba = document.getElementById('gba'), $screen = document.getElementById('screen');
const t = (k) => DATA.ui[lang][k] ?? DATA.ui.pt[k] ?? k;
const api = {
  sfx, cry, store, reduced, t,
  talk: (k) => DATA.talk[lang][k] ?? DATA.talk.pt[k] ?? [k],
  cps: () => TEXT_SPEEDS[store.get('textSpeed', 'fast')] ?? TEXT_SPEEDS.fast,
  lang: () => lang,
  setLang(l) {
    if (l !== 'pt' && l !== 'en') return;
    lang = l;
    store.set('lang', l);
    document.documentElement.lang = l === 'pt' ? 'pt-BR' : 'en';
    mount(true);   // the SOUND label on the body
  },
  volume(n) {
    if (n !== undefined) setLevel(n);
    return volume;
  },
  // The open screen goes to the address bar (#/contato) without adding history entries.
  link: (path) => history.replaceState(null, '', path ? `#/${path}` : location.pathname + location.search),
  show: (media, i = 0) => show.open(media, i),
};

// ---------- full-size pictures, over the whole page (api.show) ----------
// media = [{ src, alt }]. While it is up the buttons are its own: ←/→ switch, B or START close; a
// click or tap outside the picture closes it too. The window frame is the one chosen in OPÇÕES.
const show = (() => {
  const el = document.createElement('div');
  el.className = 'show';
  el.hidden = true;
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.innerHTML = '<p class="show-bar"><button type="button" class="show-step back" aria-label="◀">▶</button><span class="show-count"></span>'
    + '<button type="button" class="show-step" aria-label="▶">▶</button><span class="show-hint"></span></p><div class="show-box"></div>';
  const img = el.querySelector('.show-box').appendChild(new Image()), count = el.querySelector('.show-count'), hint = el.querySelector('.show-hint');
  let list = [], cur = 0;
  const draw = () => {
    img.src = list[cur].src;
    img.alt = list[cur].alt ?? '';
    count.textContent = `${cur + 1}/${list.length}`;
    el.querySelectorAll('.show-step').forEach((b) => { b.hidden = list.length < 2; });
    hint.textContent = t('show_close');
    el.querySelector('.show-box').style.borderImageSource = `url(assets/ui/frame-${store.get('frame', 1)}.png)`;
  };
  const close = () => {
    el.hidden = true;
    sfx('select');
  };
  const step = (d) => {
    cur = (cur + d + list.length) % list.length;
    sfx('select');
    draw();
    el.scrollTop = 0;
  };
  el.addEventListener('pointerdown', (e) => {
    const arrow = e.target.closest('.show-step');
    if (e.button === 0 && arrow) return step(arrow.classList.contains('back') ? -1 : 1);
    if (e.button === 2 || (e.button === 0 && !e.target.closest('.show-box'))) {
      e.preventDefault();
      close();
    }
  });
  el.addEventListener('contextmenu', (e) => e.preventDefault());
  document.body.append(el);
  return {
    get up() { return !el.hidden; },
    open(media, i) {
      if (!media.length) return;
      list = media;
      cur = Math.max(0, Math.min(i, media.length - 1));
      draw();
      el.hidden = false;
      el.scrollTop = 0;
    },
    button(name) {
      const d = name === 'left' ? -1 : name === 'right' ? 1 : 0;
      if (d && list.length > 1) step(d);
      else if (name === 'b' || name === 'start') close();
    },
  };
})();

// ---------- the simple view (#/simples): the same content as a page to scroll ----------
const simple = createSimple({ data: DATA, lang: () => lang, setLang: (l) => api.setLang(l), t, store, show: (m, i) => show.open(m, i), onClose: () => closeSimple() });
function openSimple() {
  [...held].forEach((n) => press(n, false));
  history.replaceState(null, '', '#/simples');
  simple.open();
}
function closeSimple() {
  simple.close();
  history.replaceState(null, '', location.pathname + location.search);
}

// ---------- body: two shells on the game-pixel grid, geometric, no logos ----------
// Landscape: the original GBA. Portrait (phones): an opened GBA SP, screen on top, buttons below.
const INK = '#221c4f', BODY = '#5a52b4', HI = '#7c75d4', LO = '#463e9c', PALE = '#c9c5e6';
const KEY = '#d4d1ea', KEY_LO = '#a5a0cb', KEY_INK = '#2a2552', BEZEL = '#2a2a33', BEZEL_INK = '#141418';
const path = (d, fill, cls = '') => `<path d="${d}" fill="${fill}"${cls && ` class="${cls}"`}/>`;
const box = (x, y, w, h, fill, ink, r) => path(rrectPath(x, y, w, h, corner(r)), ink) + path(rrectPath(x + 2, y + 2, w - 4, h - 4, corner(r - 2)), fill);
const disc = (x, y, d, fill, ink) => path(discPath(x, y, d), ink) + path(discPath(x + 2, y + 2, d - 4), fill);
const round = (x, y, d) => path(discPath(x, y, d), KEY_INK) + path(discPath(x + 2, y + 2, d - 4), KEY_LO) + path(discPath(x + 3, y + 2, d - 6), KEY);
function dpad(x, y, size, arm) {
  const o = (size - arm) / 2;
  const cross = (i) => rrectPath(x + o + i, y + i, arm - 2 * i, size - 2 * i, []) + rrectPath(x + i, y + o + i, size - 2 * i, arm - 2 * i, []);
  return path(cross(0), KEY_INK) + path(cross(2), KEY) + path(discPath(x + size / 2 - 3, y + size / 2 - 3, 6), KEY_LO);
}
const led = (x, y, cls = '') => path(discPath(x, y, 4), cls ? '#2a3a2a' : '#78f878', cls);
const btn = (name, x, y, w, h, text = '', cls = 'hw') =>
  `<button type="button" class="${cls}" data-btn="${name}" tabindex="-1" aria-label="${name}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px">${text}</button>`;
// Labels use a 14px line box: the small font's capitals then sit on rows top+4..top+10.
const label = (text, x, y, w, align = 'center') => `<p class="label" style="left:${x}px;top:${y}px;width:${w}px;text-align:${align}">${text}</p>`;

const SHELLS = {
  gba: {
    W: 432, H: 202, screen: [96, 18],
    svg: [
      // L/R: a slightly bigger corner behind the body's, so they wrap the top corners
      `<g class="g-l">${box(0, 0, 112, 120, PALE, INK, 48)}</g><g class="g-r">${box(320, 0, 112, 120, PALE, INK, 48)}</g>`,
      box(0, 6, 432, 196, BODY, INK, 44),
      path('M44 9h344v1h-344z', HI), path('M44 198h344v1h-344z', LO),
      box(84, 10, 264, 186, BEZEL, BEZEL_INK, 8),
      path('M94 16h244v164h-244z', '#101014'),
      `<g class="g-dpad">${dpad(22, 54, 40, 14)}</g>`,
      `<g class="g-start">${disc(58, 122, 8, KEY, KEY_INK)}</g><g class="g-select">${disc(58, 140, 8, KEY, KEY_INK)}</g>`,
      `<g class="g-simple">${disc(58, 158, 8, KEY, KEY_INK)}</g>`,
      `<g class="g-a">${round(393, 59, 22)}</g><g class="g-b">${round(367, 73, 22)}</g>`,
      led(360, 26, 'led-power'),
      path(Array.from({ length: 6 }, (_, i) => Array.from({ length: 14 }, (_, t) => `M${366 + 7 * i + t} ${156 - t}h2v1h-2z`).join('')).join(''), LO),
      led(362, 168, 'led-sound'),
    ].join(''),
    labels: () => label(DATA.trainer.name, 96, 179, 240) + label('START', 14, 119, 40, 'right') + label('SELECT', 14, 137, 40, 'right') + label(t('simple_label'), 4, 155, 50, 'right') +
      label('POWER', 368, 21, 40, 'left') + label(t('opt_sound'), 370, 163, 40, 'left'),
    controls: [
      btn('up', 32, 50, 20, 18), btn('down', 32, 80, 20, 18), btn('left', 18, 64, 18, 20), btn('right', 48, 64, 18, 20),
      btn('start', 12, 118, 58, 18), btn('select', 12, 136, 58, 18),
      btn('a', 391, 57, 26, 26, 'A', 'hw round'), btn('b', 365, 71, 26, 26, 'B', 'hw round'),
      btn('l', 0, 0, 88, 16), btn('r', 344, 0, 88, 16),
      btn('sound', 356, 110, 66, 72), btn('simple', 8, 154, 62, 18),
    ],
  },
  sp: {
    W: 256, H: 320, screen: [8, 12],
    svg: [
      box(0, 0, 256, 198, BODY, INK, 10),
      path('M12 3h232v1h-232z', HI),
      box(4, 4, 248, 188, BEZEL, BEZEL_INK, 6),
      box(0, 202, 256, 118, BODY, INK, 12),
      box(14, 192, 228, 14, LO, INK, 4),   // hinge
      `<g class="g-dpad">${dpad(32, 230, 44, 16)}</g>`,
      `<g class="g-a">${round(204, 226, 28)}</g><g class="g-b">${round(170, 244, 28)}</g>`,
      `<g class="g-select">${disc(105, 285, 10, KEY, KEY_INK)}</g><g class="g-start">${disc(141, 285, 10, KEY, KEY_INK)}</g><g class="g-simple">${disc(205, 285, 10, KEY, KEY_INK)}</g>`,
      path(Array.from({ length: 12 }, (_, i) => `M${22 + (i % 4) * 7} ${280 + Math.floor(i / 4) * 6}h3v3h-3z`).join(''), LO),
      led(234, 212, 'led-power'),
      led(16, 307, 'led-sound'),
    ].join(''),
    labels: () => label(DATA.trainer.name, 8, 174, 240) + label('SELECT', 90, 297, 40) + label('START', 126, 297, 40) + label(t('simple_label'), 186, 297, 48) + label(t('opt_sound'), 22, 302, 30, 'left'),
    controls: [
      btn('up', 40, 220, 28, 26), btn('down', 40, 258, 28, 26), btn('left', 20, 240, 26, 28), btn('right', 62, 240, 26, 28),
      btn('a', 200, 222, 36, 36, 'A', 'hw round'), btn('b', 166, 240, 36, 36, 'B', 'hw round'),
      btn('select', 92, 280, 36, 34), btn('start', 128, 280, 36, 34), btn('simple', 186, 278, 48, 34),
      btn('sound', 10, 274, 54, 44),
    ],
  },
};

// ---------- buttons ----------
const held = new Set();
function press(name, down) {
  if (down === held.has(name)) return;
  if (down) held.add(name);
  else held.delete(name);
  if (DPAD.has(name)) $gba.classList.toggle('p-dpad', [...held].some((n) => DPAD.has(n)));
  else $gba.classList.toggle(`p-${name}`, down);
  if (show.up) return down && show.button(name);
  cart.button(name, down);
}
let unlocked = false;
function unlock() {
  if (unlocked) return;
  unlocked = true;
  setVolume(volume);   // browsers only allow audio after a gesture
}
function setLevel(n) {
  if (n) lastVolume = n;
  volume = n;
  store.set('volume', n);
  setVolume(n);
  document.body.classList.toggle('sound-on', n > 0);
}
// The SOUND button on the body: off, or back to the last level.
function toggleSound() {
  setLevel(volume ? 0 : lastVolume);
  sfx('select');
}

addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (simple.up && !show.up) {
    if (e.key === 'Escape') closeSimple();
    return;   // the page scrolls with the keys
  }
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
  if (e.button === 2) {   // right mouse button = B, held while pressed (B held = run, like the game)
    e.preventDefault();
    return press('b', true);
  }
  if (e.button !== 0) return;
  const hw = e.target.closest('[data-btn]');
  if (hw) {
    e.preventDefault();
    if (hw.dataset.btn === 'sound') return toggleSound();
    if (hw.dataset.btn === 'simple') return openSimple();
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
addEventListener('pointerup', (e) => { if (e.button === 2) press('b', false); });
$gba.addEventListener('contextmenu', (e) => e.preventDefault());   // the right button is B here

// ---------- layout ----------
let shell = null;
function mount(force = false) {
  const next = SHELLS[innerHeight > innerWidth ? 'sp' : 'gba'];
  if (next === shell && !force) return;
  [...held].forEach((n) => press(n, false));
  shell = next;
  $gba.querySelectorAll('.body, .label, .hw').forEach((el) => el.remove());
  Object.assign($gba.style, { width: `${shell.W}px`, height: `${shell.H}px` });
  Object.assign($screen.style, { left: `${shell.screen[0]}px`, top: `${shell.screen[1]}px` });
  shell.box = centerBox(shell.W, shell.H, ...shell.screen);
  const b = shell.box;
  $gba.style.margin = `${b.top}px ${b.right}px ${b.bottom}px ${b.left}px`;   // zoomed with the GBA
  $gba.insertAdjacentHTML('afterbegin', `<svg class="body" viewBox="0 0 ${shell.W} ${shell.H}" width="${shell.W}" height="${shell.H}" aria-hidden="true">${shell.svg}</svg>`);
  $gba.insertAdjacentHTML('beforeend', shell.labels() + shell.controls.join(''));
}
function fit() {
  mount();
  document.documentElement.style.setProperty('--k', fitScale(shell.box.w, shell.box.h, innerWidth - 16, innerHeight - 16, devicePixelRatio || 1));
  kanto?.fit();
}
// ---------- power on ----------
document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en';
document.body.classList.toggle('sound-on', volume > 0);
addEventListener('resize', fit);
fit();
const pathOf = () => location.hash.replace(/^#\/?/, '');
Promise.all([document.fonts.load('16px Gen3'), document.fonts.load('16px "Gen3 Small"')]).finally(() => {
  document.body.classList.add('ready');
  // The power switch: the LED lights up, then the cartridge starts.
  setTimeout(() => {
    document.body.classList.add('powered');
    cart.start($screen, api);
    const go = () => {
      if (pathOf() === 'simples') return simple.open();
      if (simple.up) simple.close();
      if (pathOf()) cart.open(pathOf());
    };
    go();
    addEventListener('hashchange', go);
  }, reduced() ? 0 : 400);
});
startKanto({ reduced }).then((k) => { kanto = k; }).catch(() => {});   // no background: the plain page colour stays
