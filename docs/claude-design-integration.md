# Claude Design integration: one engine, design frame unchanged

`dist/lovesim-engine.js` (global `LoveSim`) is the **whole game brain**: 사주, astrology, MBTI, world, NPCs, opportunities, messages, the Director, save/load, and life until death. The prototype keeps only the **design frame**: screens, pixel art, `ROOMS` painters, `CS` sprites, popups, buttons and fonts. Remove the old engine (`SIM`) completely.

## Method mapping (prototype → LoveSim)

| Prototype today | Replace with |
|---|---|
| `SIM.init`, building `this.g` in `startGame()` | `this.game = LoveSim.createGame(setup)`; the setup is described below |
| `startDay()` / `SIM.dayStart` | Called automatically by `createGame` and `endDay`. Day info: `game.s.day` → `{ age, season, label, weekend }` (use it for the stamp) |
| `locAt(m)`, the `CH` table, `g.q` queue, `fire(ev)`, `planEvent`, `leaveEvent`, `travelEvent`, `SIM.pick`, `SIM.toasts` | **Delete.** In `tick()`, call `const beats = game.advance(game.s.minute + 0.32 * speed)` and handle the beats (see the next table) |
| `choose(i)` → `SIM.choose` | `const r = game.choose(i)` → `u.res = { who: r.who, line: r.line }`. The first click only selects, as now; call `game.choose` on confirm |
| `endDay()` → `SIM.years` | `const r = game.endDay()`. If `r.over`, show the end screen with `game.ending()`; otherwise show the skip screen with `r.fromAge`, `r.toAge`, `r.lines` |
| `toEnd()` → `SIM.ending` | `game.ending()` → `{ title, summary, lines, age }`. It happens only when the player dies, never at a fixed age |
| `presence()`, `posOf`, `room(L)` | `const p = game.scene()`: draw `ROOMS[p.roomKey]()` (or `p.baseColor`), overlays `p.overlays`, characters `p.actors` at `X(i,j)/Y(i,j)` with `zIndex = actor.z` |
| HUD (date, money, status) | `game.hud()` → `{ date, age, money, job, relationship, location, city }` |
| Settings → 인생 / 사람들 / 나 | `game.lifeLog()` / `game.people()` / `game.hud()` |
| `save()` / `cont()` | `localStorage.setItem(KEY, game.save())` / `this.game = LoveSim.loadGame(localStorage.getItem(KEY))` |
| Language toggle | `game.setLang("ko" \| "en")` |

## Beats returned by `game.advance()`

| Beat | What to do |
|---|---|
| `{kind:"enter", locationId, room, name}` | The location changed. Refresh the scene with `game.scene()` and set the log to `name` |
| `{kind:"popup", popup}` | `openPop({ who: popup.who, line: popup.line, ch: popup.ch })`. Stop advancing until `game.choose(i)` |
| `{kind:"toast", from, text}` | Show the existing toast as `from: "text"` |
| `{kind:"log", text}` | Set the bottom log line |
| `{kind:"dayEnd"}` | Call `game.endDay()` |

`popup.who` is one of `me`, `mom`, `dad`, `boss`, `coworker`, `partner`, `friend`, `npc`, `stranger`, `recruiter`, `professor`, `mentor`, `barista` or `instructor`. `popup.name` is the display name. For `npc` and `partner`, seed the sprite from `popup.npcId`.

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
