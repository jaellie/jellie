/**
 * Recurring encounters → familiarity → conversations → friendship → (rarely)
 * romance. Every step is a probability shaped by destiny/world modifiers,
 * activity socialness and personality. Most sightings produce nothing.
 */
import type { GameDate } from "../core/gameDate";
import { type LifeModifierKey, type LifeModifiers, clamp } from "../core/lifeModifiers";
import type { SeededRandom } from "../core/rng";
import type { ScoreFactor } from "../sim/opportunity";
import type { LifeState } from "../sim/types";
import { ENCOUNTER_RULES as R, getLocation, getNpcType } from "./catalog";
import type { WorldEvent } from "./events";
import { npcAge } from "./npcs";
import type { Activity, EncounterHistory, RelationshipOriginType, WorldNpc, WorldRelationship, WorldState } from "./types";

export type Attraction = "ANY" | "OPPOSITE" | "SAME";

export interface EncounterContext {
  state: LifeState;
  world: WorldState;
  modifiers: LifeModifiers;
  rng: SeededRandom;
  date: GameDate;
  locationId: string;
  activity: Activity;
  attraction: Attraction;
  inTrip: boolean;
}

const mult = (m: LifeModifiers, key: LifeModifierKey, w = 1) => Math.exp((m[key] ?? 0) * w);

function activityAffinity(ctx: EncounterContext): number {
  let d = 0;
  for (const [k, w] of Object.entries(ctx.activity.affinity ?? {})) d += (w as number) * (ctx.modifiers[k as LifeModifierKey] ?? 0);
  return Math.exp(d);
}

export function isRomanceEligible(ctx: EncounterContext, npc: WorldNpc): boolean {
  const s = ctx.state;
  if (!getNpcType(npc.type).romanceEligible || !npc.single) return false;
  if (s.relationship.status === "DATING" || s.relationship.status === "MARRIED") return false;
  if (Math.abs(npcAge(npc, ctx.date) - s.age) > 12 || npcAge(npc, ctx.date) < 18 || s.age < 18) return false;
  if (ctx.attraction === "OPPOSITE") return npc.sex !== s.birth.sex;
  if (ctx.attraction === "SAME") return npc.sex === s.birth.sex;
  return true;
}

function originFor(npc: WorldNpc, locationId: string, ctx: EncounterContext): RelationshipOriginType {
  if (ctx.inTrip) return "TRAVEL";
  const t = getNpcType(npc.type).originType;
  if (t === "RANDOM_ENCOUNTER" && getLocation(locationId).type === "CAFE") return "CAFE";
  return t;
}

function text(ko: string, en: string) {
  return { ko, en };
}

function ev(ctx: EncounterContext, e: Omit<WorldEvent, "date" | "locationId">): WorldEvent {
  return { date: { ...ctx.date }, locationId: ctx.locationId, ...e };
}

/** Log one sighting and return any events it produced (often none). */
export function processSighting(ctx: EncounterContext, npc: WorldNpc): WorldEvent[] {
  const { world, rng, modifiers: m } = ctx;
  const out: WorldEvent[] = [];
  const key = `${npc.id}@${ctx.locationId}`;
  const persistent = npc.persistence === "PERSISTENT" || ctx.inTrip;
  let h: EncounterHistory | undefined = world.encounters[key];
  if (persistent) {
    if (!h) h = world.encounters[key] = { npcId: npc.id, locationId: ctx.locationId, firstSeen: { ...ctx.date }, lastSeen: { ...ctx.date }, encounterCount: 0, familiarity: 0 };
    h.encounterCount += 1;
    h.lastSeen = { ...ctx.date };
    h.familiarity = clamp(h.familiarity + R.familiarityPerSighting * (0.5 + ctx.activity.socialness), 0, 1);
  }
  const count = h?.encounterCount ?? 1;
  const familiarity = h?.familiarity ?? 0;
  let rel = world.relationships[npc.id];

  if (!rel && count === R.stages.FAMILIAR_FACE.minCount) {
    out.push(ev(ctx, { kind: "FAMILIAR_FACE", scale: "SMALL", npcId: npc.id, text: text(`또 그 사람이다. (${npc.name})`, `That same person is here again. (${npc.name})`) }));
  } else if (!rel && count === R.stages.RECOGNIZES.minCount && familiarity >= R.stages.RECOGNIZES.minFamiliarity) {
    out.push(ev(ctx, { kind: "RECOGNIZED", scale: "SMALL", npcId: npc.id, text: text(`${npc.name}이(가) 알아보고 가볍게 인사했다.`, `${npc.name} recognized you and nodded hello.`) }));
  }

  // Conversation
  const c = R.conversationChance;
  const factors: ScoreFactor[] = [
    { name: "FAMILIARITY", value: c.base + c.perFamiliarity * familiarity },
    { name: "ACTIVITY", value: 0.5 + c.socialnessWeight * ctx.activity.socialness * 2 },
    { name: "NPC_WARMTH", value: 0.5 + npc.warmth },
    { name: "PERSONALITY", value: 0.6 + ctx.state.traits.sociability * 0.8 },
    { name: "DESTINY_SOCIAL", value: mult(m, "social") * activityAffinity(ctx) },
  ];
  if (npc.foreign) factors.push({ name: "DESTINY_OVERSEAS", value: mult(m, "overseas", 0.5) });
  if (rel) factors.push({ name: "ALREADY_KNOWN", value: R.knownTalkFactor });
  else if (npc.persistence === "TEMPORARY" && (h?.encounterCount ?? 0) <= 1) factors.push({ name: "STRANGER", value: R.strangerTalkFactor * (ctx.activity.favors?.some((f) => f === "STRANGER" || f === "TRAVELER") ? 2 : 1) });
  const pTalk = clamp(factors.reduce((p, f) => p * f.value, 1), 0, c.max);
  if (!rng.chance(pTalk)) return out;

  if (!rel) {
    if (!persistent || (ctx.inTrip && npc.persistence === "TEMPORARY" && !npc.anchoredTo)) {
      // A passer-by: they only become someone you know if you swap contacts.
      if (!rng.chance(ctx.inTrip ? 0.5 : R.strangerKeepContactChance)) {
        out.push(ev(ctx, { kind: "CONVERSATION", scale: "SMALL", npcId: npc.id, text: text(`${npc.name}와(과) 잠깐 이야기를 나눴다.`, `Chatted briefly with ${npc.name}.`), explanation: { probability: pTalk, factors } }));
        return out;
      }
      if (!ctx.inTrip) npc.persistence = "PERSISTENT";
    }
    world.npcs[npc.id] = npc;
    rel = world.relationships[npc.id] = {
      npcId: npc.id,
      stage: "ACQUAINTANCE",
      closeness: 0.12 + npc.warmth * 0.08,
      spark: 0,
      conversations: 1,
      origin: {
        type: originFor(npc, ctx.locationId, ctx),
        locationId: ctx.locationId,
        firstEncounterDate: h ? { ...h.firstSeen } : { ...ctx.date },
        firstEncounterContext: `${ctx.activity.id}@${ctx.locationId}`,
      },
      lastContact: { ...ctx.date },
      channel: getLocation(ctx.locationId).online || npc.persistence === "TEMPORARY" ? "ONLINE" : "IN_PERSON",
      metOffline: !getLocation(ctx.locationId).online,
    };
    out.push(ev(ctx, { kind: "NEW_ACQUAINTANCE", scale: "SMALL", npcId: npc.id, text: text(`${npc.name}와(과) 처음으로 제대로 이야기했다.`, `Had a real conversation with ${npc.name} for the first time.`), explanation: { probability: pTalk, factors } }));
    return out;
  }

  return out.concat(progressRelationship(ctx, npc, rel, pTalk, factors));
}

export function progressRelationship(ctx: EncounterContext, npc: WorldNpc, rel: WorldRelationship, pTalk: number, factors: ScoreFactor[]): WorldEvent[] {
  const { rng, modifiers: m } = ctx;
  const out: WorldEvent[] = [];
  rel.conversations += 1;
  rel.lastContact = { ...ctx.date };
  rel.closeness = clamp(rel.closeness + R.closenessPerConversation * (0.5 + npc.warmth) * mult(m, "social", 0.5), 0, 1);
  if (rel.stage === "LOST_CONTACT") rel.stage = rel.closeness > 0.45 ? "FRIEND" : "ACQUAINTANCE";
  const eligible = isRomanceEligible(ctx, npc);
  if (eligible) rel.spark = clamp(rel.spark + R.sparkPerConversation * rng.range(0, 2) * mult(m, "romance"), 0, 1);

  const F = R.stages.FRIEND;
  const CF = R.stages.CLOSE_FRIEND;
  if (rel.stage === "ACQUAINTANCE" && rel.conversations >= F.minConversations && rel.closeness >= F.minCloseness && rng.chance(R.friendshipChance * mult(m, "social"))) {
    rel.stage = "FRIEND";
    out.push(ev(ctx, { kind: "FRIENDSHIP", scale: "MAJOR", npcId: npc.id, text: text(`${npc.name}와(과) 친구가 되었다.`, `You and ${npc.name} became friends.`), explanation: { probability: pTalk, factors } }));
  } else if (rel.stage === "FRIEND" && rel.conversations >= CF.minConversations && rel.closeness >= CF.minCloseness && rng.chance(R.friendshipChance)) {
    rel.stage = "CLOSE_FRIEND";
    out.push(ev(ctx, { kind: "FRIENDSHIP", scale: "MAJOR", npcId: npc.id, text: text(`${npc.name}은(는) 이제 가장 친한 친구 중 하나다.`, `${npc.name} is now one of your closest friends.`) }));
  } else if (
    rel.closeness > R.invitation.minCloseness &&
    (!rel.lastInvite || (ctx.date.year - rel.lastInvite.year) * 12 + (ctx.date.month - rel.lastInvite.month) >= R.invitation.cooldownMonths) &&
    rng.chance(R.invitation.chance * mult(m, "social"))
  ) {
    rel.lastInvite = { ...ctx.date };
    out.push(
      ev(ctx, {
        kind: "INVITATION",
        scale: "MAJOR",
        npcId: npc.id,
        text: text(`${npc.name}이(가) 다음 주 모임 저녁에 오라고 했다.`, `${npc.name} invited you to a group dinner next week.`),
        choices: [
          { id: "ACCEPT", label: text("갈게요!", "I'll come!") },
          { id: "DECLINE", label: text("이번엔 패스", "Not this time") },
        ],
      }),
    );
  } else {
    // Routine small talk with someone you know: it builds the relationship, but it isn't news.
    out.push(ev(ctx, { kind: "CONVERSATION", scale: "NONE", npcId: npc.id, text: text(`${npc.name}와(과) 수다를 떨었다.`, `Chatted with ${npc.name}.`) }));
  }

  // Romance: needs eligibility, some history, and a spark. Many never get here.
  if (eligible && rel.conversations >= 3 && ["ACQUAINTANCE", "FRIEND", "CLOSE_FRIEND"].includes(rel.stage)) {
    const rc = R.romanceChance;
    const rf: ScoreFactor[] = [
      { name: "SPARK", value: rc.base + rc.sparkWeight * rel.spark },
      { name: "DESTINY_ROMANCE", value: mult(m, "romance") * activityAffinity(ctx) },
      { name: "CLOSENESS", value: 0.6 + rel.closeness },
    ];
    const p = clamp(rf.reduce((a, f) => a * f.value, 1), 0, 0.5);
    if (rng.chance(p)) {
      out.push(
        ev(ctx, {
          kind: "ROMANCE_OPPORTUNITY",
          scale: "MAJOR",
          npcId: npc.id,
          text: text(`${npc.name}와(과) 있을 때 공기가 조금 달라졌다…`, `Something feels different around ${npc.name} lately…`),
          choices: [
            { id: "ASK_OUT", label: text("데이트 신청하기", "Ask them out") },
            { id: "STAY_FRIENDS", label: text("지금 이대로가 좋아", "Keep things as they are") },
          ],
          explanation: { probability: p, factors: rf },
        }),
      );
    }
  }

  // Foreign friends can pull you abroad (never forced).
  if (npc.foreign && rel.closeness > 0.5 && rng.chance(0.05 * mult(m, "travel") * mult(m, "overseas"))) {
    out.push(
      ev(ctx, {
        kind: "TRAVEL_OPPORTUNITY",
        scale: "MAJOR",
        npcId: npc.id,
        text: text(`${npc.name}: "언젠가 우리 동네에 놀러 와!"`, `${npc.name}: "You should come visit me sometime!"`),
        choices: [
          { id: "GO", label: text("여행 계획 세우기", "Plan a trip") },
          { id: "LATER", label: text("언젠가…", "Someday…") },
        ],
        payload: { destination: npc.region === "tokyo" ? "tokyo" : "paris" },
      }),
    );
  }
  return out;
}

/** Relationships fade when you stop seeing each other. */
export function decayRelationships(world: WorldState, date: GameDate): void {
  for (const rel of Object.values(world.relationships)) {
    const months = (date.year - rel.lastContact.year) * 12 + (date.month - rel.lastContact.month);
    if (months >= 18 && ["ACQUAINTANCE", "FRIEND"].includes(rel.stage)) rel.stage = "LOST_CONTACT";
  }
  for (const h of Object.values(world.encounters)) {
    const months = (date.year - h.lastSeen.year) * 12 + (date.month - h.lastSeen.month);
    if (months > 0) h.familiarity = clamp(h.familiarity - R.familiarityDecayPerMonthAbsent * Math.min(months, 1), 0, 1);
  }
}
