import test from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../src/engine/rng.js';

test('rng: stesso seed, stessa sequenza', () => {
  const a = createRng(42);
  const b = createRng(42);
  for (let i = 0; i < 100; i++) assert.equal(a.next(), b.next());
});

test('rng: seed diversi danno sequenze diverse', () => {
  const a = createRng(1);
  const b = createRng(2);
  const seqA = Array.from({ length: 10 }, () => a.next());
  const seqB = Array.from({ length: 10 }, () => b.next());
  assert.notDeepEqual(seqA, seqB);
});

test('rng: next sta in [0, 1) e int in [0, n)', () => {
  const rng = createRng(7);
  const seen = new Set();
  for (let i = 0; i < 2000; i++) {
    const x = rng.next();
    assert.ok(x >= 0 && x < 1);
    const n = rng.int(6);
    assert.ok(Number.isInteger(n) && n >= 0 && n < 6);
    seen.add(n);
  }
  assert.equal(seen.size, 6, 'escono tutti i valori possibili');
});

test('rng: shuffle mantiene gli stessi elementi ed è riproducibile', () => {
  const list = [1, 2, 3, 4, 5, 6, 7, 8];
  const a = createRng(9).shuffle([...list]);
  const b = createRng(9).shuffle([...list]);
  assert.deepEqual(a, b);
  assert.deepEqual([...a].sort((x, y) => x - y), list);
});

test('rng: lo stato si può salvare e ripristinare', () => {
  const rng = createRng(5);
  rng.next();
  const saved = rng.getState();
  const expected = [rng.next(), rng.next()];
  rng.setState(saved);
  assert.deepEqual([rng.next(), rng.next()], expected);
});
