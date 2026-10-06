using System;
using System.Collections.Generic;
using UnityEngine;

// Everything in the game is built from code with these helpers: cached materials, procedural
// low-poly meshes (rounded boxes, frustums, cones) and small procedural textures.
// Convention: Box/Cyl/Frustum/Cone take a BOTTOM-CENTER position; Sph/Cap take a CENTER position.
public static class Kit
{
    public static Vector3 V(float x, float y, float z) { return new Vector3(x, y, z); }

    public static Color C(string hex)
    {
        Color c;
        if (hex != null && ColorUtility.TryParseHtmlString(hex, out c)) return c;
        return Color.magenta;
    }

    // ───────────────────────── shaders & materials ─────────────────────────
    static Shader _std, _additive, _unlitColor, _unlitTex;
    public static Shader Std { get { if (_std == null) _std = Shader.Find("Standard"); return _std; } }
    static Shader Additive { get { if (_additive == null) _additive = Shader.Find("Legacy Shaders/Particles/Additive"); return _additive; } }

    static readonly Dictionary<string, Material> matCache = new Dictionary<string, Material>();

    public static Material Mat(string hex, float smooth = 0.12f, float metal = 0f, string emit = null, float emitI = 1f, float alpha = 1f)
    {
        string key = hex + "|" + smooth + "|" + metal + "|" + emit + "|" + emitI + "|" + alpha;
        Material m;
        if (matCache.TryGetValue(key, out m) && m != null) return m;
        m = MatUnique(hex, smooth, metal, emit, emitI, alpha);
        matCache[key] = m;
        return m;
    }

    public static Material MatUnique(string hex, float smooth = 0.12f, float metal = 0f, string emit = null, float emitI = 1f, float alpha = 1f)
    {
        Color col = C(hex);
        var m = new Material(Std);
        col.a = alpha;
        m.color = col;
        m.SetFloat("_Glossiness", smooth);
        m.SetFloat("_Metallic", metal);
        if (emit != null)
        {
            m.EnableKeyword("_EMISSION");
            m.SetColor("_EmissionColor", C(emit) * emitI);
            m.globalIlluminationFlags = MaterialGlobalIlluminationFlags.None;
        }
        if (alpha < 0.999f) MakeTransparent(m);
        return m;
    }

    public static Material MatTex(Texture tex, float smooth = 0.12f, Vector2? tile = null, float metal = 0f)
    {
        var m = new Material(Std);
        m.mainTexture = tex;
        m.SetFloat("_Glossiness", smooth);
        m.SetFloat("_Metallic", metal);
        if (tile.HasValue) m.mainTextureScale = tile.Value;
        return m;
    }

    public static void MakeTransparent(Material m)
    {
        m.SetFloat("_Mode", 3f);
        m.SetOverrideTag("RenderType", "Transparent");
        m.SetInt("_SrcBlend", (int)UnityEngine.Rendering.BlendMode.SrcAlpha);
        m.SetInt("_DstBlend", (int)UnityEngine.Rendering.BlendMode.OneMinusSrcAlpha);
        m.SetInt("_ZWrite", 0);
        m.DisableKeyword("_ALPHATEST_ON");
        m.EnableKeyword("_ALPHABLEND_ON");
        m.DisableKeyword("_ALPHAPREMULTIPLY_ON");
        m.renderQueue = 3000;
    }

    // glowing, unlit surface (TV screen, window glow, signs)
    public static Material Unlit(Color c)
    {
        var m = new Material(Std);
        m.color = Color.black;
        m.EnableKeyword("_EMISSION");
        m.SetColor("_EmissionColor", c);
        m.SetFloat("_Glossiness", 0f);
        return m;
    }

    public static Material UnlitTex(Texture tex, float intensity = 1f)
    {
        var m = new Material(Std);
        m.color = Color.black;
        m.EnableKeyword("_EMISSION");
        m.SetColor("_EmissionColor", Color.white * intensity);
        m.SetTexture("_EmissionMap", tex);
        m.SetFloat("_Glossiness", 0f);
        return m;
    }

    public static Material AdditiveMat(Texture tex, Color tint)
    {
        Shader sh = Additive;
        if (sh == null) { var fb = Mat("#FFFFFF", 0f, 0f, null, 1f, 0.0f); fb.mainTexture = tex; return fb; }
        var m = new Material(sh);
        m.mainTexture = tex;
        m.SetColor("_TintColor", tint);
        return m;
    }

    // ───────────────────────── procedural meshes ─────────────────────────
    static readonly Dictionary<string, Mesh> meshCache = new Dictionary<string, Mesh>();
    static readonly Dictionary<PrimitiveType, Mesh> primCache = new Dictionary<PrimitiveType, Mesh>();

    public static Mesh Prim(PrimitiveType t)
    {
        Mesh m;
        if (primCache.TryGetValue(t, out m) && m != null) return m;
        var tmp = GameObject.CreatePrimitive(t);
        m = tmp.GetComponent<MeshFilter>().sharedMesh;
        UnityEngine.Object.Destroy(tmp);
        primCache[t] = m;
        return m;
    }

    // make triangle winding agree with the vertex normals (Unity front faces are clockwise)
    static void FixWinding(Mesh mesh)
    {
        var v = mesh.vertices; var n = mesh.normals; var t = mesh.triangles;
        for (int i = 0; i < t.Length; i += 3)
        {
            Vector3 a = v[t[i]], b = v[t[i + 1]], c = v[t[i + 2]];
            Vector3 gn = Vector3.Cross(b - a, c - a);
            Vector3 vn = n[t[i]] + n[t[i + 1]] + n[t[i + 2]];
            if (Vector3.Dot(gn, vn) < 0f) { int s = t[i + 1]; t[i + 1] = t[i + 2]; t[i + 2] = s; }
        }
        mesh.triangles = t;
        mesh.RecalculateBounds();
    }

    public static Mesh RoundedBoxMesh(float w, float h, float d, float r)
    {
        string key = "rb" + w.ToString("F3") + "|" + h.ToString("F3") + "|" + d.ToString("F3") + "|" + r.ToString("F3");
        Mesh mesh;
        if (meshCache.TryGetValue(key, out mesh) && mesh != null) return mesh;
        r = Mathf.Min(r, Mathf.Min(w, Mathf.Min(h, d)) * 0.5f - 0.0005f);
        Vector3 half = new Vector3(w, h, d) * 0.5f;
        Vector3 inner = half - Vector3.one * r;
        const int N = 4; // grid cells per face
        var verts = new List<Vector3>(); var norms = new List<Vector3>(); var tris = new List<int>();
        Vector3[] axes = { Vector3.right, Vector3.up, Vector3.forward };
        for (int axis = 0; axis < 3; axis++)
            for (int sign = -1; sign <= 1; sign += 2)
            {
                int ua = (axis + 1) % 3, va = (axis + 2) % 3;
                int baseIdx = verts.Count;
                for (int j = 0; j <= N; j++)
                    for (int i = 0; i <= N; i++)
                    {
                        Vector3 p = Vector3.zero;
                        p[axis] = sign * half[axis];
                        p[ua] = Mathf.Lerp(-half[ua], half[ua], i / (float)N);
                        p[va] = Mathf.Lerp(-half[va], half[va], j / (float)N);
                        Vector3 q = new Vector3(
                            Mathf.Clamp(p.x, -inner.x, inner.x),
                            Mathf.Clamp(p.y, -inner.y, inner.y),
                            Mathf.Clamp(p.z, -inner.z, inner.z));
                        Vector3 dir = p - q;
                        dir = dir.sqrMagnitude < 1e-10f ? axes[axis] * sign : dir.normalized;
                        verts.Add(q + dir * r); norms.Add(dir);
                    }
                for (int j = 0; j < N; j++)
                    for (int i = 0; i < N; i++)
                    {
                        int a = baseIdx + j * (N + 1) + i, b = a + 1, c = a + (N + 1), e = c + 1;
                        tris.Add(a); tris.Add(c); tris.Add(b); tris.Add(b); tris.Add(c); tris.Add(e);
                    }
            }
        mesh = new Mesh { name = key };
        mesh.SetVertices(verts); mesh.SetNormals(norms); mesh.SetTriangles(tris, 0);
        mesh.SetUVs(0, verts.ConvertAll(p => new Vector2(p.x + p.z, p.y + p.z)));
        FixWinding(mesh);
        meshCache[key] = mesh;
        return mesh;
    }

    // frustum (cylinder when rTop == rBot, cone when rTop == 0); origin at the bottom center
    public static Mesh FrustumMesh(float rBot, float rTop, float h, int seg)
    {
        string key = "fr" + rBot.ToString("F3") + "|" + rTop.ToString("F3") + "|" + h.ToString("F3") + "|" + seg;
        Mesh mesh;
        if (meshCache.TryGetValue(key, out mesh) && mesh != null) return mesh;
        var verts = new List<Vector3>(); var norms = new List<Vector3>(); var uvs = new List<Vector2>(); var tris = new List<int>();
        float slope = (rBot - rTop) / Mathf.Max(h, 0.0001f);
        for (int i = 0; i <= seg; i++)
        {
            float a = i / (float)seg * Mathf.PI * 2f, cx = Mathf.Cos(a), sz = Mathf.Sin(a);
            Vector3 n = new Vector3(cx, slope, sz).normalized;
            verts.Add(new Vector3(cx * rBot, 0, sz * rBot)); norms.Add(n); uvs.Add(new Vector2(i / (float)seg, 0));
            verts.Add(new Vector3(cx * rTop, h, sz * rTop)); norms.Add(n); uvs.Add(new Vector2(i / (float)seg, 1));
        }
        for (int i = 0; i < seg; i++) { int a = i * 2; tris.Add(a); tris.Add(a + 1); tris.Add(a + 2); tris.Add(a + 1); tris.Add(a + 3); tris.Add(a + 2); }
        for (int cap = 0; cap < 2; cap++)
        {
            float y = cap == 0 ? 0f : h, rr = cap == 0 ? rBot : rTop;
            if (rr <= 0.0001f) continue;
            Vector3 n = cap == 0 ? Vector3.down : Vector3.up;
            int c0 = verts.Count; verts.Add(new Vector3(0, y, 0)); norms.Add(n); uvs.Add(new Vector2(0.5f, 0.5f));
            for (int i = 0; i <= seg; i++)
            {
                float a = i / (float)seg * Mathf.PI * 2f;
                verts.Add(new Vector3(Mathf.Cos(a) * rr, y, Mathf.Sin(a) * rr)); norms.Add(n); uvs.Add(new Vector2(0.5f + Mathf.Cos(a) * 0.5f, 0.5f + Mathf.Sin(a) * 0.5f));
            }
            for (int i = 0; i < seg; i++) { tris.Add(c0); tris.Add(c0 + 1 + i); tris.Add(c0 + 2 + i); }
        }
        mesh = new Mesh { name = key };
        mesh.SetVertices(verts); mesh.SetNormals(norms); mesh.SetUVs(0, uvs); mesh.SetTriangles(tris, 0);
        FixWinding(mesh);
        meshCache[key] = mesh;
        return mesh;
    }

    // ───────────────────────── object builders ─────────────────────────
    public static GameObject Make(Transform parent, string name, Mesh mesh, Material mat, Vector3 pos, Vector3 scale)
    {
        var go = new GameObject(name);
        if (parent != null) go.transform.SetParent(parent, false);
        go.transform.localPosition = pos;
        go.transform.localScale = scale;
        go.AddComponent<MeshFilter>().sharedMesh = mesh;
        go.AddComponent<MeshRenderer>().sharedMaterial = mat;
        return go;
    }

    public static Transform Group(Transform parent, string name, Vector3 pos, float rotY = 0f)
    {
        var go = new GameObject(name);
        if (parent != null) go.transform.SetParent(parent, false);
        go.transform.localPosition = pos;
        go.transform.localRotation = Quaternion.Euler(0, rotY, 0);
        return go.transform;
    }

    public static GameObject Box(Transform p, Vector3 size, Vector3 pos, string hex, float round = 0f, Material m = null)
    {
        Material mat = m != null ? m : Mat(hex);
        Vector3 center = pos + Vector3.up * (size.y * 0.5f);
        if (round > 0.001f) return Make(p, "box", RoundedBoxMesh(size.x, size.y, size.z, round), mat, center, Vector3.one);
        return Make(p, "box", Prim(PrimitiveType.Cube), mat, center, size);
    }

    public static GameObject Cyl(Transform p, float radius, float height, Vector3 pos, string hex, int seg = 16, Material m = null)
    {
        return Make(p, "cyl", FrustumMesh(radius, radius, height, seg), m != null ? m : Mat(hex), pos, Vector3.one);
    }

    public static GameObject Frustum(Transform p, float rBot, float rTop, float height, Vector3 pos, string hex, int seg = 16, Material m = null)
    {
        return Make(p, "frustum", FrustumMesh(rBot, rTop, height, seg), m != null ? m : Mat(hex), pos, Vector3.one);
    }

    public static GameObject Cone(Transform p, float radius, float height, Vector3 pos, string hex, int seg = 8, Material m = null)
    {
        return Make(p, "cone", FrustumMesh(radius, 0f, height, seg), m != null ? m : Mat(hex), pos, Vector3.one);
    }

    public static GameObject Sph(Transform p, float radius, Vector3 center, string hex, Material m = null)
    {
        return Make(p, "sph", Prim(PrimitiveType.Sphere), m != null ? m : Mat(hex), center, Vector3.one * (radius * 2f));
    }

    // capsule of total length `length` (caps included) and radius `radius`, centered
    public static GameObject Cap(Transform p, float radius, float length, Vector3 center, string hex, Material m = null)
    {
        return Make(p, "cap", Prim(PrimitiveType.Capsule), m != null ? m : Mat(hex), center, new Vector3(radius * 2f, length * 0.5f, radius * 2f));
    }

    // flat quad facing -Z (like Unity's Quad); rotate it to face wherever you need
    public static GameObject Quad(Transform p, float w, float h, Vector3 center, Material m)
    {
        return Make(p, "quad", Prim(PrimitiveType.Quad), m, center, new Vector3(w, h, 1f));
    }

    public static GameObject Plane(Transform p, float w, float d, Vector3 center, Material m)
    {
        var go = Make(p, "plane", Prim(PrimitiveType.Quad), m, center, new Vector3(w, d, 1f));
        go.transform.localRotation = Quaternion.Euler(90, 0, 0); // faces up
        return go;
    }

    public static T Rot<T>(T go, float x, float y, float z) where T : Component { go.transform.localRotation = Quaternion.Euler(x, y, z); return go; }
    public static GameObject Rot(GameObject go, float x, float y, float z) { go.transform.localRotation = Quaternion.Euler(x, y, z); return go; }

    public static GameObject NoShadow(GameObject go)
    {
        var r = go.GetComponent<Renderer>();
        if (r != null) { r.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off; }
        return go;
    }

    // collision helpers. Solid = blocks Mom; Wall = also blocks the chase camera.
    public static GameObject Solid(GameObject go)
    {
        if (go.GetComponent<Collider>() == null) go.AddComponent<BoxCollider>();
        return go;
    }

    public static GameObject Wall(GameObject go)
    {
        Solid(go);
        if (go.GetComponent<CamBlocker>() == null) go.AddComponent<CamBlocker>();
        return go;
    }

    // invisible collision box (center position, size)
    public static GameObject Blocker(Transform p, Vector3 center, Vector3 size, bool blocksCamera = false)
    {
        var go = new GameObject("blocker");
        go.transform.SetParent(p, false);
        go.transform.localPosition = center;
        var bc = go.AddComponent<BoxCollider>(); bc.size = size;
        if (blocksCamera) go.AddComponent<CamBlocker>();
        return go;
    }

    public static GameObject CylBlocker(Transform p, Vector3 center, float radius, float height)
    {
        var go = new GameObject("blocker");
        go.transform.SetParent(p, false);
        go.transform.localPosition = center;
        var cc = go.AddComponent<CapsuleCollider>(); cc.radius = radius; cc.height = height;
        return go;
    }

    // ───────────────────────── 3D text ─────────────────────────
    public static TextMesh Text(Transform p, string text, Vector3 pos, float size, string hex, TextAnchor anchor = TextAnchor.MiddleCenter, FontStyle style = FontStyle.Bold)
    {
        var go = new GameObject("text");
        go.transform.SetParent(p, false);
        go.transform.localPosition = pos;
        var tm = go.AddComponent<TextMesh>();
        tm.text = text; tm.fontSize = 64; tm.characterSize = size * 0.04f; tm.anchor = anchor; tm.alignment = TextAlignment.Center;
        tm.color = C(hex); tm.fontStyle = style;
        var f = GameFont.Get();
        if (f != null) { tm.font = f; go.GetComponent<MeshRenderer>().sharedMaterial = f.material; }
        return tm;
    }

    // ───────────────────────── textures ─────────────────────────
    public class Canvas2D
    {
        public readonly int W, H;
        public readonly Color32[] px;
        public Canvas2D(int w, int h, Color fill) { W = w; H = h; px = new Color32[w * h]; Fill(fill); }
        public void Fill(Color c) { Color32 cc = c; for (int i = 0; i < px.Length; i++) px[i] = cc; }
        public void Set(int x, int y, Color c, float a = 1f)
        {
            if (x < 0 || y < 0 || x >= W || y >= H) return;
            if (a >= 0.999f) { px[y * W + x] = c; return; }
            Color o = px[y * W + x]; px[y * W + x] = Color.Lerp(o, c, a);
        }
        public void Rect(int x0, int y0, int w, int h, Color c, float a = 1f) { for (int y = y0; y < y0 + h; y++) for (int x = x0; x < x0 + w; x++) Set(x, y, c, a); }
        public void Disc(float cx, float cy, float r, Color c, float a = 1f)
        {
            for (int y = (int)(cy - r - 1); y <= cy + r + 1; y++) for (int x = (int)(cx - r - 1); x <= cx + r + 1; x++)
                if ((x - cx) * (x - cx) + (y - cy) * (y - cy) <= r * r) Set(x, y, c, a);
        }
        public void Ring(float cx, float cy, float r, float thick, Color c, float a = 1f)
        {
            float r2 = (r + thick * 0.5f) * (r + thick * 0.5f), r1 = (r - thick * 0.5f) * (r - thick * 0.5f);
            for (int y = (int)(cy - r - thick); y <= cy + r + thick; y++) for (int x = (int)(cx - r - thick); x <= cx + r + thick; x++)
            { float d = (x - cx) * (x - cx) + (y - cy) * (y - cy); if (d <= r2 && d >= r1) Set(x, y, c, a); }
        }
        public void Line(float x0, float y0, float x1, float y1, float thick, Color c, float a = 1f)
        {
            float len = Mathf.Max(1f, Mathf.Sqrt((x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0)));
            for (float t = 0; t <= len; t += 0.5f) Disc(Mathf.Lerp(x0, x1, t / len), Mathf.Lerp(y0, y1, t / len), thick * 0.5f, c, a);
        }
        public Texture2D ToTexture(bool repeat = true, bool linear = false)
        {
            var t = new Texture2D(W, H, TextureFormat.RGBA32, true, linear);
            t.SetPixels32(px); t.wrapMode = repeat ? TextureWrapMode.Repeat : TextureWrapMode.Clamp;
            t.filterMode = FilterMode.Bilinear; t.anisoLevel = 4; t.Apply(true);
            return t;
        }
    }

    static Texture2D _glow, _star, _circle, _soft;
    public static Texture2D GlowTex()
    {
        if (_glow != null) return _glow;
        var cv = new Canvas2D(64, 64, new Color(1, 1, 1, 0));
        for (int y = 0; y < 64; y++) for (int x = 0; x < 64; x++)
        {
            float d = Mathf.Sqrt((x - 31.5f) * (x - 31.5f) + (y - 31.5f) * (y - 31.5f)) / 32f;
            float a = Mathf.Clamp01(1f - d); a = a * a * (0.35f + 0.65f * a);
            cv.px[y * 64 + x] = new Color(1, 1, 1, a);
        }
        _glow = cv.ToTexture(false); return _glow;
    }

    public static Texture2D StarTex()
    {
        if (_star != null) return _star;
        var cv = new Canvas2D(64, 64, new Color(1, 1, 1, 0));
        for (int y = 0; y < 64; y++) for (int x = 0; x < 64; x++)
        {
            float dx = (x - 31.5f) / 32f, dy = (y - 31.5f) / 32f, d = Mathf.Sqrt(dx * dx + dy * dy);
            float halo = Mathf.Clamp01(1f - d); halo = halo * halo * halo;
            float cross = Mathf.Max(Mathf.Clamp01(1f - Mathf.Abs(dx) * 14f) * Mathf.Clamp01(1f - Mathf.Abs(dy) * 1.1f), Mathf.Clamp01(1f - Mathf.Abs(dy) * 14f) * Mathf.Clamp01(1f - Mathf.Abs(dx) * 1.1f));
            cv.px[y * 64 + x] = new Color(1, 1, 1, Mathf.Clamp01(halo * 0.8f + cross));
        }
        _star = cv.ToTexture(false); return _star;
    }

    public static Texture2D CircleTex()
    {
        if (_circle != null) return _circle;
        var cv = new Canvas2D(64, 64, new Color(1, 1, 1, 0));
        cv.Disc(31.5f, 31.5f, 30f, Color.white);
        _circle = cv.ToTexture(false); return _circle;
    }

    // glow billboard (additive sprite that always faces the camera)
    public static GameObject GlowSprite(Transform p, Vector3 pos, float size, string hex, float alpha, Texture tex = null)
    {
        Color c = C(hex); c.a = alpha;
        var go = Quad(p, size, size, pos, AdditiveMat(tex != null ? tex : GlowTex(), new Color(c.r, c.g, c.b, alpha) * 0.5f));
        go.name = "glow";
        NoShadow(go);
        go.AddComponent<Billboard>();
        return go;
    }

    public static void SetGlowAlpha(GameObject glow, float alpha)
    {
        var r = glow.GetComponent<Renderer>(); if (r == null) return;
        Color c = r.sharedMaterial.GetColor("_TintColor"); c.a = alpha * 0.5f;
        // keep the same colour, scale brightness by alpha
        r.sharedMaterial.SetColor("_TintColor", new Color(c.r, c.g, c.b, Mathf.Clamp01(alpha)));
        glow.SetActive(alpha > 0.01f);
    }

    public static Texture2D TextTex(string text, int w, int h, int fontPx, string hex, string bg = null)
    {
        // draws text through a hidden RenderTexture-free route: build a TextMesh sign instead when possible
        var cv = new Canvas2D(w, h, bg != null ? C(bg) : new Color(1, 1, 1, 0));
        return cv.ToTexture(false);
    }
}

// marks colliders that should stop the chase camera (walls, ceilings), not furniture
public class CamBlocker : MonoBehaviour { }

// keeps a sprite facing the camera
public class Billboard : MonoBehaviour
{
    public static Transform Cam;
    void LateUpdate() { if (Cam != null) transform.rotation = Cam.rotation; }
}

public static class GameFont
{
    static Font f; static bool tried;
    public static Font Get()
    {
        if (f != null || tried) return f;
        tried = true;
        f = Resources.Load<Font>("Fonts/Griun_Mongtori-Rg");
        if (f == null) f = Font.CreateDynamicFontFromOSFont(new[] { "Malgun Gothic", "Apple SD Gothic Neo", "NanumGothic", "Noto Sans CJK KR", "Arial" }, 48);
        return f;
    }
}
