import test from 'node:test';
import assert from 'node:assert/strict';
import { boardFromColors, boardToColors } from '../src/engine/board.js';
import { hasMatches } from '../src/engine/match.js';
import {
  findBoardMoves,
  findValidMoves,
  getHint,
  hasValidMove,
  isSwappable,
  shuffleBoard,
  swapCandies,
} from '../src/engine/moves.js';
import { allIds, NO_MOVES, stateFromColors } from './helpers.js';

test('moves: trova l\'unica mossa valida', () => {
  // Scambiando (0,2) con (1,2) si allineano tre 0 nella riga 0.
  const board = boardFromColors(['0012', '3403', '1234']);
  const moves = findBoardMoves(board);
  assert.deepEqual(moves, [{ from: { r: 0, c: 2 }, to: { r: 1, c: 2 }, score: 30 }]);
  assert.ok(hasValidMove(board));
});

test('moves: la ricerca non modifica il tabellone', () => {
  const lines = ['0012', '3403', '1234'];
  const board = boardFromColors(lines);
  const ids = allIds(board);
  findBoardMoves(board);
  hasValidMove(board);
  assert.deepEqual(boardToColors(board), lines);
  assert.deepEqual(allIds(board), ids);
});

test('moves: tabellone senza mosse', () => {
  const board = boardFromColors(NO_MOVES);
  assert.equal(hasMatches(board), false);
  assert.equal(hasValidMove(board), false);
  assert.deepEqual(findBoardMoves(board), []);
  assert.equal(getHint({ board }), null);
});

test('moves: mossa valida sul bordo e nell\'angolo', () => {
  // Scambiando (0,0) con (0,1) lo 0 va nell'angolo e completa la colonna 0.
  const board = boardFromColors(['2013', '0134', '0245']);
  const moves = findBoardMoves(board);
  assert.ok(moves.some((m) => m.from.r === 0 && m.from.c === 0 && m.to.r === 0 && m.to.c === 1));
  for (const move of moves) {
    const copy = boardFromColors(boardToColors(board));
    swapCandies(copy, move.from, move.to);
    assert.ok(hasMatches(copy), 'ogni mossa trovata crea davvero un match');
  }
});

test('moves: i buchi non si scambiano e non fanno da ponte', () => {
  const board = boardFromColors(['00x0', '1213']);
  assert.equal(isSwappable(board, { r: 0, c: 2 }), false);
  assert.equal(hasValidMove(board), false);
});

test('moves: le caselle vuote, ghiacciate o fuori dal tabellone non si scambiano', () => {
  const board = boardFromColors(['0_1']);
  assert.equal(isSwappable(board, { r: 0, c: 1 }), false);
  assert.equal(isSwappable(board, { r: 0, c: 9 }), false);
  assert.equal(isSwappable(board, { r: -1, c: 0 }), false);
  board.cells[0][0].ice = 1;
  assert.equal(isSwappable(board, { r: 0, c: 0 }), false);
  assert.equal(isSwappable(board, { r: 0, c: 2 }), true);
});

test('moves: il punteggio della mossa conta le caramelle eliminate subito', () => {
  // Scambiando (1,3) con (0,3) si fanno 4 in fila nella riga 0.
  const board = boardFromColors(['00012', '12301', '23123']);
  const moves = findBoardMoves(board);
  const best = getHint({ board });
  assert.deepEqual(best, { from: { r: 0, c: 3 }, to: { r: 1, c: 3 }, score: 40 });
  assert.ok(moves.every((m) => m.score <= best.score));
});

test('moves: findValidMoves e getHint lavorano sullo stato', () => {
  const state = stateFromColors(['0012', '3403', '1234']);
  assert.equal(findValidMoves(state).length, 1);
  assert.deepEqual(getHint(state), { from: { r: 0, c: 2 }, to: { r: 1, c: 2 }, score: 30 });
});

test('moves: il rimescolo garantisce una mossa, nessun match e le stesse caramelle', () => {
  for (let seed = 1; seed <= 30; seed++) {
    const state = stateFromColors(NO_MOVES, { colors: 4, seed });
    const idsBefore = allIds(state.board).sort((a, b) => a - b);
    const colorsBefore = boardToColors(state.board).join('').split('').sort().join('');
    const step = shuffleBoard(state);
    assert.equal(step.type, 'shuffle');
    assert.equal(step.success, true);
    assert.equal(step.recolored, false);
    assert.ok(hasValidMove(state.board), `nessuna mossa dopo il rimescolo (seed ${seed})`);
    assert.ok(!hasMatches(state.board), `match dopo il rimescolo (seed ${seed})`);
    assert.deepEqual(allIds(state.board).sort((a, b) => a - b), idsBefore);
    assert.equal(boardToColors(state.board).join('').split('').sort().join(''), colorsBefore);
    assert.equal(step.candies.length, 36);
    for (const item of step.candies) {
      const candy = state.board.cells[item.to.r][item.to.c].candy;
      assert.equal(candy.id, item.id);
      assert.equal(candy.color, item.color);
    }
  }
});

test('moves: il rimescolo rispetta i buchi', () => {
  const state = stateFromColors(['x01230', '230123', '0123x1', '230123', '012301', '23012x'], {
    colors: 4,
    seed: 2,
  });
  assert.equal(hasValidMove(state.board), false);
  const step = shuffleBoard(state);
  assert.equal(step.success, true);
  assert.equal(state.board.cells[0][0].hole, true);
  assert.equal(state.board.cells[0][0].candy, null);
  assert.equal(step.candies.length, 33);
  assert.ok(hasValidMove(state.board));
});

test('moves: se permutare non basta, il rimescolo cambia i colori mantenendo gli id', () => {
  // Sei caramelle tutte diverse: nessuna permutazione può creare una mossa.
  const state = stateFromColors(['012', '345'], { colors: 3, seed: 4 });
  assert.equal(hasValidMove(state.board), false);
  const step = shuffleBoard(state);
  assert.equal(step.success, true);
  assert.equal(step.recolored, true);
  assert.ok(hasValidMove(state.board));
  assert.ok(!hasMatches(state.board));
  assert.deepEqual(allIds(state.board).sort((a, b) => a - b), [1, 2, 3, 4, 5, 6]);
  for (const item of step.candies) {
    assert.equal(state.board.cells[item.to.r][item.to.c].candy.color, item.color);
  }
});

test('moves: il rimescolo è riproducibile con lo stesso seed', () => {
  const a = stateFromColors(NO_MOVES, { colors: 4, seed: 8 });
  const b = stateFromColors(NO_MOVES, { colors: 4, seed: 8 });
  shuffleBoard(a);
  shuffleBoard(b);
  assert.deepEqual(boardToColors(a.board), boardToColors(b.board));
});
