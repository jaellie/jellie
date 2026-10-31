using DrivingSim.Core;
using DrivingSim.Vehicle;
using UnityEngine;

namespace DrivingSim.Diagnostics
{
    /// <summary>
    /// Measures prototype behavior in Play Mode: creep speed, braking distance, 0-30 km/h time
    /// and turning radius. Results are also written to the Console.
    /// These are measurements of the simulation, not real-world vehicle figures.
    /// </summary>
    public class VehicleTestProbe : MonoBehaviour
    {
        [SerializeField] VehicleController vehicle;
        [SerializeField] bool logToConsole = true;

        [Tooltip("Speed (km/h) that ends the acceleration timer.")]
        [Min(1f)] public float accelerationTargetKmh = 30f;

        // Creep
        public float CreepPeakKmh { get; private set; }
        public float LastCreepPeakKmh { get; private set; }
        public bool IsCreeping { get; private set; }

        // Braking
        public bool BrakeTestActive { get; private set; }
        public float BrakeStartSpeedKmh { get; private set; }
        public float LastBrakeStartSpeedKmh { get; private set; }
        public float LastBrakeDistanceM { get; private set; }
        public float LastBrakeTimeS { get; private set; }
        public bool HasBrakeResult { get; private set; }

        // Acceleration
        public bool AccelTestActive { get; private set; }
        public float LastAccelTimeS { get; private set; }
        public bool HasAccelResult { get; private set; }

        // Turning
        public float MeasuredTurningRadiusM { get; private set; } = float.PositiveInfinity;
        public float MinMeasuredTurningRadiusM { get; private set; } = float.PositiveInfinity;
        public float GeometricRearAxleRadiusM { get; private set; } = float.PositiveInfinity;
        public float GeometricOuterWheelRadiusM { get; private set; } = float.PositiveInfinity;

        Vector3 brakeStartPosition;
        float brakeStartTime;
        float accelStartTime;

        public void SetVehicle(VehicleController target) => vehicle = target;

        public void ResetResults()
        {
            CreepPeakKmh = LastCreepPeakKmh = 0f;
            HasBrakeResult = HasAccelResult = false;
            BrakeTestActive = AccelTestActive = false;
            MinMeasuredTurningRadiusM = float.PositiveInfinity;
        }

        void FixedUpdate()
        {
            if (vehicle == null || !vehicle.IsInitialized) return;

            float speedKmh = vehicle.SignedSpeedKmh;
            float absKmh = Mathf.Abs(speedKmh);
            UpdateCreep(absKmh);
            UpdateBraking(absKmh);
            UpdateAcceleration(absKmh);
            UpdateTurning();
        }

        void UpdateCreep(float absKmh)
        {
            TransmissionGear gear = vehicle.Gear;
            bool creeping = (gear == TransmissionGear.D || gear == TransmissionGear.R)
                            && vehicle.Throttle <= 0.001f && vehicle.Brake <= 0.001f && !vehicle.ParkingBrakeEngaged;

            if (creeping)
            {
                if (!IsCreeping) CreepPeakKmh = 0f;
                CreepPeakKmh = Mathf.Max(CreepPeakKmh, absKmh);
            }
            else if (IsCreeping && CreepPeakKmh > 0.1f)
            {
                LastCreepPeakKmh = CreepPeakKmh;
                if (logToConsole) Debug.Log($"[TestProbe] Creep ({gear}) peak speed: {LastCreepPeakKmh:F1} km/h");
            }
            IsCreeping = creeping;
        }

        void UpdateBraking(float absKmh)
        {
            if (!BrakeTestActive)
            {
                if (vehicle.Brake > 0.05f && vehicle.Throttle < 0.02f && absKmh > 2f)
                {
                    BrakeTestActive = true;
                    BrakeStartSpeedKmh = absKmh;
                    brakeStartPosition = vehicle.Body.position;
                    brakeStartTime = Time.time;
                }
                return;
            }

            if (vehicle.Throttle > 0.05f || vehicle.Brake <= 0.001f)
            {
                BrakeTestActive = false; // aborted
                return;
            }

            if (absKmh < 0.1f)
            {
                BrakeTestActive = false;
                Vector3 delta = vehicle.Body.position - brakeStartPosition;
                delta.y = 0f;
                LastBrakeStartSpeedKmh = BrakeStartSpeedKmh;
                LastBrakeDistanceM = delta.magnitude;
                LastBrakeTimeS = Time.time - brakeStartTime;
                HasBrakeResult = true;
                if (logToConsole)
                    Debug.Log($"[TestProbe] Braking {LastBrakeStartSpeedKmh:F1} km/h -> 0: {LastBrakeDistanceM:F2} m in {LastBrakeTimeS:F2} s");
            }
        }

        void UpdateAcceleration(float absKmh)
        {
            if (!AccelTestActive)
            {
                if (absKmh < 0.3f && vehicle.Throttle > 0.05f && vehicle.Brake < 0.01f
                    && (vehicle.Gear == TransmissionGear.D || vehicle.Gear == TransmissionGear.R))
                {
                    AccelTestActive = true;
                    accelStartTime = Time.time;
                }
                return;
            }

            if (vehicle.Brake > 0.05f || vehicle.Throttle <= 0.001f)
            {
                AccelTestActive = false;
                return;
            }

            if (absKmh >= accelerationTargetKmh)
            {
                AccelTestActive = false;
                LastAccelTimeS = Time.time - accelStartTime;
                HasAccelResult = true;
                if (logToConsole) Debug.Log($"[TestProbe] 0 -> {accelerationTargetKmh:F0} km/h: {LastAccelTimeS:F2} s");
            }
        }

        void UpdateTurning()
        {
            float inner = Mathf.Max(Mathf.Abs(vehicle.LeftFrontAngleDeg), Mathf.Abs(vehicle.RightFrontAngleDeg));
            GeometricRearAxleRadiusM = AckermannGeometry.RearAxleTurningRadius(inner, vehicle.Wheelbase, vehicle.TrackWidth);
            GeometricOuterWheelRadiusM = AckermannGeometry.OuterFrontWheelRadius(inner, vehicle.Wheelbase, vehicle.TrackWidth);

            float yawRate = Mathf.Abs(vehicle.Body.angularVelocity.y);
            float speed = Mathf.Abs(vehicle.SignedSpeedMs);
            if (yawRate > 0.02f && speed > 0.3f)
            {
                // Path radius of the center of mass; compare with the rear-axle figure.
                MeasuredTurningRadiusM = speed / yawRate;
                MinMeasuredTurningRadiusM = Mathf.Min(MinMeasuredTurningRadiusM, MeasuredTurningRadiusM);
            }
            else
            {
                MeasuredTurningRadiusM = float.PositiveInfinity;
            }
        }
    }
}
