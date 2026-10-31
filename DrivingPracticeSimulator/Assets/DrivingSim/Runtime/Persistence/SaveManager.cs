using System;
using System.IO;
using UnityEngine;

namespace DrivingSim.Persistence
{
    /// <summary>Small JSON save files under Application.persistentDataPath. Failures are logged, never thrown.</summary>
    public static class SaveManager
    {
        public static string PathFor(string name) => Path.Combine(Application.persistentDataPath, name + ".json");

        public static bool TryLoad<T>(string name, out T value) where T : class
        {
            value = null;
            try
            {
                string path = PathFor(name);
                if (!File.Exists(path)) return false;
                value = JsonUtility.FromJson<T>(File.ReadAllText(path));
                return value != null;
            }
            catch (Exception e)
            {
                Debug.LogWarning($"[SaveManager] Could not load '{name}': {e.Message}");
                return false;
            }
        }

        public static bool Save<T>(string name, T value)
        {
            try
            {
                Directory.CreateDirectory(Application.persistentDataPath);
                File.WriteAllText(PathFor(name), JsonUtility.ToJson(value, true));
                return true;
            }
            catch (Exception e)
            {
                Debug.LogWarning($"[SaveManager] Could not save '{name}': {e.Message}");
                return false;
            }
        }

        public static void Delete(string name)
        {
            try
            {
                string path = PathFor(name);
                if (File.Exists(path)) File.Delete(path);
            }
            catch (Exception e)
            {
                Debug.LogWarning($"[SaveManager] Could not delete '{name}': {e.Message}");
            }
        }
    }
}
