export const WORD_LENGTH = 5;
export const MAX_ATTEMPTS = 6;

export const WORDS = [
  "TABLE", "CHIEN", "PORTE", "PLAGE", "MONDE", "DANSE", "FLEUR", "VOILE",
  "PLUME", "ROBOT", "LIVRE", "VERRE", "SUCRE", "GLACE", "PLUIE", "NUAGE",
  "JAUNE", "ROUGE", "RADIO", "PHOTO", "CHIOT", "CANAL", "CADRE", "TIGRE",
  "LOUVE", "SOURD", "LOURD", "CLAIR", "NOBLE", "VIEUX", "JEUNE", "FORCE",
  "CHOSE", "BLANC", "CALME", "FORTE", "DOUCE", "RONDE", "LARGE", "HAUTE",
  "BASSE", "CHOUX", "FRAIS", "PRISE", "CHUTE", "ROUTE", "TRAIN", "AVION",
  "CHAMP", "PONEY", "LAPIN", "POULE", "VACHE", "SINGE", "POMME", "POIRE",
  "LAMPE", "TAPIS", "STYLO", "GOMME", "JAMBE", "DOIGT", "COEUR", "GENOU",
  "AMOUR", "DOUTE", "NEIGE", "ORAGE", "TERRE", "MATIN", "HEURE", "AIMER",
  "JOUER", "VIVRE", "VENIR", "FILLE", "TANTE", "ONCLE", "JOUET", "BALLE",
  "ARBRE", "VESTE", "TASSE", "BLEUE", "SOEUR", "GRAND", "PETIT",
];

export function randomWord(): string {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

export type LetterStatus = "correct" | "present" | "absent";

export function evaluateGuess(guess: string, answer: string): LetterStatus[] {
  const result: LetterStatus[] = Array(WORD_LENGTH).fill("absent");
  const remaining: Record<string, number> = {};

  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guess[i] === answer[i]) {
      result[i] = "correct";
    } else {
      remaining[answer[i]] = (remaining[answer[i]] ?? 0) + 1;
    }
  }
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (result[i] === "correct") continue;
    const letter = guess[i];
    if (remaining[letter] > 0) {
      result[i] = "present";
      remaining[letter]--;
    }
  }
  return result;
}

export function keyboardStatuses(
  guesses: { word: string }[],
  answer: string
): Record<string, LetterStatus> {
  const priority: Record<LetterStatus, number> = { absent: 0, present: 1, correct: 2 };
  const map: Record<string, LetterStatus> = {};
  for (const g of guesses) {
    const statuses = evaluateGuess(g.word, answer);
    for (let i = 0; i < g.word.length; i++) {
      const letter = g.word[i];
      const status = statuses[i];
      if (!map[letter] || priority[status] > priority[map[letter]]) {
        map[letter] = status;
      }
    }
  }
  return map;
}
