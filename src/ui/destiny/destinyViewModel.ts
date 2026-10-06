/**
 * Destiny screen view model. Pure data for the (future) pixel-art UI:
 * components render this and never call Saju calculation code themselves.
 */
import type { SajuChart } from "../../saju/chart";
import { ELEMENTS, distributionValue, elementHanja } from "../../saju/analysis/fiveElements";
import { tenGodInfo } from "../../saju/analysis/tenGods";
import type { SajuModifierResult } from "../../saju/interpretation/sajuModifierEngine";
import { arrowFor, interpretSajuForSimulation } from "../../saju/interpretation/sajuModifierEngine";
import { pillarToHanja, pillarToKorean, stemInfo } from "../../saju/types";
import { LIFE_MODIFIER_KEYS, type LifeModifierKey } from "../../core/lifeModifiers";

export interface DestinyViewModel {
  title: string;
  pillars: Array<{ label: string; hanja: string; korean: string; stemTenGod?: string; branchTenGod?: string }>;
  dayMaster: { hanja: string; element: string; strength: string };
  elements: Array<{ hanja: string; element: string; percent: number; bar: number }>;
  shinsal: Array<{ hanja: string; nameKo: string; nameEn: string; stars: number }>;
  lifeCycle?: { ageRange: string; pillar: string; themes: string[] };
  thisYear: { pillar: string; themes: string[] };
  tendencies: Array<{ label: string; arrow: string }>;
  disclaimer: string;
}

const THEME_LABELS: Partial<Record<LifeModifierKey, string>> = {
  career: "CAREER",
  education: "EDUCATION",
  wealth: "WEALTH",
  business: "BUSINESS",
  romance: "ROMANCE",
  marriage: "PARTNERSHIP",
  social: "SOCIAL",
  family: "FAMILY",
  mobility: "MOBILITY",
  travel: "TRAVEL",
  overseas: "OVERSEAS",
  relocation: "RELOCATION",
  creativity: "CREATIVITY",
  introspection: "INNER LIFE",
  stability: "STABILITY",
  change: "CHANGE",
};

function themes(totals: Record<LifeModifierKey, number>, n = 2): string[] {
  return LIFE_MODIFIER_KEYS.filter((k) => THEME_LABELS[k] && totals[k] > 0.02)
    .sort((a, b) => totals[b] - totals[a])
    .slice(0, n)
    .map((k) => THEME_LABELS[k]!);
}

export function buildDestinyViewModel(chart: SajuChart, current: SajuModifierResult): DestinyViewModel {
  const labels = { year: "年", month: "月", day: "日", hour: "時" } as const;
  const interp = interpretSajuForSimulation(chart);
  const f = current.fortune;
  return {
    title: "YOUR DESTINY",
    pillars: chart.tenGods.byPillar.map((p) => {
      const pillar = chart.fourPillars[p.position]!;
      return {
        label: labels[p.position],
        hanja: pillarToHanja(pillar),
        korean: pillarToKorean(pillar),
        stemTenGod: p.stem ? tenGodInfo(p.stem).hanja : "日主",
        branchTenGod: tenGodInfo(p.branch).hanja,
      };
    }),
    dayMaster: {
      hanja: stemInfo(chart.dayMaster.stem).hanja,
      element: chart.dayMaster.element,
      strength: chart.dayMasterStrength,
    },
    elements: ELEMENTS.map((e) => {
      const pct = distributionValue(chart.elementBalance.distribution, e);
      return { hanja: elementHanja(e), element: e, percent: Math.round(pct), bar: Math.round((pct / 100) * 20) };
    }),
    shinsal: chart.shinsal.map((s) => ({ hanja: s.hanja ?? "", nameKo: s.nameKo, nameEn: s.nameEn, stars: Math.round(s.strength * 5) })),
    lifeCycle: f.daeun && {
      ageRange: `AGE ${Math.floor(f.daeun.startAge)}–${Math.floor(f.daeun.endAge) - 1}`,
      pillar: pillarToHanja(f.daeun.pillar),
      themes: themes(current.layerTotals.daeun),
    },
    thisYear: { pillar: pillarToHanja(f.annual.pillar), themes: themes(current.layerTotals.annual) },
    tendencies: interp.labels.filter((l) => THEME_LABELS[l.key]).slice(0, 6).map((l) => ({ label: THEME_LABELS[l.key]!, arrow: arrowFor(l.value) })),
    disclaimer: interp.disclaimer,
  };
}

/** Terminal cell width: CJK / full-width glyphs take two cells. */
function displayWidth(s: string): number {
  let w = 0;
  for (const ch of s) w += /[\u1100-\u115f\u2e80-\ua4cf\uac00-\ud7a3\uf900-\ufaff\ufe30-\ufe4f\uff00-\uff60\uffe0-\uffe6]/.test(ch) ? 2 : 1;
  return w;
}

/** Kairosoft-style text rendering of the view model (for debug/CLI). */
export function renderDestinyText(vm: DestinyViewModel): string {
  const W = 33;
  const line = (s = "") => `│ ${s}${" ".repeat(Math.max(0, W - 2 - displayWidth(s)))} │`;
  const out = [`┌${"─".repeat(W)}┐`, line(`        ${vm.title}`), line()];
  out.push(line(vm.pillars.map((p) => `${p.label}${p.hanja}`).join(" ")));
  out.push(line(`日主 ${vm.dayMaster.hanja} ${vm.dayMaster.element} ${vm.dayMaster.strength}`));
  out.push(line());
  out.push(line("五行"));
  for (const e of vm.elements) out.push(line(`${e.hanja} ${"█".repeat(Math.min(10, Math.round(e.bar / 2))).padEnd(10, "░")} ${e.percent}%`));
  out.push(line());
  for (const s of vm.shinsal) out.push(line(`${s.hanja.padEnd(4, "　")}  ${"*".repeat(s.stars)}${".".repeat(5 - s.stars)}  ${s.nameKo}`));
  out.push(line());
  if (vm.lifeCycle) {
    out.push(line("CURRENT LIFE CYCLE"));
    out.push(line(`${vm.lifeCycle.ageRange}  ${vm.lifeCycle.pillar}`));
    out.push(line(vm.lifeCycle.themes.join(" / ") || "STEADY"));
  }
  out.push(line());
  out.push(line(`THIS YEAR ${vm.thisYear.pillar}`));
  out.push(line(vm.thisYear.themes.join(" / ") || "STEADY"));
  out.push(`└${"─".repeat(W)}┘`);
  return out.join("\n");
}

