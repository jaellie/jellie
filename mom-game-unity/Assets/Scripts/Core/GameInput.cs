using UnityEngine;

// Keyboard input (legacy Input Manager). W/S = walk forward/back, A/D = turn, E/Space = interact.
// If a project is set to the new Input System only, reading keys throws; we catch it once and
// the HUD shows how to fix it (Project Settings > Player > Active Input Handling = Both).
public static class GameInput
{
    public static bool Broken;

    static bool Key(KeyCode k) { try { return Input.GetKey(k); } catch (System.Exception) { Broken = true; return false; } }
    static bool Down(KeyCode k) { try { return Input.GetKeyDown(k); } catch (System.Exception) { Broken = true; return false; } }

    public static Vector2 Move()
    {
        float x = 0f, y = 0f;
        if (Key(KeyCode.A) || Key(KeyCode.LeftArrow)) x -= 1f;
        if (Key(KeyCode.D) || Key(KeyCode.RightArrow)) x += 1f;
        if (Key(KeyCode.W) || Key(KeyCode.UpArrow)) y += 1f;
        if (Key(KeyCode.S) || Key(KeyCode.DownArrow)) y -= 1f;
        return new Vector2(x, y);
    }

    public static bool InteractDown { get { return Down(KeyCode.E) || Down(KeyCode.Space) || Down(KeyCode.Return) || Down(KeyCode.KeypadEnter); } }
    public static bool CloseDown { get { return Down(KeyCode.Escape); } }
    public static bool LeftDown { get { return Down(KeyCode.A) || Down(KeyCode.LeftArrow); } }
    public static bool RightDown { get { return Down(KeyCode.D) || Down(KeyCode.RightArrow); } }
    public static bool UpDown { get { return Down(KeyCode.W) || Down(KeyCode.UpArrow); } }
    public static bool DownDown { get { return Down(KeyCode.S) || Down(KeyCode.DownArrow); } }
    public static bool ResetDown { get { return Down(KeyCode.F10); } }

    public static bool AnyDown
    {
        get { try { return Input.anyKeyDown; } catch (System.Exception) { Broken = true; return false; } }
    }

    public static bool ClickDown
    {
        get { try { return Input.GetMouseButtonDown(0); } catch (System.Exception) { Broken = true; return false; } }
    }

    public static float Scroll
    {
        get { try { return Input.mouseScrollDelta.y; } catch (System.Exception) { return 0f; } }
    }
}
