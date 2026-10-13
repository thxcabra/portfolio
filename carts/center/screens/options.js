// OPÇÕES (option_menu.c): the blue top bar with the key hints, the title in the std.png frame and
// the list in the selected frame. There is no cursor: the chosen row stays bright while the rest
// of the list is darkened 2/16 (BLDY 2 outside WIN0). ←/→ change a value at once (wrapping),
// ↑/↓ move (wrapping), A or B leave. The game plays no sounds on this screen.
import { cycle, esc } from '../../../logic.js';
import { win, text, onHover } from '../ui.js';

const SPEEDS = ['slow', 'mid', 'fast'];
const FRAMES = Array.from({ length: 10 }, (_, i) => i + 1);

export function createOptions({ api, setFrame, close }) {
  const el = document.createElement('div');
  el.className = 'options full';
  const rows = [
    { label: 'opt_text', value: () => api.t(api.store.get('textSpeed', 'fast')), change: (d) => api.store.set('textSpeed', cycle(SPEEDS, api.store.get('textSpeed', 'fast'), d)) },
    { label: 'opt_sound', value: () => api.t(`vol_${api.volume()}`), change: (d) => api.volume(cycle([0, 1, 2, 3], api.volume(), d)) },
    { label: 'opt_frame', value: () => `${api.t('frame_type')}${String(api.store.get('frame', 1)).padStart(2, ' ')}`, change: (d) => setFrame(cycle(FRAMES, api.store.get('frame', 1), d)) },
    { label: 'opt_lang', value: () => api.t(`lang_${api.lang()}`), change: (d) => api.setLang(cycle(['pt', 'en'], api.lang(), d)) },
    { label: 'opt_exit' },
  ];
  let row = 0;
  let buttons = [];

  function render() {
    const bar = document.createElement('div');
    bar.className = 'opt-bar';
    bar.innerHTML = `<p class="keys"><i class="key ud"></i>${esc(api.t('keys_pick'))} <i class="key lr"></i>${esc(api.t('keys_switch'))} <i class="key a"></i><i class="key b"></i>${esc(api.t('keys_exit'))}</p>`;
    const head = win(16, 24, 208, 16, 'std');
    head.append(text(api.t('opt_title'), 8, 1));
    const list = win(16, 56, 208, 96, 'opt-list');
    const strip = document.createElement('i');
    strip.className = 'opt-sel';
    strip.style.top = `${2 + 13 * row}px`;
    buttons = rows.map((r, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.tabIndex = -1;
      b.className = `opt-row${i === row ? ' cur' : ''}`;
      b.style.top = `${2 + 13 * i}px`;
      b.innerHTML = `<span class="line">${esc(api.t(r.label))}</span>${r.value ? `<span class="line val">${esc(r.value())}</span>` : ''}`;
      onHover(b, () => { if (i !== row) pick(i); });
      b.addEventListener('click', (e) => {
        if (e.detail === 0) return;
        if (i !== row) return pick(i);
        if (r.change) change(1);
        else close();
      });
      return b;
    });
    list.append(strip, ...buttons);
    el.replaceChildren(bar, head, list);
    focus();
  }

  const focus = () => buttons[row]?.focus({ preventScroll: true });
  function pick(i) {
    row = (i + rows.length) % rows.length;
    render();
  }
  function change(d) {
    rows[row].change?.(d);
    render();
  }
  render();

  return {
    el,
    focus,
    keys: () => ({ a: 'act_back', b: 'act_back' }),
    button(name, down) {
      if (!down) return;
      if (name === 'up') pick(row - 1);
      else if (name === 'down') pick(row + 1);
      else if (name === 'left') change(-1);
      else if (name === 'right') change(1);
      else if (name === 'a' || name === 'b') close();
    },
  };
}
