// Mats.cs — builds materials that work in URP (Unity 6 default) and fall back to built-in.
// NOTE: Shader.Find only works in the Editor / if the shader is in a Resources folder or the
// "Always Included Shaders" list. For standalone builds add the shaders listed below there.
using UnityEngine;

namespace BigGreenBear2
{
    public static class Mats
    {
        static Shader First(params string[] names)
        {
            foreach (var n in names) { var s = Shader.Find(n); if (s != null) return s; }
            return null;
        }

        public static Material Lit(Texture tex, Color tint)
        {
            var sh = First("Universal Render Pipeline/Simple Lit", "Universal Render Pipeline/Lit", "Standard", "Unlit/Texture");
            var m = new Material(sh);
            if (tex != null) { if (m.HasProperty("_BaseMap")) m.SetTexture("_BaseMap", tex); if (m.HasProperty("_MainTex")) m.SetTexture("_MainTex", tex); }
            if (m.HasProperty("_BaseColor")) m.SetColor("_BaseColor", tint);
            if (m.HasProperty("_Color")) m.SetColor("_Color", tint);
            if (m.HasProperty("_Smoothness")) m.SetFloat("_Smoothness", 0f);     // matte "paper-like" read, no gloss
            if (m.HasProperty("_Glossiness")) m.SetFloat("_Glossiness", 0f);
            if (m.HasProperty("_Metallic")) m.SetFloat("_Metallic", 0f);
            if (m.HasProperty("_SpecColor")) m.SetColor("_SpecColor", Color.black);
            return m;
        }

        public static Material Unlit(Color c)
        {
            var sh = First("Universal Render Pipeline/Unlit", "Unlit/Color", "Sprites/Default");
            var m = new Material(sh);
            if (m.HasProperty("_BaseColor")) m.SetColor("_BaseColor", c);
            if (m.HasProperty("_Color")) m.SetColor("_Color", c);
            return m;
        }
    }
}
