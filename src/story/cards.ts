/**
 * Memory cards for the 시간이 흐른다 screen: each big moment becomes a small
 * framed scene (background + characters) with a caption — proposal in the
 * park, 상견례, the wedding hall, funerals, the airplane, court…
 */
import cardData from "../../data/story/cards.json";
import type { LifeState } from "../sim/types";
import { backgroundEngine } from "../world/backgroundEngine";
import { getLocation } from "../world/catalog";
import { toPrototypeScene, type PrototypeScene } from "../integration/prototype";
import type { Scene, SceneActor } from "../world/sceneComposer";
import { fillNames, fixJosa, CITY_KO } from "../game/text";

type Bi = { ko: string; en: string };
const CARDS = cardData.cards as unknown as Record<string, { location: string; activity: string | null; actors: string[]; caption: Bi }>;

/** "inlaw2" / "guest2" in card data are just a second actor of the same role. */
const baseRole = (role: string): string => role.replace(/\d+$/, "");

const PRIORITY: Record<string, number> = {
  MOM_FUNERAL: 10, DAD_FUNERAL: 10, PARTNER_FUNERAL: 10, PARENT_FUNERAL: 10, FRIEND_FUNERAL: 8, FAMILY_FUNERAL: 7,
  WEDDING: 9, BIRTH: 9, PROPOSAL: 8, DIVORCE: 8, CALL_OFF: 8, MEET_PARENTS: 7, FLIGHT: 7, HOSPITAL: 7, RECOVERED: 7,
  START_DATING: 6, BREAKUP: 7, NEW_HOME: 5, JOB_START: 6, JOB_CHANGE: 6, PROMOTION: 6, LAYOFF: 7, INDEPENDENCE: 6, SHOP_CLOSE: 6,
  RETIREMENT: 7, PET_ADOPT: 5, PET_FAREWELL: 6, FRIEND_WEDDING: 4, KID_SCHOOL: 4, MOVE_CITY: 5, WINDFALL: 5, LOSS: 5, FIRST_DATE: 5, GRADUATION: 5,
};
const MAX_CARDS = 6;

export interface MemoryCard {
  kind: string;
  age: number;
  caption: string;
  scene: PrototypeScene;
}

function h(...p: Array<string | number>): number {
  let x = 2166136261;
  for (const c of p.join("|")) x = Math.imul(x ^ c.charCodeAt(0), 16777619) >>> 0;
  return x;
}

/** Drain queued cards into renderable memory cards (≤ 6, most important first, shown in time order). */
export function buildCards(state: LifeState, lang: "ko" | "en", seed: number): MemoryCard[] {
  const st = state.story;
  if (!st?.cards.length) return [];
  const queued = st.cards.splice(0, st.cards.length);
  const top = queued
    .map((c, i) => ({ c, i, p: PRIORITY[c.kind] ?? 3 }))
    .sort((a, b) => b.p - a.p || a.i - b.i)
    .slice(0, MAX_CARDS)
    .sort((a, b) => a.i - b.i)
    .map((x) => x.c);
  return top.filter((c) => CARDS[c.kind]).map((c) => {
    const def = CARDS[c.kind];
    const loc = getLocation(def.location);
    const married = state.relationship.status === "MARRIED";
    const tod = /FUNERAL/.test(c.kind) ? "EVENING" : c.kind === "FLIGHT" ? "DAY" : "DAY";
    const weather = /FUNERAL|BREAKUP|CALL_OFF|LAYOFF/.test(c.kind) ? "RAIN" : "CLEAR";
    const bg = backgroundEngine.getBackground({ location: loc.id, activityId: def.activity ?? undefined, timeOfDay: tod, weather, facts: { married } });
    const spots = loc.spots ?? [[4.5, 4.5]];
    // A "friend" extra only appears if the player actually has a friend to show.
    const roles = def.actors.filter((r) => baseRole(r) !== "friend" || !!c.vars.friend);
    const actors: SceneActor[] = roles.map((role, i) => {
      const spot = spots[i % spots.length];
      const base = { id: `${c.kind}:${role}`, spot, z: Math.round((spot[0] + spot[1]) * 10) };
      if (role === "me") return { ...base, kind: "player", sex: state.birth.sex, age: c.age, spriteSeed: 0 };
      if (role === "partner") {
        const pid = state.relationship.partnerId;
        const npc = pid ? state.world?.npcs[pid] : undefined;
        return { ...base, kind: "partner", name: c.vars.partner, sex: npc?.sex, spriteSeed: npc?.spriteSeed ?? h(seed, c.vars.partner), fated: npc?.fated };
      }
      const r = baseRole(role);
      const name = r === "friend" ? c.vars.friend : r === "patient" ? c.vars.patient : undefined;
      return { ...base, kind: "npc", npcType: r, name, sex: h(seed, c.kind, role) % 2 ? "MALE" : "FEMALE", spriteSeed: h(seed, c.kind, role, c.age) % 1_000_000 };
    });
    const scene: Scene = {
      size: [360, 340],
      locationId: loc.id,
      prototypeId: loc.prototypeId,
      background: { id: bg.background.id, assetPath: bg.background.assetPath, renderer: bg.background.renderer, status: bg.background.status, layers: [] },
      overlays: bg.overlays,
      actors,
      props: [],
    };
    const vars: Record<string, string> = { ...c.vars, city: lang === "ko" ? CITY_KO[c.vars.city] ?? c.vars.city : c.vars.city };
    let caption = def.caption[lang].replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? m : ""));
    caption = lang === "ko" ? fillNames(caption, vars) : caption.replace(/\{(\w+)\}/g, (_m, k: string) => vars[k] ?? "");
    if (lang === "ko") caption = fixJosa(caption);
    const ps = toPrototypeScene(scene);
    // Role names the UI can map to sprites (inlaw, guest, baby, pet…).
    ps.actors = ps.actors.map((a, i) => ({ ...a, role: baseRole(roles[i]) }));
    return { kind: c.kind, age: c.age, caption, scene: ps };
  });
}
