/* Flat-vector road kit (Draft C): soft illustrated shapes, no pixel grid.
   Everything roadside keeps to a few fixed sizes (Flat.step) so nothing smoothly grows or shrinks.
   Characters are drawn from behind with plain shapes; swap Flat.char() when final character art arrives. */
(function (root) {
  var TAU = Math.PI * 2;
  function hex(c) { c = String(c).replace('#', ''); if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2]; return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)]; }
  function mix(a, b, t) { a = typeof a === 'string' ? hex(a) : a; b = typeof b === 'string' ? hex(b) : b; return 'rgb(' + Math.round(a[0] + (b[0] - a[0]) * t) + ',' + Math.round(a[1] + (b[1] - a[1]) * t) + ',' + Math.round(a[2] + (b[2] - a[2]) * t) + ')'; }
  function lt(c, t) { return mix(c, '#ffffff', t); }
  function dk(c, t) { return mix(c, '#2b2233', t); }
  function circ(cx, x, y, r, f) { cx.beginPath(); cx.arc(x, y, Math.max(0.01, r), 0, TAU); cx.fillStyle = f; cx.fill(); }
  function ell(cx, x, y, rx, ry, f) { cx.beginPath(); cx.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), 0, 0, TAU); cx.fillStyle = f; cx.fill(); }
  function rr(cx, x, y, w, h, r, f) { cx.beginPath(); if (cx.roundRect) cx.roundRect(x, y, Math.max(0.01, w), Math.max(0.01, h), Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2)); else cx.rect(x, y, w, h); cx.fillStyle = f; cx.fill(); }
  function tri(cx, x1, y1, x2, y2, x3, y3, f) { cx.beginPath(); cx.moveTo(x1, y1); cx.lineTo(x2, y2); cx.lineTo(x3, y3); cx.closePath(); cx.fillStyle = f; cx.fill(); }
  var SHADOW = 'rgba(43,34,51,.14)';

  /* roadside things jump between a few set sizes instead of growing smoothly */
  var LEVELS = [0.13, 0.22, 0.38, 0.62, 1.0, 1.6];
  function step(s) { var best = LEVELS[0], bd = 1e9; for (var i = 0; i < LEVELS.length; i++) { var d = Math.abs(Math.log(s / LEVELS[i])); if (d < bd) { bd = d; best = LEVELS[i]; } } return best; }

  /* ---------- sky bodies, hills ---------- */
  function celestial(cx, c, R, W, HZ) {
    var dark = c.dark;
    if (dark > .3) {
      cx.globalAlpha = Math.min(1, (dark - .3) * 1.6) * (1 - c.cloud * .8);
      R.stars.forEach(function (p, i) { circ(cx, p[0], p[1], i % 5 ? .7 : 1, i % 5 ? '#ffffff' : '#ffe9a8'); });
      circ(cx, 30, 20, 8, '#fff6d0'); circ(cx, 33, 18, 7, 'rgba(34,26,69,.55)');
      cx.globalAlpha = 1;
    }
    if (dark < .8) {
      var a = (1 - dark) * (1 - c.cloud * .7), sy = 24 + dark * 50;
      cx.globalAlpha = a * .35; circ(cx, 132, sy, 19, '#fff0d6');
      cx.globalAlpha = a; circ(cx, 132, sy, 12, '#fff3d6'); cx.globalAlpha = 1;
    }
  }
  function hills(cx, W, HZ, col, cam, t) {
    function layer(base, a1, a2, ph, sp, color) {
      cx.beginPath(); cx.moveTo(0, HZ + 1);
      for (var x = 0; x <= W; x += 3) { var u = (x + cam * sp) * 0.035 + ph; cx.lineTo(x, HZ - base - Math.sin(u) * a1 - Math.sin(u * 2.7 + ph) * a2); }
      cx.lineTo(W, HZ + 1); cx.closePath(); cx.fillStyle = color; cx.fill();
    }
    layer(8, 6, 2, 0, 0.8, lt(col, .35));
    layer(3, 4, 1.5, 2.1, 1.6, col);
  }

  /* ---------- roadside things (s = size level, y = ground line, x = centre) ---------- */
  function tree(cx, x, y, s, o) {
    var look = o.look, base = o.leaf, L = o.sn ? '#eef1fb' : base, seed = o.seed || 0, sw = Math.sin(o.t * 1.3 + seed) * 1.3 * s;
    var trunk = '#8c6a5a';
    ell(cx, x, y, 22 * s, 4.5 * s, SHADOW);
    if (look === 'bare') {
      cx.strokeStyle = trunk; cx.lineCap = 'round'; cx.lineWidth = 5 * s; cx.beginPath(); cx.moveTo(x, y); cx.lineTo(x, y - 52 * s); cx.stroke();
      cx.lineWidth = 2.8 * s; cx.beginPath();
      cx.moveTo(x, y - 30 * s); cx.lineTo(x - 15 * s, y - 50 * s); cx.moveTo(x, y - 38 * s); cx.lineTo(x + 16 * s, y - 58 * s);
      cx.moveTo(x, y - 50 * s); cx.lineTo(x - 8 * s, y - 70 * s); cx.moveTo(x, y - 50 * s); cx.lineTo(x + 7 * s, y - 72 * s); cx.stroke();
      if (o.sn) { cx.strokeStyle = '#ffffff'; cx.lineWidth = 1.6 * s; cx.beginPath(); cx.moveTo(x - 17 * s, y - 52 * s); cx.lineTo(x - 11 * s, y - 47 * s); cx.moveTo(x + 14 * s, y - 60 * s); cx.lineTo(x + 20 * s, y - 55 * s); cx.stroke(); }
      return;
    }
    rr(cx, x - 3.5 * s, y - 30 * s, 7 * s, 30 * s, 2 * s, trunk);
    if ((seed % 3 === 0) && look === 'green') { /* pine */
      var pc = mix(L, '#2f7a62', .35);
      for (var i = 0; i < 3; i++) { var by = y - (16 + i * 20) * s, w = (24 - i * 6) * s; tri(cx, x + sw * (i + 1) / 3 - w, by, x + sw * (i + 2) / 3, by - 32 * s, x + sw * (i + 1) / 3 + w, by, i % 2 ? lt(pc, .08) : pc); }
      tri(cx, x + sw - 3 * s, y - 80 * s, x + sw, y - 94 * s, x + sw + 8 * s, y - 80 * s, lt(pc, .25));
      if (o.sn) tri(cx, x + sw - 6 * s, y - 70 * s, x + sw, y - 94 * s, x + sw + 6 * s, y - 70 * s, '#ffffff');
      return;
    }
    circ(cx, x - 13 * s + sw * .6, y - 46 * s, 15 * s, dk(L, .1));
    circ(cx, x + 13 * s + sw * .6, y - 46 * s, 15 * s, dk(L, .1));
    circ(cx, x + sw, y - 58 * s, 21 * s, L);
    circ(cx, x - 6 * s + sw, y - 65 * s, 9 * s, lt(L, .3));
    if (look === 'blossom') [[-14, -52], [8, -66], [14, -50], [-4, -74], [-18, -42], [4, -50]].forEach(function (p, i) { circ(cx, x + p[0] * s, y + p[1] * s, 2.4 * s, i % 2 ? '#fff4f7' : '#f7b5c6'); });
    else if (look === 'autumn') [[-14, -52], [8, -66], [14, -50], [-4, -74], [-18, -42], [4, -50]].forEach(function (p, i) { circ(cx, x + p[0] * s, y + p[1] * s, 2.6 * s, (i + seed) % 3 === 0 ? '#d9573a' : (i + seed) % 3 === 1 ? '#f6c25a' : dk(L, .15)); });
    if (o.sn) { circ(cx, x + sw, y - 74 * s, 12 * s, 'rgba(255,255,255,.9)'); circ(cx, x - 12 * s + sw, y - 56 * s, 6 * s, 'rgba(255,255,255,.8)'); }
  }
  function palm(cx, x, y, s, sd, t, seed) {
    ell(cx, x, y, 20 * s, 4 * s, SHADOW);
    cx.strokeStyle = '#b08458'; cx.lineCap = 'round'; cx.lineWidth = 6 * s;
    var tx = x + sd * 12 * s, ty = y - 84 * s;
    cx.beginPath(); cx.moveTo(x, y); cx.quadraticCurveTo(x + sd * 2 * s, y - 50 * s, tx, ty); cx.stroke();
    var sway = Math.sin(t * 1.2 + seed) * 2 * s;
    [[-1, -.2, '#5fae83'], [1, -.2, '#5fae83'], [-.7, -.8, '#79bd93'], [.7, -.8, '#79bd93'], [0, -1, '#8fcda4']].forEach(function (f) {
      cx.save(); cx.translate(tx, ty); cx.rotate(Math.atan2(f[1], f[0]) + (f[0] > 0 ? sway / (20 * s || 1) * .1 : -sway / (20 * s || 1) * .1));
      ell(cx, 14 * s, 0, 18 * s, 4.5 * s, f[2]); cx.restore();
    });
    circ(cx, tx - 3 * s, ty + 4 * s, 3 * s, '#8a5a40'); circ(cx, tx + 3 * s, ty + 5 * s, 3 * s, '#8a5a40');
  }
  function house(cx, x, y, s, sd, o, lit, winter) {
    var w = 56 * s, h = 38 * s, x0 = sd < 0 ? x - w : x, body = lt(o.c || '#fff6e3', .1), roof = mix(o.roof || '#c9603f', '#ffffff', .12);
    ell(cx, x0 + w / 2, y, w * .55, 4 * s, SHADOW);
    rr(cx, x0, y - h, w, h, 3 * s, body);
    rr(cx, x0 + w - 11 * s, y - h - 22 * s, 7 * s, 16 * s, 1.5 * s, dk(roof, .1));
    tri(cx, x0 - 5 * s, y - h + 1 * s, x0 + w / 2, y - h - 26 * s, x0 + w + 5 * s, y - h + 1 * s, roof);
    if (winter) tri(cx, x0 + w * .2, y - h - 9 * s, x0 + w / 2, y - h - 26 * s, x0 + w * .8, y - h - 9 * s, 'rgba(255,255,255,.92)');
    rr(cx, x0 + w * .16, y - 24 * s, 12 * s, 24 * s, 6 * s, '#a77b5e');
    rr(cx, x0 + w * .58, y - h + 10 * s, 15 * s, 13 * s, 3 * s, lit ? '#ffe9a8' : '#cfe6f4');
    cx.fillStyle = 'rgba(255,255,255,.7)'; cx.fillRect(x0 + w * .58 + 7 * s, y - h + 10 * s, 1 * s, 13 * s); cx.fillRect(x0 + w * .58, y - h + 16 * s, 15 * s, 1 * s);
  }
  function bld(cx, x, y, s, sd, o, lit, euro, winter) {
    var w = o.w * s, h = o.h * s, x0 = sd < 0 ? x - w : x, body = lt(o.c || '#c9d3e8', .06), side = o.c2 || dk(body, .12);
    ell(cx, x0 + w / 2, y, w * .56, 4 * s, SHADOW);
    rr(cx, x0, y - h, w, h, 4 * s, body);
    rr(cx, sd < 0 ? x0 + w - 5 * s : x0, y - h, 5 * s, h, 2 * s, side);
    if (euro) { tri(cx, x0 - 3 * s, y - h + 1 * s, x0 + w / 2, y - h - 22 * s, x0 + w + 3 * s, y - h + 1 * s, '#d98f6a'); if (winter) tri(cx, x0 + w * .3, y - h - 8 * s, x0 + w / 2, y - h - 22 * s, x0 + w * .7, y - h - 8 * s, 'rgba(255,255,255,.9)'); }
    else rr(cx, x0 - 1 * s, y - h - 2 * s, w + 2 * s, 5 * s, 2 * s, side);
    if (s > .1) for (var yy = 10; yy < o.h - 20; yy += (euro ? 22 : 16)) for (var xx = 7; xx < o.w - 10; xx += (euro ? 18 : 14)) {
      var on = lit && ((xx * 7 + yy * 3 + (o.seed | 0)) % 5 < 3);
      rr(cx, x0 + xx * s, y - h + yy * s, 7 * s, 9 * s, 1.6 * s, on ? '#ffe9a8' : lit ? '#6a6488' : '#dcecf6');
    }
    rr(cx, x0 + w / 2 - 6 * s, y - 18 * s, 12 * s, 18 * s, 5 * s, '#6d5f7e');
  }
  function lamp(cx, x, y, s, sd, lit) {
    var hx2 = x - sd * 9 * s;
    cx.strokeStyle = '#6d5f7e'; cx.lineCap = 'round'; cx.lineWidth = 3 * s;
    cx.beginPath(); cx.moveTo(x, y); cx.lineTo(x, y - 82 * s); cx.lineTo(hx2, y - 86 * s); cx.stroke();
    circ(cx, hx2, y - 80 * s, 5.5 * s, lit ? '#ffe9a8' : '#e9e4f0');
  }
  function fence(cx, x, y, s) {
    cx.strokeStyle = '#c29a74'; cx.lineCap = 'round'; cx.lineWidth = 3 * s;
    cx.beginPath(); cx.moveTo(x - 14 * s, y); cx.lineTo(x - 14 * s, y - 15 * s); cx.moveTo(x + 12 * s, y); cx.lineTo(x + 12 * s, y - 15 * s); cx.stroke();
    cx.lineWidth = 2.4 * s; cx.beginPath(); cx.moveTo(x - 17 * s, y - 11 * s); cx.lineTo(x + 15 * s, y - 11 * s); cx.moveTo(x - 17 * s, y - 5 * s); cx.lineTo(x + 15 * s, y - 5 * s); cx.stroke();
  }
  function hay(cx, x, y, s, winter) {
    ell(cx, x, y, 15 * s, 3.5 * s, SHADOW);
    rr(cx, x - 13 * s, y - 17 * s, 26 * s, 17 * s, 8 * s, winter ? '#f3f5ff' : '#efcf7e');
    cx.strokeStyle = winter ? '#d3daee' : '#d9b256'; cx.lineWidth = 1.4 * s; cx.beginPath(); cx.moveTo(x - 9 * s, y - 9 * s); cx.lineTo(x + 9 * s, y - 9 * s); cx.stroke();
  }
  function shop(cx, x, y, s, sd, o, lit) {
    var w = 34 * s, h = 26 * s, x0 = sd < 0 ? x - w : x, acc = o.acc || '#e9806e';
    ell(cx, x0 + w / 2, y, w * .56, 3.5 * s, SHADOW);
    rr(cx, x0, y - h, w, h, 3 * s, o.c || '#e8ecf6');
    for (var i = 0; i < 5; i++) rr(cx, x0 + i * 6.8 * s, y - h, 6.8 * s, 5 * s, 1.4 * s, i % 2 ? '#ffffff' : acc);
    rr(cx, x0 + 4 * s, y - h + 9 * s, 12 * s, 10 * s, 2 * s, lit ? '#ffe9a8' : '#cfe6f4');
    rr(cx, x0 + 20 * s, y - h + 9 * s, 9 * s, 17 * s, 4 * s, '#7a6a80');
    rr(cx, x0 - 1 * s, y - h - 14 * s, w + 2 * s, 12 * s, 3 * s, acc);
    rr(cx, x0 + 3 * s, y - h - 9 * s, w - 6 * s, 2 * s, 1 * s, 'rgba(255,255,255,.6)');
  }
  function land(cx, x, y, S2, sd, lit) {
    var w = 104 * S2, h = 76 * S2, x0 = sd < 0 ? x - w : x;
    ell(cx, x0 + w / 2, y, w * .56, 4 * S2, SHADOW);
    rr(cx, x0, y - h, w, h, 5 * S2, '#fff6e3');
    for (var i = 0; i < 8; i++) rr(cx, x0 + i * 13 * S2, y - h + 4 * S2, 13 * S2, 9 * S2, 2 * S2, i % 2 ? '#ffffff' : '#e9806e');
    rr(cx, x0 + 10 * S2, y - h + 22 * S2, 46 * S2, 32 * S2, 4 * S2, lit ? '#ffe9a8' : '#cfe6f4');
    rr(cx, x0 + 66 * S2, y - 40 * S2, 24 * S2, 40 * S2, 8 * S2, '#a77b5e');
    rr(cx, x0 - 2 * S2, y - h - 30 * S2, w + 4 * S2, 26 * S2, 6 * S2, '#3c3a68');
    rr(cx, x0 + 6 * S2, y - h - 19 * S2, w - 12 * S2, 3 * S2, 1.5 * S2, 'rgba(255,255,255,.55)');
  }

  /* one roadside object; env carries the scene state */
  function obj(cx, o, x, y, s, env) {
    var sd = o.sd, c = env.c, lit = env.lit, winter = c.winter > .5, t = env.t;
    if (o.t === 'tree') { var bd = env.bd, TRS = env.TRS; tree(cx, x, y, s, { look: TRS && TRS.look ? TRS.look : ({ SPRING: 'blossom', AUTUMN: 'autumn', WINTER: 'bare' })[bd.season] || 'green', leaf: TRS && TRS.leaf ? TRS.leaf : (env.LEAFC[bd.season] || env.LEAFC.SUMMER)[0], sn: TRS ? !!TRS.snow : bd.season === 'WINTER', seed: o.seed, t: t }); }
    else if (o.t === 'palm') palm(cx, x, y, s, sd, t, o.seed || 0);
    else if (o.t === 'lamp') { lamp(cx, x, y, s, sd, lit); if (lit) env.glows.push([x - sd * 9 * s, y - 80 * s, s]); }
    else if (o.t === 'bld' || o.t === 'euro') bld(cx, x, y, s, sd, o, lit, o.t === 'euro', winter);
    else if (o.t === 'house') house(cx, x, y, s, sd, o, lit, winter);
    else if (o.t === 'prop') shop(cx, x, y, s, sd, o, lit);
    else if (o.t === 'fence') fence(cx, x, y, s);
    else if (o.t === 'hay') hay(cx, x, y, s, winter);
    else if (o.t === 'land') { var S2 = s * (o.big === false ? .62 : 1); land(cx, x, y, S2, sd, lit); if (lit) env.glows.push([sd < 0 ? x - 104 * S2 + 33 * S2 : x + 33 * S2, y - 38 * S2, S2 * 1.6]); }
  }
  function glow(cx, g, dark) { cx.globalAlpha = .26 * dark; circ(cx, g[0], g[1], 14 * g[2], '#ffe9a8'); cx.globalAlpha = 1; }

  /* ---------- characters (from behind) ---------- */
  var LONG = { bob: 10, bobB: 10, med: 14, medB: 14, medM: 9, long: 17, longB: 17, wavy: 17, vlong: 20 };
  function palette(look, age) {
    var CS = root.CS || {}, g = look.g;
    var skin = (CS.SKINS && CS.SKINS[look.skin] || {}).c || '#f6dcc6';
    var hair = (CS.HAIRC && CS.HAIRC[look.hc] || {}).c || '#3a2a30';
    if (age > 50) hair = mix(hair, '#d7d4de', Math.min(.85, (age - 50) / 40));
    var P = (CS.PALS && (CS.PALS[look.pal || 0] || CS.PALS[0]) || [0, 0, 0, ['#e8606a', '#fff0c9', '#3f4f8a']])[3];
    var OS = (CS && (g === 'M' ? CS.OUT_M : CS.OUT_F) || [])[look.outfit || 0];
    OS = OS ? OS[3] : { top: 'tee', bot: 'jeans' };
    var top = mix(P[0], '#ffffff', .12), bot = OS.bot === 'jeans' ? '#6d86c0' : mix(P[2], '#ffffff', .1);
    if (look.dress === 'wedding') { top = g === 'M' ? '#4a4660' : '#fbf8f2'; bot = g === 'M' ? '#4a4660' : '#fbf8f2'; }
    else if (look.dress === 'funeral') { top = '#3a3640'; bot = '#3a3640'; }
    return { skin: skin, hair: hair, top: top, bot: bot, skirt: OS.bot === 'skirt' || OS.bot === 'gown', len: LONG[look.hair] || 0, body: look.body == null ? 1 : look.body };
  }
  /* h = total height; ph = walk phase; k scales the head for babies and kids */
  function char(cx, x, by, h, look, age, ph, walking, role) {
    var pal = palette(look || {}, age || 25), s = h / 74, sw = walking ? Math.sin(ph * 4.2) : 0, b = walking ? Math.abs(sw) * 1.4 : 0;
    var young = role === 'baby' || role === 'kid', hs = young ? 1.22 : 1, bw = [.9, 1, 1.1][pal.body] || 1;
    cx.save(); cx.translate(x, by); cx.scale(s, s);
    ell(cx, 0, 0, 17, 4, SHADOW); cx.translate(0, -b);
    var legs = pal.skirt ? '#f1d4c0' : pal.bot;
    rr(cx, -9, -23 + sw * 3, 8, 23, 3.5, dk(legs, .08)); rr(cx, 1, -23 - sw * 3, 8, 23, 3.5, legs);
    if (pal.skirt) { cx.beginPath(); cx.moveTo(-11 * bw, -32); cx.lineTo(11 * bw, -32); cx.lineTo(14 * bw, -17); cx.lineTo(-14 * bw, -17); cx.closePath(); cx.fillStyle = pal.bot; cx.fill(); }
    rr(cx, -12 * bw, -49, 24 * bw, 31, 10, pal.top);
    rr(cx, -16 * bw, -46 + sw * 2, 6, 19, 3, dk(pal.top, .1)); rr(cx, 10 * bw, -46 - sw * 2, 6, 19, 3, dk(pal.top, .1));
    if (pal.len) rr(cx, -12 * hs, -62 * hs + 10 * (hs - 1), 24 * hs, Math.min(26, pal.len * 1.5), 9, pal.hair);
    circ(cx, 0, -57 * hs, 11 * hs, pal.skin);
    circ(cx, 0, -58.5 * hs, 12.5 * hs, pal.hair); circ(cx, 0, -52 * hs, 9.5 * hs, pal.hair);
    cx.restore();
  }
  function pet(cx, x, by, h, cat, ph, walking) {
    var w = cat ? ['#a8a2b8', '#7d768f'] : ['#e8b886', '#a97a52'], s = h / 18, sw = walking ? Math.sin(ph * 6) : 0;
    cx.save(); cx.translate(x, by); cx.scale(s, s);
    ell(cx, 0, 0, 10, 2.4, SHADOW);
    rr(cx, -5 + sw * 2, -5, 3, 5, 1.5, w[1]); rr(cx, 3 - sw * 2, -5, 3, 5, 1.5, w[1]);
    ell(cx, 0, -9, 8, 5, w[0]); circ(cx, 6, -13, 4.2, w[0]);
    tri(cx, 3.6, -16, 5.2, -20, 6.4, -16, w[1]); tri(cx, 6.8, -16, 8.2, -20, 9, -15.4, w[1]);
    circ(cx, 7.4, -13.4, .8, '#2b2233');
    cx.strokeStyle = w[1]; cx.lineCap = 'round'; cx.lineWidth = 2; cx.beginPath(); cx.moveTo(-7, -10); cx.quadraticCurveTo(-12, -14 + sw * 2, -11, -18); cx.stroke();
    cx.restore();
  }

  root.Flat = { step: step, hills: hills, celestial: celestial, obj: obj, glow: glow, char: char, pet: pet, circ: circ, rr: rr, ell: ell, mix: mix, lt: lt, dk: dk };
})(typeof window !== 'undefined' ? window : globalThis);
