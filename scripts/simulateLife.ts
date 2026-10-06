/** npm run simulate -- --seed 12345 --birth 1997-09-28T09:30 --sex FEMALE --years 80 [--explain STUDY_ABROAD_GRAD] */
import { explainOpportunity } from "../src/debug/debugView";
import { formatTimeline, simulateLife } from "../src/sim/simulateLife";
import { birthFromArgs, parseArgs } from "./args";

const a = parseArgs();
const result = simulateLife({
  seed: Number(a.seed ?? 12345),
  birthData: birthFromArgs(a),
  duration: Number(a.years ?? 80),
  profile: { mbti: a.mbti, traits: a.mbti ? undefined : { novelty: Number(a.novelty ?? 0.6), riskTolerance: Number(a.risk ?? 0.5) }, money: Number(a.money ?? 8), familySupport: Number(a.familySupport ?? 0.4) },
  world: a.world === "true",
});
console.log(formatTimeline(result));
const s = result.finalState;
console.log(`\nFinal: ${s.location.city}, ${s.location.country} · ${s.education} · ${s.relationship.status} · money ${Math.round(s.money)}k`);
if (a.explain) {
  for (const e of result.timeline.filter((t) => t.templateId === a.explain && t.score)) {
    console.log(`\n── WHY? (age ${Math.floor(e.age)}) ──`);
    console.log(explainOpportunity({ title: e.title, emoji: e.emoji, score: e.score } as never));
  }
}
