# Western Astrology + MBTI

Both systems are **hidden**. The player enters a birth date (plus optional time, birthplace and MBTI), and everything else is calculated silently. Astrology follows the same three layers as Saju. MBTI is simpler: its data maps directly to personality numbers and modifiers.

```
birth data ─► SAJU ─────► DestinyModifierSource("SAJU")      ┐
          └─► ASTROLOGY ─► DestinyModifierSource("ASTROLOGY") ├─► OpportunityEngine / WorldEngine (probabilities)
MBTI ─────────────────────► DestinyModifierSource("MBTI")      ┘
     └──► Persona / Traits ─► decision policies + encounters (how the player chooses and socializes)
```

## Astrology (`src/astrology/`, `data/astrology/`)

| Layer | File | Contents |
|---|---|---|
| A. Ephemeris | `ephemeris.ts` | Geocentric tropical positions for Sun through Pluto. Planets use the JPL Keplerian elements (1800–2050) with precession to date. The Sun uses the Meeus solar theory shared with Saju. The Moon uses a truncated Meeus series. Also computes the Ascendant and Midheaven. Tested against 2000-01-01 reference positions (within 0.6°, Moon within 1°). |
| B. Chart | `chart.ts` | Signs, whole-sign houses, element/modality balance, natal aspects, and transits (house, aspects to natal points, planetary returns). Without a birth time it uses solar whole-sign houses (the Sun's sign is the 1st house). The default birthplace is Seoul. |
| C. Interpretation | `interpretation.ts`, `modifierMappings.json` | Houses define life areas (for example, the 9th is travel, overseas and education). Planets set how strongly each house is activated (Jupiter expands, Saturn structures, Uranus disrupts). Aspects and returns add timing. |

Layer scales:

| Layer | Scale | What it covers |
|---|---|---|
| natal | 1.0 | The birth chart |
| annual | 0.5 | Slow planets: Jupiter through Pluto |
| monthly | 0.12 | Fast planets: Sun, Mercury, Venus, Mars |

Example: Jupiter moving through your 9th house raises the chances of travel, overseas and education opportunities. It raises chances only; nothing is forced.

## MBTI (`src/mbti/`, `data/mbti/mbti.json`)

MBTI works in three ways:

1. **Persona.** Each type maps to 11 dimensions, using the same names as the Claude Design prototype's `persona()`: `socialEnergy`, `socialInitiation`, `noveltySeeking`, `emotionalExpression`, `conflictAvoidance`, `planning`, `riskTolerance`, `independence`, `relationshipPacing`, `creativity` and `careerDrive`. A small seeded jitter means two ENFPs aren't identical.
2. **Decisions.** The persona shapes how the player chooses. Choice appeals can reference any persona dimension. For example, `relationshipPacing` makes "Get married" less appealing and "Not yet" more appealing, and `independence` pushes toward "Start the business". Personality also changes who you talk to in the world (`socialInitiation`) and which new places you try (`noveltySeeking`).
3. **Odds.** An `MBTI` modifier source shifts which opportunities appear. For example, E raises social, N raises change and travel, J raises stability, and P raises travel. Identity A or T adds a small extra effect.

Tests check that ENFP and ISTJ with the same birth chart and the same seeds live measurably different lives: an ENFP moves and joins social groups more often.

## One call: `createDestinyProfile`

```ts
const destiny = LoveSim.createDestinyProfile({
  birth: { year: 1997, month: 9, day: 28, hour: 9, minute: 30, sex: "FEMALE" }, // hour optional
  place: { lat: 37.57, lon: 126.98 },   // optional, default Seoul
  mbti: "ENFP",                          // optional
});
destiny.modifiersAt({ year: 2026, month: 6 }); // hidden SAJU + ASTROLOGY + MBTI blend → pass as `modifiers`
destiny.traits;                                // personality for decisions
```

In `simulateLife`, use `profile: { mbti: "ENFP", birthPlace }`. Pass `astrologyWeight`, `sajuWeight` or `mbtiWeight` to tune or disable a system (0 turns it off).

## Developer check

```
npm run destiny -- --birth 1997-09-28T09:30 --sex FEMALE --date 2026-06 --mbti ENFP
npm run simulate -- --seed 5 --years 40 --mbti ENFP --world true
```

Both commands print debug views for developers only; players never see them.
