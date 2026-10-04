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
  // front door straight ahead on the entry's north wall (as seen from the hall);
  // tall white shoe cabinet on the right (east), marble wall on the left (west)
  entry: { x0: 6.5, x1: 7.9, z0: 4.5, z1: 6.25, doorX: 7.0 },
  // no balcony in front of the living room (the window goes straight outside)
  window: { x0: 0.8, x1: 3.3, top: 2.2, mullions: [1.63, 2.47] },

  // Which side the camera swings to when Mom is in the kitchen / entry.
  // The living room is seen from the kitchen side, looking at the window.
  kitchenSide: 'north',

  furniture: {
    // living room — west wall (TV side; facing the window the TV is on the right)
    stool: { x: 0.3, z: 0.32 },
    phone: { x: 0.21, z: 0.85 },
    tvStand: { x: 0.24, z: 2.05, len: 1.7 },
    shelf: { x: 0.0, z: 3.92 },
    windowPlant: { x: 1.05, z: 0.32 },
    // living room — east wall (sofa side; facing the window the sofa is on the left)
    sofa: { x: 3.57, z: 1.95, len: 2.1 },
    palm: { x: 3.6, z: 0.42 },
    lamp: { x: 3.75, z: 3.22 },
    lfBag: { x: 2.9, z: 3.28 },
    ac: { x: 4.0, z: 1.95, y: 1.95 },
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
    shoeCabinet: { x: 7.7, z: 5.45, len: 1.55 }, // tall built-in along the east wall
    keyTray: { x: 7.66, z: 5.45 },                 // sits in the cabinet's open niche
    shoes: { x: 6.85, z: 5.25 },
  },
};
