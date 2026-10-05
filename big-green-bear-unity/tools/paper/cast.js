/*
 * cast.js — the characters, as jointed paper figures (see kit.js).
 *
 * Every figure is a few sheets stacked: legs, arms, body, head, then the
 * little stuck-on pieces (muzzle, scarf). Each sheet casts a small shadow on
 * the one under it, which is what makes them read as cut paper.
 * Big Green Bear's green and Nini's yellow are the only strong colours in the
 * game; everyone else is quieter.
 */
const { C, ply, sprite } = require("./kit.js");

// a figure's sheet: small shadow, warm rim
const part = (body, o = {}) => ply(body, Object.assign({ rim: 0.4, rimCol: "#FFE6C0", under: 0.25, shadow: { dx: 3, dy: 6, blur: 5, a: 0.38 }, wobble: 1.2 }, o));
// the figure's shadow on whatever is behind: a little bigger
const base = (body, o = {}) => part(body, Object.assign({ shadow: { dx: 7, dy: 10, blur: 10, a: 0.45 } }, o));

/* ======================= BIG GREEN BEAR (600 x 820) ======================= */
function bear(expr) {
  const eyes = {
    neutral: `<circle cx="248" cy="236" r="11" fill="${C.ink}"/><circle cx="352" cy="236" r="11" fill="${C.ink}"/>
              <circle cx="252" cy="232" r="3.2" fill="${C.white}"/><circle cx="356" cy="232" r="3.2" fill="${C.white}"/>`,
    happy: `<path d="M233 240 Q248 222 263 240" stroke="${C.ink}" stroke-width="7" fill="none" stroke-linecap="round"/>
            <path d="M337 240 Q352 222 367 240" stroke="${C.ink}" stroke-width="7" fill="none" stroke-linecap="round"/>`,
    worried: `<circle cx="248" cy="240" r="10" fill="${C.ink}"/><circle cx="352" cy="240" r="10" fill="${C.ink}"/>
              <path d="M228 212 L266 202" stroke="${C.greenDeep}" stroke-width="6" stroke-linecap="round"/>
              <path d="M372 212 L334 202" stroke="${C.greenDeep}" stroke-width="6" stroke-linecap="round"/>`,
    searching: `<circle cx="258" cy="234" r="11" fill="${C.ink}"/><circle cx="362" cy="234" r="11" fill="${C.ink}"/>
                <circle cx="263" cy="231" r="3" fill="${C.white}"/><circle cx="367" cy="231" r="3" fill="${C.white}"/>`,
    blink: `<path d="M236 238 L260 238" stroke="${C.ink}" stroke-width="6" stroke-linecap="round"/>
            <path d="M340 238 L364 238" stroke="${C.ink}" stroke-width="6" stroke-linecap="round"/>`,
  }[expr];
  const mouth = {
    neutral: `<path d="M286 318 Q300 328 314 318" stroke="${C.ink}" stroke-width="5" fill="none" stroke-linecap="round"/>`,
    happy: `<path d="M280 314 Q300 340 320 314 Z" fill="${C.brownDeep}"/>`,
    worried: `<path d="M286 326 Q293 318 300 324 Q307 330 314 322" stroke="${C.ink}" stroke-width="5" fill="none" stroke-linecap="round"/>`,
    searching: `<ellipse cx="302" cy="322" rx="8" ry="9" fill="${C.brownDeep}"/>`,
    blink: `<path d="M286 318 Q300 328 314 318" stroke="${C.ink}" stroke-width="5" fill="none" stroke-linecap="round"/>`,
  }[expr];
  const blush = expr === "happy" || expr === "neutral" || expr === "blink"
    ? `<ellipse cx="214" cy="292" rx="20" ry="11" fill="${C.rose}"/><ellipse cx="386" cy="292" rx="20" ry="11" fill="${C.rose}"/>` : "";
  return sprite(600, 820, [
    base(`<g fill="${C.greenShade}"><ellipse cx="222" cy="768" rx="74" ry="46"/><ellipse cx="378" cy="768" rx="74" ry="46"/>
      <ellipse cx="118" cy="560" rx="56" ry="120" transform="rotate(18 118 560)"/><ellipse cx="482" cy="560" rx="56" ry="120" transform="rotate(-18 482 560)"/></g>
      <g fill="${C.creamShade}"><ellipse cx="222" cy="784" rx="46" ry="18"/><ellipse cx="378" cy="784" rx="46" ry="18"/></g>`),
    part(`<ellipse cx="300" cy="560" rx="196" ry="222" fill="${C.green}"/>
      <path d="M206 404 Q300 424 394 404" stroke="${C.greenDeep}" stroke-width="2" fill="none" opacity="0.5" stroke-dasharray="6 7"/>`),
    part(`<ellipse cx="300" cy="592" rx="110" ry="138" fill="${C.cream}"/>`, { shadow: { dx: 2, dy: 4, blur: 4, a: 0.3 } }),
    part(`<g fill="${C.green}"><ellipse cx="96" cy="664" rx="44" ry="38"/><ellipse cx="504" cy="664" rx="44" ry="38"/></g>`),
    part(`<g fill="${C.green}"><circle cx="176" cy="126" r="52"/><circle cx="424" cy="126" r="52"/></g><g fill="${C.creamShade}"><circle cx="176" cy="126" r="27"/><circle cx="424" cy="126" r="27"/></g>`),
    part(`<circle cx="300" cy="252" r="158" fill="${C.green}"/>`),
    part(`<ellipse cx="300" cy="300" rx="78" ry="56" fill="${C.cream}"/><ellipse cx="300" cy="276" rx="22" ry="15" fill="${C.greenDeep}"/>
      ${blush}${eyes}${mouth}`, { shadow: { dx: 2, dy: 4, blur: 4, a: 0.3 }, rim: 0.3 }),
    // knitted scarf, the one warm thing he always wears
    part(`<path d="M150 380 Q300 450 450 380 L458 418 Q300 494 142 418Z" fill="${C.gold}"/>
      <path d="M380 430 L420 540 L384 548 L352 444Z" fill="${C.gold}"/>
      <path d="M160 398 Q300 464 440 398" stroke="${C.brown}" stroke-width="4" fill="none" opacity="0.6" stroke-dasharray="3 9"/>`),
  ]);
}

/* ======================= NINI (400 x 560) ======================= */
function nini(expr) {
  const tilt = expr === "curious" ? `rotate(-7 200 210)` : "";
  const eyes = {
    happy: `<path d="M160 206 Q172 192 184 206" stroke="${C.ink}" stroke-width="6" fill="none" stroke-linecap="round"/>
            <path d="M216 206 Q228 192 240 206" stroke="${C.ink}" stroke-width="6" fill="none" stroke-linecap="round"/>`,
    curious: `<circle cx="172" cy="204" r="9" fill="${C.ink}"/><circle cx="228" cy="204" r="9" fill="${C.ink}"/>
              <circle cx="175" cy="201" r="3" fill="#fff"/><circle cx="231" cy="201" r="3" fill="#fff"/>`,
    worried: `<circle cx="172" cy="208" r="8" fill="${C.ink}"/><circle cx="228" cy="208" r="8" fill="${C.ink}"/>
              <path d="M156 186 L184 180" stroke="${C.brownDeep}" stroke-width="4.5" stroke-linecap="round"/>
              <path d="M244 186 L216 180" stroke="${C.brownDeep}" stroke-width="4.5" stroke-linecap="round"/>`,
    blink: `<path d="M162 206 L182 206" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"/>
            <path d="M218 206 L238 206" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"/>`,
  }[expr];
  const mouth = {
    happy: `<path d="M186 232 Q200 250 214 232Z" fill="${C.boot}"/>`,
    curious: `<ellipse cx="200" cy="238" rx="7" ry="8" fill="${C.boot}"/>`,
    worried: `<path d="M188 240 Q200 230 212 240" stroke="${C.ink}" stroke-width="4" fill="none" stroke-linecap="round"/>`,
    blink: `<path d="M190 234 Q200 242 210 234" stroke="${C.ink}" stroke-width="4" fill="none" stroke-linecap="round"/>`,
  }[expr];
  const curls = [140, 165, 190, 215, 240, 262].map((x, i) => `<circle cx="${x}" cy="${150 - (i % 2) * 8}" r="20"/>`).join("");
  return sprite(400, 560, [
    base(`<g fill="${C.boot}"><rect x="138" y="486" width="52" height="60" rx="16"/><rect x="210" y="486" width="52" height="60" rx="16"/></g>`),
    part(`<g fill="${C.yellowShade}"><ellipse cx="96" cy="380" rx="30" ry="74" transform="rotate(14 96 380)"/><ellipse cx="304" cy="380" rx="30" ry="74" transform="rotate(-14 304 380)"/></g>
      <g fill="${C.white}"><circle cx="86" cy="446" r="20"/><circle cx="314" cy="446" r="20"/></g>`),
    part(`<path d="M118 300 Q200 268 282 300 L314 500 Q200 528 86 500Z" fill="${C.yellow}"/>
      <path d="M200 292 L200 512" stroke="${C.yellowShade}" stroke-width="5"/>
      <g fill="${C.brownDeep}"><circle cx="216" cy="340" r="7"/><circle cx="216" cy="392" r="7"/><circle cx="216" cy="444" r="7"/></g>`),
    part(`<g transform="${tilt}"><path d="M86 214 Q86 72 200 72 Q314 72 314 214 Q314 300 200 304 Q86 300 86 214Z" fill="${C.yellow}"/>
      <ellipse cx="88" cy="200" rx="40" ry="18" transform="rotate(-24 88 200)" fill="${C.white}"/>
      <ellipse cx="312" cy="200" rx="40" ry="18" transform="rotate(24 312 200)" fill="${C.white}"/>
      <ellipse cx="88" cy="200" rx="22" ry="8" transform="rotate(-24 88 200)" fill="${C.rose}"/>
      <ellipse cx="312" cy="200" rx="22" ry="8" transform="rotate(24 312 200)" fill="${C.rose}"/></g>`),
    part(`<g transform="${tilt}"><ellipse cx="200" cy="212" rx="80" ry="72" fill="${C.white}"/><g fill="${C.white}">${curls}</g>
      <ellipse cx="148" cy="232" rx="14" ry="8" fill="${C.rose}"/><ellipse cx="252" cy="232" rx="14" ry="8" fill="${C.rose}"/>
      ${eyes}${mouth}</g>`, { shadow: { dx: 2, dy: 4, blur: 4, a: 0.32 } }),
  ]);
}

/* ======================= SMALL GREEN BELL (256 x 256) ======================= */
function bell() {
  return sprite(256, 256, [
    part(`<path d="M128 40 q-18 0 -18 -14 q0 -12 18 -12 q18 0 18 12 q0 14 -18 14" stroke="${C.greenDeep}" stroke-width="8" fill="none"/>
      <path d="M128 46 C70 46 64 120 58 170 L50 188 L206 188 L198 170 C192 120 186 46 128 46Z" fill="${C.green}"/>
      <path d="M94 80 C80 110 78 140 76 168" stroke="${C.greenLight}" stroke-width="10" fill="none" stroke-linecap="round"/>`, { shadow: { dx: 3, dy: 6, blur: 6, a: 0.4 } }),
    part(`<rect x="44" y="182" width="168" height="18" rx="9" fill="${C.greenDeep}"/><circle cx="128" cy="214" r="18" fill="${C.gold}"/>`),
  ], { body: `<path d="M128 46 C70 46 64 120 58 170 L50 188 L206 188 L198 170 C192 120 186 46 128 46Z" fill="${C.greenLight}"/>`, passes: [[16, 0.18]] });
}

/* ======================= THE TOWN (500 x 720, feet at the bottom centre) ======================= */

function eyes(kind, y, gap, col = C.ink) {
  const l = 250 - gap, r = 250 + gap;
  if (kind === "sad")
    return `<circle cx="${l}" cy="${y + 4}" r="8" fill="${col}"/><circle cx="${r}" cy="${y + 4}" r="8" fill="${col}"/>
      <path d="M${l - 16} ${y - 8} L${l + 12} ${y - 19}" stroke="${col}" stroke-width="5" stroke-linecap="round"/>
      <path d="M${r + 16} ${y - 8} L${r - 12} ${y - 19}" stroke="${col}" stroke-width="5" stroke-linecap="round"/>`;
  if (kind === "closed")
    return `<path d="M${l - 10} ${y} L${l + 10} ${y}" stroke="${col}" stroke-width="5" stroke-linecap="round"/><path d="M${r - 10} ${y} L${r + 10} ${y}" stroke="${col}" stroke-width="5" stroke-linecap="round"/>`;
  return `<circle cx="${l}" cy="${y}" r="9" fill="${col}"/><circle cx="${r}" cy="${y}" r="9" fill="${col}"/>
    <circle cx="${l + 3}" cy="${y - 3}" r="2.6" fill="#fff"/><circle cx="${r + 3}" cy="${y - 3}" r="2.6" fill="#fff"/>`;
}
function mouth(kind, y) {
  if (kind === "sad") return `<path d="M236 ${y + 6} Q250 ${y - 4} 264 ${y + 6}" stroke="${C.ink}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  if (kind === "smile") return `<path d="M236 ${y} Q250 ${y + 12} 264 ${y}" stroke="${C.ink}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  return `<path d="M240 ${y + 2} L260 ${y + 2}" stroke="${C.ink}" stroke-width="4" stroke-linecap="round"/>`;
}
const blush = (lx, rx, y) => `<ellipse cx="${lx}" cy="${y}" rx="15" ry="8" fill="${C.rose}"/><ellipse cx="${rx}" cy="${y}" rx="15" ry="8" fill="${C.rose}"/>`;

// legs + arms (one sheet, behind), then the coat (one sheet)
function coat(col, shade, o = {}) {
  const top = o.top || 360, w = o.w || 120, arm = o.armLen || 100;
  return [
    base(`<g fill="${o.shoes || C.brownDeep}"><rect x="180" y="660" width="54" height="44" rx="16"/><rect x="266" y="660" width="54" height="44" rx="16"/></g>
      <g fill="${shade}"><ellipse cx="${250 - w + 8}" cy="${top + 120}" rx="30" ry="${arm}" transform="rotate(12 ${250 - w + 8} ${top + 120})"/>
      <ellipse cx="${250 + w - 8}" cy="${top + 120}" rx="30" ry="${arm}" transform="rotate(-12 ${250 + w - 8} ${top + 120})"/></g>`),
    part(`<path d="M${250 - w + 30} ${top} Q250 ${top - 30} ${250 + w - 30} ${top} L${250 + w} 676 Q250 700 ${250 - w} 676Z" fill="${col}"/>
      <path d="M${250 - w + 6} 652 Q250 700 ${250 + w - 6} 652" stroke="${shade}" stroke-width="5" fill="none"/>`),
  ];
}
const town = (plies) => sprite(500, 720, plies.flat());

function lily(expr) {
  let quills = "";
  for (let i = 0; i < 13; i++) {
    const a = (-170 + i * 13) * Math.PI / 180;
    const x = 250 + Math.cos(a) * 118, y = 230 + Math.sin(a) * 118, x2 = 250 + Math.cos(a) * 168, y2 = 230 + Math.sin(a) * 168;
    const px = -Math.sin(a) * 22, py = Math.cos(a) * 22;
    quills += `<path d="M${(x - px).toFixed(1)} ${(y - py).toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)} L${(x + px).toFixed(1)} ${(y + py).toFixed(1)}Z" fill="${i % 2 ? "#6B4E3B" : "#80614A"}"/>`;
  }
  return town([
    coat("#C98B7E", "#A86F64", { shoes: C.brownDeep }),
    part(`<path d="M190 400 L310 400 L330 650 L170 650Z" fill="#6E8C7A"/><path d="M200 430 L300 430" stroke="${C.cream}" stroke-width="3"/>`),
    part(quills),
    part(`<circle cx="250" cy="240" r="112" fill="#E8D6BE"/>`),
    part(`<ellipse cx="250" cy="282" rx="52" ry="40" fill="#F3E7D6"/><circle cx="250" cy="262" r="11" fill="${C.ink}"/>
      ${eyes(expr === "sad" ? "sad" : "open", 222, 42)}${mouth(expr === "sad" ? "sad" : "smile", 296)}${blush(190, 310, 270)}`, { shadow: { dx: 2, dy: 4, blur: 4, a: 0.3 } }),
    part(`<circle cx="330" cy="160" r="16" fill="#D9776B"/><circle cx="346" cy="172" r="12" fill="${C.gold}"/>`),
  ]);
}
function finch(expr) {
  return town([
    coat("#2F3B4C", "#253040", { w: 140, top: 330, shoes: C.gold }),
    part(`<path d="M200 360 L250 420 L300 360" stroke="${C.cream}" stroke-width="10" fill="none"/>
      <rect x="300" y="460" width="70" height="92" rx="6" fill="${C.creamShade}"/><rect x="318" y="452" width="34" height="14" rx="4" fill="${C.brownDeep}"/>
      <path d="M314 490 L356 490 M314 510 L350 510 M314 530 L344 530" stroke="${C.brown}" stroke-width="3"/>`),
    part(`<path d="M232 128 Q250 70 262 128Z" fill="#8A5B44"/><path d="M250 126 Q280 84 284 132Z" fill="#8A5B44"/><circle cx="250" cy="240" r="118" fill="#B8846A"/>`),
    part(`<path d="M150 260 Q250 380 350 260 Q330 340 250 352 Q170 340 150 260Z" fill="#E7C9A8"/>
      ${eyes(expr === "sad" ? "sad" : "open", 228, 46)}<path d="M232 262 L268 262 L250 296Z" fill="${C.gold}"/>${blush(186, 314, 276)}`, { shadow: { dx: 2, dy: 4, blur: 4, a: 0.3 } }),
  ]);
}
function mabel(expr) {
  return town([
    coat("#7C8A93", "#66737B", { shoes: "#3B3633" }),
    part(`<path d="M186 410 L314 410 L326 660 L174 660Z" fill="${C.cream}"/><path d="M196 410 Q250 450 304 410" stroke="${C.creamShade}" stroke-width="6" fill="none"/>`),
    part(`<rect x="292" y="500" width="44" height="50" rx="8" fill="${C.brown}"/><path d="M336 512 q18 0 18 14 q0 14 -18 14" stroke="${C.brown}" stroke-width="6" fill="none"/>`),
    part(`<path d="M150 170 L172 70 L232 130Z" fill="#A9A4A0"/><path d="M350 170 L328 70 L268 130Z" fill="#A9A4A0"/>
      <path d="M168 150 L178 100 L210 132Z" fill="${C.rose}"/><path d="M332 150 L322 100 L290 132Z" fill="${C.rose}"/><circle cx="250" cy="236" r="114" fill="#A9A4A0"/>`),
    part(`<path d="M196 150 Q250 132 304 150" stroke="#8D8884" stroke-width="10" fill="none"/><ellipse cx="250" cy="282" rx="58" ry="40" fill="#E9E3DA"/>
      <path d="M240 262 L260 262 L250 274Z" fill="${C.rose}"/>${eyes(expr === "sad" ? "sad" : "open", 226, 44, "#3A4A3A")}${mouth(expr === "sad" ? "sad" : "smile", 288)}
      <path d="M190 280 L140 270 M190 290 L138 296 M310 280 L360 270 M310 290 L362 296" stroke="${C.ink}" stroke-width="2.5"/>`, { shadow: { dx: 2, dy: 4, blur: 4, a: 0.3 } }),
  ]);
}
function oliver(expr) {
  return town([
    coat("#27324A", "#1E283C", { w: 132, shoes: "#14181C" }),
    part(`<rect x="236" y="380" width="28" height="260" fill="#1E283C"/><g fill="${C.gold}"><circle cx="250" cy="420" r="6"/><circle cx="250" cy="470" r="6"/><circle cx="250" cy="520" r="6"/></g>
      <rect x="310" y="430" width="34" height="58" rx="6" fill="#14181C"/><rect x="322" y="404" width="6" height="30" fill="#14181C"/>`),
    part(`<path d="M150 160 L170 112 L200 150Z" fill="#6E5644"/><path d="M350 160 L330 112 L300 150Z" fill="#6E5644"/><circle cx="250" cy="240" r="120" fill="#8A6F5A"/>`),
    part(`<circle cx="206" cy="236" r="46" fill="#E9DEC6"/><circle cx="294" cy="236" r="46" fill="#E9DEC6"/>
      ${expr === "sad"
        ? `<circle cx="206" cy="242" r="14" fill="${C.ink}"/><circle cx="294" cy="242" r="14" fill="${C.ink}"/><path d="M168 214 L238 198 M332 214 L262 198" stroke="#5E4A3C" stroke-width="8" stroke-linecap="round"/>`
        : `<circle cx="206" cy="236" r="16" fill="${C.ink}"/><circle cx="294" cy="236" r="16" fill="${C.ink}"/><circle cx="211" cy="231" r="4" fill="#fff"/><circle cx="299" cy="231" r="4" fill="#fff"/>`}
      <path d="M238 270 L262 270 L250 300Z" fill="${C.gold}"/>`, { shadow: { dx: 2, dy: 4, blur: 4, a: 0.3 } }),
    part(`<path d="M140 150 Q250 70 360 150 L352 172 Q250 150 148 172Z" fill="#1B2433"/><rect x="132" y="164" width="236" height="20" rx="10" fill="#14181C"/><circle cx="250" cy="130" r="13" fill="${C.gold}"/>`),
  ]);
}
function hazel(expr) {
  return town([
    coat("#F1EEE8", "#D9D4CB", { w: 126, shoes: "#5E6A70" }),
    part(`<path d="M214 380 L250 470 L286 380Z" fill="#7FA3A8"/><path d="M196 400 Q170 500 214 540" stroke="#3B474D" stroke-width="6" fill="none"/>
      <circle cx="216" cy="546" r="12" fill="#9AA6AB"/><rect x="292" y="470" width="40" height="8" fill="#9AA6AB"/>`),
    part(`<ellipse cx="150" cy="190" rx="70" ry="26" transform="rotate(-24 150 190)" fill="#A57D5E"/><ellipse cx="350" cy="190" rx="70" ry="26" transform="rotate(24 350 190)" fill="#A57D5E"/>
      <ellipse cx="150" cy="190" rx="44" ry="12" transform="rotate(-24 150 190)" fill="#E7C9A8"/><ellipse cx="350" cy="190" rx="44" ry="12" transform="rotate(24 350 190)" fill="#E7C9A8"/>`),
    part(`<ellipse cx="250" cy="236" rx="100" ry="116" fill="#B58A68"/>`),
    part(`<ellipse cx="250" cy="300" rx="50" ry="44" fill="#EAD6BF"/><ellipse cx="250" cy="276" rx="14" ry="10" fill="${C.ink}"/>
      ${eyes(expr === "sad" ? "sad" : "open", 222, 40)}${mouth(expr === "sad" ? "sad" : "flat", 314)}`, { shadow: { dx: 2, dy: 4, blur: 4, a: 0.3 } }),
  ]);
}
function fox(expr) {
  return town([
    coat("#B9A27E", "#9E8865", { w: 134, shoes: "#3B3633" }),
    part(`<path d="M214 372 L250 430 L286 372" stroke="#8A7556" stroke-width="10" fill="none"/>
      <rect x="300" y="470" width="62" height="80" rx="4" fill="${C.cream}"/><path d="M310 492 L352 492 M310 510 L346 510 M310 528 L338 528" stroke="${C.brown}" stroke-width="3"/>
      <rect x="346" y="440" width="8" height="70" rx="3" transform="rotate(20 350 470)" fill="${C.gold}"/>`),
    part(`<path d="M150 190 L176 60 L236 140Z" fill="#C8693E"/><path d="M350 190 L324 60 L264 140Z" fill="#C8693E"/>
      <path d="M168 168 L180 96 L216 140Z" fill="#3B2A22"/><path d="M332 168 L320 96 L284 140Z" fill="#3B2A22"/><circle cx="250" cy="236" r="112" fill="#D27A47"/>`),
    part(`<path d="M150 250 Q250 400 350 250 Q320 330 250 340 Q180 330 150 250Z" fill="#F3E7D6"/><ellipse cx="250" cy="300" rx="14" ry="10" fill="${C.ink}"/>
      ${eyes(expr === "sad" ? "sad" : "open", 226, 44)}`, { shadow: { dx: 2, dy: 4, blur: 4, a: 0.3 } }),
  ]);
}
function moss(expr) {
  return town([
    coat("#D9783F", "#B8612F", { w: 136, shoes: "#3B3633" }),
    part(`<rect x="200" y="400" width="100" height="250" fill="#3E5A6B"/><rect x="200" y="400" width="18" height="60" fill="#3E5A6B"/>
      <rect x="300" y="470" width="30" height="70" rx="8" fill="#20262B"/><circle cx="315" cy="466" r="12" fill="${C.gold}"/>`),
    part(`<circle cx="250" cy="250" r="112" fill="#5A4F4A"/>`),
    part(`<ellipse cx="250" cy="300" rx="56" ry="42" fill="#7A6D66"/><ellipse cx="250" cy="286" rx="26" ry="18" fill="#E39A9A"/>
      ${expr === "sad"
        ? `<path d="M206 240 L226 244 M294 240 L274 244" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"/><path d="M196 232 L230 220 M304 232 L270 220" stroke="${C.ink}" stroke-width="4" stroke-linecap="round"/>`
        : `<circle cx="214" cy="244" r="6" fill="${C.ink}"/><circle cx="286" cy="244" r="6" fill="${C.ink}"/>`}
      ${mouth(expr === "sad" ? "sad" : "flat", 320)}`, { shadow: { dx: 2, dy: 4, blur: 4, a: 0.3 } }),
    part(`<path d="M138 196 Q250 60 362 196Z" fill="${C.yellow}"/><rect x="124" y="188" width="252" height="22" rx="10" fill="${C.yellowShade}"/><rect x="240" y="100" width="20" height="92" fill="${C.yellowShade}"/>`),
  ]);
}
function niniAdult(expr) {
  return town([
    coat(C.yellow, C.yellowShade, { w: 116, top: 350, shoes: "#6B4E3B", armLen: 120 }),
    part(`<ellipse cx="162" cy="210" rx="44" ry="18" transform="rotate(-24 162 210)" fill="${C.white}"/><ellipse cx="338" cy="210" rx="44" ry="18" transform="rotate(24 338 210)" fill="${C.white}"/>`),
    part(`<ellipse cx="250" cy="236" rx="92" ry="104" fill="${C.white}"/>
      <g fill="#F3EBDD">${[178, 206, 234, 262, 290, 318].map((x, i) => `<circle cx="${x}" cy="${148 - (i % 2) * 8}" r="24"/>`).join("")}
      ${[160, 340].map((x) => `<circle cx="${x}" cy="230" r="22"/><circle cx="${x}" cy="270" r="20"/>`).join("")}</g>`),
    part(`${eyes(expr === "sad" ? "sad" : expr === "closed" ? "closed" : "open", 236, 38)}${mouth(expr === "sad" ? "sad" : "smile", 292)}${blush(196, 304, 270)}`, { shadow: false, rim: 0, under: 0 }),
    // a big, chunky knitted scarf, in the bear's green
    part(`<path d="M150 330 Q250 380 350 330 L362 410 Q250 470 138 410Z" fill="${C.green}"/>
      <path d="M154 352 Q250 400 346 352 M150 380 Q250 432 352 380" stroke="${C.greenLight}" stroke-width="7" fill="none"/>`),
    part(`<path d="M262 400 L330 410 L346 560 L282 566Z" fill="${C.green}"/><path d="M272 440 L336 446 M278 480 L340 486 M282 520 L344 526" stroke="${C.greenLight}" stroke-width="7"/>
      <path d="M282 566 l6 22 M298 565 l4 22 M314 564 l2 22 M330 563 l0 22 M344 562 l-2 22" stroke="${C.greenShade}" stroke-width="6" stroke-linecap="round"/>`),
  ]);
}

module.exports = {
  sprites: {
    bear_neutral: () => bear("neutral"), bear_happy: () => bear("happy"), bear_worried: () => bear("worried"),
    bear_searching: () => bear("searching"), bear_blink: () => bear("blink"),
    nini_happy: () => nini("happy"), nini_curious: () => nini("curious"), nini_worried: () => nini("worried"), nini_blink: () => nini("blink"),
    bell,
    lily_neutral: () => lily("neutral"), lily_worried: () => lily("sad"),
    finch_neutral: () => finch("neutral"), finch_worried: () => finch("sad"),
    mabel_neutral: () => mabel("neutral"), mabel_worried: () => mabel("sad"),
    oliver_neutral: () => oliver("neutral"), oliver_worried: () => oliver("sad"),
    hazel_neutral: () => hazel("neutral"), hazel_worried: () => hazel("sad"),
    fox_neutral: () => fox("neutral"), fox_worried: () => fox("sad"),
    moss_neutral: () => moss("neutral"), moss_worried: () => moss("sad"),
    niniadult_neutral: () => niniAdult("neutral"), niniadult_blink: () => niniAdult("closed"), niniadult_worried: () => niniAdult("sad"),
  },
  part, base,
};
