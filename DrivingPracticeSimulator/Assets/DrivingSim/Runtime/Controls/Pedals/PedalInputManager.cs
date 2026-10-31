using System;
using System.Collections.Generic;
using DrivingSim.Core;
using DrivingSim.Persistence;
using UnityEngine;
#if ENABLE_INPUT_SYSTEM
using UnityEngine.InputSystem;
#endif

namespace DrivingSim.Controls
{
    /// <summary>
    /// Central pedal input manager for floor-keyboard pedals.
    /// Layers: raw keys (<see cref="KeyboardPedalDevice"/>) → logical OR per pedal → state machine
    /// with brake priority, virtual pedal travel and fail-safe (<see cref="PedalStateMachine"/>) →
    /// normalized brake/throttle into the driving input frame. The vehicle never sees keys.
    /// Requires the Input System package.
    /// </summary>
    [DefaultExecutionOrder(-80)]
    public class PedalInputManager : MonoBehaviour, IDrivingInputSource
    {
        [SerializeField] bool pedalsEnabled = true;
        [Tooltip("Use a mapping that has not passed the live validation test. Off by default for safety.")]
        public bool allowUnvalidatedMapping;
        [Tooltip("Treat losing application focus as losing pedal input (throttle cut, fail-safe brake).")]
        public bool failSafeOnFocusLoss = true;
        public PedalResponseSettings response = new PedalResponseSettings();

        readonly KeyboardPedalDevice keyboard = new KeyboardPedalDevice();
        PedalStateMachine machine;
        PedalKeyMapping mapping;
        bool hasFocus = true;
        bool deviceLost;
        PedalSafetyState lastSafety;

        public event Action MappingChanged;
        public event Action<PedalSafetyState> SafetyChanged;

        // ---- Public state (spec API) ----
        public bool BrakePressed => Machine.BrakePressed;
        public bool AcceleratorPressed => Machine.AcceleratorPressed;
        public float BrakeAmount => Machine.BrakeAmount;
        public float AcceleratorAmount => Machine.AcceleratorAmount;
        public IReadOnlyList<int> ActiveBrakeKeys => keyboard.ActiveBrakeKeys;
        public IReadOnlyList<int> ActiveAcceleratorKeys => keyboard.ActiveAcceleratorKeys;
        public PedalCalibrationStatus CalibrationStatus { get; private set; } = PedalCalibrationStatus.NotCalibrated;

        public bool Conflict => Machine.Conflict;
        public bool AcceleratorSuppressed => Machine.AcceleratorSuppressed;
        public void AllowUnvalidated(bool allow) { allowUnvalidatedMapping = allow; ApplyReservation(); MappingChanged?.Invoke(); }
        public PedalSafetyState Safety => Machine.Safety;
        public PedalKeyMapping Mapping => mapping;
        public KeyboardPedalDevice Device => keyboard;
        public bool KeyboardConnected => keyboard.IsConnected && !deviceLost;

        /// <summary>The foot pedals are driving the car (enabled, mapped, validated or explicitly allowed).</summary>
        public bool IsActive => pedalsEnabled && mapping != null && mapping.IsUsable
                                && (mapping.validated || allowUnvalidatedMapping);

        public bool PedalsEnabled
        {
            get => pedalsEnabled;
            set
            {
                pedalsEnabled = value;
                Machine.Reset();
                ApplyReservation();
                MappingChanged?.Invoke();
            }
        }

        PedalStateMachine Machine => machine ?? (machine = new PedalStateMachine(response));

        void Awake()
        {
            if (SaveManager.TryLoad(PedalKeyMapping.SaveName, out PedalKeyMapping saved)) ApplyMapping(saved);
            else RefreshStatus();
        }

        void OnEnable()
        {
#if ENABLE_INPUT_SYSTEM
            InputSystem.onDeviceChange += OnDeviceChange;
#endif
            ApplyReservation();
        }

        void OnDisable()
        {
#if ENABLE_INPUT_SYSTEM
            InputSystem.onDeviceChange -= OnDeviceChange;
#endif
            PedalKeyReservation.Clear();
            Machine.Reset();
        }

#if ENABLE_INPUT_SYSTEM
        void OnDeviceChange(InputDevice device, InputDeviceChange change)
        {
            if (!(device is Keyboard)) return;
            switch (change)
            {
                case InputDeviceChange.Removed:
                case InputDeviceChange.Disconnected:
                    deviceLost = Keyboard.current == null || Keyboard.current == device;
                    break;
                case InputDeviceChange.Added:
                case InputDeviceChange.Reconnected:
                    deviceLost = false;
                    RefreshStatus();
                    break;
            }
        }
#endif

        void OnApplicationFocus(bool focus) => hasFocus = focus;
        void OnApplicationPause(bool paused) { if (paused) hasFocus = false; }

        void Update()
        {
            if (!IsActive)
            {
                if (Machine.Safety != PedalSafetyState.Normal || Machine.BrakeAmount > 0f || Machine.AcceleratorAmount > 0f) Machine.Reset();
                NotifySafety();
                return;
            }

            bool reliable = KeyboardConnected && (hasFocus || !failSafeOnFocusLoss);
            PedalReading reading = reliable ? keyboard.Read() : default;
            Machine.Update(reading.BrakeDown, reading.AcceleratorDown, reliable, Time.unscaledDeltaTime);
            NotifySafety();
        }

        void NotifySafety()
        {
            if (Machine.Safety == lastSafety) return;
            lastSafety = Machine.Safety;
            SafetyChanged?.Invoke(lastSafety);
        }

        public void PollInput(float deltaTime, ref DrivingInputFrame frame)
        {
            if (!IsActive) return;
            frame.Brake = Mathf.Max(frame.Brake, Machine.BrakeAmount);
            frame.Throttle = Mathf.Max(frame.Throttle, Machine.AcceleratorAmount);
        }

        // ---- Mapping management ----

        public void SetMapping(PedalKeyMapping value, bool validated, bool save)
        {
            if (value != null)
            {
                value.validated = validated;
#if ENABLE_INPUT_SYSTEM
                if (validated && Keyboard.current != null)
                {
                    value.keyboardProduct = Describe(Keyboard.current);
                    value.keyboardLayout = Keyboard.current.keyboardLayout;
                }
#endif
                value.savedUtc = DateTime.UtcNow.ToString("o");
                if (save) SaveManager.Save(PedalKeyMapping.SaveName, value);
            }
            ApplyMapping(value);
        }

        public void ResetToDefaults() => SetMapping(PedalKeyMapping.CreateDefault(), validated: false, save: true);

        public void ClearMapping()
        {
            SaveManager.Delete(PedalKeyMapping.SaveName);
            ApplyMapping(null);
        }

        void ApplyMapping(PedalKeyMapping value)
        {
            mapping = value;
#if ENABLE_INPUT_SYSTEM
            var brake = new List<int>();
            var accelerator = new List<int>();
            if (mapping != null)
            {
                foreach (Key key in PedalKeyMapping.Parse(mapping.brakeKeys)) brake.Add((int)key);
                foreach (Key key in PedalKeyMapping.Parse(mapping.acceleratorKeys)) accelerator.Add((int)key);
            }
            keyboard.SetKeys(brake, accelerator);
#endif
            Machine.Reset();
            RefreshStatus();
            ApplyReservation();
            MappingChanged?.Invoke();
        }

        void RefreshStatus()
        {
            if (mapping == null || !mapping.IsUsable) CalibrationStatus = PedalCalibrationStatus.NotCalibrated;
            else if (!mapping.validated) CalibrationStatus = PedalCalibrationStatus.Unvalidated;
            else CalibrationStatus = SameKeyboard() ? PedalCalibrationStatus.Validated : PedalCalibrationStatus.KeyboardChanged;
        }

        bool SameKeyboard()
        {
#if ENABLE_INPUT_SYSTEM
            Keyboard current = Keyboard.current;
            if (current == null || string.IsNullOrEmpty(mapping.keyboardProduct)) return true; // unknown: don't nag
            return mapping.keyboardProduct == Describe(current);
#else
            return true;
#endif
        }

#if ENABLE_INPUT_SYSTEM
        static string Describe(Keyboard device)
        {
            var d = device.description;
            string name = $"{d.manufacturer} {d.product}".Trim();
            return string.IsNullOrEmpty(name) ? device.layout : name;
        }
#endif

        void ApplyReservation()
        {
            if (!isActiveAndEnabled || !IsActive)
            {
                PedalKeyReservation.Clear();
                return;
            }
            var keys = new List<int>(keyboard.BrakeKeys);
            keys.AddRange(keyboard.AcceleratorKeys);
            PedalKeyReservation.Set(keys); // pedal keys never trigger other shortcuts
        }
    }
}
