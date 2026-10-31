using DrivingSim.Cameras;
using DrivingSim.Localization;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

namespace DrivingSim.UI
{
    /// <summary>
    /// On-screen camera controls: view toggle, hold-to-look left/right, and cockpit FOV.
    /// These are dedicated buttons so camera look never shares the steering drag gesture;
    /// the future touch-steering controller must ignore pointers that start over UI.
    /// </summary>
    public class CameraControlsOverlay : MonoBehaviour
    {
        [SerializeField] CameraController controller;
        [SerializeField] HoldButton viewButton;
        [SerializeField] HoldButton lookLeftButton;
        [SerializeField] HoldButton lookRightButton;
        [SerializeField] HoldButton fovDownButton;
        [SerializeField] HoldButton fovUpButton;
        [SerializeField] Text viewLabel;
        [SerializeField] Text fovLabel;
        [SerializeField] GameObject cockpitOnlyGroup;

        static readonly Vector2 ReferenceResolution = new Vector2(1920f, 1080f);

        bool subscribed;

        public static CameraControlsOverlay Create(CameraController controller)
        {
            EnsureEventSystem();

            var canvasObject = new GameObject("CameraControlsCanvas", typeof(RectTransform), typeof(Canvas), typeof(CanvasScaler), typeof(GraphicRaycaster));
            var canvas = canvasObject.GetComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvas.sortingOrder = 10;
            var scaler = canvasObject.GetComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = ReferenceResolution;
            scaler.matchWidthOrHeight = 1f; // landscape: scale by height

            var safe = new GameObject("SafeArea", typeof(RectTransform), typeof(SafeAreaFitter));
            safe.transform.SetParent(canvasObject.transform, false);
            Stretch((RectTransform)safe.transform);

            Font font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            var overlay = canvasObject.AddComponent<CameraControlsOverlay>();
            overlay.controller = controller;

            // Top-right cluster: [view] [FOV - / value / +]
            RectTransform topRight = Row("TopRight", safe.transform, new Vector2(1f, 1f), new Vector2(-24f, -24f));
            overlay.viewButton = MakeButton("ViewButton", topRight, new Vector2(170f, 84f), Loc.T("camera.toFirstPerson"), font, out overlay.viewLabel);

            var fovGroup = Row("FovGroup", topRight, new Vector2(1f, 1f), Vector2.zero);
            overlay.cockpitOnlyGroup = fovGroup.gameObject;
            overlay.fovDownButton = MakeButton("FovDown", fovGroup, new Vector2(84f, 84f), "−", font, out _);
            overlay.fovLabel = MakeText("FovValue", fovGroup, new Vector2(140f, 84f), Loc.T("camera.fov", 65), font, 30);
            overlay.fovUpButton = MakeButton("FovUp", fovGroup, new Vector2(84f, 84f), "+", font, out _);

            // Look buttons flank the steering indicator at the bottom center, clear of the
            // right-edge gear selector and the pedal zones.
            overlay.lookLeftButton = MakeBottomButton("LookLeft", safe.transform, new Vector2(-340f, 24f), "camera.lookLeft", font);
            overlay.lookRightButton = MakeBottomButton("LookRight", safe.transform, new Vector2(340f, 24f), "camera.lookRight", font);

            // At runtime AddComponent already ran OnEnable before the references above existed.
            if (Application.isPlaying && overlay.isActiveAndEnabled) overlay.Subscribe();
            return overlay;
        }

        void OnEnable() => Subscribe();
        void OnDisable() => Unsubscribe();

        void Subscribe()
        {
            if (subscribed || controller == null) return;
            subscribed = true;
            if (viewButton != null) viewButton.Pressed += OnViewPressed;
            if (lookLeftButton != null) lookLeftButton.HeldChanged += controller.SetLookLeft;
            if (lookRightButton != null) lookRightButton.HeldChanged += controller.SetLookRight;
            if (fovDownButton != null) fovDownButton.Pressed += OnFovDown;
            if (fovUpButton != null) fovUpButton.Pressed += OnFovUp;
            controller.ModeChanged += OnModeChanged;
            controller.CockpitFovChanged += OnFovChanged;
            LocalizationService.LanguageChanged += OnLanguageChanged;
            OnModeChanged(controller.Mode);
            OnFovChanged(controller.cockpitFov);
        }

        void Unsubscribe()
        {
            if (!subscribed || controller == null) return;
            subscribed = false;
            if (viewButton != null) viewButton.Pressed -= OnViewPressed;
            if (lookLeftButton != null) lookLeftButton.HeldChanged -= controller.SetLookLeft;
            if (lookRightButton != null) lookRightButton.HeldChanged -= controller.SetLookRight;
            if (fovDownButton != null) fovDownButton.Pressed -= OnFovDown;
            if (fovUpButton != null) fovUpButton.Pressed -= OnFovUp;
            controller.ModeChanged -= OnModeChanged;
            controller.CockpitFovChanged -= OnFovChanged;
            LocalizationService.LanguageChanged -= OnLanguageChanged;
            controller.SetLookLeft(false);
            controller.SetLookRight(false);
        }

        void OnViewPressed() => controller.ToggleFirstPerson();

        void OnLanguageChanged(DrivingSim.Core.Language _)
        {
            OnModeChanged(controller.Mode);
            OnFovChanged(controller.cockpitFov);
        }
        void OnFovDown() => controller.AdjustCockpitFov(-controller.fovStep);
        void OnFovUp() => controller.AdjustCockpitFov(controller.fovStep);

        void OnModeChanged(CameraViewMode mode)
        {
            bool cockpit = mode == CameraViewMode.Cockpit;
            // The label names the view the button switches to.
            if (viewLabel != null) viewLabel.text = Loc.T(cockpit ? "camera.toThirdPerson" : "camera.toFirstPerson");
            if (cockpitOnlyGroup != null) cockpitOnlyGroup.SetActive(cockpit);
            if (lookLeftButton != null) lookLeftButton.gameObject.SetActive(cockpit);
            if (lookRightButton != null) lookRightButton.gameObject.SetActive(cockpit);
        }

        void OnFovChanged(float fov)
        {
            if (fovLabel != null) fovLabel.text = Loc.T("camera.fov", Mathf.RoundToInt(fov));
        }

        static void EnsureEventSystem()
        {
            if (FindFirstObjectByType<EventSystem>() != null) return;
            var eventSystem = new GameObject("EventSystem", typeof(EventSystem));
#if ENABLE_INPUT_SYSTEM
            var module = eventSystem.AddComponent<UnityEngine.InputSystem.UI.InputSystemUIInputModule>();
            module.AssignDefaultActions(); // point, click, scroll; don't rely on editor-only Reset()
#else
            eventSystem.AddComponent<StandaloneInputModule>();
#endif
        }

        static void Stretch(RectTransform rect)
        {
            rect.anchorMin = Vector2.zero;
            rect.anchorMax = Vector2.one;
            rect.offsetMin = Vector2.zero;
            rect.offsetMax = Vector2.zero;
        }

        static RectTransform Row(string name, Transform parent, Vector2 anchor, Vector2 offset)
        {
            var go = new GameObject(name, typeof(RectTransform), typeof(HorizontalLayoutGroup), typeof(ContentSizeFitter));
            go.transform.SetParent(parent, false);
            var rect = (RectTransform)go.transform;
            rect.anchorMin = rect.anchorMax = anchor;
            rect.pivot = anchor;
            rect.anchoredPosition = offset;
            var layout = go.GetComponent<HorizontalLayoutGroup>();
            layout.spacing = 12f;
            layout.childAlignment = TextAnchor.MiddleRight;
            layout.childControlWidth = false;
            layout.childControlHeight = false;
            layout.childForceExpandWidth = false;
            layout.childForceExpandHeight = false;
            var fitter = go.GetComponent<ContentSizeFitter>();
            fitter.horizontalFit = ContentSizeFitter.FitMode.PreferredSize;
            fitter.verticalFit = ContentSizeFitter.FitMode.PreferredSize;
            return rect;
        }

        static HoldButton MakeButton(string name, Transform parent, Vector2 size, string label, Font font, out Text text)
        {
            var go = new GameObject(name, typeof(RectTransform), typeof(Image), typeof(HoldButton));
            go.transform.SetParent(parent, false);
            ((RectTransform)go.transform).sizeDelta = size;
            var image = go.GetComponent<Image>();
            image.sprite = HudTheme.Default.RoundedPanel;
            image.type = Image.Type.Sliced;
            image.color = HudTheme.Default.panel;
            var hold = go.GetComponent<HoldButton>();
            hold.normalColor = HudTheme.Default.panel;
            hold.pressedColor = HudTheme.Default.accentBlue;
            text = MakeText("Label", go.transform, size, label, font, 32);
            text.raycastTarget = false;
            return go.GetComponent<HoldButton>();
        }

        static HoldButton MakeBottomButton(string name, Transform parent, Vector2 offset, string labelKey, Font font)
        {
            HoldButton button = MakeButton(name, parent, new Vector2(210f, 90f), Loc.T(labelKey), font, out Text label);
            label.gameObject.AddComponent<LocalizedText>().Key = labelKey;
            var rect = (RectTransform)button.transform;
            rect.anchorMin = rect.anchorMax = new Vector2(0.5f, 0f);
            rect.pivot = new Vector2(0.5f, 0f);
            rect.anchoredPosition = offset;
            return button;
        }

        static Text MakeText(string name, Transform parent, Vector2 size, string value, Font font, int fontSize)
        {
            var go = new GameObject(name, typeof(RectTransform), typeof(Text));
            go.transform.SetParent(parent, false);
            var rect = (RectTransform)go.transform;
            rect.sizeDelta = size;
            var text = go.GetComponent<Text>();
            text.font = font;
            text.fontSize = fontSize;
            text.alignment = TextAnchor.MiddleCenter;
            text.color = Color.white;
            text.text = value;
            text.raycastTarget = false;
            return text;
        }
    }
}
