// Atmosphere.cs — lighting + colour grading as storytelling.
//
// One place decides how the world FEELS right now:
//   mood       "title" | "dusk" | "rain" | "heavy"   (where the story is)
//   distortion 0..1                                    (memory slipping, right now)
//   memory     0..100                                  (how reliable memory is overall)
// Everything blends smoothly toward its target — no hard cuts, no flashing.
using System.Collections.Generic;
using System.Reflection;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;

namespace BigGreenBear
{
    public class Atmosphere : MonoBehaviour
    {
        public static bool ReducedMotion;

        class Mood
        {
            public Color global; public float globalI;
            public float lamps;
            public float saturation; public float exposure; public Color filter; public float vignette;
            public float wet; public float rain; public float bloom;
            public Mood Copy() => (Mood)MemberwiseClone();
        }

        static readonly Dictionary<string, Mood> Moods = new Dictionary<string, Mood>
        {
            // warm, safe: the festival
            { "dusk",  new Mood { global = new Color(0.86f, 0.80f, 0.86f), globalI = 0.8f, lamps = 1.05f, saturation = 4f,   exposure = 0.05f,  filter = new Color(1f, 0.96f, 0.9f),  vignette = 0.22f, wet = 0f,    rain = 0f,    bloom = 0.35f } },
            // the first rain: cooler shadows, the lights hold
            { "rain",  new Mood { global = new Color(0.66f, 0.74f, 0.86f), globalI = 0.66f,  lamps = 0.95f, saturation = -12f, exposure = -0.08f, filter = new Color(0.9f, 0.95f, 1f),  vignette = 0.3f,  wet = 0.7f,  rain = 0.45f, bloom = 0.3f } },
            // heavier: darker, wetter, colder
            { "heavy", new Mood { global = new Color(0.52f, 0.64f, 0.74f), globalI = 0.56f, lamps = 0.8f,  saturation = -24f, exposure = -0.18f, filter = new Color(0.84f, 0.93f, 0.98f), vignette = 0.36f, wet = 1f,    rain = 0.85f, bloom = 0.25f } },
            // indoors at the cafe: warm, dry, the rain only on the window
            { "cafe",  new Mood { global = new Color(0.95f, 0.86f, 0.76f), globalI = 0.86f, lamps = 1f,   saturation = 0f,   exposure = 0.05f,  filter = new Color(1f, 0.95f, 0.88f), vignette = 0.28f, wet = 0f,    rain = 0f,    bloom = 0.3f } },
            // the cafe later: the same room, colder
            { "cafe_late", new Mood { global = new Color(0.7f, 0.75f, 0.8f), globalI = 0.62f,  lamps = 0.7f, saturation = -30f, exposure = -0.12f, filter = new Color(0.86f, 0.93f, 0.96f), vignette = 0.4f, wet = 0f, rain = 0f, bloom = 0.2f } },
            // under the square: cold, weak, uneven light
            { "passage", new Mood { global = new Color(0.45f, 0.6f, 0.6f), globalI = 0.5f, lamps = 0.9f, saturation = -35f, exposure = -0.2f, filter = new Color(0.78f, 0.92f, 0.9f), vignette = 0.5f, wet = 0f, rain = 0f, bloom = 0.2f } },
            // memory breaking: the festival with no festival in it
            { "void",  new Mood { global = new Color(0.55f, 0.66f, 0.68f), globalI = 0.5f, lamps = 0.35f, saturation = -60f, exposure = -0.25f, filter = new Color(0.74f, 0.88f, 0.88f), vignette = 0.5f, wet = 1f, rain = 0.25f, bloom = 0.1f } },
            // a bright room. everything far away.
            { "hospital", new Mood { global = new Color(0.86f, 0.94f, 0.94f), globalI = 0.9f, lamps = 0.6f, saturation = -45f, exposure = 0.15f, filter = new Color(0.9f, 0.98f, 1f), vignette = 0.3f, wet = 0f, rain = 0f, bloom = 0.15f } },
            // years later. the only daylight in the game.
            { "home",  new Mood { global = new Color(1f, 0.95f, 0.86f), globalI = 0.95f, lamps = 1f,   saturation = 5f,   exposure = 0.1f,  filter = new Color(1f, 0.97f, 0.9f),  vignette = 0.2f,  wet = 0f,    rain = 0f,    bloom = 0.3f } },
            // title: the same square, at night, in the rain, before anything
            { "title", new Mood { global = new Color(0.5f, 0.6f, 0.72f),  globalI = 0.5f, lamps = 0.85f, saturation = -20f, exposure = -0.25f, filter = new Color(0.86f, 0.92f, 1f),  vignette = 0.42f, wet = 0.9f,  rain = 0.5f,  bloom = 0.3f } },
        };

        Light2D global;
        readonly List<Light2D> lamps = new List<Light2D>();
        readonly List<float> lampBase = new List<float>();
        readonly List<float> lampSeed = new List<float>();
        Light2D fluorescent;
        ColorAdjustments color;
        Vignette vignette;
        Bloom bloom;
        Stage stage;
        RainSystem rain;

        Mood target = Moods["dusk"];
        Mood cur;
        float distortion, distortionTarget;
        float memory = 100f;
        float fluorescentOn;
        public bool LightsAvailable { get; private set; }

        public void Init(Stage s, RainSystem r, Camera cam, SceneLayout layout, bool use2DLights)
        {
            stage = s;
            rain = r;
            cur = Clone(target);

            // --- colour grading (URP post-processing) ---
            var camData = cam.GetUniversalAdditionalCameraData();
            if (camData != null) camData.renderPostProcessing = true;
            var volGo = new GameObject("Volume");
            volGo.transform.SetParent(transform, false);
            var volume = volGo.AddComponent<Volume>();
            volume.isGlobal = true;
            volume.priority = 10;
            var profile = ScriptableObject.CreateInstance<VolumeProfile>();
            volume.profile = profile;
            color = profile.Add<ColorAdjustments>(true);
            vignette = profile.Add<Vignette>(true);
            bloom = profile.Add<Bloom>(true);
            vignette.smoothness.Override(0.45f);
            vignette.color.Override(new Color(0.04f, 0.06f, 0.08f));
            bloom.threshold.Override(0.95f);
            bloom.scatter.Override(0.6f);

            // --- 2D lights ---
            if (!use2DLights) return;
            foreach (var old in FindObjectsByType<Light2D>(FindObjectsSortMode.None))
                old.enabled = false; // the template's own Global Light 2D: we bring ours

            global = MakeLight("GlobalLight", Light2D.LightType.Global, Vector3.zero, 0f, 1f);
            LightsAvailable = global != null;
        }

        GameObject lightRoot;

        // Rebuild the lamps of the current location (called after Stage.LoadLocation).
        public void SetLights(LocationLayout loc)
        {
            if (lightRoot != null) Destroy(lightRoot);
            lamps.Clear();
            lampBase.Clear();
            lampSeed.Clear();
            fluorescent = null;
            if (global == null || loc == null || loc.lights == null) return;
            lightRoot = new GameObject("LocationLights");
            lightRoot.transform.SetParent(transform, false);
            foreach (var l in loc.lights)
            {
                Vector3 p = string.IsNullOrEmpty(l.anchor) ? new Vector3(l.x, l.y, l.z) : stage.Anchor(l.anchor, new Vector3(l.x, l.y, l.z)) + new Vector3(l.x, l.y, 0f);
                var light = MakeLight("Light_" + l.id, Light2D.LightType.Point, p, l.radius, l.intensity);
                light.transform.SetParent(lightRoot.transform, true);
                if (l.kind == "fluorescent")
                {
                    light.color = new Color(0.78f, 0.93f, 1f);
                    light.intensity = 0f;
                    fluorescent = light;
                }
                else
                {
                    light.color = l.kind == "string" ? new Color(1f, 0.82f, 0.55f)
                                : l.kind == "cold" ? new Color(0.75f, 0.9f, 0.85f)
                                : l.kind == "day" ? new Color(1f, 0.95f, 0.85f)
                                : new Color(1f, 0.78f, 0.48f);
                    lamps.Add(light);
                    lampBase.Add(l.intensity);
                    lampSeed.Add(Random.value * 10f);
                }
            }
        }

        Light2D MakeLight(string name, Light2D.LightType type, Vector3 pos, float radius, float intensity)
        {
            var go = new GameObject(name);
            go.transform.SetParent(transform, false);
            go.transform.position = pos;
            var light = go.AddComponent<Light2D>();
            light.lightType = type;
            light.intensity = intensity;
            if (type == Light2D.LightType.Point)
            {
                light.pointLightOuterRadius = radius;
                light.pointLightInnerRadius = radius * 0.15f;
                light.falloffIntensity = 0.7f;
            }
            TargetAllSortingLayers(light);
            return light;
        }

        // A Light2D added from code may light no sorting layers at all. Point it at all of them.
        static void TargetAllSortingLayers(Light2D light)
        {
            var layers = SortingLayer.layers;
            var ids = new int[layers.Length];
            for (int i = 0; i < layers.Length; i++) ids[i] = layers[i].id;
            var f = typeof(Light2D).GetField("m_ApplyToSortingLayers", BindingFlags.NonPublic | BindingFlags.Instance);
            if (f != null) f.SetValue(light, ids);
            else Debug.LogWarning("[BigGreenBear] Could not set Light2D sorting layers; if the scene looks black, untick 'Use 2D Lights' on SliceBootstrap.");
        }

        public string MoodName { get; private set; } = "dusk";

        public void SetMood(string mood, bool instant = false)
        {
            if (!Moods.TryGetValue(mood, out var m)) return;
            MoodName = mood;
            target = m;
            rain.SetIntensity(m.rain, instant);
            if (instant) cur = Clone(m);
        }

        public void SetRainOverride(float r) => rain.SetIntensity(r);
        public void SetDistortion(float d) => distortionTarget = Mathf.Clamp01(d);
        public void SetMemory(float m) => memory = Mathf.Clamp(m, 0f, 100f);
        public void FluorescentFlicker() => fluorescentOn = 2.4f;
        public float Distortion => distortion;

        static Mood Clone(Mood m) => m.Copy();

        void Update()
        {
            float k = 1f - Mathf.Exp(-0.9f * Time.deltaTime);
            cur.global = Color.Lerp(cur.global, target.global, k);
            cur.globalI = Mathf.Lerp(cur.globalI, target.globalI, k);
            cur.lamps = Mathf.Lerp(cur.lamps, target.lamps, k);
            cur.saturation = Mathf.Lerp(cur.saturation, target.saturation, k);
            cur.exposure = Mathf.Lerp(cur.exposure, target.exposure, k);
            cur.filter = Color.Lerp(cur.filter, target.filter, k);
            cur.vignette = Mathf.Lerp(cur.vignette, target.vignette, k);
            cur.wet = Mathf.Lerp(cur.wet, target.wet, k * 0.6f);
            cur.bloom = Mathf.Lerp(cur.bloom, target.bloom, k);
            distortion = Mathf.MoveTowards(distortion, distortionTarget, Time.deltaTime * 0.8f);

            float d = distortion;
            float memLoss = (100f - memory) / 100f;
            var cold = new Color(0.62f, 0.86f, 0.88f);

            if (color != null)
            {
                color.saturation.Override(cur.saturation - 45f * d - 30f * memLoss);
                color.postExposure.Override(cur.exposure - 0.15f * d);
                color.colorFilter.Override(Color.Lerp(cur.filter, cold, d * 0.6f + memLoss * 0.3f));
                color.contrast.Override(8f * d);
                vignette.intensity.Override(cur.vignette + 0.18f * d);
                bloom.intensity.Override(cur.bloom);
            }

            if (global != null)
            {
                global.color = Color.Lerp(cur.global, new Color(0.55f, 0.72f, 0.78f), d * 0.7f);
                global.intensity = cur.globalI * (1f - 0.25f * d);
                for (int i = 0; i < lamps.Count; i++)
                {
                    // the lamps breathe a little in the rain; they stutter when memory slips
                    float flicker = ReducedMotion ? 1f : 1f + Mathf.Sin(Time.time * 7f + lampSeed[i]) * 0.03f * rain.Intensity
                                                         - (Mathf.PerlinNoise(Time.time * 3f, lampSeed[i]) > 0.8f ? 0.35f * d : 0f);
                    lamps[i].intensity = lampBase[i] * cur.lamps * (1f - 0.55f * d) * flicker;
                }
                if (fluorescent != null)
                {
                    // a cold hospital light where no such light exists. Brief. Then gone.
                    fluorescentOn = Mathf.Max(0f, fluorescentOn - Time.deltaTime);
                    float on = fluorescentOn > 0f ? 1f : 0f;
                    float stutter = (ReducedMotion || fluorescentOn < 0.4f || fluorescentOn > 2.1f) ? 1f : (Mathf.PerlinNoise(Time.time * 18f, 3.3f) > 0.35f ? 1f : 0.2f);
                    fluorescent.intensity = Mathf.MoveTowards(fluorescent.intensity, 1.6f * on * stutter, Time.deltaTime * 6f);
                }
            }

            stage.SetLayerAlpha("ground_wet", cur.wet);
        }
    }
}
