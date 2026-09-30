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
        const m = s.replace(/AED|SNS|KTX|CCTV|PT|OK|MBTI/g, "").match(/[A-Za-z]{3,}/);
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

describe("Others' big moments are popups", () => {
  it("a friend's wedding comes as an invitation on your next played day (with their name), then a memory card", async () => {
    const { queueChain } = await import("../src/story/lifeEvents");
    const g = createGame({ ...JAE, seed: 7 });
    queueChain(g.state, "INVITE_FRIEND_WEDDING", [0, 0], new SeededRandom(1), { vars: { buddy: "하윤" } });
    g.endDay();
    let seen: { title?: string; line: string; result?: string } | undefined;
    for (let d = 0; d < 3 && !seen; d++) {
      for (let i = 0; i < 400; i++) {
        const beats = g.advance(g.s.minute + 30);
        for (const b of beats) if (b.kind === "popup") {
          const r = g.choose(0);
          if (b.popup.title === "청첩장") seen = { title: b.popup.title, line: b.popup.line, result: r?.line };
        }
        if (beats.some((b) => b.kind === "dayEnd")) break;
      }
      const r = g.endDay();
      if (seen) expect(r.cards.some((c) => c.caption.includes("하윤의 결혼식"))).toBe(true);
    }
    expect(seen?.line).toContain("하윤");
    expect(seen?.line).toContain("청첩장");
    expect(seen?.result).not.toMatch(/[{}]/);
  });
});

describe("The life road (play screen)", () => {
  it("you walk alone; together your partner walks beside you holding hands — not while you live apart", () => {
    const single = createGame({ ...JAE, seed: 8, fated: { ...JUNG, status: "stranger" } });
    expect(single.road().walkers.map((w) => w.role)).toEqual(["me"]);
    const near = createGame({ ...JAE, seed: 8, fated: { ...JUNG, from: "same", status: "dating" } });
    const r = near.road();
    expect(r.walkers.map((w) => w.role)).toEqual(["partner", "me"]);
    expect(r.walkers[0].holds).toBe("me");
    expect(["city", "town", "seaside"]).toContain(r.backdrop.theme);
    expect(r.walking).toBe(true);
    const far = createGame({ ...JAE, seed: 8, fated: { ...JUNG, from: "abroad", status: "dating" } });
    expect(far.road().walkers.map((w) => w.role)).toEqual(["me"]);
    // Kids walk along; a baby is carried; pets trot at the edge.
    near.state.kids = [{ id: "kid1", name: "하람", sex: "FEMALE", bornYear: near.state.date.year - 5, bornMonth: 3, spriteSeed: 1 } as never, { id: "kid2", name: "도담", sex: "MALE", bornYear: near.state.date.year, bornMonth: 1, spriteSeed: 2 } as never];
    near.state.pets = [{ id: "pet1", name: "콩이", species: "DOG", adoptedYear: 2020, ageAtAdoption: 1, alive: true, spriteSeed: 3 }];
    const fam = near.road().walkers;
    expect(fam.map((w) => w.role)).toEqual(["partner", "me", "kid", "baby", "pet"]);
    expect(fam.find((w) => w.role === "baby")?.carriedBy).toBe("partner");
  });
});

describe("Round fixes: status-aware moods, long distance, partner looks, skylines", () => {
  it("moods never contradict your status; living apart means no in-person partner moments or dates", async () => {
    const { allMoodLines } = await import("../src/story/mood");
    const { meets } = await import("../src/game/facts");
    const conditional = allMoodLines().filter((l) => l.when?.length);
    const bad: string[] = [];
    for (const seed of [2, 4, 8]) {
      const g = createGame({ ...JAE, seed, lang: "ko", fated: { ...JUNG, from: seed === 8 ? "same" : "abroad", status: "dating" } });
      const rng = new SeededRandom(seed);
      for (let d = 0; d < 30 && !g.isOver(); d++) {
        const f = g.facts();
        const mood = g.mood() ?? "";
        for (const l of conditional) if (mood === l.ko && !meets(l.when!, f)) bad.push(`${mood} while ${f.married ? "married" : f.partnered ? "partnered" : "single"}`);
        for (let i = 0; i < 400; i++) {
          const beats = g.advance(g.s.minute + 30);
          for (const b of beats) if (b.kind === "popup") {
            const now = g.facts();
            if (now.apart && b.popup.source === "plan" && b.popup.ch.some((c) => /(공원|레스토랑|영화|놀이공원) 데이트/.test(c.t))) bad.push(`date while apart: ${b.popup.ch.map((c) => c.t).join("/")}`);
            if (now.apart && b.popup.source === "story" && b.popup.who === "partner" && !b.popup.big) bad.push(`in-person partner moment while apart: ${b.popup.line}`);
            g.choose(rng.int(0, b.popup.ch.length - 1));
          }
          if (beats.some((b) => b.kind === "dayEnd")) break;
        }
        const r = g.endDay();
        for (const c of r.cards) for (const a of c.scene?.actors ?? []) if (a.role === "partner" && a.gender !== "M") bad.push(`card ${c.kind}: partner gender ${a.gender}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it("the road's skyline follows your city (top-50 list, generic otherwise)", async () => {
    const { skylineFor } = await import("../src/world/road");
    expect(skylineFor("Seoul", "Korea", "ko").landmarks).toContain("N서울타워");
    expect(skylineFor("Paris", "France", "ko").landmarks).toContain("에펠탑");
    expect(skylineFor("New York", "USA", "en").street).toContain("Yellow cabs");
    expect(skylineFor("Chuncheon", "Korea", "ko").id).toBe("korea");
    expect(skylineFor("Hamburg", "Germany", "ko").id).toBe("world");
    const g = createGame({ ...JAE, seed: 3 });
    expect(g.road().backdrop.skyline.landmarks.length).toBeGreaterThan(0);
  });
});

describe("The English version stays English; the story starts in 2026", () => {
  it("no Korean anywhere shown in whole English lives (names romanized, family words translated)", () => {
    const hits: string[] = [];
    for (const seed of [1, 3]) {
      const g = createGame({ name: "Jae", gender: "F", likes: "M", birth: { year: 1997, month: 9, day: 28 }, mbti: "ENFP", seed, lang: "en", birthplace: "Seoul", family: { grandparents: 2, siblings: [{ rel: "OLDER_BROTHER" }] }, fated: { name: "Jung", from: seed === 3 ? "abroad" : "same", status: seed === 1 ? "talking" : "stranger" } });
      const rng = new SeededRandom(seed);
      const check = (t: unknown) => {
        const s = JSON.stringify(t ?? "");
        if (/[가-힣]/.test(s)) hits.push(s.slice(0, 120));
      };
      for (let d = 0; d < 30 && !g.isOver(); d++) {
        for (let i = 0; i < 400; i++) {
          const beats = g.advance(g.s.minute + 30);
          check(beats);
          for (const b of beats) if (b.kind === "popup") check(g.choose(rng.int(0, b.popup.ch.length - 1)));
          if (beats.some((b) => b.kind === "dayEnd")) break;
        }
        check(g.hud());
        check(g.road());
        check(g.people());
        const r = g.endDay();
        check({ lines: r.lines, notes: r.notes, captions: r.cards.map((c) => c.caption) });
      }
    }
    expect(hits).toEqual([]);
  });

  it("starts in 2026 at your real age (never younger than 18)", () => {
    const g = createGame({ ...JAE, seed: 1 });
    expect(g.state.date.year).toBe(2026);
    expect(Math.floor(g.state.age)).toBe(29);
    const young = createGame({ ...JAE, birth: { year: 2012, month: 3, day: 1 }, seed: 1 });
    expect(Math.floor(young.state.age)).toBe(18);
  });
});
