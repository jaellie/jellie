// Input2.cs — keyboard that works with either Unity input setting (same trick as Game 1's SliceInput).
using UnityEngine;
#if ENABLE_INPUT_SYSTEM
using UnityEngine.InputSystem;
#endif

namespace BigGreenBear2
{
    public static class Input2
    {
        public static float Horizontal()
        {
#if ENABLE_INPUT_SYSTEM
            var k = Keyboard.current; if (k == null) return 0f;
            float h = 0f;
            if (k.aKey.isPressed || k.leftArrowKey.isPressed) h -= 1f;
            if (k.dKey.isPressed || k.rightArrowKey.isPressed) h += 1f;
            return h;
#else
            return Input.GetAxisRaw("Horizontal");
#endif
        }

        public static bool Interact()
        {
#if ENABLE_INPUT_SYSTEM
            return Keyboard.current != null && Keyboard.current.eKey.wasPressedThisFrame;
#else
            return Input.GetKeyDown(KeyCode.E);
#endif
        }

        public static bool Folder()
        {
#if ENABLE_INPUT_SYSTEM
            return Keyboard.current != null && Keyboard.current.tabKey.wasPressedThisFrame;
#else
            return Input.GetKeyDown(KeyCode.Tab);
#endif
        }

        public static bool Escape()
        {
#if ENABLE_INPUT_SYSTEM
            return Keyboard.current != null && Keyboard.current.escapeKey.wasPressedThisFrame;
#else
            return Input.GetKeyDown(KeyCode.Escape);
#endif
        }

        public static bool Confirm()
        {
#if ENABLE_INPUT_SYSTEM
            var k = Keyboard.current;
            return k != null && (k.enterKey.wasPressedThisFrame || k.spaceKey.wasPressedThisFrame);
#else
            return Input.GetKeyDown(KeyCode.Return) || Input.GetKeyDown(KeyCode.Space);
#endif
        }

        // Dev helper: P cycles the PEOPLE page phase (one bear -> twins -> uncertain).
        public static bool DevPhase()
        {
#if ENABLE_INPUT_SYSTEM
            return Keyboard.current != null && Keyboard.current.pKey.wasPressedThisFrame;
#else
            return Input.GetKeyDown(KeyCode.P);
#endif
        }
    }
}
