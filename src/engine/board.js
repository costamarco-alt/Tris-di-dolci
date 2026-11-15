// Griglia e celle. Logica pura: niente DOM.
import { CONFIG } from '../config.js';

export function createCell() {
  return { candy: null, hole: false, jelly: 0, ice: 0 };
}

export function createCandy(id, color, special = null) {
  return { id, color, special };
}

// Tabellone vuoto: tutte caselle normali senza caramelle.
export function createEmptyBoard(rows, cols) {
  if (rows < 1 || cols < 1 || rows > CONFIG.MAX_SIZE || cols > CONFIG.MAX_SIZE) {
    throw new Error(`Dimensioni del tabellone non valide: ${rows}×${cols}`);
  }
  const cells = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) row.push(createCell());
    cells.push(row);
  }
  return { rows, cols, cells };
}

// Layout di un livello → tabellone senza caramelle.
//   .  casella normale     x  buco
//   j  gelatina            J  gelatina doppia
//   i  ghiaccio            I  ghiaccio doppio
// Senza layout: 8×8 pieno.
export function boardFromLayout(layout) {
  if (!layout) return createEmptyBoard(CONFIG.DEFAULT_ROWS, CONFIG.DEFAULT_COLS);
  if (!Array.isArray(layout) || layout.length === 0) {
    throw new Error('Layout non valido: serve una lista di righe');
  }
  const cols = layout[0].length;
  const board = createEmptyBoard(layout.length, cols);
  layout.forEach((line, r) => {
    if (line.length !== cols) {
      throw new Error(`Layout non valido: la riga ${r} ha lunghezza diversa`);
    }
    for (let c = 0; c < cols; c++) {
      const cell = board.cells[r][c];
      switch (line[c]) {
        case '.': break;
        case 'x': cell.hole = true; break;
        case 'j': cell.jelly = 1; break;
        case 'J': cell.jelly = 2; break;
        case 'i': cell.ice = 1; break;
        case 'I': cell.ice = 2; break;
        default:
          throw new Error(`Layout non valido: simbolo "${line[c]}" alla riga ${r}`);
      }
    }
  });
  return board;
}

// Tabellone già riempito a partire da righe di testo (comodo nei test).
//   0..5  caramella di quel colore     x  buco     _  casella vuota
// Gli id partono da firstId e crescono riga per riga.
export function boardFromColors(lines, firstId = 1) {
  const board = createEmptyBoard(lines.length, lines[0].length);
  let id = firstId;
  lines.forEach((line, r) => {
    if (line.length !== board.cols) throw new Error(`Riga ${r} di lunghezza diversa`);
    for (let c = 0; c < board.cols; c++) {
      const ch = line[c];
      const cell = board.cells[r][c];
      if (ch === 'x') cell.hole = true;
      else if (ch === '_') cell.candy = null;
      else if (ch >= '0' && ch <= '5') cell.candy = createCandy(id++, Number(ch));
      else throw new Error(`Simbolo "${ch}" non valido alla riga ${r}`);
    }
  });
  return board;
}

// Contrario di boardFromColors: utile per confrontare i tabelloni nei test.
export function boardToColors(board) {
  return board.cells.map((row) =>
    row.map((cell) => (cell.hole ? 'x' : cell.candy ? String(cell.candy.color) : '_')).join('')
  );
}

export function inBounds(board, r, c) {
  return r >= 0 && c >= 0 && r < board.rows && c < board.cols;
}

export function getCell(board, r, c) {
  return inBounds(board, r, c) ? board.cells[r][c] : null;
}

export function isAdjacent(a, b) {
  return Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1;
}

// Tutte le caselle che fanno parte del tabellone (non buchi), riga per riga.
export function playableCells(board) {
  const list = [];
  for (let r = 0; r < board.rows; r++) {
    for (let c = 0; c < board.cols; c++) {
      if (!board.cells[r][c].hole) list.push({ r, c });
    }
  }
  return list;
}

export function cloneBoard(board) {
  return {
    rows: board.rows,
    cols: board.cols,
    cells: board.cells.map((row) =>
      row.map((cell) => ({ ...cell, candy: cell.candy ? { ...cell.candy } : null }))
    ),
  };
}

function colorAt(board, r, c) {
  const cell = getCell(board, r, c);
  return cell && !cell.hole && cell.candy ? cell.candy.color : -1;
}

// Sceglie per ogni casella un colore che non crea subito un match.
// pickCandy(color, r, c) deve restituire la caramella da mettere nella casella:
// così chi chiama decide se crearne una nuova o riusarne una esistente.
export function fillWithoutMatches(board, colors, rng, pickCandy) {
  for (let r = 0; r < board.rows; r++) {
    for (let c = 0; c < board.cols; c++) {
      const cell = board.cells[r][c];
      if (cell.hole) continue;
      const banned = new Set();
      const left = colorAt(board, r, c - 1);
      if (left >= 0 && left === colorAt(board, r, c - 2)) banned.add(left);
      const up = colorAt(board, r - 1, c);
      if (up >= 0 && up === colorAt(board, r - 2, c)) banned.add(up);
      const allowed = [];
      for (let color = 0; color < colors; color++) {
        if (!banned.has(color)) allowed.push(color);
      }
      const color = allowed.length > 0 ? rng.pick(allowed) : rng.int(colors);
      cell.candy = pickCandy(color, r, c);
    }
  }
  return board;
}
