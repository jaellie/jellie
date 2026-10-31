using System;
using UnityEngine;

namespace DrivingSim.Core
{
    public enum DriveLayout
    {
        FrontWheelDrive,
        RearWheelDrive,
        AllWheelDrive,
    }

    /// <summary>
    /// Effective single-ratio drivetrain: forces are total tractive force at the tire contact patches.
    /// This is a tunable approximation, not a model of a specific engine or gearbox.
    /// </summary>
    [Serializable]
    public class PowertrainSettings
    {
        public DriveLayout driveLayout = DriveLayout.FrontWheelDrive;

        [Header("Accelerator")]
        [Tooltip("Total tractive force (N) at full throttle and low speed.")]
        [Min(0f)] public float maxDriveForceN = 4400f;

        [Tooltip("Power limit (kW) at the wheels. Force is capped at power / speed.")]
        [Min(1f)] public float maxPowerKW = 85f;

        [Tooltip("Pedal response curve. Above 1 = gentler at small pedal travel.")]
        [Range(1f, 3f)] public float throttleExponent = 1.7f;

        [Tooltip("Soft forward speed limit (km/h).")]
        [Min(1f)] public float forwardMaxSpeedKmh = 170f;

        [Header("Reverse")]
        [Tooltip("Tractive force multiplier in R.")]
        [Range(0.1f, 1f)] public float reverseForceScale = 0.6f;

        [Tooltip("Soft reverse speed limit (km/h).")]
        [Min(1f)] public float reverseMaxSpeedKmh = 20f;

        [Header("Torque converter creep")]
        [Tooltip("Creep force (N) at standstill with the brake released and no throttle. Must exceed rolling resistance to move.")]
        [Min(0f)] public float creepForceN = 450f;

        [Tooltip("Creep force fades linearly to zero at this speed (km/h). The equilibrium creep speed is lower because of resistance.")]
        [Min(0.1f)] public float creepFadeSpeedKmh = 9f;

        [Tooltip("Creep multiplier in R.")]
        [Range(0f, 1.5f)] public float reverseCreepScale = 0.8f;

        [Header("Coasting")]
        [Tooltip("Engine-braking force (N) in D with the throttle released, well above creep speed.")]
        [Min(0f)] public float coastDragForceN = 150f;
    }

    public static class PowertrainModel
    {
        /// <summary>
        /// Total longitudinal tractive force (N) along the vehicle's forward axis.
        /// Positive pushes forward. Zero in P and N.
        /// </summary>
        public static float DriveForce(PowertrainSettings s, TransmissionGear gear, float throttle01, float signedSpeedMs)
        {
            if (gear != TransmissionGear.D && gear != TransmissionGear.R) return 0f;

            float direction = gear == TransmissionGear.D ? 1f : -1f;
            float speedAlongGear = signedSpeedMs * direction;
            float throttle = SimMath.Clamp01(throttle01);

            float force = CreepForce(s, gear, speedAlongGear)
                          + ThrottleForce(s, gear, throttle, speedAlongGear)
                          + (gear == TransmissionGear.D ? CoastForce(s, throttle, speedAlongGear) : 0f);
            return direction * force;
        }

        /// <param name="speedAlongGearMs">Speed in the gear's direction of travel (negative if rolling the other way).</param>
        public static float CreepForce(PowertrainSettings s, TransmissionGear gear, float speedAlongGearMs)
        {
            float fadeSpeed = s.creepFadeSpeedKmh * SimMath.KmhToMs;
            if (fadeSpeed <= 0f) return 0f;
            float scale = gear == TransmissionGear.R ? s.reverseCreepScale : 1f;
            return s.creepForceN * scale * SimMath.Clamp01(1f - Math.Max(speedAlongGearMs, 0f) / fadeSpeed);
        }

        public static float ThrottleForce(PowertrainSettings s, TransmissionGear gear, float throttle01, float speedAlongGearMs)
        {
            if (throttle01 <= 0f) return 0f;

            float shaped = (float)Math.Pow(throttle01, s.throttleExponent);
            float force = s.maxDriveForceN * shaped;
            float speed = Math.Max(speedAlongGearMs, 0f);

            float power = s.maxPowerKW * 1000f * shaped;
            if (speed > 0.5f) force = Math.Min(force, power / speed);

            bool reverse = gear == TransmissionGear.R;
            if (reverse) force *= s.reverseForceScale;

            float maxSpeed = (reverse ? s.reverseMaxSpeedKmh : s.forwardMaxSpeedKmh) * SimMath.KmhToMs;
            float band = maxSpeed * (reverse ? 0.25f : 0.1f);
            force *= SimMath.Clamp01((maxSpeed - speed) / Math.Max(band, 0.01f));
            return force;
        }

        /// <summary>Negative (decelerating) force when coasting in D above creep speed.</summary>
        public static float CoastForce(PowertrainSettings s, float throttle01, float speedAlongGearMs)
        {
            if (throttle01 > 0.02f) return 0f;
            float creepSpeed = s.creepFadeSpeedKmh * SimMath.KmhToMs;
            if (speedAlongGearMs <= creepSpeed || creepSpeed <= 0f) return 0f;
            return -s.coastDragForceN * SimMath.Clamp01((speedAlongGearMs - creepSpeed) / creepSpeed);
        }

        public static bool IsDriven(DriveLayout layout, bool frontAxle)
        {
            switch (layout)
            {
                case DriveLayout.FrontWheelDrive: return frontAxle;
                case DriveLayout.RearWheelDrive: return !frontAxle;
                default: return true;
            }
        }
    }
}
