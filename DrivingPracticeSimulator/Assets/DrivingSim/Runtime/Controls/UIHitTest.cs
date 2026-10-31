using System.Collections.Generic;
using UnityEngine;
using UnityEngine.EventSystems;

namespace DrivingSim.Controls
{
    /// <summary>Raycasts uGUI at a screen position. Only graphics with raycastTarget (buttons, pedals) block steering.</summary>
    public static class UIHitTest
    {
        static readonly List<RaycastResult> results = new List<RaycastResult>();
        static PointerEventData scratch;

        public static bool Raycast(Vector2 screenPosition, out RaycastResult hit)
        {
            hit = default;
            EventSystem eventSystem = EventSystem.current;
            if (eventSystem == null) return false;
            if (scratch == null || scratch.currentInputModule != eventSystem.currentInputModule) scratch = new PointerEventData(eventSystem);
            scratch.position = screenPosition;
            results.Clear();
            eventSystem.RaycastAll(scratch, results);
            if (results.Count == 0) return false;
            hit = results[0];
            return true;
        }

        public static bool IsOverUI(Vector2 screenPosition) => Raycast(screenPosition, out _);
    }
}
