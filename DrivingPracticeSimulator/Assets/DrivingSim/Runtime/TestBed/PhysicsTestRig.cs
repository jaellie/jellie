using DrivingSim.Cameras;
using DrivingSim.Controls;
using DrivingSim.Diagnostics;
using DrivingSim.UI;
using DrivingSim.Vehicle;
using UnityEngine;

namespace DrivingSim.TestBed
{
    /// <summary>Assembles environment, vehicle, input, camera and diagnostics. Shared by the editor menu and the runtime bootstrap.</summary>
    public static class PhysicsTestRig
    {
        public static readonly Vector3 SpawnPosition = new Vector3(0f, 0.05f, 2f);

        public static VehicleController Assemble(VehiclePhysicsConfig config, IMaterialSource materials)
        {
            TestEnvironmentBuilder.Build(materials);
            EnsureLight();

            VehicleController vehicle = PrimitiveVehicleBuilder.Build(config, materials, SpawnPosition, Quaternion.identity);
            CockpitRig cockpit = CockpitBuilder.Build(vehicle, config, materials);

            var systems = new GameObject("DrivingSystems");
            KeyboardDrivingInput keyboard = systems.AddComponent<KeyboardDrivingInput>();
            VehicleInputRouter router = systems.AddComponent<VehicleInputRouter>();
            router.SetVehicle(vehicle);
            router.RegisterSource(keyboard); // AddComponent runs Awake immediately at runtime

            VehicleTestProbe probe = systems.AddComponent<VehicleTestProbe>();
            probe.SetVehicle(vehicle);
            VehicleDebugHUD hud = systems.AddComponent<VehicleDebugHUD>();
            hud.Bind(vehicle, probe);

            Camera camera = Camera.main;
            if (camera == null)
            {
                var cameraObject = new GameObject("Main Camera") { tag = "MainCamera" };
                camera = cameraObject.AddComponent<Camera>();
                cameraObject.AddComponent<AudioListener>();
            }
            camera.nearClipPlane = 0.1f;
            camera.farClipPlane = 600f;
            camera.fieldOfView = 60f;
            VehicleFollowCamera follow = camera.GetComponent<VehicleFollowCamera>();
            if (follow == null) follow = camera.gameObject.AddComponent<VehicleFollowCamera>();
            follow.SetTarget(vehicle);
            CameraController cameraController = camera.GetComponent<CameraController>();
            if (cameraController == null) cameraController = camera.gameObject.AddComponent<CameraController>();
            cameraController.Bind(vehicle, cockpit, follow);
            CameraControlsOverlay.Create(cameraController);

            vehicle.gameObject.SetActive(true);
            return vehicle;
        }

        static void EnsureLight()
        {
            foreach (Light light in Object.FindObjectsByType<Light>(FindObjectsSortMode.None))
                if (light.type == LightType.Directional) return;

            var lightObject = new GameObject("Directional Light");
            Light sun = lightObject.AddComponent<Light>();
            sun.type = LightType.Directional;
            sun.intensity = 1.1f;
            sun.shadows = LightShadows.Soft;
            lightObject.transform.rotation = Quaternion.Euler(50f, -30f, 0f);
        }
    }
}
