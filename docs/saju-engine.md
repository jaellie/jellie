# Saju (四柱八字) Simulation Engine

> **Saju does not write the player's story. Saju changes the shape of the world. The player lives in that world.**

The Saju system is a fictional destiny layer. It **shifts probabilities** in the simulation.
It never creates an event, and it never predicts anything about real life.

## Pipeline

```
BirthData
  │  Layer A  src/saju/calendar/      (astronomy + pillar rules, no gameplay)
  ▼
FourPillars
  │  Layer B  src/saju/analysis/ + src/saju/chart.ts   (traditional analysis, no gameplay)
  ▼
SajuChart { fourPillars, dayMaster, elementBalance, tenGods, natalInteractions, shinsal, daeun }
  + getCurrentFortune(chart, date) → { daeun, annual (세운), monthly (월운) }     (memoized)
  │  Layer C  src/saju/interpretation/   (data-driven: data/saju/modifierMappings.json, interpretationRules.json)
  ▼
LifeModifiers  (+ per-source trace)  ──► DestinyModifierSource("SAJU")
                                            │   merged with PERSONALITY now, ASTROLOGY / MBTI later
                                            ▼
                         OpportunityEngine (src/sim/opportunityEngine.ts)
                           score = base × Π exp(Σ affinity·delta) per source
                                 × life stage × relationship × finances × family × world × history × random
                                            ▼
                         EventEngine: seeded roll + weighted selection (max 2 per month)
                                            ▼
                         DecisionMaker (player UI, or AutoDecisionPolicy in the simulation)
                           choice requirements can BLOCK options (money, family support…)
                           alternatives REDIRECT (local grad school, business trips instead of moving)
                                            ▼
                         consequences → state / NPCs / memories → future eligibility
```

Saju is never an input to the decision policy, so destiny can always be refused.

## Layer A — calendar rules (`src/saju/calendar/`)

| Pillar | Rule |
|---|---|
| Year | Changes at **立春** (Sun apparent longitude 315°), not Jan 1 or Lunar New Year. 4 CE = 甲子. |
| Month | Changes at each **節** (315° + 30°·n). Stem from **五虎遁** (甲/己 year → 丙寅 …). |
| Day | Continuous 60-day cycle: `(JDN + 49) mod 60` (2000-01-01 = 戊午, 1949-10-01 = 甲子). |
| Hour | 12 double-hours, 子 = 23:00–00:59. Stem from **五鼠遁** (甲/己 day → 甲子 …). |

Options (`PillarCalculationOptions`):
- `ziHourDayBoundary`: `"23:00"` (default, 子初換日) or `"00:00"` (야자시). In both cases the 23:xx hour stem comes from the next day.
- `useTrueSolarTime` plus `BirthData.longitude`: uses local mean solar time (e.g. Seoul, 127°E, is about 32 min behind KST).
- `BirthData.utcOffsetMinutes` defaults to 540 (KST). Pass historical DST offsets explicitly.

Accuracy: the solar longitude comes from Meeus ch. 25 plus a ΔT polynomial. It is typically within **about 10 minutes** of published solar-term times (tested: 立春 2024). If a birth falls within 30 minutes of a 節, the result sets `nearSolarTermBoundary: true`.

## Layer B — analysis (`src/saju/analysis/`)

- **Five Elements** (`fiveElements.ts`). All generation and control logic goes through `getGeneratingElement`, `getGeneratedByElement`, `getControllingElement`, `getControlledElement` and `getElementRelationship`, driven by `data/saju/fiveElements.json`.
- **Distribution weighting.** Each visible stem counts 1. Each branch counts 1, split across its hidden stems (지장간) by the weights in `earthlyBranches.json`. The month branch counts ×2 (월령). The result is reported as percentages.
- **Day Master strength** (`dayMaster.ts`). This is the share of element mass that supports the Day Master (比劫 + 印), excluding the day stem itself. ≥ 0.50 is STRONG, < 0.35 is WEAK, anything else is BALANCED.
- **Favorable / unfavorable** (`EOKBU_SIMPLIFIED`). A simplified 억부 model:
  - STRONG favors 食傷/財/官.
  - WEAK favors 印/比劫.
  - BALANCED favors the weakest element.
  - 조후 and 격국 are **not** modeled. The logic is isolated in `calculateElementBalance`.
- **Ten Gods** (`tenGods.ts`). Derived from element relation plus polarity against the Day Master (`tenGods.json`). Branches use the main qi for the label and all hidden stems for the distribution.
- **Interactions** (`relations.ts`). 天干合/沖, 六合, 三合 and half-三合 (must include the 旺 branch), 六沖, 六害, 刑. Tables live in `relations.json`.
- **Shinsal** (`shinsal.ts`). Modular: rules are data (`shinsal.json`) and each rule `type` has one small evaluator.
  - `SAMHAP_GROUP_TARGET` covers 驛馬 / 桃花 / 華蓋, looked up from the year and day branches.
  - `STEM_TO_BRANCHES` covers 天乙貴人, looked up from the day and year stems.
  - Strength is the sum of reference weight × position weight, clamped to 1.
  - Transit pillars (Daeun/annual/monthly) can **activate** shinsal, for example a 驛馬 year.
- **Daeun** (`daeun.ts`).
  - Direction: a yang year stem with male sex, or a yin year stem with female sex, runs FORWARD. Otherwise it runs BACKWARD.
  - Start age: days to the next or previous 節 divided by 3 (`daeunRules.json`). Both the exact and the conventional rounded 대운수 are exposed.
  - Pillars step ±1 from the month pillar.
- **Annual / Monthly** (`fortune.ts`).
  - The 세운 of year Y is the Saju year starting at 立春 of Y, so January belongs to the previous one.
  - The 월운 of a Gregorian month is the solar month in force on the 15th.
  - Results are memoized per chart.

A `SajuChart` contains **no gameplay values**; a test enforces this.

## Layer C — interpretation (`src/saju/interpretation/`)

`LifeModifiers` values are **log-scale deltas**: 0 is neutral and +0.25 means about ×1.28 likelihood. Sources add, and the multipliers compose as `exp(sum)`. Each key is clamped to ±1.5 after merging.

| Layer | Scale | What it reads |
|---|---|---|
| natal | 1.0 | Ten God group prominence `(share − 20)/20`, per-god accents, shinsal × strength, DM strength class, natal interactions × 0.4 |
| daeun | 0.6 | Ten Gods of the Daeun stem and branch, favorable/unfavorable elements, activated shinsal, interactions with the natal chart |
| annual | 0.45 | same, for the year pillar |
| monthly | 0.15 | same, kept light |
| synergy | 1.0 | Combination rules such as **官 + 印 + 驛馬** → overseas/education/career pool (`interpretationRules.json`), evaluated on a natal + Daeun + annual blend |

All numbers are in `data/saju/modifierMappings.json` and `interpretationRules.json`, so balancing needs no code change. `SajuModifierEngine.calculateDetailed()` returns the final modifiers, per-layer totals and the full trace (`Modifier { key, value, source }`).

## Adding Astrology / MBTI later

Produce a `DestinyModifierSource` (`{ source: "ASTROLOGY", modifiers, weight?, breakdown? }`) and pass it through `simulateLife({ extraSources })`, or add it to the `sources` array given to `OpportunityEngine.evaluate`. No Saju code changes, and no cross-system `if` chains. `src/sim/personality.ts` already shows this path with the trait-based placeholder.

## Extending

- **New shinsal of an existing type:** add an entry to `data/saju/shinsal.json` and a mapping in `modifierMappings.json#shinsal`.
- **New shinsal rule type:** add one evaluator to `RULE_EVALUATORS`.
- **New opportunity:** add a template to `data/sim/opportunities.json`. Give it an affinity to modifier keys, requirements, soft circumstances, and choices with appeal and consequences.

## Debugging and balancing

```
npm run destiny  -- --birth 1995-02-06T10:00 --sex MALE --date 2020-05   # destiny screen + layer debug
npm run simulate -- --seed 12345 --birth 1997-09-28T09:30 --sex FEMALE --years 80 --explain STUDY_ABROAD_GRAD
```

- `formatSajuDebug` prints the natal signals, each layer's top deltas and the final multipliers.
- `explainOpportunity` answers **"why did this happen?"**: base probability, each factor, the top Saju origins, and the seeded roll.

## Tests

`npm test` covers:
- the calendar (reference charts, 立春 timing, 五虎遁/五鼠遁, zi-hour options, true solar time)
- elements, the Day Master and Ten Gods
- interactions and shinsal
- Daeun direction, timing and sequence
- annual and monthly pillars, and memoization
- modifier rules (Yeokma → mobility, 官 → career, 印 → education, 桃花 → romance/social, synergy)
- integration (Saju → modifiers → opportunities → events)
- choice override (refusing destiny)
- financial blocking
- Player A vs Player B divergence
- seeded reproducibility
