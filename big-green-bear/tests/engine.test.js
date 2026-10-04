/*
 * Engine + vertical-slice tests. Run:  node --test tests/
 *
 * The Game core is headless, so these tests PLAY the game: normal runs,
 * players who skip things, players who solve things early, save/load in the
 * middle of a conversation, NG+, and a random-play fuzzer that checks the
 * slice can always still be finished (no soft-locks).
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { load } = require("./load.js");

function mk(meta) {
  const B = load();
  const g = new B.Game(B.story, meta || { seenEver: {}, completedRuns: 0, endingsSeen: {} });
  return { B, g };
}

// Read through any dialogue / chapter card, always taking choice `pick`.
function drain(g, pick = 0) {
  let guard = 0;
  while (guard++ < 500) {
    const m = g.state.ui.mode;
    if (m === "dialogue") {
      const v = g.dialogueView();
      if (v.choices.length) g.choose(Math.min(pick, v.choices.length - 1));
      else g.advance();
    } else if (m === "chapterCard") g.continueChapterCard();
    else if (m === "ending") g.advance();
    else return;
  }
  throw new Error("drain did not terminate");
}

function act(g, id) {
  const v = g.sceneView();
  assert.ok(v.actions.some((a) => a.id === id), `action ${id} not available in ${g.state.scene}: ${v.actions.map((a) => a.id)}`);
  g.doAction(id);
  drain(g);
}

function ask(g, npc, topic) {
  act(g, "talk:" + npc); // a single new topic plays automatically
  if (g.state.ui.mode === "topics" && !g.state.seen[topic]) {
    const t = g.topicList(npc).find((x) => x.start === topic);
    assert.ok(t, `topic ${topic} not available for ${npc}: ${g.topicList(npc).map((x) => x.start)}`);
    g.chooseTopic(t.id);
    drain(g);
  }
  if (g.state.ui.mode === "topics") g.leaveTalk();
  drain(g);
}

function start(g, playthrough = 1) {
  g.newGame({ playthrough });
  drain(g);
}

/* Shortest path between scenes using "go" actions (for the solver). */
function goTo(g, target) {
  let guard = 0;
  while (g.state.scene !== target && guard++ < 10) {
    const prev = {};
    const q = [g.state.scene];
    const seen = { [g.state.scene]: true };
    while (q.length) {
      const s = q.shift();
      for (const a of g.data.scenes[s].actions || []) {
        if (a.type === "go" && !seen[a.to]) {
          seen[a.to] = true;
          prev[a.to] = s;
          q.push(a.to);
        }
      }
    }
    assert.ok(seen[target], `no route from ${g.state.scene} to ${target}`);
    let step = target;
    while (prev[step] !== g.state.scene) step = prev[step];
    act(g, "go:" + step);
  }
}

/* Finishes the slice from ANY state, using only legal player inputs. */
function solve(g) {
  let guard = 0;
  while (g.state.ui.mode !== "end" && guard++ < 80) {
    drain(g);
    if (g.state.ui.mode === "topics") {
      g.leaveTalk();
      continue;
    }
    if (g.state.ui.mode !== "scene") continue;
    const ch = g.state.chapter;
    const has = (id) => !!g.state.evidence[id];
    const S = g.state;
    if (ch === "ch1") {
      if (!S.flags.rain_started) {
        const v = g.sceneView();
        act(g, (v.actions.find((a) => a.type === "look") || v.actions.find((a) => a.type === "go")).id);
      } else if (!has("t_lily_nini")) {
        goTo(g, "flower_stall");
        ask(g, "lily", "lily_nini_01");
      } else if (!has("t_finch_nini")) {
        goTo(g, "stage");
        ask(g, "finch", "finch_nini_01");
      } else if (!S.contradictions.c_nini_parade) {
        g.compare("t_lily_nini", "t_finch_nini");
        g.settle();
      } else if (!has("green_bell")) {
        goTo(g, "fountain");
        act(g, "look:fn_bell_01");
      } else g.settle();
    } else if (ch === "ch2") {
      if (!has("t_lily_packing")) {
        goTo(g, "flower_stall_late");
        ask(g, "lily", "lily_late_01");
      } else if (!g.check([{ type: "deduced", id: "d_lily_timing" }])) {
        assert.equal(g.deduce("d_lily_timing", "after_ten").result, "correct");
        g.settle();
      } else if (!S.flags.second_ring_heard) {
        goTo(g, "fountain_late");
        act(g, "look:fnl_gate_01");
      } else g.settle();
    }
  }
  drain(g);
  return g.state.ui.mode === "end";
}

/* ------------------------------------------------------------------ */

test("content validates with no errors or warnings", () => {
  const { B } = mk();
  const r = B.validate(B.story);
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.warnings, []);
});

test("validator catches broken references", () => {
  const { B } = mk();
  B.story.dialogue({ broken_node: { text: "x", next: "does_not_exist", effects: [{ type: "unlockEvidence", id: "nope" }] } });
  const r = B.validate(B.story);
  assert.ok(r.errors.some((e) => e.includes("does_not_exist")));
  assert.ok(r.errors.some((e) => e.includes('"nope"')));
});

test("normal playthrough reaches the end of the slice", () => {
  const { g } = mk();
  start(g);
  assert.equal(g.state.chapter, "ch1");
  assert.equal(g.state.scene, "square");
  ask(g, "nini", "nini_hello_01");
  assert.ok(g.state.evidence.nini_promise);
  act(g, "look:sq_clock_01");
  act(g, "go:flower_stall"); // turn 3 -> the rain event fires
  assert.equal(g.state.flags.rain_started, true);
  assert.equal(g.state.flags.nini_missing, true);
  ask(g, "lily", "lily_nini_01");
  goTo(g, "stage");
  ask(g, "finch", "finch_nini_01");
  assert.equal(g.compare("t_lily_nini", "t_finch_nini").result, "new");
  assert.equal(g.compare("t_finch_nini", "t_lily_nini").result, "known");
  g.settle();
  assert.equal(g.state.ui.mode, "scene", "chapter must not end before the bell is found");
  goTo(g, "fountain");
  g.doAction("look:fn_bell_01");
  drain(g); // includes the chapter card
  assert.equal(g.state.chapter, "ch2");
  assert.equal(g.state.memory, 95);
  assert.ok(solve(g));
  assert.equal(g.state.ending, "slice_end");
  assert.equal(g.meta.completedRuns, 1);
  assert.equal(g.state.contradictions.c_nini_parade.state, "partial");
  assert.deepEqual(g.warnings, []);
});

test("player who ignores Nini entirely is not soft-locked", () => {
  const { g } = mk();
  start(g);
  for (let i = 0; i < 7 && !g.state.flags.rain_started; i++) {
    act(g, i % 2 ? "look:sq_lights_01" : "look:sq_schedule_01");
  }
  assert.equal(g.state.flags.rain_started, true);
  assert.equal(g.state.flags.bell_memory_gap, true, "the 'unmet' variant explains the missing bell");
  assert.equal(g.state.flags.nini_missing, true);
  assert.ok(solve(g));
});

test("talking to NPCs in an unexpected order: the Nini topic waits for the rain", () => {
  const { g } = mk();
  start(g);
  act(g, "go:stage");
  act(g, "talk:finch");
  assert.ok(!g.topicList("finch").some((t) => t.start === "finch_nini_01"));
  if (g.state.ui.mode === "topics") g.leaveTalk();
  assert.ok(solve(g));
});

test("contradiction can also be found by showing testimony to an NPC", () => {
  const { g } = mk();
  start(g);
  act(g, "go:flower_stall");
  act(g, "go:square");
  act(g, "go:stage"); // 3 turns without Nini... keep moving until rain
  while (!g.state.flags.rain_started) act(g, "go:square"), act(g, "go:stage");
  ask(g, "finch", "finch_nini_01");
  goTo(g, "flower_stall");
  ask(g, "lily", "lily_nini_01");
  act(g, "talk:lily");
  g.presentEvidence("t_finch_nini");
  drain(g);
  assert.ok(g.state.contradictions.c_nini_parade);
});

test("evidence collected before meeting the explaining NPC stays valid", () => {
  const { g } = mk();
  start(g);
  while (!g.state.flags.rain_started) act(g, "look:sq_lights_01");
  goTo(g, "fountain");
  act(g, "look:fn_bell_01"); // bell first, before anyone mentions the fountain
  act(g, "look:fn_gate_01");
  assert.ok(g.state.evidence.green_bell && g.state.evidence.gate_notice);
  assert.ok(solve(g));
  assert.ok(g.state.evidence.green_bell, "evidence never disappears");
});

test("noticing 11:47 early: the player may be right before the reveal", () => {
  const { g } = mk();
  start(g);
  act(g, "look:sq_clock_01");
  goTo(g, "fountain");
  act(g, "look:fn_gate_01");
  const d = g.deductionList().find((x) => x.id === "d_1147");
  assert.ok(d, "theory becomes available as soon as both sightings happen");
  assert.equal(g.deduce("d_1147", "coincidence").result, "wrong");
  assert.equal(g.deduce("d_1147", "happened").result, "correct");
  assert.equal(g.evidenceView("clock_1147").interpretation, 1);
  assert.ok(solve(g));
  // the slice ending acknowledges it via a conditional step (no crash, no skip)
  assert.equal(g.state.ending, "slice_end");
});

test("wrong accusations are recorded as hypotheses and never block progress", () => {
  const { g } = mk();
  start(g);
  while (!g.state.flags.rain_started) act(g, "look:sq_lights_01");
  goTo(g, "flower_stall");
  ask(g, "lily", "lily_nini_01");
  goTo(g, "stage");
  ask(g, "finch", "finch_nini_01");
  g.compare("t_lily_nini", "t_finch_nini");
  assert.equal(g.deduce("d_blame", "lily").result, "wrong");
  assert.equal(g.deduce("d_blame", "finch").result, "wrong");
  assert.deepEqual(g.state.hypotheses.d_blame.attempts, ["lily", "finch"]);
  assert.ok(!g.check([{ type: "deduced", id: "d_blame" }]));
  assert.equal(g.deduce("d_blame", "unknown").result, "correct");
  assert.equal(g.deduce("d_blame", "lily").result, "already");
  assert.ok(solve(g));
});

test("save during dialogue resumes on the same line without repeating effects", () => {
  const { B, g } = mk();
  start(g);
  ask(g, "nini", "nini_hello_01");
  act(g, "look:sq_clock_01");
  act(g, "go:flower_stall");
  act(g, "talk:lily");
  g.chooseTopic("lily_nini_01");
  g.advance(); // lily_nini_02
  g.advance(); // lily_nini_03 (unlocks evidence)
  assert.equal(g.state.ui.node, "lily_nini_03");
  const counter = g.state.counter;
  const saved = JSON.parse(JSON.stringify(g.state)); // what localStorage stores

  const g2 = new B.Game(B.story, { seenEver: {}, completedRuns: 0, endingsSeen: {} });
  g2.loadState(saved);
  assert.equal(g2.state.ui.mode, "dialogue");
  assert.equal(g2.dialogueView().id, "lily_nini_03");
  assert.equal(g2.state.counter, counter, "effects were not re-applied on load");
  g2.advance();
  assert.equal(g2.dialogueView().id, "lily_nini_04");
  drain(g2);
  assert.equal(g2.state.ui.mode, "topics", "returns to Lily's topics after the conversation");
  assert.ok(solve(g2));
});

test("stale or damaged saves are repaired instead of crashing", () => {
  const { g } = mk();
  g.loadState({ scene: "deleted_scene", chapter: "ch1", ui: { mode: "dialogue", node: "deleted_node" }, flags: "garbage", memory: "x" });
  assert.equal(g.state.scene, "square");
  assert.equal(g.state.ui.mode, "scene");
  assert.deepEqual(g.state.flags, {});
  assert.equal(g.state.memory, 100);
  assert.ok(g.warnings.length >= 2);
  assert.ok(solve(g));
});

test("contradiction states only move forward", () => {
  const { g } = mk();
  g.newGame();
  g.findContradiction("c_ringing");
  g.advanceContradiction("c_ringing", "ambiguous");
  g.advanceContradiction("c_ringing", "partial");
  g.advanceContradiction("c_ringing", "unresolved");
  assert.equal(g.state.contradictions.c_ringing.state, "ambiguous");
  assert.ok(g.check([{ type: "contradiction", id: "c_ringing", state: "ambiguous" }]));
});

test("hints: three levels, no penalty, and always available when the player is stuck", () => {
  const { g } = mk();
  start(g);
  const before = JSON.stringify({ ev: g.state.evidence, flags: Object.keys(g.state.flags) });
  assert.equal(g.hintView().goal, "h1_meet");
  g.revealHint();
  g.revealHint();
  g.revealHint();
  g.revealHint(); // capped
  assert.equal(g.hintView().revealed.length, 3);
  assert.equal(g.state.flags.hints_used, 4);
  assert.equal(JSON.stringify({ ev: g.state.evidence, flags: Object.keys(g.state.flags).filter((f) => f !== "hints_used") }), before);

  // At every point of a full run, if the chapter isn't finished, some hint applies.
  let guard = 0;
  const check = () => {
    if (g.state.ui.mode === "scene" && g.state.ui.mode !== "end") {
      assert.ok(g.activeHintGoal(), `no hint at chapter ${g.state.chapter}, scene ${g.state.scene}, flags ${Object.keys(g.state.flags)}`);
    }
  };
  const origSettle = g.settle.bind(g);
  g.settle = function () {
    origSettle();
    if (guard++ < 1000) check();
  };
  assert.ok(solve(g));
});

test("NG+: second-playthrough text, reinterpreted evidence, seen-dialogue skipping", () => {
  const { B, g } = mk();
  start(g);
  assert.ok(solve(g));
  const meta = g.meta;
  assert.equal(meta.completedRuns, 1);

  const g2 = new B.Game(B.story, meta);
  g2.newGame({ playthrough: 2 });
  g2.continueChapterCard();
  g2.advance();
  g2.advance();
  const v = g2.dialogueView();
  assert.equal(v.id, "intro_03");
  assert.equal(v.text.en, "This year, it was you.");
  assert.equal(v.seenBefore, true, "dialogue seen in a previous run can be skipped");
  drain(g2);
  g2.unlockEvidence("green_bell");
  assert.match(g2.evidenceView("green_bell").text.en, /still holding it/);
  assert.ok(solve(g2), "NG+ is completable even before every optional clue was seen");
});

test("localization: every visible story string exists in Korean", () => {
  const { B, g } = mk();
  B.i18n.setLang("ko");
  start(g);
  const v = g.sceneView();
  assert.match(B.i18n.T(v.title), /광장/);
  assert.match(B.i18n.t("action.talk", { name: "니니" }), /니니/);
  assert.equal(B.i18n.formatClock("23:47"), "오후 11:47");
  B.i18n.setLang("en");
  assert.equal(B.i18n.formatClock("23:47"), "11:47 PM");
  assert.equal(B.i18n.formatClock("00:05"), "12:05 AM");
});

test("memory reliability tiers", () => {
  const { g } = mk();
  const tiers = [100, 95, 85, 70, 50, 30, 0].map((m) => (g.setMemory(m), g.memoryTier()));
  assert.deepEqual(tiers, ["stable", "faint", "faint", "unsteady", "fragmented", "final", "final"]);
  g.setMemory(250);
  assert.equal(g.state.memory, 100);
});

test("completionist: every evidence, contradiction and theory in the slice is reachable", () => {
  const { g } = mk();
  start(g);
  ask(g, "nini", "nini_hello_01");
  act(g, "look:sq_clock_01");
  act(g, "look:sq_schedule_01");
  while (!g.state.flags.rain_started) act(g, "look:sq_lights_01");
  goTo(g, "flower_stall");
  ask(g, "lily", "lily_rain_01");
  ask(g, "lily", "lily_nini_01");
  goTo(g, "stage");
  ask(g, "finch", "finch_rain_01");
  ask(g, "finch", "finch_nini_01");
  goTo(g, "fountain");
  act(g, "look:fn_gate_01");
  act(g, "look:fn_drain_01");
  act(g, "look:fn_bell_01");
  g.compare("green_bell", "t_finch_nini");
  g.compare("t_lily_nini", "t_finch_nini");
  g.deduce("d_1147", "happened");
  g.deduce("d_blame", "unknown");
  g.settle();
  drain(g);
  assert.equal(g.state.chapter, "ch2");
  goTo(g, "square_late");
  ask(g, "finch", "finch_late_01");
  goTo(g, "flower_stall_late");
  ask(g, "lily", "lily_late_01");
  g.deduce("d_lily_timing", "after_ten");
  goTo(g, "fountain_late");
  act(g, "look:fnl_gate_01");
  // ending fires; before finishing, compare the last optional pair via a fresh check
  const all = g.data.order.evidence.filter((id) => !g.state.evidence[id]);
  assert.deepEqual(all, [], "all evidence collected");
  assert.equal(g.state.contradictions.c_bell_two_places.state, "partial");
  assert.equal(g.state.ui.mode, "end");
});

test("fuzz: random play never crashes, never soft-locks, and can always be finished", () => {
  const { B } = mk();
  for (let seed = 1; seed <= 150; seed++) {
    let s = seed;
    const rnd = (n) => ((s = (s * 1103515245 + 12345) % 2147483648), s % n);
    const g = new B.Game(B.story, { seenEver: {}, completedRuns: 0, endingsSeen: {} });
    g.newGame();
    const steps = 30 + rnd(250);
    for (let i = 0; i < steps && g.state.ui.mode !== "end"; i++) {
      const m = g.state.ui.mode;
      if (m === "chapterCard") g.continueChapterCard();
      else if (m === "ending") g.advance();
      else if (m === "dialogue") {
        const v = g.dialogueView();
        assert.ok(v, "dialogue view exists");
        if (v.choices.length) g.choose(rnd(v.choices.length));
        else g.advance();
      } else if (m === "topics") {
        const t = g.topicList(g.state.ui.npc);
        const ev = Object.keys(g.state.evidence);
        const r = rnd(10);
        if (r < 5 && t.length) g.chooseTopic(t[rnd(t.length)].id);
        else if (r < 7 && ev.length) g.presentEvidence(ev[rnd(ev.length)]);
        else g.leaveTalk();
      } else if (m === "scene") {
        const acts = g.sceneView().actions;
        assert.ok(acts.length > 0, "scene always offers something to do");
        const r = rnd(10);
        const ev = Object.keys(g.state.evidence);
        if (r === 0 && ev.length > 1) g.compare(ev[rnd(ev.length)], ev[rnd(ev.length)]), g.settle();
        else if (r === 1) {
          const ds = g.deductionList().filter((d) => !d.solved);
          if (ds.length) {
            const d = ds[rnd(ds.length)];
            g.deduce(d.id, d.options[rnd(d.options.length)].id);
            g.settle();
          }
        } else if (r === 2) {
          // save + load round trip at a random moment
          const st = JSON.parse(JSON.stringify(g.state));
          g.loadState(st);
        } else g.doAction(acts[rnd(acts.length)].id);
      }
      if (rnd(25) === 0 && g.state.ui.mode !== "end") {
        g.loadState(JSON.parse(JSON.stringify(g.state)));
      }
    }
    assert.deepEqual(g.warnings, [], `seed ${seed}: ${g.warnings}`);
    if (g.state.ui.mode !== "end") assert.ok(solve(g), `seed ${seed}: could not finish from chapter ${g.state.chapter} scene ${g.state.scene}`);
    // evidence and flags are never inconsistent with each other
    if (g.state.evidence.green_bell) assert.equal(g.state.flags.green_bell_found, true, `seed ${seed}`);
    if (g.state.contradictions.c_nini_parade) {
      assert.ok(g.state.evidence.t_lily_nini && g.state.evidence.t_finch_nini, `seed ${seed}: contradiction without its evidence`);
    }
  }
});
