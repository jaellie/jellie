# Import test report: Codex `codex/3d-environment` @ e8ed2d1

Date 2026-10-31 · Reviewer: Claude · Codex branch **not merged**.

## Unity-side validation: BLOCKED
Unity has never run for this project: the CI secrets `UNITY_EMAIL` / `UNITY_PASSWORD` are not set
(every "Unity CI" run so far took the skip path), and this environment has no Unity Editor.

| Requested check | Result |
|---|---|
| 1. Build Materials From Manifest | **BLOCKED** |
| 2. Remap Model Materials | **BLOCKED** |
| 3. Validate Import Test | **BLOCKED** |
| 4. `ArtImportTestKitTests` | **BLOCKED** |
| Unity import warnings, URP shader compile for Android | **BLOCKED** |

## Static pre-check (done; not a substitute for Unity)
FBX binary read with `Tools/asset-spec/fbx_static_check.py`, which applies the same axis and unit conversion Unity uses.
File hash `dfabb3d3…` matches Codex's delivery report.

| Check | Result | Evidence |
|---|---|---|
| Scale | PASS | FBX 7.4, UnitScaleFactor 100 (cm) → fileScale 1.0; `IT_Cube_1m` 1.000 × 1.000 × 1.000 m |
| Forward axis | PASS | `IT_Nose` center (0, 0.5, +2.0) |
| Handedness | PASS | `IT_Left` center (−1.0, 0.5, 0) |
| Up axis | PASS | `IT_Up` center (0, 2.0, 0) |
| Pivots and transforms | PASS | cube origin at its bottom center; every object rotation 0, scale 1 |
| Anchors | PASS | DriverEye (−0.37, 1.22, −0.30), SteeringWheelPivot (−0.37, 0.90, 0.12), Mirror_Rear (0, 1.40, 0.62), Mirror_Left (−1.0, 1.02, 0.55), Mirror_Right (1.0, 1.02, 0.55): exact |
| Normals and winding | PASS | outward on all 6 meshes |
| Triangles and LODs | PASS | cube 12; `IT_LODTest_LOD0` 1984; `_LOD1` 480 (sibling naming for the automatic LODGroup) |
| Material slots | PASS | cube and LOD meshes `M_IT_Checker`; markers `M_IT_Marker` |
| Textures | PASS | three 1024² PNGs; normal map flat (128,128,255); mask R metallic, G AO, A smoothness |
| Manifest | PASS | `materials.json` matches `ArtMaterialBuilder` fields; `lit` and `unlit` are URP shaders |
| Forbidden content | PASS | no cameras, lights, colliders or embedded textures; no `.blend` under `Assets/` |
| Ownership | PASS | only `Assets/DrivingSim/Art/**` and `ArtSource/**` changed |

## Notes for Codex (no fixes required)
- FBX texture nodes keep an absolute path from your machine (`/workspace/3d-import-proof/...`). It's harmless, because
  Unity uses the relative name. For later batches, export with Path Mode = Strip or Relative.
- `M_IT_Checker` uses `metallic: 1.0, smoothness: 1.0` together with a mask map. In URP Lit the mask overrides
  metallic, and smoothness multiplies the mask's alpha, so 1.0 is the right choice. ASSET_SPEC §4 now states this.

## URP Mobile compatibility
Expected compatible: URP Lit and Unlit, opaque, 1024² textures with ASTC 6×6 set on import. **Unconfirmed until Unity imports it.**

## Can Codex proceed?
- **Blockout: yes.** Simple-shape cockpit and intersection blockout aligned to ASSET_SPEC §1–3 and `TestTownLayout.json`.
  Cheap to redo if Unity shows a problem.
- **Detailed modeling, texturing, LODs: not yet.** The gate in ASSET_SPEC §8 is a Unity PASS.
