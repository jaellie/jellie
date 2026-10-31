# Foot-Operated Keyboard Pedals

A normal keyboard on the floor, pressed with the feet: the middle area is the brake and the
right area is the accelerator. This document covers the technical review, the design, settings,
physical setup, and the test plan.

> **Verification status.** The C# code has **not been compiled or run**: there is no Unity Editor
> in the environment where it was written. The same algorithms run in the browser preview
> (`Tools/browser-preview/index.html`), where the automated suite (79 checks, steering included) passes in headless Chromium
> **with simulated key events**. No physical keyboard, no foot, and no Android device have been
> tested.

## Phase A: what was inspected

| Item | Finding |
|---|---|
| Unity version | `ProjectVersion.txt` names 6000.0.47f1, a best guess. The project has never been opened in Unity. |
| Input System config | `com.unity.inputsystem` 1.11.2 is in the manifest. **Active Input Handling is not set in the repo** (no `ProjectSettings.asset`). It must be set to *Input System Package* or *Both*. All pedal code is behind `ENABLE_INPUT_SYSTEM`. |
| Vehicle | `VehicleController` gets normalized `Brake`/`Throttle` (0–1) from `VehicleInputRouter`. It never sees keys. Parking brake and P lock are separate brake torques. **Unchanged.** |
| Existing inputs | Keyboard W/S/A/D etc. (`KeyboardDrivingInput` via `KeyboardShim`), pointer/touch + middle mouse (`PointerInputHub`, `TouchSteeringController`), touch pedals (`MobilePedalController`). All feed the router, which merges them (max for pedals) and applies **brake override** (brake ≥ 0.05 ⇒ throttle 0). |
| UI input | uGUI with `InputSystemUIInputModule`. Navigation events off (a foot on Space/Enter must not press buttons). Middle mouse is routed by `MiddleMouseUIRouter`. |
| Android keyboard | Unity's Input System exposes USB-OTG and Bluetooth keyboards as `Keyboard` on Android. Whether a given phone and keyboard deliver every key, and how fast, can only be known on hardware. |
| Key conflicts | Pedal keys can collide with shortcuts (W/S, Space = parking brake, 1–4, arrows…). |

**Problems in the previous pedal implementation (fixed):**

1. Pedal amount came from *how many keys were down*. That depends on exactly the keys ghosting drops, and it pretended to measure force. It's replaced by time-based simulated travel.
2. Keys seen for both pedals were assigned to the more frequent one without telling the player. Now they're flagged, and they're excluded unless one pedal clearly dominates.
3. Saving didn't require a passing live test. Now only a validated mapping drives the car.
4. Nothing happened on keyboard disconnect or focus loss. Now the throttle is cut and a fail-safe brake applies.
5. A key whose release was never reported blocked calibration forever. It's now force-released after 3 s and flagged.

No blocking issue was found, so implementation continued.

## Independent review: answers to the ten questions

1. **Is five-press calibration reliable enough?** For proposing a key set, yes. For proving the mapping is safe, no. A foot lands differently every time, so five presses sample a fuzzy patch, not a fixed region. That's why calibration only *proposes* keys (those seen in ≥ 2 of 5 presses), the player can edit them, and a **guided live test is mandatory** before the mapping drives the car.
2. **Grouping key events into one press:** a press starts at the first key down while nothing is held. It ends when **every** key has been up for the grouping interval (default 0.2 s). Keys that go down late (rolling the foot) or chatter inside that window stay in the same press. The recorder reports each key's down count, the onset spread and the gap between presses. If one key goes down twice inside one press, the wizard warns that presses may have merged (pressing faster than 0.2 s apart).
3. **Risks of "recurring keys":** a stray key hit in 2 of 5 presses gets proposed, and a key at the edge of the foot that registers rarely gets dropped. Both are caught by the review table (per-key counts and key-down totals) and by the live test (stray presses show up as *unmapped* or *wrong pedal*).
4. **Ambiguous keys:** every key seen in **both** calibrations is flagged. If proposed for both, it stays with one pedal only if it appeared there at least **2 more times** (`dominanceMargin`). Otherwise it's removed from both. A key can never belong to both pedals; manual editing moves it rather than duplicating it.
5. **What software can't fix:** a keyboard with ghosting or limited rollover **never sends** some key events (often beyond 2–3 keys on a membrane matrix, or 6 keys over USB boot protocol). Software can't recover events that were never reported. The design copes by using **logical OR** per pedal (any one reported key is enough) and never depending on key combinations. The wizard flags a probable rollover limit when no press ever reports more than 2 keys, or most presses cap at exactly 6. That's only a hint.
6. **Brake priority:** in the pedal state machine, a pressed brake forces accelerator output to 0 in the same update. The router's brake override also cuts throttle from *any* source while braking. Braking is never delayed. After an overlap, the accelerator waits 0.12 s after the brake releases and then rises from 0 (no jump). A 40 ms release debounce on the brake can only lengthen braking.
7. **Safest behavior after disconnect:** cut throttle immediately, apply a moderate fail-safe brake (0.6, never lower than the player's own braking), keep it until input is back **and** the player presses the brake once. The parking brake is not engaged automatically: it's a separate system the player controls, and an automatic parking brake at speed is unsafe.
8. **Response curves for ordinary automatic driving:** a held accelerator rises linearly 0 → 1 over 2.5 s. The powertrain's own throttle curve (exponent 1.7) then makes the first second gentle, like easing onto the pedal. Release takes 0.25 s. The brake applies 0.3 at once, then reaches 1.0 after 1.2 s (light stop → firm stop). Release takes 0.1 s. Creep in D does the rest at parking speeds. All of these are tunable.
9. **PC vs Android:** on PC the keyboard is reliable and focus loss is common (alt-tab). On Android: keyboards arrive over OTG or Bluetooth; Bluetooth adds latency and can sleep; some phones map or swallow keys (Esc/Back, media keys); the app pauses when backgrounded. Keyboard layout names differ (stored only to warn about a different keyboard). Touch and keyboard work at the same time in the Input System. **All of this needs real-device testing.**
10. **A simpler architecture?** A dedicated USB foot switch or pedal set is far more reliable than a keyboard (designed for feet, no ghosting, fixed keys). The code is ready for it (`IPedalDevice`). Within the keyboard approach, the design is already the simple version: OR per pedal, one state machine, one mapping file. More complex options were rejected: inferring physical key positions, or per-key weighting.

## Architecture

```
Keyboard (Input System)
  └ KeyboardPedalDevice : IPedalDevice   raw keys → BrakeDown / AcceleratorDown (logical OR), active key lists
       │                                  (future: USB foot switches, analog pedal sets)
  PedalInputManager : IDrivingInputSource  focus/disconnect detection, mapping + status, key reservation
       └ PedalStateMachine (Core)          brake priority, simulated travel, debounce, re-engage delay, fail-safe
  VehicleInputRouter                        merges all sources (max), brake override → VehicleController
  PedalCalibrationWizard (UI)               PedalAttemptRecorder → PedalCalibrationAnalyzer → PedalValidationSession
  DrivingHUDController (UI)                 lamps, amount bars, conflict / fail-safe / status text
  PedalKeyMapping + SaveManager             persistentDataPath/pedal_key_mapping.json
```

`PedalInputManager` exposes `BrakePressed`, `AcceleratorPressed`, `BrakeAmount`,
`AcceleratorAmount`, `ActiveBrakeKeys`, `ActiveAcceleratorKeys`, `CalibrationStatus`
(NotCalibrated / Unvalidated / Validated / KeyboardChanged), plus `Conflict`,
`AcceleratorSuppressed` and `Safety` (Normal / FailSafe / AwaitingRearm).

Keys are stored by Input System `Key` name, which identifies a **physical position** (US
reference), not the printed character. So the mapping works across layouts. Mapped keys are
reserved while the pedals are active, so they never trigger shortcuts. **The parking brake then has
the on-screen (P) button**, in case Space became a pedal key.

## Calibration flow (Pause → 페달 보정)

1. **브레이크**: 5 press-and-release cycles. Shows progress dots, keys being pressed, and warnings for missed releases and possible merged presses.
2. **가속**: 5 cycles.
3. **키 확인**: proposed sets plus a table per key (presses seen / key-down events for each pedal, ambiguous, missed release, assignment). Manual editing: press a key to add or remove it. Optionally include one-off keys.
4. **실제 테스트**: big 브레이크 BRAKE / 가속 ACCELERATOR indicators; shows the keys detected right now, mapped keys, unmapped keys and conflicts. 3 clean brake presses, then 3 clean accelerator presses. Any press that activates the wrong pedal fails. More than 1 press that hits only unmapped keys fails.
5. **저장** appears only after the test passes.

The intro screen also offers **현재 설정 확인** (review/edit the saved mapping), **기본값으로 초기화**
(middle letter block = brake, arrows/navigation/numpad = accelerator; unvalidated until tested)
and **발 페달 끄기/켜기**. The wizard opens by itself on the first run when a keyboard is
present and nothing is calibrated. **닫기** marks it done.

## Inspector settings

`PedalInputManager`:

| Setting | Default | Meaning |
|---|---|---|
| Pedals Enabled | on | Master switch. |
| Allow Unvalidated Mapping | **off** | Only validated mappings drive the car. |
| Fail Safe On Focus Loss | on | Losing app focus is treated like losing the keyboard. |
| Response › Accelerator Rise Time | 2.5 s | Holding time for 0 → max. |
| Response › Accelerator Release Time | 0.25 s | max → 0 after release. |
| Response › Accelerator Max While Held | 1.0 | Cap on simulated accelerator travel. |
| Response › Accelerator Instant Full | off | Arcade-style jump to max. |
| Response › Brake Initial Amount | 0.3 | Applied immediately on press. |
| Response › Brake Ramp Time | 1.2 s | Initial → 1.0 while held. |
| Response › Brake Release Time | 0.1 s | 1.0 → 0 after release. |
| Response › Brake Release Debounce | 0.04 s | Bridges key chatter (only extends braking). |
| Response › Accelerator Re-engage Delay | 0.12 s | After a brake/accelerator overlap. |
| Response › Fail Safe Brake | 0.6 | Brake while input is lost. |

`PedalCalibrationWizard`:

| Setting | Default |
|---|---|
| Attempts Per Pedal | 5 |
| Min Occurrences | 2 |
| Release Gap Seconds (grouping interval) | 0.2 |
| Stuck Key Seconds | 3 |
| Dominance Margin | 2 |
| Validation Presses | 3 |
| Max Missed Presses | 1 |

## Physical setup (software can't fix these)

- **A standard keyboard isn't built for body weight.** Keep the **heel on the floor** and press
  with the ball of the foot, lightly, as if resting it on a pedal. Never stand on it.
- Put a **non-slip rubber mat** under it (rug pad or shelf liner). Tape or clamp the mat to the floor, not the keys.
- Prefer a **low-profile** keyboard: less tipping, shorter travel, easier on the ankle. Mechanical
  keyboards with **N-key rollover** report simultaneous keys far better than membrane ones.
- If you add a support (a board or frame), it must stay **clear of key travel** and not touch the keycaps.
- Route the **cable** along the floor away from the heel and chair wheels. A wired USB/OTG keyboard
  is more dependable than Bluetooth (no sleep or reconnects).
- Socks or thin soles give better feel than shoes. Stop if your ankle or knee gets uncomfortable.
- Expect wear on keycaps and switches. Use a spare keyboard.

## Platform notes

**PC (Editor/Standalone):** Active Input Handling = Input System (or Both). Alt-tab or clicking another
window triggers the fail-safe; press the brake once after returning. A hand keyboard and a floor
keyboard both feed `Keyboard.current`. Pedal keys on either one work as pedals.

**Android:** connect the keyboard (OTG or Bluetooth) **before** launching, then run calibration on the
device. Check that every key you calibrated is reported (some phones remap or swallow keys), how
Bluetooth latency feels, and what happens when the keyboard sleeps or the app goes to background.
None of this has been tested.

## Test plan

**Automated, run:** browser preview, `node Tools/browser-preview/run-tests.js` (instructions in the
file). Headless Chromium with simulated keys, mouse and touch: **79/79 passed**. That's
Unity↔preview config-equality checks (read from the C# source), circular steering checks and
calibration/validation/pedal checks.

**Automated, not run:** Unity EditMode tests (`Tests/EditMode`), which need Unity.

| # | Case | Covered by | Status |
|---|---|---|---|
| 1 | One brake key | preview test; `PedalStateMachineTests` | preview ✅ / Unity not run |
| 2 | Several brake keys | preview | ✅ (same pedal; amount from hold time) |
| 3 | One accelerator key | preview; EditMode | ✅ / not run |
| 4 | Several accelerator keys | preview | ✅ |
| 5 | Brake + accelerator | preview; EditMode | ✅ / not run |
| 6 | Rapid switching | preview; EditMode (re-engage) | ✅ / not run |
| 7 | One key held, another released | preview | ✅ |
| 8 | Keyboard disconnect while accelerating | EditMode (input-loss path); **hardware** | browser can't detect unplugging, so simulated as focus loss ✅. Real unplug: **not tested** |
| 9 | Focus loss | preview (blur event); EditMode | ✅ / not run |
| 10 | Inconsistent calibration presses | preview; `PedalCalibrationTests` | ✅ / not run |
| 11 | Overlapping calibration sets | preview; EditMode | ✅ / not run |
| 12 | Presses outside the regions | preview (driving + validation) | ✅ |
| 13 | Steering while braking | preview (middle-mouse circle); emulated touch circle separately | ✅ (real touchscreen not tested) |
| 14 | Middle-mouse steering while accelerating | preview | ✅ |
| 15 | Android external keyboard | **hardware only** | not tested |
| 16 | Restart after saving | preview (reload, localStorage); Unity uses a JSON file | ✅ / Unity not run |
| — | Physical keyboard with feet, ghosting, slipping | **hardware only** | not tested |
