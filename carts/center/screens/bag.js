// EXPERIÊNCIA: FireRed's Bag (item_menu.c, bag.c) with two pockets, TRABALHO (one item per job, its
// badge as the icon) and FORMAÇÃO (one per school, the TEACHY TV icon); each list ends with SAIR. The
// pocket name in the top bar, the bag on the left (it shakes on every cursor move and hops when the
// pocket changes), the list at (88, 8) with 16px rows and 6 shown, the description in white with 2px
// between letters at (40, 115) and the icon centred on (24, 140). ↑/↓ SE_BAG_CURSOR, ←/→ SE_BAG_POCKET
// (the list area blanks, then its panel comes back one tile row a frame from the bottom), A reads the
// job's text in the message box, B closes.
import { SHAPES, listMove, textWidth, wrapText, toPages, esc } from '../../../logic.js';
import { text, onHover } from '../ui.js';

const FPS = 59.7275;
const FADE = (9 * 1000) / FPS;
const ROWS = 6;
const BAG_FRAME = [2, 3];   // the bag's ITEMS and KEY ITEMS pictures (sAnims_Bag)

export function createBag({ api, widths, data, say, close }) {
  const L = (o) => o[api.lang()] ?? o.pt;
  const wide = Object.fromEntries(Object.entries(widths).map(([ch, w]) => [ch, w + 2]));   // 2px between letters
  const lines = (s) => wrapText(s, wide, 200);
  const pockets = [
    {
      name: 'bag_work',
      items: data.badges.map((b) => ({
        label: b.name, icon: `<i class="badge bag-icon" style="background-position:${-16 * SHAPES.indexOf(b.shape)}px 0"></i>`,
        desc: [...lines(L(b.role)), L(b.period), api.t('bag_more')], text: L(b.text),
      })),
    },
    {
      name: 'bag_school',
      items: data.education.map((e) => ({
        label: e.name, icon: '<img class="bag-icon item" src="assets/bag/school.png" alt="">',
        desc: [...lines(L(e.course)), L(e.period)],
      })),
    },
  ].map((p) => ({
    ...p,
    items: [...p.items, { label: api.t('menu_sair'), icon: '<img class="bag-icon item" src="assets/bag/cancel.png" alt="">', desc: [api.t('bag_close')], cancel: true }],
    pos: { scroll: 0, row: 0 },
  }));

  const el = document.createElement('div');
  el.className = 'bag full';
  el.innerHTML = `<img class="layer" src="assets/bag/bg.png" alt="">
    <div class="bag-list"><img class="bag-panel" src="assets/bag/list.png" alt=""><div class="bag-rows"></div></div>
    <p class="txt bag-pocket"></p><div class="bag-sack"></div>
    <i class="bag-arrow left"></i><i class="bag-arrow right"></i><i class="bag-arrow up"></i><i class="bag-arrow down"></i>
    <div class="bag-desc"></div><div class="bag-icon-box"></div>`;
  const $ = (s) => el.querySelector(s);
  const sack = $('.bag-sack');
  let pocket = 0, busy = false;

  const cur = () => pockets[pocket];
  const index = () => cur().pos.scroll + cur().pos.row;

  function drawList() {
    const { items, pos } = cur();
    const rows = items.slice(pos.scroll, pos.scroll + ROWS).map((it, r) => {
      const b = `<button type="button" tabindex="-1" class="bag-row" style="top:${2 + 16 * r}px" data-r="${r}"><span class="line">${esc(it.label)}</span></button>`;
      return b;
    }).join('');
    $('.bag-rows').innerHTML = `${text('▶', 1, 2 + 16 * pos.row, 'cursor').outerHTML}${rows}`;
    $('.bag-rows').querySelectorAll('.bag-row').forEach((b) => {
      const r = Number(b.dataset.r);
      onHover(b, () => pick(r));
      b.addEventListener('click', (e) => {
        if (e.detail === 0) return;
        if (r === cur().pos.row) choose();
        else pick(r, true);
      });
    });
    $('.bag-rows').querySelectorAll('.bag-row')[pos.row]?.focus({ preventScroll: true });
    $('.bag-arrow.up').hidden = pos.scroll === 0;
    $('.bag-arrow.down').hidden = pos.scroll + ROWS >= items.length;
    const it = items[index()];
    $('.bag-desc').innerHTML = text(it.desc.join('\n'), 40, 115).outerHTML;
    $('.bag-icon-box').innerHTML = it.icon;
  }
  function drawPocket() {
    const name = api.t(cur().name);
    $('.bag-pocket').textContent = name;
    $('.bag-pocket').style.left = `${8 + Math.floor((72 - textWidth(name, widths)) / 2)}px`;
    $('.bag-arrow.left').hidden = pocket === 0;
    $('.bag-arrow.right').hidden = pocket === pockets.length - 1;
  }
  const setSack = (frame) => { sack.style.backgroundPosition = `0 ${-64 * frame}px`; };

  function shake() {
    if (api.reduced() || sack.getAnimations().length) return;
    const angles = [-2, -4, -2, 0, 2, 4, 2, 0, -2, -4, -2, 0];   // sAffineAnim_BagShake, frame by frame, in 1/256 of a turn
    sack.animate(angles.map((a, i) => ({ rotate: `${(a * 360) / 256}deg`, offset: i / angles.length, easing: 'step-end' })).concat([{ rotate: '0deg' }]), { duration: (angles.length * 1000) / FPS });
  }

  function pick(r, sound = false) {
    const { pos, items } = cur();
    if (r === pos.row || pos.scroll + r >= items.length) return;
    if (sound) api.sfx('bag_cursor');
    pos.row = r;
    drawList();
  }
  function move(down) {
    const { pos, items } = cur();
    const next = listMove(pos, down, items.length, Math.min(ROWS, items.length));
    if (next.scroll === pos.scroll && next.row === pos.row) return;
    Object.assign(pos, next);
    api.sfx('bag_cursor');
    shake();
    drawList();
  }

  // ←/→: the bag closes for 5 frames, opens on the new pocket and hops (y −5, then +1 a frame);
  // the list's panel comes back one tile row a frame from the bottom, then the items appear.
  function switchTo(d) {
    const next = pocket + d;
    if (next < 0 || next >= pockets.length) return;
    api.sfx('bag_pocket');
    pocket = next;
    drawPocket();
    $('.bag-rows').innerHTML = '';
    $('.bag-desc').innerHTML = '';
    $('.bag-icon-box').innerHTML = '';
    if (api.reduced()) {
      setSack(BAG_FRAME[pocket]);
      return drawList();
    }
    busy = true;
    setSack(0);
    setTimeout(() => setSack(BAG_FRAME[pocket]), (5 * 1000) / FPS);
    sack.animate(Array.from({ length: 6 }, (_, i) => ({ translate: `0 ${i - 5}px`, offset: i / 6, easing: 'step-end' })).concat([{ translate: '0 0' }]), { duration: (6 * 1000) / FPS });
    const panel = $('.bag-panel');
    panel.animate(Array.from({ length: 12 }, (_, i) => ({ clipPath: `inset(${88 - 8 * i}px 0 0 0)`, offset: i / 12, easing: 'step-end' })).concat([{ clipPath: 'inset(0 0 0 0)' }]), { duration: (12 * 1000) / FPS })
      .finished.then(() => {
        busy = false;
        drawList();
      });
  }

  function choose() {
    const it = cur().items[index()];
    api.sfx('select');
    if (it.cancel) return leave();
    if (it.text) say(toPages(wrapText(it.text, widths, 198)));
  }
  function leave() {
    busy = true;
    el.classList.add('to-black');
    setTimeout(close, api.reduced() ? 0 : FADE);
  }

  $('.bag-arrow.left').addEventListener('pointerdown', (e) => { if (e.button === 0 && !busy) switchTo(-1); });
  $('.bag-arrow.right').addEventListener('pointerdown', (e) => { if (e.button === 0 && !busy) switchTo(1); });
  sack.addEventListener('pointerdown', (e) => { if (e.button === 0 && !busy) switchTo(pocket ? -1 : 1); });
  setSack(BAG_FRAME[pocket]);
  drawPocket();
  drawList();

  return {
    el,
    path: 'experiencia',
    focus: () => $('.bag-rows').querySelectorAll('.bag-row')[cur().pos.row]?.focus({ preventScroll: true }),
    button(name, down) {
      if (!down || busy) return;
      if (name === 'up' || name === 'down') move(name === 'down');
      else if (name === 'left' || name === 'right') switchTo(name === 'right' ? 1 : -1);
      else if (name === 'a') choose();
      else if (name === 'b') {
        api.sfx('select');
        leave();
      }
    },
  };
}
