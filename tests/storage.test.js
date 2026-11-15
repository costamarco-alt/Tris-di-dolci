import test from 'node:test';
import assert from 'node:assert/strict';
import { createStorage, defaultData, STORAGE_KEY } from '../src/storage.js';

function fakeBackend(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    map,
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
  };
}

test('storage: senza dati si parte dal livello 1 con le impostazioni di base', () => {
  const storage = createStorage(fakeBackend());
  assert.deepEqual(storage.getData(), defaultData());
  assert.equal(storage.isUnlocked(1), true);
  assert.equal(storage.isUnlocked(2), false);
  assert.equal(storage.totalStars(), 0);
  assert.deepEqual(storage.getLevel(5), { stars: 0, best: 0 });
});

test('storage: una vittoria salva stelle e record e sblocca il livello dopo', () => {
  const backend = fakeBackend();
  const storage = createStorage(backend);
  storage.recordWin(1, 2, 4000, 30);
  assert.equal(storage.isUnlocked(2), true);
  assert.deepEqual(storage.getLevel(1), { stars: 2, best: 4000 });
  assert.equal(storage.totalStars(), 2);
  const again = createStorage(backend);
  assert.deepEqual(again.getLevel(1), { stars: 2, best: 4000 });
  assert.equal(again.getData().unlocked, 2);
  assert.ok(backend.map.has(STORAGE_KEY));
});

test('storage: si tiene sempre il risultato migliore', () => {
  const storage = createStorage(fakeBackend());
  storage.recordWin(1, 3, 9000, 30);
  storage.recordWin(1, 1, 12000, 30);
  assert.deepEqual(storage.getLevel(1), { stars: 3, best: 12000 });
  storage.recordWin(1, 2, 100, 30);
  assert.deepEqual(storage.getLevel(1), { stars: 3, best: 12000 });
});

test('storage: l\'ultimo livello non sblocca un livello che non esiste', () => {
  const storage = createStorage(fakeBackend());
  storage.recordWin(30, 1, 100, 30);
  assert.equal(storage.getData().unlocked, 30);
  storage.recordWin(3, 1, 100, 30);
  assert.equal(storage.getData().unlocked, 30, 'rigiocare un livello vecchio non blocca quelli dopo');
});

test('storage: impostazioni salvate e ricaricate', () => {
  const backend = fakeBackend();
  const storage = createStorage(backend);
  storage.setSetting('vibration', false);
  storage.setSetting('reducedMotion', true);
  storage.setSetting('inesistente', true);
  assert.deepEqual(createStorage(backend).getSettings(), { vibration: false, reducedMotion: true });
});

test('storage: azzerare i progressi lascia le impostazioni', () => {
  const backend = fakeBackend();
  const storage = createStorage(backend);
  storage.recordWin(1, 3, 5000, 30);
  storage.setSetting('vibration', false);
  storage.resetProgress();
  assert.equal(storage.getData().unlocked, 1);
  assert.deepEqual(storage.getData().levels, {});
  assert.equal(storage.getSettings().vibration, false);
  assert.equal(createStorage(backend).getData().unlocked, 1);
});

test('storage: dati rovinati o strani non rompono il gioco', () => {
  for (const text of ['{non è json', 'null', '42', '{"unlocked":-3,"levels":{"1":{"stars":99,"best":"x"},"2":null},"settings":{"vibration":"sì"}}']) {
    const storage = createStorage(fakeBackend({ [STORAGE_KEY]: text }));
    assert.equal(storage.getData().unlocked, 1);
    assert.equal(storage.getSettings().vibration, true);
    assert.ok(storage.getLevel(1).stars <= 3);
  }
});

test('storage: se il salvataggio non funziona il gioco va avanti lo stesso', () => {
  const broken = {
    getItem() { throw new Error('bloccato'); },
    setItem() { throw new Error('pieno'); },
  };
  const storage = createStorage(broken);
  assert.doesNotThrow(() => storage.recordWin(1, 2, 100, 30));
  assert.doesNotThrow(() => storage.setSetting('vibration', false));
  assert.doesNotThrow(() => storage.resetProgress());
  assert.equal(storage.getData().unlocked, 1);
  const none = createStorage(null);
  none.recordWin(1, 1, 10, 30);
  assert.equal(none.isUnlocked(2), true, 'senza localStorage i progressi valgono per la sessione');
});
