using System;

namespace DrivingSim.Core
{
    /// <summary>
    /// Turns a pointer moving in circles around a center into steering-wheel rotation, like
    /// gripping a real wheel. Each sample measures atan2(y - cy, x - cx); the signed difference to
    /// the previous sample is unwrapped across ±180° and accumulated by the caller.
    /// Engine-free and unit tested.
    /// </summary>
    public sealed class CircularSteeringGesture
    {
        bool hasReference;
        float lastAngleDeg;

        /// <summary>Wheel degrees per degree of pointer rotation (1 = the finger turns the wheel 1:1).</summary>
        public float Gain { get; set; } = 1f;

        /// <summary>Samples closer to the center than this (same units as the coordinates) are ignored.</summary>
        public float DeadZoneRadius { get; set; }

        /// <summary>A single step larger than this is treated as a tracking jump and discarded.</summary>
        public float MaxStepDeg { get; set; } = 90f;

        /// <summary>
        /// True for coordinates with Y pointing up (Unity screen space): counter-clockwise increases
        /// atan2, so clockwise motion is negated to give positive (right) steering. False for Y-down
        /// coordinates (browser): clockwise already increases atan2.
        /// </summary>
        public bool YAxisUp { get; set; } = true;

        public bool HasReference => hasReference;

        /// <summary>Forget the previous sample (pointer released, or tracking lost).</summary>
        public void Reset() => hasReference = false;

        /// <summary>Returns the steering-wheel change in degrees for this sample (positive = clockwise = right).</summary>
        public float Sample(float x, float y, float centerX, float centerY)
        {
            float dx = x - centerX, dy = y - centerY;
            if (dx * dx + dy * dy < DeadZoneRadius * DeadZoneRadius)
            {
                hasReference = false; // re-anchor when the pointer leaves the dead zone
                return 0f;
            }

            float angle = (float)(Math.Atan2(dy, dx) * 180.0 / Math.PI);
            if (!hasReference)
            {
                hasReference = true;
                lastAngleDeg = angle;
                return 0f;
            }

            float delta = Unwrap(angle - lastAngleDeg);
            lastAngleDeg = angle;
            if (Math.Abs(delta) > MaxStepDeg) return 0f; // jump (crossing the center, resumed tracking)
            return (YAxisUp ? -delta : delta) * Gain;
        }

        /// <summary>Maps an angle difference into (-180, 180].</summary>
        public static float Unwrap(float deltaDeg)
        {
            float d = (deltaDeg + 180f) % 360f;
            if (d <= 0f) d += 360f;
            return d - 180f;
        }
    }
}
