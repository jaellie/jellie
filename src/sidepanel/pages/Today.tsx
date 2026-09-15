import React from "react";
import { PawprintData } from "../useStore";
import { isToday, formatDuration } from "../format";
import PawIcon from "../components/PawIcon";
import PawTrail from "../components/PawTrail";
import JourneyDot from "../components/JourneyDot";
import StatusPill from "../components/StatusPill";
import { journeyColorName } from "../journeyColor";
import { Activity, Journey } from "../../shared/types";

export default function Today({
  data,
  onOpenJourney,
}: {
  data: PawprintData;
  onOpenJourney: (journeyId: string) => void;
}) {
  if (data.loading) {
    return <p className="text-sm text-ink-500">Loading…</p>;
  }

  const todaysActivities = data.activities.filter(
    (a) => !a.excluded && isToday(a.timestamp)
  );

  if (todaysActivities.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 pt-20 text-center">
        <PawIcon className="h-8 w-8 text-ink-300" />
        <p className="max-w-[240px] text-sm text-ink-500">
          Your journeys will appear here. Start browsing and Pawprint will
          help you remember what you were looking for.
        </p>
      </div>
    );
  }

  const activitiesByJourney = new Map<string, Activity[]>();
  const ungrouped: Activity[] = [];
  for (const a of todaysActivities) {
    if (a.journeyId) {
      const list = activitiesByJourney.get(a.journeyId) ?? [];
      list.push(a);
      activitiesByJourney.set(a.journeyId, list);
    } else {
      ungrouped.push(a);
    }
  }

  const todaysJourneys = data.journeys
    .filter((j) => activitiesByJourney.has(j.id))
    .sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-serif text-[15px] text-ink-900">Today</h1>
        <p className="text-xs text-ink-500">Possible journeys</p>
      </div>

      <div className="flex flex-col gap-2.5">
        {todaysJourneys.map((journey) => (
          <JourneyRow
            key={journey.id}
            journey={journey}
            activities={activitiesByJourney.get(journey.id) ?? []}
            onOpen={() => onOpenJourney(journey.id)}
          />
        ))}
      </div>

      {ungrouped.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-ink-500">Not yet connected</p>
          {ungrouped
            .sort((a, b) => b.timestamp - a.timestamp)
            .map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-2.5 rounded-md border border-ink-200/60 bg-cream-50 px-3 py-2"
              >
                {a.favicon ? (
                  <img src={a.favicon} alt="" className="h-4 w-4 rounded-sm" />
                ) : (
                  <div className="h-4 w-4 rounded-sm bg-ink-200" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-ink-900">{a.title || a.url}</p>
                  <p className="truncate text-xs text-ink-500">{a.domain}</p>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

function JourneyRow({
  journey,
  activities,
  onOpen,
}: {
  journey: Journey;
  activities: Activity[];
  onOpen: () => void;
}) {
  const color = journeyColorName(journey.id);
  const totalMs = activities.reduce((sum, a) => sum + a.durationMs, 0);

  return (
    <button
      onClick={onOpen}
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
        <PawTrail count={activities.length} color={color} />
        <span className="flex-shrink-0 text-[11px] text-ink-500">
          {activities.length} pawprint{activities.length === 1 ? "" : "s"} ·{" "}
          {formatDuration(totalMs)}
        </span>
      </div>
    </button>
  );
}
