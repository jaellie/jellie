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

**Big popups.** `popup.big === true` marks a life-changing moment (고백, 상견례, 결혼식, 부고, 병원에서 온 전화, 이별, 배신, 출산…). Show it Kairosoft-style: `popup.title` in a banner, `popup.scene` as the picture in the middle (draw it like `game.scene()`, scaled), then the line and choices.

`popup.who` is one of `me`, `mom`, `dad`, `boss`, `coworker`, `partner`, `friend`, `npc`, `fated`, `stranger`, `recruiter`, `professor`, `mentor`, `barista`, `instructor`, `inlaw`, `judge`, `nurse`, `doctor` or `relative`. **Always show `popup.name`** (it is always set; never print `who`). Someone you haven't met yet is named `낯선 사람`. For `npc`, `fated` and `partner`, seed the sprite from `popup.npcId` / `popup.seed` and `popup.gender`. `popup.source` is `story` for the life-changing scenes, `opportunity`, `world` or `plan` otherwise.

The result of `game.choose(i)` is `{ who, name, line }`, and `name` is always set.

## Scene

`game.scene()` changes by itself: a story day moves you (wedding hall, court, funeral hall, airport → hotel → branch office on a business trip). After marriage, home uses the newlywed background.

Backgrounds: draw `ROOMS[scene.bgId] ?? ROOMS[scene.sceneKey] ?? ROOMS[scene.roomKey]`. `roomKey` always names an existing painter; when `standIn` is true it is only the closest stand-in, so paint `ROOMS[sceneKey]` for that place (wedding_venue, funeral_hall, hospital, court, airport, airplane, family_home, …).

**Walking (Kairosoft style).** Call `game.wander()` every **500 ms** and move each actor from its previous `spot` to the new one over ~480 ms (linear). Everyone walks tile by tile; `walking` → play walk frames, `facing` (`NE`/`NW`/`SE`/`SW`) → flip the sprite, `offscreen` → they walked out (hide); they come back later. Keep actor elements between frames (keyed by `who`) so the motion animates.

Actor `role` values: `me`, `partner`, `fated`, `npc`, `kid`, `pet` (`npcType` `pet_dog` / `pet_cat`), `inlaw`, `guest`, `relative`, `coworker`, `baby`, `patient`, `friend`. `actor.name` is empty for people you haven't met, so don't draw a name tag.

> Put the actors inside a stacking context (e.g. `#scene { position:relative; z-index:1; isolation:isolate }`). `actor.z` can be larger than the popup's z-index, and without this a character draws *over* the popup and eats its clicks.

## "시간이 흐른다…" memory cards

`endDay().cards` is 0–6 `{ kind, age, caption, scene }` in chronological order. Show one card per ▶ and use the progress bar = `cards.length`. Draw `card.scene` exactly like `game.scene()` (same background and actors), scaled into the frame, with `caption` under it. With no cards, show `r.lines` as before.

Kinds: `START_DATING`, `FIRST_DATE`, `PROPOSAL`, `MEET_PARENTS` (상견례), `CALL_OFF` (파혼), `WEDDING`, `NEW_HOME`, `BIRTH`, `KID_SCHOOL`, `PET_ADOPT`, `PET_FAREWELL`, `FLIGHT` (비행기 안), `MOVE_CITY`, `GRADUATION`, `JOB_START`, `JOB_CHANGE`, `PROMOTION`, `LAYOFF`, `INDEPENDENCE`, `SHOP_CLOSE`, `RETIREMENT`, `WINDFALL`, `LOSS`, `HOSPITAL`, `RECOVERED`, `DIVORCE`, `BREAKUP`, `FRIEND_WEDDING`, `MOM_FUNERAL`, `DAD_FUNERAL`, `PARENT_FUNERAL`, `PARTNER_FUNERAL`, `FRIEND_FUNERAL`, `FAMILY_FUNERAL`.

## Memorial (death)

`game.memorial()` → `{ fadeMs: 4000, lineMs: 3500, epitaph: "민아 · 1997 – 2079", lines: [3 strings], cards }`. Fade the screen to black over `fadeMs`, show `epitaph`, then each line `lineMs` apart. Optionally replay `cards` afterward.

## Story (hidden from the player)

The destined person is a crush by default: known by name, never an automatic couple. Hidden 궁합 (사주 day pillars/띠/elements + synastry + MBTI) bends whether a confession, a reunion or a marriage talk works — as part of the chart's 70%.

Astrology uses transits, secondary progressions, the Solar Return (the year's theme) and the Lunar Return (the month's mood, e.g. which weekend plans appeal). When transits and progressions point at the same life area in the same year, that year becomes the fated turning point.


At birth, 사주 + 점성술 pick **5–7 fated turning points** (love, marriage, crisis, career turn at e.g. 43, move, loss, money, child, pet, illness, early retirement). Each one's situation is fixed; the outcome is **70% chart, 30% the player's choice**. When the chart overrides the choice, the result line says so. The day before, a hint line appears. Big things run as multi-day arcs: dating → proposal → 상견례 (파혼 possible) → wedding → new home; divorce → court; illness → treatment → result; retirement at 60 (or 명예퇴직), unless you run your own place. A life takes about 20–25 played days.

## Screen layout (Kairosoft style)

- No activity or 나가기 buttons: the day plays by itself; the player answers popups (and picks weekend plans).
- Top, under the HUD: **one log line** — `{kind:"log"}` / `{kind:"enter"}` text with the time (`10:02 시우와 처음으로 제대로 이야기했다.`).
- Under the log line: **text notifications** (`{kind:"toast"}`) slide down from behind it, stack (max 3) and fade after ~4 s. `from` is the sender (a leading `[이름]` in a text is already turned into `from`).
- **Popups are centered** on the play screen.
- **No name tags** on characters.
- `game.actions()`, `doActivity()`, `destinations()`, `goTo()` still exist (optional).

## Setup (from the existing form)

Defaults: name `제이`, birth `1997-09-28` (solar).

```js
LoveSim.createGame({
  name, gender: "F" | "M", likes: "M" | "F" | "A",
  birth: { year, month, day, hour?, minute? },   // SOLAR (convert lunar first)
  mbti: "ENFP", lang: "ko",
  family: {
    mom: { alive: true | false }, dad: { alive: true | false },
    siblings: [{ rel: "언니" | "오빠" | "누나" | "형" | "남동생" | "여동생", name? }],
    grandparents: 0-4,            // how many are still alive
  },
  fated: {
    name, gender, mbti, birth: { year, month, day },   // birth + mbti → hidden 궁합
    status: "crush" | "dating" | "stranger",           // crush (default when named) = someone you like, NOT a couple yet
    from: "same" | "city" | "abroad", job, profile: { look },
  },
})
```

## Why bugs like "Mom congratulates a promotion after a layoff" can't come back

- Every message and small event has `requires` (life facts). The Director re-checks them at the moment of showing.
- A keyword guard (`data/game/guard.json`) blocks texts that imply facts the author forgot to declare, such as manager or work lines while unemployed.
- `npm test` lints all content and plays whole lives, failing if anything contradictory ever shows.
- Pacing is enforced per day: 1–3 small events, 0–2 messages, and at most 2 big choices. Lines don't repeat within 4 days, and weekend menus vary.
