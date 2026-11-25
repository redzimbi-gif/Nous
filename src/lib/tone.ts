// Teintes des avatars et des bulles. Les couleurs d'identité historiques
// (blush, sky, mint, amber, violet) sont rattachées à une teinte du nouveau visuel.
export type Tone = "lilac" | "rose" | "sun" | "mint" | "sky" | "peach";

const FROM_IDENTITY: Record<string, Tone> = {
  blush: "rose",
  sky: "sky",
  mint: "mint",
  amber: "sun",
  violet: "lilac",
};

export function toneOfIdentity(color: string | undefined): Tone {
  return (color && FROM_IDENTITY[color]) || "rose";
}

const BY_NAME: Tone[] = ["lilac", "sky", "mint", "sun", "peach", "rose"];

/** Teinte stable pour quelqu'un dont on ne connaît pas la couleur choisie (le ou la partenaire). */
export function toneOfName(name: string, avoid?: Tone): Tone {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const pool = BY_NAME.filter((t) => t !== avoid);
  return pool[hash % pool.length];
}
