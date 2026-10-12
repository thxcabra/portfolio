# Pokédex Portfolio — Base — Plano de implementação

**Objetivo:** construir o sub-projeto 1 da spec: a Pokédex navegável (desktop + celular), com todas as seções preenchidas com placeholder, PT/EN, shiny, VISTOS e sons.

**Arquitetura:** página única estática. `index.html` tem só os contêineres; `app.js` desenha a carcaça (SVG em grade de pixel), monta cada tela a partir do `data.js` e cuida de rotas (`#/...`), teclado, toque e sons. Tudo é desenhado em "pixels de jogo" e ampliado com `zoom` inteiro em pixels físicos.

**Stack:** HTML, CSS, JS (ES modules), sem dependências. Node 24 só para o `check.mjs`. Edge headless + `python -m http.server` para screenshots de verificação.

**Spec:** `docs/specs/2026-10-11-pokedex-portfolio-design.md`

## Restrições globais

- Zero dependências, zero build. Abre com qualquer servidor estático.
- Só `data.js` tem conteúdo; `app.js` não tem texto de interface fixo (tudo via `DATA.ui`).
- Todo texto de conteúdo em PT e EN.
- Escala: inteira em pixels físicos (`floor(espaço × dpr / grade) / dpr`), mínimo 1.
- Layout DS quando a janela é retrato ou quando o aparelho não cabe em escala ≥ 2.
- Texto corrido do painel ≥ 16px reais (9px de jogo × escala ≥ 2).
- Todo clicável é `<a>` ou `<button>`; sprites com `alt`; `prefers-reduced-motion` desliga animações.
- Commits como `João Cabral <joaovcabralm@hotmail.com>` (config local).

## Arquivos

| Arquivo | Responsabilidade |
|---|---|
| `assets/sprites/` | Sprites extraídos do tar (`firered-leafgreen/`, `emerald/`, `ruby-sapphire/`) |
| `app.js` | Funções puras exportadas (rotas, sprites, cursor, formas pixel) + `boot()` com toda a parte de DOM |
| `data.js` | Conteúdo e textos de interface (PT/EN) |
| `check.mjs` | Testes da lógica pura + validação do `data.js` |
| `index.html` | Contêineres `#screen`, `#panel`, botão B |
| `style.css` | Aparelho, interface Gen 3, layout DS, transições |

---

### Task 1: Sprites + lógica pura

**Files:**
- Create: `assets/sprites/**` (extração)
- Create: `check.mjs`
- Create: `app.js` (só as exportações puras nesta task)

**Interfaces produzidas:**
- `parseRoute(hash: string, counts: {dex: number, badges: number}) → {view: 'intro'|'menu'|'dex'|'entry'|'card'|'badges'|'moves'|'contact'|'options', i: number|null}`
- `parent(route) → string|null` (hash para onde o B volta)
- `spritePath(dex: number, {shiny?: boolean, animated?: boolean}) → string`
- `nextIndex(cur, len, cols, dx, dy) → number`
- `fitScale(w, h, W, H, dpr) → number` (px CSS por pixel de jogo)
- `discPath(x, y, d) → string` e `rrectPath(x, y, w, h, ins = [2, 1]) → string` (paths SVG)
- `TYPES: string[]` (17 tipos Gen 3), `SHAPES: string[]` (8 insígnias)

- [ ] **Step 1: Extrair os sprites**

```bash
mkdir -p assets/sprites
tar -xzf pokedex/generation-3.tar.gz -C assets/sprites --strip-components=2
ls assets/sprites
```
Esperado: `emerald  firered-leafgreen  ruby-sapphire`

- [ ] **Step 2: Escrever o teste que falha**

`check.mjs`:
```js
import assert from 'node:assert/strict';
import { parseRoute, parent, spritePath, nextIndex, fitScale, discPath, rrectPath } from './app.js';

// routes
const R = (h) => parseRoute(h, { dex: 8, badges: 3 });
const at = (view, i = null) => ({ view, i });
assert.deepEqual(R(''), at('intro'));
assert.deepEqual(R('#/'), at('intro'));
assert.deepEqual(R('#/menu'), at('menu'));
assert.deepEqual(R('#/dex'), at('dex'));
assert.deepEqual(R('#/dex/3'), at('entry', 3));
assert.deepEqual(R('#/dex/8'), at('entry', 8));
assert.deepEqual(R('#/dex/9'), at('menu'));
assert.deepEqual(R('#/dex/0'), at('menu'));
assert.deepEqual(R('#/dex/abc'), at('menu'));
assert.deepEqual(R('#/dex/1.5'), at('menu'));
assert.deepEqual(R('#/badges'), at('badges'));
assert.deepEqual(R('#/badges/2'), at('badges', 2));
assert.deepEqual(R('#/badges/4'), at('menu'));
for (const v of ['card', 'moves', 'contact', 'options']) assert.deepEqual(R(`#/${v}`), at(v));
assert.deepEqual(R('#/foo'), at('menu'));
assert.deepEqual(R('#/menu/2'), at('menu'));

assert.equal(parent(at('entry', 2)), '#/dex');
assert.equal(parent(at('dex')), '#/menu');
assert.equal(parent(at('badges', 1)), '#/menu');
assert.equal(parent(at('menu')), null);
assert.equal(parent(at('intro')), null);

// sprites
assert.equal(spritePath(6), 'assets/sprites/firered-leafgreen/6.png');
assert.equal(spritePath(6, { shiny: true }), 'assets/sprites/firered-leafgreen/shiny/6.png');
assert.equal(spritePath(250), 'assets/sprites/emerald/250.png');
assert.equal(spritePath(250, { shiny: true }), 'assets/sprites/emerald/shiny/250.png');
assert.equal(spritePath(6, { animated: true }), 'assets/sprites/emerald/animated/6.gif');
assert.equal(spritePath(250, { shiny: true, animated: true }), 'assets/sprites/emerald/animated/shiny/250.gif');

// cursor
assert.equal(nextIndex(-1, 5, 1, 0, 1), 0);
assert.equal(nextIndex(0, 5, 1, 0, -1), 0);
assert.equal(nextIndex(4, 5, 1, 0, 1), 4);
assert.equal(nextIndex(1, 5, 1, 1, 0), 2);
assert.equal(nextIndex(1, 8, 4, 0, 1), 5);
assert.equal(nextIndex(5, 8, 4, 0, -1), 1);
assert.equal(nextIndex(0, 3, 4, 0, 1), 0);

// scale: integer in physical pixels
assert.equal(fitScale(576, 320, 1888, 1048, 1), 3);
assert.equal(fitScale(576, 320, 1334, 736, 1), 2);
assert.equal(fitScale(240, 160, 358, 380, 3), 4 / 3);
assert.equal(fitScale(576, 320, 100, 100, 1), 1);

// pixel shapes
const widths = (d) => [...d.matchAll(/h(\d+)/g)].map((m) => +m[1]);
assert.deepEqual(widths(discPath(0, 0, 8)), [4, 6, 8, 8, 8, 8, 6, 4]);
assert.equal(rrectPath(0, 0, 10, 6), 'M2 0h6v1h-6zM2 5h6v1h-6zM1 1h8v1h-8zM1 4h8v1h-8zM0 2h10v2h-10z');
assert.equal(rrectPath(0, 0, 4, 2, []), 'M0 0h4v2h-4z');

console.log('check ok');
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `node check.mjs`
Esperado: FAIL — `Cannot find module ... app.js`

- [ ] **Step 4: Implementação mínima**

`app.js`:
```js
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

function boot() {}
```

E um `data.js` mínimo para o import resolver (substituído na Task 2):
```js
export const DATA = {};
```

- [ ] **Step 5: Rodar e ver passar**

Run: `node check.mjs`
Esperado: `check ok`

- [ ] **Step 6: Commit**

```bash
git add assets app.js data.js check.mjs
git commit -m "feat: sprites da Gen 3 e lógica pura (rotas, sprites, cursor, escala)"
```

---

### Task 2: Conteúdo placeholder + validação

**Files:**
- Modify: `check.mjs` (anexar validação de dados)
- Replace: `data.js`

**Interfaces:**
- Consome: `spritePath`, `TYPES`, `SHAPES` (Task 1)
- Produz: `DATA` com `trainer`, `projects`, `badges`, `moves`, `contact`, `ui.pt`, `ui.en` — formato da spec §13. Chaves de `ui` usadas pelo `app.js`: `press_start, menu_dex, menu_badges, menu_moves, menu_contact, menu_options, help_dex, help_card, help_badges, help_moves, help_contact, help_options, seen, year, shiny, repo, live, trainer_card, id_no, name, time, years, about, badge_empty, type, power, open_hint, language, sound, on, off, help_language, help_sound, back, prev, next`.

- [ ] **Step 1: Escrever a validação (falha com o `DATA = {}` atual)**

Trocar o import do topo do `check.mjs` e anexar antes do `console.log`:
```js
import { existsSync } from 'node:fs';
import { DATA } from './data.js';
import { parseRoute, parent, spritePath, nextIndex, fitScale, discPath, rrectPath, TYPES, SHAPES } from './app.js';
```
```js
// --- content (data.js)
const both = (o, w) => assert.ok(o?.pt?.trim() && o?.en?.trim(), `${w}: falta texto pt ou en`);
const url = (u, w) => assert.match(u, /^(https:\/\/|mailto:)/, `${w}: link precisa começar com https:// ou mailto: (${u})`);
const dex = (n, w) => {
  assert.ok(Number.isInteger(n) && n >= 1 && n <= 386, `${w}: dex ${n} fora de 1–386`);
  for (const o of [{}, { shiny: true }, { animated: true }, { shiny: true, animated: true }]) {
    assert.ok(existsSync(new URL(spritePath(n, o), import.meta.url)), `${w}: sprite não existe (${spritePath(n, o)})`);
  }
};
const { trainer, projects, badges, moves, contact, ui } = DATA;

both(trainer.about, 'trainer.about');
dex(trainer.partner, 'trainer.partner');
assert.ok(Number.isInteger(trainer.since), 'trainer.since precisa ser um ano');

assert.ok(projects.length >= 1, 'precisa de pelo menos 1 projeto');
projects.forEach((p, i) => {
  const w = `projects[${i}] ${p.name}`;
  dex(p.dex, w);
  assert.ok(p.pokemon && p.name && p.year, `${w}: falta pokemon, name ou year`);
  assert.ok(p.types.length >= 1 && p.types.length <= 2 && p.types.every((x) => TYPES.includes(x)), `${w}: types inválidos (${p.types})`);
  assert.ok(Array.isArray(p.stack), `${w}: stack precisa ser lista`);
  both(p.text, w);
  Object.values(p.links || {}).forEach((u) => url(u, w));
});

assert.ok(badges.length <= 8, 'máximo de 8 insígnias');
badges.forEach((b, i) => {
  const w = `badges[${i}] ${b.name}`;
  assert.ok(SHAPES.includes(b.shape), `${w}: shape inválido (${b.shape})`);
  both(b.role, w);
  both(b.text, w);
});

moves.forEach((m, i) => {
  const w = `moves[${i}] ${m.name}`;
  assert.ok(TYPES.includes(m.type), `${w}: type inválido (${m.type})`);
  assert.ok(Number.isInteger(m.power) && Number.isInteger(m.pp), `${w}: power e pp precisam ser inteiros`);
  both(m.text, w);
});

contact.forEach((c, i) => url(c.url, `contact[${i}] ${c.label}`));

const keys = (l) => Object.keys(ui[l]).sort();
assert.deepEqual(keys('pt'), keys('en'), 'ui: pt e en têm chaves diferentes');
for (const l of ['pt', 'en']) for (const [k, v] of Object.entries(ui[l])) assert.ok(String(v).trim(), `ui.${l}.${k} vazio`);
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `node check.mjs`
Esperado: FAIL — `TypeError: Cannot read properties of undefined (reading 'about')`

- [ ] **Step 3: Escrever o `data.js` com placeholder**

```js
// Conteúdo do portfólio. É o único arquivo que precisa ser editado.
// Depois de editar, rode: node check.mjs
//
// Tipos válidos (Gen 3): normal fire water grass electric ice fighting poison
//   ground flying psychic bug rock ghost dragon dark steel
// Sugestão tech -> tipo: JS/TS = electric · Python = psychic · banco de dados = rock
//   infra/DevOps = steel · design/UI = psychic · automação/IA = dragon · mobile = flying
// Formatos de insígnia (máx. 8): boulder cascade thunder rainbow soul marsh volcano earth
// dex: número do Pokémon (1–386). #1–151 usam o sprite do FireRed, o resto o do Emerald.

const lorem = {
  pt: 'Texto de exemplo. Aqui entra a descrição do projeto: qual problema ele resolve, o que você construiu, as decisões técnicas mais interessantes e o resultado que ele trouxe. Duas ou três frases curtas costumam bastar.',
  en: 'Placeholder text. This is where the project description goes: the problem it solves, what you built, the most interesting technical decisions and the outcome. Two or three short sentences are usually enough.',
};

export const DATA = {
  trainer: {
    name: 'JOÃO CABRAL',
    id: '04201',
    since: 2019,
    partner: 25,
    about: {
      pt: 'Texto de exemplo sobre mim. Quem eu sou, com o que trabalho, o que me interessa e o tipo de problema que eu gosto de resolver.',
      en: 'Placeholder text about me. Who I am, what I work with, what I care about and the kind of problem I like to solve.',
    },
  },

  projects: [
    { dex: 6, pokemon: 'CHARIZARD', name: 'Projeto Exemplo 01', types: ['fire', 'flying'], year: 2025, stack: ['TypeScript', 'React', 'Node'], text: lorem, links: { repo: 'https://github.com/', live: 'https://example.com/' } },
    { dex: 25, pokemon: 'PIKACHU', name: 'Projeto Exemplo 02', types: ['electric'], year: 2025, stack: ['JavaScript', 'Chrome Extension'], text: lorem, links: { repo: 'https://github.com/' } },
    { dex: 94, pokemon: 'GENGAR', name: 'Projeto Exemplo 03', types: ['ghost', 'poison'], year: 2024, stack: ['Python', 'Playwright'], text: lorem, links: { repo: 'https://github.com/' } },
    { dex: 131, pokemon: 'LAPRAS', name: 'Projeto Exemplo 04', types: ['water', 'ice'], year: 2024, stack: ['PostgreSQL', 'Supabase'], text: lorem, links: {} },
    { dex: 149, pokemon: 'DRAGONITE', name: 'Projeto Exemplo 05', types: ['dragon', 'flying'], year: 2024, stack: ['Python', 'LLM APIs'], text: lorem, links: { live: 'https://example.com/' } },
    { dex: 254, pokemon: 'SCEPTILE', name: 'Projeto Exemplo 06', types: ['grass'], year: 2023, stack: ['Next.js', 'Tailwind'], text: lorem, links: { repo: 'https://github.com/', live: 'https://example.com/' } },
    { dex: 282, pokemon: 'GARDEVOIR', name: 'Projeto Exemplo 07', types: ['psychic'], year: 2023, stack: ['Figma', 'CSS'], text: lorem, links: {} },
    { dex: 384, pokemon: 'RAYQUAZA', name: 'Projeto Exemplo 08', types: ['dragon', 'flying'], year: 2022, stack: ['Docker', 'Cloudflare'], text: lorem, links: { repo: 'https://github.com/' } },
  ],

  badges: [
    { name: 'EMPRESA EXEMPLO A', shape: 'boulder', period: '2024–hoje', role: { pt: 'Cargo de exemplo', en: 'Example role' }, text: lorem },
    { name: 'EMPRESA EXEMPLO B', shape: 'cascade', period: '2022–2024', role: { pt: 'Cargo de exemplo', en: 'Example role' }, text: lorem },
    { name: 'EMPRESA EXEMPLO C', shape: 'thunder', period: '2019–2022', role: { pt: 'Cargo de exemplo', en: 'Example role' }, text: lorem },
  ],

  moves: [
    { name: 'TYPESCRIPT', type: 'electric', power: 90, pp: 20, text: { pt: 'Exemplo: o que você faz com essa habilidade.', en: 'Example: what you do with this skill.' } },
    { name: 'PYTHON', type: 'psychic', power: 90, pp: 20, text: { pt: 'Exemplo: o que você faz com essa habilidade.', en: 'Example: what you do with this skill.' } },
    { name: 'REACT', type: 'water', power: 80, pp: 15, text: { pt: 'Exemplo: o que você faz com essa habilidade.', en: 'Example: what you do with this skill.' } },
    { name: 'SQL', type: 'rock', power: 75, pp: 15, text: { pt: 'Exemplo: o que você faz com essa habilidade.', en: 'Example: what you do with this skill.' } },
    { name: 'AUTOMAÇÃO', type: 'dragon', power: 100, pp: 10, text: { pt: 'Exemplo: o que você faz com essa habilidade.', en: 'Example: what you do with this skill.' } },
    { name: 'DOCKER', type: 'steel', power: 60, pp: 25, text: { pt: 'Exemplo: o que você faz com essa habilidade.', en: 'Example: what you do with this skill.' } },
  ],

  contact: [
    { label: 'GITHUB', url: 'https://github.com/' },
    { label: 'LINKEDIN', url: 'https://www.linkedin.com/' },
    { label: 'E-MAIL', url: 'mailto:voce@exemplo.com' },
  ],

  ui: {
    pt: {
      press_start: 'APERTE START',
      menu_dex: 'POKéDEX', menu_badges: 'INSÍGNIAS', menu_moves: 'GOLPES', menu_contact: 'POKéNAV', menu_options: 'OPÇÕES',
      help_dex: 'Meus projetos. Cada um é um Pokémon.',
      help_card: 'Quem é o treinador.',
      help_badges: 'Onde trabalhei e o que conquistei.',
      help_moves: 'As habilidades que eu domino.',
      help_contact: 'Fale comigo.',
      help_options: 'Idioma e som.',
      seen: 'VISTOS', year: 'ANO', shiny: 'SHINY!', repo: 'CÓDIGO', live: 'VER AO VIVO',
      trainer_card: 'CARTÃO DE TREINADOR', id_no: 'IDNº', name: 'NOME', time: 'TEMPO', years: 'ANOS', about: 'SOBRE MIM',
      badge_empty: 'Nenhuma insígnia ainda.', type: 'TIPO', power: 'PODER', open_hint: 'Aperte A ou clique para abrir.',
      language: 'IDIOMA', sound: 'SOM', on: 'SIM', off: 'NÃO',
      help_language: 'Troca o idioma do site.', help_sound: 'Liga os bipes da Pokédex.',
      back: 'Voltar', prev: '< ANT', next: 'PRÓX >',
    },
    en: {
      press_start: 'PRESS START',
      menu_dex: 'POKéDEX', menu_badges: 'BADGES', menu_moves: 'MOVES', menu_contact: 'POKéNAV', menu_options: 'OPTION',
      help_dex: 'My projects. Each one is a Pokémon.',
      help_card: 'Who the trainer is.',
      help_badges: 'Where I worked and what I earned.',
      help_moves: 'The skills I know.',
      help_contact: 'Get in touch.',
      help_options: 'Language and sound.',
      seen: 'SEEN', year: 'YEAR', shiny: 'SHINY!', repo: 'CODE', live: 'LIVE',
      trainer_card: 'TRAINER CARD', id_no: 'IDNo.', name: 'NAME', time: 'TIME', years: 'YRS', about: 'ABOUT ME',
      badge_empty: 'No badges yet.', type: 'TYPE', power: 'POWER', open_hint: 'Press A or click to open.',
      language: 'LANGUAGE', sound: 'SOUND', on: 'ON', off: 'OFF',
      help_language: 'Switch the site language.', help_sound: 'Turn the Pokédex beeps on.',
      back: 'Back', prev: '< PREV', next: 'NEXT >',
    },
  },
};
```

- [ ] **Step 4: Rodar e ver passar**

Run: `node check.mjs`
Esperado: `check ok`

- [ ] **Step 5: Provar que a validação morde**

Trocar temporariamente `dex: 6` por `dex: 999` e rodar `node check.mjs`.
Esperado: FAIL `projects[0] Projeto Exemplo 01: dex 999 fora de 1–386`. Desfazer.

- [ ] **Step 6: Commit**

```bash
git add data.js check.mjs
git commit -m "feat: conteúdo placeholder (PT/EN) e validação do data.js"
```

---

### Task 3: A Pokédex (carcaça, telas, controles, intro, shiny, sons)

**Files:**
- Create: `index.html`
- Create: `style.css`
- Modify: `app.js` — substituir `function boot() {}` pela implementação abaixo

**Interfaces:**
- Consome: tudo da Task 1 e `DATA` da Task 2
- DOM: `#screen` (tela esquerda, 240×160), `#panel` (painel direito), `#b-btn`; `#base` e `#lid` recebem a carcaça SVG e os botões físicos
- Atributos: `[data-nav]` = item navegável pelo cursor; `[data-i]` = índice do item; `[data-hw]` = botão físico (`up down left right a b prev next`); `[data-key]` = tecla azul de seção; `[data-opt]` = opção (`lang`, `sound`); `[data-cols]` = largura da grade para o cursor
- `localStorage`: `lang`, `sound`, `seen`
- `?shiny` na URL força todos os projetos shiny (verificação visual e easter egg)

- [ ] **Step 1: `index.html`**

```html
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>João Cabral · Pokédex</title>
  <meta name="description" content="Portfólio de João Cabral em forma de Pokédex.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400;700&display=swap">
  <link rel="stylesheet" href="style.css">
  <script type="module" src="app.js"></script>
</head>
<body class="closed">
  <main class="device">
    <div class="base" id="base">
      <div class="screen" id="screen"></div>
    </div>
    <div class="lid" id="lid">
      <div class="panel" id="panel" tabindex="0"></div>
    </div>
  </main>
  <button type="button" class="b-btn" id="b-btn" data-hw="b" hidden>B</button>
  <noscript>Ative o JavaScript para abrir a Pokédex.</noscript>
</body>
</html>
```

- [ ] **Step 2: `style.css`**

```css
:root {
  --k: 2;
  --ink: #401018;
  --txt: #484848;
  --txt-sh: #d0d0c8;
  --lcd: #0e3b2c;
  --lcd-txt: #c8f0c0;
  --lcd-dim: #78b090;
  --night: #141b2e;
  --night-2: #1a2340;
  --cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 7'%3E%3Cpath d='M0 0h1v1h1v1h1v1h1v1h-1v1h-1v1h-1v1h-1z'/%3E%3C/svg%3E");
  --star: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 7 7'%3E%3Cpath d='M3 0h1v7h-1zM0 3h7v1h-7zM2 2h3v3h-3z'/%3E%3C/svg%3E");
  --t-normal: #a8a878; --t-fire: #f08030; --t-water: #6890f0; --t-grass: #78c850; --t-electric: #f8d030;
  --t-ice: #98d8d8; --t-fighting: #c03028; --t-poison: #a040a0; --t-ground: #e0c068; --t-flying: #a890f0;
  --t-psychic: #f85888; --t-bug: #a8b820; --t-rock: #b8a038; --t-ghost: #705898; --t-dragon: #7038f8;
  --t-dark: #705848; --t-steel: #b8b8d0;
}

* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { height: 100%; }
body {
  display: grid;
  place-items: center;
  overflow: hidden;
  background: var(--night) repeating-conic-gradient(var(--night-2) 0 25%, var(--night) 0 50%) 0 0 / calc(var(--k) * 4px) calc(var(--k) * 4px);
  font-family: 'Pixelify Sans', monospace;
  -webkit-font-smoothing: none;
}
button { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; text-align: inherit; }
a { color: inherit; }
ul { list-style: none; }
img { image-rendering: pixelated; }
noscript { color: #f8f8f8; }

/* ---------- device: everything below is in game pixels, scaled by --k ---------- */
.device { position: relative; width: 576px; height: 320px; zoom: var(--k); transition: translate .5s steps(5); }
.base { position: absolute; inset: 0 auto 0 0; width: 296px; }
.lid { position: absolute; inset: 0 auto 0 296px; width: 280px; transform-origin: left; transition: transform .5s steps(5); }
.closed .device { translate: 24.3%; }
.closed .lid { transform: scaleX(0); }
.shell { position: absolute; inset: 0; shape-rendering: crispEdges; }
.blink { animation: blink 1s steps(1) infinite; }
.glow { animation: glow 2.4s steps(1) infinite; }
@keyframes blink { 50% { opacity: 0; } }
@keyframes glow { 50% { fill: #88e0f8; } }

.hw { position: absolute; }
.hw:not(.key, .pad):hover { background: #fff2; }
.hw:active { translate: 0 1px; }
.round { display: grid; place-items: center; border-radius: 50%; color: #f8f8f8; font-size: 8px; font-weight: 700; }
.key, .pad { display: grid; place-items: center; text-decoration: none; line-height: 1; }
.key { background: #30b8e8; color: #08384c; font-size: 7px; box-shadow: inset 2px 2px 0 #88e0f8, inset -2px -2px 0 #1878a8, 0 0 0 2px #0c2a3a; }
.pad { background: #0f3b2c; color: var(--lcd-txt); font-size: 8px; box-shadow: inset 2px 2px 0 #1e5a44, inset -2px -2px 0 #06160f, 0 0 0 2px #04100a; }
.key:hover, .pad:hover { filter: brightness(1.15); }

/* ---------- left screen (240x160, Gen 3 UI) ---------- */
.screen {
  position: absolute; left: 20px; top: 76px; width: 240px; height: 160px; overflow: hidden;
  background: repeating-linear-gradient(#f8f0d8 0 4px, #f0e6c4 4px 8px);
  box-shadow: 0 0 0 2px #303030;
  color: var(--txt); text-shadow: 1px 1px 0 var(--txt-sh);
  font-size: 10px; line-height: 12px;
  view-transition-name: screen;
}
.scr { position: absolute; inset: 0; }
.bar {
  display: flex; justify-content: space-between; align-items: center; gap: 6px; height: 16px; padding: 0 6px;
  background: #c03028; color: #f8f8f8; text-shadow: 1px 1px 0 #701818; box-shadow: 0 2px 0 #701818;
}
.box { background: #f8f8f8; box-shadow: 0 0 0 1px #f8f8f8, 0 0 0 3px #5888b0, 0 0 0 4px #283848; }
[data-nav] { position: relative; display: block; padding-left: 8px; text-decoration: none; outline: none; }
[data-nav]:focus::before {
  content: ''; position: absolute; left: 1px; top: calc(50% - 3px); width: 4px; height: 7px; background: currentColor;
  -webkit-mask: var(--cursor) 0 0 / 100% 100% no-repeat; mask: var(--cursor) 0 0 / 100% 100% no-repeat;
}
.sprite { display: block; }
.missing { display: grid; place-items: center; width: 64px; height: 64px; font-size: 32px; }
.types { display: flex; gap: 3px; }
.type {
  min-width: 40px; padding: 0 3px; background: var(--c); color: #f8f8f8; text-shadow: 1px 1px 0 #0006;
  font-size: 8px; line-height: 10px; text-align: center; box-shadow: 0 0 0 1px #0006;
}

.intro { display: grid; place-content: center; justify-items: center; gap: 16px; background: #182030; color: #f8f8f8; text-shadow: 1px 1px 0 #000; }
.logo { font-size: 20px; line-height: 24px; font-weight: 700; color: #f8d030; text-shadow: 2px 2px 0 #3060a8; }
.load { width: 120px; height: 6px; box-shadow: 0 0 0 1px #f8f8f8; }
.load i { display: block; width: 0; height: 100%; background: #78c850; animation: load .6s .2s steps(8) forwards; }
@keyframes load { to { width: 100%; } }

.who { position: absolute; left: 8px; top: 8px; width: 104px; padding: 0 4px; white-space: nowrap; overflow: hidden; }
.menu .partner { position: absolute; left: 12px; top: 30px; }
.menu-box { position: absolute; right: 8px; top: 8px; width: 108px; padding: 2px 4px 2px 2px; }
.menu-box a { line-height: 18px; }

.stage { position: absolute; display: grid; place-items: center; background: #f8f8f8; box-shadow: 0 0 0 2px #283848; }
.dex .stage { left: 84px; top: 26px; width: 72px; height: 72px; }
.dex .sprite, .entry .sprite { view-transition-name: sprite; }
.dex-name { position: absolute; left: 16px; right: 16px; top: 112px; text-align: center; }

.entry .stage { left: 8px; top: 24px; width: 100px; height: 100px; }
.entry .info { position: absolute; left: 116px; top: 26px; right: 8px; display: grid; gap: 6px; justify-items: start; }
.shiny { color: #c89000; }
.star, .spark { width: 7px; height: 7px; background: #f8d030; -webkit-mask: var(--star) 0 0 / 100% 100%; mask: var(--star) 0 0 / 100% 100%; }
.star { display: inline-block; }
.spark { position: absolute; opacity: 0; animation: spark .6s steps(3) 2 both; }
@keyframes spark { 50% { opacity: 1; scale: 1.5; } }
.ename { position: absolute; left: 8px; right: 8px; bottom: 8px; padding: 1px 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.tcard { position: absolute; inset: 6px; padding: 4px 8px; background: repeating-linear-gradient(#a8d0f0 0 3px, #98c4e8 3px 6px); box-shadow: 0 0 0 2px #284878; }
.tcard header { font-weight: 700; margin-bottom: 6px; }
.tcard dl { display: grid; grid-template-columns: auto 1fr; gap: 3px 8px; width: 144px; }
.tcard dd { white-space: nowrap; }
.tcard .partner { position: absolute; right: 8px; top: 20px; }
.badge-row { position: absolute; left: 8px; right: 8px; bottom: 6px; display: flex; justify-content: space-between; padding: 3px 6px; background: #284878; }
.badge-row .badge { width: 12px; height: 12px; }

.case { position: absolute; left: 28px; top: 24px; display: grid; grid-template-columns: repeat(4, 40px); gap: 8px; }
.slot { display: grid; place-items: center; width: 40px; height: 40px; padding: 0; background: #384858; box-shadow: inset 2px 2px 0 #202838, 0 0 0 1px #f8f8f8; }
.slot[data-nav]:focus { box-shadow: inset 2px 2px 0 #202838, 0 0 0 2px #f8d030; }
.slot[data-nav]:focus::before { display: none; }
.badge-name { position: absolute; left: 8px; right: 8px; bottom: 8px; padding: 1px 4px; }
.badge { display: block; width: 24px; height: 24px; background: var(--c); clip-path: var(--shape); }
.badge.none { --c: #183058; }
.b-boulder { --c: #a8a8a8; --shape: polygon(30% 0, 70% 0, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0 70%, 0 30%); }
.b-cascade { --c: #6890f0; --shape: polygon(50% 0, 80% 40%, 100% 65%, 85% 95%, 50% 100%, 15% 95%, 0 65%, 20% 40%); }
.b-thunder { --c: #f8a030; --shape: polygon(50% 0, 62% 30%, 100% 20%, 72% 50%, 100% 80%, 62% 70%, 50% 100%, 38% 70%, 0 80%, 28% 50%, 0 20%, 38% 30%); }
.b-rainbow { --c: conic-gradient(#f85888, #f8d030, #78c850, #6890f0, #a040a0, #f85888); --shape: polygon(50% 0, 65% 20%, 100% 35%, 80% 60%, 85% 100%, 50% 85%, 15% 100%, 20% 60%, 0 35%, 35% 20%); }
.b-soul { --c: #f85888; --shape: polygon(50% 100%, 0 45%, 0 15%, 25% 0, 50% 15%, 75% 0, 100% 15%, 100% 45%); }
.b-marsh { --c: radial-gradient(#f8f8f8 0 25%, #f8d030 26%); --shape: polygon(30% 0, 70% 0, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0 70%, 0 30%); }
.b-volcano { --c: #f05030; --shape: polygon(50% 0, 70% 35%, 100% 50%, 85% 100%, 15% 100%, 0 50%, 30% 35%); }
.b-earth { --c: #78c850; --shape: polygon(50% 0, 100% 50%, 50% 100%, 0 50%); }

.scr .list { position: absolute; left: 8px; right: 8px; top: 24px; max-height: 128px; overflow: auto; padding: 2px 4px 2px 2px; scrollbar-width: none; }
.scr .list [data-nav] { display: flex; align-items: center; gap: 6px; width: 100%; line-height: 18px; }
.opts b { margin-left: auto; font-weight: 400; color: #a0a0a0; }
.opts .on { color: #e83030; }

/* ---------- right panel (LCD, the reading area) ---------- */
.panel {
  position: absolute; left: 16px; top: 76px; width: 248px; height: 160px; overflow: auto; overscroll-behavior: contain;
  padding: 6px 8px; background: var(--lcd); color: var(--lcd-txt); outline: none;
  font-size: 9px; line-height: 12px;
  scrollbar-width: thin; scrollbar-color: var(--lcd-dim) transparent;
  view-transition-name: panel;
}
.panel h2 { font-size: 10px; line-height: 14px; font-weight: 700; }
.panel h2 + p, .panel p + p { margin-top: 4px; }
.panel a { text-underline-offset: 2px; }
.panel .list a { display: block; line-height: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dim { color: var(--lcd-dim); }
.links { display: flex; gap: 12px; }
.links [data-nav] { display: inline-block; }
.ball {
  display: inline-block; width: 6px; height: 6px; margin-right: 4px;
  background: linear-gradient(#e83030 0 2px, #303030 2px 3px, #f8f8f8 3px);
  clip-path: polygon(1px 0, 5px 0, 5px 1px, 6px 1px, 6px 5px, 5px 5px, 5px 6px, 1px 6px, 1px 5px, 0 5px, 0 1px, 1px 1px);
}
.ball.off { visibility: hidden; }

/* ---------- transitions ---------- */
::view-transition-old(root), ::view-transition-new(root) { animation: none; }
::view-transition-old(screen), ::view-transition-old(panel) { animation: vt-out .1s steps(2) both; }
::view-transition-new(screen), ::view-transition-new(panel) { animation: vt-in .1s .05s steps(2) both; }
::view-transition-group(sprite) { animation-duration: .3s; animation-timing-function: steps(6); }
@keyframes vt-out { to { opacity: 0; } }
@keyframes vt-in { from { opacity: 0; } }

/* ---------- DS layout: phones, portrait, small windows ---------- */
.b-btn { display: none; }
.ds .device {
  zoom: 1; translate: none; width: 100%; height: 100%;
  display: flex; flex-direction: column; align-items: center; gap: 16px;
  padding: 16px 16px calc(16px + env(safe-area-inset-bottom));
}
.ds .base, .ds .lid { display: contents; }
.ds .shell, .ds .hw { display: none; }
.ds .screen { position: relative; inset: auto; flex: none; zoom: var(--k); }
.ds .panel { position: relative; inset: auto; width: auto; height: auto; align-self: stretch; flex: 1; min-height: 0; zoom: 2; padding-bottom: 36px; box-shadow: 0 0 0 2px #04100a; }
.ds.closed .device { justify-content: center; }
.ds.closed .panel { display: none; }
@media (orientation: landscape) { .ds .device { flex-direction: row; } }
.ds .b-btn:not([hidden]) {
  display: grid; place-items: center; position: fixed; right: 16px; bottom: calc(16px + env(safe-area-inset-bottom));
  width: 56px; height: 56px; border-radius: 50%; background: #982038; color: #f8f8f8;
  font: 700 22px 'Pixelify Sans', monospace; box-shadow: inset -4px -4px 0 #601020, 0 0 0 3px var(--ink);
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
  ::view-transition-group(*), ::view-transition-old(*), ::view-transition-new(*) { animation: none !important; }
  .spark { display: none; }
}
```

- [ ] **Step 3: `boot()` no `app.js`**

Substituir `function boot() {}` por:
```js
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
}
```

- [ ] **Step 4: `node check.mjs` continua passando**

Run: `node check.mjs`
Esperado: `check ok` (o `boot()` não roda no Node).

- [ ] **Step 5: Subir servidor e tirar screenshots**

```bash
python -m http.server 8123   # em background
EDGE="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
OUT="$TEMP/pokedex-shots"; mkdir -p "$OUT"
shot() { "$EDGE" --headless=new --disable-gpu --hide-scrollbars --virtual-time-budget=4000 --window-size=$1 --force-device-scale-factor=$2 --screenshot="$OUT/$3.png" "http://localhost:8123/$4"; }
shot 1920,1080 1 d-intro    "#/"
shot 1920,1080 1 d-menu     "#/menu"
shot 1920,1080 1 d-dex      "#/dex"
shot 1920,1080 1 d-entry    "#/dex/1"
shot 1920,1080 1 d-shiny    "?shiny#/dex/6"
shot 1920,1080 1 d-card     "#/card"
shot 1920,1080 1 d-badges   "#/badges"
shot 1920,1080 1 d-moves    "#/moves"
shot 1920,1080 1 d-contact  "#/contact"
shot 1920,1080 1 d-options  "#/options"
shot 1366,768  1 m-entry    "#/dex/2"
shot 390,844   3 p-intro    "#/"
shot 390,844   3 p-menu     "#/menu"
shot 390,844   3 p-entry    "#/dex/1"
shot 844,390   3 l-entry    "#/dex/1"
```
Abrir cada PNG e conferir contra a spec §7, §10 e §11:
- Pixels nítidos, sem borrão; aparelho centralizado, sem rolagem.
- Texto do painel legível; nada cortado nas telas de 240×160.
- `p-*`: layout DS, tela em cima, painel embaixo, botão B visível na entrada.
- `l-entry`: tela e painel lado a lado.
- `d-shiny`: sprite shiny, ★ na barra, "SHINY!".

Corrigir o que estiver errado (posições em px de jogo no CSS/SVG) e repetir as screenshots afetadas.

- [ ] **Step 6: Checklist manual (João, no navegador)**

Abrir `http://localhost:8123/`:
1. Pokédex fechada piscando → qualquer tecla abre com animação e cai no menu.
2. Setas movem o ▶, o painel muda a explicação; Z/Enter entra; X/Esc volta.
3. Pokédex: mover na lista troca o sprite da esquerda; entrar mostra a entrada com o sprite "voando"; ←/→ passam de projeto; ↑/↓ rolam o texto.
4. Botões do aparelho (direcional, A, B, teclas azuis, ANT/PRÓX) funcionam com o mouse.
5. OPÇÕES: trocar idioma muda todos os textos; ligar o som faz bip; recarregar mantém os dois.
6. VISTOS aumenta ao abrir projetos e mantém após recarregar.
7. Celular (DevTools, 390×844): toque funciona, botão B volta.
8. Com "reduzir movimento" ligado no sistema: abre direto, sem piscar.

- [ ] **Step 7: Commit**

```bash
git add index.html style.css app.js
git commit -m "feat: Pokédex navegável com carcaça pixel art, telas, controles, shiny e sons"
```

---

### Task 4: Fechamento

- [ ] **Step 1:** `node check.mjs` → `check ok`
- [ ] **Step 2:** `git status` limpo.
- [ ] **Step 3:** Mostrar as screenshots finais para o João e listar o que ficou para os próximos sub-projetos (spec §17).
