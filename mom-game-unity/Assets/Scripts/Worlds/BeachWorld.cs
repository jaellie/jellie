using System.Collections;
using System.Collections.Generic;
using UnityEngine;

// Ungcheon Beach at dusk. Plan: the sea is to the south (-z), the promenade to the north (+z).
// The letter waits at the water's edge.
public class BeachWorld : World, IStandUp
{
    const float SHORE = -6f;
    float t, timeIn, sunset = 0.65f; bool letterShown, sitting;
    Renderer seaRend, sandRend, moonRend; Material sandM, seaM;
    readonly List<Renderer> foam = new List<Renderer>(); readonly List<float> foamOff = new List<float>();
    readonly List<Material> bulbMats = new List<Material>(); readonly List<GameObject> halos = new List<GameObject>(); readonly List<Light> lampLights = new List<Light>(); readonly List<float> lampX = new List<float>();
    readonly List<Transform> boats = new List<Transform>(); readonly List<Transform> gulls = new List<Transform>();
    Transform envelope, moon; GameObject envGlow;
    readonly List<Transform> windows = new List<Transform>();
    GameObject stars;

    public BeachWorld(GameController game) : base(game, "beach") { }

    static readonly Color[] RampHor = { Kit.C("#FFD9A0"), Kit.C("#FF9A62"), Kit.C("#E9747A"), Kit.C("#7A4A82"), Kit.C("#2A2548") };
    static readonly Color[] RampSea = { Kit.C("#6FA8B8"), Kit.C("#C58A7A"), Kit.C("#7E5A86"), Kit.C("#2F3560"), Kit.C("#1C2145") };
    static Color Ramp(Color[] r, float t) { t = Mathf.Clamp01(t) * (r.Length - 1); int i = Mathf.Min((int)t, r.Length - 2); return Color.Lerp(r[i], r[i + 1], t - i); }
    static float SStep(float x, float a, float b) { x = Mathf.Clamp01((x - a) / (b - a)); return x * x * (3f - 2f * x); }

    public override void Build()
    {
        ambient = new Color(0.8f, 0.62f, 0.56f); fogColor = Kit.C("#E9747A"); fogStart = 45f; fogEnd = 320f;
        skyMat = MakeSky(1.8f, "#9A6A9E", 1.0f);
        MakeSun("#FF9A62", 1.2f, new Vector3(6f, 8f, 0f));
        var r = root.transform; var rnd = new System.Random(11);

        // sand (solid) + wet band
        sandM = Kit.MatUnique("#E9CFA2", 0.02f);
        Kit.Solid(Kit.Box(r, new Vector3(80f, 0.3f, 24f), new Vector3(0f, -0.3f, 1.5f), "#E9CFA2", 0f, sandM)).name = "sand";
        sandRend = null;
        var wet = Kit.Quad(r, 80f, 2.4f, new Vector3(0f, 0.03f, SHORE + 0.4f), Kit.MatUnique("#B9946C", 0.6f, 0.1f, null, 1f, 0.75f)); wet.transform.localRotation = Quaternion.Euler(90f, 0f, 0f); Kit.NoShadow(wet);
        // sea
        var sea = new GameObject("sea"); sea.transform.SetParent(r, false); sea.transform.localPosition = new Vector3(0f, -0.35f, SHORE - 150f);
        sea.AddComponent<MeshFilter>().sharedMesh = ProcTex.Grid(50, 500f);
        seaRend = sea.AddComponent<MeshRenderer>(); seaM = Kit.MatUnique("#6FA8B8", 0.85f, 0f); seaRend.sharedMaterial = seaM; seaRend.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
        var ss = sea.AddComponent<SeaSurface>(); ss.amp = 0.18f; ss.scale = 0.08f; ss.speed = 0.8f;
        for (int i = 0; i < 3; i++)
        {
            var f = Kit.Quad(r, 80f, 0.8f, new Vector3(0f, 0.06f, SHORE), Kit.AdditiveMat(Kit.GlowTex(), new Color(1f, 0.96f, 0.9f, 0f)));
            f.transform.localRotation = Quaternion.Euler(90f, 0f, 0f); Kit.NoShadow(f); foam.Add(f.GetComponent<Renderer>()); foamOff.Add(i / 3f);
        }
        // headlands + far town lights (Kenney buildings small, across the bay)
        for (int i = 0; i < 12; i++)
        {
            float a = Mathf.Lerp(-1.1f, 1.1f, i / 11f); float dist = 240f + (float)rnd.NextDouble() * 140f;
            Kit.NoShadow(Kit.Cone(r, 35f + (float)rnd.NextDouble() * 30f, 14f + (float)rnd.NextDouble() * 22f, new Vector3(Mathf.Sin(a) * dist, -1f, SHORE - Mathf.Cos(a) * dist), "#4A5A60", 7));
        }
        string[] low = { "shop/low-detail-building-a", "shop/low-detail-building-e", "sub/building-type-c", "sub/building-type-f", "shop/building-skyscraper-b" };
        for (int i = 0; i < 16; i++)
        {
            float x = -150f + i * 20f + (float)rnd.NextDouble() * 10f, z = SHORE - 170f - (float)rnd.NextDouble() * 25f;
            var b = Kenney.Spawn(low[rnd.Next(low.Length)], r, new Vector3(x, 0f, z), (float)rnd.NextDouble() * 360f, 1f, null, -1f, 8f + (float)rnd.NextDouble() * 14f);
            Kit.NoShadow(b);
        }
        // boats on the water
        string[] bk = { "boat/boat-sail-a", "boat/boat-fishing-small", "boat/boat-sail-b", "boat/boat-speed-a" };
        for (int i = 0; i < bk.Length; i++) boats.Add(Kenney.Spawn(bk[i], r, new Vector3(-40f + i * 28f, -0.35f, SHORE - 35f - i * 18f), 30f + i * 70f, 1f, null, -1f, 5f).transform);
        for (int i = 0; i < 3; i++)
        {
            var gt = Kit.Group(r, "gull", Vector3.zero);
            Kit.NoShadow(Kit.Box(gt, new Vector3(1.1f, 0.03f, 0.25f), new Vector3(-0.55f, 0f, 0f), "#FFF8EE")).transform.localRotation = Quaternion.Euler(0, 0, 14f);
            Kit.NoShadow(Kit.Box(gt, new Vector3(1.1f, 0.03f, 0.25f), new Vector3(0.55f, 0f, 0f), "#FFF8EE")).transform.localRotation = Quaternion.Euler(0, 0, -14f);
            gulls.Add(gt);
        }
        // crescent moon
        moon = Kit.Group(r, "moon", new Vector3(-110f, 40f, -260f));
        var mm = Kit.Unlit(Kit.C("#FFF1C8")); var cut = Kit.Unlit(Kit.C("#2A2548"));
        Kit.NoShadow(Kit.Sph(moon, 9f, Vector3.zero, "#FFF1C8", mm)); var c2 = Kit.Sph(moon, 8.2f, new Vector3(4.5f, 2.5f, 3f), "#2A2548", cut); Kit.NoShadow(c2);
        moonRend = moon.GetComponentInChildren<Renderer>();
        moon.gameObject.SetActive(false);

        // promenade deck + lamp posts + benches + trees
        Kit.Solid(Kit.Box(r, new Vector3(80f, 0.1f, 3.4f), new Vector3(0f, -0.1f, 9.2f), "#B9906A", 0f, Kit.MatTex(ProcTex.Planks(), 0.15f, new Vector2(24f, 1f))));
        Kit.Box(r, new Vector3(80f, 0.25f, 0.2f), new Vector3(0f, -0.1f, 7.5f), "#D7C3A4");
        for (float x = -25f; x <= 25f; x += 10f)
        {
            float LZ = 2.4f;
            Kit.Cyl(r, 0.07f, 3.2f, new Vector3(x, 0f, LZ), "#3A3430", 6);
            Kit.Box(r, new Vector3(0.5f, 0.05f, 0.05f), new Vector3(x + 0.2f, 3.15f, LZ), "#3A3430");
            var bm = Kit.MatUnique("#FFF1D0", 0.3f, 0f, "#FFC064", 0f); bulbMats.Add(bm);
            Kit.NoShadow(Kit.Sph(r, 0.16f, new Vector3(x + 0.42f, 2.98f, LZ), "#FFF1D0", bm));
            var halo = Kit.GlowSprite(r, new Vector3(x + 0.42f, 2.98f, LZ), 2.4f, "#FFC98A", 0.0f); halos.Add(halo);
            var lt = MakeLamp(new Vector3(x + 0.42f, 2.9f, LZ), "#FFC98A", 0f, 12f); lampLights.Add(lt); lampX.Add(x);
            Kit.CylBlocker(r, new Vector3(x, 1f, LZ), 0.15f, 2f);
        }
        Kenney.Spawn("furn/bench", r, new Vector3(2.2f, 0f, 3.45f), 0f, 1f, null, 1.6f, -1f, -1f, true);
        Kenney.Spawn("furn/bench", r, new Vector3(-11f, 0f, 3.45f), 0f, 1f, null, 1.6f, -1f, -1f, true);
        Kenney.Spawn("furn/bench", r, new Vector3(12f, 0f, 3.45f), 0f, 1f, null, 1.6f, -1f, -1f, true);
        foreach (float x in new[] { -20f, -9f, 6f, 18f })
            Kenney.Spawn("sub/tree-large", r, new Vector3(x, 0f, 10.4f), x * 13f, 1f, null, -1f, 4.8f);
        // little boats beached on the sand
        Kenney.Spawn("boat/boat-row-small", r, new Vector3(-8f, 0f, -3.8f), 70f, 1f, null, 2.4f);
        Kenney.Spawn("boat/boat-row-large", r, new Vector3(14f, 0f, -4.2f), 100f, 1f, null, 3.2f);

        // the letter: a glowing envelope waiting at the water's edge
        envelope = Kit.Group(r, "envelope", new Vector3(0f, 1.0f, -2.2f));
        Kit.Box(envelope, new Vector3(0.36f, 0.24f, 0.02f), new Vector3(0f, -0.12f, 0f), "#FFF6E6", 0.01f, Kit.Mat("#FFF6E6", 0.2f, 0f, "#FFE2B0", 0.4f));
        Kit.Sph(envelope, 0.04f, new Vector3(0f, 0f, -0.02f), "#D4566A", Kit.Mat("#D4566A", 0.3f, 0f, "#D4566A", 0.3f));
        envGlow = Kit.GlowSprite(envelope, Vector3.zero, 1.4f, "#FFE2B0", 0.55f);
        Add("letter", new Vector3(0f, 1.0f, -2.2f), 1.5f, () => ShowLetter(), null, null, 0.4f);
        // sit on the bench
        Add("bench", new Vector3(2.2f, 0.6f, 2.95f), 1.05f, () => SitBench(), null, () => !sitting, 0.45f);
        // optional: "다시 집으로"
        var sign = Kit.Group(r, "home-sign", new Vector3(-25f, 0f, 5.5f), 0f);
        Kit.Cyl(sign, 0.05f, 1.3f, Vector3.zero, "#6B5040", 5);
        Kit.Box(sign, new Vector3(1.1f, 0.42f, 0.05f), new Vector3(0f, 0.9f, 0f), "#F2E3C6", 0.02f);
        Kit.Text(sign, "다시 집으로", new Vector3(0f, 1.11f, -0.04f), 0.2f, "#5A3E2E");
        Kit.Text(sign, "다시 집으로", new Vector3(0f, 1.11f, 0.04f), 0.2f, "#5A3E2E").transform.localRotation = Quaternion.Euler(0f, 180f, 0f);
        Add("homeSign", new Vector3(-25f, 1.2f, 5.5f), 1.4f, () => GoHome(), null, null, 0.3f);

        // bounds: keep Mom between the sea and the trees
        Kit.Blocker(r, new Vector3(-34f, 2f, 0f), new Vector3(10f, 4f, 40f)); Kit.Blocker(r, new Vector3(34f, 2f, 0f), new Vector3(10f, 4f, 40f));
        Kit.Blocker(r, new Vector3(0f, 2f, SHORE - 0.5f), new Vector3(80f, 4f, 1f)); Kit.Blocker(r, new Vector3(0f, 2f, 12.8f), new Vector3(80f, 4f, 2f));
    }

    IEnumerator GoHome() { g.busy = true; yield return g.StartCoroutine(g.GoTo("home", Color.black, 1.5f)); }

    IEnumerator SitBench()
    {
        g.mom.SitAt(new Vector3(2.2f, 0f, 3.4f), 180f, 0.46f); sitting = true;
        yield return Anim.Wait(0.8f); g.Say("바다 좋다…");
    }

    public void StandUp()
    {
        g.mom.Stand(); g.mom.Teleport(new Vector3(2.2f, 0f, 2.75f), 180f); sitting = false;
    }

    IEnumerator ShowLetter()
    {
        letterShown = true; g.busy = true;
        g.audio.Play("chime");
        yield return Anim.Wait(0.6f);
        g.busy = false;
        g.hud.OpenLetter();
        while (g.hud.CardOpen) yield return null;
    }

    public override void Enter(string from)
    {
        sunset = Mathf.Clamp(HomeWorld.Sunset, 0.55f, 0.7f); timeIn = 0f; sitting = false; letterShown = false;
        g.SetMomForm(false, true);
        g.mom.ShowBag(false, 0);
        g.mom.Teleport(new Vector3(0f, 0f, 5.6f), 180f);
        g.audio.SetLoops("bgm_beach", "waves", "gulls");
        g.StartCoroutine(Hello());
        Atmos();
    }
    IEnumerator Hello() { yield return Anim.Wait(2.2f); g.Say("바다 냄새…"); }
    public override void Exit() { sitting = false; g.mom.Stand(); }
    public override string Surface(Vector3 p) { return p.z > 7.5f ? "wood" : "sand"; }

    void Atmos()
    {
        float s = sunset;
        float el = Mathf.Lerp(7f, -3f, s);
        sun.transform.rotation = Quaternion.Euler(Mathf.Max(1.5f, el + 3f), 8f, 0f);
        sun.color = Ramp(RampHor, s * 0.75f);
        sun.intensity = Mathf.Lerp(1.3f, 0.2f, SStep(s, 0.6f, 1f));
        ambient = Color.Lerp(new Color(0.82f, 0.6f, 0.5f), new Color(0.3f, 0.28f, 0.42f), SStep(s, 0.4f, 1f));
        fogColor = Ramp(RampHor, s);
        RenderSettings.ambientLight = ambient; RenderSettings.fogColor = fogColor;
        if (skyMat != null)
        {
            skyMat.SetFloat("_AtmosphereThickness", Mathf.Lerp(1.4f, 3.0f, Mathf.Clamp01(s * 1.4f)));
            skyMat.SetColor("_SkyTint", Color.Lerp(Kit.C("#B07A9A"), Kit.C("#4A3A7A"), s));
            skyMat.SetFloat("_Exposure", Mathf.Lerp(1.1f, 0.55f, s));
        }
        seaM.color = Ramp(RampSea, s);
        sandM.color = Color.Lerp(Kit.C("#F0D8AE"), fogColor, 0.15f) * Mathf.Lerp(1.05f, 0.8f, SStep(s, 0.6f, 1f));
        moon.gameObject.SetActive(s > 0.72f);
        moon.position = new Vector3(-110f, Mathf.Lerp(10f, 55f, SStep(s, 0.7f, 1f)), -260f);
        float lampOn = SStep(s, 0.68f, 0.82f);
        for (int i = 0; i < lampLights.Count; i++)
        {
            float f = lampOn * (0.95f + Mathf.Sin(t * 3f + lampX[i]) * 0.03f);
            bulbMats[i].SetColor("_EmissionColor", Kit.C("#FFC064") * f * 2.2f); Kit.SetGlowAlpha(halos[i], f * 0.55f); lampLights[i].intensity = f * 2.4f;
        }
    }

    public override void Tick(float dt)
    {
        t += dt; timeIn += dt; sunset = Mathf.Min(1f, sunset + dt / 110f);
        Atmos();
        for (int i = 0; i < foam.Count; i++)
        {
            float u = (t / 6f + foamOff[i]) % 1f;
            foam[i].transform.position = new Vector3(0f, 0.06f, SHORE - 2.4f + Mathf.Sin(u * Mathf.PI) * 2.0f);
            foam[i].sharedMaterial.SetColor("_TintColor", new Color(1f, 0.95f, 0.9f, Mathf.Sin(u * Mathf.PI) * 0.65f) * 0.5f);
        }
        for (int i = 0; i < boats.Count; i++)
        {
            var p = boats[i].position; p.y = -0.35f + Mathf.Sin(t * 0.7f + i * 2f) * 0.12f; boats[i].position = p;
        }
        for (int i = 0; i < gulls.Count; i++)
        {
            float a = t * (0.3f + i * 0.05f) + i * 2.1f;
            gulls[i].position = new Vector3(Mathf.Cos(a) * 14f, 6f + i * 1.6f + Mathf.Sin(t * 1.3f + i), SHORE - 6f + Mathf.Sin(a) * 7f);
            gulls[i].rotation = Quaternion.Euler(0f, -a * Mathf.Rad2Deg, Mathf.Sin(t * 5f + i) * 14f);
        }
        envelope.position = new Vector3(0f, 1.0f + Mathf.Sin(t * 1.5f) * 0.08f, -2.2f);
        envelope.rotation = Quaternion.Euler(0f, Mathf.Sin(t * 0.7f) * 23f, 0f);
        Kit.SetGlowAlpha(envGlow, 0.45f + Mathf.Sin(t * 2f) * 0.12f);
        if (sitting && GameInput.Move().sqrMagnitude > 0.1f && !g.busy) StandUp();
        var p2 = g.mom.transform.position;
        if (!letterShown && !g.busy && !g.hud.CardOpen && !g.acting && (Vector2.Distance(new Vector2(p2.x, p2.z), new Vector2(0f, -2.2f)) < 2.2f || timeIn > 25f))
            g.StartCoroutine(AutoLetter());
    }

    IEnumerator AutoLetter() { letterShown = true; yield return g.StartCoroutine(ShowLetterInner()); }
    IEnumerator ShowLetterInner() { g.acting = true; yield return g.StartCoroutine(ShowLetter()); g.acting = false; }
}
