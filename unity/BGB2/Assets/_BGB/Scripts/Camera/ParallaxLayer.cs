using UnityEngine;

namespace BGB2
{
    /// <summary>Camera-relative parallax. factor 1 = moves with the world, below 1 = slower (distant), above 1 = faster (foreground).</summary>
    public class ParallaxLayer : MonoBehaviour
    {
        public Transform cam;
        [Range(0f, 1.5f)] public float factor = 1f;
        public bool vertical;

        Vector3 origin;
        Vector3 camOrigin;

        void Start()
        {
            if (cam == null && Camera.main != null) cam = Camera.main.transform;
            origin = transform.position;
            camOrigin = cam != null ? cam.position : Vector3.zero;
        }

        void LateUpdate()
        {
            if (cam == null) return;
            Vector3 d = cam.position - camOrigin;
            transform.position = origin + new Vector3(d.x * (1f - factor), vertical ? d.y * (1f - factor) : 0f, 0f);
        }
    }
}
