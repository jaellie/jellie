using System.Collections.Generic;
using System.Linq;
using DrivingSim.Cameras;
using DrivingSim.Vehicle;
using UnityEngine;
using UnityEngine.Rendering;

namespace DrivingSim.TestBed
{
    /// <summary>Codex's vehicle art for one car (ASSET_SPEC.md §1–2). Any part may be null; missing parts keep the greybox.</summary>
    public struct VehicleArtSet
    {
        public GameObject Interior;   // SM_Sedan_Interior (or SM_BO_Cockpit blockout)
        public GameObject Exterior;   // SM_Sedan_Exterior
        public GameObject Wheel;      // SM_Sedan_Wheel (one left wheel)

        public bool IsEmpty => Interior == null && Exterior == null && Wheel == null;
    }

    /// <summary>
    /// Hooks Codex's FBX models to the existing gameplay systems by the object names in ASSET_SPEC.md:
    /// steering wheel rotation (22° column axis), speed needle (12° cluster plane) and optional tachometer,
    /// cluster display text, live mirrors on the mirror glass quads, wipers rotating in the windshield plane,
    /// indicator/headlight lamps, wheel meshes on the physics wheels. Rotation axes are built here from the spec,
    /// so the art only has to be modeled in its rest pose with origins at the pivots.
    /// Physics, colliders and input are untouched: greybox colliders stay, only greybox renderers are hidden.
    /// </summary>
    public static class VehicleArtBinder
    {
        // Spec values (ASSET_SPEC.md §2)
        static readonly Vector3 WindshieldUp = new Vector3(0f, 0.884f, -0.468f);      // along the glass, upward
        static readonly Vector3 WindshieldOut = new Vector3(0f, 0.468f, 0.884f);      // glass normal, outward
        static readonly Color IndicatorGlow = new Color(1f, 0.62f, 0.05f);
        static readonly Color HeadlightGlow = new Color(1f, 0.96f, 0.85f);

        /// <summary>Replaces the greybox cockpit with the art interior. Returns null (keep the greybox) if no interior is given.</summary>
        public static CockpitRig BindInterior(VehicleController vehicle, GameObject interiorPrefab, List<string> report)
        {
            if (interiorPrefab == null) return null;
            Transform root = vehicle.transform;
            GameObject interior = Instantiate(interiorPrefab, root, "ArtInterior");

            // Remove the greybox cockpit made by CockpitBuilder (keeps physics untouched: it has no colliders).
            CockpitRig old = vehicle.GetComponent<CockpitRig>();
            foreach (string name in new[] { "CockpitInterior", "DriverEye", "RearviewMirror", "SideMirror_L", "SideMirror_R", "Wipers" })
            {
                Transform t = root.Find(name);
                if (t != null) Object.DestroyImmediate(t.gameObject);
            }
            if (old != null) Object.DestroyImmediate(old);

            Transform eye = Find(interior, "DriverEye");
            if (eye == null)
            {
                eye = new GameObject("DriverEye").transform;
                eye.SetParent(root, false);
                eye.localPosition = CockpitBuilder.EyeLocal;
                report?.Add("DriverEye anchor missing: using the spec position.");
            }

            Transform wheelSpin = BuildPivot(root, interior, "SteeringWheel", "SteeringWheelPivot", Quaternion.Euler(CockpitBuilder.WheelTiltDeg, 0f, 0f), report);
            Transform needle = BuildPivot(root, interior, "Cluster_Needle_Speed", null, Quaternion.Euler(CockpitBuilder.ClusterTiltDeg, 0f, 0f), report, "Cluster_Needle");
            Transform tach = BuildPivot(root, interior, "Cluster_Needle_Tach", null, Quaternion.Euler(CockpitBuilder.ClusterTiltDeg, 0f, 0f), null);
            if (tach != null) vehicle.gameObject.AddComponent<TachometerNeedle>().Configure(vehicle, tach);

            // Cluster display text: on the display quad if present, else at the spec cluster position.
            Transform display = Find(interior, "Cluster_Display");
            Transform textParent = new GameObject("ClusterText").transform;
            textParent.SetParent(display != null ? display : root, false);
            if (display == null)
            {
                textParent.localPosition = CockpitBuilder.ClusterCenter + new Vector3(0.08f, 0f, -0.004f);
                textParent.localRotation = Quaternion.Euler(CockpitBuilder.ClusterTiltDeg, 0f, 0f);
                report?.Add("Cluster_Display missing: text placed at the spec cluster position.");
            }
            else
            {
                textParent.localPosition = new Vector3(0f, 0f, -0.003f);
                // Undo the quad's scale so text keeps its metric size.
                Vector3 s = display.lossyScale;
                textParent.localScale = new Vector3(1f / Mathf.Max(Mathf.Abs(s.x), 1e-4f), 1f / Mathf.Max(Mathf.Abs(s.y), 1e-4f), 1f / Mathf.Max(Mathf.Abs(s.z), 1e-4f));
            }
            Font font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            TextMesh speed = CockpitBuilder.Label("SpeedReadout", textParent, new Vector3(0f, 0.018f, 0f), "0", 0.0034f, Color.white, font);
            TextMesh gear = CockpitBuilder.Label("GearIndicator", textParent, new Vector3(0f, -0.022f, 0f), "P R N D", 0.0017f, Color.white, font);
            TextMesh parking = CockpitBuilder.Label("ParkingBrakeLamp", textParent, new Vector3(-0.06f, -0.034f, 0f), "(P)", 0.0014f, new Color(1f, 0.25f, 0.2f), font);

            var mirrors = new List<MirrorCamera>();
            AddMirror(root, interior, "MirrorGlass_Rear", Quaternion.Euler(3f, 180f, 0f), 16f, 256, 72, 2, 0, mirrors, report);
            AddMirror(root, interior, "MirrorGlass_Left", Quaternion.Euler(4f, 195f, 0f), 22f, 160, 112, 4, 1, mirrors, report);
            AddMirror(root, interior, "MirrorGlass_Right", Quaternion.Euler(4f, 165f, 0f), 22f, 160, 112, 4, 3, mirrors, report);

            Transform[] wipers = { WiperPivot(root, interior, "Interior_Wiper_L", report), WiperPivot(root, interior, "Interior_Wiper_R", report) };
            VehicleAccessories accessories = vehicle.GetComponent<VehicleAccessories>();
            if (accessories != null) accessories.SetWiperPivots(wipers.Where(w => w != null).ToArray());

            foreach (Renderer r in interior.GetComponentsInChildren<Renderer>(true))
            {
                r.shadowCastingMode = ShadowCastingMode.Off;
                r.receiveShadows = false;
            }
            SetLayer(interior, "CockpitInterior");

            CockpitRig rig = vehicle.gameObject.AddComponent<CockpitRig>();
            rig.Configure(vehicle, eye, interior, wheelSpin, needle, speed, gear, parking, mirrors.ToArray());
            return rig;
        }

        /// <summary>Shows the art body, lamps and wheels instead of the greybox (greybox colliders stay).</summary>
        public static void BindExterior(VehicleController vehicle, GameObject exteriorPrefab, GameObject wheelPrefab, List<string> report)
        {
            Transform root = vehicle.transform;
            if (exteriorPrefab != null)
            {
                GameObject body = Instantiate(exteriorPrefab, root, "ArtExterior");
                Transform greyBody = root.Find("Body");
                if (greyBody != null) foreach (Renderer r in greyBody.GetComponentsInChildren<Renderer>(true)) r.enabled = false;

                VehicleAccessories accessories = vehicle.GetComponent<VehicleAccessories>();
                Renderer[] left = Renderers(body, "Lamp_Indicator_FL", "Lamp_Indicator_RL");
                Renderer[] right = Renderers(body, "Lamp_Indicator_FR", "Lamp_Indicator_RR");
                Renderer[] heads = Renderers(body, "Lamp_HeadLight_L", "Lamp_HeadLight_R");
                if (accessories != null && left.Length > 0 && right.Length > 0)
                {
                    Material indicatorOff = left[0].sharedMaterial;
                    Material headOff = heads.Length > 0 ? heads[0].sharedMaterial : null;
                    Light[] beams = root.GetComponentsInChildren<Light>(true).Where(l => l.name.StartsWith("HeadlightBeam")).ToArray();
                    accessories.Configure(vehicle, left, right, Glowing(indicatorOff, IndicatorGlow), indicatorOff,
                        heads, headOff != null ? Glowing(headOff, HeadlightGlow) : null, headOff, beams);
                }
                else report?.Add("Indicator lamps missing on the exterior: greybox lamps keep working, but they are hidden.");
                SetLayer(body, "Vehicle");
            }

            if (wheelPrefab != null)
            {
                foreach (VehicleWheel wheel in vehicle.Wheels)
                {
                    if (wheel?.visual == null) continue;
                    foreach (Renderer r in wheel.visual.GetComponentsInChildren<Renderer>(true)) r.enabled = false;
                    GameObject art = Instantiate(wheelPrefab, wheel.visual, "ArtWheel");
                    // The art is a left wheel; the right side is the same mesh turned around.
                    if (!wheel.isLeft) art.transform.localRotation = Quaternion.Euler(0f, 180f, 0f);
                    SetLayer(art, "Vehicle");
                }
            }
        }

        // ---------- helpers ----------

        static GameObject Instantiate(GameObject prefab, Transform parent, string name)
        {
            GameObject go = Object.Instantiate(prefab, parent, false);
            go.name = name;
            go.transform.localPosition = Vector3.zero;
            go.transform.localRotation = Quaternion.identity;
            go.transform.localScale = Vector3.one;
            return go;
        }

        static Transform Find(GameObject root, string name) =>
            root.GetComponentsInChildren<Transform>(true).FirstOrDefault(t => t.name == name);

        static Renderer[] Renderers(GameObject root, params string[] names) =>
            names.Select(n => Find(root, n)).Where(t => t != null).Select(t => t.GetComponent<Renderer>()).Where(r => r != null).ToArray();

        /// <summary>
        /// Builds frame (spec axis) → pivot (driven by gameplay) at the mesh origin (or at an anchor empty)
        /// and moves the mesh under the pivot without changing its world pose.
        /// </summary>
        static Transform BuildPivot(Transform root, GameObject art, string meshName, string anchorName, Quaternion axis, List<string> report, string altName = null)
        {
            Transform mesh = Find(art, meshName) ?? (altName != null ? Find(art, altName) : null);
            if (mesh == null) { report?.Add($"{meshName} missing: that part won't move."); return null; }
            Transform anchor = anchorName != null ? Find(art, anchorName) : null;
            var frame = new GameObject(meshName + "_Frame").transform;
            frame.SetParent(root, false);
            frame.position = (anchor != null ? anchor : mesh).position;
            frame.localRotation = axis;
            var pivot = new GameObject(meshName + "_Pivot").transform;
            pivot.SetParent(frame, false);
            mesh.SetParent(pivot, true);
            return pivot;
        }

        static Transform WiperPivot(Transform root, GameObject art, string meshName, List<string> report)
        {
            Transform mesh = Find(art, meshName);
            if (mesh == null) { report?.Add($"{meshName} missing: no wiper on that side."); return null; }
            var frame = new GameObject(meshName + "_Frame").transform;
            frame.SetParent(root, false);
            frame.position = mesh.position;
            frame.localRotation = Quaternion.LookRotation(WindshieldOut, WindshieldUp); // local Z = glass normal, local Y = up the glass
            var pivot = new GameObject(meshName + "_Pivot").transform;
            pivot.SetParent(frame, false);
            mesh.SetParent(pivot, true); // modeled pointing up the glass = pivot +Y; VehicleAccessories rotates about Z
            return pivot;
        }

        static void AddMirror(Transform root, GameObject art, string glassName, Quaternion cameraRotation, float fov,
            int width, int height, int interval, int phase, List<MirrorCamera> mirrors, List<string> report)
        {
            Transform glass = Find(art, glassName);
            Renderer glassRenderer = glass != null ? glass.GetComponent<Renderer>() : null;
            if (glassRenderer == null) { report?.Add($"{glassName} missing: that mirror shows no image."); return; }
            var cameraObject = new GameObject("MirrorCamera");
            cameraObject.transform.SetParent(root, false);
            cameraObject.transform.position = glass.position;
            cameraObject.transform.localRotation = cameraRotation;
            Camera cam = cameraObject.AddComponent<Camera>();
            cam.fieldOfView = fov;
            cam.nearClipPlane = 0.05f;
            cam.farClipPlane = 150f;
            cam.depth = -10f;
            cam.enabled = false;
            int interiorLayer = LayerMask.NameToLayer("CockpitInterior");
            if (interiorLayer >= 0) cam.cullingMask &= ~(1 << interiorLayer);
            cameraObject.transform.SetParent(glass, true);
            MirrorCamera mirror = glass.gameObject.AddComponent<MirrorCamera>();
            mirror.Configure(cam, glassRenderer, glassRenderer.sharedMaterial, width, height, interval, phase);
            mirrors.Add(mirror);
        }

        static Material Glowing(Material off, Color glow)
        {
            if (off == null) return null;
            var on = new Material(off) { name = off.name.Replace("_Off", "") + "_On" };
            if (on.HasProperty("_BaseColor")) on.SetColor("_BaseColor", glow);
            if (on.HasProperty("_Color")) on.SetColor("_Color", glow);
            if (on.HasProperty("_EmissionColor"))
            {
                on.EnableKeyword("_EMISSION");
                on.SetColor("_EmissionColor", glow * 2f);
            }
            return on;
        }

        static void SetLayer(GameObject go, string layerName)
        {
            int layer = LayerMask.NameToLayer(layerName);
            if (layer < 0) return;
            foreach (Transform t in go.GetComponentsInChildren<Transform>(true)) t.gameObject.layer = layer;
        }
    }
}
