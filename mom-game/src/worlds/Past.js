import * as THREE from 'three';
import { content } from '../content.js';
import { Collider } from '../core/Collision.js';
import { createRig } from '../core/Lighting.js';
import { Interactables } from '../systems/Interactables.js';
import { box, cyl, sphere, cone, at, group, canvasTexture, glowSprite, glowTexture, textTexture, mat, seeded } from '../models/kit.js';
import { makeSky } from '../models/outdoor.js';
import { rubberShoe } from '../entities/Mom.js';

// Tier 3: The Past — Jangheung, 1970s. Mom is a little girl again.
// Original low-poly homage in mood only (no characters/scenes from any anime).

const PI = Math.PI;
const ROAD_Z = 1.3;

function noiseTex(base, specks, n = 900, size = 256) {
  const t = canvasTexture(size, size, (c) => {
    c.fillStyle = base; c.fillRect(0, 0, size, size);
    for (let i = 0; i < n; i++) { c.fillStyle = specks[i % specks.length]; c.globalAlpha = 0.35; c.fillRect(Math.random() * size, Math.random() * size, 2 + Math.random() * 3, 2 + Math.random() * 2); }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

export class Past {
  constructor(game) {
    this.game = game; this.name = 'past'; this.cameraDistance = 7.2; this.exposure = 1.05;
    this.scene = new THREE.Scene(); this.collider = new Collider(); this.time = 0;
  }

  build() {
    const s = this.scene, game = this.game, C = this.collider;
    s.background = new THREE.Color('#F2D9A8');
    s.fog = new THREE.Fog('#F4D7A2', 30, 120);
    this.rig = createRig(s, { shadowSize: 2048, extent: 22, hemi: 1.25, hemiSky: '#FFE6BE', hemiGround: '#B98E5E' });
    this.rig.sun.color.set('#FFD49A'); this.rig.sun.intensity = 3.0;
    this.rig.aim(new THREE.Vector3(0, 0, 0), 0.42, PI + 0.9, 50);
    this.sky = makeSky(); this.sky.set(0.28, new THREE.Vector3(-0.7, 0.35, -0.6).normalize()); s.add(this.sky.mesh);
    this.inter = new Interactables(s, game.disc);

    // ground: grass, yard dirt, road
    const grassT = noiseTex('#BDB37A', ['#A9A066', '#CFC48A', '#9E9A5E']); grassT.repeat.set(10, 8);
    const ground = box(60, 0.2, 50, null, { m: new THREE.MeshStandardMaterial({ map: grassT, roughness: 1 }), cast: false }); at(ground, 0, -0.2, 0); s.add(ground);
    const dirtT = noiseTex('#CDB088', ['#B99A70', '#DCC39C', '#A88A62']); dirtT.repeat.set(8, 1);
    const road = box(42, 0.04, 2.6, null, { m: new THREE.MeshStandardMaterial({ map: dirtT, roughness: 1 }), cast: false }); at(road, 0, -0.02, ROAD_Z); s.add(road);
    const yardT = dirtT.clone(); yardT.repeat.set(4, 2); yardT.needsUpdate = true;
    const yard = box(16, 0.03, 9, null, { m: new THREE.MeshStandardMaterial({ map: yardT, roughness: 1 }), cast: false }); at(yard, 0, -0.02, -8.5); s.add(yard);
    const lane = box(2.2, 0.035, 4, null, { m: new THREE.MeshStandardMaterial({ map: dirtT, roughness: 1 }), cast: false }); at(lane, 0, -0.02, -2); s.add(lane);

    this.buildHouse();
    this.buildYard();
    this.buildVillage();
    this.buildExit();

    // distant hills in golden haze
    const rnd = seeded(31);
    const hillM = new THREE.MeshStandardMaterial({ color: '#8E9A66', flatShading: true, roughness: 1 });
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * PI * 2, r = 55 + rnd() * 25, h = 10 + rnd() * 14;
      const hill = new THREE.Mesh(new THREE.ConeGeometry(14 + rnd() * 10, h, 6), hillM); hill.position.set(Math.sin(a) * r, h / 2 - 1, Math.cos(a) * r); s.add(hill);
    }
    // trees around the edges
    for (let i = 0; i < 26; i++) {
      const x = -24 + rnd() * 48, z = rnd() > 0.5 ? -17 - rnd() * 6 : 16 + rnd() * 6;
      const t = cyl(0.18, 0.25, 2, '#6B5040', { seg: 5 }); at(t, x, 0, z); s.add(t);
      const c = sphere(1.4 + rnd() * 0.6, rnd() > 0.5 ? '#6E8A4A' : '#7F9A55', { w: 7, h: 5 }); c.scale.y = 0.85; at(c, x, 2.6, z); s.add(c);
    }
    // drifting dust in the golden air
    const N = 80, pos = new Float32Array(N * 3);
    this.dust = Array.from({ length: N }, () => ({ x: -18 + Math.random() * 36, y: 0.3 + Math.random() * 3, z: -12 + Math.random() * 24, p: Math.random() * 9 }));
    const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.dustPts = new THREE.Points(dg, new THREE.PointsMaterial({ color: '#FFE7B8', size: 0.06, map: glowTexture(), transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending }));
    s.add(this.dustPts);

    // bounds
    C.addBox(-30, -20.5, -30, 30); C.addBox(20.5, 30, -30, 30); C.addBox(-30, 30, -30, -14.5); C.addBox(-30, 30, 15.5, 30);
  }

  buildHouse() {
    const s = this.scene, game = this.game;
    const H = new THREE.Group(); s.add(H);
    // stone base, plaster walls, wooden posts
    const base = box(8.6, 0.45, 3.6, '#B8AA92', { r: 0.03 }); at(base, 0, 0, -11.5); H.add(base);
    const wall = box(8, 2.1, 3.0, '#F1E6D0'); at(wall, 0, 0.45, -11.8); H.add(wall);
    for (let i = 0; i <= 4; i++) { const p = box(0.18, 2.3, 0.18, '#7A5536'); at(p, -4 + i * 2, 0.45, -10.2); H.add(p); }
    const beam = box(8.4, 0.2, 0.2, '#7A5536'); at(beam, 0, 2.55, -10.2); H.add(beam);
    // paper sliding doors
    const paper = canvasTexture(128, 128, (c) => { c.fillStyle = '#FBF3DF'; c.fillRect(0, 0, 128, 128); c.strokeStyle = '#8C6A4A'; c.lineWidth = 4; for (let i = 0; i <= 128; i += 32) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i, 128); c.stroke(); c.beginPath(); c.moveTo(0, i); c.lineTo(128, i); c.stroke(); } });
    const doorM = new THREE.MeshStandardMaterial({ map: paper, roughness: 1, emissive: '#FFE6B8', emissiveIntensity: 0.15 });
    for (const x of [-3, -1, 1, 3]) { const d = box(1.6, 1.7, 0.05, null, { m: doorM }); at(d, x, 0.65, -10.28); H.add(d); }
    // tiled roof (gabled prism with deep eaves)
    const shape = new THREE.Shape(); shape.moveTo(-3.3, 0); shape.lineTo(3.3, 0); shape.lineTo(0.4, 1.7); shape.lineTo(-0.4, 1.7); shape.closePath();
    const rg = new THREE.ExtrudeGeometry(shape, { depth: 10.2, bevelEnabled: false }); rg.translate(0, 0, -5.1); rg.rotateY(PI / 2);
    const roof = new THREE.Mesh(rg, mat('#4F4B4D', { rough: 0.7 })); roof.castShadow = true; roof.receiveShadow = true; at(roof, 0, 2.6, -11.6); H.add(roof);
    const ridge = box(10.4, 0.25, 0.9, '#3F3B3D'); at(ridge, 0, 4.25, -11.6); H.add(ridge);
    for (let i = 0; i < 20; i++) { const tl = cyl(0.09, 0.09, 6.3, '#5A5658', { seg: 5 }); tl.rotation.x = PI / 2; at(tl, -5 + i * 0.52, 2.62, -11.6); tl.scale.set(1, 1, 1); H.add(tl); }
    // 마루 (wooden porch)
    const planks = canvasTexture(128, 128, (c) => { c.fillStyle = '#B98A5E'; c.fillRect(0, 0, 128, 128); c.fillStyle = 'rgba(80,50,30,0.35)'; for (let x = 0; x < 128; x += 16) c.fillRect(x, 0, 2, 128); });
    const maru = box(6.4, 0.12, 1.5, null, { m: new THREE.MeshStandardMaterial({ map: planks, roughness: 0.8 }) }); at(maru, 0, 0.5, -9.55); H.add(maru);
    for (const x of [-3, 0, 3]) { const l = box(0.15, 0.5, 0.15, '#7A5536'); at(l, x, 0, -8.9); H.add(l); }
    this.collider.addBox(-4.3, 4.3, -13.4, -8.8, 'wall');
    // 댓돌 (stepping stone) + a pair of small black rubber shoes with a note inside
    const step = box(1.5, 0.28, 0.6, '#A49A8A', { r: 0.06 }); at(step, 0.4, 0, -8.45); H.add(step);
    const shoes = group(rubberShoe('#141414'), rubberShoe('#141414')); shoes.children[1].position.x = 0.13; shoes.scale.setScalar(0.85); at(shoes, 0.3, 0.28, -8.4, 0.05); H.add(shoes);
    const note = box(0.05, 0.03, 0.04, '#FFF0C8'); at(note, 0.3, 0.33, -8.36); note.rotation.x = -0.6; H.add(note);
    this.collider.addBox(-0.35, 1.15, -8.75, -8.15);
    this.inter.add({ id: 'pastShoes', x: 0.35, z: -7.75, y: 0.4, hintY: 0.9, reach: 1.0, discover: 'past_shoe_note',
      onUse: () => game.discover('past_shoe_note', new THREE.Vector3(0.35, 0.5, -8.4)) });
  }

  buildYard() {
    const s = this.scene, game = this.game, C = this.collider;
    // mud walls (흙담) with a tile cap, gate opening on the south side
    const wallM = mat('#C9A77E', { rough: 1 }), capM = mat('#5A5658', { rough: 0.7 });
    const mud = (x, z, w, d) => {
      const m = box(w, 1.25, d, null, { m: wallM }); at(m, x, 0, z); s.add(m);
      const c = box(w + 0.15, 0.18, d + 0.25, null, { m: capM }); at(c, x, 1.25, z); s.add(c);
      C.addRect(x, z, w, d, 'wall');
    };
    mud(-4.6, -4, 6.8, 0.35); mud(4.6, -4, 6.8, 0.35);
    mud(-8, -8.8, 0.35, 9.6); mud(8, -8.8, 0.35, 9.6);
    mud(0, -13.75, 16.3, 0.35);
    // wooden gate posts (open gate)
    for (const sx of [-1.2, 1.2]) { const p = box(0.22, 2.0, 0.22, '#7A5536'); at(p, sx, 0, -4); s.add(p); }
    const lintel = box(2.8, 0.18, 0.3, '#5A5658'); at(lintel, 0, 2.0, -4); s.add(lintel);
    for (const [sx, r] of [[-1.15, -1.2], [1.15, 1.2]]) { const leaf = box(1.0, 1.6, 0.08, '#8C6A4A'); const piv = group(leaf); leaf.position.x = Math.sign(sx) * -0.5; at(piv, sx, 0.15, -4, r); s.add(piv); }

    // persimmon tree (shake → a persimmon drops with a note)
    const tree = new THREE.Group(); at(tree, -5.3, 0, -6.6); s.add(tree);
    const trunk = cyl(0.2, 0.3, 2.2, '#6B4E3A', { seg: 6 }); tree.add(trunk);
    for (const [a, l] of [[0.5, 1.2], [-0.6, 1.0], [2.2, 0.9]]) { const br = cyl(0.07, 0.11, l, '#6B4E3A', { seg: 5 }); br.position.y = 1.8; br.rotation.set(Math.cos(a) * 0.8, 0, Math.sin(a) * 0.8); tree.add(br); }
    this.canopy = new THREE.Group(); this.canopy.position.y = 2.8; tree.add(this.canopy);
    const rnd = seeded(5);
    for (let i = 0; i < 8; i++) { const c = sphere(0.9 + rnd() * 0.4, i % 2 ? '#7E8F3E' : '#8F9A48', { w: 7, h: 5 }); at(c, (rnd() - 0.5) * 2.2, (rnd() - 0.3) * 1.0, (rnd() - 0.5) * 2.2); this.canopy.add(c); }
    this.kaki = [];
    for (let i = 0; i < 16; i++) { const k = sphere(0.12, '#EE7B2A', { w: 7, h: 5, opts: { emissive: '#C04A10', emissiveIntensity: 0.15 } }); k.scale.y = 0.8; const a = rnd() * PI * 2, r = 1.0 + rnd() * 0.7; at(k, Math.cos(a) * r, -0.4 + rnd() * 1.2, Math.sin(a) * r); this.canopy.add(k); this.kaki.push(k); }
    C.addCircle(-5.3, -6.6, 0.35);
    this.fallen = new THREE.Group(); const fk = sphere(0.12, '#EE7B2A', { w: 7, h: 5 }); fk.scale.y = 0.8; this.fallen.add(fk);
    const tagN = box(0.1, 0.07, 0.005, '#FFF0C8'); at(tagN, 0.1, 0.05, 0.08); this.fallen.add(tagN);
    this.fallen.visible = false; s.add(this.fallen);
    this.shake = 0;
    this.inter.add({ id: 'kakiTree', x: -5.3, z: -6.6, y: 1.4, reach: 1.4, discover: 'past_persimmon_note',
      onUse: async () => {
        game.mom.faceToward(-5.3, -6.6); game.mom.play('hug', 1.0); game.audio.play('rustle'); this.shake = 1.2;
        if (game.disc.isFound('past_persimmon_note')) return;
        const p = game.mom.position;
        const start = new THREE.Vector3(-5.3 + (p.x + 5.3) * 0.3, 2.6, -6.6 + (p.z + 6.6) * 0.3);
        this.fallen.visible = true;
        await game.tweens.add(0.7, (t) => { this.fallen.position.set(start.x, 2.6 - t * t * 2.5 + 0.1, start.z); });
        game.audio.play('thud');
        await game.tweens.wait(0.4);
        await game.discover('past_persimmon_note', this.fallen.position.clone().setY(0.6));
      } });

    // 장독대: a stone platform with earthen jars; one hides a gift
    const plat = box(3.2, 0.35, 2.2, '#A49A8A', { r: 0.05 }); at(plat, 5.4, 0, -11.3); s.add(plat);
    C.addRect(5.4, -11.3, 3.2, 2.2);
    const jarM = mat('#6A3E24', { rough: 0.35, metal: 0.05, flat: false });
    this.jarLids = [];
    [[4.4, -12, 1.0], [5.4, -12, 1.15], [6.4, -12, 0.9], [4.6, -10.7, 0.75], [5.6, -10.7, 0.85], [6.5, -10.7, 0.7]].forEach(([x, z, sc], i) => {
      const j = sphere(0.42, null, { w: 12, h: 9, m: jarM }); j.scale.set(sc, sc * 1.05, sc); at(j, x, 0.35 + 0.4 * sc, z); s.add(j);
      const lid = new THREE.Group(); at(lid, x, 0.35 + 0.8 * sc, z); s.add(lid);
      const ld = cyl(0.3 * sc, 0.25 * sc, 0.1, '#5A341E', { seg: 10 }); lid.add(ld);
      const kn = sphere(0.06, '#5A341E'); kn.position.y = 0.11; lid.add(kn);
      this.jarLids.push(lid);
    });
    this.inter.add({ id: 'jar', x: 4.7, z: -9.75, y: 1.0, reach: 1.2, discover: 'past_jar_gift',
      onUse: async () => {
        const lid = this.jarLids[4]; game.audio.play('lid');
        await game.tweens.add(0.5, (t) => { lid.position.y = 1.03 + t * 0.25; lid.rotation.z = t * 0.5; });
        game.say('된장 냄새~', 1600); await game.tweens.wait(0.8);
        await game.discover('past_jar_gift', new THREE.Vector3(5.6, 1.2, -10.7));
        await game.tweens.add(0.5, (t) => { lid.position.y = 1.28 - t * 0.25; lid.rotation.z = 0.5 * (1 - t); });
      } });
    // a few chickens' worth of charm: a washing basin and a broom by the wall
    const basin = cyl(0.45, 0.35, 0.25, '#B7B0A4', { seg: 10, opts: { metal: 0.3, rough: 0.5 } }); at(basin, -2.8, 0, -8.0); s.add(basin); C.addCircle(-2.8, -8.0, 0.45);
  }

  buildVillage() {
    const s = this.scene, game = this.game, C = this.collider;
    // stone walls (돌담) along the road
    const stoneM = mat('#9C9282', { rough: 1 });
    const rnd = seeded(9);
    const stoneWall = (x0, x1, z) => {
      for (let x = x0; x < x1; x += 0.55) { const st = sphere(0.33 + rnd() * 0.1, null, { w: 5, h: 4, m: stoneM }); st.scale.set(1, 0.75, 0.85); at(st, x + 0.27, 0.25 + rnd() * 0.08, z + (rnd() - 0.5) * 0.08); s.add(st); const st2 = st.clone(); st2.position.y = 0.72; st2.position.x += 0.25; st2.scale.multiplyScalar(0.85); s.add(st2); }
      C.addBox(x0, x1, z - 0.32, z + 0.32);
    };
    stoneWall(-20, -16.5, -0.25); stoneWall(-10.5, -1.6, -0.25); stoneWall(1.6, 20, -0.25);
    stoneWall(-20, -13, 2.9); stoneWall(-1.5, 8.6, 2.9); stoneWall(13.4, 20, 2.9);

    // 구멍가게 (little corner shop) north-west, facing the road
    const shop = new THREE.Group(); at(shop, -13.5, 0, -3.6); s.add(shop);
    const sb = box(4.6, 2.3, 3.6, '#E9DCC2'); shop.add(sb);
    const sroof = box(5.2, 0.2, 4.2, '#7A6E6A'); at(sroof, 0, 2.3, 0); sroof.rotation.x = 0.08; shop.add(sroof);
    const awning = box(4.8, 0.08, 1.0, '#B0483C'); at(awning, 0, 2.0, 2.2); awning.rotation.x = 0.25; shop.add(awning);
    const signT = textTexture('구멍가게', { w: 256, h: 80, size: 46, color: '#3A2E28', bg: '#F6ECD6' });
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.6), new THREE.MeshBasicMaterial({ map: signT })); at(sign, 0, 1.65, 1.82); shop.add(sign);
    const door = box(1.2, 1.7, 0.05, '#8C6A4A'); at(door, -1.1, 0, 1.81); shop.add(door);
    const win = box(1.4, 0.8, 0.05, '#FBF3DF', { opts: { emissive: '#FFE2A8', emissiveIntensity: 0.3 } }); at(win, 1.0, 0.7, 1.81); shop.add(win);
    C.addRect(-13.5, -3.6, 4.6, 3.6, 'wall');
    // candy table out front with glass jars
    const tbl = box(1.4, 0.7, 0.6, '#A87C55', { r: 0.02 }); at(tbl, -12.6, 0, -1.25); s.add(tbl); C.addRect(-12.6, -1.25, 1.4, 0.6);
    ['#E4574F', '#E8C547', '#7BB6B0'].forEach((c, i) => {
      const jar = cyl(0.14, 0.14, 0.3, '#EAF4F2', { seg: 8, opts: { transparent: true, opacity: 0.45 } }); at(jar, -13.05 + i * 0.45, 0.7, -1.25); s.add(jar);
      for (let k = 0; k < 6; k++) { const cd = sphere(0.04, c, { w: 5, h: 4 }); at(cd, -13.05 + i * 0.45 + (k % 3 - 1) * 0.06, 0.75 + Math.floor(k / 3) * 0.07, -1.25 + (k % 2) * 0.05); s.add(cd); }
    });
    this.inter.add({ id: 'candy', x: -12.6, z: -0.55, y: 0.9, reach: 1.1, discover: 'past_candy_note',
      onUse: async () => { game.say('눈깔사탕이다!', 1600); await game.tweens.wait(0.8); await game.discover('past_candy_note', new THREE.Vector3(-12.6, 1.0, -1.25)); } });

    // rice field + scarecrow (south-west)
    const field = box(10, 0.06, 9, '#A7A050', { cast: false }); at(field, -7.5, -0.02, 9); s.add(field);
    const stalkM = mat('#D6C25A', { rough: 1 });
    const stalkGeo = new THREE.ConeGeometry(0.06, 0.6, 3); stalkGeo.translate(0, 0.3, 0);
    const stalks = new THREE.InstancedMesh(stalkGeo, stalkM, 900);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3();
    let n = 0;
    for (let x = -12.2; x < -2.8 && n < 900; x += 0.33) for (let z = 4.8; z < 13.3 && n < 900; z += 0.33) {
      if (Math.abs(z - 9) < 0.55) continue; // 논두렁 path through the middle
      p.set(x + (rnd() - 0.5) * 0.12, 0, z + (rnd() - 0.5) * 0.12); q.setFromEuler(new THREE.Euler((rnd() - 0.5) * 0.3, 0, (rnd() - 0.5) * 0.3)); sc.setScalar(0.55 + rnd() * 0.3);
      m4.compose(p, q, sc); stalks.setMatrixAt(n++, m4);
    }
    stalks.count = n; stalks.castShadow = true; stalks.receiveShadow = true; s.add(stalks); this.stalks = stalks;
    const ridge = box(10, 0.1, 0.9, '#B79A6A', { cast: false }); at(ridge, -7.5, -0.02, 9); s.add(ridge);
    const scare = new THREE.Group(); at(scare, -7.5, 0, 9.0); s.add(scare);
    const post = cyl(0.05, 0.06, 1.8, '#7A5536', { seg: 5 }); scare.add(post);
    const arms = cyl(0.04, 0.04, 1.4, '#7A5536', { seg: 5 }); arms.rotation.z = PI / 2; at(arms, 0.7, 1.35, 0); scare.add(arms);
    const shirt = box(0.6, 0.6, 0.25, '#9C5B4B'); at(shirt, 0, 0.95, 0); scare.add(shirt);
    const sh = sphere(0.2, '#E6D2A6', { w: 7, h: 5 }); sh.position.y = 1.75; scare.add(sh);
    const hat = cone(0.42, 0.25, '#D9B860', { seg: 8 }); hat.position.y = 1.85; scare.add(hat);
    const gift = box(0.22, 0.18, 0.22, '#E98F9E', { r: 0.02 }); at(gift, 0.32, 0, 0.25); scare.add(gift);
    C.addCircle(-7.5, 9.0, 0.3);
    this.inter.add({ id: 'scarecrow', x: -7.5, z: 9.6, y: 0.5, hintY: 1.4, reach: 1.1, discover: 'past_scarecrow_gift',
      onUse: () => game.discover('past_scarecrow_gift', new THREE.Vector3(-7.2, 0.4, 9.25)) });

    // stream with stepping stones (south-east); float a paper boat
    this.streamMat = new THREE.MeshStandardMaterial({ color: '#7FB3B0', roughness: 0.15, metalness: 0.15, transparent: true, opacity: 0.85 });
    const stream = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 12, 4, 16).rotateX(-PI / 2), this.streamMat); stream.position.set(11, 0.02, 9.6); s.add(stream); this.stream = stream;
    for (const sx of [9.6, 12.4]) { const bank = box(0.4, 0.15, 12, '#A49A8A', { cast: false }); at(bank, sx, -0.05, 9.6); s.add(bank); }
    for (const x of [10.1, 10.8, 11.5, 12.1]) { const st = cyl(0.28, 0.32, 0.14, '#B8AE9E', { seg: 7 }); at(st, x, 0, 8.0); s.add(st); }
    C.addBox(9.7, 12.3, 3.4, 7.55); C.addBox(9.7, 12.3, 8.45, 15.6);
    this.boat = new THREE.Group(); const hull = cone(0.16, 0.12, '#FFFFFF', { seg: 3 }); hull.rotation.x = PI; hull.scale.set(1.4, 1, 0.6); hull.position.y = 0.12; this.boat.add(hull);
    const sail = cone(0.1, 0.18, '#FFF8E8', { seg: 3 }); sail.position.y = 0.12; sail.scale.z = 0.2; this.boat.add(sail);
    this.boat.visible = false; s.add(this.boat);
    this.inter.add({ id: 'boat', x: 9.3, z: 5.8, y: 0.5, reach: 1.2, discover: 'past_boat_photo',
      onUse: async () => {
        game.mom.faceToward(11, 5.8); game.mom.play('reach', 0.8); game.audio.play('splash');
        this.boat.visible = true;
        await game.tweens.add(3.2, (t) => { this.boat.position.set(11 + Math.sin(t * 9) * 0.2, 0.03 + Math.sin(t * 14) * 0.02, 4.2 + t * 7); this.boat.rotation.y = Math.sin(t * 6) * 0.4; }, (t) => t);
        if (!game.disc.isFound('past_boat_photo')) await game.discover('past_boat_photo', this.boat.position.clone().setY(0.5));
        this.boat.visible = false;
      } });
  }

  buildExit() {
    const s = this.scene;
    // at the end of the road a warm light opens
    this.portal = new THREE.Group(); at(this.portal, 19.2, 0, ROAD_Z); s.add(this.portal);
    this.portalGlow = glowSprite('#FFF1CC', 5.5, 0.85); this.portalGlow.position.y = 1.6; this.portal.add(this.portalGlow);
    const core = glowSprite('#FFFFFF', 2.2, 0.9); core.position.y = 1.2; this.portal.add(core);
    this.exitLight = new THREE.PointLight('#FFE2A8', 6, 9, 1.5); this.exitLight.position.set(18.5, 1.5, ROAD_Z); s.add(this.exitLight);
    // fireflies around the end of the road
    this.flies = [];
    for (let i = 0; i < 22; i++) { const f = glowSprite('#E8FF9A', 0.22, 0.8); s.add(f); this.flies.push({ f, x: 14 + Math.random() * 5.5, y: 0.4 + Math.random() * 1.6, z: ROAD_Z - 1.4 + Math.random() * 2.8, p: Math.random() * 10 }); }
  }

  enter() {
    const g = this.game, mom = g.mom;
    mom.setForm('child'); mom.setFootwear('shoes'); mom.showBag = false; mom.setBagCount(-1);
    mom.position.set(0, 0, -2.6); mom.face(PI, true);
    this.leaving = false; this.timeIn = 0;
    g.audio.setLoops(['bgm_past', 'cicadas'], 3);
    setTimeout(() => g.say('어? 여기… 우리 집이다!', 2600), 1800);
  }
  exit() {}
  cameraYawFor() { return 0; }
  surfaceAt() { return 'dirt'; }

  update(dt) {
    const g = this.game, p = g.mom.position;
    this.time += dt; this.timeIn += dt;
    // tree shake
    this.shake = Math.max(0, this.shake - dt);
    this.canopy.rotation.z = Math.sin(this.time * 25) * 0.05 * this.shake + Math.sin(this.time * 0.8) * 0.01;
    this.canopy.rotation.x = Math.cos(this.time * 21) * 0.04 * this.shake;
    // stream shimmer
    this.streamMat.color.setHSL(0.48, 0.25, 0.58 + Math.sin(this.time * 1.5) * 0.02);
    // dust motes + fireflies
    const arr = this.dustPts.geometry.attributes.position.array;
    this.dust.forEach((m, i) => { m.y += Math.sin(this.time * 0.4 + m.p) * dt * 0.08; m.x += Math.cos(this.time * 0.25 + m.p) * dt * 0.1; arr[i * 3] = m.x; arr[i * 3 + 1] = m.y; arr[i * 3 + 2] = m.z; });
    this.dustPts.geometry.attributes.position.needsUpdate = true;
    for (const f of this.flies) {
      f.f.position.set(f.x + Math.sin(this.time * 0.7 + f.p) * 0.6, f.y + Math.sin(this.time * 1.3 + f.p * 2) * 0.3, f.z + Math.cos(this.time * 0.5 + f.p) * 0.5);
      f.f.material.opacity = 0.35 + 0.55 * Math.max(0, Math.sin(this.time * 2.2 + f.p * 3));
    }
    this.portalGlow.material.opacity = 0.7 + Math.sin(this.time * 1.4) * 0.12;
    // walking into the warm light at the end of the road returns her home
    if (!this.leaving && this.timeIn > 2 && Math.hypot(p.x - 19.2, p.z - ROAD_Z) < 1.6 && !g.busy) {
      this.leaving = true;
      g.say(content.bubbles.pastBack, 2000);
      setTimeout(() => g.goTo('home', { color: '#FFFFFF', ms: 2200 }), 1200);
    }
    this.sky.mesh.position.copy(g.cam.camera.position);
  }
}
