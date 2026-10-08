# ASSET AUDIT v2 — new UI sheet + character turnaround sheet

Scope: only the two new PNG sheets you sent, plus your storybook **Investigate** screenshot as the layout reference.
Not evaluated or used: the first (broken) ZIP, and the older curtain/clock mockup and pack already in the repo.

| File | Size | Mode | Alpha |
|---|---|---|---|
| UI sheet | 2000×1248 | RGBA | **Real** (31% transparent, clean edges) |
| Character sheet | 1600×2000 | RGBA | **Real** (63% transparent, clean edges) |

## Verdict
**Big improvement. Style is right and the transparency is real.** The first pack's blocking problems (wiped alpha, green-key damage, cropped neighbors) are gone. What remains is normal production work: **slice the sheets, upscale some pieces, and fix a few design conflicts with the story.**

## 1. UI sheet — what's in it
- **Navy leather side-binder with 6 label slots** (top one is the red "selected" plate): matches the six left tabs of your mockup (Investigate, People, Evidence, Timeline, Notes, Map) exactly.
- **Two dialogue boxes** (portrait frame + red name ribbon + continue arrow): one tall, one short.
- **Wide title/plain panel, search field, red and navy plaque bars, speech/emote bubbles** (blank, blue, `!`, `...`, `?`).
- **8 round buttons:** cream, dark, navy, red, settings, close, search, satchel.
- **Open notebook** with side tabs (notes, photo, chat, bookmark); **tabbed inventory grid**; **3×3 evidence grid** with close button; **parchment map** with compass; **timeline strip** with 5 slots and a progress track.
- **Props:** photo stack, framed photo, scrap of paper, brass key, wax-sealed envelope, 5 dark item slots, thumbnail+text row, checkbox, toggles, slider.

**Good:** consistent brass trim, parchment texture, readable at 1080p. It already covers about 80% of the Investigate screen and a lot of the Case File.

**To do before Step B**
1. **Slice** into individual sprites (I can write a non-destructive slicer that outputs a `_sliced/` folder + a manifest).
2. **9-slice-ability:** the dialogue boxes, panels and plaques have ornate corner flourishes and some inner shading. They'll stretch acceptably if I cut at the flat middle, but very wide boxes will show the repeated texture. Check at the target sizes.
3. **Resolution:** the largest pieces are ~1060 px wide, which is fine for 1080p. Small pieces (icons ~90 px, bubbles ~120 px) will look soft if scaled up; keep them at native size or upscale 2×.
4. **Missing for the Investigate screen:** the **hotspot magnifier ring** (the round search button is close and could be reused), and a **2-option choice popup** (the plain panel can serve, but the mockup's popup has a magnifier/speech icon per row).
5. **Identity Board** is a required tab in your spec but has **no art here** (no corkboard, string, pins). Decide whether to nest it under Evidence or add a 7th binder slot.
6. The notebook, inventory grid and 3×3 grid are all blank templates, so we need to decide which one is "Evidence" and which is "People".

## 2. Character sheet — what's in it
8 characters × **6 views** (left profile, left ¾, front, back, right ¾, right profile). Painted look matches the world.

| Character | Design (from the sheet) | Notes |
|---|---|---|
| **Big Green Bear** | Sage-green bear, mustard knitted scarf | On-model. |
| **Nini** | White lamb, yellow raincoat, brown boots | On-model. |
| **Clockkeeper** | Cat with brass goggles, brown apron, tool pockets | Matches your mockup. |
| **Edward** | **Hedgehog**, round glasses, brown vest, red tie, pocket watch | New design; I've updated the story bible to match. |
| **Green** | Same body and scarf as BGB, plus **torn red marks on the left ear** | See conflict C2. |
| **Café Owner** | Golden spaniel, red apron | New; used as Witness #3. |
| **Night Guard** | Owl, blue guard cap and cape | New; used as Witness #4 (replaces my "Lamplighter"). |
| **Mara** | Old badger, red embroidered shawl, floral apron | New; proposed as the flood-era elder. |

### Technical issues
1. **Size:** each figure is only ~140–170 px wide and ~260–280 px tall. At 1080p that's roughly the size of a character in your mockup, which is fine for exploration, but **portraits and close-ups will be soft.** Recommend re-exporting at 2× (≈550 px tall) later.
2. **Text labels are baked into the sheet** (pink names, Korean names, and a small icon per row) on the left. They need to be cropped out before slicing.
3. **No animation frames.** These are static turnarounds. There's no walk cycle, no run, no interact/inspect/talk poses. The profile and ¾ views can serve as idle/turn frames; **walking will need new frames** (or a sprite-part rig built from the front/side views).
4. **No facial expressions / portraits.** The dialogue boxes want a portrait per emotion (neutral, worried, surprised, thinking, sad...). Only the default face exists for each character.
5. **No young twins** (flashback), and no Healer.
6. **Row spacing is tight**, and tails/feet nearly touch the next row. Slicing needs per-cell masks, not a simple grid. I'll handle that.

### Story-critical conflicts (need your decision; see STORY_BIBLE D13)
- **C1 — Scarves are identical.** BGB and Green have the same scarf, same knot, same tail side. The bible planned a *knot-side* clue (BGB left, Green right). Options: (a) redraw so the tails hang on opposite shoulders, or (b) drop the knot clue.
- **C2 — Green's ear scar is obvious.** It's drawn in daylight on his sheet and reads as red, fresh marks (a bit like a wound). Fine as a visible clue, but it means players will spot Green from the front at a glance, so witnesses who saw "a bear in a scarf" at night, at a distance, are the only ones who could confuse them. I've written the bible to match: the scar proves the flashback child *became* Green, not which name he was born with. **Consider toning the red down to scar-pink/grey** so it doesn't look like fresh blood.
- **C3 — Handedness is not visible in a turnaround.** The sheet shows no hand preference. That clue must come from **animations and held items** (STORY_BIBLE Hard Rule 6). **Do not use `flipX`** on bear sprites if the hand matters; author the facing-left and facing-right sets separately (the sheet already does: it has separate left and right views).
- **C4 — Green has no right glove** drawn. EV-14 (the lost right glove) would need a small prop sprite.

## 3. Still missing for the vertical slice
| Need | Status |
|---|---|
| Bell Village background (far / mid / gameplay / foreground layers) | **Missing**, and the AI image has to be separated into layers |
| Clocktower interior (your mockup) as a layered or single image | **Missing** (the screenshot is a composite UI mockup, not a usable background) |
| Clocktower entrance exterior | **Missing** |
| Hotspot ring + choice popup sprites | Missing (small) |
| Walk/idle animation frames for BGB | **Missing** |
| Portrait expressions (BGB, Nini, Clockkeeper) | **Missing** |
| Audio | None provided |

## 4. Recommended next steps (no new art needed)
1. I write a **non-destructive slicer** that cuts both sheets into individual transparent PNGs with a manifest (`_sliced/`; originals untouched) and flags crops that touch the edge.
2. I create the **Unity 2D URP project** (none exists in this repo) and import the sliced UI.
3. I build the **Investigate screen** from the UI pieces + the Clockkeeper and BGB front/profile stills as placeholder-but-real art in your mockup layout. Anything not yet drawn is marked as a placeholder in code and in `ASSET_REQUIREMENTS.md`.

Nothing in Unity can be tested from this cloud session; each step will end with an exact checklist of what to click in the Editor.
