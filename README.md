# Big Green Bear's Adventure II — Asset Pack, Batch 1

Engine-agnostic, built for Unity-style SpriteRenderer / Canvas UI.
All overlay assets are RGBA PNG with clean alpha. Editable vector sources live in `_svg_source/`.
`asset_manifest.json` lists every file with its size, pivot (Unity convention, 0–1 from bottom-left), slot rects and notes.

## Folders
- `clock/` face, hour/minute/second hands, large & small gear, pendulum, chain (seamless vertical tile), weight, spring
- `mirror/` oval & rectangular frames, glass (oval + rect), dust, highlight, shadow, reflection overlay
- `frame/` frame_main (3840x2160, transparent stage opening), frame_inner, frame_shadow, frame_corner, curtain_left/right, stage_shadow
- `ui/` folders (navy + manila), tabs (blank + six labelled), folder edge, paperclip, binder clip, pushpin, masking tape, archive stamp, case label, evidence/document/photo/timeline/identity cards
- `stamps/` ARCHIVED, CONFIDENTIAL, REVIEWED, EVIDENCE, UNKNOWN, MISSING RECORD
- `textures/` aged paper, archive paper (tileable), old document, faded photo, dusty glass (overlay)
- `motifs/` double line, double circle, mirror frame, 11:47, split portrait (SVG uses currentColor)

## Key setup notes
- Clock: face + all hands share the canvas center as pivot. Same position & scale for all, then rotate.
  11:47 → hour -353.5°, minute -282° (Unity Z rotation, clockwise = negative). 11:48 → hour -354°, minute -288°.
- Gears: large (48T) and small (18T) share tooth pitch at 1:1 pixel scale, so they mesh. Small spins 48/18 = 2.667x faster, opposite direction.
- Mirror layer order (bottom → top): shadow, glass, [dynamic reflection: flipX, alpha .35–.5, slight blur], reflection_overlay, dust, highlight, frame.
- Curtains: place each at the inner edge of the stage opening (x=380 left / right edge at x=3460).
- Cards: all text renders in-engine; slot rects in the manifest.
