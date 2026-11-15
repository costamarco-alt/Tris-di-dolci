// Avvio: collega il motore di gioco all'interfaccia.
import { CONFIG } from './config.js';
import { createGame, getGoalProgress, getHint, getStars, getStatus, trySwap } from './engine/game.js';
import { isSwappable } from './engine/moves.js';
import { getLevel, LEVELS } from './levels/levels.js';
import { createStorage } from './storage.js';
import { STRINGS } from './strings.js';
import { icon } from './ui/dom.js';
import { createHud } from './ui/hud.js';
import { attachInput } from './ui/input.js';
import { createRenderer } from './ui/render.js';
import { createScreens } from './ui/screens.js';

const $ = (id) => document.getElementById(id);
const boardEl = $('board');
const params = new URLSearchParams(location.search);
const storage = createStorage();

// ---------- Impostazioni: animazioni e vibrazione ----------

const motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
const isReducedMotion = () => storage.getSettings().reducedMotion || Boolean(motionQuery?.matches);

function applySettings() {
  document.body.classList.toggle('reduced-motion', storage.getSettings().reducedMotion);
}

// Vibrazione breve, solo se il telefono la supporta e l'impostazione è attiva.
function vibrate(pattern) {
  if (!storage.getSettings().vibration) return;
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // niente vibrazione: non è un problema
  }
}

// ---------- Pezzi dell'interfaccia ----------

const hud = createHud($('hud'));
const renderer = createRenderer(boardEl, {
  isReducedMotion,
  onSpecial: (kind) => vibrate(kind === 'activate' ? 18 : 10),
});
boardEl.setAttribute('aria-label', STRINGS.tabellone);

const screens = createScreens(
  { menu: $('screen-menu'), map: $('screen-map'), game: $('screen-game'), overlay: $('overlay') },
  { onPlay: openMap, onOpenLevel: openLevel, onSettings: () => openSettings(), onMenu: openMenu }
);

for (const [id, name, label, handler] of [
  ['btn-back', 'back', STRINGS.tornaAllaMappa, () => openMap()],
  ['btn-settings', 'gear', STRINGS.impostazioni, () => openSettings()],
]) {
  const node = $(id);
  node.append(icon(name));
  node.setAttribute('aria-label', label);
  node.addEventListener('click', handler);
}

// ---------- Stato della partita ----------

let state = null;
let shown = null; // quello che l'HUD sta mostrando mentre girano le animazioni
// Macchina a stati dell'input: idle → swapping → resolving → idle
// ('waiting' prima del via, 'ended' a fine livello).
let phase = 'waiting';
let gameToken = 0; // cambia a ogni nuova partita: le animazioni vecchie vengono ignorate
let hintTimer = null;
let handActive = false;

function newSeed() {
  const fixed = Number(params.get('seed'));
  if (Number.isInteger(fixed) && fixed > 0) return fixed;
  return (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
}

function stopHints() {
  clearTimeout(hintTimer);
  renderer.clearHint();
}

function scheduleHint() {
  stopHints();
  if (phase !== 'idle') return;
  hintTimer = setTimeout(() => {
    if (phase === 'idle' && state && !handActive) renderer.showHint(getHint(state));
  }, CONFIG.ANIM.HINT_DELAY);
}

function leaveGame() {
  gameToken++;
  phase = 'waiting';
  stopHints();
  renderer.hideHand();
  handActive = false;
}

// ---------- Navigazione ----------

function openMenu() {
  leaveGame();
  const data = storage.getData();
  screens.showMenu({ unlocked: data.unlocked, hasProgress: data.unlocked > 1 || storage.totalStars() > 0 });
}

function openMap(focusLevel) {
  leaveGame();
  const data = storage.getData();
  screens.showMap({
    levels: LEVELS.map((level) => ({
      id: level.id,
      unlocked: storage.isUnlocked(level.id),
      stars: storage.getLevel(level.id).stars,
    })),
    current: focusLevel ?? Math.min(data.unlocked, LEVELS.length),
    totalStars: storage.totalStars(),
  });
}

function openSettings() {
  const wasPlaying = !$('screen-game').hidden && phase !== 'ended';
  stopHints();
  screens.showSettings(
    { ...storage.getSettings() },
    {
      onChange(key, value) {
        storage.setSetting(key, value);
        applySettings();
        if (key === 'vibration' && value) vibrate(18);
      },
      onReset() {
        storage.resetProgress();
        // Dopo l'azzeramento si riparte dal menu, anche se si era in partita.
        resetPending = true;
      },
      onClose() {
        if (resetPending) {
          resetPending = false;
          openMenu();
        } else if (!$('screen-menu').hidden) {
          openMenu();
        } else if (wasPlaying) {
          scheduleHint();
        }
      },
    }
  );
}
let resetPending = false;

// ---------- Partita ----------

function syncHud() {
  hud.setMoves(state.movesLeft);
  hud.setScore(state.score);
  hud.setGoal(getGoalProgress(state));
}

function openLevel(id) {
  if (!storage.isUnlocked(id)) return;
  leaveGame();
  const level = getLevel(id);
  state = createGame(level, newSeed());
  shown = { score: 0, progress: getGoalProgress(state) };
  renderer.draw(state);
  hud.setLevel(level);
  syncHud();
  screens.show('game');
  const token = gameToken;
  screens.showStart(level, () => {
    if (token !== gameToken) return;
    phase = 'idle';
    if (level.hand) {
      handActive = true;
      renderer.showHand(getHint(state));
    }
    scheduleHint();
  });
}

// Aggiorna l'HUD passo dopo passo, mentre l'animazione avanza.
function onStep(step) {
  if (step.points) {
    shown.score += step.points;
    hud.setScore(shown.score);
  }
  const progress = shown.progress;
  if (step.type === 'clear' && progress.type === 'collect') {
    for (const cell of step.cells) {
      const item = progress.items.find((entry) => entry.color === cell.color);
      if (item && item.current < item.count) {
        item.current++;
        item.done = item.current >= item.count;
      }
    }
    hud.setGoal(progress);
  } else if (
    (step.type === 'jellyHit' && progress.type === 'jelly') ||
    (step.type === 'iceHit' && progress.type === 'ice')
  ) {
    progress.remaining = Math.max(0, progress.remaining - step.cells.length);
    progress.done = progress.remaining === 0;
    hud.setGoal(progress);
  }
}

async function handleSwap(from, to) {
  if (phase !== 'idle' || !state) return;
  stopHints();
  renderer.setSelected(null);

  const { valid, steps } = trySwap(state, from, to);
  if (steps.length === 0) {
    scheduleHint();
    return;
  }
  const token = gameToken;
  phase = 'swapping';
  if (valid) {
    hud.setMoves(state.movesLeft);
    if (handActive) {
      handActive = false;
      renderer.hideHand();
    }
  }
  await renderer.play(steps, (step) => {
    if (token !== gameToken) return;
    if (step.type !== 'swap' && step.type !== 'swapBack') phase = 'resolving';
    onStep(step);
  });
  if (token !== gameToken) return; // nel frattempo il giocatore è uscito dal livello

  shown = { score: state.score, progress: getGoalProgress(state) };
  syncHud();

  const status = getStatus(state);
  if (status === 'playing') {
    phase = 'idle';
    scheduleHint();
    return;
  }
  finishLevel(status === 'won');
}

function finishLevel(won) {
  phase = 'ended';
  const level = state.level;
  const stars = getStars(state);
  const previous = storage.getLevel(level.id);
  let best = previous.best;
  if (won) {
    best = storage.recordWin(level.id, stars, state.score, LEVELS.length).best;
    vibrate([30, 60, 30]);
  }
  const hasNext = level.id < LEVELS.length;
  screens.showEnd(
    {
      won,
      score: state.score,
      stars,
      best,
      isRecord: won && state.score > previous.best,
      missing: Math.max(0, (level.goal?.target ?? 0) - state.score),
      hasNext,
      goalType: level.goal?.type ?? 'score',
    },
    {
      onNext: () => openLevel(level.id + 1),
      onRetry: () => openLevel(level.id),
      onMap: () => openMap(won && hasNext ? level.id + 1 : level.id),
    }
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

applySettings();
openMenu();

// Aiuto per le prove automatiche: si attiva solo aprendo la pagina con ?debug
if (params.has('debug')) {
  window.trisDebug = {
    getState: () => state,
    getPhase: () => phase,
    getHint: () => getHint(state),
    getStatus: () => getStatus(state),
    getProgress: () => getGoalProgress(state),
    storage,
    openLevel,
  };
}
