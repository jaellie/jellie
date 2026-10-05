using System;
using DearMe.Content;
using DearMe.Settings;
using DearMe.Story;
using UnityEngine;
using UnityEngine.UI;

namespace DearMe.UI
{
    public static class ScreenParts
    {
        /// <summary>Outlined button for dark backgrounds (title screen, HUD).</summary>
        public static Button LightButton(Transform parent, Theme theme, string ko, string en, Action onClick, float width = 0f)
        {
            var b = UIFactory.BareButton("Button", parent, theme, () => onClick());
            var colors = b.colors;
            colors.normalColor = Theme.WithAlpha(Theme.Navy, 0.35f);
            colors.highlightedColor = Theme.WithAlpha(Theme.Paper, 0.12f);
            colors.pressedColor = Theme.WithAlpha(Theme.Paper, 0.22f);
            colors.selectedColor = colors.normalColor;
            b.colors = colors;
            foreach (Transform child in b.transform)
                if (child.name.StartsWith("Border")) child.GetComponent<Image>().color = Theme.WithAlpha(Theme.Paper, 0.55f);
            UIFactory.Vertical(b.gameObject, 2f, new RectOffset(24, 24, 10, 10), TextAnchor.MiddleLeft);
            UIFactory.Text("Ko", b.transform, ko, theme.Body, Theme.ChoiceSize, Theme.Paper, TextAnchor.MiddleLeft);
            if (!string.IsNullOrEmpty(en))
                UIFactory.Text("En", b.transform, en, theme.Body, Theme.TinySize, Theme.WithAlpha(Theme.Paper, 0.6f), TextAnchor.MiddleLeft);
            if (width > 0f) UIFactory.Layout(b.gameObject, minHeight: theme.TouchMin, preferredWidth: width);
            return b;
        }

        public static RectTransform ModalCard(string name, RectTransform layer, float width, out RectTransform root)
        {
            var dim = UIFactory.Image(name, layer, Theme.WithAlpha(Theme.Navy, 0.6f), raycast: true);
            root = dim.rectTransform;
            UIFactory.Stretch(root);
            var card = UIFactory.Rect("Card", root);
            card.anchorMin = card.anchorMax = new Vector2(0.5f, 0.5f);
            card.pivot = new Vector2(0.5f, 0.5f);
            var mw = card.gameObject.AddComponent<MaxWidthFitter>();
            mw.maxWidth = width;
            mw.margin = Theme.Gutter;
            card.sizeDelta = new Vector2(width, 100f);
            var bg = card.gameObject.AddComponent<Image>();
            bg.color = Theme.Paper;
            bg.raycastTarget = true;
            UIFactory.Border(card, Theme.Line, 1.5f);
            UIFactory.Vertical(card.gameObject, 14f, new RectOffset(36, 36, 30, 30));
            UIFactory.FitVertical(card.gameObject);
            root.gameObject.SetActive(false);
            return card;
        }
    }

    public class MainMenuView : MonoBehaviour
    {
        RectTransform root;
        Button continueButton;
        public Action OnNew, OnContinue, OnSettings;

        public bool IsOpen => root.gameObject.activeSelf;

        public void Build(RectTransform parent, Theme theme, ContentDatabase db)
        {
            root = UIFactory.Rect("MainMenu", parent);
            UIFactory.Stretch(root);
            var shade = root.gameObject.AddComponent<Image>();
            shade.color = Theme.WithAlpha(Theme.Navy, 0.45f);
            shade.raycastTarget = true;

            var safe = UIFactory.Rect("Safe", root);
            UIFactory.Stretch(safe);
            safe.gameObject.AddComponent<SafeAreaFitter>();
            var column = UIFactory.Rect("Column", safe);
            column.anchorMin = new Vector2(0f, 0f);
            column.anchorMax = new Vector2(0f, 1f);
            column.pivot = new Vector2(0f, 0.5f);
            column.sizeDelta = new Vector2(520f, 0f);
            column.anchoredPosition = new Vector2(Theme.Gutter * 2f, 0f);
            var narrow = column.gameObject.AddComponent<MaxWidthFitter>();
            narrow.maxWidth = 520f;
            narrow.margin = Theme.Gutter * 2f;
            var v = UIFactory.Vertical(column.gameObject, 14f, new RectOffset(0, 0, 60, 60), TextAnchor.MiddleLeft);
            v.childForceExpandWidth = true;

            UIFactory.Text("Title", column, "Dear Me,", theme.Strong, Theme.TitleSize, Theme.Paper, TextAnchor.MiddleLeft, wrap: false);
            UIFactory.Text("TitleKo", column, db.UiKo("title"), theme.Strong, Theme.HeadingSize + 4, Theme.WithAlpha(Theme.Paper, 0.75f), TextAnchor.MiddleLeft, wrap: false);
            UIFactory.Layout(UIFactory.Rect("Space", column).gameObject, minHeight: 36f, preferredHeight: 36f);

            continueButton = ScreenParts.LightButton(column, theme, db.UiKo("menu_continue"), db.UiEn("menu_continue"), () => OnContinue?.Invoke());
            ScreenParts.LightButton(column, theme, db.UiKo("menu_new"), db.UiEn("menu_new"), () => OnNew?.Invoke());
            ScreenParts.LightButton(column, theme, db.UiKo("menu_settings"), db.UiEn("menu_settings"), () => OnSettings?.Invoke());

            UIFactory.Layout(UIFactory.Rect("Space", column).gameObject, minHeight: 24f, preferredHeight: 24f);
            UIFactory.Text("Hint", column, db.UiKo("menu_hint") + "\n" + db.UiEn("menu_hint"), theme.Body, Theme.TinySize, Theme.WithAlpha(Theme.Paper, 0.55f));
            root.gameObject.SetActive(false);
        }

        public void Show(bool canContinue)
        {
            continueButton.gameObject.SetActive(canContinue);
            root.gameObject.SetActive(true);
        }

        public void Hide() => root.gameObject.SetActive(false);
    }

    public class ConfirmDialog : MonoBehaviour
    {
        RectTransform root;
        RectTransform card;
        Theme theme;
        ContentDatabase db;
        Action onYes;

        public bool IsOpen => root.gameObject.activeSelf;

        public void Build(RectTransform layer, Theme theme, ContentDatabase db)
        {
            this.theme = theme;
            this.db = db;
            card = ScreenParts.ModalCard("Confirm", layer, 640f, out root);
        }

        public void Ask(string id, Action yes)
        {
            UIFactory.DestroyChildren(card);
            UIFactory.Border(card, Theme.Line, 1.5f);
            onYes = yes;
            UIFactory.Text("Message", card, db.UiKo(id), theme.Body, Theme.BodySize - 2, Theme.Ink);
            UIFactory.Text("English", card, db.UiEn(id), theme.Body, Theme.SmallSize - 2, Theme.Muted);
            var row = UIFactory.Rect("Buttons", card);
            UIFactory.Horizontal(row.gameObject, 12f, null, TextAnchor.MiddleRight);
            var no = UIFactory.Button("No", row, theme, db.UiKo("no"), db.UiEn("no"), Cancel);
            UIFactory.Layout(no.gameObject, minHeight: theme.TouchMin, preferredWidth: 160f);
            var ok = UIFactory.Button("Yes", row, theme, db.UiKo("yes"), db.UiEn("yes"), Confirm, filled: true);
            UIFactory.Layout(ok.gameObject, minHeight: theme.TouchMin, preferredWidth: 160f);
            root.gameObject.SetActive(true);
            root.SetAsLastSibling();
        }

        void Confirm()
        {
            var cb = onYes;
            Cancel();
            cb?.Invoke();
        }

        public void Cancel()
        {
            onYes = null;
            root.gameObject.SetActive(false);
        }
    }

    public class PauseMenu : MonoBehaviour
    {
        RectTransform root;
        public Action OnResume, OnSettings, OnTitle;
        public bool IsOpen => root.gameObject.activeSelf;

        public void Build(RectTransform layer, Theme theme, ContentDatabase db)
        {
            var card = ScreenParts.ModalCard("Pause", layer, 520f, out root);
            UIFactory.Text("Title", card, db.UiKo("title"), theme.Strong, Theme.HeadingSize, Theme.Ink);
            UIFactory.Button("Resume", card, theme, db.UiKo("menu_resume"), db.UiEn("menu_resume"), () => OnResume?.Invoke(), filled: true);
            UIFactory.Button("Settings", card, theme, db.UiKo("menu_settings"), db.UiEn("menu_settings"), () => OnSettings?.Invoke());
            UIFactory.Button("Title", card, theme, db.UiKo("menu_to_title"), db.UiEn("menu_to_title"), () => OnTitle?.Invoke());
        }

        public void Show() { root.gameObject.SetActive(true); root.SetAsLastSibling(); }
        public void Hide() => root.gameObject.SetActive(false);
    }

    public class SettingsView : MonoBehaviour
    {
        RectTransform root;
        RectTransform card;
        Theme theme;
        ContentDatabase db;
        GameSettings settings;
        public Action OnChanged;
        public Action OnDeleteSave;

        public bool IsOpen => root.gameObject.activeSelf;

        public void Build(RectTransform layer, Theme theme, ContentDatabase db, GameSettings settings)
        {
            this.theme = theme;
            this.db = db;
            this.settings = settings;
            card = ScreenParts.ModalCard("Settings", layer, 760f, out root);
        }

        public void Show()
        {
            Rebuild();
            root.gameObject.SetActive(true);
            root.SetAsLastSibling();
        }

        public void Hide() => root.gameObject.SetActive(false);

        void Rebuild()
        {
            UIFactory.DestroyChildren(card);
            UIFactory.Border(card, Theme.Line, 1.5f);
            UIFactory.Text("Title", card, db.UiKo("settings_title"), theme.Strong, Theme.HeadingSize, Theme.Ink);

            int support = (int)settings.support;
            Row("settings_support", "support_" + support, () => Step(ref settings.support, -1), () => Step(ref settings.support, 1));
            Row("settings_text", "text_" + settings.textScaleIndex,
                () => settings.textScaleIndex = Mathf.Max(0, settings.textScaleIndex - 1),
                () => settings.textScaleIndex = Mathf.Min(GameSettings.TextScales.Length - 1, settings.textScaleIndex + 1));
            RowValue("settings_sound", Mathf.RoundToInt(settings.soundVolume * 100f) + "%",
                () => settings.soundVolume = Mathf.Clamp01(settings.soundVolume - 0.1f),
                () => settings.soundVolume = Mathf.Clamp01(settings.soundVolume + 0.1f));
            RowValue("settings_music", Mathf.RoundToInt(settings.musicVolume * 100f) + "%",
                () => settings.musicVolume = Mathf.Clamp01(settings.musicVolume - 0.1f),
                () => settings.musicVolume = Mathf.Clamp01(settings.musicVolume + 0.1f));
            Row("settings_motion", settings.reducedMotion ? "on" : "off",
                () => settings.reducedMotion = !settings.reducedMotion,
                () => settings.reducedMotion = !settings.reducedMotion);

            var bottom = UIFactory.Rect("Bottom", card);
            UIFactory.Horizontal(bottom.gameObject, 12f, new RectOffset(0, 0, 12, 0), TextAnchor.MiddleRight);
            var del = UIFactory.Button("Delete", bottom, theme, db.UiKo("settings_reset"), db.UiEn("settings_reset"), () => OnDeleteSave?.Invoke(), Theme.SmallSize);
            UIFactory.Layout(del.gameObject, minHeight: theme.TouchMin, flexibleWidth: 1f);
            var close = UIFactory.Button("Close", bottom, theme, db.UiKo("close"), db.UiEn("close"), Hide, filled: true);
            UIFactory.Layout(close.gameObject, minHeight: theme.TouchMin, preferredWidth: 160f);
        }

        static void Step(ref LanguageSupportLevel level, int delta)
        {
            int v = ((int)level + delta + 3) % 3;
            level = (LanguageSupportLevel)v;
        }

        void Row(string labelId, string valueId, Action minus, Action plus) =>
            RowValue(labelId, db.UiKo(valueId) + "\n" + db.UiEn(valueId), minus, plus);

        void RowValue(string labelId, string value, Action minus, Action plus)
        {
            var row = UIFactory.Rect("Row", card);
            UIFactory.Horizontal(row.gameObject, 10f, null, TextAnchor.MiddleLeft);
            var label = UIFactory.Rect("Label", row);
            UIFactory.Vertical(label.gameObject, 0f);
            UIFactory.Layout(label.gameObject, flexibleWidth: 1f, minWidth: 120f);
            UIFactory.Text("Ko", label, db.UiKo(labelId), theme.Body, Theme.SmallSize + 2, Theme.Ink);
            UIFactory.Text("En", label, db.UiEn(labelId), theme.Body, Theme.TinySize, Theme.Muted);

            var left = UIFactory.Button("Minus", row, theme, "‹", null, () => { minus(); Changed(); });
            UIFactory.Layout(left.gameObject, minHeight: theme.TouchMin, preferredWidth: theme.TouchMin, minWidth: theme.TouchMin);
            var val = UIFactory.Text("Value", row, value, theme.Body, Theme.SmallSize - 2, Theme.Ink, TextAnchor.MiddleCenter);
            UIFactory.Layout(val.gameObject, preferredWidth: 220f, minWidth: 120f);
            var right = UIFactory.Button("Plus", row, theme, "›", null, () => { plus(); Changed(); });
            UIFactory.Layout(right.gameObject, minHeight: theme.TouchMin, preferredWidth: theme.TouchMin, minWidth: theme.TouchMin);
        }

        void Changed()
        {
            OnChanged?.Invoke();
            Rebuild();
        }
    }

    public class EndCardView : MonoBehaviour
    {
        RectTransform root;
        RectTransform column;
        Theme theme;
        ContentDatabase db;
        Action onDone;

        public bool IsOpen => root.gameObject.activeSelf;

        public void Build(RectTransform parent, Theme theme, ContentDatabase db)
        {
            this.theme = theme;
            this.db = db;
            var bg = UIFactory.Image("EndCard", parent, Theme.Paper, raycast: true);
            root = bg.rectTransform;
            UIFactory.Stretch(root);
            var safe = UIFactory.Rect("Safe", root);
            UIFactory.Stretch(safe);
            safe.gameObject.AddComponent<SafeAreaFitter>();
            column = UIFactory.Rect("Column", safe);
            column.anchorMin = column.anchorMax = new Vector2(0.5f, 0.5f);
            column.pivot = new Vector2(0.5f, 0.5f);
            var mw = column.gameObject.AddComponent<MaxWidthFitter>();
            mw.maxWidth = 760f;
            UIFactory.Vertical(column.gameObject, 16f, null, TextAnchor.MiddleCenter);
            UIFactory.FitVertical(column.gameObject);
            root.gameObject.SetActive(false);
        }

        public void Show(StoryNode end, bool english, Action done)
        {
            onDone = done;
            UIFactory.DestroyChildren(column);
            UIFactory.Text("Title", column, end.titleKo, theme.Strong, Theme.HeadingSize + 6, Theme.Ink, TextAnchor.MiddleCenter);
            if (english) UIFactory.Text("TitleEn", column, end.titleEn, theme.Body, Theme.SmallSize, Theme.Muted, TextAnchor.MiddleCenter);
            UIFactory.Layout(UIFactory.Rect("Space", column).gameObject, minHeight: 20f, preferredHeight: 20f);
            UIFactory.Text("Body", column, end.bodyKo, theme.Body, Theme.BodySize, Theme.Charcoal, TextAnchor.MiddleCenter);
            if (english) UIFactory.Text("BodyEn", column, end.bodyEn, theme.Body, Theme.SmallSize, Theme.Muted, TextAnchor.MiddleCenter);
            UIFactory.Text("Thanks", column, db.UiKo("end_thanks"), theme.Body, Theme.SmallSize, Theme.Muted, TextAnchor.MiddleCenter);
            var row = UIFactory.Rect("Row", column);
            UIFactory.Horizontal(row.gameObject, 0f, null, TextAnchor.MiddleCenter);
            var b = UIFactory.Button("Return", row, theme, db.UiKo("end_return"), db.UiEn("end_return"), Done, filled: true);
            UIFactory.Layout(b.gameObject, minHeight: theme.TouchMin, preferredWidth: 260f);
            root.gameObject.SetActive(true);
        }

        void Done()
        {
            var cb = onDone;
            onDone = null;
            Hide();
            cb?.Invoke();
        }

        public void Hide() => root.gameObject.SetActive(false);
    }
}
