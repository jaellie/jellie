using System;
using UnityEngine;

namespace DrivingSim.Core
{
    [Serializable]
    public class BrakeSettings
    {
        [Tooltip("Total service brake torque (Nm, all four wheels) at full pedal. No ABS: very high values lock the wheels.")]
        [Min(0f)] public float maxServiceBrakeTorqueNm = 3400f;

        [Tooltip("Share of service brake torque on the front axle.")]
        [Range(0f, 1f)] public float frontBias = 0.65f;

        [Tooltip("Pedal response curve. Above 1 = progressive, softer at light pedal.")]
        [Range(1f, 3f)] public float brakeExponent = 1.4f;

        [Tooltip("Parking brake torque per rear wheel (Nm).")]
        [Min(0f)] public float parkingBrakeTorquePerRearWheelNm = 1600f;

        [Tooltip("P (parking pawl approximation): brake torque per driven wheel (Nm).")]
        [Min(0f)] public float parkLockTorquePerDrivenWheelNm = 5000f;
    }

    public static class BrakeModel
    {
        public static float ServiceBrakeTorqueTotal(BrakeSettings s, float brake01)
        {
            float pedal = SimMath.Clamp01(brake01);
            if (pedal <= 0f) return 0f;
            return s.maxServiceBrakeTorqueNm * (float)Math.Pow(pedal, s.brakeExponent);
        }

        public static void SplitPerWheel(BrakeSettings s, float totalTorque, out float frontPerWheel, out float rearPerWheel)
        {
            frontPerWheel = totalTorque * s.frontBias * 0.5f;
            rearPerWheel = totalTorque * (1f - s.frontBias) * 0.5f;
        }
    }
}
