import { typewrite } from '../../typewriter.js';
import { esc } from '../../logic.js';

// FireRed's field message box: pages of up to two lines, typed out, the bouncing arrow
// right after the last letter while more pages follow.
export function createDialog(root, api) {
  const box = document.createElement('div');
  box.className = 'msg dialog';
  box.hidden = true;
  const spoken = document.createElement('p');   // screen readers get each page whole, not letter by letter
  spoken.className = 'sr';
  spoken.setAttribute('aria-live', 'polite');
  root.append(box, spoken);
  let pages = [];
  let page = 0;
  let skip = null;
  let done = null;

  function show() {
    box.classList.remove('more');
    const lines = pages[page].split('\n');
    box.innerHTML = `<p aria-hidden="true">${lines.map((l, i) => `<span class="line">${esc(l)}${i === lines.length - 1 ? '<i class="next"></i>' : ''}</span>`).join('')}</p>`;
    spoken.textContent = pages[page].replace('\n', ' ');
    const finish = () => {
      skip = null;
      box.classList.toggle('more', page < pages.length - 1);
    };
    if (api.reduced()) return finish();
    skip = typewrite(box.firstElementChild, api.cps(), finish);
  }

  return {
    get open() { return !box.hidden; },
    say(list, onDone, voice = '') {
      pages = list;
      page = 0;
      done = onDone;
      box.dataset.voice = voice;
      box.hidden = false;
      show();
    },
    advance() {
      if (skip) return skip();
      if (page < pages.length - 1) {
        page += 1;
        api.sfx('select');
        return show();
      }
      box.hidden = true;
      spoken.textContent = '';
      const cb = done;
      done = null;
      cb?.();
    },
  };
}
