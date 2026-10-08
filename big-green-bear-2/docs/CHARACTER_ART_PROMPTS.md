> **MASTER STYLE (decided): clean soft-shaded flat look, as in `Assets/Art/Characters/BigGreenBear/turnaround/` (v2 sheet). Older fuzzy hand-painted poses are superseded; regenerate them with the new sheet as the style reference.**

# Character Art Prompts v2 — Big Green Bear's Adventure II

All values below were measured from the delivered bear sprites (outline #122819 (dark green-black), fur ≈ RGB 95,130,88, scarf ≈ RGB 197,167,102,
outline ≈ 0.4 % of image height). Attach the delivered **bear images as style references** to every generation.

## How to use
1. Paste **A. STYLE LOCK** first, every time.
2. Paste the character block (**B–D**), then ONE pose line from that character's list.
3. For each character generate the **`_nomouth` neutral base first**, approve it, then attach it (plus a bear image) as reference for every other pose.
4. **View rule:** every in-game pose is generated as `three_quarter_left` (the bear stands on the right and faces left toward the other character; Green is this sprite mirrored in-engine). Only `bear_front_neutral` (portrait / mirror scene) is a true front view. Attach `turnaround/bear_turn_three_quarter_left.png` as the view reference.
5. **Facing rule for everyone:** the bear stands on the right and faces left (`three_quarter_left`). Every other character (Nini, Edward, Clockkeeper (cat), Café owner (dog), Night guard (owl)) stands on the LEFT of the screen and faces right: generate them as `three_quarter_right`, about 35 degrees, same camera as the bear sheet. Each also gets ONE true front view `<name>_front_neutral` for portraits and the mirror/board scenes. Attach `turnaround/bear_turn_three_quarter_right.png` as the camera/pose reference.
6. After each image run the **checklist (G)**.

---

## A. STYLE LOCK (all characters, all images)
```
STYLE LOCK. Use the attached Big Green Bear images as the exact master style and match them precisely.

LOOK
Soft plush storybook character illustration, like a hand-painted stuffed toy: simple chunky rounded shapes, matte velvety fur with a very fine fuzzy texture, soft airbrushed shading (light from the upper left, low contrast), muted slightly desaturated colors with gentle vintage warmth. No gloss, no specular shine, no glitter, no 3D render look, no anime, no flat vector, no photorealism.
This is HAND-PAINTED, NOT cel-shaded: soft brush-blended shading and fine fur texture, never flat color blocks with hard-edged shadow shapes.

OUTLINE (identical on every character in every image)
One continuous dark olive-brown outline, color #122819 (dark green-black), a clean line of UNIFORM weight, about 0.4% of the image height (about 12 px on a 2900 px tall image, about 9 px on a 2300 px tall image), rounded line ends, a very slight organic wobble, no tapering, no thick-and-thin variation, no double lines. The outline goes around the whole silhouette and around the main inner shapes (arms, ears, coat, scarf, boots, glasses). Fine details (fur, knit pattern, wool curls) have NO outline, only soft shading.

FACE
Eyes: small solid near-black dots (#1B1A16); a tiny white highlight only for sad/tearful or surprised expressions. Nose: dark flat rounded shape (#2B2A24) with a very soft highlight. Mouth: a thin line in the same #122819 and the same weight as the outline, drawn ONLY when the pose list asks for one. No eyelashes. No eyebrows unless requested. No teeth except open-mouth laughs.
Cheek blush: very soft, low opacity pink-brown (#B58A7C at 35%), only when the expression list asks for it.

CANVAS
Transparent background (true alpha, clean edges, no white fringe). One character per image. Full body, standing, VIEW per the character's rule below (default: three-quarter view turned toward the LEFT side of the image, about 35 degrees, like the attached turnaround reference), feet touching the bottom edge, tight crop with about 1.5% margin. No ground, no shadow, no props unless requested, no text, no watermark, no frame.

SCALE
Keep the same body size in every pose of the same character. Only the pose and the face change. Heights: Big Green Bear 2900 px, Nini 1600 px, Edward 2320 px.

LEFT / RIGHT
Left and right always mean the side you see in the image, never the character's own anatomy.

NEGATIVE
hard-edged flat shadow shapes, glossy highlights, plastic, 3D render, fuzzy fur-hair texture, thick or tapering outline, double outline, colored outline, missing outline, gradient background, checkerboard, drop shadow, cast shadow, text, extra limbs, extra characters, cream belly patch, anime eyes, sparkles, blur
```

---

## B. Big Green Bear
```
CHARACTER: Big Green Bear.
A big round plush bear: pear-shaped body, large round head, small round ears with a darker green inner recess. Sage-green fur (#5F8258) with soft fuzzy texture, a slightly lighter muzzle area (#7A9C6E), no cream belly. A thick hand-knitted mustard scarf (#C5A766) with a herringbone braid knit, wrapped around the neck; its tail hangs down the chest on his OWN LEFT side (visible in the three-quarter-left view; image-right in a true front view) and ends in a ribbed cuff. Paws are simple rounded mitten shapes with one short curved line for the thumb. Small solid dot eyes, dark rounded-triangle nose. Height 2900 px.
```
Full pose list (generate ALL of them in the new style; all in three-quarter-left view; below, "RIGHT"/active hand = the near-side arm on his OWN LEFT, the one on the same side as the scarf tail):
0. `bear_front_neutral` (portrait/mirror scene, TRUE FRONT VIEW, generate with the front-view reference): neutral standing, arms relaxed, dot eyes, NO mouth, no blush. Scarf tail on the image-right chest.
1. `bear_stand_nomouth` (BASE, generate first): neutral standing, arms relaxed at the sides, eyes open as dots, NO mouth, no blush.
2. `bear_stand_smile_closedeyes` (**Big Green Bear's tell**): eyes closed as happy upward arcs, gentle closed-mouth smile, arms relaxed.
3. `bear_stand_smile_openeyes` (**Green's smile**, used mirrored): the same gentle smile but the dot eyes stay OPEN.
4. `bear_stand_cry`: eyes with a small white highlight, inner brows raised, blue teardrops (#8EB8D9) on the lower lids, downturned mouth, arms hanging down.
5. `bear_stand_grief`: eyes closed as downward arcs, small trembling wavy mouth, both paws clasped in front of the belly, no tears, light blush.
6. `bear_stand_worried`: eyes open with a small highlight, brows raised inward, small downturned mouth, both paws clasped in front of the belly.
7. `bear_stand_surprised`: eyes wide with a highlight, small round "o" mouth, light blush, arms slightly out from the body.
8. `bear_stand_angry` (confrontation scenes only): brows lowered and angled, firm flat mouth, arms stiff at the sides. Still cute and round, never monstrous or scary.
9. `bear_think_handmouth`: the paw on the RIGHT side of the image raised to the chin/mouth, eyes open and glancing slightly aside, head tilted a little, other arm relaxed.
10. `bear_wave_right`: the arm on the RIGHT side of the image raised in a wave, palm toward the viewer showing the paw pads, gentle smile, eyes open.
11. `bear_hold_bell`: the paw on the RIGHT side of the image holding a small jade-green bell (#7DB28E, darker #3F7054, with a loop) by its loop at chest height, soft curious face, small smile.
12. `bear_stand_guilty`: eyes looking down and to the side, lips pressed into a small flat line, shoulders slightly slumped, paws low in front. Must read as "keeping a secret", never evil.
13. `bear_stand_resolute`: calm serious face, eyes forward, small straight mouth, chest slightly lifted.
14. `bear_reach_right`: the arm on the RIGHT side of the image reaching forward and slightly up to pick something up, other arm relaxed.
15. `bear_scarf_adjust_right`: the paw on the RIGHT side of the image touching the scarf near the neck, small content smile.
16. `bear_door_right`: the arm on the RIGHT side of the image extended forward at chest height as if opening a door, body turned very slightly toward it.
17. `bear_walk_A`, 18. `bear_walk_B`: two mid-step walking frames, relaxed neutral face, arms swinging slightly.

---

## C. Nini
```
CHARACTER: Nini.
A small sheep girl, 55% of the bear's height (1600 px tall). A round head covered by a thick cap of cream-white curly wool (#EFE6CF) drawn as soft curl shapes without outlines, a smooth pale cream face (#F3E8D6), small solid dot eyes, a tiny pink triangular nose, two floppy ears with pink insides (#E8B4B0). She wears a mustard-yellow hooded raincoat (#D9A93F) with the hood resting on her shoulders, two dark brown round buttons, a short A-line cut, small white mitten hands, wool-covered legs and short brown boots (#8B6B4A). Standing, arms relaxed at her sides.
```
Full pose list (generate ALL in three-quarter-right view, facing the bear; "toward" = toward the right side of the image):
0. `nini_front_neutral` (portrait, TRUE FRONT VIEW): neutral standing, tiny closed mouth, soft blush.
1. `nini_stand_nomouth` (BASE, generate first): neutral standing, arms relaxed, NO mouth, soft blush.
2. `nini_stand_neutral`: same pose with a tiny closed mouth (a small "w" line).
3. `nini_stand_happy_open`: bright open-mouth smile, eyes open.
4. `nini_stand_curious`: head tilted slightly, small round "o" mouth, eyes a bit larger.
5. `nini_stand_worried`: tiny downturned mouth, inner brow lines raised.
6. `nini_stand_sad`: eyes with small highlights, small frown, shoulders drooping, no tears.
7. `nini_stand_certain`: small firm closed mouth, steady eyes (she says "There were two Bears").
8. `nini_stand_scared`: mouth slightly open, shoulders raised, mittens pulled in toward the chest.
9. `nini_notebook_write`: holds a small notebook in one hand and writes with a pencil in the other, looking down, tiny smile.
10. `nini_notebook_hold`: notebook held against her chest with both hands, looking up.
11. `nini_point`: the arm toward the bear pointing to the side, mouth slightly open.
12. `nini_look_up`: head tilted back looking up, mouth slightly open.

---

## D. Edward (hedgehog, the victim)
```
CHARACTER: Edward.
An elderly hedgehog archivist, 80% of the bear's height (2320 px tall), round pear-shaped body, slightly stooped but dignified posture. Back and head covered with soft felted-looking quills in muted gray-brown (#7A6A58) with cream tips, never sharp or menacing; face and belly soft cream-gray (#D9CFBE); small solid dot eyes with tired kind eyelids; a dark rounded nose; tiny round ears. Round thin wire-rimmed glasses (brass #B08D57). A dark navy waistcoat (#243044) with small brass buttons over a cream shirt (#F2E8D4) with ink-stained cuffs, a thin brass chain with a pocket watch in the waistcoat pocket, short dark trousers, simple dark brown shoes (#4A3A2E).
```
(all in three-quarter-right view, facing the bear)
- `edward_front_neutral` (portrait, TRUE FRONT VIEW): neutral, hands clasped, no mouth.
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
Green is the Big Green Bear set mirrored in-engine (so he faces right, toward Nini and the others when he stands on the left); his scar and left-hand habits are applied in code.
- In the front view the scarf tail is on the LEFT side of the image; in 3/4 he is simply the mirrored `three_quarter_left` sprite.
- Gestures use the mirrored active hand (same pose list as the bear).
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
- [ ] Outline is #122819, uniform ~0.4 % height, closed, no double line
- [ ] Fur/scarf colors match the bear (fur ≈ #5F8258, scarf ≈ #C5A766) / the character's own palette
- [ ] Transparent background, no white fringe, no shadow
- [ ] Same body size as the character's other poses
- [ ] View is correct: bear = three_quarter_left, everyone else = three_quarter_right (or the true front_neutral)
- [ ] Bear: scarf tail on his OWN LEFT chest side; active hand = his own left, the one on the scarf side
- [ ] Mouth only if the pose asks for it; blush only if the expression asks for it
- [ ] No gloss, no cream belly, no extra elements

## H. Supporting cast (proposal, change anything you dislike)
Heights are relative to the bear (2900 px). All three use the STYLE LOCK outline, the same flat soft-shaded look and three-quarter-right view.

### H1. Clockkeeper: an old gray cat (70%, 2030 px)
```
CHARACTER: Clockkeeper.
An old gray tabby cat who maintains the clock tower, 70% of the bear's height (2030 px tall), slim but sturdy, slightly hunched, calm and precise. Soft gray fur (#8E949B) with darker gray tabby stripes on the forehead, cheeks and tail (#5F656C), a cream muzzle and chest (#E8DFCC), small pointed ears with pink-gray insides, a long tail with a curl at the tip, small solid dot eyes with heavy tired eyelids, a tiny pink-brown nose, short whiskers drawn as a few thin lines. Brass goggles pushed up on the forehead (#B08D57), a worn dark brown leather apron (#5A4030) with a tool pocket holding a small oilcan and a screwdriver, rolled-up sleeves on a faded blue shirt (#5B7A9C), a small brass gear hanging from a string at the belt. Stands upright on two legs, arms relaxed.
```
- `clockkeeper_front_neutral` (TRUE FRONT), `clockkeeper_stand_nomouth` (BASE, 3/4 right, generate first), `clockkeeper_speaking`, `clockkeeper_uncertain` (eyes aside, ears slightly back, goggles slipping), `clockkeeper_certain` (steady eyes, small firm mouth), `clockkeeper_oil_gear` (oilcan in one hand, looking at a gear), `clockkeeper_check_clock` (hand shading the eyes, looking up).

### H2. Café owner: a golden dog (90%, 2610 px)
```
CHARACTER: Café owner.
A warm, plump golden retriever-type dog who runs the café next to the tower, 90% of the bear's height (2610 px tall), pear-shaped and cozy. Soft golden-tan fur (#D9A55F) with a cream muzzle and chest (#F3E8D6), floppy rounded ears in a slightly darker tan (#B9803F), a short wagging tail, small solid dot eyes with friendly lids, a dark rounded nose, no tongue unless the pose asks. A burgundy apron (#6E2A35) with a cream stripe and a small white cup embroidered on the chest over a rolled-sleeve cream shirt (#F2E8D4), a tea towel over one shoulder. Standing, relaxed, welcoming.
```
- `cafe_front_neutral` (TRUE FRONT), `cafe_stand_nomouth` (BASE), `cafe_speaking`, `cafe_uncertain` (eyes aside, ears drooping, paw rubbing the other arm), `cafe_certain`, `cafe_hold_teacup` (tray with one steaming white teacup), `cafe_wipe_cup` (wiping a cup with the towel, looking at it).
- Design note: gentle and likable, but with one slightly ambiguous glance pose (`cafe_uncertain`) so the player can suspect him.

### H3. Night guard: a tall owl (105%, 3045 px)
```
CHARACTER: Night guard.
A tall, calm barn owl who patrols the tower at night, 105% of the bear's height (3045 px tall), long rounded body with folded wings. Soft cream-white face disc and chest (#F0E6CF) with a gentle heart-shaped face outline, warm tan wings and back with tiny cream speckles (#B58B5A), small solid dot eyes (large and round but kind, never glowing), a small pale beak, feet with simple short toes. A dark navy peaked guard cap with a small brass badge (#243044 / #B08D57), a long navy coat with two brass buttons, a lantern (brass frame, warm yellow glass #E8C770, soft glow only inside the glass) hanging from one wing tip. Stands upright, wings folded at the sides.
```
- `guard_front_neutral` (TRUE FRONT), `guard_stand_nomouth` (BASE), `guard_speaking`, `guard_uncertain`, `guard_certain`, `guard_lantern_raise` (lifting the lantern forward, head tilted), `guard_salute` (touching the cap with one wing).
- Each also needs the 4 core expressions above; same body size in every pose.

---|---|---|---|
| Clockkeeper | ? | e.g. goggles on forehead, oilcan, leather apron | ? |
| Café owner | ? | e.g. apron, teacup | ? |
| Night guard | ? | e.g. cap, lantern | ? |
Each needs: `_nomouth` base + speaking, uncertain, certain.

---

## I. Turnaround / model sheet (side, 3/4, back views)

### Why and when
Only needed if the game shows a character turning, walking sideways, or from behind (door, stairs, walking). The dialogue game itself works with front views.
Generate **one view per request** (not one sheet with all views): single images keep the full resolution, the same body size and the same line weight.

### Anatomy rule for rotated views (important)
Left/right = the side seen on screen applies to FRONT views. When the body turns, anchor everything to the character's own body:
- Big Green Bear: scarf tail hangs on his OWN LEFT chest side (this is the image-right side in the front view). His active hand is his OWN LEFT hand. The knot is at the front-left of the neck.
- Green is the mirror: everything on his OWN RIGHT.
- Facing the LEFT side of the image shows the character's own LEFT side to the viewer (tail visible). Facing the RIGHT side of the image shows the own RIGHT side (tail hidden behind the body, only the scarf wrap visible).

### Prompts (after the STYLE LOCK and the character block; attach the approved front image as reference)
```
TURNAROUND VIEW. Same exact character as the attached front view: same body size, proportions, outline weight, fur and scarf texture and colors. Only the viewing angle changes. Plain flat magenta #FF00FF background. Neutral relaxed standing pose, arms down, NO mouth drawn, eyes as simple dots. Orthographic camera, no perspective distortion, full body from head to feet, feet on the bottom edge.
VIEW: <one of the lines below>
```
- `side_left`: pure profile, the character faces the LEFT side of the image. His own left side faces the viewer: the knitted scarf tail hangs down his front-left chest and is fully visible. One ear visible, one dot eye, nose in profile.
- `side_right`: pure profile, the character faces the RIGHT side of the image. His own right side faces the viewer; the scarf tail is hidden behind his body, only the neck wrap and knot are visible.
- `three_quarter_left`: three-quarter view turned toward the LEFT side of the image (about 35 degrees from front). Scarf tail visible on the chest.
- `three_quarter_right`: three-quarter view turned toward the RIGHT side of the image (about 35 degrees). Scarf tail partly visible.
- `back`: seen from directly behind: back of the head with both ears, the scarf wrapped around the neck seen from behind (tail not visible), a small round tail nub, both back paws.
For Nini and Edward replace the first sentence with their approved front image and keep their own colors; keep the same rule (own left / own right).

### High resolution
Ask for the largest size the tool offers, then upscale 2x with a free upscaler (for example Upscayl, open source), then run `tools/chroma_key.py`. Do not upscale before keying.
