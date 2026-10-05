using System;
using System.Collections;
using DearMe.Content;
using DearMe.Settings;
using UnityEngine;
using UnityEngine.UI;

namespace DearMe.UI
{
    /// <summary>
    /// Scene transitions. No portal effects: the screen simply dims (or, for memories,
    /// bleaches toward photo paper), the place changes, and a quiet title may appear.
    /// </summary>
    public class ScreenFader : MonoBehaviour
    {
        Image cover;
        Text titleKo;
        Text titleEn;
        CanvasGroup titleGroup;
        GameSettings settings;
        Coroutine running;

        public static readonly Color Night = Theme.Hex("#0B0E15");

        public bool IsRunning => running != null;

        public void Build(RectTransform parent, Theme theme, GameSettings settings)
        {
            this.settings = settings;
            cover = UIFactory.Image("Fader", parent, Night);
            UIFactory.Stretch(cover.rectTransform);
            cover.raycastTarget = true; // swallows taps during transitions
            var title = UIFactory.Rect("Title", cover.rectTransform);
            UIFactory.Stretch(title);
            titleGroup = title.gameObject.AddComponent<CanvasGroup>();
            UIFactory.Vertical(title.gameObject, 10f, null, TextAnchor.MiddleCenter);
            titleKo = UIFactory.Text("Ko", title, "", theme.Serif, Theme.HeadingSize, Theme.Paper, TextAnchor.MiddleCenter);
            titleEn = UIFactory.Text("En", title, "", theme.Sans, Theme.SmallSize, Theme.WithAlpha(Theme.Paper, 0.6f), TextAnchor.MiddleCenter);
            cover.gameObject.SetActive(false);
        }

        float Scaled(float seconds) => settings.reducedMotion ? Mathf.Min(seconds, 0.12f) : seconds;

        public void Play(TransitionDef t, bool showEnglish, Action atMidpoint, Action done)
        {
            if (running != null) StopCoroutine(running);
            running = StartCoroutine(Run(t, showEnglish, atMidpoint, done));
        }

        IEnumerator Run(TransitionDef t, bool showEnglish, Action atMidpoint, Action done)
        {
            float duration;
            Color color;
            switch (t.style)
            {
                case "cut": duration = 0f; color = Night; break;
                case "slow": duration = 1.2f; color = Night; break;
                case "photo": duration = 1.0f; color = Theme.Cream; break;
                default: duration = 0.5f; color = Night; break;
            }
            bool bright = t.style == "photo";
            titleKo.color = bright ? Theme.Ink : Theme.Paper;
            titleEn.color = bright ? Theme.WithAlpha(Theme.Ink, 0.6f) : Theme.WithAlpha(Theme.Paper, 0.6f);

            cover.gameObject.SetActive(true);
            titleGroup.alpha = 0f;
            yield return Fade(color, 0f, 1f, Scaled(duration));
            atMidpoint?.Invoke();

            if (!string.IsNullOrEmpty(t.titleKo))
            {
                titleKo.text = t.titleKo;
                titleEn.text = showEnglish ? t.titleEn : "";
                yield return FadeGroup(0f, 1f, Scaled(0.5f));
                yield return Wait(settings.reducedMotion ? 1.2f : 1.6f);
                yield return FadeGroup(1f, 0f, Scaled(0.5f));
            }
            else yield return Wait(Scaled(0.2f));

            yield return Fade(color, 1f, 0f, Scaled(duration));
            cover.gameObject.SetActive(false);
            running = null;
            done?.Invoke();
        }

        /// <summary>Immediately covers the screen (used while returning to the title).</summary>
        public void Cut(bool on)
        {
            if (running != null) { StopCoroutine(running); running = null; }
            cover.color = Night;
            titleGroup.alpha = 0f;
            cover.gameObject.SetActive(on);
        }

        IEnumerator Fade(Color c, float from, float to, float seconds)
        {
            float t = 0f;
            while (t < seconds)
            {
                t += Mathf.Min(Time.unscaledDeltaTime, 0.1f);
                c.a = Mathf.Lerp(from, to, Mathf.SmoothStep(0f, 1f, t / seconds));
                cover.color = c;
                yield return null;
            }
            c.a = to;
            cover.color = c;
        }

        IEnumerator FadeGroup(float from, float to, float seconds)
        {
            float t = 0f;
            while (t < seconds)
            {
                t += Mathf.Min(Time.unscaledDeltaTime, 0.1f);
                titleGroup.alpha = Mathf.Lerp(from, to, t / seconds);
                yield return null;
            }
            titleGroup.alpha = to;
        }

        static IEnumerator Wait(float seconds)
        {
            float t = 0f;
            while (t < seconds)
            {
                t += Mathf.Min(Time.unscaledDeltaTime, 0.1f);
                yield return null;
            }
        }
    }

    /// <summary>The quiet "기억이 바뀌었다 · Memory updated" notice. Never a flashy popup.</summary>
    public class MemoryToast : MonoBehaviour
    {
        Text text;
        CanvasGroup group;
        GameSettings settings;
        Coroutine running;

        public void Build(RectTransform parent, Theme theme, GameSettings settings)
        {
            this.settings = settings;
            var rt = UIFactory.Rect("Toast", parent);
            rt.anchorMin = rt.anchorMax = new Vector2(0.5f, 1f);
            rt.pivot = new Vector2(0.5f, 1f);
            rt.anchoredPosition = new Vector2(0f, -Theme.Gutter - 8f);
            rt.sizeDelta = new Vector2(700f, 40f);
            group = rt.gameObject.AddComponent<CanvasGroup>();
            group.blocksRaycasts = false;
            var bg = rt.gameObject.AddComponent<Image>();
            bg.color = Theme.WithAlpha(Theme.Navy, 0.6f);
            bg.raycastTarget = false;
            text = UIFactory.Text("Text", rt, "", theme.Sans, Theme.SmallSize, Theme.WithAlpha(Theme.Paper, 0.9f), TextAnchor.MiddleCenter, wrap: false);
            UIFactory.Stretch(text.rectTransform);
            group.alpha = 0f;
        }

        public void Show(string message)
        {
            if (running != null) StopCoroutine(running);
            running = StartCoroutine(Run(message));
        }

        IEnumerator Run(string message)
        {
            text.text = message;
            float fade = settings.reducedMotion ? 0f : 0.5f;
            for (float t = 0; t < fade; t += Time.unscaledDeltaTime) { group.alpha = t / fade; yield return null; }
            group.alpha = 1f;
            for (float t = 0; t < 2.4f; t += Time.unscaledDeltaTime) yield return null;
            for (float t = 0; t < fade; t += Time.unscaledDeltaTime) { group.alpha = 1f - t / fade; yield return null; }
            group.alpha = 0f;
            running = null;
        }
    }
}
