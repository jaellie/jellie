using System;
using DrivingSim.Core;
using DrivingSim.Localization;
using DrivingSim.Startup;
using UnityEngine;
using UnityEngine.UI;

namespace DrivingSim.UI
{
    static class StartupTypography
    {
        public static Text Block(RectTransform card, float top, float height, int size, HudTheme theme)
        {
            RectTransform rect = UIBuild.Rect("Heading", card, new Vector2(0.5f, 1f),
                new Vector2(0.5f, 1f), new Vector2(0f, -top), new Vector2(card.sizeDelta.x - 120f, height));
            return UIBuild.Label("Text", rect, "", theme.Font, size, theme.text);
        }
    }
}
