// Signature stubs for the UnityEditor APIs used by Assets/DearMe/Editor. Type-check only.
#pragma warning disable CS1591
using System;
using UnityEngine.SceneManagement;

namespace UnityEditor
{
    [AttributeUsage(AttributeTargets.Method, AllowMultiple = true)]
    public sealed class MenuItem : Attribute
    {
        public string menuItem;
        public bool validate;
        public int priority;
        public MenuItem(string itemName) { }
    }

    public class EditorBuildSettingsScene
    {
        public EditorBuildSettingsScene(string path, bool enable) { }
        public string path { get; set; }
        public bool enabled { get; set; }
    }

    public static class EditorBuildSettings { public static EditorBuildSettingsScene[] scenes { get; set; } }

    public enum WebGLCompressionFormat { Brotli, Gzip, Disabled }
    public enum WebGLExceptionSupport { None, ExplicitlyThrownExceptionsOnly, FullWithoutStacktrace, FullWithStacktrace }

    public static class PlayerSettings
    {
        public static string productName { get; set; }
        public static string companyName { get; set; }
        public static bool runInBackground { get; set; }
        public static int defaultWebScreenWidth { get; set; }
        public static int defaultWebScreenHeight { get; set; }

        public static class WebGL
        {
            public static WebGLCompressionFormat compressionFormat { get; set; }
            public static bool decompressionFallback { get; set; }
            public static bool dataCaching { get; set; }
            public static string template { get; set; }
            public static WebGLExceptionSupport exceptionSupport { get; set; }
        }
    }

    public static class AssetDatabase { public static void SaveAssets() { } }
    public static class EditorUtility { public static void RevealInFinder(string path) { } }

    public enum BuildTarget { WebGL = 20 }
    [Flags] public enum BuildOptions { None = 0 }

    public struct BuildPlayerOptions
    {
        public string[] scenes { get; set; }
        public string locationPathName { get; set; }
        public BuildTarget target { get; set; }
        public BuildOptions options { get; set; }
    }

    public static class BuildPipeline
    {
        public static Build.Reporting.BuildReport BuildPlayer(BuildPlayerOptions buildPlayerOptions) => null;
    }
}

namespace UnityEditor.Build.Reporting
{
    public enum BuildResult { Unknown, Succeeded, Failed, Cancelled }
    public struct BuildSummary
    {
        public BuildResult result => BuildResult.Unknown;
        public ulong totalSize => 0;
    }
    public sealed class BuildReport { public BuildSummary summary => default; }
}

namespace UnityEditor.SceneManagement
{
    public enum NewSceneSetup { EmptyScene, DefaultGameObjects }
    public enum NewSceneMode { Single, Additive }

    public static class EditorSceneManager
    {
        public static Scene NewScene(NewSceneSetup setup, NewSceneMode mode) => default;
        public static bool SaveScene(Scene scene, string dstScenePath) => true;
        public static Scene OpenScene(string scenePath) => default;
    }
}
