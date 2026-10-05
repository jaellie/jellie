using DearMe.Save;
using UnityEngine;

namespace DearMe.Platform
{
    /// <summary>
    /// PlayerPrefs-backed storage. On Web builds Unity keeps PlayerPrefs in the browser's
    /// IndexedDB, and PlayerPrefs.Save() is what pushes it there, so Flush() is called after
    /// every checkpoint in case the tab is closed or refreshed.
    /// </summary>
    public class PlayerPrefsStorage : ISaveStorage
    {
        public string Read(string key) => PlayerPrefs.HasKey(key) ? PlayerPrefs.GetString(key) : null;
        public void Write(string key, string value) => PlayerPrefs.SetString(key, value);
        public void Delete(string key) => PlayerPrefs.DeleteKey(key);
        public void Flush() => PlayerPrefs.Save();
    }

    public class JsonUtilitySaveSerializer : IJsonSerializer
    {
        public string ToJson(SaveData data) => JsonUtility.ToJson(data);

        public SaveData FromJson(string json)
        {
            try
            {
                return DearMe.Content.ContentSanitizer.Sanitize(JsonUtility.FromJson<SaveData>(json));
            }
            catch (System.ArgumentException)
            {
                return null; // Malformed text: SaveService falls back to the backup slot.
            }
        }
    }
}
