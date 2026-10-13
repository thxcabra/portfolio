// Game sounds through Web Audio, all through one volume. Silent until a level is set (the first
// time inside a user gesture, for the browser's autoplay rules); any failure stays silent.
const SFX = ['select', 'win_open', 'pc_on', 'dex_scroll', 'dex_page', 'success', 'shiny', 'bump'];
// The ripped effects peak around 5–17% of full scale and the cries near 100%: these even them out.
const SFX_GAIN = 3;
const CRY_GAIN = 0.4;
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
  if (!n) return;
  try {
    ctx ||= new AudioContext();
    if (!master) {
      master = ctx.createGain();
      master.connect(ctx.destination);
      master.gain.value = VOLUMES[n];
    }
    ctx.resume();
    SFX.forEach((name) => load(`assets/sfx/${name}.wav`).catch(() => {}));
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
