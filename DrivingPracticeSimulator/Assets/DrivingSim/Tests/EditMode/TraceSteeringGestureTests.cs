using System;
using DrivingSim.Core;
using NUnit.Framework;

namespace DrivingSim.Tests
{
    public class TraceSteeringGestureTests
    {
        static TraceSteeringGesture Create() => new TraceSteeringGesture { MinSegment = 4f, MaxTurnDeg = 100f, YAxisUp = true };

        // Loop of radius r around (cx, cy) in Y-up coordinates; sweepDeg < 0 = clockwise on screen.
        static float Loop(TraceSteeringGesture g, float cx, float cy, float r, float startDeg, float sweepDeg, int steps)
        {
            float total = 0f;
            for (int i = 0; i <= steps; i++)
            {
                double a = (startDeg + sweepDeg * i / steps) * Math.PI / 180.0;
                total += g.Sample(cx + (float)(Math.Cos(a) * r), cy + (float)(Math.Sin(a) * r));
            }
            return total;
        }

        [Test]
        public void ClockwiseLoop_AnywhereAnySize_IsAboutPlus360()
        {
            // The first segment only sets the direction, so one step (10°) is not counted.
            Assert.AreEqual(350f, Loop(Create(), 900f, 100f, 60f, 90f, -360f, 36), 0.1f);
            Assert.AreEqual(350f, Loop(Create(), -500f, 700f, 200f, 0f, -360f, 36), 0.1f);
        }

        [Test]
        public void CounterClockwiseLoop_IsNegative()
        {
            Assert.AreEqual(-350f, Loop(Create(), 0f, 0f, 80f, 0f, 360f, 36), 0.1f);
        }

        [Test]
        public void StraightStroke_IsZero()
        {
            var g = Create();
            float total = 0f;
            for (int i = 0; i <= 21; i++) total += g.Sample(i * 10f, 50f + (i % 2) * 0.5f); // zig-zag jitter nets to zero
            Assert.AreEqual(0f, total, 0.5f);
        }

        [Test]
        public void Square_TurnsByCorners()
        {
            var g = Create();
            float total = 0f;
            float[,] pts = { { 0, 0 }, { 50, 0 }, { 100, 0 }, { 100, -50 }, { 100, -100 }, { 50, -100 }, { 0, -100 }, { 0, -50 }, { 0, 0 }, { 50, 0 } };
            for (int i = 0; i < pts.GetLength(0); i++) total += g.Sample(pts[i, 0], pts[i, 1]);
            Assert.AreEqual(360f, total, 0.1f); // right, down, left, up, right in Y-up = clockwise
        }

        [Test]
        public void Reversal_IsDiscarded_ThenBackAlongArcUnwinds()
        {
            var g = Create();
            float forward = Loop(g, 0f, 0f, 100f, 90f, -90f, 9);    // clockwise quarter
            float back = Loop(g, 0f, 0f, 100f, 0f, 90f, 9);         // straight back along the same arc
            Assert.Greater(forward, 0f);
            Assert.Less(back, 0f);
        }

        [Test]
        public void TinyJitter_BelowMinSegment_DoesNothing()
        {
            var g = Create();
            g.Sample(0f, 0f);
            Assert.AreEqual(0f, g.Sample(1f, 1f));
            Assert.AreEqual(0f, g.Sample(-1f, 2f));
        }
    }
}
