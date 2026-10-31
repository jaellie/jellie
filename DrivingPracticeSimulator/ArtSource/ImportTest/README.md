# Step 1 — import-proof kit only

Specification: `ASSET_SPEC.md` v1, gameplay source commit `6939f97fb0e3e3604444250c8472453bb990f4b9`.
Branch: `codex/3d-environment`, fast-forwarded from Claude's branch before creating this kit. Delivery base: `63ff14cbe84ae19a0b554b5b1e34e464506ca526`; the two later source commits change only the UI prototype, not ASSET_SPEC or the art importer. Those updates are retained unchanged.

**STOP GATE: Unity import/validation has NOT run here. Claude must import, validate and report before any detailed cockpit or town work starts.**

## Delivered files

Under `Assets/DrivingSim/Art/ImportTest/`:
- `IT_Calibration.fbx`: 6 meshes and 5 empty anchors; no cameras, lights, rigs, animation or collision proxies.
- `T_IT_Checker_BaseMap.png`: RGB, 1024x1024, sRGB. Checker, cell coordinates, +U/right, +V/up and asymmetric origin/corner labels.
- `T_IT_Checker_Normal.png`: RGB, 1024x1024, linear OpenGL (+Y) tangent normals. UV-direction labels are encoded as shallow embossed relief, not invalid white text painted into a normal map.
- `T_IT_Checker_Mask.png`: RGBA, 1024x1024, linear. R metallic (0/64), G AO (255/230), B unused=0, A smoothness (64/180; relief lettering 245). No channels are repurposed as albedo.

Under `Assets/DrivingSim/Art/Materials/`:
- `materials.json`: `M_IT_Checker` = lit, opaque, all three maps; `M_IT_Marker` = unlit, opaque orange, no texture maps. Paths are relative to Art/. Scalar smoothness/metallic are 1 for checker-map diagnostics, allowing map channels to define them.

Under `ArtSource/ImportTest/`:
- `IT_Calibration.blend`: editable, compressed Blender 4.3.2 source, with relative texture links. No `.blend` is placed under Assets/.
- `generate_textures.py`: diagnostic texture/manifest reproduction (Python, Pillow, NumPy; development only).
- `build_import_test.py`: Blender-only geometry/source/export reproduction using the exact approved FBX recipe. This is art-source tooling, not Unity/gameplay code.
- `validate_import_test.py`: Blender-only source reopen and FBX reimport verification.
- `source-report.json`: source transforms, bounds, UVs, material slots, triangle counts and export flags.
- `blender-validation.json`: observed Blender reopen/reimport results; explicitly NOT Unity validation.
- `delivery-report.json`: output dimensions/modes, normal/mask checks, file sizes and SHA256 values.

No `.mat`, Unity scene, prefab, C# file, Unity settings, packages, UI or localization changes. No `.meta` import settings are authored: Claude's Unity importer generates/owns those.

## Coordinates and geometry

Unity-space values below are **expectations from the specification**, not measurements from Unity.
Blender = (-Unity.x, -Unity.z, Unity.y); vehicle faces Blender -Y; left/driver side is Blender +X.
Metric, unit scale 1.0; mesh rotation/scale applied; translations preserve the required origins.

| Object | Unity expectation | Triangles / notes |
|---|---|---|
| IT_Cube_1m | origin (0,0,0), bounds center (0,0.5,0), size (1,1,1) | 12, hard edges, full 0..1 UV square on each face, M_IT_Checker |
| IT_Nose | center (0,0.5,2), size 0.1 m | 12, M_IT_Marker |
| IT_Left | center (-1,0.5,0), size 0.1 m | 12, M_IT_Marker |
| IT_Up | center (0,2,0), size 0.1 m | 12, M_IT_Marker |
| DriverEye | (-0.37,1.22,-0.30) | empty |
| SteeringWheelPivot | (-0.37,0.90,0.12) | empty |
| Mirror_Rear | (0,1.40,0.62) | empty |
| Mirror_Left | (-1,1.02,0.55) | empty |
| Mirror_Right | (1,1.02,0.55) | empty |
| IT_LODTest_LOD0 | sphere center (2,0.75,0), diameter 1 m | 1,984, M_IT_Checker |
| IT_LODTest_LOD1 | same center/diameter as LOD0 | 480, M_IT_Checker |

The LOD meshes intentionally occupy the same space as **alternative named siblings**, per the requested LOD test. Both are present in Blender and may overlap if displayed together. No Unity LODGroup or prefab was authored; automatic LODGroup creation must be checked in Unity. Total when counting both alternatives and all markers: **2,512 triangles**; unique materials: **2**.

## FBX export flags

- Selected objects: MESH + EMPTY only; Apply Scalings `FBX_SCALE_ALL`; global scale 1.
- Forward -Z, Up Y; Apply Unit=true; Use Space Transform=true; Apply Transform (`bake_space_transform`)=true.
- Apply Modifiers=true; triangulation applied in source and export; Smoothing FACE; Tangent Space=false.
- Animation=false; no armatures/leaf bones; custom properties=false.
- Path Mode AUTO, Embed Textures=false. Source textures are external and relative.

## Reproduce

From the project root, with Blender 4.3.2 and the delivered folder structure:

```sh
python ArtSource/ImportTest/generate_textures.py --font /path/to/DejaVuSans-Bold.ttf
blender --background --factory-startup --python-exit-code 1 --python ArtSource/ImportTest/build_import_test.py
blender --background --factory-startup --python-exit-code 1 --python ArtSource/ImportTest/validate_import_test.py
```

The raster font used for the delivered textures was DejaVu Sans Bold, SHA256 `a4c5bc453ca281d90ea079e596da7ae0dfeb5777497c29ec254e76d97ff6f890`. The font itself is not distributed. PNGs contain rendered glyphs only. Geometry/UV/export recipe is reproducible; Blender metadata/timestamps may change binary file hashes on a later export. Scripts resolve project paths from their own location, not from a machine-specific project path.

## Verification actually performed

- Reopened the saved `.blend` in Blender 4.3.2.
- Checked metric settings, applied rotation/scale, expected object names/types, bottom-center cube origin, marker/anchor positions, bounds and UVs.
- Checked the exact mesh triangle counts and material-slot names.
- Imported the exported binary FBX 7400 back into a fresh Blender scene and checked object set, global origins/bounds, counts, UVs and slots against the source, with 0.00001 m tolerance.
- Checked 1024-square 8-bit PNG data, tangent-normal vectors, mask channel values, relative manifest paths and matching slots.
- Checked no `.blend` under Assets, no files over 25 MB, and changes restricted to the allowed Art/ and ArtSource/ paths.

**Not performed:** Unity 6000.0.85f1 import, ArtImportValidator, ArtImportTestKitTests, automatic LODGroup creation, URP material generation/remapping, Android runtime/performance. A Blender FBX round trip does not emulate Unity's importer and does not establish a Unity pass.

## Claude's next action, then report back

1. On a separately authorized integration/review checkout, import this kit using the existing art postprocessor.
2. Run **DrivingSim → Art → Build Materials From Manifest**.
3. Run **DrivingSim → Art → Remap Model Materials**.
4. Run **DrivingSim → Art → Validate Import Test**, plus **ArtImportTestKitTests**.
5. Inspect +U/+V orientation, normal relief, mask behavior and marker handedness in Unity.
6. Report actual results/logs, especially fileScale/root transform, anchor tolerance, materials and LODGroup count.

If anything fails, fix the asset/export contract with evidence before detailed work. Do not compensate by silently moving gameplay anchors or changing physics, settings or importer code in this asset branch. No merge into main is approved.
