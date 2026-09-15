import { Activity, Journey } from "../shared/types";
import { qualifiesFromMs } from "../shared/qualification";
import { isSensitiveUrl } from "../shared/sensitiveSites";
import {
  getActivities,
  getJourneys,
  getSettings,
  saveActivities,
  saveActivity,
  saveJourneys,
  pruneExpiredActivities,
} from "../shared/storage";
import {
  findBestMatchingJourney,
  findJourneyCandidates,
  generateJourneyTitle,
} from "../shared/journeyGrouping";
import { TabState, getActiveMs } from "./tabState";

function newId(): string {
  return crypto.randomUUID();
}

/** Evaluates a finished/paused page visit against the meaningful-activity
 * rule and, if it qualifies and isn't excluded, persists it and kicks off
 * journey regrouping. Safe to call on every navigation/tab-close/tab-switch
 * — non-qualifying visits are silently dropped, never stored. */
export async function finalizeTabState(state: TabState): Promise<void> {
  const settings = await getSettings();
  if (settings.trackingPaused) return;
  if (!state.url || !state.url.startsWith("http")) return;
  if (isSensitiveUrl(state.url, settings.excludedDomains)) return;

  const activeMs = getActiveMs(state);
  if (!qualifiesFromMs(activeMs, state.interactions)) return;

  const activity: Activity = {
    id: newId(),
    url: state.url,
    domain: state.domain,
    title: state.title,
    timestamp: state.visitStartedAt,
    durationMs: activeMs,
    interactionTypes: [...state.interactions],
    favicon: state.favicon,
  };

  await saveActivity(activity);
  await regroupJourneys();
}

/** Re-derives journey membership from scratch for ungrouped activities:
 * revisits auto-attach to a matching existing journey, and remaining
 * clusters of >= MIN_JOURNEY_ACTIVITIES become new candidate journeys.
 * Deterministic and idempotent — safe to re-run after every new activity. */
export async function regroupJourneys(): Promise<void> {
  const [activities, journeys] = await Promise.all([
    getActivities(),
    getJourneys(),
  ]);

  const ungrouped = activities.filter((a) => !a.journeyId && !a.excluded);
  if (ungrouped.length === 0) return;

  const activityById = new Map(activities.map((a) => [a.id, a]));
  const journeyById = new Map(journeys.map((j) => [j.id, j]));
  const stillUngrouped: Activity[] = [];

  for (const activity of ungrouped.sort((a, b) => a.timestamp - b.timestamp)) {
    const match = findBestMatchingJourney(activity, journeys, activities);
    if (match) {
      activity.journeyId = match.id;
      match.activityIds.push(activity.id);
      match.updatedAt = Date.now();
    } else {
      stillUngrouped.push(activity);
    }
  }

  const now = Date.now();
  for (const cluster of findJourneyCandidates(stillUngrouped)) {
    const journey: Journey = {
      id: newId(),
      title: generateJourneyTitle(cluster),
      status: "candidate",
      activityIds: cluster.map((a) => a.id),
      keptSeparateIds: [],
      createdAt: now,
      updatedAt: now,
    };
    for (const a of cluster) {
      const stored = activityById.get(a.id);
      if (stored) stored.journeyId = journey.id;
    }
    journeyById.set(journey.id, journey);
  }

  await Promise.all([
    saveActivities(Array.from(activityById.values())),
    saveJourneys(Array.from(journeyById.values())),
  ]);
}

export async function runMaintenance(): Promise<void> {
  await pruneExpiredActivities();
}
