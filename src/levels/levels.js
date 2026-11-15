// Definizione dei livelli (solo dati). Il formato è descritto in CLAUDE.md.
export const LEVELS = [
  {
    id: 1,
    moves: 25,
    colors: 5,
    goal: { type: 'score', target: 3000 },
    stars: [3000, 5000, 7500],
  },
];

export function getLevel(id) {
  return LEVELS.find((level) => level.id === id) ?? LEVELS[0];
}
