using DrivingSim.Core;
using UnityEngine;

namespace DrivingSim.Controls
{
    public enum SteeringGestureMode
    {
        /// <summary>Move the finger/mouse in circles around the steering center, like turning a real wheel.</summary>
        Circular,
        /// <summary>Legacy: horizontal drag distance turns the wheel.</summary>
        HorizontalDrag,
    }

    /// <summary>
    /// Pointer steering without grabbing an on-screen wheel model. In Circular mode a gesture must
    /// start inside the steering ring (not on UI); after that its angle around the ring center is
    /// tracked anywhere on screen and accumulated into the steering-wheel angle, including full
    /// revolutions. Releasing keeps the angle; the next gesture continues from it. Only one pointer
    /// steers at a time. The steering wheel angle then maps to the front wheels through the steering
    /// ratio, and the vehicle's yaw comes from the wheel physics.
    /// </summary>
    public class TouchSteeringController : MonoBehaviour, IDrivingInputSource
    {
        const int NoPointer = int.MinValue;

        [SerializeField] PointerInputHub hub;
        public SteeringGestureMode mode = SteeringGestureMode.Circular;

        [Header("Circular gesture")]
        [Tooltip("Steering center in normalized screen coordinates (0-1, origin bottom-left).")]
        public Vector2 circleCenter = new Vector2(0.5f, 0.43f);
        [Tooltip("Radius of the steering ring as a fraction of screen height. Gestures must start inside it.")]
        [Range(0.05f, 0.5f)] public float circleRadius = 0.27f;
        [Tooltip("Inner dead zone as a fraction of the ring radius; angles there are unstable and ignored.")]
        [Range(0f, 0.8f)] public float deadZoneFraction = 0.22f;
        [Tooltip("Wheel degrees per degree of pointer rotation. 1 = one circle turns the wheel once.")]
        [Range(0.25f, 3f)] public float angularGain = 1f;
        [Tooltip("Larger single-sample steps are treated as tracking jumps and discarded.")]
        [Range(20f, 170f)] public float maxStepDeg = 90f;

        [Header("Horizontal drag (legacy mode)")]
        [Min(10f)] public float degreesPerScreenHeight = 100f;
        public bool invert;
        [Tooltip("Normalized screen area (0-1) where a horizontal steering drag may start.")]
        public Rect drivingArea = new Rect(0f, 0f, 1f, 1f);

        readonly CircularSteeringGesture gesture = new CircularSteeringGesture { YAxisUp = true };
        int activePointer = NoPointer;

        public bool IsSteering => activePointer != NoPointer;
        public int ActivePointerId => activePointer;
        public PointerSource ActiveSource { get; private set; }

        /// <summary>Ring center in screen pixels.</summary>
        public Vector2 CenterPixels => new Vector2(circleCenter.x * Screen.width, circleCenter.y * Screen.height);
        /// <summary>Ring radius in screen pixels.</summary>
        public float RadiusPixels => circleRadius * Screen.height;

        public void SetHub(PointerInputHub pointerHub) => hub = pointerHub;

        void OnDisable() => Release();

        void Release()
        {
            activePointer = NoPointer;
            gesture.Reset();
        }

        public void PollInput(float deltaTime, ref DrivingInputFrame frame)
        {
            if (hub == null) return;

            gesture.Gain = angularGain;
            gesture.MaxStepDeg = maxStepDeg;
            gesture.DeadZoneRadius = RadiusPixels * deadZoneFraction;
            Vector2 center = CenterPixels;

            float delta = 0f;
            bool seen = false;
            var pointers = hub.Pointers;
            for (int i = 0; i < pointers.Count; i++)
            {
                VirtualPointer p = pointers[i];
                if (activePointer == NoPointer && p.Phase == PointerPhase.Began && !p.StartedOverUI && CanStart(p.Position, center))
                {
                    activePointer = p.Id;
                    ActiveSource = p.Source;
                    gesture.Reset();
                }
                if (p.Id != activePointer) continue;

                seen = true;
                delta += mode == SteeringGestureMode.Circular
                    ? gesture.Sample(p.Position.x, p.Position.y, center.x, center.y)
                    : p.Delta.x / Mathf.Max(Screen.height, 1) * degreesPerScreenHeight * (invert ? -1f : 1f);
                if (p.Phase == PointerPhase.Ended || p.Phase == PointerPhase.Canceled) Release();
            }

            // Pointer vanished without an end event (device disconnected, app paused).
            if (!seen && IsSteering) Release();

            frame.SteerDeltaDeg += delta;
            if (IsSteering) frame.SteerHeld = true;
        }

        bool CanStart(Vector2 position, Vector2 center)
        {
            if (mode == SteeringGestureMode.Circular) return (position - center).sqrMagnitude <= RadiusPixels * RadiusPixels;
            var normalized = new Vector2(position.x / Mathf.Max(Screen.width, 1), position.y / Mathf.Max(Screen.height, 1));
            return drivingArea.Contains(normalized);
        }
    }
}
