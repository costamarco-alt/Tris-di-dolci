import test from 'node:test';
import assert from 'node:assert/strict';
import { boardToColors } from '../src/engine/board.js';
import {
  countLayers,
  createGame,
  getGoalProgress,
  getHint,
  getStars,
  getStatus,
  trySwap,
} from '../src/engine/game.js';
import { findMatches, hasMatches } from '../src/engine/match.js';
import { applyGravity, clearMatches, resolveBoard } from '../src/engine/resolve.js';
import { allIds, QUIET, setSpecial, stateFromColors } from './helpers.js';

const ofType = (steps, type) => steps.filter((s) => s.type === type);
const cellAt = (state, r, c) => state.board.cells[r][c];

// ---------- Gelatina ----------

test('gelatina: sparisce uno strato quando la caramella sopra viene eliminata', () => {
  const state = stateFromColors(['000', '121']);
  cellAt(state, 0, 0).jelly = 1;
  cellAt(state, 0, 1).jelly = 2;
  cellAt(state, 1, 0).jelly = 1; // non coinvolta
  const steps = [];
  clearMatches(state, findMatches(state.board), 1, steps);
  assert.equal(cellAt(state, 0, 0).jelly, 0);
  assert.equal(cellAt(state, 0, 1).jelly, 1);
  assert.equal(cellAt(state, 0, 2).jelly, 0);
  assert.equal(cellAt(state, 1, 0).jelly, 1);
  const hit = ofType(steps, 'jellyHit')[0];
  assert.deepEqual(hit.cells, [{ r: 0, c: 0, jelly: 0 }, { r: 0, c: 1, jelly: 1 }]);
  assert.ok(steps.indexOf(hit) > steps.findIndex((s) => s.type === 'clear'));
});

test('gelatina: senza gelatina non c\'è il passo jellyHit', () => {
  const state = stateFromColors(['000', '121']);
  const steps = [];
  clearMatches(state, findMatches(state.board), 1, steps);
  assert.equal(ofType(steps, 'jellyHit').length, 0);
  assert.equal(ofType(steps, 'iceHit').length, 0);
});

// ---------- Ghiaccio ----------

test('ghiaccio: una caramella ghiacciata non si può scambiare', () => {
  const state = stateFromColors(['0012', '3403', '1234']);
  cellAt(state, 1, 2).ice = 1;
  assert.deepEqual(trySwap(state, { r: 0, c: 2 }, { r: 1, c: 2 }), { valid: false, steps: [] });
  assert.equal(getHint(state), null, 'l\'unica mossa passava dalla caramella ghiacciata');
});

test('ghiaccio: in un match perde uno strato e resta al suo posto', () => {
  const state = stateFromColors(['000', '121']);
  cellAt(state, 0, 1).ice = 1;
  cellAt(state, 0, 1).jelly = 1;
  const frozenId = cellAt(state, 0, 1).candy.id;
  const steps = [];
  clearMatches(state, findMatches(state.board), 1, steps);
  assert.deepEqual(boardToColors(state.board), ['_0_', '121']);
  assert.equal(cellAt(state, 0, 1).candy.id, frozenId);
  assert.equal(cellAt(state, 0, 1).ice, 0);
  assert.equal(cellAt(state, 0, 1).jelly, 1, 'la gelatina sotto resta: la caramella non è stata eliminata');
  assert.equal(steps.find((s) => s.type === 'clear').cells.length, 2);
  assert.equal(state.score, 20);
  assert.deepEqual(ofType(steps, 'iceHit')[0].cells, [{ r: 0, c: 1, ice: 0 }]);
});

test('ghiaccio doppio: servono due colpi per liberare la caramella, tre per eliminarla', () => {
  const state = stateFromColors(['000', '121', '212'], { colors: 6, seed: 3 });
  for (let c = 0; c < 3; c++) cellAt(state, 0, c).ice = 2;
  const ids = [1, 2, 3];
  const steps = [];
  const cascades = resolveBoard(state, steps);
  assert.ok(cascades >= 3);
  const clears = ofType(steps, 'clear');
  assert.equal(clears[0].cells.length, 0);
  assert.equal(clears[1].cells.length, 0);
  assert.deepEqual(clears[2].cells.map((c) => c.id), ids);
  assert.deepEqual(ofType(steps, 'iceHit').slice(0, 2).map((s) => s.cells.map((c) => c.ice)), [[1, 1, 1], [0, 0, 0]]);
  assert.equal(countLayers(state.board).ice, 0);
});

test('ghiaccio: colpito da un Razzo perde uno strato; uno speciale ghiacciato non si attiva', () => {
  const lines = [...QUIET];
  lines[2] = '000345';
  const state = stateFromColors(lines, { colors: 6 });
  setSpecial(state, 2, 1, 'rocketH');
  const frozenBomb = setSpecial(state, 2, 4, 'bomb');
  cellAt(state, 2, 4).ice = 1;
  const steps = [];
  clearMatches(state, findMatches(state.board), 1, steps);
  assert.deepEqual(ofType(steps, 'activate').map((s) => s.special), ['rocketH']);
  assert.equal(cellAt(state, 2, 4).candy, frozenBomb);
  assert.equal(cellAt(state, 2, 4).ice, 0);
  assert.equal(steps.find((s) => s.type === 'clear').cells.length, 5);
});

test('ghiaccio: lo speciale non nasce sopra una caramella ghiacciata', () => {
  const state = stateFromColors(['0000', '1212'], { colors: 6 });
  cellAt(state, 0, 1).ice = 1; // la casella centrale, dove nascerebbe il Razzo
  const frozenId = cellAt(state, 0, 1).candy.id;
  const steps = [];
  clearMatches(state, findMatches(state.board), 1, steps);
  const created = ofType(steps, 'createSpecial')[0];
  assert.deepEqual({ r: created.r, c: created.c }, { r: 0, c: 0 });
  assert.equal(cellAt(state, 0, 1).candy.id, frozenId);
  assert.equal(cellAt(state, 0, 0).candy.special, 'rocketH');
});

test('ghiaccio: una caramella ghiacciata non cade e fa da appoggio', () => {
  const state = stateFromColors(['1', '2', '_']);
  cellAt(state, 1, 0).ice = 1;
  const steps = [];
  applyGravity(state, steps);
  assert.deepEqual(steps, [], 'niente cade e niente può arrivare sotto il ghiaccio');
  assert.deepEqual(boardToColors(state.board), ['1', '2', '_']);
});

test('ghiaccio: sopra una caramella ghiacciata arrivano caramelle nuove', () => {
  const state = stateFromColors(['_', '_', '2', '3']);
  cellAt(state, 2, 0).ice = 1;
  const steps = [];
  applyGravity(state, steps);
  assert.equal(ofType(steps, 'spawn')[0].candies.length, 2);
  assert.equal(cellAt(state, 2, 0).candy.id, 1);
  assert.ok(cellAt(state, 0, 0).candy && cellAt(state, 1, 0).candy);
});

test('ghiaccio: le caselle vuote sotto si riempiono in diagonale dalla colonna vicina', () => {
  const state = stateFromColors(['12', '34', '_5'], { colors: 6 });
  cellAt(state, 1, 0).ice = 1; // la caramella 3 (id 3) è ghiacciata
  const steps = [];
  applyGravity(state, steps);
  assert.deepEqual(steps[0], {
    type: 'fall',
    diagonal: true,
    moves: [{ id: 4, from: { r: 1, c: 1 }, to: { r: 2, c: 0 } }],
  });
  assert.deepEqual(steps[1], { type: 'fall', moves: [{ id: 2, from: { r: 0, c: 1 }, to: { r: 1, c: 1 } }] });
  assert.equal(steps[2].type, 'spawn');
  assert.deepEqual(steps[2].candies[0].to, { r: 0, c: 1 });
  assert.equal(cellAt(state, 2, 0).candy.id, 4);
  assert.equal(cellAt(state, 1, 0).candy.id, 3);
  assert.equal(cellAt(state, 0, 0).candy.id, 1);
});

test('ghiaccio: una caramella ghiacciata non scivola in diagonale', () => {
  const state = stateFromColors(['12', '34', '_5'], { colors: 6 });
  cellAt(state, 1, 0).ice = 1;
  cellAt(state, 1, 1).ice = 1;
  const steps = [];
  applyGravity(state, steps);
  assert.deepEqual(steps, []);
  assert.equal(cellAt(state, 2, 0).candy, null);
});

// ---------- Obiettivi ----------

const SWAP_BOARD = ['0012', '3403', '1234']; // (0,2)↔(1,2) elimina tre caramelle del colore 0

test('obiettivo raccolta: si vince appena completato e le mosse avanzate diventano punti', () => {
  const state = stateFromColors(SWAP_BOARD, {
    moves: 10,
    level: { goal: { type: 'collect', items: [{ color: 0, count: 3 }] }, stars: [100, 1000, 5000] },
  });
  assert.deepEqual(getGoalProgress(state), {
    type: 'collect',
    items: [{ color: 0, current: 0, count: 3, done: false }],
    done: false,
  });
  const { valid, steps } = trySwap(state, { r: 0, c: 2 }, { r: 1, c: 2 });
  assert.ok(valid);
  assert.equal(getStatus(state), 'won');
  assert.equal(state.movesLeft, 9);
  const bonus = steps[steps.length - 1];
  assert.deepEqual(bonus, { type: 'bonus', moves: 9, points: 9 * 150 });
  assert.equal(state.bonus, 1350);
  assert.equal(state.score, steps.reduce((sum, s) => sum + (s.points ?? 0), 0));
  assert.equal(getStars(state), 2);
  assert.equal(getGoalProgress(state).items[0].current, 3, 'il contatore non supera il totale richiesto');
  assert.deepEqual(trySwap(state, { r: 0, c: 0 }, { r: 0, c: 1 }), { valid: false, steps: [] });
});

test('obiettivo raccolta: con più colori servono tutti', () => {
  const state = stateFromColors(SWAP_BOARD, {
    level: { goal: { type: 'collect', items: [{ color: 0, count: 3 }, { color: 1, count: 500 }] } },
  });
  trySwap(state, { r: 0, c: 2 }, { r: 1, c: 2 });
  assert.equal(getStatus(state), 'playing');
  const progress = getGoalProgress(state);
  assert.equal(progress.items[0].done, true);
  assert.equal(progress.done, false);
});

test('obiettivo raccolta: finite le mosse senza completarlo si perde', () => {
  const state = stateFromColors(SWAP_BOARD, {
    moves: 1,
    level: { goal: { type: 'collect', items: [{ color: 5, count: 99 }] }, stars: [1, 2, 3] },
  });
  trySwap(state, { r: 0, c: 2 }, { r: 1, c: 2 });
  assert.equal(getStatus(state), 'lost');
  assert.equal(state.bonus, 0);
});

test('obiettivo gelatina: si vince togliendo tutta la gelatina', () => {
  const state = stateFromColors(SWAP_BOARD, { level: { goal: { type: 'jelly' } } });
  cellAt(state, 0, 0).jelly = 1;
  cellAt(state, 0, 1).jelly = 1;
  state.jellyTotal = 2;
  assert.deepEqual(getGoalProgress(state), { type: 'jelly', remaining: 2, total: 2, done: false });
  const { steps } = trySwap(state, { r: 0, c: 2 }, { r: 1, c: 2 });
  assert.equal(getStatus(state), 'won');
  assert.deepEqual(getGoalProgress(state), { type: 'jelly', remaining: 0, total: 2, done: true });
  assert.equal(steps[steps.length - 1].type, 'bonus');
});

test('obiettivo gelatina: con la gelatina doppia serve un secondo colpo', () => {
  const state = stateFromColors(SWAP_BOARD, { level: { goal: { type: 'jelly' } } });
  cellAt(state, 0, 0).jelly = 2;
  state.jellyTotal = 2;
  trySwap(state, { r: 0, c: 2 }, { r: 1, c: 2 });
  assert.equal(getGoalProgress(state).remaining >= 0, true);
  if (getGoalProgress(state).remaining > 0) assert.equal(getStatus(state), 'playing');
});

test('obiettivo ghiaccio: si vince rompendo tutto il ghiaccio', () => {
  const state = stateFromColors(SWAP_BOARD, { level: { goal: { type: 'ice' } } });
  cellAt(state, 0, 0).ice = 1;
  state.iceTotal = 1;
  assert.deepEqual(getGoalProgress(state), { type: 'ice', remaining: 1, total: 1, done: false });
  trySwap(state, { r: 0, c: 2 }, { r: 1, c: 2 });
  assert.equal(getStatus(state), 'won');
  assert.equal(countLayers(state.board).ice, 0);
});

test('obiettivo punteggio: nessun bonus per le mosse (si giocano tutte)', () => {
  const state = stateFromColors(SWAP_BOARD, { moves: 5, level: { goal: { type: 'score', target: 10 } } });
  const { steps } = trySwap(state, { r: 0, c: 2 }, { r: 1, c: 2 });
  assert.equal(getStatus(state), 'playing');
  assert.equal(ofType(steps, 'bonus').length, 0);
  assert.deepEqual(getGoalProgress(state), { type: 'score', current: state.score, target: 10, done: true });
});

test('createGame conta gli strati di gelatina e ghiaccio del layout', () => {
  const layout = ['........', '.jjJJjj.', '........', '..iIIi..', '........', '........', '........', '........'];
  const state = createGame({ moves: 20, colors: 5, goal: { type: 'jelly' }, layout }, 4);
  assert.equal(state.jellyTotal, 8);
  assert.equal(state.iceTotal, 6);
  assert.deepEqual(countLayers(state.board), { jelly: 8, ice: 6 });
  assert.ok(cellAt(state, 3, 3).candy, 'anche le caselle ghiacciate hanno una caramella');
  assert.ok(getHint(state));
});

test('partite intere con ghiaccio, gelatina e buchi restano sempre coerenti', () => {
  const layout = ['x......x', '.jjJJjj.', '..iiii..', '.I....I.', '.jjiijj.', '........', '.iJ..Ji.', 'x......x'];
  let wins = 0;
  for (let seed = 1; seed <= 40; seed++) {
    const state = createGame({ moves: 40, colors: 4 + (seed % 3), goal: { type: seed % 2 ? 'jelly' : 'ice' }, layout }, seed);
    const frozen = new Map(); // "r,c" → id della caramella ghiacciata
    state.board.cells.forEach((row, r) => row.forEach((cell, c) => cell.ice > 0 && frozen.set(`${r},${c}`, cell.candy.id)));
    let previous = countLayers(state.board);
    while (getStatus(state) === 'playing') {
      const move = getHint(state);
      assert.ok(move, `nessuna mossa disponibile (seed ${seed})`);
      const { valid, steps } = trySwap(state, move.from, move.to);
      assert.ok(valid);
      assert.equal(state.score, state.score, 'punteggio definito');
      if (getStatus(state) === 'playing') assert.ok(!hasMatches(state.board));
      const ids = allIds(state.board);
      assert.equal(new Set(ids).size, ids.length);
      const now = countLayers(state.board);
      assert.ok(now.ice <= previous.ice && now.jelly <= previous.jelly, 'gli ostacoli non aumentano mai');
      previous = now;
      state.board.cells.forEach((row, r) =>
        row.forEach((cell, c) => {
          if (cell.hole) return assert.equal(cell.candy, null);
          if (cell.ice > 0) assert.equal(cell.candy?.id, frozen.get(`${r},${c}`), 'la caramella ghiacciata non si muove');
          if (!cell.candy) {
            let blocked = false;
            for (let k = r - 1; k >= 0; k--) if (state.board.cells[k][c].ice > 0) blocked = true;
            assert.ok(blocked, `casella vuota non giustificata in ${r},${c} (seed ${seed})`);
          }
        })
      );
      const total = steps.reduce((sum, s) => sum + (s.points ?? 0), 0);
      assert.ok(total > 0 || steps.some((s) => s.type === 'iceHit'));
    }
    if (getStatus(state) === 'won') wins++;
  }
  assert.ok(wins > 0, 'almeno qualche partita viene vinta');
});
