using System;
using UnityEngine;

namespace DrivingSim.UI
{
    // Presentation data only. The gameplay host owns availability, identifiers and launch behavior.
    public enum PracticeMode { FreeDriving, Missions }

    [Serializable]
    public sealed class PracticeMissionOption
    {
        public string id;
        public string titleKey;
        public string descriptionKey;
        public bool available;
    }

    [Serializable]
    public sealed class PracticeEnvironmentOption
    {
        public string id;
        public string titleKey;
        public string descriptionKey;
        public string detailsKey;
        public Texture preview;
        public bool available;
        public bool freeDrivingAvailable;
        public PracticeMissionOption[] missions = Array.Empty<PracticeMissionOption>();
    }

    public readonly struct PracticeLaunchRequest
    {
        public readonly string EnvironmentId;
        public readonly PracticeMode Mode;
        public readonly string MissionId;

        public PracticeLaunchRequest(string environmentId, PracticeMode mode, string missionId)
        {
            EnvironmentId = environmentId;
            Mode = mode;
            MissionId = missionId;
        }
    }
}
