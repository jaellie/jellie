using System.Collections.Generic;
using DearMe.Content;
using DearMe.Language;
using DearMe.Platform;
using DearMe.Settings;
using DearMe.Story;
using UnityEngine;

namespace DearMe.UI
{
    /// <summary>
    /// Decides when translation help appears.
    ///   Desktop: hover (short delay) shows; moving to a neighbour switches without delay; a click
    ///            still continues the dialogue.
    ///   Touch:   tap pins/unpins; tap elsewhere dismisses (and does not advance dialogue).
    ///   Both:    long press shows the detailed version (inside buttons too).
    /// Content always comes from TooltipContentBuilder, so every device sees the same text.
    /// </summary>
    public class TooltipController : MonoBehaviour
    {
        public const float HoverDelay = 0.28f;
        public const float SwitchGrace = 0.3f;
        public const float HideDelay = 0.12f;
        public const float LongPress = 0.5f;
        const float LongPressSlop = 18f; // pixels of movement that cancel a long press (scrolling)

        public GameSettings Settings { get; private set; }
        ContentDatabase db;
        TooltipView view;

        TokenView hovered;
        TokenView shown;
        bool pinned;
        bool shownDetailed;
        float hoverStart = float.PositiveInfinity;
        float exitTime;
        float lastVisible = float.NegativeInfinity;

        TokenView pressed;
        float pressTime;
        Vector2 pressPos;
        bool longPressFired;
        bool swallowAdvance;

        readonly List<RectTransform> avoid = new List<RectTransform>();

        public bool IsOpen => shown != null;
        public bool Enabled => Settings != null && Settings.support != LanguageSupportLevel.Off;

        public void Init(GameSettings settings, ContentDatabase db, TooltipView view)
        {
            Settings = settings;
            this.db = db;
            this.view = view;
            settings.Changed += () => { if (!Enabled) Hide(); };
        }

        /// <summary>Areas the tooltip must not cover (e.g. the choice list).</summary>
        public void RegisterAvoidArea(RectTransform rt)
        {
            if (rt != null && !avoid.Contains(rt)) avoid.Add(rt);
        }

        /// <summary>FULL support shows inline glosses only for grammar and harder vocabulary.</summary>
        public bool WantsGloss(Token t)
        {
            if (t == null || !t.HasInfo) return false;
            if (t.type == TokenType.Grammar) return true;
            if (t.vocabId.Length > 0 && db.Vocab.TryGetValue(t.vocabId, out var v)) return v.level >= 3;
            return false;
        }

        public string GlossText(Token t)
        {
            var c = TooltipContentBuilder.ForToken(t, null, db, false);
            return c.missingTranslation ? "" : c.meaning;
        }

        // ------------------------------------------------------------ events from TokenView

        public void HoverEnter(TokenView t)
        {
            if (!Enabled) return;
            hovered = t;
            hoverStart = Time.unscaledTime;
            // Sliding from one word to the next: switch at once instead of blinking.
            if (!pinned && shown != null && shown != t && Time.unscaledTime - lastVisible < SwitchGrace)
                Show(t, false, false);
        }

        public void HoverExit(TokenView t)
        {
            if (hovered == t) hovered = null;
            exitTime = Time.unscaledTime;
        }

        public void PointerDown(TokenView t, Vector2 screenPos)
        {
            pressed = t;
            pressTime = Time.unscaledTime;
            pressPos = screenPos;
            longPressFired = false;
            hoverStart = float.PositiveInfinity; // a press is not a hover (touch sends both)
        }

        public void PointerUp(TokenView t)
        {
            if (pressed == t) pressed = null;
        }

        /// <summary>
        /// Returns true if the click was used for help and must not reach the button/panel.
        /// A mouse click continues the dialogue (hover already shows help); a finger tap pins help.
        /// </summary>
        public bool Click(TokenView t, bool touch)
        {
            if (longPressFired) { longPressFired = false; return true; }
            if (!Enabled || t.ForwardClicks || !touch) return false;
            if (pinned && shown == t) Hide();
            else Show(t, false, true);
            return true;
        }

        public void Forget(TokenView t)
        {
            if (hovered == t) hovered = null;
            if (pressed == t) pressed = null;
            if (shown == t) Hide();
        }

        // ------------------------------------------------------------ global

        /// <summary>The dialogue panel asks this before advancing; true means "this tap only closed help".</summary>
        public bool ConsumeAdvance()
        {
            if (!swallowAdvance) return false;
            swallowAdvance = false;
            return true;
        }

        public void Hide()
        {
            if (shown != null) shown.SetHighlighted(false);
            shown = null;
            pinned = false;
            view.Hide();
        }

        void Show(TokenView t, bool detailed, bool pin)
        {
            if (t == null || !Enabled) return;
            var content = t.SentenceMode
                ? TooltipContentBuilder.ForSentence(t.Line)
                : TooltipContentBuilder.ForToken(t.Token, t.Line, db, detailed);
            if (content.missingTranslation) Debug.LogWarning("[DearMe] Missing translation for '" + (t.Token?.korean ?? t.Line?.koreanText) + "'");

            if (shown != null && shown != t) shown.SetHighlighted(false);
            shown = t;
            pinned = pin;
            shownDetailed = detailed;
            t.SetHighlighted(true);
            view.Show(content, t.RectTransform, avoid);
            lastVisible = Time.unscaledTime;
        }

        public void Reposition()
        {
            if (shown != null && shown.isActiveAndEnabled) view.Reposition(shown.RectTransform, avoid);
            else if (shown != null) Hide();
        }

        void Update()
        {
            float now = Time.unscaledTime;
            if (shown != null) lastVisible = now;

            if (pressed != null && !longPressFired)
            {
                if ((InputAdapter.PointerPosition - pressPos).sqrMagnitude > LongPressSlop * LongPressSlop) pressed = null;
                else if (now - pressTime >= LongPress && Enabled)
                {
                    longPressFired = true;
                    Show(pressed, true, true);
                }
            }

            if (!Enabled) return;

            if (hovered != null && !pinned && shown != hovered && now - hoverStart >= HoverDelay)
                Show(hovered, false, false);

            if (shown != null && !pinned && hovered == null && now - exitTime >= HideDelay)
                Hide();
        }

        // LateUpdate: the EventSystem has already delivered this frame's press to any token by now.
        void LateUpdate()
        {
            if (!Enabled) return;
            // A press anywhere that isn't a token closes pinned help, and that press is swallowed.
            if (pinned && InputAdapter.PointerPressedThisFrame && pressed == null)
            {
                Hide();
                swallowAdvance = true;
            }
            else if (InputAdapter.PointerPressedThisFrame && !pinned)
            {
                swallowAdvance = false;
            }
        }
    }
}
