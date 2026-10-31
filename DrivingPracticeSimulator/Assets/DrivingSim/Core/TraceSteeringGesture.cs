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
        float dirX, dirY;
        float lastStepDeg;

        /// <summary>Wheel degrees per degree of turning of the stroke (1 = one loop turns the wheel once).</summary>
        public float Gain { get; set; } = 1f;

        /// <summary>The pointer must move at least this far (coordinate units) before a direction is measured; filters jitter.</summary>
        public float MinSegment { get; set; } = 8f;

        /// <summary>Direction changes sharper than this in one segment (reversals, glitches) are discarded.</summary>
        public float MaxTurnDeg { get; set; } = 100f;

        /// <summary>
        /// Exponential smoothing of the travel direction (0 = none, 0.9 = heavy). Hand tremor makes
        /// short segments point in noisy directions; smoothing removes the shake. The total turn is
        /// preserved, only spread over the next samples.
        /// </summary>
        public float DirectionSmoothing { get; set; } = 0.6f;

        /// <summary>True for Y-up coordinates (Unity screen space), false for Y-down (browser).</summary>
        public bool YAxisUp { get; set; } = true;

        public void Reset() => hasPoint = hasHeading = false;

        /// <summary>
        /// Call when the pointer is released. Direction smoothing lags a turning stroke by about
        /// k/(1-k) segments; this returns that remaining turn (estimated from the smoothed, low-noise
        /// turn rate, not the noisy last segment) so short twists are not under-counted, then resets.
        /// </summary>
        public float Release()
        {
            float k = Math.Max(0f, Math.Min(0.95f, DirectionSmoothing));
            float lag = hasHeading ? lastStepDeg * k / (1f - k) : 0f;
            lag = Math.Max(-MaxTurnDeg, Math.Min(MaxTurnDeg, lag));
            lastStepDeg = 0f;
            Reset();
            return lag;
        }

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

            float length = (float)Math.Sqrt(dx * dx + dy * dy), ux = dx / length, uy = dy / length;
            float k = Math.Max(0f, Math.Min(0.95f, DirectionSmoothing));
            if (hasHeading) { dirX = dirX * k + ux * (1f - k); dirY = dirY * k + uy * (1f - k); }
            else { dirX = ux; dirY = uy; }

            float heading = (float)(Math.Atan2(dirY, dirX) * 180.0 / Math.PI);
            if (!hasHeading)
            {
                hasHeading = true; // the first segment only establishes the direction of travel
                lastHeadingDeg = heading;
                return 0f;
            }

            float delta = CircularSteeringGesture.Unwrap(heading - lastHeadingDeg);
            lastHeadingDeg = heading;
            if (Math.Abs(delta) > MaxTurnDeg) return lastStepDeg = 0f;
            return lastStepDeg = (YAxisUp ? -delta : delta) * Gain;
        }
    }
}
