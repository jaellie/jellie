/**
 * Where someone was born — and what the clocks said there at that moment.
 *
 *  - Astrology needs the place: the Ascendant, MC and the houses (natal, Solar/Lunar Return,
 *    progressed angles) depend on latitude/longitude, and every position depends on the exact
 *    instant — so the birth clock time must be converted with the UTC offset that was in force
 *    there and then (daylight saving, Korea's UTC+8:30 years, 1987–88 summer time…). The IANA
 *    time-zone database built into the JS runtime (Intl) knows that history.
 *  - 사주 reads the day and hour pillars off the clock. By 만세력 convention daylight time is taken
 *    out first (a 09:30 birth during 1987 summer time is read as 08:30), so births are normalized
 *    to local *standard* time. The instant — and so the astrology — stays exactly the same.
 *
 * The UI can offer the city list (`birthplaceOptions`) or send free text ("부산", "LA",
 * "New York"); unknown places fall back to Seoul, flagged as `known: false`.
 */
import placeData from "../../data/destiny/birthplaces.json";
import { type BirthPlace, DEFAULT_BIRTHPLACE } from "../astrology/chart";
import type { BirthData, Sex } from "../saju/calendar/fourPillars";

export interface PlaceInfo {
  id: string;
  ko: string;
  en: string;
  country: string;
  lat: number;
  lon: number;
  /** IANA time zone, e.g. "Asia/Seoul". */
  tz: string;
  aliases?: string[];
}

export const PLACES: PlaceInfo[] = placeData.places as PlaceInfo[];

/** A birthplace as the UI may send it: a city name, or coordinates (+ time zone if known). */
export type BirthplaceInput = string | { name?: string; id?: string; lat?: number; lon?: number; tz?: string; utcOffsetMinutes?: number };

export interface ResolvedBirth {
  /** For 사주 and astrology: local standard time + its UTC offset (same instant as the birth). */
  birth: BirthData;
  /** For astrology: coordinates, time zone, display names. */
  place: BirthPlace;
  /** UTC offset of the clocks at the birth moment (daylight time included), minutes. */
  clockOffsetMinutes: number;
  /** Minutes of daylight saving in force at birth (0 if none). */
  dstMinutes: number;
  /** false when the place wasn't recognized (Seoul was used). */
  known: boolean;
}

type LocalTime = { year: number; month: number; day: number; hour?: number; minute?: number };

const norm = (s: string) =>
  s
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s.,·'’\-()]/g, "")
    .replace(/(특별자치시|특별자치도|특별시|광역시)$/, "");

const INDEX: Map<string, PlaceInfo> = new Map();
for (const p of PLACES) for (const k of [p.id, p.ko, p.en, ...(p.aliases ?? [])]) INDEX.set(norm(k), p);

/** Find a city by its Korean or English name (or a common alias: "LA", "뉴욕", "부산광역시"…). */
export function findPlace(query: string | undefined): PlaceInfo | undefined {
  if (!query) return;
  const q = norm(query);
  if (!q) return;
  const hit = INDEX.get(q) ?? INDEX.get(q.replace(/(시|군|도)$/, ""));
  if (hit) return hit;
  // "서울 강남구", "Busan, Korea", "New York, NY": the first known name inside the text
  // (comma-separated parts first, then single words).
  const tryKey = (k: string) => INDEX.get(k) ?? INDEX.get(k.replace(/(시|군|도)$/, ""));
  for (const part of query.split(/[,/]+/)) {
    const h = tryKey(norm(part));
    if (h) return h;
  }
  for (const word of query.split(/[\s,/]+/)) {
    const h = word ? tryKey(norm(word)) : undefined;
    if (h) return h;
  }
  return;
}

/** Cities for a picker, in the given language (Korea first, then the world A–Z). */
export function birthplaceOptions(lang: "ko" | "en" = "ko"): Array<{ id: string; name: string; country: string }> {
  const kr = PLACES.filter((p) => p.country === "KR");
  const world = PLACES.filter((p) => p.country !== "KR").sort((a, b) => a[lang].localeCompare(b[lang], lang));
  return [...kr, ...world].map((p) => ({ id: p.id, name: p[lang], country: p.country }));
}

const REGION = new Map<string, Intl.DisplayNames | null>();
/** "KR" → "한국" / "Korea" (the browser's own country names). */
export function countryName(code: string, lang: "ko" | "en" = "ko"): string {
  if (code === "KR") return lang === "ko" ? "한국" : "Korea";
  if (!REGION.has(lang)) {
    try {
      REGION.set(lang, new Intl.DisplayNames([lang], { type: "region" }));
    } catch {
      REGION.set(lang, null);
    }
  }
  const n = REGION.get(lang)?.of(code) ?? code;
  // "홍콩(중국 특별행정구)" / "Hong Kong SAR China" → just "홍콩" / "Hong Kong".
  return n.replace(/\s*\(.*\)$/, "").replace(/ SAR China$/, "");
}

/** "서울 · 한국", but a city-state only once: "싱가포르", not "싱가포르 · 싱가포르". */
export function joinPlace(a: string, b: string): string {
  const k = (x: string) => x.replace(/\s+/g, "").toLowerCase();
  return !a || !b || k(a) === k(b) ? a || b : `${a} · ${b}`;
}

/**
 * Autocomplete for a city field: what the typed text could mean, best first (exact name, then names
 * that start with it, then names that contain it). The UI must make the player tap one of these —
 * typed text that matches nothing ("여수수") is not a city, and the field stays unconfirmed.
 */
export function searchPlaces(query: string, lang: "ko" | "en" = "ko", limit = 8): Array<{ id: string; name: string; country: string; countryName: string; label: string }> {
  const q = norm(query ?? "");
  if (!q) return [];
  const scored: Array<{ p: PlaceInfo; s: number }> = [];
  for (const p of PLACES) {
    const keys = [p.ko, p.en, p.id, ...(p.aliases ?? [])].map(norm);
    let s = keys.includes(q) ? 0 : keys.some((k) => k.startsWith(q)) ? 1 : keys.some((k) => k.includes(q)) ? 2 : -1;
    // A country name finds its cities too ("영국" / "UK" → 런던 · 영국), after any city that matches by name.
    if (s < 0 && countryKeys(p.country).some((k) => k === q || (q.length >= 2 && k.startsWith(q)))) s = 3;
    if (s >= 0) scored.push({ p, s });
  }
  scored.sort((a, b) => a.s - b.s || (a.p.country === "KR" ? 0 : 1) - (b.p.country === "KR" ? 0 : 1) || a.p[lang].localeCompare(b.p[lang], lang));
  return scored.slice(0, limit).map(({ p }) => ({ id: p.id, name: p[lang], country: p.country, countryName: countryName(p.country, lang), label: joinPlace(p[lang], countryName(p.country, lang)) }));
}

/** Everyday names people type for a country, beyond the official ones. */
const COUNTRY_ALIASES: Record<string, string[]> = {
  GB: ["uk", "england", "britain", "great britain", "잉글랜드", "영국"],
  US: ["usa", "america", "united states", "미국", "미합중국"],
  KR: ["korea", "south korea", "대한민국", "한국", "남한"],
  JP: ["japan", "일본"],
  CN: ["china", "중국"],
  TW: ["taiwan", "대만"],
  AE: ["uae", "emirates", "아랍에미리트"],
  NL: ["holland", "netherlands", "네덜란드"],
  CZ: ["czechia", "czech republic", "체코"],
};
const COUNTRY_KEYS = new Map<string, string[]>();
function countryKeys(code: string): string[] {
  if (!COUNTRY_KEYS.has(code)) COUNTRY_KEYS.set(code, [code, countryName(code, "ko"), countryName(code, "en"), ...(COUNTRY_ALIASES[code] ?? [])].map(norm));
  return COUNTRY_KEYS.get(code)!;
}

/** The one city this text names exactly (by id, Korean/English name or alias) — or undefined: ask again. */
export function placeById(id: string | undefined): PlaceInfo | undefined {
  return id ? PLACES.find((p) => p.id === id) : undefined;
}

// ---- historical UTC offsets (Intl / IANA tz) --------------------------------

const FORMATTERS = new Map<string, Intl.DateTimeFormat | null>();
function formatter(tz: string): Intl.DateTimeFormat | null {
  if (!FORMATTERS.has(tz)) {
    try {
      FORMATTERS.set(tz, new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }));
    } catch {
      FORMATTERS.set(tz, null); // unknown zone in this runtime
    }
  }
  return FORMATTERS.get(tz)!;
}

/** UTC offset (minutes) of a time zone at an instant. */
export function offsetAtInstant(tz: string, ms: number): number | undefined {
  const f = formatter(tz);
  if (!f) return;
  const p: Record<string, number> = {};
  for (const x of f.formatToParts(new Date(ms))) if (x.type !== "literal") p[x.type] = Number(x.value);
  const wall = Date.UTC(p.year, p.month - 1, p.day, p.hour % 24, p.minute);
  return Math.round((wall - Math.floor(ms / 60_000) * 60_000) / 60_000);
}

/** UTC offset (minutes) in force at a *local* clock time in a zone (daylight time included). */
export function offsetForLocalTime(tz: string, t: LocalTime): number | undefined {
  const wall = Date.UTC(t.year, t.month - 1, t.day, t.hour ?? 12, t.minute ?? 0);
  let off = offsetAtInstant(tz, wall - 9 * 60 * 60_000);
  if (off === undefined) return;
  for (let i = 0; i < 3; i++) off = offsetAtInstant(tz, wall - off * 60_000)!;
  return off;
}

/**
 * Daylight time in force at an instant (minutes; 0 if none): the clock was temporarily ahead of
 * the level it had on both sides of that season. A permanent change (Korea moving from UTC+8:30
 * to UTC+9 in 1961) isn't daylight time.
 */
export function dstAtInstant(tz: string, ms: number): number {
  const off = offsetAtInstant(tz, ms);
  if (off === undefined) return 0;
  let before = Infinity;
  let after = Infinity;
  for (let d = 15; d <= 210; d += 15) {
    before = Math.min(before, offsetAtInstant(tz, ms - d * 86_400_000) ?? off);
    after = Math.min(after, offsetAtInstant(tz, ms + d * 86_400_000) ?? off);
  }
  if (!(before < off && after < off)) return 0;
  const dst = off - Math.max(before, after);
  return dst > 0 && dst <= 120 ? dst : 0;
}

/** The time zone of the nearest known city (for bare coordinates without a zone). */
function nearestPlace(lat: number, lon: number): PlaceInfo {
  const rad = Math.PI / 180;
  let best = PLACES[0];
  let bestD = Infinity;
  for (const p of PLACES) {
    const d = Math.acos(Math.min(1, Math.sin(lat * rad) * Math.sin(p.lat * rad) + Math.cos(lat * rad) * Math.cos(p.lat * rad) * Math.cos((lon - p.lon) * rad)));
    if (d < bestD) (bestD = d), (best = p);
  }
  return best;
}

const CACHE = new Map<string, ResolvedBirth>();

/**
 * Resolve a birth (local clock date/time at the birthplace) into what the charts need.
 * No place → Seoul (the game's default), flagged `known: false` only if a place was given but not found.
 */
export function resolveBirth(local: LocalTime & { sex: Sex }, input?: BirthplaceInput, fallback?: BirthPlace): ResolvedBirth {
  const key = JSON.stringify([local, input ?? null, fallback ?? null]);
  const hit = CACHE.get(key);
  if (hit) return hit;

  let info: PlaceInfo | undefined;
  let lat: number | undefined;
  let lon: number | undefined;
  let tz: string | undefined;
  let fixedOffset: number | undefined;
  let known = true;
  if (typeof input === "string") {
    info = findPlace(input);
    known = !!info;
  } else if (input) {
    info = (input.id ? PLACES.find((p) => p.id === input.id) : undefined) ?? findPlace(input.name);
    lat = input.lat;
    lon = input.lon;
    tz = input.tz;
    fixedOffset = input.utcOffsetMinutes;
    if (!info && (lat === undefined || lon === undefined)) known = false;
  }
  if (!info && lat !== undefined && lon !== undefined && !tz && fixedOffset === undefined) tz = nearestPlace(lat, lon).tz;
  if (!info && lat === undefined && fallback?.tz) {
    // No place of their own: use the given fallback (e.g. the player's birthplace for the destined person).
    lat = fallback.lat;
    lon = fallback.lon;
    tz = fallback.tz;
  }
  if (!info && (lat === undefined || lon === undefined)) info = PLACES.find((p) => p.id === "seoul");
  lat ??= info?.lat ?? DEFAULT_BIRTHPLACE.lat;
  lon ??= info?.lon ?? DEFAULT_BIRTHPLACE.lon;
  tz ??= info?.tz ?? "Asia/Seoul";

  const clock = fixedOffset ?? offsetForLocalTime(tz, local) ?? 540;
  const timeKnown = local.hour !== undefined;
  const instant = Date.UTC(local.year, local.month - 1, local.day, local.hour ?? 12, local.minute ?? 0) - clock * 60_000;
  const dst = fixedOffset === undefined && timeKnown ? dstAtInstant(tz, instant) : 0;
  // 사주 reads the clock in standard time: take daylight time out (same instant).
  const std = new Date(instant + (clock - dst) * 60_000);
  const birth: BirthData = timeKnown
    ? { year: std.getUTCFullYear(), month: std.getUTCMonth() + 1, day: std.getUTCDate(), hour: std.getUTCHours(), minute: std.getUTCMinutes(), utcOffsetMinutes: clock - dst, longitude: lon, sex: local.sex }
    : { year: local.year, month: local.month, day: local.day, utcOffsetMinutes: clock, longitude: lon, sex: local.sex };
  const place: BirthPlace = { lat, lon, name: info?.en ?? (typeof input === "object" ? input?.name : undefined) ?? "Custom", ko: info?.ko, tz, country: info?.country };
  const out: ResolvedBirth = { birth, place, clockOffsetMinutes: clock, dstMinutes: dst, known };
  CACHE.set(key, out);
  return out;
}
