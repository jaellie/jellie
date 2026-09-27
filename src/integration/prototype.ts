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

export interface PrototypeScene {
  /** Key into the prototype's ROOMS / SPOTS / WBG, when it has a painter for this place. */
  roomKey?: string;
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
  }>;
}

export function toPrototypeScene(scene: Scene): PrototypeScene {
  const loc = getLocation(scene.locationId);
  const hasPainter = scene.background.renderer?.startsWith("ROOMS.");
  const roomKey = hasPainter ? scene.background.renderer!.slice(6) : loc.prototypeId;
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
