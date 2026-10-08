# Art style + Grok video loops (per character)

## 1. Is the art cel-shaded or hand-painted?
**Hand-painted** (soft, brush-blended shading + fine fur/knit texture) **with a clean uniform ink outline.**
It is NOT cel-shaded. Cel-shading = flat color blocks + hard-edged shadow shapes + thick outline, like TV animation.
Official name for the project: **"hand-painted storybook plush, ink-outlined"**. (The style lock now says this explicitly and bans cel-shading.)

Why it matters for video: AI video models handle flat cel art more stably, while fur/knit textures can "boil" (shimmer frame to frame).
Therefore:
- Test ONE clip first (bear idle). Check with `tools/video_to_loop.py` → `seamRatio` and watch the preview GIF for texture crawling.
- If the texture shimmers, shorten the clip, lower the motion, and stay with the hybrid below.

## 2. Hybrid plan (recommended)
| Motion | How |
|---|---|
| Breathing, sway, scarf wobble, blink, mouth talk | procedural + overlays in Unity (zero flicker, tiny files) — see ANIMATION_LOOPS.md |
| Expressive gestures (fidgets, wave, think, write, check watch, wring hands…) | **Grok image-to-video** loops from this file |
| Green | NO new videos: mirror the Bear clips and play them 12 % faster (scarf/hand sides flip automatically) |

## 3. Pipeline (every clip)
1. Take the approved still of the character (generated on flat magenta #FF00FF).
2. Grok: image-to-video with the **MASTER VIDEO BLOCK + one loop prompt** (below). Re-roll until the face and outline do not change.
3. `python3 tools/video_to_loop.py clip.mp4 out_dir --min 2 --max 4` → keyed PNG sequence, auto-found loop, cross-faded seam, preview GIF, `*_loop.json`.
   Accept when `seamRatio` ≤ 3 and the preview has no texture crawling. (Check Grok's current clip length / resolution limits; use the highest resolution offered.)
4. Unity: import the PNG sequence (bottom-center pivot), build an Animation clip, loop it.

## 4. MASTER VIDEO BLOCK (paste first, every time)
```
IMAGE-TO-VIDEO. The attached image is the exact first frame.
CAMERA: completely static, locked off. No zoom, no pan, no tilt, no shake, no parallax.
BACKGROUND: stays perfectly flat solid magenta #FF00FF in every frame. No floor, no shadow, no lighting change, no vignette, no particles.
CHARACTER: stays exactly the same character in every frame: same face, same outline, same colors, same proportions, same scarf/clothes, same texture. Do not redesign, do not add objects, do not add characters, do not change the art style.
STYLE: hand-painted plush storybook look. The outline stays one thin uniform dark olive line. Fur and knit texture stay still on the surface (no crawling, no boiling, no morphing texture).
MOTION: subtle, slow and natural unless stated. The character stays in place in the frame and feet stay on the same spot.
LOOP: the last frame must match the first frame exactly (same pose, same expression, same scarf position) so the clip loops seamlessly.
```
Left/right always mean the side you see in the image.

---

## 5. Big Green Bear (right-side hand; slower and softer than Green)
Start from: `bear_stand_nomouth` unless stated.
| Clip | Seconds | Prompt line to add after the master block |
|---|---|---|
| `bear_idle_breathe` | 3.4 | `MOTION: slow breathing, chest and belly rise and fall by 1%, shoulders very slightly, the knitted scarf tail on the right side sways gently 4 degrees and lags behind the body. Eyes stay open dots, no mouth, head still.` |
| `bear_fidget_scarf_right` | 4.0 | `MOTION: starts relaxed. The paw on the RIGHT side of the image rises slowly to the scarf near the neck, strokes it once, and returns to rest. Head tilts 3 degrees toward that paw. Slow and soft.` |
| `bear_look_around` | 4.0 | `MOTION: the head turns slightly to the left, pauses, turns slightly to the right, pauses, returns to center. The dot eyes follow. Body stays still apart from breathing.` |
| `bear_happy_bounce` | 2.4 | `Start from bear_stand_smile_closedeyes. MOTION: two small happy bounces on the heels, the scarf tail bounces with a delay, eyes stay closed in happy arcs, smile stays.` |
| `bear_worried_wring` | 3.6 | `Start from bear_stand_worried. MOTION: both paws clasped at the belly, thumbs rubbing slowly, shoulders slightly lowered, slow shallow breathing, eyes glance down and back up once.` |
| `bear_grief_sway` | 4.0 | `Start from bear_stand_grief. MOTION: eyes stay closed, the mouth trembles very slightly, the whole body sways side to side by 1.5 degrees, the head droops 6 pixels and recovers.` |
| `bear_think_chin` | 3.6 | `Start from bear_think_handmouth. MOTION: the paw on the RIGHT side taps the chin twice, the head tilts 4 degrees and returns, the eyes glance aside and back.` |
| `bear_wave_right` | 2.4 | `Start from bear_wave_right. MOTION: waves 3 times with the paw on the RIGHT side of the image, then rests the arm slowly back to the same raised start pose.` |
| `bear_guilty_shift` | 3.6 | `Start from bear_stand_guilty. MOTION: the eyes drift down and to the side, the lips stay pressed, a tiny swallow, weight shifts away by 1.5 degrees and returns. Never aggressive.` |
| `bear_resolute` | 3.0 | `Start from bear_stand_resolute. MOTION: one slow deep breath, the chest lifts, one small firm nod, returns to start.` |
| `bear_walk_in_place` | 1.0 | `MOTION: walking in place, two steps per second, body bobs 8 pixels, the arms swing slightly, the scarf tail drags and sways. The character does not travel across the frame.` |
| `bear_hold_bell` | 3.2 | `Start from bear_hold_bell. MOTION: the bell swings gently on its loop 5 degrees, the paw on the RIGHT side stays steady, the head tilts curiously and returns.` |

## 6. Green (no videos)
Mirror every Bear clip (scarf tail and hand flip to the LEFT side), play at 112 % speed, scale Y +3 %, breathe slightly faster. For the smile use the `smile_openeyes` base so the eyes stay slightly open.

## 7. Nini (small, quick, notebook)
Start from `nini_stand_nomouth` unless stated.
| Clip | Seconds | Prompt line |
|---|---|---|
| `nini_idle_breathe` | 2.8 | `MOTION: light breathing, the wool cap bobs 3 pixels, the floppy ears settle a tiny bit, she shifts weight from one foot to the other once. No mouth.` |
| `nini_notebook_write` | 4.0 | `Start from nini_notebook_write. MOTION: the pencil makes small quick strokes on the notebook, the head dips with each stroke, a tiny smile, then she glances up once and back down.` |
| `nini_look_up` | 3.2 | `Start from nini_look_up. MOTION: head tilts further back slowly, mouth opens a little more, ears swing back, returns.` |
| `nini_curious_tilt` | 3.0 | `Start from nini_stand_curious. MOTION: head tilts left then right by 6 degrees, ears follow with a delay, returns to center.` |
| `nini_scared_tremble` | 2.4 | `Start from nini_stand_scared. MOTION: small fast trembling (half a degree), shoulders up, the mittens pressed to the chest, one quick breath.` |
| `nini_happy_hop` | 2.2 | `Start from nini_stand_happy_open. MOTION: two small happy hops, raincoat hem and ears bounce with a delay.` |
| `nini_certain_nod` | 2.4 | `Start from nini_stand_certain. MOTION: one firm slow nod, steady eyes, the mouth stays closed and small.` |
| `nini_point` | 2.4 | `Start from nini_point. MOTION: the arm on the RIGHT side of the image points firmly, a tiny forward lean, returns.` |

## 8. Edward (slow, careful, tired)
Start from `edward_stand_nomouth` unless stated.
| Clip | Seconds | Prompt line |
|---|---|---|
| `edward_idle_breathe` | 4.0 | `MOTION: very slow breathing, the quills on his back settle slightly, the thin brass watch chain sways 2 degrees, hands stay clasped.` |
| `edward_adjust_glasses` | 3.2 | `Start from edward_adjust_glasses. MOTION: one hand pushes the round glasses up the nose, a small blink, the hand returns.` |
| `edward_check_watch` | 4.0 | `Start from edward_check_watch. MOTION: the pocket watch opens, he glances at it, a slow sigh, the watch closes, back to start.` |
| `edward_shuffle_documents` | 3.6 | `Start from edward_hold_documents. MOTION: he taps the paper bundle straight against his chest, the top sheet lifts slightly and settles.` |
| `edward_worried_glance` | 3.2 | `Start from edward_worried. MOTION: the eyes glance to the left and the right, a tiny swallow, hands tighten and release.` |
| `edward_grave_nod` | 3.0 | `Start from edward_stand_grave. MOTION: one slow serious nod, the brows lower a little more, returns.` |
| `edward_fallen_breath` | 3.5 | `Start from edward_fallen. MOTION: NONE of the body moves except extremely faint breathing is NOT shown; keep the image still with only a tiny settling of the quills.` (Use a still image instead if the model adds motion.) |

## 9. Checklist for a Grok clip (reject if any fails)
- [ ] Face, outline, colors and proportions identical from first to last frame
- [ ] Background flat magenta the whole time (no shadow, no gradient)
- [ ] Camera locked
- [ ] Fur / knit texture does not shimmer or crawl
- [ ] Last frame == first frame (seamRatio ≤ 3 after `video_to_loop.py`)
- [ ] Hand side is correct (Big Green Bear = RIGHT side of the image)
