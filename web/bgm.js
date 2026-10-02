// Background music: "Step by Step" on the title + character setup, "Sunset Homecoming" for the whole game
// (play, the time-skip screen, the ending). Crossfades when the screen changes.
// Phones only allow sound after a real tap (touchend / click — not the first touch-down), so every tap
// retries until the music is actually playing. iPhones ignore audio.volume: there the tracks just swap.
(() => {
  const TRACKS = { menu: "audio/step-by-step.m4a", game: "audio/sunset-homecoming.m4a" };
  const VOLUME = 0.45, FADE_OUT = 1200, FADE_IN = 1800;
  const canFade = (() => { try { const t = new Audio(); t.volume = 0.5; return Math.abs(t.volume - 0.5) < 0.01; } catch { return false; } })();
  const audio = {};
  for (const [k, src] of Object.entries(TRACKS)) {
    const a = new Audio(src);
    a.loop = true; a.preload = "auto"; a.playsInline = true; a.setAttribute("playsinline", "");
    a.volume = canFade ? 0 : 1;
    audio[k] = a;
  }
  let want = "menu", playing = null, unlocked = false;
  let muted = false;
  try { muted = localStorage.getItem("bgm-muted") === "1"; } catch {}
  const fades = new Map();

  function fade(a, to, ms, then) {
    clearInterval(fades.get(a));
    if (!canFade) { then && then(); return; }
    const from = a.volume, t0 = performance.now();
    const id = setInterval(() => {
      const k = Math.min(1, (performance.now() - t0) / ms);
      a.volume = Math.max(0, Math.min(1, from + (to - from) * k));
      if (k >= 1) { clearInterval(id); fades.delete(a); then && then(); }
    }, 40);
    fades.set(a, id);
  }

  // Only the wanted track may ever play: anything else that is still sounding gets faded out and
  // paused, and a play() that finishes after the wish changed (or after muting) is stopped again.
  const ok = (a) => !muted && !document.hidden && audio[want] === a;
  function start(a) {
    if (!ok(a)) return;
    const p = a.play();
    const went = () => { if (ok(a)) fade(a, VOLUME, FADE_IN); else { clearInterval(fades.get(a)); a.pause(); } };
    if (p && p.then) p.then(went).catch(() => { if (playing && audio[playing] === a) playing = null; });
    else went();
  }

  function apply() {
    if (!unlocked || document.hidden || muted) return;
    const next = audio[want];
    let leaving = false;
    for (const [k, a] of Object.entries(audio)) if (k !== want && !a.paused) {
      leaving = true;
      fade(a, 0, canFade ? FADE_OUT : 0, () => { if (audio[want] !== a) a.pause(); });
    }
    if (want === playing && !next.paused) return;
    playing = want;
    // Fade out first, then fade the new track in (straight swap where fades don't work).
    leaving && canFade ? setTimeout(() => start(next), FADE_OUT * 0.6) : start(next);
  }

  const log = [];
  function setScreen(screen) {
    log.push(screen); if (log.length > 400) log.shift();
    // Only the title and character setup get "Step by Step"; everything in the game (play, the
    // "시간이 흐른다" skip screen, the ending…) stays on "Sunset Homecoming".
    want = screen === "title" || screen === "setup" ? "menu" : "game";
    apply();
  }

  // Every real tap (until the music is going) unlocks/retries sound — inside the gesture itself.
  const gesture = () => {
    unlocked = true;
    const a = audio[want];
    if (a.paused || playing !== want) apply();
  };
  for (const ev of ["touchend", "pointerup", "click", "keydown"]) addEventListener(ev, gesture, { capture: true, passive: true });

  // Pause when the app goes to the background; resume when it comes back.
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { for (const a of Object.values(audio)) a.pause(); playing = null; }
    else apply();
  });

  // Follow the game's screen (title / setup / play / end). Claude Design's runtime keeps it in the
  // host component's logic state; every state change goes through React's setState.
  const hook = setInterval(() => {
    const R = window.React;
    if (!R || !R.Component) return;
    clearInterval(hook);
    const orig = R.Component.prototype.setState;
    R.Component.prototype.setState = function (partial, cb) {
      return orig.call(this, partial, (...args) => {
        const s = (this.logic && this.logic.state && this.logic.state.screen) || (this.state && this.state.screen);
        if (typeof s === "string") setScreen(s);
        if (cb) return cb.apply(this, args);
      });
    };
  }, 30);

  // 🔊 / 🔇 button in the top-right corner (remembered on this device).
  function setMuted(m) {
    muted = m;
    try { localStorage.setItem("bgm-muted", m ? "1" : "0"); } catch {}
    if (m) { for (const a of Object.values(audio)) { clearInterval(fades.get(a)); a.pause(); } playing = null; }
    else if (unlocked) apply();
    if (btn) { btn.textContent = m ? "🔇" : "🔊"; btn.setAttribute("aria-label", m ? "Music on" : "Music off"); }
  }
  let btn = null;
  function addButton() {
    btn = document.createElement("button");
    btn.type = "button";
    btn.style.cssText = "position:fixed;z-index:2147483000;top:calc(env(safe-area-inset-top,0px) + 6px);right:calc(env(safe-area-inset-right,0px) + 8px);width:32px;height:32px;padding:0;border:2px solid rgba(255,255,255,.35);border-radius:8px;background:rgba(26,20,32,.55);color:#fff;font-size:16px;line-height:28px;text-align:center;cursor:pointer;opacity:.85";
    btn.addEventListener("click", (e) => { e.stopPropagation(); unlocked = true; setMuted(!muted); });
    for (const ev of ["pointerdown", "pointerup", "touchstart", "touchend"]) btn.addEventListener(ev, (e) => e.stopPropagation());
    document.body.appendChild(btn);
    setMuted(muted);
  }
  if (document.body) addButton(); else document.addEventListener("DOMContentLoaded", addButton);

  window.__bgm = { setScreen, audio, canFade, log, setMuted, get muted() { return muted; } };
})();
