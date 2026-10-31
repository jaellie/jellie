namespace DrivingSim.Core
{
    /// <summary>Automatic transmission selector positions, in lever order P-R-N-D.</summary>
    public enum TransmissionGear
    {
        P = 0,
        R = 1,
        N = 2,
        D = 3,
    }

    public enum ShiftResult
    {
        Accepted,
        AlreadyInGear,
        /// <summary>The shift interlock requires the service brake to be applied.</summary>
        BrakeRequired,
        /// <summary>The vehicle is moving too fast for the requested shift.</summary>
        SpeedTooHigh,
    }
}
