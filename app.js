// Pokédex portfolio: routing, rendering, input and sound.
import { DATA } from './data.js';

export const TYPES = ['normal', 'fire', 'water', 'grass', 'electric', 'ice', 'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel'];
export const SHAPES = ['boulder', 'cascade', 'thunder', 'rainbow', 'soul', 'marsh', 'volcano', 'earth'];
const VIEWS = ['menu', 'dex', 'card', 'badges', 'moves', 'contact', 'options'];

// '#/dex/3' -> { view: 'entry', i: 3 }. Anything invalid falls back to the menu.
export function parseRoute(hash, counts) {
  const [, view = '', n] = (hash || '').replace(/^#/, '').split('/');
  const i = n ? Number(n) : null;
  const inRange = (max) => Number.isInteger(i) && i >= 1 && i <= max;
  const menu = { view: 'menu', i: null };
  if (!view) return { view: 'intro', i: null };
  if (view === 'dex' && i !== null) return inRange(counts.dex) ? { view: 'entry', i } : menu;
  if (view === 'badges' && i !== null) return inRange(counts.badges) ? { view: 'badges', i } : menu;
  if (n !== undefined || !VIEWS.includes(view)) return menu;
  return { view, i: null };
}

// Where B goes from each screen.
export function parent({ view }) {
  if (view === 'entry') return '#/dex';
  return view === 'intro' || view === 'menu' ? null : '#/menu';
}

export function spritePath(dex, { shiny = false, animated = false } = {}) {
  const s = shiny ? 'shiny/' : '';
  if (animated) return `assets/sprites/emerald/animated/${s}${dex}.gif`;
  return `assets/sprites/${dex <= 151 ? 'firered-leafgreen' : 'emerald'}/${s}${dex}.png`;
}

// Cursor movement in a list (cols = 1) or grid. Out of range = stay put.
export function nextIndex(cur, len, cols, dx, dy) {
  if (cur < 0) return 0;
  const n = cur + (dy ? dy * cols : dx);
  return n < 0 || n >= len ? cur : n;
}

// CSS px per game pixel, kept integer in physical pixels so pixels stay sharp.
export function fitScale(w, h, W, H, dpr) {
  return Math.max(1, Math.floor(Math.min((W * dpr) / w, (H * dpr) / h))) / dpr;
}

// Pixel-art circle as SVG path, one 1px-tall span per row. d must be even.
export function discPath(x, y, d) {
  const r = d / 2;
  let p = '';
  for (let row = 0; row < d; row++) {
    const half = Math.round(Math.sqrt(Math.max(0, r * r - (row + 0.5 - r) ** 2)));
    if (half) p += `M${x + r - half} ${y + row}h${2 * half}v1h${-2 * half}z`;
  }
  return p;
}

// Rectangle with stepped corners: ins[k] = how far row k (from top and bottom) is pulled in.
export function rrectPath(x, y, w, h, ins = [2, 1]) {
  let p = '';
  ins.forEach((k, row) => {
    p += `M${x + k} ${y + row}h${w - 2 * k}v1h${2 * k - w}z`;
    p += `M${x + k} ${y + h - 1 - row}h${w - 2 * k}v1h${2 * k - w}z`;
  });
  return p + `M${x} ${y + ins.length}h${w}v${h - 2 * ins.length}h${-w}z`;
}

if (typeof document !== 'undefined') boot();

function boot() {
  const { trainer: T, projects: P, badges: B, moves: M, contact: C } = DATA;
  const COUNTS = { dex: P.length, badges: B.length };
  const MENU = ['dex', 'card', 'badges', 'moves', 'contact', 'options'];
  const forceShiny = new URLSearchParams(location.search).has('shiny');
  const SHINY = P.map(() => forceShiny || Math.random() < 1 / 16);
  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage blocked: just don't remember */ } },
  };
  const saved = store.get('lang', null);
  let lang = saved === 'pt' || saved === 'en' ? saved : navigator.language?.toLowerCase().startsWith('pt') ? 'pt' : 'en';
  let soundOn = store.get('sound', false);
  const seen = new Set(store.get('seen', []));
  const sel = {};
  let route = { view: 'intro', i: null };
  let opening = 0;
  let audio;

  const $ = (s) => document.querySelector(s);
  const $screen = $('#screen'), $panel = $('#panel'), $b = $('#b-btn');

  // ---------- text ----------
  const t = (k) => DATA.ui[lang][k] ?? DATA.ui[lang === 'pt' ? 'en' : 'pt'][k] ?? k;
  const L = (o) => o[lang] || o.pt || o.en;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const pad = (n) => String(n).padStart(3, '0');
  const label = (k) => (k === 'card' ? T.name.split(' ')[0] : t('menu_' + k));
  const ext = (url) => (url.startsWith('https://') ? ' target="_blank" rel="noopener"' : '');

  // ---------- sound: square-wave beeps, GBA style ----------
  const NOTES = {
    move: [[880, 0.04]],
    select: [[660, 0.05], [990, 0.07]],
    back: [[660, 0.05], [440, 0.07]],
    open: [[523, 0.06], [659, 0.06], [784, 0.06], [1047, 0.12]],
    shiny: [[1568, 0.05], [2093, 0.05], [1568, 0.05], [2637, 0.12]],
  };
  function sfx(name) {
    if (!soundOn) return;
    try {
      audio ||= new AudioContext();
      let at = audio.currentTime;
      for (const [freq, dur] of NOTES[name]) {
        const osc = audio.createOscillator(), gain = audio.createGain();
        osc.type = 'square';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.05, at);
        gain.gain.exponentialRampToValueAtTime(0.001, at + dur);
        osc.connect(gain).connect(audio.destination);
        osc.start(at);
        osc.stop(at + dur);
        at += dur;
      }
    } catch { /* audio blocked: stay silent */ }
  }

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
    dot(54, 8, 10, '#e83030', 'blink'), dot(68, 8, 10, '#f8d030'), dot(82, 8, 10, '#78c850'),
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
  ].join('');
  const HW_LID = ['dex', 'card', 'badges', 'moves', 'contact']
    .map((k, i) => `<a class="hw key" href="#/${k}" data-key="${k}" tabindex="-1" style="left:${16 + i * 50}px;top:246px;width:48px;height:18px"></a>`)
    .join('') + btn('prev', 16, 276, 112, 22, '', 'hw pad') + btn('next', 152, 276, 112, 22, '', 'hw pad');

  // ---------- screens ----------
  function sprite(dex, { shiny = false, animated = false, alt = '' } = {}) {
    const size = animated ? 96 : 64;
    return `<img class="sprite" src="${spritePath(dex, { shiny, animated })}" data-static="${spritePath(dex, { shiny })}" width="${size}" height="${size}" alt="${esc(alt)}">`;
  }
  const projSprite = (i, animated = false) => sprite(P[i].dex, { shiny: SHINY[i], animated, alt: P[i].pokemon + (SHINY[i] ? ' shiny' : '') });
  const typeTags = (list) => `<span class="types">${list.map((x) => `<span class="type" style="--c:var(--t-${x})">${x.toUpperCase()}</span>`).join('')}</span>`;
  const dexName = (i) => `No.${pad(P[i].dex)} ${P[i].pokemon}`;
  const seenCount = () => [...seen].filter((i) => i < P.length).length;
  const SPARKS = [[6, 10, 0], [84, 14, 0.15], [12, 80, 0.3], [86, 82, 0.45]]
    .map(([x, y, d]) => `<i class="spark" style="left:${x}px;top:${y}px;animation-delay:${d}s"></i>`).join('');

  const badgePanel = (i) => (B[i]
    ? `<h2>${esc(B[i].name)}</h2><p class="dim">${esc(L(B[i].role))} · ${esc(B[i].period)}</p><p>${esc(L(B[i].text))}</p>`
    : `<p>${t('badge_empty')}</p>`);
  const movePanel = (i) => (M[i]
    ? `<h2>${esc(M[i].name)}</h2><p class="dim">${t('type')}/${M[i].type.toUpperCase()} · ${t('power')} ${M[i].power} · PP ${M[i].pp}/${M[i].pp}</p><p>${esc(L(M[i].text))}</p>`
    : '');
  const contactPanel = (i) => (C[i]
    ? `<h2>${esc(C[i].label)}</h2><p class="dim">${esc(C[i].url.replace(/^(https:\/\/|mailto:)/, ''))}</p><p>${t('open_hint')}</p>`
    : '');
  const optionPanel = (i) => `<p>${t(i ? 'help_sound' : 'help_language')}</p>`;

  const VIEW = {
    intro: () => ({
      screen: `<div class="scr intro"><p class="logo">POKéDEX</p><p class="blink">${t('press_start')}</p></div>`,
      panel: '',
    }),
    menu: () => ({
      screen: `<div class="scr menu">
        <p class="box who">${esc(T.name)}</p>
        <div class="partner">${sprite(T.partner, { animated: true })}</div>
        <ul class="box menu-box">${MENU.map((k, i) => `<li><a href="#/${k}" data-nav data-i="${i}">${esc(label(k))}</a></li>`).join('')}</ul>
      </div>`,
      panel: `<p id="help">${t('help_' + MENU[sel.menu ?? 0])}</p>`,
    }),
    dex: () => ({
      screen: `<div class="scr dex">
        <header class="bar"><span>POKéDEX</span><span>${t('seen')} ${seenCount()}/${P.length}</span></header>
        <div class="stage" id="dex-stage">${projSprite(sel.dex ?? 0)}</div>
        <p class="box dex-name" id="dex-name">${dexName(sel.dex ?? 0)}</p>
      </div>`,
      panel: `<ul class="list">${P.map((p, i) => `<li><a href="#/dex/${i + 1}" data-nav data-i="${i}"><i class="ball${seen.has(i) ? '' : ' off'}"></i>No.${pad(p.dex)} ${esc(p.pokemon)} <span class="dim">${esc(p.name)}</span></a></li>`).join('')}</ul>`,
    }),
    entry: () => {
      const i = route.i - 1, p = P[i], shiny = SHINY[i];
      const links = Object.entries(p.links || {}).map(([k, u]) => `<a href="${esc(u)}"${ext(u)} data-nav>${t(k)}</a>`).join('');
      return {
        screen: `<div class="scr entry">
          <header class="bar"><span>${dexName(i)}</span>${shiny ? '<i class="star"></i>' : ''}</header>
          <div class="stage">${projSprite(i, true)}${shiny ? SPARKS : ''}</div>
          <div class="info">${typeTags(p.types)}<p>${t('year')} ${p.year}</p>${shiny ? `<p class="shiny">${t('shiny')}</p>` : ''}</div>
          <p class="box ename">${esc(p.name)}</p>
        </div>`,
        panel: `<h2>${esc(p.name)}</h2><p class="dim">${p.stack.map(esc).join(' · ')}</p><p>${esc(L(p.text))}</p>${links ? `<p class="links">${links}</p>` : ''}`,
      };
    },
    card: () => ({
      screen: `<div class="scr card"><div class="tcard">
        <header>${t('trainer_card')}</header>
        <dl>
          <dt>${t('id_no')}</dt><dd>${esc(T.id)}</dd>
          <dt>${t('name')}</dt><dd>${esc(T.name)}</dd>
          <dt>POKéDEX</dt><dd>${P.length}</dd>
          <dt>${t('time')}</dt><dd>${new Date().getFullYear() - T.since} ${t('years')}</dd>
        </dl>
        <div class="partner">${sprite(T.partner)}</div>
        <div class="badge-row">${Array.from({ length: 8 }, (_, k) => `<i class="badge ${B[k] ? 'b-' + B[k].shape : 'none'}"></i>`).join('')}</div>
      </div></div>`,
      panel: `<h2>${t('about')}</h2><p>${esc(L(T.about))}</p>`,
    }),
    badges: () => ({
      screen: `<div class="scr badges">
        <header class="bar"><span>${t('menu_badges')}</span><span>${B.length}/8</span></header>
        <div class="case" data-cols="4">${Array.from({ length: 8 }, (_, k) => (B[k]
          ? `<a class="slot" href="#/badges/${k + 1}" data-nav data-i="${k}" aria-label="${esc(B[k].name)}"><i class="badge b-${B[k].shape}"></i></a>`
          : '<span class="slot"></span>')).join('')}</div>
        <p class="box badge-name" id="badge-name">${esc(B[sel.badges ?? 0]?.name ?? '')}</p>
      </div>`,
      panel: badgePanel(sel.badges ?? 0),
    }),
    moves: () => ({
      screen: `<div class="scr moves"><header class="bar"><span>${t('menu_moves')}</span></header>
        <ul class="box list">${M.map((m, i) => `<li><button type="button" data-nav data-i="${i}">${typeTags([m.type])}<span>${esc(m.name)}</span></button></li>`).join('')}</ul>
      </div>`,
      panel: movePanel(sel.moves ?? 0),
    }),
    contact: () => ({
      screen: `<div class="scr contact"><header class="bar"><span>POKéNAV</span><span>MATCH CALL</span></header>
        <ul class="box list">${C.map((c, i) => `<li><a href="${esc(c.url)}"${ext(c.url)} data-nav data-i="${i}">${esc(c.label)}</a></li>`).join('')}</ul>
      </div>`,
      panel: contactPanel(sel.contact ?? 0),
    }),
    options: () => ({
      screen: `<div class="scr options"><header class="bar"><span>${t('menu_options')}</span></header>
        <ul class="box list opts">
          <li><button type="button" data-nav data-i="0" data-opt="lang">${t('language')}<b><span class="${lang === 'pt' ? 'on' : ''}">PT</span> <span class="${lang === 'en' ? 'on' : ''}">EN</span></b></button></li>
          <li><button type="button" data-nav data-i="1" data-opt="sound">${t('sound')}<b><span class="${soundOn ? 'on' : ''}">${t('on')}</span> <span class="${soundOn ? '' : 'on'}">${t('off')}</span></b></button></li>
        </ul>
      </div>`,
      panel: optionPanel(sel.options ?? 0),
    }),
  };

  // When the cursor lands on an item, update the other half of the device.
  const HOOK = {
    menu: (i) => { $('#help').textContent = t('help_' + MENU[i]); },
    dex: (i) => { $('#dex-stage').innerHTML = projSprite(i); $('#dex-name').textContent = dexName(i); },
    badges: (i) => { $panel.innerHTML = badgePanel(i); $('#badge-name').textContent = B[i]?.name ?? ''; },
    moves: (i) => { $panel.innerHTML = movePanel(i); },
    contact: (i) => { $panel.innerHTML = contactPanel(i); },
    options: (i) => { $panel.innerHTML = optionPanel(i); },
  };

  // ---------- render ----------
  function render() {
    route = parseRoute(location.hash, COUNTS);
    if (route.view === 'menu' && location.hash !== '#/menu') history.replaceState(null, '', '#/menu');
    if (route.view === 'entry') {
      sel.dex = route.i - 1;
      seen.add(route.i - 1);
      store.set('seen', [...seen]);
    }
    if (route.view === 'badges' && route.i) sel.badges = route.i - 1;

    document.body.classList.toggle('closed', route.view === 'intro');
    document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en';
    const v = VIEW[route.view]();
    $screen.innerHTML = v.screen;
    $panel.innerHTML = v.panel;
    $panel.scrollTop = 0;
    $b.hidden = !parent(route);
    $b.setAttribute('aria-label', t('back'));
    document.querySelectorAll('[data-key]').forEach((el) => { el.textContent = label(el.dataset.key); });
    $('[data-hw="prev"]').textContent = t('prev');
    $('[data-hw="next"]').textContent = t('next');

    if (route.view !== 'entry') {
      const items = [...document.querySelectorAll('[data-nav]')];
      (items[sel[route.view] ?? 0] || items[0])?.focus();
    }
    if (route.view === 'entry' && SHINY[route.i - 1]) sfx('shiny');
  }
  const go = () => (document.startViewTransition ? document.startViewTransition(render) : render());

  // ---------- actions ----------
  function open() {
    if (opening) return finish();
    sfx('open');
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return finish();
    document.body.classList.add('anim');
    document.body.classList.remove('closed');
    $screen.innerHTML = `<div class="scr intro"><p>${esc(T.name)}</p><p class="load"><i></i></p></div>`;
    opening = setTimeout(finish, 1100);
  }
  function finish() {
    clearTimeout(opening);
    opening = 0;
    location.hash = '#/menu';
  }
  function back() {
    const p = parent(route);
    if (p) { sfx('back'); location.hash = p; }
  }
  function pressA() {
    const el = document.activeElement;
    if (el?.matches('[data-nav]')) el.click();
  }
  function move(dx, dy) {
    const el = document.activeElement;
    if (dx && el?.dataset.opt) return el.click();
    const items = [...document.querySelectorAll('[data-nav]')];
    if (!items.length) return;
    const cols = Number(items[0].closest('[data-cols]')?.dataset.cols) || 1;
    const cur = items.indexOf(el);
    const next = nextIndex(cur, items.length, cols, dx, dy);
    if (next !== cur) { items[next].focus(); sfx('move'); }
  }
  // Previous/next project on an entry; otherwise just move the cursor.
  function step(d) {
    if (route.view !== 'entry') return move(0, d);
    const n = route.i + d;
    if (n >= 1 && n <= COUNTS.dex) { sfx('move'); location.hash = `#/dex/${n}`; }
  }
  // Arrows / d-pad. On reading screens up/down scroll the panel.
  function dir(dx, dy) {
    if (route.view === 'entry' && dx) return step(dx);
    if (route.view === 'entry' || route.view === 'card') return $panel.scrollBy({ top: dy * 40 });
    move(dx, dy);
  }
  function toggleOpt(opt) {
    if (opt === 'lang') {
      lang = lang === 'pt' ? 'en' : 'pt';
      store.set('lang', lang);
    } else {
      soundOn = !soundOn;
      store.set('sound', soundOn);
      sfx('select');
    }
    render();
  }
  const HW = {
    up: () => dir(0, -1), down: () => dir(0, 1), left: () => dir(-1, 0), right: () => dir(1, 0),
    a: pressA, b: back, prev: () => step(-1), next: () => step(1),
  };

  // ---------- layout ----------
  function fit() {
    const dpr = devicePixelRatio || 1;
    const vw = innerWidth, vh = innerHeight;
    const k = fitScale(576, 320, vw - 32, vh - 32, dpr);
    const ds = vh > vw || k < 2;
    document.body.classList.toggle('ds', ds);
    const ks = vh >= vw ? fitScale(240, 160, vw - 32, vh * 0.45, dpr) : fitScale(240, 160, vw / 2 - 32, vh - 32, dpr);
    document.documentElement.style.setProperty('--k', ds ? ks : k);
  }

  // ---------- wiring ----------
  $('#base').insertAdjacentHTML('afterbegin', SHELL_LEFT + HW_LEFT);
  $('#lid').insertAdjacentHTML('afterbegin', SHELL_LID + HW_LID);

  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (route.view === 'intro') {
      if (e.key !== 'Tab') { e.preventDefault(); open(); }
      return;
    }
    const d = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[e.key];
    if (d) { e.preventDefault(); return dir(...d); }
    if (e.key === 'z' || e.key === 'Z') return pressA();
    if (['x', 'X', 'Escape', 'Backspace'].includes(e.key)) { e.preventDefault(); back(); }
  });
  document.addEventListener('click', (e) => {
    if (route.view === 'intro') { e.preventDefault(); return open(); }
    const hw = e.target.closest('[data-hw]');
    if (hw) { e.preventDefault(); return HW[hw.dataset.hw](); }
    if (e.target.closest('[data-nav], .key')) sfx('select');
    const opt = e.target.closest('[data-opt]');
    if (opt) toggleOpt(opt.dataset.opt);
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
  // Animated GIF missing -> static PNG -> "?".
  document.addEventListener('error', (e) => {
    const img = e.target;
    if (img.tagName !== 'IMG') return;
    if (img.dataset.static && img.src.endsWith('.gif')) { img.src = img.dataset.static; return; }
    img.outerHTML = '<span class="missing">?</span>';
  }, true);
  addEventListener('hashchange', go);
  addEventListener('resize', fit);

  fit();
  render();
  document.body.classList.add('ready');
}
