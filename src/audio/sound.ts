// Lightweight synthesized sound effects. Every effect goes through playSound(),
// so swapping in recorded samples later only means changing this file.

export type SoundName = 'click' | 'place' | 'invalid' | 'roll' | 'launch' | 'explosion' | 'splash' | 'coin' | 'win' | 'lose';

let ctx: AudioContext | null = null;
let muted = false;

export function setMuted(value: boolean) {
  muted = value;
}

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(ac: AudioContext, freq: number, start: number, dur: number, type: OscillatorType = 'sine', gain = 0.15, endFreq?: number) {
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, start + dur);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(gain, start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

function noise(ac: AudioContext, start: number, dur: number, filter: BiquadFilterType, freq: number, gain = 0.3, endFreq?: number) {
  const buffer = ac.createBuffer(1, Math.ceil(ac.sampleRate * dur), ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const f = ac.createBiquadFilter();
  f.type = filter;
  f.frequency.setValueAtTime(freq, start);
  if (endFreq) f.frequency.exponentialRampToValueAtTime(endFreq, start + dur);
  const g = ac.createGain();
  g.gain.setValueAtTime(gain, start);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  src.connect(f).connect(g).connect(ac.destination);
  src.start(start);
}

export function playSound(name: SoundName) {
  if (muted) return;
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;

  switch (name) {
    case 'click':
      tone(ac, 900, t, 0.05, 'square', 0.04);
      break;
    case 'place':
      tone(ac, 220, t, 0.12, 'triangle', 0.18, 140);
      noise(ac, t, 0.08, 'lowpass', 800, 0.12);
      break;
    case 'invalid':
      tone(ac, 160, t, 0.18, 'sawtooth', 0.06);
      break;
    case 'roll':
      for (let i = 0; i < 11; i++) {
        const at = t + i * 0.085 + Math.random() * 0.03;
        noise(ac, at, 0.04, 'bandpass', 2200 + Math.random() * 1800, 0.25);
      }
      break;
    case 'launch':
      noise(ac, t, 0.5, 'bandpass', 3000, 0.18, 400);
      tone(ac, 900, t, 0.5, 'sine', 0.05, 200);
      break;
    case 'explosion':
      noise(ac, t, 1.1, 'lowpass', 1600, 0.9, 60);
      tone(ac, 90, t, 0.6, 'sine', 0.4, 30);
      break;
    case 'splash':
      noise(ac, t, 0.6, 'highpass', 900, 0.35, 3000);
      noise(ac, t + 0.05, 0.4, 'lowpass', 600, 0.2);
      break;
    case 'coin':
      tone(ac, 1318, t, 0.12, 'square', 0.05);
      tone(ac, 1760, t + 0.08, 0.25, 'square', 0.05);
      break;
    case 'win':
      [523, 659, 784, 1047, 1319].forEach((f, i) => tone(ac, f, t + i * 0.1, 0.4, 'triangle', 0.12));
      break;
    case 'lose':
      [392, 330, 262].forEach((f, i) => tone(ac, f, t + i * 0.18, 0.35, 'triangle', 0.1));
      break;
  }
}
