// RainSystem.cs — lightweight procedural rain.
// A fixed pool of thin streak sprites spread through depth (so near drops are
// bigger and faster on screen than far ones), plus small ripples where drops
// land. Intensity 0..1 decides how many are active. No particle assets needed.
using UnityEngine;

namespace BigGreenBear
{
    public class RainSystem : MonoBehaviour
    {
        public static bool ReducedMotion;

        const int MaxDrops = 420;
        const int MaxRipples = 40;

        Transform camT;
        float intensity;        // current
        float target;           // where it's heading
        Sprite pixel;
        Sprite ring;
        readonly SpriteRenderer[] drops = new SpriteRenderer[MaxDrops];
        readonly Vector3[] vel = new Vector3[MaxDrops];
        readonly SpriteRenderer[] ripples = new SpriteRenderer[MaxRipples];
        readonly float[] rippleAge = new float[MaxRipples];
        int nextRipple;
        public Color tint = new Color(0.78f, 0.85f, 0.92f, 0.55f);

        public float Intensity => intensity;

        public void Init(Transform cameraTransform)
        {
            camT = cameraTransform;
            pixel = Sprite.Create(Texture2D.whiteTexture, new Rect(0, 0, 4, 4), new Vector2(0.5f, 0.5f), 4f);
            ring = MakeRing();
            for (int i = 0; i < MaxDrops; i++)
            {
                var go = new GameObject("drop");
                go.transform.SetParent(transform, false);
                var sr = go.AddComponent<SpriteRenderer>();
                sr.sprite = pixel;
                sr.sortingOrder = 30;
                sr.enabled = false;
                drops[i] = sr;
                Respawn(i, true);
            }
            for (int i = 0; i < MaxRipples; i++)
            {
                var go = new GameObject("ripple");
                go.transform.SetParent(transform, false);
                var sr = go.AddComponent<SpriteRenderer>();
                sr.sprite = ring;
                sr.sortingOrder = 5;
                sr.enabled = false;
                ripples[i] = sr;
                rippleAge[i] = 99f;
            }
        }

        static Sprite MakeRing()
        {
            const int w = 64, h = 32;
            var tex = new Texture2D(w, h, TextureFormat.RGBA32, false);
            var px = new Color32[w * h];
            for (int y = 0; y < h; y++)
            for (int x = 0; x < w; x++)
            {
                float dx = (x - w / 2f) / (w / 2f), dy = (y - h / 2f) / (h / 2f);
                float d = Mathf.Sqrt(dx * dx + dy * dy);
                float a = Mathf.Clamp01(1f - Mathf.Abs(d - 0.85f) * 9f);
                px[y * w + x] = new Color32(255, 255, 255, (byte)(a * 255));
            }
            tex.SetPixels32(px);
            tex.Apply();
            return Sprite.Create(tex, new Rect(0, 0, w, h), new Vector2(0.5f, 0.5f), 100f);
        }

        public void SetIntensity(float value, bool instant = false)
        {
            target = Mathf.Clamp01(value);
            if (instant) intensity = target;
        }

        void Respawn(int i, bool anywhere)
        {
            float z = Random.Range(-3f, 9f);
            float camX = camT != null ? camT.position.x : 0f;
            float spread = 8f + (z + 3f) * 0.9f;
            float y = anywhere ? Random.Range(-2f, 9f) : Random.Range(7f, 10f);
            var t = drops[i].transform;
            t.position = new Vector3(camX + Random.Range(-spread, spread), y, z);
            float speed = Random.Range(11f, 15f);
            vel[i] = new Vector3(-1.4f, -speed, 0f);
            float len = Random.Range(0.22f, 0.42f);
            t.localScale = new Vector3(0.012f, len, 1f);
            t.rotation = Quaternion.Euler(0f, 0f, Mathf.Atan2(vel[i].x, -vel[i].y) * -Mathf.Rad2Deg);
        }

        void Splash(Vector3 at)
        {
            var sr = ripples[nextRipple];
            rippleAge[nextRipple] = 0f;
            sr.transform.position = new Vector3(at.x, Random.Range(-0.6f, 0.4f), Mathf.Clamp(at.z, 0.2f, 2f));
            sr.enabled = true;
            nextRipple = (nextRipple + 1) % MaxRipples;
        }

        void Update()
        {
            intensity = Mathf.MoveTowards(intensity, target, Time.deltaTime * 0.12f);
            int active = Mathf.RoundToInt(intensity * MaxDrops);
            float slow = ReducedMotion ? 0.35f : 1f; // calmer rain if motion is reduced
            for (int i = 0; i < MaxDrops; i++)
            {
                var sr = drops[i];
                bool on = i < active;
                if (sr.enabled != on) sr.enabled = on;
                if (!on) continue;
                var t = sr.transform;
                t.position += vel[i] * (Time.deltaTime * slow);
                float a = tint.a * Mathf.Lerp(0.5f, 1f, Mathf.InverseLerp(9f, -3f, t.position.z));
                sr.color = new Color(tint.r, tint.g, tint.b, a);
                if (t.position.y < -1.2f)
                {
                    if (t.position.z < 2f && Random.value < 0.25f) Splash(t.position);
                    Respawn(i, false);
                }
            }
            for (int i = 0; i < MaxRipples; i++)
            {
                if (!ripples[i].enabled) continue;
                rippleAge[i] += Time.deltaTime;
                float k = rippleAge[i] / 0.5f;
                if (k >= 1f)
                {
                    ripples[i].enabled = false;
                    continue;
                }
                float s = Mathf.Lerp(0.05f, 0.32f, k);
                ripples[i].transform.localScale = new Vector3(s, s, 1f);
                ripples[i].color = new Color(tint.r, tint.g, tint.b, (1f - k) * 0.5f);
            }
        }
    }
}
