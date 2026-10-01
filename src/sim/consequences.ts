/**
 * Applies the consequences of a *chosen* option to the life state.
 * This is the only place (with lifeTick) where the world changes.
 */
import type { LifeModifiers } from "../core/lifeModifiers";
import type { SeededRandom } from "../core/rng";
import { calculateNatalChart } from "../saju/chart";
import type { Consequence } from "./opportunity";
import { type LifeState, type Npc, isAbroad } from "./types";
import { countryNameOf, pickCity, pickForeignCountry } from "./world";
import { cultureOf, pickName } from "../world/names";

export const MAX_CAREER_LEVEL = 8;

export interface ConsequenceContext {
  rng: SeededRandom;
  modifiers: LifeModifiers;
  /** Human-readable log of what changed. */
  log: string[];
}

function remember(s: LifeState, text: string, tags: string[] = []) {
  s.memories.push({ date: { ...s.date }, age: Math.floor(s.age), text, tags });
}

function createNpc(s: LifeState, rng: SeededRandom): Npc {
  const age = Math.max(18, Math.round(s.age + rng.range(-5, 5)));
  const birth = {
    year: s.date.year - age,
    month: rng.int(1, 12),
    day: rng.int(1, 28),
    hour: rng.int(0, 23),
    minute: rng.int(0, 59),
    sex: rng.chance(0.5) ? ("MALE" as const) : ("FEMALE" as const),
  };
  const npc: Npc = {
    id: `npc-${s.npcs.length + 1}`,
    name: pickName(birth.sex, cultureOf(s.location.country), rng, s.npcs.map((n) => n.name)),
    birth,
    chart: calculateNatalChart(birth),
    role: "ACQUAINTANCE",
    metAt: { ...s.date },
  };
  s.npcs.push(npc);
  return npc;
}

export function applyConsequence(s: LifeState, c: Consequence, ctx: ConsequenceContext): void {
  const { rng, log } = ctx;
  switch (c.kind) {
    case "money":
      s.money += c.amount;
      break;
    case "debt":
      s.debt += c.amount;
      break;
    case "enroll":
      s.enrollment = { program: c.program, untilMonth: s.monthIndex + c.months, abroad: !!c.abroad || isAbroad(s) };
      if (s.career.employed && c.months > 12) {
        s.career.employed = false;
        log.push("left job to study");
      }
      log.push(`enrolled in ${c.program}`);
      break;
    case "moveAbroad": {
      const from = `${s.location.city}, ${s.location.country}`;
      // Abroad means somewhere that makes sense for this life: where the destined partner lives (no
      // surprise Singapore in a Seoul–New York long-distance love); otherwise a foreign country — not
      // the one you already live in.
      const life = s.story?.fatedLife;
      const pid = s.relationship.partnerId;
      const withFated = !!pid && !!s.world?.npcs[pid]?.fated;
      if (life && withFated && life.city.country !== "KR") {
        s.location = { country: countryNameOf(life.city.country), city: life.city.en };
        s.relationship.longDistance = false;
      } else {
        let country = pickForeignCountry(rng, s.homeCountry);
        if (country === s.location.country) country = pickForeignCountry(rng, country);
        s.location = { country, city: pickCity(rng, country) };
      }
      s.flags.livedAbroad = true;
      if (s.career.employed && !s.career.abroad) s.career.employed = false;
      if (s.relationship.status === "MARRIED") log.push("partner moved too");
      else if (s.relationship.status === "DATING" && !(life && withFated && life.city.country !== "KR")) s.relationship.longDistance = true;
      log.push(`moved ${from} → ${s.location.city}, ${s.location.country}`);
      break;
    }
    case "moveHome":
      s.location = { country: s.homeCountry, city: pickCity(rng, s.homeCountry) };
      s.relationship.longDistance = false;
      if (s.career.abroad) s.career = { ...s.career, employed: false, abroad: false };
      log.push(`moved home → ${s.location.city}`);
      break;
    case "moveCity":
      s.location = { ...s.location, city: pickCity(rng, s.location.country, s.location.city) };
      log.push(`moved to ${s.location.city}`);
      break;
    case "job":
      s.flags.retired = false;
      if (!s.career.employed || (c.field && c.field !== s.career.field)) s.career.cid = (s.career.cid ?? 0) + 1;
      s.career = {
        cid: s.career.cid ?? 0, employed: true, field: c.field ?? s.career.field ?? "general", level: Math.max(1, s.career.level), abroad: !!c.abroad || isAbroad(s) };
      log.push(`employed (${s.career.field}, L${s.career.level})`);
      break;
    case "careerLevel":
      s.career.level = Math.max(0, Math.min(MAX_CAREER_LEVEL, s.career.level + c.delta));
      if (c.delta > 0 && s.career.employed) {
        s.flags.promotionCid = s.career.cid ?? 0;
        s.flags.promotionMonth = s.monthIndex;
      }
      break;
    case "quitJob":
      if (s.career.employed) s.career.cid = (s.career.cid ?? 0) + 1;
      s.career.employed = false;
      s.flags.jobLostMonth = s.monthIndex;
      log.push("left the job");
      break;
    case "startDating": {
      const npc = createNpc(s, rng);
      npc.role = "PARTNER";
      s.relationship = { status: "DATING", partnerId: npc.id, sinceMonth: s.monthIndex, longDistance: false };
      log.push(`dating ${npc.name}`);
      break;
    }
    case "marry":
      s.relationship = { ...s.relationship, status: "MARRIED", longDistance: false };
      s.flags.weddingMonth = s.monthIndex;
      s.familyObligation = Math.min(1, s.familyObligation + 0.15);
      log.push("married");
      break;
    case "breakUp": {
      const partner = s.npcs.find((n) => n.id === s.relationship.partnerId);
      if (partner) partner.role = "EX";
      s.relationship = { status: c.divorce && s.relationship.status === "MARRIED" ? "DIVORCED" : "SINGLE" };
      s.flags.breakupMonth = s.monthIndex;
      log.push(s.relationship.status === "DIVORCED" ? "divorced" : "broke up");
      break;
    }
    case "social":
      s.socialCircle = Math.max(0, s.socialCircle + c.delta);
      break;
    case "familyObligation":
      s.familyObligation = Math.min(1, Math.max(0, s.familyObligation + c.delta));
      break;
    case "familySupport":
      s.familySupport = Math.min(1, Math.max(0, s.familySupport + c.delta));
      break;
    case "setFlag":
      s.flags[c.name] = c.value;
      break;
    case "gamble": {
      const vol = Math.exp(Math.max(0, ctx.modifiers[c.volatilityKey ?? "volatility"] ?? 0));
      const change = c.stake * rng.range(-0.8, 1.0) * vol;
      s.money += change;
      log.push(`investment ${change >= 0 ? "+" : ""}${change.toFixed(1)}k`);
      break;
    }
    case "memory":
      remember(s, c.text, c.tags);
      break;
    case "startHabit":
      if (s.world && !s.world.habits[c.locationId]) {
        s.world.habits[c.locationId] = { activityId: c.activityId, since: { ...s.date }, perMonth: c.perMonth ?? 4 };
        log.push(`new routine: ${c.locationId}`);
      }
      break;
    case "trip": {
      if (!s.world) break;
      const dest = c.destination ?? (c.scope === "INTERNATIONAL" ? (rng.chance(0.5) ? "paris" : "tokyo") : "coast");
      s.world.pendingTrips = [...(s.world.pendingTrips ?? []), dest];
      log.push(`trip planned: ${dest}`);
      break;
    }
  }
}

export function applyConsequences(s: LifeState, list: Consequence[], ctx: ConsequenceContext): void {
  for (const c of list) applyConsequence(s, c, ctx);
}
