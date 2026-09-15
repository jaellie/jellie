import * as tabState from "./tabState";
import {
  checkAndPersistIfQualifies,
  finalizeTabState,
  regroupJourneys,
  runMaintenance,
} from "./activityEngine";
import { getSettings, saveSettings } from "../shared/storage";
import { DEFAULT_SETTINGS } from "../shared/types";

const MAINTENANCE_ALARM = "pawprint-maintenance";

// A page visit must be recorded as soon as it becomes meaningful — not only
// once the user navigates away or closes the tab. tabState schedules its
// own checkpoint timers but doesn't persist anything itself (it has no
// notion of storage/AI/journeys), so it calls back into the engine here.
tabState.setQualifyCheckHandler((tabId) => {
  void checkAndPersistIfQualifies(tabId);
});

/** Rehydrates in-memory tab timer state after a service worker restart
 * (idle termination, browser restart, crash) and figures out which tab is
 * currently active/focused so timing resumes correctly instead of either
 * losing progress or double-counting.
 *
 * The service worker restarts constantly during normal use (Chrome kills
 * it after ~30s idle), and the event that wakes it up is almost always
 * itself an event this file handles (a tab switch, a navigation...). Every
 * one of those handlers calls this function, so it's critical that they
 * all await the *same* in-flight initialization rather than each checking
 * a boolean and racing ahead with stale (still-null) focused-window state
 * — that race was silently dropping the very event that triggered it. */
let initPromise: Promise<void> | null = null;
function ensureInitialized(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      await tabState.hydrate();
      try {
        const win = await chrome.windows.getLastFocused({ populate: false });
        if (win?.focused && win.id != null) {
          const [activeTab] = await chrome.tabs.query({
            active: true,
            windowId: win.id,
          });
          const activeTabId =
            activeTab?.id != null && !activeTab.incognito ? activeTab.id : null;
          if (activeTabId != null && !tabState.getTabState(activeTabId)) {
            tabState.createTabState(
              activeTabId,
              activeTab!.url ?? "",
              activeTab!.title ?? "",
              activeTab!.favIconUrl
            );
          }
          tabState.setFocusedWindow(win.id, activeTabId);
        }
      } catch {
        // No focused window yet (e.g. browser just launched with none open).
      }
    })();
  }
  return initPromise;
}

chrome.runtime.onInstalled.addListener(() => {
  void (async () => {
    try {
      await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
    } catch {
      // sidePanel API unavailable in this Chrome version — non-fatal.
    }
    const existing = await getSettings().catch(() => null);
    if (!existing) {
      await saveSettings(DEFAULT_SETTINGS);
    }
    chrome.alarms.create(MAINTENANCE_ALARM, { periodInMinutes: 30 });
  })();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === MAINTENANCE_ALARM) {
    void runMaintenance();
  }
});

chrome.tabs.onActivated.addListener(({ tabId, windowId }) => {
  void (async () => {
    await ensureInitialized();
    // A tab becoming active in a window that isn't the focused one (e.g. the
    // user switched tabs in a background window) must not steal timing from
    // whatever the user is actually looking at.
    if (windowId !== tabState.getFocusedWindowId()) return;

    const tab = await chrome.tabs.get(tabId).catch(() => null);
    if (!tab || tab.incognito) {
      tabState.setActiveTab(null);
      return;
    }
    if (!tabState.getTabState(tabId)) {
      tabState.createTabState(tabId, tab.url ?? "", tab.title ?? "", tab.favIconUrl);
    }
    tabState.setActiveTab(tabId);
  })();
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  void (async () => {
    await ensureInitialized();
    if (tab.incognito) return;

    if (changeInfo.url) {
      const prior = tabState.getTabState(tabId);
      if (prior) await finalizeTabState(prior);
      tabState.resetForNavigation(
        tabId,
        changeInfo.url,
        tab.title ?? "",
        tab.favIconUrl
      );
      return;
    }

    if (changeInfo.title != null || changeInfo.favIconUrl != null) {
      tabState.updateTabMeta(tabId, {
        title: changeInfo.title ?? undefined,
        favicon: changeInfo.favIconUrl ?? undefined,
      });
    }
  })();
});

chrome.tabs.onRemoved.addListener((tabId) => {
  void (async () => {
    await ensureInitialized();
    const prior = tabState.getTabState(tabId);
    if (prior) await finalizeTabState(prior);
    tabState.removeTabState(tabId);
  })();
});

chrome.windows.onFocusChanged.addListener((windowId) => {
  void (async () => {
    await ensureInitialized();
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
      tabState.setFocusedWindow(null, null);
      return;
    }
    const win = await chrome.windows.get(windowId).catch(() => null);
    if (!win || win.type !== "normal") return;

    const [activeTab] = await chrome.tabs.query({ active: true, windowId });
    const activeTabId =
      activeTab?.id != null && !activeTab.incognito ? activeTab.id : null;
    if (activeTabId != null && !tabState.getTabState(activeTabId)) {
      tabState.createTabState(
        activeTabId,
        activeTab!.url ?? "",
        activeTab!.title ?? "",
        activeTab!.favIconUrl
      );
    }
    tabState.setFocusedWindow(windowId, activeTabId);
  })();
});

chrome.runtime.onMessage.addListener((message, sender) => {
  if (message?.type === "PAWPRINT_INTERACTION" && sender.tab?.id != null) {
    void (async () => {
      await ensureInitialized();
      const tabId = sender.tab!.id!;
      tabState.recordInteraction(tabId, message.interaction);
      // Re-check immediately: if active time already cleared the threshold
      // by the time this interaction arrives, the visit qualifies right now
      // rather than waiting for the scheduled checkpoint or a navigation.
      await checkAndPersistIfQualifies(tabId);
    })();
  }
  return false;
});

void ensureInitialized();
void regroupJourneys();
