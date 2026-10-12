// Cartridge 1: the Pokémon Center. Title screen first, then the room you walk around in, with the
// START menu and the screens it opens stacked on top of it.
import { createWorld, BEHAVIOR } from './world.js';
import { createDialog } from './dialog.js';
import { createTitle } from './title.js';
import { createStack, win, text } from './ui.js';
import { textWidth } from '../../logic.js';
import { createMenu } from './screens/menu.js';

const VOICE = { nurse: 'female', gentleman: 'male', boy: 'male', youngster: 'male' };   // by the game's gender table
const SCREENS = {};   // menu id -> () => screen; the ones not built yet say "coming soon"

let api = null;
let screen = null;
let map = null;
let widths = null;
let world = null;
let dialog = null;
let stack = null;
let hint = null;
let titleScreen = null;
let mode = 'off';   // off | title | loading | world

const json = async (url) => (await fetch(url)).json();

function title() {
  mode = 'title';
  titleScreen = createTitle(screen, { reduced: api.reduced() });
}

// The room stands still while a message or any screen is up; the address shows the open screen.
function sync() {
  world.freeze(dialog.open || stack.size > 0);
  screen.firstElementChild.classList.toggle('talking', dialog.open);
  api.link(stack.path());
  hint.hidden = stack.size > 0 || dialog.open || api.store.get('menuUsed', false);
}

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

function openScreen(id) {
  if (!SCREENS[id]) return say(api.talk('soon'));
  stack.push(SCREENS[id]());
}

function interact(target) {
  if (target.person) return say(api.talk(target.person), null, VOICE[target.person]);
  if (target.behavior === BEHAVIOR.PC) {
    api.sfx('pc_on');
    return say(api.talk('pc'));
  }
  if (target.behavior === BEHAVIOR.REGION_MAP) return say(api.talk('board'));
  if (target.behavior === BEHAVIOR.BOOKSHELF) return say(api.talk('shelf'));
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

async function enter() {
  if (mode !== 'title') return;
  mode = 'loading';
  api.sfx('select');
  titleScreen.stop();
  [map, widths] = await Promise.all([map ?? json('assets/world/center.json'), widths ?? json('assets/font/widths.json')]);
  screen.innerHTML = '<div class="world"></div>';
  const root = screen.firstElementChild;
  world = createWorld(root, map, { interact, blocked, bump: () => api.sfx('bump') });
  stack = createStack(root, { onChange: sync, outside: () => (dialog.open ? dialog.advance() : stack.button('b', true)) });
  dialog = createDialog(root, api);
  hint = makeHint(root);
  mode = 'world';
  sync();
  if (!api.store.get('welcomed', false)) {
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
    title();
  },
  stop() {
    titleScreen?.stop();
    world?.stop();
    world = null;
    dialog = null;
    stack = null;
    mode = 'off';
    screen.innerHTML = '';
  },
  button(name, down) {
    if (mode === 'title') {
      if (down && (name === 'start' || name === 'a')) enter();
      return;
    }
    if (mode !== 'world') return;
    if (dialog.open) {
      if (down && (name === 'a' || name === 'b')) dialog.advance();
      return;
    }
    if (stack.size) return stack.button(name, down);
    if (down && name === 'start') return useMenu();
    world.button(name, down);
  },
  pointer(x, y) {
    if (mode === 'title') return enter();
    if (mode !== 'world') return;
    if (dialog.open) return dialog.advance();
    if (stack.size) return;   // the screens take their own clicks
    world.pointer(x, y);
  },
  open() {},   // links arrive in Tarefa 9
};
