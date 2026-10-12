"""Minimal PNG reader/writer (stdlib only) for the asset pipeline."""
import struct
import zlib


def read(path):
    """Returns (width, height, pixels, palette).

    pixels[y][x] is a palette index for indexed images and an (r, g, b, a)
    tuple for truecolor ones; palette is None for truecolor images.
    Grayscale images give gray levels as ints (palette None)."""
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
        if ctype in (0, 3) and depth < 8:
            per, mask = 8 // depth, (1 << depth) - 1
            pixels.append([(line[x // per] >> (8 - depth * (x % per + 1))) & mask for x in range(w)])
        elif ctype in (0, 3) and depth == 8:
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
