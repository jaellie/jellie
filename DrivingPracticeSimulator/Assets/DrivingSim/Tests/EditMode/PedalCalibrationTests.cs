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

namespace DrivingSim.Tests
{
    public class PedalCalibrationV2Tests
    {
        [Test]
        public void Recorder_CountsKeyDownsAndIgnoresOsRepeat()
        {
            var r = new PedalAttemptRecorder(5, 0.2f);
            r.KeyDown(1, 0f);
            r.KeyDown(1, 0.05f); // OS auto-repeat while held
            r.KeyUp(1, 0.1f);
            r.KeyDown(1, 0.15f); // chatter inside the grouping window
            r.KeyUp(1, 0.2f);
            Assert.IsTrue(r.Update(0.45f));
            Assert.AreEqual(2, r.Attempts[0].KeyDowns[1]);
        }

        [Test]
        public void Recorder_StuckKey_IsForcedUpAndFlagged()
        {
            var r = new PedalAttemptRecorder(5, 0.2f, 3f);
            r.KeyDown(1, 0f);
            r.KeyDown(2, 0f);
            r.KeyUp(2, 0.1f);          // key 1's release is never reported
            Assert.IsFalse(r.Update(1f));
            Assert.IsFalse(r.Update(3.05f)); // forced up now, gap starts
            Assert.IsTrue(r.Update(3.3f));
            Assert.IsTrue(r.Attempts[0].ReleaseMissing.Contains(1));
        }

        [Test]
        public void ResolveConflicts_DominantPedalKeepsKey_ButKeyStaysAmbiguous()
        {
            var brake = PedalCalibrationAnalyzer.Analyze(new List<PedalAttempt>
            {
                new PedalAttempt(new[] { 1, 9 }, 2, 0.2f), new PedalAttempt(new[] { 1, 9 }, 2, 0.2f),
                new PedalAttempt(new[] { 1, 9 }, 2, 0.2f), new PedalAttempt(new[] { 1, 9 }, 2, 0.2f),
            });
            var accel = PedalCalibrationAnalyzer.Analyze(new List<PedalAttempt>
            {
                new PedalAttempt(new[] { 7, 9 }, 2, 0.2f), new PedalAttempt(new[] { 7, 9 }, 2, 0.2f),
                new PedalAttempt(new[] { 7 }, 1, 0.2f), new PedalAttempt(new[] { 7 }, 1, 0.2f),
            });
            List<int> ambiguous = PedalCalibrationAnalyzer.AmbiguousKeys(brake, accel);
            List<int> unresolved = PedalCalibrationAnalyzer.ResolveConflicts(brake, accel, 2);
            CollectionAssert.AreEquivalent(new[] { 9 }, ambiguous);
            CollectionAssert.IsEmpty(unresolved);         // 4 vs 2: brake dominates by 2
            CollectionAssert.Contains(brake.Selected, 9);
            CollectionAssert.DoesNotContain(accel.Selected, 9);
        }
    }

    public class PedalStateMachineTests
    {
        static PedalStateMachine Create() => new PedalStateMachine(new PedalResponseSettings());

        [Test]
        public void Brake_AppliesInitialAmountImmediately_ThenRamps()
        {
            var m = Create();
            m.Update(true, false, true, 0.02f);
            Assert.GreaterOrEqual(m.BrakeAmount, 0.3f);
            for (int i = 0; i < 100; i++) m.Update(true, false, true, 0.02f);
            Assert.AreEqual(1f, m.BrakeAmount, 1e-4f);
        }

        [Test]
        public void Accelerator_RisesGradually_AndReleasesPromptly()
        {
            var m = Create();
            m.Update(false, true, true, 0.5f);
            Assert.AreEqual(0.2f, m.AcceleratorAmount, 1e-3f); // 0.5 s of a 2.5 s rise
            m.Update(false, false, true, 0.25f);
            Assert.AreEqual(0f, m.AcceleratorAmount, 1e-4f);
        }

        [Test]
        public void BothPedals_BrakeWins_AcceleratorZero()
        {
            var m = Create();
            for (int i = 0; i < 50; i++) m.Update(false, true, true, 0.02f);
            m.Update(true, true, true, 0.02f);
            Assert.IsTrue(m.Conflict);
            Assert.AreEqual(0f, m.AcceleratorAmount);
            Assert.IsTrue(m.AcceleratorSuppressed);
            Assert.Greater(m.BrakeAmount, 0f);
        }

        [Test]
        public void AfterOverlap_AcceleratorWaitsReengageDelay()
        {
            var m = Create();
            m.Update(true, true, true, 0.02f);
            m.Update(false, true, true, 0.1f);   // brake released; still inside debounce (0.04) -> pressed? no: 0.1 > 0.04
            Assert.IsFalse(m.BrakePressed);
            Assert.AreEqual(0f, m.AcceleratorAmount);
            m.Update(false, true, true, 0.1f);
            m.Update(false, true, true, 0.1f);
            Assert.Greater(m.AcceleratorAmount, 0f);
        }

        [Test]
        public void BrakeDebounce_BridgesShortGap_WithoutDelayingPress()
        {
            var m = Create();
            m.Update(true, false, true, 0.02f);
            m.Update(false, false, true, 0.02f); // chatter: 20 ms gap
            Assert.IsTrue(m.BrakePressed);
            m.Update(false, false, true, 0.05f);
            Assert.IsFalse(m.BrakePressed);
        }

        [Test]
        public void InputLoss_CutsThrottleAndBrakes_UntilBrakePressed()
        {
            var m = Create();
            for (int i = 0; i < 50; i++) m.Update(false, true, true, 0.02f);
            Assert.Greater(m.AcceleratorAmount, 0f);
            m.Update(false, true, false, 0.02f);     // keyboard gone
            Assert.AreEqual(0f, m.AcceleratorAmount);
            for (int i = 0; i < 10; i++) m.Update(false, false, false, 0.02f);
            Assert.AreEqual(0.6f, m.BrakeAmount, 1e-3f);
            m.Update(false, true, true, 0.02f);      // back, but accelerator held: stays safe
            Assert.AreEqual(PedalSafetyState.AwaitingRearm, m.Safety);
            Assert.AreEqual(0f, m.AcceleratorAmount);
            m.Update(true, false, true, 0.02f);      // brake press re-arms
            Assert.AreEqual(PedalSafetyState.Normal, m.Safety);
        }
    }

    public class PedalValidationSessionTests
    {
        static void Press(PedalValidationSession v, bool brake, bool accel, bool unmapped = false)
        {
            v.Update(brake, accel, unmapped);
            v.Update(false, false, false);
        }

        [Test]
        public void CleanPresses_Pass()
        {
            var v = new PedalValidationSession(3);
            for (int i = 0; i < 3; i++) Press(v, true, false);
            Assert.AreEqual(PedalValidationStep.PressAccelerator, v.Step);
            for (int i = 0; i < 3; i++) Press(v, false, true);
            Assert.AreEqual(PedalValidationStep.Passed, v.Step);
        }

        [Test]
        public void WrongPedal_Fails()
        {
            var v = new PedalValidationSession(3);
            Press(v, true, true);
            Assert.AreEqual(PedalValidationStep.Failed, v.Step);
            Assert.AreEqual(1, v.WrongPedalPresses);
            Assert.AreEqual(PedalValidationFailure.AcceleratorDuringBrakePrompt, v.Failure);
        }

        [Test]
        public void MissedPresses_BeyondLimit_Fail()
        {
            var v = new PedalValidationSession(3, 1);
            Press(v, false, false, unmapped: true);
            Assert.AreEqual(PedalValidationStep.PressBrake, v.Step);
            Press(v, false, false, unmapped: true);
            Assert.AreEqual(PedalValidationStep.Failed, v.Step);
        }
    }
}
