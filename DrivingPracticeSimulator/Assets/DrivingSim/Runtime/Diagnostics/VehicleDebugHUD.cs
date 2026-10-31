using System.Text;
using DrivingSim.Controls;
using DrivingSim.Core;
using DrivingSim.Vehicle;
using UnityEngine;

namespace DrivingSim.Diagnostics
{
    /// <summary>
    /// Developer telemetry overlay (IMGUI) for Milestone 1 physics validation. Not the player HUD.
    /// F1 toggles it. Korean feedback lines rely on the OS font fallback for IMGUI.
    /// </summary>
    public class VehicleDebugHUD : MonoBehaviour
    {
        [SerializeField] VehicleController vehicle;
        [SerializeField] VehicleTestProbe probe;
        [SerializeField] bool visible = true;
        [Tooltip("Show shift/parking-brake feedback even when the overlay is hidden (off when the driving HUD shows it).")]
        [SerializeField] bool feedbackWhenHidden = true;
        [SerializeField] float feedbackSeconds = 3f;

        readonly StringBuilder text = new StringBuilder(1024);
        GUIStyle style;
        GUIStyle feedbackStyle;
        string feedback = string.Empty;
        float feedbackTime = float.NegativeInfinity;

        public void SetVisibility(bool overlayVisible, bool feedbackWhileHidden)
        {
            visible = overlayVisible;
            feedbackWhenHidden = feedbackWhileHidden;
        }

        public void Bind(VehicleController target, VehicleTestProbe testProbe)
        {
            Unsubscribe();
            vehicle = target;
            probe = testProbe;
            Subscribe();
        }

        void OnEnable() => Subscribe();
        void OnDisable() => Unsubscribe();

        void Subscribe()
        {
            if (vehicle == null) return;
            vehicle.GearChanged += OnGearChanged;
            vehicle.ShiftRejected += OnShiftRejected;
            vehicle.ParkingBrakeChanged += OnParkingBrakeChanged;
        }

        void Unsubscribe()
        {
            if (vehicle == null) return;
            vehicle.GearChanged -= OnGearChanged;
            vehicle.ShiftRejected -= OnShiftRejected;
            vehicle.ParkingBrakeChanged -= OnParkingBrakeChanged;
        }

        void OnGearChanged(TransmissionGear gear) => ShowFeedback(DrivingMessages.ShiftFeedback(gear, ShiftResult.Accepted));
        void OnShiftRejected(TransmissionGear gear, ShiftResult result) => ShowFeedback(DrivingMessages.ShiftFeedback(gear, result) + $"  ({result})");
        void OnParkingBrakeChanged(bool engaged) => ShowFeedback(DrivingMessages.ParkingBrake(engaged));

        void ShowFeedback(string message)
        {
            feedback = message;
            feedbackTime = Time.time;
        }

        void Update()
        {
            if (KeyboardShim.WasPressed(KeyId.F1)) visible = !visible;
        }

        void OnGUI()
        {
            if (vehicle == null || !vehicle.IsInitialized) return;

            float scale = Mathf.Max(Screen.height / 720f, 0.75f);
            GUI.matrix = Matrix4x4.Scale(new Vector3(scale, scale, 1f));
            EnsureStyles();

            bool showFeedback = (visible || feedbackWhenHidden) && Time.time - feedbackTime < feedbackSeconds;
            bool parkingBrakeWarning = (visible || feedbackWhenHidden) && vehicle.ParkingBrakeEngaged && vehicle.Throttle > 0.1f
                                       && (vehicle.Gear == TransmissionGear.D || vehicle.Gear == TransmissionGear.R);
            float screenWidth = Screen.width / scale;
            if (showFeedback || parkingBrakeWarning)
            {
                string line = parkingBrakeWarning ? DrivingMessages.ParkingBrakeStillOn : feedback;
                GUI.Label(new Rect(screenWidth * 0.5f - 300f, 16f, 600f, 34f), line, feedbackStyle);
            }

            if (!visible)
            {
                GUI.Label(new Rect(10f, Screen.height / scale - 30f, 300f, 24f), "F1: telemetry", style);
                return;
            }

            BuildText();
            GUI.Box(new Rect(8f, 8f, 430f, 512f), GUIContent.none);
            GUI.Label(new Rect(16f, 12f, 420f, 508f), text.ToString(), style);
        }

        void BuildText()
        {
            text.Clear();
            text.AppendLine($"Speed      {vehicle.SignedSpeedKmh,7:F1} km/h");
            text.AppendLine($"Gear       {vehicle.Gear}    Parking brake: {(vehicle.ParkingBrakeEngaged ? "ON" : "off")}");
            text.AppendLine($"Throttle   {Bar(vehicle.Throttle)} {vehicle.Throttle:F2}");
            text.AppendLine($"Brake      {Bar(vehicle.Brake)} {vehicle.Brake:F2}");
            text.AppendLine($"Wheel      {vehicle.SteeringWheelAngleDeg,7:F0}° / ±{vehicle.MaxSteeringWheelAngleDeg:F0}°  ratio {vehicle.SteeringRatio:F1}:1");
            text.AppendLine($"Road wheel cmd {vehicle.CommandedFrontWheelAngleDeg,6:F1}°  L {vehicle.LeftFrontAngleDeg:F1}°  R {vehicle.RightFrontAngleDeg:F1}°");
            text.AppendLine($"Self-center {vehicle.SelfCenteringFactor:F2}  holding: {(vehicle.IsDriverSteering ? "yes" : "no")}");
            text.AppendLine($"Drive force {vehicle.DriveForceN,7:F0} N   Brake {vehicle.ServiceBrakeTorqueNm,5:F0} Nm");
            text.AppendLine($"Collisions {vehicle.CollisionCount}");

            if (probe != null)
            {
                text.AppendLine();
                text.AppendLine("— Measurements —");
                text.AppendLine(probe.IsCreeping
                    ? $"Creep now: peak {probe.CreepPeakKmh:F1} km/h"
                    : $"Creep last peak: {probe.LastCreepPeakKmh:F1} km/h");
                text.AppendLine(probe.BrakeTestActive
                    ? $"Braking from {probe.BrakeStartSpeedKmh:F1} km/h…"
                    : probe.HasBrakeResult
                        ? $"Brake {probe.LastBrakeStartSpeedKmh:F1}→0 km/h: {probe.LastBrakeDistanceM:F2} m, {probe.LastBrakeTimeS:F2} s"
                        : "Brake test: drive >2 km/h, release W, hold S");
                text.AppendLine(probe.HasAccelResult
                    ? $"0→{probe.accelerationTargetKmh:F0} km/h: {probe.LastAccelTimeS:F2} s"
                    : $"0→{probe.accelerationTargetKmh:F0} km/h: hold W from standstill");
                text.AppendLine($"Turn radius (COM) now {Radius(probe.MeasuredTurningRadiusM)}  min {Radius(probe.MinMeasuredTurningRadiusM)}");
                text.AppendLine($"Geometric: rear axle {Radius(probe.GeometricRearAxleRadiusM)}, outer wheel {Radius(probe.GeometricOuterWheelRadiusM)}");
            }

            text.AppendLine();
            text.AppendLine("W/↑ accel  S/↓ brake  A D/←→ steer  C center");
            text.AppendLine("Shift: gentle pedals   1 P  2 R  3 N  4 D   Q/E lever");
            text.AppendLine("Space parking brake  Backspace reset");
            text.AppendLine("V 1st/3rd person  T top-down  Z/X look L/R  [ ] FOV");
            text.AppendLine(", . signals  H hazard  L lights  K wipers  Esc pause");
        }

        static string Radius(float meters) => float.IsInfinity(meters) || meters > 999f ? "—" : $"{meters:F2} m";

        static string Bar(float value)
        {
            int filled = Mathf.RoundToInt(Mathf.Clamp01(value) * 10f);
            return "[" + new string('#', filled) + new string('·', 10 - filled) + "]";
        }

        void EnsureStyles()
        {
            if (style != null) return;
            style = new GUIStyle(GUI.skin.label) { fontSize = 14, richText = false };
            style.normal.textColor = Color.white;
            feedbackStyle = new GUIStyle(GUI.skin.box) { fontSize = 18, alignment = TextAnchor.MiddleCenter };
            feedbackStyle.normal.textColor = new Color(1f, 0.92f, 0.4f);
        }
    }
}
