using UnityEngine;
using UnityEngine.EventSystems;
#if ENABLE_INPUT_SYSTEM && !ENABLE_LEGACY_INPUT_MANAGER
using UnityEngine.InputSystem;
using UnityEngine.InputSystem.UI;
#endif

namespace DearMe.Platform
{
    /// <summary>
    /// The only place that reads devices directly. Works with either the legacy Input Manager
    /// or the Input System package, depending on Player Settings → Active Input Handling.
    /// Pointer clicks/taps on UI go through the EventSystem; this covers keys and global presses.
    /// </summary>
    public static class InputAdapter
    {
#if ENABLE_INPUT_SYSTEM && !ENABLE_LEGACY_INPUT_MANAGER
        static bool Pressed(Key k) => Keyboard.current != null && Keyboard.current[k].wasPressedThisFrame;

        public static bool AdvancePressed => Pressed(Key.Space) || Pressed(Key.Enter) || Pressed(Key.NumpadEnter);
        /// <summary>Escape on desktop; the Android back button arrives as Escape too.</summary>
        public static bool CancelPressed => Pressed(Key.Escape);

        public static int NumberPressed
        {
            get
            {
                if (Pressed(Key.Digit1) || Pressed(Key.Numpad1)) return 0;
                if (Pressed(Key.Digit2) || Pressed(Key.Numpad2)) return 1;
                if (Pressed(Key.Digit3) || Pressed(Key.Numpad3)) return 2;
                if (Pressed(Key.Digit4) || Pressed(Key.Numpad4)) return 3;
                return -1;
            }
        }

        public static bool PointerPressedThisFrame
        {
            get
            {
                if (Touchscreen.current != null && Touchscreen.current.primaryTouch.press.wasPressedThisFrame) return true;
                return Mouse.current != null && Mouse.current.leftButton.wasPressedThisFrame;
            }
        }

        public static Vector2 PointerPosition
        {
            get
            {
                if (Touchscreen.current != null && Touchscreen.current.primaryTouch.press.isPressed)
                    return Touchscreen.current.primaryTouch.position.ReadValue();
                return Mouse.current != null ? Mouse.current.position.ReadValue() : Vector2.zero;
            }
        }

        public static bool IsTouchDevice => Touchscreen.current != null || Application.isMobilePlatform;

        /// <summary>True when a UI pointer event came from a finger rather than a mouse/pen.</summary>
        public static bool IsTouchEvent(PointerEventData e) =>
            e is ExtendedPointerEventData x && x.pointerType == UIPointerType.Touch;
#else
        public static bool AdvancePressed =>
            UnityEngine.Input.GetKeyDown(KeyCode.Space) || UnityEngine.Input.GetKeyDown(KeyCode.Return) || UnityEngine.Input.GetKeyDown(KeyCode.KeypadEnter);

        /// <summary>Escape on desktop; the Android back button arrives as Escape too.</summary>
        public static bool CancelPressed => UnityEngine.Input.GetKeyDown(KeyCode.Escape);

        public static int NumberPressed
        {
            get
            {
                if (UnityEngine.Input.GetKeyDown(KeyCode.Alpha1) || UnityEngine.Input.GetKeyDown(KeyCode.Keypad1)) return 0;
                if (UnityEngine.Input.GetKeyDown(KeyCode.Alpha2) || UnityEngine.Input.GetKeyDown(KeyCode.Keypad2)) return 1;
                if (UnityEngine.Input.GetKeyDown(KeyCode.Alpha3) || UnityEngine.Input.GetKeyDown(KeyCode.Keypad3)) return 2;
                if (UnityEngine.Input.GetKeyDown(KeyCode.Alpha4) || UnityEngine.Input.GetKeyDown(KeyCode.Keypad4)) return 3;
                return -1;
            }
        }

        // Touches are reported as mouse button 0 too (Input.simulateMouseWithTouches), so one check covers both.
        public static bool PointerPressedThisFrame => UnityEngine.Input.GetMouseButtonDown(0);

        public static Vector2 PointerPosition => UnityEngine.Input.mousePosition;

        public static bool IsTouchDevice => UnityEngine.Input.touchSupported || Application.isMobilePlatform;

        /// <summary>True when a UI pointer event came from a finger (StandaloneInputModule: touches have ids ≥ 0, mouse buttons are negative).</summary>
        public static bool IsTouchEvent(PointerEventData e) => e.pointerId >= 0;
#endif
    }
}
