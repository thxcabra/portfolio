"""João's own art for the landing page, from material/ (kept out of git) to assets/site/. Only cleanup,
never redrawing:

  goat-ink.png    the goat in black brush lines: the white paper becomes transparent, the line one ink colour
  goat-pixel.png  the waving pixel goat (material/6.png, 90x90), cropped to its pixels
  firecat.png     the fire creature: the transparency checkerboard baked into the export (two greys) becomes
                  transparent, and the 16x upscale goes back to one pixel per pixel
  pokeball.gif    the PS1-style low poly Poké Ball turning (material/9.gif), as is

Run: python tools/site_art.py
"""
import shutil
from pathlib import Path

import pngio

ROOT = Path(__file__).resolve().parent.parent
SRC, OUT = ROOT / 'material', ROOT / 'assets' / 'site'
INK = (14, 12, 18)


def crop(rows, margin=0):
    """Rows cut to the box of the visible pixels, plus a transparent margin."""
    ys = [y for y, row in enumerate(rows) if any(p[3] for p in row)]
    xs = [x for x in range(len(rows[0])) if any(row[x][3] for row in rows)]
    box = [row[min(xs):max(xs) + 1] for row in rows[min(ys):max(ys) + 1]]
    pad = [(0, 0, 0, 0)] * (len(box[0]) + 2 * margin)
    return [pad] * margin + [[(0, 0, 0, 0)] * margin + row + [(0, 0, 0, 0)] * margin for row in box] + [pad] * margin


def goat_ink():
    _, _, px, _ = pngio.read(SRC / '5.png')
    rows = [[INK + (255 - (r * 299 + g * 587 + b * 114) // 1000,) for r, g, b, _ in row] for row in px]
    rows = [[p if p[3] > 8 else (0, 0, 0, 0) for p in row] for row in rows]   # paper grain off the white
    pngio.write(OUT / 'goat-ink.png', crop(rows, 4))


def goat_pixel():
    _, _, px, _ = pngio.read(SRC / '6.png')
    pngio.write(OUT / 'goat-pixel.png', crop(px))


def firecat(scale=16, x0=9, y0=0):
    """Samples the middle of each 16px block; the export starts 9px into a block horizontally."""
    w, h, px, _ = pngio.read(SRC / '12.png')
    board = {(128, 128, 128, 255), (192, 192, 192, 255)}
    xs = sorted({min(w - 1, max(0, x0 + scale * i + scale // 2)) for i in range(-1, (w - x0) // scale + 1)})
    ys = sorted({min(h - 1, max(0, y0 + scale * j + scale // 2)) for j in range(0, (h - y0) // scale + 1)})
    rows = [[(0, 0, 0, 0) if px[y][x] in board else px[y][x] for x in xs] for y in ys]
    pngio.write(OUT / 'firecat.png', crop(rows))


if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True)
    goat_ink()
    goat_pixel()
    firecat()
    shutil.copyfile(SRC / '9.gif', OUT / 'pokeball.gif')
    for f in ['goat-ink.png', 'goat-pixel.png', 'firecat.png', 'pokeball.gif']:
        print(f, (OUT / f).stat().st_size, 'bytes')
