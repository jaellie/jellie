# Scarf-side audit: Green and BGB turnaround candidates (v2)

Rule (STORY_BIBLE D13, locked): **BGB: knot and tails on HIS LEFT shoulder. Green: on HIS RIGHT shoulder.**
"Left/right" is the character's own side. In a FRONT view his left is the VIEWER'S RIGHT. When he faces the viewer's left we see his LEFT side; facing the viewer's right we see his RIGHT side.

Files: `art_source/originals/turnaround_green_v2_candidate.png` (sheet 1, scarred left ear), `turnaround_bgb_v2_candidate.png` (sheet 2), `photo_twins_scar_v1.png`.

| View | Green (right shoulder) expected | Green sheet | BGB (left shoulder) expected | BGB sheet |
|---|---|---|---|---|
| 1 faces viewer-left (we see his LEFT side) | tails hidden, band only | OK | tails big and visible | OK |
| 2 3/4 facing viewer-right (we see his RIGHT side) | tails visible | OK | tails hidden / tips only | **WRONG** (big tails visible) |
| 3 FRONT | tails on VIEWER'S LEFT | **WRONG** (viewer's right) | tails on VIEWER'S RIGHT | **WRONG** (viewer's left) |
| 4 BACK | tails on VIEWER'S RIGHT | OK | tails on VIEWER'S LEFT, clearly visible | weak (tiny tip only) |
| 5 3/4 facing viewer-right | tails visible | **WRONG** (no tail at all) | tails hidden | OK |
| 6 profile facing viewer-right (we see his RIGHT side) | tails visible | OK | hidden / tips | OK |

Verdict: the two FRONT views (the most used in game) are swapped. Sheet 2 view 2 and Sheet 1 view 5 are also wrong. The photograph shows both bears with the sides swapped too (scarred bear's tails on his left, the other's on his right).
Other drift between views: the number of wraps, the knot height and the tail length change from view to view (see the "scarf spec" in the prompt library).

## Green sheet v3 candidate (`turnaround_green_v3_candidate.png`)
Right-shoulder rule for Green. Front (view 3) is now CORRECT (tails on viewer's left), views 2 and 6 correct, view 1 correct (hidden).
Still wrong: view 4 BACK (tails on the viewer's LEFT; must be the viewer's RIGHT) and view 5 (no tails visible; his right side is toward us, so they must show).
File problem: the "transparent" background is a checkerboard drawn into an RGB image (no alpha channel, 0% transparent pixels). It cannot be used as a sprite sheet until it is a real transparent PNG.
The prompt library now lists the scarf side view by view for both twins (fixed view directions, SCARF construction block, a mandatory front/back check, and a "no drawn checkerboard" rule).
