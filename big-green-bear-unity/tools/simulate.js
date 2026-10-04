/*
 * simulate.js — previews the Unity camera framings WITHOUT Unity.
 * Re-implements Stage.cs placement + perspective projection with the same
 * layout.json. One image per focus point of a location -> ArtSource/sim_<loc>_<focus>.png
 *   node tools/simulate.js <location> [flag flag ...]      e.g.  node tools/simulate.js cafe cafe_changed
 * Flags decide which layers/characters appear (their "when" conditions).
 */
const fs = require("fs");
const path = require("path");
let pw; try { pw = require("playwright"); } catch (e) { pw = require("/opt/node-tools/node_modules/playwright"); }
const ROOT = path.join(__dirname, "..");
const ART = path.join(ROOT, "Assets/BigGreenBear/Resources/BGB/Art/");
const L = JSON.parse(fs.readFileSync(path.join(ROOT, "Assets/BigGreenBear/Resources/BGB/Data/layout.json"), "utf8"));
const locId = process.argv[2] || "square";
const flags = new Set(process.argv.slice(3));
const loc = L.locations.find((l) => l.id === locId);
const W = 1600, H = 900, ASPECT = W / H;
const check = (w) => !w || w.every((c) => (c[0] === "!" ? !flags.has(c.slice(1)) : flags.has(c)));
const pngSize = (f) => { const b = fs.readFileSync(f); return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) }; };
const tanH = Math.tan((L.camera.fov / 2) * Math.PI / 180);
const projY = (refY, refZ, z) => L.camera.y + (refY - L.camera.y) * (z - L.camera.z) / (refZ - L.camera.z);

const items = [], anchors = {};
for (const ly of loc.layers) {
  if (!check(ly.when)) continue;
  const { w, h } = pngSize(ART + ly.sprite + ".png");
  const unit = ly.width / w;
  const anchorY = ly.anchorAt === "viewTop" ? L.camera.y + (ly.z - L.camera.z) * tanH + 0.15 : projY(L.horizon.y, L.horizon.z, ly.z);
  const cy = anchorY - (h / 2 - ly.anchorRow) * unit;
  items.push({ img: ly.sprite, x: ly.x, y: cy, z: ly.z, w: ly.width, h: h * unit, pivot: "center", order: ly.order, name: ly.name });
  for (const a of loc.anchors || []) if (a.layer === ly.name) anchors[a.id] = { x: ly.x + (a.px - w / 2) * unit, y: cy + (h / 2 - a.py) * unit, z: ly.z };
}
const present = {};
for (const a of loc.actors || []) {
  if (!check(a.when)) continue;
  const def = L.cast.find((c) => c.id === a.id);
  let face = a.face || def.face;
  if (!fs.existsSync(ART + def.sprites + "_" + face + ".png")) face = "neutral";
  if (!fs.existsSync(ART + def.sprites + "_" + face + ".png")) face = "happy";
  const { w, h } = pngSize(ART + def.sprites + "_" + face + ".png");
  items.push({ img: def.sprites + "_" + face, x: a.x, y: 0, z: a.z, w: def.height * w / h, h: def.height, pivot: "bottom", order: def.order });
  present[a.id] = { x: a.x, y: def.height * 0.5, z: a.z };
}
items.sort((a, b) => a.order - b.order);

function frame(f) {
  const cx = f.x, cy = L.camera.y + f.y, cz = L.camera.z + f.zoom;
  let html = `<html><body style="margin:0;width:${W}px;height:${H}px;overflow:hidden;position:relative;background:#0f1419">`;
  for (const it of items) {
    if (it.name === "ground_wet" && !flags.has("wet")) continue;
    const d = it.z - cz, s = (W / 2) / (d * tanH * ASPECT);
    const left = W / 2 + (it.x - it.w / 2 - cx) * s;
    const top = it.pivot === "bottom" ? H / 2 - (it.y + it.h - cy) * s : H / 2 - (it.y + it.h / 2 - cy) * s;
    html += `<img src="file://${ART}${it.img}.png" style="position:absolute;left:${left}px;top:${top}px;width:${it.w * s}px;height:${it.h * s}px">`;
  }
  for (const h of loc.hotspots || []) {
    const p = present[h.anchor] || anchors[h.anchor];
    if (!p) continue;
    const d = p.z - cz, s = (W / 2) / (d * tanH * ASPECT);
    const x = W / 2 + (p.x - cx) * s, y = H / 2 - (p.y - cy) * s, r = Math.max(h.radius * s, H * 0.05);
    html += `<div style="position:absolute;left:${x - r}px;top:${y - r}px;width:${2 * r}px;height:${2 * r}px;border:1px dashed rgba(255,255,255,.35);border-radius:50%"></div>`;
    html += `<div style="position:absolute;left:${x - 8}px;top:${y - 8}px;width:16px;height:16px;border-radius:50%;background:rgba(255,240,205,.85)"></div>`;
    html += `<div style="position:absolute;left:${x - 100}px;top:${y - 36}px;width:200px;text-align:center;color:#fff;font:14px sans-serif;text-shadow:0 1px 2px #000">${h.id}</div>`;
  }
  return html + `<div style="position:absolute;left:10px;top:8px;color:#fff;font:14px monospace;text-shadow:0 1px 2px #000">${locId} / ${f.id}</div></body></html>`;
}

(async () => {
  const b = await pw.chromium.launch();
  const p = await b.newPage({ viewport: { width: W, height: H } });
  const which = process.env.FOCUS ? process.env.FOCUS.split(",") : null;
  for (const f of loc.focus) {
    if (which && !which.includes(f.id)) continue;
    const file = path.join(ROOT, "ArtSource/_sim.html");
    fs.writeFileSync(file, frame(f));
    await p.goto("file://" + file);
    await p.waitForTimeout(120);
    await p.screenshot({ path: path.join(ROOT, `ArtSource/sim_${locId}_${f.id}.png`) });
  }
  await b.close();
})();
