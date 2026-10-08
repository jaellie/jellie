# UI Kit Prompts — Big Green Bear's Adventure II

Goal: a UI that looks like a shipped commercial game. Everything must read as ONE object world:
**a vintage detective's archive file laid on a theater stage** (navy cloth, brass hairlines, aged cream paper, burgundy velvet, ink stamps).

## 0. What already exists (DO NOT regenerate)
Frame (`frame_main`, inner, shadows, corner), curtains, clock + mirror parts, folder (navy/manila) + folder edge, 6 labelled tabs + blank tabs,
evidence / document / photo / timeline / identity cards, case label, paperclip, binder clip, pushpin, masking tape, archive stamp,
6 stamps (ARCHIVED, CONFIDENTIAL, REVIEWED, EVIDENCE, UNKNOWN, MISSING RECORD), 5 motifs, 5 paper textures.
Attach 3 of them (e.g. `frame_main`, `ui_folder_tab_case`, `ui_evidence_card`) as **style references** for every generation below.

## 1. Rules for the whole kit
- **No text baked into any image.** All words (Korean + English) render in-engine. Leave label areas empty.
- Every element is a **separate transparent PNG** (or a clean grid sheet that I slice). No backgrounds, no checkerboard, no watermarks.
- Interactive elements come in **states**: `normal`, `hover`, `pressed`, `disabled`, `selected` (same size, same silhouette, only material changes).
- Scalable panels are drawn as **9-slice sources**: flat middle, fixed corners/edges, no ornament that would stretch.
- Export at **2x** (design at 1920×1080, deliver at 3840×2160 scale). Sizes below are the 1x design size in px.
- Light from the upper left, soft low-contrast shadows, same as the existing frame.

---

## A. UI STYLE LOCK (paste first, every time)
```
UI STYLE LOCK. Use the attached images (frame, folder tab, evidence card) as the exact master style and match them precisely.

WORLD
A vintage detective's archive file on a theater stage. Materials only from this list: dark navy fabric with fine vertical pinstripes (#243044, deeper #111923), aged cream paper (#F2E8D4, edges #D8CBAE), brushed brass with hairline engraving (#B08D57, highlight #D9C08A, shadow #6B5330), burgundy velvet (#6E2A35), dark leather, red ink stamp (#A8483F), pencil graphite (#3B3A37), paper-gray (#C8C7BE).

LINEWORK
Brass hairlines 1.5 px at 1920x1080 scale, double hairline borders with a 4 px gap for frames, 2 px for bold edges. Corners are slightly clipped (45 degree cut of 10 px) or softly rounded 6 px, never pill-shaped. No neon, no glow, no glass, no gradients that look digital, no glossy plastic, no flat vector icons without material.

TEXTURE
Every surface has subtle real material grain (paper fibers, cloth weave, brass brushing). Edges of paper are slightly worn. Everything looks physically made and photographed, then cleaned.

LIGHTING
Soft top-left light, low-contrast drop shadow (blur 6 px, offset 3 px down-right, 35 % black, navy tinted). Raised elements have a 1 px light top edge and a darker bottom edge.

OUTPUT
Transparent background, isolated elements, clean alpha edges, no text or letters, no numbers, no watermark. Keep labels areas blank.

NEGATIVE
text, letters, numbers, neon, glow, glassmorphism, flat material-design buttons, rounded pill buttons, bright saturated colors, cartoon outlines, 3D plastic, emoji, gradient mesh, drop shadow too dark, checkerboard, background
```

---

## B. Buttons (the most seen element)
```
[UI STYLE LOCK]
ELEMENT: primary button, 5 states side by side in one row on transparent: normal, hover, pressed, disabled, selected.
Shape: a rectangular brass-framed plaque 360x84 px, clipped corners, a recessed cream-paper label area (blank) inside a brass double hairline frame.
normal: brass frame, cream paper. hover: frame slightly brighter, paper warmer, 2 px lift. pressed: paper darker, plaque pushed in 3 px, shadow shrinks. disabled: desaturated gray-brass, faded paper, no highlight. selected: a thin red-ink underline stamp mark at the bottom and a small brass pin at the left.
```
Deliver as 9-slice: `btn_primary_{state}` (360×84). Same set for:
- `btn_secondary_{state}` — 280×64, paper plaque without brass, thin graphite border.
- `btn_icon_{state}` — 72×72 square brass medallion, blank center.
- `btn_menu_tab_{state}` — 420×72, a paper tab that slides a few px on hover (for CONTINUE / NEW GAME / CASE FILE / SETTINGS). Keep the silhouette identical across states.
- `btn_close_{state}` — 56×56 round brass button, empty center (X is drawn in-engine).
- `btn_arrow_left/right_{state}` — 64×64, for page turning and carousels.

## C. Panels & containers (9-slice)
```
[UI STYLE LOCK]
ELEMENT: four scalable panel frames, each drawn as a 9-slice source at 512x512 px with a flat repeatable center and fixed 48 px edges and corners.
1 panel_paper: aged cream paper sheet with worn edges, blank center.
2 panel_navy: navy pinstripe cloth with a brass double hairline frame.
3 panel_dark: deep #111923 felt, thin brass hairline, used for overlays.
4 panel_note: a small torn notepaper with a pinned corner.
```
Also: `panel_tooltip` (paper, small tail, 9-slice), `panel_toast` ("CASE FILE UPDATED": navy plaque with a brass bar, 640×96), `panel_divider` (brass hairline with a tiny ornament, tileable horizontally, 512×16).

## D. Dialogue UI (appears on screen the longest)
```
[UI STYLE LOCK]
ELEMENT: dialogue box for a mystery game, 1700x300 px 9-slice source. A long cream-paper strip with a navy cloth border and thin brass hairline, soft shadow, blank text area, a small blank name tab protruding from the top-left corner (paper tab with brass edge), and a small page-turn corner curl at the bottom-right (next-line indicator, separate asset).
Keep it semi-transparent friendly: paper area opaque, outer margin empty so the stage stays visible.
```
Pieces: `dlg_box`, `dlg_nameplate` (320×64, 9-slice), `dlg_next_indicator` (48×48, 2 frames: curl closed/open), `dlg_portrait_frame` (round brass-rimmed or square paper-cornered, 360×360, blank), `dlg_choice_{state}` (1200×88 paper strips like numbered investigation questions; states normal/hover/pressed/disabled/selected, a small blank brass number medallion on the left).

## E. Case File chrome (uses the existing folder + tabs)
Generate only what's missing:
- `page_people`, `page_evidence`, `page_statements`, `page_timeline`, `page_identity` — the **paper page backgrounds** inside the folder (1700×960). Each has its own subtle layout hints (hole punches, a faint ruled grid, margin line) but NO text:
```
[UI STYLE LOCK]
ELEMENT: an open case-file page, 1700x960 px, aged cream paper with faint ruled lines and a left margin line, three punched binder holes on the left edge, subtle coffee-ring stain in a corner, a faint blank header strip at the top. No writing, no labels.
```
- `identity_board_bg` — two-column board: left half warm cream corkboard-felt, right half cooler gray-cream, a center brass divider with a hairline ornament. Two blank silhouette slots at the top (blank head-and-shoulders outlines, same size, same shape) for BIG GREEN BEAR / GREEN. 1700×960.
- `identity_slot` — empty drop-zone card outline (dashed pencil border) 360×120, + `identity_slot_filled` variants as paper clips overlay.
- `timeline_track` — horizontal brass-and-paper strip with 7 evenly spaced tick notches, 1600×220, tileable; `timeline_node_{state}` (empty, filled, wrong-order, locked), 56×56 brass pins.
- `conflict_mark` — a hand-drawn red pencil double underline + wavy scribble (no letters), 360×72, 2 variants.
- `compare_table` — two cards facing each other with a brass balance-bar between them (for STATEMENT A + EVIDENCE B → COMPARE), 1500×700, blank.
- `trust_note_set` — 4 handwritten-style pencil scribbles WITHOUT letters: a question-mark loop, an underline, a small cross-out, a circled blank (used as diegetic markers for "maybe?", "not sure"). Transparent, graphite on nothing.
- `deduction_cards` — 4 big paper slots for WHO / HOW / WHEN / WHY, 720×420 each, blank, with a brass corner and a pin, plus `deduction_stamp_open` (a blank red ring stamp) for "THE CASE DOES NOT CLOSE".

## F. Menus
```
[UI STYLE LOCK]
ELEMENT: main menu layout kit. Pieces on transparent: (1) title plate 1400x360 px: an engraved brass-and-navy plaque with blank space for the logo text and a hairline ornament above and below; (2) a hanging brass clock-hand divider 800x40; (3) a wide menu column paper board 520x640, blank; (4) a version/credits footer strip 1920x56, navy cloth.
```
- `menu_bg_overlay` (vignette/curtain gradient 3840×2160, transparent center), `title_logo_frame`, `chapter_card` (3840×2160-safe 1600×900 paper card, blank, with brass corners), `ending_card`.
- Settings: `slider_track` (512×24, 9-slice brass groove) + `slider_fill` + `slider_knob_{state}` (56×56 brass pull), `toggle_{off,on}_{state}` (a brass switch on a paper plate, 120×56), `dropdown_{state}` (460×64) + `dropdown_list` (9-slice), `checkbox_{off,on}` (48×48 stamped box), `scrollbar_track` / `scrollbar_thumb` (20 px wide, 9-slice), `tab_header_{state}` for settings categories, `save_slot_{empty,filled,selected,hover}` (520×160, a mini folder with a blank thumbnail window).

## G. Icons (single-color engraved set, 64×64 and 128×128)
```
[UI STYLE LOCK]
ELEMENT: an icon set drawn as brass-engraved pictograms on small paper discs, each 128x128 px, consistent 6 px stroke weight, same style as a vintage archive index. No text.
Icons: settings gear, sound on, sound off, music, language globe, save, load, back arrow, close, magnifier, hand (interact), eye (observe), key, footprint, speech bubble, question mark, pin, clip, clock, mirror, bell, folder, person silhouette, two-person silhouette, document, camera/photo, lock, unlock, check, warning triangle, trash, star.
```
Each also needed in `disabled` (gray) and `selected` (red-ink ring) versions.

## H. World-interaction & cursors
- `cursor_default`, `cursor_hover` (open eye), `cursor_interact` (hand), `cursor_talk`, `cursor_inspect` (magnifier), `cursor_drag` — 64×64 brass-and-paper, hot spot noted.
- `interact_marker` — a very small restrained indicator (a faint brass ring with a tiny dot) 72×72, 3 frames for a slow pulse. **Not** a big glowing icon.
- `loading_clock_hand` — a single clock-hand spinner 160×160, 8 frames.

## I. Production notes
- Provide each state as its own PNG with identical canvas size and anchor (so Unity swaps sprites without shifting).
- File names: `ui_<group>_<name>_<state>.png`, lowercase.
- Atlas budget: keep UI under 4096×4096 per atlas; paper pages and big panels stay separate.
- Check on 1280×720: 1.5 px hairlines must still read; if not, thicken to 2 px at 1x.

## J. Review checklist (reject if any fails)
- [ ] Same brass (#B08D57), cream (#F2E8D4), navy (#243044) as the existing frame and tabs
- [ ] No text/letters anywhere in the image
- [ ] Transparent background and clean edges
- [ ] All states have the same size and silhouette
- [ ] 9-slice sources have a plain, stretchable center and edges
- [ ] Looks like it belongs next to `frame_main` and the existing evidence card
