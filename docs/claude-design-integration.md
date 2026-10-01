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
| `{kind:"enter", locationId, room, name}` | Today's place changed: nothing to redraw — the road shows it as a passing landmark (`game.road().landmark`). Don't write it anywhere |
| `{kind:"popup", popup}` | `openPop({ who: popup.who, line: popup.line, ch: popup.ch })`. Stop advancing until `game.choose(i)`. **Close the destination list if it is open** (a popup interrupts) |
| `{kind:"toast", from, text}` | Show the existing toast as `from: "text"` |
| `{kind:"mood", text}` | Set the top line (the day's mood, no time). Once per day |
| `{kind:"dayEnd"}` | Call `game.endDay()` |

**Big popups.** `popup.big === true` marks a life-changing moment (고백, 상견례, 결혼식, 부고, 병원에서 온 전화, 이별, 배신, 출산, 커밍아웃, 로또 1등, 사채, 해고…). Show it Kairosoft-style: `popup.title` in a banner, `popup.scene` as the picture in the middle (draw it like `game.scene()`, scaled), then the line and choices. This is the same for every `source` — story moments and life events alike.

**Life events.** `popup.source === "event"` is one of ~300 life events (romance, betrayal, family secrets, money, cults, friendship, career, health, fate, daily chaos…; see `docs/life-events.md`). They look like any other popup (big or small). The result of `game.choose(i)` may be several sentences — e.g. after a coming-out, each family member's reaction (`엄마: "말해줘서 고마워…"`, `아빠는 한동안 말이 없었다…`).

`popup.who` is one of `me`, `mom`, `dad`, `boss`, `coworker`, `work`, `partner`, `friend`, `sibling`, `kid`, `ex`, `npc`, `fated`, `stranger`, `recruiter`, `professor`, `mentor`, `barista`, `instructor`, `inlaw`, `judge`, `nurse`, `doctor`, `relative`, `app` (a phone notification), `police`, `lawyer`, `fortune` (점집), `neighbor`, `loanShark`, `cultist`, `bank`, `card`, `insurer`, `tax`, `landlord`, `unknown` (모르는 번호), `reporter`, `scout`, `teacher`, `counselor` or `officer` (병무청). **Always show `popup.name`** (it is always set; never print `who`). Someone you haven't met yet is named `낯선 사람`. For `npc`, `fated` and `partner`, seed the sprite from `popup.npcId` / `popup.seed` and `popup.gender`. `popup.source` is `story` for the life-changing scenes, `opportunity`, `world` or `plan` otherwise.

The result of `game.choose(i)` is `{ who, name, line }`, and `name` is always set.

## Play screen: the life road

The play screen is **one long road seen from behind, 2D pixel art** — not a room. You walk through your whole life on it; the road never cuts. `game.road()` (read it a few times a second):

```js
{
  walkers: [{ who, role: "me" | "partner" | "kid" | "baby" | "pet", name, gender, seed, age, npcType, slot, pace, holds?, carriedBy? }],
  backdrop: { theme: "city" | "town" | "seaside" | "countryside" | "abroad" | "travel", season, timeOfDay, weather, city, country },
  landmark?: { id, type, name },   // today's place, passing at the roadside (a café, the office, the hospital…)
  walking: boolean,                // false while a popup is open → stop scrolling, everyone stands still
}
```

- Draw everyone **from behind** (back of the head, body, legs), side by side at the bottom of the screen in `slot` order (left → right). You are always among them. `holds` → draw joined hands; `carriedBy` → a baby in someone's arms (or a stroller); `pace` → step speed (the old walk slower, pets trot). Kids are smaller.
- Your partner walks beside you once you're together — **not while you live apart** (long distance). Kids walk along until they grow up; pets trot at the edge. After a death, that person is simply no longer on the road.
- The road: a perspective road into the distance (horizon ≈ 1/3 down), a dashed center line and roadside things (trees, buildings, lamp posts) scrolling toward you while `walking`. `theme` picks what lines the road (city blocks, a small town, the sea, fields in old age, a foreign city skyline, a trip); `season` colors the trees (spring blossoms, summer green, autumn orange, winter white); `timeOfDay` colors the sky; `weather` adds rain/snow. These change slowly — never a cut.
- `landmark`: when today's place changes, let a building with a small sign (`landmark.name`) come up the road and pass by. That is how "you went to the office / the hospital / the wedding hall" shows — no scene change.
- Fade to black only at day boundaries (the "시간이 흐른다…" screen).

Popups (big and small) appear over the road exactly as before: title banner, **photo** (`popup.scene`, drawn as below), line and choices. A destined turning point's popup also has **`popup.reading`** — the 사주/점성술 signals behind it in words ("사주: 도화 · 천간합  /  점성술: 목성 5하우스  /  상대: 역마"); show it small under the title.

**Seaside towns** (Busan, Jeju…): `road().backdrop.sea === "right"` — the sea is on the right. Big buildings stand on the left; only small houses line the right, with the sea behind them. `road().landmark` has `size` ("big" | "small") and `side` ("left" | "right"); `backdrop.sides` says what lines each side. `backdrop.trees` = { look: blossom | green | autumn | bare, leaf, snow, ground } — paint every tree (also ones already on screen) from it.

## Scene (the photos)

`game.scene()` / `popup.scene` / `card.scene` are now only the **photos** in popups and memory cards — the room seen from above. Draw them as small pictures (below).

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

## The game spans the bond with the destined person

Play runs from the day you meet the destined person (or from now, if you're already dating / in 썸) to the day the relationship ends. Married to the end, the ending is your own death.

- **Start.** Strangers and acquaintances: the years before the meeting pass off-screen and the first played day *is* the meeting. `game.s.day.prologue` ("그 사람을 만나기까지, 7년이 흘렀다.") is set on that first day only — show it on a dark fade before the road.
- **End.** `endDay()` returns `over: true` the day the bond ends. `game.ending()` → `{ reason, title, story, together: { from, to, years, married }, summary, lines, age, memorial }`. `reason`: `missed` (never came together), `breakup`, `divorce`, `theyDied`, `iDied`. Only `iDied` is a death; the others end alive (the memorial's epitaph then reads "제이 ♥ 정 · 2033 – 2041" and its lines fit the ending).
- Nothing that could end the relationship (a breakup, a divorce, an affair) is decided off-screen; side romances with other NPCs don't happen.

## Left entirely to fate

`fated: { sealed: true }` (or nothing at all about them): the player's chart decides who the destined person is. A chart that marries → "the one you marry and grow old with" (fate leans hard toward the two of you). A solitary chart (혼자 살 사주: weak spouse star, 비겁, day-branch clash, 화개, Saturn in the 7th…, about 1 in 5) → "the last love of your life": it comes late, and the wedding usually slips away. The prologue and the ending are told as the chart's story; `ending().fate = { mode, signs }`.

## Set dressing (scene.decor)

Every scene comes with dense, place-specific props: `scene.decor = [{ prop, on: "floor" | "wallL" | "wallR", x, y, size }]` (59 layouts, 336 prop ids such as `plane_seat`, `overhead_bin`, `chrysanthemums`, `espresso_machine`) and `scene.palette = { floor, wall, accent }`. Floor props stand at (x, y) bottom-center, size × one tile wide; draw them with the actors sorted by y. Wall props are centered on the back walls.

## Big moments in four parts

The confession (썸), the first kiss and the proposal arrive as four popups in a row, the same day, each part with its own poetic title (설렘의 시작 → 두근거리는 밤 → 한 걸음 앞 → 마음을 건네다; 사랑의 서약 for the proposal): their move (their temperament: NF/NT/SJ/SP), your inner moment (your temperament; the options follow your own E/I, F/T, J/P), the moment right before (both planners / both free spirits / one of each), then the climax. Choices that fit the partner's MBTI get warmer reactions and add spark, which tints and bends the climax. Nothing special for the UI: after a result, the next `advance()` opens the next part.

## Memorial (death)

`game.memorial()` → `{ fadeMs: 4000, lineMs: 3500, epitaph: "민아 · 1997 – 2079", lines: [3 strings], cards }`. Fade the screen to black over `fadeMs`, show `epitaph`, then each line `lineMs` apart. Optionally replay `cards` afterward.

## Story (hidden from the player)

The destined person is a crush by default: known by name, never an automatic couple. Hidden 궁합 (사주 day pillars/띠/elements + synastry + MBTI) bends whether a confession, a reunion or a marriage talk works — as part of the chart's 70%.

Astrology uses transits, secondary progressions, the Solar Return (the year's theme) and the Lunar Return (the month's mood, e.g. which weekend plans appeal). When transits and progressions point at the same life area in the same year, that year becomes the fated turning point.


At birth, 사주 + 점성술 pick **5–7 fated turning points** (love, marriage, crisis, career turn at e.g. 43, move, loss, money, child, pet, illness, early retirement). Each one's situation is fixed; the outcome is **70% chart, 30% the player's choice**. When the chart overrides the choice, the result line says so. The day before, a hint line appears. Big things run as multi-day arcs: dating → proposal → 상견례 (파혼 possible) → wedding → new home; divorce → court; illness → treatment → result; retirement at 60 (or 명예퇴직), unless you run your own place. A life takes about 20–25 played days.

## Screen layout (Kairosoft style)

- No activity or 나가기 buttons: the day plays by itself; the player answers popups (and picks weekend plans).
- Top, under the HUD: **one mood line** — `{kind:"mood", text}` once at the start of each day (also `game.mood()`): a feeling that foreshadows, from your chart and what's coming — "(요즘 자꾸 해외로 나가고 싶다.)", "(남편이 요즘 휴대폰을 엎어 둔다.)". **No time, no log of events** (`{kind:"log"}` is never sent any more; `{kind:"enter"}` only means today's place changed → the roadside landmark).
- Under the log line: **text notifications** (`{kind:"toast"}`) slide down from behind it, stack (max 3) and fade after ~4 s. `from` is the sender (a leading `[이름]` in a text is already turned into `from`). **Clear them when the day ends** (`endDay()`) **and when a big popup opens** — otherwise a chatty text from yesterday can still be on screen over a funeral.
- The road fills everything under the mood line to the bottom of the screen; the place label (`📍 장소 · 도시`, no time) sits small in a corner. No diary box, **no buttons at the bottom** (no 나가기 / 집안일 — the day plays by itself), **no name plates** on characters.
- **Popups are centered** on the play screen.
- **No name tags** on characters.
- `game.actions()`, `doActivity()`, `destinations()`, `goTo()` still exist (optional).

## Setup (from the existing form)

**Language first.** The very first screen is a language picker (한국어 / English). Then open the form with `LoveSim.setupDefaults(lang)` → `{ name: "제이" | "Jae", birth: { year: 1997, month: 9, day: 28 }, mbti, birthplace, gender, likes, fated: { status: "stranger", from: "same" } }` and pass `lang` to `createGame`.

**City fields** (birthplace, home, their city, their birthplace): autocomplete with `LoveSim.searchPlaces(text, lang)` → `[{ id, name, country, countryName }]`; a city counts only once the player taps a suggestion (typed text alone, e.g. "여수수", never confirms). Send the id.

**The destined person** — `LoveSim.fatedOptions(lang)` gives the choices (`homeQuestion` / `homeHint`: "그 사람은 지금 어디 살고 있나요?", default = your home city):
- `statusQuestion` ("지금 두 사람, 사귀고 있나요?") + `statuses`: `dating` (start as a couple), `talking` (썸: the game plays the late-night texts, the not-quite-date, the jealousy, up to the confession), `stranger` (you don't know each other yet: the game starts from the first meeting).
- `lives` — "상대는 어디서 살까요?": `same` (same neighborhood: you may keep running into them where they work), `city` (another city: a work trip or a trip there, then weekend love on the train), `abroad` (another country: a language-app match across time zones or a flight, then long distance — video calls at their local time, a visit, and deciding who moves). Optional `fated.city` ("도쿄", "Vancouver") — default: their birthplace if foreign, else a pick.
- `jobs` — "상대의 직업은?" (45 jobs, incl. 무직, 대학생, 취업준비생; free text also works). The job decides where you meet (the barista at your café, the doctor in the ER, the trainer at the gym…), their schedule, their income (it adds to the household once you live together), and job moments while you're together (night shifts, flights, a zero-income month, the 3 a.m. call, a breakthrough).

**Your own job** — `LoveSim.myJobOptions(lang)` → `{ question: "나의 직업은?", jobs }` (the same 45 jobs). Pass the id as `setup.job`. It decides whether you work, study or are between jobs, self-employment (no coworkers), your workplace on the road (a nurse goes to the hospital, a barista to the café, a writer stays home) and the HUD label ("간호사", plain "회사원").

**Names.** NPC names follow the language and the place: Korean names in Korea (foreign names in Hangul when you live or travel abroad: 하루토, 카미유); in English, every name is its English pair (서준 → Noah). A partner's name always matches their sex. Show names exactly as the engine gives them.

The meeting year is the best year for *both* charts, within the first years. Missing the meeting isn't the end: fate brings them around again (at most twice).

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
    status: "dating" | "talking" | "stranger",         // talking = 썸 (default when named); "crush" = talking
    city: "busan",                                     // where they live now: an id picked from searchPlaces (near/far is worked out from your home)
    job: "doctor" | "대학병원 의사" | …,                  // an id from fatedOptions().jobs, or free text
    profile: { look },
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
