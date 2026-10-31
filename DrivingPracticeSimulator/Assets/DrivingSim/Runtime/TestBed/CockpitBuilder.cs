using DrivingSim.Cameras;
using DrivingSim.Vehicle;
using UnityEngine;
using UnityEngine.Rendering;

namespace DrivingSim.TestBed
{
    /// <summary>
    /// Adds a left-hand-drive cockpit (Korean cars: driver on the left) and three mirrors to a vehicle
    /// built by <see cref="PrimitiveVehicleBuilder"/>. Positions are vehicle-root local
    /// (origin at ground level between the axles, +Z forward). Sight lines were laid out so the
    /// gauge cluster sits above the wheel rim from the default eye point.
    /// </summary>
    public static class CockpitBuilder
    {
        public const float DriverX = -0.37f;
        public static readonly Vector3 EyeLocal = new Vector3(DriverX, 1.22f, -0.30f);

        static readonly Vector3 WheelCenter = new Vector3(DriverX, 0.90f, 0.12f);
        const float WheelTiltDeg = 22f;
        const float WheelRadius = 0.19f;

        static readonly Vector3 ClusterCenter = new Vector3(DriverX, 1.09f, 0.47f);
        const float ClusterTiltDeg = 12f;

        public static CockpitRig Build(VehicleController vehicle, VehiclePhysicsConfig config, IMaterialSource materials)
        {
            Transform root = vehicle.transform;

            Material interior = materials.Get("Interior", new Color(0.17f, 0.18f, 0.2f));
            Material dash = materials.Get("Dashboard", new Color(0.12f, 0.13f, 0.15f));
            Material trim = materials.Get("InteriorTrim", new Color(0.32f, 0.34f, 0.37f));
            Material wheelMat = materials.Get("SteeringWheel", new Color(0.08f, 0.08f, 0.09f));
            Material gaugeFace = materials.Get("GaugeFace", new Color(0.05f, 0.06f, 0.07f));
            Material tick = materials.Get("GaugeTick", new Color(0.9f, 0.92f, 0.95f));
            Material needleMat = materials.Get("GaugeNeedle", new Color(1f, 0.33f, 0.2f));
            Material accent = materials.Get("CockpitAccent", new Color(0.94f, 0.71f, 0.16f));
            Material mirrorOff = materials.Get("MirrorGlass", new Color(0.42f, 0.5f, 0.58f));
            Material mirrorHousing = materials.Get("CarBody", Palette.CarBody);

            var eye = new GameObject("DriverEye").transform;
            eye.SetParent(root, false);
            eye.localPosition = EyeLocal;

            GameObject interiorRoot = PrimitiveUtil.Group("CockpitInterior", root);
            Transform t = interiorRoot.transform;

            // Dashboard, cluster hood, sills, pillars, passenger seat.
            Box("Dashboard", t, new Vector3(0f, 0.98f, 0.70f), new Vector3(1.5f, 0.14f, 0.45f), dash);
            Box("DashTop", t, new Vector3(0f, 1.055f, 0.80f), new Vector3(1.46f, 0.01f, 0.25f), interior);
            Box("ClusterHood", t, new Vector3(DriverX, 1.18f, 0.56f), new Vector3(0.44f, 0.03f, 0.2f), dash);
            Box("CenterStack", t, new Vector3(0.02f, 0.93f, 0.48f), new Vector3(0.24f, 0.2f, 0.06f), interior);
            Box("Sill_L", t, new Vector3(-0.80f, 1.0f, -0.2f), new Vector3(0.06f, 0.08f, 2.2f), trim);
            Box("Sill_R", t, new Vector3(0.80f, 1.0f, -0.2f), new Vector3(0.06f, 0.08f, 2.2f), trim);
            Strut("APillar_L", t, new Vector3(-0.80f, 0.97f, 0.95f), new Vector3(-0.70f, 1.48f, 0.68f), 0.07f, interior);
            Strut("APillar_R", t, new Vector3(0.80f, 0.97f, 0.95f), new Vector3(0.70f, 1.48f, 0.68f), 0.07f, interior);
            Box("PassengerSeatBack", t, new Vector3(0.37f, 1.2f, -0.78f), new Vector3(0.5f, 0.48f, 0.1f), trim);
            Box("PassengerHeadrest", t, new Vector3(0.37f, 1.5f, -0.8f), new Vector3(0.26f, 0.16f, 0.09f), trim);

            Transform wheelSpin = BuildSteeringWheel(t, wheelMat, interior, accent);
            BuildCluster(t, gaugeFace, tick, needleMat, dash, out Transform needle, out TextMesh speed, out TextMesh gear, out TextMesh parkingBrake);

            MirrorCamera[] mirrors =
            {
                BuildMirror("RearviewMirror", root, new Vector3(0f, 1.40f, 0.62f), new Vector2(0.26f, 0.065f), 0.03f,
                    Quaternion.Euler(3f, 180f, 0f), 16f, 256, 72, 2, 0, mirrorOff, dash),
                BuildMirror("SideMirror_L", root, new Vector3(-1.0f, 1.02f, 0.55f), new Vector2(0.16f, 0.10f), 0.05f,
                    Quaternion.Euler(4f, 195f, 0f), 22f, 160, 112, 4, 1, mirrorOff, mirrorHousing),
                BuildMirror("SideMirror_R", root, new Vector3(1.0f, 1.02f, 0.55f), new Vector2(0.16f, 0.10f), 0.05f,
                    Quaternion.Euler(4f, 165f, 0f), 22f, 160, 112, 4, 3, mirrorOff, mirrorHousing),
            };

            foreach (Renderer renderer in interiorRoot.GetComponentsInChildren<Renderer>(true))
            {
                renderer.shadowCastingMode = ShadowCastingMode.Off;
                renderer.receiveShadows = false;
            }

            CockpitRig rig = vehicle.gameObject.AddComponent<CockpitRig>();
            rig.Configure(vehicle, eye, interiorRoot, wheelSpin, needle, speed, gear, parkingBrake, mirrors);
            return rig;
        }

        static Transform BuildSteeringWheel(Transform parent, Material wheelMat, Material columnMat, Material accent)
        {
            // Column pivot: local +Z points from the driver toward the dash, tilted down; the wheel lies in its XY plane.
            var column = new GameObject("SteeringColumn").transform;
            column.SetParent(parent, false);
            column.localPosition = WheelCenter;
            column.localRotation = Quaternion.Euler(WheelTiltDeg, 0f, 0f);
            Box("Column", column, new Vector3(0f, 0f, 0.17f), new Vector3(0.06f, 0.06f, 0.3f), columnMat);

            var spin = new GameObject("SteeringWheel").transform;
            spin.SetParent(column, false);

            const int segments = 20;
            float segmentLength = 2f * Mathf.PI * WheelRadius / segments * 1.12f;
            for (int i = 0; i < segments; i++)
            {
                float a = i * 360f / segments;
                float rad = a * Mathf.Deg2Rad;
                Box($"Rim_{i}", spin, new Vector3(Mathf.Cos(rad) * WheelRadius, Mathf.Sin(rad) * WheelRadius, 0f),
                    new Vector3(0.03f, segmentLength, 0.03f), wheelMat, Quaternion.Euler(0f, 0f, a));
            }

            PrimitiveUtil.Create(PrimitiveType.Cylinder, "Hub", spin, new Vector3(0f, 0f, 0.01f), new Vector3(0.1f, 0.02f, 0.1f),
                wheelMat, false, Quaternion.Euler(90f, 0f, 0f));
            Box("Spoke_L", spin, new Vector3(-WheelRadius * 0.5f, -0.01f, 0.005f), new Vector3(WheelRadius, 0.035f, 0.015f), wheelMat);
            Box("Spoke_R", spin, new Vector3(WheelRadius * 0.5f, -0.01f, 0.005f), new Vector3(WheelRadius, 0.035f, 0.015f), wheelMat);
            Box("Spoke_B", spin, new Vector3(0f, -WheelRadius * 0.5f, 0.005f), new Vector3(0.04f, WheelRadius, 0.015f), wheelMat);
            // Top-center marker makes the wheel's rotation (incl. multiple turns) easy to read.
            Box("CenterMark", spin, new Vector3(0f, WheelRadius, -0.004f), new Vector3(0.025f, 0.035f, 0.034f), accent);
            return spin;
        }

        static void BuildCluster(Transform parent, Material face, Material tickMat, Material needleMat, Material panelMat,
            out Transform needlePivot, out TextMesh speedText, out TextMesh gearText, out TextMesh parkingBrakeText)
        {
            // Panel faces the driver (-Z local), tilted up toward the eye.
            var panel = new GameObject("InstrumentCluster").transform;
            panel.SetParent(parent, false);
            panel.localPosition = ClusterCenter;
            panel.localRotation = Quaternion.Euler(ClusterTiltDeg, 0f, 0f);
            Box("Panel", panel, new Vector3(0f, 0f, 0.006f), new Vector3(0.40f, 0.16f, 0.01f), panelMat);

            var dialCenter = new Vector3(-0.08f, 0f, 0f);
            const float dialRadius = 0.06f;
            PrimitiveUtil.Create(PrimitiveType.Cylinder, "DialFace", panel, dialCenter + new Vector3(0f, 0f, -0.001f),
                new Vector3(dialRadius * 2f, 0.002f, dialRadius * 2f), face, false, Quaternion.Euler(90f, 0f, 0f));

            // Ticks every 20 km/h over a 240° sweep (0-180 km/h), matching CockpitRig defaults.
            for (int kmh = 0; kmh <= 180; kmh += 20)
            {
                float phi = (-120f + kmh / 180f * 240f) * Mathf.Deg2Rad;
                var position = dialCenter + new Vector3(Mathf.Sin(phi) * dialRadius * 0.82f, Mathf.Cos(phi) * dialRadius * 0.82f, -0.004f);
                Box($"Tick_{kmh}", panel, position, new Vector3(0.003f, 0.012f, 0.002f), tickMat, Quaternion.Euler(0f, 0f, -phi * Mathf.Rad2Deg));
            }

            needlePivot = new GameObject("NeedlePivot").transform;
            needlePivot.SetParent(panel, false);
            needlePivot.localPosition = dialCenter + new Vector3(0f, 0f, -0.006f);
            Box("Needle", needlePivot, new Vector3(0f, 0.022f, 0f), new Vector3(0.004f, 0.046f, 0.002f), needleMat);

            Font font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            speedText = Label("SpeedReadout", panel, new Vector3(0.08f, 0.025f, -0.004f), "0", 0.0038f, Color.white, font);
            Label("SpeedUnit", panel, new Vector3(0.08f, -0.012f, -0.004f), "km/h", 0.0013f, new Color(0.7f, 0.74f, 0.8f), font);
            gearText = Label("GearIndicator", panel, new Vector3(0.08f, -0.05f, -0.004f), "P R N D", 0.0019f, Color.white, font);
            parkingBrakeText = Label("ParkingBrakeLamp", panel, new Vector3(-0.17f, -0.06f, -0.004f), "(P)", 0.0016f, new Color(1f, 0.25f, 0.2f), font);
        }

        static MirrorCamera BuildMirror(string name, Transform root, Vector3 glassPosition, Vector2 glassSize, float housingDepth,
            Quaternion cameraRotation, float fov, int width, int height, int interval, int phase, Material inactive, Material housingMat)
        {
            var mirror = new GameObject(name).transform;
            mirror.SetParent(root, false);
            mirror.localPosition = glassPosition;
            // Quad's visible side faces -Z, so point +Z away from the driver's eye.
            mirror.localRotation = Quaternion.LookRotation(glassPosition - EyeLocal, Vector3.up);

            Box("Housing", mirror, new Vector3(0f, 0f, housingDepth * 0.5f + 0.002f),
                new Vector3(glassSize.x + 0.02f, glassSize.y + 0.02f, housingDepth), housingMat);
            GameObject glass = PrimitiveUtil.Create(PrimitiveType.Quad, "Glass", mirror, Vector3.zero,
                new Vector3(glassSize.x, glassSize.y, 1f), inactive, false);
            glass.GetComponent<Renderer>().shadowCastingMode = ShadowCastingMode.Off;

            var cameraObject = new GameObject("MirrorCamera");
            cameraObject.transform.SetParent(root, false);
            cameraObject.transform.localPosition = glassPosition + new Vector3(0f, 0f, -0.03f);
            cameraObject.transform.localRotation = cameraRotation;
            Camera cam = cameraObject.AddComponent<Camera>();
            cam.fieldOfView = fov;
            cam.nearClipPlane = 0.05f;
            cam.farClipPlane = 150f;
            cam.depth = -10f;
            cam.enabled = false;
            cameraObject.transform.SetParent(mirror, true);

            MirrorCamera component = mirror.gameObject.AddComponent<MirrorCamera>();
            component.Configure(cam, glass.GetComponent<Renderer>(), inactive, width, height, interval, phase);
            return component;
        }

        static GameObject Box(string name, Transform parent, Vector3 position, Vector3 scale, Material material, Quaternion? rotation = null) =>
            PrimitiveUtil.Create(PrimitiveType.Cube, name, parent, position, scale, material, false, rotation);

        static void Strut(string name, Transform parent, Vector3 from, Vector3 to, float thickness, Material material)
        {
            Vector3 direction = to - from;
            Box(name, parent, (from + to) * 0.5f, new Vector3(thickness, thickness, direction.magnitude), material,
                Quaternion.LookRotation(direction, Vector3.up));
        }

        static TextMesh Label(string name, Transform parent, Vector3 position, string text, float characterSize, Color color, Font font)
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent, false);
            go.transform.localPosition = position;
            var mesh = go.AddComponent<TextMesh>();
            mesh.font = font;
            mesh.fontSize = 100;
            mesh.characterSize = characterSize;
            mesh.anchor = TextAnchor.MiddleCenter;
            mesh.alignment = TextAlignment.Center;
            mesh.richText = true;
            mesh.color = color;
            mesh.text = text;
            Renderer renderer = go.GetComponent<MeshRenderer>();
            if (font != null) renderer.sharedMaterial = font.material;
            renderer.shadowCastingMode = ShadowCastingMode.Off;
            renderer.receiveShadows = false;
            return mesh;
        }
    }
}
