// A project's page, drawn as FireRed's Pokémon summary (pokemon_summary_screen.c), with the game's three
// tabs: INFO (the page_info layer: number, species, types, OT, ID, item and the TRAINER MEMO), IMAGENS
// (BG3 alone, the first picture in a window and the message box) and TECNOLOGIAS (the page_moves layer:
// up to 4 techs as moves). The front picture is mirrored (except Unown, as the game does) and bounces
// twice when it shows up; 1 visit in 16 is shiny (palettes 6 and 5 on the background, the star).
// ←/→ flip pages with SE_SELECT: → slides the page out to the right, ← slides the new one in from the
// right, 60px a frame. ↑/↓ show the previous/next project with its cry. A: on INFO, LER MAIS / VER SITE
// / CÓDIGO; on IMAGENS, the pictures full size. B fades to black and goes back.
import { textWidth, wrapText, toPages, multiTiles, monPath, esc } from '../../../logic.js';
import { win, text, createList, typeIcon } from '../ui.js';

const FPS = 59.7275;
const FADE = (9 * 1000) / FPS;
const PAGES = ['info', 'shots', 'stack'];
const TABS = { info: 'info', shots: 'skills', stack: 'moves' };   // the tab state each page shows
const BOUNCE = [-5, -3, -1, 0, 1, 3, 5];   // sMonPicBounceYDelta_Full: one step every 3 frames, twice
const html = (str, x, y, cls = '') => text(str, x, y, cls).outerHTML;

export function createSummary({ api, widths, data, index, say, onIndex, close }) {
  const el = document.createElement('div');
  el.className = 'summary full';
  let i = index, page = 0, shiny = false, sub = null, busy = false, pageEl = null;
  const P = () => data.projects[i];
  const L = (o) => o[api.lang()] ?? o.pt;
  const art = (name) => `assets/summary/${name}${shiny ? '-shiny' : ''}.png`;
  const typeOf = (tech) => data.moves.find((m) => m.name === tech)?.type ?? data.tech[tech] ?? 'normal';
  const keys = () => `<i class="key lr"></i>${esc(api.t('keys_page'))} <i class="key b"></i>${esc(api.t('keys_back'))}`;

  // Page contents, in screen coordinates (the page slides as one piece).
  function build() {
    const p = P(), node = document.createElement('div');
    node.className = 'sum-page';
    const name = PAGES[page];
    if (name === 'info') {
      const memo = [...wrapText(L(p.pitch), widths, 224), api.t('sum_more')].join('\n');
      node.innerHTML = `<img class="layer" src="${art('info')}" alt="">`
        + html(String(p.dex).padStart(3, '0'), 167, 21) + html(p.pokemon, 167, 35)
        + [...new Set(p.types)].map((t, k) => typeIcon(t, 167 + 36 * k, 51)).join('')
        + html(data.trainer.name.split(' ')[0], 167, 65) + html(data.trainer.id, 167, 80) + html(L(p.kind), 167, 95)
        + html(memo, 8, 115, 'memo');
    } else if (name === 'stack') {
      node.innerHTML = `<img class="layer" src="${art('moves')}" alt="">`
        + p.stack.map((t, k) => typeIcon(typeOf(t), 123, 21 + 28 * k) + html(t, 163, 21 + 28 * k, 'move')).join('');
    } else {
      const n = p.shots.length;
      const msg = document.createElement('div');
      msg.className = 'msg';
      msg.append(text((n ? api.talk('shots')[0].replace('{n}', n) : api.talk('no_shots')[0]), 16, 9));
      node.append(msg);
      if (n) {
        const box = win(128, 24, 104, 80, 'sum-shot');
        const c = Object.assign(document.createElement('canvas'), { width: 104, height: 80 });
        box.append(c);
        node.append(box);
        thumb(c, p.shots[0]);
      }
    }
    return node;
  }

  // The first picture, cut down to 104x80 (top part, filling the window): a pixelated preview.
  function thumb(c, src) {
    const img = new Image();
    img.onload = () => {
      const k = Math.max(104 / img.width, 80 / img.height);
      const ctx = c.getContext('2d');
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, (104 - img.width * k) / 2, 0, img.width * k, img.height * k);
    };
    img.src = src;
  }

  function header() {
    el.querySelector('.base').src = art(`base-${TABS[PAGES[page]]}`);
    el.querySelector('.sum-title').replaceWith(text(api.t(`sum_${PAGES[page]}`), 4, 1, 'sum-title'));
  }

  // The whole screen for the current project (on open and on ↑/↓).
  function render() {
    const p = P();
    shiny = Math.random() < 1 / 16;
    const flip = p.dex === 201 ? '' : ' flip';   // Unown is the one front picture the game never mirrors
    el.innerHTML = `<img class="layer base" src="${art(`base-${TABS[PAGES[page]]}`)}" alt="">
      <img class="mon${flip}" src="${monPath(p.dex, { shiny, form: p.form })}" alt="${esc(p.pokemon)}">
      <img class="sum-ball" src="assets/summary/ball.png" alt="">
      ${shiny ? '<img class="sum-star" src="assets/summary/star.png" alt="">' : ''}
      ${html(api.t('sum_info'), 4, 1, 'sum-title')}
      <p class="keys sum-keys">${keys()}</p>
      ${html(String(p.year), 4, 18, 'hd')}${html(p.name, 40, 18, 'hd')}`;
    pageEl = build();
    el.querySelector('.base').after(pageEl);
    header();
  }

  function bounce() {
    if (api.reduced()) return;
    let y = 0;
    const steps = [0, ...BOUNCE, ...BOUNCE].map((d) => `0 ${(y += d)}px`);
    el.querySelector('.mon').animate(steps.map((translate, k) => ({ translate, offset: k / (steps.length - 1), easing: 'step-end' })), { duration: ((steps.length - 1) * 3 * 1000) / FPS });
  }
  const hello = () => {
    api.cry(P().dex);
    bounce();
  };

  function flip(d) {
    const next = page + d;
    if (next < 0 || next >= PAGES.length) return;
    api.sfx('select');
    const old = pageEl;
    page = next;
    pageEl = build();
    header();
    const moving = d > 0 ? old : pageEl;   // → the old page leaves to the right; ← the new one comes in from it
    if (d > 0) old.before(pageEl);
    else old.after(pageEl);
    if (api.reduced()) return old.remove();
    busy = true;
    const [from, to] = d > 0 ? [0, 240] : [240, 0];
    moving.animate([{ translate: `${from}px 0` }, { translate: `${to}px 0` }], { duration: 4000 / FPS, easing: 'steps(4, end)' }).finished.then(() => {
      old.remove();
      busy = false;
    });
  }

  function go(d) {
    const next = i + d;
    if (next < 0 || next >= data.projects.length) return;
    i = next;
    render();
    hello();
    onIndex(i);
  }

  // A on INFO: what else there is to do with this project, in a window at the bottom right.
  function more() {
    const p = P();
    const items = [['sum_read', () => say(toPages(wrapText(L(p.text), widths, 198)))]];
    if (p.links.live) items.push(['sum_site', () => window.open(p.links.live, '_blank', 'noopener')]);
    if (p.links.repo) items.push(['sum_code', () => window.open(p.links.repo, '_blank', 'noopener')]);
    items.push(['sum_back', () => {}]);
    const labels = items.map(([k]) => api.t(k));
    const s = multiTiles(Math.max(...labels.map((l) => textWidth(l, widths))), labels.length);
    const box = win(232 - s.w * 8, 152 - s.h * 8, s.w * 8, s.h * 8);
    el.append(box);
    sub = { box, list: createList(box, { labels, y: 2, pitch: 14, wrap: false, api, onChoose: (j) => { closeMore(); items[j][1](); } }) };
  }
  function closeMore() {
    sub.box.remove();
    sub = null;
  }

  const showShots = () => {
    const p = P();
    if (p.shots.length) api.show(p.shots.map((src, k) => ({ src, alt: `${p.name} ${k + 1}/${p.shots.length}` })), 0);
  };

  function press(name) {
    if (busy) return;
    if (sub) {
      if (name === 'b') {
        api.sfx('select');
        closeMore();
      } else sub.list.button(name);
      return;
    }
    if (name === 'left') flip(-1);
    else if (name === 'right') flip(1);
    else if (name === 'up') go(-1);
    else if (name === 'down') go(1);
    else if (name === 'a' && PAGES[page] === 'info') {
      api.sfx('select');
      more();
    } else if (name === 'a' && PAGES[page] === 'shots') showShots();
    else if (name === 'b') {
      busy = true;
      el.classList.add('to-black');
      setTimeout(close, api.reduced() ? 0 : FADE);
    }
  }

  // The mouse: the tabs pick a page, the picture opens the pictures, the memo opens the window,
  // a click on the Pokémon plays its cry again.
  el.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || busy || sub) return;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 240, y = ((e.clientY - r.top) / r.height) * 160;
    if (y < 16 && x >= 104 && x < 152) {
      const to = Math.floor((x - 104) / 16);
      if (to !== page) flip(to > page ? 1 : -1);
    } else if (PAGES[page] === 'shots' && x >= 120 && y >= 16 && y < 112) showShots();
    else if (PAGES[page] === 'info' && y >= 112) press('a');
    else if (x < 120 && y >= 32 && y < 100) hello();
  });

  render();
  setTimeout(hello, api.reduced() ? 0 : FADE);   // the cry once the screen has faded in

  return {
    el,
    get path() { return `projetos/${i + 1}`; },
    focus() { sub?.list.focus(); },
    button(name, down) {
      if (down) press(name);
    },
  };
}
