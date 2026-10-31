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
| 9 | **Steering response** | Stopped: hold D for 2 s. Then drive at 10, 30, 60 km/h with the same input. | Wheel goes to +720° in 2 s and stays when released while stopped. Road wheel cmd 35° at low speed, smaller at 60 km/h. No snapping | 35° → ≈ 30° at 60 km/h | |
| 10 | **Self-centering** | At ≈ 25 km/h turn the wheel ≈ +300°, release. Repeat at 5 km/h and while reversing. | Returns to 0 within ≈ 1–2 s at 25 km/h. Very slowly at 5 km/h. Weakly in reverse. Never past center | | |
| 11 | **Turning radius** | Full lock (720°), creep in D around the turning circle. Use V for top-down. | Path is a steady circle. Overlay "Turn radius" min vs geometric | geometric: rear axle ≈ 4.6 m, outer front wheel ≈ 6.0 m | |
| 12 | **Reverse and turn** | In R, full lock left and right. | Car reverses along an arc, rear swinging as expected. Self-centering weak | | |
| 13 | **Low-speed parking** | Reverse into a bay with creep and light brake only. | Speed can be held at 1–3 km/h. Car stops exactly where braking begins. Steering stays put while stopped | | |
| 14 | **Slope hold** | Drive onto the ramp, stop, select P (brake held), release brake. Then try N + parking brake. | Both hold. In N without PB the car rolls back slowly | | |
| 15 | **Collisions** | Drive slowly into the block, then the end wall. | Collision count increments once per impact. Car doesn't launch or tunnel | | |
| 16 | **Reset** | Backspace. | Car back at spawn, P, PB on, steering 0 | | |

## EditMode unit tests

**Window → General → Test Runner → EditMode → Run All.** They cover the transmission
interlocks, steering accumulation/clamping/self-centering/speed scaling, creep/throttle/brake
curves, resistance signs and Ackermann symmetry (`Assets/DrivingSim/Tests/EditMode`).

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
