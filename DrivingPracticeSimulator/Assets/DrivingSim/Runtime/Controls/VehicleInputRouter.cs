using System.Collections.Generic;
using DrivingSim.Vehicle;
using UnityEngine;

namespace DrivingSim.Controls
{
    /// <summary>
    /// Polls every input source once per frame, merges them and forwards the result to the vehicle.
    /// Runs before <see cref="VehicleController"/> so steering is applied in the same frame.
    /// Brake override: when any source brakes, throttle is cut so drive torque is suppressed.
    /// While <see cref="DrivingInputGate"/> blocks driving, the brake is held and nothing else is sent.
    /// </summary>
    [DefaultExecutionOrder(-50)]
    public class VehicleInputRouter : MonoBehaviour
    {
        [SerializeField] VehicleController vehicle;
        [Tooltip("Components implementing IDrivingInputSource. If empty, sources on this GameObject and its children are used.")]
        [SerializeField] MonoBehaviour[] sources = new MonoBehaviour[0];
        [SerializeField] VehicleAccessories accessories;

        [Tooltip("Brake beats accelerator: throttle is cut while the brake is above the threshold.")]
        public bool brakeOverridesThrottle = true;
        [Range(0.01f, 0.5f)] public float brakeOverrideThreshold = 0.05f;

        readonly List<IDrivingInputSource> activeSources = new List<IDrivingInputSource>();

        public VehicleController Vehicle => vehicle;
        public DrivingInputFrame LastFrame { get; private set; }

        public void SetVehicle(VehicleController target) => vehicle = target;
        public void SetAccessories(VehicleAccessories target) => accessories = target;
        public bool ThrottleSuppressedByBrake { get; private set; }

        public void RegisterSource(IDrivingInputSource source)
        {
            if (source != null && !activeSources.Contains(source)) activeSources.Add(source);
        }

        public void UnregisterSource(IDrivingInputSource source) => activeSources.Remove(source);

        void Awake()
        {
            foreach (MonoBehaviour behaviour in sources)
            {
                if (behaviour is IDrivingInputSource source) RegisterSource(source);
                else if (behaviour != null) Debug.LogWarning($"{behaviour.name} does not implement {nameof(IDrivingInputSource)}.", behaviour);
            }

            if (activeSources.Count == 0)
            {
                foreach (IDrivingInputSource source in GetComponentsInChildren<IDrivingInputSource>(true))
                    RegisterSource(source);
            }
        }

        void Update()
        {
            var frame = new DrivingInputFrame();
            float dt = Time.deltaTime;

            if (DrivingInputGate.DrivingBlocked)
            {
                frame.Brake = 1f;
            }
            else
            {
                foreach (IDrivingInputSource source in activeSources)
                {
                    if (source is Behaviour behaviour && !behaviour.isActiveAndEnabled) continue;
                    source.PollInput(dt, ref frame);
                }
            }

            frame.Throttle = Mathf.Clamp01(frame.Throttle);
            frame.Brake = Mathf.Clamp01(frame.Brake);
            ThrottleSuppressedByBrake = brakeOverridesThrottle && frame.Brake >= brakeOverrideThreshold && frame.Throttle > 0f;
            if (ThrottleSuppressedByBrake) frame.Throttle = 0f;
            LastFrame = frame;

            if (vehicle != null) vehicle.SetInput(frame);
            if (accessories != null) accessories.ApplyInput(frame);
        }
    }
}
