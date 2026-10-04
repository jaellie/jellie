/*
 * ui.js — everything the player sees and touches.
 *
 * Renders the Game's current mode into #stage and the overlays (evidence
 * board, menu, settings, hints) into #overlay. Contains no story logic:
 * every decision is a call into the Game.
 *
 * Input: every action is a real <button>, so mouse, touch, keyboard (Tab /
 * Enter / Space) and screen readers all work. Extra shortcuts:
 *   1-9      choose the numbered action / choice
 *   Enter    continue dialogue          Space   continue dialogue
 *   B        evidence board             H       hints
 *   Esc      close overlay / open menu (pause)
 */
(function () {
  "use strict";
  var BGB = globalThis.BGB;
  var U = BGB.util;
  function t(k, p) {
    return BGB.i18n.t(k, p);
  }
  function T(v) {
    return BGB.i18n.T(v);
  }

  /* ---------------- tiny DOM helper ---------------- */

  function h(tag, attrs, children) {
    var e = document.createElement(tag);
    attrs = attrs || {};
    Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v === undefined || v === null || v === false) return;
      if (k === "on") Object.keys(v).forEach(function (ev) { e.addEventListener(ev, v[ev]); });
      else if (k === "class") e.className = v;
      else if (k === "text") e.textContent = v;
      else e.setAttribute(k, v === true ? "" : v);
    });
    U.asArray(children).forEach(function (c) {
      if (c === null || c === undefined || c === false) return;
      e.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return e;
  }
  function paragraphs(text) {
    return String(text || "")
      .split(/\n\s*\n/)
      .map(function (p) {
        return h("p", { text: p });
      });
  }
  function clear(e) {
    while (e.firstChild) e.removeChild(e.firstChild);
  }

  /* ---------------- app state ---------------- */

  var app = (BGB.app = {
    game: null,
    settings: null,
    meta: null,
    screen: "title", // title | game
    overlay: null, // { name, ... }
    el: {},
    h: h,
  });

  var typing = null; // { timer, finish }
  var renderKey = null;
  var pauseTimer = null;

  function sound(id) {
    BGB.audio.play(id);
  }

  /* ---------------- settings -> document ---------------- */

  app.applySettings = function () {
    var s = app.settings;
    var root = document.documentElement;
    BGB.i18n.setLang(s.lang);
    root.setAttribute("data-text-size", s.textSize);
    root.setAttribute("data-contrast", s.highContrast ? "high" : "normal");
    var reduce =
      s.reducedMotion === "on" ||
      (s.reducedMotion === "system" && globalThis.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
    root.setAttribute("data-motion", reduce ? "reduce" : "full");
    root.setAttribute("data-effects", s.memoryEffects);
    BGB.audio.setVolumes(s);
    BGB.save.saveSettings(s);
  };

  app.applyMemory = function () {
    var g = app.game;
    var root = document.documentElement;
    var m = g ? g.state.memory : 100;
    var inPlay = app.screen === "game";
    root.setAttribute("data-memory", inPlay ? g.memoryTier() : "stable");
    root.style.setProperty("--instability", inPlay ? ((100 - m) / 100).toFixed(3) : "0");
    BGB.audio.setMemory(inPlay ? m : 100);
  };

  /* ---------------- notifications ---------------- */

  var toastQueue = [];
  var toastBusy = false;
  app.toast = function (msg) {
    toastQueue.push(msg);
    if (!toastBusy) nextToast();
  };
  function nextToast() {
    var m = toastQueue.shift();
    var box = app.el.toast;
    if (!m) {
      toastBusy = false;
      box.classList.remove("show");
      return;
    }
    toastBusy = true;
    clear(box);
    var icon = m.kind === "evidence" ? "◆" : m.kind === "contradiction" ? "≠" : "·";
    box.appendChild(h("span", { class: "toast-icon", "aria-hidden": "true", text: icon }));
    box.appendChild(h("span", { text: m.text }));
    box.classList.add("show");
    if (m.kind) sound(m.kind);
    setTimeout(function () {
      box.classList.remove("show");
      setTimeout(nextToast, 350);
    }, 2600);
  }

  function announce(text) {
    var live = app.el.live;
    live.textContent = "";
    setTimeout(function () {
      live.textContent = text;
    }, 30);
  }

  /* ---------------- typewriter ---------------- */

  var SPEED = { instant: 0, fast: 90, normal: 45, slow: 24 }; // characters per second

  function stopTyping() {
    if (typing) {
      clearInterval(typing.timer);
      typing = null;
    }
  }
  function typeInto(node, text, instant, done) {
    stopTyping();
    var cps = SPEED[app.settings.textSpeed] || 0;
    if (instant || !cps || !text) {
      node.textContent = text;
      done();
      return;
    }
    var i = 0;
    node.textContent = "";
    var step = Math.max(1, Math.round(cps / 30));
    typing = {
      finish: function () {
        stopTyping();
        node.textContent = text;
        done();
      },
    };
    typing.timer = setInterval(function () {
      i = Math.min(text.length, i + step);
      node.textContent = text.slice(0, i);
      if (i >= text.length) typing.finish();
    }, 1000 / 30);
  }

  /* ---------------- HUD ---------------- */

  function currentFx() {
    var g = app.game;
    var fx = [];
    if (!g || app.screen !== "game") return fx;
    var mode = g.state.ui.mode;
    if (mode === "scene" || mode === "topics" || mode === "dialogue") {
      var sv = g.sceneView();
      if (sv) fx = fx.concat(sv.fx);
    }
    if (mode === "dialogue") {
      var dv = g.dialogueView();
      if (dv) fx = fx.concat(dv.fx);
    }
    if (mode === "ending") {
      var st = g.endingStep();
      if (st) fx = fx.concat(st.fx);
    }
    return fx;
  }

  // Deterministic: the same line always distorts the same way.
  function memoryGlitch(kind) {
    var g = app.game;
    var tier = g.memoryTier();
    var key = (g.state.ui.node || g.state.scene || "") + ":" + kind;
    var r = U.hash01(key);
    if (kind === "clock") return (tier === "fragmented" && r < 0.25) || (tier === "final" && r < 0.5);
    if (kind === "echo") return (tier === "unsteady" && r < 0.15) || (tier === "fragmented" && r < 0.3) || (tier === "final" && r < 0.45);
    return false;
  }

  function renderHud() {
    var g = app.game;
    var hud = app.el.hud;
    clear(hud);
    if (app.screen !== "game") return;
    var ch = g.currentChapter();
    hud.appendChild(h("span", { class: "hud-chapter", text: ch ? T(ch.title) : "" }));
    var fx = currentFx();
    var glitch = fx.indexOf("clock1147") !== -1 || memoryGlitch("clock");
    var shown = glitch ? "23:47" : g.state.clock;
    var c = h("span", {
      class: "hud-clock" + (glitch ? " is-stuck" : ""),
      role: "timer",
      "aria-label": t("hud.clock", { time: BGB.i18n.formatClock(shown) }),
      text: BGB.i18n.formatClock(shown),
    });
    hud.appendChild(c);
  }

  function renderToolbar() {
    var bar = app.el.toolbar;
    clear(bar);
    if (app.screen !== "game") return;
    var mode = app.game.state.ui.mode;
    var playing = mode !== "ending" && mode !== "end";
    if (playing) {
      bar.appendChild(btn("toolbar.board", "B", function () { app.openOverlay("board"); }));
      bar.appendChild(btn("toolbar.hint", "H", function () { app.openOverlay("hint"); }));
    }
    bar.appendChild(btn("toolbar.menu", "Esc", function () { app.openOverlay("menu"); }));
    function btn(key, shortcut, fn) {
      return h("button", { class: "tool", type: "button", on: { click: fn } }, [
        h("span", { text: t(key) }),
        h("kbd", { "aria-hidden": "true", text: shortcut }),
      ]);
    }
  }

  /* ---------------- main render ---------------- */

  app.render = function () {
    stopTyping();
    clearTimeout(pauseTimer);
    var stage = app.el.stage;
    var root = document.documentElement;
    root.setAttribute("data-screen", app.screen === "game" ? app.game.state.ui.mode : "title");
    clear(stage);
    app.applyMemory();
    if (app.screen === "title") {
      root.setAttribute("data-fx", "");
      stage.appendChild(renderTitle());
    } else {
      var g = app.game;
      var mode = g.state.ui.mode;
      var fx = currentFx();
      if (memoryGlitch("echo")) fx.push("echo");
      root.setAttribute("data-fx", fx.join(" "));
      syncAudio();
      var view =
        mode === "scene" ? renderScene() :
        mode === "topics" ? renderTopics() :
        mode === "dialogue" ? renderDialogue() :
        mode === "chapterCard" ? renderChapterCard() :
        mode === "ending" ? renderEnding() :
        mode === "end" ? renderEnd() : null;
      if (view) stage.appendChild(view);
    }
    renderHud();
    renderToolbar();
    if (app.overlay) renderOverlay();
    else focusFirst(stage);
  };

  function focusFirst(container) {
    var f = container.querySelector("[data-autofocus]") || container.querySelector("button, [href], input, select");
    if (f) f.focus({ preventScroll: false });
  }

  function syncAudio() {
    var g = app.game;
    var pick = function (spec) {
      if (!spec) return null;
      if (!Array.isArray(spec)) return spec;
      for (var i = 0; i < spec.length; i++) if (g.check(spec[i].conditions)) return spec[i];
      return null;
    };
    var chapter = g.currentChapter() || {};
    var scene = g.data.scenes[g.state.scene] || {};
    var spec = Object.assign({}, pick(chapter.audio) || {}, pick(scene.audio) || {});
    if (g.state.ui.mode === "dialogue") {
      var node = g.data.dialogue[g.state.ui.node];
      if (node && node.audio) Object.assign(spec, pick(node.audio));
    }
    if (g.state.ui.mode === "ending") {
      var e = g.data.endings[g.state.ui.ending];
      Object.assign(spec, pick(e.audio) || { music: null, ambience: [] });
    }
    BGB.audio.set(spec);
  }

  function numbered(list, onPick, extraClass) {
    return h(
      "ol",
      { class: "choices " + (extraClass || "") },
      list.map(function (item, i) {
        return h("li", {}, [
          h(
            "button",
            {
              type: "button",
              class: "choice",
              "data-key": i < 9 ? String(i + 1) : null,
              "data-autofocus": i === 0 ? true : null,
              on: {
                click: function () {
                  sound("ui_select");
                  onPick(item, i);
                },
              },
            },
            [
              h("span", { class: "num", "aria-hidden": "true", text: i < 9 ? i + 1 + "." : "·" }),
              h("span", { class: "label", text: item.label }),
              item.isNew ? h("span", { class: "new", text: t("label.new") }) : null,
            ]
          ),
        ]);
      })
    );
  }

  function renderTitle() {
    var meta = app.meta;
    var auto = BGB.save.readSlot("auto");
    var after = meta.completedRuns > 0;
    var items = [];
    if (auto.ok) items.push({ label: t("title.continue"), fn: function () { app.loadSlot("auto"); } });
    items.push({ label: t("title.new"), fn: function () { app.startNew(1); } });
    if (after) items.push({ label: t("title.again"), fn: function () { app.startNew(meta.completedRuns + 1); } });
    if (BGB.save.hasAny()) items.push({ label: t("title.load"), fn: function () { app.openOverlay("load"); } });
    items.push({ label: t("title.settings"), fn: function () { app.openOverlay("settings"); } });
    var other = BGB.i18n.languages().filter(function (l) { return l !== BGB.i18n.lang; })[0];
    if (other) items.push({ label: t("lang.switchTo." + other), fn: function () { app.settings.lang = other; app.applySettings(); app.render(); } });
    return h("section", { class: "title-screen", "aria-labelledby": "game-title" }, [
      h("h1", { id: "game-title", class: "game-title", text: t("game.title") }),
      h("p", { class: "subtitle", text: t(after ? "title.subtitleAfter" : "title.subtitle") }),
      numbered(items, function (it) { it.fn(); }, "title-menu"),
      BGB.save.available ? null : h("p", { class: "fine", text: t("save.unavailable") }),
    ]);
  }

  function renderScene() {
    var g = app.game;
    var v = g.sceneView();
    if (!v) return h("p", { text: "?" });
    var actions = v.actions.map(function (a) { return { label: a.label, isNew: a.isNew, id: a.id }; });
    return h("section", { class: "scene", "aria-labelledby": "scene-title", "data-mood": v.mood || null }, [
      h("h1", { id: "scene-title", class: "scene-title", text: T(v.title) }),
      h("div", { class: "scene-text" }, paragraphs(T(v.text))),
      h("h2", { class: "sr-only", text: t("scene.actions") }),
      numbered(actions, function (a) { g.doAction(a.id); }),
    ]);
  }

  var presentOpen = false;
  function renderTopics() {
    var g = app.game;
    var npc = g.state.ui.npc;
    var c = g.data.characters[npc];
    var topics = g.topicList(npc).map(function (x) { return { label: T(x.label), isNew: x.isNew, id: x.id }; });
    var kids = [
      h("h1", { class: "scene-title", id: "talk-title", text: T(c.name) }),
      c.look ? h("div", { class: "scene-text" }, paragraphs(T(g.pickText(c.look)))) : null,
      h("h2", { class: "sr-only", text: t("talk.topics") }),
      numbered(topics, function (x) { presentOpen = false; g.chooseTopic(x.id); }),
    ];
    var ev = g.evidenceList();
    var row = h("div", { class: "row" }, [
      ev.length
        ? h("button", { type: "button", class: "quiet", "aria-expanded": presentOpen ? "true" : "false", on: { click: function () { presentOpen = !presentOpen; app.render(); } } }, t("talk.present"))
        : null,
      h("button", { type: "button", class: "quiet", "data-autofocus": topics.length ? null : true, on: { click: function () { presentOpen = false; g.leaveTalk(); } } }, t("talk.leave")),
    ]);
    kids.push(row);
    if (presentOpen && ev.length) {
      kids.push(
        h("div", { class: "present", role: "group", "aria-label": t("talk.present") },
          ev.map(function (e) {
            return h("button", { type: "button", class: "chip", on: { click: function () { presentOpen = false; g.presentEvidence(e.id); } } }, T(e.title));
          }))
      );
    }
    return h("section", { class: "talk", "aria-labelledby": "talk-title" }, kids);
  }

  function speakerName(id) {
    if (!id || id === "narrator") return null;
    if (id === "choice") return t("log.you");
    var c = app.game.data.characters[id];
    return c ? T(c.name) : id;
  }

  function renderDialogue() {
    var g = app.game;
    var v = g.dialogueView();
    if (!v) return null;
    var text = T(v.text);
    var name = speakerName(v.speaker);
    var log = g.state.log;
    var prev = log.length > 1 ? log[log.length - 2] : null;
    var key = "d:" + v.id + ":" + BGB.i18n.lang;
    var instant = key === renderKey || (v.seenBefore && app.settings.skipSeen);
    renderKey = key;

    var textEl = h("p", { class: "line-text", "aria-hidden": "true" });
    var echo = h("p", { class: "line-echo", "aria-hidden": "true", text: text });
    var after = h("div", { class: "after" });
    var section = h("section", { class: "dialogue", "data-speaker": v.speaker || "narrator", "aria-label": t("dialogue.region") }, [
      prev ? h("p", { class: "prev", "aria-hidden": "true", text: (speakerName(prev.s) ? speakerName(prev.s) + " — " : "") + T(prev.t) }) : null,
      h("div", { class: "line", on: { click: function () { if (typing) typing.finish(); } } }, [
        name ? h("p", { class: "speaker", text: name }) : null,
        h("div", { class: "line-body" }, [echo, textEl]),
      ]),
      after,
    ]);
    announce((name ? name + ": " : "") + text);

    function showAfter() {
      textEl.removeAttribute("aria-hidden");
      clear(after);
      if (v.choices.length) {
        after.appendChild(numbered(v.choices.map(function (c) { return { label: T(c.text) }; }), function (c, i) { g.choose(i); }));
      } else {
        after.appendChild(
          h("button", { type: "button", class: "continue", "data-autofocus": true, on: { click: function () { sound("page"); g.advance(); } } }, [
            h("span", { text: t("dialogue.continue") }),
            h("span", { "aria-hidden": "true", text: " ▸" }),
          ])
        );
        if (v.seenBefore) after.appendChild(h("button", { type: "button", class: "quiet", on: { click: skipSeen } }, t("dialogue.skip")));
      }
      if (!app.overlay) focusFirst(after);
    }
    // Before typing finishes, a focused "finish" target keeps Enter/Space working.
    after.appendChild(h("button", { type: "button", class: "continue ghost", "data-autofocus": true, on: { click: function () { if (typing) typing.finish(); } } }, t("dialogue.continue")));
    setTimeout(function () {
      typeInto(textEl, text, instant, showAfter);
    }, 0);
    return section;
  }

  function skipSeen() {
    var g = app.game;
    var guard = 0;
    while (guard++ < 200 && g.state.ui.mode === "dialogue") {
      var v = g.dialogueView();
      if (!v || !v.seenBefore || v.choices.length) break;
      g.advance();
    }
  }

  function renderChapterCard() {
    var g = app.game;
    var id = g.state.ui.chapter;
    var ch = g.data.chapters[id];
    return h("section", { class: "chapter-card", "aria-labelledby": "chapter-title" }, [
      h("p", { class: "chapter-label", text: ch.label ? T(ch.label) : t("chapter.label", { n: g.chapterIndex(id) + 1 }) }),
      h("h1", { id: "chapter-title", class: "chapter-title", text: T(ch.title) }),
      ch.subtitle ? h("p", { class: "chapter-sub", text: T(ch.subtitle) }) : null,
      h("button", { type: "button", class: "continue", "data-autofocus": true, on: { click: function () { sound("page"); g.continueChapterCard(); } } }, t("dialogue.continue")),
    ]);
  }

  function renderEnding() {
    var g = app.game;
    var st = g.endingStep();
    if (!st) return null;
    var text = T(st.text);
    var name = speakerName(st.speaker);
    var section = h("section", { class: "ending", "aria-label": T(st.ending.title) });
    if (!text && st.pause) {
      // silence: wait, then move on by itself (paused while a menu is open)
      section.appendChild(h("p", { class: "sr-only", text: t("ending.silence") }));
      var wait = function () {
        pauseTimer = setTimeout(function () {
          if (app.overlay) return wait();
          g.advanceEnding();
        }, st.pause);
      };
      wait();
      return section;
    }
    if (name) section.appendChild(h("p", { class: "speaker", text: name }));
    var p = h("p", { class: "ending-text" });
    section.appendChild(p);
    var after = h("div", { class: "after" });
    section.appendChild(after);
    announce((name ? name + ": " : "") + text);
    setTimeout(function () {
      typeInto(p, text, false, function () {
        after.appendChild(h("button", { type: "button", class: "continue subtle", "data-autofocus": true, "aria-label": t("dialogue.continue"), on: { click: function () { g.advanceEnding(); } } }, "▸"));
        if (!app.overlay) focusFirst(after);
      });
    }, 0);
    return section;
  }

  function renderEnd() {
    var g = app.game;
    var e = g.data.endings[g.state.ui.ending] || {};
    return h("section", { class: "end-screen" }, [
      h("h1", { class: "chapter-title", text: T(e.title) }),
      e.epilogue ? h("p", { class: "chapter-sub", text: T(e.epilogue) }) : null,
      numbered(
        [
          { label: t("end.again"), fn: function () { app.startNew((app.meta.completedRuns || 1) + 1); } },
          { label: t("end.title"), fn: function () { app.toTitle(); } },
        ],
        function (x) { x.fn(); }
      ),
    ]);
  }

  /* ---------------- overlays ---------------- */

  var lastFocus = null;
  app.openOverlay = function (name, data) {
    if (!app.overlay) lastFocus = document.activeElement;
    app.overlay = Object.assign({ name: name }, data || {});
    if (typing) typing.finish();
    sound("ui_select");
    renderOverlay();
  };
  app.closeOverlay = function () {
    var was = app.overlay && app.overlay.name;
    app.overlay = null;
    var ov = app.el.overlay;
    clear(ov);
    ov.hidden = true;
    app.el.main.removeAttribute("inert");
    // Board actions (compare, theories) may complete a chapter; settle now.
    if (was === "board" && app.screen === "game" && app.game.state.ui.mode === "scene") app.game.settle();
    else app.render();
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
  };

  function renderOverlay() {
    var o = app.overlay;
    var ov = app.el.overlay;
    var builders = { board: buildBoard, hint: buildHint, menu: buildMenu, save: buildSlots, load: buildSlots, settings: buildSettings, confirm: buildConfirm };
    if (o.name === "debug" && BGB.debug) return BGB.debug.render(ov);
    var b = builders[o.name];
    if (!b) return;
    var keepFocus = document.activeElement && ov.contains(document.activeElement) ? document.activeElement.getAttribute("data-fid") : null;
    clear(ov);
    ov.hidden = false;
    app.el.main.setAttribute("inert", "");
    var body = b(o);
    var panel = h("div", { class: "panel panel-" + o.name, role: "dialog", "aria-modal": "true", "aria-labelledby": "panel-title" }, [
      h("div", { class: "panel-head" }, [
        h("h2", { id: "panel-title", text: t("panel." + o.name) }),
        h("button", { type: "button", class: "quiet close", "aria-label": t("panel.close"), on: { click: app.closeOverlay } }, "✕"),
      ]),
      body,
    ]);
    ov.appendChild(panel);
    var f = (keepFocus && ov.querySelector('[data-fid="' + keepFocus + '"]')) || panel.querySelector("[data-autofocus]") || panel.querySelector(".panel-head + * button, .panel-head + * input, .panel-head + * select") || panel.querySelector(".close");
    if (f) f.focus();
  }
  app.renderOverlay = renderOverlay;

  /* --- evidence board --- */

  var RELIABILITY_ICON = { firsthand: "●", document: "■", testimony: "◐", hearsay: "○", memory: "◌", unknown: "?" };
  var CONTRA_ICON = { unresolved: "○", partial: "◐", resolved: "●", ambiguous: "◌" };

  function buildBoard(o) {
    var g = app.game;
    o.tab = o.tab || "evidence";
    o.sel = o.sel || [];
    var tabs = ["evidence", "contradictions", "theories", "timeline", "log"];
    var tablist = h("div", { class: "tabs", role: "tablist", "aria-label": t("panel.board") },
      tabs.map(function (id) {
        return h("button", {
          type: "button", role: "tab", id: "tab-" + id, "data-fid": "tab-" + id,
          "aria-selected": o.tab === id ? "true" : "false",
          "aria-controls": "tabpanel",
          tabindex: o.tab === id ? "0" : "-1",
          on: {
            click: function () { o.tab = id; o.msg = null; renderOverlay(); },
            keydown: function (e) {
              var i = tabs.indexOf(id);
              if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                e.preventDefault();
                o.tab = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
                renderOverlay();
                var nt = app.el.overlay.querySelector("#tab-" + o.tab);
                if (nt) nt.focus();
              }
            },
          },
        }, t("board." + id));
      }));
    var pane = h("div", { class: "tabpanel", id: "tabpanel", role: "tabpanel", "aria-labelledby": "tab-" + o.tab });
    ({ evidence: boardEvidence, contradictions: boardContradictions, theories: boardTheories, timeline: boardTimeline, log: boardLog })[o.tab](pane, o, g);
    return h("div", { class: "board" }, [tablist, pane]);
  }

  function boardEvidence(pane, o, g) {
    var list = g.evidenceList();
    if (!list.length) return pane.appendChild(h("p", { class: "empty", text: t("board.noEvidence") }));
    pane.appendChild(h("p", { class: "fine", text: t("board.compareHelp") }));
    var grid = h("ul", { class: "cards" });
    list.forEach(function (e) {
      var selected = o.sel.indexOf(e.id) !== -1;
      var badges = [];
      if (e.isNew) badges.push(t("label.new"));
      if (e.changed) badges.push(t("board.changed"));
      grid.appendChild(h("li", {}, h("button", {
        type: "button", class: "card", "data-fid": "ev-" + e.id, "aria-pressed": selected ? "true" : "false",
        on: {
          click: function () {
            var i = o.sel.indexOf(e.id);
            if (i === -1) { o.sel.push(e.id); if (o.sel.length > 2) o.sel.shift(); }
            else o.sel.splice(i, 1);
            o.focus = e.id;
            o.msg = null;
            renderOverlay();
          },
        },
      }, [
        h("span", { class: "card-check", "aria-hidden": "true", text: selected ? "☑" : "☐" }),
        h("span", { class: "card-title", text: T(e.title) }),
        h("span", { class: "card-kind", text: t("kind." + e.kind) }),
        badges.length ? h("span", { class: "new", text: badges.join(" · ") }) : null,
      ])));
    });
    pane.appendChild(grid);

    var focusId = o.focus || (o.sel.length ? o.sel[o.sel.length - 1] : null);
    if (focusId && g.state.evidence[focusId]) {
      var e = g.evidenceView(focusId);
      g.markEvidenceViewed(focusId);
      pane.appendChild(h("article", { class: "detail", "aria-live": "polite" }, [
        h("h3", { text: T(e.title) }),
        h("p", { class: "meta" }, [
          e.source ? h("span", { text: t("board.source") + ": " + T(e.source) }) : null,
          h("span", {}, [h("span", { "aria-hidden": "true", text: (RELIABILITY_ICON[e.reliability] || "?") + " " }), t("board.reliability") + ": " + t("reliability." + e.reliability)]),
        ]),
        h("div", {}, paragraphs(T(e.text))),
        e.changed ? h("p", { class: "fine", text: t("board.changedHelp") }) : null,
      ]));
    }

    var canCompare = o.sel.length === 2;
    pane.appendChild(h("div", { class: "row" }, [
      h("button", { type: "button", "data-fid": "compare", disabled: !canCompare, on: {
        click: function () {
          var r = g.compare(o.sel[0], o.sel[1]);
          o.msg = { result: r.result, text: t("compare." + r.result) };
          if (r.result === "new") sound("contradiction");
          renderOverlay();
        },
      } }, t(canCompare ? "board.compare" : "board.selectTwo")),
    ]));
    if (o.msg) pane.appendChild(h("p", { class: "compare-msg", role: "status", "data-result": o.msg.result, text: o.msg.text }));
  }

  function boardContradictions(pane, o, g) {
    var list = g.contradictionList();
    if (!list.length) return pane.appendChild(h("p", { class: "empty", text: t("board.noContradictions") }));
    pane.appendChild(h("ul", { class: "list" }, list.map(function (c) {
      var names = (c.between || []).map(function (id) { return g.data.evidence[id] ? T(g.data.evidence[id].title) : id; }).join("  ≠  ");
      return h("li", { class: "contra", "data-state": c.state }, [
        h("h3", {}, [h("span", { "aria-hidden": "true", text: CONTRA_ICON[c.state] + " " }), T(c.title)]),
        h("p", { class: "meta", text: t("contra." + c.state) + (names ? " — " + names : "") }),
        h("p", { text: T(c.text) }),
      ]);
    })));
  }

  function boardTheories(pane, o, g) {
    var list = g.deductionList();
    if (!list.length) return pane.appendChild(h("p", { class: "empty", text: t("board.noTheories") }));
    pane.appendChild(h("p", { class: "fine", text: t("board.theoryHelp") }));
    list.forEach(function (d) {
      var box = h("fieldset", { class: "theory" + (d.solved ? " solved" : "") }, [h("legend", { text: T(d.question) })]);
      if (d.solved) {
        var opt = d.options.filter(function (x) { return x.id === d.answer; })[0];
        box.appendChild(h("p", {}, [h("span", { "aria-hidden": "true", text: "● " }), t("theory.confirmed") + ": " + (opt ? T(opt.text) : "")]));
      } else {
        d.options.forEach(function (op) {
          var tried = d.attempts.indexOf(op.id) !== -1;
          box.appendChild(h("button", { type: "button", class: "choice", "data-fid": "th-" + d.id + "-" + op.id, on: {
            click: function () {
              var r = g.deduce(d.id, op.id);
              o.msg = { id: d.id, result: r.result, text: T(r.text) || t("theory." + r.result) };
              renderOverlay();
            },
          } }, [h("span", { class: "label", text: T(op.text) }), tried ? h("span", { class: "new", text: t("theory.tried") }) : null]));
        });
      }
      if (o.msg && o.msg.id === d.id) box.appendChild(h("p", { class: "compare-msg", role: "status", "data-result": o.msg.result, text: o.msg.text }));
      pane.appendChild(box);
    });
  }

  function boardTimeline(pane, o, g) {
    var list = g.timelineView();
    if (!list.some(function (x) { return x.known; })) return pane.appendChild(h("p", { class: "empty", text: t("board.noTimeline") }));
    pane.appendChild(h("ol", { class: "timeline" }, list.map(function (x) {
      return h("li", { class: x.known ? "known" : "unknown" }, [
        h("span", { class: "time", text: x.time ? BGB.i18n.formatClock(x.time) : "??:??" }),
        h("span", { text: x.known ? T(x.text) : t("timeline.unknown") }),
      ]);
    })));
  }

  function boardLog(pane, o, g) {
    var log = g.state.log;
    if (!log.length) return pane.appendChild(h("p", { class: "empty", text: t("board.noLog") }));
    pane.appendChild(h("ol", { class: "log" }, log.slice(-120).map(function (l) {
      var n = speakerName(l.s);
      return h("li", { class: l.s === "choice" ? "you" : "" }, [n ? h("strong", { text: n + " " }) : null, T(l.t)]);
    })));
  }

  /* --- hints --- */

  function buildHint(o) {
    var g = app.game;
    var v = g.hintView();
    var box = h("div", { class: "hints" });
    if (!v.goal) {
      box.appendChild(h("p", { text: t("hint.none") }));
      return box;
    }
    box.appendChild(h("p", { class: "fine", text: t("hint.intro") }));
    v.revealed.forEach(function (txt, i) {
      box.appendChild(h("p", { class: "hint-line" }, [h("strong", { text: t("hint.level" + (i + 1)) + " " }), T(txt)]));
    });
    if (v.canReveal) {
      var strong = v.level === 2;
      if (strong && !o.confirmStrong) {
        box.appendChild(h("p", { class: "fine", text: t("hint.strongWarning") }));
        box.appendChild(h("button", { type: "button", "data-autofocus": true, on: { click: function () { o.confirmStrong = true; g.revealHint(); renderOverlay(); } } }, t("hint.showStrong")));
      } else {
        box.appendChild(h("button", { type: "button", "data-autofocus": true, on: { click: function () { g.revealHint(); renderOverlay(); } } }, t(v.level === 0 ? "hint.show" : "hint.more")));
      }
    }
    return box;
  }

  /* --- menu / save / load --- */

  function buildMenu() {
    var items = [
      { k: "menu.resume", fn: app.closeOverlay },
      { k: "menu.save", fn: function () { app.openOverlay("save"); } },
      { k: "menu.load", fn: function () { app.openOverlay("load"); } },
      { k: "menu.settings", fn: function () { app.openOverlay("settings", { back: "menu" }); } },
      { k: "menu.title", fn: function () { app.overlay = null; app.closeOverlay(); app.toTitle(); } },
    ];
    var box = h("div", { class: "menu" }, [h("p", { class: "fine", text: t("menu.paused") })]);
    items.forEach(function (it, i) {
      box.appendChild(h("button", { type: "button", class: "choice", "data-autofocus": i === 0 ? true : null, on: { click: it.fn } }, t(it.k)));
    });
    return box;
  }

  function slotLabel(s) {
    if (!s.ok) return t(s.reason === "corrupted" ? "save.corrupted" : "save.empty");
    var sum = s.summary || {};
    var parts = [T(sum.chapter), T(sum.scene), BGB.i18n.formatClock(sum.clock)];
    if (sum.playthrough > 1) parts.push(t("save.playthrough", { n: sum.playthrough }));
    var d = new Date(s.savedAt);
    parts.push(d.toLocaleString(BGB.i18n.lang === "ko" ? "ko-KR" : "en-US", { dateStyle: "short", timeStyle: "short" }));
    return parts.filter(Boolean).join(" · ");
  }

  function buildSlots(o) {
    var saving = o.name === "save";
    var box = h("div", { class: "slots" });
    if (!BGB.save.available) box.appendChild(h("p", { class: "fine", text: t("save.unavailable") }));
    BGB.save.list().forEach(function (s) {
      if (saving && s.slot === "auto") return;
      var name = s.slot === "auto" ? t("save.auto") : t("save.slot", { n: s.slot });
      var disabled = !saving && !s.ok;
      box.appendChild(h("button", { type: "button", class: "slot", disabled: disabled, "data-fid": "slot-" + s.slot, on: {
        click: function () {
          if (saving) {
            var doSave = function () {
              BGB.save.write(s.slot, app.game);
              app.toast({ text: t("save.done", { slot: name }) });
              app.openOverlay("save");
            };
            if (s.ok) app.openOverlay("confirm", { text: t("save.overwrite", { slot: name }), yes: doSave, back: "save" });
            else doSave();
          } else {
            var doLoad = function () { app.overlay = null; app.closeOverlay(); app.loadSlot(s.slot); };
            if (app.screen === "game") app.openOverlay("confirm", { text: t("load.confirm"), yes: doLoad, back: "load" });
            else doLoad();
          }
        },
      } }, [h("strong", { text: name }), h("span", { text: slotLabel(s) })]));
    });
    box.appendChild(h("button", { type: "button", class: "quiet", on: { click: function () { if (app.screen === "game") app.openOverlay("menu"); else app.closeOverlay(); } } }, t("panel.back")));
    return box;
  }

  function buildConfirm(o) {
    return h("div", { class: "confirm" }, [
      h("p", { text: o.text }),
      h("div", { class: "row" }, [
        h("button", { type: "button", on: { click: o.yes } }, t("confirm.yes")),
        h("button", { type: "button", "data-autofocus": true, on: { click: function () { app.openOverlay(o.back || "menu"); } } }, t("confirm.no")),
      ]),
    ]);
  }

  /* --- settings --- */

  function buildSettings(o) {
    var s = app.settings;
    var form = h("form", { class: "settings", on: { submit: function (e) { e.preventDefault(); } } });
    function changed() {
      app.applySettings();
      renderOverlay();
      if (!app.overlay) app.render();
    }
    function select(key, label, options, getter, setter) {
      var id = "set-" + key;
      var sel = h("select", { id: id, "data-fid": id, on: { change: function () { setter(sel.value); changed(); app.render(); } } },
        options.map(function (op) {
          return h("option", { value: op, selected: String(getter()) === String(op) ? true : null }, t(label + "." + op));
        }));
      return h("div", { class: "field" }, [h("label", { for: id, text: t(label) }), sel]);
    }
    function range(key) {
      var id = "vol-" + key;
      var inp = h("input", { id: id, "data-fid": id, type: "range", min: "0", max: "1", step: "0.05", value: String(s.volume[key]),
        on: { input: function () { s.volume[key] = Number(inp.value); app.applySettings(); } } });
      return h("div", { class: "field" }, [h("label", { for: id, text: t("settings.volume." + key) }), inp]);
    }
    form.appendChild(select("lang", "settings.lang", BGB.i18n.languages(), function () { return BGB.i18n.lang; }, function (v) { s.lang = v; }));
    form.appendChild(select("textSpeed", "settings.textSpeed", ["slow", "normal", "fast", "instant"], function () { return s.textSpeed; }, function (v) { s.textSpeed = v; }));
    form.appendChild(select("textSize", "settings.textSize", ["s", "m", "l", "xl"], function () { return s.textSize; }, function (v) { s.textSize = v; }));
    form.appendChild(select("contrast", "settings.contrast", ["normal", "high"], function () { return s.highContrast ? "high" : "normal"; }, function (v) { s.highContrast = v === "high"; }));
    form.appendChild(select("motion", "settings.motion", ["system", "on", "off"], function () { return s.reducedMotion; }, function (v) { s.reducedMotion = v; }));
    form.appendChild(select("effects", "settings.effects", ["full", "gentle"], function () { return s.memoryEffects; }, function (v) { s.memoryEffects = v; }));
    form.appendChild(select("skipSeen", "settings.skipSeen", ["off", "on"], function () { return s.skipSeen ? "on" : "off"; }, function (v) { s.skipSeen = v === "on"; }));
    form.appendChild(h("h3", { text: t("settings.audio") }));
    ["master", "music", "ambience", "sfx"].forEach(function (k) { form.appendChild(range(k)); });
    form.appendChild(select("muted", "settings.muted", ["off", "on"], function () { return s.muted ? "on" : "off"; }, function (v) { s.muted = v === "on"; }));
    form.appendChild(h("button", { type: "button", class: "quiet", on: { click: function () { if (o.back) app.openOverlay(o.back); else app.closeOverlay(); } } }, t("panel.back")));
    return form;
  }

  /* ---------------- flow ---------------- */

  function clearToasts() {
    toastQueue.length = 0;
  }

  app.startNew = function (playthrough) {
    clearToasts();
    app.screen = "game";
    renderKey = null;
    app.game.newGame({ playthrough: playthrough });
    app.render();
  };

  app.loadSlot = function (slot) {
    var r = BGB.save.readSlot(slot);
    if (!r.ok) {
      app.toast({ text: t(r.reason === "corrupted" ? "save.corrupted" : "save.empty") });
      return false;
    }
    clearToasts();
    app.screen = "game";
    renderKey = null;
    app.game.loadState(r.state);
    app.render();
    app.toast({ text: t("load.done") });
    return true;
  };

  app.toTitle = function () {
    if (app.screen === "game") BGB.save.write("auto", app.game);
    app.screen = "title";
    BGB.audio.set({ music: "theme", ambience: [] });
    app.render();
  };

  /* ---------------- keyboard ---------------- */

  function onKey(e) {
    BGB.audio.unlock();
    var tag = (e.target && e.target.tagName) || "";
    var typingField = tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA";
    if (e.key === "Escape") {
      e.preventDefault();
      if (app.overlay) app.closeOverlay();
      else if (app.screen === "game") app.openOverlay("menu");
      return;
    }
    if (typingField || e.ctrlKey || e.metaKey || e.altKey) return;
    if (app.overlay) {
      // simple focus trap
      if (e.key === "Tab") {
        var f = app.el.overlay.querySelectorAll("button:not([disabled]), select, input, [tabindex='0']");
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
      return;
    }
    if (app.screen !== "game") {
      return digit(e);
    }
    var mode = app.game.state.ui.mode;
    var k = e.key.toLowerCase();
    if (k === "b" && mode !== "ending" && mode !== "end") { e.preventDefault(); return app.openOverlay("board"); }
    if (k === "h" && mode !== "ending" && mode !== "end") { e.preventDefault(); return app.openOverlay("hint"); }
    if ((e.key === "Enter" || e.key === " ") && (mode === "dialogue" || mode === "ending")) {
      if (typing) { e.preventDefault(); typing.finish(); return; }
      if (tag !== "BUTTON") {
        e.preventDefault();
        var c = app.el.stage.querySelector(".continue:not(.ghost)");
        if (c) c.click();
      }
      return;
    }
    digit(e);
  }
  function digit(e) {
    if (/^[1-9]$/.test(e.key)) {
      var b = app.el.stage.querySelector('[data-key="' + e.key + '"]');
      if (b) { e.preventDefault(); b.click(); }
    }
  }

  /* ---------------- boot ---------------- */

  app.init = function (game, settings, meta) {
    app.game = game;
    app.settings = settings;
    app.meta = meta;
    ["main", "stage", "hud", "toolbar", "overlay", "toast", "live"].forEach(function (id) {
      app.el[id] = document.getElementById(id);
    });
    if (!settings.lang) {
      var nav = (navigator.language || "en").slice(0, 2);
      settings.lang = BGB.story.data.strings[nav] ? nav : "en";
    }
    app.applySettings();
    if (globalThis.matchMedia) {
      var mq = matchMedia("(prefers-reduced-motion: reduce)");
      if (mq.addEventListener) mq.addEventListener("change", app.applySettings);
    }

    game.on("view", function () { if (app.screen === "game") app.render(); });
    game.on("memory", app.applyMemory);
    game.on("notify", app.toast);
    game.on("sound", sound);
    game.on("fx", function (id) {
      var root = document.documentElement;
      root.classList.add("fx-" + id);
      setTimeout(function () { root.classList.remove("fx-" + id); }, 2600);
    });
    var saveTimer = null;
    game.on("autosave", function () {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(function () { if (app.screen === "game") BGB.save.write("auto", game); }, 200);
    });
    game.on("complete", function () { BGB.save.saveMeta(game.meta); });

    // Never lose progress when the tab closes or is hidden.
    var flush = function () { if (app.screen === "game") BGB.save.write("auto", game); BGB.save.saveMeta(game.meta); };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden") flush(); });

    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", function () { BGB.audio.unlock(); }, { once: false });
    app.el.overlay.addEventListener("click", function (e) { if (e.target === app.el.overlay) app.closeOverlay(); });

    BGB.audio.set({ music: "theme", ambience: [] });
    app.render();
  };
})();
