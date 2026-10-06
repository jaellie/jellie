/**
 * The sky over the life road: a gradient that changes minute by minute — a pale dawn, a clear
 * morning (now and then a flock of birds), a bright afternoon (now and then a plane crossing), a
 * blazing sunset, a deep night with twinkling stars and, once in a while, a shooting star.
 *
 * The engine gives the exact colors (top → horizon), where the sun and moon are, how bright the
 * stars are, and what may fly by; the UI paints the gradient and plays the effects.
 */
export type SkyPhase = "dawn" | "morning" | "afternoon" | "sunset" | "dusk" | "night";

export interface Sky {
  phase: SkyPhase;
  /** Six colors from the top of the sky down to the horizon (evenly spaced) — a vertical linear gradient. */
  gradient: string[];
  /** The sun's disc (x, y = fractions of the sky area, y 0 = top, 1 = horizon); absent at night. */
  sun?: { x: number; y: number; color: string; glow: string };
  /** The moon (crescent) at dusk and night. */
  moon?: { x: number; y: number };
  /** Star brightness 0..1 (twinkle them; 0 = none). */
  stars: number;
  /** Cloud color for this hour. */
  clouds: string;
  /**
   * The clouds' movement: how many (cover 0..1 → about 2–9 clouds on screen), how fast they drift
   * left→right (speed: fraction of the screen width per minute of real time, ~0.1 = a calm 10 minutes
   * to cross), and their shape — puffy (morning/afternoon cumulus), streaks (thin sunset bands), wisps
   * (faint night clouds), or overcast (a grey ceiling on rainy days).
   */
  cloudMotion: { cover: number; speed: number; shape: "puffy" | "streaks" | "wisps" | "overcast" };
  /**
   * What may cross the sky — chance per second for the UI to start one:
   * birds (a small V of birds, mornings), plane (a tiny plane with a contrail, afternoons),
   * shootingStar (a quick streak, clear nights).
   */
  flyers: { birds: number; plane: number; shootingStar: number };
}

type G = string[];
type Key = { at: number; phase: SkyPhase; g: [G, G, G]; clouds: string; stars: number };
// Minutes of the day → the sky at that moment (interpolated in between). Each moment has three palette
// families (six colors, top → horizon); a day keeps one family, so no two days look quite the same.
const NIGHT: [G, G, G] = [
  ["#05081c", "#0b1236", "#141f52", "#1f2c66", "#2c3a78", "#3b4886"],
  ["#0a0620", "#1a0f3d", "#2b1a5c", "#3d2a72", "#4f3a84", "#5f4a90"],
  ["#03101c", "#06223a", "#0b3554", "#14486a", "#20597a", "#2f6a86"],
];
const KEYS: Key[] = [
  { at: 0, phase: "night", g: NIGHT, clouds: "#3a4370", stars: 1 },
  { at: 330, phase: "dawn", g: [
    ["#1c2350", "#3a3f7e", "#7a5fa6", "#c68ab0", "#f7b29a", "#ffd6b0"],
    ["#cdc3ee", "#d6c9f0", "#ded0f0", "#f3d2e4", "#fce0dd", "#fff2e6"],
    ["#2a3a6e", "#5a6aa8", "#a08ec4", "#e6a6b8", "#ffc2a0", "#ffe4c2"],
  ], clouds: "#e7b6c3", stars: 0.35 },
  { at: 420, phase: "morning", g: [
    ["#6fb3f2", "#8cc4f5", "#bcdcf6", "#ffe1c4", "#fff0dc", "#fff6ec"],
    ["#bfe0f5", "#cfe7f7", "#dcecf8", "#f0edf4", "#fdeef0", "#fff6ec"],
    ["#7fc0e8", "#a8d6ee", "#d2e9f0", "#f6e8d8", "#ffe6c8", "#fff2df"],
  ], clouds: "#fff6ef", stars: 0 },
  { at: 600, phase: "morning", g: [
    ["#3f9ae8", "#5eacf0", "#79bdf5", "#9fd0f8", "#c3e2fb", "#e4f4ff"],
    ["#4aa3e6", "#6db8ec", "#93ccf0", "#bfe0f2", "#e2eef2", "#f4f1ea"],
    ["#5b8fe8", "#7aa6f0", "#9cbcf4", "#c0d4f6", "#e0e8f8", "#f2f4fb"],
  ], clouds: "#ffffff", stars: 0 },
  { at: 780, phase: "afternoon", g: [
    ["#2a86e0", "#4199e8", "#5aaef2", "#7cc0f6", "#9fd1fa", "#d9f0ff"],
    ["#a8d4f2", "#b8dcf4", "#cde6f7", "#dfe3f6", "#ecdff6", "#fdeee4"],
    ["#1f78d6", "#3d92e2", "#64aeeb", "#92c9f1", "#c4e1f6", "#eef7fb"],
  ], clouds: "#ffffff", stars: 0 },
  { at: 990, phase: "afternoon", g: [
    ["#3a8fe0", "#5aa2e6", "#76b6ee", "#a6cbec", "#d8dcdc", "#f7e7c8"],
    ["#5b8fd6", "#86a8da", "#b4bcd8", "#dcc8c8", "#f4d4b0", "#ffe2a8"],
    ["#4f86c6", "#7aa0cc", "#a8b6c8", "#d6c4b4", "#f2cfa0", "#ffdc94"],
  ], clouds: "#fff4e0", stars: 0 },
  { at: 1080, phase: "sunset", g: [
    ["#3b4a9c", "#7a55a0", "#c0609a", "#ff8a5c", "#ffb060", "#ffd06b"],
    ["#271d45", "#4d2c58", "#743c66", "#d16450", "#f4a05c", "#ffd28c"],
    ["#2f3f8f", "#6a4a9c", "#b55c9a", "#ec6f7a", "#ff9a6a", "#ffc77a"],
  ], clouds: "#ffb38a", stars: 0 },
  { at: 1140, phase: "sunset", g: [
    ["#2c2f78", "#5a3584", "#8e3f8c", "#f0566a", "#ff7a50", "#ffa04d"],
    ["#1e2260", "#4a2c7a", "#7c3a86", "#c84a72", "#ff6f5c", "#ff9e5a"],
    ["#232a6a", "#3c3a86", "#6a4a98", "#a85a96", "#e8708a", "#ffa47a"],
  ], clouds: "#ff8f7a", stars: 0.1 },
  { at: 1200, phase: "dusk", g: [
    ["#161b4a", "#2a2560", "#3d2f6e", "#5c3a78", "#7a3f7a", "#c45d6a"],
    ["#101a40", "#1e2a5c", "#33386e", "#4f4a80", "#77608e", "#a8789a"],
    ["#14143c", "#2a1f56", "#46306c", "#6a3e7c", "#9a5080", "#d07078"],
  ], clouds: "#6a4a7a", stars: 0.5 },
  { at: 1290, phase: "night", g: NIGHT, clouds: "#3a4370", stars: 1 },
  { at: 1440, phase: "night", g: NIGHT, clouds: "#3a4370", stars: 1 },
];
/** A season's breath near the horizon: spring pink haze, autumn amber, winter pale and cool. */
const SEASON_TINT: Record<string, string> = { SPRING: "#ffd3e2", AUTUMN: "#ffc58a", WINTER: "#e4edf8" };

const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const mix = (a: string, b: string, t: number) => "#" + hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * t).toString(16).padStart(2, "0")).join("");
/** Gray it toward an overcast color when it rains or snows. */
const dull = (c: string, k: number) => mix(c, "#8e96a6", k);

export function skyAt(minute: number, weather = "CLEAR", opts: { day?: number; season?: string } = {}): Sky {
  const m = ((minute % 1440) + 1440) % 1440;
  let i = KEYS.findIndex((k) => k.at > m) - 1;
  if (i < 0) i = KEYS.length - 2;
  const a = KEYS[i], b = KEYS[i + 1];
  const t = (m - a.at) / Math.max(1, b.at - a.at);
  // Weather mutes the colors but keeps the hour: a rainy sunset is still a sunset.
  const wet = weather === "RAIN" || weather === "STORM" ? 0.42 : weather === "SNOW" ? 0.28 : weather === "CLOUDY" ? 0.18 : 0;
  const fam = (((opts.day ?? 0) * 2654435761) >>> 0) % 3;
  const tint = opts.season ? SEASON_TINT[opts.season] : undefined;
  const gradient = a.g[fam].map((c, k) => {
    const col = mix(c, b.g[fam][k], t);
    // the season shows most near the horizon (k = 5), not at the top of the sky
    return dull(tint ? mix(col, tint, 0.04 * k) : col, wet);
  });
  const phase = t < 0.5 ? a.phase : b.phase;
  // The sun rises at 6:00 on the left, peaks at noon, sets at 19:30 on the right.
  const sunT = (m - 360) / (1170 - 360);
  const sun = sunT > -0.02 && sunT < 1.02
    ? { x: 0.1 + 0.8 * sunT, y: 1 - Math.sin(Math.PI * Math.min(1, Math.max(0, sunT))) * 0.8, color: m > 1020 || m < 450 ? "#ffb347" : "#fff6c2", glow: m > 1020 ? "rgba(255,120,60,.55)" : "rgba(255,240,180,.45)" }
    : undefined;
  const nightT = m >= 1170 ? (m - 1170) / (1440 + 360 - 1170) : m < 360 ? (m + 1440 - 1170) / (1440 + 360 - 1170) : -1;
  const moon = nightT >= 0 ? { x: 0.15 + 0.7 * nightT, y: 1 - Math.sin(Math.PI * nightT) * 0.75 } : undefined;
  const stars = Math.max(0, a.stars + (b.stars - a.stars) * t) * (wet ? 0.2 : 1);
  return {
    phase,
    gradient,
    ...(sun && !wet ? { sun } : sun ? { sun: { ...sun, glow: "rgba(255,255,255,.15)" } } : {}),
    ...(moon ? { moon } : {}),
    stars: Math.round(stars * 100) / 100,
    clouds: dull(mix(a.clouds, b.clouds, t), wet),
    cloudMotion: wet >= 0.4
      ? { cover: 1, speed: 0.25, shape: "overcast" }
      : phase === "sunset" || phase === "dusk"
        ? { cover: 0.45 + wet, speed: 0.08, shape: "streaks" }
        : phase === "night" || phase === "dawn"
          ? { cover: 0.25 + wet, speed: 0.05, shape: "wisps" }
          : { cover: (phase === "afternoon" ? 0.55 : 0.35) + wet, speed: phase === "afternoon" ? 0.14 : 0.1, shape: "puffy" },
    flyers: {
      birds: !wet && m >= 360 && m < 660 ? 0.08 : 0,
      plane: !wet && m >= 720 && m < 1050 ? 0.05 : 0,
      shootingStar: !wet && stars > 0.8 ? 0.03 : 0,
    },
  };
}
