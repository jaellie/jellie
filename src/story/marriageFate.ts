/**
 * "운명에 맡기기" all the way: the player leaves the destined person entirely to fate. Then the chart
 * decides who they'll be.
 *
 *  - A chart that marries: the one you marry and grow old with.
 *  - A solitary chart (혼자 살 사주): your last love — late in life, and it doesn't last; the ending
 *    tells it as a story ("그 뒤로 나는 평생 혼자 살았다.").
 *
 * Solitude signals, the classic ones: a weak or missing spouse star (관성 for women, 재성 for men),
 * a crowd of 비겁 (rivals for the spouse), the spouse palace (day branch) clashed or harmed, natal
 * 화개 (the solitary scholar's star); in astrology, Saturn in the 7th house, Saturn hard on Venus or
 * the Moon.
 */
import type { SajuChart } from "../saju/chart";
import type { AstrologyChart } from "../astrology/chart";

export type FateMode = "lifelong" | "solitary";
const SOLITARY_AT = 3.5;

export function marriageFate(saju: SajuChart, astro: AstrologyChart, sex: "MALE" | "FEMALE"): { mode: FateMode; score: number; signs: string[] } {
  const g = saju.tenGods.groups;
  const signs: string[] = [];
  let score = 0;
  const spouse = sex === "FEMALE" ? g.OFFICER : g.WEALTH;
  if (spouse <= 0.01) (score += 2), signs.push(sex === "FEMALE" ? "무관" : "무재");
  else if (spouse < 0.6) (score += 0.5), signs.push(sex === "FEMALE" ? "관성 약함" : "재성 약함");
  if (g.PEER >= 4) (score += 1), signs.push("비겁 과다");
  const dayHit = saju.natalInteractions.filter((i) => i.between.includes("day") && /CLASH|HARM|PUNISH/.test(String(i.type)));
  if (dayHit.length) (score += 1), signs.push("일지 충");
  if (saju.shinsal.some((s) => s.id === "HWAGAE" && s.present)) (score += 1), signs.push("화개");
  const satHouse = Object.entries(astro.houseEmphasis).find(([, ps]) => ps.includes("SATURN" as never))?.[0];
  if (satHouse === "7") (score += 1.5), signs.push("토성 7하우스");
  for (const a of astro.aspects) {
    const pair = [a.a, a.b];
    if (pair.includes("SATURN") && (pair.includes("VENUS") || pair.includes("MOON")) && a.nature === "hard") (score += 1), signs.push(`토성-${pair.includes("VENUS") ? "금성" : "달"} 긴장`);
  }
  // About one chart in five reads as 혼자 살 사주.
  return { mode: score >= SOLITARY_AT ? "solitary" : "lifelong", score, signs };
}
