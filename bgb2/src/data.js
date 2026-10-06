// Static content. Observations stay neutral on purpose: the game never states what a clue "proves".

export const ROOMS = ['entrance', 'stairs', 'archive', 'bell', 'mechanism', 'observatory'];

export const ROOM_INFO = {
  entrance:    { label: 'ENTRANCE',    line: 'The door is heavier than it looks.',              mirrorDiff: 'candle' },
  stairs:      { label: 'STAIRCASE',   line: 'Every step creaks in the same place.',            mirrorDiff: 'candle' },
  archive:     { label: 'ARCHIVE',     line: 'Paper smells like rain that stopped long ago.',   mirrorDiff: 'candle' },
  bell:        { label: 'BELL ROOM',   line: 'The bell rope is still swaying. Slightly.',       mirrorDiff: 'candle' },
  mechanism:   { label: 'MECHANISM',   line: 'Gears, mostly still. One of them ticks.',         mirrorDiff: 'candle' },
  observatory: { label: 'OBSERVATORY', line: 'The whole town is small from here.',              mirrorDiff: 'candle' },
};

// Section 11: same room, one tiny change per visit. Some changes are noise, some are clues.
export const CANDLE_BY_VISIT = [
  [{ x: 420 }],                       // visit 1: one candle
  [{ x: 420 }, { x: 1180 }],          // visit 2: two candles
  [{ x: 1180 }],                      // visit 3: one candle, opposite side
  [],                                 // visit 4+: none
];

export const PEOPLE = {
  bear:  { name: 'BIG GREEN BEAR', known: ['Kind', 'Local resident', 'Helps Nini'] },
  green: { name: 'GREEN',          known: ['Unknown'] },
};

// claims: [trait, value]. Conflict = same trait, different value on the same board column.
export const EVIDENCE = [
  { id: 'pencil',  title: 'PENCIL',        where: 'Archive desk',   obs: 'The pencil is held in the left hand.',     claim: ['hand', 'left'] },
  { id: 'cup',     title: 'TEACUP',        where: 'Café table',     obs: 'The cup was lifted with the right hand.',  claim: ['hand', 'right'] },
  { id: 'knotL',   title: 'SCARF',         where: 'Photograph',     obs: 'The knot sits toward the left.',           claim: ['knot', 'left'] },
  { id: 'knotR',   title: 'SCARF',         where: 'Bell room',      obs: 'The knot sits toward the right.',          claim: ['knot', 'right'] },
  { id: 'ear',     title: 'EAR',           where: 'Old photograph', obs: 'A small scar on the left ear.',            claim: ['ear', 'scar'] },
  { id: 'bellLike',title: 'BELL',          where: 'Café',           obs: 'Smiled when the bell rang.',               claim: ['bell', 'likes'] },
  { id: 'bellNo',  title: 'BELL',          where: 'Bell room',      obs: 'Covered both ears when it rang.',          claim: ['bell', 'dislikes'] },
  { id: 'smileC',  title: 'SMILE',         where: 'Statement',      obs: 'Eyes closed when smiling.',                claim: ['smile', 'closed'] },
  { id: 'smileO',  title: 'SMILE',         where: 'Statement',      obs: 'Eyes stayed slightly open when smiling.',  claim: ['smile', 'open'] },
  { id: 'cafe',    title: 'SEEN AT CAFÉ', where: 'Nini',           obs: 'Seen near the café around 11:20.',         claim: null, time: '11:20' },
  { id: 'tower',   title: 'SEEN AT TOWER',where: 'Night guard',    obs: 'Seen at the tower gate around 11:40.',     claim: null, time: '11:40' },
  { id: 'photo',   title: 'FAMILY PHOTO', where: 'Archive',        obs: 'One child in the frame. Or two.',          claim: null },
];

export const STATEMENTS = [
  { who: 'NINI',        when: '11:25', text: '"He waved at me. I think. It was raining."' },
  { who: 'NIGHT GUARD', when: '11:40', text: '"Same scarf, same smile. Same bear, I\'d say."' },
];

export const TIMES = ['11:10', '11:20', '11:30', '11:40', '11:47', '11:50'];
export const PHASES = ['one', 'two', 'uncertain']; // PEOPLE screen progression
