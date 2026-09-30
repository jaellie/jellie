import { describe, expect, it } from "vitest";
import { createGame, type Game } from "../src/game/game";
import { FATED_JOBS, fatedOptions, fatedVars, findFatedJob, meetPlan } from "../src/story/fatedProfile";
import { storyPopup } from "../src/story/storyEngine";
import { SeededRandom } from "../src/core/rng";

const JAE = { name: "Jae Kim", gender: "F" as const, likes: "M" as const, birth: { year: 1997, month: 9, day: 28 }, mbti: "ENFP" };
const JUNG = { name: "Jung Choi", gender: "M" as const, mbti: "INFP", birth: { year: 1998, month: 11, day: 14 } };

/** Play days, answering every popup with `pick`, until `stop` or `maxDays`. */
function play(g: Game, stop: (g: Game) => boolean, pick: (p: { ch: unknown[] }) => number, maxDays = 30) {
  const seen: Array<{ title?: string; line: string; who: string; result?: string; resultWho?: string }> = [];
  for (let d = 0; d < maxDays && !g.isOver() && !stop(g); d++) {
    for (let i = 0; i < 400; i++) {
      const beats = g.advance(g.s.minute + 30);
      for (const b of beats) {
        if (b.kind === "popup") {
          const r = g.choose(pick(b.popup));
          seen.push({ title: b.popup.title, line: b.popup.line, who: b.popup.who, result: r?.line, resultWho: r?.who });
        }
      }
      if (beats.some((b) => b.kind === "dayEnd")) break;
    }
    g.endDay();
  }
  return seen;
}

describe("The destined person's life (where they live, their job)", () => {
  it("offers where-they-live and ~28 jobs; free text finds a job", () => {
    const o = fatedOptions("ko");
    expect(o.lives.map((l) => l.id)).toEqual(["same", "city", "abroad"]);
    expect(o.jobs.length).toBeGreaterThanOrEqual(25);
    expect(findFatedJob("대학병원 의사")?.id).toBe("doctor");
    expect(findFatedJob("Barista")?.id).toBe("barista");
    expect(FATED_JOBS.every((j) => j.meet)).toBe(true);
  });

  it("abroad: they live in a foreign city; you meet on the app (or on a flight), then love is long distance", () => {
    const g = createGame({ ...JAE, seed: 1, fated: { ...JUNG, from: "abroad", job: "developer", city: "Tokyo", status: "stranger" } });
    const life = g.state.story!.fatedLife!;
    expect(life.city.id).toBe("tokyo");
    expect(life.job.id).toBe("developer");
    const plan = meetPlan(g.state, false);
    expect(plan.location).toBe("language_exchange_app");
    expect(plan.line.ko).toContain("{fatedCity}");
    expect(fatedVars(g.state).fatedCity).toBe("도쿄");
    // The first meeting comes early — in the best year for *both* charts within the first years.
    const love = g.state.story!.script.find((e) => e.theme === "LOVE_MEETING")!;
    expect(love.age - Math.floor(g.state.age)).toBeLessThanOrEqual(7);
    expect(love.signals.some((t) => t.startsWith("상대:"))).toBe(true);
  });

  it("same neighborhood: you meet where they work (the barista at your café, the doctor in the ER)", () => {
    for (const [job, place] of [["barista", "cafe"], ["doctor", "hospital"], ["trainer", "gym"]] as const) {
      const g = createGame({ ...JAE, seed: 2, fated: { ...JUNG, from: "same", job, status: "stranger" } });
      expect(meetPlan(g.state, false).location).toBe(place);
      const e = g.state.story!.script.find((x) => x.theme === "LOVE_MEETING")!;
      const def = storyPopup(g.state, "fated", e.id, g.facts(), new SeededRandom(1), { peek: true })!;
      expect(def.location).toBe(place);
    }
  });

  it("a missed meeting isn't the end: fate brings them around again (at most twice)", () => {
    let again = 0;
    for (let seed = 1; seed <= 6; seed++) {
      const g = createGame({ ...JAE, seed, fated: { ...JUNG, from: "same", status: "stranger" } });
      // Always walk past them.
      play(g, (x) => x.state.age > 40, (p) => p.ch.length - 1, 14);
      again += g.state.story!.script.filter((e) => e.data?.again).length;
      expect(g.state.story!.script.filter((e) => e.data?.again).length).toBeLessThanOrEqual(2);
    }
    expect(again).toBeGreaterThan(0);
  });

  it("status 'talking' (썸) starts with the texts and plays up to the confession; 'dating' starts as a couple", () => {
    const t = createGame({ ...JAE, seed: 3, fated: { ...JUNG, from: "same", status: "talking" } });
    expect(t.state.story!.arcs.some((a) => a.type === "TALKING")).toBe(true);
    expect(t.state.story!.script.some((e) => e.theme === "LOVE_MEETING")).toBe(false);
    const seen = play(t, (x) => !x.state.story!.arcs.some((a) => a.type === "TALKING"), () => 0, 12);
    const titles = seen.map((s) => s.title);
    expect(titles).toContain("새벽 카톡");
    expect(titles).toContain("고백");
    const d = createGame({ ...JAE, seed: 3, fated: { ...JUNG, from: "same", status: "dating" } });
    expect(d.state.relationship.status).toBe("DATING");
    expect(d.facts().fatedPartner).toBe(true);
  });

  it("dating someone abroad: the long-distance arc (call → visit → who moves) — and moving ends it", () => {
    let moved = 0;
    for (let seed = 1; seed <= 4; seed++) {
      const g = createGame({ ...JAE, seed, fated: { ...JUNG, from: "abroad", city: "Paris", status: "dating" } });
      const seen = play(g, (x) => !!x.state.flags.ldrDone || x.state.relationship.status !== "DATING", () => 0, 10);
      const call = seen.find((s) => s.title === "장거리 연애");
      expect(call?.line).toContain("시차");
      expect(call?.line).toMatch(/[0-9]+시간/);
      if (g.state.flags.ldrDone) moved++;
    }
    expect(moved).toBeGreaterThan(0);
  });

  it("their job shows up in your life together (night shifts, flights, a zero month…)", () => {
    const g = createGame({ ...JAE, seed: 4, fated: { ...JUNG, from: "same", job: "nurse", status: "dating" } });
    const f = g.facts();
    expect(f.fatedJobNight).toBe(true);
    expect(f.fatedJobCare).toBe(true);
    expect(f.fatedJobAway).toBe(false);
  });
});

describe("Who says the result line", () => {
  it("'not yet' to a proposal: the reply is your partner's, not yours", () => {
    let checked = 0;
    for (let seed = 1; seed <= 6 && !checked; seed++) {
      const g = createGame({ ...JAE, seed, fated: { ...JUNG, from: "same", status: "dating" } });
      const seen = play(g, (x) => x.state.engaged || x.state.relationship.status !== "DATING", (p) => (p.ch.length === 3 ? 1 : 0), 14);
      const reply = seen.find((s) => s.title === "프러포즈" && s.result?.includes("오래 기다리진 못할"));
      if (reply) {
        expect(reply.resultWho).toBe("partner");
        checked++;
      }
    }
    expect(checked).toBe(1);
  });
});

describe("The Korean version stays Korean", () => {
  it("no English words in anything shown during whole Korean lives (names aside)", () => {
    const hits: string[] = [];
    for (const seed of [1, 3, 5]) {
      const g = createGame({ name: "제이", gender: "F", likes: "M", birth: { year: 1997, month: 9, day: 28 }, mbti: "ENFP", seed, lang: "ko", fated: { name: "정우", from: seed === 3 ? "abroad" : "same", status: seed === 1 ? "talking" : seed === 3 ? "dating" : "stranger" } });
      const rng = new SeededRandom(seed);
      const names = () => [...Object.values(g.state.world?.npcs ?? {}).map((n) => n.name), ...g.state.npcs.map((n) => n.name)].filter(Boolean);
      const check = (t?: string) => {
        if (!t) return;
        let s = t;
        for (const n of names()) s = s.split(n).join("");
        const m = s.replace(/AED|SNS|KTX|PT|OK/g, "").match(/[A-Za-z]{3,}/);
        if (m) hits.push(t);
      };
      for (let d = 0; d < 30 && !g.isOver(); d++) {
        for (let i = 0; i < 400; i++) {
          const beats = g.advance(g.s.minute + 30);
          for (const b of beats) {
            if (b.kind === "popup") {
              check(b.popup.line);
              check(b.popup.title);
              b.popup.ch.forEach((c) => check(c.t));
              check(g.choose(rng.int(0, b.popup.ch.length - 1))?.line);
            } else if (b.kind === "toast") check(b.text);
            else if (b.kind === "log" || b.kind === "mood") check(b.text);
          }
          if (beats.some((b) => b.kind === "dayEnd")) break;
        }
        const h = g.hud();
        check(`${h.job} ${h.relationship} ${h.location} ${h.city}`);
        const r = g.endDay();
        r.lines.forEach(check);
        r.cards.forEach((c) => check(c.caption));
      }
    }
    expect(hits).toEqual([]);
  });
});

describe("The mood line (top of the screen)", () => {
  it("one mood per played day, no world log lines, no times — and it foreshadows what the chart has coming", async () => {
    const { allMoodLines, pickMood } = await import("../src/story/mood");
    for (const l of allMoodLines()) {
      expect(l.ko).toMatch(/^\(.*\)$/);
      expect(l.en.length).toBeGreaterThan(3);
      expect(l.ko).not.toMatch(/[0-9]{1,2}:[0-9]{2}/);
    }
    const g = createGame({ ...JAE, seed: 2, fated: { ...JUNG, from: "abroad", status: "talking" } });
    let moods = 0;
    for (let d = 0; d < 6; d++) {
      let today = 0;
      for (let i = 0; i < 400; i++) {
        const beats = g.advance(g.s.minute + 30);
        for (const b of beats) {
          expect(b.kind).not.toBe("log");
          if (b.kind === "mood") today++;
          if (b.kind === "popup") g.choose(0);
        }
        if (beats.some((b) => b.kind === "dayEnd")) break;
      }
      expect(today).toBe(1);
      moods += today;
      g.endDay();
    }
    expect(moods).toBe(6);
    // A move coming within the year colours the mood ("요즘 자꾸 해외로 나가고 싶다").
    const st = g.state;
    st.story!.script.push({ id: "MOVE@x", theme: "MOVE", age: Math.floor(st.age), monthIndex: st.monthIndex + 6, chartWeights: {}, signals: [] });
    const sources = Array.from({ length: 40 }, (_, i) => pickMood(st, g.facts(), {}, new SeededRandom(i)).source);
    expect(sources.filter((s) => s === "fated:MOVE").length).toBeGreaterThan(5);
  });

  it("a destined turning point's big popup says why (the chart signals behind it)", () => {
    const g = createGame({ ...JAE, seed: 1, fated: { ...JUNG, from: "same", status: "stranger" } });
    let reading: string | undefined;
    for (let d = 0; d < 12 && !reading && !g.isOver(); d++) {
      for (let i = 0; i < 400 && !reading; i++) {
        const beats = g.advance(g.s.minute + 30);
        for (const b of beats) if (b.kind === "popup") {
          if (b.popup.reading) reading = b.popup.reading;
          g.choose(0);
        }
        if (beats.some((b) => b.kind === "dayEnd")) break;
      }
      g.endDay();
    }
    expect(reading).toMatch(/사주:|점성술:/);
  });
});
