# BO vertical slice — provisional, Blender-checked, NOT Unity-verified

Two real FBX exports, two editable Blender sources, flat Simple Lit colors only. **No textures, LODs, `.mat` files, scenes, prefabs, collisions, Unity code, UI or settings changes.** All new deliverables are in `Assets/DrivingSim/Art/Blockout/` and `ArtSource/Blockout/`. Delete those directories to remove this pass; no gameplay migration is needed. The previous unpublished textured draft is not part of this delivery.

## Contents / scale

- `SM_BO_Cockpit.fbx`: dashboard/cluster, 22° wheel, seats/headrests, front door panels, windshield/side glazing, .052 m A-pillars and .050 m B-pillars, roof frame, mirrors, console and required wiper/needle attachment geometry. Five `BO_` anchor empties include the exact driver eye and mirror centers. This is a cockpit only; retain the gameplay car's exterior placeholders.
- `SM_BO_Intersection.fbx`: X0, approximately 40 m of each approach, eight simple mixed-use building masses, four streetlights, four narrow trees and four far-side signal assemblies. All environment meshes use **world coordinates, origin zero**, so place once at identity. Signals contain separate all-off lenses; live states remain gameplay-owned. Korean road character comes from the authoritative 2+2 / 1+1 lanes, double-yellow center line, zebra crossings and horizontal signal heads. Shop labels and facade detail are intentionally absent until Unity PASS.
- `materials.json`: **blockout-only** flat-color manifest. Every entry is `simplelit`; all texture fields are empty. The eight cockpit materials and fourteen town materials are separate. This deliberately does **not** edit `Art/Materials/materials.json`.
- `BO_Cockpit.blend`, `BO_Intersection.blend`: same editable meshes with visibility set for each group, metric units, unit scale 1, applied rotation/scale. No cameras/lights in the sources or FBX files. Build script exports only the corresponding group, not both together.
- `asset-report.json`: exact per-mesh triangle counts, origins and material slots. `validation-report.json`: source/FBX round-trip results, dimensions/pivots, road facing, keep-out checks, driver-eye clearance and sampled sightlines.

## Integration — Claude owns these steps

1. Apply/cherry-pick the blockout-only commit onto the current gameplay checkout. Do not replace gameplay with the older art branch. Preserve `codex/ui-visual-polish` at `1c3a9b829a5fbd88b487ee916eefb3f44da5d5f0`; neither it nor the gameplay branch is edited by this delivery.
2. The current Unity material builder reads **`Art/Materials/materials.json`**, not the blockout subdirectory. Claude must append the `M_BO_*` entries to that canonical manifest (names are unique) and run **Build Materials From Manifest / Remap Model Materials**. This handoff keeps the user-required blockout directory isolation and does not change the importer. Generated `.mat` files belong to Claude.
3. Parent cockpit at the existing vehicle root with local identity; place intersection at world identity. Disable overlapping placeholder renderers, retaining authoritative road/vehicle colliders and logic. Every object is prefixed `BO_`, including `BO_SteeringWheel`, `BO_Cluster_Needle` and `BO_MirrorGlass_*`. The current name-based importer does **not** recognize that prefix: Claude must assign layers and bind these named transforms explicitly. `M_BO_Display` and `M_BO_Mirror` are neutral placeholders; use existing live display/mirror systems during integration.
4. Wheel origin `(-.37,.90,.12)`, radius .19, plane normal `(0,-sin22°,cos22°)`; eye `(-.37,1.22,-.30)`; cluster, needle, mirror and wiper anchors match ASSET_SPEC §2. Needle is at the required 90 km/h reference pose; wipers point up the glass for binding, **not** the gameplay resting pose. Connect existing animations/states, never derive new driving logic from the art.
5. Signal meshes are already placed/oriented from layout positions/approaches, with head bottoms at 4.56 m. Bind `BO_Signal_SIG_X0_<approach>_<red|yellow|left_arrow|green>` to existing signal state; no phase or timing changes. No extra signal prefabs are included.
6. Run the existing Unity import-test validator and verify these new files in Unity 6000.0.85f1. Then compile, test controls/P/R/N/D with Cabin Light UI and build/test Android. This delivery claims none of those results. Keep replacement visuals reversible until Unity reports PASS.

## Driver-eye review and open proportion issues

`Previews/BO_DriverEye.png` is a **Blender render of these actual flat meshes**, at the exact local eye, 65° vertical FOV, 4° down, 20:9 landscape. The car is staged 35 m south of X0 in the outer lane **only in memory for this render**. `BO_Intersection_Overview.png` is a Blender overview of the same environment. No UI, live mirrors, signals or Unity rendering is simulated.

Ray checks in `validation-report.json` sample wheel/cluster, mirror centers, stop line, crosswalks, road and the northbound signal from this seated eye. These are geometric samples, **not a guarantee of whole-screen usability**. The upper wheel rim is visible; its center sits just below the bottom of the default 65° view. The right mirror lies outside the straight-ahead 20:9 view and needs the existing head-look feature. A closer approach check records the near-crosswalk masking caused by the specified high cluster, so Claude can assess it in the running cockpit before coordinating any anchor/size change. No anchor was lowered or moved to hide that issue.

**Contract conflict:** aiming the exact left mirror quad (.16 m wide at x=-1.00) at the exact eye slightly exceeds x=-1.05; the provisional housing extends farther. Thus the fixed quad/eye geometry and total exterior width ≤2.10 m cannot all be met simultaneously. This pass preserves the required quad/eye attachments. Claude should resolve that visual envelope before exterior art is accepted; vehicle collision is untouched.

**Spawn:** the unchanged default spawn z=-80 lies outside this user-requested ±40 m visual slice. Claude must retain the existing wider procedural world, or choose a nearer test spawn in its own integration work. This art supplies no new spawn, barrier, collider or route limit.

## Reproduce / changes

Only **Blender 4.3.2** and its bundled Python modules are needed. From this folder:

```
blender -b --factory-startup --python-exit-code 1 --python build_blockout.py
blender -b --factory-startup --python-exit-code 1 --python validate_blockout.py
blender -b --factory-startup --python-exit-code 1 --python render_blockout.py -- driver
blender -b --factory-startup --python-exit-code 1 --python render_blockout.py -- overview
```

FBX uses the agreed import-kit recipe: FBX All scaling, -Z forward/Y up, Apply Unit/Space Transform/Apply Transform on, Face smoothing, triangulated, no animation, no embedded files, **Path Mode Strip**. Blender importer metadata may reconstruct a pre-rotation; validation compares world geometry, not that internal rotation representation. There are no texture references.

`TestTownLayout.reference.json` is a build snapshot of the authoritative layout from `f80c00d8e63e30745a1e6af5cfe52c46da1b6356` (unchanged when rechecked at `e11f0127cc6dfea18d45a505527c74d65728cf28`); it is never imported by Unity and never replaces the gameplay JSON. Road widths, .15 m curbs, 3 m walks, R6 returns, crosswalks, stop lines and line dash phases are preserved. Provisional art changes: basic A/B-pillar and mirror-housing fit, flat colors, eight massing buildings, ±40 m clipping, explicit `BO_` names. No detailed modeling/texturing/LOD production is included. `delivery-report.json` lists every delivered file and hash.
