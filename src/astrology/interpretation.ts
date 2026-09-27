/**
 * Astrology Layer C — chart & transits → LifeModifiers, as an "ASTROLOGY"
 * DestinyModifierSource. Balancing lives in data/astrology/modifierMappings.json.
 */
import mapping from "../../data/astrology/modifierMappings.json";
import type { GameDate } from "../core/gameDate";
import { type DestinyModifierSource, type LifeModifiers, type Modifier, combineModifiers, isLifeModifierKey, sumModifierList } from "../core/lifeModifiers";
import { type AstrologyChart, type AstrologyTransits, FAST_PLANETS, SLOW_PLANETS, calculateTransits, jdForMonth, signInfo } from "./chart";

type Deltas = Partial<LifeModifiers>;
const M = mapping as unknown as {
  layerScales: { natal: number; annual: number; monthly: number };
  houses: Record<string, Deltas>;
  planets: Record<string, { houseFactor: number; flavour: Deltas }>;
  natalHouseScale: number;
  elements: Record<string, Deltas>;
  modalities: Record<string, Deltas>;
  natalAspects: Record<string, Deltas>;
  transitAspects: Record<string, Deltas>;
  returns: Record<string, Deltas>;
};

function push(list: Modifier[], deltas: Deltas | undefined, factor: number, source: string) {
  if (!deltas || !factor) return;
  for (const [k, v] of Object.entries(deltas)) if (isLifeModifierKey(k) && typeof v === "number" && v) list.push({ key: k, value: v * factor, source });
}

export function natalAstrologyTrace(chart: AstrologyChart): Modifier[] {
  const out: Modifier[] = [];
  const total = Object.values(chart.elementBalance).reduce((a, b) => a + b, 0) || 1;
  for (const [el, w] of Object.entries(chart.elementBalance)) push(out, M.elements[el], ((w / total) - 0.25) * 4, `ASTROLOGY/natal/element/${el}`);
  const mt = Object.values(chart.modalityBalance).reduce((a, b) => a + b, 0) || 1;
  for (const [mo, w] of Object.entries(chart.modalityBalance)) push(out, M.modalities[mo], ((w / mt) - 1 / 3) * 3, `ASTROLOGY/natal/modality/${mo}`);
  for (const [planet, pos] of Object.entries(chart.positions)) {
    if (!pos || planet === "ASC" || planet === "MC") continue;
    const pm = M.planets[planet];
    push(out, M.houses[String(pos.house)], pm.houseFactor * M.natalHouseScale, `ASTROLOGY/natal/${planet}@H${pos.house}(${signInfo(pos.sign).glyph})`);
  }
  for (const a of chart.aspects) {
    const key = [a.a, a.b].sort().join("-") + ":" + a.nature;
    push(out, M.natalAspects[key], 1 - a.orb / 10, `ASTROLOGY/natal/aspect/${key}`);
  }
  return out.map((m) => ({ ...m, value: m.value * M.layerScales.natal }));
}

export function transitTrace(t: AstrologyTransits, layer: "annual" | "monthly"): Modifier[] {
  const out: Modifier[] = [];
  const scale = M.layerScales[layer];
  for (const hit of t.hits) {
    const pm = M.planets[hit.planet];
    push(out, M.houses[String(hit.house)], pm.houseFactor * scale, `ASTROLOGY/${layer}/${hit.planet}@H${hit.house}`);
    push(out, pm.flavour, scale, `ASTROLOGY/${layer}/${hit.planet}`);
    for (const a of hit.aspects) {
      const key = `${hit.planet}>${a.natalPoint}:${a.nature}`;
      push(out, M.transitAspects[key], scale * Math.max(0.2, 1 - a.orb / 4.5), `ASTROLOGY/${layer}/transit/${key}`);
    }
    if (hit.isReturn) push(out, M.returns[hit.planet], scale, `ASTROLOGY/${layer}/${hit.planet}_RETURN`);
  }
  return out;
}

export type AstroLayer = "natal" | "annual" | "monthly";

export interface AstrologyModifierResult {
  date: GameDate;
  modifiers: LifeModifiers;
  layerTotals: Record<AstroLayer, LifeModifiers>;
  trace: Record<AstroLayer, Modifier[]>;
  transits: { slow: AstrologyTransits; fast: AstrologyTransits };
}

export class AstrologyModifierEngine {
  private natal = new WeakMap<AstrologyChart, Modifier[]>();
  private monthCache = new WeakMap<AstrologyChart, Map<string, AstrologyModifierResult>>();

  natalTrace(chart: AstrologyChart): Modifier[] {
    let t = this.natal.get(chart);
    if (!t) this.natal.set(chart, (t = natalAstrologyTrace(chart)));
    return t;
  }

  calculateDetailed(chart: AstrologyChart, date: GameDate): AstrologyModifierResult {
    let cache = this.monthCache.get(chart);
    if (!cache) this.monthCache.set(chart, (cache = new Map()));
    const key = `${date.year}-${date.month}`;
    const hit = cache.get(key);
    if (hit) return hit;
    const jd = jdForMonth(date.year, date.month);
    const slow = calculateTransits(chart, jd, SLOW_PLANETS);
    const fast = calculateTransits(chart, jd, FAST_PLANETS);
    const trace = { natal: this.natalTrace(chart), annual: transitTrace(slow, "annual"), monthly: transitTrace(fast, "monthly") };
    const layerTotals = { natal: sumModifierList(trace.natal), annual: sumModifierList(trace.annual), monthly: sumModifierList(trace.monthly) };
    const res = { date, modifiers: combineModifiers(layerTotals.natal, layerTotals.annual, layerTotals.monthly), layerTotals, trace, transits: { slow, fast } };
    if (cache.size > 240) cache.clear();
    cache.set(key, res);
    return res;
  }

  calculate(chart: AstrologyChart, date: GameDate): LifeModifiers {
    return this.calculateDetailed(chart, date).modifiers;
  }

  toModifierSource(r: AstrologyModifierResult, weight = 1): DestinyModifierSource {
    return { source: "ASTROLOGY", modifiers: r.modifiers, weight, breakdown: [...r.trace.natal, ...r.trace.annual, ...r.trace.monthly] };
  }
}
