using System.Collections.Generic;
using UnityEngine;

// A place Mom can be (Home, LF Square, The Past, the Beach, the Drive). Each world lives under its
// own root object; only the current one is active.
public abstract class World
{
    public string name;
    public GameObject root;
    public Light sun;
    public readonly List<Interactable> items = new List<Interactable>();
    protected GameController g;
    public bool OwnsCamera;

    // atmosphere
    protected Color ambient = new Color(0.82f, 0.74f, 0.64f);
    protected Color fogColor = new Color(1f, 0.89f, 0.7f);
    protected float fogStart = 40f, fogEnd = 300f;
    protected Material skyMat;

    protected World(GameController game, string worldName)
    {
        g = game; name = worldName;
        root = new GameObject("World-" + worldName);
        root.SetActive(false);
    }

    public abstract void Build();
    public virtual void Enter(string from) { }
    public virtual void Exit() { }
    public virtual void Tick(float dt) { }
    public virtual string Surface(Vector3 p) { return "wood"; }

    // sound for each step on this world's floor
    public void ApplyAtmosphere()
    {
        RenderSettings.ambientMode = UnityEngine.Rendering.AmbientMode.Flat;
        RenderSettings.ambientLight = ambient;
        RenderSettings.fog = true; RenderSettings.fogMode = FogMode.Linear;
        RenderSettings.fogColor = fogColor; RenderSettings.fogStartDistance = fogStart; RenderSettings.fogEndDistance = fogEnd;
        RenderSettings.sun = sun;
        if (skyMat != null) { RenderSettings.skybox = skyMat; g.cam.clearFlags = CameraClearFlags.Skybox; }
        else { g.cam.clearFlags = CameraClearFlags.SolidColor; g.cam.backgroundColor = fogColor; }
    }

    protected Light MakeSun(string hex, float intensity, Vector3 euler, float shadowStrength = 0.9f)
    {
        var go = new GameObject("sun"); go.transform.SetParent(root.transform, false);
        var l = go.AddComponent<Light>();
        l.type = LightType.Directional; l.color = Kit.C(hex); l.intensity = intensity;
        l.shadows = LightShadows.Soft; l.shadowStrength = shadowStrength; l.shadowBias = 0.03f; l.shadowNormalBias = 0.4f;
        go.transform.rotation = Quaternion.Euler(euler);
        sun = l;
        return l;
    }

    protected Light MakeLamp(Vector3 pos, string hex, float intensity, float range, bool shadows = false)
    {
        var go = new GameObject("lamp"); go.transform.SetParent(root.transform, false);
        go.transform.localPosition = pos;
        var l = go.AddComponent<Light>();
        l.type = LightType.Point; l.color = Kit.C(hex); l.intensity = intensity; l.range = range;
        l.shadows = shadows ? LightShadows.Soft : LightShadows.None;
        return l;
    }

    protected Material MakeSky(float thickness = 1f, string tint = "#8FB6D9", float exposure = 1.1f)
    {
        var sh = Shader.Find("Skybox/Procedural");
        if (sh == null) return null;
        var m = new Material(sh);
        m.SetFloat("_SunSize", 0.05f); m.SetFloat("_SunSizeConvergence", 5f);
        m.SetFloat("_AtmosphereThickness", thickness);
        m.SetColor("_SkyTint", Kit.C(tint)); m.SetColor("_GroundColor", Kit.C("#6C7C66")); m.SetFloat("_Exposure", exposure);
        return m;
    }

    protected Interactable Add(string id, Vector3 pos, float reach, System.Func<System.Collections.IEnumerator> use, string discover = null, System.Func<bool> enabled = null, float hintLift = 0.45f)
    {
        var it = new Interactable { id = id, pos = pos, reach = reach, use = use, discover = discover, enabled = enabled, hintLift = hintLift, phase = Random.value * 10f };
        if (discover != null)
        {
            var s = Kit.GlowSprite(root.transform, pos + Vector3.up * 0.1f, 0.4f, "#FFE7B0", 0.7f, Kit.StarTex());
            s.SetActive(false); it.sparkle = s;
        }
        items.Add(it);
        return it;
    }
}
