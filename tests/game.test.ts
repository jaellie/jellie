import { describe, expect, it } from "vitest";
import { createGame, loadGame, type Beat, type Game } from "../src/game/game";
import { lintContent } from "../src/game/lint";
import { Director, guardRequirements, newDirectorMemory } from "../src/game/director";
import { computeFacts, meets } from "../src/game/facts";
import { fixJosa } from "../src/game/text";
import { SeededRandom } from "../src/core/rng";
import messageData from "../data/game/messages.json";

const SETUP = { name: "민아", gender: "F" as const, likes: "M" as const, birth: { year: 1997, month: 9, day: 28, hour: 9, minute: 30 }, mbti: "ENFP", fated: { name: "Ren", from: "same" as const } };

type Shown = { day: number; kind: string; id: string; texts: string[]; ok: boolean };

/** Auto-play a whole life, choosing option 0 (or a seeded pick), checking every shown item against the facts at that moment. */
function playLife(seed: number, maxDays = 80) {
  const g = createGame({ ...SETUP, seed });
  const shown: Shown[] = [];
  const perDay: Array<{ small: number; msg: number; major: number }> = [];
  const menus: string[][] = [];
  const rng = new SeededRandom(seed);
  let days = 0;
  while (!g.isOver() && days < maxDays) {
    const counts = { small: 0, msg: 0, major: 0 };
    for (let guard = 0; guard < 400; guard++) {
      const beats: Beat[] = g.advance(g.s.minute + 30);
      for (const b of beats) {
        const facts = g.facts();
        if (b.kind === "toast") {
          counts.msg++;
          shown.push({ day: g.s.dayIndex, kind: "message", id: b.from, texts: [b.text], ok: guardRequirements([b.text]).every((r) => meets(r.requires, facts)) });
        }
        if (b.kind === "popup") {
          const p = b.popup;
          if (p.source === "story") counts.small++;
          if (p.source === "opportunity" || p.source === "world") counts.major++;
          if (p.source === "plan") menus.push(p.ch.map((c) => c.t));
          const texts = [p.line, ...p.ch.map((c) => c.t)];
          const ok = p.source === "story" ? guardRequirements(texts).every((r) => meets(r.requires, facts)) : true;
          shown.push({ day: g.s.dayIndex, kind: p.source, id: p.id, texts, ok });
          g.choose(rng.int(0, p.ch.length - 1));
        }
      }
      if (beats.some((b) => b.kind === "dayEnd")) break;
    }
    perDay.push(counts);
    g.endDay();
    days++;
  }
  return { g, shown, perDay, menus, days };
}

describe("Content quality (automatic)", () => {
  it("no message or story text contradicts its own requirements", () => {
    expect(lintContent()).toEqual([]);
  });

  it("Korean particles follow the name", () => {
    expect(fixJosa("도윤와(과) 결혼했다")).toBe("도윤과 결혼했다");
    expect(fixJosa("지우와(과) 결혼했다")).toBe("지우와 결혼했다");
    expect(fixJosa("민재이(가) 인사했다")).toBe("민재가 인사했다");
    expect(fixJosa("서울(으)로 이사했다")).toBe("서울로 이사했다");
    expect(fixJosa("부산(으)로 이사했다")).toBe("부산으로 이사했다");
  });
});

describe("Director: consistency", () => {
  it("a promotion message can't appear after a layoff (the 'Mom congratulates me' bug)", () => {
    const g = createGame({ ...SETUP, seed: 3 });
    const st = g.state;
    st.career = { ...st.career, employed: true, cid: 5, level: 3 };
    st.flags.promotionCid = 5;
    st.flags.promotionMonth = st.monthIndex;
    const promoMsg = (messageData.messages as Array<{ id: string; text: { ko: string }; requires: string[] }>).find((m) => m.text.ko.includes("승진했다며"))!;
    const d = new Director(newDirectorMemory());
    d.startDay(0, new SeededRandom(1));
    d.mem.budget.messages = 5;
    expect(d.check("message", { id: promoMsg.id, texts: [promoMsg.text.ko], requires: promoMsg.requires }, computeFacts(st))).toBeUndefined();
    // Laid off: cid changes → the promotion no longer applies.
    st.career = { ...st.career, employed: false, cid: 6 };
    st.flags.jobLostMonth = st.monthIndex;
    expect(d.check("message", { id: promoMsg.id, texts: [promoMsg.text.ko], requires: promoMsg.requires }, computeFacts(st))).toBe("requires");
    // Even if an author forgot `requires`, the keyword guard still blocks it.
    expect(d.check("message", { id: "careless", texts: ["[팀장] 다음 달부터 팀을 맡아줘야겠어"], requires: [] }, computeFacts(st))).toMatch(/^guard:/);
  });

  it("every message and small event shown in whole lives matches the player's facts at that moment", () => {
    for (const seed of [1, 2, 3, 4]) {
      const { shown } = playLife(seed);
      const bad = shown.filter((x) => !x.ok);
      expect(bad).toEqual([]);
    }
  });
});

describe("Director: pacing & variety", () => {
  const runs = [11, 12, 13].map((s) => playLife(s));

  it("small events 0–3 per day, messages ≤2, majors ≤2", () => {
    for (const r of runs) {
      for (const d of r.perDay) {
        expect(d.small).toBeLessThanOrEqual(3);
        expect(d.msg).toBeLessThanOrEqual(2);
        expect(d.major).toBeLessThanOrEqual(2);
      }
      const avgSmall = r.perDay.reduce((a, d) => a + d.small, 0) / r.perDay.length;
      expect(avgSmall).toBeLessThan(2.2);
    }
  });

  it("the same line never repeats within 4 days", () => {
    for (const r of runs) {
      const last = new Map<string, number>();
      for (const x of r.shown.filter((s) => s.kind === "message" || s.kind === "story")) {
        const key = x.texts[0];
        const prev = last.get(key);
        if (prev !== undefined) expect(x.day - prev).toBeGreaterThanOrEqual(4);
        last.set(key, x.day);
      }
    }
  });

  it("weekend menus vary and include more than the old three options", () => {
    const menus = runs.flatMap((r) => r.menus);
    expect(menus.length).toBeGreaterThan(3);
    const distinct = new Set(menus.flat());
    expect(distinct.size).toBeGreaterThan(8);
    for (const r of runs) for (let i = 1; i < r.menus.length; i++) expect(r.menus[i].join("|")).not.toBe(r.menus[i - 1].join("|"));
  });
});

describe("Life never ends early", () => {
  it("days continue until the player dies (well past 45)", () => {
    const ages: number[] = [];
    for (const seed of [21, 22, 23]) {
      const { g } = playLife(seed, 200);
      expect(g.isOver()).toBe(true);
      expect(g.state.alive).toBe(false);
      ages.push(g.ending().age);
    }
    expect(Math.max(...ages)).toBeGreaterThan(60);
    expect(ages.every((a) => a > 45)).toBe(true);
  });
});

describe("Save / load / determinism", () => {
  it("the same seed and choices reproduce the same game", () => {
    const a = playLife(31, 6).g.hud();
    const b = playLife(31, 6).g.hud();
    expect(a).toEqual(b);
  });

  it("save → load mid-day continues exactly the same", () => {
    const g = createGame({ ...SETUP, seed: 41 });
    const play = (x: Game) => {
      const out: string[] = [];
      for (let i = 0; i < 60; i++) {
        for (const b of x.advance(x.s.minute + 30)) {
          out.push(b.kind === "popup" ? b.popup.line : b.kind === "toast" ? b.text : b.kind === "log" ? b.text : b.kind);
          if (b.kind === "popup") x.choose(0);
        }
      }
      return out;
    };
    g.advance(700);
    if (g.s.pending) g.choose(0);
    const copy = loadGame(g.save());
    expect(play(copy)).toEqual(play(g));
    expect(copy.hud()).toEqual(g.hud());
  });

  it("starts single at 25 with a visible HUD and scene", () => {
    const g = createGame({ ...SETUP, seed: 51 });
    expect(g.facts().single).toBe(true);
    expect(g.s.day!.age).toBe(25);
    g.advance(500);
    expect(g.hud().date).toMatch(/^\d{4}\.\d{2}\.\d{2}/);
    expect(g.scene()).toBeDefined();
    expect(Object.values(g.state.world!.npcs).some((n) => n.fated && n.name === "Ren")).toBe(true);
  });
});
