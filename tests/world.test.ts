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
    world.locationMemory.paris_eiffel_tower.importantEvents.push({ ko: "혼자 여행하다 Alex를 만났다.", en: "Met Alex during a solo trip." });
    const later = engine.visit(ctx, { locationId: "paris_eiffel_tower", date: { year: 2035, month: 6, day: 5 }, hour: 12 });
    const cb = later.events.find((e) => e.kind === "MEMORY_CALLBACK");
    expect(cb?.text.en).toContain("Met Alex during a solo trip.");
    expect(cb?.text.ko).toContain("혼자 여행하다 Alex를 만났다.");
    expect(world.locationMemory.paris_eiffel_tower.visitCount).toBe(2);
    // An English-only memory (old save) is never quoted — it would show English in the Korean game.
    world.locationMemory.paris_eiffel_tower.importantEvents.push("Someone mentioned an overseas project.");
    const again = engine.visit(ctx, { locationId: "paris_eiffel_tower", date: { year: 2045, month: 6, day: 5 }, hour: 12 });
    expect(again.events.find((e) => e.kind === "MEMORY_CALLBACK")).toBeUndefined();
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
    expect(vm.header.age).toBe("27 y/o");
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
    // Not painted yet → the closest existing painter stands in (never a blank background).
    expect(gym.roomKey).toBe("office");
    expect(gym.standIn).toBe(true);
    expect(gym.sceneKey).toBe("gym");
    expect(gym.bgId).toBe("gym_evening");
    expect(gym.assetPath).toBe("assets/bg/gym/gym_evening.png");
  });
});

describe("Every place has a background the prototype can draw", () => {
  it("each background variant maps to an existing painter (its own, or the closest stand-in)", async () => {
    const { toPrototypeScene } = await import("../src/integration/prototype");
    const bgData = (await import("../data/world/backgrounds.json")).default as { backgrounds: Array<{ id: string; locationId: string; assetPath: string; renderer?: string; status?: string }> };
    const PAINTERS = ["amuse", "beach", "cafe", "cinema", "diner", "home", "office", "park", "restaurant", "street", "tokyo"];
    for (const loc of LOCATIONS) {
      for (const bg of bgData.backgrounds.filter((b) => b.locationId === loc.id)) {
        const ps = toPrototypeScene({ size: [360, 642], locationId: loc.id, background: { ...bg, layers: [] }, overlays: [], actors: [], props: [], ...(loc.online ? { online: true } : {}) });
        expect(PAINTERS, `${loc.id}/${bg.id}`).toContain(ps.roomKey);
        expect(ps.sceneKey).toBe(loc.id);
        expect(ps.bgId).toBe(bg.id);
        expect(ps.standIn).toBe(!loc.prototypeId && !(bg.renderer ?? "").startsWith("ROOMS."));
      }
    }
  });
});

describe("Online places", () => {
  it("are you at home on your phone: the player (and household) in the home room, nobody from the internet in it", async () => {
    const { toPrototypeScene } = await import("../src/integration/prototype");
    const { state, world, rng, engine } = setup(5);
    state.pets = [{ id: "pet1", name: "콩이", species: "CAT", alive: true, spriteSeed: 3 } as never];
    for (const loc of LOCATIONS.filter((l) => l.online)) {
      for (let h = 9; h <= 21; h += 4) {
        const v = engine.visit({ state, world, modifiers: emptyModifiers(), rng, seed: 5 }, { locationId: loc.id, date: { year: 2024, month: 6, day: 8 }, hour: h });
        const ps = toPrototypeScene(composeScene(v, world, state));
        expect(ps.online, loc.id).toBe(true);
        expect(ps.roomKey, loc.id).toBe("home");
        expect(ps.sceneKey).toBe(loc.id);
        const roles = ps.actors.map((a) => a.role);
        expect(roles, loc.id).toContain("me");
        expect(roles, loc.id).toContain("pet");
        expect(roles.filter((r) => r === "npc" || r === "passerby" || r === "fated"), loc.id).toEqual([]);
        expect(ps.focus.bottom).toBeGreaterThan(ps.focus.top);
      }
    }
    // A real place is not online.
    const cafe = toPrototypeScene(composeScene(engine.visit({ state, world, modifiers: emptyModifiers(), rng, seed: 5 }, { locationId: "cafe", date: { year: 2024, month: 6, day: 8 }, hour: 15 }), world, state));
    expect(cafe.online).toBeUndefined();
  });
});

describe("Crowds don't grow old with the player", () => {
  it("at 70, the café still has young regulars; people you know stay (and age with you); kids never become friends", () => {
    const { state, world, rng, engine } = setup(21);
    const visitAt = (year: number, loc = "cafe") => engine.visit({ state, world, modifiers: emptyModifiers(), rng, seed: 21 }, { locationId: loc, activityId: loc === "cafe" ? "drink_coffee" : undefined, date: { year, month: 5, day: 4 }, hour: 15 });
    visitAt(2024);
    const first = [...world.populated.cafe];
    // Befriend one regular.
    const friendId = first[first.length - 1];
    world.relationships[friendId] = { npcId: friendId, stage: "FRIEND", closeness: 0.6, spark: 0, conversations: 8, origin: { type: "CAFE", locationId: "cafe", firstEncounterDate: { year: 2024, month: 5, day: 4 } }, lastContact: { year: 2024, month: 5, day: 4 }, channel: "IN_PERSON", metOffline: true };
    for (let y = 2025; y <= 2070; y += 3) visitAt(y);
    const now = world.populated.cafe.map((id) => world.npcs[id]);
    const ages = now.map((n) => 2070 - n.birthYear);
    expect(world.populated.cafe).toContain(friendId); // the friend is still around…
    expect(2070 - world.npcs[friendId].birthYear).toBeGreaterThan(55); // …and has aged with you
    expect(Math.min(...ages)).toBeLessThan(45); // but the crowd is mixed, not all elderly
    const known = (id: string) => !["STRANGER", "FAMILIAR_FACE", undefined].includes(world.relationships[id]?.stage);
    expect(first.filter((id) => !known(id)).every((id) => !world.populated.cafe.includes(id))).toBe(true); // strangers moved on
    // Nobody works behind the counter past retirement age, even someone you know.
    for (const n of now) if (n.anchoredTo === "cafe") expect(2070 - n.birthYear).toBeLessThanOrEqual(62);
    // The park has children; none of them becomes an adult's friend.
    for (let y = 2030; y <= 2060; y += 2) visitAt(y, "park");
    const kids = Object.values(world.npcs).filter((n) => 2060 - n.birthYear < 16 && world.populated.park?.includes(n.id));
    for (const k of kids) expect(world.relationships[k.id]?.stage ?? "STRANGER").toMatch(/STRANGER|FAMILIAR_FACE/);
  });
});

describe("Kairosoft-style walking", () => {
  it("everyone walks tile by tile; NPCs sometimes step off-screen and come back; the player never leaves; staff stay by their post", async () => {
    const { stepCrowd } = await import("../src/world/walkers");
    const { inStage, STAGE } = await import("../src/world/stage");
    type CrowdActor = import("../src/world/walkers").CrowdActor;
    const actors = [
      { who: "me", spot: [4.5, 4.5] as [number, number], z: 90, role: "me" },
      { who: "w1", spot: [3, 5.5] as [number, number], z: 85, role: "npc", npcType: "regular_customer" },
      { who: "w2", spot: [5.8, 3.2] as [number, number], z: 90, role: "npc", npcType: "student" },
      { who: "w3", spot: [5.8, 5.8] as [number, number], z: 116, role: "npc", npcType: "barista" },
      { who: "p1", spot: [3.2, 3.2] as [number, number], z: 64, role: "pet", npcType: "pet_dog" },
    ];
    let state;
    let cur: CrowdActor[] = actors;
    const moved = new Set<string>();
    const wentOut = new Set<string>();
    const cameBack = new Set<string>();
    const rng = new SeededRandom(5);
    const onFloor = (p: [number, number]) => inStage(p);
    // Off the floor only on the way out or back in: just past the side or bottom edges.
    const onExitPath = (p: [number, number]) => onFloor(p) || (Math.abs(p[0] - p[1]) <= STAGE.halfWidth + 3.5 + 1e-9 && p[0] + p[1] <= STAGE.sMax + 3.5 && p[0] >= STAGE.min - 3.5 && p[1] >= STAGE.min - 3.5);
    const home = new Map<string, [number, number]>();
    for (let t = 0; t < 400; t++) {
      const r = stepCrowd(state, "cafe", cur, rng);
      state = r.state;
      for (const a of r.actors) {
        const prev = cur.find((x) => x.who === a.who)!;
        const di = Math.abs(a.spot[0] - prev.spot[0]), dj = Math.abs(a.spot[1] - prev.spot[1]);
        if (t > 0 && !(a.offscreen || prev.offscreen)) expect(di + dj === 0 || (di + dj === 0.5 && (di === 0 || dj === 0)), `${a.who} step`).toBe(true);
        if (t > 0 && (di || dj)) moved.add(a.who);
        if (a.offscreen) wentOut.add(a.who);
        if (wentOut.has(a.who) && !a.offscreen && onFloor(a.spot)) cameBack.add(a.who);
        expect(onExitPath(a.spot), `${a.who} at ${a.spot}`).toBe(true);
        if (a.who === "w3") {
          if (!home.has("w3")) home.set("w3", a.spot);
          const h = home.get("w3")!;
          expect(Math.abs(a.spot[0] - h[0]) + Math.abs(a.spot[1] - h[1])).toBeLessThanOrEqual(1.5);
        }
      }
      cur = r.actors;
    }
    for (const w of ["me", "w1", "w2", "p1"]) expect(moved.has(w), `${w} moved`).toBe(true);
    expect(wentOut.has("me")).toBe(false);
    expect(wentOut.has("p1")).toBe(false);
    expect([...wentOut].some((w) => w === "w1" || w === "w2")).toBe(true);
    expect([...cameBack].some((w) => w === "w1" || w === "w2")).toBe(true);
  });
});

describe("Set dressing (scene.decor)", () => {
  it("every place is densely dressed, on screen, and the variant wins over the place", async () => {
    const { decorFor } = await import("../src/world/decor");
    const { LOCATIONS } = await import("../src/world/catalog");
    for (const l of LOCATIONS.filter((x) => !x.online)) {
      const d = decorFor(l.id, l.id);
      expect(d.items.length, l.id).toBeGreaterThanOrEqual(9);
      for (const it of d.items) {
        expect(it.x).toBeGreaterThanOrEqual(-0.05);
        expect(it.x).toBeLessThanOrEqual(1.05);
        expect(it.y).toBeGreaterThanOrEqual(0);
        expect(it.y).toBeLessThanOrEqual(1);
      }
    }
    const cabin = decorFor("airplane_cabin", "airplane").items;
    expect(cabin.filter((i) => i.prop === "plane_seat").length).toBeGreaterThanOrEqual(20);
    expect(cabin.some((i) => i.prop === "overhead_bin" && i.on !== "floor")).toBe(true);
    expect(decorFor("home_newlywed", "home").items.some((i) => i.prop === "wedding_photo")).toBe(true);
    expect(decorFor("instagram_screen", "instagram", true).items.length).toBeGreaterThan(0);
  });
});

describe("The sky over the road", () => {
  it("changes through the day with rich gradients, sun/moon, stars and things flying by", async () => {
    const { skyAt } = await import("../src/world/sky");
    const at = (h: number) => skyAt(h * 60);
    expect(at(5.8).phase).toBe("dawn");
    expect(at(9).phase).toBe("morning");
    expect(at(14).phase).toBe("afternoon");
    expect(at(18.5).phase).toBe("sunset");
    expect(at(23).phase).toBe("night");
    for (const h of [6, 9, 14, 18.5, 20, 23]) expect(at(h).gradient).toHaveLength(4);
    expect(at(9).flyers.birds).toBeGreaterThan(0);
    expect(at(14).flyers.plane).toBeGreaterThan(0);
    expect(at(23).flyers.shootingStar).toBeGreaterThan(0);
    expect(at(23).stars).toBe(1);
    expect(at(23).moon).toBeDefined();
    expect(at(12).sun!.y).toBeLessThan(0.3);
    // Rain dulls it and grounds the birds.
    expect(skyAt(540, "RAIN").flyers.birds).toBe(0);
    expect(skyAt(540, "RAIN").gradient[0]).not.toBe(at(9).gradient[0]);
  });
});

describe("Clouds that move with the hour", () => {
  it("puffy and drifting by day, streaks at sunset, faint wisps at night, a grey ceiling in the rain", async () => {
    const { skyAt } = await import("../src/world/sky");
    expect(skyAt(14 * 60).cloudMotion.shape).toBe("puffy");
    expect(skyAt(18.5 * 60).cloudMotion.shape).toBe("streaks");
    expect(skyAt(23 * 60).cloudMotion.shape).toBe("wisps");
    expect(skyAt(14 * 60, "RAIN").cloudMotion).toEqual({ cover: 1, speed: 0.25, shape: "overcast" });
    expect(skyAt(14 * 60).cloudMotion.speed).toBeGreaterThan(skyAt(23 * 60).cloudMotion.speed);
  });
});

describe("Painted popup backgrounds", () => {
  it("a place uses its own painting, else the nearest one we have", async () => {
    const { photoFor } = await import("../src/integration/prototype");
    expect(photoFor("park_proposal")).toBe("bg/park_proposal.png");
    expect(photoFor("cafe_snow", "cafe")).toBe("bg/cafe_snow.png");
    expect(photoFor("instagram_screen", "instagram")).toBe("bg/home_night.png");
    expect(photoFor("cafe_rain", "cafe")).toBe("bg/cafe_rain.png");
    expect(photoFor("restaurant", "restaurant")).toBe("bg/restaurant.png");
    expect(photoFor("diner", "diner")).toBe("bg/diner.png");
    expect(photoFor("cinema", "cinema")).toBe("bg/cinema.png");
    expect(photoFor("tokyo_hotel", "tokyo_hotel")).toBe("bg/tokyo_hotel.png");
    expect(photoFor("paris_street_rain", "paris_street")).toBe("bg/paris_street_rain.png");
    expect(photoFor("no_such_place", "no_such_place")).toBe("bg/street_day.png");
    const fs = await import("node:fs");
    for (const id of (await import("../data/world/photos.json")).default.have) expect(fs.existsSync(`assets/bg/${id}.png`)).toBe(true);
  });
});

describe("Spring wedding", () => {
  it("a wedding in spring uses the cherry-blossom chapel; otherwise the usual ceremony", async () => {
    const { backgroundEngine } = await import("../src/world/backgroundEngine");
    expect(backgroundEngine.getBackground({ location: "wedding_venue", timeOfDay: "AFTERNOON", season: "SPRING" } as never).background.id).toBe("wedding_spring");
    expect(backgroundEngine.getBackground({ location: "wedding_venue", timeOfDay: "AFTERNOON", season: "AUTUMN" } as never).background.id).toBe("wedding_ceremony");
  });
});
