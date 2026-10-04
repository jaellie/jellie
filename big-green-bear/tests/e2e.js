/*
 * Browser test (real Chromium). Opens index.html straight from disk (file://),
 * proving no server or build step is needed. Run:  node tests/e2e.js
 *
 * Covers: keyboard-only play, mouse-only play, evidence board, save/load
 * across a page reload, Korean, reduced motion, small + large screens,
 * the debug panel, and "no JavaScript errors anywhere".
 * Screenshots go to tests/screenshots/.
 */
const path = require("path");
const fs = require("fs");
let pw;
try {
  pw = require("playwright");
} catch (e) {
  pw = require("/opt/node-tools/node_modules/playwright");
}

const URL = "file://" + path.join(__dirname, "..", "index.html");
const SHOTS = path.join(__dirname, "screenshots");
fs.mkdirSync(SHOTS, { recursive: true });

let failures = 0;
function check(cond, msg) {
  console.log((cond ? "  ok   " : "  FAIL ") + msg);
  if (!cond) failures++;
}

async function screen(page) {
  return page.evaluate(() => document.documentElement.getAttribute("data-screen"));
}
// Press Enter until we leave dialogue / chapter cards.
async function readThrough(page) {
  for (let i = 0; i < 80; i++) {
    const s = await screen(page);
    if (s !== "dialogue" && s !== "chapterCard" && s !== "ending") return s;
    const hasChoices = await page.$("#stage .choices .choice");
    if (hasChoices && s === "dialogue") {
      await page.keyboard.press("1");
    } else {
      await page.keyboard.press("Enter");
    }
    await page.waitForTimeout(40);
  }
  return screen(page);
}
// Press the number key of the visible option whose label contains `text`.
async function key(page, text) {
  const k = await page.evaluate((t) => {
    const b = [...document.querySelectorAll("#stage [data-key]")].find((x) => x.textContent.includes(t));
    return b ? b.getAttribute("data-key") : null;
  }, text);
  if (!k) throw new Error('No option containing "' + text + '"');
  await page.keyboard.press(k);
  await page.waitForTimeout(40);
  await readThrough(page);
}
async function click(page, text) {
  await page.locator("#stage button", { hasText: text }).first().click();
  await page.waitForTimeout(40);
  // mouse-only reading: click the Continue button until free
  for (let i = 0; i < 80; i++) {
    const s = await screen(page);
    if (s !== "dialogue" && s !== "chapterCard") return; // endings are stepped by the caller
    const choice = await page.$("#stage .choices .choice");
    if (choice) await choice.click();
    else {
      const cont = await page.$("#stage .continue:not(.ghost)");
      if (cont) await cont.click();
      else await page.locator("#stage .line").first().click(); // finishes the typewriter
    }
    await page.waitForTimeout(40);
  }
}

(async () => {
  const browser = await pw.chromium.launch();
  const errors = [];

  /* ---------- 1. keyboard-only, desktop ---------- */
  console.log("keyboard-only, 1440x900");
  let ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  let page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text()); });
  await page.goto(URL);
  await page.waitForSelector(".title-screen");
  await page.screenshot({ path: path.join(SHOTS, "01-title.png") });
  check((await page.evaluate(() => document.activeElement.textContent)).includes("New game"), "first menu item has focus on the title screen");
  await page.keyboard.press("Enter"); // New game
  await page.waitForTimeout(60);
  check((await screen(page)) === "chapterCard", "chapter card shown");
  await page.screenshot({ path: path.join(SHOTS, "02-chapter-card.png") });
  await readThrough(page);
  check((await screen(page)) === "scene", "intro read with Enter only; scene reached");
  await page.screenshot({ path: path.join(SHOTS, "03-square.png") });

  await key(page, "Nini");
  if ((await screen(page)) === "topics") await page.keyboard.press("Escape"), await page.keyboard.press("Escape");
  // leave Nini's topics with the Leave button via keyboard
  if ((await screen(page)) === "topics") {
    await page.locator("#stage button", { hasText: "Leave" }).focus();
    await page.keyboard.press("Enter");
    await readThrough(page);
  }
  await key(page, "clock");
  await key(page, "Lily's Flower Stall"); // 3rd turn: the rain
  check(await page.evaluate(() => BGB.app.game.state.flags.rain_started === true), "rain event fired");
  await key(page, "Talk to Lily");
  await key(page, "Have you seen Nini");
  await page.locator("#stage button", { hasText: "Leave" }).focus();
  await page.keyboard.press("Enter");
  await readThrough(page);
  await key(page, "Bellflower Square");
  await key(page, "The Stage");
  await key(page, "Talk to Mr. Finch");
  await key(page, "Have you seen Nini");
  await page.locator("#stage button", { hasText: "Leave" }).focus();
  await page.keyboard.press("Enter");
  await readThrough(page);

  // Evidence board, keyboard only
  await page.keyboard.press("b");
  await page.waitForSelector(".panel-board");
  const cards = page.locator(".card");
  const titles = await cards.allTextContents();
  const iLily = titles.findIndex((t) => t.includes("Lily: Nini"));
  const iFinch = titles.findIndex((t) => t.includes("Finch: Nini"));
  for (const i of [iLily, iFinch]) {
    await cards.nth(i).focus();
    await page.keyboard.press("Space");
    await page.waitForTimeout(30);
  }
  await page.locator('[data-fid="compare"]').focus();
  await page.keyboard.press("Enter");
  await page.waitForTimeout(50);
  const msg = await page.locator(".compare-msg").textContent();
  check(msg.includes("do not match"), "board compare found the contradiction: " + msg);
  await page.screenshot({ path: path.join(SHOTS, "04-board.png") });
  await page.keyboard.press("ArrowRight"); // focus is on compare, so move to tabs first
  await page.locator("#tab-evidence").focus();
  await page.keyboard.press("ArrowRight");
  check((await page.locator('[role="tab"][aria-selected="true"]').textContent()) === "Contradictions", "arrow keys move between board tabs");
  check((await page.locator(".contra").count()) === 1, "contradiction listed with a text status label");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(50);
  check((await screen(page)) === "scene", "Esc closes the board");

  // Hint, keyboard
  await page.keyboard.press("h");
  await page.waitForSelector(".panel-hint");
  await page.keyboard.press("Enter");
  check((await page.locator(".hint-line").count()) === 1, "hint level 1 revealed");
  await page.keyboard.press("Escape");

  // Save to slot 1 through the menu
  await page.keyboard.press("Escape");
  await page.waitForSelector(".panel-menu");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page.locator('[data-fid="slot-1"]').click();
  await page.waitForTimeout(100);
  const savedScene = await page.evaluate(() => BGB.app.game.state.scene);
  await page.keyboard.press("Escape");

  /* ---------- 2. interrupted session: reload and continue ---------- */
  console.log("interrupted session");
  await page.reload();
  await page.waitForSelector(".title-screen");
  check(await page.locator("#stage button", { hasText: "Continue" }).count() === 1, "Continue offered after reload");
  await page.locator("#stage button", { hasText: "Continue" }).click();
  await page.waitForTimeout(80);
  check((await page.evaluate(() => Object.keys(BGB.app.game.state.contradictions))).includes("c_nini_parade"), "autosave kept the contradiction");
  check((await page.evaluate(() => BGB.app.game.state.scene)) === savedScene, "autosave kept the scene");

  /* ---------- 3. mouse-only to the end of the slice ---------- */
  console.log("mouse-only");
  await click(page, "Bellflower Square");
  await click(page, "The Old Fountain");
  await click(page, "Look at the gate");
  check(await page.evaluate(() => BGB.app.game.state.flags.gate_1147_seen === true), "gate inconsistency seen");
  await click(page, "puddle");
  await page.waitForTimeout(100);
  check(await page.evaluate(() => BGB.app.game.state.chapter) === "ch2", "chapter 2 reached by mouse");
  await page.screenshot({ path: path.join(SHOTS, "05-chapter2.png") });
  await click(page, "Lily's Flower Stall");
  await click(page, "Talk to Lily");
  if ((await screen(page)) === "topics") {
    await click(page, "Packing up");
    if ((await screen(page)) === "topics") await click(page, "Leave");
  }
  await page.locator(".tool", { hasText: "Board" }).click();
  await page.locator('[role="tab"]', { hasText: "Theories" }).click();
  await page.locator(".theory button", { hasText: "After ten" }).click();
  check((await page.locator(".compare-msg").textContent()).includes("After ten"), "theory confirmed with the mouse");
  await page.screenshot({ path: path.join(SHOTS, "06-theories.png") });
  await page.locator(".panel .close").click();
  await page.waitForTimeout(50);
  await click(page, "The Old Fountain");
  await click(page, "Look at the gate");
  await page.waitForTimeout(150);
  // ending steps (some are timed silences)
  for (let i = 0; i < 40 && (await screen(page)) === "ending"; i++) {
    const b = await page.$("#stage .continue");
    if (b) await b.click();
    await page.waitForTimeout(250);
  }
  await page.waitForTimeout(1800);
  for (let i = 0; i < 10 && (await screen(page)) === "ending"; i++) {
    const b = await page.$("#stage .continue");
    if (b) await b.click();
    await page.waitForTimeout(700);
  }
  check((await screen(page)) === "end", "slice ending finished");
  await page.screenshot({ path: path.join(SHOTS, "07-end.png") });
  await page.locator("#stage button", { hasText: "Begin again" }).click();
  await page.waitForTimeout(60);
  check(await page.evaluate(() => BGB.app.game.state.playthrough) === 2, "New Game+ started");
  for (let i = 0; i < 20 && (await page.evaluate(() => BGB.app.game.state.ui.node)) !== "intro_03"; i++) {
    await page.keyboard.press("Enter");
    await page.waitForTimeout(60);
  }
  await page.keyboard.press("Enter"); // finish typing
  await page.waitForTimeout(80);
  check((await page.locator(".line-text").textContent()).includes("it was you"), "NG+ text shown");

  /* ---------- 4. debug panel ---------- */
  await page.keyboard.press("F2");
  await page.waitForSelector(".panel-debug");
  await page.locator(".panel-debug [role=tab]", { hasText: "validate" }).click();
  check((await page.locator(".panel-debug").textContent()).includes("0 errors"), "debug panel: content validates");
  await page.locator(".panel-debug [role=tab]", { hasText: "state" }).click();
  await page.locator('.panel-debug input[aria-label="memory"]').fill("30");
  await page.locator('.panel-debug input[aria-label="memory"]').dispatchEvent("input");
  check(await page.evaluate(() => document.documentElement.getAttribute("data-memory")) === "final", "memory slider drives the CSS tier");
  await page.keyboard.press("Escape");
  await page.screenshot({ path: path.join(SHOTS, "08-low-memory.png") });
  await ctx.close();

  /* ---------- 5. small screen, Korean, reduced motion ---------- */
  console.log("375px, Korean, reduced motion");
  ctx = await browser.newContext({ viewport: { width: 375, height: 740 }, reducedMotion: "reduce", locale: "ko-KR" });
  page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  await page.goto(URL);
  await page.waitForSelector(".title-screen");
  check((await page.locator(".game-title").textContent()) === "빅그린베어의 모험", "Korean detected from the browser language");
  check(await page.evaluate(() => document.documentElement.getAttribute("data-motion")) === "reduce", "prefers-reduced-motion respected");
  check(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "no horizontal scroll at 375px");
  await page.screenshot({ path: path.join(SHOTS, "09-mobile-title-ko.png") });
  await page.locator("#stage button", { hasText: "새로 시작" }).click();
  await click(page, "계속");
  await page.screenshot({ path: path.join(SHOTS, "10-mobile-scene-ko.png") });
  check(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "no horizontal scroll in a scene at 375px");
  // very long text wraps
  await page.evaluate(() => {
    BGB.story.dialogue({ __long: { speaker: "lily", text: "Supercalifragilistic".repeat(40) + " " + "and so on. ".repeat(80) } });
    BGB.app.game.startDialogue("__long");
  });
  await page.keyboard.press("Enter");
  await page.waitForTimeout(80);
  check(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "very long dialogue wraps without overflow");
  await page.screenshot({ path: path.join(SHOTS, "11-mobile-long-text.png"), fullPage: true });
  await ctx.close();

  await browser.close();
  check(errors.length === 0, "no JavaScript errors" + (errors.length ? ": " + errors.join(" | ") : ""));
  console.log(failures ? failures + " FAILED" : "all browser checks passed");
  process.exit(failures ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
