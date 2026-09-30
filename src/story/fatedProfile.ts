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

/** Setup choices for the UI. */
export function fatedOptions(lang: "ko" | "en" = "ko"): { lives: Array<{ id: FatedFrom; name: string; hint: string }>; jobs: Array<{ id: string; name: string }> } {
  return {
    lives: data.lives.map((l) => ({ id: l.id as FatedFrom, name: l[lang], hint: l.hint[lang] })),
    jobs: FATED_JOBS.map((j) => ({ id: j.id, name: j[lang] })),
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
  const from: FatedFrom = fx.from ?? (rng.chance(0.6) ? "same" : rng.chance(0.6) ? "city" : "abroad");
  const known = findFatedJob(fx.job);
  const job: FatedJob = known ?? (fx.job ? { id: "custom", ko: fx.job, en: fx.job, place: "cafe", shift: "day", income: 0.5 } : FATED_JOBS[rng.int(0, FATED_JOBS.length - 1)]);
  const homePlace = findPlace(home.city) ?? PLACES.find((p) => p.id === "seoul")!;
  let place: PlaceInfo | undefined = fx.city ? findPlace(fx.city) : undefined;
  if (from === "same") place = homePlace;
  else if (from === "city") {
    if (!place || place.country !== homePlace.country || place.id === homePlace.id) {
      const opts = KOREA_OTHER.filter((id) => id !== homePlace.id);
      place = PLACES.find((p) => p.id === opts[rng.int(0, opts.length - 1)]);
    }
  } else {
    const born = typeof fx.birthplace === "string" ? findPlace(fx.birthplace) : undefined;
    if (!place || place.country === homePlace.country) place = born && born.country !== homePlace.country ? born : undefined;
    if (!place) {
      const id = ABROAD_DEFAULTS[rng.int(0, ABROAD_DEFAULTS.length - 1)];
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

export function meetPlan(state: LifeState, again: boolean): { location: string; activity?: string; line: Bi; intro: Bi; kind?: MeetKind } {
  const p = meetPlanBase(state, again);
  const kind = again ? undefined : p.location === "language_exchange_app" ? MEET_KINDS.app : p.location === "airplane" ? MEET_KINDS.flight : p.location === "business_hotel" || (state.story?.fatedLife?.from === "city" && p.location === "street") ? MEET_KINDS.trip : undefined;
  return { ...p, kind };
}

function meetPlanBase(state: LifeState, again: boolean): { location: string; activity?: string; line: Bi; intro: Bi } {
  const life = state.story?.fatedLife;
  const intro = TEXT[life && life.from !== "same" ? "introAway" : "intro"];
  if (!life) return { location: "cafe", line: { ko: "(자꾸 눈이 마주치던 그 사람이 먼저 다가왔다.)", en: "(The person whose eyes kept meeting yours walks over.)" }, intro };
  if (again) return { location: life.from === "abroad" ? "airport" : life.job.place === "language_exchange_app" ? "cafe" : life.job.place, line: TEXT.meetAgain, intro };
  if (life.from === "same") return { location: life.job.place, line: life.job.meet ?? TEXT.meetCity, intro };
  if (life.from === "city") return state.career.employed ? { location: "business_hotel", line: TEXT.meetCity, intro } : { location: "street", line: TEXT.meetCityTrip, intro };
  if (life.job.away) return { location: "airplane", line: TEXT.meetAbroadFlight, intro };
  return { location: "language_exchange_app", line: TEXT.meetAbroad, intro };
}
