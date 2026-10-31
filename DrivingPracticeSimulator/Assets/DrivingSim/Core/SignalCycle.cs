using System;

namespace DrivingSim.Core
{
    public enum SignalLamp { Red, Yellow, Green }

    /// <summary>Fixed-time signal plan for one intersection (main road vs. cross street). Pure logic.</summary>
    public sealed class SignalCycle
    {
        readonly float[] ends;
        readonly SignalLamp[] main, cross;

        public float Length { get; }

        public SignalCycle(TownSignalPhase[] phases)
        {
            if (phases == null || phases.Length == 0) throw new ArgumentException("No signal phases");
            ends = new float[phases.Length];
            main = new SignalLamp[phases.Length];
            cross = new SignalLamp[phases.Length];
            float t = 0f;
            for (int i = 0; i < phases.Length; i++)
            {
                if (phases[i].durationS <= 0f) throw new ArgumentException("Phase duration must be positive: " + phases[i].phase);
                t += phases[i].durationS;
                ends[i] = t;
                main[i] = Parse(phases[i].main);
                cross[i] = Parse(phases[i].cross);
            }
            Length = t;
        }

        /// <summary>Lamp states at time t (seconds, any value; the plan repeats).</summary>
        public void At(float t, out SignalLamp mainLamp, out SignalLamp crossLamp)
        {
            float local = t % Length;
            if (local < 0f) local += Length;
            for (int i = 0; i < ends.Length; i++)
            {
                if (local < ends[i]) { mainLamp = main[i]; crossLamp = cross[i]; return; }
            }
            mainLamp = main[main.Length - 1];
            crossLamp = cross[cross.Length - 1];
        }

        /// <summary>Main road = northbound/southbound approaches; everything else uses the cross-street lamps.</summary>
        public static bool IsMainApproach(string approach) => approach == "NB" || approach == "SB";

        static SignalLamp Parse(string s)
        {
            switch (s)
            {
                case "green": return SignalLamp.Green;
                case "yellow": return SignalLamp.Yellow;
                case "red": return SignalLamp.Red;
                default: throw new ArgumentException("Unknown lamp state: " + s);
            }
        }
    }
}
