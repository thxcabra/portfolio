// Cartridge 1: the Pokémon Center. Title screen first, then the room you walk around in.
import { createWorld, BEHAVIOR } from './world.js';
import { createDialog } from './dialog.js';
import { createTitle } from './title.js';

let api = null;
let screen = null;
let map = null;
let world = null;
let dialog = null;
let titleScreen = null;
let mode = 'off';   // off | title | loading | world

function title() {
  mode = 'title';
  titleScreen = createTitle(screen, { reduced: api.reduced() });
}

function say(pages, done) {
  world.freeze(true);
  dialog.say(pages, () => {
    world.freeze(false);
    done?.();
  });
}

function interact(target) {
  if (target.person) return say(api.talk(target.person));
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
  map ??= await (await fetch('assets/world/center.json')).json();
  screen.innerHTML = '<div class="world"></div>';
  const root = screen.firstElementChild;
  world = createWorld(root, map, { interact, blocked, bump: () => api.sfx('bump') });
  dialog = createDialog(root, api);
  mode = 'world';
  if (!api.store.get('welcomed', false)) {
    setTimeout(() => {
      if (mode === 'world' && !dialog.open) say(api.talk('nurse_welcome'), () => api.store.set('welcomed', true));
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
    world.button(name, down);
  },
  pointer(x, y) {
    if (mode === 'title') return enter();
    if (mode !== 'world') return;
    if (dialog.open) return dialog.advance();
    world.pointer(x, y);
  },
  open() {},   // the shortcuts bar (projects / about / contact) arrives in phase 3
};
