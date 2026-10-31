using UnityEngine;

namespace DrivingSim.TestBed
{
    /// <summary>
    /// Builds the Milestone 1 physics test ground from primitives. The vehicle spawns at the
    /// origin facing +Z on a straight lane with distance markers every 5 m.
    /// </summary>
    public static class TestEnvironmentBuilder
    {
        public const float GroundSize = 300f;

        public static GameObject Build(IMaterialSource materials)
        {
            GameObject root = new GameObject("TestGround");
            Transform t = root.transform;

            Material asphalt = materials.Get("Asphalt", Palette.Asphalt);
            Material white = materials.Get("LineWhite", Palette.LineWhite);
            Material yellow = materials.Get("LineYellow", Palette.LineYellow);
            Material grid = materials.Get("GridLine", Palette.GridLine);

            // Ground: a thick box so nothing tunnels through; top surface at y = 0.
            PrimitiveUtil.Create(PrimitiveType.Cube, "Ground", t, new Vector3(0f, -0.5f, 0f),
                new Vector3(GroundSize, 1f, GroundSize), asphalt, true);

            BuildGrid(t, grid);
            BuildStraightLane(t, white, yellow);
            BuildParkingBays(t, white, materials);
            BuildTurningCircle(t, materials);
            BuildRamp(t, materials, yellow);
            BuildObstacles(t, materials);
            BuildPerimeter(t, materials);
            return root;
        }

        static void BuildGrid(Transform parent, Material material)
        {
            Transform g = PrimitiveUtil.Group("Grid_10m", parent).transform;
            float half = GroundSize * 0.5f - 10f;
            for (float p = -half; p <= half; p += 10f)
            {
                PrimitiveUtil.Marking("GridX", g, new Vector3(p, -0.003f, 0f), 0.06f, half * 2f, material);
                PrimitiveUtil.Marking("GridZ", g, new Vector3(0f, -0.003f, p), half * 2f, 0.06f, material);
            }
        }

        /// <summary>3.5 m lane from z = -10 to z = 130 with a start line at z = 0 and markers every 5 m.</summary>
        static void BuildStraightLane(Transform parent, Material white, Material yellow)
        {
            Transform lane = PrimitiveUtil.Group("StraightLane", parent).transform;
            const float halfWidth = 1.75f, start = -10f, end = 130f;
            float length = end - start, center = (start + end) * 0.5f;

            PrimitiveUtil.Marking("EdgeLeft", lane, new Vector3(-halfWidth, 0f, center), 0.15f, length, white);
            PrimitiveUtil.Marking("EdgeRight", lane, new Vector3(halfWidth, 0f, center), 0.15f, length, white);
            PrimitiveUtil.Marking("StartLine", lane, new Vector3(0f, 0f, 0f), halfWidth * 2f, 0.3f, yellow);

            Font font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            for (int d = 5; d <= 120; d += 5)
            {
                bool major = d % 10 == 0;
                PrimitiveUtil.Marking($"Mark_{d}m", lane, new Vector3(0f, 0f, d), major ? halfWidth * 2f : 1f, 0.1f, white);
                if (major && font != null) CreateLabel($"{d} m", lane, new Vector3(halfWidth + 1.2f, 0.02f, d), font);
            }
        }

        static void CreateLabel(string label, Transform parent, Vector3 position, Font font)
        {
            var go = new GameObject($"Label_{label}");
            go.transform.SetParent(parent, false);
            go.transform.localPosition = position;
            go.transform.localRotation = Quaternion.Euler(90f, 0f, 0f);
            var text = go.AddComponent<TextMesh>();
            text.text = label;
            text.font = font;
            text.fontSize = 48;
            text.characterSize = 0.08f;
            text.anchor = TextAnchor.MiddleCenter;
            text.color = Palette.LineWhite;
            go.GetComponent<MeshRenderer>().sharedMaterial = font.material;
        }

        /// <summary>Six 2.5 m x 5.0 m bays west of the lane, entrances facing +X, with curb stops and cones.</summary>
        static void BuildParkingBays(Transform parent, Material white, IMaterialSource materials)
        {
            Transform lot = PrimitiveUtil.Group("ParkingBays", parent).transform;
            Material curb = materials.Get("Curb", Palette.Curb);
            Material cone = materials.Get("Cone", Palette.Cone);

            const float bayWidth = 2.5f, bayDepth = 5f, entranceX = -12f, firstZ = 10f;
            const int bays = 6;
            float backX = entranceX - bayDepth;

            for (int i = 0; i <= bays; i++)
            {
                float z = firstZ + i * bayWidth;
                PrimitiveUtil.Marking($"BayLine_{i}", lot, new Vector3(entranceX - bayDepth * 0.5f, 0f, z), bayDepth, 0.12f, white);
            }
            float rowLength = bays * bayWidth;
            PrimitiveUtil.Marking("BayBackLine", lot, new Vector3(backX, 0f, firstZ + rowLength * 0.5f), 0.12f, rowLength, white);

            for (int i = 0; i < bays; i++)
            {
                float z = firstZ + (i + 0.5f) * bayWidth;
                PrimitiveUtil.Create(PrimitiveType.Cube, $"WheelStop_{i}", lot, new Vector3(backX + 0.7f, 0.06f, z),
                    new Vector3(0.15f, 0.12f, 1.6f), curb, true);
            }

            // Curb behind the row.
            PrimitiveUtil.Create(PrimitiveType.Cube, "BackCurb", lot, new Vector3(backX - 0.4f, 0.075f, firstZ + rowLength * 0.5f),
                new Vector3(0.3f, 0.15f, rowLength + 2f), curb, true);

            PlaceCone(lot, cone, new Vector3(entranceX + 0.3f, 0f, firstZ - 0.3f));
            PlaceCone(lot, cone, new Vector3(entranceX + 0.3f, 0f, firstZ + rowLength + 0.3f));
        }

        /// <summary>Cone ring of 6 m radius plus painted 5 m / 6 m circles for turning-radius checks.</summary>
        static void BuildTurningCircle(Transform parent, IMaterialSource materials)
        {
            Transform pad = PrimitiveUtil.Group("TurningCircle", parent).transform;
            pad.localPosition = new Vector3(35f, 0f, 40f);
            Material cone = materials.Get("Cone", Palette.Cone);
            Material white = materials.Get("LineWhite", Palette.LineWhite);
            Material yellow = materials.Get("LineYellow", Palette.LineYellow);

            PaintCircle(pad, 5f, white, 48);
            PaintCircle(pad, 6f, yellow, 56);
            PrimitiveUtil.Marking("Center", pad, Vector3.zero, 0.4f, 0.4f, yellow);
            for (int i = 0; i < 12; i++)
            {
                float a = i * Mathf.PI * 2f / 12f;
                PlaceCone(pad, cone, new Vector3(Mathf.Cos(a) * 7.5f, 0f, Mathf.Sin(a) * 7.5f));
            }
        }

        static void PaintCircle(Transform parent, float radius, Material material, int segments)
        {
            float segmentLength = 2f * Mathf.PI * radius / segments * 0.6f;
            for (int i = 0; i < segments; i++)
            {
                float a = i * Mathf.PI * 2f / segments;
                var position = new Vector3(Mathf.Cos(a) * radius, 0f, Mathf.Sin(a) * radius);
                float yaw = -a * Mathf.Rad2Deg;
                PrimitiveUtil.Marking($"R{radius}_{i}", parent, position, 0.1f, segmentLength, material, yaw);
            }
        }

        /// <summary>6% ramp with a raised platform for P / parking-brake hold tests.</summary>
        static void BuildRamp(Transform parent, IMaterialSource materials, Material stripe)
        {
            Transform ramp = PrimitiveUtil.Group("Ramp_6pct", parent).transform;
            ramp.localPosition = new Vector3(-35f, 0f, 50f);
            Material surface = materials.Get("Ramp", Palette.Ramp);

            const float width = 6f, length = 20f, thickness = 1f, platformLength = 12f;
            float angle = Mathf.Atan(0.06f) * Mathf.Rad2Deg;
            Quaternion tilt = Quaternion.Euler(-angle, 0f, 0f);
            Vector3 slopeDir = tilt * Vector3.forward;
            Vector3 slopeUp = tilt * Vector3.up;

            Vector3 topCenter = slopeDir * (length * 0.5f);
            PrimitiveUtil.Create(PrimitiveType.Cube, "Slope", ramp, topCenter - slopeUp * (thickness * 0.5f),
                new Vector3(width, thickness, length), surface, true, tilt);

            Vector3 top = slopeDir * length;
            PrimitiveUtil.Create(PrimitiveType.Cube, "Platform", ramp,
                new Vector3(0f, top.y - thickness * 0.5f, top.z + platformLength * 0.5f),
                new Vector3(width, thickness, platformLength), surface, true);

            PrimitiveUtil.Create(PrimitiveType.Cube, "PlatformStripe", ramp,
                new Vector3(0f, top.y + 0.006f, top.z + 0.2f), new Vector3(width, 0.01f, 0.3f), stripe, false);
        }

        static void BuildObstacles(Transform parent, IMaterialSource materials)
        {
            Transform group = PrimitiveUtil.Group("Obstacles", parent).transform;
            Material obstacle = materials.Get("Obstacle", Palette.Obstacle);
            Material cone = materials.Get("Cone", Palette.Cone);

            // Static wall at the end of the lane for collision checks.
            PrimitiveUtil.Create(PrimitiveType.Cube, "EndWall", group, new Vector3(0f, 0.75f, 140f), new Vector3(8f, 1.5f, 0.5f), obstacle, true);
            // Box east of the spawn for low-speed bumping.
            PrimitiveUtil.Create(PrimitiveType.Cube, "Block", group, new Vector3(8f, 0.5f, 15f), new Vector3(2f, 1f, 2f), obstacle, true);

            // Slalom cones east of the lane.
            for (int i = 0; i < 6; i++) PlaceCone(group, cone, new Vector3(12f, 0f, 30f + i * 12f));
        }

        static void BuildPerimeter(Transform parent, IMaterialSource materials)
        {
            Transform group = PrimitiveUtil.Group("Buildings", parent).transform;
            Material building = materials.Get("Building", Palette.Building);
            float edge = GroundSize * 0.5f - 15f;
            var rng = new System.Random(7);
            for (int i = 0; i < 16; i++)
            {
                float along = -edge + i * (edge * 2f / 15f);
                float h = 6f + (float)rng.NextDouble() * 14f;
                PrimitiveUtil.Create(PrimitiveType.Cube, $"Building_N{i}", group, new Vector3(along, h * 0.5f, edge), new Vector3(12f, h, 10f), building, true);
                h = 6f + (float)rng.NextDouble() * 14f;
                PrimitiveUtil.Create(PrimitiveType.Cube, $"Building_S{i}", group, new Vector3(along, h * 0.5f, -edge), new Vector3(12f, h, 10f), building, true);
                h = 6f + (float)rng.NextDouble() * 14f;
                PrimitiveUtil.Create(PrimitiveType.Cube, $"Building_E{i}", group, new Vector3(edge, h * 0.5f, along), new Vector3(10f, h, 12f), building, true);
                h = 6f + (float)rng.NextDouble() * 14f;
                PrimitiveUtil.Create(PrimitiveType.Cube, $"Building_W{i}", group, new Vector3(-edge, h * 0.5f, along), new Vector3(10f, h, 12f), building, true);
            }
        }

        static void PlaceCone(Transform parent, Material material, Vector3 groundPosition)
        {
            GameObject cone = PrimitiveUtil.Create(PrimitiveType.Cylinder, "Cone", parent,
                groundPosition + new Vector3(0f, 0.35f, 0f), new Vector3(0.3f, 0.35f, 0.3f), material, true);
            Rigidbody body = cone.AddComponent<Rigidbody>();
            body.mass = 2f;
            body.linearDamping = 0.2f;
            body.angularDamping = 0.5f;
        }
    }
}
