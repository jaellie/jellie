/*
 * i18n.js — localization.
 *
 * Two kinds of text:
 *   1. UI strings, looked up by key:      BGB.i18n.t("menu.save")
 *      (defined in content/locales/*.js)
 *   2. Story text, written inline in content as an object per language:
 *        text: { en: "The rain isn't that bad.", ko: "비 별로 안 와요." }
 *      resolved with:                     BGB.i18n.T(textObject)
 *
 * Why inline story text? Translators see the original line right next to
 * theirs, which encourages natural translation instead of literal
 * word-for-word substitution, and nothing can get "out of sync" by key.
 */
(function () {
  "use strict";
  var BGB = globalThis.BGB;
  var FALLBACK = "en";
  var lang = FALLBACK;
  var missing = {};

  function note(what) {
    if (!missing[what]) {
      missing[what] = true;
      if (BGB.story.data.config.debug && typeof console !== "undefined") {
        console.warn("[i18n] missing: " + what);
      }
    }
  }

  BGB.i18n = {
    get lang() {
      return lang;
    },
    setLang: function (l) {
      lang = BGB.story.data.strings[l] ? l : FALLBACK;
      if (typeof document !== "undefined") document.documentElement.lang = lang;
      return lang;
    },
    languages: function () {
      return Object.keys(BGB.story.data.strings);
    },
    missing: missing,

    // UI string by key, with {param} substitution.
    t: function (key, params) {
      var table = BGB.story.data.strings[lang] || {};
      var s = table[key];
      if (s === undefined) {
        note(lang + ":" + key);
        s = (BGB.story.data.strings[FALLBACK] || {})[key];
      }
      if (s === undefined) s = key;
      if (params) {
        s = s.replace(/\{(\w+)\}/g, function (m, p) {
          return params[p] !== undefined ? params[p] : m;
        });
      }
      return s;
    },

    // Story text: string (same in all languages) or { en, ko, ... }.
    T: function (v) {
      if (v === undefined || v === null) return "";
      if (typeof v === "string") return v;
      if (v[lang] !== undefined) return v[lang];
      note(lang + ":" + JSON.stringify(v).slice(0, 60));
      if (v[FALLBACK] !== undefined) return v[FALLBACK];
      var k = Object.keys(v)[0];
      return k ? v[k] : "";
    },

    // "23:47" -> "11:47 PM" / "오후 11:47"
    formatClock: function (hhmm) {
      if (!hhmm) return "";
      var p = String(hhmm).split(":");
      var h = parseInt(p[0], 10);
      var m = p[1] || "00";
      if (isNaN(h)) return String(hhmm);
      var pm = h >= 12;
      var h12 = h % 12 === 0 ? 12 : h % 12;
      return BGB.i18n.t(pm ? "clock.pm" : "clock.am", { time: h12 + ":" + m });
    },
  };
})();
