/**
 * Adapter for the Claude Design prototype ("Love Sim Game"): turns engine
 * output into the shapes its renderer already uses —
 *   ROOMS[key]() painters, WBG[key] base colors, world() overlays, SPOTS, spr().
 * The prototype stays in charge of drawing; the engine decides *what* to draw.
 */
import { OVERLAYS, getBackground, getLocation } from "../world/catalog";
import type { Scene } from "../world/sceneComposer";

/** Fallback base colors for locations the prototype hasn't painted yet (mirrors its WBG palette). */
const FALLBACK_BG: Record<string, string> = {
  GYM: "#d7d2e8",
  CLASS: "#f6e3c8",
  LIBRARY: "#e3d7c3",
  UNIVERSITY: "#cfe3c4",
  AIRPORT: "#cfdcec",
  HOTEL: "#ead3d9",
  TOURIST_SITE: "#cfe9ff",
  ONLINE: "#2b2233",
  FAMILY_HOME: "#dcb080",
  WEDDING_VENUE: "#fbe1ea",
  HOSPITAL: "#e6f1f0",
  HOBBY: "#bfe6fa",
  BEACH: "#f3dfae",
  CAFE: "#ead8bb",
  CITY: "#b3b8c4",
};

/**
 * Until the UI has a painter for a place, the closest existing one stands in, so a
 * background is never blank. The UI should prefer ROOMS[bgId] → ROOMS[sceneKey] → ROOMS[roomKey].
 */
const STAND_IN: Record<string, string> = {
  family_home: "home", tokyo_hotel: "home", paris_hotel: "home", business_hotel: "home",
  gym: "office", airport: "office", airplane: "office", hospital: "office", court: "office", branch_office: "office", funeral_hall: "office",
  cooking_class: "diner", library: "cafe", beach_cafe: "cafe", paris_cafe: "cafe", wedding_venue: "restaurant",
  university: "street", paris_eiffel_tower: "street", paris_louvre: "street", paris_street: "street",
  surf_school: "beach", boardwalk: "beach", paris_seine: "park",
};

export interface PrototypeScene {
  /** Key into the prototype's ROOMS / SPOTS / WBG: the place's own painter, or the closest stand-in (never empty). */
  roomKey?: string;
  /** The place itself (location id) — paint ROOMS[sceneKey] to replace a stand-in (e.g. "funeral_hall"). */
  sceneKey: string;
  /** The exact background variant (e.g. "home_newlywed", "wedding_ceremony", "gym_night"). */
  bgId: string;
  /** True when roomKey is only a stand-in for a place that has no painter yet. */
  standIn: boolean;
  /** Bitmap to show when there is no procedural painter yet. */
  assetPath: string;
  baseColor: string;
  /** CSS backgrounds to stack as absolutely-positioned divs (z 90+), like world() does for night/rain. */
  overlays: Array<{ condition: string; background: string }>;
  /** Characters to draw with spr(): prototype role names for known roles, npc ids otherwise. */
  actors: Array<{
    who: string;
    spot: [number, number];
    z: number;
    name?: string;
    seed: number;
    familiar?: boolean;
    /** "M" | "F" for choosing a sprite body. */
    gender?: "M" | "F";
    age?: number;
    /** me | partner | fated | npc | passerby */
    role: string;
    /** True for the destined person from setup — also when they are the partner. */
    fated?: boolean;
    /** e.g. pet_dog / pet_cat / kid / trainer … */
    npcType?: string;
    /** Set by game.wander(): moved this tick (walk frames), which way they face, and whether they've stepped out. */
    walking?: boolean;
    facing?: "NE" | "NW" | "SE" | "SW";
    offscreen?: boolean;
  }>;
}

export function toPrototypeScene(scene: Scene): PrototypeScene {
  const loc = getLocation(scene.locationId);
  const hasPainter = scene.background.renderer?.startsWith("ROOMS.");
  const own = hasPainter ? scene.background.renderer!.slice(6) : loc.prototypeId;
  const roomKey = own ?? STAND_IN[loc.id];
  const overlays = scene.overlays.map((o) => ({ condition: o.condition, background: o.kind === "tint" ? o.color! : o.css ?? "" }));
  // Until the variant bitmap exists, the base painter stands in — so draw the variant's own conditions as overlays too.
  if (!hasPainter && roomKey && scene.background.status !== "ready") {
    const bg = getBackground(scene.background.id);
    for (const cond of [bg.timeOfDay, bg.weather]) {
      if (cond && cond !== "DAY" && cond !== "CLEAR" && OVERLAYS[cond] && !overlays.some((o) => o.condition === cond)) {
        const o = OVERLAYS[cond];
        overlays.push({ condition: cond, background: o.kind === "tint" ? o.color! : o.css ?? "" });
      }
    }
  }
  return {
    roomKey,
    sceneKey: loc.id,
    bgId: scene.background.id,
    standIn: !own,
    assetPath: scene.background.assetPath,
    baseColor: FALLBACK_BG[loc.type] ?? "#ead8bb",
    overlays,
    actors: scene.actors.map((a) => ({
      who: a.kind === "player" ? "me" : a.kind === "partner" ? "partner" : a.id,
      spot: a.spot,
      z: a.z,
      name: a.name,
      seed: a.spriteSeed,
      familiar: a.familiar,
      gender: a.sex === "MALE" ? "M" : a.sex === "FEMALE" ? "F" : undefined,
      age: a.age,
      role: a.kind === "player" ? "me" : a.kind === "partner" ? "partner" : a.fated ? "fated" : a.npcType === "kid" ? "kid" : a.npcType?.startsWith("pet_") ? "pet" : a.kind,
      fated: !!a.fated,
      npcType: a.npcType,
    })),
  };
}
