using System.Collections.Generic;
using DearMe.Content;
using DearMe.Settings;
using UnityEngine;
using UnityEngine.UI;

namespace DearMe.UI
{
    /// <summary>
    /// Placeholder 2D environment painted from locations.json (flat shapes over a two-tone wall).
    /// Final illustrated art can replace this view without touching gameplay code.
    /// </summary>
    public class BackgroundView : MonoBehaviour
    {
        RectTransform root;
        RectTransform stage;
        AspectRatioFitter aspect;
        Image top;
        Image bottom;
        Image floorImage;
        RectTransform shapes;
        RectTransform rainMask;
        readonly List<RectTransform> drops = new List<RectTransform>();
        readonly List<float> speeds = new List<float>();
        GameSettings settings;
        bool raining;

        public RectTransform Root => root;
        /// <summary>16:9 area holding the scene; room hotspots are placed relative to it.</summary>
        public RectTransform Stage => stage;
        public string CurrentId { get; private set; } = "";

        public void Build(RectTransform parent, GameSettings settings)
        {
            this.settings = settings;
            root = UIFactory.Rect("Background", parent);
            UIFactory.Stretch(root);
            bottom = UIFactory.Image("Fill", root, Theme.Navy);
            UIFactory.Stretch(bottom.rectTransform);

            // Landscape: the stage covers the screen. Portrait: it fits the width and the rest is fill.
            stage = UIFactory.Rect("Stage", root);
            stage.anchorMin = Vector2.zero;
            stage.anchorMax = Vector2.one;
            aspect = stage.gameObject.AddComponent<AspectRatioFitter>();
            aspect.aspectRatio = 16f / 9f;
            aspect.aspectMode = AspectRatioFitter.AspectMode.EnvelopeParent;

            var floor = UIFactory.Image("Floor", stage, Theme.Navy);
            UIFactory.Stretch(floor.rectTransform);
            floorImage = floor;
            top = UIFactory.Image("Wall", stage, Theme.Navy);
            UIFactory.PlaceNormalized(top.rectTransform, 0f, 0f, 1f, 0.62f);
            shapes = UIFactory.Rect("Shapes", stage);
            UIFactory.Stretch(shapes);
            rainMask = UIFactory.Rect("Rain", stage);
            rainMask.gameObject.AddComponent<RectMask2D>();
            for (int i = 0; i < 28; i++)
            {
                var d = UIFactory.Image("Drop", rainMask, new Color(0.75f, 0.82f, 0.92f, 0.28f)).rectTransform;
                d.anchorMin = d.anchorMax = new Vector2(0f, 1f);
                d.sizeDelta = new Vector2(2f, 26f + (i % 4) * 8f);
                drops.Add(d);
                speeds.Add(420f + (i * 37 % 160));
            }
            rainMask.gameObject.SetActive(false);
        }

        public void Show(LocationDef loc)
        {
            CurrentId = loc != null ? loc.id : "";
            UIFactory.DestroyChildren(shapes);
            if (loc == null)
            {
                top.color = bottom.color = floorImage.color = Theme.Navy;
                rainMask.gameObject.SetActive(false);
                raining = false;
                return;
            }
            top.color = Theme.Hex(loc.top);
            bottom.color = Theme.Hex(loc.bottom);
            floorImage.color = bottom.color;
            foreach (var s in loc.shapes)
            {
                var img = UIFactory.Image("Shape", shapes, Theme.Hex(s.color));
                UIFactory.PlaceNormalized(img.rectTransform, s.x, s.y, s.w, s.h);
            }
            raining = loc.rain;
            rainMask.gameObject.SetActive(raining);
            if (raining)
            {
                var a = loc.rainArea;
                if (a.w > 0f && a.h > 0f) UIFactory.PlaceNormalized(rainMask, a.x, a.y, a.w, a.h);
                else UIFactory.Stretch(rainMask);
                ScatterDrops();
            }
        }

        void ScatterDrops()
        {
            var size = rainMask.rect.size;
            for (int i = 0; i < drops.Count; i++)
                drops[i].anchoredPosition = new Vector2(Random.Range(0f, Mathf.Max(1f, size.x)), -Random.Range(0f, Mathf.Max(1f, size.y)));
        }

        void Update()
        {
            // Covering would crop scene objects on portrait and ultra-wide screens; fit those instead.
            float ratio = root.rect.width / Mathf.Max(1f, root.rect.height);
            bool fit = ratio < 1.3f || ratio > 2.0f;
            var mode = fit ? AspectRatioFitter.AspectMode.FitInParent : AspectRatioFitter.AspectMode.EnvelopeParent;
            if (aspect.aspectMode != mode) aspect.aspectMode = mode;

            if (!raining) return;
            // Reduced motion: the rain is still there, it just doesn't move.
            if (settings.reducedMotion) return;
            var size = rainMask.rect.size;
            float dt = Mathf.Min(Time.unscaledDeltaTime, 0.05f);
            for (int i = 0; i < drops.Count; i++)
            {
                var p = drops[i].anchoredPosition;
                p.y -= speeds[i] * dt;
                p.x -= speeds[i] * 0.08f * dt;
                if (p.y < -size.y - 40f)
                {
                    p.y = 30f;
                    p.x = Random.Range(0f, Mathf.Max(1f, size.x + 30f));
                }
                drops[i].anchoredPosition = p;
            }
        }
    }
}
