/**
 * Layer C — time-dependent tendencies from a Daeun / annual / monthly pillar.
 */
import type { Modifier } from "../../core/lifeModifiers";
import type { TransitPillarAnalysis } from "../analysis/fortunePillar";
import { tenGodInfo } from "../analysis/tenGods";
import { MAPPINGS, pushDeltas } from "./mappings";
import { interactionModifiers } from "./interactions";

export function transitModifierTrace(t: TransitPillarAnalysis, layer: "daeun" | "annual" | "monthly"): Modifier[] {
  const out: Modifier[] = [];
  const scale = MAPPINGS.layerScales[layer];
  const partW = MAPPINGS.tenGroup.transitPartWeight;
  for (const part of t.tenGodInteractions) {
    const w = partW[part.part] * scale;
    const info = tenGodInfo(part.tenGod);
    const src = `SAJU/${layer}/${part.part}:${part.tenGod}`;
    pushDeltas(out, MAPPINGS.tenGroup.mappings[info.group], w, src);
    pushDeltas(out, MAPPINGS.tenGodAccents[part.tenGod], w, src);
    if (part.favorability === 1) pushDeltas(out, MAPPINGS.favorability.favorable, w, `SAJU/${layer}/${part.part}:favorable-${part.element}`);
    if (part.favorability === -1) pushDeltas(out, MAPPINGS.favorability.unfavorable, w, `SAJU/${layer}/${part.part}:unfavorable-${part.element}`);
  }
  for (const s of t.activatedShinsal) {
    pushDeltas(out, MAPPINGS.shinsal[s.id], s.strength * scale, `SAJU/${layer}/shinsal/${s.id}`);
  }
  out.push(...interactionModifiers(t.elementInteraction, scale, `SAJU/${layer}/interaction`));
  return out;
}
