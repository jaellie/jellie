# jellie — life simulation engine

**DESTINY + CHOICE + RANDOMNESS = LIFE**

This is the engine for a pixel-art life and romance simulation. Three hidden destiny systems are built in: **Saju (四柱八字)**, **Western Astrology** and **MBTI**. Each one is a `DestinyModifierSource`, and `createDestinyProfile()` computes all three from the birth data. See [docs/astrology-mbti.md](docs/astrology-mbti.md).

```
npm install
npm test            # unit + integration tests
npm run typecheck
npm run destiny  -- --birth 1997-09-28T09:30 --sex FEMALE --date 2026-09
npm run simulate -- --seed 12345 --birth 1997-09-28T09:30 --sex FEMALE --years 80
npm run world       # gym → friendships → Paris → return years later
npm run build:browser   # dist/lovesim-engine.js (window.LoveSim) for the Claude Design prototype
```

| Path | What |
|---|---|
| `src/core/` | `SeededRandom`, `GameDate`, the shared `LifeModifiers` vocabulary and combinators |
| `src/saju/calendar/` | Layer A: solar terms, Four Pillars |
| `src/saju/analysis/`, `src/saju/chart.ts` | Layer B: Day Master, elements, Ten Gods, interactions, shinsal, Daeun, 세운/월운 |
| `src/saju/interpretation/` | Layer C: `SajuModifierEngine` (data-driven) |
| `src/sim/` | Life state, `OpportunityEngine`, `EventEngine`, decision policies, `simulateLife` |
| `src/astrology/`, `src/mbti/`, `src/destiny/` | Western astrology (ephemeris, chart, transits, interpretation), MBTI persona + modifiers, the one-call destiny profile |
| `src/world/` | Living world: locations, backgrounds, NPC schedules, encounters, travel, memory (see [docs/world-system.md](docs/world-system.md)) |
| `src/integration/` | Adapter for the Claude Design prototype renderer |
| `src/debug/`, `src/ui/destiny/`, `src/ui/world/` | Debug explanations; the destiny screen view model (UI renders it without calling Saju math) |
| `data/saju/`, `data/astrology/`, `data/mbti/`, `data/sim/`, `data/world/` | All reference tables and balancing numbers |

See [docs/saju-engine.md](docs/saju-engine.md) for the rules, the interpretation model and how to extend it.
The `assets/` folder holds existing animation and audio assets and is untouched.
