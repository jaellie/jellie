/**
 * How the first confession happens is written in the charts (yours and, when known, theirs):
 *
 *   SPARK    금성·화성 (Venus–Mars across the two charts)   → it bursts out, on impulse (a sudden downpour)
 *   DOHWA    도화 (Peach Blossom)                            → they're drawn in first: *they* confess
 *   YEOKMA   역마 (Traveling Horse)                          → on the move: the last bus, someone leaving
 *   HWAGAE   화개 (Canopy, the solitary artist)              → not said but written: a letter in a book
 *   GWIIN    천을귀인 (Noble helper)                          → friends conspire and leave you two alone
 *   MOON     달 조화 (Moon in harmony across the charts)     → quiet, as natural as breathing
 *   CLASH    충 / 긴장 (friction)                             → in the middle of a fight
 *   DREAM    해왕성 (Neptune on Venus)                         → under the stars, by the sea
 *   SURPRISE 천왕성 (Uranus on Venus)                          → stuck at the top of the Ferris wheel
 *   default  — the walk home (and the airport goodbye, abroad)
 *
 * Computed once (initStory); the climax of the CONFESS sequence plays the matching variant
 * (data/story/sequences.json → CONFESS.fate), and every part shows the signs as its reading.
 */
import type { SajuChart } from "../saju/chart";
import { type AstrologyChart, findAspectWithin } from "../astrology/chart";

type Bi = { ko: string; en: string };
export type ConfessKey = "SPARK" | "DOHWA" | "YEOKMA" | "HWAGAE" | "GWIIN" | "MOON" | "CLASH" | "DREAM" | "SURPRISE";
export interface ConfessFate {
  key?: ConfessKey;
  signs: Bi[];
}

const lon = (c: AstrologyChart, p: string) => (c.positions as Record<string, { longitude: number } | undefined>)[p]?.longitude;
const has = (s: SajuChart, id: string) => s.shinsal.some((x) => x.id === id && x.present);

function across(a: AstrologyChart, b: AstrologyChart | undefined, p: string, q: string, orb: number) {
  const pairs: Array<[AstrologyChart, AstrologyChart]> = b ? [[a, b], [b, a]] : [[a, a]];
  for (const [x, y] of pairs) {
    const l1 = lon(x, p), l2 = lon(y, q);
    if (l1 === undefined || l2 === undefined) continue;
    const f = findAspectWithin(l1, l2, orb);
    if (f) return f;
  }
  return undefined;
}

export function confessFate(me: { saju: SajuChart; astro: AstrologyChart }, them?: { saju: SajuChart; astro: AstrologyChart }, friction = 0.5): ConfessFate {
  const pre = (mine: boolean) => (mine ? { ko: "", en: "" } : { ko: "상대: ", en: "Them: " });
  const cands: Array<{ key: ConfessKey; w: number; sign: Bi }> = [];
  const shinsal = (id: string, key: ConfessKey, ko: string, en: string, w: number) => {
    if (has(me.saju, id)) cands.push({ key, w, sign: { ko: `사주: ${ko}`, en: `Saju: ${en}` } });
    else if (them && has(them.saju, id)) cands.push({ key, w: w - 0.2, sign: { ko: `${pre(false).ko}${ko}`, en: `${pre(false).en}${en}` } });
  };
  const vm = across(me.astro, them?.astro, "VENUS", "MARS", 5);
  if (vm) cands.push({ key: "SPARK", w: vm.nature === "harmonious" ? 2 : 2.4, sign: { ko: "점성술: 금성·화성 " + (vm.nature === "harmonious" ? "조화" : vm.nature === "conjunction" ? "합" : "긴장"), en: `Astrology: Venus–Mars ${vm.nature === "harmonious" ? "harmony" : vm.nature === "conjunction" ? "conjunction" : "tension"}` } });
  shinsal("DOHWA", "DOHWA", "도화", "Peach Blossom", 1.9);
  shinsal("YEOKMA", "YEOKMA", "역마", "Traveling Horse", 1.5);
  shinsal("HWAGAE", "HWAGAE", "화개", "Canopy", 1.4);
  shinsal("CHEONEUL_GWIIN", "GWIIN", "천을귀인", "Noble Helper", 1.3);
  const moon = them ? across(me.astro, them.astro, "MOON", "MOON", 6) ?? across(me.astro, them.astro, "MOON", "SUN", 5) : undefined;
  if (moon && moon.nature !== "hard") cands.push({ key: "MOON", w: 1.6, sign: { ko: "점성술: 달 조화", en: "Astrology: Moon harmony" } });
  if (friction >= 0.62) cands.push({ key: "CLASH", w: 1.7, sign: { ko: "궁합: 충 · 긴장", en: "Match: clash & tension" } });
  const nep = across(me.astro, them?.astro, "NEPTUNE", "VENUS", 3);
  if (nep) cands.push({ key: "DREAM", w: 1.45, sign: { ko: "점성술: 해왕성·금성", en: "Astrology: Neptune–Venus" } });
  const ura = across(me.astro, them?.astro, "URANUS", "VENUS", 3);
  if (ura) cands.push({ key: "SURPRISE", w: 1.45, sign: { ko: "점성술: 천왕성·금성", en: "Astrology: Uranus–Venus" } });
  if (!cands.length) return { signs: [] };
  cands.sort((a, b) => b.w - a.w);
  return { key: cands[0].key, signs: cands.slice(0, 3).map((c) => c.sign) };
}
