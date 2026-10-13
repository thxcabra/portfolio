// Screenshots for review: node tools/shots.mjs <outDir> [WxH[@dpr] ...]
// Serves the site, opens each size in headless Edge (EDGE=<path> to override) and saves the title,
// the room, the START menu, OPÇÕES, CONTATO, PROJETOS, a project's three pages and a full-size picture.
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { extname, join } from 'node:path';

const [out = 'shots', ...args] = process.argv.slice(2);
const sizes = args.length ? args : ['1920x1080', '1366x650', '390x844@3', '844x390@3'];
const EDGE = process.env.EDGE || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const SITE = 8125, CDP = 9336, BASE = `http://127.0.0.1:${SITE}/`;
const ROOT = new URL('..', import.meta.url);
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.woff': 'font/woff', '.json': 'application/json', '.wav': 'audio/wav' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const server = createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, BASE).pathname);
  try {
    const file = new URL('.' + (path === '/' ? '/index.html' : path), ROOT);
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': MIME[extname(file.pathname)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((r) => server.listen(SITE, '127.0.0.1', r));
const edge = spawn(EDGE, ['--headless=new', '--disable-gpu', `--remote-debugging-port=${CDP}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'shots-'))}`, 'about:blank'], { stdio: 'ignore' });
let targets;
for (let i = 0; i < 50 && !targets; i++) {
  try { targets = await (await fetch(`http://127.0.0.1:${CDP}/json`)).json(); } catch { await sleep(200); }
}
const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0;
const pending = new Map();
ws.addEventListener('message', (m) => {
  const msg = JSON.parse(m.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
});
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const KEYS = { Enter: ['Enter', 13], Escape: ['Escape', 27], ArrowUp: ['ArrowUp', 38], ArrowRight: ['ArrowRight', 39], ArrowLeft: ['ArrowLeft', 37], z: ['KeyZ', 90], x: ['KeyX', 88] };
const key = async (k, wait = 400) => {
  for (const type of ['keyDown', 'keyUp']) await send('Input.dispatchKeyEvent', { type, key: k, code: KEYS[k][0], windowsVirtualKeyCode: KEYS[k][1] });
  await sleep(wait);
};
await send('Emulation.setFocusEmulationEnabled', { enabled: true });
mkdirSync(out, { recursive: true });

for (const [n, size] of sizes.entries()) {
  const [, w, h, dpr = '1'] = size.match(/^(\d+)x(\d+)(?:@(\d+))?$/);
  await send('Emulation.setDeviceMetricsOverride', { width: +w, height: +h, deviceScaleFactor: +dpr, mobile: +dpr > 1 });
  const shot = async (name) => {
    const s = await send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(join(out, `${size.replace('@', '-')}-${name}.png`), Buffer.from(s.result.data, 'base64'));
  };
  await send('Page.navigate', { url: `${BASE}?s=${n}` });
  await sleep(1500);
  await send('Runtime.evaluate', { expression: `localStorage.setItem('welcomed', 'true'); localStorage.setItem('menuUsed', 'true')` });
  await send('Page.navigate', { url: `${BASE}?s=${n}b` });
  await sleep(2000);
  await shot('title');
  await key('Enter', 2600);
  await shot('room');
  await key('Escape', 600);
  await shot('menu');
  await key('ArrowUp');
  await key('ArrowUp');
  await key('z', 800);
  await shot('options');
  await send('Page.navigate', { url: `${BASE}?s=${n}c#/contato` });
  await sleep(2500);
  await shot('contact');
  await send('Page.navigate', { url: `${BASE}?s=${n}d#/projetos` });
  await sleep(2500);
  await shot('dex');
  await send('Page.navigate', { url: `${BASE}?s=${n}e#/projetos/3` });
  await sleep(3000);
  await shot('page-info');
  await key('ArrowRight', 600);
  await shot('page-shots');
  await key('ArrowRight', 600);
  await shot('page-stack');
  await key('ArrowLeft', 600);
  await key('z', 1200);
  await shot('picture');
}
ws.close();
edge.kill();
server.close();
console.log(`shots in ${out}`);
process.exit(0);
