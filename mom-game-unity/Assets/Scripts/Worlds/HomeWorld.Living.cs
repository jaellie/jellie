using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public partial class HomeWorld
{
    string sittingOn;
    Vector3 chairStandPos;
    Transform palmT, pillowT; float palmShake;
    Vector3 pillowRest; Quaternion pillowRot;
    bool tvOn; Renderer tvRend; Material tvMat; Texture2D[] tvPhotos; Texture2D tvFallback; float tvTimer; int tvIdx;
    TextMesh tvText;
    Transform handset; bool ringing; bool phoneRang; float ringUntil;
    readonly List<Transform> flowers = new List<Transform>();
    GameObject can; bool stoolBloomed;
    Transform shelfTokens;

    void BuildLiving()
    {
        var r = root.transform;
        // rug
        Kenney.Spawn("furn/rugRectangle", r, new Vector3(2.0f, 0.004f, 2.1f), 0f, 1f, "carpet=#F7F7F5;carpetDarker=#DCCDB8", 2.0f);

        // sofa on the east wall, facing the TV; the patterned cushion sits at its south end
        Kenney.Spawn("furn/loungeSofa", r, new Vector3(3.55f, 0f, 1.95f), 270f, 1f, "carpet=#3A3430;wood=#2A211C", 2.1f, -1f, -1f, true);
        var pillow = Kenney.Spawn("furn/pillow", r, new Vector3(3.5f, 0.45f, 1.25f), 270f, 1f, "carpet=#D9825A", 0.44f);
        pillow.transform.localRotation *= Quaternion.Euler(-16f, 0f, 8f);
        pillowT = pillow.transform; pillowRest = pillowT.localPosition; pillowRot = pillowT.localRotation;
        var env = Kit.Box(r, new Vector3(0.16f, 0.012f, 0.11f), new Vector3(3.45f, 0.455f, 1.18f), "#FFF6E6");
        env.transform.localRotation = Quaternion.Euler(0, 20f, 0);
        Add("sofa", new Vector3(2.7f, 0.6f, 1.95f), 1.15f, () => SitSofa(), null, () => sittingOn == null);
        Add("cushion", new Vector3(3.4f, 0.7f, 1.4f), 1.6f, () => LiftCushion(), "sofa_note", () => sittingOn == "sofa");

        // palm in an amber pot by the window
        var palm = Kenney.Spawn("furn/pottedPlant", r, new Vector3(3.6f, 0f, 0.42f), 270f, 1f, "wood=#C27A1E;woodDark=#8C5A12;plant=#5E9A44", -1f, 1.5f, -1f, true);
        palmT = palm.transform;
        Add("palm", new Vector3(3.6f, 1.2f, 0.42f), 1.3f, () => RustlePalm(), "palm_charm");

        // side table + warm lamp beside the sofa
        Kit.Cyl(r, 0.2f, 0.03f, new Vector3(3.75f, 0.5f, 3.22f), "#C48A52", 14);
        Kit.Cyl(r, 0.035f, 0.5f, new Vector3(3.75f, 0f, 3.22f), "#8C5E34", 8);
        Kit.CylBlocker(r, new Vector3(3.75f, 0.4f, 3.22f), 0.22f, 0.8f);
        Kenney.Spawn("furn/lampRoundTable", r, new Vector3(3.75f, 0.53f, 3.22f), 270f, 1f, "lamp=#FFF1D6", -1f, 0.42f);
        var lampL = MakeLamp(new Vector3(3.62f, 1.0f, 3.22f), "#FFC98A", 0.5f, 4.5f);
        lamps.Add(lampL); lampBase.Add(0.5f); lampAdd.Add(1.6f);

        // LF shopping bag
        Kenney.Spawn("food/bag", r, new Vector3(2.9f, 0f, 3.28f), 200f, 1f, null, -1f, 0.42f);
        var lf = Kit.Text(r, "LF", new Vector3(2.9f, 0.2f, 3.23f), 0.09f, "#6B4E3A"); lf.transform.localRotation = Quaternion.Euler(0, 20f, 0);

        BuildTV();
        BuildPhone();
        BuildStool();
        BuildShelf();
    }

    // ───────────────────────── TV (west wall) ─────────────────────────
    void BuildTV()
    {
        var r = root.transform;
        Kenney.Spawn("furn/cabinetTelevision", r, new Vector3(0.28f, 0f, 2.05f), 90f, 1f, "wood=#F6ECD6", 1.7f, -1f, -1f, true);
        Kenney.Spawn("furn/televisionModern", r, new Vector3(0.3f, 0.665f, 2.05f), 90f, 1f, null, 1.15f);
        // photo screen
        tvMat = Kit.Unlit(new Color(0.03f, 0.04f, 0.06f));
        var q = Kit.Quad(r, 0.98f, 0.55f, new Vector3(0.41f, 1.07f, 2.05f), tvMat);
        q.transform.localRotation = Quaternion.Euler(0, -90f, 0); Kit.NoShadow(q);
        tvRend = q.GetComponent<Renderer>();
        var list = new List<Texture2D>();
        for (int i = 1; i <= 9; i++) { var t = Resources.Load<Texture2D>("Photos/0" + i); if (t != null) list.Add(t); }
        tvPhotos = list.ToArray();
        var cv = new Kit.Canvas2D(16, 64, Kit.C("#F7C9A0"));
        for (int y = 0; y < 64; y++) cv.Rect(0, y, 16, 1, Color.Lerp(Kit.C("#F7C9A0"), Kit.C("#D58FA0"), y / 63f));
        tvFallback = cv.ToTexture(false);
        tvText = Kit.Text(r, Content.TvIdleText, new Vector3(0.405f, 1.07f, 2.05f), 0.11f, "#FFFFFF");
        tvText.transform.localRotation = Quaternion.Euler(0, -90f, 0); tvText.gameObject.SetActive(false);
        Add("tv", new Vector3(1.05f, 1.1f, 2.05f), 1.0f, () => TurnOnTV(), "tv_photos");
    }

    IEnumerator TurnOnTV()
    {
        g.audio.Play("click");
        g.mom.FaceToward(new Vector3(0.3f, 0f, 2.05f));
        SetTv(true);
        yield return g.StartCoroutine(g.Discover("tv_photos", new Vector3(0.45f, 1.1f, 2.05f)));
    }

    void SetTv(bool on)
    {
        tvOn = on; tvTimer = 0f;
        DrawTv();
    }

    void DrawTv()
    {
        Texture2D t = tvPhotos != null && tvPhotos.Length > 0 ? tvPhotos[tvIdx % tvPhotos.Length] : tvFallback;
        tvMat.SetTexture("_EmissionMap", t); tvMat.SetColor("_EmissionColor", tvOn ? Color.white * 0.9f : Color.black);
        tvText.gameObject.SetActive(tvOn && (tvPhotos == null || tvPhotos.Length == 0));
    }

    // ───────────────────────── phone ─────────────────────────
    void BuildPhone()
    {
        var r = root.transform;
        Kenney.Spawn("furn/sideTableDrawers", r, new Vector3(0.26f, 0f, 0.88f), 90f, 1f, "wood=#F6ECD6", -1f, 0.68f, -1f, true);
        Kit.Cyl(r, 0.17f, 0.004f, new Vector3(0.26f, 0.68f, 0.88f), "#FFFFFF", 14);
        Kit.Box(r, new Vector3(0.2f, 0.07f, 0.22f), new Vector3(0.26f, 0.682f, 0.88f), "#EDE6DA", 0.025f);
        var hs = new GameObject("handset").transform; hs.SetParent(r, false); hs.localPosition = new Vector3(0.26f, 0.775f, 0.88f);
        Kit.Cap(hs, 0.028f, 0.2f, Vector3.zero, "#EDE6DA").transform.localRotation = Quaternion.Euler(90f, 0f, 0f);
        handset = hs;
        Add("phone", new Vector3(0.7f, 0.85f, 0.88f), 1.0f, () => AnswerPhone(), "phone_voice");
    }

    IEnumerator AnswerPhone()
    {
        ringing = false; g.audio.Play("click");
        handset.localPosition += Vector3.up * 0.18f;
        g.mom.FaceToward(new Vector3(0.26f, 0f, 0.88f));
        yield return g.StartCoroutine(g.Discover("phone_voice", new Vector3(0.3f, 0.9f, 0.88f)));
        handset.localPosition = new Vector3(0.26f, 0.775f, 0.88f); g.audio.Play("click");
    }

    // ───────────────────────── succulents ─────────────────────────
    void BuildStool()
    {
        var r = root.transform;
        Kenney.Spawn("furn/stoolBar", r, new Vector3(0.3f, 0f, 0.2f), 90f, 1f, "wood=#C48A52;carpet=#D98C5F", -1f, 0.55f);
        Kenney.Spawn("furn/plantSmall1", r, new Vector3(0.3f, 0.55f, 0.1f), 90f, 1f, null, -1f, 0.15f);
        Kenney.Spawn("furn/plantSmall2", r, new Vector3(0.34f, 0.55f, 0.27f), 90f, 1f, null, -1f, 0.15f);
        Kenney.Spawn("furn/plantSmall3", r, new Vector3(0.2f, 0.55f, 0.22f), 90f, 1f, null, -1f, 0.15f);
        foreach (var p in new[] { new Vector3(0.3f, 0.72f, 0.1f), new Vector3(0.34f, 0.72f, 0.27f), new Vector3(0.2f, 0.72f, 0.22f) })
        {
            var f = Kit.Sph(r, 0.022f, p, "#F4A0B4", Kit.Mat("#F4A0B4", 0.2f, 0f, "#FF9FB0", 0.25f)); f.transform.localScale = Vector3.one * 0.001f; flowers.Add(f.transform);
        }
        can = new GameObject("watering-can"); can.transform.SetParent(r, false); can.transform.localPosition = new Vector3(0.62f, 0.85f, 0.2f);
        Kit.Cyl(can.transform, 0.07f, 0.13f, Vector3.zero, "#7BB6B0", 10);
        Kit.Cyl(can.transform, 0.014f, 0.2f, new Vector3(0.1f, 0.03f, 0f), "#7BB6B0", 6).transform.localRotation = Quaternion.Euler(0, 0, -55f);
        can.SetActive(false);
        Add("stool", new Vector3(0.85f, 0.6f, 0.2f), 1.0f, () => WaterPlants());
    }

    IEnumerator WaterPlants()
    {
        g.mom.FaceToward(new Vector3(0.3f, 0f, 0.2f));
        can.SetActive(true); g.audio.Play("water");
        yield return g.StartCoroutine(Anim.Over(1.4f, t => can.transform.localRotation = Quaternion.Euler(0, 0, -Mathf.Sin(t * Mathf.PI) * 40f)));
        can.SetActive(false);
        g.SayKey("stool");
        if (!stoolBloomed)
        {
            stoolBloomed = true;
            yield return g.StartCoroutine(Anim.Over(0.9f, t => { for (int i = 0; i < flowers.Count; i++) flowers[i].localScale = Vector3.one * Mathf.Max(0.001f, Anim.Back(Mathf.Clamp01(t * 1.3f - i * 0.15f))); }, u => u));
            g.hud.EmoteAt("emote_hearts", flowers[0].position + Vector3.up * 0.3f);
        }
    }

    // ───────────────────────── memory shelf ─────────────────────────
    void BuildShelf()
    {
        var r = root.transform;
        var wood = Kit.Mat("#C48A52", 0.2f);
        float x = 0.24f, z = 3.92f;
        Kit.Box(r, new Vector3(0.3f, 0.5f, 1.0f), new Vector3(x + 0.0f, 0f, z), "#F6ECD6", 0.02f);            // little cabinet
        Kit.Box(r, new Vector3(0.34f, 0.03f, 1.06f), new Vector3(x, 0.5f, z), "#C48A52", 0.01f, wood);
        Kit.Box(r, new Vector3(0.02f, 1.4f, 0.96f), new Vector3(0.02f, 0.53f, z), "#F7D9D4");                // pink back panel
        foreach (float py in new[] { 0.92f, 1.3f, 1.68f }) Kit.Box(r, new Vector3(0.24f, 0.03f, 0.98f), new Vector3(x - 0.03f, py, z), "#C48A52", 0.008f, wood);
        foreach (float sz in new[] { -0.5f, 0.5f }) Kit.Box(r, new Vector3(0.24f, 1.4f, 0.035f), new Vector3(x - 0.03f, 0.53f, z + sz), "#C48A52", 0.01f, wood);
        Kit.Box(r, new Vector3(0.28f, 0.05f, 1.1f), new Vector3(x - 0.02f, 1.93f, z), "#C48A52", 0.015f, wood);
        for (int i = 0; i < 9; i++) Kit.NoShadow(Kit.Sph(r, 0.022f, new Vector3(0.12f, 1.88f - Mathf.Sin(i / 8f * Mathf.PI) * 0.07f, z - 0.45f + i * 0.1125f), new[] { "#F4B6C2", "#FFE7A0", "#C9B6E4" }[i % 3]));
        Kit.Blocker(r, new Vector3(0.17f, 1f, z), new Vector3(0.34f, 2f, 1.08f));
        shelfTokens = new GameObject("shelf-tokens").transform; shelfTokens.SetParent(r, false);
        g.disc.OnFound += id => RefreshShelf();
        RefreshShelf();
        Add("shelf", new Vector3(0.8f, 1.2f, z), 1.0f, () => OpenShelf(), null, null, 0.8f);
    }

    void RefreshShelf()
    {
        for (int i = shelfTokens.childCount - 1; i >= 0; i--) Object.Destroy(shelfTokens.GetChild(i).gameObject);
        var found = g.disc.Found();
        float[] levels = { 0.53f, 0.95f, 1.33f, 1.71f };
        for (int i = 0; i < found.Count; i++)
        {
            int row = Mathf.Min(i / 8, 3), col = i % 8;
            Vector3 p = new Vector3(0.2f, levels[row], 3.92f - 0.42f + col * 0.12f);
            var tk = new GameObject("token").transform; tk.SetParent(shelfTokens, false); tk.localPosition = p; tk.localRotation = Quaternion.Euler(0, 90f + (i % 3 - 1) * 8f, 0);
            switch (found[i].type)
            {
                case DType.Photo: Kit.Box(tk, new Vector3(0.085f, 0.1f, 0.015f), Vector3.zero, "#C48A52", 0.004f); Kit.Box(tk, new Vector3(0.065f, 0.075f, 0.004f), new Vector3(0, 0.012f, -0.008f), "#F3D7B6"); break;
                case DType.Gift: Kit.Box(tk, new Vector3(0.075f, 0.06f, 0.06f), Vector3.zero, "#E98F9E", 0.006f); Kit.Box(tk, new Vector3(0.012f, 0.062f, 0.062f), Vector3.zero, "#FFF3C9"); break;
                case DType.Voice: Kit.Box(tk, new Vector3(0.1f, 0.065f, 0.02f), Vector3.zero, "#3A3430", 0.006f); Kit.Box(tk, new Vector3(0.07f, 0.03f, 0.004f), new Vector3(0, 0.022f, -0.01f), "#F4B6C2"); break;
                default: Kit.Box(tk, new Vector3(0.1f, 0.07f, 0.012f), Vector3.zero, "#FFF6E6", 0.004f); Kit.Sph(tk, 0.009f, new Vector3(0, 0.04f, -0.008f), "#E4574F"); break;
            }
            tk.localScale = Vector3.one * (i == found.Count - 1 ? 0.01f : 1f);
            if (i == found.Count - 1) g.StartCoroutine(PopToken(tk));
        }
    }

    IEnumerator PopToken(Transform t)
    {
        yield return g.StartCoroutine(Anim.Over(0.6f, u => { if (t != null) t.localScale = Vector3.one * Mathf.Max(0.01f, u * (1f + Mathf.Sin(u * Mathf.PI) * 0.6f)); }, u => u));
    }

    IEnumerator OpenShelf()
    {
        g.audio.Play("page");
        while (true)
        {
            g.hud.OpenShelf(g.disc.Found());
            while (g.hud.CardOpen) yield return null;
            int pick = g.hud.ShelfPicked;
            var list = g.disc.Found();
            if (pick < 0 || pick >= list.Count) yield break;
            yield return g.StartCoroutine(g.ShowDisc(list[pick].id));
        }
    }

    // ───────────────────────── sofa ─────────────────────────
    IEnumerator SitSofa()
    {
        g.mom.SitAt(new Vector3(3.38f, 0f, 1.95f), 270f, 0.1f); sittingOn = "sofa";
        g.audio.Play("sigh");
        Sunset = Mathf.Min(1f, Sunset + 0.04f);
        g.hud.EmoteAt("emote_sleeps", g.mom.HeadPos + Vector3.up * 0.2f);
        yield return Anim.Wait(0.9f);
        g.SayKey("sofa");
    }

    IEnumerator LiftCushion()
    {
        g.mom.Jump();
        Vector3 up = pillowRest + new Vector3(-0.1f, 0.28f, 0.05f);
        yield return g.StartCoroutine(Anim.Over(0.5f, t => { pillowT.localPosition = Vector3.Lerp(pillowRest, up, t); pillowT.localRotation = Quaternion.Slerp(pillowRot, pillowRot * Quaternion.Euler(0, 0, 55f), t); }));
        yield return g.StartCoroutine(g.Discover("sofa_note", new Vector3(3.45f, 0.6f, 1.2f)));
        yield return g.StartCoroutine(Anim.Over(0.5f, t => { pillowT.localPosition = Vector3.Lerp(up, pillowRest, t); pillowT.localRotation = Quaternion.Slerp(pillowRot * Quaternion.Euler(0, 0, 55f), pillowRot, t); }));
    }

    IEnumerator RustlePalm()
    {
        g.audio.Play("rustle"); palmShake = 1.2f; g.mom.FaceToward(new Vector3(3.6f, 0f, 0.42f));
        if (g.disc.IsFound("palm_charm")) yield break;
        g.SayKey("palm");
        yield return Anim.Wait(0.9f);
        yield return g.StartCoroutine(g.Discover("palm_charm", new Vector3(3.6f, 1.2f, 0.42f)));
    }

    // ───────────────────────── per-frame ─────────────────────────
    void TickLiving(float dt)
    {
        palmShake = Mathf.Max(0f, palmShake - dt);
        if (palmT != null) palmT.localRotation = Quaternion.Euler(Mathf.Sin(Time.time * 22f) * 3f * palmShake, 270f + 180f, Mathf.Sin(Time.time * 1.3f) * 0.8f + Mathf.Sin(Time.time * 19f) * 3f * palmShake);
        if (tvOn && tvPhotos != null && tvPhotos.Length > 1) { tvTimer += dt; if (tvTimer > 3.5f) { tvTimer = 0f; tvIdx++; DrawTv(); } }
        // the landline rings softly the first time she walks near it
        var p = g.mom.transform.position;
        if (!phoneRang && !g.disc.IsFound("phone_voice") && Vector2.Distance(new Vector2(p.x, p.z), new Vector2(0.5f, 0.88f)) < 2.3f)
        {
            phoneRang = true; ringing = true; ringUntil = Time.time + 9f; g.SayKey("phoneRing", 3f);
            g.StartCoroutine(RingLoop());
        }
        if (ringing && handset != null) handset.localPosition = new Vector3(0.26f, 0.775f + Mathf.Max(0f, Mathf.Sin(Time.time * 40f)) * 0.006f * (Mathf.Sin(Time.time * 2.4f) > 0 ? 1f : 0f), 0.88f);
    }

    IEnumerator RingLoop()
    {
        while (ringing && Time.time < ringUntil) { g.audio.Play("ring", 0.35f); yield return Anim.Wait(2.6f); }
        ringing = false;
    }
}
