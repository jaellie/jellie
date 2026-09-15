import { InteractionType, DEFAULT_SETTINGS, PawprintSettings } from "../shared/types";
import { isSensitiveUrl } from "../shared/sensitiveSites";
import { PawprintMessage } from "../shared/messages";

// Lightweight interaction tracking. This script never reads or stores page
// content, clicked text, or typed values — it only reports that a click,
// scroll, or keyboard interaction of some kind occurred, so the background
// worker can apply the 60-second-active + interaction qualification rule.

const SETTINGS_KEY = "pawprint_settings";

let disabled = false;
const sentTypes = new Set<InteractionType>();

function sendInteraction(type: InteractionType): void {
  if (disabled || sentTypes.has(type)) return;
  sentTypes.add(type);
  const message: PawprintMessage = { type: "PAWPRINT_INTERACTION", interaction: type };
  try {
    chrome.runtime.sendMessage(message);
  } catch {
    // Extension context invalidated (e.g. reloaded) — nothing to do.
  }
}

function attachListeners(): void {
  document.addEventListener("click", () => sendInteraction("click"), {
    capture: true,
    passive: true,
  });

  document.addEventListener("keydown", () => sendInteraction("keyboard"), {
    capture: true,
    passive: true,
  });

  let lastScrollY = window.scrollY;
  let ticking = false;
  document.addEventListener(
    "scroll",
    () => {
      if (disabled || sentTypes.has("scroll") || ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const delta = Math.abs(window.scrollY - lastScrollY);
        lastScrollY = window.scrollY;
        if (delta > 40) sendInteraction("scroll");
      });
    },
    { passive: true }
  );
}

async function init(): Promise<void> {
  if (!location.href.startsWith("http")) return;

  let settings: PawprintSettings = DEFAULT_SETTINGS;
  try {
    const result = await chrome.storage.local.get(SETTINGS_KEY);
    settings = (result[SETTINGS_KEY] as PawprintSettings) ?? DEFAULT_SETTINGS;
  } catch {
    return; // storage unavailable — fail closed, don't track.
  }

  if (settings.trackingPaused) return;
  if (isSensitiveUrl(location.href, settings.excludedDomains)) return;

  attachListeners();

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local" || !changes[SETTINGS_KEY]) return;
    const next = changes[SETTINGS_KEY].newValue as PawprintSettings | undefined;
    disabled = !!next?.trackingPaused;
  });
}

void init();
