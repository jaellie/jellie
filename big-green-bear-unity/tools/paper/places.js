/*
 * places.js — every location, as stacks of cut paper (see kit.js).
 *
 * Location layers are 2048 x 1152 (far / mid / fg) and 2048 x 560 (ground).
 * The floor line of every mid layer is row 930; far layers meet the horizon at
 * row 760. Objects you can click sit where layout.json's anchors expect them.
 */
const { rng, C, LADDER, text, ply, sprite, skyPanel, cloud, clock, lantern, scallops, stringLights } = require("./kit.js");

const W = 2048, H = 1152, GH = 560;

/* ================= shared pieces ================= */

// rows of little houses with lit windows; returns {sheet, glow}
function houses(seed, yBase, hMin, hMax, gapFrom, gapTo, winCol, litChance = 0.4) {
  const r = rng(seed);
  let sheet = "", lit = "";
  let x = -40;
  while (x < W + 60) {
    const w = 110 + r() * 120;
    if (x + w > gapFrom && x < gapTo) { x = gapTo; continue; }
    const h = hMin + r() * (hMax - hMin), top = yBase - h, peak = 50 + r() * 50;
    sheet += `<path d="M${x} ${H} L${x} ${top} L${x + w / 2} ${top - peak} L${x + w} ${top} L${x + w} ${H}Z"/>`;
    if (r() < 0.5) sheet += `<rect x="${x + w * 0.68}" y="${top - peak * 0.9}" width="18" height="${peak * 0.7}"/>`; // chimney
    for (let wy = top + 26; wy < yBase - 30; wy += 54)
      for (let wx = x + 18; wx < x + w - 34; wx += 46)
        if (r() < litChance) lit += `<rect x="${wx}" y="${wy}" width="20" height="26" rx="3"/>`;
    x += w + 6 + r() * 26;
  }
  return { sheet, lit };
}

function cobbleGrooves(seed, col) {
  const r = rng(seed);
  let g = "";
  for (let row = 0; row < 14; row++) {
    const y = 18 + row * row * 2.6 + row * 14, h = 10 + row * 2.2, w = 26 + row * 5;
    g += `<line x1="0" y1="${y - 3}" x2="${W}" y2="${y - 3}" stroke="${col}" stroke-width="${1 + row * 0.25}" opacity="0.55"/>`;
    for (let x = -w + ((row % 2) * w) / 2; x < W + w; x += w + 4)
      if (r() < 0.35) g += `<line x1="${x.toFixed(0)}" y1="${y - 3}" x2="${(x - 2).toFixed(0)}" y2="${(y + h).toFixed(0)}" stroke="${col}" stroke-width="${1 + row * 0.2}" opacity="0.6"/>`;
  }
  return g;
}

// short horizontal knife-dabs of light on wet ground, under a light at x
function reflections(seed, x, y, spread, n, col, depth = 40) {
  const r = rng(seed);
  let s = "";
  for (let i = 0; i < n; i++) {
    const t = i / n, w = (14 + r() * 34) * (1 - t * 0.5);
    s += `<rect x="${(x - w / 2 + (r() - 0.5) * spread).toFixed(0)}" y="${(y + t * depth).toFixed(0)}" width="${w.toFixed(0)}" height="${(3 + r() * 3).toFixed(1)}" rx="2" fill="${col}" opacity="${(0.9 - t * 0.6).toFixed(2)}"/>`;
  }
  return s;
}

// the near edge of the floor: a second, darker sheet with a soft wavy top
function frontLip(L, seed, y = 215, col) {
  const r = rng(seed);
  let d = `M0 ${GH} L0 ${y}`;
  for (let x = 0; x <= W; x += 128) d += ` Q${x + 64} ${(y - 16 - r() * 22).toFixed(0)} ${x + 128} ${(y + (r() - 0.5) * 10).toFixed(0)}`;
  return ply(`<path d="${d} L${W} ${GH}Z" fill="${col || L.front}" opacity="0.92"/>`, { rim: 0.35, rimCol: L.rim, shadow: { dx: 0, dy: -6, blur: 14, a: 0.35 }, grain: 0.3, wobble: 1 });
}

/* ================= BELLFLOWER SQUARE ================= */
const NIGHT = LADDER.night;

function squareFar() {
  const back = houses(41, 700, 70, 150, 99999, 99999, NIGHT.lamp, 0.25);
  const front = houses(43, 860, 150, 280, 820, 1230, NIGHT.lamp, 0.42);
  const hall = `
    <rect x="860" y="540" width="328" height="620"/><path d="M840 548 L1024 470 L1208 548Z"/>
    <rect x="950" y="250" width="148" height="300"/><path d="M936 256 L1024 150 L1112 256Z"/><rect x="1018" y="108" width="12" height="48"/>
    <circle cx="1024" cy="380" r="76"/>`;
  const hallLit = `${[0, 1, 2].map((i) => `<rect x="${900 + i * 92}" y="600" width="52" height="96" rx="26"/><rect x="${900 + i * 92}" y="740" width="52" height="96" rx="26"/>`).join("")}`;
  return sprite(W, H, [
    skyPanel(W, H, NIGHT.sky0, NIGHT.sky1, 401, { stars: 90 }),
    ply(`<g fill="#24396E">${cloud(330, 230, 1.4)}${cloud(1650, 170, 1.1)}${cloud(1840, 300, 0.8)}</g>`, { trans: 0.5, light: { x: 1024, y: 380, r: 700 }, rim: 0.3, rimCol: NIGHT.rim, shadow: { dx: 4, dy: 8, blur: 14, a: 0.35 } }),
    ply(`<g fill="${NIGHT.back}">${back.sheet}<rect x="0" y="690" width="${W}" height="${H - 690}"/></g><g fill="${NIGHT.lamp}" opacity="0.8">${back.lit}</g>`,
      { trans: 0.55, light: { x: 1024, y: 500, r: 900 }, lightCol: NIGHT.lamp, rim: 0.45, rimCol: NIGHT.rim, shadow: { dx: 6, dy: 10, blur: 16, a: 0.45 } }),
    ply(`<g fill="${NIGHT.far}">${front.sheet}${hall}<rect x="0" y="840" width="${W}" height="${H - 840}"/></g>
      <g fill="${NIGHT.lamp}">${front.lit}${hallLit}</g>${clock(1024, 380, 62, "#FFF0D2", "#22263A", null)}`,
      { trans: 0.4, light: { x: 1024, y: 420, r: 800 }, lightCol: NIGHT.lamp, rim: 0.5, rimCol: NIGHT.rim, shadow: { dx: 6, dy: 12, blur: 16, a: 0.5 } }),
  ], { body: `<g fill="${NIGHT.lamp}">${front.lit}${hallLit}</g><circle cx="1024" cy="380" r="66" fill="#FFE4B0"/>`, passes: [[14, 0.5], [60, 0.45]] });
}

function stall(x, a, b) {
  let stripes = "";
  for (let i = 0; i < 8; i++) stripes += `<rect x="${x - 10 + i * 37.5}" y="690" width="37.5" height="70" fill="${i % 2 ? a : b}"/>`;
  return { frame: `<rect x="${x}" y="690" width="12" height="250"/><rect x="${x + 268}" y="690" width="12" height="250"/><rect x="${x - 6}" y="830" width="292" height="110" rx="6"/><rect x="${x - 14}" y="678" width="308" height="16" rx="6"/>`,
    awning: `${stripes}${scallops(x - 10, 760, 8, 37.5, [b, a])}` };
}
function squareMid() {
  const s1 = stall(110, C.cream, "#C9806E"), s2 = stall(500, C.cream, "#7E93B8"), s3 = stall(1260, C.cream, C.gold);
  const st1 = stringLights(420, 70, 520, 0, -20, 2068), st2 = stringLights(500, 54, 520, 2, -20, 2068);
  const bulbs = [...st1.bulbs, ...st2.bulbs].map(([x, y]) => `<circle cx="${x}" cy="${y.toFixed(1)}" r="7.5"/>`).join("");
  const lanterns = [0, 1, 2, 3, 4].map((i) => `<line x1="${1290 + i * 52}" y1="770" x2="${1290 + i * 52}" y2="788" stroke="${NIGHT.front}" stroke-width="2"/>` +
    lantern(1290 + i * 52, 806, 18, 22, ["#E2704F", "#EE9A3E", "#F2BE4E"][i % 3], NIGHT.front)).join("");
  const goods = `
    ${Array.from({ length: 11 }, (_, i) => `<circle cx="${140 + i * 22}" cy="${814 - (i % 3) * 5}" r="${10 + (i % 3)}"/>`).join("")}
    ${Array.from({ length: 6 }, (_, i) => `<rect x="${530 + i * 38}" y="796" width="24" height="34" rx="4"/>`).join("")}`;
  const fountain = `<ellipse cx="1660" cy="900" rx="150" ry="34"/><rect x="1510" y="846" width="300" height="56"/><ellipse cx="1660" cy="846" rx="150" ry="30"/>
    <rect x="1646" y="760" width="28" height="90"/><ellipse cx="1660" cy="760" rx="50" ry="14"/>`;
  const gate = `<path d="M1850 940 L1872 820 L2040 820 L2048 940Z"/><rect x="1858" y="760" width="8" height="180"/><rect x="2032" y="760" width="8" height="180"/>
    ${Array.from({ length: 8 }, (_, i) => `<rect x="${1878 + i * 20}" y="772" width="5" height="96"/>`).join("")}<rect x="1858" y="764" width="182" height="8"/>`;
  return sprite(W, H, [
    // the strings of bulbs hang furthest back
    ply(`<path d="${st1.d}" stroke="${NIGHT.front}" stroke-width="3" fill="none"/><path d="${st2.d}" stroke="${NIGHT.front}" stroke-width="3" fill="none"/><g fill="${C.lightHot}">${bulbs}</g>`,
      { rim: 0, under: 0, shadow: { dx: 3, dy: 8, blur: 6, a: 0.35 }, wobble: 0.8 }),
    // stalls, fountain, the service gate: one sheet
    ply(`<g fill="${NIGHT.mid}"><rect x="0" y="930" width="${W}" height="${H - 930}"/>${s1.frame}${s2.frame}${s3.frame}${goods}${fountain}${gate}</g>
      <ellipse cx="1660" cy="846" rx="128" ry="22" fill="#4A6AA8"/>
      <path d="M1872 850 L2040 850 M1868 880 L2044 880 M1864 910 L2046 910" stroke="#1C2A52" stroke-width="5"/>`,
      { trans: 0.12, light: { x: 1024, y: 420, r: 1000 }, lightCol: NIGHT.lamp, rim: 0.55, rimCol: NIGHT.rim }),
    // awnings: thin paper the stall bulbs shine through
    ply(`${s1.awning}${s2.awning}${s3.awning}`, { trans: 0.22, light: { x: 1024, y: 760, r: 900 }, lightCol: NIGHT.lamp, rim: 0.4, rimCol: NIGHT.rim, shadow: { dx: 4, dy: 8, blur: 8, a: 0.45 } }),
    ply(lanterns, { trans: 0.18, light: { x: 1394, y: 806, r: 200 }, lightCol: C.lightHot, rim: 0.3, shadow: { dx: 3, dy: 6, blur: 6, a: 0.4 } }),
    // stuck-on paper: the banner, the staff-only plate, the closing notice
    ply(`<line x1="330" y1="588" x2="770" y2="588" stroke="${NIGHT.front}" stroke-width="3"/>
      <path d="M340 594 L760 594 L752 650 L348 650Z" fill="${C.cream}"/>${text(550, 632, "BELLFLOWER WINTER NIGHT", 25, NIGHT.mid)}
      <rect x="1888" y="712" width="124" height="38" rx="3" fill="#1C2A52"/>${text(1950, 738, "STAFF ONLY", 17, C.cream)}
      <rect x="1926" y="790" width="48" height="58" fill="${C.cream}"/><line x1="1934" y1="806" x2="1966" y2="806" stroke="${C.ink}" stroke-width="2"/>
      <line x1="1934" y1="818" x2="1960" y2="818" stroke="${C.ink}" stroke-width="2"/>${text(1950, 840, "21:15", 14, C.ink, { spacing: 0.5 })}`,
      { rim: 0.4, rimCol: NIGHT.rim, shadow: { dx: 3, dy: 6, blur: 5, a: 0.45 } }),
  ], { body: `<g fill="${C.light}">${bulbs}</g>${[0, 1, 2, 3, 4].map((i) => `<ellipse cx="${1290 + i * 52}" cy="806" rx="16" ry="20" fill="#F08A4A"/>`).join("")}`, passes: [[12, 0.35], [40, 0.4]] });
}

function squareGround() {
  return sprite(W, GH, [
    ply(`<rect width="${W}" height="${GH}" fill="${NIGHT.ground}"/>${cobbleGrooves(61, "#18284E")}`,
      { trans: 0.18, light: { x: 1024, y: 0, r: 600 }, lightCol: NIGHT.lamp, rim: 0.5, rimCol: NIGHT.rim, shadow: false, wobble: 0.6, grain: 0.35 }),
    frontLip(NIGHT, 63, 215, "#152346"),
  ]);
}

function squareWet() {
  const spots = [[260, 300, 210, 34], [820, 210, 160, 22], [1300, 360, 240, 40], [1560, 150, 210, 30], [560, 470, 280, 46], [1640, 470, 220, 40]];
  let pud = "", lit = "";
  spots.forEach(([cx, cy, rx, ry], i) => {
    pud += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/>`;
    lit += reflections(71 + i, cx, cy - ry * 0.55, rx * 1.1, 7, C.light, ry * 1.0);
  });
  return sprite(W, GH, [
    ply(`<g fill="#121E3E">${pud}</g>`, { rim: 0, under: 0.3, shadow: false, grain: 0.6, wobble: 2.5 }),
    ply(lit, { rim: 0, under: 0, shadow: false, grain: 0.3, wobble: 1 }),
  ], { body: lit, passes: [[8, 0.5]] });
}

function squareFg() {
  let bunting = "";
  for (let i = 0; i < 34; i++) {
    const x = i * 62, y = 30 + Math.sin((i / 33) * Math.PI) * 60, y2 = 30 + Math.sin(((i + 1) / 33) * Math.PI) * 60;
    bunting += `<path d="M${x} ${y} L${x + 62} ${y2} L${x + 31} ${(y + y2) / 2 + 58}Z"/>`;
  }
  const head = (cx, cy, s) => `<circle cx="${cx}" cy="${cy}" r="${46 * s}"/><path d="M${cx - 110 * s} ${cy + 230 * s} Q${cx - 100 * s} ${cy + 40 * s} ${cx} ${cy + 40 * s} Q${cx + 100 * s} ${cy + 40 * s} ${cx + 110 * s} ${cy + 230 * s}Z"/>`;
  return sprite(W, H, [
    ply(`<path d="M-20 30 Q1024 160 2068 30" stroke="${NIGHT.front}" stroke-width="4" fill="none"/><g fill="${NIGHT.front}">${bunting}</g>`,
      { rim: 0.7, rimCol: NIGHT.rim, rimPx: 4, shadow: { dx: 6, dy: 12, blur: 12, a: 0.4 }, blur: 1.2 }),
    ply(`<g fill="${NIGHT.front}"><rect x="166" y="300" width="22" height="900"/><rect x="150" y="300" width="54" height="16"/>
      <path d="M140 300 L214 300 L200 200 L154 200Z"/><path d="M150 196 L177 170 L204 196Z"/></g><path d="M156 290 L198 290 L190 214 L164 214Z" fill="${C.lightHot}"/>`,
      { rim: 0.6, rimCol: NIGHT.rim, shadow: { dx: 6, dy: 10, blur: 12, a: 0.45 }, blur: 1 }),
    ply(`<g fill="${NIGHT.front}">${head(80, 980, 1.3)}${head(330, 1040, 1.1)}${head(1880, 1000, 1.25)}${head(2030, 960, 1.1)}</g>`,
      { rim: 0.8, rimCol: NIGHT.rim, rimPx: 5, shadow: false, blur: 4 }),
  ], { body: `<path d="M156 290 L198 290 L190 214 L164 214Z" fill="${C.light}"/>`, passes: [[20, 0.7], [80, 0.5]] });
}

/* ================= LILY'S FLOWER SHOP (same night street) ================= */
function flowerMid() {
  const r = rng(201);
  let buckets = "", blooms = "";
  for (let i = 0; i < 9; i++) {
    const x = 560 + i * 110;
    buckets += `<path d="M${x} 870 L${x + 70} 870 L${x + 62} 930 L${x + 8} 930Z"/>`;
    for (let k = 0; k < 7; k++) blooms += `<circle cx="${(x + 10 + r() * 50).toFixed(0)}" cy="${(840 + r() * 30).toFixed(0)}" r="${(11 + r() * 5).toFixed(1)}" fill="${["#D9776B", C.cream, "#E6A9A0", "#EFC46A", "#B7A4D0"][(i + k) % 5]}"/>`;
  }
  const leaves = Array.from({ length: 10 }, (_, i) => `<ellipse cx="${800 + i * 76}" cy="${820 - (i % 3) * 20}" rx="26" ry="40"/>`).join("");
  const garland = Array.from({ length: 6 }, (_, i) => `<circle cx="${520 + i * 32}" cy="${(650 + Math.sin((i / 5) * Math.PI) * 30).toFixed(0)}" r="11" fill="${["#D9776B", C.cream, "#EFC46A"][i % 3]}"/>`).join("");
  return sprite(W, H, [
    // the shop: one sheet, the big window cut out (warm light inside)
    ply(`<g fill="${NIGHT.mid}"><rect x="0" y="930" width="${W}" height="${H - 930}"/>
        <path d="M430 940 L430 250 L400 250 L430 200 L1630 200 L1660 250 L1630 250 L1630 940Z"/>
        <rect x="1700" y="420" width="16" height="520"/><path d="M1680 420 L1736 420 L1726 360 L1690 360Z"/></g>
      <rect x="760" y="650" width="800" height="210" fill="#EFA65C"/>
      <rect x="500" y="640" width="200" height="290" fill="${NIGHT.front}"/><circle cx="680" cy="790" r="8" fill="${C.light}"/>
      <path d="M1690 362 L1726 362 L1734 418 L1682 418Z" fill="${C.lightHot}"/>`,
      { trans: 0.1, light: { x: 1160, y: 760, r: 700 }, lightCol: NIGHT.lamp, rim: 0.55, rimCol: NIGHT.rim }),
    // what you see through the window: leafy silhouettes, and the clock that shouldn't be there
    ply(`<g fill="#3E5A48">${leaves}</g>`, { rim: 0, under: 0, shadow: { dx: 2, dy: 4, blur: 6, a: 0.3 }, grain: 0.3 }),
    ply(`<rect x="752" y="642" width="816" height="226" fill="none" stroke="${NIGHT.front}" stroke-width="16"/>
      <path d="M1160 650 L1160 860" stroke="${NIGHT.front}" stroke-width="10"/>${clock(1460, 712, 34, C.cream, C.ink, NIGHT.front)}`,
      { rim: 0.4, rimCol: NIGHT.rim, shadow: { dx: 4, dy: 7, blur: 7, a: 0.45 } }),
    // sign, awning, garland: stuck-on paper
    ply(`<rect x="700" y="300" width="660" height="110" rx="10" fill="${C.cream}"/>${text(1030, 374, "LILY'S FLOWERS", 58, NIGHT.mid, { spacing: 7 })}
      <rect x="470" y="520" width="1120" height="80" fill="#C9806E"/>${scallops(470, 600, 16, 70, ["#C9806E", "#B06A5A"])}`,
      { trans: 0.15, light: { x: 1030, y: 420, r: 600 }, lightCol: NIGHT.lamp, rim: 0.45, rimCol: NIGHT.rim, shadow: { dx: 5, dy: 10, blur: 9, a: 0.45 } }),
    ply(`<path d="M500 640 Q600 690 700 640" stroke="#3E5A48" stroke-width="16" fill="none"/>${garland}`, { rim: 0.4, shadow: { dx: 3, dy: 6, blur: 5, a: 0.4 } }),
    ply(`<g fill="${NIGHT.front}">${buckets}</g>${blooms}`, { rim: 0.4, rimCol: NIGHT.rim, shadow: { dx: 4, dy: 7, blur: 6, a: 0.45 } }),
  ], { body: `<rect x="760" y="650" width="800" height="210" fill="${C.light}" opacity="0.35"/><path d="M1690 362 L1726 362 L1734 418 L1682 418Z" fill="${C.light}"/>`, passes: [[16, 0.4], [70, 0.4]] });
}

/* ================= MABEL'S CAFE (inside, warm) ================= */
const CAFE = LADDER.cafe;

function rainyWindow(x, y, w, h, seed, frame) {
  const r = rng(seed);
  let streaks = "", bokeh = "";
  for (let i = 0; i < 26; i++) { const sx = x + r() * w, sy = y + r() * h; streaks += `<line x1="${sx.toFixed(0)}" y1="${sy.toFixed(0)}" x2="${(sx - 6).toFixed(0)}" y2="${(sy + 20 + r() * 40).toFixed(0)}" stroke="#7E93B8" stroke-width="2" opacity="0.7"/>`; }
  for (let i = 0; i < 12; i++) bokeh += `<circle cx="${(x + r() * w).toFixed(0)}" cy="${(y + h * 0.35 + r() * h * 0.4).toFixed(0)}" r="${(5 + r() * 9).toFixed(1)}" fill="${C.light}" opacity="${(0.5 + r() * 0.4).toFixed(2)}"/>`;
  return {
    hole: `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#16203A"/>${bokeh}${streaks}`,
    frame: `<rect x="${x - 16}" y="${y - 16}" width="${w + 32}" height="${h + 32}" fill="none" stroke="${frame}" stroke-width="24"/>
      <rect x="${x + w / 2 - 6}" y="${y}" width="12" height="${h}" fill="${frame}"/><rect x="${x}" y="${y + h / 2 - 6}" width="${w}" height="12" fill="${frame}"/>`,
  };
}

function cafeFar() {
  let stripes = "";
  for (let x = 0; x < W; x += 60) stripes += `<rect x="${x}" y="0" width="30" height="760"/>`;
  let jars = "";
  for (let i = 0; i < 3; i++) for (let k = 0; k < 7; k++) jars += `<rect x="${1120 + k * 76}" y="${250 + i * 120}" width="${40 + (k % 2) * 10}" height="50" rx="8"/>`;
  return sprite(W, H, [
    ply(`<rect width="${W}" height="${H}" fill="${CAFE.back}"/><g fill="#E2B27A">${stripes}</g>`, { trans: 0.12, light: { x: 1024, y: 220, r: 900 }, lightCol: CAFE.lamp, rim: 0, under: 0, shadow: false, grain: 0.5, wobble: 0 }),
    ply(`<g fill="${CAFE.far}"><rect x="0" y="750" width="${W}" height="${H - 750}"/>${[0, 1, 2].map((i) => `<rect x="1100" y="${300 + i * 120}" width="560" height="14"/>`).join("")}${jars}</g>`,
      { trans: 0.25, light: { x: 1024, y: 220, r: 900 }, lightCol: CAFE.lamp, rim: 0.5, rimCol: CAFE.rim, shadow: { dx: 5, dy: 9, blur: 10, a: 0.35 } }),
    ply(`<line x1="1024" y1="0" x2="1024" y2="160" stroke="${CAFE.front}" stroke-width="4"/><path d="M968 160 L1080 160 L1062 200 L986 200Z" fill="${CAFE.mid}"/><ellipse cx="1024" cy="204" rx="34" ry="10" fill="${C.lightHot}"/>`,
      { rim: 0.4, rimCol: CAFE.rim, shadow: { dx: 4, dy: 8, blur: 8, a: 0.35 } }),
  ], { body: `<ellipse cx="1024" cy="206" rx="40" ry="14" fill="${CAFE.lamp}"/>`, passes: [[20, 0.7], [90, 0.5]] });
}
function cafeMid(version) {
  const b = version === "b";
  const win = b ? rainyWindow(1420, 300, 420, 400, 7, CAFE.mid) : rainyWindow(180, 300, 460, 400, 5, CAFE.mid);
  const cx = b ? 260 : 980;
  const table = (x) => `<ellipse cx="${x}" cy="800" rx="110" ry="22"/><rect x="${x - 10}" y="800" width="20" height="120"/><ellipse cx="${x}" cy="928" rx="60" ry="10"/>
    <rect x="${x - 190}" y="720" width="60" height="210" rx="10"/><rect x="${x + 130}" y="720" width="60" height="210" rx="10"/>`;
  const cups = (x) => `<rect x="${x - 30}" y="770" width="34" height="30" rx="6" fill="${C.cream}"/><path d="M${x + 4} 778 q12 0 12 10 q0 10 -12 10" stroke="${C.cream}" stroke-width="4" fill="none"/>`;
  return sprite(W, H, [
    ply(win.hole, { rim: 0, under: 0, shadow: false, grain: 0.3, wobble: 0 }),
    ply(`<g fill="${CAFE.mid}"><rect x="0" y="930" width="${W}" height="${H - 930}"/><rect x="${cx}" y="660" width="720" height="270" rx="8"/><rect x="${cx - 20}" y="640" width="760" height="30" rx="8"/>
        ${b ? table(1100) : table(560) + table(820)}</g>${win.frame}
      <rect x="${cx + 60}" y="540" width="150" height="100" rx="10" fill="#7E8C92"/><rect x="${cx + 90}" y="600" width="30" height="40" fill="#5A666C"/>`,
      { trans: 0.15, light: { x: 1024, y: 300, r: 900 }, lightCol: CAFE.lamp, rim: 0.5, rimCol: CAFE.rim }),
    ply(`<path d="M${cx + 420} 640 Q${cx + 480} 560 ${cx + 540} 640Z" fill="${C.cream}"/><rect x="${cx + 450}" y="610" width="60" height="30" rx="6" fill="#D9776B"/>
      ${b ? cups(1100) : cups(560) + cups(820)}
      ${b ? `${clock(1024, 230, 70, C.cream, C.ink, CAFE.front)}<rect x="560" y="300" width="160" height="200" fill="${C.creamShade}" stroke="${CAFE.front}" stroke-width="10"/><path d="M590 470 L640 380 L690 470Z" fill="${CAFE.mid}"/>` : ""}`,
      { rim: 0.4, rimCol: CAFE.rim, shadow: { dx: 4, dy: 7, blur: 7, a: 0.4 } }),
  ], { body: win.hole.replace(/#16203A/, "#000000") + "", passes: [[10, 0.25]] });
}
function cafeFloor() {
  const r = rng(215);
  let p = "";
  for (let row = 0; row < 12; row++) {
    const y = row * row * 3 + row * 12, h = 10 + row * 4;
    p += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#55301C" stroke-width="${1 + row * 0.3}" opacity="0.8"/>`;
    for (let x = (r() * 300) | 0; x < W; x += 300 + ((r() * 200) | 0)) p += `<line x1="${x}" y1="${y}" x2="${x}" y2="${y + h}" stroke="#55301C" stroke-width="2" opacity="0.7"/>`;
  }
  return sprite(W, GH, [ply(`<rect width="${W}" height="${GH}" fill="${CAFE.ground}"/>${p}`, { trans: 0.25, light: { x: 1024, y: 0, r: 700 }, lightCol: CAFE.lamp, rim: 0.5, rimCol: CAFE.rim, shadow: false, grain: 0.4, wobble: 0.5 }),
    frontLip(CAFE, 216, 215, "#55301C")]);
}
function cafeFg() {
  return sprite(W, H, [
    ply(`<g fill="${CAFE.front}"><rect x="-40" y="860" width="260" height="400" rx="30"/><rect x="-40" y="820" width="300" height="60" rx="20"/>
      <path d="M1880 1152 L1900 900 Q1960 820 2048 860 L2048 1152Z"/><ellipse cx="1950" cy="880" rx="90" ry="60"/><ellipse cx="1880" cy="860" rx="50" ry="70" transform="rotate(-20 1880 860)"/></g>`,
      { rim: 0.7, rimCol: CAFE.rim, rimPx: 5, shadow: false, blur: 4 }),
  ]);
}

/* ================= THE PARK (night, teal) ================= */
const PARK = LADDER.park;

function parkFar() {
  const r = rng(221);
  let back = "", front = "";
  for (let x = -60; x < W + 80; x += 80 + r() * 50) back += `<circle cx="${x.toFixed(0)}" cy="${(600 + r() * 60).toFixed(0)}" r="${(70 + r() * 50).toFixed(0)}"/>`;
  for (let x = -60; x < W + 80; x += 90 + r() * 60) front += `<circle cx="${x.toFixed(0)}" cy="${(680 + r() * 60).toFixed(0)}" r="${(80 + r() * 50).toFixed(0)}"/>`;
  return sprite(W, H, [
    skyPanel(W, H, PARK.sky0, PARK.sky1, 405, { stars: 80, extra: `<circle cx="1560" cy="250" r="70" fill="#F6EED8"/>` }),
    ply(`<g fill="${PARK.back}">${back}<rect x="0" y="620" width="${W}" height="${H - 620}"/></g>`, { trans: 0.45, light: { x: 1560, y: 300, r: 900 }, lightCol: "#F6EED8", rim: 0.5, rimCol: "#F6EED8", shadow: { dx: 5, dy: 9, blur: 14, a: 0.4 } }),
    ply(`<g fill="${PARK.far}">${front}<rect x="0" y="720" width="${W}" height="${H - 720}"/></g>`, { trans: 0.25, light: { x: 1560, y: 300, r: 900 }, lightCol: "#F6EED8", rim: 0.45, rimCol: "#F6EED8", shadow: { dx: 6, dy: 12, blur: 16, a: 0.45 } }),
  ], { body: `<circle cx="1560" cy="250" r="70" fill="#F6EED8"/>`, passes: [[30, 0.5], [120, 0.35]] });
}
function parkMid() {
  const tree = (x, s) => `<rect x="${x - 26 * s}" y="${930 - 420 * s}" width="${52 * s}" height="${420 * s}"/>
    <circle cx="${x}" cy="${930 - 470 * s}" r="${190 * s}"/><circle cx="${x - 120 * s}" cy="${930 - 400 * s}" r="${130 * s}"/><circle cx="${x + 130 * s}" cy="${930 - 410 * s}" r="${140 * s}"/>`;
  return sprite(W, H, [
    ply(`<g fill="${PARK.mid}"><rect x="0" y="930" width="${W}" height="${H - 930}"/>${tree(260, 1.1)}${tree(1830, 1.0)}
      <rect x="620" y="830" width="360" height="22" rx="6"/><rect x="620" y="780" width="360" height="18" rx="6"/><rect x="640" y="850" width="14" height="80"/><rect x="946" y="850" width="14" height="80"/>
      <rect x="1150" y="600" width="16" height="330"/><path d="M1128 600 L1188 600 L1178 540 L1138 540Z"/>
      <rect x="1370" y="690" width="16" height="240"/><rect x="1614" y="690" width="16" height="240"/><rect x="1350" y="600" width="300" height="220" rx="6"/></g>
      <path d="M1138 544 L1178 544 L1184 596 L1132 596Z" fill="${C.lightHot}"/><ellipse cx="1060" cy="925" rx="200" ry="16" fill="#0E2226"/>`,
      { trans: 0.15, light: { x: 1158, y: 570, r: 700 }, lightCol: PARK.lamp, rim: 0.5, rimCol: PARK.rim }),
    // the notice for an event that has already ended
    ply(`<rect x="1380" y="624" width="240" height="172" fill="${C.cream}"/>
      ${text(1500, 666, "BELL CHOIR", 30, PARK.mid, { spacing: 2 })}${text(1500, 700, "9:00 PM", 24, C.ink, { spacing: 1 })}${text(1500, 738, "THANK YOU FOR COMING!", 16, C.ink, { spacing: 1 })}
      <rect x="1420" y="752" width="160" height="34" rx="4" fill="none" stroke="#B24A3A" stroke-width="4" transform="rotate(-8 1500 769)"/>${text(1500, 777, "ENDED", 24, "#B24A3A", { rotate: -8, spacing: 3 })}`,
      { rim: 0.4, rimCol: PARK.rim, shadow: { dx: 4, dy: 7, blur: 6, a: 0.45 } }),
  ], { body: `<path d="M1138 544 L1178 544 L1184 596 L1132 596Z" fill="${C.light}"/>`, passes: [[20, 0.7], [80, 0.5]] });
}
function parkGround() {
  const r = rng(227);
  let tufts = "";
  for (let i = 0; i < 160; i++) { const x = r() * W, y = r() * GH; tufts += `<path d="M${x.toFixed(0)} ${y.toFixed(0)} l4 -${(10 + r() * 10).toFixed(0)} l4 ${(8 + r() * 6).toFixed(0)}" stroke="#2C5450" stroke-width="2" fill="none"/>`; }
  return sprite(W, GH, [
    ply(`<rect width="${W}" height="${GH}" fill="${PARK.ground}"/>${tufts}`, { trans: 0.15, light: { x: 1100, y: 0, r: 600 }, lightCol: PARK.lamp, rim: 0.5, rimCol: PARK.rim, shadow: false, grain: 0.4, wobble: 0.6 }),
    ply(`<path d="M0 110 Q1024 60 2048 130 L2048 200 Q1024 150 0 210Z" fill="#2E4A44"/>`, { trans: 0.15, light: { x: 1100, y: 100, r: 500 }, lightCol: PARK.lamp, rim: 0.4, rimCol: PARK.rim, shadow: { dx: 0, dy: 6, blur: 10, a: 0.35 }, grain: 0.4 }),
    frontLip(PARK, 228, 225, "#132E2C"),
  ]);
}
function parkFg() {
  return sprite(W, H, [
    ply(`<g fill="${PARK.front}"><path d="M-40 -20 Q300 120 520 40 Q380 200 -40 220Z"/><path d="M2088 -20 Q1760 140 1520 60 Q1700 240 2088 260Z"/><ellipse cx="120" cy="1150" rx="260" ry="160"/></g>`,
      { rim: 0.7, rimCol: PARK.rim, rimPx: 5, shadow: false, blur: 4 }),
  ]);
}

/* ================= THE TOWN GATE + PUMP HOUSE (slate, one red alarm) ================= */
const SLATE = LADDER.slate;

function gateFar() {
  return sprite(W, H, [
    skyPanel(W, H, SLATE.sky0, SLATE.sky1, 409, { stars: 60 }),
    ply(`<g fill="#1A2840">${cloud(500, 260, 1.2)}${cloud(1500, 200, 1.5)}</g>`, { trans: 0.3, light: { x: 1024, y: 400, r: 900 }, lightCol: "#8EA2BA", rim: 0.25, rimCol: "#C8D4E2", shadow: { dx: 4, dy: 8, blur: 14, a: 0.35 } }),
    ply(`<path d="M0 720 Q400 600 900 690 T2048 660 L2048 ${H} L0 ${H}Z" fill="#4E6382"/>`, { trans: 0.3, light: { x: 1024, y: 500, r: 1000 }, lightCol: SLATE.lamp, rim: 0.45, rimCol: SLATE.rim, shadow: { dx: 5, dy: 10, blur: 14, a: 0.4 } }),
    ply(`<path d="M0 800 Q600 720 1200 790 T2048 770 L2048 ${H} L0 ${H}Z" fill="#344660"/>`, { trans: 0.15, light: { x: 1024, y: 500, r: 1000 }, lightCol: SLATE.lamp, rim: 0.45, rimCol: SLATE.rim, shadow: { dx: 6, dy: 12, blur: 16, a: 0.45 } }),
  ]);
}
function gateMid() {
  let stones = "";
  for (let y = 526; y < 930; y += 46) stones += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#2C3A50" stroke-width="4"/>`;
  for (let y = 526, k = 0; y < 930; y += 46, k++) for (let x = k % 2 ? 0 : 60; x < W; x += 120) stones += `<line x1="${x}" y1="${y}" x2="${x}" y2="${y + 46}" stroke="#2C3A50" stroke-width="4"/>`;
  return sprite(W, H, [
    // the town wall with its arch: one sheet
    ply(`<clipPath id="wall"><path d="M0 520 L700 520 L700 930 L0 930Z M1350 520 L2048 520 L2048 930 L1350 930Z"/></clipPath>
      <g fill="${SLATE.mid}"><rect x="0" y="930" width="${W}" height="${H - 930}"/><rect x="0" y="520" width="${W}" height="410" clip-path="url(#wall)"/>
        <path d="M700 930 L700 420 Q1024 200 1350 420 L1350 930 L1250 930 L1250 480 Q1024 320 800 480 L800 930Z"/>
        <rect x="420" y="460" width="16" height="470"/><path d="M398 460 L458 460 L448 400 L408 400Z"/></g>
      <g clip-path="url(#wall)">${stones}</g><path d="M408 404 L448 404 L454 456 L402 456Z" fill="${C.lightHot}"/>`,
      { trans: 0.12, light: { x: 1024, y: 400, r: 1000 }, lightCol: SLATE.lamp, rim: 0.5, rimCol: SLATE.rim }),
    ply(`<rect x="840" y="300" width="370" height="70" rx="8" fill="${C.cream}"/>${text(1025, 350, "BELLFLOWER", 44, SLATE.mid, { spacing: 9 })}`,
      { rim: 0.4, rimCol: SLATE.rim, shadow: { dx: 4, dy: 8, blur: 8, a: 0.45 } }),
    // the pump house, in front of the wall
    ply(`<g fill="#2C394E"><rect x="1460" y="600" width="440" height="330"/><path d="M1440 610 L1680 500 L1920 610Z"/></g>
      <rect x="1520" y="700" width="110" height="230" fill="${SLATE.front}"/><circle cx="1612" cy="820" r="6" fill="${C.light}"/>
      <rect x="1700" y="680" width="120" height="80" fill="#E9A85C"/><path d="M1460 900 L1380 900 L1380 940" stroke="${SLATE.front}" stroke-width="20" fill="none"/>
      <circle cx="1880" cy="640" r="14" fill="#E0503A"/>`,
      { trans: 0.1, light: { x: 1760, y: 720, r: 500 }, lightCol: SLATE.lamp, rim: 0.5, rimCol: SLATE.rim, shadow: { dx: 6, dy: 10, blur: 10, a: 0.5 } }),
    ply(`<rect x="1690" y="790" width="150" height="40" rx="4" fill="${C.cream}"/>${text(1765, 817, "PUMP STN. 2", 20, C.ink, { spacing: 1 })}
      <g transform="rotate(-3 1765 880)"><rect x="1700" y="850" width="130" height="60" fill="${C.cream}"/>${text(1765, 875, "REPAIR:", 16, C.ink, { spacing: 1 })}${text(1765, 896, "AFTER FESTIVAL", 14, "#B24A3A", { spacing: 0.5 })}</g>`,
      { rim: 0.4, rimCol: SLATE.rim, shadow: { dx: 3, dy: 6, blur: 5, a: 0.45 } }),
  ], { body: `<path d="M408 404 L448 404 L454 456 L402 456Z" fill="${C.light}"/><rect x="1700" y="680" width="120" height="80" fill="${C.light}" opacity="0.6"/><circle cx="1880" cy="640" r="16" fill="#FF4A30"/>`, passes: [[14, 0.6], [60, 0.45]] });
}
function roadGround() {
  return sprite(W, GH, [ply(`<rect width="${W}" height="${GH}" fill="${SLATE.ground}"/>${cobbleGrooves(247, "#202C40")}`, { trans: 0.15, light: { x: 600, y: 0, r: 600 }, lightCol: SLATE.lamp, rim: 0.5, rimCol: SLATE.rim, shadow: false, grain: 0.35, wobble: 0.6 }),
    frontLip(SLATE, 248, 215, "#1A2536")]);
}
function gateFg() {
  let posts = "";
  for (let x = 0; x < W; x += 260) posts += `<rect x="${x}" y="960" width="40" height="220" rx="6"/>`;
  return sprite(W, H, [ply(`<g fill="${SLATE.front}">${posts}<rect x="0" y="1000" width="${W}" height="22"/></g>`, { rim: 0.7, rimCol: SLATE.rim, rimPx: 5, shadow: false, blur: 4 })]);
}

/* ================= UNDER THE SQUARE (cold green-black, one warm hatch) ================= */
const PASS = LADDER.passage;

function passageFar() {
  // the tunnel recedes as a stack of arches, lighter towards the back
  const ladder = ["#5E8078", "#4E6E66", "#405E57", "#344F49", "#29413C", "#203530", "#182A26", "#121F1C"];
  const plies = [ply(`<rect width="${W}" height="${H}" fill="#4F6F68"/>`, { trans: 0.45, light: { x: 1024, y: 720, r: 260 }, lightCol: PASS.lamp, rim: 0, under: 0, shadow: false, grain: 0.5, wobble: 0 })];
  for (let i = 0; i < 8; i++) { // smallest opening (furthest, lightest) first
    const s = 0.23 + i * 0.11, iw = 700 * s, ih = 500 * s;
    const hole = `M${1024 - iw} 930 L${1024 - iw} ${930 - ih} Q1024 ${930 - 900 * s} ${1024 + iw} ${930 - ih} L${1024 + iw} 930Z`;
    plies.push(ply(`<path d="M0 0 L${W} 0 L${W} ${H} L0 ${H}Z ${hole}" fill="${ladder[i]}" fill-rule="evenodd"/>`,
      { trans: 0.3, light: { x: 1024, y: 720, r: 500 }, lightCol: PASS.lamp, rim: 0.3, rimCol: PASS.rim, shadow: { dx: 0, dy: 8, blur: 14, a: 0.45 }, grain: 0.4 }));
  }
  return sprite(W, H, plies, { body: `<ellipse cx="1024" cy="800" rx="70" ry="50" fill="#9FC4B8"/>`, passes: [[40, 0.35]] });
}
function passageMid() {
  let bricks = "";
  for (let y = 120; y < 930; y += 40) bricks += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#18261F" stroke-width="5"/>`;
  for (let y = 120, k = 0; y < 930; y += 40, k++) for (let x = k % 2 ? 0 : 50; x < W; x += 100) bricks += `<line x1="${x}" y1="${y}" x2="${x}" y2="${y + 40}" stroke="#18261F" stroke-width="5"/>`;
  const crate = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#7A5A42"/><path d="M${x} ${y} L${x + w} ${y + h} M${x + w} ${y} L${x} ${y + h}" stroke="#4E3828" stroke-width="7"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="#4E3828" stroke-width="9"/>`;
  const bulb = (x) => `<rect x="${x - 3}" y="300" width="6" height="40" fill="${PASS.front}"/><circle cx="${x}" cy="352" r="14" fill="${PASS.lamp}"/>`;
  return sprite(W, H, [
    // brick walls either side, cut open in the middle where the tunnel goes on
    ply(`<path d="M0 100 L${W} 100 L${W} ${H} L0 ${H}Z M640 930 L640 470 Q1024 260 1408 470 L1408 930Z" fill="${PASS.mid}" fill-rule="evenodd"/>
      <clipPath id="bw"><path d="M0 100 L${W} 100 L${W} 930 L0 930Z M640 930 L640 470 Q1024 260 1408 470 L1408 930Z" clip-rule="evenodd"/></clipPath><g clip-path="url(#bw)">${bricks}</g>
      <rect x="0" y="930" width="${W}" height="${H - 930}" fill="#10201C"/>
      <rect x="0" y="210" width="640" height="26" fill="#2E423C"/><rect x="1408" y="210" width="640" height="26" fill="#2E423C"/>`,
      { trans: 0.15, light: { x: 1625, y: 470, r: 600 }, lightCol: C.light, rim: 0.45, rimCol: PASS.rim }),
    // the cafe-side hatch: the only warm light down here
    ply(`<rect x="1500" y="420" width="250" height="110" fill="${C.light}"/><rect x="1500" y="420" width="250" height="110" fill="none" stroke="${PASS.front}" stroke-width="12"/>
      ${bulb(420)}<rect x="1840" y="300" width="20" height="630" fill="#2E423C"/>${Array.from({ length: 8 }, (_, i) => `<rect x="1810" y="${360 + i * 70}" width="80" height="10" fill="#2E423C"/>`).join("")}`,
      { rim: 0.35, rimCol: PASS.rim, shadow: { dx: 4, dy: 8, blur: 8, a: 0.5 } }),
    ply(`${crate(1440, 560, 180, 180)}${crate(1630, 600, 170, 140)}${crate(1480, 740, 200, 190)}${crate(1690, 740, 180, 190)}${text(1580, 846, "FESTIVAL", 30, "#2A1C12", { spacing: 2 })}`,
      { trans: 0.15, light: { x: 1625, y: 470, r: 400 }, lightCol: C.light, rim: 0.5, rimCol: C.lightHot, shadow: { dx: 5, dy: 9, blur: 8, a: 0.55 } }),
    ply(`${bulb(1100)}`, { rim: 0.3, shadow: { dx: 3, dy: 6, blur: 5, a: 0.4 } }),
  ], { body: `<rect x="1500" y="420" width="250" height="110" fill="${C.light}"/><circle cx="420" cy="352" r="16" fill="${PASS.lamp}"/><circle cx="1100" cy="352" r="16" fill="${PASS.lamp}"/>`, passes: [[18, 0.6], [90, 0.45]] });
}
function waterGround() {
  const r = rng(257);
  let w = "";
  for (let i = 0; i < 80; i++) {
    const y = r() * GH, x = r() * W, len = 30 + r() * 120;
    w += `<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${len.toFixed(0)}" height="${(2 + r() * 3).toFixed(1)}" rx="2" fill="${i % 6 ? "#3E6A64" : "#BFD8CC"}" opacity="${(0.4 + r() * 0.5).toFixed(2)}"/>`;
  }
  return sprite(W, GH, [ply(`<rect width="${W}" height="${GH}" fill="${PASS.ground}"/>${w}${reflections(258, 1625, 20, 160, 9, C.light, 160)}`,
    { trans: 0.2, light: { x: 1024, y: 0, r: 700 }, lightCol: PASS.lamp, rim: 0.5, rimCol: PASS.rim, shadow: false, grain: 0.35, wobble: 2.5 })],
    { body: reflections(258, 1625, 20, 160, 9, C.light, 160), passes: [[8, 0.5]] });
}
function passageFg() {
  return sprite(W, H, [ply(`<g fill="${PASS.front}"><rect x="-20" y="0" width="${W + 40}" height="70"/><rect x="300" y="60" width="18" height="260"/><rect x="1700" y="60" width="18" height="180"/>
    <path d="M-40 1152 L-40 900 Q200 860 360 1152Z"/></g>`, { rim: 0.6, rimCol: PASS.rim, rimPx: 5, shadow: false, blur: 4 })]);
}

/* ================= A BRIGHT ROOM (seen from the bed) ================= */
const HOSP = LADDER.hospital;

function hospitalFar() {
  const win = rainyWindow(1300, 220, 420, 360, 9, "#8FA8A4");
  return sprite(W, H, [
    ply(`<rect width="${W}" height="${H}" fill="${HOSP.back}"/><rect x="0" y="760" width="${W}" height="${H - 760}" fill="${HOSP.far}"/>`, { trans: 0.15, light: { x: 380, y: 160, r: 1200 }, lightCol: HOSP.lamp, rim: 0, under: 0, shadow: false, grain: 0.4, wobble: 0 }),
    ply(win.hole, { rim: 0, under: 0, shadow: false, grain: 0.3, wobble: 0 }),
    ply(`${win.frame}<rect x="200" y="140" width="360" height="40" rx="20" fill="#FFFFFF"/>`, { rim: 0.5, rimCol: HOSP.rim, shadow: { dx: 4, dy: 8, blur: 10, a: 0.25 } }),
  ], { body: `<rect x="200" y="140" width="360" height="40" rx="20" fill="#FFFFFF"/>`, passes: [[20, 0.7], [90, 0.6]] });
}
function hospitalMid() {
  return sprite(W, H, [
    ply(`<g fill="${HOSP.mid}"><rect x="0" y="930" width="${W}" height="${H - 930}"/>
      <rect x="470" y="380" width="10" height="550"/><rect x="430" y="380" width="90" height="8"/>
      <rect x="770" y="500" width="180" height="26" rx="10"/><rect x="770" y="520" width="16" height="140"/><rect x="934" y="520" width="16" height="140"/>
      <rect x="760" y="640" width="200" height="24" rx="8"/><rect x="776" y="664" width="12" height="266"/><rect x="932" y="664" width="12" height="266"/>
      <rect x="1120" y="700" width="220" height="20" rx="6"/><rect x="1140" y="720" width="12" height="210"/><rect x="1308" y="720" width="12" height="210"/>
      <rect x="1600" y="520" width="16" height="410"/></g>
      <path d="M450 388 L450 470 Q475 500 500 470 L500 388Z" fill="${HOSP.back}"/>`,
      { trans: 0.1, light: { x: 380, y: 160, r: 1400 }, lightCol: HOSP.lamp, rim: 0.4, rimCol: HOSP.rim, shadow: { dx: 5, dy: 10, blur: 12, a: 0.22 } }),
    // a jar of small yellow flowers (Nini's colour)
    ply(`<rect x="1190" y="640" width="44" height="60" rx="8" fill="${C.white}"/>
      <path d="M1212 640 Q1196 590 1180 570 M1212 640 Q1214 586 1224 560 M1212 640 Q1236 600 1252 584" stroke="${C.greenShade}" stroke-width="5" fill="none"/>
      <circle cx="1180" cy="566" r="13" fill="${C.yellow}"/><circle cx="1224" cy="556" r="13" fill="${C.yellow}"/><circle cx="1254" cy="580" r="12" fill="${C.yellow}"/>`,
      { rim: 0.4, rimCol: HOSP.rim, shadow: { dx: 3, dy: 6, blur: 6, a: 0.25 } }),
    ply(`<rect x="1540" y="420" width="240" height="170" rx="12" fill="#2A3436"/><rect x="1556" y="436" width="208" height="120" fill="#0F1A16"/>
      <path d="M1560 500 L1610 500 L1624 470 L1640 530 L1656 500 L1760 500" stroke="#7BD08F" stroke-width="4" fill="none"/>${text(1740, 582, "1:17", 20, "#7BD08F", { anchor: "end", spacing: 1 })}`,
      { rim: 0.4, rimCol: HOSP.rim, shadow: { dx: 5, dy: 10, blur: 10, a: 0.3 } }),
  ], { body: `<path d="M1560 500 L1610 500 L1624 470 L1640 530 L1656 500 L1760 500" stroke="#7BD08F" stroke-width="5" fill="none"/>`, passes: [[6, 0.6]] });
}
function hospitalFloor() {
  let tiles = "";
  for (let row = 0; row < 12; row++) tiles += `<line x1="0" y1="${row * row * 3 + row * 14}" x2="${W}" y2="${row * row * 3 + row * 14}" stroke="#86A09B" stroke-width="2"/>`;
  return sprite(W, GH, [ply(`<rect width="${W}" height="${GH}" fill="${HOSP.ground}"/>${tiles}`, { trans: 0.1, lightCol: HOSP.lamp, rim: 0.5, rimCol: HOSP.rim, shadow: false, grain: 0.35, wobble: 0.4 })]);
}
function hospitalFg() {
  return sprite(W, H, [
    ply(`<path d="M-20 -20 L220 -20 Q160 400 240 1180 L-20 1180Z" fill="#9FC0C4"/>`, { trans: 0.3, light: { x: 100, y: 300, r: 600 }, lightCol: HOSP.lamp, rim: 0.4, shadow: { dx: 8, dy: 0, blur: 16, a: 0.25 }, blur: 3 }),
    // the foot of the bed, seen from the pillow: white blanket and the rail
    ply(`<path d="M-20 1180 L-20 860 Q500 790 1024 812 Q1560 790 2068 850 L2068 1180Z" fill="#EEF3F1"/>
      <path d="M300 840 Q700 900 1000 830 M1150 835 Q1500 900 1800 850" stroke="#D3DDDA" stroke-width="10" fill="none"/>`, { rim: 0.6, rimCol: "#FFFFFF", shadow: { dx: 0, dy: -8, blur: 18, a: 0.25 }, blur: 3 }),
    ply(`<g fill="#8C9A9E"><rect x="160" y="760" width="1728" height="18" rx="9"/><rect x="200" y="760" width="14" height="80"/><rect x="1834" y="760" width="14" height="80"/></g>`, { rim: 0.5, shadow: { dx: 4, dy: 10, blur: 12, a: 0.3 }, blur: 2.5 }),
  ]);
}

/* ================= YEARS LATER: THE ATTIC (daylight) ================= */
const ATTIC = LADDER.attic;

function atticFar() {
  let boards = "";
  for (let x = 0; x < W; x += 110) boards += `<line x1="${x}" y1="0" x2="${x}" y2="880" stroke="#C99E6C" stroke-width="5"/>`;
  return sprite(W, H, [
    ply(`<rect width="${W}" height="${H}" fill="${ATTIC.back}"/>${boards}<rect x="0" y="880" width="${W}" height="${H - 880}" fill="${ATTIC.far}"/>`,
      { trans: 0.2, light: { x: 1024, y: 420, r: 800 }, lightCol: ATTIC.lamp, rim: 0, under: 0, shadow: false, grain: 0.5, wobble: 0 }),
    // the round window: sky, and the sun coming through
    ply(`<circle cx="1024" cy="420" r="190" fill="#BFD8E6"/><ellipse cx="980" cy="470" rx="140" ry="36" fill="#F3EBDD"/><ellipse cx="1090" cy="380" rx="90" ry="24" fill="#F3EBDD"/>`,
      { rim: 0, under: 0, shadow: false, grain: 0.3, wobble: 0 }),
    ply(`<path d="M0 0 L${W} 0 L${W} ${H} L0 ${H}Z M1024 230 A190 190 0 1 0 1024.1 230Z" fill="none"/>
      <circle cx="1024" cy="420" r="200" fill="none" stroke="#7A5A40" stroke-width="22"/><path d="M1024 230 L1024 610 M834 420 L1214 420" stroke="#7A5A40" stroke-width="14"/>`,
      { rim: 0.5, rimCol: ATTIC.rim, shadow: { dx: 5, dy: 10, blur: 10, a: 0.35 } }),
  ], { body: `<circle cx="1024" cy="420" r="190" fill="#FFF2D6"/>`, passes: [[40, 0.45], [140, 0.35]] });
}
function atticMid() {
  const books = Array.from({ length: 9 }, (_, i) => `<rect x="${220 + i * 44}" y="${470 - (i % 3) * 10}" width="34" height="${130 + (i % 3) * 10}" fill="${["#8C6A52", "#C98B7E", C.gold, C.cream][i % 4]}"/>`).join("");
  return sprite(W, H, [
    ply(`<g fill="${ATTIC.mid}"><rect x="0" y="930" width="${W}" height="${H - 930}"/><rect x="200" y="420" width="420" height="16"/><rect x="200" y="600" width="420" height="16"/>
      <rect x="1240" y="800" width="460" height="24" rx="6"/><rect x="1270" y="824" width="18" height="106"/><rect x="1652" y="824" width="18" height="106"/></g>`,
      { trans: 0.15, light: { x: 1024, y: 420, r: 1000 }, lightCol: ATTIC.lamp, rim: 0.5, rimCol: ATTIC.rim }),
    ply(`${books}<rect x="300" y="520" width="140" height="80" fill="${C.creamShade}" stroke="${ATTIC.mid}" stroke-width="8"/>
      ${Array.from({ length: 6 }, (_, i) => `<circle cx="${318 + i * 21}" cy="545" r="5" fill="${C.gold}"/>`).join("")}`, { rim: 0.4, rimCol: ATTIC.rim, shadow: { dx: 4, dy: 7, blur: 6, a: 0.35 } }),
    // the small box
    ply(`<rect x="1400" y="740" width="150" height="62" rx="6" fill="#C98B7E"/><path d="M1400 740 L1430 690 L1580 690 L1550 740Z" fill="#D9A396"/>`,
      { trans: 0.15, light: { x: 1475, y: 700, r: 300 }, lightCol: ATTIC.lamp, rim: 0.5, rimCol: ATTIC.rim, shadow: { dx: 5, dy: 8, blur: 7, a: 0.4 } }),
  ]);
}
function atticFloor() {
  const r = rng(285);
  let p = "";
  for (let row = 0; row < 12; row++) {
    const y = row * row * 3 + row * 12, h = 10 + row * 4;
    p += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#5E4028" stroke-width="${1 + row * 0.3}" opacity="0.8"/>`;
    for (let x = (r() * 300) | 0; x < W; x += 300 + ((r() * 200) | 0)) p += `<line x1="${x}" y1="${y}" x2="${x}" y2="${y + h}" stroke="#5E4028" stroke-width="2" opacity="0.7"/>`;
  }
  return sprite(W, GH, [ply(`<rect width="${W}" height="${GH}" fill="${ATTIC.ground}"/>${p}<path d="M760 0 L1300 0 L1500 300 L560 300Z" fill="#F7E4BE" opacity="0.25"/>`,
    { trans: 0.15, light: { x: 1024, y: 0, r: 600 }, lightCol: ATTIC.lamp, rim: 0.5, rimCol: ATTIC.rim, shadow: false, grain: 0.4, wobble: 0.5 }), frontLip(ATTIC, 286, 225, "#5E4028")]);
}
function atticFg() {
  return sprite(W, H, [ply(`<g fill="${ATTIC.front}"><path d="M-20 -20 L700 -20 L-20 300Z"/><path d="M2068 -20 L1400 -20 L2068 280Z"/></g>`, { rim: 0.6, rimCol: ATTIC.rim, rimPx: 5, shadow: { dx: 6, dy: 12, blur: 16, a: 0.35 }, blur: 3 })]);
}

module.exports = {
  sprites: {
    layer_far: squareFar, layer_mid: squareMid, layer_ground: squareGround, layer_ground_wet: squareWet, layer_fg: squareFg,
    flower_mid: flowerMid,
    cafe_far: cafeFar, cafe_mid_a: () => cafeMid("a"), cafe_mid_b: () => cafeMid("b"), cafe_floor: cafeFloor, cafe_fg: cafeFg,
    park_far: parkFar, park_mid: parkMid, park_ground: parkGround, park_fg: parkFg,
    gate_far: gateFar, gate_mid: gateMid, road_ground: roadGround, gate_fg: gateFg,
    passage_far: passageFar, passage_mid: passageMid, passage_water: waterGround, passage_fg: passageFg,
    hospital_far: hospitalFar, hospital_mid: hospitalMid, hospital_floor: hospitalFloor, hospital_fg: hospitalFg,
    attic_far: atticFar, attic_mid: atticMid, attic_floor: atticFloor, attic_fg: atticFg,
  },
  helpers: { houses, cobbleGrooves, reflections },
};
