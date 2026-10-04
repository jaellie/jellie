import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

// Shared low-poly kit: cached geometries/materials so the scene stays cheap.

const matCache = new Map();
export function mat(color, { rough = 0.82, metal = 0, flat = true, emissive, emissiveIntensity = 1, transparent = false, opacity = 1, side, key = '' } = {}) {
  if (color == null) color = '#ffffff';
  const k = [color, rough, metal, flat, emissive, emissiveIntensity, transparent, opacity, side, key].join('|');
  let m = matCache.get(k);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, flatShading: flat, transparent, opacity });
    if (emissive) { m.emissive = new THREE.Color(emissive); m.emissiveIntensity = emissiveIntensity; }
    if (side !== undefined) m.side = side;
    matCache.set(k, m);
  }
  return m;
}
// a material you intend to animate (never shared)
export function uniqueMat(color, opts = {}) { return mat(color, { ...opts, key: Math.random() }); }

const geoCache = new Map();
function cachedGeo(key, make) {
  let g = geoCache.get(key);
  if (!g) { g = make(); geoCache.set(key, g); }
  return g;
}

function finish(mesh, { cast = true, receive = true } = {}) {
  mesh.castShadow = cast; mesh.receiveShadow = receive; return mesh;
}

// Box whose origin is at the bottom-center (easy to set on a floor).
export function box(w, h, d, color, { r = 0, opts, cast, receive, m } = {}) {
  const key = `box${w}|${h}|${d}|${r}`;
  const geo = cachedGeo(key, () => {
    const g = r > 0 ? new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2, h / 2, d / 2)) : new THREE.BoxGeometry(w, h, d);
    g.translate(0, h / 2, 0); return g;
  });
  return finish(new THREE.Mesh(geo, m || mat(color, opts)), { cast, receive });
}

export function cyl(rTop, rBot, h, color, { seg = 10, opts, cast, receive, m, open = false } = {}) {
  const geo = cachedGeo(`cyl${rTop}|${rBot}|${h}|${seg}|${open}`, () => {
    const g = new THREE.CylinderGeometry(rTop, rBot, h, seg, 1, open); g.translate(0, h / 2, 0); return g;
  });
  return finish(new THREE.Mesh(geo, m || mat(color, opts)), { cast, receive });
}

export function sphere(r, color, { w = 10, h = 8, opts, cast, receive, m } = {}) {
  const geo = cachedGeo(`sph${r}|${w}|${h}`, () => new THREE.SphereGeometry(r, w, h));
  return finish(new THREE.Mesh(geo, m || mat(color, opts)), { cast, receive });
}

export function capsule(r, len, color, { opts, cast, receive, m, seg = 8 } = {}) {
  const geo = cachedGeo(`cap${r}|${len}|${seg}`, () => new THREE.CapsuleGeometry(r, len, 3, seg));
  return finish(new THREE.Mesh(geo, m || mat(color, opts)), { cast, receive });
}

export function cone(r, h, color, { seg = 7, opts, cast, receive, m } = {}) {
  const geo = cachedGeo(`cone${r}|${h}|${seg}`, () => { const g = new THREE.ConeGeometry(r, h, seg); g.translate(0, h / 2, 0); return g; });
  return finish(new THREE.Mesh(geo, m || mat(color, opts)), { cast, receive });
}

export function plane(w, h, color, { opts, m, cast = false, receive = true } = {}) {
  const geo = cachedGeo(`pl${w}|${h}`, () => new THREE.PlaneGeometry(w, h));
  return finish(new THREE.Mesh(geo, m || mat(color, opts)), { cast, receive });
}

export function at(obj, x = 0, y = 0, z = 0, ry = 0) { obj.position.set(x, y, z); obj.rotation.y = ry; return obj; }

export function group(...children) { const g = new THREE.Group(); children.forEach((c) => c && g.add(c)); return g; }

// ── textures ────────────────────────────────────────────────
export function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

let _glow;
export function glowTexture() {
  if (_glow) return _glow;
  _glow = canvasTexture(64, 64, (g, w) => {
    const grd = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(0.35, 'rgba(255,255,255,0.45)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd; g.fillRect(0, 0, w, w);
  });
  return _glow;
}

let _star;
export function starTexture() {
  if (_star) return _star;
  _star = canvasTexture(64, 64, (g, w) => {
    const c = w / 2;
    const grd = g.createRadialGradient(c, c, 0, c, c, c);
    grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(0.15, 'rgba(255,240,200,0.6)'); grd.addColorStop(1, 'rgba(255,220,160,0)');
    g.fillStyle = grd; g.fillRect(0, 0, w, w);
    g.fillStyle = 'rgba(255,255,255,0.9)';
    g.beginPath(); g.moveTo(c, 2); g.lineTo(c + 3, c); g.lineTo(c, w - 2); g.lineTo(c - 3, c); g.fill();
    g.beginPath(); g.moveTo(2, c); g.lineTo(c, c - 3); g.lineTo(w - 2, c); g.lineTo(c, c + 3); g.fill();
  });
  return _star;
}

export function glowSprite(color = '#FFE2A8', size = 1, opacity = 0.6, tex = glowTexture()) {
  const m = new THREE.SpriteMaterial({ map: tex, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false });
  const s = new THREE.Sprite(m); s.scale.setScalar(size); return s;
}

// Text sign texture in our own font
export function textTexture(text, { w = 512, h = 128, font = '"Gowun Batang", serif', size = 64, color = '#3A2E28', bg = null, weight = 700 } = {}) {
  return canvasTexture(w, h, (g) => {
    if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); }
    g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle';
    let s = size;
    do { g.font = `${weight} ${s}px ${font}`; s -= 2; } while (g.measureText(text).width > w * 0.9 && s > 10);
    g.fillText(text, w / 2, h / 2 + 2);
  });
}

// An invisible mesh that only casts shadows (ceilings, full-height wall proxies).
const shadowOnlyMat = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });
export function shadowOnly(mesh) { mesh.material = shadowOnlyMat; mesh.castShadow = true; mesh.receiveShadow = false; return mesh; }

export function randRange(a, b, rnd = Math.random) { return a + (b - a) * rnd(); }
export function seeded(seed = 1) { return () => ((seed = (seed * 16807) % 2147483647) / 2147483647); }
