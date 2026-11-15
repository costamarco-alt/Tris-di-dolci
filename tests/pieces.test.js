import test from 'node:test';
import assert from 'node:assert/strict';
import { candySVG, pieceDefsSVG, PIECES } from '../src/ui/pieces.js';
import { cascadeText } from '../src/strings.js';

test('pieces: sei caramelle con nome, colori e forma diversi', () => {
  assert.equal(PIECES.length, 6);
  assert.equal(new Set(PIECES.map((p) => p.name)).size, 6);
  assert.equal(new Set(PIECES.map((p) => p.main)).size, 6);
  assert.equal(new Set(PIECES.map((p) => p.shape)).size, 6);
});

test('pieces: ogni caramella è un SVG completo che usa il suo gradiente', () => {
  for (let color = 0; color < 6; color++) {
    const svg = candySVG(color);
    assert.ok(svg.startsWith('<svg') && svg.endsWith('</svg>'));
    assert.ok(svg.includes(`url(#tdd-g${color})`));
    assert.ok(pieceDefsSVG().includes(`id="tdd-g${color}"`));
  }
  assert.throws(() => candySVG(6), /Colore/);
});

test('strings: testi delle cascate', () => {
  assert.equal(cascadeText(1), null);
  assert.equal(cascadeText(2), 'Bene!');
  assert.equal(cascadeText(3), 'Gustoso!');
  assert.equal(cascadeText(4), 'Che bontà!');
  assert.equal(cascadeText(5), 'Spettacolo!');
  assert.equal(cascadeText(9), 'Spettacolo!');
});
