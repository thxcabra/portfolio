// START menu (start_menu.c): a window at the right edge, items 15px apart, a ▶ that wraps around,
// and the help bar (help_message.c) describing the pointed item in two lines, white on blue.
import { textWidth } from '../../../logic.js';
import { win, text, createList } from '../ui.js';

export const MENU = ['projetos', 'sobre', 'experiencia', 'habilidades', 'contato', 'opcoes', 'sair'];
let last = 0;   // like the game, the menu reopens where the cursor was

export function createMenu({ api, widths, start = last, choose, close }) {
  const el = document.createElement('div');
  el.className = 'menu';
  let list = null;

  function render() {
    const labels = MENU.map((id) => api.t(`menu_${id}`));
    // The game's window is 7 tiles (POKéDEX fits); ours grows to the left, keeping its right edge at tile 29.
    const tiles = Math.max(7, Math.ceil((8 + Math.max(...labels.map((l) => textWidth(l, widths)))) / 8));
    const box = win(232 - tiles * 8, 8, tiles * 8, (MENU.length * 2 - 1) * 8);
    const help = document.createElement('div');
    help.className = 'help';
    el.replaceChildren(box, help);
    list = createList(box, {
      labels, pitch: 15, wrap: true, start: list ? list.index : start, api,
      onMove(i) {
        last = i;
        help.replaceChildren(text(api.t(`help_${MENU[i]}`), 2, 5));
      },
      onChoose: (i) => (MENU[i] === 'sair' ? close() : choose(MENU[i])),
    });
  }
  render();

  return {
    el,
    focus: () => list.focus(),
    refresh: render,   // the language may have changed in OPÇÕES
    button(name, down) {
      if (!down) return;
      if (name === 'b' || name === 'start') return close();
      list.button(name);
    },
  };
}
