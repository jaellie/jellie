using DrivingSim.UI;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;

namespace DrivingSim.EditorTools
{
    public static class PracticeMenuPreviewMenu
    {
        [MenuItem("DrivingSim/UI/Preview Automotive Menus", priority = 100)]
        public static void OpenPreview()
        {
            if (!EditorSceneManager.SaveCurrentModifiedScenesIfUserWantsTo()) return;
            // Unsaved, isolated review scene; neither the physics scene nor Build Settings are changed.
            EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            new GameObject("PracticeMenuPreview", typeof(PracticeMenuPreviewHost));
        }
    }
}
