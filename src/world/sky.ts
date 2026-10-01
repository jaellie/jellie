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
  /** Four colors from the top of the sky down to the horizon — paint a vertical linear gradient. */
  gradient: [string, string, string, string];
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

type Key = { at: number; phase: SkyPhase; g: [string, string, string, string]; clouds: string; stars: number };
// Minutes of the day → the sky at that moment (interpolated in between).
const KEYS: Key[] = [
  { at: 0, phase: "night", g: ["#070b24", "#121a45", "#1f2a5e", "#2e3a73"], clouds: "#3a4370", stars: 1 },
  { at: 330, phase: "dawn", g: ["#1c2350", "#4b4a8a", "#c68ab0", "#ffc49b"], clouds: "#e7b6c3", stars: 0.35 },
  { at: 420, phase: "morning", g: ["#6fb3f2", "#9ccdf7", "#ffe1c4", "#fff1dc"], clouds: "#fff6ef", stars: 0 },
  { at: 600, phase: "morning", g: ["#3f9ae8", "#79bdf5", "#b9defb", "#e4f4ff"], clouds: "#ffffff", stars: 0 },
  { at: 780, phase: "afternoon", g: ["#2a86e0", "#5aaef2", "#9fd1fa", "#d9f0ff"], clouds: "#ffffff", stars: 0 },
  { at: 990, phase: "afternoon", g: ["#3a8fe0", "#76b6ee", "#c3dcf2", "#f7e7c8"], clouds: "#fff4e0", stars: 0 },
  { at: 1080, phase: "sunset", g: ["#3b4a9c", "#c0609a", "#ff8a5c", "#ffd06b"], clouds: "#ffb38a", stars: 0 },
  { at: 1140, phase: "sunset", g: ["#2c2f78", "#8e3f8c", "#f0566a", "#ffa04d"], clouds: "#ff8f7a", stars: 0.1 },
  { at: 1200, phase: "dusk", g: ["#161b4a", "#3d2f6e", "#7a3f7a", "#c45d6a"], clouds: "#6a4a7a", stars: 0.5 },
  { at: 1290, phase: "night", g: ["#070b24", "#121a45", "#1f2a5e", "#2e3a73"], clouds: "#3a4370", stars: 1 },
  { at: 1440, phase: "night", g: ["#070b24", "#121a45", "#1f2a5e", "#2e3a73"], clouds: "#3a4370", stars: 1 },
];

const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const mix = (a: string, b: string, t: number) => "#" + hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * t).toString(16).padStart(2, "0")).join("");
/** Gray it toward an overcast color when it rains or snows. */
const dull = (c: string, k: number) => mix(c, "#8e96a6", k);

export function skyAt(minute: number, weather = "CLEAR"): Sky {
  const m = ((minute % 1440) + 1440) % 1440;
  let i = KEYS.findIndex((k) => k.at > m) - 1;
  if (i < 0) i = KEYS.length - 2;
  const a = KEYS[i], b = KEYS[i + 1];
  const t = (m - a.at) / Math.max(1, b.at - a.at);
  const wet = weather === "RAIN" || weather === "STORM" ? 0.55 : weather === "SNOW" ? 0.4 : weather === "CLOUDY" ? 0.3 : 0;
  const gradient = a.g.map((c, k) => dull(mix(c, b.g[k], t), wet)) as Sky["gradient"];
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
