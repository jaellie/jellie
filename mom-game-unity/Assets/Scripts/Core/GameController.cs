using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

// The conductor: input, Mom, camera, HUD, audio, worlds and the little "use" system.
public class GameController : MonoBehaviour
{
    public static GameController I;

    public Camera cam;
    public ChaseCam chase;
    public Mom mom;
    public HudUI hud;
    public GameAudio audio;
    public Discoveries disc;

    public World world;
    readonly Dictionary<string, World> worlds = new Dictionary<string, World>();
    public bool busy, acting;
    bool transitioning;
    public float elapsed;
    Interactable current;
    public string lastWorldName;

    // ───────────────────────── boot ─────────────────────────
    void Awake()
    {
        I = this;
        Application.targetFrameRate = 60;
        QualitySettings.shadows = ShadowQuality.All;
        QualitySettings.shadowResolution = ShadowResolution.High;
        QualitySettings.shadowDistance = 28f;
        QualitySettings.shadowCascades = 2;
        QualitySettings.antiAliasing = 4;
        QualitySettings.pixelLightCount = 6;
        QualitySettings.vSyncCount = 1;

        var camGo = new GameObject("MomCamera");
        camGo.transform.SetParent(transform, false);
        cam = camGo.AddComponent<Camera>();
        cam.tag = "MainCamera";
        cam.fieldOfView = 58f; cam.nearClipPlane = 0.08f; cam.farClipPlane = 1500f;
        cam.allowHDR = true;
        camGo.AddComponent<AudioListener>();
        Billboard.Cam = camGo.transform;

        audio = gameObject.AddComponent<GameAudio>();
        disc = new Discoveries();

        var momGo = new GameObject("Mom");
        momGo.transform.SetParent(transform, false);
        mom = momGo.AddComponent<Mom>();
        mom.OnStep = OnStep;

        chase = camGo.AddComponent<ChaseCam>();
        chase.cam = cam; chase.mom = mom;

        hud = gameObject.AddComponent<HudUI>();
        hud.cam = cam; hud.audio = audio;
    }

    IEnumerator Start()
    {
        hud.SetFade(1f, Color.black);
        yield return null;
        mom.Build(false);
        mom.SetFootwear(false);
        World home = GetWorld("home");
        int got, total; disc.Progress(out got, out total);
        hud.SetProgress(got, total, false);
        disc.OnFound += id => { int g2, t2; disc.Progress(out g2, out t2); hud.SetProgress(g2, t2, id != null); };
        SetWorld(home, null);
        yield return StartCoroutine(hud.StartScreen());
        hud.ShowBar(true);
        yield return StartCoroutine(hud.Fade(0f, Color.black, 2.2f));
    }

    public World GetWorld(string name)
    {
        World w;
        if (worlds.TryGetValue(name, out w)) return w;
        switch (name)
        {
            case "home": w = new HomeWorld(this); break;
            case "mall": w = new MallWorld(this); break;
            case "past": w = new PastWorld(this); break;
            case "beach": w = new BeachWorld(this); break;
            case "drive": w = new DriveWorld(this); break;
            default: throw new ArgumentException(name);
        }
        w.Build();
        worlds[name] = w;
        return w;
    }

    void SetWorld(World w, string from)
    {
        foreach (var kv in worlds) kv.Value.root.SetActive(false);
        w.root.SetActive(true);
        lastWorldName = world != null ? world.name : null;
        world = w;
        chase.ownedByWorld = w.OwnsCamera;
        chase.useOverride = false;
        w.ApplyAtmosphere();
        w.Enter(from);
        if (!w.OwnsCamera) chase.Snap();
    }

    public void SetMomForm(bool child, bool shoes)
    {
        if (mom.child != child) mom.Build(child);
        mom.SetFootwear(shoes);
    }

    // ───────────────────────── helpers worlds use ─────────────────────────
    public void Say(string text, float secs = 2.6f) { hud.Say(text, secs); }
    public void SayKey(string key, float secs = 2.6f) { hud.Say(Content.Bubble(key), secs); }

    public IEnumerator ShowDisc(string id)
    {
        var d = Content.Get(id);
        if (d == null) yield break;
        hud.OpenDisc(d);
        while (hud.CardOpen) yield return null;
    }

    // sparkle, chime, a happy little hop, then the card. Returns when the card is closed.
    public IEnumerator Discover(string id, Vector3 where)
    {
        var d = Content.Get(id);
        if (d == null || !disc.Exists(id)) yield break;
        bool first = disc.Add(id);
        if (first)
        {
            audio.Play("chime", 0.8f); audio.Play("sparkle", 0.7f);
            var glow = Kit.GlowSprite(null, where, 0.3f, "#FFE7B0", 0.9f, Kit.StarTex());
            StartCoroutine(Burst(glow));
            hud.EmoteAt("emote_stars", mom.transform.position + Vector3.up * (mom.child ? 1.5f : 1.9f));
            mom.Jump();
            yield return Anim.Wait(0.5f);
        }
        hud.OpenDisc(d);
        while (hud.CardOpen) yield return null;
    }

    IEnumerator Burst(GameObject glow)
    {
        float t = 0f;
        while (t < 0.9f && glow != null)
        {
            t += Time.deltaTime; float u = t / 0.9f;
            glow.transform.localScale = Vector3.one * (0.3f + u * 1.4f);
            glow.transform.position += Vector3.up * Time.deltaTime * 0.4f;
            Kit.SetGlowAlpha(glow, 1f - u);
            yield return null;
        }
        if (glow != null) Destroy(glow);
    }

    public IEnumerator WaitForKey(float maxSec)
    {
        float t = 0f;
        while (t < maxSec && !(GameInput.InteractDown || GameInput.ClickDown || GameInput.AnyDown)) { t += Time.deltaTime; yield return null; }
    }

    public IEnumerator GoTo(string name, Color fade, float secs)
    {
        if (transitioning) yield break;
        transitioning = true; busy = true;
        yield return StartCoroutine(hud.Fade(1f, fade, secs));
        string from = world != null ? world.name : null;
        if (world != null) world.Exit();
        var next = GetWorld(name);
        SetWorld(next, from);
        yield return StartCoroutine(hud.Fade(0f, fade, secs * 1.2f));
        busy = false; transitioning = false;
    }

    public void Go(string name, Color fade, float secs) { StartCoroutine(GoTo(name, fade, secs)); }

    void OnStep()
    {
        if (world == null) return;
        string surf = world.Surface(mom.transform.position);
        bool shoes = mom.shoesOn || mom.child;
        if (shoes && (surf == "sand" || surf == "dirt")) { audio.Squeak(); audio.Play(surf == "sand" ? "sand" : "step", 0.6f); }
        else if (surf == "tile") audio.Play("step", 0.6f);
        else audio.Play("stepSoft", 0.7f);
    }

    IEnumerator Use(Interactable it)
    {
        acting = true;
        yield return StartCoroutine(UseSafe(it));
        acting = false;
    }

    IEnumerator UseSafe(Interactable it)
    {
        IEnumerator e = it.use();
        while (true)
        {
            object cur;
            try { if (!e.MoveNext()) yield break; cur = e.Current; }
            catch (Exception ex) { Debug.LogException(ex); yield break; }
            yield return cur;
        }
    }

    // ───────────────────────── frame ─────────────────────────
    void Update()
    {
        if (world == null) return;
        float dt = Time.deltaTime;
        elapsed += dt;

        if (GameInput.ResetDown) { disc.ResetAll(); }

        bool cardOpen = hud.CardOpen;
        bool interact = GameInput.InteractDown;
        if (cardOpen)
            hud.CardInput(interact, GameInput.CloseDown, GameInput.LeftDown, GameInput.RightDown, GameInput.UpDown, GameInput.DownDown, GameInput.ClickDown);

        Vector2 mv = GameInput.Move();
        bool canMove = !busy && !acting && !cardOpen && !chase.useOverride && !world.OwnsCamera;
        if (mom.sitting && mv.sqrMagnitude > 0.1f && canMove) { var h = world as IStandUp; if (h != null) h.StandUp(); else mom.Stand(); }
        if (!world.OwnsCamera) mom.Drive(mv, dt, canMove);

        world.Tick(dt);

        // nearest usable thing in reach (a little preference for what she faces)
        current = null;
        if (canMove && !world.OwnsCamera)
        {
            float bestScore = float.MaxValue;
            Vector3 p = mom.transform.position, f = mom.Forward;
            foreach (var it in world.items)
            {
                if (!it.Enabled) continue;
                Vector3 d = it.pos - p; d.y = 0f; float dist = d.magnitude;
                if (dist > it.reach) continue;
                float facing = dist > 0.01f ? Vector3.Dot(d / dist, f) : 1f;
                float score = dist - facing * 0.45f;
                if (score < bestScore) { bestScore = score; current = it; }
            }
            if (interact && current != null) StartCoroutine(Use(current));
        }

        // faint twinkles on things that still hide a letter (within ~4 m)
        foreach (var it in world.items)
        {
            if (it.sparkle == null) continue;
            bool show = it.Enabled && !chase.useOverride && it.discover != null && disc.Exists(it.discover) && !disc.IsFound(it.discover);
            Vector3 d = it.pos - mom.transform.position; d.y = 0f;
            float near = Mathf.Clamp01((4.2f - d.magnitude) / 1.6f);
            float tw = 0.55f + 0.45f * Mathf.Sin(Time.time * 3.1f + it.phase) * Mathf.Sin(Time.time * 1.7f + it.phase * 2f);
            float a = show ? near * tw * 0.8f : 0f;
            Kit.SetGlowAlpha(it.sparkle, a);
            it.sparkle.transform.localScale = Vector3.one * (0.28f + 0.14f * tw);
        }

        if (!world.OwnsCamera) chase.Step(dt);
        hud.SetHint(current != null && !acting && !busy && !cardOpen && !chase.useOverride, current != null ? current.HintPos : Vector3.zero);
        hud.SetBubbleAnchor(mom.HeadPos);
    }
}

public interface IStandUp { void StandUp(); }
