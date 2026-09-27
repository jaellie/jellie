// QA: play the game like a first-time player in a real browser.
// node qa/play.mjs [--seed 7] [--speed 120] [--maxMinutes 4]
import { chromium } from "playwright";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, arr) => (x.startsWith("--") ? [...a, [x.slice(2), arr[i + 1]]] : a), []));
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const outDir = path.join(root, "qa", "screenshots", `seed${args.seed ?? 7}`);
fs.mkdirSync(outDir, { recursive: true });

const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(req.url.split("?")[0]));
  if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) return res.writeHead(404).end();
  res.writeHead(200, { "content-type": p.endsWith(".html") ? "text/html; charset=utf-8" : "application/javascript" });
  fs.createReadStream(p).pipe(res);
}).listen(0);
const port = server.address().port;

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const page = await browser.newPage({ viewport: { width: 400, height: 780 }, deviceScaleFactor: 2 });
const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push(String(e)));
await page.goto(`http://localhost:${port}/qa/index.html?speed=${args.speed ?? 120}&seed=${args.seed ?? 7}`);

// Popups can open between checks (the clock keeps ticking) — never let one wedge the run.
const tryClick = async (loc) => {
  if (await page.getByTestId("popup").isVisible()) return false;
  try { await loc.click({ timeout: 1500 }); return true; } catch (e) { if (process.env.QA_DEBUG) console.error("tryClick", String(e).split("\n").filter((l) => /intercept|not stable|detached/.test(l)).slice(0, 2).join(" / ")); return false; }
};

const shots = [];
const snap = async (name) => {
  const f = path.join(outDir, `${String(shots.length + 1).padStart(2, "0")}-${name}.png`);
  await page.locator("#frame").screenshot({ path: f });
  shots.push(path.relative(root, f));
};

await snap("setup");
await page.getByTestId("start").click();
await page.waitForTimeout(600);
await snap("first-day");

const stats = { days: 1, popups: {}, cards: {}, choicesClicked: 0, activitiesClicked: 0, destinationsUsed: 0 };
const wantCards = new Set(["START_DATING", "FIRST_DATE", "PROPOSAL", "MEET_PARENTS", "WEDDING", "NEW_HOME", "BIRTH", "PET_ADOPT", "FLIGHT", "LAYOFF", "PROMOTION", "RETIREMENT", "MOM_FUNERAL", "DAD_FUNERAL", "FRIEND_FUNERAL", "HOSPITAL", "DIVORCE", "CALL_OFF", "FRIEND_WEDDING"]);
const seenCardShot = new Set();
const deadline = Date.now() + Number(args.maxMinutes ?? 5) * 60_000;
let triedButtons = false, storyShots = 0;

while (Date.now() < deadline) {
  const screen = await page.evaluate(() => window.__qa.screen);
  if (screen === "end") break;
  if (screen === "skip") {
    const kind = await page.getByTestId("card").getAttribute("data-kind");
    if (kind && kind !== "none") {
      stats.cards[kind] = (stats.cards[kind] ?? 0) + 1;
      if (wantCards.has(kind) && !seenCardShot.has(kind)) {
        seenCardShot.add(kind);
        await snap(`card-${kind}`);
      }
    }
    await page.getByTestId("skip-next").click();
    const back = await page.evaluate(() => window.__qa.screen);
    if (back === "play") stats.days++;
    continue;
  }
  if (await page.getByTestId("popup").isVisible()) {
    const src = await page.getByTestId("popup").getAttribute("data-source");
    stats.popups[src] = (stats.popups[src] ?? 0) + 1;
    const isStoryMoment = src === "story" && (await page.evaluate(() => window.__qa.game.s.dayKind)) !== "calm";
    const shoot = isStoryMoment && storyShots < 12;
    if (shoot) await snap(`story-${++storyShots}`);
    const n = await page.locator('[data-testid^="choice-"]').count();
    await page.getByTestId(`choice-${Math.floor(Math.random() * n)}`).click();
    stats.choicesClicked++;
    if (shoot) await snap(`story-${storyShots}-result`);
    await page.getByTestId("continue").click();
    continue;
  }
  // Exercise the interactive elements once: activities, LEAVE → destination.
  if (!triedButtons && screen === "play" && stats.days >= 2) {
    const acts = page.locator('[data-testid^="action-"]:not([data-testid="action-LEAVE"])');
    if (!stats.activitiesClicked && (await acts.count()) && (await tryClick(acts.first()))) { stats.activitiesClicked++; await snap("after-activity"); }
    if ((await page.getByTestId("dest").isVisible()) || (await tryClick(page.getByTestId("action-LEAVE")))) {
      const d = page.locator('[data-testid^="dest-"]');
      if ((await d.count()) && (await tryClick(d.nth(Math.min(2, (await d.count()) - 1))))) { stats.destinationsUsed++; triedButtons = true; await page.waitForTimeout(300); await snap("after-goto"); }
    }
  }
  await page.waitForTimeout(80);
}

const over = (await page.evaluate(() => window.__qa.screen)) === "end";
if (over) {
  await page.waitForTimeout(500);
  await snap("memorial-fading");
  await page.waitForTimeout(4500);
  await snap("memorial");
}
const final = await page.evaluate(() => ({ age: window.__qa.game.hud().age, blocked: window.__qa.game.debugBlocked().length, script: window.__qa.game.state.story.script.map((e) => `${e.age}:${e.theme}:${e.outcome ?? "-"}`) }));
await browser.close();
server.close();
const report = { seed: args.seed ?? 7, over, ...stats, final, consoleErrors: errors, screenshots: shots };
fs.writeFileSync(path.join(outDir, "report.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exitCode = 1;
