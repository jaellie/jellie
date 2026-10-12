/* Fixed-scene walking (Mode B).
   The road keeps the forward-facing composition, but every roadside object is placed once at a fixed
   position and size inside a precomposed scene. Nothing is scaled, zoomed or moved toward the camera.
   The character walks in place; after a set time the next scene crossfades in.
   Mode A keeps the original behaviour (objects spawn far away and grow as they approach) for comparison. */
(function (root) {
  var F = root.Flat, TAU = Math.PI * 2;
  if (!F || F.walk) return; /* the page loader may run this file twice */

  /* ---- configuration: change these to tune the walk ---- */
  var CONFIG = {
    segmentSeconds: 10, /* how long one scene stays before the next one starts to appear */
    fadeSeconds: 1.4,   /* length of the crossfade at the end of a segment */
    particles: 14,      /* drifting petals / leaves / motes (kept small for phones) */
    loop: true          /* after the last scene, start again from the first */
  };
  try {
    var q = new URLSearchParams(location.search);
    if (q.get('seg') && +q.get('seg') > 0) CONFIG.segmentSeconds = +q.get('seg');
    if (q.get('fade') && +q.get('fade') >= 0) CONFIG.fadeSeconds = +q.get('fade');
  } catch (e) {}
  var reduceMotion = !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ---- scenes ----
     Each item: k = kind, sd = side (-1 left, 1 right), d = depth used ONCE to place the object
     (x = VX + sd*off*70/d, y = HZ + RB/d, size = 1/d), off = distance from the road edge (1 = road edge).
     These numbers are constants; nothing reads them again while walking. */
  function I(k, sd, d, off, extra) { var o = { k: k, sd: sd, d: d, off: off }; for (var key in extra) o[key] = extra[key]; return o; }
  var SCENES = [
    { id: 'village-entrance', name: 'Village entrance', warm: 0.12, items: [
      I('tree', -1, 12, 1.9, { seed: 4 }), I('tree', 1, 11, 1.9, { seed: 5 }), I('tree', -1, 8.5, 1.8, { seed: 7 }), I('tree', 1, 8, 2.0, { seed: 8 }),
      I('house', -1, 6.2, 2.1, { seed: 1, c: '#fff6e3', roof: '#c9603f' }), I('house', 1, 5.4, 2.2, { seed: 2, c: '#f0e0c8', roof: '#6e8a4a' }),
      I('fence', -1, 3.2, 1.35, {}), I('fence', -1, 2.6, 1.35, {}), I('fence', -1, 2.1, 1.35, {}), I('fence', -1, 1.7, 1.35, {}),
      I('sign', 1, 3.1, 1.3, { accent: '#e9806e' }),
      I('tree', -1, 3.4, 2.0, { seed: 3 }), I('tree', 1, 2.2, 2.2, { seed: 6 }),
      I('bush', -1, 2.3, 1.6, { dots: ['#ffd36b', '#ffffff'] }), I('bush', 1, 1.9, 1.55, {}),
      I('flowers', 1, 1.55, 1.4, {}), I('lamp', 1, 4.4, 1.25, {})
    ] },
    { id: 'tree-lined-road', name: 'Tree-lined road', warm: 0, items: [
      I('tree', -1, 15, 1.8, { seed: 11 }), I('tree', 1, 14, 1.8, { seed: 14 }), I('tree', -1, 11, 1.8, { seed: 10 }), I('tree', 1, 10, 1.85, { seed: 13 }),
      I('tree', -1, 8, 1.75, { seed: 12 }), I('tree', 1, 7.2, 1.8, { seed: 16 }), I('tree', -1, 5.8, 1.75, { seed: 17 }), I('tree', 1, 5.2, 1.8, { seed: 15 }),
      I('tree', -1, 4.2, 1.75, { seed: 19 }), I('tree', 1, 3.7, 1.85, { seed: 20 }), I('tree', -1, 3.0, 1.8, { seed: 22 }), I('tree', 1, 2.6, 1.9, { seed: 21 }),
      I('tree', -1, 2.1, 1.85, { seed: 23 }), I('tree', 1, 1.8, 2.0, { seed: 25 }),
      I('bush', -1, 3.5, 1.4, { dots: ['#ffffff', '#ffd36b'] }), I('bush', 1, 4.5, 1.4, {}), I('bush', -1, 1.7, 1.45, {}), I('bush', 1, 2.9, 1.4, { dots: ['#f7a8c0', '#ffffff'] }),
      I('flowers', -1, 2.5, 1.3, {}), I('flowers', 1, 1.6, 1.35, {})
    ] },
    { id: 'residential', name: 'Residential neighborhood', warm: -0.1, items: [
      I('house', -1, 11, 2.0, { seed: 3, c: '#e8d8e8', roof: '#5a68c0' }), I('house', 1, 10, 2.0, { seed: 4, c: '#dfe8d0', roof: '#c9603f' }),
      I('house', -1, 6.8, 2.0, { seed: 5, c: '#fff6e3', roof: '#6e8a4a' }), I('house', 1, 5.8, 2.1, { seed: 6, c: '#f0e0c8', roof: '#a84a2e' }),
      I('house', -1, 3.9, 2.1, { seed: 7, c: '#dfe8d0', roof: '#c9603f' }), I('house', 1, 3.2, 2.2, { seed: 8, c: '#e8d8e8', roof: '#5a68c0' }),
      I('house', -1, 2.1, 2.25, { seed: 9, c: '#fff6e3', roof: '#a84a2e' }),
      I('lamp', -1, 5, 1.25, {}), I('lamp', 1, 3.9, 1.25, {}), I('lamp', -1, 2.7, 1.25, {}), I('lamp', 1, 1.7, 1.25, {}),
      I('tree', -1, 4.9, 1.7, { seed: 30 }), I('tree', 1, 4.3, 1.75, { seed: 33 }), I('tree', 1, 8.5, 1.7, { seed: 34 }),
      I('bush', -1, 3.2, 1.5, { dots: ['#f7a8c0', '#ffffff'] }), I('bush', 1, 2.4, 1.5, {}), I('bush', -1, 1.6, 1.5, {}),
      I('flowers', 1, 1.5, 1.4, {}), I('fence', 1, 7.4, 1.4, {}), I('fence', -1, 8.4, 1.4, {})
    ] }
  ];

  /* turn an abstract item into a drawable object for the current theme (city, seaside, ...) */
  var BLDC = ['#c9d3e8', '#e8d3b0', '#b9c9a8', '#e0b4a8', '#aab5cd', '#d9c6e8'];
  function resolve(it, theme) {
    var o = { t: it.k, sd: it.sd, seed: it.seed || 0, c: it.c, roof: it.roof, dots: it.dots, accent: it.accent };
    if (it.k === 'tree' && theme === 'seaside') o.t = 'palm';
    if (it.k === 'house') {
      if (theme === 'city') { o.t = 'bld'; o.w = 40 + (it.seed * 7) % 30; o.h = 90 + (it.seed * 13) % 80; o.c = BLDC[it.seed % BLDC.length]; }
      else if (theme === 'abroad') { o.t = 'euro'; o.w = 48 + (it.seed * 5) % 20; o.h = 60 + (it.seed * 11) % 40; o.c = ['#f0c8a0', '#e8e0c8', '#d9a88a', '#c9d8c0'][it.seed % 4]; }
    }
    if ((it.k === 'fence') && (theme === 'city' || theme === 'abroad')) o.t = 'lamp';
    return o;
  }
  var cache = {};
  function placed(scene, theme) {
    var key = scene.id + '|' + theme;
    if (cache[key]) return cache[key];
    return cache[key] = scene.items.map(function (it) { return { it: it, o: resolve(it, theme) }; }).sort(function (a, b) { return b.it.d - a.it.d; });
  }

  /* ---- walk progress: advances only while the character is walking ---- */
  function smooth(k) { k = Math.max(0, Math.min(1, k)); return k * k * (3 - 2 * k); }
  function progress(R, dt, walking) {
    var S = R.seg || (R.seg = { i: 0, t: 0 }), T = CONFIG.segmentSeconds, N = SCENES.length;
    if (walking) S.t += dt;
    while (S.t >= T) { S.t -= T; S.i = CONFIG.loop ? (S.i + 1) % N : Math.min(N - 1, S.i + 1); }
    var fadeLen = reduceMotion ? 0 : Math.min(CONFIG.fadeSeconds, T), k = 0;
    if (fadeLen > 0 && S.t > T - fadeLen) k = smooth((S.t - (T - fadeLen)) / fadeLen);
    return { cur: S.i, next: (S.i + 1) % N, k: CONFIG.loop || S.i < N - 1 ? k : 0 };
  }

  /* ---- drifting petals / leaves / motes: constant size, gentle drift outward from the horizon ---- */
  function seasonParticle(season) {
    return { SPRING: ['#ffd6e0', '#ffffff', '#f7b5c6'], SUMMER: ['#fff6c9', '#ffffff'], AUTUMN: ['#f2a85a', '#e0794f', '#f6c25a'], WINTER: null }[season] || ['#fff6c9'];
  }
  function spawnP(p, VX, HZ, fresh) {
    p.x = VX + (Math.random() - .5) * 60; p.y = HZ + (fresh ? Math.random() * 190 : Math.random() * 24);
    var side = p.x < VX ? -1 : 1;
    p.vx = side * (3 + Math.random() * 7); p.vy = 5 + Math.random() * 9; p.r = .8 + Math.random() * .7; p.ph = Math.random() * TAU; p.rot = Math.random() * TAU; p.k = Math.random();
    return p;
  }
  function particles(cx, R, dt, walking, season, W, H, VX, HZ) {
    var cols = seasonParticle(season);
    if (!cols || reduceMotion || !CONFIG.particles) return;
    if (!R.pt) R.pt = Array.from({ length: CONFIG.particles }, function () { return spawnP({}, VX, HZ, true); });
    var step = walking ? dt : 0;
    R.pt.forEach(function (p) {
      p.x += p.vx * step + Math.sin(R.t * 1.4 + p.ph) * 4 * step; p.y += p.vy * step; p.rot += step * 1.6;
      if (p.y > H + 4 || p.x < -4 || p.x > W + 4) spawnP(p, VX, HZ, false);
      cx.save(); cx.translate(p.x, p.y); cx.rotate(p.rot); cx.globalAlpha = .75;
      F.ell(cx, 0, 0, p.r * 1.5, p.r, cols[(p.k * cols.length) | 0]); cx.restore();
    });
    cx.globalAlpha = 1;
  }

  /* ---- drawing ---- */
  function layer(R, w, h, RK, n) {
    var L = R['_ly' + n];
    if (!L) { L = R['_ly' + n] = (typeof OffscreenCanvas !== 'undefined') ? new OffscreenCanvas(w * RK, h * RK) : Object.assign(document.createElement('canvas'), { width: w * RK, height: h * RK }); }
    var c = L.getContext('2d'); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, L.width, L.height); c.setTransform(RK, 0, 0, RK, 0, 0);
    return { cv: L, c: c };
  }
  function drawScene(cx, scene, env, G) {
    var items = placed(scene, G.theme);
    var e = Object.assign({}, env, { tint: function (col) { return F.mix(col, scene.warm >= 0 ? '#ffd9a8' : '#bcd8ff', Math.abs(scene.warm)); } });
    for (var i = 0; i < items.length; i++) {
      var it = items[i].it, o = items[i].o, x = G.VX + it.sd * it.off * 70 / it.d, y = G.HZ + G.RB / it.d, s = 1 / it.d;
      F.obj(cx, o, x, y, s, e);
    }
    var lm = G.landmark;
    if (lm) F.obj(cx, { t: 'land', sd: lm.side === 'left' ? -1 : 1, big: lm.size !== 'small' }, G.VX + (lm.side === 'left' ? -1 : 1) * 1.75 * 70 / 3.4, G.HZ + G.RB / 3.4, 1 / 3.4, e);
  }
  /* returns the index of the scene on screen (for the dev label) */
  function scenes(cx, R, env, dt, walking, G) {
    var P = progress(R, dt, walking);
    env.still = reduceMotion;
    if (P.k <= 0) drawScene(cx, SCENES[P.cur], env, G);
    else {
      var A = layer(R, G.RW, G.RH, G.RK, 0), B = layer(R, G.RW, G.RH, G.RK, 1);
      drawScene(A.c, SCENES[P.cur], env, G); drawScene(B.c, SCENES[P.next], env, G);
      cx.save(); cx.setTransform(1, 0, 0, 1, 0, 0);
      cx.globalAlpha = 1 - P.k; cx.drawImage(A.cv, 0, 0);
      cx.globalAlpha = P.k; cx.drawImage(B.cv, 0, 0); cx.restore(); cx.globalAlpha = 1;
    }
    particles(cx, R, dt, walking, G.season, G.RW, G.RH, G.VX, G.HZ);
    F.dev.label = SCENES[P.k > .5 ? P.next : P.cur].name + (P.k > 0 ? ' (fading)' : '');
    return P;
  }

  /* ---- Mode A / B switch, development only (add ?dev=1 to the address, or set localStorage ls_dev=1) ---- */
  F.dev = { label: '' };
  var dev = false;
  try { dev = /[?&]dev(=1|&|$)/.test(location.search) || localStorage.getItem('ls_dev') === '1'; } catch (e) {}
  F.mode = 'B';
  try { var saved = sessionStorage.getItem('ls_walk_mode'); if (dev && (saved === 'A' || saved === 'B')) F.mode = saved; } catch (e) {}
  if (dev && typeof document !== 'undefined') {
    var mount = function () {
      if (document.querySelector('[data-testid=walk-mode]')) return;
      var b = document.createElement('button'); b.type = 'button'; b.setAttribute('data-testid', 'walk-mode');
      b.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:99999;font:12px/1.3 system-ui,sans-serif;padding:6px 10px;border-radius:10px;border:1px solid rgba(0,0,0,.25);background:rgba(255,255,255,.92);color:#2b2233;cursor:pointer;text-align:left';
      var paint = function () { b.textContent = (F.mode === 'B' ? 'Mode B · fixed scenes' : 'Mode A · original scaling') + (F.dev.label && F.mode === 'B' ? ' — ' + F.dev.label : '') + '  (tap to switch)'; };
      b.addEventListener('click', function () { F.mode = F.mode === 'B' ? 'A' : 'B'; try { sessionStorage.setItem('ls_walk_mode', F.mode); } catch (e) {} paint(); });
      setInterval(paint, 500); paint(); document.body.appendChild(b);
    };
    if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
  }

  F.walk = { CONFIG: CONFIG, SCENES: SCENES, progress: progress, scenes: scenes, drawScene: drawScene, resolve: resolve, reduceMotion: reduceMotion };
})(typeof window !== 'undefined' ? window : globalThis);
