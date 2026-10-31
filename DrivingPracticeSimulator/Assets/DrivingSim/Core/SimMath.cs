using System;

namespace DrivingSim.Core
{
    /// <summary>
    /// Small math helpers so the core models do not depend on UnityEngine.Mathf
    /// and stay easy to unit test.
    /// </summary>
    public static class SimMath
    {
        public const float KmhToMs = 1f / 3.6f;
        public const float MsToKmh = 3.6f;
        public const float Deg2Rad = (float)(Math.PI / 180.0);
        public const float Rad2Deg = (float)(180.0 / Math.PI);

        public static float Clamp(float value, float min, float max) => value < min ? min : (value > max ? max : value);

        public static float Clamp01(float value) => Clamp(value, 0f, 1f);

        public static float Lerp(float a, float b, float t) => a + (b - a) * Clamp01(t);

        public static float InverseLerp(float a, float b, float value)
        {
            if (Math.Abs(b - a) < 1e-6f) return value >= b ? 1f : 0f;
            return Clamp01((value - a) / (b - a));
        }

        public static float SmoothStep01(float t)
        {
            t = Clamp01(t);
            return t * t * (3f - 2f * t);
        }

        public static float MoveTowards(float current, float target, float maxDelta)
        {
            if (Math.Abs(target - current) <= maxDelta) return target;
            return current + Math.Sign(target - current) * maxDelta;
        }
    }
}
