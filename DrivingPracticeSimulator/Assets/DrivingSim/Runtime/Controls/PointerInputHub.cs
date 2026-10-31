using System.Collections.Generic;
using UnityEngine;
#if ENABLE_INPUT_SYSTEM
using UnityEngine.InputSystem;
using UnityEngine.InputSystem.Controls;
#endif

namespace DrivingSim.Controls
{
    public enum PointerSource
    {
        Touch,
        LeftMouse,
        MiddleMouse,
    }

    public enum PointerPhase
    {
        Began,
        Moved,
        Stationary,
        Ended,
        Canceled,
    }

    public struct VirtualPointer
    {
        public int Id;
        public PointerSource Source;
        public PointerPhase Phase;
        public Vector2 Position;
        public Vector2 Delta;
        /// <summary>True if the pointer went down on a UI control; such a pointer belongs to the UI for its whole life.</summary>
        public bool StartedOverUI;
    }

    /// <summary>
    /// Input abstraction for screen pointers. Each frame it lists every active pointer from the
    /// touchscreen and, optionally, the left and middle mouse buttons, with stable ids and phases.
    /// The middle button is a simulated touch: down = began, held = moved/stationary, up = ended.
    /// The scroll wheel is never read. Middle presses that start on UI are routed to uGUI by
    /// <see cref="MiddleMouseUIRouter"/>; touch and left mouse reach uGUI through its normal input module.
    /// </summary>
    [DefaultExecutionOrder(-100)]
    public class PointerInputHub : MonoBehaviour
    {
        public const int LeftMousePointerId = 1_000_001;
        public const int MiddleMousePointerId = 1_000_002;

        [Tooltip("Touchscreen fingers act as pointers.")]
        public bool touchscreenEnabled = true;
        [Tooltip("Left mouse button acts as a touch (off by default so left-click keeps its normal desktop behavior).")]
        public bool leftMouseAsTouch;
        [Tooltip("Middle mouse button (wheel click) acts as a simulated touch.")]
        public bool middleMouseAsTouch = true;
        [Tooltip("Middle presses on UI controls activate them through the custom router.")]
        public bool middleMouseUIRouting = true;

        readonly List<VirtualPointer> pointers = new List<VirtualPointer>(8);
        readonly Dictionary<int, bool> startedOverUI = new Dictionary<int, bool>();
        readonly MiddleMouseUIRouter middleRouter = new MiddleMouseUIRouter(MiddleMousePointerId);
        Vector2 lastLeftPosition;
        Vector2 lastMiddlePosition;
        bool leftDown;
        bool middleDown;

        public IReadOnlyList<VirtualPointer> Pointers => pointers;

        void Update()
        {
            pointers.Clear();
#if ENABLE_INPUT_SYSTEM
            if (touchscreenEnabled) PollTouchscreen();
            Mouse mouse = Mouse.current;
            if (mouse != null)
            {
                if (leftMouseAsTouch) PollMouseButton(mouse, mouse.leftButton, LeftMousePointerId, PointerSource.LeftMouse, ref leftDown, ref lastLeftPosition);
                else ReleaseStale(ref leftDown, LeftMousePointerId, PointerSource.LeftMouse, lastLeftPosition);

                if (middleMouseAsTouch) PollMouseButton(mouse, mouse.middleButton, MiddleMousePointerId, PointerSource.MiddleMouse, ref middleDown, ref lastMiddlePosition);
                else ReleaseStale(ref middleDown, MiddleMousePointerId, PointerSource.MiddleMouse, lastMiddlePosition);
            }
#endif
        }

        void OnDisable()
        {
            middleRouter.Cancel();
            startedOverUI.Clear();
            leftDown = middleDown = false;
            pointers.Clear();
        }

        void Add(int id, PointerSource source, PointerPhase phase, Vector2 position, Vector2 delta)
        {
            if (phase == PointerPhase.Began) startedOverUI[id] = UIHitTest.IsOverUI(position);
            bool overUI = startedOverUI.TryGetValue(id, out bool v) && v;
            pointers.Add(new VirtualPointer { Id = id, Source = source, Phase = phase, Position = position, Delta = delta, StartedOverUI = overUI });
            if (phase == PointerPhase.Ended || phase == PointerPhase.Canceled) startedOverUI.Remove(id);
        }

        void ReleaseStale(ref bool down, int id, PointerSource source, Vector2 position)
        {
            if (!down) return;
            down = false;
            Add(id, source, PointerPhase.Canceled, position, Vector2.zero);
            if (source == PointerSource.MiddleMouse) middleRouter.Cancel();
        }

#if ENABLE_INPUT_SYSTEM
        void PollTouchscreen()
        {
            Touchscreen screen = Touchscreen.current;
            if (screen == null) return;
            foreach (TouchControl touch in screen.touches)
            {
                UnityEngine.InputSystem.TouchPhase phase = touch.phase.ReadValue();
                if (phase == UnityEngine.InputSystem.TouchPhase.None) continue;
                Add(touch.touchId.ReadValue(), PointerSource.Touch, Map(phase), touch.position.ReadValue(), touch.delta.ReadValue());
            }
        }

        static PointerPhase Map(UnityEngine.InputSystem.TouchPhase phase)
        {
            switch (phase)
            {
                case UnityEngine.InputSystem.TouchPhase.Began: return PointerPhase.Began;
                case UnityEngine.InputSystem.TouchPhase.Moved: return PointerPhase.Moved;
                case UnityEngine.InputSystem.TouchPhase.Ended: return PointerPhase.Ended;
                case UnityEngine.InputSystem.TouchPhase.Canceled: return PointerPhase.Canceled;
                default: return PointerPhase.Stationary;
            }
        }

        void PollMouseButton(Mouse mouse, ButtonControl button, int id, PointerSource source, ref bool down, ref Vector2 last)
        {
            Vector2 position = mouse.position.ReadValue();
            bool middle = source == PointerSource.MiddleMouse;

            if (button.wasPressedThisFrame && !down)
            {
                down = true;
                last = position;
                Add(id, source, PointerPhase.Began, position, Vector2.zero);
                if (middle && middleMouseUIRouting && startedOverUI.TryGetValue(id, out bool overUI) && overUI)
                    middleRouter.Press(position);
                return;
            }

            if (!down) return;

            Vector2 delta = position - last;
            last = position;
            if (!button.isPressed)
            {
                down = false;
                Add(id, source, PointerPhase.Ended, position, delta);
                if (middle) middleRouter.Release(position);
                return;
            }

            Add(id, source, delta.sqrMagnitude > 0f ? PointerPhase.Moved : PointerPhase.Stationary, position, delta);
            if (middle) middleRouter.Move(position);
        }
#endif
    }
}
