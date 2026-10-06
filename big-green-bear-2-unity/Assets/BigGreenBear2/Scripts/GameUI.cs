// GameUI.cs — the paper "book" around the stage, built entirely from code (no scene setup).
//   1280x720 canvas, letterboxed:  stage hole (130,64,960x540) | mirror window (1106,64,150x540)
//   left folder tabs (PEOPLE / EVIDENCE / STATEMENTS / TIMELINE / IDENTITY) that stick out of the frame.
// Layout is identical to bgb2/docs/WIREFRAME.md.
using System;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

namespace BigGreenBear2
{
    public class DropZone : MonoBehaviour { public string id; }

    public class EvidenceCard : MonoBehaviour, IBeginDragHandler, IDragHandler, IEndDragHandler
    {
        public string id;
        public Transform dragLayer;
        public Action<string, string> onDrop;
        CanvasGroup cg;

        public void OnBeginDrag(PointerEventData e)
        {
            if (!TryGetComponent(out cg)) cg = gameObject.AddComponent<CanvasGroup>();
            cg.blocksRaycasts = false;
            transform.SetParent(dragLayer, true);
            transform.SetAsLastSibling();
        }

        public void OnDrag(PointerEventData e) { transform.position = e.position; }

        public void OnEndDrag(PointerEventData e)
        {
            if (cg != null) cg.blocksRaycasts = true;
            var hits = new List<RaycastResult>();
            EventSystem.current.RaycastAll(e, hits);
            string zone = null;
            foreach (var h in hits)
            {
                var z = h.gameObject.GetComponentInParent<DropZone>();
                if (z != null) { zone = z.id; break; }
            }
            onDrop?.Invoke(id, zone);
        }
    }

    public class GameUI : MonoBehaviour
    {
        public static readonly Color Cream = new Color32(0xF2, 0xE8, 0xD4, 255);
        public static readonly Color Env = new Color32(0x24, 0x30, 0x44, 255);
        public static readonly Color Env2 = new Color32(0x52, 0x65, 0x7A, 255);
        public static readonly Color Muted = new Color32(0x71, 0x83, 0x96, 255);
        public static readonly Color PaperGray = new Color32(0xC8, 0xC7, 0xBE, 255);
        public static readonly Color Ink = new Color32(0x3B, 0x3A, 0x37, 255);
        public static readonly Color Red = new Color32(0xA8, 0x48, 0x3F, 255);

        // 1280x720 design layout (px, top-left origin)
        public static readonly Rect StageRect = new Rect(130, 64, 960, 540);
        public static readonly Rect MirrorRect = new Rect(1106, 64, 150, 540);

        public static readonly string[] Tabs = { "PEOPLE", "EVIDENCE", "STATEMENTS", "TIMELINE", "IDENTITY" };

        Canvas canvas;
        CanvasScaler scaler;
        public RectTransform root;
        Font font;
        Text narration, keys, header;
        public RawImage mirrorImage;
        RectTransform folder, content;
        readonly List<Button> tabButtons = new List<Button>();
        GameObject titlePanel;
        public string CurrentTab { get; private set; }
        public bool FolderOpen => folder != null && folder.gameObject.activeSelf;
        public bool TitleOpen => titlePanel != null && titlePanel.activeSelf;

        // ---------------------------------------------------------------- build
        public void Init(string title, string subtitle)
        {
            font = Resources.Load<Font>("BGB2/Fonts/Pretendard-Regular");
            if (font == null) font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");

            if (FindFirstObjectByType<EventSystem>() == null)
            {
                var es = new GameObject("EventSystem");
                es.AddComponent<EventSystem>();
#if ENABLE_INPUT_SYSTEM
                es.AddComponent<UnityEngine.InputSystem.UI.InputSystemUIInputModule>();
#else
                es.AddComponent<StandaloneInputModule>();
#endif
            }

            var cgo = new GameObject("BGB2Canvas");
            canvas = cgo.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvas.sortingOrder = 10;
            scaler = cgo.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1280, 720);
            cgo.AddComponent<GraphicRaycaster>();

            root = Box(cgo.transform, "Root", 0, 0, 1280, 720, new Color(0, 0, 0, 0));
            root.anchorMin = root.anchorMax = root.pivot = new Vector2(0.5f, 0.5f);
            root.anchoredPosition = Vector2.zero;

            BuildFrame();
            BuildTabs();
            BuildFolder();
            BuildTitle(title, subtitle);
        }

        void BuildFrame()
        {
            // cream bars around the stage hole and the mirror hole (Overlay draws above cameras)
            Box(root, "FrameTop", 0, 0, 1280, 64, Cream);
            Box(root, "FrameBottom", 0, 604, 1280, 116, Cream);
            Box(root, "FrameLeft", 0, 64, 130, 540, Cream);
            Box(root, "FrameMid", 1090, 64, 16, 540, Cream);
            Box(root, "FrameRight", 1256, 64, 24, 540, Cream);
            // stage + mirror borders (dark blue paper)
            Border(StageRect, Env, 6);
            Border(MirrorRect, Env2, 5);

            var mirrorGo = new GameObject("MirrorImage", typeof(RectTransform));
            var mrt = mirrorGo.GetComponent<RectTransform>();
            mrt.SetParent(root, false);
            mrt.anchorMin = mrt.anchorMax = mrt.pivot = new Vector2(0, 1);
            mrt.anchoredPosition = new Vector2(MirrorRect.x, -MirrorRect.y);
            mrt.sizeDelta = new Vector2(MirrorRect.width, MirrorRect.height);
            mirrorImage = mirrorGo.AddComponent<RawImage>();
            mirrorImage.raycastTarget = false;
            // soft glass sheen
            var glass = Box(root, "Glass", MirrorRect.x, MirrorRect.y, MirrorRect.width, MirrorRect.height, new Color(1, 1, 1, 0.05f));
            glass.GetComponent<Image>().raycastTarget = false;

            header = Label(root, "CASE No.07 · THE OLD CLOCK TOWER", 130, 22, 700, 24, 12, Env2, TextAnchor.UpperLeft);
            narration = Label(root, "", 130, 614, 700, 90, 16, Ink, TextAnchor.UpperLeft);
            keys = Label(root, "← → move · E interact · Tab case file", 800, 614, 456, 24, 11, Muted, TextAnchor.UpperRight);
        }

        void Border(Rect r, Color c, float t)
        {
            Box(root, "BTop", r.x - t, r.y - t, r.width + 2 * t, t, c);
            Box(root, "BBot", r.x - t, r.y + r.height, r.width + 2 * t, t, c);
            Box(root, "BL", r.x - t, r.y, t, r.height, c);
            Box(root, "BR", r.x + r.width, r.y, t, r.height, c);
        }

        void BuildTabs()
        {
            for (int i = 0; i < Tabs.Length; i++)
            {
                string tab = Tabs[i];
                var rt = Box(root, "Tab_" + tab, 4, 84 + i * 58, 112, 52, i % 2 == 0 ? Env2 : Muted);
                var b = rt.gameObject.AddComponent<Button>();
                b.targetGraphic = rt.GetComponent<Image>();
                b.onClick.AddListener(() => OpenTab(tab));
                Label(rt, tab, 12, 18, 96, 20, 11, Cream, TextAnchor.UpperLeft);
                tabButtons.Add(b);
            }
        }

        void BuildFolder()
        {
            folder = Box(root, "Folder", 104, 44, 1000, 590, Env);
            var page = Box(folder, "Page", 18, 12, 964, 566, Cream);
            content = Box(page, "Content", 0, 0, 964, 566, new Color(0, 0, 0, 0));
            folder.gameObject.SetActive(false);
        }

        void BuildTitle(string title, string subtitle)
        {
            var p = Box(root, "Title", 0, 0, 1280, 720, new Color(0.07f, 0.1f, 0.14f, 1f));
            titlePanel = p.gameObject;
            Label(p, title, 0, 250, 1280, 70, 44, Cream, TextAnchor.MiddleCenter);
            Label(p, subtitle, 0, 330, 1280, 40, 20, new Color32(0xD9, 0xA5, 0x5A, 255), TextAnchor.MiddleCenter);
            Label(p, "PRESS ENTER", 0, 520, 1280, 30, 13, Muted, TextAnchor.MiddleCenter);
        }

        public void HideTitle() { if (titlePanel != null) titlePanel.SetActive(false); }

        // ---------------------------------------------------------------- per-frame letterbox → camera rect
        public void FitCamera(Camera cam)
        {
            if (root == null) return;
            float aspect = (float)Screen.width / Screen.height;
            scaler.matchWidthOrHeight = aspect >= 16f / 9f ? 1f : 0f;     // always show the whole 1280x720 frame
            var c = new Vector3[4];
            root.GetWorldCorners(c);                                       // overlay: screen pixels
            float x0 = c[0].x, y0 = c[0].y, w = c[2].x - c[0].x, h = c[2].y - c[0].y;
            float fx = StageRect.x / 1280f, fw = StageRect.width / 1280f;
            float fy = (720f - StageRect.y - StageRect.height) / 720f, fh = StageRect.height / 720f;
            cam.rect = new Rect((x0 + fx * w) / Screen.width, (y0 + fy * h) / Screen.height, fw * w / Screen.width, fh * h / Screen.height);
        }

        // ---------------------------------------------------------------- narration
        public void SetRoomLabel(string s) { if (header != null) header.text = "CASE No.07 · THE OLD CLOCK TOWER   —   " + s; }
        public void Say(string line) { narration.text = line; }
        public void Say(string who, Color whoColor, string line)
        {
            narration.text = "<b><color=#" + ColorUtility.ToHtmlStringRGB(whoColor) + ">" + who + "</color></b>\n" + line;
        }
        public void SetHint(string s) { keys.text = s; }

        // ---------------------------------------------------------------- folder
        public void ToggleFolder() { if (FolderOpen) CloseFolder(); else OpenTab(CurrentTab ?? "PEOPLE"); }
        public void CloseFolder() { folder.gameObject.SetActive(false); }

        public void OpenTab(string tab)
        {
            CurrentTab = tab;
            folder.gameObject.SetActive(true);
            foreach (Transform c in content) Destroy(c.gameObject);
            switch (tab)
            {
                case "PEOPLE": BuildPeople(); break;
                case "EVIDENCE": BuildEvidence(); break;
                case "STATEMENTS": BuildStatements(); break;
                case "TIMELINE": BuildTimeline(); break;
                case "IDENTITY": BuildIdentity(); break;
            }
            // selected tab sticks out a bit further
            for (int i = 0; i < tabButtons.Count; i++)
            {
                var rt = tabButtons[i].GetComponent<RectTransform>();
                rt.anchoredPosition = new Vector2(Tabs[i] == tab ? -4f : 4f, rt.anchoredPosition.y);
            }
        }

        public void RefreshTab() { if (FolderOpen) OpenTab(CurrentTab); }

        void Title(string t) { Label(content, t, 28, 18, 600, 40, 30, Env, TextAnchor.UpperLeft); }

        Sprite CharSprite(string n)
        {
            var tex = StageBuilder.LoadTex("BGB2/Characters/" + n);
            return tex == null ? null : Sprite.Create(tex, new Rect(0, 0, tex.width, tex.height), new Vector2(0.5f, 0.5f), 100f);
        }

        void Portrait(float x, float y, string name, bool flip)
        {
            var frame = Box(content, "Portrait", x, y, 170, 214, PaperGray);
            var img = Box(frame, "Img", 10, 10, 150, 170, Env2);
            var face = Box(img, "Face", 0, 0, 150, 170, Color.white);
            var im = face.GetComponent<Image>();
            im.sprite = CharSprite("bear_happy");
            im.preserveAspect = true;
            im.raycastTarget = false;
            if (flip) face.localScale = new Vector3(-1f, 1f, 1f);   // identical drawing; only the mirrored tell
            Label(frame, name, 0, 186, 170, 22, 11, Ink, TextAnchor.MiddleCenter);
        }

        void BuildPeople()
        {
            Title("People");
            if (GameState.Phase == 0)
            {
                Portrait(28, 80, "BIG GREEN BEAR", false);
                Label(content, "Known:\n· Kind\n· Local resident\n· Helps Nini", 230, 90, 300, 140, 18, Ink, TextAnchor.UpperLeft);
            }
            else
            {
                Portrait(28, 80, "BIG GREEN BEAR", false);
                Portrait(230, 80, "GREEN", true);
                if (GameState.Phase >= 2)
                {
                    var st = Label(content, "IDENTITY UNCERTAIN", 60, 150, 480, 50, 30, Red, TextAnchor.MiddleCenter);
                    st.transform.localRotation = Quaternion.Euler(0, 0, 6f);
                    st.fontStyle = FontStyle.Bold;
                }
                Label(content, "Which one waved at Nini?", 28, 320, 600, 30, 18, Env2, TextAnchor.UpperLeft);
            }
        }

        void BuildEvidence()
        {
            Title("Evidence");
            for (int i = 0; i < Data.Evidences.Length; i++)
                MakeCard(content, Data.Evidences[i], 28 + (i % 3) * 312, 80 + (i / 3) * 106, 296, 96, false);
        }

        void BuildStatements()
        {
            Title("Statements");
            for (int i = 0; i < Data.Statements.Length; i++)
            {
                var s = Data.Statements[i];
                Box(content, "Bar", 28, 90 + i * 86, 4, 66, Muted);
                Label(content, s[0] + " · " + s[1], 44, 90 + i * 86, 600, 20, 11, Muted, TextAnchor.UpperLeft);
                Label(content, s[2], 44, 112 + i * 86, 860, 44, 18, Ink, TextAnchor.UpperLeft);
            }
        }

        void BuildTimeline()
        {
            Title("Timeline");
            Box(content, "Line", 28, 200, 908, 3, Ink);
            for (int i = 0; i < Data.Times.Length; i++)
            {
                float x = 28 + (i + 0.5f) * (908f / Data.Times.Length);
                bool stopped = Data.Times[i] == "11:47";
                Box(content, "Tick", x - 1, 190, 3, 24, stopped ? Red : Ink);
                Label(content, Data.Times[i], x - 40, 160, 80, 24, 16, stopped ? Red : Ink, TextAnchor.MiddleCenter);
            }
            Label(content, "(drag evidence onto a time — coming next)", 28, 260, 600, 24, 13, Muted, TextAnchor.UpperLeft);
        }

        void BuildIdentity()
        {
            Title("Identity");
            var bad = GameState.Conflicts();
            ZoneBox("bear", "BIG GREEN BEAR", 28, 64, 456, 290);
            ZoneBox("green", "GREEN", 484, 64, 456, 290);
            var tray = Box(content, "Tray", 28, 366, 912, 190, new Color(0, 0, 0, 0.04f));
            tray.gameObject.AddComponent<DropZone>().id = "tray";

            var colCount = new Dictionary<string, int> { { "bear", 0 }, { "green", 0 } };
            int trayN = 0;
            foreach (var e in Data.Evidences)
            {
                string side;
                if (GameState.Board.TryGetValue(e.id, out side) && colCount.ContainsKey(side))
                {
                    float x = side == "bear" ? 38 : 494;
                    int i = colCount[side]++;
                    var c = MakeCard(content, e, x, 106 + i * 48, 436, 44, true);
                    if (bad.Contains(e.id))
                    {
                        c.GetComponent<Image>().color = new Color32(0xFB, 0xEE, 0xE8, 255);
                        var o = c.gameObject.AddComponent<Outline>(); o.effectColor = Red; o.effectDistance = new Vector2(1, -1);
                        var cf = Label(c, "CONFLICT", 340, 4, 90, 18, 11, Red, TextAnchor.MiddleRight);
                        cf.fontStyle = FontStyle.Bold; cf.transform.localRotation = Quaternion.Euler(0, 0, 3f);
                    }
                }
                else
                {
                    MakeCard(content, e, 36 + (trayN % 5) * 180, 376 + (trayN / 5) * 60, 172, 54, true, true);
                    trayN++;
                }
            }
        }

        void ZoneBox(string id, string label, float x, float y, float w, float h)
        {
            var z = Box(content, "Zone_" + id, x, y, w, h, new Color(1, 1, 1, 0.25f));
            z.gameObject.AddComponent<DropZone>().id = id;
            var o = z.gameObject.AddComponent<Outline>(); o.effectColor = Env; o.effectDistance = new Vector2(1.5f, -1.5f);
            Label(z, label, 0, 8, w, 24, 13, Env, TextAnchor.UpperCenter).fontStyle = FontStyle.Bold;
        }

        RectTransform MakeCard(Transform parent, Evidence e, float x, float y, float w, float h, bool draggable, bool tiny = false)
        {
            var c = Box(parent, "Card_" + e.id, x, y, w, h, new Color32(0xFF, 0xFA, 0xF0, 255));
            Label(c, e.title, 8, 5, w - 16, 16, 10, Env, TextAnchor.UpperLeft).fontStyle = FontStyle.Bold;
            if (h > 60) Label(c, e.place, 8, 21, w - 16, 14, 9, Muted, TextAnchor.UpperLeft);
            Label(c, e.obs, 8, h > 60 ? 38 : 20, w - 16, h - (h > 60 ? 40 : 22), tiny ? 10 : 12, Ink, TextAnchor.UpperLeft);
            if (draggable)
            {
                var ec = c.gameObject.AddComponent<EvidenceCard>();
                ec.id = e.id; ec.dragLayer = root;
                ec.onDrop = (id, zone) =>
                {
                    if (zone != null) { GameState.Place(id, zone); Sfx.Cue(zone == "tray" ? "tap" : "pencil"); }
                    RefreshTab();
                    if (zone != null && zone != "tray" && GameState.Conflicts().Contains(id)) Sfx.Cue("stop");
                };
            }
            return c;
        }

        // ---------------------------------------------------------------- tiny helpers
        public static RectTransform Box(Transform parent, string name, float x, float y, float w, float h, Color c)
        {
            var go = new GameObject(name, typeof(RectTransform));
            var rt = go.GetComponent<RectTransform>();
            rt.SetParent(parent, false);
            rt.anchorMin = rt.anchorMax = rt.pivot = new Vector2(0, 1);
            rt.anchoredPosition = new Vector2(x, -y);
            rt.sizeDelta = new Vector2(w, h);
            if (c.a > 0f) { var im = go.AddComponent<Image>(); im.color = c; }
            return rt;
        }

        Text Label(Transform parent, string text, float x, float y, float w, float h, int size, Color col, TextAnchor anchor)
        {
            var rt = Box(parent, "Label", x, y, w, h, new Color(0, 0, 0, 0));
            var t = rt.gameObject.AddComponent<Text>();
            t.font = font; t.fontSize = size; t.color = col; t.alignment = anchor; t.text = text;
            t.horizontalOverflow = HorizontalWrapMode.Wrap; t.verticalOverflow = VerticalWrapMode.Overflow;
            t.supportRichText = true; t.raycastTarget = false;
            return t;
        }
    }
}
