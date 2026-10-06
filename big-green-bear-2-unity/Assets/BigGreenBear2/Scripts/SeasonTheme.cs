// SeasonTheme.cs — everything that makes one BGB game LOOK different from another.
// Engine code never hard-codes colours, props or backdrops: it reads a season.json.
// A new season = a new folder under Resources/BGB2/Seasons/<id>/ (+ props), no engine changes.
using System;
using UnityEngine;

namespace BigGreenBear2
{
    [Serializable]
    public class PropPlacement
    {
        public string model;      // Resources/BGB2/Props/<model>
        public float x, z, scale = 1f, rotY;
    }

    [Serializable]
    public class SeasonTheme
    {
        public string id, title;
        public string sky, ground, fog, ambient, moon, propTint;
        public float fogNear = 14f, fogFar = 46f, moonIntensity = 1.1f;
        public string backdrop;                     // sprite name inside the season folder
        public float backdropWidth = 46f, backdropX, backdropY = 6.2f, backdropZ = -34f;
        public PropPlacement[] props = new PropPlacement[0];

        public static SeasonTheme Load(string id)
        {
            var ta = Resources.Load<TextAsset>("BGB2/Seasons/" + id + "/season");
            if (ta == null) { Debug.LogError("[BigGreenBear2] Missing Resources/BGB2/Seasons/" + id + "/season.json"); return null; }
            return JsonUtility.FromJson<SeasonTheme>(ta.text);
        }

        public static Color Hex(string hex, Color fallback)
        {
            return !string.IsNullOrEmpty(hex) && ColorUtility.TryParseHtmlString(hex, out var c) ? c : fallback;
        }
    }
}
