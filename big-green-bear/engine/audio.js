/*
 * audio.js — layered audio, synthesized with the Web Audio API.
 *
 * No audio files are needed for the vertical slice: rain, water, crowd,
 * the bell, and the theme are generated in code. You can swap any sound
 * for a real file later:  BGB.story.sounds({ rain: { src: "audio/rain.ogg", loop: true, bus: "ambience" } })
 *
 * Buses: music, ambience, sfx  (each with its own volume)
 *
 * Content controls audio declaratively. A scene or chapter can say:
 *   audio: { music: "theme", ambience: ["festival", "rain_light"] }
 *   audio: { music: null }   -> silence
 *
 * MEMORY: as memory reliability drops, the music bus is low-pass filtered
 * (it sounds more and more "underwater") and a quiet three-note alarm rhythm
 * inside the theme becomes slightly more audible. Nobody should notice early.
 */
(function () {
  "use strict";
  var BGB = globalThis.BGB;

  var ctx = null;
  var buses = {};
  var musicFilter = null;
  var settings = { master: 0.8, music: 0.6, ambience: 0.7, sfx: 0.7, muted: false };
  var memory = 100;
  var active = { music: null, ambience: {} };
  var wanted = { music: null, ambience: [] };
  var noiseBuf = null;

  function ensure() {
    if (ctx) return ctx;
    var AC = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    buses.master = ctx.createGain();
    buses.master.connect(ctx.destination);
    musicFilter = ctx.createBiquadFilter();
    musicFilter.type = "lowpass";
    musicFilter.connect(buses.master);
    ["music", "ambience", "sfx"].forEach(function (b) {
      buses[b] = ctx.createGain();
      buses[b].connect(b === "music" ? musicFilter : buses.master);
    });
    var len = ctx.sampleRate * 2;
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    var ch = noiseBuf.getChannelData(0);
    for (var i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
    applyVolumes();
    applyMemory();
    return ctx;
  }

  function applyVolumes() {
    if (!ctx) return;
    var t = ctx.currentTime;
    buses.master.gain.setTargetAtTime(settings.muted ? 0 : settings.master, t, 0.1);
    ["music", "ambience", "sfx"].forEach(function (b) {
      buses[b].gain.setTargetAtTime(settings[b], t, 0.1);
    });
  }

  function applyMemory() {
    if (!ctx) return;
    // 100 -> 14000 Hz (clear), 0 -> 500 Hz (muffled, underwater)
    var f = 500 * Math.pow(28, memory / 100);
    musicFilter.frequency.setTargetAtTime(f, ctx.currentTime, 1.5);
  }

  function noiseSource() {
    var s = ctx.createBufferSource();
    s.buffer = noiseBuf;
    s.loop = true;
    return s;
  }

  /* ---------------- generators: each returns { stop() } ---------------- */

  function fadeOut(gain, then) {
    gain.gain.setTargetAtTime(0, ctx.currentTime, 0.6);
    setTimeout(then, 3000);
  }

  function rain(level) {
    return function (out) {
      var n = noiseSource();
      var bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = level > 1 ? 1200 : 2500;
      bp.Q.value = 0.6;
      var g = ctx.createGain();
      g.gain.value = 0;
      g.gain.setTargetAtTime(level > 1 ? 0.35 : 0.14, ctx.currentTime, 1.2);
      n.connect(bp).connect(g).connect(out);
      n.start();
      return {
        stop: function () {
          fadeOut(g, function () {
            n.stop();
          });
        },
      };
    };
  }

  function festival(out) {
    // a distant crowd: low noise with slow swelling "voices"
    var n = noiseSource();
    var lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 700;
    var g = ctx.createGain();
    g.gain.value = 0;
    g.gain.setTargetAtTime(0.06, ctx.currentTime, 1.5);
    var lfo = ctx.createOscillator();
    var lfoG = ctx.createGain();
    lfo.frequency.value = 0.13;
    lfoG.gain.value = 0.025;
    lfo.connect(lfoG).connect(g.gain);
    n.connect(lp).connect(g).connect(out);
    n.start();
    lfo.start();
    return {
      stop: function () {
        fadeOut(g, function () {
          n.stop();
          lfo.stop();
        });
      },
    };
  }

  function drips(out) {
    var alive = true;
    var g = ctx.createGain();
    g.gain.value = 0.5;
    g.connect(out);
    (function loop() {
      if (!alive) return;
      var o = ctx.createOscillator();
      var e = ctx.createGain();
      var t = ctx.currentTime;
      o.type = "sine";
      o.frequency.setValueAtTime(900 + Math.random() * 500, t);
      o.frequency.exponentialRampToValueAtTime(300, t + 0.12);
      e.gain.setValueAtTime(0.0001, t);
      e.gain.exponentialRampToValueAtTime(0.18, t + 0.005);
      e.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
      o.connect(e).connect(g);
      o.start(t);
      o.stop(t + 0.25);
      setTimeout(loop, 900 + Math.random() * 2600);
    })();
    return {
      stop: function () {
        alive = false;
      },
    };
  }

  // The theme: a slow music-box melody. Every 4th bar, three very quiet
  // high "pips" (the rhythm of an emergency alert) sit under the melody.
  var THEME = [
    // [semitones from A4 (null = rest), beats]
    [3, 1], [7, 1], [10, 2], [8, 1], [7, 1], [5, 2],
    [3, 1], [5, 1], [7, 1], [3, 1], [2, 4],
    [0, 1], [3, 1], [7, 2], [5, 1], [3, 1], [2, 2],
    [0, 1], [2, 1], [3, 1], [-2, 1], [0, 4],
  ];
  function theme(out) {
    var alive = true;
    var beat = 0.75;
    var t0 = ctx.currentTime + 0.3;
    var i = 0;
    var bar = 0;
    function note(semi, when, dur, vol) {
      var f = 440 * Math.pow(2, semi / 12);
      [1, 2].forEach(function (h, k) {
        var o = ctx.createOscillator();
        var e = ctx.createGain();
        o.type = "sine";
        o.frequency.value = f * h;
        e.gain.setValueAtTime(0.0001, when);
        e.gain.exponentialRampToValueAtTime((k ? 0.03 : 0.11) * vol, when + 0.01);
        e.gain.exponentialRampToValueAtTime(0.0001, when + dur * 1.6);
        o.connect(e).connect(out);
        o.start(when);
        o.stop(when + dur * 1.7);
      });
    }
    function pips(when) {
      // alarm rhythm: hidden at full memory, faintly present as it drops
      var vol = 0.006 + 0.05 * Math.max(0, (90 - memory) / 90);
      for (var k = 0; k < 3; k++) {
        var o = ctx.createOscillator();
        var e = ctx.createGain();
        var w = when + k * 0.18;
        o.type = "triangle";
        o.frequency.value = 1568;
        e.gain.setValueAtTime(0.0001, w);
        e.gain.exponentialRampToValueAtTime(vol, w + 0.01);
        e.gain.exponentialRampToValueAtTime(0.0001, w + 0.1);
        o.connect(e).connect(out);
        o.start(w);
        o.stop(w + 0.12);
      }
    }
    var timer = setInterval(function () {
      if (!alive) return;
      while (t0 < ctx.currentTime + 1.5) {
        var n = THEME[i];
        if (n[0] !== null) note(n[0], t0, n[1] * beat, 1);
        if (i === 0) {
          bar++;
          if (bar % 2 === 0) pips(t0 + 2 * beat);
        }
        t0 += n[1] * beat;
        i = (i + 1) % THEME.length;
        if (i === 0) t0 += beat * 2;
      }
    }, 250);
    return {
      stop: function () {
        alive = false;
        clearInterval(timer);
      },
    };
  }

  function heartbeat(out) {
    var alive = true;
    var timer = setInterval(function () {
      if (!alive) return;
      [0, 0.28].forEach(function (d, k) {
        var o = ctx.createOscillator();
        var e = ctx.createGain();
        var t = ctx.currentTime + d;
        o.frequency.setValueAtTime(70, t);
        o.frequency.exponentialRampToValueAtTime(40, t + 0.15);
        e.gain.setValueAtTime(0.0001, t);
        e.gain.exponentialRampToValueAtTime(k ? 0.25 : 0.35, t + 0.02);
        e.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
        o.connect(e).connect(out);
        o.start(t);
        o.stop(t + 0.3);
      });
    }, 1300);
    return {
      stop: function () {
        alive = false;
        clearInterval(timer);
      },
    };
  }

  /* ---------------- one-shot sfx ---------------- */

  function tone(freqs, dur, vol, type) {
    var t = ctx.currentTime;
    freqs.forEach(function (f, k) {
      var o = ctx.createOscillator();
      var e = ctx.createGain();
      o.type = type || "sine";
      o.frequency.value = f;
      e.gain.setValueAtTime(0.0001, t);
      e.gain.exponentialRampToValueAtTime(vol / (k + 1), t + 0.008);
      e.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(e).connect(buses.sfx);
      o.start(t);
      o.stop(t + dur + 0.05);
    });
  }

  var BUILTIN = {
    // loops
    theme: { bus: "music", make: theme },
    rain_light: { bus: "ambience", make: rain(1) },
    rain_heavy: { bus: "ambience", make: rain(2) },
    festival: { bus: "ambience", make: festival },
    drips: { bus: "ambience", make: drips },
    heartbeat: { bus: "ambience", make: heartbeat },
    // one-shots
    ui_move: { bus: "sfx", play: function () { tone([660], 0.05, 0.03); } },
    ui_select: { bus: "sfx", play: function () { tone([880], 0.08, 0.05); } },
    page: { bus: "sfx", play: function () { tone([520, 1040], 0.12, 0.03, "triangle"); } },
    // the small green bell: inharmonic partials, long decay
    bell: { bus: "sfx", play: function () { tone([1760, 4400, 5900], 2.4, 0.12); } },
    evidence: { bus: "sfx", play: function () { tone([784, 1175], 0.6, 0.05); } },
    contradiction: { bus: "sfx", play: function () { tone([415, 440], 0.9, 0.05); } },
    thunder: {
      bus: "sfx",
      play: function () {
        var n = noiseSource();
        var lp = ctx.createBiquadFilter();
        lp.type = "lowpass";
        lp.frequency.value = 180;
        var g = ctx.createGain();
        var t = ctx.currentTime;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.5, t + 0.3);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 3);
        n.connect(lp).connect(g).connect(buses.sfx);
        n.start(t);
        n.stop(t + 3.1);
      },
    },
  };

  function def(id) {
    return BGB.story.data.sounds[id] || BUILTIN[id];
  }

  function startLoop(id) {
    var d = def(id);
    if (!d) return null;
    if (d.src) {
      var el = new Audio(d.src);
      el.loop = d.loop !== false;
      var node = ctx.createMediaElementSource(el);
      node.connect(buses[d.bus || "ambience"]);
      el.play().catch(function () {});
      return { stop: function () { el.pause(); } };
    }
    return d.make(buses[d.bus || "ambience"]);
  }

  function sync() {
    if (!ctx) return;
    if (active.music && active.music.id !== wanted.music) {
      active.music.h.stop();
      active.music = null;
    }
    if (wanted.music && !active.music) {
      var h = startLoop(wanted.music);
      if (h) active.music = { id: wanted.music, h: h };
    }
    Object.keys(active.ambience).forEach(function (id) {
      if (wanted.ambience.indexOf(id) === -1) {
        active.ambience[id].stop();
        delete active.ambience[id];
      }
    });
    wanted.ambience.forEach(function (id) {
      if (!active.ambience[id]) {
        var h = startLoop(id);
        if (h) active.ambience[id] = h;
      }
    });
  }

  BGB.audio = {
    // Browsers only allow sound after a user gesture; ui.js calls this on the first click/key.
    unlock: function () {
      if (!ensure()) return;
      if (ctx.state === "suspended") ctx.resume();
      sync();
    },
    // audio: { music: "theme" | null, ambience: [...] } — undefined keys are left unchanged
    set: function (spec) {
      if (!spec) return;
      if (spec.music !== undefined) wanted.music = spec.music;
      if (spec.ambience !== undefined) wanted.ambience = spec.ambience.slice();
      sync();
    },
    play: function (id) {
      if (!ctx) return;
      var d = def(id);
      if (!d) return;
      if (d.src) {
        var el = new Audio(d.src);
        el.volume = settings.master * settings[d.bus || "sfx"];
        el.play().catch(function () {});
      } else if (d.play) d.play();
    },
    setVolumes: function (v) {
      Object.assign(settings, v.volume || {}, { muted: !!v.muted });
      applyVolumes();
    },
    setMemory: function (m) {
      memory = m;
      applyMemory();
    },
    // for the debug panel
    status: function () {
      return { started: !!ctx, music: wanted.music, ambience: wanted.ambience.slice(), memory: memory };
    },
  };
})();
