// SliceDirector.cs — runs the whole game from story.json.
//
// Same idea as the HTML engine: nodes with text, choices, branches and effects.
// The world (places, camera, light, rain, faces, the bell, the clock, water)
// is driven ONLY through effects, so the story stays in data.
//
// Conditions:  "flag"   "!flag"   "count>=2"   "count<2"
// Effects:     setFlag add mood rain focus face show hide exit clock stuck distort
//              memory sound bell wait fluorescent beep beepLoop go card chapter
//              clue checkpoint water music crowd end
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.EventSystems;

namespace BigGreenBear
{
    public class SliceDirector : MonoBehaviour
    {
        enum Phase { Title, Busy, Line, Choices, End }

        const string SaveKey = "bgb.save.v1";

        SliceScript script;
        SceneLayout layout;
        Stage stage;
        CameraRig rig;
        Atmosphere atmo;
        RainSystem rain;
        SliceUI ui;
        SliceAudio sound;

        readonly Dictionary<string, Node> nodes = new Dictionary<string, Node>();
        readonly Dictionary<string, string> speakerNames = new Dictionary<string, string>();
        readonly Dictionary<string, Clue> clueDefs = new Dictionary<string, Clue>();
        readonly Dictionary<string, float> flags = new Dictionary<string, float>();
        readonly List<string> clues = new List<string>();
        Phase phase = Phase.Busy;
        string lang = "en";
        bool reducedMotion;
        bool advanced;
        int chosen = -1;
        Node current;
        List<Choice> currentChoices = new List<Choice>();
        bool endRequested;
        bool titleMenu;

        // what a save needs to rebuild the moment
        string locationId = "square";
        string clockNow = "17:40";
        float memoryNow = 100f, waterNow = 0f;
        LText chapterTitle;
        Coroutine beepLoop;

        public void Init(SliceScript s, SceneLayout l, Stage st, CameraRig r, Atmosphere a, RainSystem rn, SliceUI u, SliceAudio au, string language)
        {
            script = s; layout = l; stage = st; rig = r; atmo = a; rain = rn; ui = u; sound = au;
            lang = language;
            foreach (var n in script.nodes) nodes[n.id] = n;
            if (script.clues != null) foreach (var c in script.clues) clueDefs[c.id] = c;
            ui.OnAdvance += () => advanced = true;
            ui.OnChoose += i => { if (phase == Phase.Choices || titleMenu) chosen = i; };
            ui.OnNotebookToggle += ToggleNotebook;
            ui.SetLanguage(lang);
            RefreshStaticText();
        }

        string L(LText t) => t == null ? "" : t.Get(lang);

        void RefreshStaticText()
        {
            speakerNames.Clear();
            if (script.speakers != null) foreach (var sp in script.speakers) speakerNames[sp.id] = L(sp.name);
            ui.SetTitle(L(script.ui.title), L(script.ui.subtitle), "");
            ui.SetHint(L(script.ui.controls) + "   ·   " + L(reducedMotion ? script.ui.motionOn : script.ui.motionOff));
            ui.SetChapterHud(phase == Phase.Title ? "" : L(chapterTitle));
            ui.SetNotebookButton(L(script.ui.notebook) + " (N)", phase != Phase.Title && phase != Phase.End);
            if (ui.NotebookOpen) ShowNotebook();
        }

        bool Check(string[] conds)
        {
            if (conds == null) return true;
            foreach (var raw in conds)
            {
                if (string.IsNullOrEmpty(raw)) continue;
                string c = raw.Trim();
                bool ok;
                int ge = c.IndexOf(">=");
                int lt = c.IndexOf('<');
                if (ge > 0) ok = Get(c.Substring(0, ge)) >= float.Parse(c.Substring(ge + 2), System.Globalization.CultureInfo.InvariantCulture);
                else if (lt > 0) ok = Get(c.Substring(0, lt)) < float.Parse(c.Substring(lt + 1), System.Globalization.CultureInfo.InvariantCulture);
                else if (c[0] == '!') ok = Get(c.Substring(1)) == 0f;
                else ok = Get(c) != 0f;
                if (!ok) return false;
            }
            return true;
        }

        float Get(string id) => flags.TryGetValue(id.Trim(), out var v) ? v : 0f;

        /* ---------------- title ---------------- */

        public void ShowTitle()
        {
            StopAllCoroutines();
            beepLoop = null;
            StartCoroutine(TitleRoutine());
        }

        IEnumerator TitleRoutine()
        {
            phase = Phase.Busy;
            ResetWorld();
            LoadPlace("square");
            atmo.SetMood("title", true);
            sound.SetCrowd(0f);
            sound.SetMusic(0.5f);
            rig.Focus("title");
            rig.Snap();
            // Big Green Bear, alone in the rain, before anything happened. A silhouette.
            if (stage.actors.TryGetValue("bear", out var bear)) bear.SetTint(new Color(0.16f, 0.2f, 0.22f, 1f));
            if (stage.actors.TryGetValue("nini", out var nini)) nini.Show(false);
            ui.SetHudVisible(false);
            ui.HideWords();
            phase = Phase.Title;
            RefreshStaticText();
            yield return ui.FadeGroup("fade", 0f, 2.5f);
            yield return ui.FadeGroup("title", 1f, 1.5f);
            ShowTitleMenu();
        }

        void ShowTitleMenu()
        {
            titleMenu = true;
            var labels = new List<string> { L(script.ui.newGame) };
            if (PlayerPrefs.HasKey(SaveKey)) labels.Insert(0, L(script.ui.continueGame));
            ui.ShowChoices("", labels);
            chosen = -1;
        }

        void TitleChoice(int i)
        {
            titleMenu = false;
            bool hasSave = PlayerPrefs.HasKey(SaveKey);
            if (hasSave && i == 0) StartCoroutine(ContinueGame());
            else StartCoroutine(BeginGame());
        }

        void ResetWorld()
        {
            flags.Clear();
            clues.Clear();
            endRequested = false;
            chapterTitle = null;
            stage.PlaceBell("none");
            atmo.SetDistortion(0f);
            atmo.SetMemory(100f);
            memoryNow = 100f;
            rig.SetDrift(0f);
            sound.SetDuck(0f);
            sound.SetMemory(100f);
            ui.SetClockStuck(false);
            clockNow = script.startClock;
            ui.SetClock(clockNow);
            waterNow = 0f;
            ui.SetWater(0f, true);
            ui.HideNotebook();
            StopBeeps();
        }

        void LoadPlace(string id)
        {
            locationId = id;
            stage.LoadLocation(id, Check);
            atmo.SetLights(stage.location);
            if (stage.location != null) rig.SetFocusPoints(stage.location.focus);
            foreach (var a in stage.actors.Values) { a.SetTint(Color.white); a.SetDim(false); }
            rig.Focus("wide");
            rig.Snap();
        }

        IEnumerator BeginGame()
        {
            phase = Phase.Busy;
            ui.HideWords();
            yield return ui.FadeGroup("title", 0f, 1.0f);
            yield return ui.FadeGroup("fade", 1f, 1.4f);
            PlayerPrefs.DeleteKey(SaveKey);
            ResetWorld();
            ui.SetHudVisible(true);
            yield return Run(script.start);
        }

        IEnumerator ContinueGame()
        {
            phase = Phase.Busy;
            ui.HideWords();
            yield return ui.FadeGroup("title", 0f, 1.0f);
            yield return ui.FadeGroup("fade", 1f, 1.4f);
            ResetWorld();
            string node = LoadSave();
            ui.SetHudVisible(true);
            RefreshStaticText();
            yield return ui.FadeGroup("fade", 0f, 1.6f);
            yield return Run(node);
        }

        /* ---------------- save / continue ---------------- */

        [System.Serializable]
        class SaveData
        {
            public string node, location, mood, clock, bell, lang;
            public float memory, water;
            public string[] flagKeys;
            public float[] flagValues;
            public string[] clues;
            public LText chapter;
        }

        void Save(string node)
        {
            var d = new SaveData
            {
                node = node, location = locationId, mood = atmo.MoodName, clock = clockNow,
                bell = stage.BellPlace, lang = lang, memory = memoryNow, water = waterNow,
                clues = clues.ToArray(), chapter = chapterTitle,
            };
            d.flagKeys = new string[flags.Count];
            d.flagValues = new float[flags.Count];
            int i = 0;
            foreach (var kv in flags) { d.flagKeys[i] = kv.Key; d.flagValues[i] = kv.Value; i++; }
            PlayerPrefs.SetString(SaveKey, JsonUtility.ToJson(d));
            PlayerPrefs.Save();
        }

        string LoadSave()
        {
            var d = JsonUtility.FromJson<SaveData>(PlayerPrefs.GetString(SaveKey));
            if (d == null || string.IsNullOrEmpty(d.node) || !nodes.ContainsKey(d.node)) return script.start;
            for (int i = 0; d.flagKeys != null && i < d.flagKeys.Length; i++) flags[d.flagKeys[i]] = d.flagValues[i];
            if (d.clues != null) clues.AddRange(d.clues);
            chapterTitle = d.chapter;
            LoadPlace(string.IsNullOrEmpty(d.location) ? "square" : d.location);
            atmo.SetMood(string.IsNullOrEmpty(d.mood) ? "dusk" : d.mood, true);
            clockNow = d.clock;
            ui.SetClock(clockNow);
            memoryNow = d.memory;
            atmo.SetMemory(memoryNow);
            sound.SetMemory(memoryNow);
            waterNow = d.water;
            ui.SetWater(waterNow, true);
            stage.PlaceBell(d.bell);
            sound.SetCrowd(atmo.MoodName == "dusk" ? 0.6f : atmo.MoodName == "rain" ? 0.3f : 0f);
            return d.node;
        }

        /* ---------------- running nodes ---------------- */

        IEnumerator Run(string id)
        {
            int guard = 0;
            while (!string.IsNullOrEmpty(id) && guard++ < 5000 && !endRequested)
            {
                if (!nodes.TryGetValue(id, out var n))
                {
                    Debug.LogError("[BigGreenBear] Missing node: " + id);
                    break;
                }

                // branches first: a node can be a pure crossroads
                if (n.branches != null && n.branches.Length > 0)
                {
                    string to = null;
                    foreach (var b in n.branches) if (Check(b.conditions)) { to = b.to; break; }
                    if (to != null) { id = to; continue; }
                }

                current = n;
                if (n.effects != null) foreach (var e in n.effects) yield return Apply(e);
                if (endRequested) break;
                if (n.hold > 0f)
                {
                    ui.HideWords();
                    yield return new WaitForSeconds(n.hold);
                }
                ApplyLineFx(n);

                currentChoices = new List<Choice>();
                if (n.choices != null) foreach (var c in n.choices) if (Check(c.conditions)) currentChoices.Add(c);
                bool hasText = n.text != null && !n.text.IsEmpty;

                if (hasText)
                {
                    ShowCurrentLine();
                    phase = Phase.Line;
                    advanced = false;
                    while (true)
                    {
                        yield return null;
                        if (ui.NotebookOpen) { advanced = false; continue; }
                        if (!advanced) continue;
                        advanced = false;
                        if (ui.IsTyping) { ui.FinishTyping(); continue; }
                        break;
                    }
                    sound.Play("chime");
                }
                ClearLineFx(n);

                if (currentChoices.Count > 0)
                {
                    ShowCurrentChoices();
                    phase = Phase.Choices;
                    chosen = -1;
                    while (chosen < 0) yield return null;
                    var c = currentChoices[chosen];
                    ui.HideHotspots();
                    sound.Play("chime");
                    phase = Phase.Busy;
                    if (c.effects != null) foreach (var e in c.effects) yield return Apply(e);
                    id = c.next;
                    continue;
                }
                phase = Phase.Busy;
                id = n.next;
            }
            ui.HideWords();
            foreach (var a in stage.actors.Values) { a.SetDim(false); a.SetSpeaking(false); }
            if (endRequested) yield return EndRoutine();
        }

        void ShowCurrentLine()
        {
            var n = current;
            string who = n.speaker ?? "";
            bool narration = who == "" || who == "narrator";
            foreach (var kv in stage.actors)
            {
                kv.Value.SetSpeaking(kv.Key == who);
                kv.Value.SetDim(!narration && kv.Key != who && stage.actors.ContainsKey(who));
            }
            speakerNames.TryGetValue(who, out var name);
            bool echoLine = n.fx != null && System.Array.IndexOf(n.fx, "echo") >= 0;
            ui.ShowLine(narration ? "" : name, L(n.text), narration, echoLine);
        }

        void ShowCurrentChoices()
        {
            foreach (var a in stage.actors.Values) { a.SetDim(false); a.SetSpeaking(false); }
            var labels = new List<string>();
            foreach (var c in currentChoices) labels.Add(L(c.text));
            bool hasText = current != null && current.text != null && !current.text.IsEmpty;
            ui.ShowChoices(hasText ? L(current.text) : L(script.ui.prompt), labels);
        }

        void ApplyLineFx(Node n)
        {
            if (n.fx == null) return;
            foreach (var f in n.fx)
            {
                switch (f)
                {
                    case "clock1147": ui.SetClockStuck(true); break;
                    case "fluorescent": atmo.FluorescentFlicker(); break;
                    case "beep": StartCoroutine(Beeps(3)); break;
                    case "drift": rig.SetDrift(0.6f); break;
                }
            }
        }

        void ClearLineFx(Node n)
        {
            if (n.fx == null) return;
            foreach (var f in n.fx) if (f == "drift") rig.SetDrift(atmo.Distortion);
        }

        IEnumerator Beeps(int count)
        {
            for (int i = 0; i < count; i++)
            {
                sound.Play("monitor");
                yield return new WaitForSeconds(0.92f);
            }
        }

        IEnumerator BeepLoop(float interval)
        {
            while (true)
            {
                sound.Play("monitor");
                yield return new WaitForSeconds(interval);
            }
        }

        void StopBeeps()
        {
            if (beepLoop != null) StopCoroutine(beepLoop);
            beepLoop = null;
        }

        IEnumerator Apply(Effect e)
        {
            Actor actor = null;
            if (!string.IsNullOrEmpty(e.id)) stage.actors.TryGetValue(e.id, out actor);
            switch (e.type)
            {
                case "setFlag": flags[e.id] = e.value == "false" ? 0f : 1f; break;
                case "add": flags[e.id] = Get(e.id) + (e.num == 0f ? 1f : e.num); break;
                case "mood":
                    atmo.SetMood(e.value);
                    sound.SetCrowd(e.value == "dusk" ? 0.6f : e.value == "rain" ? 0.3f : 0f);
                    break;
                case "rain": atmo.SetRainOverride(e.num); break;
                case "focus": rig.Focus(e.value); break;
                case "face": if (actor != null) actor.SetFace(e.value); break;
                case "show": if (actor != null) actor.Show(true); break;
                case "hide": if (actor != null) actor.Show(false); break;
                case "exit":
                    if (actor != null)
                    {
                        var co = actor.Exit(e.num == 0f ? 7f : e.num, 3.2f);
                        if (e.value == "wait") yield return co;
                    }
                    break;
                case "clock": clockNow = e.value; ui.SetClock(e.value); break;
                case "stuck": ui.SetClockStuck(e.num > 0f); break;
                case "distort":
                    atmo.SetDistortion(e.num);
                    rig.SetDrift(e.num);
                    sound.SetDuck(e.num);
                    break;
                case "memory":
                    memoryNow = e.num;
                    atmo.SetMemory(e.num);
                    sound.SetMemory(e.num);
                    break;
                case "sound": sound.Play(e.id); break;
                case "bell": stage.PlaceBell(e.value); break;
                case "wait":
                    ui.HideWords();
                    yield return new WaitForSeconds(e.num);
                    break;
                case "fluorescent": atmo.FluorescentFlicker(); break;
                case "beep": StartCoroutine(Beeps(e.num > 0 ? (int)e.num : 3)); break;
                case "beepLoop":
                    StopBeeps();
                    if (e.num > 0f) beepLoop = StartCoroutine(BeepLoop(e.num));
                    break;
                case "music": sound.SetMusic(e.num); break;
                case "crowd": sound.SetCrowd(e.num); break;
                case "water": waterNow = e.num; ui.SetWater(e.num); break;
                case "go": yield return GoTo(e.value, e.id); break;
                case "hud":
                    ui.SetHudVisible(e.num > 0f);
                    ui.SetNotebookButton(L(script.ui.notebook) + " (N)", e.num > 0f);
                    break;
                case "card": yield return Card(e); break;
                case "chapter":
                    chapterTitle = e.title;
                    ui.SetChapterHud(L(chapterTitle));
                    break;
                case "clue": AddClue(e.id); break;
                case "checkpoint": Save(string.IsNullOrEmpty(e.value) ? current.id : e.value); break;
                case "end": endRequested = true; break;
                default: Debug.LogWarning("[BigGreenBear] Unknown effect: " + e.type); break;
            }
        }

        // Fade out, rebuild the place, fade back in. (If the screen is already black, just load.)
        IEnumerator GoTo(string id, string mood)
        {
            ui.HideWords();
            bool alreadyBlack = ui.FadeAlpha > 0.98f;
            if (!alreadyBlack) yield return ui.FadeGroup("fade", 1f, 0.7f);
            // the new place's light and weather are set while the screen is black
            if (!string.IsNullOrEmpty(mood))
            {
                atmo.SetMood(mood, true);
                sound.SetCrowd(mood == "dusk" ? 0.6f : mood == "rain" ? 0.3f : 0f);
            }
            LoadPlace(id);
            yield return new WaitForSeconds(0.15f);
            yield return ui.FadeGroup("fade", 0f, alreadyBlack ? 1.8f : 0.9f);
        }

        // Chapter card: black, words, a breath, (black stays if value == "hold").
        IEnumerator Card(Effect e)
        {
            ui.HideWords();
            yield return ui.FadeGroup("fade", 1f, 1.4f);
            ui.SetCard(L(e.label), L(e.title));
            yield return ui.FadeGroup("card", 1f, 1.4f);
            float until = Time.time + (e.num > 0f ? e.num : 3.2f);
            advanced = false;
            while (Time.time < until && !advanced) yield return null;
            advanced = false;
            yield return ui.FadeGroup("card", 0f, 1.2f);
            if (e.value != "hold") yield return ui.FadeGroup("fade", 0f, 1.6f);
        }

        void AddClue(string id)
        {
            if (string.IsNullOrEmpty(id) || clues.Contains(id)) return;
            clues.Add(id);
            flags["clue_" + id] = 1f;
            if (clueDefs.TryGetValue(id, out var c)) ui.Toast(L(script.ui.clueAdded) + "  " + L(c.title));
            sound.Play("chime");
        }

        void ToggleNotebook()
        {
            if (phase == Phase.Title || phase == Phase.End) return;
            if (ui.NotebookOpen) ui.HideNotebook();
            else ShowNotebook();
        }

        void ShowNotebook()
        {
            var sb = new System.Text.StringBuilder();
            if (clues.Count == 0) sb.Append(L(script.ui.notebookEmpty));
            for (int i = clues.Count - 1; i >= 0; i--) // newest first
            {
                if (!clueDefs.TryGetValue(clues[i], out var c)) continue;
                sb.Append("• ").Append(L(c.title)).Append('\n').Append("   ").Append(L(c.text)).Append("\n\n");
            }
            ui.ShowNotebook(L(script.ui.notebook), sb.ToString());
        }

        IEnumerator EndRoutine()
        {
            phase = Phase.End;
            StopBeeps();
            ui.HideWords();
            ui.HideNotebook();
            RefreshStaticText();
            yield return new WaitForSeconds(1.2f);
            yield return ui.FadeGroup("fade", 1f, 3.5f);
            sound.SetMusic(0f);
            ui.SetHudVisible(false);
            ui.SetCard("", L(script.ui.theEnd));
            yield return ui.FadeGroup("card", 1f, 2f);
            advanced = false;
            while (!advanced) yield return null;
            yield return ui.FadeGroup("card", 0f, 1.2f);
            PlayerPrefs.DeleteKey(SaveKey);
            RefreshStaticText();
            ShowTitle();
        }

        /* ---------------- input ---------------- */

        void Update()
        {
            sound.SetRain(rain.Intensity);

            if (SliceInput.Language())
            {
                lang = lang == "ko" ? "en" : "ko";
                ui.SetLanguage(lang);
                RefreshStaticText();
                if (phase == Phase.Line && current != null) { ShowCurrentLine(); ui.FinishTyping(); }
                else if (phase == Phase.Choices) ShowCurrentChoices();
                else if (titleMenu) ShowTitleMenu();
            }
            if (SliceInput.Motion())
            {
                reducedMotion = !reducedMotion;
                Actor.ReducedMotion = CameraRig.ReducedMotion = RainSystem.ReducedMotion = Atmosphere.ReducedMotion = SliceUI.ReducedMotion = reducedMotion;
                RefreshStaticText();
            }
            if (SliceInput.Notebook()) ToggleNotebook();

            // Esc closes the notebook; otherwise it closes the built game
            // (progress is kept at the last checkpoint).
            if (SliceInput.Quit())
            {
                if (ui.NotebookOpen) ui.HideNotebook();
                else Application.Quit();
            }

            if (ui.NotebookOpen) return;

            if (SliceInput.Advance()) advanced = true;
            if (titleMenu)
            {
                int d = SliceInput.Digit();
                if (d >= 0) chosen = d;
                if (chosen >= 0)
                {
                    int c = chosen;
                    chosen = -1;
                    ui.HideWords();
                    TitleChoice(c);
                }
                advanced = false;
                return;
            }
            if (phase == Phase.Choices)
            {
                int d = SliceInput.Digit();
                if (d >= 0 && d < currentChoices.Count) chosen = d;
                UpdateHotspots();
            }
        }

        /* ---------------- click things in the world ---------------- */

        readonly List<SliceUI.HotspotView> hotViews = new List<SliceUI.HotspotView>();
        readonly List<int> hotChoice = new List<int>();

        void UpdateHotspots()
        {
            var cam = Camera.main;
            hotViews.Clear();
            hotChoice.Clear();
            if (cam != null)
            {
                for (int i = 0; i < currentChoices.Count; i++)
                {
                    var target = currentChoices[i].target;
                    if (string.IsNullOrEmpty(target)) continue;
                    if (!TryHotspot(target, cam, out var view)) continue;
                    view.label = L(currentChoices[i].text);
                    hotViews.Add(view);
                    hotChoice.Add(i);
                }
            }
            int h = ui.ShowHotspots(hotViews, SliceInput.MouseScreen());
            ui.HighlightChoice(h >= 0 ? hotChoice[h] : -1);
            // A click on the list itself is handled by the list's buttons.
            bool overUI = EventSystem.current != null && EventSystem.current.IsPointerOverGameObject();
            if (h >= 0 && SliceInput.Click() && !overUI) chosen = hotChoice[h];
        }

        bool TryHotspot(string id, Camera cam, out SliceUI.HotspotView view)
        {
            view = default;
            var loc = stage.location;
            if (loc == null || loc.hotspots == null) return false;
            foreach (var hs in loc.hotspots)
            {
                if (hs.id != id) continue;
                string anchor = string.IsNullOrEmpty(hs.anchor) ? hs.id : hs.anchor;
                Vector3 p;
                if (stage.actors.TryGetValue(anchor, out var actor))
                {
                    if (!actor.gameObject.activeInHierarchy) continue;
                    p = actor.transform.position + Vector3.up * actor.Height * 0.5f;
                }
                else if (!stage.anchors.TryGetValue(anchor, out p)) continue;

                Vector3 s = cam.WorldToScreenPoint(p);
                if (s.z <= 0f || s.x < 0f || s.y < 0f || s.x > Screen.width || s.y > Screen.height) continue;
                Vector3 e = cam.WorldToScreenPoint(p + cam.transform.right * hs.radius);
                float r = Mathf.Max(Vector2.Distance(new Vector2(s.x, s.y), new Vector2(e.x, e.y)), Screen.height * 0.05f);
                view.screen = new Vector2(s.x, s.y);
                view.radius = r;
                return true;
            }
            return false;
        }
    }
}
