# Integration Contract: Gameplay (Claude Code) ↔ UI/UX & Localization (Codex)

This file is the stable interface between the two workstreams. If a change would break anything
here, raise it first and update this file in the same change, after review.

**Status:** the C# below is written but **not yet compiled or run in Unity**. Signatures may receive
compile fixes; any change to a public signature will be recorded in the change log at the end.

## 1. Ownership and branches

| Area | Owner | Notes |
|---|---|---|
| Gameplay, physics, input, AI traffic, tests, Unity integration | Claude Code | branch `ccr-21c0ed33-uzs8xd` |
| Localization **system** (loading, keys, persistence, events, APIs) | Claude Code | `Runtime/Localization`, `Core/Localization.cs` |
| Korean and English **wording**, typography, text fitting | Codex | edits the `ko` / `en` values in `strings.json` |
| Visual design of the language, disclaimer and settings screens, HUD look | Codex | Codex's design branch (name TBD) |
| Road network data and lane paths | Claude Code | see §7 |
| Decorative environment assets | Codex | must follow §7 |

- Codex works on its own branch. Claude reviews it for compatibility with this contract before
  anything is integrated. Nothing is merged unreviewed, and neither side overwrites the other's files.
- Status of record: `PROGRESS.md`.

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
  `ClearAcknowledgment()` (dev/testing), `Acknowledged` event.

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

`Core/`, `Runtime/Controls/`, `Runtime/Vehicle/`, `Runtime/Startup/` logic, `Runtime/Localization/` code,
input/physics config defaults, `strings.json` **keys**, asmdefs, CI workflow. Visual files, prefabs, themes,
fonts and `strings.json` **values** are Codex's.

## 7. Road and environment compatibility (Phases C–E)

Summary (full version in `ROADMAP.md`, "Compatibility contract with Codex"):
- Meters, Y up, +Z forward, right-hand traffic.
- `RoadNetwork` data (gameplay) is the source of truth for lane widths, centerlines, stop lines, crosswalks
  and intersection boundaries. Decorative meshes never move them.
- Keep-out zones: no decoration on lanes, crosswalks or intersection sight triangles. Colliders only where intended.
- Fixed layer and tag list (to be defined at Phase C start): e.g. Road, Vehicle, AIVehicle, Decoration, UI.
- Traffic light and sign prefabs expose a small interface (lamp state, sign value) that gameplay drives.
- An editor validation tool reports decoration overlapping lanes or keep-out zones.

## 8. Codex change checklist (for review)
- [ ] EditMode tests pass (incl. `LocalizationTests`); no new compile errors.
- [ ] No hardcoded user-visible strings; new texts added as keys (coordinated).
- [ ] Startup views implement the interfaces and follow §2 rules (modal, no auto-acknowledge, no dismiss in Required).
- [ ] No changes to files in §6 without agreement.
- [ ] Both languages checked for fit at 16:9 and 20:9, with a notch/safe-area preview.

## Change log
| Date | Change |
|---|---|
| 2026-10-31 | First version: startup flow + view interfaces, localization data/API, disclaimer, HUD rules, road contract summary |
