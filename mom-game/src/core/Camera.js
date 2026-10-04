import * as THREE from 'three';

// Fixed three-quarter "dollhouse" camera. It never rotates under player control.
// A world may request a different yaw for a zone (e.g. the kitchen); the camera
// then swings smoothly and the movement basis is latched until keys are released.

export const PITCH = THREE.MathUtils.degToRad(28);

export class FollowCamera {
  constructor() {
    this.camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 600);
    this.target = new THREE.Vector3();
    this.yaw = 0; this.targetYaw = 0;
    this.distance = 11; this.targetDistance = 11;
    this.pitch = PITCH; this.targetPitch = PITCH;
    this.lift = 0; this.targetLift = 0;      // extra look-at height
    this.override = null;                    // cinematic: { pos, look }
    this.overrideBlend = 0;
    this._pos = new THREE.Vector3(); this._look = new THREE.Vector3();
    addEventListener('resize', () => this.resize());
  }

  resize() { this.camera.aspect = innerWidth / innerHeight; this.camera.updateProjectionMatrix(); }

  setDefaults({ distance = 11, yaw = 0, pitch = PITCH } = {}) {
    this.distance = this.targetDistance = distance;
    this.yaw = this.targetYaw = yaw;
    this.pitch = this.targetPitch = pitch;
    this.lift = this.targetLift = 0;
    this.override = null; this.overrideBlend = 0;
  }

  snap(focus) { this.target.copy(focus); this.yaw = this.targetYaw; this.update(0, focus, true); }

  // screen-space basis on the floor plane for a given yaw
  static basis(yaw) {
    // camera sits at +Z (rotated by yaw) looking toward -Z
    const fwd = { x: -Math.sin(yaw), z: -Math.cos(yaw) };
    const right = { x: Math.cos(yaw), z: -Math.sin(yaw) };
    return { fwd, right };
  }

  update(dt, focus, instant = false) {
    const k = instant ? 1 : 1 - Math.exp(-dt * 4);
    this.target.lerp(focus, k);
    // shortest-path yaw
    let dy = this.targetYaw - this.yaw;
    dy = Math.atan2(Math.sin(dy), Math.cos(dy));
    this.yaw += dy * (instant ? 1 : 1 - Math.exp(-dt * 2.6));
    const k2 = instant ? 1 : 1 - Math.exp(-dt * 2.2);
    this.distance += (this.targetDistance - this.distance) * k2;
    this.pitch += (this.targetPitch - this.pitch) * k2;
    this.lift += (this.targetLift - this.lift) * k2;

    const horiz = Math.cos(this.pitch) * this.distance;
    this._look.set(this.target.x, this.target.y + 0.95 + this.lift, this.target.z);
    this._pos.set(
      this._look.x + Math.sin(this.yaw) * horiz,
      this._look.y + Math.sin(this.pitch) * this.distance,
      this._look.z + Math.cos(this.yaw) * horiz,
    );

    const ob = this.override ? 1 : 0;
    this.overrideBlend += (ob - this.overrideBlend) * (instant ? 1 : 1 - Math.exp(-dt * 1.6));
    if (this.overrideBlend > 0.001 && (this.override || this._lastOverride)) {
      const o = this.override || this._lastOverride;
      this._lastOverride = o;
      const t = this.overrideBlend * this.overrideBlend * (3 - 2 * this.overrideBlend);
      this._pos.lerp(o.pos, t); this._look.lerp(o.look, t);
    }
    this.camera.position.copy(this._pos);
    this.camera.lookAt(this._look);
  }

  get swinging() {
    const d = Math.atan2(Math.sin(this.targetYaw - this.yaw), Math.cos(this.targetYaw - this.yaw));
    return Math.abs(d) > 0.05;
  }
}
