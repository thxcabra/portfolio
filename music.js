// The game's music, made from its own data: the MIDI files of sound/songs/midi and the instrument bank
// (voicegroups, samples, programmable waves) that tools/build_assets.py takes from the decomp, played the
// way FireRed's m4a engine plays them (m4a.c, m4a_1.s): 24 ticks a beat counted at 59.7275 frames a
// second (tempo/150 ticks a frame), up to 5 DirectSound channels with their 0–255 envelopes, mixed with
// the master volume (12/16) and clipped like the 8-bit mixer, one of each GB channel (two squares, the
// wave, the noise) with 4-bit envelopes, the triangle LFO, the song's reverb. A song is rendered once
// into an AudioBuffer; a song with loop markers ([ and ]) is rendered as its intro plus two passes of the
// loop and loops over the second pass, so notes still ringing at the loop point carry over.

const FPS = 59.7275;
export const RATE = 32768;    // output samples a second
const MAX_DS = 5;             // m4aSoundInit: 5 DirectSound channels
const MASTER = 12 / 16;       // m4aSoundInit: master volume 12
const PSG = 0.47;             // one GB channel at full volume against the DirectSound mix (PSG 100%, DMA 50%)
const DUTY = [0.125, 0.25, 0.5, 0.75];
const WAVE_VOL = [0, 0, 0.25, 0.25, 0.25, 0.25, 0.5, 0.5, 0.5, 0.5, 0.75, 0.75, 0.75, 0.75, 1, 1];   // gCgb3Vol, roughly
const NOISE = [...Array.from({ length: 56 }, (_, i) => ((0xd - (i >> 2)) << 4) | (7 - (i & 3))), 3, 2, 1, 0];   // gNoiseTable

let bankP = null;
const b64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const prepareBank = (b) => {
  for (const s of Object.values(b.samples)) s.pcm ??= new Int8Array(b64(s.data).buffer);
  return b;
};
function loadBank() {
  bankP ??= fetch('assets/music/bank.json').then((r) => r.json()).then(prepareBank);
  return bankP;
}

// ---------- MIDI: notes (with their length), controllers, programs, bends, tempo and loop marks ----------
function parseMidi(buf) {
  const u = new Uint8Array(buf);
  let p = 0;
  const u32 = () => (u[p++] << 24 | u[p++] << 16 | u[p++] << 8 | u[p++]) >>> 0;
  const u16 = () => (u[p++] << 8) | u[p++];
  const vlq = () => { let v = 0, b; do { b = u[p++]; v = (v << 7) | (b & 127); } while (b & 128); return v; };
  p = 8;
  u16();
  const tracks = u16(), division = u16();
  const events = [];
  for (let t = 0; t < tracks; t++) {
    while (String.fromCharCode(u[p], u[p + 1], u[p + 2], u[p + 3]) !== 'MTrk') p += 8 + ((u[p + 4] << 24 | u[p + 5] << 16 | u[p + 6] << 8 | u[p + 7]) >>> 0);
    p += 4;
    const end = u32() + p;
    let tick = 0, status = 0;
    while (p < end) {
      tick += vlq();
      if (u[p] & 128) status = u[p++];
      const type = status & 0xf0, ch = status & 15;
      if (status === 0xff) {
        const meta = u[p++], len = vlq(), data = u.subarray(p, p + len);
        p += len;
        if (meta === 0x51) events.push({ tick, kind: 'tempo', us: (data[0] << 16) | (data[1] << 8) | data[2] });
        else if (meta >= 1 && meta <= 7) events.push({ tick, kind: 'mark', text: String.fromCharCode(...data) });
      } else if (status === 0xf0 || status === 0xf7) {
        p += vlq();
      } else if (type === 0x90 || type === 0x80) {
        const key = u[p++], vel = u[p++];
        events.push({ tick, kind: type === 0x90 && vel ? 'on' : 'off', ch, key, vel });
      } else if (type === 0xb0) events.push({ tick, kind: 'cc', ch, n: u[p++], v: u[p++] });
      else if (type === 0xc0) events.push({ tick, kind: 'prog', ch, v: u[p++] });
      else if (type === 0xe0) { p++; events.push({ tick, kind: 'bend', ch, v: u[p++] - 64 }); }
      else if (type === 0xa0) p += 2;
      else if (type === 0xd0) p += 1;
    }
    p = end;
  }
  // m4a ticks (24 a beat); a note gets its length from the first matching note off (mid2agb -E)
  const T = (tick) => Math.round((tick * 24) / division);
  events.sort((a, b) => a.tick - b.tick);
  const open = new Map(), out = [];
  for (const e of events) {
    const ev = { ...e, tick: T(e.tick) };
    if (e.kind === 'on') {
      const k = `${e.ch}:${e.key}`;
      if (!open.has(k)) open.set(k, []);
      open.get(k).push(ev);
      out.push(ev);
    } else if (e.kind === 'off') {
      const n = open.get(`${e.ch}:${e.key}`)?.shift();
      if (n) n.len = Math.max(1, ev.tick - n.tick);
    } else out.push(ev);
  }
  out.forEach((e) => { if (e.kind === 'on' && !e.len) e.len = 24; });
  return out;
}

// ---------- the voices of a program and key (voice_keysplit, voice_keysplit_all) ----------
function voiceFor(bank, group, prog, key) {
  let v = bank.voices[bank.groups[group] + prog];
  let playKey = key, rhythmPan = 0;
  if (!v) return null;
  if (v[0] === 'voice_keysplit') {
    const table = bank.tables[v[2]];
    const i = table.map[key - table.first] ?? 0;
    v = bank.voices[bank.groups[v[1]] + i];
  } else if (v[0] === 'voice_keysplit_all') {
    v = bank.voices[bank.groups[v[1]] + key];
    if (!v) return null;
    playKey = Number(v[1]);   // a drum plays at its own base key
    if (Number(v[2])) rhythmPan = (Number(v[2]) - 64) * 2;
  }
  return v && { v, playKey, rhythmPan };
}

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// Renders a song: { left, right, loop: [start, end] in samples or null }. Also used by check.mjs.
export async function render(bank, name, midi) {
  prepareBank(bank);
  const song = bank.songs[name];
  let events = parseMidi(midi);
  const mark = (t) => events.find((e) => e.kind === 'mark' && e.text === t)?.tick;
  const L0 = mark('['), L1 = mark(']');
  let endTick = Math.max(...events.map((e) => e.tick + (e.len ?? 0)));
  let loopTicks = null;
  if (L0 !== undefined && L1 !== undefined && L1 > L0) {   // intro, the loop, and the loop again
    const body = events.filter((e) => e.tick >= L0 && e.tick < L1).map((e) => ({ ...e, tick: e.tick + (L1 - L0) }));
    events = [...events.filter((e) => e.tick < L1), ...body];
    endTick = 2 * L1 - L0;
    loopTicks = [L1, endTick];
  }
  const byTick = new Map();
  for (const e of events) {
    if (!byTick.has(e.tick)) byTick.set(e.tick, []);
    byTick.get(e.tick).push(e);
  }
  const tracks = Array.from({ length: 16 }, () => ({
    prog: 0, vol: (100 * song.volume) / 127, pan: 0, bend: 0, bendRange: 2, tune: 0,
    mod: 0, modT: 0, lfoSpeed: 22, lfoSpeedC: 0, lfoDelay: 0, lfoDelayC: 0, modM: 0,
  }));
  const voices = [];   // sounding channels
  const cgb = {};      // GB channel kind -> voice
  let bpm = 150, tempoC = 0, tick = 0, frame = 0, length = 0;
  const chunksL = [], chunksR = [];
  const loopAt = [null, null];   // the samples where the loop's ticks were reached
  let prevL = new Float32Array(0), prevR = new Float32Array(0);

  function trackVol(t) {   // TrkVolPitSet
    let x = (t.vol * 64) >> 5;
    if (t.modT === 1) x = (x * (t.modM + 128)) >> 7;
    let y = 2 * t.pan;
    if (t.modT === 2) y += t.modM;
    return [x, clamp(y, -128, 127)];
  }
  function chanVolumes(c) {
    const t = tracks[c.ch];
    const [x, y0] = trackVol(t);
    const y = clamp(y0 + c.rhythmPan, -128, 127);
    const mr = ((y + 128) * x) >> 8, ml = ((127 - y) * x) >> 8;
    return [(c.vel * ml) >> 7, (c.vel * mr) >> 7];
  }
  function chanPitch(c) {
    const t = tracks[c.ch];
    let x = (t.tune + t.bend * t.bendRange) * 4;
    if (t.modT === 0) x += 16 * t.modM;
    return c.key + x / 256;
  }

  function noteOn(e) {
    const t = tracks[e.ch];
    const found = voiceFor(bank, song.group, t.prog, e.key);
    if (!found) return;
    const { v, playKey, rhythmPan } = found;
    const kind = v[0].replace('voice_', '').replace(/_alt$/, '');
    const c = { ch: e.ch, key: playKey, vel: e.vel, gate: e.len, rhythmPan, env: 0, state: 'attack', count: 0, pos: 0, phase: 0, lfsr: 0x7fff, born: tick };
    if (kind.startsWith('directsound')) {
      Object.assign(c, { kind: 'ds', sample: bank.samples[v[3]], fixed: kind.includes('no_resample'), reverse: kind.includes('reverse'), a: +v[4], d: +v[5], s: +v[6], r: +v[7] });
      if (!c.sample) return;
      if (c.reverse) c.pos = c.sample.end - 1;
      const ds = voices.filter((x) => x.kind === 'ds');
      if (ds.length >= MAX_DS) {   // steal: a channel already letting go first, else the oldest
        const victim = ds.find((x) => x.state === 'release') ?? ds.reduce((a, b) => (a.born <= b.born ? a : b));
        voices.splice(voices.indexOf(victim), 1);
      }
    } else {
      const gb = { square_1: 'sq1', square_2: 'sq2', programmable_wave: 'wave', noise: 'noise' }[kind];
      if (!gb) return;
      Object.assign(c, { kind: gb, a: +v.at(-4), d: +v.at(-3), s: +v.at(-2), r: +v.at(-1) });
      if (gb === 'sq1') c.duty = DUTY[+v[4] & 3];
      if (gb === 'sq2') c.duty = DUTY[+v[3] & 3];
      if (gb === 'wave') c.wave = bank.waves[v[3]];
      if (gb === 'noise') c.short = +v[3] & 1;
      if (cgb[gb]) voices.splice(voices.indexOf(cgb[gb]), 1);   // one note per GB channel: the new one takes it
      cgb[gb] = c;
    }
    if (t.lfoDelay) t.lfoDelayC = t.lfoDelay;
    voices.push(c);
  }

  function doTick() {
    for (const e of byTick.get(tick) ?? []) {
      const t = tracks[e.ch];
      if (e.kind === 'tempo') bpm = 2 * Math.round(60e6 / e.us / 2);
      else if (e.kind === 'on') noteOn(e);
      else if (e.kind === 'prog') t.prog = e.v;
      else if (e.kind === 'bend') t.bend = e.v;
      else if (e.kind === 'cc') {
        if (e.n === 7) t.vol = (e.v * song.volume) / 127;
        else if (e.n === 10) t.pan = e.v - 64;
        else if (e.n === 1) { t.mod = e.v; if (!e.v) t.modM = t.lfoSpeedC = 0; }
        else if (e.n === 20) t.bendRange = e.v;
        else if (e.n === 21) { t.lfoSpeed = e.v; t.modM = t.lfoSpeedC = 0; }
        else if (e.n === 22) t.modT = e.v;
        else if (e.n === 24) t.tune = e.v - 64;
        else if (e.n === 26) t.lfoDelay = e.v;
      }
    }
    for (const t of tracks) {   // the triangle LFO, once a tick
      if (!t.lfoSpeed || !t.mod) continue;
      if (t.lfoDelayC) { t.lfoDelayC--; continue; }
      t.lfoSpeedC = (t.lfoSpeedC + t.lfoSpeed) & 255;
      const r = t.lfoSpeedC, s = (r << 24) >> 24;
      t.modM = (t.mod * (((r - 64) << 24 >> 24) < 0 ? s : 128 - r)) >> 6;
    }
    for (const c of voices) {   // gate time: the note lets go when its length runs out
      if (c.gate > 0 && --c.gate === 0 && c.state !== 'off') c.state = 'release';
    }
    tick++;
  }

  function envelopes() {
    for (const c of voices) {
      if (c.kind === 'ds') {
        if (c.state === 'attack') {
          c.env += c.a;
          if (c.env >= 255) { c.env = 255; c.state = 'decay'; }
        } else if (c.state === 'decay') {
          c.env = (c.env * c.d) >> 8;
          if (c.env <= c.s) { c.env = c.s; c.state = 'sustain'; }
        } else if (c.state === 'release') {
          c.env = (c.env * c.r) >> 8;
          if (c.env <= 0) c.state = 'off';
        }
      } else {
        const [l, r] = chanVolumes(c);
        const goal = Math.min(15, (l + r) >> 4), sustain = (goal * c.s + 15) >> 4;
        c.count++;
        if (c.state === 'attack') {
          if (!c.a) { c.env = goal; c.state = 'decay'; c.count = 0; }
          else if (c.count >= c.a) { c.count = 0; if (++c.env >= goal) { c.env = goal; c.state = 'decay'; } }
        } else if (c.state === 'decay') {
          if (!c.d || c.env <= sustain) { c.state = 'sustain'; c.env = c.d ? sustain : c.env; }
          else if (c.count >= c.d) { c.count = 0; c.env--; }
        } else if (c.state === 'release') {
          if (!c.r) c.state = 'off';
          else if (c.count >= c.r) { c.count = 0; if (--c.env <= 0) c.state = 'off'; }
        }
      }
    }
    for (let i = voices.length - 1; i >= 0; i--) {
      if (voices[i].state === 'off') {
        const c = voices[i];
        if (cgb[c.kind] === c) delete cgb[c.kind];
        voices.splice(i, 1);
      }
    }
  }

  function synth(n) {
    const dsL = new Float32Array(n), dsR = new Float32Array(n), psL = new Float32Array(n), psR = new Float32Array(n);
    if (song.reverb) {   // the mixer starts each frame from the last one, scaled by the reverb
      const k = song.reverb / 512;
      for (let i = 0; i < n && i < prevL.length; i++) dsL[i] = dsR[i] = (prevL[i] + prevR[i]) * k;
    }
    for (const c of voices) {
      const [vl, vr] = chanVolumes(c);
      const pitch = chanPitch(c);
      if (c.kind === 'ds') {
        const s = c.sample, pcm = s.pcm;
        const step = (c.fixed ? 13379 : (s.pitch / 1024) * 2 ** ((pitch - 60) / 12)) / RATE;   // no_resample: one sample per mixer step (13379 Hz)
        const gl = ((c.env / 255) * vl) / 256 / 128, gr = ((c.env / 255) * vr) / 256 / 128;
        for (let i = 0; i < n; i++) {
          let p = c.pos;
          if (c.reverse) {
            if (p < 0) { c.state = 'off'; break; }
          } else if (p >= s.end) {
            if (s.loop < 0) { c.state = 'off'; break; }
            p = c.pos = s.loop + ((p - s.end) % (s.end - s.loop));
          }
          const i0 = p | 0, f = p - i0;
          const next = i0 + 1 < s.end ? pcm[i0 + 1] : s.loop >= 0 ? pcm[s.loop] : 0;
          const v = pcm[i0] + (next - pcm[i0]) * f;
          dsL[i] += v * gl;
          dsR[i] += v * gr;
          c.pos += c.reverse ? -step : step;
        }
      } else {
        // GB channels: hard left/right when one side is at most half the other (CgbPan)
        const amp = (c.kind === 'wave' ? WAVE_VOL[c.env] : c.env / 15) * PSG;
        const toL = vl / 2 >= vr ? 1 : vr / 2 >= vl ? 0 : 1, toR = vr / 2 >= vl ? 1 : vl / 2 >= vr ? 0 : 1;
        let f = 440 * 2 ** ((pitch - 69) / 12);
        if (c.kind === 'wave') f /= 2;   // the wave channel runs its 32 steps at half the square's rate
        if (c.kind === 'noise') {
          const nr = NOISE[clamp(Math.round(pitch) - 21, 0, 59)], sh = nr >> 4, r = nr & 7;
          f = 524288 / (r || 0.5) / 2 ** (sh + 1);
        }
        const step = f / RATE;
        for (let i = 0; i < n; i++) {
          let v;
          if (c.kind === 'noise') {
            c.phase += step;
            while (c.phase >= 1) {
              c.phase -= 1;
              const bit = (c.lfsr ^ (c.lfsr >> 1)) & 1;
              c.lfsr = (c.lfsr >> 1) | (bit << 14);
              if (c.short) c.lfsr = (c.lfsr & ~0x40) | (bit << 6);
            }
            v = (c.lfsr & 1 ? -0.5 : 0.5);
          } else if (c.kind === 'wave') {
            c.phase = (c.phase + step) % 1;
            v = (c.wave[(c.phase * 32) | 0] - 7.5) / 15;
          } else {
            c.phase = (c.phase + step) % 1;
            v = (c.phase < c.duty ? 1 : 0) - c.duty;
          }
          v *= amp;
          psL[i] += v * toL;
          psR[i] += v * toR;
        }
      }
    }
    prevL = dsL.slice();
    prevR = dsR.slice();
    for (let i = 0; i < n; i++) {   // DirectSound: master volume, then the 8-bit clip; then the GB channels
      dsL[i] = 0.6 * (clamp(dsL[i] * MASTER, -1, 127 / 128) + psL[i]);
      dsR[i] = 0.6 * (clamp(dsR[i] * MASTER, -1, 127 / 128) + psR[i]);
    }
    chunksL.push(dsL);
    chunksR.push(dsR);
    length += n;
  }

  const ticksDone = () => tick > endTick;
  let tail = 0;
  while (true) {
    if (!ticksDone()) {
      tempoC += bpm;
      while (tempoC >= 150 && !ticksDone()) { tempoC -= 150; doTick(); }
      if (loopTicks) loopTicks.forEach((t, k) => { if (loopAt[k] === null && tick > t) loopAt[k] = length; });
    } else if (!loopTicks) {
      if (!voices.length || ++tail > 3 * FPS) break;   // a jingle ends when its last note has faded
    } else break;
    envelopes();
    synth(Math.round(((frame + 1) * RATE) / FPS) - Math.round((frame * RATE) / FPS));
    frame++;
    if (frame % 600 === 0) await new Promise((r) => setTimeout(r));   // let the page breathe
  }
  const join = (chunks) => {
    const out = new Float32Array(length);
    let o = 0;
    for (const c of chunks) { out.set(c, o); o += c.length; }
    return out;
  };
  const loop = loopTicks ? [loopAt[0] ?? 0, loopAt[1] ?? length] : null;
  return { left: join(chunksL), right: join(chunksR), loop };
}

// ---------- playing ----------
const midis = new Map(), rendered = new Map(), buffers = new Map();
const midiOf = (name) => {
  if (!midis.has(name)) midis.set(name, fetch(`assets/music/${name}.mid`).then((r) => r.arrayBuffer()));
  return midis.get(name);
};
const renderOf = (name) => {
  if (!rendered.has(name)) rendered.set(name, Promise.all([loadBank(), midiOf(name)]).then(([bank, midi]) => render(bank, name, midi)));
  return rendered.get(name);
};

// A song as an AudioBuffer, with its loop in seconds (null for a jingle).
export function songBuffer(ctx, name) {
  if (!buffers.has(name)) {
    buffers.set(name, renderOf(name).then(({ left, right, loop }) => {
      const buffer = ctx.createBuffer(2, left.length, RATE);
      buffer.copyToChannel(left, 0);
      buffer.copyToChannel(right, 1);
      return { buffer, loop: loop && [loop[0] / RATE, loop[1] / RATE] };
    }));
  }
  return buffers.get(name);
}

// How long a song's notes last, from its MIDI alone (m4a timing): for jingles played with the sound off.
export async function songSeconds(name) {
  const events = parseMidi(await midiOf(name));
  let end = 0;
  for (const e of events) end = Math.max(end, e.tick + (e.len ?? 0));
  let bpm = 150, frames = 0, tick = 0, acc = 0;
  const tempo = new Map(events.filter((e) => e.kind === 'tempo').map((e) => [e.tick, 2 * Math.round(60e6 / e.us / 2)]));
  while (tick <= end) {
    acc += bpm;
    while (acc >= 150 && tick <= end) { acc -= 150; bpm = tempo.get(tick) ?? bpm; tick++; }
    frames++;
  }
  return frames / FPS;
}
