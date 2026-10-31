#if ENABLE_INPUT_SYSTEM
using UnityEngine.InputSystem;
#endif

namespace DrivingSim.Controls
{
    public enum KeyId
    {
        W, A, S, D,
        Up, Down, Left, Right,
        LeftShift, Space, Backspace,
        Digit1, Digit2, Digit3, Digit4,
        Q, E, C, V, F1,
        T, Z, X, LeftBracket, RightBracket,
    }

    /// <summary>
    /// Keyboard access that works with the Input System package (preferred) or the legacy
    /// Input Manager, whichever the project's Active Input Handling enables.
    /// </summary>
    public static class KeyboardShim
    {
        public static bool IsDown(KeyId key)
        {
#if ENABLE_INPUT_SYSTEM
            Keyboard keyboard = Keyboard.current;
            return keyboard != null && keyboard[ToKey(key)].isPressed;
#elif ENABLE_LEGACY_INPUT_MANAGER
            return UnityEngine.Input.GetKey(ToKeyCode(key));
#else
            return false;
#endif
        }

        public static bool WasPressed(KeyId key)
        {
#if ENABLE_INPUT_SYSTEM
            Keyboard keyboard = Keyboard.current;
            return keyboard != null && keyboard[ToKey(key)].wasPressedThisFrame;
#elif ENABLE_LEGACY_INPUT_MANAGER
            return UnityEngine.Input.GetKeyDown(ToKeyCode(key));
#else
            return false;
#endif
        }

#if ENABLE_INPUT_SYSTEM
        static Key ToKey(KeyId key)
        {
            switch (key)
            {
                case KeyId.W: return Key.W;
                case KeyId.A: return Key.A;
                case KeyId.S: return Key.S;
                case KeyId.D: return Key.D;
                case KeyId.Up: return Key.UpArrow;
                case KeyId.Down: return Key.DownArrow;
                case KeyId.Left: return Key.LeftArrow;
                case KeyId.Right: return Key.RightArrow;
                case KeyId.LeftShift: return Key.LeftShift;
                case KeyId.Space: return Key.Space;
                case KeyId.Backspace: return Key.Backspace;
                case KeyId.Digit1: return Key.Digit1;
                case KeyId.Digit2: return Key.Digit2;
                case KeyId.Digit3: return Key.Digit3;
                case KeyId.Digit4: return Key.Digit4;
                case KeyId.Q: return Key.Q;
                case KeyId.E: return Key.E;
                case KeyId.C: return Key.C;
                case KeyId.V: return Key.V;
                case KeyId.F1: return Key.F1;
                case KeyId.T: return Key.T;
                case KeyId.Z: return Key.Z;
                case KeyId.X: return Key.X;
                case KeyId.LeftBracket: return Key.LeftBracket;
                case KeyId.RightBracket: return Key.RightBracket;
                default: return Key.None;
            }
        }
#elif ENABLE_LEGACY_INPUT_MANAGER
        static UnityEngine.KeyCode ToKeyCode(KeyId key)
        {
            switch (key)
            {
                case KeyId.W: return UnityEngine.KeyCode.W;
                case KeyId.A: return UnityEngine.KeyCode.A;
                case KeyId.S: return UnityEngine.KeyCode.S;
                case KeyId.D: return UnityEngine.KeyCode.D;
                case KeyId.Up: return UnityEngine.KeyCode.UpArrow;
                case KeyId.Down: return UnityEngine.KeyCode.DownArrow;
                case KeyId.Left: return UnityEngine.KeyCode.LeftArrow;
                case KeyId.Right: return UnityEngine.KeyCode.RightArrow;
                case KeyId.LeftShift: return UnityEngine.KeyCode.LeftShift;
                case KeyId.Space: return UnityEngine.KeyCode.Space;
                case KeyId.Backspace: return UnityEngine.KeyCode.Backspace;
                case KeyId.Digit1: return UnityEngine.KeyCode.Alpha1;
                case KeyId.Digit2: return UnityEngine.KeyCode.Alpha2;
                case KeyId.Digit3: return UnityEngine.KeyCode.Alpha3;
                case KeyId.Digit4: return UnityEngine.KeyCode.Alpha4;
                case KeyId.Q: return UnityEngine.KeyCode.Q;
                case KeyId.E: return UnityEngine.KeyCode.E;
                case KeyId.C: return UnityEngine.KeyCode.C;
                case KeyId.V: return UnityEngine.KeyCode.V;
                case KeyId.F1: return UnityEngine.KeyCode.F1;
                case KeyId.T: return UnityEngine.KeyCode.T;
                case KeyId.Z: return UnityEngine.KeyCode.Z;
                case KeyId.X: return UnityEngine.KeyCode.X;
                case KeyId.LeftBracket: return UnityEngine.KeyCode.LeftBracket;
                case KeyId.RightBracket: return UnityEngine.KeyCode.RightBracket;
                default: return UnityEngine.KeyCode.None;
            }
        }
#endif
    }
}
