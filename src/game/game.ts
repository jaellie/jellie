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
import funData from "../../data/game/weekendFun.json";
import occasionData from "../../data/story/occasions.json";
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
import { type LifeState, isAbroad } from "../sim/types";
import { yearlyIncome } from "../sim/lifeTick";
import { LOCATIONS, getActivity, getDestination, getLocation, findLocation } from "../world/catalog";
import { weekdayOf, seasonOf } from "../world/clock";
import { generateNpc, habitSlot, knowsName } from "../world/npcs";
import { aliveSiblings, siblingSender } from "../story/family";
import { type CrowdState, stepCrowd } from "../world/walkers";
import { cultureOf, nameEn, pickName } from "../world/names";
import { marriageFate } from "../story/marriageFate";
import { bondPhase, hasBond, pendingMeetings, updateBond, type BondEnd } from "../story/bond";
import { lifeEvent, nextDueEvent, pendingApplies, queueChain, rollLifeEvents, weekdayOnly } from "../story/lifeEvents";
import { resolveLifeEvent, resolveStaleEvents } from "../story/lifeEventRuntime";
import "../story/eventLibrary";
import { yearSignalMap } from "../story/destinyScript";
import { type AstrologyChart, calculateAstrologyChart } from "../astrology/chart";
import { compatibility } from "../destiny/compatibility";
import { type BirthplaceInput, PLACES, type PlaceInfo, findPlace, joinPlace, resolveBirth } from "../destiny/birthplace";
import { pickMood } from "../story/mood";
import { type RoadView, buildRoad } from "../world/road";
import { readingOf } from "../story/reading";
import { confessFate } from "../story/confessFate";
import { photoFor, setPhotoCulture } from "../integration/prototype";
import { homeVars, nationCode, nationalityOf } from "../story/nationality";
import { currencyFor, formatMoney, localizeMoneyText } from "./currency";
import { pickReflection, reflectionCategory } from "../story/reflections";
import { type FatedFrom, type FatedLife, fatedVars, findFatedJob, resolveFatedLife } from "../story/fatedProfile";
import type { GrandparentRel, Sibling, SiblingRel } from "../sim/types";
import type { RelationshipOriginType } from "../world/types";
import { resolveWorldEvent } from "../world/decisions";
import type { WorldEvent } from "../world/events";
import { endTrip, startTrip } from "../world/travel";
import { composeScene } from "../world/sceneComposer";
import { focusOf, toPrototypeScene, withPositions, type PrototypeScene } from "../integration/prototype";
import { WorldEngine } from "../world/worldEngine";
import type { NPCSchedule } from "../world/types";
import { type LifeFacts, computeFacts, meets } from "./facts";
import { STORY_ONLY_TEMPLATES, dueOccasion, isBigMoment, startArc, eventDayWanted, upcomingHint, ensureArcs, fillStory, hintFor, initStory, isGrave, monthlyStoryTick, patientLabel, resolveStory, scheduleNext, storyPopup, fatedEvent, confessReading } from "../story/storyEngine";
import { buildCards, type MemoryCard } from "../story/cards";
import memorialData from "../../data/story/memorial.json";
import { AutoWorldPolicy } from "../world/decisions";
import { DIRECTOR_CONFIG as CFG, Director, type DirectorMemory, newDirectorMemory, SPEAKER_FALLBACK, SPEAKER_REQUIRES } from "./director";
import { type Bi, type Lang, CITY_KO, cityKo, englishPayload, mapPayload, COUNTRY_KO, DEST_KO, EDU_KO, SPEAKER_NAME, bi, fillNames, fixJosa, krw, langVars } from "./text";

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
  /** The player's job: an id from LoveSim.myJobOptions(lang) (or its name / free text). Default: office worker. */
  job?: string;
  /**
   * Where the player was born: a city name ("부산", "New York", "LA") or coordinates
   * ({ lat, lon, tz? }). Sets the Ascendant/MC/houses and the clock (historical UTC offset,
   * daylight time) for the birth time. Default: Seoul.
   */
  birthplace?: BirthplaceInput;
  /**
   * Where the player lives now ("부산", "Tokyo"): the story's home — the city on the road, who's local, the
   * destined person's "same neighborhood". Not used for the charts (those use `birthplace`). Default: the birthplace city.
   */
  home?: string;
  /** Nationality (country code, e.g. "KR", "US" — see nationalityOptions()). Where home and family are. Default: the birthplace's country. */
  nationality?: string;
  /** @deprecated coordinates only — use `birthplace`. */
  place?: BirthPlace;
  lang?: Lang;
  seed?: number;
  startAge?: number;
  /**
   * The "destined person" from setup. They exist in the world; romance is never guaranteed —
   * hidden 궁합 (사주 + synastry + MBTI) and the player's choices decide.
   *  status "crush" (default when named): someone you already know and like — not your partner.
   *  status "dating": you're already together at the start.
   *  status "stranger" (default when unnamed): fate introduces you later.
   */
  fated?: {
    name?: string;
    gender?: "F" | "M";
    mbti?: string;
    birth?: { year: number; month: number; day: number; hour?: number; minute?: number };
    /** Where they were born (city name or coordinates). Default: the player's birthplace. */
    birthplace?: BirthplaceInput;
    /** Their nationality (country code). Default: where they were born, else where they live. Decides their name too. */
    nationality?: string;
    /** Where they live: the same neighborhood, another city, another country (see fatedOptions()). */
    from?: FatedFrom;
    /** Their city when they live elsewhere ("부산", "Tokyo"). Default: their birthplace abroad, or a pick. */
    city?: string;
    /**
     * Are you two dating? "dating": yes — start as a couple. "talking": 썸 — you know each other and it's
     * in the air; the game plays the texts, the not-a-date, the jealousy, up to the confession
     * ("crush" means the same). "stranger": you don't know each other yet — start from the first meeting.
     */
    status?: "married" | "dating" | "talking" | "acquaintance" | "crush" | "stranger";
    /** married: the wedding date; dating: the day you got together. The story starts on that day (anniversaries follow it). */
    since?: { year: number; month: number; day?: number };
    /**
     * Leave them entirely to fate (also when nothing about them is given): the chart decides who they are —
     * the one you marry and grow old with, or, for a solitary chart (혼자 살 사주), your last love.
     */
    sealed?: boolean;
    /** Their job: an id from fatedOptions().jobs, or free text ("대학병원 의사"). */
    job?: string;
    profile?: Record<string, unknown>;
  };
  /** The player's family at the start. Everything is optional; missing parts are filled in plausibly. */
  family?: {
    mom?: { alive?: boolean; name?: string; birthYear?: number };
    dad?: { alive?: boolean; name?: string; birthYear?: number };
    /** rel: 언니/오빠/누나/형/남동생/여동생 (or OLDER_SISTER…); birthYear, or gap = years older (+) / younger (−). */
    siblings?: Array<{ rel: string; name?: string; birthYear?: number; gap?: number; gender?: "F" | "M" }>;
    /** How many grandparents are alive at the start (0–4). */
    grandparents?: number;
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
  /** First day only, when years were skipped to the meeting: "그 사람을 만나기까지, 12년이 흘렀다." Show it on a fade before the road. */
  prologue?: string;
}

export interface Popup {
  id: string;
  source: "opportunity" | "world" | "story" | "plan" | "event" | "occasion";
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
  /**
   * A life-changing moment (proposal, wedding, funeral, birth, betrayal…): show the big popup —
   * `title` in a banner and `scene` as the picture in the middle (draw it like game.scene()).
   */
  big?: boolean;
  scene?: PrototypeScene;
  /**
   * A destined turning point: the chart signals behind it, in words ("사주: 도화 · 천간합  /  점성술: 목성
   * 5하우스  /  상대: 역마"). Show it small under the title — the hand of fate, made visible.
   */
  reading?: string;
}

export type Beat =
  | { kind: "enter"; locationId: string; room?: string; name: string; log?: string }
  | { kind: "popup"; popup: Popup }
  | { kind: "toast"; from: string; text: string; role?: string; gender?: "M" | "F"; seed?: number; fated?: boolean }
  /** @deprecated never emitted any more — the top line is the day's mood (below). */
  | { kind: "log"; text: string }
  /**
   * The mood line at the top of the play screen, once at the start of each played day: a feeling that
   * foreshadows (from your chart and what's coming) — "(요즘 자꾸 해외로 나가고 싶다.)". No time.
   */
  | { kind: "mood"; text: string }
  | { kind: "dayEnd" };

export interface ChoiceResult {
  who: string;
  name?: string;
  line: string;
  log?: string;
  /** A drama-style line that stays with you after a big moment (shown under the result). */
  quote?: string;
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
  vars?: Record<string, string>;
  /** A life event from the library (see story/lifeEvents). */
  eventUid?: string;
  /** A celebration (100일, an anniversary, a birthday): its choices' replies. */
  occasion?: Array<{ ko: string; en: string }>;
}

export interface PlanOption {
  id: string;
  kind: "place" | "trip" | "home" | "friend" | "date";
  locationId?: string;
  activityId?: string;
  destination?: string;
  withPartner?: boolean;
  label: Bi;
  /** A fun pick's own little reply ("(인생네컷: 머리띠를 다섯 개나 써 봤다.)") instead of "(좋아, 가보자!)". */
  reply?: Bi;
}

interface AgendaItem {
  t: number;
  k: "major" | "small" | "message" | "plan" | "story" | "story2" | "hint" | "event" | "occasion";
}

export interface GameSave {
  v: 1;
  /** Travel lines already told today ("partner", "home"): the flight is mentioned once, not every popup. */
  bridged?: { day: number; keys: string[] };
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
    sequence?: Array<{ locationId: string; from: number; until: number; activityId?: string; keep?: boolean }>;
    fatedPresent?: boolean;
    /** The partner is part of today's story moment (a date, the proposal). */
    partnerPresent?: boolean;
  };
  /** Why today is played: calm / fated / foreshadow / arc (story engine). */
  dayKind?: "calm" | "fated" | "foreshadow" | "arc";
  dayRef?: string;
  /** A second, lighter story moment sharing today (afternoon). */
  dayKind2?: "fated" | "arc";
  dayRef2?: string;
  /** Today's life event (library), if one surfaces. */
  eventUid?: string;
  /** Fated event foreshadowed today. */
  hintRef?: string;
  /** Today's mood line (shown at the top) and whether the beat went out; the last few, to avoid repeats. */
  mood?: string;
  moodShown?: boolean;
  recentMoods?: string[];
  pending?: Pending;
  life: LifeState;
  director: DirectorMemory;
  over: boolean;
  milestones: Array<{ age: number; ko: string; en: string }>;
  /** Shown before the first day when the years before the meeting were skipped. */
  prologue?: Bi;
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
  private crowd?: CrowdState;

  constructor(save: GameSave) {
    this.s = save;
    this.director = new Director(save.director);
    // English game: everything handed to the UI is English-only — family words translated, Korean
    // names romanized (재윤 → Jaeyun). The engine keeps its own data as is.
    for (const m of ["advance", "choose", "endDay", "memorial", "ending", "hud", "scene", "road", "people", "lifeLog", "mood", "doActivity", "goTo", "leave", "fated"] as const) {
      const fn = (this as unknown as Record<string, (...a: unknown[]) => unknown>)[m];
      if (typeof fn !== "function") continue;
      (this as unknown as Record<string, unknown>)[m] = (...a: unknown[]) => {
        setPhotoCulture(this.s.lang === "en" ? "west" : "ko");
        const r = fn.apply(this, a);
        // Amounts in story text in the player's own currency (won stays as written).
        const cur = currencyFor(nationalityOf(this.state));
        const lang = this.s.lang ?? "ko";
        const m = cur === "KRW" ? r : mapPayload(r, (t) => localizeMoneyText(t, cur, lang));
        return lang === "en" ? englishPayload(m) : m;
      };
    }
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
    return birthOf(this.s.setup);
  }
  /** The player's birth as the charts read it: birthplace, clock offset, daylight time taken out for 사주. */
  birthInfo(): { birth: BirthData; place: BirthPlace; clockOffsetMinutes: number; dstMinutes: number; known: boolean } {
    return birthResolved(this.s.setup);
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
      profile: { name: st.name, mbti: st.mbti, birthPlace: placeOf(st) },
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
    const t = fillNames(text, { ...langVars({ ...homeVars(this.state), ...fatedVars(this.state) }, this.s.lang ?? "ko"), partner: f.partnerName, friend: f.friendName, crush: f.crushName, fated: f.fatedName, sibling: this.siblingSender(), me: this.s.setup.name, spouse: this.spouseWord() });
    return this.s.lang === "ko" ? fixJosa(t) : t;
  }
  /** 남편 / 아내 when married, else 애인 (mood lines: "(남편이 요즘 휴대폰을 엎어 둔다.)"). */
  private spouseWord(): string {
    const st = this.state;
    const pid = st.relationship.partnerId;
    const sex = pid ? st.npcs.find((n) => n.id === pid)?.birth.sex ?? st.world?.npcs[pid]?.sex : undefined;
    const married = st.relationship.status === "MARRIED";
    if (this.s.lang === "en") return married ? (sex === "MALE" ? "your husband" : sex === "FEMALE" ? "your wife" : "your spouse") : "your partner";
    return married ? (sex === "MALE" ? "남편" : sex === "FEMALE" ? "아내" : "배우자") : "애인";
  }

  /** Today's mood line (also sent once as a {kind:"mood"} beat at the start of the day). */
  mood(): string | undefined {
    return this.s.mood;
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
    if (role === "crush") return fromNpc(this.facts().crushId) ?? {};
    if (role === "sibling") {
      const sib = aliveSiblings(st)[0];
      if (sib) return { gender: sib.sex === "MALE" ? "M" : "F", seed: sib.spriteSeed };
    }
    if (role === "kid" && st.kids?.[0]) return { gender: st.kids[0].sex === "MALE" ? "M" : "F", seed: st.kids[0].spriteSeed };
    if (role === "ex") {
      const ex = [...st.npcs].reverse().find((n) => n.role === "EX");
      if (ex) return fromNpc(ex.id) ?? {};
    }
    if (role === "fated" && w) {
      const fated = Object.values(w.npcs).find((n) => n.fated);
      if (fated) return fromNpc(fated.id) ?? {};
    }
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
  /** The line for the moment just resolved: by the memory card it made (or the life event's category). */
  private reflect(cardsBefore: number, eventCat: string | undefined, chance: number): string | undefined {
    const st = this.state;
    const kinds = (st.story?.cards ?? []).slice(cardsBefore).map((c) => c.kind);
    const cat = reflectionCategory(kinds, eventCat);
    if (!cat || !this.rng(`quote${this.s.dayIndex}:${st.story?.cards.length ?? 0}`).chance(chance)) return;
    const line = pickReflection(st, cat, this.rng(`quotePick${this.s.dayIndex}:${cat}`));
    return line ? this.L(line) : undefined;
  }
  private speaker(role: string): string {
    const f = this.facts();
    if (role === "partner") return f.partnerName ?? this.L(bi("연인", "Partner"));
    if (role === "friend") return f.friendName ?? this.L(bi("친구", "Friend"));
    if (role === "crush") return f.crushName ?? this.L(bi("친구", "Friend"));
    if (role === "sibling") return this.siblingSender() ?? this.L(bi("형제", "Sibling"));
    if (role === "kid") return f.kidName ?? this.L(bi("아이", "My kid"));
    if (role === "ex") return f.exName ?? this.L(bi("전 애인", "My ex"));
    if (role === "fated" && f.fatedName) return f.fatedName;
    return this.L(SPEAKER_NAME[role] ?? bi(role, role));
  }
  /** The living sibling who texts you: an older one by title (오빠), a younger one by name. */
  private siblingSender(): string | undefined {
    const sib = aliveSiblings(this.state)[0];
    return sib ? this.L(siblingSender(this.state, sib)) : undefined;
  }

  // ---- day structure --------------------------------------------------------
  startDay(): DayInfo {
    const s = this.s;
    const st = this.state;
    const rng = this.rng("day");
    const date = { year: st.date.year, month: st.date.month, day: rng.int(1, 28) };
    // Quiet days are often weekends — that's when you choose how to spend your time —
    // unless today's life event happens somewhere closed at weekends (the court, the office).
    const upcoming = st.story ? nextDueEvent(st, { ...computeFacts(st), weekend: false }) : undefined;
    const needWeekday = !!upcoming && weekdayOnly(upcoming.def);
    const nextDay = (d: typeof date) => (d.day = d.day >= 28 ? 1 : d.day + 1);
    if ((s.dayKind ?? "calm") === "calm" && rng.chance(0.5) && !needWeekday) {
      while (![0, 6].includes(weekdayOf(date.year, date.month, date.day))) nextDay(date);
    }
    if (needWeekday) while ([0, 6].includes(weekdayOf(date.year, date.month, date.day))) nextDay(date);
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
      ...(s.dayIndex === 0 && s.prologue ? { prologue: this.L(s.prologue) } : {}),
    };
    s.minute = CFG.dayStartMinute;
    s.loc = undefined;
    // People you meet now are locals of where you live (Tokyo → Japanese names).
    if (st.world) st.world.country = st.location.country;
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
      s.dayPlan.partnerPresent = !!storyDef.needsPartner;
      agenda.push({ t: 660, k: "story" });
      b.major = 0; // no random big offers competing with a destined moment
      b.small = Math.min(b.small, 1);
      // A grave day (funeral, the hospital call, betrayal…) or a big moment told in several popups is quiet:
      // no chores, no casual texts — never a pile of popups in a row.
      if (isGrave(st, s.dayKind!, s.dayRef!) || isBigMoment(st, s.dayKind, s.dayRef)) {
        b.small = 0;
        b.messages = 0;
      }
      // A second moment shares the day: morning at the first place, afternoon at the second.
      const def2 = s.dayKind2 && s.dayRef2 ? storyPopup(st, s.dayKind2, s.dayRef2, this.facts(), this.rng("storydef2"), { peek: true }) : undefined;
      if (def2) {
        s.dayPlan.override = undefined;
        s.dayPlan.sequence = [
          { locationId: storyDef.location, activityId: storyDef.activity, from: 600, until: 840 },
          { locationId: def2.location, activityId: def2.activity, from: 840, until: 1080, keep: true },
        ];
        s.dayPlan.fatedPresent = !!storyDef.needsFated || !!def2.needsFated;
        s.dayPlan.partnerPresent = !!storyDef.needsPartner || !!def2.needsPartner;
        agenda.push({ t: 900, k: "story2" });
        b.small = 0;
        b.messages = Math.min(b.messages, 1);
      } else {
        s.dayKind2 = undefined;
        s.dayRef2 = undefined;
      }
    } else {
      agenda.push({ t: rng.int(620, 1020), k: "major" });
      if (weekend) agenda.push({ t: 600, k: "plan" });
    }
    // A life event (the library) surfaces on any day that isn't grave — at most one, never beside a second story moment.
    s.eventUid = undefined;
    const graveDay = !!storyDef && (isGrave(st, s.dayKind!, s.dayRef!) || isBigMoment(st, s.dayKind, s.dayRef));
    const ev = !graveDay && !s.dayRef2 ? nextDueEvent(st, this.facts()) : undefined;
    if (ev) {
      s.eventUid = ev.pending.uid;
      const t = storyDef ? 900 : rng.int(660, 960);
      agenda.push({ t, k: "event" });
      if (!storyDef) b.major = 0; // the event is today's big thing
      if (ev.def.location) {
        const seg = { locationId: ev.def.location, activityId: ev.def.activity, from: storyDef ? 840 : t - 30, until: storyDef ? 1080 : Math.min(1260, t + 150), keep: true };
        if (storyDef) {
          s.dayPlan.override = undefined;
          s.dayPlan.sequence = [{ locationId: storyDef.location, activityId: storyDef.activity, from: 600, until: 840 }, seg];
        } else s.dayPlan.sequence = [seg];
      }
    }
    // A celebration due (100일, an anniversary, a birthday coming up): its own moment, never on a grave day.
    if (dueOccasion(st) && !graveDay) agenda.push({ t: storyDef ? 1110 : 690, k: "occasion" });
    // The day's mood: a feeling that foreshadows (the chart, what's coming) — not a log of what happened.
    const mood = pickMood(st, this.facts(), this.yearSignals(), this.rng("mood"), s.recentMoods ?? []);
    s.recentMoods = [...(s.recentMoods ?? []), mood.ko].slice(-5);
    if (mood.source.startsWith("fated:")) {
      const soon = upcomingHint(st);
      if (soon) soon.hinted = true;
    }
    s.mood = this.fill(fillStory(this.L(mood), st, this.facts()));
    s.moodShown = false;
    storyDef = undefined;
    for (let i = 0; i < b.small; i++) agenda.push({ t: rng.int(480, 1320), k: "small" });
    for (let i = 0; i < b.messages; i++) agenda.push({ t: rng.int(450, 1350), k: "message" });
    s.agenda = agenda.sort((a, c) => a.t - c.t);
    return s.day;
  }

  /** During a story day's destined hours, the place itself stays quiet (the story is the event). */
  private storyMoment(): boolean {
    const s = this.s;
    return (s.dayKind === "fated" || s.dayKind === "arc") && s.minute >= 600 && s.minute < 1080;
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
      // Your workplace: the hospital for a nurse, your own café for a barista, home for a writer.
      const work = myJob(st)?.work ?? "office";
      if (work === "home") return minute >= 600 && minute < 1020 ? "home" : evening(minute);
      if (minute < 510) return "home";
      if (minute < 540) return "street";
      if (minute < 1080) return work === "none" ? "office" : work;
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
    return this.tidy(this.step(toMinute));
  }

  /**
   * A leading "[이름]" in a text is who's talking ("[아빠] 차 조심해라", "[응급실] …"): show it as the
   * sender/speaker name and drop it from the text, so a name never appears twice. Content tags like
   * "[사진]" stay in the text.
   */
  private tidy(beats: Beat[]): Beat[] {
    for (const b of beats) {
      if (b.kind === "toast") {
        const t = splitSpeakerTag(b.text);
        if (t.tag) (b.from = t.tag), (b.text = t.text);
      } else if (b.kind === "popup") {
        const t = splitSpeakerTag(b.popup.line);
        if (t.tag) (b.popup.name = t.tag), (b.popup.line = t.text);
      }
    }
    return beats;
  }

  private step(toMinute: number): Beat[] {
    const s = this.s;
    const beats: Beat[] = [];
    if (s.over || s.pending || !s.day) return beats;
    if (!s.moodShown && s.mood) {
      s.moodShown = true;
      beats.push({ kind: "mood", text: s.mood });
    }
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
      { state: st, world: st.world, modifiers: this.runner().modifiers(), rng: this.rng("visit", locationId, activityId ?? ""), seed: s.seed, withPartner, attraction: this.attraction(), trip: st.world.travel, facts: this.facts(), quiet: this.storyMoment() },
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
    // Online places are home too (you're on your phone), so the household is around.
    const atHome = locationId === "home" || !!getLocation(locationId).online;
    const partnerHere = withPartner || (!!s.dayPlan.partnerPresent && this.storyMoment()) || (atHome && (st.relationship.status === "MARRIED" || !!st.flags.longterm) && (s.minute >= 1140 || !!s.day?.weekend));
    s.lastScene = toPrototypeScene(composeScene(r, st.world, st, { withPartner: partnerHere, household: atHome }));
    const beats: Beat[] = [];
    for (const e of r.events) {
      // The game is about the destined person: no sparks with someone new on the side.
      if (e.kind === "ROMANCE_OPPORTUNITY" && hasBond(st) && !(e.npcId && st.world.npcs[e.npcId]?.fated)) continue;
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
      // Everyday world moments ("하윤과 처음으로 제대로 대화했다") stay in the world's memory — the top
      // line belongs to the day's mood, not to a log.
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
    if (item.k === "story2") return this.fireStory(2);
    if (item.k === "event") return this.fireEvent();
    if (item.k === "occasion") return this.fireOccasion();
    if (item.k === "hint") return; // old saves: hints now live in the mood line
    if (item.k === "major") return this.fireMajor();
    if (item.k === "small") return this.fireSmall();
    if (item.k === "message") return this.fireMessage();
    return this.firePlan();
  }

  /** A life event from the library: re-checked now (facts may have changed), big ones get the big popup. */
  /**
   * Distance never goes unexplained. A scene that needs someone physically there, when they live far
   * away, opens with how they got there: "(Ren이 도쿄에서 비행기를 타고 왔다.)"; family news while you
   * live abroad: "(갑작스러운 소식에 급히 비행기를 탔다.)". Once per day and kind.
   */
  private travelBridge(o: { location?: string; who?: string; partner?: boolean; fated?: boolean; family?: boolean; toPartner?: boolean }): Bi | undefined {
    const s = this.s;
    const st = this.state;
    const loc = o.location ?? "";
    if (["instagram", "language_exchange_app", "dating_app", "online_community"].includes(loc)) return;
    const life = st.story?.fatedLife;
    const told = s.bridged?.day === s.dayIndex ? s.bridged.keys : [];
    const mark = (k: string, b: Bi) => {
      if (told.includes(k)) return undefined;
      s.bridged = { day: s.dayIndex, keys: [...told, k] };
      return b;
    };
    // They're far away and something happened to them: you're the one who goes.
    if (o.toPartner && st.relationship.longDistance && life) {
      return mark("toPartner", life.from === "abroad"
        ? bi("(가장 빠른 {fatedCity}행 비행기를 탔다. 가는 내내 손이 떨렸다.)", "(You took the fastest flight to {fatedCity}. Your hands shook the whole way.)")
        : bi("(곧장 {fatedCity}행 기차에 올랐다. 가는 내내 손이 떨렸다.)", "(You got straight on a train to {fatedCity}. Your hands shook the whole way.)"));
    }
    // Someone you love lives in another city or country, and the scene has them here.
    const fatedNpc = Object.values(st.world?.npcs ?? {}).find((n) => n.fated);
    const withFated = !!fatedNpc && st.relationship.partnerId === fatedNpc.id;
    const partnerFar = (o.partner || o.who === "partner") && !!st.relationship.longDistance && loc !== "home" && loc !== "airport";
    const fatedFar = (o.fated || o.who === "fated") && !withFated && !!life && life.from !== "same" && loc !== "airport" && loc !== "home" && !!st.world?.relationships[fatedNpc?.id ?? ""];
    if (partnerFar || fatedFar) {
      const k = partnerFar ? "{partner}" : "{fated}";
      const abroad = life?.from === "abroad";
      return mark("partner", abroad
        ? bi(`(${k}이(가) {fatedCity}에서 비행기를 타고 왔다.)`, `(${k} flew in from {fatedCity}.)`)
        : bi(`(${k}이(가) {fatedCity}에서 기차를 타고 왔다.)`, `(${k} came up from {fatedCity} by train.)`));
    }
    // You live abroad; this happens back home.
    if ((o.family || ["funeral_hall", "family_home", "family_restaurant"].includes(loc) || (loc === "hospital" && o.family)) && isAbroad(st)) {
      if (loc === "funeral_hall") return mark("home", bi("(갑작스러운 소식에 급히 비행기를 탔다. 비행 내내 한숨도 못 잤다.)", "(The news came out of nowhere. You caught the first flight home and didn't sleep the whole way.)"));
      if (loc === "hospital") return mark("home", bi("(연락을 받자마자 공항으로 갔다. 집으로 가는 가장 빠른 비행기를 탔다.)", "(The moment the call came, you went to the airport and took the fastest flight home.)"));
      return mark("home", bi("(오랜만에 집으로 가는 비행기를 탔다.)", "(You flew home for the first time in a while.)"));
    }
    return undefined;
  }

  /** The line with its travel bridge in front (see travelBridge). */
  private bridged(line: string, b: Bi | undefined, vars: Record<string, string> = {}): string {
    if (!b) return line;
    const t = this.fill(fillStory(this.L(b), this.state, this.facts(), vars));
    // The news itself ("부고 문자가 왔다…"): the flight comes after it; already at the funeral: before.
    const news = (b.ko.startsWith("(갑작스러운 소식") || b.ko.includes("손이 떨렸다")) && !/장례식장|영정|빈소|funeral|portrait/i.test(line);
    return news ? `${line} ${t}` : `${t} ${line}`;
  }

  /**
   * The popup picture: a snapshot of the scene. On a painted background only you — and, when the moment
   * is about them, your partner / the one you're falling for — stand in it (photoCast), even if the
   * live scene hadn't placed them yet.
   */
  private photoScene(withWho?: "partner" | "fated", paint?: string): PrototypeScene | undefined {
    const st = this.state;
    if (!this.s.lastScene) return undefined;
    const sc = JSON.parse(JSON.stringify(this.s.lastScene)) as PrototypeScene;
    // A moment with its own light (the first kiss: dusk, then moonlight).
    const own = paint ? photoFor(paint) : undefined;
    if (own === `bg/${paint}.png`) sc.photo = own;
    if (!sc.photo) return sc;
    const me = sc.actors.find((a) => a.role === "me");
    const cast = me ? [me.who] : [];
    const fatedNpc = Object.values(st.world?.npcs ?? {}).find((n) => n.fated);
    // Alone in your room on the phone (an app match, 2 a.m. texts, a call): just you. Only someone you
    // live with (your spouse) is home with you.
    const remote = !!sc.online || (sc.sceneKey === "home" && st.relationship.status !== "MARRIED");
    if (remote) withWho = undefined;
    const id = withWho === "partner" ? st.relationship.partnerId : withWho === "fated" ? fatedNpc?.id : undefined;
    const npc = id ? st.world?.npcs[id] : undefined;
    if (id && npc && !npc.deceased) {
      let a = sc.actors.find((x) => x.role === withWho || x.who === id);
      if (!a && me) {
        a = { ...me, who: id, role: withWho!, name: npc.name, seed: npc.spriteSeed, gender: npc.sex === "MALE" ? "M" : "F", fated: !!npc.fated, familiar: true } as typeof me;
        sc.actors.push(a);
      }
      if (a) cast.push(a.who);
    }
    sc.photoCast = cast;
    return sc;
  }

  private fireEvent(): Beat | undefined {
    const s = this.s;
    const st = this.state;
    const f = this.facts();
    const p = st.story?.events?.pending.find((x) => x.uid === s.eventUid);
    const def = p ? lifeEvent(p.id) : undefined;
    if (!p || !def || !pendingApplies(st, p, def, f)) return;
    const vars = langVars({ sibling: f.siblingName ?? "", sister: f.sisterName ?? "", brother: f.brotherName ?? "", ex: f.exName ?? "", kid: f.kidName ?? "", me: s.setup.name, ...p.vars }, s.lang);
    const popup: Popup = {
      id: `ev${s.dayIndex}`,
      source: "event",
      who: def.who,
      name: this.speaker(def.who),
      ...this.portrait(def.who),
      title: def.title ? this.fill(fillStory(this.L(def.title), st, f, vars)) : undefined,
      line: this.bridged(this.fill(fillStory(this.L(def.line), st, f, vars)), this.travelBridge({ location: def.location, who: def.who }), vars),
      ch: def.choices.map((c) => ({ t: this.fill(fillStory(this.L(c.t), st, f, vars)) })),
      big: !!def.big,
      scene: def.big ? this.photoScene(def.who === "partner" ? "partner" : def.who === "fated" ? "fated" : undefined) : undefined,
    };
    s.pending = { popup, eventUid: p.uid, vars };
    return { kind: "popup", popup };
  }

  private fireStory(slot: 1 | 2 = 1): Beat | undefined {
    const s = this.s;
    const st = this.state;
    const f = this.facts();
    const kind = slot === 2 ? s.dayKind2 : s.dayKind;
    const ref = slot === 2 ? s.dayRef2 : s.dayRef;
    if ((kind !== "fated" && kind !== "arc") || !ref) return;
    // Evaluated now (after the morning's moment resolved), so it can never contradict it.
    const def = storyPopup(st, kind, ref, f, this.rng(slot === 2 ? "storydef2" : "storydef"));
    if (!def) return;
    const ev = kind === "fated" ? fatedEvent(st, ref) : undefined;
    const patientKey = (ev?.data?.patient as string | undefined) ?? (st.story?.arcs.find((a) => a.id === ref)?.data?.patient as string | undefined);
    const patient = patientKey ? this.L(patientLabel(st, patientKey, f)) : "";
    const fatedNpc = Object.values(st.world?.npcs ?? {}).find((n) => n.fated);
    const who = def.who === "fated" ? "fated" : def.who;
    const portrait = def.who === "fated" && fatedNpc ? this.portrait("npc", fatedNpc.id) : this.portrait(def.who === "inlaw" || def.who === "judge" || def.who === "nurse" || def.who === "doctor" ? def.who : def.who);
    const vars = { patient, ...def.vars };
    const popup: Popup = {
      id: `story${s.dayIndex}${slot === 2 ? "b" : ""}`,
      source: "story",
      who,
      name: def.who === "fated" ? (fatedNpc ? this.npcLabel(fatedNpc.id) : this.L(bi("낯선 사람", "Stranger"))) : this.speaker(def.who),
      ...portrait,
      title: def.title ? this.L(def.title) : undefined,
      reading: ev ? (() => {
        const r = readingOf(ev.signals);
        return r ? this.L(r) : undefined;
      })() : (() => {
        const arc = st.story?.arcs.find((a) => a.id === ref);
        const r = confessReading(st, arc, arc?.steps[arc.step]?.key);
        return r ? this.L(r) : undefined;
      })(),
      line: this.bridged(this.fill(fillStory(this.L(def.line), st, f, vars)), (() => {
        const arc = kind === "arc" ? st.story?.arcs.find((a) => a.id === ref) : undefined;
        const family = arc?.type === "FAMILY_PASSING" || (!!patientKey && !["self", "me", "partner", "kid", "friend"].includes(patientKey));
        const toPartner = arc?.type === "PARTNER_PASSING" || patientKey === "partner";
        // Two families, two languages: the 상견례 with a translation app on the table.
        const theirNat = fatedNpc?.profile?.nationality as string | undefined;
        if (arc?.steps[arc.step]?.key === "MEET_PARENTS" && theirNat && theirNat !== String(st.flags.nationality ?? "KR")) {
          return bi("(두 나라 말이 오가는 상견례. 테이블 위 번역 앱이 쉬지 않았다.)", "(Two families, two languages. The translation app on the table never got a break.)");
        }
        return this.travelBridge({ location: def.location, who: def.who, partner: def.needsPartner && !toPartner, fated: def.needsFated, family, toPartner });
      })(), vars),
      ch: def.choices.map((c) => ({ t: this.fill(fillStory(this.L(c), st, f, vars)) })),
      // Life-changing moments get the big popup with the scene as its picture.
      big: true,
      scene: this.photoScene(((): "partner" | "fated" | undefined => {
        const arcType = kind === "arc" ? st.story?.arcs.find((a) => a.id === ref)?.type : undefined;
        if (def.needsFated || def.who === "fated" || arcType === "TALKING") return "fated";
        const couple = arcType === "DATING" || arcType === "ENGAGEMENT" || arcType === "PARTING" || arcType === "PREGNANCY";
        if ((def.needsPartner || def.who === "partner" || couple) && !st.relationship.longDistance) return "partner";
        return undefined;
      })(), (() => {
        // The first kiss gets darker as it nears: dusk for the lead-up, moonlight for "달빛 아래".
        const arc = kind === "arc" ? st.story?.arcs.find((a) => a.id === ref) : undefined;
        if (arc?.type !== "DATING" || arc.steps[arc.step]?.key !== "FIRST_KISS") return undefined;
        return def.title?.ko === "달빛 아래" ? "park_night" : "park_evening";
      })()), // a snapshot (wander() keeps moving the live scene)
    };
    s.pending = { popup, storyRef: def.ref, patient, vars };
    return { kind: "popup", popup };
  }

  private fireOccasion(): Beat | undefined {
    const st = this.state;
    const o = dueOccasion(st);
    if (!o) return;
    st.story!.occasions = st.story!.occasions!.filter((x) => x !== o);
    const def = (OCCASIONS as Record<string, OccasionDef>)[o.kind];
    const f = this.facts();
    const solo = !f.partnered && !!def.solo;
    if (!f.partnered && !solo) return;
    const vars = { n: String(o.n ?? 1) };
    const sub = (b: Bi) => this.fill(fillStory(this.L(b), st, f, vars));
    // Living apart (long distance, or apart for work): a video call, a parcel, a flight — never "where shall we go?".
    const apart = !solo && !!st.relationship.longDistance && !!def.apart;
    // Together: one of several ways the day can go (never the same one twice in a row).
    const forms = [{ line: def.line, choices: def.choices }, ...(def.variants ?? [])];
    const lastKey = `occLast_${o.kind}`;
    const fi = solo || apart || forms.length < 2 ? 0 : ((n) => (n >= Number(st.flags[lastKey] ?? -1) ? n + 1 : n))(this.rng(`occ${this.s.dayIndex}`).int(0, forms.length - 2));
    if (!solo && !apart) st.flags[lastKey] = fi;
    const form = forms[Math.min(fi, forms.length - 1)];
    const choices = solo ? def.soloChoices ?? def.choices : apart ? def.apart!.choices : form.choices;
    const who = solo ? "me" : def.who;
    const popup: Popup = {
      id: `occ${this.s.dayIndex}-${o.kind}`,
      source: "occasion",
      who,
      name: this.speaker(who),
      ...this.portrait(who === "partner" ? "partner" : who),
      title: sub(def.title),
      line: sub(solo ? def.solo! : apart ? def.apart!.line : form.line),
      ch: choices.map((c) => ({ t: sub(c.t) })),
      big: true,
      scene: this.photoScene(solo || apart ? undefined : "partner"),
    };
    this.s.pending = { popup, occasion: choices.map((c) => ({ ko: fillStory(c.r.ko, st, f, vars), en: fillStory(c.r.en, st, f, vars) })), vars };
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
    // Living apart, your partner isn't there to cook dinner or ask "what day is it today?" in person.
    const cands = STORIES.filter((x) => (x.where.includes(here.type) || x.where.includes(here.id)) && !(f.apart && x.who === "partner"));
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

  /**
   * The house the current Lunar Return lights up = this month's emotional focus.
   * With a birth time: the LR Moon's house. Without one the LR angles are unreliable
   * (and the LR Moon always sits on the natal Moon), so the LR Sun's natal house is used.
   */
  lunarFocusHouse(): number {
    const lr = this.runner().destiny.astrologyAt(this.state.date).lunarReturn;
    return (lr.anglesReliable ? lr.houses.MOON : lr.natalHouses.SUN) ?? 1;
  }

  // ---- life events (library) -----------------------------------------------
  private signalCache?: { age: number; map: Record<string, number> };
  private astroChart?: AstrologyChart;

  /** This age-year's 사주/점성술 signals (도화, 역마, 편재, 삼재, transits, progressions…). */
  private yearSignals(): Record<string, number> {
    const st = this.state;
    const age = Math.floor(st.age);
    if (this.signalCache?.age === age) return this.signalCache.map;
    this.astroChart ??= calculateAstrologyChart(birthOf(this.s.setup), placeOf(this.s.setup));
    const map = yearSignalMap(st.chart ?? calculateNatalChart(birthOf(this.s.setup)), this.astroChart, st.birth.year, age);
    this.signalCache = { age, map };
    return map;
  }

  /** Monthly while time passes: maybe a new life event; long-waiting ones resolve off-screen. */
  private eventTick(runner: LifeRunner, rng: SeededRandom): void {
    const st = this.state;
    if (!st.story || !st.alive) return;
    const mods = runner.modifiers();
    const facts = computeFacts(st);
    rollLifeEvents(st, rng, { signals: this.yearSignals(), mods, facts });
    resolveStaleEvents({ state: st, seed: this.s.seed, rng, mods, facts, signals: this.yearSignals() });
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
    if (f.partnered && f.apart) {
      // Long distance: no dinner dates — a video-call date, or something sent across the distance.
      pool.push({ item: { id: "call:partner", kind: "home", locationId: "home", activityId: "watch_tv", label: bi(`${f.partnerName}와(과) 영상통화 데이트`, `A video-call date with ${f.partnerName}`) }, weight: 1.6 });
      pool.push({ item: { id: "parcel:partner", kind: "place", locationId: "street", activityId: "shop", label: bi(`${f.partnerName}에게 보낼 택배 싸기`, `Pack a parcel for ${f.partnerName}`) }, weight: 0.8 });
    } else if (f.partnered) {
      for (const [id, ko, en] of [["park", "공원 데이트", "Park date"], ["restaurant", "레스토랑 데이트", "Dinner date"], ["cinema", "영화 데이트", "Movie date"], ["amusement_park", "놀이공원 데이트", "Amusement-park date"]] as const)
        pool.push({ item: { id: `date:${id}`, kind: "date", locationId: id, activityId: "date", withPartner: true, label: bi(`${f.partnerName}와(과) ${ko}`, `${en} with ${f.partnerName}`) }, weight: 1.2 });
    }
    const tripCost = CFG.tripCostUnits as Record<string, number>;
    // A day with a story moment (the meeting, a confession…) stays where the story is: no trip that day,
    // or you'd "meet at the Tokyo airport" for no reason.
    const storyDay = this.s.dayKind === "fated" || this.s.dayKind === "arc" || this.s.dayKind2 === "fated" || this.s.dayKind2 === "arc";
    for (const dest of storyDay ? [] : ["coast", "tokyo", "paris"]) {
      if (st.money < tripCost[dest] + 1) continue;
      const intl = getDestination(dest).international;
      const w = 0.35 * Math.exp((mods.travel ?? 0) + (intl ? mods.overseas ?? 0 : 0)) * (0.6 + st.traits.novelty);
      pool.push({ item: { id: `trip:${dest}`, kind: "trip", destination: dest, label: bi(`${DEST_KO[dest]} 여행 떠나기`, `Trip to ${getDestination(dest).name.en}`) }, weight: w });
    }
    pool.push({ item: { id: "home", kind: "home", locationId: "home", activityId: "watch_tv", label: bi("집에서 뒹굴기", "Lounge at home") }, weight: 0.7 });
    // Free-spirited picks, just for fun (they only decide where the day goes): 치맥, 인생네컷, 커플링 공방, 새벽 라면…
    const season = seasonOf(st.date.month);
    const local = funFor(st.location.country);
    const funSet = f.partnered ? (f.apart ? FUN.apart : local.couple) : local.solo;
    const pName = f.partnerName ?? "";
    const withP = (b: Bi): Bi => ({ ko: b.ko.replaceAll("{p}", pName), en: b.en.replaceAll("{p}", pName) });
    for (const [k, x] of funSet.entries()) {
      if (x.season && x.season !== season) continue;
      if (x.loc !== "home" && getLocation(x.loc).region !== st.world?.homeRegion && !getLocation(x.loc).online) continue;
      const together = f.partnered && !f.apart;
      pool.push({ item: { id: `fun:${f.partnered ? (f.apart ? "a" : "c") : "s"}${k}`, kind: together ? "date" : x.loc === "home" ? "home" : "place", locationId: x.loc, activityId: x.act, withPartner: together || undefined, label: withP(x.label), reply: withP(x.r) }, weight: x.season ? 1.6 : 1.1 });
    }

    // This month's mood (Lunar Return, hidden): the house its Moon lights up tilts what you feel like doing.
    const focus = LUNAR_FOCUS[this.lunarFocusHouse()] ?? [];
    for (const p of pool) {
      const tag = p.item.kind === "place" ? (Object.keys(st.world?.habits ?? {}).includes(p.item.locationId ?? "") ? "habit" : p.item.locationId) : p.item.kind;
      if (tag && focus.includes(tag)) p.weight *= 1.8;
    }

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
    // A life event with its own place today (the court, 본가…) rules out leaving town.
    const eventPlace = (this.s.dayPlan.sequence ?? []).some((q) => q.keep);
    const opts = this.weekendMenu().filter((o) => !(eventPlace && o.kind === "trip"));
    if (!opts.length) return;
    const f = this.facts();
    const popup: Popup = {
      id: `plan${this.s.dayIndex}`,
      source: "plan",
      who: "me",
      name: this.speaker("me"),
      line: this.L(f.partnered && !f.apart ? bi(`(오늘 ${f.partnerName}와(과) 뭐 할까?)`, `(What should ${f.partnerName} and I do today?)`) : f.apart ? bi(`(주말이다. ${f.partnerName}은(는) 멀리 있다. 뭐 하지?)`, `(The weekend. ${f.partnerName} is far away. What now?)`) : bi("(주말이다. 뭐 하지?)", "(The weekend. What now?)")),
      ch: opts.map((o) => ({ t: this.L(o.label) })),
    };
    this.s.pending = { popup, plan: opts };
    return { kind: "popup", popup };
  }

  // ---- choices --------------------------------------------------------------
  /** The picked choice's result — a "[엄마] …" reply shows "엄마" as the speaker, never the tag in the text. */
  choose(index: number): ChoiceResult | undefined {
    const r = this.chooseRaw(index);
    if (r) {
      const t = splitSpeakerTag(r.line);
      if (t.tag) (r.name = t.tag), (r.line = t.text);
    }
    return r;
  }

  private chooseRaw(index: number): ChoiceResult | undefined {
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
    if (p.eventUid) {
      const label = p.popup.ch[index]?.t;
      const evId = st.story?.events?.pending.find((x) => x.uid === p.eventUid)?.id;
      const n0 = st.story?.cards.length ?? 0;
      const res = resolveLifeEvent(p.eventUid, index, { state: st, seed: s.seed, rng, mods, facts: this.facts(), signals: this.yearSignals() });
      if (!res) return;
      const text = [this.L(res.r), ...res.extra.map((x) => this.L(x))].join(" ");
      const quote = this.reflect(n0, evId ? lifeEvent(evId)?.cat : undefined, 0.5);
      return { who: "me", line: this.fill(fillStory(text, st, this.facts(), p.vars ?? {})), log: label, ...(quote ? { quote } : {}) };
    }
    if (p.storyRef) {
      const label = p.popup.ch[index]?.t;
      const n0 = st.story?.cards.length ?? 0;
      const res = resolveStory(p.storyRef, index, { state: st, seed: s.seed, rng, mods, facts: this.facts() }, label);
      if (!res) return;
      const quote = res.more ? undefined : this.reflect(n0, undefined, 0.8);
      if (res.scene?.length) this.setSequence(res.scene);
      if (!st.alive) s.minute = CFG.dayEndMinute;
      // A big moment in four parts: the next part opens right after this one.
      if (res.more) {
        const first = p.storyRef === `arc:${s.dayRef}` || p.storyRef.startsWith(`fated:${s.dayRef}`);
        // A fated moment that opens a story ("tell them today" → the confession): that story plays next.
        if (p.storyRef.startsWith("fated:")) {
          const talk = st.story?.arcs.find((a) => a.type === "TALKING" && a.steps[a.step]?.key === "CONFESS");
          if (talk) {
            if (first) (s.dayKind = "arc"), (s.dayRef = talk.id);
            else (s.dayKind2 = "arc"), (s.dayRef2 = talk.id);
          }
        }
        s.agenda.unshift({ t: s.minute, k: first ? "story" : "story2" });
      }
      // A reply (your partner answering "not yet") is theirs, not yours.
      const who = res.who && meets(SPEAKER_REQUIRES[res.who] ?? [], this.facts()) ? res.who : "me";
      return { who, line: this.fill(fillStory(this.L(res.r), st, this.facts(), { patient: p.patient ?? "", ...p.vars })), log: label, ...(quote ? { quote } : {}) };
    }
    if (p.storyId) {
      const story = STORIES.find((x) => x.id === p.storyId)!;
      const c = story.choices[index];
      applyConsequences(st, c.effects ?? [], { rng, modifiers: mods, log: [] });
      // Now and then an ordinary moment gets its line too.
      const daily = rng.chance(0.15) ? pickReflection(st, story.who === "partner" ? "TOGETHER" : story.who === "friend" ? "FRIENDS" : "DAILY", rng) : undefined;
      return { who: story.who === "me" ? "me" : story.who, name: p.popup.name, line: this.fill(this.L(c.r)), ...(daily ? { quote: this.L(daily) } : {}) };
    }
    if (p.occasion) {
      const r = p.occasion[index] ?? p.occasion[0];
      st.flags.lastOccasionMonth = st.monthIndex;
      return { who: "me", line: this.fill(this.L(r)), log: p.popup.ch[index]?.t };
    }
    if (p.plan) {
      const o = p.plan[index];
      if (o.kind === "trip") {
        s.dayPlan = { trip: o.destination };
        st.money -= (CFG.tripCostUnits as Record<string, number>)[o.destination!];
        return { who: "me", line: this.L(bi("(가방 하나 메고 출발!)", "(One bag, let's go!)")), log: this.L(o.label) };
      }
      // Today's life event keeps its own time and place (the court, 본가…); the weekend plan fills the rest.
      s.dayPlan = { locationId: o.locationId, activityId: o.activityId, withPartner: o.withPartner, sequence: (s.dayPlan.sequence ?? []).filter((q) => q.keep) };
      return { who: "me", line: this.fill(this.L(o.reply ?? (o.kind === "home" ? bi("(이불 밖은 위험해.)", "(Outside the blanket is dangerous.)") : bi("(좋아, 가보자!)", "(Okay, let's go!)")))), log: this.L(o.label) };
    }
    return;
  }

  /** A choice moves the player: each place for ~2 hours, starting now. */
  private setSequence(locations: string[]): void {
    const s = this.s;
    // Reserved segments (the afternoon's second story moment) stay; the new scenes fit before them.
    const kept = (s.dayPlan.sequence ?? []).filter((q) => q.keep && q.from >= s.minute);
    const limit = Math.min(CFG.dayEndMinute, ...kept.map((q) => q.from));
    let t = s.minute;
    const fresh = locations
      .map((locationId) => {
        const q = { locationId, from: t, until: Math.min(limit, t + 120) };
        t += 120;
        return q;
      })
      .filter((q) => q.until > q.from);
    s.dayPlan.sequence = [...fresh, ...kept];
    s.dayPlan.override = undefined;
  }

  /**
   * Kairosoft-style crowd movement: call about every 500 ms and animate each actor from its
   * previous spot to the new one over ~480 ms (linear). Everyone walks tile by tile; NPCs
   * sometimes walk off the edge of the screen (`offscreen`) and come back later.
   * `facing` flips the sprite; `walking` plays the walk frames. Visual only.
   */
  wander(): PrototypeScene | undefined {
    const sc = this.s.lastScene;
    if (!sc) return;
    this.wanderTick = (this.wanderTick + 1) % 1_000_000;
    const r = stepCrowd(this.crowd, `${this.s.dayIndex}:${this.s.loc}:${sc.bgId}`, sc.actors, this.rng("wander", this.wanderTick));
    this.crowd = r.state;
    sc.actors = withPositions(r.actors as PrototypeScene["actors"]);
    sc.focus = focusOf(sc.actors);
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
    return this.tidy(beats.concat(s.pending ? [] : this.advance(s.minute)));
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
  endDay(): { over: boolean; fromAge: number; toAge: number; lines: string[]; cards: MemoryCard[]; notes: string[]; photo?: string } {
    const s = this.s;
    const st = this.state;
    if (st.world?.travel) endTrip(st.world, this.rng("endtrip"));
    s.dayPlan = {};
    const before = snapshot(st);
    const fromAge = Math.floor(st.age);
    const rng = this.rng("gap");
    // The day the bond with the destined person ends (or a meeting that will never come) is the last day.
    updateBond(st);
    if (st.alive && st.story && !st.story.bond?.over) {
      const next = scheduleNext(st, rng);
      const waiting = bondPhase(st) === "waiting";
      const runner = new LifeRunner(this.runnerOptions(hash(s.seed, "between", s.dayIndex)), st);
      while (st.alive && st.monthIndex < next.month) {
        runner.stepMonth();
        monthlyStoryTick(st, rng);
        this.eventTick(runner, rng);
        if (updateBond(st)) break;
        // Waiting to meet them: nothing else gets a day of its own — the meeting is the next day.
        if (waiting) continue;
        // A newly started arc step (e.g. a parent's last days) can pull the next day earlier.
        const dueArc = st.story.arcs.find((x) => x.steps[x.step] && x.steps[x.step].dueMonth <= st.monthIndex + 1);
        if (dueArc && next.kind !== "arc") {
          st.story.nextDay = { month: st.monthIndex + 1, kind: "arc", ref: dueArc.id };
          break;
        }
        // So can a life event that came up meanwhile: an urgent follow-up, or a life-changing one that has waited long enough.
        const wanted = eventDayWanted(st);
        if (wanted !== undefined && wanted <= st.monthIndex + 1 && st.story.nextDay!.month > st.monthIndex + 1) {
          st.story.nextDay = { month: st.monthIndex + 1, kind: "calm" };
          break;
        }
        // …and so can a celebration (100일, an anniversary, a birthday coming up).
        const occ = st.story.occasions?.find((o) => o.big && o.month <= st.monthIndex + 1);
        if (occ && st.story.nextDay!.month > st.monthIndex + 1) {
          st.story.nextDay = { month: st.monthIndex + 1, kind: "calm" };
          break;
        }
      }
      if (st.alive && !st.story.bond?.over && st.monthIndex < st.story.nextDay!.month) {
        // Step the remaining month(s) once more so the day lands in its month.
        while (st.alive && st.monthIndex < st.story.nextDay!.month) {
          runner.stepMonth();
          monthlyStoryTick(st, rng);
          this.eventTick(runner, rng);
          if (updateBond(st)) break;
        }
      }
      s.dayKind = st.story.nextDay!.kind;
      s.dayRef = st.story.nextDay!.ref;
      s.dayKind2 = st.story.nextDay!.second?.kind;
      s.dayRef2 = st.story.nextDay!.second?.ref;
    } else if (st.alive) {
      const runner = new LifeRunner(this.runnerOptions(hash(s.seed, "between", s.dayIndex)), st);
      for (let i = 0; i < 12 && st.alive; i++) runner.stepMonth();
    }
    pruneWorld(st);
    const cards = buildCards(st, s.lang, s.seed);
    // Life events that resolved off-screen while time passed.
    const nf = this.facts();
    const notes = (st.story?.events?.notes.splice(0) ?? []).map((n) =>
      this.fill(fillStory(this.L(n), st, nf, langVars({ sibling: nf.siblingName ?? "", ex: nf.exName ?? "", kid: nf.kidName ?? "", me: s.setup.name, ...(n.vars ?? {}) }, s.lang))),
    );
    const lines = [...notes, ...(cards.length ? cards.map((c) => c.caption) : summarize(before, snapshot(st), s.lang).bi.map((l) => l[s.lang]))];
    for (const c of cards) s.milestones.push({ age: c.age, ko: s.lang === "ko" ? c.caption : c.caption, en: c.caption });
    if (!cards.length) for (const l of summarize(before, snapshot(st), s.lang).bi) s.milestones.push({ age: Math.floor(st.age), ko: l.ko, en: l.en });
    // notes: what happened meanwhile, off-screen ("사채 — 불법 이자는 무효라고 했다…"), also at the top of `lines`.
    updateBond(st);
    const ended = !st.alive || !!st.story?.bond?.over;
    const out = { over: ended, fromAge, toAge: Math.floor(st.age), lines, cards, notes, photo: gapPhoto(st, before, snapshot(st), lines, rng) };
    if (ended) {
      s.over = true;
      return out;
    }
    s.dayIndex += 1;
    this.runnerCache = undefined;
    this.startDay();
    return out;
  }

  /**
   * Strangers or acquaintances: the years before the destined meeting pass off-screen, and the first
   * played day is the day you meet. Returns how many years went by.
   */
  skipToMeeting(): number {
    const st = this.state;
    const meeting = bondPhase(st) === "waiting" ? pendingMeetings(st)[0] : undefined;
    if (!meeting) return 0;
    const s = this.s;
    const from = st.date.year;
    const rng = this.rng("prelude");
    const runner = new LifeRunner({ ...this.runnerOptions(hash(s.seed, "prelude")), mortality: false }, st);
    while (st.monthIndex < meeting.monthIndex) {
      runner.stepMonth();
      monthlyStoryTick(st, rng);
      this.eventTick(runner, rng);
    }
    // What happened meanwhile is old news; the first day is about them. (Loans from those years are
    // paid off off-screen too: the story never opens in the red.)
    st.money = Math.max(st.money, 1.85);
    if (st.story) st.story.cards = [];
    st.story?.events?.notes.splice(0);
    s.dayKind = "fated";
    s.dayRef = meeting.id;
    s.dayKind2 = s.dayRef2 = undefined;
    this.runnerCache = undefined;
    return st.date.year - from;
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
    const endedAlive = st.alive ? st.story?.bond?.over?.reason : undefined;
    const bondLines = endedAlive ? ((memorialData.bond as unknown as Record<string, Array<{ ko: string; en: string }>>)[endedAlive] ?? []) : [];
    const picked = bondLines.length ? rng.weightedSample(bondLines.map((l) => ({ item: { tag: endedAlive!, text: l }, weight: 1 })), 2) : [...rng.weightedSample(specific.map((l) => ({ item: l, weight: 1 })), 2), ...rng.weightedSample(pool.filter((l) => l.tag === "any").map((l) => ({ item: l, weight: 1 })), 1)];
    const deathYear = st.date.year;
    const name = s.setup.name;
    // Still alive (the bond ended — a breakup, a divorce, their death, a meeting that never came): the two names and your years together.
    const bond = st.story?.bond;
    const fated = Object.values(w?.npcs ?? {}).find((n) => n.fated);
    const epitaph = st.alive && bond?.over && fated
      ? bond.since ? `${name} ♥ ${fated.name} · ${bond.since.year} – ${deathYear}` : `${name} · ${fated.name}`
      : `${name} · ${st.birth.year} – ${deathYear}`;
    return {
      fadeMs: 4000,
      lineMs: 3500,
      epitaph,
      lines: picked.map((l) => l.text[lang]),
      cards: [],
    };
  }

  isOver(): boolean {
    return this.s.over;
  }

  /**
   * The ending. `reason`: how the bond with the destined person ended — missed (never came together),
   * breakup, divorce, theyDied, or iDied (your own death; together to the end if married).
   * Only iDied is a death: show the memorial fade. The others end on the last day, alive.
   */
  ending(): {
    reason?: BondEnd;
    title: string;
    story?: string;
    together?: { from: number; to: number; years: number; married: boolean };
    /** Left entirely to fate: what the chart said (lifelong spouse / solitary) and why ("화개", "토성 7하우스"…). */
    fate?: { mode: "lifelong" | "solitary"; signs: string[] };
    summary: string;
    lines: string[];
    age: number;
    memorial: ReturnType<Game["memorial"]>;
  } {
    const st = this.state;
    const s = this.s;
    const partners = st.npcs.filter((n) => n.role === "PARTNER" || n.role === "EX").length;
    const trips = st.world?.pastTrips.length ?? 0;
    const friends = Object.values(st.world?.relationships ?? {}).filter((r) => r.stage === "FRIEND" || r.stage === "CLOSE_FRIEND").length;
    const married = st.relationship.status === "MARRIED";
    const bond = st.story?.bond;
    const fatedName = Object.values(st.world?.npcs ?? {}).find((n) => n.fated)?.name ?? "";
    const reason: BondEnd | undefined = bond?.over?.reason ?? (hasBond(st) && !st.alive ? "iDied" : undefined);
    const sinceY = bond?.since?.year;
    const years = sinceY !== undefined ? st.date.year - sinceY : 0;
    const byBond: Record<BondEnd, Bi> = {
      missed: bi("끝내 엇갈린 인연", "The One That Got Away"),
      breakup: bi("우리의 계절은 여기까지", "Our Season Ends Here"),
      divorce: bi("각자의 길로", "Separate Roads"),
      theyDied: bi("먼저 떠난 당신", "You Left First"),
      iDied: bond?.married ? bi("함께 늙어간 인생", "We Grew Old Together") : bond?.together ? bi("끝까지 연인으로", "Lovers to the End") : bi("만나지 못한 운명", "A Destiny Never Met"),
    };
    const story: Record<BondEnd, Bi> = {
      missed: bi(`${fatedName}와(과)의 운명은 끝내 이어지지 않았다. 몇 번의 계절이 우리 곁을 스쳐 갔을 뿐.`, `Fate never tied you and ${fatedName} together. A few seasons brushed past the two of you, and that was all.`),
      breakup: bi(`${fatedName}와(과) 함께한 ${Math.max(1, years)}년. 우리는 여기서 헤어졌다.`, `${Math.max(1, years)} year${years > 1 ? "s" : ""} with ${fatedName}. This is where you parted.`),
      divorce: bi(`${fatedName}와(과)의 결혼은 여기서 끝났다. ${Math.max(1, years)}년의 시간은 지워지지 않는다.`, `Your marriage to ${fatedName} ended here. The ${Math.max(1, years)} years don't disappear.`),
      theyDied: bi(`${fatedName}이(가) 먼저 떠났다. 함께한 ${Math.max(1, years)}년이 고스란히 남았다.`, `${fatedName} left first. The ${Math.max(1, years)} years you shared remain.`),
      iDied: bond?.together ? bi(`${fatedName}와(과) 함께 ${Math.max(1, years)}년. 마지막 날까지 곁에 있었다.`, `${Math.max(1, years)} years with ${fatedName}, side by side until the last day.`) : bi("그 사람을 만나지 못한 채 인생이 끝났다.", "Life ended before you ever met."),
    };
    // Left to fate: the ending is told as the chart's story.
    const mode = st.story?.fateMode;
    if (mode === "solitary" && reason) {
      if (bond?.married && (reason === "iDied" || reason === "theyDied")) {
        byBond[reason] = bi("운명을 이긴 사랑", "The Love That Beat Fate");
        story[reason] = bi(`혼자 살 사주라고 했다. 그런데 ${fatedName}와(과) 끝까지 함께였다. 운명도 가끔은 진다.`, `The chart said a life alone. Yet you and ${fatedName} stayed together to the end. Sometimes even fate loses.`);
      } else {
        byBond[reason] = bi("마지막 사랑", "My Last Love");
        story[reason] = bond?.married
          ? bi(`혼자 살 사주를 거슬러 ${fatedName}와(과) 결혼까지 했다. 그래도 끝내 운명은 우리를 갈라놓았다. 그 뒤로 나는 평생 혼자 살았다.`, `Against a chart that said a life alone, you married ${fatedName}. Still, fate pulled you apart in the end. After that, you lived alone for the rest of your life.`)
          : bond?.together
          ? bi(`${fatedName}은(는) 내 인생의 마지막 사랑이었다. 그 뒤로 나는 평생 혼자 살았다. 외롭지 않았다면 거짓말이지만, 그 계절만큼은 누구보다 뜨거웠다.`, `${fatedName} was the last love of my life. After that, I lived alone for the rest of my days. It'd be a lie to say I was never lonely — but that one season burned brighter than anything.`)
          : bi(`${fatedName}에게 끝내 마음을 전하지 못했다. 그게 마지막 사랑이었다. 나는 평생 혼자 살았고, 가끔 그 이름을 떠올렸다.`, `I never told ${fatedName} how I felt. That was my last love. I lived alone all my life, and now and then, I remembered that name.`);
      }
    } else if (mode === "lifelong" && (reason === "divorce" || reason === "breakup")) {
      story[reason] = bi(`운명은 ${fatedName}와(과)의 평생을 약속했다. 그 약속을 놓은 건, 우리였다.`, `Fate had promised a lifetime with ${fatedName}. It was we who let go.`);
    } else if (mode === "lifelong" && reason === "iDied" && bond?.married) {
      story[reason] = bi(`운명이 정해 둔 단 한 사람, ${fatedName}. ${Math.max(1, years)}년을 함께 걸었고, 마지막 날에도 손을 잡고 있었다.`, `The one fate had chosen: ${fatedName}. ${Math.max(1, years)} years walking side by side, holding hands to the very last day.`);
    }
    const t = reason
      ? byBond[reason]
      : married
      ? bi("우리가 함께 고른 인생", "The Life We Chose Together")
      : st.flags.livedAbroad
        ? bi("멀리까지 걸어온 인생", "A Life That Went Far")
        : friends >= 5
          ? bi("사람들 곁에서", "Among Good People")
          : partners > 1
            ? bi("운명의 사람은 한 명이 아니었다", "There Was More Than One Person of Destiny")
            : bi("조용하고 평범한 행복", "A Quiet, Ordinary Happiness");
    return {
      reason,
      title: this.L(t),
      story: reason ? this.fill(this.L(story[reason])) : undefined,
      together: sinceY !== undefined ? { from: sinceY, to: st.date.year, years, married: !!bond?.married } : undefined,
      fate: mode ? { mode, signs: st.story?.fateSigns ?? [] } : undefined,
      summary: this.L(bi(`연애 ${partners} · 친구 ${friends} · 여행 ${trips} · ${Math.floor(st.age)}세`, `Relationships ${partners} · Friends ${friends} · Trips ${trips} · Age ${Math.floor(st.age)}`)),
      lines: s.milestones.slice(-6).map((m) => `${m.age}${s.lang === "ko" ? "세" : ""} · ${m[s.lang]}`),
      age: Math.floor(st.age),
      memorial: this.memorial(),
    };
  }

  // ---- read models for the UI ---------------------------------------------
  /**
   * The destined person as the engine made them — draw their sprite from this (also when they were left
   * to fate): gender "M" | "F", a stable sprite seed, their name once you know it.
   */
  fated(): { gender: "M" | "F"; seed: number; name?: string; known: boolean } | undefined {
    const n = Object.values(this.state.world?.npcs ?? {}).find((x) => x.fated);
    if (!n) return undefined;
    const known = this.facts().fatedKnown;
    return { gender: n.sex === "MALE" ? "M" : "F", seed: n.spriteSeed, known, ...(known ? { name: n.name } : {}) };
  }

  hud() {
    const st = this.state;
    const f = this.facts();
    const mine = myJob(st);
    const job = f.employed ? jobLabel(st) : f.student ? (mine?.kind === "student" ? bi(mine.ko, mine.en) : bi("학생", "Student")) : f.retired ? bi("은퇴", "Retired") : mine?.kind === "none" ? bi(mine.ko, mine.en) : bi("구직 중", "Job hunting");
    const rel = f.married ? bi(`${f.partnerName}와(과) 결혼`, `Married to ${f.partnerName}`) : f.dating ? bi(`${f.partnerName}와(과) 연애 중`, `Dating ${f.partnerName}`) : bi("싱글", "Single");
    return {
      date: this.s.day ? this.L(this.s.day.label) : "",
      age: this.s.lang === "ko" ? `${Math.floor(st.age)}세` : `${Math.floor(st.age)} y/o`,
      /** The age as a number (style it yourself: a big number with a small "세" / "y/o"). */
      ageNum: Math.floor(st.age),
      money: formatMoney(st.money * UNIT, currencyFor(nationalityOf(st)), this.s.lang ?? "ko"),
      income: formatMoney(yearlyIncome(st) * UNIT, currencyFor(nationalityOf(st)), this.s.lang ?? "ko"),
      job: this.L(job),
      relationship: this.L(rel),
      location: this.L(getLocation(this.s.loc ?? this.locationAt(this.s.minute)).name),
      // On a trip, where you are now (Tokyo), not where you live.
      city: (() => {
        const trip = st.world?.travel ? getDestination(st.world.travel.destinationId) : undefined;
        if (trip && trip.country !== "HOME") return this.s.lang === "ko" ? joinPlace(COUNTRY_KO[trip.country] ?? trip.country, trip.name.ko) : joinPlace(trip.country, trip.name.en);
        return this.s.lang === "ko" ? joinPlace(COUNTRY_KO[st.location.country] ?? st.location.country, cityKo(st.location.city)) : joinPlace(st.location.country, st.location.city);
      })(),
      minute: this.s.minute,
    };
  }

  scene(): PrototypeScene | undefined {
    return this.s.lastScene;
  }

  /**
   * The play screen: your life's road, seen from behind (see world/road.ts). Who walks beside you,
   * the drifting backdrop, and today's place passing at the roadside. Popups keep their photo
   * (popup.scene) and choices.
   */
  road(): RoadView {
    const s = this.s;
    return buildRoad(this.state, {
      minute: s.minute,
      locationId: s.loc,
      walking: !s.pending && !s.over && s.minute < CFG.dayEndMinute,
      lang: s.lang ?? "ko",
      seed: s.seed,
      cityName: cityKo,
      countryName: (c) => (s.lang === "en" ? c : COUNTRY_KO[c] ?? c),
    });
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
  // The story starts now — in 2026, on your birthday (never younger than 18).
  // The story starts in your youth (청춘, 20) — or on the day it began, when you're already together or married.
  const since = setup.fated?.since;
  const together = setup.fated?.status === "dating" || setup.fated?.status === "married";
  const sinceMonths = together && since ? (since.year - setup.birth.year) * 12 + (since.month - setup.birth.month) : undefined;
  const startMonths = setup.startAge !== undefined ? setup.startAge * 12 : sinceMonths !== undefined ? Math.max(18 * 12, sinceMonths) : YOUTH_AGE * 12;
  const startAge = Math.floor(startMonths / 12);
  while (runner.state.monthIndex < startMonths) runner.stepMonth();
  const st = save.life;
  st.alive = true;
  // The game begins single (unless setup says you're already with the destined person); earlier loves become exes.
  if (st.relationship.status !== "SINGLE") {
    const ex = st.npcs.find((n) => n.id === st.relationship.partnerId);
    if (ex) ex.role = "EX";
    if (st.world && st.relationship.partnerId && st.world.relationships[st.relationship.partnerId]) st.world.relationships[st.relationship.partnerId].stage = "EX";
    st.relationship = { status: "SINGLE" };
  }
  st.money = Math.max(st.money, 1.85);
  st.flags.likes = setup.likes ?? (setup.gender === "F" ? "M" : "F");
  st.flags.mbti = (setup.mbti ?? "").toUpperCase();
  // Each life picks its own versions of the big moments (story variants).
  st.flags.lifeSalt = seed;
  // Most Korean men have served by 25; the rest may get the letter.
  // (Only Korean men get the 입영 통지서.)
  if (setup.gender === "M") st.flags.militaryDone = nationCode(setup.nationality) && nationCode(setup.nationality) !== "KR" ? true : new SeededRandom(hash(seed, "military")).chance(0.85);
  applyFamilySetup(st, setup, new SeededRandom(hash(seed, "family")));
  applyMyJob(st, setup.job);
  // Where you live now; without it, where you were born (never a random city).
  // Nationality: where home is (family, "flying home", what you miss abroad).
  const nat = nationCode(setup.nationality) ?? findPlace(birthplaceCity(setup))?.country ?? "KR";
  st.flags.nationality = nat;
  st.homeCountry = ISO_COUNTRY[nat] ?? nat;
  st.location = { country: st.homeCountry, city: st.location.city };
  applyHome(st, setup.home ?? birthplaceCity(setup));
  const fatedLife = resolveFatedLife({ from: setup.fated?.from, job: setup.fated?.job, city: setup.fated?.city, birthplace: setup.fated?.birthplace }, { city: st.location.city }, new SeededRandom(hash(seed, "fatedLife")));
  addFatedPerson(st, setup, fatedLife, new SeededRandom(hash(seed, "fated")));
  // Their chart too: the year you meet is one that's good for *both* of you.
  const fxb = setup.fated?.birth;
  const fatedSex = setup.fated?.gender === "M" ? "MALE" : setup.fated?.gender === "F" ? "FEMALE" : (Object.values(st.world?.npcs ?? {}).find((n) => n.fated)?.sex ?? "MALE");
  const theirBirth = fxb ? resolveBirth({ ...fxb, sex: fatedSex }, setup.fated?.birthplace, placeOf(setup)) : undefined;
  initStory(st, birthOf(setup), placeOf(setup), seed, theirBirth ? { birth: theirBirth.birth, place: theirBirth.place } : undefined);
  st.story!.fatedLife = fatedLife;
  // Already dating, or already in 썸: the story starts there — no "first meeting" to wait for.
  const status = setup.fated?.status === "crush" ? "talking" : setup.fated?.status ?? (setup.fated?.name ? "talking" : "stranger");
  // Strangers and acquaintances wait for the destined year; a couple, a marriage or a 썸 starts right there.
  if (status === "dating" || status === "talking" || status === "married") {
    const first = st.story!.script.findIndex((e) => e.theme === "LOVE_MEETING");
    if (first >= 0) st.story!.script.splice(first, 1);
  }
  // Already married: no proposal or wedding to wait for — the anniversaries count from the wedding day.
  if (status === "married") {
    st.story!.script = st.story!.script.filter((e) => e.theme !== "MARRIAGE");
    st.story!.arcs = st.story!.arcs.filter((a) => a.type !== "DATING" && a.type !== "ENGAGEMENT");
  }
  if (status === "talking") startArc(st, "TALKING", new SeededRandom(hash(seed, "talking")));
  // Hidden 궁합 with the destined person (never shown; it bends love outcomes as part of the chart's 70%).
  const fx = setup.fated;
  if (fx && (fx.birth || fx.mbti)) {
    const fatedNpc = Object.values(st.world?.npcs ?? {}).find((n) => n.fated);
    const sex = fatedNpc?.sex ?? (fx.gender === "M" ? "MALE" : "FEMALE");
    const theirs = fx.birth ? resolveBirth({ ...fx.birth, sex }, fx.birthplace, placeOf(setup)) : undefined;
    const c = compatibility({ birth: birthOf(setup), place: placeOf(setup), mbti: setup.mbti }, { birth: theirs?.birth, place: theirs?.place, mbti: fx.mbti });
    st.story!.compat = { score: c.score, chemistry: c.chemistry, stability: c.stability, friction: c.friction };
    // How the first confession goes, with both charts and the friction between them.
    if (c.friction >= 0.62 || theirs) {
      const birth = birthOf(setup);
      const mine = { saju: st.chart ?? calculateNatalChart(birth), astro: calculateAstrologyChart(birth, placeOf(setup)) };
      const them = theirs ? { saju: calculateNatalChart(theirs.birth), astro: calculateAstrologyChart(theirs.birth, theirs.place) } : undefined;
      st.story!.confessFate = confessFate(mine, them, c.friction);
    }
  }
  // Left entirely to fate: the chart decides who they are.
  const sealed = !!fx?.sealed || !fx || (!fx.name && !fx.birth && !fx.mbti && !fx.job && !fx.city && (!fx.status || fx.status === "stranger"));
  if (sealed) sealFate(st, setup, new SeededRandom(hash(seed, "sealed")));
  save.dayKind = "calm";
  // Not met yet: skip straight to the day you meet.
  const years = g.skipToMeeting();
  const mode = st.story!.fateMode;
  if (mode === "lifelong") save.prologue = bi(`${years > 0 ? `${years}년 뒤, ` : ""}평생을 함께할 사람을 만난다.`, `${years > 0 ? `${years} year${years > 1 ? "s" : ""} later, ` : ""}you meet the one you'll spend your life with.`);
  else if (mode === "solitary") save.prologue = bi(`${years > 0 ? `${years}년 뒤, ` : ""}내 인생의 마지막 사랑이 찾아온다.`, `${years > 0 ? `${years} year${years > 1 ? "s" : ""} later, ` : ""}the last love of your life arrives.`);
  else if (years > 0) save.prologue = bi(`그 사람을 만나기까지, ${years}년이 흘렀다.`, `${years} year${years > 1 ? "s" : ""} went by before you met.`);
  // Starting broke (a student paying tuition, or out of work): the debt comes as its own moment, early on.
  const broke = st.enrollment ? "STUDENT_LOAN" : !st.career.employed && st.age < 60 && st.relationship.status !== "MARRIED" ? "MINUS_ACCOUNT" : undefined;
  if (broke) queueChain(st, broke, [0, 0], new SeededRandom(hash(seed, "broke")), { urgent: true });
  save.milestones.push({ age: Math.floor(st.age), ko: "이야기가 시작된다.", en: "The story begins." });
  g.startDay();
  return g;
}

export function loadGame(json: string): Game {
  const s = JSON.parse(json) as GameSave;
  s.life.chart = calculateNatalChart(birthOf(s.setup));
  s.life.npcs = s.life.npcs.map((n) => ({ ...n, chart: calculateNatalChart(n.birth) }));
  return new Game(s);
}

/**
 * The destined person left entirely to fate. A chart that marries: the one you marry and grow old with
 * (fate leans hard toward you two). A solitary chart: your last love — later in life, a love the chart
 * doesn't let last (no wedding written in the stars; it can still be fought for, the choices are 30%).
 */
function sealFate(st: LifeState, setup: GameSetup, rng: SeededRandom): void {
  const story = st.story!;
  const birth = birthOf(setup);
  const f = marriageFate(st.chart ?? calculateNatalChart(birth), calculateAstrologyChart(birth, placeOf(setup)), birth.sex);
  story.fateMode = f.mode;
  story.fateSigns = f.signs;
  if (f.mode === "lifelong") {
    story.compat = { score: 0.92, chemistry: 0.85, stability: 0.92, friction: 0.12 };
    return;
  }
  // The spark is real (they do get together); it's lasting that the chart doesn't allow — see bond.ts.
  story.compat = { score: 0.85, chemistry: 0.95, stability: 0.3, friction: 0.5 };
  // The last love comes late.
  const meet = story.script.find((e) => e.theme === "LOVE_MEETING" && !e.done);
  if (meet) {
    const age = Math.max(Math.floor(st.age) + 10, 42) + rng.int(0, 5);
    meet.age = age;
    meet.monthIndex = age * 12 + rng.int(1, 10);
  }
  story.script = story.script.filter((e) => e.theme !== "MARRIAGE" && e.theme !== "CHILD").sort((a, b) => a.monthIndex - b.monthIndex);
  if (story.fatedLife) story.fatedLife.retries = 1;
}

const ISO_COUNTRY: Record<string, string> = { KR: "Korea", JP: "Japan", US: "USA", CA: "Canada", DE: "Germany", AU: "Australia", GB: "UK", SG: "Singapore", FR: "France" };

/** Setup: where you live now (the plot's home, not the charts). Living abroad counts as abroad. */
/** The birthplace as a city name (a name, an object with a name, or the nearest city to its coordinates). */
function birthplaceCity(setup: GameSetup): string | undefined {
  const b = setup.birthplace as unknown;
  if (typeof b === "string") return b;
  const o = (b ?? setup.place) as { name?: string; lat?: number; lon?: number } | undefined;
  if (o?.name && findPlace(o.name)) return o.name;
  if (o && typeof o.lat === "number" && typeof o.lon === "number") {
    let best: PlaceInfo | undefined, d = Infinity;
    for (const p of PLACES) {
      const dd = (p.lat - o.lat!) ** 2 + (p.lon - o.lon!) ** 2;
      if (dd < d) (d = dd), (best = p);
    }
    return best?.en;
  }
  return undefined;
}

/** Where a story that hasn't begun yet starts: your youth. */
const YOUTH_AGE = 20;

function applyHome(st: LifeState, home: string | undefined): void {
  const place = home ? findPlace(home) : undefined;
  if (!place) return;
  st.location = { country: ISO_COUNTRY[place.country] ?? place.country, city: place.en };
  if (place.country !== String(st.flags.nationality ?? "KR")) st.flags.livedAbroad = true;
  if (st.world) st.world.country = st.location.country;
}

/** The job chosen in setup, while the player still has it (a new job or quitting changes career.cid). */
function myJob(st: LifeState) {
  const id = st.flags.myJob as string | undefined;
  if (!id || (st.career.cid ?? 0) !== st.flags.myJobCid) return undefined;
  return findFatedJob(id);
}

/** Setup: the player's job decides employment, school, and self-employment (no coworkers). */
function applyMyJob(st: LifeState, input: string | undefined): void {
  const job = findFatedJob(input ?? "office") ?? findFatedJob("office")!;
  const kind = job.kind ?? "employee";
  st.career = { ...st.career, cid: (st.career.cid ?? 0) + 1, employed: kind === "employee" || kind === "self" || kind === "civil", abroad: false };
  st.career.field = kind === "self" ? "own-business" : kind === "civil" ? "civil-service" : st.career.field === "own-business" || st.career.field === "civil-service" ? "general" : st.career.field ?? "general";
  if (kind === "student") st.enrollment = { program: job.id === "grad_student" ? "MASTER" : "BACHELOR", untilMonth: st.monthIndex + 24, abroad: false };
  else st.enrollment = undefined;
  if (kind === "none") st.flags.jobLostMonth = st.monthIndex;
  if (job.id === "creator") st.flags.influencer = true;
  st.flags.myJob = job.id;
  st.flags.myJobCid = st.career.cid ?? 0;
}

/** What the HUD calls the player's work (the career field, plus what life events made of it). */
function jobLabel(st: LifeState): Bi {
  const mine = myJob(st);
  if (mine && mine.id !== "office" && mine.id !== "civil_servant") return bi(mine.ko, mine.en);
  const lv = st.career.level;
  if (st.flags.shaman) return bi("무속인", "Shaman");
  if (st.career.field === "civil-service") {
    const grade = Math.max(1, 10 - Math.max(1, lv)); // 9급 → 1급
    return bi(`공무원 ${grade}급`, `Civil servant, grade ${grade}`);
  }
  if (st.career.field === "own-business") return st.flags.influencer ? bi("크리에이터", "Creator") : bi("사장님", "Owner");
  if (st.career.field === "second-career") return bi("새로운 일", "Second career");
  return bi("회사원", "Office worker");
}

/** The player's birth for the charts: local standard time at the birthplace + its UTC offset (see destiny/birthplace.ts). */
function birthResolved(setup: GameSetup) {
  const b = setup.birth;
  const input = setup.birthplace ?? (setup.place ? { name: setup.place.name, lat: setup.place.lat, lon: setup.place.lon, tz: setup.place.tz } : undefined);
  return resolveBirth({ year: b.year, month: b.month, day: b.day, hour: b.hour, minute: b.minute, sex: setup.gender === "M" ? "MALE" : "FEMALE" }, input);
}
function birthOf(setup: GameSetup): BirthData {
  return birthResolved(setup).birth;
}
function placeOf(setup: GameSetup): BirthPlace {
  return birthResolved(setup).place;
}

/** Place the destined person in the world according to setup ("same" neighborhood, another city, abroad). */
function addFatedPerson(st: LifeState, setup: GameSetup, life: FatedLife, rng: SeededRandom): void {
  const w = st.world;
  if (!w) return;
  const fx = setup.fated ?? {};
  // Who you like decides it (a woman liking men → a man) — and without "likes", the default is the other sex, never a coin flip.
  const likes = setup.likes ?? (setup.gender === "F" ? "M" : "F");
  const gender = fx.gender ?? (likes === "M" ? "M" : likes === "F" ? "F" : rng.chance(0.5) ? "M" : "F");
  const from = life.from;
  // In the same neighborhood you may keep running into them where they work (a familiar face long
  // before you know their name). From another city or country, only fate brings you together.
  const work = findLocation(life.job.place);
  const home = work && !work.online ? work : findLocation(from === "abroad" ? "language_exchange_app" : "cafe")!;
  const block = (locationId: string, start: number, days: number[]) => ({ locationId, startHour: start, endHour: start + 2, days, attendance: 0.8 });
  const workHour = life.job.shift === "night" ? 20 : life.job.shift === "day" ? 12 : 15;
  const schedule: NPCSchedule =
    from === "same"
      ? { weekday: [block(home.id, workHour, [1, 2, 3, 4, 5])], weekend: [block("park", 11, [0]), block("cafe", 14, [6])] }
      : from === "abroad" && life.job.place === "language_exchange_app"
        ? { weekday: [block("language_exchange_app", 21, [1, 3, 5])], weekend: [] }
        : { weekday: [], weekend: [] };
  // Someone from where they live (a Tokyo developer gets a Japanese name unless setup named them).
  // Their nationality: setup, else where they were born, else where they live (abroad), else yours.
  const bornIn = typeof fx.birthplace === "string" ? findPlace(fx.birthplace)?.country : undefined;
  const theirNat = nationCode(fx.nationality) ?? bornIn ?? (from === "abroad" ? life.city.country : String(st.flags.nationality ?? "KR"));
  const npc = generateNpc(w, rng, { type: from === "abroad" ? "language_partner" : "regular_customer", region: from === "abroad" ? "online" : home.region, date: st.date, aroundAge: st.age, persistence: "PERSISTENT", schedule, sex: gender === "M" ? "MALE" : "FEMALE", country: ISO_COUNTRY[theirNat] ?? theirNat });
  if (fx.name) {
    npc.name = fx.name;
    // Nobody else in this world may share the destined person's name.
    for (const other of Object.values(w.npcs)) if (other !== npc && other.name === fx.name) other.name = pickName(other.sex, "KR", rng, [fx.name]);
    for (const n of st.npcs) if (n.name === fx.name) n.name = pickName(n.birth.sex, "KR", rng, [fx.name]);
  }
  if (fx.birth) Object.assign(npc, { birthYear: fx.birth.year, birthMonth: fx.birth.month, birthDay: fx.birth.day });
  npc.single = true;
  npc.fated = true;
  npc.foreign = from === "abroad";
  npc.profile = { mbti: fx.mbti, job: life.job.id, jobName: life.job.ko, from, city: life.city.ko, nationality: theirNat, ...fx.profile };
  // Someone you already know and like (a crush) — or already your partner. Never automatically a couple.
  const status = fx.status === "crush" ? "talking" : fx.status ?? (fx.name ? "talking" : "stranger");
  // "Just know each other": names known, no spark yet — the destined year is when it changes.
  const acquaintance = status === "acquaintance";
  if (status === "stranger") return;
  st.flags.fatedMet = true;
  const origin = { type: (from === "abroad" ? "LANGUAGE_EXCHANGE_APP" : "FRIEND_OF_FRIEND") as RelationshipOriginType, locationId: home.id, firstEncounterDate: { ...st.date } };
  const couple = status === "dating" || status === "married";
  w.relationships[npc.id] = { npcId: npc.id, stage: couple ? "PARTNER" : "ACQUAINTANCE", closeness: couple ? 0.6 : acquaintance ? 0.25 : 0.4, spark: couple ? 0.7 : acquaintance ? 0.1 : 0.35, conversations: acquaintance ? 3 : 8, origin, lastContact: { ...st.date }, channel: from === "abroad" ? "ONLINE" : "IN_PERSON", metOffline: from !== "abroad" };
  if (status === "dating" || status === "married") {
    npc.single = false;
    const birth = { year: npc.birthYear, month: npc.birthMonth, day: npc.birthDay, sex: npc.sex };
    st.npcs.push({ id: npc.id, name: npc.name, birth, chart: calculateNatalChart(birth), role: "PARTNER", metAt: { ...st.date } });
    st.relationship = { status: status === "married" ? "MARRIED" : "DATING", partnerId: npc.id, sinceMonth: st.monthIndex };
    st.flags.lastPartnerName = npc.name;
    st.flags.skipFirstDate = true; // already a couple: no "first date" day
    if (status === "married") {
      st.flags.weddingMonth = st.monthIndex;
      st.flags.longterm = true;
    }
  }
}

const SIBLING_REL: Record<string, SiblingRel> = {
  언니: "OLDER_SISTER", 누나: "OLDER_SISTER", 오빠: "OLDER_BROTHER", 형: "OLDER_BROTHER", 남동생: "YOUNGER_BROTHER", 여동생: "YOUNGER_SISTER",
  OLDER_SISTER: "OLDER_SISTER", OLDER_BROTHER: "OLDER_BROTHER", YOUNGER_SISTER: "YOUNGER_SISTER", YOUNGER_BROTHER: "YOUNGER_BROTHER",
};

/** Parents (alive or not), siblings and grandparents from setup; anything missing is filled in plausibly. */
function applyFamilySetup(st: LifeState, setup: GameSetup, rng: SeededRandom): void {
  const fx = setup.family ?? {};
  const fam = (st.family ??= { mom: { alive: true, birthYear: setup.birth.year - 29 }, dad: { alive: true, birthYear: setup.birth.year - 31 } });
  for (const who of ["mom", "dad"] as const) {
    const p = fx[who];
    if (!p) continue;
    if (p.alive === false) fam[who].alive = false;
    if (p.name) fam[who].name = p.name;
    if (p.birthYear) fam[who].birthYear = p.birthYear;
  }
  fam.siblings = (fx.siblings ?? []).flatMap((x, i) => {
    const rel = SIBLING_REL[x.rel?.trim()] ?? SIBLING_REL[x.rel?.trim().toUpperCase()];
    if (!rel) return [];
    const older = rel.startsWith("OLDER");
    const sex = x.gender ? (x.gender === "M" ? "MALE" : "FEMALE") : rel.endsWith("BROTHER") ? "MALE" : "FEMALE";
    const gap = x.gap ?? (older ? rng.int(1, 5) : -rng.int(1, 5));
    return [{ id: `sib${i + 1}`, rel, name: x.name?.trim() || pickName(sex, "KR", rng), sex, birthYear: x.birthYear ?? setup.birth.year - gap, alive: true, spriteSeed: rng.int(0, 999_999) } as Sibling];
  });
  // Grandparents: however many are still alive at the start (default: 0–2).
  const n = Math.max(0, Math.min(4, fx.grandparents ?? rng.weighted([{ item: 0, weight: 3 }, { item: 1, weight: 4 }, { item: 2, weight: 3 }])));
  const rels: GrandparentRel[] = ["MAT_GRANDMA", "PAT_GRANDMA", "MAT_GRANDPA", "PAT_GRANDPA"];
  for (let i = rels.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [rels[i], rels[j]] = [rels[j], rels[i]];
  }
  fam.grandparents = rels.slice(0, n).map((rel, i) => ({ id: `gp${i + 1}`, rel, birthYear: (rel.startsWith("MAT") ? fam.mom.birthYear : fam.dad.birthYear) - rng.int(24, 32), alive: true }));
}

const CONTENT_TAG = /^(사진|영상|동영상|링크|이모티콘|스티커|음성|photo|video|link|sticker|voice)$/i;

/** "[아빠] 차 조심해라" → { tag: "아빠", text: "차 조심해라" }; "[사진] …" is content, not a speaker. */
export function splitSpeakerTag(text: string): { tag?: string; text: string } {
  // At the start, or right after an opening narration: "(전화가 왔다.) [아빠] 밥은 먹었니?"
  // A whole reply in brackets: "([아빠] 그래.)" → 아빠: "그래."
  const w = /^\(\s*\[([^\][]{1,12})\]\s*([^()]*)\)$/.exec(text.trim());
  if (w && !CONTENT_TAG.test(w[1])) return { tag: w[1], text: w[2].trim() };
  const m = /^(\([^)]*\)\s*)?\[([^\][]{1,12})\]\s*/.exec(text.trimStart());
  if (!m || CONTENT_TAG.test(m[2])) return { text };
  const t = text.trimStart();
  return { tag: m[2], text: (m[1] ?? "") + t.slice(m[0].length) };
}

type OccasionChoice = { t: Bi; r: Bi };
type OccasionDef = { title: Bi; who: string; location: string; line: Bi; solo?: Bi; choices: OccasionChoice[]; soloChoices?: OccasionChoice[]; variants?: Array<{ line: Bi; choices: OccasionChoice[] }>; apart?: { line: Bi; choices: OccasionChoice[] } };
const OCCASIONS = occasionData as unknown as Record<string, OccasionDef>;

type FunPick = { loc: string; act: string; label: Bi; r: Bi; season?: string };
type FunSet = { couple: FunPick[]; solo: FunPick[] };
const FUN = funData as unknown as Record<string, FunSet> & { apart: FunPick[] };
/** The dates people actually go on where you live (Korea: 인생네컷; Tokyo: 불꽃놀이; Paris: a Seine picnic). */
const funFor = (country: string): FunSet => FUN[cultureOf(country)] ?? FUN.ANGLO;

/** Lunar Return house → weekend options that month's mood leans toward. */
const LUNAR_FOCUS: Record<number, string[]> = {
  1: ["street", "habit", "gym"],
  2: ["restaurant", "diner", "street"],
  3: ["street", "library", "cafe", "diner"],
  4: ["home", "family_home"],
  5: ["cinema", "amusement_park", "date"],
  6: ["park", "habit"],
  7: ["date", "friend"],
  8: ["home", "library"],
  9: ["trip", "library"],
  10: ["library", "cafe"],
  11: ["friend", "amusement_park", "street"],
  12: ["home", "park", "cafe"],
};

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
  home: string;
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
    home: st.homeCountry,
    habits: Object.keys(w?.habits ?? {}),
    money: st.money,
  };
}


const TRIP_PHOTO: Record<string, string[]> = { paris: ["eiffel_day", "paris_street"], tokyo: ["tokyo_street"], coast: ["beach_day"], business_city: ["business_hotel_room", "meeting_room"] };
const CITY_PHOTO: Record<string, string[]> = { paris: ["eiffel_day", "paris_street"], tokyo: ["tokyo_street"], osaka: ["tokyo_street"], kyoto: ["tokyo_street"] };

/**
 * The picture behind "시간이 흐른다…": a trip in the summary always shows that place (Paris → the
 * Eiffel Tower; anywhere without its own painting → an arrival hall); a move → the airport; otherwise a
 * calm picture for the season, at random.
 */
function gapPhoto(st: LifeState, a: Snap, b: Snap, lines: string[], rng: SeededRandom): string | undefined {
  // Only a painting of that very place counts (Paris never stands in as "a street").
  const first = (ids: string[]) => ids.map((id) => photoFor(id)).find((ph, i) => ph === `bg/${ids[i]}.png`);
  const trip = b.trips.slice(a.trips.length)[0];
  if (trip) return first(TRIP_PHOTO[trip] ?? []) ?? photoFor("airport_arrival");
  // A city named in what happened ("싱가포르에 다녀왔다", "도쿄로 떠났다") other than home.
  const text = lines.join(" ");
  const home = findPlace(st.location.city)?.id;
  const named = PLACES.find((p) => p.id !== home && (text.includes(p.ko) || text.includes(p.en)) && /다녀왔|여행|떠났|이사|비행기|trip|travel|moved|flight/i.test(text));
  if (named && first(CITY_PHOTO[named.id] ?? [])) return first(CITY_PHOTO[named.id]!);
  if (/비행기|flight|plane/i.test(text)) return photoFor("airplane_cabin");
  if (named) return photoFor(/이사|moved/i.test(text) ? "airport_departure" : "airport_arrival");
  if (a.country !== b.country) return photoFor("airport_departure");
  const m = st.date.month;
  const season = m >= 3 && m <= 5 ? ["park_spring", "park_day", "cafe_day"] : m >= 6 && m <= 8 ? ["beach_day", "beach_sunset", "park_day"] : m >= 9 && m <= 11 ? ["park_autumn", "cafe_evening", "street_day"] : ["park_snow", "cafe_evening", "home_living_room"];
  const pool = season.map((id) => photoFor(id)).filter((x): x is string => !!x);
  return pool.length ? pool[rng.int(0, pool.length - 1)] : undefined;
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
  if (a.country !== b.country) add(7, b.country === b.home ? "고향으로 돌아왔다." : fixJosa(`${COUNTRY_KO[b.country] ?? b.country}(으)로 떠났다.`), b.country === b.home ? "Moved back home." : `Moved to ${b.country}.`);
  else if (a.city !== b.city) add(5, fixJosa(`${cityKo(b.city)}(으)로 이사했다.`), `Moved to ${b.city}.`);
  if (!a.retired && b.retired) add(6, "은퇴했다.", "Retired.");
  else if (a.employed && !b.employed) add(6, "회사를 떠났다.", "Left the job.");
  else if (!a.employed && b.employed) add(6, "새 일을 시작했다.", "Started a new job.");
  else if (a.employed && b.employed && a.cid !== b.cid) add(5, "이직했다.", "Changed jobs.");
  if (b.employed && a.cid === b.cid && b.level > a.level) add(5, "승진했다.", "Got promoted.");
  if (b.education !== a.education && EDU_KO[b.education]?.ko) add(5, EDU_KO[b.education].ko + ".", EDU_KO[b.education].en);
  if (!a.enrolled && b.enrolled) add(4, "다시 공부를 시작했다.", "Went back to school.");
  const newTrips = b.trips.slice(a.trips.length);
  for (const d of newTrips.slice(0, 1)) add(3, `${DEST_KO[d] ?? d}에 다녀왔다.`, `Took a trip to ${d}.`);
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
