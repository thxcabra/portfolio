# Landing page — plano de implementação

**Objetivo:** construir a landing page do spec (seções 1–8) em `lp.html`, publicar em `/portfolio/lp` sem mexer no site de hoje, renovar o README do perfil (seção 9) e deixar a troca de endereço pronta num branch local, esperando o João.

**Arquitetura:** `lp.html` carrega `site/main.js`, que monta as seções a partir do `data.js` (bloco novo `DATA.site`) como HTML e depois liga o elenco (`site/cast.js`), o 3D (`site/scene3d.js`, three.js sob demanda) e as animações. Funções puras novas (`siteAnchor`, `repoOf`) vão para `logic.js` e são testadas no `check.mjs`. Os dados do GitHub vêm de `tools/github_stats.mjs` para `assets/site/github.json`.

**Tecnologia:** HTML/CSS/JS (módulos ES), sem build. three.js 0.169.0 pelo jsDelivr (mapa de importação). Google Fonts: Unbounded, Bricolage Grotesque, JetBrains Mono. Testes: `node check.mjs` e `node tools/e2e.mjs` (Edge headless via CDP).

**Spec:** `docs/specs/2026-10-14-landing-page-design.md`

## Restrições globais

- Commits como **João Cabral <joaovcabralm@hotmail.com>**, sem coautoria e sem marca de ferramenta em commits, código ou documentos.
- **Nenhuma imagem gerada por IA.** Só material do João, assets originais que o site já tem e elementos feitos em código.
- **Nenhum telefone** em lugar nenhum.
- O site de hoje não muda até a troca: `index.html` e o GBA ficam intactos nas tarefas 1–8.
- `new assets/` nunca vai para o git.
- Rodar `node check.mjs` e `node tools/e2e.mjs` antes de cada commit; olhar as capturas antes de cada commit visual.
- Cores: `--ink #0E0C12`, `--paper #F4EEE3`, `--orange #FF6A1F`, `--purple #6A3BF0`, `--green #2BD67B`.

## Arquivos

| Arquivo | Papel |
|---|---|
| `data.js` | ganha `DATA.site` (tagline, textos da página, `media`, `games`) |
| `logic.js` | ganha `siteAnchor(hash, projects)` e `repoOf(url)` |
| `check.mjs` | testes das funções novas, de `DATA.site`, do `github.json` e do contraste das cores |
| `tools/github_stats.mjs` | lê o GitHub com `gh api` e grava `assets/site/github.json` |
| `lp.html` | esqueleto, metatags, fontes, mapa de importação |
| `site/site.css` | todo o visual da página |
| `site/main.js` | monta as seções, idioma, âncoras, visualizador de prints, revelar ao rolar, inclinação |
| `site/cast.js` | os personagens-forma |
| `site/scene3d.js` | o objeto low poly e os modelos `.glb` |
| `tools/e2e.mjs` | passos novos da landing page |
| `README.md` | menção à landing page |

---

### Tarefa 1: dados da página e funções puras

**Arquivos:** modificar `data.js`, `logic.js`, `check.mjs`.

**Interfaces produzidas:**
- `siteAnchor(hash: string|null, projects: number): string|null`: id do elemento para um link antigo ou novo; `null` é o topo.
- `repoOf(url: string|undefined): string|null`: `"dono/repo"` de uma URL do GitHub.
- `DATA.site = { tagline: {pt,en}, media: { photo: string|null, drawings: string[] }, games: object[], ui: { pt: {...}, en: {...} } }`.

- [ ] **Passo 1: testes que falham** (no fim do `check.mjs`, antes da última linha)

```js
// the landing page: links old (the GBA's #/projetos/3) and new (#projeto-3) land on the right section
assert.equal(siteAnchor('#/projetos/3', 7), 'projeto-3');
assert.equal(siteAnchor('#projeto-3', 7), 'projeto-3');
assert.equal(siteAnchor('#/projetos', 7), 'projetos');
assert.equal(siteAnchor('#projetos', 7), 'projetos');
for (const s of ['sobre', 'experiencia', 'habilidades', 'contato', 'jogos']) {
  assert.equal(siteAnchor(`#/${s}`, 7), s);
  assert.equal(siteAnchor(`#${s}`, 7), s);
}
for (const bad of ['#/projetos/8', '#/projetos/0', '#projeto-x', '#/simples', '#/opcoes', '#topo', '', null]) assert.equal(siteAnchor(bad, 7), null, `siteAnchor(${bad})`);
assert.equal(repoOf('https://github.com/thxcabra/PitchIQ'), 'thxcabra/PitchIQ');
assert.equal(repoOf('https://github.com/thxcabra/replai/'), 'thxcabra/replai');
assert.equal(repoOf('https://www.moicdigital.com'), null);
assert.equal(repoOf(undefined), null);

// the landing page's texts: same keys in both languages; its media exist
const site = DATA.site;
assert.ok(site.tagline.pt && site.tagline.en, 'site.tagline');
assert.deepEqual(Object.keys(site.ui.en).sort(), Object.keys(site.ui.pt).sort(), 'site.ui: chaves diferentes em pt e en');
for (const f of [site.media.photo, ...site.media.drawings, ...site.games.map((g) => g.media)].filter(Boolean)) assert.ok(existsSync(here0(f)), `falta ${f}`);
for (const g of site.games) assert.ok(g.name && g.text?.pt && g.text?.en && g.media, `jogo incompleto: ${g.name}`);
```

- [ ] **Passo 2:** `node check.mjs` falha com `siteAnchor is not defined` (adicionar `siteAnchor, repoOf` ao import do `logic.js` antes).

- [ ] **Passo 3: implementação** em `logic.js` (no fim):

```js
// The landing page's section for a link: the GBA's (#/projetos/3, #/sobre) or its own (#projeto-3,
// #sobre). null is the top of the page.
const SITE_IDS = ['projetos', 'sobre', 'experiencia', 'habilidades', 'jogos', 'contato'];
export function siteAnchor(hash, projects) {
  const h = String(hash ?? '').replace(/^#\/?/, '');
  const m = h.match(/^(?:projetos\/|projeto-)(\d+)$/);
  if (m) return Number(m[1]) >= 1 && Number(m[1]) <= projects ? `projeto-${Number(m[1])}` : null;
  return SITE_IDS.includes(h) ? h : null;
}

// "owner/repo" of a GitHub link, or null.
export const repoOf = (url) => String(url ?? '').match(/^https:\/\/github\.com\/([^/]+\/[^/#?]+?)\/?$/)?.[1] ?? null;
```

E em `data.js`, depois de `contact`:

```js
  // A landing page (lp.html). Estes textos não passam pela fonte do jogo. media e games são o material do
  // João: foto recortada (PNG transparente), desenhos (PNG transparente) e jogos ({ name, text: { pt, en },
  // media: 'assets/site/…' (png, gif, webp, mp4 ou glb), link }). Só aparece o que estiver preenchido.
  // Nada de imagem gerada por IA.
  site: {
    tagline: {
      pt: 'Construo produtos digitais do zero: software, IA, dados e jogos. Estáveis, bonitos e divertidos de usar.',
      en: 'I build digital products from scratch: software, AI, data and games. Stable, good-looking and fun to use.',
    },
    media: { photo: null, drawings: [] },
    games: [],
    ui: {
      pt: {
        skip: 'Pular para o conteúdo', nav: 'Seções', menu: 'Menu', lang: 'EN', lang_name: 'Mudar para inglês',
        play: 'Jogar', play_long: 'Jogar meu portfólio', play_note: 'Este portfólio também é um jogo: um Centro Pokémon dentro de um GBA.',
        talk: 'Fale comigo',
        projects: 'Projetos', about: 'Sobre', work: 'Experiência', skills: 'Habilidades', games: 'Jogos', contact: 'Contato',
        projects_lead: 'Coisas que eu construí, do problema até as mãos de quem usa.',
        code: 'Código', live: 'Ver ao vivo', shots: 'Ver as imagens de {name}', shot_of: '{i} de {n}',
        close: 'Fechar', prev: 'Anterior', next: 'Próxima', commits: '{n} commits',
        school: 'Formação', years: '{n} anos', power: 'Poder', skills_lead: 'O que eu uso no dia a dia, e há quanto tempo.',
        contact_title: 'Vaga ou projeto? Bora conversar.',
        contact_lead: 'Se você tem um time fazendo coisas interessantes, ou um projeto que precisa sair do papel, me chama.',
        footer: 'Feito à mão em HTML, CSS e JS, sem framework.', source: 'Código do site',
        t_projects: 'projetos', t_since: 'em tecnologia desde',
        f_role: 'cargo.txt', f_where: 'onde.txt', f_langs: 'idiomas.txt',
        code_keys: { city: 'cidade', speaks: 'idiomas', since: 'desde', likes: 'gosta' }, likes: ['jogos', 'dados', 'design'],
      },
      en: {
        skip: 'Skip to content', nav: 'Sections', menu: 'Menu', lang: 'PT', lang_name: 'Mudar para português',
        play: 'Play', play_long: 'Play my portfolio', play_note: 'This portfolio is also a game: a Pokémon Center inside a GBA.',
        talk: 'Talk to me',
        projects: 'Projects', about: 'About', work: 'Experience', skills: 'Skills', games: 'Games', contact: 'Contact',
        projects_lead: 'Things I built, from the problem to the hands of the people who use them.',
        code: 'Code', live: 'See it live', shots: 'See the pictures of {name}', shot_of: '{i} of {n}',
        close: 'Close', prev: 'Previous', next: 'Next', commits: '{n} commits',
        school: 'Education', years: '{n} years', power: 'Power', skills_lead: 'What I use day to day, and for how long.',
        contact_title: "A role or a project? Let's talk.",
        contact_lead: 'If your team is making interesting things, or you have a project that needs to get off the ground, reach out.',
        footer: 'Handmade in HTML, CSS and JS, no framework.', source: 'Site source',
        t_projects: 'projects', t_since: 'in tech since',
        f_role: 'role.txt', f_where: 'where.txt', f_langs: 'languages.txt',
        code_keys: { city: 'city', speaks: 'speaks', since: 'since', likes: 'likes' }, likes: ['games', 'data', 'design'],
      },
    },
  },
```

- [ ] **Passo 4:** `node check.mjs` → `check ok`.
- [ ] **Passo 5: commit** `feat(lp): textos da landing page e âncoras dos links antigos`.

### Tarefa 2: dados reais do GitHub

**Arquivos:** criar `tools/github_stats.mjs`, `assets/site/github.json`; modificar `check.mjs`.

**Interfaces:** consome `repoOf`. Produz `assets/site/github.json`: `{ "dono/repo": { languages: { [linguagem]: bytes }, commits: number, created: "AAAA-MM-DD", pushed: "AAAA-MM-DD" } }`.

- [ ] **Passo 1: teste** no `check.mjs`:

```js
// assets/site/github.json (tools/github_stats.mjs): one entry per project repo, with numbers
const ghFile = here0('assets/site/github.json');
if (existsSync(ghFile)) {
  const gh = JSON.parse(readFileSync(ghFile, 'utf8'));
  for (const p of DATA.projects) {
    const repo = repoOf(p.links.repo);
    if (!repo) continue;
    assert.ok(gh[repo]?.commits > 0 && Object.keys(gh[repo].languages).length > 0, `github.json sem ${repo}`);
  }
}
```

- [ ] **Passo 2: a ferramenta** `tools/github_stats.mjs`:

```js
// Real numbers for the landing page: each project repo's languages (bytes), commit count and dates,
// read from the GitHub API through the gh CLI. Run by hand to refresh: node tools/github_stats.mjs
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { DATA } from '../data.js';
import { repoOf } from '../logic.js';

const gh = (...args) => execFileSync('gh', ['api', ...args], { encoding: 'utf8' });
const out = {};
for (const p of DATA.projects) {
  const repo = repoOf(p.links.repo);
  if (!repo) continue;
  const info = JSON.parse(gh(`repos/${repo}`));
  // one commit per page: the last page's number is the commit count
  const head = gh('--include', `repos/${repo}/commits?per_page=1`);
  const last = head.match(/[?&]page=(\d+)>; rel="last"/);
  out[repo] = {
    languages: JSON.parse(gh(`repos/${repo}/languages`)),
    commits: last ? Number(last[1]) : 1,
    created: info.created_at.slice(0, 10),
    pushed: info.pushed_at.slice(0, 10),
  };
}
const dir = new URL('../assets/site/', import.meta.url);
mkdirSync(dir, { recursive: true });
writeFileSync(new URL('github.json', dir), JSON.stringify(out, null, 1) + '\n');
console.log(`${Object.keys(out).length} repos`);
```

- [ ] **Passo 3:** `node tools/github_stats.mjs` → `6 repos`; `node check.mjs` → `check ok`.
- [ ] **Passo 4: commit** `feat(lp): números reais dos repositórios`.

### Tarefa 3: a página com todo o conteúdo

**Arquivos:** criar `lp.html`, `site/main.js`, `site/site.css`; modificar `tools/e2e.mjs`, `check.mjs`.

**Interfaces:**
- Consome `DATA.site`, `siteAnchor`, `repoOf`, `esc`, `typewrite(el, cps, onDone)`.
- Produz em `site/main.js`: `export const PLAY_URL = './'`.
- O HTML tem `main > section#topo|#projetos|#sobre|#experiencia|#habilidades|#contato` (e `#jogos` quando houver jogos), `.project#projeto-N`, `[data-cast]`, `[data-3d]`, `[data-reveal]`, `dialog.viewer`, `.lang` e `.play`.
- `site/cast.js` e `site/scene3d.js` entram nas tarefas 5 e 6. Até lá, `main.js` não os importa.

- [ ] **Passo 1: passos de e2e que falham** em `tools/e2e.mjs`, logo antes de `assert.deepEqual(errors, [] …)`:

```js
// ---------- the landing page (lp.html) ----------
await ev('localStorage.clear()');
await send('Page.navigate', { url: `${BASE}lp.html?lp=1` });
await sleep(2500);
assert.deepEqual(await ev(`[...document.querySelectorAll('main > section')].map((s) => s.id)`), ['topo', 'projetos', 'sobre', 'experiencia', 'habilidades', 'contato'], 'seções da landing page');
assert.equal(await ev(`document.querySelectorAll('.project').length`), 7);
assert.equal(await ev(`document.querySelector('.top .play').getAttribute('href')`), './', 'o Jogar leva ao GBA');
await click('.lang', 600);
assert.equal(await ev('document.documentElement.lang'), 'en');
assert.equal(await ev(`document.querySelector('#projetos h2').textContent`), 'Projects');
assert.equal(await ev(`localStorage.getItem('lang')`), '"en"', 'o idioma da landing page fica salvo (o mesmo do GBA)');
await click('.lang', 600);
assert.equal(await ev(`document.querySelector('#projetos h2').textContent`), 'Projetos');
await ev(`document.querySelector('#projeto-1 .shot').scrollIntoView({ block: 'center' })`);
await sleep(300);
await click('#projeto-1 .shot', 400);
assert.ok(await ev(`document.querySelector('dialog.viewer').open`), 'o print não abriu');
await key('Escape', 300);
assert.ok(!(await ev(`document.querySelector('dialog.viewer').open`)), 'Esc não fechou os prints');
ok('landing page: seções, 7 projetos, Jogar, PT/EN salvo, prints abrem e fecham');

await send('Page.navigate', { url: `${BASE}lp.html?old=1#/projetos/3` });
await sleep(2500);
assert.equal(await hash(), '#projeto-3', 'o link antigo vira a âncora nova');
assert.ok(await ev(`(() => { const t = document.getElementById('projeto-3').getBoundingClientRect().top; return t >= 0 && t < innerHeight / 2; })()`), 'não rolou até o projeto 3');
ok('landing page: link antigo #/projetos/3 rola até o projeto');

await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
await send('Page.navigate', { url: `${BASE}lp.html?small=1` });
await sleep(2500);
assert.ok(await ev('document.documentElement.scrollWidth <= innerWidth'), 'rolagem horizontal no celular');
assert.ok(await ev(`[...document.querySelectorAll('[data-reveal]')].every((e) => getComputedStyle(e).opacity === '1')`), 'com movimento reduzido tudo aparece');
await send('Emulation.clearDeviceMetricsOverride');
await send('Emulation.setEmulatedMedia', { features: [] });
ok('landing page: celular sem rolagem horizontal; movimento reduzido mostra tudo');
```

- [ ] **Passo 2:** `node tools/e2e.mjs` falha em "seções da landing page" (404).

- [ ] **Passo 3: `lp.html`**

```html
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>João Cabral · Engenheiro de software, IA e jogos</title>
  <meta name="description" content="João Cabral, engenheiro de software: IA e automação de dados, produtos web e jogos. Projetos, experiência e contato, e um portfólio que também é um jogo.">
  <meta property="og:type" content="website">
  <meta property="og:title" content="João Cabral · Engenheiro de software, IA e jogos">
  <meta property="og:description" content="Projetos, experiência e contato, e um portfólio que também é um jogo.">
  <meta property="og:url" content="https://thxcabra.github.io/portfolio/">
  <meta property="og:image" content="https://thxcabra.github.io/portfolio/assets/og.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="theme-color" content="#0E0C12">
  <link rel="icon" href="assets/ui/ball.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,800&family=JetBrains+Mono:wght@400;700&family=Unbounded:wght@700;900&display=swap">
  <link rel="stylesheet" href="site/site.css">
  <script type="importmap">{ "imports": { "three": "https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.min.js", "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/" } }</script>
  <script type="module" src="site/main.js"></script>
</head>
<body>
  <noscript><p>João Cabral, engenheiro de software. Ative o JavaScript para ver a página, ou fale comigo: joaovcabralm@hotmail.com · <a href="https://www.linkedin.com/in/joao-cabral-machado/">LinkedIn</a> · <a href="https://github.com/thxcabra">GitHub</a></p></noscript>
</body>
</html>
```

- [ ] **Passo 4: `site/main.js`** monta tudo (código completo):

```js
// The landing page (lp.html): one vertical page made from data.js, in the GBA's two languages. Sections
// are HTML strings; after each render the motion, the cast (cast.js) and the 3D piece (scene3d.js) are
// wired again.
import { DATA } from '../data.js';
import { siteAnchor, repoOf, esc } from '../logic.js';
import { typewrite } from '../typewriter.js';

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

const underline = () => '<svg class="stroke under" viewBox="0 0 300 20" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M4 14 C 60 4, 120 18, 180 9 S 270 6, 296 12"/></svg>';
const heading = (n, title, lead = '') => `<header class="sec-head" data-reveal>
  <p class="sec-num pixel" aria-hidden="true">${String(n).padStart(2, '0')}</p>
  <h2 class="display">${esc(title)}</h2>${underline()}
  ${lead ? `<p class="lead">${esc(lead)}</p>` : ''}</header>`;
const drawings = (a, b) => SITE.media.drawings.slice(a, b).map((src) => `<img class="drawing" src="${esc(src)}" alt="" aria-hidden="true">`).join('');
const photo = (cls) => (SITE.media.photo ? `<img class="photo ${cls}" src="${esc(SITE.media.photo)}" alt="${esc(DATA.trainer.name)}">` : '');

function top() {
  const links = [['projetos', 'projects'], ['sobre', 'about'], ['experiencia', 'work'], ['habilidades', 'skills'], ...(SITE.games.length ? [['jogos', 'games']] : []), ['contato', 'contact']];
  return `<a class="skip" href="#projetos">${T('skip')}</a>
  <header class="top">
    <a class="mark" href="#topo" aria-label="${esc(DATA.trainer.name)}"><span class="cast" data-cast="mark" aria-hidden="true"></span><span aria-hidden="true">JC</span></a>
    <nav aria-label="${T('nav')}">
      <button class="menu-btn" type="button" aria-expanded="false" aria-controls="nav-links">${T('menu')}</button>
      <ul id="nav-links">${links.map(([id, k]) => `<li><a href="#${id}">${T(k)}</a></li>`).join('')}</ul>
    </nav>
    <button class="lang" type="button" aria-label="${T('lang_name')}">${T('lang')}</button>
    <a class="btn btn-orange play" href="${PLAY_URL}">${T('play')} <span aria-hidden="true">▶</span></a>
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
      <p class="hello mono" data-reveal>&gt; ${esc(L(t.role))}</p>
      <h1 class="display name" data-reveal style="--i:1">${esc(first)} <span class="outline">${esc(rest.join(' '))}</span></h1>
      <p class="tagline" data-reveal style="--i:2">${esc(L(SITE.tagline))}</p>
      <p class="ctas" data-reveal style="--i:3">
        <a class="btn btn-orange" href="${PLAY_URL}">${T('play_long')} <span aria-hidden="true">▶</span></a>
        <a class="btn btn-line" href="#contato">${T('talk')}</a>
      </p>
      <p class="play-note mono" data-reveal style="--i:4">${esc(T('play_note'))}</p>
    </div>
    <div class="stage">
      <div class="cast" data-cast="hero" aria-hidden="true"></div>
      <div class="obj3d" data-3d aria-hidden="true"></div>
      <figure class="paper code-card tape" aria-hidden="true"><pre><code>${codeCard()}</code></pre></figure>
      <img class="sticker pixel-img partner" src="assets/mon/front/${t.partner}.png" alt="" width="64" height="64">
      <a class="gba-shot tape tape-o" href="${PLAY_URL}"><img src="assets/og.png" alt="${esc(T('play_long'))}" width="1200" height="630"><span class="pixel" aria-hidden="true">▶ ${esc(T('play').toUpperCase())}</span></a>
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
    items.push(`${repos.reduce((a, r) => a + r.commits, 0).toLocaleString(lang)} commits`,
      ...Object.entries(langs).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([l, b]) => `${l} ${Math.round((100 * b) / total)}%`));
  }
  items.push(`${T('t_since')} ${DATA.trainer.since}`, DATA.trainer.location);
  const row = items.map((s) => `<span>${esc(s)}</span><span class="star">✦</span>`).join('');
  return `<div class="ticker mono" aria-hidden="true"><p class="track">${row}${row}</p></div>`;
}

function repoData(g) {
  const total = Object.values(g.languages).reduce((a, b) => a + b, 0) || 1;
  const top3 = Object.entries(g.languages).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const rest = total - top3.reduce((a, [, b]) => a + b, 0);
  return `<div class="repo-data mono">
    <p class="langbar" aria-hidden="true">${[...top3, ...(rest > 0 ? [['', rest]] : [])].map(([, b], k) => `<i class="l${k}" style="flex:${b}"></i>`).join('')}</p>
    <p>${top3.map(([l, b]) => `${esc(l)} ${Math.round((100 * b) / total)}%`).join(' · ')} · ${T('commits', { n: g.commits.toLocaleString(lang) })}</p>
  </div>`;
}

function project(p, i) {
  const g = gh[repoOf(p.links.repo)];
  const icon = `assets/mon/icon/${p.dex}${p.form ? `-${p.form}` : ''}.png`;
  const links = [p.links.repo && [p.links.repo, T('code')], p.links.live && [p.links.live, T('live')]].filter(Boolean);
  return `<article class="project m-${MATERIALS[i % MATERIALS.length]}" id="projeto-${i + 1}" style="--r:${tilt(i)}deg" data-reveal>
    <button class="shot tape${i % 2 ? ' tape-o' : ''}" type="button" data-project="${i}" aria-label="${esc(T('shots', { name: p.name }))}">
      <img src="${esc(p.shots[0])}" alt="" loading="lazy">${p.shots.length > 1 ? `<span class="shot-count mono">+${p.shots.length - 1}</span>` : ''}
    </button>
    <i class="mon" style="background-image:url(${icon})" aria-hidden="true"></i>
    <p class="meta mono">${esc(L(p.kind))} · ${p.year}</p>
    <h3 class="display">${esc(p.name)}</h3>
    <p class="pitch">${esc(L(p.pitch))}</p>
    <p class="text">${esc(L(p.text))}</p>
    <ul class="chips">${p.stack.map((s) => `<li class="chip c-${techColor(s)}">${esc(s)}</li>`).join('')}</ul>
    ${g ? repoData(g) : ''}
    <p class="links">${links.map(([url, label]) => `<a href="${esc(url)}"${ext(url)}>${label} <span aria-hidden="true">↗</span></a>`).join('')}</p>
  </article>`;
}

const projects = () => `<section class="projects" id="projetos">
  ${heading(1, T('projects'), T('projects_lead'))}
  <div class="project-grid">${DATA.projects.map(project).join('')}</div>
</section>`;

function about() {
  const t = DATA.trainer;
  const line = (cmd, out) => `<p><span class="prompt">$</span> ${esc(cmd)}</p><p class="out">${esc(out)}</p>`;
  return `<section class="about" id="sobre">
    ${heading(2, T('about'))}
    <div class="about-grid">
      <p class="about-text" data-reveal>${esc(L(t.about))}</p>
      <div class="side">
        ${photo('about-photo')}
        <div class="term mono" data-reveal style="--r:1.5deg">
          <p class="term-bar" aria-hidden="true"><i></i><i></i><i></i></p>
          ${line('whoami', t.name.toLowerCase())}${line(`cat ${T('f_role')}`, L(t.role))}${line(`cat ${T('f_where')}`, t.location)}${line(`cat ${T('f_langs')}`, L(t.languages))}
          <p><span class="prompt">$</span> <span class="caret" aria-hidden="true"></span></p>
        </div>
        ${drawings(2, 4)}
      </div>
    </div>
  </section>`;
}

function work() {
  const stub = (period, title, sub, text, i, small = false) => `<li class="stub${small ? ' small' : ''}" style="--r:${tilt(i) / 2}deg" data-reveal>
    <p class="period mono">${esc(period)}</p><h3 class="display">${esc(title)}</h3>${sub ? `<p class="role">${esc(sub)}</p>` : ''}${text ? `<p>${esc(text)}</p>` : ''}</li>`;
  return `<section class="work" id="experiencia">
    ${heading(3, T('work'))}
    <div class="timeline">
      <svg class="stroke line" viewBox="0 0 10 100" preserveAspectRatio="none" aria-hidden="true" data-reveal><path pathLength="1" d="M5 0 V100"/></svg>
      <ol>${DATA.badges.map((b, i) => stub(L(b.period), b.name, L(b.role), L(b.text), i + 2)).join('')}</ol>
    </div>
    <h3 class="sub display" data-reveal>${T('school')}</h3>
    <ol class="school">${DATA.education.map((e, i) => stub(L(e.period), e.name, L(e.course), '', i + 4, true)).join('')}</ol>
  </section>`;
}

function skills() {
  const techs = [...new Set(DATA.projects.flatMap((p) => p.stack))];
  return `<section class="skills" id="habilidades">
    ${heading(4, T('skills'), T('skills_lead'))}
    <div class="skills-grid">
      <div class="panel mono" data-reveal>${DATA.moves.map((m) => `<div class="move" style="--c:var(--${TYPE_COLOR[m.type] ?? 'paper'})">
        <p class="move-name">${esc(m.name)}</p>
        <p class="bar" role="img" aria-label="${T('power')}: ${m.power}/100"><i style="--p:${m.power}%"></i></p>
        <p class="years">${T('years', { n: m.years })}</p>
        <p class="move-text">${esc(L(m.text))}</p>
      </div>`).join('')}</div>
      <ul class="cloud" aria-label="Stack">${techs.map((s, i) => `<li class="chip c-${techColor(s)}" style="--r:${tilt(i) * 2}deg">${esc(s)}</li>`).join('')}</ul>
    </div>
  </section>`;
}

function games() {
  if (!SITE.games.length) return '';
  const media = (src) => (/\.glb$/i.test(src) ? `<div class="obj3d game-3d" data-3d="${esc(src)}" aria-hidden="true"></div>`
    : /\.(mp4|webm)$/i.test(src) ? `<video src="${esc(src)}" muted loop playsinline autoplay></video>`
      : `<img src="${esc(src)}" alt="" loading="lazy">`);
  return `<section class="games" id="jogos">
    ${heading(5, T('games'))}
    <div class="game-grid">${SITE.games.map((g, i) => `<article class="game paper" style="--r:${tilt(i)}deg" data-reveal>
      ${media(g.media)}<h3 class="display">${esc(g.name)}</h3><p>${esc(L(g.text))}</p>
      ${g.link ? `<p class="links"><a href="${esc(g.link)}"${ext(g.link)}>${T('live')} <span aria-hidden="true">↗</span></a></p>` : ''}
    </article>`).join('')}</div>
  </section>`;
}

const contact = () => `<section class="contact" id="contato">
  <p class="sec-num pixel" aria-hidden="true">${String(SITE.games.length ? 6 : 5).padStart(2, '0')}</p>
  <h2 class="display" data-reveal>${esc(T('contact_title'))}</h2>
  <p class="lead" data-reveal>${esc(T('contact_lead'))}</p>
  <ul class="contact-links">${DATA.contact.map((c, i) => `<li data-reveal style="--i:${i}"><a class="big" href="${esc(c.url)}"${ext(c.url)}>
    <span class="display">${esc(c.label)}</span><span class="mono">${esc(c.url.replace(/^(mailto:|https?:\/\/(www\.)?)/, '').replace(/\/$/, ''))}</span></a></li>`).join('')}</ul>
  <div class="cast" data-cast="contact" aria-hidden="true"></div>
</section>`;

const footer = () => `<footer class="foot mono">
  <a class="btn btn-orange" href="${PLAY_URL}">${T('play_long')} <span aria-hidden="true">▶</span></a>
  <p>${esc(T('footer'))}</p>
  <p><a href="https://github.com/thxcabra/portfolio" target="_blank" rel="noopener">${T('source')} <span aria-hidden="true">↗</span></a></p>
</footer>`;

const viewer = () => `<dialog class="viewer">
  <p class="v-bar"><span class="v-count mono"></span><button class="v-close lang" type="button">${T('close')} ✕</button></p>
  <img alt="">
  <p class="v-nav"><button class="v-prev lang" type="button" aria-label="${T('prev')}">←</button><button class="v-next lang" type="button" aria-label="${T('next')}">→</button></p>
</dialog>`;

// ---------- the pictures of a project, in a <dialog> ----------
let shots = { p: null, k: 0 };
function showShot(k) {
  const d = document.querySelector('.viewer'), p = shots.p;
  shots.k = (k + p.shots.length) % p.shots.length;
  const img = d.querySelector('img');
  img.src = p.shots[shots.k];
  img.alt = `${p.name}, ${T('shot_of', { i: shots.k + 1, n: p.shots.length })}`;
  d.querySelector('.v-count').textContent = `${p.name} · ${T('shot_of', { i: shots.k + 1, n: p.shots.length })}`;
  d.querySelector('.v-nav').hidden = p.shots.length < 2;
}

// ---------- motion ----------
function reveal() {
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    io.unobserve(e.target);
  }), { rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));
  cleanup.push(() => io.disconnect());
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

function typeCode() {
  const code = document.querySelector('.code-card code');
  if (reduced() || !code) return;
  const skip = typewrite(code, 38);
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
  document.body.innerHTML = top() + `<main>${hero()}${ticker()}${projects()}${about()}${work()}${skills()}${games()}${contact()}</main>` + footer() + viewer();
  reveal();
  tiltCards();
  typeCode();
}

document.documentElement.classList.add('js');
addEventListener('click', (e) => {
  const t = e.target;
  if (t.closest('.lang:not(.v-close, .v-prev, .v-next)')) {
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
  if (t.closest('nav a')) document.querySelector('nav').classList.remove('open');
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
```

- [ ] **Passo 5: `site/site.css`**, com as cores, as quatro famílias e os materiais. Estrutura (código completo no arquivo):
  - **Base:** tokens (`:root` com as 5 cores, `--display/--body/--mono`, `--gap`, `--page: min(1200px, 100% - 2*var(--gap))`, `--top: 4rem`).
    - `@font-face` da Gen3 em `../assets/font/gen3.woff`.
    - Fundo preto com grade de pontos fixa (`body::before`, `radial-gradient` 26 px).
    - `overflow-x: clip` no `body`; foco visível verde; link de pular.
  - **Topo:** fixo, translúcido com `backdrop-filter`. Abaixo de 860 px as âncoras viram menu (`nav.open ul`).
  - **Botões:** `.btn-orange` (laranja, texto preto, sombra sólida papel) e `.btn-line`.
  - **Abertura:** grade de 1 coluna, 2 a partir de 1000 px (`1.1fr 1fr`).
    - `.name` em Unbounded 900 com `clamp(3.2rem, 11vw, 9.5rem)`, o sobrenome vazado com `-webkit-text-stroke` laranja.
    - O `.stage` quadrado, com as peças em `position: absolute` e porcentagens.
  - **Materiais:**
    - `.paper`.
    - `.tape::before` (fita translúcida verde) e `.tape-o` (laranja).
    - `.sticker` (contorno papel com `drop-shadow` em 4 direções).
    - `.pixel-img` (`image-rendering: pixelated`).
    - `.code-card` (mono; `.kw` roxo, `.k` `#9a3a0b`, `.s` `#0f7a41`, `.n` roxo).
  - **Faixa:** `.ticker` laranja, girada −2°, `@keyframes ticker` de 0 a −50% em 40 s.
  - **Projetos:** grade de 1 coluna, 2 a partir de 820 px, com as pares descidas 5 rem.
    - `.project` com `transform: perspective(900px) rotate(var(--r)) rotateX(var(--rx,0)) rotateY(var(--ry,0))`.
    - Materiais `.m-paper/.m-purple/.m-green/.m-orange/.m-data`.
    - `.shot` saindo do topo da peça (`margin-top: -2.25rem`) com o print em `aspect-ratio: 16/10`.
    - `.mon` (64×64, `background-size: 64px 128px`, alterna os 2 quadros com `steps(1)`).
    - `.chips` e `.chip.c-*`; `.langbar` com segmentos `.l0–.l3`.
  - **Sobre:** 2 colunas a partir de 900 px; `.term` (barra com 3 bolinhas nas cores, `.prompt` laranja, `.out` verde, `.caret` piscando, sombra sólida roxa).
  - **Experiência:**
    - Linha central `.timeline .line` (verde, desenha ao entrar).
    - `.stub` em papel com os picotes laterais (máscara de dois `radial-gradient`).
    - 2 colunas a partir de 900 px, as pares descidas 4 rem.
  - **Habilidades:** `.panel` em grade de dados (linhas de 20 px); `.move` em 3 colunas (`8.5rem 1fr 4.5rem`); `.bar i` com `width: var(--p)`, cor `--c`, que cresce ao entrar; `.cloud` de etiquetas giradas.
  - **Contato:** faixa roxa de ponta a ponta (`box-shadow: 0 0 0 100vmax var(--purple); clip-path: inset(0 -100vmax)`) e `.big` (papel, sombra sólida preta, laranja ao passar o mouse).
  - **Rodapé:** e o `dialog.viewer` com `::backdrop`.
  - **Movimento** só dentro de `@media (prefers-reduced-motion: no-preference)`:
    - `[data-reveal]` começa com `opacity: 0; translate: 0 2rem` e `.in` leva ao lugar, com atraso `calc(var(--i, 0) * 80ms)`.
    - Os traços SVG desenham de `stroke-dashoffset: 1` a `0`.
    - `.sticker` entra com `slap`.
    - A faixa e o `.mon` só se movem aqui.

- [ ] **Passo 6: contraste no `check.mjs`**, lendo as cores do próprio `site/site.css`:

```js
// the landing page's colours (site/site.css): text pairs keep WCAG AA contrast
const css = readFileSync(here0('site/site.css'), 'utf8');
const tok = (n) => css.match(new RegExp(`--${n}:\\s*(#[0-9a-fA-F]{6})`))[1];
const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
for (const [fg, bg] of [['paper', 'ink'], ['ink', 'orange'], ['ink', 'green'], ['paper', 'purple'], ['orange', 'ink'], ['green', 'ink'], ['ink', 'paper']]) {
  assert.ok(contrast(tok(fg), tok(bg)) >= 4.5, `contraste ${fg} sobre ${bg}: ${contrast(tok(fg), tok(bg)).toFixed(2)}`);
}
```

(A regex usa `\\s` dentro de template string. Escrever essa linha com a ferramenta de edição, não com heredoc.)

- [ ] **Passo 7:** `node check.mjs` e `node tools/e2e.mjs` passam.
- [ ] **Passo 8: verificação visual.** Capturas da página inteira a 1440×900 e a 390×844@3, rolando até o fim antes (para disparar as revelações). Conferir:
  - Ninguém se sobrepõe ao texto.
  - Os prints aparecem.
  - Os botões estão legíveis.
  - Não há rolagem horizontal.
- [ ] **Passo 9: commit** `feat(lp): a landing page com todo o conteúdo`.

### Tarefa 4: o elenco

**Arquivos:** criar `site/cast.js`; modificar `site/main.js`, `site/site.css`.

**Interfaces:** `mountCast(root: Element, kinds: string[], { reduced: boolean }): () => void`. Os tipos são `'blob' | 'star' | 'circle' | 'squiggle'`. Retorna a função que desmonta. `defs()` devolve o `<svg>` escondido com os filtros, inserido uma vez no `body`.

- [ ] **Passo 1: `site/cast.js`**

```js
// The cast: shapes with eyes, each of a different material: a flat orange circle, a green star of grainy
// paper, a glossy purple blob and a pencil-line squiggle. Their pupils follow the pointer (the last tap on
// touch screens; idle, they look around) and they blink now and then. One loop serves every cast on the
// page and only moves the eyes on screen.
const BODIES = {
  circle: '<circle class="b-circle" cx="100" cy="100" r="88"/>',
  star: '<path class="b-star" d="M100 10 L124 72 L190 76 L138 116 L156 182 L100 144 L44 182 L62 116 L10 76 L76 72 Z"/>',
  blob: '<path class="b-blob" d="M104 12 C150 10 190 46 188 98 C186 150 150 190 98 188 C46 186 10 152 14 100 C18 52 58 14 104 12 Z"/>',
  squiggle: '<path class="b-squiggle" d="M18 128 C34 52 76 44 90 104 S 140 176 162 98 S 192 44 184 70"/>',
};
const EYES = { circle: [[74, 92], [126, 92]], star: [[84, 104], [116, 104]], blob: [[78, 88], [128, 92]], squiggle: [[78, 58], [106, 56]] };
const R = { circle: 15, star: 11, blob: 17, squiggle: 11 };   // eye radius

// The grain and gloss, once per page.
export const defs = () => `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
  <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="7"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .55 0"/><feComposite in2="SourceGraphic" operator="in" result="g"/><feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="g"/></feMerge></filter>
  <radialGradient id="gloss" cx=".34" cy=".3" r=".8"><stop offset="0" stop-color="#c3b0ff"/><stop offset=".42" stop-color="#6a3bf0"/><stop offset="1" stop-color="#26105f"/></radialGradient>
</defs></svg>`;

function char(kind) {
  const r = R[kind];
  const eyes = EYES[kind].map(([x, y]) => `<g transform="translate(${x} ${y})"><g class="eye" style="--blink:${(3.5 + Math.random() * 4).toFixed(2)}s;--delay:${(-Math.random() * 6).toFixed(2)}s">
    <ellipse class="white" rx="${r}" ry="${r * 1.15}"/><circle class="pupil" r="${r * 0.5}"/></g></g>`).join('');
  return `<svg class="char char-${kind}" viewBox="0 0 200 200">${BODIES[kind]}${eyes}</svg>`;
}

const eyes = new Set();     // { pupil, max, x, y, on }
let target = null, lastMove = 0, raf = 0, wander = 0;
function frame(now) {
  raf = requestAnimationFrame(frame);
  if (now - lastMove > 4000 && now > wander) {   // idle: look somewhere else every so often
    target = { x: Math.random() * innerWidth, y: Math.random() * innerHeight };
    wander = now + 1400 + Math.random() * 1600;
  }
  if (!target) return;
  for (const e of eyes) {
    if (!e.on) continue;
    const b = e.pupil.parentNode.getBoundingClientRect();
    const dx = target.x - (b.left + b.width / 2), dy = target.y - (b.top + b.height / 2);
    const d = Math.hypot(dx, dy) || 1, reach = Math.min(e.max, d / 40);
    e.x += ((dx / d) * reach - e.x) * 0.2;
    e.y += ((dy / d) * reach - e.y) * 0.2;
    e.pupil.setAttribute('transform', `translate(${e.x.toFixed(2)} ${e.y.toFixed(2)})`);
  }
}
const follow = (ev) => { target = { x: ev.clientX, y: ev.clientY }; lastMove = performance.now(); };
addEventListener('pointermove', follow, { passive: true });
addEventListener('pointerdown', follow, { passive: true });

export function mountCast(root, kinds, { reduced }) {
  root.innerHTML = kinds.map(char).join('');
  if (reduced) return () => {};
  const mine = [...root.querySelectorAll('.pupil')].map((pupil) => ({ pupil, max: Number(pupil.getAttribute('r')) * 0.9, x: 0, y: 0, on: false }));
  const io = new IntersectionObserver(([e]) => mine.forEach((m) => { m.on = e.isIntersecting; }));
  io.observe(root);
  mine.forEach((m) => eyes.add(m));
  if (!raf) raf = requestAnimationFrame(frame);
  return () => {
    io.disconnect();
    mine.forEach((m) => eyes.delete(m));
    if (!eyes.size) { cancelAnimationFrame(raf); raf = 0; }
  };
}
```

- [ ] **Passo 2: ligar em `main.js`** (import `{ mountCast, defs }`). Em `render()`, depois de montar o HTML:

```js
  document.body.insertAdjacentHTML('afterbegin', defs());
  const casts = { hero: ['blob', 'star', 'circle', 'squiggle'], contact: ['circle', 'star', 'blob'], mark: ['circle'] };
  document.querySelectorAll('[data-cast]').forEach((el) => cleanup.push(mountCast(el, casts[el.dataset.cast], { reduced: reduced() })));
```

- [ ] **Passo 3: CSS do elenco** em `site.css`:
  - Corpos: `.b-circle { fill: var(--orange) }`; `.b-star { fill: var(--green); filter: url(#grain); stroke: var(--ink); stroke-width: 5; stroke-linejoin: round }`; `.b-blob { fill: url(#gloss) }`; `.b-squiggle { fill: none; stroke: var(--paper); stroke-width: 9; stroke-linecap: round }`.
  - Olhos: `.white { fill: var(--paper); stroke: var(--ink); stroke-width: 3 }`; `.pupil { fill: var(--ink) }`.
  - Piscar: `.eye { transform-box: fill-box; transform-origin: center }` e, sem movimento reduzido, `animation: blink var(--blink) var(--delay) infinite` (escala Y 1 → 0,1 → 1 entre 94% e 100%).
  - `.char:hover` com `squish` (escala 1,1×0,88 → 0,94×1,06 → 1).
  - Posições por elenco: `[data-cast=hero] .char-blob { width: 60%; right: 0; top: 8% }` e as demais; o de contato no canto inferior direito; o da marca com 2,25 rem.
- [ ] **Passo 4: e2e** (no bloco da landing page): `assert.equal(await ev("document.querySelectorAll('[data-cast=hero] .char').length"), 4)`.
- [ ] **Passo 5:** testes passam; capturas olhadas; **commit** `feat(lp): o elenco de formas com olhos`.

### Tarefa 5: o objeto 3D

**Arquivos:** criar `site/scene3d.js`; modificar `site/main.js`, `site/site.css`.

**Interfaces:** `mount3d(el: Element, { reduced: boolean, model?: string }): () => void`. Carrega o `three` pelo mapa de importação quando `el` chega perto da tela; sem WebGL ou sem rede, o espaço fica vazio, sem erro.

- [ ] **Passo 1: `site/scene3d.js`**

```js
// The low poly piece: an icosahedron with flat faces in the page's colours and ink edges, turning slowly
// and leaning towards the pointer; or one of João's .glb models. three.js loads only when the piece is
// about to be on screen, and the loop stops while it is off screen.
const COLORS = ['#ff6a1f', '#6a3bf0', '#2bd67b', '#f4eee3'];

export function mount3d(el, { reduced, model = '' }) {
  let stop = () => {};
  const io = new IntersectionObserver(async ([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    try {
      const THREE = await import('three');
      stop = start(THREE, el, reduced, model ? await loadModel(model) : null);
    } catch { /* no WebGL or no network: the space stays empty */ }
  }, { rootMargin: '300px' });
  io.observe(el);
  return () => { io.disconnect(); stop(); };
}

async function loadModel(src) {
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
  return (await new GLTFLoader().loadAsync(src)).scene;
}

function start(THREE, el, reduced, model) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  el.append(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.z = 6.5;
  scene.add(new THREE.AmbientLight(0xffffff, 1.1));
  const sun = new THREE.DirectionalLight(0xffffff, 2.4);
  sun.position.set(3, 4, 5);
  scene.add(sun);

  let piece = model;
  if (!piece) {
    const geo = new THREE.IcosahedronGeometry(1.7, 0);
    const colors = [];
    for (let f = 0; f < geo.attributes.position.count / 3; f++) {
      const c = new THREE.Color(COLORS[f % COLORS.length]);
      for (let v = 0; v < 3; v++) colors.push(c.r, c.g, c.b);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    piece = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.55 }));
    piece.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: 0x0e0c12 })));
  } else {
    const box = new THREE.Box3().setFromObject(piece);
    const size = box.getSize(new THREE.Vector3()).length() || 1;
    piece.scale.setScalar(3.4 / size);
    piece.position.sub(box.getCenter(new THREE.Vector3()).multiplyScalar(3.4 / size));
  }
  scene.add(piece);

  const size = () => {
    const w = el.clientWidth || 1, h = el.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(() => { size(); if (reduced) renderer.render(scene, camera); });
  ro.observe(el);
  size();
  if (reduced) {
    piece.rotation.set(0.4, 0.6, 0);
    renderer.render(scene, camera);
    return () => { ro.disconnect(); renderer.dispose(); };
  }

  let lean = { x: 0, y: 0 }, on = true, raf = 0;
  const point = (e) => { lean = { x: (e.clientY / innerHeight - 0.5) * 0.8, y: (e.clientX / innerWidth - 0.5) * 0.8 }; };
  addEventListener('pointermove', point, { passive: true });
  const seen = new IntersectionObserver(([e]) => { on = e.isIntersecting; });
  seen.observe(el);
  const loop = (t) => {
    raf = requestAnimationFrame(loop);
    if (!on) return;
    piece.rotation.x += (lean.x + Math.sin(t / 2400) * 0.3 - piece.rotation.x) * 0.04;
    piece.rotation.y = t / 4000 + lean.y;
    renderer.render(scene, camera);
  };
  raf = requestAnimationFrame(loop);
  return () => {
    cancelAnimationFrame(raf);
    removeEventListener('pointermove', point);
    seen.disconnect();
    ro.disconnect();
    renderer.dispose();
  };
}
```

- [ ] **Passo 2: ligar em `main.js`** (import `{ mount3d }`), em `render()`:

```js
  document.querySelectorAll('[data-3d]').forEach((el) => cleanup.push(mount3d(el, { reduced: reduced(), model: el.dataset['3d'] })));
```

- [ ] **Passo 3:** CSS `.obj3d canvas { width: 100%; height: 100%; display: block }` e a posição no palco (`.stage .obj3d { width: 36%; aspect-ratio: 1; left: 30%; top: -2% }`).
- [ ] **Passo 4:** testes passam (o e2e já cobre "nenhum erro no console" com o 3D carregando); capturas mostram o objeto; **commit** `feat(lp): objeto low poly em 3D`.

### Tarefa 6: acabamento, celular e README

**Arquivos:** `site/site.css`, `site/main.js`, `README.md`.

- [ ] **Passo 1:** capturas da página inteira a 1440×900, 1024×768 e 390×844@3, uma com movimento reduzido. Corrigir o que estiver errado. Critérios:
  - Nenhuma peça cobre texto.
  - No celular, o palco mostra menos peças e maiores (esconder `.char-squiggle` e `.char-star` abaixo de 600 px).
  - Contraste e foco visíveis.
  - Os prints não distorcem.
  - O topo não cobre o título das seções ao navegar pelas âncoras (`scroll-padding-top`).
- [ ] **Passo 2:** `README.md` ganha um item: a landing page (`lp.html`, `site/`) e o `tools/github_stats.mjs`, na lista de recursos e na estrutura.
- [ ] **Passo 3:** testes passam; **commit** `feat(lp): acabamento da landing page`; **push** para `main` (a página fica em `/portfolio/lp`, sem link). Conferir no ar.

### Tarefa 7: README do perfil (repositório `thxcabra/thxcabra`)

**Arquivos (no outro repositório):**
- criar `tools/art.py`, `assets/banner.svg`, `assets/stack.svg`, `assets/gba.png`;
- modificar `README.md`.

- [ ] **Passo 1: `tools/art.py`** (Python, stdlib e fontTools).
  - **Fontes:** baixa as fontes originais do Google Fonts (Unbounded e JetBrains Mono, licença OFL) para uma pasta temporária e converte os textos em caminhos SVG com `fontTools.pens.svgPathPen.SVGPathPen`. O GitHub não carrega fontes de fora num SVG.
  - **`assets/banner.svg`** (1200×300):
    - fundo preto com grade de pontos;
    - "JOÃO CABRAL" (o sobrenome vazado em laranja);
    - a linha do cargo em mono verde;
    - os quatro personagens com os mesmos caminhos de `site/cast.js`;
    - olhos que piscam e olham em volta com `@keyframes` dentro do próprio SVG.
  - **`assets/stack.svg`:** as tecnologias do README em etiquetas nas três cores.
- [ ] **Passo 2: `assets/gba.png`** em APNG.
  - Quadros capturados do GBA local por CDP (sala → andar até o PC → Box abrindo), em 2× sem suavização, a ~10 quadros por segundo.
  - O codificador APNG usa só `zlib` e `struct`, num script descartável fora do repositório.
- [ ] **Passo 3: `README.md`.**
  - Ordem: banner; o texto do João; links em texto (landing page, jogar o GBA, LinkedIn, e-mail); o GBA animado levando ao jogo; "What I do" e a tabela de projetos, mantidos; `stack.svg` no lugar dos shields; a frase final.
  - Saem o typing-svg e os shields.io.
- [ ] **Passo 4:** conferir a renderização (o README em HTML via `gh api markdown`, aberto no Edge headless); **commit e push** no `thxcabra/thxcabra`.

### Tarefa 8: a troca, preparada sem merge

**Branch local `troca-lp`**, a partir de `main`, sem push e sem merge até o João aprovar.

- [ ] **Passo 1:** `git switch -c troca-lp`; `git mv index.html jogar.html`; `git mv lp.html index.html`; em `site/main.js`, `PLAY_URL = 'jogar'`.
- [ ] **Passo 2: GBA.**
  - O botão SIMPLES vira SITE: `label(t('site_label'), …)` e `btn('site', …)` nos dois consoles.
  - Clicar faz `location.href = './'`; textos `site_label` em `DATA.ui` ('SITE'/'SITE').
  - Saem `simple.js`, o CSS `.simple*`, o `openSimple`/`closeSimple`, a rota `#/simples` em `gba.js` e os textos `simple_*` que ficarem sem uso.
- [ ] **Passo 3: testes.**
  - No `tools/e2e.mjs` e no `tools/shots.mjs`, as navegações do GBA passam de `${BASE}?…` para `${BASE}jogar.html?…`, e as da landing page de `lp.html` para a raiz.
  - Sai o passo da versão simples. Entra um passo: o botão SITE do GBA leva a `./`.
  - O e2e confere `PLAY_URL === 'jogar'`.
- [ ] **Passo 4:** metatags. O `jogar.html` mantém as do jogo, com `og:url` em `/portfolio/jogar`; o `index.html` fica com as da landing page. O `README.md` descreve a nova estrutura.
- [ ] **Passo 5:** `node check.mjs` e `node tools/e2e.mjs` passam; **commit** `feat: a landing page na entrada e o GBA em /jogar` no branch. Sem push.
