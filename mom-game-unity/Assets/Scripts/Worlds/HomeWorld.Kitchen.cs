using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public partial class HomeWorld
{
    // fridge cake
    GameObject cakeRoot, flame; Light candleLight; int cakeStep;
    // stove pot
    Transform lid; GameObject[] steam; bool steamOn; Vector3 lidRest;
    // whale glass
    Kit.Canvas2D whaleCv; Texture2D whaleTex; bool whaleOn; float whalePhase, whaleTimer;
    Light hoodLight;
    // fan + flowers
    Transform fanBlades, fanHead; bool fanOn; Transform jarFlowers; float flowerSway;
    TextMesh clockText;
    GameObject persimmon; Vector3 persimmonRest;

    const float COUNTER_Z = 7.365f;

    void BuildKitchen()
    {
        var r = root.transform;
        // tall wood-grain panel above the fridges
        Kit.NoShadow(Kit.Box(r, new Vector3(1.82f, WALL_H - 1.82f, 0.74f), new Vector3(0.94f, 1.82f, KZ1 - 0.37f), "#ADA69C", 0.01f));

        // fridges (north wall): dark graphite 4-door and silver side-by-side
        var dark = Kenney.Spawn("furn/kitchenFridgeLarge", r, new Vector3(0.53f, 0f, KZ1 - 0.42f), 180f, 1f, "metalLight=#3C4045;metalMedium=#4A4F55", -1f, 1.75f, -1f, true);
        var silver = Kenney.Spawn("furn/kitchenFridge", r, new Vector3(1.43f, 0f, KZ1 - 0.3f), 180f, 1f, null, -1f, 1.75f, -1f, true);
        // magnets + a family photo on the dark fridge door
        var fz = KZ1 - 0.84f;
        foreach (var m in new[] { new Vector3(0.28f, 1.55f, fz), new Vector3(0.62f, 1.62f, fz), new Vector3(0.78f, 1.35f, fz) })
            Kit.Cyl(r, 0.025f, 0.012f, m, new[] { "#F4B6C2", "#E8C547", "#7BD0D6" }[(int)(m.x * 10) % 3], 8).transform.localRotation = Quaternion.Euler(90, 0, 0);
        Kit.Box(r, new Vector3(0.16f, 0.2f, 0.006f), new Vector3(0.42f, 1.3f, fz - 0.003f), "#FFFFFF");
        Kit.Box(r, new Vector3(0.13f, 0.13f, 0.004f), new Vector3(0.42f, 1.33f, fz - 0.007f), "#E7B892");
        Add("silver-fridge", new Vector3(1.43f, 1.1f, 6.85f), 1.05f, () => FridgeCake(), "fridge_cake");
        BuildCake(r);

        // counter run: sink + stove, upper cabinet and hood
        Kenney.Spawn("furn/kitchenSink", r, new Vector3(2.265f, 0f, COUNTER_Z), 180f, 1.93f, null, -1f, -1f, -1f, true);
        Kenney.Spawn("furn/kitchenStove", r, new Vector3(3.095f, 0f, COUNTER_Z), 180f, 1.93f, null, -1f, -1f, -1f, true);
        Kenney.Spawn("furn/kitchenCabinetUpperDouble", r, new Vector3(2.265f, 1.5f, KZ1 - 0.22f), 180f, 1.93f);
        Kenney.Spawn("furn/hoodModern", r, new Vector3(3.095f, 1.5f, KZ1 - 0.28f), 180f, 1.93f);
        var tiles = Kit.MatTex(ProcTex.Tiles("#7BA7A3", 8), 0.45f, new Vector2(4f, 2f));
        Kit.NoShadow(Kit.Box(r, new Vector3(1.66f, 0.62f, 0.015f), new Vector3(2.67f, 0.9f, KZ1 - 0.01f), "#7BA7A3", 0f, tiles));
        Kit.Box(r, new Vector3(0.12f, 0.025f, 0.19f), new Vector3(2.55f, 0.885f, 7.52f), "#F5D33A", 0.01f).transform.localRotation = Quaternion.Euler(0, 25f, 0); // rubber glove
        // whale glass behind the hob (it glows and swims when the hood light is on)
        whaleCv = new Kit.Canvas2D(256, 160, Color.black);
        whaleTex = new Texture2D(256, 160, TextureFormat.RGBA32, false) { filterMode = FilterMode.Bilinear };
        DrawWhale(0f, 0.3f);
        var gm = Kit.UnlitTex(whaleTex, 0.8f);
        var glass = Kit.Quad(r, 0.78f, 0.5f, new Vector3(3.095f, 1.2f, KZ1 - 0.02f), gm); glass.transform.localRotation = Quaternion.Euler(0, 180f, 0); Kit.NoShadow(glass);
        hoodLight = MakeLamp(new Vector3(3.095f, 1.45f, 7.3f), "#FFC98A", 0.4f, 2.4f);
        Add("whale", new Vector3(3.3f, 1.25f, 6.85f), 0.9f, () => ToggleWhale());
        // stew pot with a lid
        Kenney.Spawn("food/pot", r, new Vector3(3.0f, 0.9f, 7.4f), 0f, 1f, null, 0.36f);
        var lidGo = Kenney.Spawn("food/pot-lid", r, new Vector3(3.0f, 1.04f, 7.4f), 0f, 1f, null, 0.34f);
        lid = lidGo.transform; lidRest = lid.localPosition;
        steam = new GameObject[8];
        for (int i = 0; i < 8; i++) { steam[i] = Kit.GlowSprite(r, new Vector3(3.0f, 1.2f, 7.4f), 0.25f, "#FFFFFF", 0f); steam[i].SetActive(false); }
        Add("pot", new Vector3(3.0f, 1.0f, 6.9f), 0.95f, () => LiftLid(), "soup_gift");

        // L-counter on the west wall (tissue box, clock, flowers)
        Kenney.Spawn("furn/kitchenCabinet", r, new Vector3(0.435f, 0f, 5.38f), 90f, 1.93f, null, -1f, -1f, -1f, true);
        Kenney.Spawn("furn/kitchenCabinet", r, new Vector3(0.435f, 0f, 6.2f), 90f, 1.93f, null, -1f, -1f, -1f, true);
        var tissueMat = Kit.Mat("#FFFDF8", 0.3f);
        Kit.Box(r, new Vector3(0.26f, 0.07f, 0.15f), new Vector3(0.3f, 0.87f, 5.2f), "#EBC8C0", 0.02f).transform.localRotation = Quaternion.Euler(0, 90f, 0);
        Kit.Box(r, new Vector3(0.14f, 0.11f, 0.25f), new Vector3(0.3f, 0.89f, 5.2f), "#FFFDF8", 0.012f, tissueMat);
        Kit.Cone(r, 0.05f, 0.08f, new Vector3(0.3f, 1.0f, 5.2f), "#FFFFFF", 4);
        Kit.Sph(r, 0.016f, new Vector3(0.3f, 0.99f, 5.13f), "#E8C547"); Kit.Sph(r, 0.016f, new Vector3(0.3f, 0.95f, 5.28f), "#4E8A3E");
        Kit.Box(r, new Vector3(0.05f, 0.09f, 0.16f), new Vector3(0.28f, 0.87f, 5.85f), "#F2EEE6", 0.012f);
        clockText = Kit.Text(r, "7:24", new Vector3(0.255f, 0.93f, 5.85f), 0.035f, "#FFB87A"); clockText.transform.localRotation = Quaternion.Euler(0, 90f, 0);
        Kit.Box(r, new Vector3(0.03f, 0.065f, 0.12f), new Vector3(0.262f, 0.89f, 5.85f), "#2A2622");
        BuildFlowerJar(r, new Vector3(0.3f, 0.87f, 6.45f));
        Add("flowers", new Vector3(0.85f, 1.2f, 6.45f), 0.95f, () => SmellFlowers());
        Add("clock", new Vector3(0.85f, 1.0f, 5.85f), 0.95f, () => ShowClock());

        BuildBar(r);
        BuildFan(r);
    }

    void BuildCake(Transform r)
    {
        cakeRoot = new GameObject("birthday-cake"); cakeRoot.transform.SetParent(r, false);
        cakeRoot.transform.localPosition = new Vector3(1.43f, 1.02f, 6.55f);
        Kenney.Spawn("food/plate", cakeRoot.transform, Vector3.zero, 0f, 1f, null, 0.42f);
        Kenney.Spawn("food/cake-birthday", cakeRoot.transform, new Vector3(0f, 0.02f, 0f), 0f, 1f, null, 0.33f);
        Kit.Cyl(cakeRoot.transform, 0.007f, 0.08f, new Vector3(0f, 0.2f, 0f), "#C9B6E4", 6);
        flame = Kit.GlowSprite(cakeRoot.transform, new Vector3(0f, 0.31f, 0f), 0.16f, "#FFB347", 0f);
        candleLight = MakeLamp(cakeRoot.transform.position + Vector3.up * 0.35f, "#FFB347", 0f, 1.6f);
        candleLight.transform.SetParent(cakeRoot.transform, true);
        cakeRoot.SetActive(false);
    }

    IEnumerator FridgeCake()
    {
        g.mom.FaceToward(new Vector3(1.43f, 0f, 7.5f));
        if (cakeStep == 0)
        {
            g.audio.Play("door");
            cakeRoot.SetActive(true);
            yield return g.StartCoroutine(Anim.Over(0.8f, t => cakeRoot.transform.localPosition = Vector3.Lerp(new Vector3(1.43f, 1.1f, 7.2f), new Vector3(1.43f, 1.02f, 6.55f), t)));
            cakeStep = 1;
        }
        else if (cakeStep == 1)
        {
            g.audio.Play("flame");
            flame.SetActive(true); Kit.SetGlowAlpha(flame, 0.9f); candleLight.intensity = 1.2f;
            g.Say("후~ 불어볼까?", 1.8f);
            cakeStep = 2;
        }
        else if (cakeStep == 2)
        {
            g.audio.Play("whoosh");
            yield return g.StartCoroutine(Anim.Over(0.45f, t => { Kit.SetGlowAlpha(flame, (1f - t) * 0.9f); candleLight.intensity = (1f - t) * 1.2f; }));
            cakeStep = 3;
            g.hud.EmoteAt("emote_hearts", cakeRoot.transform.position + Vector3.up * 0.5f);
            yield return g.StartCoroutine(g.Discover("fridge_cake", cakeRoot.transform.position + Vector3.up * 0.3f));
            cakeRoot.SetActive(false);
            cakeStep = 0;
        }
    }

    IEnumerator LiftLid()
    {
        g.audio.Play("lid"); g.mom.FaceToward(new Vector3(3.0f, 0f, 7.4f));
        bool up = lid.localPosition.y < lidRest.y + 0.05f;
        yield return g.StartCoroutine(Anim.Over(0.5f, t => { float u = up ? t : 1f - t; lid.localPosition = lidRest + new Vector3(u * 0.12f, u * 0.14f, 0f); lid.localRotation = Quaternion.Euler(0, 0, -u * 35f); }));
        steamOn = up;
        if (up && !g.disc.IsFound("soup_gift"))
        {
            yield return Anim.Wait(0.7f);
            yield return g.StartCoroutine(g.Discover("soup_gift", new Vector3(3.0f, 1.2f, 7.4f)));
        }
    }

    IEnumerator ToggleWhale()
    {
        whaleOn = !whaleOn; g.audio.Play("click");
        if (whaleOn) g.SayKey("whale");
        yield return null;
    }

    void DrawWhale(float phase, float glow)
    {
        var cv = whaleCv;
        for (int y = 0; y < 160; y++) cv.Rect(0, y, 256, 1, Color.Lerp(new Color(0.04f, 0.09f, 0.14f), new Color(0.07f, 0.16f, 0.23f), y / 160f));
        float cx = 128 + Mathf.Sin(phase) * 40f, cy = 80 + Mathf.Sin(phase * 2f) * 8f, dir = Mathf.Cos(phase) >= 0 ? 1f : -1f;
        Color w = new Color(0.43f, 0.78f, 1f);
        for (int y = -30; y <= 30; y++) for (int x = -66; x <= 66; x++)
            if ((x * x) / (62f * 62f) + (y * y) / (26f * 26f) <= 1f) cv.Set((int)(cx + x * dir), (int)(cy + y), w, 0.55f + glow * 0.45f);
        cv.Line(cx - 55f * dir, cy, cx - 92f * dir, cy - 20f, 6f, w, 0.8f); cv.Line(cx - 55f * dir, cy, cx - 92f * dir, cy + 22f, 6f, w, 0.8f);
        cv.Disc(cx + 38f * dir, cy - 6f, 3.5f, new Color(0.04f, 0.09f, 0.14f));
        whaleTex.SetPixels32(cv.px); whaleTex.Apply(false);
    }

    void BuildFlowerJar(Transform r, Vector3 p)
    {
        var jar = Kit.Cyl(r, 0.08f, 0.26f, p, "#DCEFEF", 10, Kit.MatUnique("#DCEFEF", 0.9f, 0f, null, 1f, 0.5f)); Kit.NoShadow(jar);
        jarFlowers = new GameObject("flowers").transform; jarFlowers.SetParent(r, false); jarFlowers.localPosition = p + Vector3.up * 0.22f;
        string[] cols = { "#B98ACF", "#FFFFFF", "#9C6DB8", "#F3EAF7", "#C9A3DE" };
        var rnd = new System.Random(3);
        for (int i = 0; i < 14; i++)
        {
            float a = i * 2.4f; var stem = new GameObject("stem").transform; stem.SetParent(jarFlowers, false);
            stem.localRotation = Quaternion.Euler(Mathf.Sin(a) * 18f, 0, Mathf.Cos(a) * 18f);
            float len = 0.16f + (i % 3) * 0.06f;
            Kit.NoShadow(Kit.Cyl(stem, 0.004f, len, Vector3.zero, "#6E8E5A", 4));
            if (i % 4 == 3) Kit.Sph(stem, 0.035f, new Vector3(0, len, 0), "#8FB3A0").transform.localScale = new Vector3(0.08f, 0.03f, 0.1f);
            else Kit.Sph(stem, 0.028f + (i % 2) * 0.008f, new Vector3(0, len, 0), cols[i % cols.Length]);
        }
    }

    IEnumerator SmellFlowers()
    {
        flowerSway = 1.5f; g.audio.Play("rustle"); g.mom.FaceToward(new Vector3(0.3f, 0f, 6.45f));
        g.Say("음~ 향기 좋다.", 1.8f);
        g.hud.EmoteAt("emote_hearts", new Vector3(0.3f, 1.3f, 6.45f));
        yield return Anim.Wait(1f);
    }

    IEnumerator ShowClock()
    {
        g.audio.Play("beep");
        int mins = 19 * 60 + 24 + Mathf.FloorToInt(Sunset * 52f);
        g.Say(((mins / 60) - 12) + ":" + (mins % 60).ToString("00") + " PM", 2f);
        yield return null;
    }

    // ───────────────────────── peninsula, stools, food ─────────────────────────
    void BuildBar(Transform r)
    {
        // speckled stone-look peninsula coming off the east wall, dark walnut base, black stools
        Kenney.Spawn("furn/kitchenBar", r, new Vector3(2.55f, 0f, 5.88f), 180f, 1f, "wood=#4A3524;metal=#2B2622", 0.94f, -1f, -1f, true);
        Kenney.Spawn("furn/kitchenBar", r, new Vector3(3.03f, 0f, 5.88f), 180f, 1f, "wood=#4A3524;metal=#2B2622", 0.94f, -1f, -1f, true);
        var stone = Kit.MatTex(ProcTex.Speckle("#B7A58D"), 0.35f, new Vector2(2f, 1f));
        Kit.Box(r, new Vector3(1.98f, 0.045f, 0.64f), new Vector3(2.52f, 0.92f, 5.88f), "#B7A58D", 0.012f, stone);
        float topY = 0.965f;
        // a home-cooked spread
        Kenney.Spawn("food/plate-dinner", r, new Vector3(1.85f, topY, 5.75f), 0f, 1f, null, 0.26f);
        Kenney.Spawn("food/bowl-soup", r, new Vector3(2.15f, topY, 5.7f), 0f, 1f, null, 0.2f);
        Kenney.Spawn("food/plate-dinner", r, new Vector3(2.45f, topY, 5.95f), 0f, 1f, "colormap=#FFFFFF", 0.26f);
        Kenney.Spawn("food/salad", r, new Vector3(2.7f, topY, 5.75f), 0f, 1f, null, 0.24f);
        Kenney.Spawn("food/rice-ball", r, new Vector3(2.95f, topY, 5.95f), 0f, 1f, null, 0.12f);
        foreach (float x in new[] { 1.95f, 2.65f }) { Kit.Box(r, new Vector3(0.01f, 0.008f, 0.2f), new Vector3(x, topY, 6.1f), "#B98ACF"); Kit.Box(r, new Vector3(0.01f, 0.008f, 0.2f), new Vector3(x + 0.025f, topY, 6.1f), "#B98ACF"); }
        // persimmon bowl (감) — take one
        Kenney.Spawn("food/bowl", r, new Vector3(3.2f, topY, 5.8f), 0f, 1f, "colormap=#F2E8DA", 0.3f);
        for (int i = 0; i < 3; i++) Kenney.Spawn("food/orange", r, new Vector3(3.14f + i * 0.06f, topY + 0.07f + (i == 2 ? 0.05f : 0f), 5.78f + (i % 2) * 0.05f), i * 70f, 1f, null, 0.095f);
        persimmon = Kenney.Spawn("food/orange", r, new Vector3(3.2f, topY + 0.14f, 5.84f), 0f, 1f, null, 0.1f); persimmonRest = persimmon.transform.localPosition;
        Add("persimmon", new Vector3(3.2f, 1.0f, 5.3f), 1.2f, () => TakePersimmon(), "persimmon_gift");

        // stools on the living-room side
        foreach (float x in new[] { 2.2f, 2.95f }) { Kenney.Spawn("furn/stoolBar", r, new Vector3(x, 0f, 5.3f), 180f, 1f, "wood=#4A3524;carpet=#2B2622", -1f, 0.68f); Kit.CylBlocker(r, new Vector3(x, 0.4f, 5.3f), 0.2f, 0.8f); }
        Add("stool-seat", new Vector3(2.2f, 0.7f, 4.85f), 0.8f, () => SitStool(), null, () => sittingOn == null);
    }

    IEnumerator TakePersimmon()
    {
        g.mom.FaceToward(persimmon.transform.position);
        if (persimmon.activeSelf)
        {
            yield return g.StartCoroutine(Anim.Over(0.6f, t => persimmon.transform.localPosition = persimmonRest + Vector3.up * (Mathf.Sin(t * Mathf.PI) * 0.25f)));
            persimmon.SetActive(false);
        }
        g.SayKey("persimmon", 3f);
        if (!g.disc.IsFound("persimmon_gift")) { yield return Anim.Wait(1.6f); yield return g.StartCoroutine(g.Discover("persimmon_gift", persimmonRest + Vector3.up * 0.1f)); }
    }

    IEnumerator SitStool()
    {
        chairStandPos = new Vector3(2.2f, 0f, 4.75f);
        g.mom.SitAt(new Vector3(2.2f, 0f, 5.18f), 0f, 0.12f); sittingOn = "chair";
        g.Say("", 0.1f);
        yield return Anim.Wait(0.8f);
        g.hud.EmoteAt("emote_faceHappy", g.mom.HeadPos + Vector3.up * 0.2f);
        g.SayKey("chairEat");
    }

    // ───────────────────────── fan ─────────────────────────
    void BuildFan(Transform r)
    {
        var f = new GameObject("fan").transform; f.SetParent(r, false); f.localPosition = new Vector3(3.3f, 0f, 4.72f); f.localRotation = Quaternion.Euler(0, -140f, 0);
        Kit.Cyl(f, 0.15f, 0.04f, Vector3.zero, "#7BD0D6", 12);
        Kit.Cyl(f, 0.025f, 0.8f, Vector3.zero, "#F2F2EE", 6);
        fanHead = new GameObject("head").transform; fanHead.SetParent(f, false); fanHead.localPosition = new Vector3(0, 0.92f, 0);
        Kit.Cap(fanHead, 0.07f, 0.22f, new Vector3(0, 0, -0.06f), "#7BD0D6").transform.localRotation = Quaternion.Euler(90, 0, 0);
        var cage = Kit.Cyl(fanHead, 0.2f, 0.01f, new Vector3(0, 0, 0.04f), "#E8F4F4", 20, Kit.MatUnique("#E8F4F4", 0.5f, 0f, null, 1f, 0.35f)); cage.transform.localRotation = Quaternion.Euler(90, 0, 0);
        fanBlades = new GameObject("blades").transform; fanBlades.SetParent(fanHead, false); fanBlades.localPosition = new Vector3(0, 0, 0.03f);
        for (int i = 0; i < 3; i++) { var b = Kit.Box(fanBlades, new Vector3(0.08f, 0.17f, 0.01f), new Vector3(0, 0.0f, 0), "#A9E3E6", 0.004f); b.transform.localRotation = Quaternion.Euler(0, 0, i * 120f); b.transform.localPosition = Quaternion.Euler(0, 0, i * 120f) * new Vector3(0, 0.09f, 0); }
        Kit.CylBlocker(r, new Vector3(3.3f, 0.5f, 4.72f), 0.18f, 1f);
        Add("fan", new Vector3(3.3f, 0.9f, 4.72f), 1.0f, () => ToggleFan());
    }

    IEnumerator ToggleFan() { fanOn = !fanOn; g.audio.Play("click"); if (fanOn) g.SayKey("fan"); yield return null; }

    void TickKitchen(float dt)
    {
        if (fanOn && fanBlades != null) { fanBlades.Rotate(0, 0, dt * 900f); fanHead.localRotation = Quaternion.Euler(0, Mathf.Sin(Time.time * 0.6f) * 35f, 0); }
        flowerSway = Mathf.Max(0f, flowerSway - dt * 0.8f);
        if (jarFlowers != null) jarFlowers.localRotation = Quaternion.Euler(Mathf.Sin(Time.time * 1.7f) * (1f + flowerSway * 5f), 0, Mathf.Sin(Time.time * 2.2f) * (1f + (fanOn ? 2f : 0f) + flowerSway * 7f));
        if (steam != null)
        {
            for (int i = 0; i < steam.Length; i++)
            {
                float t = Mathf.Repeat(Time.time * 0.45f + i / (float)steam.Length, 1f);
                steam[i].SetActive(steamOn);
                if (!steamOn) continue;
                steam[i].transform.position = new Vector3(3.0f + Mathf.Sin(Time.time * 2f + t * 9f) * 0.03f, 1.12f + t * 0.7f, 7.4f);
                steam[i].transform.localScale = Vector3.one * (0.15f + t * 0.35f);
                Kit.SetGlowAlpha(steam[i], Mathf.Sin(t * Mathf.PI) * 0.45f);
            }
        }
        whalePhase += dt * (whaleOn ? 0.6f : 0.08f);
        whaleTimer += dt;
        if (whaleTimer > 1f / 12f) { whaleTimer = 0f; DrawWhale(whalePhase, whaleOn ? 1f : 0.35f); }
        if (hoodLight != null) hoodLight.intensity = whaleOn ? 1.6f : 0.4f;
        if (cakeStep == 2 && flame != null) { float f = 0.85f + Mathf.Sin(Time.time * 31f) * 0.08f + Mathf.Sin(Time.time * 17f) * 0.07f; flame.transform.localScale = Vector3.one * 0.16f * f; candleLight.intensity = 1.2f * f; }
        if (clockText != null) { int mins = 19 * 60 + 24 + Mathf.FloorToInt(Sunset * 52f); clockText.text = ((mins / 60) - 12) + ":" + (mins % 60).ToString("00"); }
    }
}
