using System;
using DrivingSim.Controls;
using DrivingSim.Vehicle;
using UnityEngine;

namespace DrivingSim.Cameras
{
    public enum CameraViewMode
    {
        Chase,
        Cockpit,
        TopDown,
    }

    /// <summary>
    /// Owns the main camera's view mode. Chase and top-down are delegated to
    /// <see cref="VehicleFollowCamera"/>; the cockpit view is driven here from the cockpit eye anchor.
    /// Camera look uses its own buttons/keys and never the steering drag gesture.
    /// </summary>
    [RequireComponent(typeof(Camera))]
    [DefaultExecutionOrder(100)]
    public class CameraController : MonoBehaviour
    {
        const string FovPrefsKey = "DrivingSim.CockpitFov";

        [SerializeField] VehicleController vehicle;
        [SerializeField] CockpitRig cockpit;
        [SerializeField] VehicleFollowCamera follow;
        [SerializeField] CameraViewMode mode = CameraViewMode.Chase;

        [Header("Cockpit view")]
        [Range(40f, 100f)] public float cockpitFov = 65f;
        [Range(30f, 80f)] public float minCockpitFov = 50f;
        [Range(60f, 110f)] public float maxCockpitFov = 85f;
        [Min(1f)] public float fovStep = 5f;
        public bool rememberFov = true;
        [Tooltip("Downward head pitch (deg) in the cockpit view.")]
        [Range(-20f, 20f)] public float cockpitPitchDeg = 4f;
        [Tooltip("Near clip in the cockpit so the steering wheel isn't cut off.")]
        [Min(0.01f)] public float cockpitNearClip = 0.03f;

        [Header("Look left / right")]
        [Range(10f, 120f)] public float lookYawDeg = 70f;
        [Min(0.1f)] public float lookSharpness = 9f;

        [Header("Chase / top-down")]
        [Range(30f, 90f)] public float chaseFov = 60f;
        [Min(0.01f)] public float chaseNearClip = 0.1f;

        Camera cam;
        float lookYaw;
        bool lookLeft;
        bool lookRight;
        bool started;

        public event Action<CameraViewMode> ModeChanged;
        public event Action<float> CockpitFovChanged;

        public CameraViewMode Mode => mode;
        public bool HasCockpit => cockpit != null;

        public void Bind(VehicleController target, CockpitRig rig, VehicleFollowCamera followCamera)
        {
            vehicle = target;
            cockpit = rig;
            follow = followCamera;
        }

        void Awake()
        {
            cam = GetComponent<Camera>();
            if (follow == null) follow = GetComponent<VehicleFollowCamera>();
            if (rememberFov)
            {
                try { cockpitFov = PlayerPrefs.GetFloat(FovPrefsKey, cockpitFov); }
                catch (Exception) { /* PlayerPrefs unavailable: keep the default */ }
            }
            cockpitFov = Mathf.Clamp(cockpitFov, minCockpitFov, maxCockpitFov);
        }

        void Start()
        {
            started = true;
            ApplyMode();
        }

        public void SetMode(CameraViewMode value)
        {
            if (value == CameraViewMode.Cockpit && cockpit == null) value = CameraViewMode.Chase;
            if (value == mode) return;
            mode = value;
            if (started) ApplyMode();
        }

        /// <summary>First-person ↔ third-person. From top-down, returns to the chase view.</summary>
        public void ToggleFirstPerson() => SetMode(mode == CameraViewMode.Cockpit ? CameraViewMode.Chase : CameraViewMode.Cockpit);

        public void ToggleTopDown() => SetMode(mode == CameraViewMode.TopDown ? CameraViewMode.Chase : CameraViewMode.TopDown);

        public void SetLookLeft(bool held) => lookLeft = held;
        public void SetLookRight(bool held) => lookRight = held;

        public void AdjustCockpitFov(float delta) => SetCockpitFov(cockpitFov + delta);

        public void SetCockpitFov(float fov)
        {
            float clamped = Mathf.Clamp(fov, minCockpitFov, maxCockpitFov);
            if (Mathf.Approximately(clamped, cockpitFov)) return;
            cockpitFov = clamped;
            if (rememberFov)
            {
                try { PlayerPrefs.SetFloat(FovPrefsKey, cockpitFov); }
                catch (Exception) { /* not persisted */ }
            }
            CockpitFovChanged?.Invoke(cockpitFov);
        }

        void ApplyMode()
        {
            bool cockpitView = mode == CameraViewMode.Cockpit;
            lookYaw = 0f;

            if (follow != null)
            {
                follow.enabled = !cockpitView;
                if (!cockpitView)
                {
                    follow.Mode = mode == CameraViewMode.TopDown ? VehicleFollowCamera.ViewMode.TopDown : VehicleFollowCamera.ViewMode.Chase;
                    follow.Snap();
                }
            }

            if (cockpit != null)
            {
                cockpit.SetInteriorVisible(cockpitView);
                cockpit.SetMirrorsLive(cockpitView);
            }

            cam.nearClipPlane = cockpitView ? cockpitNearClip : chaseNearClip;
            cam.fieldOfView = cockpitView ? cockpitFov : chaseFov;
            ModeChanged?.Invoke(mode);
        }

        void Update()
        {
            if (KeyboardShim.WasPressed(KeyId.V)) ToggleFirstPerson();
            if (KeyboardShim.WasPressed(KeyId.T)) ToggleTopDown();
            if (KeyboardShim.WasPressed(KeyId.LeftBracket)) AdjustCockpitFov(-fovStep);
            if (KeyboardShim.WasPressed(KeyId.RightBracket)) AdjustCockpitFov(fovStep);
        }

        void LateUpdate()
        {
            if (mode != CameraViewMode.Cockpit || cockpit == null || cockpit.EyeAnchor == null) return;

            bool left = lookLeft || KeyboardShim.IsDown(KeyId.Z);
            bool right = lookRight || KeyboardShim.IsDown(KeyId.X);
            float target = (right ? lookYawDeg : 0f) - (left ? lookYawDeg : 0f);
            lookYaw = Mathf.Lerp(lookYaw, target, 1f - Mathf.Exp(-lookSharpness * Time.deltaTime));

            Transform eye = cockpit.EyeAnchor;
            // The eye is parented to the interpolated vehicle root, so this follows the car without jitter.
            transform.SetPositionAndRotation(eye.position, eye.rotation * Quaternion.Euler(cockpitPitchDeg, lookYaw, 0f));
            cam.fieldOfView = cockpitFov;
        }
    }
}
