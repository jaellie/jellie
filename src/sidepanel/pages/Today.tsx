import React from "react";
import { PawprintData } from "../useStore";
import { isToday } from "../format";
import ActivityRow from "../components/ActivityRow";
import PawIcon from "../components/PawIcon";

export default function Today({
  data,
  onOpenJourney,
}: {
  data: PawprintData;
  onOpenJourney: (journeyId: string) => void;
}) {
  const todays = data.activities
    .filter((a) => !a.excluded && isToday(a.timestamp))
    .sort((a, b) => b.timestamp - a.timestamp);

  const journeyById = new Map(data.journeys.map((j) => [j.id, j]));

  if (data.loading) {
    return <p className="text-sm text-stone-400">Loading…</p>;
  }

  if (todays.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 pt-16 text-center">
        <PawIcon className="h-10 w-10 text-paw-300" />
        <p className="text-sm text-stone-500">
          No meaningful activity recorded yet today.
        </p>
        <p className="max-w-xs text-xs text-stone-400">
          Pawprint quietly notices pages you spend real time on — at least a
          minute, with a click, scroll, or keystroke. Keep browsing and your
          trail will start to appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-sm font-semibold text-stone-500">Today&apos;s trail</h1>
      {todays.map((activity) => {
        const journey = activity.journeyId
          ? journeyById.get(activity.journeyId)
          : undefined;
        return (
          <div key={activity.id} className="flex flex-col gap-1">
            <ActivityRow activity={activity} />
            {journey && (
              <button
                onClick={() => onOpenJourney(journey.id)}
                className="ml-1 self-start text-xs text-paw-600 hover:underline"
              >
                Part of &ldquo;{journey.title}&rdquo;
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
