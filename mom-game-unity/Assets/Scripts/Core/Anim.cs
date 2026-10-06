using System;
using System.Collections;
using UnityEngine;

// Tiny coroutine helpers: yield return Anim.Wait(1f); yield return Anim.Over(0.5f, t => ...);
public static class Anim
{
    public static IEnumerator Wait(float seconds)
    {
        float t = 0f;
        while (t < seconds) { t += Time.deltaTime; yield return null; }
    }

    public static float InOut(float t) { return t * t * (3f - 2f * t); }
    public static float Out(float t) { return 1f - (1f - t) * (1f - t); }
    public static float Back(float t) { const float c = 1.7f; return 1f + (c + 1f) * Mathf.Pow(t - 1f, 3f) + c * Mathf.Pow(t - 1f, 2f); }

    public static IEnumerator Over(float seconds, Action<float> f, Func<float, float> ease = null)
    {
        float t = 0f;
        while (t < seconds)
        {
            t += Time.deltaTime;
            float u = Mathf.Clamp01(t / Mathf.Max(0.0001f, seconds));
            f(ease != null ? ease(u) : InOut(u));
            yield return null;
        }
        f(1f);
    }
}
