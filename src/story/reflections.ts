/**
 * The line that stays with you after a big moment: drama-style, sometimes wry ("…to someone who
 * never called first"). A category is chosen from the memory card the moment made (a funeral, a
 * wedding…) or the life event's category; within it, a line not yet used in this life and, on the
 * same device, preferably not seen in earlier lives either.
 */
import data from "../../data/story/reflections.json";
import type { SeededRandom } from "../core/rng";
import type { LifeState } from "../sim/types";
import { freshness, markSeen } from "./deviceMemory";

type Bi = { ko: string; en: string };
const LINES = data.lines as Record<string, Bi[]>;
const BY_CARD = data.byCard as Record<string, string>;
const BY_EVENT = data.byEventCat as Record<string, string>;

/** The category for a moment: the first card that has one, else the life event's category. */
export function reflectionCategory(cards: string[], eventCat?: string): string | undefined {
  for (const c of cards) if (BY_CARD[c]) return BY_CARD[c];
  return eventCat ? BY_EVENT[eventCat] : undefined;
}

/** A line from the category (never one already used in this life), or undefined when it's all used. */
export function pickReflection(state: LifeState, category: string, rng: SeededRandom): Bi | undefined {
  const pool = LINES[category];
  if (!pool?.length) return;
  const used = new Set(String(state.flags.usedLines ?? "").split(",").filter(Boolean));
  const cands = pool.map((b, i) => ({ item: i, weight: freshness(`q:${category}:${i}`) })).filter((c) => !used.has(`${category}:${c.item}`));
  if (!cands.length) return;
  const i = rng.weighted(cands);
  used.add(`${category}:${i}`);
  state.flags.usedLines = [...used].join(",");
  markSeen(`q:${category}:${i}`);
  return pool[i];
}

/** Every line (for tests). */
export function allReflections(): Array<{ category: string; line: Bi }> {
  return Object.entries(LINES).flatMap(([category, ls]) => ls.map((line) => ({ category, line })));
}
