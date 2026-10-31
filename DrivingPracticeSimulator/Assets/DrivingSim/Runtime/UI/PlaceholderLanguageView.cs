using System;
using DrivingSim.Core;
using DrivingSim.Localization;
using DrivingSim.Startup;
using UnityEngine;
using UnityEngine.UI;

namespace DrivingSim.UI
{
    public class PlaceholderLanguageView : MonoBehaviour, ILanguageSelectionView
    {
        GameObject root;
        Text title;
        HoldButton korean, english, cancel;
        Action<Language> selected;
        Action cancelled;
        bool consumed;

        public static PlaceholderLanguageView Create()
        {
            HudTheme theme = HudTheme.Default;
            Transform safe = DrivingHUDController.CreateCanvas("LanguageCanvas", 100);
            var view = safe.root.gameObject.AddComponent<PlaceholderLanguageView>();
            view.root = AutomotiveLayout.Modal(safe, theme, new Vector2(1200f, 660f), out RectTransform card);
            view.title = StartupTypography.Block(card, 70f, 130f, 38, theme);
            view.title.fontStyle = FontStyle.Bold;
            view.korean = UIBuild.Button("Korean", card, new Vector2(0.5f, 1f), new Vector2(0.5f, 1f),
                new Vector2(-265f, -250f), new Vector2(490f, 156f),
                LocalizationService.In(Language.Korean, "language.name.ko"), theme, 42, out _);
            view.english = UIBuild.Button("English", card, new Vector2(0.5f, 1f), new Vector2(0.5f, 1f),
                new Vector2(265f, -250f), new Vector2(490f, 156f),
                LocalizationService.In(Language.EnglishUS, "language.name.en"), theme, 42, out _);
            view.cancel = UIBuild.Button("Cancel", card, new Vector2(0.5f, 0f), new Vector2(0.5f, 0f),
                new Vector2(0f, 58f), new Vector2(360f, 84f), "", theme, 30, out Text label);
            label.gameObject.AddComponent<LocalizedText>().Key = "common.cancel";
            view.korean.Pressed += () => view.Choose(Language.Korean);
            view.english.Pressed += () => view.Choose(Language.EnglishUS);
            view.cancel.Pressed += view.Cancel;
            view.root.SetActive(false);
            return view;
        }

        public void Show(Language current, bool allowCancel, Action<Language> onSelected, Action onCancelled)
        {
            selected = onSelected;
            cancelled = onCancelled;
            consumed = false;
            title.text = LocalizationService.In(Language.Korean, "language.title") + "\n" +
                LocalizationService.In(Language.EnglishUS, "language.title");
            korean.SetToggled(current == Language.Korean);
            english.SetToggled(current == Language.EnglishUS);
            cancel.gameObject.SetActive(allowCancel);
            root.SetActive(true);
        }

        public void Hide()
        {
            consumed = true;
            selected = null;
            cancelled = null;
            root.SetActive(false);
        }

        void Choose(Language language)
        {
            if (consumed) return;
            consumed = true;
            Action<Language> callback = selected;
            selected = null;
            cancelled = null;
            callback?.Invoke(language);
        }

        void Cancel()
        {
            if (consumed || !cancel.gameObject.activeSelf) return;
            consumed = true;
            Action callback = cancelled;
            selected = null;
            cancelled = null;
            callback?.Invoke();
        }
    }

}
