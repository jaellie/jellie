using System.Collections;
using System.Collections.Generic;
using UnityEngine;

// The Past: Mom's childhood house in Jangheung, golden hour. She is a little girl in black rubber shoes.
// Plan coordinates: the road runs east-west at z = 0, the hanok stands to the south (z < 0).
public class PastWorld : World
{
    const float ROAD_Z = 0f;
    static readonly Vector3 EXIT = new Vector3(19.2f, 0f, ROAD_Z);

    Transform canopy, fallen, boat;
    float shake, t, timeIn; bool leaving;
    readonly List<Transform> jarLids = new List<Transform>();
    readonly List<GameObject> flies = new List<GameObject>(); readonly List<Vector3> flyBase = new List<Vector3>();
    GameObject portalGlow, exitLightGo; Light exitLight;
    Renderer streamRend;

    public PastWorld(GameController game) : base(game, "past") { }

    public override void Build()
    {
        ambient = new Color(0.88f, 0.76f, 0.58f); fogColor = Kit.C("#F4D7A2"); fogStart = 35f; fogEnd = 170f;
        skyMat = MakeSky(1.6f, "#E8B87A", 1.0f);
        MakeSun("#FFD49A", 1.45f, new Vector3(24, 215, 0));
        var r = root.transform;

        Kit.Solid(Kit.Box(r, new Vector3(64f, 0.3f, 54f), new Vector3(0f, -0.3f, 0f), "#BDB37A", 0f, Kit.MatTex(ProcTex.Speckle("#BDB37A"), 0.02f, new Vector2(14f, 12f)))).name = "ground";
        var dirt = Kit.MatTex(ProcTex.Speckle("#CDB088"), 0.02f, new Vector2(10f, 1f));
        Kit.NoShadow(Kit.Box(r, new Vector3(44f, 0.04f, 2.6f), new Vector3(0f, 0f, ROAD_Z), "#CDB088", 0f, dirt));
        Kit.NoShadow(Kit.Box(r, new Vector3(16f, 0.03f, 9f), new Vector3(0f, 0f, -8.5f), "#CDB088", 0f, dirt));
        Kit.NoShadow(Kit.Box(r, new Vector3(2.2f, 0.035f, 4f), new Vector3(0f, 0f, -2f), "#CDB088", 0f, dirt));

        BuildHouse(); BuildYard(); BuildVillage(); BuildExit(); BuildScenery();
        // outer bounds
        Kit.Blocker(r, new Vector3(-26f, 2f, 0f), new Vector3(10f, 4f, 60f)); Kit.Blocker(r, new Vector3(26f, 2f, 0f), new Vector3(10f, 4f, 60f));
        Kit.Blocker(r, new Vector3(0f, 2f, -19f), new Vector3(60f, 4f, 8f)); Kit.Blocker(r, new Vector3(0f, 2f, 19.5f), new Vector3(60f, 4f, 8f));
    }

    void BuildScenery()
    {
        var r = root.transform; var rnd = new System.Random(31);
        for (int i = 0; i < 16; i++)
        {
            float a = i / 16f * Mathf.PI * 2f, rr = 55f + (float)rnd.NextDouble() * 25f, h = 10f + (float)rnd.NextDouble() * 14f;
            Kit.NoShadow(Kit.Cone(r, 14f + (float)rnd.NextDouble() * 10f, h, new Vector3(Mathf.Sin(a) * rr, -1f, Mathf.Cos(a) * rr), "#8E9A66", 6));
        }
        for (int i = 0; i < 26; i++)
        {
            float x = -24f + (float)rnd.NextDouble() * 48f, z = rnd.NextDouble() > 0.5 ? -17f - (float)rnd.NextDouble() * 4f : 16f + (float)rnd.NextDouble() * 3f;
            Kenney.Spawn(i % 2 == 0 ? "sub/tree-large" : "sub/tree-small", r, new Vector3(x, 0f, z), (float)rnd.NextDouble() * 360f, 1f, null, -1f, 3.4f + (float)rnd.NextDouble() * 2f);
        }
    }

    void BuildHouse()
    {
        var r = root.transform;
        Kit.Solid(Kit.Box(r, new Vector3(8.6f, 0.45f, 3.6f), new Vector3(0f, 0f, -11.5f), "#B8AA92", 0.03f));
        Kit.Box(r, new Vector3(8f, 2.1f, 3f), new Vector3(0f, 0.45f, -11.8f), "#F1E6D0");
        for (int i = 0; i <= 4; i++) Kit.Box(r, new Vector3(0.18f, 2.3f, 0.18f), new Vector3(-4f + i * 2f, 0.45f, -10.2f), "#7A5536");
        Kit.Box(r, new Vector3(8.4f, 0.2f, 0.2f), new Vector3(0f, 2.55f, -10.2f), "#7A5536");
        var paper = Kit.Mat("#FBF3DF", 0.05f, 0f, "#FFE6B8", 0.25f);
        foreach (float x in new[] { -3f, -1f, 1f, 3f })
        {
            Kit.Box(r, new Vector3(1.6f, 1.7f, 0.05f), new Vector3(x, 0.65f, -10.28f), "#FBF3DF", 0f, paper);
            Kit.NoShadow(Kit.Box(r, new Vector3(0.03f, 1.7f, 0.06f), new Vector3(x, 0.65f, -10.26f), "#8C6A4A"));
            Kit.NoShadow(Kit.Box(r, new Vector3(1.6f, 0.03f, 0.06f), new Vector3(x, 1.5f, -10.26f), "#8C6A4A"));
        }
        // tiled gabled roof (two sloped slabs, deep eaves) + ridge
        var roofM = Kit.Mat("#4F4B4D", 0.2f);
        foreach (int s in new[] { -1, 1 })
        {
            var slab = Kit.Box(r, new Vector3(10.2f, 0.18f, 3.9f), new Vector3(0f, 0f, 0f), "#4F4B4D", 0.02f, roofM);
            slab.transform.localPosition = new Vector3(0f, 3.5f, -11.6f + s * 1.55f);
            slab.transform.localRotation = Quaternion.Euler(-s * 24f, 0f, 0f);
        }
        Kit.Box(r, new Vector3(10.4f, 0.22f, 0.5f), new Vector3(0f, 4.15f, -11.6f), "#3F3B3D", 0.03f);
        Kit.Box(r, new Vector3(8f, 0.5f, 3.0f), new Vector3(0f, 2.55f, -11.8f), "#F1E6D0");
        // 마루
        Kit.Solid(Kit.Box(r, new Vector3(6.4f, 0.12f, 1.5f), new Vector3(0f, 0.44f, -9.55f), "#B98A5E", 0.01f, Kit.MatTex(ProcTex.Planks(), 0.2f, new Vector2(3f, 1f))));
        foreach (float x in new[] { -3f, 0f, 3f }) Kit.Box(r, new Vector3(0.15f, 0.44f, 0.15f), new Vector3(x, 0f, -8.9f), "#7A5536");
        Kit.Blocker(r, new Vector3(0f, 1.5f, -11.2f), new Vector3(8.6f, 3f, 4.6f));
        // 댓돌 + little black rubber shoes with a note
        Kit.Box(r, new Vector3(1.5f, 0.28f, 0.6f), new Vector3(0.4f, 0f, -8.45f), "#A49A8A", 0.06f);
        for (int i = 0; i < 2; i++)
        {
            Kit.Box(r, new Vector3(0.09f, 0.04f, 0.2f), new Vector3(0.3f + i * 0.13f, 0.28f, -8.4f), "#141414", 0.025f);
            Kit.Box(r, new Vector3(0.085f, 0.06f, 0.13f), new Vector3(0.3f + i * 0.13f, 0.31f, -8.43f), "#1E1E20", 0.03f);
        }
        var note = Kit.Box(r, new Vector3(0.06f, 0.01f, 0.05f), new Vector3(0.3f, 0.36f, -8.36f), "#FFF0C8"); note.transform.localRotation = Quaternion.Euler(35f, 0f, 0f);
        Add("pastShoes", new Vector3(0.35f, 0.4f, -7.8f), 1.1f, () => Disc("past_shoe_note", new Vector3(0.35f, 0.5f, -8.4f)), "past_shoe_note", null, 0.55f);
    }

    IEnumerator Disc(string id, Vector3 where) { yield return g.StartCoroutine(g.Discover(id, where)); }

    void BuildYard()
    {
        var r = root.transform;
        var wall = Kit.Mat("#C9A77E", 0.0f); var cap = Kit.Mat("#5A5658", 0.2f);
        System.Action<float, float, float, float> mud = (x, z, w, d) =>
        {
            Kit.Solid(Kit.Box(r, new Vector3(w, 1.25f, d), new Vector3(x, 0f, z), "#C9A77E", 0.02f, wall));
            Kit.Box(r, new Vector3(w + 0.15f, 0.18f, d + 0.25f), new Vector3(x, 1.25f, z), "#5A5658", 0.03f, cap);
        };
        mud(-4.6f, -4f, 6.8f, 0.35f); mud(4.6f, -4f, 6.8f, 0.35f); mud(-8f, -8.8f, 0.35f, 9.6f); mud(8f, -8.8f, 0.35f, 9.6f); mud(0f, -13.75f, 16.3f, 0.35f);
        foreach (float sx in new[] { -1.2f, 1.2f }) Kit.Box(r, new Vector3(0.22f, 2f, 0.22f), new Vector3(sx, 0f, -4f), "#7A5536");
        Kit.Box(r, new Vector3(2.8f, 0.18f, 0.3f), new Vector3(0f, 2f, -4f), "#5A5658", 0.03f);
        foreach (int s in new[] { -1, 1 })
        {
            var piv = Kit.Group(r, "gate", new Vector3(s * 1.15f, 0.15f, -4f), s * -70f);
            Kit.Box(piv, new Vector3(1.0f, 1.6f, 0.08f), new Vector3(-s * 0.5f, 0f, 0f), "#8C6A4A");
        }

        // persimmon tree
        var tree = Kit.Group(r, "persimmon-tree", new Vector3(-5.3f, 0f, -6.6f));
        Kit.Cyl(tree, 0.24f, 2.2f, Vector3.zero, "#6B4E3A", 6);
        foreach (float a in new[] { 0.5f, -0.6f, 2.2f })
        {
            var br = Kit.Cyl(tree, 0.09f, 1.1f, new Vector3(0f, 1.8f, 0f), "#6B4E3A", 5);
            br.transform.localRotation = Quaternion.Euler(Mathf.Cos(a) * 45f, 0f, Mathf.Sin(a) * 45f);
        }
        canopy = Kit.Group(tree, "canopy", new Vector3(0f, 2.8f, 0f));
        var rnd = new System.Random(5);
        for (int i = 0; i < 8; i++)
            Kit.Sph(canopy, 0.9f + (float)rnd.NextDouble() * 0.4f, new Vector3(((float)rnd.NextDouble() - 0.5f) * 2.2f, ((float)rnd.NextDouble() - 0.3f), ((float)rnd.NextDouble() - 0.5f) * 2.2f), i % 2 == 1 ? "#7E8F3E" : "#8F9A48").transform.localScale *= 1f;
        var kaki = Kit.Mat("#EE7B2A", 0.3f, 0f, "#C04A10", 0.15f);
        for (int i = 0; i < 16; i++)
        {
            float a = (float)rnd.NextDouble() * Mathf.PI * 2f, rr = 1.0f + (float)rnd.NextDouble() * 0.7f;
            Kit.Sph(canopy, 0.12f, new Vector3(Mathf.Cos(a) * rr, -0.4f + (float)rnd.NextDouble() * 1.2f, Mathf.Sin(a) * rr), "#EE7B2A", kaki);
        }
        Kit.CylBlocker(r, new Vector3(-5.3f, 1f, -6.6f), 0.35f, 2f);
        var fk = Kit.Group(r, "fallen-persimmon", Vector3.zero); fallen = fk;
        Kit.Sph(fk, 0.12f, Vector3.zero, "#EE7B2A", kaki);
        Kit.Box(fk, new Vector3(0.1f, 0.005f, 0.07f), new Vector3(0.1f, 0.1f, 0.08f), "#FFF0C8");
        fk.gameObject.SetActive(false);
        Add("kakiTree", new Vector3(-5.3f, 1.4f, -6.6f), 1.5f, () => ShakeTree(), "past_persimmon_note", null, 0.4f);

        // 장독대
        Kit.Solid(Kit.Box(r, new Vector3(3.2f, 0.35f, 2.2f), new Vector3(5.4f, 0f, -11.3f), "#A49A8A", 0.05f));
        var jarM = Kit.Mat("#6A3E24", 0.45f, 0.05f);
        float[,] jars = { { 4.4f, -12f, 1.0f }, { 5.4f, -12f, 1.15f }, { 6.4f, -12f, 0.9f }, { 4.6f, -10.7f, 0.75f }, { 5.6f, -10.7f, 0.85f }, { 6.5f, -10.7f, 0.7f } };
        for (int i = 0; i < 6; i++)
        {
            float x = jars[i, 0], z = jars[i, 1], sc = jars[i, 2];
            var j = Kit.Sph(r, 0.42f, new Vector3(x, 0.35f + 0.4f * sc, z), "#6A3E24", jarM); j.transform.localScale = new Vector3(sc, sc * 1.05f, sc);
            var lid = Kit.Group(r, "lid", new Vector3(x, 0.35f + 0.8f * sc, z));
            Kit.Cyl(lid, 0.3f * sc, 0.1f, Vector3.zero, "#5A341E", 10); Kit.Sph(lid, 0.06f, new Vector3(0f, 0.11f, 0f), "#5A341E");
            jarLids.Add(lid);
        }
        Add("jar", new Vector3(4.7f, 1.0f, -9.75f), 1.25f, () => OpenJar(), "past_jar_gift", null, 0.4f);
        Kit.Cyl(r, 0.45f, 0.25f, new Vector3(-2.8f, 0f, -8f), "#B7B0A4", 10);
    }

    IEnumerator ShakeTree()
    {
        g.busy = true;
        g.mom.FaceToward(new Vector3(-5.3f, 0f, -6.6f)); g.audio.Play("rustle"); shake = 1.2f;
        if (!g.disc.IsFound("past_persimmon_note"))
        {
            Vector3 p = g.mom.transform.position, start = new Vector3(-5.3f + (p.x + 5.3f) * 0.3f, 2.6f, -6.6f + (p.z + 6.6f) * 0.3f);
            fallen.gameObject.SetActive(true);
            yield return g.StartCoroutine(Anim.Over(0.7f, u => fallen.position = new Vector3(start.x, 2.6f - u * u * 2.5f + 0.1f, start.z), u => u));
            g.audio.Play("thud");
            yield return Anim.Wait(0.4f);
            g.busy = false;
            yield return g.StartCoroutine(g.Discover("past_persimmon_note", fallen.position + Vector3.up * 0.5f));
        }
        else yield return Anim.Wait(0.8f);
        g.busy = false;
    }

    IEnumerator OpenJar()
    {
        var lid = jarLids[4]; Vector3 p0 = lid.position; g.audio.Play("lid");
        yield return g.StartCoroutine(Anim.Over(0.5f, u => { lid.position = p0 + Vector3.up * u * 0.25f; lid.localRotation = Quaternion.Euler(0f, 0f, u * 28f); }));
        g.Say("된장 냄새~", 1.6f); yield return Anim.Wait(0.8f);
        yield return g.StartCoroutine(g.Discover("past_jar_gift", new Vector3(5.6f, 1.2f, -10.7f)));
        yield return g.StartCoroutine(Anim.Over(0.5f, u => { lid.position = p0 + Vector3.up * (1f - u) * 0.25f; lid.localRotation = Quaternion.Euler(0f, 0f, (1f - u) * 28f); }));
    }

    void BuildVillage()
    {
        var r = root.transform; var rnd = new System.Random(9);
        // stone walls along the road
        var stone = Kit.Mat("#9C9282", 0.05f);
        System.Action<float, float, float> sw = (x0, x1, z) =>
        {
            for (float x = x0; x < x1; x += 0.55f)
            {
                var s = Kit.Sph(r, 0.33f + (float)rnd.NextDouble() * 0.1f, new Vector3(x + 0.27f, 0.25f + (float)rnd.NextDouble() * 0.08f, z + ((float)rnd.NextDouble() - 0.5f) * 0.08f), "#9C9282", stone);
                s.transform.localScale = new Vector3(1f, 0.75f, 0.85f) * s.transform.localScale.x;
                Kit.NoShadow(s);
            }
            Kit.Blocker(r, new Vector3((x0 + x1) / 2f, 0.4f, z), new Vector3(x1 - x0, 0.8f, 0.6f));
        };
        sw(-20f, -16.5f, -1.5f); sw(-10.5f, -1.6f, -1.5f); sw(1.6f, 20f, -1.5f);
        sw(-20f, -13f, 1.5f); sw(-1.5f, 8.6f, 1.5f); sw(13.4f, 20f, 1.5f);

        // 구멍가게 + candy table
        var shop = Kenney.Spawn("shop/low-detail-building-b", r, new Vector3(-13.5f, 0f, -4.6f), 0f, 1f, null, 5f, -1f, -1f, true);
        var sign = Kit.Text(r, "구멍가게", new Vector3(-13.5f, 2.2f, -2.6f), 0.5f, "#3A2E28"); sign.transform.localRotation = Quaternion.Euler(0f, 0f, 0f);
        Kit.Solid(Kit.Box(r, new Vector3(1.4f, 0.7f, 0.6f), new Vector3(-12.6f, 0f, -1.9f), "#A87C55", 0.02f));
        string[] cc = { "#E4574F", "#E8C547", "#7BB6B0" };
        for (int i = 0; i < 3; i++) Kit.Cyl(r, 0.14f, 0.3f, new Vector3(-13.05f + i * 0.45f, 0.7f, -1.9f), cc[i], 8);

        // rice field + scarecrow
        Kit.NoShadow(Kit.Box(r, new Vector3(10f, 0.06f, 9f), new Vector3(-7.5f, 0f, 9f), "#A7A050"));
        var stalkM = Kit.Mat("#D6C25A", 0.05f);
        int n = 0;
        for (float x = -12.2f; x < -2.8f; x += 0.7f) for (float z = 4.8f; z < 13.3f; z += 0.7f)
        {
            if (Mathf.Abs(z - 9f) < 0.55f) continue;
            var s = Kit.Cone(r, 0.14f, 0.55f + (float)rnd.NextDouble() * 0.2f, new Vector3(x + ((float)rnd.NextDouble() - 0.5f) * 0.25f, 0f, z + ((float)rnd.NextDouble() - 0.5f) * 0.25f), "#D6C25A", 4, stalkM);
            Kit.NoShadow(s); n++;
        }
        Kit.NoShadow(Kit.Box(r, new Vector3(10f, 0.1f, 0.9f), new Vector3(-7.5f, 0f, 9f), "#B79A6A"));
        var sc = Kit.Group(r, "scarecrow", new Vector3(-7.5f, 0f, 9f));
        Kit.Cyl(sc, 0.05f, 1.8f, Vector3.zero, "#7A5536", 5);
        Kit.Box(sc, new Vector3(1.4f, 0.08f, 0.08f), new Vector3(0f, 1.35f, 0f), "#7A5536");
        Kit.Box(sc, new Vector3(0.6f, 0.6f, 0.25f), new Vector3(0f, 0.95f, 0f), "#9C5B4B", 0.04f);
        Kit.Sph(sc, 0.2f, new Vector3(0f, 1.75f, 0f), "#E6D2A6"); Kit.Cone(sc, 0.42f, 0.25f, new Vector3(0f, 1.85f, 0f), "#D9B860");
        Kit.CylBlocker(r, new Vector3(-7.5f, 1f, 9f), 0.3f, 2f);

        // stream with stepping stones, paper boat
        streamRend = Kit.Quad(r, 2.6f, 12f, new Vector3(11f, 0.02f, 9.6f), Kit.MatUnique("#7FB3B0", 0.9f, 0.1f, null, 1f, 0.85f)).GetComponent<Renderer>();
        streamRend.transform.localRotation = Quaternion.Euler(90f, 0f, 0f); Kit.NoShadow(streamRend.gameObject);
        foreach (float sx in new[] { 9.6f, 12.4f }) Kit.NoShadow(Kit.Box(r, new Vector3(0.4f, 0.15f, 12f), new Vector3(sx, -0.05f, 9.6f), "#A49A8A"));
        foreach (float x in new[] { 10.1f, 10.8f, 11.5f, 12.1f }) Kit.Cyl(r, 0.28f, 0.14f, new Vector3(x, 0f, 8.0f), "#B8AE9E", 7);
        Kit.Blocker(r, new Vector3(11f, 1f, 5.5f), new Vector3(2.6f, 2f, 4.3f)); Kit.Blocker(r, new Vector3(11f, 1f, 12f), new Vector3(2.6f, 2f, 7.2f));
        boat = Kit.Group(r, "paper-boat", Vector3.zero);
        var hull = Kit.Cone(boat, 0.16f, 0.12f, new Vector3(0f, 0.06f, 0f), "#FFFFFF", 3); hull.transform.localScale = new Vector3(1.4f, 1f, 0.6f); hull.transform.localRotation = Quaternion.Euler(180f, 0f, 0f);
        Kit.Cone(boat, 0.1f, 0.2f, new Vector3(0f, 0.1f, 0f), "#FFF8E8", 3).transform.localScale = new Vector3(1f, 1f, 0.2f);
        boat.gameObject.SetActive(false);
        Add("boat", new Vector3(9.3f, 0.5f, 5.8f), 1.3f, () => FloatBoat(), "past_boat_photo", null, 0.4f);
    }

    IEnumerator FloatBoat()
    {
        g.busy = true;
        g.mom.FaceToward(new Vector3(11f, 0f, 5.8f)); g.audio.Play("splash");
        boat.gameObject.SetActive(true);
        yield return g.StartCoroutine(Anim.Over(3.2f, u => { boat.position = new Vector3(11f + Mathf.Sin(u * 9f) * 0.2f, 0.05f + Mathf.Sin(u * 14f) * 0.02f, 4.2f + u * 7f); boat.localRotation = Quaternion.Euler(0f, Mathf.Sin(u * 6f) * 23f, 0f); }, u => u));
        g.busy = false;
        if (!g.disc.IsFound("past_boat_photo")) yield return g.StartCoroutine(g.Discover("past_boat_photo", boat.position + Vector3.up * 0.5f));
        boat.gameObject.SetActive(false);
    }

    void BuildExit()
    {
        var r = root.transform;
        portalGlow = Kit.GlowSprite(r, EXIT + new Vector3(0f, 1.6f, 0f), 5.5f, "#FFF1CC", 0.85f);
        Kit.GlowSprite(r, EXIT + new Vector3(0f, 1.2f, 0f), 2.2f, "#FFFFFF", 0.9f);
        exitLight = MakeLamp(new Vector3(18.5f, 1.5f, ROAD_Z), "#FFE2A8", 2.2f, 9f);
        var rnd = new System.Random(2);
        for (int i = 0; i < 22; i++)
        {
            var b = new Vector3(14f + (float)rnd.NextDouble() * 5.5f, 0.4f + (float)rnd.NextDouble() * 1.6f, ROAD_Z - 1.4f + (float)rnd.NextDouble() * 2.8f);
            flies.Add(Kit.GlowSprite(r, b, 0.22f, "#E8FF9A", 0.8f)); flyBase.Add(b);
        }
    }

    public override void Enter(string from)
    {
        g.SetMomForm(true, true);
        g.mom.ShowBag(false, 0);
        g.mom.Teleport(new Vector3(0f, 0f, -2.6f), 180f);
        leaving = false; timeIn = 0f;
        g.audio.SetLoops("bgm_past", "cicadas");
        g.StartCoroutine(Hello());
    }

    IEnumerator Hello() { yield return Anim.Wait(1.8f); g.Say("어? 여기… 우리 집이다!", 2.6f); }

    public override string Surface(Vector3 p) { return "dirt"; }

    public override void Tick(float dt)
    {
        t += dt; timeIn += dt;
        shake = Mathf.Max(0f, shake - dt);
        if (canopy != null) canopy.localRotation = Quaternion.Euler(Mathf.Cos(t * 21f) * 2.3f * shake, 0f, Mathf.Sin(t * 25f) * 2.9f * shake + Mathf.Sin(t * 0.8f) * 0.5f);
        for (int i = 0; i < flies.Count; i++)
        {
            var b = flyBase[i]; float p = i * 1.9f;
            flies[i].transform.position = root.transform.TransformPoint(b + new Vector3(Mathf.Sin(t * 0.7f + p) * 0.6f, Mathf.Sin(t * 1.3f + p * 2f) * 0.3f, Mathf.Cos(t * 0.5f + p) * 0.5f));
            Kit.SetGlowAlpha(flies[i], 0.35f + 0.55f * Mathf.Max(0f, Mathf.Sin(t * 2.2f + p * 3f)));
        }
        if (exitLight != null) exitLight.intensity = 2.1f + Mathf.Sin(t * 1.4f) * 0.3f;
        var pos = g.mom.transform.position;
        if (!leaving && timeIn > 2f && !g.busy && Vector2.Distance(new Vector2(pos.x, pos.z), new Vector2(EXIT.x, EXIT.z)) < 1.6f)
        {
            leaving = true;
            g.SayKey("pastBack", 2f);
            g.StartCoroutine(Leave());
        }
    }

    IEnumerator Leave() { yield return Anim.Wait(1.2f); yield return g.StartCoroutine(g.GoTo("home", Color.white, 2.2f)); }
}
