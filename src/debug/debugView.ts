/**
 * Developer/debug views (plain text). Explains *why* the simulation leaned the
 * way it did — essential for balancing. No calculation logic lives here.
 */
import { formatGameDate } from "../core/gameDate";
import { LIFE_MODIFIER_KEYS, type LifeModifiers, type Modifier, toMultiplier } from "../core/lifeModifiers";
import type { SajuChart } from "../saju/chart";
import { SAJU_LAYERS, type SajuModifierResult } from "../saju/interpretation/sajuModifierEngine";
import { pillarToHanja } from "../saju/types";
import type { Opportunity } from "../sim/opportunity";

const sign = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(2)}`;

function topKeys(m: LifeModifiers, n = 4, min = 0.02): Array<[string, number]> {
  return LIFE_MODIFIER_KEYS.map((k) => [k, m[k]] as [string, number])
    .filter(([, v]) => Math.abs(v) >= min)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .slice(0, n);
}

export function formatSajuDebug(chart: SajuChart, r: SajuModifierResult): string {
  const f = r.fortune;
  const out: string[] = [];
  out.push(`CURRENT DATE: ${formatGameDate(r.date)}   AGE: ${f.age.toFixed(1)}`);
  out.push("");
  out.push("SAJU (natal signals)");
  for (const s of chart.shinsal) out.push(`  ${s.nameEn.padEnd(16)} ${s.strength.toFixed(2)}`);
  for (const [g, v] of Object.entries(chart.tenGods.groups)) out.push(`  ${g.padEnd(16)} ${(v / 100).toFixed(2)}`);
  out.push(`  DayMaster        ${chart.dayMaster.stem} ${chart.dayMasterStrength} (${(chart.dayMaster.strength ?? 0).toFixed(2)})`);
  const titles: Record<string, string> = {
    natal: "NATAL",
    daeun: f.daeun ? `DAEUN ${pillarToHanja(f.daeun.pillar)} (age ${f.daeun.startAge.toFixed(1)}–${f.daeun.endAge.toFixed(1)})` : "DAEUN (not started)",
    annual: `ANNUAL ${pillarToHanja(f.annual.pillar)} (${f.annual.year})`,
    monthly: `MONTHLY ${pillarToHanja(f.monthly.pillar)}`,
    synergy: `SYNERGY ${r.activeSynergies.map((s) => s.id).join(", ") || "(none)"}`,
  };
  for (const layer of SAJU_LAYERS) {
    out.push("");
    out.push(titles[layer]);
    const keys = topKeys(r.layerTotals[layer]);
    if (keys.length === 0) out.push("  (neutral)");
    for (const [k, v] of keys) out.push(`  ${k.padEnd(16)} ${sign(v)}`);
  }
  out.push("");
  out.push("FINAL SAJU MULTIPLIERS");
  for (const [k, v] of topKeys(r.modifiers, 8, 0.03)) out.push(`  ${k.padEnd(16)} ×${toMultiplier(v).toFixed(2)}`);
  return out.join("\n");
}

/** "WHY DID THIS EVENT HAPPEN?" */
export function explainOpportunity(opp: Opportunity): string {
  const s = opp.score;
  const out = [`${opp.emoji} ${opp.title}`, "", `Base probability: ${s.base.toFixed(3)}`];
  for (const f of s.factors) {
    out.push(`${f.name.padEnd(12)} ×${f.value.toFixed(2)}`);
    for (const d of f.details ?? []) out.push(`   ${sign(d.value)}  ${d.label}`);
  }
  out.push("");
  out.push(`Final probability: ${s.probability.toFixed(3)}${s.roll !== undefined ? `   (roll ${s.roll.toFixed(3)} → ${s.roll < s.probability ? "offered" : "not offered"})` : ""}`);
  return out.join("\n");
}

export function summarizeModifierTrace(trace: Modifier[], n = 10): string {
  return [...trace]
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
    .slice(0, n)
    .map((m) => `${sign(m.value)} ${m.key.padEnd(14)} ${m.source}`)
    .join("\n");
}
