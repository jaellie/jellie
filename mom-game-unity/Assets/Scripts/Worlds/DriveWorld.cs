using System.Collections;
using System.Collections.Generic;
using UnityEngine;

// Shared little helpers for Kenney cars (their front faces +Z; Kenney.Spawn assumes -Z, hence +180).
public static class Cars
{
    public static GameObject Spawn(string key, Transform parent, Vector3 pos, float heading, float scale = 1.8f, bool solid = false)
    {
        return Kenney.Spawn(key, parent, pos, heading + 180f, scale, null, -1f, -1f, -1f, solid);
    }
    public static GameObject Dad(Transform parent, Vector3 pos, float heading, bool solid = false) { return Spawn("car/sedan-black", parent, pos, heading, 1.8f, solid); }
}

// The short drive along the coast road (Dad's black car, Kenney road + car kits). The camera follows
// the car; at the end she arrives at the mall (from home) or back home (from the mall).
public class DriveWorld : World
{
    Transform car; readonly List<Transform> oncoming = new List<Transform>(); readonly List<float> oncSpeed = new List<float>();
    string dest = "mall"; float t; bool running; float sway;
    const float SPEED = 13f, DURATION = 9f;

    public DriveWorld(GameController game) : base(game, "drive") { OwnsCamera = true; }

    public override void Build()
    {
        ambient = new Color(0.86f, 0.74f, 0.62f); fogColor = Kit.C("#F6D9AE"); fogStart = 60f; fogEnd = 320f;
        skyMat = MakeSky(1.3f, "#9CB8D6", 1.1f);
        MakeSun("#FFD49A", 1.35f, new Vector3(18f, 270f, 0f));
        var r = root.transform; var rnd = new System.Random(77);
        // road: Kenney road tiles (they run along X, so turn them to run along Z)
        for (int i = -4; i < 46; i++)
            Kenney.Spawn("rd/road-straight", r, new Vector3(0f, 0f, i * 6f), 90f, 6f);
        // dry grass on the land side, sand + sea on the other
        Kit.NoShadow(Kit.Box(r, new Vector3(120f, 0.2f, 330f), new Vector3(-66f, -0.25f, 120f), "#A9B784"));
        Kit.NoShadow(Kit.Box(r, new Vector3(14f, 0.2f, 330f), new Vector3(10f, -0.25f, 120f), "#E9CFA2"));
        var sea = new GameObject("sea"); sea.transform.SetParent(r, false);
        sea.transform.localPosition = new Vector3(215f, -1.3f, 120f);
        sea.AddComponent<MeshFilter>().sharedMesh = ProcTex.Grid(40, 400f);
        var rend = sea.AddComponent<MeshRenderer>(); rend.sharedMaterial = Kit.MatUnique("#4F8EA4", 0.9f, 0f); rend.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
        var ss = sea.AddComponent<SeaSurface>(); ss.amp = 0.35f; ss.scale = 0.05f; ss.speed = 0.8f;
        // far hills + islands
        for (int i = 0; i < 10; i++)
            Kit.NoShadow(Kit.Cone(r, 30f + (float)rnd.NextDouble() * 40f, 18f + (float)rnd.NextDouble() * 25f, new Vector3(230f + (float)rnd.NextDouble() * 120f, -3f, -20f + i * 28f), "#6C8A68", 7));
        for (int i = 0; i < 8; i++)
            Kit.NoShadow(Kit.Cone(r, 40f + (float)rnd.NextDouble() * 30f, 22f + (float)rnd.NextDouble() * 18f, new Vector3(-130f - (float)rnd.NextDouble() * 40f, -2f, i * 40f), "#7C9770", 7));
        // street lamps, trees and little buildings along the way
        for (int i = 0; i < 12; i++) Kenney.Spawn("rd/light-curved", r, new Vector3(-4.2f, 0f, i * 24f), 90f, 4.5f);
        string[] low = { "shop/low-detail-building-a", "shop/low-detail-building-e", "shop/low-detail-building-h", "sub/building-type-c", "sub/building-type-f", "sub/building-type-k" };
        for (int i = 0; i < 14; i++)
        {
            float z = 6f + i * 17f + (float)rnd.NextDouble() * 6f;
            if (rnd.NextDouble() < 0.5) Kenney.Spawn(low[rnd.Next(low.Length)], r, new Vector3(-20f - (float)rnd.NextDouble() * 10f, 0f, z), 90f, 1f, null, -1f, 8f + (float)rnd.NextDouble() * 4f);
            Kenney.Spawn(i % 2 == 0 ? "sub/tree-large" : "sub/tree-small", r, new Vector3(-9f - (float)rnd.NextDouble() * 5f, 0f, z + 5f), (float)rnd.NextDouble() * 360f, 1f, null, -1f, 4f + (float)rnd.NextDouble() * 2f);
        }
        for (int i = 0; i < 9; i++)
            Kenney.Spawn(i % 2 == 0 ? "boat/boat-sail-a" : "boat/boat-fishing-small", r, new Vector3(50f + (float)rnd.NextDouble() * 120f, -1.3f, i * 28f), (float)rnd.NextDouble() * 360f, 1f, null, -1f, 7f);
        // Dad's black car + oncoming traffic
        car = Cars.Dad(r, new Vector3(1.6f, 0f, 0f), 0f).transform;
        string[] traffic = { "car/taxi", "car/van", "car/suv", "car/delivery", "car/hatchback-sports" };
        for (int i = 0; i < 4; i++) { var c = Cars.Spawn(traffic[i], r, new Vector3(-1.6f, 0f, 90f + i * 45f), 180f).transform; oncoming.Add(c); oncSpeed.Add(10f + i * 2f); }
    }

    public override void Enter(string from)
    {
        dest = from == "home" ? "mall" : "home";
        float s = HomeWorld.Sunset;
        sun.transform.rotation = Quaternion.Euler(Mathf.Lerp(22f, 5f, s), 270f, 0f);
        sun.color = Color.Lerp(Kit.C("#FFD49A"), Kit.C("#FF9A62"), s);
        ApplyAtmosphere();
        g.mom.gameObject.SetActive(false);
        g.audio.SetLoops("bgm_beach", "waves");
        g.audio.Play("car", 0.6f);
        t = 0f; running = false;
        car.position = new Vector3(1.6f, 0f, 0f);
        for (int i = 0; i < oncoming.Count; i++) oncoming[i].position = new Vector3(-1.6f, 0f, 70f + i * 38f);
        PlaceCam(0f);
        g.StartCoroutine(Run());
    }

    public override void Exit() { g.mom.gameObject.SetActive(true); running = false; }

    IEnumerator Run()
    {
        while (g.busy) yield return null;
        g.busy = true; running = true;
        yield return Anim.Wait(DURATION);
        running = false;
        g.busy = false;
        yield return g.StartCoroutine(g.GoTo(dest, dest == "mall" ? Color.white : Kit.C("#FFE2B0"), 1.2f));
    }

    void PlaceCam(float dt)
    {
        sway += dt;
        Vector3 cp = car.position;
        Vector3 pos = cp + new Vector3(2.4f + Mathf.Sin(sway * 0.4f) * 0.5f, 2.3f, -7.2f);
        var cam = g.cam.transform;
        cam.position = Vector3.Lerp(cam.position, pos, dt > 0f ? 1f - Mathf.Exp(-dt * 6f) : 1f);
        cam.rotation = Quaternion.LookRotation(cp + new Vector3(0f, 1.2f, 7f) - cam.position, Vector3.up);
    }

    public override void Tick(float dt)
    {
        if (running)
        {
            t += dt;
            car.position += Vector3.forward * SPEED * Mathf.Min(1f, t / 1.2f) * dt;
            car.localRotation = Quaternion.Euler(0f, 0f, 0f);
            for (int i = 0; i < oncoming.Count; i++) oncoming[i].position += Vector3.back * oncSpeed[i] * dt;
        }
        PlaceCam(dt);
    }

    public override string Surface(Vector3 p) { return "wood"; }
}
