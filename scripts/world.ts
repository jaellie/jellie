/**
 * npm run world -- [--seed 7]
 * Scenario: a 27-year-old joins a gym, keeps going, travels to Paris, and
 * returns to the Eiffel Tower nine years later.
 */
import { SeededRandom } from "../src/core/rng";
import { combineModifiers } from "../src/core/lifeModifiers";
import { SajuModifierEngine } from "../src/saju/interpretation/sajuModifierEngine";
import { createLifeState } from "../src/sim/simulateLife";
import { createWorldState } from "../src/world/npcs";
import { WorldEngine } from "../src/world/worldEngine";
import { AutoWorldPolicy, resolveWorldEvent } from "../src/world/decisions";
import { runTrip } from "../src/world/travel";
import { buildWorldViewModel } from "../src/ui/world/worldViewModel";
import { worldModifierSource } from "../src/world/worldModifiers";
import { parseArgs } from "./args";

const a = parseArgs();
const seed = Number(a.seed ?? 7);
const rng = new SeededRandom(seed);
const state = createLifeState({ year: 1997, month: 9, day: 28, hour: 9, minute: 30, sex: "FEMALE" }, { traits: { sociability: 0.65, novelty: 0.7 }, money: 30 });
state.age = 27;
state.monthIndex = 27 * 12;
const world = (state.world = createWorldState());
const saju = new SajuModifierEngine();
const engine = new WorldEngine();
const policy = new AutoWorldPolicy();

const mods = (year: number, month: number) => combineModifiers(saju.calculate(state.chart, { year, month }), worldModifierSource(world).modifiers);
const say = (s: string) => console.log(s);

say("── 🏋️  JOINING THE GYM (Mon/Wed/Fri 19:00) ──");
let visitNo = 0;
for (let m = 0; m < 24; m++) {
  const year = 2024 + Math.floor((3 + m) / 12);
  const month = ((3 + m) % 12) + 1;
  state.age = 27 + m / 12;
  for (const day of [3, 10, 17, 24]) {
    visitNo++;
    const modifiers = mods(year, month);
    const r = engine.visit({ state, world, modifiers, rng, seed }, { locationId: "gym", activityId: visitNo === 1 ? "buy_membership" : "workout", date: { year, month, day }, hour: 19 });
    const notable = r.events.filter((e) => e.scale !== "NONE");
    if (visitNo === 1) {
      const vm = buildWorldViewModel({ state, world, visit: r, lang: "en" });
      say(`${vm.header.date} ${vm.header.age} ${vm.header.weather}  [${vm.locationName}] bg=${vm.scene.background.id} overlays=${vm.scene.overlays.map((o) => o.condition).join(",") || "-"} actors=${vm.scene.actors.length}`);
      say(`  actions: ${vm.actions.map((x) => `[${x.label}]`).join(" ")}`);
    }
    for (const e of notable) {
      let line = `  visit ${String(visitNo).padStart(2)} ${year}-${String(month).padStart(2, "0")}  ${e.text.en}`;
      if (e.choices) {
        const c = policy.choose(e, state, world, rng);
        const res = resolveWorldEvent(e, c, { state, world, modifiers, rng });
        line += `  → ${c}${res.success === undefined ? "" : res.success ? " ✔" : " ✘"} ${res.changes.join("; ")}`;
      }
      say(line);
    }
  }
}
const quiet = visitNo;
say(`  (${quiet} visits total; most of them: nothing happened.)`);
say("\nPeople you know from the gym:");
for (const rel of Object.values(world.relationships)) {
  const n = world.npcs[rel.npcId];
  const h = Object.values(world.encounters).find((x) => x.npcId === rel.npcId);
  say(`  ${n.name.padEnd(6)} ${n.type.padEnd(16)} ${rel.stage.padEnd(14)} seen ${h?.encounterCount ?? "?"}× · origin ${rel.origin.type} ${rel.origin.firstEncounterDate.year}-${rel.origin.firstEncounterDate.month}`);
}

say("\n── ✈️  TRIP TO PARIS (2026-06) ──");
state.age = 29;
const trip = runTrip({ state, world, modifiers: mods(2026, 6), rng, seed }, "paris", { year: 2026, month: 6, day: 10 }, policy, engine);
for (const v of trip.visits) {
  const ev = v.events.filter((e) => e.scale !== "NONE").map((e) => e.text.en).join(" / ");
  say(`  ${v.time.date.month}/${v.time.date.day} ${String(v.time.hour).padStart(2)}h ${v.locationId.padEnd(20)} bg=${v.background.background.id.padEnd(16)} ${v.time.weather.padEnd(6)} ${ev || "—"}`);
}
say(`  mementos: ${trip.trip.mementos.join(", ")} · kept contacts: ${trip.keptContacts.map((id) => world.npcs[id].name).join(", ") || "none"}`);
const em = world.locationMemory.paris_eiffel_tower;
say(`  Eiffel Tower memory: visited ${em?.visitCount ?? 0}×, important: ${em?.importantEvents.join(" | ") || "—"}`);

say("\n── 🗼  BACK AT THE EIFFEL TOWER (2035-09) ──");
state.age = 38;
const again = runTrip({ state, world, modifiers: mods(2035, 9), rng, seed }, "paris", { year: 2035, month: 9, day: 5 }, policy, engine);
for (const v of again.visits.filter((x) => x.locationId === "paris_eiffel_tower")) for (const e of v.events) say(`  ${e.kind}: ${e.text.en}`);
say(`  Eiffel Tower memory now: visited ${world.locationMemory.paris_eiffel_tower?.visitCount}×, first ${world.locationMemory.paris_eiffel_tower?.firstVisit?.year}`);
