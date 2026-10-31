using System.Collections.Generic;
using DrivingSim.Core;
using DrivingSim.World;
using UnityEngine;

namespace DrivingSim.TestBed
{
    /// <summary>
    /// Builds the Test Town greybox from Resources/Layouts/TestTownLayout.json: asphalt ground, raised blocks with
    /// rounded curb returns (sidewalk 0.15 m), lane markings, crosswalks, stop lines, working traffic signals,
    /// street lights, trees and simple buildings. Temporary geometry that Codex's art replaces; the layout JSON
    /// stays the source of truth (ASSET_SPEC.md §3).
    /// </summary>
    public static class TownGreyboxBuilder
    {
        public static TownLayoutData LoadLayout()
        {
            var asset = Resources.Load<TextAsset>(TownLayoutData.ResourcePath);
            if (asset == null) { Debug.LogError("[Town] Missing Resources/" + TownLayoutData.ResourcePath); return null; }
            return JsonUtility.FromJson<TownLayoutData>(asset.text);
        }

        public static GameObject Build(TownLayoutData L, IMaterialSource m)
        {
            var root = new GameObject("TestTown");
            Transform t = root.transform;
            float curb = L.curbHeight, top = L.roadSurfaceY + curb, W = L.worldHalfSize;

            Material asphalt = m.Get("Asphalt", Palette.Asphalt);
            Material curbMat = m.Get("Curb", Palette.Curb);
            Material sidewalk = m.Get("Sidewalk", new Color(0.66f, 0.64f, 0.6f));
            Material plaza = m.Get("BlockGround", new Color(0.42f, 0.47f, 0.38f));
            Material white = m.Get("LineWhite", Palette.LineWhite);
            Material yellow = m.Get("LineYellow", Palette.LineYellow);

            // Asphalt everywhere at y = 0; raised areas sit on top of it.
            PrimitiveUtil.Create(PrimitiveType.Cube, "Ground", t, new Vector3(0f, L.roadSurfaceY - 0.5f, 0f),
                new Vector3(W * 2f, 1f, W * 2f), asphalt, true);

            Transform blocks = PrimitiveUtil.Group("Blocks", t).transform;
            float mainHalf = HalfWidth(L, "Main"), crossHalf = HalfWidth(L, "Cross");
            TownRoad north = Road(L, "North"), east = Road(L, "East");
            float perimHalf = north.width * 0.5f;
            float px = east.center, pz = north.center;
            float r = Corner(L, "X0_NE"), bend = Corner(L, "P_NE");
            for (int sx = -1; sx <= 1; sx += 2)
            for (int sz = -1; sz <= 1; sz += 2)
            {
                // Inner block between the main road, the cross street and the perimeter loop.
                float x0 = mainHalf, x1 = px - perimHalf, z0 = crossHalf, z1 = pz - perimHalf;
                // corner radii in order SW, SE, NE, NW of the block in its own (+x,+z) quadrant
                float[] radii = { r, r, bend, r };
                List<Vector2> outline = RoundedRect(x0, z0, x1, z1, radii, sx, sz);
                string id = (sz > 0 ? "N" : "S") + (sx > 0 ? "E" : "W");
                Slab("Block_" + id + "_Curb", blocks, outline, top, curbMat, true);
                Slab("Block_" + id + "_Sidewalk", blocks, RoundedRect(x0 + L.curbWidth, z0 + L.curbWidth, x1 - L.curbWidth, z1 - L.curbWidth,
                    Shrink(radii, L.curbWidth), sx, sz), top + 0.002f, sidewalk, false, wallsToo: false);
                float inset = L.sidewalkWidth;
                Slab("Block_" + id + "_Ground", blocks, RoundedRect(x0 + inset, z0 + inset, x1 - inset, z1 - inset,
                    Shrink(radii, inset), sx, sz), top + 0.004f, plaza, false, wallsToo: false);
            }
            BuildOuterRing(L, blocks, px + perimHalf, pz + perimHalf, Corner(L, "P_NE") + 2f * perimHalf, W, top, curbMat, sidewalk);

            BuildMarkings(L, PrimitiveUtil.Group("Markings", t).transform, white, yellow);
            BuildSignals(L, PrimitiveUtil.Group("Signals", t).transform, m);
            BuildStreetFurniture(L, PrimitiveUtil.Group("StreetFurniture", t).transform, m, top);
            BuildBuildings(L, PrimitiveUtil.Group("Buildings", t).transform, m, top);
            TownDressingData dressing = LoadDressing();
            if (dressing != null) BuildDressing(dressing, PrimitiveUtil.Group("Dressing", t).transform, m);

            // Everything except the signals is static: the saved scene gets static batching (phones need few draw calls).
            foreach (Transform child in root.GetComponentsInChildren<Transform>(true))
                if (child.GetComponentInParent<TrafficSignalController>() == null) child.gameObject.isStatic = true;
            if (Application.isPlaying) StaticBatchingUtility.Combine(root);
            return root;
        }

        public static TownDressingData LoadDressing()
        {
            var asset = Resources.Load<TextAsset>(TownDressingData.ResourcePath);
            return asset != null ? JsonUtility.FromJson<TownDressingData>(asset.text) : null;
        }

        // ---------- street dressing (greybox stand-ins; Codex's prefabs named in "prefab" replace them) ----------
        static void BuildDressing(TownDressingData d, Transform t, IMaterialSource m)
        {
            Material pole = m.Get("SignPole", new Color(0.55f, 0.57f, 0.6f));
            Material back = m.Get("SignBack", new Color(0.35f, 0.37f, 0.4f));
            Material red = m.Get("SignRed", new Color(0.86f, 0.12f, 0.1f));
            Material white = m.Get("SignWhite", new Color(0.95f, 0.95f, 0.93f));
            Material blue = m.Get("SignBlue", new Color(0.1f, 0.33f, 0.72f));
            Material green = m.Get("SignGreen", new Color(0.12f, 0.5f, 0.32f));
            if (d.signs != null)
                foreach (TownSign s in d.signs)
                {
                    Transform g = PrimitiveUtil.Group(s.id, t).transform;
                    g.localPosition = new Vector3(s.position[0], s.position[1], s.position[2]);
                    g.localRotation = Quaternion.Euler(0f, s.yawDeg, 0f); // forward = face direction
                    float w = s.size != null && s.size.Length > 1 ? s.size[0] : 0.6f, h = s.size != null && s.size.Length > 1 ? s.size[1] : 0.6f;
                    bool wide = w > 1f;
                    foreach (float px in wide ? new[] { -w * 0.35f, w * 0.35f } : new[] { 0f })
                        PrimitiveUtil.Create(PrimitiveType.Cylinder, "Pole", g, new Vector3(px, s.faceHeight * 0.5f, -0.04f),
                            new Vector3(0.08f, s.faceHeight * 0.5f, 0.08f), pole, true);
                    if (s.type == "speed_limit" || s.type == "no_parking")
                    {
                        Quaternion disc = Quaternion.Euler(90f, 0f, 0f);
                        PrimitiveUtil.Create(PrimitiveType.Cylinder, "Ring", g, new Vector3(0f, s.faceHeight, 0f), new Vector3(w, 0.01f, w), red, false, disc);
                        PrimitiveUtil.Create(PrimitiveType.Cylinder, "Face", g, new Vector3(0f, s.faceHeight, 0.012f), new Vector3(w * 0.78f, 0.01f, w * 0.78f),
                            s.type == "no_parking" ? blue : white, false, disc);
                    }
                    else
                    {
                        Material face = s.type == "bus_stop" ? green : blue;
                        PrimitiveUtil.Create(PrimitiveType.Cube, "Plate", g, new Vector3(0f, s.faceHeight, 0f), new Vector3(w, h, 0.03f), back, false);
                        PrimitiveUtil.Create(PrimitiveType.Cube, "Face", g, new Vector3(0f, s.faceHeight, 0.018f), new Vector3(w * 0.96f, h * 0.94f, 0.01f), face, false);
                    }
                }

            Material[] paints =
            {
                m.Get("CarPaintWhite", new Color(0.92f, 0.92f, 0.9f)), m.Get("CarPaintSilver", new Color(0.66f, 0.68f, 0.7f)),
                m.Get("CarPaintDark", new Color(0.16f, 0.18f, 0.22f)), m.Get("CarPaintBlue", new Color(0.18f, 0.32f, 0.55f)),
            };
            Material glass = m.Get("CarGlassProp", new Color(0.12f, 0.16f, 0.2f));
            Material busPaint = m.Get("BusBlue", new Color(0.15f, 0.42f, 0.85f));
            Material shelter = m.Get("Shelter", new Color(0.4f, 0.44f, 0.48f));
            int i = 0;
            if (d.props != null)
                foreach (TownProp p in d.props)
                {
                    Transform g = PrimitiveUtil.Group(p.id, t).transform;
                    g.localPosition = new Vector3(p.position[0], p.position[1], p.position[2]);
                    g.localRotation = Quaternion.Euler(0f, p.yawDeg, 0f);
                    switch (p.kind)
                    {
                        case "city_bus":
                            PrimitiveUtil.Create(PrimitiveType.Cube, "Body", g, new Vector3(0f, 1.65f, 0f), new Vector3(2.5f, 2.9f, 11f), busPaint, true);
                            PrimitiveUtil.Create(PrimitiveType.Cube, "Windows", g, new Vector3(0f, 2.1f, 0f), new Vector3(2.52f, 1.0f, 10.2f), glass, false);
                            break;
                        case "bus_shelter":
                            PrimitiveUtil.Create(PrimitiveType.Cube, "Roof", g, new Vector3(0f, 2.5f, 0f), new Vector3(1.6f, 0.08f, 4f), shelter, false);
                            PrimitiveUtil.Create(PrimitiveType.Cube, "Back", g, new Vector3(-0.7f, 1.25f, 0f), new Vector3(0.05f, 2.4f, 4f), glass, true);
                            break;
                        default:
                            bool suv = p.kind == "parked_suv";
                            float bodyH = suv ? 0.95f : 0.75f;
                            PrimitiveUtil.Create(PrimitiveType.Cube, "Body", g, new Vector3(0f, 0.3f + bodyH * 0.5f, 0f), new Vector3(1.8f, bodyH, 4.4f), paints[i++ % paints.Length], true);
                            PrimitiveUtil.Create(PrimitiveType.Cube, "Cabin", g, new Vector3(0f, 0.3f + bodyH + 0.3f, -0.2f), new Vector3(1.6f, 0.6f, 2.3f), glass, false);
                            break;
                    }
                }
        }

        // ---------- geometry helpers ----------
        static TownRoad Road(TownLayoutData L, string id) { foreach (var r in L.roads) if (r.id == id) return r; return null; }
        static float HalfWidth(TownLayoutData L, string id) => Road(L, id).width * 0.5f;
        static float Corner(TownLayoutData L, string id) { foreach (var c in L.corners) if (c.id == id) return c.radius; return 6f; }
        static float[] Shrink(float[] radii, float by) { var r = new float[radii.Length]; for (int i = 0; i < r.Length; i++) r[i] = Mathf.Max(0.05f, radii[i] - by); return r; }

        /// <summary>Rounded rectangle in the (+x,+z) quadrant, mirrored by (sx, sz). Returns a convex outline.</summary>
        static List<Vector2> RoundedRect(float x0, float z0, float x1, float z1, float[] radii, int sx, int sz)
        {
            var pts = new List<Vector2>();
            Vector2[] centers =
            {
                new Vector2(x0 + radii[0], z0 + radii[0]), new Vector2(x1 - radii[1], z0 + radii[1]),
                new Vector2(x1 - radii[2], z1 - radii[2]), new Vector2(x0 + radii[3], z1 - radii[3]),
            };
            float[] startDeg = { 180f, 270f, 0f, 90f };
            for (int c = 0; c < 4; c++)
                for (int i = 0; i <= 8; i++)
                {
                    float a = (startDeg[c] + i * 90f / 8f) * Mathf.Deg2Rad;
                    pts.Add(new Vector2((centers[c].x + Mathf.Cos(a) * radii[c]) * sx, (centers[c].y + Mathf.Sin(a) * radii[c]) * sz));
                }
            return pts;
        }

        /// <summary>Star-shaped outline (fan from vertex 0) extruded from y = 0 to yTop, with a MeshCollider.</summary>
        static GameObject Slab(string name, Transform parent, List<Vector2> outline, float yTop, Material material, bool collider, bool wallsToo = true)
        {
            var verts = new List<Vector3>();
            var tris = new List<int>();
            void Tri(Vector3 a, Vector3 b, Vector3 c, Vector3 wantNormal)
            {
                if (Vector3.Dot(Vector3.Cross(b - a, c - a), wantNormal) < 0f) { Vector3 s = b; b = c; c = s; }
                int i = verts.Count; verts.Add(a); verts.Add(b); verts.Add(c); tris.Add(i); tris.Add(i + 1); tris.Add(i + 2);
            }
            Vector3 P(Vector2 p, float y) => new Vector3(p.x, y, p.y);
            for (int i = 1; i + 1 < outline.Count; i++)
                Tri(P(outline[0], yTop), P(outline[i], yTop), P(outline[i + 1], yTop), Vector3.up);
            if (wallsToo)
            {
                Vector2 c = Vector2.zero; foreach (Vector2 p in outline) c += p; c /= outline.Count;
                for (int i = 0; i < outline.Count; i++)
                {
                    Vector2 a = outline[i], b = outline[(i + 1) % outline.Count];
                    if ((a - b).sqrMagnitude < 1e-6f) continue;
                    Vector2 mid = (a + b) * 0.5f, n2 = new Vector2(b.y - a.y, a.x - b.x);
                    if (Vector2.Dot(n2, mid - c) < 0f) n2 = -n2;
                    var n = new Vector3(n2.x, 0f, n2.y);
                    Tri(P(a, 0f), P(b, 0f), P(b, yTop), n);
                    Tri(P(a, 0f), P(b, yTop), P(a, yTop), n);
                }
            }
            var mesh = new Mesh { name = name, indexFormat = UnityEngine.Rendering.IndexFormat.UInt32 };
            mesh.SetVertices(verts);
            mesh.SetTriangles(tris, 0);
            mesh.RecalculateNormals();
            mesh.RecalculateBounds();
            var go = new GameObject(name);
            go.transform.SetParent(parent, false);
            go.AddComponent<MeshFilter>().sharedMesh = mesh;
            go.AddComponent<MeshRenderer>().sharedMaterial = material;
            if (collider) go.AddComponent<MeshCollider>().sharedMesh = mesh;
            go.isStatic = true;
            return go;
        }

        /// <summary>Raised area outside the perimeter loop: four strips plus rounded corner fillers.</summary>
        static void BuildOuterRing(TownLayoutData L, Transform parent, float ox, float oz, float bendR, float W, float top, Material curbMat, Material sidewalk)
        {
            // straight strips
            Box("Outer_N", parent, (ox - bendR) * -1f, oz, ox - bendR, W, top, curbMat);
            Box("Outer_S", parent, -(ox - bendR), -W, ox - bendR, -oz, top, curbMat);
            Box("Outer_E", parent, ox, -(oz - bendR), W, oz - bendR, top, curbMat);
            Box("Outer_W", parent, -W, -(oz - bendR), -ox, oz - bendR, top, curbMat);
            // corner squares minus the road bend: fan from the far corner over the curb arc
            for (int sx = -1; sx <= 1; sx += 2)
            for (int sz = -1; sz <= 1; sz += 2)
            {
                var c = new Vector2((ox - bendR) * sx, (oz - bendR) * sz);
                var pts = new List<Vector2> { new Vector2(W * sx, W * sz), new Vector2(W * sx, c.y) };
                for (int i = 0; i <= 12; i++)
                {
                    float a = i * 90f / 12f * Mathf.Deg2Rad;
                    pts.Add(new Vector2(c.x + Mathf.Cos(a) * bendR * sx, c.y + Mathf.Sin(a) * bendR * sz));
                }
                pts.Add(new Vector2(c.x, W * sz));
                Slab($"Outer_Corner_{(sz > 0 ? "N" : "S")}{(sx > 0 ? "E" : "W")}", parent, pts, top, curbMat, true);
            }
        }

        static void Box(string name, Transform parent, float x0, float z0, float x1, float z1, float top, Material mat)
        {
            var pts = new List<Vector2> { new Vector2(x0, z0), new Vector2(x1, z0), new Vector2(x1, z1), new Vector2(x0, z1) };
            Slab(name, parent, pts, top, mat, true);
        }

        // ---------- markings ----------
        static void BuildMarkings(TownLayoutData L, Transform t, Material white, Material yellow)
        {
            foreach (TownLaneMarking mk in L.laneMarkings)
            {
                Material mat = mk.type.StartsWith("yellow") ? yellow : white;
                float a = Mathf.Min(mk.from, mk.to), b = Mathf.Max(mk.from, mk.to);
                if (mk.dash > 0f)
                {
                    for (float s = a; s < b; s += mk.dash + mk.gap)
                        Line(t, mk, s, Mathf.Min(b, s + mk.dash), mat);
                }
                else Line(t, mk, a, b, mat);
            }
            foreach (TownStopLine s in L.stopLines) Rect(t, s.id, s.points, white);
            foreach (TownCrosswalk cw in L.crosswalks)
            {
                var bb = TownGeometry.Bounds(cw.points);
                bool alongZ = cw.stripeAxis == "z";
                float from = alongZ ? bb.minX : bb.minZ, to = alongZ ? bb.maxX : bb.maxZ;
                int i = 0;
                for (float s = from + 0.25f; s + cw.stripeWidth <= to - 0.1f; s += cw.stripeWidth + cw.stripeGap, i++)
                {
                    float[] p = alongZ ? new[] { s, bb.minZ, s + cw.stripeWidth, bb.minZ, s + cw.stripeWidth, bb.maxZ, s, bb.maxZ }
                                       : new[] { bb.minX, s, bb.maxX, s, bb.maxX, s + cw.stripeWidth, bb.minX, s + cw.stripeWidth };
                    Rect(t, $"{cw.id}_{i}", p, white);
                }
            }
        }

        static void Line(Transform t, TownLaneMarking mk, float a, float b, Material mat)
        {
            float len = b - a, mid = (a + b) * 0.5f;
            Vector3 center = mk.axis == "z" ? new Vector3(mk.offset, 0f, mid) : new Vector3(mid, 0f, mk.offset);
            PrimitiveUtil.Marking(mk.id, t, center, mk.width, len, mat, mk.axis == "z" ? 0f : 90f);
        }

        static void Rect(Transform t, string name, float[] pts, Material mat)
        {
            var bb = TownGeometry.Bounds(pts);
            PrimitiveUtil.Marking(name, t, new Vector3((bb.minX + bb.maxX) * 0.5f, 0f, (bb.minZ + bb.maxZ) * 0.5f), bb.maxX - bb.minX, bb.maxZ - bb.minZ, mat);
        }

        // ---------- signals ----------
        static void BuildSignals(TownLayoutData L, Transform t, IMaterialSource m)
        {
            Material pole = m.Get("SignalPole", new Color(0.28f, 0.3f, 0.32f));
            Material housing = m.Get("SignalHousing", new Color(0.08f, 0.09f, 0.1f));
            Material off = m.Get("Lamp_Off", new Color(0.13f, 0.13f, 0.12f));
            Material redOn = m.Get("Emissive_LampRed", new Color(1f, 0.12f, 0.08f));
            Material yellowOn = m.Get("Emissive_LampYellow", new Color(1f, 0.72f, 0.1f));
            Material greenOn = m.Get("Emissive_LampGreen", new Color(0.12f, 1f, 0.55f));
            var heads = new List<TrafficSignalHead>();
            foreach (TownSignal s in L.signals)
            {
                Transform g = PrimitiveUtil.Group(s.id, t).transform;
                var basePos = new Vector3(s.pole[0], s.pole[1], s.pole[2]);
                var headPos = new Vector3(s.head[0], s.head[1], s.head[2]);
                float poleTop = headPos.y + 0.6f;
                PrimitiveUtil.Create(PrimitiveType.Cylinder, "Pole", g, new Vector3(basePos.x, (basePos.y + poleTop) * 0.5f, basePos.z),
                    new Vector3(0.24f, (poleTop - basePos.y) * 0.5f, 0.24f), pole, true);
                Vector3 armFrom = new Vector3(basePos.x, poleTop - 0.15f, basePos.z), armTo = new Vector3(headPos.x, poleTop - 0.15f, headPos.z);
                if ((armTo - armFrom).sqrMagnitude > 0.01f)
                    PrimitiveUtil.Create(PrimitiveType.Cube, "Arm", g, (armFrom + armTo) * 0.5f, new Vector3(0.12f, 0.12f, (armTo - armFrom).magnitude),
                        pole, false, Quaternion.LookRotation(armTo - armFrom, Vector3.up));

                int lamps = s.lamps != null ? s.lamps.Length : 3;
                const float spacing = 0.4f;
                var head = new GameObject("Head").transform;
                head.SetParent(g, false);
                head.localPosition = headPos;
                head.localRotation = Quaternion.Euler(0f, s.yawDeg, 0f); // forward = direction the lamps face
                PrimitiveUtil.Create(PrimitiveType.Cube, "Housing", head, Vector3.zero, new Vector3(lamps * spacing + 0.15f, 0.42f, 0.3f), housing, false);
                Renderer red = null, yel = null, grn = null;
                for (int i = 0; i < lamps; i++)
                {
                    // Korean horizontal head, seen by the driver from left to right: red, yellow, (left arrow), green.
                    float x = -(i - (lamps - 1) * 0.5f) * spacing;
                    string kind = s.lamps != null ? s.lamps[i] : (i == 0 ? "red" : i == 1 ? "yellow" : "green");
                    Renderer lamp = PrimitiveUtil.Create(PrimitiveType.Sphere, "Lamp_" + kind, head, new Vector3(x, 0f, 0.16f),
                        Vector3.one * 0.3f, off, false).GetComponent<Renderer>();
                    if (kind == "red") red = lamp; else if (kind == "yellow") yel = lamp; else if (kind == "green") grn = lamp;
                }
                TrafficSignalHead component = g.gameObject.AddComponent<TrafficSignalHead>();
                component.Configure(red, yel, grn, redOn, yellowOn, greenOn, off, SignalCycle.IsMainApproach(s.approach));
                heads.Add(component);
            }
            t.gameObject.AddComponent<TrafficSignalController>().Configure(L.signalCycle, heads);
        }

        // ---------- street furniture ----------
        static void BuildStreetFurniture(TownLayoutData L, Transform t, IMaterialSource m, float top)
        {
            Material pole = m.Get("StreetLightPole", new Color(0.35f, 0.37f, 0.4f));
            Material lamp = m.Get("Emissive_StreetLamp", new Color(1f, 0.92f, 0.75f));
            Material trunk = m.Get("TreeTrunk", new Color(0.33f, 0.24f, 0.17f));
            Material leaves = m.Get("TreeLeaves", new Color(0.24f, 0.42f, 0.22f));
            float mainOff = HalfWidth(L, "Main") + 0.5f, crossOff = HalfWidth(L, "Cross") + 0.5f;
            for (float z = -100f; z <= 100f; z += 25f)
                foreach (int side in new[] { -1, 1 })
                {
                    var p = new Vector3(side * mainOff, top, z);
                    if (!Blocked(L, p)) StreetLight(t, p, -side, pole, lamp);
                }
            for (float x = -85f; x <= 85f; x += 15f)
                foreach (int side in new[] { -1, 1 })
                {
                    var p = new Vector3(x, top, side * crossOff);
                    if (Blocked(L, p) || Mathf.Abs(x) < 25f) continue;
                    PrimitiveUtil.Create(PrimitiveType.Cylinder, "Trunk", t, p + Vector3.up * 1.2f, new Vector3(0.25f, 1.2f, 0.25f), trunk, true);
                    PrimitiveUtil.Create(PrimitiveType.Sphere, "Crown", t, p + Vector3.up * 3.4f, new Vector3(2.4f, 2.6f, 2.4f), leaves, false);
                }
        }

        static void StreetLight(Transform t, Vector3 basePos, int towardRoad, Material pole, Material lamp)
        {
            Transform g = PrimitiveUtil.Group("StreetLight", t).transform;
            PrimitiveUtil.Create(PrimitiveType.Cylinder, "Pole", g, basePos + Vector3.up * 4f, new Vector3(0.18f, 4f, 0.18f), pole, true);
            PrimitiveUtil.Create(PrimitiveType.Cube, "Arm", g, basePos + new Vector3(towardRoad * 0.8f, 7.9f, 0f), new Vector3(1.6f, 0.1f, 0.12f), pole, false);
            PrimitiveUtil.Create(PrimitiveType.Cube, "Lamp", g, basePos + new Vector3(towardRoad * 1.5f, 7.8f, 0f), new Vector3(0.6f, 0.12f, 0.3f), lamp, false);
        }

        /// <summary>True when a point lies in a keep-out zone that forbids objects (all except sight triangles, which allow poles).</summary>
        static bool Blocked(TownLayoutData L, Vector3 p)
        {
            foreach (TownZone k in L.keepOut)
                if (k.kind != "sight_triangle" && Inside(k.points, p.x, p.z)) return true;
            return false;
        }

        static bool Inside(float[] poly, float x, float z)
        {
            bool inside = false;
            int n = poly.Length / 2;
            for (int i = 0, j = n - 1; i < n; j = i++)
            {
                float xi = poly[i * 2], zi = poly[i * 2 + 1], xj = poly[j * 2], zj = poly[j * 2 + 1];
                if ((zi > z) != (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi + 1e-9f) + xi) inside = !inside;
            }
            return inside;
        }

        // ---------- buildings ----------
        static void BuildBuildings(TownLayoutData L, Transform t, IMaterialSource m, float top)
        {
            Material[] facades =
            {
                m.Get("Facade_A", new Color(0.72f, 0.70f, 0.66f)), m.Get("Facade_B", new Color(0.55f, 0.6f, 0.66f)),
                m.Get("Facade_C", new Color(0.78f, 0.74f, 0.68f)), m.Get("Facade_D", new Color(0.46f, 0.49f, 0.52f)),
            };
            Material glass = m.Get("FacadeGlass", new Color(0.22f, 0.3f, 0.38f));
            Material[] signs =
            {
                m.Get("Emissive_SignRed", new Color(0.9f, 0.2f, 0.18f)), m.Get("Emissive_SignBlue", new Color(0.2f, 0.45f, 0.9f)),
                m.Get("Emissive_SignGreen", new Color(0.15f, 0.7f, 0.5f)), m.Get("Emissive_SignYellow", new Color(0.95f, 0.75f, 0.2f)),
            };
            float mainEdge = HalfWidth(L, "Main") + L.sidewalkWidth + 1f;   // 10.5
            float crossEdge = HalfWidth(L, "Cross") + L.sidewalkWidth + 1f; // 7.0
            int seed = 0;
            for (int sx = -1; sx <= 1; sx += 2)
            for (int sz = -1; sz <= 1; sz += 2)
            {
                // Row facing the main road.
                float z = 22f;
                foreach (float len in new[] { 14f, 18f, 12f, 16f, 20f })
                {
                    Building(t, L, sx * (mainEdge + 6f), sz * (z + len * 0.5f), 12f, len, 9f + (seed * 7 % 5) * 4.5f,
                        facades[seed % facades.Length], glass, signs[seed % signs.Length], sx < 0 ? 90f : -90f, top, seed++);
                    z += len + 2f;
                }
                // Row facing the cross street.
                float x = 26f;
                foreach (float len in new[] { 15f, 12f, 18f, 14f })
                {
                    Building(t, L, sx * (x + len * 0.5f), sz * (crossEdge + 6f), len, 12f, 9f + (seed * 3 % 4) * 4f,
                        facades[seed % facades.Length], glass, signs[seed % signs.Length], sz < 0 ? 0f : 180f, top, seed++);
                    x += len + 2f;
                }
            }
            // Low-detail skyline beyond the loop.
            for (int i = 0; i < 28; i++)
            {
                float a = i / 28f * Mathf.PI * 2f, d = 140f + (i % 3) * 6f;
                float h = 18f + (i * 37 % 5) * 8f;
                PrimitiveUtil.Create(PrimitiveType.Cube, "Skyline", t, new Vector3(Mathf.Cos(a) * d, top + h * 0.5f, Mathf.Sin(a) * d),
                    new Vector3(16f, h, 16f), facades[i % facades.Length], false);
            }
        }

        static void Building(Transform t, TownLayoutData L, float cx, float cz, float sizeX, float sizeZ, float height,
            Material facade, Material glass, Material sign, float frontYaw, float top, int seed)
        {
            // Skip anything that would touch a keep-out zone (sight triangles included).
            foreach (Vector2 c in new[] { new Vector2(cx - sizeX / 2, cz - sizeZ / 2), new Vector2(cx + sizeX / 2, cz - sizeZ / 2),
                                          new Vector2(cx + sizeX / 2, cz + sizeZ / 2), new Vector2(cx - sizeX / 2, cz + sizeZ / 2) })
                foreach (TownZone k in L.keepOut)
                    if (Inside(k.points, c.x, c.y)) return;

            Transform g = PrimitiveUtil.Group("Building", t).transform;
            g.localPosition = new Vector3(cx, top, cz);
            PrimitiveUtil.Create(PrimitiveType.Cube, "Body", g, new Vector3(0f, height * 0.5f, 0f), new Vector3(sizeX, height, sizeZ), facade, true);
            // Ground-floor glazing and a shop sign on the street side.
            Quaternion yaw = Quaternion.Euler(0f, frontYaw, 0f);
            Vector3 front = yaw * Vector3.forward;
            float half = Mathf.Abs(front.x) > 0.5f ? sizeX * 0.5f : sizeZ * 0.5f;
            float width = (Mathf.Abs(front.x) > 0.5f ? sizeZ : sizeX) - 1f;
            PrimitiveUtil.Create(PrimitiveType.Cube, "Shopfront", g, front * (half + 0.02f) + Vector3.up * 1.6f, new Vector3(width, 2.6f, 0.05f), glass, false, yaw);
            PrimitiveUtil.Create(PrimitiveType.Cube, "Sign", g, front * (half + 0.12f) + Vector3.up * 3.6f, new Vector3(width * 0.8f, 0.9f, 0.15f), sign, false, yaw);
            // Upper-floor window bands.
            for (float y = 5.5f; y < height - 1.5f; y += 3.2f)
                PrimitiveUtil.Create(PrimitiveType.Cube, "Windows", g, front * (half + 0.02f) + Vector3.up * y, new Vector3(width - 1f, 1.3f, 0.05f), glass, false, yaw);
        }
    }
}
