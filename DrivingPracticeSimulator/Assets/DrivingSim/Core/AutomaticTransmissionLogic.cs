using System;
using UnityEngine;

namespace DrivingSim.Core
{
    [Serializable]
    public class TransmissionSettings
    {
        [Tooltip("Brake pedal position (0-1) that counts as 'brake applied' for the shift interlock.")]
        [Range(0.05f, 1f)] public float brakeAppliedThreshold = 0.2f;

        [Tooltip("Below this speed (km/h) the vehicle counts as stopped.")]
        [Min(0f)] public float stoppedSpeedKmh = 1f;

        [Tooltip("Shifting into P is only allowed below this speed (km/h). Approximates the parking pawl limit.")]
        [Min(0f)] public float maxSpeedForParkKmh = 1f;

        [Tooltip("Engaging D while rolling backward, or R while rolling forward, is only allowed below this speed (km/h).")]
        [Min(0f)] public float maxSpeedForDirectionChangeKmh = 2f;

        [Tooltip("Shift lock: the brake must be applied to move the lever out of P.")]
        public bool requireBrakeToLeavePark = true;

        [Tooltip("Training rule: the brake must be applied to select P.")]
        public bool requireBrakeToEnterPark = true;

        [Tooltip("Training rule: when stopped, the brake must be applied to engage D or R.")]
        public bool requireBrakeToEngageWhenStopped = true;
    }

    /// <summary>
    /// Selector-lever state machine with shift interlocks. Engine-free so it can be unit tested.
    /// Shifts between N and D while rolling forward are allowed without the brake, as in most cars.
    /// </summary>
    public sealed class AutomaticTransmissionLogic
    {
        readonly TransmissionSettings settings;

        public TransmissionGear Gear { get; private set; }

        public AutomaticTransmissionLogic(TransmissionSettings settings, TransmissionGear initialGear = TransmissionGear.P)
        {
            this.settings = settings ?? throw new ArgumentNullException(nameof(settings));
            Gear = initialGear;
        }

        /// <summary>Checks whether a shift would be accepted without changing the gear.</summary>
        /// <param name="brake01">Service brake pedal position 0-1.</param>
        /// <param name="signedSpeedKmh">Forward speed in km/h, negative when rolling backward.</param>
        public ShiftResult Evaluate(TransmissionGear target, float brake01, float signedSpeedKmh)
        {
            if (target == Gear) return ShiftResult.AlreadyInGear;

            bool brakeApplied = brake01 >= settings.brakeAppliedThreshold;
            float speed = Math.Abs(signedSpeedKmh);
            bool stopped = speed <= settings.stoppedSpeedKmh;

            if (Gear == TransmissionGear.P && settings.requireBrakeToLeavePark && !brakeApplied)
                return ShiftResult.BrakeRequired;

            switch (target)
            {
                case TransmissionGear.P:
                    if (speed > settings.maxSpeedForParkKmh) return ShiftResult.SpeedTooHigh;
                    if (settings.requireBrakeToEnterPark && !brakeApplied) return ShiftResult.BrakeRequired;
                    return ShiftResult.Accepted;

                case TransmissionGear.N:
                    return ShiftResult.Accepted;

                case TransmissionGear.R:
                    if (signedSpeedKmh > settings.maxSpeedForDirectionChangeKmh) return ShiftResult.SpeedTooHigh;
                    if (stopped && settings.requireBrakeToEngageWhenStopped && !brakeApplied) return ShiftResult.BrakeRequired;
                    return ShiftResult.Accepted;

                case TransmissionGear.D:
                    if (signedSpeedKmh < -settings.maxSpeedForDirectionChangeKmh) return ShiftResult.SpeedTooHigh;
                    if (stopped && settings.requireBrakeToEngageWhenStopped && !brakeApplied) return ShiftResult.BrakeRequired;
                    return ShiftResult.Accepted;

                default:
                    return ShiftResult.AlreadyInGear;
            }
        }

        public ShiftResult RequestShift(TransmissionGear target, float brake01, float signedSpeedKmh)
        {
            ShiftResult result = Evaluate(target, brake01, signedSpeedKmh);
            if (result == ShiftResult.Accepted) Gear = target;
            return result;
        }

        /// <summary>Sets the gear without interlock checks (vehicle reset, mission setup).</summary>
        public void ForceGear(TransmissionGear gear) => Gear = gear;

        /// <summary>Moves one lever position: negative toward P, positive toward D.</summary>
        public static TransmissionGear Step(TransmissionGear gear, int direction)
        {
            int index = Math.Clamp((int)gear + Math.Sign(direction), (int)TransmissionGear.P, (int)TransmissionGear.D);
            return (TransmissionGear)index;
        }
    }
}
