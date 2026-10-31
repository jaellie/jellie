using System;
using UnityEngine;

namespace DrivingSim.Core
{
    /// <summary>
    /// Virtual pedal response for digital (on/off) pedal hardware such as a keyboard or foot switch.
    /// A keyboard cannot measure force: "amount" here is a time-based approximation of how far a
    /// driver would have pushed the pedal, not a pressure reading.
    /// </summary>
    [Serializable]
    public class PedalResponseSettings
    {
        [Header("Accelerator (simulated travel)")]
        [Tooltip("Seconds of holding to go from 0 to the maximum. Longer = gentler pull-away.")]
        [Min(0.05f)] public float acceleratorRiseTime = 2.5f;
        [Tooltip("Seconds to fall from full to 0 after release.")]
        [Min(0.02f)] public float acceleratorReleaseTime = 0.25f;
        [Tooltip("Highest accelerator amount reachable by holding.")]
        [Range(0.1f, 1f)] public float acceleratorMaxWhileHeld = 1f;
        [Tooltip("Jump straight to the maximum on press (arcade-like; off by default).")]
        public bool acceleratorInstantFull;

        [Header("Brake (simulated travel)")]
        [Tooltip("Amount applied the instant the brake is pressed, so braking starts without delay.")]
        [Range(0.05f, 1f)] public float brakeInitialAmount = 0.3f;
        [Tooltip("Seconds of holding to go from the initial amount to full braking.")]
        [Min(0.05f)] public float brakeRampTime = 1.2f;
        [Tooltip("Seconds to fall from full to 0 after release.")]
        [Min(0.02f)] public float brakeReleaseTime = 0.1f;

        [Header("Filtering")]
        [Tooltip("The brake stays logically pressed this long after its last key is released (bridges key chatter). Only ever extends braking.")]
        [Range(0f, 0.2f)] public float brakeReleaseDebounce = 0.04f;
        [Tooltip("After brake and accelerator were pressed together, wait this long after the brake releases before throttle may rise again. Never delays braking.")]
        [Range(0f, 0.5f)] public float acceleratorReengageDelay = 0.12f;

        [Header("Fail-safe")]
        [Tooltip("Brake amount applied while pedal input is lost (keyboard disconnected, focus lost).")]
        [Range(0.1f, 1f)] public float failSafeBrake = 0.6f;
    }

    public enum PedalSafetyState
    {
        Normal,
        /// <summary>Input is unreliable: throttle cut, fail-safe brake applied.</summary>
        FailSafe,
        /// <summary>Input is back; fail-safe brake holds until the player presses the brake.</summary>
        AwaitingRearm,
    }

    /// <summary>
    /// Turns digital brake/accelerator states into pedal amounts. Brake has absolute priority:
    /// while it is pressed, accelerator output is zero. Engine-free and unit tested.
    /// </summary>
    public sealed class PedalStateMachine
    {
        readonly PedalResponseSettings s;
        float sinceBrakeKeyUp = float.PositiveInfinity;
        float reengageTimer;
        bool conflictSinceBrake;

        public PedalStateMachine(PedalResponseSettings settings) => s = settings ?? throw new ArgumentNullException(nameof(settings));

        public float BrakeAmount { get; private set; }
        public float AcceleratorAmount { get; private set; }
        public bool BrakePressed { get; private set; }
        public bool AcceleratorPressed { get; private set; }
        /// <summary>Both pedals pressed this update.</summary>
        public bool Conflict { get; private set; }
        /// <summary>The accelerator is pressed but its output is held at zero (brake priority, re-engage delay or fail-safe).</summary>
        public bool AcceleratorSuppressed { get; private set; }
        public PedalSafetyState Safety { get; private set; } = PedalSafetyState.Normal;

        public void Reset()
        {
            BrakeAmount = AcceleratorAmount = 0f;
            BrakePressed = AcceleratorPressed = Conflict = AcceleratorSuppressed = false;
            sinceBrakeKeyUp = float.PositiveInfinity;
            reengageTimer = 0f;
            conflictSinceBrake = false;
            Safety = PedalSafetyState.Normal;
        }

        /// <summary>Input became unreliable (disconnect, focus loss): cut throttle now and brake.</summary>
        public void EnterFailSafe()
        {
            Safety = PedalSafetyState.FailSafe;
            AcceleratorAmount = 0f;
        }

        public void Update(bool brakeDown, bool acceleratorDown, bool inputReliable, float dt)
        {
            if (dt < 0f) dt = 0f;
            AcceleratorPressed = acceleratorDown && inputReliable;

            if (!inputReliable) EnterFailSafe();
            else if (Safety == PedalSafetyState.FailSafe) Safety = PedalSafetyState.AwaitingRearm;

            if (Safety != PedalSafetyState.Normal)
            {
                if (Safety == PedalSafetyState.AwaitingRearm && brakeDown) Safety = PedalSafetyState.Normal; // brake press re-arms
                else
                {
                    BrakePressed = inputReliable && brakeDown;
                    AcceleratorAmount = 0f;
                    AcceleratorSuppressed = AcceleratorPressed;
                    Conflict = false;
                    // Never reduce braking the player already applied; otherwise rise quickly to the fail-safe level.
                    float floor = Math.Max(s.failSafeBrake, BrakePressed ? s.brakeInitialAmount : 0f);
                    if (BrakeAmount < floor) BrakeAmount = SimMath.MoveTowards(BrakeAmount, floor, dt / s.brakeReleaseTime);
                    return;
                }
            }

            // Brake: pressed immediately on key down; released after a short debounce.
            sinceBrakeKeyUp = brakeDown ? 0f : sinceBrakeKeyUp + dt;
            bool wasPressed = BrakePressed;
            BrakePressed = brakeDown || sinceBrakeKeyUp <= s.brakeReleaseDebounce;

            if (BrakePressed)
            {
                if (!wasPressed || BrakeAmount < s.brakeInitialAmount) BrakeAmount = Math.Max(BrakeAmount, s.brakeInitialAmount);
                BrakeAmount = SimMath.MoveTowards(BrakeAmount, 1f, (1f - s.brakeInitialAmount) / s.brakeRampTime * dt);
            }
            else
            {
                BrakeAmount = SimMath.MoveTowards(BrakeAmount, 0f, dt / s.brakeReleaseTime);
            }

            // Accelerator: zero while braking; brief re-engage delay after an overlap.
            Conflict = BrakePressed && acceleratorDown;
            if (Conflict) conflictSinceBrake = true;

            if (BrakePressed)
            {
                AcceleratorAmount = 0f;
                reengageTimer = 0f;
            }
            else
            {
                if (conflictSinceBrake) { reengageTimer = s.acceleratorReengageDelay; conflictSinceBrake = false; }
                if (reengageTimer > 0f)
                {
                    reengageTimer -= dt;
                    AcceleratorAmount = 0f;
                }
                else if (acceleratorDown)
                {
                    float max = s.acceleratorMaxWhileHeld;
                    AcceleratorAmount = s.acceleratorInstantFull ? max : SimMath.MoveTowards(AcceleratorAmount, max, max / s.acceleratorRiseTime * dt);
                }
                else
                {
                    AcceleratorAmount = SimMath.MoveTowards(AcceleratorAmount, 0f, dt / s.acceleratorReleaseTime);
                }
            }
            AcceleratorSuppressed = acceleratorDown && AcceleratorAmount <= 0f && (BrakePressed || reengageTimer > 0f);
        }
    }

    public enum PedalValidationFailure
    {
        None,
        /// <summary>The accelerator activated while the brake was prompted.</summary>
        AcceleratorDuringBrakePrompt,
        /// <summary>The brake activated while the accelerator was prompted.</summary>
        BrakeDuringAcceleratorPrompt,
        /// <summary>Too many presses hit only unmapped keys.</summary>
        TooManyMissedPresses,
    }

    public enum PedalValidationStep
    {
        PressBrake,
        PressAccelerator,
        Passed,
        Failed,
    }

    /// <summary>
    /// Guided live test after calibration: the player presses the brake region a few times, then
    /// the accelerator region. A press is everything between the first key down and all keys up.
    /// A press is clean when only the prompted pedal activated. Calibration is accepted only after
    /// this passes; five recorded attempts alone prove nothing.
    /// </summary>
    public sealed class PedalValidationSession
    {
        bool inPress, sawBrake, sawAccelerator, sawUnmapped;

        public PedalValidationSession(int requiredPresses = 3, int maxMissedPresses = 1)
        {
            RequiredPresses = Math.Max(1, requiredPresses);
            MaxMissedPresses = Math.Max(0, maxMissedPresses);
        }

        public int RequiredPresses { get; }
        public int MaxMissedPresses { get; }
        public PedalValidationStep Step { get; private set; } = PedalValidationStep.PressBrake;
        public int CleanBrakePresses { get; private set; }
        public int CleanAcceleratorPresses { get; private set; }
        /// <summary>Presses that activated the pedal that was not prompted (dangerous).</summary>
        public int WrongPedalPresses { get; private set; }
        /// <summary>Presses that produced keys but activated no pedal (mapping incomplete).</summary>
        public int MissedPresses { get; private set; }
        /// <summary>Presses that also included unmapped keys.</summary>
        public int PressesWithUnmappedKeys { get; private set; }
        /// <summary>Why validation failed (the UI turns this into localized text).</summary>
        public PedalValidationFailure Failure { get; private set; } = PedalValidationFailure.None;

        public void Update(bool brakeDown, bool acceleratorDown, bool unmappedKeyDown)
        {
            if (Step == PedalValidationStep.Passed || Step == PedalValidationStep.Failed) return;
            bool any = brakeDown || acceleratorDown || unmappedKeyDown;
            if (any)
            {
                if (!inPress) { inPress = true; sawBrake = sawAccelerator = sawUnmapped = false; }
                sawBrake |= brakeDown;
                sawAccelerator |= acceleratorDown;
                sawUnmapped |= unmappedKeyDown;
                return;
            }
            if (!inPress) return;
            inPress = false;
            ScorePress();
        }

        void ScorePress()
        {
            if (sawUnmapped) PressesWithUnmappedKeys++;
            bool brakePrompt = Step == PedalValidationStep.PressBrake;
            bool intended = brakePrompt ? sawBrake : sawAccelerator;
            bool wrong = brakePrompt ? sawAccelerator : sawBrake;

            if (wrong)
            {
                WrongPedalPresses++;
                Fail(brakePrompt ? PedalValidationFailure.AcceleratorDuringBrakePrompt : PedalValidationFailure.BrakeDuringAcceleratorPrompt);
                return;
            }
            if (!intended)
            {
                MissedPresses++;
                if (MissedPresses > MaxMissedPresses) Fail(PedalValidationFailure.TooManyMissedPresses);
                return;
            }

            if (brakePrompt)
            {
                CleanBrakePresses++;
                if (CleanBrakePresses >= RequiredPresses) Step = PedalValidationStep.PressAccelerator;
            }
            else
            {
                CleanAcceleratorPresses++;
                if (CleanAcceleratorPresses >= RequiredPresses) Step = PedalValidationStep.Passed;
            }
        }

        void Fail(PedalValidationFailure failure)
        {
            Failure = failure;
            Step = PedalValidationStep.Failed;
        }
    }
}
