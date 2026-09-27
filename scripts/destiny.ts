/** npm run destiny -- --birth 1997-09-28T09:30 --sex FEMALE --date 2026-09 */
import { calculateNatalChart } from "../src/saju/chart";
import { SajuModifierEngine } from "../src/saju/interpretation/sajuModifierEngine";
import { buildDestinyViewModel, renderDestinyText } from "../src/ui/destiny/destinyViewModel";
import { formatSajuDebug } from "../src/debug/debugView";
import { birthFromArgs, parseArgs } from "./args";

const a = parseArgs();
const chart = calculateNatalChart(birthFromArgs(a));
const [y, m] = (a.date ?? "2026-09").split("-").map(Number);
const result = new SajuModifierEngine().calculateDetailed(chart, { year: y, month: m });
console.log(renderDestinyText(buildDestinyViewModel(chart, result)));
console.log();
console.log(formatSajuDebug(chart, result));
