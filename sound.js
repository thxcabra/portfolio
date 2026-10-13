// Game sounds through Web Audio, all through one volume. Silent until a level is set (the first
// time inside a user gesture, for the browser's autoplay rules); any failure stays silent.
import { songBuffer, songSeconds } from './music.js';

const SFX = ['select', 'win_open', 'pc_on', 'dex_scroll', 'dex_page', 'success', 'shiny', 'bump', 'card_flip', 'card_flipping', 'card_open', 'bag_cursor', 'bag_pocket', 'ball'];
// The ripped effects peak around 5–17% of full scale and the cries near 100%: these even them out.
const SFX_GAIN = 3;
const CRY_GAIN = 0.4;
const MUSIC_GAIN = 1;
export const VOLUMES = [0, 0.2, 0.4, 0.75];   // DESLIGADO, BAIXO, MÉDIO, ALTO
const cache = new Map();
let ctx = null;
let master = null;
let level = 0;

function load(url) {
  if (!cache.has(url)) {
    cache.set(url, fetch(url).then((r) => r.arrayBuffer()).then((b) => ctx.decodeAudioData(b)));
  }
  return cache.get(url);
}

export function setVolume(n) {
  level = n;
  if (master) master.gain.value = VOLUMES[n];
  if (!n) return void stopBgm();
  try {
    ctx ||= new AudioContext();
    if (!master) {
      master = ctx.createGain();
      master.connect(ctx.destination);
      master.gain.value = VOLUMES[n];
    }
    ctx.resume();
    SFX.forEach((name) => load(`assets/sfx/${name}.wav`).catch(() => {}));
    if (!bgm) startBgm(0);
  } catch {
    ctx = null;
    master = null;
  }
}

function play(url, delay, gain) {
  if (!level || !ctx) return;
  load(url)
    .then((buffer) => {
      const src = ctx.createBufferSource();
      const volume = ctx.createGain();
      src.buffer = buffer;
      volume.gain.value = gain;
      src.connect(volume).connect(master);
      src.start(ctx.currentTime + delay);
    })
    .catch(() => cache.delete(url));
}

export const sfx = (name, delay = 0) => play(`assets/sfx/${name}.wav`, delay, SFX_GAIN);
export const cry = (dex, delay = 0) => play(`assets/cries/${dex}.wav`, delay, CRY_GAIN);

// ---------- music (music.js): one background song; a jingle pauses it and it carries on after ----------
let wanted = null;   // the background song the game is in
let bgm = null;      // the one playing: { name, src, gain, startedAt, loop, duration }
let jingles = 0;

export function music(name) {
  if (name === wanted && bgm) return;
  wanted = name;
  stopBgm();
  startBgm(0);
}

function startBgm(offset) {
  if (!level || !ctx || !wanted || jingles) return;
  const me = (bgm = { name: wanted, offset });
  songBuffer(ctx, me.name).then(({ buffer, loop }) => {
    if (bgm !== me || !level || jingles) return;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    if (loop) Object.assign(src, { loop: true, loopStart: loop[0], loopEnd: loop[1] });
    const gain = ctx.createGain();
    gain.gain.value = MUSIC_GAIN;
    src.connect(gain).connect(master);
    src.start(0, offset);
    Object.assign(me, { src, gain, startedAt: ctx.currentTime - offset, loop, duration: buffer.duration });
  }).catch(() => {});
}

// Stops the background song; returns where it was (seconds into the buffer).
function stopBgm() {
  if (!bgm) return null;
  let at = bgm.offset ?? 0;
  if (bgm.src) {
    at = ctx.currentTime - bgm.startedAt;
    if (bgm.loop && at > bgm.loop[1]) at = bgm.loop[0] + ((at - bgm.loop[0]) % (bgm.loop[1] - bgm.loop[0]));
    at = Math.min(at, bgm.duration);
    bgm.src.stop();
  }
  bgm = null;
  return at;
}

// FadeOutBGM: the song fades to nothing and stops.
export function fadeOutMusic(seconds) {
  wanted = null;
  const old = bgm;
  bgm = null;
  if (!old?.src) return;
  const g = old.gain.gain;
  g.setValueAtTime(g.value, ctx.currentTime);
  g.linearRampToValueAtTime(0, ctx.currentTime + seconds);
  setTimeout(() => old.src.stop(), seconds * 1000 + 50);
}

// PlayFanfare: a jingle over the paused background song; resolves when it is over (also with the sound off).
export async function fanfare(name) {
  jingles++;
  const at = stopBgm();
  try {
    if (level && ctx) {
      const { buffer } = await songBuffer(ctx, name);
      await new Promise((resolve) => {
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        const gain = ctx.createGain();
        gain.gain.value = MUSIC_GAIN;
        src.connect(gain).connect(master);
        src.onended = resolve;
        src.start();
      });
    } else {
      const seconds = Math.min(10, await songSeconds(name));
      await new Promise((r) => setTimeout(r, 1000 * seconds));
    }
  } catch { /* no music: just go on */ }
  jingles--;
  if (!jingles) startBgm(at ?? 0);
}
