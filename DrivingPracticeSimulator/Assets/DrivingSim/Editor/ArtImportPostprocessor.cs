using System;
using System.IO;
using UnityEditor;
using UnityEngine;

namespace DrivingSim.EditorTools
{
    /// <summary>
    /// Enforces the import settings of ASSET_SPEC.md for everything under Assets/DrivingSim/Art/, so Codex's
    /// Blender exports import the same way on every machine and in CI. Nothing outside that folder is touched.
    /// </summary>
    public class ArtImportPostprocessor : AssetPostprocessor
    {
        public const string ArtRoot = "Assets/DrivingSim/Art/";
        public const string MaterialFolder = ArtRoot + "Materials";
        public const int DefaultMaxTexture = 1024;
        public const int CockpitMaxTexture = 2048;

        public static bool IsArt(string path) =>
            !string.IsNullOrEmpty(path) && path.Replace('\\', '/').StartsWith(ArtRoot, StringComparison.OrdinalIgnoreCase);

        void OnPreprocessModel()
        {
            if (!IsArt(assetPath)) return;
            var model = (ModelImporter)assetImporter;
            model.globalScale = 1f;
            model.useFileScale = true;
            model.bakeAxisConversion = true;       // Blender -Y forward / Z up -> Unity +Z forward / Y up, no root rotation
            model.importCameras = false;
            model.importLights = false;
            model.importVisibility = false;
            model.importBlendShapes = false;
            model.animationType = ModelImporterAnimationType.None;
            model.importAnimation = false;
            model.addCollider = false;             // colliders come from *_COL meshes or gameplay, never auto-generated
            model.isReadable = false;
            model.meshCompression = ModelImporterMeshCompression.Off;
            model.importNormals = ModelImporterNormals.Import;
            model.importTangents = ModelImporterTangents.CalculateMikk;
            model.materialImportMode = ModelImporterMaterialImportMode.ImportStandard; // keep slot names for remapping
            model.materialLocation = ModelImporterMaterialLocation.InPrefab;
        }

        /// <summary>Object-name prefixes → layers (ASSET_SPEC.md §5). First match wins.</summary>
        static readonly (string prefix, string layer)[] LayerByPrefix =
        {
            ("Interior_", "CockpitInterior"), ("SteeringWheel", "CockpitInterior"), ("Cluster", "CockpitInterior"),
            ("Body_", "Vehicle"), ("Glass_", "Vehicle"), ("Wheel_", "Vehicle"), ("Lamp_", "Vehicle"),
            ("Road_", "Road"), ("Marking_", "Road"), ("Sidewalk_", "Sidewalk"), ("Curb_", "Sidewalk"),
            ("Bldg_", "Building"), ("Prop_", "Decoration"), ("Tree_", "Decoration"), ("Signal_", "Signal"),
        };

        void OnPostprocessModel(GameObject root)
        {
            if (!IsArt(assetPath)) return;
            foreach (Transform t in root.GetComponentsInChildren<Transform>(true))
            {
                // Collision proxies: "<Name>_COL" meshes become invisible MeshColliders.
                if (t.name.EndsWith("_COL", StringComparison.Ordinal) && t.TryGetComponent(out MeshFilter filter))
                {
                    var collider = t.gameObject.AddComponent<MeshCollider>();
                    collider.sharedMesh = filter.sharedMesh;
                    if (t.TryGetComponent(out MeshRenderer renderer)) UnityEngine.Object.DestroyImmediate(renderer);
                }
                foreach (var (prefix, layer) in LayerByPrefix)
                {
                    if (!t.name.StartsWith(prefix, StringComparison.Ordinal)) continue;
                    int index = LayerMask.NameToLayer(layer);
                    if (index >= 0) foreach (Transform child in t.GetComponentsInChildren<Transform>(true)) child.gameObject.layer = index;
                    break;
                }
            }
        }

        void OnPreprocessTexture()
        {
            if (!IsArt(assetPath)) return;
            var texture = (TextureImporter)assetImporter;
            string file = Path.GetFileNameWithoutExtension(assetPath);
            bool normal = file.EndsWith("_Normal", StringComparison.Ordinal);
            bool linear = normal || file.EndsWith("_Mask", StringComparison.Ordinal);
            texture.textureType = normal ? TextureImporterType.NormalMap : TextureImporterType.Default;
            texture.sRGBTexture = !linear;
            texture.mipmapEnabled = true;
            texture.isReadable = false;
            texture.wrapMode = TextureWrapMode.Repeat;
            int max = file.StartsWith("T_Cockpit", StringComparison.Ordinal) ? CockpitMaxTexture : DefaultMaxTexture;
            texture.maxTextureSize = max;

            TextureImporterPlatformSettings android = texture.GetPlatformTextureSettings("Android");
            android.overridden = true;
            android.maxTextureSize = max;
            android.format = TextureImporterFormat.ASTC_6x6;
            texture.SetPlatformTextureSettings(android);
        }

        /// <summary>Points every Art model's material slots at Art/Materials/&lt;slot name&gt;.mat (built from materials.json).</summary>
        [MenuItem("DrivingSim/Art/Remap Model Materials", priority = 110)]
        public static void RemapAllModelMaterials()
        {
            int count = 0;
            foreach (string guid in AssetDatabase.FindAssets("t:Model", new[] { ArtRoot.TrimEnd('/') }))
            {
                string path = AssetDatabase.GUIDToAssetPath(guid);
                if (AssetImporter.GetAtPath(path) is ModelImporter model)
                {
                    model.SearchAndRemapMaterials(ModelImporterMaterialName.BasedOnMaterialName, ModelImporterMaterialSearch.Everywhere);
                    model.SaveAndReimport();
                    count++;
                }
            }
            Debug.Log($"[DrivingSim Art] Remapped materials on {count} model(s).");
        }
    }
}
