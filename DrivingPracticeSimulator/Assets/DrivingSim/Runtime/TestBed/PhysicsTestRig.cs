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

            VehicleAccessories accessories = vehicle.GetComponent<VehicleAccessories>();

            var systems = new GameObject("DrivingSystems");
            PointerInputHub pointers = systems.AddComponent<PointerInputHub>();
            KeyboardDrivingInput keyboard = systems.AddComponent<KeyboardDrivingInput>();
            FootPedalKeyboardInput footPedals = systems.AddComponent<FootPedalKeyboardInput>();
            TouchSteeringController touchSteering = systems.AddComponent<TouchSteeringController>();
            touchSteering.SetHub(pointers);
            MobilePedalController mobilePedals = systems.AddComponent<MobilePedalController>();

            VehicleInputRouter router = systems.AddComponent<VehicleInputRouter>();
            router.SetVehicle(vehicle);
            router.SetAccessories(accessories);
            // AddComponent runs Awake immediately at runtime, so register sources explicitly.
            router.RegisterSource(keyboard);
            router.RegisterSource(footPedals);
            router.RegisterSource(touchSteering);
            router.RegisterSource(mobilePedals);

            VehicleTestProbe probe = systems.AddComponent<VehicleTestProbe>();
            probe.SetVehicle(vehicle);
            VehicleDebugHUD debugHud = systems.AddComponent<VehicleDebugHUD>();
            debugHud.Bind(vehicle, probe);
            debugHud.SetVisibility(overlayVisible: false, feedbackWhileHidden: false); // F1 shows it

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

            var minimapObject = new GameObject("MinimapCamera", typeof(Camera));
            MinimapCamera minimap = minimapObject.AddComponent<MinimapCamera>();
            minimap.SetTarget(vehicle.transform);

            HudTheme theme = HudTheme.Default;
            PedalCalibrationWizard calibration = PedalCalibrationWizard.Create(footPedals, theme);
            DrivingHUDController.Create(theme, vehicle, accessories, router, footPedals, touchSteering, mobilePedals, calibration, minimap);
            CameraControlsOverlay.Create(cameraController);
            EnsureEventSystemSettings();

            vehicle.gameObject.SetActive(true);
            return vehicle;
        }

        /// <summary>Keyboard UI navigation would let a foot on Space/Enter press buttons; the HUD is pointer-only.</summary>
        static void EnsureEventSystemSettings()
        {
            var eventSystem = Object.FindFirstObjectByType<UnityEngine.EventSystems.EventSystem>();
            if (eventSystem != null) eventSystem.sendNavigationEvents = false;
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
