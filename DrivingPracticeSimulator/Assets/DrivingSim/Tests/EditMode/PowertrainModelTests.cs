using DrivingSim.Core;
using NUnit.Framework;

namespace DrivingSim.Tests
{
    public class PowertrainModelTests
    {
        static readonly PowertrainSettings Settings = new PowertrainSettings();

        [Test]
        public void Drive_AtStandstill_ProducesForwardCreep()
        {
            Assert.AreEqual(Settings.creepForceN, PowertrainModel.DriveForce(Settings, TransmissionGear.D, 0f, 0f), 1e-3f);
        }

        [Test]
        public void Reverse_AtStandstill_ProducesBackwardCreep()
        {
            float force = PowertrainModel.DriveForce(Settings, TransmissionGear.R, 0f, 0f);
            Assert.Less(force, 0f);
            Assert.AreEqual(-Settings.creepForceN * Settings.reverseCreepScale, force, 1e-3f);
        }

        [Test]
        public void Creep_FadesOutAtCreepFadeSpeed()
        {
            float fade = Settings.creepFadeSpeedKmh * SimMath.KmhToMs;
            Assert.AreEqual(0f, PowertrainModel.CreepForce(Settings, TransmissionGear.D, fade), 1e-3f);
            Assert.Greater(PowertrainModel.CreepForce(Settings, TransmissionGear.D, fade * 0.5f), 0f);
        }

        [Test]
        public void CreepForce_ExceedsRollingResistance()
        {
            float rolling = new ResistanceSettings().rollingResistanceCoefficient * 1300f * 9.81f;
            Assert.Greater(Settings.creepForceN, rolling);
        }

        [Test]
        public void NeutralAndPark_TransmitNoForce()
        {
            Assert.AreEqual(0f, PowertrainModel.DriveForce(Settings, TransmissionGear.N, 1f, 0f));
            Assert.AreEqual(0f, PowertrainModel.DriveForce(Settings, TransmissionGear.P, 1f, 0f));
        }

        [Test]
        public void Throttle_IsProgressive()
        {
            float light = PowertrainModel.ThrottleForce(Settings, TransmissionGear.D, 0.25f, 0f);
            float full = PowertrainModel.ThrottleForce(Settings, TransmissionGear.D, 1f, 0f);
            Assert.Greater(full, light);
            Assert.Less(light, full * 0.25f); // exponent > 1 means gentler at small pedal travel
        }

        [Test]
        public void Throttle_IsPowerLimitedAtSpeed()
        {
            float speed = 30f; // m/s
            float force = PowertrainModel.ThrottleForce(Settings, TransmissionGear.D, 1f, speed);
            Assert.LessOrEqual(force, Settings.maxPowerKW * 1000f / speed + 1e-2f);
        }

        [Test]
        public void Reverse_IsLimitedNearReverseMaxSpeed()
        {
            float max = Settings.reverseMaxSpeedKmh * SimMath.KmhToMs;
            Assert.AreEqual(0f, PowertrainModel.ThrottleForce(Settings, TransmissionGear.R, 1f, max), 1e-3f);
        }

        [Test]
        public void Coasting_InDrive_AboveCreepSpeed_Decelerates()
        {
            Assert.Less(PowertrainModel.DriveForce(Settings, TransmissionGear.D, 0f, 15f), 0f);
        }

        [Test]
        public void Brake_IsProgressiveAndReachesMax()
        {
            var brakes = new BrakeSettings();
            Assert.AreEqual(brakes.maxServiceBrakeTorqueNm, BrakeModel.ServiceBrakeTorqueTotal(brakes, 1f), 1e-3f);
            Assert.Less(BrakeModel.ServiceBrakeTorqueTotal(brakes, 0.5f), brakes.maxServiceBrakeTorqueNm * 0.5f);
            Assert.AreEqual(0f, BrakeModel.ServiceBrakeTorqueTotal(brakes, 0f));
        }

        [Test]
        public void Resistance_AlwaysOpposesMotion()
        {
            var r = new ResistanceSettings();
            Assert.Less(ResistanceModel.RollingResistanceForce(r, 1300f, 9.81f, 5f), 0f);
            Assert.Greater(ResistanceModel.RollingResistanceForce(r, 1300f, 9.81f, -5f), 0f);
            Assert.Less(ResistanceModel.AerodynamicDragForce(r, 20f), 0f);
            Assert.Greater(ResistanceModel.AerodynamicDragForce(r, -20f), 0f);
            Assert.AreEqual(0f, ResistanceModel.RollingResistanceForce(r, 1300f, 9.81f, 0f));
        }

        [Test]
        public void Ackermann_InnerWheelTurnsMoreThanOuter()
        {
            AckermannGeometry.Compute(30f, 2.65f, 1.55f, out float left, out float right);
            Assert.AreEqual(30f, right, 1e-3f);
            Assert.Less(left, right);
            Assert.Greater(left, 0f);

            AckermannGeometry.Compute(-30f, 2.65f, 1.55f, out float left2, out float right2);
            Assert.AreEqual(-right, left2, 1e-3f);
            Assert.AreEqual(-left, right2, 1e-3f);
        }
    }
}
