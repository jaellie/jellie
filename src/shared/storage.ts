import {
  Activity,
  ConfirmedGoal,
  GoalCandidate,
  Journey,
  JourneyStatus,
  JourneySummary,
  PawprintSettings,
  DEFAULT_SETTINGS,
} from "./types";

// Thin wrapper around chrome.storage.local. All durable "browsing memory"
// (activities, journeys, settings) lives here so deletion is real and
// immediate, and so state survives service-worker restarts / browser
// restarts / side panel close-reopen.

const KEYS = {
  activities: "pawprint_activities",
  journeys: "pawprint_journeys",
  settings: "pawprint_settings",
} as const;

async function getRaw<T>(key: string, fallback: T): Promise<T> {
  const result = await chrome.storage.local.get(key);
  return (result[key] as T) ?? fallback;
}

async function setRaw(key: string, value: unknown): Promise<void> {
  await chrome.storage.local.set({ [key]: value });
}

// ---- Settings ----

export async function getSettings(): Promise<PawprintSettings> {
  return getRaw<PawprintSettings>(KEYS.settings, DEFAULT_SETTINGS);
}

export async function saveSettings(
  settings: PawprintSettings
): Promise<void> {
  await setRaw(KEYS.settings, settings);
}

export async function updateSettings(
  patch: Partial<PawprintSettings>
): Promise<PawprintSettings> {
  const current = await getSettings();
  const next = { ...current, ...patch };
  await saveSettings(next);
  return next;
}

// ---- Activities ----

export async function getActivities(): Promise<Activity[]> {
  return getRaw<Activity[]>(KEYS.activities, []);
}

/** Merges fields into an already-persisted activity (e.g. growing duration
 * and interaction types while the user stays on the same page) rather than
 * creating a new record for the same visit. No-ops if the id is unknown. */
export async function updateActivity(
  id: string,
  patch: Partial<Omit<Activity, "id">>
): Promise<void> {
  const activities = await getActivities();
  const activity = activities.find((a) => a.id === id);
  if (!activity) return;
  Object.assign(activity, patch);
  await setRaw(KEYS.activities, activities);
}

export async function saveActivity(activity: Activity): Promise<void> {
  const activities = await getActivities();
  const idx = activities.findIndex((a) => a.id === activity.id);
  if (idx >= 0) {
    activities[idx] = activity;
  } else {
    activities.push(activity);
  }
  await setRaw(KEYS.activities, activities);
}

export async function saveActivities(newOnes: Activity[]): Promise<void> {
  if (newOnes.length === 0) return;
  const activities = await getActivities();
  const byId = new Map(activities.map((a) => [a.id, a]));
  for (const a of newOnes) byId.set(a.id, a);
  await setRaw(KEYS.activities, Array.from(byId.values()));
}

export async function deleteActivity(activityId: string): Promise<void> {
  const [activities, journeys] = await Promise.all([
    getActivities(),
    getJourneys(),
  ]);
  const remaining = activities.filter((a) => a.id !== activityId);
  const updatedJourneys = journeys.map((j) => ({
    ...j,
    activityIds: j.activityIds.filter((id) => id !== activityId),
    keptSeparateIds: j.keptSeparateIds.filter((id) => id !== activityId),
  }));
  await Promise.all([
    setRaw(KEYS.activities, remaining),
    setRaw(KEYS.journeys, updatedJourneys),
  ]);
}

/** Removes ungrouped activities older than the retention window. Activities
 * already attached to a journey are kept regardless of age — they're part
 * of confirmed/candidate memory, not transient noise. */
export async function pruneExpiredActivities(): Promise<void> {
  const [activities, settings] = await Promise.all([
    getActivities(),
    getSettings(),
  ]);
  const cutoff = Date.now() - settings.retentionDays * 24 * 60 * 60 * 1000;
  const remaining = activities.filter(
    (a) => a.journeyId || a.timestamp >= cutoff
  );
  if (remaining.length !== activities.length) {
    await setRaw(KEYS.activities, remaining);
  }
}

// ---- Journeys ----

export async function getJourneys(): Promise<Journey[]> {
  return getRaw<Journey[]>(KEYS.journeys, []);
}

export async function saveJourney(journey: Journey): Promise<void> {
  const journeys = await getJourneys();
  const idx = journeys.findIndex((j) => j.id === journey.id);
  if (idx >= 0) {
    journeys[idx] = journey;
  } else {
    journeys.push(journey);
  }
  await setRaw(KEYS.journeys, journeys);
}

export async function saveJourneys(all: Journey[]): Promise<void> {
  await setRaw(KEYS.journeys, all);
}

export async function deleteJourney(journeyId: string): Promise<void> {
  const [activities, journeys] = await Promise.all([
    getActivities(),
    getJourneys(),
  ]);
  const remainingJourneys = journeys.filter((j) => j.id !== journeyId);
  const updatedActivities = activities.map((a) =>
    a.journeyId === journeyId ? { ...a, journeyId: undefined } : a
  );
  await Promise.all([
    setRaw(KEYS.journeys, remainingJourneys),
    setRaw(KEYS.activities, updatedActivities),
  ]);
}

// ---- Bulk deletion ----

export async function deleteAllMemory(): Promise<void> {
  await Promise.all([setRaw(KEYS.activities, []), setRaw(KEYS.journeys, [])]);
}

// ---- Journey membership mutations ----
// These keep Activity.journeyId and Journey.activityIds in sync as one
// atomic storage write, so the UI never has to hand-manage both sides.

export async function addActivityToJourney(
  activityId: string,
  journeyId: string
): Promise<void> {
  const [activities, journeys] = await Promise.all([
    getActivities(),
    getJourneys(),
  ]);
  const activity = activities.find((a) => a.id === activityId);
  if (!activity) return;

  const previousJourneyId = activity.journeyId;
  activity.journeyId = journeyId;

  for (const j of journeys) {
    if (j.id === journeyId) {
      if (!j.activityIds.includes(activityId)) j.activityIds.push(activityId);
      j.keptSeparateIds = j.keptSeparateIds.filter((id) => id !== activityId);
      j.updatedAt = Date.now();
    } else if (j.id === previousJourneyId) {
      j.activityIds = j.activityIds.filter((id) => id !== activityId);
      j.updatedAt = Date.now();
    }
  }

  await Promise.all([
    setRaw(KEYS.activities, activities),
    setRaw(KEYS.journeys, journeys),
  ]);
}

/** Marks an activity as intentionally not part of a journey — suppresses it
 * from that journey's "possibly unrelated" suggestions going forward. Does
 * not delete the activity; it remains in Today / available elsewhere. */
export async function keepActivitySeparate(
  activityId: string,
  journeyId: string
): Promise<void> {
  const journeys = await getJourneys();
  const journey = journeys.find((j) => j.id === journeyId);
  if (!journey) return;
  if (!journey.keptSeparateIds.includes(activityId)) {
    journey.keptSeparateIds.push(activityId);
    journey.updatedAt = Date.now();
    await setRaw(KEYS.journeys, journeys);
  }
}

export async function removeActivityFromJourney(
  activityId: string,
  journeyId: string
): Promise<void> {
  const [activities, journeys] = await Promise.all([
    getActivities(),
    getJourneys(),
  ]);
  const activity = activities.find((a) => a.id === activityId);
  if (activity && activity.journeyId === journeyId) {
    activity.journeyId = undefined;
  }
  const journey = journeys.find((j) => j.id === journeyId);
  if (journey) {
    journey.activityIds = journey.activityIds.filter((id) => id !== activityId);
    journey.updatedAt = Date.now();
  }
  await Promise.all([
    setRaw(KEYS.activities, activities),
    setRaw(KEYS.journeys, journeys),
  ]);
}

export async function setJourneyGoal(
  journeyId: string,
  goal: ConfirmedGoal,
  lastAiCandidates?: GoalCandidate[]
): Promise<void> {
  const journeys = await getJourneys();
  const journey = journeys.find((j) => j.id === journeyId);
  if (!journey) return;
  journey.goal = goal;
  if (lastAiCandidates) journey.lastAiCandidates = lastAiCandidates;
  if (journey.status === "candidate") journey.status = "active";
  journey.updatedAt = Date.now();
  await setRaw(KEYS.journeys, journeys);
}

export async function setJourneyStatus(
  journeyId: string,
  status: JourneyStatus
): Promise<void> {
  const journeys = await getJourneys();
  const journey = journeys.find((j) => j.id === journeyId);
  if (!journey) return;
  journey.status = status;
  journey.updatedAt = Date.now();
  await setRaw(KEYS.journeys, journeys);
}

export async function renameJourney(
  journeyId: string,
  title: string
): Promise<void> {
  const journeys = await getJourneys();
  const journey = journeys.find((j) => j.id === journeyId);
  if (!journey) return;
  journey.title = title;
  journey.updatedAt = Date.now();
  await setRaw(KEYS.journeys, journeys);
}

export async function setJourneySummary(
  journeyId: string,
  summary: JourneySummary
): Promise<void> {
  const journeys = await getJourneys();
  const journey = journeys.find((j) => j.id === journeyId);
  if (!journey) return;
  journey.summary = summary;
  await setRaw(KEYS.journeys, journeys);
}
