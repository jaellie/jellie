using System;
using DrivingSim.Core;
using DrivingSim.Localization;
using DrivingSim.Persistence;

namespace DrivingSim.Startup
{
    [Serializable]
    public class DisclaimerAcknowledgment
    {
        public int version;
        public string acknowledgedUtc;
        public string language;
    }

    /// <summary>
    /// Stores the player's acknowledgment of the first-launch notice (version, time, language) in
    /// persistentDataPath/disclaimer_acknowledgment.json. Independent of any screen: the view only
    /// calls <see cref="Acknowledge"/>.
    /// </summary>
    public static class DisclaimerService
    {
        public const string SaveName = "disclaimer_acknowledgment";
        public const string TitleKey = "disclaimer.title";
        public const string BodyKey = "disclaimer.body";
        public const string AcceptKey = "disclaimer.accept";
        public const string CloseKey = "common.close";

        static DisclaimerAcknowledgment record;
        static bool loaded;

        public static event Action Acknowledged;

        public static int CurrentVersion => DisclaimerPolicy.CurrentVersion;

        public static DisclaimerAcknowledgment Record
        {
            get
            {
                if (!loaded)
                {
                    loaded = true;
                    SaveManager.TryLoad(SaveName, out record);
                }
                return record;
            }
        }

        public static bool IsAcknowledged => Record != null && !DisclaimerPolicy.NeedsAcknowledgment(Record.version);

        public static void Acknowledge()
        {
            record = new DisclaimerAcknowledgment
            {
                version = CurrentVersion,
                acknowledgedUtc = DateTime.UtcNow.ToString("o"),
                language = LanguageInfo.Code(LocalizationService.Current),
            };
            loaded = true;
            SaveManager.Save(SaveName, record);
            Acknowledged?.Invoke();
        }

        /// <summary>Development/testing: forget the acknowledgment so the notice shows again.</summary>
        public static void ClearAcknowledgment()
        {
            SaveManager.Delete(SaveName);
            record = null;
            loaded = true;
        }

        /// <summary>Drops the cached record so the next read comes from disk.</summary>
        public static void Reload()
        {
            loaded = false;
            record = null;
        }

        [UnityEngine.RuntimeInitializeOnLoadMethod(UnityEngine.RuntimeInitializeLoadType.SubsystemRegistration)]
        static void ResetStatics()
        {
            loaded = false;
            record = null;
            Acknowledged = null;
        }
    }
}
