// One shared bear sprite. Both twins use identical colors/shape (section 5/6).
// Tiny tells only: scarf knot side, smile eyes, raised hand. "R"/"L" = the BEAR's own right/left,
// i.e. viewer-left/viewer-right on a front-facing puppet.
export const TWIN = {
  bear:  { knot: 'L', smile: 'closed', hand: 'R' },
  green: { knot: 'R', smile: 'open',   hand: 'L' },
};

export function bearSVG(who = 'bear', { raise = null } = {}) {
  const t = TWIN[who];
  const kx = t.knot === 'L' ? 46 : 74;             // knot side is as seen by the viewer; hands are anatomical
  const eyes = t.smile === 'closed'
    ? `<path d="M42 50q5 4 10 0M68 50q5 4 10 0" stroke="#111923" stroke-width="3" fill="none" stroke-linecap="round"/>`
    : `<path d="M42 51q5 3 10 0M68 51q5 3 10 0" stroke="#111923" stroke-width="3" fill="none" stroke-linecap="round"/>
       <circle cx="47" cy="49" r="1.6" fill="#111923"/><circle cx="73" cy="49" r="1.6" fill="#111923"/>`;
  // arms: R arm = viewer-left (x≈22), L arm = viewer-right (x≈98)
  const arm = (side) => {
    const up = raise === side;
    const x = side === 'R' ? 22 : 98, dir = side === 'R' ? -1 : 1;
    return up
      ? `<ellipse cx="${x + dir * 8}" cy="62" rx="9" ry="20" transform="rotate(${dir * 25} ${x + dir * 8} 62)" fill="#5E946A"/>`
      : `<ellipse cx="${x}" cy="96" rx="10" ry="22" fill="#5E946A"/>`;
  };
  return `<svg viewBox="0 0 120 140">
    <ellipse cx="60" cy="136" rx="36" ry="4" fill="#0005"/>
    ${arm('R')}${arm('L')}
    <ellipse cx="60" cy="96" rx="36" ry="38" fill="#5E946A"/>
    <ellipse cx="60" cy="102" rx="22" ry="26" fill="#F2E8D4"/>
    <circle cx="30" cy="22" r="11" fill="#5E946A"/><circle cx="90" cy="22" r="11" fill="#5E946A"/>
    <circle cx="60" cy="48" r="32" fill="#5E946A"/>
    ${eyes}
    <ellipse cx="60" cy="60" rx="5" ry="3.6" fill="#111923"/>
    <path d="M30 76q30 14 60 0v10q-30 12-60 0z" fill="#D9A55A"/>
    <path d="M${kx - 6} 82l-6 18h12z" fill="#D9A55A"/>
    <circle cx="${kx}" cy="84" r="6" fill="#c8913f"/>
  </svg>`;
}
