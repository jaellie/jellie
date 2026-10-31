namespace DrivingSim.Core
{
    public static class DialMath
    {
        /// <summary>
        /// Needle angle in degrees clockwise from 12 o'clock for a gauge that sweeps
        /// <paramref name="sweepDeg"/> symmetrically around the top, from 0 to <paramref name="maxValue"/>.
        /// </summary>
        public static float NeedleAngle(float value, float maxValue, float sweepDeg)
        {
            if (maxValue <= 0f) return -sweepDeg * 0.5f;
            return -sweepDeg * 0.5f + SimMath.Clamp01(value / maxValue) * sweepDeg;
        }
    }
}
