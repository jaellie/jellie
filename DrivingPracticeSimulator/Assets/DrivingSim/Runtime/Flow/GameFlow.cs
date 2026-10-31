using DrivingSim.Controls;
using DrivingSim.Core;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace DrivingSim.Flow
{
    /// <summary>
    /// Minimal scene flow: Main Menu → (environment, Free Driving) → driving scene, and back.
    /// Scenes are loaded whole (single mode); the additive map system in ROADMAP.md comes later.
    /// </summary>
    public static class GameFlow
    {
        static AsyncOperation loading;

        public static bool IsLoading => loading != null && !loading.isDone;

        /// <summary>Starts Free Driving in an environment. Returns false (and loads nothing) if it can't be launched.</summary>
        public static bool StartFreeDriving(string environmentId)
        {
            EnvironmentInfo info = EnvironmentCatalog.Find(environmentId);
            if (info == null || !info.CanLaunchFreeDriving) return false;
            return Load(info.SceneName);
        }

        public static bool LoadMainMenu() => Load(EnvironmentCatalog.MainMenuScene);

        static bool Load(string sceneName)
        {
            if (IsLoading) return false;
            if (!Application.CanStreamedLevelBeLoaded(sceneName))
            {
                Debug.LogWarning($"[GameFlow] Scene '{sceneName}' is not in Build Settings. Run DrivingSim → Create Scenes.");
                return false;
            }
            // Leave no pause or modal state behind: the next scene builds its own UI and gates.
            Time.timeScale = 1f;
            DrivingInputGate.ResetAll();
            loading = SceneManager.LoadSceneAsync(sceneName, LoadSceneMode.Single);
            return loading != null;
        }

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.SubsystemRegistration)]
        static void ResetStatics() => loading = null;
    }
}
