using System.IO;
using System.Linq;
using DearMe.Content;
using DearMe.Platform;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;

namespace DearMe.EditorTools
{
    /// <summary>
    /// Menu: Dear Me → Set Up Project / Validate Content / Build Web.
    /// Everything the game needs at runtime is created from code, so setup only has to make a
    /// scene for the build list and apply Web player settings.
    /// </summary>
    public static class DearMeEditorTools
    {
        const string ScenePath = "Assets/DearMe/Scenes/Main.unity";
        const string BuildFolder = "Builds/WebGL";

        [MenuItem("Dear Me/1. Set Up Project", priority = 1)]
        public static void SetUpProject()
        {
            Directory.CreateDirectory("Assets/DearMe/Scenes");
            if (!File.Exists(ScenePath))
            {
                // An empty scene is enough: GameRoot boots itself via RuntimeInitializeOnLoadMethod.
                var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
                EditorSceneManager.SaveScene(scene, ScenePath);
            }
            EditorBuildSettings.scenes = new[] { new EditorBuildSettingsScene(ScenePath, true) };

            PlayerSettings.productName = "Dear Me,";
            PlayerSettings.companyName = "Dear Me";
            PlayerSettings.runInBackground = false;
            // Portrait phone game; in a desktop browser this is the embed size (itch.io etc.).
            PlayerSettings.defaultWebScreenWidth = 540;
            PlayerSettings.defaultWebScreenHeight = 960;

            // Static hosts (GitHub Pages, many CDNs) don't send Content-Encoding headers for
            // pre-compressed files. Gzip + decompression fallback works everywhere, itch.io included.
            PlayerSettings.WebGL.compressionFormat = WebGLCompressionFormat.Gzip;
            PlayerSettings.WebGL.decompressionFallback = true;
            PlayerSettings.WebGL.dataCaching = true;
            PlayerSettings.WebGL.template = "PROJECT:DearMe";
            PlayerSettings.WebGL.exceptionSupport = WebGLExceptionSupport.ExplicitlyThrownExceptionsOnly;

            AssetDatabase.SaveAssets();
            EditorSceneManager.OpenScene(ScenePath);
            Debug.Log("[DearMe] Project set up. Press Play, or use Dear Me → Build Web.");
            ValidateContent();
        }

        [MenuItem("Dear Me/2. Validate Content", priority = 2)]
        public static void ValidateContent()
        {
            var db = ContentLoader.LoadAll();
            int problems = db.Errors.Count;
            foreach (var node in db.Nodes.Values)
            {
                foreach (var e in node.effects)
                    if (!DearMe.Story.StoryStateManager.IsValidEffect(e)) { problems++; Debug.LogError($"[DearMe] {node.id}: bad effect '{e}'"); }
                string next = db.NextOf(node);
                if (node.type != "end" && node.type != "return" && node.type != "explore" && !db.Nodes.ContainsKey(next) && node.choices.Length == 0)
                { problems++; Debug.LogError($"[DearMe] {node.id}: missing next '{next}'"); }
                foreach (var c in node.choices)
                    if (c.next.Length > 0 && !db.Nodes.ContainsKey(c.next)) { problems++; Debug.LogError($"[DearMe] {node.id}: missing choice target '{c.next}'"); }
                if (node.ko.Length > 0) problems += CheckMarkup(db, node.id, node.ko);
            }
            foreach (var d in db.Drills.Values)
                if (d.patternId.Length > 0 && !db.Patterns.ContainsKey(d.patternId)) { problems++; Debug.LogError($"[DearMe] drill {d.id}: unknown pattern"); }

            if (problems == 0)
                Debug.Log($"[DearMe] Content OK — {db.Nodes.Count} story nodes, {db.Drills.Count} drills, {db.Vocab.Count} vocabulary entries, {db.Patterns.Count} patterns. (Full validation: run Tests/DearMe.Tests with dotnet.)");
            else
                Debug.LogError($"[DearMe] Content has {problems} problem(s); see messages above.");
        }

        static int CheckMarkup(ContentDatabase db, string where, string markup)
        {
            var errors = new System.Collections.Generic.List<string>();
            var tokens = KoreanMarkup.Parse(markup, errors);
            int problems = 0;
            foreach (var e in errors) { problems++; Debug.LogError($"[DearMe] {where}: {e}"); }
            foreach (var t in tokens)
            {
                if (t.vocabId.Length > 0 && !db.Vocab.ContainsKey(t.vocabId)) { problems++; Debug.LogError($"[DearMe] {where}: unknown vocab @{t.vocabId}"); }
                if (t.patternId.Length > 0 && !db.Patterns.ContainsKey(t.patternId)) { problems++; Debug.LogError($"[DearMe] {where}: unknown pattern #{t.patternId}"); }
            }
            return problems;
        }

        [MenuItem("Dear Me/3. Build Web", priority = 3)]
        public static void BuildWeb()
        {
            if (!EditorBuildSettings.scenes.Any(s => s.enabled)) SetUpProject();
            var options = new BuildPlayerOptions
            {
                scenes = EditorBuildSettings.scenes.Where(s => s.enabled).Select(s => s.path).ToArray(),
                locationPathName = BuildFolder,
                target = BuildTarget.WebGL,
                options = BuildOptions.None,
            };
            var report = BuildPipeline.BuildPlayer(options);
            if (report.summary.result == UnityEditor.Build.Reporting.BuildResult.Succeeded)
            {
                Debug.Log($"[DearMe] Web build ready in {BuildFolder} ({report.summary.totalSize / (1024 * 1024)} MB). " +
                          "Upload the folder's contents to a static host and open the URL — don't open index.html from disk.");
                EditorUtility.RevealInFinder(BuildFolder);
            }
            else Debug.LogError("[DearMe] Web build failed: " + report.summary.result);
        }

        [MenuItem("Dear Me/Delete Saved Progress (PlayerPrefs)", priority = 20)]
        public static void DeleteSave()
        {
            PlayerPrefs.DeleteKey(DearMe.Save.SaveService.PrimaryKey);
            PlayerPrefs.DeleteKey(DearMe.Save.SaveService.BackupKey);
            PlayerPrefs.Save();
            Debug.Log("[DearMe] Saved progress deleted.");
        }
    }
}
