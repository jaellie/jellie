/**
 * Adapter for the Claude Design prototype ("Love Sim Game"): turns engine
 * output into the shapes its renderer already uses —
 *   ROOMS[key]() painters, WBG[key] base colors, world() overlays, SPOTS, spr().
 * The prototype stays in charge of drawing; the engine decides *what* to draw.
 */
import photoData from "../../data/world/photos.json";
import { decorFor } from "../world/decor";
import { OVERLAYS, getBackground, getLocation } from "../world/catalog";
import type { Scene } from "../world/sceneComposer";
import { project, stageInfo } from "../world/stage";

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
  // Online places: you're at home on your phone (the scene is flagged `online`).
  language_exchange_app: "home", instagram: "home", dating_app: "home", online_community: "home",
};

/** The stage geometry for the painter (fractions of the reference box) — see world/stage.ts. */
export type StageInfo = ReturnType<typeof stageInfo>;

export interface PrototypeScene {
  /**
   * Full-screen portrait stage: draw the scene over the whole play area (under the HUD and the log
   * line). The reference box is stage.ref (360 × 642): scale it uniformly to cover the area.
   */
  stage: StageInfo;
  /** Where the people are, top to bottom (fractions) — crop small pictures (big popup, memory card) to this band. */
  focus: { top: number; bottom: number };
  /** An online place (community, SNS, dating/language apps): you're at home on your phone — draw the phone in hand. */
  online?: boolean;
  /** Key into the prototype's ROOMS / SPOTS / WBG: the place's own painter, or the closest stand-in (never empty). */
  roomKey?: string;
  /** The place itself (location id) — paint ROOMS[sceneKey] to replace a stand-in (e.g. "funeral_hall"). */
  sceneKey: string;
  /** The exact background variant (e.g. "home_newlywed", "wedding_ceremony", "gym_night"). */
  bgId: string;
  /** A painted background image to show instead of drawing the room (relative path, e.g. "bg/park_proposal.png"). */
  photo?: string;
  /** With a photo: the only people to draw on it (actor.who), side by side on the floor — you, and your partner if here. */
  photoCast?: string[];
  /** Clothes for the day: "wedding" (gown / black suit) or "funeral" (black formal). */
  /** "none": a wedding you are a guest at (only the couple dress up). */
  dress?: "wedding" | "funeral" | "none";
  /** True when roomKey is only a stand-in for a place that has no painter yet. */
  standIn: boolean;
  /** Bitmap to show when there is no procedural painter yet. */
  assetPath: string;
  baseColor: string;
  /** CSS backgrounds to stack as absolutely-positioned divs (z 90+), like world() does for night/rain. */
  overlays: Array<{ condition: string; background: string }>;
  /**
   * Set dressing that makes the place look like itself (an airplane cabin: rows of seats, windows,
   * overhead bins, the drink cart). Draw each as a pixel sprite by `prop` id: floor props stand at
   * (x, y) = bottom-center, wall props are centered on the back walls. Draw floor props and
   * actors together sorted by y (lower on screen = in front), so people stand in front of / behind them.
   */
  decor: import("../world/decor").DecorItem[];
  /** The place's colors: floor, wall, accent. */
  palette?: Record<string, string>;
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
    /** Where to draw them: feet position as fractions of the reference box (0..1; beyond = off-screen). */
    x: number;
    y: number;
    /** Set by game.wander(): moved this tick (walk frames), which way they face, and whether they've stepped out. */
    walking?: boolean;
    facing?: "NE" | "NW" | "SE" | "SW";
    offscreen?: boolean;
  }>;
}

const PHOTOS = photoData as { have: string[]; fallback: Record<string, string>; west: Record<string, string> };
const HAVE = new Set(PHOTOS.have);
/** Which culture's paintings to show: the English game gets Western versions of culture-bound places
 *  (a Korean funeral hall → a Western funeral chapel) once that painting exists. Set per game call. */
let culture: "ko" | "west" = "ko";
export function setPhotoCulture(c: "ko" | "west"): void {
  culture = c;
}
const local = (id: string): string => (culture === "west" && PHOTOS.west[id] && HAVE.has(PHOTOS.west[id]) ? PHOTOS.west[id] : id);
/** The painted background for a place ("bg/park_proposal.png"): its own, else the nearest one we have. */
export function photoFor(bgId: string, locationId?: string): string | undefined {
  for (const id of [bgId, PHOTOS.fallback[bgId], locationId, locationId ? PHOTOS.fallback[locationId] : undefined]) if (id && HAVE.has(id)) return `bg/${local(id)}.png`;
  // Every scene gets a painting — never the old drawn room.
  return HAVE.has("street_day") ? "bg/street_day.png" : undefined;
}

export function toPrototypeScene(scene: Scene): PrototypeScene {
  const loc = getLocation(scene.locationId);
  const hasPainter = scene.background.renderer?.startsWith("ROOMS.");
  const own = hasPainter ? scene.background.renderer!.slice(6) : loc.prototypeId;
  const roomKey = own ?? STAND_IN[loc.id];
  const photo = photoFor(scene.background.id, loc.id);
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
  const actors = scene.actors.map((a) => ({
    who: a.kind === "player" ? "me" : a.kind === "partner" ? "partner" : a.id,
    spot: a.spot,
    ...project(a.spot),
    z: a.z,
    name: a.name,
    seed: a.spriteSeed,
    familiar: a.familiar,
    gender: a.sex === "MALE" ? ("M" as const) : a.sex === "FEMALE" ? ("F" as const) : undefined,
    age: a.age,
    role: a.kind === "player" ? "me" : a.kind === "partner" ? "partner" : a.fated ? "fated" : a.npcType === "kid" ? "kid" : a.npcType?.startsWith("pet_") ? "pet" : a.kind,
    fated: !!a.fated,
    npcType: a.npcType,
  }));
  return {
    stage: stageInfo(),
    focus: focusOf(actors),
    ...(scene.online ? { online: true } : {}),
    roomKey,
    sceneKey: loc.id,
    bgId: scene.background.id,
    ...(() => {
      if (!photo) return {};
      // On a painting, only the two who matter stand in it: you and your partner (or the one you're
      // falling for) — just you when they aren't there. Never a row of everyone.
      const two = [actors.find((a) => a.role === "me"), actors.find((a) => a.role === "partner") ?? actors.find((a) => a.role === "fated")];
      // Dressed for the day: wedding gown / black suit at a wedding, black formal clothes at a funeral.
      const id = photo.slice(3, -4);
      const dress = /^wedding_/.test(id) ? ("wedding" as const) : /^funeral_hall/.test(id) ? ("funeral" as const) : undefined;
      return { photo, photoCast: two.filter((a): a is NonNullable<typeof a> => !!a).map((a) => a.who), ...(dress ? { dress } : {}) };
    })(),
    standIn: !own,
    assetPath: scene.background.assetPath,
    baseColor: (scene.online ? undefined : FALLBACK_BG[loc.type]) ?? "#ead8bb",
    // Paintings already show their own time and weather — no rain lines / tints drawn over them.
    overlays: photo ? [] : overlays,
    actors,
    ...(() => {
      const d = decorFor(scene.background.id, loc.id, !!scene.online);
      return { decor: d.items, ...(d.palette ? { palette: d.palette } : {}) };
    })(),
  };
}

/** The band (top..bottom, fractions) holding the people on screen, padded for their height — for cropping pictures. */
export function focusOf(actors: Array<{ y: number; offscreen?: boolean }>): { top: number; bottom: number } {
  const ys = actors.filter((a) => !a.offscreen && a.y >= 0 && a.y <= 1).map((a) => a.y);
  const info = stageInfo();
  if (!ys.length) return { top: info.corner.y, bottom: 1 };
  return { top: Math.max(0, Math.min(...ys) - info.spriteHeight * 1.6), bottom: Math.min(1, Math.max(...ys) + info.spriteHeight * 0.4) };
}

/** Re-project actors after they moved (game.wander()). */
export function withPositions<A extends { spot: [number, number] }>(actors: A[]): Array<A & { x: number; y: number }> {
  return actors.map((a) => ({ ...a, ...project(a.spot) }));
}
