// Signature stubs for com.unity.inputsystem, used only by the ENABLE_INPUT_SYSTEM type-check pass.
#pragma warning disable CS1591
namespace UnityEngine.InputSystem
{
    using UnityEngine.InputSystem.Controls;

    public enum Key { Space, Enter, NumpadEnter, Escape, Digit1, Digit2, Digit3, Digit4, Numpad1, Numpad2, Numpad3, Numpad4 }

    public class Keyboard
    {
        public static Keyboard current => null;
        public KeyControl this[Key key] => null;
    }

    public class Mouse
    {
        public static Mouse current => null;
        public ButtonControl leftButton => null;
        public Vector2Control position => null;
    }

    public class Touchscreen
    {
        public static Touchscreen current => null;
        public TouchControl primaryTouch => null;
    }
}

namespace UnityEngine.InputSystem.Controls
{
    public class ButtonControl
    {
        public bool wasPressedThisFrame => false;
        public bool isPressed => false;
    }
    public class KeyControl : ButtonControl { }
    public class TouchPressControl : ButtonControl { }
    public class Vector2Control { public Vector2 ReadValue() => default; }
    public class TouchControl
    {
        public TouchPressControl press => null;
        public Vector2Control position => null;
    }
}

namespace UnityEngine.InputSystem.UI
{
    public class InputSystemUIInputModule : UnityEngine.EventSystems.BaseInputModule { }
    public enum UIPointerType { None, MouseOrPen, Touch, Tracked }
    public class ExtendedPointerEventData : UnityEngine.EventSystems.PointerEventData
    {
        public UIPointerType pointerType { get; set; }
    }
}
