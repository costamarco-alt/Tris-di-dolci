// Aggiorna in sw.js l'elenco dei file del gioco e il numero di versione.
//
//   node tools/versione.js
//
// Va lanciato ogni volta che cambia un file del gioco: la versione è calcolata
// dal contenuto dei file, così i telefoni capiscono che c'è un aggiornamento.
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SKIP = new Set(['node_modules', '.git', 'tests', 'tools', 'android-app', 'docs', 'sw.js', 'package.json']);
const EXTENSIONS = /\.(html|css|js|webmanifest|png|svg)$/;

// Tutti i file che il browser scarica per giocare (sw.js escluso).
export function gameFiles(dir = '') {
  const found = [];
  for (const name of readdirSync(join(ROOT, dir)).sort()) {
    if (name.startsWith('.') || SKIP.has(name)) continue;
    const path = dir ? `${dir}/${name}` : name;
    if (statSync(join(ROOT, path)).isDirectory()) found.push(...gameFiles(path));
    else if (EXTENSIONS.test(name)) found.push(path);
  }
  return found;
}

export function computeVersion(files = gameFiles()) {
  const hash = createHash('sha256');
  for (const file of files) {
    hash.update(file);
    hash.update(readFileSync(join(ROOT, file)));
  }
  return hash.digest('hex').slice(0, 12);
}

// Il blocco da scrivere in sw.js tra i due marcatori.
export function versionBlock() {
  const files = gameFiles();
  const list = ['./', ...files.map((file) => `./${file}`)];
  return (
    '// <versione>\n' +
    `const VERSION = '${computeVersion(files)}';\n` +
    `const FILES = [\n${list.map((file) => `  '${file}',`).join('\n')}\n];\n` +
    '// </versione>'
  );
}

export function currentBlock() {
  const text = readFileSync(join(ROOT, 'sw.js'), 'utf8');
  const match = text.match(/\/\/ <versione>[\s\S]*?\/\/ <\/versione>/);
  return match ? match[0] : null;
}

function main() {
  const path = join(ROOT, 'sw.js');
  const text = readFileSync(path, 'utf8');
  const block = versionBlock();
  if (currentBlock() === block) {
    console.log('sw.js è già aggiornato.');
    return;
  }
  writeFileSync(path, text.replace(/\/\/ <versione>[\s\S]*?\/\/ <\/versione>/, () => block));
  console.log(`sw.js aggiornato: versione ${computeVersion()}.`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
