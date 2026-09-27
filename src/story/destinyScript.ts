/**
 * Destiny script: at birth, scan ages 25–75 for strong 사주 + 점성술 signals
 * and pick 5–7 fated turning points (with outcome weights = the chart's 70%).
 *
 * Signals used (all hidden from the player):
 *  사주: annual 역마/도화/화개/천을귀인 activation, clashes/harmonies/combinations
 *        with the day pillar (spouse palace), year pillar (roots/family) and
 *        hour pillar (children), 대운 transitions, favorable/unfavorable years.
 *  점성술 (each age = birthday → next birthday):
 *   - Transits: Jupiter/Saturn/Uranus house ingresses, returns, and aspects to
 *     Sun/Moon/Venus/Mars/MC/ASC, weighted by orb tier and applying/separating.
 *   - Secondary progressions (sampled quarterly): exact progressed→natal
 *     aspects, the progressed Moon's house, progressed Sun/Moon sign changes.
 *   - Solar Return: SR Sun/Moon houses, SR ASC in the natal chart, angular
 *     planets, SR contacts to natal lights/angles = the year's theme.
 *  The headline rule: when transits AND progressions point at the same life
 *  area (houses/points of a theme) in the same year, that year wins.
 */
import { SeededRandom } from "../core/rng";
import type { SajuChart } from "../saju/chart";
import { getAnnualFortune } from "../saju/chart";
import { annualPillar } from "../saju/analysis/fortune";
import { type AstrologyChart, type ChartPoint, calculateTransits } from "../astrology/chart";
import { calculateProgressions, calculateSolarReturn, orbWeight, phaseWeight } from "../astrology/techniques";
import type { FatedEvent, FatedTheme } from "./types";

type Nature = "harmonious" | "hard" | "conjunction";

interface YearSignals {
  age: number;
  s: Record<string, number>;
  tags: string[];
  /** Transit (T), progression (P) and Solar Return (SR) contacts: `a` (moving/return point) → natal point `b`. */
  contacts: Array<{ src: "T" | "P" | "SR"; a: string; b: string; nature: Nature; w: number }>;
  /** Houses lit up this year: progressed Moon, SR Sun, SR Moon, SR ASC (in the natal chart). */
  houses: Array<{ src: "P:MOON" | "SR:SUN" | "SR:MOON" | "SR:ASC"; house: number; w: number }>;
  /** Planets on a Solar Return angle. */
  angular: string[];
}

/** Conjunctions with Saturn/Pluto weigh like hard aspects. */
const effNature = (a: string, b: string, n: Nature): Nature => (n === "conjunction" && (a === "SATURN" || a === "PLUTO" || b === "SATURN" || b === "PLUTO") ? "hard" : n);

function yearSignals(saju: SajuChart, astro: AstrologyChart, birthYear: number, age: number): YearSignals {
  const year = birthYear + age;
  const s: Record<string, number> = {};
  const tags: string[] = [];
  const contacts: YearSignals["contacts"] = [];
  const houses: YearSignals["houses"] = [];
  const angular: string[] = [];
  const add = (k: string, v = 1, tag?: string) => {
    s[k] = (s[k] ?? 0) + v;
    if (tag) tags.push(tag);
  };
  const f = getAnnualFortune(saju, year);
  for (const sh of f.activatedShinsal) add(sh.id, 1, `사주:${sh.id}`);
  for (const it of f.elementInteraction) {
    const on = it.between.find((b) => b !== "annual");
    if (!on) continue;
    add(`${it.type}@${on}`, 1, `사주:${it.type}@${on}`);
  }
  const fav = f.tenGodInteractions.reduce((a, t) => a + t.favorability, 0);
  add("favorable", fav);
  for (const t of f.tenGodInteractions) add(`group:${t.tenGod}`, 1);
  const daeunStart = saju.daeun.periods.some((p) => Math.abs(p.startAge - age) < 1);
  if (daeunStart) add("daeunShift", 1, "사주:대운전환");

  // This age runs from the Solar Return (birthday) to the next one.
  const sr = calculateSolarReturn(astro, year);
  const tr = calculateTransits(astro, sr.jdUT + 182.6, ["JUPITER", "SATURN", "URANUS"]);
  for (const h of tr.hits) {
    add(`${h.planet}@H${h.house}`, 1, `점성:${h.planet}@${h.house}H`);
    if (h.isReturn) add(`${h.planet}_RETURN`, 1, `점성:${h.planet} return`);
    for (const a of h.aspects) {
      const w = orbWeight(a.orb) * phaseWeight(a.applying);
      add(`${h.planet}>${a.natalPoint}:${a.nature}`, w, `점성:${h.planet} ${a.type} ${a.natalPoint}`);
      contacts.push({ src: "T", a: h.planet, b: a.natalPoint, nature: effNature(h.planet, a.natalPoint, a.nature), w });
    }
  }
  // Secondary progressions, sampled quarterly (the progressed Moon moves ~1° a month).
  const best = new Map<string, (typeof contacts)[number]>();
  for (let q = 0; q < 4; q++) {
    const pr = calculateProgressions(astro, sr.jdUT + 45 + q * 91.3);
    for (const a of pr.aspects) {
      const nature = effNature(a.progressed, a.natalPoint, a.nature);
      const c = { src: "P" as const, a: a.progressed, b: a.natalPoint, nature, w: orbWeight(a.orb) * phaseWeight(a.applying) };
      const k = `${c.a}>${c.b}`;
      if (!best.has(k) || best.get(k)!.w < c.w) best.set(k, c);
    }
    if (q === 1 && pr.positions.MOON) houses.push({ src: "P:MOON", house: pr.positions.MOON.natalHouse, w: 0.5 });
    for (const i of pr.ingresses) if (q === 3) add(`P:${i.point}_INGRESS`, 1, `점성:진행${i.point}→${i.sign}`);
  }
  for (const c of best.values()) {
    contacts.push(c);
    tags.push(`점성:진행 ${c.a}>${c.b}:${c.nature}`);
  }
  // Solar Return: the year's theme.
  if (sr.anglesReliable) {
    if (sr.houses.SUN) houses.push({ src: "SR:SUN", house: sr.houses.SUN, w: 1 });
    if (sr.houses.MOON) houses.push({ src: "SR:MOON", house: sr.houses.MOON, w: 0.7 });
    if (sr.ascInNatalHouse) houses.push({ src: "SR:ASC", house: sr.ascInNatalHouse, w: 1 });
    angular.push(...sr.angular);
    if (sr.angular.length) tags.push(`점성:SR angular ${sr.angular.join("/")}`);
  }
  for (const c of sr.contacts) contacts.push({ src: "SR", a: c.planet, b: c.natalPoint, nature: effNature(c.planet, c.natalPoint, c.nature), w: 0.8 * orbWeight(c.orb) });
  return { age, s, tags, contacts, houses, angular };
}

/**
 * Each theme's astrological signature: the houses it lives in, and which contacts count —
 * one side from `a`, the other from `b` ("any" = anything), of the given nature.
 * E.g. illness = hard contacts between the lights/ASC and Saturn/Mars/Neptune/Pluto.
 */
interface Domain {
  houses: number[];
  a: string[];
  b: string[] | "any";
  nature: "hard" | "soft" | "any";
  good?: string;
  bad?: string;
}
const MALEFICS = ["SATURN", "MARS", "NEPTUNE", "PLUTO"];
const DOMAIN: Record<FatedTheme, Domain> = {
  LOVE_MEETING: { houses: [5, 7], a: ["VENUS", "MARS"], b: "any", nature: "soft", good: "START_DATING", bad: "MISSED" },
  MARRIAGE: { houses: [7], a: ["VENUS"], b: ["SUN", "MOON", "JUPITER", "SATURN", "ASC", "MC"], nature: "any", good: "ENGAGED", bad: "BREAKUP" },
  RELATIONSHIP_CRISIS: { houses: [7, 8], a: ["VENUS", "MOON"], b: ["SATURN", "MARS", "URANUS", "PLUTO"], nature: "hard", good: "RECONCILE", bad: "SEPARATE" },
  CAREER_TURN: { houses: [10, 6], a: ["SUN", "MC"], b: ["SATURN", "JUPITER", "URANUS", "MARS"], nature: "any", good: "PROMOTION", bad: "LAYOFF" },
  MOVE: { houses: [4, 9], a: ["ASC", "MOON"], b: ["URANUS", "JUPITER", "MARS"], nature: "any" },
  FAMILY_LOSS: { houses: [4, 8], a: ["MOON"], b: ["SATURN", "PLUTO"], nature: "hard", good: "RECOVERY", bad: "PASSING" },
  WEALTH: { houses: [2, 8], a: ["VENUS", "JUPITER"], b: ["SUN", "MOON", "VENUS", "JUPITER", "URANUS", "MC"], nature: "any", good: "WINDFALL", bad: "LOSS" },
  CHILD: { houses: [5], a: ["MOON", "JUPITER", "VENUS"], b: ["MOON", "JUPITER", "VENUS", "SUN"], nature: "soft", good: "PREGNANT", bad: "NOT_NOW" },
  PET: { houses: [6], a: ["MOON", "VENUS"], b: ["MOON", "VENUS", "JUPITER"], nature: "soft" },
  ILLNESS: { houses: [6, 12], a: ["SUN", "MOON", "ASC"], b: MALEFICS, nature: "hard", good: "RECOVERY", bad: "PASSING" },
  EARLY_RETIREMENT: { houses: [10, 12], a: ["SUN", "MC"], b: ["SATURN", "URANUS"], nature: "any" },
};

function matches(d: Domain, x: string, y: string, nature: Nature): boolean {
  if (d.nature === "hard" && nature !== "hard") return false;
  if (d.nature === "soft" && nature === "hard") return false;
  const side = (p: string, q: string) => d.a.includes(p) && (d.b === "any" || d.b.includes(q));
  return side(x, y) || side(y, x);
}

/** How strongly transits (T), progressions (P) and the Solar Return (SR) point at a theme's life area this year. */
function techniqueScores(theme: FatedTheme, y: YearSignals): { T: number; P: number; SR: number; soft: number; hard: number } {
  const d = DOMAIN[theme];
  let T = 0, P = 0, SR = 0, soft = 0, hard = 0;
  for (const c of y.contacts) {
    if (!matches(d, c.a, c.b, c.nature)) continue;
    if (c.src === "T") T += c.w;
    else if (c.src === "P") P += c.w;
    else SR += c.w;
    if (c.src !== "T") c.nature === "hard" ? (hard += c.w) : (soft += c.w);
  }
  // Slow planets moving through the theme's houses (only planets that belong to its signature).
  for (const planet of ["JUPITER", "SATURN", "URANUS"]) {
    if (d.b !== "any" && !d.b.includes(planet)) continue;
    for (const h of d.houses) T += (planet === "URANUS" ? 0.7 : 1) * g(y, `${planet}@H${h}`);
  }
  for (const h of y.houses) if (d.houses.includes(h.house)) (h.src === "P:MOON" ? (P += h.w) : (SR += h.w));
  for (const p of y.angular) if (d.a.includes(p) || (d.b !== "any" && d.b.includes(p))) SR += 0.8;
  return { T, P: Math.min(P, 2), SR: Math.min(SR, 2), soft, hard };
}

/** Technique scores for one theme at one age (debug/tests). */
export function techniqueScoresAt(saju: SajuChart, astro: AstrologyChart, birthYear: number, age: number, theme: FatedTheme) {
  return techniqueScores(theme, yearSignals(saju, astro, birthYear, age));
}

/** Transits + progressions agreeing is the headline; the Solar Return sets the year's theme. */
function techniqueBonus(theme: FatedTheme, y: YearSignals): number {
  const t = techniqueScores(theme, y);
  return 0.4 * t.P + 0.4 * t.SR + 1.0 * Math.min(t.T, t.P);
}

/** Soft progressions/SR contacts favour the theme's good outcome, hard ones its bad outcome. */
function techniqueWeights(theme: FatedTheme, y: YearSignals, w: Record<string, number>): Record<string, number> {
  const d = DOMAIN[theme];
  const t = techniqueScores(theme, y);
  const out = { ...w };
  if (d.good && out[d.good] !== undefined) out[d.good] += 0.4 * t.soft;
  if (d.bad && out[d.bad] !== undefined) out[d.bad] += 0.4 * t.hard;
  return out;
}

/** 삼재: three unlucky years by birth-year branch group (들삼재 1, 눌삼재 1.3, 날삼재 1). */
const SAMJAE: Array<[string[], string[]]> = [
  [["SHEN", "ZI", "CHEN"], ["YIN", "MAO", "CHEN"]],
  [["SI", "YOU", "CHOU"], ["HAI", "ZI", "CHOU"]],
  [["YIN", "WU", "XU"], ["SHEN", "YOU", "XU"]],
  [["HAI", "MAO", "WEI"], ["SI", "WU", "WEI"]],
];
export function samjae(birthBranch: string, yearBranch: string): number {
  const g = SAMJAE.find(([born]) => born.includes(birthBranch));
  const i = g ? g[1].indexOf(yearBranch) : -1;
  return i < 0 ? 0 : i === 1 ? 1.3 : 1;
}

/**
 * Every signal of one age-year as a flat map, for life-event triggers: 신살 (DOHWA, YEOKMA…),
 * 합충 with the pillars (BRANCH_CLASH@day…), ten-god groups (group:PYEON_JAE…), 대운 shifts,
 * favorable/unfavorable, transits (SATURN>SUN:hard, JUPITER@H5…), progressions (P:…),
 * the Solar Return (SR:…) and 삼재 (SAMJAE).
 */
export function yearSignalMap(saju: SajuChart, astro: AstrologyChart, birthYear: number, age: number): Record<string, number> {
  const y = yearSignals(saju, astro, birthYear, age);
  const out: Record<string, number> = { ...y.s };
  const put = (k: string, v: number) => (out[k] = Math.max(out[k] ?? 0, v));
  for (const c of y.contacts) put(`${c.src}:${c.a}>${c.b}:${c.nature}`, c.w);
  for (const h of y.houses) put(`${h.src}@H${h.house}`, h.w);
  for (const p of y.angular) put(`SR:angular:${p}`, 1);
  const fav = out.favorable ?? 0;
  out.favorable = Math.max(0, fav);
  out.unfavorable = Math.max(0, -fav);
  const sj = samjae(saju.fourPillars.year.earthlyBranch, annualPillar(birthYear + age).earthlyBranch);
  if (sj) out.SAMJAE = sj;
  return out;
}

const g = (y: YearSignals, k: string) => y.s[k] ?? 0;
const any = (y: YearSignals, keys: string[]) => keys.reduce((a, k) => a + g(y, k), 0);

interface ThemeDef {
  window: [number, number];
  score: (y: YearSignals) => number;
  weights: (y: YearSignals) => Record<string, number>;
}

const HARD = (p: string, pts: string[]) => pts.flatMap((x) => [`${p}>${x}:hard`, `${p}>${x}:conjunction`]);
const SOFT = (p: string, pts: string[]) => pts.flatMap((x) => [`${p}>${x}:harmonious`, `${p}>${x}:conjunction`]);

export const THEMES: Record<FatedTheme, ThemeDef> = {
  LOVE_MEETING: {
    window: [25, 36],
    score: (y) => 2 * g(y, "DOHWA") + 1.5 * any(y, ["JUPITER@H5", "JUPITER@H7"]) + 1.5 * any(y, SOFT("JUPITER", ["VENUS"])) + any(y, ["SIX_HARMONY@day", "STEM_COMBINATION@day"]),
    weights: (y) => ({ START_DATING: 1 + g(y, "DOHWA") + any(y, SOFT("JUPITER", ["VENUS"])), SLOW_BURN: 0.6 + any(y, HARD("SATURN", ["VENUS"])), MISSED: 0.3 + any(y, ["BRANCH_CLASH@day"]) }),
  },
  MARRIAGE: {
    window: [27, 42],
    score: (y) => 2 * g(y, "STEM_COMBINATION@day") + 1.5 * g(y, "SIX_HARMONY@day") + 1.5 * any(y, ["SATURN@H7", "JUPITER@H7"]) + any(y, SOFT("JUPITER", ["VENUS"])) + 0.5 * g(y, "CHEONEUL_GWIIN"),
    weights: (y) => ({ ENGAGED: 1.2 + any(y, ["STEM_COMBINATION@day", "SIX_HARMONY@day", "JUPITER@H7"]), NOT_YET: 0.5 + g(y, "SATURN@H7") * 0.5, BREAKUP: 0.2 + g(y, "BRANCH_CLASH@day") + any(y, HARD("URANUS", ["VENUS"])) }),
  },
  RELATIONSHIP_CRISIS: {
    window: [28, 58],
    score: (y) => 2 * g(y, "BRANCH_CLASH@day") + 1.5 * any(y, HARD("URANUS", ["VENUS", "MOON"])) + 1.5 * any(y, HARD("SATURN", ["VENUS"])) + 0.5 * g(y, "HARM@day"),
    weights: (y) => ({ RECONCILE: 0.8 + any(y, SOFT("JUPITER", ["VENUS", "MOON"])) + Math.max(0, g(y, "favorable")) * 0.3, SEPARATE: 0.4 + g(y, "BRANCH_CLASH@day") + any(y, HARD("URANUS", ["VENUS"])), DISTANCE: 0.5 + g(y, "YEOKMA") }),
  },
  CAREER_TURN: {
    window: [30, 55],
    score: (y) => 2 * any(y, HARD("SATURN", ["SUN", "MC"])) + 2 * any(y, ["JUPITER@H10", ...SOFT("JUPITER", ["MC", "SUN"])]) + 1.5 * g(y, "daeunShift") + 1.5 * any(y, HARD("URANUS", ["SUN", "MC"])) + g(y, "BRANCH_CLASH@month"),
    weights: (y) => ({
      PROMOTION: 0.6 + 1.5 * any(y, ["JUPITER@H10", ...SOFT("JUPITER", ["MC", "SUN"])]) + 0.3 * Math.max(0, g(y, "favorable")) + 0.5 * any(y, ["group:JEONG_GWAN", "group:PYEON_IN", "group:JEONG_IN"]),
      LAYOFF: 0.3 + 1.5 * any(y, HARD("SATURN", ["SUN", "MC"])) + 0.5 * any(y, ["BRANCH_CLASH@month", "BRANCH_CLASH@day"]) + 0.3 * Math.max(0, -g(y, "favorable")),
      INDEPENDENCE: 0.3 + 1.2 * any(y, HARD("URANUS", ["SUN", "MC"])) + g(y, "YEOKMA") + 0.5 * any(y, ["group:SIK_SHIN", "group:SANG_GWAN", "group:PYEON_JAE"]),
    }),
  },
  MOVE: {
    window: [26, 60],
    score: (y) => 2.5 * g(y, "YEOKMA") + 1.5 * g(y, "JUPITER@H9") + 1.5 * any(y, HARD("URANUS", ["ASC", "MOON"])) + g(y, "JUPITER@H4"),
    weights: (y) => ({ ABROAD: 0.4 + 1.5 * g(y, "JUPITER@H9") + g(y, "YEOKMA") * 0.8, NEW_CITY: 0.6 + g(y, "JUPITER@H4") + any(y, HARD("URANUS", ["ASC", "MOON"])), STAY: 0.4 }),
  },
  FAMILY_LOSS: {
    window: [42, 72],
    score: (y) => 2 * any(y, HARD("SATURN", ["MOON"])) + 1.5 * any(y, HARD("URANUS", ["MOON"])) + 1.5 * g(y, "BRANCH_CLASH@year") + 0.5 * g(y, "HWAGAE") + 0.04 * (y.age - 40),
    weights: (y) => ({ PASSING: 0.6 + any(y, HARD("SATURN", ["MOON"])) + 0.02 * (y.age - 40), RECOVERY: 0.6 + any(y, SOFT("JUPITER", ["MOON"])) + Math.max(0, g(y, "favorable")) * 0.3 }),
  },
  WEALTH: {
    window: [30, 65],
    score: (y) => 2 * any(y, ["JUPITER@H2", "JUPITER@H8"]) + any(y, ["URANUS@H2", "URANUS@H8"]) + 0.5 * any(y, ["group:JEONG_JAE", "group:PYEON_JAE"]),
    weights: (y) => ({ WINDFALL: 0.5 + 1.5 * any(y, ["JUPITER@H2", "JUPITER@H8"]) + 0.3 * Math.max(0, g(y, "favorable")), LOSS: 0.3 + any(y, ["URANUS@H2", "URANUS@H8"]) + 0.5 * any(y, ["group:GYEOB_JAE"]), STEADY: 0.5 }),
  },
  CHILD: {
    window: [28, 42],
    score: (y) => 2 * g(y, "JUPITER@H5") + 1.5 * any(y, ["SIX_HARMONY@hour", "STEM_COMBINATION@hour", "HALF_HARMONY@hour"]) + 0.5 * g(y, "CHEONEUL_GWIIN"),
    weights: (y) => ({ PREGNANT: 1 + g(y, "JUPITER@H5") + any(y, ["SIX_HARMONY@hour", "STEM_COMBINATION@hour"]), NOT_NOW: 0.5 + any(y, ["BRANCH_CLASH@hour"]) }),
  },
  PET: {
    window: [26, 55],
    score: (y) => 1.5 * g(y, "JUPITER@H6") + g(y, "HWAGAE") + 0.5 * g(y, "JUPITER@H4"),
    weights: () => ({ ADOPT_DOG: 1, ADOPT_CAT: 1, NO_PET: 0.3 }),
  },
  ILLNESS: {
    window: [40, 75],
    score: (y) => 1.5 * any(y, HARD("SATURN", ["SUN", "MOON"])) + any(y, ["SATURN@H6", "SATURN@H12"]) + g(y, "BRANCH_CLASH@year") + 0.5 * g(y, "HWAGAE") + 0.02 * (y.age - 40),
    weights: (y) => ({ RECOVERY: 0.8 + any(y, SOFT("JUPITER", ["SUN", "MOON"])) + Math.max(0, g(y, "favorable")) * 0.3, LONG_FIGHT: 0.5, PASSING: 0.2 + 0.5 * any(y, HARD("SATURN", ["MOON"])) + 0.01 * (y.age - 40) }),
  },
  EARLY_RETIREMENT: {
    window: [52, 59],
    score: (y) => 1.5 * any(y, HARD("SATURN", ["SUN", "MC"])) + g(y, "daeunShift") + any(y, ["BRANCH_CLASH@month", "BRANCH_CLASH@day"]) + 0.2,
    weights: (y) => ({ ACCEPT: 0.6 + any(y, HARD("SATURN", ["SUN", "MC"])), STAY: 0.6 + Math.max(0, g(y, "favorable")) * 0.3, SECOND_CAREER: 0.4 + g(y, "YEOKMA") + any(y, HARD("URANUS", ["SUN", "MC"])) }),
  },
};

/** Themes every life script contains, then the strongest others up to 7. */
const CORE: FatedTheme[] = ["LOVE_MEETING", "CAREER_TURN", "MARRIAGE", "EARLY_RETIREMENT"];
const OPTIONAL: FatedTheme[] = ["MOVE", "FAMILY_LOSS", "CHILD", "RELATIONSHIP_CRISIS", "ILLNESS", "WEALTH", "PET"];
const MIN_GAP_YEARS = 2;

function normalize(w: Record<string, number>): Record<string, number> {
  const t = Object.values(w).reduce((a, b) => a + Math.max(0.05, b), 0);
  return Object.fromEntries(Object.entries(w).map(([k, v]) => [k, Math.max(0.05, v) / t]));
}

export function buildDestinyScript(saju: SajuChart, astro: AstrologyChart, opts: { birthYear: number; seed: number; startAge?: number; min?: number; max?: number }): FatedEvent[] {
  const rng = new SeededRandom(opts.seed);
  const start = opts.startAge ?? 25;
  const years = new Map<number, YearSignals>();
  for (let age = start; age <= 75; age++) years.set(age, yearSignals(saju, astro, opts.birthYear, age));

  const ranked = (theme: FatedTheme) => {
    const d = THEMES[theme];
    const out: Array<{ age: number; score: number }> = [];
    // The technique bonus counts relative to this theme's own baseline for this person: a year stands
    // out only when it is unusually strong for the theme (broad themes don't win just by being broad).
    const ages: number[] = [];
    for (let a = Math.max(start + 1, d.window[0]); a <= d.window[1]; a++) ages.push(a);
    const bonus = ages.map((a) => techniqueBonus(theme, years.get(a)!));
    const mean = bonus.reduce((x, y) => x + y, 0) / Math.max(1, bonus.length);
    ages.forEach((a, i) => out.push({ age: a, score: d.score(years.get(a)!) + (bonus[i] - mean) + rng.range(0, 0.4) }));
    return out.sort((x, y) => y.score - x.score);
  };
  const chosen: FatedEvent[] = [];
  const free = (age: number) => chosen.every((e) => Math.abs(e.age - age) >= MIN_GAP_YEARS);
  const place = (theme: FatedTheme, constraint?: (age: number) => boolean) => {
    for (const cand of ranked(theme)) {
      if (!free(cand.age) || (constraint && !constraint(cand.age))) continue;
      const y = years.get(cand.age)!;
      chosen.push({
        id: `${theme}@${cand.age}`,
        theme,
        age: cand.age,
        monthIndex: cand.age * 12 + rng.int(1, 10),
        chartWeights: normalize(techniqueWeights(theme, y, THEMES[theme].weights(y))),
        signals: y.tags.slice(0, 12),
      });
      return cand.score;
    }
    return -1;
  };
  const love = (() => {
    place("LOVE_MEETING");
    return chosen.find((e) => e.theme === "LOVE_MEETING")?.age ?? 28;
  })();
  place("CAREER_TURN");
  place("MARRIAGE", (a) => a >= love + 2);
  place("EARLY_RETIREMENT");
  // Strongest optional themes next (score threshold keeps weak years out).
  const opt = OPTIONAL.map((t) => ({ t, best: ranked(t)[0]?.score ?? 0 })).sort((a, b) => b.best - a.best);
  const max = opts.max ?? 7;
  const min = opts.min ?? 5;
  for (const { t, best } of opt) {
    if (chosen.length >= max) break;
    if (chosen.length >= min && best < 1.5) continue;
    if (t === "CHILD" && !chosen.some((e) => e.theme === "MARRIAGE")) continue;
    place(t, t === "CHILD" ? (a) => a >= (chosen.find((e) => e.theme === "MARRIAGE")?.age ?? 30) + 1 : t === "RELATIONSHIP_CRISIS" ? (a) => a >= love + 1 : undefined);
  }
  return chosen.sort((a, b) => a.monthIndex - b.monthIndex);
}

/**
 * The 70/30 rule: outcome = 70% chart + 30% player's strategy.
 * `choiceWeights` come from the option the player picked.
 */
export function resolveOutcome(chart: Record<string, number>, choice: Record<string, number>, rng: SeededRandom, chartShare = 0.7): string {
  const keys = Object.keys(chart);
  const ct = keys.reduce((a, k) => a + (choice[k] ?? 0), 0) || 1;
  return rng.weighted(keys.map((k) => ({ item: k, weight: chartShare * chart[k] + (1 - chartShare) * ((choice[k] ?? 0) / ct) })));
}
