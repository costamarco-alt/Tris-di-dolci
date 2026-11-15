// Generatore casuale con seed (mulberry32): stesso seed, stessa partita.

export function createRng(seed = 1) {
  let s = seed >>> 0;

  function next() {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // Intero tra 0 (compreso) e n (escluso).
  function int(n) {
    return Math.floor(next() * n);
  }

  function pick(list) {
    return list[int(list.length)];
  }

  // Mescola la lista sul posto (Fisher–Yates) e la restituisce.
  function shuffle(list) {
    for (let i = list.length - 1; i > 0; i--) {
      const j = int(i + 1);
      const tmp = list[i];
      list[i] = list[j];
      list[j] = tmp;
    }
    return list;
  }

  return {
    next,
    int,
    pick,
    shuffle,
    getState: () => s,
    setState: (value) => {
      s = value >>> 0;
    },
  };
}
