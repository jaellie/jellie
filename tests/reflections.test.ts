import { describe, expect, it } from "vitest";
import { allReflections, pickReflection, reflectionCategory } from "../src/story/reflections";
import { createGame } from "../src/game/game";
import { SeededRandom } from "../src/core/rng";

describe("Drama lines after big moments", () => {
  it("every category has several lines, all natural (no tildes or em dashes)", () => {
    const by = new Map<string, number>();
    for (const { category, line } of allReflections()) {
      by.set(category, (by.get(category) ?? 0) + 1);
      expect(line.en).not.toMatch(/[~—]/);
      expect(line.ko).not.toMatch(/[~—]/);
    }
    for (const n of by.values()) expect(n).toBeGreaterThanOrEqual(4);
    expect(reflectionCategory(["MOM_FUNERAL"])).toBe("PARENT_DEATH");
    expect(reflectionCategory(["EVENT"], "money_up")).toBe("MONEY_UP");
  });

  it("never repeats a line within one life", () => {
    const g = createGame({ name: "민아", gender: "F", likes: "M", birth: { year: 1997, month: 9, day: 28 }, mbti: "ENFP", seed: 1 } as never);
    const rng = new SeededRandom(1);
    const seen = new Set<string>();
    for (let i = 0; i < 20; i++) {
      const l = pickReflection(g.state, "DAILY", rng);
      if (!l) break;
      expect(seen.has(l.ko)).toBe(false);
      seen.add(l.ko);
    }
    expect(seen.size).toBeGreaterThanOrEqual(4);
  });

  it("weddings, funerals and breakups usually come with a line", () => {
    let big = 0, quoted = 0;
    for (let seed = 1; seed <= 6; seed++) {
      const g = createGame({ name: "민아", gender: "F", likes: "M", birth: { year: 1990, month: 9, day: 28 }, mbti: "ENFP", seed, fated: { name: "Ren", from: "same", status: "dating", since: { year: 2023, month: 1, day: 1 } } } as never);
      const rng = new SeededRandom(seed);
      for (let n = 0; n < 50 && !g.isOver(); n++) {
        for (let i = 0; i < 400; i++) {
          const beats = g.advance(g.s.minute + 30);
          for (const b of beats) if (b.kind === "popup") {
            const r = g.choose(rng.int(0, b.popup.ch.length - 1));
            if (/결혼식|부고|장례|안녕|이별|법원/.test(b.popup.title ?? "")) { big++; if (r?.quote) quoted++; }
          }
          if (beats.some((b) => b.kind === "dayEnd")) break;
        }
        g.endDay();
      }
    }
    expect(big).toBeGreaterThan(0);
    expect(quoted / big).toBeGreaterThan(0.4);
  });
});
