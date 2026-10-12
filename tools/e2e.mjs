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
await send('Page.navigate', { url: BASE + '#/' });
await sleep(1500);
await ev('localStorage.clear()');
await send('Page.reload');
await sleep(1500);

// intro + fonts
assert.ok((await ev('document.body.className')).includes('closed'));
assert.ok(await ev(`document.fonts.check('16px Gen3') && document.fonts.check('16px "Gen3 Small"')`), 'fonte do jogo não carregou');
ok('abre fechada, com a fonte do jogo carregada');
await key('Enter', 2400);
assert.equal(await hash(), '#/menu');
assert.equal(await focused(), 'POKéDEX');
ok('tecla abre, roda a abertura e cai no menu');

// menu + typing
await key('ArrowDown');
assert.equal(await focused(), 'JOÃO');
assert.equal(await ev(`document.querySelector('#panel p').textContent`), 'Quem é o treinador.');
ok('seta move o cursor e o painel acompanha');
await key('z', 150);
assert.equal(await hash(), '#/card');
assert.ok(await ev(`document.body.classList.contains('talking') && !!document.querySelector('#panel .tw-rest')`), 'texto não está digitando');
await key('z', 100);
assert.ok(await ev(`!document.body.classList.contains('talking') && !document.querySelector('#panel .tw-rest')`), 'A não completou o texto');
ok('texto digita e A completa na hora');
await key('x', 500);
assert.equal(await hash(), '#/menu');
assert.equal(await focused(), 'JOÃO');
ok('X volta e o cursor lembra a posição');

// dex + first visit
await key('ArrowUp');
await key('Enter', 500);
assert.equal(await hash(), '#/dex');
await key('ArrowDown');
await key('ArrowDown');
assert.match(await ev(`document.querySelector('#dex-name').textContent`), /GENGAR/);
assert.match(await ev(`document.querySelector('#dex-stage .sprite').getAttribute('src')`), /emerald\/94\.png$/);
assert.ok(await has('#dex-stage .f2'), 'sem segundo quadro na lista');
ok('lista troca o sprite (Emerald, 2 quadros)');
await key('z', 250);
assert.equal(await hash(), '#/dex/3');
assert.ok(await has('.entry .stage.sil'), 'primeira visita sem silhueta');
await sleep(1000);
assert.ok(!(await has('.entry .stage.sil')), 'silhueta não revelou');
assert.match(await ev(`document.querySelector('#panel').textContent`), /registrados na POKéDEX/);
ok('primeira visita: silhueta → cores → registrado');
await key('ArrowRight', 500);
assert.equal(await hash(), '#/dex/4');
await key('Escape', 500);
assert.equal(await hash(), '#/dex');
assert.match(await focused(), /LAPRAS/);
assert.match(await ev(`document.querySelector('.bar').textContent`), /VISTOS 2\/8/);
await ev(`location.hash = '#/dex/3'`);
await sleep(500);
assert.ok(!(await has('.entry .stage.sil')), 'segunda visita não deve ter silhueta');
ok('segunda visita vai direto');

// device reacting
await ev(`location.hash = '#/moves'`);
await sleep(500);
await keyDown('ArrowDown');
assert.ok(await ev(`document.querySelector('[data-hw="down"]').classList.contains('pressed')`), 'direcional não afundou');
await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowDown', ...KEYS.ArrowDown });
await sleep(300);
assert.match(await ev(`document.querySelector('#panel h2').textContent`), /PYTHON/);
ok('teclado afunda o direcional; golpes mostram o selecionado');
await click('[data-hw="sound"]');
assert.ok(await ev(`document.body.classList.contains('sound-on')`));
assert.equal(await ev(`localStorage.getItem('sound')`), 'true');
await click('[data-hw="sound"]');
assert.ok(!(await ev(`document.body.classList.contains('sound-on')`)));
ok('botão preto liga/desliga o som e a luz verde');
await click('[data-key="badges"]', 500);
assert.equal(await hash(), '#/badges');
await key('ArrowRight');
assert.equal(await ev(`document.querySelector('#badge-name').textContent`), 'EMPRESA EXEMPLO B');
ok('teclas azuis e grade de insígnias');

// options
await ev(`location.hash = '#/options'`);
await sleep(500);
await key('z', 400);
assert.equal(await ev('document.documentElement.lang'), 'en');
assert.match(await ev(`document.querySelector('#screen').textContent`), /LANGUAGE/);
assert.equal(await ev(`document.querySelector('[data-key="badges"]').textContent`), 'BADGES');
await key('ArrowDown');
await key('ArrowDown');
await key('ArrowRight', 400);
assert.equal(await ev(`localStorage.getItem('textSpeed')`), '"slow"');
await key('ArrowDown');
await key('z', 400);
assert.match(await ev(`getComputedStyle(document.documentElement).getPropertyValue('--frame')`), /frame-2\.png/);
ok('opções: idioma, velocidade do texto e moldura');
await send('Page.reload');
await sleep(2000);
assert.equal(await ev('document.documentElement.lang'), 'en');
assert.match(await ev(`getComputedStyle(document.documentElement).getPropertyValue('--frame')`), /frame-2\.png/);
ok('recarregar mantém as opções');

// routes, shiny, background
await ev(`location.hash = '#/dex/99'`);
await sleep(500);
assert.equal(await hash(), '#/menu');
await send('Page.navigate', { url: BASE + '?shiny#/dex/1' });
await sleep(2500);
assert.equal(await ev(`document.querySelectorAll('.spark').length`), 4);
assert.match(await ev(`document.querySelector('.entry .sprite').getAttribute('src')`), /animated\/shiny\/6\.gif$/);
ok('rota inválida vai pro menu; ?shiny mostra o shiny');
const clips = await ev(`fetch('assets/video/clips.json').then((r) => r.json())`);
assert.equal(await has('.bg-video'), clips.length > 0, 'vídeo de fundo não bate com clips.json');
ok(`fundo: ${clips.length ? 'vídeo tocando' : 'sem clipes, fundo provisório'}`);

assert.deepEqual(errors, [], 'erros no console: ' + errors.join('\n'));
ok('nenhum erro no console');

ws.close();
edge.kill();
server.close();
console.log('e2e ok');
process.exit(0);
