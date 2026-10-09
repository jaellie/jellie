#if UNITY_EDITOR
using System.Collections.Generic;
using System.IO;
using TMPro;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.InputSystem.UI;
using UnityEngine.Rendering.Universal;
using UnityEngine.SceneManagement;
using UnityEngine.UI;

namespace BGB2.EditorTools
{
    /// <summary>Menu: BGB2 > 2 Build Investigate Scene. Creates the Bell Village scene, content assets and the whole Investigate UI.
    /// All pixel positions below are the ones tested in the web prototype (1920x1080); y is flipped to Unity's up axis.</summary>
    public static class InvestigateSceneBuilder
    {
        const string Root = "Assets/_BGB";
        const float PPU = 100f;
        const float FeetY = 985f;

        static Vector3 W(float xPx, float yPx, float z = 0f) => new Vector3(xPx / PPU, (540f - yPx) / PPU, z);
        static Sprite Spr(string path) => AssetDatabase.LoadAssetAtPath<Sprite>(path);
        static Sprite Ui(string n) => Spr(Root + "/Art/UI/" + n + ".png");
        static Sprite Chr(string n) => Spr(Root + "/Art/Characters/" + n + ".png");
        static Sprite Por(string n) => Spr(Root + "/Art/Portraits/" + n + ".png");

        static TMP_FontAsset fontAsset;
        static Material litMat, unlitMat;

        [MenuItem("BGB2/2 Build Investigate Scene")]
        public static void Build()
        {
            litMat = new Material(Shader.Find("Universal Render Pipeline/2D/Sprite-Lit-Default"));
            unlitMat = new Material(Shader.Find("Universal Render Pipeline/2D/Sprite-Unlit-Default"));
            fontAsset = FindOrCreateFont();

            var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

            // ---- content (ScriptableObjects)
            var notice = MakeEvidence("notice", "EV_Notice", "Remembrance Bell notice", "추모의 종 공고",
                "A notice pinned to the signpost: the Remembrance Bell rings at midnight, and everyone in Bell Village is asked to come to the Clocktower. Signed with an E.",
                "표지판에 붙은 공고. 추모의 종이 자정에 울리며, 벨 마을 모두가 시계탑으로 모여 달라는 내용이다. 'E'라고 서명되어 있다.",
                "The midnight bell was a village ritual. Edward's notice asked everyone to attend.", "자정의 종은 마을의 의식이었다. 에드워드의 공고는 모두에게 참석을 청하고 있었다.", "NOTICE", Ui("paper_scrap"));
            var clock = MakeEvidence("clock", "EV_Clock", "The stopped clock", "멈춰 선 시계",
                "The tower clock is frozen at 11:47. That is when the clock stopped. It does not say when Edward died.",
                "탑시계가 11시 47분에 멈춰 있다. 시계가 멈춘 시각일 뿐, 에드워드가 죽은 시각은 아니다.",
                "The dial stopped at 11:47.", "시계 문자판이 11시 47분에 멈췄다.", "CLOCK", null);
            var niniDlg = MakeNiniDialogue();
            var oliverDlg = MakeOliverDialogue();

            // ---- camera, lights
            var camGo = new GameObject("Main Camera") { tag = "MainCamera" };
            var cam = camGo.AddComponent<Camera>();
            cam.orthographic = true; cam.orthographicSize = 5.4f; cam.backgroundColor = new Color(0.04f, 0.06f, 0.13f);
            cam.clearFlags = CameraClearFlags.SolidColor;
            camGo.AddComponent<UniversalAdditionalCameraData>();
            camGo.transform.position = new Vector3(9.6f, 0f, -10f);

            var globalLight = new GameObject("Global Light 2D").AddComponent<Light2D>();
            globalLight.lightType = Light2D.LightType.Global;
            globalLight.color = new Color(0.55f, 0.65f, 0.95f);
            globalLight.intensity = 0.62f;

            // ---- parallax layers (unlit: the painting keeps its own light)
            var layers = new GameObject("Layers").transform;
            Layer(layers, cam.transform, "Far",        "village_far",        0.5f,  -150f, 168f, 0.10f, -40);
            Layer(layers, cam.transform, "Mid",        "village_mid",        0.45f,    0f,  55f, 0.35f, -30);
            Layer(layers, cam.transform, "Ground",     "village_ground",     0.6f,     0f, 644f, 1.00f, -20);
            Layer(layers, cam.transform, "Foreground", "village_foreground", 0.65f,    0f, 884f, 1.20f,  30);

            // ---- lamps (positions from the Ground layer art)
            var lamps = new List<Transform>();
            foreach (float lx in new[] { 372f, 1146f, 1786f, 2765f, 3550f })
            {
                var lamp = new GameObject("Lamp Light").AddComponent<Light2D>();
                lamp.transform.position = W(lx, 700f);
                lamp.lightType = Light2D.LightType.Point;
                lamp.color = new Color(1f, 0.69f, 0.28f);
                lamp.intensity = 0.9f;
                lamp.pointLightOuterRadius = 4.7f;
                lamp.pointLightInnerRadius = 0.3f;
                lamps.Add(lamp.transform);
            }

            // ---- characters
            var bgb = Actor("BGB", "big_green_bear", 220f, 520f, lamps, true);
            Actor("Nini", "nini", Mathf.Round(220f * 0.55f), 1010f, lamps, false);
            Actor("Oliver", "clockkeeper", 165f, 2610f, lamps, false);
            var player = bgb.GetComponent<PlayerController>();
            player.front = Chr("big_green_bear__3_front"); player.left = Chr("big_green_bear__1_left_profile"); player.right = Chr("big_green_bear__6_right_profile");

            var follow = camGo.AddComponent<CameraFollow2D>();
            follow.target = bgb.transform; follow.minX = 9.6f; follow.maxX = 28.52f;

            // ---- interactables
            var list = new List<Interactable>();
            list.Add(Interact("Nini", 1010f, 220f * 0.55f, "Talk to Nini", "니니와 이야기한다", niniDlg, null));
            list.Add(Interact("Signpost", 1345f, 120f, "Read the signpost", "표지판을 읽는다", null, notice, 640f));
            list.Add(Interact("Oliver", 2610f, 165f, "Talk to the Clockkeeper", "시계지기와 이야기한다", oliverDlg, null));
            list.Add(Interact("Clock", 2790f, 120f, "Look up at the clock", "시계를 올려다본다", null, clock, 560f));
            var door = Interact("ClocktowerDoor", 2856f, 120f, "Enter the Clocktower", "시계탑에 들어간다", null, null, 600f);
            door.loadScene = "Clocktower";
            list.Add(door);

            // ---- UI
            var ui = BuildUi(player, list, new List<EvidenceDefinition> { notice, clock }, out var screen);

            var sensor = new GameObject("InteractionSensor").AddComponent<InteractionSensor>();
            sensor.player = bgb.transform; sensor.interactables = list.ToArray(); sensor.prompt = ui.prompt;

            // Event system with the Input System UI module
            var es = new GameObject("EventSystem"); es.AddComponent<EventSystem>(); es.AddComponent<InputSystemUIInputModule>();

            screen.player = player;
            string scenePath = Root + "/Scenes/BellVillage/BellVillage_Investigate.unity";
            EditorSceneManager.SaveScene(scene, scenePath);
            EditorBuildSettings.scenes = new[] { new EditorBuildSettingsScene(scenePath, true) };
            Debug.Log("BGB2: scene saved to " + scenePath + ". Press Play. Keys: A/D walk, Shift run, E interact, Tab Case File, F2 language.");
        }

        // ------------------------------------------------------------------ world helpers
        static void Layer(Transform parent, Transform cam, string name, string sprite, float scale, float leftPx, float topPx, float factor, int order)
        {
            var go = new GameObject(name);
            go.transform.SetParent(parent);
            go.transform.position = W(leftPx, topPx);
            go.transform.localScale = Vector3.one * scale;
            var sr = go.AddComponent<SpriteRenderer>();
            sr.sprite = Spr(Root + "/Art/Backgrounds/BellVillage/" + sprite + ".png");
            sr.sharedMaterial = unlitMat; sr.sortingOrder = order;
            var p = go.AddComponent<ParallaxLayer>(); p.cam = cam; p.factor = factor;
        }

        static GameObject Actor(string name, string baseName, float heightPx, float xPx, List<Transform> lamps, bool player)
        {
            var root = new GameObject(name);
            root.transform.position = W(xPx, FeetY);
            var body = new GameObject("Body").AddComponent<SpriteRenderer>();
            body.transform.SetParent(root.transform, false);
            var front = Chr(baseName + "__3_front");
            body.sprite = front; body.sharedMaterial = litMat; body.sortingOrder = 0;
            float s = heightPx / front.rect.height;
            body.transform.localScale = Vector3.one * s;

            var shadow = new GameObject("Contact Shadow").AddComponent<SpriteRenderer>();
            shadow.transform.SetParent(root.transform, false);
            shadow.sprite = ShadowSprite(); shadow.sharedMaterial = unlitMat; shadow.sortingOrder = -1;
            shadow.transform.localPosition = new Vector3(0f, 0.03f, 0f);
            float shadowW = front.rect.width * s / PPU * 0.85f;
            shadow.transform.localScale = new Vector3(shadowW, 0.24f, 1f);

            var resp = root.AddComponent<LampLightResponder>();
            resp.lamps = lamps.ToArray(); resp.shadow = shadow.transform; resp.shadowBaseWidth = shadowW;

            if (player)
            {
                var pc = root.AddComponent<PlayerController>();
                pc.body = body; pc.front = front;
            }
            return root;
        }

        static Sprite shadowSprite;
        static Sprite ShadowSprite()
        {
            if (shadowSprite != null) return shadowSprite;
            string path = Root + "/Art/Props/contact_shadow.png";
            if (!File.Exists(path))
            {
                const int n = 128;
                var tex = new Texture2D(n, n, TextureFormat.RGBA32, false);
                for (int y = 0; y < n; y++)
                    for (int x = 0; x < n; x++)
                    {
                        float dx = (x - n / 2f) / (n / 2f), dy = (y - n / 2f) / (n / 2f);
                        float d = Mathf.Sqrt(dx * dx + dy * dy);
                        float a = Mathf.Clamp01(1f - d); a = a * a * 0.7f;
                        tex.SetPixel(x, y, new Color(0.02f, 0.04f, 0.11f, a));
                    }
                File.WriteAllBytes(path, tex.EncodeToPNG());
                AssetDatabase.ImportAsset(path);
                var imp = (TextureImporter)AssetImporter.GetAtPath(path);
                imp.textureType = TextureImporterType.Sprite; imp.spritePixelsPerUnit = 128f; imp.SaveAndReimport();
            }
            shadowSprite = Spr(path);
            return shadowSprite;
        }

        static Interactable Interact(string name, float xPx, float headHeightPx, string en, string ko, DialogueDefinition dlg, EvidenceDefinition ev, float markerYPx = -1f)
        {
            var go = new GameObject("Interact_" + name);
            go.transform.position = W(xPx, FeetY);
            var i = go.AddComponent<Interactable>();
            i.id = name; i.prompt = new LocalizedText(en, ko); i.dialogue = dlg; i.evidence = ev;
            // "!" marker sits above the head (never over the face)
            var m = new GameObject("Marker");
            m.transform.SetParent(go.transform, false);
            float y = markerYPx >= 0f ? markerYPx : FeetY - headHeightPx - 85f;
            m.transform.position = W(xPx, y);
            var sr = m.AddComponent<SpriteRenderer>();
            sr.sprite = Ui("bubble_exclaim"); sr.sharedMaterial = unlitMat; sr.sortingOrder = 40;
            var mk = m.AddComponent<ExclamationMarker>(); mk.sprite = sr;
            return i;
        }

        // ------------------------------------------------------------------ content
        static EvidenceDefinition MakeEvidence(string id, string file, string en, string ko, string descEn, string descKo, string noteEn, string noteKo, string tag, Sprite icon)
        {
            string path = Root + "/ScriptableObjects/Evidence/" + file + ".asset";
            var e = AssetDatabase.LoadAssetAtPath<EvidenceDefinition>(path);
            if (e == null) { e = ScriptableObject.CreateInstance<EvidenceDefinition>(); AssetDatabase.CreateAsset(e, path); }
            e.id = id; e.displayName = new LocalizedText(en, ko); e.descriptionEn = descEn; e.descriptionKo = descKo;
            e.note = new LocalizedText(noteEn, noteKo); e.tag = tag; e.icon = icon;
            EditorUtility.SetDirty(e);
            return e;
        }

        static DialogueNode N(string sp, string en, string ko, int next = -1, string flag = null, Expression ex = Expression.Neutral, params DialogueChoice[] ch)
            => new DialogueNode { speakerId = sp, text = new LocalizedText(en, ko), next = next, setFlag = flag, expression = ex, choices = ch };
        static DialogueChoice C(string en, string ko, int next) => new DialogueChoice { text = new LocalizedText(en, ko), nextNode = next };

        static DialogueDefinition MakeNiniDialogue()
        {
            var d = LoadOrCreate<DialogueDefinition>(Root + "/ScriptableObjects/Dialogue/DLG_Nini_Intro.asset");
            d.nodes = new[]
            {
                N("nini", "Edward never missed the midnight bell. Never.", "에드워드 아저씨는 자정 종을 한 번도 놓친 적이 없어요. 한 번도요.", 1, null, Expression.Worried),
                N("nini", "Everyone is standing at the tower and nobody will go in. They keep asking if it was an accident.", "다들 탑 앞에 서 있기만 하고 아무도 안으로 들어가지 못해요. 사고였느냐고만 계속 물어요.", -1, null, Expression.Worried,
                    C("Tell me what you remember about last night.", "어젯밤에 기억나는 걸 말해 줘.", 2), C("Has anyone said who was on the stairs?", "계단에 누가 있었는지 말한 사람이 있어?", 4)),
                N("nini", "I left the archive at nine. He was sealing letters at his desk. Two of them. I didn't ask who they were for.", "저는 아홉 시에 기록실을 나왔어요. 아저씨는 책상에서 편지를 봉하고 계셨고요. 두 통이었어요. 누구에게 보내는지는 묻지 않았어요.", 3, "nini.letters", Expression.Thinking),
                N("nini", "Please look at the clock. It stopped at eleven forty-seven, and nobody can tell me what that means.", "시계를 봐 주세요. 열한 시 사십칠 분에 멈췄는데, 그게 무슨 뜻인지 아무도 말해 주지 못해요.", -1, "nini.done", Expression.Worried),
                N("nini", "Oliver says a bear in a scarf climbed the stairs at eleven forty. Before you got there.", "올리버 아저씨가 그러는데, 열한 시 사십 분쯤 목도리를 한 곰이 계단을 올라갔대요. 당신이 오기 전에요.", -1, null, Expression.Neutral,
                    C("I was at the café until a quarter to twelve.", "나는 열두 시 십오 분 전까지 카페에 있었어.", 5), C("(Say nothing.)", "(말없이 있는다.)", 3)),
                N("nini", "I know. Hazel told everyone. That's why they want you to look into it.", "알아요. 헤이즐 아주머니가 다 말했어요. 그래서 다들 당신이 조사해 주길 바라는 거예요.", 3, null, Expression.Neutral),
            };
            EditorUtility.SetDirty(d);
            return d;
        }

        static DialogueDefinition MakeOliverDialogue()
        {
            var d = LoadOrCreate<DialogueDefinition>(Root + "/ScriptableObjects/Dialogue/DLG_Oliver_Stairs.asset");
            d.nodes = new[]
            {
                N("oliver", "Mm. Last night, around eleven forty. I saw a bear climbing these stairs. He was carrying something in his right hand.", "음. 어젯밤, 열한 시 사십 분쯤이었어요. 곰이 이 계단을 올라가는 걸 봤습니다. 오른손에 무언가를 들고 있었죠.", -1, "oliver.bear", Expression.Neutral,
                    C("Is the tower clock reliable?", "이 탑시계는 믿을 만한가요?", 1), C("Thank you.", "고맙습니다.", -1)),
                N("oliver", "Mm. I wind it every evening. I set Edward's pocket watch by it each morning, so the two never differ by a minute.", "음. 저녁마다 태엽을 감습니다. 에드워드 씨의 회중시계도 매일 아침 이 시계에 맞추니, 둘은 일 분도 어긋나지 않았죠.", -1),
            };
            EditorUtility.SetDirty(d);
            return d;
        }

        static T LoadOrCreate<T>(string path) where T : ScriptableObject
        {
            var a = AssetDatabase.LoadAssetAtPath<T>(path);
            if (a == null) { a = ScriptableObject.CreateInstance<T>(); AssetDatabase.CreateAsset(a, path); }
            return a;
        }

        // ------------------------------------------------------------------ UI
        class UiRefs { public InteractionPrompt prompt; }

        static UiRefs BuildUi(PlayerController player, List<Interactable> interactables, List<EvidenceDefinition> evidence, out InvestigateScreen screen)
        {
            var refs = new UiRefs();
            var canvasGo = new GameObject("UI Canvas");
            var canvas = canvasGo.AddComponent<Canvas>(); canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            var scaler = canvasGo.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize; scaler.referenceResolution = new Vector2(1920, 1080);
            scaler.screenMatchMode = CanvasScaler.ScreenMatchMode.MatchWidthOrHeight; scaler.matchWidthOrHeight = 0.5f;
            scaler.referencePixelsPerUnit = PPU;
            canvasGo.AddComponent<GraphicRaycaster>();
            var cRt = (RectTransform)canvasGo.transform;
            screen = new GameObject("InvestigateScreen").AddComponent<InvestigateScreen>();

            // --- Case File (below the side panel so the categories stay clickable)
            var cf = MakePanel(cRt, "CaseFile", Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero, new Color(0.02f, 0.03f, 0.08f, 0.82f));
            var page = MakePanel(cf, "Page", new Vector2(0, 1), new Vector2(0, 1), new Vector2(392, -70), new Vector2(1228, 940), new Color(0.95f, 0.89f, 0.74f, 1f));
            page.pivot = new Vector2(0, 1);
            var heading = MakeText(page, "Heading", "", 44, new Vector2(56, -52), new Vector2(1100, 60), TextAlignmentOptions.TopLeft, FontStyles.Bold, new Color(0.23f, 0.16f, 0.11f));
            var body = MakeText(page, "Body", "", 29, new Vector2(56, -150), new Vector2(1110, 740), TextAlignmentOptions.TopLeft, FontStyles.Normal, new Color(0.23f, 0.16f, 0.11f));
            var caseFile = new GameObject("CaseFileView").AddComponent<CaseFileView>();
            caseFile.root = cf.gameObject; caseFile.heading = heading; caseFile.pageBody = body; caseFile.allEvidence = evidence;
            var closeBtn = ImageButton(page, "Close", Ui("icon_close"), new Vector2(1, 1), new Vector2(-6, 8), new Vector2(78, 80));
            closeBtn.onClick.AddListener(caseFile.Close);
            cf.gameObject.SetActive(false);

            // --- Category panel (always visible, six equal buttons)
            var side = MakeImage(cRt, "CategoryPanel", Ui("nav_binder_6slots_COMPOSITE"), new Vector2(0, 1), new Vector2(0, 1), new Vector2(12, -182), new Vector2(294, 559));
            side.rectTransform.pivot = new Vector2(0, 1);
            var panel = side.gameObject.AddComponent<CategoryPanel>();
            panel.normal = Ui("plaque_cream_small"); panel.selected = Ui("plaque_red_small");
            float[] slotCy = { 85, 174, 259, 344, 429, 514 }; float sk = 294f / 309f;
            for (int i = 0; i < 6; i++)
            {
                var bImg = MakeImage(side.rectTransform, "Tab" + i, panel.normal, new Vector2(0, 1), new Vector2(0, 1), new Vector2(62, -(slotCy[i] - 39f) * sk), new Vector2(202, 74));
                bImg.rectTransform.pivot = new Vector2(0, 1); bImg.type = UnityEngine.UI.Image.Type.Sliced; bImg.pixelsPerUnitMultiplier = 1f / 0.97f;
                var btn = bImg.gameObject.AddComponent<Button>(); btn.targetGraphic = bImg;
                var lab = MakeText(bImg.rectTransform, "Label", "", 20, new Vector2(0, 0), Vector2.zero, TextAlignmentOptions.Center, FontStyles.Bold, new Color(0.23f, 0.16f, 0.11f));
                Stretch(lab.rectTransform);
                panel.buttons.Add(btn); panel.backgrounds.Add(bImg); panel.labels.Add(lab);
            }
            caseFile.categories = panel;
            screen.categories = panel; screen.caseFile = caseFile;

            // --- Case plate (large)
            var plate = MakeImage(cRt, "CasePlate", Ui("panel_wide_title"), new Vector2(0, 1), new Vector2(0, 1), new Vector2(26, -20), new Vector2(450, 144));
            plate.rectTransform.pivot = new Vector2(0, 1); plate.type = UnityEngine.UI.Image.Type.Sliced; plate.pixelsPerUnitMultiplier = 1f / 0.98f;
            var plateText = MakeText(plate.rectTransform, "Text", "<size=20><color=#8a6a3e>CASE C-01</color></size>\n<size=37><b>The Death of Edward</b></size>\n<size=21><i>Bell Village</i></size>", 26,
                Vector2.zero, Vector2.zero, TextAlignmentOptions.MidlineLeft, FontStyles.Normal, new Color(0.23f, 0.16f, 0.11f));
            Stretch(plateText.rectTransform, 64, 22);
            var fit = plate.gameObject.AddComponent<FitToText>(); fit.label = plateText; fit.padding = new Vector2(64, 22); fit.minWidth = 430; fit.maxWidth = 900;

            // --- HUD buttons (Case File / Pause placeholder)
            var satchel = ImageButton(cRt, "BtnCase", Ui("icon_satchel"), new Vector2(1, 1), new Vector2(-178, -26), new Vector2(76, 78));
            satchel.onClick.AddListener(() => caseFile.Open(0));
            ImageButton(cRt, "BtnLook", Ui("icon_search"), new Vector2(1, 1), new Vector2(-100, -26), new Vector2(76, 78));
            ImageButton(cRt, "BtnSettings", Ui("icon_settings"), new Vector2(1, 1), new Vector2(-22, -26), new Vector2(76, 78));

            // --- Interaction prompt: 20% smaller than before, fades, hides instantly on interaction
            var promptImg = MakeImage(cRt, "InteractionPrompt", Ui("plaque_cream_small"), new Vector2(0.5f, 0), new Vector2(0.5f, 0), new Vector2(0, 34), new Vector2(322, 65));
            promptImg.rectTransform.pivot = new Vector2(0.5f, 0); promptImg.type = UnityEngine.UI.Image.Type.Sliced; promptImg.pixelsPerUnitMultiplier = 1f;
            var group = promptImg.gameObject.AddComponent<CanvasGroup>();
            var promptText = MakeText(promptImg.rectTransform, "Label", "", 20, Vector2.zero, Vector2.zero, TextAlignmentOptions.Center, FontStyles.Bold, new Color(0.23f, 0.16f, 0.11f));
            Stretch(promptText.rectTransform);
            var key = MakePanel(promptImg.rectTransform, "KeyCap", new Vector2(0, 0.5f), new Vector2(0, 0.5f), new Vector2(36, 0), new Vector2(34, 34), new Color(0.43f, 0.16f, 0.21f));
            MakeText(key, "E", "E", 17, Vector2.zero, Vector2.zero, TextAlignmentOptions.Center, FontStyles.Bold, new Color(0.96f, 0.89f, 0.75f)).rectTransform.anchorMax = Vector2.one;
            var promptFit = promptImg.gameObject.AddComponent<FitToText>(); promptFit.label = promptText; promptFit.padding = new Vector2(62, 17); promptFit.minWidth = 260; promptFit.maxWidth = 720;
            var prompt = promptImg.gameObject.AddComponent<InteractionPrompt>(); prompt.label = promptText;
            refs.prompt = prompt;

            // --- Dialogue (centred; box width is set in the prefab, text fits inside)
            var dlgRoot = new GameObject("Dialogue", typeof(RectTransform)); dlgRoot.transform.SetParent(cRt, false);
            Stretch((RectTransform)dlgRoot.transform);
            var box = MakeImage(dlgRoot.GetComponent<RectTransform>(), "Box", Ui("dialogue_box_tall_portrait_ribbon"), new Vector2(0.5f, 0), new Vector2(0.5f, 0), new Vector2(0, 34), new Vector2(1520, 296));
            box.rectTransform.pivot = new Vector2(0.5f, 0); box.type = UnityEngine.UI.Image.Type.Sliced; box.pixelsPerUnitMultiplier = 1f / 1.4f;
            var portrait = MakeImage(box.rectTransform, "Portrait", null, new Vector2(0, 1), new Vector2(0, 1), new Vector2(49, -59), new Vector2(200, 196));
            portrait.rectTransform.pivot = new Vector2(0, 1); portrait.preserveAspect = true;
            var nameT = MakeText(box.rectTransform, "Name", "", 31, new Vector2(275, -17), new Vector2(267, 51), TextAlignmentOptions.Center, FontStyles.Bold, new Color(0.96f, 0.89f, 0.75f));
            var bodyT = MakeText(box.rectTransform, "Body", "", 36.5f, new Vector2(287, -97), new Vector2(1075, 170), TextAlignmentOptions.TopLeft, FontStyles.Normal, new Color(0.23f, 0.16f, 0.11f));
            var choiceHost = new GameObject("Choices", typeof(RectTransform)); choiceHost.transform.SetParent(dlgRoot.transform, false);
            var chRt = (RectTransform)choiceHost.transform; chRt.anchorMin = chRt.anchorMax = new Vector2(0.5f, 0); chRt.pivot = new Vector2(0.5f, 0); chRt.anchoredPosition = new Vector2(0, 352); chRt.sizeDelta = new Vector2(1100, 220);
            var vlg = choiceHost.AddComponent<VerticalLayoutGroup>(); vlg.childAlignment = TextAnchor.LowerCenter; vlg.spacing = 12; vlg.childControlWidth = false; vlg.childControlHeight = false; vlg.childForceExpandWidth = false; vlg.childForceExpandHeight = false;
            var tmpl = MakeImage(chRt, "ChoiceTemplate", Ui("plaque_cream_small"), Vector2.zero, Vector2.zero, Vector2.zero, new Vector2(640, 92));
            tmpl.type = UnityEngine.UI.Image.Type.Sliced; tmpl.pixelsPerUnitMultiplier = 1f / 1.3f;
            var tBtn = tmpl.gameObject.AddComponent<Button>(); tBtn.targetGraphic = tmpl;
            var tLab = MakeText(tmpl.rectTransform, "Label", "", 31, Vector2.zero, Vector2.zero, TextAlignmentOptions.Center, FontStyles.Bold, new Color(0.23f, 0.16f, 0.11f)); Stretch(tLab.rectTransform);
            var tFit = tmpl.gameObject.AddComponent<FitToText>(); tFit.label = tLab; tFit.padding = new Vector2(48, 20); tFit.minHeight = 92; tFit.maxWidth = 1100;
            tmpl.gameObject.SetActive(false);
            var dv = dlgRoot.AddComponent<DialogueView>();
            dv.root = dlgRoot; dv.box = box.rectTransform; dv.portrait = portrait; dv.speakerName = nameT; dv.body = bodyT; dv.choiceHost = chRt; dv.choiceTemplate = tBtn;
            dv.speakers = new List<Speaker>
            {
                new Speaker { id = "nini", displayName = new LocalizedText("Nini", "니니"), portrait = Chr("nini__3_front"), neutral = Por("nini_neutral"), worried = Por("nini_worried"), surprised = Por("nini_surprised"), thinking = Por("nini_thinking") },
                new Speaker { id = "oliver", displayName = new LocalizedText("Oliver", "올리버"), portrait = Chr("clockkeeper__3_front") },
            };
            dlgRoot.SetActive(false);
            screen.dialogue = dv;

            // --- Inspect card + toast
            var insp = MakePanel(cRt, "Inspect", Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero, new Color(0.02f, 0.03f, 0.08f, 0.74f));
            var card = MakePanel(insp, "Card", new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(760, 520), new Color(0.95f, 0.89f, 0.74f));
            var iTitle = MakeText(card, "Title", "", 46, new Vector2(0, -30), new Vector2(680, 60), TextAlignmentOptions.Center, FontStyles.Bold, new Color(0.23f, 0.16f, 0.11f)); iTitle.rectTransform.anchorMin = new Vector2(0.5f, 1); iTitle.rectTransform.anchorMax = new Vector2(0.5f, 1); iTitle.rectTransform.pivot = new Vector2(0.5f, 1);
            var iIcon = MakeImage(card, "Icon", null, new Vector2(0.5f, 1), new Vector2(0.5f, 1), new Vector2(0, -100), new Vector2(150, 150)); iIcon.preserveAspect = true;
            var iBody = MakeText(card, "Body", "", 28, new Vector2(0, -270), new Vector2(680, 140), TextAlignmentOptions.Top, FontStyles.Normal, new Color(0.23f, 0.16f, 0.11f)); iBody.rectTransform.anchorMin = new Vector2(0.5f, 1); iBody.rectTransform.anchorMax = new Vector2(0.5f, 1); iBody.rectTransform.pivot = new Vector2(0.5f, 1);
            var iClose = MakeImage(card, "CloseBtn", Ui("plaque_cream_small"), new Vector2(0.5f, 0), new Vector2(0.5f, 0), new Vector2(0, 28), new Vector2(340, 80)); iClose.type = UnityEngine.UI.Image.Type.Sliced; iClose.pixelsPerUnitMultiplier = 1f / 1.25f;
            var iBtn = iClose.gameObject.AddComponent<Button>(); iBtn.targetGraphic = iClose;
            var iLab = MakeText(iClose.rectTransform, "Label", "Close / 닫기", 28, Vector2.zero, Vector2.zero, TextAlignmentOptions.Center, FontStyles.Bold, new Color(0.23f, 0.16f, 0.11f)); Stretch(iLab.rectTransform);
            screen.inspectRoot = insp.gameObject; screen.inspectTitle = iTitle; screen.inspectBody = iBody; screen.inspectIcon = iIcon; screen.inspectClose = iBtn;
            insp.gameObject.SetActive(false);

            var toastImg = MakePanel(cRt, "Toast", new Vector2(0.5f, 1), new Vector2(0.5f, 1), new Vector2(0, -40), new Vector2(620, 62), new Color(0.11f, 0.14f, 0.25f, 0.95f));
            var tg = toastImg.gameObject.AddComponent<CanvasGroup>(); tg.alpha = 0f; tg.blocksRaycasts = false;
            var toastText = MakeText(toastImg, "Text", "", 26, Vector2.zero, Vector2.zero, TextAlignmentOptions.Center, FontStyles.Bold, new Color(1f, 0.89f, 0.65f)); Stretch(toastText.rectTransform);
            screen.toast = tg; screen.toastText = toastText;

            // order: Case File sits under the category panel and plate
            cf.SetSiblingIndex(0);
            return refs;
        }

        // ------------------------------------------------------------------ small UI builders
        static RectTransform MakePanel(RectTransform parent, string name, Vector2 aMin, Vector2 aMax, Vector2 pos, Vector2 size, Color color)
        {
            var go = new GameObject(name, typeof(RectTransform), typeof(Image)); go.transform.SetParent(parent, false);
            var rt = (RectTransform)go.transform; rt.anchorMin = aMin; rt.anchorMax = aMax; rt.anchoredPosition = pos; rt.sizeDelta = size;
            go.GetComponent<Image>().color = color;
            return rt;
        }

        static Image MakeImage(RectTransform parent, string name, Sprite sprite, Vector2 aMin, Vector2 aMax, Vector2 pos, Vector2 size)
        {
            var rt = MakePanel(parent, name, aMin, aMax, pos, size, Color.white);
            var img = rt.GetComponent<Image>(); img.sprite = sprite; img.enabled = sprite != null || true;
            if (sprite == null) img.color = new Color(1, 1, 1, 0);
            return img;
        }

        static Button ImageButton(RectTransform parent, string name, Sprite sprite, Vector2 anchor, Vector2 pos, Vector2 size)
        {
            var img = MakeImage(parent, name, sprite, anchor, anchor, pos, size);
            img.rectTransform.pivot = anchor;
            var b = img.gameObject.AddComponent<Button>(); b.targetGraphic = img;
            return b;
        }

        static TextMeshProUGUI MakeText(RectTransform parent, string name, string text, float size, Vector2 pos, Vector2 boxSize, TextAlignmentOptions align, FontStyles style, Color color)
        {
            var go = new GameObject(name, typeof(RectTransform)); go.transform.SetParent(parent, false);
            var t = go.AddComponent<TextMeshProUGUI>();
            t.text = text; t.fontSize = size; t.alignment = align; t.fontStyle = style; t.color = color; t.enableWordWrapping = true; t.raycastTarget = false;
            if (fontAsset != null) t.font = fontAsset;
            var rt = t.rectTransform; rt.anchorMin = new Vector2(0, 1); rt.anchorMax = new Vector2(0, 1); rt.pivot = new Vector2(0, 1);
            rt.anchoredPosition = pos; rt.sizeDelta = boxSize;
            return t;
        }

        static void Stretch(RectTransform rt, float padX = 0f, float padY = 0f)
        {
            rt.anchorMin = Vector2.zero; rt.anchorMax = Vector2.one; rt.pivot = new Vector2(0.5f, 0.5f);
            rt.offsetMin = new Vector2(padX, padY); rt.offsetMax = new Vector2(-padX, -padY);
        }

        // Korean needs a font asset that contains Hangul. Drop NotoSerifKR (and Alegreya) TTFs into Assets/_BGB/Fonts first.
        static TMP_FontAsset FindOrCreateFont()
        {
            foreach (var g in AssetDatabase.FindAssets("t:TMP_FontAsset", new[] { Root + "/Fonts" }))
                return AssetDatabase.LoadAssetAtPath<TMP_FontAsset>(AssetDatabase.GUIDToAssetPath(g));
            foreach (var g in AssetDatabase.FindAssets("t:Font", new[] { Root + "/Fonts" }))
            {
                try
                {
                    var font = AssetDatabase.LoadAssetAtPath<Font>(AssetDatabase.GUIDToAssetPath(g));
                    var fa = TMP_FontAsset.CreateFontAsset(font);
                    string path = Root + "/Fonts/BGB2_Body SDF.asset";
                    AssetDatabase.CreateAsset(fa, path);
                    if (fa.material != null) AssetDatabase.AddObjectToAsset(fa.material, fa);
                    if (fa.atlasTexture != null) AssetDatabase.AddObjectToAsset(fa.atlasTexture, fa);
                    AssetDatabase.SaveAssets();
                    return fa;
                }
                catch (System.Exception e) { Debug.LogWarning("BGB2: could not create a TMP font asset: " + e.Message); }
            }
            Debug.LogWarning("BGB2: no font found in Assets/_BGB/Fonts. Korean text will show as squares until you add a Hangul font (see README).");
            return null;
        }
    }
}
#endif
