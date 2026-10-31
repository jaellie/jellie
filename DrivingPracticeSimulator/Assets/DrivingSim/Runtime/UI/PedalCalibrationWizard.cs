using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using DrivingSim.Controls;
using DrivingSim.Core;
using DrivingSim.Localization;
using DrivingSim.Startup;
using UnityEngine;
using UnityEngine.UI;
#if ENABLE_INPUT_SYSTEM
using UnityEngine.InputSystem;
using UnityEngine.InputSystem.Controls;
#endif

namespace DrivingSim.UI
{
    /// <summary>
    /// "페달 보정" (Pedal Calibration): 5 brake presses → 5 accelerator presses → per-key review with
    /// ambiguous keys flagged and manual editing → guided live validation → save.
    /// A mapping is saved as validated only after the live test passes. While open, driving input is
    /// blocked (brake held) and keyboard shortcuts are disabled. Esc closes without saving.
    /// </summary>
    public class PedalCalibrationWizard : MonoBehaviour
    {
        const string DonePrefsKey = "DrivingSim.PedalWizardDone";

        enum Step { Hidden, Intro, CaptureBrake, CaptureAccelerator, Review, EditBrake, EditAccelerator, Validate }

        [SerializeField] PedalInputManager pedals;
        [SerializeField] HudTheme theme;
        public bool openOnFirstRun = true;

        [Header("Calibration")]
        [Range(1, 10)] public int attemptsPerPedal = 5;
        [Tooltip("A key must appear in at least this many of the attempts to be proposed.")]
        [Range(1, 5)] public int minOccurrences = 2;
        [Tooltip("Grouping interval: all keys must stay released this long to end one press.")]
        [Range(0.05f, 0.6f)] public float releaseGapSeconds = 0.2f;
        [Tooltip("A key reported held longer than this during calibration counts as a missed release.")]
        [Range(1f, 10f)] public float stuckKeySeconds = 3f;
        [Tooltip("A key proposed for both pedals stays with one only if it appeared there this many more times.")]
        [Range(1, 5)] public int dominanceMargin = 2;

        [Header("Validation")]
        [Range(1, 10)] public int validationPresses = 3;
        [Range(0, 5)] public int maxMissedPresses = 1;

        [SerializeField] GameObject root;
        [SerializeField] Text titleText;
        [SerializeField] Text bodyText;
        [SerializeField] Text progressText;
        [SerializeField] Text keysText;
        [SerializeField] Text warningText;
        [SerializeField] GameObject indicatorGroup;
        [SerializeField] Image brakeIndicator;
        [SerializeField] Image acceleratorIndicator;
        [SerializeField] HoldButton[] buttons = new HoldButton[5];
        [SerializeField] Text[] buttonLabels = new Text[5];

        readonly Action[] actions = new Action[5];
        Step step = Step.Hidden;
        PedalAttemptRecorder recorder;
        PedalKeyAnalysis brakeAnalysis;
        PedalKeyAnalysis acceleratorAnalysis;
        List<int> ambiguous = new List<int>();
        List<int> unresolved = new List<int>();
        readonly HashSet<int> brakeSet = new HashSet<int>();
        readonly HashSet<int> acceleratorSet = new HashSet<int>();
        readonly List<int> scratch = new List<int>();
        PedalValidationSession validation;
        string mappingSource = "calibration";
        bool includeOccasional;
        bool subscribed;

        public bool IsOpen => step != Step.Hidden;

        static readonly string[] ShortcutKeyNames =
        {
            "W", "A", "S", "D", "UpArrow", "DownArrow", "LeftArrow", "RightArrow", "Space", "Backspace",
            "Digit1", "Digit2", "Digit3", "Digit4", "Q", "E", "C", "V", "T", "Z", "X", "LeftBracket", "RightBracket",
            "Comma", "Period", "H", "L", "K", "F1", "LeftShift",
        };

        public static PedalCalibrationWizard Create(PedalInputManager pedals, HudTheme theme)
        {
            theme = theme != null ? theme : HudTheme.Default;
            Transform safe = DrivingHUDController.CreateCanvas("PedalCalibrationCanvas", 50);
            var wizard = safe.root.gameObject.AddComponent<PedalCalibrationWizard>();
            wizard.pedals = pedals;
            wizard.theme = theme;
            wizard.Build(safe);
            if (Application.isPlaying && wizard.isActiveAndEnabled) wizard.Subscribe();
            return wizard;
        }

        // ------------------------------------------------------------------ UI construction

        void Build(Transform safe)
        {
            Font font = theme.Font;
            root = AutomotiveLayout.Modal(safe, theme, new Vector2(1400f, 960f), out RectTransform card);

            titleText = Block("Title", card, 30f, 64f, font, 44, theme.text);
            titleText.fontStyle = FontStyle.Bold;
            bodyText = Block("Body", card, 100f, 96f, font, 28, theme.text);
            progressText = Block("Progress", card, 196f, 60f, font, 46, theme.accentBlue);

            RectTransform indicators = UIBuild.Rect("Indicators", card, new Vector2(0.5f, 1f), new Vector2(0.5f, 1f), new Vector2(0f, -262f), new Vector2(1180f, 130f));
            indicatorGroup = indicators.gameObject;
            brakeIndicator = Indicator("Brake", indicators, -300f, "wizard.indicator.brake", font);
            acceleratorIndicator = Indicator("Accelerator", indicators, 300f, "wizard.indicator.accelerator", font);

            keysText = AutomotiveLayout.ScrollBlock("Keys", card, 400f, 300f, 24, theme.text, theme);
            keysText.alignment = TextAnchor.UpperLeft;
            warningText = AutomotiveLayout.ScrollBlock("Warnings", card, 706f, 120f, 22, theme.warning, theme);
            warningText.alignment = TextAnchor.UpperLeft;

            float width = 252f, gap = 12f, total = width * 5f + gap * 4f;
            for (int i = 0; i < buttons.Length; i++)
            {
                float x = -total * 0.5f + width * 0.5f + i * (width + gap);
                buttons[i] = UIBuild.Button($"Button_{i}", card, new Vector2(0.5f, 0f), new Vector2(0.5f, 0f), new Vector2(x, 30f),
                    new Vector2(width, 84f), "", theme, 25, out buttonLabels[i]);
            }
            root.SetActive(false);
        }

        Text Block(string name, RectTransform card, float top, float height, Font font, int size, Color color)
        {
            RectTransform rect = UIBuild.Rect(name, card, new Vector2(0.5f, 1f), new Vector2(0.5f, 1f), new Vector2(0f, -top), new Vector2(1280f, height));
            return UIBuild.Label("Text", rect, "", font, size, color);
        }

        Image Indicator(string name, RectTransform parent, float x, string labelKey, Font font)
        {
            RectTransform rect = UIBuild.Rect(name, parent, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(x, 0f), new Vector2(560f, 130f));
            Image image = UIBuild.Panel(rect, theme.RoundedPanel, theme.panel);
            Text text = UIBuild.Label("Label", rect, Loc.T(labelKey), font, 40, theme.text);
            text.gameObject.AddComponent<LocalizedText>().Key = labelKey;
            text.fontStyle = FontStyle.Bold;
            return image;
        }

        // ------------------------------------------------------------------ lifecycle

        void OnEnable() => Subscribe();

        void OnDisable()
        {
            if (subscribed)
            {
                subscribed = false;
                LocalizationService.LanguageChanged -= OnLanguageChanged;
                foreach (HoldButton button in buttons) if (button != null) button.ClearPressedHandlers();
            }
            if (IsOpen) Close();
        }

        void OnLanguageChanged(Language _)
        {
            if (IsOpen) Go(step);
        }

        void Subscribe()
        {
            if (subscribed) return;
            subscribed = true;
            LocalizationService.LanguageChanged += OnLanguageChanged;
            for (int i = 0; i < buttons.Length; i++)
            {
                int index = i;
                if (buttons[i] != null) buttons[i].Pressed += () => actions[index]?.Invoke();
            }
        }

        void Start()
        {
            // Never open on top of the first-launch language/notice screens; wait until they are done.
            var startup = FindFirstObjectByType<StartupFlow>();
            if (startup != null && !startup.GameplayAllowed && !StartupFlow.SuppressForAutomatedTests)
            {
                startup.GameplayAllowedChanged += OpenIfFirstRun;
                return;
            }
            OpenIfFirstRun();
        }

        void OpenIfFirstRun()
        {
            bool done = false;
            try { done = PlayerPrefs.GetInt(DonePrefsKey, 0) == 1; } catch (Exception) { /* default */ }
            bool keyboardPresent = pedals != null && pedals.Device.IsConnected;
            if (openOnFirstRun && !done && keyboardPresent && pedals.CalibrationStatus == PedalCalibrationStatus.NotCalibrated) Open();
        }

        public void Open()
        {
#if ENABLE_INPUT_SYSTEM
            DrivingInputGate.BlockDriving(this, blockKeyboardShortcuts: true);
            root.SetActive(true);
            Go(Step.Intro);
#else
            Debug.LogWarning("[PedalCalibration] Foot pedals require the Input System package (Active Input Handling).");
#endif
        }

        public void Close()
        {
            step = Step.Hidden;
            if (root != null) root.SetActive(false);
            DrivingInputGate.Release(this);
        }

        void MarkDone()
        {
            try { PlayerPrefs.SetInt(DonePrefsKey, 1); } catch (Exception) { /* not persisted */ }
        }

        // ------------------------------------------------------------------ steps

        void Go(Step next)
        {
            step = next;
            for (int i = 0; i < actions.Length; i++) actions[i] = null;
            warningText.text = "";
            progressText.text = "";
            keysText.text = "";
            indicatorGroup.SetActive(next == Step.Validate || next == Step.EditBrake || next == Step.EditAccelerator);

            switch (next)
            {
                case Step.Intro:
                    titleText.text = Loc.T("wizard.intro.title");
                    bodyText.text = Loc.T("wizard.intro.body");
                    keysText.text = StatusText();
                    SetButtons((Loc.T("wizard.intro.start"), () => StartCapture(Step.CaptureBrake)),
                               (pedals != null && pedals.Mapping != null ? Loc.T("wizard.intro.review") : null, LoadCurrentMapping),
                               (Loc.T("wizard.intro.reset"), ResetToDefaults),
                               (Loc.T(pedals != null && pedals.PedalsEnabled ? "wizard.intro.pedalsOff" : "wizard.intro.pedalsOn"), TogglePedals),
                               (Loc.T("wizard.intro.close"), () => { MarkDone(); Close(); }));
                    break;

                case Step.CaptureBrake:
                case Step.CaptureAccelerator:
                    bool brake = next == Step.CaptureBrake;
                    titleText.text = Loc.T(brake ? "wizard.capture.brake.title" : "wizard.capture.accelerator.title");
                    bodyText.text = Loc.T(brake ? "wizard.capture.brake.body" : "wizard.capture.accelerator.body", attemptsPerPedal);
                    SetButtons((Loc.T("wizard.capture.redo"), () => StartCapture(next, keepOther: true)), (Loc.T("wizard.capture.cancel"), Close));
                    RefreshCapture();
                    break;

                case Step.Review:
                    titleText.text = Loc.T("wizard.review.title");
                    bodyText.text = Loc.T("wizard.review.body");
                    SetButtons((Loc.T("wizard.review.editBrake"), () => Go(Step.EditBrake)),
                               (Loc.T("wizard.review.editAccelerator"), () => Go(Step.EditAccelerator)),
                               (brakeAnalysis != null ? Loc.T(includeOccasional ? "wizard.review.excludeOccasional" : "wizard.review.includeOccasional") : null, ToggleOccasional),
                               (Loc.T("wizard.review.restart"), () => StartCapture(Step.CaptureBrake)),
                               (Loc.T("wizard.review.test"), StartValidation));
                    RefreshReview();
                    break;

                case Step.EditBrake:
                case Step.EditAccelerator:
                    titleText.text = Loc.T(next == Step.EditBrake ? "wizard.edit.brake.title" : "wizard.edit.accelerator.title");
                    bodyText.text = Loc.T("wizard.edit.body");
                    SetButtons((Loc.T("wizard.edit.done"), () => Go(Step.Review)));
                    RefreshReview();
                    break;

                case Step.Validate:
                    titleText.text = Loc.T("wizard.validate.title");
                    SetButtons((Loc.T("wizard.validate.retry"), StartValidation), (Loc.T("wizard.validate.edit"), () => Go(Step.Review)), (Loc.T("wizard.validate.save"), Save));
                    buttons[2].gameObject.SetActive(false); // shown only after passing
                    RefreshValidation();
                    break;
            }
        }

        void SetButtons(params (string label, Action action)[] entries)
        {
            for (int i = 0; i < buttons.Length; i++)
            {
                bool used = i < entries.Length && entries[i].action != null && !string.IsNullOrEmpty(entries[i].label);
                buttons[i].gameObject.SetActive(used);
                if (!used) continue;
                buttonLabels[i].text = entries[i].label;
                actions[i] = entries[i].action;
            }
        }

        string StatusText()
        {
            if (pedals == null) return "";
            string status;
            switch (pedals.CalibrationStatus)
            {
                case PedalCalibrationStatus.Validated: status = Loc.T("wizard.status.validated"); break;
                case PedalCalibrationStatus.Unvalidated: status = Loc.T("wizard.status.unvalidated"); break;
                case PedalCalibrationStatus.KeyboardChanged: status = Loc.T("wizard.status.keyboardChanged"); break;
                default: status = Loc.T("wizard.status.none"); break;
            }
            string connection = Loc.T(pedals.Device.IsConnected ? "wizard.status.keyboardConnected" : "wizard.status.keyboardMissing");
            return Loc.T("wizard.status.line", status, connection, Loc.T(pedals.PedalsEnabled ? "wizard.status.on" : "wizard.status.off"));
        }

        void LoadCurrentMapping()
        {
            if (pedals?.Mapping == null) return;
            LoadSets(pedals.Mapping, pedals.Mapping.source);
            Go(Step.Review);
        }

        void ResetToDefaults()
        {
            if (pedals == null) return;
            pedals.ResetToDefaults();
            LoadSets(pedals.Mapping, "default");
            Go(Step.Review);
        }

        void TogglePedals()
        {
            if (pedals == null) return;
            pedals.PedalsEnabled = !pedals.PedalsEnabled;
            Go(Step.Intro);
        }

        void LoadSets(PedalKeyMapping mapping, string source)
        {
            brakeAnalysis = acceleratorAnalysis = null;
            ambiguous = new List<int>();
            unresolved = new List<int>();
            brakeSet.Clear();
            acceleratorSet.Clear();
#if ENABLE_INPUT_SYSTEM
            foreach (Key key in PedalKeyMapping.Parse(mapping.brakeKeys)) brakeSet.Add((int)key);
            foreach (Key key in PedalKeyMapping.Parse(mapping.acceleratorKeys)) if (!brakeSet.Contains((int)key)) acceleratorSet.Add((int)key);
#endif
            mappingSource = source;
        }

        void StartCapture(Step captureStep, bool keepOther = false)
        {
            recorder = new PedalAttemptRecorder(attemptsPerPedal, releaseGapSeconds, stuckKeySeconds);
            if (!keepOther)
            {
                brakeAnalysis = null;
                acceleratorAnalysis = null;
            }
            else if (captureStep == Step.CaptureAccelerator) acceleratorAnalysis = null;
            else brakeAnalysis = null;
            mappingSource = "calibration";
            Go(captureStep);
        }

        void StartValidation()
        {
            validation = new PedalValidationSession(validationPresses, maxMissedPresses);
            Go(Step.Validate);
        }

        // ------------------------------------------------------------------ per-frame

        void Update()
        {
#if ENABLE_INPUT_SYSTEM
            if (!IsOpen) return;
            Keyboard keyboard = Keyboard.current;
            if (keyboard == null)
            {
                warningText.text = Loc.T("wizard.noKeyboard");
                return;
            }
            if (keyboard.escapeKey.wasPressedThisFrame) { Close(); return; }

            float now = Time.unscaledTime;
            switch (step)
            {
                case Step.CaptureBrake:
                case Step.CaptureAccelerator:
                    foreach (KeyControl key in keyboard.allKeys)
                    {
                        if (key == null || IsExcluded(key.keyCode)) continue;
                        if (key.wasPressedThisFrame) recorder.KeyDown((int)key.keyCode, now);
                        if (key.wasReleasedThisFrame) recorder.KeyUp((int)key.keyCode, now);
                    }
                    if (recorder.Update(now)) OnAttemptCompleted();
                    else RefreshCapture();
                    break;

                case Step.EditBrake:
                case Step.EditAccelerator:
                    foreach (KeyControl key in keyboard.allKeys)
                    {
                        if (key == null || IsExcluded(key.keyCode) || !key.wasPressedThisFrame) continue;
                        int code = (int)key.keyCode;
                        HashSet<int> target = step == Step.EditBrake ? brakeSet : acceleratorSet;
                        HashSet<int> other = step == Step.EditBrake ? acceleratorSet : brakeSet;
                        if (!target.Remove(code)) { target.Add(code); other.Remove(code); }
                        mappingSource = "manual";
                    }
                    RefreshReview();
                    UpdateIndicators(keyboard, out _, out _, out _);
                    break;

                case Step.Validate:
                    UpdateIndicators(keyboard, out bool b, out bool a, out bool unmapped);
                    validation.Update(b, a, unmapped);
                    RefreshValidation();
                    break;
            }
#endif
        }

        void OnAttemptCompleted()
        {
            RefreshCapture();
            if (!recorder.IsComplete) return;

            PedalKeyAnalysis analysis = PedalCalibrationAnalyzer.Analyze(recorder.Attempts, minOccurrences);
            if (step == Step.CaptureBrake)
            {
                brakeAnalysis = analysis;
                if (acceleratorAnalysis == null) { StartCapture(Step.CaptureAccelerator, keepOther: true); return; }
            }
            else
            {
                acceleratorAnalysis = analysis;
                if (brakeAnalysis == null) { StartCapture(Step.CaptureBrake, keepOther: true); return; }
            }
            RebuildSets();
            Go(Step.Review);
        }

        void RebuildSets()
        {
            brakeSet.Clear();
            acceleratorSet.Clear();
            if (brakeAnalysis == null || acceleratorAnalysis == null) return;

            // Work on copies so toggling "include occasional" can be recomputed from the raw analysis.
            PedalKeyAnalysis b = Copy(brakeAnalysis), a = Copy(acceleratorAnalysis);
            ambiguous = PedalCalibrationAnalyzer.AmbiguousKeys(b, a);
            unresolved = PedalCalibrationAnalyzer.ResolveConflicts(b, a, dominanceMargin);
            foreach (int k in b.Selected) brakeSet.Add(k);
            foreach (int k in a.Selected) acceleratorSet.Add(k);
            if (includeOccasional)
            {
                // One-off keys are added only when they were never seen for the other pedal.
                foreach (int k in b.Occasional) if (!ambiguous.Contains(k)) brakeSet.Add(k);
                foreach (int k in a.Occasional) if (!ambiguous.Contains(k)) acceleratorSet.Add(k);
            }
        }

        static PedalKeyAnalysis Copy(PedalKeyAnalysis source)
        {
            var copy = new PedalKeyAnalysis { AttemptCount = source.AttemptCount, MaxSimultaneous = source.MaxSimultaneous, PossibleRolloverLimit = source.PossibleRolloverLimit };
            copy.Selected.AddRange(source.Selected);
            copy.Occasional.AddRange(source.Occasional);
            foreach (KeyValuePair<int, int> pair in source.Counts) copy.Counts[pair.Key] = pair.Value;
            return copy;
        }

        void ToggleOccasional()
        {
            includeOccasional = !includeOccasional;
            RebuildSets();
            Go(Step.Review);
        }

        // ------------------------------------------------------------------ text

        void RefreshCapture()
        {
            if (recorder == null) return;
            var dots = new StringBuilder();
            for (int i = 0; i < recorder.RequiredAttempts; i++) dots.Append(i < recorder.Attempts.Count ? "● " : "○ ");
            progressText.text = dots.ToString().TrimEnd();

            var seen = new HashSet<int>();
            foreach (PedalAttempt attempt in recorder.Attempts) seen.UnionWith(attempt.Keys);
            string current = recorder.IsPressing ? Loc.T("wizard.capture.pressing", Names(recorder.CurrentKeys)) : Loc.T("wizard.capture.liftFoot");
            keysText.text = current + "\n" + Loc.T("wizard.capture.seen", seen.Count, Names(seen));

            var warnings = new List<string>();
            if (recorder.Attempts.Any(a => a.ReleaseMissing.Count > 0))
                warnings.Add(Loc.T("wizard.capture.warn.releaseMissing", Names(recorder.Attempts.SelectMany(a => a.ReleaseMissing).Distinct())));
            if (recorder.Attempts.Any(a => a.KeyDowns.Values.Any(n => n > 1)))
                warnings.Add(Loc.T("wizard.capture.warn.merged", releaseGapSeconds));
            warningText.text = string.Join("\n", warnings);
        }

        void RefreshReview()
        {
            var text = new StringBuilder();
            text.AppendLine(Loc.T("wizard.review.brakeKeys", brakeSet.Count, Names(brakeSet)));
            text.AppendLine(Loc.T("wizard.review.acceleratorKeys", acceleratorSet.Count, Names(acceleratorSet)));

            if (brakeAnalysis != null && acceleratorAnalysis != null)
            {
                text.AppendLine();
                text.AppendLine(Loc.T("wizard.review.tableHeader"));
                IEnumerable<int> keys = brakeAnalysis.Counts.Keys.Union(acceleratorAnalysis.Counts.Keys)
                    .OrderByDescending(k => Count(brakeAnalysis, k) + Count(acceleratorAnalysis, k)).Take(10);
                foreach (int key in keys)
                {
                    var notes = new List<string>();
                    if (ambiguous.Contains(key)) notes.Add(Loc.T(unresolved.Contains(key) ? "wizard.review.note.ambiguousExcluded" : "wizard.review.note.ambiguous"));
                    if (brakeAnalysis.ReleaseMissing.Contains(key) || acceleratorAnalysis.ReleaseMissing.Contains(key)) notes.Add(Loc.T("wizard.review.note.releaseMissing"));
                    if (brakeSet.Contains(key)) notes.Add(Loc.T("wizard.review.note.toBrake"));
                    else if (acceleratorSet.Contains(key)) notes.Add(Loc.T("wizard.review.note.toAccelerator"));
                    else notes.Add(Loc.T("wizard.review.note.unused"));
                    text.AppendLine($"{Names(new[] { key })} · {Cell(brakeAnalysis, key)} · {Cell(acceleratorAnalysis, key)} · {string.Join(", ", notes)}");
                }
            }
            keysText.text = text.ToString();

            var warnings = new List<string>();
            if (unresolved.Count > 0) warnings.Add(Loc.T("wizard.review.warn.unresolved", Names(unresolved)));
            if ((brakeAnalysis?.PossibleRolloverLimit ?? false) || (acceleratorAnalysis?.PossibleRolloverLimit ?? false))
                warnings.Add(Loc.T("wizard.review.warn.rollover"));
            if ((brakeAnalysis?.AttemptsWithRepeatedKeys ?? 0) + (acceleratorAnalysis?.AttemptsWithRepeatedKeys ?? 0) > 0)
                warnings.Add(Loc.T("wizard.review.warn.merged"));
            List<int> shortcuts = brakeSet.Concat(acceleratorSet).Where(IsShortcutKey).ToList();
            if (shortcuts.Count > 0) warnings.Add(Loc.T("wizard.review.warn.shortcuts", Names(shortcuts)));
            if (brakeSet.Count == 0 || acceleratorSet.Count == 0) warnings.Add(Loc.T("wizard.review.warn.empty"));
            warningText.text = string.Join("\n", warnings);
        }

        void RefreshValidation()
        {
            if (validation == null) return;
            switch (validation.Step)
            {
                case PedalValidationStep.PressBrake:
                    bodyText.text = Loc.T("wizard.validate.pressBrake", validation.RequiredPresses);
                    progressText.text = Loc.T("wizard.validate.progressBrake", validation.CleanBrakePresses, validation.RequiredPresses);
                    break;
                case PedalValidationStep.PressAccelerator:
                    bodyText.text = Loc.T("wizard.validate.pressAccelerator", validation.RequiredPresses);
                    progressText.text = Loc.T("wizard.validate.progressAccelerator", validation.CleanAcceleratorPresses, validation.RequiredPresses);
                    break;
                case PedalValidationStep.Passed:
                    bodyText.text = Loc.T("wizard.validate.passed");
                    progressText.text = Loc.T("wizard.validate.passedShort");
                    buttons[2].gameObject.SetActive(true);
                    break;
                case PedalValidationStep.Failed:
                    bodyText.text = Loc.T("wizard.validate.failed", FailureText(validation.Failure));
                    progressText.text = Loc.T("wizard.validate.failedShort");
                    break;
            }
            warningText.text = Loc.T("wizard.validate.counts", validation.WrongPedalPresses, validation.MissedPresses, validation.PressesWithUnmappedKeys);
        }

#if ENABLE_INPUT_SYSTEM
        void UpdateIndicators(Keyboard keyboard, out bool brakeDown, out bool acceleratorDown, out bool unmappedDown)
        {
            var activeBrake = new List<int>();
            var activeAccelerator = new List<int>();
            scratch.Clear();
            foreach (KeyControl key in keyboard.allKeys)
            {
                if (key == null || !key.isPressed || IsExcluded(key.keyCode)) continue;
                int code = (int)key.keyCode;
                if (brakeSet.Contains(code)) activeBrake.Add(code);
                else if (acceleratorSet.Contains(code)) activeAccelerator.Add(code);
                else scratch.Add(code);
            }
            brakeDown = activeBrake.Count > 0;
            acceleratorDown = activeAccelerator.Count > 0;
            unmappedDown = scratch.Count > 0;

            brakeIndicator.color = brakeDown ? theme.brakeRed : theme.panel;
            // Brake priority, shown the same way the car will treat it.
            acceleratorIndicator.color = acceleratorDown && !brakeDown ? theme.acceleratorGreen : acceleratorDown ? theme.warning : theme.panel;

            if (step == Step.Validate)
            {
                string conflict = brakeDown && acceleratorDown ? Loc.T("wizard.validate.conflict") : "";
                keysText.text = Loc.T("wizard.validate.live", Names(activeBrake), Names(activeAccelerator), Names(scratch)) + conflict;
            }
        }

        static bool IsExcluded(Key key) =>
            key == Key.None || key == Key.Escape || key == Key.LeftMeta || key == Key.RightMeta || key == Key.ContextMenu || key == Key.PrintScreen;

        static bool IsShortcutKey(int code) => Array.IndexOf(ShortcutKeyNames, ((Key)code).ToString()) >= 0;
#else
        static bool IsShortcutKey(int code) => false;
#endif

        static string FailureText(PedalValidationFailure failure)
        {
            switch (failure)
            {
                case PedalValidationFailure.AcceleratorDuringBrakePrompt: return Loc.T("wizard.fail.brakePromptGotAccelerator");
                case PedalValidationFailure.BrakeDuringAcceleratorPrompt: return Loc.T("wizard.fail.acceleratorPromptGotBrake");
                case PedalValidationFailure.TooManyMissedPresses: return Loc.T("wizard.fail.tooManyMissed");
                default: return "";
            }
        }

        static int Count(PedalKeyAnalysis analysis, int key) => analysis.Counts.TryGetValue(key, out int n) ? n : 0;

        static string Cell(PedalKeyAnalysis analysis, int key)
        {
            int n = Count(analysis, key);
            if (n == 0) return "-";
            int downs = analysis.KeyDowns.TryGetValue(key, out int d) ? d : n;
            return $"{n}/{analysis.AttemptCount} ({downs})";
        }

        static string Names(IEnumerable<int> keys)
        {
            var names = keys.Select(KeyboardPedalDevice.DisplayName).ToList();
            return names.Count == 0 ? Loc.T("common.none") : string.Join(", ", names);
        }

        void Save()
        {
            if (validation == null || validation.Step != PedalValidationStep.Passed || pedals == null) return;
#if ENABLE_INPUT_SYSTEM
            var mapping = new PedalKeyMapping
            {
                source = mappingSource,
                brakeKeys = PedalKeyMapping.ToNames(brakeSet),
                acceleratorKeys = PedalKeyMapping.ToNames(acceleratorSet),
            };
            pedals.SetMapping(mapping, validated: true, save: true);
            if (!pedals.PedalsEnabled) pedals.PedalsEnabled = true;
#endif
            MarkDone();
            Close();
        }
    }
}
