using System.Collections.Generic;
using DearMe.Content;
using DearMe.Settings;
using UnityEngine;
using UnityEngine.UI;

namespace DearMe.UI
{
    /// <summary>
    /// The scene: a 9:16 painting (or placeholder shapes) that covers the portrait frame, plus a
    /// dimmed copy behind the frame so wide windows show the scene's colors instead of bars.
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
        RawImage painting;
        RawImage backdrop;
        RectTransform rainMask;
        readonly List<RectTransform> drops = new List<RectTransform>();
        readonly List<float> speeds = new List<float>();
        GameSettings settings;
        bool raining;

        public RectTransform Root => root;
        /// <summary>9:16 area holding the scene; room hotspots are placed relative to it.</summary>
        public RectTransform Stage => stage;
        public string CurrentId { get; private set; } = "";
        /// <summary>True when the current place is a painted image rather than placeholder shapes.</summary>
        public bool IsPainted { get; private set; }

        /// <param name="screen">Full-window layer (backdrop behind the portrait frame).</param>
        /// <param name="frame">The portrait game frame.</param>
        public void Build(RectTransform screen, RectTransform frame, GameSettings settings)
        {
            this.settings = settings;
            var back = UIFactory.Rect("Backdrop", screen);
            UIFactory.Stretch(back);
            bottom = UIFactory.Image("Fill", back, Theme.Navy);
            UIFactory.Stretch(bottom.rectTransform);
            backdrop = UIFactory.Rect("BackdropArt", back).gameObject.AddComponent<RawImage>();
            backdrop.raycastTarget = false;
            backdrop.color = new Color(0.55f, 0.55f, 0.62f, 1f); // dimmed so the frame reads as the game
            var bfit = backdrop.gameObject.AddComponent<AspectRatioFitter>();
            bfit.aspectRatio = PortraitFrame.Aspect;
            bfit.aspectMode = AspectRatioFitter.AspectMode.EnvelopeParent;
            backdrop.gameObject.SetActive(false);

            root = UIFactory.Rect("Background", frame);
            UIFactory.Stretch(root);
            root.gameObject.AddComponent<RectMask2D>();
            // The stage covers the frame; on very tall phones a little of each side is cropped,
            // so paintings keep important things inside the central 80%.
            stage = UIFactory.Rect("Stage", root);
            stage.anchorMin = Vector2.zero;
            stage.anchorMax = Vector2.one;
            aspect = stage.gameObject.AddComponent<AspectRatioFitter>();
            aspect.aspectRatio = PortraitFrame.Aspect;
            aspect.aspectMode = AspectRatioFitter.AspectMode.EnvelopeParent;

            var floor = UIFactory.Image("Floor", stage, Theme.Navy);
            UIFactory.Stretch(floor.rectTransform);
            floorImage = floor;
            top = UIFactory.Image("Wall", stage, Theme.Navy);
            UIFactory.PlaceNormalized(top.rectTransform, 0f, 0f, 1f, 0.70f);
            painting = UIFactory.Rect("Painting", stage).gameObject.AddComponent<RawImage>();
            painting.raycastTarget = false;
            UIFactory.Stretch(painting.rectTransform);
            painting.gameObject.SetActive(false);
            shapes = UIFactory.Rect("Shapes", stage);
            UIFactory.Stretch(shapes);
            rainMask = UIFactory.Rect("Rain", stage);
            rainMask.gameObject.AddComponent<RectMask2D>();
            for (int i = 0; i < 28; i++)
            {
                var d = UIFactory.Image("Drop", rainMask, new Color(1f, 1f, 1f, 0.45f)).rectTransform;
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
                IsPainted = false;
                painting.gameObject.SetActive(false);
                backdrop.gameObject.SetActive(false);
                rainMask.gameObject.SetActive(false);
                raining = false;
                return;
            }
            var tex = LoadArt(loc.image);
            IsPainted = tex != null;
            painting.texture = tex;
            painting.gameObject.SetActive(IsPainted);
            backdrop.texture = tex;
            backdrop.gameObject.SetActive(IsPainted);
            top.color = Theme.Hex(loc.top);
            bottom.color = Theme.Hex(loc.bottom);
            floorImage.color = bottom.color;
            if (!IsPainted) foreach (var s in loc.shapes)
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

        /// <summary>Painted art from Resources/DearMe/Art; null (with a warning) falls back to shapes.</summary>
        public static Texture2D LoadArt(string name)
        {
            if (string.IsNullOrEmpty(name)) return null;
            var tex = Resources.Load<Texture2D>("DearMe/Art/" + name);
            if (tex == null) Debug.LogWarning("[DearMe] Missing art Resources/DearMe/Art/" + name + ".png — using placeholder shapes.");
            return tex;
        }

        void ScatterDrops()
        {
            var size = rainMask.rect.size;
            for (int i = 0; i < drops.Count; i++)
                drops[i].anchoredPosition = new Vector2(Random.Range(0f, Mathf.Max(1f, size.x)), -Random.Range(0f, Mathf.Max(1f, size.y)));
        }

        void Update()
        {
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
