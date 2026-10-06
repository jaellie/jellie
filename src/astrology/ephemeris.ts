/**
 * Astrology Layer A — planetary positions. NO interpretation here.
 *
 * - Planets: JPL Keplerian elements (Table 1, 1800–2050), heliocentric →
 *   geocentric, J2000 → equinox of date via general precession. ~0.1–0.5°.
 * - Sun: reuses the Saju solar theory (Meeus ch. 25, ~0.01°).
 * - Moon: truncated Meeus ch. 47 series (~0.3°).
 * - Angles: Ascendant / Midheaven from local sidereal time and latitude.
 */
import planetData from "../../data/astrology/planets.json";
import { deltaTSeconds, sunApparentLongitude } from "../saju/calendar/astronomy";

export type Planet = "SUN" | "MOON" | "MERCURY" | "VENUS" | "MARS" | "JUPITER" | "SATURN" | "URANUS" | "NEPTUNE" | "PLUTO";
export const PLANETS: Planet[] = ["SUN", "MOON", "MERCURY", "VENUS", "MARS", "JUPITER", "SATURN", "URANUS", "NEPTUNE", "PLUTO"];

const DEG = Math.PI / 180;
const norm = (x: number) => ((x % 360) + 360) % 360;
type Elements = { base: number[]; rate: number[] };
const EL = planetData.elements as Record<string, Elements>;

function centuriesTT(jdUT: number): number {
  const year = 2000 + (jdUT - 2451545) / 365.25;
  return (jdUT + deltaTSeconds(year) / 86400 - 2451545) / 36525;
}

function helio(name: string, T: number): [number, number, number] {
  const e0 = EL[name];
  const [a, e, I, L, wbar, O] = e0.base.map((b, i) => b + e0.rate[i] * T);
  const w = wbar - O;
  const M = norm(L - wbar) * DEG;
  let E = M + e * Math.sin(M);
  for (let i = 0; i < 12; i++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  const xp = a * (Math.cos(E) - e);
  const yp = a * Math.sqrt(1 - e * e) * Math.sin(E);
  const [cw, sw, cO, sO, cI, sI] = [Math.cos(w * DEG), Math.sin(w * DEG), Math.cos(O * DEG), Math.sin(O * DEG), Math.cos(I * DEG), Math.sin(I * DEG)];
  return [
    (cw * cO - sw * sO * cI) * xp + (-sw * cO - cw * sO * cI) * yp,
    (cw * sO + sw * cO * cI) * xp + (-sw * sO + cw * cO * cI) * yp,
    sw * sI * xp + cw * sI * yp,
  ];
}

/** General precession in longitude (deg) from J2000 to date. */
const precession = (T: number) => 1.396971 * T + 0.0003086 * T * T;

function moonLongitude(T: number): number {
  const Lp = 218.3164477 + 481267.88123421 * T;
  const D = (297.8501921 + 445267.1114034 * T) * DEG;
  const M = (357.5291092 + 35999.0502909 * T) * DEG;
  const Mp = (134.9633964 + 477198.8675055 * T) * DEG;
  const F = (93.272095 + 483202.0175233 * T) * DEG;
  const s = Math.sin;
  return norm(
    Lp +
      6.288774 * s(Mp) +
      1.274027 * s(2 * D - Mp) +
      0.658314 * s(2 * D) +
      0.213618 * s(2 * Mp) -
      0.185116 * s(M) -
      0.114332 * s(2 * F) +
      0.058793 * s(2 * D - 2 * Mp) +
      0.057066 * s(2 * D - M - Mp) +
      0.053322 * s(2 * D + Mp) +
      0.045758 * s(2 * D - M) -
      0.040923 * s(M - Mp) -
      0.03472 * s(D) -
      0.030383 * s(M + Mp) +
      0.015327 * s(2 * D - 2 * F) -
      0.012528 * s(Mp + 2 * F) +
      0.01098 * s(Mp - 2 * F) +
      0.010675 * s(4 * D - Mp) +
      0.010034 * s(3 * Mp) +
      0.008548 * s(4 * D - 2 * Mp),
  );
}

/** Geocentric ecliptic longitude (tropical, equinox of date) in degrees. */
export function planetLongitude(planet: Planet, jdUT: number): number {
  if (planet === "SUN") return sunApparentLongitude(jdUT);
  const T = centuriesTT(jdUT);
  if (planet === "MOON") return moonLongitude(T);
  const [px, py] = helio(planet, T);
  const [ex, ey] = helio("EARTH", T);
  return norm(Math.atan2(py - ey, px - ex) / DEG + precession(T));
}

/** Apparent daily motion; negative = retrograde. */
export function dailyMotion(planet: Planet, jdUT: number): number {
  let d = planetLongitude(planet, jdUT + 0.5) - planetLongitude(planet, jdUT - 0.5);
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d;
}

export function obliquity(T: number): number {
  return 23.439291 - 0.0130042 * T;
}

/** Greenwich mean sidereal time in degrees. */
export function gmst(jdUT: number): number {
  const T = (jdUT - 2451545) / 36525;
  return norm(280.46061837 + 360.98564736629 * (jdUT - 2451545) + 0.000387933 * T * T);
}

/** Ascendant and Midheaven (deg) for latitude/longitude (°N, °E). */
export function angles(jdUT: number, lat: number, lon: number): { ascendant: number; midheaven: number } {
  const eps = obliquity((jdUT - 2451545) / 36525) * DEG;
  const ramc = norm(gmst(jdUT) + lon) * DEG;
  const phi = lat * DEG;
  const mc = norm(Math.atan2(Math.sin(ramc), Math.cos(ramc) * Math.cos(eps)) / DEG);
  const asc = norm(Math.atan2(Math.cos(ramc), -(Math.sin(ramc) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps))) / DEG);
  return { ascendant: asc, midheaven: mc };
}
