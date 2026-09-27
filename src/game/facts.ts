/**
 * Life facts — the single source of truth every message/event is checked
 * against at the moment it would be shown. Content declares `requires`
 * (e.g. ["employed", "!partnered", "age>=30"]); the Director also runs a
 * keyword guard so content that forgets a requirement still can't contradict
 * the player's life.
 */
import type { LifeState } from "../sim/types";
import { isAbroad } from "../sim/types";

export interface LifeFacts {
  [key: string]: boolean | number | string | undefined;
  age: number;
  employed: boolean;
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
  hasFriend: boolean;
  friendName?: string;
  abroad: boolean;
  traveling: boolean;
  weekend: boolean;
  broke: boolean;
  comfortable: boolean;
  hasHabit: boolean;
  habitPlace?: string;
  alive: boolean;
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
  return {
    age: Math.floor(s.age),
    alive: s.alive,
    employed: s.career.employed,
    student: !!s.enrollment,
    jobless: !s.career.employed && !s.enrollment && s.age < 65,
    retired: !s.career.employed && s.age >= 65,
    careerCid: cid,
    recentlyPromoted: s.career.employed && s.flags.promotionCid === cid && promoMonth !== undefined && s.monthIndex - promoMonth <= 18,
    recentlyLostJob: !s.career.employed && lostMonth !== undefined && s.monthIndex - lostMonth <= 12,
    partnered,
    dating: s.relationship.status === "DATING",
    married: s.relationship.status === "MARRIED",
    single: !partnered,
    divorced: s.relationship.status === "DIVORCED",
    recentlyBrokeUp: !partnered && brokeUpMonth !== undefined && s.monthIndex - brokeUpMonth <= 12,
    hasEx: exes > 0,
    partnerName: partnered ? partner?.name : undefined,
    momAlive: s.family?.mom.alive ?? true,
    dadAlive: s.family?.dad.alive ?? true,
    hasFriend: friends.length > 0,
    friendName: friends[0] ? w!.npcs[friends[0].npcId]?.name : undefined,
    abroad: isAbroad(s),
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
