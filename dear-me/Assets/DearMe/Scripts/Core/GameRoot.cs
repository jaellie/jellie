using DearMe.Audio;
using DearMe.Content;
using DearMe.Input;
using DearMe.Platform;
using DearMe.Save;
using DearMe.Settings;
using DearMe.Story;
using DearMe.UI;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

namespace DearMe.Core
{
    /// <summary>
    /// Composition root. Creates the services and views, connects their events, and owns the
    /// title → play → title flow. It holds references, not game rules: story logic lives in
    /// StoryRunner/StoryStateManager, presentation in the views.
    ///
    /// Boots itself in any scene (even an empty one), so there are no scene or prefab
    /// references to break.
    /// </summary>
    public class GameRoot : MonoBehaviour
    {
        static GameRoot instance;

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.SubsystemRegistration)]
        static void ResetStatics() => instance = null; // supports "Enter Play Mode" without domain reload

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        static void Boot()
        {
            if (instance != null) return;
            new GameObject("DearMe").AddComponent<GameRoot>();
        }

        ContentDatabase db;
        GameSettings settings;
        PlayerPrefsStorage storage;
        SaveService saves;
        InputGate gate;
        Theme theme;

        AudioManager audioManager;
        TooltipController tooltips;
        BackgroundView background;
        RoomView room;
        DialogueView dialogue;
        ChoiceListView choices;
        DocumentView documents;
        PhotoView photos;
        DrillView drills;
        ScreenFader fader;
        MemoryToast toast;
        MainMenuView mainMenu;
        PauseMenu pause;
        SettingsView settingsView;
        ConfirmDialog confirm;
        EndCardView endCard;
        GameObject hudMenuButton;
        RectTransform canvasRoot;

        StoryPresenter presenter;
        StoryStateManager story;
        StoryRunner runner;
        InputState stateBeforePause;
        bool inGame;

        void Awake()
        {
            if (instance != null && instance != this)
            {
                Destroy(gameObject);
                return;
            }
            instance = this;

            storage = new PlayerPrefsStorage();
            settings = new GameSettings();
            settings.Load(storage);
            saves = new SaveService(storage, new JsonUtilitySaveSerializer());
            gate = new InputGate();
            db = ContentLoader.LoadAll();

            EnsureCameraAndEventSystem();
            theme = new Theme
            {
                Serif = LoadFont("DearMe/Fonts/GowunBatang-Regular-KS"),
                Sans = LoadFont("DearMe/Fonts/GowunDodum-Regular-KS"),
                TouchMin = InputAdapter.IsTouchDevice ? 84f : 60f,
            };

            BuildUi();

            if (!db.Nodes.ContainsKey(db.StartNode))
            {
                ShowFatal(db.UiKo("content_error") + "\n" + db.UiEn("content_error"));
                return;
            }
            ShowTitle();
        }

        void OnDestroy()
        {
            if (instance == this) instance = null;
        }

        // ------------------------------------------------------------ setup

        static Font LoadFont(string path)
        {
            var f = Resources.Load<Font>(path);
            if (f != null) return f;
            Debug.LogError("[DearMe] Missing font " + path + " — Korean text will not render correctly.");
            return Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
        }

        void EnsureCameraAndEventSystem()
        {
            if (Camera.main == null)
            {
                var cam = new GameObject("Camera").AddComponent<Camera>();
                cam.tag = "MainCamera";
                cam.clearFlags = CameraClearFlags.SolidColor;
                cam.backgroundColor = Theme.Navy;
                cam.orthographic = true;
                cam.cullingMask = 0; // everything is on overlay canvases
                cam.transform.SetParent(transform, false);
            }
            if (EventSystem.current == null)
            {
                var es = new GameObject("EventSystem");
                es.transform.SetParent(transform, false);
                es.AddComponent<EventSystem>();
#if ENABLE_INPUT_SYSTEM && !ENABLE_LEGACY_INPUT_MANAGER
                es.AddComponent<UnityEngine.InputSystem.UI.InputSystemUIInputModule>();
#else
                es.AddComponent<StandaloneInputModule>();
#endif
            }
        }

        Canvas MakeCanvas(string name, int order, bool raycasts, out CanvasScaler scaler)
        {
            var go = new GameObject(name, typeof(RectTransform));
            go.transform.SetParent(transform, false);
            go.layer = 5;
            var canvas = go.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvas.sortingOrder = order;
            scaler = go.AddComponent<CanvasScaler>();
            if (raycasts) go.AddComponent<GraphicRaycaster>();
            return canvas;
        }

        void BuildUi()
        {
            var main = MakeCanvas("Canvas", 0, true, out var mainScaler);
            var tipCanvas = MakeCanvas("TooltipCanvas", 100, false, out var tipScaler);
            var responsive = gameObject.AddComponent<ResponsiveCanvas>();
            responsive.scalers = new[] { mainScaler, tipScaler };
            responsive.settings = settings;
            var root = (RectTransform)main.transform;
            canvasRoot = root;

            audioManager = gameObject.AddComponent<AudioManager>();
            audioManager.Init(settings);

            var tooltipView = gameObject.AddComponent<TooltipView>();
            tooltipView.Build((RectTransform)tipCanvas.transform, theme);
            tooltips = gameObject.AddComponent<TooltipController>();
            tooltips.Init(settings, db, tooltipView);
            responsive.Resized += tooltips.Reposition;

            background = gameObject.AddComponent<BackgroundView>();
            background.Build(root, settings);

            var safe = UIFactory.Rect("SafeArea", root);
            UIFactory.Stretch(safe);
            safe.gameObject.AddComponent<SafeAreaFitter>();

            room = gameObject.AddComponent<RoomView>();
            room.Build(background.Stage, safe, theme, gate);

            var dialogueLayer = UIFactory.Rect("DialogueLayer", safe);
            UIFactory.Stretch(dialogueLayer);
            dialogue = gameObject.AddComponent<DialogueView>();
            dialogue.Build(dialogueLayer, theme, gate, tooltips, settings, db);
            choices = gameObject.AddComponent<ChoiceListView>();
            choices.Build(dialogueLayer, theme, gate, tooltips, dialogue);

            hudMenuButton = BuildHudButton(safe);

            toast = gameObject.AddComponent<MemoryToast>();
            toast.Build(safe, theme, settings);

            var cardLayer = UIFactory.Rect("CardLayer", root);
            UIFactory.Stretch(cardLayer);
            documents = gameObject.AddComponent<DocumentView>();
            photos = gameObject.AddComponent<PhotoView>();
            drills = gameObject.AddComponent<DrillView>();
            // Build order = draw order; reference papers opened from a drill must sit above it.
            drills.Build(cardLayer, theme, tooltips, db, gate, documents, photos, id => story != null ? story.PhotoStateOf(id) : "v1");
            documents.Build(cardLayer, theme, tooltips, db, gate);
            photos.Build(cardLayer, theme, tooltips, db, gate);
            drills.PlaySfx = id => audioManager.PlaySfx(id);

            var screenLayer = UIFactory.Rect("ScreenLayer", root);
            UIFactory.Stretch(screenLayer);
            mainMenu = gameObject.AddComponent<MainMenuView>();
            mainMenu.Build(screenLayer, theme, db);
            mainMenu.OnNew = RequestNewGame;
            mainMenu.OnContinue = ContinueGame;
            mainMenu.OnSettings = () => settingsView.Show();
            endCard = gameObject.AddComponent<EndCardView>();
            endCard.Build(screenLayer, theme, db);

            var modalLayer = UIFactory.Rect("ModalLayer", root);
            UIFactory.Stretch(modalLayer);
            pause = gameObject.AddComponent<PauseMenu>();
            pause.Build(modalLayer, theme, db);
            pause.OnResume = ClosePause;
            pause.OnSettings = () => settingsView.Show();
            pause.OnTitle = () => confirm.Ask("confirm_quit", ReturnToTitle);
            settingsView = gameObject.AddComponent<SettingsView>();
            settingsView.Build(modalLayer, theme, db, settings);
            settingsView.OnChanged = () =>
            {
                settings.Save(storage);
                settings.NotifyChanged();
            };
            settingsView.OnDeleteSave = () => confirm.Ask("confirm_reset", DeleteSave);
            confirm = gameObject.AddComponent<ConfirmDialog>();
            confirm.Build(modalLayer, theme, db);

            fader = gameObject.AddComponent<ScreenFader>();
            fader.Build(root, theme, settings);

            presenter = new StoryPresenter(db, settings, gate, tooltips, background, room, dialogue, choices,
                documents, photos, drills, fader, endCard, audioManager);
        }

        GameObject BuildHudButton(RectTransform safe)
        {
            var b = ScreenParts.LightButton(safe, theme, "메뉴", null, OpenPause);
            var rt = (RectTransform)b.transform;
            rt.anchorMin = rt.anchorMax = new Vector2(1f, 1f);
            rt.pivot = new Vector2(1f, 1f);
            rt.anchoredPosition = new Vector2(-Theme.Gutter, -Theme.Gutter);
            rt.sizeDelta = new Vector2(theme.TouchMin * 1.6f, theme.TouchMin);
            b.gameObject.SetActive(false);
            return b.gameObject;
        }

        void ShowFatal(string message)
        {
            var t = UIFactory.Text("Fatal", canvasRoot, message, theme.Sans, Theme.BodySize, Theme.Paper, TextAnchor.MiddleCenter);
            UIFactory.Stretch(t.rectTransform);
            mainMenu.Hide();
        }

        // ------------------------------------------------------------ flow

        void ShowTitle()
        {
            inGame = false;
            hudMenuButton.SetActive(false);
            presenter.HideAll();
            pause.Hide();
            gate.SetState(InputState.Locked);
            if (db.Locations.TryGetValue("room_present", out var loc)) background.Show(loc);
            audioManager.SetAmbience(new[] { "rain", "clock" });
            audioManager.SetMusic(true);
            mainMenu.Show(saves.HasSave);
        }

        void RequestNewGame()
        {
            if (saves.HasSave) confirm.Ask("confirm_new", StartNewGame);
            else StartNewGame();
        }

        void StartNewGame()
        {
            saves.DeleteAll();
            BeginRun(new StoryState(), db.StartNode);
        }

        void ContinueGame()
        {
            var result = saves.Load();
            switch (result.status)
            {
                case LoadStatus.NoSave:
                    StartNewGame();
                    return;
                case LoadStatus.Corrupt:
                    Debug.LogWarning("[DearMe] " + result.message);
                    saves.DeleteAll();
                    StartNewGame();
                    toast.Show(db.UiKo("save_corrupt"));
                    return;
                case LoadStatus.RecoveredFromBackup:
                    Debug.LogWarning("[DearMe] " + result.message);
                    toast.Show(db.UiKo("save_recovered"));
                    break;
            }
            if (!db.Nodes.ContainsKey(result.data.nodeId))
            {
                // A save from an older content version pointing at a removed node.
                Debug.LogWarning("[DearMe] Saved node '" + result.data.nodeId + "' no longer exists; starting over.");
                StartNewGame();
                return;
            }
            BeginRun(result.data.state, result.data.nodeId);
        }

        void BeginRun(StoryState state, string nodeId)
        {
            runner?.Stop();
            mainMenu.Hide();
            audioManager.SetMusic(false);
            inGame = true;
            hudMenuButton.SetActive(true);

            story = new StoryStateManager(db, state);
            story.Warning += w => Debug.LogWarning("[DearMe story] " + w);
            story.SfxRequested += audioManager.PlaySfx;
            story.Notified += kind =>
            {
                if (kind != "memory") return;
                toast.Show(db.UiKo("toast_memory") + "  ·  " + db.UiEn("toast_memory"));
                audioManager.PlaySfx("chime");
            };
            story.PhaseChanged += p => Debug.Log("[DearMe] Story phase → " + p);
            story.Patterns.MasteryChanged += (id, m) => Debug.Log("[DearMe] Pattern " + id + " → " + m);

            presenter.Story = story;
            presenter.RestoreScene(state.currentLocation, state.ambience);

            runner = new StoryRunner(db, story, presenter);
            runner.Checkpoint += id => saves.Save(id, story.State);
            runner.Error += e =>
            {
                Debug.LogError("[DearMe story] " + e);
                toast.Show(db.UiKo("content_error"));
            };
            runner.Finished += () => { if (inGame) ShowTitle(); };
            gate.SetState(InputState.Idle);
            runner.Start(nodeId);
        }

        void ReturnToTitle()
        {
            runner?.Stop();
            fader.Cut(false);
            ShowTitle();
        }

        void DeleteSave()
        {
            saves.DeleteAll();
            settingsView.Hide();
            if (inGame) ReturnToTitle();
            else mainMenu.Show(false);
        }

        void OpenPause()
        {
            if (!inGame || pause.IsOpen || fader.IsRunning || gate.State == InputState.Transitioning) return;
            tooltips.Hide();
            stateBeforePause = gate.State;
            gate.SetState(InputState.Locked);
            pause.Show();
        }

        void ClosePause()
        {
            if (!pause.IsOpen) return;
            pause.Hide();
            gate.SetState(stateBeforePause);
            gate.SuspendUntil(Time.unscaledTimeAsDouble + 0.2);
        }

        // ------------------------------------------------------------ back button / Escape

        void Update()
        {
            if (InputAdapter.CancelPressed) HandleBack();
        }

        /// <summary>
        /// Escape on desktop, Back on Android. Closes the innermost thing first and never
        /// exits or skips the story by accident.
        /// </summary>
        void HandleBack()
        {
            if (tooltips.IsOpen) { tooltips.Hide(); return; }
            if (confirm.IsOpen) { confirm.Cancel(); return; }
            if (settingsView.IsOpen) { settingsView.Hide(); return; }
            if (pause.IsOpen) { ClosePause(); return; }
            if (drills.IsOpen && documents.IsOpen) { documents.Close(); return; }
            if (drills.IsOpen && photos.IsOpen) { photos.Close(); return; }
            if (mainMenu.IsOpen)
            {
#if UNITY_ANDROID && !UNITY_EDITOR
                confirm.Ask("confirm_quit", Application.Quit);
#endif
                return;
            }
            if (endCard.IsOpen || fader.IsRunning) return;
            OpenPause();
        }

        // ------------------------------------------------------------ focus / tab visibility

        void OnApplicationFocus(bool focused) => FocusChanged(focused);
        void OnApplicationPause(bool paused) => FocusChanged(!paused);

        void FocusChanged(bool active)
        {
            if (gate == null) return;
            if (!active)
            {
                tooltips?.Hide();
                gate.Suspend();
                PlayerPrefs.Save();
            }
            else gate.Resume(Time.unscaledTimeAsDouble);
        }
    }
}
