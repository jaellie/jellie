// TwinBootstrap.cs — THE ONE SCRIPT TO ATTACH (same idea as Game 1's SliceBootstrap).
//
// Put it on an empty GameObject in an empty scene and press Play. It builds:
//   season theme -> 3D low-poly stage -> Big Green Bear + Nini -> mirror window -> paper UI -> controls
// Change "seasonId" to load another season's look (Resources/BGB2/Seasons/<id>/season.json).
using UnityEngine;

namespace BigGreenBear2
{
    public class TwinBootstrap : MonoBehaviour
    {
        public string seasonId = "02-twins";

        SeasonTheme theme;
        Camera cam;
        StageBuilder stage;
        TwinActor player, ghost;
        TwinActor nini;
        MirrorWindow mirror;
        GameUI ui;
        float camX;
        const float Speed = 4.2f, MinX = -4.5f, MaxX = 12f, PlayerZ = 3.4f;
        bool started;

        static readonly Color BearGreen = new Color32(0x5E, 0x94, 0x6A, 255);
        static readonly Color NiniYellow = new Color32(0xE8, 0xBC, 0x4A, 255);

        void Start()
        {
            theme = SeasonTheme.Load(seasonId);
            if (theme == null) return;
            GameState.Load();
            Application.targetFrameRate = 60;

            cam = Camera.main;
            if (cam == null)
            {
                var cgo = new GameObject("Main Camera") { tag = "MainCamera" };
                cam = cgo.AddComponent<Camera>();
                cgo.AddComponent<AudioListener>();
            }
            cam.orthographic = false;
            cam.fieldOfView = 38f;
            cam.nearClipPlane = 0.1f;
            cam.farClipPlane = 120f;
            cam.depth = 0;

            // black bars behind the 16:9 frame
            var bgGo = new GameObject("BarsCamera");
            var bars = bgGo.AddComponent<Camera>();
            bars.clearFlags = CameraClearFlags.SolidColor;
            bars.backgroundColor = new Color(0.04f, 0.05f, 0.08f);
            bars.cullingMask = 0;
            bars.depth = -100;

            stage = new GameObject("StageBuilder").AddComponent<StageBuilder>();
            stage.Build(theme, cam);

            player = TwinActor.Create(Who.Bear, "bear_happy", 3.3f, stage.root);
            player.transform.position = new Vector3(3.3f, 0f, PlayerZ);
            ghost = TwinActor.Create(Who.Bear, "bear_happy", 3.3f, stage.root);
            ghost.transform.position = player.transform.position;
            nini = TwinActor.CreateNpc("nini_happy", 1.9f, stage.root);
            nini.transform.position = new Vector3(1.2f, 0f, 3f);

            ui = new GameObject("UI").AddComponent<GameUI>();
            ui.Init("BIG GREEN BEAR'S ADVENTURE II", "THE OTHER BEAR");
            ui.SetRoomLabel("ENTRANCE");

            // The mirror: hides the real bear, shows a slightly late ghost, and puts ONE candle out.
            mirror = new GameObject("Mirror").AddComponent<MirrorWindow>();
            mirror.Init(cam, player.GetComponentsInChildren<Renderer>(true), ghost, stage.flames.Count > 0 ? new[] { stage.flames[0] } : null);
            mirror.BindImage(ui.mirrorImage, GameUI.MirrorRect.width, GameUI.StageRect.width);

            camX = player.transform.position.x - 1.8f;
            PlaceCamera();
            ui.Say("The door is heavier than it looks.");
        }

        void Update()
        {
            if (theme == null) return;
            ui.FitCamera(cam);

            if (!started)
            {
                if (Input2.Confirm()) { started = true; ui.HideTitle(); }
                return;
            }

            if (Input2.Folder()) ui.ToggleFolder();
            if (Input2.Escape() && ui.FolderOpen) ui.CloseFolder();
            if (Input2.DevPhase()) { GameState.Phase = (GameState.Phase + 1) % 3; GameState.Save(); ui.RefreshTab(); }

            float dir = ui.FolderOpen ? 0f : Input2.Horizontal();
            var p = player.transform.position;
            p.x = Mathf.Clamp(p.x + dir * Speed * Time.deltaTime, MinX, MaxX);
            p.y = 0f;
            player.transform.position = p;
            player.Walk(dir);

            // reflection trails the player by ~0.4s
            var g = ghost.transform.position;
            g.x = Mathf.Lerp(g.x, p.x, 1f - Mathf.Exp(-Time.deltaTime / mirror.lag));
            g.z = p.z;
            ghost.transform.position = g;

            // Nini is near?
            bool near = Mathf.Abs(p.x - nini.transform.position.x) < 2.2f;
            ui.SetHint(near ? "E  talk" : "← → move · E interact · Tab case file");
            if (near && Input2.Interact() && !ui.FolderOpen)
                ui.Say("Nini", NiniYellow, "Bear! Bear! Is it true you have bells?");
        }

        void LateUpdate()
        {
            if (theme == null) return;
            // the bear lives on the right side of the frame, next to the mirror
            float target = player.transform.position.x - 1.8f;
            camX = Mathf.Lerp(camX, target, 1f - Mathf.Exp(-3f * Time.deltaTime));
            PlaceCamera();
        }

        void PlaceCamera()
        {
            var pos = new Vector3(camX, 2.4f, 13f);
            cam.transform.position = pos;
            cam.transform.rotation = Quaternion.LookRotation(new Vector3(camX, 3.4f, 0f) - pos);
        }
    }
}
