using TMPro;
using UnityEngine;

namespace BGB2
{
    /// <summary>Sizes a nine-sliced Image (fixed corners and ends, stretching middle) to its text, so panels follow the words
    /// instead of stretching the whole sprite. Put this on the object that has the sliced Image; assign the label.</summary>
    [ExecuteAlways]
    public class FitToText : MonoBehaviour
    {
        public TMP_Text label;
        public Vector2 padding = new Vector2(42f, 17f);
        public float minWidth = 0f, maxWidth = 720f, minHeight = 0f;
        public bool extraWidth;                    // add room for a key cap placed left of the label
        public float extra = 0f;

        void LateUpdate()
        {
            if (label == null) return;
            var rt = (RectTransform)transform;
            Vector2 pref = label.GetPreferredValues(label.text, maxWidth - 2f * padding.x, 0f);
            float w = Mathf.Clamp(pref.x + 2f * padding.x + (extraWidth ? extra : 0f), minWidth, maxWidth);
            float h = Mathf.Max(pref.y + 2f * padding.y, minHeight);
            rt.sizeDelta = new Vector2(w, h);
        }
    }
}
