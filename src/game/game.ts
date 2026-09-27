/**
 * LoveSim Game Runtime — the only "brain" the UI talks to.
 *
 *   const game = LoveSim.createGame(setup);          // or LoveSim.loadGame(saveJson)
 *   game.startDay()  → DayInfo
 *   game.advance(minute) → Beat[]   (enter location / popup / toast / log / dayEnd)
 *   game.choose(i)   → result line for the open popup
 *   game.actions() / game.doActivity(id) / game.leave()
 *   game.endDay()    → skip summary (months pass in the background) — or the ending if the player died
 *   game.hud(), game.scene(), game.people(), game.lifeLog(), game.save()
 *
 * Every popup/message passes through the Director (consistency + pacing +
 * variety). Days keep coming until the player dies — there is no fixed end.
 */
import oppText from "../../data/game/opportunityText.json";
import messageData from "../../data/game/messages.json";
import storyData from "../../data/game/stories.json";
import type { GameDate } from "../core/gameDate";
import { SeededRandom } from "../core/rng";
import { calculateNatalChart } from "../saju/chart";
import type { BirthData } from "../saju/calendar/fourPillars";
import type { BirthPlace } from "../astrology/chart";
import { LifeRunner, type SimulateLifeOptions } from "../sim/simulateLife";
import { EventEngine } from "../sim/eventEngine";
import { DEFAULT_TEMPLATES, OpportunityEngine } from "../sim/opportunityEngine";
import type { Consequence, Opportunity } from "../sim/opportunity";
import { applyConsequences } from "../sim/consequences";
import { checkRequirements } from "../sim/requirements";
import type { LifeState } from "../sim/types";
import { yearlyIncome } from "../sim/lifeTick";
import { LOCATIONS, getActivity, getDestination, getLocation, findLocation } from "../world/catalog";
import { weekdayOf, seasonOf } from "../world/clock";
import { generateNpc, habitSlot, knowsName } from "../world/npcs";
import { resolveWorldEvent } from "../world/decisions";
import type { WorldEvent } from "../world/events";
import { endTrip, startTrip } from "../world/travel";
import { composeScene } from "../world/sceneComposer";
import { toPrototypeScene, type PrototypeScene } from "../integration/prototype";
import { WorldEngine } from "../world/worldEngine";
import type { NPCSchedule } from "../world/types";
import { type LifeFacts, computeFacts, meets } from "./facts";
import { STORY_ONLY_TEMPLATES, upcomingHint, ensureArcs, fillStory, hintFor, initStory, monthlyStoryTick, patientLabel, resolveStory, scheduleNext, storyPopup, fatedEvent } from "../story/storyEngine";
import { buildCards, type MemoryCard } from "../story/cards";
import memorialData from "../../data/story/memorial.json";
import { AutoWorldPolicy } from "../world/decisions";
import { DIRECTOR_CONFIG as CFG, Director, type DirectorMemory, newDirectorMemory, SPEAKER_FALLBACK, SPEAKER_REQUIRES } from "./director";
import { type Bi, type Lang, CITY_KO, COUNTRY_KO, DEST_KO, EDU_KO, SPEAKER_NAME, bi, fillNames, fixJosa, krw } from "./text";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GameSetup {
  name: string;
  gender: "F" | "M";
  /** Who the player is attracted to: M, F or A (any). */
  likes?: "M" | "F" | "A";
  /** Solar birth date (convert lunar in the UI first). Time optional. */
  birth: { year: number; month: number; day: number; hour?: number; minute?: number };
  mbti?: string;
  place?: BirthPlace;
  lang?: Lang;
  seed?: number;
  startAge?: number;
  /** The "destined person" from setup. They exist in the world; meeting and romance are not guaranteed. */
  fated?: {
    name?: string;
    gender?: "F" | "M";
    mbti?: string;
    birth?: { year: number; month: number; day: number };
    from?: "same" | "city" | "abroad";
    job?: string;
    profile?: Record<string, unknown>;
  };
}

export interface DayInfo {
  index: number;
  date: { year: number; month: number; day: number };
  weekday: number;
  weekend: boolean;
  age: number;
  season: string;
  label: Bi;
}

export interface Popup {
  id: string;
  source: "opportunity" | "world" | "story" | "plan";
  /** Portrait role: me | mom | dad | boss | partner | friend | npc | stranger … */
  who: string;
  name?: string;
  npcId?: string;
  /** Portrait identity: sprite gender + seed (stable per person). Absent only for me/mom/dad. */
  gender?: "M" | "F";
  seed?: number;
  /** True when the speaker is the destined person from setup (even as partner). */
  fated?: boolean;
  title?: string;
  line: string;
  ch: Array<{ t: string }>;
}

export type Beat =
  | { kind: "enter"; locationId: string; room?: string; name: string; log?: string }
  | { kind: "popup"; popup: Popup }
  | { kind: "toast"; from: string; text: string; role?: string; gender?: "M" | "F"; seed?: number; fated?: boolean }
  | { kind: "log"; text: string }
  | { kind: "dayEnd" };

export interface ChoiceResult {
  who: string;
  name?: string;
  line: string;
  log?: string;
}

interface Pending {
  popup: Popup;
  opp?: Opportunity;
  choiceIds?: string[];
  worldEvent?: WorldEvent;
  storyId?: string;
  plan?: PlanOption[];
  storyRef?: string;
  patient?: string;
}

export interface PlanOption {
  id: string;
  kind: "place" | "trip" | "home" | "friend" | "date";
  locationId?: string;
  activityId?: string;
  destination?: string;
  withPartner?: boolean;
  label: Bi;
}

interface AgendaItem {
  t: number;
  k: "major" | "small" | "message" | "plan" | "story" | "hint";
}

export interface GameSave {
  v: 1;
  setup: GameSetup;
  seed: number;
  lang: Lang;
  dayIndex: number;
  day?: DayInfo;
  minute: number;
  loc?: string;
  agenda: AgendaItem[];
  dayPlan: {
    locationId?: string;
    activityId?: string;
    withPartner?: boolean;
    trip?: string;
    override?: { locationId: string; until: number; activityId?: string; from?: number };
    /** Scene changes caused by a choice (e.g. business trip: airport → hotel → branch office). */
    sequence?: Array<{ locationId: string; from: number; until: number; activityId?: string }>;
    fatedPresent?: boolean;
  };
  /** Why today is played: calm / fated / foreshadow / arc (story engine). */
  dayKind?: "calm" | "fated" | "foreshadow" | "arc";
  dayRef?: string;
  /** Fated event foreshadowed today. */
  hintRef?: string;
  pending?: Pending;
  life: LifeState;
  director: DirectorMemory;
  over: boolean;
  milestones: Array<{ age: number; ko: string; en: string }>;
  lastScene?: PrototypeScene;
  log: string;
}

type Story = {
  id: string;
  who: string;
  where: string[];
  requires?: string[];
  weight?: number;
  cooldownDays?: number;
  maxPerLife?: number;
  line: Bi;
  choices: Array<{ t: Bi; r: Bi; effects?: Consequence[] }>;
};
type Message = { id: string; from: string; requires?: string[]; weight?: number; text: Bi };

const STORIES = storyData.stories as unknown as Story[];
const MESSAGES = messageData.messages as unknown as Message[];
const OPP_TEXT = oppText.opportunities as unknown as Record<string, { who: string; title: Bi; line: Bi; choices: Record<string, Bi> }>;
const UNIT = CFG.moneyUnitWon;

function hash(...parts: Array<string | number>): number {
  let h = 2166136261;
  for (const c of parts.join("|")) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  return h;
}

/** Between played days: friendships and travel continue, but romance only starts on screen. */
class OffscreenPolicy extends AutoWorldPolicy {
  choose(e: WorldEvent, s: LifeState, w: import("../world/types").WorldState, rng: SeededRandom): string {
    if (e.kind === "ROMANCE_OPPORTUNITY") return "STAY_FRIENDS";
    return super.choose(e, s, w, rng);
  }
}

// ---------------------------------------------------------------------------
// Game
// ---------------------------------------------------------------------------

export class Game {
  readonly s: GameSave;
  private director: Director;
  private world = new WorldEngine();
  private opps = new OpportunityEngine(DEFAULT_TEMPLATES.filter((t) => !STORY_ONLY_TEMPLATES.includes(t.id)));
  private events = new EventEngine(1);
  private runnerCache?: { key: string; runner: LifeRunner };
  private wanderTick = 0;

  constructor(save: GameSave) {
    this.s = save;
    this.director = new Director(save.director);
  }

  // ---- helpers --------------------------------------------------------------
  get state(): LifeState {
    return this.s.life;
  }
  private L(b: Bi): string {
    return this.s.lang === "ko" ? fixJosa(b.ko) : b.en;
  }
  private rng(...purpose: Array<string | number>): SeededRandom {
    return new SeededRandom(hash(this.s.seed, this.s.dayIndex, this.s.minute, ...purpose));
  }
  private birthData(): BirthData {
    const b = this.s.setup.birth;
    return { year: b.year, month: b.month, day: b.day, hour: b.hour, minute: b.minute, sex: this.s.setup.gender === "M" ? "MALE" : "FEMALE" };
  }
  attraction(): "MALE" | "FEMALE" | "ANY" {
    const l = this.s.setup.likes;
    return l === "M" ? "MALE" : l === "F" ? "FEMALE" : "ANY";
  }
  runnerOptions(seed: number): SimulateLifeOptions {
    const st = this.s.setup;
    return {
      seed,
      birthData: this.birthData(),
      duration: 0,
      profile: { name: st.name, mbti: st.mbti, birthPlace: st.place },
      world: { attraction: this.attraction(), maxHabitVisits: 4, policy: new OffscreenPolicy() },
      mortality: true,
      excludeTemplates: STORY_ONLY_TEMPLATES,
      parentMortality: false,
      autoRetire: false,
    };
  }
  private runner(): LifeRunner {
    const key = `${this.s.dayIndex}`;
    if (!this.runnerCache || this.runnerCache.key !== key) this.runnerCache = { key, runner: new LifeRunner(this.runnerOptions(hash(this.s.seed, "life", this.s.dayIndex)), this.state) };
    return this.runnerCache.runner;
  }
  facts(): LifeFacts {
    return computeFacts(this.state, { weekend: this.s.day?.weekend });
  }
  private fill(text: string): string {
    const f = this.facts();
    const t = fillNames(text, { partner: f.partnerName, friend: f.friendName, me: this.s.setup.name });
    return this.s.lang === "ko" ? fixJosa(t) : t;
  }
  /** Stable portrait identity for a popup speaker. */
  private portrait(role: string, npcId?: string): { gender?: "M" | "F"; seed?: number; fated?: boolean; npcId?: string } {
    const st = this.state;
    const w = st.world;
    const fromNpc = (id?: string) => {
      if (!id) return undefined;
      const wn = w?.npcs[id];
      if (wn) return { gender: wn.sex === "MALE" ? ("M" as const) : ("F" as const), seed: wn.spriteSeed, fated: !!wn.fated, npcId: id };
      const n = st.npcs.find((x) => x.id === id);
      return n ? { gender: n.birth.sex === "MALE" ? ("M" as const) : ("F" as const), seed: hash(this.s.seed, n.id), fated: false, npcId: id } : undefined;
    };
    if (npcId) return fromNpc(npcId) ?? {};
    if (role === "me" || role === "mom" || role === "dad") return {};
    if (role === "partner") return fromNpc(st.relationship.partnerId) ?? {};
    if (role === "friend" && w) {
      const best = Object.values(w.relationships).filter((r) => r.stage === "FRIEND" || r.stage === "CLOSE_FRIEND").sort((a, b) => b.closeness - a.closeness)[0];
      if (best) return fromNpc(best.npcId) ?? {};
    }
    // Generic roles (boss, coworker, recruiter…): one stable look per life, per job.
    const h = hash(this.s.seed, role, this.state.career.cid ?? 0);
    return { gender: h % 2 ? "M" : "F", seed: h % 1_000_000 };
  }

  /** An NPC's name, or "낯선 사람" if you haven't actually met them yet (no names before introductions). */
  private npcLabel(npcId: string): string {
    const npc = this.state.world?.npcs[npcId];
    return npc && knowsName(this.state.world, npcId) ? npc.name : this.L(bi("낯선 사람", "Stranger"));
  }
  private speaker(role: string): string {
    const f = this.facts();
    if (role === "partner") return f.partnerName ?? this.L(bi("연인", "Partner"));
    if (role === "friend") return f.friendName ?? this.L(bi("친구", "Friend"));
    return this.L(SPEAKER_NAME[role] ?? bi(role, role));
  }

  // ---- day structure --------------------------------------------------------
  startDay(): DayInfo {
    const s = this.s;
    const st = this.state;
    const rng = this.rng("day");
    const date = { year: st.date.year, month: st.date.month, day: rng.int(1, 28) };
    st.date = { ...date };
    const weekday = weekdayOf(date.year, date.month, date.day);
    const weekend = weekday === 0 || weekday === 6;
    const WD = ["일", "월", "화", "수", "목", "금", "토"];
    const WE = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const season = seasonOf(date.month);
    s.day = {
      index: s.dayIndex,
      date,
      weekday,
      weekend,
      age: Math.floor(st.age),
      season,
      label: bi(`${date.year}.${String(date.month).padStart(2, "0")}.${String(date.day).padStart(2, "0")} (${WD[weekday]})`, `${date.year}.${String(date.month).padStart(2, "0")}.${String(date.day).padStart(2, "0")} (${WE[weekday]})`),
    };
    s.minute = CFG.dayStartMinute;
    s.loc = undefined;
    s.dayPlan = {};
    s.pending = undefined;
    this.director.startDay(s.dayIndex, rng);
    const b = this.director.mem.budget;
    if (st.story) ensureArcs(st, rng);
    // Story days: the fated turning point or the arc step (상견례, 결혼식, 법원…) is the day's centerpiece.
    let storyDef = s.dayKind === "fated" || s.dayKind === "arc" ? storyPopup(st, s.dayKind, s.dayRef!, this.facts(), this.rng("storydef")) : undefined;
    if (!storyDef && (s.dayKind === "fated" || s.dayKind === "arc")) s.dayKind = "calm";
    const agenda: AgendaItem[] = [];
    if (storyDef) {
      s.dayPlan.override = { locationId: storyDef.location, activityId: storyDef.activity, from: 600, until: 1080 };
      s.dayPlan.fatedPresent = !!storyDef.needsFated;
      agenda.push({ t: 660, k: "story" });
      b.major = 0; // no random big offers competing with a destined moment
      b.small = Math.min(b.small, 1);
    } else {
      agenda.push({ t: rng.int(620, 1020), k: "major" });
      if (weekend) agenda.push({ t: 600, k: "plan" });
    }
    const soon = upcomingHint(st);
    if (soon && soon.id !== s.dayRef) {
      s.hintRef = soon.id;
      agenda.push({ t: 450, k: "hint" });
    }
    storyDef = undefined;
    for (let i = 0; i < b.small; i++) agenda.push({ t: rng.int(480, 1320), k: "small" });
    for (let i = 0; i < b.messages; i++) agenda.push({ t: rng.int(450, 1350), k: "message" });
    s.agenda = agenda.sort((a, c) => a.t - c.t);
    return s.day;
  }

  /** Where the player is at a given minute (schedule + today's plan + manual moves). */
  locationAt(minute: number): string {
    const s = this.s;
    const st = this.state;
    for (const q of s.dayPlan.sequence ?? []) if (minute >= q.from && minute < q.until) return q.locationId;
    const o = s.dayPlan.override;
    if (o && minute < o.until && minute >= (o.from ?? 0)) return o.locationId;
    const f = this.facts();
    if (s.day?.weekend) {
      if (s.dayPlan.trip) {
        const d = getDestination(s.dayPlan.trip);
        const sights = d.locations;
        if (minute < 660) return "airport";
        if (minute < 900) return sights[0];
        if (minute < 1140) return sights[1 % sights.length];
        return d.hub;
      }
      if (minute < 660 || minute >= 1080) return "home";
      return s.dayPlan.locationId ?? "home";
    }
    // Weekday evening habit (gym, class…)
    const habit = Object.entries(st.world?.habits ?? {}).find(([id]) => {
      const loc = getLocation(id);
      if (loc.online || loc.region !== st.world!.homeRegion) return false;
      const slot = habitSlot(loc, new SeededRandom(1));
      return !slot.days || slot.days.includes(s.day?.weekday ?? 1);
    });
    const evening = (m: number) => {
      if (habit) {
        const slot = habitSlot(getLocation(habit[0]), new SeededRandom(1));
        const start = Math.max(1110, slot.startHour * 60);
        if (m >= start && m < start + 90) return habit[0];
      }
      return "home";
    };
    if (f.employed) {
      if (minute < 510) return "home";
      if (minute < 540) return "street";
      if (minute < 1080) return "office";
      if (minute < 1110) return "street";
      return evening(minute);
    }
    if (f.student) {
      if (minute < 540) return "home";
      if (minute < 1020) return "university";
      return evening(minute);
    }
    if (f.retired) return minute >= 480 && minute < 600 ? "park" : evening(minute);
    // Jobless: job hunting at the café
    if (minute >= 600 && minute < 960) return "cafe";
    return evening(minute);
  }

  /**
   * Advance the clock to `toMinute` (fractions are fine — the UI can tick by
   * 0.3 min per frame). Returns what happened; stops at a popup until choose().
   */
  advance(toMinute: number): Beat[] {
    const s = this.s;
    const beats: Beat[] = [];
    if (s.over || s.pending || !s.day) return beats;
    const target = Math.min(toMinute, CFG.dayEndMinute);
    for (let guard = 0; guard < 400; guard++) {
      const loc = this.locationAt(s.minute);
      if (loc !== s.loc) {
        s.loc = loc;
        beats.push(...this.enter(loc));
        if (s.pending) return beats;
      }
      while (s.agenda.length && s.agenda[0].t <= s.minute) {
        const b = this.fire(s.agenda.shift()!);
        if (b) beats.push(b);
        if (s.pending) return beats;
      }
      if (s.minute >= CFG.dayEndMinute) {
        beats.push({ kind: "dayEnd" });
        return beats;
      }
      if (s.minute >= target) break;
      s.minute = Math.min(target, Math.floor(s.minute / 10) * 10 + 10);
    }
    return beats;
  }

  private visit(locationId: string, activityId?: string): Beat[] {
    const s = this.s;
    const st = this.state;
    if (!st.world) return [];
    const withPartner = !!s.dayPlan.withPartner && !!s.day?.weekend && s.minute >= 660 && s.minute < 1080;
    const r = this.world.visit(
      { state: st, world: st.world, modifiers: this.runner().modifiers(), rng: this.rng("visit", locationId, activityId ?? ""), seed: s.seed, withPartner, attraction: this.attraction(), trip: st.world.travel, facts: this.facts() },
      {
        locationId,
        activityId:
          activityId ??
          (s.dayPlan.sequence?.find((q) => q.locationId === locationId)?.activityId ??
            (s.dayPlan.override?.locationId === locationId ? s.dayPlan.override.activityId : s.dayPlan.locationId === locationId ? s.dayPlan.activityId : undefined)),
        date: st.date,
        hour: Math.floor(s.minute / 60),
      },
    );
    const fated = s.dayPlan.fatedPresent ? Object.values(st.world.npcs).find((n) => n.fated) : undefined;
    if (fated && !r.present.includes(fated.id)) r.present.push(fated.id);
    const partnerHere = withPartner || (locationId === "home" && (st.relationship.status === "MARRIED" || !!st.flags.longterm) && (s.minute >= 1140 || !!s.day?.weekend));
    s.lastScene = toPrototypeScene(composeScene(r, st.world, st, { withPartner: partnerHere, household: locationId === "home" }));
    const beats: Beat[] = [];
    for (const e of r.events) {
      if (e.choices?.length) {
        if (this.director.hasBudget("major")) {
          this.director.record("major", { id: `world:${e.kind}:${e.npcId ?? ""}`, texts: [e.text.ko] });
          const npc = e.npcId ? st.world.npcs[e.npcId] : undefined;
          const popup: Popup = { id: `w${s.dayIndex}-${s.minute}`, source: "world", who: e.npcId ? (npc?.fated ? "fated" : "npc") : "me", name: e.npcId ? this.npcLabel(e.npcId) : this.speaker("me"), ...this.portrait("npc", e.npcId), line: this.L(e.text), ch: e.choices.map((c) => ({ t: this.L(c.label) })) };
          s.pending = { popup, worldEvent: e };
          beats.push({ kind: "popup", popup });
          return beats;
        }
        continue;
      }
      // Only moments that matter reach the log (people & important things), not everyday filler.
      const notable = e.scale === "MAJOR" || ["NEW_ACQUAINTANCE", "FRIENDSHIP", "REUNION", "MEMORY_CALLBACK"].includes(e.kind);
      if (notable && e.kind !== "CLOSED") {
        const key = `t:log:${e.text.en}`;
        const last = this.director.mem.lastShown[key];
        if (last !== undefined && s.dayIndex - last < 2) continue; // no same log line twice in a row
        this.director.mem.lastShown[key] = s.dayIndex;
        beats.push({ kind: "log", text: this.L(e.text) });
      }
    }
    return beats;
  }

  private enter(locationId: string): Beat[] {
    const loc = getLocation(locationId);
    const beats: Beat[] = [{ kind: "enter", locationId, room: loc.prototypeId, name: this.L(loc.name) }];
    if (this.s.dayPlan.trip && !this.state.world?.travel) startTrip(this.state.world!, this.s.dayPlan.trip, this.state.date, this.rng("trip"));
    beats.push(...this.visit(locationId));
    return beats;
  }

  private fire(item: AgendaItem): Beat | undefined {
    if (item.k === "story") return this.fireStory();
    if (item.k === "hint") {
      const h = this.s.hintRef ? hintFor(this.state, this.s.hintRef) : undefined;
      return h ? { kind: "log", text: this.L(h) } : undefined;
    }
    if (item.k === "major") return this.fireMajor();
    if (item.k === "small") return this.fireSmall();
    if (item.k === "message") return this.fireMessage();
    return this.firePlan();
  }

  private fireStory(): Beat | undefined {
    const s = this.s;
    const st = this.state;
    const f = this.facts();
    const def = storyPopup(st, s.dayKind as "fated" | "arc", s.dayRef!, f, this.rng("storydef"));
    if (!def) return;
    const ev = s.dayKind === "fated" ? fatedEvent(st, s.dayRef!) : undefined;
    const patientKey = (ev?.data?.patient as string | undefined) ?? (st.story?.arcs.find((a) => a.id === s.dayRef)?.data?.patient as string | undefined);
    const patient = patientKey ? this.L(patientLabel(st, patientKey, f)) : "";
    const fatedNpc = Object.values(st.world?.npcs ?? {}).find((n) => n.fated);
    const who = def.who === "fated" ? "fated" : def.who;
    const portrait = def.who === "fated" && fatedNpc ? this.portrait("npc", fatedNpc.id) : this.portrait(def.who === "inlaw" || def.who === "judge" || def.who === "nurse" || def.who === "doctor" ? def.who : def.who);
    const popup: Popup = {
      id: `story${s.dayIndex}`,
      source: "story",
      who,
      name: def.who === "fated" ? (fatedNpc ? this.npcLabel(fatedNpc.id) : this.L(bi("낯선 사람", "Stranger"))) : this.speaker(def.who),
      ...portrait,
      line: this.fill(fillStory(this.L(def.line), st, f, { patient })),
      ch: def.choices.map((c) => ({ t: this.fill(this.L(c)) })),
    };
    s.pending = { popup, storyRef: def.ref, patient };
    return { kind: "popup", popup };
  }

  private fireMajor(): Beat | undefined {
    const st = this.state;
    if (!this.director.hasBudget("major")) return;
    const rng = this.rng("major");
    const cands = this.opps.evaluate(st, this.runner().sources(), rng).filter((c) => OPP_TEXT[c.template.id]);
    const total = cands.reduce((a, c) => a + c.opportunity.score.probability, 0);
    if (!cands.length || !rng.chance(Math.min(0.75, total * 4))) return;
    const facts = this.facts();
    // Only offers whose speaker can actually be in the player's life right now.
    const speakerFor = (who: string): string | undefined => {
      if (!SPEAKER_REQUIRES[who] || meets(SPEAKER_REQUIRES[who], facts)) return who;
      return (SPEAKER_FALLBACK[who] ?? []).find((w) => !SPEAKER_REQUIRES[w] || meets(SPEAKER_REQUIRES[w], facts));
    };
    const usable = cands.filter((c) => speakerFor(OPP_TEXT[c.template.id].who));
    if (!usable.length) return;
    const pickC = rng.weighted(usable.map((c) => ({ item: c, weight: c.opportunity.score.probability })));
    const opp = pickC.explain();
    const text = { ...OPP_TEXT[opp.templateId], who: speakerFor(OPP_TEXT[opp.templateId].who)! };
    const available = this.events.options(st, opp).filter((o) => o.available);
    if (!available.length) return;
    this.director.record("major", { id: `opp:${opp.templateId}`, texts: [text.line.ko] });
    this.events.markOffered(st, opp);
    const popup: Popup = {
      id: opp.id,
      source: "opportunity",
      who: text.who,
      name: this.speaker(text.who),
      ...this.portrait(text.who),
      title: this.L(text.title),
      line: this.fill(this.L(text.line)),
      ch: available.map((o) => ({ t: this.L(text.choices[o.choice.id] ?? bi(o.choice.label, o.choice.label)) })),
    };
    this.s.pending = { popup, opp, choiceIds: available.map((o) => o.choice.id) };
    return { kind: "popup", popup };
  }

  private fireSmall(): Beat | undefined {
    const here = getLocation(this.s.loc ?? "home");
    const f = this.facts();
    const cands = STORIES.filter((x) => x.where.includes(here.type) || x.where.includes(here.id));
    const story = this.director.pick(
      "small",
      cands,
      (x) => ({ texts: [x.line.ko, x.line.en, ...x.choices.map((c) => c.t.ko)], requires: x.requires, cooldownDays: x.cooldownDays, maxPerLife: x.maxPerLife, sender: x.who }),
      f,
      this.rng("small"),
    );
    if (!story) return;
    const popup: Popup = { id: story.id, source: "story", who: story.who, name: this.speaker(story.who), ...this.portrait(story.who), line: this.fill(this.L(story.line)), ch: story.choices.map((c) => ({ t: this.fill(this.L(c.t)) })) };
    this.s.pending = { popup, storyId: story.id };
    return { kind: "popup", popup };
  }

  private fireMessage(): Beat | undefined {
    const f = this.facts();
    if (f.traveling && this.s.dayPlan.trip === undefined) return;
    const msg = this.director.pick(
      "message",
      MESSAGES,
      (x) => ({ texts: [x.text.ko, x.text.en], requires: x.requires, sender: x.from }),
      f,
      this.rng("message"),
    );
    if (!msg) return;
    return { kind: "toast", from: this.speaker(msg.from), text: this.fill(this.L(msg.text)), role: msg.from, ...this.portrait(msg.from) };
  }

  // ---- weekend menu ---------------------------------------------------------
  weekendMenu(): PlanOption[] {
    const st = this.state;
    const f = this.facts();
    const rng = this.rng("menu");
    const mods = this.runner().modifiers();
    const pool: Array<{ item: PlanOption; weight: number }> = [];
    const place = (id: string, activityId: string | undefined, label: Bi, w: number) => pool.push({ item: { id: `place:${id}:${activityId ?? ""}`, kind: "place", locationId: id, activityId, label }, weight: w });
    const visits = (id: string) => st.world?.locationMemory[id]?.visitCount ?? 0;
    const novelty = (id: string) => (visits(id) === 0 ? 0.6 + st.traits.novelty : 1);
    place("park", "walk", bi("공원 산책", "A walk in the park"), 1);
    place("cafe", "read", bi("카페에서 책 읽기", "Read at a café"), 1);
    place("cinema", "watch_movie", bi("영화 보러 가기", "See a movie"), 0.8 * novelty("cinema"));
    place("diner", "eat", bi("분식집에서 떡볶이", "Tteokbokki at the diner"), 0.7);
    place("amusement_park", "ride", bi("놀이공원 가기", "Amusement park"), 0.5 * novelty("amusement_park"));
    place("library", "read", bi("도서관 가기", "Go to the library"), 0.5 + Math.max(0, mods.education));
    place("street", "shop", bi("시내 구경", "Wander downtown"), 0.7);
    place("restaurant", "eat", bi("맛집 탐방", "Try a new restaurant"), 0.6 * novelty("restaurant"));
    if (f.momAlive || f.dadAlive) place("family_home", "eat", bi("본가에 다녀오기", "Visit my parents"), 0.4 + st.familyObligation);
    for (const [id, h] of Object.entries(st.world?.habits ?? {})) {
      const loc = getLocation(id);
      if (!loc.online && loc.region === st.world!.homeRegion) place(id, h.activityId, bi(`${loc.name.ko} 가기`, `Go to ${loc.name.en}`), 2.5);
    }
    if (f.hasFriend) pool.push({ item: { id: "friend", kind: "friend", locationId: "cafe", activityId: "meet_friend", label: bi(`${f.friendName} 만나기`, `Meet ${f.friendName}`) }, weight: 1.5 + st.traits.sociability });
    if (f.partnered) {
      for (const [id, ko, en] of [["park", "공원 데이트", "Park date"], ["restaurant", "레스토랑 데이트", "Dinner date"], ["cinema", "영화 데이트", "Movie date"], ["amusement_park", "놀이공원 데이트", "Amusement-park date"]] as const)
        pool.push({ item: { id: `date:${id}`, kind: "date", locationId: id, activityId: "date", withPartner: true, label: bi(`${f.partnerName}와(과) ${ko}`, `${en} with ${f.partnerName}`) }, weight: 1.2 });
    }
    const tripCost = CFG.tripCostUnits as Record<string, number>;
    for (const dest of ["coast", "tokyo", "paris"]) {
      if (st.money < tripCost[dest] + 1) continue;
      const intl = getDestination(dest).international;
      const w = 0.35 * Math.exp((mods.travel ?? 0) + (intl ? mods.overseas ?? 0 : 0)) * (0.6 + st.traits.novelty);
      pool.push({ item: { id: `trip:${dest}`, kind: "trip", destination: dest, label: bi(`${DEST_KO[dest]} 여행 떠나기`, `Trip to ${getDestination(dest).name.en}`) }, weight: w });
    }
    pool.push({ item: { id: "home", kind: "home", locationId: "home", activityId: "watch_tv", label: bi("집에서 뒹굴기", "Lounge at home") }, weight: 0.7 });

    const last = new Set(this.director.mem.lastMenu);
    for (let attempt = 0; attempt < 8; attempt++) {
      const chosen: PlanOption[] = [];
      const remaining = pool.slice();
      while (chosen.length < 3 && remaining.length) {
        const pickIdx = rng.weighted(remaining.map((p, i) => ({ item: i, weight: p.weight })));
        const opt = remaining.splice(pickIdx, 1)[0].item;
        if (opt.kind === "trip" && chosen.some((c) => c.kind === "trip")) continue;
        if (chosen.some((c) => c.locationId && c.locationId === opt.locationId && c.kind === opt.kind)) continue;
        chosen.push(opt);
      }
      const same = chosen.every((c) => last.has(c.id));
      if (!same || attempt === 7) {
        this.director.mem.lastMenu = chosen.map((c) => c.id);
        return chosen;
      }
    }
    return [];
  }

  private firePlan(): Beat | undefined {
    const opts = this.weekendMenu();
    if (!opts.length) return;
    const f = this.facts();
    const popup: Popup = {
      id: `plan${this.s.dayIndex}`,
      source: "plan",
      who: "me",
      name: this.speaker("me"),
      line: this.L(f.partnered ? bi(`(오늘 ${f.partnerName}와(과) 뭐 할까?)`, `(What should ${f.partnerName} and I do today?)`) : bi("(주말이다. 뭐 하지?)", "(The weekend. What now?)")),
      ch: opts.map((o) => ({ t: this.L(o.label) })),
    };
    this.s.pending = { popup, plan: opts };
    return { kind: "popup", popup };
  }

  // ---- choices --------------------------------------------------------------
  choose(index: number): ChoiceResult | undefined {
    const r = this.resolveChoice(index);
    if (!r) return r;
    // Every result names its speaker (fated/npc names re-checked: you may have just been introduced).
    const pid = r.who === "fated" ? Object.values(this.state.world?.npcs ?? {}).find((n) => n.fated)?.id : undefined;
    if (pid) r.name = this.npcLabel(pid);
    else if (!r.name) r.name = r.who === "me" ? this.speaker("me") : this.speaker(r.who);
    return r;
  }

  private resolveChoice(index: number): ChoiceResult | undefined {
    const s = this.s;
    const p = s.pending;
    if (!p) return;
    index = Math.max(0, Math.min(p.popup.ch.length - 1, Math.floor(Number(index) || 0)));
    const st = this.state;
    s.pending = undefined;
    const mods = this.runner().modifiers();
    const rng = this.rng("choose", p.popup.id, index);
    if (p.opp && p.choiceIds) {
      const choiceId = p.choiceIds[index];
      const r = this.events.resolve(st, p.opp, { choose: () => choiceId }, mods, rng);
      const sceneDef = p.opp.choices.find((c) => c.id === choiceId)?.scene;
      if (sceneDef?.length && r.success !== false) this.setSequence(sceneDef);
      const line = r.success === undefined ? bi("(결정했다.)", "(Decided.)") : r.success ? bi("(잘 됐다!)", "(It worked out!)") : bi("(…이번엔 잘 안 됐다.)", "(…It didn't work out this time.)");
      return { who: "me", line: this.L(line), log: p.popup.ch[index]?.t };
    }
    if (p.worldEvent) {
      const e = p.worldEvent;
      const choiceId = e.choices![index].id;
      const r = resolveWorldEvent(e, choiceId, { state: st, world: st.world!, modifiers: mods, rng });
      if (st.story) ensureArcs(st, rng);
      const line = r.success === undefined ? bi("(그렇게 하기로 했다.)", "(So be it.)") : r.success ? bi("(좋다고 했다!)", "(They said yes!)") : bi("(…어색하게 웃었다.)", "(…an awkward smile.)");
      return { who: r.success === false ? p.popup.who : "me", name: p.popup.name, line: this.L(line) };
    }
    if (p.storyRef) {
      const label = p.popup.ch[index]?.t;
      const res = resolveStory(p.storyRef, index, { state: st, seed: s.seed, rng, mods, facts: this.facts() }, label);
      if (!res) return;
      if (res.scene?.length) this.setSequence(res.scene);
      if (!st.alive) s.minute = CFG.dayEndMinute;
      return { who: "me", line: this.fill(fillStory(this.L(res.r), st, this.facts(), { patient: p.patient ?? "" })), log: label };
    }
    if (p.storyId) {
      const story = STORIES.find((x) => x.id === p.storyId)!;
      const c = story.choices[index];
      applyConsequences(st, c.effects ?? [], { rng, modifiers: mods, log: [] });
      return { who: story.who === "me" ? "me" : story.who, name: p.popup.name, line: this.fill(this.L(c.r)) };
    }
    if (p.plan) {
      const o = p.plan[index];
      if (o.kind === "trip") {
        s.dayPlan = { trip: o.destination };
        st.money -= (CFG.tripCostUnits as Record<string, number>)[o.destination!];
        return { who: "me", line: this.L(bi("(가방 하나 메고 출발!)", "(One bag, let's go!)")), log: this.L(o.label) };
      }
      s.dayPlan = { locationId: o.locationId, activityId: o.activityId, withPartner: o.withPartner };
      return { who: "me", line: this.L(o.kind === "home" ? bi("(이불 밖은 위험해.)", "(Outside the blanket is dangerous.)") : bi("(좋아, 가보자!)", "(Okay, let's go!)")), log: this.L(o.label) };
    }
    return;
  }

  /** A choice moves the player: each place for ~2 hours, starting now. */
  private setSequence(locations: string[]): void {
    const s = this.s;
    let t = s.minute;
    s.dayPlan.sequence = locations.map((locationId) => {
      const q = { locationId, from: t, until: Math.min(CFG.dayEndMinute, t + 120) };
      t += 120;
      return q;
    });
    s.dayPlan.override = undefined;
  }

  /** Move everyone in the scene a little (call every few seconds; NPCs, partner, kids and pets wander too). */
  wander(): PrototypeScene | undefined {
    const sc = this.s.lastScene;
    if (!sc) return;
    const loc = getLocation(this.s.loc ?? "home");
    const spots = loc.spots ?? [];
    if (spots.length < 2) return sc;
    this.wanderTick = (this.wanderTick + 1) % 1_000_000;
    const rng = this.rng("wander", this.wanderTick);
    const taken = new Set<string>();
    sc.actors = sc.actors.map((a) => {
      if (!rng.chance(0.5)) {
        taken.add(a.spot.join(","));
        return a;
      }
      const free = spots.filter((p) => !taken.has(p.join(",")));
      const spot = (free.length ? free : spots)[rng.int(0, (free.length ? free : spots).length - 1)] as [number, number];
      const jitter: [number, number] = [spot[0] + rng.range(-0.4, 0.4), spot[1] + rng.range(-0.4, 0.4)];
      taken.add(spot.join(","));
      return { ...a, spot: jitter, z: Math.round((jitter[0] + jitter[1]) * 10) };
    });
    return sc;
  }

  // ---- player-driven actions -----------------------------------------------
  actions(): Array<{ id: string; label: string }> {
    const loc = getLocation(this.s.loc ?? "home");
    const out = loc.activities.slice(0, 3).map((a) => ({ id: a, label: this.L(getActivity(a).name) }));
    out.push({ id: "LEAVE", label: this.L(bi("나가기", "Leave")) });
    return out;
  }

  /** Doing an activity takes its real time and is a new visit. */
  doActivity(activityId: string): Beat[] {
    const s = this.s;
    if (s.pending || s.over) return [];
    if (activityId === "LEAVE") return this.leave();
    const act = getActivity(activityId);
    const beats = this.visit(s.loc ?? "home", activityId);
    s.minute = Math.min(CFG.dayEndMinute, s.minute + Math.max(30, Math.round(act.durationHours * 60)));
    return beats.concat(s.pending ? [] : this.advance(s.minute));
  }

  /** Places reachable now (home region + online, or the trip's places). */
  destinations(): Array<{ id: string; label: string; open: boolean }> {
    const st = this.state;
    const hour = Math.floor(this.s.minute / 60);
    const trip = st.world?.travel ? getDestination(st.world.travel.destinationId) : undefined;
    const allowed = trip ? new Set([trip.hub, ...trip.locations]) : undefined;
    return LOCATIONS.filter((l) => (allowed ? allowed.has(l.id) : l.region === st.world?.homeRegion || l.region === "online"))
      .filter((l) => !(l.id === "office" && !st.career.employed) && !(l.id === "university" && !st.enrollment))
      .map((l) => ({ id: l.id, label: this.L(l.name), open: hour >= l.availableHours.start && hour < l.availableHours.end }));
  }

  /** Go somewhere for ~2 hours; the schedule resumes afterwards. */
  goTo(locationId: string, activityId?: string): Beat[] {
    const s = this.s;
    if (s.pending || s.over) return [];
    s.dayPlan.override = { locationId, until: Math.min(CFG.dayEndMinute, s.minute + 120), activityId };
    return this.advance(s.minute);
  }

  leave(): Beat[] {
    return this.goTo("home");
  }

  // ---- between days ---------------------------------------------------------
  /**
   * Time passes until the next played day (a fated turning point, an arc step
   * like 상견례/결혼식/법원, or a calm day). Returns the 시간이 흐른다 data:
   * memory cards (framed scenes) for big moments, plus short summary lines.
   */
  endDay(): { over: boolean; fromAge: number; toAge: number; lines: string[]; cards: MemoryCard[] } {
    const s = this.s;
    const st = this.state;
    if (st.world?.travel) endTrip(st.world, this.rng("endtrip"));
    s.dayPlan = {};
    const before = snapshot(st);
    const fromAge = Math.floor(st.age);
    const rng = this.rng("gap");
    if (st.alive && st.story) {
      const next = scheduleNext(st, rng);
      const runner = new LifeRunner(this.runnerOptions(hash(s.seed, "between", s.dayIndex)), st);
      while (st.alive && st.monthIndex < next.month) {
        runner.stepMonth();
        monthlyStoryTick(st, rng);
        // A newly started arc step (e.g. a parent's last days) can pull the next day earlier.
        const dueArc = st.story.arcs.find((x) => x.steps[x.step] && x.steps[x.step].dueMonth <= st.monthIndex + 1);
        if (dueArc && next.kind !== "arc") {
          st.story.nextDay = { month: st.monthIndex + 1, kind: "arc", ref: dueArc.id };
          break;
        }
      }
      if (st.alive && st.monthIndex < st.story.nextDay!.month) {
        // Step the remaining month(s) once more so the day lands in its month.
        while (st.alive && st.monthIndex < st.story.nextDay!.month) {
          runner.stepMonth();
          monthlyStoryTick(st, rng);
        }
      }
      s.dayKind = st.story.nextDay!.kind;
      s.dayRef = st.story.nextDay!.ref;
    } else if (st.alive) {
      const runner = new LifeRunner(this.runnerOptions(hash(s.seed, "between", s.dayIndex)), st);
      for (let i = 0; i < 12 && st.alive; i++) runner.stepMonth();
    }
    pruneWorld(st);
    const cards = buildCards(st, s.lang, s.seed);
    const lines = cards.length ? cards.map((c) => c.caption) : summarize(before, snapshot(st), s.lang).bi.map((l) => l[s.lang]);
    for (const c of cards) s.milestones.push({ age: c.age, ko: s.lang === "ko" ? c.caption : c.caption, en: c.caption });
    if (!cards.length) for (const l of summarize(before, snapshot(st), s.lang).bi) s.milestones.push({ age: Math.floor(st.age), ko: l.ko, en: l.en });
    const out = { over: !st.alive, fromAge, toAge: Math.floor(st.age), lines, cards };
    if (!st.alive) {
      s.over = true;
      return out;
    }
    s.dayIndex += 1;
    this.runnerCache = undefined;
    this.startDay();
    return out;
  }

  /**
   * Death: fade out gently and remember the life. Lines are original, chosen
   * from how the player lived (love, family, travel, friends, courage…).
   */
  memorial(): { fadeMs: number; lineMs: number; epitaph: string; lines: string[]; cards: MemoryCard[] } {
    const st = this.state;
    const s = this.s;
    const lang = s.lang;
    const w = st.world;
    const friends = Object.values(w?.relationships ?? {}).filter((r) => r.stage === "FRIEND" || r.stage === "CLOSE_FRIEND" || r.stage === "LOST_CONTACT").length;
    const tags = new Set<string>(["any"]);
    if (st.relationship.status === "MARRIED" || st.flags.widowed || st.npcs.some((n) => n.role === "EX" || n.role === "PARTNER")) tags.add("love");
    if ((st.kids ?? []).length) (tags.add("kids"), tags.add("family"));
    if (st.relationship.status === "MARRIED") tags.add("family");
    if ((w?.pastTrips.length ?? 0) >= 3 || st.flags.livedAbroad) tags.add("travel");
    if (friends >= 4) tags.add("friends");
    if (st.career.level >= 4) tags.add("work");
    if ((st.pets ?? []).length) tags.add("pet");
    if (st.flags.jobLostMonth !== undefined || st.flags.widowed || st.relationship.status === "DIVORCED") tags.add("courage");
    if (tags.size <= 2) tags.add("quiet");
    const pool = (memorialData.lines as Array<{ tag: string; text: { ko: string; en: string } }>).filter((l) => tags.has(l.tag));
    const rng = new SeededRandom(hash(s.seed, "memorial"));
    const specific = pool.filter((l) => l.tag !== "any");
    const picked = [...rng.weightedSample(specific.map((l) => ({ item: l, weight: 1 })), 2), ...rng.weightedSample(pool.filter((l) => l.tag === "any").map((l) => ({ item: l, weight: 1 })), 1)];
    const deathYear = st.date.year;
    const name = s.setup.name;
    return {
      fadeMs: 4000,
      lineMs: 3500,
      epitaph: lang === "ko" ? `${name} · ${st.birth.year} – ${deathYear}` : `${name} · ${st.birth.year} – ${deathYear}`,
      lines: picked.map((l) => l.text[lang]),
      cards: [],
    };
  }

  isOver(): boolean {
    return this.s.over;
  }

  ending(): { title: string; summary: string; lines: string[]; age: number; memorial: ReturnType<Game["memorial"]> } {
    const st = this.state;
    const s = this.s;
    const partners = st.npcs.filter((n) => n.role === "PARTNER" || n.role === "EX").length;
    const trips = st.world?.pastTrips.length ?? 0;
    const friends = Object.values(st.world?.relationships ?? {}).filter((r) => r.stage === "FRIEND" || r.stage === "CLOSE_FRIEND").length;
    const married = st.relationship.status === "MARRIED";
    const t = married
      ? bi("우리가 함께 고른 인생", "The Life We Chose Together")
      : st.flags.livedAbroad
        ? bi("멀리까지 걸어온 인생", "A Life That Went Far")
        : friends >= 5
          ? bi("사람들 곁에서", "Among Good People")
          : partners > 1
            ? bi("운명의 사람은 한 명이 아니었다", "There Was More Than One Person of Destiny")
            : bi("조용하고 평범한 행복", "A Quiet, Ordinary Happiness");
    return {
      title: this.L(t),
      summary: this.L(bi(`연애 ${partners} · 친구 ${friends} · 여행 ${trips} · ${Math.floor(st.age)}세`, `Relationships ${partners} · Friends ${friends} · Trips ${trips} · Age ${Math.floor(st.age)}`)),
      lines: s.milestones.slice(-6).map((m) => `${m.age}${s.lang === "ko" ? "세" : ""} · ${m[s.lang]}`),
      age: Math.floor(st.age),
      memorial: this.memorial(),
    };
  }

  // ---- read models for the UI ---------------------------------------------
  hud() {
    const st = this.state;
    const f = this.facts();
    const job = f.employed ? bi(`회사원 L${st.career.level}`, `Employee L${st.career.level}`) : f.student ? bi("학생", "Student") : f.retired ? bi("은퇴", "Retired") : bi("구직 중", "Job hunting");
    const rel = f.married ? bi(`${f.partnerName}와(과) 결혼`, `Married to ${f.partnerName}`) : f.dating ? bi(`${f.partnerName}와(과) 연애 중`, `Dating ${f.partnerName}`) : bi("싱글", "Single");
    return {
      date: this.s.day ? this.L(this.s.day.label) : "",
      age: this.s.lang === "ko" ? `${Math.floor(st.age)}세` : `AGE ${Math.floor(st.age)}`,
      money: krw(st.money, UNIT),
      income: krw(yearlyIncome(st), UNIT),
      job: this.L(job),
      relationship: this.L(rel),
      location: this.s.loc ? this.L(getLocation(this.s.loc).name) : "",
      city: this.s.lang === "ko" ? `${COUNTRY_KO[st.location.country] ?? st.location.country} · ${CITY_KO[st.location.city] ?? st.location.city}` : `${st.location.country} · ${st.location.city}`,
      minute: this.s.minute,
    };
  }

  scene(): PrototypeScene | undefined {
    return this.s.lastScene;
  }

  people() {
    const w = this.state.world;
    if (!w) return [];
    return Object.values(w.relationships)
      .filter((r) => r.stage !== "STRANGER")
      .sort((a, b) => b.closeness - a.closeness)
      .map((r) => ({ id: r.npcId, name: w.npcs[r.npcId]?.name, stage: r.stage, closeness: Math.round(r.closeness * 100), origin: r.origin.type, since: r.origin.firstEncounterDate.year }));
  }

  lifeLog() {
    return this.s.milestones.slice(-30).map((m) => ({ age: m.age, text: m[this.s.lang] }));
  }

  setLang(lang: Lang) {
    this.s.lang = lang;
  }

  /** Dev only: what the Director blocked and why. */
  debugBlocked() {
    return this.director.mem.blocked.slice(-50);
  }

  save(): string {
    const life = { ...this.state, chart: undefined, npcs: this.state.npcs.map((n) => ({ ...n, chart: undefined })) };
    return JSON.stringify({ ...this.s, life });
  }
}

// ---------------------------------------------------------------------------
// Creation / loading
// ---------------------------------------------------------------------------

/** UIs often send null for "unknown" — treat null like "not given". */
function stripNulls<T>(v: T): T {
  if (Array.isArray(v)) return v.map(stripNulls) as T;
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).filter(([, x]) => x !== null && x !== undefined).map(([k, x]) => [k, stripNulls(x)])) as T;
  return v;
}

export function createGame(input: GameSetup): Game {
  const setup = stripNulls(input);
  const seed = setup.seed ?? hash(setup.name, setup.birth.year, setup.birth.month, setup.birth.day, setup.mbti ?? "", Date.now());
  const save: GameSave = {
    v: 1,
    setup,
    seed,
    lang: setup.lang ?? "ko",
    dayIndex: 0,
    minute: CFG.dayStartMinute,
    agenda: [],
    dayPlan: {},
    life: undefined as unknown as LifeState,
    director: newDirectorMemory(),
    over: false,
    milestones: [],
    log: "",
  };
  const g = new Game(save);
  // Backstory: birth → start age, lived in the background.
  const runner = new LifeRunner({ ...g.runnerOptions(hash(seed, "backstory")), mortality: false, excludeTemplates: ["PROPOSAL", "RELATIONSHIP_STRAIN", "LAYOFF", "FAMILY_NEED"] });
  save.life = runner.state;
  const startAge = setup.startAge ?? CFG.startAge;
  while (runner.state.monthIndex < startAge * 12) runner.stepMonth();
  const st = save.life;
  st.alive = true;
  // The game begins single (the destined-person premise); earlier loves become exes.
  if (st.relationship.status !== "SINGLE") {
    const ex = st.npcs.find((n) => n.id === st.relationship.partnerId);
    if (ex) ex.role = "EX";
    if (st.world && st.relationship.partnerId && st.world.relationships[st.relationship.partnerId]) st.world.relationships[st.relationship.partnerId].stage = "EX";
    st.relationship = { status: "SINGLE" };
  }
  st.money = Math.max(st.money, 1.85);
  addFatedPerson(st, setup, new SeededRandom(hash(seed, "fated")));
  initStory(st, birthOf(setup), setup.place, seed);
  save.dayKind = "calm";
  save.milestones.push({ age: startAge, ko: "이야기가 시작된다.", en: "The story begins." });
  g.startDay();
  return g;
}

export function loadGame(json: string): Game {
  const s = JSON.parse(json) as GameSave;
  s.life.chart = calculateNatalChart(birthOf(s.setup));
  s.life.npcs = s.life.npcs.map((n) => ({ ...n, chart: calculateNatalChart(n.birth) }));
  return new Game(s);
}

function birthOf(setup: GameSetup): BirthData {
  const b = setup.birth;
  return { year: b.year, month: b.month, day: b.day, hour: b.hour, minute: b.minute, sex: setup.gender === "M" ? "MALE" : "FEMALE" };
}

/** Place the destined person in the world according to setup ("same" neighborhood, another city, abroad). */
function addFatedPerson(st: LifeState, setup: GameSetup, rng: SeededRandom): void {
  const w = st.world;
  if (!w) return;
  const fx = setup.fated ?? {};
  const gender = fx.gender ?? (setup.likes === "M" ? "M" : setup.likes === "F" ? "F" : rng.chance(0.5) ? "M" : "F");
  const from = fx.from ?? (rng.chance(0.7) ? "same" : rng.chance(0.67) ? "city" : "abroad");
  const where = from === "same" ? ["cafe", "park"] : from === "city" ? ["cooking_class", "gym", "library"] : ["language_exchange_app", "paris_cafe"];
  const home = findLocation(where[0])!;
  const block = (locationId: string, start: number, days: number[]) => ({ locationId, startHour: start, endHour: start + 2, days, attendance: 0.8 });
  const schedule: NPCSchedule =
    from === "same"
      ? { weekday: [block("cafe", 19, [2, 4])], weekend: [block("cafe", 14, [6]), block("park", 11, [0])] }
      : from === "city"
        ? { weekday: [block(where[rng.int(0, 2)], 19, [1, 3, 5])], weekend: [block("library", 13, [6])] }
        : { weekday: [block("language_exchange_app", 21, [1, 2, 3, 4, 5])], weekend: [block("language_exchange_app", 20, [0, 6])] };
  const npc = generateNpc(w, rng, { type: from === "abroad" ? "language_partner" : "regular_customer", region: from === "abroad" ? "online" : home.region, date: st.date, aroundAge: st.age, persistence: "PERSISTENT", schedule });
  npc.sex = gender === "M" ? "MALE" : "FEMALE";
  if (fx.name) {
    npc.name = fx.name;
    // Nobody else in this world may share the destined person's name.
    const pool = ["서준", "도윤", "하준", "지호", "민재", "현우", "지우", "서아", "하린", "유나", "소희", "민지"];
    for (const other of Object.values(w.npcs)) if (other !== npc && other.name === fx.name) other.name = pool[rng.int(0, pool.length - 1)];
    for (const n of st.npcs) if (n.name === fx.name) n.name = pool[rng.int(0, pool.length - 1)];
  }
  if (fx.birth) Object.assign(npc, { birthYear: fx.birth.year, birthMonth: fx.birth.month, birthDay: fx.birth.day });
  npc.single = true;
  npc.fated = true;
  npc.foreign = from === "abroad";
  npc.profile = { mbti: fx.mbti, job: fx.job, from, ...fx.profile };
}

// ---------------------------------------------------------------------------
// Skip-screen summary: what changed while time passed (bilingual, fact-based)
// ---------------------------------------------------------------------------

interface Snap {
  employed: boolean;
  cid: number;
  level: number;
  retired: boolean;
  status: string;
  partner?: string;
  country: string;
  city: string;
  education: string;
  enrolled?: string;
  mom: boolean;
  dad: boolean;
  friends: number;
  trips: string[];
  habits: string[];
  money: number;
}

function snapshot(st: LifeState): Snap {
  const w = st.world;
  const partnerName = st.relationship.partnerId ? st.npcs.find((n) => n.id === st.relationship.partnerId)?.name ?? w?.npcs[st.relationship.partnerId]?.name : undefined;
  return {
    employed: st.career.employed,
    cid: st.career.cid ?? 0,
    level: st.career.level,
    retired: !st.career.employed && st.age >= 65,
    status: st.relationship.status,
    partner: partnerName,
    country: st.location.country,
    city: st.location.city,
    education: st.education,
    enrolled: st.enrollment?.program,
    mom: st.family?.mom.alive ?? true,
    dad: st.family?.dad.alive ?? true,
    friends: Object.values(w?.relationships ?? {}).filter((r) => r.stage === "FRIEND" || r.stage === "CLOSE_FRIEND").length,
    trips: (w?.pastTrips ?? []).map((t) => t.destinationId),
    habits: Object.keys(w?.habits ?? {}),
    money: st.money,
  };
}

function summarize(a: Snap, b: Snap, _lang: Lang): { bi: Bi[] } {
  const out: Array<{ p: number; t: Bi }> = [];
  const add = (p: number, ko: string, en: string) => out.push({ p, t: bi(ko, en) });
  if (a.mom && !b.mom) add(10, "엄마가 세상을 떠났다.", "Mom passed away.");
  if (a.dad && !b.dad) add(10, "아빠가 세상을 떠났다.", "Dad passed away.");
  if (a.status !== "MARRIED" && b.status === "MARRIED") add(9, fixJosa(`${b.partner ?? ""}와(과) 결혼했다.`), `Married ${b.partner ?? ""}.`);
  else if ((a.status === "SINGLE" || a.status === "DIVORCED") && b.status === "DATING") add(8, fixJosa(`${b.partner ?? ""}와(과) 연애를 시작했다.`), `Started dating ${b.partner ?? ""}.`);
  if (a.status === "MARRIED" && b.status === "DIVORCED") add(8, "이혼했다.", "Got divorced.");
  else if ((a.status === "DATING" || a.status === "MARRIED") && b.status === "SINGLE") add(7, fixJosa(`${a.partner ?? ""}와(과) 헤어졌다.`), `Broke up with ${a.partner ?? ""}.`);
  if (a.country !== b.country) add(7, b.country === "Korea" ? "한국으로 돌아왔다." : fixJosa(`${COUNTRY_KO[b.country] ?? b.country}(으)로 떠났다.`), b.country === "Korea" ? "Moved back to Korea." : `Moved to ${b.country}.`);
  else if (a.city !== b.city) add(5, fixJosa(`${CITY_KO[b.city] ?? b.city}(으)로 이사했다.`), `Moved to ${b.city}.`);
  if (!a.retired && b.retired) add(6, "은퇴했다.", "Retired.");
  else if (a.employed && !b.employed) add(6, "회사를 떠났다.", "Left the job.");
  else if (!a.employed && b.employed) add(6, "새 일을 시작했다.", "Started a new job.");
  else if (a.employed && b.employed && a.cid !== b.cid) add(5, "이직했다.", "Changed jobs.");
  if (b.employed && a.cid === b.cid && b.level > a.level) add(5, "승진했다.", "Got promoted.");
  if (b.education !== a.education && EDU_KO[b.education]?.ko) add(5, EDU_KO[b.education].ko + ".", EDU_KO[b.education].en);
  if (!a.enrolled && b.enrolled) add(4, "다시 공부를 시작했다.", "Went back to school.");
  const newTrips = b.trips.slice(a.trips.length);
  for (const d of newTrips.slice(0, 1)) add(3, `${DEST_KO[d] ?? d}에 다녀왔다.`, `Took a trip to ${d}.`);
  if (b.friends > a.friends) add(2, `새로운 친구가 ${b.friends - a.friends}명 생겼다.`, `Made ${b.friends - a.friends} new friend(s).`);
  for (const h of b.habits.filter((x) => !a.habits.includes(x)).slice(0, 1)) add(2, `${getLocation(h).name.ko}에 다니기 시작했다.`, `Started going to ${getLocation(h).name.en}.`);
  if (b.money - a.money > 30) add(1, "돈을 꽤 모았다.", "Saved up a good amount.");
  if (a.money - b.money > 20) add(1, "돈이 많이 나갔다.", "Money got tight.");
  out.sort((x, y) => y.p - x.p);
  const top = out.slice(0, 4).map((x) => x.t);
  return { bi: top.length ? top : [bi("평범한 나날이 이어졌다.", "Ordinary days went by.")] };
}

export { meets };

/** Keep saves small over a long life: forget faint encounters and trim logs. */
function pruneWorld(st: LifeState): void {
  const w = st.world;
  if (!w) return;
  const now = st.date.year * 12 + st.date.month;
  const keep = new Set<string>([...Object.keys(w.relationships), ...Object.values(w.populated).flat()]);
  if (st.relationship.partnerId) keep.add(st.relationship.partnerId);
  for (const [k, h] of Object.entries(w.encounters)) {
    if (!keep.has(h.npcId) || (h.encounterCount < 3 && now - (h.lastSeen.year * 12 + h.lastSeen.month) > 36)) delete w.encounters[k];
  }
  for (const id of Object.keys(w.npcs)) if (!keep.has(id) && !w.npcs[id].fated) delete w.npcs[id];
  for (const m of Object.values(w.locationMemory)) {
    if (m.memories.length > 10) m.memories.splice(0, m.memories.length - 10);
    if (m.importantEvents.length > 10) m.importantEvents.splice(0, m.importantEvents.length - 10);
  }
  for (const h of Object.values(st.history)) {
    if (h.offered.length > 12) h.offered.splice(0, h.offered.length - 12);
    if (h.taken.length > 12) h.taken.splice(0, h.taken.length - 12);
  }
  if (st.memories.length > 150) st.memories.splice(0, st.memories.length - 150);
  w.pastTrips = w.pastTrips.slice(-40).map((t) => ({ ...t, temporaryNPCs: [], memories: t.memories.slice(-5) }));
}
