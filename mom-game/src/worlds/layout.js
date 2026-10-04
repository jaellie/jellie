// Home floor plan (meters). Origin = living-room south-west corner (window + TV wall corner).
// +x = east (right on the plan), +z = north (toward the kitchen). The big window is on z = 0.
// All numbers are estimates from the user's 84㎡ floor plan (±15%) — tweak freely.

export const layout = {
  size: '84㎡ (33평)',
  wallH: 2.4,
  wallT: 0.14,
  living: { x0: 0, x1: 3.8, z0: 0, z1: 4.3 },
  kitchen: { x0: 0, x1: 3.3, z0: 4.3, z1: 6.8 },
  hall: { x0: 3.8, x1: 7.4, z0: 3.2, z1: 4.3 },
  entry: { x0: 6.1, x1: 7.4, z0: 4.3, z1: 5.8, doorX: 6.6 },
  balcony: { x0: 0, x1: 3.8, z0: -1.5, z1: 0 },
  window: { x0: 0.8, x1: 3.0, top: 2.2, doorPane: [1.53, 2.27] },

  // Which side the camera swings to when Mom is in the kitchen / entry.
  // The living room is seen from the kitchen side, looking at the window.
  kitchenSide: 'north',

  furniture: {
    // living room — east wall (TV side; facing the window the TV is on the left)
    stool: { x: 3.5, z: 0.32 },
    phone: { x: 3.59, z: 0.85 },
    tvStand: { x: 3.56, z: 2.0, len: 1.7 },
    // living room — west wall (sofa side)
    sofa: { x: 0.43, z: 1.9, len: 2.1 },
    palm: { x: 0.4, z: 0.42 },
    lamp: { x: 0.25, z: 3.04 },
    lfBag: { x: 1.08, z: 3.15 },
    ac: { x: 0.0, z: 1.9, y: 1.95 },
    shelf: { x: 0.0, z: 3.8 },
    intercom: { x: 4.3, z: 3.2, y: 1.4 },
    rug: { x: 1.85, z: 2.0, w: 1.7, d: 2.1 },
    // kitchen
    darkFridge: { x: 0.5, z: 6.44 },
    silverFridge: { x: 1.4, z: 6.44 },
    counter: { x0: 1.85, x1: 3.3 },
    sideCounter: { x: 3.01, z0: 5.45, z1: 6.18 },
    table: { x: 2.0, z: 4.9 },
    chairs: [{ x: 1.7, z: 4.22, r: 0 }, { x: 2.32, z: 4.22, r: 0 }, { x: 1.12, z: 4.9, r: Math.PI / 2 }],
    fan: { x: 3.02, z: 4.55 },
    // entry
    shoeCabinet: { x: 7.23, z: 5.02, len: 1.25 },
    keyTray: { x: 7.2, z: 4.72 },
    shoes: { x: 6.38, z: 4.92 },
    // balcony
    balconyPlant: { x: 0.45, z: -1.0 },
  },
};
