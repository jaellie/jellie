// Signature stubs for com.unity.ugui (UnityEngine.UI / UnityEngine.EventSystems). Type-check only.
#pragma warning disable CS0067, CS0108, CS0114, CS1591
using System.Collections.Generic;
using UnityEngine.Events;

namespace UnityEngine.EventSystems
{
    public abstract class UIBehaviour : MonoBehaviour { }

    public interface IEventSystemHandler { }
    public interface IPointerEnterHandler : IEventSystemHandler { void OnPointerEnter(PointerEventData eventData); }
    public interface IPointerExitHandler : IEventSystemHandler { void OnPointerExit(PointerEventData eventData); }
    public interface IPointerDownHandler : IEventSystemHandler { void OnPointerDown(PointerEventData eventData); }
    public interface IPointerUpHandler : IEventSystemHandler { void OnPointerUp(PointerEventData eventData); }
    public interface IPointerClickHandler : IEventSystemHandler { void OnPointerClick(PointerEventData eventData); }

    public abstract class AbstractEventData { }
    public class BaseEventData : AbstractEventData { }
    public class PointerEventData : BaseEventData
    {
        public Vector2 position { get; set; }
        public int pointerId { get; set; }
    }

    public static class ExecuteEvents
    {
        public delegate void EventFunction<T1>(T1 handler, BaseEventData eventData);
        public static EventFunction<IPointerClickHandler> pointerClickHandler => null;
        public static GameObject ExecuteHierarchy<T>(GameObject root, BaseEventData eventData, EventFunction<T> callbackFunction)
            where T : IEventSystemHandler => null;
    }

    public class EventSystem : UIBehaviour
    {
        public static EventSystem current { get; set; }
    }

    public abstract class BaseInputModule : UIBehaviour { }
    public class StandaloneInputModule : BaseInputModule { }
}

namespace UnityEngine.UI
{
    using UnityEngine.EventSystems;

    public interface ILayoutElement
    {
        void CalculateLayoutInputHorizontal();
        void CalculateLayoutInputVertical();
        float minWidth { get; }
        float preferredWidth { get; }
        float flexibleWidth { get; }
        float minHeight { get; }
        float preferredHeight { get; }
        float flexibleHeight { get; }
        int layoutPriority { get; }
    }

    public interface ILayoutController { void SetLayoutHorizontal(); void SetLayoutVertical(); }
    public interface ILayoutGroup : ILayoutController { }

    public abstract class Graphic : UIBehaviour
    {
        public virtual Color color { get; set; }
        public bool raycastTarget { get; set; }
        public RectTransform rectTransform => null;
        public virtual void SetAllDirty() { }
    }

    public abstract class MaskableGraphic : Graphic { }

    public class Image : MaskableGraphic, ILayoutElement
    {
        public Sprite sprite { get; set; }
        public virtual void CalculateLayoutInputHorizontal() { }
        public virtual void CalculateLayoutInputVertical() { }
        public virtual float minWidth => 0; public virtual float preferredWidth => 0; public virtual float flexibleWidth => -1;
        public virtual float minHeight => 0; public virtual float preferredHeight => 0; public virtual float flexibleHeight => -1;
        public virtual int layoutPriority => 0;
    }

    public class RawImage : MaskableGraphic
    {
        public Texture texture { get; set; }
    }

    public class Text : MaskableGraphic, ILayoutElement
    {
        public virtual string text { get; set; }
        public Font font { get; set; }
        public int fontSize { get; set; }
        public FontStyle fontStyle { get; set; }
        public TextAnchor alignment { get; set; }
        public bool supportRichText { get; set; }
        public HorizontalWrapMode horizontalOverflow { get; set; }
        public VerticalWrapMode verticalOverflow { get; set; }
        public float lineSpacing { get; set; }
        public TextGenerator cachedTextGeneratorForLayout => null;
        public float pixelsPerUnit => 1f;
        public TextGenerationSettings GetGenerationSettings(Vector2 extents) => default;
        public virtual void CalculateLayoutInputHorizontal() { }
        public virtual void CalculateLayoutInputVertical() { }
        public virtual float minWidth => 0; public virtual float preferredWidth => 0; public virtual float flexibleWidth => -1;
        public virtual float minHeight => 0; public virtual float preferredHeight => 0; public virtual float flexibleHeight => -1;
        public virtual int layoutPriority => 0;
    }

    public struct ColorBlock
    {
        public Color normalColor { get; set; }
        public Color highlightedColor { get; set; }
        public Color pressedColor { get; set; }
        public Color selectedColor { get; set; }
        public Color disabledColor { get; set; }
        public float colorMultiplier { get; set; }
        public float fadeDuration { get; set; }
    }

    public struct Navigation
    {
        public enum Mode { None = 0, Horizontal = 1, Vertical = 2, Automatic = 3, Explicit = 4 }
        public Mode mode { get; set; }
    }

    public class Selectable : UIBehaviour
    {
        public ColorBlock colors { get; set; }
        public Graphic targetGraphic { get; set; }
        public Navigation navigation { get; set; }
        public bool interactable { get; set; }
    }

    public class Button : Selectable, IPointerClickHandler
    {
        public class ButtonClickedEvent : UnityEvent { }
        public ButtonClickedEvent onClick { get; set; }
        public virtual void OnPointerClick(PointerEventData eventData) { }
    }

    public abstract class LayoutGroup : UIBehaviour, ILayoutElement, ILayoutGroup
    {
        public RectOffset padding { get; set; }
        public TextAnchor childAlignment { get; set; }
        protected RectTransform rectTransform => null;
        protected List<RectTransform> rectChildren => null;
        public virtual void CalculateLayoutInputHorizontal() { }
        public abstract void CalculateLayoutInputVertical();
        public abstract void SetLayoutHorizontal();
        public abstract void SetLayoutVertical();
        public virtual float minWidth => 0; public virtual float preferredWidth => 0; public virtual float flexibleWidth => 0;
        public virtual float minHeight => 0; public virtual float preferredHeight => 0; public virtual float flexibleHeight => 0;
        public virtual int layoutPriority => 0;
        protected void SetLayoutInputForAxis(float totalMin, float totalPreferred, float totalFlexible, int axis) { }
        protected void SetChildAlongAxis(RectTransform rect, int axis, float pos, float size) { }
    }

    public abstract class HorizontalOrVerticalLayoutGroup : LayoutGroup
    {
        public float spacing { get; set; }
        public bool childForceExpandWidth { get; set; }
        public bool childForceExpandHeight { get; set; }
        public bool childControlWidth { get; set; }
        public bool childControlHeight { get; set; }
    }

    public class VerticalLayoutGroup : HorizontalOrVerticalLayoutGroup
    {
        public override void CalculateLayoutInputVertical() { }
        public override void SetLayoutHorizontal() { }
        public override void SetLayoutVertical() { }
    }

    public class HorizontalLayoutGroup : HorizontalOrVerticalLayoutGroup
    {
        public override void CalculateLayoutInputVertical() { }
        public override void SetLayoutHorizontal() { }
        public override void SetLayoutVertical() { }
    }

    public class LayoutElement : UIBehaviour, ILayoutElement
    {
        public virtual bool ignoreLayout { get; set; }
        public virtual void CalculateLayoutInputHorizontal() { }
        public virtual void CalculateLayoutInputVertical() { }
        public virtual float minWidth { get; set; }
        public virtual float minHeight { get; set; }
        public virtual float preferredWidth { get; set; }
        public virtual float preferredHeight { get; set; }
        public virtual float flexibleWidth { get; set; }
        public virtual float flexibleHeight { get; set; }
        public virtual int layoutPriority { get; set; }
    }

    public class ContentSizeFitter : UIBehaviour
    {
        public enum FitMode { Unconstrained, MinSize, PreferredSize }
        public FitMode horizontalFit { get; set; }
        public FitMode verticalFit { get; set; }
    }

    public class AspectRatioFitter : UIBehaviour
    {
        public enum AspectMode { None, WidthControlsHeight, HeightControlsWidth, FitInParent, EnvelopeParent }
        public AspectMode aspectMode { get; set; }
        public float aspectRatio { get; set; }
    }

    public class CanvasScaler : UIBehaviour
    {
        public enum ScaleMode { ConstantPixelSize, ScaleWithScreenSize, ConstantPhysicalSize }
        public enum ScreenMatchMode { MatchWidthOrHeight = 0, Expand = 1, Shrink = 2 }
        public ScaleMode uiScaleMode { get; set; }
        public ScreenMatchMode screenMatchMode { get; set; }
        public Vector2 referenceResolution { get; set; }
        public float matchWidthOrHeight { get; set; }
    }

    public class GraphicRaycaster : UIBehaviour { }
    public class RectMask2D : UIBehaviour { }

    public class ScrollRect : UIBehaviour
    {
        public enum MovementType { Unrestricted, Elastic, Clamped }
        public RectTransform content { get; set; }
        public RectTransform viewport { get; set; }
        public bool horizontal { get; set; }
        public bool vertical { get; set; }
        public MovementType movementType { get; set; }
        public float scrollSensitivity { get; set; }
        public float verticalNormalizedPosition { get; set; }
    }

    public static class LayoutUtility
    {
        public static float GetPreferredWidth(RectTransform rect) => 0f;
        public static float GetPreferredHeight(RectTransform rect) => 0f;
    }
}
