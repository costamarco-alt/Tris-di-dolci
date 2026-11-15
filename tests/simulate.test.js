import test from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS } from '../src/levels/levels.js';
import { simulateLevel, targetFor, TARGETS } from '../tools/simulate.js';

test('simulate: ogni livello ha una fascia di difficoltà voluta', () => {
  for (const level of LEVELS) assert.ok(targetFor(level.id), `livello ${level.id}`);
  assert.deepEqual(targetFor(1), TARGETS[0]);
  assert.equal(targetFor(15).min, 60);
  assert.equal(targetFor(16).max, 70);
});

test('simulate: il bot gioca un livello e restituisce numeri sensati', () => {
  const result = simulateLevel(LEVELS[0], 30);
  assert.equal(result.id, 1);
  assert.ok(result.winRate >= 80 && result.winRate <= 100, 'il livello 1 è facile');
  assert.ok(result.avgStars >= 1 && result.avgStars <= 3);
  assert.equal(result.avgLeftover, 0, 'con l\'obiettivo punteggio si giocano tutte le mosse');
  assert.equal(result.stuck, 0);
  assert.deepEqual(simulateLevel(LEVELS[0], 30), result, 'stessi seed, stessi risultati');
});

test('simulate: la difficoltà cresce — l\'ultimo livello è più duro del sesto', () => {
  const early = simulateLevel(LEVELS[5], 40);
  const late = simulateLevel(LEVELS[29], 40);
  assert.ok(early.winRate > late.winRate);
  assert.ok(early.avgLeftover > 0, 'negli altri obiettivi restano mosse avanzate');
});
