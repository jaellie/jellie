// SliceInput.cs — keyboard/mouse that works with either Unity input setting.
// Unity 6 projects usually use the new Input System; older settings use the
// old Input Manager. The #if picks whichever this project has enabled.
using UnityEngine;
#if ENABLE_INPUT_SYSTEM
using UnityEngine.InputSystem;
#endif

namespace BigGreenBear
{
    public static class SliceInput
    {
        public static bool Advance()
        {
#if ENABLE_INPUT_SYSTEM
            var k = Keyboard.current;
            return k != null && (k.enterKey.wasPressedThisFrame || k.numpadEnterKey.wasPressedThisFrame || k.spaceKey.wasPressedThisFrame);
#else
            return Input.GetKeyDown(KeyCode.Return) || Input.GetKeyDown(KeyCode.KeypadEnter) || Input.GetKeyDown(KeyCode.Space);
#endif
        }

        // 1..9 -> 0..8, or -1
        public static int Digit()
        {
#if ENABLE_INPUT_SYSTEM
            var k = Keyboard.current;
            if (k == null) return -1;
            Key[] keys = { Key.Digit1, Key.Digit2, Key.Digit3, Key.Digit4, Key.Digit5, Key.Digit6, Key.Digit7, Key.Digit8, Key.Digit9 };
            for (int i = 0; i < keys.Length; i++) if (k[keys[i]].wasPressedThisFrame) return i;
            return -1;
#else
            for (int i = 0; i < 9; i++) if (Input.GetKeyDown(KeyCode.Alpha1 + i)) return i;
            return -1;
#endif
        }

        public static bool Language()
        {
#if ENABLE_INPUT_SYSTEM
            return Keyboard.current != null && Keyboard.current.lKey.wasPressedThisFrame;
#else
            return Input.GetKeyDown(KeyCode.L);
#endif
        }

        public static bool Motion()
        {
#if ENABLE_INPUT_SYSTEM
            return Keyboard.current != null && Keyboard.current.mKey.wasPressedThisFrame;
#else
            return Input.GetKeyDown(KeyCode.M);
#endif
        }

        public static bool Click()
        {
#if ENABLE_INPUT_SYSTEM
            return Mouse.current != null && Mouse.current.leftButton.wasPressedThisFrame;
#else
            return Input.GetMouseButtonDown(0);
#endif
        }

        // Mouse position in screen pixels.
        public static Vector2 MouseScreen()
        {
#if ENABLE_INPUT_SYSTEM
            return Mouse.current != null ? Mouse.current.position.ReadValue() : new Vector2(-9999f, -9999f);
#else
            Vector3 mp = Input.mousePosition;
            return new Vector2(mp.x, mp.y);
#endif
        }

        public static bool Notebook()
        {
#if ENABLE_INPUT_SYSTEM
            return Keyboard.current != null && (Keyboard.current.nKey.wasPressedThisFrame || Keyboard.current.tabKey.wasPressedThisFrame);
#else
            return Input.GetKeyDown(KeyCode.N) || Input.GetKeyDown(KeyCode.Tab);
#endif
        }

        public static bool Quit()
        {
#if ENABLE_INPUT_SYSTEM
            return Keyboard.current != null && Keyboard.current.escapeKey.wasPressedThisFrame;
#else
            return Input.GetKeyDown(KeyCode.Escape);
#endif
        }

        public static bool Restart()
        {
#if ENABLE_INPUT_SYSTEM
            return Keyboard.current != null && Keyboard.current.rKey.wasPressedThisFrame;
#else
            return Input.GetKeyDown(KeyCode.R);
#endif
        }

        // Mouse position in 0..1 viewport space (0.5,0.5 when unknown).
        public static Vector2 MouseViewport()
        {
            Vector2 p;
#if ENABLE_INPUT_SYSTEM
            if (Mouse.current == null) return new Vector2(0.5f, 0.5f);
            p = Mouse.current.position.ReadValue();
#else
            Vector3 mp = Input.mousePosition;
            p = new Vector2(mp.x, mp.y);
#endif
            if (Screen.width <= 0 || Screen.height <= 0) return new Vector2(0.5f, 0.5f);
            return new Vector2(Mathf.Clamp01(p.x / Screen.width), Mathf.Clamp01(p.y / Screen.height));
        }
    }
}
