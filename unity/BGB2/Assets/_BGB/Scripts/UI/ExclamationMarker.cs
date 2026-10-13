using UnityEngine;

namespace BGB2
{
    /// <summary>The "!" above an interactable. Larger and more opaque than before; softened while the bottom prompt is showing.</summary>
    public class ExclamationMarker : MonoBehaviour
    {
        public SpriteRenderer sprite;
        public float baseScale = 1.51f, softScale = 1.24f;   // 0.78-unit sprite shown about 1.18 units wide; softened while the prompt shows
        public float opaque = 1f, soft = 0.78f;
        public float bobHeight = 0.08f, bobSpeed = 3.5f;

        bool visible, softened;
        float alpha;
        Vector3 basePos;

        void Awake() { basePos = transform.localPosition; if (sprite != null) SetAlpha(0f); }

        public void SetState(bool visible, bool softened) { this.visible = visible; this.softened = softened; }

        void Update()
        {
            float targetA = visible ? (softened ? soft : opaque) : 0f;
            alpha = Mathf.MoveTowards(alpha, targetA, Time.deltaTime / 0.25f);
            SetAlpha(alpha);
            float s = softened ? softScale : baseScale;
            transform.localScale = Vector3.one * s;
            transform.localPosition = basePos + new Vector3(0f, Mathf.Sin(Time.time * bobSpeed) * bobHeight, 0f);
        }

        void SetAlpha(float a)
        {
            if (sprite == null) return;
            var c = sprite.color; c.a = a; sprite.color = c;
        }
    }
}
