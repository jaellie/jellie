/**
 * The destined person's own life, from setup: where they live and what they do.
 *
 *  - Where they live decides how you meet (a café in your neighborhood, a work trip to their city, a
 *    language-exchange app across time zones) and, once you're together, whether love is long distance
 *    (video calls at odd hours, a visit, then deciding who moves).
 *  - Their job decides where you might run into them (the barista at your café, the doctor in the ER),
 *    their schedule (night shifts, flights), their income, and job moments while you're together.
 *
 * The UI offers `fatedOptions(lang)`; setup sends `fated.from`, `fated.job` (id or free text) and
 * optionally `fated.city` (another country's or Korean city).
 */
import routineData from "../../data/story/meetRoutines.json";
import data from "../../data/story/fatedProfile.json";
import type { SeededRandom } from "../core/rng";
import { PLACES, type PlaceInfo, findPlace, offsetAtInstant } from "../destiny/birthplace";
import type { LifeState } from "../sim/types";
import { hasBatchim } from "../game/text";

type Bi = { ko: string; en: string };

export interface FatedJob {
  id: string;
  ko: string;
  en: string;
  /** Location id where they work (where you might meet them in the same neighborhood). */
  place: string;
  shift: "day" | "night" | "irregular" | "remote";
  /** 0..1 — how much they earn. */
  income: number;
  /** Often away (flights, deployments). */
  away?: boolean;
  /** Irregular income. */
  unstable?: boolean;
  /** A demanding care/safety job (the late call from the hospital, the dangerous night). */
  care?: boolean;
  meet?: Bi;
  /** Where the player spends a workday in this job (default office; "home" = works from home; "none" = no work). */
  work?: string;
  /** employee | self (own business / freelance: no coworkers) | civil (grades) | student | none (no job). */
  kind?: "employee" | "self" | "civil" | "student" | "none";
}

export type FatedFrom = "same" | "city" | "abroad";

/** What the story knows about the destined person's life (saved with the game). */
export interface FatedLife {
  from: FatedFrom;
  job: FatedJob;
  /** Where they live. */
  city: { id: string; ko: string; en: string; tz: string; country: string };
  /** Chances left to meet again after a missed meeting. */
  retries: number;
}

export const FATED_JOBS: FatedJob[] = data.jobs as FatedJob[];
const TEXT = data as unknown as Record<string, Bi>;

const norm = (s: string) => s.toLowerCase().replace(/[\s·.\-]/g, "");

/** A job by id, Korean or English name (or free text containing one: "대학병원 의사" → doctor). */
export function findFatedJob(input: string | undefined): FatedJob | undefined {
  if (!input) return;
  const q = norm(input);
  const exact = FATED_JOBS.find((j) => j.id === input || norm(j.ko) === q || norm(j.en) === q);
  if (exact) return exact;
  return FATED_JOBS.find((j) => q.includes(norm(j.ko)) || q.includes(norm(j.en)));
}

/** The player's own job (setup.job): the same list as the partner's, from 무직 and 학생 to 파일럿. */
export function myJobOptions(lang: "ko" | "en" = "ko"): { question: string; jobs: Array<{ id: string; name: string }> } {
  const ko = lang === "ko";
  const first = ["office", "student", "unemployed", "job_seeker", "freelancer"];
  const jobs = [...first.map((id) => FATED_JOBS.find((j) => j.id === id)!), ...FATED_JOBS.filter((j) => !first.includes(j.id))];
  return { question: ko ? "나의 직업은?" : "What do you do?", jobs: jobs.map((j) => ({ id: j.id, name: ko ? j.ko : j.en })) };
}

/** Setup choices for the UI. */
export function fatedOptions(lang: "ko" | "en" = "ko"): {
  statusQuestion: string;
  /** married / dating come with a date to ask for (dateLabel): send it as fated.since — the story starts that day. */
  statuses: Array<{ id: "married" | "dating" | "talking" | "acquaintance" | "stranger"; name: string; hint: string; dateLabel?: string }>;
  lives: Array<{ id: FatedFrom; name: string; hint: string }>;
  /** The city field (shown when they live in another city or country): label + guide line under it. */
  cityLabel: string;
  cityHint: string;
  jobs: Array<{ id: string; name: string }>;
} {
  const ko = lang === "ko";
  return {
    cityLabel: ko ? "그 사람이 사는 도시" : "The city they live in",
    cityHint: ko ? "목록에 없다면 가장 가까운 지역을 선택하세요" : "Not on the list? Pick the nearest city",
    statusQuestion: ko ? "지금 두 사람, 어떤 사이인가요?" : "What are you two right now?",
    statuses: [
      { id: "married", name: ko ? "네, 지금 결혼했어요" : "We're married", hint: ko ? "결혼한 날부터 시작해요" : "Start from your wedding day", dateLabel: ko ? "결혼한 날" : "Wedding date" },
      { id: "dating", name: ko ? "네, 지금 사귀고 있어요" : "We're dating", hint: ko ? "사귀기 시작한 날부터 — 100일, 기념일마다 축하해요" : "From the day you got together — with 100-day and anniversary celebrations", dateLabel: ko ? "사귀기 시작한 날" : "The day you got together" },
      { id: "talking", name: ko ? "아니, 썸 타는 중" : "No, but we're talking", hint: ko ? "썸에서 첫 고백까지" : "From the talking stage to the first confession" },
      { id: "acquaintance", name: ko ? "아니, 아직 그냥 아는 사이야" : "No, we just know each other", hint: ko ? "아는 사이에서, 운명의 순간까지" : "From just knowing each other to the moment it changes" },
      { id: "stranger", name: ko ? "아니, 아직 서로 몰라" : "No, we haven't met", hint: ko ? "첫 만남부터 시작해요" : "Start from the first meeting" },
    ],
    lives: data.lives.map((l) => ({ id: l.id as FatedFrom, name: l[lang], hint: l.hint[lang] })),
    // Exactly the same options, in the same order, as "나의 직업은?" (the UI adds "운명에 맡기기" on top).
    jobs: myJobOptions(lang).jobs,
  };
}

const ABROAD_DEFAULTS = ["tokyo", "newyork", "paris", "london", "sydney", "vancouver", "berlin", "singapore", "losangeles", "taipei"];
const KOREA_OTHER = ["busan", "daegu", "daejeon", "gwangju", "jeju", "incheon", "ulsan", "suwon"];

function cityOf(p: PlaceInfo): FatedLife["city"] {
  return { id: p.id, ko: p.ko, en: p.en, tz: p.tz, country: p.country };
}

/** Work out the destined person's life from setup (anything missing is filled in plausibly). */
export function resolveFatedLife(
  fx: { from?: FatedFrom; job?: string; city?: string; birthplace?: unknown },
  home: { city: string },
  rng: SeededRandom,
): FatedLife {
  const known = findFatedJob(fx.job);
  const job: FatedJob = known ?? (fx.job ? { id: "custom", ko: fx.job, en: fx.job, place: "cafe", shift: "day", income: 0.5 } : FATED_JOBS[rng.int(0, FATED_JOBS.length - 1)]);
  const homePlace = findPlace(home.city) ?? PLACES.find((p) => p.id === "seoul")!;
  let place: PlaceInfo | undefined = fx.city ? findPlace(fx.city) : undefined;
  // Their city decides it, measured from where *you* live: you in New York, them in Busan → abroad.
  const from: FatedFrom = place ? (place.id === homePlace.id ? "same" : place.country === homePlace.country ? "city" : "abroad") : fx.from ?? (rng.chance(0.6) ? "same" : rng.chance(0.6) ? "city" : "abroad");
  if (from === "same") place = homePlace;
  else if (from === "city") {
    if (!place || place.country !== homePlace.country || place.id === homePlace.id) {
      // Another city in your own country (Korea: the usual suspects; elsewhere: the gazetteer).
      const opts = homePlace.country === "KR" ? KOREA_OTHER.filter((id) => id !== homePlace.id) : PLACES.filter((p) => p.country === homePlace.country && p.id !== homePlace.id).map((p) => p.id);
      place = opts.length ? PLACES.find((p) => p.id === opts[rng.int(0, opts.length - 1)]) : undefined;
    }
  } else {
    const born = typeof fx.birthplace === "string" ? findPlace(fx.birthplace) : undefined;
    if (!place || place.country === homePlace.country) place = born && born.country !== homePlace.country ? born : undefined;
    if (!place) {
      // Abroad from where you live (living in New York, "abroad" can be Seoul).
      const opts = ABROAD_DEFAULTS.filter((id) => PLACES.find((p) => p.id === id)?.country !== homePlace.country);
      const id = opts[rng.int(0, opts.length - 1)];
      place = PLACES.find((p) => p.id === id);
    }
  }
  return { from, job, city: cityOf(place ?? homePlace), retries: 2 };
}

/** Hours their clock is ahead of yours (negative: behind). */
export function tzDiffHours(life: FatedLife, homeTz = "Asia/Seoul", at = Date.now()): number {
  const a = offsetAtInstant(life.city.tz, at) ?? 540;
  const b = offsetAtInstant(homeTz, at) ?? 540;
  return Math.round(((a - b) / 60) * 2) / 2;
}

function clock(h: number): Bi {
  const hh = ((Math.round(h) % 24) + 24) % 24;
  const part = hh < 5 ? "새벽" : hh < 12 ? "아침" : hh < 18 ? "오후" : "밤";
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return { ko: `${part} ${h12}시`, en: `${h12} ${hh < 12 ? "a.m." : "p.m."}` };
}

/** Text placeholders about the destined person ({fatedCity}, {fatedJob}, {fatedTime}, {tzdiff}). */
export function fatedVars(state: LifeState): Record<string, string> {
  const life = state.story?.fatedLife;
  if (!life) return {};
  const diff = tzDiffHours(life);
  const there = clock(22 + diff); // when it's 10 p.m. for you
  const npc = Object.values(state.world?.npcs ?? {}).find((n) => n.fated);
  return {
    fatedName: npc?.name ?? "",
    // "회사원이라고" / "의사라고" (the copula keeps its 이 only after a final consonant).
    fatedJobCop: life.job.ko + (hasBatchim(life.job.ko) ? "이" : ""),
    fatedCity: life.city.ko,
    fatedCity_ko: life.city.ko,
    fatedCity_en: life.city.en,
    fatedJob: life.job.ko,
    fatedJob_ko: life.job.ko,
    fatedJob_en: life.job.en,
    fatedTime: there.ko,
    fatedTime_ko: there.ko,
    fatedTime_en: there.en,
    tzdiff: String(Math.abs(diff)),
  };
}

/** Where and how you first meet (or meet again) — shaped by where they live and what they do. */
type MeetKind = { choices: Bi[]; MISSED: Bi; SLOW_BURN: Bi };
const MEET_KINDS = (data as unknown as { meetKinds: Record<string, MeetKind> }).meetKinds;

const ONLINE = (data as unknown as { meetOnline: { abroad: Array<{ location: string; line: Bi }>; near: Array<{ location: string; line: Bi }> } }).meetOnline;

const ROUTINES = routineData.routines as Array<{ id: string; signals: string[]; location: string; activity?: string; line: Bi; work?: boolean }>;

export function meetPlan(state: LifeState, again: boolean): { location: string; activity?: string; line: Bi; intro: Bi; kind?: MeetKind } {
  const p = meetPlanBase(state, again);
  const kind = again ? undefined : p.location === "language_exchange_app" ? MEET_KINDS.app : MEET_KINDS[p.location] ? MEET_KINDS[p.location] : p.location === "airplane" ? MEET_KINDS.flight : p.location === "business_hotel" || (state.story?.fatedLife?.from === "city" && p.location === "street") ? MEET_KINDS.trip : undefined;
  return { ...p, kind };
}

function meetPlanBase(state: LifeState, again: boolean): { location: string; activity?: string; line: Bi; intro: Bi } {
  const life = state.story?.fatedLife;
  const intro = TEXT[life && life.from !== "same" ? "introAway" : "intro"];
  if (!life) return { location: "cafe", line: { ko: "(자꾸 눈이 마주치던 그 사람이 먼저 다가왔다.)", en: "(The person whose eyes kept meeting yours walks over.)" }, intro };
  if (again) return { location: life.from === "abroad" ? "airport" : life.job.place === "language_exchange_app" ? "cafe" : life.job.place, line: TEXT.meetAgain, intro };
  // Not everyone meets the same way: a stable pick per person (their sprite seed), online or not.
  const fated = Object.values(state.world?.npcs ?? {}).find((n) => n.fated);
  const pick = (fated?.spriteSeed ?? 7) >>> 0;
  const near = ONLINE.near;
  // How you meet follows the chart of that year: 도화 → a party or a festival, 역마 → the last bus or a
  // station, 천을귀인 → someone introduces or helps you, 화개 → a library or a gallery, 목성 7하우스 →
  // a blind date… (about 3 times in 4; otherwise it follows their job).
  if ((life.from === "same" || life.from === "city") && pick % 4 !== 3) {
    const ev = state.story?.script?.find((e) => e.theme === "LOVE_MEETING" && !e.done);
    // "사주:DOHWA" → DOHWA, "점성:JUPITER@7H" → JUPITER@H7
    const sig = new Set((ev?.signals ?? []).map((x) => x.replace(/^(사주|점성):/, "").replace(/^([A-Z]+)@(\d+)H$/, "$1@H$2")));
    const employee = state.career.employed && !["own-business", "second-career"].includes(state.career.field ?? "");
    const ms = ROUTINES.filter((r) => r.signals.some((x) => sig.has(x)) && (!r.work || employee));
    if (ms.length) {
      const r = ms[(pick + Number(state.flags.lifeSalt ?? 0)) % ms.length];
      if (r.work) state.flags.fatedCoworker = "1";
      return { location: r.location, ...(r.activity ? { activity: r.activity } : {}), line: r.line, intro };
    }
  }
  if (life.from === "same") return pick % 4 === 0 ? { location: near[pick % near.length].location, line: near[pick % near.length].line, intro } : { location: life.job.place, line: life.job.meet ?? TEXT.meetCity, intro };
  if (life.from === "city") return pick % 4 === 1 ? { location: near[pick % near.length].location, line: near[pick % near.length].line, intro } : state.career.employed ? { location: "business_hotel", line: TEXT.meetCity, intro } : { location: "street", line: TEXT.meetCityTrip, intro };
  if (life.job.away && pick % 2 === 0) return { location: "airplane", line: TEXT.meetAbroadFlight, intro };
  const o = ONLINE.abroad[pick % ONLINE.abroad.length];
  return { location: o.location, line: o.line, intro };
}
