// Piccoli aiuti per creare elementi della pagina.

export function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function button(className, text, onClick) {
  const node = el('button', className, text);
  node.type = 'button';
  if (onClick) node.addEventListener('click', onClick);
  return node;
}

// Icone disegnate in codice (nessun file esterno).
const ICONS = {
  back: '<path d="M15 5 L8 12 L15 19" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>',
  gear:
    '<path fill="currentColor" fill-rule="evenodd" d="M10.3 2h3.4l.5 2.6 1.7.7 2.2-1.5 2.4 2.4-1.5 2.2.7 1.7 2.6.5v3.4l-2.6.5-.7 1.7 1.5 2.2-2.4 2.4-2.2-1.5-1.7.7-.5 2.6h-3.4l-.5-2.6-1.7-.7-2.2 1.5-2.4-2.4 1.5-2.2-.7-1.7L2 13.7v-3.4l2.6-.5.7-1.7-1.5-2.2 2.4-2.4 2.2 1.5 1.7-.7z M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z"/>',
  lock:
    '<path fill="currentColor" fill-rule="evenodd" d="M7 10V8a5 5 0 0 1 10 0v2h1.5a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19.5v-8A1.5 1.5 0 0 1 5.500 10z M9.500 10h5V8a2.500 2.500 0 0 0-5 0z"/>',
  star: '<path fill="currentColor" d="M12 2.5l2.9 6.1 6.6.9-4.8 4.6 1.2 6.600L12 17.500l-5.900 3.200 1.200-6.600L2.500 9.500l6.600-.9z"/>',
  hand:
    '<path fill="#fff" stroke="#5a2a4a" stroke-width="1.6" stroke-linejoin="round" d="M9 12V4.500a1.700 1.700 0 0 1 3.400 0V10l5.300 1.100a2.500 2.500 0 0 1 2 2.900l-.9 5a3 3 0 0 1-3 2.500h-4.300a3 3 0 0 1-2.400-1.200l-4.300-5.700a1.600 1.600 0 0 1 2.400-2.100z"/>',
};

export function icon(name, className = 'icon') {
  const span = el('span', className);
  span.setAttribute('aria-hidden', 'true');
  span.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" focusable="false">${ICONS[name]}</svg>`;
  return span;
}

// Tre stelle, di cui `count` accese.
export function starRow(count, className = 'stars') {
  const row = el('span', className);
  for (let i = 0; i < 3; i++) row.append(icon('star', i < count ? 'star on' : 'star'));
  return row;
}
