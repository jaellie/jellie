// MirrorWindow.cs — the "window" on the right of the frame. It is a physically plausible mirror image
// of the stage's right edge: same world, same camera, horizontally flipped. It is NEVER labelled.
//   * a ghost Bear trails the real one by ~0.4 s (a mirror that is slightly slow)
//   * ONE small discrepancy per scene (here: one candle flame is out)
// A flipped Big Green Bear reads as "left-handed, scarf on the other side" — i.e. Green.
// Players don't know this is foreshadowing until the identity mystery lands.
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.UI;

namespace BigGreenBear2
{
    public class MirrorWindow : MonoBehaviour
    {
        public RenderTexture rt;
        public Camera mirrorCam;
        public RawImage image;

        Camera mainCam;
        Renderer[] hideInMirror;     // the real player
        Renderer[] onlyInMirror;     // the lagging ghost
        Renderer[] diff;             // the one tiny discrepancy
        public float lag = 0.4f;

        public void Init(Camera main, Renderer[] realPlayer, TwinActor ghost, Renderer[] discrepancy)
        {
            mainCam = main;
            hideInMirror = realPlayer;
            onlyInMirror = ghost.GetComponentsInChildren<Renderer>(true);
            diff = discrepancy;

            rt = new RenderTexture(960, 540, 24) { name = "MirrorRT" };
            var go = new GameObject("MirrorCamera");
            go.transform.SetParent(transform, false);
            mirrorCam = go.AddComponent<Camera>();
            mirrorCam.CopyFrom(main);
            mirrorCam.targetTexture = rt;
            mirrorCam.rect = new Rect(0, 0, 1, 1);
            mirrorCam.depth = main.depth - 1;

            RenderPipelineManager.beginCameraRendering += OnBeginSRP;
            RenderPipelineManager.endCameraRendering += OnEndSRP;
            Camera.onPreCull += OnPreCullBuiltin;
            Camera.onPostRender += OnPostRenderBuiltin;
        }

        void OnDestroy()
        {
            RenderPipelineManager.beginCameraRendering -= OnBeginSRP;
            RenderPipelineManager.endCameraRendering -= OnEndSRP;
            Camera.onPreCull -= OnPreCullBuiltin;
            Camera.onPostRender -= OnPostRenderBuiltin;
            if (rt != null) rt.Release();
        }

        // Show only the right strip of the stage, flipped left<->right (a real mirror on the right wall).
        public void BindImage(RawImage img, float stripPx, float stageWidthPx)
        {
            image = img;
            img.texture = rt;
            float w = stripPx / stageWidthPx;
            img.uvRect = new Rect(1f, 0f, -w, 1f);
            img.color = new Color(0.82f, 0.88f, 0.98f, 1f);
        }

        void LateUpdate()
        {
            if (mirrorCam == null || mainCam == null) return;
            mirrorCam.transform.SetPositionAndRotation(mainCam.transform.position, mainCam.transform.rotation);
            mirrorCam.fieldOfView = mainCam.fieldOfView;
        }

        void Toggle(bool mirrorPass)
        {
            foreach (var r in hideInMirror) if (r != null) r.enabled = !mirrorPass;
            foreach (var r in onlyInMirror) if (r != null) r.enabled = mirrorPass;
            if (diff != null) foreach (var r in diff) if (r != null) r.enabled = !mirrorPass;
        }

        void OnBeginSRP(ScriptableRenderContext ctx, Camera c) { if (c == mirrorCam) Toggle(true); else if (c == mainCam) Toggle(false); }
        void OnEndSRP(ScriptableRenderContext ctx, Camera c) { if (c == mirrorCam) Toggle(false); }
        void OnPreCullBuiltin(Camera c) { if (GraphicsSettings.currentRenderPipeline != null) return; if (c == mirrorCam) Toggle(true); else if (c == mainCam) Toggle(false); }
        void OnPostRenderBuiltin(Camera c) { if (GraphicsSettings.currentRenderPipeline != null) return; if (c == mirrorCam) Toggle(false); }
    }
}
