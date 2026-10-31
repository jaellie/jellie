using System;
using UnityEngine;
using UnityEngine.Rendering;

namespace DrivingSim.World
{
    /// <summary>
    /// Clear-daytime look for driving scenes, kept cheap for phones: one soft-shadowed sun, a procedural sky,
    /// tri-color ambient light (no realtime GI) and light exponential fog that hides the far edge.
    /// Applied on every load (render settings are per scene; the sky material is created at runtime).
    /// </summary>
    [DefaultExecutionOrder(-300)]
    public class SceneAtmosphere : MonoBehaviour
    {
        [Serializable]
        public class Settings
        {
            [Header("Sun")]
            [Range(5f, 90f)] public float sunElevationDeg = 50f;
            [Range(-180f, 180f)] public float sunAzimuthDeg = -35f;   // from north (+Z), clockwise
            public Color sunColor = new Color(1f, 0.957f, 0.898f);      // ~5500 K
            [Range(0f, 3f)] public float sunIntensity = 1.25f;
            [Range(0f, 1f)] public float shadowStrength = 0.7f;        // soft enough to read into shade

            [Header("Ambient (tri-light)")]
            public Color skyAmbient = new Color(0.58f, 0.68f, 0.82f);
            public Color equatorAmbient = new Color(0.55f, 0.57f, 0.58f);
            public Color groundAmbient = new Color(0.33f, 0.31f, 0.28f);
            [Range(0f, 2f)] public float ambientIntensity = 1.05f;

            [Header("Sky")]
            public Color skyTint = new Color(0.42f, 0.58f, 0.86f);
            public Color groundColor = new Color(0.45f, 0.45f, 0.43f);
            [Range(0f, 5f)] public float atmosphereThickness = 0.85f;
            [Range(0f, 8f)] public float skyExposure = 1.2f;
            [Range(0f, 1f)] public float sunSize = 0.035f;

            [Header("Fog")]
            public bool fog = true;
            public Color fogColor = new Color(0.76f, 0.83f, 0.9f);
            [Range(0f, 0.02f)] public float fogDensity = 0.0022f;      // exp²: ~5% at 100 m, ~35% at 300 m, ~70% at 500 m
        }

        public const string SkyShader = "Skybox/Procedural";

        [SerializeField] Settings settings = new Settings();
        [SerializeField] Light sun;

        Material skyMaterial;

        public Settings Current => settings;
        public Light Sun => sun;

        /// <summary>Creates (or reuses) the atmosphere object and the scene's directional sun.</summary>
        public static SceneAtmosphere Ensure()
        {
            SceneAtmosphere atmosphere = FindFirstObjectByType<SceneAtmosphere>();
            if (atmosphere == null) atmosphere = new GameObject("Atmosphere").AddComponent<SceneAtmosphere>();
            if (atmosphere.sun == null)
            {
                foreach (Light light in FindObjectsByType<Light>(FindObjectsSortMode.None))
                    if (light.type == LightType.Directional) { atmosphere.sun = light; break; }
                if (atmosphere.sun == null)
                {
                    var sunObject = new GameObject("Sun");
                    atmosphere.sun = sunObject.AddComponent<Light>();
                    atmosphere.sun.type = LightType.Directional;
                }
            }
            atmosphere.Apply();
            return atmosphere;
        }

        void Awake() => Apply();

        void OnDestroy()
        {
            if (skyMaterial != null) Destroy(skyMaterial);
        }

        public void Apply()
        {
            Settings s = settings;
            if (sun != null)
            {
                sun.type = LightType.Directional;
                sun.color = s.sunColor;
                sun.intensity = s.sunIntensity;
                sun.shadows = LightShadows.Soft;
                sun.shadowStrength = s.shadowStrength;
                sun.shadowBias = 0.05f;
                sun.shadowNormalBias = 0.4f;
                sun.transform.rotation = Quaternion.Euler(s.sunElevationDeg, s.sunAzimuthDeg, 0f);
                RenderSettings.sun = sun;
            }

            RenderSettings.ambientMode = AmbientMode.Trilight;
            RenderSettings.ambientSkyColor = s.skyAmbient * s.ambientIntensity;
            RenderSettings.ambientEquatorColor = s.equatorAmbient * s.ambientIntensity;
            RenderSettings.ambientGroundColor = s.groundAmbient * s.ambientIntensity;
            RenderSettings.defaultReflectionMode = DefaultReflectionMode.Custom; // no realtime reflection probes on mobile
            RenderSettings.reflectionIntensity = 0.5f;

            Shader skyShader = Shader.Find(SkyShader);
            if (skyShader != null)
            {
                if (skyMaterial == null) skyMaterial = new Material(skyShader) { name = "Sky (runtime)" };
                if (skyMaterial.HasProperty("_SkyTint")) skyMaterial.SetColor("_SkyTint", s.skyTint);
                if (skyMaterial.HasProperty("_GroundColor")) skyMaterial.SetColor("_GroundColor", s.groundColor);
                if (skyMaterial.HasProperty("_AtmosphereThickness")) skyMaterial.SetFloat("_AtmosphereThickness", s.atmosphereThickness);
                if (skyMaterial.HasProperty("_Exposure")) skyMaterial.SetFloat("_Exposure", s.skyExposure);
                if (skyMaterial.HasProperty("_SunSize")) skyMaterial.SetFloat("_SunSize", s.sunSize);
                RenderSettings.skybox = skyMaterial;
            }

            RenderSettings.fog = s.fog;
            RenderSettings.fogMode = FogMode.ExponentialSquared;
            RenderSettings.fogColor = s.fogColor;
            RenderSettings.fogDensity = s.fogDensity;
        }
    }
}
