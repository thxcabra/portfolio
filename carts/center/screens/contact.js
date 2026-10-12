// CONTATO, the way FireRed asks with a list (script_menu.c): the question stays in the message box
// and the choices sit in a window at the top left. E-MAIL asks again in a small window where the
// game puts YES/NO (interior ending at x=216, from y=72).
import { multiTiles, textWidth } from '../../../logic.js';
import { win, text, createList } from '../ui.js';

export function createContact({ api, widths, contact, say, close }) {
  const el = document.createElement('div');
  el.className = 'contact';
  const ask = document.createElement('div');
  ask.className = 'msg';
  ask.append(text(api.talk('contact_ask')[0], 16, 9));
  const labels = [...contact.map((c) => c.label), api.t('menu_sair')];
  const size = multiTiles(Math.max(...labels.map((l) => textWidth(l, widths))), labels.length);
  const box = win(8, 8, size.w * 8, size.h * 8);
  el.append(ask, box);
  const list = createList(box, { labels, y: 2, pitch: 14, wrap: labels.length > 3, api, onChoose: pick });
  let sub = null;

  function pick(i) {
    const c = contact[i];
    if (!c) return close();
    if (c.url.startsWith('mailto:')) return askMail(c.url);
    window.open(c.url, '_blank', 'noopener');
  }

  function askMail(url) {
    const options = [api.t('contact_write'), api.t('contact_copy')];
    const s = multiTiles(Math.max(...options.map((l) => textWidth(l, widths))), 2);
    const small = win(216 - s.w * 8, 72, s.w * 8, s.h * 8);
    el.append(small);
    sub = {
      box: small,
      list: createList(small, {
        labels: options, y: 2, pitch: 14, wrap: false, api,
        onChoose(j) {
          closeMail();
          if (j === 0) location.href = url;
          else copy(url.slice('mailto:'.length));
        },
      }),
    };
  }

  function closeMail() {
    sub.box.remove();
    sub = null;
    list.focus();
  }

  async function copy(address) {
    try {
      await navigator.clipboard.writeText(address);
      say(api.talk('copied'));
    } catch {
      say([address]);   // no clipboard: show it so it can be copied by hand
    }
  }

  return {
    el,
    path: 'contato',
    focus: () => (sub ? sub.list : list).focus(),
    button(name, down) {
      if (!down) return;
      if (name === 'b') {
        api.sfx('select');
        return sub ? closeMail() : close();
      }
      (sub ? sub.list : list).button(name);
    },
  };
}
