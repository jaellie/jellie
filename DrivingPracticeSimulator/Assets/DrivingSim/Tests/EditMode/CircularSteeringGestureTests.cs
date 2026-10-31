using System;
using DrivingSim.Core;
using NUnit.Framework;

namespace DrivingSim.Tests
{
    public class CircularSteeringGestureTests
    {
        // Moves around the center in Unity screen space (Y up). sweepDeg < 0 = clockwise on screen.
        static float Circle(CircularSteeringGesture g, float startDeg, float sweepDeg, int steps, float radius = 100f)
        {
            float total = 0f;
            for (int i = 0; i <= steps; i++)
            {
                double a = (startDeg + sweepDeg * i / steps) * Math.PI / 180.0;
                total += g.Sample((float)(Math.Cos(a) * radius), (float)(Math.Sin(a) * radius), 0f, 0f);
            }
            return total;
        }

        static CircularSteeringGesture Create() => new CircularSteeringGesture { DeadZoneRadius = 20f, MaxStepDeg = 90f, YAxisUp = true };

        [Test]
        public void ClockwiseCircle_IsPlus360()
        {
            Assert.AreEqual(360f, Circle(Create(), 90f, -360f, 72), 0.01f);
        }

        [Test]
        public void CounterClockwiseCircle_IsMinus360()
        {
            Assert.AreEqual(-360f, Circle(Create(), 90f, 360f, 72), 0.01f);
        }

        [Test]
        public void ThreeCircles_Accumulate()
        {
            Assert.AreEqual(1080f, Circle(Create(), 0f, -1080f, 216), 0.05f);
        }

        [Test]
        public void CrossingPlusMinus180_NoJump()
        {
            // From 170° to 190° (= -170°) counter-clockwise: 20°, never 340°.
            Assert.AreEqual(-20f, Circle(Create(), 170f, 20f, 4), 0.01f);
        }

        [Test]
        public void YDown_ClockwiseIsAlsoPositive()
        {
            var g = Create();
            g.YAxisUp = false;
            // In Y-down coordinates clockwise on screen increases atan2.
            Assert.AreEqual(360f, Circle(g, 0f, 360f, 72), 0.01f);
        }

        [Test]
        public void DeadZone_IgnoredAndReanchored()
        {
            var g = Create();
            g.Sample(100f, 0f, 0f, 0f);
            Assert.AreEqual(0f, g.Sample(5f, 5f, 0f, 0f));       // inside dead zone
            Assert.IsFalse(g.HasReference);
            Assert.AreEqual(0f, g.Sample(-100f, 0f, 0f, 0f));    // first sample after leaving: anchor only
        }

        [Test]
        public void LargeStep_IsDiscarded()
        {
            var g = Create();
            g.Sample(100f, 0f, 0f, 0f);
            Assert.AreEqual(0f, g.Sample(-100f, 1f, 0f, 0f));    // ~180° in one step
        }

        [Test]
        public void Reset_NextGestureStartsWithoutJump()
        {
            var g = Create();
            Circle(g, 0f, -90f, 9);
            g.Reset();
            Assert.AreEqual(0f, g.Sample(0f, -100f, 0f, 0f));    // new grip somewhere else: anchor only
            Assert.AreEqual(90f, Circle(g, -90f, -90f, 9), 0.01f);
        }

        [Test]
        public void Unwrap_MapsIntoHalfOpenRange()
        {
            Assert.AreEqual(-20f, CircularSteeringGesture.Unwrap(340f), 1e-4f);
            Assert.AreEqual(20f, CircularSteeringGesture.Unwrap(-340f), 1e-4f);
            Assert.AreEqual(180f, CircularSteeringGesture.Unwrap(-180f), 1e-4f);
        }
    }
}
