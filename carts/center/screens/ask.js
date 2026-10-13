// A question in the message box with the answers in a window above its right end, where the game
// puts YES/NO (script_menu.c: interior ending at x=216, the window resting on the message box).
// B answers with the last item.
import { multiTiles, textWidth } from '../../../logic.js';
import { win, text, createList } from '../ui.js';

export function createAsk({ api, widths, question, voice = '', items }) {
  const el = document.createElement('div');
  el.className = 'ask';
  const msg = document.createElement('div');
  msg.className = 'msg';
  if (voice) msg.dataset.voice = voice;
  msg.append(text(question, 16, 9));
  const labels = items.map((i) => i.label);
  const s = multiTiles(Math.max(...labels.map((l) => textWidth(l, widths))), labels.length);
  const box = win(216 - s.w * 8, 104 - s.h * 8, s.w * 8, s.h * 8);
  el.append(msg, box);
  const list = createList(box, { labels, y: 2, pitch: 14, wrap: false, api, onChoose: (i) => items[i].run() });
  return {
    el,
    focus: () => list.focus(),
    button(name, down) {
      if (!down) return;
      if (name !== 'b') return list.button(name);
      api.sfx('select');
      items.at(-1).run();
    },
  };
}
