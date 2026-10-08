# ASSET AUDIT — `BGB2_Individual_Assets.zip` (preliminary pack)

Scope: only the ZIP you just gave me and your storybook **Investigate** screenshot (art reference).
The older curtain/clock mockup and the pack already in this repo (`clock/`, `mirror/`, `frame/`, `ui/`, …) were **not** evaluated or used, per your instruction.

## Verdict
**The art style is right. The files are not production-usable yet.**
The pack was extracted from a single **1536×1024** AI sheet (not 4K), so everything is ~50–250 px.

## 1. What is wrong (measured)

| Issue | Evidence | Impact |
|---|---|---|
| **Alpha channel was wiped** | 78 of 105 PNGs are <10% opaque (e.g. all Nini poses except `nini_front`, all Props, Trees, Plants, Terrain_Modules, every UI panel except the icon row). The painted art still exists in the **RGB** channels on a **green key background.** | They render as invisible/speckled in Unity. |
| **Green-key damage** | The background was keyed out by color. Anything green (**Big Green Bear himself**, bushes, grass) is exactly what a green key destroys. | Do **not** generate or extract the bear with this method. Use a magenta/neutral background or true transparency. |
| **Crops contain neighbors** | Props/UI show pieces of adjacent assets (a barrel edge in a crate, fragments of banners). UI panels (tabs, dialog panel) are cut off. | Needs re-cropping. |
| **Too small** | Characters ~110×215, UI panels ~150×40, props ~100×100. At 1920×1080 these upscale ~4–8×. | Soft/blurry; won't match the mockup's crispness. |
| **Textures/tiles are opaque tiles, none seamless** | The pack's own manifest: 17 fail the edge test; 8 "low error" but unverified; **none certified.** | Visible seams if tiled. |
| **Poses are not animation sprites** | Nini has front/back/sides and mood poses, but no walk cycle, no consistent pivot/scale. | Usable as portraits/idle stills only. |
| **Missing characters** | **No Big Green Bear, Green, Edward, Clockkeeper, young bears.** | The vertical slice cannot show its protagonist. |
| **No backgrounds/parallax layers** | No Bell Village, Clocktower interior, or Café backgrounds. Nothing is split into far/mid/foreground. | Parallax can only use placeholders. |

## 2. What is good (keep)
- **Nini** (`nini_front`) is clean, on-model (white lamb, yellow raincoat, brown boots), good outline weight.
- **Icon row** (satchel, notebook, gear, search, speech, map): readable, correct cream-on-dark style, matches your screenshot's top-right/left buttons.
- Warm hand-painted look, consistent ink outline, storybook palette. Props (bench, fence-lantern, books, cart, planter) are charming.
- Nini's reading/writing/sleeping poses support the "archive assistant" idea.

## 3. Mismatches between your mockup and the specs
1. **Identity Board** is a required tab in the master spec but **missing from the mockup** (Investigate, People, Evidence, Timeline, Notes, Map). Decide: add a 7th tab, or nest it under Evidence/People.
2. The mockup's palette is warm **parchment + red ribbon + brass**; the master spec's navy/pinstripe Case File is a *different* look. Decide which wins (I'd keep the mockup for Investigate view and use navy/burgundy only for the full Case File overlay).
3. Mockup UI is **Korean-first**; the spec says English-first with Korean. Localized text needs both widths (Korean is wider).
4. The mockup shows a **floor hatch** in front of the stairs; my story uses it as the fall site (STORY_BIBLE §5, Ch.1). Keep it in the art.

## 4. What must be fixed before Step B (Investigate screen)

**Minimum to build the Investigate screen:**
| Need | Status | Action |
|---|---|---|
| Dialogue box (parchment, name ribbon, portrait frame) | Cropped / alpha wiped | Re-extract **or** repaint at ≥3× with true alpha; ideally as 9-slice. |
| Left tab buttons (6–7 states: normal/hover/selected) | Cropped | Repaint as a 9-slice set. |
| Round icon buttons | OK (icon row) | Slice into 6 sprites. |
| Choice popup (2 options) | Not in pack | Paint. |
| Hotspot magnifier ring | Not in pack | Paint (simple). |
| Clocktower interior background | Missing | Needed from you (layered or one image for now). |
| BGB, Clockkeeper sprites | Missing | Needed. |

**Process recommendations**
1. Re-extract assets **from the RGB** (it still contains the art) using a *non-green* background or manual masks; do not re-key.
2. Upscale source art to **≥3×** with an upscaler, then hand-clean, **or** repaint key pieces in Procreate at 2×–4× final size.
3. Export each asset with **true alpha**, tight crop, consistent pivot (feet-center for characters).
4. Make UI panels **9-slice friendly** (flat edges, no baked drop shadows).
5. Verify tiles by **tiling 3×3** before delivery.
6. For handedness/readable clues (STORY_BIBLE Hard Rule 6) **author separate poses** for each facing; do not rely on `flipX`.

## 5. What I can do next without new art
- Build the Investigate screen layout in Unity using **placeholders** (clearly marked) and the **6 icons + Nini**, with every sprite slot named so your final art drops in.
- Write an editor tool that **recovers the RGB art** from the wiped-alpha PNGs into a `_recovered/` folder (non-destructive), so we can see exactly how much is salvageable.

(No Unity project exists in this repo yet; Step B will start by creating one.)
