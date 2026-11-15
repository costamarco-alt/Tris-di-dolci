// HUD in alto: livello, mosse rimaste, punteggio con barra delle stelle, obiettivo.
import { STRINGS } from '../strings.js';

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function goalText(goal) {
  if (!goal || goal.type === 'score') return STRINGS.obiettivoPunti(goal?.target ?? 0);
  return '';
}

export function createHud(root) {
  root.textContent = '';

  const top = el('div', 'hud-top');
  const levelBox = el('div', 'hud-box');
  const levelValue = el('div', 'hud-value');
  levelBox.append(el('div', 'hud-label', STRINGS.livello), levelValue);

  const movesBox = el('div', 'hud-box hud-moves');
  const movesValue = el('div', 'hud-value');
  movesBox.append(el('div', 'hud-label', STRINGS.mosse), movesValue);

  const scoreBox = el('div', 'hud-box');
  const scoreValue = el('div', 'hud-value');
  scoreBox.append(el('div', 'hud-label', STRINGS.punti), scoreValue);
  top.append(levelBox, movesBox, scoreBox);

  const bar = el('div', 'hud-bar');
  const fill = el('div', 'hud-bar-fill');
  bar.append(fill);
  const marks = [0, 1, 2].map(() => {
    const mark = el('div', 'hud-star', '★');
    bar.append(mark);
    return mark;
  });

  const goal = el('div', 'hud-goal');
  root.append(top, bar, goal);

  let thresholds = [];
  let max = 1;

  return {
    setLevel(level) {
      levelValue.textContent = String(level.id);
      goal.textContent = goalText(level.goal);
      thresholds = level.stars ?? [];
      // La barra arriva un po' oltre la terza stella.
      max = (thresholds[2] ?? level.goal?.target ?? 1) * 1.08;
      marks.forEach((mark, i) => {
        mark.hidden = thresholds[i] === undefined;
        mark.style.left = `${Math.min(100, ((thresholds[i] ?? 0) / max) * 100)}%`;
      });
    },
    setMoves(moves) {
      movesValue.textContent = String(moves);
      movesBox.classList.toggle('hud-moves-low', moves <= 5);
    },
    setScore(score) {
      scoreValue.textContent = String(score);
      fill.style.transform = `scaleX(${Math.min(1, score / max)})`;
      marks.forEach((mark, i) => mark.classList.toggle('on', score >= thresholds[i]));
    },
  };
}
