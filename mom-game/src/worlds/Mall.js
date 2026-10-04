import * as THREE from 'three';
import { content } from '../content.js';
import { Collider } from '../core/Collision.js';
import { createRig } from '../core/Lighting.js';
import { Interactables } from '../systems/Interactables.js';
import { box, cyl, sphere, cone, capsule, at, group, canvasTexture, glowSprite, glowTexture, textTexture, mat, seeded } from '../models/kit.js';
import { makeSky, makeSea, makeCoast } from '../models/outdoor.js';
import { rubberShoe } from '../entities/Mom.js';

// Tier 2: LF Square. Bright, airy, warm-white mall: atrium + fountain, skylight beams,
// open boutiques with plain text signs (no real logos). Mom's favorites get the biggest fronts.

const PI = Math.PI;
const WALL_H = 4.2;
const B = { x0: -14, x1: 14, z0: -11, z1: 10.5 };
const MALL_ITEMS = ['mall_mirror', 'mall_rack_gift', 'mall_cardigan_note', 'mall_scarf_gift', 'mall_bag_gift', 'mall_flower_note', 'mall_coffee_note', 'mall_booth_photo', 'mall_shoe_note', 'mall_fountain_gift'];

function tileFloor() {
  const t = canvasTexture(256, 256, (c) => {
    c.fillStyle = '#F6EFE4'; c.fillRect(0, 0, 256, 256);
    c.fillStyle = '#EFE4D3'; c.fillRect(0, 0, 128, 128); c.fillRect(128, 128, 128, 128);
    c.strokeStyle = 'rgba(200,180,150,0.5)'; c.lineWidth = 2; for (let i = 0; i <= 256; i += 128) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i, 256); c.stroke(); c.beginPath(); c.moveTo(0, i); c.lineTo(256, i); c.stroke(); }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(14, 11);
  return t;
}

export class Mall {
  constructor(game) {
    this.game = game; this.name = 'mall'; this.cameraDistance = 8.5;
    this.scene = new THREE.Scene(); this.collider = new Collider(); this.time = 0;
    this.walls = []; this.npcs = []; this.signs = [];
  }

  build() {
    const s = this.scene, game = this.game;
    s.background = new THREE.Color('#FFF3E2');
    s.fog = new THREE.Fog('#FFF1DE', 30, 90);
    this.rig = createRig(s, { shadowSize: 2048, extent: 18, hemi: 1.5, hemiSky: '#FFF2DC', hemiGround: '#D8B58A' });
    this.rig.aim(new THREE.Vector3(0, 0, 0), 1.05, PI + 0.5, 40);
    this.rig.sun.intensity = 2.4;
    this.inter = new Interactables(s, game.disc);

    const floor = box(B.x1 - B.x0, 0.1, B.z1 - B.z0 + 4, null, { m: new THREE.MeshStandardMaterial({ map: tileFloor(), roughness: 0.25, metalness: 0.05 }), cast: false });
    at(floor, 0, -0.1, (B.z0 + B.z1) / 2 + 2); s.add(floor);
    // outside forecourt + the car
    const court = box(40, 0.1, 14, '#D9CDBA', { cast: false }); at(court, 0, -0.12, B.z1 + 7); s.add(court);
    const lawn = box(80, 0.1, 80, '#A9B784', { cast: false }); at(lawn, 0, -0.2, 0); s.add(lawn);

    // walls (north + sides solid, south = glass front with an open entrance)
    const wallM = mat('#FBF6EE', { rough: 0.9 });
    const addWall = (x, z, w, d, n, name) => {
      const g = new THREE.Group(); const m = box(w, WALL_H, d, null, { m: wallM, cast: false }); at(m, x, 0, z); g.add(m); s.add(g);
      this.walls.push({ g, n, scale: 1, name });
      this.collider.addRect(x, z, w, d);
    };
    addWall(0, B.z0 - 0.1, B.x1 - B.x0 + 0.4, 0.2, [0, 1], 'north');
    addWall(B.x0 - 0.1, 0, 0.2, B.z1 - B.z0, [1, 0], 'west');
    addWall(B.x1 + 0.1, 0, 0.2, B.z1 - B.z0, [-1, 0], 'east');
    // glass front (cut-away in view), entrance gap in the middle
    for (const [x0, x1] of [[B.x0, -2.5], [2.5, B.x1]]) {
      const g = new THREE.Group(); const gl = box(x1 - x0, 3.2, 0.08, '#DDEFF0', { m: new THREE.MeshStandardMaterial({ color: '#E8F3F2', transparent: true, opacity: 0.25, roughness: 0.1 }), cast: false });
      at(gl, (x0 + x1) / 2, 0, B.z1); g.add(gl); s.add(g); this.walls.push({ g, n: [0, -1], scale: 1, name: 'front' });
      this.collider.addBox(x0, x1, B.z1 - 0.05, B.z1 + 0.05);
    }
    // columns + planters
    for (const [x, z] of [[-5, -4.5], [5, -4.5], [-5, 4], [5, 4]]) {
      const c = cyl(0.32, 0.32, WALL_H, '#F3EADC', { seg: 12 }); at(c, x, 0, z); s.add(c); this.collider.addCircle(x, z, 0.36);
      const p = cyl(0.55, 0.45, 0.45, '#C9A06A', { seg: 10 }); at(p, x, 0, z); s.add(p); this.collider.addCircle(x, z, 0.58);
      for (let i = 0; i < 6; i++) { const l = sphere(0.28, i % 2 ? '#6FA85A' : '#5E9A44', { w: 6, h: 4 }); const a = i * 1.05; at(l, x + Math.cos(a) * 0.35, 0.6, z + Math.sin(a) * 0.35); l.scale.y = 0.7; s.add(l); }
    }

    // skylight beams (soft additive) + golden glow
    const beamTex = canvasTexture(64, 256, (c) => { const g = c.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 256); const h = c.createLinearGradient(0, 0, 64, 0); h.addColorStop(0, 'rgba(0,0,0,1)'); h.addColorStop(0.5, 'rgba(0,0,0,0)'); h.addColorStop(1, 'rgba(0,0,0,1)'); c.globalCompositeOperation = 'destination-out'; c.fillStyle = h; c.fillRect(0, 0, 64, 256); });
    this.beamMat = new THREE.MeshBasicMaterial({ map: beamTex, color: '#FFE0A8', transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
    const bg = new THREE.PlaneGeometry(1.4, 7); bg.translate(0, -3.5, 0);
    for (let i = 0; i < 4; i++) {
      const g = new THREE.Group(); g.position.set(-2.4 + i * 1.6, 7, -2 + (i % 2) * 0.8); g.rotation.z = 0.25; g.rotation.x = -0.15;
      const a = new THREE.Mesh(bg, this.beamMat), b = new THREE.Mesh(bg, this.beamMat); b.rotation.y = PI / 2; g.add(a, b); s.add(g);
    }
    const sunPool = new THREE.Mesh(new THREE.CircleGeometry(4.2, 24), new THREE.MeshBasicMaterial({ map: glowTexture(), color: '#FFE2A8', transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false }));
    sunPool.rotation.x = -PI / 2; sunPool.position.set(0.6, 0.02, -0.6); s.add(sunPool);

    this.buildShops();
    this.buildAtrium();
    this.buildCar();
    this.buildNpcs();
  }

  sign(text, x, z, w, { y = 3.3, color = '#3A2E28', bg = '#FFFDF8', big = false, ry = 0 } = {}) {
    const g = new THREE.Group();
    const board = box(w, big ? 0.75 : 0.55, 0.08, bg, { r: 0.03, cast: false }); g.add(board);
    const tex = textTexture(text, { w: 512, h: 128, size: big ? 76 : 64, color });
    const lbl = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.92, (big ? 0.75 : 0.55) * 0.82), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false }));
    lbl.position.set(0, (big ? 0.75 : 0.55) / 2, 0.045); g.add(lbl);
    at(g, x, y, z, ry); this.scene.add(g);
    g.userData.w = w; this.signs.push(g);
    return g;
  }

  // open boutique: tinted floor, back/side panels, sign facing the camera
  boutique(name, x0, x1, z0, z1, color, { big = false, back = 'north' } = {}) {
    const s = this.scene;
    const fl = box(x1 - x0 - 0.1, 0.02, z1 - z0 - 0.1, color, { cast: false, opts: { rough: 0.6 } }); at(fl, (x0 + x1) / 2, -0.05, (z0 + z1) / 2); s.add(fl);
    const pm = mat(color, { rough: 0.8 });
    // low partitions on the sides that touch the atrium
    if (back === 'west' || back === 'east') {
      const px = back === 'west' ? x1 : x0;
      for (const z of [z0, z1]) { if (Math.abs(z - B.z1) < 0.5) continue; const p = box(x1 - x0, 0.6, 0.12, null, { m: pm }); at(p, (x0 + x1) / 2, 0, z); s.add(p); this.collider.addRect((x0 + x1) / 2, z, x1 - x0, 0.14); }
      this.sign(name, back === 'west' ? x0 + (x1 - x0) * 0.55 : x0 + (x1 - x0) * 0.45, (z0 + z1) / 2, Math.min(5, x1 - x0 - 1), { big, y: big ? 3.25 : 3.1 });
      // a slim frame on the open side
      for (const z of [z0 + 0.15, z1 - 0.15]) { const f = box(0.16, 3.3, 0.16, color, { r: 0.03 }); at(f, px, 0, z); s.add(f); }
    } else {
      for (const x of [x0, x1]) { if (Math.abs(x - B.x0) < 0.5 || Math.abs(x - B.x1) < 0.5) continue; const p = box(0.12, 0.6, z1 - z0, null, { m: pm }); at(p, x, 0, (z0 + z1) / 2); s.add(p); this.collider.addRect(x, (z0 + z1) / 2, 0.14, z1 - z0); }
      this.sign(name, (x0 + x1) / 2, z0 + 0.2, Math.min(4.6, x1 - x0 - 0.6), { big, y: 3.1 });
      const backPanel = box(x1 - x0 - 0.2, 3.0, 0.06, null, { m: pm, cast: false }); at(backPanel, (x0 + x1) / 2, 0, z0 + 0.06); s.add(backPanel);
    }
  }

  buildShops() {
    const s = this.scene, game = this.game, names = content.mallShops;
    const N = (i, fallback) => names[i] || fallback;
    const disc = (id, pos) => game.discover(id, pos).then(() => this.updateBag());

    // ── Thursday Island (favorite #1): west, by the entrance — biggest front ──
    this.boutique(N(0, 'Thursday Island'), B.x0, -5.5, 3, B.z1, '#F3DCCB', { big: true, back: 'west' });
    // fitting room with mirror
    const fr = new THREE.Group(); at(fr, -12.6, 0, 8.4); s.add(fr);
    const frBack = box(1.6, 2.4, 0.08, '#E6C7B3'); at(frBack, 0, 0, -0.75); fr.add(frBack);
    for (const sx of [-0.8, 0.8]) { const side = box(0.08, 2.4, 1.5, '#E6C7B3'); at(side, sx, 0, 0); fr.add(side); }
    const mirror = box(0.7, 1.6, 0.03, null, { m: new THREE.MeshStandardMaterial({ color: '#E9F2F4', roughness: 0.05, metalness: 0.9 }) }); at(mirror, 0, 0.35, -0.7); fr.add(mirror);
    const mirrorFrame = box(0.8, 1.7, 0.02, '#C9A06A'); at(mirrorFrame, 0, 0.3, -0.72); fr.add(mirrorFrame);
    const rodC = cyl(0.015, 0.015, 1.6, '#C9A06A', { seg: 5 }); rodC.rotation.z = PI / 2; at(rodC, 0.8, 2.35, 0.75); fr.add(rodC);
    this.frCurtain = box(0.5, 2.2, 0.03, '#C4A3AE'); at(this.frCurtain, 0.5, 0.1, 0.75); fr.add(this.frCurtain);
    this.collider.addBox(-13.45, -11.75, 7.6, 7.75); this.collider.addBox(-13.45, -13.35, 7.6, 9.2); this.collider.addBox(-11.85, -11.75, 7.6, 9.2);
    this.inter.add({ id: 'mirror', x: -12.6, z: 8.2, y: 1.3, reach: 1.0, discover: 'mall_mirror',
      onUse: async () => { game.mom.faceToward(-12.6, 7); game.say('어머, 나 오늘 괜찮네?', 2200); await game.tweens.wait(1.4); await disc('mall_mirror', new THREE.Vector3(-12.6, 1.4, 7.7)); } });
    // clothing racks
    const rack = (x, z, colors) => {
      const g = new THREE.Group(); at(g, x, 0, z); s.add(g);
      const bar = cyl(0.02, 0.02, 1.6, '#B9A07A', { seg: 5 }); bar.rotation.z = PI / 2; at(bar, 0.8, 1.45, 0); g.add(bar);
      for (const sx of [-0.8, 0.8]) { const p = cyl(0.025, 0.025, 1.45, '#B9A07A', { seg: 5 }); at(p, sx, 0, 0); g.add(p); }
      colors.forEach((c, i) => { const cl = box(0.08, 0.75, 0.42, c, { r: 0.02 }); at(cl, -0.6 + i * 0.2, 0.62, 0); g.add(cl); });
      this.collider.addRect(x, z, 1.7, 0.5);
      return g;
    };
    rack(-9.5, 5.2, ['#F4B6C2', '#FFFFFF', '#C9B6E4', '#F2D3A0', '#F4B6C2', '#9CC5C0', '#FFFFFF']);
    rack(-9.5, 7.6, ['#E9A3AE', '#F6EFE2', '#B98ACF', '#F4B6C2', '#FFE7A0', '#FFFFFF', '#C4A3AE']);
    const tag = box(0.08, 0.12, 0.01, '#FFF3C9'); at(tag, -9.1, 1.0, 5.45); s.add(tag);
    this.inter.add({ id: 'rackTag', x: -9.1, z: 4.75, y: 1.0, reach: 1.0, discover: 'mall_rack_gift', onUse: () => disc('mall_rack_gift', new THREE.Vector3(-9.1, 1.1, 5.4)) });

    // ── ZOOC (favorite #2): right next to Thursday Island ──
    this.boutique(N(1, 'ZOOC'), B.x0, -5.5, -4.2, 3, '#DDE6DA', { big: true, back: 'west' });
    // mannequin wearing a cardigan
    const mq = new THREE.Group(); at(mq, -9.2, 0, -0.6); s.add(mq);
    const base = cyl(0.25, 0.25, 0.05, '#C9C3B8', { seg: 10 }); mq.add(base);
    const pole = cyl(0.03, 0.03, 0.8, '#C9C3B8', { seg: 5 }); mq.add(pole);
    const body = cyl(0.17, 0.2, 0.7, '#E9C4A8', { seg: 10 }); body.position.y = 0.8; mq.add(body);
    const cardi = cyl(0.19, 0.22, 0.6, '#C9B6E4', { seg: 10 }); cardi.position.y = 0.85; mq.add(cardi);
    const pocket = box(0.1, 0.09, 0.015, '#B9A3D6'); at(pocket, 0.1, 0.95, 0.2); mq.add(pocket);
    const noteP = box(0.05, 0.05, 0.005, '#FFF0C8'); at(noteP, 0.1, 1.04, 0.21); mq.add(noteP);
    const head = sphere(0.12, '#E9C4A8', { w: 8, h: 6 }); head.position.y = 1.65; mq.add(head);
    this.collider.addCircle(-9.2, -0.6, 0.35);
    this.inter.add({ id: 'mannequin', x: -9.2, z: -0.6, y: 1.1, reach: 1.1, discover: 'mall_cardigan_note', onUse: () => disc('mall_cardigan_note', new THREE.Vector3(-9.1, 1.0, -0.4)) });
    // shelf with folded scarves
    const shelf = new THREE.Group(); at(shelf, -13.6, 0, -1.2, PI / 2); s.add(shelf);
    const sb = box(2.2, 1.6, 0.45, '#F6ECD6', { r: 0.02 }); shelf.add(sb);
    ['#F4B6C2', '#7BA7A3', '#E8C547', '#C4A3AE', '#FFFFFF', '#E98F9E'].forEach((c, i) => { const f = box(0.3, 0.08, 0.3, c, { r: 0.02 }); at(f, -0.85 + (i % 3) * 0.85 / 1, 0.95 + Math.floor(i / 3) * 0.35, 0.1); shelf.add(f); });
    this.collider.addBox(B.x0, -13.15, -2.35, -0.05);
    this.inter.add({ id: 'scarf', x: -12.8, z: -1.2, y: 1.1, reach: 1.0, discover: 'mall_scarf_gift', onUse: () => disc('mall_scarf_gift', new THREE.Vector3(-13.2, 1.2, -1.2)) });

    // ── bag shop (north-west) ──
    this.boutique(N(2, '가방가게'), B.x0, -5, B.z0, -6, '#EADBC8');
    const stand = box(2.4, 0.9, 0.7, '#F6ECD6', { r: 0.03 }); at(stand, -9.5, 0, -8.6); s.add(stand); this.collider.addRect(-9.5, -8.6, 2.4, 0.7);
    [['#B05A4A', -10.4], ['#3A3430', -9.5], ['#E9C4A8', -8.6]].forEach(([c, x]) => {
      const bg = box(0.5, 0.42, 0.18, c, { r: 0.05, opts: { rough: 0.45 } }); at(bg, x, 0.9, -8.6); s.add(bg);
      const h = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.015, 4, 10, PI), mat(c, { rough: 0.45 })); at(h, x, 1.32, -8.6); s.add(h);
    });
    this.inter.add({ id: 'bag', x: -9.5, z: -7.8, y: 1.1, reach: 1.1, discover: 'mall_bag_gift', onUse: () => disc('mall_bag_gift', new THREE.Vector3(-9.5, 1.2, -8.6)) });

    // ── flower shop ──
    this.boutique(N(3, '꽃집'), -5, 1.5, B.z0, -6.5, '#E7EFD9');
    const bucketRow = (x, z) => { for (let i = 0; i < 4; i++) { const bx = x + i * 0.6; const bk = cyl(0.2, 0.16, 0.4, '#9CB5B0', { seg: 8 }); at(bk, bx, 0, z); s.add(bk); for (let k = 0; k < 6; k++) { const fl = sphere(0.08, ['#F4A0B4', '#FFFFFF', '#B98ACF', '#FFD27A'][(i + k) % 4], { w: 5, h: 4 }); at(fl, bx + Math.cos(k) * 0.1, 0.6 + (k % 3) * 0.07, z + Math.sin(k) * 0.1); s.add(fl); } } this.collider.addBox(x - 0.25, x + 2.05, z - 0.25, z + 0.25); };
    bucketRow(-4.2, -9.8); bucketRow(-1.6, -9.8);
    const bouquet = new THREE.Group(); at(bouquet, -1.6, 0.9, -8.3); s.add(bouquet);
    const btable = box(1.2, 0.85, 0.6, '#F6ECD6', { r: 0.03 }); at(btable, -1.6, 0, -8.3); s.add(btable); this.collider.addRect(-1.6, -8.3, 1.2, 0.6);
    const wrap = cone(0.14, 0.4, '#FFF3E6', { seg: 7 }); wrap.rotation.x = PI; wrap.position.y = 0.4; bouquet.add(wrap);
    for (let k = 0; k < 7; k++) { const fl = sphere(0.07, ['#F4A0B4', '#FFFFFF', '#F4B6C2'][k % 3], { w: 5, h: 4 }); at(fl, Math.cos(k) * 0.08, 0.45 + (k % 2) * 0.05, Math.sin(k) * 0.08); bouquet.add(fl); }
    bouquet.rotation.z = 1.2;
    this.inter.add({ id: 'bouquet', x: -1.6, z: -7.6, y: 1.0, reach: 1.0, discover: 'mall_flower_note',
      onUse: async () => { game.mom.play('hug', 1.2); await game.tweens.wait(0.6); await disc('mall_flower_note', new THREE.Vector3(-1.6, 1.2, -8.3)); } });

    // ── cafe ──
    this.boutique(N(4, '카페'), 1.5, 8.5, B.z0, -6.5, '#EBD9C2');
    const counter = box(4, 1.0, 0.7, '#B98A5E', { r: 0.03 }); at(counter, 5, 0, -8.6); s.add(counter); this.collider.addRect(5, -8.6, 4, 0.7);
    const top = box(4.1, 0.05, 0.75, '#F6ECD6', { r: 0.01 }); at(top, 5, 1.0, -8.6); s.add(top);
    const machine = box(0.6, 0.55, 0.45, '#C8CED1', { r: 0.04, opts: { metal: 0.5, rough: 0.3 } }); at(machine, 6.4, 1.05, -8.8); s.add(machine);
    const cup = new THREE.Group(); at(cup, 4.6, 1.05, -8.4); s.add(cup);
    const c1 = cyl(0.06, 0.045, 0.16, '#FFFFFF', { seg: 10 }); cup.add(c1);
    const sleeve = cyl(0.062, 0.055, 0.07, '#C48A52', { seg: 10 }); sleeve.position.y = 0.05; cup.add(sleeve);
    const lid = cyl(0.065, 0.065, 0.02, '#F6F1EA', { seg: 10 }); lid.position.y = 0.16; cup.add(lid);
    this.steam = glowSprite('#FFFFFF', 0.3, 0.2); this.steam.position.set(4.6, 1.4, -8.4); s.add(this.steam);
    for (const x of [3.2, 6.8]) { const t = cyl(0.4, 0.4, 0.04, '#F6ECD6', { seg: 12 }); t.position.set(x, 0.72, -6.9 + 0.0); s.add(t); const l = cyl(0.04, 0.04, 0.72, '#3A3430', { seg: 5 }); at(l, x, 0, -6.9); s.add(l); this.collider.addCircle(x, -6.9, 0.42); }
    this.inter.add({ id: 'coffee', x: 4.6, z: -7.85, y: 1.2, reach: 1.0, discover: 'mall_coffee_note', onUse: () => disc('mall_coffee_note', new THREE.Vector3(4.6, 1.3, -8.4)) });

    // ── photo booth (south-east) ──
    this.boutique(N(5, '포토부스'), 7, B.x1, 3.5, B.z1, '#E9DDF0', { back: 'east' });
    const booth = new THREE.Group(); at(booth, 11.6, 0, 7.2); s.add(booth);
    const bb = box(2.0, 2.4, 1.6, '#FFFFFF', { r: 0.06 }); booth.add(bb);
    const bc = box(1.0, 1.9, 0.04, '#E4574F', { r: 0.02 }); at(bc, -1.0, 0.2, 0); bc.rotation.y = PI / 2; booth.add(bc);
    const bl = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.35), new THREE.MeshBasicMaterial({ map: textTexture('PHOTO ♥', { w: 256, h: 64, size: 40, color: '#E4574F' }), transparent: true })); at(bl, -1.01, 2.0, 0); bl.rotation.y = -PI / 2; booth.add(bl);
    this.strip = box(0.12, 0.35, 0.01, '#FFFFFF'); at(this.strip, -1.02, 0.6, 0.6); this.strip.rotation.y = PI / 2; this.strip.visible = false; booth.add(this.strip);
    this.collider.addRect(11.6, 7.2, 2.0, 1.6);
    this.inter.add({ id: 'booth', x: 10.2, z: 7.2, y: 1.2, reach: 1.1, discover: 'mall_booth_photo',
      onUse: async () => {
        game.audio.play('click'); await game.tweens.wait(0.3); game.audio.play('click');
        this.strip.visible = true; await game.tweens.add(0.6, (t) => { this.strip.position.y = 0.9 - t * 0.3; });
        await disc('mall_booth_photo', new THREE.Vector3(10.6, 0.8, 7.8));
      } });

    // ── shoe shop (east) — a display of black rubber shoes, a nod to The Past ──
    this.boutique(N(6, '신발가게'), 7, B.x1, -4.2, 3.5, '#E5DCCB', { back: 'east' });
    const disp = box(1.0, 1.0, 2.6, '#F6ECD6', { r: 0.03 }); at(disp, 12.6, 0, -0.4); s.add(disp); this.collider.addRect(12.6, -0.4, 1.0, 2.6);
    for (let i = 0; i < 3; i++) { const pr = group(rubberShoe('#141414'), rubberShoe('#141414')); pr.children[1].position.x = 0.15; pr.scale.setScalar(1.4); at(pr, 12.4, 1.0, -1.3 + i * 0.9, -PI / 2); s.add(pr); }
    const heels = box(0.12, 0.12, 0.3, '#B05A4A', { r: 0.03 }); at(heels, 9.6, 0.0, 2.6); s.add(heels);
    const bench = box(1.4, 0.42, 0.45, '#C4A3AE', { r: 0.06 }); at(bench, 9.5, 0, 1.6); s.add(bench); this.collider.addRect(9.5, 1.6, 1.4, 0.45);
    this.inter.add({ id: 'shoes', x: 11.8, z: -0.4, y: 1.1, reach: 1.1, discover: 'mall_shoe_note',
      onUse: async () => { game.say('어? 고무신이네!', 1800); await game.tweens.wait(1.0); await disc('mall_shoe_note', new THREE.Vector3(12.4, 1.2, -0.4)); } });
  }

  buildAtrium() {
    const s = this.scene, game = this.game;
    // fountain
    const f = new THREE.Group(); at(f, 0, 0, -0.5); s.add(f);
    const basin = cyl(2.0, 2.1, 0.5, '#EDE3D2', { seg: 20 }); f.add(basin);
    this.water = cyl(1.85, 1.85, 0.05, '#8FC9CF', { seg: 20, m: new THREE.MeshStandardMaterial({ color: '#8FC9CF', roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.85 }) });
    this.water.position.y = 0.42; f.add(this.water);
    const mid = cyl(0.25, 0.35, 1.1, '#EDE3D2', { seg: 10 }); f.add(mid);
    const bowl = cyl(0.8, 0.3, 0.25, '#EDE3D2', { seg: 14 }); bowl.position.y = 1.1; f.add(bowl);
    this.jets = [];
    for (let i = 0; i < 14; i++) { const d = sphere(0.05, '#CDEFF2', { w: 5, h: 4, opts: { emissive: '#BFE8EE', emissiveIntensity: 0.4 }, cast: false }); f.add(d); this.jets.push({ d, a: (i / 14) * PI * 2, t: i / 14 }); }
    for (let i = 0; i < 9; i++) { const c = cyl(0.05, 0.05, 0.01, '#E8C547', { seg: 8, opts: { metal: 0.6, rough: 0.3 } }); at(c, Math.cos(i * 2.3) * 1.2, 0.43, Math.sin(i * 2.3) * 1.2); f.add(c); }
    this.collider.addCircle(0, -0.5, 2.15);
    this.coin = cyl(0.05, 0.05, 0.012, '#E8C547', { seg: 8, opts: { metal: 0.6, rough: 0.3 } }); this.coin.visible = false; s.add(this.coin);
    this.inter.add({ id: 'fountain', x: 0, z: 1.75, y: 0.8, reach: 1.1, discover: 'mall_fountain_gift',
      onUse: async () => {
        const m = game.mom; m.faceToward(0, -0.5); m.play('reach', 0.6); game.audio.play('coin');
        this.coin.visible = true;
        const p0 = m.position.clone().add(new THREE.Vector3(0, 1.3, 0));
        await game.tweens.add(0.9, (t) => { this.coin.position.set(p0.x * (1 - t), p0.y + Math.sin(t * PI) * 1.0 - t * 0.85, p0.z + (-0.5 - p0.z) * t); this.coin.rotation.x = t * 12; });
        this.coin.visible = false; game.audio.play('splash');
        game.burst(new THREE.Vector3(0, 0.6, -0.5));
        game.say('소원 빌었다.', 1800);
        if (!game.disc.isFound('mall_fountain_gift')) { await game.tweens.wait(1.2); await game.discover('mall_fountain_gift', new THREE.Vector3(0, 0.8, -0.5)); this.updateBag(); }
      } });
    // benches around
    for (const [x, z, r] of [[-3.6, -0.5, PI / 2], [3.6, -0.5, -PI / 2], [0, -3.8, 0]]) {
      const b = box(1.6, 0.42, 0.5, '#C48A52', { r: 0.05 }); at(b, x, 0, z, r); s.add(b);
      this.collider.addRect(x, z, Math.abs(Math.cos(r)) > 0.5 ? 1.6 : 0.5, Math.abs(Math.cos(r)) > 0.5 ? 0.5 : 1.6);
    }
    // a big warm banner (our own text, no logo)
    this.sign('LF SQUARE', 0, B.z0 + 0.15, 6, { y: 3.4, big: true, color: '#8A5A3C', bg: '#FFF3DD' });
  }

  buildCar() {
    const s = this.scene, game = this.game;
    const car = makeCar(); at(car, 0, 0, B.z1 + 3.2, PI / 2); s.add(car); this.car = car;
    this.collider.addRect(0, B.z1 + 3.2, 4.2, 1.9);
    this.inter.add({ id: 'car', x: 0, z: B.z1 + 1.9, y: 1.1, reach: 1.3,
      onUse: async () => { game.say(content.bubbles.mallBack, 1800); await game.tweens.wait(1.2); game.goTo('home', { color: '#000', ms: 1200, cinematic: () => game.playCinematic(makeDrive(game, true)) }); } });
  }

  buildNpcs() {
    const rnd = seeded(21);
    const cols = ['#9CC5C0', '#E9A3AE', '#C9B6E4', '#F2D3A0', '#7BA7A3'];
    for (let i = 0; i < 5; i++) {
      const g = new THREE.Group();
      const bodyM = mat(cols[i], { rough: 0.9 });
      const b = capsule(0.2, 0.75, null, { m: bodyM }); b.position.y = 0.6; g.add(b);
      const h = sphere(0.16, '#F1D7C4', { w: 8, h: 6 }); h.position.y = 1.35; g.add(h);
      const hair = sphere(0.165, ['#2A2220', '#5A3E2E', '#3A3430'][i % 3], { w: 8, h: 6 }); hair.scale.y = 0.6; hair.position.set(0, 1.42, -0.02); g.add(hair);
      if (i % 2) { const bag = box(0.18, 0.2, 0.08, ['#FFF3E6', '#F4B6C2'][i % 2], { r: 0.02 }); at(bag, 0.27, 0.45, 0); g.add(bag); }
      this.scene.add(g);
      this.npcs.push({ g, r: 4.6 + (i % 3) * 0.9, a: rnd() * PI * 2, sp: (0.12 + rnd() * 0.06) * (i % 2 ? 1 : -1), ph: rnd() * 6 });
    }
  }

  updateBag() {
    const n = MALL_ITEMS.filter((id) => this.game.disc.isFound(id)).length;
    this.game.mom.showBag = true; this.game.mom.setBagCount(Math.min(8, n));
  }

  enter() {
    const g = this.game, mom = g.mom;
    mom.setForm('adult'); mom.setFootwear('shoes');
    mom.position.set(0, 0, 8.4); mom.face(PI, true);
    this.updateBag();
    g.audio.setLoops(['bgm_mall', 'chatter'], 2);
    setTimeout(() => g.say('오랜만에 구경 좀 해볼까~'), 1500);
  }
  exit() { const m = this.game.mom; m.showBag = false; m.setBagCount(-1); }
  cameraYawFor() { return 0; }
  surfaceAt() { return 'tile'; }

  update(dt) {
    const g = this.game;
    this.time += dt;
    // NPC shoppers stroll slowly around the atrium
    for (const n of this.npcs) {
      n.a += n.sp * dt;
      const x = Math.cos(n.a) * n.r, z = -0.5 + Math.sin(n.a) * n.r * 0.85;
      n.g.position.set(x, Math.abs(Math.sin(this.time * 4 + n.ph)) * 0.03, z);
      n.g.rotation.y = Math.atan2(-Math.sin(n.a) * Math.sign(n.sp), Math.cos(n.a) * Math.sign(n.sp) * 0.85);
    }
    // fountain droplets
    for (const j of this.jets) {
      j.t = (j.t + dt * 0.7) % 1;
      const r = 0.15 + j.t * 1.1;
      j.d.position.set(Math.cos(j.a) * r, 1.35 + Math.sin(j.t * PI) * 0.9 - j.t * 0.9, Math.sin(j.a) * r);
    }
    this.water.material.opacity = 0.8 + Math.sin(this.time * 2) * 0.05;
    this.beamMat.opacity = 0.09 + Math.sin(this.time * 0.6) * 0.025;
    this.steam.material.opacity = 0.15 + Math.sin(this.time * 2.4) * 0.08;
    // fitting-room curtain sways when Mom is near
    const p = g.mom.position;
    this.frCurtain.position.x = 0.5 - (Math.hypot(p.x + 12.6, p.z - 8.4) < 1.3 ? 0.35 : 0);
    // signs fade away while they hang between the camera and Mom
    for (const sg of this.signs) {
      const block = sg.position.z > p.z + 1.2 && sg.position.z < p.z + 7 && Math.abs(sg.position.x - p.x) < sg.userData.w / 2 + 1.2;
      sg.scale.y += ((block ? 0.01 : 1) - sg.scale.y) * (1 - Math.exp(-dt * 8));
      sg.visible = sg.scale.y > 0.05;
    }
    // cut the glass front when it would block the view
    const yaw = g.cam.yaw, dx = -Math.sin(yaw), dz = -Math.cos(yaw);
    for (const w of this.walls) {
      const cut = w.n[0] * dx + w.n[1] * dz > 0.45;
      w.scale += ((cut ? 0.06 : 1) - w.scale) * (1 - Math.exp(-dt * 6));
      w.g.scale.y = w.scale; w.g.visible = w.scale > 0.02;
    }
  }
}

// ── the little car (no brand) ───────────────────────────────
export function makeCar() {
  const g = new THREE.Group();
  const body = box(4.0, 0.7, 1.75, '#E9E4DA', { r: 0.18, opts: { rough: 0.3, metal: 0.25 } }); body.position.y = 0.3; g.add(body);
  const cabin = box(2.2, 0.6, 1.55, '#E9E4DA', { r: 0.2, opts: { rough: 0.3, metal: 0.25 } }); at(cabin, -0.2, 0.95, 0); g.add(cabin);
  const glass = box(2.0, 0.45, 1.58, '#3E4A55', { r: 0.12, opts: { rough: 0.1, metal: 0.4 } }); at(glass, -0.2, 1.02, 0); g.add(glass);
  for (const [x, z] of [[1.3, 0.85], [-1.3, 0.85], [1.3, -0.85], [-1.3, -0.85]]) {
    const w = cyl(0.36, 0.36, 0.25, '#232326', { seg: 12 }); w.rotation.x = PI / 2; at(w, x, 0.36, z); w.position.z = z - Math.sign(z) * 0.12 * 0; g.add(w); w.userData.wheel = true;
  }
  const light = box(0.05, 0.12, 0.3, '#FFF2C8', { opts: { emissive: '#FFE2A0', emissiveIntensity: 1 } });
  for (const z of [0.6, -0.6]) { const l = light.clone(); at(l, 2.0, 0.55, z); g.add(l); }
  return g;
}

// ~8 s drive along the Ungcheon coastal road, sea on one side, soft radio music
export function makeDrive(game, back = false) {
  const scene = new THREE.Scene();
  const home = game.worlds.home;
  const s = home?.state.sunset ?? 0.2;
  scene.fog = new THREE.Fog('#FFE3B8', 60, 400);
  const rig = createRig(scene, { shadowSize: 1024, extent: 20, hemi: 1.3 });
  const sky = makeSky(); scene.add(sky.mesh);
  const dir = new THREE.Vector3(-0.6, 0.25, -0.75).normalize();
  const pal = sky.set(Math.min(0.5, s), dir);
  scene.fog.color.copy(pal.hor);
  rig.sun.color.copy(pal.sun);
  const sea = makeSea(600, 300, 50, 25, '#5B88A0'); sea.mesh.material.color.copy(pal.sea); sea.mesh.position.set(0, -1.2, -160); scene.add(sea.mesh);
  const coast = makeCoast(12, { count: 10, radius: [150, 260], y: -1, scale: 0.7 }); coast.mat.color.copy(pal.hill); scene.add(coast.group);
  const road = box(600, 0.1, 6, '#6E6A66', { cast: false }); at(road, 0, -0.05, 0); scene.add(road);
  for (let x = -300; x < 300; x += 6) { const dsh = box(2.5, 0.02, 0.15, '#F2E6C8', { cast: false }); at(dsh, x, 0.01, 0); scene.add(dsh); }
  const verge = box(600, 0.4, 3, '#E6CFA2', { cast: false }); at(verge, 0, -0.5, -4.5); scene.add(verge);
  const shoulder = box(600, 0.1, 9, '#B9B08A', { cast: false }); at(shoulder, 0, -0.08, 7.5); scene.add(shoulder);
  const hillside = box(600, 3, 40, '#9DAF7E', { cast: false }); at(hillside, 0, -2.6, 32); scene.add(hillside);
  const rnd = seeded(4);
  for (let i = 0; i < 70; i++) { const x = -300 + i * 9 + rnd() * 4; const t = cone(1.2 + rnd(), 3 + rnd() * 2, rnd() > 0.5 ? '#5E8A4A' : '#6F9A55', { seg: 6 }); at(t, x, 0, 13 + rnd() * 14); scene.add(t); }
  for (let x = -300; x < 300; x += 14) { const p = cyl(0.06, 0.06, 4, '#7A746C', { seg: 5 }); at(p, x, 0, -3.4); scene.add(p); const l = sphere(0.18, '#FFF2C8', { opts: { emissive: '#FFD28A', emissiveIntensity: 0.6 } }); at(l, x, 4, -3.0); scene.add(l); }
  const car = makeCar(); scene.add(car);
  const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 900);
  const speed = 14 * (back ? -1 : 1);
  game.audio.play('car');
  game.audio.setLoops(['bgm_mall'], 1.5);
  rig.aim(new THREE.Vector3(), 0.45, PI + 0.6, 50);
  let fired = false;
  return {
    scene, camera,
    update(dt, t) {
      const x = -50 * Math.sign(speed) + speed * t;
      car.position.set(x, Math.abs(Math.sin(t * 9)) * 0.015, back ? -1.4 : 1.4);
      car.rotation.y = back ? PI : 0;
      rig.aim(car.position, 0.45, PI + 0.6, 50);
      camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
      camera.position.set(x - 6 * Math.sign(speed) + Math.sin(t * 0.4) * 1.5, 3.2, 9.5);
      camera.lookAt(x + 2 * Math.sign(speed), 0.8, -6);
      sky.mesh.position.copy(camera.position);
      if (Math.floor(t * 30) !== this._f) { this._f = Math.floor(t * 30); sea.update(t, 0.35, 0.4); }
      if (t > 7.5 && !fired) { fired = true; this.done(); }
    },
  };
}
