# Milestone 1 Test Procedures

Run in **Play Mode** in `Assets/DrivingSim/Scenes/PhysicsTest.unity`. The telemetry overlay (F1)
shows live values, and `VehicleTestProbe` logs measurements to the Console.

The "expected" numbers come from a point-mass calculation using the same formulas and default
config. WheelCollider tire slip, suspension and substeps will move them, so treat them as
**sanity ranges for the simulation, not real-vehicle figures**. Write the measured values in
the right-hand column.

Test ground layout (spawn at the origin, facing +Z / north):
- **Straight lane** straight ahead: 3.5 m wide, cross marks every 5 m, labels every 10 m, wall at 140 m.
- **Parking bays** to the west (−X): six 2.5 m × 5.0 m bays, entrances facing east.
- **Turning circle** to the north-east (35, 40): painted 5 m (white) and 6 m (yellow) radius circles, cone ring at 7.5 m.
- **6 % ramp** to the north-west (−35, 50) with a flat platform.
- Slalom cones at x = 12 m. A block at (8, 15) for low-speed collisions.

| # | Test | Steps | Pass criteria | Expected (sim) | Measured |
|---|------|-------|---------------|----------------|----------|
| 1 | **P holds** | Start (P, parking brake on). Release parking brake (Space). Wait 10 s. | Speed stays 0.0 ± 0.1 km/h | 0 | |
| 2 | **Forward creep** | Hold S → 4 (D) → Space (PB off) → release S. No W. | Car accelerates smoothly by itself and settles at a steady speed. Overlay "Creep" peak | ≈ 5–6 km/h, steady in ≈ 10 s | |
| 3 | **Brake holds creep** | During test 2, hold Shift+S (brake 0.35). | Car stops smoothly and stays stopped in D | stops within ≈ 1 m | |
| 4 | **Reverse creep** | Stopped, hold S → 2 (R) → release S. | Car creeps backward, steady | ≈ 5 km/h | |
| 5 | **Gear-change safety** | a) In P with brake released, press 4. b) Drive at > 5 km/h in D, press 1. c) At > 5 km/h in D, press 2. d) Stopped in N, no brake, press 4. | All four rejected with a Korean message: a, d "브레이크 페달을 밟은 상태에서 변속하세요." b "…완전히 정지한 뒤 P로…" c "…먼저 완전히 정지하세요." Gear unchanged | rejected | |
| 6 | **N transmits no drive** | Stopped in N, PB off, hold W. | No movement | 0 | |
| 7 | **Progressive acceleration** | From a stop in D, hold W (full). Repeat with Shift+W. | Smooth rise, no wheel spin. Overlay "0→30 km/h" | full ≈ 2.5–4 s. Shift+W reaches creep + a few km/h slowly | |
| 8 | **Braking distance** | Reach 30 km/h on the lane, release W, hold S (full). Repeat with Shift+S. | Straight, stable stop. Overlay "Brake 30→0" | full ≈ 4–6 m. Shift+S ≈ 15–25 m | |
| 9 | **Steering response** | Stopped: hold D for 2 s. Then drive at 10, 30, 60 km/h with the same input. | Wheel goes to +540° in 2 s and stays when released while stopped. Road wheel cmd 35° at low speed, smaller at 60 km/h. No snapping | 35° → ≈ 30° at 60 km/h | |
| 10 | **Self-centering** | At ≈ 25 km/h turn the wheel ≈ +300°, release. Repeat at 5 km/h and while reversing. | Returns to 0 within ≈ 1–2 s at 25 km/h. Very slowly at 5 km/h. Weakly in reverse. Never past center | | |
| 11 | **Turning radius** | Full lock (540°), creep in D around the turning circle. Use V for top-down. | Path is a steady circle. Overlay "Turn radius" min vs geometric | geometric: rear axle ≈ 4.6 m, outer front wheel ≈ 6.0 m | |
| 12 | **Reverse and turn** | In R, full lock left and right. | Car reverses along an arc, rear swinging as expected. Self-centering weak | | |
| 13 | **Low-speed parking** | Reverse into a bay with creep and light brake only. | Speed can be held at 1–3 km/h. Car stops exactly where braking begins. Steering stays put while stopped | | |
| 14 | **Slope hold** | Drive onto the ramp, stop, select P (brake held), release brake. Then try N + parking brake. | Both hold. In N without PB the car rolls back slowly | | |
| 15 | **Collisions** | Drive slowly into the block, then the end wall. | Collision count increments once per impact. Car doesn't launch or tunnel | | |
| 16 | **Reset** | Backspace. | Car back at spawn, P, PB on, steering 0 | | |

## Phase B: first-person cockpit

Re-run **DrivingSim → Create Physics Test Scene** first (older scenes have no cockpit).

| # | Test | Steps | Pass criteria | Measured |
|---|------|-------|---------------|----------|
| B1 | **View switching** | Press V several times, then T, then V. Also tap the on-screen 1인칭/3인칭 button. | Chase ↔ cockpit each press. T gives top-down. V from top-down goes to the cockpit. No camera jumps after the first frame. Button label shows the *other* view | |
| B2 | **Cockpit framing** | In the cockpit, parked. | Eye on the left seat. Hood and road visible ahead. Gauge cluster visible **above** the wheel rim. Wheel's orange top marker visible. Nothing clipped by the near plane | |
| B3 | **Steering wheel = steering input** | Hold D for 2 s (to +540°), then A back. Compare with the telemetry "Wheel" value. | Wheel turns clockwise for D. Exactly 1.5 turns at +540°. Marker at top at 0°. While moving and released, the wheel unwinds with self-centering | |
| B4 | **Gauges** | Drive 0 → 60 km/h. Shift P/R/N/D. Toggle the parking brake. | Needle at the 60 km/h tick (1/3 of the 240° sweep). Digital speed matches telemetry ±1. Active gear in amber. Red (P) lamp only with the parking brake on | |
| B5 | **Mirrors** | In the cockpit, reverse past cones. Drive past the block. | Rearview shows behind the car. Left/right mirrors show their side and the car's own flank. All are left-right reversed like real mirrors. Exterior glass is plain grey in the chase view | |
| B6 | **Look left/right** | Hold Z / X, or the on-screen ◀ / ▶ buttons. Release. | Head turns ≈70° smoothly while held and returns on release. Steering is unaffected | |
| B7 | **FOV** | Press [ / ] or − / + in the cockpit. Restart Play Mode. | FOV changes in 5° steps within 50–85°. Label updates. Value is remembered | |
| B8 | **Controls unchanged** | Repeat M1 tests 2, 5, 9 in the cockpit view. | Same behavior as in the chase view. Keyboard driving keys never move the camera | |
| B9 | **Multi-touch (device)** | On a phone: hold ◀ with one finger, tap 3인칭 with another. | Both register (buttons act on pointer down) | |
| B10 | **Performance** | Profiler, cockpit vs chase, on the target Android device. | Cockpit adds ≤ 1 extra camera render per frame. Report FPS for both | |

## Controls and HUD (middle mouse, foot pedals, gear selector)

Active Input Handling must include the Input System. Regenerate the scene first.

| # | Test | Steps | Pass criteria | Measured |
|---|------|-------|---------------|----------|
| C1 | **Middle-button circular steering** | See S1–S4. | Bottom indicator shows "· 조향 중" while held | |
| C2 | **Scroll wheel ignored** | Scroll up/down over the road and over buttons. | Nothing changes | |
| C3 | **Middle-click UI** | Middle-click P/R/N/D (with S held), 1인칭, 전조등, the turn arrows. Hold middle on 왼쪽 보기 in the cockpit. | Each acts **once** per click. Look holds while held and stops when you slide off. **No steering** while clicking or holding UI | |
| C4 | **Drag across UI** | Start a middle drag on the road and move it across the gear selector. | Keeps steering. No gear change | |
| C5 | **Keyboard + mouse together** | Hold W (or a foot-pedal key) while middle-drag steering. | Both apply at once | |
| C6 | **No camera movement** | Steer with middle drag and the keyboard in both views. | Camera never rotates from drags (only Z/X or look buttons) | |
| C7 | **Left click unchanged** | Left-click buttons. Left-drag on the road. | Buttons work. Left drag does **not** steer (default) | |
| C8 | **Touchscreen** (device) | Steer with one finger, hold a touch pedal with another, tap a gear with a third. | All three work together. Only the first road finger steers | |
| P1–P16 | **Foot-pedal keyboard** | See the test plan in [PEDALS.md](PEDALS.md) (automated vs. physical-hardware cases). | | |
| G1 | **Gear selector** | Tap R with the brake released. Then hold brake and tap R, N, D, P. Tap P at 10 km/h. | Rejections show Korean messages. Accepted gear turns blue. Physics behaves as before | |
| G2 | **Parking brake button** | Tap the red (P) button under the gear selector, tap again. Then calibrate pedals so Space becomes a pedal key and try again. | Toggles 체결/해제 each tap (red while engaged). Still works when Space is a pedal key. The wizard warns when Space is taken | |
| H1 | **HUD** | Check every HUD element at 16:9 and 20:9 (Game view sizes), and with a notch simulator. | No overlaps. Everything inside the safe area. Indicators blink. Wiper label cycles. Mini-map follows. Pause stops time | |

## Steering (circular gestures, realistic multi-turn)

| # | Test | Steps | Pass criteria | Measured |
|---|------|-------|---------------|----------|
| S1 | One clockwise circle | Middle button down anywhere on the road (not a button), draw one full circle clockwise, release. Repeat small/large and far from the ring. | Wheel ≈ +360° (a few degrees less: the first segment only sets the direction). Cockpit wheel and HUD glyph turn once | |
| S2 | One counter-clockwise circle | Same, counter-clockwise. | Back to 0° | |
| S3 | Multiple circles / full lock | Keep circling clockwise, then counter-clockwise. | Clamps at +540° and −540° (3 turns lock to lock). Front wheels ±35° (inner) | |
| S4 | Release and re-grip | Turn 90°, release, grip on the opposite side of the ring, turn 90°. | +180° total, no jump at the second grip | |
| S5 | ±180° boundary | Circle through the 9 o'clock position (left side). | Smooth, no 360° jump | |
| S5b | Smoothness | Draw slow, wobbly circles by hand. | The wheel (cockpit, HUD glyph, bottom indicator) turns smoothly, never jerks backward while circling one way | |
| S6 | Straight strokes | Drag straight left/right/through the ring center. | ≈ 0°: steering only comes from turning motion | |
| S7 | Small motion | Move a few pixels along the ring. | Proportionally small change (never a left/right step) | |
| S8 | Touch (device) | Same as S1–S4 with a finger. Hold a pedal with another finger. | Same results. Only one pointer steers | |
| S9 | UI conflicts | Start a gesture on a button. Drag a steering gesture over the gear selector. | No steering from buttons. No button presses from a steering gesture. (`Circular` mode only: gestures outside the ring do nothing) | |
| S10 | Release while stopped / moving | Release at ≈ 180° stopped, then at 30 km/h. | Stopped: no change. Moving: held 0.6 s, then smooth return | |
| S11 | U-turn / reverse | Full lock at creep; R with right lock. | Rear-axle path diameter ≈ 9.1 m; nose swings left in reverse | |

The browser preview runs S1–S7, S9–S11 and mouse/touch variants automatically (`Tools/browser-preview`).

## EditMode unit tests

**Window → General → Test Runner → EditMode → Run All.** They cover the transmission
interlocks, steering accumulation/clamping/self-centering/speed scaling, creep/throttle/brake
curves, resistance signs, Ackermann symmetry the speedometer dial mapping, pedal calibration analysis, pedal state machine (brake priority, re-engage delay, fail-safe), validation session, circular steering gestures (ring-center: unwrap, dead zone, jump guard, re-grip; anywhere: loops of any size/position, straight = 0, reversal, jitter), steering release grace and turn-signal auto-cancel (`Assets/DrivingSim/Tests/EditMode`).

## Tuning notes

| Symptom | Try |
|---------|-----|
| Creep too fast/slow | `powertrain.creepForceN` (force at standstill) or `creepFadeSpeedKmh` |
| Car slides or jitters when stopped | Raise `substepsBelowThreshold`. Set Fixed Timestep to 0.01 (Project Settings → Time). Raise `brakes.parkLockTorquePerDrivenWheelNm` |
| Wheels lock under hard braking | Lower `brakes.maxServiceBrakeTorqueNm` or raise `brakeExponent` |
| Body rolls too much / tips in tight turns | Lower `centerOfMassLocal.y`. Raise `forceAppPointDistanceM` |
| Steering feels too quick at speed | Lower `steering.highSpeedSteerScale` or `speedSensitiveStartKmh` |
| Wheel returns too fast/slow | `steering.selfCenterGainPerSec`, `selfCenterMaxRateDegPerSec`, `selfCenterFullSpeedKmh` |
| Understeer at low speed | Raise `sidewaysFriction.stiffness` |
