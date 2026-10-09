#if UNITY_EDITOR
using System.IO;
using UnityEditor;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;

namespace BGB2.EditorTools
{
    /// <summary>Menu: BGB2 > 1 Setup Project. Configures URP 2D, imports sprites with the right settings, and fixes nine-slice borders.</summary>
    public static class BGB2ProjectSetup
    {
        const string Art = "Assets/_BGB/Art";

        [MenuItem("BGB2/1 Setup Project")]
        public static void Run()
        {
            EnsureFolders();
            ConfigureRenderPipeline();
            ImportSprites();
            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();
            Debug.Log("BGB2: project setup finished. Next: BGB2 > 2 Build Investigate Scene.");
        }

        static void EnsureFolders()
        {
            foreach (var f in new[] { "Settings", "Fonts", "Prefabs", "Materials" })
                if (!AssetDatabase.IsValidFolder("Assets/_BGB/" + f)) AssetDatabase.CreateFolder("Assets/_BGB", f);
        }

        static void ConfigureRenderPipeline()
        {
            const string rendererPath = "Assets/_BGB/Settings/BGB2_Renderer2D.asset";
            const string urpPath = "Assets/_BGB/Settings/BGB2_URP.asset";
            var renderer = AssetDatabase.LoadAssetAtPath<Renderer2DData>(rendererPath);
            if (renderer == null)
            {
                renderer = ScriptableObject.CreateInstance<Renderer2DData>();
                AssetDatabase.CreateAsset(renderer, rendererPath);
            }
            var urp = AssetDatabase.LoadAssetAtPath<UniversalRenderPipelineAsset>(urpPath);
            if (urp == null)
            {
                urp = UniversalRenderPipelineAsset.Create(renderer);
                AssetDatabase.CreateAsset(urp, urpPath);
            }
            GraphicsSettings.defaultRenderPipeline = urp;
            QualitySettings.renderPipeline = urp;
            Debug.Log("BGB2: URP 2D renderer assigned. If input does not respond in Play mode, set Edit > Project Settings > Player > Active Input Handling to 'Input System Package (New)' or 'Both'.");
        }

        static void ImportSprites()
        {
            foreach (var guid in AssetDatabase.FindAssets("t:Texture2D", new[] { Art }))
            {
                string path = AssetDatabase.GUIDToAssetPath(guid);
                var imp = AssetImporter.GetAtPath(path) as TextureImporter;
                if (imp == null) continue;
                string name = Path.GetFileNameWithoutExtension(path);
                bool background = path.Contains("/Backgrounds/");
                bool character = path.Contains("/Characters/");

                imp.textureType = TextureImporterType.Sprite;
                imp.spriteImportMode = SpriteImportMode.Single;
                imp.spritePixelsPerUnit = 100f;
                imp.mipmapEnabled = false;
                imp.filterMode = FilterMode.Bilinear;          // hand-painted art: no point filtering
                imp.alphaIsTransparency = true;
                imp.maxTextureSize = background ? 8192 : 2048;
                imp.textureCompression = background ? TextureImporterCompression.Compressed : TextureImporterCompression.CompressedHQ;

                var settings = new TextureImporterSettings();
                imp.ReadTextureSettings(settings);
                if (background) { settings.spriteAlignment = (int)SpriteAlignment.TopLeft; }
                else if (character) { settings.spriteAlignment = (int)SpriteAlignment.BottomCenter; }
                else { settings.spriteAlignment = (int)SpriteAlignment.Center; }
                settings.spriteMeshType = SpriteMeshType.FullRect;
                imp.SetTextureSettings(settings);

                // Nine-slice borders (left, bottom, right, top), in source pixels. Corners and ends stay fixed, the middle stretches.
                Vector4? border = null;
                if (name == "plaque_cream_small" || name == "plaque_red_small") border = new Vector4(26, 26, 26, 26);
                else if (name == "panel_wide_title") border = new Vector4(40, 34, 40, 34);
                else if (name == "dialogue_box_tall_portrait_ribbon") border = new Vector4(410, 26, 100, 68);
                if (border.HasValue) imp.spriteBorder = border.Value;

                imp.SaveAndReimport();
            }
        }
    }
}
#endif
