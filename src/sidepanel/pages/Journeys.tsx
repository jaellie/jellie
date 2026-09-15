import React from "react";
import { PawprintData } from "../useStore";
import { formatRelativeTime } from "../format";
import StatusPill from "../components/StatusPill";
import PawIcon from "../components/PawIcon";
import { JourneyStatus } from "../../shared/types";

const ORDER: JourneyStatus[] = ["candidate", "active", "completed", "archived"];

export default function Journeys({
  data,
  onOpenJourney,
}: {
  data: PawprintData;
  onOpenJourney: (journeyId: string) => void;
}) {
  if (data.loading) {
    return <p className="text-sm text-stone-400">Loading…</p>;
  }

  if (data.journeys.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 pt-16 text-center">
        <PawIcon className="h-10 w-10 text-paw-300" />
        <p className="text-sm font-medium text-stone-600">No clear journey yet.</p>
        <p className="max-w-xs text-xs text-stone-400">
          Keep browsing. Pawprint needs a little more context before
          connecting these activities into a journey.
        </p>
      </div>
    );
  }

  const sorted = [...data.journeys].sort((a, b) => {
    const orderDiff = ORDER.indexOf(a.status) - ORDER.indexOf(b.status);
    if (orderDiff !== 0) return orderDiff;
    return b.updatedAt - a.updatedAt;
  });

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-sm font-semibold text-stone-500">Browsing journeys</h1>
      {sorted.map((journey) => (
        <button
          key={journey.id}
          onClick={() => onOpenJourney(journey.id)}
          className="flex flex-col gap-1.5 rounded-lg border border-paw-100 bg-white px-3 py-3 text-left hover:border-paw-300"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-sm font-medium text-stone-800">
              {journey.title}
            </span>
            <StatusPill status={journey.status} />
          </div>
          <p className="text-xs text-stone-400">
            {journey.activityIds.length} page
            {journey.activityIds.length === 1 ? "" : "s"} · updated{" "}
            {formatRelativeTime(journey.updatedAt)}
          </p>
          {journey.goal && (
            <p className="truncate text-xs text-paw-700">
              Goal: {journey.goal.text}
            </p>
          )}
        </button>
      ))}
    </div>
  );
}
