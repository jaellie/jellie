# ASSET REQUIREMENTS — production assets still missing

Source art is preserved untouched in `art_source/originals/` (checksums in `art_source/MANIFEST.sha256`).
Automatic crops in `art_source/sliced/` are **candidates only** until a human reviews them (`tools/slice_sheet.py`, `_contact_sheet.png`).

## Missing because of story decisions (🔒 you flagged these)
| Asset | Needed | Notes |
|---|---|---|
| **Green's scar** | Faded **pinkish-grey healed** scar on the **left ear**, all views where visible | Current sheet shows red marks. Green must not look more sinister than BGB. |
| **BGB scarf redraw** | Tails/knot on **his left shoulder**, all **6 views, drawn per view** | Current right-facing views look mirror-derived (tails visible on both sides). |
| **Green scarf redraw** | Tails/knot on **his right shoulder**, all **6 views, drawn per view** | Currently drawn identically to BGB's. |
| **Pre-flood photograph** | Two cubs, **no scar**, **birth-name captions**, scarf knots visible (right/left) | Evidence EV-13. |
| **Post-flood home photograph** | Two cubs, scarred cub captioned "Green" | Evidence EV-01. |
| **Edward's pocket watch** (evidence icon) | Running, **cracked crystal**, dented case | Evidence EV-24. |
| **Edward's letter to Green** | Crumpled, addressed "G." | EV-27. |
| **Green's right glove** | Wool glove, snow-damp | EV-14 (hidden behind the photograph's backing, EV-31). |
| **Back of the photograph frame** | Backing board with a hidden glove and folded letter | EV-31; Prologue plant. |
| **Responsibility board** | UI: two columns (Green: fall; BGB: concealment and delay), no cause-of-death field | R15. |

Rule: **no mirrored sprites as final art.** Scarf tails and scar follow the per-view matrix in `STORY_BIBLE.md` §12.1.

## Missing for the vertical slice (from the asset audits)
- Bell Village layers: walkable **path**, **Clocktower entrance door** on the gameplay plane, **clock face with hands (11:47)**, full-bleed **sky gradient**, wider/modular ground pieces.
- **BGB, Nini, Clockkeeper:** idle and walk frames; **portraits with 3–4 expressions.**
- **Snow versions** of tiles/props (the current set is green summer).
- UI: hotspot ring, 2-row choice popup, Identity Board art.
- Audio: none provided.
