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
