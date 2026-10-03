/**
 * Layer A — astronomical helpers. NO gameplay logic here.
 *
 * Sun apparent ecliptic longitude uses the low-precision solar theory from
 * Jean Meeus, "Astronomical Algorithms" ch. 25 (≈0.01° ≈ 15 min of time).
 * That is sufficient for pillar boundaries except for births within minutes
 * of a solar-term instant, which the chart flags as `nearSolarTermBoundary`.
 */

const DEG = Math.PI / 180;
const MS_PER_DAY = 86_400_000;
/** Julian Day of the Unix epoch (1970-01-01T00:00Z). */
const JD_UNIX_EPOCH = 2440587.5;

export function julianDayFromDate(date: Date): number {
  return date.getTime() / MS_PER_DAY + JD_UNIX_EPOCH;
}

export function dateFromJulianDay(jd: number): Date {
  return new Date((jd - JD_UNIX_EPOCH) * MS_PER_DAY);
}

/** Approximate ΔT = TT − UT in seconds (Espenak & Meeus polynomials, 1900–2150). */
export function deltaTSeconds(year: number): number {
  if (year < 1900) return -2.79 + 1.494119 * (year - 1900) - 0.0598939 * (year - 1900) ** 2;
  if (year < 1920) {
    const t = year - 1900;
    return -2.79 + 1.494119 * t - 0.0598939 * t ** 2 + 0.0061966 * t ** 3 - 0.000197 * t ** 4;
  }
  if (year < 1941) {
    const t = year - 1920;
    return 21.2 + 0.84493 * t - 0.0761 * t ** 2 + 0.0020936 * t ** 3;
  }
  if (year < 1961) {
    const t = year - 1950;
    return 29.07 + 0.407 * t - t ** 2 / 233 + t ** 3 / 2547;
  }
  if (year < 1986) {
    const t = year - 1975;
    return 45.45 + 1.067 * t - t ** 2 / 260 - t ** 3 / 718;
  }
  if (year < 2005) {
    const t = year - 2000;
    return 63.86 + 0.3345 * t - 0.060374 * t ** 2 + 0.0017275 * t ** 3 + 0.000651814 * t ** 4 + 0.00002373599 * t ** 5;
  }
  if (year < 2050) {
    const t = year - 2000;
    return 62.92 + 0.32217 * t + 0.005589 * t ** 2;
  }
  const u = (year - 1820) / 100;
  return -20 + 32 * u * u - 0.5628 * (2150 - year);
}

function normalizeDegrees(x: number): number {
  return ((x % 360) + 360) % 360;
}

/** Apparent geocentric ecliptic longitude of the Sun (degrees) at a UT Julian Day. */
export function sunApparentLongitude(jdUT: number): number {
  const year = 2000 + (jdUT - 2451545) / 365.25;
  const jde = jdUT + deltaTSeconds(year) / 86400;
  const T = (jde - 2451545.0) / 36525;
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
  const Mr = M * DEG;
  const C =
    (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mr) +
    (0.019993 - 0.000101 * T) * Math.sin(2 * Mr) +
    0.000289 * Math.sin(3 * Mr);
  const trueLong = L0 + C;
  const omega = 125.04 - 1934.136 * T;
  return normalizeDegrees(trueLong - 0.00569 - 0.00478 * Math.sin(omega * DEG));
}

/** Signed smallest angular difference a − b in (−180, 180]. */
function angleDiff(a: number, b: number): number {
  let d = normalizeDegrees(a - b);
  if (d > 180) d -= 360;
  return d;
}

/**
 * Find the UT Julian Day when the Sun reaches `targetLongitude`, searching
 * near `jdGuess` (must be within ~±20 days). Newton iteration on the mean
 * solar motion, then refined.
 */
export function findSunLongitudeMoment(targetLongitude: number, jdGuess: number): number {
  let jd = jdGuess;
  for (let i = 0; i < 50; i++) {
    const diff = angleDiff(targetLongitude, sunApparentLongitude(jd));
    if (Math.abs(diff) < 1e-7) break;
    jd += diff / 0.98564736; // mean daily motion (deg/day)
  }
  return jd;
}

/**
 * 節 (jie) — the 12 solar terms that begin each Saju month.
 * Longitude 315° (立春) opens the 寅 month; every +30° advances one month.
 */
export interface SolarTerm {
  /** 0 = 立春 (寅 month) … 11 = 小寒 (丑 month) */
  monthIndex: number;
  longitude: number;
  nameHanja: string;
  jdUT: number;
}

export const JIE_NAMES = ["立春", "驚蟄", "清明", "立夏", "芒種", "小暑", "立秋", "白露", "寒露", "立冬", "大雪", "小寒"];

export function jieLongitude(monthIndex: number): number {
  return normalizeDegrees(315 + 30 * monthIndex);
}

/** Saju month index (0 = 寅 … 11 = 丑) for a given solar longitude. */
export function sajuMonthIndexFromLongitude(longitude: number): number {
  return Math.floor(normalizeDegrees(longitude - 315) / 30);
}

/** The 節 that started the Saju month containing `jd`. */
export function previousJie(jd: number): SolarTerm {
  const lon = sunApparentLongitude(jd);
  const monthIndex = sajuMonthIndexFromLongitude(lon);
  const target = jieLongitude(monthIndex);
  const guess = jd - normalizeDegrees(lon - target) / 0.9856;
  return { monthIndex, longitude: target, nameHanja: JIE_NAMES[monthIndex], jdUT: findSunLongitudeMoment(target, guess) };
}

/** The next 節 strictly after `jd`. */
export function nextJie(jd: number): SolarTerm {
  const lon = sunApparentLongitude(jd);
  const monthIndex = (sajuMonthIndexFromLongitude(lon) + 1) % 12;
  const target = jieLongitude(monthIndex);
  const guess = jd + normalizeDegrees(target - lon) / 0.9856;
  return { monthIndex, longitude: target, nameHanja: JIE_NAMES[monthIndex], jdUT: findSunLongitudeMoment(target, guess) };
}

/** Moment of 立春 (Sun at 315°) in a Gregorian year, as UT Julian Day. */
export function lichunMoment(year: number): number {
  const guess = julianDayFromDate(new Date(Date.UTC(year, 1, 4, 0, 0)));
  return findSunLongitudeMoment(315, guess);
}

/** Chronological Julian Day Number (integer) of a civil calendar date. */
export function civilDayNumber(year: number, month: number, day: number): number {
  return Math.round(julianDayFromDate(new Date(Date.UTC(year, month - 1, day, 12))));
}
