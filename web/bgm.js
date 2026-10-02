// Background music: "Step by Step" on the title + character setup, "Sunset Homecoming" for the whole game
// (play + ending). Crossfades when the screen changes. Browsers only allow sound after a tap, so it
// starts on the first touch/click (the START button counts).
(() => {
  const TRACKS = { menu: "audio/step-by-step.m4a", game: "audio/sunset-homecoming.m4a" };
  const VOLUME = 0.45, FADE_OUT = 1200, FADE_IN = 1800;
  const audio = {};
  for (const [k, src] of Object.entries(TRACKS)) {
    const a = new Audio(src);
    a.loop = true; a.preload = "auto"; a.volume = 0;
    audio[k] = a;
  }
  let want = "menu", playing = null, unlocked = false;
  const fades = new Map();

  function fade(a, to, ms, then) {
    clearInterval(fades.get(a));
    const from = a.volume, t0 = performance.now();
    const id = setInterval(() => {
      const k = Math.min(1, (performance.now() - t0) / ms);
      a.volume = Math.max(0, Math.min(1, from + (to - from) * k));
      if (k >= 1) { clearInterval(id); fades.delete(a); then && then(); }
    }, 40);
    fades.set(a, id);
  }

  function apply() {
    if (!unlocked || document.hidden || want === playing) return;
    const prev = playing ? audio[playing] : null, next = audio[want];
    playing = want;
    if (prev) fade(prev, 0, FADE_OUT, () => prev.pause());
    const start = () => { next.play().then(() => fade(next, VOLUME, FADE_IN)).catch(() => { playing = null; }); };
    // Fade out first, then fade the new track in.
    prev ? setTimeout(start, FADE_OUT * 0.6) : start();
  }

  function setScreen(screen) {
    want = screen === "play" || screen === "end" ? "game" : "menu";
    apply();
  }

  // First tap anywhere unlocks sound.
  const unlock = () => { if (unlocked) return; unlocked = true; apply(); };
  addEventListener("pointerdown", unlock, { capture: true });
  addEventListener("keydown", unlock, { capture: true });

  // Pause when the app goes to the background; resume when it comes back.
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { for (const a of Object.values(audio)) a.pause(); playing = null; }
    else apply();
  });

  // Follow the game's screen (title / setup / play / end): watch React state changes.
  const hook = setInterval(() => {
    const R = window.React;
    if (!R || !R.Component) return;
    clearInterval(hook);
    const orig = R.Component.prototype.setState;
    R.Component.prototype.setState = function (partial, cb) {
      return orig.call(this, partial, (...args) => {
        // Claude Design's runtime keeps the screen in the host's logic state.
        const s = (this.logic && this.logic.state && this.logic.state.screen) || (this.state && this.state.screen);
        if (typeof s === "string") setScreen(s);
        if (cb) return cb.apply(this, args);
      });
    };
  }, 30);

  window.__bgm = { setScreen, audio };
})();
