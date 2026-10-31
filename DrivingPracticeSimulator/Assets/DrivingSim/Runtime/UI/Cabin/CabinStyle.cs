using DrivingSim.Localization;
using UnityEngine;
using UnityEngine.UI;

namespace DrivingSim.UI
{
    /// <summary>
    /// "Cabin Light" design tokens and building blocks (approved UI direction). Reference units = the
    /// 1080-tall canvas (CanvasScaler matches height), the same units as the design prototype
    /// (Tools/ui-prototype/cabin-light.html). Light marks state: a control at rest is dark smoked glass;
    /// when its state is on, its edge glows in its functional color.
    /// </summary>
    public static class CabinStyle
    {
        // Colors
        public static readonly Color Night = new Color32(0x0B, 0x11, 0x18, 0xFF);
        public static readonly Color Ink2 = new Color32(0x11, 0x1A, 0x23, 0xFF);
        public static readonly Color Ink3 = new Color32(0x18, 0x24, 0x2F, 0xFF);
        public static readonly Color GlassTop = new Color(0.133f, 0.188f, 0.243f, 0.80f);
        public static readonly Color GlassBottom = new Color(0.051f, 0.078f, 0.110f, 0.80f);
        public static readonly Color Line = new Color(0.73f, 0.84f, 0.92f, 0.14f);
        public static readonly Color Line2 = new Color(0.73f, 0.84f, 0.92f, 0.26f);
        public static readonly Color TextColor = new Color32(0xED, 0xF3, 0xF7, 0xFF);
        public static readonly Color Text2 = new Color32(0xA7, 0xB7, 0xC4, 0xFF);
        public static readonly Color Text3 = new Color32(0x6C, 0x7E, 0x8D, 0xFF);
        public static readonly Color Ice = new Color32(0xA3, 0xD5, 0xF2, 0xFF);
        public static readonly Color IceInk = new Color32(0x07, 0x1C, 0x2B, 0xFF);
        public static readonly Color Teal = new Color32(0x45, 0xD0, 0xB4, 0xFF);
        public static readonly Color Amber = new Color32(0xFF, 0xB5, 0x4A, 0xFF);
        public static readonly Color Red = new Color32(0xFF, 0x5D, 0x55, 0xFF);

        // Type scale (reference units)
        public const int Caption = 30, Body = 40, Sub = 48, Title = 64, Display = 104;
        // Geometry
        public const float Touch = 124f, RadiusS = 16f, RadiusM = 24f, RadiusL = 36f, Gutter = 24f;

        public static Font Font => HudTheme.Default.Font;

        // ---------- sprites (generated once, 9-sliced) ----------
        static Sprite glass, glassStrong, outline, solid, circleSolid, ring, tread;

        /// <summary>Smoked glass: vertical gradient, 1.5 px light border, a thin top highlight.</summary>
        public static Sprite Glass => glass != null ? glass : (glass = MakeRounded(96, 26, GlassTop, GlassBottom, Line, true));
        /// <summary>Opaque panel for sheets and dialogs.</summary>
        public static Sprite GlassStrong => glassStrong != null ? glassStrong : (glassStrong = MakeRounded(96, 36,
            new Color(0.082f, 0.125f, 0.161f, 1f), new Color(0.055f, 0.086f, 0.118f, 1f), Line, true));
        /// <summary>Edge-only ring used for "lit" states (tinted per state).</summary>
        public static Sprite Outline => outline != null ? outline : (outline = MakeOutline(96, 26, 3f));
        public static Sprite Solid => solid != null ? solid : (solid = MakeRounded(64, 18, Color.white, Color.white, Color.clear, false));
        public static Sprite CircleSolid => circleSolid != null ? circleSolid : (circleSolid = MakeRounded(64, 32, Color.white, Color.white, Color.clear, false));
        public static Sprite Ring => ring != null ? ring : (ring = MakeRingSprite(128, 3f));
        public static Sprite Tread => tread != null ? tread : (tread = MakeTread());

        static Sprite MakeRounded(int size, int radius, Color top, Color bottom, Color border, bool highlight)
        {
            var tex = new Texture2D(size, size, TextureFormat.RGBA32, false) { wrapMode = TextureWrapMode.Clamp, name = "CabinRounded" };
            var px = new Color[size * size];
            for (int y = 0; y < size; y++)
            {
                Color fill = Color.Lerp(bottom, top, y / (float)(size - 1));
                for (int x = 0; x < size; x++)
                {
                    float d = RoundedDistance(x + 0.5f, y + 0.5f, size, radius); // < 0 inside
                    float a = Mathf.Clamp01(0.5f - d);
                    Color c = fill;
                    if (border.a > 0f)
                    {
                        float edge = Mathf.Clamp01(1f - Mathf.Abs(d + 1.0f) / 1.2f);
                        c = Color.Lerp(c, new Color(border.r, border.g, border.b, 1f), edge * border.a / Mathf.Max(c.a, 0.01f) * 0.9f);
                    }
                    if (highlight && y >= size - 4 && d < -1.5f) c = Color.Lerp(c, new Color(1f, 1f, 1f, c.a), 0.07f);
                    c.a *= a;
                    px[y * size + x] = c;
                }
            }
            tex.SetPixels(px);
            tex.Apply(false, true);
            return Sprite.Create(tex, new UnityEngine.Rect(0, 0, size, size), new Vector2(0.5f, 0.5f), 100f, 0, SpriteMeshType.FullRect,
                new Vector4(radius + 2, radius + 2, radius + 2, radius + 2));
        }

        static Sprite MakeOutline(int size, int radius, float width)
        {
            var tex = new Texture2D(size, size, TextureFormat.RGBA32, false) { wrapMode = TextureWrapMode.Clamp, name = "CabinOutline" };
            var px = new Color[size * size];
            for (int y = 0; y < size; y++)
                for (int x = 0; x < size; x++)
                {
                    float d = RoundedDistance(x + 0.5f, y + 0.5f, size, radius);
                    float core = Mathf.Clamp01(width - Mathf.Abs(d + width * 0.5f)) ;
                    float glow = Mathf.Clamp01(1f - (-d - width) / 10f) * 0.35f * (d < -width ? 1f : 0f);
                    px[y * size + x] = new Color(1f, 1f, 1f, Mathf.Max(core, glow));
                }
            tex.SetPixels(px);
            tex.Apply(false, true);
            return Sprite.Create(tex, new UnityEngine.Rect(0, 0, size, size), new Vector2(0.5f, 0.5f), 100f, 0, SpriteMeshType.FullRect,
                new Vector4(radius + 2, radius + 2, radius + 2, radius + 2));
        }

        static Sprite MakeRingSprite(int size, float width)
        {
            var tex = new Texture2D(size, size, TextureFormat.RGBA32, false) { wrapMode = TextureWrapMode.Clamp, name = "CabinRing" };
            var px = new Color[size * size];
            float r = size * 0.5f - width - 1f;
            for (int y = 0; y < size; y++)
                for (int x = 0; x < size; x++)
                {
                    float d = Mathf.Abs(Vector2.Distance(new Vector2(x + 0.5f, y + 0.5f), new Vector2(size * 0.5f, size * 0.5f)) - r);
                    px[y * size + x] = new Color(1f, 1f, 1f, Mathf.Clamp01(width * 0.5f + 0.5f - d));
                }
            tex.SetPixels(px);
            tex.Apply(false, true);
            return Sprite.Create(tex, new UnityEngine.Rect(0, 0, size, size), new Vector2(0.5f, 0.5f));
        }

        static Sprite MakeTread()
        {
            const int w = 8, h = 32;
            var tex = new Texture2D(w, h, TextureFormat.RGBA32, false) { wrapMode = TextureWrapMode.Repeat, name = "CabinTread" };
            var px = new Color[w * h];
            for (int y = 0; y < h; y++)
                for (int x = 0; x < w; x++)
                    px[y * w + x] = new Color(1f, 1f, 1f, y < 10 ? 0.07f : 0f);
            tex.SetPixels(px);
            tex.Apply(false, true);
            return Sprite.Create(tex, new UnityEngine.Rect(0, 0, w, h), new Vector2(0.5f, 0.5f), 100f);
        }

        static float RoundedDistance(float x, float y, int size, float radius)
        {
            float half = size * 0.5f;
            float qx = Mathf.Abs(x - half) - (half - radius), qy = Mathf.Abs(y - half) - (half - radius);
            float outside = new Vector2(Mathf.Max(qx, 0f), Mathf.Max(qy, 0f)).magnitude;
            return outside + Mathf.Min(Mathf.Max(qx, qy), 0f) - radius;
        }

        // ---------- building blocks ----------

        public static RectTransform Rect(string name, Transform parent, Vector2 anchor, Vector2 pivot, Vector2 position, Vector2 size) =>
            UIBuild.Rect(name, parent, anchor, pivot, position, size);

        public static Image Fill(RectTransform rect, Sprite sprite, Color color, bool raycast = false)
        {
            var image = rect.gameObject.GetComponent<Image>();
            if (image == null) image = rect.gameObject.AddComponent<Image>();
            image.sprite = sprite;
            image.type = sprite != null && sprite.border != Vector4.zero ? UnityEngine.UI.Image.Type.Sliced : UnityEngine.UI.Image.Type.Simple;
            image.color = color;
            image.raycastTarget = raycast;
            return image;
        }

        public static Text Label(string name, Transform parent, string value, int size, Color color, TextAnchor anchor = TextAnchor.MiddleCenter, FontStyle style = FontStyle.Normal)
        {
            Text text = UIBuild.Label(name, parent, value, Font, size, color, anchor);
            text.fontStyle = style;
            text.verticalOverflow = VerticalWrapMode.Overflow;
            return text;
        }

        public static Text Localized(string name, Transform parent, string key, int size, Color color, TextAnchor anchor = TextAnchor.MiddleCenter, FontStyle style = FontStyle.Normal)
        {
            Text text = Label(name, parent, Loc.T(key), size, color, anchor, style);
            text.gameObject.AddComponent<LocalizedText>().Key = key;
            return text;
        }

        /// <summary>Glow edge child, hidden until <see cref="SetLit"/>. Returns the edge image.</summary>
        public static Image AddLitEdge(RectTransform host, Color color)
        {
            RectTransform edge = Rect("Lit", host, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, Vector2.zero);
            UIBuild.Stretch(edge);
            Image image = Fill(edge, Outline, color);
            image.enabled = false;
            return image;
        }

        public static void SetLit(Image edge, bool on, Color? color = null)
        {
            if (edge == null) return;
            edge.enabled = on;
            if (color.HasValue) edge.color = color.Value;
        }

        /// <summary>
        /// Touch control acting on pointer down (HoldButton). Background is smoked glass; style "primary" is
        /// an ice-blue fill with dark text, "ghost" has no background.
        /// </summary>
        public static HoldButton Button(string name, Transform parent, Vector2 anchor, Vector2 pivot, Vector2 position, Vector2 size,
            string labelKey, out Text label, ButtonStyle style = ButtonStyle.Glass, int fontSize = Body)
        {
            RectTransform rect = Rect(name, parent, anchor, pivot, position, size);
            // Glass is drawn slightly dimmed at rest so a press can brighten it (Graphic colors can't exceed 1).
            Color normal = style == ButtonStyle.Primary ? Ice : style == ButtonStyle.Ghost ? new Color(1f, 1f, 1f, 0.001f) : new Color(0.86f, 0.88f, 0.9f, 1f);
            Color pressed = style == ButtonStyle.Primary ? new Color(0.84f, 0.93f, 0.99f) : style == ButtonStyle.Ghost ? new Color(1f, 1f, 1f, 0.06f) : Color.white;
            Fill(rect, style == ButtonStyle.Primary ? Solid : style == ButtonStyle.Ghost ? Solid : Glass, normal, raycast: true);
            HoldButton button = rect.gameObject.AddComponent<HoldButton>();
            button.normalColor = normal;
            button.pressedColor = pressed;
            rect.GetComponent<Image>().color = normal; // HoldButton.Awake already ran with its default color in Play Mode
            label = null;
            if (!string.IsNullOrEmpty(labelKey))
            {
                label = Localized("Label", rect, labelKey, fontSize, style == ButtonStyle.Primary ? IceInk : TextColor, TextAnchor.MiddleCenter, FontStyle.Bold);
                label.resizeTextForBestFit = true;
                label.resizeTextMinSize = Mathf.Max(18, fontSize - 12);
                label.resizeTextMaxSize = fontSize;
                var lr = (RectTransform)label.transform;
                lr.offsetMin = new Vector2(20f, 6f);
                lr.offsetMax = new Vector2(-20f, -6f);
            }
            return button;
        }

        /// <summary>Monochrome icon: Codex's UI sprite if present (Resources/UI/Sprites/&lt;name&gt;), else a generated fallback.</summary>
        public static Image Icon(string resource, Transform parent, Vector2 position, float size, Color color, Sprite fallback = null)
        {
            RectTransform rect = Rect("Icon_" + resource, parent, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), position, new Vector2(size, size));
            Sprite sprite = Resources.Load<Sprite>("UI/Sprites/" + resource);
            Image image = Fill(rect, sprite != null ? sprite : fallback, color);
            image.type = UnityEngine.UI.Image.Type.Simple;
            image.preserveAspect = true;
            return image;
        }
    }

    public enum ButtonStyle { Glass, Primary, Ghost }
}
