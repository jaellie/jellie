using System;
using UnityEngine;

namespace BGB2
{
    public enum Language { English, Korean }

    /// <summary>Inline two-language string. Text ids for a full localization table can replace this later.</summary>
    [Serializable]
    public class LocalizedText
    {
        [TextArea(1, 6)] public string en;
        [TextArea(1, 6)] public string ko;

        public LocalizedText() { }
        public LocalizedText(string en, string ko) { this.en = en; this.ko = ko; }

        public string Get() => Loc.Current == Language.Korean && !string.IsNullOrEmpty(ko) ? ko : en;
    }

    public static class Loc
    {
        public static Language Current = Language.English;
        public static event Action Changed;

        public static void Set(Language lang)
        {
            if (Current == lang) return;
            Current = lang;
            Changed?.Invoke();
        }
    }
}
