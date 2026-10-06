/**
 * The life-event library: every category file under data/story/events/ (see lifeEvents.ts for
 * the format). Registered once at load; the game draws from it month by month.
 */
import romance from "../../data/story/events/romance.json";
import betrayal from "../../data/story/events/betrayal.json";
import marriage from "../../data/story/events/marriage.json";
import secrets from "../../data/story/events/secrets.json";
import family from "../../data/story/events/family.json";
import moneyUp from "../../data/story/events/money_up.json";
import moneyDown from "../../data/story/events/money_down.json";
import dark from "../../data/story/events/dark.json";
import friendship from "../../data/story/events/friendship.json";
import career from "../../data/story/events/career.json";
import school from "../../data/story/events/school.json";
import health from "../../data/story/events/health.json";
import fate from "../../data/story/events/fate.json";
import chaos from "../../data/story/events/chaos.json";
import life from "../../data/story/events/life.json";
import partnerJob from "../../data/story/events/partner_job.json";
import milestones from "../../data/story/events/milestones.json";
import { type LifeEventDef, registerLifeEvents } from "./lifeEvents";

export const EVENT_FILES = { romance, betrayal, marriage, secrets, family, money_up: moneyUp, money_down: moneyDown, dark, friendship, career, school, health, fate, chaos, life, partner_job: partnerJob, milestones } as unknown as Record<string, { events: LifeEventDef[] }>;

registerLifeEvents(Object.values(EVENT_FILES).flatMap((f) => f.events));
