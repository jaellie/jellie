using System;
using DearMe.Settings;
using UnityEngine;
using UnityEngine.UI;

namespace DearMe.UI
{
    /// <summary>
    /// Keeps every canvas readable on any window: landscape scales by height, portrait by
    /// width, and the player's text-size setting zooms the whole UI so layouts never break.
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

        static readonly Vector2 Landscape = new Vector2(1280f, 720f);
        static readonly Vector2 Portrait = new Vector2(720f, 1280f);

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
            bool portrait = size.y > size.x;
            foreach (var s in scalers)
            {
                if (s == null) continue;
                s.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
                s.screenMatchMode = CanvasScaler.ScreenMatchMode.MatchWidthOrHeight;
                s.referenceResolution = (portrait ? Portrait : Landscape) / Mathf.Max(0.5f, scale);
                s.matchWidthOrHeight = portrait ? 0f : 1f;
            }
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
