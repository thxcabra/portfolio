// The PC's Box (pokemon_storage_system*.c), with the projects as its Pokémon: the Poké Ball background
// scrolling half a pixel a frame, PKMN DATA on the left (the pointed project's picture at 8,16 and its
// lines below), the FOREST wallpaper with the box name, the 6×5 grid (icons centred on 100+24c, 44+24r)
// and the hand cursor above it, PARTY POKéMON and CLOSE BOX at the top. A on a project: LEVAR (it joins
// the team, up to 6), RESUMO or CANCELAR; PARTY POKéMON drops the team panel (20 frames, 8px each,
// SE_WIN_OPEN), where A gives DEVOLVER / RESUMO / CANCELAR. The hand glides between spots and carries
// the projects the way the game moves Pokémon. The team is saved in the browser.
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
// A team member's icon in the panel (CreatePartyMonsSprites), as its centre on the screen.
const partyAt = (k) => (k === 0 ? [104, 64] : [152, 16 + 24 * (k - 1)]);
// UpdateCursorPos keeps the gliding hand on the screen: past an edge it comes back in from the other.
const wrapped = (v, lo, hi) => (v > hi ? v - 192 : v < lo ? v + 192 : v);

export function createBox({ api, widths, data, say, openSummary, close }) {
  const L = (o) => o[api.lang()] ?? o.pt;
  const projects = data.projects;
  const load = () => (api.store.get('team', []) || []).filter((i) => Number.isInteger(i) && projects[i]).slice(0, TEAM);
  let team = load();
  let area = 'box', pos = 0, menu = null, busy = false, notice = false;
  let held = null;           // the project in the hand
  let slots = team.length;   // party slots drawn filled (UpdatePartySlotColors)
  let saved = 0, prev = 1;   // SaveCursorPos; cursorPrevPartyPos
  let gen = 0;               // the glide in progress
  const hand = { x: 100, y: 32, y2: 0, flip: false, anim: 'bounce', shadow: true };

  const el = document.createElement('div');
  el.className = 'box full';
  el.innerHTML = `<i class="box-scroll"></i><img class="box-wall" src="assets/box/wallpaper.png" alt="">
    <img class="layer" src="assets/box/menu.png" alt="">
    ${html(api.t('box_title'), 160 - Math.floor(textWidth(api.t('box_title'), widths) / 2), 21, 'box-title')}
    <i class="box-shadow"></i><div class="box-icons"></div>
    <img class="box-mon" src="${monPath(projects[0].dex, { form: projects[0].form })}" alt=""><div class="box-data"></div>
    <div class="box-party"><img src="assets/box/party.png" alt=""><div class="box-slots"></div></div>
    <i class="box-close"></i><img class="box-icon box-held" src="${iconPath(projects[0])}" alt="" hidden><i class="box-hand"></i><div class="box-msg"></div>`;
  const $ = (s) => el.querySelector(s);
  const save = () => api.store.set('team', team);
  // One game frame; none with reduced motion, so every move happens at once.
  const tick = () => (api.reduced() ? Promise.resolve() : new Promise((r) => setTimeout(r, 1000 / FPS)));

  function drawIcons() {
    $('.box-icons').innerHTML = projects.map((p, i) => (team.includes(i) || i === held ? '' : `<img class="box-icon" data-i="${i}" src="${iconPath(p)}" alt="${esc(p.name)}" style="left:${84 + 24 * (i % COLS)}px;top:${28 + 24 * Math.floor(i / COLS)}px">`)).join('');
    // The leader's slot is always drawn filled; the other five show whether someone is there.
    $('.box-slots').innerHTML = Array.from({ length: TEAM - 1 }, (_, k) => `<img src="assets/box/slot-${k + 1 < slots ? 'filled' : 'empty'}.png" alt="" style="left:56px;top:${8 + 24 * k}px">`).join('')
      + team.map((i, k) => {
        const [x, y] = partyAt(k);
        return `<img class="box-icon" data-k="${k}" src="${iconPath(projects[i])}" alt="${esc(projects[i].name)}" style="left:${x - 80 - 16}px;top:${y - 16}px">`;   // the panel is at x 80
      }).join('');
  }

  // The project under the hand: in the box (if it isn't in the team) or in the team panel.
  const pointed = () => {
    if (area === 'box') return pos < projects.length && !team.includes(pos) ? pos : null;
    if (area === 'party') return team[pos] ?? null;
    return null;
  };

  function drawData() {
    const i = held ?? pointed(), mon = $('.box-mon');   // TrySetDisplayMonData: the one in the hand first
    mon.hidden = i === null;
    if (i === null) return void ($('.box-data').innerHTML = '');
    const p = projects[i];
    mon.src = monPath(p.dex, { form: p.form });
    $('.box-data').innerHTML = html(p.name, 6, 88) + html(`/${p.pokemon}`, 6, 102) + html(String(p.year), 10, 116) + html(L(p.kind), 6, 132, 'small');
  }

  // The hand (y2: how far it has come down to grab), its shadow 20px under it (SpriteCB_CursorShadow,
  // which ignores y2) and the project it carries, 4px under its centre (SpriteCB_HeldMon).
  function drawHand() {
    const h = $('.box-hand');
    Object.assign(h.style, { left: `${hand.x - 16}px`, top: `${hand.y + hand.y2 - 16}px` });
    h.dataset.anim = hand.anim;
    h.classList.toggle('flip', hand.flip);
    Object.assign($('.box-shadow').style, { left: `${hand.x - 8}px`, top: `${hand.y + 12}px` });
    $('.box-shadow').hidden = !hand.shadow;
    Object.assign($('.box-held').style, { left: `${hand.x - 16}px`, top: `${hand.y + hand.y2 + 4 - 16}px` });
  }
  function hold(i) {
    held = i;
    const img = $('.box-held');
    img.hidden = i === null;
    if (i !== null) img.src = iconPath(projects[i]);
  }

  // DoCursorNewPosUpdate: the shadow only shows in the box (under the icons), the data is the new spot's.
  function arrive() {
    [hand.x, hand.y] = handAt(area, pos);
    hand.flip = area === 'buttons';
    if (area === 'box') hand.shadow = true;
    drawHand();
    drawData();
    $('.box-close').classList.toggle('on', area === 'buttons' && pos === 1);
  }
  // SetCursorPosition + UpdateCursorPos: the hand glides to the spot in 6 frames (12 when it wraps around
  // an edge), in 1/256 px, and turns upside down halfway when it goes to or leaves the top buttons. FireRed
  // starts every move with CURSOR_ANIM_STILL and leaves it still on arrival (Emerald bounces again).
  // A press while it glides sends it on from where it is, instead of being lost.
  async function glide(wrap = [0, 0]) {
    const me = ++gen;
    const [tx, ty] = handAt(area, pos);
    const steps = wrap[0] || wrap[1] ? 12 : 6;
    const sx = Math.trunc(((tx + 192 * wrap[0] - hand.x) * 256) / steps), sy = Math.trunc(((ty + 192 * wrap[1] - hand.y) * 256) / steps);
    let nx = hand.x * 256, ny = hand.y * 256;
    if (held === null) hand.anim = 'still';
    if (area !== 'box') hand.shadow = false;
    drawHand();
    for (let k = 1; k < steps; k++) {
      await tick();
      if (me !== gen) return;
      nx += sx;
      ny += sy;
      hand.x = wrapped(nx >> 8, 64, 256);
      hand.y = wrapped(ny >> 8, -16, 176);
      if (k === steps / 2) hand.flip = area === 'buttons';
      drawHand();
    }
    await tick();
    if (me === gen) arrive();
  }
  // Stops a glide where it was going, before the hand does something else.
  function settle() {
    ++gen;
    arrive();
  }

  // MonPlaceChange_MoveCursorDown/Up: 1px a frame; the frame that finds the hand there ends the step.
  async function lower(to) {
    for (;;) {
      await tick();
      if (hand.y2 === to) return;
      hand.y2 += Math.sign(to - hand.y2);
      drawHand();
    }
  }
  // MonPlaceChange_Grab: the hand opens, comes down 8px, closes on the icon and lifts it.
  async function grab(take) {
    hand.anim = 'open';
    drawHand();
    await lower(8);
    hand.anim = 'fist';
    take();
    drawHand();
    drawData();
    await lower(0);
    await tick();
  }
  // MonPlaceChange_Place: down 8px with the icon, the hand opens and leaves it, goes up and bounces.
  async function place(put) {
    await lower(8);
    hand.anim = 'open';
    put();
    drawHand();
    drawData();
    await lower(0);
    hand.anim = 'bounce';
    drawHand();
  }

  // ShowPartyMenu / HidePartyMenu: the team panel hangs above the screen and moves 8px a frame for 20 frames.
  async function slideParty(down) {
    api.sfx(down ? 'win_open' : 'select');   // SetUpDoShowPartyMenu; Task_HidePartyPokemon
    if (down) prev = 1;
    const panel = $('.box-party');
    for (let k = 1; k <= 20; k++) {
      await tick();
      panel.style.top = `${down ? 8 * k - 160 : -8 * k}px`;
    }
  }
  // Task_ShowPartyPokemon (ClearSavedCursorPos first) and Task_HidePartyPokemon (back to the saved spot).
  async function showParty() {
    busy = true;
    settle();
    saved = 0;
    await slideParty(true);
    [area, pos] = ['party', 0];
    await glide();
    busy = false;
  }
  async function hideParty() {
    busy = true;
    settle();
    await slideParty(false);
    [area, pos] = ['box', saved];
    await glide();
    busy = false;
  }

  function message(str) {
    $('.box-msg').innerHTML = '';
    if (!str) return;
    const box = win(8, 136, 224, 16, 'std');
    box.append(text(str, 0, 1));
    $('.box-msg').append(box);
  }

  // HandleInput_InBox / _InParty / _BoxTitle / _OnButtons: where each direction goes. Down from the last
  // row and up from the buttons wrap around the screen's edge, as do ←/→ at the ends of a row.
  function move(name) {
    const d = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[name];
    if (!d) return;
    let next = null, wrap = [0, 0];
    if (area === 'box') {
      const c = pos % COLS, r = Math.floor(pos / COLS);
      if (d[0]) {
        if (c + d[0] < 0 || c + d[0] >= COLS) wrap = [d[0], 0];
        next = ['box', r * COLS + ((c + d[0] + COLS) % COLS)];
      } else if (r + d[1] < 0) next = ['title', 0];
      else if (r + d[1] >= ROWS) {
        next = ['buttons', Math.floor(c / 3)];
        wrap = [0, 1];
      } else next = ['box', pos + d[1] * COLS];
    } else if (area === 'title') {
      if (d[1]) next = d[1] < 0 ? ['buttons', 0] : ['box', 2];
    } else if (area === 'buttons') {
      if (d[0]) next = ['buttons', pos ? 0 : 1];
      else if (d[1] > 0) next = ['title', 0];
      else {
        next = ['box', ROWS * COLS - (pos ? 1 : 6)];
        wrap = [0, -1];
      }
    } else if (area === 'party') {
      if (d[1]) next = ['party', (pos + d[1] + TEAM + 1) % (TEAM + 1)];
      else if (d[0] < 0 && pos) {
        prev = pos;
        next = ['party', 0];
      } else if (d[0] > 0) {
        if (pos) return hideParty();
        next = ['party', prev];
      }
    }
    if (!next || (next[0] === area && next[1] === pos)) return;
    [area, pos] = next;
    api.sfx('select');
    glide(wrap);
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

  // Task_WithdrawMon: the hand takes the project, the panel drops, the hand carries it to the first free
  // slot (SetCursorInParty) and leaves it, the slot turns filled, then Task_HidePartyPokemon: the panel goes
  // up and the hand goes back where it was. A full team only gets the message.
  async function withdraw() {
    if (team.length >= TEAM) {
      notice = true;   // MSG_PARTY_FULL: the next A, B or direction clears it
      return message(api.t('box_full'));
    }
    busy = true;
    settle();
    saved = pos;
    await grab(() => {
      hold(pos);
      $(`.box-icons [data-i="${pos}"]`)?.remove();
    });
    await slideParty(true);
    [area, pos] = ['party', team.length];
    await glide();
    await place(() => {
      team = [...team, held];
      hold(null);
      save();
      drawIcons();
    });
    slots = team.length;
    drawIcons();
    await hideParty();
  }

  // DEVOLVER: Task_DepositMenu with the one Box there is, moved the way LEVAR moves: the hand takes the
  // project from the team, the panel goes up (the team closes the gap, CompactPartySlots), the hand puts it
  // back in its own slot (its number), the panel drops again and the hand goes back to the team.
  async function deposit() {
    busy = true;
    settle();
    const k = pos;
    await grab(() => {
      hold(team[k]);
      team = team.filter((_, j) => j !== k);
      save();
      $(`.box-slots [data-k="${k}"]`)?.remove();
    });
    await slideParty(false);
    slots = team.length;
    drawIcons();
    [area, pos] = ['box', held];
    await glide();
    await place(() => {
      hold(null);
      drawIcons();
    });
    await slideParty(true);
    [area, pos] = ['party', k];
    await glide();
    hand.anim = 'bounce';   // ResetSelectionAfterDeposit
    drawHand();
    busy = false;
  }

  function choose() {
    const i = pointed();
    if (area === 'box' && i !== null) {
      api.sfx('select');
      message(api.t('box_selected').replace('{name}', projects[i].name));
      return ask([['box_withdraw', withdraw], ['box_summary', () => openSummary(i)], ['box_cancel', () => {}]]);
    }
    if (area === 'buttons' && pos === 0) return showParty();
    if (area === 'buttons' && pos === 1) {
      api.sfx('select');
      return leave();
    }
    if (area === 'party' && pos === TEAM) return hideParty();
    if (area === 'party' && i !== null) {
      api.sfx('select');
      message(api.t('box_selected').replace('{name}', projects[i].name));
      return ask([['box_deposit', deposit], ['box_summary', () => openSummary(i)], ['box_cancel', () => {}]]);
    }
  }
  function leave() {
    busy = true;
    el.classList.add('to-black');
    setTimeout(close, api.reduced() ? 0 : FADE);
  }

  // What is under a click, as a spot for the hand: the Box's grid and top buttons, or the panel's slots.
  function spot(x, y) {
    if (area === 'party') {
      if (x >= 80 && x < 128 && y >= 48 && y < 88) return ['party', 0];
      if (x >= 128 && x < 176 && y >= 8 && y < 128) return ['party', 1 + Math.floor((y - 8) / 24)];
      return x >= 128 && x < 176 && y >= 128 && y < 156 ? ['party', TEAM] : null;
    }
    if (y < 16) return x >= 80 && x < 152 ? ['buttons', 0] : x >= 168 ? ['buttons', 1] : null;
    const c = Math.floor((x - 88) / 24), r = Math.floor((y - 32) / 24);
    return c >= 0 && c < COLS && r >= 0 && r < ROWS ? ['box', r * COLS + c] : null;
  }
  // The mouse: a click on a slot sends the hand there (SE_SELECT) and a click on the one it points at is
  // A; PARTY POKéMON, CLOSE BOX and CANCEL work at once. The choice windows take their own clicks.
  el.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || busy || menu) return;
    if (notice) return dismiss();
    const r = el.getBoundingClientRect();
    const at = spot(((e.clientX - r.left) / r.width) * 240, ((e.clientY - r.top) / r.height) * 160);
    if (!at) return;
    const here = at[0] === area && at[1] === pos;
    [area, pos] = at;
    if (here || at[0] === 'buttons' || at[1] === TEAM) return choose();
    api.sfx('select');
    glide();
  });
  function dismiss() {
    notice = false;
    message('');
  }

  drawIcons();
  arrive();

  return {
    el,
    focus: () => menu?.list.focus(),
    refresh() {
      team = load();
      slots = team.length;
      drawIcons();
      drawData();
    },
    // What A and B do right now, for the words next to them on the console.
    keys() {
      if (notice) return { a: 'act_next', b: 'act_next' };
      if (menu) return { a: 'act_choose', b: 'act_back' };
      if (area === 'buttons') return { a: pos ? 'act_close' : 'act_open', b: 'act_back' };
      if (area === 'party' && pos === TEAM) return { a: 'act_back', b: 'act_back' };
      return { a: pointed() === null ? null : 'act_choose', b: 'act_back' };
    },
    button(name, down) {
      if (!down || busy) return;
      if (notice) {
        if (name === 'a' || name === 'b' || ['up', 'down', 'left', 'right'].includes(name)) dismiss();
        return;
      }
      if (menu) {
        if (name === 'b') {
          api.sfx('select');
          return menu.done();
        }
        return menu.list.button(name);
      }
      if (name === 'a') return choose();
      if (name === 'b') {
        if (area === 'party') return hideParty();
        api.sfx('select');
        return leave();
      }
      move(name);
    },
  };
}
