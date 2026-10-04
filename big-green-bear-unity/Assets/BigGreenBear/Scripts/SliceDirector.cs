// SliceDirector.cs — runs the story beats in slice.json.
//
// Same idea as the HTML engine, much smaller: nodes with text, choices,
// branches and effects. The world (camera, light, rain, faces, the bell,
// the clock) is driven ONLY through effects, so the story stays in data.
//
// Conditions:  "flag"   "!flag"   "count>=2"   "count<2"
// Effects:     setFlag add mood rain focus face show hide exit clock stuck
//              distort memory sound bell wait fluorescent beep end
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.EventSystems;

namespace BigGreenBear
{
    public class SliceDirector : MonoBehaviour
    {
        enum Phase { Title, Busy, Line, Choices, End }

        SliceScript script;
        Stage stage;
        CameraRig rig;
        Atmosphere atmo;
        RainSystem rain;
        SliceUI ui;
        SliceAudio sound;

        readonly Dictionary<string, Node> nodes = new Dictionary<string, Node>();
        readonly Dictionary<string, string> speakerNames = new Dictionary<string, string>();
        readonly Dictionary<string, float> flags = new Dictionary<string, float>();
        Phase phase = Phase.Busy;
        string lang = "en";
        bool reducedMotion;
        bool advanced;
        int chosen = -1;
        Node current;
        List<Choice> currentChoices = new List<Choice>();
        bool endRequested;

        public void Init(SliceScript s, Stage st, CameraRig r, Atmosphere a, RainSystem rn, SliceUI u, SliceAudio au, string language)
        {
            script = s; stage = st; rig = r; atmo = a; rain = rn; ui = u; sound = au;
            lang = language;
            foreach (var n in script.nodes) nodes[n.id] = n;
            ui.OnAdvance += () => advanced = true;
            ui.OnChoose += i => { if (phase == Phase.Choices) chosen = i; };
            ui.SetLanguage(lang);
            RefreshStaticText();
        }

        string L(LText t) => t == null ? "" : t.Get(lang);

        void RefreshStaticText()
        {
            speakerNames.Clear();
            if (script.speakers != null) foreach (var sp in script.speakers) speakerNames[sp.id] = L(sp.name);
            ui.SetTitle(L(script.ui.title), L(script.ui.subtitle), L(script.ui.pressStart));
            ui.SetCard(L(script.ui.chapterLabel), L(script.ui.chapterTitle));
            ui.SetHint(L(script.ui.controls) + "   ·   " + L(reducedMotion ? script.ui.motionOn : script.ui.motionOff));
            ui.SetChapterHud(phase == Phase.Title ? "" : L(script.ui.chapterTitle));
        }

        /* ---------------- title ---------------- */

        public void ShowTitle()
        {
            StopAllCoroutines();
            StartCoroutine(TitleRoutine());
        }

        IEnumerator TitleRoutine()
        {
            phase = Phase.Busy;
            ResetWorld();
            atmo.SetMood("title", true);
            sound.SetCrowd(0f);
            sound.SetMusic(0.5f);
            rig.Focus("title");
            // Big Green Bear, alone in the rain, before anything happened. A silhouette.
            if (stage.actors.TryGetValue("bear", out var bear)) bear.SetTint(new Color(0.16f, 0.2f, 0.22f, 1f));
            if (stage.actors.TryGetValue("nini", out var nini)) nini.Show(false);
            ui.SetHudVisible(false);
            ui.HideWords();
            ui.SetCatcher(true);
            yield return ui.FadeGroup("fade", 0f, 2.5f);
            yield return ui.FadeGroup("title", 1f, 1.5f);
            phase = Phase.Title;
            advanced = false;
        }

        void ResetWorld()
        {
            flags.Clear();
            endRequested = false;
            foreach (var a in stage.actors.Values)
            {
                a.Show(true);
                a.SetTint(Color.white);
                a.SetDim(false);
                a.SetSpeaking(false);
                a.SetFace(a.Id == "nini" ? "happy" : "neutral");
            }
            stage.PlaceBell("none");
            atmo.SetDistortion(0f);
            atmo.SetMemory(100f);
            rig.SetDrift(0f);
            sound.SetDuck(0f);
            sound.SetMemory(100f);
            ui.SetClockStuck(false);
            ui.SetClock(script.startClock);
        }

        IEnumerator BeginGame()
        {
            phase = Phase.Busy;
            yield return ui.FadeGroup("title", 0f, 1.0f);
            yield return ui.FadeGroup("fade", 1f, 1.4f);
            ResetWorld();
            atmo.SetMood("dusk", true);
            sound.SetCrowd(0.6f);
            sound.SetMusic(0.55f);
            rig.Focus("wide");
            yield return ui.FadeGroup("card", 1f, 1.2f);
            float until = Time.time + 3.2f;
            advanced = false;
            while (Time.time < until && !advanced) yield return null;
            yield return ui.FadeGroup("card", 0f, 1.0f);
            ui.SetHudVisible(true);
            RefreshStaticText();
            yield return ui.FadeGroup("fade", 0f, 2.2f);
            yield return Run(script.start);
        }

        /* ---------------- running nodes ---------------- */

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

        IEnumerator Run(string id)
        {
            int guard = 0;
            while (!string.IsNullOrEmpty(id) && guard++ < 500 && !endRequested)
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
                current = n;

                if (hasText)
                {
                    ShowCurrentLine();
                    phase = Phase.Line;
                    advanced = false;
                    while (true)
                    {
                        yield return null;
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
                kv.Value.SetDim(!narration && kv.Key != who);
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
            ui.ShowChoices(L(script.ui.prompt), labels);
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
                    sound.SetCrowd(e.value == "dusk" ? 0.6f : e.value == "rain" ? 0.3f : 0.05f);
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
                case "clock": ui.SetClock(e.value); break;
                case "stuck": ui.SetClockStuck(e.num > 0f); break;
                case "distort":
                    atmo.SetDistortion(e.num);
                    rig.SetDrift(e.num);
                    sound.SetDuck(e.num);
                    break;
                case "memory":
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
                case "end": endRequested = true; break;
                default: Debug.LogWarning("[BigGreenBear] Unknown effect: " + e.type); break;
            }
        }

        IEnumerator EndRoutine()
        {
            phase = Phase.End;
            ui.HideWords();
            yield return new WaitForSeconds(1.2f);
            yield return ui.FadeGroup("fade", 1f, 3.5f);
            sound.SetMusic(0f);
            ui.SetHudVisible(false);
            ui.SetCard("", L(script.ui.toBeContinued));
            yield return ui.FadeGroup("card", 1f, 2f);
            advanced = false;
            while (!advanced) yield return null;
            yield return ui.FadeGroup("card", 0f, 1.2f);
            RefreshStaticText();
            ShowTitle();
        }

        /* ---------------- input ---------------- */

        void Update()
        {
            sound.SetRain(rain.Intensity);

            // Esc closes the built game (in the Editor, press the Play button again instead).
            if (SliceInput.Quit()) Application.Quit();

            if (SliceInput.Language())
            {
                lang = lang == "ko" ? "en" : "ko";
                ui.SetLanguage(lang);
                RefreshStaticText();
                if (phase == Phase.Line && current != null) { ShowCurrentLine(); ui.FinishTyping(); }
                else if (phase == Phase.Choices) ShowCurrentChoices();
            }
            if (SliceInput.Motion())
            {
                reducedMotion = !reducedMotion;
                Actor.ReducedMotion = CameraRig.ReducedMotion = RainSystem.ReducedMotion = Atmosphere.ReducedMotion = SliceUI.ReducedMotion = reducedMotion;
                RefreshStaticText();
            }

            if (SliceInput.Advance()) advanced = true;
            if (phase == Phase.Title && advanced)
            {
                advanced = false;
                StartCoroutine(BeginGame());
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
            HotspotLayout hs = null;
            if (stage.layout.hotspots != null)
                foreach (var x in stage.layout.hotspots) if (x.id == id) { hs = x; break; }
            if (hs == null) return false;
            string anchor = string.IsNullOrEmpty(hs.anchor) ? hs.id : hs.anchor;
            Vector3 p;
            if (stage.actors.TryGetValue(anchor, out var actor))
            {
                if (!actor.gameObject.activeInHierarchy) return false;
                p = actor.transform.position + Vector3.up * actor.Height * 0.5f;
            }
            else if (!stage.anchors.TryGetValue(anchor, out p)) return false;

            Vector3 s = cam.WorldToScreenPoint(p);
            if (s.z <= 0f || s.x < 0f || s.y < 0f || s.x > Screen.width || s.y > Screen.height) return false;
            Vector3 e = cam.WorldToScreenPoint(p + cam.transform.right * hs.radius);
            float r = Mathf.Max(Vector2.Distance(new Vector2(s.x, s.y), new Vector2(e.x, e.y)), Screen.height * 0.05f);
            view.screen = new Vector2(s.x, s.y);
            view.radius = r;
            return true;
        }
    }
}
