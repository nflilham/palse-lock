// Objek state tunggal permainan PALse lock
import {
  DIR_CW,
  ENERGY_MAX,
  INITIAL_CURSOR_ANGLE,
  INITIAL_TARGET_ANGLE,
  PHASES,
  THEMES,
} from './config.js';

export const state = {
  phase: PHASES.MENU,
  thetaC: INITIAL_CURSOR_ANGLE,
  thetaT: INITIAL_TARGET_ANGLE,
  dir: DIR_CW,
  combo: 0,
  maxCombo: 0,
  score: 0,
  highScore: 0,
  isNewRecord: false,
  energy: ENERGY_MAX,
  theme: THEMES.NORMAL,
};

// Mereset nilai sesi permainan ke kondisi awal
export function resetState() {
  state.thetaC = INITIAL_CURSOR_ANGLE;
  state.thetaT = INITIAL_TARGET_ANGLE;
  state.dir = DIR_CW;
  state.combo = 0;
  state.maxCombo = 0;
  state.score = 0;
  state.isNewRecord = false;
  state.energy = ENERGY_MAX;
  state.theme = THEMES.NORMAL;
  return state;
}
