import React, { useMemo, useState } from "react";
import { PawprintData } from "../useStore";
import {
  addActivityToJourney,
  deleteJourney,
  keepActivitySeparate,
  renameJourney,
  setJourneyStatus,
  setJourneySummary,
} from "../../shared/storage";
import { findPossiblyUnrelated } from "../../shared/journeyGrouping";
import { aiService } from "../../shared/aiService";
import { formatRelativeTime } from "../format";
import ActivityRow from "../components/ActivityRow";
import StatusPill from "../components/StatusPill";
import { JourneyStatus } from "../../shared/types";

const INACTIVITY_THRESHOLD_MS = 3 * 24 * 60 * 60 * 1000; // 3 days
const MAX_TABS_TO_REOPEN = 8;

export default function JourneyDetail({
  journeyId,
  data,
  onBack,
  onConfirmGoal,
}: {
  journeyId: string;
  data: PawprintData;
  onBack: () => void;
  onConfirmGoal: () => void;
}) {
  const journey = data.journeys.find((j) => j.id === journeyId);
  const [renaming, setRenaming] = useState(false);
  const [titleDraft, setTitleDraft] = useState(journey?.title ?? "");
  const [summaryState, setSummaryState] = useState<
    "idle" | "loading" | "error"
  >("idle");

  const members = useMemo(
    () =>
      journey
        ? data.activities.filter((a) => journey.activityIds.includes(a.id))
        : [],
    [journey, data.activities]
  );

  const unrelated = useMemo(
    () =>
      journey
        ? findPossiblyUnrelated(journey, data.activities, data.journeys)
        : [],
    [journey, data.activities, data.journeys]
  );

  if (!journey) {
    return (
      <div className="flex flex-col gap-3">
        <BackButton onBack={onBack} />
        <p className="text-sm text-stone-400">This journey was deleted.</p>
      </div>
    );
  }

  const isInactive =
    journey.status === "active" &&
    Date.now() - journey.updatedAt > INACTIVITY_THRESHOLD_MS;

  async function handleGenerateSummary() {
    if (!journey) return;
    setSummaryState("loading");
    try {
      const summary = await aiService.generateSummary(
        journey,
        members,
        unrelated
      );
      await setJourneySummary(journey.id, summary);
      setSummaryState("idle");
    } catch (e) {
      setSummaryState("error");
    }
  }

  async function handleContinueJourney() {
    const uniqueUrls = Array.from(new Set(members.map((m) => m.url))).slice(
      0,
      MAX_TABS_TO_REOPEN
    );
    for (const url of uniqueUrls) {
      chrome.tabs.create({ url, active: false });
    }
  }

  async function handleStatusChange(status: JourneyStatus) {
    await setJourneyStatus(journeyId, status);
  }

  async function handleDelete() {
    if (!confirm(`Delete "${journey!.title}"? This can't be undone.`)) return;
    await deleteJourney(journeyId);
    onBack();
  }

  async function handleRenameSave() {
    const trimmed = titleDraft.trim();
    if (trimmed) await renameJourney(journeyId, trimmed);
    setRenaming(false);
  }

  return (
    <div className="flex flex-col gap-4 pb-4">
      <BackButton onBack={onBack} />

      <div className="flex flex-col gap-2">
        {renaming ? (
          <div className="flex gap-2">
            <input
              autoFocus
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              className="flex-1 rounded border border-paw-200 px-2 py-1 text-base font-semibold"
            />
            <button
              onClick={handleRenameSave}
              className="rounded bg-paw-600 px-2 py-1 text-xs font-medium text-white"
            >
              Save
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-base font-semibold text-stone-800">
              {journey.title}
            </h1>
            <button
              onClick={() => {
                setTitleDraft(journey.title);
                setRenaming(true);
              }}
              className="text-xs text-stone-400 hover:text-stone-600"
            >
              Rename
            </button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <StatusPill status={journey.status} />
          <span className="text-xs text-stone-400">
            {members.length} page{members.length === 1 ? "" : "s"} · updated{" "}
            {formatRelativeTime(journey.updatedAt)}
          </span>
        </div>
      </div>

      {journey.goal ? (
        <div className="rounded-lg bg-paw-100 px-3 py-2">
          <p className="text-xs font-medium uppercase tracking-wide text-paw-700">
            Confirmed goal
          </p>
          <p className="text-sm text-stone-800">{journey.goal.text}</p>
          <button
            onClick={onConfirmGoal}
            className="mt-1 text-xs text-paw-600 hover:underline"
          >
            Change goal
          </button>
        </div>
      ) : (
        <button
          onClick={onConfirmGoal}
          className="rounded-lg bg-paw-600 px-3 py-2 text-sm font-medium text-white hover:bg-paw-700"
        >
          What were you looking for?
        </button>
      )}

      {isInactive && (
        <div className="flex flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
          <p className="text-sm text-stone-700">
            Looks like you may be done with this journey.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handleStatusChange("active")}
              className="rounded border border-stone-300 px-2 py-1 text-xs font-medium text-stone-600"
            >
              Keep active
            </button>
            <button
              onClick={() => handleStatusChange("completed")}
              className="rounded bg-paw-600 px-2 py-1 text-xs font-medium text-white"
            >
              Mark complete
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-stone-500">Summary</h2>
          {!journey.summary && (
            <button
              onClick={handleGenerateSummary}
              className="text-xs text-paw-600 hover:underline"
              disabled={summaryState === "loading"}
            >
              {summaryState === "loading" ? "Generating…" : "Generate summary"}
            </button>
          )}
        </div>
        {summaryState === "error" && (
          <p className="text-xs text-stone-500">
            AI unavailable. Your browsing memory is still safely stored
            locally.{" "}
            <button onClick={handleGenerateSummary} className="text-paw-600 underline">
              Try again
            </button>
          </p>
        )}
        {journey.summary && (
          <div className="rounded-lg border border-paw-100 bg-white px-3 py-2">
            <p className="text-sm text-stone-700">{journey.summary.narrative}</p>
            {journey.summary.explored.length > 0 && (
              <>
                <p className="mt-2 text-xs font-medium text-stone-500">Explored:</p>
                <ul className="ml-4 list-disc text-xs text-stone-500">
                  {journey.summary.explored.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </>
            )}
            {journey.summary.potentiallyUnrelated.length > 0 && (
              <>
                <p className="mt-2 text-xs font-medium text-stone-500">
                  Potentially unrelated:
                </p>
                <ul className="ml-4 list-disc text-xs text-stone-500">
                  {journey.summary.potentiallyUnrelated.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-stone-500">Explored</h2>
        {members
          .sort((a, b) => a.timestamp - b.timestamp)
          .map((a) => (
            <ActivityRow key={a.id} activity={a} />
          ))}
      </div>

      {unrelated.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-stone-500">
            Possibly unrelated
          </h2>
          {unrelated.map((a) => (
            <ActivityRow
              key={a.id}
              activity={a}
              action={
                <div className="flex flex-shrink-0 gap-1">
                  <button
                    onClick={() => addActivityToJourney(a.id, journeyId)}
                    className="rounded border border-paw-300 px-1.5 py-0.5 text-xs text-paw-700 hover:bg-paw-50"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => keepActivitySeparate(a.id, journeyId)}
                    className="rounded border border-stone-200 px-1.5 py-0.5 text-xs text-stone-500 hover:bg-stone-50"
                  >
                    Keep separate
                  </button>
                </div>
              }
            />
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-t border-paw-100 pt-3">
        <button
          onClick={handleContinueJourney}
          className="rounded bg-paw-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-paw-700"
        >
          Continue journey
        </button>
        {journey.status !== "archived" && (
          <button
            onClick={() => handleStatusChange("archived")}
            className="rounded border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-600"
          >
            Archive
          </button>
        )}
        {journey.status === "completed" && (
          <button
            onClick={() => handleStatusChange("active")}
            className="rounded border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-600"
          >
            Reopen
          </button>
        )}
        <button
          onClick={handleDelete}
          className="ml-auto rounded border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
        >
          Delete journey
        </button>
      </div>
    </div>
  );
}

function BackButton({ onBack }: { onBack: () => void }) {
  return (
    <button
      onClick={onBack}
      className="self-start text-sm text-stone-400 hover:text-stone-600"
    >
      ← Back
    </button>
  );
}
