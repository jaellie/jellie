using DrivingSim.Cameras;
using DrivingSim.Controls;
using DrivingSim.Core;
using DrivingSim.Localization;
using DrivingSim.Startup;
using UnityEngine;
using UnityEngine.UI;

namespace DrivingSim.UI
{
    /// <summary>
    /// Cabin Light pause side sheet (the frozen road stays visible), the "go to main menu?" confirmation,
    /// and the in-game Settings screen: language and notice, Driving HUD (mode, steering sensitivity, halo,
    /// mini-map), camera, foot pedals. Preferences persist through <see cref="DriverPreferences"/>.
    /// </summary>
    public class CabinPauseMenu : MonoBehaviour
    {
        [SerializeField] DrivingHUDController hud;
        [SerializeField] StartupFlow startup;
        [SerializeField] PedalCalibrationWizard calibration;
        [SerializeField] CameraController cameraController;
        [SerializeField] PedalInputManager footPedals;

        [SerializeField] GameObject sheetRoot, confirmRoot, settingsRoot;
        [SerializeField] HoldButton resume, restart, openSettings, pedals, mainMenu, confirmCancel, confirmGo;
        [SerializeField] HoldButton settingsBack, langKo, langEn, readNotice, hudMinimal, hudPractice, haloToggle, mapToggle;
        [SerializeField] HoldButton viewCockpit, viewChase, fovDown, fovUp, pedalSetup;
        [SerializeField] HoldButton[] tabs = new HoldButton[4], sensitivity = new HoldButton[3];
        [SerializeField] Image[] tabLit = new Image[4], sensitivityLit = new Image[3];
        [SerializeField] GameObject[] pages = new GameObject[4];
        [SerializeField] Image langKoLit, langEnLit, hudMinimalLit, hudPracticeLit, viewCockpitLit, viewChaseLit;
        [SerializeField] Image haloTrack, mapTrack;
        [SerializeField] RectTransform haloKnob, mapKnob;
        [SerializeField] Text fovText, pedalStatus, whereText;

        static readonly Vector2 TL = new Vector2(0f, 1f), TR = new Vector2(1f, 1f), C = new Vector2(0.5f, 0.5f), BL = Vector2.zero, BR = new Vector2(1f, 0f);
        static readonly string[] TabKeys = { "settings.tab.language", "settings.tab.hud", "settings.tab.camera", "settings.tab.pedals" };
        bool subscribed;
        int tab = 1;

        public bool SettingsOpen => settingsRoot != null && settingsRoot.activeSelf;

        public static CabinPauseMenu Create(DrivingHUDController hud, StartupFlow startup, PedalCalibrationWizard calibration,
            CameraController cameraController, PedalInputManager footPedals)
        {
            Transform safe = DrivingHUDController.CreateCanvas("PauseCanvas", 40);
            var menu = safe.root.gameObject.AddComponent<CabinPauseMenu>();
            menu.hud = hud;
            menu.startup = startup;
            menu.calibration = calibration;
            menu.cameraController = cameraController;
            menu.footPedals = footPedals;
            menu.BuildSheet(safe);
            menu.BuildConfirm(safe);
            menu.BuildSettings(DrivingHUDController.CreateCanvas("SettingsCanvas", 45));
            menu.sheetRoot.SetActive(false);
            menu.confirmRoot.SetActive(false);
            menu.settingsRoot.SetActive(false);
            if (Application.isPlaying && menu.isActiveAndEnabled) menu.Subscribe();
            return menu;
        }

        // ================================================================ build

        void BuildSheet(Transform safe)
        {
            RectTransform root = CabinStyle.Rect("Pause", safe, C, C, Vector2.zero, Vector2.zero);
            UIBuild.Stretch(root);
            sheetRoot = root.gameObject;
            RectTransform dim = CabinStyle.Rect("Dim", root, C, C, Vector2.zero, Vector2.zero);
            UIBuild.Stretch(dim);
            dim.offsetMin = new Vector2(-400f, -400f);
            dim.offsetMax = new Vector2(400f, 400f);
            CabinStyle.Fill(dim, null, new Color(0.016f, 0.027f, 0.04f, 0.55f), raycast: true); // blocks steering behind the menu

            RectTransform sheet = CabinStyle.Rect("Sheet", root, new Vector2(1f, 0.5f), new Vector2(1f, 0.5f), new Vector2(-64f, 0f), new Vector2(760f, 1000f));
            CabinStyle.Fill(sheet, CabinStyle.GlassStrong, Color.white, raycast: true);
            whereText = CabinStyle.Label("Where", sheet, "", 28, CabinStyle.Text3, TextAnchor.UpperLeft, FontStyle.Bold);
            Place(whereText, 56f, -52f, 650f, 40f);
            Text title = CabinStyle.Localized("Title", sheet, "pause.title", CabinStyle.Title, CabinStyle.TextColor, TextAnchor.UpperLeft, FontStyle.Bold);
            Place(title, 56f, -96f, 650f, 80f);

            resume = SheetButton(sheet, "Resume", "pause.resume", -210f, ButtonStyle.Primary);
            restart = SheetButton(sheet, "Restart", "pause.restart", -358f, ButtonStyle.Glass);
            openSettings = SheetButton(sheet, "Settings", "pause.settings", -506f, ButtonStyle.Glass);
            pedals = SheetButton(sheet, "Pedals", "pause.pedals", -654f, ButtonStyle.Glass);
            mainMenu = CabinStyle.Button("MainMenu", sheet, BL, BL, new Vector2(56f, 48f), new Vector2(648f, CabinStyle.Touch), "pause.mainMenu", out Text menuLabel, ButtonStyle.Ghost);
            menuLabel.color = CabinStyle.Text2;
            menuLabel.alignment = TextAnchor.MiddleLeft;
        }

        HoldButton SheetButton(RectTransform sheet, string name, string key, float y, ButtonStyle style)
        {
            HoldButton b = CabinStyle.Button(name, sheet, TL, TL, new Vector2(56f, y), new Vector2(648f, CabinStyle.Touch), key, out Text label, style);
            label.alignment = TextAnchor.MiddleLeft;
            ((RectTransform)label.transform).offsetMin = new Vector2(40f, 6f);
            return b;
        }

        void BuildConfirm(Transform safe)
        {
            RectTransform root = CabinStyle.Rect("Confirm", safe, C, C, Vector2.zero, Vector2.zero);
            UIBuild.Stretch(root);
            confirmRoot = root.gameObject;
            RectTransform dim = CabinStyle.Rect("Dim", root, C, C, Vector2.zero, Vector2.zero);
            UIBuild.Stretch(dim);
            dim.offsetMin = new Vector2(-400f, -400f);
            dim.offsetMax = new Vector2(400f, 400f);
            CabinStyle.Fill(dim, null, new Color(0.012f, 0.02f, 0.03f, 0.72f), raycast: true);
            RectTransform card = CabinStyle.Rect("Card", root, C, C, Vector2.zero, new Vector2(1080f, 420f));
            CabinStyle.Fill(card, CabinStyle.GlassStrong, Color.white, raycast: true);
            Place(CabinStyle.Localized("Title", card, "pause.confirmMenu.title", CabinStyle.Title, CabinStyle.TextColor, TextAnchor.UpperLeft, FontStyle.Bold), 64f, -64f, 952f, 80f);
            Place(CabinStyle.Localized("Body", card, "pause.confirmMenu.body", CabinStyle.Body, CabinStyle.Text2, TextAnchor.UpperLeft), 64f, -160f, 952f, 60f);
            confirmCancel = CabinStyle.Button("Cancel", card, BR, BR, new Vector2(-448f, 56f), new Vector2(300f, CabinStyle.Touch), "common.cancel", out _, ButtonStyle.Glass);
            confirmGo = CabinStyle.Button("Go", card, BR, BR, new Vector2(-64f, 56f), new Vector2(360f, CabinStyle.Touch), "pause.mainMenu", out _, ButtonStyle.Primary);
        }

        void BuildSettings(Transform safe)
        {
            RectTransform root = CabinStyle.Rect("Settings", safe, C, C, Vector2.zero, Vector2.zero);
            UIBuild.Stretch(root);
            settingsRoot = root.gameObject;
            RectTransform bg = CabinStyle.Rect("Background", root, C, C, Vector2.zero, Vector2.zero);
            UIBuild.Stretch(bg);
            bg.offsetMin = new Vector2(-400f, -400f);
            bg.offsetMax = new Vector2(400f, 400f);
            CabinStyle.Fill(bg, null, CabinStyle.Night, raycast: true);

            RectTransform frame = CabinStyle.Rect("Frame", root, C, C, Vector2.zero, Vector2.zero);
            UIBuild.Stretch(frame);
            frame.offsetMin = new Vector2(72f, 48f);
            frame.offsetMax = new Vector2(-72f, -48f);

            settingsBack = CabinStyle.Button("Back", frame, TL, TL, Vector2.zero, Vector2.one * CabinStyle.Touch, null, out _);
            CabinStyle.Label("Arrow", settingsBack.transform, "‹", 64, CabinStyle.TextColor);
            Place(CabinStyle.Localized("Title", frame, "settings.title", CabinStyle.Title, CabinStyle.TextColor, TextAnchor.MiddleLeft, FontStyle.Bold), 156f, -22f, 440f, 80f);
            for (int i = 0; i < 4; i++)
            {
                tabs[i] = CabinStyle.Button("Tab_" + i, frame, TL, TL, new Vector2(0f, -172f - i * 140f), new Vector2(600f, CabinStyle.Touch), TabKeys[i], out Text label, ButtonStyle.Ghost);
                label.alignment = TextAnchor.MiddleLeft;
                ((RectTransform)label.transform).offsetMin = new Vector2(32f, 6f);
                tabLit[i] = CabinStyle.AddLitEdge((RectTransform)tabs[i].transform, CabinStyle.Ice);
            }

            RectTransform content = CabinStyle.Rect("Content", frame, C, C, Vector2.zero, Vector2.zero);
            UIBuild.Stretch(content);
            content.offsetMin = new Vector2(672f, 0f);
            content.offsetMax = new Vector2(0f, -150f);
            for (int i = 0; i < 4; i++)
            {
                RectTransform page = CabinStyle.Rect("Page_" + i, content, C, C, Vector2.zero, Vector2.zero);
                UIBuild.Stretch(page);
                pages[i] = page.gameObject;
            }

            // Page 0: language and notice
            RectTransform p0 = (RectTransform)pages[0].transform;
            RectTransform lang = Row(p0, 0f, "settings.language", null);
            langKo = Seg(lang, 0, 2, 620f, "한국어", out langKoLit);
            langEn = Seg(lang, 1, 2, 620f, "English", out langEnLit);
            RectTransform notice = Row(p0, -180f, "settings.notice", "settings.notice.hint");
            readNotice = CabinStyle.Button("Read", notice, new Vector2(1f, 0.5f), new Vector2(1f, 0.5f), Vector2.zero, new Vector2(380f, CabinStyle.Touch), "settings.notice.read", out _);

            // Page 1: driving HUD
            RectTransform p1 = (RectTransform)pages[1].transform;
            hudMinimal = ModeCard(p1, 0, "settings.hud.minimal", "settings.hud.minimal.d", out hudMinimalLit);
            hudPractice = ModeCard(p1, 1, "settings.hud.practice", "settings.hud.practice.d", out hudPracticeLit);
            RectTransform sens = Row(p1, -300f, "settings.sensitivity", "settings.sensitivity.d");
            string[] sensKeys = { "settings.sensitivity.low", "settings.sensitivity.normal", "settings.sensitivity.realistic" };
            for (int i = 0; i < 3; i++) sensitivity[i] = SegKey(sens, i, 3, 780f, sensKeys[i], out sensitivityLit[i]);
            RectTransform haloRow = Row(p1, -470f, "settings.halo", "settings.halo.d");
            haloToggle = Toggle(haloRow, out haloTrack, out haloKnob);
            RectTransform mapRow = Row(p1, -640f, "settings.minimap", null);
            mapToggle = Toggle(mapRow, out mapTrack, out mapKnob);

            // Page 2: camera
            RectTransform p2 = (RectTransform)pages[2].transform;
            RectTransform view = Row(p2, 0f, "settings.camera.default", null);
            viewCockpit = SegKey(view, 0, 2, 620f, "camera.toFirstPerson", out viewCockpitLit);
            viewChase = SegKey(view, 1, 2, 620f, "camera.toThirdPerson", out viewChaseLit);
            RectTransform fov = Row(p2, -180f, "settings.camera.fov", null);
            fovUp = CabinStyle.Button("FovUp", fov, new Vector2(1f, 0.5f), new Vector2(1f, 0.5f), Vector2.zero, Vector2.one * CabinStyle.Touch, null, out _);
            CabinStyle.Label("Plus", fovUp.transform, "+", 56, CabinStyle.TextColor);
            RectTransform val = CabinStyle.Rect("Value", fov, new Vector2(1f, 0.5f), new Vector2(1f, 0.5f), new Vector2(-CabinStyle.Touch - 16f, 0f), new Vector2(200f, CabinStyle.Touch));
            fovText = CabinStyle.Label("Text", val, "", 48, CabinStyle.TextColor);
            fovDown = CabinStyle.Button("FovDown", fov, new Vector2(1f, 0.5f), new Vector2(1f, 0.5f), new Vector2(-CabinStyle.Touch - 232f, 0f), Vector2.one * CabinStyle.Touch, null, out _);
            CabinStyle.Label("Minus", fovDown.transform, "−", 56, CabinStyle.TextColor);

            // Page 3: foot pedals
            RectTransform p3 = (RectTransform)pages[3].transform;
            RectTransform status = Row(p3, 0f, "settings.pedals.status", null);
            pedalStatus = CabinStyle.Label("Status", status, "", CabinStyle.Caption, CabinStyle.Text2, TextAnchor.MiddleRight);
            var sr = (RectTransform)pedalStatus.transform;
            sr.anchorMin = new Vector2(0.4f, 0f);
            sr.offsetMin = Vector2.zero;
            sr.offsetMax = Vector2.zero;
            pedalStatus.horizontalOverflow = HorizontalWrapMode.Wrap;
            pedalSetup = CabinStyle.Button("Setup", p3, TL, TL, new Vector2(0f, -200f), new Vector2(480f, CabinStyle.Touch), "settings.pedals.setup", out _, ButtonStyle.Primary);
        }

        static void Place(Graphic g, float x, float y, float w, float h)
        {
            var r = (RectTransform)g.transform;
            r.anchorMin = r.anchorMax = TL;
            r.pivot = TL;
            r.anchoredPosition = new Vector2(x, y);
            r.sizeDelta = new Vector2(w, h);
        }

        /// <summary>Full-width settings row: title (+ description) on the left, control area on the right, divider below.</summary>
        static RectTransform Row(RectTransform page, float y, string titleKey, string descKey)
        {
            RectTransform row = CabinStyle.Rect("Row_" + titleKey, page, TL, TL, new Vector2(0f, y), new Vector2(0f, 160f));
            row.anchorMax = TR;
            row.sizeDelta = new Vector2(0f, 160f);
            Text title = CabinStyle.Localized("Title", row, titleKey, CabinStyle.Body, CabinStyle.TextColor, TextAnchor.UpperLeft, FontStyle.Bold);
            var tr = (RectTransform)title.transform;
            tr.anchorMin = new Vector2(0f, 0f); tr.anchorMax = new Vector2(0.5f, 1f);
            tr.offsetMin = new Vector2(0f, descKey != null ? 70f : 50f); tr.offsetMax = new Vector2(0f, -40f);
            if (descKey != null)
            {
                Text desc = CabinStyle.Localized("Desc", row, descKey, 28, CabinStyle.Text2, TextAnchor.UpperLeft);
                var dr = (RectTransform)desc.transform;
                dr.anchorMin = new Vector2(0f, 0f); dr.anchorMax = new Vector2(0.48f, 1f);
                dr.offsetMin = new Vector2(0f, 8f); dr.offsetMax = new Vector2(0f, -96f);
                desc.horizontalOverflow = HorizontalWrapMode.Wrap;
            }
            RectTransform divider = CabinStyle.Rect("Divider", row, BL, BL, Vector2.zero, new Vector2(0f, 2f));
            divider.anchorMax = BR;
            divider.sizeDelta = new Vector2(0f, 2f);
            CabinStyle.Fill(divider, null, CabinStyle.Line);
            return row;
        }

        static HoldButton Seg(RectTransform row, int index, int count, float width, string literal, out Image lit)
        {
            HoldButton b = SegKey(row, index, count, width, null, out lit);
            CabinStyle.Label("Label", b.transform, literal, CabinStyle.Body, CabinStyle.TextColor, TextAnchor.MiddleCenter, FontStyle.Bold);
            return b;
        }

        static HoldButton SegKey(RectTransform row, int index, int count, float width, string key, out Image lit)
        {
            float w = (width - 16f - 8f * (count - 1)) / count;
            float x = -width + 8f + index * (w + 8f);
            if (index == 0)
            {
                RectTransform back = CabinStyle.Rect("SegBack", row, new Vector2(1f, 0.5f), new Vector2(1f, 0.5f), Vector2.zero, new Vector2(width, 124f));
                CabinStyle.Fill(back, CabinStyle.Solid, new Color(0f, 0f, 0f, 0.35f));
            }
            HoldButton b = CabinStyle.Button("Seg_" + index, row, new Vector2(1f, 0.5f), new Vector2(0f, 0.5f), new Vector2(x, 0f), new Vector2(w, 108f), key, out _, ButtonStyle.Ghost, 34);
            lit = CabinStyle.AddLitEdge((RectTransform)b.transform, CabinStyle.Ice);
            return b;
        }

        static HoldButton ModeCard(RectTransform page, int index, string titleKey, string descKey, out Image lit)
        {
            RectTransform card = CabinStyle.Rect("Mode_" + index, page, new Vector2(index * 0.5f, 1f), TL, new Vector2(index == 0 ? 0f : 14f, 0f), new Vector2(0f, 270f));
            card.anchorMax = new Vector2(index * 0.5f + 0.5f, 1f);
            card.sizeDelta = new Vector2(-14f, 270f);
            CabinStyle.Fill(card, CabinStyle.Glass, Color.white, raycast: true);
            HoldButton b = card.gameObject.AddComponent<HoldButton>();
            b.normalColor = new Color(0.86f, 0.88f, 0.9f, 1f);
            b.pressedColor = Color.white;
            card.GetComponent<Image>().color = b.normalColor;
            Text title = CabinStyle.Localized("Title", card, titleKey, CabinStyle.Sub, CabinStyle.TextColor, TextAnchor.UpperLeft, FontStyle.Bold);
            var tr = (RectTransform)title.transform; tr.offsetMin = new Vector2(36f, 0f); tr.offsetMax = new Vector2(-36f, -36f);
            Text desc = CabinStyle.Localized("Desc", card, descKey, 28, CabinStyle.Text2, TextAnchor.UpperLeft);
            var dr = (RectTransform)desc.transform; dr.offsetMin = new Vector2(36f, 24f); dr.offsetMax = new Vector2(-36f, -110f);
            desc.horizontalOverflow = HorizontalWrapMode.Wrap;
            lit = CabinStyle.AddLitEdge(card, CabinStyle.Ice);
            return b;
        }

        static HoldButton Toggle(RectTransform row, out Image track, out RectTransform knob)
        {
            HoldButton b = CabinStyle.Button("Toggle", row, new Vector2(1f, 0.5f), new Vector2(1f, 0.5f), Vector2.zero, new Vector2(160f, CabinStyle.Touch), null, out _, ButtonStyle.Ghost);
            RectTransform t = CabinStyle.Rect("Track", b.transform, C, C, Vector2.zero, new Vector2(132f, 72f));
            track = CabinStyle.Fill(t, CabinStyle.CircleSolid, CabinStyle.Ink3);
            knob = CabinStyle.Rect("Knob", t, new Vector2(0f, 0.5f), C, new Vector2(36f, 0f), new Vector2(54f, 54f));
            CabinStyle.Fill(knob, CabinStyle.CircleSolid, CabinStyle.Text2);
            return b;
        }

        // ================================================================ behavior

        void OnEnable() => Subscribe();
        void OnDisable() => Unsubscribe();

        void Subscribe()
        {
            if (subscribed || resume == null) return;
            subscribed = true;
            resume.Pressed += OnResume;
            restart.Pressed += OnRestart;
            openSettings.Pressed += OnOpenSettings;
            pedals.Pressed += OnPedals;
            mainMenu.Pressed += OnMainMenu;
            confirmCancel.Pressed += OnConfirmCancel;
            confirmGo.Pressed += OnConfirmGo;
            settingsBack.Pressed += OnSettingsBack;
            for (int i = 0; i < tabs.Length; i++) { int t = i; tabs[i].Pressed += () => ShowTab(t); }
            langKo.Pressed += OnKorean;
            langEn.Pressed += OnEnglish;
            readNotice.Pressed += OnReadNotice;
            hudMinimal.Pressed += OnHudMinimal;
            hudPractice.Pressed += OnHudPractice;
            for (int i = 0; i < sensitivity.Length; i++) { var s = (SteeringSensitivity)i; sensitivity[i].Pressed += () => DriverPreferences.Sensitivity = s; }
            haloToggle.Pressed += OnHalo;
            mapToggle.Pressed += OnMap;
            viewCockpit.Pressed += OnDefaultCockpit;
            viewChase.Pressed += OnDefaultChase;
            fovDown.Pressed += OnFovDown;
            fovUp.Pressed += OnFovUp;
            pedalSetup.Pressed += OnPedals;
            DriverPreferences.Changed += Refresh;
            LocalizationService.LanguageChanged += OnLanguageChanged;
        }

        void Unsubscribe()
        {
            if (!subscribed) return;
            subscribed = false;
            resume.Pressed -= OnResume;
            restart.Pressed -= OnRestart;
            openSettings.Pressed -= OnOpenSettings;
            pedals.Pressed -= OnPedals;
            mainMenu.Pressed -= OnMainMenu;
            confirmCancel.Pressed -= OnConfirmCancel;
            confirmGo.Pressed -= OnConfirmGo;
            settingsBack.Pressed -= OnSettingsBack;
            foreach (HoldButton t in tabs) if (t != null) t.ClearPressedHandlers();
            foreach (HoldButton s in sensitivity) if (s != null) s.ClearPressedHandlers();
            langKo.Pressed -= OnKorean;
            langEn.Pressed -= OnEnglish;
            readNotice.Pressed -= OnReadNotice;
            hudMinimal.Pressed -= OnHudMinimal;
            hudPractice.Pressed -= OnHudPractice;
            haloToggle.Pressed -= OnHalo;
            mapToggle.Pressed -= OnMap;
            viewCockpit.Pressed -= OnDefaultCockpit;
            viewChase.Pressed -= OnDefaultChase;
            fovDown.Pressed -= OnFovDown;
            fovUp.Pressed -= OnFovUp;
            pedalSetup.Pressed -= OnPedals;
            DriverPreferences.Changed -= Refresh;
            LocalizationService.LanguageChanged -= OnLanguageChanged;
        }

        /// <summary>Called by the HUD when pausing or resuming.</summary>
        public void SetVisible(bool visible)
        {
            sheetRoot.SetActive(visible);
            if (!visible) { confirmRoot.SetActive(false); settingsRoot.SetActive(false); }
            if (visible) Refresh();
        }

        void OnResume() => hud.SetPaused(false);
        void OnRestart() => hud.RestartDrive();
        void OnMainMenu() => confirmRoot.SetActive(true);
        void OnConfirmCancel() => confirmRoot.SetActive(false);

        void OnConfirmGo()
        {
            confirmRoot.SetActive(false);
            // GameFlow restores time scale and input gates before loading the menu scene.
            if (!DrivingSim.Flow.GameFlow.LoadMainMenu()) hud.ShowToast(Loc.T("toast.menuUnavailable"), ToastKind.Warning);
        }

        void OnPedals()
        {
            hud.SetPaused(false);
            if (calibration != null) calibration.Open();
        }

        void OnOpenSettings()
        {
            settingsRoot.SetActive(true);
            ShowTab(tab);
        }

        void OnSettingsBack() => settingsRoot.SetActive(false);

        void ShowTab(int index)
        {
            tab = Mathf.Clamp(index, 0, pages.Length - 1);
            for (int i = 0; i < pages.Length; i++)
            {
                pages[i].SetActive(i == tab);
                CabinStyle.SetLit(tabLit[i], i == tab);
            }
            Refresh();
        }

        void OnKorean() => LocalizationService.SetLanguage(Language.Korean);
        void OnEnglish() => LocalizationService.SetLanguage(Language.EnglishUS);
        void OnReadNotice() { if (startup != null) startup.OpenDisclaimer(); }
        void OnHudMinimal() => DriverPreferences.Hud = HudMode.Minimal;
        void OnHudPractice() => DriverPreferences.Hud = HudMode.Practice;
        void OnHalo() => DriverPreferences.SteeringHalo = !DriverPreferences.SteeringHalo;
        void OnMap() => DriverPreferences.Minimap = !DriverPreferences.Minimap;
        void OnDefaultCockpit() { DriverPreferences.ChaseViewByDefault = false; if (cameraController != null) cameraController.SetMode(CameraViewMode.Cockpit); Refresh(); }
        void OnDefaultChase() { DriverPreferences.ChaseViewByDefault = true; if (cameraController != null) cameraController.SetMode(CameraViewMode.Chase); Refresh(); }
        void OnFovDown() { if (cameraController != null) cameraController.AdjustCockpitFov(-cameraController.fovStep); Refresh(); }
        void OnFovUp() { if (cameraController != null) cameraController.AdjustCockpitFov(cameraController.fovStep); Refresh(); }
        void OnLanguageChanged(Language _) => Refresh();

        void Refresh()
        {
            if (whereText != null) whereText.text = Loc.T("pause.where", Loc.T(EnvironmentCatalog.Find(EnvironmentCatalog.TestTownId)?.TitleKey ?? "map.testTown.title"));
            bool ko = LocalizationService.Current == Language.Korean;
            CabinStyle.SetLit(langKoLit, ko);
            CabinStyle.SetLit(langEnLit, !ko);
            bool practice = DriverPreferences.Hud == HudMode.Practice;
            CabinStyle.SetLit(hudMinimalLit, !practice);
            CabinStyle.SetLit(hudPracticeLit, practice);
            for (int i = 0; i < sensitivityLit.Length; i++) CabinStyle.SetLit(sensitivityLit[i], (int)DriverPreferences.Sensitivity == i);
            SetToggle(haloTrack, haloKnob, DriverPreferences.SteeringHalo);
            SetToggle(mapTrack, mapKnob, DriverPreferences.Minimap);
            bool chase = DriverPreferences.ChaseViewByDefault;
            CabinStyle.SetLit(viewCockpitLit, !chase);
            CabinStyle.SetLit(viewChaseLit, chase);
            if (fovText != null && cameraController != null) fovText.text = Mathf.RoundToInt(cameraController.cockpitFov) + "°";
            if (pedalStatus != null) pedalStatus.text = PedalStatus();
        }

        static void SetToggle(Image track, RectTransform knob, bool on)
        {
            if (track == null || knob == null) return;
            track.color = on ? new Color(CabinStyle.Ice.r, CabinStyle.Ice.g, CabinStyle.Ice.b, 0.3f) : CabinStyle.Ink3;
            knob.anchoredPosition = new Vector2(on ? 96f : 36f, 0f);
            knob.GetComponent<Image>().color = on ? CabinStyle.Ice : CabinStyle.Text2;
        }

        string PedalStatus()
        {
            if (footPedals == null) return Loc.T("hud.source.keyboardTouch");
            if (footPedals.IsActive) return Loc.T("hud.source.footPedals");
            if (footPedals.PedalsEnabled && footPedals.CalibrationStatus == PedalCalibrationStatus.Unvalidated) return Loc.T("hud.source.unvalidated");
            return Loc.T("hud.source.keyboardTouch");
        }
    }
}
