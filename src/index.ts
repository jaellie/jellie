// Core
export * from "./core/rng";
export * from "./core/gameDate";
export * from "./core/lifeModifiers";
// Saju — Layer A (calendar)
export * from "./saju/types";
export * from "./saju/calendar/fourPillars";
// Saju — Layer B (analysis)
export * from "./saju/chart";
export * from "./saju/analysis/fiveElements";
export * from "./saju/analysis/dayMaster";
export * from "./saju/analysis/tenGods";
export * from "./saju/analysis/relations";
export * from "./saju/analysis/shinsal";
export * from "./saju/analysis/daeun";
export * from "./saju/analysis/fortune";
// Saju — Layer C (interpretation)
export * from "./saju/interpretation/sajuModifierEngine";
// Simulation
export * from "./sim/types";
export * from "./sim/opportunity";
export * from "./sim/opportunityEngine";
export * from "./sim/eventEngine";
export * from "./sim/decisionPolicy";
export * from "./sim/simulateLife";
// Debug / UI view models
export * from "./debug/debugView";
export * from "./ui/destiny/destinyViewModel";
// Living world
export * from "./world/types";
export * from "./world/catalog";
export * from "./world/clock";
export * from "./world/backgroundEngine";
export * from "./world/npcs";
export * from "./world/encounters";
export * from "./world/events";
export * from "./world/worldEngine";
export * from "./world/decisions";
export * from "./world/travel";
export * from "./world/routine";
export * from "./world/worldModifiers";
export * from "./world/sceneComposer";
export * from "./ui/world/worldViewModel";
// Western astrology
export * from "./astrology/ephemeris";
export * from "./astrology/chart";
export * from "./astrology/interpretation";
// MBTI
export * from "./mbti/mbti";
// One-call destiny (SAJU + ASTROLOGY + MBTI, hidden)
export * from "./destiny/profile";
// Birthplaces: city → coordinates + historical time zone (DST) for both charts
export * from "./destiny/birthplace";
export { fatedOptions, myJobOptions, findFatedJob, FATED_JOBS } from "./story/fatedProfile";
export { nationalityOptions } from "./story/nationality";
export { setupDefaults } from "./game/setupDefaults";
// Game runtime (the UI talks only to this)
export * from "./game/game";
export * from "./game/facts";
export * from "./game/director";
export * from "./game/lint";
export { fixJosa } from "./game/text";

/** Which engine build this is — show it small somewhere (Letter from Creator) to check the UI really swapped engines. */
export const ENGINE_VERSION = "2026-10-02.q";
