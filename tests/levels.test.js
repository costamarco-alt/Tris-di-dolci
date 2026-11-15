import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, getHint, getStatus, trySwap } from '../src/engine/game.js';
import { hasMatches } from '../src/engine/match.js';
import { hasValidMove } from '../src/engine/moves.js';
import { getLevel, LEVELS } from '../src/levels/levels.js';

test('livelli: sono 30, numerati da 1 a 30', () => {
  assert.equal(LEVELS.length, 30);
  LEVELS.forEach((level, i) => assert.equal(level.id, i + 1));
  assert.equal(getLevel(7).id, 7);
  assert.equal(getLevel(999).id, 1);
});

test('livelli: campi validi e soglie delle stelle crescenti', () => {
  for (const level of LEVELS) {
    const where = `livello ${level.id}`;
    assert.ok(Number.isInteger(level.moves) && level.moves >= 5 && level.moves <= 60, `${where}: mosse`);
    assert.ok(level.colors >= 4 && level.colors <= 6, `${where}: colori`);
    assert.equal(level.stars.length, 3, `${where}: tre soglie`);
    assert.ok(level.stars[0] > 0 && level.stars[0] < level.stars[1] && level.stars[1] < level.stars[2], `${where}: soglie crescenti`);
    assert.ok(['score', 'collect', 'jelly', 'ice'].includes(level.goal.type), `${where}: tipo di obiettivo`);
    if (level.goal.type === 'score') {
      assert.equal(level.goal.target, level.stars[0], `${where}: la prima stella coincide con il target`);
    }
    if (level.goal.type === 'collect') {
      assert.ok(level.goal.items.length >= 1);
      for (const item of level.goal.items) {
        assert.ok(item.color >= 0 && item.color < level.colors, `${where}: colore da raccogliere presente nel livello`);
        assert.ok(item.count > 0);
      }
    }
    if (level.tip !== undefined) assert.ok(level.tip.length > 10 && level.tip.length < 120, `${where}: tip di una riga`);
  }
});

test('livelli: layout coerente con l\'obiettivo', () => {
  for (const level of LEVELS) {
    const where = `livello ${level.id}`;
    const layout = level.layout ?? Array(8).fill('........');
    assert.ok(layout.length >= 4 && layout.length <= 9, `${where}: righe`);
    for (const line of layout) {
      assert.equal(line.length, layout[0].length, `${where}: righe tutte lunghe uguali`);
      assert.match(line, /^[.xjJiI]+$/, `${where}: simboli`);
    }
    const text = layout.join('');
    if (level.goal.type === 'jelly') assert.match(text, /[jJ]/, `${where}: serve della gelatina`);
    if (level.goal.type === 'ice') assert.match(text, /[iI]/, `${where}: serve del ghiaccio`);
  }
});

test('livelli: la progressione segue la tabella di CLAUDE.md', () => {
  const types = (from, to) => LEVELS.slice(from - 1, to).map((level) => level.goal.type);
  assert.ok(types(1, 5).every((t) => t === 'score'));
  assert.ok(types(6, 10).every((t) => t === 'collect'));
  assert.ok(types(11, 15).every((t) => t === 'jelly'));
  assert.ok(types(16, 20).every((t) => t === 'ice'));
  assert.ok(LEVELS.slice(0, 20).every((level) => !(level.layout ?? []).join('').includes('x')), 'niente buchi prima del 21');
  assert.ok(LEVELS.slice(20, 25).every((level) => level.layout.join('').includes('x')), '21–25: tabelloni con buchi');
  assert.ok(new Set(types(21, 25)).size >= 3, '21–25: obiettivi misti');
  assert.ok(LEVELS.slice(0, 25).every((level) => level.colors === 5));
  assert.ok(LEVELS.slice(25).every((level) => level.colors === 6), '26–30: sei colori');
  assert.ok(LEVELS.slice(25).some((level) => /[jJ]/.test(level.layout.join('')) && /[iI]/.test(level.layout.join(''))), '26–30: ostacoli combinati');
  assert.equal(LEVELS[0].hand, true, 'il livello 1 mostra la manina');
  for (const id of [1, 2, 3, 4, 5, 6, 11, 13, 16, 18, 21, 26]) {
    assert.ok(LEVELS[id - 1].tip, `il livello ${id} introduce una novità e ha un tip`);
  }
});

test('livelli: ogni livello parte senza match e con almeno una mossa valida', () => {
  for (const level of LEVELS) {
    for (let seed = 1; seed <= 25; seed++) {
      const state = createGame(level, seed);
      assert.ok(!hasMatches(state.board), `livello ${level.id}, seed ${seed}: match iniziale`);
      assert.ok(hasValidMove(state.board), `livello ${level.id}, seed ${seed}: nessuna mossa`);
      assert.equal(getStatus(state), 'playing');
    }
  }
});

test('livelli: ogni livello si può giocare fino in fondo e si può vincere', () => {
  for (const level of LEVELS) {
    let wins = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const state = createGame(level, seed);
      let guard = 0;
      while (getStatus(state) === 'playing') {
        const move = getHint(state);
        assert.ok(move, `livello ${level.id}, seed ${seed}: partita bloccata`);
        assert.ok(trySwap(state, move.from, move.to).valid);
        assert.ok(++guard <= level.moves);
      }
      assert.equal(state.stuck, false, `livello ${level.id}, seed ${seed}: tabellone senza mosse`);
      if (getStatus(state) === 'won') wins++;
    }
    assert.ok(wins >= 4, `livello ${level.id}: troppo difficile (${wins} vittorie su 40)`);
  }
});
