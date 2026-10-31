using UnityEngine;

namespace DrivingSim.Controls
{
    /// <summary>
    /// PUBG-style drag steering: horizontal drags anywhere in the driving area rotate the steering
    /// wheel; there is no on-screen wheel to grab. Rotation accumulates across drags and is not
    /// reset on release. Only one pointer steers at a time; pointers that start on UI never steer.
    /// Drag distance is normalized by screen height so sensitivity is resolution independent.
    /// The drag turns the steering wheel only; the front-wheel angle follows through the steering
    /// ratio and the vehicle's yaw comes from the wheel physics.
    /// </summary>
    public class TouchSteeringController : MonoBehaviour, IDrivingInputSource
    {
        const int NoPointer = int.MinValue;

        [SerializeField] PointerInputHub hub;
        [Tooltip("Steering wheel degrees per drag of one screen height. 100 ≈ 180° per full-width swipe on 16:9, " +
                 "like one hand-over-hand move; center to full lock (540°) takes about three full-width swipes.")]
        [Min(10f)] public float degreesPerScreenHeight = 100f;
        public bool invert;
        [Tooltip("Normalized screen area (0-1) where a steering drag may start.")]
        public Rect drivingArea = new Rect(0f, 0f, 1f, 1f);

        int activePointer = NoPointer;

        public bool IsSteering => activePointer != NoPointer;
        public int ActivePointerId => activePointer;
        public PointerSource ActiveSource { get; private set; }

        public void SetHub(PointerInputHub pointerHub) => hub = pointerHub;

        void OnDisable() => activePointer = NoPointer;

        public void PollInput(float deltaTime, ref DrivingInputFrame frame)
        {
            if (hub == null) return;

            float pixels = 0f;
            bool seen = false;
            var pointers = hub.Pointers;
            for (int i = 0; i < pointers.Count; i++)
            {
                VirtualPointer p = pointers[i];
                if (activePointer == NoPointer && p.Phase == PointerPhase.Began && !p.StartedOverUI && InDrivingArea(p.Position))
                {
                    activePointer = p.Id;
                    ActiveSource = p.Source;
                }
                if (p.Id != activePointer) continue;

                seen = true;
                pixels += p.Delta.x;
                if (p.Phase == PointerPhase.Ended || p.Phase == PointerPhase.Canceled) activePointer = NoPointer;
            }

            // Pointer vanished without an end event (device disconnected, app paused).
            if (!seen) activePointer = NoPointer;

            float height = Mathf.Max(Screen.height, 1);
            frame.SteerDeltaDeg += pixels / height * degreesPerScreenHeight * (invert ? -1f : 1f);
            if (IsSteering) frame.SteerHeld = true;
        }

        bool InDrivingArea(Vector2 screenPosition)
        {
            var normalized = new Vector2(screenPosition.x / Mathf.Max(Screen.width, 1), screenPosition.y / Mathf.Max(Screen.height, 1));
            return drivingArea.Contains(normalized);
        }
    }
}
