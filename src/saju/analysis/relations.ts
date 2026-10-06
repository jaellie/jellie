/**
 * Layer B — stem/branch interactions (合 沖 刑 害) between any labeled pillars
 * (natal positions, Daeun, annual, monthly).
 */
import rel from "../../../data/saju/relations.json";
import type { EarthlyBranch, FiveElement, HeavenlyStem, Pillar } from "../types";

export type InteractionType =
  | "STEM_COMBINATION"
  | "STEM_CLASH"
  | "SIX_HARMONY"
  | "THREE_HARMONY"
  | "HALF_HARMONY"
  | "BRANCH_CLASH"
  | "HARM"
  | "PUNISHMENT";

export interface LabeledPillar {
  label: string;
  pillar: Pillar;
}

export interface ElementInteraction {
  type: InteractionType;
  /** Labels of participating pillars, e.g. ["annual", "day"]. */
  between: string[];
  characters: string[];
  element?: FiveElement;
}

const same = (a: [string, string], x: string, y: string) => (a[0] === x && a[1] === y) || (a[0] === y && a[1] === x);

function pairs<T>(items: T[]): Array<[T, T]> {
  const out: Array<[T, T]> = [];
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) out.push([items[i], items[j]]);
  return out;
}

/**
 * Find interactions among `pillars`. If `focus` labels are given, only
 * interactions involving at least one focused pillar are returned (used so a
 * fortune pillar reports its own effect on the natal chart, not natal-internal ones).
 */
export function findInteractions(pillars: LabeledPillar[], focus?: string[]): ElementInteraction[] {
  const out: ElementInteraction[] = [];
  const involves = (labels: string[]) => !focus || labels.some((l) => focus.includes(l));

  for (const [a, b] of pairs(pillars)) {
    const labels = [a.label, b.label];
    if (!involves(labels)) continue;
    const sa: HeavenlyStem = a.pillar.heavenlyStem;
    const sb: HeavenlyStem = b.pillar.heavenlyStem;
    const ba: EarthlyBranch = a.pillar.earthlyBranch;
    const bb: EarthlyBranch = b.pillar.earthlyBranch;

    const sc = rel.stemCombinations.find((c) => same(c.pair as [string, string], sa, sb));
    if (sc) out.push({ type: "STEM_COMBINATION", between: labels, characters: [sa, sb], element: sc.element as FiveElement });
    if (rel.stemClashes.some((c) => same(c as [string, string], sa, sb))) out.push({ type: "STEM_CLASH", between: labels, characters: [sa, sb] });

    const sh = rel.branchSixHarmonies.find((c) => same(c.pair as [string, string], ba, bb));
    if (sh) out.push({ type: "SIX_HARMONY", between: labels, characters: [ba, bb], element: sh.element as FiveElement });
    if (rel.branchClashes.some((c) => same(c as [string, string], ba, bb))) out.push({ type: "BRANCH_CLASH", between: labels, characters: [ba, bb] });
    if (rel.branchHarms.some((c) => same(c as [string, string], ba, bb))) out.push({ type: "HARM", between: labels, characters: [ba, bb] });

    const p = rel.branchPunishments;
    const isGroupPunish = ba !== bb && p.groups.some((g) => g.includes(ba) && g.includes(bb));
    const isPairPunish = p.pairs.some((c) => same(c as [string, string], ba, bb));
    const isSelfPunish = ba === bb && p.self.includes(ba);
    if (isGroupPunish || isPairPunish || isSelfPunish) out.push({ type: "PUNISHMENT", between: labels, characters: [ba, bb] });

    // Half three-harmony: two members of a 三合 frame that include the central (旺) branch.
    for (const th of rel.branchThreeHarmonies) {
      const center = th.branches[1];
      if (ba !== bb && th.branches.includes(ba) && th.branches.includes(bb) && (ba === center || bb === center)) {
        out.push({ type: "HALF_HARMONY", between: labels, characters: [ba, bb], element: th.element as FiveElement });
      }
    }
  }

  // Full three-harmony (三合): all three branches present.
  for (const th of rel.branchThreeHarmonies) {
    const members = th.branches.map((b) => pillars.find((p) => p.pillar.earthlyBranch === b));
    if (members.every(Boolean)) {
      const labels = members.map((m) => m!.label);
      if (involves(labels)) out.push({ type: "THREE_HARMONY", between: labels, characters: th.branches, element: th.element as FiveElement });
    }
  }
  return out;
}
