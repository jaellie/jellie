using UnityEngine;

namespace DrivingSim.Cameras
{
    /// <summary>North-up orthographic map camera rendering to a small texture at a reduced rate.</summary>
    [RequireComponent(typeof(Camera))]
    public class MinimapCamera : MonoBehaviour
    {
        [SerializeField] Transform target;
        [Min(5f)] public float viewRadiusM = 40f;
        [Min(5f)] public float heightM = 80f;
        [Min(32)] public int textureSize = 256;
        [Min(1)] public int renderInterval = 3;

        Camera cam;
        RenderTexture texture;

        public RenderTexture Texture => texture;
        public Transform Target => target;

        public void SetTarget(Transform value) => target = value;

        void Awake()
        {
            cam = GetComponent<Camera>();
            cam.orthographic = true;
            cam.orthographicSize = viewRadiusM;
            cam.nearClipPlane = 1f;
            cam.farClipPlane = heightM + 20f;
            cam.depth = -20f;
            cam.allowHDR = false;
            cam.allowMSAA = false;
            cam.clearFlags = CameraClearFlags.SolidColor;
            cam.backgroundColor = new Color(0.16f, 0.18f, 0.2f);
            texture = new RenderTexture(textureSize, textureSize, 16) { name = "MinimapRT" };
            texture.Create();
            cam.targetTexture = texture;
        }

        void LateUpdate()
        {
            if (target == null) return;
            Vector3 p = target.position;
            transform.SetPositionAndRotation(new Vector3(p.x, p.y + heightM, p.z), Quaternion.Euler(90f, 0f, 0f));
            cam.orthographicSize = viewRadiusM;
            cam.enabled = Time.frameCount % renderInterval == 0;
        }

        void OnDestroy()
        {
            if (cam != null) cam.targetTexture = null;
            if (texture != null)
            {
                texture.Release();
                Destroy(texture);
            }
        }
    }
}
