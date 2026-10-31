using System;
using System.IO;
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEngine;

namespace DrivingSim.EditorTools
{
    /// <summary>
    /// Batch-mode entry points for GameCI's unity-builder (<c>buildMethod</c> input). Each one exits
    /// the editor with 0 on success and 1 on failure so the CI step reports the real result.
    /// </summary>
    public static class CIEntryPoints
    {
        const string DefaultApkPath = "Builds/Android/DrivingPracticeSimulator.apk";

        /// <summary>Applies the project settings and (re)generates the test scene, then saves everything.</summary>
        public static void Configure()
        {
            try
            {
                ProjectConfigurator.Apply(out string report);
                Debug.Log(report);
                PhysicsTestSceneMenu.CreateScenes();
                AssetDatabase.SaveAssets();

                // unity-builder lists (and chmods) its build folder afterwards; leave a small marker there.
                string buildPath = Argument("-customBuildPath");
                if (!string.IsNullOrEmpty(buildPath))
                {
                    string directory = Path.GetDirectoryName(buildPath);
                    if (!string.IsNullOrEmpty(directory))
                    {
                        Directory.CreateDirectory(directory);
                        File.WriteAllText(Path.Combine(directory, "configure.txt"), report);
                    }
                }
                Debug.Log("[DrivingSim CI] Configure finished.");
                EditorApplication.Exit(0);
            }
            catch (Exception e)
            {
                Debug.LogException(e);
                EditorApplication.Exit(1);
            }
        }

        /// <summary>Builds a debug-signed Android APK: Main Menu (first) and Test Town.</summary>
        public static void BuildAndroid()
        {
            try
            {
                ProjectConfigurator.Apply(out string report);
                Debug.Log(report);
                if (!File.Exists(PhysicsTestSceneMenu.ScenePath) || !File.Exists(PhysicsTestSceneMenu.MainMenuScenePath))
                    PhysicsTestSceneMenu.CreateScenes();

                string path = Argument("-customBuildPath");
                if (string.IsNullOrEmpty(path)) path = DefaultApkPath;
                if (!path.EndsWith(".apk", StringComparison.OrdinalIgnoreCase)) path = Path.Combine(path, "DrivingPracticeSimulator.apk");
                string directory = Path.GetDirectoryName(path);
                if (!string.IsNullOrEmpty(directory)) Directory.CreateDirectory(directory);

                if (int.TryParse(Argument("-androidVersionCode"), out int versionCode) && versionCode > 0)
                    PlayerSettings.Android.bundleVersionCode = versionCode;
                EditorUserBuildSettings.buildAppBundle = false;

                var options = new BuildPlayerOptions
                {
                    scenes = new[] { PhysicsTestSceneMenu.MainMenuScenePath, PhysicsTestSceneMenu.ScenePath },
                    locationPathName = path,
                    target = BuildTarget.Android,
                    targetGroup = BuildTargetGroup.Android,
                    options = BuildOptions.None,
                };
                BuildReport buildReport = BuildPipeline.BuildPlayer(options);
                BuildSummary summary = buildReport.summary;
                Debug.Log($"[DrivingSim CI] Android build {summary.result}: {path}, {summary.totalSize / (1024f * 1024f):F1} MB, " +
                          $"{summary.totalErrors} errors, {summary.totalWarnings} warnings, {summary.totalTime}");
                EditorApplication.Exit(summary.result == BuildResult.Succeeded ? 0 : 1);
            }
            catch (Exception e)
            {
                Debug.LogException(e);
                EditorApplication.Exit(1);
            }
        }

        static string Argument(string name)
        {
            string[] args = Environment.GetCommandLineArgs();
            for (int i = 0; i < args.Length - 1; i++)
                if (args[i] == name) return args[i + 1];
            return null;
        }
    }
}
