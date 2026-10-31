using System.Collections.Generic;

namespace DrivingSim.Controls
{
    /// <summary>
    /// Global switches used while a modal screen (pause menu, pedal calibration) owns the input.
    /// While driving is blocked the router holds the brake and sends no other input.
    /// </summary>
    public static class DrivingInputGate
    {
        static readonly HashSet<object> drivingBlockers = new HashSet<object>();
        static readonly HashSet<object> shortcutBlockers = new HashSet<object>();

        public static bool DrivingBlocked => drivingBlockers.Count > 0;

        /// <summary>When true, KeyboardShim reports no keys (e.g. while stomping on the keyboard during calibration).</summary>
        public static bool KeyboardShortcutsBlocked => shortcutBlockers.Count > 0;

        public static void BlockDriving(object owner, bool blockKeyboardShortcuts = false)
        {
            drivingBlockers.Add(owner);
            if (blockKeyboardShortcuts) shortcutBlockers.Add(owner);
        }

        public static void Release(object owner)
        {
            drivingBlockers.Remove(owner);
            shortcutBlockers.Remove(owner);
        }
    }

    /// <summary>
    /// Keys claimed by the foot-pedal keyboard. KeyboardShim ignores them so stepping on a pedal
    /// never also shifts gear, toggles a light or switches the camera. Values are Input System Key codes.
    /// </summary>
    public static class PedalKeyReservation
    {
        static readonly HashSet<int> reserved = new HashSet<int>();

        public static void Set(IEnumerable<int> keys)
        {
            reserved.Clear();
            if (keys == null) return;
            foreach (int key in keys) reserved.Add(key);
        }

        public static void Clear() => reserved.Clear();
        public static bool IsReserved(int key) => reserved.Contains(key);
        public static int Count => reserved.Count;
    }
}
