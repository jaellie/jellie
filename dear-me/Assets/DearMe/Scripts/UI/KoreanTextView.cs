using DearMe.Content;
using UnityEngine;
using UnityEngine.UI;

namespace DearMe.UI
{
    /// <summary>
    /// Renders a tokenized Korean line as a wrapping row of TokenViews. Used everywhere Korean
    /// appears (dialogue, choices, documents, drills, photo labels), so translation help works
    /// the same in every context.
    /// </summary>
    public class KoreanTextView : MonoBehaviour
    {
        public FlowLayoutGroup Flow { get; private set; }
        public DialogueLine Line { get; private set; }

        TooltipController tooltips;
        Theme theme;

        public static KoreanTextView Create(string name, Transform parent, Theme theme, TooltipController tooltips)
        {
            var rt = UIFactory.Rect(name, parent);
            var view = rt.gameObject.AddComponent<KoreanTextView>();
            view.theme = theme;
            view.tooltips = tooltips;
            view.Flow = rt.gameObject.AddComponent<FlowLayoutGroup>();
            view.Flow.childAlignment = TextAnchor.UpperLeft;
            return view;
        }

        public void Clear()
        {
            Line = null;
            UIFactory.DestroyChildren(transform);
        }

        /// <param name="sentenceMarker">Adds a small "EN" token at the end for whole-sentence translation.</param>
        /// <param name="forwardClicks">Taps go to the enclosing button (choices, chunks); long press still shows help.</param>
        public void SetLine(DialogueLine line, Font font, int size, Color color, bool sentenceMarker = false,
            bool forwardClicks = false, float lineAlign = 0f)
        {
            Clear();
            Line = line;
            Flow.lineAlign = lineAlign;
            Flow.spacingX = Mathf.Round(size * 0.32f);
            Flow.spacingY = Mathf.Round(size * 0.28f);
            if (line == null) return;

            var tokens = line.tokens;
            // Missing token data: fall back to space-separated words so the line still shows
            // and still offers the sentence translation.
            if (tokens.Count == 0 && line.koreanText.Length > 0)
                tokens = KoreanMarkup.Parse(line.koreanText);

            foreach (var token in tokens)
                AddToken(token, line, font, size, color, false, forwardClicks);

            if (sentenceMarker && line.englishTranslation.Length > 0)
            {
                var marker = new Token { korean = "EN", type = TokenType.Phrase };
                var tv = AddToken(marker, line, theme.Body, Mathf.Max(Theme.TinySize, size - 12), Theme.WithAlpha(Theme.Muted, 0.9f), true, forwardClicks);
                tv.gameObject.name = "SentenceMarker";
            }
        }

        TokenView AddToken(Token token, DialogueLine line, Font font, int size, Color color, bool sentenceMode, bool forwardClicks)
        {
            var rt = UIFactory.Rect("Token", transform);
            var go = rt.gameObject;
            if (token.glue) go.AddComponent<FlowGlue>();
            var layout = UIFactory.Vertical(go, 0f);
            layout.childAlignment = TextAnchor.UpperCenter;

            // An invisible Image makes the whole token box (not just glyph pixels) hoverable/tappable.
            var hit = go.AddComponent<Image>();
            hit.color = Theme.Clear;
            hit.raycastTarget = true;

            var main = UIFactory.Text("Ko", rt, token.korean, font, size, color, TextAnchor.LowerCenter, wrap: false);
            var underline = UIFactory.Image("Underline", rt, Theme.WithAlpha(color, 0.2f));
            UIFactory.Layout(underline.gameObject, minHeight: 1.5f, preferredHeight: 1.5f);

            Text gloss = null;
            if (!sentenceMode && token.HasInfo)
            {
                string g = tooltips.GlossText(token);
                if (g.Length > 0)
                {
                    gloss = UIFactory.Text("Gloss", rt, g, theme.Body, Mathf.Max(14, Mathf.RoundToInt(size * 0.5f)),
                        Theme.WithAlpha(Theme.Accent, 0.95f), TextAnchor.UpperCenter, wrap: false);
                    gloss.gameObject.SetActive(false);
                }
            }

            var view = go.AddComponent<TokenView>();
            view.Init(tooltips, token, line, main, gloss, underline, sentenceMode, forwardClicks);
            return view;
        }
    }
}
