// StageBuilder.cs — builds one season's miniature stage from a SeasonTheme:
// ground, clock tower + town + stars (TowerBuilder), real 3D low-poly props, moonlight, fog.
// Everything is low-poly and static: runs on integrated graphics (no realtime shadows).
using System.Collections.Generic;
using UnityEngine;

namespace BigGreenBear2
{
    public class StageBuilder : MonoBehaviour
    {
        public readonly List<Renderer> flames = new List<Renderer>();   // candle flames (mirror hides one)
        public Transform root;

        public static Texture2D LoadTex(string path)
        {
            var t = Resources.Load<Texture2D>(path);
            if (t == null) Debug.LogWarning("[BigGreenBear2] Missing texture: Resources/" + path);
            else t.wrapMode = TextureWrapMode.Clamp;
            return t;
        }

        public void Build(SeasonTheme t, Camera cam)
        {
            root = new GameObject("Stage").transform;

            // ---- atmosphere
            Color sky = SeasonTheme.Hex(t.sky, new Color(0.06f, 0.09f, 0.18f));
            cam.clearFlags = CameraClearFlags.SolidColor;
            cam.backgroundColor = sky;
            RenderSettings.fog = true;
            RenderSettings.fogMode = FogMode.Linear;
            RenderSettings.fogColor = SeasonTheme.Hex(t.fog, sky);
            RenderSettings.fogStartDistance = t.fogNear;
            RenderSettings.fogEndDistance = t.fogFar;
            RenderSettings.ambientMode = UnityEngine.Rendering.AmbientMode.Flat;
            RenderSettings.ambientLight = SeasonTheme.Hex(t.ambient, new Color(0.4f, 0.5f, 0.8f));

            var moon = new GameObject("Moon").AddComponent<Light>();
            moon.transform.SetParent(root, false);
            moon.type = LightType.Directional;
            moon.color = SeasonTheme.Hex(t.moon, Color.white);
            moon.intensity = t.moonIntensity;
            moon.shadows = LightShadows.None;                    // keep it cheap
            moon.transform.rotation = Quaternion.Euler(50f, -30f, 0f);

            // ---- ground
            var ground = GameObject.CreatePrimitive(PrimitiveType.Quad);
            ground.name = "Ground";
            Destroy(ground.GetComponent<Collider>());
            ground.transform.SetParent(root, false);
            ground.transform.rotation = Quaternion.Euler(90f, 0f, 0f);
            ground.transform.localScale = new Vector3(120f, 80f, 1f);
            ground.GetComponent<Renderer>().sharedMaterial = Mats.Lit(null, SeasonTheme.Hex(t.ground, new Color(0.14f, 0.2f, 0.35f)));

            // ---- Game 2's own backdrop: stars, town silhouette and the stopped clock tower (all primitives)
            TowerBuilder.Build(root, t.towerX, t.towerZ);

            // ---- real 3D props
            var forest = LoadTex("BGB2/Props/forest_texture");
            var propMat = Mats.Lit(forest, SeasonTheme.Hex(t.propTint, Color.white));
            foreach (var p in t.props)
            {
                var prefab = Resources.Load<GameObject>("BGB2/Props/" + p.model);
                if (prefab == null) { Debug.LogWarning("[BigGreenBear2] Missing prop: " + p.model); continue; }
                var go = Instantiate(prefab, new Vector3(p.x, 0f, p.z), Quaternion.Euler(0f, p.rotY, 0f), root);
                go.transform.localScale = Vector3.one * p.scale;
                foreach (var r in go.GetComponentsInChildren<Renderer>())
                {
                    r.sharedMaterial = propMat;
                    r.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
                    r.receiveShadows = false;
                }
            }

            // ---- two lanterns (Section 1: pairs that are almost identical). The mirror will show one unlit.
            for (int i = 0; i < 2; i++) flames.Add(MakeLantern(new Vector3(i == 0 ? -1.2f : 6.4f, 0f, 1.2f)));
        }

        Renderer MakeLantern(Vector3 pos)
        {
            var body = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
            Destroy(body.GetComponent<Collider>());
            body.name = "Candle";
            body.transform.SetParent(root, false);
            body.transform.position = pos + Vector3.up * 0.35f;
            body.transform.localScale = new Vector3(0.18f, 0.35f, 0.18f);
            body.GetComponent<Renderer>().sharedMaterial = Mats.Lit(null, new Color(0.95f, 0.91f, 0.83f));

            var flame = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            Destroy(flame.GetComponent<Collider>());
            flame.name = "Flame";
            flame.transform.SetParent(root, false);
            flame.transform.position = pos + Vector3.up * 0.82f;
            flame.transform.localScale = new Vector3(0.12f, 0.2f, 0.12f);
            var r = flame.GetComponent<Renderer>();
            r.sharedMaterial = Mats.Unlit(new Color(1f, 0.76f, 0.48f));   // warm light, used sparingly
            return r;
        }
    }
}
