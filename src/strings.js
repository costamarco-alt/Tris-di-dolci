// Tutti i testi dell'interfaccia (italiano).
export const STRINGS = {
  titolo: 'Tris di Dolci',
  sottotitolo: 'Allinea le caramelle. Niente pubblicità, niente vite: si gioca e basta.',

  // Menu
  gioca: 'Gioca',
  continua: (n) => `Continua dal livello ${n}`,
  impostazioni: 'Impostazioni',

  // Mappa
  livelli: 'Livelli',
  indietro: 'Indietro',
  tornaAlMenu: 'Torna al menu',
  tornaAllaMappa: 'Torna alla mappa',
  stelleTotali: (n, max) => `${n} / ${max}`,
  livelloBloccato: (n) => `Livello ${n}, bloccato`,
  livelloAperto: (n, stelle) => `Livello ${n}, ${stelle} stelle su 3`,

  // Partita
  livello: 'Livello',
  livelloN: (n) => `Livello ${n}`,
  mosse: 'Mosse',
  punti: 'Punti',
  tabellone: 'Tabellone di gioco',
  obiettivoPunti: (target) => `Arriva a ${target} punti`,
  obiettivoRaccogli: 'Raccogli',
  obiettivoGelatina: 'Gelatina da togliere',
  obiettivoGhiaccio: 'Ghiaccio da rompere',
  inizioPunti: (target, mosse) => `Fai almeno ${target} punti in ${mosse} mosse.`,
  inizioRaccogli: (mosse) => `Raccogli queste caramelle in ${mosse} mosse:`,
  inizioGelatina: (mosse) => `Togli tutta la gelatina in ${mosse} mosse.`,
  inizioGhiaccio: (mosse) => `Rompi tutto il ghiaccio in ${mosse} mosse.`,
  via: 'Via!',
  rimescolo: 'Rimescolo!',
  mosseAvanzate: (punti) => `Mosse avanzate: +${punti}`,

  // Fine livello
  vinto: 'Livello superato!',
  perso: 'Mosse finite',
  persoPunti: (mancanti) => `Ti mancavano ${mancanti} punti.`,
  persoObiettivo: 'Obiettivo non completato: c\'eri quasi!',
  punteggioFinale: (punti) => `Punteggio: ${punti}`,
  record: (punti) => `Il tuo record: ${punti}`,
  nuovoRecord: 'Nuovo record!',
  prossimo: 'Prossimo',
  riprova: 'Riprova',
  rigioca: 'Rigioca',
  mappa: 'Mappa',
  finito: 'Hai completato tutti i livelli. Complimenti!',
  stelle: (n) => `${n} stelle su 3`,

  // Impostazioni
  vibrazione: 'Vibrazione',
  vibrazioneNota: 'Una vibrazione breve su speciali e vittoria.',
  animazioniRidotte: 'Animazioni ridotte',
  animazioniRidotteNota: 'Movimenti più brevi e niente particelle.',
  azzera: 'Azzera progressi',
  azzeraDomanda: 'Vuoi davvero cancellare stelle e livelli sbloccati?',
  azzeraConferma: 'Sì, azzera',
  annulla: 'Annulla',
  azzerato: 'Progressi azzerati.',
  chiudi: 'Chiudi',

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
