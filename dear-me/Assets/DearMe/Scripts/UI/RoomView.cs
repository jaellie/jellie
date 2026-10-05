using System;
using System.Collections.Generic;
using DearMe.Content;
using DearMe.Input;
using DearMe.Platform;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

namespace DearMe.UI
{
    /// <summary>
    /// One inspectable object: a small diamond marks it, the outline and label appear on hover
    /// (desktop) or while the finger is down (touch), so a phone screen never fills up with labels.
    /// </summary>
    public class RoomHotspot : MonoBehaviour, IPointerEnterHandler, IPointerExitHandler, IPointerClickHandler
    {
        public RoomObjectDef def;
        public RoomView owner;
        public Image fill;
        public Image[] edges;
        public GameObject label;
        public Image marker;
        public bool visited;
        /// <summary>Over a painting: no outline until hovered, so the art isn't boxed in.</summary>
        public bool quiet;
        bool hover;

        float pulse;

        public void OnPointerEnter(PointerEventData e) { hover = true; Refresh(); }
        public void OnPointerExit(PointerEventData e) { hover = false; Refresh(); }
        public void OnPointerClick(PointerEventData e) => owner.Inspect(this);

        public void Refresh()
        {
            float edgeAlpha = hover ? 0.85f : quiet ? 0f : visited ? 0.18f : 0.38f;
            foreach (var e in edges) e.color = Theme.WithAlpha(Theme.Paper, edgeAlpha);
            label.SetActive(hover);
        }

        void Update()
        {
            if (marker == null) return;
            // A slow shimmer on things not yet looked at; visited ones stay faint and still.
            pulse += Time.unscaledDeltaTime;
            float a = visited ? 0.35f : 0.55f + 0.35f * Mathf.Sin(pulse * 2.2f);
            if (owner.ReducedMotion) a = visited ? 0.35f : 0.8f;
            marker.color = Theme.WithAlpha(Theme.Paper, a);
        }
    }

    /// <summary>Exploration: shows the room's objects over the background stage.</summary>
    public class RoomView : MonoBehaviour
    {
        RectTransform layer;
        Text hint;
        Theme theme;
        InputGate gate;
        Action<RoomObjectDef> onInspect;
        public bool ReducedMotion;
        readonly HashSet<string> visited = new HashSet<string>();

        public void Build(RectTransform stage, RectTransform hudRoot, Theme theme, InputGate gate)
        {
            this.theme = theme;
            this.gate = gate;
            layer = UIFactory.Rect("RoomObjects", stage);
            UIFactory.Stretch(layer);
            hint = UIFactory.Text("ExploreHint", hudRoot, "", theme.Body, Theme.SmallSize, Theme.WithAlpha(Theme.Paper, 0.85f), TextAnchor.UpperLeft, wrap: false);
            var rt = hint.rectTransform;
            rt.anchorMin = rt.anchorMax = new Vector2(0f, 1f);
            rt.pivot = new Vector2(0f, 1f);
            rt.anchoredPosition = new Vector2(Theme.Gutter + 8f, -Theme.Gutter - 8f);
            rt.sizeDelta = new Vector2(600f, 40f);
            layer.gameObject.SetActive(false);
            hint.gameObject.SetActive(false);
        }

        public void Show(RoomDef room, IList<RoomObjectDef> objects, IEnumerable<string> inspected, Action<RoomObjectDef> inspect,
            bool painted = false)
        {
            UIFactory.DestroyChildren(layer);
            visited.Clear();
            foreach (var id in inspected) visited.Add(id);
            onInspect = inspect;

            foreach (var o in objects)
            {
                var rt = UIFactory.Rect("Object_" + o.id, layer);
                UIFactory.PlaceNormalized(rt, o.x, o.y, o.w, o.h);
                // Small objects get a solid placeholder shape; large ones (window, desk, box) just a tint
                // over the shape already painted in the background.
                bool small = o.w * o.h < 0.03f;
                var fill = rt.gameObject.AddComponent<Image>();
                // Painted rooms already show the object; the hotspot is an invisible hit area.
                fill.color = painted ? Theme.Clear : Theme.WithAlpha(Theme.Hex(o.color), small ? 0.92f : 0.12f);
                fill.raycastTarget = true;
                var sprite = BackgroundView.LoadArt(o.image);
                if (sprite != null)
                {
                    fill.color = Theme.Clear;
                    var art = UIFactory.Rect("Art", rt).gameObject.AddComponent<RawImage>();
                    art.texture = sprite;
                    art.raycastTarget = false;
                    UIFactory.Stretch(art.rectTransform);
                }
                UIFactory.Border(rt, Theme.Paper, 2f);

                var label = UIFactory.Rect("Label", rt);
                label.anchorMin = label.anchorMax = new Vector2(0.5f, 1f);
                label.pivot = new Vector2(0.5f, 0f);
                label.anchoredPosition = new Vector2(0f, 8f);
                var lbg = label.gameObject.AddComponent<Image>();
                lbg.color = Theme.WithAlpha(Theme.Navy, 0.85f);
                lbg.raycastTarget = false;
                UIFactory.Horizontal(label.gameObject, 6f, new RectOffset(10, 10, 4, 4), TextAnchor.MiddleCenter);
                var fit = label.gameObject.AddComponent<ContentSizeFitter>();
                fit.horizontalFit = ContentSizeFitter.FitMode.PreferredSize;
                fit.verticalFit = ContentSizeFitter.FitMode.PreferredSize;
                UIFactory.Text("Name", label, o.labelKo, theme.Body, Theme.TinySize, Theme.Paper, TextAnchor.MiddleCenter, wrap: false);
                UIFactory.Text("Verb", label, "· " + o.verbKo + "  " + o.verbEn, theme.Body, Theme.TinySize - 2, Theme.WithAlpha(Theme.Paper, 0.7f), TextAnchor.MiddleCenter, wrap: false);

                var marker = UIFactory.Image("Marker", rt, Theme.Paper);
                marker.gameObject.AddComponent<LayoutElement>().ignoreLayout = true;
                var mrt = marker.rectTransform;
                mrt.anchorMin = mrt.anchorMax = new Vector2(0.5f, 0.5f);
                mrt.sizeDelta = new Vector2(14f, 14f);
                mrt.localRotation = Quaternion.Euler(0f, 0f, 45f);

                var hs = rt.gameObject.AddComponent<RoomHotspot>();
                hs.marker = marker;
                hs.def = o;
                hs.owner = this;
                hs.fill = fill;
                hs.label = label.gameObject;
                hs.visited = visited.Contains(o.id);
                hs.quiet = painted;
                var edges = new List<Image>();
                foreach (Transform child in rt)
                    if (child.name.StartsWith("Border")) edges.Add(child.GetComponent<Image>());
                hs.edges = edges.ToArray();
                hs.Refresh();
            }

            hint.text = room.hintKo;
            hint.gameObject.SetActive(room.hintKo.Length > 0);
            layer.gameObject.SetActive(true);
            gate.SetState(InputState.Idle);
        }

        public void Inspect(RoomHotspot hs)
        {
            if (onInspect == null) return;
            if (!gate.TryConsume(GameAction.Interact, Time.unscaledTimeAsDouble, Time.frameCount)) return;
            var cb = onInspect;
            Hide();
            cb(hs.def);
        }

        public void Hide()
        {
            onInspect = null;
            if (layer != null)
            {
                UIFactory.DestroyChildren(layer);
                layer.gameObject.SetActive(false);
            }
            if (hint != null) hint.gameObject.SetActive(false);
        }
    }
}
