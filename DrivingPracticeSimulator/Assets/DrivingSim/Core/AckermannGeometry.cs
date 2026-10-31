using System;

namespace DrivingSim.Core
{
    public static class AckermannGeometry
    {
        /// <summary>
        /// Splits a commanded inner-wheel angle into left/right front-wheel angles.
        /// Positive = turning right, so the right wheel is the inner wheel.
        /// </summary>
        public static void Compute(float innerAngleDeg, float wheelbase, float track, out float leftDeg, out float rightDeg)
        {
            float magnitude = Math.Abs(innerAngleDeg);
            if (magnitude < 0.01f || wheelbase <= 0f || track <= 0f)
            {
                leftDeg = rightDeg = innerAngleDeg;
                return;
            }

            float radius = RearAxleTurningRadius(magnitude, wheelbase, track);
            float outer = (float)Math.Atan(wheelbase / (radius + track * 0.5f)) * SimMath.Rad2Deg;

            if (innerAngleDeg > 0f)
            {
                rightDeg = magnitude;
                leftDeg = outer;
            }
            else
            {
                leftDeg = -magnitude;
                rightDeg = -outer;
            }
        }

        /// <summary>Turning radius (m) of the rear-axle center for a given inner front-wheel angle.</summary>
        public static float RearAxleTurningRadius(float innerAngleDeg, float wheelbase, float track)
        {
            float magnitude = Math.Abs(innerAngleDeg);
            if (magnitude < 0.01f) return float.PositiveInfinity;
            return wheelbase / (float)Math.Tan(magnitude * SimMath.Deg2Rad) + track * 0.5f;
        }

        /// <summary>Turning radius (m) traced by the outer front wheel, the usual "minimum turning radius" figure.</summary>
        public static float OuterFrontWheelRadius(float innerAngleDeg, float wheelbase, float track)
        {
            float rear = RearAxleTurningRadius(innerAngleDeg, wheelbase, track);
            if (float.IsInfinity(rear)) return rear;
            float x = rear + track * 0.5f;
            return (float)Math.Sqrt(x * x + wheelbase * wheelbase);
        }
    }
}
