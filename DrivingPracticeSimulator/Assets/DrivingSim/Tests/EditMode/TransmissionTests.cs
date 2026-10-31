using DrivingSim.Core;
using NUnit.Framework;

namespace DrivingSim.Tests
{
    public class TransmissionTests
    {
        static AutomaticTransmissionLogic Create(TransmissionGear gear = TransmissionGear.P) =>
            new AutomaticTransmissionLogic(new TransmissionSettings(), gear);

        [Test]
        public void LeavingPark_WithoutBrake_IsRejected()
        {
            var t = Create();
            Assert.AreEqual(ShiftResult.BrakeRequired, t.RequestShift(TransmissionGear.D, 0f, 0f));
            Assert.AreEqual(TransmissionGear.P, t.Gear);
        }

        [Test]
        public void LeavingPark_WithBrake_IsAccepted()
        {
            var t = Create();
            Assert.AreEqual(ShiftResult.Accepted, t.RequestShift(TransmissionGear.D, 1f, 0f));
            Assert.AreEqual(TransmissionGear.D, t.Gear);
        }

        [Test]
        public void EnteringPark_WhileMoving_IsRejected()
        {
            var t = Create(TransmissionGear.D);
            Assert.AreEqual(ShiftResult.SpeedTooHigh, t.RequestShift(TransmissionGear.P, 1f, 5f));
            Assert.AreEqual(TransmissionGear.D, t.Gear);
        }

        [Test]
        public void EnteringPark_StoppedWithBrake_IsAccepted()
        {
            var t = Create(TransmissionGear.D);
            Assert.AreEqual(ShiftResult.Accepted, t.RequestShift(TransmissionGear.P, 1f, 0.2f));
        }

        [Test]
        public void DriveToReverse_WhileMovingForward_IsRejected()
        {
            var t = Create(TransmissionGear.D);
            Assert.AreEqual(ShiftResult.SpeedTooHigh, t.RequestShift(TransmissionGear.R, 1f, 10f));
        }

        [Test]
        public void ReverseToDrive_WhileRollingBackward_IsRejected()
        {
            var t = Create(TransmissionGear.R);
            Assert.AreEqual(ShiftResult.SpeedTooHigh, t.RequestShift(TransmissionGear.D, 1f, -6f));
        }

        [Test]
        public void NeutralToDrive_WhileRollingForward_NeedsNoBrake()
        {
            var t = Create(TransmissionGear.N);
            Assert.AreEqual(ShiftResult.Accepted, t.RequestShift(TransmissionGear.D, 0f, 20f));
        }

        [Test]
        public void EngagingDrive_WhenStopped_NeedsBrake()
        {
            var t = Create(TransmissionGear.N);
            Assert.AreEqual(ShiftResult.BrakeRequired, t.RequestShift(TransmissionGear.D, 0f, 0f));
        }

        [Test]
        public void Neutral_IsAlwaysReachableOutsidePark()
        {
            var t = Create(TransmissionGear.D);
            Assert.AreEqual(ShiftResult.Accepted, t.RequestShift(TransmissionGear.N, 0f, 50f));
        }

        [Test]
        public void SameGear_ReportsAlreadyInGear()
        {
            Assert.AreEqual(ShiftResult.AlreadyInGear, Create().RequestShift(TransmissionGear.P, 1f, 0f));
        }

        [Test]
        public void Step_FollowsLeverOrderAndClamps()
        {
            Assert.AreEqual(TransmissionGear.R, AutomaticTransmissionLogic.Step(TransmissionGear.P, 1));
            Assert.AreEqual(TransmissionGear.D, AutomaticTransmissionLogic.Step(TransmissionGear.N, 1));
            Assert.AreEqual(TransmissionGear.D, AutomaticTransmissionLogic.Step(TransmissionGear.D, 1));
            Assert.AreEqual(TransmissionGear.P, AutomaticTransmissionLogic.Step(TransmissionGear.P, -1));
        }
    }
}
