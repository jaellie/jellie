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
import { formatDuration, formatRelativeTime } from "../format";
import ActivityRow from "../components/ActivityRow";
import StatusPill from "../components/StatusPill";
import JourneyDot from "../components/JourneyDot";
import PawTrail from "../components/PawTrail";
import { journeyColorName } from "../journeyColor";
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
  const [summaryState, setSummaryState] = useState<"idle" | "loading" | "error">(
    "idle"
  );

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
        <p className="text-sm text-ink-500">This journey was deleted.</p>
      </div>
    );
  }

  const color = journeyColorName(journey.id);
  const totalMs = members.reduce((sum, a) => sum + a.durationMs, 0);
  const isInactive =
    journey.status === "active" &&
    Date.now() - journey.updatedAt > INACTIVITY_THRESHOLD_MS;

  async function handleGenerateSummary() {
    if (!journey) return;
    setSummaryState("loading");
    try {
      const summary = await aiService.generateSummary(journey, members, unrelated);
      await setJourneySummary(journey.id, summary);
      setSummaryState("idle");
    } catch {
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
              className="flex-1 rounded border border-ink-200 bg-cream-50 px-2 py-1 font-serif text-base text-ink-900"
            />
            <button
              onClick={handleRenameSave}
              className="rounded bg-ink-900 px-2 py-1 text-xs font-medium text-cream-50"
            >
              Save
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <JourneyDot color={color} />
              <h1 className="truncate font-serif text-base text-ink-900">
                {journey.title}
              </h1>
            </div>
            <button
              onClick={() => {
                setTitleDraft(journey.title);
                setRenaming(true);
              }}
              className="flex-shrink-0 text-xs text-ink-300 hover:text-ink-500"
            >
              Rename
            </button>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill status={journey.status} />
          {journey.goal && (
            <span className="text-[11px] text-ink-500">Confirmed by you</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <PawTrail count={members.length} color={color} size="md" />
          <span className="text-[11px] text-ink-500">
            {members.length} pawprint{members.length === 1 ? "" : "s"} ·{" "}
            {formatDuration(totalMs)}
          </span>
        </div>
      </div>

      {journey.goal ? (
        <div className="rounded-lg border border-ink-200/60 bg-cream-50 px-3.5 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-ink-500">
            Confirmed goal
          </p>
          <p className="mt-0.5 text-sm text-ink-900">{journey.goal.text}</p>
          <button
            onClick={onConfirmGoal}
            className="mt-1.5 text-xs text-ink-500 underline decoration-ink-200 underline-offset-2 hover:text-ink-700"
          >
            Edit goal
          </button>
        </div>
      ) : (
        <button
          onClick={onConfirmGoal}
          className="rounded-lg bg-ink-900 px-3.5 py-2.5 text-left text-sm font-medium text-cream-50 hover:bg-ink-700"
        >
          What were you looking for?
        </button>
      )}

      {isInactive && (
        <div className="flex flex-col gap-2 rounded-lg border border-ink-200/60 bg-cream-100 px-3.5 py-3">
          <p className="text-sm text-ink-700">
            Looks like you may be done with this journey.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handleStatusChange("active")}
              className="rounded border border-ink-200 px-2.5 py-1 text-xs font-medium text-ink-700"
            >
              Keep active
            </button>
            <button
              onClick={() => handleStatusChange("completed")}
              className="rounded bg-ink-900 px-2.5 py-1 text-xs font-medium text-cream-50"
            >
              Mark complete
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-medium uppercase tracking-wide text-ink-500">
            Summary
          </h2>
          {!journey.summary && (
            <button
              onClick={handleGenerateSummary}
              className="text-xs text-ink-500 underline decoration-ink-200 underline-offset-2 hover:text-ink-700"
              disabled={summaryState === "loading"}
            >
              {summaryState === "loading" ? "Generating…" : "Generate summary"}
            </button>
          )}
        </div>
        {summaryState === "error" && (
          <AIUnavailableNotice onRetry={handleGenerateSummary} />
        )}
        {journey.summary && (
          <div className="rounded-lg border border-ink-200/60 bg-cream-50 px-3.5 py-3">
            <p className="text-sm text-ink-700">{journey.summary.narrative}</p>
            {journey.summary.explored.length > 0 && (
              <>
                <p className="mt-2.5 text-[11px] font-medium text-ink-500">
                  Explored
                </p>
                <ul className="ml-4 list-disc text-xs text-ink-500">
                  {journey.summary.explored.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </>
            )}
            {journey.summary.potentiallyUnrelated.length > 0 && (
              <>
                <p className="mt-2.5 text-[11px] font-medium text-ink-500">
                  Potentially unrelated
                </p>
                <ul className="ml-4 list-disc text-xs text-ink-500">
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
        <h2 className="text-xs font-medium uppercase tracking-wide text-ink-500">
          Your browsing trail
        </h2>
        {members
          .sort((a, b) => a.timestamp - b.timestamp)
          .map((a) => (
            <ActivityRow key={a.id} activity={a} />
          ))}
      </div>

      {unrelated.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-xs font-medium uppercase tracking-wide text-ink-500">
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
                    className="rounded border border-ink-200 px-1.5 py-0.5 text-[11px] text-ink-700 hover:bg-cream-100"
                  >
                    Add to journey
                  </button>
                  <button
                    onClick={() => keepActivitySeparate(a.id, journeyId)}
                    className="rounded border border-ink-200/60 px-1.5 py-0.5 text-[11px] text-ink-500 hover:bg-cream-100"
                  >
                    Keep separate
                  </button>
                </div>
              }
            />
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-t border-ink-200/70 pt-3">
        <button
          onClick={handleContinueJourney}
          className="rounded-full bg-ink-900 px-3.5 py-1.5 text-xs font-medium text-cream-50 hover:bg-ink-700"
        >
          Continue journey
        </button>
        {journey.status !== "archived" && (
          <button
            onClick={() => handleStatusChange("archived")}
            className="rounded-full border border-ink-200 px-3.5 py-1.5 text-xs font-medium text-ink-700"
          >
            Archive
          </button>
        )}
        {journey.status === "completed" && (
          <button
            onClick={() => handleStatusChange("active")}
            className="rounded-full border border-ink-200 px-3.5 py-1.5 text-xs font-medium text-ink-700"
          >
            Reopen
          </button>
        )}
        <button
          onClick={handleDelete}
          className="ml-auto rounded-full border border-ink-200 px-3.5 py-1.5 text-xs font-medium text-ink-500 hover:text-ink-900"
        >
          Delete journey
        </button>
      </div>
    </div>
  );
}

export function AIUnavailableNotice({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-ink-200/60 bg-cream-100 px-3.5 py-3">
      <p className="text-xs font-medium text-ink-700">AI unavailable</p>
      <p className="text-xs text-ink-500">
        Your browsing memory is still safely stored locally.
      </p>
      <button
        onClick={onRetry}
        className="mt-0.5 self-start text-xs text-ink-500 underline decoration-ink-200 underline-offset-2 hover:text-ink-700"
      >
        Try again
      </button>
    </div>
  );
}

function BackButton({ onBack }: { onBack: () => void }) {
  return (
    <button
      onClick={onBack}
      className="self-start text-xs text-ink-300 hover:text-ink-500"
    >
      ← Back
    </button>
  );
}
