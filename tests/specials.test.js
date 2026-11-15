import test from 'node:test';
import assert from 'node:assert/strict';
import { findValidMoves, getStatus, trySwap } from '../src/engine/game.js';
import { findMatches, hasMatches } from '../src/engine/match.js';
import { clearMatches } from '../src/engine/resolve.js';
import { creationCell, isSpecialSwap, specialForGroup } from '../src/engine/specials.js';
import { createGame, getHint } from '../src/engine/game.js';
import { allIds, cellKeys, isFull, QUIET, setSpecial, stateFromColors } from './helpers.js';

const quiet = (options = {}) => stateFromColors(QUIET, { colors: 6, ...options });
const ofType = (steps, type) => steps.filter((s) => s.type === type);
const firstClear = (steps) => steps.find((s) => s.type === 'clear');

// ---------- Creazione ----------

test('speciali: 4 in fila orizzontale crea un Razzo orizzontale nella casella mossa', () => {
  const state = stateFromColors(['0010', '1202', '2121'], { colors: 6 });
  const { valid, steps } = trySwap(state, { r: 1, c: 2 }, { r: 0, c: 2 });
  assert.equal(valid, true);
  assert.equal(firstClear(steps).cells.length, 4);
  const created = ofType(steps, 'createSpecial')[0];
  assert.deepEqual(
    { r: created.r, c: created.c, special: created.special, color: created.color, points: created.points },
    { r: 0, c: 2, special: 'rocketH', color: 0, points: 60 }
  );
  assert.ok(state.score >= 40 + 60);
  assert.ok(!firstClear(steps).cells.some((cell) => cell.id === created.id), 'lo speciale ha un id nuovo');
});

test('speciali: 4 in fila verticale crea un Razzo verticale', () => {
  const state = stateFromColors(['012', '021', '102', '021'], { colors: 6 });
  const { steps } = trySwap(state, { r: 2, c: 1 }, { r: 2, c: 0 });
  const created = ofType(steps, 'createSpecial')[0];
  assert.equal(created.special, 'rocketV');
  assert.deepEqual({ r: created.r, c: created.c }, { r: 2, c: 0 });
});

test('speciali: lo speciale nasce nella casella mossa anche se è la casella di partenza', () => {
  // Qui è la caramella che arriva in "from" a completare la fila.
  const state = stateFromColors(['0010', '1202', '2121'], { colors: 6 });
  const { steps } = trySwap(state, { r: 0, c: 2 }, { r: 1, c: 2 });
  const created = ofType(steps, 'createSpecial')[0];
  assert.deepEqual({ r: created.r, c: created.c, special: created.special }, { r: 0, c: 2, special: 'rocketH' });
});

test('speciali: 5 in fila crea un Arcobaleno', () => {
  const state = stateFromColors(['00100', '12021', '21212'], { colors: 6 });
  const { steps } = trySwap(state, { r: 1, c: 2 }, { r: 0, c: 2 });
  const created = ofType(steps, 'createSpecial')[0];
  assert.deepEqual(
    { r: created.r, c: created.c, special: created.special, points: created.points },
    { r: 0, c: 2, special: 'rainbow', points: 200 }
  );
});

test('speciali: la forma a L crea una Bomba', () => {
  const state = stateFromColors(['1202', '2102', '0010'], { colors: 6 });
  const { steps } = trySwap(state, { r: 2, c: 3 }, { r: 2, c: 2 });
  assert.equal(firstClear(steps).cells.length, 5);
  const created = ofType(steps, 'createSpecial')[0];
  assert.deepEqual(
    { r: created.r, c: created.c, special: created.special, points: created.points },
    { r: 2, c: 2, special: 'bomb', points: 120 }
  );
});

test('speciali: la forma a T crea una Bomba', () => {
  const state = stateFromColors(['2013', '0102', '2021', '1021'], { colors: 6 });
  const { steps } = trySwap(state, { r: 0, c: 1 }, { r: 1, c: 1 });
  assert.equal(firstClear(steps).groups[0].shape, 'T');
  const created = ofType(steps, 'createSpecial')[0];
  assert.deepEqual({ r: created.r, c: created.c, special: created.special }, { r: 1, c: 1, special: 'bomb' });
});

test('speciali: un 3 in fila non crea niente', () => {
  const state = stateFromColors(['0012', '3403', '1234'], { colors: 6 });
  const { steps } = trySwap(state, { r: 0, c: 2 }, { r: 1, c: 2 });
  const first = steps.findIndex((s) => s.type === 'clear');
  assert.notEqual(steps[first + 1].type, 'createSpecial');
});

test('speciali: priorità Arcobaleno > Bomba > Razzo', () => {
  const shape = (lines) => specialForGroup(findMatches(stateFromColors(lines).board)[0]);
  assert.equal(shape(['00000', '12013', '21031']), 'rainbow', '5 in fila con incrocio');
  assert.equal(shape(['0000', '0123', '0231']), 'bomb', 'L con un lato da 4');
  assert.equal(shape(['0000', '1212']), 'rocketH');
  assert.equal(shape(['000', '121']), null);
});

test('speciali: senza casella mossa (cascata) lo speciale nasce al centro del gruppo', () => {
  const center = (lines) => creationCell(findMatches(stateFromColors(lines).board)[0]);
  assert.deepEqual(center(['0000', '1212']), { r: 0, c: 1 });
  assert.deepEqual(center(['00000', '12121']), { r: 0, c: 2 });
  assert.deepEqual(center(['012', '021', '000']), { r: 2, c: 0 }, 'L: nell\'angolo');
  assert.deepEqual(center(['000', '102', '201']), { r: 0, c: 1 }, 'T: nell\'incrocio');

  const state = stateFromColors(['0000', '1212'], { colors: 6 });
  const steps = [];
  clearMatches(state, findMatches(state.board), 2, steps);
  const created = ofType(steps, 'createSpecial')[0];
  assert.deepEqual({ r: created.r, c: created.c }, { r: 0, c: 1 });
  assert.equal(state.board.cells[0][1].candy.special, 'rocketH');
  assert.equal(state.board.cells[0][1].candy.id, created.id);
  assert.equal(state.score, 4 * 10 * 2 + 60, 'il bonus non viene moltiplicato dalla cascata');
});

// ---------- Attivazione ----------

function activation(row, r, c, special, extra = () => {}) {
  const lines = [...QUIET];
  lines[row] = '000345';
  const state = stateFromColors(lines, { colors: 6 });
  setSpecial(state, r, c, special);
  extra(state);
  const steps = [];
  clearMatches(state, findMatches(state.board), 1, steps);
  return { state, steps, clear: firstClear(steps) };
}

test('speciali: un Razzo orizzontale in un match elimina tutta la riga', () => {
  const { steps, clear } = activation(2, 2, 1, 'rocketH');
  assert.deepEqual(cellKeys(clear.cells), ['2,0', '2,1', '2,2', '2,3', '2,4', '2,5']);
  const act = ofType(steps, 'activate');
  assert.equal(act.length, 1);
  assert.equal(act[0].special, 'rocketH');
  assert.deepEqual({ r: act[0].r, c: act[0].c }, { r: 2, c: 1 });
  assert.equal(act[0].cells.length, 6);
  assert.equal(clear.points, 60);
  assert.ok(steps.indexOf(act[0]) < steps.indexOf(clear), 'prima l\'attivazione, poi l\'eliminazione');
});

test('speciali: un Razzo verticale in un match elimina tutta la colonna', () => {
  const { clear } = activation(2, 2, 1, 'rocketV');
  assert.deepEqual(cellKeys(clear.cells), ['0,1', '1,1', '2,0', '2,1', '2,2', '3,1', '4,1', '5,1']);
});

test('speciali: una Bomba esplode in un\'area 3×3', () => {
  const { clear } = activation(2, 2, 1, 'bomb');
  assert.deepEqual(cellKeys(clear.cells), ['1,0', '1,1', '1,2', '2,0', '2,1', '2,2', '3,0', '3,1', '3,2']);
});

test('speciali: l\'area della Bomba si ferma ai bordi', () => {
  const { clear } = activation(0, 0, 0, 'bomb');
  assert.deepEqual(cellKeys(clear.cells), ['0,0', '0,1', '0,2', '1,0', '1,1']);
});

test('speciali: reazione a catena — la Bomba fa partire un Razzo', () => {
  const { steps, clear } = activation(2, 2, 1, 'bomb', (state) => setSpecial(state, 3, 2, 'rocketV'));
  assert.deepEqual(ofType(steps, 'activate').map((s) => s.special), ['bomb', 'rocketV']);
  assert.equal(clear.cells.length, 9 + 3, 'area 3×3 più il resto della colonna 2');
  for (const key of ['0,2', '4,2', '5,2']) assert.ok(cellKeys(clear.cells).includes(key));
});

test('speciali: due Razzi che si colpiscono a vicenda si attivano una volta sola', () => {
  const { steps, clear } = activation(2, 2, 1, 'rocketH', (state) => setSpecial(state, 2, 4, 'rocketH'));
  assert.equal(ofType(steps, 'activate').length, 2);
  assert.equal(clear.cells.length, 6);
  assert.equal(new Set(clear.cells.map((cell) => cell.id)).size, 6);
});

test('speciali: un Arcobaleno colpito da un\'esplosione elimina il colore più presente', () => {
  const { state, steps, clear } = activation(2, 2, 1, 'bomb', (s) => setSpecial(s, 3, 0, 'rainbow'));
  const act = ofType(steps, 'activate').find((s) => s.special === 'rainbow');
  assert.ok(act);
  assert.ok(act.targetColor >= 0);
  for (const row of state.board.cells) {
    for (const cell of row) {
      assert.ok(!cell.candy || cell.candy.color !== act.targetColor, 'nessuna caramella di quel colore resta');
    }
  }
  assert.ok(clear.cells.length > 9);
});

test('speciali: i buchi non vengono colpiti', () => {
  const lines = [...QUIET];
  lines[2] = '000x45';
  const state = stateFromColors(lines, { colors: 6 });
  setSpecial(state, 2, 1, 'rocketH');
  const steps = [];
  clearMatches(state, findMatches(state.board), 1, steps);
  assert.deepEqual(cellKeys(firstClear(steps).cells), ['2,0', '2,1', '2,2', '2,4', '2,5']);
});

// ---------- Scambi speciali e combinazioni ----------

test('speciali: isSpecialSwap', () => {
  const normal = { special: null };
  const rocket = { special: 'rocketH' };
  const bomb = { special: 'bomb' };
  const rainbow = { special: 'rainbow' };
  assert.equal(isSpecialSwap(normal, normal), false);
  assert.equal(isSpecialSwap(rocket, normal), false);
  assert.equal(isSpecialSwap(rocket, bomb), true);
  assert.equal(isSpecialSwap(rainbow, normal), true);
  assert.equal(isSpecialSwap(normal, rainbow), true);
  assert.equal(isSpecialSwap(null, rainbow), false);
});

test('speciali: un Razzo scambiato con una caramella normale ha bisogno di un match', () => {
  const state = quiet();
  setSpecial(state, 2, 2, 'rocketH');
  const result = trySwap(state, { r: 2, c: 2 }, { r: 2, c: 3 });
  assert.equal(result.valid, false);
  assert.deepEqual(result.steps.map((s) => s.type), ['swap', 'swapBack']);
  assert.equal(state.movesLeft, 10);
});

function combo(a, b) {
  const state = quiet();
  setSpecial(state, 2, 2, a);
  if (b) setSpecial(state, 2, 3, b);
  const result = trySwap(state, { r: 2, c: 2 }, { r: 2, c: 3 });
  assert.equal(result.valid, true, 'lo scambio speciale è sempre valido');
  assert.equal(state.movesLeft, 9, 'la mossa viene consumata');
  assert.deepEqual(result.steps.slice(0, 2).map((s) => s.type), ['swap', 'cascade']);
  assert.ok(isFull(state.board));
  assert.ok(!hasMatches(state.board));
  const ids = allIds(state.board);
  assert.equal(new Set(ids).size, ids.length);
  return { state, steps: result.steps, clear: firstClear(result.steps), acts: ofType(result.steps, 'activate') };
}

test('combinazioni: Razzo + Razzo = croce (riga e colonna)', () => {
  const { clear, acts } = combo('rocketH', 'rocketV');
  assert.equal(acts[0].combo, 'rocket+rocket');
  assert.deepEqual({ r: acts[0].r, c: acts[0].c }, { r: 2, c: 3 }, 'parte dalla casella di arrivo');
  assert.equal(acts.length, 1, 'i due Razzi non si attivano una seconda volta');
  const expected = [];
  for (let i = 0; i < 6; i++) expected.push({ r: 2, c: i }, { r: i, c: 3 });
  assert.deepEqual(cellKeys(clear.cells), [...new Set(cellKeys(expected))]);
  assert.equal(clear.cells.length, 11);
  assert.equal(clear.points, 110);
});

test('combinazioni: due Razzi orizzontali fanno comunque la croce', () => {
  const { clear } = combo('rocketH', 'rocketH');
  assert.equal(clear.cells.length, 11);
});

test('combinazioni: Razzo + Bomba = 3 righe e 3 colonne', () => {
  for (const [a, b] of [['rocketV', 'bomb'], ['bomb', 'rocketH']]) {
    const { clear, acts } = combo(a, b);
    assert.equal(acts[0].combo, 'rocket+bomb');
    assert.equal(clear.cells.length, 18 + 18 - 9);
    for (const cell of clear.cells) {
      assert.ok((cell.r >= 1 && cell.r <= 3) || (cell.c >= 2 && cell.c <= 4));
    }
  }
});

test('combinazioni: Bomba + Bomba = area 5×5', () => {
  const { clear, acts } = combo('bomb', 'bomb');
  assert.equal(acts[0].combo, 'bomb+bomb');
  assert.equal(clear.cells.length, 25);
  for (const cell of clear.cells) {
    assert.ok(cell.r <= 4 && cell.c >= 1, 'righe 0–4, colonne 1–5');
  }
});

test('combinazioni: Arcobaleno + caramella elimina tutte quelle di quel colore', () => {
  for (const reversed of [false, true]) {
    const state = quiet();
    setSpecial(state, 2, 2, 'rainbow');
    const result = reversed
      ? trySwap(state, { r: 2, c: 3 }, { r: 2, c: 2 })
      : trySwap(state, { r: 2, c: 2 }, { r: 2, c: 3 });
    assert.equal(result.valid, true);
    const act = ofType(result.steps, 'activate')[0];
    assert.equal(act.combo, 'rainbow+candy');
    assert.equal(act.targetColor, 3);
    assert.equal(act.cells.length, 6);
    const clear = firstClear(result.steps);
    assert.equal(clear.cells.length, 7, 'sei caramelle del colore 3 più l\'Arcobaleno');
    assert.equal(clear.cells.filter((cell) => cell.color === 3 && cell.special === null).length, 6);
    assert.equal(clear.cells.filter((cell) => cell.special === 'rainbow').length, 1);
  }
});

test('combinazioni: Arcobaleno + Razzo trasforma quel colore in Razzi che si attivano', () => {
  const { steps, clear, acts } = combo('rainbow', 'rocketH');
  assert.equal(acts[0].combo, 'rainbow+rocket');
  const converted = ofType(steps, 'createSpecial').filter((s) => s.converted);
  assert.equal(converted.length, 5, 'le altre cinque caramelle del colore 3');
  assert.ok(converted.every((s) => s.color === 3 && (s.special === 'rocketH' || s.special === 'rocketV')));
  assert.equal(acts.filter((s) => s.special === 'rocketH' || s.special === 'rocketV').length, 6);
  assert.ok(clear.cells.length > 7);
  assert.equal(clear.cells.filter((cell) => cell.color === 3 && cell.special !== 'rainbow').length >= 6, true);
});

test('combinazioni: Arcobaleno + Bomba trasforma quel colore in Bombe che si attivano', () => {
  const { steps, acts } = combo('rainbow', 'bomb');
  assert.equal(acts[0].combo, 'rainbow+bomb');
  assert.equal(ofType(steps, 'createSpecial').filter((s) => s.converted && s.special === 'bomb').length, 5);
  assert.equal(acts.filter((s) => s.special === 'bomb').length, 6);
});

test('combinazioni: Arcobaleno + Arcobaleno svuota tutto il tabellone', () => {
  const { clear, acts } = combo('rainbow', 'rainbow');
  assert.equal(acts[0].combo, 'rainbow+rainbow');
  assert.equal(clear.cells.length, 36);
  assert.equal(clear.points, 360);
});

test('combinazioni: dopo la combinazione le cascate continuano dal numero 2', () => {
  for (let seed = 1; seed <= 40; seed++) {
    const state = quiet({ seed });
    setSpecial(state, 2, 2, 'rainbow');
    setSpecial(state, 2, 3, 'rainbow');
    const { steps } = trySwap(state, { r: 2, c: 2 }, { r: 2, c: 3 });
    const numbers = ofType(steps, 'cascade').map((s) => s.n);
    assert.deepEqual(numbers, numbers.map((_, i) => i + 1));
    assert.equal(state.score, steps.reduce((sum, s) => sum + (s.points ?? 0), 0));
  }
});

// ---------- Mosse valide ----------

test('speciali: gli scambi speciali contano come mosse valide', () => {
  const state = quiet();
  assert.deepEqual(findValidMoves(state), []);
  setSpecial(state, 2, 2, 'rocketH');
  assert.deepEqual(findValidMoves(state), [], 'un solo Razzo non basta');
  setSpecial(state, 2, 3, 'bomb');
  const moves = findValidMoves(state);
  assert.equal(moves.length, 1);
  assert.deepEqual([moves[0].from, moves[0].to], [{ r: 2, c: 2 }, { r: 2, c: 3 }]);
});

test('speciali: un Arcobaleno si può scambiare con tutte le caselle vicine', () => {
  const state = quiet();
  setSpecial(state, 2, 2, 'rainbow');
  assert.equal(findValidMoves(state).length, 4);
  const corner = quiet();
  setSpecial(corner, 0, 0, 'rainbow');
  assert.equal(findValidMoves(corner).length, 2);
});

test('speciali: il punteggio totale è sempre la somma dei punti dei passi', () => {
  let created = 0;
  let activated = 0;
  for (let seed = 1; seed <= 30; seed++) {
    const state = createGame({ moves: 30, colors: 4, goal: { type: 'score', target: 0 } }, seed);
    let total = 0;
    while (getStatus(state) === 'playing') {
      const move = getHint(state);
      const { valid, steps } = trySwap(state, move.from, move.to);
      assert.ok(valid);
      for (const step of steps) {
        total += step.points ?? 0;
        if (step.type === 'createSpecial') created++;
        if (step.type === 'activate') activated++;
      }
      assert.equal(state.score, total);
      assert.ok(isFull(state.board));
      assert.ok(!hasMatches(state.board));
    }
  }
  assert.ok(created > 30, 'in tante partite a 4 colori nascono molti speciali');
  assert.ok(activated > 30, 'e molti si attivano');
});
