import React from "react";
import { JourneyStatus } from "../../shared/types";

const LABELS: Record<JourneyStatus, string> = {
  candidate: "Possible journey",
  active: "Active",
  completed: "Completed",
  archived: "Archived",
};

const STYLES: Record<JourneyStatus, string> = {
  candidate: "bg-amber-100 text-amber-700",
  active: "bg-emerald-100 text-emerald-700",
  completed: "bg-blue-100 text-blue-700",
  archived: "bg-stone-200 text-stone-500",
};

export default function StatusPill({ status }: { status: JourneyStatus }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
