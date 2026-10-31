using System.Collections.Generic;
using System.Linq;
using UnityEditor;
using UnityEngine;

namespace DrivingSim.EditorTools
{
    /// <summary>
    /// Checks Codex's minimal import-test kit (ASSET_SPEC.md §8) before detailed assets are accepted:
    /// scale, forward axis, handedness, pivots, anchor positions, LODs, materials and texture settings.
    /// Menu: DrivingSim → Art → Validate Import Test. Also run by the EditMode test ArtImportTestKitTests.
    /// </summary>
    public static class ArtImportValidator
    {
        public const string KitFolder = ArtImportPostprocessor.ArtRoot + "ImportTest";
        public const string KitModel = KitFolder + "/IT_Calibration.fbx";
        const float PositionTolerance = 0.005f;
        const float AnchorTolerance = 0.001f;

        /// <summary>Anchor names and positions (Unity, root space) every vehicle asset must match. ASSET_SPEC.md §2.</summary>
        public static readonly (string name, Vector3 position)[] Anchors =
        {
            ("DriverEye", new Vector3(-0.37f, 1.22f, -0.30f)),
            ("SteeringWheelPivot", new Vector3(-0.37f, 0.90f, 0.12f)),
            ("Mirror_Rear", new Vector3(0f, 1.40f, 0.62f)),
            ("Mirror_Left", new Vector3(-1.0f, 1.02f, 0.55f)),
            ("Mirror_Right", new Vector3(1.0f, 1.02f, 0.55f)),
        };

        public static bool KitPresent => AssetDatabase.LoadAssetAtPath<GameObject>(KitModel) != null;

        [MenuItem("DrivingSim/Art/Validate Import Test", priority = 120)]
        public static void ValidateFromMenu()
        {
            List<string> problems = Validate();
            if (problems.Count == 0) Debug.Log("[DrivingSim Art] Import test PASSED.");
            else foreach (string p in problems) Debug.LogError("[DrivingSim Art] " + p);
        }

        public static List<string> Validate()
        {
            var problems = new List<string>();
            var model = AssetDatabase.LoadAssetAtPath<GameObject>(KitModel);
            if (model == null) { problems.Add($"Missing {KitModel}"); return problems; }

            var importer = (ModelImporter)AssetImporter.GetAtPath(KitModel);
            if (!Mathf.Approximately(importer.globalScale, 1f)) problems.Add($"globalScale is {importer.globalScale}, expected 1");
            if (Mathf.Abs(importer.fileScale - 1f) > 1e-3f) problems.Add($"FBX file scale is {importer.fileScale}, expected 1 (Blender: Apply Scalings = FBX All, unit scale 1.0)");
            if (!importer.bakeAxisConversion) problems.Add("bakeAxisConversion is off (postprocessor not applied?)");
            if (model.transform.localRotation != Quaternion.identity || model.transform.localScale != Vector3.one)
                problems.Add($"Root transform not clean: rotation {model.transform.localRotation.eulerAngles}, scale {model.transform.localScale}");

            CheckBox(model, "IT_Cube_1m", new Vector3(0f, 0.5f, 0f), Vector3.one, problems);
            CheckBox(model, "IT_Nose", new Vector3(0f, 0.5f, 2f), Vector3.one * 0.1f, problems, "forward axis: nose must be at +Z");
            CheckBox(model, "IT_Left", new Vector3(-1f, 0.5f, 0f), Vector3.one * 0.1f, problems, "handedness: vehicle left must be at -X");
            CheckBox(model, "IT_Up", new Vector3(0f, 2f, 0f), Vector3.one * 0.1f, problems, "up axis: +Y");

            MeshFilter cube = Find<MeshFilter>(model, "IT_Cube_1m");
            if (cube != null && cube.sharedMesh != null && cube.sharedMesh.triangles.Length / 3 != 12)
                problems.Add($"IT_Cube_1m has {cube.sharedMesh.triangles.Length / 3} triangles, expected 12");
            if (cube != null && cube.sharedMesh != null && cube.sharedMesh.uv.Length == 0) problems.Add("IT_Cube_1m has no UVs");

            foreach (var (name, position) in Anchors)
            {
                Transform t = model.GetComponentsInChildren<Transform>(true).FirstOrDefault(x => x.name == name);
                if (t == null) { problems.Add($"Anchor '{name}' missing"); continue; }
                Vector3 local = model.transform.InverseTransformPoint(t.position);
                if ((local - position).magnitude > AnchorTolerance) problems.Add($"Anchor '{name}' at {local:F3}, expected {position:F3}");
            }

            if (model.GetComponentsInChildren<Camera>(true).Length > 0) problems.Add("Model contains cameras");
            if (model.GetComponentsInChildren<Light>(true).Length > 0) problems.Add("Model contains lights");
            if (model.GetComponentsInChildren<Collider>(true).Length > 0) problems.Add("Model contains colliders (none expected in the import test)");

            LODGroup lod = model.GetComponentInChildren<LODGroup>(true);
            if (lod == null || lod.GetLODs().Length < 2) problems.Add("Expected an automatic LODGroup with 2 levels from IT_LODTest_LOD0 / IT_LODTest_LOD1");

            Renderer cubeRenderer = Find<Renderer>(model, "IT_Cube_1m");
            if (cubeRenderer != null && !cubeRenderer.sharedMaterials.Any(m => m != null && m.name == "M_IT_Checker"))
                problems.Add("IT_Cube_1m must use the material slot 'M_IT_Checker'");

            CheckTexture(KitFolder + "/T_IT_Checker_BaseMap.png", TextureImporterType.Default, true, problems);
            CheckTexture(KitFolder + "/T_IT_Checker_Normal.png", TextureImporterType.NormalMap, false, problems);
            CheckTexture(KitFolder + "/T_IT_Checker_Mask.png", TextureImporterType.Default, false, problems);
            return problems;
        }

        static T Find<T>(GameObject root, string name) where T : Component =>
            root.GetComponentsInChildren<T>(true).FirstOrDefault(c => c.name == name);

        static void CheckBox(GameObject root, string name, Vector3 center, Vector3 size, List<string> problems, string meaning = null)
        {
            MeshFilter filter = Find<MeshFilter>(root, name);
            if (filter == null || filter.sharedMesh == null) { problems.Add($"Mesh '{name}' missing"); return; }
            Bounds local = filter.sharedMesh.bounds;
            Transform t = filter.transform;
            Vector3 worldCenter = root.transform.InverseTransformPoint(t.TransformPoint(local.center));
            Vector3 worldSize = Vector3.Scale(local.size, t.lossyScale);
            worldSize = new Vector3(Mathf.Abs(worldSize.x), Mathf.Abs(worldSize.y), Mathf.Abs(worldSize.z));
            if ((worldCenter - center).magnitude > PositionTolerance)
                problems.Add($"'{name}' center {worldCenter:F3}, expected {center:F3}" + (meaning != null ? $" ({meaning})" : ""));
            // Rotated meshes swap axes in lossyScale; compare sorted extents so 90° pivot rotations don't false-fail.
            float[] a = { worldSize.x, worldSize.y, worldSize.z }, b = { size.x, size.y, size.z };
            System.Array.Sort(a); System.Array.Sort(b);
            for (int i = 0; i < 3; i++)
                if (Mathf.Abs(a[i] - b[i]) > PositionTolerance) { problems.Add($"'{name}' size {worldSize:F3}, expected {size:F3}"); break; }
        }

        static void CheckTexture(string path, TextureImporterType type, bool srgb, List<string> problems)
        {
            if (!(AssetImporter.GetAtPath(path) is TextureImporter ti)) { problems.Add($"Missing texture {path}"); return; }
            if (ti.textureType != type) problems.Add($"{path}: type {ti.textureType}, expected {type}");
            if (ti.sRGBTexture != srgb && type != TextureImporterType.NormalMap) problems.Add($"{path}: sRGB {ti.sRGBTexture}, expected {srgb}");
            if (ti.maxTextureSize > ArtImportPostprocessor.DefaultMaxTexture) problems.Add($"{path}: max size {ti.maxTextureSize}");
            TextureImporterPlatformSettings android = ti.GetPlatformTextureSettings("Android");
            if (!android.overridden || android.format != TextureImporterFormat.ASTC_6x6) problems.Add($"{path}: Android format is not ASTC 6x6");
            var tex = AssetDatabase.LoadAssetAtPath<Texture2D>(path);
            if (tex != null && (tex.width & (tex.width - 1)) != 0) problems.Add($"{path}: width {tex.width} is not a power of two");
        }
    }
}
