import { describe, expect, it } from "vitest";
import { createGame, type Game } from "../src/game/game";
import { buildDestinyScript, resolveOutcome } from "../src/story/destinyScript";
import { calculateNatalChart } from "../src/saju/chart";
import { calculateAstrologyChart } from "../src/astrology/chart";
import { SeededRandom } from "../src/core/rng";
import { OpportunityEngine } from "../src/sim/opportunityEngine";
import type { MemoryCard } from "../src/story/cards";

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
      for (const b of beats) if (b.kind === "popup") (popups.push(b.popup.line), g.choose(pick(b.popup.ch.length, rng)));
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

  it("plays about 15–40 days and ends only in death, with a memorial", () => {
    for (const { g, days } of lives) {
      expect(g.isOver()).toBe(true);
      expect(days.length).toBeGreaterThanOrEqual(12);
      expect(days.length).toBeLessThanOrEqual(45);
      const m = g.memorial();
      expect(m.lines.length).toBe(3);
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
          if (dadGone) expect(line.startsWith("[아빠]")).toBe(false);
          if (momGone) expect(line.startsWith("[엄마]")).toBe(false);
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
      const g = createGame({ ...SETUP, seed });
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
    const g = createGame({ ...SETUP, seed: 21 });
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
