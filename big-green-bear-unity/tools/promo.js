/*
 * promo.js — clean 1920x1080 screenshots for store pages / posters, WITHOUT Unity.
 * Same camera math as simulate.js, plus the game's word band, rain and a soft grade.
 *   node tools/promo.js            -> Promo/*.png
 *   node tools/promo.js 02 05      -> only shots whose name starts with these
 *   LANG_PROMO=en node tools/promo.js -> English version in Promo/en/
 */
const fs = require("fs");
const path = require("path");
let pw; try { pw = require("playwright"); } catch (e) { pw = require("/opt/node-tools/node_modules/playwright"); }
const ROOT = path.join(__dirname, "..");
const ART = path.join(ROOT, "Assets/BigGreenBear/Resources/BGB/Art/");
const FONT = path.join(ROOT, "Assets/BigGreenBear/Resources/BGB/Fonts/Pretendard-Regular.otf");
const FONTB = path.join(ROOT, "Assets/BigGreenBear/Resources/BGB/FontsBold/Pretendard-SemiBold.otf");
const L = JSON.parse(fs.readFileSync(path.join(ROOT, "Assets/BigGreenBear/Resources/BGB/Data/layout.json"), "utf8"));
const S = JSON.parse(fs.readFileSync(path.join(ROOT, "Assets/BigGreenBear/Resources/BGB/Data/story.json"), "utf8"));
const OUT = path.join(ROOT, "Promo", process.env.LANG_PROMO === "en" ? "en" : "");
const W = 1920, H = 1080, ASPECT = W / H;
const LANG = process.env.LANG_PROMO === "en" ? "en" : "ko";
const tanH = Math.tan((L.camera.fov / 2) * Math.PI / 180);
const pngSize = (f) => { const b = fs.readFileSync(f); return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) }; };
const projY = (refY, refZ, z) => L.camera.y + (refY - L.camera.y) * (z - L.camera.z) / (refZ - L.camera.z);
const speaker = (id) => S.speakers.find((s) => s.id === id);

// shot: loc, flags, focus (id or {x,y,zoom}), faces, hide, rain 0..1, grade (css filter), line {who, ko} or {ko} narration, title
const SHOTS = [
  { name: "01_key_art", loc: "square", focus: { x: 0.2, y: 0.25, zoom: 0.6 }, faces: { bear: "happy", nini: "happy" }, title: true },
  { name: "02_festival", loc: "square", focus: "both", faces: { bear: "happy", nini: "happy" }, line: { who: "nini", ko: "곰! 곰! 진짜 방울 갖고 있어?", en: "Bear! Bear! Is it true you have bells?" } },
  { name: "03_clock_1147", loc: "square", focus: { x: 0, y: 1.05, zoom: 2.2 }, hide: ["nini", "bear"], rain: 0.35, line: { ko: "기억하는 한 저 시계는 늘 11시 47분이었다. 아무도 고치지 않는다.", en: "It has said 11:47 for as long as anyone can remember. Nobody fixes it." } },
  { name: "04_rain_search", loc: "square", flags: ["wet"], focus: { x: -0.4, y: -0.2, zoom: 1.8 }, faces: { bear: "searching" }, hide: ["nini"], rain: 0.9, grade: "saturate(0.85) brightness(0.92)", line: { ko: "사람들 사이에서 노란 우비를 찾는다. 작은 초록 방울 소리에 귀를 기울인다.", en: "Bear looks for a yellow raincoat in the crowd. Listens for a small green bell." } },
  { name: "05_flower_shop", loc: "flower", focus: "wide", faces: { bear: "worried", lily: "neutral" }, rain: 0.5, line: { who: "lily", ko: "곰! 홀딱 젖었네요. 이 꽃들 좀 봐요, 빗물 먹고 고개를 다 숙였어.", en: "Bear! You're soaked. Look at my flowers, all bowing their heads in the rain." } },
  { name: "06_cafe_changed", loc: "cafe", flags: ["cafe_changed"], focus: "wide", faces: { bear: "searching", mabel: "neutral" }, line: { ko: "…창문이 원래 저쪽에 있었나?", en: "…Was the window always on that side?" } },
  { name: "07_park_notice", loc: "park", focus: { x: 0.9, y: 0.0, zoom: 1.6 }, faces: { bear: "worried", oliver: "neutral" }, rain: 0.4, line: { ko: "합창은 아홉 시다. 아직 시작도 안 했다.", en: "The choir is at nine. It hasn't started yet." } },
  { name: "08_town_gate", loc: "gate", flags: ["wet"], focus: "wide", faces: { bear: "worried", moss: "neutral" }, rain: 0.8, grade: "saturate(0.9)", line: { who: "moss", ko: "수리 일정은 잡혀 있었지. '축제 끝나고.' 두 번째로 미룬 거야.", en: "Repair was booked. 'After the festival.' Second time it got pushed." } },
  { name: "09_passage_spoiler", loc: "passage", flags: ["nini_in_passage"], focus: "both", faces: { bear: "neutral", nini: "worried" }, line: { who: "nini", ko: "같이 가?", en: "Are you coming?" } },
];

function compose(shot) {
  const flags = new Set(shot.flags || []);
  const check = (w) => !w || w.every((c) => (c[0] === "!" ? !flags.has(c.slice(1)) : flags.has(c)));
  const loc = L.locations.find((l) => l.id === shot.loc);
  const items = [];
  for (const ly of loc.layers) {
    if (!check(ly.when)) continue;
    const { w, h } = pngSize(ART + ly.sprite + ".png");
    const unit = ly.width / w;
    const anchorY = ly.anchorAt === "viewTop" ? L.camera.y + (ly.z - L.camera.z) * tanH + 0.15 : projY(L.horizon.y, L.horizon.z, ly.z);
    items.push({ img: ly.sprite, x: ly.x, y: anchorY - (h / 2 - ly.anchorRow) * unit, z: ly.z, w: ly.width, h: h * unit, pivot: "center", order: ly.order });
  }
  for (const a of loc.actors || []) {
    if (!check(a.when) || (shot.hide || []).includes(a.id)) continue;
    const def = L.cast.find((c) => c.id === a.id);
    let face = (shot.faces || {})[a.id] || a.face || def.face;
    for (const f of [face, "neutral", "happy"]) if (fs.existsSync(ART + def.sprites + "_" + f + ".png")) { face = f; break; }
    const { w, h } = pngSize(ART + def.sprites + "_" + face + ".png");
    items.push({ img: def.sprites + "_" + face, x: a.x, y: 0, z: a.z, w: def.height * w / h, h: def.height, pivot: "bottom", order: def.order });
  }
  items.sort((a, b) => a.order - b.order);
  const f = typeof shot.focus === "string" ? loc.focus.find((q) => q.id === shot.focus) : shot.focus;
  const cx = f.x, cy = L.camera.y + f.y, cz = L.camera.z + f.zoom;

  let html = `<html><head><style>
    @font-face{font-family:P;src:url("file://${FONT}")} @font-face{font-family:PB;src:url("file://${FONTB}")}
    body{margin:0;width:${W}px;height:${H}px;overflow:hidden;position:relative;background:#0a0d16;font-family:P}
    .world{position:absolute;inset:0;filter:${shot.grade || "none"}}
    img{position:absolute}
  </style></head><body><div class="world">`;
  for (const it of items) {
    const d = it.z - cz, s = (W / 2) / (d * tanH * ASPECT);
    const left = W / 2 + (it.x - it.w / 2 - cx) * s;
    const top = it.pivot === "bottom" ? H / 2 - (it.y + it.h - cy) * s : H / 2 - (it.y + it.h / 2 - cy) * s;
    html += `<img src="file://${ART}${it.img}.png" style="left:${left}px;top:${top}px;width:${it.w * s}px;height:${it.h * s}px">`;
  }
  html += `</div>`;
  // rain: thin slanted streaks, like the game's rain system
  if (shot.rain) {
    let r = 7, lines = "";
    const rnd = () => ((r = (r * 1664525 + 1013904223) >>> 0) / 4294967296);
    for (let i = 0; i < 420 * shot.rain; i++) {
      const x = rnd() * (W + 200) - 100, y = rnd() * H, len = 30 + rnd() * 50;
      lines += `<line x1="${x.toFixed(0)}" y1="${y.toFixed(0)}" x2="${(x - len * 0.18).toFixed(0)}" y2="${(y + len).toFixed(0)}" stroke="rgba(210,225,245,${(0.12 + rnd() * 0.25).toFixed(2)})" stroke-width="${(1 + rnd() * 1.2).toFixed(1)}"/>`;
    }
    html += `<svg style="position:absolute;inset:0" width="${W}" height="${H}">${lines}</svg>`;
  }
  // soft vignette
  html += `<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 45%,rgba(0,0,0,0) 55%,rgba(0,0,0,.42) 100%)"></div>`;
  // the word band, as in the game
  if (shot.line) {
    const sp = shot.line.who ? speaker(shot.line.who) : null;
    const narr = !sp;
    html += `<div style="position:absolute;left:0;right:0;bottom:0;height:210px;background:url('file://${ART}ui_paper.png') center/512px;opacity:.66"></div>
      <div style="position:absolute;left:0;right:0;bottom:0;height:210px;background:linear-gradient(rgba(10,12,20,0),rgba(10,12,20,.35))"></div>
      <div style="position:absolute;left:150px;bottom:62px;width:1620px">
        ${sp ? `<div style="font-family:PB;font-size:34px;letter-spacing:1px;color:${sp.color};margin-bottom:14px">${sp.name[LANG]}</div>` : ""}
        <div style="font-size:50px;line-height:1.35;color:${narr ? "#E6DED0" : "#F3EBDD"};${narr ? "font-style:italic" : ""};text-shadow:0 2px 6px rgba(0,0,0,.4)">${shot.line[LANG]}</div>
      </div>`;
  }
  if (shot.title) {
    html += `<div style="position:absolute;left:50%;top:150px;transform:translateX(-50%);width:1300px;height:250px;background:url('file://${ART}ui_strip.png') center/100% 100% no-repeat"></div>
      <div style="position:absolute;left:0;right:0;top:${LANG === "en" ? 186 : 188}px;text-align:center;font-family:PB;font-size:${LANG === "en" ? 76 : 92}px;letter-spacing:${LANG === "en" ? 1 : 4}px;color:#1F2130">${LANG === "en" ? "Big Green Bear's Adventure" : "빅그린베어의 모험"}</div>
      <div style="position:absolute;left:0;right:0;top:${LANG === "en" ? 290 : 310}px;text-align:center;font-family:PB;font-size:${LANG === "en" ? 22 : 26}px;letter-spacing:10px;color:#5A5E78">${LANG === "en" ? "BELLFLOWER · WINTER NIGHT" : "BIG GREEN BEAR'S ADVENTURE"}</div>`;
  }
  return html + `</body></html>`;
}

(async () => {
  const only = process.argv.slice(2);
  fs.mkdirSync(OUT, { recursive: true });
  const b = await pw.chromium.launch();
  const p = await b.newPage({ viewport: { width: W, height: H } });
  for (const shot of SHOTS) {
    if (only.length && !only.some((o) => shot.name.startsWith(o))) continue;
    const file = path.join(ROOT, "ArtSource/_promo.html");
    fs.writeFileSync(file, compose(shot));
    await p.goto("file://" + file);
    await p.waitForTimeout(250);
    await p.screenshot({ path: path.join(OUT, shot.name + ".png") });
    console.log("shot", shot.name);
  }
  await b.close();
})();
