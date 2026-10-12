import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { DATA } from './data.js';
import {
  parseRoute, parent, spritePath, nextIndex, fitScale, coverScale, cycle, splitShown, pickNext,
  discPath, rrectPath, TYPES, SHAPES, DIRS, around, pathToAny, pageFits, esc,
} from './logic.js';

// routes
const R = (h) => parseRoute(h, { dex: 8, badges: 3 });
const at = (view, i = null) => ({ view, i });
assert.deepEqual(R(''), at('intro'));
assert.deepEqual(R('#/'), at('intro'));
assert.deepEqual(R('#/menu'), at('menu'));
assert.deepEqual(R('#/dex'), at('dex'));
assert.deepEqual(R('#/dex/3'), at('entry', 3));
assert.deepEqual(R('#/dex/8'), at('entry', 8));
assert.deepEqual(R('#/dex/9'), at('menu'));
assert.deepEqual(R('#/dex/0'), at('menu'));
assert.deepEqual(R('#/dex/abc'), at('menu'));
assert.deepEqual(R('#/dex/1.5'), at('menu'));
assert.deepEqual(R('#/badges'), at('badges'));
assert.deepEqual(R('#/badges/2'), at('badges', 2));
assert.deepEqual(R('#/badges/4'), at('menu'));
for (const v of ['card', 'moves', 'contact', 'options']) assert.deepEqual(R(`#/${v}`), at(v));
assert.deepEqual(R('#/foo'), at('menu'));
assert.deepEqual(R('#/menu/2'), at('menu'));

assert.equal(parent(at('entry', 2)), '#/dex');
assert.equal(parent(at('dex')), '#/menu');
assert.equal(parent(at('badges', 1)), '#/menu');
assert.equal(parent(at('menu')), null);
assert.equal(parent(at('intro')), null);

// sprites: always Emerald art
assert.equal(spritePath(6), 'assets/sprites/emerald/6.png');
assert.equal(spritePath(6, { shiny: true }), 'assets/sprites/emerald/shiny/6.png');
assert.equal(spritePath(250, { frame2: true }), 'assets/sprites/emerald/frame2/250.png');
assert.equal(spritePath(250, { shiny: true, frame2: true }), 'assets/sprites/emerald/shiny/frame2/250.png');
assert.equal(spritePath(6, { animated: true }), 'assets/sprites/emerald/animated/6.gif');
assert.equal(spritePath(250, { shiny: true, animated: true }), 'assets/sprites/emerald/animated/shiny/250.gif');

// cursor
assert.equal(nextIndex(-1, 5, 1, 0, 1), 0);
assert.equal(nextIndex(0, 5, 1, 0, -1), 0);
assert.equal(nextIndex(4, 5, 1, 0, 1), 4);
assert.equal(nextIndex(1, 5, 1, 1, 0), 2);
assert.equal(nextIndex(1, 8, 4, 0, 1), 5);
assert.equal(nextIndex(5, 8, 4, 0, -1), 1);
assert.equal(nextIndex(0, 3, 4, 0, 1), 0);

// scales: integer in physical pixels
assert.equal(fitScale(576, 320, 1888, 1048, 1), 3);
assert.equal(fitScale(576, 320, 1334, 736, 1), 2);
assert.equal(fitScale(240, 160, 358, 380, 3), 4 / 3);
assert.equal(fitScale(576, 320, 100, 100, 1), 1);
assert.equal(coverScale(240, 160, 1920, 1080, 1), 8);
assert.equal(coverScale(240, 160, 1366, 768, 1), 6);
assert.equal(coverScale(240, 160, 1440, 900, 2), 6);

// options
assert.equal(cycle(['pt', 'en'], 'pt'), 'en');
assert.equal(cycle(['pt', 'en'], 'en'), 'pt');
assert.equal(cycle([1, 2, 3], 1, -1), 3);
assert.equal(cycle([1, 2, 3], 9), 2);

// typing
assert.deepEqual(splitShown([3, 4], 0), [0, 0]);
assert.deepEqual(splitShown([3, 4], 2.7), [2, 0]);
assert.deepEqual(splitShown([3, 4], 5), [3, 2]);
assert.deepEqual(splitShown([3, 4], 99), [3, 4]);

// background clips
assert.equal(pickNext(-1, 1, 0.9), 0);
assert.equal(pickNext(0, 1, 0.5), 0);
assert.equal(pickNext(-1, 4, 0.99), 3);
for (let cur = 0; cur < 4; cur++) {
  for (const r of [0, 0.3, 0.6, 0.99]) {
    const n = pickNext(cur, 4, r);
    assert.ok(n !== cur && n >= 0 && n < 4, `pickNext(${cur}, 4, ${r}) = ${n}`);
  }
}

// pixel shapes
const widths = (d) => [...d.matchAll(/h(\d+)/g)].map((m) => +m[1]);
assert.deepEqual(widths(discPath(0, 0, 8)), [4, 6, 8, 8, 8, 8, 6, 4]);
assert.equal(rrectPath(0, 0, 10, 6), 'M2 0h6v1h-6zM2 5h6v1h-6zM1 1h8v1h-8zM1 4h8v1h-8zM0 2h10v2h-10z');
assert.equal(rrectPath(0, 0, 4, 2, []), 'M0 0h4v2h-4z');

// world: paths over the real Pokémon Center collision map
const here0 = (path) => new URL(path, import.meta.url);
const room = JSON.parse(readFileSync(here0('assets/world/center.json'), 'utf8'));
const walk = (x, y) => x >= 0 && y >= 0 && x < room.w && y < room.h && !room.walls[y][x];
assert.deepEqual(Object.keys(DIRS), ['up', 'down', 'left', 'right']);
assert.deepEqual(around({ x: 5, y: 5 }).map((g) => [g.x, g.y, g.face]), [[5, 6, 'up'], [5, 4, 'down'], [6, 5, 'left'], [4, 5, 'right']]);
assert.deepEqual(pathToAny(walk, { x: 7, y: 8 }, [{ x: 7, y: 8 }]), { steps: [], face: null });
assert.deepEqual(pathToAny(walk, { x: 7, y: 8 }, [{ x: 7, y: 4, face: 'up' }]), { steps: ['up', 'up', 'up', 'up'], face: 'up' });
assert.equal(pathToAny(walk, { x: 7, y: 8 }, [{ x: 7, y: 2 }]), null, 'behind the counter is unreachable');
const toPc = pathToAny(walk, { x: 7, y: 8 }, around({ x: 11, y: 1 }));
assert.equal(toPc.face, 'up');
assert.equal(toPc.steps.length, 10, 'shortest walk from the door to the PC');

// text that must fit the message box (2 lines, 208px in the game font)
const widthsOf = JSON.parse(readFileSync(here0('assets/font/widths.json'), 'utf8'));
assert.ok(pageFits('Olá!\nTudo bem?', widthsOf));
assert.ok(!pageFits('a\nb\nc', widthsOf));
assert.ok(!pageFits('x'.repeat(60), widthsOf));
assert.equal(esc('<a&"\n'), '&lt;a&amp;&quot;\n');

// --- content (data.js)
const here = (path) => new URL(path, import.meta.url);
const both = (o, w) => assert.ok(o?.pt?.trim() && o?.en?.trim(), `${w}: falta texto pt ou en`);
const url = (u, w) => assert.match(u, /^(https:\/\/|mailto:)/, `${w}: link precisa começar com https:// ou mailto: (${u})`);
const dex = (n, w) => {
  assert.ok(Number.isInteger(n) && n >= 1 && n <= 386, `${w}: dex ${n} fora de 1–386`);
  const variants = [{}, { shiny: true }, { frame2: true }, { shiny: true, frame2: true }, { animated: true }, { shiny: true, animated: true }];
  for (const o of variants) assert.ok(existsSync(here(spritePath(n, o))), `${w}: sprite não existe (${spritePath(n, o)})`);
  assert.ok(existsSync(here(`assets/cries/${n}.wav`)), `${w}: grito não existe (assets/cries/${n}.wav) — rode python tools/build_assets.py`);
};
const { trainer, projects, badges, moves, contact, ui } = DATA;

both(trainer.about, 'trainer.about');
dex(trainer.partner, 'trainer.partner');
assert.ok(Number.isInteger(trainer.since), 'trainer.since precisa ser um ano');

assert.ok(projects.length >= 1, 'precisa de pelo menos 1 projeto');
projects.forEach((p, i) => {
  const w = `projects[${i}] ${p.name}`;
  dex(p.dex, w);
  assert.ok(p.pokemon && p.name && p.year, `${w}: falta pokemon, name ou year`);
  assert.ok(p.types.length >= 1 && p.types.length <= 2 && p.types.every((x) => TYPES.includes(x)), `${w}: types inválidos (${p.types})`);
  assert.ok(Array.isArray(p.stack), `${w}: stack precisa ser lista`);
  both(p.text, w);
  Object.values(p.links || {}).forEach((u) => url(u, w));
});

assert.ok(badges.length <= 8, 'máximo de 8 insígnias');
badges.forEach((b, i) => {
  const w = `badges[${i}] ${b.name}`;
  assert.ok(SHAPES.includes(b.shape), `${w}: shape inválido (${b.shape})`);
  both(b.role, w);
  both(b.text, w);
});

moves.forEach((m, i) => {
  const w = `moves[${i}] ${m.name}`;
  assert.ok(TYPES.includes(m.type), `${w}: type inválido (${m.type})`);
  assert.ok(Number.isInteger(m.power) && Number.isInteger(m.pp), `${w}: power e pp precisam ser inteiros`);
  both(m.text, w);
});

contact.forEach((c, i) => url(c.url, `contact[${i}] ${c.label}`));

const keys = (l) => Object.keys(ui[l]).sort();
assert.deepEqual(keys('pt'), keys('en'), 'ui: pt e en têm chaves diferentes');
for (const l of ['pt', 'en']) for (const [k, v] of Object.entries(ui[l])) assert.ok(String(v).trim(), `ui.${l}.${k} vazio`);

// every character on screen must exist in the game font
const charset = new Set(JSON.parse(readFileSync(here('assets/font/charset.json'), 'utf8')));
const strings = [];
(function walk(v) {
  if (typeof v === 'string') strings.push(v);
  else if (v && typeof v === 'object') Object.values(v).forEach(walk);
})(DATA);
for (const s of strings) {
  const shown = s.replace(/\{\w+\}/g, '');   // {name}-style placeholders are filled in before display
  for (const ch of shown) if (ch !== '\n') assert.ok(charset.has(ch), `caractere "${ch}" não existe na fonte do jogo (em "${s.slice(0, 40)}")`);
}

// dialogue: same keys in both languages, every page fits the box
assert.deepEqual(Object.keys(DATA.talk.pt).sort(), Object.keys(DATA.talk.en).sort(), 'talk: pt e en com chaves diferentes');
for (const l of ['pt', 'en']) {
  for (const [k, pages] of Object.entries(DATA.talk[l])) {
    pages.forEach((page, i) => assert.ok(pageFits(page, widthsOf), `talk.${l}.${k}[${i}] não cabe na caixa: "${page}"`));
  }
}

console.log('check ok');
