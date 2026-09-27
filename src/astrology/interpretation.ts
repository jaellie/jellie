/**
 * Astrology Layer C — chart, transits, progressions and returns → LifeModifiers,
 * as an "ASTROLOGY" DestinyModifierSource. Balancing lives in
 * data/astrology/modifierMappings.json.
 *
 * Layers: natal (lifelong blueprint) · progressed (inner chapter) · annual
 * (slow transits) · solarReturn (this birthday-year's theme) · monthly (fast
 * transits) · lunarReturn (this month's mood). Transit/return contacts are
 * weighted by orb tier (<1° strong, 1–2° moderate, >2° background) and phase
 * (applying > separating).
 */
import mapping from "../../data/astrology/modifierMappings.json";
import type { GameDate } from "../core/gameDate";
import { type DestinyModifierSource, type LifeModifiers, type Modifier, combineModifiers, isLifeModifierKey, sumModifierList } from "../core/lifeModifiers";
import { type AstrologyChart, type AstrologyTransits, FAST_PLANETS, SLOW_PLANETS, calculateTransits, jdForMonth, signInfo } from "./chart";
import { type Progressions, type ReturnChart, activeSolarReturn, calculateLunarReturn, calculateProgressions, orbWeight, phaseWeight } from "./techniques";

type Deltas = Partial<LifeModifiers>;
const M = mapping as unknown as {
  layerScales: { natal: number; annual: number; monthly: number; progressed: number; solarReturn: number; lunarReturn: number };
  houses: Record<string, Deltas>;
  planets: Record<string, { houseFactor: number; flavour: Deltas }>;
  natalHouseScale: number;
  elements: Record<string, Deltas>;
  modalities: Record<string, Deltas>;
  natalAspects: Record<string, Deltas>;
  transitAspects: Record<string, Deltas>;
  returns: Record<string, Deltas>;
  timeTechniques: {
    pointDomains: Record<string, Deltas>;
    nature: Record<"harmonious" | "hard" | "conjunction", number>;
    hardExtras: Deltas;
    progressed: { aspect: number; progressedPointShare: number; moonHouse: number; ingress: Record<"SUN" | "MOON", Deltas> };
    solarReturn: { sunHouse: number; moonHouse: number; ascNatalHouse: number; angularPlanet: number; contact: number };
    lunarReturn: { moonHouse: number; ascNatalHouse: number; angularPlanet: number; contact: number };
  };
};
const TT = M.timeTechniques;

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
      push(out, M.transitAspects[key], scale * orbWeight(a.orb) * phaseWeight(!!a.applying), `ASTROLOGY/${layer}/transit/${key}${a.applying ? "(applying)" : ""}`);
    }
    if (hit.isReturn) push(out, M.returns[hit.planet], scale, `ASTROLOGY/${layer}/${hit.planet}_RETURN`);
  }
  return out;
}

/** A conjunction with Saturn or Pluto weighs like a hard aspect (pressure, endings), whatever the geometry says. */
function effectiveNature(a: string, b: string, nature: "harmonious" | "hard" | "conjunction"): "harmonious" | "hard" | "conjunction" {
  return nature === "conjunction" && [a, b].some((p) => p === "SATURN" || p === "PLUTO") ? "hard" : nature;
}

/** Push a point's life areas up (harmonious/conjunction) or down (+ volatility) for a contact of this nature. */
function pushDomain(out: Modifier[], point: string, nature: "harmonious" | "hard" | "conjunction", factor: number, source: string) {
  push(out, TT.pointDomains[point], TT.nature[nature] * factor, source);
  if (nature === "hard") push(out, TT.hardExtras, factor, source);
}

/** Secondary progressions: exact (≤1°) progressed→natal aspects, the progressed Moon's house, Sun/Moon sign changes. */
export function progressionTrace(p: Progressions): Modifier[] {
  const out: Modifier[] = [];
  const scale = M.layerScales.progressed;
  for (const a of p.aspects) {
    const nature = effectiveNature(a.progressed, a.natalPoint, a.nature);
    const f = scale * TT.progressed.aspect * orbWeight(a.orb) * phaseWeight(a.applying);
    const src = `ASTROLOGY/progressed/${a.progressed}>${a.natalPoint}:${nature}${a.applying ? "(applying)" : ""}`;
    pushDomain(out, a.natalPoint, nature, f, src);
    pushDomain(out, a.progressed, nature, f * TT.progressed.progressedPointShare, src);
  }
  const moon = p.positions.MOON;
  if (moon) push(out, M.houses[String(moon.natalHouse)], scale * TT.progressed.moonHouse, `ASTROLOGY/progressed/MOON@H${moon.natalHouse}`);
  for (const i of p.ingresses) push(out, TT.progressed.ingress[i.point], scale, `ASTROLOGY/progressed/${i.point}→${i.sign}`);
  return out;
}

/** Solar / Lunar Return: return houses of the lights, the return ASC in the natal chart, angular planets, contacts to natal lights/angles. */
export function returnTrace(r: ReturnChart): Modifier[] {
  const layer = r.kind === "SOLAR" ? "solarReturn" : "lunarReturn";
  const w = TT[layer];
  const scale = M.layerScales[layer];
  const out: Modifier[] = [];
  if (r.anglesReliable) {
    if (r.kind === "SOLAR" && r.houses.SUN) push(out, M.houses[String(r.houses.SUN)], scale * TT.solarReturn.sunHouse, `ASTROLOGY/${layer}/SUN@H${r.houses.SUN}`);
    if (r.houses.MOON) push(out, M.houses[String(r.houses.MOON)], scale * w.moonHouse, `ASTROLOGY/${layer}/MOON@H${r.houses.MOON}`);
    if (r.ascInNatalHouse) push(out, M.houses[String(r.ascInNatalHouse)], scale * w.ascNatalHouse, `ASTROLOGY/${layer}/ASC@natalH${r.ascInNatalHouse}`);
    for (const p of r.angular) push(out, M.planets[p]?.flavour, scale * w.angularPlanet, `ASTROLOGY/${layer}/angular/${p}`);
  }
  for (const c of r.contacts) {
    const nature = effectiveNature(c.planet, c.natalPoint, c.nature);
    pushDomain(out, c.natalPoint, nature, scale * w.contact * orbWeight(c.orb), `ASTROLOGY/${layer}/${c.planet}>${c.natalPoint}:${nature}`);
  }
  return out;
}

export type AstroLayer = "natal" | "progressed" | "annual" | "solarReturn" | "monthly" | "lunarReturn";
export const ASTRO_LAYERS: AstroLayer[] = ["natal", "progressed", "annual", "solarReturn", "monthly", "lunarReturn"];

export interface AstrologyModifierResult {
  date: GameDate;
  modifiers: LifeModifiers;
  layerTotals: Record<AstroLayer, LifeModifiers>;
  trace: Record<AstroLayer, Modifier[]>;
  transits: { slow: AstrologyTransits; fast: AstrologyTransits };
  progressions: Progressions;
  solarReturn: ReturnChart;
  lunarReturn: ReturnChart;
}

export class AstrologyModifierEngine {
  private natal = new WeakMap<AstrologyChart, Modifier[]>();
  private monthCache = new WeakMap<AstrologyChart, Map<string, AstrologyModifierResult>>();

  private srCache = new WeakMap<AstrologyChart, Map<number, ReturnChart>>();

  /** The Solar Return in effect at `jd` (cached per birthday-year). */
  solarReturn(chart: AstrologyChart, jd: number, calendarYear: number): ReturnChart {
    let cache = this.srCache.get(chart);
    if (!cache) this.srCache.set(chart, (cache = new Map()));
    for (const r of cache.values()) if (r.jdUT <= jd && jd < r.endJd) return r;
    const r = activeSolarReturn(chart, jd, calendarYear);
    if (cache.size > 12) cache.clear();
    cache.set(r.jdUT, r);
    return r;
  }

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
    const progressions = calculateProgressions(chart, jd);
    const solarReturn = this.solarReturn(chart, jd, date.year);
    const lunarReturn = calculateLunarReturn(chart, jd);
    const trace: Record<AstroLayer, Modifier[]> = {
      natal: this.natalTrace(chart),
      progressed: progressionTrace(progressions),
      annual: transitTrace(slow, "annual"),
      solarReturn: returnTrace(solarReturn),
      monthly: transitTrace(fast, "monthly"),
      lunarReturn: returnTrace(lunarReturn),
    };
    const layerTotals = Object.fromEntries(ASTRO_LAYERS.map((l) => [l, sumModifierList(trace[l])])) as Record<AstroLayer, LifeModifiers>;
    const res = { date, modifiers: combineModifiers(...ASTRO_LAYERS.map((l) => layerTotals[l])), layerTotals, trace, transits: { slow, fast }, progressions, solarReturn, lunarReturn };
    if (cache.size > 240) cache.clear();
    cache.set(key, res);
    return res;
  }

  calculate(chart: AstrologyChart, date: GameDate): LifeModifiers {
    return this.calculateDetailed(chart, date).modifiers;
  }

  toModifierSource(r: AstrologyModifierResult, weight = 1): DestinyModifierSource {
    return { source: "ASTROLOGY", modifiers: r.modifiers, weight, breakdown: ASTRO_LAYERS.flatMap((l) => r.trace[l]) };
  }
}
