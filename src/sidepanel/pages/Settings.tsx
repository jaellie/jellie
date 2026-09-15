import React, { useState } from "react";
import { PawprintData } from "../useStore";
import {
  deleteActivity,
  deleteAllMemory,
  updateSettings,
} from "../../shared/storage";
import { DEFAULT_EXCLUDED_DOMAINS } from "../../shared/sensitiveSites";
import ActivityRow from "../components/ActivityRow";
import PawIcon from "../components/PawIcon";

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
    <div className="flex flex-col gap-7 pb-4">
      <h1 className="font-serif text-[15px] text-ink-900">Settings</h1>

      <Section title="Tracking">
        <Row
          label="Pause tracking"
          description="Pawprint isn't recording new browsing activity while paused."
        >
          <Toggle checked={data.settings.trackingPaused} onChange={togglePause} />
        </Row>
      </Section>

      <Section title="Privacy">
        <p className="text-xs text-ink-500">
          Pawprint never tracks common sensitive sites — webmail, banking,
          password managers, private messaging, health — by default. Add
          your own excluded sites below.
        </p>
        <div className="mt-2 flex gap-2">
          <input
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void addExcludedDomain()}
            placeholder="example.com"
            className="flex-1 rounded border border-ink-200 bg-cream-50 px-2 py-1.5 text-sm text-ink-900"
          />
          <button
            onClick={addExcludedDomain}
            className="rounded bg-ink-900 px-3 py-1.5 text-xs font-medium text-cream-50"
          >
            Add
          </button>
        </div>
        {data.settings.excludedDomains.length > 0 && (
          <ul className="mt-2 flex flex-col gap-1">
            {data.settings.excludedDomains.map((d) => (
              <li
                key={d}
                className="flex items-center justify-between rounded border border-ink-200/60 bg-cream-50 px-2 py-1.5 text-sm text-ink-900"
              >
                <span>{d}</span>
                <button
                  onClick={() => removeExcludedDomain(d)}
                  className="text-xs text-ink-300 hover:text-ink-700"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
        <details className="mt-2 text-xs text-ink-500">
          <summary className="cursor-pointer">
            View default excluded sites ({DEFAULT_EXCLUDED_DOMAINS.length})
          </summary>
          <p className="mt-1">{DEFAULT_EXCLUDED_DOMAINS.join(", ")}</p>
        </details>
      </Section>

      <Section title="Data">
        <p className="text-xs text-ink-500">
          Ungrouped activity is automatically removed after{" "}
          {data.settings.retentionDays} days. Activity that&apos;s part of a
          journey is kept until you delete it or the journey.
        </p>
        <button
          onClick={() => setShowActivities((s) => !s)}
          className="mt-2 self-start text-xs text-ink-500 underline decoration-ink-200 underline-offset-2 hover:text-ink-700"
        >
          {showActivities ? "Hide" : "Manage"} individual activities (
          {sortedActivities.length})
        </button>
        {showActivities && (
          <div className="mt-2 flex max-h-60 flex-col gap-1.5 overflow-y-auto">
            {sortedActivities.length === 0 && (
              <p className="text-xs text-ink-500">Nothing stored yet.</p>
            )}
            {sortedActivities.map((a) => (
              <ActivityRow
                key={a.id}
                activity={a}
                action={
                  <button
                    onClick={() => deleteActivity(a.id)}
                    className="flex-shrink-0 rounded border border-ink-200 px-1.5 py-0.5 text-[11px] text-ink-500 hover:text-ink-900"
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
          className="mt-3 self-start rounded-full border border-ink-200 px-3.5 py-1.5 text-xs font-medium text-ink-700 hover:border-ink-300"
        >
          Delete all browsing memory
        </button>
      </Section>

      <Section title="About">
        <div className="flex items-center gap-2">
          <PawIcon className="h-4 w-4 text-ink-700" />
          <span className="font-serif text-sm text-ink-900">Pawprint</span>
        </div>
        <p className="mt-1.5 text-xs text-ink-500">
          An AI-assisted external memory for fragmented web browsing.
          Everything is stored on this device — no accounts, no cloud, no
          sharing.
        </p>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-1">
      <h2 className="text-xs font-medium uppercase tracking-wide text-ink-500">
        {title}
      </h2>
      <div className="mt-1 rounded-lg border border-ink-200/60 bg-cream-50 px-3.5 py-3">
        {children}
      </div>
    </section>
  );
}

function Row({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm text-ink-900">{label}</p>
        <p className="text-xs text-ink-500">{description}</p>
      </div>
      {children}
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
        checked ? "bg-ink-900" : "bg-ink-200"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-cream-50 shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
