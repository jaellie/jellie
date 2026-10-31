# Pre-compile checks (no Unity needed)

Static checks used before the first real Unity compile. **They are not a compiler:** they catch syntax errors,
unknown type names and references to members that don't exist, but not overload resolution, Unity API
version differences or runtime behavior. Only a Unity compile (CI) verifies the code.

```
cd DrivingPracticeSimulator/Tools/precompile-check
npm install
node parse.js ../../Assets                 # C# syntax errors (tree-sitter grammar)
node types.js ../../Assets                 # type names not declared in the project or the known Unity/.NET list
python3 member_refs.py ../../Assets/DrivingSim UI/ TestBed/ World/ Flow/ Editor/   # member references on project types
```

## Run on 2026-10-31 (commit after dc9bd5f)
- `parse.js`: 106 files, **0 syntax errors**. A negative control (deliberately broken file) was flagged, so the
  check is working.
- `types.js`: 21 names outside the whitelist; all are real Unity/.NET types (`LODGroup`, `FileInfo`, `JointSpring`,
  `InputDeviceChange`, …) or tuple element names. The files that use them have the needed `using` directives.
- `member_refs.py`: 14 flags; each was checked by hand and exists (the parser misses comma-separated constants, tuple
  return types and members after nested types). **No missing members.**
- Fixed while reviewing: `CabinStyle` had a method named `Rect` and a color named `Text`, which would have hidden the
  `Rect` and `Text` types inside that class; the EditMode test assembly lacked a reference to `DrivingSim.Runtime`.

## Remaining compile risks (need Unity)
- URP 17 API details used by `ProjectConfigurator` (property setters on `UniversalRenderPipelineAsset`,
  `QualitySettings.renderPipeline`).
- `PlayerSettings.Android.minSdkVersion` set through an enum cast.
- Codex's `AutomotiveUIPresentationTests` (reflection-based) against the rewritten HUD.
- Editor-time scene generation (components added in Edit Mode, serialized references).
