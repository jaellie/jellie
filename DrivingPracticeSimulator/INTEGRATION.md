# Integration Contract: Gameplay (Claude Code) ↔ UI/UX & Localization (Codex)

This file is the stable interface between the two workstreams. If a change would break anything
here, raise it first and update this file in the same change, after review.

**Status:** the C# below is written but **not yet compiled or run in Unity**. Signatures may receive
compile fixes; any change to a public signature will be recorded in the change log at the end.

## 1. Ownership and branches

**Revised 2026-10-31 (user decisions):** Claude = gameplay, UI/UX, Unity integration, testing.
Codex = 3D meshes, materials (textures + manifest), textures, environment art. Pipeline: Blender → FBX → Unity (Claude).

| Area | Owner | Notes |
|---|---|---|
| Gameplay, physics, input, AI traffic, scene flow, layout data (`TestTownLayout.json`) | Claude Code | branch `ccr-21c0ed33-uzs8xd` |
| **All UI/UX**: design system, every screen, HUD, touch controls, menus, calibration UX, dialogs, animations, wording (ko/en) | Claude Code | design proposal "Cabin Light" awaiting approval |
| Unity integration: scenes, prefabs, colliders, layers, lights, import settings, material generation, tests, APK | Claude Code | `Editor/Art*`, `ProjectConfigurator` |
| **3D meshes, textures, `materials.json`, Blender sources**: cockpit and vehicle, Korean roads, sidewalks, intersections, markings, buildings, street furniture, traffic lights, signs, lighting look, mobile optimization | Codex | branch **`codex/3d-environment`**; must follow **`ASSET_SPEC.md`** |
| Greybox geometry and anchor points for testing | Claude Code | temporary; replaced by Codex art |

- Codex works on its own branch and does not modify vehicle physics, input, traffic AI, localization, UI
  code or UI behavior. Claude reviews every Codex branch against this contract before integrating it. Nothing is merged unreviewed, and neither side overwrites the other's files.
- Status of record: `PROGRESS.md`.

### Visual direction (approved 2026-10-31, implemented by Codex)
Minimal Automotive as the foundation: polished, modern automotive UI, subtle glass effects,
restrained ice-blue accents, realistic cockpit visibility, clean instrument clusters. No excessive
neon or arcade styling. Claude does not implement visual changes; gameplay code stays independent of
the look (§5, §6). Functional colors keep their meaning (§5) even if the hues change.

## 2. Startup flow (first launch)

Order: **language selection → mandatory notice → gameplay**. Implemented by
`DrivingSim.Startup.StartupFlow` (one per scene, created by the test rig).

- Language screen: shown while no language has been saved (`LocalizationService.HasSavedChoice == false`).
- Notice: shown while the current notice version isn't acknowledged (`DisclaimerService.IsAcknowledged == false`).
- Until both are done, driving input is blocked (the brake is held) and keyboard shortcuts are
  disabled. `StartupFlow.GameplayAllowed` becomes true and `GameplayAllowedChanged` fires.

### Screen interfaces (Codex implements these)

```csharp
namespace DrivingSim.Startup
{
    public interface ILanguageSelectionView
    {
        void Show(Language current, bool allowCancel, Action<Language> onSelected, Action onCancelled);
        void Hide();
    }

    public enum DisclaimerViewMode { Required, Review }

    public interface IDisclaimerView
    {
        void Show(DisclaimerViewMode mode, Action onAcknowledged, Action onClosed);
        void Hide();
    }
}
```

Rules for implementations:
1. Implement the interface on a `MonoBehaviour`. Assign it on the `StartupFlow` component (fields *Language View
   Override* / *Disclaimer View Override*), or call `startupFlow.SetViews(languageView, disclaimerView)`.
   With nothing assigned, the temporary placeholders (`PlaceholderLanguageView`, `PlaceholderDisclaimerView`)
   are used. Replacing them changes **no logic**.
2. Call each callback **at most once per `Show`**, only in response to the player's action.
   **Never acknowledge automatically** (no timers, no auto-accept).
3. `Required` mode: the only way forward is the acknowledge action. No close button, no tap-outside, no back gesture.
   `Review` mode (from Settings): a close action only; `onAcknowledged` is null.
4. `allowCancel == false` (first launch): a language must be chosen; don't show cancel.
5. The screen must be modal: a full-screen raycast-blocking layer, so nothing behind it receives touches or clicks.
   Respect the safe area (`SafeAreaFitter` is available).
6. Don't call `DisclaimerService.Acknowledge()` or `LocalizationService.SetLanguage()` from the view.
   `StartupFlow` does that when the callbacks fire.
7. Texts come from keys (§3). The language screen should show its title in both languages, since the player
   may not read the current one yet. Use `LocalizationService.In(language, key)`.

### Settings entry points
- `startupFlow.OpenLanguageSelection()`: change language later (cancel allowed).
- `startupFlow.OpenDisclaimer()`: read the notice again (`Review` mode).
- Both block driving input while open. They're currently reachable from the pause menu
  (`DrivingHUDController`, buttons "언어 / Language" and "고지 사항 / Notice"). Codex's Settings screen
  should call the same two methods.

## 3. Localization

### Data
- File: `Assets/DrivingSim/Resources/Localization/strings.json` (UTF-8):
  ```json
  { "entries": [ { "key": "hud.brake", "ko": "브레이크", "en": "Brake", "note": "optional context" } ] }
  ```
- Languages: `ko` = Korean (source/fallback), `en` = English (US). Codes saved: `ko-KR`, `en-US`.
- Placeholders use .NET format syntax: `{0}`, `{1:F0}`, `{0:0.00}`. **ko and en must use the same placeholder
  indexes.** Keep the format specifiers; reorder freely.
- `note` carries context and length limits. Read it before rewording.
- English values are **drafts** for Codex to finalize, except `disclaimer.body` (approved wording, see §4).

### Key rules
- Keys are code identifiers. **Wording changes don't need Claude; key changes do.** Codex may edit
  `ko`/`en`/`note` freely. Adding, removing or renaming keys must be coordinated (code references them).
- Namespaces: `common.*`, `language.*`, `disclaimer.*`, `gear.*`, `shift.*`, `parkingBrake.*`, `signal.*`,
  `hazard.*`, `headlights.*`, `wipers.*`, `camera.*`, `hud.*`, `toast.*`, `nav.*`, `pause.*`, `wizard.*`.
- New user-visible text must be a key. No hardcoded strings in UI code.

### Runtime API (`DrivingSim.Localization`)
| Member | Purpose |
|---|---|
| `Loc.T(key)` / `Loc.T(key, args…)` | Text in the current language (formatted) |
| `LocalizationService.Current` | Current `Language` |
| `LocalizationService.SetLanguage(language, save = true)` | Switch and persist (PlayerPrefs `DrivingSim.Language`) |
| `LocalizationService.HasSavedChoice` | False until the player has chosen once |
| `LocalizationService.LanguageChanged` | `event Action<Language>`: refresh texts |
| `LocalizationService.In(language, key)` | Text in a specific language (bilingual screens) |
| `LocalizationService.Reload()` | Re-read `strings.json` at runtime |
| `LocalizationService.ClearSavedChoice()` | Dev/testing: show the language screen again on next launch |
| `LocalizedText` component | Put on a uGUI `Text` with a fixed key; refreshes on language change |

- Missing translation → Korean → `[key]`, so gaps are visible, not blank.
- TextMeshPro: not used yet. If Codex introduces TMP, add a TMP variant of `LocalizedText` (or ask Claude to);
  keep keys unchanged.

### Fonts and fitting (Codex)
- The built-in `LegacyRuntime` font has **no Hangul glyphs** (Korean currently relies on OS fallback). Supply a
  Hangul-capable font (e.g. Noto Sans KR, SIL OFL) via `HudTheme.font` or TMP font assets.
- Check fitting in both languages; English strings are often longer. Layout must not depend on Korean width.

### Automated checks (EditMode, `LocalizationTests`)
These fail if: duplicate keys, empty `ko` or `en`, placeholder mismatch between `ko` and `en`, a key used
in code missing from the file, or `disclaimer.body` differs from the approved wording.

## 4. First-launch notice (disclaimer)

- Approved text (keys `disclaimer.body`):
  - ko: 이 게임은 실제 운전 감각을 익히기 위한 연습용 시뮬레이터이며, 실제 도로에서의 안전한 운전 능력을 검증하는 도구가 아닙니다. 차량 조작감과 주행 환경은 실제 차량과 다를 수 있습니다.
  - en: This simulator is intended for driving practice. It does not assess your ability to drive safely on real roads. Vehicle controls and driving conditions may differ from those of a real car.
- Other keys: `disclaimer.title`, `disclaimer.accept`, `common.close`. Title and button wording may be refined by Codex.
- **Changing the body text materially requires bumping `DisclaimerPolicy.CurrentVersion`** (Core). Everyone
  is then asked again. A test pins the approved wording.
- Storage: `persistentDataPath/disclaimer_acknowledgment.json` = `{ version, acknowledgedUtc, language }`.
- API (`DrivingSim.Startup.DisclaimerService`): `IsAcknowledged`, `Record`, `Acknowledge()` (StartupFlow only),
  `ClearAcknowledgment()` and `Reload()` (dev/testing), `Acknowledged` event.

## 5. HUD and interaction rules

- Theme: `HudTheme` ScriptableObject (colors, rounded panel, circle, arrows, car marker, font). Empty sprite
  slots fall back to generated placeholders. Codex restyles through the theme or by replacing the HUD builder's
  visuals. **Keep the components and their wiring** (`GearSelectorUI`, `TouchPedalButton`, `HoldButton`, lamps, bars).
- Buttons: use `HoldButton` (acts on pointer **down**, left button only; middle-mouse presses arrive as left
  through `MiddleMouseUIRouter`). Don't switch to uGUI `Button`'s click-on-release for driving controls. It
  breaks multi-touch while a pedal is held.
- `raycastTarget = true` **only** on interactive elements. Everything else stays non-blocking, because a pointer
  that starts on a non-interactive area steers the car (circular steering works anywhere that isn't a control).
- Keep `EventSystem.sendNavigationEvents = false`. A foot on the floor keyboard must not press focused buttons.
- Layout reference 1920×1080, `CanvasScaler` match height. Everything inside `SafeAreaFitter`.
- Selected gear = blue; parking brake engaged = red (functional meaning, keep even if hues change).
- The steering ring is a fixed, faint indicator (not an input zone). Keep it non-blocking.

## 6. What Codex should not change without review

Codex changes only `Assets/DrivingSim/Art/**` (FBX, textures, `Materials/materials.json`) and `ArtSource/**`.
Everything else is Claude's, including all code, UI, `strings.json`, scenes, prefabs, `Resources/Layouts/`,
`ProjectSettings/`, `Packages/`, asmdefs and CI. Codex never changes vehicle physics, input handling, traffic AI,
localization logic or UI behavior.

## 7. Road and environment compatibility (Phases C–E)

Summary (full version in `ROADMAP.md`, "Compatibility contract with Codex"):
- Meters, Y up, +Z forward, right-hand traffic.
- `RoadNetwork` data (gameplay) is the source of truth for lane widths, centerlines, stop lines, crosswalks
  and intersection boundaries. Decorative meshes never move them.
- Keep-out zones: no decoration on lanes, crosswalks or intersection sight triangles. Colliders only where intended.
- Fixed layer and tag list (to be defined at Phase C start): e.g. Road, Vehicle, AIVehicle, Decoration, UI.
- Traffic light and sign prefabs expose a small interface (lamp state, sign value) that gameplay drives.
- An editor validation tool reports decoration overlapping lanes or keep-out zones.

## 7a. Map system (future, not implemented)

Planned in `ROADMAP.md`. Contract so visual and environment work stays compatible:
- One persistent driving core (vehicle, input, cameras, HUD, startup flow, localization). Each map is an
  **environment scene loaded additively**. Environment scenes contain no vehicle, input components,
  cameras, HUD, `EventSystem` or `StartupFlow`; an editor check will enforce this.
- Codex may build environment art and decoration inside those scenes under §7 rules, and the map/mode
  selection screens through a view interface (planned `IMapSelectionView`, same pattern as §2).
- Map, mode and mission names are localization keys (`map.*`, `mode.*`, `mission.*`), added when the
  feature starts.

## 9. 3D asset contract (Codex → Claude)

The full, authoritative specification is **`ASSET_SPEC.md`** (version 1). It covers:
- vehicle dimensions, origin, collision envelope and cockpit bindings;
- the camera and FOV;
- the Test Town geometry from `Resources/Layouts/TestTownLayout.json`, with keep-out zones;
- URP Mobile material rules and the `materials.json` manifest;
- folders, naming, layers and ownership;
- Android budgets and the import test.

It supersedes the earlier draft of this section.

Shared dependencies, changed only by agreement:
- `TestTownLayout.json` and its generator (Claude);
- the anchor and object names in `ASSET_SPEC.md` §1–2 (bound by gameplay code);
- the layer list (§5), set by `ProjectConfigurator`;
- the `materials.json` schema (§4), read by `ArtMaterialBuilder`.

**Acceptance gate:** Codex's import-test kit (`ASSET_SPEC.md` §8) must pass `ArtImportValidator` in Unity before
detailed assets are accepted.

## 8. Codex change checklist (for review; asset batches use ASSET_SPEC.md §7)
- [ ] EditMode tests pass (incl. `LocalizationTests`); no new compile errors.
- [ ] No hardcoded user-visible strings; new texts added as keys (coordinated).
- [ ] Startup views implement the interfaces and follow §2 rules (modal, no auto-acknowledge, no dismiss in Required).
- [ ] No changes to files in §6 without agreement.
- [ ] Both languages checked for fit at 16:9 and 20:9, with a notch/safe-area preview.

## Change log
| Date | Change |
|---|---|
| 2026-10-31 | First version: startup flow + view interfaces, localization data/API, disclaimer, HUD rules, road contract summary |
| 2026-10-31 | Codex branch `codex/ui-visual-polish`; approved visual direction; §7a map system contract (future). New APIs: `LocalizationService.ClearSavedChoice()` and `DisclaimerService.Reload()` (dev/testing). `StartupFlow.OpenLanguageSelection()` / `OpenDisclaimer()` now do nothing while another startup screen is open |

> **Historical (2026-10-31):** written by Codex before the role change. UI/UX now belongs to Claude and will be redesigned from scratch; Codex's UI code is a functional reference only. See §9 (3D asset contract) for Codex's current scope.

## UI implementation appendix — codex/ui-visual-polish

User-approved visual implementation and **34 additive `menu.*` / `environments.*` keys** are documented in `UI_HANDOFF.md`. The original 143 keys and approved notice bodies are preserved. No existing system signature, protected logic, package, assembly definition or CI file changes.

Designed startup views keep `PlaceholderLanguageView.Create` and `PlaceholderDisclaimerView.Create` for source compatibility; StartupFlow still owns language choice and acknowledgment. HudTheme.Default now loads `Resources/UI/MidnightTheme`; missing assets retain fallback behavior.

`PracticeMenuView` is a presentation-only API. The new `PracticeEnvironmentOption`, `PracticeMissionOption` and `PracticeLaunchRequest` types are proposed handoff types for Claude's catalog/launch adapter, not changes to RoadNetwork or a mission implementation. The UI emits requests, holds its input gate and never loads a scene. Claude must review/wire the host before game integration. All entries are unavailable in the isolated UI preview.

Unity compilation, tests, asset import and Android interaction are still unverified. See `UI_HANDOFF.md` for full changed-file inventory, dependencies, review steps, and exact integration requirements.

Concurrent update note: Claude’s `c143105` adds the future map-system contract and startup service/test changes. This branch remains based on `69692df`; preserve those newer changes and reconcile this appendix with §7a when integration is separately approved. Menu DTOs here are presentation proposals pending the gameplay-owned IMapSelectionView/catalog API.

## Integration readiness — approved UI foundation (2026-10-31)

The Minimal Automotive × Premium UI direction is approved **as a foundation, not final visual art**. Preserve the premium menu styling. During driving, the detailed first-person cockpit and Korean 3D road environments must be the visual focus; overlays should be quiet, minimal and functional. Evaluate duplicate speed/gear displays, steering indication, mini-map prominence and panel opacity inside the real cockpit before proposing further presentation changes. Do not remove controls, warnings or change input behavior as part of that evaluation. Standalone flat mockups and the illustrative road backdrop are not the final game aesthetic; no more standalone mockup work is scheduled.

### What is implemented versus illustrative

| Area | Handoff status |
|---|---|
| HUD/camera/pause presentation, theme, icons, Korean/English font and safe-area layout | Implemented in C#/assets; Unity compilation, import, layout and touch behavior unverified |
| Language and notice views | Implemented behind the existing interfaces/factories; same required/review modes and once-only explicit callbacks; runtime unverified |
| Pedal setup screen | Presentation only; existing capture, analysis, validation, safety and saving logic unchanged |
| Main menu, settings, environment catalog and separate Free Driving/Missions views | Implemented presentation and host events; not connected to actual map loading or mission execution |
| UI preview harness | Implemented isolated, unsaved review scene; every environment/mission launch deliberately unavailable; not run here |
| Additional environments, mission scenarios, detailed cockpit/environment art | Not implemented by Codex; catalog entries are examples, not playable content |
| Flat road background, sample speed/telemetry, schematic mini-map and PNG layouts | Static illustrations only; not Unity/gameplay evidence |
| EnvironmentDiagram.png | Real 2D UI asset, but its depicted route is a placeholder; never use it as navigable map/lane data |

### Dependencies and entry points

- Existing project/Unity target: `6000.0.85f1`. Keep the existing uGUI and Input System setup. No new runtime package, asmdef, rendering pipeline or CI dependency was introduced; existing package resolution still needs Unity verification.
- Import `Resources/UI/MidnightTheme.asset`, the supplied `.meta` files, ten sprite PNGs, and `Resources/UI/Fonts/JellieUI-Regular.otf` with `OFL.txt`. The theme loads through `HudTheme.Default`; resource paths and GUID references must stay intact. The font is a static OFL Noto Sans CJK KR derivative, not a TMP asset.
- All original 143 localization keys remain; total is 177. The 34 additive `menu.*` / `environments.*` keys were explicitly approved by the user. Full Korean/English values: `Tools/ui-design/localization-additions.md`.
- `StartupFlow` still owns saved language, notice version/time/language and input permission. Keep one driving core/EventSystem/startup flow. Reuse the existing ILanguageSelectionView/IDisclaimerView contract; public placeholder type/factory names are retained for compatibility.
- `PracticeMenuView.Create(startupFlow)` creates presentation at runtime. Supply catalog records with `SetCatalog`, subscribe to `LaunchRequested`, and show the menu with `ShowHome`/`ShowEnvironments`. Claude owns ID validation, availability, map/environment loading, mission runners, loading concurrency and failure feedback. Call `Hide()` only when the host accepts; on rejection call `ClearLaunchPending()`.
- Canvas ordering: menu **60**, calibration **50**, startup views **100/101**. Before opening the existing pedal wizard from menu settings, the host must hide the menu (otherwise its opaque shield covers the wizard). Let calibration acquire its own input blocker; do not release it on the menu's behalf. The host must arrange the return screen after calibration closes. Language/notice views can overlay the menu through the existing StartupFlow entry points.
- The existing disabled pause-menu Main menu entry has not been wired into a new game flow. Do not silently add scene loading or assume a MapCatalog/IMapSelectionView implementation exists.
- The isolated **DrivingSim → UI → Preview Automotive Menus** action is a review harness, not an environment scene or production entry scene. It must not be inserted into additive environment scenes, which must stay free of vehicle/input/camera/HUD/EventSystem/StartupFlow duplicates.

### Exact overlap and contract review

The UI implementation commit is `6f003f4873419585308c7c57839068734e3878c7`, based on `69692dff2d341a942d9ef6a22dd9b3bb7a67c853`. Claude's branch was independently observed at `c143105c93925de9c318630bba463aeae3a12fb1` during this handoff review.

- **Confirmed textual conflicts:** INTEGRATION.md and PROGRESS.md each had one conflicting region in a read-only three-way text comparison against the common base. No merge result was applied. Preserve Claude's §7a map-system plan, branch ownership, new service APIs and verification notes, then incorporate the UI appendix/foundation decision and handoff status. Do not replace either newer document wholesale with the older snapshot.
- **No other changed-path overlap at those commits.** Claude changed StartupFlow, DisclaimerService, LocalizationService, added StartupFlowPlayModeTests and updated ROADMAP.md. The UI diff does not modify those files; retain those newer gameplay/service/test/planning changes during a separately approved integration.
- **Future API/namespace coordination:** Claude's planned MapDefinition/MapCatalog/IMapSelectionView and map.*/mode.*/mission.* namespaces are not implemented by this UI. PracticeEnvironmentOption/PracticeMissionOption are presentation DTOs pending an adapter. Approved UI keys must not be silently renamed or substituted for gameplay IDs. Final environments/mission names come from the authoritative catalog; the preview's parking-area example is not a commitment to a new playable map.
- Review the existing startup and new UI tests together once integrated. The six new UI tests construct uGUI event objects through reflection to avoid changing the existing test assembly definition; that test path has not run.

### Validation and handoff sequence

1. **Before merge approval:** review the feature diff and handoff; verify Claude's baseline in Unity independently. This document authorizes no merge/rebase or gameplay-branch update.
2. **After separate integration approval:** retain the latest gameplay branch's protected systems and startup tests, reconcile the two documentation conflicts, and apply only the approved UI changes in the chosen integration workflow. Keep the exact notice body/version and saved acknowledgment behavior.
3. Import and compile in Unity; run the existing EditMode/PlayMode suites, StartupFlow tests and AutomotiveUIPresentationTests. A CI skip path is not a compile/test pass.
4. Review the HUD in the actual first-person cockpit with mirrors and instruments visible. Check forward/side-road visibility, duplicate information, warning legibility, glare/contrast, held glance/FOV controls, multi-touch pedals/gear/steering and non-interactive raycasts before tuning appearance. No protected steering/calibration/vehicle parameters may be changed.
5. Check Korean/English fitting at 1280×720, 1920×1080, 2400×1080; both landscape orientations, notch/navigation insets, resize and first-frame safe-area behavior. Verify actual device text sizes/touch targets (48dp goal) and performance; reference-unit fitting does not prove these.
6. Record real Unity cockpit captures and actual test/device results for the next UI refinement pass. Do not use the static flat images as evidence of final game quality.

**Verification boundary:** source/asset checks pass against the reviewed base (63 protected files unchanged, original key preservation, exact bilingual notice bodies, placeholders, glyph coverage and theme references). Required/review acknowledgment guards were reviewed in source. Unity compilation, importer correctness, callbacks in execution, Android builds/touch/readability/FPS and combined-branch compatibility remain unverified. Full file inventory and integration sample: UI_HANDOFF.md and Tools/ui-design/changed-files.txt.
| 2026-10-31 | Role change: Claude owns all UI/UX and wording; Codex owns 3D art. Added §9 3D asset contract and URP Mobile rendering rules. Codex UI branch merged after review as a functional reference |
| 2026-10-31 | Responsibilities: Claude = gameplay, UI/UX, integration, testing; Codex = meshes, materials, textures, environment art on `codex/3d-environment`. §9 now points to ASSET_SPEC.md v1 (Blender → FBX pipeline, authoritative TestTownLayout.json, import-test gate) |
