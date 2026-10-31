# Driving Practice Simulator (운전 연습 시뮬레이터)

A Unity 6 / C# Android driving-practice simulator based on Korean Class 2 Ordinary
(2종 보통) automatic lessons. **Current state: Milestone 1 (vehicle physics prototype) plus Phase B of the road & traffic
upgrade (first-person cockpit, mirrors, camera switching).** See [ROADMAP.md](ROADMAP.md) for the
architecture review and the plan for roads, AI traffic and driving evaluation.

> ⚠️ **Verification status.** No Unity Editor or C# compiler was available where these files
> were written, so **nothing here has been compiled, run in Play Mode, or built for Android.**
> The vehicle physics prototype is only done once the checks in [TESTING.md](TESTING.md) pass
> in Unity Play Mode. See *Known gaps* below.

## Requirements

- Unity **6000.0.85f1** (Unity 6 LTS), pinned in `ProjectSettings/ProjectVersion.txt` and in CI.
  It's the newest 6000.0 patch with GameCI Docker images (Linux and Android) as of 2026-10-31.
  Install the same version locally so local and CI results match.
- Android Build Support module (needed later. Milestone 1 runs in the Editor).

Packages (`Packages/manifest.json`): Input System, URP, Test Framework, uGUI, and the built-in
physics/vehicles modules. If Package Manager reports a version it can't resolve, set that
package to the version it suggests (core packages such as URP are tied to the editor version).

## First-time setup

1. **Unity Hub → Add → Add project from disk** → choose the `DrivingPracticeSimulator` folder.
   Unity generates `Library/` and the rest of `ProjectSettings/` on first open.
2. If Unity asks to enable the new Input System backend, choose **Yes** (it restarts).
   The keyboard code works with *Input System*, *Input Manager (Old)* or *Both*.
3. Menu **DrivingSim → Create Scenes (Main Menu + Test Town)**. This:
   - creates `Assets/DrivingSim/Settings/CompactSedan_PhysicsConfig.asset` (all vehicle parameters)
   - creates flat-color materials in `Assets/DrivingSim/Generated/Materials/`
   - builds and saves `Assets/DrivingSim/Scenes/TestTown.unity (plus Scenes/MainMenu.unity)`, and adds it to Build Settings.
4. Press **Play**.

*Other option:* add the `PhysicsTestBootstrap` component to an empty GameObject in any scene.
It builds the same rig at runtime with in-memory defaults (nothing is saved).

*URP:* the URP package is installed, but Milestone 1 does not create a URP pipeline asset, so the
project renders with the Built-in pipeline until one is assigned. To switch:
**Assets → Create → Rendering → URP Asset (with Universal Renderer)**, then assign it in
**Project Settings → Graphics** and **Quality**, then run *Create Scenes* again
(the generated materials then use `Universal Render Pipeline/Lit`).

## Automated tests in CI (GitHub Actions + GameCI)

`.github/workflows/unity-tests.yml` ("Unity CI") runs on every push to the development branch or by
manual dispatch, on Unity 6000.0.85f1, in one job:
1. **Configure** (`game-ci/unity-builder` v6.0.0, `CIEntryPoints.Configure`): compiles, applies
   `DrivingSim → Configure Project`, generates `Scenes/TestTown.unity (plus Scenes/MainMenu.unity)`. Artifact `generated-project-files`.
2. **Tests** (`game-ci/unity-test-runner` v4.4.0): EditMode + PlayMode. Check "Unity test results",
   artifact `unity-test-results` (results, logs, `TestScreenshots/` cockpit and chase views).
3. **Android** (`CIEntryPoints.BuildAndroid`): debug-signed IL2CPP ARM64 APK. Artifact `android-apk`.
 For a **Unity Personal** seat it needs two repository
secrets: `UNITY_EMAIL` and `UNITY_PASSWORD` of a dedicated CI Unity account with two-factor
authentication off. No license file: the GameCI CLI (v0.1.72, pinned) activates Personal seats with
the account, and a Personal `.ulf` is machine-bound and fails in CI containers. (The GameCI docs page
still lists three secrets; the CLI source is what runs.) Without the secrets the job prints a notice
and skips Unity.

**Local fallback (Unity Hub on a PC/Mac):** install Unity 6000.0.85f1 with Android Build Support →
open `DrivingPracticeSimulator/` → run **DrivingSim → Configure Project** (restart Unity if it asks) →
**DrivingSim → Create Scenes (Main Menu + Test Town)** → Play. Tests: Window → General → Test Runner → EditMode
and PlayMode → Run All. APK: File → Build Profiles → Android → Build.

PlayMode smoke tests (`Tests/PlayMode`): P holds the car, leaving P without the brake is
rejected, D/R creep, P refused while moving, braking from 25 km/h stops and holds, full-lock
steering turns the car right with Ackermann, steering stays put when released while stopped.

## Language and first-launch notice

Korean / English (US), saved locally, changeable later (pause menu → 언어 / Language). Before the first
drive the player must pick a language and acknowledge the practice-only notice. The acknowledgment
(version, time, language) is saved and the notice can be reopened (pause menu → 고지 사항 / Notice). The
screens are temporary placeholders until Codex's design is plugged in. Strings live in
`Resources/Localization/strings.json`. The contract for UI work is **[INTEGRATION.md](INTEGRATION.md)**.

## Keyboard controls (physics validation only)

| Key | Action |
| --- | --- |
| W / ↑ | Accelerator (ramps up while held, ≈1.25 s to full) |
| S / ↓ | Brake (ramps up, ≈0.5 s to full) |
| Left Shift (held) | Gentle pedals: caps throttle at 0.30 and brake at 0.35 |
| A / D or ← / → | Rotate the steering wheel (270°/s: center to lock in 2 s). Releasing leaves it where it is |
| C (held) | Turn the steering wheel back toward center |
| 1 / 2 / 3 / 4 | Select P / R / N / D |
| Q / E | Move the lever one position toward P / toward D |
| Space | Toggle the parking brake (starts **engaged**) |
| V | First-person cockpit ↔ third-person chase camera |
| T | Top-down camera (test view) |
| Z / X (held) | Look left / right in the cockpit |
| [ / ] | Cockpit field of view − / + (saved between sessions) |
| , / . | Left / right turn signal (cancels itself after the turn) |
| H / L / K | Hazard lights / headlights / wipers (off → intermittent → low → high) |
| Esc | Pause menu |
| F1 | Toggle the developer telemetry overlay (hidden by default) |
| Backspace | Reset the vehicle to the spawn point (P, parking brake on) |

To pull away: hold **S** → press **4** (D) → **Space** (release parking brake) → release **S**.
The car creeps forward. Add **W** to accelerate.

## Driving controls beyond the keyboard

**Circular steering.** Turn the wheel by drawing circles, as if turning a real steering wheel.
Default mode (`TouchSteeringController.mode = CircularAnywhere`): a gesture may start **anywhere
that is not a button**, and the code accumulates how much the stroke's direction of travel turns.
One loop of any size, anywhere = one turn of the wheel (gain 1:1). Clockwise = right. A straight
stroke = 0°, so a plain left/right drag never steers. Motion shorter than 1.9 % of the screen height
is ignored as jitter. A turn sharper than 100° within one segment (a reversal) is discarded. The first
segment of each gesture only sets the direction, so a few degrees of the first motion aren't counted.
Releasing keeps the angle; the next gesture continues from it. A gesture never activates buttons
it crosses.

**Smoothing (against hand-tremor shake).** Short strokes point in noisy directions, which made the
wheel shake and even step backward (up to ≈ 50° in simulated noisy circles). Three measures remove
this without losing rotation: a 1.9 %-of-height minimum segment, exponential smoothing of the
stroke direction (`directionSmoothing` 0.6), and the wheel following gesture input with a 70 ms time
constant (`outputTimeConstant`, `SteeringInputSmoother`). On release, the turn still held back by
the smoothing is added (estimated from the smoothed turn rate), so short twists aren't
under-counted. Result in the preview: worst backward step 0.6° (simulation) / 0.0° (browser test),
a 45° arc still gives ≈ 40°, one loop ≈ 353°.

The faint **steering ring** with its mini wheel stays fixed at 50 % width / 43 % height (radius 27 %
of height) as a visual indicator of the current wheel angle. Its opacity was reduced, since it
overlaps the car in third-person view. The wheel glyph can be hidden. Other modes:
`Circular` (the previous behavior: start inside the ring; angle measured around its center with
`atan2`, ±180° unwrap, 22 % dead zone, 90° jump guard) and `HorizontalDrag` (legacy). Touch, the
**middle mouse button** and optionally the left button (`PointerInputHub.leftMouseAsTouch`) work in
all modes. The scroll wheel is never used.

**Middle mouse on UI.** Unity UI ignores middle clicks. `MiddleMouseUIRouter` sends a
middle press that starts on a control to that control as one left-button touch (its own pointer
id). `HoldButton` ignores the input module's own middle-button events, so a click fires once.
A pointer that starts on UI never steers. A drag that starts on the road keeps steering even when
it crosses a button.

**Foot-pedal keyboard.** A keyboard on the floor works as brake (middle area) and accelerator
(right area). See **[PEDALS.md](PEDALS.md)** for the design review, calibration algorithm,
Inspector settings, physical setup advice and the test plan. In short: **Pause → 페달 보정**
runs 5 brake presses, 5 accelerator presses, a per-key review (ambiguous keys flagged, manual
editing), then a **required live test**. Only a validated mapping drives the car. Pedal amount
is simulated from hold time, because a keyboard measures no force: accelerator 0→1 in 2.5 s,
brake 0.3 at once, then 1.0 after 1.2 s. Brake always wins. Losing the keyboard or app focus
cuts throttle and applies a 0.6 fail-safe brake until the player presses the brake again.

**Touch pedals** (bottom-right) stay available: pressure follows the finger's height on the pedal.

**Brake override.** `VehicleInputRouter` cuts throttle whenever the merged brake input is ≥ 0.05,
whatever the source (keyboard W+S, touch, foot pedals).

## Driving HUD

Built in code by `DrivingHUDController` (1920×1080 reference, safe-area aware):
pause + speed/gear (top-left), turn indicators + navigation (top-center), camera buttons +
mini-map (top-right), vertical **P R N D** selector with the selected gear in blue and the
**(P) parking brake** button under it (right edge),
touch pedals (bottom-right), headlights / hazard / wipers + brake and accelerator bars + input
source (bottom-left), look-left/right + steering indicator (bottom-center). Tapping a gear asks the
transmission, so the brake and speed interlocks still apply and a rejection shows in Korean.
Navigation is a placeholder (distance and arrow to the parking bays) until the road network exists.
Placeholder art is generated rounded rectangles and triangles. Create a
**DrivingSim → HUD Theme** asset to swap in vector sprites and colors.

## Camera views

| View | How | Notes |
| --- | --- | --- |
| Third-person chase | Default. **V** or the on-screen **1인칭/3인칭** button toggles | Follows the car's yaw only |
| First-person cockpit | **V** / on-screen button | Driver's eye on the left seat. Dashboard, steering wheel driven by the real steering angle, speedometer needle + digital speed, P R N D, parking-brake lamp, three mirrors |
| Top-down | **T** | Test view for parking and turning radius |

In the cockpit, the on-screen **왼쪽 보기 / 오른쪽 보기** buttons (or Z/X) turn the head while held,
and **− / +** set the field of view (50–85°, default 65°). Look controls are buttons, never a drag,
so they can't interfere with drag steering. The right side mirror is outside the default field of
view (as in a real car you glance at it). Use look-right or a wider FOV.

Mirrors render to small RenderTextures (rearview 256×72, sides 160×112), only in the cockpit view,
with one mirror rendered per frame (rearview every 2nd frame, each side mirror every 4th).
Tune `renderInterval`, `renderPhase` and the texture size on each `MirrorCamera`.

## Architecture

```
Assets/DrivingSim/
  Core/        DrivingSim.Core      Engine-free logic. Unit tested.
    AutomaticTransmissionLogic  P/R/N/D state machine + shift interlocks
    SteeringModel               ±540° wheel → front-wheel angle, speed sensitivity, self-centering
    PedalStateMachine           digital pedals → brake priority, simulated travel, fail-safe
    PedalCalibration            attempt grouping, key statistics, ambiguity, validation session
    PowertrainModel             creep, throttle force (power limited), reverse, coasting
    BrakeModel / ResistanceModel / AckermannGeometry
  Runtime/     DrivingSim.Runtime
    Vehicle/   VehiclePhysicsConfig (ScriptableObject), VehicleController (Rigidbody + WheelColliders)
      Cockpit/ CockpitRig: steering wheel, gauges, gear/parking-brake indicators, eye anchor, mirrors
    Controls/  DrivingInputFrame, IDrivingInputSource, VehicleInputRouter, KeyboardDrivingInput,
               PointerInputHub, TouchSteeringController, MobilePedalController
      Pedals/  PedalInputManager, KeyboardPedalDevice (IPedalDevice), PedalKeyMapping
    Cameras/   CameraController (view modes, cockpit look/FOV), VehicleFollowCamera (chase/top-down),
               MirrorCamera (throttled RenderTexture mirror)
    UI/        CameraControlsOverlay (on-screen view/look/FOV buttons), HoldButton, SafeAreaFitter
    Diagnostics/ VehicleDebugHUD (dev overlay), VehicleTestProbe (measurements)
    TestBed/   Procedural test ground + primitive vehicle + cockpit builder + rig assembly
  Editor/      "DrivingSim" menu (scene/config generation)
  Tests/EditMode/  NUnit tests for Core
```

**Input flow.** Each frame, `VehicleInputRouter` polls every `IDrivingInputSource` into one
`DrivingInputFrame` and passes it to `VehicleController.SetInput`. Steering arrives as a
*rotation delta in degrees* plus a *held* flag. This is the shape PUBG-style drag steering needs:
Milestone 3's `TouchSteeringController` and `MobilePedalController` will be new sources, with no
change to the vehicle code.

**Physics.** All motion comes from WheelCollider motor/brake torque plus rolling-resistance and
drag forces on the Rigidbody. Velocity is never set, except to zero on reset.
- *Creep*: in D/R with no throttle, a torque-converter-like force that fades linearly to zero
  at `creepFadeSpeedKmh` (9 km/h). Rolling resistance and drag set the actual creep speed.
- *P*: large brake torque on the driven (front) wheels (parking-pawl approximation).
  *N*: no drive torque. *Parking brake*: extra brake torque on the rear wheels.
- *Shift interlocks*: leaving or entering P needs brake ≥ 0.2. Entering P needs ≤ 1 km/h.
  D↔R against the direction of travel needs ≤ 2 km/h. Engaging D/R from a stop needs the brake.
  N↔D while rolling forward is free. Each rule is a toggle in the config.
- *Steering* (realistic multi-turn): the steering wheel turns ±540° (3 turns lock to lock);
  `front angle = wheel angle / 540 × 35` (ratio 15.4:1, linear), scaled down at speed
  (×0.45 at 100 km/h), slew-limited to 120°/s, with Ackermann applied (35° is the **inner**
  wheel's limit; rear-axle turning radius 4.56 m, outer-front-wheel radius 5.96 m). Drag
  steering adds 100° per screen-height of drag, so center to full lock takes about three long
  swipes. Self-centering is off below 2 km/h, ramps to full at 30 km/h (gain 1.0/s, ≤ 240°/s),
  is ×0.3 in reverse, waits 0.6 s after the driver lets go (hand-over-hand drags accumulate),
  and can be disabled (`selfCenteringEnabled`). Vehicle yaw always comes from the
  WheelColliders; input only turns the steering wheel.

All parameters live in `CompactSedan_PhysicsConfig.asset`. With *Live Apply In Editor* on,
Inspector edits apply during Play Mode. **These values are prototype tuning, not calibrated
to any real car.**

## Editor configuration required

- **Project Settings → Player → Active Input Handling = Input System Package (New)** or **Both**.
  Drag steering, the middle-mouse touch, the foot-pedal keyboard and the calibration wizard need
  the Input System. Without it, only the keyboard driving keys work.
- Re-run **DrivingSim → Create Scenes (Main Menu + Test Town)** to get the HUD, pointer hub, pedals and lights.
- On first Play the calibration wizard opens. Press **건너뛰기** to skip; it won't open again
  (PlayerPrefs `DrivingSim.PedalWizardDone`).

## Known gaps / not verified

- Compilation, Play Mode behavior, EditMode tests and Android builds are **all untested**.
  Report the first compiler error you hit and it can be fixed quickly.
- Package versions in `manifest.json` and the editor version in `ProjectVersion.txt` are
  best guesses for Unity 6000.0 LTS.
- WheelCollider low-speed behavior depends on the editor version and the fixed timestep
  (default 0.02 s). If the car jitters or slides at standstill, see the tuning notes in TESTING.md.
- No ABS: full brake from high speed can lock the wheels.
- Mirror and cockpit shaders are looked up with `Shader.Find`. For device builds, add
  `Unlit/Texture` (Built-in) or `Universal Render Pipeline/Unlit` to *Always Included Shaders*.
- Existing scenes made before Phase B have no cockpit. Re-run **DrivingSim → Create Scenes (Main Menu + Test Town)**.
- The IMGUI overlay's Korean feedback lines rely on OS font fallback. A proper Korean UI font
  (e.g. Noto Sans KR via TextMeshPro) is planned for the UI milestone.
