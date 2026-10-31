using DrivingSim.Cameras;
using DrivingSim.Controls;
using DrivingSim.Core;
using DrivingSim.Vehicle;
using UnityEngine;
using UnityEngine.UI;

namespace DrivingSim.UI
{
    /// <summary>
    /// Player-facing driving HUD (presentation only; it reads gameplay components and calls their
    /// public methods). Layout, 1920×1080 reference, inside the safe area:
    /// top-left pause + speed/gear · top-center turn indicators + navigation · top-right camera
    /// buttons + mini-map · right edge P/R/N/D · bottom-right touch pedals · bottom-left lights +
    /// pedal status · bottom-center look buttons + steering indicator. Drags on non-button areas still steer.
    /// </summary>
    public class DrivingHUDController : MonoBehaviour
    {
        [SerializeField] HudTheme theme;
        [SerializeField] VehicleController vehicle;
        [SerializeField] VehicleAccessories accessories;
        [SerializeField] VehicleInputRouter router;
        [SerializeField] PedalInputManager footPedals;
        [SerializeField] TouchSteeringController touchSteering;
        [SerializeField] PedalCalibrationWizard calibration;
        [SerializeField] MinimapCamera minimap;

        [Header("Navigation (placeholder until the road network exists)")]
        public string destinationName = "주차 구역";
        public Vector3 destination = new Vector3(-14.5f, 0f, 17.5f);
        [Min(1f)] public float arrivalRadiusM = 4f;

        [Header("Touch pedals")]
        public bool showTouchPedals = true;

        [Header("Steering ring")]
        [Tooltip("Show the compact wheel glyph inside the steering ring (the ring outline always shows in circular mode).")]
        public bool showSteeringWheelGlyph = true;

        // Built references
        [SerializeField] Text speedText;
        [SerializeField] Text gearText;
        [SerializeField] Image turnLeftIcon;
        [SerializeField] Image turnRightIcon;
        [SerializeField] HoldButton turnLeftButton;
        [SerializeField] HoldButton turnRightButton;
        [SerializeField] Text navText;
        [SerializeField] RectTransform navArrow;
        [SerializeField] HoldButton parkingBrakeButton;
        [SerializeField] Text parkingBrakeLabel;
        [SerializeField] HoldButton headlightButton;
        [SerializeField] HoldButton hazardButton;
        [SerializeField] HoldButton wiperButton;
        [SerializeField] Text wiperLabel;
        [SerializeField] Image brakeBar;
        [SerializeField] Image acceleratorBar;
        [SerializeField] Text pedalSourceText;
        [SerializeField] Image brakeLamp;
        [SerializeField] Image acceleratorLamp;
        [SerializeField] RectTransform steeringRing;
        [SerializeField] Image steeringRingImage;
        [SerializeField] RectTransform steeringDeadZone;
        [SerializeField] RectTransform steeringGlyph;
        [SerializeField] RectTransform steeringMarker;
        [SerializeField] Text steeringText;
        [SerializeField] RectTransform carMarker;
        [SerializeField] RawImage mapImage;
        [SerializeField] Text toastText;
        [SerializeField] GameObject toastRoot;
        [SerializeField] GameObject touchPedalRoot;
        [SerializeField] HoldButton pauseButton;
        [SerializeField] GameObject pauseMenu;
        [SerializeField] HoldButton resumeButton;
        [SerializeField] HoldButton restartButton;
        [SerializeField] HoldButton calibrateButton;
        [SerializeField] HoldButton menuButton;

        const float SteeringTrackHalfWidth = 190f;
        float toastUntil;
        int shownSpeed = -1;
        TransmissionGear shownGear = (TransmissionGear)(-1);
        bool paused;
        bool subscribed;

        public bool IsPaused => paused;

        public static DrivingHUDController Create(HudTheme theme, VehicleController vehicle, VehicleAccessories accessories,
            VehicleInputRouter router, PedalInputManager footPedals, TouchSteeringController touchSteering,
            MobilePedalController mobilePedals, PedalCalibrationWizard calibration, MinimapCamera minimap)
        {
            theme = theme != null ? theme : HudTheme.Default;
            Transform safe = CreateCanvas("DrivingHUDCanvas", 5);
            var hud = safe.root.gameObject.AddComponent<DrivingHUDController>();
            hud.theme = theme;
            hud.vehicle = vehicle;
            hud.accessories = accessories;
            hud.router = router;
            hud.footPedals = footPedals;
            hud.touchSteering = touchSteering;
            hud.calibration = calibration;
            hud.minimap = minimap;
            hud.Build(safe, mobilePedals);
            if (Application.isPlaying && hud.isActiveAndEnabled) hud.Subscribe();
            return hud;
        }

        /// <summary>Screen-space canvas scaled for landscape, with a safe-area child. Returns the safe-area transform.</summary>
        public static Transform CreateCanvas(string name, int sortingOrder)
        {
            var canvasObject = new GameObject(name, typeof(RectTransform), typeof(Canvas), typeof(CanvasScaler), typeof(GraphicRaycaster));
            var canvas = canvasObject.GetComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvas.sortingOrder = sortingOrder;
            var scaler = canvasObject.GetComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920f, 1080f);
            scaler.matchWidthOrHeight = 1f;
            var safe = new GameObject("SafeArea", typeof(RectTransform), typeof(SafeAreaFitter));
            safe.transform.SetParent(canvasObject.transform, false);
            UIBuild.Stretch((RectTransform)safe.transform);
            return safe.transform;
        }

        void Build(Transform safe, MobilePedalController mobilePedals)
        {
            Font font = theme.Font;
            Vector2 topLeft = new Vector2(0f, 1f), topRight = new Vector2(1f, 1f), top = new Vector2(0.5f, 1f);
            Vector2 bottomLeft = Vector2.zero, bottomRight = new Vector2(1f, 0f), bottom = new Vector2(0.5f, 0f);

            // Pause + speed/gear
            pauseButton = UIBuild.Button("Pause", safe, topLeft, topLeft, new Vector2(24f, -24f), new Vector2(96f, 96f), "II", theme, 40, out _);
            RectTransform speedPanel = UIBuild.Rect("SpeedPanel", safe, topLeft, topLeft, new Vector2(136f, -24f), new Vector2(300f, 150f));
            UIBuild.Panel(speedPanel, theme.RoundedPanel, theme.panel);
            speedText = UIBuild.Label("Speed", speedPanel, "0", font, 84, theme.text, TextAnchor.MiddleLeft);
            ((RectTransform)speedText.transform).offsetMin = new Vector2(24f, 30f);
            speedText.fontStyle = FontStyle.Bold;
            Text unit = UIBuild.Label("Unit", speedPanel, "km/h", font, 26, theme.textMuted, TextAnchor.LowerLeft);
            ((RectTransform)unit.transform).offsetMin = new Vector2(26f, 14f);
            gearText = UIBuild.Label("Gear", speedPanel, "P", font, 72, theme.accentBlue, TextAnchor.MiddleRight);
            ((RectTransform)gearText.transform).offsetMax = new Vector2(-28f, 0f);
            gearText.fontStyle = FontStyle.Bold;

            // Turn indicators + navigation
            turnLeftButton = UIBuild.Button("TurnLeft", safe, top, top, new Vector2(-340f, -24f), new Vector2(110f, 96f), "", theme, 10, out _);
            turnLeftIcon = Icon("Arrow", turnLeftButton.transform, UISprites.TriangleLeft, new Vector2(56f, 56f), theme.textMuted);
            turnRightButton = UIBuild.Button("TurnRight", safe, top, top, new Vector2(340f, -24f), new Vector2(110f, 96f), "", theme, 10, out _);
            turnRightIcon = Icon("Arrow", turnRightButton.transform, UISprites.TriangleRight, new Vector2(56f, 56f), theme.textMuted);

            RectTransform nav = UIBuild.Rect("Navigation", safe, top, top, new Vector2(0f, -24f), new Vector2(520f, 96f));
            UIBuild.Panel(nav, theme.RoundedPanel, theme.panel);
            navArrow = UIBuild.Rect("NavArrow", nav, new Vector2(0f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(56f, 0f), new Vector2(48f, 48f));
            var arrowImage = navArrow.gameObject.AddComponent<Image>();
            arrowImage.sprite = UISprites.TriangleUp;
            arrowImage.color = theme.accentBlue;
            arrowImage.raycastTarget = false;
            navText = UIBuild.Label("NavText", nav, "", font, 30, theme.text, TextAnchor.MiddleLeft);
            ((RectTransform)navText.transform).offsetMin = new Vector2(100f, 0f);

            // Mini-map (below the camera buttons from CameraControlsOverlay)
            RectTransform mapFrame = UIBuild.Rect("MiniMap", safe, topRight, topRight, new Vector2(-24f, -128f), new Vector2(260f, 260f));
            UIBuild.Panel(mapFrame, theme.RoundedPanel, theme.panelStrong);
            RectTransform mapImageRect = UIBuild.Rect("Map", mapFrame, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(244f, 244f));
            mapImage = mapImageRect.gameObject.AddComponent<RawImage>();
            mapImage.raycastTarget = false;
            if (minimap != null) mapImage.texture = minimap.Texture;
            carMarker = UIBuild.Rect("CarMarker", mapFrame, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(26f, 32f));
            var marker = carMarker.gameObject.AddComponent<Image>();
            marker.sprite = UISprites.TriangleUp;
            marker.color = theme.accentBlue;
            marker.raycastTarget = false;

            // P/R/N/D on the right edge, under the mini-map
            GearSelectorUI.Create(safe, vehicle, theme, new Vector2(-24f, -70f), new Vector2(100f, 86f), 8f);
            // Parking brake directly under the selector (selector bottom = -70 - 192 in this anchor space).
            // Needed on touch screens, and when Space has been claimed by a foot pedal.
            parkingBrakeButton = UIBuild.Button("ParkingBrake", safe, new Vector2(1f, 0.5f), new Vector2(1f, 1f), new Vector2(-24f, -274f),
                new Vector2(116f, 96f), "(P)\n체결", theme, 28, out parkingBrakeLabel);
            parkingBrakeButton.pressedColor = theme.brakeRed;

            // Touch pedals (alternative to the foot keyboard)
            touchPedalRoot = UIBuild.Rect("TouchPedals", safe, bottomRight, bottomRight, new Vector2(-148f, 24f), new Vector2(370f, 260f)).gameObject;
            TouchPedalButton brakePedal = Pedal("Brake", touchPedalRoot.transform, new Vector2(0f, 0f), new Vector2(0f, 0f), new Vector2(180f, 200f), "브레이크", theme.brakeRed, font);
            TouchPedalButton acceleratorPedal = Pedal("Accelerator", touchPedalRoot.transform, new Vector2(1f, 0f), new Vector2(1f, 0f), new Vector2(150f, 260f), "가속", theme.acceleratorGreen, font);
            if (mobilePedals != null) mobilePedals.SetPedals(brakePedal, acceleratorPedal);
            touchPedalRoot.SetActive(showTouchPedals);

            // Lights and pedal status (bottom-left)
            headlightButton = UIBuild.Button("Headlights", safe, bottomLeft, bottomLeft, new Vector2(24f, 24f), new Vector2(140f, 80f), "전조등", theme, 28, out _);
            hazardButton = UIBuild.Button("Hazard", safe, bottomLeft, bottomLeft, new Vector2(176f, 24f), new Vector2(140f, 80f), "비상등", theme, 28, out _);
            wiperButton = UIBuild.Button("Wipers", safe, bottomLeft, bottomLeft, new Vector2(328f, 24f), new Vector2(170f, 80f), "와이퍼", theme, 26, out wiperLabel);

            RectTransform pedals = UIBuild.Rect("PedalStatus", safe, bottomLeft, bottomLeft, new Vector2(24f, 120f), new Vector2(474f, 124f));
            UIBuild.Panel(pedals, theme.RoundedPanel, theme.panel);
            brakeBar = Bar("Brake", pedals, new Vector2(20f, -22f), "브레이크", theme.brakeRed, font);
            acceleratorBar = Bar("Accelerator", pedals, new Vector2(20f, -58f), "가속", theme.acceleratorGreen, font);
            brakeLamp = Lamp("BrakeLamp", pedals, new Vector2(-28f, -22f));
            acceleratorLamp = Lamp("AcceleratorLamp", pedals, new Vector2(-28f, -58f));
            pedalSourceText = UIBuild.Label("Source", pedals, "", font, 20, theme.textMuted, TextAnchor.LowerRight);
            ((RectTransform)pedalSourceText.transform).offsetMax = new Vector2(-16f, -8f);
            ((RectTransform)pedalSourceText.transform).offsetMin = new Vector2(16f, 6f);

            // Steering indicator (bottom-center, between the look buttons)
            RectTransform steering = UIBuild.Rect("SteeringIndicator", safe, bottom, bottom, new Vector2(0f, 24f), new Vector2(440f, 90f));
            UIBuild.Panel(steering, theme.RoundedPanel, theme.panel);
            RectTransform track = UIBuild.Rect("Track", steering, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(0f, 12f), new Vector2(SteeringTrackHalfWidth * 2f, 8f));
            UIBuild.Panel(track, theme.RoundedPanel, new Color(1f, 1f, 1f, 0.18f));
            RectTransform center = UIBuild.Rect("Center", steering, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(0f, 12f), new Vector2(3f, 24f));
            UIBuild.Panel(center, null, new Color(1f, 1f, 1f, 0.5f));
            steeringMarker = UIBuild.Rect("Marker", steering, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(0f, 12f), new Vector2(18f, 30f));
            UIBuild.Panel(steeringMarker, theme.RoundedPanel, theme.accentBlue);
            steeringText = UIBuild.Label("Angle", steering, "0°", font, 24, theme.text, TextAnchor.LowerCenter);
            ((RectTransform)steeringText.transform).offsetMin = new Vector2(0f, 6f);

            // Toast
            RectTransform toast = UIBuild.Rect("Toast", safe, top, top, new Vector2(0f, -136f), new Vector2(900f, 64f));
            UIBuild.Panel(toast, theme.RoundedPanel, theme.panelStrong);
            toastText = UIBuild.Label("Text", toast, "", font, 30, theme.warning);
            toastRoot = toast.gameObject;
            toastRoot.SetActive(false);

            BuildSteeringRing(safe.parent);
            BuildPauseMenu(safe, font);
        }

        /// <summary>
        /// Circular steering area, drawn on the full-screen canvas so it lines up with screen pixels.
        /// Not a raycast target: it never blocks buttons, and buttons placed over it still win.
        /// </summary>
        void BuildSteeringRing(Transform canvasRoot)
        {
            steeringRing = UIBuild.Rect("SteeringRing", canvasRoot, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(100f, 100f));
            steeringRing.SetAsFirstSibling();
            steeringRingImage = steeringRing.gameObject.AddComponent<Image>();
            steeringRingImage.sprite = UISprites.Ring;
            steeringRingImage.raycastTarget = false;

            steeringDeadZone = UIBuild.Rect("DeadZone", steeringRing, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(20f, 20f));
            var dead = steeringDeadZone.gameObject.AddComponent<Image>();
            dead.sprite = UISprites.Ring;
            dead.color = new Color(1f, 1f, 1f, 0.25f);
            dead.raycastTarget = false;

            steeringGlyph = UIBuild.Rect("WheelGlyph", steeringRing, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(150f, 150f));
            var rim = steeringGlyph.gameObject.AddComponent<Image>();
            rim.sprite = UISprites.Ring;
            rim.color = new Color(1f, 1f, 1f, 0.32f);
            rim.raycastTarget = false;
            RectTransform spokeH = UIBuild.Rect("Spoke", steeringGlyph, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(140f, 6f));
            UIBuild.Panel(spokeH, null, new Color(1f, 1f, 1f, 0.26f));
            RectTransform spokeV = UIBuild.Rect("SpokeDown", steeringGlyph, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 1f), Vector2.zero, new Vector2(6f, 70f));
            UIBuild.Panel(spokeV, null, new Color(1f, 1f, 1f, 0.26f));
            RectTransform top = UIBuild.Rect("TopMark", steeringGlyph, new Vector2(0.5f, 1f), new Vector2(0.5f, 1f), Vector2.zero, new Vector2(12f, 20f));
            UIBuild.Panel(top, null, new Color(theme.indicatorAmber.r, theme.indicatorAmber.g, theme.indicatorAmber.b, 0.6f));
        }

        void UpdateSteeringRing()
        {
            if (steeringRing == null) return;
            // The ring is the fixed visual wheel; with CircularAnywhere the gesture itself may start anywhere.
            bool circular = touchSteering != null && touchSteering.mode != SteeringGestureMode.HorizontalDrag;
            if (steeringRing.gameObject.activeSelf != circular) steeringRing.gameObject.SetActive(circular);
            if (!circular) return;

            // Canvas scales by height (1080 reference units), so a fraction of screen height maps directly.
            const float referenceHeight = 1080f;
            steeringRing.anchorMin = steeringRing.anchorMax = touchSteering.circleCenter;
            float diameter = touchSteering.circleRadius * 2f * referenceHeight;
            steeringRing.sizeDelta = new Vector2(diameter, diameter);
            steeringDeadZone.sizeDelta = Vector2.one * diameter * touchSteering.deadZoneFraction;
            steeringRingImage.color = new Color(1f, 1f, 1f, touchSteering.IsSteering ? 0.35f : 0.14f); // faint: it overlaps the road and car
            steeringDeadZone.gameObject.SetActive(touchSteering.mode == SteeringGestureMode.Circular);

            steeringGlyph.gameObject.SetActive(showSteeringWheelGlyph);
            // UI z rotation is counter-clockwise; the wheel turns clockwise for positive angles.
            steeringGlyph.localRotation = Quaternion.Euler(0f, 0f, -vehicle.SteeringWheelAngleDeg);
        }

        void BuildPauseMenu(Transform safe, Font font)
        {
            RectTransform dim = UIBuild.Rect("PauseMenu", safe, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, Vector2.zero);
            UIBuild.Stretch(dim);
            UIBuild.Panel(dim, null, new Color(0f, 0f, 0f, 0.55f), raycast: true); // blocks steering behind the menu
            RectTransform card = UIBuild.Rect("Card", dim, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(560f, 560f));
            UIBuild.Panel(card, theme.RoundedPanel, theme.panelStrong);
            Text title = UIBuild.Label("Title", card, "일시정지", font, 44, theme.text, TextAnchor.UpperCenter);
            ((RectTransform)title.transform).offsetMax = new Vector2(0f, -36f);
            title.fontStyle = FontStyle.Bold;

            Vector2 c = new Vector2(0.5f, 1f), size = new Vector2(440f, 80f);
            resumeButton = UIBuild.Button("Resume", card, c, c, new Vector2(0f, -130f), size, "계속하기", theme, 32, out _);
            restartButton = UIBuild.Button("Restart", card, c, c, new Vector2(0f, -226f), size, "다시 시작", theme, 32, out _);
            calibrateButton = UIBuild.Button("Calibrate", card, c, c, new Vector2(0f, -322f), size, "페달 보정 / 발 페달 설정", theme, 32, out _);
            menuButton = UIBuild.Button("MainMenu", card, c, c, new Vector2(0f, -418f), size, "메인 메뉴 (준비 중)", theme, 32, out Text menuLabel);
            menuButton.Interactable = false;
            menuLabel.color = theme.textMuted;
            pauseMenu = dim.gameObject;
            pauseMenu.SetActive(false);
        }

        /// <summary>Small on/off lamp: lit while the pedal is logically pressed (digital), next to its amount bar.</summary>
        Image Lamp(string name, Transform parent, Vector2 position)
        {
            RectTransform rect = UIBuild.Rect(name, parent, new Vector2(1f, 1f), new Vector2(0.5f, 0.5f), position, new Vector2(22f, 22f));
            return UIBuild.Panel(rect, UISprites.Circle, new Color(1f, 1f, 1f, 0.15f));
        }

        static Image Icon(string name, Transform parent, Sprite sprite, Vector2 size, Color color)
        {
            RectTransform rect = UIBuild.Rect(name, parent, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, size);
            var image = rect.gameObject.AddComponent<Image>();
            image.sprite = sprite;
            image.color = color;
            image.raycastTarget = false;
            return image;
        }

        Image Bar(string name, Transform parent, Vector2 position, string label, Color color, Font font)
        {
            Vector2 topLeftAnchor = new Vector2(0f, 1f);
            RectTransform labelRect = UIBuild.Rect(name + "Label", parent, topLeftAnchor, topLeftAnchor, position + new Vector2(0f, 12f), new Vector2(110f, 30f));
            UIBuild.Label("Text", labelRect, label, font, 22, theme.textMuted, TextAnchor.MiddleLeft);
            RectTransform back = UIBuild.Rect(name + "Bar", parent, topLeftAnchor, new Vector2(0f, 0.5f), position + new Vector2(110f, -4f), new Vector2(200f, 14f));
            UIBuild.Panel(back, theme.RoundedPanel, new Color(1f, 1f, 1f, 0.15f));
            RectTransform fillRect = UIBuild.Rect("Fill", back, new Vector2(0f, 0.5f), new Vector2(0f, 0.5f), Vector2.zero, new Vector2(200f, 14f));
            Image fill = UIBuild.Panel(fillRect, theme.RoundedPanel, color);
            fill.type = Image.Type.Filled;
            fill.fillMethod = Image.FillMethod.Horizontal;
            fill.fillAmount = 0f;
            return fill;
        }

        TouchPedalButton Pedal(string name, Transform parent, Vector2 anchor, Vector2 pivot, Vector2 size, string label, Color color, Font font)
        {
            RectTransform rect = UIBuild.Rect(name, parent, anchor, pivot, Vector2.zero, size);
            UIBuild.Panel(rect, theme.RoundedPanel, theme.panel, raycast: true);
            RectTransform fillRect = UIBuild.Rect("Fill", rect, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, Vector2.zero);
            UIBuild.Stretch(fillRect);
            Image fill = UIBuild.Panel(fillRect, theme.RoundedPanel, new Color(color.r, color.g, color.b, 0.75f));
            fill.type = Image.Type.Filled;
            fill.fillMethod = Image.FillMethod.Vertical;
            fill.fillOrigin = (int)Image.OriginVertical.Bottom;
            fill.fillAmount = 0f;
            UIBuild.Label("Label", rect, label, font, 30, theme.text);
            var pedal = rect.gameObject.AddComponent<TouchPedalButton>();
            pedal.SetFill(fill);
            return pedal;
        }

        void OnEnable() => Subscribe();
        void OnDisable() => Unsubscribe();

        void Subscribe()
        {
            if (subscribed || vehicle == null) return;
            subscribed = true;
            vehicle.ShiftRejected += OnShiftRejected;
            vehicle.GearChanged += OnGearChanged;
            vehicle.ParkingBrakeChanged += OnParkingBrake;
            if (accessories != null)
            {
                accessories.Feedback += ShowToast;
                accessories.Changed += RefreshAccessoryButtons;
            }
            if (turnLeftButton != null) turnLeftButton.Pressed += OnTurnLeft;
            if (turnRightButton != null) turnRightButton.Pressed += OnTurnRight;
            if (parkingBrakeButton != null) parkingBrakeButton.Pressed += OnParkingBrakeButton;
            if (headlightButton != null) headlightButton.Pressed += OnHeadlights;
            if (hazardButton != null) hazardButton.Pressed += OnHazard;
            if (wiperButton != null) wiperButton.Pressed += OnWipers;
            if (pauseButton != null) pauseButton.Pressed += TogglePause;
            if (resumeButton != null) resumeButton.Pressed += TogglePause;
            if (restartButton != null) restartButton.Pressed += OnRestart;
            if (calibrateButton != null) calibrateButton.Pressed += OnCalibrate;
            if (footPedals != null) footPedals.SafetyChanged += OnPedalSafety;
            RefreshAccessoryButtons();
            RefreshParkingBrake();
        }

        void Unsubscribe()
        {
            if (!subscribed || vehicle == null) return;
            subscribed = false;
            vehicle.ShiftRejected -= OnShiftRejected;
            vehicle.GearChanged -= OnGearChanged;
            vehicle.ParkingBrakeChanged -= OnParkingBrake;
            if (accessories != null)
            {
                accessories.Feedback -= ShowToast;
                accessories.Changed -= RefreshAccessoryButtons;
            }
            if (turnLeftButton != null) turnLeftButton.Pressed -= OnTurnLeft;
            if (turnRightButton != null) turnRightButton.Pressed -= OnTurnRight;
            if (parkingBrakeButton != null) parkingBrakeButton.Pressed -= OnParkingBrakeButton;
            if (headlightButton != null) headlightButton.Pressed -= OnHeadlights;
            if (hazardButton != null) hazardButton.Pressed -= OnHazard;
            if (wiperButton != null) wiperButton.Pressed -= OnWipers;
            if (pauseButton != null) pauseButton.Pressed -= TogglePause;
            if (resumeButton != null) resumeButton.Pressed -= TogglePause;
            if (restartButton != null) restartButton.Pressed -= OnRestart;
            if (calibrateButton != null) calibrateButton.Pressed -= OnCalibrate;
            if (footPedals != null) footPedals.SafetyChanged -= OnPedalSafety;
            if (paused) SetPaused(false);
        }

        void OnShiftRejected(TransmissionGear gear, ShiftResult result) => ShowToast(DrivingMessagesKo.ShiftFeedback(gear, result));
        void OnGearChanged(TransmissionGear gear) => ShowToast(DrivingMessagesKo.ShiftFeedback(gear, ShiftResult.Accepted));
        void OnParkingBrake(bool engaged)
        {
            ShowToast(DrivingMessagesKo.ParkingBrake(engaged));
            RefreshParkingBrake();
        }

        void OnParkingBrakeButton() => vehicle.SetParkingBrake(!vehicle.ParkingBrakeEngaged);

        void RefreshParkingBrake()
        {
            if (parkingBrakeButton == null) return;
            bool engaged = vehicle.ParkingBrakeEngaged;
            parkingBrakeButton.SetToggled(engaged); // red while engaged
            if (parkingBrakeLabel != null) parkingBrakeLabel.text = engaged ? "(P)\n체결" : "(P)\n해제";
        }
        void OnTurnLeft() { if (accessories != null) accessories.ToggleTurnSignal(TurnSignal.Left); }
        void OnTurnRight() { if (accessories != null) accessories.ToggleTurnSignal(TurnSignal.Right); }
        void OnHeadlights() { if (accessories != null) accessories.ToggleHeadlights(); }
        void OnHazard() { if (accessories != null) accessories.ToggleHazard(); }
        void OnWipers() { if (accessories != null) accessories.CycleWipers(); }

        void OnRestart()
        {
            SetPaused(false);
            vehicle.ResetVehicle();
        }

        void OnCalibrate()
        {
            SetPaused(false);
            if (calibration != null) calibration.Open();
        }

        public void TogglePause() => SetPaused(!paused);

        public void SetPaused(bool value)
        {
            if (paused == value) return;
            paused = value;
            Time.timeScale = paused ? 0f : 1f;
            if (paused) DrivingInputGate.BlockDriving(this);
            else DrivingInputGate.Release(this);
            if (pauseMenu != null) pauseMenu.SetActive(paused);
        }

        public void ShowToast(string message)
        {
            if (toastRoot == null || string.IsNullOrEmpty(message)) return;
            toastText.text = message;
            toastRoot.SetActive(true);
            toastUntil = Time.unscaledTime + 2.6f;
        }

        void RefreshAccessoryButtons()
        {
            if (accessories == null) return;
            if (headlightButton != null) headlightButton.SetToggled(accessories.HeadlightsOn);
            if (hazardButton != null) hazardButton.SetToggled(accessories.Hazard);
            if (wiperButton != null) wiperButton.SetToggled(accessories.Wipers != WiperMode.Off);
            if (wiperLabel != null) wiperLabel.text = VehicleAccessories.WiperName(accessories.Wipers);
            if (turnLeftButton != null) turnLeftButton.SetToggled(accessories.TurnSignal == TurnSignal.Left);
            if (turnRightButton != null) turnRightButton.SetToggled(accessories.TurnSignal == TurnSignal.Right);
        }

        void Update()
        {
            if (KeyboardShim.WasPressed(KeyId.Escape) && (calibration == null || !calibration.IsOpen)) TogglePause();
            if (toastRoot != null && toastRoot.activeSelf && Time.unscaledTime > toastUntil) toastRoot.SetActive(false);
            if (vehicle == null || !vehicle.IsInitialized) return;

            int speed = Mathf.RoundToInt(Mathf.Abs(vehicle.SignedSpeedKmh));
            if (speed != shownSpeed) { shownSpeed = speed; speedText.text = speed.ToString(); }
            if (vehicle.Gear != shownGear) { shownGear = vehicle.Gear; gearText.text = shownGear.ToString(); }

            if (accessories != null)
            {
                turnLeftIcon.color = accessories.LeftLampLit ? theme.indicatorAmber : theme.textMuted;
                turnRightIcon.color = accessories.RightLampLit ? theme.indicatorAmber : theme.textMuted;
            }

            bool driveGear = vehicle.Gear == TransmissionGear.D || vehicle.Gear == TransmissionGear.R;
            if (vehicle.ParkingBrakeEngaged && driveGear && vehicle.Throttle > 0.1f && !toastRoot.activeSelf)
                ShowToast(DrivingMessagesKo.ParkingBrakeStillOn);

            brakeBar.fillAmount = vehicle.Brake;
            acceleratorBar.fillAmount = vehicle.Throttle;
            pedalSourceText.text = PedalStatusText();
            bool footActive = footPedals != null && footPedals.IsActive;
            brakeLamp.color = footActive && footPedals.BrakePressed ? theme.brakeRed : new Color(1f, 1f, 1f, 0.15f);
            acceleratorLamp.color = footActive && footPedals.AcceleratorPressed
                ? (footPedals.AcceleratorSuppressed ? theme.warning : theme.acceleratorGreen)
                : new Color(1f, 1f, 1f, 0.15f);

            float angle = vehicle.SteeringWheelAngleDeg, max = Mathf.Max(vehicle.MaxSteeringWheelAngleDeg, 1f);
            steeringMarker.anchoredPosition = new Vector2(Mathf.Clamp(angle / max, -1f, 1f) * SteeringTrackHalfWidth, 12f);
            bool dragging = touchSteering != null && touchSteering.IsSteering;
            steeringText.text = $"{(angle >= 0f ? "+" : "")}{angle:F0}°  ({angle / 360f:F2}회전){(dragging ? "  · 조향 중" : "")}";
            UpdateSteeringRing();

            // The map texture is created when the minimap camera wakes up (Play Mode), so attach it lazily.
            if (mapImage != null && mapImage.texture == null && minimap != null && minimap.Texture != null) mapImage.texture = minimap.Texture;
            UpdateNavigation();
            if (carMarker != null) carMarker.localRotation = Quaternion.Euler(0f, 0f, -vehicle.transform.eulerAngles.y);
        }

        string PedalStatusText()
        {
            bool conflict = router != null && router.ThrottleSuppressedByBrake;
            if (footPedals == null) return conflict ? "브레이크 우선" : "키보드 / 터치 페달";
            if (footPedals.IsActive)
            {
                switch (footPedals.Safety)
                {
                    case PedalSafetyState.FailSafe: return "발 페달 입력 끊김 · 자동 제동 중";
                    case PedalSafetyState.AwaitingRearm: return "브레이크를 한 번 밟으면 발 페달이 다시 동작합니다";
                }
                string label = footPedals.CalibrationStatus == PedalCalibrationStatus.KeyboardChanged ? "발 페달 (다른 키보드: 재검증 권장)" : "발 페달 키보드";
                return conflict || footPedals.Conflict ? label + " · 브레이크 우선" : label;
            }
            if (footPedals.PedalsEnabled && footPedals.CalibrationStatus == PedalCalibrationStatus.Unvalidated) return "발 페달: 검증 필요 (일시정지 → 페달 보정)";
            return conflict ? "키보드 / 터치 페달 · 브레이크 우선" : "키보드 / 터치 페달";
        }

        void OnPedalSafety(PedalSafetyState state)
        {
            if (state == PedalSafetyState.FailSafe) ShowToast("발 페달 키보드 입력이 끊겼습니다. 가속을 차단하고 제동합니다.");
            else if (state == PedalSafetyState.AwaitingRearm) ShowToast("키보드 입력이 돌아왔습니다. 브레이크를 한 번 밟으세요.");
            else ShowToast("발 페달 입력이 다시 활성화되었습니다.");
        }

        void UpdateNavigation()
        {
            Vector3 toTarget = destination - vehicle.transform.position;
            toTarget.y = 0f;
            float distance = toTarget.magnitude;
            if (distance < arrivalRadiusM)
            {
                navText.text = $"{destinationName} 도착";
                navArrow.localRotation = Quaternion.identity;
                return;
            }
            float bearing = Vector3.SignedAngle(Vector3.ProjectOnPlane(vehicle.transform.forward, Vector3.up), toTarget, Vector3.up);
            navArrow.localRotation = Quaternion.Euler(0f, 0f, -bearing);
            navText.text = $"{destinationName}까지 {distance:F0} m";
        }
    }
}
