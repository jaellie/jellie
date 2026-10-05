using System;
using System.Collections.Generic;
using DearMe.Content;
using DearMe.Input;
using DearMe.Platform;
using UnityEngine;
using UnityEngine.UI;

namespace DearMe.UI
{
    /// <summary>Player responses. Each option is a full Korean sentence with the same hover/tap help.</summary>
    public class ChoiceListView : MonoBehaviour
    {
        RectTransform list;
        Theme theme;
        InputGate gate;
        TooltipController tooltips;
        DialogueView dialogue;
        Action<int> onChosen;
        int count;

        public event Action Selected;
        public RectTransform List => list;

        public void Build(RectTransform root, Theme theme, InputGate gate, TooltipController tooltips, DialogueView dialogue)
        {
            this.theme = theme;
            this.gate = gate;
            this.tooltips = tooltips;
            this.dialogue = dialogue;

            list = UIFactory.Rect("Choices", root);
            list.anchorMin = list.anchorMax = new Vector2(0.5f, 0f);
            list.pivot = new Vector2(0.5f, 0f);
            var fitter = list.gameObject.AddComponent<MaxWidthFitter>();
            fitter.maxWidth = 1000f;
            fitter.margin = Theme.Gutter * 2f;
            UIFactory.Vertical(list.gameObject, 10f);
            UIFactory.FitVertical(list.gameObject);
            tooltips.RegisterAvoidArea(list);
            list.gameObject.SetActive(false);
        }

        public void Show(IList<DialogueLine> options, Action<int> chosen)
        {
            UIFactory.DestroyChildren(list);
            onChosen = chosen;
            count = options.Count;
            for (int i = 0; i < options.Count; i++)
            {
                int index = i;
                var button = UIFactory.BareButton("Choice" + i, list, theme, () => Choose(index));
                var rt = (RectTransform)button.transform;
                var row = UIFactory.Horizontal(rt.gameObject, 18f, new RectOffset(22, 22, 14, 14));
                row.childAlignment = TextAnchor.MiddleLeft;

                var number = UIFactory.Text("Number", rt, (i + 1).ToString(), theme.Body, Theme.TinySize, Theme.Muted, TextAnchor.MiddleCenter, wrap: false);
                UIFactory.Layout(number.gameObject, preferredWidth: 18f, minWidth: 18f);
                var text = KoreanTextView.Create("Text", rt, theme, tooltips);
                text.SetLine(options[i], theme.Body, Theme.ChoiceSize, Theme.Ink, sentenceMarker: false, forwardClicks: true);
                UIFactory.Layout(text.gameObject, flexibleWidth: 1f, minWidth: 0f);
            }
            list.gameObject.SetActive(true);
            gate.SetState(InputState.Choice);
        }

        void Choose(int index)
        {
            if (onChosen == null || index < 0 || index >= count) return;
            if (!gate.TryConsume(GameAction.Choose, Time.unscaledTimeAsDouble, Time.frameCount)) return;
            gate.SetState(InputState.Idle);
            var cb = onChosen;
            Hide();
            Selected?.Invoke();
            cb(index);
        }

        public void Hide()
        {
            onChosen = null;
            tooltips.Hide();
            UIFactory.DestroyChildren(list);
            list.gameObject.SetActive(false);
        }

        void LateUpdate()
        {
            if (!list.gameObject.activeSelf) return;
            // Sit just above the prompt panel when there is one.
            float y = Theme.Gutter;
            if (dialogue.IsVisible) y = dialogue.Panel.anchoredPosition.y + dialogue.Panel.rect.height + 14f;
            list.anchoredPosition = new Vector2(0f, y);

            if (onChosen != null)
            {
                int n = InputAdapter.NumberPressed;
                if (n >= 0 && n < count) Choose(n);
            }
        }
    }
}
