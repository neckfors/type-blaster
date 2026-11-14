// All sounds are synthesised with WebAudio, so there are no audio files.
let ctx = null, master = null, noiseBuf = null, enabled = true;

export function initAudio() {
  if (ctx) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = enabled ? 0.5 : 0;
  master.connect(ctx.destination);
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
}

export function setSound(on) {
  enabled = on;
  if (master) master.gain.value = on ? 0.5 : 0;
}

export function resumeAudio() {
  if (ctx && ctx.state === 'suspended') ctx.resume();
}

function tone({ type = 'sine', f0, f1, dur = 0.1, vol = 0.3, delay = 0 }) {
  if (!ctx || !enabled) return;
  const t = ctx.currentTime + delay;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function noise({ dur = 0.4, vol = 0.4, f0 = 3000, f1 = 200, delay = 0 }) {
  if (!ctx || !enabled) return;
  const t = ctx.currentTime + delay;
  const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = noiseBuf;
  f.type = 'lowpass';
  f.frequency.setValueAtTime(f0, t);
  f.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  s.connect(f).connect(g).connect(master);
  s.start(t);
  s.stop(t + dur + 0.02);
}

export const sfx = {
  key(step = 0) { tone({ type: 'triangle', f0: 520 + step * 45, dur: 0.07, vol: 0.2 }); },
  wrong() { tone({ type: 'square', f0: 170, f1: 110, dur: 0.12, vol: 0.1 }); },
  shoot() { tone({ type: 'sawtooth', f0: 1500, f1: 160, dur: 0.16, vol: 0.18 }); },
  boom(delay = 0.06) {
    noise({ dur: 0.45, vol: 0.5, f0: 2800, f1: 150, delay });
    tone({ type: 'sine', f0: 150, f1: 40, dur: 0.3, vol: 0.55, delay });
    tone({ type: 'triangle', f0: 880, f1: 1320, dur: 0.12, vol: 0.12, delay });
  },
  hit() {
    noise({ dur: 0.6, vol: 0.6, f0: 1500, f1: 80 });
    tone({ type: 'sawtooth', f0: 220, f1: 50, dur: 0.5, vol: 0.35 });
  },
  combo() { [660, 880, 1320].forEach((f, i) => tone({ type: 'triangle', f0: f, dur: 0.16, vol: 0.2, delay: i * 0.07 })); },
  life() { [523, 784, 1047].forEach((f, i) => tone({ type: 'sine', f0: f, dur: 0.2, vol: 0.25, delay: i * 0.09 })); },
  minute() { [523, 659, 784, 1047, 1319].forEach((f, i) => tone({ type: 'triangle', f0: f, dur: 0.3, vol: 0.25, delay: i * 0.11 })); },
  over() { [392, 330, 262, 196].forEach((f, i) => tone({ type: 'square', f0: f, dur: 0.35, vol: 0.14, delay: i * 0.22 })); },
  go() { tone({ type: 'sine', f0: 440, f1: 880, dur: 0.18, vol: 0.2 }); },
};
