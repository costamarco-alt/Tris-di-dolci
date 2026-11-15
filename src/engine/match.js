// Ricerca dei match: linee da 3/4/5+ e forme a L e a T. Logica pura.

// Colore che conta per i match (-1 = non fa match).
// L'Arcobaleno non ha un colore proprio: non entra mai in un match normale.
function matchColor(cell) {
  if (cell.hole || !cell.candy) return -1;
  if (cell.candy.special === 'rainbow') return -1;
  return cell.candy.color;
}

// Tutte le file (orizzontali e verticali) di 3 o più caramelle uguali.
// Buchi e caselle vuote interrompono la fila.
export function findRuns(board) {
  const runs = [];
  const { rows, cols, cells } = board;

  for (let r = 0; r < rows; r++) {
    let c = 0;
    while (c < cols) {
      const color = matchColor(cells[r][c]);
      if (color < 0) { c++; continue; }
      let end = c + 1;
      while (end < cols && matchColor(cells[r][end]) === color) end++;
      if (end - c >= 3) {
        const list = [];
        for (let k = c; k < end; k++) list.push({ r, c: k });
        runs.push({ orientation: 'h', color, cells: list });
      }
      c = end;
    }
  }

  for (let c = 0; c < cols; c++) {
    let r = 0;
    while (r < rows) {
      const color = matchColor(cells[r][c]);
      if (color < 0) { r++; continue; }
      let end = r + 1;
      while (end < rows && matchColor(cells[end][c]) === color) end++;
      if (end - r >= 3) {
        const list = [];
        for (let k = r; k < end; k++) list.push({ r: k, c });
        runs.push({ orientation: 'v', color, cells: list });
      }
      r = end;
    }
  }

  return runs;
}

const key = (p) => p.r * 16 + p.c;

// Forma del gruppo, con la priorità: 5 in fila, poi L/T, poi 4 in fila, poi 3.
function classify(runs) {
  const longest = runs.reduce((a, b) => (b.cells.length > a.cells.length ? b : a));
  if (longest.cells.length >= 5) return { shape: 'line5', orientation: longest.orientation };

  const horizontal = runs.filter((run) => run.orientation === 'h');
  const vertical = runs.filter((run) => run.orientation === 'v');
  if (horizontal.length > 0 && vertical.length > 0) {
    // L: l'incrocio è alla fine di entrambe le file. Altrimenti è una T (o una croce).
    let shape = 'L';
    for (const h of horizontal) {
      for (const v of vertical) {
        const cross = h.cells.find((p) => v.cells.some((q) => q.r === p.r && q.c === p.c));
        if (!cross) continue;
        const endOfH = cross.c === h.cells[0].c || cross.c === h.cells[h.cells.length - 1].c;
        const endOfV = cross.r === v.cells[0].r || cross.r === v.cells[v.cells.length - 1].r;
        if (!(endOfH && endOfV)) shape = 'T';
      }
    }
    return { shape, orientation: null };
  }

  if (longest.cells.length === 4) return { shape: 'line4', orientation: longest.orientation };
  return { shape: 'line3', orientation: longest.orientation };
}

// Raggruppa le file che si incrociano e restituisce i gruppi di match:
// { color, shape: 'line3'|'line4'|'line5'|'L'|'T', orientation: 'h'|'v'|null, cells, runs }
export function findMatches(board) {
  const runs = findRuns(board);
  if (runs.length === 0) return [];

  // Union-find sulle file: due file che condividono una casella sono lo stesso gruppo.
  const parent = runs.map((_, i) => i);
  const find = (i) => {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]];
      i = parent[i];
    }
    return i;
  };
  const owner = new Map();
  runs.forEach((run, i) => {
    for (const p of run.cells) {
      const k = key(p);
      if (owner.has(k)) parent[find(i)] = find(owner.get(k));
      else owner.set(k, i);
    }
  });

  const byRoot = new Map();
  runs.forEach((run, i) => {
    const root = find(i);
    if (!byRoot.has(root)) byRoot.set(root, []);
    byRoot.get(root).push(run);
  });

  const groups = [];
  for (const groupRuns of byRoot.values()) {
    const seen = new Set();
    const cells = [];
    for (const run of groupRuns) {
      for (const p of run.cells) {
        if (seen.has(key(p))) continue;
        seen.add(key(p));
        cells.push({ r: p.r, c: p.c });
      }
    }
    cells.sort((a, b) => a.r - b.r || a.c - b.c);
    groups.push({ color: groupRuns[0].color, ...classify(groupRuns), cells, runs: groupRuns });
  }
  groups.sort((a, b) => a.cells[0].r - b.cells[0].r || a.cells[0].c - b.cells[0].c);
  return groups;
}

export function hasMatches(board) {
  return findRuns(board).length > 0;
}
