import { describe, expect, it } from "vitest";
import { createGame, loadGame, type Beat, type Game } from "../src/game/game";
import { lintContent } from "../src/game/lint";
import { Director, guardRequirements, newDirectorMemory } from "../src/game/director";
import { computeFacts, meets } from "../src/game/facts";
import { fillNames, fixJosa } from "../src/game/text";
import { splitSpeakerTag } from "../src/game/game";
import { SeededRandom } from "../src/core/rng";
import messageData from "../data/game/messages.json";
import seqData from "../data/story/sequences.json";

const SEQUENCE_TITLES = new Set(Object.values(seqData as unknown as Record<string, { titles?: { ko: string[] } }>).flatMap((x) => x.titles?.ko ?? []));

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
          // A big moment's 4 parts (설렘의 시작 → … → 마음을 건네다) are one story moment, not small events.
          if (p.source === "story" && !SEQUENCE_TITLES.has(p.title ?? "")) counts.small++;
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

  it("a leading [이름] tag becomes the speaker (never shown twice); [사진] stays as content", () => {
    expect(splitSpeakerTag("[아빠] [사진] 낚시 갔다")).toEqual({ tag: "아빠", text: "[사진] 낚시 갔다" });
    expect(splitSpeakerTag("[응급실] 보호자분 되시죠?")).toEqual({ tag: "응급실", text: "보호자분 되시죠?" });
    expect(splitSpeakerTag("([아빠] 그래.)")).toEqual({ tag: "아빠", text: "그래." });
    expect(splitSpeakerTag("[사진] 오늘 만든 반찬")).toEqual({ text: "[사진] 오늘 만든 반찬" });
    expect(splitSpeakerTag("밥은 먹었니?")).toEqual({ text: "밥은 먹었니?" });
  });

  it("fillNames fixes the particle after a name — and never touches the rest of the sentence", () => {
    expect(fillNames("{partner}는 웃었다", { partner: "Ren" })).toBe("Ren은 웃었다");
    expect(fillNames("{partner}는 웃었다", { partner: "하나" })).toBe("하나는 웃었다");
    expect(fillNames("{pet}가 짖었다, {kid}랑 놀았다", { pet: "콩이", kid: "도윤" })).toBe("콩이가 짖었다, 도윤이랑 놀았다");
    expect(fillNames("{partner}와 서울로", { partner: "Ren" })).toBe("Ren과 서울로");
    expect(fillNames("{partner}와(과)의 첫 데이트", { partner: "승민" })).toBe("승민과의 첫 데이트");
    expect(fillNames("{partner}와(과)의 첫 데이트", { partner: "하나" })).toBe("하나와의 첫 데이트");
    // Words that merely end like a particle stay exactly as written.
    const free = "떠날 수 있는 기회. 아이 나이 사이, 하지 않는 일.";
    expect(fillNames(free, { partner: "Ren" })).toBe(free);
    expect(fixJosa(free)).toBe(free);
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
  const runs = [11, 12, 13, 14, 15, 16].map((s) => playLife(s));

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
      // Everyday content only (fated/arc story moments like two parents' goodbyes may legitimately echo).
      for (const x of r.shown.filter((s) => s.kind === "message" || (s.kind === "story" && !s.id.startsWith("story")))) {
        const key = x.texts[0];
        const prev = last.get(key);
        if (prev !== undefined) expect(x.day - prev).toBeGreaterThanOrEqual(4);
        last.set(key, x.day);
      }
    }
  });

  it("weekend menus vary and include more than the old three options", () => {
    // Lives are shorter now (they span the bond), so look at a few more of them.
    const menus = [...runs, ...[17, 18, 19, 20, 24, 25].map((s) => playLife(s, 25))].flatMap((r) => r.menus);
    expect(menus.length).toBeGreaterThan(3);
    const distinct = new Set(menus.flat());
    expect(distinct.size).toBeGreaterThan(8);
    for (const r of runs) for (let i = 1; i < r.menus.length; i++) expect(r.menus[i].join("|")).not.toBe(r.menus[i - 1].join("|"));
  });
});

describe("The game is the bond with the destined person", () => {
  it("it ends the day the bond ends (alive), or with your death while together", () => {
    for (const seed of [21, 22, 23]) {
      const { g } = playLife(seed, 200);
      expect(g.isOver()).toBe(true);
      const e = g.ending();
      expect(e.reason).toBeDefined();
      if (g.state.alive) expect(["missed", "breakup", "divorce", "theyDied"]).toContain(e.reason);
      else expect(e.reason).toBe("iDied");
      expect(e.title.length).toBeGreaterThan(0);
    }
  });

  it("a couple who stays together plays on to old age (the ending is your death or theirs)", () => {
    const endings = [1, 2, 3, 4, 5, 6].map((seed) => {
      const g = createGame({ ...SETUP, seed, fated: { ...SETUP.fated, status: "dating" as const } });
      for (let d = 0; d < 200 && !g.isOver(); d++) {
        for (let i = 0; i < 400; i++) {
          const beats = g.advance(g.s.minute + 30);
          for (const b of beats) if (b.kind === "popup") g.choose(0);
          if (beats.some((b) => b.kind === "dayEnd")) break;
        }
        g.endDay();
      }
      return g.ending();
    });
    const longest = endings.filter((e) => e.reason === "iDied" || e.reason === "theyDied");
    expect(longest.length).toBeGreaterThan(0);
    expect(Math.max(...longest.map((e) => e.age))).toBeGreaterThan(45);
    for (const e of longest) expect(e.together?.married).toBe(true);
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

  it("starts single in your youth (청춘, 20) with a visible HUD and scene", () => {
    const g = createGame({ ...SETUP, seed: 51, fated: { ...SETUP.fated, status: "talking" as const } });
    expect(g.facts().single).toBe(true);
    expect(g.s.day!.age).toBe(20);
    expect(g.s.day!.date.year).toBe(SETUP.birth.year + 20);
    g.advance(500);
    expect(g.hud().date).toMatch(/^\d{4}\.\d{2}\.\d{2}/);
    expect(g.scene()).toBeDefined();
    expect(Object.values(g.state.world!.npcs).some((n) => n.fated && n.name === "Ren")).toBe(true);
  });
});

describe("Lifespan & scene data for the UI", () => {
  it("early deaths are rare; most lives reach old age", async () => {
    const { annualMortality } = await import("../src/sim/lifeTick");
    let alive = 1;
    for (let age = 25; age < 55; age++) alive *= 1 - annualMortality(age);
    expect(1 - alive).toBeLessThan(0.05); // <5% die before 55
    let a2 = 1;
    for (let age = 25; age < 80; age++) a2 *= 1 - annualMortality(age);
    expect(a2).toBeGreaterThan(0.4); // a good share reach 80
  });

  it("null 'unknown' fields from the UI are accepted, and scene actors carry gender/role", () => {
    const g = createGame({ ...SETUP, seed: 61, birth: { year: 1997, month: 9, day: 28, hour: null as never, minute: null as never }, fated: { name: null as never, from: null as never, mbti: null as never } });
    g.advance(1200);
    const actors = g.scene()!.actors;
    expect(actors[0]).toMatchObject({ who: "me", role: "me" });
    for (const a of actors.slice(1)) expect(["M", "F"]).toContain(a.gender);
  });
});

describe("Portrait identity for the UI", () => {
  it("every popup with a person has gender+seed (except me/mom/dad), stable per person", () => {
    const seen = new Map<string, number>();
    for (const seed of [71, 72]) {
      const g = createGame({ ...SETUP, seed });
      for (let d = 0; d < 12 && !g.isOver(); d++) {
        for (let i = 0; i < 400; i++) {
          const beats = g.advance(g.s.minute + 30);
          for (const b of beats) {
            if (b.kind !== "popup") continue;
            const p = b.popup;
            if (!["me", "mom", "dad"].includes(p.who)) {
              expect(["M", "F"]).toContain(p.gender);
              expect(typeof p.seed).toBe("number");
              const key = `${seed}:${p.npcId ?? p.name}`;
              if (p.npcId || p.who === "partner") {
                if (seen.has(key)) expect(seen.get(key)).toBe(p.seed);
                seen.set(key, p.seed!);
              }
            }
            g.choose(0);
          }
          if (beats.some((b) => b.kind === "dayEnd")) break;
        }
        g.endDay();
      }
    }
  });

  it("the fated person keeps the fated flag after becoming the partner", async () => {
    const { toPrototypeScene } = await import("../src/integration/prototype");
    const { composeScene } = await import("../src/world/sceneComposer");
    const g = createGame({ ...SETUP, seed: 81, fated: { from: "same" } }); // no name given
    const st = g.state;
    const fated = Object.values(st.world!.npcs).find((n) => n.fated)!;
    st.relationship = { status: "DATING", partnerId: fated.id, sinceMonth: st.monthIndex };
    const v = new (await import("../src/world/worldEngine")).WorldEngine().visit(
      { state: st, world: st.world!, modifiers: (await import("../src/core/lifeModifiers")).emptyModifiers(), rng: new SeededRandom(1), seed: 1, withPartner: true },
      { locationId: "park", date: { year: st.date.year, month: 5, day: 4 }, hour: 12 },
    );
    const partner = toPrototypeScene(composeScene(v, st.world!, st, { withPartner: true })).actors.find((a) => a.role === "partner")!;
    expect(partner.fated).toBe(true);
    expect(partner.gender).toBeDefined();
  });
});

describe("Regression: dead parents never speak", () => {
  it("after Mom and Dad pass away, no popup or text comes from them", () => {
    for (const seed of [91, 92, 93, 94]) {
      const g = createGame({ ...SETUP, seed });
      g.state.family!.mom.alive = false;
      g.state.family!.dad.alive = false;
      for (let d = 0; d < 15 && !g.isOver(); d++) {
        for (let i = 0; i < 400; i++) {
          const beats = g.advance(g.s.minute + 30);
          for (const b of beats) {
            if (b.kind === "toast") expect(["mom", "dad"]).not.toContain(b.role);
            if (b.kind === "popup") {
              expect(["mom", "dad"]).not.toContain(b.popup.who);
              expect(b.popup.line).not.toMatch(/\[아빠\]|엄마가|\[Dad\]/);
              g.choose(0);
            }
          }
          if (beats.some((b) => b.kind === "dayEnd")) break;
        }
        g.endDay();
        g.state.family!.mom.alive = false;
        g.state.family!.dad.alive = false;
      }
    }
  });
});

describe("Starting broke", () => {
  it("a student's debt comes as its own popup (학자금 대출 😢) early on, and money only then goes below zero", () => {
    const g = createGame({ name: "민아", gender: "F", likes: "M", birth: { year: 2004, month: 5, day: 1 }, mbti: "ENFP", job: "student", seed: 3, fated: { name: "Ren", status: "dating", since: { year: 2025, month: 3, day: 1 } } } as never);
    let loan: { title?: string; result?: string } | undefined;
    for (let d = 0; d < 3 && !loan; d++) {
      for (let i = 0; i < 400; i++) {
        const beats = g.advance(g.s.minute + 30);
        for (const b of beats) if (b.kind === "popup") {
          const before = g.state.money;
          const r = g.choose(0);
          if (b.popup.title === "학자금 대출") loan = { title: b.popup.title, result: r?.line };
          else expect(g.state.money < 0 && before >= 0).toBe(false);
        }
        if (beats.some((b) => b.kind === "dayEnd")) break;
      }
      g.endDay();
    }
    expect(loan?.result).toMatch(/^😢 \[학자금 대출\] 때문에 빚이 생겼다/);
    expect(g.state.money).toBeLessThan(0);
    expect(g.hud().money.startsWith("-₩")).toBe(true);
  });
});

describe("Distance is always explained", () => {
  it("living abroad, a funeral back home comes with the flight; a far partner's emergency sends you to them", () => {
    const lines: string[] = [];
    for (const [seed, setup] of [[7, { birth: { year: 1960, month: 9, day: 28 }, home: "New York", fated: { name: "Jung", gender: "M", birth: { year: 1998, month: 11, day: 14 }, city: "new york", status: "dating", since: { year: 2025, month: 1, day: 1 } } }], [7, { birth: { year: 1996, month: 9, day: 28 }, fated: { name: "Jung", gender: "M", birth: { year: 1998, month: 11, day: 14 }, from: "abroad", status: "dating", since: { year: 2025, month: 1, day: 1 } } }]] as const) {
      const g = createGame({ name: "Jae", gender: "F", likes: "M", mbti: "ENFP", seed, ...setup } as never);
      for (let d = 0; d < 30 && !g.isOver(); d++) {
        for (let i = 0; i < 400; i++) {
          const beats = g.advance(g.s.minute + 30);
          for (const b of beats) if (b.kind === "popup") (lines.push(b.popup.line), g.choose(0));
          if (beats.some((b) => b.kind === "dayEnd")) break;
        }
        g.endDay();
      }
    }
    expect(lines.some((l) => l.includes("영정") && l.includes("급히 비행기를 탔다"))).toBe(true);
    expect(lines.some((l) => l.includes("쓰러지셨어요") && /비행기를 탔다|기차에 올랐다/.test(l))).toBe(true);
    // Told once a day, never twice in one line.
    for (const l of lines) expect((l.match(/비행기를 탔다/g) ?? []).length).toBeLessThanOrEqual(1);
  }, 120000);
});

describe("Nationality", () => {
  const base = { name: "Jae", gender: "M" as const, likes: "F" as const, birth: { year: 1996, month: 9, day: 28 }, mbti: "ENFP", seed: 3 };
  it("decides home: an American in Seoul is abroad; a Korean in New York misses 한인마트, a Japanese one a Japanese grocery", async () => {
    const { homeVars } = await import("../src/story/nationality");
    const us = createGame({ ...base, nationality: "US", birthplace: "Seoul", home: "Seoul" } as never);
    expect(us.facts().abroad).toBe(true);
    expect(us.state.flags.militaryDone).toBe(true); // no 입영 통지서 for a non-Korean
    const kr = createGame({ ...base, home: "New York" } as never);
    expect(kr.facts().abroad).toBe(true);
    expect(homeVars(kr.state).homeMarket).toBe("한인마트");
    const jp = createGame({ ...base, nationality: "JP", birthplace: "Osaka", home: "New York" } as never);
    expect(homeVars(jp.state).homeMarket).toBe("일본 식료품점");
    expect(homeVars(jp.state).homeland_en).toBe("Japan");
  });
  it("the destined person's nationality names them (a Japanese partner gets a Japanese name)", () => {
    const g = createGame({ ...base, lang: "en", fated: { gender: "F", nationality: "JP", status: "dating", since: { year: 2025, month: 1, day: 1 } } } as never);
    const npc = Object.values(g.state.world!.npcs).find((n) => n.fated)!;
    expect(npc.profile?.nationality).toBe("JP");
  });
  it("lists nationalities, Korea first", async () => {
    const { nationalityOptions } = await import("../src/story/nationality");
    const o = nationalityOptions("ko");
    expect(o[0]).toEqual({ id: "KR", name: "한국" });
    expect(o.some((x) => x.id === "JP" && x.name === "일본")).toBe(true);
  });
});
