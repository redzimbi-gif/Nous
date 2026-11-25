import type { Subscription, Tier } from "./types";

const RANK: Record<Tier, number> = { free: 0, plus: 1, max: 2 };

export const TIER_LABEL: Record<Tier, string> = { free: "Gratuit", plus: "Nous+", max: "Nous Max" };

export function tierAtLeast(tier: Tier, needed: Tier): boolean {
  return RANK[tier] >= RANK[needed];
}

/**
 * Formule réellement applicable à un espace. Un abonnement résilié reste valable
 * jusqu'à la fin de la période payée ; un paiement en retard garde un délai de grâce
 * (géré côté webhook). Sans abonnement valide, l'espace retombe en gratuit :
 * rien n'est supprimé, seules les fonctions payantes se verrouillent.
 */
export function effectiveTier(
  sub: Pick<Subscription, "tier" | "status" | "current_period_end"> | null,
  now: Date = new Date(),
): Tier {
  if (!sub || sub.tier === "free") return "free";
  if (sub.status === "canceled") {
    return sub.current_period_end && new Date(sub.current_period_end) > now ? sub.tier : "free";
  }
  return sub.tier;
}
