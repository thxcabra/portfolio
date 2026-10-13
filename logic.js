// Pure logic shared by the app and check.mjs (no DOM).

// Same order as the type labels in assets/ui/types.png (4 per row, 32x12, from y=16).
export const TYPES = ['normal', 'fire', 'water', 'grass', 'electric', 'rock', 'ground', 'ice', 'flying', 'fighting', 'ghost', 'bug', 'poison', 'psychic', 'steel', 'dark', 'dragon'];
// Same order as the badges in assets/ui/badges.png (16x16 each).
export const SHAPES = ['boulder', 'cascade', 'thunder', 'rainbow', 'soul', 'marsh', 'volcano', 'earth'];
// Screens with their own link: 'projetos/3' (or '#/projetos/3') -> { screen: 'projetos', n: 3 }.
// Anything else -> null, which means the room.
export const LINKED = ['projetos', 'sobre', 'experiencia', 'habilidades', 'contato'];
export function route(path, projects) {
  const [screen, n, ...rest] = String(path ?? '').replace(/^#?\/?/, '').split('/');
  if (!LINKED.includes(screen) || rest.length) return null;
  if (n === undefined) return { screen, n: null };
  const i = Number(n);
  return screen === 'projetos' && Number.isInteger(i) && i >= 1 && i <= projects ? { screen, n: i } : null;
}

// Width in game pixels of one line in the game font (assets/font/widths.json from the build).
export const textWidth = (s, widths) => [...s].reduce((w, ch) => w + (widths[ch] ?? 6), 0);

// Text that has to fit a window: at most `lines` lines, each at most `max` px.
export function fitsLines(text, widths, max, lines) {
  const all = text.split('\n');
  return all.length <= lines && all.every((l) => textWidth(l, widths) <= max);
}

// FireRed prints one letter, then waits 8 / 4 / 1 frames (sTextSpeedFrameDelays): letters per second.
export const TEXT_SPEEDS = { slow: 59.7275 / 9, mid: 59.7275 / 5, fast: 59.7275 / 2 };

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

// Script multichoice window (script_menu.c): width from the longest item, height by item count.
const MULTI_HEIGHT = [0, 2, 4, 6, 7, 9, 11, 13, 14];
export const multiTiles = (maxWidth, count) => ({ w: Math.floor((maxWidth + 9) / 8) + 1, h: MULTI_HEIGHT[count] });

// Front picture as FireRed's summary shows it (tools/build_assets.py, build_mons). form: Unown's letter.
export const monPath = (dex, { shiny = false, form = '' } = {}) => `assets/mon/${shiny ? 'shiny' : 'front'}/${dex}${form ? `-${form}` : ''}.png`;

// Word wrap in the game font: lines of at most `max` px; a line break in the text starts a new line.
export function wrapText(str, widths, max) {
  const lines = [];
  for (const para of str.split('\n')) {
    let line = '';
    for (const word of para.split(' ')) {
      const next = line ? `${line} ${word}` : word;
      if (line && textWidth(next, widths) > max) {
        lines.push(line);
        line = word;
      } else line = next;
    }
    lines.push(line);
  }
  return lines;
}

// Message box pages, 2 lines each.
export const toPages = (lines) => Array.from({ length: Math.ceil(lines.length / 2) }, (_, i) => lines.slice(2 * i, 2 * i + 2).join('\n'));

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

// Margins (game px) that put the centre of the 240x160 screen at (sx, sy) in the middle of a W×H body,
// and the size of the body with them: centring that box centres the game screen.
export function centerBox(W, H, sx, sy) {
  const cx = sx + 120, cy = sy + 80;
  const m = { top: Math.max(0, H - 2 * cy), right: Math.max(0, 2 * cx - W), bottom: Math.max(0, 2 * cy - H), left: Math.max(0, W - 2 * cx) };
  return { ...m, w: W + m.left + m.right, h: H + m.top + m.bottom };
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

// Insets for a rounded corner of radius r, in the format rrectPath takes.
export function corner(r) {
  const ins = Array.from({ length: Math.max(0, r) }, (_, k) => r - Math.round(Math.sqrt(r * r - (r - k - 0.5) ** 2)));
  while (ins.at(-1) === 0) ins.pop();
  return ins;
}

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
// tail: room needed after the last line (10 for the 'more' arrow when another page follows).
export function pageFits(page, widths, max = 208, tail = 0) {
  const lines = page.split('\n');
  return lines.length <= 2 && lines.every((l, i) => textWidth(l, widths) + (i === lines.length - 1 ? tail : 0) <= max);
}

export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
