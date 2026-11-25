const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

/**
 * Normalise un code saisi à la main : majuscules, tirets et espaces tolérés,
 * préfixe « NOUS » facultatif. Renvoie null si le code ne peut pas être valide.
 */
export function normalizeInviteCode(input: string): string | null {
  let raw = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (raw.startsWith("NOUS")) raw = raw.slice(4);
  if (raw.length !== 8) return null;
  for (const ch of raw) if (!ALPHABET.includes(ch)) return null;
  return `NOUS-${raw.slice(0, 4)}-${raw.slice(4)}`;
}
