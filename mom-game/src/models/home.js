import * as THREE from 'three';
import { mat, uniqueMat, box, cyl, sphere, capsule, cone, plane, at, group, canvasTexture, glowSprite } from './kit.js';

// Procedural low-poly furniture for the living room + kitchen.
// Convention: each builder faces +z, sits on y = 0, centered on x = z = 0.

export const P = {
  wall: '#EFE3D0', tvWall: '#B9A58C', floor: '#DDBE92', base: '#EAD8B8',
  sofa: '#3A3430', curtain: '#C4A3AE', sheer: '#FBF1EA', cream: '#F6ECD6', woodTop: '#C48A52',
  palm: '#5E9A44', pot: '#C27A1E', rug: '#F7F7F5',
  counter: '#F8F1E3', upper: '#EEF0EC', backsplash: '#7BA7A3', panel: '#ADA69C', darkFridge: '#3C4045', silver: '#C3C9CC',
  table: '#C4AF92', legs: '#4A3524', chair: '#2B2622', fan: '#7BD0D6', jasmineY: '#E8C547', jasmineG: '#4E8A3E', holder: '#EBC8C0',
};

// ── Sofa ────────────────────────────────────────────────────
export function sofa(len = 2.1) {
  const g = new THREE.Group();
  const leather = { rough: 0.48, metal: 0.02 };
  const base = box(len, 0.28, 0.86, P.sofa, { r: 0.06, opts: leather }); at(base, 0, 0.06, 0); g.add(base);
  const back = box(len, 0.5, 0.24, P.sofa, { r: 0.09, opts: leather }); at(back, 0, 0.3, -0.31); g.add(back);
  for (const sx of [-1, 1]) {
    const arm = box(0.2, 0.32, 0.86, P.sofa, { r: 0.08, opts: leather }); at(arm, sx * (len / 2 - 0.1), 0.3, 0); g.add(arm);
    const foot = cyl(0.025, 0.02, 0.07, '#2A211C'); at(foot, sx * (len / 2 - 0.12), 0, 0.33); g.add(foot);
    const foot2 = foot.clone(); foot2.position.z = -0.33; g.add(foot2);
  }
  const seatW = (len - 0.42) / 3;
  for (let i = 0; i < 3; i++) {
    const seat = box(seatW - 0.02, 0.13, 0.62, '#433C37', { r: 0.05, opts: leather }); at(seat, -len / 2 + 0.21 + seatW * (i + 0.5), 0.33, 0.08); g.add(seat);
    const bc = box(seatW - 0.03, 0.4, 0.16, '#433C37', { r: 0.07, opts: leather }); at(bc, seat.position.x, 0.42, -0.18); bc.rotation.x = -0.12; g.add(bc);
  }
  // patterned throw cushion (lift it to find a note)
  const tex = canvasTexture(128, 128, (c) => {
    c.fillStyle = '#E9D7C0'; c.fillRect(0, 0, 128, 128);
    c.strokeStyle = '#B8705A'; c.lineWidth = 6;
    for (let i = -128; i < 256; i += 32) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i + 128, 128); c.stroke(); c.beginPath(); c.moveTo(i + 128, 0); c.lineTo(i, 128); c.stroke(); }
    c.fillStyle = '#5E8F95'; for (let x = 16; x < 128; x += 32) for (let y = 0; y < 128; y += 32) { c.beginPath(); c.arc(x, y, 5, 0, 7); c.fill(); }
  });
  const pillowMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 });
  const pillow = box(0.42, 0.38, 0.13, null, { r: 0.06, m: pillowMat });
  const pillowPivot = group(pillow); at(pillowPivot, len / 2 - 0.42, 0.42, -0.07); pillow.rotation.set(-0.25, 0.25, 0.08);
  g.add(pillowPivot);
  return { group: g, pillow: pillowPivot };
}

// ── Palm in amber pot ───────────────────────────────────────
export function palm() {
  const g = new THREE.Group();
  const pot = cyl(0.25, 0.19, 0.42, P.pot, { seg: 10, opts: { rough: 0.35, metal: 0.05 } }); g.add(pot);
  const rim = cyl(0.265, 0.265, 0.05, '#B06A16', { seg: 10, opts: { rough: 0.35 } }); rim.position.y = 0.4; g.add(rim);
  const soil = cyl(0.23, 0.23, 0.02, '#5A4030', { seg: 10 }); soil.position.y = 0.42; g.add(soil);
  const leaves = new THREE.Group(); leaves.position.y = 0.42; g.add(leaves);
  const fronds = [];
  const stems = 3;
  for (let s = 0; s < stems; s++) {
    const h = 0.55 + s * 0.22;
    const stem = cyl(0.025, 0.03, h, '#7A6A3A', { seg: 5 }); at(stem, (s - 1) * 0.06, 0, (s % 2) * 0.05 - 0.02); stem.rotation.z = (s - 1) * 0.1; leaves.add(stem);
    const top = new THREE.Vector3((s - 1) * 0.06 + Math.sin((s - 1) * 0.1) * -h, h, stem.position.z);
    for (let i = 0; i < 6; i++) {
      const frond = new THREE.Group(); frond.position.copy(top);
      frond.rotation.y = (i / 6) * Math.PI * 2 + s;
      let prev = frond, len = 0.24, w = 0.2;
      for (let k = 0; k < 3; k++) {
        const seg = new THREE.Group(); seg.position.set(0, 0, k === 0 ? 0 : len); seg.rotation.x = k === 0 ? -0.5 : 0.35;
        const leaf = box(w, 0.012, len, k % 2 ? '#6BA84C' : P.palm, { cast: true }); leaf.geometry = leaf.geometry; leaf.position.z = len / 2; leaf.position.y = -0.006;
        seg.add(leaf); prev.add(seg); prev = seg; len *= 0.9; w *= 0.78;
      }
      leaves.add(frond); fronds.push(frond);
    }
  }
  return { group: g, leaves, fronds };
}

// ── TV stand (cream French-country) + TV ────────────────────
export function tvStand(len = 1.7) {
  const g = new THREE.Group();
  const body = box(len, 0.46, 0.44, P.cream, { r: 0.03 }); at(body, 0, 0.1, 0); g.add(body);
  const top = box(len + 0.06, 0.04, 0.48, P.woodTop, { r: 0.015 }); at(top, 0, 0.56, 0); g.add(top);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const leg = cyl(0.03, 0.022, 0.12, P.cream, { seg: 6 }); at(leg, sx * (len / 2 - 0.06), 0, sz * 0.17); g.add(leg);
  }
  // doors: left (big), middle open shelf, right (small)
  const doorL = new THREE.Group(); at(doorL, -len / 2 + 0.04, 0.14, 0.225);
  const dl = box(0.66, 0.38, 0.025, '#FBF3E1', { r: 0.012 }); dl.position.x = 0.33; doorL.add(dl);
  const kl = sphere(0.018, P.woodTop); at(kl, 0.6, 0.19, 0.025); doorL.add(kl);
  const insetL = box(0.54, 0.26, 0.01, '#EFE2C8', { r: 0.01 }); at(insetL, 0.33, 0.06, 0.016); doorL.add(insetL);
  g.add(doorL);
  const doorR = new THREE.Group(); at(doorR, len / 2 - 0.04, 0.14, 0.225);
  const dr = box(0.4, 0.38, 0.025, '#FBF3E1', { r: 0.012 }); dr.position.x = -0.2; doorR.add(dr);
  const kr = sphere(0.018, P.woodTop); at(kr, -0.35, 0.19, 0.025); doorR.add(kr);
  g.add(doorR);
  const shelfGap = box(len - 1.18, 0.3, 0.02, '#8C6A4A'); at(shelfGap, -len / 2 + 0.72 + (len - 1.18) / 2 + 0.01, 0.18, 0.21); g.add(shelfGap);
  // hidden notes behind the doors (little envelopes)
  const envL = box(0.14, 0.1, 0.01, '#FFF6E6'); at(envL, -len / 2 + 0.4, 0.2, 0.18); envL.rotation.x = -0.3; g.add(envL);
  const envR = box(0.12, 0.09, 0.01, '#FFF6E6'); at(envR, len / 2 - 0.25, 0.2, 0.18); envR.rotation.x = -0.3; g.add(envR);
  // TV
  const tv = new THREE.Group(); tv.position.set(0, 0.58, -0.05); g.add(tv);
  const foot = box(0.36, 0.02, 0.18, '#2B2B2E'); tv.add(foot);
  const neck = box(0.06, 0.1, 0.04, '#2B2B2E'); at(neck, 0, 0.02, -0.02); tv.add(neck);
  const frame = box(1.24, 0.72, 0.05, '#232326', { r: 0.01, opts: { rough: 0.3 } }); at(frame, 0, 0.1, -0.02); tv.add(frame);
  const screenMat = new THREE.MeshBasicMaterial({ color: '#1a1a1e', toneMapped: false });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.18, 0.66), screenMat); at(screen, 0, 0.46, 0.008); tv.add(screen);
  return { group: g, doorL, doorR, screen, envL, envR };
}

// ── Phone cabinet + landline ─────────────────────────────────
export function phoneCabinet() {
  const g = new THREE.Group();
  const c = box(0.5, 0.66, 0.4, P.cream, { r: 0.025 }); g.add(c);
  const t = box(0.54, 0.035, 0.43, P.woodTop, { r: 0.012 }); t.position.y = 0.66; g.add(t);
  const drawer = box(0.42, 0.18, 0.02, '#FBF3E1', { r: 0.01 }); at(drawer, 0, 0.42, 0.2); g.add(drawer);
  const knob = sphere(0.016, P.woodTop); at(knob, 0, 0.51, 0.22); g.add(knob);
  const doily = cyl(0.17, 0.17, 0.004, '#FFFFFF', { seg: 12 }); doily.position.y = 0.695; g.add(doily);
  const base = box(0.22, 0.07, 0.2, '#EDE6DA', { r: 0.025 }); at(base, 0, 0.7, 0); g.add(base);
  const keys = box(0.12, 0.004, 0.08, '#C9C1B4'); at(keys, 0, 0.772, 0.04); keys.rotation.x = -0.25; g.add(keys);
  const handset = new THREE.Group(); at(handset, 0, 0.79, -0.03);
  const hs = capsule(0.028, 0.16, '#EDE6DA'); hs.rotation.z = Math.PI / 2; handset.add(hs);
  const cord = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.006, 4, 12), mat('#D9D0C3')); at(cord, -0.13, -0.04, 0.0); cord.rotation.y = 1.2; handset.add(cord);
  g.add(handset);
  return { group: g, handset };
}

// ── Stool with succulents ───────────────────────────────────
export function succulentStool() {
  const g = new THREE.Group();
  const seat = cyl(0.2, 0.2, 0.05, P.woodTop, { seg: 12 }); seat.position.y = 0.42; g.add(seat);
  for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; const leg = cyl(0.02, 0.02, 0.42, '#A8743F', { seg: 5 }); at(leg, Math.cos(a) * 0.14, 0, Math.sin(a) * 0.14); leg.rotation.set(Math.sin(a) * 0.08, 0, -Math.cos(a) * 0.08); g.add(leg); }
  const flowers = [];
  const spots = [[-0.09, -0.06], [0.09, -0.04], [0, 0.1]];
  spots.forEach(([x, z], i) => {
    const pot = cyl(0.065, 0.05, 0.08, ['#E9D8C4', '#C27A1E', '#9CB5B0'][i], { seg: 8 }); at(pot, x, 0.47, z); g.add(pot);
    for (let k = 0; k < 7; k++) {
      const a = (k / 7) * Math.PI * 2, leaf = cone(0.022, 0.07, ['#7FB08A', '#8DBA7C', '#6E9E8C'][i], { seg: 4 });
      at(leaf, x + Math.cos(a) * 0.02, 0.55, z + Math.sin(a) * 0.02); leaf.rotation.set(Math.sin(a) * 0.7, 0, -Math.cos(a) * 0.7); g.add(leaf);
    }
    const f = sphere(0.022, ['#F4A0B4', '#FFD27A', '#F4A0B4'][i], { w: 6, h: 4, opts: { emissive: '#FF9FB0', emissiveIntensity: 0.2 } }); at(f, x, 0.62, z); f.scale.setScalar(0.001); g.add(f); flowers.push(f);
  });
  const can = new THREE.Group(); // watering can, appears while watering
  const body = cyl(0.07, 0.08, 0.13, '#7BB6B0', { seg: 8 }); can.add(body);
  const spout = cyl(0.012, 0.018, 0.2, '#7BB6B0', { seg: 5 }); at(spout, 0.08, 0.04, 0); spout.rotation.z = -1.0; can.add(spout);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.01, 4, 8, Math.PI), mat('#7BB6B0')); at(handle, -0.03, 0.13, 0); can.add(handle);
  can.visible = false; can.position.set(-0.05, 0.8, 0); g.add(can);
  const giftBox = box(0.1, 0.08, 0.1, '#E98F9E', { r: 0.01 }); at(giftBox, 0, 0, 0); g.add(giftBox);
  const rb = box(0.02, 0.081, 0.102, '#FFF3C9'); g.add(rb);
  return { group: g, flowers, can };
}

// ── White diamond rug ───────────────────────────────────────
export function rug(w, d) {
  const tex = canvasTexture(256, 320, (c, W, H) => {
    c.fillStyle = '#FBFAF6'; c.fillRect(0, 0, W, H);
    c.strokeStyle = 'rgba(190,175,150,0.55)'; c.lineWidth = 3;
    for (let i = -H; i < W + H; i += 40) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i + H, H); c.stroke(); c.beginPath(); c.moveTo(i + H, 0); c.lineTo(i, H); c.stroke(); }
    c.strokeStyle = 'rgba(200,170,140,0.6)'; c.lineWidth = 8; c.strokeRect(10, 10, W - 20, H - 20);
  });
  const m = new THREE.MeshStandardMaterial({ map: tex, roughness: 1 });
  const r = box(w, 0.018, d, null, { r: 0.008, m, cast: false }); return r;
}

// ── Side table + table lamp ─────────────────────────────────
export function sideLamp() {
  const g = new THREE.Group();
  const t = cyl(0.2, 0.2, 0.03, P.woodTop, { seg: 12 }); t.position.y = 0.52; g.add(t);
  const leg = cyl(0.03, 0.05, 0.52, '#8C5E34', { seg: 6 }); g.add(leg);
  const lb = cyl(0.05, 0.07, 0.2, '#EADBC4', { seg: 8 }); lb.position.y = 0.55; g.add(lb);
  const shade = cyl(0.09, 0.14, 0.16, '#FFF1D6', { seg: 10, opts: { emissive: '#FFC98A', emissiveIntensity: 0.6 } }); shade.position.y = 0.75; g.add(shade);
  const halo = glowSprite('#FFC98A', 0.8, 0.35); halo.position.y = 0.83; g.add(halo);
  return { group: g, shade, halo };
}

// ── LF shopping bag ─────────────────────────────────────────
export function lfBag() {
  const g = new THREE.Group();
  const tex = canvasTexture(128, 128, (c) => {
    c.fillStyle = '#F2EBDD'; c.fillRect(0, 0, 128, 128);
    c.fillStyle = '#6B4E3A'; c.font = '700 34px "Gowun Batang", serif'; c.textAlign = 'center'; c.fillText('LF', 64, 70);
    c.font = '14px "Gowun Batang", serif'; c.fillText('SQUARE', 64, 92);
  });
  const m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 });
  const body = box(0.38, 0.42, 0.14, null, { m }); g.add(body);
  const flap = box(0.38, 0.01, 0.14, '#E9DFCC'); flap.position.y = 0.42; g.add(flap);
  for (const sx of [-1, 1]) { const h = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.008, 4, 10, Math.PI), mat('#3A2E28')); at(h, sx * 0.09, 0.42, 0); g.add(h); }
  const tissue = cone(0.12, 0.12, '#F4B6C2', { seg: 5 }); tissue.position.y = 0.38; g.add(tissue);
  return { group: g, tissue };
}

// ── Intercom panel ──────────────────────────────────────────
export function intercom() {
  const g = new THREE.Group();
  const p = box(0.2, 0.28, 0.035, '#F4F1EA', { r: 0.012 }); g.add(p);
  const s = box(0.14, 0.1, 0.005, '#2F3A40'); at(s, 0, 0.15, 0.019); g.add(s);
  const light = sphere(0.012, '#9BE39A', { opts: { emissive: '#7CE37A', emissiveIntensity: 1.2 } }); at(light, 0.06, 0.05, 0.02); g.add(light);
  for (let i = 0; i < 3; i++) { const b = box(0.035, 0.025, 0.01, '#DAD4C8', { r: 0.005 }); at(b, -0.05 + i * 0.05, 0.03, 0.02); g.add(b); }
  return { group: g, light };
}

// ── Wall air conditioner ────────────────────────────────────
export function wallAC() {
  const g = new THREE.Group();
  const b = box(0.95, 0.3, 0.22, '#FBFAF6', { r: 0.06 }); g.add(b);
  const vent = box(0.8, 0.03, 0.02, '#D9D4CA'); at(vent, 0, 0.04, 0.11); g.add(vent);
  return g;
}

// ── Doors ───────────────────────────────────────────────────
export function door(w = 0.9, h = 2.05, color = '#F3E7D3') {
  const g = new THREE.Group();
  const frame = box(w + 0.12, h + 0.06, 0.06, '#E6D2B2', { r: 0.01 }); g.add(frame);
  const leafPivot = new THREE.Group(); at(leafPivot, -w / 2, 0, 0.035); g.add(leafPivot);
  const leaf = box(w, h, 0.04, color, { r: 0.012 }); leaf.position.x = w / 2; leafPivot.add(leaf);
  const inset1 = box(w * 0.7, h * 0.35, 0.01, '#EAD9BE', { r: 0.01 }); at(inset1, w / 2, h * 0.55, 0.024); leafPivot.add(inset1);
  const inset2 = inset1.clone(); inset2.position.y = h * 0.12; leafPivot.add(inset2);
  const handle = box(0.12, 0.025, 0.04, '#B8A27A', { r: 0.01, opts: { metal: 0.6, rough: 0.35 } }); at(handle, w - 0.12, h * 0.48, 0.05); leafPivot.add(handle);
  return { group: g, leaf: leafPivot };
}

// ── Kitchen ─────────────────────────────────────────────────
export function silverFridge() {
  const g = new THREE.Group();
  const W = 0.9, H = 1.85, D = 0.72;
  const body = box(W, H, D - 0.05, '#AEB6BA', { r: 0.02, opts: { rough: 0.4, metal: 0.3 } }); at(body, 0, 0, -0.025); g.add(body);
  // inside (lit) — visible when the right door swings open
  const inside = box(W - 0.08, H - 0.12, 0.02, '#FFFDF6', { opts: { emissive: '#FFF4D8', emissiveIntensity: 0.6 } }); at(inside, 0, 0.06, D / 2 - 0.06); g.add(inside);
  const shelves = [];
  for (let i = 0; i < 4; i++) { const s = box(W - 0.1, 0.012, 0.05, '#E6F0F2', { opts: { transparent: true, opacity: 0.8 } }); at(s, 0, 0.4 + i * 0.35, D / 2 - 0.045); g.add(s); shelves.push(s); }
  // little cake on a shelf
  const cake = new THREE.Group(); at(cake, 0.22, 0.75 + 0.012, D / 2 - 0.02); cake.visible = false; g.add(cake); // shown when the door opens
  const c1 = cyl(0.1, 0.1, 0.09, '#FFF4EC', { seg: 14 }); cake.add(c1);
  const c2 = cyl(0.102, 0.102, 0.02, '#F4B6C2', { seg: 14 }); c2.position.y = 0.08; cake.add(c2);
  for (let i = 0; i < 6; i++) { const b = sphere(0.014, '#E4574F', { w: 5, h: 4 }); const a = (i / 6) * Math.PI * 2; at(b, Math.cos(a) * 0.07, 0.105, Math.sin(a) * 0.07); cake.add(b); }
  const candle = cyl(0.007, 0.007, 0.07, '#C9B6E4', { seg: 6 }); candle.position.y = 0.1; cake.add(candle);
  const flame = glowSprite('#FFB347', 0.12, 0); flame.position.y = 0.2; cake.add(flame);
  const flameCore = sphere(0.01, '#FFF2B0', { opts: { emissive: '#FFC060', emissiveIntensity: 3 } }); flameCore.scale.y = 1.8; flameCore.position.y = 0.185; flameCore.visible = false; cake.add(flameCore);
  // doors (side-by-side): left fixed-ish, right swings
  const doorM = mat(P.silver, { rough: 0.3, metal: 0.45 });
  const left = box(W / 2 - 0.01, H - 0.02, 0.06, null, { r: 0.015, m: doorM }); at(left, -W / 4, 0.01, D / 2 - 0.03); g.add(left);
  const rightPivot = new THREE.Group(); at(rightPivot, W / 2, 0.01, D / 2); g.add(rightPivot);
  const right = box(W / 2 - 0.01, H - 0.02, 0.06, null, { r: 0.015, m: doorM }); at(right, -W / 4, 0, -0.03); rightPivot.add(right);
  // faint flower etching
  const etch = canvasTexture(64, 128, (c) => { c.strokeStyle = 'rgba(255,255,255,0.75)'; c.lineWidth = 2; for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(20 + (i % 2) * 22, 30 + i * 18, 8, 0, 7); c.stroke(); } c.beginPath(); c.moveTo(30, 120); c.bezierCurveTo(20, 80, 44, 60, 30, 20); c.stroke(); });
  const etchM = new THREE.MeshBasicMaterial({ map: etch, transparent: true, opacity: 0.55, depthWrite: false });
  for (const [obj, x] of [[g, -W / 4], [rightPivot, -W / 4]]) {
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.6), etchM); at(pl, x, 1.2, obj === g ? D / 2 + 0.001 : 0.001); obj.add(pl);
  }
  for (const sx of [-1, 1]) { const h = box(0.025, 0.5, 0.03, '#8F9AA0', { r: 0.01, opts: { metal: 0.6, rough: 0.3 } }); at(h, sx * 0.03, 0.8, sx < 0 ? D / 2 + 0.01 : 0.02); (sx < 0 ? g : rightPivot).add(h); if (sx > 0) h.position.x = -0.03; }
  const light = new THREE.PointLight('#FFF4D8', 0, 1.6, 2); light.position.set(0, 1.2, D / 2 + 0.2); g.add(light);
  const candleLight = new THREE.PointLight('#FFB347', 0, 1.5, 2); candleLight.position.set(0.22, 1.05, D / 2 + 0.1); g.add(candleLight);
  return { group: g, door: rightPivot, cake, flame, flameCore, light, candleLight };
}

export function darkFridge() {
  const g = new THREE.Group();
  const W = 0.9, H = 1.85, D = 0.72;
  const m = mat(P.darkFridge, { rough: 0.35, metal: 0.3 });
  const body = box(W, H, D, null, { r: 0.02, m }); g.add(body);
  // French doors on top, two drawers below
  for (const sx of [-1, 1]) { const d = box(W / 2 - 0.015, 1.05, 0.04, null, { r: 0.01, m }); at(d, sx * W / 4, 0.78, D / 2); g.add(d); const h = box(0.02, 0.4, 0.03, '#9AA0A4', { opts: { metal: 0.6, rough: 0.3 } }); at(h, sx * 0.03, 1.1, D / 2 + 0.035); g.add(h); }
  for (let i = 0; i < 2; i++) { const d = box(W - 0.02, 0.36, 0.04, null, { r: 0.01, m }); at(d, 0, 0.02 + i * 0.38, D / 2); g.add(d); }
  // magnets + a little photo
  const magnets = new THREE.Group();
  [['#F4B6C2', -0.2, 1.55], ['#E8C547', 0.12, 1.62], ['#7BD0D6', 0.25, 1.35]].forEach(([c, x, y]) => { const s = cyl(0.025, 0.025, 0.015, c, { seg: 8 }); s.rotation.x = Math.PI / 2; at(s, x, y, D / 2 + 0.03); magnets.add(s); });
  const photo = box(0.16, 0.2, 0.005, '#FFFFFF'); at(photo, -0.12, 1.3, D / 2 + 0.025); magnets.add(photo);
  const pic = box(0.13, 0.13, 0.003, '#E7B892'); at(pic, -0.12, 1.33, D / 2 + 0.028); magnets.add(pic);
  g.add(magnets);
  return { group: g };
}

export function counterRun(len = 1.45) {
  const g = new THREE.Group();
  const D = 0.62;
  const lower = box(len, 0.84, D - 0.04, P.counter, { r: 0.015 }); at(lower, 0, 0, -0.02); g.add(lower);
  const kick = box(len, 0.08, 0.02, '#D9CDB8'); at(kick, 0, 0, D / 2 - 0.07); g.add(kick);
  for (let i = 0; i < 3; i++) { const dr = box(len / 3 - 0.02, 0.7, 0.02, '#FBF6EC', { r: 0.01 }); at(dr, -len / 2 + len / 6 + (i * len) / 3, 0.1, D / 2 - 0.03); g.add(dr); }
  const top = box(len + 0.02, 0.04, D, '#FBF8F2', { r: 0.01, opts: { rough: 0.35 } }); top.position.y = 0.86; g.add(top);
  // backsplash tiles (teal)
  const tileTex = canvasTexture(256, 128, (c, W, H) => { c.fillStyle = P.backsplash; c.fillRect(0, 0, W, H); c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 2; for (let x = 0; x < W; x += 32) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); } for (let y = 0; y < H; y += 16) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); } });
  const bs = box(len, 0.62, 0.015, null, { m: new THREE.MeshStandardMaterial({ map: tileTex, roughness: 0.4 }) }); at(bs, 0, 0.9, -D / 2 + 0.008); g.add(bs);
  // sink (left), hob (right)
  const sinkX = -len / 2 + 0.52, hobX = len / 2 - 0.27;
  const sink = box(0.42, 0.012, 0.36, '#C8CED1', { opts: { metal: 0.6, rough: 0.25 } }); at(sink, sinkX, 0.885, 0.02); g.add(sink);
  const basin = box(0.36, 0.01, 0.3, '#9AA3A8', { opts: { metal: 0.6, rough: 0.3 } }); at(basin, sinkX, 0.893, 0.02); g.add(basin);
  const tap = cyl(0.015, 0.018, 0.28, '#C8CED1', { seg: 6, opts: { metal: 0.7, rough: 0.2 } }); at(tap, sinkX, 0.88, -0.2); g.add(tap);
  const spout = cyl(0.012, 0.012, 0.18, '#C8CED1', { seg: 6, opts: { metal: 0.7, rough: 0.2 } }); at(spout, sinkX, 1.15, -0.2); spout.rotation.x = Math.PI / 2; g.add(spout);
  const glove = box(0.09, 0.025, 0.18, '#F5D33A', { r: 0.01 }); at(glove, sinkX + 0.22, 0.885, -0.18); glove.rotation.y = 0.4; g.add(glove);
  const hob = box(0.5, 0.012, 0.46, '#121214', { opts: { rough: 0.15 } }); at(hob, hobX, 0.88, 0.02); g.add(hob);
  for (const [dx, dz] of [[-0.12, -0.1], [0.12, 0.08]]) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.004, 3, 16), mat('#6A6A70')); r.rotation.x = Math.PI / 2; at(r, hobX + dx, 0.894, dz); g.add(r); }
  // pot with lid (birthday seaweed soup)
  const pot = new THREE.Group(); at(pot, hobX - 0.12, 0.892, -0.08); g.add(pot);
  const pb = cyl(0.12, 0.11, 0.15, '#D9DCDD', { seg: 12, opts: { metal: 0.5, rough: 0.3 } }); pot.add(pb);
  const soup = cyl(0.11, 0.11, 0.01, '#4A6B3A', { seg: 12 }); soup.position.y = 0.13; pot.add(soup);
  for (const sx of [-1, 1]) { const h = box(0.05, 0.02, 0.025, '#3A3430'); at(h, sx * 0.14, 0.11, 0); pot.add(h); }
  const lid = new THREE.Group(); lid.position.y = 0.15; pot.add(lid);
  const ld = cyl(0.125, 0.125, 0.015, '#E3E6E7', { seg: 12, opts: { metal: 0.5, rough: 0.3 } }); lid.add(ld);
  const knob = sphere(0.022, '#3A3430'); knob.position.y = 0.03; lid.add(knob);
  // range hood + light
  const hood = box(0.55, 0.16, 0.42, '#E7E9E8', { r: 0.02 }); at(hood, hobX, 1.62, -0.08); g.add(hood);
  const hoodLight = new THREE.PointLight('#FFC98A', 0.4, 2.2, 2); hoodLight.position.set(hobX, 1.5, 0.0); g.add(hoodLight);
  // whale glass behind the hob
  const whaleTex = canvasTexture(256, 160, (c, W, H) => {
    const grd = c.createLinearGradient(0, 0, 0, H); grd.addColorStop(0, '#0B1622'); grd.addColorStop(1, '#13283A'); c.fillStyle = grd; c.fillRect(0, 0, W, H);
  });
  const glass = box(0.56, 0.62, 0.012, null, { m: new THREE.MeshStandardMaterial({ map: whaleTex, roughness: 0.15 }) }); at(glass, hobX, 0.9, -D / 2 + 0.018); g.add(glass);
  const whaleCanvas = document.createElement('canvas'); whaleCanvas.width = 256; whaleCanvas.height = 160;
  drawWhale(whaleCanvas.getContext('2d'), 0);
  const whaleT = new THREE.CanvasTexture(whaleCanvas); whaleT.colorSpace = THREE.SRGBColorSpace;
  const whaleM = new THREE.MeshBasicMaterial({ map: whaleT, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.55, toneMapped: false });
  const whale = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.32), whaleM); at(whale, hobX, 1.22, -D / 2 + 0.026); g.add(whale);
  // upper cabinets left of the hood
  const up = box(len - 0.6, 0.62, 0.34, P.upper, { r: 0.015 }); at(up, -len / 2 + (len - 0.6) / 2, 1.62, -D / 2 + 0.17); g.add(up);
  // dish rack with plates
  const rack = new THREE.Group(); at(rack, -len / 2 + 0.13, 0.88, -0.02); g.add(rack);
  const rb = box(0.2, 0.03, 0.34, '#D7DCDD', { opts: { metal: 0.4, rough: 0.4 } }); rack.add(rb);
  const plates = [];
  for (let i = 0; i < 4; i++) { const pl = cyl(0.1, 0.1, 0.012, ['#FFFFFF', '#F6E8D8', '#FFFFFF', '#E9F0EE'][i], { seg: 12 }); pl.rotation.x = Math.PI / 2 - 0.25; at(pl, 0, 0.11, -0.12 + i * 0.06); rack.add(pl); plates.push(pl); }
  return { group: g, lid, pot, soup, hood, hoodLight, whale, whaleCanvas, whaleT, sinkX, hobX, plates };
}

export function drawWhale(c, phase, glow = 0.6) {
  const W = 256, H = 160;
  c.clearRect(0, 0, W, H);
  c.save();
  c.translate(W / 2 + Math.sin(phase) * 40, H / 2 + Math.sin(phase * 2) * 8);
  c.scale(Math.cos(phase) >= 0 ? 1 : -1, 1);
  c.shadowColor = '#7FD6FF'; c.shadowBlur = 16 * glow + 6;
  c.fillStyle = `rgba(110,200,255,${0.6 + glow * 0.4})`;
  c.beginPath(); c.ellipse(0, 0, 62, 26, 0, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.moveTo(-55, 0); c.lineTo(-92, -20 + Math.sin(phase * 4) * 6); c.lineTo(-84, 2); c.lineTo(-92, 22 + Math.sin(phase * 4) * 6); c.closePath(); c.fill();
  c.beginPath(); c.ellipse(5, 22, 18, 6, 0.4, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#0B1622'; c.beginPath(); c.arc(38, -6, 3.5, 0, 7); c.fill();
  c.restore();
  c.fillStyle = `rgba(160,225,255,${0.3 + glow * 0.4})`;
  for (let i = 0; i < 9; i++) { c.beginPath(); c.arc((i * 47 + phase * 30) % W, (i * 31) % H, 1.6, 0, 7); c.fill(); }
}

export function sideCounter(len = 0.75) {
  // short counter along the east wall (holds tissue box, clock, flower jar)
  const g = new THREE.Group();
  const lower = box(len, 0.84, 0.58, P.counter, { r: 0.015 }); g.add(lower);
  const top = box(len + 0.02, 0.04, 0.6, '#FBF8F2', { r: 0.01, opts: { rough: 0.35 } }); top.position.y = 0.86; g.add(top);
  const dr = box(len - 0.04, 0.7, 0.02, '#FBF6EC', { r: 0.01 }); at(dr, 0, 0.1, 0.29); g.add(dr);
  return g;
}

export function tissueBox() {
  const g = new THREE.Group();
  const holder = box(0.27, 0.07, 0.15, P.holder, { r: 0.02 }); g.add(holder);
  const tex = canvasTexture(256, 128, (c, W, H) => {
    c.fillStyle = '#FFFDF8'; c.fillRect(0, 0, W, H);
    for (let i = 0; i < 18; i++) { const x = (i * 53) % W, y = (i * 37) % H; c.strokeStyle = P.jasmineG; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 10, y + 12, x + 20, y + 4); c.stroke(); c.fillStyle = P.jasmineY; for (let k = 0; k < 5; k++) { c.beginPath(); c.arc(x + 20 + Math.cos(k * 1.26) * 5, y + 4 + Math.sin(k * 1.26) * 5, 3.5, 0, 7); c.fill(); } }
  });
  const body = box(0.25, 0.11, 0.13, null, { r: 0.012, m: new THREE.MeshStandardMaterial({ map: tex, roughness: 0.4 }) }); body.position.y = 0.02; g.add(body);
  const tissue = new THREE.Group(); tissue.position.y = 0.12; g.add(tissue);
  const t1 = cone(0.05, 0.08, '#FFFFFF', { seg: 4 }); t1.scale.z = 0.25; tissue.add(t1);
  const note = box(0.06, 0.04, 0.004, '#FFF0C8'); at(note, 0, 0.05, 0.01); note.visible = false; tissue.add(note);
  return { group: g, tissue, note };
}

export function digitalClock() {
  const g = new THREE.Group();
  const body = box(0.16, 0.09, 0.05, '#F2EEE6', { r: 0.012 }); g.add(body);
  const canvas = document.createElement('canvas'); canvas.width = 128; canvas.height = 64;
  const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.13, 0.065), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })); at(face, 0, 0.045, 0.026); g.add(face);
  const draw = (text) => {
    const c = canvas.getContext('2d');
    c.fillStyle = '#2A2622'; c.fillRect(0, 0, 128, 64);
    c.fillStyle = '#FFB87A'; c.font = '700 34px monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, 64, 34);
    tex.needsUpdate = true;
  };
  draw('7:24');
  return { group: g, draw };
}

export function flowerJar() {
  const g = new THREE.Group();
  const jar = cyl(0.09, 0.08, 0.26, '#DCEFEF', { seg: 10, opts: { transparent: true, opacity: 0.5, rough: 0.1 } }); jar.castShadow = false; g.add(jar);
  const water = cyl(0.082, 0.075, 0.16, '#BFE0DC', { seg: 10, opts: { transparent: true, opacity: 0.5 } }); g.add(water);
  const flowers = new THREE.Group(); flowers.position.y = 0.24; g.add(flowers);
  const cols = ['#B98ACF', '#FFFFFF', '#9C6DB8', '#F3EAF7', '#C9A3DE'];
  for (let i = 0; i < 16; i++) {
    const a = i * 2.4, r = 0.03 + (i % 4) * 0.025;
    const stem = new THREE.Group(); stem.rotation.set(Math.sin(a) * 0.35, 0, Math.cos(a) * 0.35); flowers.add(stem);
    const len = 0.18 + (i % 3) * 0.06;
    const st = cyl(0.004, 0.004, len, '#6E8E5A', { seg: 4, cast: false }); stem.add(st);
    if (i % 4 === 3) { const leaf = sphere(0.035, '#8FB3A0', { w: 5, h: 3 }); leaf.scale.set(1, 0.4, 1.6); leaf.position.y = len; stem.add(leaf); }
    else { const bloom = sphere(0.026 + (i % 2) * 0.008, cols[i % cols.length], { w: 6, h: 4 }); bloom.position.y = len; stem.add(bloom); }
    stem.position.set(Math.cos(a) * r * 0.4, 0, Math.sin(a) * r * 0.4);
  }
  const note = box(0.05, 0.07, 0.004, '#FFF0C8'); at(note, 0.03, 0.32, 0.05); note.rotation.z = 0.3; g.add(note);
  return { group: g, flowers, note };
}

export function diningTable(w = 1.25, d = 0.72) {
  const g = new THREE.Group();
  const tex = canvasTexture(256, 160, (c, W, H) => {
    c.fillStyle = P.table; c.fillRect(0, 0, W, H);
    for (let i = 0; i < 900; i++) { c.fillStyle = ['#5C4A3A', '#2B2420', '#E8DCC8', '#8C7458'][i % 4]; c.globalAlpha = 0.5; c.fillRect(Math.random() * W, Math.random() * H, 1.5 + Math.random() * 1.5, 1.5 + Math.random()); }
  });
  const top = box(w, 0.05, d, null, { r: 0.015, m: new THREE.MeshStandardMaterial({ map: tex, roughness: 0.35 }) }); top.position.y = 0.72; g.add(top);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const l = box(0.06, 0.72, 0.06, P.legs); at(l, sx * (w / 2 - 0.08), 0, sz * (d / 2 - 0.08)); g.add(l); }
  // home-cooked spread on mismatched floral plates
  const spread = new THREE.Group(); spread.position.y = 0.77; g.add(spread);
  const plateTex = (rim, dot) => canvasTexture(64, 64, (c) => { c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(32, 32, 32, 0, 7); c.fill(); c.strokeStyle = rim; c.lineWidth = 6; c.beginPath(); c.arc(32, 32, 27, 0, 7); c.stroke(); c.fillStyle = dot; for (let i = 0; i < 8; i++) { c.beginPath(); c.arc(32 + Math.cos(i * 0.785) * 27, 32 + Math.sin(i * 0.785) * 27, 4, 0, 7); c.fill(); } });
  const dishes = [['#C9B6E4', '#9C6DB8', '#E7A75B', -0.42, -0.12], ['#F4B6C2', '#E4574F', '#6E9E5A', -0.12, -0.16], ['#9CC5C0', '#4E8A3E', '#C4442E', 0.42, -0.16], ['#E8C547', '#C9853A', '#F2E3C6', 0.16, -0.08]];
  for (const [rim, dot, food, x, z] of dishes) {
    const top2 = new THREE.MeshStandardMaterial({ map: plateTex(rim, dot), roughness: 0.4 });
    const pl = cyl(0.11, 0.08, 0.02, '#FFFFFF', { seg: 14 }); at(pl, x, 0, z);
    const disk = new THREE.Mesh(new THREE.CircleGeometry(0.11, 14), top2); disk.rotation.x = -Math.PI / 2; disk.position.y = 0.021; pl.add(disk);
    const f = sphere(0.06, food, { w: 6, h: 4 }); f.scale.y = 0.4; f.position.y = 0.03; pl.add(f);
    spread.add(pl);
  }
  // spoon & chopsticks with a purple flower pattern
  for (const x of [-0.32, 0.27]) {
    const sp = box(0.02, 0.008, 0.2, '#D6D2DE', { opts: { metal: 0.5, rough: 0.3 } }); at(sp, x, 0, -0.26); spread.add(sp);
    const ch = box(0.008, 0.008, 0.22, '#B98ACF'); at(ch, x + 0.04, 0, -0.26); spread.add(ch);
    const ch2 = ch.clone(); ch2.position.x += 0.02; spread.add(ch2);
  }
  // persimmon bowl
  const bowl = new THREE.Group(); at(bowl, 0.35, 0, 0.17); spread.add(bowl);
  const bw = cyl(0.13, 0.07, 0.07, '#F2E8DA', { seg: 12 }); bowl.add(bw);
  const persimmons = [];
  for (let i = 0; i < 4; i++) { const p = new THREE.Group(); const a = i * 1.57; at(p, Math.cos(a) * 0.05, 0.08 + (i === 3 ? 0.04 : 0), Math.sin(a) * 0.05); const s = sphere(0.045, '#EE7B2A', { w: 8, h: 6 }); s.scale.y = 0.78; p.add(s); const l = box(0.04, 0.008, 0.03, '#4E6B32'); l.position.y = 0.035; p.add(l); bowl.add(p); persimmons.push(p); }
  // teal mango plate
  const mango = new THREE.Group(); at(mango, -0.3, 0, 0.18); spread.add(mango);
  const mp = cyl(0.1, 0.08, 0.018, '#5E9E9E', { seg: 12 }); mango.add(mp);
  const slices = [];
  for (let i = 0; i < 5; i++) { const s = box(0.04, 0.025, 0.06, '#F2B33D', { r: 0.01 }); at(s, -0.05 + i * 0.025, 0.02, (i % 2) * 0.03 - 0.015); s.rotation.y = i * 0.5; mango.add(s); slices.push(s); }
  return { group: g, persimmons, bowl, mango, slices };
}

export function chair() {
  const g = new THREE.Group();
  const seat = box(0.42, 0.08, 0.42, P.chair, { r: 0.04, opts: { rough: 0.5 } }); seat.position.y = 0.42; g.add(seat);
  const back = box(0.42, 0.42, 0.07, P.chair, { r: 0.035, opts: { rough: 0.5 } }); at(back, 0, 0.5, -0.19); back.rotation.x = -0.08; g.add(back);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const l = box(0.035, 0.42, 0.035, P.legs); at(l, sx * 0.17, 0, sz * 0.17); g.add(l); }
  return g;
}

export function fan() {
  const g = new THREE.Group();
  const base = cyl(0.15, 0.17, 0.04, P.fan, { seg: 10 }); g.add(base);
  const pole = cyl(0.025, 0.03, 0.8, '#F2F2EE', { seg: 6 }); g.add(pole);
  const head = new THREE.Group(); head.position.y = 0.92; g.add(head);
  const motor = capsule(0.07, 0.08, P.fan); motor.rotation.x = Math.PI / 2; motor.position.z = -0.06; head.add(motor);
  const cage = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.008, 4, 20), mat('#E8F4F4')); cage.position.z = 0.04; head.add(cage);
  const blades = new THREE.Group(); blades.position.z = 0.03; head.add(blades);
  for (let i = 0; i < 3; i++) { const b = box(0.08, 0.17, 0.01, '#A9E3E6', { opts: { transparent: true, opacity: 0.85 } }); b.position.y = 0.01; const p = group(b); b.position.y = 0.0; b.geometry.translate(0, 0, 0); p.rotation.z = (i / 3) * Math.PI * 2; b.position.y = 0.09; blades.add(p); }
  const hub = sphere(0.035, '#F2F2EE'); hub.position.z = 0.04; head.add(hub);
  return { group: g, blades, head };
}

export function shoeCabinet(len = 1.25) {
  const g = new THREE.Group();
  const b = box(len, 0.95, 0.34, '#F3EAD9', { r: 0.02 }); g.add(b);
  const t = box(len + 0.02, 0.03, 0.36, P.woodTop, { r: 0.01 }); t.position.y = 0.95; g.add(t);
  for (let i = 0; i < 3; i++) { const d = box(len / 3 - 0.02, 0.85, 0.02, '#FBF4E6', { r: 0.01 }); at(d, -len / 2 + len / 6 + (i * len) / 3, 0.05, 0.17); g.add(d); }
  return g;
}

export function keyTray() {
  const g = new THREE.Group();
  const tray = box(0.24, 0.025, 0.14, '#C9A06A', { r: 0.012 }); g.add(tray);
  const key = new THREE.Group(); key.position.set(0, 0.03, 0); g.add(key);
  const fob = box(0.05, 0.016, 0.08, '#202226', { r: 0.008, opts: { rough: 0.3 } }); key.add(fob);
  const btn = cyl(0.008, 0.008, 0.004, '#C0C4C8', { seg: 6 }); at(btn, 0, 0.016, 0.015); key.add(btn);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.003, 4, 10), mat('#C0C4C8', { metal: 0.7, rough: 0.3 })); ring.rotation.x = Math.PI / 2; at(ring, 0, 0.01, -0.055); key.add(ring);
  return { group: g, key };
}

export function curtainPanel(w, h, color, { opacity = 1, emissive } = {}) {
  const geo = new THREE.PlaneGeometry(w, h, 18, 1);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) { const x = pos.getX(i); pos.setZ(i, Math.sin((x / w) * Math.PI * 14) * 0.035); }
  geo.computeVertexNormals();
  geo.translate(w / 2, -h / 2, 0); // pivot at the top-left corner
  const m = uniqueMat(color, { flat: true, rough: 1, transparent: opacity < 1, opacity, side: THREE.DoubleSide, emissive, emissiveIntensity: 0.15 });
  const mesh = new THREE.Mesh(geo, m);
  mesh.castShadow = opacity >= 1; mesh.receiveShadow = true;
  return mesh;
}

export function balconyPlant() {
  const g = new THREE.Group();
  const pot = cyl(0.17, 0.13, 0.28, '#D98C5F', { seg: 9 }); g.add(pot);
  for (let i = 0; i < 9; i++) { const l = sphere(0.1, i % 2 ? '#6FA85A' : '#5E9A44', { w: 6, h: 4 }); const a = i * 0.7; at(l, Math.cos(a) * 0.1, 0.38 + (i % 3) * 0.08, Math.sin(a) * 0.1); l.scale.set(0.8, 1.3, 0.8); g.add(l); }
  const note = box(0.08, 0.06, 0.005, '#FFF0C8'); at(note, 0.12, 0.3, 0.12); note.rotation.set(-0.3, 0.6, 0.2); g.add(note);
  return { group: g, note };
}

export function pairOfShoes(builder, gap = 0.17) {
  const g = new THREE.Group();
  const a = builder(); a.position.x = -gap / 2; a.rotation.y = 0.08; const b = builder(); b.position.x = gap / 2; b.rotation.y = -0.08;
  g.add(a, b); return g;
}
