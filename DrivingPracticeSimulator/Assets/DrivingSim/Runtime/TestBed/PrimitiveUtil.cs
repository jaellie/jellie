using UnityEngine;

namespace DrivingSim.TestBed
{
    static class PrimitiveUtil
    {
        public static GameObject Create(PrimitiveType type, string name, Transform parent, Vector3 localPosition, Vector3 localScale,
            Material material, bool keepCollider, Quaternion? localRotation = null)
        {
            GameObject go = GameObject.CreatePrimitive(type);
            go.name = name;
            go.transform.SetParent(parent, false);
            go.transform.localPosition = localPosition;
            go.transform.localRotation = localRotation ?? Quaternion.identity;
            go.transform.localScale = localScale;
            go.GetComponent<Renderer>().sharedMaterial = material;
            if (!keepCollider) RemoveCollider(go);
            return go;
        }

        public static void RemoveCollider(GameObject go)
        {
            Collider collider = go.GetComponent<Collider>();
            // DestroyImmediate so WheelCollider raycasts never see decoration colliders, even for one frame.
            if (collider != null) Object.DestroyImmediate(collider);
        }

        /// <summary>Flat road marking lying on the ground (no collider).</summary>
        public static GameObject Marking(string name, Transform parent, Vector3 center, float width, float length, Material material, float yawDeg = 0f)
        {
            return Create(PrimitiveType.Cube, name, parent, new Vector3(center.x, center.y + 0.006f, center.z),
                new Vector3(width, 0.01f, length), material, false, Quaternion.Euler(0f, yawDeg, 0f));
        }

        public static GameObject Group(string name, Transform parent)
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent, false);
            return go;
        }
    }
}
