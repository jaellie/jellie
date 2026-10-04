/*
 * rules.js — CONDITIONS and EFFECTS.
 *
 * These are the "verbs" content uses. A condition list passes when every
 * condition in it passes (AND). Use { type: "any", of: [...] } for OR.
 *
 * Conditions (all read-only):
 *   { type: "flag", id, equals?, gte?, lte? }  no comparison = "is truthy"
 *   { type: "evidence", id }                    player has this evidence
 *   { type: "contradiction", id, state? }       found (state: "unresolved" |
 *                                               "partial" | "resolved" | "ambiguous";
 *                                               means "at least this state")
 *   { type: "deduced", id }                     player proposed the right answer
 *   { type: "chapter", id }                     current chapter is exactly id
 *   { type: "chapterAtLeast", id }              current chapter is id or later
 *   { type: "memory", gte?, lte? }              memory reliability
 *   { type: "ngPlus" }                          2nd+ playthrough
 *   { type: "seen", id }                        dialogue node seen this run
 *   { type: "visited", id }                     scene visited this run
 *   { type: "turns", gte?, lte? }               number of player actions taken
 *   { type: "scene", id }                       current scene
 *   { type: "not", condition }                  negation
 *   { type: "any", of: [conditions] }           OR
 *   { type: "all", of: [conditions] }           AND (grouping)
 *
 * Effects:
 *   { type: "setFlag", id, value? }             value defaults to true
 *   { type: "addFlag", id, amount? }            numeric +/- (default +1)
 *   { type: "unlockEvidence", id }
 *   { type: "findContradiction", id }
 *   { type: "setContradiction", id, state }     only moves forward, never back
 *   { type: "setMemory", value }
 *   { type: "changeMemory", amount }
 *   { type: "setClock", time }                  "23:47"
 *   { type: "goScene", id }
 *   { type: "startDialogue", id }               queued after current dialogue
 *   { type: "setChapter", id }                  direct chapter jump
 *   { type: "playSound", id }
 *   { type: "notify", text }                    small on-screen message
 *   { type: "fx", id }                          one-off visual effect
 *   { type: "startEnding", id }
 *   { type: "autosave" }
 *
 * Any effect can also have "conditions": [...] — it only runs if they pass.
 *
 * Add your own: BGB.rules.conditions.myType = function (c, game) {...}
 *               BGB.rules.effects.myType    = function (e, game) {...}
 */
(function () {
  "use strict";
  var BGB = globalThis.BGB;

  var CONTRA_ORDER = { unresolved: 1, partial: 2, resolved: 3, ambiguous: 3 };

  function cmp(value, c) {
    if (c.equals !== undefined) return value === c.equals;
    if (c.gte !== undefined && !(value >= c.gte)) return false;
    if (c.lte !== undefined && !(value <= c.lte)) return false;
    if (c.gte === undefined && c.lte === undefined) return !!value;
    return true;
  }

  var conditions = {
    flag: function (c, g) {
      return cmp(g.state.flags[c.id], c);
    },
    evidence: function (c, g) {
      return !!g.state.evidence[c.id];
    },
    contradiction: function (c, g) {
      var rec = g.state.contradictions[c.id];
      if (!rec) return false;
      if (!c.state) return true;
      if (c.state === "ambiguous") return rec.state === "ambiguous";
      return CONTRA_ORDER[rec.state] >= CONTRA_ORDER[c.state];
    },
    deduced: function (c, g) {
      var h = g.state.hypotheses[c.id];
      return !!(h && h.correct);
    },
    chapter: function (c, g) {
      return g.state.chapter === c.id;
    },
    chapterAtLeast: function (c, g) {
      return g.chapterIndex(g.state.chapter) >= g.chapterIndex(c.id);
    },
    memory: function (c, g) {
      return cmp(g.state.memory, c);
    },
    ngPlus: function (c, g) {
      return g.state.playthrough > 1;
    },
    seen: function (c, g) {
      return !!g.state.seen[c.id];
    },
    visited: function (c, g) {
      return !!g.state.visited[c.id];
    },
    turns: function (c, g) {
      return cmp(g.state.turns, c);
    },
    scene: function (c, g) {
      return g.state.scene === c.id;
    },
    not: function (c, g) {
      return !check([c.condition], g);
    },
    any: function (c, g) {
      return (c.of || []).some(function (x) {
        return check([x], g);
      });
    },
    all: function (c, g) {
      return check(c.of || [], g);
    },
  };

  function check(list, game) {
    if (!list) return true;
    list = BGB.util.asArray(list);
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      var fn = conditions[c.type];
      if (!fn) {
        game.warn('Unknown condition type "' + c.type + '"');
        return false;
      }
      if (!fn(c, game)) return false;
    }
    return true;
  }

  var effects = {
    setFlag: function (e, g) {
      g.state.flags[e.id] = e.value === undefined ? true : e.value;
    },
    addFlag: function (e, g) {
      var cur = Number(g.state.flags[e.id]) || 0;
      g.state.flags[e.id] = cur + (e.amount === undefined ? 1 : e.amount);
    },
    unlockEvidence: function (e, g) {
      g.unlockEvidence(e.id);
    },
    findContradiction: function (e, g) {
      g.findContradiction(e.id);
    },
    setContradiction: function (e, g) {
      g.advanceContradiction(e.id, e.state);
    },
    setMemory: function (e, g) {
      g.setMemory(e.value);
    },
    changeMemory: function (e, g) {
      g.setMemory(g.state.memory + e.amount);
    },
    setClock: function (e, g) {
      g.state.clock = e.time;
      g.emit("clock", e.time);
    },
    goScene: function (e, g) {
      g.queue.push({ kind: "scene", id: e.id });
    },
    startDialogue: function (e, g) {
      g.queue.push({ kind: "dialogue", id: e.id });
    },
    setChapter: function (e, g) {
      g.queue.push({ kind: "chapter", id: e.id });
    },
    playSound: function (e, g) {
      g.emit("sound", e.id);
    },
    notify: function (e, g) {
      g.emit("notify", { text: BGB.i18n.T(e.text) });
    },
    fx: function (e, g) {
      g.emit("fx", e.id);
    },
    startEnding: function (e, g) {
      g.queue.push({ kind: "ending", id: e.id });
    },
    autosave: function (e, g) {
      g.emit("autosave");
    },
  };

  function apply(list, game) {
    BGB.util.asArray(list).forEach(function (e) {
      // Any effect may carry its own conditions: { type: "setClock", time: "19:10", conditions: [...] }
      if (e.conditions && !check(e.conditions, game)) return;
      var fn = effects[e.type];
      if (!fn) return game.warn('Unknown effect type "' + e.type + '"');
      fn(e, game);
    });
  }

  BGB.rules = {
    conditions: conditions,
    effects: effects,
    check: check,
    apply: apply,
    CONTRA_ORDER: CONTRA_ORDER,
  };
})();
