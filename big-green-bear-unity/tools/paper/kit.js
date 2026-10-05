/*
 * kit.js — shared pieces for the paper-cut lightbox art.
 *
 * Every picture in the game is a stack of PLIES: flat sheets of cut paper.
 * A ply is plain SVG (flat colours, no gradients except the sky panel). The
 * renderer (tools/render-art.js) then turns each ply into real-looking paper:
 *   - fibre grain on the face
 *   - a warm rim of light on its top edges, a dark band on its bottom edges
 *   - backlight glowing THROUGH the paper (cloudy pulp), strongest near the lamp
 *   - a soft shadow cast onto whatever lies behind it
 * and adds bloom around the lit holes (windows, lanterns, the clock).
 *
 * Grammar (from the "Paper-cut Lightbox" style of github.com/lemomo-ai/lemo-opuscar, MIT):
 *   back sheets light and translucent, front sheets dark and opaque;
 *   one temperature per place; light is warm and the only saturated thing,
 *   besides the story's accents: Big Green Bear's green and Nini's yellow.
 */
const fs = require("fs");
const path = require("path");

// deterministic random
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

/* ---------------- colour ---------------- */

// The story's own colours (the accents) + paper whites.
const C = {
  green: "#5E946A", greenShade: "#4A7A56", greenDeep: "#2C4A36", greenLight: "#8DBF95",
  yellow: "#E8BC4A", yellowShade: "#C99A30",
  cream: "#F2E8D4", creamShade: "#DCCDB2", white: "#FBF6EC",
  rose: "#D98C80", boot: "#9C5442",
  gold: "#D9A55A", brown: "#7A5C46", brownDeep: "#4E3A2E",
  ink: "#1E1A22",
  light: "#FFC27A", lightHot: "#FFE2AE", lightCold: "#DDEFF0",
};

// One ladder per place: back (light, translucent) -> front (dark, opaque).
const LADDER = {
  // Bellflower at night: cool blue paper, amber light
  night: { sky0: "#0A1330", sky1: "#1E3366", back: "#6E88BF", far: "#4A64A0", mid: "#2D4277", ground: "#1C2C54", front: "#0C1130", lamp: C.light, rim: "#FFE0B0" },
  // the flower shop street: violet
  violet: { sky0: "#120F2A", sky1: "#2C2552", back: "#8D7DB8", far: "#5F5290", mid: "#3D3468", ground: "#2E284F", front: "#110D24", lamp: C.light, rim: "#FFE0B0" },
  // inside Mabel's cafe: warm
  cafe: { back: "#F0C890", far: "#D49A64", mid: "#9A5E3A", ground: "#6A3C24", front: "#1E0E08", lamp: "#FFD08A", rim: "#FFEFD0" },
  // the park: night green-teal
  park: { sky0: "#08161A", sky1: "#1A3A40", back: "#6FA09A", far: "#3F716C", mid: "#2A4E4C", ground: "#1E3C3A", front: "#08151A", lamp: C.light, rim: "#FFE0B0" },
  // the gate: slate, one red alarm
  slate: { sky0: "#0A1220", sky1: "#22324A", back: "#8EA2BA", far: "#5A6E8A", mid: "#3A4A62", ground: "#2A374C", front: "#0B121C", lamp: C.light, rim: "#FFE0B0" },
  // under the square: cold green-black, one warm hatch
  passage: { back: "#4F6F68", far: "#34504A", mid: "#22362F", ground: "#16302C", front: "#060C0B", lamp: "#CFE3DA", rim: "#D8ECE4" },
  // a bright room: pale, cold, too clean
  hospital: { back: "#F2F7F5", far: "#D3E2DE", mid: "#A9C1BC", ground: "#93ABA6", front: "#4A5E5C", lamp: "#F4FBF8", rim: "#FFFFFF" },
  // years later: daylight in an attic
  attic: { back: "#F7E4BE", far: "#E2B984", mid: "#A87A52", ground: "#7C5638", front: "#3A2618", lamp: "#FFE6B0", rim: "#FFF4DA" },
};

/* ---------------- fonts (baked into the PNGs) ---------------- */
let fontCss = null;
function font() {
  if (!fontCss) {
    const b64 = fs.readFileSync(path.join(__dirname, "fonts/CormorantGaramond-SemiBold.woff2")).toString("base64");
    fontCss = `<style>@font-face{font-family:"Corm";src:url(data:font/woff2;base64,${b64}) format("woff2");}</style>`;
  }
  return fontCss;
}
// cut-paper lettering
function text(x, y, str, size, fill, o = {}) {
  const tr = o.rotate ? ` transform="rotate(${o.rotate} ${x} ${y})"` : "";
  return `<text x="${x}" y="${y}" text-anchor="${o.anchor || "middle"}" font-family="Corm, serif" font-weight="600" font-size="${size}" letter-spacing="${o.spacing ?? size * 0.12}" fill="${fill}"${tr}>${str}</text>`;
}

/* ---------------- sprite / ply builders ---------------- */

// A ply: one sheet of paper. Options (all optional):
//   rim (0..1), rimCol, rimPx, under (0..1), underPx, grain (0..1)
//   shadow: {dx, dy, blur, a} or false
//   trans: backlight translucency 0..1, light: {x, y, r} in px, lightCol
//   wobble: hand-cut edge irregularity (px)
function ply(body, o = {}) { return Object.assign({ body }, o); }

// A sprite: w x h canvas, plies from back to front, optional glow (bloom) pass.
function sprite(w, h, plies, glow) { return { w, h, plies: plies.filter(Boolean), glow: glow || null }; }

// the sky panel: the only gradient allowed. Not paper: no rim, no shadow.
function skyPanel(w, h, top, bottom, seed, o = {}) {
  const r = rng(seed);
  let stars = "";
  for (let i = 0; i < (o.stars ?? 70); i++)
    stars += `<circle cx="${(r() * w) | 0}" cy="${(r() * h * (o.starH ?? 0.45)) | 0}" r="${(0.6 + r() * r() * 2.2).toFixed(1)}" fill="#FFF4DC" opacity="${(0.25 + r() * 0.6).toFixed(2)}"/>`;
  return ply(`<linearGradient id="sky${seed}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient>
    <rect width="${w}" height="${h}" fill="url(#sky${seed})"/>${stars}${o.extra || ""}`, { rim: 0, under: 0, shadow: false, grain: 0.5, wobble: 0 });
}

/* ---------------- motifs ---------------- */

// a rounded western cloud, cut from paper
function cloud(cx, cy, s) {
  return `<path d="M${cx - 120 * s} ${cy} Q${cx - 130 * s} ${cy - 50 * s} ${cx - 70 * s} ${cy - 52 * s} Q${cx - 50 * s} ${cy - 100 * s} ${cx} ${cy - 86 * s}
    Q${cx + 50 * s} ${cy - 120 * s} ${cx + 82 * s} ${cy - 58 * s} Q${cx + 140 * s} ${cy - 56 * s} ${cx + 128 * s} ${cy}Z"/>`;
}

// clock face showing 11:47 (hour 353.5 deg, minute 282 deg)
function clock(cx, cy, r, face, ink, rimCol) {
  const hand = (deg, len, w) => {
    const a = ((deg - 90) * Math.PI) / 180;
    return `<line x1="${cx}" y1="${cy}" x2="${(cx + Math.cos(a) * len).toFixed(1)}" y2="${(cy + Math.sin(a) * len).toFixed(1)}" stroke="${ink}" stroke-width="${w}" stroke-linecap="round"/>`;
  };
  let ticks = "";
  for (let i = 0; i < 12; i++) {
    const a = (i * 30 * Math.PI) / 180, i0 = r * 0.8, i1 = r * (i % 3 ? 0.9 : 0.94);
    ticks += `<line x1="${(cx + Math.sin(a) * i0).toFixed(1)}" y1="${(cy - Math.cos(a) * i0).toFixed(1)}" x2="${(cx + Math.sin(a) * i1).toFixed(1)}" y2="${(cy - Math.cos(a) * i1).toFixed(1)}" stroke="${ink}" stroke-width="${i % 3 ? Math.max(1.5, r / 30) : Math.max(2.5, r / 16)}"/>`;
  }
  return `${rimCol ? `<circle cx="${cx}" cy="${cy}" r="${r * 1.14}" fill="${rimCol}"/>` : ""}<circle cx="${cx}" cy="${cy}" r="${r}" fill="${face}"/>${ticks}
    ${hand(353.5, r * 0.5, Math.max(3, r / 9))}${hand(282, r * 0.78, Math.max(2, r / 13))}<circle cx="${cx}" cy="${cy}" r="${Math.max(2.5, r / 12)}" fill="${ink}"/>`;
}

// a hanging paper lantern
function lantern(cx, cy, rx, ry, fill, cap) {
  return `<rect x="${cx - rx * 0.45}" y="${cy - ry - 8}" width="${rx * 0.9}" height="10" rx="3" fill="${cap}"/>
    <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}"/>
    <rect x="${cx - rx * 0.45}" y="${cy + ry - 4}" width="${rx * 0.9}" height="10" rx="3" fill="${cap}"/>`;
}

// a row of scallops (awning edges, paper doilies)
function scallops(x0, y, n, w, fills) {
  let s = "";
  for (let i = 0; i < n; i++) s += `<circle cx="${x0 + w / 2 + i * w}" cy="${y}" r="${w / 2}" fill="${fills[i % fills.length]}"/>`;
  return s;
}

// wide catenary string with bulbs; returns {line, bulbs}
function stringLights(y0, sag, span, phase, x0, x1) {
  let d = `M${x0} ${y0}`, bulbs = [];
  let i = 0;
  for (let x = x0; x <= x1; x += 16, i++) {
    const t = ((x - x0) % span) / span;
    const y = y0 + Math.sin(t * Math.PI) * sag;
    d += ` L${x} ${y.toFixed(1)}`;
    if ((i + phase) % 4 === 0) bulbs.push([x, y + 11]);
  }
  return { d, bulbs };
}

module.exports = { rng, C, LADDER, font, text, ply, sprite, skyPanel, cloud, clock, lantern, scallops, stringLights };
