using System.Collections.Generic;
#if ENABLE_INPUT_SYSTEM
using UnityEngine.InputSystem;
using UnityEngine.InputSystem.Controls;
#endif

namespace DrivingSim.Controls
{
    /// <summary>One reading from pedal hardware. Digital devices set the Down flags; analog devices also set amounts.</summary>
    public struct PedalReading
    {
        public bool BrakeDown;
        public bool AcceleratorDown;
        public bool HasAnalog;
        public float BrakeAnalog;
        public float AcceleratorAnalog;
    }

    /// <summary>
    /// Pedal hardware abstraction. The keyboard is the first implementation; USB foot switches
    /// (usually keyboard or gamepad buttons) and analog pedal sets can implement this later
    /// without touching the vehicle code.
    /// </summary>
    public interface IPedalDevice
    {
        bool IsConnected { get; }
        PedalReading Read();
    }

    /// <summary>
    /// Raw keyboard layer: logical OR over each pedal's key set. Any one reported key activates
    /// the pedal, so it keeps working when ghosting/rollover drops some of the keys under the foot.
    /// </summary>
    public sealed class KeyboardPedalDevice : IPedalDevice
    {
        readonly List<int> brakeKeys = new List<int>();
        readonly List<int> acceleratorKeys = new List<int>();
        readonly List<int> activeBrake = new List<int>();
        readonly List<int> activeAccelerator = new List<int>();

        public IReadOnlyList<int> BrakeKeys => brakeKeys;
        public IReadOnlyList<int> AcceleratorKeys => acceleratorKeys;
        public IReadOnlyList<int> ActiveBrakeKeys => activeBrake;
        public IReadOnlyList<int> ActiveAcceleratorKeys => activeAccelerator;

        public void SetKeys(IEnumerable<int> brake, IEnumerable<int> accelerator)
        {
            brakeKeys.Clear();
            acceleratorKeys.Clear();
            if (brake != null) brakeKeys.AddRange(brake);
            if (accelerator != null)
                foreach (int key in accelerator)
                    if (!brakeKeys.Contains(key)) acceleratorKeys.Add(key); // never both pedals
            activeBrake.Clear();
            activeAccelerator.Clear();
        }

#if ENABLE_INPUT_SYSTEM
        public bool IsConnected => Keyboard.current != null && Keyboard.current.added;

        public PedalReading Read()
        {
            activeBrake.Clear();
            activeAccelerator.Clear();
            Keyboard keyboard = Keyboard.current;
            if (keyboard == null) return default;
            foreach (int key in brakeKeys) if (keyboard[(Key)key].isPressed) activeBrake.Add(key);
            foreach (int key in acceleratorKeys) if (keyboard[(Key)key].isPressed) activeAccelerator.Add(key);
            return new PedalReading { BrakeDown = activeBrake.Count > 0, AcceleratorDown = activeAccelerator.Count > 0 };
        }

        /// <summary>Pressed keys that belong to neither pedal (accidental presses, incomplete mapping).</summary>
        public void CollectUnmappedPressed(List<int> into, ICollection<int> ignore = null)
        {
            into.Clear();
            Keyboard keyboard = Keyboard.current;
            if (keyboard == null) return;
            foreach (KeyControl control in keyboard.allKeys)
            {
                if (control == null || !control.isPressed) continue;
                int code = (int)control.keyCode;
                if (brakeKeys.Contains(code) || acceleratorKeys.Contains(code)) continue;
                if (ignore != null && ignore.Contains(code)) continue;
                into.Add(code);
            }
        }

        public static string DisplayName(int code)
        {
            Keyboard keyboard = Keyboard.current;
            string display = keyboard != null ? keyboard[(Key)code].displayName : null;
            return string.IsNullOrEmpty(display) ? ((Key)code).ToString() : display;
        }
#else
        public bool IsConnected => false;
        public PedalReading Read() => default;
        public void CollectUnmappedPressed(List<int> into, ICollection<int> ignore = null) => into.Clear();
        public static string DisplayName(int code) => code.ToString();
#endif
    }
}
