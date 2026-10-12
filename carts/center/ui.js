// Windows, lists and the stack of screens the START menu opens, drawn the way FireRed's menus are.
import { esc } from '../../logic.js';

// A standard window: interior w×h at (x, y) in game px, the selected frame 8px around it
// (WindowFunc_DrawStandardFrame). Children are placed from the interior's top-left.
export function win(x, y, w, h, cls = '') {
  const el = document.createElement('div');
  el.className = `win ${cls}`.trim();
  Object.assign(el.style, { left: `${x - 8}px`, top: `${y - 8}px`, width: `${w + 16}px`, height: `${h + 16}px` });
  return el;
}

// Text placed like the game's printer: the glyph cell top on (x, y), lines 15px apart.
export function text(str, x, y, cls = '') {
  const p = document.createElement('p');
  p.className = `txt ${cls}`.trim();
  Object.assign(p.style, { left: `${x}px`, top: `${y}px` });
  p.innerHTML = str.split('\n').map((l) => `<span class="line">${esc(l)}</span>`).join('');
  return p;
}

// Mouse hover that only counts when the mouse really moved: redrawing a screen under a resting
// mouse makes the browser report a hover on the new element, which must not steal the cursor.
let lastXY = '';
export function onHover(el, fn) {
  el.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const xy = `${e.clientX},${e.clientY}`;
    if (xy === lastXY) return;
    lastXY = xy;
    fn();
  });
}

// A list with FireRed's ▶ cursor (x 0, items at x 8, `pitch` px apart). Keys move it with SE_SELECT;
// the mouse over an item moves it silently; a tap or click on another item moves it, and A or a
// click on the pointed item chooses it. Items are buttons and the pointed one has focus, so screen
// readers follow the cursor.
export function createList(box, { labels, y = 0, pitch, wrap, start = 0, api, onMove, onChoose }) {
  let cur = -1;
  const cursor = text('▶', 0, y, 'cursor');
  const choose = () => {
    api.sfx('select');
    onChoose(cur);
  };
  const buttons = labels.map((label, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.tabIndex = -1;
    b.className = 'item';
    b.style.top = `${y + pitch * i}px`;
    b.innerHTML = `<span class="line">${esc(label)}</span>`;
    onHover(b, () => set(i, false));
    b.addEventListener('click', (e) => {
      if (e.detail === 0) return;   // keyboard activation comes through button() instead
      if (i === cur) choose();
      else set(i, true);
    });
    return b;
  });
  box.append(cursor, ...buttons);

  function set(i, sound) {
    if (i === cur) return;
    if (sound) api.sfx('select');
    buttons[cur]?.removeAttribute('aria-current');
    cur = i;
    buttons[i].setAttribute('aria-current', 'true');
    buttons[i].focus({ preventScroll: true });
    cursor.style.top = `${y + pitch * i}px`;
    onMove?.(i);
  }
  set(Math.max(0, Math.min(start, labels.length - 1)), false);

  return {
    get index() { return cur; },
    focus: () => buttons[cur].focus({ preventScroll: true }),
    button(name) {
      const d = name === 'down' ? 1 : name === 'up' ? -1 : 0;
      if (d) {
        const n = labels.length;
        const next = wrap ? (cur + d + n) % n : Math.min(n - 1, Math.max(0, cur + d));
        if (next !== cur) set(next, true);
        return true;
      }
      if (name === 'a') {
        choose();
        return true;
      }
      return false;
    },
  };
}

// The screens over the room. The top one gets the buttons (each screen decides what B does).
// A click on the room around the windows goes to `outside`; `path` is the link of the topmost
// screen that has one ('' when none).
export function createStack(root, { onChange, outside }) {
  const layer = document.createElement('div');
  layer.className = 'ui';
  root.append(layer);
  const list = [];
  const top = () => list[list.length - 1] ?? null;
  layer.addEventListener('pointerdown', (e) => {
    if (e.target !== layer || !list.length) return;
    e.stopPropagation();   // not a click on the room
    outside();
  });
  return {
    get size() { return list.length; },
    get top() { return top(); },
    push(screen) {
      list.push(screen);
      layer.append(screen.el);
      screen.focus?.();
      onChange();
    },
    pop() {
      list.pop()?.el.remove();
      top()?.refresh?.();
      top()?.focus?.();
      onChange();
    },
    clear() {
      while (list.length) list.pop().el.remove();
      onChange();
    },
    button(name, down) {
      top()?.button(name, down);
    },
    path: () => [...list].reverse().find((s) => s.path)?.path ?? '',
  };
}
