// Controlla le regole non negoziabili del progetto (vedi CLAUDE.md).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const read = (file) => readFileSync(join(root, file), 'utf8');

// Tutti i file del gioco serviti al browser.
function gameFiles(dir = '') {
  const found = [];
  for (const name of readdirSync(join(root, dir))) {
    const path = join(dir, name);
    if (['node_modules', '.git', 'tests', 'tools', 'android-app', 'docs'].includes(name)) continue;
    if (statSync(join(root, path)).isDirectory()) found.push(...gameFiles(path));
    else if (/\.(html|css|js|webmanifest)$/.test(name)) found.push(path);
  }
  return found;
}

test('progetto: package.json non ha dipendenze', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.type, 'module');
  assert.ok(pkg.scripts.test);
  assert.equal(pkg.dependencies, undefined);
  assert.equal(pkg.devDependencies, undefined);
});

test('progetto: nessuna risorsa esterna nei file del gioco', () => {
  for (const file of gameFiles()) {
    const text = read(file).replaceAll('http://www.w3.org/2000/svg', '');
    assert.doesNotMatch(text, /https?:\/\//, `indirizzo esterno in ${file}`);
  }
});

test('progetto: nessun audio', () => {
  for (const file of gameFiles()) {
    assert.doesNotMatch(read(file), /<audio|AudioContext|new Audio\(/, `audio in ${file}`);
  }
});

test('progetto: i percorsi in index.html sono relativi', () => {
  assert.doesNotMatch(read('index.html'), /(src|href)="\//);
});

test('progetto: il motore non tocca il DOM', () => {
  for (const file of gameFiles('src/engine')) {
    assert.doesNotMatch(read(file), /\b(document|window|navigator|localStorage)\b/, `DOM in ${file}`);
  }
});
