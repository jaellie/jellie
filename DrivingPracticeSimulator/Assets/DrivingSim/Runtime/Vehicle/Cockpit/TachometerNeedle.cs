using DrivingSim.Core;
using UnityEngine;

namespace DrivingSim.Vehicle
{
    /// <summary>
    /// Display-only tachometer for the 3D cluster. The powertrain model has no engine speed, so this derives a
    /// plausible rpm from gear, speed and throttle. It never feeds back into physics.
    /// </summary>
    public class TachometerNeedle : MonoBehaviour
    {
        [SerializeField] VehicleController vehicle;
        [SerializeField] Transform needle;
        [Min(1000f)] public float maxRpm = 8000f;
        [Range(90f, 300f)] public float sweepDeg = 240f;
        public float idleRpm = 750f;
        [Min(0.01f)] public float smoothing = 0.25f;
        float rpm;

        public void Configure(VehicleController target, Transform needlePivot)
        {
            vehicle = target;
            needle = needlePivot;
            rpm = idleRpm;
        }

        void LateUpdate()
        {
            if (vehicle == null || needle == null || !vehicle.IsInitialized) return;
            float speed = Mathf.Abs(vehicle.SignedSpeedKmh), throttle = vehicle.Throttle;
            bool driving = vehicle.Gear == TransmissionGear.D || vehicle.Gear == TransmissionGear.R;
            // Saw-tooth through four virtual ratios when driving; free revving in P/N.
            float target = driving
                ? idleRpm + Mathf.Repeat(speed, 30f) / 30f * 2200f + throttle * 1400f + Mathf.Min(speed, 120f) * 6f
                : idleRpm + throttle * 3500f;
            rpm = Mathf.Lerp(rpm, Mathf.Min(target, maxRpm), 1f - Mathf.Exp(-Time.deltaTime / smoothing));
            needle.localRotation = Quaternion.Euler(0f, 0f, -DialMath.NeedleAngle(rpm, maxRpm, sweepDeg));
        }
    }
}
