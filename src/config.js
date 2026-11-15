// Costanti del gioco: punteggi, tempi delle animazioni, dimensioni.
export const CONFIG = {
  // Tabellone
  DEFAULT_ROWS: 8,
  DEFAULT_COLS: 8,
  MAX_SIZE: 9,
  MIN_COLORS: 3,
  MAX_COLORS: 6,
  DEFAULT_COLORS: 5,

  // Punteggio
  SCORE_PER_CANDY: 10,
  SPECIAL_BONUS: { rocket: 60, bomb: 120, rainbow: 200 },
  LEFTOVER_MOVE_BONUS: 150,

  // Tentativi massimi per generazione e rimescolo
  MAX_GENERATION_ATTEMPTS: 200,
  MAX_SHUFFLE_ATTEMPTS: 200,

  // Animazioni (millisecondi)
  ANIM: {
    SWAP: 150,
    CLEAR: 200,
    FALL_PER_CELL: 70,
    HINT_DELAY: 5000,
  },
};
