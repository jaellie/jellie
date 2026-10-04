import { assetUrl } from './Overlay.js';

// If assets/audio/<key>.mp3 exists it is used; otherwise a soft WebAudio synth stands in.
// Every call is wrapped so missing/blocked audio can never crash the game.

const FILES = {
  bgm_home: 'audio/bgm_home.mp3', bgm_mall: 'audio/bgm_mall.mp3', bgm_past: 'audio/bgm_past.mp3', bgm_beach: 'audio/bgm_beach.mp3',
  waves: 'audio/waves.mp3', gulls: 'audio/gulls.mp3', cicadas: 'audio/cicadas.mp3', wind: 'audio/wind.mp3', chatter: 'audio/chatter.mp3',
  squeak: 'audio/squeak.mp3', chime: 'audio/chime.mp3',
};

const PENTA = [0, 2, 4, 7, 9];
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

export class AudioManager {
  constructor() { this.ctx = null; this.buffers = {}; this.loops = {}; this.bgmKey = null; }

  async init() {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      if (this.ctx.state === 'suspended') await this.ctx.resume();
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -18; comp.ratio.value = 3;
      this.master = this.ctx.createGain(); this.master.gain.value = 0.9;
      this.master.connect(comp); comp.connect(this.ctx.destination);
      this.noise = this.makeNoise();
      // try the optional files in the background
      await Promise.all(Object.entries(FILES).map(([k, f]) => this.loadBuffer(f).then((b) => { if (b) this.buffers[k] = b; })));
    } catch (e) { console.warn('[audio] disabled:', e?.message); this.ctx = null; }
  }

  async loadBuffer(file) {
    if (!this.ctx || !file) return null;
    try {
      const res = await fetch(assetUrl(file));
      if (!res.ok) return null;
      const type = res.headers.get('content-type') || '';
      if (type.includes('text/html')) return null; // dev-server SPA fallback = missing file
      const arr = await res.arrayBuffer();
      return await new Promise((ok) => this.ctx.decodeAudioData(arr, ok, () => ok(null)));
    } catch { return null; }
  }

  makeNoise() {
    const len = this.ctx.sampleRate * 2;
    const b = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }

  get t() { return this.ctx.currentTime; }

  env(gainNode, t, a, peak, d) {
    const g = gainNode.gain; g.setValueAtTime(0.0001, t);
    g.exponentialRampToValueAtTime(peak, t + a); g.exponentialRampToValueAtTime(0.0001, t + a + d);
  }

  osc(type, freq, t, a, peak, d, dest = this.master) {
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    this.env(g, t, a, peak, d); o.connect(g); g.connect(dest);
    o.start(t); o.stop(t + a + d + 0.05);
    return o;
  }

  noiseBurst(t, dur, peak, filterType, freq, q = 1, dest = this.master) {
    const s = this.ctx.createBufferSource(); s.buffer = this.noise;
    const f = this.ctx.createBiquadFilter(); f.type = filterType; f.frequency.value = freq; f.Q.value = q;
    const g = this.ctx.createGain(); this.env(g, t, Math.min(0.02, dur / 3), peak, dur);
    s.connect(f); f.connect(g); g.connect(dest);
    s.start(t, Math.random()); s.stop(t + dur + 0.1);
  }

  playBuffer(buf, vol = 1, rate = 1) {
    const s = this.ctx.createBufferSource(); s.buffer = buf; s.playbackRate.value = rate;
    const g = this.ctx.createGain(); g.gain.value = vol; s.connect(g); g.connect(this.master); s.start();
    return s;
  }

  // ── one-shots ────────────────────────────────────────────
  play(name, opts = {}) {
    if (!this.ctx) return;
    try { this._play(name, opts); } catch (e) { /* never crash on audio */ }
  }

  _play(name) {
    const t = this.t, r = () => Math.random();
    switch (name) {
      case 'squeak': {
        if (this.buffers.squeak) { this.playBuffer(this.buffers.squeak, 0.6, 0.9 + r() * 0.25); return; }
        const o = this.ctx.createOscillator(), g = this.ctx.createGain();
        const f0 = 1000 + r() * 250;
        o.type = 'sine';
        o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f0 * 1.55, t + 0.045);
        o.frequency.exponentialRampToValueAtTime(f0 * 1.2, t + 0.1);
        this.env(g, t, 0.012, 0.07, 0.1); o.connect(g); g.connect(this.master); o.start(t); o.stop(t + 0.16);
        return;
      }
      case 'step': this.noiseBurst(t, 0.07, 0.05 + r() * 0.02, 'lowpass', 380 + r() * 120); return;
      case 'stepSoft': this.noiseBurst(t, 0.06, 0.03, 'lowpass', 300); return;
      case 'sand': this.noiseBurst(t, 0.11, 0.05, 'bandpass', 1800, 0.8); return;
      case 'chime': {
        if (this.buffers.chime) { this.playBuffer(this.buffers.chime, 0.7); return; }
        [[1318.5, 0.09, 1.8], [1975.5, 0.05, 1.4], [2637, 0.03, 1.0]].forEach(([f, p, d], i) => this.osc('sine', f, t + i * 0.09, 0.008, p, d));
        return;
      }
      case 'sparkle': [2093, 2637, 3136].forEach((f, i) => this.osc('sine', f, t + i * 0.06, 0.005, 0.025, 0.5)); return;
      case 'pop': {
        const o = this.osc('sine', 380, t, 0.005, 0.12, 0.18); o.frequency.exponentialRampToValueAtTime(880, t + 0.12); return;
      }
      case 'page': this.noiseBurst(t, 0.14, 0.04, 'highpass', 2500); return;
      case 'rustle': for (let i = 0; i < 6; i++) this.noiseBurst(t + i * 0.07 + r() * 0.04, 0.1, 0.05, 'bandpass', 3000 + r() * 2000, 0.7); return;
      case 'click': this.osc('square', 1800, t, 0.001, 0.03, 0.03); return;
      case 'door': this.noiseBurst(t, 0.5, 0.08, 'lowpass', 250); this.osc('sine', 90, t, 0.01, 0.1, 0.3); return;
      case 'curtain': for (let i = 0; i < 12; i++) this.noiseBurst(t + i * 0.12, 0.25, 0.025, 'bandpass', 2200 + r() * 800, 0.6); return;
      case 'water': for (let i = 0; i < 14; i++) this.osc('sine', 600 + r() * 900, t + i * 0.06 + r() * 0.03, 0.005, 0.025, 0.08); return;
      case 'splash': this.noiseBurst(t, 0.5, 0.08, 'bandpass', 900, 0.6); return;
      case 'coin': [2400, 3200].forEach((f, i) => this.osc('triangle', f, t + i * 0.07, 0.002, 0.05, 0.5)); return;
      case 'whoosh': { this.noiseBurst(t, 0.4, 0.06, 'bandpass', 700, 0.5); return; }
      case 'flame': this.noiseBurst(t, 0.3, 0.04, 'lowpass', 900); this.osc('sine', 660, t + 0.05, 0.01, 0.03, 0.4); return;
      case 'lid': this.osc('triangle', 820, t, 0.002, 0.05, 0.25); this.osc('triangle', 1230, t + 0.01, 0.002, 0.03, 0.2); return;
      case 'thud': this.osc('sine', 120, t, 0.005, 0.15, 0.2); this.noiseBurst(t, 0.12, 0.06, 'lowpass', 400); return;
      case 'sigh': this.noiseBurst(t, 0.9, 0.025, 'bandpass', 600, 0.8); return;
      case 'dish': [1600, 2100].forEach((f, i) => this.osc('sine', f, t + i * 0.05, 0.002, 0.03, 0.3)); this.noiseBurst(t, 0.6, 0.03, 'bandpass', 1500, 0.5); return;
      case 'beep': this.osc('square', 2000, t, 0.002, 0.025, 0.06); this.osc('square', 2000, t + 0.12, 0.002, 0.025, 0.06); return;
      case 'dingdong': this.osc('sine', 784, t, 0.01, 0.12, 0.9); this.osc('sine', 622, t + 0.45, 0.01, 0.12, 1.1); return;
      case 'car': this.noiseBurst(t, 0.6, 0.06, 'lowpass', 160); this.osc('sawtooth', 55, t, 0.05, 0.03, 0.6); return;
      default:
    }
  }

  // phone ring that repeats until stopped
  ring() {
    if (!this.ctx) return { stop() {} };
    let alive = true;
    const once = () => {
      if (!alive) return;
      const t = this.t;
      for (let i = 0; i < 16; i++) this.osc('sine', i % 2 ? 1250 : 1000, t + i * 0.05, 0.004, 0.035, 0.045);
      setTimeout(once, 2600);
    };
    once();
    return { stop: () => { alive = false; } };
  }

  async playVoice(file) {
    if (!this.ctx) return null;
    try {
      const b = this.buffers[file] ?? (this.buffers[file] = await this.loadBuffer(file));
      if (!b) return null;
      this.duck(0.25);
      const s = this.playBuffer(b, 1);
      s.onended = () => this.duck(1);
      return { duration: b.duration, stop: () => { try { s.stop(); } catch {} this.duck(1); } };
    } catch { return null; }
  }

  duck(v) { if (this.bgmBus) this.bgmBus.gain.setTargetAtTime(v, this.t, 0.4); }

  // ── loops (music + ambience) ─────────────────────────────
  setLoops(keys, fadeSec = 1.5) {
    this.desired = keys;
    if (!this.ctx) return;
    try {
      for (const k of Object.keys(this.loops)) if (!keys.includes(k)) { this.loops[k].stop(fadeSec); delete this.loops[k]; }
      for (const k of keys) if (!this.loops[k]) this.loops[k] = this.startLoop(k, fadeSec);
    } catch (e) { console.warn('[audio]', e?.message); }
  }

  loopGain(k, v, sec = 1) { const l = this.loops[k]; if (l && this.ctx) l.out.gain.setTargetAtTime(v, this.t, sec); }

  startLoop(k, fadeSec) {
    const out = this.ctx.createGain(); out.gain.value = 0.0001;
    if (!this.bgmBus) { this.bgmBus = this.ctx.createGain(); this.bgmBus.connect(this.master); }
    out.connect(k.startsWith('bgm') ? this.bgmBus : this.master);
    const level = { bgm_home: 0.5, bgm_mall: 0.45, bgm_past: 0.5, bgm_beach: 0.45, waves: 0.5, gulls: 0.35, cicadas: 0.18, wind: 0.3, chatter: 0.25 }[k] ?? 0.4;
    out.gain.setTargetAtTime(level, this.t, fadeSec / 3);
    let stopFn;
    if (this.buffers[k]) {
      const s = this.ctx.createBufferSource(); s.buffer = this.buffers[k]; s.loop = true; s.connect(out); s.start();
      stopFn = () => { try { s.stop(); } catch {} };
    } else stopFn = this.synthLoop(k, out);
    return {
      out,
      stop: (sec = 1.5) => { out.gain.setTargetAtTime(0.0001, this.t, sec / 3); setTimeout(() => { stopFn?.(); out.disconnect(); }, sec * 1000 + 300); },
    };
  }

  synthLoop(k, out) {
    const ctx = this.ctx;
    if (k.startsWith('bgm')) return this.pad(k, out);
    // noise beds
    const src = ctx.createBufferSource(); src.buffer = this.noise; src.loop = true;
    const f = ctx.createBiquadFilter(); const g = ctx.createGain();
    src.connect(f); f.connect(g); g.connect(out);
    const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.connect(lg); lg.connect(g.gain);
    let timer;
    if (k === 'waves') { f.type = 'lowpass'; f.frequency.value = 520; g.gain.value = 0.5; lfo.frequency.value = 0.12; lg.gain.value = 0.4; }
    else if (k === 'wind') { f.type = 'lowpass'; f.frequency.value = 380; g.gain.value = 0.4; lfo.frequency.value = 0.07; lg.gain.value = 0.3; }
    else if (k === 'chatter') { f.type = 'bandpass'; f.frequency.value = 520; f.Q.value = 1.4; g.gain.value = 0.35; lfo.frequency.value = 0.6; lg.gain.value = 0.12; }
    else if (k === 'cicadas') {
      f.type = 'bandpass'; f.frequency.value = 5200; f.Q.value = 6; g.gain.value = 0.3;
      lfo.type = 'square'; lfo.frequency.value = 38; lg.gain.value = 0.25;
      const swell = ctx.createOscillator(), sg = ctx.createGain(); swell.frequency.value = 0.09; sg.gain.value = 0.15; swell.connect(sg); sg.connect(out.gain); swell.start();
    }
    else if (k === 'gulls') {
      g.gain.value = 0; // gulls are occasional calls, not noise
      const call = () => {
        const t = this.t + 0.05;
        for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++) {
          const o = ctx.createOscillator(), og = ctx.createGain(); o.type = 'triangle';
          const st = t + i * 0.28, f0 = 1500 + Math.random() * 400;
          o.frequency.setValueAtTime(f0, st); o.frequency.exponentialRampToValueAtTime(f0 * 0.62, st + 0.24);
          og.gain.setValueAtTime(0.0001, st); og.gain.exponentialRampToValueAtTime(0.05, st + 0.03); og.gain.exponentialRampToValueAtTime(0.0001, st + 0.26);
          o.connect(og); og.connect(out); o.start(st); o.stop(st + 0.3);
        }
        timer = setTimeout(call, 4000 + Math.random() * 7000);
      };
      timer = setTimeout(call, 1500);
    }
    src.start(); lfo.start();
    return () => { clearTimeout(timer); try { src.stop(); lfo.stop(); } catch {} };
  }

  // gentle generative pad + music-box notes
  pad(k, out) {
    const ctx = this.ctx;
    const cfg = {
      bgm_home: { root: 60, chords: [[0, 4, 7, 11], [-3, 0, 4, 7], [5, 9, 12, 16], [2, 5, 9, 12]], wave: 'triangle', cut: 1300, len: 4.8, bell: 0.035 },
      bgm_mall: { root: 62, chords: [[0, 4, 7, 14], [5, 9, 12, 16], [-3, 0, 4, 9], [7, 11, 14, 17]], wave: 'triangle', cut: 2200, len: 3.6, bell: 0.04 },
      bgm_past: { root: 57, chords: [[0, 3, 7, 10], [5, 8, 12, 15], [-2, 2, 5, 9], [3, 7, 10, 14]], wave: 'sawtooth', cut: 900, len: 5.2, bell: 0.03, radio: true },
      bgm_beach: { root: 55, chords: [[0, 4, 7, 11], [5, 9, 12, 16], [-5, 0, 4, 7], [-3, 0, 4, 7]], wave: 'sine', cut: 1500, len: 6, bell: 0.03 },
    }[k] || {};
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = cfg.cut; lp.Q.value = 0.4;
    let dest = lp;
    if (cfg.radio) {
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1100; bp.Q.value = 0.7;
      lp.connect(bp); bp.connect(out); dest = lp;
      // old-radio crackle
      const cr = ctx.createBufferSource(); cr.buffer = this.noise; cr.loop = true;
      const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 3000;
      const cg = ctx.createGain(); cg.gain.value = 0.012; cr.connect(hp); hp.connect(cg); cg.connect(out); cr.start();
      this._crackle = cr;
    } else lp.connect(out);
    let i = 0, alive = true, timer;
    const crackle = this._crackle; this._crackle = null;
    const chord = () => {
      if (!alive) return;
      const t = this.t + 0.05, ch = cfg.chords[i++ % cfg.chords.length], L = cfg.len;
      ch.forEach((n, j) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = cfg.wave; o.frequency.value = mtof(cfg.root + n - 12 + (j === 0 ? -12 : 0)); o.detune.value = (Math.random() - 0.5) * 12;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.045, t + L * 0.35);
        g.gain.exponentialRampToValueAtTime(0.0001, t + L * 1.25);
        o.connect(g); g.connect(dest); o.start(t); o.stop(t + L * 1.3);
      });
      // a few music-box notes
      for (let b = 0; b < 3; b++) {
        if (Math.random() < 0.35) continue;
        const n = cfg.root + 12 + PENTA[Math.floor(Math.random() * 5)] + (Math.random() < 0.3 ? 12 : 0);
        const st = t + b * (L / 3) + Math.random() * 0.3;
        const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = mtof(n);
        g.gain.setValueAtTime(0.0001, st); g.gain.exponentialRampToValueAtTime(cfg.bell, st + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, st + 2.2);
        o.connect(g); g.connect(cfg.radio ? dest : out); o.start(st); o.stop(st + 2.3);
      }
      timer = setTimeout(chord, L * 1000);
    };
    chord();
    return () => { alive = false; clearTimeout(timer); try { crackle?.stop(); } catch {} };
  }
}
