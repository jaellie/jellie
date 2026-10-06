// Characters are the Game 1 sprites, used as-is (assets/characters, copied from big-green-bear-unity).
// Twin tell, deliberately tiny: Green is the same cut-out mirrored, so the scarf tail hangs on the other side.
// (The mirror window does the same thing to Big Green Bear, which is the point.)
const IMG = 'assets/characters/';
export const TWIN = {
  bear:  { flip: false, hand: 'R' },
  green: { flip: true,  hand: 'L' },
};

export function bearSVG(who = 'bear', { mood = 'happy' } = {}) {
  const f = TWIN[who].flip ? 'transform:scaleX(-1);' : '';
  return `<img src="${IMG}bear_${mood}.png" alt="" draggable="false" style="width:100%;height:100%;display:block;${f}">`;
}
export function niniSVG(mood = 'happy') {
  return `<img src="${IMG}nini_${mood}.png" alt="" draggable="false" style="width:100%;height:100%;display:block">`;
}
