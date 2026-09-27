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

const shots = [];
const snap = async (name) => {
  const f = path.join(outDir, `${String(shots.length + 1).padStart(2, "0")}-${name}.png`);
  await page.locator("#frame").screenshot({ path: f });
  shots.push(path.relative(root, f));
};
const issues = [];
const issue = (msg) => { if (!issues.includes(msg)) issues.push(msg); };

await snap("setup");
if ((await page.locator("#fName").inputValue()) !== "제이") issue("default name is not 제이");
if ((await page.locator("#fY").inputValue()) !== "1997" || (await page.locator("#fM").inputValue()) !== "9" || (await page.locator("#fD").inputValue()) !== "28") issue("default birth date is not 1997-09-28");
// Birthplace: defaults to 서울; unknown places are flagged; the chosen city reaches the engine.
if ((await page.locator("#fPlace").inputValue()) !== "서울") issue("default birthplace is not 서울");
if (!(await page.getByTestId("birthplace-hint").textContent()).includes("서울")) issue("birthplace hint doesn't confirm 서울");
await page.locator("#fPlace").fill("아틀란티스");
if (!(await page.getByTestId("birthplace-hint").textContent()).includes("목록에 없는")) issue("unknown birthplace isn't flagged");
await snap("birthplace-unknown");
const wantPlace = args.place ?? "서울";
await page.locator("#fPlace").fill(wantPlace);
if (!(await page.getByTestId("birthplace-hint").textContent()).startsWith("✓")) issue(`birthplace ${wantPlace} not recognized`);
if (args.place) await snap("birthplace");
if (args.family) {
  await page.locator("#fMom").selectOption("0");
  await page.locator("#fSib").fill("오빠 민수, 여동생");
  await page.locator("#fGp").selectOption("2");
}
await page.getByTestId("start").click();
await page.waitForTimeout(600);
await snap("first-day");
const bi = await page.evaluate(() => window.__qa.game.birthInfo());
// The scene fills the play area: from under the log line to the bottom of the screen.
{
  const fb = await page.locator("#frame").boundingBox(), sb = await page.locator("#scene").boundingBox(), lb = await page.locator("#log").boundingBox();
  if (Math.abs(sb.y + sb.height - (fb.y + fb.height)) > 4 || sb.y > lb.y + lb.height + 4 || sb.width < fb.width - 4) issue(`scene doesn't fill the play area (${Math.round(sb.width)}×${Math.round(sb.height)})`);
}
const spread = { min: Infinity, max: -Infinity };
if (!bi.known) issue(`engine didn't recognize birthplace ${wantPlace}`);


const stats = { edgeWalkers: new Set(), crowdChecks: 0, walkLog: [], days: 1, popups: {}, bigTitles: {}, cards: {}, choicesClicked: 0, walkChecks: 0, walkMoved: 0, offscreenSeen: 0, notes: 0, eventNotes: 0, birthplace: `${bi.place.ko ?? bi.place.name} (UTC${bi.clockOffsetMinutes >= 0 ? "+" : ""}${bi.clockOffsetMinutes / 60}${bi.dstMinutes ? `, DST ${bi.dstMinutes}m` : ""})` };
let eventShots = 0;
const seenCardShot = new Set(), seenTitleShot = new Set();
const deadline = Date.now() + Number(args.maxMinutes ?? 5) * 60_000;
let lastWalkCheck = 0;

while (Date.now() < deadline) {
  const screen = await page.evaluate(() => window.__qa.screen);
  if (screen === "end") break;
  if (screen === "skip") {
    const kind = await page.getByTestId("card").getAttribute("data-kind");
    if (kind && kind !== "none") {
      stats.cards[kind] = (stats.cards[kind] ?? 0) + 1;
      const cap = await page.getByTestId("caption").textContent();
      if (/[{}]|\((과|와|이|가|은|는|을|를)\)/.test(cap)) issue(`card caption has a raw placeholder: ${cap}`);
      if (!seenCardShot.has(kind)) {
        seenCardShot.add(kind);
        await snap(`card-${kind}`);
      }
    }
    for (const n of await page.locator("#sNotes .sn").allTextContents()) {
      stats.eventNotes++;
      if (/[{}]|undefined|\((과|와|이|가|은|는|을|를)\)/.test(n)) issue(`skip-screen note has a raw placeholder: ${n}`);
      if (stats.eventNotes === 1) await snap("skip-notes");
    }
    await page.getByTestId("skip-next").click();
    const back = await page.evaluate(() => window.__qa.screen);
    if (back === "play") stats.days++;
    continue;
  }
  if (await page.getByTestId("popup").isVisible()) {
    const src = await page.getByTestId("popup").getAttribute("data-source");
    const big = (await page.getByTestId("popup").getAttribute("data-big")) === "1";
    stats.popups[src] = (stats.popups[src] ?? 0) + 1;
    // Popups sit in the middle of the play screen.
    const fb = await page.locator("#frame").boundingBox(), pb = await page.locator("#popup").boundingBox();
    if (Math.abs(pb.y + pb.height / 2 - (fb.y + fb.height / 2)) > 24 || Math.abs(pb.x + pb.width / 2 - (fb.x + fb.width / 2)) > 8) issue("popup is not centered");
    if ((await page.locator("#pWho").textContent()).trim() === "") issue(`popup without a speaker name (${src})`);
    let shoot = false;
    if (big) {
      const title = (await page.getByTestId("popup-title").textContent()).trim();
      if (!title) issue("big popup without a title");
      if (!(await page.locator("#pPic .actor").count())) issue(`big popup picture has nobody in it (${title})`);
      const pscene = await page.evaluate(() => window.__qa.game.s.pending?.popup?.scene);
      if (pscene?.online && !(await page.locator('#pPic .actor.phone[data-role="me"]').count())) issue(`online big popup doesn't show you on your phone (${title})`);
      // A big moment takes the screen: no chatty toast left over from earlier (or from yesterday).
      const stale = await page.locator("#notes .note").allTextContents();
      if (stale.length) issue(`toast still showing over the big popup "${title}": ${stale.join(" / ")}`);
      stats.bigTitles[title] = (stats.bigTitles[title] ?? 0) + 1;
      if (!seenTitleShot.has(title)) { seenTitleShot.add(title); shoot = true; await snap(`big-${title}`); }
    }
    const line = await page.locator("#pLine").textContent();
    if (/[{}]|undefined|\((과|와|이|가|은|는|을|를)\)/.test(line)) issue(`popup text has a raw placeholder: ${line}`);
    if (src === "event" && !big && eventShots < 2) { eventShots++; shoot = true; await snap(`event-${eventShots}`); }
    const n = await page.locator('[data-testid^="choice-"]').count();
    await page.getByTestId(`choice-${Math.floor(Math.random() * n)}`).click();
    stats.choicesClicked++;
    const res = await page.locator("#pRes").textContent();
    if (/[{}]|undefined|\((과|와|이|가|은|는|을|를)\)/.test(res)) issue(`result text has a raw placeholder: ${res}`);
    if (shoot) await snap(big ? `big-${[...seenTitleShot].at(-1)}-result` : `event-${eventShots}-result`);
    await page.getByTestId("continue").click();
    continue;
  }
  // Name tags are gone; people walk (sample positions ~1.5 s apart every few seconds).
  if (await page.locator(".actor .tag").count()) issue("name tags are drawn under/over characters");
  const nNotes = await page.locator(".note").count();
  if (nNotes) {
    stats.notes++;
    // Nobody's boss texts the owner (or anyone without an employer).
    const job = (await page.locator("#hJob").textContent().catch(() => "")) ?? "";
    const texts = await page.locator(".note").allTextContents();
    if (job && !job.startsWith("회사원") && texts.some((t) => /팀장|부장님|과장님/.test(t))) issue(`boss text while "${job}": ${texts.find((t) => /팀장|부장님|과장님/.test(t))}`);
    const lb = await page.locator("#log").boundingBox();
    // Measure a note that has finished sliding in (they slide out from behind the log bar, then fade).
    const settled = page.locator(".note:not(.out)").last();
    const nb = (await settled.evaluate((el) => el.getAnimations().length === 0).catch(() => false)) ? await settled.boundingBox({ timeout: 300 }).catch(() => null) : null;
    if (nb && lb && nb.y < lb.y + lb.height - 1) issue("text notifications overlap the log line");
  }
  if (screen === "play" && Date.now() - lastWalkCheck > 10000) {
    lastWalkCheck = Date.now();
    // Freeze the clock so the scene stays put, then watch people for 4 s at real pace (a step every
    // 500 ms): they should be walking, all over the floor, and now and then out through an edge.
    await page.evaluate(() => (window.__qa.hold = true));
    const pos = () => page.evaluate(() => Object.fromEntries([...document.querySelectorAll("#scene .actor")].map((d) => [d.dataset.who, d.style.left + "," + d.style.top + (d.classList.contains("off") ? ",off" : "")])));
    const edge = () => page.evaluate(() => (window.__qa.game.scene()?.actors ?? []).filter((x) => x.offscreen || x.x < 0 || x.x > 1 || x.y > 1).map((x) => x.who));
    const a = await pos();
    // Only a crowd (strangers, customers, coworkers) comes and goes; you, your partner, kids and pets stay.
    const crowd = await page.evaluate(() => (window.__qa.game.scene()?.actors ?? []).filter((x) => x.role === "npc" || x.role === "passerby").length);
    if (crowd >= 3) stats.crowdChecks++;
    let b = a;
    for (let k = 0; k < 8; k++) {
      await page.waitForTimeout(500);
      b = await pos();
      for (const who of await edge()) stats.edgeWalkers.add(who);
      stats.offscreenSeen += Object.values(b).filter((v) => v.endsWith(",off")).length;
    }
    stats.walkLog.push(await page.evaluate(() => { const g = window.__qa.game; const sc = g.scene(); return `${g.s.loc}@${g.s.minute} ${(sc?.actors ?? []).map((x) => x.role[0] + (x.offscreen ? "*" : "")).join("")}`; }));
    await page.evaluate(() => (window.__qa.hold = false));
    const common = Object.keys(a).filter((k) => k in b);
    for (const v of Object.values(b)) {
      const top = parseFloat(v.split(",")[1]);
      if (!v.endsWith(",off") && Number.isFinite(top)) (spread.min = Math.min(spread.min, top)), (spread.max = Math.max(spread.max, top));
    }
    if (common.length >= 2) {
      stats.walkChecks++;
      if (common.filter((k) => a[k] !== b[k]).length >= Math.ceil(common.length / 3)) stats.walkMoved++;
    }
    if (stats.walkChecks === 2 && !shots.some((x) => x.includes("walking"))) await snap("walking");
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
if (stats.walkChecks && stats.walkMoved / stats.walkChecks < 0.6) issue(`people rarely walk (${stats.walkMoved}/${stats.walkChecks} checks)`);
stats.floorSpread = Number.isFinite(spread.min) ? Math.round(spread.max - spread.min) : 0;
stats.edgeWalkers = stats.edgeWalkers.size;
if (stats.crowdChecks >= 4 && !stats.edgeWalkers) issue(`nobody in a crowd ever walks out through the screen edges (${stats.crowdChecks} crowded checks)`);
if (stats.walkChecks >= 3 && stats.floorSpread < 0.4 * 642) issue(`people stay in a small part of the screen (vertical spread ${stats.floorSpread}px)`);
const final = await page.evaluate(() => ({ age: window.__qa.game.hud().age, script: window.__qa.game.state.story.script.map((e) => `${e.age}:${e.theme}:${e.outcome ?? "-"}`) }));
await browser.close();
server.close();
const report = { seed: args.seed ?? 7, over, ...stats, final, issues, consoleErrors: errors, screenshots: shots };
fs.writeFileSync(path.join(outDir, "report.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (errors.length || issues.length) process.exitCode = 1;
