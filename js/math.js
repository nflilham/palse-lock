// Fungsi matematika murni tanpa DOM
import {
  DEG_TO_RAD,
  FULL_CIRCLE_DEG,
  HALF_CIRCLE_DEG,
  SVG_CENTER,
  SVG_RADIUS,
} from './config.js';

// Normalisasi sudut ke rentang [0, 360)
export function normalize(angleDeg) {
  return ((angleDeg % FULL_CIRCLE_DEG) + FULL_CIRCLE_DEG) % FULL_CIRCLE_DEG;
}

// Selisih sudut melingkar terpendek dalam rentang [0, 180]
export function angleDelta(a, b) {
  return Math.abs(normalize(a - b + HALF_CIRCLE_DEG) - HALF_CIRCLE_DEG);
}

// Nilai acak pada rentang [min, max)
export function randRange(min, max) {
  return min + Math.random() * (max - min);
}

// Konversi sudut (derajat, 0 di jam 12, CW positif) ke koordinat SVG
export function polarToXY(angleDeg, radius = SVG_RADIUS) {
  const rad = angleDeg * DEG_TO_RAD;
  return {
    x: SVG_CENTER + radius * Math.sin(rad),
    y: SVG_CENTER - radius * Math.cos(rad),
  };
}

// Menghasilkan path SVG arc sepanjang ±tolDeg dari centerDeg
export function arcPath(centerDeg, tolDeg) {
  const start = polarToXY(centerDeg - tolDeg, SVG_RADIUS);
  const end = polarToXY(centerDeg + tolDeg, SVG_RADIUS);
  const largeArc = tolDeg * 2 > HALF_CIRCLE_DEG ? 1 : 0;
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${SVG_RADIUS} ${SVG_RADIUS} 0 ${largeArc} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
}
