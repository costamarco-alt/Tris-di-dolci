// Ciclo elimina → gravità → riempi → ricontrolla (cascate). Logica pura.
import { CONFIG } from '../config.js';
import { createCandy } from './board.js';
import { findMatches } from './match.js';
import { applyCombo, creationCell, expandClear, specialBonus, specialForGroup } from './specials.js';

// Colpisce le caselle indicate e aggiunge il passo 'clear' (più 'iceHit' e 'jellyHit').
// - Caramella ghiacciata: perde uno strato di ghiaccio e resta al suo posto.
// - Caramella libera: viene eliminata; se sotto c'è gelatina, ne sparisce uno strato.
function removeCells(state, cells, cascade, steps, groups = []) {
  const { board } = state;
  const cleared = [];
  const iceHits = [];
  const jellyHits = [];
  for (const p of cells) {
    const cell = board.cells[p.r][p.c];
    if (!cell.candy) continue;
    if (cell.ice > 0) {
      cell.ice--;
      iceHits.push({ r: p.r, c: p.c, ice: cell.ice });
      continue;
    }
    cleared.push({ r: p.r, c: p.c, id: cell.candy.id, color: cell.candy.color, special: cell.candy.special });
    state.collected[cell.candy.color] = (state.collected[cell.candy.color] || 0) + 1;
    cell.candy = null;
    if (cell.jelly > 0) {
      cell.jelly--;
      jellyHits.push({ r: p.r, c: p.c, jelly: cell.jelly });
    }
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
  if (iceHits.length > 0) steps.push({ type: 'iceHit', cells: iceHits });
  if (jellyHits.length > 0) steps.push({ type: 'jellyHit', cells: jellyHits });
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
    if (special) plans.push({ special, color: group.color, pos: creationCell(group, swapCells), cells: group.cells });
  }

  const cells = expandClear(state, seeds, steps);
  const count = removeCells(state, cells, cascade, steps, groups);

  for (const plan of plans) {
    // Se la casella prevista è ancora occupata (caramella ghiacciata rimasta lì),
    // lo speciale nasce in un'altra casella liberata del gruppo; se non ce ne sono, niente.
    let pos = plan.pos;
    if (state.board.cells[pos.r][pos.c].candy) {
      pos = plan.cells.find((p) => !state.board.cells[p.r][p.c].candy);
      if (!pos) continue;
      plan.pos = pos;
    }
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

const isFrozen = (cell) => Boolean(cell.candy) && cell.ice > 0;

// Caduta in verticale di una colonna, con arrivo delle caramelle nuove dall'alto.
// Una caramella ghiacciata non cade e fa da appoggio a quelle sopra.
function fallColumn(state, c, falls, spawns) {
  const { board } = state;
  let slots = []; // caselle libere del tratto corrente, dal basso verso l'alto
  for (let r = board.rows - 1; r >= 0; r--) {
    const cell = board.cells[r][c];
    if (cell.hole) continue; // i buchi si attraversano
    if (isFrozen(cell)) {
      slots = []; // sotto il ghiaccio non arriva niente dall'alto
    } else if (!cell.candy) {
      slots.push(r);
    } else if (slots.length > 0) {
      const to = slots.shift();
      board.cells[to][c].candy = cell.candy;
      cell.candy = null;
      slots.push(r);
      falls.push({ id: board.cells[to][c].candy.id, from: { r, c }, to: { r: to, c } });
    }
  }
  // Le caselle rimaste libere in cima ricevono caramelle nuove.
  slots.sort((a, b) => a - b);
  slots.forEach((to, i) => {
    const candy = createCandy(state.nextId++, state.rng.int(state.colors));
    board.cells[to][c].candy = candy;
    spawns.push({
      id: candy.id,
      color: candy.color,
      special: candy.special,
      from: { r: i - slots.length, c }, // parte sopra il tabellone
      to: { r: to, c },
    });
  });
}

// Vero se sopra la casella, nella stessa colonna, c'è una caramella ghiacciata:
// in quel caso dall'alto non può arrivare niente.
function isBlocked(board, r, c) {
  for (let k = r - 1; k >= 0; k--) {
    if (isFrozen(board.cells[k][c])) return true;
  }
  return false;
}

// Le caselle vuote sotto il ghiaccio si riempiono con caramelle che scivolano
// in diagonale dalle colonne vicine. Restituisce gli spostamenti fatti.
function slideDiagonals(board) {
  const slides = [];
  const moved = new Set();
  for (let r = board.rows - 1; r >= 1; r--) {
    for (let c = 0; c < board.cols; c++) {
      const cell = board.cells[r][c];
      if (cell.hole || cell.candy || !isBlocked(board, r, c)) continue;
      const sides = (r + c) % 2 === 0 ? [c - 1, c + 1] : [c + 1, c - 1];
      for (const side of sides) {
        const source = board.cells[r - 1][side];
        if (!source || source.hole || !source.candy || source.ice > 0 || moved.has(source.candy.id)) continue;
        cell.candy = source.candy;
        source.candy = null;
        moved.add(cell.candy.id);
        slides.push({ id: cell.candy.id, from: { r: r - 1, c: side }, to: { r, c } });
        break;
      }
    }
  }
  return slides;
}

// Fa cadere le caramelle e riempie dall'alto. Aggiunge i passi 'fall' e 'spawn'.
// I buchi si attraversano: una caramella sopra un buco cade nella casella libera sotto.
export function applyGravity(state, steps) {
  const { board } = state;
  for (let guard = 0; guard < 500; guard++) {
    const falls = [];
    const spawns = [];
    for (let c = 0; c < board.cols; c++) fallColumn(state, c, falls, spawns);
    if (falls.length > 0) steps.push({ type: 'fall', moves: falls });
    if (spawns.length > 0) steps.push({ type: 'spawn', candies: spawns });

    const slides = slideDiagonals(board);
    if (slides.length === 0) break;
    steps.push({ type: 'fall', moves: slides, diagonal: true });
  }
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
