// Procedural Web Audio. No external assets.

let ctx = null;
let masterGain = null;
let muted = false;

function ensure() {
  if (ctx) return ctx;
  try {
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    ctx = new C();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.4;
    masterGain.connect(ctx.destination);
  } catch (_) {
    ctx = null;
  }
  return ctx;
}

function unlock() {
  const c = ensure();
  if (!c) return;
  if (c.state === 'suspended') c.resume().catch(() => {});
}

// Bind unlock on first user gesture.
['pointerdown', 'keydown', 'touchstart'].forEach((evt) =>
  window.addEventListener(evt, unlock, { once: false, passive: true })
);

function tone({ freq = 440, dur = 0.12, type = 'square', vol = 0.2, slide = 0, attack = 0.005, release = 0.06 } = {}) {
  if (muted) return;
  const c = ensure();
  if (!c) return;
  const t = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slide) osc.frequency.linearRampToValueAtTime(freq + slide, t + dur);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(vol, t + attack);
  gain.gain.linearRampToValueAtTime(0.0001, t + dur + release);
  osc.connect(gain).connect(masterGain);
  osc.start(t);
  osc.stop(t + dur + release + 0.05);
}

function noiseBurst({ dur = 0.18, vol = 0.18, lp = 1200 } = {}) {
  if (muted) return;
  const c = ensure();
  if (!c) return;
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = c.createBufferSource();
  src.buffer = buf;
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = lp;
  const gain = c.createGain();
  gain.gain.value = vol;
  src.connect(filter).connect(gain).connect(masterGain);
  src.start();
}

export const Audio = {
  setMuted(m) { muted = m; },
  isMuted() { return muted; },
  toggleMute() { muted = !muted; return muted; },

  click() { tone({ freq: 660, dur: 0.05, type: 'square', vol: 0.12 }); },
  hover() { tone({ freq: 880, dur: 0.03, type: 'sine', vol: 0.06 }); },
  dash()  { tone({ freq: 520, dur: 0.12, type: 'sawtooth', vol: 0.15, slide: 240 }); },
  correct() {
    tone({ freq: 660, dur: 0.08, type: 'square', vol: 0.18 });
    setTimeout(() => tone({ freq: 990, dur: 0.10, type: 'square', vol: 0.18 }), 70);
  },
  wrong() {
    tone({ freq: 220, dur: 0.18, type: 'sawtooth', vol: 0.22, slide: -120 });
    noiseBurst({ dur: 0.12, vol: 0.10, lp: 800 });
  },
  portalEnter() {
    tone({ freq: 440, dur: 0.10, type: 'sine', vol: 0.18, slide: 660 });
    setTimeout(() => tone({ freq: 1100, dur: 0.18, type: 'sine', vol: 0.16, slide: 660 }), 60);
  },
  collide() { noiseBurst({ dur: 0.10, vol: 0.18, lp: 1400 }); },
  explode() {
    noiseBurst({ dur: 0.35, vol: 0.32, lp: 600 });
    tone({ freq: 110, dur: 0.30, type: 'sawtooth', vol: 0.25, slide: -60 });
  },
  beep(freq = 440) { tone({ freq, dur: 0.04, type: 'square', vol: 0.08 }); },
  alarm() {
    tone({ freq: 720, dur: 0.10, type: 'square', vol: 0.18 });
    setTimeout(() => tone({ freq: 480, dur: 0.10, type: 'square', vol: 0.18 }), 110);
  },
  collapse() {
    noiseBurst({ dur: 0.6, vol: 0.3, lp: 500 });
    tone({ freq: 90, dur: 0.6, type: 'sawtooth', vol: 0.22, slide: -40 });
  },
};
