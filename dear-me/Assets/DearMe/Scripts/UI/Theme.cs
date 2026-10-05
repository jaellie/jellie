using UnityEngine;

namespace DearMe.UI
{
    /// <summary>Palette, fonts and sizes. One restrained accent; everything else is paper and ink.</summary>
    public class Theme
    {
        public Font Body;    // Pretendard Regular: dialogue, documents, UI, English support text
        public Font Strong;  // Pretendard SemiBold: titles, speaker names

        public static readonly Color Paper = Hex("#F4EFE4");
        public static readonly Color PaperDim = Hex("#E9E2D3");
        public static readonly Color Ink = Hex("#1E2433");
        public static readonly Color Charcoal = Hex("#33373F");
        public static readonly Color Muted = Hex("#7D828C");
        public static readonly Color Line = Hex("#CFC6B4");
        public static readonly Color Accent = Hex("#A86A35");
        public static readonly Color Navy = Hex("#1B2130");
        public static readonly Color Cream = Hex("#EFE6D2");
        public static readonly Color Clear = new Color(0, 0, 0, 0);

        public const int TitleSize = 84;
        public const int HeadingSize = 34;
        public const int BodySize = 30;
        public const int ChoiceSize = 28;
        public const int SmallSize = 22;
        public const int TinySize = 18;

        public const float Gutter = 24f;
        public const float Padding = 28f;

        /// <summary>Minimum height of anything tappable, in canvas units (≈44pt on phones).</summary>
        public float TouchMin = 60f;

        public static Color Hex(string hex)
        {
            return ColorUtility.TryParseHtmlString(hex, out var c) ? c : Color.magenta;
        }

        public static Color WithAlpha(Color c, float a)
        {
            c.a = a;
            return c;
        }
    }
}
