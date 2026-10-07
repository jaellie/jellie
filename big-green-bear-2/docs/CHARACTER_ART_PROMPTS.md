# Character Art Prompts v2 — Big Green Bear's Adventure II

All values below were measured from the delivered bear sprites (outline #2E2C20, fur ≈ RGB 95,130,88, scarf ≈ RGB 197,167,102,
outline ≈ 0.3 % of image height). Attach the delivered **bear images as style references** to every generation.

## How to use
1. Paste **A. STYLE LOCK** first, every time.
2. Paste the character block (**B–D**), then ONE pose line from that character's list.
3. For each character generate the **`_nomouth` neutral base first**, approve it, then attach it (plus a bear image) as reference for every other pose.
4. After each image run the **checklist (G)**.

---

## A. STYLE LOCK (all characters, all images)
```
STYLE LOCK. Use the attached Big Green Bear images as the exact master style and match them precisely.

LOOK
Soft plush storybook character illustration, like a hand-painted stuffed toy: simple chunky rounded shapes, matte velvety fur with a very fine fuzzy texture, soft airbrushed shading (light from the upper left, low contrast), muted slightly desaturated colors with gentle vintage warmth. No gloss, no specular shine, no glitter, no 3D render look, no anime, no flat vector, no photorealism.

OUTLINE (identical on every character in every image)
One continuous dark olive-brown outline, color #2E2C20, a clean hand-inked line of UNIFORM weight, about 0.3% of the image height (about 9 px on a 2900 px tall image, about 7 px on a 2300 px tall image), rounded line ends, a very slight organic wobble, no tapering, no thick-and-thin variation, no double lines. The outline goes around the whole silhouette and around the main inner shapes (arms, ears, coat, scarf, boots, glasses). Fine details (fur, knit pattern, wool curls) have NO outline, only soft shading.

FACE
Eyes: small solid near-black dots (#1B1A16); a tiny white highlight only for sad/tearful or surprised expressions. Nose: dark flat rounded shape (#2B2A24) with a very soft highlight. Mouth: a thin line in the same #2E2C20 and the same weight as the outline, drawn ONLY when the pose list asks for one. No eyelashes. No eyebrows unless requested. No teeth except open-mouth laughs.
Cheek blush: very soft, low opacity pink-brown (#B58A7C at 35%), only when the expression list asks for it.

CANVAS
Transparent background (true alpha, clean edges, no white fringe). One character per image. Full body, standing, front view, feet touching the bottom edge, tight crop with about 1.5% margin. No ground, no shadow, no props unless requested, no text, no watermark, no frame.

SCALE
Keep the same body size in every pose of the same character. Only the pose and the face change. Heights: Big Green Bear 2900 px, Nini 1600 px, Edward 2320 px.

LEFT / RIGHT
Left and right always mean the side you see in the image, never the character's own anatomy.

NEGATIVE
glossy highlights, plastic, 3D render, thick or tapering outline, double outline, colored outline, missing outline, gradient background, checkerboard, drop shadow, cast shadow, text, extra limbs, extra characters, cream belly patch, anime eyes, sparkles, blur
```

---

## B. Big Green Bear
```
CHARACTER: Big Green Bear.
A big round plush bear: pear-shaped body, large round head, small round ears with a darker green inner recess. Sage-green fur (#5F8258) with soft fuzzy texture, a slightly lighter muzzle area (#7A9C6E), no cream belly. A thick hand-knitted mustard scarf (#C5A766) with a herringbone braid knit, wrapped around the neck; its tail hangs down the front on the RIGHT side of the image and ends in a ribbed cuff. Paws are simple rounded mitten shapes with one short curved line for the thumb. Small solid dot eyes, dark rounded-triangle nose. Height 2900 px.
```
Delivered: neutral_nomouth, smile_openeyes, smile_closedeyes, sad_cry, cry_armsdown, grief_handsclasp, worried_handsclasp, surprised_blush, angry, think_handmouth, wave_right, hold_bell (green).
Still needed (one pose line per generation; "RIGHT" = right side of the image, always Big Green Bear's active hand):
- `bear_stand_guilty`: eyes looking down and to the side, lips pressed in a small flat line, shoulders slightly slumped, hands low in front. Must read as "keeping a secret", never evil.
- `bear_stand_resolute`: calm serious face, eyes forward, small straight mouth, chest slightly lifted.
- `bear_reach_right`: the arm on the RIGHT side of the image reaching forward and slightly up to pick something up, other arm relaxed.
- `bear_scarf_adjust_right`: the paw on the RIGHT side of the image touching the scarf near the neck, small content smile.
- `bear_door_right`: the arm on the RIGHT side of the image extended forward at chest height as if opening a door, body turned very slightly toward it.
- `bear_walk_A`, `bear_walk_B`: two mid-step walking frames, relaxed neutral face, arms swinging slightly.

---

## C. Nini
```
CHARACTER: Nini.
A small sheep girl, 55% of the bear's height (1600 px tall). A round head covered by a thick cap of cream-white curly wool (#EFE6CF) drawn as soft curl shapes without outlines, a smooth pale cream face (#F3E8D6), small solid dot eyes, a tiny pink triangular nose, two floppy ears with pink insides (#E8B4B0). She wears a mustard-yellow hooded raincoat (#D9A93F) with the hood resting on her shoulders, two dark brown round buttons, a short A-line cut, small white mitten hands, wool-covered legs and short brown boots (#8B6B4A). Standing, arms relaxed at her sides.
```
Delivered: stand_neutral (small mouth), stand_happy_open. (Re-generate with the outline above, or keep with the outline added by `tools/add_outline.py`.)
- `nini_stand_nomouth`: neutral base, NO mouth, soft blush.
- `nini_stand_curious`: head tilted slightly, small round "o" mouth, eyes a bit larger.
- `nini_stand_worried`: tiny frown, inner eyebrow lines raised.
- `nini_stand_certain`: small firm closed mouth, steady eyes ("There were two Bears").
- `nini_stand_scared`: mouth slightly open, shoulders raised, hands pulled in.
- `nini_notebook_write`: holds a small notebook in one hand and writes with a pencil in the other, looking down, tiny smile.
- `nini_notebook_hold`: notebook held against her chest with both hands, looking up.
- `nini_point`: the arm on the RIGHT side of the image pointing to the side, mouth slightly open.
- `nini_look_up`: head tilted back looking up, mouth slightly open.

---

## D. Edward (hedgehog, the victim)
```
CHARACTER: Edward.
An elderly hedgehog archivist, 80% of the bear's height (2320 px tall), round pear-shaped body, slightly stooped but dignified posture. Back and head covered with soft felted-looking quills in muted gray-brown (#7A6A58) with cream tips, never sharp or menacing; face and belly soft cream-gray (#D9CFBE); small solid dot eyes with tired kind eyelids; a dark rounded nose; tiny round ears. Round thin wire-rimmed glasses (brass #B08D57). A dark navy waistcoat (#243044) with small brass buttons over a cream shirt (#F2E8D4) with ink-stained cuffs, a thin brass chain with a pocket watch in the waistcoat pocket, short dark trousers, simple dark brown shoes (#4A3A2E).
```
- `edward_stand_nomouth`: neutral base, NO mouth, hands clasped in front.
- `edward_stand_calm`: mild knowing half-smile.
- `edward_stand_grave`: serious, lowered brows, firm mouth (the line "Tonight, don't trust anyone's face").
- `edward_adjust_glasses`: one hand pushing the glasses up the nose.
- `edward_check_watch`: opening the pocket watch with one hand, looking down at it.
- `edward_hold_documents`: holding a bundle of old tied papers against his chest.
- `edward_worried`: eyes glancing aside, tense small mouth.
- `edward_fallen`: NOT graphic. Lying on his side, eyes closed, glasses resting beside him, calm and quiet, gentle tragic mood (full body, same outline, side view allowed).

---

## E. Green (twin) — no new prompts
Green is the Big Green Bear set mirrored in-engine; his scar and left-hand habits are applied in code.
- Scarf tail on the LEFT side of the image, gestures with the hand on the LEFT side of the image.
- Never scarier, thinner, darker or angrier than the bear.
Overlay needed: `overlay_ear_scar` (below).

## F. Overlays and props (transparent PNG, same line weight and color)
```
OVERLAY: [STYLE LOCK outline and face rules]. Isolated elements on a transparent background, evenly spaced on a grid, each at the exact scale it would have on the 2900 px tall bear.
```
- `overlay_mouths_sheet`: smile, wide smile, flat, small "o", wide open (talking), frown, trembling.
- `overlay_eyes_sheet`: open dot eyes, closed-happy arcs, blink line, worried inner brows, wide eyes with highlight.
- `overlay_ear_scar`: one tiny healed scar nick (a short curved line with a slightly lighter patch) for the ear on the LEFT side of the image. It belongs to **Green**.
- `prop_green_bell`: a small jade-green bell (#7DB28E, darker #3F7054) with a loop, soft shading, the same outline.
- Evidence props (later): key, pocket watch, old photograph (one child / two children), family record book.

## G. Checklist (reject the image if any item fails)
- [ ] Outline is #2E2C20, uniform ~0.3 % height, closed, no double line
- [ ] Fur/scarf colors match the bear (fur ≈ #5F8258, scarf ≈ #C5A766) / the character's own palette
- [ ] Transparent background, no white fringe, no shadow
- [ ] Same body size as the character's other poses
- [ ] Bear: scarf tail on the RIGHT side of the image; active hand on the RIGHT side of the image
- [ ] Mouth only if the pose asks for it; blush only if the expression asks for it
- [ ] No gloss, no cream belly, no extra elements

## H. Supporting cast (fill in, then I write the prompts)
| Name | Species | Look / prop | Height vs bear |
|---|---|---|---|
| Clockkeeper | ? | e.g. goggles on forehead, oilcan, leather apron | ? |
| Café owner | ? | e.g. apron, teacup | ? |
| Night guard | ? | e.g. cap, lantern | ? |
Each needs: `_nomouth` base + speaking, uncertain, certain.
