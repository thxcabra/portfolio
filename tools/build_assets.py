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


UPM, PX, BASE = 1024, 64, 11          # 1 pixel = 64 units; baseline under cell row 10
FONT_DATE = 3_843_158_400             # 2025-10-12 in font time (seconds since 1904)
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
    fb.setupOS2(version=4, sTypoAscender=asc, sTypoDescender=-desc, sTypoLineGap=0, usWinAscent=asc, usWinDescent=desc,
                sxHeight=5 * PX, sCapHeight=8 * PX, fsSelection=0xC0)   # regular + use typo metrics
    fb.setupPost()
    fb.updateHead(created=FONT_DATE, modified=FONT_DATE)   # fixed dates: rebuilding gives byte-identical files
    fb.font.recalcTimestamp = False
    fb.font.flavor = 'woff'
    fb.save(str(out))


def build_fonts():
    font = OUT / 'font'
    font.mkdir(parents=True, exist_ok=True)
    glyphs, adv = collect_glyphs('normal')
    save_font(glyphs, adv, 'Gen3', font / 'gen3.woff')
    (font / 'charset.json').write_text(json.dumps(sorted(glyphs), ensure_ascii=False), encoding='utf-8')
    (font / 'widths.json').write_text(json.dumps(adv, ensure_ascii=False), encoding='utf-8')
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


SFX = {'select': 0x05, 'win_open': 0x06, 'pc_on': 0x04, 'dex_scroll': 0x65, 'dex_page': 0x66, 'success': 0x19, 'shiny': 0x5F, 'bump': 0x07}


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


def main():
    build_ui()
    check_ui()
    check_fonts(*build_fonts())
    check_audio(build_audio(), build_video())
    check_world(*build_world())


if __name__ == '__main__':
    main()
