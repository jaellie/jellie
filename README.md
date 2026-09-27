# jellie — life simulation engine

**DESTINY + CHOICE + RANDOMNESS = LIFE**

This is the engine for a pixel-art life and romance simulation. The first destiny system implemented is **Saju (四柱八字)**. Western Astrology and MBTI will plug into the same `DestinyModifierSource` path later.

```
npm install
npm test            # unit + integration tests
npm run typecheck
npm run destiny  -- --birth 1997-09-28T09:30 --sex FEMALE --date 2026-09
npm run simulate -- --seed 12345 --birth 1997-09-28T09:30 --sex FEMALE --years 80
```

| Path | What |
|---|---|
| `src/core/` | `SeededRandom`, `GameDate`, the shared `LifeModifiers` vocabulary and combinators |
| `src/saju/calendar/` | Layer A: solar terms, Four Pillars |
| `src/saju/analysis/`, `src/saju/chart.ts` | Layer B: Day Master, elements, Ten Gods, interactions, shinsal, Daeun, 세운/월운 |
| `src/saju/interpretation/` | Layer C: `SajuModifierEngine` (data-driven) |
| `src/sim/` | Life state, `OpportunityEngine`, `EventEngine`, decision policies, `simulateLife` |
| `src/debug/`, `src/ui/destiny/` | Debug explanations; the destiny screen view model (UI renders it without calling Saju math) |
| `data/saju/`, `data/sim/` | All reference tables and balancing numbers |

See [docs/saju-engine.md](docs/saju-engine.md) for the rules, the interpretation model and how to extend it.
The `assets/` folder holds existing animation and audio assets and is untouched.
