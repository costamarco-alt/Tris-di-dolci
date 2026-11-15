// Salvataggio dei progressi in localStorage. Tutto in try/catch:
// se il salvataggio non funziona, il gioco va avanti lo stesso.

export const STORAGE_KEY = 'trisdidolci.v1';

export function defaultData() {
  return {
    unlocked: 1, // livello massimo sbloccato
    levels: {}, // id → { stars, best }
    settings: { vibration: true, reducedMotion: false },
  };
}

// Ripulisce i dati letti: qualunque cosa strana torna al valore di partenza.
function sanitize(raw) {
  const data = defaultData();
  if (!raw || typeof raw !== 'object') return data;
  if (Number.isInteger(raw.unlocked) && raw.unlocked >= 1) data.unlocked = raw.unlocked;
  if (raw.levels && typeof raw.levels === 'object') {
    for (const [id, entry] of Object.entries(raw.levels)) {
      if (!entry || typeof entry !== 'object') continue;
      const stars = Number.isInteger(entry.stars) ? Math.max(0, Math.min(3, entry.stars)) : 0;
      const best = Number.isFinite(entry.best) ? Math.max(0, entry.best) : 0;
      data.levels[id] = { stars, best };
    }
  }
  if (raw.settings && typeof raw.settings === 'object') {
    for (const key of Object.keys(data.settings)) {
      if (typeof raw.settings[key] === 'boolean') data.settings[key] = raw.settings[key];
    }
  }
  return data;
}

function defaultBackend() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function createStorage(backend = defaultBackend()) {
  let data = defaultData();

  function load() {
    try {
      const text = backend?.getItem(STORAGE_KEY);
      data = sanitize(text ? JSON.parse(text) : null);
    } catch {
      data = defaultData();
    }
    return data;
  }

  function save() {
    try {
      backend?.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch {
      return false;
    }
  }

  load();

  return {
    getData: () => data,
    getSettings: () => data.settings,
    getLevel: (id) => data.levels[id] ?? { stars: 0, best: 0 },
    isUnlocked: (id) => id <= data.unlocked,
    totalStars: () => Object.values(data.levels).reduce((sum, entry) => sum + entry.stars, 0),

    // Registra un livello vinto: tiene il meglio di stelle e punteggio, sblocca il successivo.
    recordWin(id, stars, score, levelCount) {
      const previous = data.levels[id] ?? { stars: 0, best: 0 };
      data.levels[id] = { stars: Math.max(previous.stars, stars), best: Math.max(previous.best, score) };
      data.unlocked = Math.max(data.unlocked, Math.min(levelCount, id + 1));
      save();
      return data.levels[id];
    },

    setSetting(key, value) {
      if (!(key in data.settings)) return;
      data.settings[key] = Boolean(value);
      save();
    },

    // Azzera i progressi; le impostazioni restano.
    resetProgress() {
      const settings = data.settings;
      data = defaultData();
      data.settings = settings;
      save();
    },
  };
}
