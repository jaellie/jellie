// City fields in the web build only accept a picked city. Serve web/ on :8765, then: node qa/web-city.mjs <out-dir>
// Web build: the city fields only accept a picked city ("여수수" can't pass; "여수" → pick "여수 · 한국").
// Serve web/ on :8765 first. Usage: node qa/web-city.mjs <out-dir>
import { chromium } from "playwright";
const out = process.argv[2];
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const errs = [];
p.on("pageerror", (e) => errs.push("pageerror: " + e.message.slice(0, 200)));
await p.goto("http://localhost:8765/", { waitUntil: "networkidle" });
await p.waitForTimeout(2000);
const click = async (t) => { const l = p.getByText(t, { exact: false }).last(); if ((await l.count()) && (await l.isVisible())) { await l.click(); await p.waitForTimeout(600); return true; } return false; };
await click("START"); await click("한국어");
const box = () => p.locator("input").first();
await box().fill("제이"); await p.waitForTimeout(300);
const step = async () => (await p.locator("body").innerText()).match(/나 · (\d)\/8/)?.[1];
for (let i = 0; i < 6 && (await step()) !== "3"; i++) {
  if ((await step()) === "2") { const sel = p.locator("select"); for (let k = 0; k < 3; k++) { const vals = await sel.nth(k).locator("option").evaluateAll((os) => os.map((o) => o.value).filter(Boolean)); await sel.nth(k).selectOption(vals[Math.min(5, vals.length - 1)]); } }
  await click("다음"); await p.waitForTimeout(500);
} // → birthplace
console.log("step before:", await step()); await p.screenshot({ path: out + "/city-0.png" });
const input = box();
await input.fill(""); await input.pressSequentially("여수수"); await p.waitForTimeout(500);
await p.screenshot({ path: out + "/city-1-typo.png" });
console.log("next disabled-looking, step stays:", await step());
await input.fill(""); await input.pressSequentially("여수"); await p.waitForTimeout(600);
await p.screenshot({ path: out + "/city-2-list.png" });
const opt = p.getByText("여수 · 한국").first();
console.log("option visible:", await opt.isVisible().catch(() => false));
if (await opt.count()) await opt.click();
await p.waitForTimeout(400);
await p.screenshot({ path: out + "/city-3-picked.png" });
await click("다음"); console.log("after picking 여수, step:", await step());
console.log(JSON.stringify(errs));
await b.close();
