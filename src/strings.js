// Tutti i testi dell'interfaccia (italiano).
export const STRINGS = {
  titolo: 'Tris di Dolci',
  livello: 'Livello',
  mosse: 'Mosse',
  punti: 'Punti',
  obiettivo: 'Obiettivo',
  obiettivoPunti: (target) => `Arriva a ${target} punti`,
  rimescolo: 'Rimescolo!',
  vinto: 'Livello superato!',
  perso: 'Mosse finite',
  persoDettaglio: (mancanti) => `Ti mancavano ${mancanti} punti. Riprova!`,
  punteggioFinale: (punti) => `Punteggio: ${punti}`,
  riprova: 'Riprova',
  rigioca: 'Gioca ancora',
  tabellone: 'Tabellone di gioco',
  stelle: (n) => `${n} stelle su 3`,
  cascate: {
    2: 'Bene!',
    3: 'Gustoso!',
    4: 'Che bontà!',
    5: 'Spettacolo!',
  },
};

// Testo di incoraggiamento per la cascata numero n (da 2 in su).
export function cascadeText(n) {
  if (n < 2) return null;
  return STRINGS.cascate[Math.min(n, 5)];
}
