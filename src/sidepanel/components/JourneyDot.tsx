import React from "react";
import { JourneyColorName, JOURNEY_COLOR_CLASSES } from "../journeyColor";

/** The small colored circle preceding a journey title — the "🟦" in the
 * design spec. Color marks context, so it always appears next to the
 * title, never as a standalone indicator. */
export default function JourneyDot({ color }: { color: JourneyColorName }) {
  return (
    <span
      className={`inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full ${JOURNEY_COLOR_CLASSES[color].dot}`}
      aria-hidden="true"
    />
  );
}
