/**
 * Main world screen view model (Kairosoft-style):
 *
 *   ┌──────────────────────────┐
 *   │ 2031.04.17      33 y/o   │
 *   │      [WORLD SCENE]       │   ← Scene: background + overlays + sprites + props
 *   │   GYM / CAFE / HOME      │
 *   ├──────────────────────────┤
 *   │ What do you want to do?  │
 *   │ [WORKOUT] [COFFEE] [LEAVE]│
 *   └──────────────────────────┘
 *
 * Pure data. Components render it; they contain no location logic.
 */
import type { LifeState } from "../../sim/types";
import { LOCATIONS, getActivity, getDestination, getLocation } from "../../world/catalog";
import { formatWorldDate } from "../../world/clock";
import { composeScene, type Scene } from "../../world/sceneComposer";
import type { WorldState } from "../../world/types";
import type { VisitResult } from "../../world/worldEngine";
import type { WorldEvent } from "../../world/events";

export type Lang = "ko" | "en";

export interface WorldViewModel {
  header: { date: string; age: string; weather: string; season: string; timeOfDay: string };
  scene: Scene;
  locationName: string;
  prompt: string;
  actions: Array<{ id: string; label: string; kind: "ACTIVITY" | "LEAVE" }>;
  /** One-line log (the prototype's logLine). */
  log: string;
  /** Decision popup (the prototype's popup/choices). */
  popup?: { text: string; npcName?: string; choices: Array<{ id: string; label: string }> };
  /** Small toasts for minor events. */
  toasts: string[];
}

const WEATHER_ICON = { CLEAR: "☀", CLOUDY: "☁", RAIN: "☂", SNOW: "❄" } as const;

export function buildWorldViewModel(args: { state: LifeState; world: WorldState; visit: VisitResult; lang?: Lang; withPartner?: boolean; maxActions?: number }): WorldViewModel {
  const { state, world, visit } = args;
  const lang = args.lang ?? "ko";
  const loc = getLocation(visit.locationId);
  const pending: WorldEvent | undefined = visit.events.find((e) => e.choices?.length);
  const main = visit.events.find((e) => e.scale === "MAJOR") ?? visit.events.find((e) => e.scale === "SMALL");
  const nothing = lang === "ko" ? "특별한 일은 없었다." : "Nothing special happened.";
  const actions: WorldViewModel["actions"] = loc.activities
    .filter((a) => a !== visit.activityId)
    .slice(0, (args.maxActions ?? 3) - 1)
    .map((a) => ({ id: a, label: getActivity(a).name[lang].toUpperCase(), kind: "ACTIVITY" as const }));
  actions.push({ id: "LEAVE", label: lang === "ko" ? "나가기" : "LEAVE", kind: "LEAVE" });
  return {
    header: {
      date: formatWorldDate(visit.time),
      age: lang === "ko" ? `${Math.floor(state.age)}세` : `${Math.floor(state.age)} y/o`,
      weather: WEATHER_ICON[visit.time.weather],
      season: visit.time.season,
      timeOfDay: visit.time.timeOfDay,
    },
    scene: composeScene(visit, world, state, { withPartner: args.withPartner }),
    locationName: loc.name[lang],
    prompt: lang === "ko" ? "무엇을 할까요?" : "What do you want to do?",
    actions,
    log: visit.closedReason ? (lang === "ko" ? "지금은 문을 닫았다." : "It's closed right now.") : main ? main.text[lang] : nothing,
    popup: pending && {
      text: pending.text[lang],
      npcName: pending.npcId ? world.npcs[pending.npcId]?.name : undefined,
      choices: pending.choices!.map((c) => ({ id: c.id, label: c.label[lang] })),
    },
    toasts: visit.events.filter((e) => e.scale === "SMALL" && e !== main).map((e) => e.text[lang]),
  };
}

/** Places the player can go right now: home region + online, or the destination's places while traveling. */
export function destinationsMenu(world: WorldState, hour: number, lang: Lang = "ko") {
  const tripPlaces = world.travel ? new Set([getDestination(world.travel.destinationId).hub, ...getDestination(world.travel.destinationId).locations]) : undefined;
  return LOCATIONS.filter((l) => (tripPlaces ? tripPlaces.has(l.id) : l.region === world.homeRegion || l.region === "online")).map((l) => ({
    id: l.id,
    label: l.name[lang],
    open: hour >= l.availableHours.start && hour < l.availableHours.end,
    habit: !!world.habits[l.id],
    visits: world.locationMemory[l.id]?.visitCount ?? 0,
  }));
}
