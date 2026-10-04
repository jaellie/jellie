import * as THREE from 'three';
import { content } from '../content.js';
import { Collider } from '../core/Collision.js';
import { createRig } from '../core/Lighting.js';
import { Interactables } from '../systems/Interactables.js';
import { box, cyl, sphere, at, group, canvasTexture, glowSprite, glowTexture, textTexture, mat, seeded } from '../models/kit.js';
import { makeSky, makeSea, makeCoast, makeBayLights, makeGulls, makeMoon } from '../models/outdoor.js';

// Ending: Ungcheon Beach at dusk. Sand, waves, lamp posts, a crescent moon, and the letter.

const PI = Math.PI, lerp = THREE.MathUtils.lerp, sstep = THREE.MathUtils.smoothstep;
const SHORE = -5.2;

export class Beach {
  constructor(game) {
    this.game = game; this.name = 'beach'; this.cameraDistance = 7.5; this.cameraPitch = THREE.MathUtils.degToRad(15);
    this.scene = new THREE.Scene(); this.collider = new Collider();
    this.time = 0; this.sunset = 0.65; this.letterShown = false; this.timeIn = 0;
  }

  build() {
    const s = this.scene, game = this.game;
    s.background = new THREE.Color('#1B1B3A');
    s.fog = new THREE.Fog('#E9747A', 45, 280);
    this.rig = createRig(s, { shadowSize: 1024, extent: 18, hemi: 0.9, hemiGround: '#B98A6A' });
    this.sky = makeSky(); s.add(this.sky.mesh);
    this.inter = new Interactables(s, game.disc);

    // sand (gently displaced, faceted)
    const sg = new THREE.PlaneGeometry(80, 22, 60, 16).rotateX(-PI / 2);
    const pos = sg.attributes.position, rnd = seeded(11);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      pos.setY(i, Math.sin(x * 0.3) * 0.05 + Math.cos(z * 0.6 + x * 0.1) * 0.05 + rnd() * 0.04 - (z < -6 ? (-6 - z) * 0.08 : 0));
    }
    sg.computeVertexNormals();
    this.sandMat = new THREE.MeshStandardMaterial({ color: '#E9CFA2', roughness: 1, flatShading: true });
    const sand = new THREE.Mesh(sg, this.sandMat); sand.position.set(0, 0, 1.5); sand.receiveShadow = true; s.add(sand);
    // wet sand band
    const wet = new THREE.Mesh(new THREE.PlaneGeometry(80, 2.4), new THREE.MeshStandardMaterial({ color: '#B9946C', roughness: 0.35, metalness: 0.1, transparent: true, opacity: 0.7 }));
    wet.rotation.x = -PI / 2; wet.position.set(0, 0.03, SHORE + 0.4); s.add(wet); this.wet = wet;

    // sea + foam lines
    this.sea = makeSea(500, 300, 60, 40); this.sea.mesh.position.set(0, -0.35, SHORE - 150); s.add(this.sea.mesh);
    const foamTex = canvasTexture(256, 32, (c) => { const g = c.createLinearGradient(0, 0, 0, 32); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.9)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 256, 32); });
    this.foam = [0, 1, 2].map((i) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(80, 0.7), new THREE.MeshBasicMaterial({ map: foamTex, transparent: true, opacity: 0, depthWrite: false, color: '#FFF6EA' }));
      m.rotation.x = -PI / 2; m.position.y = 0.06; s.add(m); return { m, o: i / 3 };
    });

    this.coast = makeCoast(8, { count: 12, radius: [240, 380], y: -0.5, spread: PI * 1.1, scale: 0.55 }); s.add(this.coast.group);
    this.bay = makeBayLights(6, { count: 140, radius: [110, 200], y: 1, spread: PI * 1.0 }); s.add(this.bay.points);
    this.gulls = makeGulls(3, new THREE.Vector3(0, 0, -16), 14, 7); s.add(this.gulls.group);
    this.moon = makeMoon(); this.moon.position.set(-110, 20, -260); s.add(this.moon);

    // promenade, lamp posts, benches
    const deck = box(80, 0.1, 3.4, '#B9906A', { cast: false }); at(deck, 0, -0.05, 9.2); s.add(deck);
    const edge = box(80, 0.25, 0.2, '#D7C3A4', { cast: false }); at(edge, 0, -0.12, 7.5); s.add(edge);
    this.lamps = [];
    const LZ = 2.4; // lamp posts stand along the sand, off the camera's line to Mom
    for (let x = -25; x <= 25; x += 10) {
      const post = cyl(0.06, 0.08, 3.2, '#3A3430', { seg: 6 }); at(post, x, 0, LZ); s.add(post);
      const arm = box(0.5, 0.05, 0.05, '#3A3430'); at(arm, x + 0.2, 3.15, LZ); s.add(arm);
      const bulbM = new THREE.MeshStandardMaterial({ color: '#FFF1D0', emissive: '#FFC064', emissiveIntensity: 0 });
      const bulb = sphere(0.16, null, { m: bulbM, cast: false }); at(bulb, x + 0.42, 2.98, LZ); s.add(bulb);
      const halo = glowSprite('#FFC98A', 2.4, 0); halo.position.copy(bulb.position); s.add(halo);
      const light = new THREE.PointLight('#FFC98A', 0, 12, 1.5); light.position.copy(bulb.position); s.add(light);
      this.lamps.push({ bulbM, halo, light, x });
      this.collider.addCircle(x, LZ, 0.15);
    }
    const bench = (x, z, r) => {
      const g = new THREE.Group();
      const seat = box(1.6, 0.06, 0.45, '#A9774B', { r: 0.02 }); seat.position.y = 0.42; g.add(seat);
      const back = box(1.6, 0.35, 0.05, '#A9774B', { r: 0.02 }); at(back, 0, 0.55, -0.22); back.rotation.x = -0.15; g.add(back);
      for (const sx of [-0.7, 0.7]) { const l = box(0.06, 0.42, 0.42, '#3A3430'); at(l, sx, 0, 0); g.add(l); }
      at(g, x, 0, z, r); s.add(g); this.collider.addRect(x, z, 1.7, 0.5); return g;
    };
    this.bench = bench(2.2, 3.45, PI);
    bench(-11, 3.45, PI); bench(12, 3.45, PI);
    // little palms / pines along the promenade
    for (const x of [-20, -9, 6, 18]) {
      const t = cyl(0.12, 0.16, 2.6, '#6B5040', { seg: 6 }); at(t, x, 0, 10.2); s.add(t);
      const c = sphere(1.1, '#3F5E3A', { w: 7, h: 5 }); c.scale.y = 0.8; at(c, x, 3.0, 10.2); s.add(c);
    }

    // the letter: a glowing envelope that waits at the water's edge
    this.envelope = new THREE.Group();
    const env = box(0.36, 0.24, 0.02, '#FFF6E6', { r: 0.01, opts: { emissive: '#FFE2B0', emissiveIntensity: 0.4 } }); env.position.y = -0.12; this.envelope.add(env);
    const seal = sphere(0.04, '#D4566A', { opts: { emissive: '#D4566A', emissiveIntensity: 0.3 } }); at(seal, 0, 0, 0.02); this.envelope.add(seal);
    this.envGlow = glowSprite('#FFE2B0', 1.4, 0.55); this.envelope.add(this.envGlow);
    this.envelope.position.set(0, 1.0, -2.2); s.add(this.envelope);
    this.inter.add({ id: 'letter', x: 0, z: -2.2, y: 1.0, reach: 1.4, onUse: () => this.showLetter() });

    // bench sit
    this.inter.add({ id: 'bench', x: 2.2, z: 2.95, y: 0.6, reach: 1.0, enabled: () => game.mom.pose !== 'sit',
      onUse: async () => { game.mom.sit(2.2, 3.4, PI, 0.46); this.sitting = true; game.cam.targetDistance = 7.5; await game.tweens.wait(0.8); game.say('바다 좋다…'); } });

    // optional: "다시 집으로" sign far left
    const sign = new THREE.Group();
    const signPost = cyl(0.05, 0.05, 1.3, '#6B5040', { seg: 5 }); sign.add(signPost);
    const board = box(1.1, 0.42, 0.05, '#F2E3C6', { r: 0.02 }); board.position.y = 1.1; sign.add(board);
    const label = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.32), new THREE.MeshBasicMaterial({ map: textTexture('다시 집으로', { w: 256, h: 80, size: 40, color: '#5A3E2E' }), transparent: true }));
    at(label, 0, 1.3, 0.03); sign.add(label);
    at(sign, -25, 0, 5.5, 0.3); s.add(sign);
    this.collider.addCircle(-25, 5.5, 0.15);
    this.inter.add({ id: 'homeSign', x: -25, z: 5.5, y: 1.2, reach: 1.3, onUse: () => game.goTo('home', { color: '#000', ms: 1500 }) });

    // bounds
    this.collider.addBox(-40, -28.5, -20, 20); this.collider.addBox(28.5, 40, -20, 20);
    this.collider.addBox(-40, 40, -30, SHORE + 0.2); this.collider.addBox(-40, 40, 10.8, 30);
  }

  enter(from) {
    const g = this.game, mom = g.mom;
    this.sunset = THREE.MathUtils.clamp(g.worlds.home?.state.sunset ?? 0.6, 0.55, 0.7);
    this.timeIn = 0;
    mom.setForm('adult'); mom.setFootwear('shoes'); mom.showBag = false; mom.setBagCount(-1);
    mom.position.set(0, 0, 5.6); mom.face(PI, true);
    g.audio.setLoops(['bgm_beach', 'waves', 'gulls'], 3);
    setTimeout(() => g.say('바다 냄새…'), 2200);
  }
  exit() { this.sitting = false; this.game.mom.stand(); }
  cameraYawFor() { return 0; }
  surfaceAt(x, z) { return z > 7.5 ? 'wood' : 'sand'; }

  async showLetter() {
    const g = this.game;
    this.letterShown = true;
    g.busy = true;
    g.audio.play('chime');
    await g.tweens.wait(0.6);
    g.busy = false;
    await g.overlay.letterCard();
  }

  update(dt) {
    const g = this.game, mom = g.mom;
    this.time += dt; this.timeIn += dt;
    this.sunset = Math.min(1, this.sunset + dt / 110);
    const s = this.sunset;

    if (mom.pose === 'sit' && g.moveIntent && !g.busy) { mom.stand(); mom.position.set(2.2, 0, 2.75); this.sitting = false; g.cam.targetDistance = this.cameraDistance; }

    // sky & light
    const el = lerp(0.12, -0.08, s), az = PI + 0.35;
    const dir = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).normalize();
    const pal = this.sky.set(s, dir);
    this.rig.aim(mom.position, Math.max(0.12, el + 0.15), az, 40);
    this.rig.sun.color.copy(pal.sun);
    this.rig.sun.intensity = lerp(2.8, 0.6, sstep(s, 0.6, 1));
    this.rig.hemi.color.copy(pal.top).lerp(new THREE.Color('#FFE6C4'), 0.45);
    this.rig.hemi.groundColor.copy(pal.hor).multiplyScalar(0.7);
    this.rig.hemi.intensity = lerp(1.6, 0.95, sstep(s, 0.5, 1));
    this.scene.fog.color.copy(pal.hor);
    this.sea.mesh.material.color.copy(pal.sea);
    this.coast.mat.color.copy(pal.hill);
    this.sandMat.color.set('#F0D8AE').lerp(pal.hor, 0.12).multiplyScalar(lerp(1.05, 0.85, sstep(s, 0.6, 1)));
    this.bay.mat.opacity = sstep(s, 0.6, 0.9);
    this.moon.material.opacity = sstep(s, 0.72, 0.95);
    this.moon.position.y = lerp(10, 55, sstep(s, 0.7, 1));
    const lampOn = sstep(s, 0.68, 0.82);
    for (const l of this.lamps) {
      const f = lampOn * (0.95 + Math.sin(this.time * 3 + l.x) * 0.03);
      l.bulbM.emissiveIntensity = f * 2.2; l.halo.material.opacity = f * 0.55; l.light.intensity = f * 5;
    }

    // waves and foam
    if ((this._seaT = (this._seaT || 0) + dt) > 1 / 30) { this._seaT = 0; this.sea.update(this.time, 0.18, 0.8); }
    for (const f of this.foam) {
      const u = (this.time / 6 + f.o) % 1;
      f.m.position.z = SHORE - 2.4 + Math.sin(u * PI) * 2.0;
      f.m.material.opacity = Math.sin(u * PI) * 0.65;
      f.m.material.color.set('#FFF6EA').lerp(pal.hor, 0.3);
    }
    this.wet.material.color.set('#B9946C').lerp(pal.sun, 0.25);
    this.gulls.update(this.time);

    // the envelope bobs; the letter appears near the center or after 25 s
    this.envelope.position.y = 1.0 + Math.sin(this.time * 1.5) * 0.08;
    this.envelope.rotation.y = Math.sin(this.time * 0.7) * 0.4;
    this.envGlow.material.opacity = 0.45 + Math.sin(this.time * 2) * 0.12;
    const p = mom.position;
    if (!this.letterShown && !g.busy && !g.overlay.isOpen && (Math.hypot(p.x, p.z + 2.2) < 2.2 || this.timeIn > 25)) this.showLetter();

    this.sky.mesh.position.copy(g.cam.camera.position);
  }
}
