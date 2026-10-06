using System.Collections;
using System.Collections.Generic;
using UnityEngine;

// Home: the 84 m2 flat from the floor plan (plan coordinates: +x east, +z north; the big window is
// on the z = 0 wall). Built from code + Kenney furniture. Facing the window the sofa is on the left
// and the TV on the right.
public partial class HomeWorld : World, IStandUp
{
    // plan (meters) — same numbers as the web version's layout.js
    const float WALL_H = 2.4f, T = 0.14f;
    const float LX0 = 0f, LX1 = 4.0f, LZ0 = 0f, LZ1 = 4.5f;           // living room
    const float KX0 = 0f, KX1 = 3.5f, KZ0 = 4.5f, KZ1 = 7.8f;         // kitchen
    const float HX0 = 4.0f, HX1 = 7.9f, HZ0 = 3.45f, HZ1 = 4.5f;      // hall
    const float EX0 = 6.5f, EX1 = 7.9f, EZ0 = 4.5f, EZ1 = 6.25f;      // entry
    const float WIN_X0 = 0.8f, WIN_X1 = 3.3f, WIN_TOP = 2.2f;

    public static float Sunset;            // 0 = golden afternoon, 1 = deep dusk (kept between visits)
    float sinceStart;
    bool curtainsOpen, busyCurtains;
    float curtainAmount;                   // 0 closed .. 1 open
    Transform curtainL, curtainR, sheerL, sheerR;
    readonly List<Light> lamps = new List<Light>();
    readonly List<float> lampBase = new List<float>(), lampAdd = new List<float>();
    GameObject windowGlow; Renderer glowRend;
    Renderer seaRend;
    Vector3 sunDir = Vector3.forward;

    public HomeWorld(GameController game) : base(game, "home") { }

    public override void Build()
    {
        skyMat = MakeSky(1f, "#8FB6D9", 1.15f);
        MakeSun("#FFD9A0", 1.35f, new Vector3(30, 14, 0));
        BuildShell();
        BuildOutside();
        BuildWindow();
        BuildLiving();
        BuildKitchen();
        BuildEntry();
        BuildFx();
        ApplySunset();
    }

    public void StandUp()
    {
        var m = g.mom;
        if (sittingOn == "sofa") m.Teleport(new Vector3(2.55f, 0f, 1.95f), 270f);
        else if (sittingOn == "chair") m.Teleport(new Vector3(chairStandPos.x, 0f, chairStandPos.z), 0f);
        else m.Stand();
        sittingOn = null;
    }

    public override void Enter(string from)
    {
        var m = g.mom;
        g.SetMomForm(false, false);
        m.ShowBag(false, 0);
        if (from == null) m.Teleport(new Vector3(2.0f, 0f, 2.9f), 180f);
        else
        {
            m.Teleport(new Vector3(7.0f, 0f, 5.55f), 180f);
            if (from == "past") g.Say("…꿈이었나?", 3f); else g.Say("다녀왔습니다~", 3f);
            if (frontDoorLeaf != null) frontDoorLeaf.localRotation = Quaternion.identity;
        }
        floorShoes.SetActive(true); floorSlippers.SetActive(false);
        sittingOn = null;
        g.audio.SetLoops(curtainsOpen ? new[] { "bgm_home", "waves", "gulls" } : new[] { "bgm_home" });
        ApplySunset();
    }

    public override string Surface(Vector3 p)
    {
        return (p.x > EX0 && p.z > EZ0) ? "tile" : "wood";
    }

    // ───────────────────────── time of day ─────────────────────────
    static readonly Color[] RampSun = { Kit.C("#FFD9A0"), Kit.C("#FF9A62"), Kit.C("#E0707A"), Kit.C("#6E4A7A"), Kit.C("#2A2548") };
    static Color Ramp(Color[] r, float t)
    {
        t = Mathf.Clamp01(t) * (r.Length - 1); int i = Mathf.Min((int)t, r.Length - 2);
        return Color.Lerp(r[i], r[i + 1], t - i);
    }

    void ApplySunset()
    {
        float s = Sunset;
        float elev = Mathf.Lerp(34f, 2.5f, Mathf.Pow(s, 0.9f));
        float yaw = Mathf.Lerp(8f, 38f, s);
        sun.transform.rotation = Quaternion.Euler(elev, yaw, 0f);
        sunDir = sun.transform.forward;
        sun.color = Ramp(RampSun, s * 0.8f);
        sun.intensity = SunDim * Mathf.Lerp(1.45f, 0.9f, s) * (s > 0.85f ? Mathf.Clamp01(1f - (s - 0.85f) * 5f) : 1f);
        ambient = Color.Lerp(new Color(0.86f, 0.78f, 0.68f), new Color(0.42f, 0.33f, 0.38f), Mathf.Clamp01(s * 1.1f));
        fogColor = Color.Lerp(Kit.C("#FFE3B8"), Kit.C("#6E4A7A"), s);
        float open = curtainAmount;
        float lampOn = Mathf.SmoothStep(0.2f, 0.95f, s);
        for (int i = 0; i < lamps.Count; i++) lamps[i].intensity = lampBase[i] + lampAdd[i] * lampOn;
        if (skyMat != null)
        {
            skyMat.SetFloat("_AtmosphereThickness", Mathf.Lerp(1.0f, 2.3f, Mathf.Clamp01(s * 1.6f)));
            skyMat.SetColor("_SkyTint", Color.Lerp(Kit.C("#8FB6D9"), Kit.C("#9A6A9E"), s));
            skyMat.SetFloat("_Exposure", Mathf.Lerp(0.9f, 0.65f, s));
        }
        if (seaRend != null) seaRend.sharedMaterial.color = Color.Lerp(Kit.C("#4F8EA4"), Kit.C("#2A2A4A"), s);
        if (glowRend != null)
        {
            Color c = Color.Lerp(sun.color, Color.white, 0.35f); c.a = Mathf.Lerp(0.08f, 0.28f, open) * (g.chase != null && g.chase.useOverride ? 0.25f : 1f);
            glowRend.sharedMaterial.SetColor("_TintColor", new Color(c.r, c.g, c.b, c.a) * 0.5f);
        }
        if (world_active) { RenderSettings.ambientLight = ambient * AmbDim; RenderSettings.fogColor = fogColor; RenderSettings.sun = sun; }
    }
    bool world_active { get { return root != null && root.activeInHierarchy; } }

    public override void Tick(float dt)
    {
        sinceStart += dt;
        Sunset = Mathf.Min(1f, Sunset + dt / (Content.SunsetMinutes * 60f));
        if ((tickAcc += dt) > 0.1f) { tickAcc = 0f; ApplySunset(); }
        TickLiving(dt);
        TickKitchen(dt);
        TickFx(dt);
    }
    float tickAcc;

    // ───────────────────────── curtains + look-out ─────────────────────────
    void SetCurtains(float t)
    {
        curtainAmount = t;
        float mauve = Mathf.Lerp(0.975f, 0.24f, t), sheer = Mathf.Lerp(1f, 0.48f, t);
        curtainL.localScale = new Vector3(mauve, 1f, 1f); curtainR.localScale = new Vector3(-mauve, 1f, 1f);
        sheerL.localScale = new Vector3(sheer, 1f, 1f); sheerR.localScale = new Vector3(-sheer, 1f, 1f);
    }

    IEnumerator OpenCurtains()
    {
        busyCurtains = true; g.busy = true;
        g.mom.FaceToward(new Vector3(2.05f, 0f, 0f));
        g.audio.Play("curtain");
        yield return g.StartCoroutine(Anim.Over(3.0f, t => SetCurtains(t)));
        curtainsOpen = true;
        Sunset = Mathf.Min(1f, Sunset + 0.15f);
        g.audio.SetLoops("bgm_home", "waves", "gulls");
        yield return g.StartCoroutine(LookOut(new Vector3(1.25f, 1.62f, 3.3f), 6.5f, Content.Bubble("curtains")));
        busyCurtains = false; g.busy = false;
    }

    // the camera drops to eye level and looks out to sea
    IEnumerator LookOut(Vector3 eye, float hold, string bubble)
    {
        g.busy = true;
        g.chase.ovPos = eye; g.chase.ovLook = new Vector3(eye.x + 6f, -5f, -60f);
        g.chase.useOverride = true;
        g.mom.FaceToward(new Vector3(eye.x, 0f, -5f));
        yield return Anim.Wait(1.6f);
        g.Say(bubble, 3.2f);
        if (hold > 0f) yield return Anim.Wait(hold); else yield return g.StartCoroutine(g.WaitForKey(8f));
        g.chase.useOverride = false;
        yield return Anim.Wait(1.0f);
        g.busy = false;
    }
}
