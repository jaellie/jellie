using DrivingSim.Core;
using UnityEngine;

namespace DrivingSim.Controls
{
    /// <summary>
    /// Keyboard driver input for physics validation. Pedals ramp so binary keys still give
    /// progressive throttle and brake. Releasing the steering keys leaves the wheel where it is.
    /// </summary>
    public class KeyboardDrivingInput : MonoBehaviour, IDrivingInputSource
    {
        [Header("Steering")]
        [Tooltip("Steering wheel rotation speed while A/D or arrow keys are held (deg/s).")]
        [Min(1f)] public float steerRateDegPerSec = 270f; // center to full lock (540°) in 2 s
        [Tooltip("Rate at which C turns the wheel back to center (deg/s).")]
        [Min(1f)] public float centerRateDegPerSec = 540f;

        [Header("Accelerator (W / Up)")]
        [Min(0.01f)] public float throttleRisePerSec = 0.8f;
        [Min(0.01f)] public float throttleFallPerSec = 3f;
        [Tooltip("Throttle cap while Left Shift is held, for gentle parking-speed control.")]
        [Range(0.05f, 1f)] public float gentleThrottleCap = 0.3f;

        [Header("Brake (S / Down)")]
        [Min(0.01f)] public float brakeRisePerSec = 2f;
        [Min(0.01f)] public float brakeFallPerSec = 4f;
        [Tooltip("Brake cap while Left Shift is held.")]
        [Range(0.05f, 1f)] public float gentleBrakeCap = 0.35f;

        float throttle;
        float brake;

        public void PollInput(float deltaTime, ref DrivingInputFrame frame)
        {
            float steer = 0f;
            if (KeyboardShim.IsDown(KeyId.A) || KeyboardShim.IsDown(KeyId.Left)) steer -= 1f;
            if (KeyboardShim.IsDown(KeyId.D) || KeyboardShim.IsDown(KeyId.Right)) steer += 1f;
            if (steer != 0f)
            {
                frame.SteerDeltaDeg += steer * steerRateDegPerSec * deltaTime;
                frame.SteerHeld = true;
            }

            if (KeyboardShim.IsDown(KeyId.C))
                frame.CenterSteeringRateDegPerSec = Mathf.Max(frame.CenterSteeringRateDegPerSec, centerRateDegPerSec);

            bool gentle = KeyboardShim.IsDown(KeyId.LeftShift);
            throttle = Ramp(throttle, KeyboardShim.IsDown(KeyId.W) || KeyboardShim.IsDown(KeyId.Up),
                gentle ? gentleThrottleCap : 1f, throttleRisePerSec, throttleFallPerSec, deltaTime);
            brake = Ramp(brake, KeyboardShim.IsDown(KeyId.S) || KeyboardShim.IsDown(KeyId.Down),
                gentle ? gentleBrakeCap : 1f, brakeRisePerSec, brakeFallPerSec, deltaTime);

            frame.Throttle = Mathf.Max(frame.Throttle, throttle);
            frame.Brake = Mathf.Max(frame.Brake, brake);

            if (KeyboardShim.WasPressed(KeyId.Digit1)) frame.GearRequest = TransmissionGear.P;
            if (KeyboardShim.WasPressed(KeyId.Digit2)) frame.GearRequest = TransmissionGear.R;
            if (KeyboardShim.WasPressed(KeyId.Digit3)) frame.GearRequest = TransmissionGear.N;
            if (KeyboardShim.WasPressed(KeyId.Digit4)) frame.GearRequest = TransmissionGear.D;
            if (KeyboardShim.WasPressed(KeyId.Q)) frame.GearStep -= 1;
            if (KeyboardShim.WasPressed(KeyId.E)) frame.GearStep += 1;

            if (KeyboardShim.WasPressed(KeyId.Space)) frame.ToggleParkingBrake = true;
            if (KeyboardShim.WasPressed(KeyId.Comma)) frame.TurnSignalToggle = -1;
            if (KeyboardShim.WasPressed(KeyId.Period)) frame.TurnSignalToggle = 1;
            if (KeyboardShim.WasPressed(KeyId.H)) frame.ToggleHazard = true;
            if (KeyboardShim.WasPressed(KeyId.L)) frame.ToggleHeadlights = true;
            if (KeyboardShim.WasPressed(KeyId.K)) frame.CycleWipers = true;
            if (KeyboardShim.WasPressed(KeyId.Backspace)) frame.ResetVehicle = true;
        }

        static float Ramp(float current, bool pressed, float cap, float rise, float fall, float dt)
        {
            if (!pressed) return Mathf.MoveTowards(current, 0f, fall * dt);
            return current > cap
                ? Mathf.MoveTowards(current, cap, fall * dt)
                : Mathf.MoveTowards(current, cap, rise * dt);
        }

        void OnDisable()
        {
            throttle = 0f;
            brake = 0f;
        }
    }
}
