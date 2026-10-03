/**
 * World time: weekday, season, time-of-day and deterministic weather.
 */
import type { GameDate } from "../core/gameDate";
import { CLIMATE } from "./catalog";
import type { Season, TimeOfDay, Weather, WorldTime } from "./types";

export function weekdayOf(year: number, month: number, day: number): number {
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export function seasonOf(month: number): Season {
  if (month >= 3 && month <= 5) return "SPRING";
  if (month >= 6 && month <= 8) return "SUMMER";
  if (month >= 9 && month <= 11) return "AUTUMN";
  return "WINTER";
}

export function timeOfDayOf(hour: number): TimeOfDay {
  if (hour >= 5 && hour < 10) return "MORNING";
  if (hour >= 10 && hour < 17) return "DAY";
  if (hour >= 17 && hour < 20) return "EVENING";
  return "NIGHT";
}

function hash01(...parts: Array<string | number>): number {
  let h = 2166136261;
  for (const ch of parts.join("|")) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  h ^= h >>> 13;
  h = Math.imul(h, 0x5bd1e995) >>> 0;
  return ((h ^ (h >>> 15)) >>> 0) / 4294967296;
}

/** Same (seed, date, region) → same weather, so revisiting a day is consistent. */
export function weatherFor(seed: number, date: GameDate & { day: number }, region: string): Weather {
  const season = seasonOf(date.month);
  const table = (CLIMATE[region] ?? CLIMATE.default)[season];
  let r = hash01(seed, date.year, date.month, date.day, region);
  for (const [w, p] of Object.entries(table) as Array<[Weather, number]>) {
    if (r < p) return w;
    r -= p;
  }
  return "CLEAR";
}

export function worldTime(seed: number, date: GameDate, hour: number, region = "default"): WorldTime {
  const d = { year: date.year, month: date.month, day: date.day ?? 15 };
  return {
    date: d,
    hour,
    weekday: weekdayOf(d.year, d.month, d.day),
    season: seasonOf(d.month),
    timeOfDay: timeOfDayOf(hour),
    weather: weatherFor(seed, d, region),
  };
}

export const isWeekend = (t: WorldTime) => t.weekday === 0 || t.weekday === 6;

export function formatWorldDate(t: WorldTime): string {
  return `${t.date.year}.${String(t.date.month).padStart(2, "0")}.${String(t.date.day).padStart(2, "0")}`;
}
