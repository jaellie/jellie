import React from "react";
import { JourneyStatus } from "../../shared/types";

const LABELS: Record<JourneyStatus, string> = {
  candidate: "Possible journey",
  active: "Active",
  completed: "Completed",
  archived: "Archived",
};

const STYLES: Record<JourneyStatus, string> = {
  candidate: "bg-cream-200 text-ink-500",
  active: "bg-ink-900 text-cream-50",
  completed: "bg-ink-200 text-ink-700",
  archived: "bg-cream-100 text-ink-300",
};

export default function StatusPill({ status }: { status: JourneyStatus }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium tracking-wide ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
