# Handoff to Codex: 3D assets v1

**Repo** `jaellie/jellie` · **your branch** `codex/3d-environment` (from `ccr-21c0ed33-uzs8xd`) · **spec** `DrivingPracticeSimulator/ASSET_SPEC.md`

**Your scope:** 3D meshes, textures, `materials.json`, Blender sources. Change only `Assets/DrivingSim/Art/**` and `ArtSource/**`.
No scenes, prefabs, code, ProjectSettings, Packages or `.mat` files. Don't touch physics, input, AI, localization or UI.

**Step 1 (now): import test only.** Deliver `Assets/DrivingSim/Art/ImportTest/` (ASSET_SPEC §8):
- `IT_Calibration.fbx` with:
  - `IT_Cube_1m`: 1 m cube, origin at its bottom center, 12 triangles, UVs, slot `M_IT_Checker`.
  - `IT_Nose`: 0.1 m cube at Unity (0, 0.5, +2).
  - `IT_Left`: 0.1 m cube at Unity (−1, 0.5, 0).
  - `IT_Up`: 0.1 m cube at Unity (0, 2, 0).
  - Empties `DriverEye` (−0.37, 1.22, −0.30), `SteeringWheelPivot` (−0.37, 0.90, 0.12), `Mirror_Rear` (0, 1.40, 0.62), `Mirror_Left` (−1, 1.02, 0.55), `Mirror_Right` (1, 1.02, 0.55).
  - `IT_LODTest_LOD0` (~2k triangles) and `IT_LODTest_LOD1` (~500 triangles).
- `T_IT_Checker_BaseMap.png`, `T_IT_Checker_Normal.png`, `T_IT_Checker_Mask.png`: 1024², with UV direction labels.
- `Art/Materials/materials.json` with `M_IT_Checker` (lit, all three maps) and `M_IT_Marker` (unlit).
- `ArtSource/ImportTest/IT_Calibration.blend`.

Then stop. I import it, run the validator in Unity and report back before you start detailed work.

**Axes (the import test checks these):**
- Blender Z up; the vehicle faces **−Y**; the driver side is **+X**.
- Blender (x, y, z) = Unity (−x, −z, y). All coordinates in the spec are Unity space.
- Units: Metric, Unit Scale 1.0; apply rotation and scale.
- FBX export: Apply Scalings **FBX All**, Forward **−Z**, Up **Y**, Apply Unit on, Use Space Transform on, Apply Transform on, Smoothing **Face**, no animation, Embed Textures off.

**Key numbers:**
- **Vehicle:**
  - Origin on the ground, midway between the axles.
  - Wheelbase 2.65, track 1.55, wheel radius 0.31.
  - Body ≤ 4.45 × 1.80 (≤ 2.10 with mirrors) × 1.52, left-hand drive.
  - Hubs at (±0.775, 0.31, ±1.325).
  - Exact object names: ASSET_SPEC §1–2.
- **Cockpit:**
  - Eye (−0.37, 1.22, −0.30), vertical FOV 65°.
  - Steering wheel centered at (−0.37, 0.90, 0.12), tilted 22°, radius 0.19, with a 12 o'clock marker.
  - Cluster at (−0.37, 1.09, 0.47), tilted 12°; needle modeled pointing at 90 km/h.
  - Mirrors are quads facing the eye (rear 0.26 × 0.065, sides 0.16 × 0.10).
  - Wipers pivot at (−0.50 / 0.12, 1.00, 0.975), modeled pointing up the glass.
- **Town:**
  - Read `Assets/DrivingSim/Resources/Layouts/TestTownLayout.json`; plan in `Tools/asset-spec/test-town-plan.svg`.
  - Road y = 0, curb 0.15, sidewalks 3.0 m.
  - Main road 2 + 2 × 3.25 m; streets 1 + 1 × 3.0 m; curb returns R6.
  - Crosswalks 4 m deep with 0.45 m stripes and 0.45 m gaps; stop lines 0.45 m deep, 2 m before the crosswalk.
  - Signal heads ≥ 4.5 m, far side. Respect every `keepOut` zone.
- **Materials:**
  - URP Lit / Simple Lit / Unlit only, defined in `materials.json`.
  - Textures `T_<Name>_BaseMap | _Normal (OpenGL) | _Mask (R metal, G AO, A smooth) | _Emission`, PNG, power of two, ≤ 1024 (one 2048 cockpit atlas).
- **Naming:**
  - `SM_` FBX, `M_` materials, `T_` textures.
  - Object prefixes set layers: `Body_`, `Glass_`, `Wheel_`, `Lamp_`, `Interior_`, `Road_`, `Marking_`, `Sidewalk_`, `Curb_`, `Bldg_`, `Prop_`, `Tree_`, `Signal_`.
  - `_LOD0/1/2` for LODs, `_COL` for collision proxies.
- **Budgets:**
  - Exterior ≤ 30k / 10k / 3k triangles; interior ≤ 40k.
  - Building ≤ 3k / 800; signal head ≤ 1.5k.
  - Screen ≤ 150 draw calls and ≤ 300k triangles; ≤ 64 MB of textures.
- **Never:**
  - `.blend` files under `Assets/` (they break the Unity import and CI).
  - Files over 25 MB without asking.
  - Claims that something works in Unity: I verify and report.
