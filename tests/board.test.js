import test from 'node:test';
import assert from 'node:assert/strict';
import {
  boardFromColors,
  boardFromLayout,
  boardToColors,
  cloneBoard,
  createCandy,
  fillWithoutMatches,
  getCell,
  inBounds,
  isAdjacent,
  playableCells,
} from '../src/engine/board.js';
import { hasMatches } from '../src/engine/match.js';
import { createRng } from '../src/engine/rng.js';

test('board: senza layout il tabellone è 8×8 pieno', () => {
  const board = boardFromLayout(undefined);
  assert.equal(board.rows, 8);
  assert.equal(board.cols, 8);
  assert.equal(playableCells(board).length, 64);
  assert.deepEqual(board.cells[0][0], { candy: null, hole: false, jelly: 0, ice: 0 });
});

test('board: il layout riconosce buchi, gelatina e ghiaccio', () => {
  const board = boardFromLayout(['.xj', 'JiI']);
  assert.equal(board.rows, 2);
  assert.equal(board.cols, 3);
  assert.equal(board.cells[0][1].hole, true);
  assert.equal(board.cells[0][2].jelly, 1);
  assert.equal(board.cells[1][0].jelly, 2);
  assert.equal(board.cells[1][1].ice, 1);
  assert.equal(board.cells[1][2].ice, 2);
  assert.equal(playableCells(board).length, 5);
});

test('board: layout sbagliati vengono rifiutati', () => {
  assert.throws(() => boardFromLayout(['...', '..']), /lunghezza/);
  assert.throws(() => boardFromLayout(['..?']), /simbolo/);
  assert.throws(() => boardFromLayout([]), /Layout/);
  assert.throws(() => boardFromLayout(['..........']), /Dimensioni/);
});

test('board: boardFromColors e boardToColors sono uno il contrario dell\'altro', () => {
  const lines = ['01x', '_23'];
  const board = boardFromColors(lines);
  assert.deepEqual(boardToColors(board), lines);
  assert.equal(board.cells[0][0].candy.id, 1);
  assert.equal(board.cells[1][2].candy.id, 4);
  assert.equal(board.cells[0][2].hole, true);
  assert.equal(board.cells[1][0].candy, null);
});

test('board: inBounds, getCell e isAdjacent', () => {
  const board = boardFromColors(['012', '345']);
  assert.ok(inBounds(board, 1, 2));
  assert.ok(!inBounds(board, 2, 0));
  assert.ok(!inBounds(board, 0, -1));
  assert.equal(getCell(board, 5, 5), null);
  assert.ok(isAdjacent({ r: 0, c: 0 }, { r: 0, c: 1 }));
  assert.ok(isAdjacent({ r: 1, c: 1 }, { r: 0, c: 1 }));
  assert.ok(!isAdjacent({ r: 0, c: 0 }, { r: 1, c: 1 }), 'niente diagonali');
  assert.ok(!isAdjacent({ r: 0, c: 0 }, { r: 0, c: 2 }));
  assert.ok(!isAdjacent({ r: 0, c: 0 }, { r: 0, c: 0 }));
});

test('board: cloneBoard crea una copia indipendente', () => {
  const board = boardFromColors(['012']);
  const copy = cloneBoard(board);
  copy.cells[0][0].candy.color = 5;
  copy.cells[0][1].candy = null;
  assert.equal(board.cells[0][0].candy.color, 0);
  assert.ok(board.cells[0][1].candy);
});

test('board: il riempimento non crea mai match, con ogni numero di colori', () => {
  for (let colors = 3; colors <= 6; colors++) {
    for (let seed = 1; seed <= 50; seed++) {
      const board = boardFromLayout(undefined);
      let id = 1;
      fillWithoutMatches(board, colors, createRng(seed), (color) => createCandy(id++, color));
      assert.ok(!hasMatches(board), `match iniziale con ${colors} colori, seed ${seed}`);
      for (const { r, c } of playableCells(board)) {
        const candy = board.cells[r][c].candy;
        assert.ok(candy && candy.color >= 0 && candy.color < colors);
      }
    }
  }
});

test('board: il riempimento rispetta i buchi', () => {
  const board = boardFromLayout(['x..x', '....', '.xx.', '....']);
  let id = 1;
  fillWithoutMatches(board, 4, createRng(3), (color) => createCandy(id++, color));
  assert.equal(board.cells[0][0].candy, null);
  assert.equal(board.cells[2][1].candy, null);
  assert.equal(id - 1, 12, 'una caramella per ogni casella giocabile');
  assert.ok(!hasMatches(board));
});
