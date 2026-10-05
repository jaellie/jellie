using System;
using DearMe.Content;
using DearMe.Input;
using DearMe.Platform;
using DearMe.Settings;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

namespace DearMe.UI
{
    /// <summary>Forwards taps on empty screen space to the dialogue (click anywhere to continue).</summary>
    public class AdvanceCatcher : MonoBehaviour, IPointerClickHandler
    {
        public DialogueView view;
        public void OnPointerClick(PointerEventData e) => view.TryAdvance();
    }

    /// <summary>
    /// Bottom dialogue panel: speaker, tokenized Korean, a small "EN" sentence marker and a
    /// continue mark. Input goes through the InputGate (Displaying → WaitingForInput → Idle),
    /// so one click can never skip two lines.
    /// </summary>
    public class DialogueView : MonoBehaviour
    {
        RectTransform panel;
        Text speaker;
        KoreanTextView text;
        Text continueMark;
        CanvasGroup group;
        GameObject catcher;

        Theme theme;
        InputGate gate;
        TooltipController tooltips;
        GameSettings settings;
        ContentDatabase db;

        Action onAdvance;
        float displayStart;
        const float FadeTime = 0.18f;

        public RectTransform Panel => panel;
        public bool IsVisible => panel.gameObject.activeSelf;

        public void Build(RectTransform root, Theme theme, InputGate gate, TooltipController tooltips, GameSettings settings, ContentDatabase db)
        {
            this.theme = theme;
            this.gate = gate;
            this.tooltips = tooltips;
            this.settings = settings;
            this.db = db;

            var catcherImg = UIFactory.Image("AdvanceCatcher", root, Theme.Clear, raycast: true);
            UIFactory.Stretch(catcherImg.rectTransform);
            catcherImg.gameObject.AddComponent<AdvanceCatcher>().view = this;
            catcher = catcherImg.gameObject;
            catcher.SetActive(false);

            panel = UIFactory.Rect("DialoguePanel", root);
            panel.anchorMin = new Vector2(0.5f, 0f);
            panel.anchorMax = new Vector2(0.5f, 0f);
            panel.pivot = new Vector2(0.5f, 0f);
            panel.anchoredPosition = new Vector2(0f, Theme.Gutter);
            var fitter = panel.gameObject.AddComponent<MaxWidthFitter>();
            fitter.maxWidth = 1120f;
            fitter.margin = Theme.Gutter;

            var bg = panel.gameObject.AddComponent<Image>();
            bg.color = Theme.WithAlpha(Theme.Paper, 0.97f);
            bg.raycastTarget = true;
            UIFactory.Border(panel, Theme.Line, 1.5f);
            group = panel.gameObject.AddComponent<CanvasGroup>();

            UIFactory.Vertical(panel.gameObject, 10f, new RectOffset(36, 36, 22, 18));
            UIFactory.FitVertical(panel.gameObject);
            panel.gameObject.AddComponent<AdvanceCatcher>().view = this;

            speaker = UIFactory.Text("Speaker", panel, "", theme.Sans, Theme.SmallSize, Theme.Accent);
            text = KoreanTextView.Create("Line", panel, theme, tooltips);

            continueMark = UIFactory.Text("Continue", panel, "▼", theme.Sans, Theme.TinySize, Theme.WithAlpha(Theme.Ink, 0.45f), TextAnchor.LowerRight, wrap: false);
            UIFactory.Layout(continueMark.gameObject, minHeight: 18f);

            panel.gameObject.SetActive(false);
        }

        void SetContent(DialogueLine line, bool showContinue)
        {
            panel.gameObject.SetActive(true);
            string name = db.SpeakerNameKo(line.speaker);
            bool narration = string.IsNullOrEmpty(line.speaker);
            speaker.gameObject.SetActive(!narration);
            speaker.text = name;
            if (!narration && db.Characters.TryGetValue(line.speaker, out var c)) speaker.color = Theme.Hex(c.color);
            var color = narration ? Theme.Charcoal : Theme.Ink;
            text.SetLine(line, theme.Serif, Theme.BodySize, color, sentenceMarker: true);
            continueMark.gameObject.SetActive(showContinue);
        }

        public void ShowLine(DialogueLine line, Action done)
        {
            tooltips.Hide();
            SetContent(line, true);
            onAdvance = done;
            catcher.SetActive(true);
            displayStart = Time.unscaledTime;
            group.alpha = settings.reducedMotion ? 1f : 0f;
            gate.SetState(settings.reducedMotion ? InputState.WaitingForInput : InputState.Displaying);
        }

        /// <summary>Shows a choice prompt without the continue mark; input is owned by the choice list.</summary>
        public void ShowPrompt(DialogueLine line)
        {
            SetContent(line, false);
            onAdvance = null;
            catcher.SetActive(false);
            group.alpha = 1f;
        }

        public void Hide()
        {
            onAdvance = null;
            catcher.SetActive(false);
            panel.gameObject.SetActive(false);
            text.Clear();
        }

        public void TryAdvance()
        {
            if (onAdvance == null) return;
            if (tooltips.ConsumeAdvance()) return; // this tap only closed the help card
            if (!gate.TryConsume(GameAction.Advance, Time.unscaledTimeAsDouble, Time.frameCount)) return;

            if (gate.State == InputState.Displaying)
            {
                FinishDisplay();
                return;
            }
            tooltips.Hide();
            var cb = onAdvance;
            onAdvance = null;
            catcher.SetActive(false);
            gate.SetState(InputState.Idle);
            cb();
        }

        void FinishDisplay()
        {
            group.alpha = 1f;
            gate.SetState(InputState.WaitingForInput);
        }

        void Update()
        {
            if (onAdvance == null) return;
            if (gate.State == InputState.Displaying)
            {
                float t = (Time.unscaledTime - displayStart) / FadeTime;
                group.alpha = Mathf.Clamp01(t);
                if (t >= 1f) FinishDisplay();
            }
            if (InputAdapter.AdvancePressed) TryAdvance();
        }
    }
}
