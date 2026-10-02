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

  it("same neighborhood: you meet where they work (the barista at your café, the doctor in the ER) — or now and then on an app", () => {
    let atWork = 0;
    for (const [job, place] of [["barista", "cafe"], ["doctor", "hospital"], ["trainer", "gym"]] as const) {
      for (const seed of [2, 3, 4]) {
        const g = createGame({ ...JAE, seed, fated: { ...JUNG, from: "same", job, status: "stranger" } });
        const loc = meetPlan(g.state, false).location;
        expect([place, "dating_app", "instagram"]).toContain(loc);
        if (loc === place) atWork++;
      }
    }
    expect(atWork).toBeGreaterThan(4);
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
    expect(titles).toContain("마음을 건네다");
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
      const seen = play(g, (x) => x.state.engaged || x.state.relationship.status !== "DATING", (p) => (p.ch.length === 3 ? 1 : 0), 20);
      const reply = seen.find((s) => s.title === "사랑의 서약" && s.result?.includes("오래 기다리진 못할"));
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
    const g = createGame({ ...JAE, seed: 7, fated: { ...JUNG, status: "dating" } });
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
  it("you walk alone; together your partner walks beside you holding hands — long distance too (drawn faded)", () => {
    const single = createGame({ ...JAE, seed: 8, fated: { ...JUNG, status: "stranger" } });
    expect(single.road().walkers.map((w) => w.role)).toEqual(["me"]);
    const near = createGame({ ...JAE, seed: 8, fated: { ...JUNG, from: "same", status: "dating" } });
    const r = near.road();
    expect(r.walkers.map((w) => w.role)).toEqual(["partner", "me"]);
    expect(r.walkers[0].holds).toBe("me");
    expect(["city", "town", "seaside"]).toContain(r.backdrop.theme);
    expect(r.walking).toBe(true);
    const far = createGame({ ...JAE, seed: 8, fated: { ...JUNG, from: "abroad", status: "dating" } });
    const farWalkers = far.road().walkers;
    expect(farWalkers.map((w) => w.role)).toEqual(["partner", "me"]);
    expect(farWalkers[0].apart).toBe(true);
    expect(r.walkers[0].apart).toBeUndefined();
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

  it("starts on the day you got together / got married — or in your youth (20)", () => {
    const g = createGame({ ...JAE, seed: 1, fated: { ...JUNG, status: "dating", since: { year: 2024, month: 5, day: 3 } } });
    expect(g.state.date.year).toBe(2024);
    expect(g.state.relationship.status).toBe("DATING");
    expect(g.s.day?.prologue).toBeUndefined();
    const wed = createGame({ ...JAE, seed: 1, fated: { ...JUNG, status: "married", since: { year: 2022, month: 10, day: 9 } } });
    expect(wed.state.date.year).toBe(2022);
    expect(wed.state.relationship.status).toBe("MARRIED");
    expect(wed.state.story!.script.some((e) => e.theme === "MARRIAGE" || e.theme === "LOVE_MEETING")).toBe(false);
    const talking = createGame({ ...JAE, seed: 1, fated: { ...JUNG, status: "talking" } });
    expect(Math.floor(talking.state.age)).toBe(20);
  });

  it("celebrations: 100일 and anniversaries, sometimes a birthday coming up", () => {
    const g = createGame({ ...JAE, seed: 3, fated: { ...JUNG, from: "same", status: "dating", since: { year: 2020, month: 1, day: 1 } } });
    const titles: string[] = [];
    for (let d = 0; d < 14 && !g.isOver(); d++) {
      for (let i = 0; i < 400; i++) {
        const bs = g.advance(g.s.minute + 30);
        for (const b of bs) if (b.kind === "popup") { if (b.popup.source === "occasion") titles.push(b.popup.title ?? ""); g.choose(0); }
        if (bs.some((b) => b.kind === "dayEnd")) break;
      }
      g.endDay();
    }
    expect(titles).toContain("100일");
  });

  it("strangers: the years before the meeting pass off-screen — the first day IS the meeting", () => {
    for (const status of ["stranger", "acquaintance"] as const) {
      const g = createGame({ ...JAE, seed: 1, fated: { ...JUNG, from: "same", status } });
      expect(g.s.dayKind).toBe("fated");
      expect(g.state.story!.script.find((e) => e.id === g.s.dayRef)?.theme).toBe("LOVE_MEETING");
      expect(g.state.date.year).toBeGreaterThanOrEqual(JAE.birth.year + 20);
      if (g.state.date.year > JAE.birth.year + 20) expect(g.s.day?.prologue).toMatch(/그 사람을 만나기까지, \d+년이 흘렀다/);
    }
  });
});

describe("'아니, 아직 그냥 아는 사이야' (acquaintance)", () => {
  it("you know each other's names but there's no 썸; the destined year brings the confession", () => {
    expect(fatedOptions("ko").statuses.map((s) => s.id)).toEqual(["married", "dating", "talking", "acquaintance", "stranger"]);
    const g = createGame({ ...JAE, seed: 4, fated: { ...JUNG, from: "same", status: "acquaintance" } });
    const f = g.facts();
    expect(f.fatedKnown).toBe(true);
    expect(f.partnered).toBe(false);
    expect(g.state.story!.arcs.some((a) => a.type === "TALKING")).toBe(false);
    const love = g.state.story!.script.find((e) => e.theme === "LOVE_MEETING");
    expect(love).toBeDefined();
    // When it comes, it's the "suddenly I can't take my eyes off them" confession, with their name.
    const def = storyPopup(g.state, "fated", love!.id, g.facts(), new SeededRandom(1), { peek: true })!;
    expect(def.title?.ko).toBe("고백");
  });
});

describe("My job (setup.job)", () => {
  it("offers ~45 jobs including 무직, 대학생, 취업준비생 — the same list as the partner's", async () => {
    const { myJobOptions } = await import("../src/story/fatedProfile");
    const o = myJobOptions("ko");
    expect(o.question).toBe("나의 직업은?");
    expect(o.jobs.length).toBeGreaterThanOrEqual(44);
    for (const n of ["회사원", "무직", "대학생", "취업준비생", "프리랜서", "간호사", "파일럿"]) expect(o.jobs.map((j) => j.name)).toContain(n);
    expect(myJobOptions("en").jobs.every((j) => /^[A-Za-z]/.test(j.name))).toBe(true);
    // The destined person's job list is exactly the same, in the same order.
    expect(fatedOptions("ko").jobs).toEqual(o.jobs);
  });

  it("the job shapes the life: employed or not, student, self-employed (no coworkers), the HUD label", () => {
    const make = (job: string) => createGame({ ...JAE, job, seed: 3, fated: { ...JUNG, status: "dating" } });
    const nurse = make("nurse");
    expect(nurse.hud().job).toBe("간호사");
    expect(nurse.facts().employed).toBe(true);
    const none = make("무직");
    expect(none.facts().employed).toBe(false);
    expect(none.hud().job).toBe("무직");
    const student = make("student");
    expect(student.facts().student).toBe(true);
    expect(student.hud().job).toBe("대학생");
    const writer = make("writer");
    expect(writer.facts().selfEmployed).toBe(true);
    expect(make("police").hud().job).toBe("경찰관");
  });
});

describe("Big moments in four parts, shaped by both MBTIs", () => {
  it("the confession is 4 popups on one day: their move → your inner moment → the moment before → the climax", () => {
    const g = createGame({ ...JAE, mbti: "ENFP", seed: 7, fated: { ...JUNG, mbti: "INFJ", from: "same", status: "talking" } });
    const seen = play(g, (x) => !x.state.story!.arcs.some((a) => a.type === "TALKING"), () => 0, 14);
    const parts = ["설렘의 시작", "두근거리는 밤", "한 걸음 앞", "마음을 건네다"];
    const titles = seen.map((s) => s.title).filter((t) => parts.includes(t ?? ""));
    expect(titles).toEqual(parts);
    expect(seen.every((s) => !/\(\d\/4\)/.test(s.title ?? ""))).toBe(true);
  });

  it("their temperament sets the scene; your own letters decide your options", () => {
    const first = (me: string, them: string) => {
      const g = createGame({ ...JAE, mbti: me, seed: 7, fated: { ...JUNG, mbti: them, from: "same", status: "talking" } });
      const seen = play(g, (x) => !x.state.story!.arcs.some((a) => a.type === "TALKING"), () => 0, 14);
      return seen.filter((s) => ["설렘의 시작", "두근거리는 밤", "한 걸음 앞", "마음을 건네다"].includes(s.title ?? ""));
    };
    const nf = first("ENFP", "INFJ");
    const sp = first("ISTJ", "ESTP");
    expect(nf[0].line).toContain("별");
    expect(sp[0].line).toContain("불꽃놀이");
    // Part 2: an E sees "call a friend"; an I sees "music alone".
    expect(nf[1].line).not.toBe(sp[1].line);
  });
});

describe("Left entirely to fate (운명에 맡기기)", () => {
  it("the chart decides: the one you marry and grow old with, or a solitary chart's last love", () => {
    const minjun = createGame({ name: "민준", gender: "M", likes: "F", birth: { year: 1994, month: 3, day: 3 }, mbti: "ISTJ", seed: 2 });
    expect(minjun.state.story!.fateMode).toBe("lifelong");
    expect(minjun.s.prologue?.ko).toMatch(/평생을 함께할 사람을 만난다/);
    const jae = createGame({ ...JAE, seed: 1, fated: { sealed: true } });
    expect(jae.state.story!.fateMode).toBe("solitary");
    expect(jae.state.story!.fateSigns).toContain("화개");
    expect(jae.s.prologue?.ko).toMatch(/내 인생의 마지막 사랑이 찾아온다/);
    // The last love comes late, and no wedding is written in the stars.
    expect(Math.floor(jae.state.age)).toBeGreaterThanOrEqual(42);
    expect(jae.state.story!.script.some((e) => e.theme === "MARRIAGE")).toBe(false);
    // Naming them (or anything else about them) means it isn't sealed.
    expect(createGame({ ...JAE, seed: 1, fated: { ...JUNG, status: "dating" } }).state.story!.fateMode).toBeUndefined();
  });

  it("a solitary chart's ending is told as a story: the last love, then a life alone", () => {
    const g = createGame({ ...JAE, seed: 3, fated: { sealed: true } });
    for (let d = 0; d < 120 && !g.isOver(); d++) {
      for (let i = 0; i < 400; i++) {
        const beats = g.advance(g.s.minute + 30);
        for (const b of beats) if (b.kind === "popup") g.choose(b.popup.ch.length - 1);
        if (beats.some((b) => b.kind === "dayEnd")) break;
      }
      g.endDay();
    }
    const e = g.ending();
    expect(["마지막 사랑", "운명을 이긴 사랑"]).toContain(e.title);
    if (e.title === "마지막 사랑") expect(e.story).toMatch(/평생 혼자/);
  });
});

describe("Weekend picks just for fun, by country", () => {
  const menuLabels = (country: string, city: string, status: "dating" | "stranger") => {
    const labels = new Set<string>();
    for (let seed = 1; seed <= 12; seed++) {
      const g = createGame({ ...JAE, seed, fated: { ...JUNG, from: "same", status } });
      g.state.location = { country, city };
      for (let k = 0; k < 4; k++) { g.s.dayIndex = k; for (const o of g.weekendMenu()) labels.add(o.label.ko); }
    }
    return [...labels];
  };
  it("Korea gets 인생네컷 and 치맥; Tokyo gets izakaya and fireworks; Paris gets the Seine — never another country's", () => {
    const kr = menuLabels("Korea", "Seoul", "dating").join(" | ");
    const jp = menuLabels("Japan", "Tokyo", "dating").join(" | ");
    const fr = menuLabels("France", "Paris", "dating").join(" | ");
    expect(kr).toMatch(/인생네컷|치맥|커플링|방탈출|코인노래방|편의점 라면|보드게임/);
    expect(jp).toMatch(/이자카야|프리쿠라|가챠폰|회전초밥|편의점 디저트|온천|카라오케|코타츠|불꽃놀이|하나미|모미지/);
    expect(jp).not.toMatch(/인생네컷|치맥/);
    expect(fr).toMatch(/센 강변|불랑제리|벼룩시장|테라스|비스트로|페탕크|미술관|자전거|뤽상부르|뱅쇼/);
  });
  it("a fun pick answers with its own little line", () => {
    const g = createGame({ ...JAE, seed: 2, fated: { ...JUNG, from: "same", status: "dating" } });
    const fun = g.weekendMenu().find((o) => o.id.startsWith("fun:"));
    if (fun) expect(fun.reply?.ko).toMatch(/^\(/);
  });
});

describe("The destined person's gender always follows who you like", () => {
  it("left to fate, with or without 'likes': a man for a woman who likes men (and the reverse)", () => {
    for (let seed = 1; seed <= 8; seed++) {
      expect(createGame({ name: "제이", gender: "F", likes: "M", birth: { year: 1997, month: 9, day: 28 }, seed, fated: { sealed: true } }).fated()!.gender).toBe("M");
      expect(createGame({ name: "제이", gender: "F", birth: { year: 1997, month: 9, day: 28 }, seed, fated: { sealed: true } }).fated()!.gender).toBe("M");
      expect(createGame({ name: "민준", gender: "M", birth: { year: 1994, month: 3, day: 3 }, seed }).fated()!.gender).toBe("F");
      expect(createGame({ name: "제이", gender: "F", likes: "F", birth: { year: 1997, month: 9, day: 28 }, seed, fated: { sealed: true } }).fated()!.gender).toBe("F");
    }
  });
});

describe("Meeting online isn't always the same app", () => {
  it("abroad: language exchange, dating app, Instagram, a fan community — varied by person", () => {
    const places = new Set<string>();
    for (let seed = 1; seed <= 24; seed++) {
      const g = createGame({ ...JAE, seed, fated: { ...JUNG, from: "abroad", city: "Tokyo", status: "stranger" } });
      places.add(meetPlan(g.state, false).location);
    }
    expect(places.size).toBeGreaterThanOrEqual(3);
    expect([...places]).toEqual(expect.arrayContaining(["dating_app"]));
  });
});

describe("Where you live now (setup.home)", () => {
  it("sets the story's city (and abroad), not the charts", () => {
    const busan = createGame({ ...JAE, seed: 2, home: "부산", fated: { ...JUNG, status: "dating" } });
    expect(busan.state.location).toEqual({ country: "Korea", city: "Busan" });
    expect(busan.road().backdrop.theme).toBe("seaside");
    const tokyo = createGame({ ...JAE, seed: 2, home: "Tokyo", fated: { ...JUNG, status: "dating" } });
    expect(tokyo.state.location.country).toBe("Japan");
    expect(tokyo.state.flags.livedAbroad).toBe(true);
    // The chart is the same either way (it follows the birthplace).
    expect(JSON.stringify(busan.state.chart?.fourPillars)).toBe(JSON.stringify(tokyo.state.chart?.fourPillars));
  });
});

describe("Without a home city, you live where you were born", () => {
  it("born in New York → the story starts in New York (not a random Korean city)", () => {
    const g = createGame({ ...JAE, seed: 5, birthplace: "New York", fated: { ...JUNG, status: "dating" } });
    expect(g.state.location).toEqual({ country: "USA", city: "New York" });
  });
});

describe("Where they live is measured from where you live", () => {
  it("you in New York, them in Busan → abroad, and they really are in Busan (never a random Tokyo)", () => {
    for (const from of ["abroad", "city", "same"] as const) {
      const g = createGame({ ...JAE, seed: 3, home: "New York", fated: { ...JUNG, from, city: "부산", status: "stranger" } });
      expect(g.state.location.city).toBe("New York");
      expect(g.state.story!.fatedLife!.city.id).toBe("busan");
      expect(g.state.story!.fatedLife!.from).toBe("abroad");
    }
  });
  it("without a home city, a birthplace given as coordinates still sets where you live", () => {
    const g = createGame({ ...JAE, seed: 3, birthplace: { lat: 40.71, lon: -74.0 } as never, fated: { ...JUNG, status: "dating" } });
    expect(g.state.location.city).toBe("New York");
  });
});

describe("Saying no to a proposal", () => {
  it("a good match stays together after a refused ring; the question comes again later", () => {
    let checked = 0;
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const g = createGame({ ...JAE, seed, fated: { ...JUNG, from: "same", status: "dating" } });
      g.state.story!.compat = { score: 0.9, chemistry: 0.8, stability: 0.9, friction: 0.1 };
      const refused = () => !!g.state.story!.arcs.find((a) => a.type === "DATING")?.data?.refused;
      const seen = play(g, refused, (p) => p.ch.length - 1, 120);
      if (!refused()) continue;
      checked++;
      const stay = seen.find((s) => s.result?.includes("반지를 다시 주머니에"));
      expect(stay?.result).not.toMatch(/^\(/); // no "fate stepped in" bridge: you chose this
      expect(g.state.relationship.status).toBe("DATING");
      expect(g.state.story!.bond?.parting).toBeUndefined();
      const dating = g.state.story!.arcs.find((a) => a.type === "DATING")!;
      expect(dating.steps[dating.step].key).toBe("PROPOSAL");
    }
    expect(checked).toBeGreaterThan(0);
  });
});

describe("City pickers", () => {
  it("autocomplete finds real cities; a typo matches nothing", async () => {
    const { searchPlaces } = await import("../src/destiny/birthplace");
    expect(searchPlaces("여수")[0]).toMatchObject({ id: "yeosu", name: "여수", countryName: "한국" });
    expect(searchPlaces("여수수")).toEqual([]);
    expect(searchPlaces("to", "en").map((p) => p.name)).toContain("Tokyo");
  });
  it("the partner's city (by id) decides near/far, measured from my home", () => {
    const g = createGame({ ...JAE, seed: 2, home: "New York", fated: { ...JUNG, city: "busan", status: "dating" } } as never);
    expect(g.state.story!.fatedLife!.city.id).toBe("busan");
    expect(g.state.story!.fatedLife!.from).toBe("abroad");
  });
});

describe("The first confession", () => {
  it("is never a one-popup jump: becoming a couple always goes through the 4-part confession", () => {
    for (const [seed, status] of [[2, "acquaintance"], [4, "stranger"], [6, "stranger"], [9, "acquaintance"]] as const) {
      const g = createGame({ ...JAE, seed, fated: { ...JUNG, status } });
      const seen = play(g, (x) => !!x.facts().fatedPartner, () => 0, 60);
      if (!g.facts().fatedPartner) continue;
      const titles = seen.map((s) => s.title);
      const i = titles.lastIndexOf("마음을 건네다");
      expect(i).toBeGreaterThanOrEqual(3);
      expect(titles.slice(i - 3, i)).toEqual(["설렘의 시작", "두근거리는 밤", "한 걸음 앞"]);
    }
  });

  it("the charts write how it happens (different couples, different confessions) and show why", async () => {
    const { confessFate } = await import("../src/story/confessFate");
    const { calculateNatalChart } = await import("../src/saju/chart");
    const { calculateAstrologyChart } = await import("../src/astrology/chart");
    const keys = new Set<string>();
    for (let y = 1985; y < 2003; y++) for (const m of [2, 6, 10]) {
      const a = { year: y, month: m, day: 9, hour: 8, minute: 0, sex: "FEMALE" as const };
      const b = { year: y + 1, month: 13 - m, day: 21, hour: 20, minute: 0, sex: "MALE" as const };
      const f = confessFate({ saju: calculateNatalChart(a), astro: calculateAstrologyChart(a) }, { saju: calculateNatalChart(b), astro: calculateAstrologyChart(b) });
      if (f.key) keys.add(f.key), expect(f.signs.length).toBeGreaterThan(0);
    }
    expect(keys.size).toBeGreaterThanOrEqual(5);
  });
});

describe("Occasions while living apart", () => {
  it("a long-distance anniversary is a video call / a flight, never 'where shall we go?'", () => {
    const g = createGame({ ...JAE, seed: 5, fated: { ...JUNG, city: "paris", status: "dating", since: { year: 2025, month: 1, day: 1 } } } as never);
    expect(g.state.relationship.longDistance).toBe(true);
    // Day 100 comes while still apart (seed 5 moves in together before the first anniversary).
    const day100 = play(g, (x) => !x.state.relationship.longDistance, () => 0, 30).find((s) => s.title === "100일");
    expect(day100?.line).toMatch(/화면 너머/);
  });
});

describe("International couples", () => {
  it("Singapore × Madrid: no trip on a story day, no 'flew in' over the phone, the abroad confession is at the airport", () => {
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const g = createGame({ name: "Jae", gender: "F", likes: "M", birth: { year: 1996, month: 5, day: 3 }, birthplace: "Singapore", home: "Singapore", nationality: "SG", mbti: "ENFP", seed, lang: "en",
        fated: { name: "Mateo", gender: "M", birth: { year: 1995, month: 8, day: 9 }, birthplace: "Madrid", nationality: "ES", from: "abroad", city: "madrid", status: "stranger" } } as never);
      for (let d = 0; d < 14 && !g.isOver(); d++) {
        for (let i = 0; i < 400; i++) {
          const beats = g.advance(g.s.minute + 30);
          for (const b of beats) if (b.kind === "popup") {
            const sc = b.popup.scene as { sceneKey?: string } | undefined;
            if (b.popup.source === "story") {
              expect(g.state.world?.travel?.active ?? false).toBe(false);
              if (sc?.sceneKey === "home" || ["instagram", "language_exchange_app", "dating_app", "online_community"].includes(sc?.sceneKey ?? "")) expect(b.popup.line).not.toMatch(/flew in|비행기를 타고 왔다/);
              if (b.popup.title === "Saying It") expect(sc?.sceneKey).toBe("airport");
            }
            g.choose(0);
          }
          if (beats.some((b) => b.kind === "dayEnd")) break;
        }
        g.endDay();
      }
    }
  }, 240000);
});
