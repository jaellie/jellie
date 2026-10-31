using DrivingSim.Vehicle;
using UnityEngine;

namespace DrivingSim.Cameras
{
    /// <summary>
    /// Third-person follow camera that tracks the vehicle's yaw only, so body roll and pitch
    /// don't shake the view. <see cref="CameraController"/> chooses the mode and enables this
    /// component only for the chase and top-down views.
    /// </summary>
    [RequireComponent(typeof(Camera))]
    public class VehicleFollowCamera : MonoBehaviour
    {
        public enum ViewMode
        {
            Chase,
            TopDown,
        }

        [SerializeField] VehicleController target;
        [SerializeField] ViewMode mode = ViewMode.Chase;

        [Header("Chase")]
        [Min(1f)] public float distance = 6.5f;
        [Min(0f)] public float height = 2.6f;
        public float lookAtHeight = 1f;
        public float lookAhead = 2f;

        [Header("Top-down")]
        [Min(2f)] public float topDownHeight = 22f;

        [Header("Smoothing")]
        [Min(0.1f)] public float positionSharpness = 8f;
        [Min(0.1f)] public float rotationSharpness = 5f;

        float yaw;

        public void SetTarget(VehicleController vehicle)
        {
            target = vehicle;
            Snap();
        }

        public VehicleController Target => target;

        public ViewMode Mode
        {
            get => mode;
            set => mode = value;
        }

        void Start() => Snap();

        void LateUpdate()
        {
            if (target == null) return;
            float dt = Time.deltaTime;
            Transform t = target.transform;

            yaw = Mathf.LerpAngle(yaw, t.eulerAngles.y, 1f - Mathf.Exp(-rotationSharpness * dt));
            ComputePose(t, yaw, out Vector3 position, out Quaternion rotation);

            transform.position = Vector3.Lerp(transform.position, position, 1f - Mathf.Exp(-positionSharpness * dt));
            transform.rotation = mode == ViewMode.TopDown
                ? rotation
                : Quaternion.LookRotation(LookPoint(t, yaw) - transform.position, Vector3.up);
        }

        public void Snap()
        {
            if (target == null) return;
            Transform t = target.transform;
            yaw = t.eulerAngles.y;
            ComputePose(t, yaw, out Vector3 position, out Quaternion rotation);
            transform.SetPositionAndRotation(position, rotation);
        }

        void ComputePose(Transform t, float yawDeg, out Vector3 position, out Quaternion rotation)
        {
            Quaternion yawRotation = Quaternion.Euler(0f, yawDeg, 0f);
            if (mode == ViewMode.TopDown)
            {
                position = t.position + Vector3.up * topDownHeight;
                rotation = Quaternion.LookRotation(Vector3.down, yawRotation * Vector3.forward);
                return;
            }

            position = t.position + yawRotation * new Vector3(0f, height, -distance);
            rotation = Quaternion.LookRotation(LookPoint(t, yawDeg) - position, Vector3.up);
        }

        Vector3 LookPoint(Transform t, float yawDeg)
        {
            return t.position + Vector3.up * lookAtHeight + Quaternion.Euler(0f, yawDeg, 0f) * Vector3.forward * lookAhead;
        }
    }
}
