// SVG delle caramelle, disegnati in codice. Ogni colore ha anche una forma diversa,
// così le caramelle si distinguono anche senza contare sul colore.
// Questo file produce solo testo SVG: non tocca il DOM.

const SVG_NS = 'http://www.w3.org/2000/svg';

function starPoints(cx, cy, outer, inner) {
  const points = [];
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    points.push(`${(cx + radius * Math.cos(angle)).toFixed(1)},${(cy + radius * Math.sin(angle)).toFixed(1)}`);
  }
  return points.join(' ');
}

// Per ogni colore: nome, tinte del gradiente, forma e dettagli.
export const PIECES = [
  {
    name: 'cuore rosso',
    light: '#ff9aa8', main: '#ff4d6d', dark: '#c9184a',
    shape: '<path d="M50 88 C22 66 9 48 9 32 C9 18 19 9 31 9 C39 9 46 13 50 21 C54 13 61 9 69 9 C81 9 91 18 91 32 C91 48 78 66 50 88 Z"/>',
    shine: '<ellipse cx="31" cy="28" rx="11" ry="7" transform="rotate(-35 31 28)"/>',
  },
  {
    name: 'cerchio arancio',
    light: '#ffd08a', main: '#ff9f1c', dark: '#d86f00',
    shape: '<circle cx="50" cy="50" r="40"/>',
    shine: '<ellipse cx="36" cy="32" rx="14" ry="8" transform="rotate(-35 36 32)"/>',
    detail: '<circle cx="50" cy="50" r="27" fill="none" stroke="#fff" stroke-opacity="0.35" stroke-width="5"/>',
  },
  {
    name: 'stella gialla',
    light: '#fff3a3', main: '#ffd60a', dark: '#e0a100',
    shape: `<polygon points="${starPoints(50, 53, 45, 22)}" stroke-width="8" stroke-linejoin="round"/>`,
    stroked: true,
    shine: '<ellipse cx="42" cy="40" rx="9" ry="5" transform="rotate(-35 42 40)"/>',
  },
  {
    name: 'foglia verde',
    light: '#a8e06a', main: '#38b000', dark: '#1f7a00',
    shape: '<path d="M12 88 C6 42 40 8 90 10 C92 60 58 94 12 88 Z"/>',
    shine: '<ellipse cx="42" cy="34" rx="13" ry="6" transform="rotate(-45 42 34)"/>',
    detail: '<path d="M20 80 L80 20" fill="none" stroke="#0f5200" stroke-opacity="0.45" stroke-width="5" stroke-linecap="round"/>',
  },
  {
    name: 'rombo blu',
    light: '#9cc4ff', main: '#3a86ff', dark: '#1d4ed8',
    shape: '<polygon points="50,8 90,50 50,92 10,50" stroke-width="8" stroke-linejoin="round"/>',
    stroked: true,
    shine: '<polygon points="50,18 30,40 38,46 54,24" />',
    detail: '<path d="M10 50 L90 50" fill="none" stroke="#fff" stroke-opacity="0.3" stroke-width="4"/>',
  },
  {
    name: 'luna viola',
    light: '#d7a9ff', main: '#9d4edd', dark: '#6a1fb0',
    shape: '<path d="M62 8 A43 43 0 1 0 92 62 A35 35 0 0 1 62 8 Z" stroke-width="6" stroke-linejoin="round"/>',
    stroked: true,
    shine: '<ellipse cx="26" cy="40" rx="6" ry="12" transform="rotate(20 26 40)"/>',
  },
];

// Gradienti condivisi da tutte le caramelle: vanno inseriti una sola volta nella pagina.
export function pieceDefsSVG() {
  const gradients = PIECES.map(
    (piece, i) =>
      `<radialGradient id="tdd-g${i}" cx="35%" cy="28%" r="80%">` +
      `<stop offset="0" stop-color="${piece.light}"/>` +
      `<stop offset="0.55" stop-color="${piece.main}"/>` +
      `<stop offset="1" stop-color="${piece.dark}"/>` +
      '</radialGradient>'
  ).join('');
  return `<svg xmlns="${SVG_NS}" width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>${gradients}</defs></svg>`;
}

// SVG di una caramella del colore dato (0..5).
export function candySVG(color) {
  const piece = PIECES[color];
  if (!piece) throw new Error(`Colore sconosciuto: ${color}`);
  const stroke = piece.stroked ? ` stroke="url(#tdd-g${color})"` : '';
  const shadowStroke = piece.stroked ? ' stroke="#3b1d4a"' : '';
  return (
    `<svg xmlns="${SVG_NS}" viewBox="0 0 100 100" class="piece piece-${color}" aria-hidden="true" focusable="false">` +
    // ombra leggera: la stessa forma, più scura e spostata in basso
    `<g transform="translate(0 5)" fill="#3b1d4a"${shadowStroke} opacity="0.22">${piece.shape}</g>` +
    `<g fill="url(#tdd-g${color})"${stroke}>${piece.shape}</g>` +
    (piece.detail ?? '') +
    `<g fill="#fff" opacity="0.6">${piece.shine}</g>` +
    '</svg>'
  );
}
