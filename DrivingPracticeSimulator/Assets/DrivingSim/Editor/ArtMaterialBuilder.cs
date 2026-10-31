using System;
using System.Collections.Generic;
using System.IO;
using UnityEditor;
using UnityEngine;

namespace DrivingSim.EditorTools
{
    /// <summary>
    /// Builds URP materials from Assets/DrivingSim/Art/Materials/materials.json. Codex can't author Unity
    /// materials in Blender, so it ships textures plus this manifest; Unity materials are generated here.
    /// Texture paths are relative to Assets/DrivingSim/Art/. See ASSET_SPEC.md §4.
    /// </summary>
    public static class ArtMaterialBuilder
    {
        public const string ManifestPath = ArtImportPostprocessor.MaterialFolder + "/materials.json";

        [Serializable] public class MaterialEntry
        {
            public string name;
            public string shader = "lit";          // lit | simplelit | unlit
            public string surface = "opaque";      // opaque | transparent
            public float[] baseColor = { 1f, 1f, 1f, 1f };
            public string baseMap, normalMap, maskMap, emissionMap;
            public float smoothness = 0.3f;
            public float metallic;
            public float[] emissionColor = { 0f, 0f, 0f };
            public bool doubleSided;
        }

        [Serializable] public class Manifest { public MaterialEntry[] materials; }

        static readonly Dictionary<string, string> Shaders = new Dictionary<string, string>
        {
            { "lit", "Universal Render Pipeline/Lit" },
            { "simplelit", "Universal Render Pipeline/Simple Lit" },
            { "unlit", "Universal Render Pipeline/Unlit" },
        };

        [MenuItem("DrivingSim/Art/Build Materials From Manifest", priority = 100)]
        public static void BuildFromMenu()
        {
            List<string> problems = Build();
            foreach (string p in problems) Debug.LogWarning("[DrivingSim Art] " + p);
            Debug.Log($"[DrivingSim Art] Materials built, {problems.Count} problem(s).");
        }

        /// <summary>Creates or updates every material in the manifest. Returns problems (empty when all is well).</summary>
        public static List<string> Build()
        {
            var problems = new List<string>();
            if (!File.Exists(ManifestPath)) { problems.Add($"Missing {ManifestPath}"); return problems; }
            Manifest manifest = JsonUtility.FromJson<Manifest>(File.ReadAllText(ManifestPath));
            if (manifest?.materials == null) { problems.Add("materials.json has no 'materials' array"); return problems; }

            foreach (MaterialEntry e in manifest.materials)
            {
                if (string.IsNullOrEmpty(e.name) || !e.name.StartsWith("M_", StringComparison.Ordinal)) { problems.Add($"Material name '{e.name}' must start with M_"); continue; }
                if (!Shaders.TryGetValue(e.shader ?? "", out string shaderName)) { problems.Add($"{e.name}: unknown shader '{e.shader}'"); continue; }
                Shader shader = Shader.Find(shaderName);
                if (shader == null) { problems.Add($"{e.name}: shader '{shaderName}' not found (is URP configured?)"); continue; }

                string path = $"{ArtImportPostprocessor.MaterialFolder}/{e.name}.mat";
                Material m = AssetDatabase.LoadAssetAtPath<Material>(path);
                if (m == null) { m = new Material(shader) { name = e.name }; AssetDatabase.CreateAsset(m, path); }
                m.shader = shader;
                m.shaderKeywords = Array.Empty<string>();

                m.SetColor("_BaseColor", ToColor(e.baseColor, Color.white));
                SetTexture(m, "_BaseMap", e.baseMap, problems, e.name);
                if (e.shader != "unlit")
                {
                    if (SetTexture(m, "_BumpMap", e.normalMap, problems, e.name)) m.EnableKeyword("_NORMALMAP");
                    m.SetFloat("_Smoothness", Mathf.Clamp01(e.smoothness));
                    if (e.shader == "lit")
                    {
                        m.SetFloat("_Metallic", Mathf.Clamp01(e.metallic));
                        // Mask convention: R = metallic, G = ambient occlusion, A = smoothness.
                        if (SetTexture(m, "_MetallicGlossMap", e.maskMap, problems, e.name)) m.EnableKeyword("_METALLICSPECGLOSSMAP");
                        if (SetTexture(m, "_OcclusionMap", e.maskMap, problems, e.name)) m.EnableKeyword("_OCCLUSIONMAP");
                    }
                }
                Color emission = ToColor(e.emissionColor, Color.black);
                bool emissive = emission.maxColorComponent > 0f || !string.IsNullOrEmpty(e.emissionMap);
                if (emissive && e.shader != "unlit")
                {
                    m.SetColor("_EmissionColor", emission);
                    SetTexture(m, "_EmissionMap", e.emissionMap, problems, e.name);
                    m.EnableKeyword("_EMISSION");
                    m.globalIlluminationFlags = MaterialGlobalIlluminationFlags.None;
                }

                bool transparent = e.surface == "transparent";
                m.SetFloat("_Surface", transparent ? 1f : 0f);
                m.SetFloat("_Blend", 0f);
                m.SetFloat("_SrcBlend", transparent ? (float)UnityEngine.Rendering.BlendMode.SrcAlpha : (float)UnityEngine.Rendering.BlendMode.One);
                m.SetFloat("_DstBlend", transparent ? (float)UnityEngine.Rendering.BlendMode.OneMinusSrcAlpha : (float)UnityEngine.Rendering.BlendMode.Zero);
                m.SetFloat("_ZWrite", transparent ? 0f : 1f);
                if (transparent) m.EnableKeyword("_SURFACE_TYPE_TRANSPARENT");
                m.renderQueue = transparent ? (int)UnityEngine.Rendering.RenderQueue.Transparent : -1;
                m.SetFloat("_Cull", e.doubleSided ? 0f : 2f);
                m.enableInstancing = true;
                EditorUtility.SetDirty(m);
            }
            AssetDatabase.SaveAssets();
            return problems;
        }

        static bool SetTexture(Material m, string property, string relativePath, List<string> problems, string owner)
        {
            if (string.IsNullOrEmpty(relativePath)) return false;
            string path = ArtImportPostprocessor.ArtRoot + relativePath.TrimStart('/');
            var texture = AssetDatabase.LoadAssetAtPath<Texture2D>(path);
            if (texture == null) { problems.Add($"{owner}: texture not found: {path}"); return false; }
            m.SetTexture(property, texture);
            return true;
        }

        static Color ToColor(float[] v, Color fallback)
        {
            if (v == null || v.Length < 3) return fallback;
            return new Color(v[0], v[1], v[2], v.Length > 3 ? v[3] : 1f);
        }
    }
}
