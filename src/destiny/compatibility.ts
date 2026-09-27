/**
 * 궁합 — hidden compatibility between the player and one other person (the
 * "destined person" from setup). Never shown to the player: it only tilts
 * love outcomes, as part of the chart's 70%.
 *
 *  사주   day stems (일간) combining or clashing, spouse palaces (일지) in
 *         harmony/clash/harm/punishment, year branches (띠), and elements that
 *         complete each other (what one lacks, the other has in plenty).
 *  점성술 synastry, by priority: Sun/Moon/Venus/Mars/ASC cross-contacts =
 *         chemistry & emotional safety; Saturn contacts = staying power (and
 *         friction when hard); Uranus/Neptune/Pluto on personal points =
 *         intensity. Tight orbs weigh most.
 *  MBTI   shared N/S worldview, J/P balance, a few classic pairings.
 *
 * Missing data just means a neutral part (no birth date → only MBTI speaks).
 */
import { type AstrologyChart, type ChartPoint, calculateAstrologyChart, findAspectWithin } from "../astrology/chart";
import type { Planet } from "../astrology/ephemeris";
import { parseMbti } from "../mbti/mbti";
import { findInteractions } from "../saju/analysis/relations";
import { getElementRelationship } from "../saju/analysis/fiveElements";
import { type SajuChart, calculateNatalChart } from "../saju/chart";
import type { BirthData } from "../saju/calendar/fourPillars";

export interface CompatPerson {
  birth?: BirthData;
  mbti?: string;
}

export interface Compatibility {
  /** 0..1 overall; 0.5 = neutral. */
  score: number;
  /** Attraction (0..~2). */
  chemistry: number;
  /** Staying power / emotional safety (0..~2). */
  stability: number;
  /** Conflict (0..~2). */
  friction: number;
  /** Each part in -1..1 (0 when that system has no data). */
  parts: { saju: number; astrology: number; mbti: number };
}

const clamp1 = (x: number) => Math.max(-1, Math.min(1, x));

/** 사주 궁합: day pillars first (일간 = the self, 일지 = the spouse palace), then 띠 and element balance. */
export function sajuCompatibility(a: SajuChart, b: SajuChart): number {
  let s = 0;
  const day = findInteractions([{ label: "A", pillar: a.fourPillars.day }, { label: "B", pillar: b.fourPillars.day }]);
  const has = (list: typeof day, t: string) => list.some((x) => x.type === t);
  if (has(day, "STEM_COMBINATION")) s += 0.35; // 일간합: drawn to each other
  if (has(day, "STEM_CLASH")) s -= 0.2;
  if (has(day, "SIX_HARMONY")) s += 0.3; // 일지 육합: a comfortable home together
  if (has(day, "HALF_HARMONY")) s += 0.15;
  if (has(day, "BRANCH_CLASH")) s -= 0.3; // 일지 충: the spouse palaces collide
  if (has(day, "HARM")) s -= 0.15;
  if (has(day, "PUNISHMENT")) s -= 0.12;
  const year = findInteractions([{ label: "A", pillar: a.fourPillars.year }, { label: "B", pillar: b.fourPillars.year }]);
  if (has(year, "SIX_HARMONY") || has(year, "HALF_HARMONY")) s += 0.1; // 띠 궁합
  if (has(year, "BRANCH_CLASH")) s -= 0.1;
  // Elements that complete each other: my favorable element is strong in you (and vice versa).
  const fills = (x: SajuChart, y: SajuChart) => (x.elementBalance.favorable ?? []).some((e) => y.elementBalance.strongest.includes(e));
  const hurts = (x: SajuChart, y: SajuChart) => (x.elementBalance.unfavorable ?? []).some((e) => y.elementBalance.strongest.includes(e));
  s += (fills(a, b) ? 0.15 : 0) + (fills(b, a) ? 0.15 : 0) - (hurts(a, b) ? 0.1 : 0) - (hurts(b, a) ? 0.1 : 0);
  const rel = getElementRelationship(a.dayMaster.element, b.dayMaster.element);
  if (rel === "GENERATES" || rel === "GENERATED_BY") s += 0.1; // 상생
  else if (rel === "CONTROLS" || rel === "CONTROLLED_BY") s -= 0.05; // 상극: a little friction
  return clamp1(s);
}

const PERSONAL: ChartPoint[] = ["SUN", "MOON", "VENUS", "MARS", "ASC"];
const OUTER: Planet[] = ["URANUS", "NEPTUNE", "PLUTO"];
const synOrb = (orb: number) => (orb < 1 ? 1 : orb < 2 ? 0.8 : orb < 3.5 ? 0.55 : 0.3);

/** Synastry between two charts → chemistry / stability / friction. */
export function synastry(a: AstrologyChart, b: AstrologyChart): { chemistry: number; stability: number; friction: number } {
  let chemistry = 0, stability = 0, friction = 0;
  const pos = (c: AstrologyChart, p: ChartPoint) => (p === "ASC" && !c.timeKnown ? undefined : c.positions[p]?.longitude);
  const pair = (x: ChartPoint, y: ChartPoint, set: [ChartPoint, ChartPoint]) => (x === set[0] && y === set[1]) || (x === set[1] && y === set[0]);
  for (const [p1, p2] of [[a, b], [b, a]] as const) {
    for (const x of PERSONAL) {
      for (const y of PERSONAL) {
        if (p1 === b && x === y) continue; // same-point pairs are symmetric: count once
        const lx = pos(p1, x), ly = pos(p2, y);
        if (lx === undefined || ly === undefined) continue;
        const f = findAspectWithin(lx, ly, 5);
        if (!f) continue;
        const w = synOrb(f.orb);
        const soft = f.nature !== "hard";
        if (pair(x, y, ["VENUS", "MARS"])) soft ? (chemistry += 0.35 * w) : ((chemistry += 0.2 * w), (friction += 0.15 * w));
        else if (pair(x, y, ["SUN", "MOON"])) soft ? ((stability += 0.3 * w), (chemistry += 0.15 * w)) : (friction += 0.2 * w);
        else if (x === "MOON" && y === "MOON") soft ? (stability += 0.25 * w) : (friction += 0.2 * w);
        else if (x === "VENUS" || y === "VENUS") soft ? (chemistry += 0.25 * w) : (friction += 0.1 * w);
        else if ((x === "ASC" || y === "ASC") && soft) chemistry += 0.2 * w;
        else if (x === "MARS" || y === "MARS") !soft && (friction += 0.2 * w);
      }
      // Saturn on the other's personal points: staying power, or weight and friction.
      const sat = pos(p1, "SATURN"), ly = pos(p2, x);
      if (sat !== undefined && ly !== undefined) {
        const f = findAspectWithin(sat, ly, 4);
        if (f) {
          const w = synOrb(f.orb);
          if (f.nature === "harmonious") stability += 0.25 * w;
          else if (f.nature === "conjunction") (stability += 0.2 * w), (friction += 0.1 * w);
          else (friction += 0.25 * w), (stability += 0.1 * w);
        }
      }
      // Outer planets on personal points: intensity (exciting, a little unstable).
      for (const o of OUTER) {
        const lo = pos(p1, o);
        if (lo === undefined || ly === undefined) continue;
        const f = findAspectWithin(lo, ly, 3);
        if (!f) continue;
        const w = synOrb(f.orb);
        if (f.nature === "harmonious") chemistry += 0.05 * w;
        else (chemistry += 0.15 * w), (friction += 0.1 * w);
      }
    }
  }
  return { chemistry, stability, friction };
}

const GOLDEN = [["INFJ", "ENFP"], ["INTJ", "ENFP"], ["INFP", "ENFJ"], ["INTP", "ENTJ"], ["ISFJ", "ESFP"], ["ISTJ", "ESFP"], ["ISFP", "ESTJ"], ["ISTP", "ESTJ"], ["INFP", "ENTJ"], ["INTJ", "ENTP"]];

export function mbtiCompatibility(a: string, b: string): number {
  const x = parseMbti(a).letters, y = parseMbti(b).letters;
  let s = 0;
  s += x[1] === y[1] ? 0.25 : -0.15; // N/S: seeing the world the same way matters most
  s += x[3] !== y[3] ? 0.1 : x[3] === "J" ? 0.05 : -0.05; // J/P balance
  s += x[2] === "T" && y[2] === "T" ? -0.05 : 0.05;
  s += x[0] !== y[0] ? 0.05 : 0;
  const codes = [parseMbti(a).code, parseMbti(b).code];
  if (GOLDEN.some(([p, q]) => (codes[0] === p && codes[1] === q) || (codes[0] === q && codes[1] === p))) s += 0.2;
  return clamp1(s);
}

/** Overall hidden 궁합 (0..1). */
export function compatibility(a: CompatPerson, b: CompatPerson): Compatibility {
  const parts = { saju: 0, astrology: 0, mbti: 0 };
  const w = { saju: 0, astrology: 0, mbti: 0 };
  let chemistry = 0.5, stability = 0.5, friction = 0.5;
  if (a.birth && b.birth) {
    parts.saju = sajuCompatibility(calculateNatalChart(a.birth), calculateNatalChart(b.birth));
    const syn = synastry(calculateAstrologyChart(a.birth), calculateAstrologyChart(b.birth));
    ({ chemistry, stability, friction } = syn);
    // Centered so an average pair lands near 0 (calibrated on random pairs).
    parts.astrology = clamp1(Math.tanh(0.9 * (syn.chemistry + syn.stability - 1.2 * syn.friction - 0.55)));
    w.saju = 0.4;
    w.astrology = 0.4;
  }
  if (a.mbti && b.mbti) {
    parts.mbti = mbtiCompatibility(a.mbti, b.mbti);
    w.mbti = 0.2;
  }
  // A system with no data counts as neutral, so MBTI alone can't make a sure thing.
  const tw = Math.max(0.7, w.saju + w.astrology + w.mbti);
  const raw = (w.saju * parts.saju + w.astrology * parts.astrology + w.mbti * parts.mbti) / tw;
  return { score: 0.5 + 0.5 * Math.tanh(1.6 * raw), chemistry, stability, friction, parts };
}

/** How strongly 궁합 bends an outcome: +1 outcomes (e.g. START_DATING) grow with good 궁합, −1 ones shrink. */
export function compatFactor(score: number, sign: number): number {
  return Math.exp(1.2 * sign * (2 * score - 1));
}
