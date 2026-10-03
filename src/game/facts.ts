/**
 * Life facts — the single source of truth every message/event is checked
 * against at the moment it would be shown. Content declares `requires`
 * (e.g. ["employed", "!partnered", "age>=30"]); the Director also runs a
 * keyword guard so content that forgets a requirement still can't contradict
 * the player's life.
 */
import type { LifeState, SiblingRel } from "../sim/types";
import { siblingWord } from "../story/family";
import { isAbroad } from "../sim/types";

export interface LifeFacts {
  [key: string]: boolean | number | string | undefined;
  age: number;
  employed: boolean;
  /** Runs their own place (no boss, no 명예퇴직 offers). */
  selfEmployed: boolean;
  /** Self-employed as a creator (YouTuber, streamer): no shop, no customers. */
  creator: boolean;
  student: boolean;
  jobless: boolean;
  retired: boolean;
  careerCid: number;
  /** Promoted in the job they still have, within the last 18 months. */
  recentlyPromoted: boolean;
  /** Lost/left a job within the last 12 months and still jobless. */
  recentlyLostJob: boolean;
  partnered: boolean;
  dating: boolean;
  married: boolean;
  single: boolean;
  divorced: boolean;
  recentlyBrokeUp: boolean;
  hasEx: boolean;
  partnerName?: string;
  momAlive: boolean;
  dadAlive: boolean;
  /** At least one living sibling (from setup). */
  hasSibling: boolean;
  /** The destined person from setup: already known (met, name known), single, your partner, free to fall for. */
  fatedKnown: boolean;
  /** You've actually met them on screen (or setup said you already know them). Off-screen acquaintance doesn't count. */
  fatedMet: boolean;
  /** The destined person shares your workplace (they'd be a coworker). */
  fatedCoworker: boolean;
  fatedSingle: boolean;
  fatedPartner: boolean;
  fatedAvailable: boolean;
  fatedName?: string;
  /** The partner is in a critical state (accident/collapse) — they can't text you. */
  partnerCritical: boolean;
  male: boolean;
  female: boolean;
  /** Years together with the current partner. */
  partnerYears: number;
  exName?: string;
  hasKid: boolean;
  /** Age of the oldest child (0 without kids). */
  kidAge: number;
  kidName?: string;
  hasSister: boolean;
  hasBrother: boolean;
  /** The first living sibling ({sibling}) is married. */
  siblingMarried: boolean;
  /** "오빠 민수" — the first living sibling / sister / brother, for texts. */
  siblingName?: string;
  sisterName?: string;
  brotherName?: string;
  parentsTogether: boolean;
  hasPet: boolean;
  homeOwner: boolean;
  famous: boolean;
  /** Money and debt in game units (₩1,000,000). */
  money: number;
  debt: number;
  inDebt: boolean;
  rich: boolean;
  /** Engaged (between the proposal and the wedding). */
  engaged: boolean;
  /** A pregnancy is under way (the PREGNANCY arc). */
  pregnant: boolean;
  /** Years between the player and the partner. */
  partnerAgeGap: number;
  /** Who the player is drawn to (setup "likes"): only their own sex / any sex. */
  likesSameSex: boolean;
  likesBoth: boolean;
  /** The current partner is the same sex as the player. */
  partnerSameSex: boolean;
  mbtiE: boolean;
  mbtiN: boolean;
  mbtiF: boolean;
  mbtiP: boolean;
  hasFriend: boolean;
  friendName?: string;
  /** Your partner is the destined person, and what their job is like (fatedProfile.ts). */
  fatedJobNight: boolean;
  fatedJobAway: boolean;
  fatedJobUnstable: boolean;
  fatedJobCare: boolean;
  fatedJobRich: boolean;
  /** Their "job" is a part-time gig (job seeker, student, between jobs). */
  fatedJobTemp: boolean;
  /** The destined person lives in another city / country (and you haven't moved together yet). */
  fatedFar: boolean;
  /** Together but living apart (long distance): no in-person dates or dinners until someone moves. */
  apart: boolean;
  fatedAbroad: boolean;
  /** The closest friend of the sex you're drawn to (friends-to-lovers moments). */
  hasCrushFriend: boolean;
  crushName?: string;
  crushId?: string;
  abroad: boolean;
  /** Korean nationality (입영, 수능, 제사…). */
  korean: boolean;
  /** Living in Korea right now (the 수능 is a Korean-school thing). */
  inKorea: boolean;
  traveling: boolean;
  weekend: boolean;
  broke: boolean;
  comfortable: boolean;
  hasHabit: boolean;
  habitPlace?: string;
  alive: boolean;
}

/** The most recent ex's name: the last partner, else any ex from before the story began. */
function exNameOf(s: LifeState): string | undefined {
  const last = s.flags.lastPartnerName as string | undefined;
  if (last && s.relationship.partnerId && s.npcs.find((n) => n.id === s.relationship.partnerId)?.name === last) {
    // lastPartnerName is the current partner, not an ex.
  } else if (last) return last;
  const npcEx = [...s.npcs].reverse().find((n) => n.role === "EX" && n.name);
  if (npcEx) return npcEx.name;
  const w = s.world;
  const rel = w ? Object.values(w.relationships).reverse().find((r) => r.stage === "EX" && w.npcs[r.npcId]?.name) : undefined;
  return rel ? w!.npcs[rel.npcId].name : undefined;
}

export function computeFacts(s: LifeState, opts: { weekend?: boolean } = {}): LifeFacts {
  const w = s.world;
  const rels = w ? Object.values(w.relationships) : [];
  const friends = rels.filter((r) => r.stage === "FRIEND" || r.stage === "CLOSE_FRIEND").sort((a, b) => b.closeness - a.closeness);
  const exes = rels.filter((r) => r.stage === "EX").length + s.npcs.filter((n) => n.role === "EX").length;
  const cid = s.career.cid ?? 0;
  const promoMonth = s.flags.promotionMonth as number | undefined;
  const lostMonth = s.flags.jobLostMonth as number | undefined;
  const brokeUpMonth = s.flags.breakupMonth as number | undefined;
  const partnered = s.relationship.status === "DATING" || s.relationship.status === "MARRIED";
  const partner = s.relationship.partnerId ? s.npcs.find((n) => n.id === s.relationship.partnerId) ?? (w?.npcs[s.relationship.partnerId] as { name: string } | undefined) : undefined;
  const habits = w ? Object.keys(w.habits) : [];
  const fated = w ? Object.values(w.npcs).find((n) => n.fated) : undefined;
  const fatedRel = fated ? w!.relationships[fated.id] : undefined;
  const fatedKnown = !!fatedRel && fatedRel.stage !== "STRANGER" && fatedRel.stage !== "FAMILIAR_FACE";
  const fatedPartner = partnered && !!fated && s.relationship.partnerId === fated.id;
  const fatedSingle = !!fated && fated.single && !fated.deceased;
  const sibs = (s.family?.siblings ?? []).filter((x) => x.alive);
  // Siblings are only ever called by what you call them (형, 누나, 오빠, 언니, 동생), never by a name.
  const label = (x: { rel: string }) => siblingWord(s, x.rel as SiblingRel).ko;
  const mbti = String(s.flags.mbti ?? "").toUpperCase();
  const pid = s.relationship.partnerId;
  const likes = String(s.flags.likes ?? "");
  const own = s.birth.sex === "MALE" ? "M" : "F";
  const partnerSex = pid ? (s.npcs.find((n) => n.id === pid)?.birth.sex ?? w?.npcs[pid]?.sex) : undefined;
  const partnerBirthYear = pid ? (s.npcs.find((n) => n.id === pid)?.birth.year ?? w?.npcs[pid]?.birthYear) : undefined;
  const life = s.story?.fatedLife;
  const job = life?.job;
  const crush = friends.find((r) => {
    const n = w!.npcs[r.npcId];
    if (!n || n.deceased || !n.name) return false;
    return likes === "A" || (likes === "M" ? n.sex === "MALE" : likes === "F" ? n.sex === "FEMALE" : n.sex !== s.birth.sex);
  });
  // Any flag set by an event can be required directly as "f_<name>" (e.g. "f_gambling", "!f_cult").
  const flagFacts: Record<string, boolean> = {};
  for (const [k, v] of Object.entries(s.flags)) if (v) flagFacts[`f_${k}`] = true;
  // The long-distance flag only counts while you really live apart.
  if (!s.relationship.longDistance) delete flagFacts.f_longDistance;
  return {
    ...flagFacts,
    age: Math.floor(s.age),
    alive: s.alive,
    employed: s.career.employed,
    selfEmployed: s.career.employed && ["own-business", "second-career"].includes(s.career.field ?? ""),
    creator: s.career.employed && s.career.field === "own-business" && !!s.flags.influencer,
    student: !!s.enrollment,
    jobless: !s.career.employed && !s.enrollment && s.age < 65 && !s.flags.retired,
    retired: !s.career.employed && (s.age >= 65 || !!s.flags.retired),
    careerCid: cid,
    recentlyPromoted: s.career.employed && s.flags.promotionCid === cid && promoMonth !== undefined && s.monthIndex - promoMonth <= 18,
    recentlyLostJob: !s.career.employed && lostMonth !== undefined && s.monthIndex - lostMonth <= 12,
    partnered,
    dating: s.relationship.status === "DATING",
    married: s.relationship.status === "MARRIED",
    single: !partnered,
    divorced: s.relationship.status === "DIVORCED",
    recentlyBrokeUp: !partnered && brokeUpMonth !== undefined && s.monthIndex - brokeUpMonth <= 12,
    // An ex you can name (an unnamed ex would leave "{ex}와" blank in a line).
    hasEx: exes > 0 && !!exNameOf(s),
    partnerName: partnered ? partner?.name : undefined,
    momAlive: s.family?.mom.alive ?? true,
    dadAlive: s.family?.dad.alive ?? true,
    hasSibling: (s.family?.siblings ?? []).some((x) => x.alive),
    fatedKnown,
    fatedMet: !!s.flags.fatedMet || fatedPartner,
    fatedCoworker: !!fated && s.career.employed && (fated.profile?.job === "office" || String(s.flags.fatedCoworker ?? "") === "1"),
    fatedSingle,
    fatedPartner,
    fatedAvailable: fatedKnown && fatedSingle && !fatedPartner && fatedRel?.stage !== "DECEASED",
    fatedName: fatedKnown ? fated!.name : undefined,
    partnerCritical: partnered && !!s.flags.partnerCritical,
    male: s.birth.sex === "MALE",
    female: s.birth.sex === "FEMALE",
    partnerYears: partnered ? Math.floor((s.monthIndex - (s.relationship.sinceMonth ?? s.monthIndex)) / 12) : 0,
    exName: exes > 0 ? exNameOf(s) : undefined,
    hasKid: (s.kids ?? []).length > 0,
    kidAge: (s.kids ?? []).length ? Math.max(...s.kids!.map((k) => s.date.year - k.bornYear)) : 0,
    kidName: s.kids?.[0]?.name,
    hasSister: sibs.some((x) => x.sex === "FEMALE"),
    hasBrother: sibs.some((x) => x.sex === "MALE"),
    siblingMarried: !!sibs[0]?.married,
    siblingName: sibs[0] ? label(sibs[0]) : undefined,
    sisterName: sibs.find((x) => x.sex === "FEMALE") ? label(sibs.find((x) => x.sex === "FEMALE")!) : undefined,
    brotherName: sibs.find((x) => x.sex === "MALE") ? label(sibs.find((x) => x.sex === "MALE")!) : undefined,
    parentsTogether: (s.family?.mom.alive ?? true) && (s.family?.dad.alive ?? true) && !s.flags.parentsDivorced,
    hasPet: (s.pets ?? []).some((p) => p.alive),
    homeOwner: !!s.flags.homeOwner,
    famous: !!s.flags.famous,
    money: Math.round(s.money),
    debt: Math.round(s.debt),
    inDebt: s.debt > 20 || s.money < -5,
    rich: s.money > 300,
    engaged: partnered && !!s.engaged,
    pregnant: !!s.story?.arcs.some((a) => a.type === "PREGNANCY"),
    partnerAgeGap: partnered && partnerBirthYear ? Math.abs(s.birth.year - partnerBirthYear) : 0,
    likesSameSex: likes === own,
    likesBoth: likes === "A",
    partnerSameSex: partnered && !!partnerSex && partnerSex === s.birth.sex,
    mbtiE: mbti[0] === "E",
    mbtiN: mbti[1] === "N",
    mbtiF: mbti[2] === "F",
    mbtiP: mbti[3] === "P",
    hasFriend: friends.length > 0,
    friendName: friends[0] ? w!.npcs[friends[0].npcId]?.name : undefined,
    fatedJobNight: fatedPartner && (job?.shift === "night" || job?.shift === "irregular"),
    fatedJobAway: fatedPartner && !!job?.away,
    fatedJobUnstable: fatedPartner && !!job?.unstable,
    fatedJobCare: fatedPartner && !!job?.care,
    fatedJobRich: fatedPartner && (job?.income ?? 0) >= 0.8,
    fatedJobTemp: fatedPartner && (job?.id === "job_seeker" || job?.id === "unemployed" || job?.id === "student"),
    fatedFar: !!life && life.from !== "same",
    apart: partnered && !!s.relationship.longDistance,
    fatedAbroad: !!life && life.from === "abroad",
    hasCrushFriend: !!crush,
    crushName: crush ? w!.npcs[crush.npcId]?.name : undefined,
    crushId: crush?.npcId,
    abroad: isAbroad(s),
    korean: String(s.flags.nationality ?? "KR") === "KR",
    inKorea: s.location.country === "Korea" || s.location.country === "KR",
    traveling: !!w?.travel,
    weekend: !!opts.weekend,
    broke: s.money < 2,
    comfortable: s.money > 30,
    hasHabit: habits.length > 0,
    habitPlace: habits[0],
  };
}

/**
 * Requirement syntax:
 *   "employed"      fact is truthy
 *   "!partnered"    fact is falsy
 *   "age>=30"       numeric comparison (>=, <=, >, <, ==)
 */
export function meets(requires: string[] | undefined, f: LifeFacts): boolean {
  for (const r of requires ?? []) {
    const m = /^([a-zA-Z]+)\s*(>=|<=|==|>|<)\s*(-?\d+(?:\.\d+)?)$/.exec(r);
    if (m) {
      const v = Number(f[m[1]] ?? 0);
      const n = Number(m[3]);
      const ok = m[2] === ">=" ? v >= n : m[2] === "<=" ? v <= n : m[2] === ">" ? v > n : m[2] === "<" ? v < n : v === n;
      if (!ok) return false;
      continue;
    }
    if (r.startsWith("!")) {
      if (f[r.slice(1)]) return false;
    } else if (!f[r]) return false;
  }
  return true;
}
