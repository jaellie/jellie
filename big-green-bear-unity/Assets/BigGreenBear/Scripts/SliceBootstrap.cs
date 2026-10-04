// SliceBootstrap.cs — THE ONE SCRIPT TO ATTACH.
//
// Put this on an empty GameObject in an empty scene and press Play.
// It builds the whole vertical slice from Resources/BGB:
//   camera (2.5D) · painted layers · Big Green Bear · Nini · rain · lights ·
//   colour grading · synthesized audio · dialogue UI · the story director
using UnityEngine;

namespace BigGreenBear
{
    public class SliceBootstrap : MonoBehaviour
    {
        [Tooltip("Warm lamps and cold shadows use URP 2D lights. If the screen is black, untick this.")]
        public bool use2DLights = true;

        [Tooltip("Start in Korean. Otherwise follows the computer's language. Press L in play to switch.")]
        public bool forceKorean = false;

        void Start()
        {
            var layout = SliceData.Load<SceneLayout>("BGB/Data/layout");
            var script = SliceData.Load<SliceScript>("BGB/Data/slice");
            if (layout == null || script == null) return;

            // Camera: reuse the scene's main camera if there is one.
            var cam = Camera.main;
            if (cam == null)
            {
                var cgo = new GameObject("Main Camera");
                cgo.tag = "MainCamera";
                cam = cgo.AddComponent<Camera>();
                cgo.AddComponent<AudioListener>();
            }
            cam.clearFlags = CameraClearFlags.SolidColor;
            cam.backgroundColor = new Color(0.06f, 0.08f, 0.1f);

            if (use2DLights) Stage.UseLitMaterial();
            var stage = new GameObject("Stage").AddComponent<Stage>();
            stage.Build(layout, cam);

            var rig = cam.gameObject.GetComponent<CameraRig>();
            if (rig == null) rig = cam.gameObject.AddComponent<CameraRig>();
            rig.Init(cam, layout.camera, layout.focus);

            var rain = new GameObject("Rain").AddComponent<RainSystem>();
            rain.Init(cam.transform);

            var atmo = new GameObject("Atmosphere").AddComponent<Atmosphere>();
            atmo.Init(stage, rain, cam, layout, use2DLights);

            var audio = new GameObject("Audio").AddComponent<SliceAudio>();
            audio.Init();

            var ui = new GameObject("UI").AddComponent<SliceUI>();
            ui.Init();

            string lang = forceKorean || Application.systemLanguage == SystemLanguage.Korean ? "ko" : "en";
            var director = gameObject.AddComponent<SliceDirector>();
            director.Init(script, stage, rig, atmo, rain, ui, audio, lang);
            director.ShowTitle();
        }
    }
}
