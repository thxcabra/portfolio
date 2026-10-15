// The landing page (lp.html): one vertical page made from data.js, in the GBA's two languages. A cartoon
// world on an old tape: João's goat, a PS1-style VHS in 3D (scene3d.js), a film grain over everything, and
// secrets for whoever digs (the Konami code, Morse in the footer LED, a goat that peeks now and then, and
// the door to his ARG at #/sinal).
import { DATA } from '../data.js';
import { siteAnchor, repoOf, esc, skillCheck, morse, konami, KONAMI } from '../logic.js';
import { mountVhs } from './scene3d.js';

export const PLAY_URL = './';   // the GBA; 'jogar' once the landing page takes the main address
const SITE = DATA.site;
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage blocked */ } },
};
const saved = store.get('lang', null);
let lang = saved === 'pt' || saved === 'en' ? saved : navigator.language?.toLowerCase().startsWith('pt') ? 'pt' : 'en';
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const L = (o) => (typeof o === 'string' || Array.isArray(o) ? o : o?.[lang] ?? o?.pt ?? '');
const T = (k, vars = {}) => String(SITE.ui[lang][k] ?? SITE.ui.pt[k] ?? k).replace(/\{(\w+)\}/g, (_, v) => vars[v] ?? '');
let gh = {};
let cleanup = [];

// The game's types in the page's colours (the rest are paper): chips, and the skills' "attributes".
const TYPE_COLOR = {
  fire: 'orange', electric: 'orange', fighting: 'orange', ground: 'orange', rock: 'orange',
  grass: 'green', bug: 'green', water: 'green', flying: 'green', ice: 'green',
  psychic: 'purple', dragon: 'purple', ghost: 'purple', poison: 'purple', dark: 'purple',
};
const techColor = (name) => TYPE_COLOR[DATA.moves.find((m) => m.name === name)?.type ?? DATA.tech[name]] ?? 'paper';
const TILTS = [-2.5, 1.5, -1, 2.5, -1.5, 1, -2];
const tilt = (i) => TILTS[i % TILTS.length];
const MATERIALS = ['paper', 'orange', 'purple', 'green'];
const ext = (url) => (url.startsWith('http') ? ' target="_blank" rel="noopener"' : '');

// Icons: one drawn set, 24-unit grid, 2px round strokes.
const ICONS = {
  play: '<path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/>',
  out: '<path d="M7 17 17 7M9 7h8v8"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  left: '<path d="M15 5l-7 7 7 7"/>',
  right: '<path d="M9 5l7 7-7 7"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
};
const icon = (name) => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`;

// The line boil of hand-drawn cartoons: three displacement maps the drawings cycle through (site.css).
const boilDefs = () => `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>${[3, 11, 23].map((seed, i) => `
  <filter id="boil-${i}"><feTurbulence type="fractalNoise" baseFrequency=".022" numOctaves="2" seed="${seed}"/><feDisplacementMap in="SourceGraphic" scale="4" xChannelSelector="R" yChannelSelector="G"/></filter>`).join('')}
</defs></svg>`;

const UNDERLINES = [
  'M4 14 C 60 4, 120 18, 180 9 S 270 6, 296 12',
  'M6 8 C 70 16, 150 2, 220 12 L 294 6',
  'M4 12 Q 40 2, 80 12 T 160 12 T 240 12 T 296 10',
  'M8 6 C 90 18, 200 18, 292 4 M 40 16 C 120 12, 200 14, 260 12',
];
const heading = (k, title, lead = '') => `<header class="sec-head">
  <h2 class="display">${esc(title)}</h2>
  <svg class="stroke under" viewBox="0 0 300 20" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="${UNDERLINES[k % UNDERLINES.length]}"/></svg>
  ${lead ? `<p class="lead">${esc(lead)}</p>` : ''}</header>`;

function top() {
  const links = [['projetos', 'projects'], ['coisas', 'art'], ['sobre', 'about'], ['experiencia', 'work'], ['habilidades', 'skills'], ...(SITE.games.length ? [['jogos', 'games']] : []), ['contato', 'contact']];
  return `<a class="skip" href="#projetos">${T('skip')}</a>
  <header class="top">
    <a class="mark" href="#topo" aria-label="${esc(DATA.trainer.name)}"><img src="assets/site/goat-pixel.png" alt="" width="45" height="75"><span>CABRAL</span></a>
    <nav aria-label="${T('nav')}">
      <button class="menu-btn" type="button" aria-expanded="false" aria-controls="nav-links">${icon('menu')}<span>${T('menu')}</span></button>
      <ul id="nav-links">${links.map(([id, k]) => `<li><a href="#${id}">${T(k)}</a></li>`).join('')}</ul>
    </nav>
    <button class="lang" type="button" aria-label="${T('lang_name')}">${T('lang')}</button>
    <a class="btn btn-orange play" href="${PLAY_URL}">${icon('play')}${T('play')}</a>
  </header>`;
}

function hero() {
  const t = DATA.trainer;
  return `<section class="hero field-purple" id="topo">
    <div class="hero-text">
      <h1 class="display"><span class="hello">${esc(T('hello'))}</span> <span class="name">${esc(t.name)}.</span></h1>
      <p class="call">${esc(T('call'))}</p>
      <p class="role">${esc(L(t.role))}</p>
      <p class="ctas">
        <a class="btn btn-orange" href="${PLAY_URL}">${icon('play')}${T('play_long')}</a>
        <a class="btn btn-line" href="#contato">${T('talk')}</a>
      </p>
      <p class="play-note">${esc(T('play_note'))}</p>
    </div>
    <div class="stage">
      <i class="cel" aria-hidden="true"></i>
      <img class="goat boil" src="assets/site/goat-ink.png" alt="${esc(T('goat'))}" width="376" height="551">
      <div class="vhs" data-3d aria-hidden="true"></div>
      <a class="gba-shot tape" href="${PLAY_URL}"><img src="assets/og.png" alt="${esc(T('play_long'))}" width="1200" height="630"><span class="vt" aria-hidden="true">${icon('play')}${esc(T('play').toUpperCase())}</span></a>
    </div>
  </section>`;
}

function repoData(g) {
  const total = Object.values(g.languages).reduce((a, b) => a + b, 0) || 1;
  const top3 = Object.entries(g.languages).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const rest = total - top3.reduce((a, [, b]) => a + b, 0);
  return `<div class="repo-data">
    <p class="langbar" aria-hidden="true">${[...top3, ...(rest > 0 ? [['', rest]] : [])].map(([, b], k) => `<i class="l${k}" style="flex:${b}"></i>`).join('')}</p>
    <p class="vt">${top3.map(([l, b]) => `${esc(l)} ${Math.round((100 * b) / total)}%`).join(' · ')}</p>
  </div>`;
}

// k: the place on the page; i: the place in data.js, which the links (#/projetos/3) keep using.
function project(i, k) {
  const p = DATA.projects[i], g = gh[repoOf(p.links.repo)];
  const links = [p.links.repo && [p.links.repo, T('code')], p.links.live && [p.links.live, T('live')]].filter(Boolean);
  return `<article class="project m-${MATERIALS[k % MATERIALS.length]}" id="projeto-${i + 1}" style="--r:${tilt(k)}deg;--i:${k}">
    <button class="shot tape${k % 2 ? ' tape-o' : ''}" type="button" data-project="${i}" aria-label="${esc(T('shots', { name: p.name }))}">
      <img src="${esc(p.shots[0])}" alt="" loading="lazy">${p.shots.length > 1 ? `<span class="shot-count vt">+${p.shots.length - 1}</span>` : ''}
    </button>
    <h3 class="display">${esc(p.name)}</h3>
    <p class="meta vt">${esc(L(p.kind))} · ${p.year}</p>
    <p class="pitch">${esc(L(p.pitch))}</p>
    <p class="text">${esc(L(p.text))}</p>
    <ul class="chips">${p.stack.map((s) => `<li class="chip c-${techColor(s)}">${esc(s)}</li>`).join('')}</ul>
    ${g ? repoData(g) : ''}
    <p class="links">${links.map(([url, label]) => `<a href="${esc(url)}"${ext(url)}>${label}${icon('out')}</a>`).join('')}</p>
  </article>`;
}

const projects = () => `<section class="projects" id="projetos">
  ${heading(0, T('projects'), T('projects_lead'))}
  <div class="project-grid">${SITE.order.map(project).join('')}</div>
</section>`;

// João's own drawings, pixel art and 3D, as a pinned-up collage.
const art = () => `<section class="art field-green" id="coisas">
  ${heading(1, T('art'), T('art_lead'))}
  <ul class="art-wall">${SITE.art.map((a, k) => `<li class="piece piece-${a.kind}" style="--r:${tilt(k + 1)}deg">
    <figure><span class="frame"><img src="${esc(a.src)}" alt="${esc(L(a.caption))}" width="${a.w}" height="${a.h}" loading="lazy"${a.kind === 'ink' ? ' class="boil"' : ''}></span>
    <figcaption>${esc(L(a.caption))}</figcaption></figure></li>`).join('')}</ul>
</section>`;

function about() {
  const t = DATA.trainer;
  const list = (title, items) => `<div class="card"><h3 class="display">${esc(title)}</h3><ul>${items.map((s) => `<li>${s}</li>`).join('')}</ul></div>`;
  return `<section class="about field-orange" id="sobre">
    ${heading(2, T('about'))}
    <div class="about-grid">
      <div class="about-text">${L(SITE.about).map((p) => `<p>${esc(p)}</p>`).join('')}
        <ul class="facts vt"><li>${esc(t.location)}</li><li>${esc(L(t.languages))}</li><li>${esc(T('since', { year: t.since }))}</li></ul>
      </div>
      <div class="side">
        ${list(T('playing'), SITE.now.playing.map(esc))}
        ${list(T('listening'), SITE.now.listening.map(esc))}
        ${list(T('favorites'), SITE.favorites.map((f) => `<b>${esc(f.name)}</b> ${esc(L(f.why))}`))}
      </div>
    </div>
  </section>`;
}

function work() {
  const stub = (period, title, sub, text, i) => `<li class="stub" style="--r:${tilt(i) / 2}deg">
    <h3 class="display">${esc(title)}</h3>${sub ? `<p class="role">${esc(sub)}</p>` : ''}<p class="period vt">${esc(period)}</p>${text ? `<p>${esc(text)}</p>` : ''}</li>`;
  return `<section class="work" id="experiencia">
    ${heading(3, T('work'))}
    <div class="timeline">
      <svg class="stroke line" viewBox="0 0 10 100" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M5 0 V100"/></svg>
      <ol class="jobs">${DATA.badges.map((b, i) => stub(L(b.period), b.name, L(b.role), L(b.text), i + 2)).join('')}</ol>
    </div>
    <h3 class="sub display">${T('school')}</h3>
    <ol class="school">${DATA.education.map((e, i) => stub(L(e.period), e.name, L(e.course), '', i + 4)).join('')}</ol>
  </section>`;
}

// Skills as Disco Elysium skill checks: SKILL [Difficulty: Success] – what it is. The skill's colour is its
// "attribute", from the game's type.
function skills() {
  const techs = [...new Set(DATA.projects.flatMap((p) => p.stack))];
  return `<section class="skills" id="habilidades">
    ${heading(0, T('skills'), T('skills_lead'))}
    <div class="de">
      <figure class="de-portrait" aria-hidden="true"><span class="inv"><img class="boil" src="assets/site/goat-ink.png" alt="" width="376" height="551"></span></figure>
      <ol class="de-log">${DATA.moves.map((m) => `<li style="--c:var(--${({ purple: 'violet' })[TYPE_COLOR[m.type]] ?? TYPE_COLOR[m.type] ?? 'paper'})">
        <span class="de-skill">${esc(m.name)}</span> <span class="de-check">[${T(skillCheck(m.power))}: ${T('success')}]</span> – ${esc(L(m.text))} <span class="de-years">${T('years', { n: m.years })}.</span>
      </li>`).join('')}</ol>
    </div>
    <ul class="cloud" aria-label="${T('stack')}">${techs.map((s, i) => `<li class="chip c-${techColor(s)}" style="--r:${tilt(i) * 2.5}deg;--y:${tilt(i + 3) * 2}px">${esc(s)}</li>`).join('')}</ul>
  </section>`;
}

function games() {
  if (!SITE.games.length) return '';
  return `<section class="games" id="jogos">
    ${heading(1, T('games'))}
    <div class="game-grid">${SITE.games.map((g, i) => `<article class="game card" style="--r:${tilt(i)}deg">
      <img src="${esc(g.media)}" alt="" loading="lazy"><h3 class="display">${esc(g.name)}</h3><p>${esc(L(g.text))}</p>
      ${g.link ? `<p class="links"><a href="${esc(g.link)}"${ext(g.link)}>${T('live')}${icon('out')}</a></p>` : ''}
    </article>`).join('')}</div>
  </section>`;
}

const contact = () => `<section class="contact field-green" id="contato">
  <div class="contact-text">
    <h2 class="display">${esc(T('contact_title'))}</h2>
    <p class="lead">${esc(L(SITE.looking))}</p>
    <ul class="contact-links">${DATA.contact.map((c) => `<li><a class="big" href="${esc(c.url)}"${ext(c.url)}>
      <span class="display">${esc(c.label)}</span><span class="vt">${esc(c.url.replace(/^(mailto:|https?:\/\/(www\.)?)/, '').replace(/\/$/, ''))}</span>${icon('out')}</a></li>`).join('')}</ul>
  </div>
  <img class="waving" src="assets/site/goat-pixel.png" alt="" width="45" height="75">
</section>`;

const footer = () => `<footer class="foot">
  <a class="btn btn-orange" href="${PLAY_URL}">${icon('play')}${T('play_long')}</a>
  <p>${esc(T('footer'))}</p>
  <p><a href="https://github.com/thxcabra/portfolio" target="_blank" rel="noopener">${T('source')}${icon('out')}</a></p>
  <i class="led" aria-hidden="true"></i>
</footer>`;

const viewer = () => `<dialog class="viewer">
  <p class="v-bar"><span class="v-count vt"></span><button class="v-close" type="button">${T('close')}${icon('close')}</button></p>
  <figure class="v-pic"></figure>
  <p class="v-nav"><button class="v-prev" type="button" aria-label="${T('prev')}">${icon('left')}</button><button class="v-next" type="button" aria-label="${T('next')}">${icon('right')}</button></p>
</dialog>`;

// ---------- the pictures of a project, in a <dialog> ----------
let shots = { p: null, k: 0 };
function showShot(k) {
  const d = document.querySelector('.viewer'), p = shots.p;
  shots.k = (k + p.shots.length) % p.shots.length;
  d.querySelector('.v-pic').innerHTML = `<img src="${esc(p.shots[shots.k])}" alt="${esc(`${p.name}, ${T('shot_of', { i: shots.k + 1, n: p.shots.length })}`)}">`;
  d.querySelector('.v-count').textContent = `${p.name} · ${T('shot_of', { i: shots.k + 1, n: p.shots.length })}`;
  d.querySelector('.v-nav').hidden = p.shots.length < 2;
}

// ---------- the film over everything: a grain texture made once, moved in steps by the CSS ----------
function grain() {
  const c = document.createElement('canvas');
  c.width = c.height = 160;
  const g = c.getContext('2d'), img = g.createImageData(160, 160);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random() * 255;
    img.data.set([v, v, v, 34], i);
  }
  g.putImageData(img, 0, 0);
  const el = document.createElement('div');
  el.className = 'film';
  el.setAttribute('aria-hidden', 'true');
  document.documentElement.style.setProperty('--grain', `url(${c.toDataURL()})`);   // the weak signal's static uses it too
  document.body.append(el);
}

// ---------- secrets ----------
// A broadcast cut (the Konami code) or the weak signal of the ARG's door (#/sinal): fullscreen, any key,
// click or Esc closes it.
function overlay(kind) {
  if (document.querySelector('.signal')) return;
  const el = document.createElement('div');
  el.className = `signal signal-${kind}`;
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.tabIndex = -1;
  el.innerHTML = kind === 'lost'
    ? `<div class="bars" aria-hidden="true"></div><div class="signal-text vt"><p class="signal-title">${T('lost_title')}</p><p>${esc(T('lost_text'))}</p><p class="small">${esc(T('lost_back'))}</p></div>`
    : `<div class="static" aria-hidden="true"></div><div class="signal-text vt"><p class="signal-title">${T('weak_title')}</p><p>${esc(T('weak_text'))}</p></div>`;
  el.setAttribute('aria-label', kind === 'lost' ? T('lost_title') : T('weak_title'));
  document.body.append(el);
  el.focus();
  if (kind === 'lost') beep();
  const close = () => {
    el.remove();
    removeEventListener('keydown', onKey, true);
    if (kind === 'weak' && location.hash === '#/sinal') history.replaceState(null, '', location.pathname + location.search);
  };
  const onKey = (e) => { e.preventDefault(); e.stopPropagation(); close(); };
  setTimeout(() => addEventListener('keydown', onKey, true), 300);   // the last key of the code doesn't close it
  el.addEventListener('click', close);
}

// The test-card tone: a short 1 kHz beep, only after a key press (the browser allows sound then).
function beep() {
  if (reduced()) return;
  try {
    const ctx = new AudioContext(), osc = ctx.createOscillator(), vol = ctx.createGain();
    osc.frequency.value = 1000;
    vol.gain.value = 0.05;
    osc.connect(vol).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
    osc.onended = () => ctx.close();
  } catch { /* no sound */ }
}

// The footer LED blinks CABRA in Morse.
function blinkMorse() {
  const led = document.querySelector('.led');
  if (!led || reduced()) return;
  const steps = morse('CABRA');
  let i = 0, timer = 0;
  const next = () => {
    const [lit, units] = steps[i];
    led.classList.toggle('on', lit);
    i = (i + 1) % steps.length;
    timer = setTimeout(next, units * 180);
  };
  next();
  cleanup.push(() => clearTimeout(timer));
}

// Now and then (1 visit in 16, or ?bode), the pixel goat peeks from the bottom edge and waves; it is the
// way into the ARG's door.
function peek() {
  if (!(new URLSearchParams(location.search).has('bode') || Math.random() < 1 / 16)) return;
  const b = document.createElement('button');
  b.className = 'peek';
  b.type = 'button';
  b.setAttribute('aria-label', T('peek'));
  b.innerHTML = '<img src="assets/site/goat-pixel.png" alt="" width="45" height="75">';
  b.addEventListener('click', () => { location.hash = '#/sinal'; b.remove(); });
  document.body.append(b);
}

// ---------- the page ----------
function goToHash(smooth) {
  if (location.hash === '#/sinal') return overlay('weak');
  const id = siteAnchor(location.hash, DATA.projects.length);
  const el = id && document.getElementById(id);
  if (!el) return;
  if (location.hash !== `#${id}`) history.replaceState(null, '', `#${id}`);
  el.scrollIntoView({ behavior: smooth && !reduced() ? 'smooth' : 'auto', block: 'start' });
}

// The project pieces lean towards a fine pointer.
function tiltCards() {
  if (reduced() || !matchMedia('(pointer: fine)').matches) return;
  document.querySelectorAll('.project').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--ry', `${((e.clientX - r.left) / r.width - 0.5) * 8}deg`);
      el.style.setProperty('--rx', `${(0.5 - (e.clientY - r.top) / r.height) * 8}deg`);
    });
    el.addEventListener('pointerleave', () => { el.style.removeProperty('--rx'); el.style.removeProperty('--ry'); });
  });
}

function render() {
  cleanup.forEach((f) => f());
  cleanup = [];
  document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en';
  document.body.innerHTML = boilDefs() + top() + `<main>${hero()}${projects()}${art()}${about()}${work()}${skills()}${games()}${contact()}</main>` + footer() + viewer();
  grain();
  tiltCards();
  blinkMorse();
  const vhs = document.querySelector('[data-3d]');
  if (vhs) cleanup.push(mountVhs(vhs, { reduced: reduced(), label: T('tape') }));
}

addEventListener('click', (e) => {
  const t = e.target;
  if (t.closest('.top .lang')) {
    lang = lang === 'pt' ? 'en' : 'pt';
    store.set('lang', lang);
    const y = scrollY;
    render();
    scrollTo(0, y);
    document.querySelector('.top .lang').focus();
    return;
  }
  const menu = t.closest('.menu-btn');
  if (menu) {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open));
    menu.closest('nav').classList.toggle('open', open);
    return;
  }
  if (t.closest('nav a')) {
    document.querySelector('nav').classList.remove('open');
    document.querySelector('.menu-btn').setAttribute('aria-expanded', 'false');
  }
  const shot = t.closest('[data-project]');
  if (shot) {
    shots = { p: DATA.projects[Number(shot.dataset.project)], k: 0 };
    showShot(0);
    document.querySelector('.viewer').showModal();
    return;
  }
  const d = document.querySelector('.viewer');
  if (t.closest('.v-close') || t === d) d.close();
  else if (t.closest('.v-prev')) showShot(shots.k - 1);
  else if (t.closest('.v-next')) showShot(shots.k + 1);
});
let code = 0;
addEventListener('keydown', (e) => {
  if (document.querySelector('.viewer')?.open) {
    if (e.key === 'ArrowLeft') showShot(shots.k - 1);
    if (e.key === 'ArrowRight') showShot(shots.k + 1);
    return;
  }
  if (e.target.closest?.('input, textarea')) return;
  code = konami(code, e.key);
  if (code === KONAMI.length) {
    code = 0;
    overlay('lost');
  }
});
addEventListener('hashchange', () => goToHash(true));

gh = await fetch('assets/site/github.json').then((r) => (r.ok ? r.json() : {})).catch(() => ({}));
render();
goToHash(false);
peek();
console.log(`%c${T('hint')}`, 'font: 14px monospace; color: #ff6a1f');
