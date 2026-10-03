/**
 * Layer C — combination rules (e.g. 官 + 印 + 驛馬). Data-driven; see
 * data/saju/interpretationRules.json.
 */
import type { Modifier } from "../../core/lifeModifiers";
import type { CurrentFortune, SajuChart } from "../chart";
import { tenGodGroupTotals, type TenGodGroup } from "../analysis/tenGods";
import { SYNERGY, type SynergyRule, pushDeltas } from "./mappings";

export interface EffectiveProfile {
  groups: Record<TenGodGroup, number>;
  shinsal: Record<string, number>;
}

export function effectiveProfile(chart: SajuChart, fortune?: CurrentFortune): EffectiveProfile {
  const blend = SYNERGY.transitGroupBlend;
  const natal = chart.tenGods.groups;
  const daeun = fortune?.daeun ? tenGodGroupTotals(fortune.daeun.tenGodDistribution) : undefined;
  const annual = fortune ? tenGodGroupTotals(fortune.annual.tenGodDistribution) : undefined;
  const groups = {} as Record<TenGodGroup, number>;
  for (const g of Object.keys(natal) as TenGodGroup[]) {
    let total = natal[g] * blend.natal;
    let weight = blend.natal;
    if (daeun) (total += daeun[g] * blend.daeun), (weight += blend.daeun);
    if (annual) (total += annual[g] * blend.annual), (weight += blend.annual);
    groups[g] = total / weight;
  }
  const shinsal: Record<string, number> = {};
  for (const s of chart.shinsal) shinsal[s.id] = s.strength;
  const transits = [fortune?.daeun?.activatedShinsal, fortune?.annual.activatedShinsal].flat().filter(Boolean);
  for (const s of transits) shinsal[s!.id] = Math.max(shinsal[s!.id] ?? 0, s!.strength);
  return { groups, shinsal };
}

/** Returns 0 when the rule does not hold, else a 0.5–1.5 intensity. */
export function ruleIntensity(rule: SynergyRule, p: EffectiveProfile): number {
  const ratios: number[] = [];
  for (const [g, min] of Object.entries(rule.when.groupsAtLeast ?? {})) ratios.push((p.groups[g as TenGodGroup] ?? 0) / (min as number));
  for (const [id, min] of Object.entries(rule.when.shinsalAtLeast ?? {})) ratios.push((p.shinsal[id] ?? 0) / min);
  if (ratios.length === 0) return 0;
  const weakest = Math.min(...ratios);
  if (weakest < 1) return 0;
  return Math.min(1.5, 0.5 + 0.5 * weakest);
}

export function synergyModifierTrace(chart: SajuChart, fortune?: CurrentFortune): { trace: Modifier[]; active: Array<{ id: string; label: string; intensity: number }> } {
  const profile = effectiveProfile(chart, fortune);
  const trace: Modifier[] = [];
  const active: Array<{ id: string; label: string; intensity: number }> = [];
  for (const rule of SYNERGY.rules) {
    const k = ruleIntensity(rule, profile);
    if (k > 0) {
      active.push({ id: rule.id, label: rule.label, intensity: k });
      pushDeltas(trace, rule.effects, k, `SAJU/synergy/${rule.id}`);
    }
  }
  return { trace, active };
}
