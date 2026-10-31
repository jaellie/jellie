using System;
using DrivingSim.Controls;
using DrivingSim.Core;
using UnityEngine;

namespace DrivingSim.Vehicle
{
    /// <summary>
    /// Applies driver input to a Rigidbody + WheelCollider vehicle. All longitudinal motion
    /// comes from motor torque, brake torque and resistance forces; velocity is never set directly
    /// (except on reset).
    /// </summary>
    [RequireComponent(typeof(Rigidbody))]
    [DefaultExecutionOrder(-10)]
    public class VehicleController : MonoBehaviour
    {
        [SerializeField] VehiclePhysicsConfig config;
        [SerializeField] VehicleWheel[] wheels = Array.Empty<VehicleWheel>();
        [SerializeField] TransmissionGear startGear = TransmissionGear.P;
        [SerializeField] bool startWithParkingBrake = true;

        public event Action<TransmissionGear> GearChanged;
        public event Action<TransmissionGear, ShiftResult> ShiftRejected;
        public event Action<bool> ParkingBrakeChanged;
        public event Action<Collision> Collided;

        Rigidbody body;
        SteeringModel steering;
        AutomaticTransmissionLogic transmission;
        bool initialized;

        float throttle;
        float brake;
        bool driverSteering;
        bool parkingBrake;
        Vector3 spawnPosition;
        Quaternion spawnRotation;

        public VehiclePhysicsConfig Config => config;
        public Rigidbody Body => body;
        public bool IsInitialized => initialized;
        public VehicleWheel[] Wheels => wheels;

        public TransmissionGear Gear => transmission != null ? transmission.Gear : startGear;
        public float SignedSpeedMs { get; private set; }
        public float SignedSpeedKmh => SignedSpeedMs * SimMath.MsToKmh;
        public float Throttle => throttle;
        public float Brake => brake;
        public bool ParkingBrakeEngaged => parkingBrake;
        public bool IsDriverSteering => driverSteering;

        public float SteeringWheelAngleDeg => steering != null ? steering.SteeringWheelAngleDeg : 0f;
        public float MaxSteeringWheelAngleDeg => config != null ? config.steering.maxSteeringWheelAngleDeg : 720f;
        public float CommandedFrontWheelAngleDeg => steering != null ? steering.FrontWheelAngleDeg : 0f;
        public float SelfCenteringFactor => steering != null ? steering.LastSelfCenteringFactor : 0f;
        public float SteeringRatio => config != null ? config.steering.EffectiveRatio : 0f;
        public float LeftFrontAngleDeg { get; private set; }
        public float RightFrontAngleDeg { get; private set; }

        public float Wheelbase { get; private set; }
        public float TrackWidth { get; private set; }
        public float DriveForceN { get; private set; }
        public float ServiceBrakeTorqueNm { get; private set; }
        public int CollisionCount { get; private set; }

        public ShiftResult LastShiftResult { get; private set; } = ShiftResult.AlreadyInGear;
        public TransmissionGear LastShiftTarget { get; private set; }
        public float LastShiftTime { get; private set; } = float.NegativeInfinity;

        /// <summary>Used by builders before the GameObject is activated.</summary>
        public void Configure(VehiclePhysicsConfig physicsConfig, VehicleWheel[] vehicleWheels)
        {
            config = physicsConfig;
            wheels = vehicleWheels ?? Array.Empty<VehicleWheel>();
        }

        void Awake()
        {
            body = GetComponent<Rigidbody>();
            if (config == null)
            {
                Debug.LogError($"{nameof(VehicleController)} on '{name}' has no {nameof(VehiclePhysicsConfig)} assigned.", this);
                enabled = false;
                return;
            }

            ApplyBodySettings();
            ApplyWheelSettings();
            ComputeGeometry();

            steering = new SteeringModel(config.steering);
            transmission = new AutomaticTransmissionLogic(config.transmission, startGear);
            parkingBrake = startWithParkingBrake;
            spawnPosition = transform.position;
            spawnRotation = transform.rotation;
            initialized = true;
        }

        [ContextMenu("Re-apply Physics Config")]
        public void ApplyPhysicsConfig()
        {
            if (body == null) body = GetComponent<Rigidbody>();
            if (config == null) return;
            ApplyBodySettings();
            ApplyWheelSettings();
            ComputeGeometry();
        }

        void ApplyBodySettings()
        {
            body.mass = config.massKg;
            body.linearDamping = 0f;
            body.angularDamping = config.angularDamping;
            body.centerOfMass = config.centerOfMassLocal;
            body.interpolation = RigidbodyInterpolation.Interpolate;
            body.collisionDetectionMode = CollisionDetectionMode.Continuous;
        }

        void ApplyWheelSettings()
        {
            foreach (VehicleWheel wheel in wheels)
            {
                WheelCollider wc = wheel.collider;
                if (wc == null) continue;
                wc.radius = config.wheelRadiusM;
                wc.mass = config.wheelMassKg;
                wc.wheelDampingRate = config.wheelDampingRate;
                wc.suspensionDistance = config.suspensionDistanceM;
                wc.forceAppPointDistance = config.forceAppPointDistanceM;
                wc.suspensionSpring = new JointSpring
                {
                    spring = config.springStrength,
                    damper = config.damperStrength,
                    targetPosition = config.suspensionTargetPosition,
                };
                wc.forwardFriction = config.forwardFriction.ToCurve();
                wc.sidewaysFriction = config.sidewaysFriction.ToCurve();
            }

            if (wheels.Length > 0 && wheels[0].collider != null)
            {
                // Applies to every WheelCollider on this rigidbody.
                wheels[0].collider.ConfigureVehicleSubsteps(config.substepSpeedThresholdMs, config.substepsBelowThreshold, config.substepsAboveThreshold);
            }
        }

        void ComputeGeometry()
        {
            float frontZ = 0f, rearZ = 0f, frontLeftX = 0f, frontRightX = 0f;
            int front = 0, rear = 0, frontLeft = 0, frontRight = 0;
            foreach (VehicleWheel wheel in wheels)
            {
                if (wheel.collider == null) continue;
                Vector3 local = transform.InverseTransformPoint(wheel.collider.transform.position);
                if (wheel.IsFront)
                {
                    frontZ += local.z; front++;
                    if (wheel.isLeft) { frontLeftX += local.x; frontLeft++; }
                    else { frontRightX += local.x; frontRight++; }
                }
                else
                {
                    rearZ += local.z; rear++;
                }
            }

            Wheelbase = front > 0 && rear > 0 ? Mathf.Abs(frontZ / front - rearZ / rear) : config.wheelbaseM;
            TrackWidth = frontLeft > 0 && frontRight > 0 ? Mathf.Abs(frontRightX / frontRight - frontLeftX / frontLeft) : config.trackWidthM;
        }

        /// <summary>Receives the merged driver input for this frame from <see cref="VehicleInputRouter"/>.</summary>
        public void SetInput(in DrivingInputFrame input)
        {
            if (!initialized) return;

            if (input.ResetVehicle)
            {
                ResetVehicle();
                return;
            }

            throttle = Mathf.Clamp01(input.Throttle);
            brake = Mathf.Clamp01(input.Brake);

            driverSteering = input.SteerHeld || input.CenterSteeringRateDegPerSec > 0f;
            if (input.SteerDeltaDeg != 0f) steering.AddDriverRotation(input.SteerDeltaDeg);
            if (input.CenterSteeringRateDegPerSec > 0f) steering.ActiveCenter(input.CenterSteeringRateDegPerSec, Time.deltaTime);

            if (input.GearRequest.HasValue) RequestGear(input.GearRequest.Value);
            if (input.GearStep != 0) RequestGear(AutomaticTransmissionLogic.Step(Gear, input.GearStep));
            if (input.ToggleParkingBrake) SetParkingBrake(!parkingBrake);
        }

        public ShiftResult RequestGear(TransmissionGear target)
        {
            if (!initialized) return ShiftResult.AlreadyInGear;

            ShiftResult result = transmission.RequestShift(target, brake, SignedSpeedKmh);
            if (result == ShiftResult.AlreadyInGear) return result;

            LastShiftResult = result;
            LastShiftTarget = target;
            LastShiftTime = Time.time;

            if (result == ShiftResult.Accepted) GearChanged?.Invoke(target);
            else ShiftRejected?.Invoke(target, result);
            return result;
        }

        public void SetParkingBrake(bool engaged)
        {
            if (parkingBrake == engaged) return;
            parkingBrake = engaged;
            ParkingBrakeChanged?.Invoke(engaged);
        }

        public void SetSpawnPose(Vector3 position, Quaternion rotation)
        {
            spawnPosition = position;
            spawnRotation = rotation;
        }

        [ContextMenu("Reset Vehicle")]
        public void ResetVehicle()
        {
            if (!initialized) return;

            body.linearVelocity = Vector3.zero;
            body.angularVelocity = Vector3.zero;
            body.position = spawnPosition;
            body.rotation = spawnRotation;
            transform.SetPositionAndRotation(spawnPosition, spawnRotation);

            throttle = 0f;
            brake = 0f;
            driverSteering = false;
            steering.Reset();
            transmission.ForceGear(startGear);
            SetParkingBrake(startWithParkingBrake);
            CollisionCount = 0;
            SignedSpeedMs = 0f;
            GearChanged?.Invoke(startGear);
        }

        void Update()
        {
            if (!initialized) return;
            steering.Tick(Time.deltaTime, SignedSpeedKmh, driverSteering);
            UpdateWheelVisuals();
        }

        void FixedUpdate()
        {
            if (!initialized) return;

#if UNITY_EDITOR
            if (config.liveApplyInEditor) ApplyPhysicsConfig();
#endif

            SignedSpeedMs = Vector3.Dot(body.linearVelocity, transform.forward);

            ApplySteering();
            ApplyDriveAndBrakes();
            ApplyResistance();
            CaptureWheelPoses();
        }

        void ApplySteering()
        {
            float commanded = steering.FrontWheelAngleDeg;
            float left = commanded, right = commanded;
            if (config.steering.useAckermann)
                AckermannGeometry.Compute(commanded, Wheelbase, TrackWidth, out left, out right);

            LeftFrontAngleDeg = left;
            RightFrontAngleDeg = right;

            foreach (VehicleWheel wheel in wheels)
            {
                if (wheel.collider == null) continue;
                wheel.collider.steerAngle = wheel.IsFront ? (wheel.isLeft ? left : right) : 0f;
            }
        }

        void ApplyDriveAndBrakes()
        {
            TransmissionGear gear = transmission.Gear;
            PowertrainSettings powertrain = config.powertrain;
            BrakeSettings brakes = config.brakes;

            DriveForceN = PowertrainModel.DriveForce(powertrain, gear, throttle, SignedSpeedMs);

            int drivenCount = 0;
            foreach (VehicleWheel wheel in wheels)
                if (wheel.collider != null && PowertrainModel.IsDriven(powertrain.driveLayout, wheel.IsFront)) drivenCount++;

            float torquePerDrivenWheel = drivenCount > 0 ? DriveForceN * config.wheelRadiusM / drivenCount : 0f;

            ServiceBrakeTorqueNm = BrakeModel.ServiceBrakeTorqueTotal(brakes, brake);
            BrakeModel.SplitPerWheel(brakes, ServiceBrakeTorqueNm, out float frontBrake, out float rearBrake);

            foreach (VehicleWheel wheel in wheels)
            {
                WheelCollider wc = wheel.collider;
                if (wc == null) continue;

                bool driven = PowertrainModel.IsDriven(powertrain.driveLayout, wheel.IsFront);
                wc.motorTorque = driven ? torquePerDrivenWheel : 0f;

                float brakeTorque = wheel.IsFront ? frontBrake : rearBrake;
                if (parkingBrake && !wheel.IsFront) brakeTorque += brakes.parkingBrakeTorquePerRearWheelNm;
                if (gear == TransmissionGear.P && driven) brakeTorque += brakes.parkLockTorquePerDrivenWheelNm;
                wc.brakeTorque = brakeTorque;
            }

            if (Mathf.Abs(DriveForceN) > 0.01f && body.IsSleeping()) body.WakeUp();
        }

        void ApplyResistance()
        {
            bool grounded = false;
            foreach (VehicleWheel wheel in wheels)
            {
                if (wheel.collider != null && wheel.collider.isGrounded) { grounded = true; break; }
            }

            float force = ResistanceModel.AerodynamicDragForce(config.resistance, SignedSpeedMs);
            if (grounded)
                force += ResistanceModel.RollingResistanceForce(config.resistance, body.mass, Physics.gravity.magnitude, SignedSpeedMs);

            if (force != 0f) body.AddForce(transform.forward * force, ForceMode.Force);
        }

        void CaptureWheelPoses()
        {
            Quaternion inverseBodyRotation = Quaternion.Inverse(body.rotation);
            foreach (VehicleWheel wheel in wheels)
            {
                if (wheel.collider == null || wheel.visual == null) continue;
                wheel.collider.GetWorldPose(out Vector3 position, out Quaternion rotation);
                wheel.poseLocalPosition = inverseBodyRotation * (position - body.position);
                wheel.poseLocalRotation = inverseBodyRotation * rotation;
                wheel.hasPose = true;
            }
        }

        void UpdateWheelVisuals()
        {
            // Apply physics-time poses relative to the interpolated root so wheels don't jitter.
            foreach (VehicleWheel wheel in wheels)
            {
                if (!wheel.hasPose || wheel.visual == null) continue;
                wheel.visual.SetPositionAndRotation(
                    transform.TransformPoint(wheel.poseLocalPosition),
                    transform.rotation * wheel.poseLocalRotation);
            }
        }

        void OnCollisionEnter(Collision collision)
        {
            if (!initialized) return;
            if (collision.relativeVelocity.magnitude < config.collisionMinRelativeSpeedMs) return;
            CollisionCount++;
            Collided?.Invoke(collision);
        }
    }
}
