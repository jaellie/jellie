using UnityEngine;

namespace DearMe.UI
{
    /// <summary>Keeps a centered panel at min(maxWidth, parent width − 2·margin) as the window resizes.</summary>
    public class MaxWidthFitter : MonoBehaviour
    {
        public float maxWidth = 1100f;
        public float margin = 24f;

        void LateUpdate()
        {
            var rt = (RectTransform)transform;
            var parent = rt.parent as RectTransform;
            if (parent == null) return;
            float w = Mathf.Max(100f, Mathf.Min(maxWidth, parent.rect.width - 2f * margin));
            if (Mathf.Abs(rt.sizeDelta.x - w) > 0.5f) rt.sizeDelta = new Vector2(w, rt.sizeDelta.y);
        }
    }

    /// <summary>Caps a panel's height to its parent (minus margins) so long content scrolls instead of overflowing.</summary>
    public class MaxHeightFitter : MonoBehaviour
    {
        public float margin = 24f;
        public RectTransform content;
        public float chrome; // header + footer heights around the scrolling content

        void LateUpdate()
        {
            var rt = (RectTransform)transform;
            var parent = rt.parent as RectTransform;
            if (parent == null || content == null) return;
            float maxH = parent.rect.height - 2f * margin;
            float wanted = content.rect.height + chrome;
            float h = Mathf.Max(120f, Mathf.Min(maxH, wanted));
            if (Mathf.Abs(rt.sizeDelta.y - h) > 0.5f) rt.sizeDelta = new Vector2(rt.sizeDelta.x, h);
        }
    }
}
