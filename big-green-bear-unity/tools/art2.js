/*
 * art2.js — the rest of the cast and every location of the full game.
 * Same storybook style as art.js (flat shapes, hand wobble, paper grain).
 *
 * Characters: 500 x 720 canvas, feet at the bottom centre.
 * Location layers: 2048 x 1152 (far / mid / fg) and 2048 x 560 (ground).
 * The floor line of every mid layer is row 930, like the square.
 */
const { helpers } = require("./art.js");
const { P, svg, rng } = helpers;

/* ======================= CAST ======================= */

function eyes(kind, y, gap, col = P.ink) {
  const l = 250 - gap, r = 250 + gap;
  if (kind === "sad")
    return `<circle cx="${l}" cy="${y + 4}" r="8" fill="${col}"/><circle cx="${r}" cy="${y + 4}" r="8" fill="${col}"/>
      <path d="M${l - 16} ${y - 8} L${l + 12} ${y - 19}" stroke="${col}" stroke-width="5" stroke-linecap="round"/>
      <path d="M${r + 16} ${y - 8} L${r - 12} ${y - 19}" stroke="${col}" stroke-width="5" stroke-linecap="round"/>`;
  if (kind === "closed")
    return `<path d="M${l - 10} ${y} L${l + 10} ${y}" stroke="${col}" stroke-width="5" stroke-linecap="round"/><path d="M${r - 10} ${y} L${r + 10} ${y}" stroke="${col}" stroke-width="5" stroke-linecap="round"/>`;
  return `<circle cx="${l}" cy="${y}" r="9" fill="${col}"/><circle cx="${r}" cy="${y}" r="9" fill="${col}"/>
    <circle cx="${l + 3}" cy="${y - 3}" r="2.6" fill="#fff" opacity="0.8"/><circle cx="${r + 3}" cy="${y - 3}" r="2.6" fill="#fff" opacity="0.8"/>`;
}
function mouth(kind, y) {
  if (kind === "sad") return `<path d="M236 ${y + 6} Q250 ${y - 4} 264 ${y + 6}" stroke="${P.ink}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  if (kind === "smile") return `<path d="M236 ${y} Q250 ${y + 12} 264 ${y}" stroke="${P.ink}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  return `<path d="M240 ${y + 2} L260 ${y + 2}" stroke="${P.ink}" stroke-width="4" stroke-linecap="round"/>`;
}
const shadow = `<ellipse cx="250" cy="708" rx="150" ry="12" fill="#000" opacity="0.28" filter="url(#soft)"/>`;

// A coat-shaped body most of the cast shares.
function body(coat, shade, opts = {}) {
  const top = opts.top || 360, w = opts.w || 120;
  return `
    <rect x="${250 - 70}" y="660" width="54" height="44" rx="16" fill="${opts.shoes || P.brownDeep}"/>
    <rect x="${250 + 16}" y="660" width="54" height="44" rx="16" fill="${opts.shoes || P.brownDeep}"/>
    <path d="M${250 - w + 30} ${top} Q250 ${top - 30} ${250 + w - 30} ${top} L${250 + w} 676 Q250 700 ${250 - w} 676Z" fill="${coat}"/>
    <path d="M${250 - w + 10} 640 Q250 690 ${250 + w - 10} 640 L${250 + w} 676 Q250 700 ${250 - w} 676Z" fill="${shade}" opacity="0.6"/>
    <ellipse cx="${250 - w + 8}" cy="${top + 120}" rx="30" ry="${opts.armLen || 100}" transform="rotate(12 ${250 - w + 8} ${top + 120})" fill="${shade}"/>
    <ellipse cx="${250 + w - 8}" cy="${top + 120}" rx="30" ry="${opts.armLen || 100}" transform="rotate(-12 ${250 + w - 8} ${top + 120})" fill="${shade}"/>`;
}

function lily(expr) {
  let quills = "";
  for (let i = 0; i < 13; i++) {
    const a = (-170 + i * 13) * Math.PI / 180;
    const x = 250 + Math.cos(a) * 118, y = 230 + Math.sin(a) * 118;
    const x2 = 250 + Math.cos(a) * 168, y2 = 230 + Math.sin(a) * 168;
    const px = -Math.sin(a) * 22, py = Math.cos(a) * 22;
    quills += `<path d="M${x - px} ${y - py} L${x2} ${y2} L${x + px} ${y + py}Z" fill="${i % 2 ? "#6B4E3B" : "#80614A"}"/>`;
  }
  return svg(500, 720, 101, `${shadow}
    ${body("#C98B7E", "#A86F64", { shoes: "#5E4A3C" })}
    <path d="M190 400 L310 400 L330 650 L170 650Z" fill="${P.green}"/>
    <path d="M200 430 L300 430" stroke="${P.cream}" stroke-width="3" opacity="0.7"/>
    ${quills}
    <circle cx="250" cy="240" r="112" fill="#E8D6BE"/>
    <ellipse cx="250" cy="282" rx="52" ry="40" fill="#F3E7D6"/>
    <circle cx="250" cy="262" r="11" fill="${P.ink}"/>
    ${eyes(expr === "sad" ? "sad" : "open", 222, 42)}
    ${mouth(expr === "sad" ? "sad" : "smile", 296)}
    <ellipse cx="190" cy="270" rx="16" ry="9" fill="${P.rose}" opacity="0.5"/><ellipse cx="310" cy="270" rx="16" ry="9" fill="${P.rose}" opacity="0.5"/>
    <circle cx="330" cy="160" r="16" fill="#D9776B"/><circle cx="346" cy="172" r="12" fill="${P.goldLight}"/>`);
}

function finch(expr) {
  return svg(500, 720, 103, `${shadow}
    ${body("#2F3B4C", "#253040", { w: 140, top: 330, shoes: "#C99F3D" })}
    <path d="M200 360 L250 420 L300 360" stroke="${P.cream}" stroke-width="10" fill="none"/>
    <rect x="300" y="460" width="70" height="92" rx="6" fill="${P.creamShade}"/><rect x="318" y="452" width="34" height="14" rx="4" fill="${P.brownDeep}"/>
    <path d="M314 490 L356 490 M314 510 L350 510 M314 530 L344 530" stroke="${P.brown}" stroke-width="3"/>
    <circle cx="250" cy="240" r="118" fill="#B8846A"/>
    <path d="M150 260 Q250 380 350 260 Q330 340 250 352 Q170 340 150 260Z" fill="#E7C9A8"/>
    <path d="M232 128 Q250 70 262 128" fill="#8A5B44"/><path d="M250 126 Q280 84 284 132" fill="#8A5B44"/>
    ${eyes(expr === "sad" ? "sad" : "open", 228, 46)}
    <path d="M232 262 L268 262 L250 296Z" fill="${P.gold}"/>
    <ellipse cx="186" cy="276" rx="16" ry="9" fill="${P.rose}" opacity="0.45"/><ellipse cx="314" cy="276" rx="16" ry="9" fill="${P.rose}" opacity="0.45"/>`);
}

function mabel(expr) {
  return svg(500, 720, 107, `${shadow}
    ${body("#7C8A93", "#66737B", { shoes: "#3B3633" })}
    <path d="M186 410 L314 410 L326 660 L174 660Z" fill="${P.cream}"/>
    <path d="M196 410 Q250 450 304 410" stroke="${P.creamShade}" stroke-width="6" fill="none"/>
    <rect x="292" y="500" width="44" height="50" rx="8" fill="${P.brown}"/><path d="M336 512 q18 0 18 14 q0 14 -18 14" stroke="${P.brown}" stroke-width="6" fill="none"/>
    <path d="M150 170 L172 70 L232 130Z" fill="#A9A4A0"/><path d="M350 170 L328 70 L268 130Z" fill="#A9A4A0"/>
    <path d="M168 150 L178 100 L210 132Z" fill="${P.rose}" opacity="0.6"/><path d="M332 150 L322 100 L290 132Z" fill="${P.rose}" opacity="0.6"/>
    <circle cx="250" cy="236" r="114" fill="#A9A4A0"/>
    <path d="M196 150 Q250 132 304 150" stroke="#8D8884" stroke-width="10" fill="none"/>
    <ellipse cx="250" cy="282" rx="58" ry="40" fill="#E9E3DA"/>
    <path d="M240 262 L260 262 L250 274Z" fill="${P.rose}"/>
    ${eyes(expr === "sad" ? "sad" : "open", 226, 44, "#3A4A3A")}
    ${mouth(expr === "sad" ? "sad" : "smile", 288)}
    <path d="M190 280 L140 270 M190 290 L138 296 M310 280 L360 270 M310 290 L362 296" stroke="${P.ink}" stroke-width="2.5" opacity="0.6"/>`);
}

function oliver(expr) {
  return svg(500, 720, 109, `${shadow}
    ${body("#27324A", "#1E283C", { w: 132, shoes: "#14181C" })}
    <rect x="236" y="380" width="28" height="260" fill="#1E283C"/>
    <circle cx="250" cy="420" r="6" fill="${P.goldLight}"/><circle cx="250" cy="470" r="6" fill="${P.goldLight}"/><circle cx="250" cy="520" r="6" fill="${P.goldLight}"/>
    <rect x="310" y="430" width="34" height="58" rx="6" fill="#14181C"/><rect x="322" y="404" width="6" height="30" fill="#14181C"/>
    <circle cx="250" cy="240" r="120" fill="#8A6F5A"/>
    <path d="M150 160 L170 112 L200 150Z" fill="#6E5644"/><path d="M350 160 L330 112 L300 150Z" fill="#6E5644"/>
    <circle cx="206" cy="236" r="46" fill="#E9DEC6"/><circle cx="294" cy="236" r="46" fill="#E9DEC6"/>
    ${expr === "sad"
      ? `<circle cx="206" cy="242" r="14" fill="${P.ink}"/><circle cx="294" cy="242" r="14" fill="${P.ink}"/><path d="M168 214 L238 198 M332 214 L262 198" stroke="#5E4A3C" stroke-width="8" stroke-linecap="round"/>`
      : `<circle cx="206" cy="236" r="16" fill="${P.ink}"/><circle cx="294" cy="236" r="16" fill="${P.ink}"/><circle cx="211" cy="231" r="4" fill="#fff"/><circle cx="299" cy="231" r="4" fill="#fff"/>`}
    <path d="M238 270 L262 270 L250 300Z" fill="${P.gold}"/>
    <!-- police cap -->
    <path d="M140 150 Q250 70 360 150 L352 172 Q250 150 148 172Z" fill="#1B2433"/>
    <rect x="132" y="164" width="236" height="20" rx="10" fill="#14181C"/>
    <circle cx="250" cy="130" r="13" fill="${P.goldLight}"/>`);
}

function hazel(expr) {
  return svg(500, 720, 113, `${shadow}
    ${body("#F1EEE8", "#D9D4CB", { w: 126, shoes: "#5E6A70" })}
    <path d="M214 380 L250 470 L286 380" fill="#7FA3A8"/>
    <path d="M196 400 Q170 500 214 540" stroke="#3B474D" stroke-width="6" fill="none"/><circle cx="216" cy="546" r="12" fill="#9AA6AB"/>
    <rect x="292" y="470" width="40" height="8" fill="#9AA6AB"/>
    <ellipse cx="150" cy="190" rx="70" ry="26" transform="rotate(-24 150 190)" fill="#A57D5E"/>
    <ellipse cx="350" cy="190" rx="70" ry="26" transform="rotate(24 350 190)" fill="#A57D5E"/>
    <ellipse cx="150" cy="190" rx="44" ry="12" transform="rotate(-24 150 190)" fill="#E7C9A8"/>
    <ellipse cx="350" cy="190" rx="44" ry="12" transform="rotate(24 350 190)" fill="#E7C9A8"/>
    <ellipse cx="250" cy="236" rx="100" ry="116" fill="#B58A68"/>
    <ellipse cx="250" cy="300" rx="50" ry="44" fill="#EAD6BF"/>
    <ellipse cx="250" cy="276" rx="14" ry="10" fill="${P.ink}"/>
    ${eyes(expr === "sad" ? "sad" : "open", 222, 40)}
    ${mouth(expr === "sad" ? "sad" : "flat", 314)}`);
}

function fox(expr) {
  return svg(500, 720, 127, `${shadow}
    ${body("#B9A27E", "#9E8865", { w: 134, shoes: "#3B3633" })}
    <path d="M214 372 L250 430 L286 372" stroke="#8A7556" stroke-width="10" fill="none"/>
    <rect x="300" y="470" width="62" height="80" rx="4" fill="${P.cream}"/><path d="M310 492 L352 492 M310 510 L346 510 M310 528 L338 528" stroke="${P.brown}" stroke-width="3"/>
    <rect x="346" y="440" width="8" height="70" rx="3" transform="rotate(20 350 470)" fill="${P.gold}"/>
    <path d="M150 190 L176 60 L236 140Z" fill="#C8693E"/><path d="M350 190 L324 60 L264 140Z" fill="#C8693E"/>
    <path d="M168 168 L180 96 L216 140Z" fill="#3B2A22"/><path d="M332 168 L320 96 L284 140Z" fill="#3B2A22"/>
    <circle cx="250" cy="236" r="112" fill="#D27A47"/>
    <path d="M150 250 Q250 400 350 250 Q320 330 250 340 Q180 330 150 250Z" fill="#F3E7D6"/>
    <ellipse cx="250" cy="300" rx="14" ry="10" fill="${P.ink}"/>
    ${eyes(expr === "sad" ? "sad" : "open", 226, 44)}`);
}

function moss(expr) {
  return svg(500, 720, 131, `${shadow}
    ${body("#D9783F", "#B8612F", { w: 136, shoes: "#3B3633" })}
    <rect x="200" y="400" width="100" height="250" fill="#3E5A6B"/><rect x="200" y="400" width="18" height="60" fill="#3E5A6B"/>
    <rect x="300" y="470" width="30" height="70" rx="8" fill="#20262B"/><circle cx="315" cy="466" r="12" fill="${P.goldLight}"/>
    <circle cx="250" cy="250" r="112" fill="#5A4F4A"/>
    <ellipse cx="250" cy="300" rx="56" ry="42" fill="#7A6D66"/>
    <ellipse cx="250" cy="286" rx="26" ry="18" fill="#E39A9A"/>
    ${expr === "sad"
      ? `<path d="M206 240 L226 244 M294 240 L274 244" stroke="${P.ink}" stroke-width="5" stroke-linecap="round"/><path d="M196 232 L230 220 M304 232 L270 220" stroke="${P.ink}" stroke-width="4" stroke-linecap="round"/>`
      : `<circle cx="214" cy="244" r="6" fill="${P.ink}"/><circle cx="286" cy="244" r="6" fill="${P.ink}"/>`}
    ${mouth(expr === "sad" ? "sad" : "flat", 320)}
    <!-- hard hat -->
    <path d="M138 196 Q250 60 362 196Z" fill="${P.yellow}"/>
    <rect x="124" y="188" width="252" height="22" rx="10" fill="${P.yellowShade}"/>
    <rect x="240" y="100" width="20" height="92" fill="${P.yellowShade}" opacity="0.6"/>`);
}

function niniAdult(expr) {
  return svg(500, 720, 137, `${shadow}
    ${body(P.yellow, P.yellowShade, { w: 116, top: 350, shoes: "#6B4E3B", armLen: 120 })}
    <path d="M190 360 Q250 400 310 360 L318 392 Q250 430 182 392Z" fill="${P.green}"/>
    <path d="M296 384 L320 470 L292 474Z" fill="${P.green}"/>
    <ellipse cx="162" cy="210" rx="44" ry="18" transform="rotate(-24 162 210)" fill="#FBF7EE"/>
    <ellipse cx="338" cy="210" rx="44" ry="18" transform="rotate(24 338 210)" fill="#FBF7EE"/>
    <ellipse cx="250" cy="236" rx="92" ry="104" fill="#FBF7EE"/>
    ${[178, 206, 234, 262, 290, 318].map((x, i) => `<circle cx="${x}" cy="${148 - (i % 2) * 8}" r="24" fill="#F3EBDD"/>`).join("")}
    ${[160, 340].map((x) => `<circle cx="${x}" cy="230" r="22" fill="#F3EBDD"/><circle cx="${x}" cy="270" r="20" fill="#F3EBDD"/>`).join("")}
    ${eyes(expr === "sad" ? "sad" : expr === "closed" ? "closed" : "open", 236, 38)}
    ${mouth(expr === "sad" ? "sad" : "smile", 292)}
    <ellipse cx="196" cy="270" rx="15" ry="8" fill="${P.rose}" opacity="0.5"/><ellipse cx="304" cy="270" rx="15" ry="8" fill="${P.rose}" opacity="0.5"/>`);
}

/* ======================= LOCATIONS ======================= */

const W = 2048, H = 1152, GH = 560;

function cobble(seed, base, tint) {
  const r = rng(seed);
  let c = "";
  for (let row = 0; row < 14; row++) {
    const y = 20 + row * row * 2.6 + row * 14, h = 10 + row * 2.2, w = 26 + row * 5;
    for (let x = -w + ((row % 2) * w) / 2; x < W + w; x += w + 4) {
      const s = 64 + ((r() * 18) | 0);
      c += `<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${w}" height="${h}" rx="${h / 2.4}" fill="rgb(${s + tint[0]},${s + tint[1]},${s + tint[2]})"/>`;
    }
  }
  return `<rect width="${W}" height="${GH}" fill="${base}"/>${c}`;
}
function planks(seed, base, line) {
  const r = rng(seed);
  let p = `<rect width="${W}" height="${GH}" fill="${base}"/>`;
  for (let row = 0; row < 12; row++) {
    const y = row * row * 3 + row * 12, h = 10 + row * 4;
    p += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="${line}" stroke-width="${1 + row * 0.3}"/>`;
    for (let x = (r() * 300) | 0; x < W; x += 300 + ((r() * 200) | 0)) p += `<line x1="${x}" y1="${y}" x2="${x}" y2="${y + h}" stroke="${line}" stroke-width="2"/>`;
  }
  return p;
}
function clockFace(cx, cy, r, fill = P.cream) {
  const hand = (deg, len, w) => {
    const a = ((deg - 90) * Math.PI) / 180;
    return `<line x1="${cx}" y1="${cy}" x2="${(cx + Math.cos(a) * len).toFixed(1)}" y2="${(cy + Math.sin(a) * len).toFixed(1)}" stroke="${P.ink}" stroke-width="${w}" stroke-linecap="round"/>`;
  };
  return `<circle cx="${cx}" cy="${cy}" r="${r + 6}" fill="${P.brownDeep}"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>
    ${hand(353.5, r * 0.5, Math.max(3, r / 10))}${hand(282, r * 0.78, Math.max(2, r / 14))}<circle cx="${cx}" cy="${cy}" r="${Math.max(2, r / 14)}" fill="${P.ink}"/>`;
}
function rainyWindow(x, y, w, h, seed) {
  const r = rng(seed);
  let streaks = "", bokeh = "";
  for (let i = 0; i < 26; i++) streaks += `<line x1="${x + r() * w}" y1="${y + r() * h}" x2="${x + r() * w - 8}" y2="${y + r() * h}" stroke="${P.blueGray}" stroke-width="1.5" opacity="0.5"/>`;
  for (let i = 0; i < 14; i++) bokeh += `<circle cx="${x + r() * w}" cy="${y + h * 0.3 + r() * h * 0.4}" r="${6 + r() * 12}" fill="${P.goldLight}" opacity="${0.15 + r() * 0.25}" filter="url(#soft)"/>`;
  return `<rect x="${x - 16}" y="${y - 16}" width="${w + 32}" height="${h + 32}" rx="6" fill="${P.brownDeep}"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#1E2A38"/>${bokeh}${streaks}
    <rect x="${x + w / 2 - 6}" y="${y}" width="12" height="${h}" fill="${P.brownDeep}"/><rect x="${x}" y="${y + h / 2 - 6}" width="${w}" height="12" fill="${P.brownDeep}"/>`;
}

/* ---- flower shop (exterior) ---- */
function flowerMid() {
  const r = rng(201);
  let buckets = "";
  for (let i = 0; i < 9; i++) {
    const x = 560 + i * 110;
    buckets += `<path d="M${x} 870 L${x + 70} 870 L${x + 62} 930 L${x + 8} 930Z" fill="#5A6670"/>`;
    for (let k = 0; k < 7; k++) buckets += `<circle cx="${x + 10 + r() * 50}" cy="${840 + r() * 30}" r="${11 + r() * 5}" fill="${["#D9776B", P.cream, "#E6A9A0", P.goldLight, "#B7A4D0"][(i + k) % 5]}"/>`;
  }
  let scallop = "";
  for (let i = 0; i < 16; i++) scallop += `<circle cx="${470 + i * 74 + 37}" cy="600" r="37" fill="${i % 2 ? P.green : P.greenShade}"/>`;
  return svg(W, H, 203, `
    <rect x="0" y="930" width="${W}" height="222" fill="#3E3B3A"/>
    <rect x="430" y="250" width="1200" height="690" fill="#D8C9B2"/>
    ${Array.from({ length: 12 }, (_, i) => `<line x1="430" y1="${280 + i * 54}" x2="1630" y2="${280 + i * 54}" stroke="#C3B39B" stroke-width="3"/>`).join("")}
    <path d="M400 250 L1660 250 L1630 200 L430 200Z" fill="#6B4E3B"/>
    <rect x="700" y="300" width="660" height="110" rx="10" fill="${P.greenDeep}"/>
    <text x="1030" y="372" text-anchor="middle" font-family="Georgia, serif" font-size="52" letter-spacing="6" fill="${P.cream}">LILY'S FLOWERS</text>
    <rect x="470" y="520" width="1120" height="80" fill="${P.green}"/>${scallop}
    <rect x="500" y="640" width="200" height="290" fill="#4A3A30"/><circle cx="680" cy="790" r="8" fill="${P.goldLight}"/>
    <rect x="760" y="650" width="800" height="210" fill="#F2C877" opacity="0.85"/>
    <rect x="760" y="650" width="800" height="210" fill="none" stroke="#6B4E3B" stroke-width="14"/>
    ${Array.from({ length: 10 }, (_, i) => `<ellipse cx="${800 + i * 76}" cy="${820 - (i % 3) * 20}" rx="26" ry="40" fill="${P.greenShade}" opacity="0.7"/>`).join("")}
    ${clockFace(1460, 712, 34)}
    <path d="M500 640 Q600 690 700 640" stroke="${P.green}" stroke-width="16" fill="none"/>
    ${Array.from({ length: 6 }, (_, i) => `<circle cx="${520 + i * 32}" cy="${650 + Math.sin((i / 5) * Math.PI) * 30}" r="10" fill="${["#D9776B", P.cream, P.goldLight][i % 3]}"/>`).join("")}
    ${buckets}
    <rect x="1700" y="420" width="16" height="520" fill="#1A2025"/>
    <path d="M1680 420 L1736 420 L1726 360 L1690 360Z" fill="${P.goldLight}"/>
    <circle cx="1708" cy="390" r="70" fill="${P.goldLight}" opacity="0.2" filter="url(#softer)"/>`, 1.6);
}

/* ---- cafe (interior, two versions: the room "remembered differently") ---- */
function cafeFar() {
  let stripes = "";
  for (let x = 0; x < W; x += 60) stripes += `<rect x="${x}" y="0" width="30" height="${H}" fill="#EADBC2" opacity="0.5"/>`;
  let shelves = "";
  for (let i = 0; i < 3; i++) {
    shelves += `<rect x="${1100 + i * 0}" y="${300 + i * 120}" width="560" height="14" fill="${P.brownDeep}"/>`;
    for (let k = 0; k < 7; k++) shelves += `<rect x="${1120 + k * 76}" y="${250 + i * 120}" width="${40 + (k % 2) * 10}" height="50" rx="8" fill="${[P.cream, "#C98B7E", P.green, P.gold][(k + i) % 4]}"/>`;
  }
  return svg(W, H, 211, `<rect width="${W}" height="${H}" fill="#E2CFAF"/>${stripes}
    <rect x="0" y="760" width="${W}" height="${H - 760}" fill="#8A6F5A"/><rect x="0" y="750" width="${W}" height="20" fill="#6B4E3B"/>
    ${shelves}
    <line x1="1024" y1="0" x2="1024" y2="160" stroke="#3B3633" stroke-width="4"/><path d="M970 160 L1078 160 L1060 200 L988 200Z" fill="${P.green}"/>
    <circle cx="1024" cy="220" r="120" fill="${P.goldLight}" opacity="0.25" filter="url(#softer)"/>`, 1.2);
}
function cafeMid(version) {
  const b = version === "b";
  const win = b ? rainyWindow(1420, 300, 420, 400, 7) : rainyWindow(180, 300, 460, 400, 5);
  const counterX = b ? 260 : 980;
  const table = (x) => `<ellipse cx="${x}" cy="800" rx="110" ry="22" fill="#6B4E3B"/><rect x="${x - 10}" y="800" width="20" height="120" fill="#4A3A30"/><ellipse cx="${x}" cy="928" rx="60" ry="10" fill="#4A3A30"/>
    <rect x="${x - 30}" y="770" width="34" height="30" rx="6" fill="${P.cream}"/><path d="M${x + 4} 778 q12 0 12 10 q0 10 -12 10" stroke="${P.cream}" stroke-width="4" fill="none"/>
    <rect x="${x - 190}" y="720" width="60" height="210" rx="10" fill="#5E4A3C"/><rect x="${x + 130}" y="720" width="60" height="210" rx="10" fill="#5E4A3C"/>`;
  return svg(W, H, 213 + (b ? 1 : 0), `
    <rect x="0" y="930" width="${W}" height="222" fill="#6B5444"/>
    ${win}
    <rect x="${counterX}" y="660" width="720" height="270" rx="8" fill="#7A5E4C"/>
    <rect x="${counterX - 20}" y="640" width="760" height="30" rx="8" fill="#5E4A3C"/>
    <rect x="${counterX + 60}" y="540" width="150" height="100" rx="10" fill="#9AA6AB"/><rect x="${counterX + 90}" y="600" width="30" height="40" fill="#5A6670"/>
    <path d="M${counterX + 420} 640 Q${counterX + 480} 560 ${counterX + 540} 640Z" fill="#F3EBDD" opacity="0.6"/><rect x="${counterX + 450}" y="610" width="60" height="30" rx="6" fill="#D9776B"/>
    ${b ? table(1100) : table(560) + table(820)}
    ${b ? clockFace(1024, 230, 70) : ""}
    ${b ? `<rect x="560" y="300" width="160" height="200" fill="${P.creamShade}" stroke="${P.brownDeep}" stroke-width="10"/><path d="M590 470 L640 380 L690 470Z" fill="${P.green}"/>` : ""}`, 1.4);
}
function cafeFloor() { return svg(W, GH, 215, planks(215, "#7A5E4C", "#5E4A3C"), 1); }
function cafeFg() {
  return svg(W, H, 217, `<g filter="url(#soft)">
    <rect x="-40" y="860" width="260" height="400" rx="30" fill="#2A211C"/><rect x="-40" y="820" width="300" height="60" rx="20" fill="#2A211C"/>
    <path d="M1880 1152 L1900 900 Q1960 820 2048 860 L2048 1152Z" fill="#1E2A22"/><ellipse cx="1950" cy="880" rx="90" ry="60" fill="#25352A"/></g>`, 1);
}

/* ---- park ---- */
function parkFar() {
  const r = rng(221);
  let stars = "";
  for (let i = 0; i < 50; i++) stars += `<circle cx="${(r() * W) | 0}" cy="${(r() * 420) | 0}" r="${(r() * 1.6 + 0.5).toFixed(1)}" fill="${P.cream}" opacity="${(r() * 0.5 + 0.15).toFixed(2)}"/>`;
  let trees = "";
  for (let x = -60; x < W + 80; x += 90 + r() * 60) trees += `<circle cx="${x}" cy="${640 + r() * 60}" r="${80 + r() * 50}" fill="${r() < 0.5 ? "#1F2B2A" : "#243231"}"/>`;
  return svg(W, H, 223, `
    <linearGradient id="psky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#16202A"/><stop offset="0.7" stop-color="#2A3644"/><stop offset="1" stop-color="#4A4650"/></linearGradient>
    <rect width="${W}" height="${H}" fill="url(#psky)"/>${stars}
    <ellipse cx="1500" cy="760" rx="600" ry="120" fill="${P.goldLight}" opacity="0.08" filter="url(#softer)"/>
    ${trees}<rect x="0" y="720" width="${W}" height="${H - 720}" fill="#1F2B2A"/>`, 1.4);
}
function parkMid() {
  const tree = (x, s) => `<rect x="${x - 26 * s}" y="${930 - 420 * s}" width="${52 * s}" height="${420 * s}" fill="#3B2F28"/>
    <circle cx="${x}" cy="${930 - 470 * s}" r="${190 * s}" fill="#2E4234"/><circle cx="${x - 120 * s}" cy="${930 - 400 * s}" r="${130 * s}" fill="#34493A"/><circle cx="${x + 130 * s}" cy="${930 - 410 * s}" r="${140 * s}" fill="#2A3D30"/>`;
  return svg(W, H, 225, `
    <rect x="0" y="930" width="${W}" height="222" fill="#2C3A2E"/>
    ${tree(260, 1.1)}${tree(1830, 1.0)}
    <!-- bench -->
    <rect x="620" y="830" width="360" height="22" rx="6" fill="#6B4E3B"/><rect x="620" y="780" width="360" height="18" rx="6" fill="#6B4E3B"/>
    <rect x="640" y="850" width="14" height="80" fill="#2A2420"/><rect x="946" y="850" width="14" height="80" fill="#2A2420"/>
    <!-- lamp -->
    <rect x="1150" y="460" width="16" height="470" fill="#1A2025"/><path d="M1128 460 L1188 460 L1178 400 L1138 400Z" fill="${P.goldLight}"/>
    <circle cx="1158" cy="430" r="90" fill="${P.goldLight}" opacity="0.22" filter="url(#softer)"/>
    <!-- notice board: an event that has already ended -->
    <rect x="1370" y="690" width="16" height="240" fill="#4A3A30"/><rect x="1614" y="690" width="16" height="240" fill="#4A3A30"/>
    <rect x="1350" y="600" width="300" height="220" rx="6" fill="#6B4E3B"/>
    <rect x="1380" y="624" width="240" height="172" fill="${P.cream}"/>
    <text x="1500" y="664" text-anchor="middle" font-family="Georgia, serif" font-size="24" letter-spacing="2" fill="${P.greenDeep}">BELL CHOIR</text>
    <text x="1500" y="698" text-anchor="middle" font-family="Georgia, serif" font-size="20" fill="${P.ink}">9:00 PM</text>
    <text x="1500" y="740" text-anchor="middle" font-family="Georgia, serif" font-size="15" fill="${P.ink}">THANK YOU FOR COMING!</text>
    <rect x="1420" y="752" width="160" height="34" rx="4" fill="none" stroke="#B24A3A" stroke-width="4" transform="rotate(-8 1500 769)"/>
    <text x="1500" y="776" text-anchor="middle" font-family="Georgia, serif" font-size="20" letter-spacing="3" fill="#B24A3A" transform="rotate(-8 1500 769)">ENDED</text>
    <!-- pond -->
    <ellipse cx="1060" cy="925" rx="200" ry="16" fill="#1E2832"/>`, 1.6);
}
function parkGround() {
  const r = rng(227);
  let g = `<rect width="${W}" height="${GH}" fill="#2A372B"/>`;
  for (let i = 0; i < 400; i++) g += `<rect x="${(r() * W) | 0}" y="${(r() * GH) | 0}" width="3" height="${8 + r() * 10}" fill="#3A4A3A" opacity="0.6"/>`;
  g += `<path d="M0 120 Q1024 60 2048 140 L2048 300 Q1024 220 0 320Z" fill="#5A5248"/>`;
  return svg(W, GH, 229, g, 1);
}
function parkFg() {
  return svg(W, H, 231, `<g filter="url(#soft)">
    <path d="M-40 -20 Q300 120 520 40 Q380 200 -40 220Z" fill="#141C17"/>
    <path d="M2088 -20 Q1760 140 1520 60 Q1700 240 2088 260Z" fill="#141C17"/>
    <ellipse cx="120" cy="1150" rx="260" ry="160" fill="#141C17"/></g>`, 1);
}

/* ---- town gate + pump house ---- */
function gateFar() {
  return svg(W, H, 241, `
    <linearGradient id="gsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#18202D"/><stop offset="0.75" stop-color="#2E3846"/><stop offset="1" stop-color="#4A4A52"/></linearGradient>
    <rect width="${W}" height="${H}" fill="url(#gsky)"/>
    <path d="M0 720 Q400 600 900 690 T2048 660 L2048 ${H} L0 ${H}Z" fill="#232D36"/>
    <path d="M0 800 Q600 720 1200 790 T2048 770 L2048 ${H} L0 ${H}Z" fill="#1D262E"/>`, 1.4);
}
function gateMid() {
  let stones = "";
  for (let y = 520; y < 930; y += 46) for (let x = (y / 46) % 2 ? 0 : 40; x < 2048; x += 120) stones += `<rect x="${x}" y="${y}" width="112" height="40" rx="6" fill="#57585A"/>`;
  return svg(W, H, 243, `
    <rect x="0" y="930" width="${W}" height="222" fill="#3B3734"/>
    <clipPath id="wall"><path d="M0 520 L700 520 L700 930 L0 930Z M1350 520 L2048 520 L2048 930 L1350 930Z"/></clipPath>
    <rect x="0" y="520" width="${W}" height="410" fill="#4A4B4D" clip-path="url(#wall)"/>
    <g clip-path="url(#wall)">${stones}</g>
    <!-- the arch -->
    <path d="M700 930 L700 420 Q1024 200 1350 420 L1350 930 L1250 930 L1250 480 Q1024 320 800 480 L800 930Z" fill="#6A6A6C"/>
    <rect x="840" y="300" width="370" height="70" rx="8" fill="#3B4A40"/>
    <text x="1025" y="350" text-anchor="middle" font-family="Georgia, serif" font-size="38" letter-spacing="8" fill="${P.cream}">BELLFLOWER</text>
    <!-- pump house -->
    <rect x="1460" y="600" width="440" height="330" fill="#5E5A55"/><path d="M1440 610 L1680 500 L1920 610Z" fill="#3B3734"/>
    <rect x="1520" y="700" width="110" height="230" fill="#2E2A27"/><circle cx="1612" cy="820" r="6" fill="${P.goldLight}"/>
    <rect x="1700" y="680" width="120" height="80" fill="${P.goldLight}" opacity="0.6"/>
    <rect x="1690" y="790" width="150" height="40" rx="4" fill="${P.cream}"/>
    <text x="1765" y="816" text-anchor="middle" font-family="monospace" font-size="15" fill="${P.ink}">PUMP STN. 2</text>
    <circle cx="1880" cy="640" r="14" fill="#B24A3A"/><circle cx="1880" cy="640" r="40" fill="#B24A3A" opacity="0.25" filter="url(#soft)"/>
    <rect x="1700" y="850" width="130" height="60" fill="${P.cream}" opacity="0.9" transform="rotate(-3 1765 880)"/>
    <text x="1765" y="876" text-anchor="middle" font-family="monospace" font-size="12" fill="${P.ink}" transform="rotate(-3 1765 880)">REPAIR:</text>
    <text x="1765" y="896" text-anchor="middle" font-family="monospace" font-size="12" fill="${P.ink}" transform="rotate(-3 1765 880)">AFTER FESTIVAL</text>
    <path d="M1460 900 L1380 900 L1380 940" stroke="#3E4A50" stroke-width="20" fill="none"/>
    <!-- lamp -->
    <rect x="420" y="460" width="16" height="470" fill="#1A2025"/><path d="M398 460 L458 460 L448 400 L408 400Z" fill="${P.goldLight}"/>
    <circle cx="428" cy="430" r="90" fill="${P.goldLight}" opacity="0.2" filter="url(#softer)"/>`, 1.6);
}
function roadGround() { return svg(W, GH, 247, cobble(247, "#3E3A36", [4, 2, 0]), 1); }
function gateFg() {
  let posts = "";
  for (let x = 0; x < W; x += 260) posts += `<rect x="${x}" y="960" width="40" height="220" rx="6" fill="#1A1714"/>`;
  return svg(W, H, 249, `<g filter="url(#soft)">${posts}<rect x="0" y="1000" width="${W}" height="22" fill="#1A1714"/></g>`, 1);
}

/* ---- the underground passage ---- */
function passageFar() {
  let rings = "";
  for (let i = 0; i < 8; i++) {
    const s = 1 - i * 0.11;
    rings += `<path d="M${1024 - 700 * s} ${930} L${1024 - 700 * s} ${930 - 500 * s} Q1024 ${930 - 900 * s} ${1024 + 700 * s} ${930 - 500 * s} L${1024 + 700 * s} 930" stroke="#1E2629" stroke-width="${30 * s}" fill="none"/>`;
  }
  return svg(W, H, 251, `<rect width="${W}" height="${H}" fill="#101618"/>
    <ellipse cx="1024" cy="720" rx="160" ry="120" fill="#5E7A7A" opacity="0.18" filter="url(#softer)"/>${rings}`, 1.2);
}
function passageMid() {
  let bricks = "";
  for (let y = 120; y < 930; y += 40) for (let x = (y / 40) % 2 ? 0 : 50; x < W; x += 100) bricks += `<rect x="${x}" y="${y}" width="94" height="34" rx="3" fill="#2A3233"/>`;
  const bulb = (x) => `<rect x="${x - 3}" y="300" width="6" height="40" fill="#14181C"/><circle cx="${x}" cy="352" r="14" fill="#C9D6C8" opacity="0.85"/><circle cx="${x}" cy="352" r="70" fill="#C9D6C8" opacity="0.12" filter="url(#softer)"/>`;
  const crate = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#6B5444"/><path d="M${x} ${y} L${x + w} ${y + h} M${x + w} ${y} L${x} ${y + h}" stroke="#4A3A30" stroke-width="6"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="#4A3A30" stroke-width="8"/>`;
  return svg(W, H, 253, `
    <rect x="0" y="100" width="${W}" height="830" fill="#232B2C"/>${bricks}
    <rect x="0" y="930" width="${W}" height="222" fill="#14201F"/>
    <rect x="0" y="210" width="${W}" height="26" fill="#3E4A50"/><rect x="0" y="250" width="${W}" height="14" fill="#36424A"/>
    ${bulb(420)}${bulb(1100)}
    <!-- the cafe-side hatch, warm light above the stacked festival crates -->
    <rect x="1500" y="420" width="250" height="110" fill="${P.goldLight}" opacity="0.85"/>
    <rect x="1500" y="420" width="250" height="110" fill="none" stroke="#14181C" stroke-width="12"/>
    <circle cx="1625" cy="470" r="200" fill="${P.goldLight}" opacity="0.14" filter="url(#softer)"/>
    ${crate(1440, 560, 180, 180)}${crate(1630, 600, 170, 140)}${crate(1480, 740, 200, 190)}${crate(1690, 740, 180, 190)}
    <text x="1580" y="840" text-anchor="middle" font-family="monospace" font-size="22" fill="#2A211C">FESTIVAL</text>
    <rect x="1840" y="300" width="20" height="630" fill="#3E4A50"/>
    ${Array.from({ length: 8 }, (_, i) => `<rect x="1810" y="${360 + i * 70}" width="80" height="10" fill="#3E4A50"/>`).join("")}`, 1.4);
}
function waterGround() {
  const r = rng(257);
  let w = `<rect width="${W}" height="${GH}" fill="#16302F"/>`;
  for (let i = 0; i < 70; i++) {
    const y = r() * GH, x = r() * W, len = 40 + r() * 160;
    w += `<line x1="${x}" y1="${y}" x2="${x + len}" y2="${y}" stroke="${i % 5 ? "#3E6466" : "#C9D6C8"}" stroke-width="${1 + r() * 2}" opacity="${0.2 + r() * 0.4}"/>`;
  }
  return svg(W, GH, 259, w, 3);
}
function passageFg() {
  return svg(W, H, 261, `<g filter="url(#soft)">
    <rect x="-20" y="0" width="${W + 40}" height="70" fill="#0C1112"/>
    <rect x="300" y="60" width="18" height="260" fill="#0C1112"/><rect x="1700" y="60" width="18" height="180" fill="#0C1112"/>
    <path d="M-40 1152 L-40 900 Q200 860 360 1152Z" fill="#0C1112"/></g>`, 1);
}

/* ---- hospital ---- */
function hospitalFar() {
  return svg(W, H, 271, `<rect width="${W}" height="${H}" fill="#C9D3CF"/>
    <rect x="0" y="760" width="${W}" height="${H - 760}" fill="#AEBBB8"/>
    ${rainyWindow(1300, 220, 420, 360, 9)}
    <rect x="200" y="140" width="360" height="40" rx="20" fill="#EEF5F2"/><rect x="200" y="140" width="360" height="40" rx="20" fill="#EEF5F2" opacity="0.6" filter="url(#softer)"/>`, 1);
}
function hospitalMid() {
  return svg(W, H, 273, `
    <rect x="0" y="930" width="${W}" height="222" fill="#9FAEAA"/>
    <!-- IV stand -->
    <rect x="470" y="380" width="10" height="550" fill="#7A8A8E"/><rect x="430" y="380" width="90" height="8" fill="#7A8A8E"/>
    <path d="M450 388 L450 470 Q475 500 500 470 L500 388Z" fill="#E7F0EE" opacity="0.9"/>
    <path d="M475 500 Q520 640 640 700" stroke="#C9D3CF" stroke-width="4" fill="none"/>
    <!-- bed -->
    <rect x="600" y="700" width="900" height="70" rx="10" fill="#E7EEEC"/>
    <rect x="600" y="760" width="900" height="40" fill="#B9C5C2"/>
    <rect x="620" y="800" width="14" height="130" fill="#7A8A8E"/><rect x="1466" y="800" width="14" height="130" fill="#7A8A8E"/>
    <rect x="1440" y="560" width="60" height="240" rx="10" fill="#9AA6AB"/>
    <ellipse cx="760" cy="676" rx="140" ry="44" fill="#F5F8F7"/>
    <!-- a green ear on the pillow -->
    <circle cx="742" cy="640" r="60" fill="${P.green}"/><circle cx="700" cy="598" r="24" fill="${P.green}"/><circle cx="700" cy="598" r="12" fill="${P.creamShade}"/>
    <path d="M722 646 L746 646" stroke="${P.ink}" stroke-width="4" stroke-linecap="round"/>
    <path d="M800 690 Q1100 640 1420 700 L1420 740 L800 740Z" fill="#DCE5E2"/>
    <!-- monitor -->
    <rect x="1600" y="520" width="16" height="410" fill="#7A8A8E"/>
    <rect x="1540" y="420" width="240" height="170" rx="12" fill="#20262B"/>
    <rect x="1556" y="436" width="208" height="120" fill="#0F1A16"/>
    <path d="M1560 500 L1610 500 L1624 470 L1640 530 L1656 500 L1760 500" stroke="#7BD08F" stroke-width="4" fill="none"/>
    <text x="1740" y="580" text-anchor="end" font-family="monospace" font-size="18" fill="#7BD08F">1:17</text>`, 1.2);
}
function hospitalFloor() {
  let tiles = `<rect width="${W}" height="${GH}" fill="#A8B6B2"/>`;
  for (let row = 0; row < 12; row++) tiles += `<line x1="0" y1="${row * row * 3 + row * 14}" x2="${W}" y2="${row * row * 3 + row * 14}" stroke="#97A6A2" stroke-width="2"/>`;
  return svg(W, GH, 275, tiles, 0.5);
}
function hospitalFg() {
  return svg(W, H, 277, `<g filter="url(#soft)"><path d="M-20 -20 L220 -20 Q160 400 240 1180 L-20 1180Z" fill="#9FC0C4" opacity="0.85"/></g>`, 1);
}

/* ---- attic, years later (the only daylight in the game) ---- */
function atticFar() {
  let boards = "";
  for (let x = 0; x < W; x += 110) boards += `<rect x="${x}" y="0" width="104" height="${H}" fill="${x % 220 ? "#B9926E" : "#B08965"}"/>`;
  return svg(W, H, 281, `${boards}
    <circle cx="1024" cy="420" r="210" fill="#5E4A3C"/><circle cx="1024" cy="420" r="190" fill="#BFD8E6"/>
    <ellipse cx="1000" cy="480" rx="160" ry="40" fill="#F3EBDD" opacity="0.8"/>
    <path d="M1024 230 L1024 610 M834 420 L1214 420" stroke="#5E4A3C" stroke-width="14"/>
    <path d="M880 560 L1300 1152 L700 1152Z" fill="#F7E7C6" opacity="0.18"/>
    <rect x="0" y="880" width="${W}" height="${H - 880}" fill="#8A6F5A"/>`, 1.2);
}
function atticMid() {
  return svg(W, H, 283, `
    <rect x="0" y="930" width="${W}" height="222" fill="#7A5E4C"/>
    <rect x="200" y="420" width="420" height="16" fill="#5E4A3C"/><rect x="200" y="600" width="420" height="16" fill="#5E4A3C"/>
    ${Array.from({ length: 9 }, (_, i) => `<rect x="${220 + i * 44}" y="${470 - (i % 3) * 10}" width="34" height="${130 + (i % 3) * 10}" fill="${[P.green, "#C98B7E", P.gold, P.cream][i % 4]}"/>`).join("")}
    <rect x="300" y="520" width="140" height="80" fill="${P.creamShade}" stroke="#5E4A3C" stroke-width="8"/>
    ${Array.from({ length: 6 }, (_, i) => `<circle cx="${318 + i * 21}" cy="545" r="5" fill="${P.goldLight}"/>`).join("")}
    <!-- low table and the small box -->
    <rect x="1240" y="800" width="460" height="24" rx="6" fill="#6B4E3B"/>
    <rect x="1270" y="824" width="18" height="106" fill="#4A3A30"/><rect x="1652" y="824" width="18" height="106" fill="#4A3A30"/>
    <rect x="1400" y="740" width="150" height="62" rx="6" fill="#C98B7E"/><path d="M1400 740 L1430 690 L1580 690 L1550 740Z" fill="#D9A396"/>`, 1.4);
}
function atticFloor() { return svg(W, GH, 285, planks(285, "#8A6F5A", "#6B5444"), 1); }
function atticFg() {
  return svg(W, H, 287, `<path d="M-20 -20 L700 -20 L-20 300Z" fill="#4A3A30"/><path d="M2068 -20 L1400 -20 L2068 280Z" fill="#4A3A30"/>`, 1);
}

module.exports = {
  sprites: {
    lily_neutral: () => lily("neutral"), lily_worried: () => lily("sad"),
    finch_neutral: () => finch("neutral"), finch_worried: () => finch("sad"),
    mabel_neutral: () => mabel("neutral"), mabel_worried: () => mabel("sad"),
    oliver_neutral: () => oliver("neutral"), oliver_worried: () => oliver("sad"),
    hazel_neutral: () => hazel("neutral"), hazel_worried: () => hazel("sad"),
    fox_neutral: () => fox("neutral"), fox_worried: () => fox("sad"),
    moss_neutral: () => moss("neutral"), moss_worried: () => moss("sad"),
    niniadult_neutral: () => niniAdult("neutral"), niniadult_blink: () => niniAdult("closed"), niniadult_worried: () => niniAdult("sad"),

    flower_mid: flowerMid,
    cafe_far: cafeFar, cafe_mid_a: () => cafeMid("a"), cafe_mid_b: () => cafeMid("b"), cafe_floor: cafeFloor, cafe_fg: cafeFg,
    park_far: parkFar, park_mid: parkMid, park_ground: parkGround, park_fg: parkFg,
    gate_far: gateFar, gate_mid: gateMid, road_ground: roadGround, gate_fg: gateFg,
    passage_far: passageFar, passage_mid: passageMid, passage_water: waterGround, passage_fg: passageFg,
    hospital_far: hospitalFar, hospital_mid: hospitalMid, hospital_floor: hospitalFloor, hospital_fg: hospitalFg,
    attic_far: atticFar, attic_mid: atticMid, attic_floor: atticFloor, attic_fg: atticFg,
  },
};
