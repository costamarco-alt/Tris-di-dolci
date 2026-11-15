// HUD in alto: livello, mosse rimaste, punteggio con barra delle stelle, obiettivo con contatore.
import { STRINGS } from '../strings.js';
import { el, icon } from './dom.js';
import { candySVG } from './pieces.js';

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
    const mark = icon('star', 'hud-star');
    bar.append(mark);
    return mark;
  });

  const goal = el('div', 'hud-goal');
  goal.setAttribute('aria-live', 'polite');
  root.append(top, bar, goal);

  let thresholds = [];
  let max = 1;
  let counters = []; // elementi dei contatori dell'obiettivo

  function chip(iconNode, text) {
    const node = el('span', 'goal-chip');
    const count = el('span', 'goal-count', text);
    node.append(iconNode, count);
    return { node, count };
  }

  return {
    setLevel(level) {
      levelValue.textContent = String(level.id);
      thresholds = level.stars ?? [];
      // La barra arriva un po' oltre la terza stella.
      max = (thresholds[2] ?? level.goal?.target ?? 1) * 1.08;
      marks.forEach((mark, i) => {
        mark.hidden = thresholds[i] === undefined;
        mark.style.left = `${Math.min(100, ((thresholds[i] ?? 0) / max) * 100)}%`;
      });

      // Obiettivo
      goal.textContent = '';
      counters = [];
      const type = level.goal?.type ?? 'score';
      if (type === 'score') {
        goal.append(el('span', 'goal-text', STRINGS.obiettivoPunti(level.goal?.target ?? 0)));
      } else if (type === 'collect') {
        goal.append(el('span', 'goal-text', STRINGS.obiettivoRaccogli));
        for (const item of level.goal.items) {
          const piece = el('span', 'goal-icon');
          piece.innerHTML = candySVG(item.color);
          const entry = chip(piece, '');
          counters.push(entry);
          goal.append(entry.node);
        }
      } else {
        const text = type === 'jelly' ? STRINGS.obiettivoGelatina : STRINGS.obiettivoGhiaccio;
        goal.append(el('span', 'goal-text', text));
        const entry = chip(el('span', `goal-icon goal-icon-${type}`), '');
        counters.push(entry);
        goal.append(entry.node);
      }
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

    // progress: quello restituito da getGoalProgress del motore.
    setGoal(progress) {
      if (progress.type === 'collect') {
        progress.items.forEach((item, i) => {
          if (!counters[i]) return;
          counters[i].count.textContent = `${item.current}/${item.count}`;
          counters[i].node.classList.toggle('done', item.done);
        });
      } else if (progress.type === 'jelly' || progress.type === 'ice') {
        if (!counters[0]) return;
        counters[0].count.textContent = String(progress.remaining);
        counters[0].node.classList.toggle('done', progress.done);
      }
    },
  };
}
