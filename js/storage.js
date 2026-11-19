// Penyimpanan high score di localStorage dengan fallback sesi aman
import { HIGHSCORE_KEY } from './config.js';

let sessionHighScore = 0;

// Memuat high score; nilai korup atau storage diblokir mengembalikan fallback aman
export function loadHighScore() {
  try {
    const raw = window.localStorage.getItem(HIGHSCORE_KEY);
    if (raw === null || raw.trim() === '') return sessionHighScore;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed < 0) return 0;
    const clean = Math.floor(parsed);
    sessionHighScore = Math.max(sessionHighScore, clean);
    return sessionHighScore;
  } catch {
    return sessionHighScore;
  }
}

// Menyimpan high score ke memori sesi dan localStorage tanpa melempar error
export function saveHighScore(score) {
  const clean = Number.isFinite(score) && score > 0 ? Math.floor(score) : 0;
  sessionHighScore = Math.max(sessionHighScore, clean);
  try {
    window.localStorage.setItem(HIGHSCORE_KEY, String(sessionHighScore));
  } catch {
    // Abaikan jika localStorage tidak tersedia (mode privat/diblokir)
  }
  return sessionHighScore;
}
