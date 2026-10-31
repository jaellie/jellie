using System.Collections.Generic;

namespace DrivingSim.Core
{
    public enum EnvironmentStatus
    {
        /// <summary>Has a scene in the build and can be driven now.</summary>
        Playable,
        /// <summary>Being built; shown, cannot be launched.</summary>
        InDevelopment,
        /// <summary>On the roadmap only; shown, cannot be launched.</summary>
        Planned,
    }

    /// <summary>One driving environment as the menus present it. Data only; no loading logic.</summary>
    public sealed class EnvironmentInfo
    {
        public readonly string Id;
        public readonly string TitleKey;
        public readonly string DescriptionKey;
        /// <summary>1 = beginner, 2 = intermediate, 3 = advanced.</summary>
        public readonly int Difficulty;
        public readonly EnvironmentStatus Status;
        /// <summary>Scene name in Build Settings; null unless <see cref="Status"/> is Playable.</summary>
        public readonly string SceneName;
        public readonly bool FreeDrivingAvailable;
        /// <summary>Missions are not implemented yet (no mission system); always false for now.</summary>
        public readonly bool MissionsAvailable;

        public EnvironmentInfo(string id, string titleKey, string descriptionKey, int difficulty, EnvironmentStatus status,
            string sceneName = null, bool freeDrivingAvailable = false, bool missionsAvailable = false)
        {
            Id = id;
            TitleKey = titleKey;
            DescriptionKey = descriptionKey;
            Difficulty = difficulty;
            Status = status;
            SceneName = sceneName;
            FreeDrivingAvailable = status == EnvironmentStatus.Playable && freeDrivingAvailable;
            MissionsAvailable = status == EnvironmentStatus.Playable && missionsAvailable;
        }

        public bool CanLaunchFreeDriving => FreeDrivingAvailable && !string.IsNullOrEmpty(SceneName);
    }

    /// <summary>
    /// The environments shown in the menus. Only the test town is playable; the four roadmap maps
    /// are listed honestly as planned (ROADMAP.md, "Future feature: map selection").
    /// </summary>
    public static class EnvironmentCatalog
    {
        public const string MainMenuScene = "MainMenu";
        public const string TestTownScene = "TestTown";
        public const string TestTownId = "test_town";

        public static readonly IReadOnlyList<EnvironmentInfo> All = new[]
        {
            new EnvironmentInfo(TestTownId, "map.testTown.title", "map.testTown.description", 1,
                EnvironmentStatus.Playable, TestTownScene, freeDrivingAvailable: true),
            new EnvironmentInfo("practice_ground", "map.practiceGround.title", "map.practiceGround.description", 1, EnvironmentStatus.Planned),
            new EnvironmentInfo("urban", "map.urban.title", "map.urban.description", 3, EnvironmentStatus.Planned),
            new EnvironmentInfo("residential", "map.residential.title", "map.residential.description", 2, EnvironmentStatus.Planned),
            new EnvironmentInfo("suburban", "map.suburban.title", "map.suburban.description", 2, EnvironmentStatus.Planned),
        };

        public static EnvironmentInfo Find(string id)
        {
            foreach (EnvironmentInfo info in All)
                if (info.Id == id) return info;
            return null;
        }
    }
}
