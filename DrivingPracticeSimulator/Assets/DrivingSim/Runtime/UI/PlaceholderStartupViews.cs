using System;
using DrivingSim.Core;
using DrivingSim.Localization;
using DrivingSim.Startup;
using UnityEngine;
using UnityEngine.UI;

namespace DrivingSim.UI
{
    /// <summary>
    /// TEMPORARY functional screen for language selection. It exists so the first-launch flow works
    /// before the final design; it will be replaced by Codex's view through ILanguageSelectionView.
    /// No visual design effort here on purpose.
    /// </summary>
    public class PlaceholderLanguageView : MonoBehaviour, ILanguageSelectionView
    {
        GameObject root;
        Text title;
        HoldButton korean, english, cancel;
        Action<Language> selected;
        Action cancelled;

        public static PlaceholderLanguageView Create()
        {
            HudTheme theme = HudTheme.Default;
            Transform safe = DrivingHUDController.CreateCanvas("PlaceholderLanguageCanvas", 100);
            var view = safe.root.gameObject.AddComponent<PlaceholderLanguageView>();
            view.root = PlaceholderScreens.Modal(safe, theme, new Vector2(900f, 620f), out RectTransform card);
            view.title = PlaceholderScreens.Block(card, 50f, 140f, 36, theme.text, theme);
            view.korean = UIBuild.Button("Korean", card, new Vector2(0.5f, 1f), new Vector2(0.5f, 1f), new Vector2(0f, -230f), new Vector2(560f, 96f),
                LocalizationService.In(Language.Korean, "language.name.ko"), theme, 40, out _);
            view.english = UIBuild.Button("English", card, new Vector2(0.5f, 1f), new Vector2(0.5f, 1f), new Vector2(0f, -346f), new Vector2(560f, 96f),
                LocalizationService.In(Language.EnglishUS, "language.name.en"), theme, 40, out _);
            view.cancel = UIBuild.Button("Cancel", card, new Vector2(0.5f, 1f), new Vector2(0.5f, 1f), new Vector2(0f, -470f), new Vector2(300f, 80f),
                "", theme, 30, out Text cancelLabel);
            cancelLabel.gameObject.AddComponent<LocalizedText>().Key = "common.cancel";
            view.korean.Pressed += () => view.Choose(Language.Korean);
            view.english.Pressed += () => view.Choose(Language.EnglishUS);
            view.cancel.Pressed += () => { Action a = view.cancelled; view.cancelled = null; a?.Invoke(); };
            view.root.SetActive(false);
            return view;
        }

        public void Show(Language current, bool allowCancel, Action<Language> onSelected, Action onCancelled)
        {
            selected = onSelected;
            cancelled = onCancelled;
            // Bilingual title: the player may not read the current language yet.
            title.text = LocalizationService.In(Language.Korean, "language.title") + "\n" + LocalizationService.In(Language.EnglishUS, "language.title");
            korean.SetToggled(current == Language.Korean);
            english.SetToggled(current == Language.EnglishUS);
            cancel.gameObject.SetActive(allowCancel);
            root.SetActive(true);
        }

        public void Hide() => root.SetActive(false);

        void Choose(Language language)
        {
            Action<Language> callback = selected;
            selected = null; // one choice per Show
            callback?.Invoke(language);
        }
    }

    /// <summary>
    /// TEMPORARY functional screen for the first-launch notice. Required mode offers only the
    /// acknowledge button; Review mode only a close button. Replaced by Codex's IDisclaimerView.
    /// </summary>
    public class PlaceholderDisclaimerView : MonoBehaviour, IDisclaimerView
    {
        GameObject root;
        HoldButton accept, close;
        Action acknowledged, closed;

        public static PlaceholderDisclaimerView Create()
        {
            HudTheme theme = HudTheme.Default;
            Transform safe = DrivingHUDController.CreateCanvas("PlaceholderDisclaimerCanvas", 101);
            var view = safe.root.gameObject.AddComponent<PlaceholderDisclaimerView>();
            view.root = PlaceholderScreens.Modal(safe, theme, new Vector2(1200f, 700f), out RectTransform card);
            Text title = PlaceholderScreens.Block(card, 50f, 70f, 42, theme.text, theme);
            title.fontStyle = FontStyle.Bold;
            title.gameObject.AddComponent<LocalizedText>().Key = DisclaimerService.TitleKey;
            Text body = PlaceholderScreens.Block(card, 150f, 330f, 32, theme.text, theme);
            body.alignment = TextAnchor.UpperLeft;
            body.gameObject.AddComponent<LocalizedText>().Key = DisclaimerService.BodyKey;
            view.accept = UIBuild.Button("Accept", card, new Vector2(0.5f, 0f), new Vector2(0.5f, 0f), new Vector2(0f, 48f), new Vector2(480f, 96f), "", theme, 36, out Text acceptLabel);
            acceptLabel.gameObject.AddComponent<LocalizedText>().Key = DisclaimerService.AcceptKey;
            view.close = UIBuild.Button("Close", card, new Vector2(0.5f, 0f), new Vector2(0.5f, 0f), new Vector2(0f, 48f), new Vector2(360f, 96f), "", theme, 36, out Text closeLabel);
            closeLabel.gameObject.AddComponent<LocalizedText>().Key = DisclaimerService.CloseKey;
            view.accept.Pressed += () => { Action a = view.acknowledged; view.acknowledged = null; a?.Invoke(); };
            view.close.Pressed += () => { Action a = view.closed; view.closed = null; a?.Invoke(); };
            view.root.SetActive(false);
            return view;
        }

        public void Show(DisclaimerViewMode mode, Action onAcknowledged, Action onClosed)
        {
            acknowledged = mode == DisclaimerViewMode.Required ? onAcknowledged : null;
            closed = mode == DisclaimerViewMode.Review ? onClosed : null;
            accept.gameObject.SetActive(mode == DisclaimerViewMode.Required);
            close.gameObject.SetActive(mode == DisclaimerViewMode.Review);
            root.SetActive(true);
        }

        public void Hide() => root.SetActive(false);
    }

    static class PlaceholderScreens
    {
        /// <summary>Full-screen dim layer (blocks every touch/click behind it) with a centered card.</summary>
        public static GameObject Modal(Transform safe, HudTheme theme, Vector2 cardSize, out RectTransform card)
        {
            RectTransform dim = UIBuild.Rect("Modal", safe, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, Vector2.zero);
            UIBuild.Stretch(dim);
            // Stretch over the whole screen, not only the safe area, so nothing behind is reachable.
            dim.offsetMin = new Vector2(-4000f, -4000f);
            dim.offsetMax = new Vector2(4000f, 4000f);
            UIBuild.Panel(dim, null, new Color(0f, 0f, 0f, 0.85f), raycast: true);
            card = UIBuild.Rect("Card", dim, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, cardSize);
            UIBuild.Panel(card, theme.RoundedPanel, theme.panelStrong);

            RectTransform tag = UIBuild.Rect("TemporaryTag", card, new Vector2(1f, 1f), new Vector2(1f, 1f), new Vector2(-16f, -12f), new Vector2(260f, 36f));
            Text tagText = UIBuild.Label("Text", tag, "", theme.Font, 20, theme.textMuted, TextAnchor.MiddleRight);
            tagText.gameObject.AddComponent<LocalizedText>().Key = "common.temporaryScreen";
            return dim.gameObject;
        }

        public static Text Block(RectTransform card, float top, float height, int size, Color color, HudTheme theme)
        {
            RectTransform rect = UIBuild.Rect("Text", card, new Vector2(0.5f, 1f), new Vector2(0.5f, 1f), new Vector2(0f, -top), new Vector2(card.sizeDelta.x - 100f, height));
            return UIBuild.Label("Label", rect, "", theme.Font, size, color);
        }
    }
}
