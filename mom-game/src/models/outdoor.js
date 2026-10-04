import * as THREE from 'three';
import { mat, cone, box, cyl, sphere, at, group, glowTexture, canvasTexture, seeded } from './kit.js';

// Sky palette keyed by the sunset value s (0 = golden afternoon, 1 = deep dusk).
const KEYS = [
  { s: 0.0, top: '#9DBFD8', hor: '#FFE3B8', sun: '#FFE2A8', sea: '#4F8EA4', hill: '#6C8A68' },
  { s: 0.35, top: '#A7B3CF', hor: '#FFC98E', sun: '#FFC27A', sea: '#5B88A0', hill: '#6E7D62' },
  { s: 0.6, top: '#8E7FAF', hor: '#FF9A62', sun: '#FF8A4C', sea: '#7A6E90', hill: '#5F5A60' },
  { s: 0.8, top: '#5A4A80', hor: '#E9747A', sun: '#FF6E5A', sea: '#594E77', hill: '#45405A' },
  { s: 1.0, top: '#1B1B3A', hor: '#5E3E6E', sun: '#C75A7A', sea: '#232643', hill: '#24223A' },
].map((k) => ({ s: k.s, top: new THREE.Color(k.top), hor: new THREE.Color(k.hor), sun: new THREE.Color(k.sun), sea: new THREE.Color(k.sea), hill: new THREE.Color(k.hill) }));

export function skyPalette(s, out = {}) {
  s = THREE.MathUtils.clamp(s, 0, 1);
  let i = 0; while (i < KEYS.length - 2 && s > KEYS[i + 1].s) i++;
  const a = KEYS[i], b = KEYS[i + 1], t = (s - a.s) / (b.s - a.s);
  for (const k of ['top', 'hor', 'sun', 'sea', 'hill']) (out[k] ||= new THREE.Color()).copy(a[k]).lerp(b[k], t);
  return out;
}

export function makeSky(radius = 420) {
  const uniforms = {
    top: { value: new THREE.Color() }, hor: { value: new THREE.Color() }, sunCol: { value: new THREE.Color() },
    sunDir: { value: new THREE.Vector3(0, 0.2, -1).normalize() }, stars: { value: 0 }, horY: { value: -0.12 },
  };
  const m = new THREE.ShaderMaterial({
    uniforms, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position.z = gl_Position.w; }`,
    fragmentShader: `
      uniform vec3 top, hor, sunCol, sunDir; uniform float stars, horY; varying vec3 vDir;
      float hash(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,45.164))) * 43758.5453); }
      void main(){
        vec3 d = normalize(vDir);
        float h = clamp((d.y - horY) / (1.0 - horY), 0.0, 1.0);
        vec3 col = mix(hor, top, pow(h, 0.55));
        float sd = max(dot(d, normalize(sunDir)), 0.0);
        col += sunCol * (pow(sd, 6.0) * 0.45 + pow(sd, 60.0) * 0.6);
        col = mix(col, sunCol * 1.6 + 0.4, smoothstep(0.9993, 0.9997, sd));
        if (stars > 0.0) {
          vec3 q = floor(d * 260.0);
          float s = step(0.9975, hash(q)) * smoothstep(0.05, 0.4, d.y);
          col += vec3(1.0, 0.95, 0.85) * s * stars * (0.5 + 0.5 * hash(q + 3.0));
        }
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 16), m);
  mesh.renderOrder = -10; mesh.frustumCulled = false;
  const pal = {};
  return {
    mesh, uniforms,
    set(s, sunDir) {
      skyPalette(s, pal);
      uniforms.top.value.copy(pal.top); uniforms.hor.value.copy(pal.hor); uniforms.sunCol.value.copy(pal.sun);
      if (sunDir) uniforms.sunDir.value.copy(sunDir);
      uniforms.stars.value = THREE.MathUtils.smoothstep(s, 0.72, 1.0);
      return pal;
    },
  };
}

// Low-poly faceted sea: a grid whose heights are updated with a few sines.
export function makeSea(w, d, segW, segD, color = '#4F8EA4') {
  const geo = new THREE.PlaneGeometry(w, d, segW, segD).rotateX(-Math.PI / 2).toNonIndexed();
  const m = new THREE.MeshStandardMaterial({ color, roughness: 0.32, metalness: 0.15, flatShading: true });
  const mesh = new THREE.Mesh(geo, m);
  mesh.receiveShadow = true;
  const pos = geo.attributes.position;
  const base = Float32Array.from(pos.array);
  return {
    mesh,
    update(t, amp = 0.25, scale = 1) {
      for (let i = 0; i < pos.count; i++) {
        const x = base[i * 3], z = base[i * 3 + 2];
        pos.array[i * 3 + 1] = amp * (Math.sin(x * 0.35 * scale + t * 0.9) * 0.6 + Math.sin(z * 0.5 * scale - t * 1.2) * 0.5 + Math.sin((x + z) * 0.8 * scale + t * 1.7) * 0.25);
      }
      pos.needsUpdate = true; geo.computeVertexNormals();
    },
  };
}

// Distant islands / headlands (Yeosu bay feel)
export function makeCoast(seed = 3, { count = 9, radius = [140, 260], y = 0, spread = Math.PI * 0.9, center = Math.PI, scale = 1 } = {}) {
  const rnd = seeded(seed);
  const g = new THREE.Group();
  const hillMat = new THREE.MeshStandardMaterial({ color: '#6C8A68', flatShading: true, roughness: 1 });
  for (let i = 0; i < count; i++) {
    const a = center + (rnd() - 0.5) * spread;
    const r = radius[0] + rnd() * (radius[1] - radius[0]);
    const h = (10 + rnd() * 26) * scale, w = (30 + rnd() * 50) * scale;
    const hill = new THREE.Mesh(new THREE.ConeGeometry(w, h, 6 + Math.floor(rnd() * 3), 1), hillMat);
    hill.scale.z = 0.5 + rnd() * 0.5; hill.position.set(Math.sin(a) * r, y + h / 2 - 2, Math.cos(a) * r); hill.rotation.y = rnd() * 3;
    g.add(hill);
  }
  return { group: g, mat: hillMat };
}

// Twinkly town lights along the far shore — fade in at dusk
export function makeBayLights(seed = 5, { count = 70, radius = [150, 230], y = 2, spread = Math.PI * 0.8, center = Math.PI } = {}) {
  const rnd = seeded(seed);
  const pts = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const a = center + (rnd() - 0.5) * spread, r = radius[0] + rnd() * (radius[1] - radius[0]);
    pts.set([Math.sin(a) * r, y + rnd() * 4, Math.cos(a) * r], i * 3);
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pts, 3));
  const m = new THREE.PointsMaterial({ color: '#FFD08A', size: 2.2, map: glowTexture(), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
  return { points: new THREE.Points(geo, m), mat: m };
}

export function makeGulls(n = 4, center = new THREE.Vector3(), r = 14, y = 6) {
  const g = new THREE.Group();
  const birds = [];
  const wing = new THREE.BufferGeometry();
  wing.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, -0.5, 0.1, -0.15, -0.5, 0.1, 0.1, 0, 0, 0, 0.5, 0.1, -0.15, 0.5, 0.1, 0.1], 3));
  wing.computeVertexNormals();
  const m = new THREE.MeshBasicMaterial({ color: '#FFF8EE', side: THREE.DoubleSide, fog: false });
  for (let i = 0; i < n; i++) {
    const b = new THREE.Group();
    const l = new THREE.Mesh(wing, m); b.add(l);
    b.userData = { a: (i / n) * Math.PI * 2, r: r * (0.7 + 0.15 * i), y: y + i * 1.2, sp: 0.12 + i * 0.03, l };
    g.add(b); birds.push(b);
  }
  g.position.copy(center);
  return {
    group: g,
    update(t) {
      for (const b of birds) {
        const u = b.userData; const a = u.a + t * u.sp;
        b.position.set(Math.cos(a) * u.r, u.y + Math.sin(t * 0.7 + u.a) * 0.6, Math.sin(a) * u.r);
        b.rotation.y = -a; b.scale.set(1, 1 + Math.sin(t * 6 + u.a * 3) * 0.6, 1);
      }
    },
  };
}

// Thin crescent moon (lunar 27th — a waning crescent, never a full moon)
export function makeMoon() {
  const tex = canvasTexture(128, 128, (c) => {
    const g = c.createRadialGradient(64, 64, 20, 64, 64, 64); g.addColorStop(0, 'rgba(255,240,200,0.25)'); g.addColorStop(1, 'rgba(255,240,200,0)');
    c.fillStyle = g; c.fillRect(0, 0, 128, 128);
    c.fillStyle = '#FFF4D6'; c.beginPath(); c.arc(64, 64, 26, 0, Math.PI * 2); c.fill();
    c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.arc(76, 58, 25, 0, Math.PI * 2); c.fill();
  });
  const m = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false, fog: false });
  const s = new THREE.Sprite(m); s.scale.setScalar(26);
  return s;
}

// Distant apartment towers (simple, warm)
export function makeTowers(seed = 9, positions = []) {
  const rnd = seeded(seed);
  const g = new THREE.Group();
  for (const [x, z, h] of positions) {
    const t = box(14 + rnd() * 6, h, 12, '#E9DCC8', { opts: { rough: 1 }, cast: false }); at(t, x, -60, z); g.add(t);
    const roof = box(15 + rnd() * 6, 1.2, 13, '#B9A58C', { cast: false }); at(roof, x, -60 + h, z); g.add(roof);
  }
  return g;
}

export { glowTexture };
