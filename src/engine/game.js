// Stato della partita: mosse, punteggio, obiettivo, stelle, vittoria e sconfitta.
import { CONFIG } from '../config.js';
import { boardFromLayout, createCandy, fillWithoutMatches, isAdjacent } from './board.js';
import { hasMatches } from './match.js';
import { hasValidMove, isSwappable, shuffleBoard, swapCandies } from './moves.js';
import { resolveBoard } from './resolve.js';
import { createRng } from './rng.js';
import { isSpecialSwap } from './specials.js';

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
    bonus: 0, // punti delle mosse avanzate
    stuck: false, // vero solo se nemmeno il rimescolo trova una mossa
    jellyTotal: 0,
    iceTotal: 0,
  };
  const layers = countLayers(state.board);
  state.jellyTotal = layers.jelly;
  state.iceTotal = layers.ice;

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
// Eccezione: gli scambi tra speciali e quelli con un Arcobaleno valgono sempre.
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

  // Due speciali tra loro, o un Arcobaleno con qualsiasi caramella: sempre valido.
  const combo = isSpecialSwap(board.cells[from.r][from.c].candy, board.cells[to.r][to.c].candy);

  swapCandies(board, from, to);
  if (!combo && !hasMatches(board)) {
    swapCandies(board, from, to);
    steps.push({ ...swapStep, type: 'swapBack' });
    return { valid: false, steps };
  }

  state.movesLeft--;
  state.movesUsed++;
  const cascades = resolveBoard(state, steps, combo ? { combo: { from, to } } : { swap: { from, to } });
  state.maxCascade = Math.max(state.maxCascade, cascades);

  // Obiettivo completato con mosse avanzate: diventano punti.
  if (getStatus(state) === 'won' && state.movesLeft > 0 && state.bonus === 0) {
    state.bonus = state.movesLeft * CONFIG.LEFTOVER_MOVE_BONUS;
    state.score += state.bonus;
    steps.push({ type: 'bonus', moves: state.movesLeft, points: state.bonus });
  }

  if (getStatus(state) === 'playing' && !hasValidMove(board)) {
    const shuffle = shuffleBoard(state);
    steps.push(shuffle);
    if (!shuffle.success) state.stuck = true;
  }
  return { valid: true, steps };
}

// Strati di gelatina e di ghiaccio ancora presenti sul tabellone.
export function countLayers(board) {
  let jelly = 0;
  let ice = 0;
  for (const row of board.cells) {
    for (const cell of row) {
      if (cell.hole) continue;
      jelly += cell.jelly;
      ice += cell.ice;
    }
  }
  return { jelly, ice };
}

// Avanzamento dell'obiettivo, per l'HUD:
//   score   → { type, current, target, done }
//   collect → { type, items: [{ color, current, count, done }], done }
//   jelly / ice → { type, remaining, total, done }
export function getGoalProgress(state) {
  const goal = state.level.goal ?? { type: 'score', target: 0 };
  if (goal.type === 'collect') {
    const items = goal.items.map((item) => {
      const current = Math.min(item.count, state.collected[item.color] ?? 0);
      return { color: item.color, current, count: item.count, done: current >= item.count };
    });
    return { type: 'collect', items, done: items.every((item) => item.done) };
  }
  if (goal.type === 'jelly' || goal.type === 'ice') {
    const remaining = countLayers(state.board)[goal.type];
    const total = goal.type === 'jelly' ? state.jellyTotal : state.iceTotal;
    return { type: goal.type, remaining, total, done: remaining === 0 };
  }
  const target = goal.target ?? 0;
  return { type: 'score', current: state.score, target, done: state.score >= target };
}

// 'playing' | 'won' | 'lost'
// - Obiettivo "punteggio": si giocano tutte le mosse, poi si vince se il target è raggiunto.
// - Altri obiettivi: si vince appena l'obiettivo è completato.
export function getStatus(state) {
  const progress = getGoalProgress(state);
  if (progress.type !== 'score' && progress.done) return 'won';
  if (state.movesLeft > 0 && !state.stuck) return 'playing';
  return progress.done ? 'won' : 'lost';
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
