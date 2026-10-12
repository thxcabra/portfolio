import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { DATA } from './data.js';
import { parseRoute, parent, spritePath, nextIndex, fitScale, discPath, rrectPath, TYPES, SHAPES } from './app.js';

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

// sprites
assert.equal(spritePath(6), 'assets/sprites/firered-leafgreen/6.png');
assert.equal(spritePath(6, { shiny: true }), 'assets/sprites/firered-leafgreen/shiny/6.png');
assert.equal(spritePath(250), 'assets/sprites/emerald/250.png');
assert.equal(spritePath(250, { shiny: true }), 'assets/sprites/emerald/shiny/250.png');
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

// scale: integer in physical pixels
assert.equal(fitScale(576, 320, 1888, 1048, 1), 3);
assert.equal(fitScale(576, 320, 1334, 736, 1), 2);
assert.equal(fitScale(240, 160, 358, 380, 3), 4 / 3);
assert.equal(fitScale(576, 320, 100, 100, 1), 1);

// pixel shapes
const widths = (d) => [...d.matchAll(/h(\d+)/g)].map((m) => +m[1]);
assert.deepEqual(widths(discPath(0, 0, 8)), [4, 6, 8, 8, 8, 8, 6, 4]);
assert.equal(rrectPath(0, 0, 10, 6), 'M2 0h6v1h-6zM2 5h6v1h-6zM1 1h8v1h-8zM1 4h8v1h-8zM0 2h10v2h-10z');
assert.equal(rrectPath(0, 0, 4, 2, []), 'M0 0h4v2h-4z');

// --- content (data.js)
const both = (o, w) => assert.ok(o?.pt?.trim() && o?.en?.trim(), `${w}: falta texto pt ou en`);
const url = (u, w) => assert.match(u, /^(https:\/\/|mailto:)/, `${w}: link precisa começar com https:// ou mailto: (${u})`);
const dex = (n, w) => {
  assert.ok(Number.isInteger(n) && n >= 1 && n <= 386, `${w}: dex ${n} fora de 1–386`);
  for (const o of [{}, { shiny: true }, { animated: true }, { shiny: true, animated: true }]) {
    assert.ok(existsSync(new URL(spritePath(n, o), import.meta.url)), `${w}: sprite não existe (${spritePath(n, o)})`);
  }
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

console.log('check ok');
