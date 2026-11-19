// Logika inti permainan tanpa DOM
import {
  BASE_OMEGA,
  COMBO_STEP,
  DECAY_BASE,
  DECAY_CAP,
  DECAY_STEP,
  DIR_CW,
  ENERGY_GOOD,
  ENERGY_MAX,
  ENERGY_MIN,
  ENERGY_MISS,
  ENERGY_PERFECT,
  FLAME_COMBO_STEP,
  GOOD_TOL,
  INPUT_LATENCY_MAX_MS,
  INPUT_LATENCY_MIN_MS,
  MS_PER_SECOND,
  MULT_BASE,
  MULT_CAP,
  MULT_STEP,
  OMEGA_CAP,
  OMEGA_STEP,
  PERFECT_TOL,
  SCORE_GOOD,
  SCORE_PERFECT,
  TARGET_MAX_DIST,
  TARGET_MIN_DIST,
  THEMES,
} from './config.js';
import { angleDelta, normalize, randRange } from './math.js';
import { state } from './state.js';

export function getLevel(combo = state.combo) {
  return Math.floor(combo / COMBO_STEP);
}

export function getOmega(combo = state.combo) {
  return Math.min(BASE_OMEGA + OMEGA_STEP * getLevel(combo), OMEGA_CAP);
}

export function getDecay(combo = state.combo) {
  return Math.min(DECAY_BASE + DECAY_STEP * getLevel(combo), DECAY_CAP);
}

export function getMultiplier(combo = state.combo) {
  return Math.min(MULT_BASE + MULT_STEP * getLevel(combo), MULT_CAP);
}

// Clamp nilai energi ke [ENERGY_MIN, ENERGY_MAX]
function clampEnergy(value) {
  return Math.min(ENERGY_MAX, Math.max(ENERGY_MIN, value));
}

// Pembaruan posisi kursor dan passive decay energi tiap frame
export function update(dt) {
  const omega = getOmega();
  state.thetaC = normalize(state.thetaC + state.dir * omega * dt);
  state.energy = clampEnergy(state.energy - getDecay() * dt);
  return { gameOver: state.energy <= ENERGY_MIN };
}

// Ekstrapolasi sudut kursor saat input dengan clamp latensi [0, 34] ms
export function extrapolateAngle(thetaLast, tEvent, tLastFrame) {
  const rawMs = tLastFrame === null ? 0 : tEvent - tLastFrame;
  const clampedMs = Math.min(
    INPUT_LATENCY_MAX_MS,
    Math.max(INPUT_LATENCY_MIN_MS, rawMs)
  );
  const deltaDeg = state.dir * getOmega() * (clampedMs / MS_PER_SECOND);
  return normalize(thetaLast + deltaDeg);
}

// Penilaian presisi berdasarkan selisih sudut melingkar
export function judge(thetaInput) {
  const delta = angleDelta(thetaInput, state.thetaT);
  if (delta <= PERFECT_TOL) return 'PERFECT';
  if (delta <= GOOD_TOL) return 'GOOD';
  return 'MISS';
}

// Polarity Flip tepat di kelipatan COMBO_STEP (> 0)
export function maybeFlip() {
  if (state.combo > 0 && state.combo % COMBO_STEP === 0) {
    state.dir = -state.dir;
    state.theme = state.theme === THEMES.NORMAL ? THEMES.FLIP : THEMES.NORMAL;
    return true;
  }
  return false;
}

// Menempatkan target baru di depan arah gerak kursor dalam [90, 270] derajat
export function placeTarget() {
  const offset = randRange(TARGET_MIN_DIST, TARGET_MAX_DIST);
  state.thetaT = normalize(state.thetaC + state.dir * offset);
  return state.thetaT;
}

// Menerapkan hasil penilaian pada skor, combo, energi, flip, dan target
export function applyResult(result) {
  const mult = getMultiplier(state.combo);

  if (result === 'PERFECT' || result === 'GOOD') {
    const baseScore = result === 'PERFECT' ? SCORE_PERFECT : SCORE_GOOD;
    const energyGain = result === 'PERFECT' ? ENERGY_PERFECT : ENERGY_GOOD;

    state.score += Math.round(baseScore * mult);
    state.combo += 1;
    if (state.combo > state.maxCombo) {
      state.maxCombo = state.combo;
    }
    state.energy = clampEnergy(state.energy + energyGain);

    const flipped = maybeFlip();
    const milestoneFlame = state.combo > 0 && state.combo % FLAME_COMBO_STEP === 0;
    placeTarget();
    return { result, flipped, milestoneFlame, gameOver: false };
  }

  // MISS: reset combo, arah CW, tema normal, kurangi energi, target tetap
  state.combo = 0;
  state.dir = DIR_CW;
  state.theme = THEMES.NORMAL;
  state.energy = clampEnergy(state.energy + ENERGY_MISS);
  return {
    result: 'MISS',
    flipped: false,
    milestoneFlame: false,
    gameOver: state.energy <= ENERGY_MIN,
  };
}
