/*
 * cover.js — itch.io cover from a painted key art:
 * softens the underwater half into a rippling, rain-struck reflection (less of a spoiler)
 * and lays the title on a cream paper strip.
 *   node tools/cover.js Promo/cover/_source_ai.png
 */
const fs = require("fs");
const path = require("path");
let pw; try { pw = require("playwright"); } catch (e) { pw = require("/opt/node-tools/node_modules/playwright"); }
const ROOT = path.join(__dirname, "..");
const SRC = path.resolve(process.argv[2] || path.join(ROOT, "Promo/cover/_source_ai.png"));
const ART = path.join(ROOT, "Assets/BigGreenBear/Resources/BGB/Art/");
const FONTB = path.join(ROOT, "Assets/BigGreenBear/Resources/BGB/FontsBold/Pretendard-SemiBold.otf");
const b = fs.readFileSync(SRC), W = b.readUInt32BE(16), H = b.readUInt32BE(20);
const WATER = Math.round(H * 0.555); // the water line

let rain = "", r = 3;
const rnd = () => ((r = (r * 1664525 + 1013904223) >>> 0) / 4294967296);
for (let i = 0; i < 160; i++) {
  const x = rnd() * W, y = WATER + rnd() * (H - WATER), len = 14 + rnd() * 30;
  rain += `<line x1="${x.toFixed(0)}" y1="${y.toFixed(0)}" x2="${(x - 4).toFixed(0)}" y2="${(y + len).toFixed(0)}" stroke="rgba(200,230,235,${(0.08 + rnd() * 0.18).toFixed(2)})" stroke-width="1.4"/>`;
}
for (let i = 0; i < 26; i++) { // rain rings on the surface
  const x = rnd() * W, y = WATER + 10 + rnd() * (H - WATER) * 0.6, rx = 10 + rnd() * 30;
  rain += `<ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="${rx.toFixed(0)}" ry="${(rx * 0.28).toFixed(1)}" fill="none" stroke="rgba(220,240,240,${(0.1 + rnd() * 0.15).toFixed(2)})" stroke-width="1.5"/>`;
}

const html = `<html><head><style>@font-face{font-family:PB;src:url("file://${FONTB}")}
  body{margin:0;width:${W}px;height:${H}px;position:relative;overflow:hidden;background:#000}</style></head><body>
<svg width="${W}" height="${H}" style="position:absolute;inset:0">
  <defs>
    <filter id="ripple" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.004 0.06" numOctaves="2" seed="4" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="24" xChannelSelector="R" yChannelSelector="G" result="d"/>
      <feGaussianBlur in="d" stdDeviation="2.4"/>
    </filter>
    <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.06" stop-color="#fff" stop-opacity="1"/>
    </linearGradient>
    <mask id="m"><rect x="0" y="${WATER - 40}" width="${W}" height="${H - WATER + 40}" fill="url(#fade)"/></mask>
  </defs>
  <image href="file://${SRC}" width="${W}" height="${H}"/>
  <g mask="url(#m)">
    <image href="file://${SRC}" width="${W}" height="${H}" filter="url(#ripple)"/>
    <rect x="0" y="${WATER - 40}" width="${W}" height="${H}" fill="#06151A" opacity="0.22"/>
  </g>
  ${rain}
</svg>
<div style="position:absolute;left:0;right:0;bottom:0;height:${H * 0.32}px;background:linear-gradient(rgba(4,10,14,0),rgba(4,10,14,.55))"></div>
<div style="position:absolute;left:50%;bottom:${H * 0.035}px;width:${W * 0.8}px;height:${W * 0.8 * 0.17}px;transform:translateX(-50%)">
  <div style="position:absolute;inset:-16% -5%;background:url('file://${ART}ui_strip.png') center/100% 100% no-repeat"></div>
  <div style="position:absolute;left:0;right:0;top:6%;text-align:center;font-family:PB;font-size:${W * 0.056}px;letter-spacing:1px;color:#1F2130">Big Green Bear's Adventure</div>
  <div style="position:absolute;left:0;right:0;top:60%;text-align:center;font-family:PB;font-size:${W * 0.017}px;letter-spacing:${W * 0.008}px;color:#5A5E78">A STORY OF ONE WINTER NIGHT</div>
</div>
</body></html>`;

(async () => {
  const tmp = path.join(ROOT, "ArtSource/_cover.html");
  fs.writeFileSync(tmp, html);
  const br = await pw.chromium.launch();
  const p = await br.newPage({ viewport: { width: W, height: H } });
  await p.goto("file://" + tmp);
  await p.waitForTimeout(400);
  const out = path.join(ROOT, "Promo/cover/itch_cover_full.png");
  await p.screenshot({ path: out });
  // itch.io size: 630 x 500
  const p2 = await br.newPage({ viewport: { width: 630, height: 500 } });
  await p2.setContent(`<body style="margin:0"><img src="data:image/png;base64,${fs.readFileSync(out).toString("base64")}" style="width:630px;height:500px;object-fit:cover"></body>`);
  await p2.screenshot({ path: path.join(ROOT, "Promo/cover/itch_cover_630x500.png") });
  await br.close();
  console.log("wrote Promo/cover/itch_cover_full.png and itch_cover_630x500.png");
})();
