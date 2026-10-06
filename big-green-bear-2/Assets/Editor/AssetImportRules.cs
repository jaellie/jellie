// AssetImportRules.cs — applies the right import settings to the Batch 1 art automatically.
// Runs only the FIRST time a texture is imported (so manual tweaks in the Inspector are never overwritten).
// Rules follow docs/ASSET_INVENTORY.md and the pivots in docs/asset_manifest.original.json.
#if UNITY_EDITOR
using System.Collections.Generic;
using UnityEditor;
using UnityEngine;

namespace BigGreenBear2.EditorTools
{
    public class AssetImportRules : AssetPostprocessor
    {
        // pivots that are NOT the centre (manifest: pendulum pivot at the suspension pin, weight at the hook)
        static readonly Dictionary<string, Vector2> Pivots = new Dictionary<string, Vector2>
        {
            { "prop_clock_pendulum", new Vector2(0.5f, 0.9609375f) },
            { "prop_clock_weight",   new Vector2(0.5f, 0.90234375f) },
        };

        void OnPreprocessTexture()
        {
            if (!assetPath.StartsWith("Assets/Art/")) return;
            var ti = (TextureImporter)assetImporter;
            if (!ti.importSettingsMissing) return;            // already imported once: leave the user's settings alone

            string name = System.IO.Path.GetFileNameWithoutExtension(assetPath);

            // ---- Textures: tileable overlays, NOT sprites
            if (assetPath.StartsWith("Assets/Art/Textures/"))
            {
                ti.textureType = TextureImporterType.Default;
                ti.alphaIsTransparency = true;
                ti.wrapMode = TextureWrapMode.Repeat;           // aged / archive paper are tileable
                ti.mipmapEnabled = true;
                ti.filterMode = FilterMode.Bilinear;
                ti.maxTextureSize = 2048;
                ti.textureCompression = TextureImporterCompression.CompressedHQ;
                return;
            }

            // ---- Everything else is a sprite (illustrated 2D, not pixel art)
            ti.textureType = TextureImporterType.Sprite;
            ti.spriteImportMode = SpriteImportMode.Single;
            ti.alphaIsTransparency = true;                      // never import transparent art as opaque
            ti.mipmapEnabled = false;
            ti.filterMode = FilterMode.Bilinear;
            ti.wrapMode = TextureWrapMode.Clamp;
            ti.textureCompression = TextureImporterCompression.CompressedHQ;
            ti.spritePixelsPerUnit = 100f;
            ti.maxTextureSize = name.StartsWith("frame_") || name == "stage_shadow" ? 4096 : 2048;

            var s = new TextureImporterSettings();
            ti.ReadTextureSettings(s);
            s.spriteMeshType = SpriteMeshType.FullRect;         // big soft-edged art: FullRect avoids tight-mesh artifacts
            s.spriteAlignment = (int)SpriteAlignment.Center;
            if (Pivots.TryGetValue(name, out var pivot))
            {
                s.spriteAlignment = (int)SpriteAlignment.Custom;
                s.spritePivot = pivot;
            }
            ti.SetTextureSettings(s);
        }
    }
}
#endif
