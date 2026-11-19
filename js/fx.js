// Efek visual Crystal Shadow: pool 12 serpihan, ripple, retak, dan sapuan Flip
// Hanya membaca state dan memakai ulang elemen SVG yang dibuat sekali saat init
import {
  FLIP_WIPE_MID_MS,
  SHARD_COUNT_GOOD,
  SHARD_COUNT_PERFECT,
  SHARD_DIST_GOOD,
  SHARD_DIST_PERFECT,
  SHARD_POOL,
  SVG_RADIUS,
} from './config.js';
import { polarToXY } from './math.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const ANIM_CLASSES = [
  'is-hit',
  'is-ripple-perfect',
  'is-ripple-good',
  'is-orb-pop',
  'is-miss',
  'is-flash',
  'is-cracks',
  'is-wipe',
  'is-purple-flame',
  'is-judge-pop',
  'is-gameover-slide',
];

let els = null;
let shardPool = [];
let shardCursor = 0;
let wipeTimer = null;

function restartAnim(el, className, conflictClasses = []) {
  if (!el) return;
  el.classList.remove(className, ...conflictClasses);
  void el.getBoundingClientRect();
  el.classList.add(className);
}

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
}

// Membuat pool 12 poligon serpihan satu kali (zero alokasi saat bermain)
export function initFx() {
  els = {
    stage: document.getElementById('stage'),
    orbitRing: document.getElementById('orbit-ring'),
    hitRipple: document.getElementById('hit-ripple'),
    cursorOrb: document.getElementById('cursor-orb'),
    fxShards: document.getElementById('fx-shards'),
    fxCracks: document.getElementById('fx-cracks'),
    judgeText: document.getElementById('judge-text'),
    missFlash: document.getElementById('miss-flash'),
    wipe: document.getElementById('wipe'),
    purpleFlame: document.getElementById('purple-flame'),
    stageFlame: document.getElementById('stage-flame'),
    gameoverCard: document.getElementById('gameover-card'),
  };

  shardPool = [];
  if (els.fxShards) {
    els.fxShards.innerHTML = '';
    for (let i = 0; i < SHARD_POOL; i++) {
      const poly = document.createElementNS(SVG_NS, 'polygon');
      poly.setAttribute('points', '0,-6 5,4 -5,3');
      poly.setAttribute('opacity', '0');
      poly.classList.add('fx-shard');
      poly.addEventListener('animationend', () => {
        poly.classList.remove('is-shard-burst');
      });
      els.fxShards.appendChild(poly);
      shardPool.push(poly);
    }
  }

  [
    els.stage,
    els.orbitRing,
    els.hitRipple,
    els.cursorOrb,
    els.fxCracks,
    els.judgeText,
    els.missFlash,
    els.wipe,
    els.purpleFlame,
    els.stageFlame,
    els.gameoverCard,
  ].forEach((el) => {
    el?.addEventListener('animationend', (e) => {
      if (e.target !== el) return;
      el.classList.remove(...ANIM_CLASSES);
    });
  });
}

// Meledakkan sejumlah serpihan dari titik target memakai pool yang ada
function burstShards(targetDeg, count, distance, fillVar) {
  if (!shardPool.length || prefersReducedMotion()) return;
  const origin = polarToXY(targetDeg, SVG_RADIUS);

  for (let i = 0; i < count; i++) {
    const poly = shardPool[shardCursor];
    shardCursor = (shardCursor + 1) % SHARD_POOL;

    const angleRad = (Math.PI * 2 * i) / count + (i % 2 === 0 ? 0.25 : -0.2);
    const dx = (Math.cos(angleRad) * distance).toFixed(1);
    const dy = (Math.sin(angleRad) * distance).toFixed(1);
    const rot = (i % 2 === 0 ? 140 : -140) + i * 18;

    poly.style.setProperty('--sx', `${origin.x.toFixed(1)}px`);
    poly.style.setProperty('--sy', `${origin.y.toFixed(1)}px`);
    poly.style.setProperty('--dx', `${dx}px`);
    poly.style.setProperty('--dy', `${dy}px`);
    poly.style.setProperty('--rot', `${rot}deg`);
    poly.setAttribute('fill', fillVar);

    poly.classList.remove('is-shard-burst');
    void poly.getBoundingClientRect();
    poly.classList.add('is-shard-burst');
  }
}

function showJudgeText(label, colorClass) {
  if (!els?.judgeText) return;
  els.judgeText.textContent = label;
  els.judgeText.classList.remove('text-perfect', 'text-accent', 'text-danger');
  els.judgeText.classList.add(colorClass);
  restartAnim(els.judgeText, 'is-judge-pop');
}

// Memicu efek visual berdasarkan event mekanik
export function triggerFx(eventName, { targetDeg = 0, onMidFlip, flame = false } = {}) {
  if (!els) return;

  if (eventName === 'PERFECT') {
    restartAnim(els.orbitRing, 'is-hit');
    restartAnim(els.hitRipple, 'is-ripple-perfect', ['is-ripple-good']);
    restartAnim(els.cursorOrb, 'is-orb-pop');
    burstShards(targetDeg, SHARD_COUNT_PERFECT, SHARD_DIST_PERFECT, 'var(--perfect)');
    showJudgeText('PERFECT', 'text-perfect');
    return;
  }

  if (eventName === 'GOOD') {
    restartAnim(els.hitRipple, 'is-ripple-good', ['is-ripple-perfect']);
    burstShards(targetDeg, SHARD_COUNT_GOOD, SHARD_DIST_GOOD, 'var(--accent)');
    showJudgeText('GOOD', 'text-accent');
    return;
  }

  if (eventName === 'MISS') {
    restartAnim(els.stage, 'is-miss');
    restartAnim(els.fxCracks, 'is-cracks');
    restartAnim(els.missFlash, 'is-flash');
    showJudgeText('MISS', 'text-danger');
    return;
  }

  if (eventName === 'FLIP') {
    const isBlue = !flame;
    showJudgeText('FLIP', 'text-accent');
    els.purpleFlame?.classList.toggle('flame-blue', isBlue);
    els.stageFlame?.classList.toggle('flame-blue', isBlue);
    restartAnim(els.purpleFlame, 'is-purple-flame');
    restartAnim(els.stageFlame, 'is-purple-flame');
    if (prefersReducedMotion()) {
      onMidFlip?.();
      return;
    }
    if (wipeTimer) clearTimeout(wipeTimer);
    wipeTimer = setTimeout(() => {
      wipeTimer = null;
      onMidFlip?.();
    }, FLIP_WIPE_MID_MS);
    return;
  }

  if (eventName === 'MILESTONE_FLAME') {
    els.purpleFlame?.classList.remove('flame-blue');
    els.stageFlame?.classList.remove('flame-blue');
    restartAnim(els.purpleFlame, 'is-purple-flame');
    restartAnim(els.stageFlame, 'is-purple-flame');
    return;
  }

  if (eventName === 'GAME_OVER') {
    restartAnim(els.gameoverCard, 'is-gameover-slide');
  }
}
