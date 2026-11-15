// Comandi: swipe e tocca-tocca, con i Pointer Events.

// options:
//   getCell(x, y)   → { r, c } oppure null (coordinate dello schermo → casella)
//   getCellSize()   → lato di una casella in pixel
//   canInput()      → false mentre girano le animazioni
//   canSelect(pos)  → la casella si può scegliere? (non un buco, non ghiacciata…)
//   onSwap(a, b)    → il giocatore chiede di scambiare due caselle adiacenti
//   onSelect(pos)   → casella selezionata con un tocco (null = nessuna)
//   onActivity()    → il giocatore ha toccato lo schermo (azzera il suggerimento)
//   threshold       → frazione della casella oltre cui parte lo swipe
export function attachInput(boardEl, options) {
  const threshold = options.threshold ?? 0.3;
  let selected = null; // casella scelta con il primo tocco
  let drag = null; // gesto in corso: { id, start, x, y, swiped }

  const same = (a, b) => a && b && a.r === b.r && a.c === b.c;
  const adjacent = (a, b) => Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1;

  function select(pos) {
    selected = pos;
    options.onSelect?.(pos);
  }

  function onDown(event) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    options.onActivity?.();
    if (drag || !options.canInput()) return;
    const cell = options.getCell(event.clientX, event.clientY);
    if (!cell || !options.canSelect(cell)) {
      select(null);
      return;
    }
    drag = { id: event.pointerId, start: cell, x: event.clientX, y: event.clientY, swiped: false };
    try {
      boardEl.setPointerCapture(event.pointerId);
    } catch {
      // alcuni browser non lo permettono: lo swipe funziona lo stesso dentro il tabellone
    }
    event.preventDefault();
  }

  function onMove(event) {
    if (!drag || drag.swiped || event.pointerId !== drag.id) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    const limit = options.getCellSize() * threshold;
    if (Math.abs(dx) < limit && Math.abs(dy) < limit) return;
    drag.swiped = true;
    const horizontal = Math.abs(dx) > Math.abs(dy);
    const target = {
      r: drag.start.r + (horizontal ? 0 : Math.sign(dy)),
      c: drag.start.c + (horizontal ? Math.sign(dx) : 0),
    };
    select(null);
    if (options.canInput()) options.onSwap(drag.start, target);
  }

  function onUp(event) {
    if (!drag || event.pointerId !== drag.id) return;
    const { start, swiped } = drag;
    drag = null;
    if (swiped || !options.canInput()) return;
    // Nessuno swipe: è un tocco.
    if (selected && same(selected, start)) {
      select(null);
    } else if (selected && adjacent(selected, start)) {
      const from = selected;
      select(null);
      options.onSwap(from, start);
    } else {
      select(start);
    }
  }

  function onCancel(event) {
    if (drag && event.pointerId === drag.id) drag = null;
  }

  boardEl.addEventListener('pointerdown', onDown);
  boardEl.addEventListener('pointermove', onMove);
  boardEl.addEventListener('pointerup', onUp);
  boardEl.addEventListener('pointercancel', onCancel);
  boardEl.addEventListener('contextmenu', (event) => event.preventDefault());

  return {
    clearSelection: () => select(null),
  };
}
