using DrivingSim.Vehicle;
using UnityEngine;

namespace DrivingSim.TestBed
{
    /// <summary>
    /// Drop on an empty GameObject in any scene to build the physics test rig at runtime.
    /// Does nothing if the scene already contains a vehicle (e.g. the generated PhysicsTest scene).
    /// </summary>
    public class PhysicsTestBootstrap : MonoBehaviour
    {
        [Tooltip("Optional. If empty, a config with default values is created in memory.")]
        [SerializeField] VehiclePhysicsConfig config;
        [SerializeField] RigEnvironment environment = RigEnvironment.TestTown;

        void Awake()
        {
            if (FindFirstObjectByType<VehicleController>() != null) return;
            if (config == null)
            {
                config = ScriptableObject.CreateInstance<VehiclePhysicsConfig>();
                config.name = "VehiclePhysicsConfig (runtime defaults)";
            }
            PhysicsTestRig.Assemble(config, new RuntimeMaterialSource(), environment);
        }
    }
}
