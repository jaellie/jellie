/*
 * simulate.js — previews the Unity camera framings WITHOUT Unity.
 * Re-implements Stage.cs placement + perspective projection with the same
 * layout.json, and renders one image per focus point into ArtSource/sim_*.png.
 *   node tools/simulate.js [wet]
 */
const fs = require("fs");
const path = require("path");
let pw; try { pw = require("playwright"); } catch (e) { pw = require("/opt/node-tools/node_modules/playwright"); }
const ROOT = path.join(__dirname, "..");
const ART = path.join(ROOT, "Assets/BigGreenBear/Resources/BGB/Art/");
const L = JSON.parse(fs.readFileSync(path.join(ROOT, "Assets/BigGreenBear/Resources/BGB/Data/layout.json"), "utf8"));
const wet = process.argv[2] === "wet";
const W = 1600, H = 900, ASPECT = W / H;

function pngSize(file) {
  const b = fs.readFileSync(file);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}
const tanH = Math.tan((L.camera.fov / 2) * Math.PI / 180);
const projY = (refY, refZ, z) => L.camera.y + (refY - L.camera.y) * (z - L.camera.z) / (refZ - L.camera.z);

// world placement (same as Stage.cs)
const items = [];
const anchors = {};
for (const ly of L.layers) {
  const { w, h } = pngSize(ART + ly.sprite + ".png");
  const unit = ly.width / w;
  const anchorY = ly.anchorAt === "viewTop" ? L.camera.y + (ly.z - L.camera.z) * tanH + 0.15 : projY(L.horizon.y, L.horizon.z, ly.z);
  const cy = anchorY - (h / 2 - ly.anchorRow) * unit;
  items.push({ img: ly.sprite, x: ly.x, y: cy, z: ly.z, w: ly.width, h: h * unit, pivot: "center", order: ly.order, name: ly.name });
  for (const a of L.anchors) if (a.layer === ly.name) anchors[a.id] = { x: ly.x + (a.px - w / 2) * unit, y: cy + (h / 2 - a.py) * unit, z: ly.z };
}
for (const a of L.actors) {
  const face = wet ? (a.id === "bear" ? "worried" : null) : a.face;
  if (!face) continue;
  const { w, h } = pngSize(ART + a.sprites + "_" + face + ".png");
  items.push({ img: a.sprites + "_" + face, x: a.x, y: 0, z: a.z, w: a.height * w / h, h: a.height, pivot: "bottom", order: a.order });
}
if (wet) { const p = anchors.puddle; items.push({ img: "bell", x: p.x, y: p.y, z: p.z, w: 0.42, h: 0.42, pivot: "bottom", order: 20 }); }
items.sort((a, b) => a.order - b.order);
console.log("anchors", JSON.stringify(anchors, (k, v) => typeof v === "number" ? +v.toFixed(2) : v));

function frame(f) {
  const cx = f.x, cy = L.camera.y + f.y, cz = L.camera.z + f.zoom;
  let html = `<html><body style="margin:0;width:${W}px;height:${H}px;overflow:hidden;position:relative;background:#0f1419">`;
  for (const it of items) {
    if (it.name === "ground_wet" && !wet) continue;
    const d = it.z - cz;
    const s = (W / 2) / (d * tanH * ASPECT); // px per world unit at that depth
    const left = W / 2 + (it.x - it.w / 2 - cx) * s;
    const top = it.pivot === "bottom" ? H / 2 - (it.y + it.h - cy) * s : H / 2 - (it.y + it.h / 2 - cy) * s;
    html += `<img src="file://${ART}${it.img}.png" style="position:absolute;left:${left}px;top:${top}px;width:${it.w * s}px;height:${it.h * s}px">`;
  }
  if (wet) html += `<div style="position:absolute;inset:0;background:rgba(40,70,90,.22)"></div>`;
  html += `<div style="position:absolute;left:10px;top:8px;color:#fff;font:14px monospace">${f.id}</div></body></html>`;
  return html;
}

(async () => {
  const b = await pw.chromium.launch();
  const p = await b.newPage({ viewport: { width: W, height: H } });
  for (const f of L.focus) {
    const file = path.join(ROOT, "ArtSource/_sim.html");
    fs.writeFileSync(file, frame(f));
    await p.goto("file://" + file);
    await p.waitForTimeout(150);
    await p.screenshot({ path: path.join(ROOT, `ArtSource/sim_${wet ? "wet_" : ""}${f.id}.png`) });
  }
  await b.close();
})();
