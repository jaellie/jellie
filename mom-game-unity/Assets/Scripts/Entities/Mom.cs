using System;
using UnityEngine;
using UnityEngine.Animations;
using UnityEngine.Playables;

// Mom: the cute Kenney "characterMedium" wearing a skin we painted (pink waist-length cardigan,
// perm hair, closed-eye smile, black rubber shoes / lilac slippers). In The Past she becomes a
// little girl (same model, smaller, pigtails). Idle + Run animations are blended into a walk.
// Controls: A/D turn, W forward, S step back (the camera follows low behind her shoulder).
public class Mom : MonoBehaviour
{
    public const float AdultHeight = 1.55f;   // content.js -> mom.heightCm = 155
    public const float ChildHeight = 1.12f;
    // If she walks backwards in Unity, flip this to 180.
    public const float ModelYawOffset = 0f;

    public CharacterController cc;
    public float heading;                     // degrees; forward = (sin h, 0, cos h)
    public bool child;
    public bool shoesOn;                      // black rubber shoes (true) or lilac slippers (false)
    public bool sitting;
    public Action OnStep;

    public Vector3 Forward { get { return new Vector3(Mathf.Sin(heading * Mathf.Deg2Rad), 0f, Mathf.Cos(heading * Mathf.Deg2Rad)); } }
    public Vector3 HeadPos { get { return transform.position + Vector3.up * (child ? 1.55f : 2.0f) + (sitting ? Vector3.down * 0.15f : Vector3.zero); } }
    public float Speed01 { get; private set; }

    GameObject visual;
    float visualYaw;
    float speed, sitLower;
    Transform hips, head, rightHand;
    Transform skirtFollow, headFollow, handFollow;
    SkinnedMeshRenderer skin;
    Texture2D texShoes, texSlippers, texGirl;
    Material skinMat;
    GameObject bag; GameObject[] bagItems;
    bool showBag;

    // animation
    PlayableGraph graph; bool graphOn;
    AnimationMixerPlayable mixer;
    AnimationClipPlayable idleP, runP, jumpP;
    AnimationClip idleC, runC, jumpC;
    float idleT, runT, jumpT, runWeight, jumpWeight;
    bool jumping;
    float stepAcc;

    void Awake()
    {
        cc = gameObject.GetComponent<CharacterController>();
        if (cc == null) cc = gameObject.AddComponent<CharacterController>();
        cc.radius = 0.3f; cc.height = 1.5f; cc.center = new Vector3(0f, 0.78f, 0f);
        cc.stepOffset = 0.1f; cc.skinWidth = 0.03f; cc.minMoveDistance = 0f;
        gameObject.layer = 2; // Ignore Raycast: the camera and hints never hit her own collider
    }

    void OnDestroy() { if (graphOn) graph.Destroy(); }

    // ───────────────────────── building ─────────────────────────
    public void Build(bool asChild)
    {
        child = asChild;
        if (graphOn) { graph.Destroy(); graphOn = false; }
        if (visual != null) Destroy(visual);
        foreach (var f in new[] { skirtFollow, headFollow, handFollow }) if (f != null) Destroy(f.gameObject);

        texShoes = texShoes != null ? texShoes : Resources.Load<Texture2D>("Kenney/Characters/Skins/mom_shoes");
        texSlippers = texSlippers != null ? texSlippers : Resources.Load<Texture2D>("Kenney/Characters/Skins/mom_slippers");
        texGirl = texGirl != null ? texGirl : Resources.Load<Texture2D>("Kenney/Characters/Skins/girl");

        var prefab = Resources.Load<GameObject>("Kenney/Characters/characterMedium");
        if (prefab == null) { BuildFallback(); return; }

        visual = Instantiate(prefab);
        visual.name = child ? "girl" : "mom";
        visual.transform.SetParent(transform, false);
        skin = visual.GetComponentInChildren<SkinnedMeshRenderer>();
        skinMat = new Material(Kit.Std);
        skinMat.SetFloat("_Glossiness", 0.12f);
        if (skin != null) { skin.sharedMaterial = skinMat; skin.updateWhenOffscreen = true; }
        ApplySkin();

        // scale so she is 155 cm (or a little girl) — measured from the mesh itself
        float target = child ? ChildHeight : AdultHeight;
        Bounds b = skin != null ? skin.bounds : new Bounds(Vector3.zero, Vector3.one);
        float h = Mathf.Max(0.01f, b.size.y);
        visual.transform.localScale = Vector3.one * (target / h);
        visual.transform.localPosition = new Vector3(0f, -(b.min.y - transform.position.y) * (target / h), 0f);

        hips = FindDeep(visual.transform, "Hips");
        head = FindDeep(visual.transform, "Head");
        rightHand = FindDeep(visual.transform, "RightHand");
        SetupAnimation();
        BuildAttachments(target);
        BuildBag();
        visual.transform.rotation = Quaternion.Euler(0f, heading + ModelYawOffset, 0f);
    }

    void BuildFallback()
    {
        visual = new GameObject("fallback-mom");
        visual.transform.SetParent(transform, false);
        float h = child ? ChildHeight : AdultHeight;
        Kit.Cap(visual.transform, 0.22f, h * 0.7f, new Vector3(0, h * 0.4f, 0), "#F4B6C2");
        Kit.Sph(visual.transform, 0.2f, new Vector3(0, h * 0.85f, 0), "#F6E3D8");
        Debug.LogWarning("[MomGame] Kenney character not found; using a placeholder. Re-import Resources/Kenney/Characters.");
    }

    void ApplySkin()
    {
        if (skinMat == null) return;
        Texture2D t = child ? texGirl : (shoesOn ? texShoes : texSlippers);
        if (t != null) skinMat.mainTexture = t; else skinMat.color = new Color(0.96f, 0.71f, 0.76f);
    }

    public void SetFootwear(bool shoes) { shoesOn = shoes; ApplySkin(); }

    void SetupAnimation()
    {
        var animator = visual.GetComponent<Animator>();
        if (animator == null) animator = visual.AddComponent<Animator>();
        animator.runtimeAnimatorController = null;
        animator.applyRootMotion = false;
        idleC = FindClip("Kenney/Characters/idle", "idle");
        runC = FindClip("Kenney/Characters/run", "run");
        jumpC = FindClip("Kenney/Characters/jump", "jump");
        if (idleC == null) return;

        graph = PlayableGraph.Create("MomAnim");
        graph.SetTimeUpdateMode(DirectorUpdateMode.GameTime);
        mixer = AnimationMixerPlayable.Create(graph, 3);
        idleP = AnimationClipPlayable.Create(graph, idleC); idleP.SetSpeed(0);
        graph.Connect(idleP, 0, mixer, 0);
        if (runC != null) { runP = AnimationClipPlayable.Create(graph, runC); runP.SetSpeed(0); graph.Connect(runP, 0, mixer, 1); }
        if (jumpC != null) { jumpP = AnimationClipPlayable.Create(graph, jumpC); jumpP.SetSpeed(0); graph.Connect(jumpP, 0, mixer, 2); }
        mixer.SetInputWeight(0, 1f);
        var output = AnimationPlayableOutput.Create(graph, "out", animator);
        output.SetSourcePlayable(mixer);
        graph.Play();
        graphOn = true;
    }

    static AnimationClip FindClip(string path, string keyword)
    {
        var all = Resources.LoadAll<AnimationClip>(path);
        AnimationClip best = null;
        foreach (var c in all)
        {
            if (c == null || c.name.StartsWith("__preview")) continue;
            if (c.name.ToLowerInvariant().Contains(keyword)) return c;
            if (best == null || c.length > best.length) best = c;
        }
        return best;
    }

    static Transform FindDeep(Transform t, string name)
    {
        if (t.name == name) return t;
        for (int i = 0; i < t.childCount; i++) { var r = FindDeep(t.GetChild(i), name); if (r != null) return r; }
        return null;
    }

    // Long denim skirt + perm puffs (adult) / pigtails + short skirt (girl). These follow the
    // skeleton's positions but not its rotations, so they stay tidy while she walks.
    void BuildAttachments(float H)
    {
        // proportions measured on the model (fractions of the character's height)
        skirtFollow = new GameObject("skirt-follow").transform;
        skirtFollow.SetParent(transform, false);
        Texture2D denim = DenimTexture();
        if (!child)
        {
            var mat = Kit.MatTex(denim, 0.08f);
            var skirt = Kit.Frustum(skirtFollow, 0.30f * (H / AdultHeight), 0.185f * (H / AdultHeight), 0.46f * (H / AdultHeight), new Vector3(0f, -0.30f * H / AdultHeight, 0f), "#5B7DA8", 24, mat);
            skirt.name = "denim-skirt";
            Kit.Cyl(skirtFollow, 0.302f, 0.035f, new Vector3(0f, -0.30f * H / AdultHeight, 0f), "#4A6C98", 24);
            Kit.Cyl(skirtFollow, 0.19f, 0.04f, new Vector3(0f, 0.15f * H / AdultHeight, 0f), "#4A6C98", 24);
        }
        else
        {
            var mat = Kit.MatTex(denim, 0.08f); mat.color = Kit.C("#B8745F");
            Kit.Frustum(skirtFollow, 0.24f, 0.15f, 0.2f, new Vector3(0f, -0.1f, 0f), "#9C5B4B", 20, mat);
        }

        headFollow = new GameObject("head-follow").transform;
        headFollow.SetParent(transform, false);
        float hr = 0.12f * H; // head half-width
        var hairMat = Kit.Mat("#1E1A19", 0.25f);
        if (!child)
        {   // 뽀글머리: little curls puffing out of the hair cap
            var rnd = new System.Random(11);
            for (int i = 0; i < 16; i++)
            {
                double u = rnd.NextDouble() * Math.PI * 2, v = 0.15 + rnd.NextDouble() * 1.05; // angle from the top
                var n = new Vector3((float)(Math.Sin(v) * Math.Sin(u)), (float)Math.Cos(v), (float)(Math.Sin(v) * Math.Cos(u)));
                if (n.z > 0.35f && n.y < 0.7f) continue; // keep the face clear
                Kit.Sph(headFollow, hr * 0.42f, n * hr * 1.02f + new Vector3(0f, 0.16f * H, -0.02f * H), "#1E1A19", hairMat);
            }
        }
        else
        {   // pigtails with red ribbons
            foreach (float sx in new[] { -1f, 1f })
            {
                Kit.Cap(headFollow, hr * 0.28f, hr * 1.6f, new Vector3(sx * hr * 1.12f, 0.08f * H, -0.02f * H), "#1E1A19", hairMat).transform.localRotation = Quaternion.Euler(0, 0, sx * 14f);
                Kit.Sph(headFollow, hr * 0.3f, new Vector3(sx * hr * 1.02f, 0.16f * H, -0.02f * H), "#E4574F");
            }
        }

        handFollow = new GameObject("hand-follow").transform;
        handFollow.SetParent(transform, false);
    }

    static Texture2D _denim;
    static Texture2D DenimTexture()
    {
        if (_denim != null) return _denim;
        var cv = new Kit.Canvas2D(64, 64, Kit.C("#5B7DA8"));
        var rnd = new System.Random(5);
        for (int i = 0; i < 500; i++) cv.Set(rnd.Next(64), rnd.Next(64), Kit.C(rnd.Next(2) == 0 ? "#6A8CB6" : "#4F7099"), 0.55f);
        for (int x = 4; x < 64; x += 16) cv.Line(x, 0, x, 63, 1f, Kit.C("#E7C15B"), 0.8f);   // seam stitching
        _denim = cv.ToTexture(true);
        return _denim;
    }

    void BuildBag()
    {
        bag = new GameObject("shopping-bag");
        bag.transform.SetParent(handFollow, false);
        Kit.Box(bag.transform, new Vector3(0.2f, 0.24f, 0.09f), new Vector3(0, -0.3f, 0), "#F6EFE2", 0.012f);
        Kit.Cyl(bag.transform, 0.05f, 0.01f, new Vector3(0, -0.05f, 0), "#B9824B", 10);
        bagItems = new GameObject[8];
        string[] cols = { "#F4B6C2", "#C9B6E4", "#E8C547", "#7BA7A3", "#EFA36B", "#E4574F", "#9CC58C", "#FFFFFF" };
        for (int i = 0; i < 8; i++)
        {
            bagItems[i] = Kit.Box(bag.transform, new Vector3(0.07f, 0.09f, 0.05f), new Vector3(-0.06f + (i % 3) * 0.06f, -0.1f + (i / 3) * 0.03f, 0), cols[i], 0.01f);
            bagItems[i].transform.localRotation = Quaternion.Euler(0, 0, (i % 2 == 0 ? -1 : 1) * 12f);
            bagItems[i].SetActive(false);
        }
        bag.SetActive(false);
    }

    public void ShowBag(bool show, int items) { showBag = show; if (bag != null) { bag.SetActive(show); for (int i = 0; i < bagItems.Length; i++) bagItems[i].SetActive(i < items); } }

    // ───────────────────────── control ─────────────────────────
    public void Teleport(Vector3 pos, float newHeading)
    {
        cc.enabled = false; transform.position = pos; cc.enabled = true;
        heading = newHeading; visualYaw = newHeading; speed = 0f;
        sitting = false; sitLower = 0f;
        if (visual != null) visual.transform.localPosition = new Vector3(0f, visual.transform.localPosition.y, 0f);
    }

    public void FaceToward(Vector3 p)
    {
        Vector3 d = p - transform.position; d.y = 0f;
        if (d.sqrMagnitude > 0.0001f) heading = Mathf.Atan2(d.x, d.z) * Mathf.Rad2Deg;
    }

    public void SitAt(Vector3 pos, float h, float lower = 0.0f)
    {
        cc.enabled = false; transform.position = pos; cc.enabled = true;
        heading = h; sitting = true; sitLower = lower; speed = 0f;
    }

    public void Stand() { sitting = false; sitLower = 0f; }

    public void Jump() { if (jumpC != null && !jumping) { jumping = true; jumpT = 0f; } }

    // input: x = turn (A/D), y = forward/back (W/S)
    public void Drive(Vector2 input, float dt, bool allowMove)
    {
        if (!allowMove || sitting) input = Vector2.zero;
        heading += input.x * (child ? 150f : 130f) * dt;
        float top = child ? 1.9f : 1.9f;
        float target = input.y > 0f ? top * input.y : input.y * top * 0.55f;
        speed = Mathf.Lerp(speed, target, 1f - Mathf.Exp(-dt * 9f));
        if (Mathf.Abs(speed) > 0.02f)
        {
            Vector3 d = Forward * (speed * dt);
            cc.Move(d + Vector3.down * 0.02f);
            var p = transform.position; if (Mathf.Abs(p.y) > 0.001f) { cc.enabled = false; transform.position = new Vector3(p.x, 0f, p.z); cc.enabled = true; }
        }
        Speed01 = Mathf.Clamp01(Mathf.Abs(speed) / top);
        visualYaw = Mathf.LerpAngle(visualYaw, heading, 1f - Mathf.Exp(-dt * 14f));
    }

    void LateUpdate()
    {
        if (visual == null) return;
        float dt = Time.deltaTime;
        visual.transform.rotation = Quaternion.Euler(0f, visualYaw + ModelYawOffset, 0f);
        float baseY = visual.transform.localPosition.y;
        visual.transform.localPosition = new Vector3(0f, baseY, 0f); // keep her centered on the collider
        // sitting: legs sink into the seat, the upper body stays visible
        float targetLower = sitting ? sitLower : 0f;
        Vector3 lp = visual.transform.localPosition; lp.y = Mathf.Lerp(lp.y, SitBaseY() - targetLower, 1f - Mathf.Exp(-dt * 8f)); visual.transform.localPosition = lp;

        Animate(dt);

        // attachments follow the skeleton
        Quaternion yaw = Quaternion.Euler(0f, visualYaw, 0f);
        float H = child ? ChildHeight : AdultHeight;
        if (hips != null && skirtFollow != null) { skirtFollow.position = new Vector3(hips.position.x, hips.position.y + 0.1f * H, hips.position.z); skirtFollow.rotation = yaw; }
        if (head != null && headFollow != null) { headFollow.position = head.position; headFollow.rotation = yaw; }
        if (rightHand != null && handFollow != null) { handFollow.position = rightHand.position; handFollow.rotation = yaw; }
    }

    float baseYCache = float.NaN;
    float SitBaseY()
    {
        if (float.IsNaN(baseYCache)) baseYCache = visual.transform.localPosition.y;
        return baseYCache;
    }

    void Animate(float dt)
    {
        if (!graphOn) return;
        float move = Speed01;
        runWeight = Mathf.Lerp(runWeight, runC != null ? move * 0.7f : 0f, 1f - Mathf.Exp(-dt * 10f));
        idleT += dt;
        float dir = speed < -0.05f ? -0.7f : 1f;
        runT += dt * Mathf.Lerp(0.5f, 0.95f, move) * dir;
        if (runC != null && move > 0.15f)
        {
            float cyc = runT / (runC.length * 0.5f);
            if ((int)Mathf.Floor(cyc) != (int)Mathf.Floor(stepAcc)) { if (OnStep != null) OnStep(); }
            stepAcc = cyc;
        }
        float jw = 0f;
        if (jumping)
        {
            jumpT += dt;
            float len = jumpC.length;
            jw = Mathf.Sin(Mathf.Clamp01(jumpT / len) * Mathf.PI);
            jumpP.SetTime(Mathf.Min(jumpT, len));
            if (jumpT >= len) jumping = false;
        }
        jumpWeight = jw;
        idleP.SetTime(Mathf.Repeat(idleT, idleC.length));
        mixer.SetInputWeight(0, Mathf.Clamp01(1f - runWeight - jumpWeight));
        if (runC != null) { runP.SetTime(Mathf.Repeat(runT, runC.length)); mixer.SetInputWeight(1, runWeight); }
        if (jumpC != null) mixer.SetInputWeight(2, jumpWeight);
    }
}
