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
  const gloss =
    '<radialGradient id="tdd-gloss" cx="35%" cy="28%" r="75%">' +
    '<stop offset="0" stop-color="#fff" stop-opacity="0.85"/>' +
    '<stop offset="0.5" stop-color="#fff" stop-opacity="0.12"/>' +
    '<stop offset="1" stop-color="#000" stop-opacity="0.18"/>' +
    '</radialGradient>';
  return `<svg xmlns="${SVG_NS}" width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>${gradients}${gloss}</defs></svg>`;
}

const SHADOW = '#3b1d4a';

// Segni del Razzo: due strisce e due frecce nella direzione in cui spara.
function rocketMarks(piece, vertical) {
  const turn = vertical ? ' transform="rotate(90 50 50)"' : '';
  return (
    `<g class="rocket-marks"${turn}>` +
    '<path d="M30 42 H70 M30 58 H70" fill="none" stroke="#fff" stroke-opacity="0.92" stroke-width="7" stroke-linecap="round"/>' +
    `<g fill="#fff" stroke="${piece.dark}" stroke-width="3.5" stroke-linejoin="round">` +
    '<polygon points="17,36 2,50 17,64"/><polygon points="83,36 98,50 83,64"/>' +
    '</g></g>'
  );
}

// Arcobaleno: sfera a sei spicchi, uno per colore.
function rainbowSVG() {
  let wedges = '';
  for (let i = 0; i < 6; i++) {
    const a0 = ((i * 60 - 90) * Math.PI) / 180;
    const a1 = (((i + 1) * 60 - 90) * Math.PI) / 180;
    const p = (a) => `${(50 + 41 * Math.cos(a)).toFixed(1)} ${(50 + 41 * Math.sin(a)).toFixed(1)}`;
    wedges += `<path d="M50 50 L${p(a0)} A41 41 0 0 1 ${p(a1)} Z" fill="${PIECES[i].main}"/>`;
  }
  return (
    `<svg xmlns="${SVG_NS}" viewBox="0 0 100 100" class="piece piece-rainbow" aria-hidden="true" focusable="false">` +
    `<circle cx="50" cy="55" r="41" fill="${SHADOW}" opacity="0.22"/>` +
    `<g class="rainbow-spin">${wedges}</g>` +
    '<circle cx="50" cy="50" r="41" fill="url(#tdd-gloss)"/>' +
    '<circle cx="50" cy="50" r="41" fill="none" stroke="#fff" stroke-width="4"/>' +
    '<circle cx="50" cy="50" r="9" fill="#fff"/>' +
    '</svg>'
  );
}

// SVG di una caramella del colore dato (0..5), normale o speciale.
export function candySVG(color, special = null) {
  if (special === 'rainbow') return rainbowSVG();
  const piece = PIECES[color];
  if (!piece) throw new Error(`Colore sconosciuto: ${color}`);
  const stroke = piece.stroked ? ` stroke="url(#tdd-g${color})"` : '';
  const shadowStroke = piece.stroked ? ` stroke="${SHADOW}"` : '';
  let behind = '';
  let front = '';
  if (special === 'rocketH' || special === 'rocketV') {
    front = rocketMarks(piece, special === 'rocketV');
  } else if (special === 'bomb') {
    // Bomba: alone che pulsa dietro, nocciolo scuro con una scintilla davanti.
    behind = `<circle class="bomb-halo" cx="50" cy="50" r="46" fill="#fff" fill-opacity="0.6" stroke="${piece.main}" stroke-width="5"/>`;
    front =
      `<circle cx="50" cy="52" r="16" fill="${SHADOW}"/>` +
      '<path d="M50 40 L53 49 L62 52 L53 55 L50 64 L47 55 L38 52 L47 49 Z" fill="#fff"/>';
  }
  return (
    `<svg xmlns="${SVG_NS}" viewBox="0 0 100 100" class="piece piece-${color}${special ? ` piece-${special}` : ''}" aria-hidden="true" focusable="false">` +
    behind +
    // ombra leggera: la stessa forma, più scura e spostata in basso
    `<g transform="translate(0 5)" fill="${SHADOW}"${shadowStroke} opacity="0.22">${piece.shape}</g>` +
    `<g fill="url(#tdd-g${color})"${stroke}>${piece.shape}</g>` +
    (piece.detail ?? '') +
    `<g fill="#fff" opacity="0.6">${piece.shine}</g>` +
    front +
    '</svg>'
  );
}
