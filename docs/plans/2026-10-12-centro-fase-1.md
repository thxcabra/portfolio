# Centro Pokémon — Fase 1 (GBA + sala andável) — Plano de implementação

**Objetivo:** trocar a Pokédex vermelha por um GBA com o primeiro cartucho: a tela de título do FireRed e o Centro Pokémon de verdade, onde o Red anda (teclado e clique), as pessoas estão nos lugares do jogo, a Enfermeira dá as boas-vindas e cada objeto responde com um diálogo.

**Arquitetura:** `gba.js` é o console (corpo em SVG de grade, escala inteira, botões, som, fundo). O cartucho `carts/center/` (`index.js`, `world.js`, `dialog.js`) recebe a tela e os botões pelo contrato da spec. O mapa, as camadas e os personagens saem dos arquivos do FireRed pelo `tools/build_assets.py`. Funções puras novas em `logic.js`, testadas no `check.mjs`.

**Stack:** HTML/CSS/JS sem dependências; Python (stdlib + fontTools só para a fonte); Node 24; Edge headless.

**Spec:** `docs/specs/2026-10-12-centro-pokemon-design.md`

## Restrições globais

- Só assets originais do FireRed. O único desenho novo é o corpo do GBA (geométrico, cores chapadas, sem marca).
- Pixel único: tudo em pixels de jogo, `zoom: var(--k)` com `k` inteiro em pixels físicos; posições inteiras; animações com `steps()`.
- Fonte `Gen3`/`Gen3 Small` 16px; molduras `frame-1..10`; sons e gritos originais.
- Textos em PT e EN no `data.js`; cada página de diálogo tem no máximo 2 linhas e cabe em 208px (o `check.mjs` garante).
- `prefers-reduced-motion`: texto instantâneo, sem fades.
- Commits como `João Cabral <joaovcabralm@hotmail.com>`.
- Mudança em relação à spec: a troca dos sprites dos Pokémon fica para a fase 2, onde eles aparecem (PC/Resumo).

## Fatos do jogo usados no plano (conferidos nos arquivos)

- `data/layouts/PokemonCenter_1F/map.bin`: 15×10 blocos `u16` (bits 0–9 metatile, 10–11 colisão). Tilesets `primary/building` (640 tiles, 640 metatiles, paletas 0–6) e `secondary/pokemon_center` (índices a partir de 640, paletas 7–12). Metatile = 8 entradas `u16` (4 de baixo, 4 de cima; bits 0–9 tile, 10 hflip, 11 vflip, 12–15 paleta). Atributo `u32` por metatile: comportamento bits 0–8, tipo de camada bits 29–30 (0 normal: cima cobre o personagem; 1 coberto: tudo embaixo; 2 dividido: cima cobre).
- Comportamentos na sala: PC `0x83` em (11,1); mapa de Kanto na parede `0x85` em (12,1) e (13,1); estante `0x81` em (2,1) e (3,1); balcão `0x80`; escada rolante `0x6A` em (1,6); tapete da porta `0x65` em (7,8).
- Pessoas (`data/maps/ViridianCity_PokemonCenter_1F/map.json`): nurse (7,2), gentleman (12,5), boy (4,7), youngster (2,3, anda pela sala).
- Sprites 16×32 em tira: `red_normal` 9 quadros (0 ↓, 1 ↑, 2 ←, 3–4 passos ↓, 5–6 ↑, 7–8 ←; → é ← espelhado); `nurse` 4; demais 10. Paletas: red `player.pal`, nurse `npc_pink`, gentleman `npc_white`, boy `npc_green`, youngster `npc_blue`.
- Som de bater na parede: SE_WALL_HIT = `0x07`.

## Arquivos

| Arquivo | O que muda |
|---|---|
| `tools/build_assets.py` | + `build_world` / `check_world`; + `bump` nos sons; + `assets/font/widths.json` |
| `logic.js` | + `DIRS`, `around`, `pathToAny`, `pageFits`, `esc` |
| `check.mjs` | + testes de caminho, encaixe de texto e dos diálogos do `data.js` |
| `data.js` | + bloco `talk` (diálogos PT/EN) |
| `sound.js` | + `bump` na lista de pré-carga |
| `carts/center/dialog.js` | novo: caixa de mensagem |
| `carts/center/world.js` | novo: sala, pessoas, andar, clique-pra-andar |
| `carts/center/index.js` | novo: título + interações |
| `gba.js` | novo: o console |
| `index.html`, `style.css` | reescritos para o GBA |
| `app.js` | removido (a Pokédex vermelha) |
| `tools/e2e.mjs` | reescrito para a fase 1 |

---

### Task 1: Sala, personagens, som de batida e larguras da fonte no build

**Files:** Modify `tools/build_assets.py`

**Produz:** `assets/world/center-floor.png`, `center-over.png` (240×160), `center.json` (`{ w, h, walls[y][x] 0|1, behavior[y][x], people: [{ id, x, y, wander }] }`), `assets/world/people/{red,nurse,gentleman,boy,youngster}.png`, `assets/sfx/bump.wav`, `assets/font/widths.json` (`{ "A": 6, ... }`).

- [ ] **Step 1: verificação primeiro** — adicionar antes de `def main` (falha porque `build_world` ainda não existe quando ligada no `main`):

```python
def check_world(walls, behavior, people):
    w, h, _, _ = pngio.read(OUT / 'world/center-floor.png')
    assert (w, h) == (240, 160), (w, h)
    assert len(walls) == 10 and all(len(r) == 15 for r in walls)

    def find(b):
        return [(x, y) for y, row in enumerate(behavior) for x, v in enumerate(row) if v == b]
    assert find(0x83) == [(11, 1)], f'PC: {find(0x83)}'
    assert find(0x85) == [(12, 1), (13, 1)], f'region map: {find(0x85)}'
    assert find(0x6A) == [(1, 6)] and find(0x65) == [(7, 8)], (find(0x6A), find(0x65))
    assert {p['id'] for p in people} == {'nurse', 'gentleman', 'boy', 'youngster'}, people
    assert walls[8][7] == 0 and walls[4][7] == 0, 'door mat and counter front must be walkable'
    for name in WORLD_PEOPLE:
        w, h, _, _ = pngio.read(OUT / f'world/people/{name}.png')
        assert h == 32 and w % 16 == 0, (name, w, h)
    print(f'world ok ({len(people)} people)')
```

- [ ] **Step 2: construção** — adicionar antes de `check_world`:

```python
WORLD_PEOPLE = {   # sprite sheet and palette, as in the game's object event tables
    'red': ('red_normal', 'player'),
    'nurse': ('nurse', 'npc_pink'),
    'gentleman': ('gentleman', 'npc_white'),
    'boy': ('boy', 'npc_green'),
    'youngster': ('youngster', 'npc_blue'),
}
LAYER_COVERED = 1   # both halves of the metatile sit under the people


def load_tileset(kind, name):
    d = FR / 'data/tilesets' / kind / name
    _, _, tiles, _ = pngio.read(d / 'tiles.png')
    pals = [pngio.read_jasc(d / f'palettes/{i:02d}.pal') for i in range(16)]
    mt, at = (d / 'metatiles.bin').read_bytes(), (d / 'metatile_attributes.bin').read_bytes()
    metas = [struct.unpack_from('<8H', mt, i * 16) for i in range(len(mt) // 16)]
    attrs = [struct.unpack_from('<I', at, i * 4)[0] for i in range(len(at) // 4)]
    return tiles, pals, metas, attrs


def build_world():
    """FireRed's Pokémon Center 1F: a floor layer (under people), an over layer (the parts of
    metatiles drawn above people) and a JSON with collision, behaviors and who stands where."""
    out = OUT / 'world'
    (out / 'people').mkdir(parents=True, exist_ok=True)
    prim, sec = load_tileset('primary', 'building'), load_tileset('secondary', 'pokemon_center')
    W, H = 15, 10
    blocks = struct.unpack(f'<{W * H}H', (FR / 'data/layouts/PokemonCenter_1F/map.bin').read_bytes())
    backdrop = tuple(prim[1][0][0]) + (255,)
    floor = [[backdrop] * (W * 16) for _ in range(H * 16)]
    over = [[(0, 0, 0, 0)] * (W * 16) for _ in range(H * 16)]

    def meta(mid):
        return (prim[2][mid], prim[3][mid]) if mid < 640 else (sec[2][mid - 640], sec[3][mid - 640])

    def draw(img, bx, by, entries):
        for k, e in enumerate(entries):
            idx, hflip, vflip, p = e & 0x3FF, e >> 10 & 1, e >> 11 & 1, e >> 12
            tiles, i = (prim[0], idx) if idx < 640 else (sec[0], idx - 640)
            colors = prim[1][p] if p < 7 else sec[1][p]
            tx, ty = (i % 16) * 8, (i // 16) * 8
            ox, oy = bx + (k % 2) * 8, by + (k // 2) * 8
            for y in range(8):
                for x in range(8):
                    v = tiles[ty + (7 - y if vflip else y)][tx + (7 - x if hflip else x)]
                    if v:
                        img[oy + y][ox + x] = tuple(colors[v]) + (255,)

    walls, behavior = [], []
    for y in range(H):
        walls.append([])
        behavior.append([])
        for x in range(W):
            b = blocks[y * W + x]
            entries, attr = meta(b & 0x3FF)
            draw(floor, x * 16, y * 16, entries[:4])
            draw(floor if (attr >> 29) & 3 == LAYER_COVERED else over, x * 16, y * 16, entries[4:])
            walls[y].append(1 if b >> 10 & 3 else 0)
            behavior[y].append(attr & 0x1FF)
    pngio.write(out / 'center-floor.png', floor)
    pngio.write(out / 'center-over.png', over)

    events = json.loads((FR / 'data/maps/ViridianCity_PokemonCenter_1F/map.json').read_text(encoding='utf-8'))
    people = [{'id': o['graphics_id'].replace('OBJ_EVENT_GFX_', '').lower(), 'x': o['x'], 'y': o['y'],
               'wander': o['movement_type'] == 'MOVEMENT_TYPE_WANDER_AROUND'} for o in events['object_events']]
    (out / 'center.json').write_text(json.dumps({'w': W, 'h': H, 'walls': walls, 'behavior': behavior, 'people': people}),
                                     encoding='utf-8')
    G = GFX / 'object_events'
    for name, (pic, pal) in WORLD_PEOPLE.items():
        _, _, px, _ = pngio.read(G / f'pics/people/{pic}.png')
        pngio.write(out / f'people/{name}.png', pngio.to_rgba(px, pngio.read_jasc(G / f'palettes/{pal}.pal')))
    return walls, behavior, people
```

- [ ] **Step 3: som de batida e larguras** — em `SFX`, acrescentar `'bump': 0x07`. Em `build_fonts`, logo após gravar `charset.json`:

```python
    (font / 'widths.json').write_text(json.dumps(adv, ensure_ascii=False), encoding='utf-8')
```

e no `main`, acrescentar como última linha:

```python
    check_world(*build_world())
```

- [ ] **Step 4: rodar** — `<venv>/python tools/build_assets.py`
Esperado: `ui ok`, `fonts ok`, `audio ok (8 sfx, 386 cries)`, `world ok (4 people)`. Abrir `assets/world/center-floor.png` + `center-over.png` sobrepostos (prancha ampliada) e conferir que é o Centro Pokémon do FireRed e que o balcão está na camada de cima.

- [ ] **Step 5: commit**

```bash
git add tools/build_assets.py assets/world assets/sfx/bump.wav assets/font/widths.json
git commit -m "feat: Centro Pokémon do FireRed montado a partir dos arquivos do jogo"
```

---

### Task 2: Lógica de caminho e diálogos

**Files:** Modify `logic.js`, `check.mjs`, `data.js`, `sound.js`

**Produz (`logic.js`):**
- `DIRS = { up: [0,-1], down: [0,1], left: [-1,0], right: [1,0] }`
- `around({x, y}) -> [{x, y, face}]` — as 4 casas de onde se alcança `(x, y)`, com a direção para olhar
- `pathToAny(walkable, from, goals) -> { steps: string[], face: string|null } | null` — BFS até o objetivo mais próximo
- `pageFits(page, widths, max = 208) -> boolean`
- `esc(text) -> string`

- [ ] **Step 1: testes (falham)** — no `check.mjs`, trocar o import de `logic.js` por:

```js
import {
  parseRoute, parent, spritePath, nextIndex, fitScale, coverScale, cycle, splitShown, pickNext,
  discPath, rrectPath, TYPES, SHAPES, DIRS, around, pathToAny, pageFits, esc,
} from './logic.js';
```

e acrescentar antes de `// --- content (data.js)`:

```js
// world: paths over the real Pokémon Center collision map
const here0 = (path) => new URL(path, import.meta.url);
const room = JSON.parse(readFileSync(here0('assets/world/center.json'), 'utf8'));
const walk = (x, y) => x >= 0 && y >= 0 && x < room.w && y < room.h && !room.walls[y][x];
assert.deepEqual(Object.keys(DIRS), ['up', 'down', 'left', 'right']);
assert.deepEqual(around({ x: 5, y: 5 }).map((g) => [g.x, g.y, g.face]), [[5, 6, 'up'], [5, 4, 'down'], [6, 5, 'left'], [4, 5, 'right']]);
assert.deepEqual(pathToAny(walk, { x: 7, y: 8 }, [{ x: 7, y: 8 }]), { steps: [], face: null });
assert.deepEqual(pathToAny(walk, { x: 7, y: 8 }, [{ x: 7, y: 4, face: 'up' }]), { steps: ['up', 'up', 'up', 'up'], face: 'up' });
assert.equal(pathToAny(walk, { x: 7, y: 8 }, [{ x: 7, y: 2 }]), null, 'behind the counter is unreachable');
const toPc = pathToAny(walk, { x: 7, y: 8 }, around({ x: 11, y: 1 }));
assert.equal(toPc.face, 'up');
assert.equal(toPc.steps.length, 10, 'shortest walk from the door to the PC');

// text that must fit the message box (2 lines, 208px in the game font)
const widthsOf = JSON.parse(readFileSync(here0('assets/font/widths.json'), 'utf8'));
assert.ok(pageFits('Olá!\nTudo bem?', widthsOf));
assert.ok(!pageFits('a\nb\nc', widthsOf));
assert.ok(!pageFits('x'.repeat(60), widthsOf));
assert.equal(esc('<a&"\n'), '&lt;a&amp;&quot;\n');
```

e, no fim (antes do `console.log`):

```js
// dialogue: same keys in both languages, every page fits the box
assert.deepEqual(Object.keys(DATA.talk.pt).sort(), Object.keys(DATA.talk.en).sort(), 'talk: pt e en com chaves diferentes');
for (const l of ['pt', 'en']) {
  for (const [k, pages] of Object.entries(DATA.talk[l])) {
    pages.forEach((page, i) => assert.ok(pageFits(page, widthsOf), `talk.${l}.${k}[${i}] não cabe na caixa: "${page}"`));
  }
}
```

e, na checagem de fonte, ignorar a quebra de linha: trocar `for (const ch of shown) assert.ok(...)` por

```js
  for (const ch of shown) if (ch !== '\n') assert.ok(charset.has(ch), `caractere "${ch}" não existe na fonte do jogo (em "${s.slice(0, 40)}")`);
```

Run `node check.mjs` → FAIL (`DIRS` não exportado).

- [ ] **Step 2: `logic.js`** — acrescentar no fim:

```js
export const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

// The 4 tiles from which (x, y) can be reached, and the way to face from each.
export const around = ({ x, y }) => Object.entries(DIRS).map(([face, [dx, dy]]) => ({ x: x - dx, y: y - dy, face }));

// Shortest 4-way walk (BFS) from `from` to the nearest goal ({ x, y, face? }).
// Returns { steps, face } or null when no goal is reachable.
export function pathToAny(walkable, from, goals) {
  const key = (x, y) => `${x},${y}`;
  const goalAt = new Map(goals.map((g) => [key(g.x, g.y), g]));
  const prev = new Map([[key(from.x, from.y), null]]);
  const queue = [[from.x, from.y]];
  for (let head = 0; head < queue.length; head++) {
    const [x, y] = queue[head];
    const goal = goalAt.get(key(x, y));
    if (goal) {
      const steps = [];
      for (let k = key(x, y); prev.get(k); k = prev.get(k).from) steps.unshift(prev.get(k).dir);
      return { steps, face: goal.face ?? null };
    }
    for (const [dir, [dx, dy]] of Object.entries(DIRS)) {
      const nx = x + dx, ny = y + dy, k = key(nx, ny);
      if (prev.has(k) || !walkable(nx, ny)) continue;
      prev.set(k, { from: key(x, y), dir });
      queue.push([nx, ny]);
    }
  }
  return null;
}

// A message box page: at most 2 lines, each at most `max` pixels in the game font.
export function pageFits(page, widths, max = 208) {
  const lines = page.split('\n');
  return lines.length <= 2 && lines.every((l) => [...l].reduce((w, ch) => w + (widths[ch] ?? 6), 0) <= max);
}

export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
```

- [ ] **Step 3: diálogos no `data.js`** — acrescentar antes de `ui: {`:

```js
  // Message box pages: up to 2 lines each (\n), short enough to fit (node check.mjs checks).
  talk: {
    pt: {
      nurse_welcome: [
        'Olá! Bem-vindo ao Centro\nPokémon do JOÃO CABRAL!',
        'Aqui os Pokémon são os projetos\ndele. Explore à vontade!',
        'Ande com as setas (ou WASD)\nou clicando no chão.',
        'Para falar com alguém ou usar\nalgo, aperte A ou clique nele.',
      ],
      nurse: ['O JOÃO criou este Centro para\nvocê conhecer os projetos dele.', 'Em breve eu cuido dos seus\nPokémon e passo o contato dele!'],
      pc: ['O PC está ligado...', 'A Box de projetos chega\njá já!'],
      board: ['Um quadro com o mapa\nde Kanto...', 'Em breve: o cartão de treinador\ndo JOÃO, com as insígnias.'],
      shelf: ['Livros sobre programação\ne games. Alguns bem gastos!'],
      gentleman: ['Eu sou o Tutor de Golpes.', 'Em breve vou ensinar as\nhabilidades do JOÃO!'],
      boy: ['Dica: segure B enquanto\nanda para correr!'],
      youngster: ['Sabia que dá pra clicar em\nqualquer lugar para andar?'],
      stairs: ['A sala de minijogos lá em\ncima está em obras!'],
      door: ['Lá fora ainda está em\nconstrução. Volte depois!'],
    },
    en: {
      nurse_welcome: [
        "Hello! Welcome to JOÃO CABRAL's\nPokémon Center!",
        'Here the Pokémon are his\nprojects. Feel free to explore!',
        'Walk with the arrow keys\n(or WASD) or click the floor.',
        'To talk to someone or use\nsomething, press A or click it.',
      ],
      nurse: ['JOÃO built this Center so you\ncan get to know his projects.', "Soon I'll heal your Pokémon\nand give you his contact!"],
      pc: ['The PC is on...', 'The projects Box is\ncoming soon!'],
      board: ['A board with a map\nof Kanto...', "Soon: JOÃO's Trainer Card,\nwith his badges."],
      shelf: ['Books about programming\nand games. Some well worn!'],
      gentleman: ["I'm the Move Tutor.", "Soon I'll teach JOÃO's\nskills!"],
      boy: ['Tip: hold B while walking\nto run!'],
      youngster: ['Did you know you can click\nanywhere to walk there?'],
      stairs: ['The minigames room upstairs\nis under construction!'],
      door: ['The town outside is still\nbeing built. Come back later!'],
    },
  },

```

- [ ] **Step 4: `sound.js`** — trocar a lista `SFX` por:

```js
const SFX = ['select', 'win_open', 'pc_on', 'dex_scroll', 'dex_page', 'success', 'shiny', 'bump'];
```

- [ ] **Step 5: rodar** — `node check.mjs` → `check ok`. Se alguma página não couber, encurtar o texto (o erro diz qual).

- [ ] **Step 6: commit**

```bash
git add logic.js check.mjs data.js sound.js
git commit -m "feat: caminho na grade, encaixe de texto e diálogos do Centro"
```

---

### Task 3: O cartucho do Centro Pokémon

**Files:** Create `carts/center/dialog.js`, `carts/center/world.js`, `carts/center/index.js`

**Interfaces:**
- `createDialog(root, api) -> { open: boolean, say(pages, onDone), advance() }`
- `createWorld(root, map, hooks) -> { button(name, down), pointer(x, y), freeze(on), stop() }`; `hooks = { interact(target), blocked(to, dir, from) -> boolean, bump() }`; `target` é `{ person: id }` ou `{ x, y, behavior }`
- exporta `BEHAVIOR = { COUNTER: 0x80, BOOKSHELF: 0x81, PC: 0x83, REGION_MAP: 0x85, STAIRS: 0x6a, DOOR_MAT: 0x65 }`
- cartucho (default de `index.js`): `{ start(screen, api), stop(), button(name, down), pointer(x, y), open(target) }`; `api = { sfx, cry, store, t, talk, cps, reduced }`
- O jogador é o `.person[data-me]`, com `data-x`, `data-y`, `data-dir` (o e2e lê isso)

- [ ] **Step 1: `carts/center/dialog.js`**

```js
import { typewrite } from '../../typewriter.js';
import { esc } from '../../logic.js';

// The Gen 3 message box: pages of up to two lines, typed out, ▼ while more pages follow.
export function createDialog(root, api) {
  const box = document.createElement('div');
  box.className = 'msg box';
  box.hidden = true;
  const spoken = document.createElement('p');   // screen readers get each page whole, not letter by letter
  spoken.className = 'sr';
  spoken.setAttribute('aria-live', 'polite');
  root.append(box, spoken);
  let pages = [];
  let page = 0;
  let skip = null;
  let done = null;

  function show() {
    box.classList.remove('more');
    box.innerHTML = `<p aria-hidden="true">${esc(pages[page])}</p><i class="next"></i>`;
    spoken.textContent = pages[page].replace('\n', ' ');
    const finish = () => {
      skip = null;
      box.classList.toggle('more', page < pages.length - 1);
    };
    if (api.reduced()) return finish();
    skip = typewrite(box.firstElementChild, api.cps(), finish);
  }

  return {
    get open() { return !box.hidden; },
    say(list, onDone) {
      pages = list;
      page = 0;
      done = onDone;
      box.hidden = false;
      show();
    },
    advance() {
      if (skip) return skip();
      if (page < pages.length - 1) {
        page += 1;
        api.sfx('select');
        return show();
      }
      box.hidden = true;
      spoken.textContent = '';
      const cb = done;
      done = null;
      cb?.();
    },
  };
}
```

- [ ] **Step 2: `carts/center/world.js`**

```js
import { DIRS, around, pathToAny } from '../../logic.js';

export const BEHAVIOR = { COUNTER: 0x80, BOOKSHELF: 0x81, PC: 0x83, REGION_MAP: 0x85, STAIRS: 0x6a, DOOR_MAT: 0x65 };
const CLICKABLE = new Set([BEHAVIOR.COUNTER, BEHAVIOR.BOOKSHELF, BEHAVIOR.PC, BEHAVIOR.REGION_MAP, BEHAVIOR.STAIRS]);
const STEP = 266;       // ms per tile: 16 frames at 60 fps, as in the game
const RUN_STEP = 133;   // holding B
const TURN = 90;        // a quick tap only turns around; holding walks
const FRAMES = { down: [0, 3, 4], up: [1, 5, 6], left: [2, 7, 8], right: [2, 7, 8] };   // standing, step A, step B
const OPPOSITE = { up: 'down', down: 'up', left: 'right', right: 'left' };

function draw(p) {
  p.el.style.left = `${p.px}px`;
  p.el.style.top = `${p.py - 16}px`;
  p.el.style.zIndex = String(p.py);
  p.el.style.backgroundPosition = `${-FRAMES[p.dir][p.frame] * 16}px 0`;
  p.el.classList.toggle('flip', p.dir === 'right');
  Object.assign(p.el.dataset, { x: p.x, y: p.y, dir: p.dir });
}

function person(layer, id, x, y, dir) {
  const el = document.createElement('i');
  el.className = 'person';
  el.style.backgroundImage = `url(assets/world/people/${id}.png)`;
  layer.append(el);
  const p = { el, id, x, y, dir, px: x * 16, py: y * 16, frame: 0, to: null, parity: false };
  draw(p);
  return p;
}

export function createWorld(root, map, hooks) {
  root.insertAdjacentHTML('beforeend', `<img class="layer" src="assets/world/center-floor.png" alt="" draggable="false">
    <div class="people"></div>
    <img class="layer" src="assets/world/center-over.png" alt="" draggable="false">`);
  const layer = root.querySelector('.people');
  const player = person(layer, 'red', 7, 8, 'up');
  player.el.dataset.me = '';
  const npcs = map.people.map((n) => Object.assign(person(layer, n.id, n.x, n.y, 'down'), { home: { x: n.x, y: n.y }, wander: n.wander, next: 0 }));
  const people = [player, ...npcs];

  let order = [];          // held directions, last pressed wins
  let running = false;
  let turnAt = 0;
  let path = [];
  let pathDone = null;
  let frozen = false;
  let lastBump = 0;
  let raf = 0;

  const inside = (x, y) => x >= 0 && y >= 0 && x < map.w && y < map.h;
  const occupied = (x, y) => people.some((p) => (p.x === x && p.y === y) || (p.to && p.to.x === x && p.to.y === y));
  const free = (x, y) => inside(x, y) && !map.walls[y][x] && !occupied(x, y);
  const walkable = (x, y) => free(x, y) && map.behavior[y][x] !== BEHAVIOR.STAIRS;

  function startStep(p, dir, dur, now) {
    const [dx, dy] = DIRS[dir];
    Object.assign(p, { dir, from: { x: p.x, y: p.y }, to: { x: p.x + dx, y: p.y + dy }, t0: now, dur, parity: !p.parity });
  }

  function tick(p, now) {
    if (!p.to) return;
    const k = Math.min(1, (now - p.t0) / p.dur);
    p.px = Math.round((p.from.x + (p.to.x - p.from.x) * k) * 16);
    p.py = Math.round((p.from.y + (p.to.y - p.from.y) * k) * 16);
    p.frame = k < 0.5 ? (p.parity ? 1 : 2) : 0;
    if (k >= 1) {
      Object.assign(p, { x: p.to.x, y: p.to.y, to: null, frame: 0 });
    }
    draw(p);
  }

  function tryWalk(dir, now) {
    const [dx, dy] = DIRS[dir];
    const to = { x: player.x + dx, y: player.y + dy };
    player.dir = dir;
    draw(player);
    if (hooks.blocked(to, dir, { x: player.x, y: player.y })) {
      order = [];
      path = [];
      pathDone = null;
      return false;
    }
    if (!free(to.x, to.y)) {
      if (now - lastBump > 400) { lastBump = now; hooks.bump(); }
      return false;
    }
    startStep(player, dir, running ? RUN_STEP : STEP, now);
    return true;
  }

  function wanderTick(n, now) {
    if (!n.wander || n.to || frozen) return;
    if (!n.next) n.next = now + 1500 + Math.random() * 2000;
    if (now < n.next) return;
    n.next = now + 1500 + Math.random() * 2000;
    const dir = Object.keys(DIRS)[Math.floor(Math.random() * 4)];
    const [dx, dy] = DIRS[dir];
    const nx = n.x + dx, ny = n.y + dy;
    n.dir = dir;
    if (Math.abs(nx - n.home.x) <= 1 && Math.abs(ny - n.home.y) <= 1 && walkable(nx, ny)) startStep(n, dir, STEP, now);
    else draw(n);
  }

  function facing() {
    const [dx, dy] = DIRS[player.dir];
    return { x: player.x + dx, y: player.y + dy };
  }

  function act() {
    if (player.to) return;
    const f = facing();
    let who = npcs.find((p) => p.x === f.x && p.y === f.y);
    if (!who && map.behavior[f.y]?.[f.x] === BEHAVIOR.COUNTER) {   // talk across the counter, as in the game
      const [dx, dy] = DIRS[player.dir];
      who = npcs.find((p) => p.x === f.x + dx && p.y === f.y + dy);
    }
    if (who) {
      who.dir = OPPOSITE[player.dir];
      draw(who);
      return hooks.interact({ person: who.id });
    }
    hooks.interact({ x: f.x, y: f.y, behavior: map.behavior[f.y]?.[f.x] ?? 0 });
  }

  // Standing spots for reaching a tile: next to it, or across a counter.
  function goalsFor(t) {
    const goals = around(t);
    for (const [face, [dx, dy]] of Object.entries(DIRS)) {
      if (map.behavior[t.y - dy]?.[t.x - dx] === BEHAVIOR.COUNTER) goals.push({ x: t.x - 2 * dx, y: t.y - 2 * dy, face });
    }
    return goals;
  }

  function frame(now) {
    if (!player.to && !frozen) {
      if (path.length) {
        if (!tryWalk(path.shift(), now)) path = [];
      } else if (pathDone) {
        const done = pathDone;
        pathDone = null;
        done();
      } else {
        const dir = order[order.length - 1];
        if (dir && now - turnAt >= TURN) tryWalk(dir, now);
      }
    }
    for (const p of people) {
      if (p !== player) wanderTick(p, now);
      tick(p, now);
    }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  return {
    button(name, down) {
      if (DIRS[name]) {
        order = order.filter((d) => d !== name);
        if (!down) return;
        order.push(name);
        path = [];
        pathDone = null;
        if (!player.to && name !== player.dir) {
          player.dir = name;
          turnAt = performance.now();
          draw(player);
        }
      } else if (name === 'b') {
        running = down;
      } else if (name === 'a' && down && !frozen) {
        act();
      }
    },
    pointer(px, py) {
      if (frozen) return;
      const tx = Math.floor(px / 16), ty = Math.floor(py / 16);
      const who = npcs.find((p) => p.x === tx && (p.y === ty || p.y - 1 === ty));   // sprites are two tiles tall
      const b = map.behavior[ty]?.[tx] ?? 0;
      if (!who && b === BEHAVIOR.DOOR_MAT && tx === player.x && ty === player.y) {
        hooks.blocked({ x: tx, y: ty + 1 }, 'down', { x: tx, y: ty });
        return;
      }
      const target = who || (CLICKABLE.has(b) ? { x: tx, y: ty } : null);
      const goals = target ? goalsFor(target) : [{ x: tx, y: ty }];
      const route = pathToAny(walkable, player, goals);
      if (!route) return;
      order = [];
      path = route.steps;
      pathDone = () => {
        if (route.face) {
          player.dir = route.face;
          draw(player);
        }
        if (!target) return;
        if (b === BEHAVIOR.STAIRS && !who) tryWalk(route.face, performance.now());
        else act();
      };
    },
    freeze(on) {
      frozen = on;
      if (on) {
        order = [];
        path = [];
        pathDone = null;
      }
    },
    stop() {
      cancelAnimationFrame(raf);
    },
  };
}
```

- [ ] **Step 3: `carts/center/index.js`**

```js
// Cartridge 1: the Pokémon Center. Title screen first, then the room you walk around in.
import { createWorld, BEHAVIOR } from './world.js';
import { createDialog } from './dialog.js';

let api = null;
let screen = null;
let map = null;
let world = null;
let dialog = null;
let mode = 'off';   // off | title | loading | world

function title() {
  mode = 'title';
  screen.innerHTML = `<div class="title">
    <img class="logo" src="assets/ui/logo.png" alt="Pokémon FireRed">
    <p class="flames">${'<i></i>'.repeat(5)}</p>
    <p class="blink">${api.t('press_start')}</p>
  </div>`;
}

function say(pages, done) {
  world.freeze(true);
  dialog.say(pages, () => {
    world.freeze(false);
    done?.();
  });
}

function interact(target) {
  if (target.person) return say(api.talk(target.person));
  if (target.behavior === BEHAVIOR.PC) {
    api.sfx('pc_on');
    return say(api.talk('pc'));
  }
  if (target.behavior === BEHAVIOR.REGION_MAP) return say(api.talk('board'));
  if (target.behavior === BEHAVIOR.BOOKSHELF) return say(api.talk('shelf'));
}

// The stairs and the way out are hooks for later: the minigames room and the town.
function blocked(to, dir, from) {
  if (map.behavior[to.y]?.[to.x] === BEHAVIOR.STAIRS) {
    say(api.talk('stairs'));
    return true;
  }
  if (dir === 'down' && map.behavior[from.y]?.[from.x] === BEHAVIOR.DOOR_MAT) {
    say(api.talk('door'));
    return true;
  }
  return false;
}

async function enter() {
  if (mode !== 'title') return;
  mode = 'loading';
  api.sfx('select');
  map ??= await (await fetch('assets/world/center.json')).json();
  screen.innerHTML = '<div class="world"></div>';
  const root = screen.firstElementChild;
  world = createWorld(root, map, { interact, blocked, bump: () => api.sfx('bump') });
  dialog = createDialog(root, api);
  mode = 'world';
  if (!api.store.get('welcomed', false)) {
    setTimeout(() => {
      if (mode === 'world' && !dialog.open) say(api.talk('nurse_welcome'), () => api.store.set('welcomed', true));
    }, api.reduced() ? 0 : 500);
  }
}

export default {
  start(el, a) {
    screen = el;
    api = a;
    title();
  },
  stop() {
    world?.stop();
    world = null;
    dialog = null;
    mode = 'off';
    screen.innerHTML = '';
  },
  button(name, down) {
    if (mode === 'title') {
      if (down && (name === 'start' || name === 'a')) enter();
      return;
    }
    if (mode !== 'world') return;
    if (dialog.open) {
      if (down && (name === 'a' || name === 'b')) dialog.advance();
      return;
    }
    world.button(name, down);
  },
  pointer(x, y) {
    if (mode === 'title') return enter();
    if (mode !== 'world') return;
    if (dialog.open) return dialog.advance();
    world.pointer(x, y);
  },
  open() {},   // the shortcuts bar (projects / about / contact) arrives in phase 3
};
```

- [ ] **Step 4: sintaxe** — `node --check carts/center/dialog.js && node --check carts/center/world.js && node --check carts/center/index.js`

- [ ] **Step 5: commit**

```bash
git add carts
git commit -m "feat: cartucho do Centro Pokémon (sala, pessoas, andar, clique-pra-andar, diálogos)"
```

---

### Task 4: O GBA

**Files:** Create `gba.js`; Replace `index.html`, `style.css`; Delete `app.js`

- [ ] **Step 1: `index.html`**

```html
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, viewport-fit=cover">
  <title>João Cabral · Centro Pokémon</title>
  <meta name="description" content="Portfólio de João Cabral: um Centro Pokémon jogável.">
  <link rel="icon" href="assets/ui/ball.png">
  <link rel="preload" href="assets/font/gen3.woff" as="font" type="font/woff" crossorigin>
  <link rel="preload" href="assets/font/gen3-small.woff" as="font" type="font/woff" crossorigin>
  <link rel="stylesheet" href="style.css">
  <script type="module" src="gba.js"></script>
</head>
<body>
  <main class="gba" id="gba"><div class="screen" id="screen"></div></main>
  <noscript>Ative o JavaScript para jogar.</noscript>
</body>
</html>
```

- [ ] **Step 2: `style.css` (substituir inteiro)**

```css
@font-face { font-family: Gen3; src: url(assets/font/gen3.woff) format('woff'); font-display: block; }
@font-face { font-family: 'Gen3 Small'; src: url(assets/font/gen3-small.woff) format('woff'); font-display: block; }

:root {
  --k: 2;
  --frame: url(assets/ui/frame-1.png);
  --night: #141b2e;
  --night-2: #1a2340;
  font-synthesis: none;
}

* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { height: 100%; }
body {
  display: grid;
  place-items: center;
  overflow: hidden;
  background: var(--night) repeating-conic-gradient(var(--night-2) 0 25%, var(--night) 0 50%) 0 0 / calc(var(--k) * 4px) calc(var(--k) * 4px);
  font: 16px/16px Gen3, monospace;
}
button { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; }
img, video { image-rendering: pixelated; }
noscript { color: #f8f8f8; }
.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }

/* ---------- background video ---------- */
.bg-video { position: fixed; z-index: -2; }
.bg-dim { position: fixed; inset: 0; z-index: -1; background: rgb(0 0 0 / .5); }

/* ---------- the GBA (game pixels, scaled by --k) ---------- */
.gba { position: relative; width: 352px; height: 216px; zoom: var(--k); }
body:not(.ready) .gba { opacity: 0; }   /* not visibility: hidden, which would block focus */
.gba .body { position: absolute; inset: 0; shape-rendering: crispEdges; }
.p-dpad .g-dpad, .p-a .g-a, .p-b .g-b, .p-start .g-start, .p-select .g-select, .p-l .g-l, .p-r .g-r { transform: translateY(1px); }
.gba:has([data-btn="a"]:hover) .g-a, .gba:has([data-btn="b"]:hover) .g-b,
.gba:has([data-btn="start"]:hover) .g-start, .gba:has([data-btn="select"]:hover) .g-select,
.gba:has([data-btn="l"]:hover) .g-l, .gba:has([data-btn="r"]:hover) .g-r { filter: brightness(1.2); }
.led-sound { fill: #2a3a2a; }
.sound-on .led-sound { fill: #78f878; }
.hw { position: absolute; }
.round { display: grid; place-items: center; color: #2c2c34; font-family: 'Gen3 Small'; }
.label { position: absolute; font-family: 'Gen3 Small'; color: #a69ed8; text-align: center; white-space: nowrap; pointer-events: none; }
.label.name { left: 56px; top: 174px; width: 240px; }
.label.sel { left: 114px; top: 202px; width: 48px; }
.label.sta { left: 190px; top: 202px; width: 48px; }
.label.snd { left: 310px; top: 178px; width: 42px; }

/* ---------- the screen (240x160, Gen 3 UI) ---------- */
.screen {
  position: absolute; left: 56px; top: 14px; width: 240px; height: 160px; overflow: hidden;
  background: #000; color: #383838; --sh: #d8d8d8;
  touch-action: none; user-select: none; cursor: pointer;
}
.screen, .screen * { text-shadow: 1px 0 0 var(--sh), 0 1px 0 var(--sh), 1px 1px 0 var(--sh); }
.box { border: 8px solid transparent; border-image: var(--frame) 8 fill stretch; }
.blink { animation: blink 1s steps(1) infinite; }
@keyframes blink { 50% { opacity: 0; } }
.tw-rest { color: transparent; --sh: transparent; }

.title { position: absolute; inset: 0; display: grid; place-content: center; justify-items: center; gap: 4px; background: #000; color: #f8f8f8; --sh: #484848; }
.flames { display: flex; }
.flames i { width: 16px; height: 16px; background: url(assets/ui/flames.png) 0 0; animation: flame .5s steps(10) infinite; }
.flames i:nth-child(2n) { animation-delay: -.25s; }
@keyframes flame { to { background-position: 0 -160px; } }

.world { position: absolute; inset: 0; animation: from-black .3s steps(3); }
@keyframes from-black { from { filter: brightness(0); } }
.layer { position: absolute; left: 0; top: 0; width: 240px; height: 160px; pointer-events: none; }
.people { position: absolute; inset: 0; z-index: 0; pointer-events: none; }
.person { position: absolute; width: 16px; height: 32px; background-repeat: no-repeat; }
.person.flip { transform: scaleX(-1); }
.msg { position: absolute; left: 4px; right: 4px; bottom: 4px; height: 48px; z-index: 1; white-space: pre-line; }
.msg[hidden] { display: none; }
.msg .next { position: absolute; right: 0; bottom: 0; visibility: hidden; font-style: normal; }
.msg .next::before { content: '▼'; }
.msg.more .next { visibility: visible; animation: blink .6s steps(1) infinite; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
}
```

- [ ] **Step 3: `gba.js`**

```js
// The console: a GBA body around the 240x160 screen, integer scaling, the buttons (keyboard,
// mouse, touch), the sound switch and the page background. Games are cartridges: they get the
// screen and the buttons and know nothing about scaling or input devices.
import { DATA } from './data.js';
import { fitScale, coverScale, pickNext, discPath, rrectPath } from './logic.js';
import { setEnabled, sfx, cry } from './sound.js';
import cart from './carts/center/index.js';

const W = 352, H = 216;
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
  ${path('M8 8h336v2h-336z', HI)}${path('M8 210h336v2h-336z', LO)}
  ${box(44, 8, 264, 184, '#2c2c34', KEY_INK, [3, 1, 1])}
  ${path('M54 12h244v164h-244z', KEY_INK)}
  ${path(discPath(14, 20, 6), '#78f878')}
  <g class="g-dpad">${path(rrectPath(19, 82, 14, 36, [1]) + rrectPath(8, 93, 36, 14, [1]), KEY_INK)}${path(rrectPath(21, 84, 10, 32, []) + rrectPath(10, 95, 32, 10, []), KEY)}</g>
  <g class="g-a">${disc(326, 78, 20, '#c8c8d0', KEY_INK)}</g><g class="g-b">${disc(310, 104, 20, '#c8c8d0', KEY_INK)}</g>
  <g class="g-select">${box(126, 196, 24, 8, KEY, KEY_INK, [1])}</g><g class="g-start">${box(202, 196, 24, 8, KEY, KEY_INK, [1])}</g>
  ${path(discPath(324, 138, 6), '#2a3a2a', 'led-sound')}
  ${path(GRILL, LO)}
</svg>`;
const btn = (name, x, y, w, h, text = '', cls = 'hw') =>
  `<button type="button" class="${cls}" data-btn="${name}" tabindex="-1" aria-label="${name}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px">${text}</button>`;
const CONTROLS = [
  btn('up', 19, 82, 14, 12), btn('down', 19, 106, 14, 12), btn('left', 8, 93, 12, 14), btn('right', 32, 93, 12, 14),
  btn('a', 326, 78, 20, 20, 'A', 'hw round'), btn('b', 310, 104, 20, 20, 'B', 'hw round'),
  btn('select', 122, 192, 32, 16), btn('start', 198, 192, 32, 16),
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
```

- [ ] **Step 4: remover a Pokédex vermelha** — `git rm app.js`

- [ ] **Step 5: checar e ver** — `node --check gba.js && node check.mjs`; subir `python -m http.server 8123 --bind 127.0.0.1` e tirar screenshots (CDP, tempo real) do título, da sala, de um diálogo e do Red parado em frente ao PC, em 1920×1080 e 1366×768. Conferir: corpo do GBA sem nada estranho, tela 240×160 em escala inteira, Centro Pokémon idêntico ao jogo, pessoas nos lugares certos, balcão cobrindo a Enfermeira da cintura para baixo, caixa de diálogo com moldura e texto da fonte do jogo.

- [ ] **Step 6: commit**

```bash
git add index.html style.css gba.js
git commit -m "feat: o GBA com o Centro Pokémon como primeiro cartucho"
```

---

### Task 5: Teste de interação da fase 1

**Files:** Replace `tools/e2e.mjs`

- [ ] **Step 1: `tools/e2e.mjs`** — manter o cabeçalho, o servidor, o lançamento do Edge, `send`, `ev`, `KEYS`, `keyDown`, `key`, `sleep`, `ok` e a coleta de erros da versão atual; acrescentar `Space`/`Shift` não é necessário. Substituir tudo depois de `await send('Emulation.setFocusEmulationEnabled', ...)` por:

```js
const me = () => ev(`(() => { const p = document.querySelector('.person[data-me]'); return p ? [Number(p.dataset.x), Number(p.dataset.y), p.dataset.dir] : null; })()`);
const msg = () => ev(`(() => { const m = document.querySelector('.msg'); return m && !m.hidden ? m.textContent : null; })()`);
const hold = async (k, ms) => { await keyDown(k); await sleep(ms); await send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, ...KEYS[k], text: undefined }); await sleep(150); };
const closeMsg = async () => { for (let i = 0; i < 15 && (await msg()) !== null; i++) await key('z', 250); assert.equal(await msg(), null, 'caixa de diálogo não fechou'); };
const clickTile = async (tx, ty) => {
  const r = await ev(`(() => { const b = document.getElementById('screen').getBoundingClientRect(); return [b.left, b.top, b.width / 240]; })()`);
  const x = r[0] + (tx * 16 + 8) * r[2], y = r[1] + (ty * 16 + 8) * r[2];
  for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 });
};

await send('Page.navigate', { url: BASE });
await sleep(1500);
await ev('localStorage.clear()');
await send('Page.reload');
await sleep(1500);

assert.ok(await ev(`document.fonts.check('16px Gen3')`), 'fonte do jogo não carregou');
assert.ok(await ev(`!!document.querySelector('.title .logo')`), 'tela de título não apareceu');
ok('tela de título do FireRed');

await key('Enter', 900);
assert.deepEqual(await me(), [7, 8, 'up']);
ok('START entra no Centro Pokémon, Red na porta');

await sleep(700);
assert.match((await msg()) ?? '', /Bem-vindo/);
await closeMsg();
assert.equal(await ev(`localStorage.getItem('welcomed')`), 'true');
ok('Enfermeira dá as boas-vindas uma vez');

await hold('ArrowUp', 4 * 266 + 200);
assert.deepEqual(await me(), [7, 4, 'up']);
await hold('ArrowUp', 400);
assert.deepEqual(await me(), [7, 4, 'up'], 'atravessou o balcão');
ok('anda com o teclado e o balcão bloqueia');

await key('z', 400);
assert.match((await msg()) ?? '', /JOÃO/);
await closeMsg();
ok('fala com a Enfermeira por cima do balcão');

await clickTile(11, 1);
await sleep(8 * 266 + 900);
assert.deepEqual(await me(), [11, 2, 'up']);
assert.match((await msg()) ?? '', /PC/);
await closeMsg();
ok('clique no PC: anda até ele e liga');

await clickTile(1, 6);
await sleep(12 * 266 + 900);
assert.match((await msg()) ?? '', /obras/);
await closeMsg();
ok('escada: sala de minijogos em obras');

await keyDown('ArrowLeft');
assert.ok(await ev(`document.getElementById('gba').classList.contains('p-dpad')`), 'direcional não afundou');
await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowLeft', ...KEYS.ArrowLeft });
await sleep(400);
const box = await ev(`(() => { const b = document.querySelector('[data-btn="sound"]').getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; })()`);
for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x: box[0], y: box[1], button: 'left', clickCount: 1 });
await sleep(200);
assert.ok(await ev(`document.body.classList.contains('sound-on')`));
assert.equal(await ev(`localStorage.getItem('sound')`), 'true');
ok('direcional afunda com o teclado; botão de som liga');

assert.deepEqual(errors, [], 'erros no console: ' + errors.join('\n'));
ok('nenhum erro no console');

ws.close();
edge.kill();
server.close();
console.log('e2e ok');
process.exit(0);
```

- [ ] **Step 2: rodar** — `node tools/e2e.mjs` → todas as linhas `ok` e `e2e ok`. Se falhar, corrigir o jogo (não afrouxar o teste).

- [ ] **Step 3: verificação final** — `<venv>/python tools/build_assets.py && node check.mjs && node tools/e2e.mjs`; screenshots finais.

- [ ] **Step 4: commit**

```bash
git add tools/e2e.mjs
git commit -m "test: teste de interação da fase 1 do Centro Pokémon"
```
