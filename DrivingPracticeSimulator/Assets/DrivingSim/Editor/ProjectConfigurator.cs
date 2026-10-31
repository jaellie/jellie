using System.Collections.Generic;
using System.Text;
using UnityEditor;
using UnityEditor.Build;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;

namespace DrivingSim.EditorTools
{
    /// <summary>
    /// Applies the project settings the simulator needs, so nothing depends on manual clicks:
    /// input handling, Android player settings (landscape, IL2CPP, ARM64), and shaders that are only
    /// created from code at runtime. Menu: DrivingSim → Configure Project. CI calls <see cref="Apply"/>
    /// through <see cref="CIEntryPoints"/>. Safe to run repeatedly.
    /// </summary>
    public static class ProjectConfigurator
    {
        public const string CompanyName = "jaellie";
        public const string ProductName = "Driving Practice Simulator";
        public const string AndroidPackageId = "com.jaellie.drivingpractice";
        public const string BundleVersion = "0.1.0";

        /// <summary>PlayerSettings.activeInputHandler: 0 = old Input Manager, 1 = Input System, 2 = both.</summary>
        public const int ActiveInputHandlerBoth = 2;

        /// <summary>Minimum Android API level (Android 7.0). Numeric so it doesn't depend on enum member names.</summary>
        public const int MinAndroidApiLevel = 24;

        /// <summary>
        /// Shaders used only by materials created in code (mirror screens, 3D dashboard text) and so
        /// not found by the build's dependency scan. "Standard" is deliberately not listed: every world
        /// material is a saved asset, and always-including Standard compiles all its variants.
        /// </summary>
        static readonly string[] RuntimeShaders =
        {
            "Universal Render Pipeline/Unlit", "Unlit/Texture", "Unlit/Color", "GUI/Text Shader", "Sprites/Default",
        };

        public const string UrpFolder = "Assets/DrivingSim/Settings/URP";
        public const string UrpAssetPath = UrpFolder + "/DrivingSim_MobileURP.asset";
        public const string UrpRendererPath = UrpFolder + "/DrivingSim_MobileURP_Renderer.asset";

        [MenuItem("DrivingSim/Configure Project", priority = -10)]
        public static void ConfigureFromMenu()
        {
            bool restartNeeded = Apply(out string report);
            Debug.Log(report);
            if (restartNeeded)
            {
                EditorUtility.DisplayDialog("DrivingSim",
                    "Input handling was changed to \"Both\" (Input System + legacy).\nRestart Unity for it to take effect.",
                    "OK");
            }
        }

        /// <summary>Applies all settings. Returns true when the input handling changed (an editor restart is needed).</summary>
        public static bool Apply(out string report)
        {
            var log = new StringBuilder("[DrivingSim] Configure Project\n");

            PlayerSettings.companyName = CompanyName;
            PlayerSettings.productName = ProductName;
            PlayerSettings.bundleVersion = BundleVersion;
            PlayerSettings.colorSpace = ColorSpace.Linear; // PBR textures (ASSET_SPEC.md §4) assume linear lighting
            log.AppendLine($"- Company/product: {CompanyName} / {ProductName}, version {BundleVersion}");

            // Landscape only, either way up.
            PlayerSettings.defaultInterfaceOrientation = UIOrientation.AutoRotation;
            PlayerSettings.allowedAutorotateToPortrait = false;
            PlayerSettings.allowedAutorotateToPortraitUpsideDown = false;
            PlayerSettings.allowedAutorotateToLandscapeLeft = true;
            PlayerSettings.allowedAutorotateToLandscapeRight = true;
            log.AppendLine("- Orientation: landscape left/right");

            PlayerSettings.SetApplicationIdentifier(NamedBuildTarget.Android, AndroidPackageId);
            PlayerSettings.SetScriptingBackend(NamedBuildTarget.Android, ScriptingImplementation.IL2CPP);
            PlayerSettings.Android.targetArchitectures = AndroidArchitecture.ARM64;
            PlayerSettings.Android.minSdkVersion = (AndroidSdkVersions)MinAndroidApiLevel;
            log.AppendLine($"- Android: {AndroidPackageId}, IL2CPP, ARM64, min API {MinAndroidApiLevel}");

            bool inputChanged = SetActiveInputHandler(ActiveInputHandlerBoth, log);
            EnsureLayers(log);
            ConfigureUrp(log); // before shaders: the URP Unlit shader resolves only with a pipeline assigned
            AddAlwaysIncludedShaders(RuntimeShaders, log);

            AssetDatabase.SaveAssets();
            report = log.ToString();
            return inputChanged;
        }

        /// <summary>
        /// Creates (once) and assigns a mobile-oriented URP asset: no HDR, 2x MSAA, one shadow cascade
        /// over 60 m, no depth/opaque textures. Every quality level uses it. Materials made by
        /// RuntimeMaterialSource pick "Universal Render Pipeline/Lit" once the pipeline is active.
        /// </summary>
        static void ConfigureUrp(StringBuilder log)
        {
            PhysicsTestSceneMenu.EnsureFolder(UrpFolder);
            var asset = AssetDatabase.LoadAssetAtPath<UniversalRenderPipelineAsset>(UrpAssetPath);
            if (asset == null)
            {
                var renderer = AssetDatabase.LoadAssetAtPath<UniversalRendererData>(UrpRendererPath);
                if (renderer == null)
                {
                    renderer = ScriptableObject.CreateInstance<UniversalRendererData>();
                    AssetDatabase.CreateAsset(renderer, UrpRendererPath);
                }
                asset = UniversalRenderPipelineAsset.Create(renderer);
                AssetDatabase.CreateAsset(asset, UrpAssetPath);
                log.AppendLine($"- URP: created {UrpAssetPath}");
            }

            asset.supportsHDR = false;
            asset.msaaSampleCount = 2;
            asset.renderScale = 1f;
            asset.shadowDistance = 60f;
            asset.shadowCascadeCount = 1;
            asset.supportsCameraDepthTexture = false;
            asset.supportsCameraOpaqueTexture = false;
            EditorUtility.SetDirty(asset);

            GraphicsSettings.defaultRenderPipeline = asset;
            int current = QualitySettings.GetQualityLevel();
            for (int i = 0; i < QualitySettings.names.Length; i++)
            {
                QualitySettings.SetQualityLevel(i, false);
                QualitySettings.renderPipeline = asset;
            }
            QualitySettings.SetQualityLevel(current, false);
            log.AppendLine("- URP Mobile: assigned to Graphics and all quality levels (HDR off, MSAA 2x, 1 cascade, 60 m shadows)");
        }

        /// <summary>Fixed user layers (ASSET_SPEC.md §5). Index = layer number; only empty slots are filled.</summary>
        public static readonly (int index, string name)[] Layers =
        {
            (8, "Vehicle"), (9, "CockpitInterior"), (10, "Road"), (11, "Sidewalk"),
            (12, "Building"), (13, "Decoration"), (14, "Signal"),
        };

        static void EnsureLayers(StringBuilder log)
        {
            Object[] assets = AssetDatabase.LoadAllAssetsAtPath("ProjectSettings/TagManager.asset");
            if (assets == null || assets.Length == 0) { log.AppendLine("- WARNING: TagManager not found; layers unchanged"); return; }
            var serialized = new SerializedObject(assets[0]);
            SerializedProperty layers = serialized.FindProperty("layers");
            if (layers == null) { log.AppendLine("- WARNING: layers property not found"); return; }
            foreach (var (index, name) in Layers)
            {
                if (index >= layers.arraySize) continue;
                SerializedProperty slot = layers.GetArrayElementAtIndex(index);
                if (slot.stringValue == name) continue;
                if (!string.IsNullOrEmpty(slot.stringValue)) { log.AppendLine($"- WARNING: layer {index} is '{slot.stringValue}', expected '{name}'"); continue; }
                slot.stringValue = name;
                log.AppendLine($"- Layer {index}: {name}");
            }
            serialized.ApplyModifiedPropertiesWithoutUndo();
        }

        static bool SetActiveInputHandler(int value, StringBuilder log)
        {
            // No public API exists for this setting; it is a serialized field of PlayerSettings.
            Object playerSettings = Unsupported.GetSerializedAssetInterfaceSingleton("PlayerSettings");
            if (playerSettings == null)
            {
                log.AppendLine("- WARNING: PlayerSettings not found; input handling unchanged");
                return false;
            }
            var serialized = new SerializedObject(playerSettings);
            SerializedProperty property = serialized.FindProperty("activeInputHandler");
            if (property == null)
            {
                log.AppendLine("- WARNING: activeInputHandler not found; set Active Input Handling to \"Both\" manually");
                return false;
            }
            if (property.intValue == value)
            {
                log.AppendLine("- Input handling: already Both");
                return false;
            }
            int previous = property.intValue;
            property.intValue = value;
            serialized.ApplyModifiedPropertiesWithoutUndo();
            log.AppendLine($"- Input handling: {previous} -> {value} (Both). Restart the editor for it to take effect.");
            return true;
        }

        static void AddAlwaysIncludedShaders(IEnumerable<string> names, StringBuilder log)
        {
            Object graphicsSettings = GraphicsSettings.GetGraphicsSettings();
            if (graphicsSettings == null)
            {
                log.AppendLine("- WARNING: GraphicsSettings not found; shaders unchanged");
                return;
            }
            var serialized = new SerializedObject(graphicsSettings);
            SerializedProperty list = serialized.FindProperty("m_AlwaysIncludedShaders");
            if (list == null)
            {
                log.AppendLine("- WARNING: m_AlwaysIncludedShaders not found; shaders unchanged");
                return;
            }

            var present = new HashSet<Shader>();
            for (int i = 0; i < list.arraySize; i++)
                if (list.GetArrayElementAtIndex(i).objectReferenceValue is Shader existing) present.Add(existing);

            foreach (string name in names)
            {
                Shader shader = Shader.Find(name);
                if (shader == null)
                {
                    log.AppendLine($"- WARNING: shader '{name}' not found");
                    continue;
                }
                if (present.Contains(shader)) continue;
                list.InsertArrayElementAtIndex(list.arraySize);
                list.GetArrayElementAtIndex(list.arraySize - 1).objectReferenceValue = shader;
                present.Add(shader);
                log.AppendLine($"- Always included shader: {name}");
            }
            serialized.ApplyModifiedPropertiesWithoutUndo();
        }
    }
}
