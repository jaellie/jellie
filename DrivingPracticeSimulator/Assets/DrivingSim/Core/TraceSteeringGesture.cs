using System;

namespace DrivingSim.Core
{
    /// <summary>
    /// Circular steering that works anywhere on screen: it accumulates how much the pointer's
    /// direction of travel turns. Drawing one loop of any size, anywhere, turns the wheel one full
    /// turn; a straight stroke turns it 0°; reversing along an arc turns it back. This does not need
    /// a fixed center, so the steering ring can stay where it is while the gesture starts anywhere.
    /// Engine-free and unit tested.
    /// </summary>
    public sealed class TraceSteeringGesture
    {
        bool hasPoint, hasHeading;
        float lastX, lastY, lastHeadingDeg;

        /// <summary>Wheel degrees per degree of turning of the stroke (1 = one loop turns the wheel once).</summary>
        public float Gain { get; set; } = 1f;

        /// <summary>The pointer must move at least this far (coordinate units) before a direction is measured; filters jitter.</summary>
        public float MinSegment { get; set; } = 8f;

        /// <summary>Direction changes sharper than this in one segment (reversals, glitches) are discarded.</summary>
        public float MaxTurnDeg { get; set; } = 100f;

        /// <summary>True for Y-up coordinates (Unity screen space), false for Y-down (browser).</summary>
        public bool YAxisUp { get; set; } = true;

        public void Reset() => hasPoint = hasHeading = false;

        /// <summary>Returns the steering-wheel change in degrees for this sample (positive = clockwise = right).</summary>
        public float Sample(float x, float y)
        {
            if (!hasPoint)
            {
                hasPoint = true;
                lastX = x;
                lastY = y;
                return 0f;
            }

            float dx = x - lastX, dy = y - lastY;
            if (dx * dx + dy * dy < MinSegment * MinSegment) return 0f;
            lastX = x;
            lastY = y;

            float heading = (float)(Math.Atan2(dy, dx) * 180.0 / Math.PI);
            if (!hasHeading)
            {
                hasHeading = true; // the first segment only establishes the direction of travel
                lastHeadingDeg = heading;
                return 0f;
            }

            float delta = CircularSteeringGesture.Unwrap(heading - lastHeadingDeg);
            lastHeadingDeg = heading;
            if (Math.Abs(delta) > MaxTurnDeg) return 0f;
            return (YAxisUp ? -delta : delta) * Gain;
        }
    }
}
