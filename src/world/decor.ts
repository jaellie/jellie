/**
 * Set dressing: every place gets dense, specific props (data/world/decor.json) so a scene — the big
 * popup's picture, a memory card — looks like that place: an airplane cabin with rows of seats,
 * windows and overhead bins; a funeral hall with the altar, the portrait, white chrysanthemums.
 *
 * Authored on the stage: floor props by depth `s` (back 3 … front 28) and side `d` (−5 … 5), wall
 * props by position along the left/right back wall. Here they become screen positions (fractions of
 * the 360 × 642 reference box), drawn back to front with the people.
 */
import data from "../../data/world/decor.json";
import { STAGE, stageInfo } from "./stage";

export interface DecorItem {
  /** Sprite id (plane_seat, overhead_bin, chrysanthemums, espresso_machine …). */
  prop: string;
  /** Where it stands: floor (feet / bottom-center) or on a back wall (center). */
  on: "floor" | "wallL" | "wallR";
  /** Fractions of the reference box. */
  x: number;
  y: number;
  /** Draw order (with the people: theirs is the same scale); walls are behind everything. */
  z: number;
  /** Relative size (1 = about one tile wide). */
  size: number;
}

type Raw = [string, number | string, number, number];
const SCENES = (data as unknown as { scenes: Record<string, { palette: Record<string, string>; items: Raw[] }> }).scenes;

/** The props for a background variant (home_newlywed, airplane_cabin…), else for the place itself. */
export function decorFor(bgId: string, locationId: string, online = false): { palette?: Record<string, string>; items: DecorItem[] } {
  const def = SCENES[bgId] ?? SCENES[locationId] ?? (online ? SCENES.home : undefined);
  if (!def) return { items: [] };
  const [w, h] = STAGE.ref;
  const info = stageInfo();
  const items = def.items.map(([prop, a, b, c]): DecorItem => {
    if (a === "L" || a === "R") {
      // Along the wall from its outer edge (u = 0) to the corner (u = 1); v = height above the floor line.
      const u = b, v = c;
      const x = a === "L" ? info.corner.x * u : 1 - (1 - info.corner.x) * u;
      const base = info.leftBase.y + (info.corner.y - info.leftBase.y) * u;
      return { prop, on: a === "L" ? "wallL" : "wallR", x, y: base * (1 - v), z: -100 + Math.round(u * 10), size: 1 };
    }
    const s = a as number, d = b, size = c ?? 1;
    const y = (STAGE.y0 + s * STAGE.dy) / h;
    return { prop, on: "floor", x: (STAGE.cx + d * STAGE.dx) / w, y, z: Math.round(y * 1000), size };
  });
  return { palette: def.palette, items };
}
