using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Rendering;

namespace DrivingSim.TestBed
{
    public interface IMaterialSource
    {
        Material Get(string key, Color color);
    }

    /// <summary>
    /// Creates flat-colored materials for the active render pipeline (URP Lit if a URP asset is
    /// assigned, otherwise Built-in Standard). Runtime-only materials are not saved with a scene.
    /// </summary>
    public class RuntimeMaterialSource : IMaterialSource
    {
        readonly Dictionary<string, Material> cache = new Dictionary<string, Material>();

        public Material Get(string key, Color color)
        {
            if (cache.TryGetValue(key, out Material existing)) return existing;
            Material material = CreateMaterial(key, color);
            cache[key] = material;
            return material;
        }

        public static Shader FindLitShader()
        {
            Shader shader = null;
            if (GraphicsSettings.currentRenderPipeline != null)
                shader = Shader.Find("Universal Render Pipeline/Lit");
            if (shader == null) shader = Shader.Find("Standard");
            if (shader == null) shader = Shader.Find("Universal Render Pipeline/Lit");
            if (shader == null) shader = Shader.Find("Unlit/Color");
            if (shader == null) shader = Shader.Find("Sprites/Default");
            // Last resort so construction never throws (e.g. headless test runs without shaders).
            if (shader == null) shader = Shader.Find("Hidden/InternalErrorShader");
            return shader;
        }

        public static Material CreateMaterial(string key, Color color)
        {
            var material = new Material(FindLitShader()) { name = key };
            ApplyColor(material, color);
            return material;
        }

        public static void ApplyColor(Material material, Color color)
        {
            if (material.HasProperty("_BaseColor")) material.SetColor("_BaseColor", color);
            if (material.HasProperty("_Color")) material.SetColor("_Color", color);
            if (material.HasProperty("_Smoothness")) material.SetFloat("_Smoothness", 0.15f);
            if (material.HasProperty("_Glossiness")) material.SetFloat("_Glossiness", 0.15f);
        }
    }

    public static class Palette
    {
        public static readonly Color Asphalt = new Color(0.23f, 0.24f, 0.26f);
        public static readonly Color LineWhite = new Color(0.93f, 0.93f, 0.9f);
        public static readonly Color LineYellow = new Color(0.98f, 0.78f, 0.18f);
        public static readonly Color GridLine = new Color(0.30f, 0.31f, 0.33f);
        public static readonly Color Curb = new Color(0.72f, 0.72f, 0.70f);
        public static readonly Color Cone = new Color(1f, 0.45f, 0.1f);
        public static readonly Color Building = new Color(0.62f, 0.68f, 0.76f);
        public static readonly Color Ramp = new Color(0.36f, 0.38f, 0.42f);
        public static readonly Color Obstacle = new Color(0.85f, 0.3f, 0.3f);
        public static readonly Color CarBody = new Color(0.16f, 0.45f, 0.85f);
        public static readonly Color CarGlass = new Color(0.12f, 0.16f, 0.22f);
        public static readonly Color Tire = new Color(0.08f, 0.08f, 0.09f);
        public static readonly Color Hub = new Color(0.75f, 0.77f, 0.8f);
        public static readonly Color HeadLight = new Color(1f, 0.95f, 0.7f);
        public static readonly Color TailLight = new Color(0.85f, 0.1f, 0.1f);
        public static readonly Color HeadLightOff = new Color(0.78f, 0.78f, 0.74f);
        public static readonly Color IndicatorOff = new Color(0.45f, 0.3f, 0.1f);
        public static readonly Color IndicatorOn = new Color(1f, 0.62f, 0.05f);
        public static readonly Color WiperBlade = new Color(0.06f, 0.06f, 0.07f);
    }
}
