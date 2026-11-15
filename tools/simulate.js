// Bot che gioca i livelli per il bilanciamento.
//
//   node tools/simulate.js              tutti i livelli, 200 partite l'uno
//   node tools/simulate.js --games 500  più partite per livello
//   node tools/simulate.js --level 12   un solo livello
//   node tools/simulate.js --markdown   tabella pronta da incollare in ROADMAP.md
//
// Il bot sceglie sempre la mossa con il punteggio immediato più alto.
// Non ragiona sull'obiettivo: una persona attenta fa un po' meglio.
import { createGame, getHint, getStars, getStatus, trySwap } from '../src/engine/game.js';
import { LEVELS } from '../src/levels/levels.js';

// Vittorie del bot che vogliamo per ogni fascia di livelli (percentuali).
export const TARGETS = [
  { from: 1, to: 5, min: 90, max: 100 },
  { from: 6, to: 15, min: 60, max: 85 },
  { from: 16, to: 30, min: 35, max: 70 },
];

export function targetFor(id) {
  return TARGETS.find((band) => id >= band.from && id <= band.to);
}

// Gioca `games` partite di un livello con seed diversi e restituisce le medie.
export function simulateLevel(level, games = 200) {
  let wins = 0;
  let stars = 0;
  let leftover = 0;
  let score = 0;
  let stuck = 0;
  for (let game = 0; game < games; game++) {
    const state = createGame(level, 1000 * level.id + game + 1);
    while (getStatus(state) === 'playing') {
      const move = getHint(state);
      if (!move) break;
      trySwap(state, move.from, move.to);
    }
    if (state.stuck) stuck++;
    score += state.score;
    if (getStatus(state) === 'won') {
      wins++;
      stars += getStars(state);
      leftover += state.movesLeft;
    }
  }
  return {
    id: level.id,
    goal: level.goal.type,
    moves: level.moves,
    winRate: (wins / games) * 100,
    avgStars: wins > 0 ? stars / wins : 0, // stelle medie nelle partite vinte
    avgLeftover: wins > 0 ? leftover / wins : 0, // mosse avanzate medie nelle partite vinte
    avgScore: score / games,
    stuck,
  };
}

const GOAL_NAMES = { score: 'punteggio', collect: 'raccolta', jelly: 'gelatina', ice: 'ghiaccio' };

function main() {
  const args = process.argv.slice(2);
  const option = (name) => {
    const index = args.indexOf(name);
    return index >= 0 ? Number(args[index + 1]) : undefined;
  };
  const games = option('--games') || 200;
  const only = option('--level');
  const markdown = args.includes('--markdown');
  const levels = only ? LEVELS.filter((level) => level.id === only) : LEVELS;

  const rows = levels.map((level) => simulateLevel(level, games));
  const fmt = (row) => {
    const band = targetFor(row.id);
    const ok = row.winRate >= band.min && row.winRate <= band.max;
    return [
      String(row.id),
      GOAL_NAMES[row.goal],
      String(row.moves),
      `${row.winRate.toFixed(0)}%`,
      row.avgStars.toFixed(1),
      row.avgLeftover.toFixed(1),
      `${band.min}–${band.max}%`,
      ok ? 'sì' : 'NO',
    ];
  };
  const header = ['Livello', 'Obiettivo', 'Mosse', 'Vittorie', 'Stelle medie', 'Mosse avanzate', 'Fascia voluta', 'In fascia'];
  const table = [header, ...rows.map(fmt)];

  if (markdown) {
    console.log(`| ${header.join(' | ')} |`);
    console.log(`|${header.map(() => '---').join('|')}|`);
    for (const line of table.slice(1)) console.log(`| ${line.join(' | ')} |`);
  } else {
    const widths = header.map((_, i) => Math.max(...table.map((line) => line[i].length)));
    for (const line of table) console.log(line.map((cell, i) => cell.padEnd(widths[i])).join('  '));
  }

  const out = rows.filter((row) => fmt(row)[7] === 'NO').map((row) => row.id);
  const stuck = rows.filter((row) => row.stuck > 0).map((row) => row.id);
  console.log('');
  console.log(`Partite per livello: ${games}.`);
  console.log(out.length ? `Fuori fascia: livelli ${out.join(', ')}.` : 'Tutti i livelli sono nella fascia voluta.');
  if (stuck.length) console.log(`Attenzione, tabellone bloccato nei livelli ${stuck.join(', ')}.`);
}

// Si avvia solo se lanciato direttamente (i test importano le funzioni).
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop())) {
  main();
}
