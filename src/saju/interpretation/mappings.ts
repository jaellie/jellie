/**
 * Layer C — typed access to the balancing data in data/saju/*.json.
 */
import mappingData from "../../../data/saju/modifierMappings.json";
import ruleData from "../../../data/saju/interpretationRules.json";
import { type LifeModifiers, type Modifier, isLifeModifierKey } from "../../core/lifeModifiers";
import type { TenGod, TenGodGroup } from "../analysis/tenGods";
import type { InteractionType } from "../analysis/relations";
import type { DayMasterStrengthClass } from "../analysis/dayMaster";

export type Deltas = Partial<LifeModifiers>;

export interface SynergyRule {
  id: string;
  label: string;
  when: { groupsAtLeast?: Partial<Record<TenGodGroup, number>>; shinsalAtLeast?: Record<string, number> };
  effects: Deltas;
}

function clean(obj: Record<string, unknown>): Deltas {
  const out: Deltas = {};
  for (const [k, v] of Object.entries(obj)) if (isLifeModifierKey(k) && typeof v === "number") out[k] = v;
  return out;
}
function cleanMap<K extends string>(obj: Record<string, unknown>): Record<K, Deltas> {
  const out = {} as Record<K, Deltas>;
  for (const [k, v] of Object.entries(obj)) if (!k.startsWith("_") && v && typeof v === "object") out[k as K] = clean(v as Record<string, unknown>);
  return out;
}

const m = mappingData;
export const MAPPINGS = {
  layerScales: m.layerScales,
  tenGroup: {
    negativeFactor: m.tenGodGroups.negativeFactor,
    transitPartWeight: m.tenGodGroups.transitPartWeight,
    mappings: cleanMap<TenGodGroup>(m.tenGodGroups.mappings),
  },
  tenGodAccents: cleanMap<TenGod>(m.tenGodAccents.mappings),
  shinsal: cleanMap<string>(m.shinsal),
  dayMasterStrength: cleanMap<DayMasterStrengthClass>(m.dayMasterStrength),
  favorability: { favorable: clean(m.favorability.favorable), unfavorable: clean(m.favorability.unfavorable) },
  interactions: {
    natalScale: m.interactions.natalScale,
    types: cleanMap<InteractionType>(m.interactions.types),
    dayPillarAccents: cleanMap<InteractionType>(m.interactions.dayPillarAccents),
    yearPillarAccents: cleanMap<InteractionType>(m.interactions.yearPillarAccents),
  },
};

export const SYNERGY = {
  transitGroupBlend: ruleData.transitGroupBlend,
  rules: ruleData.rules.map((r) => ({ ...r, effects: clean(r.effects) })) as unknown as SynergyRule[],
};

/** Append `deltas × factor` to a trace list, tagged with `source`. */
export function pushDeltas(list: Modifier[], deltas: Deltas | undefined, factor: number, source: string): void {
  if (!deltas || factor === 0) return;
  for (const [key, value] of Object.entries(deltas)) {
    if (isLifeModifierKey(key) && value) list.push({ key, value: value * factor, source });
  }
}
