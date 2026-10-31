using DrivingSim.Vehicle;
using UnityEngine;

namespace DrivingSim.TestBed
{
    /// <summary>
    /// Builds a box-and-cylinder compact sedan with four WheelColliders.
    /// The root origin is at ground level, centered between the axles; +Z is forward.
    /// The returned GameObject is inactive so callers can finish wiring before Awake runs.
    /// </summary>
    public static class PrimitiveVehicleBuilder
    {
        public static VehicleController Build(VehiclePhysicsConfig config, IMaterialSource materials, Vector3 position, Quaternion rotation)
        {
            var root = new GameObject("PlayerVehicle");
            root.SetActive(false);
            root.transform.SetPositionAndRotation(position, rotation);

            Rigidbody body = root.AddComponent<Rigidbody>();
            body.mass = config.massKg;
            body.interpolation = RigidbodyInterpolation.Interpolate;

            Transform t = root.transform;
            Material paint = materials.Get("CarBody", Palette.CarBody);
            Material glass = materials.Get("CarGlass", Palette.CarGlass);
            Material head = materials.Get("HeadLight", Palette.HeadLight);
            Material tail = materials.Get("TailLight", Palette.TailLight);

            float length = config.wheelbaseM + 1.75f;
            float width = config.trackWidthM + 0.21f;

            Transform bodyGroup = PrimitiveUtil.Group("Body", t).transform;
            PrimitiveUtil.Create(PrimitiveType.Cube, "Hull", bodyGroup, new Vector3(0f, 0.66f, 0f), new Vector3(width, 0.62f, length), paint, true);
            PrimitiveUtil.Create(PrimitiveType.Cube, "Cabin", bodyGroup, new Vector3(0f, 1.23f, -0.2f), new Vector3(width - 0.2f, 0.52f, 2.3f), glass, true);
            PrimitiveUtil.Create(PrimitiveType.Cube, "Roof", bodyGroup, new Vector3(0f, 1.5f, -0.25f), new Vector3(width - 0.26f, 0.04f, 1.9f), paint, false);
            float front = length * 0.5f, side = width * 0.5f - 0.25f;
            PrimitiveUtil.Create(PrimitiveType.Cube, "HeadLight_L", bodyGroup, new Vector3(-side, 0.75f, front), new Vector3(0.35f, 0.12f, 0.04f), head, false);
            PrimitiveUtil.Create(PrimitiveType.Cube, "HeadLight_R", bodyGroup, new Vector3(side, 0.75f, front), new Vector3(0.35f, 0.12f, 0.04f), head, false);
            PrimitiveUtil.Create(PrimitiveType.Cube, "TailLight_L", bodyGroup, new Vector3(-side, 0.8f, -front), new Vector3(0.35f, 0.12f, 0.04f), tail, false);
            PrimitiveUtil.Create(PrimitiveType.Cube, "TailLight_R", bodyGroup, new Vector3(side, 0.8f, -front), new Vector3(0.35f, 0.12f, 0.04f), tail, false);

            float halfBase = config.wheelbaseM * 0.5f;
            float halfTrack = config.trackWidthM * 0.5f;
            // Collider at the top of the suspension travel so the wheel rests on the ground at the target position.
            float colliderY = config.wheelRadiusM + config.suspensionDistanceM * (1f - config.suspensionTargetPosition);

            Transform colliderGroup = PrimitiveUtil.Group("WheelColliders", t).transform;
            VehicleWheel[] wheels =
            {
                CreateWheel("FL", t, colliderGroup, new Vector3(-halfTrack, colliderY, halfBase), Axle.Front, true, config, materials),
                CreateWheel("FR", t, colliderGroup, new Vector3(halfTrack, colliderY, halfBase), Axle.Front, false, config, materials),
                CreateWheel("RL", t, colliderGroup, new Vector3(-halfTrack, colliderY, -halfBase), Axle.Rear, true, config, materials),
                CreateWheel("RR", t, colliderGroup, new Vector3(halfTrack, colliderY, -halfBase), Axle.Rear, false, config, materials),
            };

            VehicleController controller = root.AddComponent<VehicleController>();
            controller.Configure(config, wheels);
            return controller;
        }

        static VehicleWheel CreateWheel(string id, Transform root, Transform colliderGroup, Vector3 localPosition, Axle axle, bool isLeft,
            VehiclePhysicsConfig config, IMaterialSource materials)
        {
            var colliderObject = new GameObject($"Wheel_{id}");
            colliderObject.transform.SetParent(colliderGroup, false);
            colliderObject.transform.localPosition = localPosition;
            WheelCollider wc = colliderObject.AddComponent<WheelCollider>();
            wc.radius = config.wheelRadiusM;
            wc.suspensionDistance = config.suspensionDistanceM;
            wc.mass = config.wheelMassKg;

            // Visual pivot is a direct child of the root; its pose is driven from the WheelCollider.
            var pivot = new GameObject($"WheelVisual_{id}");
            pivot.transform.SetParent(root, false);
            pivot.transform.localPosition = localPosition - Vector3.up * (config.suspensionDistanceM * (1f - config.suspensionTargetPosition));

            float diameter = config.wheelRadiusM * 2f;
            PrimitiveUtil.Create(PrimitiveType.Cylinder, "Tire", pivot.transform, Vector3.zero,
                new Vector3(diameter, 0.1f, diameter), materials.Get("Tire", Palette.Tire), false, Quaternion.Euler(0f, 0f, 90f));
            float hubOffset = isLeft ? -0.105f : 0.105f;
            PrimitiveUtil.Create(PrimitiveType.Cube, "Spoke", pivot.transform, new Vector3(hubOffset, 0f, 0f),
                new Vector3(0.02f, diameter * 0.75f, 0.09f), materials.Get("Hub", Palette.Hub), false);

            return new VehicleWheel
            {
                collider = wc,
                visual = pivot.transform,
                axle = axle,
                isLeft = isLeft,
            };
        }
    }
}
