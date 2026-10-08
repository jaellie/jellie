# Animation & Image-Generation Guide

## Part 1. Making the art with Grok / GPT / Gemini

### What each tool is good for
| Tool | Use it for | Watch out |
|---|---|---|
| **GPT (image gen)** | Base characters, **editing an existing image** ("same character, change only the pose"), UI elements | Ask for a transparent background; if it gives a checkerboard or white, use the magenta method below |
| **Gemini** | Image-to-image with 1-3 reference images, consistent edits | **No true transparency** → always use the magenta method |
| **Grok** | Fast variations / idea sketches | Weakest at keeping a character identical across poses; use for exploration, not final sprites |

### Transparent background: the magenta method (works for all three)
Add to the end of EVERY character / UI prompt (replace "transparent background" in the style lock):
```
BACKGROUND: perfectly flat solid pure magenta #FF00FF, no gradient, no shadow, no floor, no texture, no vignette. The subject must not contain any magenta or pink-purple tones near its edge.
```
Then run `python3 tools/chroma_key.py in.png out.png` (tested on the bear and Nini: no pink fringe, interior colors unchanged).
(Not green: the bear is green. Not white/black: they blend into the cream fur / dark outline.)

### Consistency rules
1. Generate each character's **`nomouth` base** first. Pick one, and never re-roll it.
2. For every other pose use **edit mode**: attach the base + one style reference and say
   `Keep this exact character, outline, colors and body size. Change ONLY: <pose line>.`
3. One pose per request. Never ask for a sheet of poses (sizes and lines drift).
4. If a result drifts (thicker outline, different scarf, gloss), do not fix it with words: re-edit from the base.
5. After every image run `tools/harmonize_bear_colors.py` (bear) and the checklist in `CHARACTER_ART_PROMPTS.md`.

### AI-disclosure
Steam / itch.io require disclosing AI-generated assets. Keep a list of which tool made which file (add a column to `ASSET_INVENTORY.md`).

---

## Part 2. How the characters will move (2D, no skeleton art needed)

Dialogue game, but nobody stands frozen. Three layers of life, all driven by an `IdleProfile` (ScriptableObject) per character:

1. **Whole-body procedural motion** on the single sprite (pivot at the feet): breathing, weight shift, sway.
2. **Overlay swaps**: eyes (blink / look), mouth (talk).
3. **Mesh bones (Unity 2D Animation, Sprite Skinning)** on the same sprite, only 5-6 bones: head, torso, each arm, scarf tail. This makes the scarf tail swing and the head lag behind the body **without any extra art layers**.

### A. Loops that never stop (play on every character, always)
| Loop | Period | What moves | Amount (at 1080p) |
|---|---|---|---|
| **Breathing** | Bear 3.4 s, Nini 2.8 s, Edward 4.0 s | Y-scale about the feet, X-scale opposite | Y ±1.1 %, X ∓0.45 % |
| **Weight shift** | 5-7 s (randomized) | Rotation about the feet, slow ease | ±0.8°, 3 px sideways |
| **Head lag** (bones) | follows breathing, delayed 0.12 s | Head rotates slightly behind torso | ±1.2° |
| **Scarf tail sway** (bear) | 2.4 s | Tail bone swings, ends lag | ±4° |
| **Ear twitch** | one ear, every 8-15 s (random side) | Ear bone flick, 0.25 s | 6° out-and-back |
| **Wool / quill settle** (Nini, Edward) | with breathing | tiny scale offset on the head cap | ±0.6 % |

### B. Face loops (overlay swaps)
| Loop | Timing | Frames |
|---|---|---|
| **Blink** | every 2.5-6 s random, 10 % chance of a double blink | open → half (40 ms) → closed (60 ms) → half → open (3-4 frames) |
| **Look around** | every 4-9 s, eyes shift 6-10 px for 0.8 s then return | 3 eye-dot positions (left, center, right) |
| **Talk** | while text prints: swap mouth at 8-12 fps from a random pick of closed / small / wide / "o"; closes 0.15 s after the last character | 4 mouth sprites |
| **Smile hold** | on happy lines: mouth smile + 2 % cheek puff | 2 frames |

### C. Mood loops (replace the base idle while the mood is active)
| Mood | Loop behavior |
|---|---|
| **Happy** | breathing 15 % faster, tiny bounce on heels every 4 s (Y +6 px, 0.3 s) |
| **Worried / grief** | breathing slower (4.2 s), shoulders lowered 8 px, hands-clasped pose with a slow wringing sway (±1.5°), blink rate -30 % |
| **Guilty** | eyes drift down-left every 3 s then snap back; weight shifts away from the other character |
| **Thinking** | head tilts 4° and returns every 5 s, "think" pose paw taps the chin (2 frames, 0.4 s) |
| **Surprised** | one-shot: scale 1.06 → 1.0 over 0.25 s, then hold wide-eyes, breathing paused 0.6 s |
| **Angry (confrontation)** | breathing sharper and shorter (2.2 s), no sway, tiny forward lean |
| **Scared (Nini)** | trembling: ±0.5° at 14 Hz, shoulders up |
| **Sad / crying** | slow breathing, head drifts down 6 px over 2 s; tear drop moves down once every 3 s |

### D. Signature gestures (the twin tells, played as occasional idle fidgets, never explained)
| Character | Fidget (every 12-25 s, random) |
|---|---|
| **Big Green Bear** | adjusts scarf with the hand on the **RIGHT side of the image** (slow, 1.1 s); smiles with **closed eyes**; looks around slowly |
| **Green** (mirrored) | adjusts scarf with the hand on the **LEFT side** (sharper, 0.8 s); smile with **eyes slightly open**; posture 3 % taller and more upright, breathing 12 % faster, blinks less often |
| **Nini** | writes or flips the notebook; looks up at objects (head tilt) |
| **Edward** | pushes glasses up, checks the pocket watch (opens it, glances, closes), shuffles documents |
All fidgets are optional one-shots on top of the idle. Bear's are slower and softer, Green's are quicker and more precise (values above).

### E. Interaction one-shots
Wave (right hand), nod (head dip 8 px, 0.3 s), shake head (±5°, 0.5 s), point, reach (right hand for Bear), open door, pick up bell, hold evidence up, step forward / back (2 px hop frames), enter / exit with a slow hop-walk.

### F. Walk
Two-frame hop-walk (body rock ±1.5°, Y bounce 8 px at 2.4 steps/s) + the scarf tail drag; stops with a small settle (scale 0.98 → 1.0). Needed art: `walk_A`, `walk_B` or procedural-only (recommended to start).

### G. Mirror window
The reflection plays the same loops mirrored with a **0.4 s delay**; its blink and fidget timing are offset so it feels like a slightly slow reflection. In the REVEAL state the delay breaks (once, 1 frame): this is the first clue it was never a reflection.

### H. Environment loops
Clock second hand (tick or stutter), pendulum swing ±6° / 2 s (fixed), gear rotation (small gear 48/18 faster, opposite), curtain sway ±0.4° / 6 s, dust motes in the light, mirror highlight glint (slow slide), the interaction marker pulse (0.6 → 1.0 alpha, 2.4 s).

---

## Part 3. Art we need so the animation looks good
Nothing new for the whole-body loops. Optional but worth it:
- Eye overlays: open, half, closed (blink), look-left, look-right, closed-happy.
- Mouth overlays: closed, small, wide, "o", smile, frown.
- Scarf tail as a separate transparent layer (only if the bone version looks stiff).
- Notebook / pencil, glasses, pocket watch as separate props for Nini / Edward gestures.

## Part 4. Unity plan
- `IdleProfile` (ScriptableObject): periods, amplitudes, blink range, fidget list, per-character.
- `CharacterAnimator` (MonoBehaviour): applies A + C procedurally in `LateUpdate`; handles overlays; exposes `SetMood()`, `Talk(start/stop)`, `PlayFidget(id)`.
- Twin variants are just two `IdleProfile` assets.
- Performance: transforms + sprite swaps only → trivial for integrated graphics.
