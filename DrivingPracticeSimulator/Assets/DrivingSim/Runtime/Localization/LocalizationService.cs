using System;
using DrivingSim.Core;
using UnityEngine;
using UnityEngine.UI;

namespace DrivingSim.Localization
{
    /// <summary>
    /// Runtime localization: loads Resources/Localization/strings.json, keeps the current language,
    /// persists the player's choice and raises <see cref="LanguageChanged"/> so open screens refresh.
    /// Integration API for UI (see INTEGRATION.md): <see cref="T(string)"/>, <see cref="SetLanguage"/>,
    /// <see cref="Current"/>, <see cref="HasSavedChoice"/>, <see cref="LanguageChanged"/>.
    /// </summary>
    public static class LocalizationService
    {
        public const string PrefsKey = "DrivingSim.Language";
        public const string ResourcePath = "Localization/strings";

        static StringTable table;
        static Language current;
        static bool initialized;
        static bool hasSavedChoice;

        public static event Action<Language> LanguageChanged;

        public static Language Current { get { EnsureInitialized(); return current; } }

        /// <summary>False until the player has picked a language once (first launch shows the language screen).</summary>
        public static bool HasSavedChoice { get { EnsureInitialized(); return hasSavedChoice; } }

        public static StringTable Table { get { EnsureInitialized(); return table; } }

        public static void SetLanguage(Language language, bool save = true)
        {
            EnsureInitialized();
            bool changed = language != current;
            current = language;
            if (save)
            {
                hasSavedChoice = true;
                try
                {
                    PlayerPrefs.SetString(PrefsKey, LanguageInfo.Code(language));
                    PlayerPrefs.Save();
                }
                catch (Exception e) { Debug.LogWarning($"[Localization] Could not save language: {e.Message}"); }
            }
            if (changed) LanguageChanged?.Invoke(language);
        }

        public static string T(string key) => Table.Get(key, Current);

        public static string T(string key, params object[] args)
        {
            string format = T(key);
            try { return string.Format(format, args); }
            catch (FormatException) { return format; }
        }

        /// <summary>The text of a key in a specific language (e.g. bilingual first-launch screens).</summary>
        public static string In(Language language, string key) => Table.Get(key, language);

        /// <summary>Reloads strings.json (after editing it while the game runs).</summary>
        public static void Reload()
        {
            initialized = false;
            EnsureInitialized();
            LanguageChanged?.Invoke(current);
        }

        static void EnsureInitialized()
        {
            if (initialized) return;
            initialized = true;

            StringTableData data = null;
            var asset = Resources.Load<TextAsset>(ResourcePath);
            if (asset != null)
            {
                try { data = JsonUtility.FromJson<StringTableData>(asset.text); }
                catch (Exception e) { Debug.LogError($"[Localization] strings.json is invalid: {e.Message}"); }
            }
            else
            {
                Debug.LogError($"[Localization] Missing Resources/{ResourcePath}.json");
            }
            table = new StringTable(data?.entries);
            foreach (string duplicate in table.DuplicateKeys) Debug.LogWarning($"[Localization] Duplicate key '{duplicate}'");

            string saved = null;
            try { saved = PlayerPrefs.GetString(PrefsKey, null); } catch (Exception) { /* not available */ }
            hasSavedChoice = LanguageInfo.TryParse(saved, out current);
            if (!hasSavedChoice) current = Application.systemLanguage == SystemLanguage.Korean ? Language.Korean : Language.EnglishUS;
        }

        // Survive "Enter Play Mode" without domain reload.
        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.SubsystemRegistration)]
        static void ResetStatics()
        {
            initialized = false;
            LanguageChanged = null;
        }
    }

    /// <summary>Short alias: <c>Loc.T("hud.brake")</c>.</summary>
    public static class Loc
    {
        public static string T(string key) => LocalizationService.T(key);
        public static string T(string key, params object[] args) => LocalizationService.T(key, args);
    }

    /// <summary>
    /// Keeps a uGUI Text in the current language. Put it on any label with a fixed key; for text
    /// built at runtime, subscribe to <see cref="LocalizationService.LanguageChanged"/> instead.
    /// </summary>
    [RequireComponent(typeof(Text))]
    public class LocalizedText : MonoBehaviour
    {
        [SerializeField] string key;
        Text text;

        public string Key
        {
            get => key;
            set { key = value; Refresh(); }
        }

        void Awake() => text = GetComponent<Text>();

        void OnEnable()
        {
            LocalizationService.LanguageChanged += OnLanguageChanged;
            Refresh();
        }

        void OnDisable() => LocalizationService.LanguageChanged -= OnLanguageChanged;

        void OnLanguageChanged(Language _) => Refresh();

        public void Refresh()
        {
            if (text == null) text = GetComponent<Text>();
            if (text != null && !string.IsNullOrEmpty(key)) text.text = LocalizationService.T(key);
        }
    }
}
