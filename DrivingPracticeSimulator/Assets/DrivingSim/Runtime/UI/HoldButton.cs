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

        void Awake()
        {
            graphic = GetComponent<Graphic>();
            graphic.color = normalColor;
        }

        public void OnPointerDown(PointerEventData eventData)
        {
            if (IsHeld) return;
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
            if (graphic != null) graphic.color = normalColor;
            HeldChanged?.Invoke(false);
        }
    }
}
