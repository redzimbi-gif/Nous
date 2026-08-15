export const PRESENCE_HEARTBEAT_MS = 25_000;
export const PRESENCE_STALE_MS = 90_000;

export function isPresenceOnline(
  row?: { online: boolean; updated_at: string } | null
): boolean {
  if (!row?.online) return false;
  return Date.now() - new Date(row.updated_at).getTime() < PRESENCE_STALE_MS;
}
