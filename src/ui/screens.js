// Schermate: menu, mappa dei livelli, inizio e fine livello, impostazioni.
import { STRINGS } from '../strings.js';
import { button, el, icon, starRow } from './dom.js';
import { candySVG } from './pieces.js';

// roots:   { menu, map, game, overlay } elementi della pagina
// actions: { onPlay, onOpenLevel, onSettings, onMenu }
export function createScreens(roots, actions) {
  const { overlay } = roots;
  const screens = { menu: roots.menu, map: roots.map, game: roots.game };

  function show(name) {
    for (const [key, node] of Object.entries(screens)) node.hidden = key !== name;
    hideOverlay();
  }

  function hideOverlay() {
    overlay.hidden = true;
    overlay.textContent = '';
  }

  function openCard(extraClass = '') {
    overlay.textContent = '';
    const card = el('div', `card ${extraClass}`.trim());
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-modal', 'true');
    overlay.append(card);
    overlay.hidden = false;
    return card;
  }

  // ---------- Menu iniziale ----------

  function showMenu({ unlocked, hasProgress }) {
    const root = screens.menu;
    root.textContent = '';
    const candies = el('div', 'menu-candies');
    candies.setAttribute('aria-hidden', 'true');
    for (const color of [0, 2, 4, 1, 3, 5]) {
      const piece = el('span', 'menu-candy');
      piece.innerHTML = candySVG(color);
      candies.append(piece);
    }
    const play = button('button button-big', hasProgress ? STRINGS.continua(unlocked) : STRINGS.gioca, actions.onPlay);
    const settings = button('button button-soft', STRINGS.impostazioni, actions.onSettings);
    root.append(
      candies,
      el('h1', 'menu-title', STRINGS.titolo),
      el('p', 'menu-text', STRINGS.sottotitolo),
      play,
      settings
    );
    show('menu');
  }

  // ---------- Mappa dei livelli ----------

  // levels: [{ id, unlocked, stars }], current: livello su cui portare la vista
  function showMap({ levels, current, totalStars }) {
    const root = screens.map;
    root.textContent = '';

    const header = el('header', 'bar');
    const back = button('icon-button', undefined, actions.onMenu);
    back.setAttribute('aria-label', STRINGS.tornaAlMenu);
    back.append(icon('back'));
    const total = el('div', 'map-total');
    total.append(icon('star', 'star on'), el('span', '', STRINGS.stelleTotali(totalStars, levels.length * 3)));
    header.append(back, el('h1', 'bar-title', STRINGS.livelli), total);

    const scroller = el('div', 'map-scroll');
    const path = el('div', 'map-path');
    const STEP = 92; // distanza verticale tra due livelli
    const WIDTH = 300;
    const xOf = (i) => WIDTH / 2 + Math.sin(i * 0.95) * 92;
    const yOf = (i) => STEP / 2 + i * STEP;
    const height = levels.length * STEP;
    path.style.height = `${height}px`;

    // Il sentiero tratteggiato che unisce i livelli.
    let d = '';
    levels.forEach((_, i) => {
      if (i === 0) d += `M${xOf(0).toFixed(1)} ${yOf(0)}`;
      else {
        const midY = (yOf(i - 1) + yOf(i)) / 2;
        d += ` C${xOf(i - 1).toFixed(1)} ${midY} ${xOf(i).toFixed(1)} ${midY} ${xOf(i).toFixed(1)} ${yOf(i)}`;
      }
    });
    const trail = el('div', 'map-trail');
    trail.setAttribute('aria-hidden', 'true');
    trail.innerHTML =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${height}" preserveAspectRatio="none" focusable="false">` +
      `<path d="${d}" fill="none" stroke="#fff" stroke-opacity="0.85" stroke-width="7" stroke-linecap="round" stroke-dasharray="1 15" vector-effect="non-scaling-stroke"/></svg>`;
    path.append(trail);

    let currentNode = null;
    levels.forEach((level, i) => {
      const node = button('map-node', undefined, level.unlocked ? () => actions.onOpenLevel(level.id) : undefined);
      node.style.left = `${(xOf(i) / WIDTH) * 100}%`;
      node.style.top = `${yOf(i)}px`;
      if (level.unlocked) {
        node.append(el('span', 'map-number', String(level.id)), starRow(level.stars, 'stars map-stars'));
        node.setAttribute('aria-label', STRINGS.livelloAperto(level.id, level.stars));
        if (level.id === current) {
          node.classList.add('current');
          currentNode = node;
        }
        if (level.stars > 0) node.classList.add('done');
      } else {
        node.classList.add('locked');
        node.disabled = true;
        node.append(icon('lock', 'icon map-lock'));
        node.setAttribute('aria-label', STRINGS.livelloBloccato(level.id));
      }
      path.append(node);
    });

    scroller.append(path);
    root.append(header, scroller);
    show('map');
    if (currentNode) {
      scroller.scrollTop = Math.max(0, currentNode.offsetTop - scroller.clientHeight / 2);
    }
  }

  // ---------- Inizio livello ----------

  function showStart(level, onStart) {
    const card = openCard();
    card.append(el('h2', 'card-title', STRINGS.livelloN(level.id)));
    const goal = level.goal ?? { type: 'score', target: 0 };
    if (goal.type === 'collect') {
      card.append(el('p', 'card-text', STRINGS.inizioRaccogli(level.moves)));
      const list = el('div', 'card-goals');
      for (const item of goal.items) {
        const chip = el('span', 'goal-chip');
        const piece = el('span', 'goal-icon');
        piece.innerHTML = candySVG(item.color);
        chip.append(piece, el('span', 'goal-count', `× ${item.count}`));
        list.append(chip);
      }
      card.append(list);
    } else {
      const text =
        goal.type === 'jelly'
          ? STRINGS.inizioGelatina(level.moves)
          : goal.type === 'ice'
            ? STRINGS.inizioGhiaccio(level.moves)
            : STRINGS.inizioPunti(goal.target, level.moves);
      card.append(el('p', 'card-text', text));
    }
    if (level.tip) card.append(el('p', 'card-tip', level.tip));
    const go = button('button', STRINGS.via, () => {
      hideOverlay();
      onStart();
    });
    card.append(go);
    go.focus({ preventScroll: true });
  }

  // ---------- Fine livello ----------

  // result: { won, score, stars, best, isRecord, missing, hasNext, goalType }
  // handlers: { onNext, onRetry, onMap }
  function showEnd(result, handlers) {
    const card = openCard();
    card.append(el('h2', 'card-title', result.won ? STRINGS.vinto : STRINGS.perso));

    if (result.won) {
      const stars = starRow(result.stars, 'stars card-stars');
      stars.setAttribute('role', 'img');
      stars.setAttribute('aria-label', STRINGS.stelle(result.stars));
      [...stars.children].forEach((star, i) => {
        star.style.animationDelay = `${150 + i * 220}ms`;
      });
      card.append(stars);
    }

    card.append(el('p', 'card-score', STRINGS.punteggioFinale(result.score)));
    if (result.won) {
      card.append(el('p', 'card-text', result.isRecord ? STRINGS.nuovoRecord : STRINGS.record(result.best)));
      if (!result.hasNext) card.append(el('p', 'card-tip', STRINGS.finito));
    } else {
      const text = result.goalType === 'score' ? STRINGS.persoPunti(result.missing) : STRINGS.persoObiettivo;
      card.append(el('p', 'card-text', text));
    }

    const close = (handler) => () => {
      hideOverlay();
      handler();
    };
    const buttons = el('div', 'card-buttons');
    let main;
    if (result.won && result.hasNext) {
      main = button('button', STRINGS.prossimo, close(handlers.onNext));
      buttons.append(main, button('button button-soft', STRINGS.rigioca, close(handlers.onRetry)));
    } else {
      main = button('button', result.won ? STRINGS.rigioca : STRINGS.riprova, close(handlers.onRetry));
      buttons.append(main);
    }
    buttons.append(button('button button-soft', STRINGS.mappa, close(handlers.onMap)));
    card.append(buttons);
    main.focus({ preventScroll: true });
  }

  // ---------- Impostazioni ----------

  // settings: { vibration, reducedMotion }
  // handlers: { onChange(key, value), onReset(), onClose() }
  function showSettings(settings, handlers) {
    const card = openCard('card-settings');
    card.append(el('h2', 'card-title', STRINGS.impostazioni));

    function toggle(key, label, note) {
      const row = button('switch-row');
      row.setAttribute('role', 'switch');
      const text = el('span', 'switch-text');
      text.append(el('span', 'switch-label', label), el('span', 'switch-note', note));
      const knob = el('span', 'switch');
      row.append(text, knob);
      const paint = () => row.setAttribute('aria-checked', String(settings[key]));
      paint();
      row.addEventListener('click', () => {
        settings[key] = !settings[key];
        paint();
        handlers.onChange(key, settings[key]);
      });
      return row;
    }

    card.append(
      toggle('vibration', STRINGS.vibrazione, STRINGS.vibrazioneNota),
      toggle('reducedMotion', STRINGS.animazioniRidotte, STRINGS.animazioniRidotteNota)
    );

    // Azzera progressi: la conferma si chiede qui dentro, senza finestre del browser.
    const resetBox = el('div', 'reset-box');
    function drawReset(message) {
      resetBox.textContent = '';
      if (message) resetBox.append(el('p', 'card-text', message));
      resetBox.append(button('button button-soft button-danger', STRINGS.azzera, drawConfirm));
    }
    function drawConfirm() {
      resetBox.textContent = '';
      const question = el('p', 'card-text', STRINGS.azzeraDomanda);
      const row = el('div', 'card-buttons card-buttons-row');
      const cancel = button('button button-soft', STRINGS.annulla, () => drawReset());
      const confirm = button('button button-danger', STRINGS.azzeraConferma, () => {
        handlers.onReset();
        drawReset(STRINGS.azzerato);
      });
      row.append(cancel, confirm);
      resetBox.append(question, row);
      cancel.focus({ preventScroll: true });
    }
    drawReset();
    card.append(resetBox);

    const close = button('button', STRINGS.chiudi, () => {
      hideOverlay();
      handlers.onClose?.();
    });
    card.append(close);
    close.focus({ preventScroll: true });
  }

  return { show, showMenu, showMap, showStart, showEnd, showSettings, hideOverlay };
}
