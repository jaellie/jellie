import React, { useState } from "react";
import { usePawprintData } from "./useStore";
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
    <div className="flex h-full min-h-screen flex-col bg-paw-50">
      <header className="flex items-center gap-2 border-b border-paw-200 bg-white px-4 py-3">
        <PawIcon className="h-5 w-5 text-paw-600" />
        <span className="text-base font-semibold text-stone-800">Pawprint</span>
        {data.settings.trackingPaused && (
          <span className="ml-auto rounded-full bg-stone-200 px-2 py-0.5 text-xs font-medium text-stone-600">
            Tracking paused
          </span>
        )}
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4">
        {overlay?.view === "journey-detail" ? (
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
        <nav className="flex border-t border-paw-200 bg-white">
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
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                tab === id
                  ? "text-paw-700 border-t-2 border-paw-600 -mt-px"
                  : "text-stone-400 hover:text-stone-600"
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
