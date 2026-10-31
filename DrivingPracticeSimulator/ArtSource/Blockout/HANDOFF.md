# Stage 1 revision — cockpit and Korean X0 vertical slice

**Provisional flat geometry. Blender checks only. Unity import/compile/runtime/APK NOT verified. Stop here until Claude reports PASS for the import kit and this blockout.**

The art branch was updated from gameplay commit `448695c49605d26f2511583af7573c782c802251` in sync commit `9f4a18e65ad902d6258170d236e42d44235e4ca2`. The subsequent art revision changes only `Assets/DrivingSim/Art/**` and `ArtSource/**`. No gameplay, UI, scene, prefab, layout, collision setup, package or settings changes are authored. The previous UI branch remains preserved.

## Actual delivery

| File/group | Implemented now |
|---|---|
| `Art/Blockout/SM_BO_Cockpit.fbx` | Continuous full-width dash/windshield/door frames, A/B trims, roof and visors, outside mirror housings/sails, curved top pad and open cluster eyebrow, blank center screen/vent/control shapes, console, seats/headrests, 3-spoke wheel with .19 m outer radius/.032 m grip, two dial/needle geometries, separate glass/display/mirror surfaces |
| `Art/Blockout/SM_BO_Intersection.fbx` | X0 plus 60 m approaches, .15 m curbs/3 m walks/R6 returns, source crosswalks/lines, eight 6–8-storey commercial masses and three 13–15-floor apartment masses, eight deciduous tree masses, four streetlights, four parked car/SUV props and one blue parked bus, four all-off signal assemblies |
| `Art/Blockout/materials.json` | Flat Simple Lit definitions, no maps; six cockpit materials, seventeen town materials in use. Required `M_MirrorGlass` and `M_ClusterDisplay` slots preserved |
| `ArtSource/Blockout/BO_*.blend` | Two editable metric sources. They include the same geometry with group visibility set; use the script's selections when exporting |
| `Previews/BO_DriverEye.png` | Actual source geometry, eye `(-.37,1.22,-.30)`, vertical FOV 65° (asserted against Blender's projection), pitch 4° down, aspect 20:9. Car staged 35 m south of X0 for inspection only |
| `Previews/BO_StreetCorner.png`, `BO_Intersection_Overview.png` | Actual geometry at pedestrian street-corner height and an overview. All images are Blender renders, **not Unity screenshots** |

`asset-report.json` records exact counts/objects/pivots/materials. `validation-report.json` records the actual checks and sightline results. `delivery-report.json` lists files/hashes. **Texture sizes: none — zero texture assets, zero image texture nodes, zero LODs.** PNGs are review renders in ArtSource, not imported textures. See `ArtSource/CREDITS.md`: all asset content is original; supplied reference photos are mood/proportion references only and are not included.

## Integration

1. Use the revision commit on `codex/3d-environment`; do not replace current gameplay with a checkout of the art branch. Claude owns integration and any merge decision. No merge into main or gameplay is performed by this delivery.
2. Import the FBXs into Unity 6000.0.85f1 and run the existing import-test validator. The material builder currently reads **`Art/Materials/materials.json`**: Claude must append the isolated blockout manifest entries there, preserving existing entries, then run **Build Materials From Manifest** / **Remap Model Materials**. No `.mat` files are shipped. Flat palette values are supplied in linear shader space from the source sRGB palette.
3. Attach cockpit at the existing vehicle root, local identity. Place the intersection at layout origin, identity. Hide overlapping placeholder visuals while retaining authoritative colliders. The smaller slice still does not cover the default spawn z=-80: retain the existing wider world or choose a nearer integration test spawn in Claude's own scene work.
4. Stage 1 keeps **BO_ filenames, BO_ root containers and BO_ mesh-data names**, while child transform names are **binding-exact**: `Interior_*`, `Glass_Interior`, `SteeringWheel`, `Cluster_Needle_Speed/Tach`, `Cluster_Display`, `MirrorGlass_*`. This reconciles blockout isolation with the brief's hard requirement for exact gameplay object names. Bind by `binding-map.json`; no prefix stripping or C# change is needed. Claude must still ensure cockpit-only visibility for glass/mirrors/dash lamps, since the current layer-prefix rules do not uniformly classify these as cockpit interior.
5. FBX wipers **retain the upright binding reference required by ASSET_SPEC**. Blender inspection applies the existing -85° rest to show them along the cowl. Do not bake that rest twice. Driver renders and sightline rays use the same in-memory posed wipers; saved mesh/source transforms remain applied. The cowl lip conceals most of the resting blade geometry. Claude verifies the actual rotation sign and resting view in Unity.
6. Signal meshes are static, all off. Existing gameplay must drive them. Stage 1 includes world-placed visual assemblies; the final canonical modular head/pole files with `Lamp_Red/Yellow/LeftArrow/Green` children and head-center pivots are **Stage 2, not claimed delivered here**. Keep current gameplay signals/colliders until their replacement is explicitly bound; avoid overlapping renderer sets.

## Checks, corrections and binding conflicts

The Blender checks reopen/reimport the real FBXs and compare object names, pivots, world bounds, triangle counts, UV presence, material names and source transforms. Additional checks cover wheel outer radius, eye clearance, dash height, roof clearance, upward road faces, eleven buildings, and projected decoration triangles against every layout keep-out polygon. Parked vehicles/bus are on private forecourts outside all carriageways and sight triangles; they are not traffic actors. No road geometry or lane position is changed. Building/curb collision proxies are deferred; no new collision boundaries are introduced in this pass.

Corrections from v1: joined the windshield corners to real door/roof frames; used the brief's A-pillar endpoints and .054 m trim width; added B trims/visors; raised the headliner within the 1.52 m envelope; put mirrors outside side glazing; opened the cluster hood; formed the dashboard/center stack; made the rim .032 m thick with spokes/hub/button masses; added second needle/dial geometry; extended clipped approaches 40→60 m, added three apartment masses and original parked props. The blank emblem carries no brand. Instrument numerals/faces, Korean sign lettering, textured road wear/pavers, detailed exterior sedan/wheel assets, full street kit, proxies and LODs all remain Stage 2.

**Do not mistake preserved bindings for resolved design conflicts:**

- The fixed eye and specified pillar points put the left A-pillar around **-17° to -19° yaw**, inside a roughly ±55° horizontal view. It cannot be at the outer screen edge without revising the cabin/eye/point contract. It is now physically continuous, raked and thin; its angular position is reported rather than hidden by moving the camera.
- A closed roof at y≈1.50 with the specified forward header/mirror attachment still occupies an upper strip of the 65° view. Clearance passes, but the requested near-invisible roof band is **not fully achieved**. Changing it further requires coordinated header/eye/mirror proportions; no cutaway roof or hidden geometry is used to fake the preview.
- The binding spec fixes speed at **x=-.45** (left); the brief requests right-speed/left-tach. This pass preserves the speed pivot and adds the provisional tach at **(-.13,1.091,.464)**. Display remains **(-.29,1.09,.47)**. The visual cluster backing is widened to .48 m around the two dial/display surfaces while `Cluster_Panel` origin remains the specified (-.37,1.09,.47). **Claude must review this layout/pivot conflict before Stage 2**, rather than assume the requested right-speed arrangement is complete.
- The driver-facing .16 m left mirror quad at x=-1.00 already extends slightly past x=-1.05; its housing extends farther. That fixed quad/eye requirement conflicts with the 2.10 m exterior mirror-width envelope. No collision is enlarged to match it.
- The right mirror needs the existing head-look feature; the wheel center is just below the straight-ahead frame, with the upper rim visible. The report also samples the close-crosswalk view, where the cluster can mask nearby pavement. These are review findings, not Unity usability passes.

## Reproduce / lighting note

Blender 4.3.2 only; no extra packages/fonts or runtime dependencies. From this folder run Blender headless with `--python-exit-code 1 --python build_blockout.py`, then `validate_blockout.py`. Render with `render_blockout.py -- driver`, `-- corner` or `-- overview`. All source rotation/scale are applied; FBX uses FBX All scaling, -Z forward/Y up, Apply Unit/Space Transform/Apply Transform, Face smoothing, triangulation, no animation/embedded textures, **Path Mode Strip**. Only the wiper review pose is applied transiently in inspection scripts.

Read-only layout/spec snapshots record upstream commit `448695c...`; they are not replacement Unity inputs. Road meshes follow the layout's polygons, crosswalk extents, .15 m line widths, .45 m stop lines, .45/.45 m zebra cadence and source dash phase. They add no other intersection or road.

Suggested Unity presentation for Claude: sun elevation about **50°**, warm-white **~5500 K**, clear blue sky, soft shadows, restrained distance fog. Do not add realtime lights or postprocessing to copy a Blender preview; measure Android before adjusting the agreed renderer. Preview cameras/lights are not saved in the sources or FBX. This is an art suggestion, **not a project-settings change or verified Unity look**.
