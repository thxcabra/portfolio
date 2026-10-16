import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { DATA } from './data.js';
import {
  route, textWidth, fitsLines, centerBox, fade8, grey8, brighten8, alpha8, blendLevels, nextSeed, starPos, gfWindow, titleEntrance, TEXT_SPEEDS, multiTiles, monPath, wrapText, toPages, listMove, nextIndex, fitScale, cycle, splitShown, pingPong,
  discPath, rrectPath, corner, TYPES, SHAPES, DIRS, around, pathToAny, pageFits, esc, ACT_W, siteAnchor, repoOf, skillCheck, skillRoll, morse, konami, KONAMI,
} from './logic.js';
import { MENU } from './carts/center/screens/menu.js';
import { VOLUMES } from './sound.js';
import { render as renderSong, RATE } from './music.js';

// routes: screens with their own link
const R = (p) => route(p, 8);
assert.deepEqual(R('projetos'), { screen: 'projetos', n: null });
assert.deepEqual(R('#/projetos/3'), { screen: 'projetos', n: 3 });
assert.deepEqual(R('projetos/8'), { screen: 'projetos', n: 8 });
for (const s of ['sobre', 'experiencia', 'habilidades', 'contato']) assert.deepEqual(R(`#/${s}`), { screen: s, n: null });
for (const bad of ['projetos/9', 'projetos/0', 'projetos/abc', 'projetos/1.5', 'contato/2', 'sobre/x/y', 'opcoes', 'foo', '', null]) {
  assert.equal(R(bad), null, `route(${bad})`);
}

// text in the game font
const W = { a: 5, b: 6 };
assert.equal(textWidth('', W), 0);
assert.equal(textWidth('ab', W), 11);
assert.equal(textWidth('?', W), 6, 'unknown characters count 6px');
assert.ok(fitsLines('ab\nab', W, 11, 2));
assert.ok(!fitsLines('ab\nab\nab', W, 11, 2));
assert.ok(!fitsLines('abb', W, 11, 2));
assert.equal(Math.round(TEXT_SPEEDS.fast * 100) / 100, 29.86, 'FAST: one letter every 2 frames');
assert.equal(Math.round(TEXT_SPEEDS.mid * 100) / 100, 11.95);
assert.equal(Math.round(TEXT_SPEEDS.slow * 100) / 100, 6.64);
assert.deepEqual(multiTiles(40, 2), { w: 7, h: 4 });
assert.deepEqual(multiTiles(48, 4), { w: 8, h: 7 });

// the game screen's centre goes to the window's centre
assert.deepEqual(centerBox(432, 202, 96, 18), { top: 6, right: 0, bottom: 0, left: 0, w: 432, h: 208 });
assert.deepEqual(centerBox(256, 320, 8, 12), { top: 136, right: 0, bottom: 0, left: 0, w: 256, h: 456 });
// screen centre at (120, 120) of a 300x200 body: the box needs room on the left and at the bottom
assert.deepEqual(centerBox(300, 200, 0, 40), { top: 0, right: 0, bottom: 40, left: 60, w: 360, h: 240 });

// GBA colour maths on 8-bit palette values (5-bit channels inside)
assert.equal(fade8(248, 0, 16), 0);
assert.equal(fade8(248, 0, 0), 248, 'level 0 keeps the colour as it is');
assert.equal(fade8(0, 31, 16), 255);
assert.equal(fade8(0, 30, 8), 123);
assert.equal(grey8(248, 248, 248), 255);
assert.equal(grey8(0, 0, 0), 0);
assert.equal(grey8(128, 64, 0), 41, 'luma 9 snaps to the grey step 5');
assert.equal(brighten8(0, 15), 239);   // (31·15) >> 4 = 29 → 239
assert.equal(alpha8(248, 74, 16, 0), 255);
assert.equal(alpha8(248, 74, 0, 16), 74);
// StartBlendTask
for (let k = 1; k < 32; k++) assert.deepEqual(blendLevels(0, 16, 16, 0, 16, k), [Math.ceil(k / 2), 16 - Math.floor(k / 2)]);
assert.deepEqual(blendLevels(0, 16, 16, 0, 16, 32), [16, 0]);
assert.deepEqual(blendLevels(0, 16, 16, 0, 48, 7), [1, 15]);
assert.deepEqual(blendLevels(16, 0, 0, 16, 20, 40), [0, 16]);
// the star's trail uses the game's generator: first sparkles' x offsets (seed 354128453)
let sd = 354128453;
const xMods = [];
for (let n = 1; n <= 9; n++) if (n % 8) { sd = nextSeed(sd); xMods.push(((sd >>> 16) & 7) + 2); }
assert.deepEqual(xMods, [6, 6, 5, 5, 6, 9, 6, 6]);
const sine = JSON.parse(readFileSync(new URL('assets/intro/intro.json', import.meta.url), 'utf8')).sine;
assert.deepEqual(starPos(1, sine), { x: 242, y: 56, y2: sine[67] >> 5 });
assert.equal(starPos(42, sine).x, -4);
assert.deepEqual(gfWindow(-7), [80, 80]);
assert.deepEqual(gfWindow(-6), [72, 88]);
assert.deepEqual(gfWindow(-1), [32, 128]);
assert.deepEqual(gfWindow(300), [32, 128]);
// the title's entrance
const E = titleEntrance;
assert.deepEqual(E(0).charizard, { src: 'color', to: 'black', y: 16 });
assert.equal(E(2).band, 128);
assert.equal(E(35).band, null);
assert.deepEqual(E(48).charizard, { src: 'grey', to: 'black', y: 16 });
assert.equal(E(58).charizard.y, 14);
assert.equal(E(135).charizard.y, 0);
assert.deepEqual(E(182).charizard, { src: 'grey', to: 'white', y: 15 });
assert.equal(E(231).charizard.y, 16);
assert.deepEqual(E(232).charizard, { src: 'color', to: 'white', y: 15 });
assert.equal(E(262).charizard.y, 0);
assert.equal(E(180).border, 0);
assert.equal(E(185).border, 120);
assert.equal(E(195).border, 240);
assert.equal(E(200).bars, 'black');
assert.equal(E(201).bars, 'hidden');
assert.equal(E(202).bars, 216);
assert.equal(E(212).bars, 0);
assert.equal(E(230).logo, null);
assert.equal(E(232).logo, 16);
assert.equal(E(233).logo, 14);
assert.equal(E(254).logo, 0);

// volume levels: off, low, mid (40% of the old fixed volume), high
assert.deepEqual(VOLUMES.length, 4);
assert.equal(VOLUMES[0], 0);
assert.equal(VOLUMES[2], 0.4);
assert.ok(VOLUMES.every((v, i) => i === 0 || v > VOLUMES[i - 1]), 'volume levels must grow');

// Pokémon pictures: FireRed's, built by tools/build_assets.py
assert.equal(monPath(6), 'assets/mon/front/6.png');
assert.equal(monPath(6, { shiny: true }), 'assets/mon/shiny/6.png');
assert.equal(monPath(201, { form: 'c' }), 'assets/mon/front/201-c.png');

// scrolling lists, as list_menu.c moves them (7 items, 6 rows)
let ls = { scroll: 0, row: 0 };
const downs = [];
for (let i = 0; i < 7; i++) downs.push(JSON.stringify(ls = listMove(ls, true, 7, 6)));
assert.deepEqual(downs.map((d) => JSON.parse(d)).map(({ scroll, row }) => [scroll, row]), [[0, 1], [0, 2], [0, 3], [1, 3], [1, 4], [1, 5], [1, 5]]);
const ups = [];
for (let i = 0; i < 7; i++) { ls = listMove(ls, false, 7, 6); ups.push([ls.scroll, ls.row]); }
assert.deepEqual(ups, [[1, 4], [1, 3], [1, 2], [0, 2], [0, 1], [0, 0], [0, 0]]);
assert.deepEqual(listMove({ scroll: 0, row: 2 }, true, 3, 6), { scroll: 0, row: 2 }, 'short list: stops on the last item');

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

// background camera: back and forth
assert.deepEqual([0, 1, 2, 3, 4, 5, 6, 7, 8].map((t) => pingPong(t, 4)), [0, 1, 2, 3, 4, 3, 2, 1, 0]);
assert.equal(pingPong(5, 0), 0);

// pixel shapes
const widths = (d) => [...d.matchAll(/h(\d+)/g)].map((m) => +m[1]);
assert.deepEqual(widths(discPath(0, 0, 8)), [4, 6, 8, 8, 8, 8, 6, 4]);
assert.equal(rrectPath(0, 0, 10, 6), 'M2 0h6v1h-6zM2 5h6v1h-6zM1 1h8v1h-8zM1 4h8v1h-8zM0 2h10v2h-10z');
assert.equal(rrectPath(0, 0, 4, 2, []), 'M0 0h4v2h-4z');
assert.deepEqual(corner(4), [2, 1]);
assert.deepEqual(corner(0), []);
assert.ok(corner(44).every((v, i, a) => i === 0 || v <= a[i - 1]), 'corner insets must shrink row by row');

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
const wrapped = wrapText('Um app de NBA para todo mundo, feito primeiro em português.', widthsOf, 100);
assert.ok(wrapped.length > 1 && wrapped.every((l) => textWidth(l, widthsOf) <= 100), 'wrapText: every line fits');
assert.equal(wrapped.join(' '), 'Um app de NBA para todo mundo, feito primeiro em português.', 'wrapText keeps every word');
assert.deepEqual(wrapText('a b\nc', widthsOf, 200), ['a b', 'c']);
assert.deepEqual(toPages(['1', '2', '3']), ['1\n2', '3']);

// --- content (data.js)
const here = (path) => new URL(path, import.meta.url);
const both = (o, w) => assert.ok(o?.pt?.trim() && o?.en?.trim(), `${w}: falta texto pt ou en`);
const url = (u, w) => assert.match(u, /^(https:\/\/|mailto:)/, `${w}: link precisa começar com https:// ou mailto: (${u})`);
const dex = (n, w) => {
  assert.ok(Number.isInteger(n) && n >= 1 && n <= 386, `${w}: dex ${n} fora de 1–386`);
  for (const shiny of [false, true]) assert.ok(existsSync(here(monPath(n, { shiny }))), `${w}: sprite não existe (${monPath(n, { shiny })})`);
  assert.ok(existsSync(here(`assets/cries/${n}.wav`)), `${w}: grito não existe (assets/cries/${n}.wav) — rode python tools/build_assets.py`);
};
const { trainer, projects, badges, moves, contact, ui } = DATA;

both(trainer.about, 'trainer.about');
dex(trainer.partner, 'trainer.partner');
assert.ok(Number.isInteger(trainer.since), 'trainer.since precisa ser um ano');
both(trainer.role, 'trainer.role');
both(trainer.languages, 'trainer.languages');
assert.ok(trainer.location?.trim(), 'trainer.location vazio');

assert.ok(projects.length >= 1, 'precisa de pelo menos 1 projeto');
const widthsOfData = JSON.parse(readFileSync(here('assets/font/widths.json'), 'utf8'));
const fw = (s) => textWidth(s, widthsOfData);
projects.forEach((p, i) => {
  const w = `projects[${i}] ${p.name}`;
  dex(p.dex, w);
  if (p.form) assert.ok(existsSync(here(monPath(p.dex, { form: p.form }))), `${w}: forma ${p.form} não existe`);
  assert.ok(p.pokemon && p.name && p.year, `${w}: falta pokemon, name ou year`);
  assert.ok(fw(p.name) + p.name.length <= 64, `${w}: name largo demais para a lista (1px entre letras, 64px)`);
  assert.ok(p.types.length >= 1 && p.types.length <= 2 && p.types.every((x) => TYPES.includes(x)), `${w}: types inválidos (${p.types})`);
  assert.ok(Array.isArray(p.stack) && p.stack.length >= 1 && p.stack.length <= 4, `${w}: stack precisa ter de 1 a 4 itens`);
  p.stack.forEach((t) => assert.ok(fw(t) <= 72, `${w}: "${t}" largo demais para TECNOLOGIAS`));
  for (const l of ['pt', 'en']) {
    assert.ok(fw(p.kind[l]) <= 69, `${w}: kind.${l} largo demais para ITEM (69px)`);
    assert.ok(wrapText(p.pitch[l], widthsOfData, 224).length <= 2, `${w}: pitch.${l} não cabe em 2 linhas do TRAINER MEMO`);
  }
  both(p.text, w);
  Object.values(p.links || {}).forEach((u) => url(u, w));
  p.shots.forEach((s) => assert.ok(existsSync(here(s)), `${w}: imagem não existe (${s})`));
});
Object.entries(DATA.tech).forEach(([t, type]) => assert.ok(TYPES.includes(type), `tech.${t}: tipo inválido (${type})`));

assert.ok(badges.length <= 8, 'máximo de 8 insígnias');
badges.forEach((b, i) => {
  const w = `badges[${i}] ${b.name}`;
  assert.ok(SHAPES.includes(b.shape), `${w}: shape inválido (${b.shape})`);
  both(b.role, w);
  both(b.period, w);
  both(b.text, w);
});

assert.equal(new Set(badges.map((b) => b.shape)).size, badges.length, 'insígnias: um formato por emprego (cada uma tem o seu lugar no cartão)');
// SOBRE: the card's lines fit (front values end at x=142, back lines run from x=18 to the card's edge)
for (const l of ['pt', 'en']) {
  const [role, ...more] = trainer.role[l].split(' · ');
  for (const s of [role, more.join(' · '), trainer.location, trainer.languages[l]]) assert.ok(fw(s) <= 212, `cartão: "${s}" não cabe no verso`);
  assert.ok(fw(ui[l].card_name + trainer.name) <= 112, `cartão: nome não cabe na frente (${l})`);
}

// EXPERIÊNCIA: names fit the Bag's list (x 97 to 232); descriptions fit 3 lines of 200px with 2px between letters
const wide = Object.fromEntries(Object.entries(widthsOfData).map(([ch, w]) => [ch, w + 2]));
for (const l of ['pt', 'en']) {
  for (const b of badges) assert.ok(wrapText(b.role[l], wide, 200).length + 2 <= 3, `bolsa: cargo de ${b.name} longo demais (${l})`);
  for (const e of DATA.education) assert.ok(wrapText(e.course[l], wide, 200).length + 1 <= 3, `bolsa: curso de ${e.name} longo demais (${l})`);
}
for (const x of [...badges, ...DATA.education]) assert.ok(fw(x.name) <= 135, `bolsa: nome ${x.name} largo demais para a lista`);

// HABILIDADES: each description fits the TM Case's 4 lines (140px, 1px between letters)
const wide1 = Object.fromEntries(Object.entries(widthsOfData).map(([ch, w]) => [ch, w + 1]));
for (const l of ['pt', 'en']) for (const m of moves) assert.ok(wrapText(m.text[l], wide1, 140).length <= 4, `estojo: texto de ${m.name} longo demais (${l})`);
assert.ok(moves.length <= 50, 'no máximo 50 TMs');

const { education } = DATA;
assert.ok(Array.isArray(education) && education.length >= 1, 'education precisa ser uma lista');
education.forEach((e, i) => {
  const w = `education[${i}] ${e.name}`;
  assert.ok(e.name?.trim(), `${w}: falta name`);
  both(e.course, w);
  both(e.period, w);
});

moves.forEach((m, i) => {
  const w = `moves[${i}] ${m.name}`;
  assert.ok(TYPES.includes(m.type), `${w}: type inválido (${m.type})`);
  assert.ok(Number.isInteger(m.power) && m.power >= 0 && m.power <= 100 && Number.isInteger(m.years), `${w}: power (0–100) e years precisam ser inteiros`);
  both(m.text, w);
});

contact.forEach((c, i) => {
  const w = `contact[${i}] ${c.label}`;
  assert.ok(!/^tel:/i.test(c.url) && !/\d{4}-?\d{4}/.test(c.url), `${w}: telefone não vai para o site`);
  if (c.url.startsWith('assets/')) assert.ok(existsSync(here(c.url)), `${w}: arquivo não existe (${c.url})`);
  else url(c.url, w);
});

const keys = (l) => Object.keys(ui[l]).sort();
assert.deepEqual(keys('pt'), keys('en'), 'ui: pt e en têm chaves diferentes');
for (const l of ['pt', 'en']) for (const [k, v] of Object.entries(ui[l])) assert.ok(String(v).trim(), `ui.${l}.${k} vazio`);

// every character on screen must exist in the game font
const charset = new Set(JSON.parse(readFileSync(here('assets/font/charset.json'), 'utf8')));
const strings = [];
(function walk(v) {
  if (typeof v === 'string') strings.push(v);
  else if (v && typeof v === 'object') Object.values(v).forEach(walk);
})({ ...DATA, site: null });   // the landing page's texts are not drawn in the game font
for (const s of strings) {
  const shown = s.replace(/\{\w+\}/g, '');   // {name}-style placeholders are filled in before display
  for (const ch of shown) if (ch !== '\n') assert.ok(charset.has(ch), `caractere "${ch}" não existe na fonte do jogo (em "${s.slice(0, 40)}")`);
}

// dialogue: same keys in both languages, every page fits the box
assert.deepEqual(Object.keys(DATA.talk.pt).sort(), Object.keys(DATA.talk.en).sort(), 'talk: pt e en com chaves diferentes');
for (const l of ['pt', 'en']) {
  for (const [k, pages] of Object.entries(DATA.talk[l])) {
    pages.forEach((page, i) => assert.ok(pageFits(page, widthsOf, 208, i < pages.length - 1 ? 10 : 0), `talk.${l}.${k}[${i}] não cabe na caixa: "${page}"`));
  }
}

// menus: labels and help lines fit their windows (widths from the game font)
for (const l of ['pt', 'en']) {
  const u = ui[l];
  for (const id of MENU) {
    assert.ok(u[`menu_${id}`], `ui.${l}.menu_${id} faltando`);
    assert.ok(fitsLines(u[`help_${id}`], widthsOf, 238, 2), `ui.${l}.help_${id} não cabe na barra de ajuda (2 linhas)`);
  }
  const widest = Math.max(...MENU.map((id) => textWidth(u[`menu_${id}`], widthsOf)));
  assert.ok(widest <= 96, `ui.${l}: item do menu START largo demais (${widest}px)`);
  for (const k of ['opt_text', 'opt_sound', 'opt_frame', 'opt_lang', 'opt_exit']) assert.ok(textWidth(u[k], widthsOf) <= 120, `ui.${l}.${k} largo demais para OPÇÕES`);
  for (const k of ['slow', 'mid', 'fast', 'vol_0', 'vol_1', 'vol_2', 'vol_3', 'lang_pt', 'lang_en']) assert.ok(textWidth(u[k], widthsOf) <= 70, `ui.${l}.${k} largo demais (o jogo limpa 70px)`);
  assert.ok(textWidth(`${u.frame_type}10`, widthsOf) <= 70, `ui.${l}.frame_type largo demais`);
  for (const k of ['bag_work', 'bag_school', 'tm_title']) assert.ok(textWidth(u[k], widthsOf) <= 72, `ui.${l}.${k} largo demais para a barra do título (72px)`);
}

// the console's words for what A and B do now (small font) fit next to the buttons on both shells
const smallOf = JSON.parse(readFileSync(here0('assets/font/widths-small.json'), 'utf8'));
for (const l of ['pt', 'en']) {
  const acts = Object.keys(ui[l]).filter((k) => k.startsWith('act_'));
  assert.ok(acts.length >= 10, `ui.${l}: faltam as palavras de A/B`);
  for (const k of acts) assert.ok(textWidth(ui[l][k], smallOf) <= ACT_W, `ui.${l}.${k} largo demais ao lado do botão (${ACT_W}px)`);
}

const contactLabels = [...contact.map((c) => c.label), ui.pt.menu_sair, ui.en.menu_sair];
const ct = multiTiles(Math.max(...contactLabels.map((l) => textWidth(l, widthsOf))), contact.length + 1);
assert.ok(contact.length + 1 <= 8 && 1 + ct.w <= 28, 'CONTATO: itens demais ou largos demais para a janela do jogo');

// music: the songs render from the game's data (music.js), with the right length, loop and level
const musicBank = JSON.parse(readFileSync(here('assets/music/bank.json'), 'utf8'));
const midiOf = (n) => { const b = readFileSync(here(`assets/music/${n}.mid`)); return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength); };
const heal = await renderSong(musicBank, 'mus_heal', midiOf('mus_heal'));
assert.ok(Math.abs(heal.left.length / RATE - 2.03) < 0.1 && heal.loop === null, `MUS_HEAL deveria durar ~2 s sem loop (${heal.left.length / RATE})`);
const center = await renderSong(musicBank, 'mus_poke_center', midiOf('mus_poke_center'));
assert.ok(center.loop && center.loop[1] - center.loop[0] > 20 * RATE, 'MUS_POKE_CENTER deveria ter um loop');
for (const r of [heal, center]) {
  let peak = 0;
  for (const v of r.left) { assert.ok(!Number.isNaN(v), 'música com NaN'); peak = Math.max(peak, Math.abs(v)); }
  assert.ok(peak > 0.05 && peak <= 1, `música com nível estranho (${peak})`);
}

// the landing page: links old (the GBA's #/projetos/3) and new (#projeto-3) land on the right section
assert.equal(siteAnchor('#/projetos/3', 7), 'projeto-3');
assert.equal(siteAnchor('#projeto-3', 7), 'projeto-3');
assert.equal(siteAnchor('#/projetos', 7), 'projetos');
assert.equal(siteAnchor('#projetos', 7), 'projetos');
for (const s of ['sobre', 'experiencia', 'habilidades', 'contato', 'jogos']) {
  assert.equal(siteAnchor(`#/${s}`, 7), s);
  assert.equal(siteAnchor(`#${s}`, 7), s);
}
for (const bad of ['#/projetos/8', '#/projetos/0', '#projeto-x', '#/simples', '#/opcoes', '#topo', '', null]) assert.equal(siteAnchor(bad, 7), null, `siteAnchor(${bad})`);
assert.equal(repoOf('https://github.com/thxcabra/PitchIQ'), 'thxcabra/PitchIQ');
assert.equal(repoOf('https://github.com/thxcabra/replai/'), 'thxcabra/replai');
assert.equal(repoOf('https://www.moicdigital.com'), null);
assert.equal(repoOf(undefined), null);

// the landing page's texts: same keys in both languages; its media exist
const site = DATA.site;
for (const k of ['about', 'looking']) assert.ok(site[k].pt && site[k].en, `site.${k} em pt e en`);
assert.equal(site.about.pt.length, site.about.en.length, 'site.about: mesmo número de parágrafos em pt e en');
assert.deepEqual([...site.order].sort((x, y) => x - y), DATA.projects.map((_, i) => i), 'site.order: cada projeto uma vez');
for (const a of site.art) assert.ok(existsSync(here0(a.src)) && a.caption.pt && a.caption.en, `arte sem arquivo ou legenda: ${a.src}`);
for (const f of site.favorites) assert.ok(f.name && f.why.pt && f.why.en && Number.isInteger(f.steam), `jogo favorito incompleto: ${f.name}`);
for (const g of site.recommend) assert.ok(g.name && Number.isInteger(g.steam), `jogo recomendado sem link da Steam: ${g.name}`);
for (const t of site.tracks) assert.ok(t.artist && t.song && Number.isInteger(t.id), `música incompleta: ${t.artist}`);
assert.deepEqual(site.attrs.flatMap((a) => a.moves).sort(), DATA.moves.map((m) => m.name).sort(), 'site.attrs: cada habilidade em um atributo');
for (const b of DATA.badges.filter((x) => x.via)) assert.ok(DATA.badges.some((x) => x.name === b.via && !x.via), `via sem a empresa: ${b.via}`);

// skill checks, Morse and the Konami code (the landing page's skills and secrets)
assert.deepEqual([95, 90, 85, 80, 75, 60].map(skillCheck), ['d90', 'd90', 'd85', 'd80', 'd75', 'd75']);
for (const m of DATA.moves) {
  const low = skillRoll(m.power, 1), high = skillRoll(m.power, 20);
  assert.ok(low.total >= low.dc && !low.crit, `${m.name}: um 1 no dado ainda passa`);
  assert.ok(high.crit && high.total === 20 + high.bonus);
}
for (const m of DATA.moves) assert.ok(site.ui.pt[skillCheck(m.power)] && site.ui.en[skillCheck(m.power)], `dificuldade sem texto: ${m.name}`);
const cabra = morse('CABRA');
assert.deepEqual(cabra.slice(0, 3), [[true, 3], [false, 1], [true, 1]], 'C começa com traço, ponto');
assert.equal(cabra.reduce((t, [, u]) => t + u, 0), 56, 'CABRA em Morse dura 56 unidades com a pausa final');
assert.deepEqual(cabra.at(-1), [false, 7]);
const run = (keys) => keys.reduce((p, k) => konami(p, k), 0);
assert.equal(run(KONAMI), KONAMI.length);
assert.equal(run(['ArrowUp', ...KONAMI]), KONAMI.length, '↑↑↑ ainda começa o código');
assert.equal(run(['B', ...KONAMI.slice(0, 8), 'B', 'A']), KONAMI.length, 'B e A maiúsculos valem');
assert.equal(run([...KONAMI.slice(0, 5), 'x']), 0, 'tecla errada recomeça');
assert.deepEqual(Object.keys(site.ui.en).sort(), Object.keys(site.ui.pt).sort(), 'site.ui: chaves diferentes em pt e en');
for (const f of [site.media.photo, ...site.media.drawings, ...site.games.map((g) => g.media)].filter(Boolean)) assert.ok(existsSync(here0(f)), `falta ${f}`);
for (const g of site.games) assert.ok(g.name && g.text?.pt && g.text?.en && g.media, `jogo incompleto: ${g.name}`);

// the landing page's colours (site/site.css): text pairs keep WCAG AA contrast
const siteCss = readFileSync(here0('site/site.css'), 'utf8');
const tok = (n) => siteCss.match(new RegExp(`--${n}:\\s*(#[0-9a-fA-F]{6})`))[1];
const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
for (const [fg, bg] of [['paper', 'ink'], ['ink', 'paper'], ['ink', 'orange'], ['ink', 'green'], ['paper', 'purple'], ['orange', 'ink'], ['green', 'ink'], ['orange-deep', 'paper'], ['green-deep', 'paper'], ['purple', 'paper'], ['paper', 'ink-2'], ['violet', 'ink-3'], ['orange', 'ink-3'], ['green', 'ink-3'], ['paper', 'ink-3']]) {
  const c = contrast(tok(fg), tok(bg));
  assert.ok(c >= 4.5, `contraste ${fg} sobre ${bg}: ${c.toFixed(2)}`);
}

// assets/site/github.json (tools/github_stats.mjs): one entry per project repo, with its languages
const ghFile = here0('assets/site/github.json');
if (existsSync(ghFile)) {
  const gh = JSON.parse(readFileSync(ghFile, 'utf8'));
  for (const p of DATA.projects) {
    const repo = repoOf(p.links.repo);
    if (repo) assert.ok(Object.keys(gh[repo]?.languages ?? {}).length > 0, `github.json sem ${repo}`);
  }
}

console.log('check ok');
