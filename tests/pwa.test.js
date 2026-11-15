import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { computeVersion, currentBlock, gameFiles, versionBlock } from '../tools/versione.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const read = (file) => readFileSync(root + file);

// Larghezza e altezza di un PNG, lette dall'intestazione del file.
function pngSize(file) {
  const data = read(file);
  assert.equal(data.toString('ascii', 1, 4), 'PNG', `${file} non è un PNG`);
  return `${data.readUInt32BE(16)}x${data.readUInt32BE(20)}`;
}

test('pwa: il manifest ha nome, colori, orientamento verticale e percorsi relativi', () => {
  const manifest = JSON.parse(read('manifest.webmanifest').toString());
  assert.equal(manifest.name, 'Tris di Dolci');
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.orientation, 'portrait');
  assert.equal(manifest.start_url, './');
  assert.equal(manifest.scope, './');
  assert.match(manifest.theme_color, /^#[0-9a-f]{6}$/);
  assert.match(manifest.background_color, /^#[0-9a-f]{6}$/);
  for (const icon of manifest.icons) {
    assert.ok(icon.src.startsWith('./'), 'percorso relativo');
    assert.equal(icon.type, 'image/png');
    assert.equal(pngSize(icon.src.slice(2)), icon.sizes, `dimensioni di ${icon.src}`);
  }
  const sizes = manifest.icons.map((icon) => icon.sizes);
  assert.ok(sizes.includes('192x192') && sizes.includes('512x512'));
  assert.ok(manifest.icons.some((icon) => icon.purpose === 'maskable'));
});

test('pwa: index.html collega manifest e icone con percorsi relativi', () => {
  const html = read('index.html').toString();
  assert.match(html, /<link rel="manifest" href="\.\/manifest\.webmanifest">/);
  assert.match(html, /<link rel="apple-touch-icon" href="\.\/icons\/apple-touch-icon\.png">/);
  assert.equal(pngSize('icons/apple-touch-icon.png'), '180x180');
  assert.match(html, /id="loading"/);
  assert.match(html, /id="update-banner"/);
});

test('pwa: sw.js è aggiornato (se fallisce: lancia "node tools/versione.js")', () => {
  assert.equal(currentBlock(), versionBlock(), 'sw.js non è aggiornato: lancia "node tools/versione.js"');
});

test('pwa: la cache offline contiene tutti i file del gioco', () => {
  const files = gameFiles();
  for (const needed of ['index.html', 'styles.css', 'manifest.webmanifest', 'src/main.js', 'src/engine/game.js', 'src/ui/render.js', 'src/levels/levels.js', 'icons/icon-192.png']) {
    assert.ok(files.includes(needed), `manca ${needed}`);
  }
  assert.ok(!files.includes('sw.js'));
  assert.ok(files.every((file) => !file.startsWith('tests/') && !file.startsWith('tools/')));
  for (const file of files) assert.ok(existsSync(root + file));
  // Ogni modulo importato dal gioco deve essere nell'elenco, altrimenti offline non parte.
  for (const file of files.filter((name) => name.endsWith('.js'))) {
    const dir = file.split('/').slice(0, -1);
    for (const match of read(file).toString().matchAll(/from '(\.[^']+)'/g)) {
      const parts = [...dir];
      for (const piece of match[1].split('/')) {
        if (piece === '..') parts.pop();
        else if (piece !== '.') parts.push(piece);
      }
      assert.ok(files.includes(parts.join('/')), `${file} importa ${match[1]} che non è in cache`);
    }
  }
});

test('pwa: la versione cambia quando cambia l\'elenco dei file', () => {
  const files = gameFiles();
  assert.match(computeVersion(files), /^[0-9a-f]{12}$/);
  assert.equal(computeVersion(files), computeVersion(files));
  assert.notEqual(computeVersion(files), computeVersion(files.slice(1)));
});

test('pwa: il service worker non scarica niente da fuori e aspetta il tocco per aggiornarsi', () => {
  const sw = read('sw.js').toString();
  assert.match(sw, /origin !== self\.location\.origin/);
  assert.match(sw, /event\.data === 'aggiorna'/);
  const install = sw.slice(sw.indexOf("addEventListener('install'"), sw.indexOf("addEventListener('activate'"));
  assert.ok(!install.includes('skipWaiting'), 'la versione nuova non si attiva da sola');
});
