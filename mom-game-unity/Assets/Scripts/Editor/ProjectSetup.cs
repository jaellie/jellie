#if UNITY_EDITOR
using System.Linq;
using UnityEditor;
using UnityEngine;
using UnityEngine.Rendering;

// Runs once when the project opens: linear colour, product name, and makes sure the shaders that are
// only created from code (Shader.Find) get included in builds.
[InitializeOnLoad]
public static class ProjectSetup
{
    static ProjectSetup()
    {
        PlayerSettings.productName = "엄마의 모험";
        PlayerSettings.colorSpace = ColorSpace.Linear;
        PlayerSettings.defaultIsNativeResolution = true;
        var gm = AssetDatabase.LoadAssetAtPath<Object>("ProjectSettings/GraphicsSettings.asset");
        if (gm == null) return;
        var so = new SerializedObject(gm);
        var arr = so.FindProperty("m_AlwaysIncludedShaders");
        string[] names = { "Standard", "Skybox/Procedural", "Legacy Shaders/Particles/Additive", "Legacy Shaders/Diffuse", "Hidden/Internal-Colored" };
        foreach (var n in names)
        {
            var sh = Shader.Find(n); if (sh == null) continue;
            bool has = false;
            for (int i = 0; i < arr.arraySize; i++) if (arr.GetArrayElementAtIndex(i).objectReferenceValue == sh) has = true;
            if (has) continue;
            arr.InsertArrayElementAtIndex(arr.arraySize);
            arr.GetArrayElementAtIndex(arr.arraySize - 1).objectReferenceValue = sh;
        }
        so.ApplyModifiedProperties();
    }

    // Kenney's OBJ models: make sure Unity imports them with their mtl materials and a sane scale.
    [MenuItem("Mom/Reimport Kenney models")]
    static void Reimport() { AssetDatabase.ImportAsset("Assets/Resources/Kenney", ImportAssetOptions.ImportRecursive | ImportAssetOptions.ForceUpdate); }
}
#endif
