using UnityEngine;
using UnityEngine.Rendering;

namespace DrivingSim.Cameras
{
    /// <summary>
    /// Renders one mirror into a small RenderTexture shown, flipped horizontally, on the mirror glass.
    /// To stay cheap on Android it renders only every <see cref="renderInterval"/> frames and only
    /// while live (cockpit view). When not live the glass shows a plain material.
    /// </summary>
    public class MirrorCamera : MonoBehaviour
    {
        [SerializeField] Camera mirrorCamera;
        [SerializeField] Renderer glass;
        [SerializeField] Material inactiveMaterial;

        [Min(16)] public int textureWidth = 256;
        [Min(16)] public int textureHeight = 128;
        [Tooltip("Render once every N frames. 1 = every frame.")]
        [Min(1)] public int renderInterval = 2;
        [Tooltip("Frame offset so mirrors don't all render on the same frame.")]
        [Min(0)] public int renderPhase;

        RenderTexture texture;
        Material liveMaterial;
        bool live;

        public bool IsLive => live;

        public void Configure(Camera cam, Renderer glassRenderer, Material inactive, int width, int height, int interval, int phase)
        {
            mirrorCamera = cam;
            glass = glassRenderer;
            inactiveMaterial = inactive;
            textureWidth = width;
            textureHeight = height;
            renderInterval = interval;
            renderPhase = phase;
        }

        void Awake()
        {
            if (mirrorCamera == null || glass == null) return;

            texture = new RenderTexture(textureWidth, textureHeight, 16, RenderTextureFormat.Default)
            {
                name = $"{name}_RT",
                antiAliasing = 1,
                useMipMap = false,
            };
            texture.Create();

            mirrorCamera.targetTexture = texture;
            mirrorCamera.enabled = false;
            mirrorCamera.allowHDR = false;
            mirrorCamera.allowMSAA = false;
            mirrorCamera.useOcclusionCulling = false;

            liveMaterial = new Material(FindUnlitShader()) { name = $"{name}_Glass" };
            liveMaterial.mainTexture = texture;
            liveMaterial.mainTextureScale = new Vector2(-1f, 1f); // a mirror is left-right reversed
            liveMaterial.mainTextureOffset = new Vector2(1f, 0f);
            SetLive(live);
        }

        public void SetLive(bool value)
        {
            live = value;
            if (mirrorCamera != null && !value) mirrorCamera.enabled = false;
            if (glass != null)
            {
                Material material = value && liveMaterial != null ? liveMaterial : inactiveMaterial;
                if (material != null) glass.sharedMaterial = material;
            }
        }

        void Update()
        {
            if (!live || mirrorCamera == null) return;
            // An enabled camera with a target texture renders this frame; disabled frames keep the last image.
            mirrorCamera.enabled = (Time.frameCount + renderPhase) % renderInterval == 0;
        }

        void OnDestroy()
        {
            if (mirrorCamera != null) mirrorCamera.targetTexture = null;
            if (texture != null)
            {
                texture.Release();
                Destroy(texture);
            }
            if (liveMaterial != null) Destroy(liveMaterial);
        }

        static Shader FindUnlitShader()
        {
            Shader shader = null;
            if (GraphicsSettings.currentRenderPipeline != null) shader = Shader.Find("Universal Render Pipeline/Unlit");
            if (shader == null) shader = Shader.Find("Unlit/Texture");
            if (shader == null) shader = Shader.Find("Universal Render Pipeline/Unlit");
            return shader;
        }
    }
}
