using System.Collections.Generic;
using UnityEngine;

// Small procedural textures and meshes used by the worlds.
public static class ProcTex
{
    static readonly Dictionary<string, Texture2D> cache = new Dictionary<string, Texture2D>();
    static Texture2D Cached(string key, System.Func<Texture2D> make)
    {
        Texture2D t;
        if (cache.TryGetValue(key, out t) && t != null) return t;
        t = make(); cache[key] = t; return t;
    }

    public static Texture2D Planks()
    {
        return Cached("planks", () =>
        {
            var cv = new Kit.Canvas2D(256, 256, Kit.C("#DDBE92"));
            var rnd = new System.Random(2);
            for (int y = 0; y < 256; y += 32)
            {
                cv.Rect(0, y, 256, 32, Kit.C("#B4762F"), 0.05f + (y / 32 % 3) * 0.03f);
                cv.Rect(0, y, 256, 1, Kit.C("#78502A"), 0.35f);
                int off = (y / 32 * 97) % 256; cv.Rect(off, y, 1, 32, Kit.C("#78502A"), 0.35f); cv.Rect((off + 128) % 256, y, 1, 32, Kit.C("#78502A"), 0.35f);
                for (int k = 0; k < 5; k++) cv.Rect(rnd.Next(256), y + 8 + rnd.Next(16), 20 + rnd.Next(30), 1, Kit.C("#FFF0D2"), 0.12f);
            }
            return cv.ToTexture(true);
        });
    }

    public static Texture2D ArtDeco()
    {
        return Cached("artdeco", () =>
        {
            var cv = new Kit.Canvas2D(256, 256, Kit.C("#F4F1EA"));
            Color gold = new Color(0.78f, 0.6f, 0.31f);
            foreach (var c in new[] { new Vector2(0, 0), new Vector2(256, 0), new Vector2(0, 256), new Vector2(256, 256), new Vector2(128, 128) })
                for (int r = 18; r < 130; r += 22) cv.Ring(c.x, c.y, r, 2.2f, gold, 0.85f);
            for (int i = 0; i < 32; i++) { float a = i / 32f * Mathf.PI * 2f; cv.Line(128, 128, 128 + Mathf.Cos(a) * 128, 128 + Mathf.Sin(a) * 128, 1f, new Color(0.6f, 0.56f, 0.52f), 0.3f); }
            return cv.ToTexture(true);
        });
    }

    public static Texture2D Marble()
    {
        return Cached("marble", () =>
        {
            var cv = new Kit.Canvas2D(256, 256, Kit.C("#F7F5F1"));
            var rnd = new System.Random(8);
            for (int i = 0; i < 9; i++)
            {
                float x = rnd.Next(256), y = rnd.Next(256);
                for (int k = 0; k < 8; k++) { float nx = x + (float)(rnd.NextDouble() - 0.3) * 60f, ny = y + (float)(rnd.NextDouble() - 0.5) * 50f; cv.Line(x, y, nx, ny, 1.4f, new Color(0.62f, 0.59f, 0.55f), 0.28f); x = nx; y = ny; }
            }
            cv.Rect(0, 0, 256, 2, new Color(0.78f, 0.67f, 0.43f), 0.7f); cv.Rect(0, 254, 256, 2, new Color(0.78f, 0.67f, 0.43f), 0.7f);
            return cv.ToTexture(true);
        });
    }

    public static Texture2D Terrazzo()
    {
        return Cached("terrazzo", () =>
        {
            var cv = new Kit.Canvas2D(128, 128, Kit.C("#B9B4AC"));
            var rnd = new System.Random(4);
            string[] cols = { "#E8E4DC", "#8E8A84", "#D6D0C4", "#6E6A66" };
            for (int i = 0; i < 380; i++) cv.Disc(rnd.Next(128), rnd.Next(128), 1.2f + (float)rnd.NextDouble() * 1.8f, Kit.C(cols[i % 4]));
            return cv.ToTexture(true);
        });
    }

    public static Texture2D Speckle(string baseHex)
    {
        return Cached("speckle" + baseHex, () =>
        {
            var cv = new Kit.Canvas2D(128, 128, Kit.C(baseHex));
            var rnd = new System.Random(6);
            string[] cols = { "#5C4A3A", "#2B2420", "#E8DCC8", "#8C7458" };
            for (int i = 0; i < 520; i++) cv.Rect(rnd.Next(128), rnd.Next(128), 1 + rnd.Next(2), 1 + rnd.Next(2), Kit.C(cols[i % 4]), 0.55f);
            return cv.ToTexture(true);
        });
    }

    public static Texture2D Tiles(string baseHex, int cells)
    {
        return Cached("tiles" + baseHex + cells, () =>
        {
            var cv = new Kit.Canvas2D(128, 64, Kit.C(baseHex));
            for (int x = 0; x < 128; x += 128 / cells) cv.Rect(x, 0, 1, 64, Color.white, 0.4f);
            for (int y = 0; y < 64; y += 8) cv.Rect(0, y, 128, 1, Color.white, 0.4f);
            return cv.ToTexture(true);
        });
    }

    public static Texture2D Whale(float phase, float glow)
    {
        var cv = new Kit.Canvas2D(256, 160, new Color(0.04f, 0.09f, 0.14f));
        for (int y = 0; y < 160; y++) cv.Rect(0, y, 256, 1, Color.Lerp(new Color(0.04f, 0.09f, 0.14f), new Color(0.07f, 0.16f, 0.23f), y / 160f));
        float cx = 128 + Mathf.Sin(phase) * 40f, cy = 80 + Mathf.Sin(phase * 2f) * 8f; float dir = Mathf.Cos(phase) >= 0 ? 1f : -1f;
        Color w = new Color(0.43f, 0.78f, 1f);
        for (int y = -30; y <= 30; y++) for (int x = -66; x <= 66; x++)
            if ((x * x) / (62f * 62f) + (y * y) / (26f * 26f) <= 1f) cv.Set((int)(cx + x * dir), (int)(cy + y), w, 0.55f + glow * 0.45f);
        cv.Line(cx - 55f * dir, cy, cx - 92f * dir, cy - 20f, 6f, w, 0.8f); cv.Line(cx - 55f * dir, cy, cx - 92f * dir, cy + 22f, 6f, w, 0.8f);
        cv.Disc(cx + 38f * dir, cy - 6f, 3.5f, new Color(0.04f, 0.09f, 0.14f));
        var t = cv.ToTexture(false);
        return t;
    }

    public static Texture2D Gradient(Color a, Color b, int h = 64)
    {
        var cv = new Kit.Canvas2D(8, h, a);
        for (int y = 0; y < h; y++) cv.Rect(0, y, 8, 1, Color.Lerp(a, b, y / (float)(h - 1)));
        return cv.ToTexture(false);
    }

    // soft vertical beam (light shafts)
    public static Texture2D Beam()
    {
        return Cached("beam", () =>
        {
            var cv = new Kit.Canvas2D(32, 128, new Color(1, 1, 1, 0));
            for (int y = 0; y < 128; y++) for (int x = 0; x < 32; x++)
            {
                float fy = y / 127f; float fx = 1f - Mathf.Abs(x - 15.5f) / 15.5f;
                cv.px[y * 32 + x] = new Color(1, 1, 1, Mathf.Pow(fy, 1.3f) * fx * fx);
            }
            return cv.ToTexture(false);
        });
    }

    // ─────────── meshes ───────────
    // pleated curtain panel, origin at the TOP-LEFT corner, hanging down (double sided)
    public static Mesh Curtain(float w, float h, int pleats = 7)
    {
        int cols = pleats * 4;
        var verts = new List<Vector3>(); var uvs = new List<Vector2>(); var tris = new List<int>();
        for (int side = 0; side < 2; side++)
        {
            int baseIdx = verts.Count;
            for (int j = 0; j <= 1; j++) for (int i = 0; i <= cols; i++)
            {
                float u = i / (float)cols;
                float z = Mathf.Sin(u * Mathf.PI * 2f * pleats) * 0.035f * (side == 0 ? 1f : 1f) + (side == 1 ? 0.002f : 0f);
                verts.Add(new Vector3(u * w, -j * h, z)); uvs.Add(new Vector2(u, 1 - j));
            }
            for (int i = 0; i < cols; i++)
            {
                int a = baseIdx + i, b = a + 1, c = a + cols + 1, d = c + 1;
                if (side == 0) { tris.Add(a); tris.Add(b); tris.Add(c); tris.Add(b); tris.Add(d); tris.Add(c); }
                else { tris.Add(a); tris.Add(c); tris.Add(b); tris.Add(b); tris.Add(c); tris.Add(d); }
            }
        }
        var m = new Mesh { name = "curtain" };
        m.SetVertices(verts); m.SetUVs(0, uvs); m.SetTriangles(tris, 0);
        m.RecalculateNormals(); m.RecalculateBounds();
        return m;
    }

    // flat grid for the sea (updated by SeaSurface)
    public static Mesh Grid(int n, float size)
    {
        var verts = new Vector3[(n + 1) * (n + 1)]; var tris = new List<int>();
        for (int z = 0; z <= n; z++) for (int x = 0; x <= n; x++) verts[z * (n + 1) + x] = new Vector3((x / (float)n - 0.5f) * size, 0f, (z / (float)n - 0.5f) * size);
        for (int z = 0; z < n; z++) for (int x = 0; x < n; x++)
        {
            int a = z * (n + 1) + x, b = a + 1, c = a + n + 1, d = c + 1;
            tris.Add(a); tris.Add(c); tris.Add(b); tris.Add(b); tris.Add(c); tris.Add(d);
        }
        var m = new Mesh { name = "grid" };
        if (verts.Length > 65000) m.indexFormat = UnityEngine.Rendering.IndexFormat.UInt32;
        m.vertices = verts; m.triangles = tris.ToArray(); m.RecalculateNormals(); m.RecalculateBounds();
        return m;
    }
}

// gently moving low-poly sea
public class SeaSurface : MonoBehaviour
{
    public float amp = 0.5f, scale = 0.25f, speed = 1f;
    Mesh mesh; Vector3[] baseV; Vector3[] v; float acc;
    void Start()
    {
        mesh = GetComponent<MeshFilter>().mesh; baseV = mesh.vertices; v = new Vector3[baseV.Length];
    }
    void Update()
    {
        acc += Time.deltaTime; if (acc < 1f / 24f) return; acc = 0f;
        float t = Time.time * speed;
        for (int i = 0; i < baseV.Length; i++)
        {
            Vector3 p = baseV[i];
            p.y = amp * (Mathf.Sin(p.x * 0.35f * scale * 4f + t * 0.9f) * 0.6f + Mathf.Sin(p.z * 0.5f * scale * 4f - t * 1.2f) * 0.5f + Mathf.Sin((p.x + p.z) * 0.8f * scale * 4f + t * 1.7f) * 0.25f);
            v[i] = p;
        }
        mesh.vertices = v; mesh.RecalculateNormals();
    }
}
