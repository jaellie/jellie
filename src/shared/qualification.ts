import { InteractionType, MEANINGFUL_ACTIVE_SECONDS } from "./types";

/**
 * The meaningful-activity rule: a page visit only qualifies as a stored
 * Activity when BOTH hold:
 *   1. The tab was actively (foreground + focused) visible for >= 60s.
 *   2. At least one meaningful interaction occurred (click, scroll, keyboard).
 *
 * Mouse movement, page loading, and background-tab time never count.
 */
export function qualifies(
  activeSeconds: number,
  interactions: InteractionType[]
): boolean {
  return activeSeconds >= MEANINGFUL_ACTIVE_SECONDS && interactions.length > 0;
}

export function qualifiesFromMs(
  activeMs: number,
  interactions: InteractionType[]
): boolean {
  return qualifies(activeMs / 1000, interactions);
}
