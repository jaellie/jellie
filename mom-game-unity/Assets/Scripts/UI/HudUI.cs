using System;
using System.Collections;
using System.Collections.Generic;
using System.Text;
using UnityEngine;

// All 2D UI (IMGUI, drawn with Kenney's adventure GUI sprites): start screen, fades, the little
// "E" hint, speech bubbles, emotes, the letters collection bar, and the cards (note / photo /
// gift / voice / letter / memory shelf). Coordinates are virtual 1280x720 and scaled to the window.
public class HudUI : MonoBehaviour
{
    public Camera cam;
    public GameAudio audio;

    // ── sprites ──
    Texture2D panel, panelCorners, panelDark, roundBrown, hexLight, hexDark, bannerRed, bannerHang, btnBrown, btnClose, envLight, envDark, white, tri;
    readonly Dictionary<string, Texture2D> emotes = new Dictionary<string, Texture2D>();
    GUIStyle sPanel, sCorners, sDark, sBody, sHand, sTitle, sTip, sBubble, sHint, sCount, sCenter;

    // ── state ──
    float fadeA = 1f; Color fadeC = Color.black;
    Texture2D logoTex; bool startVisible; float startAlpha = 1f; bool startDone;
    Vector2 hintPx; bool hintOn;
    string bubbleText; float bubbleUntil; Vector2 bubblePx;
    int found, total; float popT = 99f; int popIdx = -1;
    float barAlpha;
    class FloatEmote { public string name; public Vector3 world; public float t; }
    readonly List<FloatEmote> floaters = new List<FloatEmote>();

    // ── cards ──
    public enum CardKind { None, Note, Photo, Gift, Voice, Letter, Shelf }
    CardKind kind; Disc disc; float cardT, cardOpened; int page; bool cardDone;
    string letterText; int letterChars; float letterScroll; bool letterFinished;
    List<Disc> shelfItems; int shelfSel; public int ShelfPicked = -1;
    string[] voiceLines; int voiceLine; float voiceNext, voicePer;
    AudioClip voiceClip;
    public bool CardOpen { get { return kind != CardKind.None && !cardDone; } }

    void Awake()
    {
        panel = Load("panel_brown"); panelCorners = Load("panel_brown_corners_a"); panelDark = Load("panel_brown_dark");
        roundBrown = Load("round_brown"); hexLight = Load("hexagon_brown"); hexDark = Load("hexagon_brown_dark");
        bannerRed = Load("banner_classic_curtain"); bannerHang = Load("banner_hanging"); btnBrown = Load("button_brown"); btnClose = Load("button_brown_close");
        white = Texture2D.whiteTexture;
        var cv = new Kit.Canvas2D(32, 32, new Color(1, 1, 1, 0));
        for (int y = 0; y < 32; y++) for (int x = 0; x < 32; x++) if (Mathf.Abs(x - 15.5f) < (32 - y) * 0.5f) cv.px[y * 32 + x] = Color.white;
        tri = cv.ToTexture(false);
        envLight = EnvelopeTex(true); envDark = EnvelopeTex(false);
    }

    static Texture2D Load(string n) { return Kenney.Sprite("UI", n); }

    Texture2D Emote(string n)
    {
        Texture2D t;
        if (!emotes.TryGetValue(n, out t)) { t = Kenney.Sprite("Emotes", n); emotes[n] = t; }
        return t;
    }

    static Texture2D EnvelopeTex(bool lit)
    {
        var cv = new Kit.Canvas2D(56, 40, new Color(1, 1, 1, 0));
        Color body = lit ? new Color(1f, 0.97f, 0.9f) : new Color(0.16f, 0.1f, 0.07f, 0.85f);
        Color edge = lit ? new Color(0.7f, 0.45f, 0.25f) : new Color(0.04f, 0.02f, 0.01f, 0.9f);
        cv.Rect(3, 4, 50, 32, edge); cv.Rect(5, 6, 46, 28, body);
        cv.Line(5, 33, 28, 15, 2f, edge); cv.Line(51, 33, 28, 15, 2f, edge);
        if (lit) cv.Disc(28, 16, 5f, new Color(0.88f, 0.34f, 0.43f));
        return cv.ToTexture(false);
    }

    void MakeStyles()
    {
        if (sBody != null) return;
        Font f = GameFont.Get();
        sPanel = new GUIStyle { border = new RectOffset(18, 18, 18, 18) }; sPanel.normal.background = panel;
        sCorners = new GUIStyle { border = new RectOffset(30, 30, 30, 30) }; sCorners.normal.background = panelCorners;
        sDark = new GUIStyle { border = new RectOffset(18, 18, 18, 18) }; sDark.normal.background = panelDark;
        sBody = new GUIStyle { font = f, fontSize = 24, wordWrap = true, richText = false, alignment = TextAnchor.UpperLeft };
        sBody.normal.textColor = new Color(0.25f, 0.16f, 0.11f);
        sHand = new GUIStyle(sBody) { fontSize = 30 };
        sTitle = new GUIStyle(sBody) { fontSize = 22, alignment = TextAnchor.MiddleCenter, wordWrap = false };
        sTitle.normal.textColor = new Color(1f, 0.96f, 0.88f);
        sTip = new GUIStyle(sBody) { fontSize = 15, alignment = TextAnchor.MiddleRight };
        sTip.normal.textColor = new Color(0.62f, 0.47f, 0.33f);
        sBubble = new GUIStyle(sBody) { fontSize = 22, alignment = TextAnchor.MiddleCenter, wordWrap = false };
        sHint = new GUIStyle(sBody) { fontSize = 24, alignment = TextAnchor.MiddleCenter, wordWrap = false, fontStyle = FontStyle.Bold };
        sHint.normal.textColor = new Color(0.55f, 0.33f, 0.2f);
        sCount = new GUIStyle(sBody) { fontSize = 20, alignment = TextAnchor.MiddleLeft, wordWrap = false };
        sCount.normal.textColor = new Color(1f, 0.96f, 0.88f);
        sCenter = new GUIStyle(sBody) { alignment = TextAnchor.MiddleCenter };
    }

    // ───────────────────────── public API ─────────────────────────
    public IEnumerator StartScreen()
    {
        startVisible = true; startAlpha = 1f; startDone = false; fadeA = 1f;
        yield return null;
        while (!(GameInput.AnyDown || GameInput.ClickDown)) yield return null;
        startDone = true;
        while (startAlpha > 0f) { startAlpha -= Time.deltaTime / 1.4f; yield return null; }
        startVisible = false;
    }

    public IEnumerator Fade(float to, Color c, float secs)
    {
        fadeC = c;
        float from = fadeA, t = 0f;
        while (t < secs) { t += Time.deltaTime; fadeA = Mathf.Lerp(from, to, Mathf.Clamp01(t / Mathf.Max(0.0001f, secs))); yield return null; }
        fadeA = to;
    }
    public void SetFade(float a, Color c) { fadeA = a; fadeC = c; }

    public void Say(string text, float secs = 2.6f) { if (string.IsNullOrEmpty(text)) return; bubbleText = Clean(text); bubbleUntil = Time.time + secs; }
    public void SetBubbleAnchor(Vector3 world) { bubblePx = ToGui(world); }
    public void SetHint(bool on, Vector3 world) { hintOn = on; if (on) hintPx = ToGui(world); }
    public void ShowBar(bool v) { barAlpha = v ? 1f : 0f; }

    public void SetProgress(int got, int tot, bool celebrate)
    {
        if (celebrate && got > found) { popIdx = got - 1; popT = 0f; AddEmote("emote_heart", Vector3.zero, true); }
        found = got; total = tot;
    }

    public void EmoteAt(string name, Vector3 world) { AddEmote(name, world, false); }
    void AddEmote(string name, Vector3 world, bool screenSpaceBar) { if (screenSpaceBar) return; floaters.Add(new FloatEmote { name = name, world = world, t = 0f }); }

    Vector2 ToGui(Vector3 world)
    {
        if (cam == null) return Vector2.zero;
        Vector3 p = cam.WorldToScreenPoint(world);
        if (p.z < 0f) return new Vector2(-9999, -9999);
        float s = Screen.height / 720f;
        return new Vector2(p.x / s, (Screen.height - p.y) / s);
    }

    public static string Clean(string s)
    {   // the font has no emoji: drop them (and the pencil mark placeholders)
        if (string.IsNullOrEmpty(s)) return "";
        var sb = new StringBuilder();
        foreach (char ch in s)
        {
            if (char.IsSurrogate(ch)) continue;
            if (ch >= 0x2190 && ch <= 0x2BFF) continue;
            if (ch == 0xFE0F || ch == 0x200D) continue;
            sb.Append(ch);
        }
        return sb.ToString().Replace(" )", ")").Trim();
    }

    // ── cards ──
    void Begin(CardKind k, Disc d) { kind = k; disc = d; cardT = 0f; cardOpened = Time.time; page = 0; cardDone = false; }
    public void OpenDisc(Disc d)
    {
        switch (d.type)
        {
            case DType.Photo: Begin(CardKind.Photo, d); break;
            case DType.Gift: Begin(CardKind.Gift, d); break;
            case DType.Voice:
                Begin(CardKind.Voice, d);
                voiceLines = d.subtitles != null && d.subtitles.Length > 0 ? d.subtitles : new[] { d.text };
                voiceLine = 0; voiceNext = Time.time + 0.4f; voicePer = 2.6f;
                voiceClip = audio != null ? audio.VoiceFile(d.voiceFile) : null;
                if (voiceClip != null) { voicePer = Mathf.Max(1.8f, voiceClip.length / voiceLines.Length); audio.PlayVoice(voiceClip); }
                break;
            default: Begin(CardKind.Note, d); break;
        }
    }
    public void OpenLetter()
    {
        Begin(CardKind.Letter, null);
        letterText = Content.Letter; letterChars = 0; letterScroll = 0f; letterFinished = false;
    }
    public void OpenShelf(List<Disc> items) { Begin(CardKind.Shelf, null); shelfItems = items; shelfSel = 0; ShelfPicked = -1; }
    public void CloseCard() { if (kind == CardKind.Voice && audio != null) audio.StopVoice(); cardDone = true; kind = CardKind.None; }

    // called every frame by GameController while a card is open
    public void CardInput(bool interact, bool close, bool left, bool right, bool up, bool down, bool click)
    {
        if (!CardOpen) return;
        if (Time.time - cardOpened < 0.35f) return;
        switch (kind)
        {
            case CardKind.Photo:
                int pages = disc.files != null ? Mathf.Max(1, disc.files.Length) : 1;
                if (left) page = (page + pages - 1) % pages;
                if (right) page = (page + 1) % pages;
                if (interact || click) { if (page < pages - 1) page++; else CloseCard(); }
                if (close) CloseCard();
                break;
            case CardKind.Letter:
                if (interact || click) { if (!letterFinished) { letterChars = letterText.Length; letterFinished = true; } else CloseCard(); }
                if (up) letterScroll += 120f; if (down) letterScroll -= 120f;
                letterScroll += GameInput.Scroll * 60f;
                if (close && letterFinished) CloseCard();
                break;
            case CardKind.Shelf:
                if (shelfItems.Count == 0) { if (interact || click || close) CloseCard(); break; }
                if (left) shelfSel = Mathf.Max(0, shelfSel - 1);
                if (right) shelfSel = Mathf.Min(shelfItems.Count - 1, shelfSel + 1);
                if (up) shelfSel = Mathf.Max(0, shelfSel - 8);
                if (down) shelfSel = Mathf.Min(shelfItems.Count - 1, shelfSel + 8);
                if (interact || click) { ShelfPicked = shelfSel; cardDone = true; kind = CardKind.None; }
                if (close) { ShelfPicked = -1; CloseCard(); }
                break;
            default:
                if (interact || click || close) CloseCard();
                break;
        }
    }

    void Update()
    {
        float dt = Time.deltaTime;
        popT += dt;
        for (int i = floaters.Count - 1; i >= 0; i--) { floaters[i].t += dt; if (floaters[i].t > 1.6f) floaters.RemoveAt(i); }
        if (kind != CardKind.None)
        {
            cardT += dt;
            if (kind == CardKind.Letter && !letterFinished)
            {
                letterChars = Mathf.Min(letterText.Length, (int)(cardT * 26f));
                if (letterChars >= letterText.Length) letterFinished = true;
            }
            if (kind == CardKind.Voice && voiceLines != null && Time.time > voiceNext && voiceLine < voiceLines.Length) { voiceLine++; voiceNext = Time.time + voicePer; }
        }
    }

    // ───────────────────────── drawing ─────────────────────────
    void OnGUI()
    {
        if (Event.current.type != EventType.Repaint) return;
        MakeStyles();
        float s = Screen.height / 720f;
        GUIUtility.ScaleAroundPivot(new Vector2(s, s), Vector2.zero);
        float vw = Screen.width / s, vh = 720f;
        var oldC = GUI.color;

        if (GameInput.Broken) { GUI.color = Color.white; GUI.Label(new Rect(20, 20, vw - 40, 120), "Unity is set to the new Input System only.\nOpen Edit > Project Settings > Player > Other Settings > Active Input Handling and choose 'Both', then restart.", sBody); }

        DrawBar(vw);
        DrawEmotes();
        DrawBubble();
        DrawHint();
        if (kind != CardKind.None) DrawCard(vw, vh);

        if (fadeA > 0.002f) { GUI.color = new Color(fadeC.r, fadeC.g, fadeC.b, fadeA); GUI.DrawTexture(new Rect(-10, -10, vw + 20, vh + 20), white); }
        if (startVisible)
        {
            GUI.color = new Color(0.984f, 0.965f, 0.91f, startAlpha); GUI.DrawTexture(new Rect(-10, -10, vw + 20, vh + 20), white);
            if (logoTex == null) logoTex = Resources.Load<Texture2D>("logo");
            float pulse = 0.55f + 0.45f * Mathf.Sin(Time.time * 2.1f);
            if (logoTex != null)
            {
                float lh = vh * 0.78f, lw = lh * logoTex.width / logoTex.height;
                GUI.color = new Color(1, 1, 1, startAlpha); GUI.DrawTexture(new Rect((vw - lw) / 2f, vh * 0.04f, lw, lh), logoTex, ScaleMode.ScaleToFit);
            }
            var st = new GUIStyle(sCenter) { fontSize = 30 }; st.normal.textColor = new Color(0.42f, 0.3f, 0.24f, startAlpha * pulse);
            GUI.color = Color.white; GUI.Label(new Rect(0, vh * 0.86f, vw, 50), "화면을 한 번 눌러주세요", st);
        }
        GUI.color = oldC;
    }

    void DrawBar(float vw)
    {
        if (barAlpha < 0.01f || total <= 0) return;
        const float w = 32f, h = 42f, gap = 3f;
        float rowW = total * (w + gap) - gap;
        float cnt = 86f;
        float bw = rowW + cnt + 40f, bh = 64f, x0 = (vw - bw) / 2f, y0 = 8f;
        GUI.color = new Color(1, 1, 1, 0.95f);
        GUI.Box(new Rect(x0, y0, bw, bh), GUIContent.none, sDark);
        for (int i = 0; i < total; i++)
        {
            bool got = i < found;
            float sc = 1f;
            if (i == popIdx && popT < 1f) sc = 1f + Mathf.Sin(Mathf.Clamp01(popT) * Mathf.PI) * 0.75f;
            float cx = x0 + 20f + i * (w + gap) + w / 2f, cy = y0 + bh / 2f;
            var r = new Rect(cx - w * sc / 2f, cy - h * sc / 2f, w * sc, h * sc);
            GUI.color = Color.white;
            GUI.DrawTexture(r, got ? hexLight : hexDark);
            var er = new Rect(cx - 12f * sc, cy - 8.5f * sc, 24f * sc, 17f * sc);
            GUI.color = got ? Color.white : new Color(1, 1, 1, 0.55f);
            GUI.DrawTexture(er, got ? envLight : envDark);
        }
        GUI.color = Color.white;
        GUI.Label(new Rect(x0 + 24f + rowW, y0, cnt, bh), "(" + found + "/" + total + ")", sCount);
        if (popIdx >= 0 && popT < 1.4f)
        {   // a little heart floats up from the slot that just filled
            Texture2D h2 = Emote("emote_heart");
            float cx = x0 + 20f + popIdx * (w + gap) + w / 2f;
            float u = popT / 1.4f;
            GUI.color = new Color(1, 1, 1, 1f - u);
            if (h2 != null) GUI.DrawTexture(new Rect(cx - 14f, y0 + bh + 2f + u * 26f, 28f, 33f), h2);
        }
        GUI.color = Color.white;
    }

    void DrawEmotes()
    {
        foreach (var e in floaters)
        {
            if (e.world == Vector3.zero) continue;
            var t = Emote(e.name); if (t == null) continue;
            Vector2 p = ToGui(e.world + Vector3.up * (e.t * 0.5f));
            float u = e.t / 1.6f, sc = Mathf.Lerp(0.4f, 1f, Mathf.Clamp01(e.t * 5f));
            GUI.color = new Color(1, 1, 1, u < 0.7f ? 1f : (1f - u) / 0.3f);
            float w = 56f * sc, h = 66f * sc;
            GUI.DrawTexture(new Rect(p.x - w / 2f, p.y - h, w, h), t);
        }
        GUI.color = Color.white;
    }

    void DrawBubble()
    {
        if (string.IsNullOrEmpty(bubbleText) || Time.time > bubbleUntil) return;
        float a = Mathf.Clamp01((bubbleUntil - Time.time) * 3f);
        var c = new GUIContent(bubbleText);
        float tw = Mathf.Max(80f, sBubble.CalcSize(c).x + 44f), th = 54f;
        var r = new Rect(bubblePx.x - tw / 2f, bubblePx.y - th - 20f, tw, th);
        GUI.color = new Color(1, 1, 1, a);
        GUI.Box(r, GUIContent.none, sPanel);
        GUI.DrawTexture(new Rect(r.center.x - 10f, r.yMax - 4f, 20f, 14f), tri);
        GUI.color = new Color(1, 1, 1, a);
        GUI.Label(r, c, sBubble);
        GUI.color = Color.white;
    }

    void DrawHint()
    {
        if (!hintOn) return;
        float bob = Mathf.Sin(Time.time * 3.2f) * 4f;
        var r = new Rect(hintPx.x - 24f, hintPx.y - 24f + bob, 48f, 48f);
        GUI.color = Color.white;
        GUI.DrawTexture(r, roundBrown);
        GUI.Label(r, "E", sHint);
    }

    // ── cards ──
    Rect CardRect(float vw, float vh, float w, float h) { return new Rect((vw - w) / 2f, (vh - h) / 2f, w, h); }

    void DrawCard(float vw, float vh)
    {
        float open = Mathf.Clamp01(cardT / 0.35f); open = 1f - (1f - open) * (1f - open);
        GUI.color = new Color(0.16f, 0.09f, 0.05f, 0.45f * open); GUI.DrawTexture(new Rect(-10, -10, vw + 20, vh + 20), white);
        GUI.color = new Color(1, 1, 1, open);
        float lift = (1f - open) * 40f;
        string tip = "닫기 · E";
        switch (kind)
        {
            case CardKind.Note: DrawNote(vw, vh, lift, tip); break;
            case CardKind.Photo: DrawPhoto(vw, vh, lift); break;
            case CardKind.Gift: DrawGift(vw, vh, lift, tip); break;
            case CardKind.Voice: DrawVoice(vw, vh, lift, tip); break;
            case CardKind.Letter: DrawLetter(vw, vh); break;
            case CardKind.Shelf: DrawShelf(vw, vh); break;
        }
        GUI.color = Color.white;
    }

    void Banner(Rect card, string title)
    {
        if (string.IsNullOrEmpty(title)) return;
        var r = new Rect(card.center.x - 170f, card.y - 30f, 340f, 62f);
        GUI.DrawTexture(r, bannerRed);
        GUI.Label(new Rect(r.x, r.y - 4f, r.width, 50f), Clean(title), sTitle);
    }

    void DrawNote(float vw, float vh, float lift, string tip)
    {
        string text = Clean(disc.text);
        float w = 560f, tw = w - 120f;
        float th = sHand.CalcHeight(new GUIContent(text), tw);
        float h = Mathf.Clamp(th + 150f, 260f, 620f);
        var r = CardRect(vw, vh, w, h); r.y += lift;
        var m = GUI.matrix; GUIUtility.RotateAroundPivot(-1.1f, r.center);
        GUI.Box(r, GUIContent.none, sCorners);
        Banner(r, disc.title);
        GUI.Label(new Rect(r.x + 58f, r.y + 58f, tw, h - 100f), text, sHand);
        GUI.Label(new Rect(r.x, r.yMax - 46f, r.width - 48f, 28f), tip, sTip);
        GUI.matrix = m;
    }

    void DrawPhoto(float vw, float vh, float lift)
    {
        float w = 560f, h = 470f;
        var r = CardRect(vw, vh, w, h); r.y += lift;
        var m = GUI.matrix; GUIUtility.RotateAroundPivot(1.0f, r.center);
        GUI.Box(r, GUIContent.none, sCorners);
        Banner(r, disc.title);
        var img = new Rect(r.x + 56f, r.y + 58f, w - 112f, (w - 112f) * 0.72f);
        Texture2D photo = null;
        if (disc.files != null && disc.files.Length > 0 && !string.IsNullOrEmpty(disc.files[Mathf.Min(page, disc.files.Length - 1)]))
            photo = Resources.Load<Texture2D>("Photos/" + System.IO.Path.GetFileNameWithoutExtension(disc.files[Mathf.Min(page, disc.files.Length - 1)]));
        GUI.color = Color.white;
        if (photo != null) GUI.DrawTexture(img, photo, ScaleMode.ScaleAndCrop);
        else
        {   // soft placeholder until a real photo is added
            GUI.color = new Color(0.95f, 0.83f, 0.74f); GUI.DrawTexture(img, white);
            GUI.color = new Color(1f, 1f, 1f, 0.9f);
            var he = Emote("emote_hearts"); if (he != null) GUI.DrawTexture(new Rect(img.center.x - 36f, img.center.y - 42f, 72f, 85f), he);
            GUI.color = Color.white;
        }
        string cap = disc.captions != null && disc.captions.Length > 0 ? disc.captions[Mathf.Min(page, disc.captions.Length - 1)] : disc.title;
        var capStyle = new GUIStyle(sHand) { alignment = TextAnchor.MiddleCenter, wordWrap = true };
        GUI.Label(new Rect(r.x + 40f, img.yMax + 6f, w - 80f, 46f), Clean(cap), capStyle);
        if (disc.files != null && disc.files.Length > 1)
        {
            var dots = new StringBuilder(); for (int i = 0; i < disc.files.Length; i++) dots.Append(i == page ? "● " : "○ ");
            GUI.Label(new Rect(r.x, r.yMax - 52f, r.width, 24f), dots.ToString().Trim(), new GUIStyle(sTip) { alignment = TextAnchor.MiddleCenter });
        }
        GUI.matrix = m;
    }

    void DrawGift(float vw, float vh, float lift, string tip)
    {
        string text = Clean(disc.text);
        float w = 560f, tw = w - 120f;
        float th = sHand.CalcHeight(new GUIContent(text), tw);
        float h = Mathf.Clamp(th + 280f, 420f, 700f);
        var r = CardRect(vw, vh, w, h); r.y += lift;
        GUI.Box(r, GUIContent.none, sCorners);
        Banner(r, disc.title);
        // gift box: shakes, then the lid pops and a star comes out
        float t = cardT;
        float shake = t < 1f ? Mathf.Sin(t * 40f) * 5f : 0f;
        float lidU = Mathf.Clamp01((t - 1f) / 0.6f); float lidY = Anim.Back(lidU) * -46f, lidX = lidU * 30f;
        float cx = r.center.x + shake, by = r.y + 150f;
        GUI.color = new Color(0.91f, 0.56f, 0.62f); GUI.DrawTexture(new Rect(cx - 50f, by, 100f, 72f), white);
        GUI.color = new Color(1f, 0.95f, 0.79f); GUI.DrawTexture(new Rect(cx - 8f, by, 16f, 72f), white);
        GUI.color = new Color(0.94f, 0.64f, 0.69f); GUI.DrawTexture(new Rect(cx - 56f + lidX, by - 20f + lidY, 112f, 26f), white);
        GUI.color = new Color(1f, 0.95f, 0.79f); GUI.DrawTexture(new Rect(cx - 8f + lidX, by - 20f + lidY, 16f, 26f), white);
        GUI.color = Color.white;
        if (lidU > 0.2f)
        {
            var st = Emote("emote_stars"); float u = Mathf.Clamp01((t - 1.1f) / 0.8f);
            if (st != null) { GUI.color = new Color(1, 1, 1, u); GUI.DrawTexture(new Rect(cx - 22f, by - 46f - u * 38f, 44f, 52f), st); GUI.color = Color.white; }
        }
        float reveal = Mathf.Clamp01((t - 1.5f) / 0.8f);
        GUI.color = new Color(1, 1, 1, reveal);
        GUI.Label(new Rect(r.x + 60f, r.y + 250f, tw, h - 290f), text, new GUIStyle(sHand) { alignment = TextAnchor.UpperCenter });
        GUI.Label(new Rect(r.x, r.yMax - 46f, r.width - 48f, 28f), tip, sTip);
    }

    void DrawVoice(float vw, float vh, float lift, string tip)
    {
        float w = 520f, h = 330f;
        var r = CardRect(vw, vh, w, h); r.y += lift;
        GUI.Box(r, GUIContent.none, sCorners);
        Banner(r, disc.title);
        bool talking = voiceLines != null && voiceLine < voiceLines.Length;
        for (int i = 0; i < 11; i++)
        {
            float bh = talking ? 10f + 36f * Mathf.Abs(Mathf.Sin(Time.time * 6f + i * 0.9f)) : 8f;
            GUI.color = new Color(0.91f, 0.45f, 0.55f, talking ? 1f : 0.4f);
            GUI.DrawTexture(new Rect(r.center.x - 110f + i * 20f, r.y + 112f - bh / 2f, 9f, bh), white);
        }
        GUI.color = Color.white;
        string line = voiceLines != null ? voiceLines[Mathf.Clamp(talking ? voiceLine : voiceLines.Length - 1, 0, voiceLines.Length - 1)] : "";
        GUI.Label(new Rect(r.x + 50f, r.y + 150f, w - 100f, 120f), Clean(line), new GUIStyle(sHand) { alignment = TextAnchor.UpperCenter });
        GUI.Label(new Rect(r.x, r.yMax - 46f, r.width - 48f, 28f), tip, sTip);
    }

    void DrawLetter(float vw, float vh)
    {
        float w = Mathf.Min(720f, vw - 60f), h = 640f;
        var r = CardRect(vw, vh, w, h);
        GUI.Box(r, GUIContent.none, sCorners);
        var body = new Rect(r.x + 62f, r.y + 54f, w - 124f, h - 130f);
        string shown = Clean(letterText.Substring(0, Mathf.Min(letterChars, letterText.Length)));
        float full = sHand.CalcHeight(new GUIContent(shown), body.width);
        string fin = Clean(Content.FinalLine), from = Clean(Content.LetterFrom);
        float finH = letterFinished ? 150f : 0f;
        float total = full + finH;
        float auto = Mathf.Min(0f, body.height - total - 20f);
        letterScroll = Mathf.Clamp(letterScroll, auto < 0f ? 0f : 0f, 0f);
        float y = auto;
        GUI.BeginGroup(body);
        GUI.Label(new Rect(0, y, body.width, full + 10f), shown, sHand);
        if (letterFinished)
        {
            float a = Mathf.Clamp01((cardT - letterChars / 26f - 0.2f) / 1.5f);
            if (letterChars >= letterText.Length) a = Mathf.Clamp01((cardT - letterText.Length / 26f - 0.2f) / 1.5f);
            GUI.color = new Color(0.69f, 0.28f, 0.36f, Mathf.Max(a, 0f));
            var fs = new GUIStyle(sHand) { alignment = TextAnchor.UpperCenter, fontSize = 32 };
            fs.normal.textColor = GUI.color;
            GUI.Label(new Rect(0, y + full + 16f, body.width, 120f), fin, fs);
            GUI.color = new Color(1, 1, 1, Mathf.Max(a, 0f));
            GUI.Label(new Rect(0, y + full + 130f, body.width, 36f), from, new GUIStyle(sHand) { alignment = TextAnchor.UpperRight, fontSize = 26 });
        }
        GUI.EndGroup();
        GUI.color = Color.white;
        if (letterFinished) GUI.Label(new Rect(r.x, r.yMax - 44f, r.width - 56f, 26f), "닫기 · E", sTip);
    }

    void DrawShelf(float vw, float vh)
    {
        float w = 760f, h = 470f;
        var r = CardRect(vw, vh, w, h);
        GUI.Box(r, GUIContent.none, sCorners);
        Banner(r, "추억 선반");
        if (shelfItems == null || shelfItems.Count == 0)
        {
            GUI.Label(new Rect(r.x + 60f, r.y + 130f, w - 120f, 200f), "아직 비어 있어요.\n집 안 어딘가에 뭔가 숨어 있을지도…", new GUIStyle(sHand) { alignment = TextAnchor.UpperCenter });
            return;
        }
        for (int i = 0; i < shelfItems.Count; i++)
        {
            int col = i % 8, row = i / 8;
            var cell = new Rect(r.x + 56f + col * 82f, r.y + 80f + row * 100f, 66f, 88f);
            bool sel = i == shelfSel;
            GUI.color = sel ? Color.white : new Color(1, 1, 1, 0.8f);
            GUI.DrawTexture(new Rect(cell.x - (sel ? 4f : 0f), cell.y - (sel ? 4f : 0f), cell.width + (sel ? 8f : 0f), cell.height + (sel ? 8f : 0f)), hexLight);
            GUI.DrawTexture(new Rect(cell.center.x - 22f, cell.center.y - 15f, 44f, 31f), envLight);
        }
        GUI.color = Color.white;
        var cur = shelfItems[shelfSel];
        GUI.Label(new Rect(r.x, r.yMax - 84f, r.width, 30f), Clean(cur.title), new GUIStyle(sHand) { alignment = TextAnchor.MiddleCenter, fontSize = 26 });
        GUI.Label(new Rect(r.x, r.yMax - 48f, r.width - 56f, 24f), "고르기 · E     닫기 · Esc", sTip);
    }
}
