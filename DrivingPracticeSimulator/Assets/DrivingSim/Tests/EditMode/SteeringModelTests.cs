using DrivingSim.Core;
using NUnit.Framework;

namespace DrivingSim.Tests
{
    public class SteeringModelTests
    {
        static SteeringModel Create() => new SteeringModel(new SteeringSettings());

        [Test]
        public void DriverRotation_AccumulatesAcrossDrags()
        {
            var s = Create();
            s.AddDriverRotation(200f);
            s.AddDriverRotation(150f);
            Assert.AreEqual(350f, s.SteeringWheelAngleDeg, 1e-3f);
        }

        [Test]
        public void DriverRotation_ClampsAtMaximum()
        {
            var s = Create();
            s.AddDriverRotation(2000f);
            Assert.AreEqual(720f, s.SteeringWheelAngleDeg, 1e-3f);
            s.AddDriverRotation(-5000f);
            Assert.AreEqual(-720f, s.SteeringWheelAngleDeg, 1e-3f);
        }

        [Test]
        public void FullLock_MapsToMaxFrontWheelAngle()
        {
            var s = Create();
            s.AddDriverRotation(720f);
            s.Tick(1f, 0f, false);
            Assert.AreEqual(35f, s.FrontWheelAngleDeg, 1e-3f);
        }

        [Test]
        public void Stopped_DoesNotSelfCenter()
        {
            var s = Create();
            s.AddDriverRotation(400f);
            for (int i = 0; i < 100; i++) s.Tick(0.02f, 0f, false);
            Assert.AreEqual(400f, s.SteeringWheelAngleDeg, 1e-3f);
        }

        [Test]
        public void Moving_SelfCentersWhenReleased()
        {
            var s = Create();
            s.AddDriverRotation(400f);
            for (int i = 0; i < 50; i++) s.Tick(0.02f, 30f, false);
            Assert.Less(s.SteeringWheelAngleDeg, 400f);
            Assert.GreaterOrEqual(s.SteeringWheelAngleDeg, 0f);
        }

        [Test]
        public void Moving_DoesNotSelfCenterWhileHeld()
        {
            var s = Create();
            s.AddDriverRotation(400f);
            for (int i = 0; i < 50; i++) s.Tick(0.02f, 30f, true);
            Assert.AreEqual(400f, s.SteeringWheelAngleDeg, 1e-3f);
        }

        [Test]
        public void Reverse_SelfCentersMoreWeakly()
        {
            var forward = Create();
            var reverse = Create();
            forward.AddDriverRotation(400f);
            reverse.AddDriverRotation(400f);
            forward.Tick(0.1f, 15f, false);
            reverse.Tick(0.1f, -15f, false);
            Assert.Greater(reverse.SteeringWheelAngleDeg, forward.SteeringWheelAngleDeg);
        }

        [Test]
        public void HighSpeed_ReducesFrontWheelAngle()
        {
            var s = Create();
            Assert.Less(s.TargetFrontWheelAngle(360f, 100f), s.TargetFrontWheelAngle(360f, 10f));
        }

        [Test]
        public void FrontWheel_IsSlewRateLimited()
        {
            var s = Create();
            s.AddDriverRotation(720f);
            s.Tick(0.1f, 0f, true);
            Assert.AreEqual(12f, s.FrontWheelAngleDeg, 1e-3f); // 120 deg/s * 0.1 s
        }
    }
}
