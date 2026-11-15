// Disegno e animazioni del tabellone.
// Non contiene regole di gioco: anima soltanto i passi restituiti dal motore.
import { CONFIG } from '../config.js';
import { cascadeText, STRINGS } from '../strings.js';
import { candySVG, pieceDefsSVG, PIECES } from './pieces.js';

const A = CONFIG.ANIM;

function el(className) {
  const node = document.createElement('div');
  node.className = className;
  return node;
}

const place = (r, c) => `translate(${c * 100}%, ${r * 100}%)`;

export function createRenderer(boardEl, options = {}) {
  const isReduced = options.isReducedMotion ?? (() => false);

  if (!document.getElementById('tdd-defs')) {
    const holder = document.createElement('div');
    holder.id = 'tdd-defs';
    holder.innerHTML = pieceDefsSVG();
    document.body.append(holder);
  }

  boardEl.textContent = '';
  const cellLayer = el('board-cells');
  const candyLayer = el('board-candies');
  const fxLayer = el('board-fx');
  boardEl.append(cellLayer, candyLayer, fxLayer);

  let rows = 8;
  let cols = 8;
  const items = new Map(); // id → { el, inner, r, c, color }

  const time = (ms) => (isReduced() ? ms * A.REDUCED_FACTOR : ms);

  // Avvia un'animazione e restituisce una promessa che si chiude quando finisce.
  function animate(node, keyframes, timing) {
    if (typeof node.animate !== 'function') return Promise.resolve();
    return node.animate(keyframes, timing).finished.catch(() => {});
  }

  function addCandy(candy, r, c) {
    const node = el('candy');
    const inner = el('candy-in');
    inner.innerHTML = candySVG(candy.color);
    node.append(inner);
    node.style.transform = place(r, c);
    candyLayer.append(node);
    const item = { el: node, inner, r, c, color: candy.color };
    items.set(candy.id, item);
    return item;
  }

  function itemAt(pos) {
    for (const item of items.values()) {
      if (item.r === pos.r && item.c === pos.c) return item;
    }
    return null;
  }

  // Ridisegna tutto il tabellone dallo stato del motore.
  function draw(state) {
    const { board } = state;
    rows = board.rows;
    cols = board.cols;
    boardEl.style.setProperty('--rows', rows);
    boardEl.style.setProperty('--cols', cols);
    cellLayer.textContent = '';
    candyLayer.textContent = '';
    fxLayer.textContent = '';
    items.clear();
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = board.cells[r][c];
        if (cell.hole) continue;
        const bg = el('cell');
        bg.style.transform = place(r, c);
        cellLayer.append(bg);
        if (cell.candy) addCandy(cell.candy, r, c);
      }
    }
  }

  function moveTo(item, r, c, duration, easing = 'ease-in-out') {
    const from = place(item.r, item.c);
    const to = place(r, c);
    item.r = r;
    item.c = c;
    item.el.style.transform = to;
    return animate(item.el, [{ transform: from }, { transform: to }], { duration, easing });
  }

  // Caduta con accelerazione e lieve rimbalzo.
  function dropTo(item, fromR, toR, c) {
    const from = place(fromR, c);
    const to = place(toR, c);
    item.r = toR;
    item.c = c;
    item.el.style.transform = to;
    const distance = Math.max(1, toR - fromR);
    const duration = time(Math.min(A.FALL_MAX, A.FALL_BASE + A.FALL_PER_CELL * distance));
    if (isReduced()) {
      return animate(item.el, [{ transform: from }, { transform: to }], { duration, easing: 'ease-in' });
    }
    return animate(
      item.el,
      [
        { transform: from, easing: 'cubic-bezier(0.45, 0, 0.9, 0.6)' },
        { transform: to, offset: 0.72, easing: 'ease-out' },
        { transform: `${to} translateY(-7%)`, offset: 0.86, easing: 'ease-in' },
        { transform: to },
      ],
      { duration }
    );
  }

  function floatText(text, className = '') {
    const node = el(`float-text ${className}`);
    node.textContent = text;
    fxLayer.append(node);
    const done = animate(
      node,
      [
        { transform: 'translateY(20%) scale(0.6)', opacity: 0 },
        { transform: 'translateY(0) scale(1.05)', opacity: 1, offset: 0.2 },
        { transform: 'translateY(-10%) scale(1)', opacity: 1, offset: 0.7 },
        { transform: 'translateY(-60%) scale(1)', opacity: 0 },
      ],
      { duration: A.CASCADE_TEXT, easing: 'ease-out' }
    );
    done.then(() => node.remove());
    return done;
  }

  function particles(cells) {
    if (isReduced() || cells.length === 0) return;
    const perCandy = Math.max(1, Math.min(CONFIG.PARTICLES_PER_CANDY, Math.floor(CONFIG.MAX_PARTICLES / cells.length)));
    const size = boardEl.clientWidth / cols;
    for (const cell of cells) {
      for (let i = 0; i < perCandy; i++) {
        const dot = el('particle');
        dot.style.left = `${((cell.c + 0.5) / cols) * 100}%`;
        dot.style.top = `${((cell.r + 0.5) / rows) * 100}%`;
        dot.style.background = PIECES[cell.color]?.main ?? '#fff';
        fxLayer.append(dot);
        const angle = (i / perCandy) * Math.PI * 2 + Math.random() * 1.2;
        const reach = size * (0.45 + Math.random() * 0.4);
        const dx = Math.cos(angle) * reach;
        const dy = Math.sin(angle) * reach;
        animate(
          dot,
          [
            { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
            { transform: `translate(calc(-50% + ${dx.toFixed(1)}px), calc(-50% + ${dy.toFixed(1)}px)) scale(0.2)`, opacity: 0 },
          ],
          { duration: A.CLEAR * 2, easing: 'ease-out' }
        ).then(() => dot.remove());
      }
    }
  }

  function playSwap(step) {
    const a = items.get(step.a.id);
    const b = items.get(step.b.id);
    if (!a || !b) return Promise.resolve();
    const posA = { r: a.r, c: a.c };
    const posB = { r: b.r, c: b.c };
    return Promise.all([
      moveTo(a, posB.r, posB.c, time(A.SWAP)),
      moveTo(b, posA.r, posA.c, time(A.SWAP)),
    ]);
  }

  function playClear(step) {
    particles(step.cells);
    const jobs = [];
    for (const cell of step.cells) {
      const item = items.get(cell.id);
      if (!item) continue;
      items.delete(cell.id);
      jobs.push(
        animate(
          item.inner,
          [
            { transform: 'scale(1)', opacity: 1 },
            { transform: 'scale(1.15)', opacity: 1, offset: 0.3 },
            { transform: 'scale(0)', opacity: 0 },
          ],
          { duration: time(A.CLEAR), easing: 'ease-in', fill: 'forwards' }
        ).then(() => item.el.remove())
      );
    }
    return Promise.all(jobs);
  }

  function playFalls(fall, spawn) {
    const jobs = [];
    if (fall) {
      for (const move of fall.moves) {
        const item = items.get(move.id);
        if (item) jobs.push(dropTo(item, move.from.r, move.to.r, move.to.c));
      }
    }
    if (spawn) {
      for (const candy of spawn.candies) {
        const item = addCandy(candy, candy.from.r, candy.from.c);
        jobs.push(dropTo(item, candy.from.r, candy.to.r, candy.to.c));
      }
    }
    return Promise.all(jobs);
  }

  function playShuffle(step) {
    floatText(STRINGS.rimescolo, 'float-text-shuffle');
    const jobs = [];
    for (const candy of step.candies) {
      const item = items.get(candy.id);
      if (!item) continue;
      if (item.color !== candy.color) {
        item.color = candy.color;
        item.inner.innerHTML = candySVG(candy.color);
      }
      jobs.push(moveTo(item, candy.to.r, candy.to.c, time(A.SHUFFLE)));
    }
    return Promise.all(jobs);
  }

  // Anima in ordine i passi restituiti dal motore.
  // onStep(step) viene chiamato quando inizia ogni passo (serve all'HUD).
  async function play(steps, onStep) {
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      onStep?.(step);
      switch (step.type) {
        case 'swap':
        case 'swapBack':
          await playSwap(step);
          break;
        case 'cascade': {
          const text = cascadeText(step.n);
          if (text) floatText(text);
          break;
        }
        case 'clear':
          await playClear(step);
          break;
        case 'fall': {
          // Caduta e arrivo delle nuove caramelle si animano insieme.
          const next = steps[i + 1];
          if (next && next.type === 'spawn') {
            onStep?.(next);
            i++;
            await playFalls(step, next);
          } else {
            await playFalls(step, null);
          }
          break;
        }
        case 'spawn':
          await playFalls(null, step);
          break;
        case 'shuffle':
          await playShuffle(step);
          break;
        default:
          break; // passi che l'interfaccia non conosce ancora
      }
    }
  }

  function setSelected(pos) {
    for (const item of items.values()) item.el.classList.remove('selected');
    if (pos) itemAt(pos)?.el.classList.add('selected');
  }

  function showHint(move) {
    clearHint();
    if (!move) return;
    itemAt(move.from)?.el.classList.add('hint');
    itemAt(move.to)?.el.classList.add('hint');
  }

  function clearHint() {
    for (const item of items.values()) item.el.classList.remove('hint');
  }

  // Coordinate dello schermo → casella del tabellone.
  function cellFromPoint(x, y) {
    const rect = boardEl.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    const c = Math.floor(((x - rect.left) / rect.width) * cols);
    const r = Math.floor(((y - rect.top) / rect.height) * rows);
    if (r < 0 || c < 0 || r >= rows || c >= cols) return null;
    return { r, c };
  }

  const cellSize = () => boardEl.getBoundingClientRect().width / cols;

  return { draw, play, setSelected, showHint, clearHint, cellFromPoint, cellSize, floatText };
}
