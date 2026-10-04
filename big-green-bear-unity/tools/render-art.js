/*
 * render-art.js — renders tools/art.js to transparent PNGs (Chromium via Playwright).
 *   node tools/render-art.js            -> PNGs + SVG sources + preview.png
 * Output PNGs go straight into the Unity Resources folder.
 */
const fs = require("fs");
const path = require("path");
let pw;
try { pw = require("playwright"); } catch (e) { pw = require("/opt/node-tools/node_modules/playwright"); }
const sprites = Object.assign({}, require("./art.js").sprites, require("./art2.js").sprites);
const only = process.argv.slice(2);

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "Assets/BigGreenBear/Resources/BGB/Art");
const SRC = path.join(ROOT, "ArtSource");
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(SRC, { recursive: true });

(async () => {
  const browser = await pw.chromium.launch();
  const page = await browser.newPage();
  for (const [name, fn] of Object.entries(sprites)) {
    if (only.length && !only.some((o) => name.startsWith(o))) continue;
    const s = fn();
    const w = +s.match(/width="(\d+)"/)[1];
    const h = +s.match(/height="(\d+)"/)[1];
    fs.writeFileSync(path.join(SRC, name + ".svg"), s);
    await page.setViewportSize({ width: w, height: h });
    await page.setContent(`<html><body style="margin:0;background:transparent">${s}</body></html>`);
    await page.screenshot({ path: path.join(OUT, name + ".png"), omitBackground: true, clip: { x: 0, y: 0, width: w, height: h } });
    console.log("rendered", name, w + "x" + h);
  }
  await browser.close();
})();
