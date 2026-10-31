# Stage 1 blockout revision — short report

- Cockpit: **5,246 triangles, 6 materials**. Exact child binding names, eye/wheel/mirror anchors retained; .19 m outer wheel radius and .032 m grip. Flat sculpted dashboard, open twin-dial hood, visors, door/window/mirror structures. Preview wipers rest at the cowl; FBX retains the required binding reference.
- X0: **5,714 triangles, 17 materials**, 60 m approaches, eleven buildings, eight tree masses, four streetlights, four parked car/SUV props and one blue parked bus. All parked props are outside carriageways and keep-outs.
- **No textures or LODs.** Texture sizes: none. No scenes/prefabs/code/settings/layout/collision changes. All new or revised content is within Art/ and ArtSource/.
- Layout: exact upstream JSON snapshot; R6 corners, .15 m curb height, 3 m walks, source zebra/stop/lane positions and dash phase. Blender FBX round trip, pivots, bounds, UVs, flat material slots, eye clearance and projected decoration keep-outs checked.
- Renders: actual Blender geometry from the exact seated eye/FOV plus street corner and overview. **Not Unity screenshots.** No live displays/mirrors/UI/signal states are simulated.
- Open contract conflicts: fixed pillar points cannot reach both screen edges at the fixed wide view; closed roof remains visible; speed anchor is left despite the requested right-speed arrangement; mirror width exceeds the specified outer envelope. See HANDOFF.md and validation-report.json for measurements. None is hidden by moving the camera or changing physics.
- Stage 2 is **not started**: exterior sedan/wheel, textures/atlases/dial numerals/Korean lettering, final modular signal files, collision proxies, detailed street kit and LODs remain pending Claude's import PASS.
- Preferred Unity look: sun about 50 degrees elevation, warm white ~5500 K, clear blue sky, soft shadows, restrained distance fog. This is a recommendation only; no Unity lighting setting was changed.

See HANDOFF.md for integration, binding-map.json for child transforms, CREDITS.md one directory above for sources, asset-report.json for exact per-object counts, and delivery-report.json for the file list/hashes. Unity import/compile/runtime/APK and Android performance **NOT RUN** here. Stop after this Stage 1 delivery and wait for Claude.
