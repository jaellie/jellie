// Web build smoke test: serve web/ on :8765 (cd web && python3 -m http.server 8765), then: node qa/web-smoke.mjs <out-dir>
// Checks the offline cache + manifest, reloads with the network off, and clicks START.
import { chromium } from "playwright";
const out = process.argv[2];
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
const errs = [];
p.on("pageerror", (e) => errs.push("pageerror: " + e.message.slice(0, 200)));
await p.goto("http://localhost:8765/", { waitUntil: "networkidle" });
await p.waitForFunction(() => navigator.serviceWorker.controller || navigator.serviceWorker.ready.then(() => true), null, { timeout: 30000 });
await p.waitForTimeout(6000);
const cached = await p.evaluate(async () => { const ks = await caches.keys(); const c = await caches.open(ks[0]); return [ks, (await c.keys()).length]; });
console.log("cache", JSON.stringify(cached));
const man = await p.evaluate(async () => (await (await fetch("manifest.webmanifest")).json()).short_name);
console.log("manifest", man);
await ctx.setOffline(true);
await p.reload({ waitUntil: "load" });
await p.waitForTimeout(3000);
await p.getByText("START").first().click(); await p.waitForTimeout(800);
await p.screenshot({ path: out + "/w06-offline.png" });
console.log("offline body:", (await p.locator("body").innerText()).slice(0, 80).replace(/\n/g, " "));
console.log(JSON.stringify(errs));
await b.close();
