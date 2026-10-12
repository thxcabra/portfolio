// Game sounds through Web Audio. Silent until enabled; any failure stays silent.
const SFX = ['select', 'win_open', 'pc_on', 'dex_scroll', 'dex_page', 'success', 'shiny'];
// The ripped effects peak around 5–17% of full scale and the cries near 100%;
// these gains bring both to roughly a third of full scale.
const SFX_GAIN = 3;
const CRY_GAIN = 0.4;
const cache = new Map();
let ctx = null;
let enabled = false;

function load(url) {
  if (!cache.has(url)) {
    cache.set(url, fetch(url).then((r) => r.arrayBuffer()).then((b) => ctx.decodeAudioData(b)));
  }
  return cache.get(url);
}

// Must run inside a user gesture the first time it turns sound on (browser autoplay rules).
export function setEnabled(on) {
  enabled = on;
  if (!on) return;
  try {
    ctx ||= new AudioContext();
    ctx.resume();
    SFX.forEach((name) => load(`assets/sfx/${name}.wav`).catch(() => {}));
  } catch {
    ctx = null;
  }
}

function play(url, delay, gain) {
  if (!enabled || !ctx) return;
  load(url)
    .then((buffer) => {
      const src = ctx.createBufferSource();
      const volume = ctx.createGain();
      src.buffer = buffer;
      volume.gain.value = gain;
      src.connect(volume).connect(ctx.destination);
      src.start(ctx.currentTime + delay);
    })
    .catch(() => cache.delete(url));
}

export const sfx = (name, delay = 0) => play(`assets/sfx/${name}.wav`, delay, SFX_GAIN);
export const cry = (dex, delay = 0) => play(`assets/cries/${dex}.wav`, delay, CRY_GAIN);
