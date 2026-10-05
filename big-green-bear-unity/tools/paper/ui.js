/*
 * ui.js — paper for the interface: the dark sheet behind fades and the word
 * band, the cream strip chapter titles are cut on, the notebook page.
 */
const { rng, ply, sprite } = require("./kit.js");

// a deckled (hand-torn) rectangle
function torn(x, y, w, h, seed, amp = 5) {
  const r = rng(seed);
  let d = `M${x} ${y}`;
  for (let i = 0; i <= w; i += 24) d += ` L${x + i} ${(y + (r() - 0.5) * amp).toFixed(1)}`;
  for (let i = 0; i <= h; i += 24) d += ` L${(x + w + (r() - 0.5) * amp).toFixed(1)} ${y + i}`;
  for (let i = w; i >= 0; i -= 24) d += ` L${x + i} ${(y + h + (r() - 0.5) * amp).toFixed(1)}`;
  for (let i = h; i >= 0; i -= 24) d += ` L${(x + (r() - 0.5) * amp).toFixed(1)} ${y + i}`;
  return d + "Z";
}

module.exports = {
  sprites: {
    // dark night paper, full bleed (fades, the word band)
    ui_paper: () => sprite(1024, 1024, [ply(`<rect width="1024" height="1024" fill="#12172A"/>`, { rim: 0, under: 0, shadow: false, grain: 1, wobble: 0, trans: 0.12, light: { x: 512, y: 300, r: 900 }, lightCol: "#FFC27A" })]),
    // the strip a chapter title is cut on
    ui_strip: () => sprite(1440, 200, [ply(`<path d="${torn(30, 34, 1380, 120, 7)}" fill="#F2E8D4"/>`, { rim: 0.5, rimCol: "#FFFFFF", under: 0.25, shadow: { dx: 6, dy: 12, blur: 12, a: 0.55 }, grain: 0.8, wobble: 1.5 })]),
    // a notebook page
    ui_page: () => sprite(1120, 800, [ply(`<path d="${torn(20, 20, 1080, 760, 9, 6)}" fill="#EFE6D2"/>
      <line x1="110" y1="30" x2="110" y2="770" stroke="#E2A49A" stroke-width="2"/>`, { rim: 0.4, rimCol: "#FFFFFF", under: 0.2, shadow: { dx: 8, dy: 14, blur: 16, a: 0.5 }, grain: 0.8, wobble: 1.2 })]),
  },
};
