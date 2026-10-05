using System;
using System.Collections.Generic;
using DearMe.Content;
using DearMe.Input;
using DearMe.Language;
using DearMe.Story;
using UnityEngine;
using UnityEngine.UI;

namespace DearMe.UI
{
    /// <summary>
    /// Practice moments, drawn as part of the world (same paper, same type) rather than a quiz app.
    /// Feedback is a short spoken-style line ("맞아.", "거의 맞았어.") plus why; mistakes never
    /// cost anything, and after a few tries the answer is shown so the story can continue.
    /// </summary>
    public class DrillView : MonoBehaviour
    {
        CardFrame frame;
        Theme theme;
        TooltipController tooltips;
        ContentDatabase db;
        InputGate gate;
        DocumentView documents;
        PhotoView photos;
        Func<string, string> photoStateOf;
        public Action<string> PlaySfx = _ => { };

        DrillDef drill;
        Action<DrillOutcome> onDone;
        DrillOutcome outcome;
        int wrong;
        bool finished;

        RectTransform body;
        RectTransform feedback;

        const int RevealAfter = 3;

        public bool IsOpen => frame.IsOpen;

        public void Build(RectTransform layer, Theme theme, TooltipController tooltips, ContentDatabase db, InputGate gate,
            DocumentView documents, PhotoView photos, Func<string, string> photoStateOf)
        {
            this.theme = theme;
            this.tooltips = tooltips;
            this.db = db;
            this.gate = gate;
            this.documents = documents;
            this.photos = photos;
            this.photoStateOf = photoStateOf;
            frame = CardFrame.Build("Drill", layer, theme, 900f);
        }

        public void Show(DrillDef drill, Action<DrillOutcome> done)
        {
            this.drill = drill;
            onDone = done;
            outcome = new DrillOutcome();
            wrong = 0;
            finished = false;
            bool english = tooltips.Settings.support != LanguageSupportLevel.Off;
            frame.Open(drill.instructionKo, english ? drill.instructionEn : "");
            gate.SetState(InputState.Idle);

            if (drill.introKo.Length > 0)
                AddLine(frame.Content, "", drill.introKo, drill.introEn, Theme.BodySize - 2, Theme.Charcoal);
            if (drill.promptKo.Length > 0)
            {
                if (drill.speaker.Length > 0)
                    UIFactory.Text("Speaker", frame.Content, db.SpeakerNameKo(drill.speaker), theme.Strong, Theme.SmallSize,
                        db.Characters.TryGetValue(drill.speaker, out var c) ? Theme.Hex(c.color) : Theme.Accent);
                AddLine(frame.Content, drill.speaker, drill.promptKo, drill.promptEn, Theme.BodySize, Theme.Ink);
            }
            else if (drill.promptEn.Length > 0)
            {
                // Target meaning for build-a-sentence tasks.
                UIFactory.Text("Target", frame.Content, drill.promptEn, theme.Body, Theme.SmallSize, Theme.Muted);
            }

            if (drill.referenceDocument.Length > 0 && db.Documents.TryGetValue(drill.referenceDocument, out var doc))
                AddReferenceButton(db.UiKo("reference_doc"), db.UiEn("reference_doc"), () => documents.Show(doc, null, reference: true));
            if (drill.referencePhoto.Length > 0 && db.Photos.TryGetValue(drill.referencePhoto, out var photo))
                AddReferenceButton(db.UiKo("reference_photo"), db.UiEn("reference_photo"),
                    () => photos.Show(photo, db.PhotoStateOf(photo.id, photoStateOf(photo.id)), null, reference: true));

            body = UIFactory.Rect("Body", frame.Content);
            UIFactory.Vertical(body.gameObject, 12f);
            feedback = UIFactory.Rect("Feedback", frame.Content);
            UIFactory.Vertical(feedback.gameObject, 6f, new RectOffset(0, 0, 6, 0));

            switch (drill.kind)
            {
                case "meaning":
                case "comprehension":
                case "context":
                    BuildOptions();
                    break;
                case "substitution":
                    substitutionIndex = 0;
                    calendar = null;
                    BuildSubstitution();
                    break;
                case "order":
                case "transform":
                case "negative":
                    placed.Clear();
                    BuildAssembly();
                    break;
                case "production":
                    pickA = pickB = -1;
                    BuildProduction();
                    break;
                case "match":
                    BuildMatch();
                    break;
                default:
                    Debug.LogError("[DearMe] Unknown drill kind " + drill.kind);
                    Finish();
                    break;
            }
        }

        // ------------------------------------------------------------ helpers

        KoreanTextView AddLine(Transform parent, string speaker, string markup, string english, int size, Color color, bool marker = true)
        {
            var view = KoreanTextView.Create("Line", parent, theme, tooltips);
            view.SetLine(KoreanMarkup.BuildLine(drill.id, speaker, markup, english), theme.Body, size, color, sentenceMarker: marker);
            return view;
        }

        void AddReferenceButton(string ko, string en, Action open)
        {
            var b = UIFactory.Button("Reference", frame.Content, theme, ko, null, () => open(), Theme.SmallSize);
            UIFactory.Layout(b.gameObject, minHeight: theme.TouchMin);
        }

        /// <summary>A tappable chunk/option whose label keeps tooltip help (long press inside buttons).</summary>
        Button ChunkButton(Transform parent, string markup, string english, Action onClick, int size = Theme.ChoiceSize)
        {
            var button = UIFactory.BareButton("Chunk", parent, theme, () => onClick());
            var row = UIFactory.Horizontal(button.gameObject, 0f, new RectOffset(18, 18, 10, 10), TextAnchor.MiddleCenter);
            row.childForceExpandWidth = true;
            var text = KoreanTextView.Create("Text", button.transform, theme, tooltips);
            text.SetLine(KoreanMarkup.BuildLine(drill.id, "", markup, english), theme.Body, size, Theme.Ink, forwardClicks: true, lineAlign: 0.5f);
            return button;
        }

        Button EnglishButton(Transform parent, string english, Action onClick)
        {
            var b = UIFactory.Button("Option", parent, theme, english, null, () => onClick(), Theme.SmallSize + 2);
            var label = b.GetComponentInChildren<Text>();
            label.font = theme.Body;
            return b;
        }

        static void Mark(Button b, string state)
        {
            var img = (Image)b.targetGraphic;
            switch (state)
            {
                case "selected":
                    UIFactory.ApplyColors(b, filled: false);
                    var colors = b.colors;
                    colors.normalColor = colors.selectedColor = Theme.WithAlpha(Theme.Accent, 0.22f);
                    b.colors = colors;
                    break;
                case "correct":
                    var cc = b.colors;
                    cc.normalColor = cc.selectedColor = cc.disabledColor = Theme.WithAlpha(Theme.Accent, 0.28f);
                    b.colors = cc;
                    b.interactable = false;
                    break;
                case "dim":
                    b.interactable = false;
                    var cg = UIFactory.AddOrGet<CanvasGroup>(b.gameObject);
                    cg.alpha = 0.38f;
                    break;
                default:
                    UIFactory.ApplyColors(b, filled: false);
                    break;
            }
            img.SetAllDirty();
        }

        bool Accept() =>
            !finished && gate.TryConsume(GameAction.Interact, Time.unscaledTimeAsDouble, Time.frameCount);

        void ShowFeedback(Verdict verdict, bool almost, string ko, string en)
        {
            UIFactory.DestroyChildren(feedback);
            string generic = verdict == Verdict.Correct ? "fb_correct"
                : verdict == Verdict.Unnatural ? "fb_unnatural"
                : almost ? "fb_almost" : "fb_wrong";
            var accent = UIFactory.Image("Rule", feedback, verdict == Verdict.Correct ? Theme.Accent : Theme.Line);
            UIFactory.Layout(accent.gameObject, minHeight: 2f, preferredHeight: 2f);
            // Specific feedback replaces the generic line when it already says "맞아."-style things.
            bool specificStartsWithGeneric = ko.Length > 0 && KoreanMarkup.StripToPlain(ko).StartsWith(db.UiKo(generic).TrimEnd('.'));
            if (!specificStartsWithGeneric)
                AddLine(feedback, "", db.UiKo(generic), db.UiEn(generic), Theme.BodySize - 2, verdict == Verdict.Correct ? Theme.Accent : Theme.Ink);
            if (ko.Length > 0) AddLine(feedback, "", ko, en, Theme.SmallSize + 2, Theme.Charcoal);
            PlaySfx(verdict == Verdict.Correct ? "soft_ok" : "soft_no");
            ScrollToBottom();
        }

        void ScrollToBottom()
        {
            Canvas.ForceUpdateCanvases();
            frame.Scroll.verticalNormalizedPosition = 0f;
        }

        void Finish()
        {
            if (finished) return;
            finished = true;
            if (drill.successKo.Length > 0)
                AddLine(feedback, "", drill.successKo, drill.successEn, Theme.SmallSize + 2, Theme.Ink);
            UIFactory.DestroyChildren(frame.Footer);
            var cont = UIFactory.Button("Continue", frame.Footer, theme, db.UiKo("continue"), null, Complete, filled: true);
            UIFactory.Layout(cont.gameObject, minHeight: theme.TouchMin, preferredWidth: 200f);
            ScrollToBottom();
        }

        void Complete()
        {
            if (!frame.IsOpen || !finished) return;
            if (!gate.TryConsume(GameAction.Interact, Time.unscaledTimeAsDouble, Time.frameCount)) return;
            tooltips.Hide();
            frame.Close();
            outcome.attempts = wrong + 1;
            var cb = onDone;
            onDone = null;
            cb?.Invoke(outcome);
        }

        /// <summary>Closes without continuing the story (returning to the title).</summary>
        public void Dismiss()
        {
            onDone = null;
            if (frame.IsOpen) frame.Close();
        }

        void Update()
        {
            if (frame.IsOpen && finished && !documents.IsOpen && !photos.IsOpen && DearMe.Platform.InputAdapter.AdvancePressed)
                Complete();
        }

        // ------------------------------------------------------------ choose an option

        readonly List<Button> optionButtons = new List<Button>();

        void BuildOptions()
        {
            optionButtons.Clear();
            for (int i = 0; i < drill.options.Length; i++)
            {
                int index = i;
                var o = drill.options[i];
                var b = o.ko.Length > 0
                    ? ChunkButton(body, o.ko, o.en, () => ChooseOption(index))
                    : EnglishButton(body, o.en, () => ChooseOption(index));
                optionButtons.Add(b);
            }
        }

        void ChooseOption(int index)
        {
            if (!Accept()) return;
            var fb = DrillEvaluator.EvaluateOption(drill, index);
            if (fb.verdict == Verdict.Correct)
            {
                Mark(optionButtons[index], "correct");
                foreach (var b in optionButtons) b.interactable = false;
                outcome.effects = fb.effects;
                outcome.producedMarkup = fb.producedMarkup;
                outcome.producedEnglish = fb.producedEnglish;
                ShowFeedback(Verdict.Correct, false, fb.ko, fb.en);
                Finish();
                return;
            }
            wrong++;
            Mark(optionButtons[index], "dim");
            ShowFeedback(fb.verdict, false, fb.ko, fb.en);
            int remaining = 0;
            foreach (var b in optionButtons) if (b.interactable) remaining++;
            if (wrong >= RevealAfter - 1 || remaining <= 1) RevealOption();
        }

        void RevealOption()
        {
            for (int i = 0; i < drill.options.Length; i++)
            {
                if (!drill.options[i].correct) { optionButtons[i].interactable = false; continue; }
                Mark(optionButtons[i], "correct");
                var o = drill.options[i];
                outcome.effects = o.effects;
                outcome.producedMarkup = o.ko;
                outcome.producedEnglish = o.en;
                AddLine(feedback, "", db.UiKo("fb_reveal"), db.UiEn("fb_reveal"), Theme.SmallSize + 2, Theme.Ink);
                if (o.ko.Length > 0) AddLine(feedback, "", o.ko, o.en, Theme.BodySize - 2, Theme.Accent);
                else UIFactory.Text("Answer", feedback, o.en, theme.Body, Theme.SmallSize + 2, Theme.Accent);
            }
            Finish();
        }

        // ------------------------------------------------------------ substitution

        int substitutionIndex;
        RectTransform calendar;

        void BuildSubstitution()
        {
            if (calendar == null)
            {
                calendar = UIFactory.Rect("Calendar", body);
                var bg = calendar.gameObject.AddComponent<Image>();
                bg.color = Theme.WithAlpha(Theme.Cream, 1f);
                bg.raycastTarget = false;
                UIFactory.Vertical(calendar.gameObject, 6f, new RectOffset(18, 18, 12, 12));
                UIFactory.Text("CalendarTitle", calendar, "이번 주", theme.Body, Theme.TinySize, Theme.Muted);
            }
            var current = body.Find("Current");
            if (current != null) { current.gameObject.SetActive(false); Destroy(current.gameObject); }
            if (substitutionIndex >= drill.items.Length) { Finish(); return; }

            var item = drill.items[substitutionIndex];
            var panel = UIFactory.Rect("Current", body);
            UIFactory.Vertical(panel.gameObject, 10f);
            AddLine(panel, "", item.who + " — " + item.baseKo, item.baseEn, Theme.BodySize - 2, Theme.Ink, marker: true);
            var buttons = new List<Button>();
            for (int i = 0; i < item.options.Length; i++)
            {
                int index = i;
                buttons.Add(ChunkButton(panel, item.options[i], "", () => ChooseSubstitution(index, buttons)));
            }
        }

        void ChooseSubstitution(int index, List<Button> buttons)
        {
            if (!Accept()) return;
            var item = drill.items[substitutionIndex];
            var fb = DrillEvaluator.EvaluateSubstitution(item, index);
            if (fb.verdict == Verdict.Correct)
            {
                UIFactory.Text("Entry", calendar, item.who + "  ·  " + item.options[item.answer], theme.Body, Theme.SmallSize + 2, Theme.Ink);
                UIFactory.DestroyChildren(feedback);
                PlaySfx("pencil");
                substitutionIndex++;
                BuildSubstitution();
                return;
            }
            wrong++;
            Mark(buttons[index], "dim");
            ShowFeedback(Verdict.Incorrect, false, fb.ko, fb.en);
        }

        // ------------------------------------------------------------ build a sentence

        readonly List<int> placed = new List<int>();
        int failedChecks;

        void BuildAssembly()
        {
            failedChecks = 0;
            RebuildAssembly();
            var clear = UIFactory.Button("Clear", frame.Footer, theme, db.UiKo("clear"), null, () =>
            {
                if (finished) return;
                placed.Clear();
                RebuildAssembly();
            }, Theme.SmallSize);
            UIFactory.Layout(clear.gameObject, minHeight: theme.TouchMin, preferredWidth: 140f);
            var check = UIFactory.Button("Check", frame.Footer, theme, db.UiKo("check"), null, CheckAssembly, filled: true);
            UIFactory.Layout(check.gameObject, minHeight: theme.TouchMin, preferredWidth: 160f);
        }

        void RebuildAssembly()
        {
            UIFactory.DestroyChildren(body);
            var tray = UIFactory.Rect("Answer", body);
            var trayBg = tray.gameObject.AddComponent<Image>();
            trayBg.color = Theme.WithAlpha(Theme.Ink, 0.04f);
            trayBg.raycastTarget = false;
            var trayFlow = tray.gameObject.AddComponent<FlowLayoutGroup>();
            trayFlow.padding = new RectOffset(14, 14, 12, 12);
            trayFlow.spacingX = 8f;
            trayFlow.spacingY = 8f;
            UIFactory.Layout(tray.gameObject, minHeight: theme.TouchMin + 24f);
            foreach (int index in placed)
            {
                int captured = index;
                var b = ChunkButton(tray, drill.chunks[index].ko, drill.chunks[index].en, () => Unplace(captured));
                if (drill.chunks[index].glue) b.gameObject.AddComponent<FlowGlue>();
            }

            var pool = UIFactory.Rect("Pool", body);
            var poolFlow = pool.gameObject.AddComponent<FlowLayoutGroup>();
            poolFlow.spacingX = 10f;
            poolFlow.spacingY = 10f;
            poolFlow.padding = new RectOffset(0, 0, 8, 0);
            for (int i = 0; i < drill.chunks.Length; i++)
            {
                if (placed.Contains(i)) continue;
                int captured = i;
                ChunkButton(pool, drill.chunks[i].ko, drill.chunks[i].en, () => Place(captured));
            }
        }

        void Place(int index)
        {
            if (finished || !gate.TryConsume(GameAction.Interact, Time.unscaledTimeAsDouble, Time.frameCount)) return;
            if (!placed.Contains(index)) placed.Add(index);
            PlaySfx("tap");
            RebuildAssembly();
        }

        void Unplace(int index)
        {
            if (finished || !gate.TryConsume(GameAction.Interact, Time.unscaledTimeAsDouble, Time.frameCount)) return;
            placed.Remove(index);
            RebuildAssembly();
        }

        void CheckAssembly()
        {
            if (finished || placed.Count == 0) return;
            if (!Accept()) return;
            var fb = DrillEvaluator.EvaluateAssembly(drill, placed);
            if (fb.verdict == Verdict.Correct)
            {
                outcome.producedMarkup = fb.producedMarkup;
                ShowFeedback(Verdict.Correct, false, "", "");
                Finish();
                return;
            }
            wrong++;
            failedChecks++;
            ShowFeedback(fb.verdict, fb.almost, fb.ko, fb.en);
            if (failedChecks >= RevealAfter)
            {
                AddLine(feedback, "", db.UiKo("fb_reveal"), db.UiEn("fb_reveal"), Theme.SmallSize + 2, Theme.Ink);
                AddLine(feedback, "", drill.answers[0], drill.promptEn, Theme.BodySize - 2, Theme.Accent);
                Finish();
            }
        }

        // ------------------------------------------------------------ guided production

        int pickA = -1, pickB = -1;
        readonly List<Button> slotButtonsA = new List<Button>();
        readonly List<Button> slotButtonsB = new List<Button>();
        KoreanTextView preview;

        void BuildProduction()
        {
            failedChecks = 0;
            slotButtonsA.Clear();
            slotButtonsB.Clear();
            var rowA = UIFactory.Rect("SlotsA", body);
            var flowA = rowA.gameObject.AddComponent<FlowLayoutGroup>();
            flowA.spacingX = flowA.spacingY = 10f;
            for (int i = 0; i < drill.slotsA.Length; i++)
            {
                int index = i;
                slotButtonsA.Add(ChunkButton(rowA, drill.slotsA[i].ko, drill.slotsA[i].en, () => Pick(true, index)));
            }
            var rowB = UIFactory.Rect("SlotsB", body);
            var flowB = rowB.gameObject.AddComponent<FlowLayoutGroup>();
            flowB.spacingX = flowB.spacingY = 10f;
            for (int i = 0; i < drill.slotsB.Length; i++)
            {
                int index = i;
                slotButtonsB.Add(ChunkButton(rowB, drill.slotsB[i].ko, drill.slotsB[i].en, () => Pick(false, index)));
            }
            preview = KoreanTextView.Create("Preview", body, theme, tooltips);
            UIFactory.Layout(preview.gameObject, minHeight: 44f);

            var check = UIFactory.Button("Check", frame.Footer, theme, db.UiKo("check"), null, CheckProduction, filled: true);
            UIFactory.Layout(check.gameObject, minHeight: theme.TouchMin, preferredWidth: 160f);
        }

        void Pick(bool first, int index)
        {
            if (finished || !gate.TryConsume(GameAction.Interact, Time.unscaledTimeAsDouble, Time.frameCount)) return;
            if (first) pickA = index; else pickB = index;
            for (int i = 0; i < slotButtonsA.Count; i++) Mark(slotButtonsA[i], i == pickA ? "selected" : "normal");
            for (int i = 0; i < slotButtonsB.Count; i++) Mark(slotButtonsB[i], i == pickB ? "selected" : "normal");
            string a = pickA >= 0 ? drill.slotsA[pickA].ko : "…";
            string b = pickB >= 0 ? drill.slotsB[pickB].ko : "…";
            preview.SetLine(KoreanMarkup.BuildLine(drill.id, "me", a + " " + b, ""), theme.Body, Theme.BodySize, Theme.Accent);
            PlaySfx("tap");
        }

        void CheckProduction()
        {
            if (finished || pickA < 0 || pickB < 0) return;
            if (!Accept()) return;
            var fb = DrillEvaluator.EvaluateProduction(drill, pickA, pickB);
            if (fb.verdict == Verdict.Correct)
            {
                outcome.producedMarkup = fb.producedMarkup;
                outcome.producedEnglish = fb.producedEnglish;
                outcome.effects = fb.effects;
                ShowFeedback(Verdict.Correct, false, fb.ko, fb.en);
                Finish();
                return;
            }
            wrong++;
            failedChecks++;
            ShowFeedback(fb.verdict, false, fb.ko, fb.en);
            if (failedChecks >= RevealAfter)
            {
                foreach (var p in drill.pairs)
                {
                    if (p.verdict != "natural") continue;
                    var nat = DrillEvaluator.EvaluateProduction(drill, p.a, p.b);
                    outcome.producedMarkup = nat.producedMarkup;
                    outcome.producedEnglish = nat.producedEnglish;
                    outcome.effects = nat.effects;
                    AddLine(feedback, "", db.UiKo("fb_reveal"), db.UiEn("fb_reveal"), Theme.SmallSize + 2, Theme.Ink);
                    AddLine(feedback, "", nat.producedMarkup, nat.producedEnglish, Theme.BodySize - 2, Theme.Accent);
                    break;
                }
                Finish();
            }
        }

        // ------------------------------------------------------------ matching

        int matchLeft = -1, matchRight = -1, matched;
        readonly List<Button> leftButtons = new List<Button>();
        readonly List<Button> rightButtons = new List<Button>();
        int[] rightOrder = new int[0];

        void BuildMatch()
        {
            matchLeft = matchRight = -1;
            matched = 0;
            leftButtons.Clear();
            rightButtons.Clear();
            var row = UIFactory.Rect("Columns", body);
            var h = UIFactory.Horizontal(row.gameObject, 16f);
            h.childForceExpandWidth = true;
            h.childAlignment = TextAnchor.UpperLeft;
            var left = UIFactory.Rect("Left", row);
            UIFactory.Vertical(left.gameObject, 10f);
            UIFactory.Layout(left.gameObject, flexibleWidth: 1f);
            var right = UIFactory.Rect("Right", row);
            UIFactory.Vertical(right.gameObject, 10f);
            UIFactory.Layout(right.gameObject, flexibleWidth: 1f);

            // Deterministic shuffle so the layout doesn't change between visits.
            int n = drill.matchPairs.Length;
            rightOrder = new int[n];
            for (int i = 0; i < n; i++) rightOrder[i] = i;
            var rng = new System.Random(drill.id.GetHashCode() & 0x7fffffff);
            for (int i = n - 1; i > 0; i--)
            {
                int j = rng.Next(i + 1);
                (rightOrder[i], rightOrder[j]) = (rightOrder[j], rightOrder[i]);
            }
            if (n > 1 && IsIdentity(rightOrder)) (rightOrder[0], rightOrder[1]) = (rightOrder[1], rightOrder[0]);

            for (int i = 0; i < n; i++)
            {
                int index = i;
                leftButtons.Add(ChunkButton(left, drill.matchPairs[i].ko, drill.matchPairs[i].en, () => PickMatch(true, index), Theme.SmallSize + 4));
            }
            for (int i = 0; i < n; i++)
            {
                int original = rightOrder[i];
                rightButtons.Add(EnglishButton(right, drill.matchPairs[original].en, () => PickMatch(false, original)));
            }
        }

        static bool IsIdentity(int[] order)
        {
            for (int i = 0; i < order.Length; i++) if (order[i] != i) return false;
            return true;
        }

        Button RightButtonFor(int original) => rightButtons[Array.IndexOf(rightOrder, original)];

        void PickMatch(bool isLeft, int index)
        {
            if (finished || !gate.TryConsume(GameAction.Interact, Time.unscaledTimeAsDouble, Time.frameCount)) return;
            if (isLeft) matchLeft = index; else matchRight = index;
            for (int i = 0; i < leftButtons.Count; i++) if (leftButtons[i].interactable) Mark(leftButtons[i], i == matchLeft ? "selected" : "normal");
            for (int i = 0; i < rightOrder.Length; i++) if (rightButtons[i].interactable) Mark(rightButtons[i], rightOrder[i] == matchRight ? "selected" : "normal");
            if (matchLeft < 0 || matchRight < 0) return;

            if (DrillEvaluator.EvaluateMatch(matchLeft, matchRight))
            {
                Mark(leftButtons[matchLeft], "correct");
                Mark(RightButtonFor(matchRight), "correct");
                matched++;
                PlaySfx("pencil");
                UIFactory.DestroyChildren(feedback);
            }
            else
            {
                wrong++;
                Mark(leftButtons[matchLeft], "normal");
                Mark(RightButtonFor(matchRight), "normal");
                ShowFeedback(Verdict.Incorrect, false, "", "");
            }
            matchLeft = matchRight = -1;
            if (matched == drill.matchPairs.Length)
            {
                ShowFeedback(Verdict.Correct, false, "", "");
                Finish();
            }
        }
    }
}
