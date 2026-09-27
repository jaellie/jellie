# Claude Design integration: one engine, design frame unchanged

`dist/lovesim-engine.js` (global `LoveSim`) is the **whole game brain**: 사주, astrology, MBTI, world, NPCs, opportunities, messages, the Director, save/load, and life until death. The prototype keeps only the **design frame**: screens, pixel art, `ROOMS` painters, `CS` sprites, popups, buttons and fonts. Remove the old engine (`SIM`) completely.

## Method mapping (prototype → LoveSim)

| Prototype today | Replace with |
|---|---|
| `SIM.init`, building `this.g` in `startGame()` | `this.game = LoveSim.createGame(setup)`; the setup is described below |
| `startDay()` / `SIM.dayStart` | Called automatically by `createGame` and `endDay`. Day info: `game.s.day` → `{ age, season, label, weekend }` (use it for the stamp) |
| `locAt(m)`, the `CH` table, `g.q` queue, `fire(ev)`, `planEvent`, `leaveEvent`, `travelEvent`, `SIM.pick`, `SIM.toasts` | **Delete.** In `tick()`, call `const beats = game.advance(game.s.minute + 0.32 * speed)` and handle the beats (see the next table) |
| `choose(i)` → `SIM.choose` | `const r = game.choose(i)` → `u.res = { who: r.who, line: r.line }`. The first click only selects, as now; call `game.choose` on confirm |
| `endDay()` → `SIM.years` | `const r = game.endDay()`. If `r.over`, show the memorial (below); otherwise show the "시간이 흐른다…" screen with `r.fromAge`, `r.toAge` and **`r.cards`** (memory cards, below) |
| `toEnd()` → `SIM.ending` | `game.memorial()` (also in `game.ending().memorial`). It happens only when the player dies, never at a fixed age |
| `presence()`, `posOf`, `room(L)` | `const p = game.scene()`: draw `ROOMS[p.roomKey]()` (or `p.baseColor`), overlays `p.overlays`, characters `p.actors` at `X(i,j)/Y(i,j)` with `zIndex = actor.z` |
| HUD (date, money, status) | `game.hud()` → `{ date, age, money, job, relationship, location, city }` |
| Settings → 인생 / 사람들 / 나 | `game.lifeLog()` / `game.people()` / `game.hud()` |
| `save()` / `cont()` | `localStorage.setItem(KEY, game.save())` / `this.game = LoveSim.loadGame(localStorage.getItem(KEY))` |
| Language toggle | `game.setLang("ko" \| "en")` |

## Beats returned by `game.advance()`

| Beat | What to do |
|---|---|
| `{kind:"enter", locationId, room, name}` | The location changed. Refresh the scene with `game.scene()` and set the log to `name` |
| `{kind:"popup", popup}` | `openPop({ who: popup.who, line: popup.line, ch: popup.ch })`. Stop advancing until `game.choose(i)`. **Close the destination list if it is open** (a popup interrupts) |
| `{kind:"toast", from, text}` | Show the existing toast as `from: "text"` |
| `{kind:"log", text}` | Set the bottom log line |
| `{kind:"dayEnd"}` | Call `game.endDay()` |

`popup.who` is one of `me`, `mom`, `dad`, `boss`, `coworker`, `partner`, `friend`, `npc`, `fated`, `stranger`, `recruiter`, `professor`, `mentor`, `barista`, `instructor`, `inlaw`, `judge`, `nurse`, `doctor` or `relative`. **Always show `popup.name`** (it is always set; never print `who`). Someone you haven't met yet is named `낯선 사람`. For `npc`, `fated` and `partner`, seed the sprite from `popup.npcId` / `popup.seed` and `popup.gender`. `popup.source` is `story` for the life-changing scenes, `opportunity`, `world` or `plan` otherwise.

The result of `game.choose(i)` is `{ who, name, line }`, and `name` is always set.

## Scene

`game.scene()` changes by itself: a story day moves you (wedding hall, court, funeral hall, airport → hotel → branch office on a business trip). After marriage, home uses the newlywed background. Call `game.wander()` about every 2.8 s and redraw: **every** actor moves, not only the player.

Actor `role` values: `me`, `partner`, `fated`, `npc`, `kid`, `pet` (`npcType` `pet_dog` / `pet_cat`), `inlaw`, `guest`, `relative`, `coworker`, `baby`, `patient`, `friend`. `actor.name` is empty for people you haven't met, so don't draw a name tag.

> Put the actors inside a stacking context (e.g. `#scene { position:relative; z-index:1; isolation:isolate }`). `actor.z` can be larger than the popup's z-index, and without this a character draws *over* the popup and eats its clicks.

## "시간이 흐른다…" memory cards

`endDay().cards` is 0–6 `{ kind, age, caption, scene }` in chronological order. Show one card per ▶ and use the progress bar = `cards.length`. Draw `card.scene` exactly like `game.scene()` (same background and actors), scaled into the frame, with `caption` under it. With no cards, show `r.lines` as before.

Kinds: `START_DATING`, `FIRST_DATE`, `PROPOSAL`, `MEET_PARENTS` (상견례), `CALL_OFF` (파혼), `WEDDING`, `NEW_HOME`, `BIRTH`, `KID_SCHOOL`, `PET_ADOPT`, `PET_FAREWELL`, `FLIGHT` (비행기 안), `MOVE_CITY`, `GRADUATION`, `JOB_START`, `JOB_CHANGE`, `PROMOTION`, `LAYOFF`, `INDEPENDENCE`, `SHOP_CLOSE`, `RETIREMENT`, `WINDFALL`, `LOSS`, `HOSPITAL`, `RECOVERED`, `DIVORCE`, `BREAKUP`, `FRIEND_WEDDING`, `MOM_FUNERAL`, `DAD_FUNERAL`, `PARENT_FUNERAL`, `PARTNER_FUNERAL`, `FRIEND_FUNERAL`, `FAMILY_FUNERAL`.

## Memorial (death)

`game.memorial()` → `{ fadeMs: 4000, lineMs: 3500, epitaph: "민아 · 1997 – 2079", lines: [3 strings], cards }`. Fade the screen to black over `fadeMs`, show `epitaph`, then each line `lineMs` apart. Optionally replay `cards` afterward.

## Story (hidden from the player)

At birth, 사주 + 점성술 pick **5–7 fated turning points** (love, marriage, crisis, career turn at e.g. 43, move, loss, money, child, pet, illness, early retirement). Each one's situation is fixed; the outcome is **70% chart, 30% the player's choice**. When the chart overrides the choice, the result line says so. The day before, a hint line appears. Big things run as multi-day arcs: dating → proposal → 상견례 (파혼 possible) → wedding → new home; divorce → court; illness → treatment → result; retirement at 60 (or 명예퇴직), unless you run your own place. A life takes about 20–25 played days.

## Buttons

- **Actions:** `game.actions()` returns up to 3 activities plus `LEAVE`. Clicking one calls `game.doActivity(id)`, which returns beats. Activities take real time, so there is no farming.
- **LEAVE:** show `game.destinations()` (`{id, label, open}`), then `game.goTo(id)` for about 2 hours. After that the schedule resumes.

## Setup (from the existing form)

```js
LoveSim.createGame({
  name, gender: "F" | "M", likes: "M" | "F" | "A",
  birth: { year, month, day, hour?, minute? },   // SOLAR (convert lunar first)
  mbti: "ENFP", lang: "ko",
  fated: { name, gender, mbti, birth: { year, month, day }, from: "same" | "city" | "abroad", job, profile: { look } },
})
```

## Why bugs like "Mom congratulates a promotion after a layoff" can't come back

- Every message and small event has `requires` (life facts). The Director re-checks them at the moment of showing.
- A keyword guard (`data/game/guard.json`) blocks texts that imply facts the author forgot to declare, such as manager or work lines while unemployed.
- `npm test` lints all content and plays whole lives, failing if anything contradictory ever shows.
- Pacing is enforced per day: 1–3 small events, 0–2 messages, and at most 2 big choices. Lines don't repeat within 4 days, and weekend menus vary.
