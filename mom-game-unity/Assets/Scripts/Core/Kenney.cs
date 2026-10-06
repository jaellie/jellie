using System.Collections.Generic;
using UnityEngine;

// Loads Kenney (CC0) props from Resources/Kenney. Every model is centered, put on the floor,
// scaled, and turned so its FRONT faces `heading` (degrees, 0 = +Z/north, 90 = +X/east).
// Kenney OBJ models face -Z; materials come from KenneyCatalog (flat colors or a palette texture).
public static class Kenney
{
    public const float FurnitureScale = 2.0f;   // 1 kit unit ~ 2 m: sofa 0.98 -> ~2.0 m, fridge 0.92 -> ~1.85 m

    static readonly Dictionary<string, GameObject> prefabs = new Dictionary<string, GameObject>();
    static readonly Dictionary<string, Material> mats = new Dictionary<string, Material>();
    static readonly Dictionary<string, Texture2D> texs = new Dictionary<string, Texture2D>();

    public static bool Has(string key) { return KenneyCatalog.All.ContainsKey(key); }

    public static Vector3 NativeSize(string key)
    {
        KenneyCatalog.Entry e;
        return KenneyCatalog.All.TryGetValue(key, out e) ? e.size : Vector3.one;
    }

    /// <summary>Spawns a model. pos = bottom-center after scaling. Give a uniform `scale`, OR a target
    /// width (x), height (y) or depth (z) in meters (the first one given wins).</summary>
    public static GameObject Spawn(string key, Transform parent, Vector3 pos, float heading = 0f, float scale = 1f,
        string recolor = null, float width = -1f, float height = -1f, float depth = -1f, bool solid = false)
    {
        KenneyCatalog.Entry e;
        if (!KenneyCatalog.All.TryGetValue(key, out e)) return Placeholder(key, parent, pos, heading, Vector3.one * 0.5f);
        GameObject prefab;
        if (!prefabs.TryGetValue(key, out prefab))
        {
            prefab = Resources.Load<GameObject>(e.res);
            prefabs[key] = prefab;
        }
        if (prefab == null) return Placeholder(key, parent, pos, heading, e.size * Mathf.Max(0.2f, scale));

        var pivot = new GameObject(key.Substring(key.IndexOf('/') + 1));
        var inst = Object.Instantiate(prefab);
        inst.transform.SetParent(pivot.transform, false);
        ApplyMaterials(inst, e, recolor);

        // measure at identity (pivot is still at the origin, unparented)
        Bounds b = Measure(inst);
        float s = scale;
        if (width > 0f && b.size.x > 0.0001f) s = width / b.size.x;
        else if (height > 0f && b.size.y > 0.0001f) s = height / b.size.y;
        else if (depth > 0f && b.size.z > 0.0001f) s = depth / b.size.z;
        else if (key.StartsWith("furn/") && Mathf.Approximately(scale, 1f)) s = FurnitureScale;

        inst.transform.localScale = Vector3.one * s;
        inst.transform.localPosition = new Vector3(-b.center.x * s, -b.min.y * s, -b.center.z * s);
        if (parent != null) pivot.transform.SetParent(parent, false);
        pivot.transform.localPosition = pos;
        pivot.transform.localRotation = Quaternion.Euler(0f, heading + 180f, 0f);

        if (solid)
        {
            var bc = pivot.AddComponent<BoxCollider>();
            bc.center = new Vector3(0f, b.size.y * s * 0.5f, 0f);
            bc.size = b.size * s;
        }
        return pivot;
    }

    // size of the model after scaling (handy for layout)
    public static Vector3 Size(string key, float scale = 1f)
    {
        float s = (key.StartsWith("furn/") && Mathf.Approximately(scale, 1f)) ? FurnitureScale : scale;
        return NativeSize(key) * s;
    }

    static Bounds Measure(GameObject go)
    {
        var rs = go.GetComponentsInChildren<Renderer>();
        if (rs.Length == 0) return new Bounds(Vector3.zero, Vector3.one * 0.1f);
        Bounds b = rs[0].bounds;
        for (int i = 1; i < rs.Length; i++) b.Encapsulate(rs[i].bounds);
        return b;
    }

    static GameObject Placeholder(string key, Transform parent, Vector3 pos, float heading, Vector3 size)
    {
        var go = GameObject.CreatePrimitive(PrimitiveType.Cube);
        go.name = "missing:" + key;
        if (parent != null) go.transform.SetParent(parent, false);
        go.transform.localScale = size;
        go.transform.localPosition = pos + Vector3.up * (size.y * 0.5f);
        go.transform.localRotation = Quaternion.Euler(0, heading + 180f, 0);
        go.GetComponent<Renderer>().sharedMaterial = Kit.Mat("#C9A27A");
        Debug.LogWarning("[MomGame] Kenney model not found: " + key + " (run Tools/import_kenney.py or re-import the Resources/Kenney folder)");
        return go;
    }

    // ───────────────────────── materials ─────────────────────────
    static Dictionary<string, string> ParseRecolor(string s)
    {
        var d = new Dictionary<string, string>();
        if (string.IsNullOrEmpty(s)) return d;
        foreach (var part in s.Split(';'))
        {
            int i = part.IndexOf('=');
            if (i > 0) d[part.Substring(0, i).Trim()] = part.Substring(i + 1).Trim();
        }
        return d;
    }

    static Texture2D Tex(string path)
    {
        Texture2D t;
        if (!texs.TryGetValue(path, out t)) { t = Resources.Load<Texture2D>(path); texs[path] = t; }
        return t;
    }

    static void ApplyMaterials(GameObject inst, KenneyCatalog.Entry e, string recolor)
    {
        var over = ParseRecolor(recolor);
        Texture2D palette = e.tex != null ? Tex(e.tex) : null;
        foreach (var r in inst.GetComponentsInChildren<Renderer>())
        {
            var old = r.sharedMaterials;
            var arr = new Material[old.Length];
            for (int i = 0; i < old.Length; i++)
            {
                string nm = old[i] != null ? old[i].name.Replace(" (Instance)", "") : "";
                int idx = System.Array.IndexOf(e.matNames, nm);
                if (idx < 0) idx = Mathf.Min(i, Mathf.Max(0, e.matNames.Length - 1));
                string matName = e.matNames.Length > 0 ? e.matNames[idx] : "wood";
                string hex = e.matHex.Length > 0 ? e.matHex[idx] : "#CCCCCC";
                string ov;
                if (over.TryGetValue(matName, out ov)) { hex = ov; palette = null; }
                if (palette != null && !over.ContainsKey(matName)) arr[i] = PaletteMat(e.tex, palette);
                else arr[i] = FlatMat(matName, hex);
            }
            r.sharedMaterials = arr;
        }
    }

    static Material PaletteMat(string key, Texture2D tex)
    {
        Material m;
        if (mats.TryGetValue("tex|" + key, out m) && m != null) return m;
        m = new Material(Kit.Std);
        m.mainTexture = tex;
        m.SetFloat("_Glossiness", 0.12f);
        mats["tex|" + key] = m;
        return m;
    }

    static Material FlatMat(string name, string hex)
    {
        string ln = name.ToLowerInvariant();
        string key = ln + "|" + hex;
        Material m;
        if (mats.TryGetValue(key, out m) && m != null) return m;
        float smooth = 0.15f, metal = 0f; string emit = null; float alpha = 1f;
        if (ln.Contains("metal")) { smooth = 0.5f; metal = 0.55f; }
        else if (ln.Contains("glass")) { smooth = 0.9f; alpha = 0.55f; }
        else if (ln.Contains("wood")) smooth = 0.22f;
        else if (ln.Contains("lamp") || ln.Contains("light")) { emit = "#FFD9A0"; }
        else if (ln.Contains("asphalt")) smooth = 0.05f;
        m = Kit.MatUnique(hex, smooth, metal, emit, 0.6f, alpha);
        mats[key] = m;
        return m;
    }

    // used by the HUD for the little photo / UI sprites
    public static Texture2D Sprite(string folder, string name)
    {
        return Tex("Kenney/" + folder + "/" + name);
    }
}
