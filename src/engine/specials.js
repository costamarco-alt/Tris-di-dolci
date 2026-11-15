// Caramelle speciali e loro combinazioni. Logica pura.
//   rocketH / rocketV  Razzo: elimina tutta la riga / tutta la colonna
//   bomb               Bomba: esplode in un'area 3×3
//   rainbow            Arcobaleno: elimina tutte le caramelle di un colore
import { CONFIG } from '../config.js';

export const isRocket = (special) => special === 'rocketH' || special === 'rocketV';

// Scambio "speciale": sempre valido, anche senza creare un match.
// Vale per due speciali tra loro e per un Arcobaleno con qualsiasi caramella.
export function isSpecialSwap(a, b) {
  if (!a || !b) return false;
  return Boolean(a.special && b.special) || a.special === 'rainbow' || b.special === 'rainbow';
}

// Speciale creato da un gruppo di match (priorità: Arcobaleno, Bomba, Razzo).
export function specialForGroup(group) {
  if (group.shape === 'line5') return 'rainbow';
  if (group.shape === 'L' || group.shape === 'T') return 'bomb';
  if (group.shape === 'line4') return group.orientation === 'h' ? 'rocketH' : 'rocketV';
  return null;
}

export function specialBonus(special) {
  if (isRocket(special)) return CONFIG.SPECIAL_BONUS.rocket;
  return CONFIG.SPECIAL_BONUS[special] ?? 0;
}

const samePos = (a, b) => a.r === b.r && a.c === b.c;

// Casella in cui nasce lo speciale: quella mossa dal giocatore, se fa parte
// del gruppo; altrimenti il centro del gruppo (l'incrocio per le forme L/T).
export function creationCell(group, swapCells = []) {
  for (const pos of swapCells) {
    const found = group.cells.find((p) => samePos(p, pos));
    if (found) return { r: found.r, c: found.c };
  }
  const horizontal = group.runs.filter((run) => run.orientation === 'h');
  const vertical = group.runs.filter((run) => run.orientation === 'v');
  if (group.shape === 'L' || group.shape === 'T') {
    for (const h of horizontal) {
      for (const v of vertical) {
        const cross = h.cells.find((p) => v.cells.some((q) => samePos(p, q)));
        if (cross) return { r: cross.r, c: cross.c };
      }
    }
  }
  const longest = group.runs.reduce((a, b) => (b.cells.length > a.cells.length ? b : a));
  const middle = longest.cells[Math.floor((longest.cells.length - 1) / 2)];
  return { r: middle.r, c: middle.c };
}

// ---------- Aree colpite ----------

function rowCells(board, r) {
  const list = [];
  if (r < 0 || r >= board.rows) return list;
  for (let c = 0; c < board.cols; c++) if (!board.cells[r][c].hole) list.push({ r, c });
  return list;
}

function colCells(board, c) {
  const list = [];
  if (c < 0 || c >= board.cols) return list;
  for (let r = 0; r < board.rows; r++) if (!board.cells[r][c].hole) list.push({ r, c });
  return list;
}

function squareCells(board, center, radius) {
  const list = [];
  for (let r = center.r - radius; r <= center.r + radius; r++) {
    for (let c = center.c - radius; c <= center.c + radius; c++) {
      if (r < 0 || c < 0 || r >= board.rows || c >= board.cols) continue;
      if (!board.cells[r][c].hole) list.push({ r, c });
    }
  }
  return list;
}

function allCells(board) {
  const list = [];
  for (let r = 0; r < board.rows; r++) list.push(...rowCells(board, r));
  return list;
}

function unique(cells) {
  const seen = new Set();
  return cells.filter((p) => {
    const k = p.r * 16 + p.c;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

// Caselle con una caramella (non Arcobaleno) del colore dato.
function cellsOfColor(board, color, skip = null) {
  const list = [];
  for (let r = 0; r < board.rows; r++) {
    for (let c = 0; c < board.cols; c++) {
      const candy = board.cells[r][c].candy;
      if (!candy || candy.special === 'rainbow' || candy.color !== color) continue;
      if (skip && skip.has(r * 16 + c)) continue;
      list.push({ r, c });
    }
  }
  return list;
}

// Colore più presente sul tabellone (a parità vince il numero più basso), o -1.
function mostCommonColor(board, skip) {
  const counts = new Map();
  for (let r = 0; r < board.rows; r++) {
    for (let c = 0; c < board.cols; c++) {
      const candy = board.cells[r][c].candy;
      if (!candy || candy.special === 'rainbow' || skip.has(r * 16 + c)) continue;
      counts.set(candy.color, (counts.get(candy.color) ?? 0) + 1);
    }
  }
  let best = -1;
  let bestCount = 0;
  for (const [color, count] of [...counts].sort((a, b) => a[0] - b[0])) {
    if (count > bestCount) {
      best = color;
      bestCount = count;
    }
  }
  return best;
}

// ---------- Reazioni a catena ----------

// Parte dalle caselle "seeds" e segue le reazioni a catena: ogni speciale colpito
// si attiva (passo 'activate') e aggiunge la sua area. Restituisce tutte le caselle
// da eliminare. `done` contiene gli id degli speciali già attivati o consumati.
export function expandClear(state, seeds, steps, done = new Set()) {
  const { board } = state;
  const marked = new Set();
  const result = [];
  const queue = [...seeds];

  while (queue.length > 0) {
    const pos = queue.shift();
    const k = pos.r * 16 + pos.c;
    if (marked.has(k)) continue;
    const cell = board.cells[pos.r]?.[pos.c];
    if (!cell || cell.hole || !cell.candy) continue;
    marked.add(k);
    result.push({ r: pos.r, c: pos.c });

    const candy = cell.candy;
    if (!candy.special || done.has(candy.id)) continue;
    done.add(candy.id);

    const step = { type: 'activate', id: candy.id, r: pos.r, c: pos.c, special: candy.special, color: candy.color };
    let area;
    if (candy.special === 'rocketH') area = rowCells(board, pos.r);
    else if (candy.special === 'rocketV') area = colCells(board, pos.c);
    else if (candy.special === 'bomb') area = squareCells(board, pos, 1);
    else {
      // Arcobaleno colpito da un'esplosione: sceglie il colore più presente.
      step.targetColor = mostCommonColor(board, marked);
      area = step.targetColor < 0 ? [] : cellsOfColor(board, step.targetColor, marked);
    }
    step.cells = area.filter((p) => board.cells[p.r][p.c].candy);
    steps.push(step);
    queue.push(...area);
  }
  return result;
}

// ---------- Combinazioni ----------

// Applica lo scambio speciale appena fatto (le due caramelle sono già scambiate:
// quella mossa dal giocatore ora è in `to`). Aggiunge i passi e restituisce
// le caselle da eliminare.
export function applyCombo(state, from, to, steps) {
  const { board } = state;
  const moved = board.cells[to.r][to.c].candy;
  const other = board.cells[from.r][from.c].candy;
  const done = new Set();
  const base = { type: 'activate', id: moved.id, r: to.r, c: to.c, special: moved.special, color: moved.color };
  const withCandy = (cells) => cells.filter((p) => board.cells[p.r][p.c].candy);

  // Arcobaleno + Arcobaleno: svuota tutto il tabellone.
  if (moved.special === 'rainbow' && other.special === 'rainbow') {
    done.add(moved.id).add(other.id);
    const cells = allCells(board);
    steps.push({ ...base, combo: 'rainbow+rainbow', cells: withCandy(cells) });
    return expandClear(state, cells, steps, done);
  }

  // Arcobaleno + caramella (normale, Razzo o Bomba).
  if (moved.special === 'rainbow' || other.special === 'rainbow') {
    const rainbowPos = moved.special === 'rainbow' ? to : from;
    const rainbow = board.cells[rainbowPos.r][rainbowPos.c].candy;
    const partner = rainbow === moved ? other : moved;
    done.add(rainbow.id);
    const targets = cellsOfColor(board, partner.color);
    const kind = isRocket(partner.special) ? 'rocket' : partner.special === 'bomb' ? 'bomb' : 'candy';
    steps.push({
      type: 'activate',
      id: rainbow.id,
      r: rainbowPos.r,
      c: rainbowPos.c,
      special: 'rainbow',
      color: rainbow.color,
      combo: `rainbow+${kind}`,
      targetColor: partner.color,
      cells: targets.map((p) => ({ ...p })),
    });
    if (kind !== 'candy') {
      // Tutte le caramelle di quel colore diventano Razzi o Bombe.
      for (const p of targets) {
        const candy = board.cells[p.r][p.c].candy;
        if (candy.special) continue;
        candy.special = kind === 'bomb' ? 'bomb' : state.rng.int(2) === 0 ? 'rocketH' : 'rocketV';
        steps.push({
          type: 'createSpecial',
          id: candy.id,
          r: p.r,
          c: p.c,
          color: candy.color,
          special: candy.special,
          points: 0,
          converted: true,
        });
      }
    }
    return expandClear(state, [rainbowPos, ...targets], steps, done);
  }

  // Due speciali tra Razzi e Bombe: l'effetto parte dalla casella di arrivo.
  done.add(moved.id).add(other.id);
  const rockets = [moved, other].filter((candy) => isRocket(candy.special)).length;
  let combo;
  let area;
  if (rockets === 2) {
    combo = 'rocket+rocket';
    area = [...rowCells(board, to.r), ...colCells(board, to.c)];
  } else if (rockets === 1) {
    combo = 'rocket+bomb';
    area = [];
    for (let d = -1; d <= 1; d++) area.push(...rowCells(board, to.r + d), ...colCells(board, to.c + d));
  } else {
    combo = 'bomb+bomb';
    area = squareCells(board, to, 2);
  }
  area = unique([to, from, ...area]);
  steps.push({ ...base, combo, cells: withCandy(area) });
  return expandClear(state, area, steps, done);
}
