import React, { useEffect, useMemo, useState } from "react";
import { PawprintData } from "../useStore";
import { setJourneyGoal } from "../../shared/storage";
import { aiService } from "../../shared/aiService";
import { AdaptiveQuestion, GoalCandidate } from "../../shared/types";
import { AIUnavailableNotice } from "./JourneyDetail";

type Step =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "initial"; candidates: GoalCandidate[] }
  | {
      kind: "followup";
      candidates: GoalCandidate[];
      candidate: GoalCandidate;
      question: AdaptiveQuestion;
      questionsAsked: number;
    }
  | { kind: "freetext"; candidates: GoalCandidate[] };

export default function GoalConfirmation({
  journeyId,
  data,
  onDone,
  onCancel,
}: {
  journeyId: string;
  data: PawprintData;
  onDone: () => void;
  onCancel: () => void;
}) {
  const journey = data.journeys.find((j) => j.id === journeyId);
  const members = useMemo(
    () =>
      journey
        ? data.activities.filter((a) => journey.activityIds.includes(a.id))
        : [],
    [journey, data.activities]
  );

  const [step, setStep] = useState<Step>({ kind: "loading" });
  const [freeTextValue, setFreeTextValue] = useState("");

  async function loadCandidates() {
    setStep({ kind: "loading" });
    try {
      const candidates = await aiService.generateGoalCandidates(members);
      setStep({ kind: "initial", candidates });
    } catch {
      setStep({ kind: "error" });
    }
  }

  useEffect(() => {
    void loadCandidates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journeyId]);

  if (!journey) {
    return <p className="text-sm text-ink-500">This journey was deleted.</p>;
  }

  async function confirmGoal(
    text: string,
    source: "ai" | "something_else",
    candidates: GoalCandidate[]
  ) {
    await setJourneyGoal(
      journeyId,
      { text, confirmedAt: Date.now(), source },
      candidates
    );
    onDone();
  }

  async function selectCandidate(candidate: GoalCandidate, candidates: GoalCandidate[]) {
    if (candidate.needsNarrowing) {
      const followup = await aiService.generateFollowUpQuestion(candidate, members, 0);
      if (followup) {
        setStep({ kind: "followup", candidates, candidate, question: followup, questionsAsked: 1 });
        return;
      }
    }
    await confirmGoal(candidate.text, "ai", candidates);
  }

  async function selectFollowupOption(
    step: Extract<Step, { kind: "followup" }>,
    optionId: string,
    optionText: string
  ) {
    if (optionId === "both") {
      await confirmGoal(step.candidate.text, "ai", step.candidates);
      return;
    }
    await confirmGoal(`${step.candidate.text} — ${optionText}`, "ai", step.candidates);
  }

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={onCancel}
        className="self-start text-xs text-ink-300 hover:text-ink-500"
      >
        ← Back
      </button>

      <div className="rounded-lg border border-ink-200/60 bg-cream-50 px-3.5 py-3">
        <p className="text-sm text-ink-900">
          Pawprint noticed a possible connection.
        </p>
        <p className="mt-0.5 text-sm text-ink-700">
          Which goal is closest to what you were trying to do?
        </p>
      </div>

      {step.kind === "loading" && <p className="text-sm text-ink-500">Thinking…</p>}

      {step.kind === "error" && <AIUnavailableNotice onRetry={loadCandidates} />}

      {step.kind === "initial" && (
        <div className="flex flex-col gap-2">
          {step.candidates.map((c) => (
            <CandidateButton
              key={c.id}
              text={c.text}
              rationale={c.rationale}
              onClick={() => void selectCandidate(c, step.candidates)}
            />
          ))}
          <SomethingElseButton
            onClick={() => setStep({ kind: "freetext", candidates: step.candidates })}
          />
        </div>
      )}

      {step.kind === "followup" && (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-ink-700">Were you mainly:</p>
          {step.question.options.map((opt) => (
            <CandidateButton
              key={opt.id}
              text={opt.text}
              onClick={() => void selectFollowupOption(step, opt.id, opt.text)}
            />
          ))}
          {step.question.allowFreeText && (
            <SomethingElseButton
              onClick={() => setStep({ kind: "freetext", candidates: step.candidates })}
            />
          )}
        </div>
      )}

      {step.kind === "freetext" && (
        <div className="flex flex-col gap-2">
          <textarea
            autoFocus
            value={freeTextValue}
            onChange={(e) => setFreeTextValue(e.target.value)}
            placeholder="Tell Pawprint what you were actually trying to do…"
            className="min-h-[80px] rounded-lg border border-ink-200 bg-cream-50 px-3 py-2 text-sm text-ink-900"
          />
          <button
            disabled={!freeTextValue.trim()}
            onClick={() =>
              void confirmGoal(freeTextValue.trim(), "something_else", step.candidates)
            }
            className="self-start rounded-full bg-ink-900 px-3.5 py-1.5 text-xs font-medium text-cream-50 disabled:opacity-40"
          >
            Confirm
          </button>
        </div>
      )}
    </div>
  );
}

function CandidateButton({
  text,
  rationale,
  onClick,
}: {
  text: string;
  rationale?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg border border-ink-200/60 bg-cream-50 px-3.5 py-2.5 text-left shadow-subtle hover:border-ink-300"
    >
      <p className="text-sm text-ink-900">{text}</p>
      {rationale && <p className="mt-0.5 text-xs text-ink-500">{rationale}</p>}
    </button>
  );
}

function SomethingElseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg border border-dashed border-ink-200 px-3.5 py-2.5 text-left text-sm text-ink-500 hover:border-ink-300"
    >
      Something else…
    </button>
  );
}
