import * as THREE from 'three';
import { glowSprite, starTexture } from '../models/kit.js';

// Things Mom can use with E/Space. The nearest one in reach shows a floating "E".
// Items tied to an unfound discoverable twinkle faintly when Mom is within ~4 m.

export class Interactables {
  constructor(scene, discoverables) {
    this.scene = scene; this.disc = discoverables; this.list = []; this.time = 0; this.current = null;
  }

  add(spec) {
    const it = {
      reach: 1.25, y: 0.9, enabled: () => true, ...spec,
    };
    it.pos = new THREE.Vector3(it.x, it.y, it.z);
    it.hintPos = new THREE.Vector3(it.x, it.hintY ?? it.y + 0.45, it.z);
    if (it.discover) {
      const s = glowSprite('#FFE7B0', 0.32, 0, starTexture());
      s.position.set(it.x, it.sparkleY ?? it.y + 0.1, it.z);
      s.renderOrder = 10;
      this.scene.add(s); it.sparkle = s; it.phase = Math.random() * 10;
    }
    this.list.push(it);
    return it;
  }

  sparkleDone(it) {
    if (!it.discover) return true;
    const ids = Array.isArray(it.discover) ? it.discover : [it.discover];
    return ids.every((id) => this.disc.isFound(id) || !this.disc.exists(id));
  }

  update(dt, mom) {
    this.time += dt;
    const p = mom.position;
    let best = null, bestScore = Infinity;
    const fx = Math.sin(mom.heading), fz = Math.cos(mom.heading);
    for (const it of this.list) {
      const on = it.enabled();
      const dx = it.x - p.x, dz = it.z - p.z, d = Math.hypot(dx, dz);
      if (it.sparkle) {
        const show = on && !this.hideSparkles && !this.sparkleDone(it);
        const near = THREE.MathUtils.clamp((4.2 - d) / 1.6, 0, 1);
        const tw = 0.55 + 0.45 * Math.sin(this.time * 3.1 + it.phase) * Math.sin(this.time * 1.7 + it.phase * 2);
        it.sparkle.material.opacity = show ? near * tw * 0.6 : 0;
        it.sparkle.scale.setScalar(0.22 + 0.12 * tw);
        it.sparkle.visible = it.sparkle.material.opacity > 0.01;
      }
      if (!on || d > it.reach) continue;
      const facing = d > 0.01 ? (dx * fx + dz * fz) / d : 1;
      const score = d - facing * 0.45;
      if (score < bestScore) { bestScore = score; best = it; }
    }
    this.current = best;
    return best;
  }

  dispose() { this.list.forEach((it) => it.sparkle && this.scene.remove(it.sparkle)); this.list = []; }
}
