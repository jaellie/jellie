/**
 * Content linter: finds messages/stories whose text implies a life fact that
 * their `requires` doesn't guarantee (e.g. a manager's message without
 * "employed"). Run by the test suite, so new content with contradictions is
 * caught automatically — no manual bug hunting.
 */
import messageData from "../../data/game/messages.json";
import storyData from "../../data/game/stories.json";
import { guardRequirements } from "./director";

/** Facts that imply other facts. */
const IMPLIES: Record<string, string[]> = {
  recentlyPromoted: ["employed"],
  recentlyLostJob: ["!employed", "jobless"],
  jobless: ["!employed"],
  retired: ["!employed"],
  dating: ["partnered"],
  married: ["partnered"],
  recentlyBrokeUp: ["single", "!partnered"],
  single: ["!partnered"],
  engaged: ["partnered", "dating"],
  fatedPartner: ["partnered"],
  selfEmployed: ["employed"],
  hasSister: ["hasSibling"],
  hasBrother: ["hasSibling"],
  parentsTogether: ["momAlive", "dadAlive"],
};

function closure(reqs: string[]): Set<string> {
  const out = new Set(reqs);
  let grew = true;
  while (grew) {
    grew = false;
    for (const r of [...out]) for (const x of IMPLIES[r] ?? []) if (!out.has(x)) (out.add(x), (grew = true));
  }
  return out;
}

export interface LintIssue {
  id: string;
  rule: string;
  missing: string[];
}

export function lintContent(): LintIssue[] {
  const items: Array<{ id: string; requires: string[]; texts: string[] }> = [
    ...(messageData.messages as Array<{ id: string; requires?: string[]; text: { ko: string; en: string } }>).map((m) => ({ id: m.id, requires: m.requires ?? [], texts: [m.text.ko, m.text.en] })),
    ...(storyData.stories as Array<{ id: string; requires?: string[]; line: { ko: string; en: string }; choices: Array<{ t: { ko: string; en: string }; r: { ko: string; en: string } }> }>).map((s) => ({
      id: s.id,
      requires: s.requires ?? [],
      texts: [s.line.ko, s.line.en, ...s.choices.flatMap((c) => [c.t.ko, c.t.en, c.r.ko, c.r.en])],
    })),
  ];
  const issues: LintIssue[] = [];
  for (const it of items) {
    const have = closure(it.requires);
    for (const g of guardRequirements(it.texts)) {
      const missing = g.requires.filter((r) => !have.has(r));
      if (missing.length) issues.push({ id: it.id, rule: g.rule, missing });
    }
  }
  return issues;
}

/** The same check for the life-event library: what a popup says (line + choices) must be guaranteed by `requires`. */
export function lintLifeEvents(events: Array<{ id: string; requires?: string[]; line: { ko: string; en: string }; choices: Array<{ t: { ko: string; en: string } }> }>): LintIssue[] {
  const issues: LintIssue[] = [];
  for (const e of events) {
    const have = closure(e.requires ?? []);
    for (const g of guardRequirements([e.line.ko, e.line.en, ...e.choices.flatMap((c) => [c.t.ko, c.t.en])])) {
      const missing = g.requires.filter((r) => !have.has(r));
      if (missing.length) issues.push({ id: e.id, rule: g.rule, missing });
    }
  }
  return issues;
}
