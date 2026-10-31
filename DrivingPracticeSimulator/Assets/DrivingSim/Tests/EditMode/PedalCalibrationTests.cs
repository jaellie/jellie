using System.Collections.Generic;
using DrivingSim.Core;
using NUnit.Framework;

namespace DrivingSim.Tests
{
    public class PedalCalibrationTests
    {
        static void Press(PedalAttemptRecorder r, float t, params int[] keys)
        {
            foreach (int k in keys) r.KeyDown(k, t);
            foreach (int k in keys) r.KeyUp(k, t + 0.15f);
            r.Update(t + 0.15f + r.ReleaseGapSeconds + 0.01f);
        }

        [Test]
        public void Recorder_CountsOneAttemptPerFootPress()
        {
            var r = new PedalAttemptRecorder(5, 0.2f);
            Press(r, 0f, 10, 11, 12);
            Press(r, 1f, 11, 12);
            Assert.AreEqual(2, r.Attempts.Count);
            Assert.AreEqual(3, r.Attempts[0].MaxSimultaneous);
        }

        [Test]
        public void Recorder_ShortReleaseInsideGap_StaysOneAttempt()
        {
            var r = new PedalAttemptRecorder(5, 0.2f);
            r.KeyDown(10, 0f);
            r.KeyUp(10, 0.1f);
            Assert.IsFalse(r.Update(0.15f));
            r.KeyDown(11, 0.18f); // foot bounce
            r.KeyUp(11, 0.3f);
            Assert.IsTrue(r.Update(0.55f));
            Assert.AreEqual(1, r.Attempts.Count);
            CollectionAssert.AreEquivalent(new[] { 10, 11 }, r.Attempts[0].Keys);
        }

        [Test]
        public void Analyze_SelectsRecurringKeys_AndKeepsOneOffsSeparate()
        {
            var attempts = new List<PedalAttempt>
            {
                new PedalAttempt(new[] { 1, 2, 3 }, 3, 0.2f),
                new PedalAttempt(new[] { 2, 3 }, 2, 0.2f),
                new PedalAttempt(new[] { 2, 3, 4 }, 3, 0.2f),
                new PedalAttempt(new[] { 3 }, 1, 0.2f),
                new PedalAttempt(new[] { 2, 9 }, 2, 0.2f),
            };
            PedalKeyAnalysis a = PedalCalibrationAnalyzer.Analyze(attempts, 2);
            CollectionAssert.AreEquivalent(new[] { 2, 3 }, a.Selected);
            CollectionAssert.AreEquivalent(new[] { 1, 4, 9 }, a.Occasional);
            Assert.AreEqual(4, a.Counts[2]);
        }

        [Test]
        public void Analyze_NothingRecurs_FallsBackToMostFrequent()
        {
            var attempts = new List<PedalAttempt>
            {
                new PedalAttempt(new[] { 1 }, 1, 0.2f),
                new PedalAttempt(new[] { 2 }, 1, 0.2f),
            };
            PedalKeyAnalysis a = PedalCalibrationAnalyzer.Analyze(attempts, 2);
            CollectionAssert.AreEquivalent(new[] { 1, 2 }, a.Selected);
        }

        [Test]
        public void ResolveConflicts_KeepsKeyWithMoreFrequentPedal_RemovesTies()
        {
            var brake = PedalCalibrationAnalyzer.Analyze(new List<PedalAttempt>
            {
                new PedalAttempt(new[] { 1, 5 }, 2, 0.2f), new PedalAttempt(new[] { 1, 5, 6 }, 3, 0.2f), new PedalAttempt(new[] { 1, 6 }, 2, 0.2f),
            });
            var accel = PedalCalibrationAnalyzer.Analyze(new List<PedalAttempt>
            {
                new PedalAttempt(new[] { 7, 5 }, 2, 0.2f), new PedalAttempt(new[] { 7, 6 }, 2, 0.2f), new PedalAttempt(new[] { 7, 6 }, 2, 0.2f),
            });
            List<int> conflicts = PedalCalibrationAnalyzer.ResolveConflicts(brake, accel);
            // 5: brake 2 vs accel 1 -> brake. 6: brake 2 vs accel 2 -> conflict.
            CollectionAssert.AreEquivalent(new[] { 1, 5 }, brake.Selected);
            CollectionAssert.AreEquivalent(new[] { 7 }, accel.Selected);
            CollectionAssert.AreEquivalent(new[] { 6 }, conflicts);
        }

        [Test]
        public void Rollover_FlaggedWhenNeverMoreThanTwoKeys()
        {
            var attempts = new List<PedalAttempt>
            {
                new PedalAttempt(new[] { 1, 2, 3 }, 2, 0.2f),
                new PedalAttempt(new[] { 1, 2, 4 }, 2, 0.2f),
            };
            Assert.IsTrue(PedalCalibrationAnalyzer.DetectRolloverLimit(attempts));
        }

        [Test]
        public void Rollover_NotFlaggedForNormalPresses()
        {
            var attempts = new List<PedalAttempt>
            {
                new PedalAttempt(new[] { 1, 2, 3 }, 3, 0.2f),
                new PedalAttempt(new[] { 1, 2 }, 2, 0.2f),
            };
            Assert.IsFalse(PedalCalibrationAnalyzer.DetectRolloverLimit(attempts));
        }
    }

    public class TurnSignalModelTests
    {
        [Test]
        public void Toggle_SwitchesAndClears()
        {
            var m = new TurnSignalModel();
            m.Toggle(TurnSignal.Left);
            Assert.AreEqual(TurnSignal.Left, m.Signal);
            m.Toggle(TurnSignal.Right);
            Assert.AreEqual(TurnSignal.Right, m.Signal);
            m.Toggle(TurnSignal.Right);
            Assert.AreEqual(TurnSignal.Off, m.Signal);
        }

        [Test]
        public void AutoCancel_AfterTurnAndReturn()
        {
            var m = new TurnSignalModel();
            m.Toggle(TurnSignal.Right);
            m.UpdateSteering(30f);
            Assert.AreEqual(TurnSignal.Right, m.Signal); // not armed yet
            m.UpdateSteering(200f);
            m.UpdateSteering(100f);
            Assert.AreEqual(TurnSignal.Right, m.Signal);
            Assert.IsTrue(m.UpdateSteering(10f));
            Assert.AreEqual(TurnSignal.Off, m.Signal);
        }

        [Test]
        public void AutoCancel_IgnoresSteeringTheOtherWay()
        {
            var m = new TurnSignalModel();
            m.Toggle(TurnSignal.Left);
            m.UpdateSteering(300f); // turning right with left signal
            m.UpdateSteering(0f);
            Assert.AreEqual(TurnSignal.Left, m.Signal);
        }

        [Test]
        public void Hazard_LightsBothSides()
        {
            var m = new TurnSignalModel();
            m.ToggleHazard();
            Assert.IsTrue(m.LeftActive && m.RightActive);
        }

        [Test]
        public void Blink_HalfPeriodOn()
        {
            Assert.IsTrue(TurnSignalModel.BlinkPhase(0.1f, 0.8f));
            Assert.IsFalse(TurnSignalModel.BlinkPhase(0.5f, 0.8f));
        }
    }
}
