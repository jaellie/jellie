using System;
using UnityEngine;

namespace DrivingSim.UI
{
    public enum HudMode { Minimal, Practice }

    /// <summary>Finger circle → wheel turn. Values are gains for TouchSteeringController.angularGain.</summary>
    public enum SteeringSensitivity { Low, Normal, Realistic }

    /// <summary>
    /// Player preferences for the driving HUD, saved in PlayerPrefs. Presentation and input mapping only;
    /// vehicle physics and steering geometry are not affected.
    /// </summary>
    public static class DriverPreferences
    {
        const string Prefix = "DrivingSim.Prefs.";

        public static event Action Changed;

        public static HudMode Hud { get => (HudMode)Get("Hud", (int)HudMode.Minimal); set => Set("Hud", (int)value); }

        /// <summary>Provisional default: Normal (¾ turn per finger circle), to be calibrated on Android.</summary>
        public static SteeringSensitivity Sensitivity { get => (SteeringSensitivity)Get("Sensitivity", (int)SteeringSensitivity.Normal); set => Set("Sensitivity", (int)value); }

        public static bool SteeringHalo { get => Get("Halo", 1) == 1; set => Set("Halo", value ? 1 : 0); }
        public static bool Minimap { get => Get("Minimap", 1) == 1; set => Set("Minimap", value ? 1 : 0); }
        public static bool ChaseViewByDefault { get => Get("ChaseDefault", 0) == 1; set => Set("ChaseDefault", value ? 1 : 0); }

        public static float SteeringGain(SteeringSensitivity s) =>
            s == SteeringSensitivity.Low ? 0.5f : s == SteeringSensitivity.Realistic ? 1f : 0.75f;

        public static float CurrentSteeringGain => SteeringGain(Sensitivity);

        static int Get(string key, int fallback)
        {
            try { return PlayerPrefs.GetInt(Prefix + key, fallback); }
            catch (Exception) { return fallback; }
        }

        static void Set(string key, int value)
        {
            try
            {
                if (PlayerPrefs.GetInt(Prefix + key, int.MinValue) == value) return;
                PlayerPrefs.SetInt(Prefix + key, value);
                PlayerPrefs.Save();
            }
            catch (Exception e) { Debug.LogWarning($"[Prefs] {e.Message}"); }
            Changed?.Invoke();
        }

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.SubsystemRegistration)]
        static void ResetStatics() => Changed = null;
    }
}
