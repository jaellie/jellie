using System.Collections;
using System.Collections.Generic;
using DrivingSim.Controls;
using DrivingSim.Core;
using DrivingSim.TestBed;
using DrivingSim.Startup;
using DrivingSim.Vehicle;
using NUnit.Framework;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.TestTools;

namespace DrivingSim.Tests
{
    /// <summary>Scripted driver: lets a test set pedals and steering through the normal input router.</summary>
    public class ScriptedDrivingInput : MonoBehaviour, IDrivingInputSource
    {
        public float Throttle;
        public float Brake;
        public bool HoldSteering;
        float pendingSteerDeg;

        public void Steer(float deltaDeg) => pendingSteerDeg += deltaDeg;

        public void PollInput(float deltaTime, ref DrivingInputFrame frame)
        {
            frame.Throttle = Mathf.Max(frame.Throttle, Throttle);
            frame.Brake = Mathf.Max(frame.Brake, Brake);
            frame.SteerDeltaDeg += pendingSteerDeg;
            pendingSteerDeg = 0f;
            frame.SteerHeld |= HoldSteering;
        }
    }

    /// <summary>
    /// Baseline driving checks on the generated physics test rig with default config values.
    /// Time is advanced in physics steps (simulated seconds), so results don't depend on frame rate.
    /// Ranges are sanity bounds for the prototype tuning, not real-vehicle figures.
    /// </summary>
    public class DrivingBaselinePlayModeTests
    {
        VehicleController vehicle;
        ScriptedDrivingInput input;
        readonly List<GameObject> created = new List<GameObject>();

        [UnitySetUp]
        public IEnumerator SetUp()
        {
            // Headless CI may have no graphics device (render textures, shader warnings). These tests
            // assert driving behavior, so engine log messages must not fail them.
            LogAssert.ignoreFailingMessages = true;
            PlayerPrefs.SetInt("DrivingSim.PedalWizardDone", 1);
            StartupFlow.SuppressForAutomatedTests = true;

            var before = new HashSet<GameObject>(SceneManager.GetActiveScene().GetRootGameObjects());
            vehicle = PhysicsTestRig.Assemble(ScriptableObject.CreateInstance<VehiclePhysicsConfig>(), new RuntimeMaterialSource());
            foreach (GameObject root in SceneManager.GetActiveScene().GetRootGameObjects())
                if (!before.Contains(root)) created.Add(root);

            var router = Object.FindFirstObjectByType<VehicleInputRouter>();
            input = router.gameObject.AddComponent<ScriptedDrivingInput>();
            router.RegisterSource(input);
            DrivingInputGate.ResetAll();

            yield return Simulate(1f); // let the suspension settle
        }

        [UnityTearDown]
        public IEnumerator TearDown()
        {
            foreach (GameObject go in created) if (go != null) Object.Destroy(go);
            created.Clear();
            DrivingInputGate.ResetAll();
            StartupFlow.SuppressForAutomatedTests = false;
            yield return null;
        }

        static IEnumerator Simulate(float seconds)
        {
            int steps = Mathf.CeilToInt(seconds / Time.fixedDeltaTime);
            for (int i = 0; i < steps; i++) yield return new WaitForFixedUpdate();
            yield return null; // one Update so input and visuals catch up
        }

        IEnumerator EngageFromPark(TransmissionGear gear)
        {
            input.Brake = 1f;
            yield return Simulate(0.3f);
            Assert.AreEqual(ShiftResult.Accepted, vehicle.RequestGear(gear), "shift with brake held");
            vehicle.SetParkingBrake(false);
            input.Brake = 0f;
        }

        [UnityTest]
        public IEnumerator Park_HoldsTheCar()
        {
            Vector3 start = vehicle.transform.position;
            yield return Simulate(3f);
            Assert.AreEqual(TransmissionGear.P, vehicle.Gear);
            Assert.Less(Mathf.Abs(vehicle.SignedSpeedKmh), 0.3f);
            Assert.Less(Vector3.Distance(start, vehicle.transform.position), 0.1f);
        }

        [UnityTest]
        public IEnumerator LeavingPark_WithoutBrake_IsRejected()
        {
            input.Brake = 0f;
            yield return null;
            Assert.AreEqual(ShiftResult.BrakeRequired, vehicle.RequestGear(TransmissionGear.D));
            Assert.AreEqual(TransmissionGear.P, vehicle.Gear);
        }

        [UnityTest]
        public IEnumerator Drive_CreepsForward_WithoutThrottle()
        {
            yield return EngageFromPark(TransmissionGear.D);
            Vector3 start = vehicle.transform.position;
            yield return Simulate(12f);
            float kmh = vehicle.SignedSpeedKmh;
            Assert.That(kmh, Is.InRange(2f, 9f), $"creep speed {kmh:F2} km/h");
            Assert.Greater(Vector3.Dot(vehicle.transform.position - start, vehicle.transform.forward), 2f);
        }

        [UnityTest]
        public IEnumerator Reverse_CreepsBackward()
        {
            yield return EngageFromPark(TransmissionGear.R);
            yield return Simulate(12f);
            float kmh = vehicle.SignedSpeedKmh;
            Assert.That(kmh, Is.InRange(-9f, -1.5f), $"reverse creep {kmh:F2} km/h");
        }

        [UnityTest]
        public IEnumerator Park_WhileMoving_IsRejected()
        {
            yield return EngageFromPark(TransmissionGear.D);
            yield return Simulate(8f);
            Assume.That(vehicle.SignedSpeedKmh, Is.GreaterThan(2f));
            input.Brake = 0.5f;
            yield return null;
            Assert.AreEqual(ShiftResult.SpeedTooHigh, vehicle.RequestGear(TransmissionGear.P));
            Assert.AreEqual(TransmissionGear.D, vehicle.Gear);
        }

        [UnityTest]
        public IEnumerator Brake_StopsFrom25Kmh_AndHolds()
        {
            yield return EngageFromPark(TransmissionGear.D);
            input.Throttle = 0.6f;
            for (int i = 0; i < 30 && vehicle.SignedSpeedKmh < 25f; i++) yield return Simulate(0.5f);
            Assume.That(vehicle.SignedSpeedKmh, Is.GreaterThanOrEqualTo(25f));

            input.Throttle = 0f;
            input.Brake = 1f;
            Vector3 start = vehicle.transform.position;
            for (int i = 0; i < 40 && Mathf.Abs(vehicle.SignedSpeedKmh) > 0.1f; i++) yield return Simulate(0.2f);
            float distance = Vector3.Distance(start, vehicle.transform.position);
            Assert.Less(Mathf.Abs(vehicle.SignedSpeedKmh), 0.2f, "stopped");
            Assert.That(distance, Is.InRange(1f, 12f), $"braking distance {distance:F2} m");

            yield return Simulate(2f); // brake holds against creep
            Assert.Less(Mathf.Abs(vehicle.SignedSpeedKmh), 0.2f);
        }

        [UnityTest]
        public IEnumerator Steering_FullRightLock_TurnsTheCarRight()
        {
            yield return EngageFromPark(TransmissionGear.D);
            input.HoldSteering = true;
            input.Steer(540f);
            yield return Simulate(0.5f);
            Assert.AreEqual(540f, vehicle.SteeringWheelAngleDeg, 0.01f);
            Assert.AreEqual(35f, vehicle.RightFrontAngleDeg, 0.5f, "inner (right) wheel at lock");
            Assert.Less(vehicle.LeftFrontAngleDeg, vehicle.RightFrontAngleDeg, "Ackermann: outer wheel turns less");

            float startYaw = vehicle.transform.eulerAngles.y;
            yield return Simulate(8f);
            float turned = Mathf.DeltaAngle(startYaw, vehicle.transform.eulerAngles.y);
            Assert.Greater(turned, 30f, $"yaw change {turned:F1}° (positive = clockwise = right)");
        }

        [UnityTest]
        public IEnumerator Steering_ReleasedWhileStopped_StaysPut()
        {
            input.Brake = 1f;
            input.HoldSteering = true;
            input.Steer(270f);
            yield return Simulate(0.2f);
            input.HoldSteering = false;
            yield return Simulate(3f);
            Assert.AreEqual(270f, vehicle.SteeringWheelAngleDeg, 0.01f);
        }
    }
}
