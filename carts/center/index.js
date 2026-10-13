// Cartridge 1: the Pokémon Center. Title screen first, then the room you walk around in, with the
// START menu and the screens it opens stacked on top of it.
import { createWorld, BEHAVIOR } from './world.js';
import { createDialog } from './dialog.js';
import { createTitle } from './title.js';
import { createIntro } from './intro.js';
import { createStack, win, text } from './ui.js';
import { route, textWidth } from '../../logic.js';
import { createMenu } from './screens/menu.js';
import { createOptions } from './screens/options.js';
import { createContact } from './screens/contact.js';
import { createDex } from './screens/dex.js';
import { createSummary } from './screens/summary.js';
import { createCard } from './screens/card.js';
import { createAsk } from './screens/ask.js';
import { createBag } from './screens/bag.js';
import { createTm } from './screens/tm.js';
import { createBox } from './screens/box.js';
import { DATA } from '../../data.js';

const VOICE = { nurse: 'female', gentleman: 'male', boy: 'male', youngster: 'male' };   // by the game's gender table
const SCREENS = {   // menu id -> (n) => screen; the ones not built yet say "coming soon"
  projetos: (n) => createDex({ api, widths, projects: DATA.projects, start: n ? n - 1 : 0, open: openProject, close: () => stack.pop() }),
  opcoes: () => createOptions({ api, setFrame, close: () => stack.pop() }),
  sobre: () => createCard({ api, widths, data: DATA, say, close: () => stack.pop() }),
  experiencia: () => createBag({ api, widths, data: DATA, say, close: () => stack.pop() }),
  habilidades: () => createTm({ api, widths, data: DATA, say, close: () => stack.pop() }),
  contato: () => createContact({ api, widths, contact: DATA.contact, say, close: () => stack.pop() }),
};

let api = null;
let screen = null;
let map = null;
let widths = null;
let world = null;
let dialog = null;
let stack = null;
let hint = null;
let titleScreen = null;
let intro = null;
let mode = 'off';   // off | title | loading | world
let healing = false;   // the machine is running: nothing else happens

const json = async (url) => (await fetch(url)).json();

// The window frame chosen in OPÇÕES (the game's 10 types); the message box keeps its own.
function setFrame(n) {
  api.store.set('frame', n);
  screen.style.setProperty('--frame', `url(assets/ui/frame-${n}.png)`);
}

// First visit in this browser session: the GAME FREAK scene, then the title's entrance. Afterwards (or
// with reduced motion) straight to the ready title. The title's art loads while the scene plays.
const TITLE_ART = ['back', 'bars', 'press', 'charizard', 'logo', 'flames', 'lit', 'slash'];
function title() {
  mode = 'title';
  let first = true;
  try {
    first = !sessionStorage.getItem('booted');
    sessionStorage.setItem('booted', '1');
  } catch { /* no session storage: play it every time */ }
  if (!first || api.reduced()) {
    titleScreen = createTitle(screen, { reduced: api.reduced() });
    api.music('mus_title');
    return;
  }
  mode = 'intro';
  TITLE_ART.forEach((n) => { new Image().src = `assets/title/${n}.png`; });
  intro = createIntro(screen, {
    onStar: () => api.music('mus_game_freak'),
    onDone() {
      intro = null;
      mode = 'title';
      titleScreen = createTitle(screen, { reduced: false, entrance: true });
      api.music('mus_title');   // title_screen.c: MUS_TITLE when the scene starts
    },
  });
}

// Any button during the opening goes straight to the ready title, as A/START/SELECT do in the game.
function skipOpening() {
  if (intro) {
    intro.stop();
    intro = null;
    mode = 'title';
    titleScreen = createTitle(screen, { reduced: api.reduced() });
    api.music('mus_title');
    return true;
  }
  if (mode === 'title' && titleScreen.entering) {
    titleScreen.skip();
    return true;
  }
  return false;
}

// The room stands still while a message or any screen is up; the address shows the open screen.
function sync() {
  world.freeze(dialog.open || stack.size > 0 || healing);
  screen.firstElementChild.classList.toggle('talking', dialog.open);
  api.link(stack.path());
  hint.hidden = stack.size > 0 || dialog.open || api.store.get('menuUsed', false);
}

// What A and B do right now, for the words next to them on the console (api.keys): the top screen
// says it for itself, the default is a list's.
function keys() {
  if (mode === 'intro' || (mode === 'title' && titleScreen.entering)) return { a: 'act_skip', b: 'act_skip' };
  if (mode === 'title') return { a: 'act_start', b: null };
  if (mode !== 'world' || healing) return null;
  if (dialog.open) return { a: 'act_next', b: 'act_next' };
  if (stack.size) return stack.top.keys?.() ?? { a: 'act_choose', b: 'act_back' };
  return { a: 'act_talk', b: 'act_run' };
}
// Asked every frame: the screens change what A and B do on their own too (a flip ends, the hand arrives).
let raf = 0;
const watchKeys = () => {
  api.keys(keys());
  raf = requestAnimationFrame(watchKeys);
};

function say(pages, done, voice = '') {
  dialog.say(pages, () => {
    sync();
    done?.();
  }, voice);
  sync();
}

function openMenu(start) {
  api.sfx('win_open');
  stack.push(createMenu({
    api, widths, start,
    choose: openScreen,
    close: () => {
      api.sfx('select');
      stack.pop();
    },
  }));
}

// Until the player opens the menu by themselves, a small window in the corner says how.
function makeHint(root) {
  const label = api.t('hint');
  const w = Math.ceil((8 + textWidth(label, widths)) / 8) * 8;
  const el = win(8, 8, w, 16, 'hint');
  el.append(text(label, Math.floor((w - textWidth(label, widths)) / 2), 1));
  el.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    e.stopPropagation();   // not a click on the room
    useMenu();
  });
  root.append(el);
  return el;
}

function useMenu() {
  api.store.set('menuUsed', true);
  openMenu();
}

function openScreen(id, n = null) {
  if (!SCREENS[id]) return say(api.talk('soon'));
  stack.push(SCREENS[id](n));
  if (id === 'projetos' && n) openProject(n - 1);
}

// A project's page over the list (↑/↓ on it move the list's cursor too) or over the PC's Box.
function openProject(i) {
  const below = stack.top;
  stack.push(createSummary({
    api, widths, data: DATA, index: i, say,
    onIndex(j) {
      if (below?.path === 'projetos') below.index = j;
      sync();
    },
    close: () => stack.pop(),
  }));
}

// CURAR (pkmn_center_nurse.inc, FLDEFF_POKECENTER_HEAL): she turns to the machine, one ball per team
// member lands on it every 25 frames (SE_BALL), 32 frames later the jingle starts and the monitor
// flickers, the balls flash (96 + 24 frames) and go after 30 more; when the jingle is over she turns
// back, thanks you and bows (8 frames up, 32 bowed, 8 up).
const FRAME = 1000 / 59.7275;
const wait = (frames) => new Promise((r) => setTimeout(r, api.reduced() ? 0 : frames * FRAME));
const BALL_AT = [[0, 0], [6, 0], [0, 4], [6, 4], [0, 8], [6, 8]];   // sPokeballCoordOffsets, from (93, 36)
// FldEff_PokecenterHeal's (93, 36) and (128, 24) are screen spots with the camera on the player at the
// counter, and field_camera.c scrolls the map 8px further down than our fixed room: 8px up here.
const CAMERA_Y = 8;
async function healMachine(n) {
  const fx = document.createElement('div');
  fx.className = 'heal';
  screen.firstElementChild.append(fx);
  const balls = [];
  for (let k = 0; k < n; k++) {
    if (k) await wait(25);
    const b = Object.assign(document.createElement('i'), { className: 'heal-ball' });
    Object.assign(b.style, { left: `${89 + BALL_AT[k][0]}px`, top: `${32 - CAMERA_Y + BALL_AT[k][1]}px` });
    fx.append(b);
    balls.push(b);
    api.sfx('ball');
  }
  await wait(32);
  const jingle = api.fanfare('mus_heal');
  const monitor = Object.assign(document.createElement('i'), { className: 'heal-monitor' });
  fx.append(monitor);
  (async () => {
    for (let loop = 0; loop < 4; loop++) {
      for (const [f, d] of [[1, 5], [2, 5], [3, 7], [2, 5], [1, 5], [0, 5]]) {
        monitor.style.backgroundPosition = `0 ${-16 * f}px`;
        await wait(d);
      }
    }
    monitor.remove();
  })();
  const flash = (row) => balls.forEach((b) => { b.style.backgroundPosition = `0 ${-8 * row}px`; });
  for (let i = 0; i < 12; i++) {   // the first three flashes: entries a phase apart
    flash(i % 4);
    await wait(8);
  }
  for (let c = 0; c < 3; c++) {    // the last one: all together
    flash(4 + c);
    await wait(8);
  }
  flash(7);
  await wait(30);
  balls.forEach((b) => b.remove());
  await jingle;
  fx.remove();
}

async function heal() {
  const team = api.store.get('team', []) || [];
  if (!team.length) return say(api.talk('heal_empty'), null, 'female');
  say(api.talk('heal_take'), async () => {
    healing = true;
    sync();
    world.pose('nurse', 'left');
    await wait(8);
    await healMachine(Math.min(6, team.length));
    world.pose('nurse', 'down');
    healing = false;
    say(api.talk('heal_done'), async () => {
      healing = true;
      sync();
      await wait(8);
      world.pose('nurse', 'down', 3);
      await wait(32);
      world.pose('nurse', 'down');
      await wait(8);
      healing = false;
      say(api.talk('nurse_bye'), null, 'female');
    }, 'female');
  }, 'female');
}

// The Nurse greets, then asks what she can do; each answer takes her question away first.
function nurse() {
  const then = (fn) => () => {
    stack.pop();
    fn();
  };
  say(api.talk('nurse'), () => stack.push(createAsk({
    api, widths, question: api.talk('nurse_ask')[0], voice: 'female',
    items: [
      { label: api.t('nurse_heal'), run: then(heal) },
      { label: api.t('nurse_about'), run: then(() => openScreen('sobre')) },
      { label: api.t('menu_contato'), run: then(() => openScreen('contato')) },
      { label: api.t('nurse_bye'), run: then(() => say(api.talk('nurse_bye'), null, 'female')) },
    ],
  })), 'female');
}

const THINGS = { [BEHAVIOR.REGION_MAP]: 'board', [BEHAVIOR.BOOKSHELF]: 'shelf' };
function interact(target) {
  if (target.behavior === BEHAVIOR.PC) {
    api.sfx('pc_on');   // the PC plays its own sound instead of SE_SELECT
    return say(api.talk('pc'), () => stack.push(createBox({ api, widths, data: DATA, say, openSummary: openProject, close: () => stack.pop() })));
  }
  const key = target.person ?? THINGS[target.behavior];
  if (!key) return;   // nothing there: no sound, like the game
  api.sfx('select');   // A on someone or something (field_control_avatar.c)
  if (key === 'nurse') return nurse();
  if (key === 'board') return say(api.talk('board'), () => openScreen('experiencia'));
  if (key === 'gentleman') return say(api.talk('gentleman'), () => openScreen('habilidades'), VOICE.gentleman);
  say(api.talk(key), null, VOICE[key]);
}

// The stairs and the way out are hooks for later: the minigames room and the town.
function blocked(to, dir, from) {
  if (map.behavior[to.y]?.[to.x] === BEHAVIOR.STAIRS) {
    say(api.talk('stairs'));
    return true;
  }
  if (dir === 'down' && map.behavior[from.y]?.[from.x] === BEHAVIOR.DOOR_MAT) {
    say(api.talk('door'));
    return true;
  }
  return false;
}

async function enter({ fromTitle = true } = {}) {
  if (mode !== 'title') return;
  mode = 'loading';
  const loaded = Promise.all([map ?? json('assets/world/center.json'), widths ?? json('assets/font/widths.json')]);
  if (fromTitle) {
    api.cry(6);   // the title's Charizard
    setTimeout(() => api.fadeOutMusic(64 / 59.7275), api.reduced() ? 0 : 90000 / 59.7275);   // FadeOutBGM(4) with the white fade
    await titleScreen.leave();
  }
  titleScreen.stop();
  [map, widths] = await loaded;
  screen.innerHTML = '<div class="world"></div>';
  const root = screen.firstElementChild;
  world = createWorld(root, map, { interact, blocked, bump: () => api.sfx('bump') });
  stack = createStack(root, { onChange: sync, outside: () => (dialog.open ? dialog.advance() : stack.button('b', true)) });
  dialog = createDialog(root, api);
  hint = makeHint(root);
  mode = 'world';
  api.music('mus_poke_center');
  sync();
  if (fromTitle && !api.store.get('welcomed', false)) {
    setTimeout(() => {
      if (mode === 'world' && !dialog.open && !stack.size) say(api.talk('nurse_welcome'), () => {
        api.store.set('welcomed', true);
        openMenu(0);
      }, 'female');
    }, api.reduced() ? 0 : 500);
  }
}

export default {
  start(el, a) {
    screen = el;
    api = a;
    setFrame(api.store.get('frame', 1));
    title();
    watchKeys();
  },
  stop() {
    cancelAnimationFrame(raf);
    api.keys(null);
    intro?.stop();
    titleScreen?.stop();
    world?.stop();
    world = null;
    dialog = null;
    stack = null;
    mode = 'off';
    screen.innerHTML = '';
  },
  button(name, down) {
    if (mode === 'intro') {
      if (down) skipOpening();
      return;
    }
    if (mode === 'title') {
      if (down && skipOpening()) return;
      if (down && (name === 'start' || name === 'a')) enter();
      return;
    }
    if (mode !== 'world' || healing) return;
    if (dialog.open) {
      if (down && (name === 'a' || name === 'b')) dialog.advance();
      return;
    }
    if (stack.size) return stack.button(name, down);
    if (down && name === 'start') return useMenu();
    world.button(name, down);
  },
  pointer(x, y) {
    if (mode === 'intro' || (mode === 'title' && titleScreen.entering)) return void skipOpening();
    if (mode === 'title') return enter();
    if (mode !== 'world' || healing) return;
    if (dialog.open) return dialog.advance();
    if (stack.size) return;   // the screens take their own clicks
    world.pointer(x, y);
  },
  // A link (#/contato) opens its screen straight away: no title, no welcome, B goes to the room.
  async open(path) {
    const r = route(path, DATA.projects.length);
    skipOpening();
    if (mode === 'title') await enter({ fromTitle: false });
    if (mode !== 'world') return;
    stack.clear();
    if (r) openScreen(r.screen, r.n);
  },
};
