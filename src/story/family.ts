/**
 * Family words. Korean sibling terms depend on the player's gender
 * (older sister = 언니 for her, 누나 for him; older brother = 오빠 / 형).
 */
import type { GrandparentRel, LifeState, Sibling, SiblingRel } from "../sim/types";

type Bi = { ko: string; en: string };

export function siblingWord(state: LifeState, rel: SiblingRel): Bi {
  const female = state.birth.sex === "FEMALE";
  switch (rel) {
    case "OLDER_SISTER": return { ko: female ? "언니" : "누나", en: "your older sister" };
    case "OLDER_BROTHER": return { ko: female ? "오빠" : "형", en: "your older brother" };
    case "YOUNGER_SISTER": return { ko: "여동생", en: "your younger sister" };
    case "YOUNGER_BROTHER": return { ko: "남동생", en: "your younger brother" };
  }
}

/** "오빠 민수" / "여동생 지아" — for captions ("오빠 민수의 결혼식"). */
export function siblingLabel(state: LifeState, sib: Sibling): Bi {
  // Just "형", "누나" — family by what you call them, never by a name (it breaks the spell).
  return siblingWord(state, sib.rel);
}

/** How they show up as a text sender: an older sibling by title ("오빠"), a younger one by name. */
export function siblingSender(state: LifeState, sib: Sibling): Bi {
  const w = siblingWord(state, sib.rel);
  return { ko: w.ko, en: w.en.replace(/^your /, "").replace(/^./, (c) => c.toUpperCase()) };
}

export const GRANDPARENT_WORD: Record<GrandparentRel, Bi> = {
  MAT_GRANDMA: { ko: "외할머니", en: "Grandma (mom's side)" },
  MAT_GRANDPA: { ko: "외할아버지", en: "Grandpa (mom's side)" },
  PAT_GRANDMA: { ko: "할머니", en: "Grandma" },
  PAT_GRANDPA: { ko: "할아버지", en: "Grandpa" },
};

/** Aunts and uncles (the relatives whose funerals are 친척의 장례식). */
export const AUNTS_UNCLES: Bi[] = [
  { ko: "이모", en: "Aunt (mom's sister)" },
  { ko: "이모부", en: "Uncle (mom's sister's husband)" },
  { ko: "외삼촌", en: "Uncle (mom's brother)" },
  { ko: "고모", en: "Aunt (dad's sister)" },
  { ko: "고모부", en: "Uncle (dad's sister's husband)" },
  { ko: "큰아버지", en: "Uncle (dad's older brother)" },
  { ko: "작은아버지", en: "Uncle (dad's younger brother)" },
];

export function aliveSiblings(state: LifeState): Sibling[] {
  return (state.family?.siblings ?? []).filter((s) => s.alive);
}
