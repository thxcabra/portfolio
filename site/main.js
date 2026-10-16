// The landing page (lp.html): the complete portfolio on one vertical page made from data.js, in the GBA's
// two languages. A cartoon world on an old tape, with an RPG's bits: a HUD for a top bar (João's goat as
// the portrait, the scroll as XP), the skills as a character sheet whose checks roll a PS1-style d20
// (scene3d.js), a tape deck playing the songs he listens to, and secrets for whoever digs (the Konami code,
// Morse in the footer LED, a goat that peeks now and then, and the door to his ARG at #/sinal).
import { DATA } from '../data.js';
import { siteAnchor, repoOf, esc, skillCheck, skillRoll, morse, konami, KONAMI } from '../logic.js';
import { typewrite } from '../typewriter.js';
import { mountPS1 } from './scene3d.js';

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
const LEVEL = new Date().getFullYear() - DATA.trainer.since;   // years in tech
let gh = {};
let cleanup = [];
let dice = null;

// The game's types in the page's colours (the rest are paper).
const TYPE_COLOR = {
  fire: 'orange', electric: 'orange', fighting: 'orange', ground: 'orange', rock: 'orange',
  grass: 'green', bug: 'green', water: 'green', flying: 'green', ice: 'green',
  psychic: 'purple', dragon: 'purple', ghost: 'purple', poison: 'purple', dark: 'purple',
};
const techColor = (name) => TYPE_COLOR[DATA.moves.find((m) => m.name === name)?.type ?? DATA.tech[name]] ?? 'paper';
const TILTS = [-1.5, 1, -0.5, 1.5, -1, 0.5, -1.2];
const tilt = (i) => TILTS[i % TILTS.length];
const MATERIALS = ['paper', 'orange', 'purple', 'green'];
const ext = (url) => (url.startsWith('http') ? ' target="_blank" rel="noopener"' : '');
const steamUrl = (id) => `https://store.steampowered.com/app/${id}/`;

// Icons: one drawn set, 24-unit grid, 2px round strokes.
const ICONS = {
  play: '<path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/>',
  pause: '<path d="M8 5v14M16 5v14" stroke-width="3.2"/>',
  back: '<path d="M18 6v12l-8.5-6z" fill="currentColor"/><path d="M6.5 6v12" stroke-width="2.6"/>',
  skip: '<path d="M6 6v12l8.5-6z" fill="currentColor"/><path d="M17.5 6v12" stroke-width="2.6"/>',
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

const heading = (title, lead = '') => `<header class="sec-head"><h2 class="title">${esc(title)}</h2>${lead ? `<p class="lead">${esc(lead)}</p>` : ''}</header>`;
const SECTIONS = [['projetos', 'projects'], ['sobre', 'about'], ['experiencia', 'work'], ['habilidades', 'skills'], ['coisas', 'art'], ['contato', 'contact']];

// ---------- the HUD ----------
function hud() {
  return `<a class="skip" href="#projetos">${T('skip')}</a>
  <header class="hud">
    <a class="hud-me" href="#topo" aria-label="${esc(DATA.trainer.name)}">
      <span class="portrait"><img src="assets/site/goat-head.png" alt="" width="38" height="32"></span>
      <span class="hud-id">
        <span class="hud-name">CABRAL <small>${T('level')} ${LEVEL}</small></span>
        <span class="xp" aria-hidden="true"><b>${T('xp')}</b><i><i class="xp-fill"></i></i></span>
      </span>
    </a>
    <nav aria-label="${T('nav')}">
      <button class="menu-btn" type="button" aria-expanded="false" aria-controls="nav-links" aria-label="${T('nav')}">${icon('menu')}</button>
      <ul id="nav-links">${SECTIONS.map(([id, k]) => `<li><a href="#${id}" data-sec="${id}">${T(k)}</a></li>`).join('')}</ul>
    </nav>
    <button class="lang" type="button" role="switch" aria-checked="${lang === 'en'}" aria-label="${T('lang_name')}"><span>PT</span><span>EN</span></button>
    <a class="start" href="${PLAY_URL}">${icon('play')}<span>${T('play')}</span></a>
  </header>`;
}

function hero() {
  const t = DATA.trainer;
  return `<section class="hero field-purple" id="topo">
    <div class="hero-text">
      <h1><span class="hello">${esc(T('hello'))}</span> <span class="name">${esc(t.name)}.</span></h1>
      <p class="call">${esc(T('call'))}</p>
      <p class="role">${esc(L(t.role))}</p>
      <p class="ctas">
        <a class="btn btn-orange" href="${PLAY_URL}">${icon('play')}${T('play_long')}</a>
        <a class="btn btn-paper" href="#contato">${T('talk')}</a>
      </p>
      <p class="play-note">${esc(T('play_note'))}</p>
    </div>
    <div class="stage">
      <i class="cel" aria-hidden="true"></i>
      <img class="goat boil" src="assets/site/goat-ink.png" alt="${esc(T('goat'))}" width="376" height="551">
      <div class="vhs" data-ps1="vhs" aria-hidden="true"></div>
      <a class="gba-shot tape" href="${PLAY_URL}"><img src="assets/og.png" alt="${esc(T('play_long'))}" width="1200" height="630"><span aria-hidden="true">${icon('play')}${esc(T('play'))}</span></a>
    </div>
  </section>`;
}

// ---------- projects ----------
function repoData(g) {
  const total = Object.values(g.languages).reduce((a, b) => a + b, 0) || 1;
  const top3 = Object.entries(g.languages).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const rest = total - top3.reduce((a, [, b]) => a + b, 0);
  return `<div class="repo-data">
    <p class="langbar" aria-hidden="true">${[...top3, ...(rest > 0 ? [['', rest]] : [])].map(([, b], k) => `<i class="l${k}" style="flex:${b}"></i>`).join('')}</p>
    <p class="tiny">${top3.map(([l, b]) => `${esc(l)} ${Math.round((100 * b) / total)}%`).join(' · ')}</p>
  </div>`;
}

// k: the place on the page; i: the place in data.js, which the links (#/projetos/3) keep using.
function project(i, k) {
  const p = DATA.projects[i], g = gh[repoOf(p.links.repo)];
  const links = [p.links.repo && [p.links.repo, T('code')], p.links.live && [p.links.live, T('live')]].filter(Boolean);
  return `<article class="project m-${MATERIALS[k % MATERIALS.length]}" id="projeto-${i + 1}" style="--r:${tilt(k)}deg">
    <button class="shot tape${k % 2 ? ' tape-o' : ''}" type="button" data-project="${i}" aria-label="${esc(T('shots', { name: p.name }))}">
      <img src="${esc(p.shots[0])}" alt="" loading="lazy">${p.shots.length > 1 ? `<span class="shot-count tiny">+${p.shots.length - 1}</span>` : ''}
    </button>
    <h3 class="card-title">${esc(p.name)}</h3>
    <p class="meta tiny">${esc(L(p.kind))} · ${p.year}</p>
    <p class="pitch">${esc(L(p.pitch))}</p>
    <details class="more"><summary>${T('more')}</summary><p>${esc(L(p.text))}</p></details>
    <ul class="chips">${p.stack.map((s) => `<li class="chip c-${techColor(s)}">${esc(s)}</li>`).join('')}</ul>
    ${g ? repoData(g) : ''}
    <p class="links">${links.map(([url, label]) => `<a href="${esc(url)}"${ext(url)}>${label}${icon('out')}</a>`).join('')}</p>
  </article>`;
}

const projects = () => `<section class="projects" id="projetos">
  ${heading(T('projects'), T('projects_lead'))}
  <div class="ball" data-ps1="ball" aria-hidden="true"></div>
  <div class="project-grid">${SITE.order.map(project).join('')}</div>
</section>`;

// ---------- about: the story, the games and the tape deck ----------
function games() {
  const link = (g, inner) => `<a href="${steamUrl(g.steam)}" target="_blank" rel="noopener" aria-label="${esc(T('steam', { name: g.name }))}">${inner}${icon('out')}</a>`;
  return `<div class="card games">
    <h3 class="card-title">${T('recommend')}</h3>
    <ul class="recommend">${SITE.recommend.map((g) => `<li>${link(g, esc(g.name))}</li>`).join('')}</ul>
    <h3 class="card-title">${T('favorites')}</h3>
    <ul class="favorites">${SITE.favorites.map((g) => `<li>${link(g, `<b>${esc(g.name)}</b>`)}<span>${esc(L(g.why))}</span></li>`).join('')}</ul>
  </div>`;
}

function deck() {
  const t = SITE.tracks[0];
  return `<div class="card deck" data-deck>
    <h3 class="card-title">${T('listening')}</h3>
    <div class="tape-window" aria-hidden="true"><i class="reel"></i><i class="tape-line"></i><i class="reel"></i></div>
    <p class="now" aria-live="polite"><b class="now-artist">${esc(t.artist)}</b> <span class="now-song">${esc(t.song)}</span></p>
    <p class="progress" aria-hidden="true"><i></i></p>
    <p class="controls">
      <button type="button" class="key" data-deck-act="prev" aria-label="${T('prev_song')}">${icon('back')}</button>
      <button type="button" class="key key-play" data-deck-act="play" aria-label="${T('play_song')}">${icon('play')}</button>
      <button type="button" class="key" data-deck-act="next" aria-label="${T('next_song')}">${icon('skip')}</button>
      <a class="full tiny" href="https://music.apple.com/br/song/${t.id}" target="_blank" rel="noopener">${T('full_song')}${icon('out')}</a>
    </p>
    <ol class="tracklist">${SITE.tracks.map((s, i) => `<li><button type="button" data-track="${i}"><b>${esc(s.artist)}</b> ${esc(s.song)}</button></li>`).join('')}</ol>
    <p class="credit tiny">${T('preview')}</p>
  </div>`;
}

function about() {
  const t = DATA.trainer;
  return `<section class="about field-orange screentone" id="sobre">
    ${heading(T('about'))}
    <div class="about-grid">
      <div class="about-text">${L(SITE.about).map((p) => `<p>${esc(p)}</p>`).join('')}
        <ul class="facts tiny"><li>${esc(t.location)}</li><li>${esc(L(t.languages))}</li><li>${esc(T('since', { year: t.since }))}</li></ul>
        ${games()}
      </div>
      ${deck()}
    </div>
  </section>`;
}

// ---------- experience: the companies, with MOIC's clients inside its social media card ----------
function work() {
  const jobs = DATA.badges.filter((b) => !b.via);
  const clients = (b) => {
    const list = DATA.badges.filter((c) => c.via === b.name);
    return list.length && /social/i.test(L(b.role)) ? `<details class="more"><summary>${T('clients')}</summary><ul>${list.map((c) => `<li><b>${esc(c.name)}</b> <span class="tiny">${esc(L(c.period))}</span></li>`).join('')}</ul></details>` : '';
  };
  const stub = (period, title, sub, text, i, extra = '') => `<li class="stub" style="--r:${tilt(i) / 2}deg">
    <h3 class="card-title">${esc(title)}</h3>${sub ? `<p class="role">${esc(sub)}</p>` : ''}<p class="period tiny">${esc(period)}</p>${text ? `<p>${esc(text)}</p>` : ''}${extra}</li>`;
  return `<section class="work" id="experiencia">
    ${heading(T('work'))}
    <ol class="jobs">${jobs.map((b, i) => stub(L(b.period), b.name, L(b.role), L(b.text), i, clients(b))).join('')}</ol>
    <h3 class="sub">${T('school')}</h3>
    <ol class="school">${DATA.education.map((e, i) => stub(L(e.period), e.name, L(e.course), '', i + 3)).join('')}</ol>
  </section>`;
}

// ---------- skills: an RPG character sheet; a check rolls the d20 ----------
function skills() {
  const techs = [...new Set(DATA.projects.flatMap((p) => p.stack))];
  const move = (name) => DATA.moves.find((m) => m.name === name);
  return `<section class="skills screentone" id="habilidades">
    ${heading(T('skills'), T('skills_lead'))}
    <div class="sheet">
      <div class="attrs">${SITE.attrs.map((a) => `<div class="attr" style="--c:var(--${a.color})">
        <h3 class="card-title">${esc(L(a.name))}</h3>
        <ul>${a.moves.map((n) => `<li><button type="button" class="skill" data-move="${esc(n)}">
          <span class="skill-name">${esc(n)}</span><span class="skill-bonus">+${skillRoll(move(n).power, 0).bonus}</span></button></li>`).join('')}</ul>
      </div>`).join('')}</div>
      <div class="table">
        <div class="dice" data-ps1="d20" aria-hidden="true"></div>
        <p class="sfx" aria-hidden="true"></p>
        <div class="dialog" aria-live="polite">
          <span class="dialog-face" aria-hidden="true"><img class="boil" src="assets/site/goat-ink.png" alt="" width="376" height="551"></span>
          <div><p class="dialog-check"></p><p class="dialog-text">${esc(T('roll_hint'))}</p></div>
        </div>
      </div>
    </div>
    <ul class="cloud" aria-label="${T('stack')}">${techs.map((s, i) => `<li class="chip c-${techColor(s)}" style="--r:${tilt(i) * 2}deg">${esc(s)}</li>`).join('')}</ul>
  </section>`;
}

// ---------- João's drawings, pixel art and 3D ----------
const art = () => `<section class="art field-green" id="coisas">
  ${heading(T('art'))}
  <ul class="art-wall">${SITE.art.map((a, k) => `<li class="piece piece-${a.kind}" style="--r:${tilt(k + 1)}deg">
    <figure><span class="frame"><img src="${esc(a.src)}" alt="${esc(L(a.caption))}" width="${a.w}" height="${a.h}" loading="lazy"${a.kind === 'ink' ? ' class="boil"' : ''}></span>
    <figcaption>${esc(L(a.caption))}</figcaption></figure></li>`).join('')}</ul>
</section>`;

const contact = () => `<section class="contact field-purple" id="contato">
  <div class="contact-text">
    <h2 class="title">${esc(T('contact_title'))}</h2>
    <p class="lead">${esc(L(SITE.looking))}</p>
    <ul class="contact-links">${DATA.contact.map((c) => `<li><a class="big" href="${esc(c.url)}"${ext(c.url)}>
      <span class="card-title">${esc(c.label)}</span><span class="tiny">${esc(c.url.replace(/^(mailto:|https?:\/\/(www\.)?)/, '').replace(/\/$/, ''))}</span>${icon('out')}</a></li>`).join('')}</ul>
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
  <p class="v-bar"><span class="v-count tiny"></span><button class="v-close" type="button">${T('close')}${icon('close')}</button></p>
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

// ---------- the tape deck: 30-second previews looked up at the Apple Music catalogue when played ----------
const deckState = { i: 0, audio: null, urls: {} };
function deckShow() {
  const el = document.querySelector('[data-deck]');
  if (!el) return;
  const t = SITE.tracks[deckState.i], playing = !!deckState.audio && !deckState.audio.paused;
  el.querySelector('.now-artist').textContent = t.artist;
  el.querySelector('.now-song').textContent = t.song;
  el.querySelector('.full').href = `https://music.apple.com/br/song/${t.id}`;
  const play = el.querySelector('.key-play');
  play.innerHTML = icon(playing ? 'pause' : 'play');
  play.setAttribute('aria-label', T(playing ? 'pause' : 'play_song'));
  el.classList.toggle('playing', playing);
  el.querySelectorAll('[data-track]').forEach((b) => b.toggleAttribute('aria-current', Number(b.dataset.track) === deckState.i));
}
async function deckPlay(i = deckState.i) {
  const n = SITE.tracks.length;
  deckState.i = (i + n) % n;
  const t = SITE.tracks[deckState.i];
  deckShow();
  try {
    deckState.urls[t.id] ??= await fetch(`https://itunes.apple.com/lookup?id=${t.id}&country=BR`).then((r) => r.json()).then((d) => d.results[0].previewUrl);
    if (!deckState.audio) {
      const a = (deckState.audio = new Audio());
      a.volume = 0.6;
      a.addEventListener('ended', () => deckPlay(deckState.i + 1));
      a.addEventListener('pause', deckShow);
      a.addEventListener('play', deckShow);
      a.addEventListener('timeupdate', () => {
        const bar = document.querySelector('[data-deck] .progress i');
        if (bar && a.duration) bar.style.width = `${(100 * a.currentTime) / a.duration}%`;
      });
    }
    if (deckState.audio.src !== deckState.urls[t.id]) deckState.audio.src = deckState.urls[t.id];
    await deckState.audio.play();
  } catch {
    const now = document.querySelector('[data-deck] .now-song');
    if (now) now.textContent = T('song_error');
  }
}
function deckAct(act) {
  if (act === 'play') return deckState.audio && !deckState.audio.paused ? deckState.audio.pause() : deckPlay();
  deckPlay(deckState.i + (act === 'next' ? 1 : -1));
}

// ---------- the skill check ----------
let typing = () => {};
function check(name) {
  const m = DATA.moves.find((x) => x.name === name);
  const r = skillRoll(m.power, 1 + Math.floor(Math.random() * 20));
  document.querySelectorAll('.skill').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.move === name)));
  dice?.roll();
  const sfx = document.querySelector('.sfx');
  sfx.textContent = T('sfx_roll');
  sfx.classList.remove('pop');
  void sfx.offsetWidth;   // restart the pop
  sfx.classList.add('pop');
  const show = () => {
    const box = document.querySelector('.dialog');
    box.style.setProperty('--c', `var(--${SITE.attrs.find((a) => a.moves.includes(name)).color})`);
    box.querySelector('.dialog-check').innerHTML = `<b>${esc(name)}</b> [${T(skillCheck(m.power))}: ${T(r.crit ? 'crit' : 'success')}] <span class="tiny">${T('roll_math', r)}</span>`;
    const text = box.querySelector('.dialog-text');
    text.textContent = `${L(m.text)} ${T('years', { n: m.years })}.`;
    typing();
    typing = reduced() ? () => {} : typewrite(text, 60);
  };
  setTimeout(show, reduced() ? 0 : 700);
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
  document.documentElement.style.setProperty('--grain', `url(${c.toDataURL()})`);   // the weak signal's static uses it too
  const el = document.createElement('div');
  el.className = 'film';
  el.setAttribute('aria-hidden', 'true');
  document.body.append(el);
}

// ---------- the HUD's XP bar (how far down the page) and the current section in the menu ----------
function hudLive() {
  const fill = document.querySelector('.xp-fill');
  let raf = 0;
  const onScroll = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const max = document.documentElement.scrollHeight - innerHeight;
      fill.style.width = `${max > 0 ? Math.min(100, (100 * scrollY) / max) : 0}%`;
    });
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  const links = new Map([...document.querySelectorAll('nav a[data-sec]')].map((a) => [a.dataset.sec, a]));
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) links.forEach((a, id) => a.toggleAttribute('aria-current', id === e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  SECTIONS.forEach(([id]) => { const s = document.getElementById(id); if (s) io.observe(s); });
  cleanup.push(() => { removeEventListener('scroll', onScroll); io.disconnect(); });
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
    ? `<div class="bars" aria-hidden="true"></div><div class="signal-text"><p class="signal-title">${T('lost_title')}</p><p>${esc(T('lost_text'))}</p><p class="tiny">${esc(T('lost_back'))}</p></div>`
    : `<div class="static" aria-hidden="true"></div><div class="signal-text"><p class="signal-title">${T('weak_title')}</p><p>${esc(T('weak_text'))}</p></div>`;
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
      el.style.setProperty('--ry', `${((e.clientX - r.left) / r.width - 0.5) * 6}deg`);
      el.style.setProperty('--rx', `${(0.5 - (e.clientY - r.top) / r.height) * 6}deg`);
    });
    el.addEventListener('pointerleave', () => { el.style.removeProperty('--rx'); el.style.removeProperty('--ry'); });
  });
}

function render() {
  cleanup.forEach((f) => f());
  cleanup = [];
  typing();
  document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en';
  document.body.innerHTML = boilDefs() + hud() + `<main>${hero()}${projects()}${about()}${work()}${skills()}${art()}${contact()}</main>` + footer() + viewer();
  grain();
  hudLive();
  tiltCards();
  blinkMorse();
  deckShow();
  dice = null;
  document.querySelectorAll('[data-ps1]').forEach((el) => {
    const piece = mountPS1(el, { reduced: reduced(), kind: el.dataset.ps1, label: T('tape') });
    if (el.dataset.ps1 === 'd20') dice = piece;
    cleanup.push(() => piece.stop());
  });
}

addEventListener('click', (e) => {
  const t = e.target;
  if (t.closest('.hud .lang')) {
    lang = lang === 'pt' ? 'en' : 'pt';
    store.set('lang', lang);
    const y = scrollY;
    render();
    scrollTo(0, y);
    document.querySelector('.hud .lang').focus();
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
  const skill = t.closest('.skill');
  if (skill) return check(skill.dataset.move);
  const act = t.closest('[data-deck-act]');
  if (act) return deckAct(act.dataset.deckAct);
  const track = t.closest('[data-track]');
  if (track) return deckPlay(Number(track.dataset.track));
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
