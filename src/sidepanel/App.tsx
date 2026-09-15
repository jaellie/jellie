import React, { useState } from "react";
import { usePawprintData } from "./useStore";
import { updateSettings } from "../shared/storage";
import Today from "./pages/Today";
import Journeys from "./pages/Journeys";
import JourneyDetail from "./pages/JourneyDetail";
import GoalConfirmation from "./pages/GoalConfirmation";
import Settings from "./pages/Settings";
import PawIcon from "./components/PawIcon";

type Tab = "today" | "journeys" | "settings";
type Overlay =
  | { view: "journey-detail"; journeyId: string }
  | { view: "goal-confirmation"; journeyId: string }
  | null;

export default function App() {
  const data = usePawprintData();
  const [tab, setTab] = useState<Tab>("today");
  const [overlay, setOverlay] = useState<Overlay>(null);

  const openJourney = (journeyId: string) =>
    setOverlay({ view: "journey-detail", journeyId });
  const openGoalConfirmation = (journeyId: string) =>
    setOverlay({ view: "goal-confirmation", journeyId });
  const closeOverlay = () => setOverlay(null);

  return (
    <div className="flex h-full min-h-screen flex-col bg-cream-100 font-sans text-ink-900">
      <header className="flex flex-col gap-0.5 border-b border-ink-200/70 bg-cream-50 px-4 py-3.5">
        <div className="flex items-center gap-2">
          <PawIcon className="h-4 w-4 text-ink-700" />
          <span className="font-serif text-[15px] font-medium tracking-tight text-ink-900">
            Pawprint
          </span>
        </div>
        <p className="text-[11px] text-ink-500">Remember what you were looking for.</p>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4">
        {data.settings.trackingPaused && !overlay && tab !== "settings" ? (
          <PausedScreen />
        ) : overlay?.view === "journey-detail" ? (
          <JourneyDetail
            journeyId={overlay.journeyId}
            data={data}
            onBack={closeOverlay}
            onConfirmGoal={() => openGoalConfirmation(overlay.journeyId)}
          />
        ) : overlay?.view === "goal-confirmation" ? (
          <GoalConfirmation
            journeyId={overlay.journeyId}
            data={data}
            onDone={() => openJourney(overlay.journeyId)}
            onCancel={() => openJourney(overlay.journeyId)}
          />
        ) : tab === "today" ? (
          <Today data={data} onOpenJourney={openJourney} />
        ) : tab === "journeys" ? (
          <Journeys data={data} onOpenJourney={openJourney} />
        ) : (
          <Settings data={data} />
        )}
      </main>

      {!overlay && (
        <nav className="flex border-t border-ink-200/70 bg-cream-50">
          {(
            [
              ["today", "Today"],
              ["journeys", "Journeys"],
              ["settings", "Settings"],
            ] as [Tab, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 py-3 text-[13px] font-medium transition-colors ${
                tab === id
                  ? "border-t border-ink-900 -mt-px text-ink-900"
                  : "text-ink-300 hover:text-ink-500"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}

function PausedScreen() {
  return (
    <div className="flex flex-col items-center gap-4 pt-20 text-center">
      <PawIcon className="h-8 w-8 text-ink-300" />
      <div>
        <p className="text-sm font-medium text-ink-900">Tracking paused</p>
        <p className="mt-1 max-w-[220px] text-xs text-ink-500">
          Pawprint isn&apos;t recording new browsing activity.
        </p>
      </div>
      <button
        onClick={() => void updateSettings({ trackingPaused: false })}
        className="rounded-full bg-ink-900 px-4 py-1.5 text-xs font-medium text-cream-50 hover:bg-ink-700"
      >
        Resume tracking
      </button>
    </div>
  );
}
