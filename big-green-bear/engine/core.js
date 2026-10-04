/*
 * core.js — shared namespace, tiny helpers, and the STORY REGISTRY.
 *
 * Every engine and content file is a plain <script> (no modules, no build step),
 * so the game runs by double-clicking index.html. Everything hangs off one
 * global object: BGB.
 *
 * Content files never touch engine internals. They only call the registration
 * functions on BGB.story (e.g. BGB.story.dialogue({...})).
 */
(function () {
  "use strict";
  var BGB = (globalThis.BGB = globalThis.BGB || {});

  /* ---------------- small helpers ---------------- */

  BGB.util = {
    clone: function (v) {
      return v === undefined ? undefined : JSON.parse(JSON.stringify(v));
    },
    isObj: function (v) {
      return v !== null && typeof v === "object" && !Array.isArray(v);
    },
    // Deterministic 0..1 value from a string, so "random" distortions are
    // the same every time (intentional, reproducible, testable).
    hash01: function (str) {
      var h = 2166136261;
      for (var i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
      }
      return ((h >>> 0) % 10000) / 10000;
    },
    asArray: function (v) {
      if (v === undefined || v === null) return [];
      return Array.isArray(v) ? v : [v];
    },
  };

  /* ---------------- event bus ---------------- */

  BGB.Emitter = function () {
    this._h = {};
  };
  BGB.Emitter.prototype.on = function (name, fn) {
    (this._h[name] = this._h[name] || []).push(fn);
    return this;
  };
  BGB.Emitter.prototype.emit = function (name, payload) {
    (this._h[name] || []).slice().forEach(function (fn) {
      fn(payload);
    });
    (this._h["*"] || []).slice().forEach(function (fn) {
      fn(name, payload);
    });
  };

  /* ---------------- story registry ---------------- */

  var CATEGORIES = [
    "characters",
    "scenes",
    "dialogue",
    "evidence",
    "contradictions",
    "deductions",
    "chapters",
    "hints",
    "timeline",
    "endings",
    "sounds",
  ];

  var data = { config: {}, strings: {}, order: {} };
  CATEGORIES.forEach(function (c) {
    data[c] = {};
    data.order[c] = [];
  });

  var registryWarnings = [];

  function register(category, entries) {
    Object.keys(entries).forEach(function (id) {
      if (data[category][id]) {
        registryWarnings.push(category + ' "' + id + '" was defined twice; the later one wins.');
      } else {
        data.order[category].push(id);
      }
      var entry = entries[id];
      entry.id = id;
      data[category][id] = entry;
    });
  }

  BGB.story = {
    data: data,
    registryWarnings: registryWarnings,
    config: function (cfg) {
      Object.assign(data.config, cfg);
    },
    // UI strings: BGB.story.strings("en", { "menu.save": "Save" })
    strings: function (lang, table) {
      data.strings[lang] = Object.assign(data.strings[lang] || {}, table);
    },
    // In registration order (order matters for hints, chapters, timeline).
    list: function (category) {
      return data.order[category].map(function (id) {
        return data[category][id];
      });
    },
  };
  CATEGORIES.forEach(function (c) {
    BGB.story[c] = function (entries) {
      register(c, entries);
    };
  });
})();
