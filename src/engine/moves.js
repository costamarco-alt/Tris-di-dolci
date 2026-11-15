// Mosse valide, suggerimento e rimescolo. Logica pura.
import { CONFIG } from '../config.js';
import { fillWithoutMatches, getCell } from './board.js';
import { findMatches, hasMatches } from './match.js';

// Una casella si può scambiare se ha una caramella non ghiacciata.
export function isSwappable(board, pos) {
  const cell = getCell(board, pos.r, pos.c);
  return Boolean(cell && !cell.hole && cell.candy && cell.ice === 0);
}

export function swapCandies(board, a, b) {
  const cellA = board.cells[a.r][a.c];
  const cellB = board.cells[b.r][b.c];
  const tmp = cellA.candy;
  cellA.candy = cellB.candy;
  cellB.candy = tmp;
}

// Scorre tutte le coppie di caselle adiacenti scambiabili.
// visit(from, to, cleared) riceve quante caramelle verrebbero eliminate subito;
// se restituisce true la ricerca si ferma.
function scanMoves(board, visit) {
  for (let r = 0; r < board.rows; r++) {
    for (let c = 0; c < board.cols; c++) {
      const from = { r, c };
      if (!isSwappable(board, from)) continue;
      for (const to of [{ r, c: c + 1 }, { r: r + 1, c }]) {
        if (!isSwappable(board, to)) continue;
        if (board.cells[r][c].candy.color === board.cells[to.r][to.c].candy.color) continue;
        swapCandies(board, from, to);
        let cleared = 0;
        for (const group of findMatches(board)) cleared += group.cells.length;
        swapCandies(board, from, to);
        if (cleared > 0 && visit(from, to, cleared)) return;
      }
    }
  }
}

export function findBoardMoves(board) {
  const moves = [];
  scanMoves(board, (from, to, cleared) => {
    moves.push({ from, to, score: cleared * CONFIG.SCORE_PER_CANDY });
  });
  return moves;
}

export function hasValidMove(board) {
  let found = false;
  scanMoves(board, () => (found = true));
  return found;
}

// Tutte le mosse valide: [{ from, to, score }], dove score è il punteggio immediato.
export function findValidMoves(state) {
  return findBoardMoves(state.board);
}

// Una mossa valida (quella con il punteggio immediato più alto), oppure null.
export function getHint(state) {
  let best = null;
  for (const move of findValidMoves(state)) {
    if (!best || move.score > best.score) best = move;
  }
  return best;
}

// Rimescolo: ridistribuisce le caramelle finché non ci sono match
// e c'è almeno una mossa valida. Restituisce il passo 'shuffle'.
// Le caramelle ghiacciate restano al loro posto.
export function shuffleBoard(state) {
  const { board, rng } = state;
  const positions = [];
  for (let r = 0; r < board.rows; r++) {
    for (let c = 0; c < board.cols; c++) {
      if (isSwappable(board, { r, c })) positions.push({ r, c });
    }
  }
  const before = positions.map((p) => ({ candy: board.cells[p.r][p.c].candy, from: p }));
  const isGood = () => !hasMatches(board) && hasValidMove(board);

  // 1) Si provano semplici permutazioni delle stesse caramelle.
  let done = false;
  const candies = before.map((entry) => entry.candy);
  for (let attempt = 0; attempt < CONFIG.MAX_SHUFFLE_ATTEMPTS && !done; attempt++) {
    rng.shuffle(candies);
    positions.forEach((p, i) => {
      board.cells[p.r][p.c].candy = candies[i];
    });
    done = isGood();
  }

  // 2) Se non basta (per esempio troppe caramelle dello stesso colore),
  //    si cambiano anche i colori, mantenendo gli id.
  let recolored = false;
  if (!done) {
    recolored = true;
    const movable = new Set(positions.map((p) => p.r * 16 + p.c));
    for (let attempt = 0; attempt < CONFIG.MAX_SHUFFLE_ATTEMPTS && !done; attempt++) {
      let next = 0;
      fillWithoutMatches(board, state.colors, rng, (color, r, c) => {
        if (!movable.has(r * 16 + c)) return board.cells[r][c].candy;
        const candy = candies[next++];
        candy.color = color;
        return candy;
      });
      done = isGood();
    }
  }

  const where = new Map();
  positions.forEach((p) => where.set(board.cells[p.r][p.c].candy.id, p));
  return {
    type: 'shuffle',
    recolored,
    success: done,
    candies: before.map(({ candy, from }) => ({
      id: candy.id,
      color: candy.color,
      special: candy.special,
      from: { ...from },
      to: { ...where.get(candy.id) },
    })),
  };
}
