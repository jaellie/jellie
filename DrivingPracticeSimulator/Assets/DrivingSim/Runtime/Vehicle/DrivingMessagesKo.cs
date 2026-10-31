using DrivingSim.Core;

namespace DrivingSim.Vehicle
{
    /// <summary>Korean driver-facing feedback strings. UI presentation will move to a localization table later.</summary>
    public static class DrivingMessagesKo
    {
        public static string GearName(TransmissionGear gear)
        {
            switch (gear)
            {
                case TransmissionGear.P: return "P (주차)";
                case TransmissionGear.R: return "R (후진)";
                case TransmissionGear.N: return "N (중립)";
                case TransmissionGear.D: return "D (주행)";
                default: return gear.ToString();
            }
        }

        public static string ShiftFeedback(TransmissionGear target, ShiftResult result)
        {
            switch (result)
            {
                case ShiftResult.Accepted:
                    return $"{GearName(target)}로 변속했습니다.";
                case ShiftResult.BrakeRequired:
                    return "브레이크 페달을 밟은 상태에서 변속하세요.";
                case ShiftResult.SpeedTooHigh:
                    return target == TransmissionGear.P
                        ? "차량이 완전히 정지한 뒤 P로 변속하세요."
                        : "진행 방향을 바꾸려면 먼저 완전히 정지하세요.";
                default:
                    return string.Empty;
            }
        }

        public static string ParkingBrake(bool engaged) => engaged ? "주차 브레이크 체결" : "주차 브레이크 해제";

        public const string ParkingBrakeStillOn = "주차 브레이크가 체결되어 있습니다. 해제 후 출발하세요.";
    }
}
