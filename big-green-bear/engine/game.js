/*
 * game.js — the HEADLESS GAME CORE.
 *
 * No DOM code lives here. The Game object owns the story state and exposes
 * plain methods (enter a scene, advance dialogue, compare evidence...).
 * The UI (ui.js) calls those methods and re-renders when the Game emits
 * events. Because the core is headless, the whole game can be played from a
 * test script (see tests/), which is how we prove there are no soft-locks.
 *
 * "Modes" (state.ui.mode) — exactly one is active at a time:
 *   scene        looking at a location, choosing actions
 *   topics       talking to an NPC, choosing what to ask
 *   dialogue     reading a dialogue line / picking a choice
 *   chapterCard  "Chapter 2 — ..." title card between chapters
 *   ending       playing an ending sequence step by step
 *   end          ending finished (offer New Game+)
 * The mode is saved, so saving mid-dialogue resumes on the same line.
 */
(function () {
  "use strict";
  var BGB = globalThis.BGB;
  var U = BGB.util;
  var R = BGB.rules;

  var STATE_VERSION = 1;
  var LOG_LIMIT = 300;

  function defaultState(story, playthrough) {
    var cfg = story.data.config;
    var first = story.list("chapters")[0];
    return {
      version: STATE_VERSION,
      playthrough: playthrough || 1,
      chapter: first ? first.id : null,
      scene: (first && first.startScene) || cfg.startScene || null,
      clock: cfg.startClock || "17:00",
      memory: first && first.memory !== undefined ? first.memory : 100,
      flags: {},
      evidence: {}, // id -> { n, chapter, viewed (interpretation index last seen, null = never) }
      contradictions: {}, // id -> { n, state }
      hypotheses: {}, // deductionId -> { attempts: [], correct, answer }
      hints: {}, // goalId -> highest level revealed (1..3)
      seen: {}, // dialogue node ids seen this playthrough
      visited: {}, // scene ids visited this playthrough
      fired: {}, // one-time events already fired
      turns: 0,
      counter: 0,
      log: [],
      queue: [],
      ui: { mode: "scene" },
      ending: null,
    };
  }

  function Game(story, meta) {
    BGB.Emitter.call(this);
    this.story = story;
    this.data = story.data;
    this.meta = meta || { seenEver: {}, completedRuns: 0, endingsSeen: {} };
    this.warnings = [];
    this.state = defaultState(story, 1);
  }
  Game.prototype = Object.create(BGB.Emitter.prototype);
  var G = Game.prototype;

  Object.defineProperty(G, "queue", {
    get: function () {
      return this.state.queue;
    },
  });

  G.warn = function (msg) {
    if (this.warnings.indexOf(msg) === -1) this.warnings.push(msg);
    if (this.data.config.debug && typeof console !== "undefined") console.warn("[game] " + msg);
    this.emit("warn", msg);
  };
  G.check = function (conds) {
    return R.check(conds, this);
  };
  G.apply = function (effects) {
    R.apply(effects, this);
  };

  /* ---------------- text ---------------- */

  // Any text-bearing object can have: text, ngPlusText, variants: [{conditions, text}]
  // Priority: first matching variant > ngPlusText (on NG+) > text.
  G.pickText = function (obj) {
    if (!obj) return undefined;
    var vs = obj.variants || [];
    for (var i = 0; i < vs.length; i++) {
      if (this.check(vs[i].conditions)) return vs[i].text;
    }
    if (this.state.playthrough > 1 && obj.ngPlusText !== undefined) return obj.ngPlusText;
    return obj.text;
  };

  /* ---------------- lifecycle ---------------- */

  G.newGame = function (opts) {
    opts = opts || {};
    this.state = defaultState(this.story, opts.playthrough || 1);
    var first = this.story.list("chapters")[0];
    if (first) {
      this.state.ui = { mode: "chapterCard", chapter: first.id, first: true };
      this.emit("view");
    } else {
      this.enterScene(this.state.scene);
      this.settle();
    }
  };

  // Load a state object from a save. Repairs anything that no longer matches
  // the content (renamed scenes, deleted nodes) instead of crashing.
  G.loadState = function (raw) {
    var s = Object.assign(defaultState(this.story, raw && raw.playthrough), U.clone(raw || {}));
    var d = this.data;
    ["flags", "evidence", "contradictions", "hypotheses", "hints", "seen", "visited", "fired"].forEach(function (k) {
      if (!U.isObj(s[k])) s[k] = {};
    });
    if (!Array.isArray(s.log)) s.log = [];
    if (!Array.isArray(s.queue)) s.queue = [];
    if (!U.isObj(s.ui)) s.ui = { mode: "scene" };
    if (typeof s.memory !== "number" || isNaN(s.memory)) s.memory = 100;
    if (!d.chapters[s.chapter]) {
      this.warn('Save referenced missing chapter "' + s.chapter + '"');
      s.chapter = (this.story.list("chapters")[0] || {}).id || null;
    }
    if (!d.scenes[s.scene]) {
      this.warn('Save referenced missing scene "' + s.scene + '"');
      var ch = d.chapters[s.chapter];
      s.scene = (ch && ch.startScene) || d.config.startScene;
    }
    var ui = s.ui;
    var ok =
      (ui.mode === "scene") ||
      (ui.mode === "topics" && d.characters[ui.npc]) ||
      (ui.mode === "dialogue" && d.dialogue[ui.node]) ||
      (ui.mode === "chapterCard" && d.chapters[ui.chapter]) ||
      (ui.mode === "ending" && d.endings[ui.ending]) ||
      ui.mode === "end";
    if (!ok) {
      this.warn("Save had an unrecoverable screen (" + ui.mode + "); returning to the scene.");
      s.ui = { mode: "scene" };
    }
    this.state = s;
    this.emit("memory", s.memory);
    this.emit("view");
  };

  /* ---------------- chapters ---------------- */

  G.chapterIndex = function (id) {
    return this.data.order.chapters.indexOf(id);
  };
  G.currentChapter = function () {
    return this.data.chapters[this.state.chapter];
  };

  G.continueChapterCard = function () {
    var ui = this.state.ui;
    if (ui.mode !== "chapterCard") return;
    this.beginChapter(ui.chapter);
    this.settle();
  };

  G.beginChapter = function (id) {
    var ch = this.data.chapters[id];
    if (!ch) return this.warn('Unknown chapter "' + id + '"');
    var prev = this.state.chapter;
    this.state.chapter = id;
    this.state.flags["chapter_" + id + "_started"] = true;
    if (prev && prev !== id) this.state.flags["chapter_" + prev + "_completed"] = true;
    if (ch.memory !== undefined) this.setMemory(ch.memory);
    if (ch.clock) this.state.clock = ch.clock;
    this.state.ui = { mode: "scene" };
    this.apply(ch.onEnter);
    if (ch.startScene) this.enterScene(ch.startScene);
    this.emit("chapter", id);
    this.emit("autosave");
  };

  function chapterReady(g) {
    var ch = g.currentChapter();
    if (!ch || !ch.next || !ch.completeWhen) return null;
    if (g.state.flags["chapter_" + ch.id + "_completed"]) return null;
    return g.check(ch.completeWhen) ? ch.next : null;
  }

  /* ---------------- scenes ---------------- */

  G.enterScene = function (id) {
    var sc = this.data.scenes[id];
    if (!sc) return this.warn('Unknown scene "' + id + '"');
    var first = !this.state.visited[id];
    this.state.scene = id;
    this.state.visited[id] = true;
    this.state.ui = { mode: "scene" };
    this.apply(sc.onEnter);
    if (first) this.apply(sc.onFirstEnter);
    this.emit("scene", id);
    this.emit("autosave");
  };

  G.goTo = function (id) {
    this.enterScene(id);
    this.settle();
  };

  function actionId(a) {
    return a.id || a.type + ":" + (a.npc || a.to || a.dialogue || "");
  }

  G.sceneView = function () {
    var g = this;
    var sc = this.data.scenes[this.state.scene];
    if (!sc) return null;
    var actions = (sc.actions || [])
      .filter(function (a) {
        if (a.once && g.state.fired["action:" + sc.id + ":" + actionId(a)]) return false;
        return g.check(a.conditions);
      })
      .map(function (a) {
        return { id: actionId(a), type: a.type, label: g.actionLabel(a), isNew: g.actionIsNew(a), raw: a };
      });
    return {
      id: sc.id,
      title: sc.title,
      text: this.pickText(sc),
      fx: U.asArray(sc.fx),
      mood: sc.mood,
      actions: actions,
    };
  };

  G.actionLabel = function (a) {
    var T = BGB.i18n.T;
    if (a.label) return T(this.pickText({ text: a.label, variants: a.labelVariants }));
    if (a.type === "talk") {
      var c = this.data.characters[a.npc];
      return BGB.i18n.t("action.talk", { name: c ? T(c.name) : a.npc });
    }
    if (a.type === "go") {
      var s = this.data.scenes[a.to];
      return BGB.i18n.t("action.go", { place: s ? T(s.title) : a.to });
    }
    return a.dialogue || "?";
  };

  G.actionIsNew = function (a) {
    if (a.type === "go") return !this.state.visited[a.to];
    if (a.type === "talk") {
      var g = this;
      return this.topicList(a.npc).some(function (t) {
        return t.isNew;
      });
    }
    if (a.dialogue) return !this.state.seen[a.dialogue];
    return false;
  };

  G.doAction = function (id) {
    if (this.state.ui.mode !== "scene") return;
    var view = this.sceneView();
    var act = view && view.actions.filter(function (a) {
      return a.id === id;
    })[0];
    if (!act) return this.warn('Action "' + id + '" is not available here');
    var a = act.raw;
    this.state.turns++;
    if (a.once) this.state.fired["action:" + view.id + ":" + act.id] = true;
    this.apply(a.effects);
    if (a.type === "go") return this.goTo(a.to);
    if (a.type === "talk") return this.openTalk(a.npc);
    if (a.dialogue) return this.startDialogue(a.dialogue);
    this.settle();
  };

  /* ---------------- talking (topics) ---------------- */

  G.topicList = function (npc) {
    var g = this;
    var c = this.data.characters[npc];
    if (!c) return [];
    return (c.talk || [])
      .filter(function (t) {
        if (t.once && g.state.seen[t.start]) return false;
        return g.check(t.conditions);
      })
      .map(function (t) {
        return { id: t.id || t.start, label: t.label, start: t.start, isNew: !g.state.seen[t.start] };
      });
  };

  G.openTalk = function (npc) {
    if (!this.data.characters[npc]) return this.warn('Unknown character "' + npc + '"');
    this.state.ui = { mode: "topics", npc: npc };
    this.state.flags["met_" + npc] = true;
    var topics = this.topicList(npc);
    // If there is exactly one thing to say and it is new, just say it.
    if (topics.length === 1 && topics[0].isNew) return this.startDialogue(topics[0].start, { npc: npc });
    this.emit("view");
  };

  G.chooseTopic = function (topicId) {
    var ui = this.state.ui;
    if (ui.mode !== "topics") return;
    var t = this.topicList(ui.npc).filter(function (x) {
      return x.id === topicId;
    })[0];
    if (!t) return this.warn('Topic "' + topicId + '" is not available');
    this.startDialogue(t.start, { npc: ui.npc });
  };

  // Show a piece of evidence to the NPC you are talking to.
  G.presentEvidence = function (evidenceId) {
    var ui = this.state.ui;
    if (ui.mode !== "topics" || !this.state.evidence[evidenceId]) return;
    var c = this.data.characters[ui.npc];
    var p = c.present || {};
    var node = p[evidenceId] || p["default"];
    this.state.turns++;
    if (node) this.startDialogue(node, { npc: ui.npc });
    else this.emit("notify", { text: BGB.i18n.t("talk.noReaction", { name: BGB.i18n.T(c.name) }) });
  };

  G.leaveTalk = function () {
    if (this.state.ui.mode !== "topics") return;
    this.state.ui = { mode: "scene" };
    this.settle();
  };

  /* ---------------- dialogue ---------------- */

  function resolveNext(g, next) {
    if (!next) return null;
    if (typeof next === "string") return next;
    for (var i = 0; i < next.length; i++) {
      if (g.check(next[i].conditions)) return next[i].to || null;
    }
    return null;
  }

  G.startDialogue = function (nodeId, ctx) {
    ctx = ctx || {};
    var npc = ctx.npc || (this.state.ui.mode === "topics" ? this.state.ui.npc : null);
    this.state.ui = { mode: "dialogue", node: null, npc: npc };
    this.enterNode(nodeId);
  };

  G.enterNode = function (id) {
    var guard = 0;
    while (id) {
      if (++guard > 100) {
        this.warn("Dialogue loop detected near node " + id);
        break;
      }
      var node = this.data.dialogue[id];
      if (!node) {
        this.warn('Missing dialogue node "' + id + '"');
        break;
      }
      if (node.conditions && !this.check(node.conditions)) {
        id = node["else"] || resolveNext(this, node.next);
        continue;
      }
      var seenBefore = !!this.meta.seenEver[id] || !!this.state.seen[id];
      this.state.seen[id] = true;
      this.meta.seenEver[id] = true;
      this.apply(node.effects);
      if (node.sound) this.emit("sound", node.sound);
      var text = this.pickText(node);
      var hasChoices = this.availableChoices(node).length > 0;
      if (text === undefined && !hasChoices) {
        // silent "logic" node: just effects + branching
        id = resolveNext(this, node.next);
        continue;
      }
      this.state.ui.node = id;
      this.state.ui.seenBefore = seenBefore;
      if (text !== undefined) this.pushLog(node.speaker, text);
      this.emit("view");
      return;
    }
    this.endDialogue();
  };

  G.availableChoices = function (node) {
    var g = this;
    return (node.choices || []).filter(function (c, i) {
      if (c.once && g.state.seen[node.id + "#" + i]) return false;
      return g.check(c.conditions);
    });
  };

  G.dialogueView = function () {
    var ui = this.state.ui;
    if (ui.mode !== "dialogue") return null;
    var node = this.data.dialogue[ui.node];
    if (!node) return null;
    var g = this;
    return {
      id: node.id,
      speaker: node.speaker || null,
      text: this.pickText(node),
      choices: this.availableChoices(node).map(function (c) {
        return { text: g.pickText(c) };
      }),
      fx: U.asArray(node.fx),
      seenBefore: !!ui.seenBefore,
      npc: ui.npc,
    };
  };

  G.advance = function () {
    var ui = this.state.ui;
    if (ui.mode === "ending") return this.advanceEnding();
    if (ui.mode !== "dialogue") return;
    var node = this.data.dialogue[ui.node];
    if (!node) return this.endDialogue();
    if (this.availableChoices(node).length) return; // must choose
    var next = resolveNext(this, node.next);
    if (next) this.enterNode(next);
    else this.endDialogue();
  };

  G.choose = function (index) {
    var ui = this.state.ui;
    if (ui.mode !== "dialogue") return;
    var node = this.data.dialogue[ui.node];
    var list = this.availableChoices(node);
    var c = list[index];
    if (!c) return;
    var realIndex = node.choices.indexOf(c);
    this.state.seen[node.id + "#" + realIndex] = true;
    this.pushLog("choice", this.pickText(c));
    this.apply(c.effects);
    var next = resolveNext(this, c.next);
    if (next) this.enterNode(next);
    else this.endDialogue();
  };

  G.endDialogue = function () {
    var npc = this.state.ui.npc;
    this.state.ui = npc ? { mode: "topics", npc: npc } : { mode: "scene" };
    this.emit("dialogueEnd");
    this.emit("autosave");
    // If the NPC has nothing more to say, drop back to the scene.
    if (npc && this.topicList(npc).length === 0) this.state.ui = { mode: "scene" };
    this.settle();
  };

  G.pushLog = function (speaker, textObj) {
    this.state.log.push({ s: speaker || null, t: textObj });
    if (this.state.log.length > LOG_LIMIT) this.state.log.splice(0, this.state.log.length - LOG_LIMIT);
  };

  /* ---------------- the "settle" loop ----------------
   * Called whenever control returns to the player. Runs, in order:
   *   1. auto-advance contradictions whose conditions are now met
   *   2. queued effects (goScene / startDialogue / setChapter / startEnding)
   *   3. one-time scene/chapter events (e.g. "the rain begins")
   *   4. chapter completion -> chapter card
   */
  G.settle = function () {
    var guard = 0;
    while (guard++ < 50) {
      this.refreshContradictions();
      var mode = this.state.ui.mode;
      if (mode === "dialogue" || mode === "chapterCard" || mode === "ending" || mode === "end") break;
      var q = this.state.queue.shift();
      if (q) {
        if (q.kind === "scene") {
          this.enterScene(q.id);
          continue;
        }
        if (q.kind === "dialogue") return this.startDialogue(q.id);
        if (q.kind === "chapter") {
          this.state.ui = { mode: "chapterCard", chapter: q.id };
          break;
        }
        if (q.kind === "ending") return this.startEnding(q.id);
      }
      if (mode !== "scene") break;
      var ev = this.nextEvent();
      if (ev) {
        this.state.fired["event:" + ev.id] = true;
        this.apply(ev.effects);
        if (ev.dialogue) return this.startDialogue(ev.dialogue);
        continue;
      }
      var next = chapterReady(this);
      if (next) {
        this.state.ui = { mode: "chapterCard", chapter: next };
        break;
      }
      break;
    }
    this.emit("view");
  };

  G.nextEvent = function () {
    var sc = this.data.scenes[this.state.scene] || {};
    var ch = this.currentChapter() || {};
    var all = (sc.events || []).concat(ch.events || []);
    for (var i = 0; i < all.length; i++) {
      var ev = all[i];
      if (!ev.id) continue;
      if (ev.once !== false && this.state.fired["event:" + ev.id]) continue;
      if (this.check(ev.conditions)) return ev;
    }
    return null;
  };

  /* ---------------- memory reliability ---------------- */

  G.setMemory = function (v) {
    v = Math.max(0, Math.min(100, Math.round(Number(v) || 0)));
    this.state.memory = v;
    this.emit("memory", v);
  };

  // Narrative tiers (never shown as a number to the player).
  G.memoryTier = function () {
    var m = this.state.memory;
    if (m >= 98) return "stable";
    if (m >= 80) return "faint";
    if (m >= 60) return "unsteady";
    if (m >= 35) return "fragmented";
    return "final";
  };

  /* ---------------- evidence ---------------- */

  G.unlockEvidence = function (id) {
    var def = this.data.evidence[id];
    if (!def) return this.warn('Unknown evidence "' + id + '"');
    if (this.state.evidence[id]) return;
    this.state.evidence[id] = { n: ++this.state.counter, chapter: this.state.chapter, viewed: null };
    this.apply(def.onUnlock);
    this.emit("evidence", id);
    this.emit("notify", { kind: "evidence", text: BGB.i18n.t("notify.evidence", { title: BGB.i18n.T(def.title) }) });
    this.emit("autosave");
  };

  // The evidence the player currently holds, in the order collected.
  G.evidenceList = function () {
    var g = this;
    return Object.keys(this.state.evidence)
      .filter(function (id) {
        return g.data.evidence[id];
      })
      .sort(function (a, b) {
        return g.state.evidence[a].n - g.state.evidence[b].n;
      })
      .map(function (id) {
        return g.evidenceView(id);
      });
  };

  // One piece of evidence can MEAN different things as the story moves on.
  // interpretations: [{ conditions, text }] — the LAST matching one wins,
  // so list them from "apparent meaning" to "real meaning".
  G.evidenceView = function (id) {
    var def = this.data.evidence[id];
    var idx = -1;
    var text = def.description;
    (def.interpretations || []).forEach(function (it, i) {
      if (this.check(it.conditions)) {
        idx = i;
        text = it.text;
      }
    }, this);
    var rec = this.state.evidence[id] || {};
    return {
      id: id,
      title: def.title,
      kind: def.kind || "item",
      source: def.source,
      reliability: def.reliability || "unknown",
      tags: def.tags || [],
      text: text,
      interpretation: idx,
      // "changed" = its meaning shifted since the player last looked at it
      changed: rec.viewed !== null && rec.viewed !== undefined && idx > rec.viewed,
      isNew: rec.viewed === null,
    };
  };

  G.markEvidenceViewed = function (id) {
    var rec = this.state.evidence[id];
    if (!rec) return;
    rec.viewed = this.evidenceView(id).interpretation;
  };

  /* ---------------- contradictions ---------------- */

  G.findContradiction = function (id) {
    var def = this.data.contradictions[id];
    if (!def) return this.warn('Unknown contradiction "' + id + '"');
    if (this.state.contradictions[id]) return false;
    this.state.contradictions[id] = { n: ++this.state.counter, state: "unresolved" };
    this.state.flags.first_contradiction_found = true;
    this.apply(def.onFound);
    this.emit("contradiction", id);
    this.emit("notify", { kind: "contradiction", text: BGB.i18n.t("notify.contradiction") });
    this.refreshContradictions();
    this.emit("autosave");
    return true;
  };

  // States only ever move forward: unresolved -> partial -> resolved/ambiguous.
  G.advanceContradiction = function (id, st) {
    if (!this.state.contradictions[id]) this.findContradiction(id);
    var rec = this.state.contradictions[id];
    if (!rec || !R.CONTRA_ORDER[st]) return;
    if (R.CONTRA_ORDER[st] > R.CONTRA_ORDER[rec.state]) {
      rec.state = st;
      this.emit("contradiction", id);
    }
  };

  G.refreshContradictions = function () {
    var g = this;
    Object.keys(this.state.contradictions).forEach(function (id) {
      var def = g.data.contradictions[id];
      if (!def) return;
      ["partial", "resolved", "ambiguous"].forEach(function (st) {
        if (def[st] && def[st].conditions && g.check(def[st].conditions)) g.advanceContradiction(id, st);
      });
    });
  };

  G.contradictionList = function () {
    var g = this;
    return Object.keys(this.state.contradictions)
      .filter(function (id) {
        return g.data.contradictions[id];
      })
      .sort(function (a, b) {
        return g.state.contradictions[a].n - g.state.contradictions[b].n;
      })
      .map(function (id) {
        var def = g.data.contradictions[id];
        var st = g.state.contradictions[id].state;
        var stText = st !== "unresolved" && def[st] ? def[st].text : def.text;
        return { id: id, title: def.title, state: st, text: stText, between: def.between };
      });
  };

  // Compare two pieces of evidence on the board.
  G.compare = function (a, b) {
    if (!this.state.evidence[a] || !this.state.evidence[b] || a === b) return { result: "invalid" };
    this.state.turns++;
    var defs = this.story.list("contradictions");
    for (var i = 0; i < defs.length; i++) {
      var bt = defs[i].between || [];
      if (bt.length === 2 && ((bt[0] === a && bt[1] === b) || (bt[0] === b && bt[1] === a))) {
        if (defs[i].conditions && !this.check(defs[i].conditions)) continue;
        var isNew = this.findContradiction(defs[i].id);
        return { result: isNew ? "new" : "known", id: defs[i].id };
      }
    }
    var ra = this.data.evidence[a].related || [];
    var rb = this.data.evidence[b].related || [];
    if (ra.indexOf(b) !== -1 || rb.indexOf(a) !== -1) return { result: "related" };
    return { result: "none" };
  };

  /* ---------------- deductions (player theories) ----------------
   * The player's HYPOTHESIS is stored separately from confirmed TRUTH.
   * Wrong answers are recorded, never punished, and can be retried.
   */
  G.deductionList = function () {
    var g = this;
    return this.story.list("deductions")
      .filter(function (d) {
        return g.check(d.conditions) || (g.state.hypotheses[d.id] && g.state.hypotheses[d.id].correct);
      })
      .map(function (d) {
        var h = g.state.hypotheses[d.id] || { attempts: [] };
        return { id: d.id, question: d.question, options: d.options, solved: !!h.correct, answer: h.answer, attempts: h.attempts };
      });
  };

  G.deduce = function (id, optionId) {
    var d = this.data.deductions[id];
    if (!d) return { result: "invalid" };
    var h = (this.state.hypotheses[id] = this.state.hypotheses[id] || { attempts: [] });
    if (h.correct) return { result: "already", text: d.correctText };
    this.state.turns++;
    h.attempts.push(optionId);
    var answers = U.asArray(d.answer);
    if (answers.indexOf(optionId) !== -1) {
      h.correct = true;
      h.answer = optionId;
      this.apply(d.onCorrect);
      this.refreshContradictions();
      this.emit("autosave");
      return { result: "correct", text: d.correctText };
    }
    var opt = (d.options || []).filter(function (o) {
      return o.id === optionId;
    })[0];
    return { result: "wrong", text: (opt && opt.wrongText) || d.wrongText };
  };

  /* ---------------- timeline ---------------- */

  G.timelineView = function () {
    var g = this;
    return this.story.list("timeline")
      .slice()
      .sort(function (a, b) {
        return (a.order || 0) - (b.order || 0);
      })
      .map(function (t) {
        var known = g.check(t.revealWhen || [{ type: "flag", id: "__never__" }]);
        var timeKnown = known && (!t.timeKnownWhen || g.check(t.timeKnownWhen));
        return { id: t.id, time: timeKnown ? t.time : null, text: known ? g.pickText(t) : null, known: known };
      });
  };

  /* ---------------- hints ---------------- */

  G.activeHintGoal = function () {
    var g = this;
    return this.story.list("hints").filter(function (h) {
      if (h.chapter && h.chapter !== g.state.chapter) return false;
      if (!g.check(h.when)) return false;
      return !(h.done && g.check(h.done));
    })[0];
  };

  G.hintView = function () {
    var goal = this.activeHintGoal();
    if (!goal) return { goal: null, revealed: [], canReveal: false };
    var lvl = this.state.hints[goal.id] || 0;
    return { goal: goal.id, revealed: goal.levels.slice(0, lvl), level: lvl, canReveal: lvl < goal.levels.length };
  };

  G.revealHint = function () {
    var goal = this.activeHintGoal();
    if (!goal) return null;
    var lvl = Math.min((this.state.hints[goal.id] || 0) + 1, goal.levels.length);
    this.state.hints[goal.id] = lvl;
    this.state.flags.hints_used = (this.state.flags.hints_used || 0) + 1;
    this.emit("autosave");
    return goal.levels[lvl - 1];
  };

  /* ---------------- endings ---------------- */

  G.startEnding = function (id) {
    var e = this.data.endings[id];
    if (!e) return this.warn('Unknown ending "' + id + '"');
    this.state.ui = { mode: "ending", ending: id, step: -1 };
    this.apply(e.onStart);
    this.advanceEnding();
  };

  G.endingStep = function () {
    var ui = this.state.ui;
    if (ui.mode !== "ending") return null;
    var e = this.data.endings[ui.ending];
    var st = e.steps[ui.step];
    if (!st) return null;
    return { index: ui.step, speaker: st.speaker || null, text: this.pickText(st), pause: st.pause || 0, fx: U.asArray(st.fx), ending: e };
  };

  G.advanceEnding = function () {
    var ui = this.state.ui;
    var e = this.data.endings[ui.ending];
    var i = ui.step + 1;
    while (e.steps[i] && e.steps[i].conditions && !this.check(e.steps[i].conditions)) i++;
    if (!e.steps[i]) return this.finishEnding();
    ui.step = i;
    var st = e.steps[i];
    this.apply(st.effects);
    if (st.sound) this.emit("sound", st.sound);
    this.emit("view");
  };

  G.finishEnding = function () {
    var id = this.state.ui.ending;
    this.state.ending = id;
    this.state.ui = { mode: "end", ending: id };
    this.apply(this.data.endings[id].onComplete);
    this.meta.completedRuns = (this.meta.completedRuns || 0) + 1;
    this.meta.endingsSeen = this.meta.endingsSeen || {};
    this.meta.endingsSeen[id] = true;
    this.emit("complete", id);
    this.emit("autosave");
    this.emit("view");
  };

  BGB.Game = Game;
  BGB.Game.defaultState = defaultState;
  BGB.Game.STATE_VERSION = STATE_VERSION;
})();
