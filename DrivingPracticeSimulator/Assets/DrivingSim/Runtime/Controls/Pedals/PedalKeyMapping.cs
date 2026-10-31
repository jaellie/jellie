using System;
using System.Collections.Generic;
#if ENABLE_INPUT_SYSTEM
using UnityEngine.InputSystem;
#endif

namespace DrivingSim.Controls
{
    public enum PedalCalibrationStatus
    {
        /// <summary>No mapping. Foot pedals are off.</summary>
        NotCalibrated,
        /// <summary>A mapping exists but has not passed the live validation test. Not used for driving by default.</summary>
        Unvalidated,
        /// <summary>Calibrated and validated on this keyboard.</summary>
        Validated,
        /// <summary>Validated, but the connected keyboard differs from the one used for calibration. Re-validation recommended.</summary>
        KeyboardChanged,
    }

    /// <summary>
    /// Saved foot-pedal key assignment. Keys are stored by Input System <c>Key</c> name, which names
    /// a physical key position (US-layout reference), so the file is layout independent.
    /// </summary>
    [Serializable]
    public class PedalKeyMapping
    {
        public const string SaveName = "pedal_key_mapping";

        public int version = 2;
        public string savedUtc;
        /// <summary>"calibration", "default" or "manual".</summary>
        public string source = "calibration";
        public bool validated;
        public string keyboardProduct;
        public string keyboardLayout;
        public List<string> brakeKeys = new List<string>();
        public List<string> acceleratorKeys = new List<string>();

        public bool IsUsable => brakeKeys.Count > 0 && acceleratorKeys.Count > 0;

        /// <summary>
        /// Starting point for "Reset to Defaults": the middle letter block as brake and the
        /// navigation/arrow/numpad block on the right as accelerator. Unvalidated: the player must
        /// pass the live test before it drives the car.
        /// </summary>
        public static PedalKeyMapping CreateDefault() => new PedalKeyMapping
        {
            source = "default",
            validated = false,
            brakeKeys = new List<string> { "T", "Y", "U", "G", "H", "J", "B", "N", "M", "Digit6", "Digit7" },
            acceleratorKeys = new List<string>
            {
                "UpArrow", "DownArrow", "LeftArrow", "RightArrow", "Insert", "Delete", "Home", "End", "PageUp", "PageDown",
                "Numpad0", "Numpad1", "Numpad2", "Numpad3", "Numpad4", "Numpad5", "Numpad6", "Numpad7", "Numpad8", "Numpad9",
                "NumpadEnter", "NumpadPlus", "NumpadMinus", "NumpadPeriod", "NumpadMultiply", "NumpadDivide",
            },
        };

#if ENABLE_INPUT_SYSTEM
        public static List<string> ToNames(IEnumerable<int> keys)
        {
            var names = new List<string>();
            foreach (int key in keys) names.Add(((Key)key).ToString());
            return names;
        }

        public static List<Key> Parse(IEnumerable<string> names)
        {
            var keys = new List<Key>();
            foreach (string name in names)
                if (Enum.TryParse(name, out Key key) && key != Key.None && !keys.Contains(key)) keys.Add(key);
            return keys;
        }
#endif
    }
}
