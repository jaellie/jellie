# Pawprint 🐾

> 「猫の手も借りたい」(neko no te mo karitai) — "I'd even borrow a cat's paw."

Pawprint is an AI-assisted **external memory** for fragmented web browsing.
When you've had ten tabs open across an afternoon of research, shopping, or
planning, Pawprint helps you reconstruct *why* you opened them — without
ever pretending to know your intent with certainty. The human always
confirms the meaning of the trail; the AI only helps interpret it.

Pawprint is **not** an ADHD tool, a productivity tracker, a browser history
replacement, or a bookmark manager.

The conceptual model:

```
TAB → ACTIVITY → PAWPRINT TRAIL → BROWSING JOURNEY → POSSIBLE GOAL → USER CONFIRMATION → MEMORY
```

## Everything runs locally

No accounts, no cloud sync, no servers. Pawprint is an unpacked Chrome
extension that stores everything in `chrome.storage.local` on your machine.
The "AI" that proposes candidate goals and summaries is a deterministic,
offline heuristic (keyword/domain/time-based reasoning over your own
activity — see `src/shared/aiService.ts`) — nothing is sent anywhere.

## Install (load unpacked)

```bash
npm install
npm run build
```

Then in Chrome: `chrome://extensions` → enable **Developer mode** → **Load
unpacked** → select the generated `dist/` folder. Click the Pawprint toolbar
icon to open the side panel.

## How it decides what's "meaningful"

An activity is only ever recorded when **both** hold:

1. The tab was the active tab of a focused window for **≥ 60 seconds**
   (switching tabs pauses this timer rather than resetting it — time
   accumulates across visits).
2. At least one real interaction happened on the page: a click, a scroll,
   or a keystroke. Mouse movement, page load, and background-tab time never
   count.

Once ≥ 3 qualifying activities show enough time/topic/keyword overlap, they
form a **candidate journey**. Nothing is grouped or deleted silently —
weakly-related activities show up as "possibly unrelated" with explicit
`[Add to journey]` / `[Keep separate]` controls.

## Privacy

- Common sensitive sites (webmail, banking, password managers, private
  messaging, health) are excluded from tracking **by default** — no title,
  URL, or interaction data is ever recorded for them. Add your own excluded
  domains in Settings.
- Incognito windows are never tracked.
- Never stored: passwords, cookies, form contents, typed text, page body
  text, or any other page content — only URL, domain, title, timestamp,
  active duration, and which interaction *types* occurred.
- Pause tracking, delete an individual activity or journey, or wipe all
  browsing memory at any time from Settings — deletion is immediate and
  real.
- Ungrouped activity is auto-pruned after 7 days; activity that's part of a
  journey is kept until you delete it.

## Project structure

```
manifest.json                 MV3 manifest
src/
  shared/                      Pure, framework-free core logic
    types.ts                   Activity / Journey / Settings domain types
    qualification.ts           The 60s + interaction rule
    journeyGrouping.ts         Deterministic clustering (time/domain/keyword)
    aiService.ts                Goal-candidate / follow-up / summary generation
    sensitiveSites.ts          Default + custom excluded-site detection
    storage.ts                 chrome.storage.local wrapper + mutations
    messages.ts                Content-script ↔ background message types
  background/                  MV3 service worker
    tabState.ts                Per-tab active-time timer state machine
    activityEngine.ts          Qualification → persistence → regrouping
    index.ts                   chrome.tabs/windows/alarms wiring
  content/index.ts             Lightweight click/scroll/keyboard listeners
  sidepanel/                   React + Tailwind UI (Today / Journeys /
                                Journey detail / Goal confirmation / Settings)
tests/                         Vitest unit tests for qualification + grouping
scripts/
  generate-icons.mjs           Dependency-free PNG icon generator
  build-extension.mjs          esbuild (background/content) + vite (side panel)
```

## Development

```bash
npm run typecheck   # tsc --noEmit
npm test            # vitest (qualification + journey-grouping edge cases)
npm run build        # full production build into dist/
```

After changing background/content/sidepanel code, re-run `npm run build`
and click the reload icon for Pawprint on `chrome://extensions`.

## What's deliberately out of scope for this MVP

No authentication, cloud sync, sharing, notifications, autonomous browsing,
recommendation engine, embeddings/vector DB, hover tracking, payments, or
social features. Journey grouping is intentionally a simple, explainable
heuristic — the goal is to demonstrate the trail → journey → confirmed-goal
interaction loop, not to solve web-scale semantic understanding.
