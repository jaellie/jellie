using System;
using UnityEngine;

namespace DrivingSim.Core
{
    [Serializable]
    public class ResistanceSettings
    {
        [Tooltip("Rolling resistance coefficient (typical car tire on asphalt: about 0.010-0.015).")]
        [Range(0f, 0.05f)] public float rollingResistanceCoefficient = 0.012f;

        [Tooltip("Aerodynamic drag coefficient Cd.")]
        [Range(0f, 1f)] public float dragCoefficient = 0.30f;

        [Tooltip("Frontal area (m^2).")]
        [Min(0f)] public float frontalAreaM2 = 2.2f;

        [Tooltip("Air density (kg/m^3).")]
        [Min(0f)] public float airDensity = 1.225f;

        [Tooltip("Rolling resistance fades in over this speed (m/s) to avoid jitter at standstill.")]
        [Min(0.01f)] public float lowSpeedFadeMs = 0.3f;
    }

    public static class ResistanceModel
    {
        /// <summary>Signed rolling resistance force (N) along the forward axis, always opposing motion.</summary>
        public static float RollingResistanceForce(ResistanceSettings s, float massKg, float gravity, float signedSpeedMs)
        {
            float speed = Math.Abs(signedSpeedMs);
            if (speed < 1e-4f) return 0f;
            float magnitude = s.rollingResistanceCoefficient * massKg * gravity * SimMath.Clamp01(speed / s.lowSpeedFadeMs);
            return -Math.Sign(signedSpeedMs) * magnitude;
        }

        /// <summary>Signed aerodynamic drag force (N) along the forward axis.</summary>
        public static float AerodynamicDragForce(ResistanceSettings s, float signedSpeedMs)
        {
            float magnitude = 0.5f * s.airDensity * s.dragCoefficient * s.frontalAreaM2 * signedSpeedMs * signedSpeedMs;
            return -Math.Sign(signedSpeedMs) * magnitude;
        }
    }
}
