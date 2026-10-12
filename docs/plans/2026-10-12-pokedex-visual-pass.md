# Pokédex Portfolio — Passe visual — Plano de implementação

**Objetivo:** implementar a spec do passe visual: assets reais da Gen 3 gerados por script, um único tamanho de pixel em todo o site, fonte original, animações e sons do jogo, e fundo em vídeo.

**Arquitetura:** `tools/build_assets.py` (Python puro + fontTools só para a fonte) converte os despejos de `new assets/` em arquivos prontos em `assets/`. O site ganha módulos pequenos: `logic.js` (funções puras, testadas pelo `check.mjs`), `sound.js` (Web Audio), `typewriter.js` (texto digitando) e `app.js` (telas, entrada, abertura, opções, vídeo).

**Stack:** HTML/CSS/JS sem dependências; Python 3 (stdlib) + fontTools 4.66.1 para gerar a fonte; Node 24 para `check.mjs` e `tools/e2e.mjs`; Edge headless para teste de interação e screenshots.

**Spec:** `docs/specs/2026-10-12-pokedex-visual-pass-design.md` (e a base: `docs/specs/2026-10-11-pokedex-portfolio-design.md`)

## Restrições globais

- Site sem dependências e sem build: abre com qualquer servidor estático. Só `tools/` usa Python.
- Todo texto do site em `Gen3` (ou `Gen3 Small` nas etiquetas), `font-size: 16px; line-height: 16px` em pixels de jogo. Nenhum outro tamanho de fonte dentro do aparelho.
- Uma escala `--k` para tudo (aparelho no desktop; tela **e** painel no DS).
- Nenhuma forma lisa: sem `border-radius` visível, sem `clip-path` diagonal, sem `scale` fracionário; animações com `steps()` e deslocamentos inteiros.
- `new assets/` nunca entra no git; só o que o script gera em `assets/`.
- `prefers-reduced-motion`: sem digitação, silhueta, fade, quadros alternados nem abertura animada.
- Commits como `João Cabral <joaovcabralm@hotmail.com>` (config local).

## Arquivos

| Arquivo | Responsabilidade |
|---|---|
| `tools/pngio.py` | Ler PNG (indexado/RGBA), escrever PNG RGBA, ler paleta JASC |
| `tools/build_assets.py` | Gerar `assets/ui`, `assets/font`, `assets/sfx`, `assets/cries`, `assets/video` + auto-verificação |
| `tools/requirements.txt` | `fonttools==4.66.1` |
| `tools/e2e.mjs` | Teste de interação no Edge (sobe o próprio servidor) |
| `logic.js` | Funções puras (rotas, sprites, cursor, escalas, opções, digitação, clipes, formas pixel) |
| `sound.js` | Efeitos e gritos via Web Audio |
| `typewriter.js` | Texto digitando sem mexer na quebra de linha |
| `app.js` | Telas, entrada, abertura, opções, vídeo de fundo |
| `style.css`, `index.html` | Visual em pixel único |
| `data.js` | Conteúdo; ganha as chaves novas de interface |
| `check.mjs` | Testes da lógica + validação do conteúdo (inclui fonte e gritos) |

---

### Task 1: Leitura/escrita de PNG + gráficos da interface

**Files:**
- Create: `tools/pngio.py`
- Create: `tools/build_assets.py`
- Modify: `.gitignore` (adicionar `__pycache__/`)

**Interfaces produzidas:**
- `pngio.read(path) -> (w, h, pixels, palette)`; `pngio.write(path, rgba_rows)`; `pngio.to_rgba(pixels, palette, transparent=0)`; `pngio.read_jasc(path) -> [(r, g, b)]`
- Arquivos: `assets/ui/frame-1..10.png`, `badges.png`, `menu_info.png`, `ball.png`, `sparkle.png`, `flames.png`, `logo.png`

- [ ] **Step 1: `tools/pngio.py` com auto-teste**

```python
"""Minimal PNG reader/writer (stdlib only) for the asset pipeline."""
import struct
import zlib


def read(path):
    """Returns (width, height, pixels, palette).

    pixels[y][x] is a palette index for indexed images and an (r, g, b, a)
    tuple for truecolor ones; palette is None for truecolor images."""
    data = open(path, 'rb').read()
    if data[:8] != b'\x89PNG\r\n\x1a\n':
        raise ValueError(f'not a PNG: {path}')
    pos, idat, palette = 8, b'', None
    while pos < len(data):
        n, kind = struct.unpack('>I4s', data[pos:pos + 8])
        body = data[pos + 8:pos + 8 + n]
        pos += 12 + n
        if kind == b'IHDR':
            w, h, depth, ctype, _, _, interlace = struct.unpack('>IIBBBBB', body)
            if interlace:
                raise ValueError(f'interlaced PNG not supported: {path}')
        elif kind == b'PLTE':
            palette = [tuple(body[i:i + 3]) for i in range(0, n, 3)]
        elif kind == b'IDAT':
            idat += body
    channels = {0: 1, 2: 3, 3: 1, 4: 2, 6: 4}[ctype]
    bits = depth * channels
    stride = (w * bits + 7) // 8
    step = max(1, bits // 8)
    raw = zlib.decompress(idat)
    rows, prev, i = [], bytearray(stride), 0
    for _ in range(h):
        filt, line = raw[i], bytearray(raw[i + 1:i + 1 + stride])
        i += 1 + stride
        for x in range(stride):
            a = line[x - step] if x >= step else 0
            b = prev[x]
            c = prev[x - step] if x >= step else 0
            if filt == 1:
                line[x] = (line[x] + a) & 255
            elif filt == 2:
                line[x] = (line[x] + b) & 255
            elif filt == 3:
                line[x] = (line[x] + (a + b) // 2) & 255
            elif filt == 4:
                p = a + b - c
                pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                line[x] = (line[x] + (a if pa <= pb and pa <= pc else b if pb <= pc else c)) & 255
        rows.append(line)
        prev = line
    pixels = []
    for line in rows:
        if ctype == 3 and depth < 8:
            per, mask = 8 // depth, (1 << depth) - 1
            pixels.append([(line[x // per] >> (8 - depth * (x % per + 1))) & mask for x in range(w)])
        elif ctype == 3:
            pixels.append(list(line[:w]))
        elif ctype == 6 and depth == 8:
            pixels.append([tuple(line[x * 4:x * 4 + 4]) for x in range(w)])
        elif ctype == 2 and depth == 8:
            pixels.append([tuple(line[x * 3:x * 3 + 3]) + (255,) for x in range(w)])
        else:
            raise ValueError(f'unsupported PNG (type {ctype}, depth {depth}): {path}')
    return w, h, pixels, palette


def write(path, rows):
    """Writes an RGBA image given as rows of (r, g, b, a) tuples."""
    h, w = len(rows), len(rows[0])
    raw = b''.join(b'\x00' + bytes(v for px in row for v in px) for row in rows)

    def chunk(kind, body):
        return struct.pack('>I', len(body)) + kind + body + struct.pack('>I', zlib.crc32(kind + body))

    with open(path, 'wb') as f:
        f.write(b'\x89PNG\r\n\x1a\n'
                + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0))
                + chunk(b'IDAT', zlib.compress(raw, 9))
                + chunk(b'IEND', b''))


def to_rgba(pixels, palette, transparent=0):
    """Indexed pixels -> RGBA rows. Index 0 is transparent, as on the GBA."""
    return [[(0, 0, 0, 0) if v == transparent else tuple(palette[v]) + (255,) for v in row] for row in pixels]


def read_jasc(path):
    """JASC-PAL palette file -> list of (r, g, b)."""
    words = open(path, encoding='ascii').read().split()
    count = int(words[2])
    nums = [int(v) for v in words[3:3 + count * 3]]
    return [tuple(nums[i:i + 3]) for i in range(0, count * 3, 3)]


if __name__ == '__main__':
    import os
    import tempfile
    sample = [[(255, 0, 0, 255), (0, 0, 0, 0), (1, 2, 3, 4)], [(9, 9, 9, 255), (200, 100, 50, 128), (0, 255, 0, 255)]]
    path = os.path.join(tempfile.mkdtemp(), 'roundtrip.png')
    write(path, sample)
    w, h, back, pal = read(path)
    assert (w, h, pal) == (3, 2, None), (w, h, pal)
    assert back == sample, back
    assert to_rgba([[0, 1]], [(1, 1, 1), (7, 8, 9)]) == [[(0, 0, 0, 0), (7, 8, 9, 255)]]
    print('pngio ok')
```

- [ ] **Step 2: Rodar o auto-teste**

Run: `python tools/pngio.py`
Esperado: `pngio ok`

- [ ] **Step 3: `tools/build_assets.py` (parte de interface) com a auto-verificação escrita primeiro**

```python
"""Builds everything in assets/ from the raw game dumps in 'new assets/'.

Run from the repo root:   python tools/build_assets.py
The fonts need fontTools: pip install -r tools/requirements.txt
(on machines that block compiled extensions: pip install --no-binary fonttools -r tools/requirements.txt)
"""
import json
import re
import shutil
import struct
import wave
from pathlib import Path

import pngio

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / 'new assets'
FR = RAW / 'pokefirered-master'
GFX = FR / 'graphics'
SFX_DIR = RAW / 'Game Boy Advance - Pokemon FireRed _ LeafGreen - Miscellaneous - Sound Effects'
OUT = ROOT / 'assets'


def rgba_png(src, out, palette_file=None):
    _, _, px, pal = pngio.read(src)
    if palette_file:
        pal = pngio.read_jasc(palette_file)
    pngio.write(out, pngio.to_rgba(px, pal))


def build_logo(out):
    """The title logo is 8x8 tiles placed by a 32-column tilemap (u16: tile, hflip, vflip)."""
    w, _, tiles, _ = pngio.read(GFX / 'title_screen/firered/game_title_logo.png')
    pal = pngio.read_jasc(GFX / 'title_screen/firered/game_title_logo.pal')
    data = (GFX / 'title_screen/firered/game_title_logo.bin').read_bytes()
    cols, rows, per_row = 32, len(data) // 64, w // 8
    img = [[0] * (cols * 8) for _ in range(rows * 8)]
    for i in range(cols * rows):
        e = data[i * 2] | data[i * 2 + 1] << 8
        t, hflip, vflip = e & 0x3FF, e >> 10 & 1, e >> 11 & 1
        tx, ty = (t % per_row) * 8, (t // per_row) * 8
        for y in range(8):
            for x in range(8):
                sx, sy = 7 - x if hflip else x, 7 - y if vflip else y
                img[(i // cols) * 8 + y][(i % cols) * 8 + x] = tiles[ty + sy][tx + sx]
    xs = [x for row in img for x, v in enumerate(row) if v]
    ys = [y for y, row in enumerate(img) if any(row)]
    crop = [row[min(xs):max(xs) + 1] for row in img[min(ys):max(ys) + 1]]
    pngio.write(out, pngio.to_rgba(crop, pal))


def build_ui():
    ui = OUT / 'ui'
    ui.mkdir(parents=True, exist_ok=True)
    for n in range(1, 11):
        rgba_png(GFX / f'text_window/type{n}.png', ui / f'frame-{n}.png')
    rgba_png(GFX / 'trainer_card/badges.png', ui / 'badges.png')
    rgba_png(GFX / 'interface/menu_info.png', ui / 'menu_info.png')
    rgba_png(GFX / 'items/icons/poke_ball.png', ui / 'ball.png', GFX / 'items/icon_palettes/poke_ball.pal')
    rgba_png(GFX / 'battle_anims/sprites/gold_stars.png', ui / 'sparkle.png')
    rgba_png(GFX / 'title_screen/firered/flames.png', ui / 'flames.png')
    build_logo(ui / 'logo.png')


def check_ui():
    names = [f'frame-{n}.png' for n in range(1, 11)] + ['badges.png', 'menu_info.png', 'ball.png', 'sparkle.png', 'flames.png', 'logo.png']
    for name in names:
        assert (OUT / 'ui' / name).exists(), f'missing assets/ui/{name}'
    w, h, px, _ = pngio.read(OUT / 'ui/badges.png')
    assert (w, h) == (128, 16), (w, h)
    assert px[0][0][3] == 0, 'badge background must be transparent'
    w, h, _, _ = pngio.read(OUT / 'ui/logo.png')
    assert w <= 240 and h <= 160, f'logo {w}x{h} does not fit the 240x160 screen'
    print(f'ui ok (logo {w}x{h})')


def main():
    build_ui()
    check_ui()


if __name__ == '__main__':
    main()
```

- [ ] **Step 4: Rodar**

Run: `python tools/build_assets.py`
Esperado: `ui ok (logo WxH)` com W ≤ 240 e H ≤ 160. Abrir `assets/ui/logo.png`, `badges.png`, `frame-1.png`, `ball.png` e conferir visualmente que as cores estão certas (logo do FireRed vermelho/amarelo; insígnias coloridas; Poké Ball vermelha e branca). Se a logo vier com um retângulo de fundo, o índice transparente não é 0 nessa paleta: trocar `to_rgba(crop, pal)` por `to_rgba(crop, pal, transparent=<índice do fundo>)`.

- [ ] **Step 5: Commit**

```bash
printf '__pycache__/\n' >> .gitignore
git add .gitignore tools/pngio.py tools/build_assets.py assets/ui
git commit -m "feat: pipeline de assets e gráficos reais da interface"
```

---

### Task 2: Fonte Gen 3

**Files:**
- Create: `tools/requirements.txt`
- Modify: `tools/build_assets.py` (funções da fonte + chamada no `main`)

**Interfaces produzidas:** `assets/font/gen3.woff` (família `Gen3`), `assets/font/gen3-small.woff` (família `Gen3 Small`), `assets/font/charset.json` (lista de caracteres de 1 code point cobertos pela `Gen3`). Métricas: 1 pixel = 64 unidades, `unitsPerEm` 1024, ascendente 704, descendente −192.

- [ ] **Step 1: `tools/requirements.txt`**

```
fonttools==4.66.1
```

Instalar: `python -m pip install --no-binary fonttools -r tools/requirements.txt`

- [ ] **Step 2: Adicionar ao `build_assets.py` (antes de `def main`) a verificação primeiro, depois a construção**

```python
UPM, PX, BASE = 1024, 64, 11          # 1 pixel = 64 units; baseline under cell row 10
CELLS = {'normal': (16, 16, 16), 'small': (8, 16, 32)}   # cell w, cell h, cells per row
EXPECTED_A = ['.###.', '#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#']   # rows 3..10 of 'A'
REQUIRED = ('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
            ' .,:;!?-()/&%+=<>·…“”‘’"\'ÀÁÂÇÉÊÍÓÔÚàáâçéêíóôúãõÃÕ@#_–▶▼')

# Hand-drawn glyphs the game does not have, in its style. Rows start at the cap line (cell row 3).
EXTRA = {
    '@': ['.###.', '#...#', '#.###', '#.#.#', '#.#.#', '#.##.', '#....', '.###.'],
    '#': ['.#.#.', '.#.#.', '#####', '.#.#.', '.#.#.', '#####', '.#.#.', '.#.#.'],
    '_': ['', '', '', '', '', '', '', '', '#####'],
    '–': ['', '', '', '', '#####'],
    '[': ['##', '#.', '#.', '#.', '#.', '#.', '#.', '##'],
    ']': ['##', '.#', '.#', '.#', '.#', '.#', '.#', '##'],
    '*': ['', '#.#.#', '.###.', '#####', '.###.', '#.#.#'],
    '~': ['', '', '', '.##..#', '#..##.'],
}


def parse_charmap():
    cm = {}
    for line in (FR / 'charmap.txt').read_text(encoding='utf-8').splitlines():
        m = re.match(r"^'(.)'\s*=\s*([0-9A-F]{2})\s*$", line)
        if m and m.group(1) not in cm:
            cm[m.group(1)] = int(m.group(2), 16)
    cm['▼'] = 0x7A   # DOWN_ARROW in the game's charmap
    return cm


def parse_widths(table):
    src = (FR / 'src/text.c').read_text(encoding='utf-8')
    m = re.search(table + r'\[\]\s*=\s*\{([^}]*)\}', src)
    return [int(v) for v in re.findall(r'\d+', m.group(1))]


def load_sheet(kind):
    _, _, px, _ = pngio.read(GFX / f'fonts/latin_{kind}.png')
    cw, ch, per = CELLS[kind]

    def bitmap(code):
        cx, cy = (code % per) * cw, (code // per) * ch
        return [[px[cy + y][cx + x] == 1 for x in range(cw)] for y in range(ch)]   # index 1 = stroke
    return bitmap


def from_rows(rows, top=3, height=16, width=16):
    out = [[False] * width for _ in range(height)]
    for y, row in enumerate(rows):
        for x, c in enumerate(row):
            out[top + y][x] = c == '#'
    return out


def with_tilde(base, tilde_src, plain_src):
    """base letter + the accent rows of tilde_src (the rows above where plain_src starts)."""
    top = next(y for y, row in enumerate(plain_src) if any(row))
    out = [row[:] for row in base]
    for y in range(top):
        for x, on in enumerate(tilde_src[y]):
            out[y][x] = out[y][x] or on
    return out


def collect_glyphs(kind):
    cm = parse_charmap()
    bitmap = load_sheet(kind)
    table = 'sFontNormalLatinGlyphWidths' if kind == 'normal' else 'sFontSmallLatinGlyphWidths'
    widths = parse_widths(table)
    glyphs, adv = {}, {}
    for ch, code in cm.items():
        if code < len(widths):
            glyphs[ch], adv[ch] = bitmap(code), widths[code]
    for alias, real in (('"', '”'), ("'", '’')):
        glyphs[alias], adv[alias] = glyphs[real], adv[real]
    for ch, base, tilde, plain in (('ã', 'a', 'ñ', 'n'), ('õ', 'o', 'ñ', 'n'), ('Ã', 'A', 'Ñ', 'N'), ('Õ', 'O', 'Ñ', 'N')):
        glyphs[ch], adv[ch] = with_tilde(glyphs[base], glyphs[tilde], glyphs[plain]), adv[base]
    if kind == 'normal':
        for ch, rows in EXTRA.items():
            glyphs[ch], adv[ch] = from_rows(rows), max(len(r) for r in rows) + 1
    return glyphs, adv


def save_font(glyphs, adv, family, out):
    from fontTools.fontBuilder import FontBuilder
    from fontTools.pens.ttGlyphPen import TTGlyphPen
    names = {ch: 'space' if ch == ' ' else f'uni{ord(ch):04X}' for ch in glyphs}
    order = ['.notdef'] + sorted(names.values())
    drawn, metrics = {'.notdef': TTGlyphPen(None).glyph()}, {'.notdef': (6 * PX, 0)}
    for ch, rows in glyphs.items():
        pen, xmin = TTGlyphPen(None), None
        for y, row in enumerate(rows):
            x = 0
            while x < len(row):
                if not row[x]:
                    x += 1
                    continue
                s = x
                while x < len(row) and row[x]:
                    x += 1
                top, bottom = (BASE - y) * PX, (BASE - y - 1) * PX
                pen.moveTo((s * PX, top))       # clockwise rectangle per run of pixels
                pen.lineTo((x * PX, top))
                pen.lineTo((x * PX, bottom))
                pen.lineTo((s * PX, bottom))
                pen.closePath()
                xmin = s * PX if xmin is None else min(xmin, s * PX)
        drawn[names[ch]] = pen.glyph()
        metrics[names[ch]] = (adv[ch] * PX, xmin or 0)
    asc, desc = BASE * PX, (14 - BASE) * PX
    fb = FontBuilder(UPM, isTTF=True)
    fb.setupGlyphOrder(order)
    fb.setupCharacterMap({ord(ch): names[ch] for ch in glyphs})
    fb.setupGlyf(drawn)
    fb.setupHorizontalMetrics(metrics)
    fb.setupHorizontalHeader(ascent=asc, descent=-desc)
    fb.setupNameTable({'familyName': family, 'styleName': 'Regular'})
    fb.setupOS2(sTypoAscender=asc, sTypoDescender=-desc, sTypoLineGap=0, usWinAscent=asc, usWinDescent=desc,
                sxHeight=5 * PX, sCapHeight=8 * PX, fsSelection=0xC0)   # regular + use typo metrics
    fb.setupPost()
    fb.font.flavor = 'woff'
    fb.save(str(out))


def build_fonts():
    font = OUT / 'font'
    font.mkdir(parents=True, exist_ok=True)
    glyphs, adv = collect_glyphs('normal')
    save_font(glyphs, adv, 'Gen3', font / 'gen3.woff')
    (font / 'charset.json').write_text(json.dumps(sorted(glyphs), ensure_ascii=False), encoding='utf-8')
    small, small_adv = collect_glyphs('small')
    save_font(small, small_adv, 'Gen3 Small', font / 'gen3-small.woff')
    return glyphs, small


def check_fonts(glyphs, small):
    a = glyphs['A']
    got = [''.join('#' if a[y][x] else '.' for x in range(5)) for y in range(3, 11)]
    assert got == EXPECTED_A, f'"A" does not match the game sheet: {got}'
    missing = [c for c in REQUIRED if c not in glyphs]
    assert not missing, f'font is missing {missing}'
    assert all(c in small for c in 'ÃÉÍÓABCDEFGHIJKLMNOPQRSTUVWXYZ<>'), 'small font is missing labels'
    assert any(glyphs['ã'][y][x] for y in range(6) for x in range(6)), 'ã has no tilde'
    for name in ('gen3.woff', 'gen3-small.woff', 'charset.json'):
        assert (OUT / 'font' / name).exists(), name
    print(f'fonts ok ({len(glyphs)} glyphs, small {len(small)})')
```

Trocar o `main` por:

```python
def main():
    build_ui()
    check_ui()
    check_fonts(*build_fonts())
```

- [ ] **Step 3: Rodar**

Run: `python tools/build_assets.py`
Esperado: `ui ok …` e `fonts ok (N glyphs, small M)`.
Se falhar com `"A" does not match`, o índice do traço não é 1 nessa folha — conferir com o probe (`index 1 = (56,56,56)`) antes de mudar qualquer coisa.

- [ ] **Step 4: Commit**

```bash
git add tools/requirements.txt tools/build_assets.py assets/font
git commit -m "feat: fonte original do FireRed em grade exata (Gen3 e Gen3 Small)"
```

---

### Task 3: Sons, gritos e lista de vídeos

**Files:**
- Modify: `tools/build_assets.py`

**Interfaces produzidas:** `assets/sfx/{select,win_open,pc_on,dex_scroll,dex_page,success,shiny}.wav` (mono 22 050 Hz 16 bits); `assets/cries/{1..386}.wav`; `assets/video/clips.json` (lista de nomes de arquivo, possivelmente vazia).

- [ ] **Step 1: Adicionar antes de `def main`**

```python
SFX = {'select': 0x05, 'win_open': 0x06, 'pc_on': 0x04, 'dex_scroll': 0x65, 'dex_page': 0x66, 'success': 0x19, 'shiny': 0x5F}


def downmix(src, dst):
    """44.1 kHz stereo 16-bit -> 22.05 kHz mono 16-bit (exact 2:1, averaging)."""
    with wave.open(str(src)) as w:
        ch, width, rate, n = w.getnchannels(), w.getsampwidth(), w.getframerate(), w.getnframes()
        frames = w.readframes(n)
    assert width == 2 and rate == 44100, f'{src.name}: expected 16-bit 44.1 kHz, got {width * 8}-bit {rate} Hz'
    samples = struct.unpack(f'<{n * ch}h', frames)
    mono = [sum(samples[i:i + ch]) // ch for i in range(0, len(samples), ch)]
    half = [(mono[i] + mono[i + 1]) // 2 for i in range(0, len(mono) - 1, 2)]
    with wave.open(str(dst), 'wb') as o:
        o.setnchannels(1)
        o.setsampwidth(2)
        o.setframerate(22050)
        o.writeframes(struct.pack(f'<{len(half)}h', *half))


def dex_names():
    src = (FR / 'include/constants/pokedex.h').read_text(encoding='utf-8')
    block = src[src.index('NATIONAL_DEX_NONE'):]
    return [n for n in re.findall(r'NATIONAL_DEX_(\w+),', block) if n != 'NONE'][:386]


def build_audio():
    sfx, cries = OUT / 'sfx', OUT / 'cries'
    sfx.mkdir(parents=True, exist_ok=True)
    cries.mkdir(parents=True, exist_ok=True)
    for name, song in SFX.items():
        downmix(SFX_DIR / f'firered_{song:04X}.wav', sfx / f'{name}.wav')
    names = dex_names()
    for number, name in enumerate(names, 1):
        shutil.copyfile(FR / f'sound/direct_sound_samples/cries/{name.lower()}.wav', cries / f'{number}.wav')
    return names


def build_video():
    out = OUT / 'video'
    out.mkdir(parents=True, exist_ok=True)
    src = RAW / 'videos'
    clips = sorted(p.name for p in src.iterdir() if p.suffix.lower() in ('.webm', '.mp4')) if src.exists() else []
    for name in clips:
        shutil.copyfile(src / name, out / name)
    (out / 'clips.json').write_text(json.dumps(clips), encoding='utf-8')
    return clips


def check_audio(names, clips):
    assert names[5] == 'CHARIZARD' and names[385] == 'DEOXYS', (names[5], names[385])
    assert len(list((OUT / 'cries').glob('*.wav'))) >= 386, 'missing cries'
    for name in SFX:
        with wave.open(str(OUT / 'sfx' / f'{name}.wav')) as w:
            assert w.getnchannels() == 1 and w.getframerate() == 22050, name
    print(f'audio ok ({len(SFX)} sfx, {len(names)} cries); video clips: {len(clips)}')
```

Trocar o `main` por:

```python
def main():
    build_ui()
    check_ui()
    check_fonts(*build_fonts())
    check_audio(build_audio(), build_video())
```

- [ ] **Step 2: Rodar**

Run: `python tools/build_assets.py`
Esperado: as três linhas `ui ok`, `fonts ok`, `audio ok (7 sfx, 386 cries); video clips: 0`.

- [ ] **Step 3: Commit**

```bash
git add tools/build_assets.py assets/sfx assets/cries assets/video
git commit -m "feat: efeitos sonoros, gritos originais e lista de clipes de fundo"
```

---

### Task 4: `logic.js` + testes + chaves novas no `data.js`

**Files:**
- Create: `logic.js`
- Modify: `check.mjs` (reescrito abaixo), `data.js` (bloco `ui` e comentário do topo)

**Interfaces produzidas (`logic.js`):**
- `TYPES` (ordem da folha `menu_info.png`), `SHAPES`
- `parseRoute(hash, counts)`, `parent(route)`, `nextIndex(cur, len, cols, dx, dy)`, `fitScale(w, h, W, H, dpr)`, `discPath(x, y, d)`, `rrectPath(x, y, w, h, ins)` — mesmos de antes
- `spritePath(dex, {shiny, animated, frame2}) -> string` — sempre `assets/sprites/emerald/…`
- `coverScale(w, h, W, H, dpr) -> number` — menor escala inteira em pixels físicos que cobre W×H
- `cycle(list, value, dir = 1)` — próximo valor com volta
- `splitShown(lengths, shown) -> number[]` — quantos caracteres de cada parte aparecem
- `pickNext(cur, n, r) -> number` — clipe sorteado diferente do atual

- [ ] **Step 1: Reescrever `check.mjs` (falha: `logic.js` não existe)**

```js
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { DATA } from './data.js';
import {
  parseRoute, parent, spritePath, nextIndex, fitScale, coverScale, cycle, splitShown, pickNext,
  discPath, rrectPath, TYPES, SHAPES,
} from './logic.js';

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

// sprites: always Emerald art
assert.equal(spritePath(6), 'assets/sprites/emerald/6.png');
assert.equal(spritePath(6, { shiny: true }), 'assets/sprites/emerald/shiny/6.png');
assert.equal(spritePath(250, { frame2: true }), 'assets/sprites/emerald/frame2/250.png');
assert.equal(spritePath(250, { shiny: true, frame2: true }), 'assets/sprites/emerald/shiny/frame2/250.png');
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

// scales: integer in physical pixels
assert.equal(fitScale(576, 320, 1888, 1048, 1), 3);
assert.equal(fitScale(576, 320, 1334, 736, 1), 2);
assert.equal(fitScale(240, 160, 358, 380, 3), 4 / 3);
assert.equal(fitScale(576, 320, 100, 100, 1), 1);
assert.equal(coverScale(240, 160, 1920, 1080, 1), 8);
assert.equal(coverScale(240, 160, 1366, 768, 1), 6);
assert.equal(coverScale(240, 160, 1440, 900, 2), 6);

// options
assert.equal(cycle(['pt', 'en'], 'pt'), 'en');
assert.equal(cycle(['pt', 'en'], 'en'), 'pt');
assert.equal(cycle([1, 2, 3], 1, -1), 3);
assert.equal(cycle([1, 2, 3], 9), 2);

// typing
assert.deepEqual(splitShown([3, 4], 0), [0, 0]);
assert.deepEqual(splitShown([3, 4], 2.7), [2, 0]);
assert.deepEqual(splitShown([3, 4], 5), [3, 2]);
assert.deepEqual(splitShown([3, 4], 99), [3, 4]);

// background clips
assert.equal(pickNext(-1, 1, 0.9), 0);
assert.equal(pickNext(0, 1, 0.5), 0);
assert.equal(pickNext(-1, 4, 0.99), 3);
for (let cur = 0; cur < 4; cur++) {
  for (const r of [0, 0.3, 0.6, 0.99]) {
    const n = pickNext(cur, 4, r);
    assert.ok(n !== cur && n >= 0 && n < 4, `pickNext(${cur}, 4, ${r}) = ${n}`);
  }
}

// pixel shapes
const widths = (d) => [...d.matchAll(/h(\d+)/g)].map((m) => +m[1]);
assert.deepEqual(widths(discPath(0, 0, 8)), [4, 6, 8, 8, 8, 8, 6, 4]);
assert.equal(rrectPath(0, 0, 10, 6), 'M2 0h6v1h-6zM2 5h6v1h-6zM1 1h8v1h-8zM1 4h8v1h-8zM0 2h10v2h-10z');
assert.equal(rrectPath(0, 0, 4, 2, []), 'M0 0h4v2h-4z');

// --- content (data.js)
const here = (path) => new URL(path, import.meta.url);
const both = (o, w) => assert.ok(o?.pt?.trim() && o?.en?.trim(), `${w}: falta texto pt ou en`);
const url = (u, w) => assert.match(u, /^(https:\/\/|mailto:)/, `${w}: link precisa começar com https:// ou mailto: (${u})`);
const dex = (n, w) => {
  assert.ok(Number.isInteger(n) && n >= 1 && n <= 386, `${w}: dex ${n} fora de 1–386`);
  const variants = [{}, { shiny: true }, { frame2: true }, { shiny: true, frame2: true }, { animated: true }, { shiny: true, animated: true }];
  for (const o of variants) assert.ok(existsSync(here(spritePath(n, o))), `${w}: sprite não existe (${spritePath(n, o)})`);
  assert.ok(existsSync(here(`assets/cries/${n}.wav`)), `${w}: grito não existe (assets/cries/${n}.wav) — rode python tools/build_assets.py`);
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

// every character on screen must exist in the game font
const charset = new Set(JSON.parse(readFileSync(here('assets/font/charset.json'), 'utf8')));
const strings = [];
(function walk(v) {
  if (typeof v === 'string') strings.push(v);
  else if (v && typeof v === 'object') Object.values(v).forEach(walk);
})(DATA);
for (const s of strings) {
  for (const ch of s) assert.ok(charset.has(ch), `caractere "${ch}" não existe na fonte do jogo (em "${s.slice(0, 40)}")`);
}

console.log('check ok');
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `node check.mjs`
Esperado: FAIL — `Cannot find module …logic.js`

- [ ] **Step 3: Criar `logic.js`**

```js
// Pure logic shared by the app and check.mjs (no DOM).

// Same order as the type labels in assets/ui/menu_info.png (4 per row, 32x12, from y=16).
export const TYPES = ['normal', 'fire', 'water', 'grass', 'electric', 'rock', 'ground', 'ice', 'flying', 'fighting', 'ghost', 'bug', 'poison', 'psychic', 'steel', 'dark', 'dragon'];
// Same order as the badges in assets/ui/badges.png (16x16 each).
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

export function spritePath(dex, { shiny = false, animated = false, frame2 = false } = {}) {
  const s = shiny ? 'shiny/' : '';
  if (animated) return `assets/sprites/emerald/animated/${s}${dex}.gif`;
  return `assets/sprites/emerald/${s}${frame2 ? 'frame2/' : ''}${dex}.png`;
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

// Smallest scale (integer in physical pixels) at which a w×h picture covers W×H.
export function coverScale(w, h, W, H, dpr) {
  return Math.ceil(Math.max((W * dpr) / w, (H * dpr) / h)) / dpr;
}

// Next value in a list, wrapping around. Unknown values count as the first one.
export function cycle(list, value, dir = 1) {
  const i = Math.max(0, list.indexOf(value));
  return list[(i + dir + list.length) % list.length];
}

// How many characters of each text part are visible after `shown` characters.
export function splitShown(lengths, shown) {
  let left = Math.max(0, Math.floor(shown));
  return lengths.map((n) => {
    const k = Math.min(n, left);
    left -= k;
    return k;
  });
}

// Random clip index (r in [0, 1)), different from the current one when possible.
export function pickNext(cur, n, r) {
  if (n <= 1) return 0;
  if (cur < 0) return Math.floor(r * n);
  const i = Math.floor(r * (n - 1));
  return i >= cur ? i + 1 : i;
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
```

- [ ] **Step 4: Atualizar o `data.js`**

Trocar a linha do comentário do topo
`// dex: número do Pokémon (1–386). #1–151 usam o sprite do FireRed, o resto o do Emerald.`
por
`// dex: número do Pokémon (1–386). Sprites e gritos saem do número. Todo texto precisa existir na fonte do jogo (node check.mjs avisa).`

Em `ui.pt`, remover `language`, `sound`, `help_language`, `help_sound` e adicionar:
```js
      opt_lang: 'IDIOMA', opt_sound: 'SOM', opt_textSpeed: 'TEXTO', opt_frame: 'MOLDURA',
      help_opt_lang: 'Troca o idioma do site.', help_opt_sound: 'Liga os sons do jogo. Também no botão preto da Pokédex.',
      help_opt_textSpeed: 'Velocidade em que o texto aparece.', help_opt_frame: 'Estilo das caixas de texto.',
      slow: 'LENTO', mid: 'MÉDIO', fast: 'RÁPIDO', type_frame: 'TIPO',
      registered: 'Os dados de {name} foram registrados na POKéDEX!',
```
Em `ui.en`, remover as mesmas quatro e adicionar:
```js
      opt_lang: 'LANGUAGE', opt_sound: 'SOUND', opt_textSpeed: 'TEXT', opt_frame: 'FRAME',
      help_opt_lang: 'Switch the site language.', help_opt_sound: 'Turn the game sounds on. Also the black button on the Pokédex.',
      help_opt_textSpeed: 'How fast the text appears.', help_opt_frame: 'Style of the text boxes.',
      slow: 'SLOW', mid: 'MID', fast: 'FAST', type_frame: 'TYPE',
      registered: "{name}'s data was added to the POKéDEX!",
```

- [ ] **Step 5: Rodar e ver passar**

Run: `node check.mjs`
Esperado: `check ok`. Se acusar `caractere "x" não existe na fonte`, trocar o caractere no `data.js` (ou acrescentar o glifo em `EXTRA` no script e rodar o build de novo).

- [ ] **Step 6: Commit**

```bash
git add logic.js check.mjs data.js
git commit -m "feat: lógica pura separada, sprites do Emerald e testes de fonte e gritos"
```

---

### Task 5: `sound.js` e `typewriter.js`

**Files:**
- Create: `sound.js`, `typewriter.js`

**Interfaces produzidas:**
- `setEnabled(on: boolean)` — liga/desliga; ao ligar cria/retoma o `AudioContext` (chamar dentro de um gesto)
- `sfx(name: string, delay = 0)` — toca `assets/sfx/{name}.wav` (delay em segundos)
- `cry(dex: number, delay = 0)` — toca `assets/cries/{dex}.wav`
- `typewrite(el, cps, onDone) -> skip()` — digita o texto de `el`; `skip()` completa na hora e chama `onDone`

- [ ] **Step 1: `sound.js`**

```js
// Game sounds through Web Audio. Silent until enabled; any failure stays silent.
const SFX = ['select', 'win_open', 'pc_on', 'dex_scroll', 'dex_page', 'success', 'shiny'];
const cache = new Map();
let ctx = null;
let enabled = false;

function load(url) {
  if (!cache.has(url)) {
    cache.set(url, fetch(url).then((r) => r.arrayBuffer()).then((b) => ctx.decodeAudioData(b)));
  }
  return cache.get(url);
}

// Must run inside a user gesture the first time it turns sound on (browser autoplay rules).
export function setEnabled(on) {
  enabled = on;
  if (!on) return;
  try {
    ctx ||= new AudioContext();
    ctx.resume();
    SFX.forEach((name) => load(`assets/sfx/${name}.wav`).catch(() => {}));
  } catch {
    ctx = null;
  }
}

function play(url, delay) {
  if (!enabled || !ctx) return;
  load(url)
    .then((buffer) => {
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.connect(ctx.destination);
      src.start(ctx.currentTime + delay);
    })
    .catch(() => cache.delete(url));
}

export const sfx = (name, delay = 0) => play(`assets/sfx/${name}.wav`, delay);
export const cry = (dex, delay = 0) => play(`assets/cries/${dex}.wav`, delay);
```

- [ ] **Step 2: `typewriter.js`**

```js
import { splitShown } from './logic.js';

// Types an element's text in place. Each text node keeps its full text in the DOM:
// the typed part stays in the node, the rest moves to a transparent span right after it,
// so line breaks never move and screen readers always get everything. Returns skip().
export function typewrite(el, cps, onDone) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) if (n.data.trim()) nodes.push(n);
  const parts = nodes.map((node) => {
    const text = node.data;
    const rest = document.createElement('span');
    rest.className = 'tw-rest';
    rest.textContent = text;
    node.data = '';
    node.after(rest);
    return { node, rest, text };
  });
  const lengths = parts.map((p) => p.text.length);
  const total = lengths.reduce((a, b) => a + b, 0);
  let shown = 0;
  let last = 0;
  let raf = 0;
  let done = false;

  function skip() {
    if (done) return;
    done = true;
    cancelAnimationFrame(raf);
    parts.forEach((p) => {
      p.node.data = p.text;
      p.rest.remove();
    });
    onDone?.();
  }

  function tick(now) {
    if (last) shown += ((now - last) * cps) / 1000;
    last = now;
    if (shown >= total) return skip();
    splitShown(lengths, shown).forEach((k, i) => {
      parts[i].node.data = parts[i].text.slice(0, k);
      parts[i].rest.textContent = parts[i].text.slice(k);
    });
    raf = requestAnimationFrame(tick);
  }

  raf = requestAnimationFrame(tick);
  return skip;
}
```

- [ ] **Step 3: Conferir sintaxe**

Run: `node --check sound.js && node --check typewriter.js && node check.mjs`
Esperado: sem erro e `check ok`. (O comportamento é testado no navegador na Task 7.)

- [ ] **Step 4: Commit**

```bash
git add sound.js typewriter.js
git commit -m "feat: módulos de som (Web Audio) e de texto digitando"
```

---

### Task 6: Visual em pixel único + animações + opções + vídeo (`index.html`, `style.css`, `app.js`)

**Files:**
- Modify: `index.html` (trocar a fonte do Google pela local)
- Replace: `style.css`, `app.js`

**Interfaces:**
- Consome: tudo de `logic.js`, `sound.js`, `typewriter.js`, `data.js` e os arquivos de `assets/`
- Atributos novos: `[data-hw="sound"]` (botão preto); classes no `body`: `ready`, `closed`, `anim`, `ds`, `talking`, `sound-on`; variáveis CSS: `--k`, `--frame`
- `localStorage`: `lang`, `sound`, `textSpeed`, `frame`, `seen`

- [ ] **Step 1: `index.html`** — trocar as três linhas do Google Fonts

```html
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400;700&display=swap">
```
por
```html
  <link rel="preload" href="assets/font/gen3.woff" as="font" type="font/woff" crossorigin>
  <link rel="preload" href="assets/font/gen3-small.woff" as="font" type="font/woff" crossorigin>
```

- [ ] **Step 2: `style.css` (substituir inteiro)**

```css
@font-face { font-family: Gen3; src: url(assets/font/gen3.woff) format('woff'); font-display: block; }
@font-face { font-family: 'Gen3 Small'; src: url(assets/font/gen3-small.woff) format('woff'); font-display: block; }

:root {
  --k: 2;
  --frame: url(assets/ui/frame-1.png);
  --ink: #401018;
  --lcd: #0e3b2c;
  --lcd-txt: #c8f0c0;
  --lcd-sh: #1e5a44;
  --lcd-dim: #78b090;
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
button { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; text-align: inherit; }
a { color: inherit; }
ul { list-style: none; }
h2, b { font: inherit; }
img, video { image-rendering: pixelated; }
noscript { color: #f8f8f8; }

/* ---------- background video ---------- */
.bg-video { position: fixed; z-index: -2; }
.bg-dim { position: fixed; inset: 0; z-index: -1; background: rgb(0 0 0 / .5); }
.ds .bg-video, .ds .bg-dim { display: none; }

/* ---------- device: everything below is in game pixels, scaled by --k ---------- */
.device { position: relative; width: 576px; height: 320px; zoom: var(--k); }
body:not(.ready) .device { visibility: hidden; }
.base { position: absolute; inset: 0 auto 0 0; width: 296px; }
.lid { position: absolute; inset: 0 auto 0 296px; width: 280px; transform-origin: left; }
.closed .device { translate: 24.3%; }
.closed .lid { transform: scaleX(0); }
/* only animate when the visitor opens it, not on deep-link loads */
.anim .device { transition: translate .5s steps(5); }
.anim .lid { transition: transform .5s steps(5); }
.shell { position: absolute; inset: 0; shape-rendering: crispEdges; }
@keyframes blink { 50% { opacity: 0; } }
@keyframes glow { 50% { fill: #88e0f8; } }
.glow { animation: glow 2.4s steps(1) infinite; }
.talking .glow { animation-duration: .3s; }
.talking .led-talk { animation: blink .2s steps(1) infinite; }
.led-sound { fill: #2c4c2c; }
.sound-on .led-sound { fill: #78f878; }
.blink { animation: blink 1s steps(1) infinite; }

/* screen, panel and everything in them share the game's 3-sided text shadow */
.screen, .screen *, .panel, .panel * { text-shadow: 1px 0 0 var(--sh), 0 1px 0 var(--sh), 1px 1px 0 var(--sh); }

.hw { position: absolute; }
.hw:not(.key, .pad):hover { background: #fff2; }
.hw:not(.key, .pad).pressed, .hw:not(.key, .pad):active { background: #0005; }
.round { display: grid; place-items: center; color: #f8f8f8; font-family: 'Gen3 Small'; }
.key, .pad { display: grid; place-items: center; text-decoration: none; font-family: 'Gen3 Small'; }
.key { background: #30b8e8; color: #08384c; box-shadow: inset 2px 2px 0 #88e0f8, inset -2px -2px 0 #1878a8, 0 0 0 2px #0c2a3a; }
.pad { background: #0f3b2c; color: var(--lcd-txt); box-shadow: inset 2px 2px 0 #1e5a44, inset -2px -2px 0 #06160f, 0 0 0 2px #04100a; }
.key:hover, .pad:hover { filter: brightness(1.15); }
.key.pressed, .pad.pressed, .key:active, .pad:active { translate: 0 1px; filter: brightness(.85); }

/* ---------- left screen (240x160, Gen 3 UI) ---------- */
.screen {
  position: absolute; left: 20px; top: 76px; width: 240px; height: 160px; overflow: hidden;
  background: repeating-linear-gradient(#f8f0d8 0 4px, #f0e6c4 4px 8px);
  box-shadow: 0 0 0 2px #303030;
  color: #383838; --sh: #d8d8d8;
  view-transition-name: screen;
}
.scr { position: absolute; inset: 0; }
.bar { display: flex; justify-content: space-between; align-items: center; height: 16px; padding: 0 4px; background: #c03028; color: #f8f8f8; --sh: #701818; }
.box { border: 8px solid transparent; border-image: var(--frame) 8 fill stretch; }
[data-nav] { position: relative; display: block; padding-left: 8px; text-decoration: none; outline: none; }
[data-nav]:focus::before { content: '▶'; position: absolute; left: 0; top: 0; }
.sprite { display: block; }
.idle { position: relative; display: block; }
.idle .f2 { position: absolute; inset: 0; animation: idle 1s steps(1) infinite; }
@keyframes idle { 0% { visibility: hidden; } 50% { visibility: visible; } }
.sil .sprite { filter: brightness(0); }
.missing { display: grid; place-items: center; width: 64px; height: 64px; }
.types { display: flex; gap: 4px; }
.type { display: inline-block; width: 32px; height: 12px; vertical-align: middle; background: url(assets/ui/menu_info.png) var(--tx) var(--ty); }
.badge { display: block; width: 16px; height: 16px; background: url(assets/ui/badges.png) calc(var(--i) * -16px) 0; }
.badge.none { background: none; }

.intro { display: grid; place-content: center; justify-items: center; gap: 4px; background: #182030; color: #f8f8f8; --sh: #000; }
.boot .stack { display: grid; place-items: center; }
.boot .stack > * { grid-area: 1 / 1; }
.boot .ball { width: 24px; height: 24px; background: url(assets/ui/ball.png); animation: drop .6s steps(1) both, hide 0s .65s forwards; }
@keyframes drop {
  0% { translate: 0 -64px; } 15% { translate: 0 -40px; } 30% { translate: 0 -16px; } 45% { translate: 0 0; }
  60% { translate: 0 -8px; } 75% { translate: 0 0; } 90% { translate: 0 -2px; } 100% { translate: 0 0; }
}
@keyframes hide { to { visibility: hidden; } }
@keyframes appear { from { visibility: hidden; } }
.boot .logo, .boot .flames { animation: appear 0s .65s backwards; }
.boot .boot-name { animation: appear 0s 1.1s backwards; }
.flames { display: flex; }
.flames i { width: 16px; height: 16px; background: url(assets/ui/flames.png) 0 0; animation: flame .5s steps(10) infinite; }
.flames i:nth-child(2n) { animation-delay: -.25s; }
@keyframes flame { to { background-position: 0 -160px; } }
.flash { position: absolute; inset: 0; background: #f8f8f8; visibility: hidden; animation: flash .3s .6s steps(1) both; }
@keyframes flash {
  0% { visibility: visible; opacity: 1; } 34% { visibility: visible; opacity: .66; }
  67% { visibility: visible; opacity: .33; } 100% { visibility: hidden; }
}

.who { position: absolute; left: 4px; top: 4px; width: 112px; white-space: nowrap; overflow: hidden; }
.menu .partner { position: absolute; left: 12px; top: 44px; }
.menu-box { position: absolute; right: 4px; top: 4px; width: 112px; }

.stage { position: absolute; display: grid; place-items: center; background: #f8f8f8; box-shadow: 0 0 0 2px #283848; }
.dex .stage { left: 84px; top: 24px; width: 72px; height: 72px; }
.dex .idle, .entry .sprite { view-transition-name: sprite; }
.dex-name { position: absolute; left: 16px; right: 16px; top: 104px; text-align: center; }

.entry .stage { left: 8px; top: 22px; width: 100px; height: 100px; }
.entry .info { position: absolute; left: 116px; top: 24px; right: 4px; display: grid; gap: 4px; justify-items: start; }
.shiny { color: #c89000; }
.star { display: inline-block; width: 16px; height: 16px; background: url(assets/ui/sparkle.png) 0 0; }
.spark { position: absolute; width: 16px; height: 16px; background: url(assets/ui/sparkle.png) 0 0; visibility: hidden; animation: spark .6s steps(1) 2 both; }
@keyframes spark {
  0% { visibility: visible; background-position: 0 -16px; } 34% { visibility: visible; background-position: 0 0; }
  67% { visibility: visible; background-position: 0 -16px; } 100% { visibility: hidden; }
}
.ename { position: absolute; left: 4px; right: 4px; bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.tcard { position: absolute; inset: 4px; padding: 4px 8px; background: repeating-linear-gradient(#a8d0f0 0 3px, #98c4e8 3px 6px); box-shadow: 0 0 0 2px #284878; }
.tcard dl { display: grid; grid-template-columns: auto 1fr; gap: 0 8px; margin-top: 4px; }
.tcard dd { white-space: nowrap; }
.tcard .partner { position: absolute; right: 8px; top: 20px; }
.badge-row { position: absolute; left: 8px; right: 8px; bottom: 6px; display: flex; justify-content: space-between; padding: 2px 6px; background: #284878; }

.case { position: absolute; left: 44px; top: 22px; display: grid; grid-template-columns: repeat(4, 32px); gap: 8px; }
.slot { display: grid; place-items: center; width: 32px; height: 32px; padding: 0; background: #384858; box-shadow: inset 2px 2px 0 #202838, 0 0 0 1px #f8f8f8; }
.slot[data-nav]:focus { box-shadow: inset 2px 2px 0 #202838, 0 0 0 2px #f8d030; }
.slot[data-nav]:focus::before { content: none; }
.badge-name { position: absolute; left: 4px; right: 4px; bottom: 4px; }

.scr .list { position: absolute; left: 4px; right: 4px; top: 20px; max-height: 136px; overflow: auto; scrollbar-width: none; }
.scr .list [data-nav] { display: flex; align-items: center; gap: 4px; width: 100%; }
.opts b { margin-left: auto; color: #a0a0a0; }
.opts .on { color: #e83030; }

/* ---------- right panel (LCD, the reading area) ---------- */
.panel {
  position: absolute; left: 16px; top: 76px; width: 248px; height: 160px; overflow: auto; overscroll-behavior: contain;
  padding: 8px; background: var(--lcd); color: var(--lcd-txt); --sh: var(--lcd-sh); outline: none;
  scrollbar-width: none; view-transition-name: panel;
}
.panel h2 { color: #f8f8f8; }
.panel p + p { margin-top: 8px; }
.dim { color: var(--lcd-dim); }
.links { display: flex; gap: 12px; }
.links [data-nav] { display: inline-block; text-decoration: underline; text-underline-offset: 2px; }
.panel .list a { display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tw-rest { color: transparent; --sh: transparent; }
.more { position: sticky; bottom: 0; display: block; text-align: right; visibility: hidden; }
.more.on { visibility: visible; animation: blink .6s steps(1) infinite; }
.caught {
  display: inline-block; width: 6px; height: 6px; margin-right: 4px;
  background: linear-gradient(#e83030 0 2px, #303030 2px 3px, #f8f8f8 3px);
  clip-path: polygon(1px 0, 5px 0, 5px 1px, 6px 1px, 6px 5px, 5px 5px, 5px 6px, 1px 6px, 1px 5px, 0 5px, 0 1px, 1px 1px);
}
.caught.off { visibility: hidden; }

/* ---------- transitions: Gen 3 fade through black in 3 steps ---------- */
::view-transition-old(root), ::view-transition-new(root) { animation: none; }
::view-transition-old(screen), ::view-transition-old(panel) { animation: fade-out .15s steps(3) forwards; }
::view-transition-new(screen), ::view-transition-new(panel) { opacity: 0; animation: fade-in .15s .15s steps(3) forwards; }
@keyframes fade-out { to { filter: brightness(0); } }
@keyframes fade-in { from { opacity: 1; filter: brightness(0); } to { opacity: 1; filter: none; } }
::view-transition-group(sprite) { animation-duration: .3s; animation-timing-function: steps(6); }

/* ---------- DS layout: phones, portrait, small windows ---------- */
.b-btn { display: none; }
body.ds { display: block; }
.ds .device {
  zoom: 1; translate: none; width: 100%; height: 100%;
  display: flex; flex-direction: column; align-items: center; gap: 16px;
  padding: 16px 16px calc(16px + env(safe-area-inset-bottom));
}
.ds .base, .ds .lid { display: contents; }
.ds .shell, .ds .hw { display: none; }
.ds .screen { position: relative; inset: auto; flex: none; zoom: var(--k); }
.ds .panel { position: relative; inset: auto; width: auto; height: auto; align-self: stretch; flex: 1; min-height: 0; zoom: var(--k); padding-bottom: 48px; box-shadow: 0 0 0 2px #04100a; }
.ds.closed .device { justify-content: center; }
.ds.closed .panel { display: none; }
@media (orientation: landscape) { .ds .device { flex-direction: row; } }
.ds .b-btn:not([hidden]) {
  display: grid; place-items: center; position: fixed; right: 16px; bottom: calc(16px + env(safe-area-inset-bottom));
  width: 56px; height: 56px; border-radius: 50%; background: #982038; color: #f8f8f8;
  font: 32px/32px Gen3, monospace; box-shadow: inset -4px -4px 0 #601020, 0 0 0 3px var(--ink);
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
  ::view-transition-group(*), ::view-transition-old(*), ::view-transition-new(*) { animation: none !important; opacity: 1 !important; }
  .idle .f2, .spark { display: none; }
  .sil .sprite { filter: none; }
}
```

- [ ] **Step 3: `app.js` (substituir inteiro)**

```js
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
  $panel.innerHTML = `${html}<i class="more">▼</i>`;
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
```

- [ ] **Step 4: Checagens rápidas**

Run: `node --check app.js && node check.mjs`
Esperado: sem erro de sintaxe e `check ok`.

- [ ] **Step 5: Screenshots**

Subir o servidor (`python -m http.server 8123 --bind 127.0.0.1`, em background) e capturar com o Edge headless:

```bash
EDGE="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
OUT="$TEMP/pokedex-shots"; mkdir -p "$OUT"; PROFILE="$TEMP/pokedex-edge"
shot() {   # shot WxH dpr name "hash"
  "$EDGE" --headless=new --disable-gpu --hide-scrollbars --no-first-run --user-data-dir="$(cygpath -w "$PROFILE")" \
    --virtual-time-budget=5000 --window-size=$1 --force-device-scale-factor=$2 \
    --screenshot="$(cygpath -w "$OUT/$3.png")" "http://127.0.0.1:8123/$4" 2>/dev/null
}
phone() {  # phone W H dpr name "hash" — iframe, because headless windows can't go below ~480px wide
  printf '<body style="margin:0"><iframe src="http://127.0.0.1:8123/%s" width="%s" height="%s" style="border:0"></iframe>' "$5" "$1" "$2" > "$OUT/frame.html"
  "$EDGE" --headless=new --disable-gpu --hide-scrollbars --no-first-run --user-data-dir="$(cygpath -w "$PROFILE")" \
    --virtual-time-budget=5000 --window-size=500,900 --force-device-scale-factor=$3 \
    --screenshot="$(cygpath -w "$OUT/$4.png")" "file:///$(cygpath -m "$OUT/frame.html")" 2>/dev/null
}
for a in "d-intro|#/" "d-menu|#/menu" "d-dex|#/dex" "d-entry|#/dex/1" "d-shiny|?shiny#/dex/6" "d-card|#/card" "d-badges|#/badges" "d-moves|#/moves" "d-contact|#/contact" "d-options|#/options"; do shot 1920,1080 1 "${a%%|*}" "${a#*|}"; done
shot 1366,768 1 m-entry "#/dex/2"
phone 390 844 3 p-menu "#/menu"; phone 390 844 3 p-entry "#/dex/1"; phone 390 844 3 p-dex "#/dex"
shot 844,390 3 l-entry "#/dex/1"
```
Abrir cada PNG e conferir: letras da fonte do jogo, nítidas e do mesmo tamanho de pixel dos sprites; molduras reais; etiquetas de tipo e insígnias reais; nada cortado nas telas de 240×160; layout DS com tela e painel na mesma escala. Corrigir posições (px de jogo) no CSS e repetir.

- [ ] **Step 6: Commit**

```bash
git add index.html style.css app.js
git commit -m "feat: pixel único com fonte, molduras e ícones do jogo; animações, opções e fundo em vídeo"
```

---

### Task 7: Teste de interação no repositório + verificação final

**Files:**
- Create: `tools/e2e.mjs`

- [ ] **Step 1: `tools/e2e.mjs`**

```js
// Drives headless Edge over CDP against a local static server and checks the main flows.
// Run: node tools/e2e.mjs   (EDGE=<path to msedge/chrome> to override the browser)
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { extname, join } from 'node:path';

const EDGE = process.env.EDGE || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const SITE = 8124, CDP = 9335;
const BASE = `http://127.0.0.1:${SITE}/`;
const ROOT = new URL('..', import.meta.url);
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.gif': 'image/gif', '.wav': 'audio/wav', '.woff': 'font/woff', '.json': 'application/json', '.webm': 'video/webm', '.mp4': 'video/mp4' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const server = createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, BASE).pathname);
  const file = new URL('.' + (path === '/' ? '/index.html' : path), ROOT);
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': MIME[extname(file.pathname)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((r) => server.listen(SITE, '127.0.0.1', r));

const edge = spawn(EDGE, ['--headless=new', '--disable-gpu', `--remote-debugging-port=${CDP}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'pokedex-e2e-'))}`, '--window-size=1920,1080', 'about:blank'], { stdio: 'ignore' });
let targets;
for (let i = 0; i < 50 && !targets; i++) {
  try { targets = await (await fetch(`http://127.0.0.1:${CDP}/json`)).json(); } catch { await sleep(200); }
}
const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0;
const pending = new Map();
const errors = [];
ws.addEventListener('message', (m) => {
  const msg = JSON.parse(m.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text);
  if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') errors.push(msg.params.args.map((a) => a.value ?? a.description).join(' '));
  if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') errors.push(`${msg.params.entry.text} ${msg.params.entry.url || ''}`);
});
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expr) => (await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result.result.value;
const KEYS = {
  Enter: { code: 'Enter', windowsVirtualKeyCode: 13, text: '\r' },
  ArrowDown: { code: 'ArrowDown', windowsVirtualKeyCode: 40 }, ArrowUp: { code: 'ArrowUp', windowsVirtualKeyCode: 38 },
  ArrowLeft: { code: 'ArrowLeft', windowsVirtualKeyCode: 37 }, ArrowRight: { code: 'ArrowRight', windowsVirtualKeyCode: 39 },
  z: { code: 'KeyZ', windowsVirtualKeyCode: 90, text: 'z' }, x: { code: 'KeyX', windowsVirtualKeyCode: 88, text: 'x' },
  Escape: { code: 'Escape', windowsVirtualKeyCode: 27 },
};
const keyDown = (k) => send('Input.dispatchKeyEvent', { type: 'keyDown', key: k, ...KEYS[k] });
const key = async (k, wait = 300) => {
  await keyDown(k);
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, ...KEYS[k], text: undefined });
  await sleep(wait);
};
const click = async (selector, wait = 300) => {
  const r = await ev(`(() => { const b = document.querySelector('${selector}').getBoundingClientRect(); return [b.x + b.width / 2, b.y + b.height / 2]; })()`);
  for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x: r[0], y: r[1], button: 'left', clickCount: 1 });
  await sleep(wait);
};
const hash = () => ev('location.hash');
const focused = () => ev('document.activeElement.textContent.trim()');
const has = (sel) => ev(`!!document.querySelector('${sel}')`);
const ok = (name) => console.log('ok  ' + name);

await send('Runtime.enable');
await send('Log.enable');
await send('Page.enable');
await send('Page.navigate', { url: BASE + '#/' });
await sleep(1500);
await ev('localStorage.clear()');
await send('Page.reload');
await sleep(1500);

// intro + fonts
assert.ok((await ev('document.body.className')).includes('closed'));
assert.ok(await ev(`document.fonts.check('16px Gen3') && document.fonts.check('16px "Gen3 Small"')`), 'fonte do jogo não carregou');
ok('abre fechada, com a fonte do jogo carregada');
await key('Enter', 2400);
assert.equal(await hash(), '#/menu');
assert.equal(await focused(), 'POKéDEX');
ok('tecla abre, roda a abertura e cai no menu');

// menu + typing
await key('ArrowDown');
assert.equal(await focused(), 'JOÃO');
assert.equal(await ev(`document.querySelector('#panel p').textContent`), 'Quem é o treinador.');
ok('seta move o cursor e o painel acompanha');
await key('z', 150);
assert.equal(await hash(), '#/card');
assert.ok(await ev(`document.body.classList.contains('talking') && !!document.querySelector('#panel .tw-rest')`), 'texto não está digitando');
await key('z', 100);
assert.ok(await ev(`!document.body.classList.contains('talking') && !document.querySelector('#panel .tw-rest')`), 'A não completou o texto');
ok('texto digita e A completa na hora');
await key('x', 500);
assert.equal(await hash(), '#/menu');
assert.equal(await focused(), 'JOÃO');
ok('X volta e o cursor lembra a posição');

// dex + first visit
await key('ArrowUp');
await key('Enter', 500);
assert.equal(await hash(), '#/dex');
await key('ArrowDown');
await key('ArrowDown');
assert.match(await ev(`document.querySelector('#dex-name').textContent`), /GENGAR/);
assert.match(await ev(`document.querySelector('#dex-stage .sprite').getAttribute('src')`), /emerald\/94\.png$/);
assert.ok(await has('#dex-stage .f2'), 'sem segundo quadro na lista');
ok('lista troca o sprite (Emerald, 2 quadros)');
await key('z', 250);
assert.equal(await hash(), '#/dex/3');
assert.ok(await has('.entry .stage.sil'), 'primeira visita sem silhueta');
await sleep(1000);
assert.ok(!(await has('.entry .stage.sil')), 'silhueta não revelou');
assert.match(await ev(`document.querySelector('#panel').textContent`), /registrados na POKéDEX/);
ok('primeira visita: silhueta → cores → registrado');
await key('ArrowRight', 500);
assert.equal(await hash(), '#/dex/4');
await key('Escape', 500);
assert.equal(await hash(), '#/dex');
assert.match(await focused(), /LAPRAS/);
assert.match(await ev(`document.querySelector('.bar').textContent`), /VISTOS 2\/8/);
await ev(`location.hash = '#/dex/3'`);
await sleep(500);
assert.ok(!(await has('.entry .stage.sil')), 'segunda visita não deve ter silhueta');
ok('segunda visita vai direto');

// device reacting
await ev(`location.hash = '#/moves'`);
await sleep(500);
await keyDown('ArrowDown');
assert.ok(await ev(`document.querySelector('[data-hw="down"]').classList.contains('pressed')`), 'direcional não afundou');
await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowDown', ...KEYS.ArrowDown });
await sleep(300);
assert.match(await ev(`document.querySelector('#panel h2').textContent`), /PYTHON/);
ok('teclado afunda o direcional; golpes mostram o selecionado');
await click('[data-hw="sound"]');
assert.ok(await ev(`document.body.classList.contains('sound-on')`));
assert.equal(await ev(`localStorage.getItem('sound')`), 'true');
await click('[data-hw="sound"]');
assert.ok(!(await ev(`document.body.classList.contains('sound-on')`)));
ok('botão preto liga/desliga o som e a luz verde');
await click('[data-key="badges"]', 500);
assert.equal(await hash(), '#/badges');
await key('ArrowRight');
assert.equal(await ev(`document.querySelector('#badge-name').textContent`), 'EMPRESA EXEMPLO B');
ok('teclas azuis e grade de insígnias');

// options
await ev(`location.hash = '#/options'`);
await sleep(500);
await key('z', 400);
assert.equal(await ev('document.documentElement.lang'), 'en');
assert.match(await ev(`document.querySelector('#screen').textContent`), /LANGUAGE/);
assert.equal(await ev(`document.querySelector('[data-key="badges"]').textContent`), 'BADGES');
await key('ArrowDown');
await key('ArrowDown');
await key('ArrowRight', 400);
assert.equal(await ev(`localStorage.getItem('textSpeed')`), '"slow"');
await key('ArrowDown');
await key('z', 400);
assert.match(await ev(`getComputedStyle(document.documentElement).getPropertyValue('--frame')`), /frame-2\.png/);
ok('opções: idioma, velocidade do texto e moldura');
await send('Page.reload');
await sleep(2000);
assert.equal(await ev('document.documentElement.lang'), 'en');
assert.match(await ev(`getComputedStyle(document.documentElement).getPropertyValue('--frame')`), /frame-2\.png/);
ok('recarregar mantém as opções');

// routes, shiny, background
await ev(`location.hash = '#/dex/99'`);
await sleep(500);
assert.equal(await hash(), '#/menu');
await send('Page.navigate', { url: BASE + '?shiny#/dex/1' });
await sleep(2500);
assert.equal(await ev(`document.querySelectorAll('.spark').length`), 4);
assert.match(await ev(`document.querySelector('.entry .sprite').getAttribute('src')`), /animated\/shiny\/6\.gif$/);
ok('rota inválida vai pro menu; ?shiny mostra o shiny');
const clips = await ev(`fetch('assets/video/clips.json').then((r) => r.json())`);
assert.equal(await has('.bg-video'), clips.length > 0, 'vídeo de fundo não bate com clips.json');
ok(`fundo: ${clips.length ? 'vídeo tocando' : 'sem clipes, fundo provisório'}`);

assert.deepEqual(errors, [], 'erros no console: ' + errors.join('\n'));
ok('nenhum erro no console');

ws.close();
edge.kill();
server.close();
console.log('e2e ok');
process.exit(0);
```

- [ ] **Step 2: Rodar**

Run: `node tools/e2e.mjs`
Esperado: todas as linhas `ok …` e `e2e ok`. Em falha, corrigir o código do site (não afrouxar o teste) e rodar de novo.

- [ ] **Step 3: Verificação final**

```bash
python tools/build_assets.py && node check.mjs && node tools/e2e.mjs
```
Repetir as screenshots da Task 6 e conferir; checar o modo "reduzir movimento" no navegador (abre direto, sem digitação nem silhueta).

- [ ] **Step 4: Commit**

```bash
git add tools/e2e.mjs
git commit -m "test: teste de interação no Edge com os fluxos do passe visual"
```
