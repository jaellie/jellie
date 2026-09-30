/**
 * The Director decides what the player actually sees.
 *
 *  1. Consistency — content only shows if its `requires` hold for the life
 *     facts *right now*, AND a keyword guard (data/game/guard.json) blocks any
 *     text that would contradict the facts even if the author forgot a rule.
 *  2. Pacing — per day: 1–3 small events, 0–2 messages, ≤2 major popups.
 *  3. Variety — no line repeats within N days, per-life caps, cooldowns,
 *     weekend menus never repeat the last set.
 *
 * Its memory lives in the save (DirectorMemory), so pacing survives reloads.
 */
import guardData from "../../data/game/guard.json";
import cfg from "../../data/game/director.json";
import type { SeededRandom } from "../core/rng";
import { type LifeFacts, meets } from "./facts";

export const DIRECTOR_CONFIG = cfg;

export interface GuardRule {
  id: string;
  keywords: string[];
  unless?: string[];
  requires: string[];
}
export const GUARD_RULES = guardData.rules as GuardRule[];

export interface DirectorMemory {
  day: number;
  budget: { small: number; messages: number; major: number };
  used: { small: number; messages: number; major: number; senders: string[] };
  /** content id / line → last day shown */
  lastShown: Record<string, number>;
  /** content id → times shown in this life */
  counts: Record<string, number>;
  lastMenu: string[];
  /** Blocked content (for the dev view / tests). */
  blocked: Array<{ day: number; id: string; reason: string }>;
}

export type ContentKind = "small" | "message" | "major";

export function newDirectorMemory(): DirectorMemory {
  return { day: -1, budget: { small: 0, messages: 0, major: 0 }, used: { small: 0, messages: 0, major: 0, senders: [] }, lastShown: {}, counts: {}, lastMenu: [], blocked: [] };
}

/** Which guard rules a text triggers (and so which facts it silently needs). */
export function guardRequirements(texts: string[]): { rule: string; requires: string[] }[] {
  const all = texts.join(" \u0001 ");
  const out: { rule: string; requires: string[] }[] = [];
  for (const r of GUARD_RULES) {
    if (!r.keywords.some((k) => all.includes(k))) continue;
    if (r.unless?.some((k) => all.includes(k))) continue;
    out.push({ rule: r.id, requires: r.requires });
  }
  return out;
}

/** What must be true for a given speaker to appear at all. */
export const SPEAKER_REQUIRES: Record<string, string[]> = {
  // Estranged (절연) or vanished family don't call or text.
  mom: ["momAlive", "!f_cutOffMom"],
  dad: ["dadAlive", "!f_cutOffDad"],
  partner: ["partnered", "!partnerCritical"],
  sibling: ["hasSibling", "!f_siblingGone"],
  kid: ["hasKid"],
  boss: ["employed", "!selfEmployed"],
  coworker: ["employed"],
  work: ["employed"],
  friend: ["hasFriend"],
  crush: ["hasCrushFriend"],
  ex: ["hasEx"],
};

/** Fallback speakers when the original can't appear (e.g. Mom has passed → Dad → a relative). */
export const SPEAKER_FALLBACK: Record<string, string[]> = {
  mom: ["dad", "relative"],
  dad: ["mom", "relative"],
};

export class Director {
  constructor(public mem: DirectorMemory) {}

  startDay(day: number, rng: SeededRandom): void {
    const [s0, s1] = cfg.smallEventsPerDay;
    const [m0, m1] = cfg.messagesPerDay;
    this.mem.day = day;
    this.mem.budget = { small: rng.int(s0, s1), messages: rng.int(m0, m1), major: cfg.majorPerDay };
    this.mem.used = { small: 0, messages: 0, major: 0, senders: [] };
    if (this.mem.blocked.length > 200) this.mem.blocked.splice(0, this.mem.blocked.length - 200);
  }

  hasBudget(kind: ContentKind): boolean {
    const b = this.mem.budget, u = this.mem.used;
    return kind === "small" ? u.small < b.small : kind === "message" ? u.messages < b.messages : u.major < b.major;
  }

  /** Full check. Returns a reason when the content must not be shown. */
  check(
    kind: ContentKind,
    c: { id: string; texts: string[]; requires?: string[]; cooldownDays?: number; maxPerLife?: number; sender?: string },
    facts: LifeFacts,
  ): string | undefined {
    if (!this.hasBudget(kind)) return "budget";
    if (!meets(c.requires, facts)) return "requires";
    if (c.sender && SPEAKER_REQUIRES[c.sender] && !meets(SPEAKER_REQUIRES[c.sender], facts)) return "speaker";
    for (const g of guardRequirements(c.texts)) if (!meets(g.requires, facts)) return `guard:${g.rule}`;
    const day = this.mem.day;
    const cd = c.cooldownDays ?? cfg.lineCooldownDays;
    const last = this.mem.lastShown[c.id];
    if (last !== undefined && day - last < cd) return "cooldown";
    for (const t of c.texts) {
      const lt = this.mem.lastShown[`t:${t}`];
      if (lt !== undefined && day - lt < cfg.lineCooldownDays) return "repeat-line";
    }
    if (c.maxPerLife !== undefined && (this.mem.counts[c.id] ?? 0) >= c.maxPerLife) return "max-per-life";
    if (c.sender && this.mem.used.senders.filter((s) => s === c.sender).length >= cfg.messageSenderMaxPerDay) return "sender";
    const sc = c.sender ? (cfg.senderCooldownDays as Record<string, number> | undefined)?.[c.sender] : undefined;
    const lastSender = c.sender ? this.mem.lastShown[`sender:${c.sender}`] : undefined;
    if (kind === "message" && sc !== undefined && lastSender !== undefined && day - lastSender < sc) return "sender-cooldown";
    return undefined;
  }

  record(kind: ContentKind, c: { id: string; texts: string[]; sender?: string }): void {
    const day = this.mem.day;
    this.mem.lastShown[c.id] = day;
    for (const t of c.texts) this.mem.lastShown[`t:${t}`] = day;
    this.mem.counts[c.id] = (this.mem.counts[c.id] ?? 0) + 1;
    if (kind === "small") this.mem.used.small++;
    else if (kind === "message") this.mem.used.messages++;
    else this.mem.used.major++;
    if (c.sender) {
      this.mem.used.senders.push(c.sender);
      if (kind === "message") this.mem.lastShown[`sender:${c.sender}`] = day;
    }
  }

  noteBlocked(id: string, reason: string): void {
    if (reason === "budget" || reason === "cooldown" || reason === "requires") return; // normal, not interesting
    this.mem.blocked.push({ day: this.mem.day, id, reason });
  }

  /** Pick one item from candidates that passes all checks (weighted). */
  pick<T extends { id: string; weight?: number }>(
    kind: ContentKind,
    candidates: T[],
    describe: (c: T) => { texts: string[]; requires?: string[]; cooldownDays?: number; maxPerLife?: number; sender?: string },
    facts: LifeFacts,
    rng: SeededRandom,
  ): T | undefined {
    if (!this.hasBudget(kind)) return undefined;
    const ok: Array<{ item: T; weight: number }> = [];
    for (const c of candidates) {
      const d = describe(c);
      const why = this.check(kind, { id: c.id, ...d }, facts);
      if (why) this.noteBlocked(c.id, why);
      else ok.push({ item: c, weight: c.weight ?? 1 });
    }
    if (!ok.length) return undefined;
    const chosen = rng.weighted(ok);
    this.record(kind, { id: chosen.id, ...describe(chosen) });
    return chosen;
  }
}
