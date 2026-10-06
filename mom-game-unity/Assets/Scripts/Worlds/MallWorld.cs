using System.Collections;
using System.Collections.Generic;
using UnityEngine;

// LF Square: a bright, airy, warm-white mall. Atrium + fountain, open boutiques with plain text signs
// (no real logos); Thursday Island and ZOOC (Mom's favourites) get the biggest fronts.
// Plan: the entrance is on the south side (z = 10.5), shops line the west, east and north walls.
public class MallWorld : World
{
    const float WALL_H = 4.2f, X0 = -14f, X1 = 14f, Z0 = -11f, Z1 = 10.5f;
    float t; Transform coin; Transform frCurtain; bool frOpen;
    readonly List<Transform> beams = new List<Transform>(); readonly List<Renderer> beamRend = new List<Renderer>();
    readonly List<Transform> walkers = new List<Transform>(); readonly List<Vector3[]> paths = new List<Vector3[]>(); readonly List<float> walkT = new List<float>();
    GameObject water; Transform spire;

    public MallWorld(GameController game) : base(game, "mall") { }

    public override void Build()
    {
        ambient = new Color(0.95f, 0.88f, 0.78f); fogColor = Kit.C("#FFF1DE"); fogStart = 40f; fogEnd = 120f;
        skyMat = MakeSky(0.9f, "#9EC2E2", 1.2f);
        MakeSun("#FFE3B0", 1.45f, new Vector3(52f, 200f, 0f), 0.7f);
        var r = root.transform;
        var tile = Kit.MatTex(ProcTex.Tiles("#F2E8D8", 8), 0.45f, new Vector2(14f, 11f));
        Kit.Solid(Kit.Box(r, new Vector3(28f, 0.2f, 22f), new Vector3(0f, -0.2f, -0.25f), "#F2E8D8", 0f, tile)).name = "floor";
        Kit.NoShadow(Kit.Box(r, new Vector3(44f, 0.1f, 14f), new Vector3(0f, -0.22f, 17.5f), "#D9CDBA"));
        Kit.Solid(Kit.Box(r, new Vector3(120f, 0.3f, 100f), new Vector3(0f, -0.6f, 20f), "#A9B784")).name = "lawn";
        Kit.Solid(Kit.Box(r, new Vector3(44f, 0.3f, 14f), new Vector3(0f, -0.3f, 17.5f), "#D9CDBA")).name = "forecourt";

        // walls: north + sides solid; south = glass front with an open entrance
        var wm = Kit.Mat("#FBF6EE", 0.05f);
        Kit.Wall(Kit.Box(r, new Vector3(28.4f, WALL_H, 0.2f), new Vector3(0f, 0f, Z0 - 0.1f), "#FBF6EE", 0f, wm));
        Kit.Wall(Kit.Box(r, new Vector3(0.2f, WALL_H, 21.5f), new Vector3(X0 - 0.1f, 0f, -0.25f), "#FBF6EE", 0f, wm));
        Kit.Wall(Kit.Box(r, new Vector3(0.2f, WALL_H, 21.5f), new Vector3(X1 + 0.1f, 0f, -0.25f), "#FBF6EE", 0f, wm));
        var glass = Kit.MatUnique("#E8F3F2", 0.9f, 0f, null, 1f, 0.22f);
        foreach (var seg in new[] { new Vector2(X0, -2.5f), new Vector2(2.5f, X1) })
        {
            var gl = Kit.Box(r, new Vector3(seg.y - seg.x, 3.4f, 0.08f), new Vector3((seg.x + seg.y) / 2f, 0f, Z1), "#E8F3F2", 0f, glass); Kit.NoShadow(gl); Kit.Solid(gl);
            Kit.Box(r, new Vector3(seg.y - seg.x, 0.12f, 0.12f), new Vector3((seg.x + seg.y) / 2f, 3.4f, Z1), "#C9A06A");
        }
        // columns + planters
        foreach (var c in new[] { new Vector2(-5f, -4.5f), new Vector2(5f, -4.5f), new Vector2(-5f, 4f), new Vector2(5f, 4f) })
        {
            Kit.Solid(Kit.Cyl(r, 0.32f, WALL_H, new Vector3(c.x, 0f, c.y), "#F3EADC", 12));
            Kit.Solid(Kit.Frustum(r, 0.6f, 0.5f, 0.45f, new Vector3(c.x, 0f, c.y), "#C9A06A", 10));
            Kenney.Spawn("furn/pottedPlant", r, new Vector3(c.x, 0.4f, c.y + 0.0f), 0f, 1f, null, -1f, 1.3f);
        }
        // skylight shafts
        var beamTex = ProcTex.Beam();
        for (int i = 0; i < 4; i++)
        {
            var q = Kit.Quad(r, 1.4f, 7f, new Vector3(-2.4f + i * 1.6f, 3.6f, -2f + (i % 2) * 0.8f), Kit.AdditiveMat(beamTex, new Color(1f, 0.88f, 0.66f, 0.08f)));
            Kit.NoShadow(q); q.transform.localRotation = Quaternion.Euler(0f, 0f, 14f); beams.Add(q.transform); beamRend.Add(q.GetComponent<Renderer>());
            var q2 = Kit.Quad(r, 1.4f, 7f, q.transform.localPosition, Kit.AdditiveMat(beamTex, new Color(1f, 0.88f, 0.66f, 0.08f)));
            Kit.NoShadow(q2); q2.transform.localRotation = Quaternion.Euler(0f, 90f, 14f); beams.Add(q2.transform); beamRend.Add(q2.GetComponent<Renderer>());
        }
        MakeLamp(new Vector3(0f, 3.8f, 0f), "#FFE4BA", 1.2f, 18f); MakeLamp(new Vector3(-9f, 3.5f, 6f), "#FFE4BA", 0.8f, 12f); MakeLamp(new Vector3(9f, 3.5f, 6f), "#FFE4BA", 0.8f, 12f);
        MakeLamp(new Vector3(0f, 3.5f, -8f), "#FFE4BA", 0.8f, 12f);

        BuildFountain();
        BuildThursdayIsland();
        BuildZooc();
        BuildNorthRow();
        BuildPeople();
        BuildOutside();
        // outside bounds
        Kit.Blocker(r, new Vector3(-23f, 2f, 17f), new Vector3(2f, 4f, 16f)); Kit.Blocker(r, new Vector3(23f, 2f, 17f), new Vector3(2f, 4f, 16f));
        Kit.Blocker(r, new Vector3(0f, 2f, 25.5f), new Vector3(48f, 4f, 2f));
    }

    // ───────────────────────── helpers ─────────────────────────
    // rotY: 0 = faces the viewer standing south of the sign (looks −z), -90 = viewer east, 90 = viewer west.
    void Sign(string text, Vector3 pos, float rotY, float w, bool big)
    {
        var g0 = Kit.Group(root.transform, "sign", pos, rotY);
        float h = big ? 0.75f : 0.55f;
        Kit.NoShadow(Kit.Box(g0, new Vector3(w, h, 0.08f), new Vector3(0f, -h / 2f, 0f), "#FFFDF8", 0.03f));
        var tm = Kit.Text(g0, text, new Vector3(0f, -h / 2f, -0.05f), big ? 0.42f : 0.32f, "#3A2E28");
    }

    void Tinted(float x0, float z0, float x1, float z1, string hex)
    {
        Kit.NoShadow(Kit.Box(root.transform, new Vector3(x1 - x0 - 0.1f, 0.02f, z1 - z0 - 0.1f), new Vector3((x0 + x1) / 2f, 0f, (z0 + z1) / 2f), hex, 0f, Kit.Mat(hex, 0.3f)));
    }

    void Partition(float x, float z, float w, float d, string hex)
    {
        Kit.Solid(Kit.Box(root.transform, new Vector3(w, 0.6f, d), new Vector3(x, 0f, z), hex, 0.02f));
    }

    void Rack(float x, float z, string[] colors, float heading = 0f)
    {
        var g0 = Kit.Group(root.transform, "rack", new Vector3(x, 0f, z), heading);
        Kit.Cyl(g0, 0.02f, 1.5f, new Vector3(-0.8f, 0f, 0f), "#B9A07A", 5); Kit.Cyl(g0, 0.02f, 1.5f, new Vector3(0.8f, 0f, 0f), "#B9A07A", 5);
        Kit.Box(g0, new Vector3(1.64f, 0.03f, 0.03f), new Vector3(0f, 1.45f, 0f), "#B9A07A");
        for (int i = 0; i < colors.Length; i++) Kit.Box(g0, new Vector3(0.08f, 0.75f, 0.42f), new Vector3(-0.6f + i * 0.2f, 0.62f, 0f), colors[i], 0.02f);
        Kit.Blocker(root.transform, new Vector3(x, 0.7f, z), new Vector3(heading % 180f == 0f ? 1.7f : 0.5f, 1.4f, heading % 180f == 0f ? 0.5f : 1.7f));
    }

    void Bag()
    {
        int n = 0;
        foreach (var id in new[] { "mall_mirror", "mall_cardigan_note", "mall_flower_note", "mall_fountain_gift" }) if (g.disc.IsFound(id)) n++;
        g.mom.ShowBag(true, n + 1);
    }

    IEnumerator Found(string id, Vector3 where) { yield return g.StartCoroutine(g.Discover(id, where)); Bag(); }

    IEnumerator Chat(string text, Vector3 face, float wait = 1.4f)
    {
        g.busy = true; g.mom.FaceToward(face); g.Say(text, 2.2f); yield return Anim.Wait(wait); g.busy = false;
    }

    // ───────────────────────── fountain ─────────────────────────
    void BuildFountain()
    {
        var r = root.transform;
        Kit.Solid(Kit.Frustum(r, 2.4f, 2.2f, 0.55f, Vector3.zero, "#EFE6D6", 28));
        water = Kit.Cyl(r, 2.0f, 0.02f, new Vector3(0f, 0.5f, 0f), "#8CC9D0", 28, Kit.MatUnique("#8CC9D0", 0.95f, 0.1f, null, 1f, 0.8f));
        Kit.NoShadow(water);
        Kit.Frustum(r, 0.5f, 0.35f, 0.9f, Vector3.zero, "#F3EADC", 16);
        Kit.Frustum(r, 1.0f, 0.6f, 0.2f, new Vector3(0f, 0.9f, 0f), "#F3EADC", 20);
        spire = Kit.Group(r, "spire", new Vector3(0f, 1.1f, 0f));
        Kit.Sph(spire, 0.22f, new Vector3(0f, 0.2f, 0f), "#BFE6EA", Kit.MatUnique("#BFE6EA", 0.95f, 0f, "#9ED8E0", 0.2f, 0.85f));
        for (int i = 0; i < 6; i++) Kit.GlowSprite(spire, new Vector3(Mathf.Cos(i * 1.05f) * 0.5f, 0.2f + (i % 2) * 0.2f, Mathf.Sin(i * 1.05f) * 0.5f), 0.22f, "#D8F4F8", 0.7f);
        coin = Kit.Cyl(r, 0.05f, 0.015f, Vector3.zero, "#E8C547", 10, Kit.Mat("#E8C547", 0.8f, 0.8f)).transform; coin.gameObject.SetActive(false);
        Add("fountain", new Vector3(0f, 0.7f, 2.8f), 1.5f, () => TossCoin(), "mall_fountain_gift", null, 0.5f);
    }

    IEnumerator TossCoin()
    {
        g.busy = true;
        g.mom.FaceToward(Vector3.zero); g.audio.Play("coin");
        Vector3 a = g.mom.transform.position + Vector3.up * 1.3f + g.mom.Forward * 0.3f, b = new Vector3(0.4f, 0.5f, 0.9f);
        coin.gameObject.SetActive(true);
        yield return g.StartCoroutine(Anim.Over(0.8f, u => { coin.position = Vector3.Lerp(a, b, u) + Vector3.up * Mathf.Sin(u * Mathf.PI) * 1.2f; coin.Rotate(0f, 0f, 700f * Time.deltaTime); }, u => u));
        coin.gameObject.SetActive(false); g.audio.Play("splash");
        g.Say("소원 빌었다!", 1.6f); yield return Anim.Wait(0.9f);
        g.busy = false;
        yield return g.StartCoroutine(Found("mall_fountain_gift", new Vector3(0.2f, 0.7f, 0.8f)));
    }

    // ───────────────────────── Thursday Island (west, big) ─────────────────────────
    void BuildThursdayIsland()
    {
        var r = root.transform; const string col = "#F3DCCB";
        Tinted(X0, 3f, -5.5f, Z1, col);
        Partition(-9.75f, 3f, 8.5f, 0.12f, col);
        Sign("Thursday Island", new Vector3(-5.6f, 3.4f, 6.8f), -90f, 6.2f, true);
        // fitting room + mirror
        var fr = Kit.Group(r, "fitting-room", new Vector3(-12.6f, 0f, 8.4f));
        Kit.Box(fr, new Vector3(1.6f, 2.4f, 0.08f), new Vector3(0f, 0f, -0.75f), "#E6C7B3");
        foreach (float sx in new[] { -0.8f, 0.8f }) Kit.Box(fr, new Vector3(0.08f, 2.4f, 1.5f), new Vector3(sx, 0f, 0f), "#E6C7B3");
        Kit.Box(fr, new Vector3(0.8f, 1.7f, 0.02f), new Vector3(0f, 0.3f, -0.7f), "#C9A06A");
        Kit.Box(fr, new Vector3(0.7f, 1.6f, 0.03f), new Vector3(0f, 0.35f, -0.69f), "#E9F2F4", 0f, Kit.Mat("#E9F2F4", 0.97f, 0.9f));
        Kit.Cyl(fr, 0.015f, 1.6f, new Vector3(0.8f, 2.35f, 0.75f), "#C9A06A", 5).transform.localRotation = Quaternion.Euler(0f, 0f, 90f);
        frCurtain = Kit.Group(fr, "curtain", new Vector3(0.5f, 0f, 0.75f));
        Kit.Box(frCurtain, new Vector3(0.5f, 2.2f, 0.03f), new Vector3(0f, 0.1f, 0f), "#C4A3AE");
        Kit.Blocker(r, new Vector3(-12.6f, 1.2f, 7.9f), new Vector3(1.7f, 2.4f, 0.1f));
        Kit.Blocker(r, new Vector3(-13.4f, 1.2f, 8.6f), new Vector3(0.1f, 2.4f, 1.6f)); Kit.Blocker(r, new Vector3(-11.8f, 1.2f, 8.6f), new Vector3(0.1f, 2.4f, 1.6f));
        Add("mirror", new Vector3(-12.6f, 1.3f, 8.2f), 1.1f, () => Mirror(), "mall_mirror", null, 0.5f);
        // racks + a cardigan with a note in its pocket
        Rack(-9.5f, 5.2f, new[] { "#F4B6C2", "#FFFFFF", "#C9B6E4", "#F2D3A0", "#F4B6C2", "#9CC5C0", "#FFFFFF" }, 90f);
        Rack(-9.5f, 7.6f, new[] { "#E9A3AE", "#F6EFE2", "#B98ACF", "#F4B6C2", "#FFE7A0", "#FFFFFF", "#C4A3AE" }, 90f);
        var card = Kit.Box(r, new Vector3(0.1f, 0.8f, 0.5f), new Vector3(-9.5f, 0.55f, 6.4f), "#F2A6B8", 0.03f);
        Kit.Box(r, new Vector3(0.06f, 0.06f, 0.06f), new Vector3(-9.42f, 0.85f, 6.4f), "#FFF3C9");
        Add("cardigan", new Vector3(-9.0f, 1.0f, 6.4f), 1.2f, () => Cardigan(), "mall_cardigan_note", null, 0.45f);
        Kenney.Spawn("furn/table", r, new Vector3(-12.5f, 0f, 4.4f), 0f, 1f, null, 1.4f);
        Kenney.Spawn("furn/loungeChair", r, new Vector3(-11f, 0f, 4.4f), 90f, 1f, null, 0.9f, -1f, -1f, true);
        Kenney.Spawn("furn/pottedPlant", r, new Vector3(-13.3f, 0f, 3.5f), 0f, 1f, null, -1f, 1.4f);
    }

    IEnumerator Mirror()
    {
        g.busy = true; g.mom.FaceToward(new Vector3(-12.6f, 0f, 7f)); g.Say("어머, 나 오늘 괜찮네?", 2.2f);
        g.audio.Play("curtain", 0.5f); yield return Anim.Wait(1.4f);
        g.busy = false;
        yield return g.StartCoroutine(Found("mall_mirror", new Vector3(-12.6f, 1.4f, 7.7f)));
    }

    IEnumerator Cardigan()
    {
        g.busy = true; g.mom.FaceToward(new Vector3(-9.5f, 0f, 6.4f)); g.audio.Play("rustle");
        g.Say("이 가디건 예쁘다…", 2f); yield return Anim.Wait(1.2f); g.busy = false;
        yield return g.StartCoroutine(Found("mall_cardigan_note", new Vector3(-9.4f, 0.9f, 6.4f)));
    }

    // ───────────────────────── ZOOC (east, big) ─────────────────────────
    void BuildZooc()
    {
        var r = root.transform; const string col = "#D6E6E0";
        Tinted(5.5f, 3f, X1, Z1, col);
        Partition(9.75f, 3f, 8.5f, 0.12f, col);
        Sign("ZOOC", new Vector3(5.6f, 3.4f, 6.8f), 90f, 4.2f, true);
        Kenney.Spawn("mart/shelf-boxes", r, new Vector3(13.4f, 0f, 5f), 90f, 1f, null, -1f, 1.9f, -1f, true);
        Kenney.Spawn("mart/shelf-bags", r, new Vector3(13.4f, 0f, 7.2f), 90f, 1f, null, -1f, 1.9f, -1f, true);
        Kenney.Spawn("mart/display-fruit", r, new Vector3(9f, 0f, 5.2f), 0f, 1f, null, -1f, 1.0f, -1f, true);
        Kenney.Spawn("mart/display-bread", r, new Vector3(11f, 0f, 5.2f), 0f, 1f, null, -1f, 1.0f, -1f, true);
        Kenney.Spawn("mart/cash-register", r, new Vector3(7.2f, 0.9f, 9.2f), 90f, 1f, null, -1f, 0.35f);
        Kit.Solid(Kit.Box(r, new Vector3(0.8f, 0.9f, 1.8f), new Vector3(7.2f, 0f, 9f), "#F6EFE2", 0.03f));
        Rack(8.5f, 8f, new[] { "#BFD8D2", "#FFFFFF", "#F2D3A0", "#9CC5C0", "#E9A3AE", "#FFFFFF" });
        Kenney.Spawn("mart/character-employee", r, new Vector3(7.9f, 0f, 9.1f), 90f);
        AddAuto("zooc", new Vector3(8.5f, 1.1f, 7.3f), 1.3f, () => Chat("여기 신상 나왔네~ 구경만 해야지.", new Vector3(8.5f, 0f, 8f)));
    }

    // ───────────────────────── north row ─────────────────────────
    void BuildNorthRow()
    {
        var r = root.transform; float w = 5.6f;
        string[] names = Content.MallShops; // [0]=Thursday Island, [1]=ZOOC, 2..6 = rest
        string[] cols = { "#F2E0D0", "#F6D9E0", "#EADFC8", "#D8E4EF", "#E7DCEB" };
        float[] xs = { -14f, -8.4f, -2.8f, 2.8f, 8.4f };
        for (int i = 0; i < 5; i++)
        {
            float x0 = xs[i], x1 = x0 + w, cx = (x0 + x1) / 2f;
            Tinted(x0, Z0, x1, -5f, cols[i]);
            if (i > 0) Partition(x0, -8f, 0.12f, 6f, cols[i]);
            Sign(names[2 + i], new Vector3(cx, 3.5f, -5.1f), 0f, w - 0.8f, false);
        }
        // 가방가게
        Kenney.Spawn("mart/shelf-bags", r, new Vector3(-11.2f, 0f, -10.3f), 0f, 1f, null, -1f, 1.8f, -1f, true);
        Kenney.Spawn("furn/table", r, new Vector3(-11.2f, 0f, -7f), 0f, 1f, null, 1.2f);
        AddAuto("bagshop", new Vector3(-11.2f, 1.1f, -7.5f), 1.4f, () => Chat("이 가방 예쁜데… 있는 것도 많은데 말야.", new Vector3(-11.2f, 0f, -9f)));
        // 꽃집
        var fl = new[] { "#F4B6C2", "#FFE7A0", "#E9A3AE", "#FFFFFF", "#C9B6E4" };
        for (int i = 0; i < 5; i++)
        {
            Kit.Cyl(r, 0.2f, 0.4f, new Vector3(-7.4f + i * 0.9f, 0f, -10.2f), "#C9A06A", 8);
            for (int k = 0; k < 6; k++) Kit.Sph(r, 0.1f, new Vector3(-7.4f + i * 0.9f + Mathf.Cos(k * 1.05f) * 0.14f, 0.55f + (k % 2) * 0.08f, -10.2f + Mathf.Sin(k * 1.05f) * 0.14f), fl[(i + k) % 5]);
        }
        Kenney.Spawn("furn/plantSmall1", r, new Vector3(-4f, 0.9f, -7.5f), 0f, 1f, null, -1f, 0.3f);
        Kit.Solid(Kit.Box(r, new Vector3(1.6f, 0.9f, 0.7f), new Vector3(-5.8f, 0f, -7.2f), "#FFF7EC", 0.04f));
        var bq = Kit.Group(r, "bouquet", new Vector3(-5.8f, 0.9f, -7.2f));
        for (int k = 0; k < 7; k++) Kit.Sph(bq, 0.1f, new Vector3(Mathf.Cos(k * 0.9f) * 0.16f, 0.2f + (k % 3) * 0.06f, Mathf.Sin(k * 0.9f) * 0.16f), fl[k % 5]);
        Kit.Cyl(bq, 0.05f, 0.18f, Vector3.zero, "#6FA85A", 6);
        Kit.Box(bq, new Vector3(0.12f, 0.08f, 0.01f), new Vector3(0.18f, 0.12f, -0.1f), "#FFF3C9");
        Add("bouquet", new Vector3(-5.8f, 1.0f, -6.7f), 1.3f, () => Bouquet(), "mall_flower_note", null, 0.45f);
        // 카페
        Kit.Solid(Kit.Box(r, new Vector3(4f, 1.0f, 0.8f), new Vector3(0f, 0f, -9.6f), "#E9D9BF", 0.03f));
        Kenney.Spawn("furn/kitchenCoffeeMachine", r, new Vector3(-1.2f, 1.0f, -9.6f), 0f, 1f, null, -1f, 0.45f);
        Kenney.Spawn("food/cup-coffee", r, new Vector3(0.4f, 1.0f, -9.5f), 0f, 1f, null, -1f, 0.15f);
        Kenney.Spawn("food/cake", r, new Vector3(1.2f, 1.0f, -9.5f), 0f, 1f, null, -1f, 0.22f);
        Kenney.Spawn("food/cupcake", r, new Vector3(1.7f, 1.0f, -9.5f), 0f, 1f, null, -1f, 0.12f);
        Kenney.Spawn("furn/tableRound", r, new Vector3(-1.5f, 0f, -6.5f), 0f, 1f, null, 0.9f, -1f, -1f, true);
        Kenney.Spawn("furn/tableRound", r, new Vector3(1.5f, 0f, -6.5f), 0f, 1f, null, 0.9f, -1f, -1f, true);
        Kenney.Spawn("furn/stoolBar", r, new Vector3(-1.5f, 0f, -5.8f), 0f, 1f, null, -1f, 0.6f);
        Kenney.Spawn("furn/stoolBar", r, new Vector3(1.5f, 0f, -5.8f), 0f, 1f, null, -1f, 0.6f);
        Kenney.Spawn("mart/character-employee", r, new Vector3(0f, 0f, -10.4f), 0f);
        AddAuto("cafe", new Vector3(0f, 1.1f, -8.5f), 1.5f, () => Chat("커피 향 좋다…", new Vector3(0f, 0f, -9.5f)));
        // 포토부스
        var pb = Kit.Group(r, "photo-booth", new Vector3(5.6f, 0f, -9.4f));
        Kit.Solid(Kit.Box(pb, new Vector3(1.8f, 2.4f, 0.1f), new Vector3(0f, 0f, -0.9f), "#F2A6B8", 0.02f));
        foreach (float sx in new[] { -0.9f, 0.9f }) Kit.Solid(Kit.Box(pb, new Vector3(0.1f, 2.4f, 1.8f), new Vector3(sx, 0f, 0f), "#F2A6B8", 0.02f));
        Kit.Box(pb, new Vector3(1.8f, 0.2f, 1.9f), new Vector3(0f, 2.3f, 0f), "#E58FA3", 0.03f);
        Kit.Box(pb, new Vector3(0.8f, 0.5f, 0.05f), new Vector3(0f, 1.1f, -0.82f), "#2A2E3A", 0.02f);
        Kit.Box(pb, new Vector3(1.0f, 0.05f, 0.5f), new Vector3(0f, 0.45f, -0.55f), "#FFF3C9");
        Add("booth", new Vector3(5.6f, 1.1f, -8.2f), 1.3f, () => Booth());
        // 신발가게
        Kenney.Spawn("mart/shelf-boxes", r, new Vector3(11.2f, 0f, -10.3f), 0f, 1f, null, -1f, 1.8f, -1f, true);
        Kenney.Spawn("furn/bench", r, new Vector3(11.2f, 0f, -7f), 0f, 1f, null, 1.4f, -1f, -1f, true);
        for (int i = 0; i < 4; i++) Kit.Box(r, new Vector3(0.09f, 0.07f, 0.24f), new Vector3(9.6f + i * 0.5f, 0.9f, -10.6f), new[] { "#E9B8C4", "#2A2E3A", "#7FC2D6", "#F2D3A0" }[i], 0.03f);
        AddAuto("shoeshop", new Vector3(11.2f, 1.1f, -8.2f), 1.5f, () => Chat("신발은… 지금 신은 게 제일 편해.", new Vector3(11.2f, 0f, -10f)));
    }

    IEnumerator Bouquet()
    {
        g.busy = true; g.mom.FaceToward(new Vector3(-5.8f, 0f, -7.2f)); g.audio.Play("rustle");
        g.Say("꽃 냄새 좋다~", 2f); yield return Anim.Wait(1.3f); g.busy = false;
        yield return g.StartCoroutine(Found("mall_flower_note", new Vector3(-5.6f, 1.1f, -7.2f)));
    }

    IEnumerator Booth()
    {
        g.busy = true; g.mom.FaceToward(new Vector3(5.6f, 0f, -9.4f)); g.audio.Play("click");
        yield return Anim.Wait(0.8f);
        g.audio.Play("sparkle"); g.hud.SetFade(0.8f, Color.white); yield return Anim.Wait(0.12f);
        yield return g.StartCoroutine(g.hud.Fade(0f, Color.white, 0.5f));
        g.Say("찰칵! 잘 나왔으려나?", 2f); yield return Anim.Wait(1.2f); g.busy = false;
    }

    // ───────────────────────── people + outside ─────────────────────────
    void BuildPeople()
    {
        var r = root.transform;
        Vector3[][] routes =
        {
            new[] { new Vector3(-8f, 0f, 1.5f), new Vector3(-8f, 0f, -3f), new Vector3(8f, 0f, -3f), new Vector3(8f, 0f, 1.5f) },
            new[] { new Vector3(3.5f, 0f, 8f), new Vector3(3.5f, 0f, 1f), new Vector3(-3.5f, 0f, 1f), new Vector3(-3.5f, 0f, 8f) },
            new[] { new Vector3(-3f, 0f, -4f), new Vector3(3f, 0f, -4f) },
        };
        for (int i = 0; i < routes.Length; i++)
        {
            var go = Kenney.Spawn("mart/character-employee", r, routes[i][0], 0f, 1f, i == 1 ? "colormap=#F4B6C2" : null);
            walkers.Add(go.transform); paths.Add(routes[i]); walkT.Add(i * 3f);
        }
    }

    void BuildOutside()
    {
        var r = root.transform;
        Cars.Dad(r, new Vector3(5.5f, 0f, 15f), 90f, true);
        Cars.Spawn("car/suv", r, new Vector3(-6f, 0f, 16f), 90f, 1.8f, true);
        Kenney.Spawn("rd/light-curved", r, new Vector3(-14f, 0f, 12f), 180f, 4.5f);
        Kenney.Spawn("rd/light-curved", r, new Vector3(14f, 0f, 12f), 180f, 4.5f);
        for (int i = 0; i < 8; i++) Kenney.Spawn(i % 2 == 0 ? "sub/tree-large" : "sub/tree-small", r, new Vector3(-30f + i * 8.5f, 0f, 26f + (i % 3)), i * 47f, 1f, null, -1f, 5f);
        Add("car", new Vector3(5.5f, 1.0f, 15f), 2.2f, () => GoHome(), null, null, 0.6f);
    }

    IEnumerator GoHome()
    {
        g.busy = true; g.SayKey("mallBack", 2.2f); g.mom.FaceToward(new Vector3(5.5f, 0f, 15f));
        yield return Anim.Wait(1.6f);
        g.busy = false;
        yield return g.StartCoroutine(g.GoTo("drive", Color.black, 1.2f));
    }

    public override void Enter(string from)
    {
        g.SetMomForm(false, true);
        g.mom.Teleport(new Vector3(0f, 0f, 9f), 180f);
        Bag();
        g.audio.SetLoops("bgm_mall", "chatter");
        g.StartCoroutine(Hello());
    }
    IEnumerator Hello() { yield return Anim.Wait(1.6f); g.Say("LF스퀘어다! 구경 좀 해볼까?", 2.8f); }
    public override string Surface(Vector3 p) { return p.z > Z1 ? "dirt" : "tile"; }

    public override void Tick(float dt)
    {
        t += dt;
        for (int i = 0; i < beamRend.Count; i++)
            beamRend[i].sharedMaterial.SetColor("_TintColor", new Color(1f, 0.88f, 0.66f, (0.09f + 0.03f * Mathf.Sin(t * 0.5f + i)) * 0.5f));
        spire.localPosition = new Vector3(0f, 1.1f + Mathf.Sin(t * 2f) * 0.03f, 0f);
        for (int i = 0; i < walkers.Count; i++)
        {
            var path = paths[i]; walkT[i] += dt * 0.9f;
            int n = path.Length; float u = walkT[i] % (n * 2 - 2);
            int seg = Mathf.Min((int)u, n * 2 - 3);
            int a = seg < n - 1 ? seg : n * 2 - 2 - seg, b = seg < n - 1 ? seg + 1 : n * 2 - 3 - seg;
            Vector3 pa = path[a], pb = path[b]; float f = u - seg;
            Vector3 p = Vector3.Lerp(pa, pb, f);
            Vector3 d = pb - pa;
            walkers[i].position = p; if (d.sqrMagnitude > 0.01f) walkers[i].rotation = Quaternion.Euler(0f, Mathf.Atan2(d.x, d.z) * Mathf.Rad2Deg + 180f, 0f);
        }
    }
}
