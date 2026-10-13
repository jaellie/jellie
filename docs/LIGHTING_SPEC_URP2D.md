# Character lighting and interaction prompt: spec for the Unity (URP 2D) build

Status: **implemented and verified in the web prototype** (`prototype/bell_village_web/index.html`). No Unity project exists yet, so this file is the hand-off. Values below are the ones tested.

## Interaction prompt (UI Toolkit / uGUI)
| Property | Value |
|---|---|
| Size vs previous | **80%** in width and height (font 25 to 20 px, key cap 21 to 17 px, padding 22/52 to 17/42 at 1080p) |
| Show | only while the player is within **140 px** of an interactable, and only in free-walk mode |
| Fade | **0.25 s** opacity + 6 px rise on show; same on hide |
| Hide on interaction | **instant** (no fade) the frame the interaction starts |
| Exclamation mark | fades to **34% opacity, 70% scale** while the bottom prompt shows; full strength only when the player presses Look (Q) |
| Small screens | scale up by `min(1.7, max(1, 14 / (20 * stageScale)))` so text stays at least about 14 px |
| Sprite | nine-slice (plaque_cream_small, slice 26 px); width follows the text |

## Character lighting (URP 2D)
Use the existing pipeline. No pipeline change, no Shadow Caster 2D, no post-processing.

1. **Global Light 2D:** cool blue, colour `#3A4F8A`, intensity about **0.55** (night shading). Web value: multiply tint alpha 0.27 in the open, easing to 0.05 under a lamp.
2. **Point Light 2D at each streetlamp** (world X in the web prototype: 372, 1146, 1786, 2765, 3550 at 0.6x): colour `#FFB048`, intensity about **0.9**, outer radius about **470 px / pixelsPerUnit**, inner radius about 0.3, falloff strength about 0.7. Light layers: Characters and Background.
3. **Characters and NPCs** use **Sprite-Lit-Default.** Add a simple rounded **normal map** per body sprite (Secondary Texture `_NormalMap`, generated from the alpha silhouette) so the **side facing the lamp** receives the amber and the far side stays cool. Set the Light 2D normal map quality to *Fast.*
4. **`LampLightResponder` (small MonoBehaviour):** reads the distance to the nearest lamp(s) and drives a per-character intensity value used for the contact-shadow lean, easing with `1 - exp(-5 * dt)` (about 0.2 s) so nothing pops or flickers.
5. **Contact shadows:** one soft ellipse blob sprite (width about 0.8x the sprite) at the feet, on a sorting layer under characters. Under a lamp it **leans away from the lamp by up to 14 px** and widens up to **22%.** It stays fixed on the ground while the character bobs.
6. Sprite colours, outlines and animations are **not edited.** The web version clips both tints to each sprite's own alpha.

## Verified numbers (web prototype, headless Chromium)
- Prompt box: 322 x 65 px vs 401 x 81 px before (exactly **0.80** each way).
- Prompt fade-in: opacity 0.30 at 60 ms, 0.92 at 180 ms, 1.0 at 580 ms. Hidden within 30 ms of pressing E.
- Walking at run speed across lamps: **366 frames, largest frame-to-frame change 0.061 (of 1.0), zero direction reversals** (no flicker).
- Sampled light on BGB: x=760 (between lamps) left 0.08 / right 0.08, cool 0.23; x=1000 right 0.77; x=1146 (under the lamp) 0.50 / 0.50, cool 0.05; x=1290 left 0.78.
