import type { Modifier } from "../../core/lifeModifiers";
import type { ElementInteraction } from "../analysis/relations";
import { MAPPINGS, pushDeltas } from "./mappings";

export function interactionModifiers(list: ElementInteraction[], scale: number, sourcePrefix: string): Modifier[] {
  const out: Modifier[] = [];
  const cfg = MAPPINGS.interactions;
  for (const it of list) {
    const tag = `${sourcePrefix}/${it.type}(${it.between.join("+")})`;
    pushDeltas(out, cfg.types[it.type], scale, tag);
    if (it.between.includes("day")) pushDeltas(out, cfg.dayPillarAccents[it.type], scale, `${tag}/dayPillar`);
    if (it.between.includes("year")) pushDeltas(out, cfg.yearPillarAccents[it.type], scale, `${tag}/yearPillar`);
  }
  return out;
}
