import { InteractionType } from "../shared/types";
import { getDomain } from "../shared/sensitiveSites";

// Per-tab active-time tracking. "Active" means: this tab is the selected
// tab AND its browser window has focus. Switching tabs pauses the timer
// (accumulated time is preserved, not reset) rather than finalizing the
// visit — a tab can regain focus later and keep accumulating toward the
// 60-second threshold.

export interface TabState {
  tabId: number;
  url: string;
  domain: string;
  title: string;
  favicon?: string;
  /** When this page visit (this URL, in this tab) started being tracked. */
  visitStartedAt: number;
  /** Active ms accumulated so far while the timer was not running. */
  accumulatedMs: number;
  /** Timestamp the timer most recently started running, or null if paused. */
  timerRunningSince: number | null;
  interactions: InteractionType[];
}

const SESSION_STORAGE_KEY = "pawprint_session_tab_state";
const SESSION_META_KEY = "pawprint_session_meta";

const tabStates = new Map<number, TabState>();
/** The tab currently being timed — only ever the active tab *of the
 * currently-focused window*. A tab becoming active in a background window
 * must not change this (see setActiveTabIfFocused). */
let activeTabId: number | null = null;
let focusedWindowId: number | null = null;
let hydrated = false;

function serializable() {
  return {
    tabStates: Array.from(tabStates.entries()),
    meta: { activeTabId, focusedWindowId },
  };
}

let persistTimeout: ReturnType<typeof setTimeout> | null = null;
function schedulePersist() {
  if (persistTimeout) return;
  persistTimeout = setTimeout(() => {
    persistTimeout = null;
    const { tabStates: ts, meta } = serializable();
    void chrome.storage.session.set({
      [SESSION_STORAGE_KEY]: ts,
      [SESSION_META_KEY]: meta,
    });
  }, 500);
}

export async function hydrate(): Promise<void> {
  if (hydrated) return;
  hydrated = true;
  try {
    const result = await chrome.storage.session.get([
      SESSION_STORAGE_KEY,
      SESSION_META_KEY,
    ]);
    const entries = (result[SESSION_STORAGE_KEY] as [number, TabState][]) ?? [];
    for (const [id, state] of entries) tabStates.set(id, state);
    // Deliberately not restoring activeTabId/focusedWindowId from the
    // persisted meta here — the caller re-derives both fresh from live
    // chrome.windows/chrome.tabs queries right after hydration, which is
    // strictly more trustworthy than a snapshot from before the worker died.
  } catch {
    // storage.session unavailable or empty — start fresh.
  }
}

export function getTabState(tabId: number): TabState | undefined {
  return tabStates.get(tabId);
}

export function getAllTabStates(): TabState[] {
  return Array.from(tabStates.values());
}

export function createTabState(
  tabId: number,
  url: string,
  title: string,
  favicon?: string
): TabState {
  const state: TabState = {
    tabId,
    url,
    domain: getDomain(url),
    title,
    favicon,
    visitStartedAt: Date.now(),
    accumulatedMs: 0,
    timerRunningSince: null,
    interactions: [],
  };
  tabStates.set(tabId, state);
  schedulePersist();
  return state;
}

export function updateTabMeta(
  tabId: number,
  patch: Partial<Pick<TabState, "title" | "favicon">>
): void {
  const state = tabStates.get(tabId);
  if (!state) return;
  Object.assign(state, patch);
  schedulePersist();
}

export function removeTabState(tabId: number): void {
  tabStates.delete(tabId);
  if (activeTabId === tabId) activeTabId = null;
  schedulePersist();
}

export function recordInteraction(
  tabId: number,
  interaction: InteractionType
): void {
  const state = tabStates.get(tabId);
  if (!state) return;
  if (!state.interactions.includes(interaction)) {
    state.interactions.push(interaction);
    schedulePersist();
  }
}

function startTimer(state: TabState): void {
  if (state.timerRunningSince == null) {
    state.timerRunningSince = Date.now();
  }
}

function pauseTimer(state: TabState): void {
  if (state.timerRunningSince != null) {
    state.accumulatedMs += Date.now() - state.timerRunningSince;
    state.timerRunningSince = null;
  }
}

export function getActiveMs(state: TabState): number {
  const running =
    state.timerRunningSince != null ? Date.now() - state.timerRunningSince : 0;
  return state.accumulatedMs + running;
}

/** Re-evaluates which tab's timer (if any) should be running, based on the
 * current active tab + window focus state. Call after any change to either. */
function reconcileTimers(): void {
  for (const state of tabStates.values()) {
    const shouldRun = focusedWindowId != null && state.tabId === activeTabId;
    if (shouldRun) startTimer(state);
    else pauseTimer(state);
  }
  schedulePersist();
}

/** Sets the active tab of the currently-focused window. Callers must only
 * invoke this for an activation known to belong to the focused window —
 * chrome.tabs.onActivated fires for background windows too, and switching
 * tabs there must not steal timing from the tab the user is actually
 * looking at. Use setFocusedWindow (which re-derives the right tab itself)
 * when a window's focus changes instead. */
export function setActiveTab(tabId: number | null): void {
  if (activeTabId === tabId) return;
  activeTabId = tabId;
  reconcileTimers();
}

export function getActiveTabId(): number | null {
  return activeTabId;
}

/** Sets which window is focused and, atomically, which tab within it is
 * active — avoiding a transient window where the two are out of sync. Pass
 * (null, null) when the browser loses focus entirely (all windows
 * unfocused), which pauses every timer. */
export function setFocusedWindow(
  windowId: number | null,
  activeTabInWindow: number | null
): void {
  if (focusedWindowId === windowId && activeTabId === activeTabInWindow) return;
  focusedWindowId = windowId;
  activeTabId = activeTabInWindow;
  reconcileTimers();
}

export function getFocusedWindowId(): number | null {
  return focusedWindowId;
}

export function isWindowFocused(): boolean {
  return focusedWindowId != null;
}

/** Resets a tab to a fresh page visit (e.g. after navigation). Callers must
 * read+finalize the prior TabState via getTabState() *before* calling this,
 * since it overwrites the tab's entry. */
export function resetForNavigation(
  tabId: number,
  newUrl: string,
  newTitle: string,
  favicon?: string
): TabState {
  const prior = tabStates.get(tabId);
  if (prior) pauseTimer(prior);
  const fresh = createTabState(tabId, newUrl, newTitle, favicon);
  if (focusedWindowId != null && activeTabId === tabId) startTimer(fresh);
  return fresh;
}
