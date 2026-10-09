using UnityEngine;

namespace BGB2
{
    /// <summary>Drives a soft contact shadow for a character from the nearest lamps. The warm side light itself comes from
    /// URP 2D Point Light 2D components on the lamps with Sprite-Lit materials on the characters (no custom shader, no
    /// shadow casters). Everything eases with 1 - exp(-5 dt), so nothing flickers.</summary>
    public class LampLightResponder : MonoBehaviour
    {
        public Transform[] lamps;
        public float radius = 4.7f;
        public Transform shadow;               // blob ellipse sprite at the feet
        public float leanMax = 0.14f, widenMax = 0.22f;
        public float shadowBaseWidth = 1f;

        float lean, widen;

        void Update()
        {
            float left = 0f, right = 0f;
            foreach (var lamp in lamps)
            {
                float dx = lamp.position.x - transform.position.x;
                float f = Mathf.Clamp01(1f - Mathf.Abs(dx) / radius);
                float c = f * f * (3f - 2f * f);
                float k = Mathf.Clamp(dx / 1.4f, -1f, 1f);
                right += c * (0.5f + 0.5f * k);
                left += c * (0.5f - 0.5f * k);
            }
            left = Mathf.Min(1f, left); right = Mathf.Min(1f, right);
            float a = 1f - Mathf.Exp(-5f * Time.deltaTime);
            lean += ((left - right) * leanMax - lean) * a;               // leans away from the lamp
            widen += ((1f + widenMax * Mathf.Min(1f, left + right)) - widen) * a;
            if (shadow != null)
            {
                shadow.localPosition = new Vector3(lean, shadow.localPosition.y, 0f);
                shadow.localScale = new Vector3(shadowBaseWidth * widen, shadow.localScale.y, 1f);
            }
        }
    }
}
