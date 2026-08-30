import { supabase } from "@/lib/supabase";

const CACHE_MARGIN_SECONDS = 60;
const STORAGE_KEY = "nous-signed-url-cache";

/** TTL pour du contenu permanent (jamais modifié une fois envoyé) : autant réutiliser la même URL longtemps. */
export const LONG_TTL_SECONDS = 60 * 60 * 24 * 365;

type CacheEntry = { url: string; expiresAt: number };

const memoryCache = new Map<string, CacheEntry>();
let persistedLoaded = false;

function cacheKey(bucket: string, path: string) {
  return `${bucket}:${path}`;
}

function loadPersisted() {
  if (persistedLoaded) return;
  persistedLoaded = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const stored = JSON.parse(raw) as Record<string, CacheEntry>;
    const now = Date.now();
    for (const [key, entry] of Object.entries(stored)) {
      if (entry.expiresAt > now) memoryCache.set(key, entry);
    }
  } catch {
    // localStorage indisponible (navigation privée, quota…) — cache mémoire seule.
  }
}

function persist() {
  try {
    const obj: Record<string, CacheEntry> = {};
    memoryCache.forEach((entry, key) => {
      obj[key] = entry;
    });
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  } catch {
    // idem : silencieux si indisponible.
  }
}

/** URL signée mise en cache (mémoire + localStorage) tant qu'elle est encore valide, pour éviter de retélécharger le même fichier à chaque montage ou rechargement de page. */
export async function getCachedSignedUrl(
  bucket: string,
  path: string,
  ttlSeconds: number
): Promise<string | null> {
  loadPersisted();
  const key = cacheKey(bucket, path);
  const cached = memoryCache.get(key);
  const now = Date.now();
  if (cached && cached.expiresAt > now) return cached.url;

  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, ttlSeconds);
  if (!data?.signedUrl) return null;
  memoryCache.set(key, { url: data.signedUrl, expiresAt: now + (ttlSeconds - CACHE_MARGIN_SECONDS) * 1000 });
  persist();
  return data.signedUrl;
}

/** Variante en lot de getCachedSignedUrl, pour les galeries. */
export async function getCachedSignedUrls(
  bucket: string,
  paths: string[],
  ttlSeconds: number
): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  loadPersisted();
  const now = Date.now();
  const result: Record<string, string> = {};
  const toFetch: string[] = [];

  for (const path of paths) {
    const cached = memoryCache.get(cacheKey(bucket, path));
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
        memoryCache.set(cacheKey(bucket, entry.path), { url: entry.signedUrl, expiresAt });
      }
    });
    persist();
  }

  return result;
}
