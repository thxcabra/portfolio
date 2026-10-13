# Acabamento — etapa A (ajustes rápidos) — plano de implementação

**Objetivo:** controles de navegador (mouse esquerdo = A, direito = B, Esc = START, Enter = A), volume em níveis e sons fiéis ao jogo, tela do jogo no centro da janela, "JOÃO CABRAL" nos textos, dados reais do currículo e prévia de link.

**Arquitetura:** mudanças pontuais no console (`gba.js`), no som (`sound.js`), no cartucho (`carts/center/*`), nos dados (`data.js`) e no `index.html`. Lógica nova e testável vai para `logic.js` (posição centralizada) e `sound.js` (níveis de volume).

**Tecnologia:** HTML/CSS/JS (módulos ES), sem dependências. Testes: `node check.mjs` e `node tools/e2e.mjs` (Edge headless via CDP).

**Spec:** `docs/specs/2026-10-12-acabamento-design.md` (seção 1). Contexto: `docs/specs/2026-10-12-telas-e-menu-design.md`.

## Restrições globais

- Commits como **João Cabral <joaovcabralm@hotmail.com>**.
- Só gráficos e sons originais do jogo; `new assets/` nunca vai para o git.
- Todo texto precisa existir na fonte do jogo e caber na janela (`check.mjs` mede).
- **Nenhum telefone** em lugar nenhum do site (dados, PDF, metatags).
- Rodar `node check.mjs` e `node tools/e2e.mjs` antes de cada commit.

## Números usados (do decomp)

| O quê | Valor | Fonte |
|---|---|---|
| A em pessoa/placa/estante/quadro | `SE_SELECT`; no PC só `SE_PC_ON` | `field_control_avatar.c:377-380` |
| START no título | grito do Charizard (#6), espera 90 quadros, fade para branco 0→16 de 2 em 2 (8 passos, ~0,15 s) | `title_screen.c:708-728`, `palette.c` |
| Bater na parede | `SE_WALL_HIT` a cada 32 quadros (0,533 s) | `event_object_movement.c:6163` |
| OPÇÕES | nenhum som | `option_menu.c` (sem `PlaySE`) |

## Arquivos

| Arquivo | Mudança |
|---|---|
| `gba.js` | teclas novas, mouse direito = B, volume em níveis, margens para centralizar |
| `sound.js` | volume geral (`VOLUMES`, `setVolume`) |
| `logic.js` | `centerBox` |
| `carts/center/ui.js` | clique "fora" só com o botão esquerdo |
| `carts/center/index.js` | som ao interagir, saída do título, dica só com o botão esquerdo |
| `carts/center/title.js` | `leave()` (espera + fade branco) |
| `carts/center/world.js` | intervalo da batida |
| `carts/center/screens/options.js` | linha SOM com níveis |
| `data.js` | textos com JOÃO CABRAL, dados do currículo, formação, contatos |
| `style.css` | fade branco do título |
| `index.html` | metatags de prévia |
| `check.mjs`, `tools/e2e.mjs`, `tools/shots.mjs` | testes e screenshots |
| `assets/og.png` | imagem de prévia (1200×630) |

---

### Tarefa 1: controles do navegador

**Arquivos:** `gba.js`, `carts/center/ui.js`, `carts/center/index.js`, `tools/e2e.mjs`, `tools/shots.mjs`

**Interfaces:** nenhuma nova. `press('b', down)` passa a ser chamado também pelo botão direito do mouse.

- [ ] **Passo 1: testes.** Em `tools/e2e.mjs`:
  - acrescentar, depois do auxiliar `rectIn`:

```js
// Right mouse button on the screen = B.
const rightClick = async (wait = 300) => {
  const r = await ev(`(() => { const b = document.getElementById('screen').getBoundingClientRect(); return [b.left + 40, b.top + b.height - 30]; })()`);
  for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x: r[0], y: r[1], button: 'right', clickCount: 1 });
  await sleep(wait);
};
```

  - trocar **todas** as chamadas `await key('Enter');` (sem segundo argumento — as que abrem/fecham o menu) por `await key('Escape');`. A primeira, `await key('Enter', 900);` (título), continua Enter: agora Enter é A, e A também começa o jogo.
  - no bloco do menu START, trocar `await key('z');` (logo antes de `assert.match((await msg()) ?? '', /breve/);`) por `await key('Enter');` (Enter = A);
  - no mesmo bloco, trocar o fechamento final

```js
await key('Escape');
assert.ok(!(await has('.menu')), 'START não fechou o menu');
```

  por

```js
await rightClick();
assert.ok(!(await has('.menu')), 'o botão direito (B) não fechou o menu');
```

  - no bloco de OPÇÕES, depois de `assert.equal(await focused(), 'OPÇÕES');`, a linha `await key('Escape');` fecha o menu (Esc = START fecha) — mantém.

- [ ] **Passo 2: rodar e ver falhar.** `node tools/e2e.mjs` → falha ao abrir o menu com Escape (hoje Escape = B).

- [ ] **Passo 3: implementar.** Em `gba.js`:
  - no objeto `KEYS`, a linha `z: 'a', Z: 'a', ' ': 'a', x: 'b', X: 'b', Escape: 'b', Enter: 'start', Shift: 'select',` vira:

```js
  z: 'a', Z: 'a', ' ': 'a', Enter: 'a', x: 'b', X: 'b', Backspace: 'b', Escape: 'start', Shift: 'select',
```

  - no início do handler `$gba.addEventListener('pointerdown', (e) => {`, logo depois de `unlock();`:

```js
  if (e.button === 2) {   // right mouse button = B, held while pressed (B held = run, like the game)
    e.preventDefault();
    return press('b', true);
  }
  if (e.button !== 0) return;
```

  - depois do laço `for (const type of ['pointerup', 'pointercancel'])`:

```js
addEventListener('pointerup', (e) => { if (e.button === 2) press('b', false); });
$gba.addEventListener('contextmenu', (e) => e.preventDefault());   // the right button is B here
```

  Em `carts/center/ui.js`, no handler de `layer` em `createStack`, a primeira linha vira:

```js
    if (e.button !== 0 || e.target !== layer || !list.length) return;   // the right button is B, handled by the console
```

  Em `carts/center/index.js`, no `pointerdown` da dica (`makeHint`):

```js
  el.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    e.stopPropagation();   // not a click on the room
    useMenu();
  });
```

  Em `tools/shots.mjs`: `const KEYS = { Enter: ['Enter', 13], Escape: ['Escape', 27], ArrowUp: ['ArrowUp', 38], z: ['KeyZ', 90], x: ['KeyX', 88] };` e a segunda chamada `await key('Enter', 600);` (abre o menu) vira `await key('Escape', 600);`.

- [ ] **Passo 4: rodar e ver passar.** `node check.mjs` → ok; `node tools/e2e.mjs` → `e2e ok`.

- [ ] **Passo 5: commit.**

```bash
git add gba.js carts/center/ui.js carts/center/index.js tools/e2e.mjs tools/shots.mjs
git commit -m "feat: botão esquerdo = A, direito = B, Esc = START, Enter = A"
```

---

### Tarefa 2: volume em níveis

**Arquivos:** `sound.js`, `gba.js`, `carts/center/screens/options.js`, `data.js` (bloco `ui`), `check.mjs`, `tools/e2e.mjs`

**Interfaces:**
- Produz (`sound.js`): `VOLUMES = [0, 0.2, 0.4, 0.75]` (DESLIGADO, BAIXO, MÉDIO, ALTO); `setVolume(level: 0..3)` substitui `setEnabled`.
- Produz (`api`): `api.volume(level?) → 0..3` (sem argumento só lê; com argumento muda sem tocar som). Sai `api.sound`.
- Guarda `volume` (0–3) no `localStorage`; quem tinha `sound: true` entra em MÉDIO.

- [ ] **Passo 1: testes.** Em `check.mjs`, importar `import { VOLUMES } from './sound.js';` e acrescentar perto dos testes de lógica:

```js
// volume levels: off, low, mid (40% of the old fixed volume), high
assert.deepEqual(VOLUMES.length, 4);
assert.equal(VOLUMES[0], 0);
assert.equal(VOLUMES[2], 0.4);
assert.ok(VOLUMES.every((v, i) => i === 0 || v > VOLUMES[i - 1]), 'volume levels must grow');
```

  No laço de larguras de OPÇÕES (`for (const k of ['slow', 'mid', 'fast', 'on', 'off', 'lang_pt', 'lang_en'])`), trocar a lista por `['slow', 'mid', 'fast', 'vol_0', 'vol_1', 'vol_2', 'vol_3', 'lang_pt', 'lang_en']`.

  Em `tools/e2e.mjs`, no bloco de OPÇÕES, trocar as linhas

```js
await key('ArrowDown');
await key('ArrowDown');
await key('ArrowRight');
assert.match(await ev(`document.getElementById('screen').style.getPropertyValue('--frame')`), /frame-2\.png/);
```

  por

```js
await key('ArrowDown');
await key('ArrowRight');
assert.equal(await ev(`localStorage.getItem('volume')`), '1');
assert.match(await ev(`document.querySelector('.opt-row.cur').textContent`), /BAIXO/);
await key('ArrowLeft');
assert.equal(await ev(`localStorage.getItem('volume')`), '0');
await key('ArrowDown');
await key('ArrowRight');
assert.match(await ev(`document.getElementById('screen').style.getPropertyValue('--frame')`), /frame-2\.png/);
```

  e, no teste do botão de som, `assert.equal(await ev(\`localStorage.getItem('sound')\`), 'true');` vira `assert.equal(await ev(\`localStorage.getItem('volume')\`), '2', 'o botão SOM liga em MÉDIO');`.

- [ ] **Passo 2: rodar e ver falhar.** `node check.mjs` → erro de importação (`VOLUMES` não existe).

- [ ] **Passo 3: `sound.js` (arquivo inteiro).**

```js
// Game sounds through Web Audio, all through one volume. Silent until a level is set (the first
// time inside a user gesture, for the browser's autoplay rules); any failure stays silent.
const SFX = ['select', 'win_open', 'pc_on', 'dex_scroll', 'dex_page', 'success', 'shiny', 'bump'];
// The ripped effects peak around 5–17% of full scale and the cries near 100%: these even them out.
const SFX_GAIN = 3;
const CRY_GAIN = 0.4;
export const VOLUMES = [0, 0.2, 0.4, 0.75];   // DESLIGADO, BAIXO, MÉDIO, ALTO
const cache = new Map();
let ctx = null;
let master = null;
let level = 0;

function load(url) {
  if (!cache.has(url)) {
    cache.set(url, fetch(url).then((r) => r.arrayBuffer()).then((b) => ctx.decodeAudioData(b)));
  }
  return cache.get(url);
}

export function setVolume(n) {
  level = n;
  if (master) master.gain.value = VOLUMES[n];
  if (!n) return;
  try {
    ctx ||= new AudioContext();
    if (!master) {
      master = ctx.createGain();
      master.connect(ctx.destination);
      master.gain.value = VOLUMES[n];
    }
    ctx.resume();
    SFX.forEach((name) => load(`assets/sfx/${name}.wav`).catch(() => {}));
  } catch {
    ctx = null;
    master = null;
  }
}

function play(url, delay, gain) {
  if (!level || !ctx) return;
  load(url)
    .then((buffer) => {
      const src = ctx.createBufferSource();
      const volume = ctx.createGain();
      src.buffer = buffer;
      volume.gain.value = gain;
      src.connect(volume).connect(master);
      src.start(ctx.currentTime + delay);
    })
    .catch(() => cache.delete(url));
}

export const sfx = (name, delay = 0) => play(`assets/sfx/${name}.wav`, delay, SFX_GAIN);
export const cry = (dex, delay = 0) => play(`assets/cries/${dex}.wav`, delay, CRY_GAIN);
```

- [ ] **Passo 4: `gba.js`.**
  - importação: `import { setVolume, sfx, cry } from './sound.js';`
  - `let soundOn = store.get('sound', false) === true;` vira:

```js
let volume = store.get('volume', store.get('sound', false) === true ? 2 : 0);   // 0–3; old saves had sound: true
let lastVolume = volume || 2;
```

  - no `api`, trocar o método `sound(on) { … }` por:

```js
  volume(n) {
    if (n !== undefined) setLevel(n);
    return volume;
  },
```

  - trocar `unlock()` e `toggleSound()` por:

```js
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
```

  - em "power on", `document.body.classList.toggle('sound-on', soundOn);` vira `document.body.classList.toggle('sound-on', volume > 0);`

- [ ] **Passo 5: OPÇÕES e textos.** Em `carts/center/screens/options.js`, a linha do som vira:

```js
    { label: 'opt_sound', value: () => api.t(`vol_${api.volume()}`), change: (d) => api.volume(cycle([0, 1, 2, 3], api.volume(), d)) },
```

  Em `data.js`, no bloco `ui.pt`, trocar `on: 'LIGADO', off: 'DESLIGADO',` por `vol_0: 'DESLIGADO', vol_1: 'BAIXO', vol_2: 'MÉDIO', vol_3: 'ALTO',`; no `ui.en`, trocar `on: 'ON', off: 'OFF',` por `vol_0: 'OFF', vol_1: 'LOW', vol_2: 'MID', vol_3: 'HIGH',`.

- [ ] **Passo 6: rodar e ver passar.** `node check.mjs` → ok; `node tools/e2e.mjs` → `e2e ok`. `grep -rn "api.sound\|setEnabled\|soundOn" --include=*.js . | grep -v "new assets"` → nada.

- [ ] **Passo 7: commit.**

```bash
git add sound.js gba.js carts/center/screens/options.js data.js check.mjs tools/e2e.mjs
git commit -m "feat: volume em níveis (desligado, baixo, médio, alto), mais baixo por padrão"
```

---

### Tarefa 3: sons fiéis ao jogo

**Arquivos:** `carts/center/index.js`, `carts/center/title.js`, `carts/center/world.js`, `style.css`, `tools/e2e.mjs`, `tools/shots.mjs`

**Interfaces:**
- Produz (`title.js`): o objeto devolvido por `createTitle` ganha `leave() → Promise` (espera 90 quadros e faz o fade para branco; com movimento reduzido resolve na hora).
- Muda (`index.js`): `enter({ fromTitle = true } = {})` (substitui `{ welcome }`); `open()` chama `enter({ fromTitle: false })`.

- [ ] **Passo 1: testes.** Em `tools/e2e.mjs`:
  - a entrada pelo título: `await key('Enter', 900);` vira

```js
await key('Enter', 700);
assert.ok(await has('.title'), 'o título deveria esperar o grito do Charizard (90 quadros) antes de sair');
await sleep(1700);
```

  - logo depois do teste do botão de som (`assert.equal(await ev(\`localStorage.getItem('volume')\`), '2', …)` e do `ok(...)` dele), acrescentar:

```js
await ev(`window.__played = 0; const start = AudioBufferSourceNode.prototype.start; AudioBufferSourceNode.prototype.start = function (...a) { window.__played++; return start.apply(this, a); }`);
await clickTile(4, 7);   // the boy: walk there and talk
await sleep(3500);
assert.match((await msg()) ?? '', /correr|run/i);
assert.ok(await ev('window.__played') >= 1, 'A numa pessoa deveria tocar SE_SELECT');
await closeMsg();
ok('falar com alguém toca o som de seleção, como no jogo');
```

  Em `tools/shots.mjs`, `await key('Enter', 1500);` (título → sala) vira `await key('Enter', 2600);`.

- [ ] **Passo 2: rodar e ver falhar.** `node tools/e2e.mjs` → falha em "o título deveria esperar o grito do Charizard".

- [ ] **Passo 3: `title.js`.** No fim de `createTitle`, trocar os dois `return` por versões com `leave`:
  - o do movimento reduzido: `if (reduced) return { stop() {}, leave: () => Promise.resolve() };`
  - o final:

```js
  // START on the title (scene CRY): the cry plays, 90 frames go by, then everything fades to white
  // (0 to 16 in steps of 2, about 9 frames).
  const leave = () => new Promise((resolve) => {
    setTimeout(() => {
      root.querySelector('.title').classList.add('to-white');
      setTimeout(resolve, 9000 / FPS);
    }, 90000 / FPS);
  });
  return { stop: () => cancelAnimationFrame(raf), leave };
```

  Em `style.css`, depois das regras `.title`:

```css
.title::after { content: ''; position: absolute; inset: 0; background: #fff; opacity: 0; pointer-events: none; }
.title.to-white::after { animation: to-white .15s steps(8) forwards; }
@keyframes to-white { to { opacity: 1; } }
```

- [ ] **Passo 4: `index.js`.**
  - `async function enter({ welcome = true } = {}) {` vira `async function enter({ fromTitle = true } = {}) {`, e o começo da função até `titleScreen.stop();` vira:

```js
  if (mode !== 'title') return;
  mode = 'loading';
  const loaded = Promise.all([map ?? json('assets/world/center.json'), widths ?? json('assets/font/widths.json')]);
  if (fromTitle) {
    api.cry(6);   // the title's Charizard
    await titleScreen.leave();
  }
  titleScreen.stop();
  [map, widths] = await loaded;
```

  (apagar a linha antiga `[map, widths] = await Promise.all([...])` e o `api.sfx('select');` do começo.)
  - `if (welcome && !api.store.get('welcomed', false)) {` vira `if (fromTitle && !api.store.get('welcomed', false)) {`
  - em `open(path)`: `await enter({ welcome: false });` vira `await enter({ fromTitle: false });`
  - `interact` inteiro vira:

```js
const THINGS = { [BEHAVIOR.REGION_MAP]: 'board', [BEHAVIOR.BOOKSHELF]: 'shelf' };
function interact(target) {
  if (target.behavior === BEHAVIOR.PC) {
    api.sfx('pc_on');   // the PC plays its own sound instead of SE_SELECT
    return say(api.talk('pc'));
  }
  const key = target.person ?? THINGS[target.behavior];
  if (!key) return;   // nothing there: no sound, like the game
  api.sfx('select');   // A on someone or something (field_control_avatar.c)
  say(api.talk(key), null, VOICE[key]);
}
```

  Em `carts/center/world.js`, `if (now - lastBump > 400) { lastBump = now; hooks.bump(); }` vira:

```js
      if (now - lastBump > 533) { lastBump = now; hooks.bump(); }   // SE_WALL_HIT every 32 frames while held
```

- [ ] **Passo 5: rodar e ver passar.** `node check.mjs` → ok; `node tools/e2e.mjs` → `e2e ok`.

- [ ] **Passo 6: commit.**

```bash
git add carts/center/index.js carts/center/title.js carts/center/world.js style.css tools/e2e.mjs tools/shots.mjs
git commit -m "feat: sons como no jogo: seleção ao interagir, grito do Charizard e fade branco no título, batida a cada 32 quadros"
```

---

### Tarefa 4: tela do jogo no centro da janela

**Arquivos:** `logic.js`, `check.mjs`, `gba.js`, `tools/e2e.mjs`

**Interfaces:**
- Produz: `centerBox(W, H, sx, sy) → { top, right, bottom, left, w, h }` — margens (px de jogo) que fazem o centro da tela 240×160 em (sx, sy) cair no centro da caixa, e o tamanho da caixa com as margens.

- [ ] **Passo 1: testes.** Em `check.mjs` (importar `centerBox` de `./logic.js`):

```js
// the game screen's centre goes to the window's centre
assert.deepEqual(centerBox(432, 202, 96, 18), { top: 6, right: 0, bottom: 0, left: 0, w: 432, h: 208 });
assert.deepEqual(centerBox(256, 320, 8, 12), { top: 136, right: 0, bottom: 0, left: 0, w: 256, h: 456 });
// screen centre at (120, 120) of a 300x200 body: the box needs room on the left and at the bottom
assert.deepEqual(centerBox(300, 200, 0, 40), { top: 0, right: 0, bottom: 40, left: 60, w: 360, h: 240 });
```

  Em `tools/e2e.mjs`, depois de `ok('START entra no Centro Pokémon, Red na porta');`:

```js
const off = () => ev(`(() => { const r = document.getElementById('screen').getBoundingClientRect(); return [r.left + r.width / 2 - innerWidth / 2, r.top + r.height / 2 - innerHeight / 2].map((v) => Math.abs(Math.round(v))); })()`);
assert.ok((await off()).every((v) => v <= 1), `a tela do jogo não está no centro da janela: ${await off()}`);
ok('tela do jogo no centro da janela');
```

  e, no bloco do celular em pé, depois de `assert.equal(await ev(\`document.getElementById('gba').style.width\`), '256px', …);`:

```js
assert.ok((await off()).every((v) => v <= 1), 'no GBA SP a tela do jogo também fica no centro');
```

- [ ] **Passo 2: rodar e ver falhar.** `node check.mjs` → erro de importação (`centerBox`).

- [ ] **Passo 3: implementar.** Em `logic.js`, depois de `coverScale`:

```js
// Margins (game px) that put the centre of the 240x160 screen at (sx, sy) in the middle of a W×H body,
// and the size of the body with them: centring that box centres the game screen.
export function centerBox(W, H, sx, sy) {
  const cx = sx + 120, cy = sy + 80;
  const m = { top: Math.max(0, H - 2 * cy), right: Math.max(0, 2 * cx - W), bottom: Math.max(0, 2 * cy - H), left: Math.max(0, W - 2 * cx) };
  return { ...m, w: W + m.left + m.right, h: H + m.top + m.bottom };
}
```

  Em `gba.js`: importar `centerBox`; em `mount()`, depois de `Object.assign($screen.style, …);`:

```js
  shell.box = centerBox(shell.W, shell.H, ...shell.screen);
  const b = shell.box;
  $gba.style.margin = `${b.top}px ${b.right}px ${b.bottom}px ${b.left}px`;   // zoomed with the GBA
```

  e em `fit()`: `fitScale(shell.W, shell.H, …)` vira `fitScale(shell.box.w, shell.box.h, …)`.

- [ ] **Passo 4: rodar e ver passar.** `node check.mjs` → ok; `node tools/e2e.mjs` → `e2e ok`.

- [ ] **Passo 5: commit.**

```bash
git add logic.js check.mjs gba.js tools/e2e.mjs
git commit -m "feat: a tela do jogo fica no centro exato da janela"
```

---

### Tarefa 5: "JOÃO CABRAL" nos textos

**Arquivos:** `data.js`

- [ ] **Passo 1: trocar os textos** (todos já medidos na fonte do jogo; cabem). Em `talk.pt`:

```js
      nurse: ['JOÃO CABRAL criou este Centro\npara você ver os projetos dele.', 'Em breve eu cuido dos seus\nPokémon e passo o contato dele!'],
      board: ['Um quadro com o mapa\nde Kanto...', 'Em breve: o cartão de treinador\ndo JOÃO CABRAL, com insígnias.'],
      gentleman: ['Eu sou o Tutor de Golpes.', 'Em breve vou ensinar as\nhabilidades do JOÃO CABRAL!'],
      contact_ask: ['Por onde você quer falar\ncom o JOÃO CABRAL?'],
```

  a última página de `nurse_welcome` vira `'Aperte START (Esc) ou clique\nnele para ver tudo rapidinho!',`. Em `talk.en`:

```js
      nurse: ['JOÃO CABRAL built this Center\nso you can see his projects.', "Soon I'll heal your Pokémon\nand give you his contact!"],
      board: ['A board with a map\nof Kanto...', "Soon: JOÃO CABRAL's Trainer\nCard, with his badges."],
      gentleman: ["I'm the Move Tutor.", "Soon I'll teach JOÃO\nCABRAL's skills!"],
      contact_ask: ['How would you like to\nreach JOÃO CABRAL?'],
```

  a última página de `nurse_welcome` vira `'Press START (Esc) or click it\nto see everything quickly!',`. Em `ui.pt`:

```js
      help_projetos: 'Todos os projetos do JOÃO CABRAL,\ncada um com o seu Pokémon.',
      help_sobre: 'Quem é o JOÃO CABRAL: o cartão\nde treinador dele.',
      help_experiencia: 'Onde o JOÃO CABRAL trabalhou\ne estudou.',
      help_habilidades: 'As tecnologias que o JOÃO\nCABRAL domina, como golpes.',
      help_contato: 'E-mail, LinkedIn e GitHub para\nfalar com o JOÃO CABRAL.',
```

  e em `ui.en`:

```js
      help_projetos: "All of JOÃO CABRAL's projects,\neach one with its own Pokémon.",
      help_sobre: 'Who JOÃO CABRAL is: his\nTrainer Card.',
      help_experiencia: 'Where JOÃO CABRAL has worked\nand studied.',
      help_habilidades: 'The technologies JOÃO CABRAL\nknows, as moves.',
      help_contato: 'E-mail, LinkedIn and GitHub to\nreach JOÃO CABRAL.',
```

- [ ] **Passo 2: verificar.** `node check.mjs` → ok (larguras e fonte); `node tools/e2e.mjs` → `e2e ok` (o teste da Enfermeira procura `JOÃO`, que continua no texto).

- [ ] **Passo 3: commit.**

```bash
git add data.js
git commit -m "feat: os textos chamam o dono do Centro de JOÃO CABRAL"
```

---

### Tarefa 6: dados reais do currículo

**Arquivos:** `data.js`, `check.mjs`, `tools/e2e.mjs`

**Interfaces:**
- `trainer`: `name`, `id`, `since` (ano usado em TEMPO), `partner`, `role {pt,en}`, `location`, `languages {pt,en}`, `about {pt,en}`.
- `badges[]` (experiência): `{ name, shape, role {pt,en}, period {pt,en}, text {pt,en} }`.
- `education[]` (novo): `{ name, course {pt,en}, period {pt,en} }`.
- `moves[]`: `{ name, type, power (0–100), years, text {pt,en} }` — `years` substitui `pp`.
- `contact[]`: `{ label, url }`, sem telefone.

- [ ] **Passo 1: testes.** Em `check.mjs`:
  - depois de `assert.ok(Number.isInteger(trainer.since), …)`:

```js
both(trainer.role, 'trainer.role');
both(trainer.languages, 'trainer.languages');
assert.ok(trainer.location?.trim(), 'trainer.location vazio');
```

  - no laço das insígnias, depois de `both(b.role, w);`: `both(b.period, w);`
  - depois do laço das insígnias:

```js
const { education } = DATA;
assert.ok(Array.isArray(education) && education.length >= 1, 'education precisa ser uma lista');
education.forEach((e, i) => {
  const w = `education[${i}] ${e.name}`;
  assert.ok(e.name?.trim(), `${w}: falta name`);
  both(e.course, w);
  both(e.period, w);
});
```

  - no laço dos golpes, `assert.ok(Number.isInteger(m.power) && Number.isInteger(m.pp), …)` vira:

```js
  assert.ok(Number.isInteger(m.power) && m.power >= 0 && m.power <= 100 && Number.isInteger(m.years), `${w}: power (0–100) e years precisam ser inteiros`);
```

  - no laço do `contact`, primeira linha dentro: `assert.ok(!/^tel:/i.test(c.url) && !/\d{4}-?\d{4}/.test(c.url), \`${w}: telefone não vai para o site\`);` (depois de `const w = …`).

  Em `tools/e2e.mjs`, no bloco do CONTATO, trocar do `assert.equal(await focused(), 'GITHUB');` até `assert.match((await msg()) ?? '', /copiado|@/);` por:

```js
assert.equal(await focused(), 'E-MAIL');
await key('z', 300);
assert.equal(await ev(`document.querySelectorAll('.contact .win').length`), 2, 'E-MAIL não perguntou escrever/copiar');
assert.equal((await rectIn('.contact .win:last-of-type'))[2], 224, 'a pergunta fica onde o SIM/NÃO do jogo fica');
await key('ArrowDown');
await key('z', 700);
assert.match((await msg()) ?? '', /copiado|@/);
await closeMsg();
await menuTo('GITHUB');
await key('z');
assert.deepEqual(await ev('window.__opened'), ['https://github.com/thxcabra']);
```

- [ ] **Passo 2: rodar e ver falhar.** `node check.mjs` → falha em `trainer.role`.

- [ ] **Passo 3: dados.** Em `data.js`, trocar os blocos `trainer`, `badges`, `moves` e `contact` (os `projects` ficam para a fase 2) por:

```js
  trainer: {
    name: 'JOÃO CABRAL',
    id: '04201',
    since: 2022,   // TEMPO conta daqui (início em Ciência da Computação na UFSC)
    partner: 25,
    role: { pt: 'Engenheiro de Software · IA e Automação de Dados · Game Dev', en: 'Software Engineer · AI & Data Automation · Game Dev' },
    location: 'Palhoça, SC',
    languages: { pt: 'Português (nativo) · Inglês (fluente)', en: 'Portuguese (native) · English (full professional)' },
    about: {
      pt: 'Sou engenheiro de software e game dev independente e adoro construir produtos digitais do zero. Vou além do “só funcionar”: quero algo estável, bonito e nas mãos das pessoas, para usar ou jogar. Meu trabalho fica entre código, design, sentimento e significado: engenharia de software, desenvolvimento de jogos, IA e automação de dados e estratégia de produto. Gosto de fazer coisas que funcionam bem e são divertidas de usar, seja um jogo, um pipeline de dados, um site ou um chatbot. Sempre aberto a conversar com times e pessoas fazendo coisas interessantes.',
      en: 'I am a software engineer and independent game dev who loves to build digital products from scratch. Always looking beyond the basics and the “just work” mantra, I aim to build something stable, make it look good and get it in front of people to use or play. My work sits at the intersection of code, design, feelings and meaning: software engineering, game development, AI & data automation and product strategy. I like building things that work well and are fun to use, whether that is a new game, a data pipeline, a website or a chatbot. Always open to talking with teams and people who are making interesting things.',
    },
  },
```

```js
  // Experiência: cada emprego é uma insígnia (máx. 8), do mais recente ao mais antigo.
  badges: [
    {
      name: 'MOIC DIGITAL', shape: 'boulder',
      role: { pt: 'Intelligence Engineer', en: 'Intelligence Engineer' },
      period: { pt: 'set 2026 – hoje', en: 'Sep 2026 – now' },
      text: {
        pt: 'IA como ferramenta central para criar automações, produtos e soluções que fazem o negócio andar. Uma das principais referências de tecnologia da empresa, de ponta a ponta: da identificação do problema até a produção. Automações que tiram trabalho manual dos times, produtos internos e para clientes, e a ponte entre negócio e tecnologia.',
        en: "AI as a core tool to build automations, products and solutions that drive the business forward. One of the company's main technology reference points, working end to end from problem identification to production: automations that cut manual work, internal and customer-facing products, and the bridge between business and technology.",
      },
    },
    {
      name: 'MOIC DIGITAL', shape: 'cascade',
      role: { pt: 'Social Media Manager', en: 'Social Media Manager' },
      period: { pt: 'out 2024 – hoje', en: 'Oct 2024 – now' },
      text: { pt: 'Gestão de redes sociais na MOIC Digital.', en: 'Social media management at MOIC Digital.' },
    },
    {
      name: 'CAPYFI', shape: 'thunder',
      role: { pt: 'Social Media Manager', en: 'Social Media Manager' },
      period: { pt: 'mai – set 2026', en: 'May – Sep 2026' },
      text: { pt: 'Gestão das redes sociais da CapyFi.', en: "Managed CapyFi's social media." },
    },
    {
      name: 'FOGO', shape: 'rainbow',
      role: { pt: 'Social Media Manager', en: 'Social Media Manager' },
      period: { pt: 'mar – jul 2026', en: 'Mar – Jul 2026' },
      text: { pt: 'Gestão das redes sociais da Fogo.', en: "Managed Fogo's social media." },
    },
    {
      name: 'KAIA DLT FOUNDATION', shape: 'soul',
      role: { pt: 'Social Media Manager', en: 'Social Media Manager' },
      period: { pt: 'abr 2025 – abr 2026', en: 'Apr 2025 – Apr 2026' },
      text: { pt: 'Gestão das redes sociais da Kaia DLT Foundation.', en: "Managed Kaia DLT Foundation's social media." },
    },
    {
      name: 'HAUST LABS', shape: 'marsh',
      role: { pt: 'Social Media Manager', en: 'Social Media Manager' },
      period: { pt: 'nov 2024 – fev 2026', en: 'Nov 2024 – Feb 2026' },
      text: { pt: 'Gestão das redes sociais da Haust Labs.', en: "Managed Haust Labs' social media." },
    },
  ],

  education: [
    { name: 'UFSC', course: { pt: 'Bacharelado em Ciência da Computação', en: "Bachelor's in Computer Science" }, period: { pt: '2022 – 2025', en: '2022 – 2025' } },
    { name: 'UNIASSELVI', course: { pt: 'Bacharelado em Sistemas de Informação', en: "Bachelor's in Information Systems" }, period: { pt: 'fev 2026', en: 'Feb 2026' } },
    { name: 'WIZARD BY PEARSON', course: { pt: 'Inglês avançado', en: 'Advanced English' }, period: { pt: '2015 – 2021', en: '2015 – 2021' } },
  ],

  // PODER (0–100) e ANOS começam como estimativa: ajuste aqui.
  moves: [
    { name: 'PYTHON', type: 'psychic', power: 90, years: 4, text: { pt: 'Automações, APIs (FastAPI), bots e pipelines de dados.', en: 'Automations, APIs (FastAPI), bots and data pipelines.' } },
    { name: 'TYPESCRIPT', type: 'electric', power: 85, years: 3, text: { pt: 'Front-end e ferramentas web com JavaScript e TypeScript.', en: 'Front-end and web tools with JavaScript and TypeScript.' } },
    { name: 'REACT', type: 'water', power: 80, years: 3, text: { pt: 'Interfaces web com React, Vite e Tailwind.', en: 'Web interfaces with React, Vite and Tailwind.' } },
    { name: 'LLMS', type: 'dragon', power: 90, years: 2, text: { pt: 'IA aplicada: agentes, chatbots e automações com modelos de linguagem.', en: 'Applied AI: agents, chatbots and automations with language models.' } },
    { name: 'GCP', type: 'steel', power: 75, years: 2, text: { pt: 'Dados e infraestrutura no Google Cloud, com BigQuery.', en: 'Data and infrastructure on Google Cloud, with BigQuery.' } },
    { name: 'DADOS', type: 'rock', power: 80, years: 2, text: { pt: 'Pipelines de dados: coleta, limpeza e análise.', en: 'Data pipelines: collecting, cleaning and analysis.' } },
    { name: 'UNITY', type: 'fire', power: 75, years: 3, text: { pt: 'Jogos independentes na Unity, com C#.', en: 'Independent games in Unity, with C#.' } },
    { name: 'DESIGN', type: 'grass', power: 75, years: 4, text: { pt: 'Figma, Aseprite e Blender: interfaces, pixel art e 3D.', en: 'Figma, Aseprite and Blender: interfaces, pixel art and 3D.' } },
  ],

  // Cada contato: { label, url }. url = https://..., mailto:... ou um arquivo em assets/ (ex.: 'assets/curriculo.pdf'). Sem telefone.
  contact: [
    { label: 'E-MAIL', url: 'mailto:joaovcabralm@hotmail.com' },
    { label: 'LINKEDIN', url: 'https://www.linkedin.com/in/joao-cabral-machado/' },
    { label: 'GITHUB', url: 'https://github.com/thxcabra' },
  ],
```

  (Apagar o comentário antigo duplicado do `contact`, se ficar. Se o `check.mjs` acusar um caractere fora da fonte, troque-o por um equivalente que exista — por exemplo, aspas retas no lugar de curvas.)

- [ ] **Passo 4: rodar e ver passar.** `node check.mjs` → ok; `node tools/e2e.mjs` → `e2e ok`.

- [ ] **Passo 5: commit.**

```bash
git add data.js check.mjs tools/e2e.mjs
git commit -m "feat: dados reais do currículo (cargo, experiência, formação, habilidades, contatos)"
```

---

### Tarefa 7: prévia de link e revisão final

**Arquivos:** `index.html`, `assets/og.png`

- [ ] **Passo 1: imagem.** `node tools/shots.mjs "$TEMP/og" 1200x630` e copiar `"$TEMP/og/1200x630-title.png"` para `assets/og.png`. Conferir que é 1200×630 (`python -c "import sys; sys.path.insert(0,'tools'); import pngio; print(pngio.read('assets/og.png')[:2])"` → `(1200, 630)`).

- [ ] **Passo 2: metatags.** Em `index.html`, trocar a linha da `description` por:

```html
  <meta name="description" content="Portfólio de João Cabral, engenheiro de software (IA, automação de dados, game dev): um Centro Pokémon jogável num GBA.">
  <meta property="og:type" content="website">
  <meta property="og:title" content="João Cabral · Centro Pokémon">
  <meta property="og:description" content="Engenheiro de software, IA e automação de dados, game dev. Um portfólio jogável no estilo do Pokémon FireRed.">
  <meta property="og:image" content="assets/og.png"><!-- trocar por URL absoluta quando houver domínio -->
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
```

- [ ] **Passo 3: revisão.** `node check.mjs` → ok; `node tools/e2e.mjs` → `e2e ok`; `node tools/shots.mjs "$TEMP/shots-a"` e conferir nos 4 tamanhos: tela do jogo no centro da janela, menu, OPÇÕES (SOM com níveis) e CONTATO (e-mail primeiro, sem telefone).

- [ ] **Passo 4: commit.**

```bash
git add index.html assets/og.png
git commit -m "feat: prévia de link (título, descrição e imagem) para compartilhar"
```

---

## Autorrevisão

- **Cobertura da etapa A do spec:** controles (T1), volume (T2), sons fiéis (T3), centro (T4), JOÃO CABRAL (T5), dados reais incluindo formação e contato sem telefone (T6), prévia de link (T7). Sons das telas futuras ficam nos planos delas.
- **Nomes conferidos:** `VOLUMES`, `setVolume`, `api.volume`, `setLevel`, `centerBox`, `shell.box`, `leave()`, `enter({ fromTitle })`, `THINGS`, `education`, `moves[].years`.
