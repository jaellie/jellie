// TwinActor.cs — Big Green Bear and Green share ONE drawing (Game 1's sprite).
// The only built-in tell: Green is the same cut-out mirrored (scarf tail on the other side),
// plus behavioural signatures (which hand reaches, how fast the gesture is).
// Nothing is explained to the player. Colour never reveals who is who (design prompt §5).
using System.Collections;
using UnityEngine;

namespace BigGreenBear2
{
    public enum Who { Bear, Green }

    public class TwinActor : MonoBehaviour
    {
        public Who who;
        public SpriteRenderer sr;
        public Transform shadow;
        public float height = 3.3f;

        // right-handed Bear reaches with his own right = viewer-left on a front-facing puppet.
        public bool RightHanded => who == Who.Bear;
        public float HandSide => RightHanded ? -1f : 1f;       // world x sign of the reaching hand
        public float GestureSpeed => who == Who.Bear ? 0.9f : 1.15f;   // Green: slightly sharper

        float walkPhase;
        static Sprite shadowSprite;

        public static TwinActor Create(Who w, string spriteName, float h, Transform parent)
        {
            var go = new GameObject(w == Who.Bear ? "BigGreenBear" : "Green");
            go.transform.SetParent(parent, false);
            var a = go.AddComponent<TwinActor>();
            a.who = w; a.height = h;
            a.sr = go.AddComponent<SpriteRenderer>();
            var tex = StageBuilder.LoadTex("BGB2/Characters/" + spriteName);
            if (tex != null)
                a.sr.sprite = Sprite.Create(tex, new Rect(0, 0, tex.width, tex.height), new Vector2(0.5f, 0f), tex.height / h);
            a.sr.flipX = w == Who.Green;          // the twin tell: same cut-out, mirrored
            a.sr.sortingOrder = 5;

            var sh = new GameObject("Shadow");
            sh.transform.SetParent(go.transform, false);
            sh.transform.localPosition = new Vector3(0f, 0.03f, 0f);
            sh.transform.localRotation = Quaternion.Euler(90f, 0f, 0f);
            var ssr = sh.AddComponent<SpriteRenderer>();
            ssr.sprite = ShadowSprite();
            ssr.color = new Color(0.02f, 0.03f, 0.08f, 0.5f);
            ssr.sortingOrder = 4;
            sh.transform.localScale = new Vector3(h * 0.9f, h * 0.42f, 1f);
            a.shadow = sh.transform;
            return a;
        }

        public static TwinActor CreateNpc(string spriteName, float h, Transform parent)
        {
            var go = new GameObject("Nini");
            go.transform.SetParent(parent, false);
            var a = go.AddComponent<TwinActor>();
            a.height = h;
            a.sr = go.AddComponent<SpriteRenderer>();
            var tex = StageBuilder.LoadTex("BGB2/Characters/" + spriteName);
            if (tex != null)
                a.sr.sprite = Sprite.Create(tex, new Rect(0, 0, tex.width, tex.height), new Vector2(0.5f, 0f), tex.height / h);
            a.sr.sortingOrder = 5;
            return a;
        }

        static Sprite ShadowSprite()
        {
            if (shadowSprite != null) return shadowSprite;
            const int n = 64;
            var tex = new Texture2D(n, n, TextureFormat.RGBA32, false);
            for (int y = 0; y < n; y++)
                for (int x = 0; x < n; x++)
                {
                    float dx = (x - n / 2f) / (n / 2f), dy = (y - n / 2f) / (n / 2f);
                    float a = Mathf.Clamp01(1f - Mathf.Sqrt(dx * dx + dy * dy));
                    tex.SetPixel(x, y, new Color(1, 1, 1, a));
                }
            tex.Apply();
            shadowSprite = Sprite.Create(tex, new Rect(0, 0, n, n), new Vector2(0.5f, 0.5f), n);
            return shadowSprite;
        }

        // Called by the controller: tiny walking sway, no "A to B" slide.
        public void Walk(float dir)
        {
            if (Mathf.Abs(dir) < 0.01f) { walkPhase = 0f; transform.rotation = Quaternion.identity; return; }
            walkPhase += Time.deltaTime * 9f;
            float hop = Mathf.Abs(Mathf.Sin(walkPhase)) * 0.06f;
            transform.position = new Vector3(transform.position.x, hop, transform.position.z);
            transform.rotation = Quaternion.Euler(0f, 0f, Mathf.Sin(walkPhase) * 1.6f);
        }

        // A reach gesture with the character's own dominant hand: the item lands on that side.
        public IEnumerator Reach(Transform item, float seconds = 0.5f)
        {
            Vector3 from = item.position, to = transform.position + new Vector3(HandSide * height * 0.2f, height * 0.45f, -0.1f);
            for (float t = 0; t < seconds / GestureSpeed; t += Time.deltaTime)
            {
                item.position = Vector3.Lerp(from, to, t / (seconds / GestureSpeed));
                yield return null;
            }
            item.position = to;
        }
    }
}
