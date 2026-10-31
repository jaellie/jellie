using DrivingSim.Cameras;
using DrivingSim.Controls;
using DrivingSim.Core;
using DrivingSim.Localization;
using DrivingSim.Startup;
using DrivingSim.Vehicle;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

namespace DrivingSim.UI
{
    public enum ToastKind { Info, Warning, Safety }

    /// <summary>
    /// "Cabin Light" driving HUD (approved design; prototype: Tools/ui-prototype/cabin-light.html).
    /// The windshield stays clear: controls live at the screen edges. Speed and gear are read from the 3D
    /// cluster in the cockpit; the optional Practice HUD adds speed/gear, steering angle, pedal input, guidance
    /// and a mini-map. Light marks state (selected gear = ice, indicators = amber, brake = red, accelerator = teal).
    /// Presentation only: it calls public gameplay methods, so all interlocks and safety rules still decide.
    /// Steering by drawing circles keeps working anywhere that isn't a control (only controls are raycast targets).
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
        [SerializeField] StartupFlow startupFlow;
        [SerializeField] CameraController cameraController;

        [Header("Touch pedals")]
        public bool showTouchPedals = true;

        [Header("Guidance (Practice HUD; a placeholder until routes and missions exist)")]
        public bool guidanceEnabled;
        public Vector3 guidanceTarget;
        [Tooltip("strings.json key with {0:F0} = distance in meters.")]
        public string guidanceKey = "hud.guide.intersection";

        // ---- built references ----
        [SerializeField] RectTransform canvasRect, frame;
        [SerializeField] HoldButton pauseButton, turnLeftButton, turnRightButton, cameraButton, drawerButton, parkingBrakeButton;
        [SerializeField] Image turnLeftIcon, turnRightIcon, turnLeftLit, turnRightLit, drawerLit, cameraLit, parkingBrakeLit;
        [SerializeField] Text parkingBrakeGlyph, parkingBrakeLabel;
        [SerializeField] RectTransform gearThumb;
        [SerializeField] HoldButton[] gearButtons = new HoldButton[4];
        [SerializeField] Text[] gearLabels = new Text[4];
        [SerializeField] GameObject drawerPanel, cameraPopover, practiceCard, guidancePill, minimapFrame, touchPedalRoot;
        [SerializeField] HoldButton headlightTile, hazardTile, wiperTile;
        [SerializeField] Image headlightLit, hazardLit, wiperLit;
        [SerializeField] Text headlightState, hazardState, wiperState;
        [SerializeField] HoldButton viewCockpit, viewChase, lookLeft, lookRight, fovDown, fovUp;
        [SerializeField] Image viewCockpitLit, viewChaseLit;
        [SerializeField] Text fovText;
        [SerializeField] Text speedText, gearText, steerText, sourceText, guidanceText;
        [SerializeField] RectTransform steerFill;
        [SerializeField] Image brakeBar, acceleratorBar;
        [SerializeField] RawImage mapImage;
        [SerializeField] RectTransform carMarker;
        [SerializeField] TouchPedalButton brakePedal, acceleratorPedal;
        [SerializeField] Image brakePedalLit, acceleratorPedalLit;
        [SerializeField] RectTransform toastRoot;
        [SerializeField] Image toastLit, toastIcon;
        [SerializeField] Text toastText;
        [SerializeField] RectTransform halo, haloMark;
        [SerializeField] Image haloImage;
        [SerializeField] CabinPauseMenu pauseMenu;

        const float SteerBarHalf = 180f;
        float toastUntil;
        int shownSpeed = -1;
        TransmissionGear shownGear = (TransmissionGear)(-1);
        bool subscribed, paused, parkingToastShown;

        public bool IsPaused => paused;

        public static DrivingHUDController Create(HudTheme theme, VehicleController vehicle, VehicleAccessories accessories,
            VehicleInputRouter router, PedalInputManager footPedals, TouchSteeringController touchSteering,
            MobilePedalController mobilePedals, PedalCalibrationWizard calibration, MinimapCamera minimap,
            StartupFlow startupFlow = null, CameraController cameraController = null)
        {
            EnsureEventSystem();
            Transform safe = CreateCanvas("DrivingHUDCanvas", 5);
            var hud = safe.root.gameObject.AddComponent<DrivingHUDController>();
            hud.theme = theme != null ? theme : HudTheme.Default;
            hud.vehicle = vehicle;
            hud.accessories = accessories;
            hud.router = router;
            hud.footPedals = footPedals;
            hud.touchSteering = touchSteering;
            hud.calibration = calibration;
            hud.minimap = minimap;
            hud.startupFlow = startupFlow;
            hud.cameraController = cameraController;
            hud.Build(safe, mobilePedals);
            hud.pauseMenu = CabinPauseMenu.Create(hud, startupFlow, calibration, cameraController, footPedals);
            if (Application.isPlaying && hud.isActiveAndEnabled) hud.Subscribe();
            return hud;
        }

        /// <summary>Screen-space canvas scaled for landscape (1080-tall reference units), with a safe-area child. Returns the safe area.</summary>
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
            var safe = new GameObject("SafeArea", typeof(RectTransform));
            safe.transform.SetParent(canvasObject.transform, false);
            UIBuild.Stretch((RectTransform)safe.transform);
            safe.AddComponent<SafeAreaFitter>(); // after parenting/stretching, so the initial safe area is retained
            return safe.transform;
        }

        static void EnsureEventSystem()
        {
            EventSystem events = FindFirstObjectByType<EventSystem>();
            if (events == null)
            {
                var go = new GameObject("EventSystem", typeof(EventSystem));
#if ENABLE_INPUT_SYSTEM
                go.AddComponent<UnityEngine.InputSystem.UI.InputSystemUIInputModule>().AssignDefaultActions();
#else
                go.AddComponent<StandaloneInputModule>();
#endif
                events = go.GetComponent<EventSystem>();
            }
            events.sendNavigationEvents = false; // a foot on the floor keyboard must not press focused buttons
        }

        // ================================================================== build

        static readonly Vector2 TL = new Vector2(0f, 1f), TR = new Vector2(1f, 1f), BL = Vector2.zero, BR = new Vector2(1f, 0f), TC = new Vector2(0.5f, 1f), C = new Vector2(0.5f, 0.5f);

        void Build(Transform safe, MobilePedalController mobilePedals)
        {
            canvasRect = (RectTransform)safe.root;
            frame = CabinStyle.Rect("Frame", safe, C, C, Vector2.zero, Vector2.zero);
            UIBuild.Stretch(frame);
            frame.offsetMin = new Vector2(64f, 40f);
            frame.offsetMax = new Vector2(-64f, -40f);

            BuildHalo();

            // Top-left: pause
            pauseButton = IconButton("Pause", frame, TL, TL, Vector2.zero, Vector2.one * CabinStyle.Touch, "Pause", UISprites.Circle, out _);

            // Top-center: turn signals (they double as indicator lamps)
            turnLeftButton = IconButton("TurnLeft", frame, TC, TR, new Vector2(-12f, 0f), new Vector2(150f, CabinStyle.Touch), "TurnLeft", UISprites.TriangleLeft, out turnLeftIcon);
            turnLeftLit = CabinStyle.AddLitEdge((RectTransform)turnLeftButton.transform, CabinStyle.Amber);
            turnRightButton = IconButton("TurnRight", frame, TC, TL, new Vector2(12f, 0f), new Vector2(150f, CabinStyle.Touch), "TurnRight", UISprites.TriangleRight, out turnRightIcon);
            turnRightLit = CabinStyle.AddLitEdge((RectTransform)turnRightButton.transform, CabinStyle.Amber);

            // Top-right: camera button, its popover and (Practice) the mini-map to its left
            cameraButton = IconButton("Camera", frame, TR, TR, Vector2.zero, Vector2.one * CabinStyle.Touch, "Camera", UISprites.Circle, out _);
            cameraLit = CabinStyle.AddLitEdge((RectTransform)cameraButton.transform, CabinStyle.Ice);
            BuildCameraPopover();
            BuildMinimap();

            BuildPracticeCard();
            BuildGuidance();
            BuildToast();
            BuildDrawer();
            BuildGearGate();
            BuildParkingBrake();
            BuildPedals(mobilePedals);
            ApplyHudMode();
        }

        HoldButton IconButton(string name, Transform parent, Vector2 anchor, Vector2 pivot, Vector2 pos, Vector2 size, string icon, Sprite fallback, out Image iconImage)
        {
            HoldButton b = CabinStyle.Button(name, parent, anchor, pivot, pos, size, null, out _);
            iconImage = CabinStyle.Icon(icon, b.transform, Vector2.zero, 56f, CabinStyle.TextColor, fallback);
            return b;
        }

        void BuildHalo()
        {
            // Transient ring under the steering finger; on the canvas root so it lines up with screen pixels.
            halo = CabinStyle.Rect("SteeringHalo", canvasRect, C, C, Vector2.zero, new Vector2(280f, 280f));
            halo.SetAsFirstSibling();
            haloImage = CabinStyle.Fill(halo, CabinStyle.Ring, new Color(CabinStyle.Ice.r, CabinStyle.Ice.g, CabinStyle.Ice.b, 0.35f));
            haloMark = CabinStyle.Rect("Mark", halo, TC, C, new Vector2(0f, -4f), new Vector2(24f, 24f));
            CabinStyle.Fill(haloMark, CabinStyle.CircleSolid, CabinStyle.Ice);
            halo.gameObject.SetActive(false);
        }

        void BuildCameraPopover()
        {
            RectTransform pop = CabinStyle.Rect("CameraPopover", frame, TR, TR, new Vector2(-150f, 0f), new Vector2(620f, 404f));
            CabinStyle.Fill(pop, CabinStyle.Glass, Color.white, raycast: true); // blocks steering under the panel
            cameraPopover = pop.gameObject;

            RectTransform seg = CabinStyle.Rect("View", pop, TC, TC, new Vector2(0f, -24f), new Vector2(572f, 124f));
            CabinStyle.Fill(seg, CabinStyle.Solid, new Color(0f, 0f, 0f, 0.35f));
            viewCockpit = CabinStyle.Button("Cockpit", seg, new Vector2(0f, 0.5f), new Vector2(0f, 0.5f), new Vector2(8f, 0f), new Vector2(274f, 108f), "camera.toFirstPerson", out _, ButtonStyle.Ghost);
            viewCockpitLit = CabinStyle.AddLitEdge((RectTransform)viewCockpit.transform, CabinStyle.Ice);
            viewChase = CabinStyle.Button("Chase", seg, new Vector2(1f, 0.5f), new Vector2(1f, 0.5f), new Vector2(-8f, 0f), new Vector2(274f, 108f), "camera.toThirdPerson", out _, ButtonStyle.Ghost);
            viewChaseLit = CabinStyle.AddLitEdge((RectTransform)viewChase.transform, CabinStyle.Ice);

            lookLeft = CabinStyle.Button("LookLeft", pop, TL, TL, new Vector2(24f, -168f), new Vector2(278f, 104f), "camera.lookLeft", out _, ButtonStyle.Glass, 34);
            lookRight = CabinStyle.Button("LookRight", pop, TR, TR, new Vector2(-24f, -168f), new Vector2(278f, 104f), "camera.lookRight", out _, ButtonStyle.Glass, 34);

            fovDown = CabinStyle.Button("FovDown", pop, BL, BL, new Vector2(24f, 24f), new Vector2(104f, 96f), null, out _);
            CabinStyle.Label("Minus", fovDown.transform, "−", 52, CabinStyle.TextColor);
            fovUp = CabinStyle.Button("FovUp", pop, BR, BR, new Vector2(-24f, 24f), new Vector2(104f, 96f), null, out _);
            CabinStyle.Label("Plus", fovUp.transform, "+", 52, CabinStyle.TextColor);
            RectTransform fov = CabinStyle.Rect("Fov", pop, new Vector2(0.5f, 0f), new Vector2(0.5f, 0f), new Vector2(0f, 24f), new Vector2(340f, 96f));
            fovText = CabinStyle.Label("Value", fov, "", CabinStyle.Caption, CabinStyle.Text2);
            cameraPopover.SetActive(false);
        }

        void BuildMinimap()
        {
            RectTransform map = CabinStyle.Rect("MiniMap", frame, TR, TR, new Vector2(-150f, 0f), new Vector2(300f, 300f));
            CabinStyle.Fill(map, CabinStyle.Glass, Color.white);
            RectTransform img = CabinStyle.Rect("Map", map, C, C, Vector2.zero, new Vector2(276f, 276f));
            mapImage = img.gameObject.AddComponent<RawImage>();
            mapImage.raycastTarget = false;
            if (minimap != null) mapImage.texture = minimap.Texture;
            carMarker = CabinStyle.Rect("Car", map, C, C, Vector2.zero, new Vector2(30f, 36f));
            Image marker = CabinStyle.Fill(carMarker, Resources.Load<Sprite>("UI/Sprites/CarMarker") ?? UISprites.TriangleUp, CabinStyle.Ice);
            marker.preserveAspect = true;
            minimapFrame = map.gameObject;
        }

        void BuildPracticeCard()
        {
            RectTransform card = CabinStyle.Rect("PracticeCard", frame, TL, TL, new Vector2(0f, -160f), new Vector2(440f, 420f));
            CabinStyle.Fill(card, CabinStyle.Glass, Color.white);
            practiceCard = card.gameObject;

            Text eyebrow = CabinStyle.Localized("SpeedLabel", card, "hud.speed", 26, CabinStyle.Text3, TextAnchor.UpperLeft, FontStyle.Bold);
            Place(eyebrow, 32f, -26f, 300f, 34f);
            speedText = CabinStyle.Label("Speed", card, "0", 104, CabinStyle.TextColor, TextAnchor.LowerLeft, FontStyle.Bold);
            Place(speedText, 28f, -60f, 240f, 110f);
            Text unit = CabinStyle.Label("Unit", card, "km/h", 30, CabinStyle.Text2, TextAnchor.LowerLeft);
            Place(unit, 178f, -136f, 120f, 36f);
            gearText = CabinStyle.Label("Gear", card, "P", 100, CabinStyle.Ice, TextAnchor.LowerRight, FontStyle.Bold);
            Place(gearText, 300f, -60f, 112f, 110f);

            Text steerLabel = CabinStyle.Localized("SteerLabel", card, "hud.steer", 26, CabinStyle.Text3, TextAnchor.UpperLeft, FontStyle.Bold);
            Place(steerLabel, 32f, -196f, 200f, 34f);
            steerText = CabinStyle.Label("SteerValue", card, "0°", 30, CabinStyle.TextColor, TextAnchor.UpperRight);
            Place(steerText, 212f, -194f, 196f, 36f);
            RectTransform track = CabinStyle.Rect("SteerTrack", card, TL, TL, new Vector2(40f, -246f), new Vector2(SteerBarHalf * 2f, 16f));
            CabinStyle.Fill(track, CabinStyle.Solid, new Color(1f, 1f, 1f, 0.08f));
            RectTransform mid = CabinStyle.Rect("Center", track, C, C, Vector2.zero, new Vector2(3f, 30f));
            CabinStyle.Fill(mid, null, CabinStyle.Text3);
            steerFill = CabinStyle.Rect("Fill", track, C, new Vector2(0f, 0.5f), Vector2.zero, new Vector2(0f, 16f));
            CabinStyle.Fill(steerFill, CabinStyle.Solid, CabinStyle.Ice);

            brakeBar = Bar(card, "hud.brake", -292f, CabinStyle.Red);
            acceleratorBar = Bar(card, "hud.accelerator", -334f, CabinStyle.Teal);
            sourceText = CabinStyle.Label("Source", card, "", 22, CabinStyle.Text3, TextAnchor.UpperLeft);
            Place(sourceText, 32f, -372f, 380f, 40f);
            sourceText.horizontalOverflow = HorizontalWrapMode.Wrap;
        }

        Image Bar(RectTransform card, string key, float y, Color color)
        {
            Text label = CabinStyle.Localized(key, card, key, 26, CabinStyle.Text2, TextAnchor.MiddleLeft);
            Place(label, 32f, y, 140f, 32f);
            RectTransform back = CabinStyle.Rect(key + "Bar", card, TL, TL, new Vector2(176f, y - 8f), new Vector2(236f, 16f));
            CabinStyle.Fill(back, CabinStyle.Solid, new Color(1f, 1f, 1f, 0.08f));
            RectTransform fillRect = CabinStyle.Rect("Fill", back, C, C, Vector2.zero, Vector2.zero);
            UIBuild.Stretch(fillRect);
            Image fill = CabinStyle.Fill(fillRect, CabinStyle.Solid, color);
            fill.type = Image.Type.Filled;
            fill.fillMethod = Image.FillMethod.Horizontal;
            fill.fillAmount = 0f;
            return fill;
        }

        static void Place(Graphic g, float x, float y, float w, float h)
        {
            var r = (RectTransform)g.transform;
            r.anchorMin = r.anchorMax = TL;
            r.pivot = TL;
            r.anchoredPosition = new Vector2(x, y);
            r.sizeDelta = new Vector2(w, h);
        }

        void BuildGuidance()
        {
            RectTransform pill = CabinStyle.Rect("Guidance", frame, TC, TC, new Vector2(0f, -160f), new Vector2(960f, 88f));
            CabinStyle.Fill(pill, CabinStyle.Glass, Color.white);
            CabinStyle.Icon("Map", pill, new Vector2(-420f, 0f), 40f, CabinStyle.Text2, UISprites.TriangleUp);
            guidanceText = CabinStyle.Label("Text", pill, "", CabinStyle.Caption, CabinStyle.Text2);
            ((RectTransform)guidanceText.transform).offsetMin = new Vector2(80f, 0f);
            guidancePill = pill.gameObject;
        }

        void BuildToast()
        {
            toastRoot = CabinStyle.Rect("Toast", frame, TC, TC, new Vector2(0f, -160f), new Vector2(1100f, 112f));
            CabinStyle.Fill(toastRoot, CabinStyle.Glass, Color.white);
            toastLit = CabinStyle.AddLitEdge(toastRoot, CabinStyle.Amber);
            toastIcon = CabinStyle.Fill(CabinStyle.Rect("Dot", toastRoot, new Vector2(0f, 0.5f), C, new Vector2(56f, 0f), new Vector2(26f, 26f)), CabinStyle.CircleSolid, CabinStyle.Amber);
            toastText = CabinStyle.Label("Text", toastRoot, "", CabinStyle.Body, CabinStyle.TextColor, TextAnchor.MiddleLeft, FontStyle.Bold);
            toastText.resizeTextForBestFit = true;
            toastText.resizeTextMinSize = 24;
            toastText.resizeTextMaxSize = CabinStyle.Body;
            var tr = (RectTransform)toastText.transform;
            tr.offsetMin = new Vector2(96f, 8f);
            tr.offsetMax = new Vector2(-40f, -8f);
            toastRoot.gameObject.SetActive(false);
        }

        void BuildDrawer()
        {
            drawerButton = CabinStyle.Button("Vehicle", frame, BL, BL, Vector2.zero, Vector2.one * CabinStyle.Touch, "hud.vehicle", out _, ButtonStyle.Glass, 28);
            drawerLit = CabinStyle.AddLitEdge((RectTransform)drawerButton.transform, CabinStyle.Ice);
            RectTransform panel = CabinStyle.Rect("VehicleDrawer", frame, BL, BL, new Vector2(144f, 0f), new Vector2(664f, 232f));
            CabinStyle.Fill(panel, CabinStyle.Glass, Color.white, raycast: true);
            drawerPanel = panel.gameObject;
            headlightTile = Tile(panel, 0, "Headlights", "hud.headlights", out headlightLit, out headlightState);
            hazardTile = Tile(panel, 1, "Hazard", "hud.hazard", out hazardLit, out hazardState);
            wiperTile = Tile(panel, 2, "Wipers", "hud.wipers", out wiperLit, out wiperState);
            drawerPanel.SetActive(false);
        }

        HoldButton Tile(RectTransform panel, int index, string icon, string key, out Image lit, out Text state)
        {
            HoldButton b = CabinStyle.Button(icon, panel, BL, BL, new Vector2(16f + index * 216f, 16f), new Vector2(200f, 200f), null, out _, ButtonStyle.Ghost);
            CabinStyle.Fill((RectTransform)b.transform, CabinStyle.Solid, new Color(0f, 0f, 0f, 0.25f), raycast: true);
            b.normalColor = new Color(0f, 0f, 0f, 0.25f);
            b.pressedColor = new Color(1f, 1f, 1f, 0.1f);
            CabinStyle.Icon(icon, b.transform, new Vector2(0f, 46f), 56f, CabinStyle.TextColor, UISprites.Circle);
            Text label = CabinStyle.Localized("Label", b.transform, key, 30, CabinStyle.TextColor, TextAnchor.MiddleCenter, FontStyle.Bold);
            ((RectTransform)label.transform).anchoredPosition = new Vector2(0f, -22f);
            ((RectTransform)label.transform).sizeDelta = new Vector2(-16f, -150f);
            state = CabinStyle.Label("State", b.transform, "", 26, CabinStyle.Text2);
            ((RectTransform)state.transform).anchoredPosition = new Vector2(0f, -64f);
            ((RectTransform)state.transform).sizeDelta = new Vector2(-16f, -160f);
            lit = CabinStyle.AddLitEdge((RectTransform)b.transform, CabinStyle.Ice);
            return b;
        }

        void BuildGearGate()
        {
            const float slot = 112f, gap = 6f, pad = 12f;
            RectTransform gate = CabinStyle.Rect("GearGate", frame, TR, TR, new Vector2(0f, -200f), new Vector2(150f, pad * 2f + slot * 4f + gap * 3f));
            CabinStyle.Fill(gate, CabinStyle.Glass, Color.white);
            gearThumb = CabinStyle.Rect("Thumb", gate, TC, TC, new Vector2(0f, -pad), new Vector2(126f, slot));
            CabinStyle.Fill(gearThumb, CabinStyle.Solid, new Color(0.14f, 0.22f, 0.29f, 1f));
            CabinStyle.SetLit(CabinStyle.AddLitEdge(gearThumb, CabinStyle.Ice), true); // the selected gear always glows
            for (int i = 0; i < 4; i++)
            {
                var gear = (TransmissionGear)i;
                gearButtons[i] = CabinStyle.Button("Gear_" + gear, gate, TC, TC, new Vector2(0f, -pad - i * (slot + gap)), new Vector2(126f, slot), null, out _, ButtonStyle.Ghost);
                gearLabels[i] = CabinStyle.Label("Label", gearButtons[i].transform, gear.ToString(), 56, CabinStyle.Text2, TextAnchor.MiddleCenter, FontStyle.Bold);
            }
        }

        void BuildParkingBrake()
        {
            parkingBrakeButton = CabinStyle.Button("ParkingBrake", frame, TR, TR, new Vector2(0f, -710f), new Vector2(150f, 150f), null, out _);
            parkingBrakeGlyph = CabinStyle.Label("Glyph", parkingBrakeButton.transform, "(P)", 50, CabinStyle.Text2, TextAnchor.MiddleCenter, FontStyle.Bold);
            ((RectTransform)parkingBrakeGlyph.transform).anchoredPosition = new Vector2(0f, 14f);
            parkingBrakeLabel = CabinStyle.Localized("Label", parkingBrakeButton.transform, "hud.parkingBrake.short", 24, CabinStyle.Text2, TextAnchor.MiddleCenter, FontStyle.Bold);
            ((RectTransform)parkingBrakeLabel.transform).anchoredPosition = new Vector2(0f, -46f);
            ((RectTransform)parkingBrakeLabel.transform).sizeDelta = new Vector2(0f, -110f);
            parkingBrakeLit = CabinStyle.AddLitEdge((RectTransform)parkingBrakeButton.transform, CabinStyle.Red);
        }

        void BuildPedals(MobilePedalController mobilePedals)
        {
            RectTransform root = CabinStyle.Rect("TouchPedals", frame, BR, BR, new Vector2(-190f, 0f), new Vector2(514f, 420f));
            touchPedalRoot = root.gameObject;
            acceleratorPedal = Pedal(root, "Accelerator", BR, Vector2.zero, new Vector2(190f, 420f), "hud.accelerator", CabinStyle.Teal, out acceleratorPedalLit);
            brakePedal = Pedal(root, "Brake", BR, new Vector2(-214f, 0f), new Vector2(300f, 290f), "hud.brake", CabinStyle.Red, out brakePedalLit);
            if (mobilePedals != null) mobilePedals.SetPedals(brakePedal, acceleratorPedal);
            touchPedalRoot.SetActive(showTouchPedals);
        }

        TouchPedalButton Pedal(RectTransform parent, string name, Vector2 anchor, Vector2 pos, Vector2 size, string key, Color color, out Image lit)
        {
            RectTransform rect = CabinStyle.Rect(name, parent, anchor, anchor, pos, size);
            CabinStyle.Fill(rect, CabinStyle.Glass, Color.white, raycast: true);
            RectTransform fillRect = CabinStyle.Rect("Fill", rect, C, C, Vector2.zero, Vector2.zero);
            UIBuild.Stretch(fillRect);
            Image fill = CabinStyle.Fill(fillRect, CabinStyle.Solid, new Color(color.r, color.g, color.b, 0.45f));
            fill.type = Image.Type.Filled;
            fill.fillMethod = Image.FillMethod.Vertical;
            fill.fillOrigin = (int)Image.OriginVertical.Bottom;
            fill.fillAmount = 0f;
            RectTransform tread = CabinStyle.Rect("Tread", rect, C, C, Vector2.zero, Vector2.zero);
            UIBuild.Stretch(tread);
            tread.offsetMin = new Vector2(28f, 92f);
            tread.offsetMax = new Vector2(-28f, -28f);
            Image t = CabinStyle.Fill(tread, CabinStyle.Tread, Color.white);
            t.type = Image.Type.Tiled;
            Text label = CabinStyle.Localized("Label", rect, key, 30, CabinStyle.Text2, TextAnchor.LowerCenter, FontStyle.Bold);
            ((RectTransform)label.transform).offsetMin = new Vector2(8f, 26f);
            lit = CabinStyle.AddLitEdge(rect, color);
            var pedal = rect.gameObject.AddComponent<TouchPedalButton>();
            pedal.SetFill(fill);
            return pedal;
        }

        // ================================================================== state

        void ApplyHudMode()
        {
            bool practice = DriverPreferences.Hud == HudMode.Practice;
            if (practiceCard != null) practiceCard.SetActive(practice);
            if (guidancePill != null) guidancePill.SetActive(practice && guidanceEnabled);
            if (minimapFrame != null) minimapFrame.SetActive(practice && DriverPreferences.Minimap && (cameraPopover == null || !cameraPopover.activeSelf));
            if (toastRoot != null) toastRoot.anchoredPosition = new Vector2(0f, practice && guidanceEnabled ? -270f : -160f);
            if (touchSteering != null) touchSteering.angularGain = DriverPreferences.CurrentSteeringGain;
        }

        void OnEnable() => Subscribe();
        void OnDisable() => Unsubscribe();

        void Start()
        {
            if (cameraController != null && DriverPreferences.ChaseViewByDefault) cameraController.SetMode(CameraViewMode.Chase);
        }

        void Subscribe()
        {
            if (subscribed || vehicle == null) return;
            subscribed = true;
            vehicle.ShiftRejected += OnShiftRejected;
            vehicle.GearChanged += OnGearChanged;
            vehicle.ParkingBrakeChanged += OnParkingBrake;
            if (accessories != null) { accessories.Feedback += ShowToast; accessories.Changed += RefreshAccessories; }
            if (footPedals != null) footPedals.SafetyChanged += OnPedalSafety;
            LocalizationService.LanguageChanged += OnLanguageChanged;
            DriverPreferences.Changed += ApplyHudMode;

            pauseButton.Pressed += TogglePause;
            turnLeftButton.Pressed += OnTurnLeft;
            turnRightButton.Pressed += OnTurnRight;
            cameraButton.Pressed += ToggleCameraPopover;
            drawerButton.Pressed += ToggleDrawer;
            parkingBrakeButton.Pressed += OnParkingBrakeButton;
            headlightTile.Pressed += OnHeadlights;
            hazardTile.Pressed += OnHazard;
            wiperTile.Pressed += OnWipers;
            viewCockpit.Pressed += OnViewCockpit;
            viewChase.Pressed += OnViewChase;
            lookLeft.HeldChanged += OnLookLeft;
            lookRight.HeldChanged += OnLookRight;
            fovDown.Pressed += OnFovDown;
            fovUp.Pressed += OnFovUp;
            for (int i = 0; i < gearButtons.Length; i++)
            {
                var gear = (TransmissionGear)i;
                gearButtons[i].Pressed += () => vehicle.RequestGear(gear);
            }
            ApplyHudMode();
            RefreshAccessories();
            RefreshParkingBrake();
            RefreshGear(vehicle.Gear);
            RefreshCamera();
        }

        void Unsubscribe()
        {
            if (!subscribed || vehicle == null) return;
            subscribed = false;
            vehicle.ShiftRejected -= OnShiftRejected;
            vehicle.GearChanged -= OnGearChanged;
            vehicle.ParkingBrakeChanged -= OnParkingBrake;
            if (accessories != null) { accessories.Feedback -= ShowToast; accessories.Changed -= RefreshAccessories; }
            if (footPedals != null) footPedals.SafetyChanged -= OnPedalSafety;
            LocalizationService.LanguageChanged -= OnLanguageChanged;
            DriverPreferences.Changed -= ApplyHudMode;

            pauseButton.Pressed -= TogglePause;
            turnLeftButton.Pressed -= OnTurnLeft;
            turnRightButton.Pressed -= OnTurnRight;
            cameraButton.Pressed -= ToggleCameraPopover;
            drawerButton.Pressed -= ToggleDrawer;
            parkingBrakeButton.Pressed -= OnParkingBrakeButton;
            headlightTile.Pressed -= OnHeadlights;
            hazardTile.Pressed -= OnHazard;
            wiperTile.Pressed -= OnWipers;
            viewCockpit.Pressed -= OnViewCockpit;
            viewChase.Pressed -= OnViewChase;
            lookLeft.HeldChanged -= OnLookLeft;
            lookRight.HeldChanged -= OnLookRight;
            fovDown.Pressed -= OnFovDown;
            fovUp.Pressed -= OnFovUp;
            foreach (HoldButton b in gearButtons) if (b != null) b.ClearPressedHandlers();
            if (paused) SetPaused(false);
        }

        // ---- handlers ----
        void OnShiftRejected(TransmissionGear gear, ShiftResult result) => ShowToast(DrivingMessages.ShiftFeedback(gear, result), ToastKind.Warning);
        void OnGearChanged(TransmissionGear gear) => RefreshGear(gear);
        void OnParkingBrake(bool engaged) { ShowToast(DrivingMessages.ParkingBrake(engaged), ToastKind.Info); RefreshParkingBrake(); }
        void OnParkingBrakeButton() => vehicle.SetParkingBrake(!vehicle.ParkingBrakeEngaged);
        void OnTurnLeft() { if (accessories != null) accessories.ToggleTurnSignal(TurnSignal.Left); }
        void OnTurnRight() { if (accessories != null) accessories.ToggleTurnSignal(TurnSignal.Right); }
        void OnHeadlights() { if (accessories != null) accessories.ToggleHeadlights(); }
        void OnHazard() { if (accessories != null) accessories.ToggleHazard(); }
        void OnWipers() { if (accessories != null) accessories.CycleWipers(); }
        void OnViewCockpit() { if (cameraController != null) cameraController.SetMode(CameraViewMode.Cockpit); RefreshCamera(); }
        void OnViewChase() { if (cameraController != null) cameraController.SetMode(CameraViewMode.Chase); RefreshCamera(); }
        void OnLookLeft(bool held) { if (cameraController != null) cameraController.SetLookLeft(held); }
        void OnLookRight(bool held) { if (cameraController != null) cameraController.SetLookRight(held); }
        void OnFovDown() { if (cameraController != null) cameraController.AdjustCockpitFov(-cameraController.fovStep); RefreshCamera(); }
        void OnFovUp() { if (cameraController != null) cameraController.AdjustCockpitFov(cameraController.fovStep); RefreshCamera(); }

        void ToggleDrawer()
        {
            bool open = !drawerPanel.activeSelf;
            drawerPanel.SetActive(open);
            CabinStyle.SetLit(drawerLit, open);
            if (open) SetCameraPopover(false);
        }

        void ToggleCameraPopover() => SetCameraPopover(!cameraPopover.activeSelf);

        void SetCameraPopover(bool open)
        {
            cameraPopover.SetActive(open);
            CabinStyle.SetLit(cameraLit, open);
            if (open && drawerPanel.activeSelf) { drawerPanel.SetActive(false); CabinStyle.SetLit(drawerLit, false); }
            if (!open && cameraController != null) { cameraController.SetLookLeft(false); cameraController.SetLookRight(false); }
            RefreshCamera();
            ApplyHudMode();
        }

        void OnPedalSafety(PedalSafetyState state)
        {
            if (state == PedalSafetyState.FailSafe) ShowToast(Loc.T("toast.pedal.failSafe"), ToastKind.Safety);
            else if (state == PedalSafetyState.AwaitingRearm) ShowToast(Loc.T("toast.pedal.rearm"), ToastKind.Warning);
            else ShowToast(Loc.T("toast.pedal.restored"), ToastKind.Info);
        }

        void OnLanguageChanged(Language _)
        {
            RefreshAccessories();
            RefreshParkingBrake();
            RefreshCamera();
        }

        void RefreshGear(TransmissionGear gear)
        {
            int index = Mathf.Clamp((int)gear, 0, 3);
            if (gearThumb != null) gearThumb.anchoredPosition = new Vector2(0f, -12f - index * 118f);
            for (int i = 0; i < gearLabels.Length; i++)
                if (gearLabels[i] != null) gearLabels[i].color = i == index ? CabinStyle.TextColor : CabinStyle.Text3;
            shownGear = (TransmissionGear)(-1);
        }

        void RefreshParkingBrake()
        {
            bool on = vehicle != null && vehicle.ParkingBrakeEngaged;
            CabinStyle.SetLit(parkingBrakeLit, on);
            if (parkingBrakeGlyph != null) parkingBrakeGlyph.color = on ? CabinStyle.Red : CabinStyle.Text2;
            if (parkingBrakeLabel != null) parkingBrakeLabel.color = on ? CabinStyle.Red : CabinStyle.Text2;
            parkingToastShown = false;
        }

        void RefreshAccessories()
        {
            if (accessories == null) return;
            SetTile(headlightLit, headlightState, accessories.HeadlightsOn, CabinStyle.Ice, Loc.T(accessories.HeadlightsOn ? "hud.on" : "hud.off"));
            SetTile(hazardLit, hazardState, accessories.Hazard, CabinStyle.Amber, Loc.T(accessories.Hazard ? "hud.on" : "hud.off"));
            SetTile(wiperLit, wiperState, accessories.Wipers != WiperMode.Off, CabinStyle.Ice, VehicleAccessories.WiperName(accessories.Wipers));
        }

        static void SetTile(Image lit, Text state, bool on, Color color, string text)
        {
            CabinStyle.SetLit(lit, on, color);
            if (state != null) { state.text = text; state.color = on ? color : CabinStyle.Text2; }
        }

        void RefreshCamera()
        {
            bool cockpit = cameraController == null || cameraController.Mode == CameraViewMode.Cockpit;
            CabinStyle.SetLit(viewCockpitLit, cockpit);
            CabinStyle.SetLit(viewChaseLit, !cockpit);
            if (fovText != null && cameraController != null) fovText.text = Loc.T("camera.fov", Mathf.RoundToInt(cameraController.cockpitFov));
        }

        public void TogglePause() => SetPaused(!paused);

        public void SetPaused(bool value)
        {
            if (paused == value) return;
            paused = value;
            Time.timeScale = paused ? 0f : 1f;
            if (paused) DrivingInputGate.BlockDriving(this);
            else DrivingInputGate.Release(this);
            if (pauseMenu != null) pauseMenu.SetVisible(paused);
            if (paused) { SetCameraPopover(false); if (drawerPanel.activeSelf) ToggleDrawer(); }
        }

        public void ShowToast(string message) => ShowToast(message, ToastKind.Warning);

        public void ShowToast(string message, ToastKind kind)
        {
            if (toastRoot == null || string.IsNullOrEmpty(message)) return;
            Color c = kind == ToastKind.Safety ? CabinStyle.Red : kind == ToastKind.Info ? CabinStyle.Ice : CabinStyle.Amber;
            toastText.text = message;
            CabinStyle.SetLit(toastLit, true, c);
            toastIcon.color = c;
            toastRoot.gameObject.SetActive(true);
            toastUntil = Time.unscaledTime + (kind == ToastKind.Safety ? 4f : 2.6f);
        }

        /// <summary>Practice HUD guidance toward a point (the rig sets the Test Town intersection).</summary>
        public void SetGuidance(Vector3 target, string key = "hud.guide.intersection")
        {
            guidanceEnabled = true;
            guidanceTarget = target;
            guidanceKey = key;
            ApplyHudMode();
        }

        // ================================================================== per frame

        void Update()
        {
            bool settingsOpen = pauseMenu != null && pauseMenu.SettingsOpen;
            if (KeyboardShim.WasPressed(KeyId.Escape) && (calibration == null || !calibration.IsOpen) && !settingsOpen) TogglePause();
            if (toastRoot != null && toastRoot.gameObject.activeSelf && Time.unscaledTime > toastUntil) toastRoot.gameObject.SetActive(false);
            if (vehicle == null || !vehicle.IsInitialized) return;

            if (accessories != null)
            {
                CabinStyle.SetLit(turnLeftLit, accessories.LeftLampLit);
                CabinStyle.SetLit(turnRightLit, accessories.RightLampLit);
                turnLeftIcon.color = accessories.LeftLampLit ? CabinStyle.Amber : CabinStyle.Text2;
                turnRightIcon.color = accessories.RightLampLit ? CabinStyle.Amber : CabinStyle.Text2;
            }

            bool driveGear = vehicle.Gear == TransmissionGear.D || vehicle.Gear == TransmissionGear.R;
            if (vehicle.ParkingBrakeEngaged && driveGear && vehicle.Throttle > 0.1f && !parkingToastShown)
            {
                ShowToast(DrivingMessages.ParkingBrakeStillOn, ToastKind.Warning);
                parkingToastShown = true;
            }

            if (brakePedal != null) CabinStyle.SetLit(brakePedalLit, brakePedal.IsPressed);
            if (acceleratorPedal != null) CabinStyle.SetLit(acceleratorPedalLit, acceleratorPedal.IsPressed);

            if (touchSteering != null && touchSteering.IsSteering && (cameraPopover.activeSelf || drawerPanel.activeSelf))
            {
                SetCameraPopover(false);
                if (drawerPanel.activeSelf) ToggleDrawer();
            }
            UpdateHalo();
            if (practiceCard != null && practiceCard.activeSelf) UpdatePractice();
            if (guidancePill != null && guidancePill.activeSelf) UpdateGuidance();
            if (minimapFrame != null && minimapFrame.activeSelf)
            {
                if (mapImage.texture == null && minimap != null && minimap.Texture != null) mapImage.texture = minimap.Texture;
                carMarker.localRotation = Quaternion.Euler(0f, 0f, -vehicle.transform.eulerAngles.y);
            }
        }

        void UpdateHalo()
        {
            bool show = DriverPreferences.SteeringHalo && touchSteering != null && touchSteering.IsSteering && !paused;
            if (halo.gameObject.activeSelf != show) halo.gameObject.SetActive(show);
            if (!show) return;
            if (RectTransformUtility.ScreenPointToLocalPointInRectangle(canvasRect, touchSteering.ActivePointerPixels, null, out Vector2 local))
                halo.anchoredPosition = local;
            // UI rotation is counter-clockwise; the wheel turns clockwise for positive angles.
            halo.localRotation = Quaternion.Euler(0f, 0f, -vehicle.SteeringWheelAngleDeg);
        }

        void UpdatePractice()
        {
            int speed = Mathf.RoundToInt(Mathf.Abs(vehicle.SignedSpeedKmh));
            if (speed != shownSpeed) { shownSpeed = speed; speedText.text = speed.ToString(); }
            if (vehicle.Gear != shownGear) { shownGear = vehicle.Gear; gearText.text = shownGear.ToString(); }
            float angle = vehicle.SteeringWheelAngleDeg, max = Mathf.Max(vehicle.MaxSteeringWheelAngleDeg, 1f);
            steerText.text = (angle >= 0f ? "+" : "") + angle.ToString("F0") + "°";
            float w = Mathf.Clamp01(Mathf.Abs(angle) / max) * SteerBarHalf;
            steerFill.pivot = new Vector2(angle < 0f ? 1f : 0f, 0.5f);
            steerFill.sizeDelta = new Vector2(w, 16f);
            brakeBar.fillAmount = vehicle.Brake;
            acceleratorBar.fillAmount = vehicle.Throttle;
            sourceText.text = PedalStatusText();
        }

        void UpdateGuidance()
        {
            Vector3 to = guidanceTarget - vehicle.transform.position;
            to.y = 0f;
            bool ahead = Vector3.Dot(to, vehicle.transform.forward) > 0f;
            guidanceText.text = ahead && to.magnitude > 15f ? Loc.T(guidanceKey, to.magnitude) : Loc.T("hud.guide.free");
        }

        string PedalStatusText()
        {
            bool conflict = router != null && router.ThrottleSuppressedByBrake;
            if (footPedals == null) return Loc.T(conflict ? "hud.source.brakePriorityOnly" : "hud.source.keyboardTouch");
            if (footPedals.IsActive)
            {
                switch (footPedals.Safety)
                {
                    case PedalSafetyState.FailSafe: return Loc.T("hud.source.failSafe");
                    case PedalSafetyState.AwaitingRearm: return Loc.T("hud.source.rearm");
                }
                string label = Loc.T(footPedals.CalibrationStatus == PedalCalibrationStatus.KeyboardChanged ? "hud.source.keyboardChanged" : "hud.source.footPedals");
                return conflict || footPedals.Conflict ? Loc.T("hud.source.brakePriority", label) : label;
            }
            if (footPedals.PedalsEnabled && footPedals.CalibrationStatus == PedalCalibrationStatus.Unvalidated) return Loc.T("hud.source.unvalidated");
            return conflict ? Loc.T("hud.source.brakePriority", Loc.T("hud.source.keyboardTouch")) : Loc.T("hud.source.keyboardTouch");
        }

        // ---- used by the pause menu ----
        internal void RestartDrive()
        {
            SetPaused(false);
            vehicle.ResetVehicle();
        }
    }
}
