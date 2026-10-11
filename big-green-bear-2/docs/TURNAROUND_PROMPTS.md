# Turnaround Sheet Prompts (Phase 1): Big Green Bear's Adventure II

Phase 1 is one turnaround sheet per character, the same way the bear's sheet was made. Phase 2 (dialogue poses, in the Dialogue poses tab) comes after the sheets are approved and uses them as the reference.

## 1. Order of work
1. Big Green Bear: **done** (`turnaround/bear_turnaround_sheet_v2.jpg`). Use it as the style and layout reference for every sheet below.
2. Nini, Edward, Clockkeeper, Café owner, Tommy: one sheet each, in that order.
3. Green needs no sheet: he is the bear mirrored in-engine.
4. After each sheet: check it (section 5), key it (`python3 tools/chroma_key.py sheet.png out.png --key=<background hex>`), slice the five views, then tick it off.

## 2. TURNAROUND SHEET LOCK (shared, one block for every character)
```
TURNAROUND MODEL SHEET. Use the attached bear turnaround sheet as the exact reference for style, line weight, camera and layout, and match it precisely.
LAYOUT: ONE image, 16:9, 5120 x 2880 px. Five full-body views of the SAME character in a single row, left to right: 1) BACK view, 2) SIDE view facing the LEFT side of the image, 3) SIDE view facing the RIGHT side of the image, 4) THREE-QUARTER view facing the LEFT side of the image (about 35 degrees), 5) THREE-QUARTER view facing the RIGHT side of the image (about 35 degrees).
All five figures stand on the same baseline, have exactly the same height, are evenly spaced and do not overlap or touch. Neutral relaxed standing pose, arms down at the sides, NO mouth drawn, simple dot eyes, orthographic camera with no perspective distortion, same lighting in all views.
The character keeps the exact same colors, proportions, outline weight and clothing details in every view. The sides of the body stay anatomically consistent: when the body turns, every asymmetric detail stays on the same side of the character's OWN body.
BACKGROUND: perfectly flat solid magenta #FF00FF, no gradient, no shadow, no floor, no texture, no vignette. The character contains no magenta or pink-purple tones near its edge.
NO text, NO labels, NO arrows, NO grid lines, NO watermark.
```

## 3. Anatomy rule (read once)
Facing the LEFT side of the image shows the character's own LEFT side; facing the RIGHT shows the own RIGHT side. Details that exist only on one side stay on that side in every view.
- **Big Green Bear:** scarf tail on his own LEFT chest (image-right in a front view). Green is the mirror (everything on his own right).
- Details below for the other characters are **my proposal** so every view agrees. Change any of them before generating.

## 4. Characters
The page builds the full prompt for you: **STYLE LOCK + the character block + the sheet lock + the asymmetric details**. Press **Copy full prompt** on a row.

| ID | Character | Asymmetric details to keep in every view (proposal) |
|---|---|---|
| `turn_bear` | Big Green Bear (done) | scarf tail and knot on his own LEFT chest |
| `turn_nini` | Nini, small sheep | hood hangs behind her neck; a small pencil tucked behind her own RIGHT ear |
| `turn_edward` | Edward, hedgehog archivist | pocket watch chain from the waistcoat pocket on his own LEFT; ink stains on his own RIGHT cuff |
| `turn_clockkeeper` | Clockkeeper, gray cat | small brass gear hanging at the belt on his own LEFT; oilcan in the apron pocket on his own RIGHT |
| `turn_cafe` | Café owner, golden dog | tea towel over his own RIGHT shoulder; small cup embroidery centered on the apron |
| `turn_tommy` | Tommy, otter night guard | lantern hanging from his own RIGHT paw; cream armband on his own LEFT upper arm |

## 5. Check each sheet (reject if any item fails)
- [ ] Five views, in the order back, side L, side R, 3/4 L, 3/4 R
- [ ] All five the same height (within about 2%), same baseline, none overlapping
- [ ] Colors and outline match the character block and the bear sheet (outline #122819, about 0.4% of height)
- [ ] The asymmetric details agree across every view (section 4)
- [ ] No mouth drawn, no text, no labels, flat magenta background
- [ ] Keys cleanly with `chroma_key.py` (no pink fringe)

## 6. Resolution
Ask for the largest size the tool offers. If it is smaller than 5120 px wide, upscale 2x with a free upscaler (for example Upscayl) first, then key it: never upscale after keying (it blurs the edges).
