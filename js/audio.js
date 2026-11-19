// Sintesis efek suara Web Audio API tanpa aset eksternal
import {
  AUDIO_ATTACK_SEC,
  AUDIO_EVENTS,
  AUDIO_MASTER_GAIN,
  AUDIO_MIN_GAIN,
  AUDIO_PEAK_GAIN,
} from './config.js';

let audioCtx = null;
let masterGain = null;

// Membuat atau me-resume AudioContext hanya saat gesture pertama pengguna
export function initAudio() {
  try {
    if (!audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return false;
      audioCtx = new AudioCtx();
      masterGain = audioCtx.createGain();
      masterGain.gain.setValueAtTime(AUDIO_MASTER_GAIN, audioCtx.currentTime);
      masterGain.connect(audioCtx.destination);
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return true;
  } catch {
    audioCtx = null;
    masterGain = null;
    return false;
  }
}

// Memainkan satu nada dengan envelope anti-klik (5 ms linear attack + exponential decay)
function scheduleTone({ type, freq, freqStart, freqEnd, startTime, duration, peakGain = AUDIO_PEAK_GAIN }) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = type;
  const f0 = freqStart ?? freq;
  osc.frequency.setValueAtTime(f0, startTime);
  if (freqEnd !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(freqEnd, startTime + duration);
  }

  gain.gain.setValueAtTime(AUDIO_MIN_GAIN, startTime);
  gain.gain.linearRampToValueAtTime(peakGain, startTime + AUDIO_ATTACK_SEC);
  gain.gain.exponentialRampToValueAtTime(AUDIO_MIN_GAIN, startTime + duration);

  osc.connect(gain);
  gain.connect(masterGain);

  osc.start(startTime);
  osc.stop(startTime + duration + AUDIO_ATTACK_SEC);
}

// Memainkan event suara sesuai tabel DESIGN.md 6.2; no-op jika audio tidak tersedia
export function play(eventName) {
  if (!audioCtx || !masterGain) return;
  const spec = AUDIO_EVENTS[eventName];
  if (!spec) return;

  try {
    const now = audioCtx.currentTime;

    if (spec.notes) {
      spec.notes.forEach((freq, idx) => {
        scheduleTone({
          type: spec.type,
          freq,
          startTime: now + idx * spec.step,
          duration: spec.step,
        });
      });
      return;
    }

    if (spec.tones) {
      spec.tones.forEach((tone) => {
        scheduleTone({
          type: tone.type,
          freq: tone.freq,
          startTime: now,
          duration: spec.duration,
        });
      });
      return;
    }

    scheduleTone({
      type: spec.type,
      freq: spec.freq,
      freqStart: spec.freqStart,
      freqEnd: spec.freqEnd,
      startTime: now,
      duration: spec.duration,
      peakGain: spec.peakGain,
    });
  } catch {
    // Jangan ganggu gameplay jika Web Audio gagal
  }
}
