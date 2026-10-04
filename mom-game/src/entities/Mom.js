import * as THREE from 'three';
import { content } from '../content.js';
import { mat, box, cyl, sphere, capsule, cone, at, group } from '../models/kit.js';

// Low-poly Mom: 155 cm, slim, short black perm, waist-length pink cardigan, long denim skirt,
// light purple slippers at home and glossy black rubber shoes outside.
// In The Past she is a little girl with pigtails (same black shoes).

const C = content.mom;
const RADIUS = 0.35;

function torusArc(r, tube, arc, color) {
  const g = new THREE.TorusGeometry(r, tube, 4, 10, arc);
  return new THREE.Mesh(g, mat(color, { flat: false, rough: 0.6 }));
}

export function rubberShoe(color) {
  // boat-shaped shoe with a little upturned toe point
  const m = mat(color, { rough: 0.22, metal: 0.05, flat: false });
  const body = capsule(0.042, 0.12, color, { m });
  body.rotation.x = Math.PI / 2; body.scale.set(1.05, 1, 0.62); body.position.set(0, 0.026, 0.0);
  const toe = cone(0.022, 0.06, color, { m, seg: 6 });
  toe.rotation.x = 1.15; at(toe, 0, 0.025, 0.085); toe.rotation.x = 1.0;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.036, 0.006, 4, 12), m);
  rim.rotation.x = Math.PI / 2; rim.scale.set(1, 1.65, 1); rim.position.set(0, 0.05, -0.005);
  return group(body, toe, rim);
}

export function slipper(color) {
  const sole = box(0.085, 0.022, 0.21, color, { r: 0.01 }); at(sole, 0, 0, 0.01);
  const strap = box(0.095, 0.04, 0.07, color, { r: 0.015 }); at(strap, 0, 0.018, 0.05);
  const fluff = sphere(0.03, '#E8DDF5', { w: 6, h: 4 }); at(fluff, 0, 0.06, 0.06); fluff.scale.set(1.3, 0.6, 1);
  return group(sole, strap, fluff);
}

export class Mom {
  constructor() {
    this.root = new THREE.Group();     // positioned in the world
    this.body = new THREE.Group();     // rotated to face the walking direction
    this.root.add(this.body);
    this.radius = RADIUS;
    this.vel = new THREE.Vector2();
    this.heading = 0; this.targetHeading = 0;
    this.walkPhase = 0; this.stepAccum = 0; this.walkAmt = 0;
    this.time = 0;
    this.form = 'adult';
    this.footwear = 'slippers';
    this.pose = 'stand';
    this.action = null;
    this.onStep = null;
    this.bagCount = 0;
    this.build('adult');
  }

  get position() { return this.root.position; }

  build(form) {
    this.form = form;
    this.body.clear();
    const rig = this.rig = {};
    const child = form === 'child';
    const s = child ? 0.7 : 1;               // overall height scale
    const skin = C.skin;

    // feet (each foot is a pivot with shoe + slipper variants)
    rig.feet = [-1, 1].map((side) => {
      const foot = new THREE.Group(); foot.position.set(side * 0.07 * (child ? 0.9 : 1), 0, 0);
      const ankle = cyl(0.03, 0.028, child ? 0.32 : 0.16, skin, { seg: 6 }); ankle.position.y = 0.03;
      const shoe = rubberShoe(C.shoes);
      const sl = slipper(C.slippers);
      foot.add(ankle, shoe, sl);
      foot.userData = { shoe, slipper: sl, side };
      this.body.add(foot);
      return foot;
    });

    // lower body
    rig.hips = new THREE.Group(); this.body.add(rig.hips);
    if (!child) {
      rig.hips.position.y = 0.88;
      const skirt = cyl(0.13, 0.215, 0.8, C.skirtColor, { seg: 12, opts: { rough: 0.9 } });
      skirt.position.y = -0.8; rig.hips.add(skirt);
      const seam = box(0.012, 0.79, 0.01, '#E7C15B'); at(seam, 0, -0.795, 0.175); seam.rotation.x = 0.09; rig.hips.add(seam);
      rig.skirt = skirt;
    } else {
      rig.hips.position.y = 0.56;
      const skirt = cyl(0.12, 0.2, 0.3, C.child.skirt, { seg: 10 }); skirt.position.y = -0.28; rig.hips.add(skirt);
      rig.skirt = skirt;
    }

    // torso
    rig.torso = new THREE.Group(); rig.torso.position.y = child ? 0.56 : 0.88; this.body.add(rig.torso);
    if (!child) {
      // pink round-neck cardigan, collarless, ends at the waistline
      const cardi = cyl(0.135, 0.158, 0.44, C.cardigan, { seg: 12, opts: { rough: 0.95 } });
      cardi.position.y = -0.07; rig.torso.add(cardi);
      const hem = cyl(0.161, 0.161, 0.04, '#EBA4B3', { seg: 12, opts: { rough: 0.95 } }); // ribbed hem
      hem.position.y = -0.08; rig.torso.add(hem);
      const shoulders = sphere(0.152, C.cardigan, { w: 12, h: 6, opts: { rough: 0.95 } });
      shoulders.scale.set(1.12, 0.5, 0.82); shoulders.position.y = 0.37; rig.torso.add(shoulders);
      // inner top peeking out of the round neckline + button line
      const inner = box(0.1, 0.36, 0.02, '#FFF6EE', { r: 0.008 }); at(inner, 0, 0.02, 0.13); inner.rotation.x = -0.05; rig.torso.add(inner);
      for (let i = 0; i < 4; i++) { const b = sphere(0.011, '#FFFFFF', { w: 5, h: 4 }); at(b, 0.06, 0.3 - i * 0.1, 0.142 + i * 0.004); rig.torso.add(b); }
    } else {
      const blouse = cyl(0.11, 0.13, 0.32, C.child.blouse, { seg: 10 }); blouse.position.y = -0.02; rig.torso.add(blouse);
      const collar = cyl(0.07, 0.11, 0.04, '#FFFFFF', { seg: 10 }); collar.position.y = 0.28; rig.torso.add(collar);
    }

    // arms
    const shoulderY = child ? 0.3 : 0.36, shoulderX = child ? 0.13 : 0.165, armLen = child ? 0.26 : 0.4;
    rig.arms = [-1, 1].map((side) => {
      const pivot = new THREE.Group(); pivot.position.set(side * shoulderX, shoulderY, 0);
      const sleeve = capsule(child ? 0.04 : 0.045, armLen - 0.08, child ? C.child.blouse : C.cardigan, { opts: { rough: 0.95 } });
      sleeve.position.y = -armLen / 2; pivot.add(sleeve);
      const hand = sphere(child ? 0.035 : 0.04, skin, { w: 7, h: 5 }); hand.position.y = -armLen + 0.01; pivot.add(hand);
      pivot.rotation.z = side * 0.09;
      rig.torso.add(pivot);
      pivot.userData.hand = hand;
      return pivot;
    });

    // head
    rig.head = new THREE.Group(); rig.head.position.y = child ? 0.47 : 0.53; rig.torso.add(rig.head);
    const neck = cyl(0.038, 0.042, 0.08, skin, { seg: 6 }); neck.position.y = -0.11; rig.head.add(neck);
    const hr = child ? 0.13 : 0.105;
    const head = sphere(hr, skin, { w: 14, h: 10, opts: { flat: false, rough: 0.7 } }); rig.head.add(head);
    head.scale.set(1, 1.05, 0.97);

    // warm closed-eye smile + pink cheeks (reads from the 3/4 camera)
    const dark = '#3B2A26';
    for (const sx of [-1, 1]) {
      const eye = torusArc(hr * 0.2, hr * 0.045, Math.PI, dark);
      eye.position.set(sx * hr * 0.37, hr * 0.12, hr * 0.92); eye.rotation.z = Math.PI; rig.head.add(eye);
      const cheek = sphere(hr * 0.2, '#F4A0A8', { w: 8, h: 6, opts: { flat: false, rough: 1 }, cast: false });
      cheek.scale.set(1, 0.6, 0.35); cheek.position.set(sx * hr * 0.55, -hr * 0.13, hr * 0.8); rig.head.add(cheek);
    }
    const smile = torusArc(hr * 0.3, hr * 0.05, Math.PI, '#B4505A');
    smile.position.set(0, -hr * 0.2, hr * 0.94); smile.rotation.z = Math.PI; rig.head.add(smile);

    // hair
    const hairM = mat(C.hairColor, { rough: 0.75 });
    if (!child) {
      // 뽀글머리: a cluster of little curls hugging the top, sides and back
      const cap = sphere(hr * 1.02, C.hairColor, { w: 12, h: 8, m: hairM }); cap.scale.set(1.03, 0.75, 1.03); cap.position.set(0, hr * 0.32, -hr * 0.1); rig.head.add(cap);
      const rnd = mulberry(7);
      for (let i = 0; i < 34; i++) {
        const u = rnd() * Math.PI * 2, v = 0.15 + rnd() * 1.15; // v: angle from the top
        const n = new THREE.Vector3(Math.sin(v) * Math.sin(u), Math.cos(v), Math.sin(v) * Math.cos(u));
        if (n.z > 0.45 && n.y < 0.62) continue; // keep the face clear
        const curl = sphere(hr * (0.27 + rnd() * 0.1), C.hairColor, { w: 6, h: 5, m: hairM });
        curl.position.copy(n.multiplyScalar(hr * 1.02)).add(new THREE.Vector3(0, hr * 0.05, -hr * 0.05));
        rig.head.add(curl);
      }
    } else {
      const cap = sphere(hr * 1.05, C.hairColor, { w: 12, h: 8, m: hairM }); cap.scale.set(1.04, 0.82, 1.04); cap.position.set(0, hr * 0.24, -hr * 0.12); rig.head.add(cap);
      const bangs = box(hr * 1.5, hr * 0.32, hr * 0.3, C.hairColor, { r: 0.02, m: hairM }); at(bangs, 0, hr * 0.48, hr * 0.72); rig.head.add(bangs);
      for (const sx of [-1, 1]) {
        const tail = capsule(hr * 0.22, hr * 0.7, C.hairColor, { m: hairM }); tail.position.set(sx * hr * 1.08, -hr * 0.35, -hr * 0.2); tail.rotation.z = sx * 0.25; rig.head.add(tail);
        const ribbon = sphere(hr * 0.2, C.child.ribbon, { w: 6, h: 4 }); ribbon.scale.set(1.6, 0.8, 0.8); ribbon.position.set(sx * hr * 1.0, hr * 0.05, -hr * 0.2); rig.head.add(ribbon);
      }
    }

    // shopping bag (LF Square), hidden by default
    rig.bag = this.makeBag(); rig.bag.visible = false;
    rig.arms[1].userData.hand.add(rig.bag);

    this.body.scale.setScalar(1);
    this.setFootwear(this.footwear);
    this.setBagCount(this.bagCount);
    this.baseScale = s;
  }

  makeBag() {
    const g = new THREE.Group();
    const bag = box(0.2, 0.22, 0.08, '#F6EFE2', { r: 0.01 }); at(bag, 0, -0.27, 0); g.add(bag);
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.007, 4, 10, Math.PI), mat('#B9824B'));
    handle.position.set(0, -0.05, 0); g.add(handle);
    g.userData.items = [];
    const colors = ['#F4B6C2', '#C9B6E4', '#E8C547', '#7BA7A3', '#EFA36B', '#E4574F', '#9CC58C', '#FFFFFF'];
    for (let i = 0; i < 8; i++) {
      const it = box(0.07, 0.08, 0.05, colors[i], { r: 0.012 });
      at(it, -0.06 + (i % 3) * 0.06, -0.08 + Math.floor(i / 3) * 0.03, (i % 2) * 0.02 - 0.01);
      it.rotation.z = (i % 2 ? 1 : -1) * 0.2; it.visible = false; g.add(it); g.userData.items.push(it);
    }
    return g;
  }

  setBagCount(n) {
    this.bagCount = n;
    if (!this.rig?.bag) return;
    this.rig.bag.visible = n >= 0 && this.showBag === true;
    this.rig.bag.userData.items.forEach((it, i) => (it.visible = i < n));
  }

  setForm(form) { if (form !== this.form) this.build(form); }

  setFootwear(kind) {
    this.footwear = kind;
    for (const f of this.rig.feet) {
      f.userData.shoe.visible = kind === 'shoes' || this.form === 'child';
      f.userData.slipper.visible = kind === 'slippers' && this.form !== 'child';
    }
  }

  get speed() { return this.form === 'child' ? 2.3 : 2.05; }

  face(angle, instant = false) { this.targetHeading = angle; if (instant) this.heading = angle; }
  faceToward(x, z) { this.targetHeading = Math.atan2(x - this.root.position.x, z - this.root.position.z); }

  sit(x, z, heading, seatY = 0.45) {
    this.pose = 'sit'; this.sitY = seatY;
    this.root.position.x = x; this.root.position.z = z;
    this.targetHeading = heading; this.vel.set(0, 0);
  }
  stand() { this.pose = 'stand'; }

  play(action, duration = 0.9) { this.action = { name: action, t: 0, d: duration }; }

  // move = desired world-space direction (x, z), magnitude 0..1
  update(dt, move, collider) {
    this.time += dt;
    const r = this.rig;
    if (this.pose === 'sit') move = { x: 0, z: 0 };

    const tx = move.x * this.speed, tz = move.z * this.speed;
    const k = 1 - Math.exp(-dt * 9);
    this.vel.x += (tx - this.vel.x) * k;
    this.vel.y += (tz - this.vel.y) * k;
    const sp = this.vel.length();

    if (sp > 0.02) {
      const p = this.root.position;
      p.x += this.vel.x * dt; p.z += this.vel.y * dt;
      if (collider) collider.resolve(p, this.radius);
    }
    if (Math.hypot(move.x, move.z) > 0.1) this.targetHeading = Math.atan2(move.x, move.z);
    let dh = this.targetHeading - this.heading;
    dh = Math.atan2(Math.sin(dh), Math.cos(dh));
    this.heading += dh * (1 - Math.exp(-dt * 11));
    this.body.rotation.y = this.heading;

    // walk cycle
    const walking = sp > 0.15 ? 1 : 0;
    this.walkAmt += (walking - this.walkAmt) * (1 - Math.exp(-dt * 10));
    const stride = this.form === 'child' ? 0.75 : 0.62;
    this.walkPhase += (sp / stride) * Math.PI * dt;
    const ph = this.walkPhase, w = this.walkAmt;

    if (walking) {
      this.stepAccum += sp * dt;
      if (this.stepAccum > stride * 0.5) { this.stepAccum = 0; this.onStep?.(); }
    }

    const sitting = this.pose === 'sit';
    const breathe = Math.sin(this.time * 2.1) * 0.012;
    const bob = Math.abs(Math.sin(ph)) * 0.025 * w;
    const baseHip = this.form === 'child' ? 0.56 : 0.88;

    r.feet.forEach((f, i) => {
      const s = i === 0 ? 1 : -1;
      const swing = Math.sin(ph) * s;
      f.position.z = sitting ? 0.3 : swing * 0.13 * w;
      f.position.y = sitting ? 0.0 : Math.max(0, Math.cos(ph) * s) * 0.05 * w;
      f.rotation.x = sitting ? 0 : swing * 0.25 * w;
    });

    const hipY = sitting ? this.sitY + 0.06 : baseHip + bob;
    r.hips.position.y += (hipY - r.hips.position.y) * (sitting ? 1 - Math.exp(-dt * 6) : 1);
    r.torso.position.y = r.hips.position.y;
    r.skirt.rotation.x = sitting ? -1.25 : Math.sin(ph * 2) * 0.03 * w;
    r.skirt.scale.y = sitting ? 0.55 : 1;
    r.torso.scale.y = 1 + breathe;
    r.torso.rotation.z = Math.sin(ph) * 0.03 * w;
    r.head.rotation.y = Math.sin(this.time * 0.6) * 0.08 * (1 - w);
    r.head.rotation.x = Math.sin(this.time * 2.1 + 1) * 0.02;

    // arms: swing, or an action pose
    let reach = 0;
    if (this.action) {
      const a = this.action; a.t += dt;
      const u = Math.min(1, a.t / a.d);
      reach = Math.sin(u * Math.PI);
      if (a.t >= a.d) this.action = null;
    }
    r.arms.forEach((arm, i) => {
      const s = i === 0 ? 1 : -1;
      let rx = -Math.sin(ph) * s * 0.55 * w;
      if (sitting) rx = -0.6;
      if (reach) {
        const name = this.action?.name;
        if (name === 'wave') rx = i === 1 ? -2.6 * reach : rx;
        else if (name === 'hug') rx = -1.3 * reach;
        else rx = rx * (1 - reach) - 1.35 * reach;
      }
      if (this.showBag && i === 1) rx = Math.min(rx, -0.05);
      arm.rotation.x = rx;
    });
    if (this.rig.bag) this.rig.bag.rotation.x = -r.arms[1].rotation.x;
  }
}

function mulberry(a) {
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
