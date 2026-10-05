using DearMe.Content;
using DearMe.Story;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

namespace DearMe.UI
{
    /// <summary>
    /// One Korean token on screen. Pointer events are reported to the TooltipController,
    /// which owns all timing (hover delay, tap pin, long press), so mouse and touch share
    /// one code path.
    /// </summary>
    public class TokenView : MonoBehaviour,
        IPointerEnterHandler, IPointerExitHandler, IPointerDownHandler, IPointerUpHandler, IPointerClickHandler
    {
        public Token Token { get; private set; }
        public DialogueLine Line { get; private set; }
        /// <summary>Shows the whole-sentence translation instead of token info (the "EN" marker).</summary>
        public bool SentenceMode { get; private set; }
        /// <summary>Inside a button (choice, drill chunk): a normal tap presses the button; long press shows help.</summary>
        public bool ForwardClicks { get; private set; }

        TooltipController controller;
        Text main;
        Text gloss;
        Image underline;
        Color baseColor;
        bool highlighted;

        public RectTransform RectTransform => (RectTransform)transform;

        public void Init(TooltipController controller, Token token, DialogueLine line, Text main, Text gloss, Image underline,
            bool sentenceMode, bool forwardClicks)
        {
            this.controller = controller;
            Token = token;
            Line = line;
            this.main = main;
            this.gloss = gloss;
            this.underline = underline;
            SentenceMode = sentenceMode;
            ForwardClicks = forwardClicks;
            baseColor = main.color;
            ApplySupport();
        }

        void OnEnable()
        {
            if (controller != null) controller.Settings.Changed += ApplySupport;
        }

        void OnDisable()
        {
            if (controller != null)
            {
                controller.Settings.Changed -= ApplySupport;
                controller.Forget(this);
            }
        }

        void Start()
        {
            // Init runs after AddComponent (and OnEnable); subscribe once here as well.
            if (controller != null)
            {
                controller.Settings.Changed -= ApplySupport;
                controller.Settings.Changed += ApplySupport;
            }
        }

        /// <summary>Underline and FULL-mode glosses follow the language support setting.</summary>
        public void ApplySupport()
        {
            if (controller == null) return;
            var level = controller.Settings.support;
            bool hasInfo = Token != null && Token.HasInfo;
            if (SentenceMode)
            {
                // Korean-only mode: the "EN" marker disappears (its layout slot stays, so nothing jumps).
                bool on = level != LanguageSupportLevel.Off;
                main.enabled = on;
                var hit = GetComponent<Image>();
                if (hit != null) hit.raycastTarget = on;
            }
            if (underline != null)
            {
                underline.enabled = level != LanguageSupportLevel.Off && (hasInfo || SentenceMode);
                bool grammar = Token != null && Token.type == TokenType.Grammar;
                underline.color = grammar ? Theme.WithAlpha(Theme.Accent, 0.75f) : Theme.WithAlpha(baseColor, 0.22f);
            }
            if (gloss != null)
                gloss.gameObject.SetActive(level == LanguageSupportLevel.Full && controller.WantsGloss(Token));
        }

        public void SetHighlighted(bool on)
        {
            if (highlighted == on || main == null) return;
            highlighted = on;
            main.color = on ? Theme.Accent : baseColor;
        }

        public void OnPointerEnter(PointerEventData e) => controller?.HoverEnter(this);
        public void OnPointerExit(PointerEventData e) => controller?.HoverExit(this);
        public void OnPointerDown(PointerEventData e) => controller?.PointerDown(this, e.position);
        public void OnPointerUp(PointerEventData e) => controller?.PointerUp(this);

        public void OnPointerClick(PointerEventData e)
        {
            if (controller == null) return;
            // Unconsumed clicks continue upward: a choice button chooses, a dialogue panel advances.
            bool consumed = controller.Click(this, DearMe.Platform.InputAdapter.IsTouchEvent(e));
            if (!consumed && transform.parent != null)
                ExecuteEvents.ExecuteHierarchy(transform.parent.gameObject, e, ExecuteEvents.pointerClickHandler);
        }
    }
}
