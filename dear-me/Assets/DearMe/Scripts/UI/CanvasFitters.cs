using System;
using DearMe.Settings;
using UnityEngine;
using UnityEngine.UI;

namespace DearMe.UI
{
    /// <summary>
    /// Dear Me, is a portrait phone game. The UI is laid out on a 720×1280 reference: tall phones
    /// scale by width; anything wider than 9:16 (tablets, desktop browsers) scales by height and
    /// shows the game in a centered portrait frame. The text-size setting zooms the whole UI.
    /// Raises Resized when the screen, orientation or safe area changes.
    /// </summary>
    public class ResponsiveCanvas : MonoBehaviour
    {
        public CanvasScaler[] scalers = new CanvasScaler[0];
        public GameSettings settings;
        public event Action Resized;

        Vector2Int lastSize;
        Rect lastSafe;
        float lastScale;

        static readonly Vector2 Reference = new Vector2(720f, 1280f);

        void Update()
        {
            var size = new Vector2Int(Screen.width, Screen.height);
            float scale = settings != null ? settings.TextScale : 1f;
            if (size == lastSize && Screen.safeArea == lastSafe && Mathf.Approximately(scale, lastScale)) return;
            lastSize = size;
            lastSafe = Screen.safeArea;
            lastScale = scale;
            Apply(size, scale);
            Resized?.Invoke();
        }

        void Apply(Vector2Int size, float scale)
        {
            bool narrow = size.x <= size.y * PortraitFrame.Aspect;
            foreach (var s in scalers)
            {
                if (s == null) continue;
                s.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
                s.screenMatchMode = CanvasScaler.ScreenMatchMode.MatchWidthOrHeight;
                s.referenceResolution = Reference / Mathf.Max(0.5f, scale);
                s.matchWidthOrHeight = narrow ? 0f : 1f;
            }
        }
    }

    /// <summary>
    /// The game's portrait screen. Full-screen on phones (any aspect taller than 9:16); on wider
    /// windows it becomes a centered 9:16 column, like a phone on a desk.
    /// </summary>
    public class PortraitFrame : MonoBehaviour
    {
        public const float Aspect = 9f / 16f;

        void Update()
        {
            var rt = (RectTransform)transform;
            var parent = rt.parent as RectTransform;
            if (parent == null || parent.rect.height <= 0f) return;
            float w = Mathf.Min(parent.rect.width, parent.rect.height * Aspect);
            rt.anchorMin = rt.anchorMax = new Vector2(0.5f, 0.5f);
            rt.pivot = new Vector2(0.5f, 0.5f);
            rt.anchoredPosition = Vector2.zero;
            var size = new Vector2(w, parent.rect.height);
            if (rt.sizeDelta != size) rt.sizeDelta = size;
        }
    }

    /// <summary>Fits a RectTransform to Screen.safeArea (notches, rounded corners, home indicators).</summary>
    public class SafeAreaFitter : MonoBehaviour
    {
        Rect last;
        Vector2Int lastSize;

        void Update()
        {
            var safe = Screen.safeArea;
            var size = new Vector2Int(Screen.width, Screen.height);
            if (safe == last && size == lastSize) return;
            last = safe;
            lastSize = size;
            if (size.x <= 0 || size.y <= 0) return;
            var rt = (RectTransform)transform;
            rt.anchorMin = new Vector2(safe.xMin / size.x, safe.yMin / size.y);
            rt.anchorMax = new Vector2(safe.xMax / size.x, safe.yMax / size.y);
            rt.offsetMin = rt.offsetMax = Vector2.zero;
        }
    }
}
