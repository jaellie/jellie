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
        public static readonly Color Green = new Color(0.62f, 0.78f, 0.62f);
        static readonly Color Travel = new Color(0.93f, 0.80f, 0.55f);   // "→ place" choices
        static readonly Color Ink = new Color(0.12f, 0.13f, 0.18f);       // words printed on cream paper
        Color bandTint;
        static readonly Color Faint = new Color(0.953f, 0.922f, 0.867f, 0.55f);

        Font serif, mono, bold;
        Canvas canvas;
        Image band;
        Text speaker, body, echo, prompt, clock, chapterHud, hint, cont;
        RectTransform choiceBox;
        RectTransform frame;
        readonly List<Button> choiceButtons = new List<Button>();
        readonly List<Image> choiceHighlights = new List<Image>();
        readonly List<Image> dots = new List<Image>();
        Text hoverLabel;
        Sprite dotSprite;
        // notebook, toast, water
        CanvasGroup notebookGroup;
        Text notebookTitle, notebookBody, notebookButton, toast;
        RectTransform water;
        Image waterImg;
        float waterLevel, waterTarget, toastTime;
        public bool NotebookOpen { get; private set; }
        public event Action OnNotebookToggle;
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
            // A font file dropped into Resources/BGB/Fonts wins (needed for Web builds,
            // which cannot use the computer's own fonts). Otherwise use OS fonts.
            var bundled = Resources.LoadAll<Font>("BGB/Fonts");
            if (bundled != null && bundled.Length > 0) serif = bundled[0];
            else serif = Font.CreateDynamicFontFromOSFont(new[] { "Georgia", "Palatino Linotype", "Book Antiqua", "Malgun Gothic", "Apple SD Gothic Neo", "AppleSDGothicNeo-Regular", "Noto Serif CJK KR", "Noto Sans CJK KR", "Arial" }, 40);
            mono = (bundled != null && bundled.Length > 0) ? serif : Font.CreateDynamicFontFromOSFont(new[] { "Consolas", "Menlo", "Courier New", "Malgun Gothic", "Arial" }, 28);
            var boldFonts = Resources.LoadAll<Font>("BGB/FontsBold");
            bold = (boldFonts != null && boldFonts.Length > 0) ? boldFonts[0] : null;
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
            var screenRoot = cgo.GetComponent<RectTransform>();

            // Click anywhere to continue (sits behind the choices).
            var cat = NewRect("ClickToContinue", screenRoot, Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero);
            var catImg = cat.gameObject.AddComponent<Image>();
            catImg.color = new Color(0, 0, 0, 0);
            catcher = cat.gameObject.AddComponent<Button>();
            catcher.transition = Selectable.Transition.None;
            catcher.onClick.AddListener(() => OnAdvance?.Invoke());

            // The 16:9 frame. Whatever the window shape (desktop, browser, phone),
            // the game is shown inside a 16:9 frame with black bars around it.
            var root = NewRect("Frame16x9", screenRoot, Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero);
            root.pivot = new Vector2(0.5f, 0.5f);
            frame = root;
            var fitter = root.gameObject.AddComponent<AspectRatioFitter>();
            fitter.aspectMode = AspectRatioFitter.AspectMode.FitInParent;
            fitter.aspectRatio = 16f / 9f;
            Bar(root, new Vector2(0, 0), new Vector2(0, 1), new Vector2(1, 0.5f)); // left
            Bar(root, new Vector2(1, 0), new Vector2(1, 1), new Vector2(0, 0.5f)); // right
            Bar(root, new Vector2(0, 1), new Vector2(1, 1), new Vector2(0.5f, 0)); // top
            Bar(root, new Vector2(0, 0), new Vector2(1, 0), new Vector2(0.5f, 1)); // bottom

            // The word band: a soft, low strip. Not a chat bubble.
            var b = NewRect("Band", root, new Vector2(0, 0), new Vector2(1, 0), new Vector2(0, 0), new Vector2(0, 330));
            band = b.gameObject.AddComponent<Image>();
            band.sprite = UiSprite("ui_paper");
            bandTint = band.sprite != null ? new Color(0.75f, 0.75f, 0.78f) : new Color(0.05f, 0.06f, 0.08f);
            band.color = new Color(bandTint.r, bandTint.g, bandTint.b, 0f);
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

            // Label that appears next to a thing in the world you can click.
            dotSprite = MakeDot();
            hoverLabel = NewText("HoverLabel", root, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(700, 44), 27, Cream, TextAnchor.MiddleCenter);
            ((RectTransform)hoverLabel.transform).pivot = new Vector2(0.5f, 0f);
            var outline = hoverLabel.gameObject.AddComponent<Outline>();
            outline.effectColor = new Color(0f, 0f, 0f, 0.65f);
            outline.effectDistance = new Vector2(2f, -2f);
            hoverLabel.enabled = false;

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

            // Rising water (the flood), drawn over the world but under the words.
            water = NewRect("Water", root, new Vector2(0, 0), new Vector2(1, 0), Vector2.zero, new Vector2(0, 0));
            waterImg = water.gameObject.AddComponent<Image>();
            waterImg.color = new Color(0.05f, 0.15f, 0.16f, 0.62f);
            waterImg.raycastTarget = false;
            water.SetSiblingIndex(4); // just above the bars, below the word band

            // Toast: "noted in the notebook"
            toast = NewText("Toast", root, new Vector2(0.5f, 1), new Vector2(0.5f, 1), new Vector2(-600, -130), new Vector2(1200, 40), 24, Cream, TextAnchor.MiddleCenter);
            toast.gameObject.AddComponent<Outline>().effectColor = new Color(0, 0, 0, 0.6f);
            toast.enabled = false;

            // Notebook button (bottom right) + panel
            notebookButton = NewText("NotebookButton", root, new Vector2(1, 0), new Vector2(1, 0), new Vector2(-260, 10), new Vector2(230, 40), 22, Faint, TextAnchor.LowerRight);
            notebookButton.raycastTarget = true;
            var nbBtn = notebookButton.gameObject.AddComponent<Button>();
            nbBtn.transition = Selectable.Transition.None;
            nbBtn.onClick.AddListener(() => OnNotebookToggle?.Invoke());
            notebookButton.enabled = false;

            notebookGroup = NewGroup("Notebook", root);
            var nbBg = NewRect("Page", (RectTransform)notebookGroup.transform, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(-560, -400), new Vector2(1120, 800));
            var page = nbBg.gameObject.AddComponent<Image>();
            page.sprite = UiSprite("ui_page");
            page.color = page.sprite != null ? Color.white : new Color(0.93f, 0.89f, 0.81f, 0.97f);
            page.raycastTarget = true;
            var pageBtn = nbBg.gameObject.AddComponent<Button>();
            pageBtn.transition = Selectable.Transition.None;
            pageBtn.onClick.AddListener(() => OnNotebookToggle?.Invoke());
            notebookTitle = NewText("Title", nbBg, new Vector2(0, 1), new Vector2(0, 1), new Vector2(140, -90), new Vector2(920, 50), 34, new Color(0.18f, 0.23f, 0.2f), TextAnchor.UpperLeft);
            notebookBody = NewText("Body", nbBg, new Vector2(0, 1), new Vector2(0, 1), new Vector2(140, -770), new Vector2(920, 660), 22, new Color(0.15f, 0.15f, 0.15f), TextAnchor.UpperLeft);
            notebookBody.lineSpacing = 1.2f;
            notebookBody.verticalOverflow = VerticalWrapMode.Truncate;
            notebookGroup.alpha = 0f;

            fade = NewGroup("Fade", root);
            var fadeImg = fade.gameObject.AddComponent<Image>();
            fadeImg.sprite = UiSprite("ui_paper");
            fadeImg.color = fadeImg.sprite != null ? new Color(0.55f, 0.55f, 0.58f, 1f) : new Color(0.03f, 0.035f, 0.045f, 1f);
            fadeImg.raycastTarget = false;
            fade.alpha = 1f;

            cardGroup = NewGroup("ChapterCard", root);
            // chapter titles are cut on a strip of cream paper
            var stripSprite = UiSprite("ui_strip");
            if (stripSprite != null)
            {
                var strip = NewRect("Strip", (RectTransform)cardGroup.transform, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(-720, -95), new Vector2(1440, 200)).gameObject.AddComponent<Image>();
                strip.sprite = stripSprite;
                strip.raycastTarget = false;
            }
            cardLabel = NewText("Label", (RectTransform)cardGroup.transform, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(-900, stripSprite != null ? 92 : 40), new Vector2(1800, 40), 22, Faint, TextAnchor.MiddleCenter);
            cardTitle = NewText("Title", (RectTransform)cardGroup.transform, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(-900, -40), new Vector2(1800, 90), 58, stripSprite != null ? Ink : Cream, TextAnchor.MiddleCenter);
            cardGroup.alpha = 0f;
            titleGroup.alpha = 0f;
            if (bold != null) { titleText.font = bold; cardTitle.font = bold; speaker.font = bold; }
        }

        /* ---------------- builders ---------------- */

        // paper for the interface (rendered by tools/render-art.js); null if missing
        static Sprite UiSprite(string name)
        {
            var tex = Stage.LoadTexture(name, true);
            if (tex == null) return null;
            return Sprite.Create(tex, new Rect(0, 0, tex.width, tex.height), new Vector2(0.5f, 0.5f), 100f);
        }

        // A black bar glued to one edge of the frame, reaching far outside it.
        static void Bar(RectTransform frame, Vector2 aMin, Vector2 aMax, Vector2 pivot)
        {
            var rt = NewRect("Bar", frame, aMin, aMax, Vector2.zero, Vector2.zero);
            rt.pivot = pivot;
            rt.sizeDelta = new Vector2(6000, 6000); // big enough for any screen
            var img = rt.gameObject.AddComponent<Image>();
            img.color = new Color(0.02f, 0.025f, 0.03f, 1f);
            img.raycastTarget = false;
        }

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

        public void ShowLine(string speakerName, string text, bool narration, bool echoLine, Color nameColor)
        {
            ClearChoices();
            prompt.text = "";
            speaker.text = string.IsNullOrEmpty(speakerName) ? "" : speakerName.ToUpperInvariant();
            speaker.color = nameColor;
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

        public void ShowChoices(string promptText, List<string> labels) => ShowChoices(promptText, labels, 0);

        // Layout: things to do fill columns of up to 4 rows from the left; the last
        // `travel` labels ("→ place") get their own column on the right.
        const int RowsPerColumn = 4;
        const float RowHeight = 46f;

        public void ShowChoices(string promptText, List<string> labels, int travel)
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

            if (travel < 0) travel = 0;
            if (travel > labels.Count) travel = labels.Count;
            int actions = labels.Count - travel;
            int actionCols = (actions + RowsPerColumn - 1) / RowsPerColumn;
            int travelCols = (travel + RowsPerColumn - 1) / RowsPerColumn;
            int cols = actionCols + travelCols;
            if (cols < 1) cols = 1;
            float boxW = choiceBox.sizeDelta.x;
            float colW = boxW / cols;
            int fontSize = cols >= 3 ? 26 : cols == 2 ? 30 : 32;

            for (int i = 0; i < labels.Count; i++)
            {
                int index = i;
                bool isTravel = i >= actions;
                int k = isTravel ? i - actions : i;
                int col = (isTravel ? actionCols : 0) + k / RowsPerColumn;
                int row = k % RowsPerColumn;
                // Each row is a wide, gap-free strip: clicking anywhere near the words works.
                // The outer columns stretch to the screen edges so there is no dead zone.
                float x = col * colW, w = colW;
                if (col == 0) { x -= 300; w += 300; }
                if (col == cols - 1) w += 300;
                var rt = NewRect("Choice" + i, choiceBox, new Vector2(0, 1), new Vector2(0, 1), new Vector2(x, -RowHeight - row * RowHeight), new Vector2(w, RowHeight));
                var img = rt.gameObject.AddComponent<Image>();
                img.color = new Color(1, 1, 1, 1f);
                var btn = rt.gameObject.AddComponent<Button>();
                btn.targetGraphic = img;
                var colors = btn.colors;
                colors.normalColor = new Color(1, 1, 1, 0f);
                colors.highlightedColor = new Color(1, 1, 1, 0.08f);
                colors.selectedColor = new Color(1, 1, 1, 0f);
                colors.pressedColor = new Color(1, 1, 1, 0.14f);
                btn.colors = colors;
                btn.onClick.AddListener(() => OnChoose?.Invoke(index));
                var hl = NewRect("Highlight", rt, Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero).gameObject.AddComponent<Image>();
                hl.color = new Color(1, 1, 1, 0f);
                hl.raycastTarget = false;
                choiceHighlights.Add(hl);
                // the label sits inside the column proper, not the stretched edge
                float pad = (col == 0 ? 300f : 0f) + 12f;
                var t = NewText("Label", rt, Vector2.zero, Vector2.one, new Vector2(pad, 0), Vector2.zero, fontSize, isTravel ? Travel : Cream, TextAnchor.MiddleLeft);
                ((RectTransform)t.transform).sizeDelta = new Vector2(-pad - (col == cols - 1 ? 300f : 0f) - 12f, 0);
                t.horizontalOverflow = HorizontalWrapMode.Wrap;
                t.verticalOverflow = VerticalWrapMode.Truncate;
                // long labels in narrow columns shrink a little instead of being cut off
                t.resizeTextForBestFit = true;
                t.resizeTextMinSize = 18;
                t.resizeTextMaxSize = fontSize;
                t.text = (i + 1) + ".  " + labels[i];
                choiceButtons.Add(btn);
            }
        }

        void ClearChoices()
        {
            foreach (var b in choiceButtons) if (b != null) Destroy(b.gameObject);
            choiceButtons.Clear();
            choiceHighlights.Clear();
            HideHotspots();
        }

        /* ---------------- clickable things in the world ---------------- */

        public struct HotspotView
        {
            public Vector2 screen;  // pixels
            public float radius;    // pixels
            public string label;
        }

        static Sprite MakeDot()
        {
            const int n = 64;
            var tex = new Texture2D(n, n, TextureFormat.RGBA32, false);
            var px = new Color32[n * n];
            for (int y = 0; y < n; y++)
            for (int x = 0; x < n; x++)
            {
                float dx = (x - n / 2f) / (n / 2f), dy = (y - n / 2f) / (n / 2f);
                float d = Mathf.Sqrt(dx * dx + dy * dy);
                float a = Mathf.Clamp01(1f - d);
                a = a * a; // soft glow
                if (d < 0.28f) a = 1f; // bright centre
                px[y * n + x] = new Color32(255, 240, 205, (byte)(a * 255));
            }
            tex.SetPixels32(px);
            tex.Apply();
            return Sprite.Create(tex, new Rect(0, 0, n, n), new Vector2(0.5f, 0.5f), 100f);
        }

        // Draws a soft dot on every clickable thing; the one under (or near) the mouse
        // glows and shows its action. Returns the index of that one, or -1.
        public int ShowHotspots(List<HotspotView> hs, Vector2 mouse)
        {
            int best = -1;
            float bestD = float.MaxValue;
            for (int i = 0; i < hs.Count; i++)
            {
                float d = Vector2.Distance(mouse, hs[i].screen) / Mathf.Max(1f, hs[i].radius);
                if (d <= 1f && d < bestD) { bestD = d; best = i; }
            }
            while (dots.Count < hs.Count)
            {
                var rt = NewRect("Hotspot", frame, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(24, 24));
                rt.pivot = new Vector2(0.5f, 0.5f);
                var img = rt.gameObject.AddComponent<Image>();
                img.sprite = dotSprite;
                img.raycastTarget = false;
                dots.Add(img);
            }
            for (int i = 0; i < dots.Count; i++)
            {
                var dot = dots[i];
                bool on = i < hs.Count;
                if (dot.gameObject.activeSelf != on) dot.gameObject.SetActive(on);
                if (!on) continue;
                RectTransformUtility.ScreenPointToLocalPointInRectangle(frame, hs[i].screen, null, out Vector2 lp);
                var rt = dot.rectTransform;
                rt.anchoredPosition = lp;
                bool hot = i == best;
                float pulse = ReducedMotion ? 0.5f : 0.5f + 0.5f * Mathf.Sin(Time.time * 2.2f + i);
                float size = hot ? 38f : 20f + 4f * pulse;
                rt.sizeDelta = new Vector2(size, size);
                dot.color = new Color(1f, 1f, 1f, hot ? 0.95f : 0.35f + 0.2f * pulse);
                if (hot)
                {
                    hoverLabel.enabled = true;
                    hoverLabel.text = hs[i].label;
                    ((RectTransform)hoverLabel.transform).anchoredPosition = lp + new Vector2(0f, 28f);
                }
            }
            if (best < 0) hoverLabel.enabled = false;
            return best;
        }

        // Light up the list row that matches the thing being hovered in the world.
        public void HighlightChoice(int index)
        {
            for (int i = 0; i < choiceHighlights.Count; i++)
                if (choiceHighlights[i] != null) choiceHighlights[i].color = new Color(1, 1, 1, i == index ? 0.09f : 0f);
        }

        public void HideHotspots()
        {
            foreach (var d in dots) if (d != null) d.gameObject.SetActive(false);
            if (hoverLabel != null) hoverLabel.enabled = false;
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
        public float FadeAlpha => fade.alpha;

        /* ---------------- notebook / toast / water ---------------- */

        public void SetNotebookButton(string label, bool visible)
        {
            notebookButton.text = label;
            notebookButton.enabled = visible;
        }

        public void ShowNotebook(string title, string body)
        {
            NotebookOpen = true;
            notebookTitle.text = title;
            notebookBody.text = body;
            notebookGroup.alpha = 1f;
            notebookGroup.blocksRaycasts = true;
            notebookGroup.transform.SetAsLastSibling();
        }

        public void HideNotebook()
        {
            NotebookOpen = false;
            notebookGroup.alpha = 0f;
            notebookGroup.blocksRaycasts = false;
        }

        public void Toast(string text)
        {
            toast.text = text;
            toast.enabled = true;
            toastTime = 3.2f;
        }

        // 0 = dry, 1 = the whole frame under water
        public void SetWater(float level, bool instant = false)
        {
            waterTarget = Mathf.Clamp01(level);
            if (instant) waterLevel = waterTarget;
        }

        void Update()
        {
            waterLevel = Mathf.MoveTowards(waterLevel, waterTarget, Time.deltaTime * (ReducedMotion ? 1f : 0.08f));
            water.sizeDelta = new Vector2(0f, waterLevel * 1080f);
            if (toastTime > 0f)
            {
                toastTime -= Time.deltaTime;
                toast.color = new Color(Cream.r, Cream.g, Cream.b, Mathf.Clamp01(toastTime));
                if (toastTime <= 0f) toast.enabled = false;
            }
            bandAlpha = Mathf.MoveTowards(bandAlpha, bandTarget, Time.deltaTime * 1.4f);
            band.color = new Color(bandTint.r, bandTint.g, bandTint.b, bandAlpha);

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
