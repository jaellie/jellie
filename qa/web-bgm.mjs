// Web build: BGM — "Step by Step" on title/setup, crossfade to "Sunset Homecoming" when the game starts.
// Serve web/ on :8765 first. Usage: node qa/web-bgm.mjs
import { chromium } from "playwright";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--autoplay-policy=user-gesture-required"] });
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
const errs = [];
p.on("pageerror", (e) => errs.push(e.message.slice(0, 200)));
await p.goto("http://localhost:8765/", { waitUntil: "networkidle" });
await p.waitForTimeout(1500);
const state = () => p.evaluate(() => Object.fromEntries(Object.entries(window.__bgm.audio).map(([k, a]) => [k, { paused: a.paused, vol: +a.volume.toFixed(2) }])));
console.log("before tap:", JSON.stringify(await state()));
const click = async (t) => { const l = p.getByText(t, { exact: false }).last(); if ((await l.count()) && (await l.isVisible())) { await l.click(); await p.waitForTimeout(500); return true; } return false; };
await click("START"); await p.waitForTimeout(2500);
console.log("title (after tap):", JSON.stringify(await state()));
await click("한국어"); await p.waitForTimeout(800);
console.log("setup:", JSON.stringify(await state()));
// Walk the setup to the game.
await p.locator("input").first().fill("제이");
const step = async () => (await p.locator("body").innerText()).match(/(나|운명의 상대) · (\d)\/(\d)/)?.[0];
for (let i = 0; i < 40; i++) {
  const s = await step();
  if (!s) break;
  if (s === "나 · 2/8") { const sel = p.locator("select"); for (let k = 0; k < 3; k++) { const vals = await sel.nth(k).locator("option").evaluateAll((os) => os.map((o) => o.value).filter(Boolean)); await sel.nth(k).selectOption(vals[Math.min(5, vals.length - 1)]); } }
  if (!(await click("다음")) && !(await click("새 게임")) && !(await click("시작"))) break;
}
await p.waitForTimeout(4000);
console.log("screen text:", (await p.locator("body").innerText()).slice(0, 40).replace(/\n/g, " "));
console.log("game:", JSON.stringify(await state()));
console.log("errors:", JSON.stringify(errs));
await b.close();
