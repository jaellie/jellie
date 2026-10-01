import { describe, expect, it } from "vitest";
import { createGame, type Game } from "../src/game/game";
import { buildDestinyScript, resolveOutcome } from "../src/story/destinyScript";
import { calculateNatalChart } from "../src/saju/chart";
import { calculateAstrologyChart } from "../src/astrology/chart";
import { SeededRandom } from "../src/core/rng";
import { OpportunityEngine } from "../src/sim/opportunityEngine";
import type { MemoryCard } from "../src/story/cards";
import { compatibility } from "../src/destiny/compatibility";
import { startArc } from "../src/story/storyEngine";

const SETUP = { name: "민아", gender: "F" as const, likes: "M" as const, birth: { year: 1997, month: 9, day: 28, hour: 9, minute: 30 }, mbti: "ENFP", fated: { name: "Ren", from: "same" as const } };

function playWhole(seed: number, pick: (n: number, rng: SeededRandom) => number = () => 0) {
  const g = createGame({ ...SETUP, seed });
  const rng = new SeededRandom(seed);
  const days: Array<{ kind?: string; cards: string[]; momBefore: boolean; momAfter: boolean; popups: string[]; full: MemoryCard[] }> = [];
  let n = 0;
  while (!g.isOver() && n < 120) {
    const popups: string[] = [];
    const momBefore = g.state.family!.mom.alive;
    for (let i = 0; i < 400; i++) {
      const beats = g.advance(g.s.minute + 30);
      for (const b of beats) if (b.kind === "popup") (popups.push(`${b.popup.name ?? ""}|${b.popup.line}`), g.choose(pick(b.popup.ch.length, rng)));
      if (beats.some((b) => b.kind === "dayEnd")) break;
    }
    const kind = g.s.dayKind;
    const e = g.endDay();
    days.push({ kind, cards: e.cards.map((c) => c.kind), momBefore, momAfter: g.state.family!.mom.alive, popups, full: e.cards });
    n++;
  }
  return { g, days };
}

describe("Destiny script (사주 + 점성술 → 5–7 turning points)", () => {
  it("every birth gets 5–7 fated events with chart outcome weights; deterministic", () => {
    for (const b of [{ year: 1997, month: 9, day: 28, hour: 9, minute: 30, sex: "FEMALE" as const }, { year: 1988, month: 3, day: 3, sex: "MALE" as const }, { year: 2003, month: 12, day: 25, hour: 23, minute: 10, sex: "FEMALE" as const }]) {
      const a = buildDestinyScript(calculateNatalChart(b), calculateAstrologyChart(b), { birthYear: b.year, seed: 1 });
      const again = buildDestinyScript(calculateNatalChart(b), calculateAstrologyChart(b), { birthYear: b.year, seed: 1 });
      expect(a.length).toBeGreaterThanOrEqual(5);
      expect(a.length).toBeLessThanOrEqual(7);
      expect(a.map((e) => e.id)).toEqual(again.map((e) => e.id));
      for (const e of a) expect(Object.values(e.chartWeights).reduce((x, y) => x + y, 0)).toBeCloseTo(1);
      for (let i = 1; i < a.length; i++) expect(a[i].age - a[i - 1].age).toBeGreaterThanOrEqual(2);
      expect(a.map((e) => e.theme)).toEqual(expect.arrayContaining(["LOVE_MEETING", "CAREER_TURN"]));
    }
  });

  it("outcome = 70% chart + 30% choice", () => {
    const rng = new SeededRandom(1);
    let a = 0;
    for (let i = 0; i < 4000; i++) if (resolveOutcome({ A: 0.9, B: 0.1 }, { A: 0, B: 1 }, rng) === "A") a++;
    expect(a / 4000).toBeGreaterThan(0.58); // 0.7·0.9 = 0.63
    expect(a / 4000).toBeLessThan(0.68);
  });
});

describe("A life with a storyline", () => {
  const lives = [7, 8, 9].map((s) => playWhole(s));

  it("plays at most ~45 days and ends with the bond (or death), with a closing memorial", () => {
    for (const { g, days } of lives) {
      expect(g.isOver()).toBe(true);
      expect(days.length).toBeLessThanOrEqual(45);
      const m = g.memorial();
      expect(m.lines.length).toBeGreaterThanOrEqual(2);
      expect(m.epitaph).toContain("민아");
      expect(m.fadeMs).toBeGreaterThan(1000);
    }
  });

  it("marriage only happens on screen: proposal → 상견례 → wedding (each with its card)", () => {
    for (const { days } of lives) {
      const cards = days.flatMap((d) => d.cards);
      const w = cards.indexOf("WEDDING");
      if (w >= 0) {
        expect(cards.slice(0, w)).toContain("MEET_PARENTS");
        expect(cards.slice(0, w).some((c) => c === "PROPOSAL")).toBe(true);
        expect(cards[w + 1]).toBe("NEW_HOME");
      }
    }
  });

  it("a parent never dies silently between days — every loss comes with its funeral card", () => {
    for (const { days } of lives) {
      for (const d of days) if (d.momBefore && !d.momAfter) expect(d.cards).toContain("MOM_FUNERAL");
    }
  });

  it("friend weddings and funerals stay rare enough to matter (≤2 cards each per life)", () => {
    for (const seed of [7, 8, 9, 10, 11]) {
      const { days } = playWhole(seed, (n, rng) => rng.int(0, n - 1));
      const all = days.flatMap((d) => d.cards);
      expect(all.filter((k) => k === "FRIEND_WEDDING").length).toBeLessThanOrEqual(2);
      // +1: a fated illness may also take a friend (its own story card)
      expect(all.filter((k) => k === "FRIEND_FUNERAL").length).toBeLessThanOrEqual(3);
    }
  });

  it("a story scene is never voiced by someone who has died (dad can't call about mom after his own funeral)", () => {
    for (const seed of [7, 8, 9, 10, 11, 12]) {
      const { days } = playWhole(seed, (n, rng) => rng.int(0, n - 1));
      let dadGone = false, momGone = false;
      for (const d of days) {
        for (const line of d.popups) {
          if (dadGone) expect(line.startsWith("아빠|")).toBe(false);
          if (momGone) expect(line.startsWith("엄마|")).toBe(false);
          expect(line).not.toMatch(/\|\[(아빠|엄마)\]/); // the speaker tag became the name
        }
        if (d.cards.includes("DAD_FUNERAL")) dadGone = true;
        if (d.cards.includes("MOM_FUNERAL")) momGone = true;
      }
    }
  });

  it("once you run your own place, no boss offers you 명예퇴직", () => {
    for (const seed of [7, 8, 9, 10, 11, 12]) {
      const { days } = playWhole(seed, (n, rng) => rng.int(0, n - 1));
      let own = false;
      for (const d of days) {
        if (own) for (const line of d.popups) expect(line).not.toContain("명예퇴직 신청");
        if (d.cards.includes("INDEPENDENCE")) own = true;
        if (d.cards.includes("SHOP_CLOSE") || d.cards.includes("RETIREMENT")) own = false;
      }
    }
  });

  it("memory cards are clean: no leftover {placeholders} or (과) markers, plain roles, named friends", () => {
    for (const seed of [7, 8, 9, 10]) {
      const { days } = playWhole(seed, (n, rng) => rng.int(0, n - 1));
      for (const c of days.flatMap((d) => d.full)) {
        expect(c.caption).not.toMatch(/[{}]|\((과|와|이|가|은|는|을|를|으)\)/);
        expect(c.caption.trim().length).toBeGreaterThan(1);
        expect(c.scene.actors.length).toBeGreaterThan(0);
        for (const a of c.scene.actors) {
          expect(a.role).not.toMatch(/\d$/);
          if (a.role === "friend") expect(a.name).toBeTruthy();
        }
      }
    }
  });

  it("every popup names its speaker (never a raw role like \"me\")", () => {
    for (const seed of [7, 8]) {
      const g = createGame({ ...SETUP, seed });
      for (let d = 0; d < 60 && !g.isOver(); d++) {
        for (let i = 0; i < 400; i++) {
          const beats = g.advance(g.s.minute + 30);
          for (const b of beats) if (b.kind === "popup") { expect(b.popup.name, `${b.popup.source}:${b.popup.who}`).toBeTruthy(); g.choose(0); }
          if (beats.some((b) => b.kind === "dayEnd")) break;
        }
        g.endDay();
      }
    }
  });

  it("no names before introductions: the fated stranger is \"낯선 사람\" until you've met", () => {
    let checked = 0;
    for (const seed of [7, 8, 9]) {
      const g = createGame({ ...SETUP, fated: { ...SETUP.fated, status: "stranger" as const }, seed });
      const fated = Object.values(g.state.world!.npcs).find((n) => n.fated)!;
      for (let d = 0; d < 40 && !g.isOver() && !checked; d++) {
        for (let i = 0; i < 400; i++) {
          const beats = g.advance(g.s.minute + 30);
          for (const b of beats) {
            if (b.kind !== "popup") continue;
            const met = !!g.state.world!.relationships[fated.id] && !["STRANGER", "FAMILIAR_FACE"].includes(g.state.world!.relationships[fated.id].stage);
            if (b.popup.who === "fated" && !met) { expect(b.popup.name).toBe("낯선 사람"); checked++; }
            if (!met) for (const a of g.scene()?.actors ?? []) expect(a.name).not.toBe(fated.name);
            const r = g.choose(0);
            expect(r?.name).toBeTruthy();
          }
          if (beats.some((b) => b.kind === "dayEnd")) break;
        }
        g.endDay();
      }
    }
    expect(checked).toBeGreaterThan(0);
  });

  it("nobody works past retirement age unless self-employed", () => {
    for (const { g } of lives) {
      const st = g.state;
      if (st.age > 61 && st.career.employed) expect(["own-business", "second-career"]).toContain(st.career.field);
    }
  });

  it("dating never stalls for decades (it resolves: marry, break up, or live together)", () => {
    for (const seed of [11, 12, 13]) {
      const g = createGame({ ...SETUP, seed });
      let datingSince: number | undefined;
      let longest = 0;
      for (let d = 0; d < 60 && !g.isOver(); d++) {
        for (let i = 0; i < 400; i++) {
          const beats = g.advance(g.s.minute + 30);
          for (const b of beats) if (b.kind === "popup") g.choose(1); // indecisive player: "let me think"
          if (beats.some((b) => b.kind === "dayEnd")) break;
        }
        g.endDay();
        const st = g.state;
        if (st.relationship.status === "DATING" && !st.flags.longterm) datingSince ??= st.monthIndex;
        else datingSince = undefined;
        if (datingSince !== undefined) longest = Math.max(longest, st.monthIndex - datingSince);
      }
      expect(longest).toBeLessThan(12 * 8);
    }
  });
});

describe("Scenes follow choices; the world moves", () => {
  it("choosing a business trip takes you to the airport, hotel and branch office", () => {
    const g = createGame({ ...SETUP, seed: 1, fated: { ...SETUP.fated, status: "dating" as const } });
    const st = g.state;
    st.career = { ...st.career, employed: true, level: 2, cid: 1 };
    const opp = new OpportunityEngine().evaluate(st, [], new SeededRandom(1)).find((c) => c.template.id === "BUSINESS_TRIP")!.opportunity;
    g.advance(700);
    g.s.pending = { popup: { id: "t", source: "opportunity", who: "boss", line: "출장", ch: [{ t: "갑니다" }] }, opp, choiceIds: ["GO"] };
    g.choose(0);
    const seen = new Set<string>();
    for (let m = g.s.minute; m < 1200; m += 30) {
      for (const b of g.advance(m)) {
        if (b.kind === "enter") seen.add(b.locationId);
        if (b.kind === "popup") g.choose(0);
      }
    }
    expect([...seen]).toEqual(expect.arrayContaining(["airport", "business_hotel"]));
  });

  it("wander() moves NPCs, not only the player", () => {
    const g: Game = createGame({ ...SETUP, seed: 22 });
    for (let m = 430; m < 1300; m += 30) for (const b of g.advance(m)) if (b.kind === "popup") g.choose(0);
    const before = JSON.stringify(g.scene()!.actors.map((a) => a.spot));
    let moved = false;
    for (let i = 0; i < 5 && !moved; i++) moved = JSON.stringify(g.wander()!.actors.map((a) => a.spot)) !== before;
    expect(moved).toBe(true);
  });

  it("kids and pets live in the home scene", () => {
    const g = createGame({ ...SETUP, seed: 23 });
    g.state.pets = [{ id: "pet1", name: "콩이", species: "DOG", adoptedYear: 2020, ageAtAdoption: 1, alive: true, spriteSeed: 5 }];
    g.state.kids = [{ id: "kid1", name: "하늘", sex: "FEMALE", bornYear: 2020, bornMonth: 3, spriteSeed: 6 }];
    g.advance(430);
    const roles = g.scene()!.actors.map((a) => a.role);
    expect(roles).toEqual(expect.arrayContaining(["me", "kid", "pet"]));
  });

  it("the newlywed home background appears after marriage", async () => {
    const { backgroundEngine } = await import("../src/world/backgroundEngine");
    expect(backgroundEngine.getBackground({ location: "home", timeOfDay: "DAY", facts: { married: true } }).background.id).toBe("home_newlywed");
    expect(backgroundEngine.getBackground({ location: "home", timeOfDay: "DAY", facts: { married: false } }).background.id).not.toBe("home_newlywed");
  });
});

/** Play until `stop(g)` is true or the life ends; `pick` answers every popup. */
function playUntil(g: Game, stop: (g: Game) => boolean, pick: (p: { source: string; line: string; ch: Array<{ t: string }> }) => number = () => 0, maxDays = 60) {
  const popups: Array<{ source: string; who: string; name?: string; line: string; title?: string; big?: boolean; day: number }> = [];
  const toasts: Array<{ from: string; text: string; day: number }> = [];
  const logs: Array<{ text: string; day: number; minute: number }> = [];
  const cards: MemoryCard[] = [];
  for (let d = 0; d < maxDays && !g.isOver() && !stop(g); d++) {
    for (let i = 0; i < 400; i++) {
      const beats = g.advance(g.s.minute + 30);
      for (const b of beats) {
        if (b.kind === "toast") toasts.push({ from: b.from, text: b.text, day: g.s.dayIndex });
        if (b.kind === "log") logs.push({ text: b.text, day: g.s.dayIndex, minute: g.s.minute });
        if (b.kind === "popup") {
          popups.push({ source: b.popup.source, who: b.popup.who, name: b.popup.name, line: b.popup.line, title: b.popup.title, big: b.popup.big, day: g.s.dayIndex });
          g.choose(pick(b.popup));
        }
      }
      if (beats.some((b) => b.kind === "dayEnd") || stop(g)) break;
    }
    if (!g.isOver()) cards.push(...g.endDay().cards);
  }
  return { popups, toasts, logs, cards };
}

describe("The destined person: a crush, not an automatic couple", () => {
  it("named in setup → someone you already know (name known), but NOT your partner at the start", () => {
    for (const seed of [1, 2, 3]) {
      const g = createGame({ ...SETUP, seed });
      const fated = Object.values(g.state.world!.npcs).find((n) => n.fated)!;
      expect(g.state.relationship.status).toBe("SINGLE");
      expect(g.facts().fatedKnown).toBe(true);
      expect(g.facts().fatedAvailable).toBe(true);
      expect(g.facts().fatedName).toBe("Ren");
      expect(fated.name).toBe("Ren");
    }
  });

  it("status 'dating' → already a couple at the start, and the arc skips the first date", () => {
    const g = createGame({ ...SETUP, fated: { ...SETUP.fated, status: "dating" as const }, seed: 4 });
    expect(g.state.relationship.status).toBe("DATING");
    expect(g.facts().fatedPartner).toBe(true);
    const { popups } = playUntil(g, (x) => x.state.relationship.status !== "DATING" || !!x.state.story!.arcs.find((a) => a.type === "DATING" && a.step > 0), () => 0, 12);
    expect(popups.some((p) => p.title === "첫 데이트")).toBe(false);
  });

  it("the confession scene names the crush, and 궁합 decides how often it works", () => {
    // Find a very compatible and a very incompatible birth date for the crush.
    const me = { birth: { ...SETUP.birth, sex: "FEMALE" as const }, mbti: SETUP.mbti };
    const rng = new SeededRandom(3);
    const cands = Array.from({ length: 160 }, () => ({ year: rng.int(1994, 2000), month: rng.int(1, 12), day: rng.int(1, 28) }));
    const scored = cands.map((b) => ({ b, c: compatibility(me, { birth: { ...b, sex: "MALE" }, mbti: "INFJ" }).score })).sort((x, y) => y.c - x.c);
    const hi = scored[0], lo = scored[scored.length - 1];
    expect(hi.c - lo.c).toBeGreaterThan(0.3);
    const yes = { hi: 0, lo: 0 };
    let named = 0;
    for (const [key, who] of [["hi", hi], ["lo", lo]] as const) {
      for (let seed = 1; seed <= 16; seed++) {
        const g = createGame({ ...SETUP, fated: { ...SETUP.fated, gender: "M" as const, mbti: "INFJ", birth: who.b }, seed });
        // A named crush starts in 썸: the texts, the not-a-date, the jealousy — then the confession.
        const { popups } = playUntil(g, (x) => !x.state.story!.arcs.some((a) => a.type === "TALKING"), () => 0, 30);
        const confess = popups.find((p) => p.line.includes("말해야 할 것 같다") || p.line.includes("탑승 안내"));
        if (!confess) continue;
        if (confess.line.includes("Ren")) named++;
        if (g.state.relationship.status === "DATING" && g.facts().fatedPartner) yes[key]++;
      }
    }
    expect(named).toBeGreaterThan(10);
    expect(yes.hi).toBeGreaterThan(yes.lo);
  });
});

describe("Family from setup", () => {
  const FAMILY = { mom: { alive: false }, siblings: [{ rel: "오빠", name: "민수" }, { rel: "여동생" }], grandparents: 2 };

  it("a mom who passed before the game never texts or calls; siblings do, by the right title", () => {
    const g = createGame({ ...SETUP, family: FAMILY, seed: 5 });
    expect(g.facts().momAlive).toBe(false);
    expect(g.state.family!.siblings!.map((x) => x.rel)).toEqual(["OLDER_BROTHER", "YOUNGER_SISTER"]);
    expect(g.state.family!.grandparents!.length).toBe(2);
    const { popups, toasts } = playUntil(g, () => false, () => 0, 40);
    expect(toasts.some((t) => t.from === "엄마")).toBe(false);
    expect(popups.some((p) => p.who === "mom")).toBe(false);
    expect(popups.every((p) => p.name !== "엄마")).toBe(true);
    // An older brother texts as "오빠".
    expect(toasts.filter((t) => t.from === "오빠" || t.from === "민수").every((t) => t.from === "오빠")).toBe(true);
  });

  it("funeral captions: 친구 {name}의 장례식, and relatives by their relation (never '가족의 장례식')", () => {
    const all: MemoryCard[] = [];
    for (const seed of [5, 6, 7, 8]) all.push(...playUntil(createGame({ ...SETUP, family: FAMILY, seed }), () => false, (p) => p.ch.length - 1, 60).cards);
    for (const c of all.filter((c) => c.kind === "FRIEND_FUNERAL")) expect(c.caption).toMatch(/^친구 .+의 장례식$/);
    for (const c of all.filter((c) => c.kind === "RELATIVE_FUNERAL" || c.kind === "FAMILY_FUNERAL")) {
      expect(c.caption).not.toBe("가족의 장례식");
      expect(c.caption).toMatch(/^(외할머니|외할아버지|할머니|할아버지|이모|이모부|외삼촌|고모|고모부|큰아버지|작은아버지|오빠 민수|여동생 .+)의 장례식$/);
    }
    expect(all.some((c) => c.kind === "RELATIVE_FUNERAL")).toBe(true);
  });
});

describe("Hard moments are days of their own", () => {
  it("losing a partner: the call → the funeral; they never text in between; widowed after", () => {
    const g = createGame({ ...SETUP, fated: { ...SETUP.fated, status: "dating" as const }, seed: 9 });
    startArc(g.state, "PARTNER_PASSING", new SeededRandom(1), { partnerId: g.state.relationship.partnerId!, cause: "accident" });
    const { popups, toasts, cards } = playUntil(g, (x) => !x.state.story!.arcs.some((a) => a.type === "PARTNER_PASSING"), () => 0, 6);
    const call = popups.findIndex((p) => p.title === "병원에서 온 전화");
    const bye = popups.findIndex((p) => p.title === "이별");
    expect(call).toBeGreaterThanOrEqual(0);
    expect(bye).toBeGreaterThan(call);
    expect(popups[call].line).toContain("사고");
    expect(popups[call].big).toBe(true);
    expect(toasts.filter((t) => t.day >= popups[call].day && t.day <= popups[bye].day).some((t) => t.from === "Ren")).toBe(false);
    // Grave days are quiet: no casual texts at all on the call day or the funeral day.
    expect(toasts.filter((t) => t.day === popups[call].day || t.day === popups[bye].day)).toEqual([]);
    expect(g.state.relationship.status).toBe("SINGLE");
    expect(g.state.flags.widowed).toBe(true);
    const after = playUntil(g, () => false, () => 0, 6);
    expect(after.toasts.some((t) => t.from === "Ren")).toBe(false);
    expect([...cards, ...after.cards].some((c) => c.kind === "PARTNER_FUNERAL" && c.caption.includes("Ren"))).toBe(true);
  });

  it("pregnancy: a checkup day comes before the birth; a loss ends it gently with its own card", () => {
    let losses = 0, births = 0;
    for (let seed = 1; seed <= 24; seed++) {
      const g = createGame({ ...SETUP, fated: { ...SETUP.fated, status: "dating" as const }, seed });
      startArc(g.state, "PREGNANCY", new SeededRandom(seed));
      const { popups, cards } = playUntil(g, (x) => !x.state.story!.arcs.some((a) => a.type === "PREGNANCY"), () => 0, 8);
      const check = popups.findIndex((p) => p.title === "정기 검진");
      expect(check).toBeGreaterThanOrEqual(0);
      if (cards.some((c) => c.kind === "PREGNANCY_LOSS")) {
        losses++;
        expect(popups.some((p) => p.title === "출산")).toBe(false);
      }
      if (popups.some((p) => p.title === "출산")) births++;
    }
    expect(births).toBeGreaterThan(losses);
  });
});

describe("Two lighter moments in one season share a day", () => {
  it("a retirement farewell due near a fated turning point → both happen on the same day", () => {
    const g = createGame({ ...SETUP, seed: 3 });
    const st = g.state;
    st.career = { ...st.career, employed: true, field: "office", level: 3 };
    const ev = st.story!.script.find((e) => e.theme === "CAREER_TURN" || e.theme === "MOVE" || e.theme === "WEALTH")!;
    ev.monthIndex = st.monthIndex + 2;
    const arc = startArc(st, "RETIREMENT", new SeededRandom(1))!;
    arc.steps[0].dueMonth = st.monthIndex + 1;
    for (const e of st.story!.script) if (e !== ev && e.monthIndex < st.monthIndex + 12) e.monthIndex += 24;
    const { popups } = playUntil(g, (x) => !x.state.story!.arcs.includes(arc) && !!ev.done, () => 0, 3);
    const story = popups.filter((p) => p.big);
    expect(story.length).toBeGreaterThanOrEqual(2);
    expect(story[0].day).toBe(story[1].day);
  });
});

describe("A story moment is the day's event", () => {
  it("at your own wedding nobody 'catches the bouquet' and no stranger strikes up a chat", () => {
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      const g = createGame({ ...SETUP, fated: { ...SETUP.fated, status: "dating" as const }, seed });
      g.state.engaged = true;
      const arc = startArc(g.state, "ENGAGEMENT", new SeededRandom(seed))!;
      arc.step = 1; // the wedding
      arc.steps[1].dueMonth = g.state.monthIndex + 1;
      const { popups, logs } = playUntil(g, (x) => !x.state.story!.arcs.includes(arc), () => 0, 4);
      const wed = popups.find((p) => p.title === "결혼식");
      expect(wed).toBeDefined();
      const sameDay = logs.filter((l) => l.day === wed!.day && l.minute >= 600 && l.minute < 1080).map((l) => l.text);
      expect(sameDay.join(" ")).not.toMatch(/부케|처음으로 제대로 이야기|다시 만나다니/);
    }
  });
});

describe("A parent's passing plays as one sequence (no time skip in between)", () => {
  it("the last night → the funeral → the empty days, the same played day", () => {
    const g = createGame({ ...SETUP, seed: 4, fated: { ...SETUP.fated, status: "dating" as const } });
    const st = g.state;
    st.story!.arcs = st.story!.arcs.filter((a) => a.type !== "DATING");
    const arc = startArc(st, "PARENT_PASSING", new SeededRandom(1), { who: "dad" })!;
    arc.steps[0].dueMonth = st.monthIndex + 1;
    const titles: Array<[number, string]> = [];
    for (let d = 0; d < 4 && titles.length < 3; d++) {
      g.endDay();
      for (let i = 0; i < 400; i++) {
        const bs = g.advance(g.s.minute + 30);
        for (const b of bs) if (b.kind === "popup") { if (["마지막 밤", "부고", "빈자리"].includes(b.popup.title ?? "")) titles.push([g.s.dayIndex, b.popup.title!]); g.choose(0); }
        if (bs.some((b) => b.kind === "dayEnd")) break;
      }
    }
    expect(titles.map((t) => t[1])).toEqual(["마지막 밤", "부고", "빈자리"]);
    expect(new Set(titles.map((t) => t[0])).size).toBe(1);
    expect(st.family!.dad.alive).toBe(false);
  });
});
