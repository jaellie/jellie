// Stage.cs — builds the 2.5D scene from layout.json.
//
// The trick behind the depth: every painted layer is a flat sprite placed at a
// different distance (z) from a PERSPECTIVE camera. Far layers move less when
// the camera moves, near layers move more: real parallax, no 3D models.
// Each back layer is sized and lifted so that its "floor line" (anchorRow)
// lines up with the ground's horizon from the camera's point of view.
using System.Collections.Generic;
using UnityEngine;

namespace BigGreenBear
{
    public class Stage : MonoBehaviour
    {
        public SceneLayout layout;
        public Camera cam;
        public readonly Dictionary<string, SpriteRenderer> layers = new Dictionary<string, SpriteRenderer>();
        public readonly Dictionary<string, Actor> actors = new Dictionary<string, Actor>();
        public readonly Dictionary<string, Vector3> anchors = new Dictionary<string, Vector3>();
        public SpriteRenderer bell;

        // URP 2D "lit" sprite material, so the 2D lights actually reach our sprites.
        // Null = keep Unity's default sprite material.
        public static Material SpriteMaterial;

        public static void UseLitMaterial()
        {
            var shader = Shader.Find("Universal Render Pipeline/2D/Sprite-Lit-Default");
            if (shader != null) SpriteMaterial = new Material(shader);
            else Debug.LogWarning("[BigGreenBear] 2D lit sprite shader not found; sprites will be unlit.");
        }

        public static void ApplyMaterial(SpriteRenderer sr)
        {
            if (SpriteMaterial != null) sr.sharedMaterial = SpriteMaterial;
        }

        float TanHalf => Mathf.Tan(layout.camera.fov * 0.5f * Mathf.Deg2Rad);

        // Height y at depth z that the camera sees on the same screen row as (refY, refZ).
        float ProjectY(float refY, float refZ, float z)
        {
            float cy = layout.camera.y, cz = layout.camera.z;
            return cy + (refY - cy) * (z - cz) / (refZ - cz);
        }

        public static Sprite LoadSprite(string name, Vector2 pivot, float pixelsPerUnit)
        {
            // Loaded as a texture so the pivot/size are controlled here, whatever
            // the import settings are.
            var tex = Resources.Load<Texture2D>("BGB/Art/" + name);
            if (tex == null)
            {
                Debug.LogWarning("[BigGreenBear] Missing art: Resources/BGB/Art/" + name + ".png");
                return null;
            }
            tex.wrapMode = TextureWrapMode.Clamp;
            return Sprite.Create(tex, new Rect(0, 0, tex.width, tex.height), pivot, pixelsPerUnit);
        }

        public void Build(SceneLayout l, Camera camera)
        {
            layout = l;
            cam = camera;

            foreach (var ly in layout.layers) BuildLayer(ly);
            foreach (var a in layout.actors) BuildActor(a);

            // The small green bell — hidden until the story needs it.
            var bellGo = new GameObject("Bell");
            bellGo.transform.SetParent(transform, false);
            bell = bellGo.AddComponent<SpriteRenderer>();
            bell.sprite = LoadSprite("bell", new Vector2(0.5f, 0.1f), 256f / 0.42f);
            bell.sortingOrder = 20;
            bell.enabled = false;
            ApplyMaterial(bell);
        }

        void BuildLayer(LayerLayout ly)
        {
            var tex = Resources.Load<Texture2D>("BGB/Art/" + ly.sprite);
            if (tex == null)
            {
                Debug.LogWarning("[BigGreenBear] Missing layer art " + ly.sprite);
                return;
            }
            float unit = ly.width / tex.width; // world units per pixel
            var sprite = LoadSprite(ly.sprite, new Vector2(0.5f, 0.5f), 1f / unit);

            float anchorY;
            if (ly.anchorAt == "viewTop")
                anchorY = layout.camera.y + (ly.z - layout.camera.z) * TanHalf + 0.15f;
            else
                anchorY = ProjectY(layout.horizon.y, layout.horizon.z, ly.z);
            float centerY = anchorY - (tex.height * 0.5f - ly.anchorRow) * unit;

            var go = new GameObject("Layer_" + ly.name);
            go.transform.SetParent(transform, false);
            go.transform.position = new Vector3(ly.x, centerY, ly.z);
            var sr = go.AddComponent<SpriteRenderer>();
            sr.sprite = sprite;
            sr.sortingOrder = ly.order;
            ApplyMaterial(sr);
            layers[ly.name] = sr;

            // Anchors that live on this layer (pixel coordinates -> world).
            if (layout.anchors == null) return;
            foreach (var an in layout.anchors)
            {
                if (an.layer != ly.name) continue;
                anchors[an.id] = new Vector3(
                    ly.x + (an.px - tex.width * 0.5f) * unit,
                    centerY + (tex.height * 0.5f - an.py) * unit,
                    ly.z);
            }
        }

        void BuildActor(ActorLayout a)
        {
            var go = new GameObject("Actor_" + a.id);
            go.transform.SetParent(transform, false);
            go.transform.position = new Vector3(a.x, 0f, a.z);
            var actor = go.AddComponent<Actor>();
            actor.Init(a);
            actors[a.id] = actor;
            anchors[a.id] = go.transform.position + Vector3.up * a.height * 0.75f;
        }

        public Vector3 Anchor(string id, Vector3 fallback)
        {
            return anchors.TryGetValue(id, out var p) ? p : fallback;
        }

        public void SetLayerAlpha(string name, float a)
        {
            if (!layers.TryGetValue(name, out var sr)) return;
            var c = sr.color;
            c.a = a;
            sr.color = c;
        }

        // Puts the bell somewhere: "nini", "bear", "puddle" or "none".
        public void PlaceBell(string where)
        {
            if (bell == null) return;
            if (where == "none" || string.IsNullOrEmpty(where))
            {
                bell.enabled = false;
                bell.transform.SetParent(transform, true);
                return;
            }
            bell.enabled = true;
            if (actors.TryGetValue(where, out var actor))
            {
                // held in the paw / hand on the right side
                bell.transform.SetParent(actor.transform, false);
                // held in the right paw / hand (measured on the drawings)
                bell.transform.localPosition = where == "bear" ? new Vector3(0.6f, 0.3f, -0.05f) : new Vector3(0.27f, 0.12f, -0.05f);
                bell.sortingOrder = actor.SortingOrder + 1;
            }
            else
            {
                bell.transform.SetParent(transform, false);
                bell.transform.position = Anchor(where, Vector3.zero);
                bell.sortingOrder = 20;
            }
        }
    }
}
