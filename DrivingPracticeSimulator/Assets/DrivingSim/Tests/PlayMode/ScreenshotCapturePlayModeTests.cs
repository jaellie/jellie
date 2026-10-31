using System.Collections;
using System.Collections.Generic;
using System.IO;
using DrivingSim.Cameras;
using DrivingSim.Controls;
using DrivingSim.Startup;
using DrivingSim.TestBed;
using DrivingSim.Vehicle;
using NUnit.Framework;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.SceneManagement;
using UnityEngine.TestTools;

namespace DrivingSim.Tests
{
    /// <summary>
    /// Renders the generated test scene from the cockpit and chase cameras and saves PNGs to
    /// &lt;project&gt;/TestScreenshots (uploaded by CI). Evidence for review, not an image comparison.
    /// Ignored when the editor runs without a graphics device.
    /// </summary>
    public class ScreenshotCapturePlayModeTests
    {
        const int Width = 1600, Height = 720; // 20:9 phone landscape
        readonly List<GameObject> created = new List<GameObject>();

        public static string OutputFolder => Path.GetFullPath(Path.Combine(Application.dataPath, "..", "TestScreenshots"));

        [UnitySetUp]
        public IEnumerator SetUp()
        {
            LogAssert.ignoreFailingMessages = true;
            PlayerPrefs.SetInt("DrivingSim.PedalWizardDone", 1);
            StartupFlow.SuppressForAutomatedTests = true;
            var before = new HashSet<GameObject>(SceneManager.GetActiveScene().GetRootGameObjects());
            PhysicsTestRig.Assemble(ScriptableObject.CreateInstance<VehiclePhysicsConfig>(), new RuntimeMaterialSource(), RigEnvironment.TestTown);
            foreach (GameObject root in SceneManager.GetActiveScene().GetRootGameObjects())
                if (!before.Contains(root)) created.Add(root);
            for (int i = 0; i < 60; i++) yield return new WaitForFixedUpdate();
            yield return null;
        }

        [UnityTearDown]
        public IEnumerator TearDown()
        {
            foreach (GameObject go in created) if (go != null) Object.Destroy(go);
            created.Clear();
            DrivingInputGate.ResetAll();
            StartupFlow.SuppressForAutomatedTests = false;
            yield return null;
        }

        [UnityTest]
        public IEnumerator Capture_CockpitAndChaseViews()
        {
            if (SystemInfo.graphicsDeviceType == GraphicsDeviceType.Null)
                Assert.Ignore("No graphics device (-nographics); screenshots skipped.");

            var controller = Object.FindFirstObjectByType<CameraController>();
            Assert.IsNotNull(controller, "camera controller");
            Camera camera = controller.GetComponent<Camera>();
            Directory.CreateDirectory(OutputFolder);

            controller.SetMode(CameraViewMode.Cockpit);
            for (int i = 0; i < 5; i++) yield return null;
            yield return new WaitForEndOfFrame();
            string cockpit = Save(camera, "01_cockpit_first_person.png");

            controller.SetMode(CameraViewMode.Chase);
            for (int i = 0; i < 30; i++) yield return null; // let the follow camera settle
            yield return new WaitForEndOfFrame();
            string chase = Save(camera, "02_chase_view.png");

            Assert.IsTrue(File.Exists(cockpit) && new FileInfo(cockpit).Length > 1000, "cockpit screenshot written");
            Assert.IsTrue(File.Exists(chase) && new FileInfo(chase).Length > 1000, "chase screenshot written");
        }

        /// <summary>Renders the camera (3D world only; the overlay HUD is not part of a camera render) into a PNG.</summary>
        static string Save(Camera camera, string fileName)
        {
            var target = new RenderTexture(Width, Height, 24);
            RenderTexture previousTarget = camera.targetTexture;
            RenderTexture previousActive = RenderTexture.active;
            var image = new Texture2D(Width, Height, TextureFormat.RGB24, false);
            try
            {
                camera.targetTexture = target;
                camera.aspect = (float)Width / Height;
                camera.Render();
                RenderTexture.active = target;
                image.ReadPixels(new Rect(0, 0, Width, Height), 0, 0);
                image.Apply();
                string path = Path.Combine(OutputFolder, fileName);
                File.WriteAllBytes(path, image.EncodeToPNG());
                Debug.Log($"[Screenshot] {path}");
                return path;
            }
            finally
            {
                camera.targetTexture = previousTarget;
                camera.ResetAspect();
                RenderTexture.active = previousActive;
                Object.Destroy(image);
                target.Release();
                Object.Destroy(target);
            }
        }
    }
}
