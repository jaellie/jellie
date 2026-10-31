using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

namespace DrivingSim.UI
{
    /// <summary>
    /// On-screen pedal. Pressure follows the finger's vertical position on the pedal
    /// (top = light, bottom = full), so the touch alternative to the foot keyboard is still progressive.
    /// </summary>
    [RequireComponent(typeof(Graphic))]
    public class TouchPedalButton : MonoBehaviour, IPointerDownHandler, IPointerUpHandler, IDragHandler, IInitializePotentialDragHandler
    {
        [Range(0f, 1f)] public float minimumPressure = 0.2f;
        [SerializeField] Image fill;

        RectTransform rect;
        int pointerId = int.MinValue;

        public float Value { get; private set; }
        public bool IsPressed => pointerId != int.MinValue;

        public void SetFill(Image image) => fill = image;

        void Awake() => rect = (RectTransform)transform;

        public void OnPointerDown(PointerEventData eventData)
        {
            if (IsPressed || eventData.button != PointerEventData.InputButton.Left) return;
            pointerId = eventData.pointerId;
            UpdateValue(eventData);
        }

        public void OnInitializePotentialDrag(PointerEventData eventData) => eventData.useDragThreshold = false;

        public void OnDrag(PointerEventData eventData)
        {
            if (eventData.pointerId == pointerId) UpdateValue(eventData);
        }

        public void OnPointerUp(PointerEventData eventData)
        {
            if (eventData.pointerId == pointerId) Release();
        }

        void OnDisable() => Release();

        void Release()
        {
            pointerId = int.MinValue;
            Value = 0f;
            RefreshFill();
        }

        void UpdateValue(PointerEventData eventData)
        {
            if (!RectTransformUtility.ScreenPointToLocalPointInRectangle(rect, eventData.position, eventData.pressEventCamera, out Vector2 local)) return;
            float t = Mathf.InverseLerp(rect.rect.yMax, rect.rect.yMin, local.y);
            Value = Mathf.Lerp(minimumPressure, 1f, t);
            RefreshFill();
        }

        void RefreshFill()
        {
            if (fill != null) fill.fillAmount = Value;
        }
    }
}
