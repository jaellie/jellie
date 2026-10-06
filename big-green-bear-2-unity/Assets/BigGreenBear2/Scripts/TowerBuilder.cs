// TowerBuilder.cs — Game 2's own backdrop, built from primitives (nothing is borrowed from Game 1):
// a night sky of stars, a low-poly town silhouette, and THE OLD CLOCK TOWER whose clock is
// slightly too large for the building and stopped at 11:47 (design prompt §13).
using UnityEngine;

namespace BigGreenBear2
{
    public static class TowerBuilder
    {
        // ---- procedural meshes / textures
        public static Mesh Pyramid()
        {
            // flat-shaded 4-sided roof, base 1x1 at y=0, apex at y=1
            Vector3 a = new Vector3(-.5f, 0, -.5f), b = new Vector3(.5f, 0, -.5f), c = new Vector3(.5f, 0, .5f), d = new Vector3(-.5f, 0, .5f), t = new Vector3(0, 1, 0);
            var v = new[] { a, b, t, b, c, t, c, d, t, d, a, t };
            var idx = new int[12];
            for (int i = 0; i < 12; i++) idx[i] = i;
            var m = new Mesh { vertices = v, triangles = idx };
            m.RecalculateNormals();
            m.RecalculateBounds();
            return m;
        }

        // cream paper face, dark ticks and hands, stopped at 11:47
        public static Texture2D ClockFace(int n = 256)
        {
            var tex = new Texture2D(n, n, TextureFormat.RGBA32, false) { wrapMode = TextureWrapMode.Clamp };
            var cream = new Color32(0xF2, 0xE8, 0xD4, 255);
            var ink = new Color32(0x11, 0x19, 0x23, 255);
            var rim = new Color32(0x24, 0x30, 0x44, 255);
            float r = n / 2f;
            var px = new Color32[n * n];
            Vector2 c = new Vector2(r, r);
            float hourDeg = 11f * 30f + 47f * 0.5f, minDeg = 47f * 6f;
            for (int y = 0; y < n; y++)
                for (int x = 0; x < n; x++)
                {
                    var p = new Vector2(x + .5f, y + .5f);
                    float d = Vector2.Distance(p, c);
                    Color32 col = new Color32(0, 0, 0, 0);
                    if (d <= r - 1) col = d > r - 9 ? rim : cream;
                    if (d < r - 9)
                    {
                        // ticks
                        float ang = Mathf.Atan2(p.x - c.x, p.y - c.y) * Mathf.Rad2Deg; if (ang < 0) ang += 360f;
                        float tick = Mathf.Abs(Mathf.DeltaAngle(ang, Mathf.Round(ang / 30f) * 30f));
                        if (d > r * 0.80f && d < r * 0.90f && tick < 1.6f) col = ink;
                        if (SegDist(p, c, Dir(c, hourDeg, r * 0.45f)) < 5f) col = ink;
                        if (SegDist(p, c, Dir(c, minDeg, r * 0.72f)) < 3.2f) col = ink;
                        if (d < 7f) col = ink;
                    }
                    px[y * n + x] = col;
                }
            tex.SetPixels32(px);
            tex.Apply();
            return tex;
        }

        static Vector2 Dir(Vector2 c, float deg, float len)
        {
            float a = deg * Mathf.Deg2Rad;
            return c + new Vector2(Mathf.Sin(a), Mathf.Cos(a)) * len;
        }

        static float SegDist(Vector2 p, Vector2 a, Vector2 b)
        {
            var ab = b - a; float t = Mathf.Clamp01(Vector2.Dot(p - a, ab) / ab.sqrMagnitude);
            return Vector2.Distance(p, a + ab * t);
        }

        // ---- scene pieces
        public static void Build(Transform root, float towerX, float towerZ)
        {
            var wall = Mats.Lit(null, new Color32(0x3B, 0x4C, 0x70, 255));
            var roof = Mats.Lit(null, new Color32(0x24, 0x30, 0x44, 255));
            var pyr = Pyramid();

            // town silhouette (cheap, fog turns it into layers of paper-like blue)
            var rng = new System.Random(7);
            for (int i = 0; i < 22; i++)
            {
                float x = -34f + i * 3.3f + (float)rng.NextDouble() * 1.2f;
                if (Mathf.Abs(x - towerX) < 4f) continue;
                float w = 2.2f + (float)rng.NextDouble() * 1.6f, h = 2.5f + (float)rng.NextDouble() * 3.5f, z = towerZ - 2f - (float)rng.NextDouble() * 5f;
                Piece(root, PrimitiveType.Cube, new Vector3(x, h / 2f, z), new Vector3(w, h, w), wall);
                var rf = new GameObject("Roof"); rf.transform.SetParent(root, false);
                rf.transform.position = new Vector3(x, h, z); rf.transform.localScale = new Vector3(w * 1.15f, w * 0.7f, w * 1.15f);
                rf.AddComponent<MeshFilter>().sharedMesh = pyr; rf.AddComponent<MeshRenderer>().sharedMaterial = roof;
            }

            // the tower
            float tw = 5f, th = 15f;
            Piece(root, PrimitiveType.Cube, new Vector3(towerX, th / 2f, towerZ), new Vector3(tw, th, tw), wall);
            var cap = new GameObject("TowerRoof"); cap.transform.SetParent(root, false);
            cap.transform.position = new Vector3(towerX, th, towerZ); cap.transform.localScale = new Vector3(tw * 1.2f, 5f, tw * 1.2f);
            cap.AddComponent<MeshFilter>().sharedMesh = pyr; cap.AddComponent<MeshRenderer>().sharedMaterial = roof;

            // the clock: a little too large for the building
            float cd = 5.6f;
            var face = GameObject.CreatePrimitive(PrimitiveType.Quad);
            Object.Destroy(face.GetComponent<Collider>());
            face.name = "ClockFace";
            face.transform.SetParent(root, false);
            face.transform.position = new Vector3(towerX, 11.2f, towerZ + tw / 2f + 0.06f);
            face.transform.localScale = new Vector3(cd, cd, 1f);
            var fm = Mats.Unlit(Color.white);
            var ft = ClockFace();
            if (fm.HasProperty("_BaseMap")) fm.SetTexture("_BaseMap", ft);
            if (fm.HasProperty("_MainTex")) fm.SetTexture("_MainTex", ft);
            SetTransparent(fm);
            face.GetComponent<Renderer>().sharedMaterial = fm;

            // exactly one warm window: warm light is used very selectively
            var win = GameObject.CreatePrimitive(PrimitiveType.Quad);
            Object.Destroy(win.GetComponent<Collider>());
            win.name = "WarmWindow";
            win.transform.SetParent(root, false);
            win.transform.position = new Vector3(towerX, 3.2f, towerZ + tw / 2f + 0.05f);
            win.transform.localScale = new Vector3(0.9f, 1.5f, 1f);
            win.GetComponent<Renderer>().sharedMaterial = Mats.Unlit(new Color(1f, 0.76f, 0.48f));

            // stars
            var star = Mats.Unlit(new Color(0.95f, 0.92f, 0.82f));
            for (int i = 0; i < 70; i++)
            {
                var s = GameObject.CreatePrimitive(PrimitiveType.Quad);
                Object.Destroy(s.GetComponent<Collider>());
                s.name = "Star"; s.transform.SetParent(root, false);
                s.transform.position = new Vector3(-45f + (float)rng.NextDouble() * 95f, 14f + (float)rng.NextDouble() * 26f, -60f);
                float k = 0.12f + (float)rng.NextDouble() * 0.22f;
                s.transform.localScale = new Vector3(k, k, 1f);
                s.GetComponent<Renderer>().sharedMaterial = star;
            }
        }

        static GameObject Piece(Transform root, PrimitiveType t, Vector3 pos, Vector3 scale, Material m)
        {
            var g = GameObject.CreatePrimitive(t);
            Object.Destroy(g.GetComponent<Collider>());
            g.transform.SetParent(root, false);
            g.transform.position = pos; g.transform.localScale = scale;
            g.GetComponent<Renderer>().sharedMaterial = m;
            return g;
        }

        // URP Unlit: make the transparent corners of the clock texture cut out
        static void SetTransparent(Material m)
        {
            if (m.HasProperty("_Surface")) { m.SetFloat("_Surface", 1f); m.SetFloat("_Blend", 0f); }
            if (m.HasProperty("_SrcBlend")) { m.SetFloat("_SrcBlend", (float)UnityEngine.Rendering.BlendMode.SrcAlpha); m.SetFloat("_DstBlend", (float)UnityEngine.Rendering.BlendMode.OneMinusSrcAlpha); m.SetFloat("_ZWrite", 0f); }
            m.SetOverrideTag("RenderType", "Transparent");
            m.renderQueue = 3000;
            m.EnableKeyword("_SURFACE_TYPE_TRANSPARENT");
            if (m.HasProperty("_Cutoff")) m.SetFloat("_Cutoff", 0.5f);
        }
    }
}
