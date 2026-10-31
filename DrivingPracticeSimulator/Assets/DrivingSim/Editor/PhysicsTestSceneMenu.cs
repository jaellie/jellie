using System.IO;
using System.Linq;
using DrivingSim.TestBed;
using DrivingSim.Vehicle;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;

namespace DrivingSim.EditorTools
{
    public static class PhysicsTestSceneMenu
    {
        const string Root = "Assets/DrivingSim";
        const string ConfigPath = Root + "/Settings/CompactSedan_PhysicsConfig.asset";
        const string MaterialFolder = Root + "/Generated/Materials";
        public const string ScenePath = Root + "/Scenes/PhysicsTest.unity";

        [MenuItem("DrivingSim/Create Physics Test Scene", priority = 0)]
        public static void CreatePhysicsTestScene()
        {
            if (!EditorSceneManager.SaveCurrentModifiedScenesIfUserWantsTo()) return;
            VehiclePhysicsConfig config = CreateScene();
            Selection.activeObject = config;
        }

        /// <summary>Generates and saves the test scene without dialogs (menu and CI). Returns the vehicle config asset.</summary>
        public static VehiclePhysicsConfig CreateScene()
        {
            VehiclePhysicsConfig config = GetOrCreateConfig();
            EnsureFolder(MaterialFolder);
            EnsureFolder(Path.GetDirectoryName(ScenePath).Replace('\\', '/'));

            EditorSceneManager.NewScene(NewSceneSetup.DefaultGameObjects, NewSceneMode.Single);
            VehicleController vehicle = PhysicsTestRig.Assemble(config, new AssetMaterialSource(MaterialFolder));

            EditorSceneManager.SaveScene(vehicle.gameObject.scene, ScenePath);
            AddToBuildSettings(ScenePath);
            AssetDatabase.SaveAssets();
            Debug.Log($"[DrivingSim] Created {ScenePath}. Press Play and drive with the keyboard. Vehicle parameters: {ConfigPath}");
            return config;
        }

        [MenuItem("DrivingSim/Select Vehicle Physics Config", priority = 20)]
        public static void SelectConfig()
        {
            Selection.activeObject = GetOrCreateConfig();
            EditorGUIUtility.PingObject(Selection.activeObject);
        }

        static VehiclePhysicsConfig GetOrCreateConfig()
        {
            var config = AssetDatabase.LoadAssetAtPath<VehiclePhysicsConfig>(ConfigPath);
            if (config != null) return config;

            EnsureFolder(Path.GetDirectoryName(ConfigPath).Replace('\\', '/'));
            config = ScriptableObject.CreateInstance<VehiclePhysicsConfig>();
            AssetDatabase.CreateAsset(config, ConfigPath);
            AssetDatabase.SaveAssets();
            return config;
        }

        static void AddToBuildSettings(string scenePath)
        {
            var scenes = EditorBuildSettings.scenes.ToList();
            if (scenes.Any(s => s.path == scenePath)) return;
            scenes.Insert(0, new EditorBuildSettingsScene(scenePath, true));
            EditorBuildSettings.scenes = scenes.ToArray();
        }

        internal static void EnsureFolder(string path)
        {
            if (AssetDatabase.IsValidFolder(path)) return;
            string parent = Path.GetDirectoryName(path).Replace('\\', '/');
            EnsureFolder(parent);
            AssetDatabase.CreateFolder(parent, Path.GetFileName(path));
        }

        /// <summary>Saves materials as assets so they persist in the saved scene.</summary>
        sealed class AssetMaterialSource : IMaterialSource
        {
            readonly string folder;

            public AssetMaterialSource(string folder) => this.folder = folder;

            public Material Get(string key, Color color)
            {
                string path = $"{folder}/{key}.mat";
                var material = AssetDatabase.LoadAssetAtPath<Material>(path);
                if (material == null)
                {
                    material = RuntimeMaterialSource.CreateMaterial(key, color);
                    AssetDatabase.CreateAsset(material, path);
                }
                else
                {
                    Shader shader = RuntimeMaterialSource.FindLitShader();
                    if (material.shader != shader) material.shader = shader;
                    RuntimeMaterialSource.ApplyColor(material, color);
                    EditorUtility.SetDirty(material);
                }
                return material;
            }
        }
    }
}
