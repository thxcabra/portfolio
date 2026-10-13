// The PC's Box (pokemon_storage_system*.c), with the projects as its Pokémon: the Poké Ball background
// scrolling half a pixel a frame, PKMN DATA on the left (the pointed project's picture at 8,16 and its
// lines below), the FOREST wallpaper with the box name, the 6×5 grid (icons centred on 100+24c, 44+24r)
// and the hand cursor above it, PARTY POKéMON and CLOSE BOX at the top. A on a project: LEVAR (it joins
// the team, up to 6), RESUMO or CANCELAR; PARTY POKéMON drops the team panel (20 frames, 8px each,
// SE_WIN_OPEN), where A gives DEVOLVER / RESUMO / CANCELAR. The team is saved in the browser.
import { monPath, multiTiles, textWidth, esc } from '../../../logic.js';
import { win, text, createList } from '../ui.js';

const FPS = 59.7275;
const FADE = (9 * 1000) / FPS;
const COLS = 6, ROWS = 5, TEAM = 6;
const html = (s, x, y, cls = '') => text(s, x, y, cls).outerHTML;
const iconPath = (p) => `assets/mon/icon/${p.dex}${p.form ? `-${p.form}` : ''}.png`;

// Where the hand points (GetCursorCoordsByPos), as the centre of its 32×32 sprite.
function handAt(area, pos) {
  if (area === 'box') return [100 + 24 * (pos % COLS), 32 + 24 * Math.floor(pos / COLS)];
  if (area === 'title') return [162, 12];
  if (area === 'buttons') return [120 + 88 * pos, 14];
  if (pos === 0) return [104, 52];
  return pos === TEAM ? [152, 132] : [152, 4 + 24 * (pos - 1)];
}

export function createBox({ api, widths, data, say, openSummary, close }) {
  const L = (o) => o[api.lang()] ?? o.pt;
  const projects = data.projects;
  let team = (api.store.get('team', []) || []).filter((i) => Number.isInteger(i) && projects[i]).slice(0, TEAM);
  let area = 'box', pos = 0, menu = null, busy = false, partyOpen = false;

  const el = document.createElement('div');
  el.className = 'box full';
  el.innerHTML = `<i class="box-scroll"></i><img class="box-wall" src="assets/box/wallpaper.png" alt="">
    <img class="layer" src="assets/box/menu.png" alt="">
    ${html(api.t('box_title'), 160 - Math.floor(textWidth(api.t('box_title'), widths) / 2), 21, 'box-title')}
    <div class="box-icons"></div><img class="box-mon" src="${monPath(projects[0].dex, { form: projects[0].form })}" alt=""><div class="box-data"></div>
    <div class="box-party"><img src="assets/box/party.png" alt=""><div class="box-slots"></div></div>
    <i class="box-close"></i><i class="box-shadow"></i><i class="box-hand"></i><div class="box-msg"></div>`;
  const $ = (s) => el.querySelector(s);
  const save = () => api.store.set('team', team);

  function drawIcons() {
    $('.box-icons').innerHTML = projects.map((p, i) => (team.includes(i) ? '' : `<img class="box-icon" src="${iconPath(p)}" alt="${esc(p.name)}" style="left:${84 + 24 * (i % COLS)}px;top:${28 + 24 * Math.floor(i / COLS)}px">`)).join('');
    // The leader's slot is always drawn filled; the other five show whether someone is there.
    $('.box-slots').innerHTML = Array.from({ length: TEAM - 1 }, (_, k) => `<img src="assets/box/slot-${team[k + 1] !== undefined ? 'filled' : 'empty'}.png" alt="" style="left:56px;top:${8 + 24 * k}px">`).join('')
      + team.map((i, k) => {
        const [x, y] = k === 0 ? [104, 64] : [152, 16 + 24 * (k - 1)];
        return `<img class="box-icon" src="${iconPath(projects[i])}" alt="${esc(projects[i].name)}" style="left:${x - 80 - 16}px;top:${y - 16}px">`;   // the panel is at x 80
      }).join('');
  }

  // The project under the hand: in the box (if it isn't in the team) or in the team panel.
  const pointed = () => {
    if (area === 'box') return pos < projects.length && !team.includes(pos) ? pos : null;
    if (area === 'party') return team[pos] ?? null;
    return null;
  };

  function drawData() {
    const i = pointed(), mon = $('.box-mon');
    mon.hidden = i === null;
    if (i === null) return void ($('.box-data').innerHTML = '');
    const p = projects[i];
    mon.src = monPath(p.dex, { form: p.form });
    $('.box-data').innerHTML = html(p.name, 6, 88) + html(`/${p.pokemon}`, 6, 102) + html(String(p.year), 10, 116) + html(L(p.kind), 6, 132, 'small');
  }

  function drawHand() {
    const [x, y] = handAt(area, pos);
    Object.assign($('.box-hand').style, { left: `${x - 16}px`, top: `${y - 16}px` });
    Object.assign($('.box-shadow').style, { left: `${x - 8}px`, top: `${y + 12}px` });
    $('.box-shadow').hidden = area !== 'box';
    $('.box-close').classList.toggle('on', area === 'buttons' && pos === 1);
  }
  const draw = () => {
    drawData();
    drawHand();
  };

  function message(str) {
    $('.box-msg').innerHTML = '';
    if (!str) return;
    const box = win(8, 136, 224, 16, 'std');
    box.append(text(str, 0, 1));
    $('.box-msg').append(box);
  }

  // The team panel hangs above the screen; it drops 8px a frame for 20 frames, or goes back up.
  function slideParty(down) {
    partyOpen = down;
    if (down) api.sfx('win_open');
    const from = down ? -160 : 0, to = down ? 0 : -160;
    const panel = $('.box-party');
    if (api.reduced()) {
      panel.style.top = `${to}px`;
      return Promise.resolve();
    }
    busy = true;
    return panel.animate(Array.from({ length: 21 }, (_, k) => ({ top: `${from + (to - from) * (k / 20)}px`, offset: k / 20, easing: 'step-end' })), { duration: (20 * 1000) / FPS, fill: 'forwards' })
      .finished.then((a) => {
        panel.style.top = `${to}px`;
        panel.getAnimations().forEach((x) => x.cancel());
        busy = false;
        return a;
      });
  }

  function move(name) {
    const d = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[name];
    if (!d) return;
    let next = [area, pos];
    if (area === 'box') {
      const c = pos % COLS, r = Math.floor(pos / COLS);
      if (d[0]) next = ['box', r * COLS + ((c + d[0] + COLS) % COLS)];
      else if (r + d[1] < 0) next = ['title', 0];
      else if (r + d[1] >= ROWS) next = ['buttons', 0];
      else next = ['box', pos + d[1] * COLS];
    } else if (area === 'title') {
      if (d[1] < 0) next = ['buttons', 0];
      else if (d[1] > 0) next = ['box', 2];
    } else if (area === 'buttons') {
      if (d[0]) next = ['buttons', pos ? 0 : 1];
      else if (d[1] > 0) next = ['title', 0];
      else next = ['box', (ROWS - 1) * COLS + 2];
    } else if (area === 'party') {
      if (d[1]) next = ['party', (pos + d[1] + TEAM + 1) % (TEAM + 1)];
      else if (d[0] < 0 && pos > 0 && pos < TEAM) next = ['party', 0];
      else if (d[0] > 0 && pos === 0) next = ['party', 1];
    }
    if (next[0] === area && next[1] === pos) return;
    [area, pos] = next;
    api.sfx('select');
    draw();
  }

  // A window of choices at the bottom right, over the message line.
  function ask(items) {
    const labels = items.map(([k]) => api.t(k));
    const s = multiTiles(Math.max(...labels.map((l) => textWidth(l, widths))), labels.length);
    const box = win(232 - s.w * 8, 120 - s.h * 8, s.w * 8, s.h * 8);
    el.append(box);
    const done = () => {
      box.remove();
      menu = null;
      message('');
    };
    menu = {
      done,
      list: createList(box, { labels, y: 2, pitch: 14, wrap: false, api, onChoose: (j) => { done(); items[j][1](); } }),
    };
  }

  async function withdraw(i) {
    if (team.length >= TEAM) return message(api.t('box_full'));
    team = [...team, i];
    save();
    await slideParty(true);
    drawIcons();
    drawData();
    setTimeout(async () => {
      await slideParty(false);
      drawHand();
    }, api.reduced() ? 0 : 500);
  }
  function deposit(k) {
    team = team.filter((_, j) => j !== k);
    save();
    drawIcons();
    draw();
  }

  function choose() {
    const i = pointed();
    if (area === 'box' && i !== null) {
      message(api.t('box_selected').replace('{name}', projects[i].name));
      return ask([['box_withdraw', () => withdraw(i)], ['box_summary', () => openSummary(i)], ['box_cancel', () => {}]]);
    }
    if (area === 'buttons' && pos === 0) {
      return slideParty(true).then(() => {
        [area, pos] = ['party', 0];
        draw();
      });
    }
    if (area === 'buttons' && pos === 1) return leave();
    if (area === 'party' && pos === TEAM) return hideParty();
    if (area === 'party' && i !== null) {
      message(api.t('box_selected').replace('{name}', projects[i].name));
      return ask([['box_deposit', () => deposit(pos)], ['box_summary', () => openSummary(i)], ['box_cancel', () => {}]]);
    }
  }
  function hideParty() {
    return slideParty(false).then(() => {
      [area, pos] = ['buttons', 0];
      draw();
    });
  }
  function leave() {
    busy = true;
    el.classList.add('to-black');
    setTimeout(close, api.reduced() ? 0 : FADE);
  }

  drawIcons();
  draw();

  return {
    el,
    focus: () => menu?.list.focus(),
    refresh() {
      team = (api.store.get('team', []) || []).filter((i) => projects[i]);
      drawIcons();
      draw();
    },
    button(name, down) {
      if (!down || busy) return;
      if (menu) {
        if (name === 'b') {
          api.sfx('select');
          return menu.done();
        }
        return menu.list.button(name);
      }
      if (name === 'a') {
        api.sfx('select');
        return choose();
      }
      if (name === 'b') {
        api.sfx('select');
        return area === 'party' ? hideParty() : leave();
      }
      move(name);
    },
  };
}
