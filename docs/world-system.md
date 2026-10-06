# Living World: Locations, Backgrounds, NPCs and Travel

> **A location is not a background image. A location is a living simulation context.**

```
LOCATION ─► BACKGROUND ─► ACTIVITIES ─► NPC POOL ─► NPC SCHEDULES ─► ENCOUNTERS
   ─► EVENTS (usually none) ─► RELATIONSHIPS ─► MEMORIES ─► FUTURE CONSEQUENCES
                                                              │
                          WORLD modifier source ◄─────────────┘  (feeds OpportunityEngine)
```

## Modules (`src/world/`)

| File | Role |
|---|---|
| `catalog.ts` | Typed registries over `data/world/*.json`, plus `validateCatalog()` |
| `clock.ts` | `WorldTime`: weekday, season, time of day, and deterministic weather per region |
| `backgroundEngine.ts` | `backgroundEngine.getBackground({ location, activityId, timeOfDay, weather, season })` |
| `sceneComposer.ts` | Composes a scene from a background, overlays, character sprites on spots, and props. No per-combination art is needed |
| `npcs.ts` | Persistent regulars and staff (generated lazily per location), temporary passers-by, schedules, presence |
| `encounters.ts` | Encounter history, familiarity, conversations, friendship, romance (rare), invitations, foreign-friend trips |
| `worldEngine.ts` | `WorldEngine.visit()`: one visit to one place at one time |
| `decisions.ts` | Choices on world events: `resolveWorldEvent`, and `AutoWorldPolicy` for simulations |
| `travel.ts` | `runTrip`: temporary world instances (airport → hub → sights → airport) |
| `routine.ts` | A month of lived life: habits, work/school, outings, dates, family, trips |
| `worldModifiers.ts` | A `DestinyModifierSource("WORLD")` built from your social graph and experience |
| `../ui/world/worldViewModel.ts` | Main world screen data: header, scene, actions, log, popup |
| `../integration/prototype.ts` | `toPrototypeScene()` maps a scene onto the Claude Design prototype's `ROOMS` / overlays / `spr()` |

## Data (`data/world/`)

| File | What it contains |
|---|---|
| `locations.json` | 33 locations. `prototypeId` links to the prototype's `ROOMS`/`WBG`/`SPOTS` keys (`home`, `office`, `street`, `park`, `cafe`, `beach`, `cinema`, `restaurant`, `diner`, `amuse`, `tokyo`) |
| `backgrounds.json` | 72 background variants, the overlay definitions (the same night tint and rain stripes as the prototype's `world()`), and the art direction |
| `activities.json` | Activities: socialness, experience tags, affinity, `startsHabit` |
| `npcTypes.json` | NPC types (STAFF / REGULAR / TRANSIENT), origin types, and per-location pool weights (gym, university and Eiffel Tower as specified) |
| `destinations.json` | Travel instances (Paris, Tokyo, Seaside Town) |
| `climate.json` | Weather odds per region and season |
| `encounterRules.json` | Tuning for every progression step |

Adding a place, variant, activity or NPC type is a data change. React components never contain location logic.

## Background selection

A field set on a background must match the request, otherwise that background is excluded. The most specific remaining background wins: **activity 8 > weather 4 > time of day 2 > season 1**.

Anything the chosen art doesn't depict becomes an overlay. For example, `street_rain` at night gets the NIGHT tint. Variants inherit the base background's props and layers.

## Recurrence → relationships (never guaranteed)

- **Regulars.** They get schedules at the location. Gym regulars mostly come at 18–21, some in the morning. Class members share the class slot. The player's habits use the same slots (`habitSlot`), so the same people keep turning up.
- **Sightings.** Each one increases `encounterCount` and `familiarity`. The steps are:
  - second sighting: FAMILIAR_FACE
  - third: RECOGNIZED
  - a conversation roll: ACQUAINTANCE
  - after at least 6 conversations with enough closeness, plus a roll: FRIEND
  - then CLOSE_FRIEND
- **Romance.** It needs an eligible NPC, some history and a spark. Its probability is shaped by the `romance` modifier. Many friendships never reach it, and a "no" is possible.
- **Nothing.** Routine small talk counts as "nothing happened", and most visits produce nothing notable.
- **Fading and reunions.** Relationships you neglect fade to `LOST_CONTACT`. Revisiting an old place can bring a **reunion** or a **memory callback**.
- **Online.** Online relationships can become offline ones (`ONLINE_MEETUP` → MEET).
- **Origins.** Every relationship stores a `RelationshipOrigin`: type, location, first-encounter date and context.

## Destiny integration

`WorldEngine.visit()` takes the combined `LifeModifiers` (Saju now; Astrology and MBTI later).

- `social` scales conversation and friendship chances.
- `romance` scales spark and romantic chances.
- `overseas` scales connections with foreign NPCs.
- `travel` × `overseas` scales "come visit me" trips.
- `opportunity` and `volatility` scale how eventful a location is.

These are probabilities only. A player choice or policy decides every popup.

The loop runs both ways. Foreign friends, language practice, professional contacts, trips and routines all feed the `WORLD` modifier source. That source raises matching opportunities, such as study abroad or international jobs.

## Travel

`runTrip()` creates a `TravelState` with its own locations, temporary NPCs and weather. Seeing the same stranger twice on a trip still reads as "that person again".

When the trip ends:
- temporary NPCs disappear, unless you kept in touch, in which case they become online contacts
- mementos and memories stay
- `locationMemory` keeps visit counts, important events and people for later callbacks

## Using it in the Claude Design prototype

1. Run `npm run build:browser`. This builds `dist/lovesim-engine.js`, which exposes a global `LoveSim`.
2. Load that file in the prototype next to its existing engine scripts.
3. Per visit:

```js
const r = new LoveSim.WorldEngine().visit({ state, world, modifiers, rng, seed }, { locationId, activityId, date, hour });
const vm = LoveSim.buildWorldViewModel({ state, world, visit: r, lang });
const p = LoveSim.toPrototypeScene(vm.scene);
// p.roomKey  → ROOMS[p.roomKey]()   (else draw p.assetPath / p.baseColor)
// p.overlays → the same absolutely-positioned divs world() uses for night/rain
// p.actors   → spr() at X(i,j)/Y(i,j) with zIndex = actor.z
// vm.actions → buttons; vm.popup → the existing choice popup; vm.log → logLine
```

## Try it

- `npm run world` runs a scripted scenario: joining a gym, two years of visits, a Paris trip, and a return nine years later.
- `simulateLife({ ..., world: true })` runs a full life inside the living world. WORLD entries appear in the timeline.
