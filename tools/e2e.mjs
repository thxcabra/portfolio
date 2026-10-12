// Drives headless Edge over CDP against a local static server and checks the main flows.
// Run: node tools/e2e.mjs   (EDGE=<path to msedge/chrome> to override the browser)
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { extname, join } from 'node:path';

const EDGE = process.env.EDGE || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const SITE = 8124, CDP = 9335;
const BASE = `http://127.0.0.1:${SITE}/`;
const ROOT = new URL('..', import.meta.url);
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.gif': 'image/gif', '.wav': 'audio/wav', '.woff': 'font/woff', '.json': 'application/json', '.webm': 'video/webm', '.mp4': 'video/mp4' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const server = createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, BASE).pathname);
  const file = new URL('.' + (path === '/' ? '/index.html' : path), ROOT);
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': MIME[extname(file.pathname)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((r) => server.listen(SITE, '127.0.0.1', r));

const edge = spawn(EDGE, ['--headless=new', '--disable-gpu', `--remote-debugging-port=${CDP}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'pokedex-e2e-'))}`, '--window-size=1920,1080', 'about:blank'], { stdio: 'ignore' });
let targets;
for (let i = 0; i < 50 && !targets; i++) {
  try { targets = await (await fetch(`http://127.0.0.1:${CDP}/json`)).json(); } catch { await sleep(200); }
}
const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0;
const pending = new Map();
const errors = [];
ws.addEventListener('message', (m) => {
  const msg = JSON.parse(m.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text);
  if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') errors.push(msg.params.args.map((a) => a.value ?? a.description).join(' '));
  if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') errors.push(`${msg.params.entry.text} ${msg.params.entry.url || ''}`);
});
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expr) => (await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result.result.value;
const KEYS = {
  Enter: { code: 'Enter', windowsVirtualKeyCode: 13, text: '\r' },
  ArrowDown: { code: 'ArrowDown', windowsVirtualKeyCode: 40 }, ArrowUp: { code: 'ArrowUp', windowsVirtualKeyCode: 38 },
  ArrowLeft: { code: 'ArrowLeft', windowsVirtualKeyCode: 37 }, ArrowRight: { code: 'ArrowRight', windowsVirtualKeyCode: 39 },
  z: { code: 'KeyZ', windowsVirtualKeyCode: 90, text: 'z' }, x: { code: 'KeyX', windowsVirtualKeyCode: 88, text: 'x' },
  Escape: { code: 'Escape', windowsVirtualKeyCode: 27 },
};
const keyDown = (k) => send('Input.dispatchKeyEvent', { type: 'keyDown', key: k, ...KEYS[k] });
const key = async (k, wait = 300) => {
  await keyDown(k);
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, ...KEYS[k], text: undefined });
  await sleep(wait);
};
const click = async (selector, wait = 300) => {
  const r = await ev(`(() => { const b = document.querySelector('${selector}').getBoundingClientRect(); return [b.x + b.width / 2, b.y + b.height / 2]; })()`);
  for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x: r[0], y: r[1], button: 'left', clickCount: 1 });
  await sleep(wait);
};
const hash = () => ev('location.hash');
const focused = () => ev('document.activeElement.textContent.trim()');
const has = (sel) => ev(`!!document.querySelector('${sel}')`);
const ok = (name) => console.log('ok  ' + name);

await send('Runtime.enable');
await send('Log.enable');
await send('Page.enable');
await send('Emulation.setFocusEmulationEnabled', { enabled: true });   // a headless page never gets window focus otherwise
const me = () => ev(`(() => { const p = document.querySelector('.person[data-me]'); return p ? [Number(p.dataset.x), Number(p.dataset.y), p.dataset.dir] : null; })()`);
const msg = () => ev(`(() => { const m = document.querySelector('.msg'); return m && !m.hidden ? m.textContent : null; })()`);
const hold = async (k, ms) => { await keyDown(k); await sleep(ms); await send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, ...KEYS[k], text: undefined }); await sleep(150); };
const closeMsg = async () => { for (let i = 0; i < 15 && (await msg()) !== null; i++) await key('z', 250); assert.equal(await msg(), null, 'caixa de diálogo não fechou'); };
const clickTile = async (tx, ty) => {
  const r = await ev(`(() => { const b = document.getElementById('screen').getBoundingClientRect(); return [b.left, b.top, b.width / 240]; })()`);
  const x = r[0] + (tx * 16 + 8) * r[2], y = r[1] + (ty * 16 + 8) * r[2];
  for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 });
};
const menuTo = async (label) => {
  for (let i = 0; i < 8 && (await focused()) !== label; i++) await key('ArrowDown', 120);
  assert.equal(await focused(), label);
};
// Rectangle of an element in game pixels, relative to the screen: [left, top, right, bottom].
const rectIn = (sel) => ev(`(() => { const s = document.getElementById('screen').getBoundingClientRect(), b = document.querySelector('${sel}').getBoundingClientRect(), k = s.width / 240; return [b.left - s.left, b.top - s.top, b.right - s.left, b.bottom - s.top].map((v) => Math.round(v / k)); })()`);

await send('Page.navigate', { url: BASE });
await sleep(1500);
await ev('localStorage.clear()');
await send('Page.reload');
await sleep(1500);

assert.ok(await ev(`document.fonts.check('16px Gen3')`), 'fonte do jogo não carregou');
assert.ok(await ev(`!!document.querySelector('.title .flames')`), 'tela de título não apareceu');
await sleep(1200);
assert.ok(await ev(`(() => { const c = document.querySelector('.title .flames'); return c.getContext('2d').getImageData(0, 60, 240, 52).data.some((v, i) => i % 4 === 3 && v); })()`), 'as chamas não sobem');
ok('tela de título do FireRed, com as chamas');

await key('Enter', 900);
assert.deepEqual(await me(), [7, 8, 'up']);
ok('START entra no Centro Pokémon, Red na porta');
assert.equal(await ev(`getComputedStyle(document.querySelector('.person[data-me]')).imageRendering`), 'pixelated', 'personagens borrados: imagem de fundo sem pixelated');
ok('personagens com pixel nítido');

await sleep(700);
assert.match((await msg()) ?? '', /Bem-vindo/);
assert.equal(await ev(`getComputedStyle(document.querySelector('.msg')).color`), 'rgb(230, 8, 8)', 'a Enfermeira fala em vermelho, como no FireRed');
await closeMsg();
assert.equal(await ev(`localStorage.getItem('welcomed')`), 'true');
assert.ok(await has('.menu .win'), 'o menu não abriu sozinho depois das boas-vindas');
assert.equal(await focused(), 'PROJETOS');
await key('x');
assert.ok(!(await has('.menu')));
assert.equal(await ev(`document.querySelector('.hint').hidden`), false, 'a dica START: MENU não apareceu');
ok('Enfermeira dá as boas-vindas uma vez e o menu abre sozinho; dica aparece');

await hold('ArrowUp', 4 * 266 + 200);
assert.deepEqual(await me(), [7, 4, 'up']);
await hold('ArrowUp', 400);
assert.deepEqual(await me(), [7, 4, 'up'], 'atravessou o balcão');
ok('anda com o teclado e o balcão bloqueia');

await key('z', 400);
assert.match((await msg()) ?? '', /JOÃO/);
await closeMsg();
ok('fala com a Enfermeira por cima do balcão');

await clickTile(11, 1);
await sleep(8 * 266 + 900);
assert.deepEqual(await me(), [11, 2, 'up']);
assert.match((await msg()) ?? '', /PC/);
await closeMsg();
ok('clique no PC: anda até ele e liga');

await clickTile(1, 6);
await sleep(12 * 266 + 900);
assert.match((await msg()) ?? '', /obras/);
await closeMsg();
ok('escada: sala de minijogos em obras');

await key('Enter');
assert.ok(await has('.menu .win'), 'START não abriu o menu');
assert.equal(await ev(`document.querySelector('.hint').hidden`), true, 'a dica não sumiu depois de usar o menu');
assert.equal(await focused(), 'PROJETOS');
const [, menuTop, menuRight, menuBottom] = await rectIn('.menu .win');
assert.deepEqual([menuTop, menuRight, menuBottom], [0, 240, 120], 'menu START fora do lugar do FireRed');
assert.deepEqual(await rectIn('.menu .help'), [0, 120, 240, 160]);
assert.equal((await rectIn('.menu .item'))[1], 8, 'primeiro item em y=8');
await key('ArrowUp');
assert.equal(await focused(), 'SAIR', 'o cursor do menu dá a volta');
await key('ArrowDown');
assert.match(await ev(`document.querySelector('.menu .help').textContent`), /projetos/i);
const before = await me();
await hold('ArrowLeft', 300);
assert.deepEqual(await me(), before, 'o Red andou com o menu aberto');
await key('z');
assert.match((await msg()) ?? '', /breve/);
await closeMsg();
assert.ok(await has('.menu .win'), 'o menu fechou junto com a mensagem');
await key('Enter');
assert.ok(!(await has('.menu')), 'START não fechou o menu');
ok('menu START: posição do jogo, cursor dá a volta, ajuda, "em breve", o Red não anda, fecha');

await key('Enter');
await menuTo('OPÇÕES');
await key('z', 500);
assert.ok(await has('.options'), 'OPÇÕES não abriu');
assert.deepEqual(await rectIn('.options .opt-bar'), [0, 0, 240, 16]);
assert.deepEqual(await rectIn('.options .win.std'), [8, 16, 232, 48]);
assert.deepEqual(await rectIn('.options .opt-list'), [8, 48, 232, 160]);
await key('ArrowLeft');
assert.equal(await ev(`localStorage.getItem('textSpeed')`), '"mid"');
await key('ArrowRight');
assert.equal(await ev(`localStorage.getItem('textSpeed')`), '"fast"');
await key('ArrowDown');
await key('ArrowDown');
await key('ArrowRight');
assert.match(await ev(`document.getElementById('screen').style.getPropertyValue('--frame')`), /frame-2\.png/);
await key('ArrowLeft');
await key('ArrowDown');
await key('ArrowRight');
assert.equal(await ev('document.documentElement.lang'), 'en');
assert.match(await ev(`document.querySelector('.options').textContent`), /OPTION/);
await key('ArrowRight');
assert.equal(await ev('document.documentElement.lang'), 'pt-BR');
await key('x');
assert.ok(!(await has('.options')) && (await has('.menu .win')), 'B não voltou de OPÇÕES para o menu');
assert.equal(await focused(), 'OPÇÕES');
await key('Enter');
ok('OPÇÕES: posições do jogo; velocidade, moldura e idioma salvos; B volta ao menu');

await keyDown('ArrowLeft');
assert.ok(await ev(`document.getElementById('gba').classList.contains('p-dpad')`), 'direcional não afundou');
await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowLeft', ...KEYS.ArrowLeft });
await sleep(400);
const box = await ev(`(() => { const b = document.querySelector('[data-btn="sound"]').getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; })()`);
for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x: box[0], y: box[1], button: 'left', clickCount: 1 });
await sleep(200);
assert.ok(await ev(`document.body.classList.contains('sound-on')`));
assert.equal(await ev(`localStorage.getItem('sound')`), 'true');
ok('direcional afunda com o teclado; botão de som liga');

await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 750, deviceScaleFactor: 3, mobile: true });
await sleep(400);
assert.equal(await ev(`document.getElementById('gba').style.width`), '256px', 'celular em pé não virou GBA SP');
await click('[data-btn="a"]');
assert.equal(await ev(`document.querySelectorAll('[data-btn]').length`), 9);
await send('Emulation.clearDeviceMetricsOverride');
await sleep(400);
assert.equal(await ev(`document.getElementById('gba').style.width`), '432px', 'deitado não voltou ao GBA');
ok('celular em pé vira GBA SP e volta');

assert.deepEqual(errors, [], 'erros no console: ' + errors.join('\n'));
ok('nenhum erro no console');

ws.close();
edge.kill();
server.close();
console.log('e2e ok');
process.exit(0);
