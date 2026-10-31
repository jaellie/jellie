using DrivingSim.Startup;
using UnityEngine;
using UnityEngine.EventSystems;

namespace DrivingSim.UI
{
    /// <summary>Isolated UI review harness. All catalog entries are unavailable; contains no driving rig.</summary>
    public class PracticeMenuPreviewHost : MonoBehaviour
    {
        void Start()
        {
            if (FindFirstObjectByType<EventSystem>() == null)
            {
                var events = new GameObject("EventSystem", typeof(EventSystem));
#if ENABLE_INPUT_SYSTEM
                var module = events.AddComponent<UnityEngine.InputSystem.UI.InputSystemUIInputModule>();
                module.AssignDefaultActions();
#else
                events.AddComponent<StandaloneInputModule>();
#endif
            }
            FindFirstObjectByType<EventSystem>().sendNavigationEvents = false;
            StartupFlow flow = new GameObject("StartupFlow").AddComponent<StartupFlow>();
            PracticeMenuView view = PracticeMenuView.Create(flow);
            Texture preview = Resources.Load<Texture2D>("UI/EnvironmentDiagram");
            view.SetCatalog(new[]
            {
                new PracticeEnvironmentOption
                {
                    id = "skills-ground", titleKey = "environments.skills.title",
                    descriptionKey = "environments.skills.description", detailsKey = "environments.skills.details", preview = preview,
                    missions = new[]
                    {
                        new PracticeMissionOption { id = "start-stop", titleKey = "environments.mission.startStop", descriptionKey = "environments.mission.startStopDetail" },
                        new PracticeMissionOption { id = "basic-turns", titleKey = "environments.mission.turns", descriptionKey = "environments.mission.turnsDetail" },
                        new PracticeMissionOption { id = "parking", titleKey = "environments.mission.parking", descriptionKey = "environments.mission.parkingDetail" }
                    }
                },
                Planned("city", "environments.city.title", preview),
                Planned("parking", "environments.parking.title", preview),
                Planned("suburban", "environments.suburban.title", preview)
            });
            view.ShowHome();
        }

        static PracticeEnvironmentOption Planned(string id, string titleKey, Texture preview) =>
            new PracticeEnvironmentOption
            {
                id = id, titleKey = titleKey, descriptionKey = "environments.plannedDescription",
                detailsKey = "environments.planned", preview = preview
            };
    }
}
