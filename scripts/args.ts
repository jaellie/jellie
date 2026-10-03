import type { BirthData } from "../src/saju/calendar/fourPillars";

/** --birth 1997-09-28T09:30 --sex FEMALE --seed 12345 --years 80 --date 2026-09 */
export function parseArgs(argv = process.argv.slice(2)): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) if (argv[i].startsWith("--")) out[argv[i].slice(2)] = argv[i + 1] ?? "true";
  return out;
}

export function birthFromArgs(a: Record<string, string>): BirthData {
  const [date, time] = (a.birth ?? "1997-09-28T09:30").split("T");
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time ? time.split(":").map(Number) : [undefined, undefined];
  return { year, month, day, hour, minute, sex: (a.sex ?? "FEMALE").toUpperCase() as "MALE" | "FEMALE" };
}
