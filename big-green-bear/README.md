# Big Green Bear's Adventure — engine + vertical slice

A small narrative mystery engine written in plain HTML, CSS, and JavaScript, plus a 15–30 minute vertical slice of *Big Green Bear's Adventure*.

**To play:** open `index.html` in a browser. You don't need a server, a build step, or any installs.

```
big-green-bear/
├── index.html              loads everything, in order
├── css/
│   ├── tokens.css          every colour / font / size (swap this for a design system)
│   ├── base.css            layout and components
│   └── memory.css          memory-degradation effects (the UI as narrator)
├── engine/                 the reusable engine — no story in here
│   ├── core.js             namespace, event bus, STORY REGISTRY
│   ├── i18n.js             localization
│   ├── rules.js            conditions + effects (the "verbs" content uses)
│   ├── game.js             headless game core (state, dialogue, evidence, chapters…)
│   ├── save.js             save slots, autosave, settings, NG+ meta
│   ├── validate.js         checks content for broken references / missing translations
│   ├── audio.js            layered, synthesized audio (no files needed)
│   ├── ui.js               rendering + input (mouse, keyboard, screen reader)
│   ├── debug.js            developer panel (remove for production)
│   └── main.js             boot
├── content/                THE STORY — edit freely
│   ├── config.js
│   ├── locales/en.js, ko.js    UI strings
│   ├── characters.js  chapters.js  scenes.js
│   ├── evidence.js  contradictions.js  deductions.js
│   ├── timeline.js  hints.js  endings.js
│   └── dialogue/ch1_festival.js, ch2_rain.js
└── tests/
    ├── engine.test.js      plays the game headlessly (18 scenarios incl. a fuzzer)
    ├── e2e.js              real-browser test (keyboard, mouse, mobile, Korean…)
    └── load.js
```

---

## Why it's built this way

| Decision | Why |
|---|---|
| **Plain `<script>` files, no modules, no build** | Double-click `index.html` and it runs. (ES modules and `fetch` are blocked on `file://`.) There are no dependencies to install or keep updated. |
| **Content is JavaScript object literals, not JSON** | Reads almost exactly like JSON but allows comments and trailing commas, and loads from `file://`. Each file calls one function, such as `BGB.story.dialogue({...})`. |
| **Headless game core (`game.js`) separate from the UI (`ui.js`)** | The whole game can be *played by a test script*. That's how we prove there are no soft-locks, rather than hoping. It also means the UI can be redesigned without touching story logic. |
| **One condition/effect vocabulary everywhere** | Dialogue, scenes, chapters, hints, evidence and endings all use the same `conditions` / `effects` lists. Learn it once. |
| **Story text written inline as `{ en, ko }`** | The translator sees the original line right next to their own, which encourages natural translation over word-for-word substitution. Text can't get out of sync with keys. |
| **Validator runs in debug mode and in tests** | A typo in a node id would otherwise become a soft-lock. Now it's an error in the console and the debug panel. |
| **Synthesized audio** | The slice ships with zero audio files. Any sound can be swapped for a real file later with one line. |
| **All visual values in `tokens.css`** | A design system (e.g. Claude Design) can be connected by replacing or remapping this one file. |

---

## How the engine works (5-minute version)

The game is always in exactly one **mode**:

```
chapterCard → scene ⇄ topics (talking) ⇄ dialogue → … → ending → end (NG+)
```

- **Scene:** a place with a description and a numbered list of actions: look, talk, go.
- **Topics:** you're talking to someone. Pick what to ask, or show them evidence.
- **Dialogue:** lines, choices, and branches. Each line can run effects (unlock evidence, set flags…).
- When control returns to the player, the engine **settles**:
  1. contradictions whose conditions are now met move forward (unresolved → partial → resolved/ambiguous)
  2. queued effects run (go to a scene, start a dialogue, start an ending)
  3. one-time **events** fire (e.g. "the rain begins")
  4. if the chapter's `completeWhen` is satisfied, the next chapter card appears

**Story state** (all saved, see `defaultState` in `game.js`):

| field | meaning |
|---|---|
| `flags` | any value: `true`, numbers, strings. `{ type:"setFlag", id, value }` |
| `chapter`, `scene`, `clock` | where/when the player is (`clock` is "HH:MM", 24h) |
| `memory` | memory reliability 0–100 (a narrative state, never shown as a number) |
| `evidence` | what's on the board |
| `contradictions` | found contradictions and their state |
| `hypotheses` | the player's theories: every attempt, plus whether one was confirmed |
| `seen`, `visited`, `fired` | dialogue lines seen, scenes visited, events fired |
| `playthrough` | 1, then 2+ for New Game+ |
| `ui` | current mode + current dialogue line, so a save made mid-sentence resumes on that sentence |

### Conditions (read-only checks)

```js
{ type: "flag", id: "rain_started" }                 // truthy
{ type: "flag", id: "visits", gte: 2 }               // also: equals, lte
{ type: "evidence", id: "green_bell" }
{ type: "contradiction", id: "c_nini_parade", state: "partial" }   // "at least partial"
{ type: "deduced", id: "d_lily_timing" }             // player's theory was confirmed
{ type: "chapter", id: "ch2" }   { type: "chapterAtLeast", id: "ch2" }
{ type: "memory", lte: 70 }      { type: "ngPlus" }
{ type: "seen", id: "node_id" }  { type: "visited", id: "scene_id" }  { type: "turns", gte: 7 }
{ type: "not", condition: {...} }
{ type: "any", of: [ {...}, {...} ] }                // OR (a list is AND by default)
```

### Effects (things that happen)

```js
{ type: "setFlag", id, value }        { type: "addFlag", id, amount }
{ type: "unlockEvidence", id }        { type: "findContradiction", id }
{ type: "setContradiction", id, state }
{ type: "setMemory", value }          { type: "changeMemory", amount }
{ type: "setClock", time: "23:47" }   { type: "goScene", id }
{ type: "startDialogue", id }         { type: "setChapter", id }
{ type: "startEnding", id }           { type: "playSound", id }
{ type: "notify", text: {en, ko} }    { type: "fx", id: "tide" }   { type: "autosave" }
```

Any effect can carry its own `conditions: [...]`, and then it only runs if they pass.

### Text that changes meaning

Every text-bearing object (dialogue line, scene, timeline entry, ending step) supports:

```js
text:       { en: "Go home.", ko: "집에 가요." },
ngPlusText: { en: "Go home.", ko: "…" },                      // 2nd playthrough
variants:   [ { conditions: [{ type: "memory", lte: 50 }], text: {...} } ]  // first match wins
```

Priority: first matching **variant** > **ngPlusText** (on NG+) > **text**.

---

## How to…

### Add an NPC

In `content/characters.js`:

```js
mabel: {
  name: { en: "Mabel", ko: "메이블" },
  look: { text: { en: "A sleepy cat behind a steamed-up window.", ko: "…" } },
  talk: [
    { label: { en: "Say hello", ko: "인사하기" }, start: "mabel_hello_01" },
    { label: { en: "The noise", ko: "그 소리" }, start: "mabel_noise_01",
      conditions: [{ type: "flag", id: "rain_started" }], once: true },
  ],
  present: { green_bell: "mabel_p_bell", default: "mabel_p_default" },

  // writer-only notes (shown in the debug panel, never to players):
  role: "Cafe owner.", truth: "Heard the water at 20:15, assumed festival noise.",
  memoryVersion: "A cat.", emotion: "guilty in hindsight",
},
```

Then put them somewhere: in `scenes.js`, add `{ type: "talk", npc: "mabel" }` to a scene's `actions`.

If an NPC has exactly one topic and it's new, talking to them starts it immediately.

### Add dialogue

Create or extend a file in `content/dialogue/` (and add a `<script>` tag for any new file in `index.html`):

```js
BGB.story.dialogue({
  mabel_hello_01: {
    speaker: "mabel",                       // omit for narration
    text: { en: "We're closed. …Oh, it's you.", ko: "영업 끝났어요. …아, 곰이구나." },
    next: "mabel_hello_02",
  },
  mabel_hello_02: {
    choices: [
      { text: { en: "\"Did you hear anything tonight?\"", ko: "…" }, next: "mabel_noise_01" },
      { text: { en: "\"Never mind.\"", ko: "…" } },          // no next = conversation ends
    ],
  },
  mabel_noise_01: {
    speaker: "mabel",
    text: { en: "Knocking. Under the floor. I thought it was the band.", ko: "…" },
    effects: [{ type: "unlockEvidence", id: "t_mabel_noise" }],
    fx: ["echo"],
    // branch: first matching condition wins
    next: [
      { conditions: [{ type: "evidence", id: "t_finch_locked" }], to: "mabel_noise_locked" },
      { to: "mabel_noise_end" },
    ],
  },
});
```

- A node whose `conditions` fail is **skipped** (goes to its `else`, or its `next`).
- A node with no `text` and no `choices` is a silent logic node: it runs its effects and branches.
- If every choice is hidden by conditions, the node falls through to `next`. Choices can never soft-lock.

### Add evidence

In `content/evidence.js`:

```js
t_mabel_noise: {
  title: { en: "Mabel: knocking under the floor", ko: "…" },
  kind: "testimony",                 // item | document | testimony | observation | photo
  source: { en: "Mabel", ko: "메이블" },
  reliability: "testimony",          // firsthand | document | testimony | hearsay | memory | unknown
  tags: ["water", "passage"],
  related: ["clogged_drain"],        // comparing these says "they feel connected"
  description: { en: "Mabel heard knocking under the cafe around eight.", ko: "…" },
  interpretations: [                 // LAST matching one is shown; card is marked "reread"
    { conditions: [{ type: "flag", id: "tl_2015_known" }], text: { en: "Water. Not knocking.", ko: "…" } },
    { conditions: [{ type: "ngPlus" }], text: { en: "…", ko: "…" } },
  ],
  realMeaning: "20:15, water entering the passage.",   // debug panel only
},
```

Unlock it with `{ type: "unlockEvidence", id: "t_mabel_noise" }`. Evidence is never removed, and it stays valid in any order.

### Create a contradiction

In `content/contradictions.js`:

```js
c_noise: {
  between: ["t_mabel_noise", "t_finch_pump"],
  title: { en: "What was the noise?", ko: "…" },
  text:  { en: "Mabel heard knocking. Mr. Finch said the pump was fine.", ko: "…" },
  partial:   { conditions: [{ type: "flag", id: "tl_2100_known" }], text: { en: "…", ko: "…" } },
  resolved:  { conditions: [...], text: {...} },
  ambiguous: { conditions: [...], text: {...} },   // some things can't be known: that's a valid end state
},
```

The player finds it by comparing the two pieces of evidence on the board, or you can trigger it with `{ type: "findContradiction", id }`. A nice pattern is to let the player show one person's testimony to the other (see `lily_p_finch`). The game only ever says "These memories do not match"; it never says who is lying. States only move forward.

### Add a theory (deduction / accusation)

In `content/deductions.js`: give it a `question`, `options`, the `answer`, and optionally `onCorrect`. The player's pick is stored as a **hypothesis**. Only the right answer becomes `{ type: "deduced", id }`. Wrong answers are recorded and can be retried, with no penalty. Deductions can unlock long before the story "reveals" the answer, so players who work it out early are simply right.

### Add a chapter

In `content/chapters.js` (chapters run in the order they're listed):

```js
ch3: {
  title: { en: "Under the Square", ko: "광장 아래" },
  subtitle: { en: "…", ko: "…" },
  memory: 85,                     // reliability when it begins
  clock: "23:40",
  startScene: "cafe",
  onEnter: [{ type: "startDialogue", id: "ch3_intro_01" }],
  audio: { music: "theme", ambience: ["rain_heavy", "drips"] },
  events: [ { id: "ch3_alarm", conditions: [...], dialogue: "…" } ],
  completeWhen: [ { type: "deduced", id: "d_who_locked" } ],
  next: "ch4",
},
```

Then set `next: "ch3"` on the previous chapter (ch2 currently ends the slice with an event; remove that event).

**Soft-lock rule:** everything in `completeWhen` must be reachable in any order, and must be covered by a hint goal in `hints.js`. The test suite checks that a hint is available at every step of a full run.

### Add localization

1. Copy `content/locales/en.js` to, e.g., `ja.js`, change `"en"` to `"ja"`, and translate the values.
2. Add `<script src="content/locales/ja.js"></script>` to `index.html`.
3. Add `ja: "…"` next to `en` / `ko` in story text. Missing story text falls back to English, and the validator lists every missing line.
4. Add `"settings.lang.ja"` and `"lang.switchTo.ja"` to every locale file.

The language is detected from the browser on first launch and can be changed in Settings.

Writing tip: write the Korean (or any language) as a native writer would, not as a translation. The structure supports different sentence lengths and line breaks per language.

### Create a new ending

In `content/endings.js`:

```js
ending_x: {
  title: {...}, epilogue: {...},
  audio: { music: null, ambience: [] },          // silence by default
  steps: [
    { text: {...}, fx: ["minimal"] },
    { speaker: "hazel", text: {...} },
    { pause: 2500 },                                // silence; moves on by itself
    { conditions: [{ type: "flag", id: "all_evidence_found" }], text: {...} },  // optional line
    { text: {...}, sound: "bell" },
  ],
  onComplete: [ ... ],
},
```

Start it with `{ type: "startEnding", id: "ending_x" }`, usually from a chapter event. Finishing any ending unlocks **Begin again** (NG+) on the title screen. `ending_home` is the final ending's structure with placeholder lines, and you can play it from the debug panel.

### Memory reliability and narrative CSS

`memory` (0–100) maps to a tier on `<html data-memory="…">`:

| memory | tier | what happens |
|---|---|---|
| 98–100 | `stable` | nothing |
| 80–97 | `faint` | buttons answer a few ms late |
| 60–79 | `unsteady` | lists drift slowly; some lines echo |
| 35–59 | `fragmented` | the HUD clock sometimes reads 11:47; colder palette |
| 0–34 | `final` | most distortion; "previous line" fades |

A continuous `--instability` variable also raises the **water** (it rises behind the text, never over it) and cools the colours. The music is low-pass filtered ("underwater"), and the hidden alarm rhythm in the theme becomes faintly audible.

"Random" distortions are **deterministic** (hashed from the line id), so the same line always distorts the same way. They're intentional and testable.

For authored moments, add `fx` to a line or scene: `echo`, `drift`, `clock1147`, `cold`, `minimal`, `still`. For one-off effects use `{ type: "fx", id: "tide" | "ripple" | "flicker" }`.

**Accessibility always wins:** *Reduce motion* (or the OS setting) turns off all animation, and *Visual distortion: Gentle* softens echo, drift, colour and water.

### Audio

Scenes, chapters, dialogue lines and endings accept:

```js
audio: { music: "theme", ambience: ["rain_light", "festival"] }
audio: [ { conditions: [...], music: "theme", ambience: [...] }, { music: null } ]   // first match
```

Built-in sounds:
- loops: `theme`, `rain_light`, `rain_heavy`, `festival`, `drips`, `heartbeat`
- one-shots: `bell`, `thunder`, `page`, `evidence`, `contradiction`, `ui_select`, `ui_move`

To use a real file instead:

```js
BGB.story.sounds({ rain_heavy: { src: "audio/rain.ogg", bus: "ambience", loop: true } });
```

---

## Debug tools

With `debug: true` in `content/config.js`, press **F2** (or the small "debug" button).

| tab | what it does |
|---|---|
| **state** | jump to any chapter or scene; drag memory reliability; set the clock; toggle NG+; set any flag; full state dump |
| **evidence** | unlock any or all evidence; see what each card currently says and its *real meaning* |
| **contradictions** | force any state; see every theory's attempts and answer |
| **dialogue** | play any dialogue node; play any ending; start a fresh NG+ run |
| **validate** | content errors/warnings, runtime warnings, audio status |
| **reset** | wipes this game's saves and NG+ progress (nothing else in the browser) |

**Production build:** set `debug: false` in `content/config.js` and delete the `engine/debug.js` line from `index.html`. Then the panel doesn't exist at all.

---

## Saving

- **Autosave** happens on every scene change, evidence, chapter, end of conversation, and when the tab is hidden or closed. **Continue** on the title screen loads it.
- **3 manual slots** live in Menu → Save. Overwriting asks first.
- Saving mid-conversation resumes on the same line, without re-running its effects.
- Old or damaged saves are repaired (missing scene → chapter start; missing line → back to the scene) instead of crashing. One unreadable slot never affects the others.
- Storage is the browser's `localStorage`, under keys starting with `bgb.` only. If storage is blocked, the game still runs and says so.
- New Game+ progress (endings seen, lines read) is kept separately from save slots.

## Controls & accessibility

| input | action |
|---|---|
| `1`–`9` | choose a numbered option |
| `Enter` / `Space` / click | continue (first press finishes the typewriter) |
| `B` | evidence board (arrow keys switch tabs) |
| `H` | hints (three levels; the last one asks first) |
| `Esc` | close a panel / pause menu |
| `Tab` | move focus (focus is always visible and trapped inside open panels) |

Settings: language, text speed (including instant), text size (4 steps), high contrast, reduce motion, visual distortion strength, show read text instantly, "Skip what you've read", and per-channel volume plus mute.

Every status uses a text label and a symbol, never colour alone. Dialogue is announced to screen readers through a live region.

## Testing

```bash
node --test tests/engine.test.js     # or: npm test        (no install needed)
node tests/e2e.js                    # or: npm run test:browser  (needs Playwright + Chromium)
npm run validate                     # content check only
```

`engine.test.js` plays the game headlessly. It covers a normal run, ignoring Nini entirely, unexpected NPC order, clues found before their explanation, early 11:47 deduction, wrong accusations, a completionist run, save/load mid-dialogue, damaged saves, monotonic contradiction states, hints available at every step, NG+, localization, and a **150-seed random-play fuzzer** that saves and loads at random moments, then proves the slice can still be finished.

`e2e.js` drives real Chromium from `file://`. It covers keyboard-only play, mouse-only play, the board, save, page reload and continue, NG+, the debug panel, a 375px phone in Korean with reduced motion, and very long text wrapping, and checks that there are no JS errors.

## The vertical slice

Chapter 1, *Winter Night* (memory 100), and the opening of Chapter 2, *The Rain* (memory 95):

- Bellflower Square, the festival, Big Green Bear as mascot, Nini and the green bell ("You're coming too, right?" / "Of course.")
- Lily and Mr. Finch, each with real reasons and no villainy
- The rain event, which comes whether or not you've met Nini (if you haven't, the memory has a gap)
- The **first contradiction**: where was Nini during the parade? Compare it on the board, or show one testimony to the other person.
- The blocked drain, the gate notice for a closure that **hasn't happened yet** (the subtle memory inconsistency), the clock briefly reading 11:47 (CSS distortion), and the bell found wet at the passage steps
- Chapter 2: Finch repeats himself, Lily's timing clue, a deduction that partly explains the contradiction, and something ringing below while the bell is in your paw
- Optional content: a second contradiction (one bell, two places), the 11:47 theory you can get right early, and an accusation question whose right answer is "you don't know enough yet"
- NG+ lines (`intro_03`, `fn_bell_04`, `lily_late_02`…) and NG+ evidence readings

Writer's truth for every character, evidence and timeline entry is in the content files (`truth`, `realMeaning`). The full real timeline is in `content/timeline.js`.
