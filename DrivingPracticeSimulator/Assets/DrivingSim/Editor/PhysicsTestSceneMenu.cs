using System.IO;
using System.Linq;
using DrivingSim.Core;
using DrivingSim.Flow;
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
        /// <summary>The driving scene ("Test Town"); its name must match EnvironmentCatalog.TestTownScene.</summary>
        public const string ScenePath = Root + "/Scenes/" + EnvironmentCatalog.TestTownScene + ".unity";
        public const string MainMenuScenePath = Root + "/Scenes/" + EnvironmentCatalog.MainMenuScene + ".unity";

        [MenuItem("DrivingSim/Create Scenes (Main Menu + Test Town)", priority = 0)]
        public static void CreateScenesFromMenu()
        {
            if (!EditorSceneManager.SaveCurrentModifiedScenesIfUserWantsTo()) return;
            VehiclePhysicsConfig config = CreateScenes();
            EditorSceneManager.OpenScene(MainMenuScenePath);
            Selection.activeObject = config;
        }

        /// <summary>Generates both scenes and sets the build order: Main Menu first, then Test Town.</summary>
        public static VehiclePhysicsConfig CreateScenes()
        {
            CreateMainMenuScene();
            VehiclePhysicsConfig config = CreateScene();
            EditorBuildSettings.scenes = new[]
            {
                new EditorBuildSettingsScene(MainMenuScenePath, true),
                new EditorBuildSettingsScene(ScenePath, true),
            };
            AssetDatabase.SaveAssets();
            return config;
        }

        /// <summary>An almost empty scene: everything is built at runtime by MainMenuBootstrap.</summary>
        public static void CreateMainMenuScene()
        {
            EnsureFolder(Path.GetDirectoryName(MainMenuScenePath).Replace('\\', '/'));
            var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            new GameObject("MainMenu").AddComponent<MainMenuBootstrap>();
            EditorSceneManager.SaveScene(scene, MainMenuScenePath);
            Debug.Log($"[DrivingSim] Created {MainMenuScenePath}.");
        }

        /// <summary>Generates and saves the test scene without dialogs (menu and CI). Returns the vehicle config asset.</summary>
        public static VehiclePhysicsConfig CreateScene()
        {
            VehiclePhysicsConfig config = GetOrCreateConfig();
            EnsureFolder(MaterialFolder);
            EnsureFolder(Path.GetDirectoryName(ScenePath).Replace('\\', '/'));

            EditorSceneManager.NewScene(NewSceneSetup.DefaultGameObjects, NewSceneMode.Single);
            VehicleController vehicle = PhysicsTestRig.Assemble(config, new AssetMaterialSource(MaterialFolder), RigEnvironment.TestTown);

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
