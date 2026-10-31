using System;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

namespace DrivingSim.UI
{
    /// <summary>
    /// Touch button that reacts on pointer down, so it works while another finger is held on a
    /// pedal (browsers and some touch stacks drop a second finger's "click"). Reports hold state
    /// for look buttons and a press event for tap actions. Each instance tracks its own pointer id.
    /// Only left-button events are accepted: touches and left clicks come from the uGUI input module,
    /// middle clicks arrive as left-button events from <c>MiddleMouseUIRouter</c>. The module's own
    /// middle/right-button events are ignored, so one physical click never activates a button twice.
    /// </summary>
    [RequireComponent(typeof(Graphic))]
    public class HoldButton : MonoBehaviour, IPointerDownHandler, IPointerUpHandler, IPointerExitHandler
    {
        public Color normalColor = new Color(0.08f, 0.1f, 0.13f, 0.6f);
        public Color pressedColor = new Color(0.94f, 0.71f, 0.16f, 0.9f);

        public event Action Pressed;
        public event Action<bool> HeldChanged;

        Graphic graphic;
        int pointerId = int.MinValue;

        public bool IsHeld => pointerId != int.MinValue;

        bool toggledOn;

        void Awake()
        {
            graphic = GetComponent<Graphic>();
            graphic.color = normalColor;
        }

        public void ClearPressedHandlers() => Pressed = null;

        /// <summary>For toggle-style buttons: show the pressed color while the option is on.</summary>
        public void SetToggled(bool on)
        {
            toggledOn = on;
            if (graphic != null && !IsHeld) graphic.color = on ? pressedColor : normalColor;
        }

        public bool Interactable { get; set; } = true;

        public void OnPointerDown(PointerEventData eventData)
        {
            if (IsHeld || !Interactable || eventData.button != PointerEventData.InputButton.Left) return;
            pointerId = eventData.pointerId;
            graphic.color = pressedColor;
            Pressed?.Invoke();
            HeldChanged?.Invoke(true);
        }

        public void OnPointerUp(PointerEventData eventData)
        {
            if (eventData.pointerId == pointerId) Release();
        }

        public void OnPointerExit(PointerEventData eventData)
        {
            if (eventData.pointerId == pointerId) Release();
        }

        void OnDisable()
        {
            if (IsHeld) Release();
        }

        void Release()
        {
            pointerId = int.MinValue;
            if (graphic != null) graphic.color = toggledOn ? pressedColor : normalColor;
            HeldChanged?.Invoke(false);
        }
    }
}
