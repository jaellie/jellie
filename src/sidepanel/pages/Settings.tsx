import React, { useState } from "react";
import { PawprintData } from "../useStore";
import {
  deleteActivity,
  deleteAllMemory,
  updateSettings,
} from "../../shared/storage";
import { DEFAULT_EXCLUDED_DOMAINS } from "../../shared/sensitiveSites";
import ActivityRow from "../components/ActivityRow";

export default function Settings({ data }: { data: PawprintData }) {
  const [newDomain, setNewDomain] = useState("");
  const [showActivities, setShowActivities] = useState(false);

  async function togglePause() {
    await updateSettings({ trackingPaused: !data.settings.trackingPaused });
  }

  async function addExcludedDomain() {
    const domain = newDomain.trim().toLowerCase().replace(/^https?:\/\//, "");
    if (!domain) return;
    if (data.settings.excludedDomains.includes(domain)) {
      setNewDomain("");
      return;
    }
    await updateSettings({
      excludedDomains: [...data.settings.excludedDomains, domain],
    });
    setNewDomain("");
  }

  async function removeExcludedDomain(domain: string) {
    await updateSettings({
      excludedDomains: data.settings.excludedDomains.filter((d) => d !== domain),
    });
  }

  async function handleDeleteAll() {
    if (
      !confirm(
        "Delete all browsing memory? This removes every stored activity and journey and can't be undone."
      )
    )
      return;
    await deleteAllMemory();
  }

  const sortedActivities = [...data.activities].sort(
    (a, b) => b.timestamp - a.timestamp
  );

  return (
    <div className="flex flex-col gap-6 pb-4">
      <h1 className="text-sm font-semibold text-stone-500">Settings</h1>

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between rounded-lg border border-paw-100 bg-white px-3 py-3">
          <div>
            <p className="text-sm font-medium text-stone-800">Pause tracking</p>
            <p className="text-xs text-stone-400">
              Pawprint stops recording new activity while paused.
            </p>
          </div>
          <Toggle checked={data.settings.trackingPaused} onChange={togglePause} />
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-stone-500">Excluded sites</h2>
        <p className="text-xs text-stone-400">
          Pawprint never tracks common sensitive sites (webmail, banking,
          password managers, private messaging, health) by default. Add your
          own domains below.
        </p>
        <div className="flex gap-2">
          <input
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void addExcludedDomain()}
            placeholder="example.com"
            className="flex-1 rounded border border-paw-200 px-2 py-1.5 text-sm"
          />
          <button
            onClick={addExcludedDomain}
            className="rounded bg-paw-600 px-3 py-1.5 text-xs font-medium text-white"
          >
            Add
          </button>
        </div>
        {data.settings.excludedDomains.length > 0 && (
          <ul className="flex flex-col gap-1">
            {data.settings.excludedDomains.map((d) => (
              <li
                key={d}
                className="flex items-center justify-between rounded border border-paw-100 bg-white px-2 py-1.5 text-sm"
              >
                <span>{d}</span>
                <button
                  onClick={() => removeExcludedDomain(d)}
                  className="text-xs text-stone-400 hover:text-red-600"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
        <details className="text-xs text-stone-400">
          <summary className="cursor-pointer">
            View default excluded sites ({DEFAULT_EXCLUDED_DOMAINS.length})
          </summary>
          <p className="mt-1">{DEFAULT_EXCLUDED_DOMAINS.join(", ")}</p>
        </details>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-stone-500">Data</h2>
        <p className="text-xs text-stone-400">
          Ungrouped activity is automatically removed after{" "}
          {data.settings.retentionDays} days. Activity that's part of a
          journey is kept until you delete it or the journey.
        </p>
        <button
          onClick={() => setShowActivities((s) => !s)}
          className="self-start text-xs text-paw-600 hover:underline"
        >
          {showActivities ? "Hide" : "Manage"} individual activities (
          {sortedActivities.length})
        </button>
        {showActivities && (
          <div className="flex max-h-60 flex-col gap-1.5 overflow-y-auto">
            {sortedActivities.length === 0 && (
              <p className="text-xs text-stone-400">Nothing stored yet.</p>
            )}
            {sortedActivities.map((a) => (
              <ActivityRow
                key={a.id}
                activity={a}
                action={
                  <button
                    onClick={() => deleteActivity(a.id)}
                    className="flex-shrink-0 rounded border border-red-200 px-1.5 py-0.5 text-xs text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                }
              />
            ))}
          </div>
        )}
        <button
          onClick={handleDeleteAll}
          className="mt-2 self-start rounded border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
        >
          Delete all browsing memory
        </button>
      </section>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors ${
        checked ? "bg-paw-600" : "bg-stone-300"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
