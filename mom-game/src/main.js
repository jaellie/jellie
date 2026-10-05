import * as THREE from 'three';
import '@fontsource/gowun-batang/400.css';
import '@fontsource/gowun-batang/700.css';
import '@fontsource/nanum-pen-script/400.css';
import './style.css';

import { content } from './content.js';
import { createRenderer } from './core/Renderer.js';
import { Input } from './core/Input.js';
import { FollowCamera, PITCH } from './core/Camera.js';
import { Tweens } from './core/Tween.js';
import { AudioManager } from './systems/AudioManager.js';
import { Overlay } from './systems/Overlay.js';
import { Discoverables } from './systems/Discoverables.js';
import { Mom } from './entities/Mom.js';
import { glowSprite, starTexture } from './models/kit.js';
import { Home } from './worlds/Home.js';
import { Beach } from './worlds/Beach.js';
import { Mall } from './worlds/Mall.js';
import { Past } from './worlds/Past.js';

const params = new URLSearchParams(location.search);
const MAX_DT = params.has('test') ? 0.3 : 0.05; // headless tests run at a few fps
const WORLDS = { home: Home, beach: Beach, mall: Mall, past: Past };

class Game {
  constructor() {
    this.renderer = createRenderer(document.getElementById('app'));
    this.input = new Input();
    this.cam = new FollowCamera();
    this.audio = new AudioManager();
    this.overlay = new Overlay(this.audio);
    this.disc = new Discoverables(this.overlay, this.audio);
    this.tweens = new Tweens();
    this.mom = new Mom();
    this.mom.onStep = () => this.onStep();
    this.chase = (content.camera ?? 'chase') === 'chase';
    this.cam.setMode(this.chase ? 'chase' : 'fixed');
    this.mom.tank = this.chase; // W forward, S back, A/D turn
    this.worlds = {};
    this.busy = false; this.acting = false; this.moveIntent = false;
    this.latchedYaw = 0; this.lastMove = { x: 0, y: 0 };
    this.bursts = [];
    this.cinematic = null;
    this.lastT = performance.now();
    this._v = new THREE.Vector3();
    addEventListener('resize', () => this.renderer.setSize(innerWidth, innerHeight));
    if (params.has('debug')) this.debug();
  }

  getWorld(name) {
    if (!this.worlds[name]) { const w = new WORLDS[name](this); w.build(); this.worlds[name] = w; }
    return this.worlds[name];
  }

  setWorld(w, from) {
    if (this.world) (this.world.root || this.world.scene).remove(this.mom.root);
    this.world = w;
    (w.root || w.scene).add(this.mom.root);
    this.mom.vel.set(0, 0); this.mom.stand();
    w.enter(from);
    w.home = this.worlds.home;
    this.renderer.toneMappingExposure = w.exposure ?? 1.1;
    this.cam.setDefaults({ distance: w.cameraDistance, pitch: w.cameraPitch ?? PITCH });
    this.cam.targetYaw = this.cam.yaw = w.cameraYawFor(this.mom.position, 0);
    this.latchedYaw = this.cam.targetYaw;
    this.cam.snap(this.toWorld(w.cameraFocus?.(this.mom.position) ?? this.mom.position));
    if (this.chase) this.updateCamera(0, true);
    document.body.classList.toggle('past', w.name === 'past');
  }

  async start() {
    try { await Promise.race([Promise.all(['20px "Griun Mongtori"', '400 20px "Gowun Batang"', '700 20px "Gowun Batang"', '20px "Nanum Pen Script"'].map((f) => document.fonts.load(f, '엄마'))), new Promise((r) => setTimeout(r, 2500))]); } catch {}
    const startWorld = WORLDS[params.get('world')] ? params.get('world') : 'home';
    const home = this.getWorld('home');
    if (params.has('sunset')) home.state.sunset = +params.get('sunset');
    this.setWorld(this.getWorld(startWorld), null);
    this.renderer.setAnimationLoop(() => this.tick());
    await this.overlay.startScreen();
    this.audio.init().then(() => this.audio.setLoops(this.audio.desired || []));
    // the little letter at the top fills in as she finds things
    const prog = (celebrate) => { const p = this.disc.progress(); this.overlay.setLetterProgress(p.found, p.total, celebrate); };
    prog(false);
    this.disc.onFound(() => prog(true));
    setTimeout(() => this.overlay.showLetterMeter(true), 1800);
    await this.overlay.fade(0, { ms: 2200 });
  }

  async goTo(name, { color = '#000', ms = 1200, cinematic } = {}) {
    if (this.transitioning) return;
    this.transitioning = true; this.busy = true;
    await this.overlay.fade(1, { color, ms });
    const from = this.world.name;
    this.world.exit?.();
    this.tweens.clear();
    const next = this.getWorld(name);
    if (cinematic) {
      this.cam.override = null;
      const done = cinematic();            // starts rendering the cinematic scene right away
      await this.overlay.fade(0, { color, ms: 900 });
      await done;
      await this.overlay.fade(1, { color, ms: 700 });
      this.cinematic = null;
    }
    this.setWorld(next, from);
    await this.overlay.fade(0, { color, ms: ms * 1.2 });
    this.busy = false; this.transitioning = false;
  }

  // play a separate little scene (e.g. the drive to LF Square) under the same loop
  playCinematic(c) { return new Promise((res) => { this.cinematic = { ...c, t: 0, done: res }; }); }

  say(text, ms) { this.overlay.say(text, ms); }

  async discover(id, pos) {
    if (pos) this.burst(pos);
    this.audio.play('sparkle');
    this.mom.play('reach', 0.7);
    await this.tweens.wait(0.45);
    return this.disc.discover(id);
  }

  burst(pos) {
    const s = glowSprite('#FFE7B0', 0.2, 1, starTexture());
    s.position.copy(pos); const parent = this.world.root || this.world.scene; parent.add(s);
    this.bursts.push({ s, t: 0, scene: parent });
  }

  waitForKey(maxSec = 8) {
    return new Promise((res) => {
      const t = setTimeout(() => { this._keyWaiter = null; res(); }, maxSec * 1000);
      this._keyWaiter = () => { clearTimeout(t); this._keyWaiter = null; res(); };
    });
  }

  onStep() {
    const p = this.mom.position, surf = this.world.surfaceAt?.(p.x, p.z) ?? 'wood';
    const shoes = this.mom.footwear === 'shoes' || this.mom.form === 'child';
    if (shoes && (surf === 'sand' || surf === 'dirt')) { this.audio.play('squeak'); this.audio.play(surf === 'sand' ? 'sand' : 'step'); }
    else if (surf === 'tile') this.audio.play('step');
    else this.audio.play('stepSoft');
  }

  async use(it) {
    this.acting = true;
    try { await it.onUse(this); } catch (e) { console.error(e); }
    this.acting = false;
  }

  tick() {
    const now = performance.now(), real = (now - this.lastT) / 1000; this.lastT = now;
    const dt = Math.min(MAX_DT, real);
    const input = this.input, ov = this.overlay;

    if (this.cinematic) {
      const c = this.cinematic; c.t += dt; c.update(dt, c.t);
      input.consumeInteract(); input.consumeAnyKey();
      this.renderer.render(c.scene, c.camera);
      return;
    }

    let move = { x: 0, z: 0 };
    const interact = input.consumeInteract();
    const key = input.consumeAnyKey();
    const mv = input.getMove();
    this.moveIntent = mv.x !== 0 || mv.y !== 0;

    if (ov.isOpen) {
      if (interact) ov.key('interact');
      const map = { Escape: 'close', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down' };
      if (key && map[key]) ov.key(map[key]);
      this.moveIntent = false;
    } else if (this._keyWaiter && (interact || (key && key !== 'Escape'))) {
      this._keyWaiter();
    } else if (!this.busy && !this.acting && !this.cam.override) {
      // movement in screen space, latched to the camera yaw from when the keys went down
      const active = this.moveIntent;
      if (!active) this.latchedYaw = this.cam.targetYaw;
      else if (!this.cam.swinging && this.latchedYaw !== this.cam.targetYaw) {
        const a0 = Math.atan2(this.lastMove.y, this.lastMove.x), a1 = Math.atan2(mv.y, mv.x);
        if (Math.abs(Math.atan2(Math.sin(a1 - a0), Math.cos(a1 - a0))) > 0.5) this.latchedYaw = this.cam.targetYaw;
      }
      if (active && this.chase) {
        // A/D turn her, W walks forward, S steps back
        const turn = -mv.x * 2.3 * dt * (this.world.mirrorX ? -1 : 1);
        this.mom.heading += turn; this.mom.targetHeading = this.mom.heading;
        const f = mv.y >= 0 ? mv.y : mv.y * 0.55;
        move = { x: Math.sin(this.mom.heading) * f, z: Math.cos(this.mom.heading) * f };
      } else if (active) {
        const { fwd, right } = FollowCamera.basis(this.latchedYaw);
        move = { x: right.x * mv.x + fwd.x * mv.y, z: right.z * mv.x + fwd.z * mv.y };
        if (this.world.mirrorX) move.x = -move.x; // screen → plan coordinates
        this.lastMove = mv;
      }
      if (interact && this.world.inter.current) this.use(this.world.inter.current);
    }
    if (this.busy || this.acting) this.moveIntent = this.moveIntent && this.mom.pose === 'sit';

    this.tweens.update(dt);
    this.mom.update(dt, move, this.world.collider);
    this.world.update(dt);
    this.world.inter.hideSparkles = !!this.cam.override;
    const cur = this.world.inter.update(dt, this.mom);
    this.updateCamera(dt);

    // UI anchors
    const showHint = cur && !this.busy && !this.acting && !ov.isOpen && !this.cam.override;
    if (showHint) { const p = this.project(cur.hintPos); ov.showHint(p.x, p.y); } else ov.showHint(null);
    const head = this._v.copy(this.mom.position); head.y += this.mom.form === 'child' ? 1.45 : 1.95;
    if (this.mom.pose === 'sit') head.y -= 0.4;
    const hp = this.project(head); ov.placeBubble(hp.x, hp.y);

    for (let i = this.bursts.length - 1; i >= 0; i--) {
      const b = this.bursts[i]; b.t += dt;
      const u = b.t / 0.9;
      b.s.scale.setScalar(0.2 + u * 1.4); b.s.material.opacity = 1 - u; b.s.position.y += dt * 0.4;
      if (u >= 1) { b.scene.remove(b.s); this.bursts.splice(i, 1); }
    }

    this.renderer.render(this.world.scene, this.cam.camera);
    if (this.fps) this.fps.frame(real);
  }

  updateCamera(dt, instant = false) {
    if (!this.chase) {
      this.cam.targetYaw = this.world.cameraYawFor(this.mom.position, this.cam.targetYaw);
      this.cam.update(dt, this.toWorld(this.world.cameraFocus?.(this.mom.position) ?? this.mom.position), instant);
      return;
    }
    const m = this.mom, child = m.form === 'child';
    const want = child ? 2.0 : 2.3;
    const dist = this.cameraRoom(m.position, m.heading, want);
    const hw = this.world.mirrorX ? -m.heading : m.heading;
    this.cam.updateChase(dt, this.toWorld(m.position, this._cf || (this._cf = new THREE.Vector3())), hw, dist, child ? 1.3 : 1.75, instant);
  }

  // how far behind Mom the camera can sit before a wall gets in the way (plan coordinates)
  cameraRoom(p, heading, want) {
    const dx = -Math.sin(heading), dz = -Math.cos(heading);
    let best = want + 0.3;
    for (const b of this.world.collider.boxes) {
      if (!b.enabled || b.tag !== 'wall') continue;
      let t0 = 0, t1 = best;
      for (const [o, d, lo, hi] of [[p.x, dx, b.minX, b.maxX], [p.z, dz, b.minZ, b.maxZ]]) {
        if (Math.abs(d) < 1e-6) { if (o < lo || o > hi) { t0 = Infinity; break; } continue; }
        let a = (lo - o) / d, c = (hi - o) / d; if (a > c) [a, c] = [c, a];
        t0 = Math.max(t0, a); t1 = Math.min(t1, c);
      }
      if (t0 <= t1 && t0 > 0.05 && t0 < best) best = t0;
    }
    return Math.max(0.45, Math.min(want, best - 0.28));
  }

  project(v) {
    const p = this._p || (this._p = new THREE.Vector3());
    p.copy(v); if (this.world?.mirrorX) p.x = -p.x;
    p.project(this.cam.camera);
    return { x: (p.x * 0.5 + 0.5) * innerWidth, y: (-p.y * 0.5 + 0.5) * innerHeight };
  }

  // plan coordinates → rendered world (mirrored worlds flip x)
  toWorld(v, out = this._tw || (this._tw = new THREE.Vector3())) {
    out.copy(v); if (this.world?.mirrorX) out.x = -out.x; return out;
  }

  debug() {
    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;left:6px;top:6px;z-index:99;font:12px monospace;color:#fff;background:#0008;padding:3px 6px;pointer-events:none';
    document.body.appendChild(el);
    let acc = 0, n = 0;
    this.fps = { frame: (dt) => { acc += dt; n++; if (acc > 0.5) { const r = this.renderer.info.render; el.textContent = `${(n / acc).toFixed(0)} fps · ${r.calls} calls · ${(r.triangles / 1000).toFixed(0)}k tris · ${this.world?.name}`; acc = 0; n = 0; } } };
    window.__game = this;
  }
}

const game = new Game();
window.__game = window.__game || (params.has('test') ? game : undefined);
game.start();
export { content };
