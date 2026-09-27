/**
 * Picks a background asset for (location, activity, time, weather, season).
 * Purely data-driven: adding a variant = adding a row to backgrounds.json.
 *
 * Matching: a background field that is set must match (otherwise excluded);
 * among the rest the most specific wins (activity 8 > weather 4 > timeOfDay 2
 * > season 1). Conditions the chosen background doesn't depict are applied as
 * overlays (night tint, rain, snow…), like the prototype's world() overlays.
 */
import { OVERLAYS, backgroundsFor, getLocation, type OverlayDef } from "./catalog";
import type { ActivityId, LocationBackground, Season, TimeOfDay, Weather } from "./types";

export interface BackgroundQuery {
  location: string;
  activityId?: ActivityId;
  timeOfDay: TimeOfDay;
  weather?: Weather;
  season?: Season;
}

export interface BackgroundSelection {
  background: LocationBackground;
  overlays: Array<{ condition: string } & OverlayDef>;
  /** Which query fields the background itself depicts. */
  matched: string[];
}

const SCORE = { activity: 8, weather: 4, timeOfDay: 2, season: 1 };

export class BackgroundEngine {
  private cache = new Map<string, BackgroundSelection>();

  getBackground(q: BackgroundQuery): BackgroundSelection {
    const key = `${q.location}|${q.activityId ?? ""}|${q.timeOfDay}|${q.weather ?? ""}|${q.season ?? ""}`;
    const hit = this.cache.get(key);
    if (hit) return hit;

    const location = getLocation(q.location);
    let best: LocationBackground | undefined;
    let bestScore = -1;
    let bestMatched: string[] = [];
    for (const b of backgroundsFor(location.id)) {
      const matched: string[] = [];
      let score = 0;
      if (b.activities) {
        if (!q.activityId || !b.activities.includes(q.activityId)) continue;
        score += SCORE.activity;
        matched.push("activity");
      }
      if (b.weather) {
        if (b.weather !== q.weather) continue;
        score += SCORE.weather;
        matched.push("weather");
      }
      if (b.timeOfDay) {
        if (b.timeOfDay !== q.timeOfDay) continue;
        score += SCORE.timeOfDay;
        matched.push("timeOfDay");
      }
      if (b.season) {
        if (b.season !== q.season) continue;
        score += SCORE.season;
        matched.push("season");
      }
      if (score > bestScore) (best = b), (bestScore = score), (bestMatched = matched);
    }
    if (!best) throw new Error(`No background for location ${location.id}`);

    const overlays: BackgroundSelection["overlays"] = [];
    if (!location.online) {
      if (!bestMatched.includes("timeOfDay") && q.timeOfDay !== "DAY" && OVERLAYS[q.timeOfDay]) overlays.push({ condition: q.timeOfDay, ...OVERLAYS[q.timeOfDay] });
      const outdoorish = !["HOME", "WORKPLACE", "LIBRARY", "CLASS", "HOSPITAL", "GYM"].includes(location.type);
      if (q.weather && q.weather !== "CLEAR" && !bestMatched.includes("weather") && outdoorish && OVERLAYS[q.weather]) {
        overlays.push({ condition: q.weather, ...OVERLAYS[q.weather] });
      }
    }
    const sel = { background: best, overlays, matched: bestMatched };
    this.cache.set(key, sel);
    return sel;
  }
}

export const backgroundEngine = new BackgroundEngine();
