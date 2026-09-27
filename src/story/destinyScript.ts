/**
 * Destiny script: at birth, scan ages 25–75 for strong 사주 + 점성술 signals
 * and pick 5–7 fated turning points (with outcome weights = the chart's 70%).
 *
 * Signals used (all hidden from the player):
 *  사주: annual 역마/도화/화개/천을귀인 activation, clashes/harmonies/combinations
 *        with the day pillar (spouse palace), year pillar (roots/family) and
 *        hour pillar (children), 대운 transitions, favorable/unfavorable years.
 *  점성술: Jupiter/Saturn house ingresses (2/4/5/6/7/8/9/10), Saturn return,
 *        hard/soft transits of Saturn/Uranus/Jupiter to Sun/Moon/Venus/MC/ASC.
 */
import { SeededRandom } from "../core/rng";
import type { SajuChart } from "../saju/chart";
import { getAnnualFortune } from "../saju/chart";
import { type AstrologyChart, calculateTransits, jdForMonth } from "../astrology/chart";
import type { FatedEvent, FatedTheme } from "./types";

interface YearSignals {
  age: number;
  s: Record<string, number>;
  tags: string[];
}

function yearSignals(saju: SajuChart, astro: AstrologyChart, birthYear: number, age: number): YearSignals {
  const year = birthYear + age;
  const s: Record<string, number> = {};
  const tags: string[] = [];
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

  const tr = calculateTransits(astro, jdForMonth(year, 6), ["JUPITER", "SATURN", "URANUS"]);
  for (const h of tr.hits) {
    add(`${h.planet}@H${h.house}`, 1, `점성:${h.planet}@${h.house}H`);
    if (h.isReturn) add(`${h.planet}_RETURN`, 1, `점성:${h.planet} return`);
    for (const a of h.aspects) add(`${h.planet}>${a.natalPoint}:${a.nature}`, 1 - a.orb / 4, `점성:${h.planet} ${a.type} ${a.natalPoint}`);
  }
  return { age, s, tags };
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
  EARLY_RETIREMENT: {
    window: [52, 59],
    score: (y) => 1.5 * any(y, HARD("SATURN", ["SUN", "MC"])) + g(y, "daeunShift") + any(y, ["BRANCH_CLASH@month", "BRANCH_CLASH@day"]) + 0.2,
    weights: (y) => ({ ACCEPT: 0.6 + any(y, HARD("SATURN", ["SUN", "MC"])), STAY: 0.6 + Math.max(0, g(y, "favorable")) * 0.3, SECOND_CAREER: 0.4 + g(y, "YEOKMA") + any(y, HARD("URANUS", ["SUN", "MC"])) }),
  },
};

/** Themes every life script contains, then the strongest others up to 7. */
const CORE: FatedTheme[] = ["LOVE_MEETING", "CAREER_TURN", "MARRIAGE", "EARLY_RETIREMENT"];
const OPTIONAL: FatedTheme[] = ["MOVE", "FAMILY_LOSS", "CHILD", "RELATIONSHIP_CRISIS", "WEALTH", "PET"];
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
    for (let a = Math.max(start + 1, d.window[0]); a <= d.window[1]; a++) out.push({ age: a, score: d.score(years.get(a)!) + rng.range(0, 0.4) });
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
        chartWeights: normalize(THEMES[theme].weights(y)),
        signals: y.tags.slice(0, 8),
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
