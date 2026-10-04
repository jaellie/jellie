// Stage.cs — builds one location of the 2.5D world from layout.json.
//
// The trick behind the depth: every painted layer is a flat sprite placed at a
// different distance (z) from a PERSPECTIVE camera. Far layers move less when
// the camera moves, near layers move more: real parallax, no 3D models.
// Each back layer is sized and lifted so that its "floor line" (anchorRow)
// lines up with the ground's horizon from the camera's point of view.
//
// LoadLocation() clears the previous place and builds the next one. Layers and
// characters can carry "when" conditions, so the SAME place can be built
// differently later in the story (the cafe's window moves; people leave).
using System;
using System.Collections.Generic;
using UnityEngine;

namespace BigGreenBear
{
    public class Stage : MonoBehaviour
    {
        public SceneLayout layout;
        public LocationLayout location;
        public Camera cam;
        public readonly Dictionary<string, SpriteRenderer> layers = new Dictionary<string, SpriteRenderer>();
        public readonly Dictionary<string, Actor> actors = new Dictionary<string, Actor>();
        public readonly Dictionary<string, Vector3> anchors = new Dictionary<string, Vector3>();
        public SpriteRenderer bell;
        Transform content;

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

        static readonly Dictionary<string, Texture2D> texCache = new Dictionary<string, Texture2D>();

        public static Texture2D LoadTexture(string name, bool optional = false)
        {
            if (texCache.TryGetValue(name, out var t) && t != null) return t;
            t = Resources.Load<Texture2D>("BGB/Art/" + name);
            if (t == null)
            {
                // optional = "use it if it exists" (e.g. not every character has every expression)
                if (!optional) Debug.LogWarning("[BigGreenBear] Missing art: Resources/BGB/Art/" + name + ".png");
            }
            else t.wrapMode = TextureWrapMode.Clamp;
            texCache[name] = t;
            return t;
        }

        public static Sprite LoadSprite(string name, Vector2 pivot, float pixelsPerUnit)
        {
            // Loaded as a texture so the pivot/size are controlled here, whatever
            // the import settings are.
            var tex = LoadTexture(name);
            if (tex == null) return null;
            return Sprite.Create(tex, new Rect(0, 0, tex.width, tex.height), pivot, pixelsPerUnit);
        }

        public void Init(SceneLayout l, Camera camera)
        {
            layout = l;
            cam = camera;
            // The small green bell lives outside the location so it can travel with Bear.
            var bellGo = new GameObject("Bell");
            bellGo.transform.SetParent(transform, false);
            bell = bellGo.AddComponent<SpriteRenderer>();
            bell.sprite = LoadSprite("bell", new Vector2(0.5f, 0.1f), 256f / 0.42f);
            bell.sortingOrder = 20;
            bell.enabled = false;
            ApplyMaterial(bell);
        }

        public void LoadLocation(string id, Func<string[], bool> check)
        {
            var loc = layout.Location(id);
            if (loc == null)
            {
                Debug.LogError("[BigGreenBear] Unknown location: " + id);
                return;
            }
            location = loc;
            string bellWhere = bellPlace;
            PlaceBell("none");
            if (content != null) Destroy(content.gameObject);
            content = new GameObject("Location_" + id).transform;
            content.SetParent(transform, false);
            layers.Clear();
            actors.Clear();
            anchors.Clear();

            foreach (var ly in loc.layers) if (check(ly.when)) BuildLayer(ly, loc);
            if (loc.actors != null)
                foreach (var a in loc.actors) if (check(a.when)) BuildActor(a);
            // the bell follows whoever was holding it, if they are here
            if (bellWhere == "bear" || bellWhere == "nini") PlaceBell(bellWhere);
        }

        void BuildLayer(LayerLayout ly, LocationLayout loc)
        {
            var tex = LoadTexture(ly.sprite);
            if (tex == null) return;
            float unit = ly.width / tex.width; // world units per pixel
            var sprite = Sprite.Create(tex, new Rect(0, 0, tex.width, tex.height), new Vector2(0.5f, 0.5f), 1f / unit);

            float anchorY;
            if (ly.anchorAt == "viewTop")
                anchorY = layout.camera.y + (ly.z - layout.camera.z) * TanHalf + 0.15f;
            else
                anchorY = ProjectY(layout.horizon.y, layout.horizon.z, ly.z);
            float centerY = anchorY - (tex.height * 0.5f - ly.anchorRow) * unit;

            var go = new GameObject("Layer_" + ly.name);
            go.transform.SetParent(content, false);
            go.transform.position = new Vector3(ly.x, centerY, ly.z);
            var sr = go.AddComponent<SpriteRenderer>();
            sr.sprite = sprite;
            sr.sortingOrder = ly.order;
            ApplyMaterial(sr);
            layers[ly.name] = sr;

            // Anchors that live on this layer (pixel coordinates -> world).
            if (loc.anchors == null) return;
            foreach (var an in loc.anchors)
            {
                if (an.layer != ly.name) continue;
                anchors[an.id] = new Vector3(
                    ly.x + (an.px - tex.width * 0.5f) * unit,
                    centerY + (tex.height * 0.5f - an.py) * unit,
                    ly.z);
            }
        }

        void BuildActor(ActorLayout placement)
        {
            var def = layout.Cast(placement.id);
            if (def == null)
            {
                Debug.LogWarning("[BigGreenBear] Character not in cast: " + placement.id);
                return;
            }
            var go = new GameObject("Actor_" + def.id);
            go.transform.SetParent(content, false);
            go.transform.position = new Vector3(placement.x, 0f, placement.z);
            var actor = go.AddComponent<Actor>();
            actor.Init(def, string.IsNullOrEmpty(placement.face) ? def.face : placement.face);
            actors[def.id] = actor;
            anchors[def.id] = go.transform.position + Vector3.up * def.height * 0.75f;
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

        string bellPlace = "none";
        public string BellPlace => bellPlace;

        // Puts the bell somewhere: an actor id ("nini", "bear"), an anchor id, or "none".
        public void PlaceBell(string where)
        {
            if (bell == null) return;
            bellPlace = string.IsNullOrEmpty(where) ? "none" : where;
            if (bellPlace == "none")
            {
                bell.enabled = false;
                bell.transform.SetParent(transform, true);
                return;
            }
            if (actors.TryGetValue(where, out var actor))
            {
                bell.enabled = true;
                // held in the right paw / hand (measured on the drawings)
                bell.transform.SetParent(actor.transform, false);
                bell.transform.localPosition = where == "bear" ? new Vector3(0.6f, 0.3f, -0.05f) : new Vector3(0.27f, 0.12f, -0.05f);
                bell.sortingOrder = actor.SortingOrder + 1;
            }
            else if (anchors.TryGetValue(where, out var p))
            {
                bell.enabled = true;
                bell.transform.SetParent(transform, false);
                bell.transform.position = p;
                bell.sortingOrder = 20;
            }
            else bell.enabled = false; // holder is not in this place
        }
    }
}
