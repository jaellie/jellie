using System.Collections.Generic;
using DearMe.Language;
using UnityEngine;
using UnityEngine.UI;

namespace DearMe.UI
{
    /// <summary>
    /// The small help card. Lives on its own overlay canvas, never receives raycasts (so it
    /// can't block play) and never changes the layout underneath. Positioned above the token,
    /// flipped below when needed, clamped to the safe area, and kept off registered areas
    /// such as the choice list.
    /// </summary>
    public class TooltipView : MonoBehaviour
    {
        RectTransform canvasRect;
        RectTransform panel;
        Text title;
        Text meaning;
        Text note;
        Text sentence;
        Image accentLine;
        CanvasGroup group;

        const float Pad = 16f;
        const float Gap = 10f;
        const float Margin = 12f;
        const float MaxWidth = 520f;

        public void Build(RectTransform canvasRect, Theme theme)
        {
            this.canvasRect = canvasRect;
            panel = UIFactory.Rect("Tooltip", canvasRect);
            panel.anchorMin = panel.anchorMax = new Vector2(0.5f, 0.5f);
            panel.pivot = new Vector2(0f, 1f);
            var bg = panel.gameObject.AddComponent<Image>();
            bg.color = Theme.WithAlpha(Theme.Navy, 0.97f);
            bg.raycastTarget = false;
            group = panel.gameObject.AddComponent<CanvasGroup>();
            group.blocksRaycasts = false;
            group.interactable = false;

            accentLine = UIFactory.Image("Accent", panel, Theme.Accent);
            title = UIFactory.Text("Title", panel, "", theme.Body, Theme.SmallSize + 2, Theme.Paper);
            meaning = UIFactory.Text("Meaning", panel, "", theme.Body, Theme.SmallSize, Theme.Paper);
            note = UIFactory.Text("Note", panel, "", theme.Body, Theme.TinySize, Theme.WithAlpha(Theme.Paper, 0.72f));
            sentence = UIFactory.Text("Sentence", panel, "", theme.Body, Theme.SmallSize, Theme.Paper);
            foreach (var t in new[] { title, meaning, note, sentence })
            {
                t.rectTransform.anchorMin = t.rectTransform.anchorMax = new Vector2(0f, 1f);
                t.rectTransform.pivot = new Vector2(0f, 1f);
            }
            var al = accentLine.rectTransform;
            al.anchorMin = new Vector2(0, 1);
            al.anchorMax = new Vector2(1, 1);
            al.pivot = new Vector2(0.5f, 1f);
            al.offsetMin = new Vector2(0, -2);
            al.offsetMax = Vector2.zero;
            panel.gameObject.SetActive(false);
        }

        public void Show(TooltipContent content, RectTransform target, List<RectTransform> avoid)
        {
            panel.gameObject.SetActive(true);
            title.text = content.title;
            meaning.text = content.meaning;
            note.text = content.note;
            sentence.text = content.sentence;
            Layout();
            Reposition(target, avoid);
        }

        public void Hide()
        {
            if (panel != null) panel.gameObject.SetActive(false);
        }

        void Layout()
        {
            float canvasW = canvasRect.rect.width;
            float maxInner = Mathf.Min(MaxWidth, canvasW - 2 * Margin) - 2 * Pad;
            float widest = 0f;
            var parts = new[] { title, meaning, note, sentence };
            foreach (var t in parts)
            {
                t.gameObject.SetActive(t.text.Length > 0);
                if (t.text.Length > 0) widest = Mathf.Max(widest, UIFactory.PreferredWidth(t));
            }
            float inner = Mathf.Clamp(widest + 1f, 60f, Mathf.Max(60f, maxInner));
            float y = -Pad;
            bool first = true;
            foreach (var t in parts)
            {
                if (t.text.Length == 0) continue;
                if (!first) y -= t == sentence ? 10f : 4f;
                first = false;
                float h = UIFactory.PreferredHeight(t, inner);
                t.rectTransform.sizeDelta = new Vector2(inner, h);
                t.rectTransform.anchoredPosition = new Vector2(Pad, y);
                y -= h;
            }
            panel.sizeDelta = new Vector2(inner + 2 * Pad, -y + Pad);
        }

        public void Reposition(RectTransform target, List<RectTransform> avoid)
        {
            if (target == null || !panel.gameObject.activeSelf) return;
            Rect safe = ToLocal(Screen.safeArea);
            Rect anchor = ToLocal(UIFactory.ScreenRect(target));
            Vector2 size = panel.sizeDelta;

            float x = Mathf.Clamp(anchor.center.x - size.x * 0.5f, safe.xMin + Margin, Mathf.Max(safe.xMin + Margin, safe.xMax - Margin - size.x));
            // Panel pivot is top-left: y is the top edge.
            float above = anchor.yMax + Gap + size.y;
            float below = anchor.yMin - Gap;
            var candidates = new[] { above, below };

            float bestY = above;
            float bestScore = float.MaxValue;
            foreach (float top in candidates)
            {
                float clampedTop = Mathf.Clamp(top, safe.yMin + Margin + size.y, safe.yMax - Margin);
                var r = new Rect(x, clampedTop - size.y, size.x, size.y);
                float score = Overlap(r, anchor) * 4f + (Mathf.Abs(clampedTop - top) > 0.5f ? 1f : 0f);
                foreach (var a in avoid)
                    if (a != null && a.gameObject.activeInHierarchy && !target.IsChildOf(a))
                        score += Overlap(r, ToLocal(UIFactory.ScreenRect(a)));
                if (score < bestScore)
                {
                    bestScore = score;
                    bestY = clampedTop;
                }
            }
            panel.anchoredPosition = new Vector2(x, bestY);
        }

        static float Overlap(Rect a, Rect b)
        {
            float w = Mathf.Min(a.xMax, b.xMax) - Mathf.Max(a.xMin, b.xMin);
            float h = Mathf.Min(a.yMax, b.yMax) - Mathf.Max(a.yMin, b.yMin);
            return w > 0 && h > 0 ? w * h : 0f;
        }

        /// <summary>Screen pixels → canvas-local units (canvas pivot is its center).</summary>
        Rect ToLocal(Rect screen)
        {
            RectTransformUtility.ScreenPointToLocalPointInRectangle(canvasRect, screen.min, null, out var min);
            RectTransformUtility.ScreenPointToLocalPointInRectangle(canvasRect, screen.max, null, out var max);
            return Rect.MinMaxRect(min.x, min.y, max.x, max.y);
        }
    }
}
