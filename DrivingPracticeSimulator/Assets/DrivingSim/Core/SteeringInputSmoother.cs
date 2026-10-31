using System;

namespace DrivingSim.Core
{
    /// <summary>
    /// Lets the steering wheel follow gesture input with a short time constant instead of jumping
    /// in steps, like the inertia of a real wheel. Everything that goes in comes out (no input is
    /// lost); it is only spread over a few frames. Frame-rate independent.
    /// </summary>
    public sealed class SteeringInputSmoother
    {
        public float TimeConstant { get; set; } = 0.07f;
        public float Pending { get; private set; }

        public void Reset() => Pending = 0f;

        /// <summary>Adds new input and returns the part to apply this frame.</summary>
        public float Step(float input, float deltaTime)
        {
            Pending += input;
            if (TimeConstant <= 0f || deltaTime <= 0f)
            {
                float all = deltaTime <= 0f && TimeConstant > 0f ? 0f : Pending;
                Pending -= all;
                return all;
            }
            float output = Pending * (1f - (float)Math.Exp(-deltaTime / TimeConstant));
            Pending -= output;
            if (Math.Abs(Pending) < 1e-3f) { output += Pending; Pending = 0f; }
            return output;
        }
    }
}
