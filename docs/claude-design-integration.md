# Claude Design integration: one engine, design frame unchanged

`dist/lovesim-engine.js` (global `LoveSim`) is the **whole game brain**: 사주, astrology, MBTI, world, NPCs, opportunities, messages, the Director, save/load, and life until death. The prototype keeps only the **design frame**: screens, pixel art, `ROOMS` painters, `CS` sprites, popups, buttons and fonts. Remove the old engine (`SIM`) completely.

## Method mapping (prototype → LoveSim)

| Prototype today | Replace with |
|---|---|
| `SIM.init`, building `this.g` in `startGame()` | `this.game = LoveSim.createGame(setup)`; the setup is described below |
| `startDay()` / `SIM.dayStart` | Called automatically by `createGame` and `endDay`. Day info: `game.s.day` → `{ age, season, label, weekend }` (use it for the stamp) |
| `locAt(m)`, the `CH` table, `g.q` queue, `fire(ev)`, `planEvent`, `leaveEvent`, `travelEvent`, `SIM.pick`, `SIM.toasts` | **Delete.** In `tick()`, call `const beats = game.advance(game.s.minute + 0.32 * speed)` and handle the beats (see the next table) |
| `choose(i)` → `SIM.choose` | `const r = game.choose(i)` → `u.res = { who: r.who, line: r.line }`. The first click only selects, as now; call `game.choose` on confirm |
| `endDay()` → `SIM.years` | `const r = game.endDay()`. If `r.over`, show the memorial (below); otherwise show the "시간이 흐른다…" screen with `r.fromAge`, `r.toAge`, **`r.notes`** (what happened meanwhile) and **`r.cards`** (memory cards, below) |
| `toEnd()` → `SIM.ending` | `game.memorial()` (also in `game.ending().memorial`). It happens only when the player dies, never at a fixed age |
| `presence()`, `posOf`, `room(L)` | `const p = game.scene()`: draw `ROOMS[p.roomKey]()` (or `p.baseColor`) over the **whole play area** (see *Stage* below), overlays `p.overlays`, characters `p.actors` at `actor.x/actor.y` (fractions of the stage box) with `zIndex = actor.z`. Delete the old `X(i,j)/Y(i,j)` grid math |
| HUD (date, money, status) | `game.hud()` → `{ date, age, money, job, relationship, location, city }` (`job` is the real title: 회사원 L3, 사장님, 공무원 9급, 크리에이터, 무속인…) |
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

**Big popups.** `popup.big === true` marks a life-changing moment (고백, 상견례, 결혼식, 부고, 병원에서 온 전화, 이별, 배신, 출산, 커밍아웃, 로또 1등, 사채, 해고…). Show it Kairosoft-style: `popup.title` in a banner, `popup.scene` as the picture in the middle (draw it like `game.scene()`, scaled), then the line and choices. This is the same for every `source` — story moments and life events alike.

**Life events.** `popup.source === "event"` is one of ~300 life events (romance, betrayal, family secrets, money, cults, friendship, career, health, fate, daily chaos…; see `docs/life-events.md`). They look like any other popup (big or small). The result of `game.choose(i)` may be several sentences — e.g. after a coming-out, each family member's reaction (`엄마: "말해줘서 고마워…"`, `아빠는 한동안 말이 없었다…`).

`popup.who` is one of `me`, `mom`, `dad`, `boss`, `coworker`, `work`, `partner`, `friend`, `sibling`, `kid`, `ex`, `npc`, `fated`, `stranger`, `recruiter`, `professor`, `mentor`, `barista`, `instructor`, `inlaw`, `judge`, `nurse`, `doctor`, `relative`, `app` (a phone notification), `police`, `lawyer`, `fortune` (점집), `neighbor`, `loanShark`, `cultist`, `bank`, `card`, `insurer`, `tax`, `landlord`, `unknown` (모르는 번호), `reporter`, `scout`, `teacher`, `counselor` or `officer` (병무청). **Always show `popup.name`** (it is always set; never print `who`). Someone you haven't met yet is named `낯선 사람`. For `npc`, `fated` and `partner`, seed the sprite from `popup.npcId` / `popup.seed` and `popup.gender`. `popup.source` is `story` for the life-changing scenes, `opportunity`, `world` or `plan` otherwise.

The result of `game.choose(i)` is `{ who, name, line }`, and `name` is always set.

## Scene

`game.scene()` changes by itself: a story day moves you (wedding hall, court, funeral hall, airport → hotel → branch office on a business trip). After marriage, home uses the newlywed background.

Backgrounds: draw `ROOMS[scene.bgId] ?? ROOMS[scene.sceneKey] ?? ROOMS[scene.roomKey]`. `roomKey` always names an existing painter; when `standIn` is true it is only the closest stand-in, so paint `ROOMS[sceneKey]` for that place (wedding_venue, funeral_hall, hospital, court, airport, airplane, family_home, …).

**Online places** (`online_community`, `instagram`, `dating_app`, `language_exchange_app`): `scene.online === true`. You're at home on your phone — the room is home (`roomKey: "home"`), your household is around (partner in the evening/weekend, kids, pets), and the people you talk to online are *not* in the room. Draw the player (`role: "me"`) holding a phone (a small phone sprite in hand, or a 📱 bubble), optionally with a faint phone-screen glow. The same goes for the big-popup picture of an online event (e.g. 표절 의혹 on a community site).

### Stage: the scene fills the screen

The scene is a **portrait room that fills the whole play area** — everything under the HUD and the log line, down to the bottom edge of the phone. It is not a small picture in the middle, and there is no diary/log box under it any more.

- **Reference box** `scene.stage.ref` = **360 × 642**. Everything in the scene is given as fractions of this box (0..1). Scale it **uniformly to cover** the real play area (`k = max(W/360, H/642)`, centered; the little that overflows is cut). The walkable floor keeps a margin, so nobody is ever cut off.
- **Walls and floor** (Kairosoft layout): the two back walls rise from a "V" — `stage.corner` (the far corner, top middle, y ≈ 0.17) down to `stage.leftBase` / `stage.rightBase` (where the wall bottoms meet the left/right screen edges, y ≈ 0.31) — up to the top edge. The floor fills everything below the V, all the way down. Floor tiles are diamonds `stage.tile.w × stage.tile.h` (72 × 36 in the reference box) with a tile corner at `stage.corner`.
- **Characters**: feet at `(actor.x · 360·k, actor.y · 642·k)` (after the cover offset). Sprite height ≈ `stage.spriteHeight` of the box (≈ 64 px of 642; kids ≈ 0.65×, babies ≈ 0.5×). `zIndex = actor.z` (front people draw over back people). Values outside 0..1 mean they are stepping off the screen edge.
- **Grid (if you need it)**: `x = (180 + (i − j)·36) / 360`, `y = (110 + (i + j)·18) / 642` for grid point `spot = [i, j]` — the engine already did this for you in `actor.x/actor.y`.
- **Small pictures** (the big-popup picture, memory cards): draw the same stage, scaled to **fit the width** of the picture box, then crop vertically around `scene.focus` (`{ top, bottom }` = where the people are, fractions of the box): `offset = clamp(center(focus)·fullHeight − boxHeight/2, 0, fullHeight − boxHeight)`.
- Background art: portrait **360 × 642** (or 180 × 321 drawn ×2), following the same V and floor lines — see `docs/background-assets.md`.

**Walking (Kairosoft style).** Call `game.wander()` every **500 ms** and move each actor from its previous position (`actor.x/actor.y`) to the new one over ~480 ms (linear). Everyone walks tile by tile over the whole floor — across the room, and off the left, right or bottom edge now and then; `walking` → play walk frames, `facing` (`NE`/`NW`/`SE`/`SW`) → flip the sprite, `offscreen` → they walked out (hide); they come back later — **from a different edge**, so on the tick `offscreen` turns false, *jump* the sprite to its new position with no transition (otherwise it glides diagonally across the screen from where it left to where it re-enters). Outdoor places may use a flat backdrop instead of the two walls, but keep its ground line at or above y ≈ 0.25: feet range from y 0.255 (back) to 0.97 (front), x 0.10–0.90. Keep actor elements between frames (keyed by `who`) so the motion animates.

Actor `role` values: `me`, `partner`, `fated`, `npc`, `kid`, `pet` (`npcType` `pet_dog` / `pet_cat`), `inlaw`, `guest`, `relative`, `coworker`, `baby`, `patient`, `friend`. `actor.name` is empty for people you haven't met, so don't draw a name tag.

> Put the actors inside a stacking context (e.g. `#scene { position:relative; z-index:1; isolation:isolate }`). `actor.z` can be larger than the popup's z-index, and without this a character draws *over* the popup and eats its clicks.

## "시간이 흐른다…" memory cards

`endDay().cards` is 0–6 `{ kind, age, caption, scene }` in chronological order. Show one card per ▶ and use the progress bar = `cards.length`. Draw `card.scene` exactly like `game.scene()` (same background and actors) as a *small picture* (fit the width, crop to `card.scene.focus`), with `caption` under it. With no cards, show `r.lines` as before.

`endDay().notes` are life events that happened between days, off-screen (`사채 — 불법 이자는 무효라고 했다. 원금만 갚기로 했다.`). Show them as small lines above the card (they are also at the top of `r.lines`).

Card kind `EVENT` is a life event's own card: its `caption` and `scene` come ready — draw it like the others.

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
- Under the log line: **text notifications** (`{kind:"toast"}`) slide down from behind it, stack (max 3) and fade after ~4 s. `from` is the sender (a leading `[이름]` in a text is already turned into `from`). **Clear them when the day ends** (`endDay()`) **and when a big popup opens** — otherwise a chatty text from yesterday can still be on screen over a funeral.
- The scene (stage) fills everything under the log line to the bottom of the screen; the place label (`📍 장소 · 도시 · 시간`) sits over the scene, top-left. No diary box.
- **Popups are centered** on the play screen.
- **No name tags** on characters.
- `game.actions()`, `doActivity()`, `destinations()`, `goTo()` still exist (optional).

## Setup (from the existing form)

Defaults: name `제이`, birth `1997-09-28` (solar).

```js
LoveSim.createGame({
  name, gender: "F" | "M", likes: "M" | "F" | "A",
  birth: { year, month, day, hour?, minute? },   // SOLAR (convert lunar first), the clock time where they were born
  birthplace: "서울",       // city name (KO or EN: "부산", "LA", "New York") — or { lat, lon, tz? }
  mbti: "ENFP", lang: "ko",
  family: {
    mom: { alive: true | false }, dad: { alive: true | false },
    siblings: [{ rel: "언니" | "오빠" | "누나" | "형" | "남동생" | "여동생", name? }],
    grandparents: 0-4,            // how many are still alive
  },
  fated: {
    name, gender, mbti, birth: { year, month, day, hour? },   // birth + mbti → hidden 궁합
    birthplace: "도쿄",                                // optional; default = the player's birthplace
    status: "crush" | "dating" | "stranger",           // crush (default when named) = someone you like, NOT a couple yet
    from: "same" | "city" | "abroad", job, profile: { look },
  },
})
```

### Birthplace (태어난 곳)

Astrology needs *where* as well as *when*: the Ascendant, MC and houses (natal, Solar/Lunar Return, progressed angles) depend on the place, and every planet depends on the exact instant — so the engine converts the birth clock time with the UTC offset that was in force there and then (Korea's 1987–88 summer time, its UTC+8:30 years, DST abroad), using the time-zone history built into the browser. 사주 reads its pillars in local *standard* time (daylight time taken out, as 만세력 do).

- The picker: `LoveSim.birthplaceOptions("ko")` → `[{ id, name, country }]` (Korean cities first, then ~90 world cities). Use it for an autocomplete/datalist; free text also works.
- Check a typed place: `LoveSim.findPlace("부산광역시")` → `{ id, ko, en, lat, lon, tz }` or `undefined`. If `undefined`, show a small hint ("목록에 없는 곳이에요 — 가장 가까운 도시를 골라주세요") — the engine would use Seoul.
- After start: `game.birthInfo()` → `{ place, clockOffsetMinutes, dstMinutes, known }` (for a profile screen, optional).

## Why bugs like "Mom congratulates a promotion after a layoff" can't come back

- Every message and small event has `requires` (life facts). The Director re-checks them at the moment of showing.
- A keyword guard (`data/game/guard.json`) blocks texts that imply facts the author forgot to declare, such as manager or work lines while unemployed.
- `npm test` lints all content and plays whole lives, failing if anything contradictory ever shows.
- Pacing is enforced per day: 1–3 small events, 0–2 messages, and at most 2 big choices. Lines don't repeat within 4 days, and weekend menus vary.
