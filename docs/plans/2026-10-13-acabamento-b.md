# Acabamento — etapa B (abertura) — plano de implementação

**Objetivo:** ao abrir o site pela primeira vez na sessão, o GBA liga (a luz POWER acende), roda a cena da GAME FREAK do FireRed e a entrada animada da tela de título, até o PRESS START. Qualquer botão pula para o título pronto.

**Arquitetura:** um módulo novo `carts/center/intro.js` (cena da GAME FREAK, simulada quadro a quadro como `intro.c`) e a entrada do título dentro de `carts/center/title.js` (estados INIT…FADEIN de `title_screen.c`). A matemática de cor do GBA (fade, cinza, brilho, alfa), o gerador aleatório, a posição da estrela e o roteiro da entrada ficam em `logic.js`, testados no `check.mjs`. O cartucho decide a sequência; o console acende a luz antes de ligar o cartucho.

**Tecnologia:** HTML/CSS/JS (módulos ES, canvas 2D), sem dependências. Assets pelo `tools/build_assets.py`. Testes: `node check.mjs`, `node tools/e2e.mjs`.

**Spec:** `docs/specs/2026-10-12-acabamento-design.md`, seção 2.

## Restrições globais

- Commits como **João Cabral <joaovcabralm@hotmail.com>**.
- Só gráficos originais do jogo, gerados de `new assets/`.
- Números do decomp citados no código; passos no ritmo do GBA (59,7275 quadros/s).
- Movimento reduzido: sem abertura nem entrada, direto ao título pronto. Links diretos (`#/contato`) pulam tudo.
- Rodar `node check.mjs` e `node tools/e2e.mjs` antes de cada commit.

## Números usados (do decomp; T = quadro em que a estrela aparece, M = quadro da entrada do título)

| O quê | Valor | Fonte |
|---|---|---|
| Janela da cena | vertical `[80−t, 80+t)`: vazia até T−7; t = 8, 16 … 48 de T−6 a T−1; depois 32–127 | `intro.c:1143-1164` |
| Faixa azul (BG3) | linhas 24–135 na cor 1 de `bg.pal` (24,41,74); resto preto | `intro.c:305-323` |
| Estrela | n = T+1: x = (248·16 − 96n) >> 4, y = (55·16 + 16n) >> 4, y2 = `gSineTable[(48n >> 4) + 64] >> 5`; some quando x < −8 | `intro.c:1953-1984, 2282-2302` |
| Rastro | a cada n com n % 8 ≠ 0: semente `·1103515245 + 24691` (início 354128453), xMod = ((semente>>16) & 7) + 2, yMod 0,1,2,3,−3,−2,−1…; posição em 1/32 px; pisca a partir de 91, some em 121 | `intro.c:1995-2023, 2305-2323` |
| Brilhos do nome | um a cada 7 quadros de T37 a T156 nos 9 pontos; animação única de 17 quadros, x ±26 refletindo em 52/188; depois de 120 quadros os da 2ª volta somem e os da 1ª caem 1/4 px por quadro por 51 quadros | `intro.c:436-446, 2035-2063, 2326-2372` |
| Brilhos grandes | T122 a T202, um a cada 10, na ordem 0,4,8,3,7,2,6,1,5; 4 quadros de 8 | `intro.c:2078-2095` |
| Nome | aparece em T163 com `StartBlendTask(0,16,16,0,48)`; opaco em T258 | `intro.c:1209-1222` |
| Logo | sprite semitransparente T311–342 com `StartBlendTask(0,16,16,0,16)`; vira BG2 em T342 | `intro.c:1237-1263` |
| Saída | `StartBlendTask(16,0,0,16,20)` de T435 a T474; fim em T475 | `intro.c:1269-1293` |
| StartBlendTask | 2n quadros: A anda nos ímpares, B nos pares, de trunc(Δ·256/n); EVA = A>>8, EVB = B>>8; o último quadro crava o destino | `menu2.c:591-637` |
| Entrada do título | faixa de brilho M2–34 (centro 128−4(M−2), EVY 15−\|dy\|); Charizard cinza saindo do preto M48–135 (passo a cada 11); flashes M179–185 e M203–209 (1,6,11,15,10,5,0) e M227–231 (0,4,8,12,16); borda entra da esquerda M181–190 (24 px/quadro); barras entram da direita M202–211; logo sai do branco M231–254 (passo a cada 3); Charizard colorido sai do branco M232–262; RUN em M263 | `title_screen.c:472-605, 762-810`, `palette.c` |
| Cores do GBA | canal de 5 bits; fade `c + ((alvo − c)·y >> 4)`; cinza `(76r + 151g + 29b) >> 8` em 7 degraus; brilho `c + ((31 − c)·EVY >> 4)`; alfa `min(31, (EVA·cima + EVB·baixo) >> 4)` | `blend_palette.c`, `palette.c:70-79` |

---

### Tarefa 1: assets da abertura e camadas separadas do título

**Arquivos:** `tools/build_assets.py`; gera `assets/intro/` (gf-text, gf-logo, star, sparkles-small, sparkles-big, intro.json) e troca `assets/title/front.png` por `bars.png`, `charizard.png` e `logo.png`.

- [ ] **Passo 1: verificações.** Em `check_title`, a tupla `('front', (240, 160))` vira `('bars', (240, 160)), ('charizard', (240, 160)), ('logo', (240, 160))`. Acrescentar antes de `def main():`

```python
def check_intro():
    for name, size in (('gf-text', (144, 16)), ('gf-logo', (32, 64)), ('star', (16, 16)),
                       ('sparkles-small', (16, 16)), ('sparkles-big', (32, 128))):
        w, h, _, _ = pngio.read(OUT / f'intro/{name}.png')
        assert (w, h) == size, f'intro/{name}.png is {w}x{h}'
    data = json.loads((OUT / 'intro/intro.json').read_text(encoding='utf-8'))
    assert len(data['sine']) == 320 and data['sine'][0] == 0 and data['sine'][64] == 256, 'gSineTable'
    assert tuple(data['navy']) == (24, 41, 74), data['navy']
    print('intro ok')
```

  e, em `main()`, depois de `check_title()`: `build_intro(OUT / 'intro')` e `check_intro()`.

- [ ] **Passo 2: rodar e ver falhar.** `"$VENV/Scripts/python" tools/build_assets.py` → `NameError: build_intro`.

- [ ] **Passo 3: implementar.** Em `build_title`, trocar o trecho de `front = [[(6, bg) …` até `pngio.write(out / 'front.png', rgba(front))` por:

```python
    bars = [[(6, bg) if p and press(p[0]) else p for p in row] for row in bg2]
    pngio.write(out / 'bars.png', rgba(bars))
    charizard = blank()
    _, _, tiles, _ = pngio.read(T / 'firered/box_art_mon.png')
    draw_bg(charizard, tiles, 12, T / 'firered/box_art_mon.bin', lambda e: pngio.read_jasc(T / 'firered/box_art_mon.pal'))
    pngio.write(out / 'charizard.png', rgba(charizard))
    logo = blank()
    _, _, tiles, _ = pngio.read(T / 'firered/game_title_logo.png')
    logo_pal = pngio.read_jasc(T / 'firered/game_title_logo.pal')
    draw_bg(logo, tiles, 32, T / 'firered/game_title_logo.bin', lambda e: logo_pal)   # 8bpp: index into all 208 colors
    pngio.write(out / 'logo.png', rgba(logo))
```

  ajustar a docstring (`front` → `bars (BG2), charizard (BG1), logo (BG0)`), e acrescentar:

```python
def build_intro(out):
    """The GAME FREAK scene's pieces (intro.c): the name (game_freak.png, grayscale, so index = 15 − gray,
    in logo.png's palette as on BG2), the logo, the star and the two sparkle sheets (sparkles.pal), plus
    intro.json with the band's navy (bg.pal colour 1) and gSineTable from trig.c (Q8.8 values)."""
    out.mkdir(parents=True, exist_ok=True)
    G = GFX / 'intro/game_freak'
    _, _, logo_px, logo_pal = pngio.read(G / 'logo.png')
    _, _, gray, _ = pngio.read(G / 'game_freak.png')
    pngio.write(out / 'gf-text.png', pngio.to_rgba([[15 - g for g in row] for row in gray], logo_pal))
    pngio.write(out / 'gf-logo.png', pngio.to_rgba(logo_px, logo_pal))
    rgba_png(G / 'star.png', out / 'star.png')
    rgba_png(G / 'sparkles_small.png', out / 'sparkles-small.png', G / 'sparkles.pal')
    rgba_png(G / 'sparkles_big.png', out / 'sparkles-big.png', G / 'sparkles.pal')
    src = (FR / 'src/trig.c').read_text(encoding='utf-8')
    table = src[src.index('gSineTable[]'):]
    table = table[:table.index('};')]
    sine = [int(float(v) * 256) for v in re.findall(r'Q_8_8\(([-0-9.]+)\)', table)]
    navy = pngio.read_jasc(G / 'bg.pal')[1]
    (out / 'intro.json').write_text(json.dumps({'navy': list(navy), 'sine': sine}, separators=(',', ':')), encoding='utf-8')
```

- [ ] **Passo 4: rodar e ver passar.** Build → `ui ok`, `title ok`, `intro ok`, `fonts ok…`, `world ok`; rodar de novo sem mudanças em `git status --short assets/`. `git rm assets/title/front.png`.

- [ ] **Passo 5: commit.** `git add tools/build_assets.py assets/intro assets/title && git commit -m "feat: peças da abertura da GAME FREAK e camadas separadas do título"`

---

### Tarefa 2: matemática do GBA e roteiros em `logic.js`

**Arquivos:** `logic.js`, `check.mjs`

**Produz:** `fade8(v, t5, y)`, `grey8(r, g, b)`, `brighten8(v, evy)`, `alpha8(top, below, eva, evb)` (canais de 8 bits como nas paletas, contas em 5 bits como no GBA); `blendLevels(a0, b0, a1, b1, n, r) → [EVA, EVB]`; `nextSeed(seed)`; `starPos(n, sine) → { x, y, y2 }`; `gfWindow(T) → [topo, base)`; `titleEntrance(M) → { band, charizard: { src, to, y }, border, bars, logo }`.

- [ ] **Passo 1: testes** (em `check.mjs`, importando as funções novas):

```js
// GBA colour maths on 8-bit palette values (5-bit channels inside)
assert.equal(fade8(248, 0, 16), 0);
assert.equal(fade8(248, 0, 0), 248, 'level 0 keeps the colour as it is');
assert.equal(fade8(0, 31, 16), 255);
assert.equal(fade8(0, 30, 8), 123);
assert.equal(grey8(248, 248, 248), 255);
assert.equal(grey8(0, 0, 0), 0);
assert.equal(grey8(128, 64, 0), 41, 'luma 9 snaps to the grey step 5');
assert.equal(brighten8(0, 15), 231);
assert.equal(alpha8(248, 74, 16, 0), 255);
assert.equal(alpha8(248, 74, 0, 16), 74);
// StartBlendTask
for (let k = 1; k < 32; k++) assert.deepEqual(blendLevels(0, 16, 16, 0, 16, k), [Math.ceil(k / 2), 16 - Math.floor(k / 2)]);
assert.deepEqual(blendLevels(0, 16, 16, 0, 16, 32), [16, 0]);
assert.deepEqual(blendLevels(0, 16, 16, 0, 48, 7), [1, 15]);
assert.deepEqual(blendLevels(16, 0, 0, 16, 20, 40), [0, 16]);
// the star's trail uses the game's generator: first sparkles' x offsets (seed 354128453)
let sd = 354128453;
const xMods = [];
for (let n = 1; n <= 9; n++) if (n % 8) { sd = nextSeed(sd); xMods.push(((sd >>> 16) & 7) + 2); }
assert.deepEqual(xMods, [6, 6, 5, 5, 6, 9, 6, 6]);
const sine = JSON.parse(readFileSync(new URL('assets/intro/intro.json', import.meta.url), 'utf8')).sine;
assert.deepEqual(starPos(1, sine), { x: 242, y: 56, y2: sine[67] >> 5 });
assert.equal(starPos(42, sine).x, -4);
assert.deepEqual(gfWindow(-7), [80, 80]);
assert.deepEqual(gfWindow(-6), [72, 88]);
assert.deepEqual(gfWindow(-1), [32, 128]);
assert.deepEqual(gfWindow(300), [32, 128]);
// the title's entrance
const E = titleEntrance;
assert.deepEqual(E(0).charizard, { src: 'color', to: 'black', y: 16 });
assert.equal(E(2).band, 128);
assert.equal(E(35).band, null);
assert.deepEqual(E(48).charizard, { src: 'grey', to: 'black', y: 16 });
assert.equal(E(58).charizard.y, 14);
assert.equal(E(135).charizard.y, 0);
assert.deepEqual(E(182).charizard, { src: 'grey', to: 'white', y: 15 });
assert.equal(E(231).charizard.y, 16);
assert.deepEqual(E(232).charizard, { src: 'color', to: 'white', y: 15 });
assert.equal(E(262).charizard.y, 0);
assert.equal(E(180).border, 0);
assert.equal(E(185).border, 120);
assert.equal(E(195).border, 240);
assert.equal(E(200).bars, 'black');
assert.equal(E(201).bars, 'hidden');
assert.equal(E(202).bars, 216);
assert.equal(E(212).bars, 0);
assert.equal(E(230).logo, null);
assert.equal(E(232).logo, 16);
assert.equal(E(233).logo, 14);
assert.equal(E(254).logo, 0);
```

- [ ] **Passo 2: rodar e ver falhar.** `node check.mjs` → erro de importação.

- [ ] **Passo 3: implementar** (em `logic.js`, depois de `multiTiles`):

```js
// ---------- GBA colour maths: palettes keep their 8-bit values, the hardware works in 5 bits ----------
const to5 = (v) => v >> 3;
const to8 = (c) => (c << 3) | (c >> 2);
// Palette fade (BlendPalette): c + ((target − c)·y >> 4), y 0–16. Level 0 leaves the colour untouched.
export const fade8 = (v, t5, y) => (y ? to8(to5(v) + (((t5 - to5(v)) * y) >> 4)) : v);
// TintPalette_GrayScale2: luma of the 5-bit colour, snapped to the game's 7 grey steps.
const GREY_STEPS = [0, 0, 0, 0, 0, 5, 5, 5, 5, 5, 11, 11, 11, 11, 11, 16, 16, 16, 16, 16, 21, 21, 21, 21, 21, 27, 27, 27, 27, 27, 31, 31];
export const grey8 = (r, g, b) => to8(GREY_STEPS[(76 * to5(r) + 151 * to5(g) + 29 * to5(b)) >> 8]);
// BLDY brighten and BLDALPHA blend, per 5-bit channel.
export const brighten8 = (v, evy) => to8(to5(v) + (((31 - to5(v)) * evy) >> 4));
export const alpha8 = (top, below, eva, evb) => to8(Math.min(31, (eva * to5(top) + evb * to5(below)) >> 4));

// StartBlendTask (menu2.c): over 2n frames, A moves on odd frames and B on even ones by trunc(Δ·256/n);
// EVA = A >> 8, EVB = B >> 8, and the last frame lands on (a1, b1). r = frames since it started.
export function blendLevels(a0, b0, a1, b1, n, r) {
  if (r >= 2 * n) return [a1, b1];
  const dA = Math.trunc(((a1 - a0) * 256) / n), dB = Math.trunc(((b1 - b0) * 256) / n);
  return [(a0 * 256 + dA * Math.ceil(r / 2)) >> 8, (b0 * 256 + dB * Math.floor(r / 2)) >> 8];
}

// The game's linear congruential generator (ISO_RANDOMIZE1).
export const nextSeed = (s) => (Math.imul(s, 1103515245) + 24691) >>> 0;

// GAME FREAK scene: the star on its n-th frame (SpriteCB_Star), and the window around the band.
export const starPos = (n, sine) => ({ x: (248 * 16 - 96 * n) >> 4, y: (55 * 16 + 16 * n) >> 4, y2: sine[((48 * n) >> 4) + 64] >> 5 });
export const gfWindow = (T) => (T <= -7 ? [80, 80] : T < 0 ? [80 - 8 * (T + 7), 80 + 8 * (T + 7)] : [32, 128]);

// What the title screen shows on frame M of its entrance (title_screen.c, INIT..FADEIN; RUN at 263):
// band = centre of the brighten band over Charizard; charizard = palette source and fade; border = BG3
// shown from x 0 to this; bars = 'black', 'hidden' or how far BG2 still is to the right; logo = fade
// level from white, or null while hidden.
const FLASH = [1, 6, 11, 15, 10, 5, 0];
export function titleEntrance(M) {
  let charizard;
  if (M < 48) charizard = { src: 'color', to: 'black', y: 16 };
  else if (M < 179) charizard = { src: 'grey', to: 'black', y: Math.max(0, 16 - 2 * Math.floor((M - 47) / 11)) };
  else if (M < 186) charizard = { src: 'grey', to: 'white', y: FLASH[M - 179] };
  else if (M < 203) charizard = { src: 'grey', to: 'white', y: 0 };
  else if (M < 210) charizard = { src: 'grey', to: 'white', y: FLASH[M - 203] };
  else if (M < 227) charizard = { src: 'grey', to: 'white', y: 0 };
  else if (M < 232) charizard = { src: 'grey', to: 'white', y: 4 * (M - 227) };
  else charizard = { src: 'color', to: 'white', y: Math.max(0, 15 - ((M - 232) >> 1)) };
  return {
    band: M >= 2 && M <= 34 ? 128 - 4 * (M - 2) : null,
    charizard,
    border: M <= 180 ? 0 : Math.min(240, 24 * (M - 180)),
    bars: M <= 200 ? 'black' : M === 201 ? 'hidden' : Math.max(0, 216 - 24 * (M - 202)),
    logo: M < 231 ? null : Math.max(0, 16 - 2 * Math.floor((M - 230) / 3)),
  };
}
```

- [ ] **Passo 4: rodar e ver passar.** `node check.mjs` → `check ok`.
- [ ] **Passo 5: commit.** `git add logic.js check.mjs && git commit -m "feat: cores do GBA, gerador do jogo e roteiros da abertura em logic.js"`

---

### Tarefa 3: título com camadas separadas e a entrada animada

**Arquivos:** `carts/center/title.js` (arquivo inteiro), `tools/e2e.mjs`

**Produz:** `createTitle(root, { reduced, entrance = false }) → { stop(), leave(), skip(), entering }`.

- [ ] **Passo 1: `title.js` (arquivo inteiro).**

```js
// FireRed's title screen as title_screen.c runs it. The entrance (INIT..FADEIN, 263 frames): a light
// band sweeps Charizard's silhouette, Charizard fades in grey, the border wipes in, the bars slide in
// from the right, three flashes, then the logo and Charizard fade from white into colour. Then the
// steady screen: the flame sprites (same RNG, seed, waves and 62 free sprite slots), the shine
// sweeping the logo every 574 frames and PRESS START blinking 60 frames on, 30 off. Everything is
// stepped at the GBA's frame rate.
import { nextSeed, titleEntrance, fade8, grey8, brighten8 } from '../../logic.js';

const FPS = 59.7275;
const FLAME_X = [4, 16, 26, 32, 48, 200, 216, 224, 232, 60, 76, 92, 108, 128, 144];
const MAX_FLAMES = 62;   // 64 sprites minus the blank sprite and the slash
const ENTRANCE = 263;    // RUN starts on this frame
const load = (src) => Object.assign(new Image(), { src });
const sheet = (...imgs) => {
  const c = Object.assign(document.createElement('canvas'), { width: 240, height: 160 });
  imgs.forEach((i) => c.getContext('2d').drawImage(i, 0, 0));
  return c;
};
const pixels = (c) => c.getContext('2d').getImageData(0, 0, 240, 160);

// The entrance's drawing: layers as pixels, recoloured per frame like the game's palette effects.
function entranceDrawer(canvas, [back, bars, press, charizard, logo]) {
  const ctx = canvas.getContext('2d');
  const cache = new Map();
  const variant = (key, base, fn) => {
    if (!cache.has(key)) {
      const img = new ImageData(new Uint8ClampedArray(base.data), 240, 160);
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) if (d[i + 3]) [d[i], d[i + 1], d[i + 2]] = fn(d[i], d[i + 1], d[i + 2]);
      const c = sheet();
      c.getContext('2d').putImageData(img, 0, 0);
      cache.set(key, c);
    }
    return cache.get(key);
  };
  const barsSheet = sheet(bars, press);   // BG2: the bars and PRESS START
  const barsPx = pixels(barsSheet), cz = pixels(sheet(charizard)), lg = pixels(sheet(logo));
  const toWhite = (y) => (r, g, b) => [fade8(r, 30, y), fade8(g, 30, y), fade8(b, 31, y)];   // RGB(30,30,31)
  const toBlack = (y) => (r, g, b) => [fade8(r, 0, y), fade8(g, 0, y), fade8(b, 0, y)];
  const grey = (to) => (r, g, b) => { const v = grey8(r, g, b); return to(v, v, v); };
  const bandSheet = sheet();
  const band = new ImageData(240, 160);

  return (M) => {
    const s = titleEntrance(M);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, 240, 160);
    if (s.border) ctx.drawImage(back, 0, 0, s.border, 160, 0, 0, s.border, 160);
    if (s.bars === 'black') ctx.drawImage(variant('bars-black', barsPx, () => [0, 0, 0]), 0, 0);
    else if (s.bars !== 'hidden') ctx.drawImage(barsSheet, 0, 0, 240 - s.bars, 160, s.bars, 0, 240 - s.bars, 160);
    const c = s.charizard;
    const fade = c.to === 'white' ? toWhite(c.y) : toBlack(c.y);
    ctx.drawImage(variant(`cz-${c.src}-${c.to}-${c.y}`, cz, c.src === 'grey' ? grey(fade) : fade), 0, 0);
    if (s.band !== null) {   // BLDY over the black Charizard: EVY 15 on the centre line, one less per line away
      band.data.fill(0);
      for (let y = Math.max(0, s.band - 15); y <= Math.min(159, s.band + 15); y++) {
        const v = brighten8(0, 15 - Math.abs(y - s.band));
        for (let x = 0; x < 240; x++) {
          const i = (y * 240 + x) * 4;
          if (cz.data[i + 3]) band.data.set([v, v, v, 255], i);
        }
      }
      bandSheet.getContext('2d').putImageData(band, 0, 0);
      ctx.drawImage(bandSheet, 0, 0);
    }
    if (s.logo !== null) ctx.drawImage(variant(`logo-${s.logo}`, lg, toWhite(s.logo)), 0, 0);
  };
}

export function createTitle(root, { reduced, entrance = false }) {
  root.innerHTML = `<div class="title">
    <img class="layer" src="assets/title/back.png" alt="">
    <canvas class="layer flames" width="240" height="160"></canvas>
    <img class="layer" src="assets/title/bars.png" alt="">
    <img class="layer press" src="assets/title/press.png" alt="PRESS START">
    <img class="layer" src="assets/title/charizard.png" alt="">
    <img class="layer" src="assets/title/logo.png" alt="Pokémon FireRed Version">
    <canvas class="layer lit" width="240" height="160"></canvas>
  </div>`;
  const title = root.querySelector('.title');
  if (reduced) return { stop() {}, leave: () => Promise.resolve(), skip() {}, entering: false };
  const [flameCtx, litCtx] = [...title.querySelectorAll('canvas')].map((c) => c.getContext('2d'));
  const press = title.querySelector('.press');
  const art = { flames: load('assets/title/flames.png'), lit: load('assets/title/lit.png'), slash: load('assets/title/slash.png') };

  let entering = entrance, M = 0, drawEntrance = null, cover = null;
  if (entering) {
    cover = Object.assign(document.createElement('canvas'), { width: 240, height: 160, className: 'layer entrance' });
    cover.getContext('2d').fillRect(0, 0, 240, 160);   // black until the layers are decoded
    title.append(cover);
    const imgs = [...title.querySelectorAll('img')];   // back, bars, press, charizard, logo
    Promise.all(imgs.map((i) => i.decode().catch(() => {}))).then(() => { drawEntrance = entranceDrawer(cover, imgs); });
  }
  function finishEntrance() {   // RUN: the steady layers under the cover take over
    entering = false;
    cover?.remove();
  }

  let seed = 30840;
  const rand = () => (seed = nextSeed(seed)) >>> 16;
  let frame = 0, timer = 0, delay = 0, off = 0;
  let flames = [];
  const slash = { x: -32, y: 27, timer: 540, on: false };

  function spawn(x, y, xs, ys, visible) {
    if (flames.length < MAX_FLAMES) flames.push({ px: x * 16, py: y * 16, xs, ys, n: 0, visible });
  }

  function step() {
    frame += 1;
    if (frame > 1 && ++timer >= delay) {   // Task_FlameSpawner: seeds on its first frame, then a wave every 18
      timer = 0;
      delay = 18;
      rand();
      let xs = (rand() % 4) - 2, ys = (rand() % 8) - 16;
      const y = (rand() % 3) + 116, x = rand() % 240;
      spawn(x, y, xs, ys, rand() % 16 >= 8);
      for (const fx of FLAME_X) {
        spawn(off + fx, y, xs, ys, true);
        xs = (rand() % 4) - 2;
        ys = (rand() % 8) - 16;
      }
      off = (off + 1) % 4;
    }
    flames = flames.filter((f) => {   // SpriteCallback_TitleScreenFlame
      f.n += 1;
      f.px -= f.xs;
      f.py += f.ys;
      f.x = f.px >> 4;
      f.y = f.py >> 4;
      return f.x >= -8 && f.y >= 16 && f.y <= 200 && f.n < 59;
    });
    if (!slash.on) {   // SpriteCallback_Slash
      if (--slash.timer === 0) slash.on = true;
    } else {
      slash.x += 9;
      if (slash.x === 67) slash.y -= 7;
      if (slash.x === 148) slash.y += 7;
      if (slash.x > 272) Object.assign(slash, { x: -32, timer: 540, on: false });
    }
  }

  function draw() {
    flameCtx.clearRect(0, 0, 240, 160);
    for (const f of [...flames].sort((a, b) => a.y - b.y)) {   // lower on screen = drawn on top
      if (!f.visible) continue;
      const tile = Math.min(9, Math.floor((f.n + 2) / 6));   // 3 frames, then 6 per tile, last one held
      flameCtx.drawImage(art.flames, 0, tile * 16, 16, 16, f.x - 8, f.y - 8, 16, 16);
    }
    litCtx.clearRect(0, 0, 240, 160);
    if (slash.on) {   // the shine is an OBJ window: only logo pixels inside it get BLDY 13
      litCtx.globalCompositeOperation = 'source-over';
      litCtx.drawImage(art.slash, slash.x - 32, slash.y - 32);
      litCtx.globalCompositeOperation = 'source-in';
      litCtx.drawImage(art.lit, 0, 0);
    }
    press.style.visibility = frame % 90 < 60 ? 'visible' : 'hidden';
  }

  let raf = 0, last = 0, acc = 0;
  function tick(now) {
    acc = Math.min(acc + (last ? now - last : 0), 200);   // a hidden tab doesn't fast-forward
    last = now;
    let stepped = false;
    for (; acc >= 1000 / FPS; acc -= 1000 / FPS) {
      stepped = true;
      if (!entering) step();
      else if (drawEntrance && ++M >= ENTRANCE) finishEntrance();
    }
    if (stepped) {
      if (entering) drawEntrance?.(M);
      else if (art.flames.complete) draw();
    }
    raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame(tick);
  // START on the title (scene CRY): the cry plays, 90 frames go by, then everything fades to white
  // (0 to 16 in steps of 2, about 9 frames).
  const leave = () => new Promise((resolve) => {
    setTimeout(() => {
      title.classList.add('to-white');
      setTimeout(resolve, 9000 / FPS);
    }, 90000 / FPS);
  });
  return {
    stop: () => cancelAnimationFrame(raf),
    leave,
    skip: () => entering && finishEntrance(),   // a button during the entrance: straight to RUN, as in the game
    get entering() { return entering; },
  };
}
```

- [ ] **Passo 2: verificar.** `node --check carts/center/title.js`; `node check.mjs`; `node tools/e2e.mjs` → `e2e ok` (o título pronto continua igual; a ordem nova coloca o PRESS START embaixo do Charizard, como no jogo).
- [ ] **Passo 3: commit.** `git add carts/center/title.js && git commit -m "feat: entrada animada da tela de título, com as camadas separadas"`

---

### Tarefa 4: a cena da GAME FREAK

**Arquivos:** `carts/center/intro.js` (novo)

**Produz:** `createIntro(root, { onDone }) → { stop() }` — chama `onDone` depois de T474 (ou na hora, se os gráficos falharem).

- [ ] **Passo 1: `intro.js`.**

```js
// FireRed's opening GAME FREAK scene (intro.c, GFScene_*): the navy band opens, a shooting star crosses it
// shedding sparkles, the name fades in among sparkles, the logo fades in, and it all fades back into the
// band. T counts frames from the one where the star appears (the scene starts at T−8, ends after T474).
import { blendLevels, alpha8, starPos, nextSeed, gfWindow } from '../../logic.js';

const FPS = 59.7275;
const SPOTS = [[72, 80], [136, 74], [168, 80], [120, 80], [104, 86], [88, 74], [184, 74], [56, 86], [152, 86]];
const BIG_ORDER = [0, 4, 8, 3, 7, 2, 6, 1, 5];
const FIRST = -8, LAST = 474;
const load = (src) => Object.assign(new Image(), { src });
const sheet = () => Object.assign(document.createElement('canvas'), { width: 240, height: 160 });

export function createIntro(root, { onDone }) {
  root.innerHTML = '<canvas class="layer intro" width="240" height="160"></canvas>';
  const ctx = root.querySelector('canvas').getContext('2d');
  ctx.fillRect(0, 0, 240, 160);
  const art = {
    text: load('assets/intro/gf-text.png'), logo: load('assets/intro/gf-logo.png'), star: load('assets/intro/star.png'),
    small: load('assets/intro/sparkles-small.png'), big: load('assets/intro/sparkles-big.png'),
  };
  let data = null, layers = null;
  let raf = 0, last = 0, acc = 0, T = FIRST - 1, done = false;
  let star = null, seed = 354128453, yMod = 0;
  let trail = [], small = [], big = [];

  const cache = new Map();
  function blended(key, src, eva, evb) {   // BLDALPHA over the navy band: (EVA·top + EVB·navy) >> 4
    const k = `${key}-${eva}-${evb}`;
    if (!cache.has(k)) {
      const img = new ImageData(new Uint8ClampedArray(src.data), 240, 160);
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) if (d[i + 3]) for (let c = 0; c < 3; c++) d[i + c] = alpha8(d[i + c], data.navy[c], eva, evb);
      const c = sheet();
      c.getContext('2d').putImageData(img, 0, 0);
      cache.set(k, c);
    }
    return cache.get(k);
  }

  function updateSmall(s) {   // SpriteCB_SparklesSmall_Name
    if (s.timer) {
      s.timer -= 1;
      s.by += 1;
      s.y = s.by >> 4;
      if (s.y > 86) {
        s.y = 74;
        s.by = 74 << 4;
      }
      if (s.ended) {
        if (s.state === 0) {
          s.x += 26;
          if (s.x > 188) [s.x, s.state] = [376 - s.x, 1];
        } else {
          s.x -= 26;
          if (s.x < 52) [s.x, s.state] = [104 - s.x, 0];
        }
        Object.assign(s, { mode: 'once', a: 0, ended: false });
      }
    } else {
      if (s.loops) return false;
      if (s.ended) Object.assign(s, { mode: 'loop', a: 0, ended: false });
      s.by += 4;
      s.y = s.by >> 4;
      if (++s.end > 50) return false;
    }
    s.a += 1;   // 4 tiles × 4 frames; the one-shot holds its last tile one frame more
    if (s.mode === 'once' && s.a >= 17) s.ended = true;
    return true;
  }

  function step() {
    T += 1;
    trail = trail.filter((s) => {   // SpriteCB_SparklesSmall_Star
      s.bx += s.sx;
      s.by += s.sy;
      s.t += 1;
      s.x = (s.bx & 0xffff) >> 5;
      s.y = s.by >> 5;
      if (s.t > 90) s.hidden = !s.hidden;
      return s.t <= 120 && s.y >= 0 && s.y <= 160;
    });
    if (T === 0) star = { n: 0 };
    if (star) {   // SpriteCB_Star
      star.n += 1;
      Object.assign(star, starPos(star.n, data.sine));
      if (star.n % 8) {
        seed = nextSeed(seed);
        const xMod = ((seed >>> 16) & 7) + 2, dy = yMod;
        yMod = yMod >= 3 ? -3 : yMod + 1;
        const x = star.x + xMod, y = star.y + star.y2 + dy;
        if (x > 0 && x < 240) trail.push({ bx: x << 5, by: y << 5, sx: xMod, sy: dy, t: 0, x, y, hidden: false });
      }
      if (star.x < -8) star = null;
    }
    small = small.filter(updateSmall);
    if (T >= 37 && T <= 156 && (T - 30) % 7 === 0) {   // GFScene_Task_NameSparklesSmall: every 7 frames, 18 in all
      const k = (T - 30) / 7;
      const [x, y] = SPOTS[(k - 1) % 9];
      small.push({ x, y, by: y << 4, timer: 120, loops: k > 9 ? 1 : 0, state: 0, mode: 'once', a: 0, ended: false, end: 0 });
    }
    big = big.filter((s) => ++s.age < 33);
    if (T >= 122 && T <= 202 && (T - 122) % 10 === 0) {   // GFScene_Task_NameSparklesBig: every 10 frames, 9 in all
      const [x, y] = SPOTS[BIG_ORDER[(T - 122) / 10]];
      big.push({ x, y, age: 0 });
    }
    if (T >= LAST) finish();
  }

  const smallTile = (s) => (s.mode === 'once' ? Math.min(3, (s.a - 1) >> 2) : ((s.a - 1) >> 2) % 4);
  const drawSmall = (k, x, y) => ctx.drawImage(art.small, (k & 1) * 8, (k >> 1) * 8, 8, 8, x - 4, y - 4, 8, 8);

  function draw() {
    const [top, bottom] = gfWindow(T);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, 240, 160);
    if (bottom <= top) return;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, top, 240, bottom - top);   // WIN1: nothing shows outside the band's window
    ctx.clip();
    ctx.fillStyle = `rgb(${data.navy})`;
    ctx.fillRect(0, 24, 240, 112);   // BG3: navy on rows 24–135
    if (T >= 311 && T <= 342) ctx.drawImage(blended('logo', layers.logoPx, ...blendLevels(0, 16, 16, 0, 16, T - 310)), 0, 0);   // the logo sprite, under BG2
    if (T >= 163 && T < 258) ctx.drawImage(blended('text', layers.textPx, ...blendLevels(0, 16, 16, 0, 48, T - 162)), 0, 0);
    else if (T >= 258 && T < 342) ctx.drawImage(layers.text, 0, 0);
    else if (T >= 342 && T <= 434) ctx.drawImage(layers.full, 0, 0);
    else if (T > 434 && T < 474) ctx.drawImage(blended('full', layers.fullPx, ...blendLevels(16, 0, 0, 16, 20, T - 434)), 0, 0);
    for (const s of big) ctx.drawImage(art.big, 0, Math.min(3, s.age >> 3) * 32, 32, 32, s.x - 16, s.y - 16, 32, 32);
    for (const s of small) drawSmall(smallTile(s), s.x, s.y);
    for (const s of trail) if (!s.hidden) drawSmall(((s.t - 1) >> 2) % 4, s.x, s.y);
    if (star) ctx.drawImage(art.star, star.x - 8, star.y + star.y2 - 8);
    ctx.restore();
  }

  function tick(now) {
    acc = Math.min(acc + (last ? now - last : 0), 200);
    last = now;
    let stepped = false;
    for (; acc >= 1000 / FPS && !done; acc -= 1000 / FPS) {
      step();
      stepped = true;
    }
    if (done) return;
    if (stepped) draw();
    raf = requestAnimationFrame(tick);
  }

  function finish() {
    if (done) return;
    done = true;
    cancelAnimationFrame(raf);
    onDone();
  }

  Promise.all([fetch('assets/intro/intro.json').then((r) => r.json()), ...Object.values(art).map((i) => i.decode())])
    .then(([json]) => {
      if (done) return;
      data = json;
      const text = sheet(), full = sheet(), logo = sheet();
      text.getContext('2d').drawImage(art.text, 48, 72);
      logo.getContext('2d').drawImage(art.logo, 104, 38);
      full.getContext('2d').drawImage(art.logo, 104, 38);   // T342: the logo is copied into BG2 and the name blitted over it
      full.getContext('2d').drawImage(art.text, 48, 72);
      const px = (c) => c.getContext('2d').getImageData(0, 0, 240, 160);
      layers = { text, full, textPx: px(text), fullPx: px(full), logoPx: px(logo) };
      raf = requestAnimationFrame(tick);
    })
    .catch(() => finish());   // missing art: go straight on to the title

  return {
    stop() {
      done = true;
      cancelAnimationFrame(raf);
    },
  };
}
```

- [ ] **Passo 2: verificar.** `node --check carts/center/intro.js`.
- [ ] **Passo 3: commit.** `git add carts/center/intro.js && git commit -m "feat: cena da GAME FREAK do FireRed, quadro a quadro"`

---

### Tarefa 5: ligar o GBA e encadear a abertura

**Arquivos:** `gba.js`, `carts/center/index.js`, `style.css`, `tools/e2e.mjs`

- [ ] **Passo 1: testes.** Em `tools/e2e.mjs`, logo depois do primeiro `await send('Page.navigate', { url: BASE });` e do `await sleep(1500);` que o segue (antes do `localStorage.clear()`):

```js
assert.ok(await ev(`document.body.classList.contains('powered')`), 'a luz POWER não acendeu');
assert.ok(await has('canvas.intro'), 'a abertura da GAME FREAK não começou numa sessão nova');
await key('Enter', 400);
assert.ok(!(await has('canvas.intro')) && (await has('.title')) && !(await has('.title .entrance')), 'um botão deveria pular direto para o título pronto');
ok('abertura: a luz acende, a GAME FREAK roda e um botão pula para o título pronto');
```

  e, antes do bloco do celular em pé:

```js
await ev('sessionStorage.clear()');
await send('Page.navigate', { url: `${BASE}?again=1` });
await sleep(10000);   // 0,4 s de luz + ~8,1 s da GAME FREAK
assert.ok(await has('.title .entrance'), 'depois da GAME FREAK deveria vir a entrada do título');
await sleep(5000);    // ~4,4 s de entrada
assert.ok((await has('.title')) && !(await has('.title .entrance')), 'a entrada deveria terminar no título pronto');
ok('abertura completa: GAME FREAK, entrada do título e PRESS START');
```

- [ ] **Passo 2: rodar e ver falhar.** `node tools/e2e.mjs` → falha em "a luz POWER não acendeu".

- [ ] **Passo 3: `gba.js`.** Nos `SHELLS`, a luz de ligado ganha classe: `led(360, 26)` → `led(360, 26, 'led-power')` e `led(234, 212)` → `led(234, 212, 'led-power')`. No fim, o bloco do `Promise.all(...)` vira:

```js
Promise.all([document.fonts.load('16px Gen3'), document.fonts.load('16px "Gen3 Small"')]).finally(() => {
  document.body.classList.add('ready');
  // The power switch: the LED lights up, then the cartridge starts.
  setTimeout(() => {
    document.body.classList.add('powered');
    cart.start($screen, api);
    if (pathOf()) cart.open(pathOf());
    addEventListener('hashchange', () => cart.open(pathOf()));
  }, reduced() ? 0 : 400);
});
```

  Em `style.css`, junto das regras de `.led-sound`:

```css
.led-power { fill: #2a3a2a; }
.powered .led-power { fill: #78f878; }
```

- [ ] **Passo 4: `carts/center/index.js`.**
  - `import { createIntro } from './intro.js';` e `let intro = null;` junto das variáveis;
  - `title()` vira:

```js
// First visit in this browser session: the GAME FREAK scene, then the title's entrance. Afterwards (or
// with reduced motion) straight to the ready title. The title's art loads while the scene plays.
const TITLE_ART = ['back', 'bars', 'press', 'charizard', 'logo', 'flames', 'lit', 'slash'];
function title() {
  mode = 'title';
  let first = true;
  try {
    first = !sessionStorage.getItem('booted');
    sessionStorage.setItem('booted', '1');
  } catch { /* no session storage: play it every time */ }
  if (!first || api.reduced()) {
    titleScreen = createTitle(screen, { reduced: api.reduced() });
    return;
  }
  mode = 'intro';
  TITLE_ART.forEach((n) => { new Image().src = `assets/title/${n}.png`; });
  intro = createIntro(screen, {
    onDone() {
      intro = null;
      mode = 'title';
      titleScreen = createTitle(screen, { reduced: false, entrance: true });
    },
  });
}

// Any button during the opening goes straight to the ready title, as A/START/SELECT do in the game.
function skipOpening() {
  if (intro) {
    intro.stop();
    intro = null;
    mode = 'title';
    titleScreen = createTitle(screen, { reduced: api.reduced() });
    return true;
  }
  if (mode === 'title' && titleScreen.entering) {
    titleScreen.skip();
    return true;
  }
  return false;
}
```

  - em `button(name, down)`, logo no começo: `if (mode === 'intro') { if (down) skipOpening(); return; }`, e no bloco `if (mode === 'title')`, antes de `enter()`: `if (down && skipOpening()) return;`
  - em `pointer(x, y)`: `if (mode === 'intro' || (mode === 'title' && titleScreen.entering)) return void skipOpening();` antes de `if (mode === 'title') return enter();`
  - em `open(path)`, antes de `if (mode === 'title') await enter(...)`: `skipOpening();`
  - em `stop()`: `intro?.stop();`

- [ ] **Passo 5: rodar e ver passar.** `node check.mjs` → ok; `node tools/e2e.mjs` → `e2e ok`.
- [ ] **Passo 6: commit.** `git add gba.js carts/center/index.js style.css tools/e2e.mjs && git commit -m "feat: o GBA liga, roda a GAME FREAK e a entrada do título; qualquer botão pula"`

---

### Tarefa 6: revisão visual e publicação

- [ ] **Passo 1: quadros.** Com um script de screenshots (CDP, sessão nova, 1366×650), capturar: T≈60 (estrela cruzando com o rastro), T≈200 (nome aparecendo entre brilhos), T≈380 (logo e nome), M≈20 (faixa de luz sobre o Charizard), M≈120 (Charizard cinza), M≈206 (barras entrando, flash), M≈245 (logo saindo do branco). Conferir contra a descrição de cada momento.
- [ ] **Passo 2: suíte.** `node check.mjs`, `node tools/e2e.mjs`, build de assets sem mudanças, `node tools/shots.mjs` nos 4 tamanhos.
- [ ] **Passo 3: publicar.** Levar `feat/abertura` para o `main` (fast-forward) e `git push origin main` — o GitHub Pages atualiza o site.

## Autorrevisão

- **Cobertura (spec, seção 2):** GBA desligado → luz acende → tela liga (T1, T5); GAME FREAK (T4); entrada do título (T3); qualquer botão pula (T5); só na primeira vez da sessão (T5); links diretos pulam (T5: `open` chama `skipOpening`); movimento reduzido (T5: `api.reduced()`); carregamento em segundo plano (T5: arte do título pré-carregada durante a cena).
- **Nomes conferidos:** `fade8`, `grey8`, `brighten8`, `alpha8`, `blendLevels`, `nextSeed`, `starPos`, `gfWindow`, `titleEntrance`; `createTitle(…, { entrance })` com `skip`/`entering`; `createIntro(root, { onDone })`; `skipOpening`; classes `.intro`, `.entrance`, `.led-power`, `body.powered`.
