import { describe, expect, it } from "vitest";
import { createGame, dropOwnName, unquoteChoice } from "../src/game/game";
import { SeededRandom } from "../src/core/rng";
import * as fs from "fs";
import * as path from "path";

describe("Popup text: who's talking, and how choices read", () => {
  it("never shows the speaker's name twice", () => {
    expect(dropOwnName("민준: 나 이번에 인정받았어!", "민준")).toBe("나 이번에 인정받았어!");
    expect(dropOwnName("(민준: 주말 계획 아직이야?)", "민준")).toBe("주말 계획 아직이야?");
    expect(dropOwnName("(민준과 산책했다.)", "민준")).toBe("(민준과 산책했다.)");
  });

  it("choices are said, not quoted", () => {
    expect(unquoteChoice("'우리가 뭔데?'")).toBe("우리가 뭔데?");
    expect(unquoteChoice('"Time flies with you"')).toBe("Time flies with you");
    expect(unquoteChoice("(그래, 한 마디만 보낸다)")).toBe("(그래, 한 마디만 보낸다)");
    // No choice label in the scripts carries quotation marks.
    const bad: string[] = [];
    const walk = (o: unknown, inCh: boolean, key: string): void => {
      if (Array.isArray(o)) o.forEach((v) => walk(v, inCh, key));
      else if (o && typeof o === "object") for (const [k, v] of Object.entries(o)) walk(v, inCh || k === "choices" || k === "soloChoices", k === "ko" || k === "en" ? key : k);
      else if (typeof o === "string" && inCh && (key === "t" || key === "label") && /["“”‘’]|(^|\s)'|'($|\s)/.test(o.replace(/s' /g, "s "))) bad.push(o);
    };
    const files = (d: string): string[] => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? files(path.join(d, e.name)) : e.name.endsWith(".json") ? [path.join(d, e.name)] : []));
    for (const f of files("data")) walk(JSON.parse(fs.readFileSync(f, "utf8")), false, "");
    expect(bad).toEqual([]);
  });

  it("left to fate: you start single, and a move in the skipped years is told first thing", () => {
    let moved = 0;
    for (let seed = 1; seed <= 16; seed++) {
      const g = createGame({ name: "Mina", gender: "F", likes: "M", birth: { year: 1997, month: 9, day: 28 }, mbti: "ENFP", seed, home: "honolulu", birthplace: "newyork", nationality: "US", lang: "en", fated: { sealed: true } } as never);
      expect(g.state.relationship.status).toBe("SINGLE");
      if (g.state.location.city === "Honolulu") continue;
      moved++;
      const p = g.advance(g.s.minute + 30).find((b) => b.kind === "popup");
      expect(p && p.kind === "popup" && p.popup.line).toContain(`moved to ${g.state.location.city}`);
    }
    expect(moved).toBeGreaterThan(0);
  });

  it("a parent's funeral always ends with its line", () => {
    let funerals = 0, quoted = 0;
    for (let seed = 1; seed <= 4; seed++) {
      const g = createGame({ name: "민아", gender: "F", likes: "M", birth: { year: 1960, month: 9, day: 28 }, mbti: "ENFP", seed, fated: { name: "Ren", from: "same", status: "dating", since: { year: 2023, month: 1, day: 1 } } } as never);
      const rng = new SeededRandom(seed);
      for (let n = 0; n < 120 && !g.isOver(); n++) {
        for (let i = 0; i < 400; i++) {
          const beats = g.advance(g.s.minute + 30);
          for (const b of beats) if (b.kind === "popup") {
            const r = g.choose(rng.int(0, b.popup.ch.length - 1));
            if (b.popup.title === "빈자리") (funerals++, r?.quote && quoted++);
          }
          if (beats.some((b) => b.kind === "dayEnd")) break;
        }
        g.endDay();
      }
    }
    expect(funerals).toBeGreaterThan(0);
    expect(quoted).toBe(funerals);
  }, 120000);
});
