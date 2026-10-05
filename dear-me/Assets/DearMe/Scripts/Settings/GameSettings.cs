using System;
using System.Globalization;
using System.Text;
using DearMe.Save;
using DearMe.Story;

namespace DearMe.Settings
{
    /// <summary>Player options. Stored separately from story saves so "New game" never resets them.</summary>
    public class GameSettings
    {
        public static readonly float[] TextScales = { 0.9f, 1f, 1.15f, 1.3f };

        public int textScaleIndex = 1;
        public LanguageSupportLevel support = LanguageSupportLevel.Low;
        public float soundVolume = 0.8f;
        public float musicVolume = 0.6f;
        public bool reducedMotion;

        public float TextScale => TextScales[Math.Max(0, Math.Min(TextScales.Length - 1, textScaleIndex))];

        public event Action Changed;

        public void NotifyChanged() => Changed?.Invoke();

        const string Key = "dearme.settings";

        public string Serialize()
        {
            var sb = new StringBuilder();
            sb.Append("text=").Append(textScaleIndex).Append(';');
            sb.Append("support=").Append((int)support).Append(';');
            sb.Append("sound=").Append(soundVolume.ToString(CultureInfo.InvariantCulture)).Append(';');
            sb.Append("music=").Append(musicVolume.ToString(CultureInfo.InvariantCulture)).Append(';');
            sb.Append("motion=").Append(reducedMotion ? 1 : 0);
            return sb.ToString();
        }

        /// <summary>Unknown or malformed entries keep their defaults.</summary>
        public void Deserialize(string text)
        {
            if (string.IsNullOrEmpty(text)) return;
            foreach (var pair in text.Split(';'))
            {
                int eq = pair.IndexOf('=');
                if (eq <= 0) continue;
                string k = pair.Substring(0, eq), v = pair.Substring(eq + 1);
                switch (k)
                {
                    case "text":
                        if (int.TryParse(v, out int t)) textScaleIndex = Math.Max(0, Math.Min(TextScales.Length - 1, t));
                        break;
                    case "support":
                        if (int.TryParse(v, out int s) && s >= 0 && s <= 2) support = (LanguageSupportLevel)s;
                        break;
                    case "sound":
                        if (float.TryParse(v, NumberStyles.Float, CultureInfo.InvariantCulture, out float sv)) soundVolume = Clamp01(sv);
                        break;
                    case "music":
                        if (float.TryParse(v, NumberStyles.Float, CultureInfo.InvariantCulture, out float mv)) musicVolume = Clamp01(mv);
                        break;
                    case "motion":
                        reducedMotion = v == "1";
                        break;
                }
            }
        }

        static float Clamp01(float v) => v < 0 ? 0 : v > 1 ? 1 : v;

        public void Load(ISaveStorage storage) => Deserialize(storage.Read(Key));

        public void Save(ISaveStorage storage)
        {
            storage.Write(Key, Serialize());
            storage.Flush();
        }
    }
}
