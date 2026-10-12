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
