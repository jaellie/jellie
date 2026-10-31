using UnityEngine;
using UnityEngine.EventSystems;

namespace DrivingSim.Controls
{
    /// <summary>
    /// Delivers middle-mouse presses to uGUI as if they were a left-button touch. uGUI's own input
    /// module reports the middle button as InputButton.Middle, which Selectables and our HoldButtons
    /// ignore; this router sends one Left-button event stream with its own pointer id instead,
    /// so a middle click activates a control exactly once.
    /// </summary>
    public sealed class MiddleMouseUIRouter
    {
        readonly int pointerId;
        PointerEventData data;
        GameObject pressed;
        GameObject hovered;

        public MiddleMouseUIRouter(int pointerId) => this.pointerId = pointerId;

        public bool IsCapturing => data != null;

        /// <summary>Returns true if the press landed on UI (the pointer is then captured by UI).</summary>
        public bool Press(Vector2 position)
        {
            Cancel();
            if (!UIHitTest.Raycast(position, out RaycastResult hit)) return false;

            data = new PointerEventData(EventSystem.current)
            {
                pointerId = pointerId,
                button = PointerEventData.InputButton.Left,
                position = position,
                pressPosition = position,
                pointerCurrentRaycast = hit,
                pointerPressRaycast = hit,
                rawPointerPress = hit.gameObject,
                eligibleForClick = true,
                clickCount = 1,
                clickTime = Time.unscaledTime,
                useDragThreshold = true,
            };

            hovered = ExecuteEvents.ExecuteHierarchy(hit.gameObject, data, ExecuteEvents.pointerEnterHandler);
            GameObject target = ExecuteEvents.ExecuteHierarchy(hit.gameObject, data, ExecuteEvents.pointerDownHandler);
            if (target == null) target = ExecuteEvents.GetEventHandler<IPointerClickHandler>(hit.gameObject);
            pressed = target;
            data.pointerPress = target;
            return true;
        }

        public void Move(Vector2 position)
        {
            if (data == null) return;
            data.delta = position - data.position;
            data.position = position;

            if (pressed == null) return;
            bool stillOver = UIHitTest.Raycast(position, out RaycastResult hit) && hit.gameObject != null
                             && hit.gameObject.transform.IsChildOf(pressed.transform);
            if (!stillOver && hovered != null)
            {
                // Sliding off a hold button releases it, matching touch behavior.
                ExecuteEvents.Execute(pressed, data, ExecuteEvents.pointerExitHandler);
                hovered = null;
                data.eligibleForClick = false;
            }
        }

        public void Release(Vector2 position)
        {
            if (data == null) return;
            data.position = position;
            GameObject clickTarget = null;
            if (UIHitTest.Raycast(position, out RaycastResult hit))
            {
                data.pointerCurrentRaycast = hit;
                clickTarget = ExecuteEvents.GetEventHandler<IPointerClickHandler>(hit.gameObject);
            }

            if (pressed != null)
            {
                ExecuteEvents.Execute(pressed, data, ExecuteEvents.pointerUpHandler);
                if (data.eligibleForClick && clickTarget == pressed)
                    ExecuteEvents.Execute(pressed, data, ExecuteEvents.pointerClickHandler);
            }
            if (hovered != null) ExecuteEvents.Execute(hovered, data, ExecuteEvents.pointerExitHandler);
            Clear();
        }

        public void Cancel()
        {
            if (data != null && pressed != null)
            {
                data.eligibleForClick = false;
                ExecuteEvents.Execute(pressed, data, ExecuteEvents.pointerUpHandler);
            }
            Clear();
        }

        void Clear()
        {
            data = null;
            pressed = null;
            hovered = null;
        }
    }
}
