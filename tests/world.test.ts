import { describe, expect, it } from "vitest";
import { SeededRandom } from "../src/core/rng";
import { emptyModifiers, type LifeModifiers } from "../src/core/lifeModifiers";
import { createLifeState, simulateLife, formatTimeline } from "../src/sim/simulateLife";
import { OpportunityEngine } from "../src/sim/opportunityEngine";
import type { LifeState } from "../src/sim/types";
import { LOCATIONS, validateCatalog, getLocation, npcPoolFor } from "../src/world/catalog";
import { BackgroundEngine } from "../src/world/backgroundEngine";
import { weatherFor, weekdayOf, worldTime } from "../src/world/clock";
import { createWorldState, isPresent, generateNpc } from "../src/world/npcs";
import { WorldEngine, type VisitResult } from "../src/world/worldEngine";
import { AutoWorldPolicy, resolveWorldEvent } from "../src/world/decisions";
import { runTrip } from "../src/world/travel";
import { worldModifierSource } from "../src/world/worldModifiers";
import { composeScene } from "../src/world/sceneComposer";
import { buildWorldViewModel, destinationsMenu } from "../src/ui/world/worldViewModel";
import type { WorldState } from "../src/world/types";
import { EXAMPLE_PLAYER } from "./fixtures";

function setup(seed = 1, profile = {}) {
  const state = createLifeState(EXAMPLE_PLAYER, { traits: { sociability: 0.6 }, money: 50, ...profile });
  state.age = 27;
  state.monthIndex = 27 * 12;
  const world = (state.world = createWorldState());
  return { state, world, rng: new SeededRandom(seed), engine: new WorldEngine() };
}

function gymYear(state: LifeState, world: WorldState, rng: SeededRandom, engine: WorldEngine, modifiers: LifeModifiers = emptyModifiers(), months = 12): VisitResult[] {
  const out: VisitResult[] = [];
  for (let m = 0; m < months; m++) {
    for (const day of [2, 9, 16, 23]) {
      out.push(engine.visit({ state, world, modifiers, rng, seed: 1 }, { locationId: "gym", activityId: "workout", date: { year: 2024 + Math.floor(m / 12), month: (m % 12) + 1, day }, hour: 19 }));
    }
  }
  return out;
}

describe("Location catalog (data-driven)", () => {
  it("is referentially valid", () => {
    expect(validateCatalog()).toEqual([]);
  });

  it("covers gyms, classes, cafes, beaches, workplaces, universities, travel and online", () => {
    const types = new Set(LOCATIONS.map((l) => l.type));
    for (const t of ["HOME", "GYM", "CLASS", "CAFE", "BEACH", "WORKPLACE", "UNIVERSITY", "TOURIST_SITE", "ONLINE", "AIRPORT", "HOTEL", "WEDDING_VENUE", "FAMILY_HOME"]) expect(types.has(t as never)).toBe(true);
    expect(getLocation("paris_eiffel_tower").activities).toEqual(expect.arrayContaining(["sightseeing", "photography", "walk", "meet_people", "date"]));
  });

  it("NPC pools are per-location with configured weights", () => {
    const gym = Object.fromEntries(npcPoolFor("gym").npcTypes.map((t) => [t.type, t.weight]));
    expect(gym).toMatchObject({ trainer: 10, regular_member: 30, new_member: 20, class_member: 20, visitor: 10 });
    expect(npcPoolFor("paris_eiffel_tower").npcTypes.find((t) => t.type === "tourist")!.weight).toBe(40);
    expect(npcPoolFor("cafe").npcTypes.map((t) => t.type)).not.toContain("trainer");
  });

  it("maps existing Claude Design prototype rooms", () => {
    for (const id of ["home", "office", "street", "park", "cafe", "beach", "cinema", "restaurant", "diner"]) {
      expect(LOCATIONS.some((l) => l.prototypeId === id)).toBe(true);
    }
  });
});

describe("BackgroundEngine", () => {
  const bg = new BackgroundEngine();
  it("time of day selects variants, and adds an overlay when no variant exists", () => {
    expect(bg.getBackground({ location: "gym", timeOfDay: "EVENING" }).background.id).toBe("gym_evening");
    expect(bg.getBackground({ location: "gym", timeOfDay: "NIGHT" }).background.id).toBe("gym_night");
    const cafeNight = bg.getBackground({ location: "cafe", timeOfDay: "NIGHT", weather: "CLEAR" });
    expect(cafeNight.background.id).toBe("cafe_day");
    expect(cafeNight.overlays.map((o) => o.condition)).toContain("NIGHT");
    expect(bg.getBackground({ location: "beach", timeOfDay: "EVENING" }).background.id).toBe("beach_sunset");
  });

  it("weather and season change backgrounds", () => {
    expect(bg.getBackground({ location: "cafe", timeOfDay: "DAY", weather: "RAIN" }).background.id).toBe("cafe_rain");
    expect(bg.getBackground({ location: "park", timeOfDay: "DAY", weather: "CLEAR", season: "SPRING" }).background.id).toBe("park_spring");
    expect(bg.getBackground({ location: "home", timeOfDay: "DAY", weather: "CLEAR", season: "WINTER" }).background.id).toBe("home_winter");
    const streetNightRain = bg.getBackground({ location: "street", timeOfDay: "NIGHT", weather: "RAIN" });
    expect(streetNightRain.background.id).toBe("street_rain"); // weather outranks time …
    expect(streetNightRain.overlays.map((o) => o.condition)).toContain("NIGHT"); // … time becomes an overlay
  });

  it("activity-specific framing and procedural prototype renderers", () => {
    expect(bg.getBackground({ location: "cafe", activityId: "sit_alone", timeOfDay: "DAY" }).background.id).toBe("cafe_window");
    expect(bg.getBackground({ location: "airport", activityId: "arrive", timeOfDay: "DAY" }).background.id).toBe("airport_arrival");
    expect(bg.getBackground({ location: "cafe", timeOfDay: "DAY" }).background.renderer).toBe("ROOMS.cafe");
  });
});

describe("World clock", () => {
  it("weekday, season, deterministic weather", () => {
    expect(weekdayOf(2024, 1, 1)).toBe(1); // Monday
    const t = worldTime(5, { year: 2024, month: 7, day: 3 }, 19);
    expect(t).toMatchObject({ season: "SUMMER", timeOfDay: "EVENING", weekday: 3 });
    expect(weatherFor(5, { year: 2024, month: 7, day: 3 }, "paris")).toBe(weatherFor(5, { year: 2024, month: 7, day: 3 }, "paris"));
    const winter = Array.from({ length: 60 }, (_, i) => weatherFor(9, { year: 2024, month: 1, day: (i % 28) + 1 }, `r${i}`));
    expect(winter).toContain("SNOW");
    expect(Array.from({ length: 60 }, (_, i) => weatherFor(9, { year: 2024, month: 7, day: (i % 28) + 1 }, `r${i}`))).not.toContain("SNOW");
  });
});

describe("NPC schedules", () => {
  it("an NPC is only present where their schedule puts them", () => {
    const world = createWorldState();
    const rng = new SeededRandom(1);
    const ren = generateNpc(world, rng, {
      type: "regular_member",
      region: "home_city",
      date: { year: 2024, month: 1 },
      aroundAge: 28,
      persistence: "PERSISTENT",
      schedule: {
        weekday: [
          { locationId: "home", startHour: 7, endHour: 8 },
          { locationId: "office", startHour: 9, endHour: 18 },
          { locationId: "gym", startHour: 18, endHour: 19, attendance: 1 },
          { locationId: "home", startHour: 20, endHour: 22 },
        ],
        weekend: [],
      },
    });
    const at = (day: number, hour: number) => worldTime(1, { year: 2024, month: 1, day }, hour);
    expect(isPresent(ren, "gym", at(3, 18), rng)).toBe(true); // Wednesday 18:00
    expect(isPresent(ren, "gym", at(3, 11), rng)).toBe(false);
    expect(isPresent(ren, "gym", at(6, 18), rng)).toBe(false); // Saturday
    expect(isPresent(ren, "cafe", at(3, 18), rng)).toBe(false);
  });
});

describe("Recurring encounters & relationships", () => {
  it("the same regulars recur; familiarity and encounter history persist", () => {
    const { state, world, rng, engine } = setup(3);
    gymYear(state, world, rng, engine);
    const histories = Object.values(world.encounters).filter((h) => h.locationId === "gym");
    const top = histories.sort((a, b) => b.encounterCount - a.encounterCount)[0];
    expect(top.encounterCount).toBeGreaterThanOrEqual(10);
    expect(top.familiarity).toBeGreaterThan(0.5);
    expect(top.firstSeen).not.toEqual(top.lastSeen);
    expect(world.locationMemory.gym.visitCount).toBe(48);
  });

  it("progression: familiar face → acquaintance → friendship, with stored origins", () => {
    let sawFamiliar = 0, friends = 0;
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      const { state, world, rng, engine } = setup(seed);
      const visits = gymYear(state, world, rng, engine, emptyModifiers(), 18);
      sawFamiliar += visits.flatMap((v) => v.events).filter((e) => e.kind === "FAMILIAR_FACE" || e.kind === "RECOGNIZED").length;
      for (const rel of Object.values(world.relationships)) {
        expect(rel.origin.firstEncounterDate).toBeDefined();
        if (rel.origin.locationId === "gym") expect(["GYM", "PERSONAL_TRAINER", "RANDOM_ENCOUNTER", "RECURRING_STRANGER"]).toContain(rel.origin.type);
        if (["FRIEND", "CLOSE_FRIEND"].includes(rel.stage)) friends++;
      }
    }
    expect(sawFamiliar).toBeGreaterThan(0);
    expect(friends).toBeGreaterThan(0);
  });

  it("recurring NPCs do NOT all become romance options", () => {
    let known = 0, romance = 0;
    for (const seed of [11, 12, 13, 14, 15]) {
      const { state, world, rng, engine } = setup(seed);
      const visits = gymYear(state, world, rng, engine, emptyModifiers(), 18);
      known += Object.keys(world.relationships).length;
      romance += new Set(visits.flatMap((v) => v.events).filter((e) => e.kind === "ROMANCE_OPPORTUNITY").map((e) => e.npcId)).size;
    }
    expect(known).toBeGreaterThan(romance * 2);
  });

  it("locations can (and usually do) produce nothing", () => {
    const { state, world, rng, engine } = setup(4);
    const visits = gymYear(state, world, rng, engine);
    const quiet = visits.filter((v) => v.nothingHappened).length;
    expect(quiet / visits.length).toBeGreaterThan(0.35);
    expect(visits.some((v) => v.events.some((e) => e.kind === "LOCATION_EVENT"))).toBe(true);
  });

  it("destiny modifiers change encounter probabilities (not outcomes directly)", () => {
    const count = (mods: Partial<LifeModifiers>) => {
      let n = 0;
      for (const seed of [21, 22, 23, 24]) {
        const { state, world, rng, engine } = setup(seed);
        const visits = gymYear(state, world, rng, engine, { ...emptyModifiers(), ...mods });
        n += Object.values(world.relationships).reduce((s, r) => s + r.conversations, 0);
      }
      return n;
    };
    expect(count({ social: 0.8, romance: 0.5 })).toBeGreaterThan(count({ social: -0.8, romance: -0.5 }));
  });

  it("closed hours block the visit", () => {
    const { state, world, rng, engine } = setup();
    const r = engine.visit({ state, world, modifiers: emptyModifiers(), rng, seed: 1 }, { locationId: "cafe", date: { year: 2024, month: 3, day: 3 }, hour: 3 });
    expect(r.closedReason).toBeDefined();
    expect(r.events[0].kind).toBe("CLOSED");
  });
});

describe("Online → offline", () => {
  it("online relationships can become offline ones", () => {
    let converted = false;
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const { state, world, rng, engine } = setup(seed, { traits: { sociability: 0.9 } });
      for (let m = 0; m < 12 && !converted; m++) {
        for (const day of [1, 5, 9, 13, 17, 21]) {
          const r = engine.visit({ state, world, modifiers: emptyModifiers(), rng, seed }, { locationId: "language_exchange_app", activityId: "chat", date: { year: 2024, month: m + 1, day }, hour: 21 });
          const e = r.events.find((x) => x.kind === "ONLINE_MEETUP");
          if (e) {
            resolveWorldEvent(e, "MEET", { state, world, modifiers: emptyModifiers(), rng });
            expect(world.relationships[e.npcId!].metOffline).toBe(true);
            expect(world.relationships[e.npcId!].channel).toBe("IN_PERSON");
            expect(world.relationships[e.npcId!].origin.type).toMatch(/LANGUAGE_EXCHANGE_APP|RANDOM_ENCOUNTER|RECURRING_STRANGER/);
            converted = true;
            break;
          }
        }
      }
    }
    expect(converted).toBe(true);
  });
});

describe("Travel: temporary but persistent worlds", () => {
  it("a Paris trip creates a temporary world, then dissolves it but keeps memories", () => {
    const { state, world, rng } = setup(2);
    const res = runTrip({ state, world, modifiers: emptyModifiers(), rng, seed: 2 }, "paris", { year: 2026, month: 6, day: 5 }, new AutoWorldPolicy());
    expect(res.visits[0].locationId).toBe("airport");
    expect(res.visits.at(-1)!.background.background.id).toBe("airport_arrival");
    expect(res.trip.visitedLocations.some((l) => l.startsWith("paris_"))).toBe(true);
    expect(res.trip.mementos.length).toBeGreaterThan(0);
    expect(world.travel).toBeUndefined();
    expect(world.pastTrips).toHaveLength(1);
    // Temporary NPCs are gone unless you kept in touch.
    for (const id of res.trip.temporaryNPCs) if (!res.keptContacts.includes(id)) expect(world.npcs[id]).toBeUndefined();
    for (const id of res.keptContacts) expect(world.relationships[id].channel).toBe("ONLINE");
    // …but the places are remembered.
    expect(Object.keys(world.locationMemory).some((l) => l.startsWith("paris_"))).toBe(true);
    expect(state.memories.some((m) => m.tags.includes("paris"))).toBe(true);
  });

  it("returning years later triggers a memory callback", () => {
    const { state, world, rng, engine } = setup(3);
    const ctx = { state, world, modifiers: emptyModifiers(), rng, seed: 3 };
    engine.visit(ctx, { locationId: "paris_eiffel_tower", date: { year: 2026, month: 6, day: 5 }, hour: 12 });
    world.locationMemory.paris_eiffel_tower.importantEvents.push("Met Alex during a solo trip.");
    const later = engine.visit(ctx, { locationId: "paris_eiffel_tower", date: { year: 2035, month: 6, day: 5 }, hour: 12 });
    const cb = later.events.find((e) => e.kind === "MEMORY_CALLBACK");
    expect(cb?.text.en).toContain("Met Alex during a solo trip.");
    expect(world.locationMemory.paris_eiffel_tower.visitCount).toBe(2);
  });
});

describe("Activities change future opportunities", () => {
  it("foreign friends + language practice raise overseas opportunities through the WORLD source", () => {
    const { state, world, rng } = setup();
    const before = worldModifierSource(world).modifiers.overseas ?? 0;
    for (let i = 0; i < 3; i++) {
      const n = generateNpc(world, rng, { type: "language_partner", region: "home_city", date: { year: 2024, month: 1 }, aroundAge: 27, persistence: "PERSISTENT" });
      n.foreign = true;
      world.relationships[n.id] = { npcId: n.id, stage: "FRIEND", closeness: 0.6, spark: 0, conversations: 8, origin: { type: "LANGUAGE_EXCHANGE_APP", locationId: "language_exchange_app", firstEncounterDate: { year: 2024, month: 1 } }, lastContact: { year: 2024, month: 1 }, channel: "ONLINE", metOffline: false };
    }
    world.experience.language = 120;
    const src = worldModifierSource(world);
    expect(src.modifiers.overseas!).toBeGreaterThan(before + 0.2);
    expect(src.breakdown!.some((m) => m.source.includes("foreign_connections"))).toBe(true);

    state.education = "BACHELOR";
    const p = (sources: Parameters<OpportunityEngine["evaluate"]>[1]) =>
      new OpportunityEngine().evaluate(state, sources, new SeededRandom(1)).find((c) => c.template.id === "STUDY_ABROAD_GRAD")!.opportunity.score.probability;
    expect(p([src])).toBeGreaterThan(p([]));
  });
});

describe("Scene composition & world view model", () => {
  it("backgrounds and characters are separate; UI gets pure data", () => {
    const { state, world, rng, engine } = setup(5);
    const visit = engine.visit({ state, world, modifiers: emptyModifiers(), rng, seed: 5 }, { locationId: "gym", activityId: "workout", date: { year: 2024, month: 4, day: 3 }, hour: 19 });
    const scene = composeScene(visit, world, state);
    expect(scene.background.id).toBe("gym_evening");
    expect(scene.actors[0].kind).toBe("player");
    expect(scene.actors.filter((a) => a.kind === "npc").length).toBe(visit.present.length);
    expect(scene.props.map((p) => p.id)).toEqual(["gym_treadmills"]); // props inherited from gym_day
    expect(scene.background.layers.map((l) => l.id)).not.toContain("gym_treadmills");
    const vm = buildWorldViewModel({ state, world, visit, lang: "en" });
    expect(vm.header.date).toBe("2024.04.03");
    expect(vm.header.age).toBe("AGE 27");
    expect(vm.actions.at(-1)!.id).toBe("LEAVE");
    expect(vm.locationName).toBe("Gym");
    expect(destinationsMenu(world, 19).some((d) => d.id === "gym" && d.open)).toBe(true);
  });
});

describe("Full life with a living world", () => {
  it("is reproducible per seed and weaves world events into the life", () => {
    const opts = { seed: 99, birthData: EXAMPLE_PLAYER, duration: 40, world: true as const, profile: { traits: { sociability: 0.7, novelty: 0.7 }, money: 10 } };
    const a = simulateLife(opts);
    const b = simulateLife(opts);
    expect(formatTimeline(a)).toBe(formatTimeline(b));
    expect(a.timeline.some((e) => e.kind === "WORLD")).toBe(true);
    const w = a.finalState.world!;
    expect(Object.values(w.locationMemory).reduce((s, m) => s + m.visitCount, 0)).toBeGreaterThan(300);
    expect(Object.values(w.relationships).length).toBeGreaterThan(0);
    const c = simulateLife({ ...opts, seed: 100 });
    expect(formatTimeline(c)).not.toBe(formatTimeline(a));
  });
});

describe("Claude Design prototype adapter", () => {
  it("maps scenes onto ROOMS painters, overlays and sprite roles", async () => {
    const { toPrototypeScene } = await import("../src/integration/prototype");
    const { state, world, rng, engine } = setup(8);
    const v = engine.visit({ state, world, modifiers: emptyModifiers(), rng, seed: 8 }, { locationId: "cafe", activityId: "drink_coffee", date: { year: 2024, month: 5, day: 4 }, hour: 21 });
    const p = toPrototypeScene(composeScene(v, world, state));
    expect(p.roomKey).toBe("cafe");
    expect(p.overlays.map((o) => o.condition)).toContain("NIGHT");
    expect(p.actors[0].who).toBe("me");
    const gym = toPrototypeScene(composeScene(engine.visit({ state, world, modifiers: emptyModifiers(), rng, seed: 8 }, { locationId: "gym", date: { year: 2024, month: 5, day: 6 }, hour: 19 }), world, state));
    expect(gym.roomKey).toBeUndefined(); // not painted yet → use assetPath / baseColor
    expect(gym.assetPath).toBe("assets/bg/gym/gym_evening.png");
  });
});
