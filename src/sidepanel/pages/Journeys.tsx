import React from "react";
import { PawprintData } from "../useStore";
import { formatRelativeTime } from "../format";
import StatusPill from "../components/StatusPill";
import PawTrail from "../components/PawTrail";
import JourneyDot from "../components/JourneyDot";
import PawIcon from "../components/PawIcon";
import { journeyColorName } from "../journeyColor";
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
    return <p className="text-sm text-ink-500">Loading…</p>;
  }

  if (data.journeys.length === 0) {
    const hasActivity = data.activities.some((a) => !a.excluded);
    return (
      <div className="flex flex-col items-center gap-3 pt-20 text-center">
        <PawIcon className="h-8 w-8 text-ink-300" />
        {hasActivity ? (
          <>
            <p className="text-sm font-medium text-ink-900">No clear journey yet.</p>
            <p className="max-w-[240px] text-xs text-ink-500">
              Pawprint needs a little more context before connecting these
              pawprints.
            </p>
          </>
        ) : (
          <p className="max-w-[240px] text-sm text-ink-500">
            Your journeys will appear here. Start browsing and Pawprint will
            help you remember what you were looking for.
          </p>
        )}
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
      <h1 className="font-serif text-[15px] text-ink-900">Browsing journeys</h1>
      {sorted.map((journey) => {
        const color = journeyColorName(journey.id);
        return (
          <button
            key={journey.id}
            onClick={() => onOpenJourney(journey.id)}
            className="flex flex-col gap-2 rounded-lg border border-ink-200/60 bg-cream-50 px-3.5 py-3 text-left shadow-subtle hover:border-ink-300"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <JourneyDot color={color} />
                <span className="truncate text-sm font-medium text-ink-900">
                  {journey.title}
                </span>
              </div>
              <StatusPill status={journey.status} />
            </div>
            <div className="flex items-center justify-between gap-2">
              <PawTrail count={journey.activityIds.length} color={color} />
              <span className="flex-shrink-0 text-[11px] text-ink-500">
                updated {formatRelativeTime(journey.updatedAt)}
              </span>
            </div>
            {journey.goal && (
              <p className="truncate text-xs text-ink-700">
                Goal: {journey.goal.text}
              </p>
            )}
          </button>
        );
      })}
    </div>
  );
}
