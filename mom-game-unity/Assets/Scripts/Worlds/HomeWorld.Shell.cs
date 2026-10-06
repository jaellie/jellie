using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public partial class HomeWorld
{
    Material wallM;
    readonly List<Transform> boats = new List<Transform>();
    readonly List<Transform> gulls = new List<Transform>();

    // wall segment on the plan line (x0,z0)-(x1,z1); (nx,nz) = which side is the inside (thickness goes outside)
    void WallSeg(string name, float x0, float z0, float x1, float z1, int nx, int nz, float y0 = 0f, float y1 = WALL_H, bool baseboard = true)
    {
        bool alongX = Mathf.Abs(z1 - z0) < 0.001f;
        float len = Mathf.Max(Mathf.Abs(x1 - x0), Mathf.Abs(z1 - z0));
        float cx = (x0 + x1) / 2f - nx * T / 2f, cz = (z0 + z1) / 2f - nz * T / 2f;
        Vector3 size = alongX ? new Vector3(len + T, y1 - y0, T) : new Vector3(T, y1 - y0, len + T);
        var go = Kit.Box(root.transform, size, new Vector3(cx, y0, cz), "#EFE3D0", 0f, wallM);
        go.name = name; Kit.Wall(go);
        if (baseboard && y0 < 0.01f)
        {
            Vector3 bs = alongX ? new Vector3(len, 0.08f, 0.02f) : new Vector3(0.02f, 0.08f, len);
            Kit.NoShadow(Kit.Box(root.transform, bs, new Vector3((x0 + x1) / 2f + nx * 0.011f, 0f, (z0 + z1) / 2f + nz * 0.011f), "#EAD8B8"));
        }
    }

    void Floor(float x0, float z0, float x1, float z1, Texture2D tex, float tile, string tint = null)
    {
        float w = x1 - x0, d = z1 - z0;
        var m = Kit.MatTex(tex, 0.28f, new Vector2(w / tile, d / tile));
        if (tint != null) m.color = Kit.C(tint);
        var f = Kit.Box(root.transform, new Vector3(w, 0.1f, d), new Vector3((x0 + x1) / 2f, -0.1f, (z0 + z1) / 2f), "#DDBE92", 0f, m);
        f.name = "floor"; Kit.Solid(f);
    }

    void Ceiling(float x0, float z0, float x1, float z1)
    {
        var m = Kit.Mat("#F7F1E6", 0.02f, 0f, "#8A7A66", 0.5f);
        var c = Kit.Box(root.transform, new Vector3(x1 - x0, 0.1f, z1 - z0), new Vector3((x0 + x1) / 2f, WALL_H, (z0 + z1) / 2f), "#F7F1E6", 0f, m);
        c.name = "ceiling";
    }

    void CeilingLight(float x, float z, float w, float d, float lampIntensity, float add, float range)
    {
        var m = Kit.Unlit(Kit.C("#FFF4DE") * 1.1f);
        Kit.NoShadow(Kit.Box(root.transform, new Vector3(w, 0.03f, d), new Vector3(x, WALL_H - 0.03f, z), "#FFF4DE", 0f, m));
        var l = MakeLamp(new Vector3(x, WALL_H - 0.4f, z), "#FFC98A", lampIntensity, range, false);
        lamps.Add(l); lampBase.Add(lampIntensity); lampAdd.Add(add);
    }

    void BuildShell()
    {
        wallM = Kit.Mat("#EFE3D0", 0.02f);
        var plank = ProcTex.Planks();
        Floor(LX0, LZ0, LX1, LZ1, plank, 2.2f);
        Floor(KX0, KZ0, KX1, KZ1, plank, 2.2f);
        Floor(HX0, HZ0, HX1, HZ1, plank, 2.2f);
        // entry: white marble tiles with a gold art-deco pattern, and a grey terrazzo step up to the hall
        Floor(EX0, EZ0 + 0.3f, EX1, EZ1, ProcTex.ArtDeco(), 1.2f);
        Floor(EX0, EZ0, EX1, EZ0 + 0.3f, ProcTex.Terrazzo(), 0.5f);

        Ceiling(LX0, LZ0, LX1, LZ1); Ceiling(KX0, KZ0, KX1, KZ1); Ceiling(HX0, HZ0, HX1, HZ1); Ceiling(EX0, EZ0, EX1, EZ1);
        CeilingLight(2.0f, 2.3f, 1.3f, 0.7f, 0.9f, 2.6f, 7f);
        CeilingLight(1.7f, 6.1f, 1.0f, 0.6f, 0.7f, 2.0f, 6f);
        CeilingLight(5.6f, 3.97f, 0.9f, 0.4f, 0.5f, 1.4f, 5f);
        CeilingLight(7.2f, 5.3f, 0.5f, 0.5f, 0.55f, 1.4f, 4f);

        // south wall with the big window opening
        WallSeg("south-left", 0f, 0f, WIN_X0, 0f, 0, 1);
        WallSeg("south-right", WIN_X1, 0f, LX1, 0f, 0, 1);
        WallSeg("south-top", WIN_X0, 0f, WIN_X1, 0f, 0, 1, WIN_TOP, WALL_H, false);
        WallSeg("east-living", LX1, 0f, LX1, HZ0, -1, 0);
        WallSeg("hall-south", HX0, HZ0, HX1, HZ0, 0, 1);
        WallSeg("east-entry", HX1, HZ0, HX1, EZ1, -1, 0);
        WallSeg("entry-north", EX0, EZ1, EX1, EZ1, 0, -1);
        WallSeg("entry-west", EX0, EZ0, EX0, EZ1, 1, 0);
        WallSeg("hall-north", KX1, HZ1, EX0, HZ1, 0, -1);
        WallSeg("kitchen-east", KX1, KZ0, KX1, KZ1, -1, 0);
        WallSeg("kitchen-north", KX0, KZ1, KX1, KZ1, 0, -1);
        WallSeg("west", 0f, 0f, 0f, KZ1, 1, 0);

        // the white marble wall of the entry (left of the front door)
        var mm = Kit.MatTex(ProcTex.Marble(), 0.4f, new Vector2(1.5f, 1.2f));
        Kit.NoShadow(Kit.Box(root.transform, new Vector3(0.02f, 2.3f, EZ1 - EZ0), new Vector3(EX0 + 0.011f, 0f, (EZ0 + EZ1) / 2f), "#F7F5F1", 0f, mm));

        // TV-wall panelling (west wall)
        var pm = Kit.Mat("#B9A58C", 0.12f);
        Kit.NoShadow(Kit.Box(root.transform, new Vector3(0.03f, 2.3f, 2.2f), new Vector3(0.016f, 0.08f, 2.05f), "#B9A58C", 0f, pm));
        for (int i = 0; i < 3; i++) Kit.NoShadow(Kit.Box(root.transform, new Vector3(0.035f, 2.3f, 0.015f), new Vector3(0.018f, 0.08f, 1.0f + i * 1.05f), "#8A7660"));
        Kit.NoShadow(Kit.Box(root.transform, new Vector3(0.035f, 0.015f, 2.2f), new Vector3(0.018f, 1.2f, 2.05f), "#8A7660"));

        BuildDoorsAndFixtures();
    }

    void BuildDoorsAndFixtures()
    {
        // closed doors from the sketch: Room 2 & Room 1 on the hall's south wall, the 창고 (storage) door
        // on the hall's north wall, the bathroom door at the end of the hall
        Kenney.Spawn("furn/doorway", root.transform, new Vector3(4.95f, 0f, HZ0 + 0.03f), 0f, 1f, null, 0.9f);
        Kenney.Spawn("furn/doorway", root.transform, new Vector3(7.0f, 0f, HZ0 + 0.03f), 0f, 1f, null, 0.9f);
        Kenney.Spawn("furn/doorway", root.transform, new Vector3(4.45f, 0f, HZ1 - 0.03f), 180f, 1f, null, 0.9f);
        Kenney.Spawn("furn/doorway", root.transform, new Vector3(HX1 - 0.03f, 0f, 3.98f), 270f, 1f, null, 0.9f);
        // a framed print in the hall
        Kit.NoShadow(Kit.Box(root.transform, new Vector3(0.6f, 0.45f, 0.03f), new Vector3(5.75f, 1.3f, HZ1 - 0.03f), "#C48A52", 0.01f));
        Kit.NoShadow(Kit.Box(root.transform, new Vector3(0.5f, 0.35f, 0.01f), new Vector3(5.75f, 1.35f, HZ1 - 0.05f), "#F2C9A4"));
        // the apartment's video intercom on the hall wall
        Kit.Box(root.transform, new Vector3(0.2f, 0.28f, 0.035f), new Vector3(4.2f, 1.3f, HZ0 + 0.02f), "#F4F1EA", 0.012f);
        Kit.Box(root.transform, new Vector3(0.14f, 0.1f, 0.01f), new Vector3(4.2f, 1.47f, HZ0 + 0.04f), "#2F3A40");
        // wall air conditioner (east wall of the living room)
        var ac = Kit.Box(root.transform, new Vector3(0.22f, 0.3f, 0.95f), new Vector3(LX1 - 0.12f, 1.95f, 1.95f), "#FBFAF6", 0.06f);
        ac.name = "air-conditioner";
        Kit.Box(root.transform, new Vector3(0.02f, 0.03f, 0.8f), new Vector3(LX1 - 0.23f, 1.99f, 1.95f), "#D9D4CA");
    }

    // ───────────────────────── the world outside the window ─────────────────────────
    void BuildOutside()
    {
        var o = Kit.Group(root.transform, "outside", Vector3.zero);
        const float SEA_Y = -55f;
        // sea
        var sea = new GameObject("sea"); sea.transform.SetParent(o, false);
        sea.transform.localPosition = new Vector3(0f, SEA_Y, -900f);
        sea.AddComponent<MeshFilter>().sharedMesh = ProcTex.Grid(34, 3600f);
        seaRend = sea.AddComponent<MeshRenderer>();
        seaRend.sharedMaterial = Kit.MatUnique("#4F8EA4", 0.88f, 0.0f);
        seaRend.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
        var ss = sea.AddComponent<SeaSurface>(); ss.amp = 2.2f; ss.scale = 0.0035f; ss.speed = 0.8f;
        // distant islands and headlands (Yeosu bay)
        var rnd = new System.Random(4);
        for (int i = 0; i < 12; i++)
        {
            float a = Mathf.Lerp(-1.1f, 1.1f, i / 11f) + (float)(rnd.NextDouble() - 0.5) * 0.12f;
            float dist = 950f + (float)rnd.NextDouble() * 650f, r = 120f + (float)rnd.NextDouble() * 160f, h = 50f + (float)rnd.NextDouble() * 90f;
            var hill = Kit.Cone(o, r, h, new Vector3(Mathf.Sin(a) * dist, SEA_Y - 4f, -Mathf.Cos(a) * dist), i % 3 == 0 ? "#6C8A68" : "#7C9770", 7);
            hill.transform.localScale = new Vector3(1f, 1f, 0.55f + (float)rnd.NextDouble() * 0.4f);
            Kit.NoShadow(hill);
        }
        // neighbourhood across the bay: Kenney commercial towers + low buildings on little shores
        string[] towers = { "shop/building-skyscraper-a", "shop/building-skyscraper-b", "shop/building-skyscraper-c", "shop/building-skyscraper-d", "shop/building-skyscraper-e" };
        string[] low = { "shop/building-a", "shop/building-c", "shop/building-e", "shop/building-g", "shop/building-k", "sub/building-type-a", "sub/building-type-c", "sub/building-type-f" };
        Kit.NoShadow(Kit.Box(o, new Vector3(520f, 3f, 260f), new Vector3(-420f, SEA_Y - 3f, -330f), "#9DAF7E"));
        Kit.NoShadow(Kit.Box(o, new Vector3(520f, 3f, 260f), new Vector3(430f, SEA_Y - 3f, -350f), "#9DAF7E"));
        for (int i = 0; i < 9; i++)
        {
            float side = i % 2 == 0 ? -1f : 1f;
            float x = side * (200f + (float)rnd.NextDouble() * 400f), z = -230f - (float)rnd.NextDouble() * 200f;
            var t = Kenney.Spawn(towers[rnd.Next(towers.Length)], o, new Vector3(x, SEA_Y, z), (float)rnd.NextDouble() * 360f, 1f, null, -1f, 50f + (float)rnd.NextDouble() * 60f);
            Kit.NoShadow(t);
        }
        for (int i = 0; i < 18; i++)
        {
            float side = i % 2 == 0 ? -1f : 1f;
            float x = side * (170f + (float)rnd.NextDouble() * 440f), z = -250f - (float)rnd.NextDouble() * 160f;
            var t = Kenney.Spawn(low[rnd.Next(low.Length)], o, new Vector3(x, SEA_Y, z), (float)rnd.NextDouble() * 360f, 1f, null, -1f, 14f + (float)rnd.NextDouble() * 10f);
            Kit.NoShadow(t);
        }
        // boats (Kenney watercraft) bobbing on the water
        string[] bk = { "boat/boat-fishing-small", "boat/boat-sail-a", "boat/boat-speed-a", "boat/boat-tow-a", "boat/boat-sail-b", "boat/boat-row-large" };
        Vector3[] bp = { new Vector3(-95f, SEA_Y, -230f), new Vector3(140f, SEA_Y, -330f), new Vector3(-30f, SEA_Y, -520f), new Vector3(260f, SEA_Y, -460f), new Vector3(-240f, SEA_Y, -400f), new Vector3(60f, SEA_Y, -180f) };
        for (int i = 0; i < bk.Length; i++)
        {
            var b = Kenney.Spawn(bk[i], o, bp[i], 40f + i * 63f, 1f, null, -1f, 13f);
            Kit.NoShadow(b); boats.Add(b.transform);
        }
        // a few gulls
        for (int i = 0; i < 4; i++)
        {
            var gt = new GameObject("gull").transform; gt.SetParent(o, false);
            Kit.NoShadow(Kit.Box(gt, new Vector3(1.1f, 0.03f, 0.25f), new Vector3(-0.55f, 0f, 0f), "#FFF8EE")).transform.localRotation = Quaternion.Euler(0, 0, 14f);
            Kit.NoShadow(Kit.Box(gt, new Vector3(1.1f, 0.03f, 0.25f), new Vector3(0.55f, 0f, 0f), "#FFF8EE")).transform.localRotation = Quaternion.Euler(0, 0, -14f);
            gulls.Add(gt);
        }
    }

    // ───────────────────────── window, glass, curtains ─────────────────────────
    void BuildWindow()
    {
        var frame = Kit.Mat("#FBF8F2", 0.3f);
        foreach (var x in new[] { WIN_X0, 1.63f, 2.47f, WIN_X1 })
            Kit.Box(root.transform, new Vector3(x == 1.63f || x == 2.47f ? 0.05f : 0.06f, WIN_TOP, 0.08f), new Vector3(x, 0f, -0.04f), "#FBF8F2", 0f, frame);
        Kit.Box(root.transform, new Vector3(WIN_X1 - WIN_X0 + 0.06f, 0.06f, 0.1f), new Vector3((WIN_X0 + WIN_X1) / 2f, WIN_TOP - 0.06f, -0.04f), "#FBF8F2", 0f, frame);
        Kit.Box(root.transform, new Vector3(WIN_X1 - WIN_X0 + 0.06f, 0.04f, 0.12f), new Vector3((WIN_X0 + WIN_X1) / 2f, 0f, -0.04f), "#FBF8F2", 0f, frame);
        Kit.Box(root.transform, new Vector3(WIN_X1 - WIN_X0, 0.035f, 0.05f), new Vector3((WIN_X0 + WIN_X1) / 2f, 1.6f, -0.05f), "#FBF8F2", 0f, frame);
        var glass = Kit.MatUnique("#FFF1DE", 0.95f, 0f, null, 1f, 0.1f);
        float[] gx = { WIN_X0, 1.63f, 2.47f, WIN_X1 };
        for (int i = 0; i < 3; i++)
        {
            var q = Kit.Quad(root.transform, gx[i + 1] - gx[i] - 0.04f, WIN_TOP - 0.08f, new Vector3((gx[i] + gx[i + 1]) / 2f, WIN_TOP / 2f, -0.06f), glass);
            Kit.NoShadow(q); q.transform.localRotation = Quaternion.Euler(0, 180f, 0); // face the room
        }
        // warm, slightly overexposed glow in the window
        windowGlow = Kit.Quad(root.transform, WIN_X1 - WIN_X0 + 1.4f, WIN_TOP + 1.0f, new Vector3((WIN_X0 + WIN_X1) / 2f, WIN_TOP / 2f, -0.14f), Kit.AdditiveMat(Kit.GlowTex(), new Color(1, 0.9f, 0.7f, 0.1f)));
        windowGlow.transform.localRotation = Quaternion.Euler(0, 180f, 0); Kit.NoShadow(windowGlow);
        glowRend = windowGlow.GetComponent<Renderer>();

        // curtains: rod, mauve panels, sheer
        Kit.NoShadow(Kit.Box(root.transform, new Vector3(3.1f, 0.035f, 0.035f), new Vector3(2.05f, 2.285f, 0.14f), "#C9A06A"));
        var mauve = Kit.MatUnique("#C4A3AE", 0.02f);
        var sheer = Kit.MatUnique("#FBF1EA", 0.0f, 0f, "#FFE9CC", 0.12f, 0.55f);
        var cm = ProcTex.Curtain(1.5f, 2.24f, 7);
        curtainL = MakeCurtain(cm, mauve, 0.55f, 0.14f, 1f); curtainR = MakeCurtain(cm, mauve, 3.55f, 0.14f, -1f);
        sheerL = MakeCurtain(cm, sheer, 0.55f, 0.08f, 1f); sheerR = MakeCurtain(cm, sheer, 3.55f, 0.08f, -1f);
        SetCurtains(0f);

        Add("curtains", new Vector3(2.05f, 1.2f, 0.55f), 1.25f, () => OpenCurtains(), null, () => !curtainsOpen && !busyCurtains);
        Add("sea-view", new Vector3(2.15f, 1.3f, 0.5f), 0.9f, () => LookOut(new Vector3(1.25f, 1.62f, 3.3f), 0f, Content.Bubble("curtains")), null, () => curtainsOpen);
    }

    Transform MakeCurtain(Mesh mesh, Material mat, float x, float z, float sign)
    {
        var go = new GameObject("curtain"); go.transform.SetParent(root.transform, false);
        go.transform.localPosition = new Vector3(x, 2.28f, z);
        go.AddComponent<MeshFilter>().sharedMesh = mesh;
        var r = go.AddComponent<MeshRenderer>(); r.sharedMaterial = mat;
        if (mat.color.a < 0.99f) r.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
        go.transform.localScale = new Vector3(sign, 1f, 1f);
        return go.transform;
    }
}
