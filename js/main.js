// Titik masuk utama, state machine, audio, fx, storage, dan loop requestAnimationFrame
import { initAudio, play } from './audio.js';
import {
  DT_MAX,
  ENERGY_LOW_THRESHOLD,
  ENERGY_MIN,
  LOW_ENERGY_BEEP_INTERVAL,
  MS_PER_SECOND,
  OVERLAY_INPUT_GUARD_MS,
  PHASES,
  VALID_TRANSITIONS,
} from './config.js';
import { initFx, triggerFx } from './fx.js';
import {
  applyResult,
  extrapolateAngle,
  judge,
  update,
} from './game.js';
import { initInput } from './input.js';
import { applyTheme, initRender, render } from './render.js';
import { resetState, state } from './state.js';
import { loadHighScore, saveHighScore } from './storage.js';

let lastFrameTime = null;
let lastDt = 0;
let lowEnergyTimer = 0;
let pendingThemeSwap = false;
let ignoreLockUntil = 0;

// Transisi state machine; abaikan transisi tidak valid tanpa error
export function transition(nextPhase) {
  const allowed = VALID_TRANSITIONS[state.phase];
  if (!allowed || !allowed.includes(nextPhase)) {
    return false;
  }

  const prevPhase = state.phase;
  if (
    nextPhase === PHASES.PLAYING &&
    (prevPhase === PHASES.MENU || prevPhase === PHASES.GAME_OVER)
  ) {
    resetState();
    lowEnergyTimer = 0;
    pendingThemeSwap = false;
  }

  if (nextPhase === PHASES.PLAYING) {
    lastFrameTime = null;
    ignoreLockUntil = performance.now() + OVERLAY_INPUT_GUARD_MS;
    document.activeElement?.blur?.();
  }

  if (nextPhase === PHASES.GAME_OVER) {
    lowEnergyTimer = 0;
    if (state.score > state.highScore && state.score > 0) {
      state.isNewRecord = true;
      state.highScore = saveHighScore(state.score);
      play('GAME_OVER');
      play('HIGH_SCORE');
    } else {
      state.isNewRecord = false;
      play('GAME_OVER');
    }
    triggerFx('GAME_OVER');
  }

  state.phase = nextPhase;
  render(state);
  return true;
}

export function getLastDt() {
  return lastDt;
}

function startOrRestart() {
  initAudio();
  play('UI_CLICK');
  if (transition(PHASES.PLAYING)) {
    play('START');
  }
}

function resumeGame() {
  initAudio();
  play('UI_CLICK');
  transition(PHASES.PLAYING);
}

function handleEscape() {
  if (state.phase === PHASES.PLAYING) {
    transition(PHASES.PAUSED);
  } else if (state.phase === PHASES.PAUSED) {
    resumeGame();
  }
}

function handleEnter() {
  if (state.phase === PHASES.MENU || state.phase === PHASES.GAME_OVER) {
    startOrRestart();
  } else if (state.phase === PHASES.PAUSED) {
    resumeGame();
  }
}

function handleHide() {
  if (state.phase === PHASES.PLAYING) {
    transition(PHASES.PAUSED);
  }
}

// Menangani input kunci target dengan kompensasi latensi
function handleLock(tEvent) {
  if (state.phase !== PHASES.PLAYING) return;
  if (performance.now() < ignoreLockUntil) return;
  const hitTargetDeg = state.thetaT;
  const thetaInput = extrapolateAngle(state.thetaC, tEvent, lastFrameTime);
  const result = judge(thetaInput);
  const outcome = applyResult(result);

  play(outcome.result);
  triggerFx(outcome.result, { targetDeg: hitTargetDeg });

  if (outcome.flipped) {
    pendingThemeSwap = true;
    play('FLIP');
    render(state, { deferTheme: true });
    triggerFx('FLIP', {
      flame: outcome.milestoneFlame,
      onMidFlip: () => {
        if (!pendingThemeSwap) return;
        pendingThemeSwap = false;
        applyTheme(state.theme);
      },
    });
  } else if (outcome.milestoneFlame) {
    triggerFx('MILESTONE_FLAME');
  } else if (outcome.gameOver) {
    pendingThemeSwap = false;
    transition(PHASES.GAME_OVER);
  } else {
    if (outcome.result === 'MISS') pendingThemeSwap = false;
    render(state, { deferTheme: pendingThemeSwap });
  }
}

// Loop utama berbasis dt (detik) dengan clamp DT_MAX
function tick(now) {
  if (lastFrameTime === null) {
    lastDt = 0;
  } else {
    const rawDt = (now - lastFrameTime) / MS_PER_SECOND;
    lastDt = Math.min(Math.max(rawDt, 0), DT_MAX);
  }
  lastFrameTime = now;

  if (state.phase === PHASES.PLAYING && lastDt > 0) {
    const { gameOver } = update(lastDt);
    if (gameOver) {
      pendingThemeSwap = false;
      transition(PHASES.GAME_OVER);
    } else if (state.energy < ENERGY_LOW_THRESHOLD && state.energy > ENERGY_MIN) {
      lowEnergyTimer -= lastDt;
      if (lowEnergyTimer <= 0) {
        play('LOW_ENERGY');
        lowEnergyTimer = LOW_ENERGY_BEEP_INTERVAL;
      }
    } else {
      lowEnergyTimer = 0;
    }
  }

  render(state, { deferTheme: pendingThemeSwap });
  requestAnimationFrame(tick);
}

function bindOverlayButtons() {
  document.getElementById('btn-start')?.addEventListener('click', startOrRestart);
  document.getElementById('btn-resume')?.addEventListener('click', resumeGame);
  document.getElementById('btn-restart')?.addEventListener('click', startOrRestart);
}

function init() {
  state.highScore = loadHighScore();
  initRender();
  initFx();
  initInput({
    onLock: handleLock,
    onEscape: handleEscape,
    onEnter: handleEnter,
    onHide: handleHide,
    onFirstGesture: initAudio,
  });
  bindOverlayButtons();
  render(state);
  requestAnimationFrame(tick);
}

init();
