// Semua konstanta mekanik, geometri, audio, dan state PALse lock

// Toleransi sudut penilaian (derajat)
export const PERFECT_TOL = 8;
export const GOOD_TOL = 22;

// Kecepatan rotasi kursor (derajat/detik)
export const BASE_OMEGA = 180;
export const OMEGA_STEP = 12;
export const OMEGA_CAP = 360;

// Energi dan passive decay
export const ENERGY_MAX = 100;
export const ENERGY_MIN = 0;
export const ENERGY_LOW_THRESHOLD = 25;
export const LOW_ENERGY_BEEP_INTERVAL = 0.6;
export const DECAY_BASE = 8;
export const DECAY_STEP = 0.5;
export const DECAY_CAP = 20;
export const ENERGY_PERFECT = 15;
export const ENERGY_GOOD = 8;
export const ENERGY_MISS = -20;

// Skor, combo, dan multiplier
export const COMBO_STEP = 5;
export const FLAME_COMBO_STEP = 10;
export const SCORE_PERFECT = 100;
export const SCORE_GOOD = 50;
export const SCORE_MISS = 0;
export const MULT_BASE = 1;
export const MULT_STEP = 0.5;
export const MULT_CAP = 4.0;

// Waktu dan kompensasi latensi input
export const DT_MAX = 0.05;
export const MS_PER_SECOND = 1000;
export const INPUT_LATENCY_MIN_MS = 0;
export const INPUT_LATENCY_MAX_MS = 34;
export const OVERLAY_INPUT_GUARD_MS = 100;

// Geometri sudut dan penempatan target (derajat)
export const FULL_CIRCLE_DEG = 360;
export const HALF_CIRCLE_DEG = 180;
export const DEG_TO_RAD = Math.PI / 180;
export const DIR_CW = 1;
export const DIR_CCW = -1;
export const INITIAL_CURSOR_ANGLE = 0;
export const INITIAL_TARGET_ANGLE = 180;
export const TARGET_MIN_DIST = 90;
export const TARGET_MAX_DIST = 270;

// Geometri SVG stage (viewBox 0 0 400 400) dan pool FX
export const SVG_CENTER = 200;
export const SVG_RADIUS = 150;
export const SHARD_POOL = 12;
export const TRAIL_OFFSETS_DEG = Object.freeze([5, 10, 15]);
export const SHARD_COUNT_PERFECT = 6;
export const SHARD_COUNT_GOOD = 3;
export const SHARD_DIST_PERFECT = 40;
export const SHARD_DIST_GOOD = 24;
export const FLIP_WIPE_MID_MS = 150;

// Penyimpanan lokal
export const HIGHSCORE_KEY = 'palselock.highscore.v1';

// Spesifikasi Web Audio API (DESIGN.md bagian 6)
export const AUDIO_MASTER_GAIN = 0.3;
export const AUDIO_PEAK_GAIN = 0.2;
export const AUDIO_FLIP_GAIN = 0.12;
export const AUDIO_ATTACK_SEC = 0.005;
export const AUDIO_MIN_GAIN = 0.0001;

export const AUDIO_EVENTS = Object.freeze({
  UI_CLICK: Object.freeze({ type: 'sine', freq: 660, duration: 0.06 }),
  START: Object.freeze({ type: 'sine', notes: [523.25, 659.25, 783.99], step: 0.08 }),
  PERFECT: Object.freeze({
    tones: [
      { type: 'sine', freq: 1318.5 },
      { type: 'triangle', freq: 1975.5 },
    ],
    duration: 0.12,
  }),
  GOOD: Object.freeze({ type: 'triangle', freq: 880, duration: 0.1 }),
  MISS: Object.freeze({ type: 'sawtooth', freqStart: 140, freqEnd: 70, duration: 0.18 }),
  FLIP: Object.freeze({
    type: 'square',
    freqStart: 330,
    freqEnd: 660,
    duration: 0.15,
    peakGain: AUDIO_FLIP_GAIN,
  }),
  LOW_ENERGY: Object.freeze({ type: 'square', freq: 220, duration: 0.05 }),
  GAME_OVER: Object.freeze({ type: 'sawtooth', freqStart: 440, freqEnd: 110, duration: 0.6 }),
  HIGH_SCORE: Object.freeze({ type: 'sine', notes: [784, 988, 1319], step: 0.1 }),
});

// Phase state machine dan tema
export const PHASES = Object.freeze({
  MENU: 'MENU',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAME_OVER: 'GAME_OVER',
});

export const THEMES = Object.freeze({
  NORMAL: 'normal',
  FLIP: 'flip',
});

export const VALID_TRANSITIONS = Object.freeze({
  [PHASES.MENU]: Object.freeze([PHASES.PLAYING]),
  [PHASES.PLAYING]: Object.freeze([PHASES.PAUSED, PHASES.GAME_OVER]),
  [PHASES.PAUSED]: Object.freeze([PHASES.PLAYING]),
  [PHASES.GAME_OVER]: Object.freeze([PHASES.PLAYING]),
});
