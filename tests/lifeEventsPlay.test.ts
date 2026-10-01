import { describe, expect, it } from "vitest";
import { createGame, type Game } from "../src/game/game";
import { SeededRandom } from "../src/core/rng";
import { LIFE_MODIFIER_KEYS, type LifeModifiers } from "../src/core/lifeModifiers";
import { eventState, fireHooks, lifeEvent, outcomeWeights, pickChain, queueChain } from "../src/story/lifeEvents";
import { partnerCompat, resolveLifeEvent, resolveStaleEvents } from "../src/story/lifeEventRuntime";
import { scheduleNext } from "../src/story/storyEngine";

const SETUP = {
  name: "제이", gender: "F" as const, likes: "M" as const, birth: { year: 1997, month: 9, day: 28 }, mbti: "ENFP",
  family: { mom: { alive: true }, dad: { alive: true }, siblings: [{ rel: "오빠", name: "민수" }, { rel: "여동생", name: "지아" }], grandparents: 2 },
  fated: { name: "Ren", from: "same" as const },
};
const ZERO = Object.fromEntries(LIFE_MODIFIER_KEYS.map((k) => [k, 0])) as LifeModifiers;
const BAD = /\{\w+\}|undefined|NaN|\(과\)|이\(가\)|은\(는\)|을\(를\)|\[object/;
const ctxOf = (g: Game, seed: number) => ({ state: g.state, seed, rng: new SeededRandom(seed), mods: ZERO, facts: g.facts() });

function play(seed: number, maxDays = 150) {
  const g = createGame({ ...SETUP, seed });
  const rng = new SeededRandom(seed);
  const shown: string[] = [];
  const texts: string[] = [];
  let days = 0;
  while (!g.isOver() && days < maxDays) {
    for (let i = 0; i < 400; i++) {
      const beats = g.advance(g.s.minute + 30);
      for (const b of beats) {
        if (b.kind !== "popup") continue;
        const p = b.popup;
        texts.push(p.line, p.name ?? "", p.title ?? "", ...p.ch.map((c) => c.t));
        if (p.source === "event") {
          const pend = g.state.story?.events?.pending.find((x) => x.uid === g.s.pending?.eventUid);
          if (pend) shown.push(pend.id);
        }
        const r = g.choose(rng.int(0, p.ch.length - 1));
        if (r) texts.push(r.line);
      }
      if (beats.some((b) => b.kind === "dayEnd")) break;
    }
    const e = g.endDay();
    texts.push(...e.lines, ...e.cards.map((c) => c.caption));
    days++;
  }
  return { g, shown, texts, days };
}

describe("Life events in a played life", () => {
  const lives = [11, 12, 13].map((s) => play(s));

  it("a life shows several life events on screen (and more happen between days); days stay reasonable", () => {
    // The game spans the bond with the destined person, so a life can be short (a breakup) or long.
    expect(lives.reduce((a, l) => a + l.shown.length, 0)).toBeGreaterThanOrEqual(4);
    for (const { shown, days, g } of lives) {
      expect(g.isOver()).toBe(true);
      expect(days).toBeGreaterThanOrEqual(3);
      expect(days).toBeLessThanOrEqual(50);
      const hist = g.state.story!.events!.history;
      expect(Object.values(hist).reduce((a, h) => a + h.length, 0)).toBeGreaterThanOrEqual(shown.length);
    }
  });

  it("no popup, result, skip-screen line or card has an unfilled name, broken josa or 'undefined'", () => {
    for (const { texts } of lives) for (const t of texts) expect(t, t).not.toMatch(BAD);
  });

  it("is deterministic: the same seed plays the same events", () => {
    expect(play(11, 12).shown).toEqual(play(11, 12).shown);
  });
});

describe("Chains, reactions, hooks", () => {
  it("도박 → 사채 (urgent) snowballs: hooked gamblers get the loan shark at the door", () => {
    let hooked = 0;
    for (let seed = 1; seed <= 30 && hooked < 3; seed++) {
      const g = createGame({ ...SETUP, seed });
      const p = queueChain(g.state, "GAMBLING", [0, 0], new SeededRandom(seed))!;
      const res = resolveLifeEvent(p.uid, 0, ctxOf(g, seed))!;
      if (res.outcome !== "HOOKED") continue;
      hooked++;
      expect(g.state.flags.gambling).toBe(true);
      const shark = g.state.story!.events!.pending.find((x) => x.id === "LOAN_SHARK");
      if (shark) expect(shark.urgent).toBe(true);
    }
    expect(hooked).toBeGreaterThan(0);
  });

  it("borrowing to cover it leads on: marriage crisis (partnered) or bankruptcy", () => {
    let led = 0;
    for (let seed = 1; seed <= 12; seed++) {
      const g = createGame({ ...SETUP, fated: { ...SETUP.fated, status: "dating" as const }, seed });
      g.state.flags.gambling = true;
      const p = queueChain(g.state, "LOAN_SHARK", [0, 0], new SeededRandom(seed))!;
      const res = resolveLifeEvent(p.uid, 1, ctxOf(g, seed))!;
      expect(res.outcome).toBe("DEEPER");
      const next = g.state.story!.events!.pending.map((x) => x.id);
      if (next.includes("DEBT_MARRIAGE_CRISIS") || next.includes("BANKRUPTCY")) led++;
    }
    expect(led).toBeGreaterThanOrEqual(8);
  });

  it("coming out is a revelation: each family member reacts in their own way; some come around later", () => {
    const kinds = new Set<string>();
    let comingAround = 0;
    for (let seed = 1; seed <= 16; seed++) {
      const g = createGame({ ...SETUP, seed });
      const p = queueChain(g.state, "SIBLING_COMES_OUT", [0, 0], new SeededRandom(seed))!;
      const res = resolveLifeEvent(p.uid, 0, ctxOf(g, seed))!;
      if (res.outcome !== "TOGETHER") continue;
      // mom, dad and the other sibling each react (the one coming out doesn't).
      expect(res.extra.length).toBe(3);
      for (const x of res.extra) kinds.add(/고마워/.test(x.ko) ? "supportive" : /말이 없었다/.test(x.ko) ? "needsTime" : /자리를 떴다/.test(x.ko) ? "shocked" : "?");
      const later = g.state.story!.events!.pending.filter((x) => x.id === "COMING_AROUND");
      for (const l of later) {
        expect(l.vars?.who_ko).toBeTruthy();
        expect(l.vars?.subject_ko).toContain("오빠 민수");
        comingAround++;
      }
    }
    expect([...kinds].filter((k) => k !== "?").length).toBeGreaterThanOrEqual(2);
    expect(kinds.has("?")).toBe(false);
    expect(comingAround).toBeGreaterThan(0);
  });

  it("an event left waiting resolves off-screen, with its names, as a skip-screen line", () => {
    const g = createGame({ ...SETUP, seed: 5 });
    queueChain(g.state, "COMING_AROUND", [0, 0], new SeededRandom(1), { vars: { who_ko: "엄마", who_en: "Mom", whoKey: "mom", subject_ko: "오빠 민수", subject_en: "Minsu's", subjectKey: "x" } });
    g.state.monthIndex += 40;
    resolveStaleEvents(ctxOf(g, 5));
    const notes = eventState(g.state).notes;
    expect(notes.length).toBe(1);
    expect(notes[0].vars?.who_ko).toBe("엄마");
    const out = g.endDay();
    expect(out.lines.some((l) => l.includes("엄마") && !l.includes("{"))).toBe(true);
  });

  it("a parent's death can bring one follow-up (a letter, a feud over the will, a secret at the 기일…) — never a pile", () => {
    let any = 0;
    for (let seed = 1; seed <= 60; seed++) {
      const g = createGame({ ...SETUP, seed });
      const before = eventState(g.state).pending.length;
      const ev = fireHooks(g.state, "parentDies", new SeededRandom(seed), { who: "dad", vars: { who_ko: "아빠", who_en: "Dad" } });
      expect(eventState(g.state).pending.length - before).toBeLessThanOrEqual(1);
      if (ev) {
        any++;
        expect(lifeEvent(ev.id)?.hooks?.some((h) => h.on === "parentDies")).toBe(true);
        expect(ev.vars?.who_ko).toBe("아빠");
      }
    }
    expect(any).toBeGreaterThan(5);
    expect(any).toBeLessThan(55);
  });

  it("a big life event brings a played day within ~1.5 years instead of resolving unseen", () => {
    const g = createGame({ ...SETUP, seed: 8 });
    const st = g.state;
    st.story!.script = [];
    st.story!.arcs = [];
    const p = queueChain(st, "LOTTO_WIN", [0, 0], new SeededRandom(2))!;
    const next = scheduleNext(st, new SeededRandom(3));
    expect(next.month).toBeLessThanOrEqual(p.due + 18);
  });
});

describe("Not every life goes the same way (사람마다)", () => {
  const person = (over: { traits?: Record<string, number>; mods?: Partial<LifeModifiers>; facts?: Record<string, unknown>; signals?: Record<string, number>; compat?: number } = {}) => ({
    traits: { planning: 0.5, riskTolerance: 0.5, independence: 0.5, emotionalExpression: 0.5, spontaneity: 0.5, ...over.traits },
    mods: { ...ZERO, ...over.mods } as LifeModifiers,
    facts: { age: 35, f_gambling: true, ...over.facts } as never,
    signals: over.signals ?? {},
    compat: over.compat,
  });
  const hookedChain = () => lifeEvent("GAMBLING")!.outcomes.HOOKED.chain![0];
  const paths = (p: ReturnType<typeof person>, n = 400) => {
    const g = createGame({ ...SETUP, seed: 2 });
    const count: Record<string, number> = {};
    const rng = new SeededRandom(7);
    for (let i = 0; i < n; i++) {
      const next = pickChain(g.state, hookedChain(), p, rng);
      const k = next?.to ?? "none";
      count[k] = (count[k] ?? 0) + 1;
    }
    return count;
  };

  it("hooked gamblers take different roads: the loan shark, caught early, or quitting alone", () => {
    const married = paths(person({ facts: { partnered: true, married: true, momAlive: true, parentsTogether: true } }));
    expect(Object.keys(married).filter((k) => k !== "none").length).toBeGreaterThanOrEqual(3);
    // Only branches that fit the life: nobody without a partner is caught by one.
    const single = paths(person({ facts: { partnered: false, momAlive: false } }));
    expect(single.GAMBLING_CAUGHT_BY_PARTNER ?? 0).toBe(0);
    expect(single.GAMBLING_CAUGHT_BY_FAMILY ?? 0).toBe(0);
  });

  it("temperament and the chart bend the road: planners in a 귀인 year quit alone more; the broke and reckless meet the loan shark", () => {
    const planner = paths(person({ traits: { planning: 0.95, riskTolerance: 0.2 }, signals: { CHEONEUL_GWIIN: 1 } }));
    const reckless = paths(person({ traits: { planning: 0.05, riskTolerance: 0.95 }, facts: { broke: true, inDebt: true }, signals: { "group:GYEOB_JAE": 1, unfavorable: 1 } }));
    expect((planner.GAMBLING_SELF_STOP ?? 0) / 400).toBeGreaterThan((reckless.GAMBLING_SELF_STOP ?? 0) / 400 + 0.15);
    expect((reckless.LOAN_SHARK ?? 0) / 400).toBeGreaterThan((planner.LOAN_SHARK ?? 0) / 400 + 0.3);
  });

  it("the chart tilts every outcome: a good 재물운 year makes the moonshot likelier than the rug pull", () => {
    const def = lifeEvent("CRYPTO_MOON")!;
    const good = outcomeWeights(def, 1, person({ mods: { wealth: 1 } }));
    const bad = outcomeWeights(def, 1, person({ mods: { wealth: -1 } }));
    expect(good.RICH / good.RUG).toBeGreaterThan(2 * (bad.RICH / bad.RUG));
  });

  it("궁합 decides who stays: after the debt comes out, a good match stays more often", () => {
    const def = lifeEvent("DEBT_MARRIAGE_CRISIS")!;
    const good = outcomeWeights(def, 1, person({ compat: 0.9 }));
    const poor = outcomeWeights(def, 1, person({ compat: 0.1 }));
    expect(good.RECOVER / good.LEAVE).toBeGreaterThan(3 * (poor.RECOVER / poor.LEAVE));
  });

  it("any partner's 궁합 is known (not only the destined person's), computed once", () => {
    const g = createGame({ ...SETUP, fated: { ...SETUP.fated, status: "dating" as const, birth: { year: 1996, month: 5, day: 5 } }, seed: 4 });
    const c = partnerCompat(g.state);
    expect(c).toBeGreaterThan(0);
    expect(c).toBeLessThan(1);
  });
});
