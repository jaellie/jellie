import { describe, expect, it } from "vitest";
import { isValidMbti, mbtiModifierSource, parseMbti, personaFromMbti, traitsFromPersona } from "../src/mbti/mbti";
import { createDestinyProfile } from "../src/destiny/profile";
import { simulateLife, createLifeState } from "../src/sim/simulateLife";
import { choiceUtility } from "../src/sim/decisionPolicy";
import { DEFAULT_TEMPLATES } from "../src/sim/opportunityEngine";
import { EXAMPLE_PLAYER, STRONG_YEOKMA } from "./fixtures";

describe("MBTI", () => {
  it("parses types with optional identity", () => {
    expect(parseMbti("enfp").code).toBe("ENFP");
    expect(parseMbti("INTJ-T").identity).toBe("T");
    expect(isValidMbti("XYZW")).toBe(false);
    expect(() => parseMbti("ENF")).toThrow();
  });

  it("persona follows the letters (prototype-compatible dimensions), with seeded jitter", () => {
    const e = personaFromMbti("ENFP", 1);
    const i = personaFromMbti("ISTJ", 1);
    expect(e.socialEnergy).toBeGreaterThan(i.socialEnergy);
    expect(e.noveltySeeking).toBeGreaterThan(i.noveltySeeking);
    expect(i.planning).toBeGreaterThan(e.planning);
    expect(personaFromMbti("ENFP", 1)).toEqual(e);
    expect(personaFromMbti("ENFP", 2)).not.toEqual(e);
    expect(traitsFromPersona(e).sociability).toBe(e.socialEnergy);
  });

  it("MBTI source: E → social, I → introspection, N/P → travel/change", () => {
    const e = mbtiModifierSource("ENFP").modifiers;
    const i = mbtiModifierSource("ISTJ").modifiers;
    expect(e.social!).toBeGreaterThan(i.social ?? 0);
    expect(i.introspection!).toBeGreaterThan(e.introspection ?? 0);
    expect(e.travel!).toBeGreaterThan(i.travel ?? 0);
    expect(i.stability!).toBeGreaterThan(e.stability ?? 0);
  });

  it("MBTI changes decisions, not just odds (persona dims feed choice appeal)", () => {
    const tmpl = DEFAULT_TEMPLATES.find((t) => t.id === "PROPOSAL")!;
    const marry = tmpl.choices.find((c) => c.id === "MARRY")!;
    const j = createLifeState(EXAMPLE_PLAYER, { mbti: "ESFJ" });
    const p = createLifeState(EXAMPLE_PLAYER, { mbti: "ENTP" });
    expect(choiceUtility(j, marry)).toBeGreaterThan(choiceUtility(p, marry));
  });

  it("different MBTI → measurably different lives (same birth, same seeds)", () => {
    const count = (mbti: string) => {
      let moves = 0, socialJoins = 0;
      for (let seed = 1; seed <= 25; seed++) {
        const r = simulateLife({ seed, birthData: STRONG_YEOKMA, duration: 45, profile: { mbti, money: 20, familySupport: 0.6 } });
        moves += r.timeline.filter((e) => e.changes?.some((c) => c.startsWith("moved "))).length;
        socialJoins += r.timeline.filter((e) => e.templateId === "NEW_SOCIAL_GROUP" && e.choiceId === "JOIN").length;
      }
      return { moves, socialJoins };
    };
    const enfp = count("ENFP");
    const istj = count("ISTJ");
    expect(enfp.moves).toBeGreaterThan(istj.moves);
    expect(enfp.socialJoins).toBeGreaterThan(istj.socialJoins);
  });
});

describe("DestinyProfile (hidden SAJU + ASTROLOGY + MBTI)", () => {
  it("computes everything from birth data and merges the sources", () => {
    const d = createDestinyProfile({ birth: EXAMPLE_PLAYER, mbti: "ENFP" });
    const sources = d.sourcesAt({ year: 2026, month: 6 });
    expect(sources.map((s) => s.source)).toEqual(["SAJU", "ASTROLOGY", "MBTI"]);
    expect(d.sourcesAt({ year: 2026, month: 6 })).toBe(sources); // cached per month
    const m = d.modifiersAt({ year: 2026, month: 6 });
    expect(Object.keys(m).length).toBeGreaterThan(10);
    expect(d.traits.persona).toBeDefined();
    const noMbti = createDestinyProfile({ birth: EXAMPLE_PLAYER });
    expect(noMbti.sourcesAt({ year: 2026, month: 6 }).map((s) => s.source)).toEqual(["SAJU", "ASTROLOGY"]);
    const noAstro = createDestinyProfile({ birth: EXAMPLE_PLAYER, weights: { ASTROLOGY: 0 } });
    expect(noAstro.modifiersAt({ year: 2026, month: 6 })).not.toEqual(noMbti.modifiersAt({ year: 2026, month: 6 }));
  });

  it("simulation opportunities are explained by all three systems", () => {
    const r = simulateLife({ seed: 3, birthData: EXAMPLE_PLAYER, duration: 40, profile: { mbti: "ENFP" } });
    const scored = r.timeline.find((e) => e.score)!;
    expect(scored.score!.factors.map((f) => f.name)).toEqual(expect.arrayContaining(["SAJU", "ASTROLOGY", "MBTI"]));
  });
});
