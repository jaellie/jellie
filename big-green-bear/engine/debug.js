/*
 * debug.js — developer panel. Open with F2 (or the "debug" button) when
 * config.debug is true. In a production build set `debug: false` in
 * content/config.js AND remove this <script> tag from index.html — then the
 * panel does not exist at all.
 */
(function () {
  "use strict";
  var BGB = globalThis.BGB;
  if (!BGB.story.data.config.debug) return;

  var T = function (v) { return BGB.i18n.T(v); };
  var tab = "state";
  var report = null;

  function h() { return BGB.app.h.apply(null, arguments); }
  function g() { return BGB.app.game; }
  function refresh() { BGB.app.renderOverlay(); }
  function ensureGame() {
    if (BGB.app.screen !== "game") {
      BGB.app.screen = "game";
      g().newGame({ playthrough: 1 });
      g().continueChapterCard();
    }
  }
  function after() {
    g().settle();
    BGB.app.render();
  }

  function select(options, current, onChange, label) {
    var s = h("select", { "aria-label": label, on: { change: function () { onChange(s.value); } } },
      options.map(function (o) { return h("option", { value: o, selected: o === current ? true : null }, o); }));
    return s;
  }
  function row(label, kids) {
    return h("div", { class: "field" }, [h("label", { text: label })].concat(kids));
  }
  function button(text, fn) {
    return h("button", { type: "button", on: { click: function () { fn(); refresh(); } } }, text);
  }

  var tabs = {
    state: function () {
      var game = g();
      var st = game.state;
      var box = h("div", {});
      var ids = game.data.order;
      box.appendChild(row("Chapter", [
        select(ids.chapters, st.chapter, function () {}, "chapter"),
        button("Jump", function () {
          ensureGame();
          var v = box.querySelector("select").value;
          game.beginChapter(v);
          after();
        }),
      ]));
      var sceneSel = select(ids.scenes, st.scene, function () {}, "scene");
      box.appendChild(row("Scene", [sceneSel, button("Go", function () { ensureGame(); game.goTo(sceneSel.value); BGB.app.render(); })]));
      var mem = h("input", { type: "range", min: "0", max: "100", value: String(st.memory), "aria-label": "memory" });
      var memOut = h("output", { text: String(st.memory) });
      mem.addEventListener("input", function () { game.setMemory(Number(mem.value)); memOut.textContent = mem.value + " (" + game.memoryTier() + ")"; BGB.app.render(); BGB.app.renderOverlay(); });
      box.appendChild(row("Memory", [mem, memOut]));
      var clock = h("input", { type: "text", value: st.clock, size: "6", "aria-label": "clock" });
      box.appendChild(row("Clock", [clock, button("Set", function () { st.clock = clock.value; BGB.app.render(); })]));
      box.appendChild(row("Playthrough", [
        h("output", { text: String(st.playthrough) + (st.playthrough > 1 ? " (NG+)" : "") }),
        button("Toggle NG+", function () { st.playthrough = st.playthrough > 1 ? 1 : 2; BGB.app.render(); }),
      ]));
      var fk = h("input", { type: "text", placeholder: "flag id", "aria-label": "flag id" });
      var fv = h("input", { type: "text", placeholder: "true / 3 / text", size: "10", "aria-label": "flag value" });
      box.appendChild(row("Flag", [fk, fv, button("Set", function () {
        var v = fv.value.trim();
        var parsed = v === "" || v === "true" ? true : v === "false" ? false : isNaN(Number(v)) ? v : Number(v);
        st.flags[fk.value.trim()] = parsed;
        after();
      })]));
      box.appendChild(h("pre", { class: "dump", text: JSON.stringify({
        chapter: st.chapter, scene: st.scene, ui: st.ui, clock: st.clock, memory: st.memory + " (" + game.memoryTier() + ")",
        playthrough: st.playthrough, turns: st.turns, flags: st.flags, hypotheses: st.hypotheses, hints: st.hints, ending: st.ending,
      }, null, 2) }));
      return box;
    },

    evidence: function () {
      var game = g();
      var box = h("div", {});
      box.appendChild(h("div", { class: "row" }, [
        button("Unlock all", function () { game.data.order.evidence.forEach(function (id) { game.unlockEvidence(id); }); }),
      ]));
      game.story.list("evidence").forEach(function (e) {
        var has = !!game.state.evidence[e.id];
        var view = has ? game.evidenceView(e.id) : null;
        box.appendChild(h("div", { class: "dbg-item" }, [
          h("strong", { text: (has ? "◆ " : "◇ ") + e.id }),
          " ",
          has ? null : button("unlock", function () { game.unlockEvidence(e.id); }),
          h("p", { text: "Shown now: " + (view ? T(view.text) + "  [interp " + view.interpretation + "]" : "—") }),
          h("p", { class: "fine", text: "Real meaning: " + (e.realMeaning || "—") }),
        ]));
      });
      return box;
    },

    contradictions: function () {
      var game = g();
      var box = h("div", {});
      game.story.list("contradictions").forEach(function (c) {
        var rec = game.state.contradictions[c.id];
        box.appendChild(h("div", { class: "dbg-item" }, [
          h("strong", { text: c.id + " — " + (rec ? rec.state : "not found") }),
          h("p", { class: "fine", text: "between: " + (c.between || []).join(" × ") }),
          h("div", { class: "row" }, ["unresolved", "partial", "resolved", "ambiguous"].map(function (s) {
            return button(s, function () { game.advanceContradiction(c.id, s); });
          })),
        ]));
      });
      box.appendChild(h("h3", { text: "Theories" }));
      game.story.list("deductions").forEach(function (d) {
        var hy = game.state.hypotheses[d.id];
        box.appendChild(h("p", { text: d.id + ": " + (hy ? (hy.correct ? "confirmed (" + hy.answer + ")" : "tried " + hy.attempts.join(", ")) : "—") + " | answer: " + d.answer }));
      });
      return box;
    },

    dialogue: function () {
      var game = g();
      var box = h("div", {});
      var sel = select(game.data.order.dialogue, null, function () {}, "node");
      box.appendChild(row("Node", [sel, button("Play", function () {
        ensureGame();
        BGB.app.overlay = null;
        BGB.app.closeOverlay();
        game.startDialogue(sel.value);
      })]));
      var en = select(game.data.order.endings, null, function () {}, "ending");
      box.appendChild(row("Ending", [en, button("Play", function () {
        ensureGame();
        BGB.app.overlay = null;
        BGB.app.closeOverlay();
        game.startEnding(en.value);
      })]));
      box.appendChild(row("NG+", [button("Start a new NG+ run", function () {
        BGB.app.overlay = null;
        BGB.app.closeOverlay();
        BGB.app.startNew(2);
      })]));
      return box;
    },

    validate: function () {
      report = report || BGB.validate(BGB.story);
      var box = h("div", {});
      box.appendChild(button("Re-run", function () { report = BGB.validate(BGB.story); }));
      box.appendChild(h("p", { text: report.errors.length + " errors, " + report.warnings.length + " warnings" }));
      box.appendChild(h("pre", { class: "dump", text: report.errors.map(function (e) { return "ERROR  " + e; }).concat(report.warnings.map(function (w) { return "warn   " + w; })).join("\n") || "All good." }));
      box.appendChild(h("h3", { text: "Runtime warnings" }));
      box.appendChild(h("pre", { class: "dump", text: g().warnings.join("\n") || "none" }));
      box.appendChild(h("h3", { text: "Audio" }));
      box.appendChild(h("pre", { class: "dump", text: JSON.stringify(BGB.audio.status()) }));
      return box;
    },

    reset: function () {
      return h("div", {}, [
        h("p", { text: "Deletes this game's saves and meta (endings seen, NG+ unlock). Settings are kept. Nothing outside this game is touched." }),
        button("Wipe saves + meta and return to title", function () {
          BGB.save.wipeAll();
          var m = BGB.save.loadMeta();
          BGB.app.meta = m;
          g().meta = m;
          BGB.app.overlay = null;
          BGB.app.closeOverlay();
          BGB.app.screen = "title";
          BGB.app.render();
        }),
      ]);
    },
  };

  BGB.debug = {
    render: function (ov) {
      while (ov.firstChild) ov.removeChild(ov.firstChild);
      ov.hidden = false;
      var nav = h("div", { class: "tabs", role: "tablist" }, Object.keys(tabs).map(function (k) {
        return h("button", { type: "button", role: "tab", "aria-selected": k === tab ? "true" : "false", on: { click: function () { tab = k; refresh(); } } }, k);
      }));
      ov.appendChild(h("div", { class: "panel panel-debug", role: "dialog", "aria-modal": "true", "aria-label": "Debug" }, [
        h("div", { class: "panel-head" }, [
          h("h2", { text: "Debug" }),
          h("button", { type: "button", class: "quiet close", "aria-label": "Close", on: { click: BGB.app.closeOverlay } }, "✕"),
        ]),
        nav,
        tabs[tab](),
      ]));
    },
  };

  document.addEventListener("keydown", function (e) {
    if (e.key === "F2") {
      e.preventDefault();
      if (BGB.app.overlay && BGB.app.overlay.name === "debug") BGB.app.closeOverlay();
      else BGB.app.openOverlay("debug");
    }
  });
  document.addEventListener("DOMContentLoaded", function () {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "debug-toggle";
    b.textContent = "debug (F2)";
    b.addEventListener("click", function () { BGB.app.openOverlay("debug"); });
    document.body.appendChild(b);
    var r = BGB.validate(BGB.story);
    report = r;
    if (r.errors.length) console.error("[content] " + r.errors.length + " errors:\n" + r.errors.join("\n"));
    if (r.warnings.length) console.warn("[content] " + r.warnings.length + " warnings:\n" + r.warnings.join("\n"));
  });
})();
