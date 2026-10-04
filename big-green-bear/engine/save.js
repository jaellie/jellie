/*
 * save.js — save slots, autosave, settings, and cross-playthrough "meta".
 *
 * Storage keys (browser localStorage, this game only — nothing else is touched):
 *   bgb.save.auto        autosave (written constantly, small)
 *   bgb.save.1 .. .3     manual slots
 *   bgb.meta             things that survive New Game+: endings seen,
 *                        completed runs, "seen ever" dialogue (for skipping)
 *   bgb.settings         language, text speed, volume, accessibility
 *
 * If storage is unavailable (private mode, blocked), the game keeps working
 * in memory and warns once. A corrupted save is reported, never loaded
 * half-way, and never deletes other slots.
 */
(function () {
  "use strict";
  var BGB = globalThis.BGB;
  var PREFIX = "bgb.";
  var SLOTS = ["auto", "1", "2", "3"];
  var SAVE_FORMAT = 1;

  var mem = {}; // fallback storage
  var store = (function () {
    try {
      var ls = globalThis.localStorage;
      var k = PREFIX + "__test";
      ls.setItem(k, "1");
      ls.removeItem(k);
      return ls;
    } catch (e) {
      return null;
    }
  })();

  function get(key) {
    try {
      return store ? store.getItem(PREFIX + key) : mem[key] || null;
    } catch (e) {
      return mem[key] || null;
    }
  }
  function set(key, value) {
    try {
      if (store) store.setItem(PREFIX + key, value);
      else mem[key] = value;
      return true;
    } catch (e) {
      mem[key] = value;
      return false;
    }
  }
  function del(key) {
    try {
      if (store) store.removeItem(PREFIX + key);
    } catch (e) {}
    delete mem[key];
  }
  function read(key) {
    var raw = get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return { corrupted: true };
    }
  }

  // Older save formats are upgraded here, one version at a time.
  var migrations = {
    // 1: function (save) { ...; save.format = 2; return save; }
  };
  function migrate(save) {
    var guard = 0;
    while (save.format < SAVE_FORMAT && migrations[save.format] && guard++ < 20) save = migrations[save.format](save);
    return save;
  }

  var DEFAULT_SETTINGS = {
    lang: null, // null = detect
    textSpeed: "normal", // instant | fast | normal | slow
    textSize: "m", // s | m | l | xl
    highContrast: false,
    reducedMotion: "system", // system | on | off
    memoryEffects: "full", // full | gentle
    skipSeen: false,
    volume: { master: 0.8, music: 0.6, ambience: 0.7, sfx: 0.7 },
    muted: false,
  };

  BGB.save = {
    SLOTS: SLOTS,
    available: !!store,

    loadSettings: function () {
      var s = read("settings");
      var out = BGB.util.clone(DEFAULT_SETTINGS);
      if (s && !s.corrupted) {
        Object.keys(s).forEach(function (k) {
          if (k === "volume") Object.assign(out.volume, s.volume || {});
          else out[k] = s[k];
        });
      }
      return out;
    },
    saveSettings: function (s) {
      set("settings", JSON.stringify(s));
    },

    loadMeta: function () {
      var m = read("meta");
      if (!m || m.corrupted) m = {};
      m.seenEver = m.seenEver || {};
      m.endingsSeen = m.endingsSeen || {};
      m.completedRuns = m.completedRuns || 0;
      return m;
    },
    saveMeta: function (meta) {
      set("meta", JSON.stringify(meta));
    },

    // Writes the game's full state plus a small summary for the slot list.
    write: function (slot, game) {
      var st = game.state;
      var ch = game.data.chapters[st.chapter];
      var sc = game.data.scenes[st.scene];
      var payload = {
        format: SAVE_FORMAT,
        stateVersion: BGB.Game.STATE_VERSION,
        savedAt: Date.now(),
        summary: {
          chapter: ch ? ch.title : null,
          scene: sc ? sc.title : null,
          clock: st.clock,
          playthrough: st.playthrough,
        },
        state: st,
      };
      var ok = set("save." + slot, JSON.stringify(payload));
      BGB.save.saveMeta(game.meta);
      return ok;
    },

    // Returns { ok, state } or { ok:false, reason }
    readSlot: function (slot) {
      var s = read("save." + slot);
      if (!s) return { ok: false, reason: "empty" };
      if (s.corrupted || !s.state) return { ok: false, reason: "corrupted" };
      s = migrate(s);
      return { ok: true, state: s.state, summary: s.summary, savedAt: s.savedAt };
    },

    list: function () {
      return SLOTS.map(function (slot) {
        var r = BGB.save.readSlot(slot);
        return { slot: slot, ok: r.ok, reason: r.reason, summary: r.summary, savedAt: r.savedAt };
      });
    },

    remove: function (slot) {
      del("save." + slot);
    },

    hasAny: function () {
      return SLOTS.some(function (s) {
        return BGB.save.readSlot(s).ok;
      });
    },

    // Debug "reset": wipes this game's keys only.
    wipeAll: function () {
      SLOTS.forEach(function (s) {
        del("save." + s);
      });
      del("meta");
    },
  };
})();
