using UnityEngine;
using UnityEngine.UI;

namespace DearMe.UI
{
    /// <summary>
    /// A centered paper card over a dimmed screen: header, scrolling body, footer.
    /// Shared by documents, photos and drills so they look like objects in the same world.
    /// </summary>
    public class CardFrame
    {
        public RectTransform Root;     // full-screen modal layer (blocks clicks to the world)
        public RectTransform Card;
        public Image CardBackground;
        public Text TitleKo;
        public Text TitleEn;
        public ScrollRect Scroll;
        public RectTransform Content;  // vertical layout; put body elements here
        public RectTransform Footer;   // horizontal layout; put buttons here

        const float HeaderHeight = 64f;

        public static CardFrame Build(string name, RectTransform parent, Theme theme, float maxWidth)
        {
            var f = new CardFrame();
            var dim = UIFactory.Image(name, parent, Theme.WithAlpha(Theme.Navy, 0.55f), raycast: true);
            f.Root = dim.rectTransform;
            UIFactory.Stretch(f.Root);

            f.Card = UIFactory.Rect("Card", f.Root);
            f.Card.anchorMin = f.Card.anchorMax = new Vector2(0.5f, 0.5f);
            f.Card.pivot = new Vector2(0.5f, 0.5f);
            f.Card.sizeDelta = new Vector2(maxWidth, 400f);
            var mw = f.Card.gameObject.AddComponent<MaxWidthFitter>();
            mw.maxWidth = maxWidth;
            mw.margin = Theme.Gutter;
            f.CardBackground = f.Card.gameObject.AddComponent<Image>();
            f.CardBackground.color = Theme.Paper;
            f.CardBackground.raycastTarget = true;
            UIFactory.Border(f.Card, Theme.Line, 1.5f);

            // Header
            var header = UIFactory.Rect("Header", f.Card);
            header.anchorMin = new Vector2(0, 1);
            header.anchorMax = new Vector2(1, 1);
            header.pivot = new Vector2(0.5f, 1);
            header.sizeDelta = new Vector2(0, HeaderHeight);
            header.anchoredPosition = Vector2.zero;
            UIFactory.Horizontal(header.gameObject, 14f, new RectOffset(32, 32, 18, 8), TextAnchor.LowerLeft);
            f.TitleKo = UIFactory.Text("TitleKo", header, "", theme.Strong, Theme.SmallSize, Theme.Accent, TextAnchor.LowerLeft, wrap: false);
            f.TitleEn = UIFactory.Text("TitleEn", header, "", theme.Body, Theme.TinySize, Theme.Muted, TextAnchor.LowerLeft, wrap: false);

            // Footer
            float footerHeight = theme.TouchMin + 28f;
            f.Footer = UIFactory.Rect("Footer", f.Card);
            f.Footer.anchorMin = new Vector2(0, 0);
            f.Footer.anchorMax = new Vector2(1, 0);
            f.Footer.pivot = new Vector2(0.5f, 0);
            f.Footer.sizeDelta = new Vector2(0, footerHeight);
            var fh = UIFactory.Horizontal(f.Footer.gameObject, 12f, new RectOffset(28, 28, 12, 16), TextAnchor.MiddleRight);
            fh.childForceExpandHeight = true;

            // Scrolling body between header and footer
            var viewport = UIFactory.Image("Viewport", f.Card, Theme.Clear, raycast: true).rectTransform;
            viewport.anchorMin = Vector2.zero;
            viewport.anchorMax = Vector2.one;
            viewport.offsetMin = new Vector2(0, footerHeight);
            viewport.offsetMax = new Vector2(0, -HeaderHeight);
            viewport.gameObject.AddComponent<RectMask2D>();

            f.Content = UIFactory.Rect("Content", viewport);
            f.Content.anchorMin = new Vector2(0, 1);
            f.Content.anchorMax = new Vector2(1, 1);
            f.Content.pivot = new Vector2(0.5f, 1);
            f.Content.offsetMin = f.Content.offsetMax = Vector2.zero;
            UIFactory.Vertical(f.Content.gameObject, 16f, new RectOffset(36, 36, 12, 20));
            UIFactory.FitVertical(f.Content.gameObject);

            f.Scroll = viewport.gameObject.AddComponent<ScrollRect>();
            f.Scroll.content = f.Content;
            f.Scroll.viewport = viewport;
            f.Scroll.horizontal = false;
            f.Scroll.vertical = true;
            f.Scroll.movementType = ScrollRect.MovementType.Clamped;
            f.Scroll.scrollSensitivity = 30f;

            var mh = f.Card.gameObject.AddComponent<MaxHeightFitter>();
            mh.content = f.Content;
            mh.chrome = HeaderHeight + footerHeight;
            mh.margin = Theme.Gutter;

            f.Root.gameObject.SetActive(false);
            return f;
        }

        public void Open(string titleKo, string titleEn)
        {
            TitleKo.text = titleKo ?? "";
            TitleEn.text = titleEn ?? "";
            UIFactory.DestroyChildren(Content);
            UIFactory.DestroyChildren(Footer);
            Scroll.verticalNormalizedPosition = 1f;
            Root.gameObject.SetActive(true);
            Root.SetAsLastSibling();
        }

        public void Close()
        {
            Root.gameObject.SetActive(false);
            UIFactory.DestroyChildren(Content);
            UIFactory.DestroyChildren(Footer);
        }

        public bool IsOpen => Root.gameObject.activeSelf;
    }
}
