using System;
using System.Collections.Generic;

namespace DrivingSim.Core
{
    public enum Language
    {
        Korean,
        EnglishUS,
    }

    public static class LanguageInfo
    {
        public static readonly IReadOnlyList<Language> All = new[] { Language.Korean, Language.EnglishUS };

        /// <summary>BCP-47 code stored in saves ("ko-KR", "en-US").</summary>
        public static string Code(Language language) => language == Language.Korean ? "ko-KR" : "en-US";

        public static bool TryParse(string code, out Language language)
        {
            switch (code)
            {
                case "ko-KR": language = Language.Korean; return true;
                case "en-US": language = Language.EnglishUS; return true;
                default: language = Language.Korean; return false;
            }
        }
    }

    /// <summary>One string in every supported language. Serialized as-is in strings.json.</summary>
    [Serializable]
    public class StringEntry
    {
        public string key;
        public string ko;
        public string en;
        /// <summary>Optional context for translators/designers (where it appears, length limits).</summary>
        public string note;
    }

    [Serializable]
    public class StringTableData
    {
        public List<StringEntry> entries = new List<StringEntry>();
    }

    /// <summary>
    /// Key → text lookup. Missing translations fall back to Korean (the source language), then to
    /// "[key]" so a missing string is visible instead of blank. Engine-free and unit tested.
    /// </summary>
    public sealed class StringTable
    {
        readonly Dictionary<string, StringEntry> entries = new Dictionary<string, StringEntry>(StringComparer.Ordinal);
        readonly List<string> duplicates = new List<string>();

        public StringTable(IEnumerable<StringEntry> source)
        {
            if (source == null) return;
            foreach (StringEntry entry in source)
            {
                if (entry == null || string.IsNullOrEmpty(entry.key)) continue;
                if (entries.ContainsKey(entry.key)) duplicates.Add(entry.key);
                entries[entry.key] = entry;
            }
        }

        public IReadOnlyList<string> DuplicateKeys => duplicates;
        public IEnumerable<string> Keys => entries.Keys;
        public int Count => entries.Count;
        public bool Contains(string key) => key != null && entries.ContainsKey(key);

        public string Get(string key, Language language)
        {
            if (key == null || !entries.TryGetValue(key, out StringEntry entry)) return "[" + key + "]";
            string text = language == Language.Korean ? entry.ko : entry.en;
            if (string.IsNullOrEmpty(text)) text = entry.ko;
            return string.IsNullOrEmpty(text) ? "[" + key + "]" : text;
        }

        public List<string> MissingTranslations(Language language)
        {
            var missing = new List<string>();
            foreach (StringEntry entry in entries.Values)
                if (string.IsNullOrEmpty(language == Language.Korean ? entry.ko : entry.en)) missing.Add(entry.key);
            return missing;
        }
    }

    /// <summary>
    /// First-launch notice policy. Bump <see cref="CurrentVersion"/> whenever the notice text changes
    /// materially; everyone is then asked to acknowledge it again.
    /// </summary>
    public static class DisclaimerPolicy
    {
        public const int CurrentVersion = 1;

        public static bool NeedsAcknowledgment(int acknowledgedVersion) => acknowledgedVersion < CurrentVersion;
    }
}
