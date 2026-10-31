using UnityEngine;
using UnityEngine.UI;

namespace DrivingSim.UI
{
    /// <summary>
    /// Colors and sprites for the driving HUD. Create an asset (Create → DrivingSim → HUD Theme) and
    /// assign your own vector sprites to restyle the HUD; empty sprite slots fall back to generated
    /// rounded rectangles and circles.
    /// </summary>
    [CreateAssetMenu(menuName = "DrivingSim/HUD Theme", fileName = "HudTheme")]
    public class HudTheme : ScriptableObject
    {
        [Header("Colors")]
        public Color panel = new Color(0.027f, 0.067f, 0.114f, 0.78f);
        public Color panelStrong = new Color(0.045f, 0.085f, 0.14f, 1f);
        public Color text = new Color(0.92f, 0.97f, 1f);
        public Color iceBlue = new Color(0.725f, 0.867f, 0.957f);
        public Color textMuted = new Color(0.65f, 0.76f, 0.84f);
        [Tooltip("Selected gear and active toggles.")]
        public Color accentBlue = new Color(0.12f, 0.40f, 0.64f);
        public Color indicatorAmber = new Color(1f, 0.66f, 0.1f);
        public Color brakeRed = new Color(0.95f, 0.3f, 0.26f);
        public Color acceleratorGreen = new Color(0.12f, 0.73f, 0.66f);
        public Color warning = new Color(1f, 0.82f, 0.3f);

        [Header("Sprites (optional; generated if empty)")]
        public Sprite roundedPanel;
        public Sprite circle;
        public Sprite turnArrowLeft;
        public Sprite turnArrowRight;
        public Sprite carMarker;

        public Font font;

        static HudTheme fallback;

        public static HudTheme Default
        {
            get
            {
                if (fallback == null)
                {
                    fallback = Resources.Load<HudTheme>("UI/MidnightTheme");
                    if (fallback == null)
                    {
                        fallback = CreateInstance<HudTheme>();
                        fallback.name = "HudTheme (defaults)";
                    }
                }
                return fallback;
            }
        }

        public Sprite RoundedPanel => roundedPanel != null ? roundedPanel : UISprites.RoundedRect;
        public Sprite Circle => circle != null ? circle : UISprites.Circle;
        static Font bundledFont;
        public Font Font
        {
            get
            {
                if (font != null) return font;
                if (bundledFont == null) bundledFont = Resources.Load<Font>("UI/Fonts/JellieUI-Regular");
                return bundledFont != null ? bundledFont : Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            }
        }

        public Sprite LeftArrow => turnArrowLeft != null ? turnArrowLeft : UISprites.TriangleLeft;
        public Sprite RightArrow => turnArrowRight != null ? turnArrowRight : UISprites.TriangleRight;
        public Sprite CarMarker => carMarker != null ? carMarker : UISprites.TriangleUp;
    }

    /// <summary>Placeholder sprites generated at runtime (no texture assets needed).</summary>
    public static class UISprites
    {
        static Sprite roundedRect;
        static Sprite circle;

        public static Sprite RoundedRect => roundedRect != null ? roundedRect : (roundedRect = CreateRoundedRect(64, 18));
        public static Sprite Circle => circle != null ? circle : (circle = CreateRoundedRect(64, 32));

        static Sprite ring;
        /// <summary>Thin ring (outline circle) for the steering gesture area.</summary>
        public static Sprite Ring => ring != null ? ring : (ring = CreateRing(128, 5f));

        static Sprite CreateRing(int size, float thickness)
        {
            var texture = new Texture2D(size, size, TextureFormat.RGBA32, false) { wrapMode = TextureWrapMode.Clamp, name = "UI_Ring" };
            var pixels = new Color32[size * size];
            float c = size * 0.5f, outer = c - 1f;
            for (int y = 0; y < size; y++)
                for (int x = 0; x < size; x++)
                {
                    float r = Mathf.Sqrt((x + 0.5f - c) * (x + 0.5f - c) + (y + 0.5f - c) * (y + 0.5f - c));
                    float inside = Mathf.Clamp01(outer - r + 0.5f) * Mathf.Clamp01(r - (outer - thickness) + 0.5f);
                    pixels[y * size + x] = new Color32(255, 255, 255, (byte)(inside * 255f));
                }
            texture.SetPixels32(pixels);
            texture.Apply(false, true);
            return Sprite.Create(texture, new Rect(0, 0, size, size), new Vector2(0.5f, 0.5f), 100f);
        }

        static Sprite triangleRight;
        static Sprite triangleLeft;
        static Sprite triangleUp;
        public static Sprite TriangleRight => triangleRight != null ? triangleRight : (triangleRight = CreateTriangle(64, 0));
        public static Sprite TriangleLeft => triangleLeft != null ? triangleLeft : (triangleLeft = CreateTriangle(64, 1));
        public static Sprite TriangleUp => triangleUp != null ? triangleUp : (triangleUp = CreateTriangle(64, 2));

        /// <summary>direction: 0 = right, 1 = left, 2 = up.</summary>
        static Sprite CreateTriangle(int size, int direction)
        {
            var texture = new Texture2D(size, size, TextureFormat.RGBA32, false) { wrapMode = TextureWrapMode.Clamp, name = $"UI_Triangle_{direction}" };
            var pixels = new Color32[size * size];
            float half = size * 0.5f;
            for (int y = 0; y < size; y++)
            {
                for (int x = 0; x < size; x++)
                {
                    float u = x + 0.5f, v = y + 0.5f;
                    float along = direction == 0 ? u : direction == 1 ? size - u : v;   // 0 at the base, size at the tip
                    float across = direction == 2 ? Mathf.Abs(u - half) : Mathf.Abs(v - half);
                    float edge = (size - along) * 0.5f - across;                         // > 0 inside
                    pixels[y * size + x] = new Color32(255, 255, 255, (byte)(Mathf.Clamp01(edge + 0.5f) * 255f));
                }
            }
            texture.SetPixels32(pixels);
            texture.Apply(false, true);
            return Sprite.Create(texture, new Rect(0, 0, size, size), new Vector2(0.5f, 0.5f), 100f);
        }

        static Sprite CreateRoundedRect(int size, int radius)
        {
            var texture = new Texture2D(size, size, TextureFormat.RGBA32, false)
            {
                name = $"UI_Rounded_{radius}",
                wrapMode = TextureWrapMode.Clamp,
                filterMode = FilterMode.Bilinear,
            };
            var pixels = new Color32[size * size];
            for (int y = 0; y < size; y++)
            {
                for (int x = 0; x < size; x++)
                {
                    // Distance to the rounded-rect edge, antialiased over one pixel.
                    float dx = Mathf.Max(radius - (x + 0.5f), 0f, (x + 0.5f) - (size - radius));
                    float dy = Mathf.Max(radius - (y + 0.5f), 0f, (y + 0.5f) - (size - radius));
                    float d = Mathf.Sqrt(dx * dx + dy * dy) - radius;
                    byte a = (byte)(Mathf.Clamp01(0.5f - d) * 255f);
                    pixels[y * size + x] = new Color32(255, 255, 255, a);
                }
            }
            texture.SetPixels32(pixels);
            texture.Apply(false, true);
            float border = Mathf.Min(radius, size / 2 - 1);
            return Sprite.Create(texture, new Rect(0, 0, size, size), new Vector2(0.5f, 0.5f), 100f, 0, SpriteMeshType.FullRect,
                new Vector4(border, border, border, border));
        }
    }

    /// <summary>Small uGUI construction helpers shared by the HUD screens.</summary>
    public static class UIBuild
    {
        public static RectTransform Rect(string name, Transform parent, Vector2 anchor, Vector2 pivot, Vector2 position, Vector2 size)
        {
            var go = new GameObject(name, typeof(RectTransform));
            go.transform.SetParent(parent, false);
            var rect = (RectTransform)go.transform;
            rect.anchorMin = rect.anchorMax = anchor;
            rect.pivot = pivot;
            rect.anchoredPosition = position;
            rect.sizeDelta = size;
            return rect;
        }

        public static void Stretch(RectTransform rect)
        {
            rect.anchorMin = Vector2.zero;
            rect.anchorMax = Vector2.one;
            rect.offsetMin = Vector2.zero;
            rect.offsetMax = Vector2.zero;
        }

        /// <summary>Panel image. Not a raycast target unless it is interactive, so drags that start on it still steer.</summary>
        public static Image Panel(RectTransform rect, Sprite sprite, Color color, bool raycast = false)
        {
            var image = rect.gameObject.AddComponent<Image>();
            image.sprite = sprite;
            image.type = Image.Type.Sliced;
            image.color = color;
            image.raycastTarget = raycast;
            return image;
        }

        public static Text Label(string name, Transform parent, string value, Font font, int size, Color color, TextAnchor anchor = TextAnchor.MiddleCenter)
        {
            var go = new GameObject(name, typeof(RectTransform), typeof(Text));
            go.transform.SetParent(parent, false);
            Stretch((RectTransform)go.transform);
            var text = go.GetComponent<Text>();
            text.font = font;
            text.fontSize = size;
            text.color = color;
            text.alignment = anchor;
            text.text = value;
            text.raycastTarget = false;
            text.horizontalOverflow = HorizontalWrapMode.Wrap;
            text.verticalOverflow = VerticalWrapMode.Truncate;
            text.supportRichText = false;
            text.lineSpacing = 1.12f;
            return text;
        }

        public static HoldButton Button(string name, Transform parent, Vector2 anchor, Vector2 pivot, Vector2 position, Vector2 size,
            string label, HudTheme theme, int fontSize, out Text text)
        {
            RectTransform rect = Rect(name, parent, anchor, pivot, position, size);
            Image image = Panel(rect, theme.RoundedPanel, theme.panel, raycast: true);
            HoldButton button = rect.gameObject.AddComponent<HoldButton>();
            button.normalColor = theme.panel;
            button.pressedColor = theme.accentBlue;
            image.color = theme.panel;
            text = Label("Label", rect, label, theme.Font, fontSize, theme.text);
            var labelRect = (RectTransform)text.transform;
            labelRect.offsetMin = new Vector2(14f, 8f);
            labelRect.offsetMax = new Vector2(-14f, -8f);
            text.resizeTextForBestFit = true;
            text.resizeTextMinSize = Mathf.Clamp(fontSize - 6, 10, fontSize);
            text.resizeTextMaxSize = fontSize;
            return button;
        }
    }
}
