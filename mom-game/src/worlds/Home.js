import * as THREE from 'three';
import { content } from '../content.js';
import { layout as L } from './layout.js';
import { Collider } from '../core/Collision.js';
import { createRig } from '../core/Lighting.js';
import { Interactables } from '../systems/Interactables.js';
import { MemoryShelf } from '../systems/MemoryShelf.js';
import { box, cyl, sphere, at, group, canvasTexture, glowSprite, glowTexture, shadowOnly, mat, textTexture } from '../models/kit.js';
import * as H from '../models/home.js';
import { makeSky, makeSea, makeCoast, makeBayLights, makeGulls, skyPalette } from '../models/outdoor.js';
import { rubberShoe, slipper } from '../entities/Mom.js';
import { ease } from '../core/Tween.js';
import { PITCH } from '../core/Camera.js';
import { makeDrive } from './Mall.js';

const PI = Math.PI;
const lerp = THREE.MathUtils.lerp;
const F = L.furniture;
const SEA_Y = -55;
// side walls that stand between the camera and Mom in each view
const CUT_ALSO_LIVING = ['kitchenEast', 'entryWest'];
const CUT_ALSO_KITCHEN = ['eastLiving', 'balconyEast', 'balconyWest'];

function plankTexture(w, d, base = H.P.floor) {
  const t = canvasTexture(512, 512, (c) => {
    c.fillStyle = base; c.fillRect(0, 0, 512, 512);
    for (let y = 0; y < 512; y += 64) {
      c.fillStyle = `rgba(150,100,50,${0.05 + ((y / 64) % 3) * 0.03})`; c.fillRect(0, y, 512, 64);
      c.fillStyle = 'rgba(120,80,40,0.25)'; c.fillRect(0, y, 512, 2);
      const off = ((y / 64) * 197) % 512; c.fillRect(off, y, 2, 64); c.fillRect((off + 256) % 512, y, 2, 64);
      for (let k = 0; k < 6; k++) { c.fillStyle = 'rgba(255,240,210,0.06)'; c.fillRect((k * 91 + y) % 512, y + 20 + (k % 3) * 9, 60, 2); }
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(w / 2.2, d / 2.2); t.rotation = PI / 2;
  return t;
}
function tileTexture(w, d, a = '#E8DCCB', b = '#DCCCB6') {
  const t = canvasTexture(256, 256, (c) => {
    c.fillStyle = a; c.fillRect(0, 0, 256, 256);
    c.fillStyle = b; c.fillRect(0, 0, 128, 128); c.fillRect(128, 128, 128, 128);
    c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 3; c.strokeRect(0, 0, 128, 128); c.strokeRect(128, 128, 128, 128); c.strokeRect(128, 0, 128, 128); c.strokeRect(0, 128, 128, 128);
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(w / 1.2, d / 1.2);
  return t;
}

export class Home {
  constructor(game) {
    this.game = game;
    this.name = 'home';
    this.cameraDistance = 7.2;
    this.scene = new THREE.Scene();
    this.collider = new Collider();
    this.state = { sunset: 0, elapsed: 0, curtains: 0, curtainsOpen: false, fan: false, whale: false, phoneRang: false, visits: 0 };
    this.time = 0;
    this.walls = [];
    this.anim = []; // per-frame callbacks
  }

  // ───────────────────────────────────────────────────────────
  build() {
    const s = this.scene;
    s.background = new THREE.Color('#2A1E1A');
    s.fog = new THREE.Fog('#FFE3B8', 160, 700);
    this.rig = createRig(s, { shadowSize: 2048, extent: 7.5, hemi: 1.15 });
    this.focus = new THREE.Vector3(3.2, 0, 2.6);

    this.sky = makeSky(); s.add(this.sky.mesh);
    this.disc = this.game.disc;
    this.inter = new Interactables(s, this.disc);

    this.buildShell();
    this.buildOutside();
    this.buildWindowAndCurtains();
    this.buildLiving();
    this.buildKitchen();
    this.buildEntry();
    this.buildLightFx();

    // warm lamps that fade up as the sun gets lower
    this.lamps = [];
    const addLamp = (x, y, z, base, add, dist = 6) => { const p = new THREE.PointLight('#FFC98A', base, dist, 1.6); p.position.set(x, y, z); s.add(p); this.lamps.push({ p, base, add }); return p; };
    addLamp(1.9, 2.25, 2.3, 1.2, 3.5, 7);       // ceiling box light (living)
    addLamp(F.lamp.x + 0.1, 0.95, F.lamp.z, 0.8, 2.2, 4.5); // side lamp by the sofa
    addLamp(1.7, 2.25, 5.5, 0.9, 2.5, 6);       // kitchen ceiling
    addLamp(6.7, 2.2, 4.6, 0.6, 1.6, 4);        // entry

    this.applySunset();
  }

  // floors, walls (with camera cutaway), shadow proxies
  buildShell() {
    const s = this.scene, T = L.wallT, HGT = L.wallH;
    // base slab under the whole flat (unbuilt rooms read as a warm wooden board)
    const slab = box(13.4, 0.3, 9.6, '#5B4535', { cast: false }); at(slab, 3.7, -0.36, 4.0); s.add(slab);
    const facade = box(13.4, 54, 9.6, '#E7D7C0', { cast: false }); at(facade, 3.7, SEA_Y + 0.5, 4.0); s.add(facade);

    const floorMat = (w, d) => new THREE.MeshStandardMaterial({ map: plankTexture(w, d), roughness: 0.6 });
    const floors = [
      [L.living, floorMat(3.8, 4.3)], [L.kitchen, floorMat(3.3, 2.5)], [L.hall, floorMat(3.6, 1.1)],
    ];
    for (const [r, m] of floors) {
      const f = box(r.x1 - r.x0, 0.06, r.z1 - r.z0, null, { m, cast: false }); at(f, (r.x0 + r.x1) / 2, -0.06, (r.z0 + r.z1) / 2); s.add(f);
    }
    const e = L.entry;
    const ef = box(e.x1 - e.x0, 0.06, e.z1 - e.z0, null, { m: new THREE.MeshStandardMaterial({ map: tileTexture(1.3, 1.5), roughness: 0.5 }), cast: false });
    at(ef, (e.x0 + e.x1) / 2, -0.1, (e.z0 + e.z1) / 2); s.add(ef);
    const b = L.balcony;
    const bf = box(b.x1 - b.x0, 0.08, b.z1 - b.z0, null, { m: new THREE.MeshStandardMaterial({ map: tileTexture(3.8, 1.5, '#E9DCC6', '#DECBB0'), roughness: 0.7 }), cast: false });
    at(bf, (b.x0 + b.x1) / 2, -0.1, (b.z0 + b.z1) / 2); s.add(bf);
    const lip = box(b.x1 - b.x0 + 0.3, 0.25, 0.18, '#E7D7C0', { cast: false }); at(lip, (b.x0 + b.x1) / 2, -0.3, b.z0 - 0.09); s.add(lip);

    // ceiling shadow proxy (invisible, casts shadow so sun only enters via the window)
    const ceil = shadowOnly(box(8.2, 0.08, 9.0)); at(ceil, 3.7, HGT, 2.9); s.add(ceil);

    // wall segments: [x0, z0, x1, z1, nx, nz, name]
    const W = [
      [0, 0, 3.8, 0, 0, 1, 'south'],
      [3.8, 0, 3.8, 3.2, -1, 0, 'eastLiving'],
      [3.8, 3.2, 7.4, 3.2, 0, 1, 'hallSouth'],
      [7.4, 3.2, 7.4, 5.8, -1, 0, 'eastEntry'],
      [6.1, 5.8, 7.4, 5.8, 0, -1, 'entryNorth'],
      [6.1, 4.3, 6.1, 5.8, 1, 0, 'entryWest'],
      [3.3, 4.3, 6.1, 4.3, 0, -1, 'hallNorth'],
      [3.3, 4.3, 3.3, 6.8, -1, 0, 'kitchenEast'],
      [0, 6.8, 3.3, 6.8, 0, -1, 'kitchenNorth'],
      [0, 0, 0, 6.8, 1, 0, 'west'],
      [0, -1.5, 0, 0, 1, 0, 'balconyWest'],
      [3.8, -1.5, 3.8, 0, -1, 0, 'balconyEast'],
    ];
    this.wallBy = {};
    const wallM = mat(H.P.wall, { rough: 0.95 });
    for (const [x0, z0, x1, z1, nx, nz, name] of W) {
      const len = Math.hypot(x1 - x0, z1 - z0);
      const ux = (x1 - x0) / len, uz = (z1 - z0) / len;
      const rotY = -Math.atan2(uz, ux);
      const g = new THREE.Group(); // visible (cut-able)
      const decor = new THREE.Group();
      const holes = name === 'south' ? [[L.window.x0, L.window.x1, 0, L.window.top]] : [];
      // split into pieces around holes (positions along the wall)
      const pieces = [];
      let a = 0;
      for (const [h0, h1, y0, y1] of holes) {
        pieces.push([a, h0, 0, HGT]);
        pieces.push([h0, h1, y1, HGT]);
        if (y0 > 0) pieces.push([h0, h1, 0, y0]);
        a = h1;
      }
      pieces.push([a, len, 0, HGT]);
      for (const [p0, p1, y0, y1] of pieces) {
        if (p1 - p0 < 0.01) continue;
        const mid = (p0 + p1) / 2;
        const cx = x0 + ux * mid - nx * T / 2, cz = z0 + uz * mid - nz * T / 2;
        const vis = box(p1 - p0 + (holes.length ? 0 : T), y1 - y0, T, null, { m: wallM, cast: false });
        at(vis, cx, y0, cz, rotY); g.add(vis);
        const sh = shadowOnly(box(p1 - p0 + T, y1 - y0, T)); at(sh, cx, y0, cz, rotY); s.add(sh);
      }
      // baseboard
      const bb = box(len, 0.08, 0.02, H.P.base, { cast: false }); at(bb, x0 + ux * len / 2 + nx * 0.01, 0, z0 + uz * len / 2 + nz * 0.01, rotY);
      if (name !== 'south' && !name.startsWith('balcony')) g.add(bb);
      s.add(g, decor);
      // collision (outside the line)
      if (name !== 'south') {
        const minX = Math.min(x0, x1) - (nx > 0 ? T : 0), maxX = Math.max(x0, x1) + (nx < 0 ? T : 0);
        const minZ = Math.min(z0, z1) - (nz > 0 ? T : 0), maxZ = Math.max(z0, z1) + (nz < 0 ? T : 0);
        this.collider.addBox(minX, maxX, minZ, maxZ, 'wall');
      }
      const w = { g, decor, n: [nx, nz], scale: 1, name };
      this.walls.push(w); this.wallBy[name] = w;
    }
    // south wall collision: solid sides + an openable gate in the middle pane (the balcony door)
    const [d0, d1] = L.window.doorPane;
    this.collider.addBox(0, d0, -T, 0.02, 'wall');
    this.collider.addBox(d1, 3.8, -T, 0.02, 'wall');
    this.windowGate = this.collider.addBox(d0, d1, -T, 0.02, 'gate');
    // balcony railing
    this.collider.addBox(0, 3.8, -1.75, -1.42, 'rail');

    // TV-wall tile panels (west wall)
    const panelTex = canvasTexture(256, 256, (c) => { c.fillStyle = H.P.tvWall; c.fillRect(0, 0, 256, 256); c.strokeStyle = 'rgba(255,240,220,0.35)'; c.lineWidth = 3; c.strokeRect(2, 2, 252, 124); c.strokeRect(2, 130, 252, 124); for (let i = 0; i < 300; i++) { c.fillStyle = `rgba(90,70,50,${Math.random() * 0.08})`; c.fillRect(Math.random() * 256, Math.random() * 256, 3, 3); } });
    panelTex.wrapS = panelTex.wrapT = THREE.RepeatWrapping; panelTex.repeat.set(2, 2);
    const panel = box(2.1, HGT - 0.1, 0.03, null, { m: new THREE.MeshStandardMaterial({ map: panelTex, roughness: 0.7 }), cast: false });
    at(panel, 3.785, 0.08, F.tvStand.z, -PI / 2); this.wallBy.eastLiving.decor.add(panel);

    // decorative closed doors
    const addDoor = (wall, x, z, rot, color) => { const d = H.door(0.86, 2.05, color); at(d.group, x, 0, z, rot); this.wallBy[wall].decor.add(d.group); return d; };
    addDoor('hallSouth', 5.05, 3.23, 0);
    addDoor('hallSouth', 6.75, 3.23, 0);
    // sliding door to the bedroom (kitchen west wall)
    const sd = box(0.9, 2.05, 0.04, '#F1E4CF', { r: 0.01 }); at(sd, 0.03, 0, 5.6, PI / 2); this.wallBy.west.decor.add(sd);
    for (let i = 0; i < 3; i++) { const gl = box(0.6, 0.45, 0.01, '#FFF8EC', { opts: { emissive: '#FFE8C8', emissiveIntensity: 0.2 } }); at(gl, 0.055, 0.35 + i * 0.55, 5.6, PI / 2); this.wallBy.west.decor.add(gl); }
    // wall air conditioner (decor)
    const ac = H.wallAC(); at(ac, F.ac.x + 0.12, F.ac.y, F.ac.z, PI / 2); this.wallBy.west.decor.add(ac);
    // a framed print in the hall
    const frame = box(0.6, 0.45, 0.03, '#C48A52', { r: 0.01 }); at(frame, 5.9, 1.3, 4.28, PI); this.wallBy.hallNorth.decor.add(frame);
    const art = box(0.5, 0.35, 0.01, '#F2C9A4'); at(art, 5.9, 1.35, 4.26, PI); this.wallBy.hallNorth.decor.add(art);
    // small kitchen window (east wall)
    this.kWin = box(0.02, 0.6, 0.6, null, { m: new THREE.MeshBasicMaterial({ color: '#FFD9A0', toneMapped: false }), cast: false });
    at(this.kWin, 3.29, 1.15, 5.85); this.wallBy.kitchenEast.decor.add(this.kWin);
    const kwf = box(0.04, 0.68, 0.06, '#FBFAF6', { cast: false }); at(kwf, 3.28, 1.11, 5.52); this.wallBy.kitchenEast.decor.add(kwf);
    const kwf2 = kwf.clone(); kwf2.position.z = 6.18; this.wallBy.kitchenEast.decor.add(kwf2);
  }

  buildOutside() {
    const s = this.scene;
    this.sea = makeSea(900, 900, 46, 46); this.sea.mesh.position.y = SEA_Y; s.add(this.sea.mesh);
    const land = box(900, 0.6, 420, '#9DAF7E', { cast: false, opts: { rough: 1 } }); at(land, 0, SEA_Y, 170); s.add(land); this.land = land;
    const beach = box(900, 0.5, 14, '#E6CFA2', { cast: false }); at(beach, 0, SEA_Y + 0.05, -42); s.add(beach);
    const rnd = (i) => (Math.sin(i * 91.7) * 43758.5) % 1;
    for (let i = 0; i < 60; i++) {
      const x = -160 + Math.abs(rnd(i)) * 320, z = 6 + Math.abs(rnd(i + 99)) * 140;
      if (Math.abs(x - 3) < 14 && z < 20) continue;
      const tr = sphere(2.2 + Math.abs(rnd(i + 7)) * 2, i % 3 ? '#6F8F55' : '#7FA060', { w: 6, h: 4, cast: false }); tr.scale.y = 0.8; at(tr, x, SEA_Y + 2.2, z); s.add(tr);
    }
    this.coast = makeCoast(4, { count: 11, radius: [170, 320], y: SEA_Y }); s.add(this.coast.group);
    this.bay = makeBayLights(5, { count: 90, radius: [180, 300], y: SEA_Y + 2 }); s.add(this.bay.points);
    this.gulls = makeGulls(4, new THREE.Vector3(1.9, -2, -20), 12, 1); s.add(this.gulls.group);
    // sun glitter path on the sea
    const glit = new THREE.Mesh(new THREE.PlaneGeometry(40, 300), new THREE.MeshBasicMaterial({ map: glowTexture(), color: '#FFD9A0', transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    glit.rotation.x = -PI / 2; glit.position.set(-20, SEA_Y + 0.6, -150); s.add(glit); this.glitter = glit;
    // neighbor towers far to the sides
    for (const [x, z, h] of [[-70, -20, 70], [85, 10, 64]]) {
      const t = box(16, h, 13, '#EADCC6', { cast: false, opts: { rough: 1 } }); at(t, x, SEA_Y + 3, z); s.add(t);
    }
    // balcony railing (glass + rail)
    const b = L.balcony;
    const glass = box(b.x1 - b.x0, 1.0, 0.03, null, { m: new THREE.MeshStandardMaterial({ color: '#DDEFF0', transparent: true, opacity: 0.25, roughness: 0.1 }), cast: false });
    at(glass, (b.x0 + b.x1) / 2, 0.05, b.z0 + 0.08); s.add(glass);
    const rail = box(b.x1 - b.x0, 0.05, 0.08, '#B8B4AC', { opts: { metal: 0.5, rough: 0.35 } }); at(rail, (b.x0 + b.x1) / 2, 1.05, b.z0 + 0.08); s.add(rail);
    for (let i = 0; i <= 6; i++) { const p = box(0.04, 1.05, 0.04, '#B8B4AC', { opts: { metal: 0.5, rough: 0.35 } }); at(p, b.x0 + 0.05 + (i * (b.x1 - b.x0 - 0.1)) / 6, 0, b.z0 + 0.08); s.add(p); }
    // balcony ceiling (shadow proxy) — the flat above
    const bc = shadowOnly(box(4.1, 0.08, 1.7)); at(bc, 1.9, L.wallH, -0.75); s.add(bc);
    // balcony plant with a hidden note
    const bp = H.balconyPlant(); at(bp.group, F.balconyPlant.x, 0, F.balconyPlant.z, 0.6); s.add(bp.group);
    this.collider.addCircle(F.balconyPlant.x, F.balconyPlant.z, 0.22);
    this.inter.add({ id: 'balconyPlant', x: F.balconyPlant.x, z: F.balconyPlant.z, y: 0.5, reach: 1.1, discover: 'balcony_note',
      onUse: () => this.game.discover('balcony_note', bp.group.position.clone().setY(0.5)) });
    // sea-view spot at the railing
    this.inter.add({ id: 'railing', x: 2.1, z: -1.25, y: 1.0, reach: 1.0,
      onUse: () => this.lookOut(new THREE.Vector3(2.6, 1.6, -0.2)) });
  }

  buildWindowAndCurtains() {
    const s = this.scene, w = L.window, Hh = w.top;
    const frameM = mat('#FBF8F2', { rough: 0.5 });
    // frame + mullions (they cast pane-shaped shadows on the floor)
    const parts = [[w.x0, 0.06], [w.doorPane[0], 0.05], [w.doorPane[1], 0.05], [w.x1, 0.06]];
    for (const [x, t] of parts) { const m = box(t, Hh, 0.08, null, { m: frameM }); at(m, x, 0, -0.04); s.add(m); }
    const head = box(w.x1 - w.x0 + 0.06, 0.06, 0.1, null, { m: frameM }); at(head, (w.x0 + w.x1) / 2, Hh - 0.06, -0.04); s.add(head);
    const sill = box(w.x1 - w.x0 + 0.06, 0.04, 0.12, null, { m: frameM }); at(sill, (w.x0 + w.x1) / 2, 0, -0.04); s.add(sill);
    const tr = box(w.x1 - w.x0, 0.035, 0.05, null, { m: frameM }); at(tr, (w.x0 + w.x1) / 2, 1.6, -0.05); s.add(tr);
    // glass panes
    const glassM = new THREE.MeshStandardMaterial({ color: '#FFF1DE', transparent: true, opacity: 0.12, roughness: 0.05, depthWrite: false });
    const mkGlass = (x0, x1) => { const g = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0 - 0.04, Hh - 0.08), glassM); g.position.set((x0 + x1) / 2, Hh / 2, -0.06); s.add(g); return g; };
    mkGlass(w.x0, w.doorPane[0]); mkGlass(w.doorPane[1], w.x1);
    this.doorGlass = mkGlass(w.doorPane[0], w.doorPane[1]);
    this.doorGlass.position.z = -0.09;
    // warm overexposed glow in the window (fake bloom)
    this.windowGlow = new THREE.Mesh(new THREE.PlaneGeometry(w.x1 - w.x0 + 1.4, Hh + 1.0), new THREE.MeshBasicMaterial({ map: glowTexture(), color: '#FFE6BA', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    this.windowGlow.position.set((w.x0 + w.x1) / 2, Hh / 2, -0.12); s.add(this.windowGlow);

    // curtains: rod + mauve panels + sheer
    const rod = cyl(0.018, 0.018, 2.8, '#C9A06A', { seg: 6 }); rod.rotation.z = PI / 2; at(rod, 1.9 - 1.4, 2.3, 0.14); rod.position.x = 3.3; s.add(rod);
    const W0 = 1.36, CH = 2.24;
    const mk = (color, z, opts) => {
      const l = H.curtainPanel(W0, CH, color, opts), r = H.curtainPanel(W0, CH, color, opts);
      l.position.set(0.55, 2.28, z); r.position.set(3.25, 2.28, z); r.scale.x = -1;
      s.add(l, r); return [l, r];
    };
    this.sheer = mk(H.P.sheer, 0.08, { opacity: 0.55, emissive: '#FFE9CC' });
    this.curtains = mk(H.P.curtain, 0.14, {});
    this.inter.add({ id: 'curtains', x: 1.9, z: 0.55, y: 1.2, reach: 1.25, enabled: () => !this.state.curtainsOpen && !this.busyCurtains,
      onUse: () => this.openCurtains() });
  }

  setCurtains(t) {
    // t: 0 closed → 1 open
    const mauve = lerp(0.975, 0.24, t), sheer = lerp(1.0, 0.48, t);
    this.curtains[0].scale.x = mauve; this.curtains[1].scale.x = -mauve;
    this.sheer[0].scale.x = sheer; this.sheer[1].scale.x = -sheer;
    this.state.curtains = t;
  }

  buildLiving() {
    const s = this.scene, game = this.game;
    // rug
    const r = H.rug(F.rug.w, F.rug.d); at(r, F.rug.x, 0, F.rug.z); s.add(r);

    // sofa (west wall, facing the TV)
    const so = H.sofa(F.sofa.len); at(so.group, F.sofa.x, 0, F.sofa.z, PI / 2); s.add(so.group);
    this.sofa = so;
    this.collider.addBox(0, F.sofa.x + 0.43, F.sofa.z - F.sofa.len / 2, F.sofa.z + F.sofa.len / 2, 'sofa');
    const envelope = box(0.16, 0.01, 0.11, '#FFF6E6'); const pp = so.pillow.getWorldPosition(new THREE.Vector3());
    at(envelope, pp.x, 0.465, pp.z - 0.05); envelope.rotation.y = 0.3; s.add(envelope);
    this.inter.add({ id: 'sofa', x: F.sofa.x + 0.75, z: F.sofa.z + 0.25, y: 0.6, reach: 1.1, enabled: () => game.mom.pose !== 'sit',
      onUse: () => this.sitSofa() });
    this.inter.add({ id: 'cushion', x: pp.x, z: pp.z, y: 0.7, reach: 1.4, discover: 'sofa_note', enabled: () => game.mom.pose === 'sit' && this.sitting === 'sofa',
      onUse: () => this.liftCushion() });

    // palm (dragon charm hidden in the leaves)
    const pa = H.palm(); at(pa.group, F.palm.x, 0, F.palm.z); s.add(pa.group); this.palm = pa;
    this.collider.addCircle(F.palm.x, F.palm.z, 0.3);
    this.palmShake = 0;
    this.inter.add({ id: 'palm', x: F.palm.x, z: F.palm.z, y: 1.3, reach: 1.25, discover: 'palm_charm',
      onUse: async () => {
        game.audio.play('rustle'); this.palmShake = 1.2; game.mom.faceToward(F.palm.x, F.palm.z);
        if (this.disc.isFound('palm_charm')) return;
        game.say(content.bubbles.palm); await game.tweens.wait(0.9);
        await game.discover('palm_charm', new THREE.Vector3(F.palm.x, 1.2, F.palm.z));
      } });

    // side table + lamp
    const lamp = H.sideLamp(); at(lamp.group, F.lamp.x, 0, F.lamp.z); s.add(lamp.group); this.sideLamp = lamp;
    this.collider.addCircle(F.lamp.x, F.lamp.z, 0.22);

    // LF shopping bag
    const bag = H.lfBag(); at(bag.group, F.lfBag.x, 0, F.lfBag.z, 0.5); s.add(bag.group);
    this.collider.addCircle(F.lfBag.x, F.lfBag.z, 0.2);
    this.inter.add({ id: 'lfbag', x: F.lfBag.x, z: F.lfBag.z, y: 0.5, reach: 1.1, discover: 'lfbag_gift',
      onUse: async () => {
        game.audio.play('page');
        await game.tweens.add(0.5, (t) => { bag.tissue.position.y = 0.38 + Math.sin(t * PI) * 0.12; bag.tissue.rotation.y = t * 2; });
        await game.discover('lfbag_gift', new THREE.Vector3(F.lfBag.x, 0.6, F.lfBag.z));
      } });

    // TV stand + TV (east wall)
    const tv = H.tvStand(F.tvStand.len); at(tv.group, F.tvStand.x, 0, F.tvStand.z, -PI / 2); s.add(tv.group); this.tv = tv;
    this.collider.addBox(F.tvStand.x - 0.26, 3.8, F.tvStand.z - F.tvStand.len / 2 - 0.03, F.tvStand.z + F.tvStand.len / 2 + 0.03, 'tv');
    this.tvOn = false; this.tvIdx = 0; this.tvTimer = 0;
    this.tvCanvas = document.createElement('canvas'); this.tvCanvas.width = 320; this.tvCanvas.height = 180;
    this.tvTex = new THREE.CanvasTexture(this.tvCanvas); this.tvTex.colorSpace = THREE.SRGBColorSpace;
    this.tvImages = (content.photos || []).map((f) => { const im = new Image(); im.src = `${import.meta.env.BASE_URL}assets/${f}`; return im; });
    this.inter.add({ id: 'tv', x: 2.75, z: F.tvStand.z, y: 1.1, reach: 1.0, discover: 'tv_photos',
      onUse: async () => {
        game.audio.play('click'); this.setTv(true);
        await game.discover('tv_photos', new THREE.Vector3(3.4, 1.2, F.tvStand.z));
      } });
    const openDoor = (pivot, sign) => game.tweens.add(0.5, (t) => { pivot.rotation.y = sign * t * 1.6; });
    this.inter.add({ id: 'tvDoorL', x: 3.08, z: F.tvStand.z - 0.48, y: 0.4, hintY: 0.75, reach: 0.95, discover: 'tv_note1',
      onUse: async () => {
        if (tv.doorL.rotation.y === 0) { game.audio.play('click'); await openDoor(tv.doorL, -1); }
        await game.discover('tv_note1', new THREE.Vector3(3.3, 0.4, F.tvStand.z - 0.45));
      } });
    this.inter.add({ id: 'tvDoorR', x: 3.08, z: F.tvStand.z + 0.62, y: 0.4, hintY: 0.75, reach: 0.95, discover: 'tv_note2',
      onUse: async () => {
        if (tv.doorR.rotation.y === 0) { game.audio.play('click'); await openDoor(tv.doorR, 1); }
        await game.discover('tv_note2', new THREE.Vector3(3.3, 0.4, F.tvStand.z + 0.6));
      } });

    // phone cabinet + landline (rings softly the first time she comes near)
    const ph = H.phoneCabinet(); at(ph.group, F.phone.x, 0, F.phone.z, -PI / 2); s.add(ph.group); this.phone = ph;
    this.collider.addBox(F.phone.x - 0.22, 3.8, F.phone.z - 0.27, F.phone.z + 0.27, 'phone');
    this.inter.add({ id: 'phone', x: 3.08, z: F.phone.z, y: 0.85, reach: 0.95, discover: 'phone_voice',
      onUse: async () => {
        this.ring?.stop(); this.ring = null; this.ringing = false;
        game.audio.play('click');
        ph.handset.position.y = 0.95;
        await game.discover('phone_voice', new THREE.Vector3(3.5, 0.9, F.phone.z));
        ph.handset.position.y = 0.79; game.audio.play('click');
      } });

    // succulent stool (water → flowers bloom → gift underneath)
    const st = H.succulentStool(); at(st.group, F.stool.x, 0, F.stool.z); s.add(st.group); this.stool = st;
    this.collider.addCircle(F.stool.x, F.stool.z, 0.22);
    this.inter.add({ id: 'stool', x: F.stool.x - 0.15, z: F.stool.z + 0.05, y: 0.6, reach: 1.0, discover: 'stool_gift',
      onUse: async () => {
        game.mom.faceToward(F.stool.x, F.stool.z); game.mom.play('reach', 1.6);
        st.can.visible = true; game.audio.play('water');
        await game.tweens.add(1.4, (t) => { st.can.rotation.z = -Math.sin(t * PI) * 0.7; });
        st.can.visible = false;
        game.say(content.bubbles.stool);
        await game.tweens.add(0.8, (t) => st.flowers.forEach((f, i) => f.scale.setScalar(Math.max(0.001, ease.back(Math.min(1, t * 1.3 - i * 0.15))))));
        if (!this.disc.isFound('stool_gift')) { await game.tweens.wait(0.4); await game.discover('stool_gift', new THREE.Vector3(F.stool.x, 0.2, F.stool.z)); }
      } });

    // intercom (hall side)
    const ic = H.intercom(); at(ic.group, F.intercom.x, F.intercom.y, F.intercom.z + 0.02, 0); this.wallBy.hallSouth.decor.add(ic.group);
    this.inter.add({ id: 'intercom', x: F.intercom.x, z: F.intercom.z + 0.45, y: 1.4, reach: 0.95, discover: 'intercom_voice',
      onUse: async () => { game.audio.play('dingdong'); await game.tweens.wait(1.0); await game.discover('intercom_voice', new THREE.Vector3(F.intercom.x, 1.4, F.intercom.z + 0.1)); } });

    // Memory Shelf
    this.shelf = new MemoryShelf(this.disc, { x: F.shelf.x, z: F.shelf.z, facing: PI / 2 });
    s.add(this.shelf.group);
    this.collider.addBox(0, 0.34, F.shelf.z - 0.52, F.shelf.z + 0.52, 'shelf');
    this.inter.add({ id: 'shelf', x: 0.62, z: F.shelf.z, y: 1.2, hintY: 2.05, reach: 1.0,
      onUse: () => { game.audio.play('page'); game.overlay.shelfCard(this.disc.listFound(), (id) => this.disc.open(id)); } });
  }

  setTv(on) {
    this.tvOn = on;
    this.tv.screen.material = on ? new THREE.MeshBasicMaterial({ map: this.tvTex, toneMapped: false }) : this.tv.screen.material;
    this.drawTv();
  }
  drawTv() {
    const c = this.tvCanvas.getContext('2d'), W = 320, Hh = 180;
    const im = this.tvImages[this.tvIdx % Math.max(1, this.tvImages.length)];
    if (im && im.complete && im.naturalWidth) {
      const r = Math.max(W / im.naturalWidth, Hh / im.naturalHeight);
      const w = im.naturalWidth * r, h = im.naturalHeight * r;
      c.drawImage(im, (W - w) / 2, (Hh - h) / 2, w, h);
    } else {
      const g = c.createLinearGradient(0, 0, W, Hh); g.addColorStop(0, '#F7C9A0'); g.addColorStop(1, '#D58FA0');
      c.fillStyle = g; c.fillRect(0, 0, W, Hh);
      c.fillStyle = 'rgba(255,255,255,0.9)'; c.font = '700 30px "Gowun Batang", serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(content.tvIdleText || '', W / 2, Hh / 2 - 8);
      c.font = '20px "Gowun Batang", serif'; c.fillText(['♡', '♡ ♡', '♡ ♡ ♡'][this.tvIdx % 3], W / 2, Hh / 2 + 30);
    }
    this.tvTex.needsUpdate = true;
  }

  buildKitchen() {
    const s = this.scene, game = this.game;
    // tall grey wood-grain panel above the fridges
    const top = box(1.85, L.wallH - 1.88, 0.72, H.P.panel, { r: 0.01, cast: false }); at(top, 0.95, 1.88, 6.44); s.add(top);

    this.kitchenBack = [top];
    const df = H.darkFridge(); at(df.group, F.darkFridge.x, 0, F.darkFridge.z, PI); s.add(df.group);
    const sf = H.silverFridge(); at(sf.group, F.silverFridge.x, 0, F.silverFridge.z, PI); s.add(sf.group); this.fridge = sf;
    this.collider.addBox(0, 1.86, 6.06, 6.8, 'fridges');
    this.kitchenBack.push(df.group, sf.group);
    this.inter.add({ id: 'darkFridge', x: F.darkFridge.x, z: 5.95, y: 1.3, reach: 0.95, discover: 'fridge_photo',
      onUse: () => game.discover('fridge_photo', new THREE.Vector3(F.darkFridge.x + 0.12, 1.3, 6.05)) });

    // silver fridge: open → light the candle → blow it out
    this.cakeStep = 0;
    this.inter.add({ id: 'silverFridge', x: F.silverFridge.x, z: 5.95, y: 1.1, reach: 0.95, discover: 'fridge_cake',
      onUse: async () => {
        const step = this.cakeStep;
        if (step === 0) {
          game.audio.play('door'); sf.cake.visible = true;
          await game.tweens.add(0.7, (t) => { sf.door.rotation.y = t * 1.75; sf.light.intensity = t * 1.6; });
          this.cakeStep = 1;
        } else if (step === 1) {
          game.audio.play('flame'); game.mom.play('reach', 0.7);
          sf.flameCore.visible = true;
          await game.tweens.add(0.6, (t) => { sf.flame.material.opacity = t * 0.9; sf.candleLight.intensity = t * 1.2; });
          game.say('후~ 불어볼까?', 1800);
          this.cakeStep = 2;
        } else if (step === 2) {
          game.audio.play('whoosh');
          await game.tweens.add(0.45, (t) => { sf.flame.material.opacity = (1 - t) * 0.9; sf.candleLight.intensity = (1 - t) * 1.2; sf.flame.scale.setScalar(0.12 * (1 + t)); });
          sf.flameCore.visible = false; sf.flame.scale.setScalar(0.12);
          this.cakeStep = 3;
          await game.discover('fridge_cake', sf.cake.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 0.2, 0)));
        } else {
          const open = sf.door.rotation.y > 0.5;
          game.audio.play('door');
          sf.cake.visible = true;
          await game.tweens.add(0.6, (t) => { sf.door.rotation.y = open ? (1 - t) * 1.75 : t * 1.75; sf.light.intensity = open ? (1 - t) * 1.6 : t * 1.6; });
          sf.cake.visible = sf.door.rotation.y > 0.1;
        }
      } });

    // counter run along the north wall (rotated so the front faces the room)
    const cx = (F.counter.x0 + F.counter.x1) / 2, clen = F.counter.x1 - F.counter.x0;
    const cr = H.counterRun(clen); at(cr.group, cx, 0, 6.8 - 0.31, PI); s.add(cr.group); this.counter = cr;
    this.collider.addBox(F.counter.x0, 3.3, 6.17, 6.8, 'counter');
    this.kitchenBack.push(cr.group);
    const toWorld = (lx) => cx - lx; // rotation PI mirrors local x
    const potX = toWorld(cr.hobX - 0.12), sinkX = toWorld(cr.sinkX), hobX = toWorld(cr.hobX);
    this.steam = [];
    for (let i = 0; i < 8; i++) { const st = glowSprite('#FFFFFF', 0.25, 0); st.position.set(potX, 1.1, 6.57); s.add(st); this.steam.push({ s: st, t: i / 8 }); }
    this.steamOn = 0;
    this.inter.add({ id: 'pot', x: potX, z: 6.2, y: 1.0, reach: 0.9, discover: 'soup_gift',
      onUse: async () => {
        game.audio.play('lid');
        const up = cr.lid.position.y < 0.2;
        await game.tweens.add(0.5, (t) => { const u = up ? t : 1 - t; cr.lid.position.y = 0.15 + u * 0.18; cr.lid.position.x = u * 0.12; cr.lid.rotation.z = -u * 0.6; });
        this.steamOn = up ? 1 : 0;
        if (up && !this.disc.isFound('soup_gift')) { await game.tweens.wait(0.7); await game.discover('soup_gift', new THREE.Vector3(potX, 1.15, 6.57)); }
      } });
    this.inter.add({ id: 'whale', x: hobX + 0.3, z: 6.2, y: 1.25, reach: 0.85, discover: 'whale_note',
      onUse: async () => {
        this.state.whale = !this.state.whale; game.audio.play('click');
        if (this.state.whale) { game.say(content.bubbles.whale); if (!this.disc.isFound('whale_note')) { await game.tweens.wait(1.6); await game.discover('whale_note', new THREE.Vector3(hobX, 1.25, 6.75)); } }
      } });
    this.inter.add({ id: 'sink', x: sinkX, z: 6.2, y: 1.0, reach: 0.85, discover: 'sink_note',
      onUse: async () => {
        game.audio.play('dish'); game.mom.play('reach', 1.4);
        await game.tweens.add(1.3, (t) => { const p = cr.plates[3]; p.rotation.z = Math.sin(t * PI * 3) * 0.2; });
        if (!this.disc.isFound('sink_note')) await game.discover('sink_note', new THREE.Vector3(sinkX, 1.0, 6.5));
      } });

    // side counter along the east wall (tissue box, clock, flower jar)
    const sc = H.sideCounter(F.sideCounter.z1 - F.sideCounter.z0); at(sc, F.sideCounter.x, 0, (F.sideCounter.z0 + F.sideCounter.z1) / 2, -PI / 2); s.add(sc);
    this.collider.addBox(2.71, 3.3, F.sideCounter.z0, F.sideCounter.z1, 'sidecounter');
    this.kitchenBack.push(sc);
    const tb = H.tissueBox(); at(tb.group, 3.02, 0.88, 5.58, -PI / 2 + 0.15); s.add(tb.group);
    this.inter.add({ id: 'tissue', x: 3.0, z: 5.58, y: 1.0, reach: 0.95, discover: 'tissue_note',
      onUse: async () => {
        game.audio.play('page'); tb.note.visible = true;
        await game.tweens.add(0.6, (t) => { tb.tissue.position.y = 0.12 + Math.sin(t * PI * 0.5) * 0.12; });
        await game.discover('tissue_note', new THREE.Vector3(3.0, 1.15, 5.58));
        tb.tissue.position.y = 0.12; tb.note.visible = false;
      } });
    const clk = H.digitalClock(); at(clk.group, 3.05, 0.88, 5.84, -PI / 2 - 0.2); s.add(clk.group); this.clock = clk;
    this.inter.add({ id: 'clock', x: 3.0, z: 5.84, y: 1.0, reach: 0.95, discover: 'clock_note',
      onUse: async () => { game.audio.play('beep'); this.drawClock(true); await game.tweens.wait(0.6); await game.discover('clock_note', new THREE.Vector3(3.0, 1.1, 5.84)); } });
    const fj = H.flowerJar(); at(fj.group, 3.0, 0.88, 6.06); s.add(fj.group); this.flowers = fj;
    this.flowerSway = 0;
    this.inter.add({ id: 'flowers', x: 2.95, z: 6.06, y: 1.2, reach: 0.95, discover: 'flower_note',
      onUse: async () => { this.flowerSway = 1.5; game.audio.play('rustle'); game.say('음~ 향기 좋다.', 1800); await game.tweens.wait(1.0); await game.discover('flower_note', new THREE.Vector3(3.0, 1.3, 6.06)); } });
    // hand sanitizer
    const san = cyl(0.03, 0.035, 0.14, '#E8F2F0', { seg: 8 }); at(san, 3.1, 0.88, 5.42); s.add(san);
    this.kitchenBack.push(tb.group, clk.group, fj.group, san);

    // dining table + chairs
    const tbl = H.diningTable(); at(tbl.group, F.table.x, 0, F.table.z); s.add(tbl.group); this.table = tbl;
    this.collider.addRect(F.table.x, F.table.z, 1.25, 0.72, 'table');
    this.chairs = F.chairs.map((c) => { const ch = H.chair(); at(ch, c.x, 0, c.z, c.r); s.add(ch); this.collider.addCircle(c.x, c.z, 0.24); return ch; });
    const bowlW = tbl.bowl.getWorldPosition(new THREE.Vector3());
    this.inter.add({ id: 'persimmon', x: bowlW.x, z: bowlW.z, y: 0.95, reach: 1.15, discover: 'persimmon_gift',
      onUse: async () => {
        const p = tbl.persimmons[3];
        if (p.visible) {
          game.mom.play('reach', 0.8);
          await game.tweens.add(0.6, (t) => { p.position.y = 0.12 + Math.sin(t * PI) * 0.25; });
          p.visible = false;
        }
        game.say(content.bubbles.persimmon, 3000);
        if (!this.disc.isFound('persimmon_gift')) { await game.tweens.wait(1.6); await game.discover('persimmon_gift', bowlW.clone().setY(1.0)); }
      } });
    const mangoW = tbl.mango.getWorldPosition(new THREE.Vector3());
    this.inter.add({ id: 'mango', x: mangoW.x, z: mangoW.z, y: 0.9, reach: 1.1, discover: 'mango_gift',
      onUse: async () => {
        const sl = tbl.slices.find((x) => x.visible);
        game.mom.play('reach', 0.7);
        if (sl) { await game.tweens.wait(0.4); sl.visible = false; }
        game.say(content.bubbles.mango);
        if (!this.disc.isFound('mango_gift')) { await game.tweens.wait(1.0); await game.discover('mango_gift', mangoW.clone().setY(1.0)); }
      } });
    // sit at the table (south chair)
    const sc2 = F.chairs[1];
    this.inter.add({ id: 'chair', x: sc2.x, z: sc2.z - 0.3, y: 0.6, reach: 0.8, enabled: () => game.mom.pose !== 'sit',
      onUse: async () => {
        game.mom.sit(sc2.x, sc2.z + 0.02, 0, 0.47); this.sitting = 'chair';
        game.cam.targetDistance = 5.8;
        await game.tweens.wait(0.8); game.mom.play('reach', 0.8); await game.tweens.wait(0.6);
        game.say(content.bubbles.chairEat);
      } });

    // teal fan
    const fn = H.fan(); at(fn.group, F.fan.x, 0, F.fan.z, -2.4); s.add(fn.group); this.fan = fn;
    this.collider.addCircle(F.fan.x, F.fan.z, 0.18);
    this.inter.add({ id: 'fan', x: F.fan.x, z: F.fan.z, y: 0.9, reach: 0.95,
      onUse: () => { this.state.fan = !this.state.fan; game.audio.play('click'); if (this.state.fan) game.say(content.bubbles.fan); } });

    this.drawClock();
  }

  clockText() {
    const mins = 19 * 60 + 24 + Math.floor(this.state.sunset * 52);
    const h = Math.floor(mins / 60) - 12, m = mins % 60;
    return `${h}:${String(m).padStart(2, '0')}`;
  }
  drawClock() { const t = this.clockText(); if (t !== this._clk) { this._clk = t; this.clock.draw(t); } }

  buildEntry() {
    const s = this.scene, game = this.game;
    // front door
    const d = H.door(0.9, 2.05, '#E7D8C0'); at(d.group, L.entry.doorX, 0, 5.77, PI); s.add(d.group); this.frontDoor = d;
    const mat2 = box(0.8, 0.012, 0.5, '#B98A7A', { r: 0.01, cast: false }); at(mat2, L.entry.doorX, -0.07, 5.45); s.add(mat2);
    // shoe cabinet + key tray
    const sc = H.shoeCabinet(F.shoeCabinet.len); at(sc, F.shoeCabinet.x, 0, F.shoeCabinet.z, -PI / 2); s.add(sc);
    this.collider.addBox(F.shoeCabinet.x - 0.18, 7.4, F.shoeCabinet.z - F.shoeCabinet.len / 2, F.shoeCabinet.z + F.shoeCabinet.len / 2, 'shoecab');
    const kt = H.keyTray(); at(kt.group, F.keyTray.x, 0.97, F.keyTray.z, -PI / 2); s.add(kt.group); this.keyTray = kt;
    // black rubber shoes on the floor + slippers (shown while Mom wears the shoes)
    this.floorShoes = H.pairOfShoes(() => rubberShoe(content.mom.shoes)); at(this.floorShoes, F.shoes.x, -0.07, F.shoes.z, PI); this.floorShoes.scale.setScalar(1.15); s.add(this.floorShoes);
    this.floorSlippers = H.pairOfShoes(() => slipper(content.mom.slippers)); at(this.floorSlippers, F.shoes.x + 0.05, -0.04, F.shoes.z - 0.5, 0); s.add(this.floorSlippers);
    this.floorSlippers.visible = false;

    this.inter.add({ id: 'door', x: L.entry.doorX, z: 5.5, y: 1.3, reach: 0.85, onUse: () => this.useDoor() });
    if (content.features.mall) {
      this.inter.add({ id: 'key', x: F.keyTray.x, z: F.keyTray.z, y: 1.05, reach: 1.0,
        onUse: async () => {
          game.audio.play('coin'); game.mom.play('reach', 0.7);
          await game.tweens.add(0.4, (t) => { kt.key.position.y = 0.03 + t * 0.15; });
          game.say(content.bubbles.carKey, 2000);
          await game.tweens.wait(1.2);
          kt.key.position.y = 0.03;
          this.leaveHome('mall');
        } });
    } else kt.key.visible = false;
    if (content.features.past) {
      this.inter.add({ id: 'shoes', x: F.shoes.x, z: F.shoes.z, y: 0.2, hintY: 0.6, reach: 0.9,
        onUse: async () => {
          game.say(content.bubbles.shoes, 2400); game.mom.faceToward(F.shoes.x, F.shoes.z);
          await game.tweens.wait(1.6);
          this.leaveHome('past');
        } });
    } else this.floorShoes.visible = true;
  }

  buildLightFx() {
    const s = this.scene;
    // soft light shafts (two crossed additive planes each)
    const shaftTex = canvasTexture(64, 256, (c) => {
      const g = c.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(0.6, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g; c.fillRect(0, 0, 64, 256);
      const h = c.createLinearGradient(0, 0, 64, 0); h.addColorStop(0, 'rgba(0,0,0,1)'); h.addColorStop(0.5, 'rgba(0,0,0,0)'); h.addColorStop(1, 'rgba(0,0,0,1)');
      c.globalCompositeOperation = 'destination-out'; c.fillStyle = h; c.fillRect(0, 0, 64, 256);
    });
    this.shaftMat = new THREE.MeshBasicMaterial({ map: shaftTex, color: '#FFD9A0', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
    const geo = new THREE.PlaneGeometry(0.55, 5.5); geo.translate(0, -2.75, 0);
    this.shafts = [];
    for (const x of [1.0, 1.6, 2.2, 2.75]) {
      const g = new THREE.Group(); g.position.set(x, 1.55, -0.05);
      const a = new THREE.Mesh(geo, this.shaftMat), b = new THREE.Mesh(geo, this.shaftMat); b.rotation.y = PI / 2;
      g.add(a, b); s.add(g); this.shafts.push(g);
    }
    // dust motes
    const N = 70, pos = new Float32Array(N * 3);
    this.motes = [];
    for (let i = 0; i < N; i++) { const m = { x: 0.8 + Math.random() * 2.4, y: 0.2 + Math.random() * 1.9, z: 0.2 + Math.random() * 2.6, p: Math.random() * 10 }; this.motes.push(m); }
    const mg = new THREE.BufferGeometry(); mg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.moteMat = new THREE.PointsMaterial({ color: '#FFE7B8', size: 0.035, map: glowTexture(), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
    this.motePts = new THREE.Points(mg, this.moteMat); s.add(this.motePts);
  }

  // ───────────────────────────────────────────────────────────
  applySunset() {
    const s = this.state.sunset, open = this.state.curtains;
    const el = lerp(0.6, 0.06, Math.pow(s, 0.9)), az = PI + lerp(0.28, 0.62, s);
    this.rig.aim(this.focus, el, az, 30);
    const dir = this._sd || (this._sd = new THREE.Vector3());
    dir.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).normalize();
    const pal = this.sky.set(s, dir);
    this.rig.sun.color.copy(pal.sun);
    this.rig.sun.intensity = lerp(3.6, 2.2, s) * (s > 0.85 ? 1 - (s - 0.85) * 4 : 1);
    this.rig.hemi.intensity = lerp(0.8, 1.15, open) * lerp(1.0, 0.62, s);
    this.rig.hemi.color.set('#FFE6C4').lerp(pal.hor, 0.25);
    this.scene.fog.color.copy(pal.hor);
    for (const l of this.lamps) l.p.intensity = (l.base + l.add * THREE.MathUtils.smoothstep(s, 0.2, 0.95)) * (open < 0.5 ? 1.25 : 1);
    this.sideLamp.shade.material.emissiveIntensity = 0.5 + s * 1.2;
    this.sideLamp.halo.material.opacity = 0.25 + s * 0.4;
    this.sea.mesh.material.color.copy(pal.sea);
    this.coast.mat.color.copy(pal.hill);
    this.bay.mat.opacity = THREE.MathUtils.smoothstep(s, 0.55, 0.95);
    this.glitter.material.color.copy(pal.sun); this.glitter.material.opacity = 0.4 * (1 - THREE.MathUtils.smoothstep(s, 0.85, 1));
    this.glitter.position.x = Math.sin(az) * 150; this.glitter.rotation.z = -(az - PI);
    // window glow + shafts follow the sun
    this.windowGlow.material.color.copy(pal.sun).lerp(new THREE.Color('#FFFFFF'), 0.35);
    this.windowGlow.material.opacity = (0.12 + open * 0.38 * (1 - s * 0.4)) * (this.game.cam.override ? 0.25 : 1);
    this.shaftMat.color.copy(pal.sun);
    const travel = dir.clone().negate();
    for (const g of this.shafts) g.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), travel);
    this.kWin.material.color.copy(pal.hor).lerp(pal.top, 0.3);
    // curtain fabric glows a bit from behind
    for (const c of this.curtains) c.material.emissive.copy(pal.sun).multiplyScalar(0.05 * (1 - open));
    this.renderer && (this.renderer.toneMappingExposure = lerp(1.1, 1.0, s));
  }

  // ───────────────────────────────────────────────────────────
  enter(from) {
    const g = this.game, mom = g.mom;
    this.state.visits++;
    mom.setForm('adult'); mom.setFootwear('slippers'); mom.showBag = false; mom.setBagCount(-1);
    this.floorShoes.visible = true; this.floorSlippers.visible = false;
    this.frontDoor.leaf.rotation.y = 0;
    g.audio.setLoops(this.loopKeys());
    if (!from) { mom.position.set(1.9, 0, 2.7); mom.face(PI, true); return; }
    // coming back in through the front door
    mom.position.set(6.7, 0, 4.85); mom.face(PI * 1.0, true);
    setTimeout(() => g.say(from === 'past' ? '…꿈이었나?' : '다녀왔습니다~'), 1200);
  }

  loopKeys() { const k = ['bgm_home']; if (this.state.curtainsOpen) k.push('waves', 'gulls'); if (this.game.mom.position.z < -0.1) k.push('wind'); return k; }

  exit() { this.ring?.stop(); this.ring = null; this.game.mom.stand(); this.sitting = null; }

  cameraYawFor(p, cur) {
    const k = cur > 1 ? 1 : 0; // hysteresis
    const inKitchen = p.x < 3.45 && p.z > (k ? 4.4 : 4.8);
    const inEntry = p.x > (k ? 5.9 : 6.15) && p.z > (k ? 4.25 : 4.45);
    return inKitchen || inEntry ? PI : 0;
  }

  // in the living room the camera leans toward the room center so side furniture never blocks Mom
  cameraFocus(p) {
    const f = this._focus || (this._focus = new THREE.Vector3());
    f.copy(p);
    if (p.x < 3.8 && p.z < 4.3 && p.z > -0.2) f.x = lerp(p.x, 1.9, 0.65);
    return f;
  }

  surfaceAt(x, z) { return x > 6.1 && z > 4.3 ? 'tile' : z < 0 ? 'tile' : 'wood'; }

  async sitSofa() {
    const g = this.game;
    g.mom.sit(F.sofa.x + 0.07, F.sofa.z + 0.15, PI / 2, 0.46); this.sitting = 'sofa';
    g.cam.targetDistance = 6.0; g.cam.targetPitch = THREE.MathUtils.degToRad(25);
    g.audio.play('sigh');
    this.state.sunset = Math.min(1, this.state.sunset + 0.04);
    await g.tweens.wait(0.9);
    g.say(content.bubbles.sofa);
  }

  async liftCushion() {
    const g = this.game, p = this.sofa.pillow;
    g.mom.play('reach', 0.8);
    await g.tweens.add(0.5, (t) => { p.position.y = 0.42 + t * 0.25; p.rotation.x = -t * 0.8; });
    await g.discover('sofa_note', p.getWorldPosition(new THREE.Vector3()));
    await g.tweens.add(0.5, (t) => { p.position.y = 0.67 - t * 0.25; p.rotation.x = -(1 - t) * 0.8; });
  }

  standUp() {
    const g = this.game;
    if (this.sitting === 'sofa') g.mom.position.set(F.sofa.x + 0.95, 0, F.sofa.z + 0.15);
    if (this.sitting === 'chair') g.mom.position.set(F.chairs[1].x, 0, F.chairs[1].z - 0.5);
    this.sitting = null; g.mom.stand();
    g.cam.targetDistance = this.cameraDistance; g.cam.targetPitch = PITCH;
  }

  async openCurtains() {
    const g = this.game;
    this.busyCurtains = true; g.busy = true;
    g.mom.faceToward(1.9, 0); g.mom.play('reach', 1.4);
    g.audio.play('curtain');
    await g.tweens.add(3.0, (t) => this.setCurtains(t), ease.inOut);
    this.state.curtainsOpen = true; this.windowGate.enabled = false;
    this.state.sunset = Math.min(1, this.state.sunset + 0.15);
    g.audio.setLoops(this.loopKeys(), 3);
    // slide the balcony door pane open
    g.tweens.add(1.2, (t) => { this.doorGlass.position.x = lerp(1.9, 1.2, t); });
    // emotional peak: the camera drops to her eye level and looks out to sea
    await this.lookOut(new THREE.Vector3(2.75, 1.62, 3.3), 6.5, content.bubbles.curtains);
    this.busyCurtains = false; g.busy = false;
  }

  async lookOut(eye, hold = 0, bubble) {
    const g = this.game;
    g.busy = true;
    g.cam.override = { pos: eye, look: new THREE.Vector3(eye.x - 14, -5, -60) };
    g.mom.faceToward(eye.x - 0.5, -5);
    await g.tweens.wait(1.6);
    g.say(bubble || content.bubbles.balcony, 3200);
    if (hold) await g.tweens.wait(hold);
    else await g.waitForKey(8);
    g.cam.override = null;
    await g.tweens.wait(1.0);
    g.busy = false;
  }

  async useDoor() {
    const g = this.game;
    const early = this.state.sunset < 0.6 && this.state.elapsed < content.doorAlwaysAfterMin * 60;
    if (early) { g.say(content.bubbles.doorEarly, 2800); return; }
    this.leaveHome('beach');
  }

  async leaveHome(where) {
    const g = this.game;
    g.busy = true;
    this.floorShoes.visible = false; this.floorSlippers.visible = true;
    g.mom.setFootwear('shoes');
    if (where === 'beach') {
      g.audio.play('door');
      await g.tweens.add(0.9, (t) => { this.frontDoor.leaf.rotation.y = -t * 1.3; });
      g.mom.faceToward(L.entry.doorX, 6.5);
      g.goTo('beach', { color: '#FFE2B0', ms: 1800 });
    } else if (where === 'mall') g.goTo('mall', { color: '#000', ms: 1200, cinematic: () => g.playCinematic(makeDrive(g)) });
    else g.goTo('past', { color: '#FFFFFF', ms: 2000 });
  }

  // ───────────────────────────────────────────────────────────
  update(dt) {
    const g = this.game, st = this.state;
    this.time += dt;
    st.elapsed += dt;
    st.sunset = Math.min(1, st.sunset + dt / (content.sunsetMinutes * 60));
    this.applySunset();

    // stand up from the sofa/chair when she tries to walk
    if (g.mom.pose === 'sit' && g.moveIntent && !g.busy) this.standUp();

    // camera cutaway: walls between the camera and the room shrink to a low stub
    const yaw = g.cam.yaw, dx = -Math.sin(yaw), dz = -Math.cos(yaw);
    for (const w of this.walls) {
      const extra = (yaw > 1.5 ? CUT_ALSO_KITCHEN : CUT_ALSO_LIVING).includes(w.name);
      const cut = extra || w.n[0] * dx + w.n[1] * dz > 0.45;
      const target = cut ? 0.1 : 1;
      w.scale += (target - w.scale) * (1 - Math.exp(-dt * 6));
      w.g.scale.y = w.scale; w.g.visible = w.scale > 0.02;
      w.decor.visible = w.scale > 0.6;
    }

    const showBack = yaw > PI / 2;
    for (const o of this.kitchenBack) o.visible = showBack;

    // palm sway (+ shake when rustled)
    this.palmShake = Math.max(0, this.palmShake - dt);
    const breeze = this.state.fan ? 1.6 : 1;
    this.palm.fronds.forEach((f, i) => { f.rotation.z = Math.sin(this.time * 1.3 + i) * 0.03 * breeze + Math.sin(this.time * 22 + i) * 0.12 * this.palmShake; });
    // curtains breathe a little (their shadows drift in the light patch)
    const sway = (this.state.fan ? 0.06 : 0.025);
    [...this.curtains, ...this.sheer].forEach((c, i) => { c.rotation.x = -Math.abs(Math.sin(this.time * 0.7 + i)) * sway * (i > 1 ? 1.6 : 1); });
    // flowers
    this.flowerSway = Math.max(0, this.flowerSway - dt * 0.8);
    this.flowers.flowers.rotation.z = Math.sin(this.time * 2.2) * (0.02 * breeze + this.flowerSway * 0.12);
    this.flowers.flowers.rotation.x = Math.sin(this.time * 1.7) * (0.015 * breeze + this.flowerSway * 0.08);
    // fan
    if (this.state.fan) { this.fan.blades.rotation.z += dt * 18; this.fan.head.rotation.y = Math.sin(this.time * 0.6) * 0.6; }
    // steam from the soup
    for (const p of this.steam) {
      p.t = (p.t + dt * 0.45) % 1;
      p.s.position.y = 1.08 + p.t * 0.7; p.s.position.x += Math.sin(this.time * 2 + p.t * 9) * 0.0015;
      p.s.material.opacity = this.steamOn * Math.sin(p.t * PI) * 0.35; p.s.scale.setScalar(0.15 + p.t * 0.35);
    }
    // whale
    const wh = this.counter;
    this.whalePhase = (this.whalePhase || 0) + dt * (this.state.whale ? 0.6 : 0.08);
    if ((this._whaleT = (this._whaleT || 0) + dt) > 1 / 20) {
      this._whaleT = 0; H.drawWhale(wh.whaleCanvas.getContext('2d'), this.whalePhase, this.state.whale ? 1 : 0.35); wh.whaleT.needsUpdate = true;
    }
    wh.whale.material.opacity = this.state.whale ? 1 : 0.5;
    wh.hoodLight.intensity = this.state.whale ? 1.5 : 0.4;
    // candle flicker
    if (this.cakeStep === 2) { const f = 0.85 + Math.sin(this.time * 31) * 0.08 + Math.sin(this.time * 17) * 0.07; this.fridge.flame.scale.setScalar(0.12 * f); this.fridge.candleLight.intensity = 1.2 * f; }
    // light shafts breathe, dust motes drift
    const open = st.curtains;
    this.shaftMat.opacity = (0.05 + 0.03 * Math.sin(this.time * 0.8)) * open * (1 - st.sunset * 0.5) + 0.012;
    this.moteMat.opacity = 0.75 * open * (1 - st.sunset * 0.6);
    const arr = this.motePts.geometry.attributes.position.array;
    this.motes.forEach((m, i) => {
      m.y += Math.sin(this.time * 0.3 + m.p) * dt * 0.05 + dt * 0.012; m.x += Math.cos(this.time * 0.2 + m.p * 2) * dt * 0.04;
      if (m.y > 2.2) m.y = 0.2;
      arr[i * 3] = m.x; arr[i * 3 + 1] = m.y; arr[i * 3 + 2] = m.z;
    });
    this.motePts.geometry.attributes.position.needsUpdate = true;
    // TV slideshow
    if (this.tvOn) { this.tvTimer += dt; if (this.tvTimer > 3.5) { this.tvTimer = 0; this.tvIdx++; this.drawTv(); } }
    // phone rings softly the first time she comes near
    const p = g.mom.position;
    if (!st.phoneRang && !this.disc.isFound('phone_voice') && Math.hypot(p.x - 3.3, p.z - F.phone.z) < 2.3) {
      st.phoneRang = true; this.ringing = true; this.ring = g.audio.ring(); g.say(content.bubbles.phoneRing);
      setTimeout(() => { this.ring?.stop(); this.ring = null; this.ringing = false; }, 11000);
    }
    if (this.ringing) this.phone.handset.position.y = 0.79 + Math.max(0, Math.sin(this.time * 40)) * 0.006 * (Math.sin(this.time * 2.4) > 0 ? 1 : 0);
    this.drawClock();
    this.shelf.update(dt);
    // balcony wind
    const onBalcony = p.z < -0.1;
    if (onBalcony !== this._onBalcony) { this._onBalcony = onBalcony; g.audio.setLoops(this.loopKeys(), 1.5); }
    // sea + sky
    if ((this._seaT = (this._seaT || 0) + dt) > 1 / 30) { this._seaT = 0; this.sea.update(this.time, 0.5, 0.25); }
    this.gulls.update(this.time);
    this.sky.mesh.position.copy(g.cam.camera.position);
  }
}
