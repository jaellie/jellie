# Driving Practice Simulator (운전 연습 시뮬레이터)

A Unity 6 / C# Android driving-practice simulator based on Korean Class 2 Ordinary
(2종 보통) automatic lessons. **Current state: Milestone 1, the vehicle physics prototype.**
Menus, mobile controls, the cockpit view and mission logic come in later milestones.

> ⚠️ **Verification status.** No Unity Editor or C# compiler was available where these files
> were written, so **nothing here has been compiled, run in Play Mode, or built for Android.**
> The vehicle physics prototype is only done once the checks in [TESTING.md](TESTING.md) pass
> in Unity Play Mode. See *Known gaps* below.

## Requirements

- Unity **6000.0 LTS** (any recent 6000.0.x patch). `ProjectSettings/ProjectVersion.txt` names
  6000.0.47f1. If Hub offers a different installed 6000.0 version, accept it.
- Android Build Support module (needed later. Milestone 1 runs in the Editor).

Packages (`Packages/manifest.json`): Input System, URP, Test Framework, uGUI, and the built-in
physics/vehicles modules. If Package Manager reports a version it can't resolve, set that
package to the version it suggests (core packages such as URP are tied to the editor version).

## First-time setup

1. **Unity Hub → Add → Add project from disk** → choose the `DrivingPracticeSimulator` folder.
   Unity generates `Library/` and the rest of `ProjectSettings/` on first open.
2. If Unity asks to enable the new Input System backend, choose **Yes** (it restarts).
   The keyboard code works with *Input System*, *Input Manager (Old)* or *Both*.
3. Menu **DrivingSim → Create Physics Test Scene**. This:
   - creates `Assets/DrivingSim/Settings/CompactSedan_PhysicsConfig.asset` (all vehicle parameters)
   - creates flat-color materials in `Assets/DrivingSim/Generated/Materials/`
   - builds and saves `Assets/DrivingSim/Scenes/PhysicsTest.unity`, and adds it to Build Settings.
4. Press **Play**.

*Other option:* add the `PhysicsTestBootstrap` component to an empty GameObject in any scene.
It builds the same rig at runtime with in-memory defaults (nothing is saved).

*URP:* the URP package is installed, but Milestone 1 does not create a URP pipeline asset, so the
project renders with the Built-in pipeline until one is assigned. To switch:
**Assets → Create → Rendering → URP Asset (with Universal Renderer)**, then assign it in
**Project Settings → Graphics** and **Quality**, then run *Create Physics Test Scene* again
(the generated materials then use `Universal Render Pipeline/Lit`).

## Keyboard controls (physics validation only)

| Key | Action |
| --- | --- |
| W / ↑ | Accelerator (ramps up while held, ≈1.25 s to full) |
| S / ↓ | Brake (ramps up, ≈0.5 s to full) |
| Left Shift (held) | Gentle pedals: caps throttle at 0.30 and brake at 0.35 |
| A / D or ← / → | Rotate the steering wheel (360°/s). Releasing leaves it where it is |
| C (held) | Turn the steering wheel back toward center |
| 1 / 2 / 3 / 4 | Select P / R / N / D |
| Q / E | Move the lever one position toward P / toward D |
| Space | Toggle the parking brake (starts **engaged**) |
| V | Chase camera ↔ top-down camera |
| F1 | Toggle the telemetry overlay |
| Backspace | Reset the vehicle to the spawn point (P, parking brake on) |

To pull away: hold **S** → press **4** (D) → **Space** (release parking brake) → release **S**.
The car creeps forward. Add **W** to accelerate.

## Architecture

```
Assets/DrivingSim/
  Core/        DrivingSim.Core      Engine-free logic. Unit tested.
    AutomaticTransmissionLogic  P/R/N/D state machine + shift interlocks
    SteeringModel               ±720° wheel → front-wheel angle, speed sensitivity, self-centering
    PowertrainModel             creep, throttle force (power limited), reverse, coasting
    BrakeModel / ResistanceModel / AckermannGeometry
  Runtime/     DrivingSim.Runtime
    Vehicle/   VehiclePhysicsConfig (ScriptableObject), VehicleController (Rigidbody + WheelColliders)
    Controls/  DrivingInputFrame, IDrivingInputSource, VehicleInputRouter, KeyboardDrivingInput
    Cameras/   VehicleFollowCamera (third-person + top-down)
    Diagnostics/ VehicleDebugHUD (dev overlay), VehicleTestProbe (measurements)
    TestBed/   Procedural test ground + primitive vehicle + rig assembly
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
- *Steering*: `front angle = wheel angle / ratio` (ratio defaults to 720/35 ≈ 20.6:1), scaled
  down at speed (×0.45 at 100 km/h), slew-limited to 120°/s, with Ackermann applied (35° is the
  **inner** wheel's limit). Self-centering is off below 1.5 km/h, ramps to full at 25 km/h,
  is ×0.3 in reverse, and is suppressed while the driver is steering.

All parameters live in `CompactSedan_PhysicsConfig.asset`. With *Live Apply In Editor* on,
Inspector edits apply during Play Mode. **These values are prototype tuning, not calibrated
to any real car.**

## Known gaps / not verified

- Compilation, Play Mode behavior, EditMode tests and Android builds are **all untested**.
  Report the first compiler error you hit and it can be fixed quickly.
- Package versions in `manifest.json` and the editor version in `ProjectVersion.txt` are
  best guesses for Unity 6000.0 LTS.
- WheelCollider low-speed behavior depends on the editor version and the fixed timestep
  (default 0.02 s). If the car jitters or slides at standstill, see the tuning notes in TESTING.md.
- No ABS: full brake from high speed can lock the wheels.
- The IMGUI overlay's Korean feedback lines rely on OS font fallback. A proper Korean UI font
  (e.g. Noto Sans KR via TextMeshPro) is planned for the UI milestone.
