// Actor.cs — a character drawn as one sprite per expression.
// Small, restrained life: blinking, breathing, a tiny bob while speaking,
// dimming when someone else talks, and walking out of frame.
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

namespace BigGreenBear
{
    public class Actor : MonoBehaviour
    {
        public static bool ReducedMotion;

        readonly Dictionary<string, Sprite> faces = new Dictionary<string, Sprite>();
        SpriteRenderer sr;
        string face = "neutral";
        float blinkAt;
        bool blinking;
        bool speaking;
        float dim;        // 0 = in focus, 1 = dimmed
        float targetDim;
        float alpha = 1f;
        Color tint = Color.white;
        Vector3 basePos;

        public float Height { get; private set; }
        public int SortingOrder => sr != null ? sr.sortingOrder : 0;
        public string Id { get; private set; }

        static readonly string[] Expressions = { "neutral", "happy", "worried", "searching", "curious", "blink" };

        public void Init(ActorLayout a)
        {
            Id = a.id;
            Height = a.height;
            sr = gameObject.AddComponent<SpriteRenderer>();
            sr.sortingOrder = a.order;
            Stage.ApplyMaterial(sr);
            foreach (var e in Expressions)
            {
                var tex = Resources.Load<Texture2D>("BGB/Art/" + a.sprites + "_" + e);
                if (tex == null) continue;
                faces[e] = Sprite.Create(tex, new Rect(0, 0, tex.width, tex.height), new Vector2(0.5f, 0f), tex.height / a.height);
            }
            basePos = transform.position;
            SetFace(string.IsNullOrEmpty(a.face) ? "neutral" : a.face);
            blinkAt = Time.time + Random.Range(2f, 5f);
        }

        public void SetFace(string expr)
        {
            if (!faces.ContainsKey(expr)) return;
            face = expr;
            if (!blinking) sr.sprite = faces[expr];
        }

        public void SetSpeaking(bool on) => speaking = on;
        public void SetDim(bool on) => targetDim = on ? 1f : 0f;

        // Silhouette tint for the title screen.
        public void SetTint(Color c) => tint = c;

        public void Show(bool on)
        {
            gameObject.SetActive(on);
            if (on)
            {
                alpha = 1f;
                transform.position = basePos;
            }
        }

        public Coroutine Exit(float dx, float seconds) => StartCoroutine(ExitRoutine(dx, seconds));

        IEnumerator ExitRoutine(float dx, float seconds)
        {
            Vector3 from = transform.position;
            Vector3 to = from + new Vector3(dx, 0f, 0f);
            for (float t = 0; t < seconds; t += Time.deltaTime)
            {
                float k = t / seconds;
                if (!ReducedMotion)
                {
                    float hop = Mathf.Abs(Mathf.Sin(k * Mathf.PI * 7f)) * 0.05f;
                    transform.position = Vector3.Lerp(from, to, k) + Vector3.up * hop;
                }
                alpha = 1f - Mathf.SmoothStep(0.4f, 1f, k);
                yield return null;
            }
            gameObject.SetActive(false);
        }

        void Update()
        {
            if (sr == null) return;

            // blink (not while eyes are already closed in a smile)
            if (!blinking && Time.time > blinkAt && face != "happy" && faces.ContainsKey("blink"))
            {
                blinking = true;
                sr.sprite = faces["blink"];
                blinkAt = Time.time + 0.12f;
            }
            else if (blinking && Time.time > blinkAt)
            {
                blinking = false;
                sr.sprite = faces[face];
                blinkAt = Time.time + Random.Range(2.5f, 6f);
            }

            // breathe (scales from the feet because the pivot is at the bottom)
            float breathe = ReducedMotion ? 0f : Mathf.Sin(Time.time * 1.6f) * 0.012f;
            float bob = (!ReducedMotion && speaking) ? Mathf.Abs(Mathf.Sin(Time.time * 9f)) * 0.012f : 0f;
            transform.localScale = new Vector3(1f - breathe * 0.4f, 1f + breathe + bob, 1f);

            dim = Mathf.MoveTowards(dim, targetDim, Time.deltaTime * 3f);
            float v = Mathf.Lerp(1f, 0.72f, dim);
            sr.color = new Color(tint.r * v, tint.g * v, tint.b * Mathf.Lerp(1f, 0.8f, dim), alpha * tint.a);
        }
    }
}
