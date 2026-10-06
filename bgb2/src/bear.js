// Sprites follow the Game 1 look: round paper-cut bear, cream muzzle, tan inner ears, rosy cheeks,
// stitched mustard scarf, cream foot pads. Both twins share every shape and color (sections 5/6).
// Only tiny tells differ: scarf tail side (as seen by the viewer), smile eyes, which hand is raised.
// "R"/"L" for hands are the bear's own anatomical right/left (viewer-left / viewer-right on a front-facing puppet).

export const TWIN = {
  bear:  { tail: 'L', smile: 'closed', hand: 'R' },
  green: { tail: 'R', smile: 'open',   hand: 'L' },
};

const G = '#5E946A', G2 = '#4f8359', CREAM = '#F2E8D4', TAN = '#d8c3a0', SCARF = '#D9A55A', INK = '#1b2a2a';

// a handful of fixed "paper fiber" strokes, drawn over the shapes
const FIBERS = `<g fill="none" stroke="#fff" stroke-opacity=".16" stroke-width="1" stroke-linecap="round">
  <path d="M38 40q6-6 12-2M70 30q8 2 10 8M48 90q10-4 14 2M72 108q8 2 12-4M40 118q8 4 14 0M84 80q4 8 0 14M54 62q6-2 8 3"/></g>`;

export function bearSVG(who = 'bear', { raise = null } = {}) {
  const t = TWIN[who];
  const eyes = t.smile === 'closed'
    ? `<path d="M41 47q5-6 10 0M69 47q5-6 10 0" stroke="${INK}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`
    : `<path d="M41 47q5-6 10 0M69 47q5-6 10 0" stroke="${INK}" stroke-width="2.6" fill="none" stroke-linecap="round"/>
       <circle cx="46" cy="48.6" r="1.5" fill="${INK}"/><circle cx="74" cy="48.6" r="1.5" fill="${INK}"/>`;
  const arm = side => {
    const x = side === 'R' ? 24 : 96, d = side === 'R' ? -1 : 1;
    return raise === side
      ? `<g transform="rotate(${d * 28} ${x} 80)"><ellipse cx="${x}" cy="62" rx="10" ry="22" fill="${G2}"/><circle cx="${x}" cy="42" r="9" fill="${G}"/></g>`
      : `<ellipse cx="${x}" cy="98" rx="11" ry="24" fill="${G2}"/><circle cx="${x + d * -1}" cy="119" r="9.5" fill="${G}"/>`;
  };
  const tx = t.tail === 'L' ? 44 : 76, flip = t.tail === 'L' ? -1 : 1; // scarf tail hangs on this side
  return `<svg viewBox="0 0 120 150">
    <ellipse cx="60" cy="146" rx="38" ry="4" fill="#0004"/>
    <ellipse cx="42" cy="141" rx="17" ry="8" fill="${G2}"/><ellipse cx="78" cy="141" rx="17" ry="8" fill="${G2}"/>
    <ellipse cx="42" cy="142" rx="10" ry="5" fill="${CREAM}"/><ellipse cx="78" cy="142" rx="10" ry="5" fill="${CREAM}"/>
    ${arm('R')}${arm('L')}
    <ellipse cx="60" cy="100" rx="37" ry="42" fill="${G}"/>
    <ellipse cx="60" cy="108" rx="23" ry="28" fill="${CREAM}"/>
    <circle cx="28" cy="20" r="12" fill="${G}"/><circle cx="28" cy="21" r="6.5" fill="${TAN}"/>
    <circle cx="92" cy="20" r="12" fill="${G}"/><circle cx="92" cy="21" r="6.5" fill="${TAN}"/>
    <circle cx="60" cy="46" r="34" fill="${G}"/>
    <ellipse cx="60" cy="58" rx="19" ry="15" fill="${CREAM}"/>
    <ellipse cx="35" cy="57" rx="6" ry="4" fill="#e79a98" opacity=".75"/><ellipse cx="85" cy="57" rx="6" ry="4" fill="#e79a98" opacity=".75"/>
    ${eyes}
    <ellipse cx="60" cy="53" rx="5.5" ry="4" fill="#2f5a45"/>
    <path d="M54 62q6 5 12 0" stroke="${INK}" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M30 80q30 13 60 0l1 10q-31 13-62 0z" fill="${SCARF}"/>
    <path d="M32 82q28 11 56 0" stroke="#fff" stroke-opacity=".5" stroke-width="1.2" stroke-dasharray="2 3" fill="none"/>
    <path d="M${tx - 7} 86l${flip * 3} 30l14 -4l-3 -28z" fill="${SCARF}" transform="${t.tail === 'L' ? '' : 'translate(0 0)'}"/>
    <path d="M${tx - 3} 90l${flip * 2} 22" stroke="#fff" stroke-opacity=".5" stroke-width="1.2" stroke-dasharray="2 3" fill="none"/>
    ${FIBERS}
  </svg>`;
}

// Nini: sheep in the yellow raincoat, cream hood-face, rosy cheeks, brown boots.
export function niniSVG() {
  return `<svg viewBox="0 0 80 110">
    <ellipse cx="40" cy="106" rx="24" ry="3" fill="#0004"/>
    <rect x="28" y="94" width="9" height="12" rx="3" fill="#9C5442"/><rect x="43" y="94" width="9" height="12" rx="3" fill="#9C5442"/>
    <path d="M18 56q22-12 44 0l6 38q-28 6-56 0z" fill="#E8BC4A"/>
    <path d="M10 62q-2 18 4 30l8-2-2-26zM70 62q2 18-4 30l-8-2 2-26z" fill="#d9ae3e"/>
    <circle cx="12" cy="92" r="4.5" fill="#fff"/><circle cx="68" cy="92" r="4.5" fill="#fff"/>
    <circle cx="40" cy="74" r="2" fill="#7a5a1a"/><circle cx="40" cy="86" r="2" fill="#7a5a1a"/>
    <circle cx="40" cy="34" r="29" fill="#E8BC4A"/>
    <ellipse cx="14" cy="38" rx="9" ry="5" fill="#f6efe2" transform="rotate(-20 14 38)"/><ellipse cx="14" cy="38" rx="5" ry="2.6" fill="#e9b3b3" transform="rotate(-20 14 38)"/>
    <ellipse cx="66" cy="38" rx="9" ry="5" fill="#f6efe2" transform="rotate(20 66 38)"/><ellipse cx="66" cy="38" rx="5" ry="2.6" fill="#e9b3b3" transform="rotate(20 66 38)"/>
    <circle cx="40" cy="36" r="20" fill="#f6efe2"/>
    <ellipse cx="29" cy="42" rx="4.5" ry="3" fill="#e9a8a8" opacity=".8"/><ellipse cx="51" cy="42" rx="4.5" ry="3" fill="#e9a8a8" opacity=".8"/>
    <path d="M28 35q3.5-4.5 7 0M45 35q3.5-4.5 7 0" stroke="#1b2a2a" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M36 44q4 3 8 0" stroke="#1b2a2a" stroke-width="1.6" fill="none" stroke-linecap="round"/>
  </svg>`;
}
