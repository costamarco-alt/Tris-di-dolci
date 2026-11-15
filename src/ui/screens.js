// Schermate sopra la partita. Per ora: fine livello (vinto / perso).
import { STRINGS } from '../strings.js';

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function createScreens(overlay) {
  function hide() {
    overlay.hidden = true;
    overlay.textContent = '';
  }

  // result: { won, score, stars, target }
  function showEnd(result, onRetry) {
    overlay.textContent = '';
    const card = el('div', 'card');
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-modal', 'true');

    const title = el('h2', 'card-title', result.won ? STRINGS.vinto : STRINGS.perso);
    card.append(title);

    if (result.won) {
      const stars = el('div', 'card-stars');
      stars.setAttribute('aria-label', STRINGS.stelle(result.stars));
      for (let i = 0; i < 3; i++) {
        const star = el('span', i < result.stars ? 'card-star on' : 'card-star', '★');
        star.style.animationDelay = `${150 + i * 220}ms`;
        stars.append(star);
      }
      card.append(stars);
    }

    card.append(el('p', 'card-score', STRINGS.punteggioFinale(result.score)));
    if (!result.won) {
      card.append(el('p', 'card-text', STRINGS.persoDettaglio(Math.max(0, result.target - result.score))));
    }

    const button = el('button', 'button', result.won ? STRINGS.rigioca : STRINGS.riprova);
    button.type = 'button';
    button.addEventListener('click', () => {
      hide();
      onRetry();
    });
    card.append(button);

    overlay.append(card);
    overlay.hidden = false;
    button.focus({ preventScroll: true });
  }

  return { showEnd, hide };
}
