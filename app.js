// Pokédex portfolio: rendering, input, intro, options and background video.
import { DATA } from './data.js';
import {
  parseRoute, parent, spritePath, nextIndex, fitScale, coverScale, cycle, pickNext, discPath, rrectPath, TYPES, SHAPES,
} from './logic.js';
import { setEnabled, sfx, cry } from './sound.js';
import { typewrite } from './typewriter.js';

const { trainer: T, projects: P, badges: B, moves: M, contact: C } = DATA;
const COUNTS = { dex: P.length, badges: B.length };
const MENU = ['dex', 'card', 'badges', 'moves', 'contact', 'options'];
const SPEEDS = { slow: 30, mid: 60, fast: 120 };   // characters per second
const OPTIONS = { lang: ['pt', 'en'], sound: [true, false], textSpeed: ['slow', 'mid', 'fast'], frame: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] };
const OPT_KEYS = Object.keys(OPTIONS);
const forceShiny = new URLSearchParams(location.search).has('shiny');
const SHINY = P.map(() => forceShiny || Math.random() < 1 / 16);
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage blocked: just don't remember */ } },
};
const remembered = (k, fallback) => (OPTIONS[k].includes(store.get(k, null)) ? store.get(k, null) : fallback);
const opt = {
  lang: remembered('lang', navigator.language?.toLowerCase().startsWith('pt') ? 'pt' : 'en'),
  sound: remembered('sound', false),
  textSpeed: remembered('textSpeed', 'fast'),
  frame: remembered('frame', 1),
};
const seen = new Set(store.get('seen', []));
const sel = {};
let route = { view: 'intro', i: null };
let renderId = 0;
let opening = 0;
let revealTimer = 0;
let skipTyping = null;
let bg = null;

const $ = (s) => document.querySelector(s);
const $screen = $('#screen'), $panel = $('#panel'), $b = $('#b-btn');

// ---------- text ----------
const t = (k) => DATA.ui[opt.lang][k] ?? DATA.ui[opt.lang === 'pt' ? 'en' : 'pt'][k] ?? k;
const L = (o) => o[opt.lang] || o.pt || o.en;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const pad = (n) => String(n).padStart(3, '0');
const label = (k) => (k === 'card' ? T.name.split(' ')[0] : t('menu_' + k));
const ext = (url) => (url.startsWith('https://') ? ' target="_blank" rel="noopener"' : '');

// ---------- device shell: SVG on the game-pixel grid ----------
const INK = '#401018';
const path = (d, fill, cls = '') => `<path d="${d}" fill="${fill}"${cls && ` class="${cls}"`}/>`;
const line = (d, color) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="2"/>`;
const box = (x, y, w, h, fill, ink = INK) => path(rrectPath(x, y, w, h), ink) + path(rrectPath(x + 2, y + 2, w - 4, h - 4, [1]), fill);
const dot = (x, y, d, fill, cls = '') => {
  const hl = Math.round(d / 4) + 1;
  return path(discPath(x, y, d), INK) + path(discPath(x + 2, y + 2, d - 4), fill, cls) + path(`M${x + hl} ${y + hl}h2v2h-2z`, '#fff8');
};
const svg = (w, h, parts) => `<svg class="shell" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true">${parts.join('')}</svg>`;
const btn = (hw, x, y, w, h, text = '', cls = 'hw') =>
  `<button type="button" class="${cls}" data-hw="${hw}" tabindex="-1" aria-label="${hw}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px">${text}</button>`;

const SHELL_LEFT = svg(296, 320, [
  `<path d="M1 9V5H3V3H5V1H275V3H277V5H279V315H277V317H275V319H5V317H3V315H1Z" fill="#d8283c" stroke="${INK}" stroke-width="2"/>`,
  line('M3 313V7H5V5H7V3H273', '#f86868'),
  line('M277 7V313H275V315H273V317H7', '#982038'),
  line('M2 60H150V58H160V54H170V48H180V40H190V32H200V27H210V24H278', '#982038'),
  box(280, 6, 16, 308, '#b82038'),
  path('M284 10h3v300h-3z', '#f86868'),
  path('M282 40h12v2h-12zM282 278h12v2h-12z', INK),
  dot(10, 8, 36, '#f8f8f8'), dot(16, 14, 24, '#30b8e8', 'glow'),
  dot(54, 8, 10, '#e83030', 'led-talk'), dot(68, 8, 10, '#f8d030'), dot(82, 8, 10, '#78c850', 'led-sound'),
  box(12, 64, 256, 204, '#e0e0e0'),
  path(discPath(126, 68, 4) + discPath(146, 68, 4), '#c03028'),
  dot(26, 244, 16, '#e83030'),
  path('M206 246h44v2h-44zM206 250h44v2h-44zM206 254h44v2h-44zM206 258h44v2h-44z', '#303030'),
  dot(14, 276, 20, '#303030'),
  box(44, 282, 28, 8, '#e83030'), box(80, 282, 28, 8, '#3080c0'),
  box(16, 298, 64, 16, '#78c890'),
  path(rrectPath(182, 272, 16, 40, [1]) + rrectPath(170, 284, 40, 16, [1]), '#101010'),
  path(rrectPath(184, 274, 12, 36, []) + rrectPath(172, 286, 36, 12, []), '#383838'),
  dot(236, 296, 18, '#982038'), dot(254, 280, 18, '#982038'),
]);
const SHELL_LID = svg(280, 320, [
  `<path d="M1 312V28H3V26H5V24H90V26H100V29H108V33H116V38H124V43H132V48H140V52H150V55H160V56H273V58H275V60H277V62H279V306H277V308H275V310H273V312Z" fill="#d8283c" stroke="${INK}" stroke-width="2"/>`,
  line('M3 310V30H5V28H7V26H89', '#f86868'),
  line('M277 64V306H275V308H273V310H3', '#982038'),
  path('M16 34h56v3h-56zM16 42h40v3h-40z', '#982038'),
  box(12, 72, 256, 168, '#0e3b2c', '#06160f'),
]);
const HW_LEFT = [
  btn('up', 182, 272, 16, 14), btn('down', 182, 298, 16, 14), btn('left', 170, 284, 14, 16), btn('right', 196, 284, 14, 16),
  btn('b', 236, 296, 18, 18, 'B', 'hw round'), btn('a', 254, 280, 18, 18, 'A', 'hw round'),
  btn('sound', 14, 276, 20, 20, '', 'hw round'),
].join('');
const HW_LID = ['dex', 'card', 'badges', 'moves', 'contact']
  .map((k, i) => `<a class="hw key" href="#/${k}" data-key="${k}" tabindex="-1" style="left:${16 + i * 50}px;top:246px;width:48px;height:18px"></a>`)
  .join('') + btn('prev', 16, 276, 112, 22, '', 'hw pad') + btn('next', 152, 276, 112, 22, '', 'hw pad');

// ---------- screens ----------
function sprite(dex, { shiny = false, animated = false, alt = '' } = {}) {
  const size = animated ? 96 : 64;
  const main = `<img class="sprite" src="${spritePath(dex, { shiny, animated })}" data-static="${spritePath(dex, { shiny })}" width="${size}" height="${size}" alt="${esc(alt)}">`;
  if (animated || reduced()) return main;
  return `<span class="idle">${main}<img class="f2" src="${spritePath(dex, { shiny, frame2: true })}" width="64" height="64" alt=""></span>`;
}
const projSprite = (i, animated = false) => sprite(P[i].dex, { shiny: SHINY[i], animated, alt: P[i].pokemon + (SHINY[i] ? ' shiny' : '') });
const typeTag = (type) => {
  const i = TYPES.indexOf(type);
  return `<span class="type" role="img" aria-label="${type.toUpperCase()}" style="--tx:${-(i % 4) * 32}px;--ty:${-16 - Math.floor(i / 4) * 16}px"></span>`;
};
const typeTags = (list) => `<span class="types">${list.map(typeTag).join('')}</span>`;
const badge = (b) => `<i class="badge${b ? '' : ' none'}"${b ? ` style="--i:${SHAPES.indexOf(b.shape)}"` : ''}></i>`;
const dexName = (i) => `No.${pad(P[i].dex)} ${P[i].pokemon}`;
const seenCount = () => [...seen].filter((i) => i < P.length).length;
const sparks = (delay) => [[0, 8, 0], [80, 12, 0.15], [8, 76, 0.3], [78, 80, 0.45]]
  .map(([x, y, d]) => `<i class="spark" style="left:${x}px;top:${y}px;animation-delay:${d + delay}s"></i>`).join('');

const badgePanel = (i) => (B[i]
  ? `<h2>${esc(B[i].name)}</h2><p class="dim">${esc(L(B[i].role))} · ${esc(B[i].period)}</p><p>${esc(L(B[i].text))}</p>`
  : `<p>${t('badge_empty')}</p>`);
const movePanel = (i) => (M[i]
  ? `<h2>${esc(M[i].name)}</h2><p class="dim">${typeTag(M[i].type)} ${t('power')} ${M[i].power} · PP ${M[i].pp}/${M[i].pp}</p><p>${esc(L(M[i].text))}</p>`
  : '');
const contactPanel = (i) => (C[i]
  ? `<h2>${esc(C[i].label)}</h2><p class="dim">${esc(C[i].url.replace(/^(https:\/\/|mailto:)/, ''))}</p><p>${t('open_hint')}</p>`
  : '');
const optionPanel = (i) => `<p>${t('help_opt_' + OPT_KEYS[i])}</p>`;
const optValue = (k) => (k === 'frame'
  ? `${t('type_frame')} ${opt.frame}`
  : OPTIONS[k].map((v) => `<span class="${v === opt[k] ? 'on' : ''}">${k === 'lang' ? v.toUpperCase() : k === 'sound' ? t(v ? 'on' : 'off') : t(v)}</span>`).join(' '));

const BOOT = () => `<div class="scr intro boot">
  <div class="stack"><i class="ball"></i><img class="logo" src="assets/ui/logo.png" alt=""></div>
  <p class="flames">${'<i></i>'.repeat(5)}</p>
  <p class="boot-name">${esc(T.name)}</p>
  <i class="flash"></i>
</div>`;

// Each view returns the left screen, the panel and whether the panel text is "typed".
const VIEW = {
  intro: () => ({
    screen: `<div class="scr intro"><p>POKéDEX</p><p class="blink">${t('press_start')}</p></div>`,
    panel: '',
  }),
  menu: () => ({
    screen: `<div class="scr menu">
      <p class="box who">${esc(T.name)}</p>
      <div class="partner">${sprite(T.partner, { animated: true })}</div>
      <ul class="box menu-box">${MENU.map((k, i) => `<li><a href="#/${k}" data-nav data-i="${i}">${esc(label(k))}</a></li>`).join('')}</ul>
    </div>`,
    panel: `<p>${t('help_' + MENU[sel.menu ?? 0])}</p>`,
    typing: true,
  }),
  dex: () => ({
    screen: `<div class="scr dex">
      <header class="bar"><span>POKéDEX</span><span>${t('seen')} ${seenCount()}/${P.length}</span></header>
      <div class="stage" id="dex-stage">${projSprite(sel.dex ?? 0)}</div>
      <p class="box dex-name" id="dex-name">${dexName(sel.dex ?? 0)}</p>
    </div>`,
    panel: `<ul class="list">${P.map((p, i) => `<li><a href="#/dex/${i + 1}" data-nav data-i="${i}"><i class="caught${seen.has(i) ? '' : ' off'}"></i>No.${pad(p.dex)} ${esc(p.pokemon)} <span class="dim">${esc(p.name)}</span></a></li>`).join('')}</ul>`,
    typing: false,
  }),
  entry: ({ first }) => {
    const i = route.i - 1, p = P[i], shiny = SHINY[i];
    const late = first && !reduced() ? 0.6 : 0;
    const links = Object.entries(p.links || {}).map(([k, u]) => `<a href="${esc(u)}"${ext(u)} data-nav>${t(k)}</a>`).join('');
    return {
      screen: `<div class="scr entry">
        <header class="bar"><span>${dexName(i)}</span>${shiny ? '<i class="star"></i>' : ''}</header>
        <div class="stage${late ? ' sil' : ''}">${projSprite(i, true)}${shiny ? sparks(late) : ''}</div>
        <div class="info">${typeTags(p.types)}<p>${t('year')} ${p.year}</p>${shiny ? `<p class="shiny">${t('shiny')}</p>` : ''}</div>
        <p class="box ename">${esc(p.name)}</p>
      </div>`,
      panel: `<h2>${esc(p.name)}</h2><p class="dim">${p.stack.map(esc).join(' · ')}</p><p>${esc(L(p.text))}</p>${links ? `<p class="links">${links}</p>` : ''}`,
      typing: true,
    };
  },
  card: () => ({
    screen: `<div class="scr card"><div class="tcard">
      <p>${t('trainer_card')}</p>
      <dl>
        <dt>${t('id_no')}</dt><dd>${esc(T.id)}</dd>
        <dt>${t('name')}</dt><dd>${esc(T.name)}</dd>
        <dt>POKéDEX</dt><dd>${P.length}</dd>
        <dt>${t('time')}</dt><dd>${new Date().getFullYear() - T.since} ${t('years')}</dd>
      </dl>
      <div class="partner">${sprite(T.partner)}</div>
      <div class="badge-row">${Array.from({ length: 8 }, (_, k) => badge(B[k])).join('')}</div>
    </div></div>`,
    panel: `<h2>${t('about')}</h2><p>${esc(L(T.about))}</p>`,
    typing: true,
  }),
  badges: () => ({
    screen: `<div class="scr badges">
      <header class="bar"><span>${t('menu_badges')}</span><span>${B.length}/8</span></header>
      <div class="case" data-cols="4">${Array.from({ length: 8 }, (_, k) => (B[k]
        ? `<a class="slot" href="#/badges/${k + 1}" data-nav data-i="${k}" aria-label="${esc(B[k].name)}">${badge(B[k])}</a>`
        : '<span class="slot"></span>')).join('')}</div>
      <p class="box badge-name" id="badge-name">${esc(B[sel.badges ?? 0]?.name ?? '')}</p>
    </div>`,
    panel: badgePanel(sel.badges ?? 0),
    typing: true,
  }),
  moves: () => ({
    screen: `<div class="scr moves"><header class="bar"><span>${t('menu_moves')}</span></header>
      <ul class="box list">${M.map((m, i) => `<li><button type="button" data-nav data-i="${i}">${typeTag(m.type)}<span>${esc(m.name)}</span></button></li>`).join('')}</ul>
    </div>`,
    panel: movePanel(sel.moves ?? 0),
    typing: true,
  }),
  contact: () => ({
    screen: `<div class="scr contact"><header class="bar"><span>POKéNAV</span><span>MATCH CALL</span></header>
      <ul class="box list">${C.map((c, i) => `<li><a href="${esc(c.url)}"${ext(c.url)} data-nav data-i="${i}">${esc(c.label)}</a></li>`).join('')}</ul>
    </div>`,
    panel: contactPanel(sel.contact ?? 0),
    typing: true,
  }),
  options: () => ({
    screen: `<div class="scr options"><header class="bar"><span>${t('menu_options')}</span></header>
      <ul class="box list opts">${OPT_KEYS.map((k, i) => `<li><button type="button" data-nav data-i="${i}" data-opt="${k}">${t('opt_' + k)}<b>${optValue(k)}</b></button></li>`).join('')}</ul>
    </div>`,
    panel: optionPanel(sel.options ?? 0),
    typing: true,
  }),
};

// When the cursor lands on an item, update the other half of the device.
const HOOK = {
  menu: (i) => setPanel(`<p>${t('help_' + MENU[i])}</p>`),
  dex: (i) => {
    $('#dex-stage').innerHTML = projSprite(i);
    $('#dex-name').textContent = dexName(i);
  },
  badges: (i) => {
    setPanel(badgePanel(i));
    $('#badge-name').textContent = B[i]?.name ?? '';
  },
  moves: (i) => setPanel(movePanel(i)),
  contact: (i) => setPanel(contactPanel(i)),
  options: (i) => setPanel(optionPanel(i)),
};

// ---------- panel text ----------
function updateMore() {
  $panel.querySelector('.more')?.classList.toggle('on', !skipTyping && $panel.scrollTop + $panel.clientHeight < $panel.scrollHeight - 1);
}
function setPanel(html, typing = true) {
  skipTyping?.();
  $panel.innerHTML = `${html}<i class="more"></i>`;
  $panel.scrollTop = 0;
  if (!typing || !html || reduced()) return updateMore();
  document.body.classList.add('talking');
  skipTyping = typewrite($panel, SPEEDS[opt.textSpeed], () => {
    skipTyping = null;
    document.body.classList.remove('talking');
    updateMore();
  });
}

// ---------- render ----------
function render() {
  renderId++;
  clearTimeout(revealTimer);
  route = parseRoute(location.hash, COUNTS);
  if (route.view === 'menu' && location.hash !== '#/menu') history.replaceState(null, '', '#/menu');
  let first = false;
  if (route.view === 'entry') {
    sel.dex = route.i - 1;
    first = !seen.has(route.i - 1);
    seen.add(route.i - 1);
    store.set('seen', [...seen]);
  }
  if (route.view === 'badges' && route.i) sel.badges = route.i - 1;

  document.body.classList.toggle('closed', route.view === 'intro');
  document.documentElement.lang = opt.lang === 'pt' ? 'pt-BR' : 'en';
  const v = VIEW[route.view]({ first });
  $screen.innerHTML = v.screen;
  $b.hidden = !parent(route);
  $b.setAttribute('aria-label', t('back'));
  document.querySelectorAll('[data-key]').forEach((el) => { el.textContent = label(el.dataset.key); });
  $('[data-hw="prev"]').textContent = t('prev');
  $('[data-hw="next"]').textContent = t('next');

  if (route.view === 'entry') return showEntry(first, v.panel);
  setPanel(v.panel, v.typing);
  const items = [...document.querySelectorAll('[data-nav]')];
  (items[sel[route.view] ?? 0] || items[0])?.focus();
}
const go = () => (document.startViewTransition ? document.startViewTransition(render) : render());

// First visit: silhouette, then colors + "registered" + cry. Later visits: page sound + cry.
function showEntry(first, html) {
  const p = P[route.i - 1], shiny = SHINY[route.i - 1];
  const reg = `<p>${esc(t('registered').replace('{name}', p.pokemon))}</p>`;
  if (!first || reduced()) {
    sfx('dex_page');
    cry(p.dex, 0.15);
    if (shiny) sfx('shiny', 0.8);
    return setPanel(first ? reg + html : html);
  }
  skipTyping?.();
  $panel.innerHTML = '';
  const id = renderId;
  revealTimer = setTimeout(() => {
    if (id !== renderId) return;
    $screen.querySelector('.stage')?.classList.remove('sil');
    sfx('success');
    cry(p.dex, 0.6);
    if (shiny) sfx('shiny', 1.3);
    setPanel(reg + html);
  }, 600);
}

// ---------- actions ----------
function open() {
  if (opening) return finish();
  sfx('pc_on');
  if (reduced()) return finish();
  document.body.classList.add('anim');
  document.body.classList.remove('closed');
  $screen.innerHTML = BOOT();
  opening = setTimeout(() => {
    sfx('win_open');
    opening = setTimeout(finish, 600);
  }, 1200);
}
function finish() {
  clearTimeout(opening);
  opening = 0;
  location.hash = '#/menu';
}
function back() {
  const p = parent(route);
  if (p) {
    sfx('select');
    location.hash = p;
  }
}
function pressA() {
  const el = document.activeElement;
  if (el?.matches('[data-nav]')) return el.click();
  if (route.view === 'entry' || route.view === 'card') dir(0, 1);
}
function move(dx, dy) {
  const el = document.activeElement;
  if (dx && el?.dataset.opt) return setOpt(el.dataset.opt, dx);
  const items = [...document.querySelectorAll('[data-nav]')];
  if (!items.length) return;
  const cols = Number(items[0].closest('[data-cols]')?.dataset.cols) || 1;
  const cur = items.indexOf(el);
  const next = nextIndex(cur, items.length, cols, dx, dy);
  if (next !== cur) {
    items[next].focus();
    sfx(route.view === 'dex' ? 'dex_scroll' : 'select');
  }
}
// Previous/next project on an entry; otherwise just move the cursor.
function step(d) {
  if (route.view !== 'entry') return move(0, d);
  const n = route.i + d;
  if (n >= 1 && n <= COUNTS.dex) location.hash = `#/dex/${n}`;
}
// Arrows / d-pad. On reading screens up/down scroll the panel a page.
function dir(dx, dy) {
  if (route.view === 'entry' && dx) return step(dx);
  if (route.view === 'entry' || route.view === 'card') return $panel.scrollBy({ top: dy * $panel.clientHeight * 0.75 });
  move(dx, dy);
}
function applyOpts() {
  document.documentElement.style.setProperty('--frame', `url(assets/ui/frame-${opt.frame}.png)`);
  document.body.classList.toggle('sound-on', opt.sound);
}
function setOpt(k, d = 1) {
  opt[k] = cycle(OPTIONS[k], opt[k], d);
  store.set(k, opt[k]);
  applyOpts();
  if (k === 'sound') setEnabled(opt.sound);
  sfx('select');
  if (route.view === 'options') render();
}
function press(name) {
  const el = document.querySelector(`[data-hw="${name}"]`);
  if (!el) return;
  el.classList.add('pressed');
  setTimeout(() => el.classList.remove('pressed'), 120);
}
const HW = {
  up: () => dir(0, -1), down: () => dir(0, 1), left: () => dir(-1, 0), right: () => dir(1, 0),
  a: pressA, b: back, prev: () => step(-1), next: () => step(1), sound: () => setOpt('sound'),
};
const KEY_HW = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', z: 'a', Z: 'a', Enter: 'a', x: 'b', X: 'b', Escape: 'b', Backspace: 'b' };

// ---------- layout + background video ----------
function fitBg() {
  if (!bg) return;
  const w0 = bg.videoWidth || 240, h0 = bg.videoHeight || 160;
  const kb = coverScale(w0, h0, innerWidth, innerHeight, devicePixelRatio || 1);
  const w = w0 * kb, h = h0 * kb;
  Object.assign(bg.style, { width: `${w}px`, height: `${h}px`, left: `${Math.floor((innerWidth - w) / 2)}px`, top: `${Math.floor((innerHeight - h) / 2)}px` });
}
function fit() {
  const dpr = devicePixelRatio || 1;
  const vw = innerWidth, vh = innerHeight;
  const k = fitScale(576, 320, vw - 32, vh - 32, dpr);
  const ds = vh > vw || k < 2;
  document.body.classList.toggle('ds', ds);
  const ks = vh >= vw ? fitScale(240, 160, vw - 32, vh * 0.45, dpr) : fitScale(240, 160, vw / 2 - 32, vh - 32, dpr);
  document.documentElement.style.setProperty('--k', ds ? ks : k);
  fitBg();
}
async function startVideo() {
  if (document.body.classList.contains('ds') || reduced() || navigator.connection?.saveData) return;
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

// ---------- wiring ----------
$('#base').insertAdjacentHTML('afterbegin', SHELL_LEFT + HW_LEFT);
$('#lid').insertAdjacentHTML('afterbegin', SHELL_LID + HW_LID);
$panel.addEventListener('scroll', updateMore);

// The first gesture unlocks audio (capture phase, so it runs before the handlers below).
const unlock = () => setEnabled(opt.sound);
document.addEventListener('keydown', unlock, { once: true, capture: true });
document.addEventListener('pointerdown', unlock, { once: true, capture: true });

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (route.view === 'intro') {
    if (e.key !== 'Tab') { e.preventDefault(); open(); }
    return;
  }
  if (KEY_HW[e.key]) press(KEY_HW[e.key]);
  if (skipTyping && ['z', 'Z', 'Enter', ' '].includes(e.key)) { e.preventDefault(); return skipTyping(); }
  const d = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[e.key];
  if (d) { e.preventDefault(); return dir(...d); }
  if (e.key === 'z' || e.key === 'Z') return pressA();
  if (['x', 'X', 'Escape', 'Backspace'].includes(e.key)) { e.preventDefault(); back(); }
});
document.addEventListener('click', (e) => {
  if (route.view === 'intro') { e.preventDefault(); return open(); }
  if (skipTyping && e.target.closest('#panel')) { e.preventDefault(); return skipTyping(); }
  const hw = e.target.closest('[data-hw]');
  if (hw) { e.preventDefault(); return HW[hw.dataset.hw](); }
  const o = e.target.closest('[data-opt]');
  if (o) return setOpt(o.dataset.opt);
  if (e.target.closest('[data-nav], .key')) sfx('select');
});
// Hardware buttons must not steal focus from the cursor.
document.addEventListener('mousedown', (e) => { if (e.target.closest('.hw')) e.preventDefault(); });
document.addEventListener('pointerover', (e) => {
  const el = e.pointerType === 'mouse' && e.target.closest('[data-nav]');
  if (el && el !== document.activeElement) el.focus({ preventScroll: true });
});
document.addEventListener('focusin', (e) => {
  const el = e.target.closest('[data-i]');
  if (!el) return;
  sel[route.view] = Number(el.dataset.i);
  HOOK[route.view]?.(sel[route.view]);
});
// Animated GIF missing -> static PNG -> "?". A missing second frame just goes away.
document.addEventListener('error', (e) => {
  const img = e.target;
  if (img.tagName !== 'IMG') return;
  if (img.classList.contains('f2')) return img.remove();
  if (img.dataset.static && img.src.endsWith('.gif')) { img.src = img.dataset.static; return; }
  img.outerHTML = '<span class="missing">?</span>';
}, true);
addEventListener('hashchange', go);
addEventListener('resize', fit);

applyOpts();
fit();
render();
Promise.all([document.fonts.load('16px Gen3'), document.fonts.load('16px "Gen3 Small"')])
  .finally(() => document.body.classList.add('ready'));
startVideo();
