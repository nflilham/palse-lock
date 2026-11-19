// Pembaruan DOM dan SVG per frame (hanya membaca state, tanpa alokasi baru)
import {
  DIR_CCW,
  ENERGY_LOW_THRESHOLD,
  ENERGY_MAX,
  GOOD_TOL,
  PERFECT_TOL,
  PHASES,
  SVG_CENTER,
  TRAIL_OFFSETS_DEG,
} from './config.js';
import { getMultiplier } from './game.js';
import { arcPath, normalize } from './math.js';

let els = null;
const prev = {
  phase: null,
  thetaT: null,
  dir: null,
  combo: null,
  score: null,
  highScore: null,
  mult: null,
  energyScale: null,
  energyLow: null,
  theme: null,
};

// Cache seluruh elemen DOM satu kali saat inisialisasi
export function initRender() {
  els = {
    root: document.documentElement,
    stage: document.getElementById('stage'),
    cursorGroup: document.getElementById('cursor-group'),
    cursorHalo: document.getElementById('cursor-halo'),
    trails: [
      document.getElementById('trail-1'),
      document.getElementById('trail-2'),
      document.getElementById('trail-3'),
    ],
    zoneGood: document.getElementById('zone-good'),
    zonePerfect: document.getElementById('zone-perfect'),
    targetTip: document.getElementById('target-tip'),
    comboText: document.getElementById('combo-text'),
    dirChevron: document.getElementById('dir-chevron'),
    hudScore: document.getElementById('hud-score'),
    hudMult: document.getElementById('hud-mult'),
    hudHighScore: document.getElementById('hud-highscore'),
    energyFill: document.getElementById('energy-fill'),
    vignette: document.getElementById('vignette'),
    menuHighScore: document.getElementById('menu-highscore'),
    gameoverScore: document.getElementById('gameover-score'),
    gameoverMaxCombo: document.getElementById('gameover-maxcombo'),
    gameoverHighScore: document.getElementById('gameover-highscore'),
    gameoverNewRecord: document.getElementById('gameover-newrecord'),
    overlayMenu: document.getElementById('overlay-menu'),
    overlayPause: document.getElementById('overlay-pause'),
    overlayGameover: document.getElementById('overlay-gameover'),
  };
}

// Terapkan tema pada root secara eksplisit (dipakai juga saat titik tengah sapuan Flip)
export function applyTheme(theme) {
  if (!els || prev.theme === theme) return;
  els.root.dataset.theme = theme;
  prev.theme = theme;
}

// Sinkronisasi tampilan dengan state saat ini (tulis DOM hanya jika berubah)
export function render(state, { deferTheme = false } = {}) {
  if (!els) return;

  // Posisi kursor & 3 jejak kursor
  els.cursorGroup.setAttribute(
    'transform',
    `rotate(${state.thetaC} ${SVG_CENTER} ${SVG_CENTER})`
  );
  for (let i = 0; i < TRAIL_OFFSETS_DEG.length; i++) {
    const trailEl = els.trails[i];
    if (!trailEl) continue;
    const trailAngle = normalize(state.thetaC - state.dir * TRAIL_OFFSETS_DEG[i]);
    trailEl.setAttribute('transform', `rotate(${trailAngle} ${SVG_CENTER} ${SVG_CENTER})`);
  }

  // Zona target & ujung kristal target
  if (prev.thetaT !== state.thetaT) {
    els.zoneGood.setAttribute('d', arcPath(state.thetaT, GOOD_TOL));
    els.zonePerfect.setAttribute('d', arcPath(state.thetaT, PERFECT_TOL));
    els.targetTip?.setAttribute('transform', `rotate(${state.thetaT} ${SVG_CENTER} ${SVG_CENTER})`);
    prev.thetaT = state.thetaT;
  }

  // Chevron arah rotasi (flip horizontal saat CCW)
  if (prev.dir !== state.dir) {
    els.dirChevron?.setAttribute(
      'transform',
      state.dir === DIR_CCW ? 'translate(200 250) scale(-1 1)' : 'translate(200 250) scale(1 1)'
    );
    prev.dir = state.dir;
  }

  // Combo & multiplier
  if (prev.combo !== state.combo) {
    els.comboText.textContent = String(state.combo);
    const mult = getMultiplier(state.combo).toFixed(1);
    if (prev.mult !== mult && els.hudMult) {
      els.hudMult.textContent = `x${mult}`;
      prev.mult = mult;
    }
    prev.combo = state.combo;
  }

  // Skor
  if (prev.score !== state.score && els.hudScore) {
    els.hudScore.textContent = String(state.score);
    prev.score = state.score;
  }

  // High score
  if (prev.highScore !== state.highScore) {
    const text = String(state.highScore);
    if (els.hudHighScore) els.hudHighScore.textContent = text;
    if (els.menuHighScore) els.menuHighScore.textContent = text;
    if (els.gameoverHighScore) els.gameoverHighScore.textContent = text;
    prev.highScore = state.highScore;
  }

  // Bar energi via transform: scaleX (tanpa layout thrashing)
  const energyScale = (state.energy / ENERGY_MAX).toFixed(4);
  if (prev.energyScale !== energyScale && els.energyFill) {
    els.energyFill.style.transform = `scaleX(${energyScale})`;
    prev.energyScale = energyScale;
  }

  // Status energi rendah (E < 25)
  const isLow = state.energy < ENERGY_LOW_THRESHOLD && state.phase === PHASES.PLAYING;
  if (prev.energyLow !== isLow) {
    els.energyFill?.classList.toggle('is-low-bar', isLow);
    els.vignette?.classList.toggle('is-low-vignette', isLow);
    els.cursorHalo?.setAttribute('r', isLow ? '24' : '18');
    els.cursorHalo?.setAttribute('opacity', isLow ? '1' : '0.85');
    prev.energyLow = isLow;
  }

  // Tema (dapat ditunda ke titik tengah sapuan Flip)
  if (!deferTheme && prev.theme !== state.theme) {
    els.root.dataset.theme = state.theme;
    prev.theme = state.theme;
  }

  // State UI & overlay tunggal
  if (prev.phase !== state.phase) {
    const isGameOver = state.phase === PHASES.GAME_OVER;
    els.root.dataset.paused = state.phase === PHASES.PAUSED ? 'true' : 'false';

    els.overlayMenu.classList.toggle('hidden', state.phase !== PHASES.MENU);
    els.overlayPause.classList.toggle('hidden', state.phase !== PHASES.PAUSED);
    els.overlayGameover.classList.toggle('hidden', !isGameOver);

    if (els.stage) {
      els.stage.classList.toggle('opacity-40', isGameOver);
      els.stage.classList.toggle('scale-[0.98]', isGameOver);
    }

    if (isGameOver) {
      if (els.gameoverScore) els.gameoverScore.textContent = String(state.score);
      if (els.gameoverMaxCombo) els.gameoverMaxCombo.textContent = String(state.maxCombo);
      if (els.gameoverHighScore) els.gameoverHighScore.textContent = String(state.highScore);
      if (els.gameoverNewRecord) {
        els.gameoverNewRecord.classList.toggle('hidden', !state.isNewRecord);
      }
    }

    prev.phase = state.phase;
  }
}
