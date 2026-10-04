import * as THREE from 'three';

// Cheap warm rig: hemisphere + one shadow-casting sun. Worlds add a few point lamps.
export function createRig(scene, { shadowSize = 2048, extent = 9, hemiSky = '#FFE6C4', hemiGround = '#C9A27A', hemi = 1.25 } = {}) {
  const hemiLight = new THREE.HemisphereLight(hemiSky, hemiGround, hemi);
  scene.add(hemiLight);

  const sun = new THREE.DirectionalLight('#FFD9A0', 3.2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(shadowSize, shadowSize);
  const c = sun.shadow.camera;
  c.left = -extent; c.right = extent; c.top = extent; c.bottom = -extent; c.near = 0.5; c.far = 80;
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.03;
  sun.shadow.radius = 3;
  scene.add(sun, sun.target);

  return {
    hemi: hemiLight, sun,
    // aim the sun from spherical angles (radians) around a focus point
    aim(focus, elevation, azimuth, dist = 30) {
      sun.position.set(
        focus.x + Math.sin(azimuth) * Math.cos(elevation) * dist,
        focus.y + Math.sin(elevation) * dist,
        focus.z + Math.cos(azimuth) * Math.cos(elevation) * dist,
      );
      sun.target.position.copy(focus);
      sun.target.updateMatrixWorld();
    },
  };
}

// Sunset ramp from the plan: #FFD9A0 → #FF9A62 → #C75A7A → #4B3A6B → #1B1B3A
const RAMP = ['#FFD9A0', '#FF9A62', '#C75A7A', '#4B3A6B', '#1B1B3A'].map((c) => new THREE.Color(c));
export function sunsetColor(t, out = new THREE.Color()) {
  t = THREE.MathUtils.clamp(t, 0, 1) * (RAMP.length - 1);
  const i = Math.min(Math.floor(t), RAMP.length - 2);
  return out.copy(RAMP[i]).lerp(RAMP[i + 1], t - i);
}
