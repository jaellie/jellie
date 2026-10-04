/*
 * validate.js — checks the story content for mistakes.
 *
 * Runs automatically in debug builds (results in the console and the debug
 * panel) and in the test suite. It catches the typos that otherwise turn into
 * soft-locks: a "next" that points to a node that doesn't exist, an effect
 * that unlocks unknown evidence, a missing Korean translation, etc.
 *
 * errors   = something is broken and will misbehave
 * warnings = probably a mistake (unused node, missing translation)
 */
(function () {
  "use strict";
  var BGB = globalThis.BGB;

  BGB.validate = function (story) {
    var d = story.data;
    var errors = [];
    var warnings = story.registryWarnings.slice();
    var langs = Object.keys(d.strings);
    var referencedNodes = {};

    function err(m) {
      errors.push(m);
    }
    function warn(m) {
      warnings.push(m);
    }
    function exists(cat, id, where) {
      if (id && !d[cat][id]) err(where + ': unknown ' + cat.replace(/s$/, "") + ' "' + id + '"');
    }
    function text(v, where) {
      if (v === undefined || v === null || typeof v === "string") return;
      langs.forEach(function (l) {
        if (v[l] === undefined) warn(where + ": missing " + l + " text");
      });
    }
    function textBearing(o, where) {
      text(o.text, where);
      text(o.ngPlusText, where + " (ngPlusText)");
      (o.variants || []).forEach(function (v, i) {
        conds(v.conditions, where + " variant " + i);
        text(v.text, where + " variant " + i);
      });
    }

    var CONDITION_REFS = {
      evidence: "evidence",
      contradiction: "contradictions",
      deduced: "deductions",
      chapter: "chapters",
      chapterAtLeast: "chapters",
      seen: "dialogue",
      visited: "scenes",
      scene: "scenes",
    };
    function conds(list, where) {
      BGB.util.asArray(list).forEach(function (c) {
        if (!c || !BGB.rules.conditions[c.type]) return err(where + ': unknown condition type "' + (c && c.type) + '"');
        if (CONDITION_REFS[c.type]) exists(CONDITION_REFS[c.type], c.id, where);
        if (c.type === "not") conds([c.condition], where);
        if (c.type === "any" || c.type === "all") conds(c.of, where);
      });
    }
    var EFFECT_REFS = {
      unlockEvidence: "evidence",
      findContradiction: "contradictions",
      setContradiction: "contradictions",
      goScene: "scenes",
      startDialogue: "dialogue",
      setChapter: "chapters",
      startEnding: "endings",
    };
    function effects(list, where) {
      BGB.util.asArray(list).forEach(function (e) {
        if (!e || !BGB.rules.effects[e.type]) return err(where + ': unknown effect type "' + (e && e.type) + '"');
        if (EFFECT_REFS[e.type]) exists(EFFECT_REFS[e.type], e.id, where);
        if (e.type === "startDialogue") referencedNodes[e.id] = true;
        if (e.conditions) conds(e.conditions, where);
        if (e.type === "notify") text(e.text, where);
      });
    }
    function next(n, where) {
      if (!n) return;
      if (typeof n === "string") {
        exists("dialogue", n, where);
        referencedNodes[n] = true;
        return;
      }
      n.forEach(function (b) {
        conds(b.conditions, where);
        if (b.to) {
          exists("dialogue", b.to, where);
          referencedNodes[b.to] = true;
        }
      });
    }
    function startNode(id, where) {
      exists("dialogue", id, where);
      referencedNodes[id] = true;
    }

    // config
    if (!d.order.chapters.length) err("No chapters defined.");

    // chapters
    story.list("chapters").forEach(function (c) {
      var w = "chapter " + c.id;
      text(c.title, w);
      exists("scenes", c.startScene, w);
      if (c.next) exists("chapters", c.next, w);
      conds(c.completeWhen, w + " completeWhen");
      effects(c.onEnter, w + " onEnter");
      (c.events || []).forEach(function (ev) {
        if (!ev.id) err(w + ": event without id");
        conds(ev.conditions, w + " event " + ev.id);
        effects(ev.effects, w + " event " + ev.id);
        if (ev.dialogue) startNode(ev.dialogue, w + " event " + ev.id);
      });
    });

    // characters
    story.list("characters").forEach(function (c) {
      var w = "character " + c.id;
      text(c.name, w + " name");
      (c.talk || []).forEach(function (t) {
        text(t.label, w + " topic");
        conds(t.conditions, w + " topic " + t.start);
        startNode(t.start, w + " topic");
      });
      Object.keys(c.present || {}).forEach(function (ev) {
        if (ev !== "default") exists("evidence", ev, w + " present");
        startNode(c.present[ev], w + " present");
      });
    });

    // scenes
    story.list("scenes").forEach(function (s) {
      var w = "scene " + s.id;
      text(s.title, w + " title");
      textBearing(s, w);
      effects(s.onEnter, w + " onEnter");
      effects(s.onFirstEnter, w + " onFirstEnter");
      (s.actions || []).forEach(function (a, i) {
        var aw = w + " action " + (a.id || i);
        conds(a.conditions, aw);
        effects(a.effects, aw);
        if (a.label) text(a.label, aw);
        if (a.type === "go") exists("scenes", a.to, aw);
        else if (a.type === "talk") exists("characters", a.npc, aw);
        else if (a.dialogue) startNode(a.dialogue, aw);
        else err(aw + ": needs a dialogue, a talk npc, or a go target");
        if (a.type !== "go" && a.type !== "talk" && !a.label) err(aw + ": needs a label");
      });
      (s.events || []).forEach(function (ev) {
        if (!ev.id) err(w + ": event without id");
        conds(ev.conditions, w + " event " + ev.id);
        effects(ev.effects, w + " event " + ev.id);
        if (ev.dialogue) startNode(ev.dialogue, w + " event " + ev.id);
      });
    });

    // dialogue
    story.list("dialogue").forEach(function (n) {
      var w = "dialogue " + n.id;
      if (n.speaker && n.speaker !== "narrator" && !d.characters[n.speaker]) err(w + ': unknown speaker "' + n.speaker + '"');
      textBearing(n, w);
      conds(n.conditions, w);
      effects(n.effects, w);
      next(n.next, w);
      if (n["else"]) next(n["else"], w + " else");
      (n.choices || []).forEach(function (c, i) {
        textBearing(c, w + " choice " + i);
        conds(c.conditions, w + " choice " + i);
        effects(c.effects, w + " choice " + i);
        next(c.next, w + " choice " + i);
      });
      if (n.text === undefined && !n.choices && !n.next && !(n.variants || []).length && !n.effects)
        warn(w + ": node has no text, choices, next or effects");
    });

    // evidence
    story.list("evidence").forEach(function (e) {
      var w = "evidence " + e.id;
      text(e.title, w + " title");
      text(e.description, w + " description");
      (e.related || []).forEach(function (r) {
        exists("evidence", r, w + " related");
      });
      (e.interpretations || []).forEach(function (it, i) {
        conds(it.conditions, w + " interpretation " + i);
        text(it.text, w + " interpretation " + i);
      });
      effects(e.onUnlock, w + " onUnlock");
    });

    // contradictions
    story.list("contradictions").forEach(function (c) {
      var w = "contradiction " + c.id;
      text(c.title, w);
      text(c.text, w);
      (c.between || []).forEach(function (id) {
        exists("evidence", id, w);
      });
      ["partial", "resolved", "ambiguous"].forEach(function (st) {
        if (c[st]) {
          conds(c[st].conditions, w + " " + st);
          text(c[st].text, w + " " + st);
        }
      });
      effects(c.onFound, w + " onFound");
    });

    // deductions
    story.list("deductions").forEach(function (x) {
      var w = "deduction " + x.id;
      text(x.question, w);
      conds(x.conditions, w);
      effects(x.onCorrect, w);
      var ids = (x.options || []).map(function (o) {
        text(o.text, w + " option " + o.id);
        return o.id;
      });
      BGB.util.asArray(x.answer).forEach(function (a) {
        if (ids.indexOf(a) === -1) err(w + ': answer "' + a + '" is not one of the options');
      });
    });

    // hints
    story.list("hints").forEach(function (h) {
      var w = "hint " + h.id;
      if (h.chapter) exists("chapters", h.chapter, w);
      conds(h.when, w);
      conds(h.done, w);
      if (!h.levels || h.levels.length !== 3) warn(w + ": should have exactly 3 levels");
      (h.levels || []).forEach(function (l, i) {
        text(l, w + " level " + (i + 1));
      });
    });

    // timeline
    story.list("timeline").forEach(function (t) {
      textBearing(t, "timeline " + t.id);
      conds(t.revealWhen, "timeline " + t.id);
      conds(t.timeKnownWhen, "timeline " + t.id);
    });

    // endings
    story.list("endings").forEach(function (e) {
      var w = "ending " + e.id;
      text(e.title, w);
      effects(e.onStart, w);
      effects(e.onComplete, w);
      (e.steps || []).forEach(function (s, i) {
        if (s.speaker && s.speaker !== "narrator" && !d.characters[s.speaker]) err(w + " step " + i + ': unknown speaker "' + s.speaker + '"');
        textBearing(s, w + " step " + i);
        conds(s.conditions, w + " step " + i);
        effects(s.effects, w + " step " + i);
      });
    });

    // UI strings present in every language
    var en = d.strings.en || {};
    langs.forEach(function (l) {
      Object.keys(en).forEach(function (k) {
        if (d.strings[l][k] === undefined) warn('UI string "' + k + '" missing in ' + l);
      });
    });

    // dialogue nodes nobody can reach
    story.list("dialogue").forEach(function (n) {
      if (!referencedNodes[n.id]) warn("dialogue " + n.id + ": nothing leads to this node");
    });

    return { errors: errors, warnings: warnings };
  };
})();
