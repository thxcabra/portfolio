// PROJETOS, drawn as FireRed's Pokédex list in numerical mode (pokedex_screen.c): the title and key
// bars (window palette 15, which the fades leave alone), the patterned BG3 and one row per project
// (ItemPrintFunc_OrderedListMenu): ▶, No + number, the caught ball, the name and the type labels.
// ↑/↓ move (SE_SELECT); A and B make no sound, the list fades to white and then the page opens or
// the list closes. Up to 9 rows: the list never scrolls (check.mjs keeps it that way).
import { textWidth, esc } from '../../../logic.js';
import { createList, typeIcon } from '../ui.js';

const FPS = 59.7275;
const FADE = (9 * 1000) / FPS;   // BeginNormalPaletteFade with delay 0: 16 levels, 2 per frame
export function createDex({ api, widths, projects, start = 0, open, close }) {
  const el = document.createElement('div');
  el.className = 'dex full';
  let cur = start, list = null, busy = false;

  // One row, placed from the item's left edge at x 28 (the list box sits at x 20, so ▶ lands on x 20):
  // No on 28, the number on 37, the ball on 56, the name on 72, the types on 136 and 168.
  const row = (i) => {
    const p = projects[i];
    const kinds = [...new Set(p.types)];
    return `<span class="small no">No</span><span class="small num">${String(i + 1).padStart(3, '0')}</span>`
      + '<i class="caught"></i>'
      + `<span class="line name">${esc(p.name)}</span>${kinds.map((t, k) => typeIcon(t, 108 + 32 * k)).join('')}`;
  };

  function render() {
    const title = api.t('menu_projetos');
    el.innerHTML = `<div class="dex-bar"><p class="txt dex-title" style="left:${Math.floor((240 - textWidth(title, widths)) / 2)}px">${esc(title)}</p></div>
      <div class="dex-bar bottom"><p class="keys"><i class="key ud"></i>${esc(api.t('keys_pick'))} <i class="key a"></i>${esc(api.t('keys_ok'))} <i class="key b"></i>${esc(api.t('keys_exit'))}</p></div>`;
    const box = document.createElement('div');
    box.className = 'dex-list';
    el.prepend(box);
    list = createList(box, {
      labels: projects.map((p) => p.name), y: 2, pitch: 14, wrap: false, start: cur, api, quiet: true, render: row,
      onMove: (i) => { cur = i; },
      onChoose: (i) => leave(() => open(i)),
    });
  }

  // The list (not the bars) fades to white, then `then` runs.
  function leave(then) {
    if (busy) return;
    busy = true;
    el.classList.add('fading');
    setTimeout(() => {
      busy = false;
      el.classList.remove('fading');
      then();
    }, api.reduced() ? 0 : FADE);
  }

  render();
  return {
    el,
    path: 'projetos',
    focus: () => list.focus(),
    // Back from a project's page: the cursor on the last project shown, fading in from white.
    refresh() {
      render();
      el.classList.remove('from-white');
      void el.offsetWidth;
      el.classList.add('from-white');
    },
    set index(i) { cur = i; },
    button(name, down) {
      if (!down || busy) return;
      if (name === 'b') return leave(close);
      list.button(name);
    },
  };
}
