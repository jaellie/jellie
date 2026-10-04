/*
 * Loads the engine + content into Node (no browser) in the same order as
 * index.html, so tests always run against exactly what the game loads.
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
const SKIP = new Set(["engine/ui.js", "engine/debug.js", "engine/main.js"]); // need a browser

function load() {
  delete globalThis.BGB;
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  const files = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]);
  for (const f of files) {
    if (SKIP.has(f)) continue;
    vm.runInThisContext(fs.readFileSync(path.join(ROOT, f), "utf8"), { filename: f });
  }
  globalThis.BGB.story.data.config.debug = false; // quiet console during tests
  return globalThis.BGB;
}
module.exports = { load };
