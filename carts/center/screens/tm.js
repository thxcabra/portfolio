// HABILIDADES: FireRed's TM Case (tm_case.c). One TM per skill ("No01 PYTHON"), SAIR at the end; 5 rows
// at (80, 8), 16px apart, scrolling as list_menu.c does. The disc of the pointed TM, in its type's
// colours, stands out of the case at (41 − 14·i/58, 46 + 8·i/58); moving the cursor (SE_SELECT) drops it
// into the case 10px a frame and raises the next one. Bottom left: TYPE, POWER, ACCURACY and PP, which
// here are the type, the power, "---" and the years of use. Bottom right: the description in white with
// 1px between letters. A reads it in the message box; B or SAIR closes.
import { TYPES, listMove, textWidth, wrapText, toPages, esc } from '../../../logic.js';
import { text, onHover, typeIcon } from '../ui.js';

const FPS = 59.7275;
const FADE = (9 * 1000) / FPS;
const ROWS = 5;
const ALL = 58;   // NUM_TECHNICAL_MACHINES + NUM_HIDDEN_MACHINES
const LABELS = [[64, 80], [0, 96], [64, 96], [0, 112]];   // TYPE, POWER, ACCURACY, PP in assets/ui/types.png (40x12)
const html = (s, x, y, cls = '') => text(s, x, y, cls).outerHTML;

export function createTm({ api, widths, data, say, close }) {
  const L = (o) => o[api.lang()] ?? o.pt;
  const wide = Object.fromEntries(Object.entries(widths).map(([ch, w]) => [ch, w + 1]));
  const moves = data.moves;
  const items = [...moves.map((m, i) => ({ label: m.name, no: String(i + 1).padStart(2, '0'), move: m })), { label: api.t('menu_sair') }];
  const el = document.createElement('div');
  el.className = 'tm full';
  const title = api.t('tm_title');
  el.innerHTML = `<img class="layer" src="assets/tm/menu.png" alt=""><i class="tm-disc"></i><img class="layer" src="assets/tm/case.png" alt="">
    ${html(title, Math.floor((72 - textWidth(title, widths)) / 2), 9, 'tm-title')}
    <div class="tm-list"></div>
    ${LABELS.map(([x, y], k) => `<i class="tm-label" style="top:${104 + 12 * k}px;background-position:${-x}px ${-y}px"></i>`).join('')}
    <div class="tm-info"></div><div class="tm-desc"></div>
    <i class="bag-arrow up tm-up"></i><i class="bag-arrow down tm-down"></i>`;
  const $ = (s) => el.querySelector(s);
  const disc = $('.tm-disc');
  let pos = { scroll: 0, row: 0 }, busy = false, gen = 0, y2 = 0;
  let shown = 0;   // the TM whose disc is out of the case (null: none)
  const index = () => pos.scroll + pos.row;

  // The disc for TM i (HMs come first in the case, so TM i sits at slot i + 8).
  function placeDisc(i) {
    const [x, y] = i === null ? [27, 54] : [41 - Math.floor((14 * (i + 8)) / ALL), 46 + Math.floor((8 * (i + 8)) / ALL)];
    Object.assign(disc.style, { left: `${x - 16}px`, top: `${y - 16 + y2}px` });
    if (i !== null) disc.style.backgroundPosition = `0 ${-32 * TYPES.indexOf(moves[i].type)}px`;
  }
  // SpriteCB_SwapDisc: down into the case 10px a frame, then the new one up the same way.
  async function swapDisc(i) {
    const me = ++gen;
    const frame = () => new Promise((r) => setTimeout(r, 1000 / FPS));
    while (y2 < 20) {
      await frame();
      if (me !== gen) return;
      y2 += 10;
      placeDisc(shown);
    }
    shown = i;
    placeDisc(i);
    if (i === null) return;
    while (y2 > 0) {
      await frame();
      if (me !== gen) return;
      y2 -= 10;
      placeDisc(i);
    }
  }
  function draw() {
    const rows = items.slice(pos.scroll, pos.scroll + ROWS).map((it, r) => `<button type="button" tabindex="-1" class="tm-row" style="top:${2 + 16 * r}px" data-r="${r}">`
      + (it.no ? `<span class="small">No</span><span class="small num">${it.no}</span><span class="line name">${esc(it.label)}</span>` : `<span class="line">${esc(it.label)}</span>`)
      + '</button>').join('');
    $('.tm-list').innerHTML = html('▶', 0, 2 + 16 * pos.row, 'cursor') + rows;
    $('.tm-list').querySelectorAll('.tm-row').forEach((b) => {
      const r = Number(b.dataset.r);
      onHover(b, () => pick(r));
      b.addEventListener('click', (e) => {
        if (e.detail === 0) return;
        if (r === pos.row) choose();
        else pick(r, true);
      });
    });
    $('.tm-list').querySelectorAll('.tm-row')[pos.row]?.focus({ preventScroll: true });
    $('.tm-up').hidden = pos.scroll === 0;
    $('.tm-down').hidden = pos.scroll + ROWS >= items.length;
    const m = items[index()].move;
    $('.tm-info').innerHTML = m
      ? typeIcon(m.type, 56, 104) + [String(m.power), '---', String(m.years)].map((v, k) => html(v, 81 - textWidth(v, widths), 116 + 12 * k)).join('')
      : [0, 1, 2, 3].map((k) => html('---', 63, 104 + 12 * k)).join('');
    const lines = wrapText(m ? L(m.text) : api.t('tm_close'), wide, 140);
    const desc = m && lines.length < 4 ? [...lines, api.t('tm_years').replace('{n}', m.years)] : lines;   // the years are in PP too
    $('.tm-desc').innerHTML = html(desc.join('\n'), 98, 99);
  }

  function pick(r, sound = false) {
    if (r === pos.row || pos.scroll + r >= items.length) return;
    if (sound) api.sfx('select');
    pos = { ...pos, row: r };
    changed();
  }
  function move(down) {
    const next = listMove(pos, down, items.length, Math.min(ROWS, items.length));
    if (next.scroll === pos.scroll && next.row === pos.row) return;
    pos = next;
    api.sfx('select');
    changed();
  }
  function changed() {
    draw();
    const i = index() < moves.length ? index() : null;
    if (api.reduced()) {
      y2 = i === null ? 20 : 0;
      shown = i;
      return placeDisc(i);
    }
    swapDisc(i);
  }

  function choose() {
    const m = items[index()].move;
    api.sfx('select');
    if (!m) return leave();
    say(toPages(wrapText(L(m.text), widths, 198)));
  }
  function leave() {
    busy = true;
    el.classList.add('to-black');
    setTimeout(close, api.reduced() ? 0 : FADE);
  }

  placeDisc(0);
  draw();

  return {
    el,
    path: 'habilidades',
    focus: () => $('.tm-list').querySelectorAll('.tm-row')[pos.row]?.focus({ preventScroll: true }),
    keys: () => ({ a: items[index()].move ? 'act_read' : 'act_back', b: 'act_back' }),
    button(name, down) {
      if (!down || busy) return;
      if (name === 'up' || name === 'down') move(name === 'down');
      else if (name === 'a') choose();
      else if (name === 'b') {
        api.sfx('select');
        leave();
      }
    },
  };
}
