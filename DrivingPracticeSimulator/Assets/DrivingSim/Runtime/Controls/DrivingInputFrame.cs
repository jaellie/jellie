using DrivingSim.Core;

namespace DrivingSim.Controls
{
    /// <summary>
    /// Device-independent driver input for one frame. Sources write into it additively:
    /// steering deltas add up, pedals combine with max, flags combine with OR, discrete
    /// requests use the last writer.
    /// </summary>
    public struct DrivingInputFrame
    {
        /// <summary>Steering wheel rotation to add this frame (deg, positive = clockwise).</summary>
        public float SteerDeltaDeg;

        /// <summary>The driver is holding/turning the wheel (suppresses self-centering).</summary>
        public bool SteerHeld;

        /// <summary>When above 0 the driver actively turns the wheel back to center at this rate (deg/s).</summary>
        public float CenterSteeringRateDegPerSec;

        public float Throttle;
        public float Brake;

        public TransmissionGear? GearRequest;

        /// <summary>-1 moves the lever toward P, +1 toward D.</summary>
        public int GearStep;

        public bool ToggleParkingBrake;
        public bool ResetVehicle;
    }

    /// <summary>
    /// Implemented by keyboard now, and later by touch steering / mobile pedal controllers.
    /// </summary>
    public interface IDrivingInputSource
    {
        void PollInput(float deltaTime, ref DrivingInputFrame frame);
    }
}
