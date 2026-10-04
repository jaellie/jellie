// SliceUI.cs — everything on screen that isn't the world.
//
// Built from code (no prefabs to wire up). Restrained and editorial:
//   - a low, soft band at the bottom for words, only while someone is speaking
//   - speaker name in small green capitals, text in a serif
//   - numbered choices, clickable or keys 1-9
//   - a small clock in the corner (the clock is part of the story)
//   - title + chapter card + fades
// Korean works out of the box: fonts come from the operating system
// (Georgia / Malgun Gothic / Apple SD Gothic Neo ...), no font import needed.
using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

namespace BigGreenBear
{
    public class SliceUI : MonoBehaviour
    {
        public static bool ReducedMotion;

        static readonly Color Cream = new Color(0.953f, 0.922f, 0.867f);
        static readonly Color Green = new Color(0.62f, 0.78f, 0.62f);
        static readonly Color Faint = new Color(0.953f, 0.922f, 0.867f, 0.55f);

        Font serif, mono;
        Canvas canvas;
        Image band;
        Text speaker, body, echo, prompt, clock, chapterHud, hint, cont;
        RectTransform choiceBox;
        readonly List<Button> choiceButtons = new List<Button>();
        CanvasGroup fade, titleGroup, cardGroup;
        Text titleText, subtitleText, pressText, cardLabel, cardTitle;
        Button catcher;

        public event Action OnAdvance;
        public event Action<int> OnChoose;

        Coroutine typing;
        string fullText = "";
        public bool IsTyping { get; private set; }
        float bandAlpha, bandTarget;
        float clockGlitch;
        string clockReal = "", clockShown = "";
        bool clockStuck;
        string lang = "en";

        public void Init()
        {
            serif = Font.CreateDynamicFontFromOSFont(new[] { "Georgia", "Palatino Linotype", "Book Antiqua", "Malgun Gothic", "Apple SD Gothic Neo", "AppleSDGothicNeo-Regular", "Noto Serif CJK KR", "Noto Sans CJK KR", "Arial" }, 40);
            mono = Font.CreateDynamicFontFromOSFont(new[] { "Consolas", "Menlo", "Courier New", "Malgun Gothic", "Arial" }, 28);
            var builtin = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            if (serif == null) serif = builtin;
            if (mono == null) mono = serif;

            if (FindFirstObjectByType<EventSystem>() == null)
            {
                var es = new GameObject("EventSystem");
                es.AddComponent<EventSystem>();
#if ENABLE_INPUT_SYSTEM
                es.AddComponent<UnityEngine.InputSystem.UI.InputSystemUIInputModule>();
#else
                es.AddComponent<StandaloneInputModule>();
#endif
            }

            var cgo = new GameObject("SliceCanvas");
            cgo.transform.SetParent(transform, false);
            canvas = cgo.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvas.sortingOrder = 100;
            var scaler = cgo.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920, 1080);
            scaler.matchWidthOrHeight = 0.5f;
            cgo.AddComponent<GraphicRaycaster>();
            var root = cgo.GetComponent<RectTransform>();

            // Click anywhere to continue (sits behind the choices).
            var cat = NewRect("ClickToContinue", root, Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero);
            var catImg = cat.gameObject.AddComponent<Image>();
            catImg.color = new Color(0, 0, 0, 0);
            catcher = cat.gameObject.AddComponent<Button>();
            catcher.transition = Selectable.Transition.None;
            catcher.onClick.AddListener(() => OnAdvance?.Invoke());

            // The word band: a soft, low strip. Not a chat bubble.
            var b = NewRect("Band", root, new Vector2(0, 0), new Vector2(1, 0), new Vector2(0, 0), new Vector2(0, 330));
            band = b.gameObject.AddComponent<Image>();
            band.color = new Color(0.05f, 0.06f, 0.08f, 0f);
            band.raycastTarget = false;

            speaker = NewText("Speaker", root, new Vector2(0.5f, 0), new Vector2(0.5f, 0), new Vector2(-640, 236), new Vector2(1280, 40), 24, Green, TextAnchor.UpperLeft);
            echo = NewText("Echo", root, new Vector2(0.5f, 0), new Vector2(0.5f, 0), new Vector2(-632, 70), new Vector2(1280, 160), 38, new Color(Cream.r, Cream.g, Cream.b, 0f), TextAnchor.UpperLeft);
            body = NewText("Body", root, new Vector2(0.5f, 0), new Vector2(0.5f, 0), new Vector2(-640, 60), new Vector2(1280, 170), 38, Cream, TextAnchor.UpperLeft);
            body.lineSpacing = 1.15f;
            echo.lineSpacing = 1.15f;
            cont = NewText("ContinueMark", root, new Vector2(0.5f, 0), new Vector2(0.5f, 0), new Vector2(600, 40), new Vector2(60, 40), 28, Faint, TextAnchor.MiddleRight);
            cont.text = "▸";
            prompt = NewText("Prompt", root, new Vector2(0.5f, 0), new Vector2(0.5f, 0), new Vector2(-640, 236), new Vector2(1280, 40), 24, Faint, TextAnchor.UpperLeft);

            choiceBox = NewRect("Choices", root, new Vector2(0.5f, 0), new Vector2(0.5f, 0), new Vector2(-640, 40), new Vector2(1280, 190));

            clock = NewText("Clock", root, new Vector2(1, 1), new Vector2(1, 1), new Vector2(-340, -70), new Vector2(300, 40), 26, Faint, TextAnchor.UpperRight);
            clock.font = mono;
            chapterHud = NewText("ChapterHud", root, new Vector2(0, 1), new Vector2(0, 1), new Vector2(40, -70), new Vector2(700, 40), 20, Faint, TextAnchor.UpperLeft);
            hint = NewText("Controls", root, new Vector2(0, 0), new Vector2(0, 0), new Vector2(40, 14), new Vector2(1400, 30), 17, new Color(Cream.r, Cream.g, Cream.b, 0.35f), TextAnchor.LowerLeft);

            // Title + chapter card + fade, on top of everything.
            titleGroup = NewGroup("Title", root);
            titleText = NewText("GameTitle", (RectTransform)titleGroup.transform, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(-900, 40), new Vector2(1800, 110), 74, Cream, TextAnchor.MiddleCenter);
            subtitleText = NewText("Subtitle", (RectTransform)titleGroup.transform, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(-900, -20), new Vector2(1800, 50), 26, Green, TextAnchor.MiddleCenter);
            subtitleText.fontStyle = FontStyle.Italic;
            pressText = NewText("Press", (RectTransform)titleGroup.transform, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(-900, -190), new Vector2(1800, 40), 24, Faint, TextAnchor.MiddleCenter);

            fade = NewGroup("Fade", root);
            var fadeImg = fade.gameObject.AddComponent<Image>();
            fadeImg.color = new Color(0.03f, 0.035f, 0.045f, 1f);
            fadeImg.raycastTarget = false;
            fade.alpha = 1f;

            cardGroup = NewGroup("ChapterCard", root);
            cardLabel = NewText("Label", (RectTransform)cardGroup.transform, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(-900, 40), new Vector2(1800, 40), 22, Faint, TextAnchor.MiddleCenter);
            cardTitle = NewText("Title", (RectTransform)cardGroup.transform, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(-900, -40), new Vector2(1800, 90), 58, Cream, TextAnchor.MiddleCenter);
            cardGroup.alpha = 0f;
            titleGroup.alpha = 0f;
        }

        /* ---------------- builders ---------------- */

        static RectTransform NewRect(string name, RectTransform parent, Vector2 aMin, Vector2 aMax, Vector2 pos, Vector2 size)
        {
            var go = new GameObject(name, typeof(RectTransform));
            var rt = (RectTransform)go.transform;
            rt.SetParent(parent, false);
            rt.anchorMin = aMin;
            rt.anchorMax = aMax;
            rt.pivot = new Vector2(0, 0);
            rt.anchoredPosition = pos;
            rt.sizeDelta = size;
            return rt;
        }

        Text NewText(string name, RectTransform parent, Vector2 aMin, Vector2 aMax, Vector2 pos, Vector2 size, int fontSize, Color c, TextAnchor align)
        {
            var rt = NewRect(name, parent, aMin, aMax, pos, size);
            var t = rt.gameObject.AddComponent<Text>();
            t.font = serif;
            t.fontSize = fontSize;
            t.color = c;
            t.alignment = align;
            t.horizontalOverflow = HorizontalWrapMode.Wrap;
            t.verticalOverflow = VerticalWrapMode.Overflow;
            t.raycastTarget = false;
            return t;
        }

        CanvasGroup NewGroup(string name, RectTransform parent)
        {
            var rt = NewRect(name, parent, Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero);
            var g = rt.gameObject.AddComponent<CanvasGroup>();
            g.blocksRaycasts = false;
            g.interactable = false;
            return g;
        }

        /* ---------------- dialogue ---------------- */

        public void SetLanguage(string l) => lang = l;

        public void ShowLine(string speakerName, string text, bool narration, bool echoLine)
        {
            ClearChoices();
            prompt.text = "";
            speaker.text = string.IsNullOrEmpty(speakerName) ? "" : speakerName.ToUpperInvariant();
            body.fontStyle = narration ? FontStyle.Italic : FontStyle.Normal;
            body.color = narration ? new Color(Cream.r * 0.9f, Cream.g * 0.9f, Cream.b * 0.9f) : Cream;
            echo.fontStyle = body.fontStyle;
            echo.text = text;
            echo.color = new Color(Cream.r, Cream.g, Cream.b, echoLine ? 0.2f : 0f);
            fullText = text;
            bandTarget = 0.62f;
            if (typing != null) StopCoroutine(typing);
            typing = StartCoroutine(Type(text));
            catcher.gameObject.SetActive(true);
        }

        IEnumerator Type(string text)
        {
            IsTyping = true;
            cont.enabled = false;
            const float cps = 42f;
            for (int i = 1; i <= text.Length; i++)
            {
                body.text = text.Substring(0, i);
                yield return new WaitForSeconds(1f / cps);
            }
            FinishTyping();
        }

        public void FinishTyping()
        {
            if (typing != null) StopCoroutine(typing);
            typing = null;
            body.text = fullText;
            IsTyping = false;
            cont.enabled = true;
        }

        public void ShowChoices(string promptText, List<string> labels)
        {
            if (typing != null) StopCoroutine(typing);
            IsTyping = false;
            cont.enabled = false;
            speaker.text = "";
            body.text = "";
            echo.text = "";
            prompt.text = promptText;
            bandTarget = 0.62f;
            ClearChoices();
            catcher.gameObject.SetActive(false);
            for (int i = 0; i < labels.Count; i++)
            {
                int index = i;
                var rt = NewRect("Choice" + i, choiceBox, new Vector2(0, 1), new Vector2(0, 1), new Vector2(0, -44 - i * 46), new Vector2(1100, 42));
                var img = rt.gameObject.AddComponent<Image>();
                img.color = new Color(1, 1, 1, 0f);
                var btn = rt.gameObject.AddComponent<Button>();
                var colors = btn.colors;
                colors.normalColor = new Color(1, 1, 1, 0f);
                colors.highlightedColor = new Color(1, 1, 1, 0.08f);
                colors.selectedColor = new Color(1, 1, 1, 0.08f);
                colors.pressedColor = new Color(1, 1, 1, 0.14f);
                btn.colors = colors;
                btn.onClick.AddListener(() => OnChoose?.Invoke(index));
                var t = NewText("Label", rt, Vector2.zero, Vector2.one, new Vector2(12, 0), Vector2.zero, 32, Cream, TextAnchor.MiddleLeft);
                ((RectTransform)t.transform).sizeDelta = new Vector2(-12, 0);
                t.text = (i + 1) + ".   " + labels[i];
                choiceButtons.Add(btn);
            }
        }

        void ClearChoices()
        {
            foreach (var b in choiceButtons) if (b != null) Destroy(b.gameObject);
            choiceButtons.Clear();
        }

        public void HideWords()
        {
            if (typing != null) StopCoroutine(typing);
            IsTyping = false;
            ClearChoices();
            speaker.text = body.text = echo.text = prompt.text = "";
            cont.enabled = false;
            bandTarget = 0f;
        }

        /* ---------------- clock / hud ---------------- */

        public void SetClock(string hhmm)
        {
            clockReal = hhmm;
        }

        // While stuck, the HUD shows 11:47 instead of the real time.
        public void SetClockStuck(bool stuck)
        {
            clockStuck = stuck;
            if (stuck) clockGlitch = 2.4f;
        }

        public static string Format(string hhmm, string lang)
        {
            if (string.IsNullOrEmpty(hhmm)) return "";
            var p = hhmm.Split(':');
            if (p.Length < 2 || !int.TryParse(p[0], out int h)) return hhmm;
            bool pm = h >= 12;
            int h12 = h % 12 == 0 ? 12 : h % 12;
            string t = h12 + ":" + p[1];
            return lang == "ko" ? (pm ? "오후 " : "오전 ") + t : t + (pm ? " PM" : " AM");
        }

        public void SetChapterHud(string s) => chapterHud.text = s;
        public void SetHint(string s) => hint.text = s;
        public void SetHudVisible(bool on)
        {
            clock.enabled = on;
            chapterHud.enabled = on;
        }

        /* ---------------- title / card / fade ---------------- */

        public void SetTitle(string title, string subtitle, string press)
        {
            titleText.text = title;
            subtitleText.text = subtitle;
            pressText.text = press;
        }

        public IEnumerator FadeGroup(string which, float to, float seconds)
        {
            CanvasGroup g = which == "title" ? titleGroup : which == "card" ? cardGroup : fade;
            float from = g.alpha;
            if (seconds <= 0f) { g.alpha = to; yield break; }
            for (float t = 0; t < seconds; t += Time.deltaTime)
            {
                g.alpha = Mathf.Lerp(from, to, Mathf.SmoothStep(0, 1, t / seconds));
                yield return null;
            }
            g.alpha = to;
        }

        public void SetCard(string label, string title)
        {
            cardLabel.text = label;
            cardTitle.text = title;
        }

        public void SetCatcher(bool on) => catcher.gameObject.SetActive(on);

        void Update()
        {
            bandAlpha = Mathf.MoveTowards(bandAlpha, bandTarget, Time.deltaTime * 1.4f);
            band.color = new Color(0.05f, 0.06f, 0.08f, bandAlpha);

            // continue mark: a slow pulse (still if motion is reduced)
            if (cont.enabled)
                cont.color = new Color(Faint.r, Faint.g, Faint.b, ReducedMotion ? 0.55f : 0.3f + 0.3f * Mathf.Abs(Mathf.Sin(Time.time * 2f)));

            // the clock: real time, unless memory has stuck it at 11:47
            string want = clockStuck ? "23:47" : clockReal;
            if (clockGlitch > 0f)
            {
                clockGlitch -= Time.deltaTime;
                // the 11:47 arrives with two soft blinks, then simply stays
                bool hidden = !ReducedMotion && clockGlitch > 1.6f && Mathf.Repeat(clockGlitch, 0.4f) < 0.16f;
                clock.color = new Color(Cream.r, Cream.g, Cream.b, hidden ? 0.12f : 0.85f);
            }
            else clock.color = clockStuck ? new Color(Cream.r, Cream.g, Cream.b, 0.85f) : Faint;
            string shown = Format(want, lang) + (clockStuck ? "  ·" : "");
            if (shown != clockShown)
            {
                clockShown = shown;
                clock.text = shown;
            }
        }
    }
}
