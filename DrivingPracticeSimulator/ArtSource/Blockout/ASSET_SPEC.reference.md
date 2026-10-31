# 3D Asset Specification (Codex → Claude)

Version 1 · 2026-10-31 · Status: **specification ready; nothing in it has been verified in Unity yet.**
Pipeline (approved): **Blender 4.3 → FBX + texture atlases + `materials.json` → Unity import, integration and verification by Claude.**

Codex owns final 3D meshes, materials (as textures plus a manifest), textures and environment art on
`codex/3d-environment`. Claude owns gameplay, UI/UX, Unity integration, scenes, prefabs, colliders and testing.
Every number below comes from the current gameplay code or from `Resources/Layouts/TestTownLayout.json`.
If an asset can't meet a rule, raise it before producing it.

---

## 0. Coordinates and Blender export

- **Unity space** (used everywhere in this document): meters, **+Y up, +Z forward/north, +X right/east**.
- **Blender space:** model with **Z up** and the vehicle **facing Blender −Y** (Front view looks at the nose).
  The vehicle's left side (driver side) is **Blender +X**.
- Conversion: **Blender (x, y, z) = (−x_u, −z_u, y_u)** · Unity (x, y, z) = (−x_b, z_b, −y_b).
  Example: `DriverEye` Unity (−0.37, 1.22, −0.30) = Blender (0.37, 0.30, 1.22).
- Scene: Metric, Unit Scale 1.0, Length meters. Apply all rotation and scale (Ctrl+A) before export;
  object **origins** carry the pivot positions listed below.
- FBX export: Selected objects · Apply Scalings **FBX All** · Forward **−Z Forward** · Up **Y Up** ·
  **Apply Unit** on · **Use Space Transform** on · **Apply Transform** on · Path Mode **Strip** (no absolute paths) · Mesh: Apply Modifiers on,
  Smoothing **Face**, Tangent Space off · Armature/animation off · **Embed Textures off**.
- Unity enforces its side automatically for everything under `Assets/DrivingSim/Art/`
  (`Editor/ArtImportPostprocessor.cs`): scale 1, Bake Axis Conversion, no cameras or lights, no auto colliders,
  MikkTSpace tangents, material slots kept by name.
- **The import test (§8) proves this axis recipe before any detailed asset is accepted.**

---

## 1. Vehicle: dimensions, origin and collision envelope

Compact sedan, left-hand drive (Korean market).

| Item | Value (Unity) |
|---|---|
| Root origin | ground level, centered left/right, **midway between the axles** |
| Wheelbase / track | 2.65 m / 1.55 m |
| Wheel radius | 0.31 m (e.g. 205/55 R16) · steering ±35° · suspension travel ±0.09 m |
| Wheel hub centers (rest) | FL (−0.775, 0.31, 1.325) · FR (0.775, 0.31, 1.325) · RL (−0.775, 0.31, −1.325) · RR (0.775, 0.31, −1.325) |
| Body envelope | length ≤ 4.45 m (front bumper at z ≈ +2.20), width ≤ 1.80 m without mirrors, ≤ 2.10 m with mirrors, roof ≤ 1.52 m, ground clearance ≥ 0.14 m |
| Mass / center of mass | 1300 kg / (0, 0.50, 0.10), gameplay only |

**Collision envelope (gameplay-owned, not modeled by Codex):**
- Hull box: center (0, 0.66, 0), size 1.76 × 0.62 × 4.40.
- Cabin box: center (0, 1.23, −0.20), size 1.56 × 0.52 × 2.30.
- The visual body should cover these boxes with no gap over 0.05 m, so contacts look right.
- Wheel arches must clear the tire at full steer and full compression.

**Objects (names exact; one FBX per group):**

| FBX | Objects | Origin of each object |
|---|---|---|
| `SM_Sedan_Exterior.fbx` | `Body_Shell_LOD0/1/2`, `Glass_Exterior`, `Lamp_HeadLight_L/R`, `Lamp_TailLight_L/R`, `Lamp_BrakeLight_L/R`, `Lamp_Indicator_FL/FR/RL/RR`, `Body_MirrorHousing_L/R` | vehicle root (0,0,0) |
| `SM_Sedan_Wheel.fbx` | `Wheel_LOD0/1` (one wheel, used 4×) | hub center; axle along X; tire + rim, **left-wheel orientation** (gameplay mirrors for the right side) |
| `SM_Sedan_Interior.fbx` | `Interior_Dashboard`, `Interior_Seats`, `Interior_Doors`, `Interior_Headliner`, `Interior_Pillars`, `Interior_Console`, `Glass_Interior`, `SteeringWheel`, `Cluster_Panel`, `Cluster_Needle_Speed`, `Cluster_Needle_Tach` (optional), `Cluster_Display`, `Interior_Wiper_L/R`, `MirrorGlass_Rear/Left/Right`, `Interior_MirrorHousing_Rear`, `Lamp_Dash_Indicator_L/R`, `Lamp_Dash_ParkingBrake` | vehicle root, except the animated parts in §2 |

- Lamps are separate objects so gameplay can switch their material (off/on emission).
- No colliders, rigs, animations or scripts in vehicle FBXs.

---

## 2. Cockpit: camera and bindings

| Binding | Value (Unity, vehicle root space) | Notes |
|---|---|---|
| **Driver eye** (camera) | (−0.37, 1.22, −0.30) | vertical FOV **65°** default (50–85 in settings), pitched **4° down**, near clip **0.03 m**, look yaw ±70°. On a 20:9 phone 65° vertical ≈ 110° horizontal |
| Interior clearance | nothing within 0.10 m of the eye; headliner ≥ 0.20 m above the eye | prevents near-clip cuts |
| Sightlines | windshield clear ±35° horizontally from the eye except A-pillars (apparent width ≤ 0.08 m); dash top ≤ 1.06 m at z ≥ 0.80 | the road must stay visible at 65° FOV |
| **SteeringWheel** | origin at rim center (−0.37, 0.90, 0.12); rim plane tilted **22°**: its normal (driver → dash) is (0, −0.375, 0.927); rim radius 0.19 m, grip ≈ 0.03 m; **top-center marker at 12 o'clock** | gameplay rotates it about that normal: + = clockwise as the driver sees it, up to ±540° |
| **Cluster_Panel** | center (−0.37, 1.09, 0.47), tilted **12°** up toward the eye, ≈ 0.40 × 0.16 m | dial center (−0.450, 1.091, 0.464) |
| **Cluster_Needle_Speed** (alias `Cluster_Needle`) · optional **Cluster_Needle_Tach** | origins at their dial centers; modeled **pointing at 12 o'clock** in the dial plane (speed: 90 km/h) | dial: 0–180 km/h over 240°, 0 at 8 o'clock (−120°), 180 at 4 o'clock (+120°); ticks every 20 km/h in the texture |
| **Cluster_Display** | quad ≈ 0.16 × 0.08 m, center 0.08 m right of panel center, material slot `M_ClusterDisplay` | gameplay draws speed, gear and lamps here |
| **MirrorGlass_Rear** | quad, center (0, 1.40, 0.62), 0.26 × 0.065 m | normal points at the driver eye; UV 0–1 over the quad, U to the right as the driver sees it; slot `M_MirrorGlass` (replaced by the live image) |
| **MirrorGlass_Left / Right** | quads, centers (∓1.00, 1.02, 0.55), 0.16 × 0.10 m | same rules; housings `Body_MirrorHousing_L/R` |
| **Interior_Wiper_L / R** | origins at the pivots (−0.50, 1.00, 0.975) / (0.12, 1.00, 0.975); arm + blade ≈ 0.48 m | modeled **pointing straight up the glass**; gameplay rotates about the windshield normal: rest −85°, sweep 95° |
| Interior dash lamps | `Lamp_Dash_Indicator_L/R`, `Lamp_Dash_ParkingBrake`: small quads on the cluster | emissive on/off by gameplay |

The interior is shown only in the cockpit view (layer `CockpitInterior`, hidden from mirror cameras and the chase view).
Mirror cameras render at 256×72 (rear) and 160×112 (sides), so keep mirror glass simple.

---

## 3. Test Town geometry (authoritative)

**Source of truth:** `Assets/DrivingSim/Resources/Layouts/TestTownLayout.json`
(generated by `Tools/asset-spec/generate_test_town_layout.py`; plan: `Tools/asset-spec/test-town-plan.svg`).
Read the JSON in Blender (Python) instead of retyping numbers. Polygons are `[x0, z0, x1, z1, …]` in Unity space.
EditMode tests (`TownLayoutTests`) guard its invariants. Layout changes go through Claude.

| Item | Value |
|---|---|
| Road surface | y = 0.00, flat (no camber in v1) |
| Curb | height **0.15 m**, stone width 0.20 m (part of the sidewalk), vertical face |
| Sidewalks and blocks | top at **y = 0.15**, sidewalk width **3.0 m** on every road |
| Main road (N–S, x = 0) | 2 + 2 lanes × **3.25 m** = 13.0 m, z −117 … +117 |
| Cross street (E–W, z = 0) | 1 + 1 lanes × **3.0 m** = 6.0 m, x −97 … +97 |
| Perimeter loop | 1 + 1 × 3.0 m at z = ±120 and x = ±100, corner centerline radius 12 m (curbs 9 / 15 m) |
| Junction curb returns | radius **6.0 m** (centers listed in `corners`) |
| X0 signalized intersection | box x ±6.5, z ±3.0 |
| Crosswalks (X0) | 4.0 m deep, Korean zebra stripes **0.45 m wide, 0.45 m gaps**, stripes parallel to traffic: N z 10–14, S z −14…−10 (x ±6.5); E x 13.5–17.5, W x −17.5…−13.5 (z ±3) |
| Stop lines | **0.45 m** deep, white, **2.0 m before the crosswalk**: NB z −16.45…−16.0 (x 0.2–6.5), SB z 16.0–16.45 (x −6.5…−0.2), EB x −19.95…−19.5 (z −3…−0.1), WB x 19.5–19.95 (z 0.1–3); T-junction stop lines at z ±110 / x ±90 |
| Lane lines | 0.15 m wide · yellow double center line on the main road (lines at x ±0.125) · single yellow on 1+1 streets · white lane dividers on the main road at x ±3.25: **solid** for the last 30 m before a stop line, **dashed 3 m / 5 m** elsewhere · no markings inside junction boxes |
| Signals (X0, far side) | NB head (3.25, 4.75, 15.5) facing −Z · SB (−3.25, 4.75, −15.5) facing +Z · EB (18.5, 4.75, −1.5) facing −X · WB (−18.5, 4.75, 1.5) facing +X · poles on the sidewalk at (8.0, 15.5), (−8.0, −15.5), (18.5, −4.5), (−18.5, 4.5); head bottom ≥ 4.5 m; main road 4-lamp, cross street 3-lamp |
| Signal cycle (gameplay) | main green 20 s → yellow 3 → all-red 2 → cross green 15 → yellow 3 → all-red 2 (45 s) |
| Default spawn | (4.875, 0, −80), heading +Z (northbound outer lane) |

**Keep-out zones** (`keepOut` in the JSON; they override decoration zones):
- `carriageway`: all road surfaces and junction boxes. Only markings, at y = +0.005 as separate meshes.
- `crosswalk_landing`: crosswalk plus its sidewalk landings, 1 m margin. Nothing.
- `sight_triangle`: 15 m legs from each X0 corner. Nothing above 0.9 m except poles ≤ 0.3 m in diameter.
- `signal_reserve`: 2 × 2 m around each signal pole.
- `spawn_clear`: around the default spawn.

**Decoration zones:**
- Furniture band 0.20–0.80 m from the curb face on every sidewalk: street lights, signs, bollards, trees with pits. The rest of the sidewalk is a clear walkway.
- `building`: the four inner blocks, with the 1 m setback already applied.
- `background`: outside the loop, up to ±160 m.

---

## 4. Materials and shaders (URP Mobile, confirmed in code)

- Unity 6000.0.85f1, URP 17.0.3, forward renderer, **Linear color space**, HDR off, MSAA 2×, one shadow
  cascade over 60 m, no depth/opaque textures, no post-processing (`DrivingSim → Configure Project`).
- Codex delivers **textures + `Art/Materials/materials.json`**; Unity materials are generated from it
  (`DrivingSim → Art → Build Materials From Manifest`) and bound to FBX material slots **by name**.
  Do not deliver `.mat` files.

```json
{ "materials": [
  { "name": "M_Asphalt_A", "shader": "simplelit", "surface": "opaque",
    "baseMap": "Environment/TestTown/Textures/T_Asphalt_A_BaseMap.png",
    "normalMap": "Environment/TestTown/Textures/T_Asphalt_A_Normal.png",
    "maskMap": "", "smoothness": 0.25, "metallic": 0.0,
    "baseColor": [1, 1, 1, 1], "emissionMap": "", "emissionColor": [0, 0, 0], "doubleSided": false } ] }
```

| Rule | Value |
|---|---|
| Shaders | `lit` (URP/Lit: vehicle, cockpit, hero surfaces) · `simplelit` (URP/Simple Lit: roads, buildings, props) · `unlit` (URP/Unlit: background, sign faces). No custom shaders, Shader Graph, tessellation, height or detail maps |
| Texture set | `T_<Asset>_BaseMap` (sRGB, A = alpha only when needed) · `_Normal` (OpenGL / +Y, Blender's default) · `_Mask` (linear: **R metallic, G AO, A smoothness**) · `_Emission` (sRGB). PNG, 8-bit, power of two |
| Mask and scalars | with a `maskMap`, URP Lit takes metallic from the mask (R) and multiplies smoothness by the mask alpha, so set `metallic: 1.0, smoothness: 1.0`; without a mask the two values are used directly |
| Sizes | ≤ 1024² (one 2048² cockpit atlas allowed: `T_Cockpit_*`). Android ASTC 6×6, mipmaps on (set by Unity) |
| Texel density | road/sidewalk 256 px/m (tiling) · buildings 128 px/m · cockpit ≈ 1024 px/m |
| Transparency | `surface: "transparent"` only for glass and signal lenses. Glass alpha ≤ 0.15, `doubleSided: true` allowed for glass only. No alpha-blended foliage |
| Emission | lamps, signals, windows at night: emission color + optional map. Gameplay switches lamps by material, so lit and unlit lamp variants are separate materials (`M_Lamp_Indicator_Off` / `_On`) |
| Sharing | share materials and atlases across assets; ≤ 8 materials per vehicle, ≤ 24 for the whole town |

---

## 5. Directories, naming, layers, ownership

```
Assets/DrivingSim/Art/                 (Codex delivers here; Unity imports)
  ImportTest/                          §8 calibration kit
  Materials/materials.json             material manifest (generated .mat files are Claude's)
  Vehicle/CompactSedan/                SM_Sedan_*.fbx + Textures/
  Environment/TestTown/                SM_TestTown_*.fbx + Textures/
  Props/                               SM_Prop_*.fbx (street lights, bollards, benches, trees)
  Signals/                             SM_Signal_Head_3Lamp.fbx, SM_Signal_Head_4Lamp.fbx, SM_Signal_PoleArm.fbx
DrivingPracticeSimulator/ArtSource/    .blend sources and Blender scripts (outside Assets, never imported)
```

- **No `.blend` files under `Assets/`**: Unity would try to launch Blender and CI would fail.
- Names: ASCII, no spaces. FBX `SM_<Name>.fbx`; materials `M_<Name>`; textures `T_<Name>_<BaseMap|Normal|Mask|Emission>.png`.
  Objects inside an FBX: `<Prefix>_<Name>[_LOD0|_LOD1|_LOD2][_COL]`.
- `_LOD0/_LOD1/_LOD2` siblings become a LODGroup automatically. `_COL` objects (simple convex or box-like, ≤ 200 tris)
  become invisible MeshColliders; use them for curbs, building footprints and poles only.
- **Layers** (created by Configure Project and assigned on import by object-name prefix):

| Layer | # | Object prefixes |
|---|---|---|
| Vehicle | 8 | `Body_`, `Glass_`, `Wheel_`, `Lamp_` |
| CockpitInterior | 9 | `Interior_`, `SteeringWheel`, `Cluster` |
| Road | 10 | `Road_`, `Marking_` |
| Sidewalk | 11 | `Sidewalk_`, `Curb_` |
| Building | 12 | `Bldg_` |
| Decoration | 13 | `Prop_`, `Tree_` |
| Signal | 14 | `Signal_` |

- **Ownership:** Claude owns every `.unity` scene, prefab, collider setup, layer, light and script, plus the layout
  JSON. Codex owns FBX files, textures, `materials.json` and `ArtSource/`. Codex does not create or edit scenes,
  prefabs, `ProjectSettings/`, `Packages/` or code.
- Environment chunks are modeled in **world coordinates** (FBX origin = layout origin, identity transforms), one FBX
  per area (`SM_TestTown_Roads`, `SM_TestTown_Sidewalks`, `SM_TestTown_Block_NE` …). Signal heads are separate FBXs
  with the origin at the mounting point (head center), lamps facing −Z; Claude places them from the JSON.
- Commit sizes: keep each file under 25 MB (save `.blend` files compressed). Tell Claude before adding Git LFS.

---

## 6. Android performance and asset budgets (initial)

Target: a mid-range phone (e.g. Snapdragon 7-series / Galaxy A5x) at a steady **30 FPS**, landscape 2400×1080.
Measured on a device once the APK exists. These are starting limits, not results.

| Budget | Limit |
|---|---|
| Main camera | ≤ 150 draw calls (≤ 60 SetPass), ≤ 300k triangles on screen, cockpit included |
| Mirrors (3 cameras, low resolution, interleaved) | ≤ 40 draw calls each; far clip 150 m |
| Vehicle exterior | LOD0 ≤ 30k · LOD1 ≤ 10k · LOD2 ≤ 3k triangles |
| Interior (cockpit) | ≤ 40k triangles, single LOD |
| Wheel | ≤ 2k (LOD0), ≤ 600 (LOD1) |
| Building | LOD0 ≤ 3k, LOD1 ≤ 800; background building ≤ 300 |
| Props | street light ≤ 600 · signal head ≤ 1.5k · pole + arm ≤ 1k · tree ≤ 1.5k (alpha-clip leaves) |
| Textures | total ≤ 64 MB in memory (ASTC 6×6); ≤ 1024² except one 2048² cockpit atlas |
| Lights | one realtime directional light (gameplay); headlights 2 spots without shadows; no other realtime lights |
| Shadows | buildings and vehicle cast; props < 1 m and decals don't |
| Art in the APK | ≤ 150 MB |

---

## 7. Delivery checklist (per asset batch)

- [ ] Files in the folders of §5 with the naming rules; `.blend` sources in `ArtSource/`.
- [ ] Transforms applied; origins at the specified pivots; vehicle faces Blender −Y; Unit Scale 1.0.
- [ ] Triangle counts, material count and texture sizes within §6; a short note listing them.
- [ ] `materials.json` updated; every FBX material slot has a matching entry.
- [ ] No objects inside keep-out zones; layout dimensions match the JSON (state how you checked).
- [ ] No claim of Unity verification. Claude imports, validates, integrates and reports actual results.

---

## 8. Minimal FBX import test (required before detailed assets)

Codex delivers **`Assets/DrivingSim/Art/ImportTest/`** with:

`IT_Calibration.fbx` (all positions in Unity space; convert with §0):

| Object | Geometry | Expected after import |
|---|---|---|
| `IT_Cube_1m` | 1 m cube, origin at its **bottom center**, 12 triangles, UVs, material slot `M_IT_Checker` | bounds center (0, 0.5, 0), size 1 m |
| `IT_Nose` | 0.1 m cube | center (0, 0.5, **+2.0**): forward axis |
| `IT_Left` | 0.1 m cube | center (**−1.0**, 0.5, 0): vehicle left = −X, no mirroring |
| `IT_Up` | 0.1 m cube | center (0, **2.0**, 0) |
| `DriverEye`, `SteeringWheelPivot`, `Mirror_Rear`, `Mirror_Left`, `Mirror_Right` | empties | positions of §2, within 1 mm |
| `IT_LODTest_LOD0`, `IT_LODTest_LOD1` | sphere ≈ 2k and ≈ 500 triangles | automatic LODGroup with 2 levels |

Textures: `T_IT_Checker_BaseMap.png`, `T_IT_Checker_Normal.png`, `T_IT_Checker_Mask.png` (1024², checker with
"+U →" and "+V ↑" labels so UV orientation is visible). Manifest: `Art/Materials/materials.json` with
`M_IT_Checker` (lit, all three maps) and `M_IT_Marker` (unlit).
Also put `IT_Calibration.blend` in `ArtSource/ImportTest/`.

Claude then runs `DrivingSim → Art → Build Materials From Manifest`, `Remap Model Materials` and
`Validate Import Test` (also the EditMode test `ArtImportTestKitTests` in CI), and reports the result.
Detailed vehicle and town assets are accepted only after this passes in Unity.
