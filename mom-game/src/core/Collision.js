// Simple 2D (XZ) collision: the player is a circle, obstacles are AABBs or circles.

export class Collider {
  constructor() { this.boxes = []; this.circles = []; }

  addBox(minX, maxX, minZ, maxZ, tag) {
    const b = { minX, maxX, minZ, maxZ, enabled: true, tag };
    this.boxes.push(b); return b;
  }
  // center + size helper
  addRect(cx, cz, w, d, tag) { return this.addBox(cx - w / 2, cx + w / 2, cz - d / 2, cz + d / 2, tag); }
  addCircle(x, z, r, tag) { const c = { x, z, r, enabled: true, tag }; this.circles.push(c); return c; }

  resolve(pos, r) {
    for (let iter = 0; iter < 3; iter++) {
      let moved = false;
      for (const b of this.boxes) {
        if (!b.enabled) continue;
        const cx = Math.max(b.minX, Math.min(pos.x, b.maxX));
        const cz = Math.max(b.minZ, Math.min(pos.z, b.maxZ));
        let dx = pos.x - cx, dz = pos.z - cz;
        const d2 = dx * dx + dz * dz;
        if (d2 >= r * r) continue;
        if (d2 > 1e-8) {
          const d = Math.sqrt(d2), push = r - d;
          pos.x += (dx / d) * push; pos.z += (dz / d) * push;
        } else {
          // center inside the box: push out along the shallowest axis
          const l = pos.x - b.minX, rr = b.maxX - pos.x, t = pos.z - b.minZ, bb = b.maxZ - pos.z;
          const m = Math.min(l, rr, t, bb);
          if (m === l) pos.x = b.minX - r; else if (m === rr) pos.x = b.maxX + r;
          else if (m === t) pos.z = b.minZ - r; else pos.z = b.maxZ + r;
        }
        moved = true;
      }
      for (const c of this.circles) {
        if (!c.enabled) continue;
        const dx = pos.x - c.x, dz = pos.z - c.z, d = Math.hypot(dx, dz), min = r + c.r;
        if (d < min && d > 1e-6) { pos.x = c.x + (dx / d) * min; pos.z = c.z + (dz / d) * min; moved = true; }
      }
      if (!moved) break;
    }
  }
}
