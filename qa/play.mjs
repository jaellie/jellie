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
  res.writeHead(200, { "content-type": p.endsWith(".html") ? "text/html; charset=utf-8" : p.endsWith(".png") ? "image/png" : "application/javascript" });
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

// Language first (with the logo); the form then opens with that language's defaults and logo.
if (!(await page.getByTestId("logo").evaluate((img) => img.complete && img.naturalWidth > 0))) issue("the logo doesn't load on the first screen");
if (!(await page.getByTestId("lang-walker").isVisible())) issue("the first screen doesn't show you walking on the road");
const logoAnim = await page.getByTestId("logo").evaluate((el) => getComputedStyle(el).animationName);
if (logoAnim !== "dropIn") issue(`the logo doesn't drop in (animation: ${logoAnim})`);
await page.waitForTimeout(1000);
await snap("language");
await page.getByTestId("lang-en").hover();
if (!(await page.getByTestId("logo").getAttribute("src")).endsWith("logo-en.png")) issue("the logo doesn't switch to English");
await page.getByTestId("lang-en").click();
await page.waitForTimeout(200);
if (await page.locator("#setup img").count()) issue("the setup screen still shows a logo (first screen only)");
if ((await page.locator("#fName").inputValue()) !== "Jae") issue("English default name is not Jae");
const EN = args.lang === "en";
if (!EN) {
  await page.evaluate(() => document.getElementById("langKo").click());
  if ((await page.locator("#fName").inputValue()) !== "제이") issue("default name is not 제이");
}
await snap("setup");
if ((await page.getByTestId("fated-status").locator("option").count()) !== 4) issue("'are you two dating?' should offer 4 answers");
if ((await page.getByTestId("fated-job").locator("option").count()) < 40) issue("too few jobs for the destined person");
if ((await page.getByTestId("my-job").locator("option").count()) < 44) issue("too few jobs for me");
if (args.myjob) await page.getByTestId("my-job").selectOption(args.myjob);
if (args.status) await page.getByTestId("fated-status").selectOption(args.status);
if (args.from) await page.getByTestId("fated-from").selectOption(args.from);
if (args.job) await page.getByTestId("fated-job").selectOption(args.job);
if ((await page.locator("#fY").inputValue()) !== "1997" || (await page.locator("#fM").inputValue()) !== "9" || (await page.locator("#fD").inputValue()) !== "28") issue("default birth date is not 1997-09-28");
// Birthplace: defaults to 서울; unknown places are flagged; the chosen city reaches the engine.
if (!EN && (await page.locator("#fPlace").inputValue()) !== "서울") issue("default birthplace is not 서울");
await page.locator("#fPlace").fill("아틀란티스");
if (!(await page.getByTestId("birthplace-hint").textContent()).includes("목록에 없는")) issue("unknown birthplace isn't flagged");
await snap("birthplace-unknown");
const wantPlace = args.place ?? (EN ? "Seoul" : "서울");
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
// Not met yet: the years before the meeting are skipped, and a prologue says so.
const prologue = await page.evaluate(() => window.__qa.game.s.day?.prologue ?? "");
if (prologue) {
  if (!(await page.getByTestId("prologue").isVisible())) issue("the prologue isn't shown");
  await snap("prologue");
  await page.waitForTimeout(3600);
}
if (args.live) await page.evaluate((c) => { window.__qa.game.state.location.city = c; document.querySelectorAll("#road .obj").forEach((o) => o.remove()); window.__qa.reseed(); }, args.live);
if (args.myjob) { const job = await page.locator("#hJob").textContent(); if (/L\d/.test(job)) issue(`job label has a level: ${job}`); }
await snap("first-day");
const bi = await page.evaluate(() => window.__qa.game.birthInfo());
// The scene fills the play area: from under the log line to the bottom of the screen.
{
  const fb = await page.locator("#frame").boundingBox(), sb = await page.locator("#road").boundingBox(), lb = await page.locator("#log").boundingBox();
  if (Math.abs(sb.y + sb.height - (fb.y + fb.height)) > 4 || sb.y > lb.y + lb.height + 4 || sb.width < fb.width - 4) issue(`the road doesn't fill the play area (${Math.round(sb.width)}×${Math.round(sb.height)})`);
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
      const bg = await page.getByTestId("popup-title").evaluate((el) => getComputedStyle(el).backgroundImage);
      if (!/rgb\(52, 71, 127\)|rgb\(31, 44, 92\)/.test(bg)) issue(`the title banner isn't navy: ${bg}`);
      if (!seenTitleShot.has(title)) { seenTitleShot.add(title); shoot = true; await snap(`big-${title}`); }
    }
    const line = await page.locator("#pLine").textContent();
    if (EN) for (const t of [line, await page.locator("#pWho").textContent(), await page.locator("#pBanner").textContent(), ...(await page.locator('[data-testid^="choice-"]').allTextContents())]) if (/[가-힣]/.test(t)) issue(`Korean in the English game: ${t}`);
    if (/[{}]|undefined|\((과|와|이|가|은|는|을|를)\)/.test(line)) issue(`popup text has a raw placeholder: ${line}`);
    if (src === "event" && !big && eventShots < 2) { eventShots++; shoot = true; await snap(`event-${eventShots}`); }
    const n = await page.locator('[data-testid^="choice-"]').count();
    await page.getByTestId(`choice-${Math.floor(Math.random() * n)}`).click();
    stats.choicesClicked++;
    const res = await page.locator("#pRes").textContent();
    if (EN && /[가-힣]/.test(res)) issue(`Korean in the English game: ${res}`);
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
    for (const t of texts) if (/^[^"“]{1,20}["“]/.test(t) && /["”]$/.test(t)) issue(`message wrapped in quotes: ${t}`);
    if (job && !job.startsWith("회사원") && texts.some((t) => /팀장|부장님|과장님/.test(t))) issue(`boss text while "${job}": ${texts.find((t) => /팀장|부장님|과장님/.test(t))}`);
    const lb = await page.locator("#log").boundingBox();
    // Measure a note that has finished sliding in (they slide out from behind the log bar, then fade).
    const settled = page.locator(".note:not(.out)").last();
    const nb = (await settled.evaluate((el) => el.getAnimations().length === 0).catch(() => false)) ? await settled.boundingBox({ timeout: 300 }).catch(() => null) : null;
    if (nb && lb && nb.y < lb.y + lb.height - 1) issue("text notifications overlap the log line");
  }
  if (screen === "play" && Date.now() - lastWalkCheck > 8000) {
    lastWalkCheck = Date.now();
    // The life road: freeze the clock, watch 2 s — roadside things should scroll while you walk.
    await page.evaluate(() => (window.__qa.hold = true));
    const tops = () => page.evaluate(() => [...document.querySelectorAll("#road .obj")].map((o) => parseFloat(o.style.top)).reduce((a, b) => a + b, 0));
    const a = await tops();
    await page.waitForTimeout(2000);
    const b = await tops();
    await page.waitForTimeout(300); // one road refresh
    const r = await page.evaluate(() => { const g = window.__qa.game; const f = g.facts(); const rv = g.road(); return { rv, partnered: f.partnered, ld: !!g.state.relationship.longDistance, dom: [...document.querySelectorAll("#road .walker")].sort((x, y) => parseFloat(x.style.left) - parseFloat(y.style.left)).map((w) => w.dataset.role), mood: document.getElementById("log").textContent }; });
    await page.evaluate(() => (window.__qa.hold = false));
    stats.walkChecks++;
    if (r.rv.walking && Math.abs(b - a) > 5) stats.walkMoved++;
    const roles = r.rv.walkers.map((w) => w.role);
    if (!roles.includes("me")) issue("you aren't on your own road");
    if (r.partnered && !r.ld && !roles.includes("partner")) issue("your partner isn't walking beside you");
    if ((!r.partnered || r.ld) && roles.includes("partner")) issue("a partner walks beside you while single or apart");
    const still = await page.evaluate(() => window.__qa.screen === "play");
    if (still && r.dom.join() !== roles.join()) issue(`road draws ${r.dom.join()} but the engine says ${roles.join()}`);
    if (/[0-9]{1,2}:[0-9]{2}/.test(r.mood)) issue(`the top line shows a time: ${r.mood}`);
    if (roles.includes("partner")) stats.partnerWalks = (stats.partnerWalks ?? 0) + 1;
    if (r.rv.landmark) (stats.landmarks ??= new Set()).add(r.rv.landmark.name);
    // By the sea, nothing big floats on the water: big buildings stand on the left, small houses on the right.
    if (r.rv.backdrop.sea === "right") {
      stats.seaside = (stats.seaside ?? 0) + 1;
      const bad = await page.evaluate(() => [...document.querySelectorAll('#road .obj.bldg[data-side="right"]')].length);
      if (bad) issue(`seaside: ${bad} big building(s) on the sea side`);
      if (!shots.some((x) => x.includes("seaside"))) await snap("seaside");
    }
    stats.themes = [...new Set([...(stats.themes ?? []), r.rv.backdrop.theme])];
    if (still && stats.walkChecks === 2 && !shots.some((x) => x.includes("road"))) await snap("road");
    if (still && roles.includes("partner") && !shots.some((x) => x.includes("road-together"))) await snap("road-together");
  }
  await page.waitForTimeout(80);
}

stats.sequenceParts = Object.keys(stats.bigTitles).filter((t) => /\(\d\/4\)/.test(t)).length;
const final = await page.evaluate(() => ({ age: window.__qa.game.hud().age, script: window.__qa.game.state.story.script.map((e) => `${e.age}:${e.theme}:${e.outcome ?? "-"}`) }));
const over = (await page.evaluate(() => window.__qa.screen)) === "end";
if (over) {
  await page.waitForTimeout(500);
  await snap("memorial-fading");
  await page.waitForTimeout(4500);
  await snap("memorial");
  const et = await page.getByTestId("ending-title").textContent();
  if (!et.trim()) issue("the ending has no title");
  stats.ending = { title: et, story: await page.getByTestId("ending-story").textContent(), reason: await page.evaluate(() => window.__qa.game.ending().reason) };
  // 새 인생 → all the way back to the first screen (the language picker), nothing carried over.
  await page.getByTestId("new-life").click({ timeout: 15000 });
  await page.waitForTimeout(300);
  if ((await page.evaluate(() => window.__qa.screen)) !== "lang") issue("새 인생 doesn't go back to the first screen");
  if (await page.evaluate(() => !!window.__qa.game)) issue("새 인생 keeps the old game");
  await snap("new-life");
}
if (stats.walkChecks >= 3 && stats.walkMoved / stats.walkChecks < 0.5) issue(`the road rarely moves (${stats.walkMoved}/${stats.walkChecks} checks)`);
stats.landmarks = [...(stats.landmarks ?? [])];
delete stats.edgeWalkers; delete stats.crowdChecks; delete stats.walkLog; delete stats.offscreenSeen;
await browser.close();
server.close();
const report = { seed: args.seed ?? 7, over, ...stats, final, issues, consoleErrors: errors, screenshots: shots };
fs.writeFileSync(path.join(outDir, "report.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (errors.length || issues.length) process.exitCode = 1;
