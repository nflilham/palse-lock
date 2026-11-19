// Pengelola input keyboard (Spasi, Esc, Enter), pointer, dan visibilitychange
import { PHASES } from './config.js';
import { state } from './state.js';

export function initInput({ onLock, onEscape, onEnter, onHide, onFirstGesture }) {
  const stage = document.getElementById('stage');

  window.addEventListener('keydown', (e) => {
    onFirstGesture?.();

    if (e.code === 'Space') {
      e.preventDefault();
      if (e.repeat) return;
      if (state.phase !== PHASES.PLAYING) return;
      onLock(e.timeStamp || performance.now());
      return;
    }

    if (e.code === 'Escape') {
      if (e.repeat) return;
      onEscape?.();
      return;
    }

    if (e.code === 'Enter') {
      if (e.repeat) return;
      // Jika fokus sudah di tombol, biarkan event click bawaan browser yang berjalan
      if (state.phase !== PHASES.PLAYING && e.target?.tagName !== 'BUTTON') {
        e.preventDefault();
        onEnter?.();
      }
    }
  });

  stage?.addEventListener('pointerdown', (e) => {
    onFirstGesture?.();
    if (state.phase !== PHASES.PLAYING) return;
    e.preventDefault();
    onLock(e.timeStamp || performance.now());
  });

  // Cegah menu long-press di layar sentuh mobile
  stage?.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      onHide?.();
    }
  });
}
