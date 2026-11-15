import test from 'node:test';
import assert from 'node:assert/strict';
import { boardToColors } from '../src/engine/board.js';
import { findMatches, hasMatches } from '../src/engine/match.js';
import { applyGravity, clearMatches, resolveBoard } from '../src/engine/resolve.js';
import { allIds, isFull, stateFromColors } from './helpers.js';

test('resolve: clearMatches svuota le caselle e assegna i punti', () => {
  const state = stateFromColors(['000', '121']);
  const steps = [];
  const n = clearMatches(state, findMatches(state.board), 1, steps);
  assert.equal(n, 3);
  assert.deepEqual(boardToColors(state.board), ['___', '121']);
  assert.equal(state.score, 30);
  assert.equal(state.collected[0], 3);
  assert.equal(steps.length, 1);
  assert.equal(steps[0].type, 'clear');
  assert.equal(steps[0].points, 30);
  assert.deepEqual(steps[0].cells.map((c) => c.id), [1, 2, 3]);
  assert.equal(steps[0].groups[0].shape, 'line3');
});

test('resolve: il moltiplicatore della cascata moltiplica i punti', () => {
  const state = stateFromColors(['0000', '1212']);
  clearMatches(state, findMatches(state.board), 3, []);
  assert.equal(state.score, 4 * 10 * 3);
});

test('resolve: una forma a L conta ogni caramella una volta sola', () => {
  const state = stateFromColors(['012', '021', '000']);
  clearMatches(state, findMatches(state.board), 1, []);
  assert.equal(state.score, 50);
});

test('resolve: gravità — le caramelle cadono mantenendo l\'ordine e gli id', () => {
  const state = stateFromColors(['1', '2', '_', '_']);
  const steps = [];
  applyGravity(state, steps);
  const fall = steps.find((s) => s.type === 'fall');
  assert.deepEqual(fall.moves, [
    { id: 2, from: { r: 1, c: 0 }, to: { r: 3, c: 0 } },
    { id: 1, from: { r: 0, c: 0 }, to: { r: 2, c: 0 } },
  ]);
  assert.equal(state.board.cells[3][0].candy.id, 2);
  assert.equal(state.board.cells[2][0].candy.id, 1);
  assert.ok(isFull(state.board));
});

test('resolve: le caramelle nuove arrivano da sopra il tabellone con id nuovi', () => {
  const state = stateFromColors(['_1', '_2', '_3']);
  const steps = [];
  applyGravity(state, steps);
  assert.equal(steps.some((s) => s.type === 'fall'), false, 'nessuna caduta: solo arrivi');
  const spawn = steps.find((s) => s.type === 'spawn');
  assert.equal(spawn.candies.length, 3);
  assert.deepEqual(spawn.candies.map((c) => c.from.r), [-3, -2, -1]);
  assert.deepEqual(spawn.candies.map((c) => c.to.r), [0, 1, 2]);
  assert.deepEqual(spawn.candies.map((c) => c.id), [4, 5, 6]);
  for (const candy of spawn.candies) {
    assert.equal(state.board.cells[candy.to.r][candy.to.c].candy.id, candy.id);
    assert.ok(candy.color >= 0 && candy.color < state.colors);
    assert.equal(candy.special, null);
  }
});

test('resolve: gravità — le caramelle attraversano i buchi', () => {
  const state = stateFromColors(['1', 'x', '_']);
  const steps = [];
  applyGravity(state, steps);
  assert.equal(state.board.cells[2][0].candy.id, 1);
  assert.equal(state.board.cells[1][0].candy, null, 'il buco resta vuoto');
  assert.ok(state.board.cells[0][0].candy, 'in cima arriva una caramella nuova');
  assert.deepEqual(steps[0].moves, [{ id: 1, from: { r: 0, c: 0 }, to: { r: 2, c: 0 } }]);
});

test('resolve: gravità — un tabellone pieno non produce passi', () => {
  const state = stateFromColors(['01', '23']);
  const steps = [];
  applyGravity(state, steps);
  assert.deepEqual(steps, []);
});

test('resolve: senza match non succede nulla', () => {
  const state = stateFromColors(['0101', '1010']);
  const steps = [];
  assert.equal(resolveBoard(state, steps), 0);
  assert.deepEqual(steps, []);
  assert.equal(state.score, 0);
});

test('resolve: ordine dei passi — cascade, clear, fall, spawn', () => {
  const state = stateFromColors(['123', '000', '231']);
  const steps = [];
  resolveBoard(state, steps);
  assert.deepEqual(steps.slice(0, 4).map((s) => s.type), ['cascade', 'clear', 'fall', 'spawn']);
  assert.equal(steps[0].n, 1);
});

test('resolve: cascata di due livelli — la seconda eliminazione vale doppio', () => {
  // Colonna 0 dall'alto: 1,0,0,0,1,1. Tolti i tre 0, l'1 in cima cade sugli altri due.
  const state = stateFromColors(['123', '034', '023', '034', '123', '134'], { colors: 6, seed: 11 });
  const steps = [];
  const cascades = resolveBoard(state, steps);
  const clears = steps.filter((s) => s.type === 'clear');
  assert.ok(cascades >= 2);
  assert.equal(clears[0].cascade, 1);
  assert.equal(clears[0].points, 30);
  assert.deepEqual(clears[0].cells.map((c) => c.id), [4, 7, 10]);
  assert.equal(clears[1].cascade, 2);
  const second = clears[1].cells.map((c) => c.id);
  for (const id of [1, 13, 16]) assert.ok(second.includes(id), `manca la caramella ${id}`);
  clears.forEach((clear, i) => {
    assert.equal(clear.points, clear.cells.length * 10 * (i + 1));
  });
  assert.equal(state.score, clears.reduce((sum, c) => sum + c.points, 0));
  assert.deepEqual(steps.filter((s) => s.type === 'cascade').map((s) => s.n).slice(0, 2), [1, 2]);
});

test('resolve: dopo la risoluzione il tabellone è pieno, senza match e con id unici', () => {
  for (let seed = 1; seed <= 40; seed++) {
    const state = stateFromColors(
      ['00011122', '33344455', '01230123', '12301230', '00122334', '55544433', '01201201', '34534534'],
      { colors: 4 + (seed % 3), seed }
    );
    const steps = [];
    const cascades = resolveBoard(state, steps);
    assert.ok(cascades >= 1);
    assert.ok(isFull(state.board), `caselle vuote con seed ${seed}`);
    assert.ok(!hasMatches(state.board), `match rimasti con seed ${seed}`);
    const ids = allIds(state.board);
    assert.equal(new Set(ids).size, ids.length, 'id duplicati');
    assert.equal(steps.filter((s) => s.type === 'cascade').length, cascades);
    assert.deepEqual(
      steps.filter((s) => s.type === 'cascade').map((s) => s.n),
      Array.from({ length: cascades }, (_, i) => i + 1)
    );
  }
});

test('resolve: i passi bastano a ricostruire il tabellone (id e posizioni)', () => {
  const state = stateFromColors(['2342', '4124', '2313', '3000', '2434'], { colors: 6, seed: 3 });
  // Posizioni note all'interfaccia: id → { r, c, color }
  const view = new Map();
  state.board.cells.forEach((row, r) =>
    row.forEach((cell, c) => view.set(cell.candy.id, { r, c, color: cell.candy.color }))
  );
  const steps = [];
  resolveBoard(state, steps);
  for (const step of steps) {
    if (step.type === 'clear') {
      for (const cell of step.cells) {
        assert.deepEqual({ r: view.get(cell.id).r, c: view.get(cell.id).c }, { r: cell.r, c: cell.c });
        view.delete(cell.id);
      }
    } else if (step.type === 'fall') {
      for (const move of step.moves) {
        const item = view.get(move.id);
        assert.deepEqual({ r: item.r, c: item.c }, move.from);
        item.r = move.to.r;
        item.c = move.to.c;
      }
    } else if (step.type === 'spawn') {
      for (const candy of step.candies) {
        assert.ok(!view.has(candy.id));
        view.set(candy.id, { r: candy.to.r, c: candy.to.c, color: candy.color });
      }
    }
  }
  const real = new Map();
  state.board.cells.forEach((row, r) =>
    row.forEach((cell, c) => real.set(cell.candy.id, { r, c, color: cell.candy.color }))
  );
  assert.deepEqual(view, real);
});
