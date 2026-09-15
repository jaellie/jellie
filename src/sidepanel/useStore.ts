import { useCallback, useEffect, useState } from "react";
import { Activity, Journey, PawprintSettings, DEFAULT_SETTINGS } from "../shared/types";
import { getActivities, getJourneys, getSettings } from "../shared/storage";

export interface PawprintData {
  activities: Activity[];
  journeys: Journey[];
  settings: PawprintSettings;
  loading: boolean;
  refresh: () => void;
}

/** Loads activities/journeys/settings from chrome.storage.local and keeps
 * them live via chrome.storage.onChanged, so closing/reopening the side
 * panel (or any background write) never leaves the UI stale. */
export function usePawprintData(): PawprintData {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [settings, setSettings] = useState<PawprintSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    void Promise.all([getActivities(), getJourneys(), getSettings()]).then(
      ([a, j, s]) => {
        setActivities(a);
        setJourneys(j);
        setSettings(s);
        setLoading(false);
      }
    );
  }, []);

  useEffect(() => {
    load();
    const listener = (
      changes: Record<string, chrome.storage.StorageChange>,
      area: string
    ) => {
      if (area !== "local") return;
      if (
        changes.pawprint_activities ||
        changes.pawprint_journeys ||
        changes.pawprint_settings
      ) {
        load();
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, [load]);

  return { activities, journeys, settings, loading, refresh: load };
}
