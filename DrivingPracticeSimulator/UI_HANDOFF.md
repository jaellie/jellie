# Automotive UI handoff — codex/ui-visual-polish

Base: `jaellie/jellie`, commit `69692dff2d341a942d9ef6a22dd9b3bb7a67c853`.
Scope approved: Minimal Automotive driving HUD × Premium Simulation menus; Korean/English wording and fonts.
**Status: C# and assets implemented; Unity compilation, PlayMode behavior and Android behavior are unverified.**

No merges. No city/environment redesign, road generation, AI traffic, scene loader or mission execution.

### Concurrent gameplay update observed before publication

Claude's branch advanced to `c143105c93925de9c318630bba463aeae3a12fb1` after this feature's agreed base. That commit changes StartupFlow, DisclaimerService, LocalizationService, adds StartupFlow tests and updates planning docs. This feature does not merge or revert those changes: it remains based on `69692df`, and its diff does not modify those protected files. Preserve Claude's newer changes during a separately approved integration. INTEGRATION.md and PROGRESS.md are overlapping documentation edits to reconcile; the newer ROADMAP.md is untouched here.

The newer contract plans MapDefinition/MapCatalog/IMapSelectionView and canonical map/mode/mission namespaces. They are not implemented yet. This UI's DTOs and user-approved menu/environments keys are presentation handoff proposals, not replacements for that future gameplay API; Claude should adapt/review the catalog interface and final map labels. The isolated preview's sample catalog is illustrative and deliberately unavailable.
The route diagram is a 2D menu illustration, not new road geometry or RoadNetwork data.

## Implemented presentation

- Midnight navy surfaces, ice-blue menu actions and selected details, teal progress/confirmation. Active gears stay blue; engaged parking brake stays red.
- Style A HUD: speed/gear low left, compact mini-map, centered signal controls, quieter fixed steering indicator, custom accessory/camera/pause icons. Existing lamps, input-status strings, navigation placeholder, touch pedals, held glance and FOV controls remain.
- Style B main menu, settings, multiple-environment catalog, and separate Free Driving / Missions selection.
- Catalog and mission rows scroll; absent/unavailable content cannot launch, and Missions never falls back to Free Driving.
- Host launch requests are debounced until the host accepts or rejects them. The menu keeps its input blocker until explicitly hidden.
- New startup presentation keeps the existing public placeholder class/factory names for compatibility with unmodified StartupFlow. Both implement the existing interfaces. They use explicit, mutually exclusive, once-per-Show callbacks. Required notice has no close/cancel/outside-tap action; review has close only.
- Pedal wizard: wider presentation, scrollable key review and warnings, safe-area fitting. Capture, analysis, validation, safety and save methods are unchanged.
- Canvas factories now add SafeAreaFitter **after** parenting/stretching; this preserves its initial anchors. SafeAreaFitter itself is unchanged.
- Landscape frames and modal cards fit inside safe areas and update on resize. Steering indicator stays in full-screen coordinates and remains non-blocking.

## Modified existing files

| File under Assets/DrivingSim | Change |
|---|---|
| Runtime/UI/HudTheme.cs | Palette, iceBlue token, resource-backed default theme/font, sprite slots, text/button presentation helpers; adds the missing UnityEngine.UI import |
| Runtime/UI/DrivingHUDController.cs | Build/layout/icon presentation, pause modal canvas, safe-area factory initialization; steering indicator opacity only |
| Runtime/UI/CameraControlsOverlay.cs | Theme font/icons, landscape frame, safe-area initialization, label fitting; camera callbacks unchanged |
| Runtime/UI/PedalCalibrationWizard.cs | Only Build and Block layout helper changed |
| Runtime/UI/PlaceholderStartupViews.cs | Shared startup typography helper; view implementations split into matching filenames |
| Resources/Localization/strings.json | Existing wording refinements and 34 approved additive keys; original 143 keys and both notice bodies preserved |

Also appended a UI status section/change-log entry to PROGRESS.md and an integration appendix to INTEGRATION.md.
`Tools/ui-design/changed-files.txt` lists every changed/new file including metadata.

## New code and assets

- `Runtime/UI/PlaceholderLanguageView.cs` and `PlaceholderDisclaimerView.cs`: designed startup implementations, split into matching MonoBehaviour filenames; public types/factories remain unchanged.
- `Runtime/UI/AutomotiveLayout.cs`: safe-area presentation fitting, full-screen modal shield, primary/button decoration, scrollable copy.
- `Runtime/UI/PracticeMenuContent.cs`: presentation DTOs and typed launch request; no gameplay behavior.
- `Runtime/UI/PracticeMenuView.cs`: menu/settings/catalog/mode view; host events only.
- `Runtime/UI/PracticeMenuPreviewHost.cs`: isolated runtime review harness; all environments/missions deliberately unavailable.
- `Editor/PracticeMenuPreviewMenu.cs`: creates an **unsaved** UI review scene. Does not change the physics scene or Build Settings.
- `Tests/PlayMode/AutomotiveUIPresentationTests.cs`: six tests written, not run (font/theme import, notice required/review, language callbacks, unavailable/debounced launches, landscape fitting). Tests construct real uGUI pointer objects through reflection so the existing test asmdef needs no new direct UI reference.
- `Resources/UI/MidnightTheme.asset`: automatically used by HudTheme.Default; ScriptableObject asset with stable source/font/sprite GUIDs.
- `Resources/UI/Fonts/JellieUI-Regular.otf`: static, renamed OFL derivative of the Korean face from Noto Sans CJK Regular. ~1.9 MB. Includes all 11,172 modern Hangul syllables, Jamo, Latin and current UI symbols. FontStyle.Bold uses Unity synthesis. `OFL.txt` retains license/attribution. Other CJK writing systems are outside this font subset.
- `Resources/UI/Sprites/*.png`: ten original monochrome assets: Panel, Circle, TurnLeft, TurnRight, CarMarker, Pause, Camera, Headlights, Hazard, Wipers. Panel is nine-sliced; other assets are tintable sprites.
- `Resources/UI/EnvironmentDiagram.png`: original decorative diagram for isolated menu preview only. A real host supplies its own environment thumbnails.
- Metadata is included for new assets and HudTheme.cs, whose GUID is referenced by the new theme.

Dependencies: existing uGUI/Input System/Unity test assemblies only. **No package-manifest, asmdef or CI changes.** No TMP, SVG runtime package, blur shader or new network/runtime dependency. Pillow and fontTools are optional developer tools for regenerating/checking assets and static illustrations, not Unity/build dependencies.

## Review in Unity (not yet performed)

1. Import this feature branch into the existing Unity **6000.0.85f1** project and compile. Report actual errors; no successful compilation is claimed here.
2. For driving HUD: use the existing **DrivingSim → Create Physics Test Scene** action after saving any manual scene edits. The existing generator overwrites its generated test scene by design; this UI change does not alter that generator.
3. For menus: **DrivingSim → UI → Preview Automotive Menus**, then Play. It prompts to save the current scene and opens an unsaved, isolated UI scene with no driving rig. Language and required notice may appear first; saved choices are respected. Every launch action is disabled in this harness.
4. Use existing pause-menu language/notice entry points to verify review mode and immediate language changes. Check all calibration states, long warnings and key lists without changing calibration parameters.
5. Run existing EditMode and PlayMode baseline suites plus `AutomotiveUIPresentationTests`. CI is unchanged and currently targets Claude's source branch; publishing this feature branch does not prove it ran Unity.
6. Check 1280×720, 1920×1080, 2400×1080 and both landscape orientations with notch/navigation insets. Verify glyphs, long English labels, scroll access, safe-area changes, first-frame anchors and modal shielding.
7. On Android verify actual touch targets (48dp goal), text readability, held pedal + gear + steering combinations, middle mouse routing where applicable and performance. Reference-unit fitting alone does not verify dp sizes; device/density validation is still needed.

## Gameplay integration (Claude review required; not wired into the driving rig)

Create the menu **at runtime**, with an existing EventSystem and the existing StartupFlow:

```csharp
PracticeMenuView menu = PracticeMenuView.Create(startupFlow);
menu.SetCatalog(gameplayCatalogAsPresentationOptions);
menu.LaunchRequested += request =>
{
    // Gameplay owner must validate ID/mode/availability and perform its existing loading flow.
    // On acceptance, call menu.Hide() at the appropriate point in that flow.
    // On rejection/failure, call menu.ClearLaunchPending() and present localized feedback.
};
menu.PedalSetupRequested += calibration.Open;
menu.ShowHome();
```

`SetCatalog` takes `PracticeEnvironmentOption` records: stable id, titleKey, descriptionKey, detailsKey, optional preview Texture, available, freeDrivingAvailable, mission records. Each mission has id/titleKey/descriptionKey/available. Keys must exist in strings.json. No scene names are assumed. Re-submit the catalog when availability changes.

Menu rendering uses the current language; LanguageChanged rebuilds visible text while preserving environment/mode selection. Locale persistence stays with LocalizationService. Show blocks driving and keyboard shortcuts using the existing gate API; Hide/disable/destroy release only this view's owner. The view does not modify timeScale or drive/load/reset a vehicle.

A launch requires current-version notice/language completion (`StartupFlow.GameplayAllowed` and no startup screen open), available host data and a connected host callback. Unavailable modes remain disabled. Selection emits a request exactly once until ClearLaunchPending/Show; host acceptance is intentionally not inferred. A mission ID is never synthesized.

The existing driving rig and disabled pause-menu Main menu entry are unchanged: connecting menu navigation/loading belongs to gameplay integration. The new menu is reviewable with its isolated harness, not a replacement game flow silently inserted into the physics prototype.

## Localization coordination

The user explicitly approved additive `menu.*` and `environments.*` keys in this session. No existing key was renamed or removed. `disclaimer.body` is byte-for-byte the approved Korean/English text; DisclaimerPolicy and persistence are unchanged.

New keys (34):
- `environments.city.title`
- `environments.empty`
- `environments.emptyDescription`
- `environments.freeDescription`
- `environments.freeDriving`
- `environments.launchPending`
- `environments.mission.parking`
- `environments.mission.parkingDetail`
- `environments.mission.startStop`
- `environments.mission.startStopDetail`
- `environments.mission.turns`
- `environments.mission.turnsDetail`
- `environments.missions`
- `environments.noMissions`
- `environments.parking.title`
- `environments.planned`
- `environments.plannedDescription`
- `environments.preview`
- `environments.ready`
- `environments.skills.description`
- `environments.skills.details`
- `environments.skills.title`
- `environments.startFreeDriving`
- `environments.startMission`
- `environments.suburban.title`
- `environments.title`
- `environments.unavailable`
- `menu.back`
- `menu.brand`
- `menu.chooseEnvironment`
- `menu.environments`
- `menu.intro`
- `menu.settings`
- `menu.tagline`

## Verification evidence and limits

Passed here: exact preservation of 63 protected files; original key preservation; notice equality; duplicate/empty/missing key checks; Korean/English placeholder counts and existing format specifiers; modern Hangul and current localized glyph coverage; authored theme GUID resolution; C# delimiter checks; unchanged non-presentation method tokens in the HUD/camera/calibration files; git diff whitespace check.

These checks do **not** establish C# type correctness, Unity asset importer correctness, runtime event behavior, touch usability, frame rate or Android build success. `static-results.json` is explicitly labeled static. No existing Unity test result has been changed to passed.

`Tools/ui-design/previews/` contains Korean/English static layout illustrations produced from the shipped font/art, strings and reference positions. Illustrative speed/map values are not telemetry. They are not Unity screenshots and may differ from Unity font/layout metrics. `render_layouts.py` recreates them. Browser screenshot rendering was unavailable in this environment; it was not used as Unity evidence.

Run static checks: `python Tools/ui-design/verify_ui.py /path/to/DrivingPracticeSimulator-source-69692df.zip`.
Regenerate font: `python Tools/ui-design/build_font.py /path/to/NotoSansCJK-Regular.ttc` (Korean face index 1).
Regenerate original art: `python Tools/ui-design/build_assets.py`.
Regenerate illustrations: `python Tools/ui-design/render_layouts.py`.

Review/merge requires the user's separate approval. This handoff authorizes no merge or gameplay branch update.
