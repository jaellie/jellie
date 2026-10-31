using System.Collections.Generic;
using System.Linq;
using DrivingSim.TestBed;
using UnityEditor;
using UnityEngine;

namespace DrivingSim.EditorTools
{
    /// <summary>
    /// Finds Codex's vehicle art for scene generation (final assets first, then the BO_ blockout) and checks that
    /// it carries the object names the binder needs (ASSET_SPEC.md §1–2).
    /// </summary>
    public static class ArtLocator
    {
        const string Root = ArtImportPostprocessor.ArtRoot;
        static readonly string[] InteriorPaths = { Root + "Vehicle/CompactSedan/SM_Sedan_Interior.fbx", Root + "Blockout/SM_BO_Cockpit.fbx" };
        static readonly string[] ExteriorPaths = { Root + "Vehicle/CompactSedan/SM_Sedan_Exterior.fbx", Root + "Blockout/SM_BO_Sedan_Exterior.fbx" };
        static readonly string[] WheelPaths = { Root + "Vehicle/CompactSedan/SM_Sedan_Wheel.fbx", Root + "Blockout/SM_BO_Sedan_Wheel.fbx" };

        /// <summary>Names the interior must contain; alternatives separated by '|'.</summary>
        public static readonly string[] RequiredInterior =
        {
            "SteeringWheel", "Cluster_Needle_Speed|Cluster_Needle", "Cluster_Display",
            "MirrorGlass_Rear", "MirrorGlass_Left", "MirrorGlass_Right", "Interior_Wiper_L", "Interior_Wiper_R",
        };
        public static readonly string[] RequiredExterior =
        {
            "Lamp_Indicator_FL", "Lamp_Indicator_FR", "Lamp_Indicator_RL", "Lamp_Indicator_RR", "Lamp_HeadLight_L", "Lamp_HeadLight_R",
        };

        public static VehicleArtSet FindVehicleArt() => new VehicleArtSet
        {
            Interior = First(InteriorPaths),
            Exterior = First(ExteriorPaths),
            Wheel = First(WheelPaths),
        };

        static GameObject First(IEnumerable<string> paths) =>
            paths.Select(AssetDatabase.LoadAssetAtPath<GameObject>).FirstOrDefault(g => g != null);

        /// <summary>Problems with the art that is present (empty when everything binds or no art exists yet).</summary>
        public static List<string> ValidateBindings()
        {
            var problems = new List<string>();
            VehicleArtSet art = FindVehicleArt();
            Check(art.Interior, RequiredInterior, problems);
            Check(art.Exterior, RequiredExterior, problems);
            return problems;
        }

        static void Check(GameObject prefab, IEnumerable<string> required, List<string> problems)
        {
            if (prefab == null) return;
            var names = new HashSet<string>(prefab.GetComponentsInChildren<Transform>(true).Select(t => t.name));
            foreach (string need in required)
                if (!need.Split('|').Any(names.Contains)) problems.Add($"{prefab.name}: missing '{need}'");
        }

        [MenuItem("DrivingSim/Art/Validate Vehicle Bindings", priority = 121)]
        static void ValidateFromMenu()
        {
            List<string> problems = ValidateBindings();
            if (problems.Count == 0) Debug.Log("[DrivingSim Art] Vehicle bindings OK (or no vehicle art yet).");
            foreach (string p in problems) Debug.LogError("[DrivingSim Art] " + p);
        }
    }
}
