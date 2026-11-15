import test from 'node:test';
import assert from 'node:assert/strict';
import { boardToColors, playableCells } from '../src/engine/board.js';
import {
  createGame,
  findValidMoves,
  getHint,
  getStars,
  getStatus,
  trySwap,
} from '../src/engine/game.js';
import { hasMatches } from '../src/engine/match.js';
import { hasValidMove } from '../src/engine/moves.js';
import { allIds, isFull, NO_MOVES, stateFromColors } from './helpers.js';

const LEVEL = { id: 1, moves: 20, colors: 5, goal: { type: 'score', target: 3000 }, stars: [3000, 5000, 7500] };

test('game: il tabellone iniziale è pieno, senza match e con almeno una mossa', () => {
  for (let seed = 1; seed <= 100; seed++) {
    const state = createGame({ ...LEVEL, colors: 4 + (seed % 3) }, seed);
    assert.ok(isFull(state.board));
    assert.ok(!hasMatches(state.board), `match iniziale con seed ${seed}`);
    assert.ok(hasValidMove(state.board), `nessuna mossa con seed ${seed}`);
    const ids = allIds(state.board);
    assert.equal(new Set(ids).size, 64);
  }
});

test('game: stato iniziale', () => {
  const state = createGame(LEVEL, 1);
  assert.equal(state.movesLeft, 20);
  assert.equal(state.score, 0);
  assert.equal(getStatus(state), 'playing');
  assert.equal(getStars(state), 0);
  assert.equal(state.board.rows, 8);
  assert.equal(state.board.cols, 8);
});

test('game: stesso seed, stessa partita', () => {
  const a = createGame(LEVEL, 77);
  const b = createGame(LEVEL, 77);
  assert.deepEqual(boardToColors(a.board), boardToColors(b.board));
  const move = getHint(a);
  const resA = trySwap(a, move.from, move.to);
  const resB = trySwap(b, move.from, move.to);
  assert.deepEqual(resA, resB);
  assert.deepEqual(boardToColors(a.board), boardToColors(b.board));
  assert.notDeepEqual(boardToColors(createGame(LEVEL, 78).board), boardToColors(a.board));
});

test('game: il layout con i buchi viene rispettato', () => {
  const layout = ['xx....xx', 'x......x', '........', '........', '........', '........', 'x......x', 'xx....xx'];
  for (let seed = 1; seed <= 20; seed++) {
    const state = createGame({ ...LEVEL, layout }, seed);
    assert.equal(state.board.cells[0][0].hole, true);
    assert.equal(state.board.cells[0][0].candy, null);
    assert.equal(allIds(state.board).length, playableCells(state.board).length);
    assert.ok(hasValidMove(state.board));
  }
});

test('game: numero di colori non valido', () => {
  assert.throws(() => createGame({ ...LEVEL, colors: 2 }, 1), /colori/);
  assert.throws(() => createGame({ ...LEVEL, colors: 7 }, 1), /colori/);
});

test('game: un livello impossibile da rendere giocabile dà errore', () => {
  assert.throws(() => createGame({ ...LEVEL, layout: ['..', '..'] }, 1), /giocabile/);
});

test('game: scambio valido — consuma una mossa e restituisce i passi', () => {
  const state = stateFromColors(['0012', '3403', '1234']);
  const result = trySwap(state, { r: 0, c: 2 }, { r: 1, c: 2 });
  assert.equal(result.valid, true);
  assert.equal(state.movesLeft, 9);
  assert.equal(state.movesUsed, 1);
  assert.deepEqual(result.steps[0], {
    type: 'swap',
    a: { r: 0, c: 2, id: 3 },
    b: { r: 1, c: 2, id: 7 },
  });
  assert.deepEqual(result.steps.slice(1, 3).map((s) => s.type), ['cascade', 'clear']);
  assert.deepEqual(result.steps[2].cells.map((c) => c.id), [1, 2, 7]);
  assert.ok(state.score >= 30);
  assert.ok(isFull(state.board));
  assert.ok(!hasMatches(state.board));
});

test('game: lo scambio vale in entrambi i versi', () => {
  const state = stateFromColors(['0012', '3403', '1234']);
  assert.equal(trySwap(state, { r: 1, c: 2 }, { r: 0, c: 2 }).valid, true);
});

test('game: scambio senza match — torna indietro e non consuma la mossa', () => {
  const lines = ['0012', '3403', '1234'];
  const state = stateFromColors(lines);
  const result = trySwap(state, { r: 0, c: 0 }, { r: 1, c: 0 });
  assert.equal(result.valid, false);
  assert.deepEqual(result.steps.map((s) => s.type), ['swap', 'swapBack']);
  assert.deepEqual(result.steps[0].a, { r: 0, c: 0, id: 1 });
  assert.deepEqual(result.steps[1].b, { r: 1, c: 0, id: 5 });
  assert.equal(state.movesLeft, 10);
  assert.equal(state.score, 0);
  assert.deepEqual(boardToColors(state.board), lines);
  assert.equal(state.board.cells[0][0].candy.id, 1);
});

test('game: scambi non ammessi — diagonale, lontano, stessa casella, fuori, buco', () => {
  const lines = ['0012', '34x3', '1234'];
  const state = stateFromColors(lines);
  const bad = [
    [{ r: 0, c: 0 }, { r: 1, c: 1 }],
    [{ r: 0, c: 0 }, { r: 0, c: 2 }],
    [{ r: 0, c: 0 }, { r: 0, c: 0 }],
    [{ r: 0, c: 0 }, { r: -1, c: 0 }],
    [{ r: 0, c: 3 }, { r: 0, c: 4 }],
    [{ r: 0, c: 2 }, { r: 1, c: 2 }],
    [{ r: 1, c: 2 }, { r: 1, c: 1 }],
  ];
  for (const [from, to] of bad) {
    assert.deepEqual(trySwap(state, from, to), { valid: false, steps: [] });
  }
  assert.equal(state.movesLeft, 10);
  assert.deepEqual(boardToColors(state.board), lines);
});

test('game: match fatto dalla caramella che arriva dall\'altra parte dello scambio', () => {
  // Scambiando (1,0) con (1,1) è lo 0 che va a sinistra a completare la colonna 0.
  const state = stateFromColors(['012', '103', '034', '021']);
  const result = trySwap(state, { r: 1, c: 0 }, { r: 1, c: 1 });
  assert.equal(result.valid, true);
});

test('game: quando le mosse valide finiscono parte il rimescolo', () => {
  // Trova un seed in cui, dopo la mossa, non restano mosse: per sicurezza si
  // controlla la regola in generale su molte partite.
  let shuffles = 0;
  for (let seed = 1; seed <= 60; seed++) {
    const state = createGame({ moves: 30, colors: 6, goal: { type: 'score', target: 0 }, layout: ['....', '....', '....', '....'] }, seed);
    while (getStatus(state) === 'playing') {
      const move = getHint(state);
      assert.ok(move, 'c\'è sempre una mossa finché si gioca');
      const { valid, steps } = trySwap(state, move.from, move.to);
      assert.ok(valid);
      const index = steps.findIndex((s) => s.type === 'shuffle');
      if (index >= 0) {
        shuffles++;
        assert.equal(index, steps.length - 1, 'il rimescolo è l\'ultimo passo');
        assert.equal(steps[index].success, true);
      }
      assert.ok(!hasMatches(state.board));
      assert.ok(isFull(state.board));
    }
  }
  assert.ok(shuffles > 0, 'su un tabellone 4×4 a 6 colori il rimescolo capita');
});

test('game: tabellone senza mosse — nessuno scambio è valido', () => {
  const state = stateFromColors(NO_MOVES, { colors: 4 });
  assert.deepEqual(findValidMoves(state), []);
  const result = trySwap(state, { r: 0, c: 0 }, { r: 0, c: 1 });
  assert.equal(result.valid, false);
  assert.equal(state.movesLeft, 10);
});

test('game: obiettivo punteggio — si giocano tutte le mosse, poi vittoria o sconfitta', () => {
  const play = (target) => {
    const state = createGame({ moves: 3, colors: 5, goal: { type: 'score', target }, stars: [target, target * 2, target * 3] }, 12);
    let turns = 0;
    while (getStatus(state) === 'playing') {
      const move = getHint(state);
      trySwap(state, move.from, move.to);
      turns++;
      if (turns < 3) assert.equal(getStatus(state), 'playing', 'anche a target raggiunto si continua');
    }
    assert.equal(turns, 3);
    assert.equal(state.movesLeft, 0);
    return state;
  };
  const won = play(30);
  assert.equal(getStatus(won), 'won');
  assert.ok(getStars(won) >= 1);
  const lost = play(1000000);
  assert.equal(getStatus(lost), 'lost');
  assert.equal(getStars(lost), 0);
});

test('game: a partita finita non si può più scambiare', () => {
  const state = stateFromColors(['0012', '3403', '1234'], { moves: 1 });
  assert.equal(trySwap(state, { r: 0, c: 2 }, { r: 1, c: 2 }).valid, true);
  assert.equal(getStatus(state), 'won');
  const move = getHint(state);
  if (move) assert.deepEqual(trySwap(state, move.from, move.to), { valid: false, steps: [] });
});

test('game: stelle in base alle soglie di punteggio', () => {
  const state = stateFromColors(['0012', '3403', '1234'], {
    level: { goal: { type: 'score', target: 100 }, stars: [100, 200, 300] },
  });
  const expected = [[0, 0], [99, 0], [100, 1], [199, 1], [200, 2], [300, 3], [9999, 3]];
  for (const [score, stars] of expected) {
    state.score = score;
    assert.equal(getStars(state), stars, `punteggio ${score}`);
  }
});

test('game: un livello vinto dà sempre almeno 1 stella', () => {
  const state = stateFromColors(['0012', '3403', '1234'], {
    level: { goal: { type: 'score', target: 50 }, stars: [500, 800, 1000] },
  });
  state.score = 60;
  state.movesLeft = 0;
  assert.equal(getStatus(state), 'won');
  assert.equal(getStars(state), 1);
});

test('game: partite intere giocate dal suggerimento restano sempre coerenti', () => {
  for (let seed = 1; seed <= 25; seed++) {
    const state = createGame({ ...LEVEL, colors: 4 + (seed % 3) }, seed);
    let previousScore = 0;
    while (getStatus(state) === 'playing') {
      const move = getHint(state);
      assert.ok(move, `nessuna mossa disponibile (seed ${seed})`);
      const { valid } = trySwap(state, move.from, move.to);
      assert.ok(valid);
      assert.ok(state.score > previousScore);
      previousScore = state.score;
      assert.ok(isFull(state.board));
      assert.ok(!hasMatches(state.board));
      const ids = allIds(state.board);
      assert.equal(new Set(ids).size, ids.length);
    }
    assert.equal(state.movesUsed, 20);
  }
});
