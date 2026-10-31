using DrivingSim.Core;
using DrivingSim.Localization;

namespace DrivingSim.Vehicle
{
    /// <summary>Driver-facing feedback texts in the current language (keys in strings.json).</summary>
    public static class DrivingMessages
    {
        public static string GearName(TransmissionGear gear) => Loc.T("gear.name." + gear);

        public static string ShiftFeedback(TransmissionGear target, ShiftResult result)
        {
            switch (result)
            {
                case ShiftResult.Accepted: return Loc.T("shift.accepted", GearName(target));
                case ShiftResult.BrakeRequired: return Loc.T("shift.brakeRequired");
                case ShiftResult.SpeedTooHigh: return Loc.T(target == TransmissionGear.P ? "shift.stopBeforePark" : "shift.stopBeforeDirection");
                default: return string.Empty;
            }
        }

        public static string ParkingBrake(bool engaged) => Loc.T(engaged ? "parkingBrake.engaged" : "parkingBrake.released");

        public static string ParkingBrakeStillOn => Loc.T("parkingBrake.stillOn");
    }
}
