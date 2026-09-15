import React from "react";
import { JourneyColorName, JOURNEY_COLOR_CLASSES } from "../journeyColor";

const MAX_DOTS = 7;

/** Compact "● → ● → ●" trail: one dot per pawprint (activity), connected by
 * a thin line, in the journey's accent color. Communicates sequence and
 * count at a glance without a heavy timeline widget. */
export default function PawTrail({
  count,
  color,
  size = "sm",
}: {
  count: number;
  color: JourneyColorName;
  size?: "sm" | "md";
}) {
  const dotClass = JOURNEY_COLOR_CLASSES[color].dot;
  const shown = Math.min(count, MAX_DOTS);
  const overflow = count - shown;
  const dotSize = size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2";
  const lineWidth = size === "sm" ? "w-2.5" : "w-3.5";

  return (
    <div className="flex items-center gap-0" aria-label={`${count} pawprints`}>
      {Array.from({ length: shown }).map((_, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className={`h-px ${lineWidth} bg-ink-200`} />}
          <span className={`${dotSize} flex-shrink-0 rounded-full ${dotClass}`} />
        </React.Fragment>
      ))}
      {overflow > 0 && (
        <span className="ml-1 text-[10px] text-ink-500">+{overflow}</span>
      )}
    </div>
  );
}
