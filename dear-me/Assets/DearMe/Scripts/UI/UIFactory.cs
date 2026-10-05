using System;
using UnityEngine;
using UnityEngine.Events;
using UnityEngine.UI;

namespace DearMe.UI
{
    /// <summary>Builds uGUI objects from code so no hand-made prefabs or scenes are required.</summary>
    public static class UIFactory
    {
        public static RectTransform Rect(string name, Transform parent)
        {
            var go = new GameObject(name, typeof(RectTransform));
            go.layer = 5; // UI
            var rt = (RectTransform)go.transform;
            rt.SetParent(parent, false);
            return rt;
        }

        public static void Stretch(RectTransform rt, float inset = 0f)
        {
            rt.anchorMin = Vector2.zero;
            rt.anchorMax = Vector2.one;
            rt.pivot = new Vector2(0.5f, 0.5f);
            rt.offsetMin = new Vector2(inset, inset);
            rt.offsetMax = new Vector2(-inset, -inset);
        }

        /// <summary>Places a rect using normalized coordinates with a top-left origin (as authored in data).</summary>
        public static void PlaceNormalized(RectTransform rt, float x, float y, float w, float h)
        {
            rt.anchorMin = new Vector2(x, 1f - (y + h));
            rt.anchorMax = new Vector2(x + w, 1f - y);
            rt.offsetMin = Vector2.zero;
            rt.offsetMax = Vector2.zero;
        }

        public static Image Image(string name, Transform parent, Color color, bool raycast = false)
        {
            var rt = Rect(name, parent);
            var img = rt.gameObject.AddComponent<Image>();
            img.color = color;
            img.raycastTarget = raycast;
            return img;
        }

        public static Text Text(string name, Transform parent, string text, Font font, int size, Color color,
            TextAnchor anchor = TextAnchor.UpperLeft, bool wrap = true)
        {
            var rt = Rect(name, parent);
            var t = rt.gameObject.AddComponent<Text>();
            t.font = font;
            t.fontSize = size;
            t.color = color;
            t.alignment = anchor;
            t.text = text ?? "";
            t.supportRichText = false;
            t.horizontalOverflow = wrap ? HorizontalWrapMode.Wrap : HorizontalWrapMode.Overflow;
            t.verticalOverflow = VerticalWrapMode.Overflow;
            t.lineSpacing = 1.1f;
            t.raycastTarget = false;
            return t;
        }

        public static VerticalLayoutGroup Vertical(GameObject go, float spacing, RectOffset padding = null,
            TextAnchor align = TextAnchor.UpperLeft)
        {
            var v = go.AddComponent<VerticalLayoutGroup>();
            v.spacing = spacing;
            v.padding = padding ?? new RectOffset(0, 0, 0, 0);
            v.childAlignment = align;
            v.childControlWidth = true;
            v.childControlHeight = true;
            v.childForceExpandWidth = true;
            v.childForceExpandHeight = false;
            return v;
        }

        public static HorizontalLayoutGroup Horizontal(GameObject go, float spacing, RectOffset padding = null,
            TextAnchor align = TextAnchor.MiddleLeft)
        {
            var h = go.AddComponent<HorizontalLayoutGroup>();
            h.spacing = spacing;
            h.padding = padding ?? new RectOffset(0, 0, 0, 0);
            h.childAlignment = align;
            h.childControlWidth = true;
            h.childControlHeight = true;
            h.childForceExpandWidth = false;
            h.childForceExpandHeight = false;
            return h;
        }

        public static ContentSizeFitter FitVertical(GameObject go)
        {
            var f = go.AddComponent<ContentSizeFitter>();
            f.verticalFit = ContentSizeFitter.FitMode.PreferredSize;
            f.horizontalFit = ContentSizeFitter.FitMode.Unconstrained;
            return f;
        }

        public static LayoutElement Layout(GameObject go, float minHeight = -1, float preferredHeight = -1,
            float flexibleWidth = -1, float preferredWidth = -1, float minWidth = -1)
        {
            var le = go.GetComponent<LayoutElement>();
            if (le == null) le = go.AddComponent<LayoutElement>();
            le.minHeight = minHeight;
            le.preferredHeight = preferredHeight;
            le.flexibleWidth = flexibleWidth;
            le.preferredWidth = preferredWidth;
            le.minWidth = minWidth;
            return le;
        }

        /// <summary>Thin editorial frame drawn with four 1–2px lines (no rounded cards, no shadows).</summary>
        public static void Border(RectTransform target, Color color, float thickness = 1.5f)
        {
            void Edge(string name, Vector2 aMin, Vector2 aMax, Vector2 offMin, Vector2 offMax)
            {
                var img = Image(name, target, color);
                var rt = img.rectTransform;
                rt.anchorMin = aMin;
                rt.anchorMax = aMax;
                rt.offsetMin = offMin;
                rt.offsetMax = offMax;
                img.gameObject.AddComponent<LayoutElement>().ignoreLayout = true;
            }
            Edge("BorderTop", new Vector2(0, 1), new Vector2(1, 1), new Vector2(0, -thickness), Vector2.zero);
            Edge("BorderBottom", new Vector2(0, 0), new Vector2(1, 0), Vector2.zero, new Vector2(0, thickness));
            Edge("BorderLeft", new Vector2(0, 0), new Vector2(0, 1), Vector2.zero, new Vector2(thickness, 0));
            Edge("BorderRight", new Vector2(1, 0), new Vector2(1, 1), new Vector2(-thickness, 0), Vector2.zero);
        }

        /// <summary>Outlined, tappable rectangle with no content or layout; callers add their own.</summary>
        public static Button BareButton(string name, Transform parent, Theme theme, UnityAction onClick, bool filled = false)
        {
            var rt = Rect(name, parent);
            var bg = rt.gameObject.AddComponent<Image>();
            bg.color = Color.white;
            bg.raycastTarget = true;
            var button = rt.gameObject.AddComponent<Button>();
            button.targetGraphic = bg;
            ApplyColors(button, filled);
            button.navigation = new Navigation { mode = Navigation.Mode.None };
            if (onClick != null) button.onClick.AddListener(onClick);
            Layout(rt.gameObject, minHeight: theme.TouchMin);
            Border(rt, filled ? Theme.Ink : Theme.WithAlpha(Theme.Ink, 0.55f));
            return button;
        }

        /// <summary>A quiet outlined button with a Korean label and an optional small English line.</summary>
        public static Button Button(string name, Transform parent, Theme theme, string ko, string en, UnityAction onClick,
            int size = Theme.ChoiceSize, bool filled = false)
        {
            var button = BareButton(name, parent, theme, onClick, filled);
            var rt = (RectTransform)button.transform;
            Vertical(rt.gameObject, 2, new RectOffset(22, 22, 10, 10), TextAnchor.MiddleCenter);
            Text("Label", rt, ko, theme.Body, size, filled ? Theme.Paper : Theme.Ink, TextAnchor.MiddleCenter);
            if (!string.IsNullOrEmpty(en))
                Text("English", rt, en, theme.Body, Theme.TinySize, filled ? Theme.PaperDim : Theme.Muted, TextAnchor.MiddleCenter);
            return button;
        }

        public static void ApplyColors(Button button, bool filled)
        {
            var colors = button.colors;
            colors.normalColor = filled ? Theme.Ink : Theme.WithAlpha(Theme.Paper, 0.0f);
            colors.highlightedColor = filled ? Theme.Charcoal : Theme.WithAlpha(Theme.Ink, 0.07f);
            colors.pressedColor = filled ? Theme.Navy : Theme.WithAlpha(Theme.Ink, 0.14f);
            // Same as normal so a tapped button doesn't stay "lit" on touch screens.
            colors.selectedColor = colors.normalColor;
            colors.disabledColor = filled ? Theme.Muted : Theme.WithAlpha(Theme.Ink, 0.0f);
            colors.colorMultiplier = 1f;
            colors.fadeDuration = 0.08f;
            button.colors = colors;
        }

        public static void SetLabel(Button button, string ko, string en)
        {
            var texts = button.GetComponentsInChildren<Text>(true);
            if (texts.Length > 0) texts[0].text = ko;
            if (texts.Length > 1) texts[1].text = en ?? "";
        }

        // ---------------------------------------------------------------- text measurement

        public static float PreferredWidth(Text t) =>
            t.cachedTextGeneratorForLayout.GetPreferredWidth(t.text, t.GetGenerationSettings(Vector2.zero)) / t.pixelsPerUnit;

        public static float PreferredHeight(Text t, float width) =>
            t.cachedTextGeneratorForLayout.GetPreferredHeight(t.text, t.GetGenerationSettings(new Vector2(width, 0))) / t.pixelsPerUnit;

        /// <summary>Screen-space rectangle of a RectTransform on an overlay canvas.</summary>
        public static Rect ScreenRect(RectTransform rt)
        {
            var corners = new Vector3[4];
            rt.GetWorldCorners(corners);
            float xMin = Mathf.Min(corners[0].x, corners[2].x), xMax = Mathf.Max(corners[0].x, corners[2].x);
            float yMin = Mathf.Min(corners[0].y, corners[2].y), yMax = Mathf.Max(corners[0].y, corners[2].y);
            return new Rect(xMin, yMin, xMax - xMin, yMax - yMin);
        }

        public static void DestroyChildren(Transform t)
        {
            for (int i = t.childCount - 1; i >= 0; i--)
            {
                var child = t.GetChild(i).gameObject;
                child.SetActive(false); // excluded from layout immediately; Destroy runs at end of frame
                UnityEngine.Object.Destroy(child);
            }
        }

        public static T AddOrGet<T>(GameObject go) where T : Component
        {
            var c = go.GetComponent<T>();
            return c != null ? c : go.AddComponent<T>();
        }

        public static void SafeInvoke(Action a)
        {
            a?.Invoke();
        }
    }
}
