// Avvio: collega il motore di gioco all'interfaccia.
import { CONFIG } from './config.js';
import { createGame, getHint, getStars, getStatus, trySwap } from './engine/game.js';
import { isSwappable } from './engine/moves.js';
import { getLevel } from './levels/levels.js';
import { STRINGS } from './strings.js';
import { createHud } from './ui/hud.js';
import { attachInput } from './ui/input.js';
import { createRenderer } from './ui/render.js';
import { createScreens } from './ui/screens.js';

const boardEl = document.getElementById('board');
const params = new URLSearchParams(location.search);

const motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
const isReducedMotion = () => Boolean(motionQuery?.matches);

const hud = createHud(document.getElementById('hud'));
const screens = createScreens(document.getElementById('overlay'));
const renderer = createRenderer(boardEl, { isReducedMotion });
boardEl.setAttribute('aria-label', STRINGS.tabellone);

let state = null;
let shownScore = 0;
// Macchina a stati dell'input: idle → swapping → resolving → idle (ended a fine livello).
let phase = 'idle';
let hintTimer = null;

function newSeed() {
  const fixed = Number(params.get('seed'));
  if (Number.isInteger(fixed) && fixed > 0) return fixed;
  return (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
}

function scheduleHint() {
  clearTimeout(hintTimer);
  renderer.clearHint();
  if (phase !== 'idle') return;
  hintTimer = setTimeout(() => {
    if (phase === 'idle' && state) renderer.showHint(getHint(state));
  }, CONFIG.ANIM.HINT_DELAY);
}

function startLevel(id) {
  const level = getLevel(id);
  state = createGame(level, newSeed());
  shownScore = 0;
  phase = 'idle';
  screens.hide();
  renderer.draw(state);
  hud.setLevel(level);
  hud.setMoves(state.movesLeft);
  hud.setScore(0);
  scheduleHint();
}

function onStep(step) {
  if (step.type === 'clear') {
    shownScore += step.points;
    hud.setScore(shownScore);
  }
}

async function handleSwap(from, to) {
  if (phase !== 'idle' || !state) return;
  clearTimeout(hintTimer);
  renderer.clearHint();
  renderer.setSelected(null);

  const { valid, steps } = trySwap(state, from, to);
  if (steps.length === 0) {
    scheduleHint();
    return;
  }
  phase = 'swapping';
  if (valid) hud.setMoves(state.movesLeft);
  await renderer.play(steps, (step) => {
    if (step.type !== 'swap' && step.type !== 'swapBack') phase = 'resolving';
    onStep(step);
  });
  hud.setScore(state.score);

  const status = getStatus(state);
  if (status === 'playing') {
    phase = 'idle';
    scheduleHint();
    return;
  }
  phase = 'ended';
  const level = state.level;
  screens.showEnd(
    { won: status === 'won', score: state.score, stars: getStars(state), target: level.goal?.target ?? 0 },
    () => startLevel(level.id)
  );
}

attachInput(boardEl, {
  threshold: CONFIG.SWIPE_THRESHOLD,
  getCell: (x, y) => renderer.cellFromPoint(x, y),
  getCellSize: () => renderer.cellSize(),
  canInput: () => phase === 'idle',
  canSelect: (pos) => Boolean(state) && isSwappable(state.board, pos),
  onSwap: handleSwap,
  onSelect: (pos) => renderer.setSelected(pos),
  onActivity: scheduleHint,
});

startLevel(1);

// Aiuto per le prove automatiche: si attiva solo aprendo la pagina con ?debug
if (params.has('debug')) {
  window.trisDebug = {
    getState: () => state,
    getPhase: () => phase,
    getHint: () => getHint(state),
    getStatus: () => getStatus(state),
  };
}
