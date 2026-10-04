import * as THREE from 'three';
import { content } from '../content.js';
import { box, cyl, sphere, cone, at, group } from '../models/kit.js';

// 추억 선반: a little wall shelf; each found item appears as a tiny object.

const ORDER = Object.keys(content.discoverables);

export function makeToken(kind) {
  switch (kind) {
    case 'note': {
      const env = box(0.1, 0.07, 0.012, '#FFF6E6', { r: 0.004 });
      const flap = cone(0.05, 0.03, '#F2DCC0', { seg: 3 }); flap.rotation.z = Math.PI; at(flap, 0, 0.07, 0.008); flap.scale.set(1, 1, 0.1);
      const heart = sphere(0.009, '#E4574F', { w: 5, h: 4 }); at(heart, 0, 0.045, 0.01);
      return group(env, flap, heart);
    }
    case 'photo': case 'frame': {
      const f = box(0.085, 0.1, 0.015, '#C48A52', { r: 0.004 });
      const p = box(0.065, 0.075, 0.004, '#F3D7B6'); at(p, 0, 0.012, 0.008);
      return group(f, p);
    }
    case 'strip': { const s = box(0.04, 0.12, 0.006, '#FFFFFF'); return group(s); }
    case 'voice': {
      const c = box(0.1, 0.065, 0.02, '#3A3430', { r: 0.006 });
      const l = box(0.07, 0.03, 0.004, '#F4B6C2'); at(l, 0, 0.022, 0.01);
      return group(c, l);
    }
    case 'dragon': {
      const g = new THREE.Group();
      for (let i = 0; i < 5; i++) { const s = sphere(0.018 - i * 0.002, '#4E9A5E', { w: 6, h: 4 }); at(s, -0.04 + i * 0.02, 0.03 + Math.sin(i * 1.4) * 0.012, 0); g.add(s); }
      const h = sphere(0.022, '#5DB36E', { w: 6, h: 5 }); at(h, 0.05, 0.05, 0); g.add(h);
      const k = cyl(0.002, 0.002, 0.04, '#E8C547'); at(k, 0.05, 0.07, 0); g.add(k);
      const tassel = cyl(0.008, 0.012, 0.03, '#E4574F'); at(tassel, -0.05, 0.0, 0); g.add(tassel);
      return g;
    }
    case 'persimmon': {
      const p = sphere(0.035, '#EE7B2A', { w: 8, h: 6 }); p.scale.y = 0.8; p.position.y = 0.03;
      const l = box(0.04, 0.006, 0.02, '#4E8A3E'); at(l, 0, 0.055, 0);
      return group(p, l);
    }
    case 'cake': {
      const c = cyl(0.04, 0.04, 0.04, '#FFF4EC', { seg: 12 });
      const cr = cyl(0.041, 0.041, 0.008, '#F4B6C2', { seg: 12 }); cr.position.y = 0.035;
      const cd = cyl(0.003, 0.003, 0.03, '#C9B6E4'); cd.position.y = 0.04;
      return group(c, cr, cd);
    }
    case 'bowl': { const b = cyl(0.045, 0.03, 0.035, '#FFFFFF', { seg: 10 }); const s = cyl(0.04, 0.04, 0.004, '#4A6B3A', { seg: 10 }); s.position.y = 0.03; return group(b, s); }
    case 'sprout': { const p = cyl(0.025, 0.02, 0.035, '#C27A1E', { seg: 8 }); const l1 = sphere(0.016, '#7CBF5A', { w: 5, h: 4 }); at(l1, -0.012, 0.05, 0); const l2 = l1.clone(); at(l2, 0.012, 0.055, 0); return group(p, l1, l2); }
    case 'mango': { const m = sphere(0.03, '#F2B33D', { w: 7, h: 5 }); m.scale.set(1.2, 0.8, 0.9); m.position.y = 0.025; return group(m); }
    case 'coin': { const c = cyl(0.025, 0.025, 0.006, '#E8C547', { seg: 12, opts: { metal: 0.6, rough: 0.3 } }); c.rotation.x = Math.PI / 2; c.position.y = 0.03; return group(c); }
    case 'shoe': { const s = box(0.05, 0.025, 0.1, '#141414', { r: 0.012 }); return group(s); }
    case 'candy': { const c = sphere(0.02, '#E4574F', { w: 6, h: 4 }); c.position.y = 0.02; const w1 = cone(0.015, 0.02, '#FFE7A0', { seg: 4 }); w1.rotation.z = Math.PI / 2; at(w1, 0.03, 0.01, 0); return group(c, w1); }
    case 'boat': { const b = cone(0.04, 0.05, '#FFFFFF', { seg: 3 }); b.scale.set(1.3, 1, 0.5); return group(b); }
    default: { // gift
      const b = box(0.075, 0.06, 0.06, '#E98F9E', { r: 0.006 });
      const r1 = box(0.012, 0.062, 0.062, '#FFF3C9'); const r2 = box(0.077, 0.062, 0.012, '#FFF3C9');
      const bow = sphere(0.014, '#FFF3C9', { w: 5, h: 4 }); bow.position.y = 0.065;
      return group(b, r1, r2, bow);
    }
  }
}

export class MemoryShelf {
  // A cute little hutch against a wall. (x, z) = wall point, facing = rotation.y so +z faces the room.
  constructor(discoverables, { x, z, facing = Math.PI / 2, len = 0.95 }) {
    this.disc = discoverables;
    this.group = new THREE.Group();
    this.group.position.set(x, 0, z);
    this.group.rotation.y = facing;
    this.len = len;
    const wood = '#C48A52', cream = '#F6ECD6';
    const base = box(len + 0.06, 0.5, 0.3, cream, { r: 0.02 }); at(base, 0, 0, 0.15); this.group.add(base);
    const baseTop = box(len + 0.1, 0.03, 0.33, wood, { r: 0.01 }); at(baseTop, 0, 0.5, 0.165); this.group.add(baseTop);
    for (const sx of [-1, 1]) { const k = sphere(0.016, wood); at(k, sx * 0.2, 0.32, 0.305); this.group.add(k); const d = box(len / 2 - 0.04, 0.38, 0.015, '#FBF3E1', { r: 0.01 }); at(d, sx * len / 4, 0.06, 0.3); this.group.add(d); }
    const back = box(len, 1.3, 0.02, '#F7D9D4'); at(back, 0, 0.53, 0.01); this.group.add(back);
    this.planks = [0.56, 0.9, 1.24, 1.58];
    for (const py of this.planks.slice(1)) { const p = box(len, 0.03, 0.2, wood, { r: 0.008 }); at(p, 0, py - 0.03, 0.11); this.group.add(p); }
    for (const sx of [-1, 1]) { const s = box(0.035, 1.35, 0.22, wood, { r: 0.01 }); at(s, sx * (len / 2 + 0.017), 0.52, 0.11); this.group.add(s); }
    const crown = box(len + 0.12, 0.05, 0.25, wood, { r: 0.015 }); at(crown, 0, 1.86, 0.12); this.group.add(crown);
    // a little garland + name tag
    for (let i = 0; i < 9; i++) {
      const b = sphere(0.022, ['#F4B6C2', '#FFE7A0', '#C9B6E4'][i % 3], { w: 5, h: 4, opts: { emissive: '#FFD9A0', emissiveIntensity: 0.3 } });
      at(b, -len / 2 + 0.06 + i * ((len - 0.12) / 8), 1.8 - Math.sin((i / 8) * Math.PI) * 0.08, 0.24); this.group.add(b);
    }
    this.tokens = new THREE.Group(); this.group.add(this.tokens);
    this.refresh();
    discoverables.onFound(() => this.refresh(true));
  }

  refresh(animateLast = false) {
    this.tokens.clear();
    const found = this.disc.listFound();
    const perRow = 10, step = (this.len - 0.08) / perRow;
    found.forEach(({ id, d }, i) => {
      const row = Math.min(Math.floor(i / perRow), this.planks.length - 1), col = i % perRow;
      const tk = makeToken(d.token || d.type);
      tk.scale.setScalar(0.85);
      tk.position.set(-this.len / 2 + 0.04 + step * (col + 0.5) + (row % 2) * 0.01, this.planks[row], 0.1 + (col % 2) * 0.03);
      tk.rotation.y = ((ORDER.indexOf(id) % 5) - 2) * 0.12;
      this.tokens.add(tk);
      if (animateLast && i === found.length - 1) { tk.scale.setScalar(0.01); this.pop = { obj: tk, t: 0 }; }
    });
  }

  update(dt) {
    if (!this.pop) return;
    this.pop.t += dt;
    const u = Math.min(1, this.pop.t / 0.6);
    const s = u < 1 ? 1 + Math.sin(u * Math.PI) * 0.6 : 1;
    this.pop.obj.scale.setScalar(Math.max(0.01, u * s * 0.85));
    if (u >= 1) this.pop = null;
  }
}
