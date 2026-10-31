using System;
using System.Collections.Generic;
#if ENABLE_INPUT_SYSTEM
using UnityEngine.InputSystem;
#endif

namespace DrivingSim.Controls
{
    /// <summary>
    /// Saved foot-pedal key assignment. Keys are stored by Input System <c>Key</c> name (physical
    /// key position, layout independent) so the file survives enum reordering.
    /// </summary>
    [Serializable]
    public class PedalKeyMapping
    {
        public const string SaveName = "pedal_key_mapping";

        public int version = 1;
        public string savedUtc;
        public List<string> brakeKeys = new List<string>();
        public List<string> acceleratorKeys = new List<string>();

        public bool IsUsable => brakeKeys.Count > 0 && acceleratorKeys.Count > 0;

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
