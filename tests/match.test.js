import test from 'node:test';
import assert from 'node:assert/strict';
import { boardFromColors } from '../src/engine/board.js';
import { findMatches, findRuns, hasMatches } from '../src/engine/match.js';

const matches = (lines) => findMatches(boardFromColors(lines));

test('match: nessun match su un tabellone tranquillo', () => {
  const board = boardFromColors(['0101', '1010', '0101']);
  assert.deepEqual(findMatches(board), []);
  assert.equal(hasMatches(board), false);
});

test('match: due sole caramelle uguali non bastano', () => {
  assert.equal(matches(['0012', '3451']).length, 0);
});

test('match: 3 in fila orizzontale', () => {
  const groups = matches(['1000', '2345', '1234']);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].shape, 'line3');
  assert.equal(groups[0].orientation, 'h');
  assert.equal(groups[0].color, 0);
  assert.deepEqual(groups[0].cells, [{ r: 0, c: 1 }, { r: 0, c: 2 }, { r: 0, c: 3 }]);
});

test('match: 3 in fila verticale, anche lungo il bordo', () => {
  const groups = matches(['120', '340', '510']);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].shape, 'line3');
  assert.equal(groups[0].orientation, 'v');
  assert.deepEqual(groups[0].cells, [{ r: 0, c: 2 }, { r: 1, c: 2 }, { r: 2, c: 2 }]);
});

test('match: 4 in fila è riconosciuto con il suo orientamento', () => {
  const h = matches(['2222', '0101']);
  assert.equal(h[0].shape, 'line4');
  assert.equal(h[0].orientation, 'h');
  const v = matches(['30', '31', '30', '31']);
  assert.equal(v[0].shape, 'line4');
  assert.equal(v[0].orientation, 'v');
});

test('match: 5 in fila e 6 in fila contano come "line5"', () => {
  const five = matches(['11111', '02020']);
  assert.equal(five[0].shape, 'line5');
  assert.equal(five[0].cells.length, 5);
  const six = matches(['444444']);
  assert.equal(six[0].shape, 'line5');
  assert.equal(six[0].cells.length, 6);
});

test('match: forma a L (incrocio nell\'angolo)', () => {
  const groups = matches(['012', '021', '000']);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].shape, 'L');
  assert.equal(groups[0].orientation, null);
  assert.equal(groups[0].cells.length, 5, 'la casella d\'angolo si conta una volta sola');
});

test('match: forma a T (incrocio a metà di una fila)', () => {
  const groups = matches(['000', '102', '201']);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].shape, 'T');
  assert.equal(groups[0].cells.length, 5);
});

test('match: una croce conta come T', () => {
  const groups = matches(['102', '000', '201']);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].shape, 'T');
});

test('match: priorità — 5 in fila batte la forma a T', () => {
  const groups = matches(['00000', '12013', '21031']);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].shape, 'line5');
  assert.equal(groups[0].cells.length, 7);
});

test('match: priorità — la forma a L batte il 4 in fila', () => {
  const groups = matches(['0000', '0123', '0231']);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].shape, 'L');
  assert.equal(groups[0].cells.length, 6);
});

test('match: due gruppi separati restano separati', () => {
  const groups = matches(['000', '121', '333']);
  assert.equal(groups.length, 2);
  assert.deepEqual(groups.map((g) => g.color), [0, 3]);
});

test('match: due file vicine dello stesso colore ma non incrociate sono due gruppi', () => {
  const groups = matches(['0001', '1000']);
  assert.equal(groups.length, 2);
});

test('match: un buco interrompe la fila', () => {
  assert.equal(matches(['00x0', '1212']).length, 0);
  assert.equal(matches(['0', '0', 'x', '0']).length, 0);
});

test('match: una casella vuota interrompe la fila', () => {
  assert.equal(matches(['00_0']).length, 0);
});

test('match: 3 in fila subito dopo un buco', () => {
  const groups = matches(['x000', '1212']);
  assert.equal(groups.length, 1);
  assert.deepEqual(groups[0].cells[0], { r: 0, c: 1 });
});

test('match: l\'Arcobaleno non entra nei match normali', () => {
  const board = boardFromColors(['000', '121']);
  board.cells[0][1].candy.special = 'rainbow';
  assert.equal(findMatches(board).length, 0);
});

test('match: findRuns elenca file orizzontali e verticali', () => {
  const runs = findRuns(boardFromColors(['000', '012', '021']));
  assert.equal(runs.length, 2);
  assert.deepEqual(runs.map((r) => r.orientation).sort(), ['h', 'v']);
});
