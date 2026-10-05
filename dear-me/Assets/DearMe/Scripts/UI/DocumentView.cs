using System;
using DearMe.Content;
using DearMe.Input;
using DearMe.Platform;
using UnityEngine;
using UnityEngine.UI;

namespace DearMe.UI
{
    /// <summary>Reads in-world paper: diary pages, the notice, the note, phone messages.</summary>
    public class DocumentView : MonoBehaviour
    {
        CardFrame frame;
        Theme theme;
        TooltipController tooltips;
        ContentDatabase db;
        InputGate gate;
        Action onClose;
        bool asReference;

        public bool IsOpen => frame.IsOpen;

        public void Build(RectTransform layer, Theme theme, TooltipController tooltips, ContentDatabase db, InputGate gate)
        {
            this.theme = theme;
            this.tooltips = tooltips;
            this.db = db;
            this.gate = gate;
            frame = CardFrame.Build("Document", layer, theme, 820f);
        }

        /// <param name="reference">Opened from a drill ("look at the notice again"): doesn't touch the input state.</param>
        public void Show(DocumentDef doc, Action closed, bool reference = false)
        {
            asReference = reference;
            onClose = closed;
            frame.Open(doc.titleKo, doc.titleEn);

            bool note = doc.kind == "note";
            bool messages = doc.kind == "messages";
            frame.CardBackground.color = doc.kind == "diary" ? Theme.Cream : note ? Theme.Hex("#F7F2E6") : Theme.Paper;
            ((MaxWidthFitter)frame.Card.GetComponent<MaxWidthFitter>()).maxWidth = note ? 560f : 820f;

            foreach (var l in doc.lines)
            {
                if (l.style == "gap")
                {
                    UIFactory.Layout(UIFactory.Rect("Gap", frame.Content).gameObject, minHeight: 18f, preferredHeight: 18f);
                    continue;
                }
                var line = KoreanMarkup.BuildLine(doc.id, l.speaker, l.ko, l.en);
                Transform parent = frame.Content;
                if (messages)
                {
                    // Chat bubble: speaker name above a quiet tinted block.
                    var bubble = UIFactory.Rect("Bubble", frame.Content);
                    var bg = bubble.gameObject.AddComponent<Image>();
                    bg.color = Theme.WithAlpha(Theme.Ink, 0.05f);
                    bg.raycastTarget = false;
                    UIFactory.Vertical(bubble.gameObject, 4f, new RectOffset(18, 18, 10, 12));
                    UIFactory.Text("Name", bubble, db.SpeakerNameKo(l.speaker), theme.Body, Theme.TinySize, Theme.Accent);
                    parent = bubble;
                }
                int size = l.style == "heading" ? Theme.HeadingSize - 4 : l.style == "small" ? Theme.SmallSize : note ? Theme.HeadingSize : Theme.BodySize;
                var view = KoreanTextView.Create("Line", parent, theme, tooltips);
                view.SetLine(line, theme.Body, size, Theme.Ink, sentenceMarker: true, lineAlign: note ? 0.5f : 0f);
                if (l.style == "stain") AddStain(view.transform);
            }

            var close = UIFactory.Button("Close", frame.Footer, theme, db.UiKo("close"), db.UiEn("close"), Close);
            UIFactory.Layout(close.gameObject, minHeight: theme.TouchMin, preferredWidth: 180f);
            if (!asReference) gate.SetState(InputState.Idle);
        }

        // Coffee stain over the deadline: the information gap in the notice is physical.
        void AddStain(Transform lineView)
        {
            var stain = UIFactory.Image("CoffeeStain", lineView, Theme.WithAlpha(Theme.Hex("#8B5E34"), 0.28f));
            stain.gameObject.AddComponent<LayoutElement>().ignoreLayout = true;
            var rt = stain.rectTransform;
            rt.anchorMin = new Vector2(0.55f, -0.3f);
            rt.anchorMax = new Vector2(0.95f, 1.3f);
            rt.offsetMin = rt.offsetMax = Vector2.zero;
        }

        public void Close()
        {
            if (!frame.IsOpen) return;
            // Through the gate, so the tap that closes the paper can't also skip the next line.
            if (!asReference && !gate.TryConsume(GameAction.Interact, Time.unscaledTimeAsDouble, Time.frameCount)) return;
            tooltips.Hide();
            frame.Close();
            var cb = onClose;
            onClose = null;
            cb?.Invoke();
        }

        /// <summary>Closes without continuing the story (returning to the title).</summary>
        public void Dismiss()
        {
            onClose = null;
            if (frame.IsOpen) frame.Close();
        }

        void Update()
        {
            if (frame.IsOpen && !asReference && InputAdapter.AdvancePressed) Close();
        }
    }
}
