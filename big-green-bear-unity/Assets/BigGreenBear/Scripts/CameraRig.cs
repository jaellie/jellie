// CameraRig.cs — the 2.5D camera.
// A perspective camera that glides between framings ("focus" points from
// layout.json), leans a little toward the mouse, and drifts very slightly
// when memory slips. All movement is slow; nothing shakes.
using UnityEngine;

namespace BigGreenBear
{
    public class CameraRig : MonoBehaviour
    {
        public static bool ReducedMotion;

        Camera cam;
        CameraLayout cfg;
        FocusLayout[] focusPoints;
        Vector3 basePos;
        Vector3 focusOffset;
        Vector3 current;
        float drift;      // 0..1, set by the atmosphere during memory distortion
        float idleSway = 1f;

        public void Init(Camera c, CameraLayout layout, FocusLayout[] focus)
        {
            cam = c;
            cfg = layout;
            focusPoints = focus ?? new FocusLayout[0];
            cam.orthographic = false;
            cam.fieldOfView = cfg.fov;
            cam.nearClipPlane = 0.1f;
            cam.farClipPlane = 200f;
            basePos = new Vector3(0f, cfg.y, cfg.z);
            current = basePos;
            cam.transform.position = basePos;
            cam.transform.rotation = Quaternion.identity;
        }

        public void Focus(string id)
        {
            foreach (var f in focusPoints)
            {
                if (f.id != id) continue;
                focusOffset = new Vector3(f.x, f.y, f.zoom);
                return;
            }
            focusOffset = Vector3.zero; // "wide" or unknown
        }

        public void SetDrift(float d) => drift = d;
        public void SetIdleSway(float s) => idleSway = s;

        void LateUpdate()
        {
            if (cam == null) return;
            Vector3 target = basePos + focusOffset;
            if (!ReducedMotion)
            {
                Vector2 m = SliceInput.MouseViewport() - new Vector2(0.5f, 0.5f);
                target += new Vector3(m.x * cfg.parallax, m.y * cfg.parallax * 0.5f, 0f);
                // a breath of handheld life, almost invisible
                target += new Vector3(Mathf.Sin(Time.time * 0.23f) * 0.03f, Mathf.Sin(Time.time * 0.31f) * 0.02f, 0f) * idleSway;
                // memory slipping: the frame wanders, slowly, and comes back
                target += new Vector3(Mathf.Sin(Time.time * 0.37f) * 0.35f, Mathf.Sin(Time.time * 0.29f) * 0.12f, Mathf.Sin(Time.time * 0.2f) * 0.4f) * drift;
            }
            float speed = ReducedMotion ? 6f : 1.6f;
            current = Vector3.Lerp(current, target, 1f - Mathf.Exp(-speed * Time.deltaTime));
            cam.transform.position = current;
            float roll = ReducedMotion ? 0f : Mathf.Sin(Time.time * 0.41f) * 0.8f * drift;
            cam.transform.rotation = Quaternion.Euler(0f, 0f, roll);
        }
    }
}
