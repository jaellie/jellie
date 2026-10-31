using System;
using DrivingSim.Core;
using DrivingSim.Localization;
using DrivingSim.Startup;
using UnityEngine;
using UnityEngine.UI;

namespace DrivingSim.UI
{
    public class PlaceholderDisclaimerView : MonoBehaviour, IDisclaimerView
    {
        GameObject root;
        HoldButton accept, close;
        ScrollRect bodyScroll;
        Action acknowledged, closed;
        bool consumed;

        public static PlaceholderDisclaimerView Create()
        {
            HudTheme theme = HudTheme.Default;
            Transform safe = DrivingHUDController.CreateCanvas("NoticeCanvas", 101);
            var view = safe.root.gameObject.AddComponent<PlaceholderDisclaimerView>();
            view.root = AutomotiveLayout.Modal(safe, theme, new Vector2(1200f, 780f), out RectTransform card);
            Text title = StartupTypography.Block(card, 68f, 80f, 44, theme);
            title.fontStyle = FontStyle.Bold;
            title.gameObject.AddComponent<LocalizedText>().Key = DisclaimerService.TitleKey;
            Text body = AutomotiveLayout.ScrollBlock("NoticeBody", card, 200f, 320f, 34, theme.text, theme);
            body.lineSpacing = 1.35f;
            body.gameObject.AddComponent<LocalizedText>().Key = DisclaimerService.BodyKey;
            view.bodyScroll = body.GetComponentInParent<ScrollRect>();
            view.accept = UIBuild.Button("Acknowledge", card, new Vector2(0.5f, 0f), new Vector2(0.5f, 0f),
                new Vector2(0f, 64f), new Vector2(620f, 100f), "", theme, 34, out Text acceptLabel);
            acceptLabel.gameObject.AddComponent<LocalizedText>().Key = DisclaimerService.AcceptKey;
            AutomotiveLayout.Primary(view.accept, theme);
            view.close = UIBuild.Button("Close", card, new Vector2(0.5f, 0f), new Vector2(0.5f, 0f),
                new Vector2(0f, 64f), new Vector2(440f, 100f), "", theme, 34, out Text closeLabel);
            closeLabel.gameObject.AddComponent<LocalizedText>().Key = DisclaimerService.CloseKey;
            view.accept.Pressed += () => view.Complete(true);
            view.close.Pressed += () => view.Complete(false);
            view.root.SetActive(false);
            return view;
        }

        public void Show(DisclaimerViewMode mode, Action onAcknowledged, Action onClosed)
        {
            consumed = false;
            acknowledged = mode == DisclaimerViewMode.Required ? onAcknowledged : null;
            closed = mode == DisclaimerViewMode.Review ? onClosed : null;
            accept.gameObject.SetActive(mode == DisclaimerViewMode.Required);
            close.gameObject.SetActive(mode == DisclaimerViewMode.Review);
            root.SetActive(true);
            Canvas.ForceUpdateCanvases();
            bodyScroll.verticalNormalizedPosition = 1f;
        }

        public void Hide()
        {
            consumed = true;
            acknowledged = closed = null;
            root.SetActive(false);
        }

        void Complete(bool acceptNotice)
        {
            if (consumed || !(acceptNotice ? accept : close).gameObject.activeSelf) return;
            consumed = true;
            Action callback = acceptNotice ? acknowledged : closed;
            acknowledged = closed = null;
            callback?.Invoke();
        }
    }

}
