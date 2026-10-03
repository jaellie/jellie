import { describe, expect, it } from "vitest";
import data from "../data/story/meetRoutines.json";
import locs from "../data/world/locations.json";
import { createGame } from "../src/game/game";
import { meetPlan } from "../src/story/fatedProfile";

describe("First meetings follow the chart", () => {
  it("every meeting scene is in a real local place and has both languages, no tildes or em dashes", () => {
    const ids = new Set(((locs as unknown as { locations?: Array<{ id: string }> }).locations ?? (locs as unknown as Array<{ id: string }>)).map((l) => l.id));
    for (const r of data.routines) {
      expect(ids.has(r.location)).toBe(true);
      expect(r.line.ko.length).toBeGreaterThan(5);
      expect(r.line.en).not.toMatch(/[~—]/);
    }
  });

  it("a 도화 year meets at a party, festival or café", () => {
    for (let seed = 1; seed <= 40; seed++) {
      const g = createGame({ name: "민아", gender: "F", likes: "M", birth: { year: 1995, month: 3, day: 3 }, mbti: "ENFP", fated: { name: "Ren", from: "same", status: "stranger" }, seed } as never);
      const ev = g.state.story!.script.find((e) => e.theme === "LOVE_MEETING")!;
      ev.signals = ["사주:DOHWA"];
      const fated = Object.values(g.state.world!.npcs).find((n) => n.fated)!;
      if (fated.spriteSeed % 4 === 3) continue; // that 1 in 4 follows their job
      const p = meetPlan(g.state, false);
      expect(data.routines.filter((r) => r.signals.includes("DOHWA")).map((r) => r.line.ko)).toContain(p.line.ko);
      return;
    }
  });
});
