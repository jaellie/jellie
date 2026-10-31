using System;
using System.Collections.Generic;
using DrivingSim.Controls;
using DrivingSim.Core;
using DrivingSim.Localization;
using DrivingSim.Startup;
using UnityEngine;
using UnityEngine.UI;

namespace DrivingSim.UI
{
    /// <summary>Style B menu and environment selection. Emits requests; never loads a scene.</summary>
    public class PracticeMenuView : MonoBehaviour
    {
        enum Screen { Home, Environments, Settings }
        [SerializeField] HudTheme theme;
        [SerializeField] StartupFlow startup;
        GameObject root;
        RectTransform card;
        GameObject page;
        Screen screen;
        PracticeMode mode;
        readonly List<PracticeEnvironmentOption> environments = new List<PracticeEnvironmentOption>();
        int selectedEnvironment;
        int selectedMission;
        HoldButton launchButton;
        bool subscribed;
        bool launchPending;
        Action<PracticeLaunchRequest> launchRequested;

        public event Action<PracticeLaunchRequest> LaunchRequested
        {
            add { launchRequested += value; RefreshLaunch(); }
            remove { launchRequested -= value; RefreshLaunch(); }
        }
        public event Action PedalSetupRequested;
        public bool IsVisible => root != null && root.activeSelf;

        public static PracticeMenuView Create(StartupFlow startupFlow, HudTheme themeOverride = null)
        {
            var events = FindFirstObjectByType<UnityEngine.EventSystems.EventSystem>();
            if (events != null) events.sendNavigationEvents = false;
            Transform safe = DrivingHUDController.CreateCanvas("PracticeMenuCanvas", 60);
            var view = safe.root.gameObject.AddComponent<PracticeMenuView>();
            view.theme = themeOverride != null ? themeOverride : HudTheme.Default;
            view.startup = startupFlow;
            view.root = AutomotiveLayout.Modal(safe, view.theme, new Vector2(1856f, 1000f), out view.card);
            view.card.GetComponent<Image>().color = new Color(0.027f, 0.067f, 0.114f, 1f);
            view.Subscribe();
            view.root.SetActive(false);
            return view;
        }

        /// <summary>Host supplies localized metadata and availability. No built-in playable catalog.</summary>
        public void SetCatalog(IEnumerable<PracticeEnvironmentOption> options)
        {
            string previous = CurrentEnvironment?.id;
            environments.Clear();
            if (options != null)
                foreach (PracticeEnvironmentOption item in options)
                    if (item != null && !string.IsNullOrWhiteSpace(item.id)) environments.Add(item);
            selectedEnvironment = Mathf.Max(0, environments.FindIndex(e => e.id == previous));
            selectedMission = 0;
            if (IsVisible) Rebuild();
        }

        public void ShowHome() { screen = Screen.Home; Show(); }
        public void ShowEnvironments() { screen = Screen.Environments; Show(); }

        void Show()
        {
            launchPending = false;
            root.SetActive(true);
            DrivingInputGate.BlockDriving(this, blockKeyboardShortcuts: true);
            Rebuild();
        }

        public void Hide()
        {
            if (root != null) root.SetActive(false);
            DrivingInputGate.Release(this);
        }

        void OnEnable() => Subscribe();
        void OnDisable()
        {
            Unsubscribe();
            Hide();
        }
        void OnDestroy() => DrivingInputGate.Release(this);

        void Subscribe()
        {
            if (subscribed || theme == null) return;
            subscribed = true;
            LocalizationService.LanguageChanged += OnLanguage;
            if (startup != null) startup.GameplayAllowedChanged += RefreshLaunch;
        }
        void Unsubscribe()
        {
            if (!subscribed) return;
            subscribed = false;
            LocalizationService.LanguageChanged -= OnLanguage;
            if (startup != null) startup.GameplayAllowedChanged -= RefreshLaunch;
        }
        void OnLanguage(Language _) { if (IsVisible) Rebuild(); }
        PracticeEnvironmentOption CurrentEnvironment => selectedEnvironment >= 0 && selectedEnvironment < environments.Count ? environments[selectedEnvironment] : null;
        PracticeMissionOption CurrentMission
        {
            get
            {
                PracticeMissionOption[] missions = CurrentEnvironment?.missions;
                return missions != null && selectedMission >= 0 && selectedMission < missions.Length ? missions[selectedMission] : null;
            }
        }

        void Rebuild()
        {
            if (page != null)
            {
                page.SetActive(false);
                Destroy(page);
            }
            launchButton = null;
            RectTransform content = UIBuild.Rect("Page", card, Vector2.one * 0.5f, Vector2.one * 0.5f, Vector2.zero, Vector2.zero);
            UIBuild.Stretch(content);
            page = content.gameObject;
            Label(content, "menu.brand", 48f, 32f, 500f, 52f, 28, theme.iceBlue);
            HoldButton language = Button(content, "pause.language", 1376f, 32f, 200f, 80f, () => startup?.OpenLanguageSelection(), 24);
            language.Interactable = startup != null;
            Button(content, screen == Screen.Settings ? "common.close" : "menu.settings", 1592f, 32f, 216f, 80f,
                () => { screen = screen == Screen.Settings ? Screen.Home : Screen.Settings; Rebuild(); }, 26);
            switch (screen)
            {
                case Screen.Home: BuildHome(content); break;
                case Screen.Environments: BuildEnvironments(content); break;
                case Screen.Settings: BuildSettings(content); break;
            }
            RefreshLaunch();
        }

        void BuildHome(RectTransform parent)
        {
            Label(parent, "menu.tagline", 64f, 240f, 760f, 180f, 56, theme.text);
            Label(parent, "menu.intro", 64f, 438f, 740f, 130f, 30, theme.textMuted);
            HoldButton choose = Button(parent, "menu.chooseEnvironment", 64f, 622f, 680f, 100f, ShowEnvironments, 32);
            AutomotiveLayout.Primary(choose, theme);
            Button(parent, "menu.settings", 64f, 742f, 680f, 96f, () => { screen = Screen.Settings; Rebuild(); }, 30);
            RectTransform preview = Panel(parent, "EnvironmentPreview", 900f, 164f, 908f, 690f);
            AddPreview(preview, CurrentEnvironment?.preview, 24f, 24f, 860f, 490f);
            Label(preview, "menu.environments", 32f, 540f, 820f, 45f, 22, theme.iceBlue);
            Label(preview, CurrentEnvironment?.titleKey ?? "environments.empty", 32f, 600f, 820f, 60f, 32, theme.text);
        }

        void BuildEnvironments(RectTransform parent)
        {
            Label(parent, "environments.title", 48f, 140f, 1300f, 80f, 44, theme.text);
            Button(parent, "menu.back", 1576f, 140f, 232f, 80f, ShowHome, 26);
            RectTransform preview = Panel(parent, "Preview", 48f, 250f, 1104f, 490f);
            AddPreview(preview, CurrentEnvironment?.preview, 16f, 16f, 1072f, 360f);
            Label(preview, CurrentEnvironment?.detailsKey ?? "environments.empty", 28f, 390f, 1048f, 72f, 28, theme.textMuted);
            BuildEnvironmentCards(parent);
            RectTransform detail = Panel(parent, "Detail", 1180f, 250f, 628f, 700f);
            PracticeEnvironmentOption env = CurrentEnvironment;
            Label(detail, env?.titleKey ?? "environments.empty", 28f, 24f, 572f, 70f, 34, theme.text);
            Label(detail, env?.descriptionKey ?? "environments.emptyDescription", 28f, 108f, 572f, 100f, 27, theme.textMuted);
            HoldButton free = Button(detail, "environments.freeDriving", 28f, 230f, 278f, 80f, () => SelectMode(PracticeMode.FreeDriving), 26);
            HoldButton missions = Button(detail, "environments.missions", 322f, 230f, 278f, 80f, () => SelectMode(PracticeMode.Missions), 26);
            free.SetToggled(mode == PracticeMode.FreeDriving);
            missions.SetToggled(mode == PracticeMode.Missions);
            if (mode == PracticeMode.FreeDriving)
                Label(detail, "environments.freeDescription", 28f, 342f, 572f, 180f, 28, theme.textMuted);
            else BuildMissions(detail);
            string key = mode == PracticeMode.FreeDriving ? "environments.startFreeDriving" : "environments.startMission";
            launchButton = Button(detail, key, 28f, 586f, 572f, 88f, RequestLaunch, 28);
            AutomotiveLayout.Primary(launchButton, theme);
        }

        void BuildEnvironmentCards(RectTransform parent)
        {
            RectTransform viewport = UIBuild.Rect("EnvironmentCards", parent, new Vector2(0f, 1f), new Vector2(0f, 1f),
                new Vector2(48f, -764f), new Vector2(1104f, 186f));
            UIBuild.Panel(viewport, null, Color.clear, true);
            viewport.gameObject.AddComponent<RectMask2D>();
            float width = Mathf.Max(1104f, environments.Count * 278f - 12f);
            RectTransform row = UIBuild.Rect("Cards", viewport, new Vector2(0f, 1f), new Vector2(0f, 1f), Vector2.zero, new Vector2(width, 186f));
            ScrollRect scroll = viewport.gameObject.AddComponent<ScrollRect>();
            scroll.viewport = viewport; scroll.content = row;
            scroll.vertical = false; scroll.movementType = ScrollRect.MovementType.Clamped;
            row.anchoredPosition = new Vector2(-Mathf.Clamp(selectedEnvironment * 278f, 0f, width - 1104f), 0f);
            for (int i = 0; i < environments.Count; i++)
            {
                int index = i;
                PracticeEnvironmentOption env = environments[i];
                HoldButton choice = Button(row, env.titleKey, i * 278f, 0f, 266f, 112f,
                    () => { selectedEnvironment = index; selectedMission = 0; Rebuild(); }, 26);
                choice.SetToggled(i == selectedEnvironment);
                Label(row, env.available ? "environments.ready" : "environments.planned", i * 278f + 16f, 128f, 234f, 44f, 22,
                    env.available ? theme.acceleratorGreen : theme.textMuted);
            }
        }

        void BuildMissions(RectTransform detail)
        {
            PracticeMissionOption[] options = CurrentEnvironment?.missions;
            if (options == null || options.Length == 0)
            {
                Label(detail, "environments.noMissions", 28f, 350f, 572f, 160f, 28, theme.textMuted);
                return;
            }
            RectTransform viewport = UIBuild.Rect("Missions", detail, new Vector2(0f, 1f), new Vector2(0f, 1f),
                new Vector2(28f, -334f), new Vector2(572f, 228f));
            UIBuild.Panel(viewport, null, Color.clear, true);
            viewport.gameObject.AddComponent<RectMask2D>();
            RectTransform list = UIBuild.Rect("Items", viewport, new Vector2(0f, 1f), new Vector2(0f, 1f), Vector2.zero,
                new Vector2(572f, Mathf.Max(228f, options.Length * 128f)));
            ScrollRect scroll = viewport.gameObject.AddComponent<ScrollRect>();
            scroll.viewport = viewport; scroll.content = list;
            scroll.horizontal = false; scroll.movementType = ScrollRect.MovementType.Clamped;
            for (int i = 0; i < options.Length; i++)
            {
                if (options[i] == null) continue;
                int index = i;
                PracticeMissionOption option = options[i];
                HoldButton choice = Button(list, option.titleKey, 0f, i * 128f, 572f, 76f,
                    () => { selectedMission = index; Rebuild(); }, 26);
                choice.SetToggled(i == selectedMission);
                string description = option.available ? option.descriptionKey : "environments.planned";
                Label(list, description, 16f, i * 128f + 82f, 540f, 40f, 22, theme.textMuted);
            }
        }

        void BuildSettings(RectTransform parent)
        {
            Label(parent, "menu.settings", 500f, 210f, 856f, 80f, 44, theme.text);
            HoldButton language = Button(parent, "pause.language", 500f, 340f, 856f, 96f, () => startup?.OpenLanguageSelection(), 32);
            HoldButton notice = Button(parent, "pause.notice", 500f, 460f, 856f, 96f, () => startup?.OpenDisclaimer(), 32);
            HoldButton pedals = Button(parent, "pause.pedals", 500f, 580f, 856f, 96f, () => PedalSetupRequested?.Invoke(), 32);
            language.Interactable = notice.Interactable = startup != null;
            pedals.Interactable = PedalSetupRequested != null;
            Button(parent, "common.close", 500f, 740f, 856f, 96f, ShowHome, 32);
        }

        void SelectMode(PracticeMode value) { mode = value; selectedMission = 0; Rebuild(); }

        bool CanLaunch()
        {
            PracticeEnvironmentOption env = CurrentEnvironment;
            if (launchPending || startup == null || !startup.GameplayAllowed || startup.IsShowingScreen || launchRequested == null || env == null || !env.available) return false;
            if (mode == PracticeMode.FreeDriving) return env.freeDrivingAvailable;
            PracticeMissionOption mission = CurrentMission;
            return mission != null && mission.available && !string.IsNullOrWhiteSpace(mission.id);
        }

        void RefreshLaunch()
        {
            if (launchButton == null) return;
            bool ready = CanLaunch();
            launchButton.Interactable = ready;
            launchButton.normalColor = ready ? theme.iceBlue : theme.panel;
            launchButton.GetComponent<Graphic>().color = launchButton.normalColor;
            Text label = launchButton.GetComponentInChildren<Text>();
            label.color = ready ? theme.panelStrong : theme.textMuted;
            label.text = Loc.T(launchPending ? "environments.launchPending" : ready ? mode == PracticeMode.FreeDriving ? "environments.startFreeDriving" : "environments.startMission" : "environments.unavailable");
        }

        /// <summary>Host calls after a rejected/failed launch to let the player try again.</summary>
        public void ClearLaunchPending() { launchPending = false; RefreshLaunch(); }

        void RequestLaunch()
        {
            if (!CanLaunch()) return;
            launchPending = true;
            RefreshLaunch();
            launchRequested?.Invoke(new PracticeLaunchRequest(CurrentEnvironment.id, mode,
                mode == PracticeMode.Missions ? CurrentMission.id : null));
            // Host validates/loads and calls Hide only when it accepts. Menu keeps the input gate meanwhile.
        }

        RectTransform Panel(Transform parent, string name, float x, float y, float width, float height)
        {
            RectTransform rect = UIBuild.Rect(name, parent, new Vector2(0f, 1f), new Vector2(0f, 1f),
                new Vector2(x, -y), new Vector2(width, height));
            UIBuild.Panel(rect, theme.RoundedPanel, theme.panelStrong);
            var edge = rect.gameObject.AddComponent<Outline>();
            edge.effectColor = new Color(theme.iceBlue.r, theme.iceBlue.g, theme.iceBlue.b, 0.12f);
            edge.effectDistance = new Vector2(1f, -1f);
            return rect;
        }
        void Label(Transform parent, string key, float x, float y, float width, float height, int size, Color color)
        {
            RectTransform rect = UIBuild.Rect("Text", parent, new Vector2(0f, 1f), new Vector2(0f, 1f), new Vector2(x, -y), new Vector2(width, height));
            UIBuild.Label("Label", rect, Loc.T(key), theme.Font, size, color, TextAnchor.UpperLeft);
        }
        HoldButton Button(Transform parent, string key, float x, float y, float width, float height, Action action, int size)
        {
            HoldButton button = UIBuild.Button(key, parent, new Vector2(0f, 1f), new Vector2(0f, 1f),
                new Vector2(x, -y), new Vector2(width, height), Loc.T(key), theme, size, out _);
            button.Pressed += action;
            return button;
        }
        void AddPreview(Transform parent, Texture texture, float x, float y, float width, float height)
        {
            RectTransform rect = UIBuild.Rect("PreviewImage", parent, new Vector2(0f, 1f), new Vector2(0f, 1f), new Vector2(x, -y), new Vector2(width, height));
            if (texture != null)
            {
                RectTransform fitted = UIBuild.Rect("FittedImage", rect, Vector2.one * 0.5f, Vector2.one * 0.5f, Vector2.zero, Vector2.zero);
                var image = fitted.gameObject.AddComponent<RawImage>();
                image.texture = texture;
                image.raycastTarget = false;
                var fit = fitted.gameObject.AddComponent<AspectRatioFitter>();
                fit.aspectMode = AspectRatioFitter.AspectMode.FitInParent;
                fit.aspectRatio = (float)texture.width / Mathf.Max(1, texture.height);
            }
            else UIBuild.Label("Placeholder", rect, Loc.T("environments.preview"), theme.Font, 24, theme.textMuted);
        }
    }
}
