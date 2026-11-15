// Stato della partita: mosse, punteggio, obiettivo, stelle, vittoria e sconfitta.
import { CONFIG } from '../config.js';
import { boardFromLayout, createCandy, fillWithoutMatches, isAdjacent } from './board.js';
import { hasMatches } from './match.js';
import { hasValidMove, isSwappable, shuffleBoard, swapCandies } from './moves.js';
import { resolveBoard } from './resolve.js';
import { createRng } from './rng.js';

export { findValidMoves, getHint } from './moves.js';

// Crea una partita: tabellone senza match e con almeno una mossa valida.
export function createGame(levelDef, seed = 1) {
  const colors = levelDef.colors ?? CONFIG.DEFAULT_COLORS;
  if (!Number.isInteger(colors) || colors < CONFIG.MIN_COLORS || colors > CONFIG.MAX_COLORS) {
    throw new Error(`Numero di colori non valido: ${colors}`);
  }
  const state = {
    level: levelDef,
    colors,
    board: boardFromLayout(levelDef.layout),
    rng: createRng(seed),
    nextId: 1,
    movesLeft: levelDef.moves,
    movesUsed: 0,
    score: 0,
    collected: {}, // caramelle eliminate per colore
    maxCascade: 0,
  };

  for (let attempt = 0; attempt < CONFIG.MAX_GENERATION_ATTEMPTS; attempt++) {
    fillWithoutMatches(state.board, colors, state.rng, (color) =>
      createCandy(state.nextId++, color)
    );
    if (!hasMatches(state.board) && hasValidMove(state.board)) return state;
  }
  throw new Error('Impossibile generare un tabellone giocabile per questo livello');
}

// Prova a scambiare due caselle adiacenti.
// → { valid, steps }: lo stato cambia solo se valid è true.
// Se lo scambio non crea un match, le caramelle tornano al loro posto
// (passi 'swap' + 'swapBack') e la mossa non viene consumata.
export function trySwap(state, from, to) {
  const { board } = state;
  if (
    getStatus(state) !== 'playing' ||
    !isSwappable(board, from) ||
    !isSwappable(board, to) ||
    !isAdjacent(from, to)
  ) {
    return { valid: false, steps: [] };
  }

  const describe = () => ({
    type: 'swap',
    a: { r: from.r, c: from.c, id: board.cells[from.r][from.c].candy.id },
    b: { r: to.r, c: to.c, id: board.cells[to.r][to.c].candy.id },
  });
  const swapStep = describe();
  const steps = [swapStep];

  swapCandies(board, from, to);
  if (!hasMatches(board)) {
    swapCandies(board, from, to);
    steps.push({ ...swapStep, type: 'swapBack' });
    return { valid: false, steps };
  }

  state.movesLeft--;
  state.movesUsed++;
  const cascades = resolveBoard(state, steps);
  state.maxCascade = Math.max(state.maxCascade, cascades);

  if (getStatus(state) === 'playing' && !hasValidMove(board)) {
    steps.push(shuffleBoard(state));
  }
  return { valid: true, steps };
}

function goalReached(state) {
  const goal = state.level.goal;
  if (!goal || goal.type === 'score') return state.score >= (goal?.target ?? 0);
  return false; // gli altri obiettivi arrivano con la Fase 4
}

// 'playing' | 'won' | 'lost'
// Obiettivo "punteggio": si giocano tutte le mosse, poi si vince se il target è raggiunto.
export function getStatus(state) {
  if (state.movesLeft > 0) return 'playing';
  return goalReached(state) ? 'won' : 'lost';
}

// Stelle (0..3) in base al punteggio. Un livello vinto dà sempre almeno 1 stella.
export function getStars(state) {
  const thresholds = state.level.stars ?? [];
  let stars = 0;
  for (const threshold of thresholds) {
    if (state.score >= threshold) stars++;
  }
  stars = Math.min(stars, 3);
  if (getStatus(state) === 'won') stars = Math.max(stars, 1);
  return stars;
}
