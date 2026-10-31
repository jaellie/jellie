using System.Collections.Generic;
using DrivingSim.Core;
using DrivingSim.Startup;
using DrivingSim.UI;
using UnityEngine;
using UnityEngine.EventSystems;

namespace DrivingSim.Flow
{
    /// <summary>
    /// Builds the main menu scene at runtime: EventSystem, startup gate (language + notice), and the
    /// menu with the environment catalog. The menu view is an interim functional screen; the redesigned
    /// UI replaces the view without changing this flow.
    /// </summary>
    public class MainMenuBootstrap : MonoBehaviour
    {
        PracticeMenuView menu;

        void Start()
        {
            EnsureCamera();
            EnsureEventSystem();
            StartupFlow startup = FindFirstObjectByType<StartupFlow>();
            if (startup == null) startup = new GameObject("StartupFlow").AddComponent<StartupFlow>();

            menu = PracticeMenuView.Create(startup);
            menu.SetCatalog(BuildOptions());
            menu.LaunchRequested += OnLaunchRequested;
            menu.ShowHome();
        }

        void OnDestroy()
        {
            if (menu != null) menu.LaunchRequested -= OnLaunchRequested;
        }

        void OnLaunchRequested(PracticeLaunchRequest request)
        {
            bool started = request.Mode == PracticeMode.FreeDriving && GameFlow.StartFreeDriving(request.EnvironmentId);
            if (!started) menu.ClearLaunchPending(); // missions are not implemented; unavailable maps never launch
        }

        static List<PracticeEnvironmentOption> BuildOptions()
        {
            var options = new List<PracticeEnvironmentOption>();
            foreach (EnvironmentInfo info in EnvironmentCatalog.All)
            {
                options.Add(new PracticeEnvironmentOption
                {
                    id = info.Id,
                    titleKey = info.TitleKey,
                    descriptionKey = info.DescriptionKey,
                    detailsKey = info.Status == EnvironmentStatus.Playable ? "environments.ready" : "environments.planned",
                    available = info.Status == EnvironmentStatus.Playable,
                    freeDrivingAvailable = info.CanLaunchFreeDriving,
                    missions = System.Array.Empty<PracticeMissionOption>(),
                });
            }
            return options;
        }

        static void EnsureCamera()
        {
            if (Camera.main != null) return;
            var cameraObject = new GameObject("MenuCamera") { tag = "MainCamera" };
            Camera camera = cameraObject.AddComponent<Camera>();
            camera.clearFlags = CameraClearFlags.SolidColor;
            camera.backgroundColor = new Color(0.02f, 0.035f, 0.06f);
            cameraObject.AddComponent<AudioListener>();
        }

        static void EnsureEventSystem()
        {
            EventSystem events = FindFirstObjectByType<EventSystem>();
            if (events == null)
            {
                var go = new GameObject("EventSystem", typeof(EventSystem));
#if ENABLE_INPUT_SYSTEM
                var module = go.AddComponent<UnityEngine.InputSystem.UI.InputSystemUIInputModule>();
                module.AssignDefaultActions();
#else
                go.AddComponent<StandaloneInputModule>();
#endif
                events = go.GetComponent<EventSystem>();
            }
            events.sendNavigationEvents = false; // a foot on the floor keyboard must not press buttons
        }
    }
}
