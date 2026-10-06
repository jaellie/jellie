/** npm run destiny -- --birth 1997-09-28T09:30 --sex FEMALE --date 2026-09 */
import { calculateNatalChart } from "../src/saju/chart";
import { SajuModifierEngine } from "../src/saju/interpretation/sajuModifierEngine";
import { buildDestinyViewModel, renderDestinyText } from "../src/ui/destiny/destinyViewModel";
import { formatAstrologyDebug, formatSajuDebug } from "../src/debug/debugView";
import { calculateAstrologyChart } from "../src/astrology/chart";
import { AstrologyModifierEngine } from "../src/astrology/interpretation";
import { mbtiModifierSource, personaFromMbti } from "../src/mbti/mbti";
import { birthFromArgs, parseArgs } from "./args";

const a = parseArgs();
const chart = calculateNatalChart(birthFromArgs(a));
const [y, m] = (a.date ?? "2026-09").split("-").map(Number);
const result = new SajuModifierEngine().calculateDetailed(chart, { year: y, month: m });
console.log(renderDestinyText(buildDestinyViewModel(chart, result)));
console.log();
console.log(formatSajuDebug(chart, result));

const birth = birthFromArgs(a);
const astro = calculateAstrologyChart(birth);
console.log();
console.log(formatAstrologyDebug(astro, new AstrologyModifierEngine().calculateDetailed(astro, { year: y, month: m })));
if (a.mbti) {
  console.log(`\nMBTI ${a.mbti}`);
  console.log("  persona:", Object.entries(personaFromMbti(a.mbti)).map(([k, v]) => `${k}=${(v as number).toFixed(2)}`).join(" "));
  console.log("  modifiers:", Object.entries(mbtiModifierSource(a.mbti).modifiers).filter(([, v]) => v).map(([k, v]) => `${k}${(v as number) > 0 ? "+" : ""}${(v as number).toFixed(2)}`).join(" "));
}
