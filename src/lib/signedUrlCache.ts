import { supabase } from "@/lib/supabase";

const CACHE_MARGIN_SECONDS = 60;

type CacheEntry = { url: string; expiresAt: number };
const cache = new Map<string, CacheEntry>();

function cacheKey(bucket: string, path: string) {
  return `${bucket}:${path}`;
}

/** URL signée mise en cache tant qu'elle est encore valide, pour éviter de retélécharger le même fichier à chaque montage. */
export async function getCachedSignedUrl(
  bucket: string,
  path: string,
  ttlSeconds: number
): Promise<string | null> {
  const key = cacheKey(bucket, path);
  const cached = cache.get(key);
  const now = Date.now();
  if (cached && cached.expiresAt > now) return cached.url;

  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, ttlSeconds);
  if (!data?.signedUrl) return null;
  cache.set(key, { url: data.signedUrl, expiresAt: now + (ttlSeconds - CACHE_MARGIN_SECONDS) * 1000 });
  return data.signedUrl;
}

/** Variante en lot de getCachedSignedUrl, pour les galeries. */
export async function getCachedSignedUrls(
  bucket: string,
  paths: string[],
  ttlSeconds: number
): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const now = Date.now();
  const result: Record<string, string> = {};
  const toFetch: string[] = [];

  for (const path of paths) {
    const cached = cache.get(cacheKey(bucket, path));
    if (cached && cached.expiresAt > now) {
      result[path] = cached.url;
    } else {
      toFetch.push(path);
    }
  }

  if (toFetch.length > 0) {
    const { data } = await supabase.storage.from(bucket).createSignedUrls(toFetch, ttlSeconds);
    const expiresAt = now + (ttlSeconds - CACHE_MARGIN_SECONDS) * 1000;
    (data ?? []).forEach((entry) => {
      if (entry.path && entry.signedUrl) {
        result[entry.path] = entry.signedUrl;
        cache.set(cacheKey(bucket, entry.path), { url: entry.signedUrl, expiresAt });
      }
    });
  }

  return result;
}
