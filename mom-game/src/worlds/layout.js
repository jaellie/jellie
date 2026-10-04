// Home floor plan (meters). Origin = living-room south-west corner (window + TV wall corner).
// +x = east (right on the plan), +z = north (toward the kitchen). The big window is on z = 0.
// All numbers are estimates from the user's 84㎡ floor plan (±15%) — tweak freely.

export const layout = {
  size: '84㎡ (33평)',
  wallH: 2.4,
  wallT: 0.14,
  living: { x0: 0, x1: 4.0, z0: 0, z1: 4.5 },
  kitchen: { x0: 0, x1: 3.5, z0: 4.5, z1: 7.8 },
  hall: { x0: 4.0, x1: 7.9, z0: 3.45, z1: 4.5 },
  // front door on the entry's east (right) wall: you come in from the right,
  // the living room and kitchen are to the left
  entry: { x0: 6.5, x1: 7.9, z0: 4.5, z1: 6.25, doorZ: 5.35 },
  // no balcony in front of the living room (the window goes straight outside)
  window: { x0: 0.8, x1: 3.3, top: 2.2, mullions: [1.63, 2.47] },

  // Which side the camera swings to when Mom is in the kitchen / entry.
  // The living room is seen from the kitchen side, looking at the window.
  kitchenSide: 'north',

  furniture: {
    // living room — east wall (TV side; facing the window the TV is on the right)
    stool: { x: 3.7, z: 0.32 },
    phone: { x: 3.79, z: 0.85 },
    tvStand: { x: 3.76, z: 2.05, len: 1.7 },
    windowPlant: { x: 1.05, z: 0.32 },
    // living room — west wall (sofa side)
    sofa: { x: 0.43, z: 1.95, len: 2.1 },
    palm: { x: 0.4, z: 0.42 },
    lamp: { x: 0.25, z: 3.12 },
    lfBag: { x: 1.1, z: 3.25 },
    ac: { x: 0.0, z: 1.95, y: 1.95 },
    shelf: { x: 0.0, z: 3.92 },
    intercom: { x: 4.2, z: 3.45, y: 1.4 },
    rug: { x: 2.0, z: 2.1, w: 1.7, d: 2.1 },
    // kitchen: fridges + sink/hob on the north wall, L-counter on the west wall,
    // speckled peninsula (dining counter) coming off the east wall
    darkFridge: { x: 0.5, z: 7.44 },
    silverFridge: { x: 1.4, z: 7.44 },
    counter: { x0: 1.85, x1: 3.5 },
    westCounter: { x: 0.3, z0: 4.95, z1: 6.95 },
    table: { x: 2.7, z: 5.88, w: 1.6, d: 0.75 },
    chairs: [{ x: 2.3, z: 5.1, r: 0 }, { x: 3.0, z: 5.1, r: 0 }],
    fan: { x: 3.3, z: 4.72 },
    // entry
    shoeCabinet: { x: 7.05, z: 6.08, len: 1.0 }, // along the entry's north wall
    keyTray: { x: 7.3, z: 6.08 },
    shoes: { x: 7.05, z: 4.85 },
  },
};
