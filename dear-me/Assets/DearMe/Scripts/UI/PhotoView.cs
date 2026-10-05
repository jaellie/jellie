using System;
using DearMe.Content;
using DearMe.Input;
using DearMe.Platform;
using UnityEngine;
using UnityEngine.UI;

namespace DearMe.UI
{
    /// <summary>
    /// Hyejin's photographs. Drawn from data (photos.json), and the drawn state follows the
    /// story's photo memory, so a changed past shows up as a quietly different picture.
    /// </summary>
    public class PhotoView : MonoBehaviour
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
            frame = CardFrame.Build("Photo", layer, theme, 760f);
        }

        public void Show(PhotoDef photo, PhotoState state, Action closed, bool reference = false)
        {
            asReference = reference;
            onClose = closed;
            frame.Open(photo.titleKo, photo.titleEn);
            frame.CardBackground.color = Theme.Paper;

            if (state != null)
            {
                // White print border around the picture.
                var print = UIFactory.Image("Print", frame.Content, Color.white);
                // 4:3 print; height follows the width the card's layout gives it.
                print.gameObject.AddComponent<PhotoHeight>().ratio = 3f / 4f;

                var picture = UIFactory.Image("Picture", print.rectTransform, Theme.Hex(state.background));
                UIFactory.Stretch(picture.rectTransform, 14f);
                foreach (var s in state.shapes)
                {
                    var img = UIFactory.Image("Shape", picture.rectTransform, Theme.Hex(s.color));
                    UIFactory.PlaceNormalized(img.rectTransform, s.x, s.y, s.w, s.h);
                    if (s.label.Length > 0)
                    {
                        var label = KoreanTextView.Create("Label", img.rectTransform, theme, tooltips);
                        var lrt = (RectTransform)label.transform;
                        lrt.anchorMin = new Vector2(0f, 0f);
                        lrt.anchorMax = new Vector2(1f, 0f);
                        lrt.pivot = new Vector2(0.5f, 0f);
                        lrt.sizeDelta = new Vector2(0f, 40f);
                        lrt.anchoredPosition = new Vector2(0f, 6f);
                        bool dark = s.color.Length >= 7 && Theme.Hex(s.color).grayscale < 0.5f;
                        var line = KoreanMarkup.BuildLine(photo.id, "", s.label, s.labelEn);
                        label.SetLine(line, theme.Body, Theme.TinySize, dark ? Theme.Paper : Theme.Ink, lineAlign: 0.5f);
                    }
                }
                if (state.dateStamp.Length > 0)
                {
                    var stamp = UIFactory.Text("DateStamp", picture.rectTransform, state.dateStamp, theme.Body, Theme.SmallSize,
                        Theme.Hex("#E0782F"), TextAnchor.LowerRight, wrap: false);
                    var srt = stamp.rectTransform;
                    srt.anchorMin = srt.anchorMax = new Vector2(1f, 0f);
                    srt.pivot = new Vector2(1f, 0f);
                    srt.anchoredPosition = new Vector2(-12f, 8f);
                    srt.sizeDelta = new Vector2(240f, 30f);
                }

                foreach (var d in state.details)
                {
                    var view = KoreanTextView.Create("Detail", frame.Content, theme, tooltips);
                    view.SetLine(KoreanMarkup.BuildLine(photo.id, "", d.ko, d.en), theme.Body, Theme.BodySize - 2, Theme.Ink, sentenceMarker: true);
                }
            }

            var close = UIFactory.Button("Close", frame.Footer, theme, db.UiKo("close"), db.UiEn("close"), Close);
            UIFactory.Layout(close.gameObject, minHeight: theme.TouchMin, preferredWidth: 180f);
            if (!asReference) gate.SetState(InputState.Idle);
        }

        public void Close()
        {
            if (!frame.IsOpen) return;
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

    /// <summary>Gives a layout child a height proportional to the width it was given.</summary>
    public class PhotoHeight : MonoBehaviour, ILayoutElement
    {
        public float ratio = 0.75f;
        public float minWidth => -1;
        public float preferredWidth => -1;
        public float flexibleWidth => -1;
        public float minHeight => ((RectTransform)transform).rect.width * ratio;
        public float preferredHeight => ((RectTransform)transform).rect.width * ratio;
        public float flexibleHeight => -1;
        public int layoutPriority => 2;
        public void CalculateLayoutInputHorizontal() { }
        public void CalculateLayoutInputVertical() { }
    }
}
