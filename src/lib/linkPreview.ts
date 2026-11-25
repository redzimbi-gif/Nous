import { supabase } from "@/lib/supabase";
import { hostOf } from "@/lib/refs";
import type { LinkPreview, RefRow } from "@/lib/types";

const RETRY_AFTER_MS = 3 * 24 * 3600 * 1000;

/** Demande au serveur de lire la page du lien. Ne lève jamais : un échec devient { ok: false }. */
export async function fetchLinkPreview(url: string): Promise<LinkPreview> {
  const failed: LinkPreview = { url, title: null, description: null, image: null, site: null, host: hostOf(url), fetched_at: new Date().toISOString(), ok: false };
  try {
    const response = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
    if (!response.ok) return failed;
    return (await response.json()) as LinkPreview;
  } catch {
    return failed;
  }
}

/** Faut-il (re)lire le lien d'une réf ? Jamais deux fois si ça a marché ; nouvel essai après quelques jours sinon. */
export function needsPreview(ref: Pick<RefRow, "link" | "preview">): boolean {
  if (!ref.link) return false;
  if (!ref.preview) return true;
  if (ref.preview.ok && ref.preview.url === ref.link) return false;
  if (ref.preview.url !== ref.link) return true;
  return Date.now() - new Date(ref.preview.fetched_at).getTime() > RETRY_AFTER_MS;
}

const inFlight = new Map<string, Promise<RefRow | null>>();

/**
 * Lit l'aperçu du lien d'une réf puis le mémorise dans la base, pour que les deux appareils
 * (et le chat) le retrouvent sans relire le site. Renvoie la réf mise à jour, ou null.
 */
export function ensureRefPreview(ref: RefRow): Promise<RefRow | null> {
  if (!needsPreview(ref) || !ref.link) return Promise.resolve(null);
  const existing = inFlight.get(ref.id);
  if (existing) return existing;
  const link = ref.link;
  const job = (async () => {
    const preview = await fetchLinkPreview(link);
    const { error } = await supabase.from("refs").update({ preview }).eq("id", ref.id);
    inFlight.delete(ref.id);
    return error ? null : { ...ref, preview };
  })();
  inFlight.set(ref.id, job);
  return job;
}
