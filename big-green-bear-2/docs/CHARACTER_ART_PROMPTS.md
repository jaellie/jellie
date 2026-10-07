# Character Art Prompts — Big Green Bear's Adventure II

Use the 4 delivered Big Green Bear images (`Assets/Art/Characters/BigGreenBear/`) as the **style reference** for every prompt below.
Paste **[MASTER STYLE BLOCK]** at the start of every generation, then the character block, then the pose/expression list.

---

## [MASTER STYLE BLOCK]  (paste first, every time)

```
Use the attached Big Green Bear images as the exact style reference. Match them precisely.

STYLE
Soft plush-toy character illustration for a 2D mystery game. Chunky, rounded, simple silhouette.
Matte velvety fur texture with very subtle fuzzy edge shading and soft airbrushed volume (no gloss, no plastic look).
A thin, dark olive-brown outline of constant weight, slightly hand-drawn, never thick.
Muted, slightly desaturated colors with a gentle vintage warmth. Soft lighting from the upper left, very low contrast.
Small black bead eyes with a tiny highlight only when the expression needs life; nose is a dark flat rounded shape.
Cute and cozy at first glance, but with a quiet, slightly melancholy feel. NOT glossy 3D, NOT anime, NOT vector-flat, NOT realistic.

CANVAS
Transparent background (true alpha). Single character. Full body, standing, facing the viewer (front view), symmetrical stance,
feet touching the bottom edge of the canvas, tight crop with ~2% margin. No ground shadow, no cast shadow, no props unless requested.
No text, no watermark, no border, no background color.

CONSISTENCY
Same outline color and thickness, same fur texture, same lighting direction and same color saturation in every image of the set.
The character must be identical in every image: same proportions, same face shape, same clothes. Only the pose/expression changes.
```

**Do NOT** (add to the negative prompt): cream belly patch, rosy blush stickers, thick black outlines, glossy highlights, 3D render, anime eyes, cel-shaded flat color, drop shadow, background.

---

## 0.5 Left / right convention (IMPORTANT — read before generating)
- **LEFT / RIGHT always means the side you SEE on the screen** (the viewer's left/right), never the character's own anatomy.
  A player must be able to look at the picture and say "he uses the hand on the right".
- "Big Green Bear uses his RIGHT hand" = the hand on the **RIGHT side of the image**. Green (the mirrored twin) uses the hand on the **LEFT side of the image**.
- "Scar on the LEFT ear" = the ear on the **LEFT side of the image**.
- Every character that appears in evidence art (photographs, documents) must be drawn **facing the viewer**, so left/right is unambiguous.
- Write the image side in every prompt: "waving with the arm on the RIGHT side of the image".
- The delivered `think_handmouth` raises the arm on the right side of the image = Big Green Bear's hand. No flip needed for Bear; flip it for Green.

## 0. Delivery spec (applies to every image)

| Item | Requirement |
|---|---|
| Format | PNG, RGBA, true transparency |
| Height | Bear **2360 px**. Others at their relative scale (Nini ≈ **1300 px**, Edward ≈ **1900 px**), so they can be dropped into the game without rescaling |
| Crop | Tight, feet on the bottom edge |
| Naming | `<character>_<pose>_<expression>.png`, e.g. `nini_stand_worried.png` |
| Mouth rule | Every character has a **`_nomouth` neutral base** (eyes visible, no mouth). Extra expressions are baked full images; small mouth/eye variants may be added as overlays |
| Metadata | Any is fine; I repair broken EXIF chunks on import |

---

## 1. Big Green Bear — STILL NEEDED
Already delivered: `neutral_nomouth`, `smile_openeyes`, `smile_closedeyes`, `sad_cry`, `cry_armsdown`, `grief_handsclasp`, `worried_handsclasp`, `surprised_blush`, `angry`, `think_handmouth`, `wave_right`, `hold_bell` (green).
Prompt prefix: `Big Green Bear: round green plush bear, knitted mustard scarf with the tail hanging on the RIGHT side of the image, small black bead eyes, dark nose, slightly lighter muzzle area, round ears with a darker inner recess. Same exact character as the reference.`

Needed (same size/style as the delivered set):

| File | Pose / expression | Why |
|---|---|---|
| `bear_stand_guilty` | Eyes looking down and aside, lips pressed, slight shoulder slump | The lie he is hiding (must read as "keeping a secret", not evil) |
| `bear_stand_resolute` | Calm serious face, eyes forward | Final deduction |
| `bear_reach_right` | Reaching forward with the arm on the **RIGHT side of the image** to pick something up | Bear's hand signature |
| `bear_scarf_adjust_right` | The hand on the **RIGHT side of the image** adjusting the scarf near the neck | Bear's hand signature |
| `bear_door_right` | The arm on the **RIGHT side of the image** extended forward as if opening a door | Bear's hand signature |
| `bear_walk_A`, `bear_walk_B` | Two mid-step walking frames, neutral face | Optional |

> Hand rule: Big Green Bear's hand is always the one on the RIGHT side of the image; Green (mirrored in-engine) uses the LEFT side. The delivered `think_handmouth` already matches Bear.
> **Green needs no new art.** Green is the same image mirrored in-engine (scarf tail flips, left hand leads). His differences are behavior only.

---

## 2. Green (twin)
No separate prompts. Rules for any prompt that shows both:
- Same body, same colors, same scarf, same expression range. **Not** scarier, thinner, darker or angrier.
- Green's tells are: mirrored image (scarf tail on the LEFT side of the image), gestures with the hand on the LEFT side of the image, eyes slightly **open** when smiling, a more upright stance.

---

## 3. Nini
```
[MASTER STYLE BLOCK]
Nini: a small sheep girl, about 55% of the bear's height. Round soft cream-white wool face and fluffy wool tufts, small pink-lined floppy ears,
tiny black bead eyes, small dark nose, pink cheek tint (light, painted in, not a sticker).
She wears a bright mustard-yellow raincoat (#E8BC4A) with a hood pushed back around her head, two dark round buttons, small white mittens, and brown boots (#9C5442).
A small notebook with a pencil is her signature prop.
```
Needed (`nini_<pose>_<expression>`):

| File | Pose / expression |
|---|---|
| `nini_stand_nomouth` | Neutral base, no mouth, hands at sides |
| `nini_stand_happy` | Bright smile, eyes open |
| `nini_stand_curious` | Head slightly tilted, eyes wide, small "o" mouth |
| `nini_stand_worried` | Raised inner eyebrows, small frown |
| `nini_stand_certain` | Eyes steady, small firm mouth (she says "there were two Bears") |
| `nini_stand_scared` | Wide eyes, mouth slightly open, shoulders up |
| `nini_notebook_write` | Holding the notebook in one hand, writing with the pencil, looking down |
| `nini_notebook_hold` | Notebook held against her chest, looking up |
| `nini_point` | Pointing to the side with one arm |
| `nini_look_up` | Looking up at something big (the clock), mouth open a little |

---

## 4. Edward  (the victim) — HEDGEHOG
```
[MASTER STYLE BLOCK]
Edward: an elderly hedgehog archivist, about 80% of the bear's height, round body, slightly stooped but dignified.
Soft felted-looking quills on his back and head in muted gray-brown with cream tips (matte, not sharp, never menacing),
a soft cream-gray face and belly area, small black bead eyes, a dark flat nose, tiny round ears.
Round wire-rimmed glasses, a dark navy waistcoat over a cream shirt, a thin brass chain with a pocket watch, ink-stained cuffs.
Tired, kind eyes. Muted cold palette (navy, brass, cream) so he reads as part of the clock tower.
Same plush-toy style, outline and lighting as the Big Green Bear reference.
```
Delivered height: **1900 px** (80% of the bear's 2360).

| File | Pose / expression |
|---|---|
| `edward_stand_nomouth` | Neutral base, hands clasped in front |
| `edward_stand_calm` | Mild, knowing half-smile |
| `edward_stand_grave` | Serious, brows lowered (the "don't trust anyone's face" line) |
| `edward_adjust_glasses` | One hand pushing glasses up the nose |
| `edward_check_watch` | Opening the pocket watch, looking down at it |
| `edward_hold_documents` | Holding a bundle of old papers against his chest |
| `edward_worried` | Eyes darting aside, tense mouth |
| `edward_fallen` | **Not graphic.** Lying on his side, eyes closed, glasses beside him, calm and quiet (a tragic but gentle image for the discovery scene) |

---

## 5. Supporting cast — fill in, then generate
Each witness needs a **`_nomouth` neutral + 4 expressions** (neutral, speaking, uncertain, certain). Provide one line per character before I generate:

| Name | Species | Visual hook (clothes/prop) | Role |
|---|---|---|---|
| Clockkeeper | TBD | e.g. oilcan, apron, goggles on forehead | Witness |
| Café owner | TBD | e.g. apron, teacup | Witness |
| Night guard | TBD | e.g. lantern, cap | Statement ("same bear, I'd say") |
| (others) | TBD | | |

Prompt template: `[MASTER STYLE BLOCK] <name>: a <species>, <height % of bear>, <outfit>, <prop>, <personality read in one line>.`

---

## 6. Overlays (small, transparent, same scale as the base)
| File | Content |
|---|---|
| `overlay_mouths_sheet` | Same line weight/color as the characters: smile, wide smile, flat, small "o", wide open (talking), frown, trembling. On transparent, evenly spaced grid |
| `overlay_eyes_sheet` | Open dot eyes, closed-happy arcs (the Bear smile), blink line, raised worried brows, wide eyes |
| `overlay_ear_scar` | A tiny healed **scar nick** on the ear on the **LEFT side of the image**, subtle, same fur texture. **Decided: the scar belongs to GREEN** (left ear, screen side) |

---

## 6.5 Consistency notes from the delivered bear set
- Keep **one scale**: the delivered images range from 2158 to 2431 px (normalized) for the same bear. Ask for the same body size in every pose (see `Assets/Data/Characters/bear_scale_normalization.json`).
- Do **not** mix looks: blush stickers, thick outlines and glossy knit scarves appear in a few drafts (`_review/`). Stay with the matte-fur, thin-outline look of `neutral_nomouth`.
- A pose must not contradict the twin rule: scarf tail on the RIGHT side of the image **and** the active hand on the RIGHT side for Big Green Bear.

## 7. Order of work (vertical slice first)
1. Edward: `nomouth`, `grave`, `adjust_glasses`, `check_watch`, `fallen`
2. Nini: `nomouth`, `happy`, `worried`, `certain`
3. Bear: `smile_closedeyes`, `worried`, `surprised`, `hold_bell_right`
4. Overlays (mouths / eyes)
5. Everything else
