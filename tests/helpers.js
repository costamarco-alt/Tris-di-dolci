// Aiuti condivisi dai test.
import { boardFromColors } from '../src/engine/board.js';
import { createRng } from '../src/engine/rng.js';

// Stato minimo di partita costruito attorno a un tabellone scritto a mano.
export function stateFromColors(lines, { colors = 5, seed = 1, moves = 10, level = {} } = {}) {
  const board = boardFromColors(lines);
  let count = 0;
  for (const row of board.cells) for (const cell of row) if (cell.candy) count++;
  return {
    level: { moves, goal: { type: 'score', target: 0 }, ...level },
    colors,
    board,
    rng: createRng(seed),
    nextId: count + 1,
    movesLeft: moves,
    movesUsed: 0,
    score: 0,
    collected: {},
    maxCascade: 0,
    bonus: 0,
    stuck: false,
    jellyTotal: 0,
    iceTotal: 0,
  };
}

// Tutti gli id delle caramelle presenti sul tabellone.
export function allIds(board) {
  const ids = [];
  for (const row of board.cells) for (const cell of row) if (cell.candy) ids.push(cell.candy.id);
  return ids;
}

// Vero se ogni casella giocabile ha una caramella.
export function isFull(board) {
  return board.cells.every((row) => row.every((cell) => cell.hole || cell.candy));
}

// Tabellone 6×6 a 4 colori senza match e senza mosse valide.
export const NO_MOVES = ['012301', '230123', '012301', '230123', '012301', '230123'];

// Tabellone 6×6 a 6 colori senza match e senza mosse valide: ogni riga contiene
// una caramella per colore. Comodo come base per provare gli speciali.
export const QUIET = ['012345', '345012', '012345', '345012', '012345', '345012'];

export function setSpecial(state, r, c, special) {
  state.board.cells[r][c].candy.special = special;
  return state.board.cells[r][c].candy;
}

// Chiave leggibile di una casella, per confrontare insiemi di caselle.
export const cellKeys = (cells) => cells.map((p) => `${p.r},${p.c}`).sort();
