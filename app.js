// Pokédex portfolio: routing, rendering, input and sound.
import { DATA } from './data.js';

export const TYPES = ['normal', 'fire', 'water', 'grass', 'electric', 'ice', 'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel'];
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

export function spritePath(dex, { shiny = false, animated = false } = {}) {
  const s = shiny ? 'shiny/' : '';
  if (animated) return `assets/sprites/emerald/animated/${s}${dex}.gif`;
  return `assets/sprites/${dex <= 151 ? 'firered-leafgreen' : 'emerald'}/${s}${dex}.png`;
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

if (typeof document !== 'undefined') boot();

function boot() {}
