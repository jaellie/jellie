/**
 * What this player has already seen in earlier lives on this device (browser storage), so a new
 * life leans toward scenes and life events they haven't met yet. Outside a browser (tests, scripts)
 * it remembers nothing and changes nothing.
 */

const KEY = "lovesim-seen-v1";
type Seen = Record<string, number>;
let cache: Seen | undefined;

function store(): Storage | undefined {
  try {
    return typeof localStorage !== "undefined" ? localStorage : undefined;
  } catch {
    return undefined;
  }
}

function load(): Seen {
  if (cache) return cache;
  cache = {};
  try {
    const raw = store()?.getItem(KEY);
    if (raw) cache = JSON.parse(raw) as Seen;
  } catch {
    cache = {};
  }
  return cache;
}

/** How many earlier times this was seen on this device (0 outside a browser). */
export function timesSeen(key: string): number {
  return store() ? load()[key] ?? 0 : 0;
}

/** Weight multiplier: unseen 1, then 0.35, 0.2, 0.14 … (never zero, so nothing is gone for good). */
export function freshness(key: string): number {
  return 1 / (1 + 1.85 * timesSeen(key));
}

export function markSeen(key: string): void {
  const s = store();
  if (!s) return;
  const seen = load();
  seen[key] = (seen[key] ?? 0) + 1;
  try {
    s.setItem(KEY, JSON.stringify(seen));
  } catch {
    /* storage full or blocked: forget quietly */
  }
}
