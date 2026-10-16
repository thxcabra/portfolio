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
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.gif': 'image/gif', '.wav': 'audio/wav', '.woff': 'font/woff', '.json': 'application/json' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const server = createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, BASE).pathname);
  const file = new URL('.' + (path === '/' ? '/index.html' : extname(path) ? path : `${path}.html`), ROOT);   // /jogar is jogar.html, as on GitHub Pages
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
  b: { code: 'KeyB', windowsVirtualKeyCode: 66, text: 'b' }, a: { code: 'KeyA', windowsVirtualKeyCode: 65, text: 'a' },
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
const msg = () => ev(`(() => { const m = document.querySelector('.msg.dialog'); return m && !m.hidden ? m.textContent : null; })()`);
const hold = async (k, ms) => { await keyDown(k); await sleep(ms); await send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, ...KEYS[k], text: undefined }); await sleep(150); };
const closeMsg = async () => { for (let i = 0; i < 40 && (await msg()) !== null; i++) await key('z', 250); assert.equal(await msg(), null, 'caixa de diálogo não fechou'); };
// A click on a game pixel of the screen.
const tap = async (gx, gy) => {
  const r = await ev(`(() => { const b = document.getElementById('screen').getBoundingClientRect(); return [b.left, b.top, b.width / 240]; })()`);
  const x = r[0] + (gx + 0.5) * r[2], y = r[1] + (gy + 0.5) * r[2];
  for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 });
};
const clickTile = (tx, ty) => tap(tx * 16 + 8, ty * 16 + 8);
// Waits (up to ms) for an expression to come true in the page.
const until = async (expr, what, ms = 5000) => {
  for (let t = 0; t < ms && !(await ev(expr)); t += 100) await sleep(100);
  assert.ok(await ev(expr), what);
};
// The word next to A or B on the console ('' when it is hidden).
const act = (b) => ev(`document.querySelector('[data-btn="${b}"] .act').textContent`);
// The Box: the hand's spot (the centre of its sprite) and the team panel's top.
const handIs = (x, y) => `(document.querySelector('.box-hand').style.left === '${x - 16}px' && document.querySelector('.box-hand').style.top === '${y - 16}px')`;
const panelIs = (top) => `(document.querySelector('.box-party').style.top === '${top}px')`;
const menuTo = async (label) => {
  for (let i = 0; i < 8 && (await focused()) !== label; i++) await key('ArrowDown', 120);
  assert.equal(await focused(), label);
};
// Right mouse button on the screen = B.
const rightClick = async (wait = 300) => {
  const r = await ev(`(() => { const b = document.getElementById('screen').getBoundingClientRect(); return [b.left + 40, b.top + b.height - 30]; })()`);
  for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x: r[0], y: r[1], button: 'right', clickCount: 1 });
  await sleep(wait);
};
// Rectangle of an element in game pixels, relative to the screen: [left, top, right, bottom].
const rectIn = (sel) => ev(`(() => { const s = document.getElementById('screen').getBoundingClientRect(), b = document.querySelector('${sel}').getBoundingClientRect(), k = s.width / 240; return [b.left - s.left, b.top - s.top, b.right - s.left, b.bottom - s.top].map((v) => Math.round(v / k)); })()`);

await send('Page.navigate', { url: `${BASE}jogar` });
await sleep(1500);
assert.ok(await ev(`document.body.classList.contains('powered')`), 'a luz POWER não acendeu');
assert.ok(await has('canvas.intro'), 'a abertura da GAME FREAK não começou numa sessão nova');
await key('Enter', 400);
assert.ok(!(await has('canvas.intro')) && (await has('.title')) && !(await has('.title .entrance')), 'um botão deveria pular direto para o título pronto');
ok('abertura: a luz acende, a GAME FREAK roda e um botão pula para o título pronto');
await ev('localStorage.clear()');
await send('Page.reload');
await sleep(1500);

assert.ok(await ev(`document.fonts.check('16px Gen3')`), 'fonte do jogo não carregou');
assert.ok(await ev(`!!document.querySelector('.title .flames')`), 'tela de título não apareceu');
await sleep(1200);
assert.ok(await ev(`(() => { const c = document.querySelector('.title .flames'); return c.getContext('2d').getImageData(0, 60, 240, 52).data.some((v, i) => i % 4 === 3 && v); })()`), 'as chamas não sobem');
ok('tela de título do FireRed, com as chamas');

await key('Enter', 700);
assert.ok(await has('.title'), 'o título deveria esperar o grito do Charizard (90 quadros) antes de sair');
await sleep(1700);
assert.deepEqual(await me(), [7, 8, 'up']);
ok('START entra no Centro Pokémon, Red na porta');
const off = () => ev(`(() => { const r = document.getElementById('screen').getBoundingClientRect(); return [r.left + r.width / 2 - innerWidth / 2, r.top + r.height / 2 - innerHeight / 2].map((v) => Math.abs(Math.round(v))); })()`);
assert.ok((await off()).every((v) => v <= 1), `a tela do jogo não está no centro da janela: ${await off()}`);
ok('tela do jogo no centro da janela');
const bgShot = () => ev(`(() => { const c = document.querySelector('canvas.kanto'); return c ? c.toDataURL() : null; })()`);
const bg1 = await bgShot();
assert.ok(bg1 && bg1.length > 5000, 'o fundo de Kanto não apareceu');
await sleep(1200);
assert.notEqual(await bgShot(), bg1, 'o fundo deveria se mexer (câmera, água, pessoas)');
assert.equal(await ev(`(() => { const c = document.querySelector('canvas.kanto'); return c.getBoundingClientRect().width >= innerWidth && c.getBoundingClientRect().height >= innerHeight; })()`), true, 'o fundo não cobre a janela');
ok('fundo: Rota 1, Pallet e o mar do jogo, cobrindo a janela e se mexendo');
assert.equal(await ev(`getComputedStyle(document.querySelector('.person[data-me]')).imageRendering`), 'pixelated', 'personagens borrados: imagem de fundo sem pixelated');
ok('personagens com pixel nítido');

await sleep(700);
assert.match((await msg()) ?? '', /Bem-vindo/);
assert.equal(await ev(`getComputedStyle(document.querySelector('.msg.dialog')).color`), 'rgb(230, 8, 8)', 'a Enfermeira fala em vermelho, como no FireRed');
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
assert.ok(await has('.ask .win'), 'a Enfermeira não perguntou em que pode ajudar');
assert.equal(await focused(), 'CURAR');
await key('ArrowDown');
assert.equal(await focused(), 'SOBRE O JOÃO');
await key('z', 800);
assert.ok((await has('.card')) && !(await has('.ask')), 'SOBRE O JOÃO não abriu o cartão');
assert.equal(await hash(), '#/sobre');
assert.equal(await ev(`document.querySelectorAll('.card .badge').length`), 6, 'uma insígnia por emprego');
await key('z', 1000);
assert.match(await ev(`document.querySelector('.card').textContent`), /Palhoça/, 'A não virou o cartão');
await key('z', 600);
assert.match((await msg()) ?? '', /engenheiro|engineer/i, 'A: SOBRE MIM não leu o texto');
await closeMsg();
await key('x', 1000);
assert.match(await ev(`document.querySelector('.card').textContent`), /PROJETOS/, 'B no verso não desvirou');
await key('x', 600);
assert.ok(!(await has('.card')), 'B na frente não fechou o cartão');
ok('Enfermeira: cumprimenta, pergunta e abre o cartão de treinador; A vira, SOBRE MIM, B volta');

assert.deepEqual([await act('a'), await act('b')], ['FALAR', 'CORRER'], 'na sala o console diz que A fala e B corre');
await clickTile(11, 1);
await sleep(8 * 266 + 900);
assert.deepEqual(await me(), [11, 2, 'up']);
assert.match((await msg()) ?? '', /PC/);
assert.equal(await act('a'), 'CONTINUAR', 'com uma mensagem na tela o A continua');
await closeMsg();
assert.ok(await has('.box'), 'o PC não abriu a Box');
await key('ArrowRight', 0);   // at once: the Box takes buttons as soon as it is up
await until(handIs(124, 32), 'a Box perdeu um botão logo ao abrir', 500);
await key('ArrowLeft', 0);
await until(handIs(100, 32), 'a mão não voltou para o primeiro projeto', 500);
assert.deepEqual([await act('a'), await act('b')], ['ESCOLHER', 'VOLTAR'], 'na Box o console diz que A escolhe e B volta');
assert.equal(await ev(`document.querySelectorAll('.box-icons .box-icon').length`), 7, 'a Box deveria ter os 7 projetos');
await key('z', 300);
assert.ok(await has('.box .win'), 'A num projeto da Box não abriu as opções');
await key('z', 300);
assert.equal(await ev(`document.querySelectorAll('.box-icons .box-icon').length`), 6, 'a mão deveria tirar o projeto da Box');
await until(`localStorage.getItem('team') === '[0]'`, 'LEVAR não pôs o projeto na equipe');
await until(`${panelIs(-160)} && ${handIs(100, 32)}`, 'depois de LEVAR o painel sobe e a mão volta para onde estava');
assert.equal(await act('a'), '', 'numa casa vazia o A não faz nada e o console não mostra nada');
await tap(124, 44);   // the second project's icon
await until(handIs(124, 32), 'um clique num projeto leva a mão até ele');
assert.ok(!(await has('.box .win')), 'o primeiro clique só move a mão');
await tap(124, 44);
assert.ok(await has('.box .win'), 'um clique no projeto apontado abre as opções');
await key('x', 300);
assert.ok(!(await has('.box .win')), 'B não fechou as opções');
await tap(110, 8);   // PARTY POKéMON
await until(`${panelIs(0)} && ${handIs(104, 52)}`, 'PARTY POKéMON não desceu o painel com a mão na equipe');
await key('z', 300);
assert.match(await ev(`document.querySelector('.box > .win').textContent`), /DEVOLVER/, 'A na equipe não ofereceu DEVOLVER');
await key('z', 300);
await until(`localStorage.getItem('team') === '[]'`, 'DEVOLVER não tirou o projeto da equipe');
await until(`document.querySelectorAll('.box-icons .box-icon').length === 7 && ${panelIs(0)} && ${handIs(104, 52)}`, 'DEVOLVER: o projeto volta para a casa dele e a mão volta para a equipe');
assert.ok(await ev(`!!document.querySelector('.box-icons [data-i="0"]')`), 'o projeto devolvido deveria estar na casa 1');
await key('x', 300);
await until(`${panelIs(-160)} && ${handIs(100, 32)}`, 'B na equipe não subiu o painel');
await key('x', 600);
assert.ok(!(await has('.box')), 'B não fechou a Box');
await ev(`localStorage.setItem('team', '[0,1,2,3,4,5]')`);
await key('z', 400);   // the PC again, with a full team
await closeMsg();
await key('ArrowDown', 300);   // the seventh project, the one left in the Box
await key('z', 300);
await key('z', 300);
assert.match(await ev(`document.querySelector('.box-msg').textContent`), /cheia/, 'com 6 na equipe LEVAR deveria avisar que está cheia');
assert.equal(await act('a'), 'CONTINUAR');
await key('x', 300);
assert.equal(await ev(`document.querySelector('.box-msg').textContent`), '', 'B não fechou o aviso');
await click('[data-btn="b"] .act', 600);   // the word is part of the button
assert.ok(!(await has('.box')), 'um clique na palavra do B não apertou o B');
await ev(`localStorage.setItem('team', '[0]')`);
ok('clique no PC: abre a Box; LEVAR e DEVOLVER levam o projeto na mão; clique move a mão; equipe cheia avisa; A/B no console mudam');

await clickTile(7, 2);
await sleep(4500);
await closeMsg();
assert.equal(await focused(), 'CURAR');
await key('z', 600);
assert.match((await msg()) ?? '', /cuidar|take/, 'CURAR não começou');
await closeMsg();
await sleep(400);
assert.equal(await ev(`document.querySelectorAll('.heal-ball').length`), 1, 'uma bola por projeto da equipe na máquina');
for (let i = 0; i < 40 && !/esperar|waiting/.test((await msg()) ?? ''); i++) await sleep(200);
assert.match((await msg()) ?? '', /esperar|waiting/, 'a Enfermeira não terminou de curar');
await closeMsg();
assert.ok(!(await has('.heal')), 'a máquina não se desligou');
await sleep(1200);   // she bows, then says goodbye
assert.match((await msg()) ?? '', /novo|again/, 'depois da reverência a Enfermeira se despede');
await closeMsg();
ok('CURAR: a Enfermeira põe uma bola por projeto na máquina, o monitor pisca e ela agradece');

await clickTile(1, 6);
await sleep(12 * 266 + 900);
assert.match((await msg()) ?? '', /obras/);
await closeMsg();
ok('escada: sala de minijogos em obras');

await key('Escape');
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
for (let i = 0; i < 3; i++) await key('ArrowDown');
await key('Enter', 600);
assert.ok(await has('.tm'), 'HABILIDADES não abriu o Estojo de TM');
assert.deepEqual((await rectIn('.tm-list .cursor')).slice(0, 2), [80, 10], '▶ do Estojo fora do lugar do jogo');
const disc0 = await ev(`document.querySelector('.tm-disc').style.backgroundPosition`);
await key('ArrowDown', 400);
assert.notEqual(await ev(`document.querySelector('.tm-disc').style.backgroundPosition`), disc0, 'o disco não trocou de cor com o tipo');
await key('x', 600);
assert.ok(!(await has('.tm')) && (await has('.menu .win')), 'B não voltou do Estojo para o menu');
for (let i = 0; i < 3; i++) await key('ArrowUp');
await rightClick();
assert.ok(!(await has('.menu')), 'o botão direito (B) não fechou o menu');
ok('menu START: posição do jogo, cursor dá a volta, ajuda, HABILIDADES abre o Estojo de TM, o Red não anda, fecha');

await key('Escape');
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
await key('ArrowRight');
assert.equal(await ev(`localStorage.getItem('volume')`), '1');
assert.match(await ev(`document.querySelector('.opt-row.cur').textContent`), /BAIXO/);
await key('ArrowLeft');
assert.equal(await ev(`localStorage.getItem('volume')`), '0');
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
await key('Escape');
ok('OPÇÕES: posições do jogo; velocidade, moldura e idioma salvos; B volta ao menu');

await ev(`window.__opened = []; window.open = (u) => { window.__opened.push(u); return null; }`);
await key('Escape');
await menuTo('CONTATO');
await key('z', 400);
assert.ok(await has('.contact .win'), 'CONTATO não abriu');
assert.equal(await ev('location.hash'), '#/contato');
assert.deepEqual((await rectIn('.contact .win')).slice(0, 2), [0, 0], 'a janela de escolhas fica no canto, como no jogo');
assert.equal(await focused(), 'E-MAIL');
await key('z', 300);
assert.equal(await ev(`document.querySelectorAll('.contact .win').length`), 2, 'E-MAIL não perguntou escrever/copiar');
assert.equal((await rectIn('.contact .win:last-of-type'))[2], 224, 'a pergunta fica onde o SIM/NÃO do jogo fica');
await key('ArrowDown');
await key('z', 700);
assert.match((await msg()) ?? '', /copiado|@/);
await closeMsg();
await menuTo('GITHUB');
await key('z');
assert.deepEqual(await ev('window.__opened'), ['https://github.com/thxcabra']);
await closeMsg();
await key('x');
assert.ok(!(await has('.contact')));
assert.equal(await ev('location.hash'), '');
await key('x');
assert.ok(!(await has('.menu')));
ok('CONTATO: abre o link, e-mail pergunta escrever/copiar, endereço vai para o link');

await key('Escape');
await menuTo('PROJETOS');
await key('z', 600);
assert.ok(await has('.dex'), 'PROJETOS não abriu');
assert.equal(await hash(), '#/projetos');
assert.equal(await ev(`document.querySelectorAll('.dex .item').length`), 7);
assert.deepEqual(await rectIn('.dex-bar'), [0, 0, 240, 16]);
assert.deepEqual((await rectIn('.dex .cursor')).slice(0, 2), [20, 18], '▶ da lista fora do lugar do jogo');
assert.deepEqual((await rectIn('.dex .item .name')).slice(0, 2), [72, 18], 'nome fora do lugar do jogo');
await key('ArrowDown');
await key('ArrowDown');
assert.match(await focused(), /PITCHIQ/);
await key('z', 900);
assert.ok(await has('.summary'), 'A não abriu a página do projeto');
assert.equal(await hash(), '#/projetos/3');
assert.match(await ev(`document.querySelector('.summary').textContent`), /ALAKAZAM/);
await sleep(700);   // the two bounces
assert.deepEqual(await rectIn('.summary .mon'), [28, 33, 92, 97], 'sprite fora do lugar do resumo');
await ev(`window.__opened = []; window.open = (u) => { window.__opened.push(u); return null; }`);
await key('z');
assert.equal(await ev(`document.querySelectorAll('.summary .win').length`), 1, 'A no INFO não abriu as opções');
await key('ArrowDown');
await key('z');
assert.deepEqual(await ev('window.__opened'), ['https://github.com/thxcabra/PitchIQ']);
await key('z');
await key('z', 700);
assert.match((await msg()) ?? '', /Dados de futebol/, 'LER MAIS não mostrou o texto');
await closeMsg();
await key('ArrowRight', 500);
assert.match(await ev(`document.querySelector('.summary .sum-title').textContent`), /IMAGENS/);
await key('z', 400);
assert.equal(await ev(`document.querySelector('.show').hidden`), false, 'A em IMAGENS não ampliou');
assert.equal(await ev(`document.querySelector('.show-count').textContent`), '1/5');
await key('ArrowRight');
assert.equal(await ev(`document.querySelector('.show-count').textContent`), '2/5');
await key('x');
assert.equal(await ev(`document.querySelector('.show').hidden`), true, 'B não fechou a imagem');
await key('ArrowRight', 500);
assert.equal(await ev(`document.querySelectorAll('.summary .move').length`), 4);
await key('ArrowDown', 500);
assert.equal(await hash(), '#/projetos/4', '↓ não foi para o próximo projeto');
await key('x', 700);
assert.ok(!(await has('.summary')) && (await has('.dex')), 'B não voltou para a lista');
assert.match(await focused(), /FURIOSO/, 'a lista não ficou no último projeto visto');
await key('x', 700);
assert.ok(!(await has('.dex')) && (await has('.menu .win')), 'B não voltou da lista para o menu');
await key('x');
ok('PROJETOS: lista do Pokédex, página com 3 abas, links, LER MAIS, imagem ampliada, ↑/↓, B volta');

await key('Escape');
await menuTo('EXPERIÊNCIA');
await key('z', 600);
assert.ok(await has('.bag'), 'EXPERIÊNCIA não abriu a Bolsa');
assert.equal(await hash(), '#/experiencia');
assert.match(await ev(`document.querySelector('.bag-pocket').textContent`), /TRABALHO/);
assert.deepEqual((await rectIn('.bag-rows .cursor')).slice(0, 2), [89, 10], '▶ da Bolsa fora do lugar do jogo');
for (let i = 0; i < 4; i++) await key('ArrowDown', 150);
assert.equal(await ev(`document.querySelector('.bag-arrow.up').hidden`), false, 'a lista deveria ter rolado');
await key('z', 700);
assert.ok(((await msg()) ?? '').length > 10, 'A não leu o texto do emprego');
await closeMsg();
await key('ArrowRight', 500);
assert.match(await ev(`document.querySelector('.bag-pocket').textContent`), /FORMAÇÃO/);
assert.match(await ev(`document.querySelector('.bag-desc').textContent`), /Ciência/);
await key('x', 600);
assert.ok(!(await has('.bag')) && (await has('.menu .win')), 'B não voltou da Bolsa para o menu');
await key('x');
ok('EXPERIÊNCIA: a Bolsa com TRABALHO e FORMAÇÃO, lista rolando, A lê, B volta');

await keyDown('ArrowLeft');
assert.ok(await ev(`document.getElementById('gba').classList.contains('p-dpad')`), 'direcional não afundou');
await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowLeft', ...KEYS.ArrowLeft });
await sleep(400);
const box = await ev(`(() => { const b = document.querySelector('[data-btn="sound"]').getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; })()`);
for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x: box[0], y: box[1], button: 'left', clickCount: 1 });
await sleep(200);
assert.ok(await ev(`document.body.classList.contains('sound-on')`));
assert.equal(await ev(`localStorage.getItem('volume')`), '1', 'o botão SOM volta ao último nível escolhido (BAIXO, escolhido em OPÇÕES)');
await sleep(1500);
assert.ok(await ev(`performance.getEntriesByType('resource').some((e) => e.name.includes('music/bank.json'))`), 'com o som ligado, a música do Centro deveria carregar');
ok('direcional afunda com o teclado; botão de som liga e a música do Centro toca');
await ev(`window.__played = 0; const start = AudioBufferSourceNode.prototype.start; AudioBufferSourceNode.prototype.start = function (...a) { window.__played++; return start.apply(this, a); }`);
await clickTile(4, 7);   // the boy: walk there and talk
await sleep(3500);
assert.match((await msg()) ?? '', /correr|run/i);
assert.ok(await ev('window.__played') >= 1, 'A numa pessoa deveria tocar SE_SELECT');
await closeMsg();
ok('falar com alguém toca o som de seleção, como no jogo');

await ev('localStorage.clear()');
await send('Page.navigate', { url: `${BASE}jogar?link=1#/contato` });   // a query change forces a full load
await sleep(2200);
assert.ok(!(await has('.title')), 'o link direto não pulou o título');
assert.ok(await has('.contact .win'), 'o link direto não abriu o CONTATO');
assert.equal(await msg(), null, 'link direto não mostra as boas-vindas');
await key('x');
assert.ok(!(await has('.contact')) && !(await has('.menu')), 'B não voltou para a sala');
assert.equal(await ev('location.hash'), '');
await ev(`location.hash = '#/habilidades'`);
await sleep(600);
assert.ok(await has('.tm'), '#/habilidades não abriu o Estojo de TM');
await key('x', 600);
await ev(`location.hash = '#/nada'`);
await sleep(400);
assert.ok(!(await has('.contact')) && (await msg()) === null, 'link inválido deveria só mostrar a sala');
await ev(`location.hash = '#/projetos/7'`);
await sleep(900);
assert.match(await ev(`document.querySelector('.summary')?.textContent ?? ''`), /CHARIZARD/, '#/projetos/7 não abriu o portfólio');
await key('x', 700);
assert.match(await focused(), /PORTFOLIO/);
await key('x', 700);
assert.ok(!(await has('.dex')), 'B não voltou para a sala');
ok('links: #/contato e #/projetos/7 abrem direto, B volta para a sala, link inválido cai na sala');

await click('[data-btn="site"]', 2500);
assert.equal(await ev('location.pathname'), '/', 'o botão SITE não levou à página principal');
assert.ok(await has('.hud .start'), 'a página principal não abriu');
ok('o botão SITE do GBA leva à página principal');

await ev('sessionStorage.clear()');
await send('Page.navigate', { url: `${BASE}jogar?again=1` });
await sleep(10000);   // 0,4 s de luz + ~8,1 s da GAME FREAK
assert.ok(await has('.title .entrance'), 'depois da GAME FREAK deveria vir a entrada do título');
await sleep(5000);    // ~4,4 s de entrada
assert.ok((await has('.title')) && !(await has('.title .entrance')), 'a entrada deveria terminar no título pronto');
ok('abertura completa: GAME FREAK, entrada do título e PRESS START');

await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 750, deviceScaleFactor: 3, mobile: true });
await sleep(400);
assert.equal(await ev(`document.getElementById('gba').style.width`), '256px', 'celular em pé não virou GBA SP');
assert.ok((await off()).every((v) => v <= 1), 'no GBA SP a tela do jogo também fica no centro');
await click('[data-btn="a"]');
assert.equal(await ev(`document.querySelectorAll('[data-btn]').length`), 10, 'GBA SP: direcional, A, B, SELECT, START, SIMPLES e SOM');
await send('Emulation.clearDeviceMetricsOverride');
await sleep(400);
assert.equal(await ev(`document.getElementById('gba').style.width`), '432px', 'deitado não voltou ao GBA');
ok('celular em pé vira GBA SP e volta');

// ---------- the main page (index.html) ----------
await ev('localStorage.clear()');
await send('Page.navigate', { url: `${BASE}?lp=1` });
await sleep(2500);
assert.deepEqual(await ev(`[...document.querySelectorAll('main > section')].map((s) => s.id)`), ['topo', 'projetos', 'sobre', 'experiencia', 'habilidades', 'coisas', 'este-site', 'contato'], 'seções da landing page');
assert.equal(await ev(`document.querySelectorAll('.project').length`), 6, 'seis projetos; o portfólio fica em Este site');
assert.ok(await ev('document.documentElement.scrollWidth <= innerWidth'), 'a landing page está mais larga que a tela');
assert.deepEqual(await ev(`[...document.querySelectorAll('.project')].slice(0, 3).map((p) => p.id)`), ['projeto-1', 'projeto-3', 'projeto-6'], 'Magnifyer, PitchIQ e o site da MOIC vêm primeiro');
assert.ok(await has('#este-site #projeto-7 a[href="https://github.com/thxcabra/portfolio"]'), 'Este site leva ao código no GitHub');
assert.equal(await ev(`document.querySelectorAll('main img[src*="assets/mon/"], main img[src*="badges"], .mon, .badge-sticker').length`), 0, 'a landing page não tem mais Pokémon (só o print do GBA)');
assert.equal(await ev(`document.querySelectorAll('#coisas .piece').length`), 8, 'as oito artes do João');
assert.equal(await ev(`document.querySelectorAll('#sobre .polaroid').length`), 3, 'as três fotos do João');
assert.equal(await ev(`document.querySelectorAll('nav a[data-sec]').length`), 5, 'o menu sem Coisas que eu faço');
assert.ok(await ev(`document.querySelector('.hero .goat').complete && document.querySelector('.hero .goat').naturalWidth > 0`), 'o bode da abertura não carregou');
assert.equal(await ev(`document.querySelector('.hud .start').getAttribute('href')`), 'jogar', 'o Jogar leva ao GBA');
assert.equal(await ev(`document.querySelectorAll('#experiencia .jobs > li').length`), 2, 'só os dois cards da MOIC');
assert.equal(await ev(`document.querySelectorAll('#experiencia .jobs details li').length`), 4, 'os quatro clientes dentro do card de social media');
assert.equal(await ev(`document.querySelectorAll('#sobre a[href^="https://store.steampowered.com/app/"]').length`), 7, 'os jogos com link da Steam');
assert.equal(await ev(`document.querySelectorAll('[data-deck] [data-track]').length`), 14, 'o toca-fitas com as 14 músicas');
await ev(`document.getElementById('habilidades').scrollIntoView({ behavior: 'instant' })`);
await sleep(300);
const dialog = () => ev(`document.querySelector('.dialog').textContent.replace(/\\s+/g, ' ')`);
await ev('Math.random = () => 0.5');   // the d20 comes up 11
await click('.skill[data-move="PYTHON"]', 1400);
assert.match(await dialog(), /PYTHON \[Lendário: Sucesso\] d20 11 \+ 18 = 29/, 'o teste de habilidade não apareceu');
await ev('Math.random = () => 0');   // a 1: critical failure
await click('.skill[data-move="PYTHON"]', 1400);
assert.match(await dialog(), /Falha crítica.*dois-pontos/, 'um 1 no d20 não deu falha crítica');
assert.ok(await has('.dice.cracked'), 'o dado não rachou');
await ev('Math.random = () => 0.6');   // a 13: the lights go out
await click('.dice', 1400);
assert.ok(await has('.lights-out'), 'um 13 não apagou a luz');
await sleep(2000);
await ev('Math.random = () => 0.95');   // a 20: the party
await click('.skill[data-move="UNITY"]', 1400);
assert.ok((await has('.confetti')) && (await has('.table.cheer')), 'um 20 não fez festa');
for (let i = 0; i < 3; i++) await click('.dice', 80);   // seven rolls in a row: the goat eats the die
assert.ok(await has('.table.eating'), 'o bode não comeu o dado');
await sleep(1400);
assert.match(await dialog(), /bode comeu o dado/, 'o resultado atrasado apagou o aviso do bode');
await click('.hud .lang', 600);
assert.equal(await ev('document.documentElement.lang'), 'en');
assert.equal(await ev(`document.querySelector('#projetos h2').textContent`), 'Projects');
assert.equal(await ev(`localStorage.getItem('lang')`), '"en"', 'o idioma da landing page fica salvo (o mesmo do GBA)');
await click('.hud .lang', 600);
assert.equal(await ev(`document.querySelector('#projetos h2').textContent`), 'Projetos');
await ev(`document.querySelector('#projeto-1 .shot').scrollIntoView({ block: 'center', behavior: 'instant' })`);
await sleep(400);
await click('#projeto-1 .shot', 400);
assert.ok(await ev(`document.querySelector('dialog.viewer').open`), 'o print não abriu');
assert.match(await ev(`document.querySelector('.viewer img').getAttribute('src')`), /magnifyer/);
await click('.v-next', 300);
assert.match(await ev(`document.querySelector('.v-count').textContent`), /2 de 2/);
await key('Escape', 300);
assert.ok(!(await ev(`document.querySelector('dialog.viewer').open`)), 'Esc não fechou os prints');
ok('landing page: seções, 6 projetos e Este site, Jogar, clientes da MOIC, jogos na Steam, toca-fitas, fotos, teste de habilidade e os segredos do d20, PT/EN salvo, prints');

await send('Page.navigate', { url: `${BASE}?old=1#/projetos/3` });
await sleep(2500);
assert.equal(await hash(), '#projeto-3', 'o link antigo vira a âncora nova');
assert.ok(await ev(`(() => { const t = document.getElementById('projeto-3').getBoundingClientRect().top; return t >= 0 && t < innerHeight / 2; })()`), 'não rolou até o projeto 3');
ok('landing page: link antigo #/projetos/3 rola até o projeto');
await click('.hud .start', 2500);
assert.equal(await ev('location.pathname'), '/jogar', 'o Jogar não abriu o GBA');
assert.ok(await has('#gba'), 'o GBA não carregou em /jogar');
ok('landing page: o Jogar abre o GBA em /jogar');

await send('Page.navigate', { url: `${BASE}?secret=1` });
await sleep(2500);
for (const k of ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']) await key(k, 60);
await sleep(200);
assert.ok(await has('.signal-lost'), 'o código Konami não interrompeu a transmissão');
await sleep(400);
await key('Escape', 300);
assert.ok(!(await has('.signal')), 'uma tecla não fechou a interrupção');
await ev(`location.hash = '#/sinal'`);
await sleep(400);
assert.ok(await has('.signal-weak'), '#/sinal não abriu a porta do ARG');
await click('.signal-weak', 300);
assert.ok(!(await has('.signal')) && (await hash()) === '', 'o clique não fechou a porta do ARG');
ok('landing page: código Konami interrompe a transmissão; #/sinal abre a porta do ARG');

await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
await send('Page.navigate', { url: `${BASE}?small=1` });
await sleep(2500);
assert.ok(await ev('document.documentElement.scrollWidth <= innerWidth'), 'rolagem horizontal no celular');
assert.equal(await ev(`getComputedStyle(document.querySelector('.hero .goat')).animationName`), 'none', 'com movimento reduzido nada se move');
await click('.menu-btn', 300);
assert.ok(await ev(`getComputedStyle(document.querySelector('#nav-links')).display !== 'none'`), 'o menu do celular não abriu');
await send('Emulation.clearDeviceMetricsOverride');
await send('Emulation.setEmulatedMedia', { features: [] });
ok('landing page: celular sem rolagem horizontal e com menu; movimento reduzido para tudo');

assert.deepEqual(errors, [], 'erros no console: ' + errors.join('\n'));
ok('nenhum erro no console');

ws.close();
edge.kill();
server.close();
console.log('e2e ok');
process.exit(0);
