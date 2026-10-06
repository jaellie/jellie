import { describe, expect, it } from "vitest";
import { SeededRandom } from "../src/core/rng";
import { mergeModifierSources } from "../src/core/lifeModifiers";
import { SajuModifierEngine } from "../src/saju/interpretation/sajuModifierEngine";
import { OpportunityEngine } from "../src/sim/opportunityEngine";
import { EventEngine } from "../src/sim/eventEngine";
import { AutoDecisionPolicy, RefuseEverythingPolicy } from "../src/sim/decisionPolicy";
import { createLifeState, simulateLife, formatTimeline } from "../src/sim/simulateLife";
import { traitsToModifierSource } from "../src/sim/personality";
import { explainOpportunity, formatSajuDebug } from "../src/debug/debugView";
import { buildDestinyViewModel, renderDestinyText } from "../src/ui/destiny/destinyViewModel";
import type { LifeState } from "../src/sim/types";
import { EXAMPLE_PLAYER, NO_YEOKMA, STRONG_YEOKMA } from "./fixtures";

function graduate(s: LifeState, age = 24): LifeState {
  s.monthIndex = age * 12;
  s.age = age;
  s.date = { year: s.birth.year + age, month: s.birth.month };
  s.education = "BACHELOR";
  return s;
}

describe("Saju → ModifierEngine → OpportunityEngine → EventEngine", () => {
  it("Saju modifiers raise the probability of affine opportunities", () => {
    const state = graduate(createLifeState(STRONG_YEOKMA));
    const saju = new SajuModifierEngine();
    const src = saju.toModifierSource(saju.calculateDetailed(state.chart, state.date));
    const engine = new OpportunityEngine();
    const p = (sources: Parameters<OpportunityEngine["evaluate"]>[1]) =>
      engine.evaluate(state, sources, new SeededRandom(1)).find((c) => c.template.id === "STUDY_ABROAD_GRAD")!.opportunity.score.probability;
    const withSaju = p([src]);
    const without = p([{ ...src, weight: 0 }]);
    expect(withSaju).toBeGreaterThan(without);
  });

  it("every opportunity carries an explainable score", () => {
    const state = graduate(createLifeState(EXAMPLE_PLAYER));
    const saju = new SajuModifierEngine();
    const sources = [saju.toModifierSource(saju.calculateDetailed(state.chart, state.date)), traitsToModifierSource(state.traits)];
    const c = new OpportunityEngine().evaluate(state, sources, new SeededRandom(3));
    expect(c.length).toBeGreaterThan(3);
    const opp = c.find((x) => x.template.id === "STUDY_ABROAD_GRAD")!.explain();
    expect(opp.score.factors.find((f) => f.name === "SAJU")!.details!.length).toBeGreaterThan(0);
    expect(opp.score.factors.map((f) => f.name)).toEqual(expect.arrayContaining(["SAJU", "PERSONALITY", "FINANCES", "RANDOM"]));
    const text = explainOpportunity(opp);
    expect(text).toContain("SAJU");
    expect(text).toContain("Final probability");
    expect(opp.modifiers.some((m) => m.source.startsWith("SAJU/"))).toBe(true);
  });

  it("EventEngine surfaces with weighted, seeded selection and respects the per-tick cap", () => {
    const state = graduate(createLifeState(EXAMPLE_PLAYER));
    const huge = { source: "TEST", modifiers: Object.fromEntries(["education", "career", "overseas", "travel", "social", "romance", "creativity"].map((k) => [k, 1.5])) };
    const cands = new OpportunityEngine().evaluate(state, [huge], new SeededRandom(9));
    const surfaced = new EventEngine(2).surface(cands, new SeededRandom(9));
    expect(surfaced.length).toBeLessThanOrEqual(2);
    const again = new EventEngine(2).surface(new OpportunityEngine().evaluate(state, [huge], new SeededRandom(9)), new SeededRandom(9));
    expect(again.map((o) => o.templateId)).toEqual(surfaced.map((o) => o.templateId));
  });

  it("finances block choices; world conditions redirect to alternatives", () => {
    const state = graduate(createLifeState(EXAMPLE_PLAYER, { money: 2, familySupport: 0.1 }));
    const engine = new OpportunityEngine();
    const opp = engine.evaluate(state, [], new SeededRandom(1)).find((c) => c.template.id === "STUDY_ABROAD_GRAD")!.opportunity;
    const ev = new EventEngine();
    const options = ev.options(state, opp);
    const byId = Object.fromEntries(options.map((o) => [o.choice.id, o]));
    expect(byId.APPLY.available).toBe(false);
    expect(byId.APPLY.blockedReason).toMatch(/needs 30k/);
    expect(byId.FAMILY_HELP.available).toBe(false);
    expect(byId.WAIT.available).toBe(true);
    // Even a policy that insists on APPLY cannot bypass the block.
    const insist = { choose: () => "APPLY" };
    const r = ev.resolve(state, opp, insist, mergeModifierSources([]), new SeededRandom(1));
    expect(r.choiceId).not.toBe("APPLY");
    expect(state.location.country).toBe("Korea");
  });
});

/** Relocated abroad (grad school / work), not just an exchange semester. */
const movedAbroad = (r: ReturnType<typeof simulateLife>) =>
  r.timeline.some((e) => e.changes?.some((c) => c.startsWith("moved ") && c.includes(" → ") && !c.startsWith("moved home")));

describe("Destiny is probabilistic, never forced", () => {
  const mobilityDestiny = () => ({ source: "SAJU", modifiers: { mobility: 1.5, overseas: 1.5, relocation: 1.5, travel: 1.5 } });

  it("a player who refuses everything never moves abroad, however strong the destiny", () => {
    for (const seed of [1, 2, 3]) {
      const r = simulateLife({ seed, birthData: STRONG_YEOKMA, duration: 60, extraSources: [mobilityDestiny], decisionMaker: new RefuseEverythingPolicy() });
      expect(movedAbroad(r)).toBe(false);
      expect(r.finalState.flags.livedAbroad).toBeUndefined();
      expect(r.timeline.some((e) => e.templateId === "TRAVEL")).toBe(true); // destiny kept offering
    }
  });

  it("a player who lives normally but declines every move abroad stays home — choice overrides destiny", () => {
    const auto = new AutoDecisionPolicy();
    const homebody = {
      choose: (...args: Parameters<AutoDecisionPolicy["choose"]>) => {
        const [s, o, options, rng] = args;
        const filtered = options.map((opt) => (opt.choice.consequences.some((c) => c.kind === "moveAbroad") ? { ...opt, available: false } : opt));
        return auto.choose(s, o, filtered, rng);
      },
    };
    let offeredAbroad = 0;
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      const r = simulateLife({
        seed,
        birthData: STRONG_YEOKMA,
        duration: 50,
        extraSources: [mobilityDestiny],
        decisionMaker: homebody,
        profile: { money: 40, familySupport: 0.9, traits: { ambition: 0.9 } },
      });
      expect(movedAbroad(r)).toBe(false);
      expect(r.finalState.location.country).toBe("Korea");
      offeredAbroad += r.timeline.filter((e) => e.templateId === "INTERNATIONAL_JOB" || e.templateId === "STUDY_ABROAD_GRAD").length;
    }
    expect(offeredAbroad).toBeGreaterThan(0);
  });

  it("stronger mobility destiny → more mobility opportunities on average (not guaranteed)", () => {
    const mobilityOffers = (extra: boolean) => {
      let n = 0;
      for (let seed = 1; seed <= 20; seed++) {
        const r = simulateLife({ seed, birthData: NO_YEOKMA, duration: 50, extraSources: extra ? [mobilityDestiny] : [] });
        n += r.timeline.filter((e) => ["TRAVEL", "BUSINESS_TRIP", "INTERNATIONAL_JOB", "DOMESTIC_RELOCATION", "EXCHANGE_SEMESTER", "STUDY_ABROAD_GRAD"].includes(e.templateId ?? "")).length;
      }
      return n;
    };
    expect(mobilityOffers(true)).toBeGreaterThan(mobilityOffers(false) * 1.3);
  });

  it("same destiny, different circumstances → different lives (Player A vs Player B)", () => {
    const run = (profile: Parameters<typeof simulateLife>[0]["profile"]) => {
      let abroad = 0, stillAbroad = 0;
      for (let seed = 1; seed <= 40; seed++) {
        const r = simulateLife({ seed, birthData: STRONG_YEOKMA, duration: 45, profile });
        if (movedAbroad(r)) abroad++;
        if (r.finalState.location.country !== "Korea") stillAbroad++;
      }
      return { abroad, stillAbroad };
    };
    const A = run({ money: 40, familySupport: 0.9, familyObligation: 0, traits: { novelty: 0.9, riskTolerance: 0.8, ambition: 0.8 } });
    const B = run({ money: 0, familySupport: 0, familyObligation: 0.9, traits: { novelty: 0.15, riskTolerance: 0.1, ambition: 0.5 } });
    const playerA = A.abroad, playerB = B.abroad;
    expect(playerA).toBeGreaterThan(playerB);
    expect(A.stillAbroad).toBeLessThan(40); // not guaranteed even for A: many come back or never settle abroad
    expect(playerB).toBeLessThan(playerA / 3);
  });
});

describe("Seeded simulation", () => {
  const opts = { birthData: EXAMPLE_PLAYER, duration: 80 };

  it("same seed reproduces the same life", () => {
    const a = simulateLife({ seed: 12345, ...opts });
    const b = simulateLife({ seed: 12345, ...opts });
    expect(formatTimeline(a)).toBe(formatTimeline(b));
    expect(a.finalState.money).toBe(b.finalState.money);
  });

  it("different seeds produce different lives", () => {
    const lives = new Set([1, 2, 3, 4].map((seed) => formatTimeline(simulateLife({ seed, ...opts }), { onlyOpportunities: true })));
    expect(lives.size).toBe(4);
  });

  it("produces a readable timeline", () => {
    const text = formatTimeline(simulateLife({ seed: 12345, ...opts }));
    expect(text).toMatch(/Age 1\d/);
    expect(text).toMatch(/→/);
  });
});

describe("Debug & UI view model (no calculation logic in UI)", () => {
  it("renders the destiny screen and debug view from engine output", () => {
    const state = createLifeState(EXAMPLE_PLAYER);
    const r = new SajuModifierEngine().calculateDetailed(state.chart, { year: 2026, month: 9 });
    const vm = buildDestinyViewModel(state.chart, r);
    expect(vm.pillars.map((p) => p.hanja)).toEqual(["丁丑", "己酉", "癸酉", "丁巳"]);
    expect(vm.elements).toHaveLength(5);
    expect(vm.shinsal.map((s) => s.hanja)).toContain("驛馬");
    expect(renderDestinyText(vm)).toContain("YOUR DESTINY");
    const dbg = formatSajuDebug(state.chart, r);
    for (const h of ["NATAL", "DAEUN", "ANNUAL", "MONTHLY", "FINAL SAJU MULTIPLIERS"]) expect(dbg).toContain(h);
  });

  it("AutoDecisionPolicy is seeded and only picks available choices", () => {
    const state = graduate(createLifeState(EXAMPLE_PLAYER, { money: 0, familySupport: 0 }));
    const opp = new OpportunityEngine().evaluate(state, [], new SeededRandom(2)).find((c) => c.template.id === "STUDY_ABROAD_GRAD")!.opportunity;
    const options = new EventEngine().options(state, opp);
    const id = new AutoDecisionPolicy().choose(state, opp, options, new SeededRandom(5));
    expect(options.find((o) => o.choice.id === id)!.available).toBe(true);
  });
});
