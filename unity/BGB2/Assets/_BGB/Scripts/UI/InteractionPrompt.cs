using System.Collections;
using TMPro;
using UnityEngine;

namespace BGB2
{
    /// <summary>Bottom prompt: shown only in range, fades 0.25 s, disappears instantly when an interaction starts.</summary>
    [RequireComponent(typeof(CanvasGroup))]
    public class InteractionPrompt : MonoBehaviour
    {
        public TMP_Text label;
        public float fadeTime = 0.25f;
        public float riseDistance = 6f;

        CanvasGroup group;
        RectTransform rt;
        Vector2 shownPos;
        bool wantVisible;
        string current;

        void Awake()
        {
            group = GetComponent<CanvasGroup>();
            rt = (RectTransform)transform;
            shownPos = rt.anchoredPosition;
            group.alpha = 0f;
            group.blocksRaycasts = false;
        }

        void Update()
        {
            float target = wantVisible ? 1f : 0f;
            group.alpha = Mathf.MoveTowards(group.alpha, target, Time.unscaledDeltaTime / fadeTime);
            rt.anchoredPosition = shownPos + new Vector2(0f, (1f - group.alpha) * -riseDistance);
        }

        public void Show(string text)
        {
            wantVisible = true;
            if (text != current) { current = text; label.text = text; }
        }

        public void Hide() => wantVisible = false;

        public void HideImmediately()
        {
            wantVisible = false;
            group.alpha = 0f;
            current = null;
        }
    }
}
