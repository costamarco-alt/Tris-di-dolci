// Ciclo elimina → gravità → riempi → ricontrolla (cascate). Logica pura.
import { CONFIG } from '../config.js';
import { createCandy } from './board.js';
import { findMatches } from './match.js';
import { applyCombo, creationCell, expandClear, specialBonus, specialForGroup } from './specials.js';

// Toglie le caramelle dalle caselle indicate e aggiunge il passo 'clear'.
function removeCells(state, cells, cascade, steps, groups = []) {
  const { board } = state;
  const cleared = [];
  for (const p of cells) {
    const cell = board.cells[p.r][p.c];
    if (!cell.candy) continue;
    cleared.push({ r: p.r, c: p.c, id: cell.candy.id, color: cell.candy.color, special: cell.candy.special });
    state.collected[cell.candy.color] = (state.collected[cell.candy.color] || 0) + 1;
    cell.candy = null;
  }
  const points = cleared.length * CONFIG.SCORE_PER_CANDY * cascade;
  state.score += points;
  steps.push({
    type: 'clear',
    cascade,
    points,
    cells: cleared,
    groups: groups.map((g) => ({
      color: g.color,
      shape: g.shape,
      orientation: g.orientation,
      cells: g.cells.map((p) => ({ ...p })),
    })),
  });
  return cleared.length;
}

// Elimina i gruppi di match: attiva gli speciali coinvolti (reazioni a catena),
// toglie le caramelle e crea i nuovi speciali. `swapCells` sono le due caselle
// mosse dal giocatore (solo per la prima eliminazione della mossa).
export function clearMatches(state, groups, cascade, steps, swapCells = []) {
  const plans = [];
  const seeds = [];
  for (const group of groups) {
    seeds.push(...group.cells);
    const special = specialForGroup(group);
    if (special) plans.push({ special, color: group.color, pos: creationCell(group, swapCells) });
  }

  const cells = expandClear(state, seeds, steps);
  const count = removeCells(state, cells, cascade, steps, groups);

  for (const plan of plans) {
    const candy = createCandy(state.nextId++, plan.color, plan.special);
    state.board.cells[plan.pos.r][plan.pos.c].candy = candy;
    const points = specialBonus(plan.special);
    state.score += points;
    steps.push({
      type: 'createSpecial',
      id: candy.id,
      r: plan.pos.r,
      c: plan.pos.c,
      color: candy.color,
      special: candy.special,
      points,
    });
  }
  return count;
}

// Fa cadere le caramelle e riempie dall'alto. Aggiunge i passi 'fall' e 'spawn'.
// I buchi si attraversano: una caramella sopra un buco cade nella casella libera sotto.
export function applyGravity(state, steps) {
  const { board } = state;
  const falls = [];
  const spawns = [];

  for (let c = 0; c < board.cols; c++) {
    const slots = [];
    for (let r = 0; r < board.rows; r++) {
      if (!board.cells[r][c].hole) slots.push(r);
    }
    const candies = [];
    for (const r of slots) {
      const candy = board.cells[r][c].candy;
      if (candy) candies.push({ candy, from: r });
    }
    const empty = slots.length - candies.length;
    if (empty === 0) continue;

    // Le caramelle esistenti si compattano in basso, mantenendo l'ordine.
    for (let i = candies.length - 1; i >= 0; i--) {
      const to = slots[empty + i];
      const { candy, from } = candies[i];
      if (to === from) continue;
      board.cells[from][c].candy = null;
      board.cells[to][c].candy = candy;
      falls.push({ id: candy.id, from: { r: from, c }, to: { r: to, c } });
    }

    // Le caselle rimaste libere in alto ricevono caramelle nuove.
    for (let i = 0; i < empty; i++) {
      const to = slots[i];
      const candy = createCandy(state.nextId++, state.rng.int(state.colors));
      board.cells[to][c].candy = candy;
      spawns.push({
        id: candy.id,
        color: candy.color,
        special: candy.special,
        from: { r: i - empty, c }, // parte sopra il tabellone
        to: { r: to, c },
      });
    }
  }

  if (falls.length > 0) steps.push({ type: 'fall', moves: falls });
  if (spawns.length > 0) steps.push({ type: 'spawn', candies: spawns });
}

// Risolve tutti i match presenti, cascata dopo cascata.
// options.swap  = { from, to }: le caselle appena scambiate (per far nascere lo speciale lì)
// options.combo = { from, to }: lo scambio era una combinazione di speciali
// Restituisce quante cascate ci sono state (0 = nessun match).
export function resolveBoard(state, steps, options = {}) {
  let cascade = 0;

  if (options.combo) {
    cascade = 1;
    steps.push({ type: 'cascade', n: cascade });
    const cells = applyCombo(state, options.combo.from, options.combo.to, steps);
    removeCells(state, cells, cascade, steps);
    applyGravity(state, steps);
  }

  for (;;) {
    const groups = findMatches(state.board);
    if (groups.length === 0) break;
    cascade++;
    steps.push({ type: 'cascade', n: cascade });
    const swapCells = cascade === 1 && options.swap ? [options.swap.to, options.swap.from] : [];
    clearMatches(state, groups, cascade, steps, swapCells);
    applyGravity(state, steps);
  }
  return cascade;
}
