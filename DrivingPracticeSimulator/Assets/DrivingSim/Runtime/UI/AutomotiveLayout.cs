using UnityEngine;
using UnityEngine.UI;

namespace DrivingSim.UI
{
    /// <summary>Fits presentation coordinates inside the safe area without changing input coordinates.</summary>
    public class AutomotiveLayout : MonoBehaviour
    {
        [SerializeField] RectTransform frame;
        [SerializeField] RectTransform container;
        [SerializeField] Vector2 designSize;
        [SerializeField] float margin;
        [SerializeField] bool expand;

        public static RectTransform Frame(Transform safe)
        {
            RectTransform rect = UIBuild.Rect("LandscapeLayout", safe, Vector2.one * 0.5f,
                Vector2.one * 0.5f, Vector2.zero, new Vector2(1920f, 1080f));
            Attach(rect, new Vector2(1920f, 1080f), 0f, true);
            return rect;
        }

        public static void Attach(RectTransform rect, Vector2 size, float inset = 32f, bool fill = false)
        {
            var fit = rect.gameObject.AddComponent<AutomotiveLayout>();
            fit.frame = rect;
            fit.container = rect.parent as RectTransform;
            fit.designSize = size;
            fit.margin = inset;
            fit.expand = fill;
            fit.Fit();
        }

        void LateUpdate() => Fit();

        void Fit()
        {
            if (frame == null || container == null) return;
            Vector2 available = container.rect.size - Vector2.one * margin * 2f;
            if (available.x <= 0f || available.y <= 0f) return;
            float scale = Mathf.Min(1f, Mathf.Min(available.x / designSize.x, available.y / designSize.y));
            frame.localScale = Vector3.one * scale;
            frame.sizeDelta = expand ? available / scale : designSize;
        }

        /// <summary>Full-canvas modal shield; the card remains inside the actual safe area.</summary>
        public static GameObject Modal(Transform safe, HudTheme theme, Vector2 size, out RectTransform card)
        {
            Transform canvas = safe.parent;
            RectTransform shield = UIBuild.Rect("ModalShield", canvas, Vector2.one * 0.5f,
                Vector2.one * 0.5f, Vector2.zero, Vector2.zero);
            UIBuild.Stretch(shield);
            UIBuild.Panel(shield, null, new Color(0.015f, 0.035f, 0.065f, 0.94f), true);
            safe.SetParent(shield, false);
            card = UIBuild.Rect("Card", safe, Vector2.one * 0.5f, Vector2.one * 0.5f, Vector2.zero, size);
            UIBuild.Panel(card, theme.RoundedPanel, theme.panelStrong);
            Attach(card, size);
            Accent(card, theme);
            return shield.gameObject;
        }

        public static void Accent(RectTransform card, HudTheme theme)
        {
            RectTransform line = UIBuild.Rect("Accent", card, new Vector2(0.5f, 1f),
                new Vector2(0.5f, 1f), new Vector2(0f, -1f), new Vector2(card.sizeDelta.x - 64f, 3f));
            UIBuild.Panel(line, theme.RoundedPanel, theme.acceleratorGreen);
        }

        public static void Primary(HoldButton button, HudTheme theme)
        {
            button.normalColor = theme.iceBlue;
            button.pressedColor = theme.acceleratorGreen;
            button.GetComponent<Graphic>().color = theme.iceBlue;
            foreach (Text label in button.GetComponentsInChildren<Text>()) label.color = theme.panelStrong;
        }

        public static void DecorateButton(HoldButton button, string resource, HudTheme theme, bool stacked = false, bool iconOnly = false)
        {
            Sprite sprite = Resources.Load<Sprite>("UI/Sprites/" + resource);
            if (sprite == null) return; // Keep the original label as the visual fallback.
            RectTransform rect = UIBuild.Rect("Icon", button.transform,
                stacked ? new Vector2(0.5f, 1f) : iconOnly ? Vector2.one * 0.5f : new Vector2(0f, 0.5f),
                Vector2.one * 0.5f, stacked ? new Vector2(0f, -24f) : iconOnly ? Vector2.zero : new Vector2(28f, 0f),
                Vector2.one * (iconOnly ? 38f : 30f));
            var image = rect.gameObject.AddComponent<Image>();
            image.sprite = sprite;
            image.color = theme.text;
            image.raycastTarget = false;
            Text label = button.GetComponentInChildren<Text>();
            if (label == null) return;
            if (iconOnly) { label.text = ""; return; }
            RectTransform labelRect = (RectTransform)label.transform;
            UIBuild.Stretch(labelRect);
            labelRect.offsetMin = stacked ? new Vector2(8f, 6f) : new Vector2(56f, 6f);
            labelRect.offsetMax = stacked ? new Vector2(-8f, -44f) : new Vector2(-8f, -6f);
        }

        /// <summary>Scrollable localized copy; keeps warnings and long key lists reachable.</summary>
        public static Text ScrollBlock(string name, RectTransform card, float top, float height,
            int size, Color color, HudTheme theme)
        {
            RectTransform viewport = UIBuild.Rect(name, card, new Vector2(0.5f, 1f),
                new Vector2(0.5f, 1f), new Vector2(0f, -top), new Vector2(card.sizeDelta.x - 120f, height));
            UIBuild.Panel(viewport, null, new Color(0f, 0f, 0f, 0f), true);
            viewport.gameObject.AddComponent<RectMask2D>();
            Text copy = UIBuild.Label("Copy", viewport, "", theme.Font, size, color, TextAnchor.UpperLeft);
            copy.verticalOverflow = VerticalWrapMode.Overflow;
            RectTransform content = (RectTransform)copy.transform;
            content.anchorMin = new Vector2(0f, 1f);
            content.anchorMax = Vector2.one;
            content.pivot = new Vector2(0.5f, 1f);
            content.offsetMin = content.offsetMax = Vector2.zero;
            var fit = copy.gameObject.AddComponent<ContentSizeFitter>();
            fit.verticalFit = ContentSizeFitter.FitMode.PreferredSize;
            var scroll = viewport.gameObject.AddComponent<ScrollRect>();
            scroll.viewport = viewport;
            scroll.content = content;
            scroll.horizontal = false;
            scroll.movementType = ScrollRect.MovementType.Clamped;
            scroll.scrollSensitivity = 32f;
            return copy;
        }
    }
}
