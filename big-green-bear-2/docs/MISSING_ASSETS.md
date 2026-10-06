# Missing assets (needed for the vertical slice)

Per the production prompt §51: nothing is invented or substituted silently. Placeholders get created ONLY for the items below, marked `PLACEHOLDER`.

| Needed | Used for | Status |
|---|---|---|
| **Edward** (portrait + full sprite + expressions) | Intro dialogue, "don't trust anyone's face", the victim | MISSING. Not in Batch 1. |
| **Big Green Bear / Green / Nini** sprites | Player, twin, witness | Game 1 sprites exist in branch `claude/affectionate-bohr-cr0vb0` (bear_*.png, nini_*.png). Confirm: reuse as-is, or are new ones coming? |
| **Clock Tower Entrance** background (far/mid/fg/floor) | The only vertical-slice location | MISSING (Game 1 backgrounds were declared experimental). |
| **Door**, **Archive case** props | Interactables | MISSING. |
| **Photograph** content (the picture inside `ui_photo_card` / `texture_faded_photo`) | Photograph interactable, family photo | Frame + faded texture exist; the actual picture is MISSING. |
| **Evidence icons** (key, scarf, pocket watch, ...) | Evidence cards | MISSING (cards/slots exist). |
| Audio (BGM, ambient, SFX, 11:47 chime) | Everything | MISSING. Hooks only for now. |
| Fonts | UI | Pretendard exists in Game 1. Cormorant Garamond (OFL) must be added. |
