using System;

namespace DrivingSim.Core
{
    public enum TurnSignal
    {
        Off,
        Left,
        Right,
    }

    /// <summary>
    /// Turn signal state with automatic cancel: once the steering wheel has been turned past
    /// <see cref="ArmAngleDeg"/> in the signalled direction, returning it below
    /// <see cref="CancelAngleDeg"/> switches the signal off, like a real stalk.
    /// </summary>
    public sealed class TurnSignalModel
    {
        bool armed;

        public TurnSignal Signal { get; private set; }
        public bool Hazard { get; private set; }
        public float ArmAngleDeg { get; set; } = 90f;
        public float CancelAngleDeg { get; set; } = 20f;
        public bool AutoCancel { get; set; } = true;

        public bool LeftActive => Hazard || Signal == TurnSignal.Left;
        public bool RightActive => Hazard || Signal == TurnSignal.Right;

        public void Toggle(TurnSignal signal)
        {
            Signal = Signal == signal ? TurnSignal.Off : signal;
            armed = false;
        }

        public void SetSignal(TurnSignal signal)
        {
            Signal = signal;
            armed = false;
        }

        public void ToggleHazard() => Hazard = !Hazard;

        /// <summary>Returns true if the signal was auto-cancelled by this update.</summary>
        public bool UpdateSteering(float steeringWheelAngleDeg)
        {
            if (!AutoCancel || Signal == TurnSignal.Off) return false;
            float towardSignal = Signal == TurnSignal.Right ? steeringWheelAngleDeg : -steeringWheelAngleDeg;
            if (towardSignal >= ArmAngleDeg) armed = true;
            else if (armed && towardSignal <= CancelAngleDeg)
            {
                Signal = TurnSignal.Off;
                armed = false;
                return true;
            }
            return false;
        }

        /// <summary>Lamp phase for a symmetric blink (on for the first half of each period).</summary>
        public static bool BlinkPhase(float time, float periodSeconds)
        {
            if (periodSeconds <= 0f) return true;
            float t = time % periodSeconds;
            if (t < 0f) t += periodSeconds;
            return t < periodSeconds * 0.5f;
        }
    }
}
