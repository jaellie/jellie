# Codex brief: vertical-slice art pass (cockpit + Korean intersection)

Repo `jaellie/jellie` · your branch `codex/3d-environment` (update it from `ccr-21c0ed33-uzs8xd` first).
Spec: `DrivingPracticeSimulator/ASSET_SPEC.md` (binding). Layout: `Assets/DrivingSim/Resources/Layouts/TestTownLayout.json` (binding).

## Goal
Take the current grey blockout to a **believable, clean, sunny Korean city intersection seen from a compact sedan's
driver seat**, at mobile-game quality (stylized-realistic, not photoreal). The mood reference is the user's concept
image (bright midday, blue sky, mid-rise Korean commercial streets, trees, signs, parked cars, a bus).
Use it for mood only; do not copy it. The HUD in that image is Claude's job. Ignore it.

Scope is **only** the vertical slice: the cockpit, intersection X0 and about 60 m of each approach.
No full city. No moving traffic (AI traffic is on hold); vehicles are **parked props** only.

---

## A. Cockpit: fix the blockout, then detail it

Problems in the current render (`codex blockout`, first image) and the fix for each:

| # | Problem | Fix |
|---|---|---|
| 1 | Windshield frame floats inside the cabin; the A-pillars sit near the screen center and vertical | Windshield spans the full cabin width. A-pillars run from the dash corners (x ≈ ±0.75, y ≈ 0.97, z ≈ 0.95) back and up to the roof (x ≈ ±0.70, y ≈ 1.48, z ≈ 0.68). From `DriverEye` they appear at the **screen edges**, leaning inward, ≤ 0.08 m apparent width |
| 2 | Headliner fills the top ~25% of the view | Roof inner surface ≥ 0.20 m above the eye (y ≥ 1.42). Only a thin roof band and the sun visors should show at the top. Add sun visors |
| 3 | Wipers stand up in the middle of the view | Wipers rest **along the bottom edge of the windshield** (pivots per spec), mostly hidden below the cowl |
| 4 | Left side mirror looks like it's inside the cabin, on the dash | Model the **left door with its window, window frame and mirror sail**. The mirror housing sits **outside** the glass on the door (anchor `Mirror_Left` (−1.0, 1.02, 0.55)), seen through the side window; the same on the right |
| 5 | Dashboard is a flat slab; the cluster is a box | Sculpted dash: soft top pad curving down to the windshield base, cluster hood over the instruments, center stack with an 8–10" screen (dark glass), air vents, hazard button, climate panel, gear-selector area on the console |
| 6 | Steering wheel is a thin flat ring | 3-spoke wheel, rim diameter 0.38 m (radius 0.19), grip thickness ~0.032 m, airbag hub with a blank emblem (no brand), spoke buttons as shapes, **12 o'clock marker**. Pivot and tilt exactly per spec (center (−0.37, 0.90, 0.12), 22°) |
| 7 | No instrument detail | Cluster: two analog dials (left tachometer-style 0–8 ×1000 rpm, right speedometer **0–180 km/h over 240°, 0 at 8 o'clock**, per spec) around a center display. Separate meshes: `Cluster_Needle_Speed`, `Cluster_Needle_Tach` (origins at dial centers, modeled pointing at 12 o'clock), `Cluster_Display` quad (gameplay draws speed, gear and lamps). Dial faces as a texture (numbers, ticks); no brand text |
| 8 | Flat grey everything | Materials below (§C) |

Also include: A/B pillar trims, door panels with handle, armrest and window switch shapes; driver and passenger
seat backs (visible in the mirrors); rear-view mirror on its mount at the windshield top center (`Mirror_Rear`
(0, 1.40, 0.62)); hood edge just visible below the windshield; cowl, defroster vents.

Hard rules (ASSET_SPEC §1–2): vehicle root at ground level midway between the axles; left-hand drive;
`DriverEye` (−0.37, 1.22, −0.30), vertical FOV 65° (≈ 110° horizontal on 20:9) and 4° down: **check your render
with exactly this camera**. Mirror glass is separate quads facing the eye, with slot `M_MirrorGlass`. The exact object
names in §1–2 are bound by code. Interior objects use the `Interior_` prefix. Glass is `Glass_Interior` and must be
see-through.

Budgets: interior ≤ 40k triangles, ≤ 6 materials; one 2048² cockpit atlas (`T_Cockpit_*`) plus shared trims.

## B. Exterior car (for the chase view and mirrors)
Compact 4-door sedan, generic (no brand, no real model): 4.40 × 1.76 × 1.48 m, hubs per spec, `Body_*`, `Glass_*`,
`Lamp_*` objects, `SM_Sedan_Wheel.fbx` (one wheel, left orientation). LOD0 ≤ 30k / LOD1 ≤ 10k / LOD2 ≤ 3k triangles.
Paint: white or light silver (the user's reference), `M_CarPaint` with a separate mask for trims.

## C. Look and materials (URP Mobile, `materials.json` only)
- **Interior:** dark graphite soft-touch dash (#2A2D31, smoothness 0.25), matte black plastic (#16181B, 0.2),
  piano-black screen surround (0.85), satin aluminium trims (metallic 1, 0.6), perforated-leather wheel rim
  (normal map), headliner light grey fabric (#BDBDB8, 0.1). AO baked into the atlas (mask G).
- **Glass:** transparent, alpha ≤ 0.15, slight blue-green tint, `doubleSided` allowed.
- **City:** bright midday. Concrete and tile facades in warm greys and beiges, blue-tinted window glass, shopfront
  glazing at street level, colorful flat **sign boards with fictional Korean shop names** (e.g. "한빛약국", "푸른카페",
  "다온마트"). No real brands, logos or trademarks.
- **Road:** asphalt with subtle wear and tire tracks (tileable 1024², 256 px/m), markings as separate decal meshes
  per the layout (white 0.15 m lane lines, yellow double center line, white zebra 0.45/0.45, stop lines 0.45),
  manhole covers. Sidewalk: grey and red interlocking pavers, **yellow tactile paving at crosswalk ramps**, granite
  curbs 0.15 m high.
- **Lighting look** (Claude sets it up in Unity; give your preferred values in your delivery note): sun elevation
  ~50°, warm white (~5500 K), clear blue sky, soft shadows, light distance fog only.

## D. Intersection and street kit (Blockout first → then final)
Build on `TestTownLayout.json` exactly: roads at y = 0, curbs and sidewalks at 0.15, 3 m sidewalks, R6 curb
returns, crosswalks, stop lines, keep-out zones (nothing in sight triangles above 0.9 m except poles).

Modular kit (`SM_TestTown_*`, `SM_Prop_*`, `SM_Signal_*`, prefixes per ASSET_SPEC §5):
1. Road and marking meshes for X0 plus ~60 m of each approach (world coordinates, origin = layout origin).
2. Sidewalks and curbs with collision proxies (`Curb_*_COL`).
3. **Buildings, 8–12, in the four blocks around X0:** 4–8-story commercial (ground-floor shops with sign boards,
   window bands, rooftop units), plus 2–3 taller apartment blocks (12–15 floors) as a backdrop. Modular facade pieces
   so they can be reused. LOD0 ≤ 3k, LOD1 ≤ 800 triangles each; simple `_COL` boxes.
4. **Traffic signals:** Korean horizontal heads, 4-lamp (red, yellow, left arrow, green) for the main road and
   3-lamp for the cross street, on poles with mast arms; lamp lenses as separate objects `Lamp_Red`, `Lamp_Yellow`,
   `Lamp_LeftArrow`, `Lamp_Green` (emissive). Head origin at the head center, lamps facing −Z. Claude places them
   from the layout.
5. **Signs:** blue directional signs with white text (fictional place names such as "시청", "중앙로"), round speed
   limit sign "50" (red ring), crosswalk sign, no-parking sign. Sign faces as separate quads.
6. **Street furniture:** street lights (≤ 600 triangles), street trees (ginkgo or zelkova, alpha-clip leaves,
   ≤ 1.5k), bus stop shelter, bollards, fire hydrant, trash bin, planters, utility pole with wires (optional).
7. **Parked vehicles (props, static):** 3–4 generic sedans and SUVs, 1 city bus (blue), ≤ 8k triangles each, no brands.

## E. Delivery and process
- **Stage 1, blockout (now):**
  - Put it in `Assets/DrivingSim/Art/Blockout/`, names prefixed `BO_` (e.g. `SM_BO_Cockpit.fbx`, `SM_BO_Intersection.fbx`).
  - Flat colors through `materials.json`, no textures.
  - Fix A1–A7 in the blockout first.
  - Render from `DriverEye` at FOV 65° vertical, 20:9, and include the render in your report.
- **Stage 2, final:** start only after Claude reports a Unity import PASS for the import kit and the blockout.
  Final assets go in `Vehicle/`, `Environment/TestTown/`, `Props/`, `Signals/`.
- FBX recipe (ASSET_SPEC §0): vehicle faces Blender −Y, driver side +X, Apply Transform, FBX All, Path Mode Strip,
  Embed Textures off. `.blend` files go in `ArtSource/` only.
- Textures: PNG, power of two, ≤ 1024 (cockpit 2048), `T_<Name>_BaseMap / _Normal / _Mask / _Emission`.
- In every delivery, include a short report:
  - file list, triangle and material counts, texture sizes;
  - how you checked the layout alignment;
  - renders from `DriverEye` and from a street-corner camera;
  - **no claim of Unity verification**.
- Change only `Assets/DrivingSim/Art/**` and `ArtSource/**`. No code, scenes, prefabs, layout, ProjectSettings
  or packages.
- All content original or CC0. Record any third-party source (name, URL, license) in `ArtSource/CREDITS.md`.
- Stop after Stage 1 and wait for Claude's import report.
