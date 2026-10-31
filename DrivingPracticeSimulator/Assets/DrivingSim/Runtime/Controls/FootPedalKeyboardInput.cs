using System;
using System.Collections.Generic;
using DrivingSim.Persistence;
using UnityEngine;
#if ENABLE_INPUT_SYSTEM
using UnityEngine.InputSystem;
#endif

namespace DrivingSim.Controls
{
    /// <summary>
    /// A physical keyboard on the floor used as brake and accelerator. Any key in a pedal's mapping
    /// activates it; the pedal releases when all of its keys are up. Optionally, pressing more keys
    /// (a flatter, harder foot) means more pedal. Brake always wins: while braking, throttle is zero.
    /// Mapped keys are reserved so they never trigger other shortcuts. Requires the Input System.
    /// </summary>
    public class FootPedalKeyboardInput : MonoBehaviour, IDrivingInputSource
    {
        public enum PressureMode
        {
            /// <summary>Any key = full pedal.</summary>
            Binary,
            /// <summary>More keys down = more pedal, up to <see cref="keysForFullPressure"/>.</summary>
            KeyCount,
        }

        [SerializeField] bool pedalsEnabled = true;
        public PressureMode pressureMode = PressureMode.KeyCount;
        [Min(1)] public int keysForFullPressure = 3;
        [Tooltip("Pedal value with a single key down in KeyCount mode.")]
        [Range(0.05f, 1f)] public float singleKeyPressure = 0.35f;

        [Header("Smoothing (per second)")]
        [Min(0.1f)] public float brakeRise = 4f;
        [Min(0.1f)] public float brakeFall = 6f;
        [Min(0.1f)] public float acceleratorRise = 1.5f;
        [Min(0.1f)] public float acceleratorFall = 4f;

        PedalKeyMapping mapping;
        float brake;
        float throttle;

        public event Action MappingChanged;

        public bool PedalsEnabled
        {
            get => pedalsEnabled;
            set { pedalsEnabled = value; ApplyReservation(); }
        }

        public PedalKeyMapping Mapping => mapping;
        public bool HasMapping => mapping != null && mapping.IsUsable;
        public bool IsActive => pedalsEnabled && HasMapping && KeyboardConnected;
        public float Brake => brake;
        public float Throttle => throttle;
        public int BrakeKeysDown { get; private set; }
        public int AcceleratorKeysDown { get; private set; }

#if ENABLE_INPUT_SYSTEM
        readonly List<Key> brakeKeys = new List<Key>();
        readonly List<Key> acceleratorKeys = new List<Key>();
        public static bool KeyboardConnected => Keyboard.current != null;
#else
        public static bool KeyboardConnected => false;
#endif

        void Awake()
        {
            if (SaveManager.TryLoad(PedalKeyMapping.SaveName, out PedalKeyMapping saved)) SetMapping(saved, save: false);
        }

        void OnEnable() => ApplyReservation();
        void OnDisable() => PedalKeyReservation.Clear();

        public void SetMapping(PedalKeyMapping value, bool save)
        {
            mapping = value;
#if ENABLE_INPUT_SYSTEM
            brakeKeys.Clear();
            acceleratorKeys.Clear();
            if (mapping != null)
            {
                brakeKeys.AddRange(PedalKeyMapping.Parse(mapping.brakeKeys));
                foreach (Key key in PedalKeyMapping.Parse(mapping.acceleratorKeys))
                    if (!brakeKeys.Contains(key)) acceleratorKeys.Add(key); // a key can only be one pedal
            }
#endif
            if (save && mapping != null)
            {
                mapping.savedUtc = DateTime.UtcNow.ToString("o");
                SaveManager.Save(PedalKeyMapping.SaveName, mapping);
            }
            ApplyReservation();
            MappingChanged?.Invoke();
        }

        public void ClearMapping()
        {
            SaveManager.Delete(PedalKeyMapping.SaveName);
            SetMapping(null, save: false);
        }

        void ApplyReservation()
        {
            var reserved = new List<int>();
#if ENABLE_INPUT_SYSTEM
            if (pedalsEnabled && isActiveAndEnabled)
            {
                foreach (Key key in brakeKeys) reserved.Add((int)key);
                foreach (Key key in acceleratorKeys) reserved.Add((int)key);
            }
#endif
            PedalKeyReservation.Set(reserved);
        }

        public void PollInput(float deltaTime, ref DrivingInputFrame frame)
        {
            float brakeTarget = 0f, throttleTarget = 0f;
#if ENABLE_INPUT_SYSTEM
            Keyboard keyboard = Keyboard.current;
            if (pedalsEnabled && keyboard != null && HasMapping)
            {
                BrakeKeysDown = CountDown(keyboard, brakeKeys);
                AcceleratorKeysDown = CountDown(keyboard, acceleratorKeys);
                brakeTarget = Pressure(BrakeKeysDown);
                throttleTarget = Pressure(AcceleratorKeysDown);
            }
            else
            {
                BrakeKeysDown = AcceleratorKeysDown = 0;
            }
#endif
            if (brakeTarget > 0f) throttleTarget = 0f; // brake priority

            brake = Mathf.MoveTowards(brake, brakeTarget, (brakeTarget > brake ? brakeRise : brakeFall) * deltaTime);
            throttle = brakeTarget > 0f
                ? 0f
                : Mathf.MoveTowards(throttle, throttleTarget, (throttleTarget > throttle ? acceleratorRise : acceleratorFall) * deltaTime);

            frame.Brake = Mathf.Max(frame.Brake, brake);
            frame.Throttle = Mathf.Max(frame.Throttle, throttle);
        }

        float Pressure(int keysDown)
        {
            if (keysDown <= 0) return 0f;
            if (pressureMode == PressureMode.Binary || keysForFullPressure <= 1) return 1f;
            float t = (keysDown - 1) / (float)(keysForFullPressure - 1);
            return Mathf.Lerp(singleKeyPressure, 1f, Mathf.Clamp01(t));
        }

#if ENABLE_INPUT_SYSTEM
        static int CountDown(Keyboard keyboard, List<Key> keys)
        {
            int count = 0;
            foreach (Key key in keys)
                if (keyboard[key].isPressed) count++;
            return count;
        }
#endif
    }
}
