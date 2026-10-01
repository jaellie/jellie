import { describe, expect, it } from "vitest";
import "../src/story/eventLibrary";
import { EVENT_FILES } from "../src/story/eventLibrary";
import { allLifeEvents, lifeEvent } from "../src/story/lifeEvents";
import { lintLifeEvents } from "../src/game/lint";
import { SPEAKER_NAME } from "../src/game/text";
import { LOCATIONS } from "../src/world/catalog";
import { LIFE_MODIFIER_KEYS } from "../src/core/lifeModifiers";
import arcData from "../data/story/arcs.json";
import cardData from "../data/story/cards.json";

const EFFECTS = new Set([
  // story effects
  "startDatingFated", "beginTalkingFated", "startDatingNew", "startDatingEx", "startDatingFriend", "sparkFated", "fatedTaken", "engage", "marry", "separate", "breakUp", "arc", "endArc",
  "parentDies", "adoptPet", "petDies", "petLost", "petFound", "retire", "addKid", "addKids", "adoptKid", "illness", "loseMoneyTo", "siblingMarries", "clearFlag",
  "loseFriend", "newFriend", "addSibling", "queueEvent", "partnerCritical", "partnerDies", "relativeDies", "dropOut",
  // consequences
  "money", "debt", "enroll", "moveAbroad", "moveHome", "moveCity", "job", "careerLevel", "quitJob", "social", "familyObligation", "familySupport", "setFlag", "gamble", "memory", "startHabit", "trip",
  // runtime
  "familyReact",
]);
const DYNAMIC_SPEAKERS = new Set(["me", "mom", "dad", "partner", "friend", "crush", "sibling", "kid", "ex", "fated", "boss", "coworker", "stranger", "doctor", "nurse", "relative", "inlaw", "judge", "recruiter", "app", "professor", "mentor", "barista", "instructor", "work"]);
const FACTS = new Set([
  "age", "employed", "selfEmployed", "student", "jobless", "retired", "careerCid", "recentlyPromoted", "recentlyLostJob", "partnered", "dating", "married", "single", "divorced",
  "recentlyBrokeUp", "hasEx", "momAlive", "dadAlive", "hasSibling", "fatedKnown", "fatedSingle", "fatedPartner", "fatedAvailable", "partnerCritical", "hasFriend", "abroad",
  "traveling", "weekend", "broke", "comfortable", "hasHabit", "alive", "male", "female", "partnerYears", "hasKid", "kidAge", "hasSister", "hasBrother", "parentsTogether",
  "hasPet", "homeOwner", "famous", "money", "debt", "inDebt", "rich", "engaged", "pregnant", "partnerAgeGap", "mbtiE", "mbtiN", "mbtiF", "mbtiP",
  "likesSameSex", "likesBoth", "partnerSameSex", "siblingMarried", "hasCrushFriend", "fatedJobNight", "fatedJobAway", "fatedJobUnstable", "fatedJobCare", "fatedJobRich", "fatedFar", "fatedAbroad",
]);
const TRAITS = new Set(["riskTolerance", "novelty", "sociability", "ambition", "socialEnergy", "socialInitiation", "noveltySeeking", "emotionalExpression", "conflictAvoidance", "planning", "independence", "relationshipPacing", "creativity", "careerDrive", "spontaneity"]);
const P = "(SUN|MOON|MERCURY|VENUS|MARS|JUPITER|SATURN|URANUS|NEPTUNE|PLUTO|ASC|MC)";
const SIGNALS = [
  /^(DOHWA|YEOKMA|HWAGAE|CHEONEUL_GWIIN|favorable|unfavorable|daeunShift|SAMJAE)$/,
  /^(STEM_COMBINATION|STEM_CLASH|SIX_HARMONY|THREE_HARMONY|HALF_HARMONY|BRANCH_CLASH|HARM|PUNISHMENT)@(day|month|year|hour)$/,
  /^group:(BI_GYEON|GYEOB_JAE|SIK_SHIN|SANG_GWAN|PYEON_JAE|JEONG_JAE|PYEON_GWAN|JEONG_GWAN|PYEON_IN|JEONG_IN)$/,
  /^(JUPITER|SATURN|URANUS)@H([1-9]|1[0-2])$/,
  /^(JUPITER|SATURN|URANUS)_RETURN$/,
  /^(JUPITER|SATURN|URANUS)>(SUN|MOON|VENUS|MARS|ASC|MC):(harmonious|hard|conjunction)$/,
  new RegExp(`^(T|P|SR):${P}>${P}:(harmonious|hard|conjunction)$`),
  /^(P:MOON|SR:SUN|SR:MOON|SR:ASC)@H([1-9]|1[0-2])$/,
  new RegExp(`^SR:angular:${P}$`),
  /^P:(SUN|MOON)_INGRESS$/,
];
const PLACEHOLDERS = new Set(["partner", "friend", "crush", "buddy", "fated", "fatedName", "fatedJob", "fatedJob_en", "fatedCity", "fatedCity_en", "fatedTime", "tzdiff", "pet", "relative", "kid", "sibling", "sister", "brother", "ex", "who", "subject", "me", "patient", "city"]);
const ROLES = new Set(["me", "partner", "friend", "relative", "guest", "coworker", "baby", "kid", "pet", "patient", "inlaw", "stranger", "npc"]);
const reqFact = (r: string) => {
  const m = /^!?([a-zA-Z_]+)/.exec(r)!;
  return m[1];
};

describe("Life-event library: every event is well-formed", () => {
  const events = allLifeEvents();
  const chainTargets = new Set<string>([
    ...events.flatMap((e) => Object.values(e.outcomes).flatMap((o) => (o.chain ?? []).flatMap((c) => [c.to, ...(c.oneOf ?? []).map((x) => x.to)]).filter((x): x is string => !!x))),
    ...JSON.stringify(arcData).match(/"to":\\s*"[A-Z_]+"/g)?.map((x) => x.split('"')[3]) ?? [],
    "COMING_AROUND",
  ]);

  it("ids are unique across files; every file loads", () => {
    const all = Object.values(EVENT_FILES).flatMap((f) => f.events.map((e) => e.id));
    expect(new Set(all).size).toBe(all.length);
    expect(events.length).toBe(all.length);
  });

  for (const e of events) {
    it(`${e.id}`, () => {
      expect(["common", "uncommon", "rare", "legendary"]).toContain(e.rarity);
      expect(DYNAMIC_SPEAKERS.has(e.who) || e.who in SPEAKER_NAME, `speaker ${e.who}`).toBe(true);
      expect(e.line.ko.length * e.line.en.length).toBeGreaterThan(0);
      if (e.big) expect(e.title?.ko, "big events need a title").toBeTruthy();
      if (e.location) {
        const loc = LOCATIONS.find((l) => l.id === e.location);
        expect(loc, `location ${e.location}`).toBeDefined();
        if (e.activity) expect(loc!.activities, `activity ${e.activity}`).toContain(e.activity);
      }
      for (const r of e.requires ?? []) {
        const f = reqFact(r);
        expect(FACTS.has(f) || f.startsWith("f_"), `fact ${r}`).toBe(true);
      }
      for (const k of Object.keys(e.trigger?.signals ?? {})) expect(SIGNALS.some((re) => re.test(k)), `signal ${k}`).toBe(true);
      for (const k of Object.keys(e.trigger?.mods ?? {})) expect(LIFE_MODIFIER_KEYS as readonly string[], `mod ${k}`).toContain(k);
      for (const k of Object.keys(e.trigger?.traits ?? {})) expect(TRAITS.has(k), `trait ${k}`).toBe(true);
      for (const k of Object.keys(e.trigger?.facts ?? {})) expect(FACTS.has(k) || k.startsWith("f_"), `trigger fact ${k}`).toBe(true);
      expect(e.choices.length).toBeGreaterThan(0);
      const reachable = new Set<string>();
      for (const c of e.choices) {
        expect(c.t.ko && c.t.en).toBeTruthy();
        for (const [k, w] of Object.entries(c.w)) {
          expect(e.outcomes[k], `choice → ${k}`).toBeDefined();
          if (w > 0) reachable.add(k);
        }
      }
      for (const [k, o] of Object.entries(e.outcomes)) {
        expect(reachable.has(k), `outcome ${k} is reachable`).toBe(true);
        expect(o.r.ko && o.r.en).toBeTruthy();
        for (const fx of o.effects ?? []) expect(EFFECTS.has(fx.kind), `effect ${fx.kind}`).toBe(true);
        for (const c of o.chain ?? []) {
          expect(!!c.to !== !!c.oneOf?.length, "a chain has either `to` or `oneOf`").toBe(true);
          for (const t of [c.to, ...(c.oneOf ?? []).map((x) => x.to)].filter((x): x is string => !!x)) expect(lifeEvent(t), `chain → ${t}`).toBeDefined();
          for (const l of [c.lean, ...(c.oneOf ?? []).map((x) => x.lean)]) {
            for (const t of Object.keys(l?.traits ?? {})) expect(TRAITS.has(t), `chain lean trait ${t}`).toBe(true);
            for (const k of Object.keys(l?.mods ?? {})) expect(LIFE_MODIFIER_KEYS as readonly string[], `chain lean mod ${k}`).toContain(k);
            for (const k of Object.keys(l?.facts ?? {})) expect(FACTS.has(k) || k.startsWith("f_"), `chain lean fact ${k}`).toBe(true);
            for (const k of Object.keys(l?.signals ?? {})) expect(SIGNALS.some((re) => re.test(k)), `chain lean signal ${k}`).toBe(true);
          }
        }
        for (const k of Object.keys(o.lean?.mods ?? {})) expect(LIFE_MODIFIER_KEYS as readonly string[], `lean mod ${k}`).toContain(k);
        for (const k of Object.keys(o.lean?.facts ?? {})) expect(FACTS.has(k) || k.startsWith("f_"), `lean fact ${k}`).toBe(true);
        for (const k of Object.keys(o.lean?.signals ?? {})) expect(SIGNALS.some((re) => re.test(k)), `lean signal ${k}`).toBe(true);
        for (const t of Object.keys(o.lean?.traits ?? {})) expect(TRAITS.has(t), `lean trait ${t}`).toBe(true);
        if (typeof o.card === "string") expect((cardData.cards as Record<string, unknown>)[o.card], `card ${o.card}`).toBeDefined();
        else if (o.card) {
          expect(LOCATIONS.some((l) => l.id === (o.card as { location: string }).location), `card location`).toBe(true);
          for (const a of o.card.actors ?? []) expect(ROLES.has(a), `card actor ${a}`).toBe(true);
        }
      }
      const texts = [e.line, ...e.choices.map((c) => c.t), ...Object.values(e.outcomes).map((o) => o.r)].flatMap((b) => [b.ko, b.en]);
      for (const t of texts) for (const m of t.matchAll(/\{(\w+)\}/g)) expect(PLACEHOLDERS.has(m[1]), `placeholder {${m[1]}}`).toBe(true);
      // Chain-only: reached from a chain, a hook, or queued by the engine itself (a friend's wedding invitation).
      if (e.chainOnly) expect(chainTargets.has(e.id) || !!e.hooks?.length || (e as { queuedBy?: string }).queuedBy === "engine", "chain-only events must be reachable from a chain or a hook").toBe(true);
      for (const h of e.hooks ?? []) expect(["parentDies", "grandparentDies", "siblingDies", "partnerDies"]).toContain(h.on);
    });
  }

  it("no popup text contradicts its own requirements (keyword guard)", () => {
    expect(lintLifeEvents(allLifeEvents())).toEqual([]);
  });
});
