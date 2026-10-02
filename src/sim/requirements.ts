import type { Requirement } from "./opportunity";
import { type LifeState, educationRank, isAbroad } from "./types";

export interface RequirementCheck {
  ok: boolean;
  reason?: string;
}

export function checkRequirement(s: LifeState, r: Requirement): RequirementCheck {
  switch (r.kind) {
    case "age":
      if (r.min !== undefined && s.age < r.min) return { ok: false, reason: `age < ${r.min}` };
      if (r.max !== undefined && s.age > r.max) return { ok: false, reason: `age > ${r.max}` };
      return { ok: true };
    case "education":
      if (r.min && educationRank(s.education) < educationRank(r.min)) return { ok: false, reason: `needs ${r.min}` };
      if (r.max && educationRank(s.education) > educationRank(r.max)) return { ok: false, reason: `already beyond ${r.max}` };
      return { ok: true };
    case "enrolled":
      return !!s.enrollment === r.value ? { ok: true } : { ok: false, reason: r.value ? "not a student" : "currently studying" };
    case "enrolledIn":
      return s.enrollment?.program === r.program ? { ok: true } : { ok: false, reason: `not in ${r.program} program` };
    case "employed":
      if (!r.value && s.flags.retired) return { ok: false, reason: "retired" };
      return s.career.employed === r.value ? { ok: true } : { ok: false, reason: r.value ? "not employed" : "already employed" };
    case "money":
      return s.money >= r.min ? { ok: true } : { ok: false, reason: `needs ${r.min}k (has ${Math.floor(s.money)}k)` };
    case "relationship":
      return r.in.includes(s.relationship.status) ? { ok: true } : { ok: false, reason: `relationship is ${s.relationship.status}` };
    case "relationshipMonths": {
      const months = s.relationship.sinceMonth === undefined ? 0 : s.monthIndex - s.relationship.sinceMonth;
      return months >= r.min ? { ok: true } : { ok: false, reason: "relationship too new" };
    }
    case "abroad":
      return isAbroad(s) === r.value ? { ok: true } : { ok: false, reason: r.value ? "not abroad" : "already abroad" };
    case "familySupport":
      return s.familySupport >= r.min ? { ok: true } : { ok: false, reason: "family can't afford it" };
    case "flag":
      return (r.value === undefined ? !!s.flags[r.name] : s.flags[r.name] === r.value) ? { ok: true } : { ok: false, reason: `flag ${r.name}` };
  }
}

export function checkRequirements(s: LifeState, reqs: Requirement[] | undefined): RequirementCheck {
  for (const r of reqs ?? []) {
    const c = checkRequirement(s, r);
    if (!c.ok) return c;
  }
  return { ok: true };
}
