import { calculateNatalChart } from "./src/saju/chart";
import { calculateAstrologyChart } from "./src/astrology/chart";
import { buildDestinyScript } from "./src/story/destinyScript";
for (const b of [{ year: 1997, month: 9, day: 28, hour: 9, minute: 30, sex: "FEMALE" as const }, { year: 1995, month: 2, day: 6, hour: 10, minute: 0, sex: "MALE" as const }, { year: 2001, month: 12, day: 3, sex: "FEMALE" as const }]) {
  const s = buildDestinyScript(calculateNatalChart(b), calculateAstrologyChart(b), { birthYear: b.year, seed: 1 });
  console.log(b.year, s.map(e => `${e.age}:${e.theme}(${Object.entries(e.chartWeights).map(([k,v])=>k+Math.round(v*100)).join("/")})`).join("  "));
}
