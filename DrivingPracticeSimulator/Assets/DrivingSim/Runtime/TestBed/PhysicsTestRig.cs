using DrivingSim.Cameras;
using DrivingSim.Controls;
using DrivingSim.Core;
using DrivingSim.Diagnostics;
using DrivingSim.Startup;
using DrivingSim.UI;
using DrivingSim.Vehicle;
using DrivingSim.World;
using UnityEngine;

namespace DrivingSim.TestBed
{
    /// <summary>Assembles environment, vehicle, input, camera and diagnostics. Shared by the editor menu and the runtime bootstrap.</summary>
    /// <summary>Which world the rig is placed in. Physics tests use the flat pad so results stay comparable.</summary>
    public enum RigEnvironment { TestGround, TestTown }

    public static class PhysicsTestRig
    {
        public static readonly Vector3 SpawnPosition = new Vector3(0f, 0.05f, 2f);

        public static VehicleController Assemble(VehiclePhysicsConfig config, IMaterialSource materials,
            RigEnvironment environment = RigEnvironment.TestGround)
        {
            Vector3 spawn = SpawnPosition;
            Quaternion spawnRotation = Quaternion.identity;
            TownLayoutData layout = environment == RigEnvironment.TestTown ? TownGreyboxBuilder.LoadLayout() : null;
            if (layout != null && layout.spawns != null && layout.spawns.Length > 0)
            {
                TownGreyboxBuilder.Build(layout, materials);
                TownSpawn s = layout.spawns[0];
                spawn = new Vector3(s.position[0], s.position[1] + 0.05f, s.position[2]);
                spawnRotation = Quaternion.Euler(0f, s.yawDeg, 0f);
            }
            else
            {
                TestEnvironmentBuilder.Build(materials);
            }
            EnsureLight();

            VehicleController vehicle = PrimitiveVehicleBuilder.Build(config, materials, spawn, spawnRotation);
            CockpitRig cockpit = CockpitBuilder.Build(vehicle, config, materials);

            VehicleAccessories accessories = vehicle.GetComponent<VehicleAccessories>();

            var systems = new GameObject("DrivingSystems");
            PointerInputHub pointers = systems.AddComponent<PointerInputHub>();
            KeyboardDrivingInput keyboard = systems.AddComponent<KeyboardDrivingInput>();
            PedalInputManager footPedals = systems.AddComponent<PedalInputManager>();
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
            camera.clearFlags = CameraClearFlags.Skybox;
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
            // First-launch gate (language, mandatory notice). Placeholder screens until the final design is assigned.
            StartupFlow startup = new GameObject("StartupFlow").AddComponent<StartupFlow>();
            PedalCalibrationWizard calibration = PedalCalibrationWizard.Create(footPedals, theme);
            // Cabin Light HUD (camera controls live in its camera popover; CameraControlsOverlay is no longer created).
            DrivingHUDController hud = DrivingHUDController.Create(theme, vehicle, accessories, router, footPedals, touchSteering,
                mobilePedals, calibration, minimap, startup, cameraController);
            if (layout != null) hud.SetGuidance(Vector3.zero); // Practice HUD: distance to the Test Town intersection
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

        /// <summary>Clear daytime sky, soft sun, ambient and fog (World.SceneAtmosphere).</summary>
        static void EnsureLight() => SceneAtmosphere.Ensure();
    }
}
