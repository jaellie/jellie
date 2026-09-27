/**
 * Layer C — static (natal) tendencies. Computed once per chart.
 */
import type { Modifier } from "../../core/lifeModifiers";
import { clamp } from "../../core/lifeModifiers";
import type { SajuChart } from "../chart";
import { TEN_GODS, type TenGodGroup } from "../analysis/tenGods";
import { MAPPINGS, pushDeltas } from "./mappings";
import { interactionModifiers } from "./interactions";

export function groupProminence(share: number): number {
  return clamp((share - 20) / 20, -1, 2);
}

export function natalModifierTrace(chart: SajuChart): Modifier[] {
  const out: Modifier[] = [];
  const tg = MAPPINGS.tenGroup;

  for (const [group, share] of Object.entries(chart.tenGods.groups) as Array<[TenGodGroup, number]>) {
    const p = groupProminence(share);
    const factor = p < 0 ? p * tg.negativeFactor : p;
    pushDeltas(out, tg.mappings[group], factor, `SAJU/natal/tenGods/${group}(${share.toFixed(0)}%)`);
  }
  for (const god of TEN_GODS) {
    const share = chart.tenGods.distribution[god.distributionKey];
    const p = clamp((share - 10) / 10, -1, 2);
    if (p > 0) pushDeltas(out, MAPPINGS.tenGodAccents[god.id], p, `SAJU/natal/tenGod/${god.id}`);
  }
  for (const s of chart.shinsal) {
    if (s.present) pushDeltas(out, MAPPINGS.shinsal[s.id], s.strength, `SAJU/natal/shinsal/${s.id}(${s.strength.toFixed(2)})`);
  }
  pushDeltas(out, MAPPINGS.dayMasterStrength[chart.dayMasterStrength], 1, `SAJU/natal/dayMaster/${chart.dayMasterStrength}`);
  out.push(...interactionModifiers(chart.natalInteractions, MAPPINGS.interactions.natalScale, "SAJU/natal/interaction"));
  return out;
}
