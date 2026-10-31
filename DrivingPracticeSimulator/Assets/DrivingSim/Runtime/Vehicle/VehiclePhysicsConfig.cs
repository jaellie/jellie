using System;
using DrivingSim.Core;
using UnityEngine;

namespace DrivingSim.Vehicle
{
    [Serializable]
    public class TireFrictionSettings
    {
        [Min(0.001f)] public float extremumSlip = 0.4f;
        [Min(0f)] public float extremumValue = 1f;
        [Min(0.001f)] public float asymptoteSlip = 0.8f;
        [Min(0f)] public float asymptoteValue = 0.5f;
        [Min(0f)] public float stiffness = 1f;

        public TireFrictionSettings() { }

        public TireFrictionSettings(float extremumSlip, float extremumValue, float asymptoteSlip, float asymptoteValue, float stiffness)
        {
            this.extremumSlip = extremumSlip;
            this.extremumValue = extremumValue;
            this.asymptoteSlip = asymptoteSlip;
            this.asymptoteValue = asymptoteValue;
            this.stiffness = stiffness;
        }

        public WheelFrictionCurve ToCurve() => new WheelFrictionCurve
        {
            extremumSlip = extremumSlip,
            extremumValue = extremumValue,
            asymptoteSlip = asymptoteSlip,
            asymptoteValue = asymptoteValue,
            stiffness = stiffness,
        };
    }

    /// <summary>
    /// All tunable vehicle parameters. Defaults are prototype values for a generic compact
    /// automatic sedan; they are not calibrated against a real vehicle.
    /// </summary>
    [CreateAssetMenu(menuName = "DrivingSim/Vehicle Physics Config", fileName = "VehiclePhysicsConfig")]
    public class VehiclePhysicsConfig : ScriptableObject
    {
        [Header("Body")]
        [Min(100f)] public float massKg = 1300f;
        [Tooltip("Center of mass in vehicle-root local space (root origin = ground level, between the axles).")]
        public Vector3 centerOfMassLocal = new Vector3(0f, 0.5f, 0.1f);
        [Min(0f)] public float angularDamping = 0.05f;

        [Header("Dimensions (used by the primitive vehicle builder)")]
        [Min(1f)] public float wheelbaseM = 2.65f;
        [Min(0.5f)] public float trackWidthM = 1.55f;

        [Header("Wheels & suspension")]
        [Min(0.1f)] public float wheelRadiusM = 0.31f;
        [Min(1f)] public float wheelMassKg = 18f;
        [Min(0f)] public float wheelDampingRate = 0.25f;
        [Min(0.01f)] public float suspensionDistanceM = 0.18f;
        [Min(0f)] public float springStrength = 35000f;
        [Min(0f)] public float damperStrength = 3500f;
        [Range(0f, 1f)] public float suspensionTargetPosition = 0.5f;
        [Tooltip("Lower values move the suspension force point up toward the body (more roll); higher values reduce roll.")]
        public float forceAppPointDistanceM = 0.1f;

        [Header("Tires")]
        public TireFrictionSettings forwardFriction = new TireFrictionSettings(0.4f, 1f, 0.8f, 0.5f, 1f);
        public TireFrictionSettings sidewaysFriction = new TireFrictionSettings(0.2f, 1f, 0.5f, 0.75f, 1f);

        [Header("WheelCollider substeps")]
        [Min(0f)] public float substepSpeedThresholdMs = 5f;
        [Min(1)] public int substepsBelowThreshold = 12;
        [Min(1)] public int substepsAboveThreshold = 15;

        [Header("Systems")]
        public SteeringSettings steering = new SteeringSettings();
        public TransmissionSettings transmission = new TransmissionSettings();
        public PowertrainSettings powertrain = new PowertrainSettings();
        public BrakeSettings brakes = new BrakeSettings();
        public ResistanceSettings resistance = new ResistanceSettings();

        [Header("Feedback")]
        [Tooltip("Collisions with a relative speed below this (m/s) are not counted.")]
        [Min(0f)] public float collisionMinRelativeSpeedMs = 0.5f;

        [Header("Editor")]
        [Tooltip("Re-apply body/wheel settings every physics step in the Editor so Inspector edits take effect in Play Mode.")]
        public bool liveApplyInEditor = true;
    }
}
