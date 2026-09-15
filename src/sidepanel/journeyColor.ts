// Journey identity color. Deliberately keyed off the journey's id — never
// off a domain or site type — so the same site (e.g. YouTube) can appear in
// two differently-colored journeys without implying any relationship
// between them. Color is always paired with the journey title, a status
// label, and (in the trail) an icon, so it's never the sole signal.

export type JourneyColorName =
  | "blue"
  | "sage"
  | "terracotta"
  | "lavender"
  | "rose"
  | "amber";

const ORDER: JourneyColorName[] = [
  "blue",
  "sage",
  "terracotta",
  "lavender",
  "rose",
  "amber",
];

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function journeyColorName(journeyId: string): JourneyColorName {
  return ORDER[hashString(journeyId) % ORDER.length];
}

export const JOURNEY_COLOR_CLASSES: Record<
  JourneyColorName,
  { bg: string; text: string; dot: string; ring: string }
> = {
  blue: { bg: "bg-journey-blue-bg", text: "text-journey-blue-text", dot: "bg-journey-blue-dot", ring: "ring-journey-blue-dot" },
  sage: { bg: "bg-journey-sage-bg", text: "text-journey-sage-text", dot: "bg-journey-sage-dot", ring: "ring-journey-sage-dot" },
  terracotta: { bg: "bg-journey-terracotta-bg", text: "text-journey-terracotta-text", dot: "bg-journey-terracotta-dot", ring: "ring-journey-terracotta-dot" },
  lavender: { bg: "bg-journey-lavender-bg", text: "text-journey-lavender-text", dot: "bg-journey-lavender-dot", ring: "ring-journey-lavender-dot" },
  rose: { bg: "bg-journey-rose-bg", text: "text-journey-rose-text", dot: "bg-journey-rose-dot", ring: "ring-journey-rose-dot" },
  amber: { bg: "bg-journey-amber-bg", text: "text-journey-amber-text", dot: "bg-journey-amber-dot", ring: "ring-journey-amber-dot" },
};

export function journeyColorClasses(journeyId: string) {
  return JOURNEY_COLOR_CLASSES[journeyColorName(journeyId)];
}
