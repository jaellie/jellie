using System.IO;
using DrivingSim.Core;
using NUnit.Framework;
using UnityEngine;

namespace DrivingSim.Tests
{
    public class SignalCycleTests
    {
        static SignalCycle FromLayout()
        {
            string path = Path.Combine(Application.dataPath, "DrivingSim", "Resources", TownLayoutData.ResourcePath + ".json");
            return new SignalCycle(JsonUtility.FromJson<TownLayoutData>(File.ReadAllText(path)).signalCycle);
        }

        [TestCase(0f, SignalLamp.Green, SignalLamp.Red)]
        [TestCase(21f, SignalLamp.Yellow, SignalLamp.Red)]
        [TestCase(24f, SignalLamp.Red, SignalLamp.Red)]
        [TestCase(30f, SignalLamp.Red, SignalLamp.Green)]
        [TestCase(41f, SignalLamp.Red, SignalLamp.Yellow)]
        [TestCase(44f, SignalLamp.Red, SignalLamp.Red)]
        [TestCase(45f, SignalLamp.Green, SignalLamp.Red)]
        [TestCase(-1f, SignalLamp.Red, SignalLamp.Red)]
        public void LayoutCycle_GivesExpectedLamps(float t, SignalLamp main, SignalLamp cross)
        {
            FromLayout().At(t, out SignalLamp m, out SignalLamp c);
            Assert.AreEqual(main, m, "main");
            Assert.AreEqual(cross, c, "cross");
        }

        [Test]
        public void NeverGreenBothWays()
        {
            SignalCycle cycle = FromLayout();
            Assert.AreEqual(45f, cycle.Length, 1e-4f);
            for (float t = 0f; t < cycle.Length; t += 0.1f)
            {
                cycle.At(t, out SignalLamp m, out SignalLamp c);
                Assert.IsFalse(m != SignalLamp.Red && c != SignalLamp.Red, $"conflict at {t:F1}s");
            }
        }
    }
}
