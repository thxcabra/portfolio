// The landing page (lp.html): one vertical page made from data.js, in the GBA's two languages. Sections
// are HTML strings; after each render the code card types, the project pieces lean, and the cast
// (cast.js) and the 3D piece (scene3d.js) are mounted again.
import { DATA } from '../data.js';
import { siteAnchor, repoOf, esc, SHAPES } from '../logic.js';
import { typewrite } from '../typewriter.js';
import { mountCast, defs } from './cast.js';
import { mount3d } from './scene3d.js';

export const PLAY_URL = './';   // the GBA; 'jogar' once the landing page takes the main address
const SITE = DATA.site;
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage blocked */ } },
};
const saved = store.get('lang', null);
let lang = saved === 'pt' || saved === 'en' ? saved : navigator.language?.toLowerCase().startsWith('pt') ? 'pt' : 'en';
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const L = (o) => (typeof o === 'string' ? o : o?.[lang] ?? o?.pt ?? '');
const U = () => SITE.ui[lang];
const T = (k, vars = {}) => String(U()[k] ?? SITE.ui.pt[k] ?? k).replace(/\{(\w+)\}/g, (_, v) => vars[v] ?? '');
let gh = {};
let cleanup = [];

// The game's types, in the page's three colours (the rest are paper).
const TYPE_COLOR = {
  fire: 'orange', electric: 'orange', fighting: 'orange', ground: 'orange', rock: 'orange',
  grass: 'green', bug: 'green', water: 'green', flying: 'green', ice: 'green',
  psychic: 'purple', dragon: 'purple', ghost: 'purple', poison: 'purple', dark: 'purple',
};
const techColor = (name) => TYPE_COLOR[DATA.moves.find((m) => m.name === name)?.type ?? DATA.tech[name]] ?? 'paper';
const TILTS = [-2.5, 1.5, -1, 2.5, -1.5, 1, -2];
const tilt = (i) => TILTS[i % TILTS.length];
const MATERIALS = ['paper', 'purple', 'data', 'green', 'paper', 'orange', 'data'];
const ext = (url) => (url.startsWith('http') ? ' target="_blank" rel="noopener"' : '');

// Icons: one drawn set, 24-unit grid, 2px round strokes.
const ICONS = {
  play: '<path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/>',
  out: '<path d="M7 17 17 7M9 7h8v8"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  left: '<path d="M15 5l-7 7 7 7"/>',
  right: '<path d="M9 5l7 7-7 7"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  star: '<path d="M12 3l2.4 6.1 6.6.4-5.1 4.1 1.7 6.4L12 16.4 6.4 20l1.7-6.4L3 9.5l6.6-.4z" fill="currentColor"/>',
};
const icon = (name) => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`;

// Hand-drawn strokes (drawn in as they scroll in): a different underline under each heading.
const UNDERLINES = [
  'M4 14 C 60 4, 120 18, 180 9 S 270 6, 296 12',
  'M6 8 C 70 16, 150 2, 220 12 L 294 6',
  'M4 12 Q 40 2, 80 12 T 160 12 T 240 12 T 296 10',
  'M8 6 C 90 18, 200 18, 292 4 M 40 16 C 120 12, 200 14, 260 12',
];
const underline = (k) => `<svg class="stroke under" viewBox="0 0 300 20" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="${UNDERLINES[k % UNDERLINES.length]}"/></svg>`;
const heading = (k, title, lead = '') => `<header class="sec-head">
  <h2 class="display">${esc(title)}</h2>${underline(k)}
  ${lead ? `<p class="lead">${esc(lead)}</p>` : ''}</header>`;
const drawings = (a, b) => SITE.media.drawings.slice(a, b).map((src) => `<img class="drawing" src="${esc(src)}" alt="" aria-hidden="true">`).join('');
const photo = (cls) => (SITE.media.photo ? `<img class="photo ${cls}" src="${esc(SITE.media.photo)}" alt="${esc(DATA.trainer.name)}">` : '');

function top() {
  const links = [['projetos', 'projects'], ['sobre', 'about'], ['experiencia', 'work'], ['habilidades', 'skills'], ...(SITE.games.length ? [['jogos', 'games']] : []), ['contato', 'contact']];
  return `<a class="skip" href="#projetos">${T('skip')}</a>
  <header class="top">
    <a class="mark" href="#topo" aria-label="${esc(DATA.trainer.name)}"><span class="cast" data-cast="mark" aria-hidden="true"></span><span class="mark-name" aria-hidden="true">JC</span></a>
    <nav aria-label="${T('nav')}">
      <button class="menu-btn" type="button" aria-expanded="false" aria-controls="nav-links">${icon('menu')}<span>${T('menu')}</span></button>
      <ul id="nav-links">${links.map(([id, k]) => `<li><a href="#${id}">${T(k)}</a></li>`).join('')}</ul>
    </nav>
    <button class="lang" type="button" aria-label="${T('lang_name')}">${T('lang')}</button>
    <a class="btn btn-orange play" href="${PLAY_URL}">${icon('play')}${T('play')}</a>
  </header>`;
}

function codeCard() {
  const k = U().code_keys;
  const s = (v) => `<span class="s">'${esc(v)}'</span>`;
  return [
    '<span class="kw">const</span> joao = {',
    `  <span class="k">${k.city}</span>: ${s(DATA.trainer.location)},`,
    `  <span class="k">${k.speaks}</span>: [${s('pt')}, ${s('en')}],`,
    `  <span class="k">${k.since}</span>: <span class="n">${DATA.trainer.since}</span>,`,
    `  <span class="k">${k.likes}</span>: [${U().likes.map(s).join(', ')}],`,
    '};',
  ].join('\n');
}

function hero() {
  const t = DATA.trainer;
  const [first, ...rest] = t.name.split(' ');
  return `<section class="hero" id="topo">
    <div class="hero-text">
      <h1 class="display name">${esc(first)} <span class="outline">${esc(rest.join(' '))}</span></h1>
      <p class="role">${esc(L(t.role))}</p>
      <p class="tagline">${esc(L(SITE.tagline))}</p>
      <p class="ctas">
        <a class="btn btn-orange" href="${PLAY_URL}">${icon('play')}${T('play_long')}</a>
        <a class="btn btn-line" href="#contato">${T('talk')}</a>
      </p>
      <p class="play-note">${esc(T('play_note'))}</p>
    </div>
    <div class="stage">
      <div class="cast" data-cast="hero" aria-hidden="true"></div>
      <div class="obj3d" data-3d aria-hidden="true"></div>
      <figure class="paper code-card tape" aria-hidden="true"><pre><code>${codeCard()}</code></pre></figure>
      <img class="sticker partner" src="assets/mon/front/${t.partner}.png" alt="" width="64" height="64">
      <svg class="stroke hero-arrow" viewBox="0 0 700 340" aria-hidden="true"><path pathLength="1" d="M20 40 C 160 330, 470 340, 660 150 M 610 150 L 662 148 L 652 200"/></svg>
      <a class="gba-shot tape tape-o" href="${PLAY_URL}"><img src="assets/og.png" alt="${esc(T('play_long'))}" width="1200" height="630"><span class="pixel" aria-hidden="true">${esc(T('play').toUpperCase())}</span></a>
      ${photo('cutout')}${drawings(0, 2)}
    </div>
  </section>`;
}

function ticker() {
  const repos = Object.values(gh);
  const items = [`${DATA.projects.length} ${T('t_projects')}`];
  if (repos.length) {
    const langs = {};
    repos.forEach((r) => Object.entries(r.languages).forEach(([l, b]) => { langs[l] = (langs[l] ?? 0) + b; }));
    const total = Object.values(langs).reduce((a, b) => a + b, 0);
    items.push(...Object.entries(langs).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([l, b]) => `${l} ${Math.round((100 * b) / total)}%`));
  }
  items.push(`${T('t_since')} ${DATA.trainer.since}`, DATA.trainer.location);
  const row = items.map((s) => `<span>${esc(s)}</span>${icon('star')}`).join('');
  return `<div class="ticker mono" aria-hidden="true"><p class="track">${row}${row}</p></div>`;
}

function repoData(g) {
  const total = Object.values(g.languages).reduce((a, b) => a + b, 0) || 1;
  const top3 = Object.entries(g.languages).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const rest = total - top3.reduce((a, [, b]) => a + b, 0);
  return `<div class="repo-data mono">
    <p class="langbar" aria-hidden="true">${[...top3, ...(rest > 0 ? [['', rest]] : [])].map(([, b], k) => `<i class="l${k}" style="flex:${b}"></i>`).join('')}</p>
    <p>${top3.map(([l, b]) => `${esc(l)} ${Math.round((100 * b) / total)}%`).join(' · ')}</p>
  </div>`;
}

function project(p, i) {
  const g = gh[repoOf(p.links.repo)];
  const iconUrl = `assets/mon/icon/${p.dex}${p.form ? `-${p.form}` : ''}.png`;
  const links = [p.links.repo && [p.links.repo, T('code')], p.links.live && [p.links.live, T('live')]].filter(Boolean);
  return `<article class="project m-${MATERIALS[i % MATERIALS.length]}" id="projeto-${i + 1}" style="--r:${tilt(i)}deg;--i:${i}">
    <button class="shot tape${i % 2 ? ' tape-o' : ''}" type="button" data-project="${i}" aria-label="${esc(T('shots', { name: p.name }))}">
      <img src="${esc(p.shots[0])}" alt="" loading="lazy">${p.shots.length > 1 ? `<span class="shot-count mono">+${p.shots.length - 1}</span>` : ''}
    </button>
    <i class="mon" style="background-image:url(${iconUrl})" aria-hidden="true"></i>
    <h3 class="display">${esc(p.name)}</h3>
    <p class="meta mono">${esc(L(p.kind))} · ${p.year}</p>
    <p class="pitch">${esc(L(p.pitch))}</p>
    <p class="text">${esc(L(p.text))}</p>
    <ul class="chips">${p.stack.map((s) => `<li class="chip c-${techColor(s)}">${esc(s)}</li>`).join('')}</ul>
    ${g ? repoData(g) : ''}
    <p class="links">${links.map(([url, label]) => `<a href="${esc(url)}"${ext(url)}>${label}${icon('out')}</a>`).join('')}</p>
  </article>`;
}

const projects = () => `<section class="projects" id="projetos">
  ${heading(0, T('projects'), T('projects_lead'))}
  <div class="project-grid">${DATA.projects.map(project).join('')}</div>
</section>`;

function about() {
  const t = DATA.trainer;
  const line = (cmd, out) => `<p><span class="prompt">$</span> ${esc(cmd)}</p><p class="out">${esc(out)}</p>`;
  return `<section class="about" id="sobre">
    ${heading(1, T('about'))}
    <div class="about-grid">
      <p class="about-text">${esc(L(t.about))}</p>
      <div class="side">
        ${photo('about-photo')}
        <div class="term mono">
          <p class="term-bar" aria-hidden="true"><i></i><i></i><i></i></p>
          ${line('whoami', t.name.toLowerCase())}${line(`cat ${T('f_role')}`, L(t.role))}${line(`cat ${T('f_where')}`, t.location)}${line(`cat ${T('f_langs')}`, L(t.languages))}
          <p><span class="prompt">$</span> <span class="caret" aria-hidden="true"></span></p>
          <div class="cast cameo" data-cast="about" aria-hidden="true"></div>
        </div>
        ${drawings(2, 4)}
      </div>
    </div>
  </section>`;
}

function work() {
  const stub = (period, title, sub, text, i, shape) => `<li class="stub" style="--r:${tilt(i) / 2}deg">
    ${shape ? `<i class="badge-sticker" style="--slot:${SHAPES.indexOf(shape)}" aria-hidden="true"></i>` : ''}
    <h3 class="display">${esc(title)}</h3>${sub ? `<p class="role">${esc(sub)}</p>` : ''}<p class="period mono">${esc(period)}</p>${text ? `<p>${esc(text)}</p>` : ''}</li>`;
  return `<section class="work" id="experiencia">
    ${heading(2, T('work'))}
    <div class="timeline">
      <svg class="stroke line" viewBox="0 0 10 100" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M5 0 V100"/></svg>
      <ol class="jobs">${DATA.badges.map((b, i) => stub(L(b.period), b.name, L(b.role), L(b.text), i + 2, b.shape)).join('')}</ol>
    </div>
    <h3 class="sub display">${T('school')}</h3>
    <ol class="school">${DATA.education.map((e, i) => stub(L(e.period), e.name, L(e.course), '', i + 4)).join('')}</ol>
  </section>`;
}

function skills() {
  const techs = [...new Set(DATA.projects.flatMap((p) => p.stack))];
  return `<section class="skills" id="habilidades">
    ${heading(3, T('skills'), T('skills_lead'))}
    <div class="skills-grid">
      <div class="panel"><div class="cast cameo" data-cast="skills" aria-hidden="true"></div>${DATA.moves.map((m, i) => `<div class="move" style="--c:var(--${TYPE_COLOR[m.type] ?? 'paper'})">
        <p class="move-name mono">${esc(m.name)}</p>
        <p class="bar" role="img" aria-label="${T('power')}: ${m.power}/100"><i style="--p:${m.power}%"></i></p>
        <p class="years mono">${T('years', { n: m.years })}${i ? '' : '<svg class="stroke ring" viewBox="0 0 120 60" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M70 6 C 20 2, 4 22, 10 38 C 18 58, 96 60, 112 36 C 124 16, 90 4, 54 8"/></svg>'}</p>
        <p class="move-text">${esc(L(m.text))}</p>
      </div>`).join('')}</div>
      <ul class="cloud" aria-label="Stack">${techs.map((s, i) => `<li class="chip c-${techColor(s)}" style="--r:${tilt(i) * 2.5}deg;--y:${tilt(i + 3) * 2}px">${esc(s)}</li>`).join('')}</ul>
    </div>
  </section>`;
}

function games() {
  if (!SITE.games.length) return '';
  const media = (src) => (/\.glb$/i.test(src) ? `<div class="obj3d game-3d" data-3d="${esc(src)}" aria-hidden="true"></div>`
    : /\.(mp4|webm)$/i.test(src) ? `<video src="${esc(src)}" muted loop playsinline autoplay></video>`
      : `<img src="${esc(src)}" alt="" loading="lazy">`);
  return `<section class="games" id="jogos">
    ${heading(0, T('games'))}
    <div class="game-grid">${SITE.games.map((g, i) => `<article class="game paper" style="--r:${tilt(i)}deg">
      ${media(g.media)}<h3 class="display">${esc(g.name)}</h3><p>${esc(L(g.text))}</p>
      ${g.link ? `<p class="links"><a href="${esc(g.link)}"${ext(g.link)}>${T('live')}${icon('out')}</a></p>` : ''}
    </article>`).join('')}</div>
  </section>`;
}

const contact = () => `<section class="contact" id="contato">
  <h2 class="display">${esc(T('contact_title'))}</h2>
  <p class="lead">${esc(T('contact_lead'))}</p>
  <ul class="contact-links">${DATA.contact.map((c) => `<li><a class="big" href="${esc(c.url)}"${ext(c.url)}>
    <span class="display">${esc(c.label)}</span><span class="mono">${esc(c.url.replace(/^(mailto:|https?:\/\/(www\.)?)/, '').replace(/\/$/, ''))}</span>${icon('out')}</a></li>`).join('')}</ul>
  <div class="cast" data-cast="contact" aria-hidden="true"></div>
</section>`;

const footer = () => `<footer class="foot">
  <a class="btn btn-orange" href="${PLAY_URL}">${icon('play')}${T('play_long')}</a>
  <p>${esc(T('footer'))}</p>
  <p><a href="https://github.com/thxcabra/portfolio" target="_blank" rel="noopener">${T('source')}${icon('out')}</a></p>
</footer>`;

const viewer = () => `<dialog class="viewer">
  <p class="v-bar"><span class="v-count mono"></span><button class="v-close" type="button">${T('close')}${icon('close')}</button></p>
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

// ---------- motion ----------
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

// The code card types itself once the collage has landed.
function typeCode() {
  const code = document.querySelector('.code-card code');
  if (reduced() || !code) return;
  const skip = typewrite(code, 40);
  cleanup.push(skip);
}

// ---------- the page ----------
function goToHash(smooth) {
  const id = siteAnchor(location.hash, DATA.projects.length);
  const el = id && document.getElementById(id);
  if (!el) return;
  if (location.hash !== `#${id}`) history.replaceState(null, '', `#${id}`);
  el.scrollIntoView({ behavior: smooth && !reduced() ? 'smooth' : 'auto', block: 'start' });
}

function render() {
  cleanup.forEach((f) => f());
  cleanup = [];
  document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en';
  document.body.innerHTML = defs() + top() + `<main>${hero()}${ticker()}${projects()}${about()}${work()}${skills()}${games()}${contact()}</main>` + footer() + viewer();
  const casts = { hero: ['blob', 'star', 'circle'], contact: ['squiggle', 'circle', 'star', 'blob'], mark: ['circle'], about: ['blob'], skills: ['star'] };
  document.querySelectorAll('[data-cast]').forEach((el) => cleanup.push(mountCast(el, casts[el.dataset.cast], { reduced: reduced() })));
  document.querySelectorAll('[data-3d]').forEach((el) => cleanup.push(mount3d(el, { reduced: reduced(), model: el.dataset['3d'] })));
  tiltCards();
  typeCode();
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
addEventListener('keydown', (e) => {
  if (!document.querySelector('.viewer')?.open) return;
  if (e.key === 'ArrowLeft') showShot(shots.k - 1);
  if (e.key === 'ArrowRight') showShot(shots.k + 1);
});
addEventListener('hashchange', () => goToHash(true));

gh = await fetch('assets/site/github.json').then((r) => (r.ok ? r.json() : {})).catch(() => ({}));
render();
goToHash(false);
