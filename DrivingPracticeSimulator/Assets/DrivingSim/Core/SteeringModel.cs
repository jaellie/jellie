using System;
using UnityEngine;

namespace DrivingSim.Core
{
    [Serializable]
    public class SteeringSettings
    {
        [Header("Ratio")]
        [Tooltip("Steering wheel rotation limit in degrees from center. 540 = 1.5 turns each way, 3 turns lock to lock.")]
        [Range(90f, 1080f)] public float maxSteeringWheelAngleDeg = 540f;

        [Tooltip("Inner front-wheel angle limit in degrees. With Ackermann on, the outer wheel turns less.")]
        [Range(10f, 50f)] public float maxFrontWheelAngleDeg = 35f;

        [Tooltip("If on, the ratio is maxSteeringWheelAngle / maxFrontWheelAngle so full lock lines up with the wheel limit.")]
        public bool deriveRatioFromLimits = true;

        [Tooltip("Steering wheel degrees per front-wheel degree. Used when deriveRatioFromLimits is off.")]
        [Range(8f, 30f)] public float steeringRatio = 540f / 35f;

        [Header("Speed-dependent response")]
        [Tooltip("Speed (km/h) at which the steering response starts to be reduced.")]
        [Min(0f)] public float speedSensitiveStartKmh = 20f;

        [Tooltip("Speed (km/h) at which the reduction reaches highSpeedSteerScale.")]
        [Min(0f)] public float speedSensitiveEndKmh = 100f;

        [Tooltip("Front-wheel angle multiplier at high speed. A gameplay approximation of reduced lateral response.")]
        [Range(0.1f, 1f)] public float highSpeedSteerScale = 0.45f;

        [Tooltip("Max rate the road wheels can follow the steering wheel (deg/s). 0 = instant.")]
        [Min(0f)] public float frontWheelMaxSlewDegPerSec = 120f;

        [Header("Self-centering (caster approximation)")]
        [Tooltip("Turn off to keep the wheel exactly where the driver leaves it at any speed.")]
        public bool selfCenteringEnabled = true;

        [Tooltip("No self-centering below this speed (km/h): the wheel stays where the driver left it.")]
        [Min(0f)] public float selfCenterMinSpeedKmh = 2f;

        [Tooltip("Self-centering reaches full strength at this speed (km/h).")]
        [Min(0.1f)] public float selfCenterFullSpeedKmh = 30f;

        [Tooltip("Return rate proportional to the current angle (1/s) at full strength.")]
        [Min(0f)] public float selfCenterGainPerSec = 1.0f;

        [Tooltip("Upper bound on the return rate (deg/s) at full strength.")]
        [Min(0f)] public float selfCenterMaxRateDegPerSec = 240f;

        [Tooltip("After the driver lets go (e.g. between hand-over-hand drags), the wheel is still considered held for this long, so consecutive drags accumulate instead of unwinding in between.")]
        [Range(0f, 2f)] public float releaseGraceSeconds = 0.6f;

        [Tooltip("Self-centering multiplier while reversing (caster works against you in reverse).")]
        [Range(0f, 1f)] public float selfCenterReverseFactor = 0.3f;

        [Tooltip("Self-centering multiplier while the driver is actively holding/turning the wheel.")]
        [Range(0f, 1f)] public float selfCenterWhileHeldFactor = 0f;

        [Tooltip("Angles below this (deg) snap to zero once self-centering is active.")]
        [Min(0f)] public float selfCenterSnapDeg = 0.5f;

        [Header("Geometry")]
        [Tooltip("Apply Ackermann geometry so the inner front wheel turns more than the outer one.")]
        public bool useAckermann = true;

        public float EffectiveRatio
        {
            get
            {
                float ratio = deriveRatioFromLimits && maxFrontWheelAngleDeg > 0f
                    ? maxSteeringWheelAngleDeg / maxFrontWheelAngleDeg
                    : steeringRatio;
                return Math.Max(ratio, 0.01f);
            }
        }
    }

    /// <summary>
    /// Steering wheel state and its mapping to a front-wheel angle. The steering wheel angle is
    /// the single source of truth for both physics and the visible cockpit wheel.
    /// Positive angles are clockwise / turning right.
    /// </summary>
    public sealed class SteeringModel
    {
        readonly SteeringSettings settings;

        public SteeringModel(SteeringSettings settings)
        {
            this.settings = settings ?? throw new ArgumentNullException(nameof(settings));
        }

        public SteeringSettings Settings => settings;

        float sinceDriverRelease = float.PositiveInfinity;

        public float SteeringWheelAngleDeg { get; private set; }

        /// <summary>Commanded (inner) front-wheel angle after speed scaling and slew limiting.</summary>
        public float FrontWheelAngleDeg { get; private set; }

        /// <summary>Self-centering strength (0-1) used in the last Tick, for debugging.</summary>
        public float LastSelfCenteringFactor { get; private set; }

        public float NormalizedSteering => SteeringWheelAngleDeg / Math.Max(settings.maxSteeringWheelAngleDeg, 1f);

        public void Reset()
        {
            SteeringWheelAngleDeg = 0f;
            FrontWheelAngleDeg = 0f;
            LastSelfCenteringFactor = 0f;
            sinceDriverRelease = float.PositiveInfinity;
        }

        /// <summary>Rotates the steering wheel by a driver input delta, accumulating and clamping.</summary>
        public void AddDriverRotation(float deltaDeg)
        {
            float max = settings.maxSteeringWheelAngleDeg;
            SteeringWheelAngleDeg = SimMath.Clamp(SteeringWheelAngleDeg + deltaDeg, -max, max);
        }

        public void SetSteeringWheelAngle(float angleDeg)
        {
            float max = settings.maxSteeringWheelAngleDeg;
            SteeringWheelAngleDeg = SimMath.Clamp(angleDeg, -max, max);
        }

        /// <summary>Driver deliberately turns the wheel back toward center.</summary>
        public void ActiveCenter(float rateDegPerSec, float deltaTime)
        {
            SteeringWheelAngleDeg = SimMath.MoveTowards(SteeringWheelAngleDeg, 0f, Math.Max(rateDegPerSec, 0f) * deltaTime);
        }

        public float SelfCenteringFactor(float signedSpeedKmh, bool driverHolding)
        {
            if (!settings.selfCenteringEnabled) return 0f;
            float speed = Math.Abs(signedSpeedKmh);
            float factor = SimMath.SmoothStep01(SimMath.InverseLerp(settings.selfCenterMinSpeedKmh, settings.selfCenterFullSpeedKmh, speed));
            if (speed <= settings.selfCenterMinSpeedKmh) factor = 0f;
            if (signedSpeedKmh < 0f) factor *= settings.selfCenterReverseFactor;
            if (driverHolding) factor *= settings.selfCenterWhileHeldFactor;
            return factor;
        }

        public float SpeedScale(float speedKmh)
        {
            float t = SimMath.InverseLerp(settings.speedSensitiveStartKmh, settings.speedSensitiveEndKmh, Math.Abs(speedKmh));
            return SimMath.Lerp(1f, settings.highSpeedSteerScale, t);
        }

        /// <summary>Front-wheel angle the given steering wheel angle asks for at this speed.</summary>
        public float TargetFrontWheelAngle(float steeringWheelAngleDeg, float signedSpeedKmh)
        {
            float angle = steeringWheelAngleDeg / settings.EffectiveRatio * SpeedScale(signedSpeedKmh);
            float max = settings.maxFrontWheelAngleDeg;
            return SimMath.Clamp(angle, -max, max);
        }

        /// <summary>Advances self-centering and the road-wheel response.</summary>
        public void Tick(float deltaTime, float signedSpeedKmh, bool driverHolding)
        {
            if (deltaTime <= 0f) return;

            // Hands stay on the wheel briefly between drags (hand-over-hand), so treat it as held.
            sinceDriverRelease = driverHolding ? 0f : sinceDriverRelease + deltaTime;
            bool held = driverHolding || sinceDriverRelease < settings.releaseGraceSeconds;

            float factor = SelfCenteringFactor(signedSpeedKmh, held);
            LastSelfCenteringFactor = factor;
            if (factor > 0f && SteeringWheelAngleDeg != 0f)
            {
                float magnitude = Math.Abs(SteeringWheelAngleDeg);
                float rate = Math.Min(magnitude * settings.selfCenterGainPerSec, settings.selfCenterMaxRateDegPerSec) * factor;
                SteeringWheelAngleDeg = SimMath.MoveTowards(SteeringWheelAngleDeg, 0f, rate * deltaTime);
                if (Math.Abs(SteeringWheelAngleDeg) < settings.selfCenterSnapDeg) SteeringWheelAngleDeg = 0f;
            }

            float target = TargetFrontWheelAngle(SteeringWheelAngleDeg, signedSpeedKmh);
            FrontWheelAngleDeg = settings.frontWheelMaxSlewDegPerSec > 0f
                ? SimMath.MoveTowards(FrontWheelAngleDeg, target, settings.frontWheelMaxSlewDegPerSec * deltaTime)
                : target;
        }
    }
}
