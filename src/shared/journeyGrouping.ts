import { Activity, Journey, MIN_JOURNEY_ACTIVITIES } from "./types";

// Deterministic, explainable journey grouping for the MVP.
//
// This intentionally does NOT use embeddings or a vector database — per the
// product spec, the goal is to demonstrate the trail -> journey interaction
// concept, not to solve web-scale semantic understanding. Signals used:
//   - time proximity (activities close together in time are more likely
//     part of one browsing session)
//   - domain similarity (weak signal alone — same domain does NOT imply
//     same goal, e.g. YouTube lecture vs YouTube music)
//   - keyword overlap between page titles (the strongest signal)
//
// A journey candidate requires >= MIN_JOURNEY_ACTIVITIES activities whose
// pairwise similarity clears SIMILARITY_THRESHOLD, connected transitively
// via union-find.

const TIME_WINDOW_MS = 6 * 60 * 60 * 1000; // 6 hours
const SIMILARITY_THRESHOLD = 0.3;
const UNRELATED_WINDOW_MS = 60 * 60 * 1000; // 1 hour margin around a journey's span

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "of", "to", "in", "on", "for",
  "with", "at", "by", "from", "up", "about", "into", "over", "after",
  "is", "are", "was", "were", "be", "been", "being", "this", "that",
  "these", "those", "it", "its", "as", "how", "what", "why", "when",
  "where", "which", "who", "your", "you", "vs", "home", "page",
  "official", "site", "welcome", "new", "search", "results",
]);

export function tokenizeTitle(title: string): string[] {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

export function keywordOverlapScore(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  let intersection = 0;
  for (const w of setA) if (setB.has(w)) intersection++;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

export function domainSimilarity(a: Activity, b: Activity): number {
  return a.domain === b.domain ? 1 : 0;
}

export function timeProximityScore(
  a: Activity,
  b: Activity,
  windowMs = TIME_WINDOW_MS
): number {
  const delta = Math.abs(a.timestamp - b.timestamp);
  if (delta >= windowMs) return 0;
  return 1 - delta / windowMs;
}

/** Combined pairwise similarity in [0, 1]. Keyword overlap is a *gate*, not
 * just a weight: same domain and/or close timing alone never link two
 * activities (e.g. a YouTube HCI lecture and a YouTube Christmas playlist
 * watched minutes apart must not be treated as related just because the
 * domain and timing match — there has to be some topical signal). Once
 * there is any keyword overlap, time and domain proximity strengthen it. */
export function similarityScore(a: Activity, b: Activity): number {
  const keywordA = tokenizeTitle(a.title);
  const keywordB = tokenizeTitle(b.title);
  const keyword = keywordOverlapScore(keywordA, keywordB);
  if (keyword === 0) return 0;
  const time = timeProximityScore(a, b);
  const domain = domainSimilarity(a, b);
  return 0.5 * keyword + 0.3 * time + 0.2 * domain;
}

// ---- Union-Find clustering ----

class UnionFind {
  private parent = new Map<string, string>();

  find(x: string): string {
    if (!this.parent.has(x)) this.parent.set(x, x);
    const p = this.parent.get(x)!;
    if (p === x) return x;
    const root = this.find(p);
    this.parent.set(x, root);
    return root;
  }

  union(a: string, b: string): void {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra !== rb) this.parent.set(ra, rb);
  }
}

export function clusterActivities(activities: Activity[]): Activity[][] {
  if (activities.length === 0) return [];
  const uf = new UnionFind();
  for (const a of activities) uf.find(a.id);

  for (let i = 0; i < activities.length; i++) {
    for (let j = i + 1; j < activities.length; j++) {
      if (similarityScore(activities[i], activities[j]) >= SIMILARITY_THRESHOLD) {
        uf.union(activities[i].id, activities[j].id);
      }
    }
  }

  const groups = new Map<string, Activity[]>();
  for (const a of activities) {
    const root = uf.find(a.id);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root)!.push(a);
  }
  return Array.from(groups.values());
}

/** Clusters of qualifying, ungrouped activities that meet the minimum size
 * to become a journey candidate. Smaller clusters are left ungrouped rather
 * than forced together. */
export function findJourneyCandidates(activities: Activity[]): Activity[][] {
  return clusterActivities(activities).filter(
    (c) => c.length >= MIN_JOURNEY_ACTIVITIES
  );
}

/** Derives a short human-readable title from a cluster's page titles. Falls
 * back to the most common domain when no keyword rises above the noise. */
export function generateJourneyTitle(activities: Activity[]): string {
  const freq = new Map<string, number>();
  for (const a of activities) {
    for (const w of tokenizeTitle(a.title)) {
      freq.set(w, (freq.get(w) ?? 0) + 1);
    }
  }
  const top = Array.from(freq.entries())
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([word]) => word);

  if (top.length > 0) {
    return top.map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
  }

  const domainFreq = new Map<string, number>();
  for (const a of activities) {
    domainFreq.set(a.domain, (domainFreq.get(a.domain) ?? 0) + 1);
  }
  const topDomain = Array.from(domainFreq.entries()).sort(
    (a, b) => b[1] - a[1]
  )[0]?.[0];
  return topDomain ? `Browsing on ${topDomain}` : "Untitled journey";
}

/** Finds qualifying activities temporally interleaved with a journey's span
 * that aren't members, weren't dismissed, and aren't claimed by another
 * journey — shown to the user as "possibly unrelated" suggestions, never
 * auto-added and never deleted. */
export function findPossiblyUnrelated(
  journey: Journey,
  allActivities: Activity[],
  allJourneys: Journey[]
): Activity[] {
  const members = allActivities.filter((a) =>
    journey.activityIds.includes(a.id)
  );
  if (members.length === 0) return [];

  const timestamps = members.map((a) => a.timestamp);
  const minT = Math.min(...timestamps) - UNRELATED_WINDOW_MS;
  const maxT = Math.max(...timestamps) + UNRELATED_WINDOW_MS;

  const claimedElsewhere = new Set<string>();
  for (const j of allJourneys) {
    if (j.id === journey.id) continue;
    for (const id of j.activityIds) claimedElsewhere.add(id);
  }

  return allActivities.filter(
    (a) =>
      !journey.activityIds.includes(a.id) &&
      !journey.keptSeparateIds.includes(a.id) &&
      !a.excluded &&
      !claimedElsewhere.has(a.id) &&
      a.timestamp >= minT &&
      a.timestamp <= maxT
  );
}

/** True if `activity` closely matches an existing journey (same URL revisit,
 * or high similarity to its members) — used to auto-attach revisits instead
 * of spawning duplicate candidate journeys. */
export function findBestMatchingJourney(
  activity: Activity,
  journeys: Journey[],
  allActivities: Activity[]
): Journey | null {
  let best: { journey: Journey; score: number } | null = null;

  for (const journey of journeys) {
    if (journey.status === "archived") continue;
    const members = allActivities.filter((a) =>
      journey.activityIds.includes(a.id)
    );
    if (members.length === 0) continue;

    const sameUrl = members.some((m) => m.url === activity.url);
    if (sameUrl) return journey;

    const avgScore =
      members.reduce((sum, m) => sum + similarityScore(activity, m), 0) /
      members.length;
    if (avgScore >= 0.45 && (!best || avgScore > best.score)) {
      best = { journey, score: avgScore };
    }
  }

  return best?.journey ?? null;
}
