// SliceData.cs — data models for the two JSON files in Resources/BGB/Data.
//   slice.json   the story beats (same idea as the HTML game's dialogue nodes)
//   layout.json  where every layer, character and light sits in the 2.5D scene
// Edit the JSON, not the code, to change the story or the composition.
using System;
using UnityEngine;

namespace BigGreenBear
{
    [Serializable]
    public class LText
    {
        public string en;
        public string ko;
        public string Get(string lang) => lang == "ko" && !string.IsNullOrEmpty(ko) ? ko : (en ?? "");
        public bool IsEmpty => string.IsNullOrEmpty(en) && string.IsNullOrEmpty(ko);
    }

    // An effect is a small instruction: { "type": "rain", "num": 0.4 }
    [Serializable]
    public class Effect
    {
        public string type;
        public string id;
        public string value;
        public float num;
        public LText label;    // chapter card: small line
        public LText title;    // chapter card: big line
    }

    [Serializable]
    public class Branch
    {
        public string[] conditions;
        public string to;
    }

    [Serializable]
    public class Choice
    {
        public LText text;
        public string[] conditions;
        public Effect[] effects;
        public string next;
        public string target;   // optional: a hotspot id you can click in the scene to pick this choice
        public string group;    // "travel" = shown in its own column on the right
    }

    [Serializable]
    public class Node
    {
        public string id;
        public string speaker;     // "bear", "nini" ... empty = narration
        public LText text;         // empty + no choices = silent logic node
        public Effect[] effects;   // run when the node starts
        public string next;
        public Branch[] branches;  // checked before anything else; first match jumps
        public Choice[] choices;
        public string[] fx;        // per-line visual fx: echo, clock1147, fluorescent, beep, drift
        public float hold;         // seconds to wait before showing text (silence is allowed)
    }

    [Serializable]
    public class Speaker
    {
        public string id;
        public LText name;
        public string color;    // name color, "#RRGGBB"
    }

    [Serializable]
    public class UiStrings
    {
        public LText title;
        public LText subtitle;
        public LText pressStart;
        public LText chapterLabel;
        public LText chapterTitle;
        public LText prompt;
        public LText toBeContinued;
        public LText controls;
        public LText motionOn;
        public LText motionOff;
        public LText newGame;
        public LText continueGame;
        public LText notebook;
        public LText notebookEmpty;
        public LText clueAdded;
        public LText theEnd;
    }

    [Serializable]
    public class Clue
    {
        public string id;
        public LText title;
        public LText text;
    }

    [Serializable]
    public class SliceScript
    {
        public string start;
        public string startClock;
        public UiStrings ui;
        public Speaker[] speakers;
        public Clue[] clues;
        public Node[] nodes;
    }

    /* ---------------- layout.json ---------------- */

    [Serializable]
    public class CameraLayout
    {
        public float fov = 38f;
        public float y = 1.6f;
        public float z = -10f;
        public float parallax = 0.25f;
    }

    [Serializable]
    public class HorizonLayout
    {
        public float y = 1f;   // the top edge of the ground ...
        public float z = 0.6f; // ... at this depth. Back layers are lined up to it.
    }

    [Serializable]
    public class LayerLayout
    {
        public string name;
        public string sprite;
        public float z;
        public float width;
        public float x;
        public float anchorRow;   // pixel row (from the top) that sits on the horizon
        public string anchorAt;   // "horizon" | "viewTop"
        public int order;
        public string[] when;     // optional: only build this layer if these conditions pass
    }

    [Serializable]
    public class ActorLayout
    {
        public string id;
        public string sprites;    // prefix: "bear" -> bear_neutral.png, bear_happy.png ...
        public string face;       // starting expression
        public float x;
        public float z;
        public float height;
        public int order;
        public string[] when;     // placement only: show this character here only if these pass
    }

    [Serializable]
    public class AnchorLayout
    {
        public string id;
        public string layer;
        public float px;
        public float py;
    }

    [Serializable]
    public class FocusLayout
    {
        public string id;
        public float x;
        public float y;
        public float zoom;
    }

    [Serializable]
    public class LightLayout
    {
        public string id;
        public string anchor;     // optional: place on an anchor
        public float x;
        public float y;
        public float z;
        public float radius;
        public float intensity;
        public string kind;       // "lamp" | "string" | "fluorescent"
    }

    // A clickable thing in the world (the clock, the gate, Nini...).
    [Serializable]
    public class HotspotLayout
    {
        public string id;
        public string anchor;     // anchor or actor id; defaults to id
        public float radius;      // world units: how far from the centre still counts as "near"
    }

    // One place in the game (square, cafe, park ...).
    [Serializable]
    public class LocationLayout
    {
        public string id;
        public LayerLayout[] layers;
        public ActorLayout[] actors;     // who stands here: id, x, z, face, when
        public AnchorLayout[] anchors;
        public FocusLayout[] focus;
        public LightLayout[] lights;
        public HotspotLayout[] hotspots;
    }

    [Serializable]
    public class SceneLayout
    {
        public CameraLayout camera;
        public HorizonLayout horizon;
        public ActorLayout[] cast;       // every character: id, sprites, height, order, face
        public LocationLayout[] locations;

        public LocationLayout Location(string id)
        {
            if (locations != null) foreach (var l in locations) if (l.id == id) return l;
            return null;
        }

        public ActorLayout Cast(string id)
        {
            if (cast != null) foreach (var c in cast) if (c.id == id) return c;
            return null;
        }
    }

    public static class SliceData
    {
        public static T Load<T>(string resourcePath) where T : class
        {
            var asset = Resources.Load<TextAsset>(resourcePath);
            if (asset == null)
            {
                Debug.LogError("[BigGreenBear] Missing Resources/" + resourcePath + ".json");
                return null;
            }
            return JsonUtility.FromJson<T>(asset.text);
        }
    }
}
