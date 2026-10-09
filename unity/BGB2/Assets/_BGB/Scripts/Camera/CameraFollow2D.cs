using UnityEngine;

namespace BGB2
{
    public class CameraFollow2D : MonoBehaviour
    {
        public Transform target;
        public float minX = 9.6f, maxX = 28.5f;
        public float smoothTime = 0.22f;
        float vel;

        void LateUpdate()
        {
            if (target == null) return;
            var p = transform.position;
            p.x = Mathf.SmoothDamp(p.x, Mathf.Clamp(target.position.x, minX, maxX), ref vel, smoothTime);
            transform.position = p;
        }
    }
}
