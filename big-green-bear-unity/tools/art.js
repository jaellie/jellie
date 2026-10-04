/*
 * art.js — draws every sprite of the Unity visual prototype as SVG.
 *
 * All art is original and procedural ($0, no licences to worry about).
 * Style: storybook flat shapes, a little hand-wobble on the edges, paper grain.
 * Palette comes from the visual brief (warm world → transition → broken memory).
 *
 * `node tools/render-art.js` turns these into transparent PNGs inside
 * Assets/BigGreenBear/Resources/BGB/Art/.
 */
const P = {
  cream: "#F3EBDD",
  creamShade: "#E2D6C0",
  green: "#6F8F72",
  greenShade: "#587659",
  greenDeep: "#2E3A32",
  gold: "#D8A85C",
  goldLight: "#F2C877",
  brown: "#8A6F5A",
  brownDeep: "#5E4A3C",
  navy: "#1B2433",
  slate: "#293238",
  slate2: "#323D45",
  teal: "#58726A",
  blueGray: "#758795",
  yellow: "#E6BE58",
  yellowShade: "#C99F3D",
  rose: "#C98B7E",
  boot: "#9C5442",
  ink: "#20262B",
};

// Shared filters: paper grain + hand wobble. `seed` keeps each sprite unique but stable.
function defs(seed, wobble = 2.2) {
  return `
  <defs>
    <filter id="wob" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="${seed}" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="${wobble}" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <filter id="grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="${seed + 7}" result="t"/>
      <feColorMatrix in="t" type="matrix" values="0 0 0 0 0.12  0 0 0 0 0.10  0 0 0 0 0.08  0 0 0 0.55 0" result="g"/>
      <feComposite in="g" in2="SourceGraphic" operator="in" result="gi"/>
      <feBlend in="SourceGraphic" in2="gi" mode="multiply"/>
    </filter>
    <filter id="soft"><feGaussianBlur stdDeviation="6"/></filter>
    <filter id="softer"><feGaussianBlur stdDeviation="14"/></filter>
    <filter id="blurfar"><feGaussianBlur stdDeviation="2.2"/></filter>
  </defs>`;
}
const svg = (w, h, seed, body, wobble) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${defs(seed, wobble)}<g filter="url(#grain)"><g filter="url(#wob)">${body}</g></g></svg>`;

// deterministic random
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

/* ======================= BIG GREEN BEAR ======================= */
/* 600 x 820, feet at the bottom centre (pivot = bottom centre). */
function bear(expr) {
  const eyes = {
    neutral: `<circle cx="248" cy="236" r="11" fill="${P.ink}"/><circle cx="352" cy="236" r="11" fill="${P.ink}"/>
              <circle cx="252" cy="232" r="3.2" fill="${P.cream}"/><circle cx="356" cy="232" r="3.2" fill="${P.cream}"/>`,
    happy: `<path d="M233 240 Q248 222 263 240" stroke="${P.ink}" stroke-width="7" fill="none" stroke-linecap="round"/>
            <path d="M337 240 Q352 222 367 240" stroke="${P.ink}" stroke-width="7" fill="none" stroke-linecap="round"/>`,
    worried: `<circle cx="248" cy="240" r="10" fill="${P.ink}"/><circle cx="352" cy="240" r="10" fill="${P.ink}"/>
              <path d="M228 212 L266 202" stroke="${P.greenDeep}" stroke-width="6" stroke-linecap="round"/>
              <path d="M372 212 L334 202" stroke="${P.greenDeep}" stroke-width="6" stroke-linecap="round"/>`,
    searching: `<circle cx="258" cy="234" r="11" fill="${P.ink}"/><circle cx="362" cy="234" r="11" fill="${P.ink}"/>
                <circle cx="263" cy="231" r="3" fill="${P.cream}"/><circle cx="367" cy="231" r="3" fill="${P.cream}"/>`,
    blink: `<path d="M236 238 L260 238" stroke="${P.ink}" stroke-width="6" stroke-linecap="round"/>
            <path d="M340 238 L364 238" stroke="${P.ink}" stroke-width="6" stroke-linecap="round"/>`,
  }[expr];
  const mouth = {
    neutral: `<path d="M286 318 Q300 328 314 318" stroke="${P.ink}" stroke-width="5" fill="none" stroke-linecap="round"/>`,
    happy: `<path d="M280 314 Q300 340 320 314 Z" fill="${P.brownDeep}"/>`,
    worried: `<path d="M286 326 Q293 318 300 324 Q307 330 314 322" stroke="${P.ink}" stroke-width="5" fill="none" stroke-linecap="round"/>`,
    searching: `<ellipse cx="302" cy="322" rx="8" ry="9" fill="${P.brownDeep}"/>`,
    blink: `<path d="M286 318 Q300 328 314 318" stroke="${P.ink}" stroke-width="5" fill="none" stroke-linecap="round"/>`,
  }[expr];
  const blush = expr === "happy" || expr === "neutral" || expr === "blink"
    ? `<ellipse cx="214" cy="292" rx="22" ry="12" fill="${P.rose}" opacity="0.45"/><ellipse cx="386" cy="292" rx="22" ry="12" fill="${P.rose}" opacity="0.45"/>`
    : "";
  const body = `
    <!-- soft contact shadow -->
    <ellipse cx="300" cy="806" rx="190" ry="16" fill="#000" opacity="0.28" filter="url(#soft)"/>
    <!-- legs -->
    <ellipse cx="222" cy="768" rx="74" ry="46" fill="${P.greenShade}"/>
    <ellipse cx="378" cy="768" rx="74" ry="46" fill="${P.greenShade}"/>
    <ellipse cx="222" cy="782" rx="48" ry="20" fill="${P.creamShade}" opacity="0.8"/>
    <ellipse cx="378" cy="782" rx="48" ry="20" fill="${P.creamShade}" opacity="0.8"/>
    <!-- arms (behind body) -->
    <ellipse cx="118" cy="560" rx="56" ry="120" transform="rotate(18 118 560)" fill="${P.greenShade}"/>
    <ellipse cx="482" cy="560" rx="56" ry="120" transform="rotate(-18 482 560)" fill="${P.greenShade}"/>
    <!-- body -->
    <ellipse cx="300" cy="560" rx="196" ry="222" fill="${P.green}"/>
    <path d="M140 640 Q300 800 460 640 Q430 760 300 780 Q170 760 140 640Z" fill="${P.greenShade}" opacity="0.7"/>
    <ellipse cx="300" cy="590" rx="112" ry="140" fill="${P.cream}" opacity="0.92"/>
    <!-- a faint seam: you'd never notice it. (You will, later.) -->
    <path d="M206 404 Q300 424 394 404" stroke="${P.greenDeep}" stroke-width="2" fill="none" opacity="0.35" stroke-dasharray="6 7"/>
    <!-- paws -->
    <ellipse cx="96" cy="664" rx="44" ry="38" fill="${P.green}"/>
    <ellipse cx="504" cy="664" rx="44" ry="38" fill="${P.green}"/>
    <!-- ears -->
    <circle cx="176" cy="126" r="52" fill="${P.green}"/><circle cx="424" cy="126" r="52" fill="${P.green}"/>
    <circle cx="176" cy="126" r="27" fill="${P.creamShade}"/><circle cx="424" cy="126" r="27" fill="${P.creamShade}"/>
    <!-- head -->
    <circle cx="300" cy="252" r="158" fill="${P.green}"/>
    <path d="M150 300 Q300 430 450 300 Q420 400 300 410 Q180 400 150 300Z" fill="${P.greenShade}" opacity="0.55"/>
    <ellipse cx="300" cy="300" rx="78" ry="56" fill="${P.cream}"/>
    <ellipse cx="300" cy="276" rx="22" ry="15" fill="${P.greenDeep}"/>
    <ellipse cx="294" cy="271" rx="6" ry="3.5" fill="${P.cream}" opacity="0.6"/>
    ${blush}${eyes}${mouth}
    <!-- knitted scarf, the one warm thing he always wears -->
    <path d="M150 380 Q300 450 450 380 L458 418 Q300 494 142 418Z" fill="${P.gold}"/>
    <path d="M160 396 Q300 462 440 396" stroke="${P.brown}" stroke-width="4" fill="none" opacity="0.5" stroke-dasharray="3 9"/>
    <path d="M380 430 L420 540 L384 548 L352 444Z" fill="${P.gold}"/>
    <path d="M384 532 L420 540 L384 548Z" fill="${P.brown}" opacity="0.6"/>`;
  return svg(600, 820, 11, body);
}

/* ======================= NINI ======================= */
/* 400 x 560, a little lamb in a yellow raincoat. */
function nini(expr) {
  const tilt = expr === "curious" ? `rotate(-7 200 210)` : "";
  const eyes = {
    happy: `<path d="M160 206 Q172 192 184 206" stroke="${P.ink}" stroke-width="6" fill="none" stroke-linecap="round"/>
            <path d="M216 206 Q228 192 240 206" stroke="${P.ink}" stroke-width="6" fill="none" stroke-linecap="round"/>`,
    curious: `<circle cx="172" cy="204" r="9" fill="${P.ink}"/><circle cx="228" cy="204" r="9" fill="${P.ink}"/>
              <circle cx="175" cy="201" r="3" fill="#fff"/><circle cx="231" cy="201" r="3" fill="#fff"/>`,
    worried: `<circle cx="172" cy="208" r="8" fill="${P.ink}"/><circle cx="228" cy="208" r="8" fill="${P.ink}"/>
              <path d="M156 186 L184 180" stroke="${P.brownDeep}" stroke-width="4.5" stroke-linecap="round"/>
              <path d="M244 186 L216 180" stroke="${P.brownDeep}" stroke-width="4.5" stroke-linecap="round"/>`,
    blink: `<path d="M162 206 L182 206" stroke="${P.ink}" stroke-width="5" stroke-linecap="round"/>
            <path d="M218 206 L238 206" stroke="${P.ink}" stroke-width="5" stroke-linecap="round"/>`,
  }[expr];
  const mouth = {
    happy: `<path d="M186 232 Q200 250 214 232Z" fill="${P.boot}"/>`,
    curious: `<ellipse cx="200" cy="238" rx="7" ry="8" fill="${P.boot}"/>`,
    worried: `<path d="M188 240 Q200 230 212 240" stroke="${P.ink}" stroke-width="4" fill="none" stroke-linecap="round"/>`,
    blink: `<path d="M190 234 Q200 242 210 234" stroke="${P.ink}" stroke-width="4" fill="none" stroke-linecap="round"/>`,
  }[expr];
  const curls = [140, 165, 190, 215, 240, 262].map((x, i) => `<circle cx="${x}" cy="${150 - (i % 2) * 8}" r="20" fill="#FBF7EE"/>`).join("");
  const body = `
    <ellipse cx="200" cy="548" rx="120" ry="12" fill="#000" opacity="0.28" filter="url(#soft)"/>
    <!-- boots -->
    <rect x="138" y="486" width="52" height="60" rx="16" fill="${P.boot}"/>
    <rect x="210" y="486" width="52" height="60" rx="16" fill="${P.boot}"/>
    <!-- raincoat -->
    <path d="M118 300 Q200 268 282 300 L314 500 Q200 528 86 500Z" fill="${P.yellow}"/>
    <path d="M200 290 L200 512" stroke="${P.yellowShade}" stroke-width="5"/>
    <circle cx="216" cy="340" r="7" fill="${P.brownDeep}"/><circle cx="216" cy="392" r="7" fill="${P.brownDeep}"/><circle cx="216" cy="444" r="7" fill="${P.brownDeep}"/>
    <path d="M96 470 Q200 500 304 470 L314 500 Q200 528 86 500Z" fill="${P.yellowShade}" opacity="0.7"/>
    <!-- arms -->
    <ellipse cx="96" cy="380" rx="30" ry="74" transform="rotate(14 96 380)" fill="${P.yellow}"/>
    <ellipse cx="304" cy="380" rx="30" ry="74" transform="rotate(-14 304 380)" fill="${P.yellow}"/>
    <circle cx="86" cy="446" r="20" fill="#FBF7EE"/><circle cx="314" cy="446" r="20" fill="#FBF7EE"/>
    <g transform="${tilt}">
      <!-- hood -->
      <path d="M86 214 Q86 72 200 72 Q314 72 314 214 Q314 300 200 304 Q86 300 86 214Z" fill="${P.yellow}"/>
      <!-- lamb ears poking out -->
      <ellipse cx="88" cy="200" rx="40" ry="18" transform="rotate(-24 88 200)" fill="#FBF7EE"/>
      <ellipse cx="312" cy="200" rx="40" ry="18" transform="rotate(24 312 200)" fill="#FBF7EE"/>
      <ellipse cx="88" cy="200" rx="22" ry="8" transform="rotate(-24 88 200)" fill="${P.rose}" opacity="0.5"/>
      <ellipse cx="312" cy="200" rx="22" ry="8" transform="rotate(24 312 200)" fill="${P.rose}" opacity="0.5"/>
      <!-- face -->
      <ellipse cx="200" cy="212" rx="80" ry="72" fill="#FBF7EE"/>
      ${curls}
      <ellipse cx="148" cy="232" rx="16" ry="9" fill="${P.rose}" opacity="0.5"/>
      <ellipse cx="252" cy="232" rx="16" ry="9" fill="${P.rose}" opacity="0.5"/>
      ${eyes}${mouth}
      <path d="M100 250 Q200 330 300 250" stroke="${P.yellowShade}" stroke-width="6" fill="none" opacity="0.6"/>
    </g>`;
  return svg(400, 560, 23, body);
}

/* ======================= SMALL GREEN BELL ======================= */
function bell() {
  const body = `
    <path d="M128 40 q-18 0 -18 -14 q0 -12 18 -12 q18 0 18 12 q0 14 -18 14" stroke="${P.greenDeep}" stroke-width="8" fill="none"/>
    <path d="M128 46 C70 46 64 120 58 170 L50 188 L206 188 L198 170 C192 120 186 46 128 46Z" fill="#4E7A5A"/>
    <path d="M94 80 C80 110 78 140 76 168" stroke="#9CC3A0" stroke-width="10" fill="none" stroke-linecap="round" opacity="0.7"/>
    <rect x="44" y="182" width="168" height="18" rx="9" fill="${P.greenDeep}"/>
    <circle cx="128" cy="214" r="18" fill="${P.gold}"/>
    <path d="M150 46 l34 -18 l-6 28z" fill="${P.cream}" opacity="0.9"/>`;
  return svg(256, 256, 31, body, 1.2);
}

/* ======================= FAR LAYER: sky, town, town hall ======================= */
function far() {
  const r = rng(5);
  let stars = "";
  for (let i = 0; i < 60; i++) stars += `<circle cx="${(r() * 2048) | 0}" cy="${(r() * 420) | 0}" r="${(r() * 1.8 + 0.6).toFixed(1)}" fill="${P.cream}" opacity="${(r() * 0.5 + 0.15).toFixed(2)}"/>`;
  let houses = "";
  let x = -40;
  while (x < 2100) {
    const w = 110 + r() * 110;
    if (x > 820 && x < 1230) { x = 1230; continue; } // town hall gap
    const h = 150 + r() * 130;
    const top = 860 - h;
    const c = r() < 0.5 ? "#2A3441" : "#313B47";
    houses += `<rect x="${x}" y="${top}" width="${w}" height="${h + 300}" fill="${c}"/>`;
    houses += `<path d="M${x - 10} ${top} L${x + w / 2} ${top - 60 - r() * 40} L${x + w + 10} ${top}Z" fill="#232C37"/>`;
    for (let wy = top + 30; wy < 840; wy += 56) {
      for (let wx = x + 18; wx < x + w - 30; wx += 46) {
        if (r() < 0.45) houses += `<rect x="${wx}" y="${wy}" width="20" height="26" rx="3" fill="${P.goldLight}" opacity="${(0.55 + r() * 0.4).toFixed(2)}"/>`;
        else houses += `<rect x="${wx}" y="${wy}" width="20" height="26" rx="3" fill="#1D252E"/>`;
      }
    }
    x += w + 8 + r() * 30;
  }
  // 11:47 — hour hand: (11 + 47/60) * 30 = 353.5°, minute hand: 282°
  const hand = (deg, len, wdt) => {
    const a = ((deg - 90) * Math.PI) / 180;
    return `<line x1="1024" y1="380" x2="${(1024 + Math.cos(a) * len).toFixed(1)}" y2="${(380 + Math.sin(a) * len).toFixed(1)}" stroke="${P.ink}" stroke-width="${wdt}" stroke-linecap="round"/>`;
  };
  let ticks = "";
  for (let i = 0; i < 12; i++) {
    const a = (i * 30 * Math.PI) / 180;
    ticks += `<line x1="${1024 + Math.sin(a) * 50}" y1="${380 - Math.cos(a) * 50}" x2="${1024 + Math.sin(a) * 58}" y2="${380 - Math.cos(a) * 58}" stroke="${P.brownDeep}" stroke-width="${i % 3 ? 2 : 4}"/>`;
  }
  const body = `
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#18202D"/><stop offset="0.55" stop-color="#2B3646"/><stop offset="0.8" stop-color="#4E4A52"/><stop offset="1" stop-color="#5E5051"/>
    </linearGradient>
    <rect width="2048" height="1152" fill="url(#sky)"/>
    ${stars}
    <path d="M0 760 Q300 690 620 735 T1240 720 T2048 740 L2048 1152 L0 1152Z" fill="#26313A"/>
    ${houses}
    <!-- town hall -->
    <rect x="860" y="540" width="328" height="620" fill="#3A4048"/>
    <path d="M840 548 L1024 470 L1208 548Z" fill="#2C333B"/>
    <rect x="950" y="250" width="148" height="300" fill="#41474F"/>
    <path d="M936 256 L1024 150 L1112 256Z" fill="#2C333B"/>
    <rect x="1018" y="112" width="12" height="44" fill="#2C333B"/>
    ${[0, 1, 2].map((i) => `<rect x="${900 + i * 92}" y="600" width="52" height="96" rx="26" fill="${P.goldLight}" opacity="0.72"/>`).join("")}
    ${[0, 1, 2].map((i) => `<rect x="${900 + i * 92}" y="740" width="52" height="96" rx="26" fill="${P.goldLight}" opacity="0.55"/>`).join("")}
    <circle cx="1024" cy="380" r="72" fill="#2C333B"/>
    <circle cx="1024" cy="380" r="62" fill="${P.cream}"/>
    ${ticks}
    ${hand(353.5, 30, 7)}${hand(282, 46, 4.5)}
    <circle cx="1024" cy="380" r="5" fill="${P.ink}"/>`;
  return svg(2048, 1152, 41, body, 1.5);
}

/* ======================= MID LAYER: festival, stalls, fountain, gate ======================= */
function stall(x, stripeA, stripeB, goods) {
  let stripes = "";
  for (let i = 0; i < 8; i++) stripes += `<rect x="${x - 10 + i * 37.5}" y="690" width="37.5" height="70" fill="${i % 2 ? stripeA : stripeB}"/>`;
  let scallops = "";
  for (let i = 0; i < 8; i++) scallops += `<circle cx="${x + 8.75 + i * 37.5}" cy="760" r="18.75" fill="${i % 2 ? stripeA : stripeB}"/>`;
  return `
    <rect x="${x}" y="690" width="10" height="250" fill="${P.brownDeep}"/>
    <rect x="${x + 270}" y="690" width="10" height="250" fill="${P.brownDeep}"/>
    <rect x="${x - 6}" y="830" width="292" height="110" rx="6" fill="#6D5646"/>
    <rect x="${x - 6}" y="830" width="292" height="16" fill="#7E6552"/>
    ${goods}
    ${stripes}${scallops}
    <rect x="${x - 14}" y="680" width="308" height="14" rx="6" fill="${P.brownDeep}"/>`;
}
function mid() {
  const r = rng(9);
  // string lights: two catenaries
  const strand = (y0, sag, phase) => {
    let d = `M-20 ${y0}`;
    let bulbs = "";
    let i = 0;
    for (let x = -20; x <= 2068; x += 16, i++) {
      const t = ((x + 20) % 520) / 520;
      const y = y0 + Math.sin(t * Math.PI) * sag;
      d += ` L${x} ${y.toFixed(1)}`;
      if ((i + phase) % 4 === 0) {
        bulbs += `<circle cx="${x}" cy="${(y + 12).toFixed(1)}" r="18" fill="${P.goldLight}" opacity="0.28" filter="url(#soft)"/>`;
        bulbs += `<circle cx="${x}" cy="${(y + 12).toFixed(1)}" r="7.5" fill="${P.goldLight}"/>`;
      }
    }
    return `<path d="${d}" stroke="#1C2228" stroke-width="3" fill="none"/>${bulbs}`;
  };
  const flowers = Array.from({ length: 22 }, (_, i) =>
    `<circle cx="${140 + (i % 11) * 22}" cy="${820 - Math.floor(i / 11) * 16 - (i % 3) * 4}" r="${9 + (i % 3)}" fill="${["#E6A9A0", P.cream, "#D9776B", P.goldLight][i % 4]}"/>`).join("") +
    Array.from({ length: 8 }, (_, i) => `<path d="M${150 + i * 30} 830 l-6 -26" stroke="${P.green}" stroke-width="4"/>`).join("");
  const cider = Array.from({ length: 6 }, (_, i) => `<rect x="${530 + i * 38}" y="796" width="24" height="34" rx="4" fill="${P.cream}"/><rect x="${530 + i * 38}" y="796" width="24" height="10" rx="3" fill="${P.brown}"/>`).join("");
  const lanterns = Array.from({ length: 5 }, (_, i) => `<line x1="${1290 + i * 52}" y1="770" x2="${1290 + i * 52}" y2="788" stroke="#1C2228" stroke-width="2"/><ellipse cx="${1290 + i * 52}" cy="806" rx="18" ry="22" fill="${["#D9776B", P.goldLight, P.green][i % 3]}"/>`).join("");
  const body = `
    <!-- plaza floor seen at the back -->
    <rect x="0" y="930" width="2048" height="222" fill="#3E3B3A"/>
    ${strand(420, 70, 0)}
    ${strand(500, 54, 2)}
    <!-- banner -->
    <line x1="330" y1="588" x2="770" y2="588" stroke="#1C2228" stroke-width="3"/>
    <path d="M340 594 L760 594 L752 650 L348 650Z" fill="${P.cream}"/>
    <text x="550" y="631" text-anchor="middle" font-family="Georgia, serif" font-size="21" letter-spacing="3" fill="${P.greenDeep}">BELLFLOWER WINTER NIGHT</text>
    ${stall(110, P.cream, "#D9776B", flowers)}
    ${stall(500, P.cream, P.green, cider)}
    ${stall(1260, P.cream, P.gold, lanterns)}
    <!-- the old fountain -->
    <ellipse cx="1660" cy="900" rx="150" ry="34" fill="#5A5856"/>
    <rect x="1510" y="846" width="300" height="56" fill="#6A6764"/>
    <ellipse cx="1660" cy="846" rx="150" ry="30" fill="#7C7975"/>
    <ellipse cx="1660" cy="846" rx="128" ry="22" fill="#3B4650"/>
    <rect x="1646" y="760" width="28" height="90" fill="#6A6764"/>
    <ellipse cx="1660" cy="760" rx="50" ry="14" fill="#7C7975"/>
    <!-- the service passage: low iron gate, steps going down into the dark -->
    <path d="M1850 940 L1872 820 L2040 820 L2048 940Z" fill="#14181C"/>
    <path d="M1872 850 L2040 850 M1868 880 L2044 880 M1864 910 L2046 910" stroke="#2A3036" stroke-width="5"/>
    <rect x="1858" y="760" width="8" height="180" fill="#1B2126"/>
    <rect x="2032" y="760" width="8" height="180" fill="#1B2126"/>
    ${Array.from({ length: 8 }, (_, i) => `<rect x="${1878 + i * 20}" y="772" width="5" height="96" fill="#1B2126"/>`).join("")}
    <rect x="1858" y="764" width="182" height="8" fill="#1B2126"/>
    <rect x="1888" y="712" width="124" height="38" rx="3" fill="#59616A"/>
    <text x="1950" y="737" text-anchor="middle" font-family="Georgia, serif" font-size="14" letter-spacing="2" fill="${P.cream}">STAFF ONLY</text>
    <rect x="1926" y="790" width="48" height="58" fill="${P.cream}" opacity="0.92"/>
    <line x1="1934" y1="806" x2="1966" y2="806" stroke="${P.ink}" stroke-width="2"/>
    <line x1="1934" y1="818" x2="1960" y2="818" stroke="${P.ink}" stroke-width="2"/>
    <text x="1950" y="840" text-anchor="middle" font-family="monospace" font-size="11" fill="${P.ink}">21:15</text>`;
  return svg(2048, 1152, 57, body, 1.8);
}

/* ======================= GROUND (dry) + WET overlay ======================= */
function ground() {
  const r = rng(13);
  let cob = "";
  for (let row = 0; row < 14; row++) {
    const y = 20 + row * row * 2.6 + row * 14;
    const h = 10 + row * 2.2;
    const w = 26 + row * 5;
    for (let x = -w + ((row % 2) * w) / 2; x < 2048 + w; x += w + 4) {
      const shade = 64 + ((r() * 18) | 0);
      cob += `<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${w}" height="${h}" rx="${h / 2.4}" fill="rgb(${shade + 6},${shade + 2},${shade})"/>`;
    }
  }
  const body = `<rect width="2048" height="560" fill="#433F3D"/>${cob}
    <ellipse cx="300" cy="140" rx="380" ry="90" fill="${P.goldLight}" opacity="0.12" filter="url(#softer)"/>
    <ellipse cx="1060" cy="90" rx="420" ry="70" fill="${P.goldLight}" opacity="0.08" filter="url(#softer)"/>`;
  return svg(2048, 560, 61, body, 1);
}
function groundWet() {
  const r = rng(17);
  let puddles = "";
  const spots = [[260, 300, 210, 34], [820, 210, 160, 22], [1300, 360, 240, 40], [1560, 150, 210, 30], [560, 470, 280, 46], [1640, 470, 220, 40]];
  for (const [cx, cy, rx, ry] of spots) {
    puddles += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#1E2832" opacity="0.82"/>`;
    // reflections of the warm lights, broken into streaks
    for (let i = 0; i < 6; i++) {
      const sx = cx - rx * 0.7 + r() * rx * 1.4;
      puddles += `<rect x="${sx.toFixed(0)}" y="${(cy - ry * 0.5).toFixed(0)}" width="${(3 + r() * 5).toFixed(1)}" height="${(ry * (0.6 + r() * 0.6)).toFixed(0)}" fill="${P.goldLight}" opacity="${(0.25 + r() * 0.35).toFixed(2)}" filter="url(#blurfar)"/>`;
    }
    puddles += `<path d="M${cx - rx * 0.6} ${cy - ry * 0.55} Q${cx} ${cy - ry * 0.9} ${cx + rx * 0.6} ${cy - ry * 0.55}" stroke="${P.blueGray}" stroke-width="2" fill="none" opacity="0.5"/>`;
  }
  const sheen = `<rect width="2048" height="560" fill="#24303A" opacity="0.28"/>`;
  return svg(2048, 560, 67, sheen + puddles, 2.5);
}

/* ======================= FOREGROUND: lamppost, bunting, crowd ======================= */
function fg() {
  let bunting = "";
  const cols = [P.green, P.gold, P.cream, "#D9776B", P.brown];
  for (let i = 0; i < 34; i++) {
    const x = i * 62;
    const y = 30 + Math.sin((i / 33) * Math.PI) * 60;
    const y2 = 30 + Math.sin(((i + 1) / 33) * Math.PI) * 60;
    bunting += `<path d="M${x} ${y} L${x + 62} ${y2} L${x + 31} ${(y + y2) / 2 + 58}Z" fill="${cols[i % cols.length]}"/>`;
  }
  const head = (cx, cy, s) => `<circle cx="${cx}" cy="${cy}" r="${46 * s}" fill="#13171B"/><path d="M${cx - 110 * s} ${cy + 230 * s} Q${cx - 100 * s} ${cy + 40 * s} ${cx} ${cy + 40 * s} Q${cx + 100 * s} ${cy + 40 * s} ${cx + 110 * s} ${cy + 230 * s}Z" fill="#13171B"/>`;
  const body = `
    <path d="M-20 30 Q1024 160 2068 30" stroke="#1C2228" stroke-width="4" fill="none"/>
    ${bunting}
    <!-- lamppost -->
    <rect x="166" y="300" width="22" height="900" fill="#1A2025"/>
    <rect x="150" y="300" width="54" height="16" fill="#1A2025"/>
    <path d="M140 300 L214 300 L200 200 L154 200Z" fill="#1A2025"/>
    <path d="M150 292 L204 292 L194 212 L160 212Z" fill="${P.goldLight}"/>
    <circle cx="177" cy="250" r="90" fill="${P.goldLight}" opacity="0.22" filter="url(#softer)"/>
    <path d="M150 196 L177 170 L204 196Z" fill="#1A2025"/>
    <!-- crowd at the edges, out of focus -->
    <g filter="url(#soft)">${head(80, 980, 1.3)}${head(330, 1040, 1.1)}${head(1880, 1000, 1.25)}${head(2030, 960, 1.1)}</g>`;
  return svg(2048, 1152, 71, body, 1);
}

module.exports = {
  sprites: {
    bear_neutral: () => bear("neutral"),
    bear_happy: () => bear("happy"),
    bear_worried: () => bear("worried"),
    bear_searching: () => bear("searching"),
    bear_blink: () => bear("blink"),
    nini_happy: () => nini("happy"),
    nini_curious: () => nini("curious"),
    nini_worried: () => nini("worried"),
    nini_blink: () => nini("blink"),
    bell: bell,
    layer_far: far,
    layer_mid: mid,
    layer_ground: ground,
    layer_ground_wet: groundWet,
    layer_fg: fg,
  },
};
