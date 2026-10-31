using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using DrivingSim.Controls;
using DrivingSim.Core;
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
            RectTransform dim = UIBuild.Rect("Wizard", safe, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, Vector2.zero);
            UIBuild.Stretch(dim);
            UIBuild.Panel(dim, null, new Color(0f, 0f, 0f, 0.6f), raycast: true);
            root = dim.gameObject;

            RectTransform card = UIBuild.Rect("Card", dim, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(1280f, 900f));
            UIBuild.Panel(card, theme.RoundedPanel, theme.panelStrong);

            titleText = Block("Title", card, 30f, 64f, font, 44, theme.text);
            titleText.fontStyle = FontStyle.Bold;
            bodyText = Block("Body", card, 100f, 96f, font, 28, theme.text);
            progressText = Block("Progress", card, 196f, 60f, font, 46, theme.accentBlue);

            RectTransform indicators = UIBuild.Rect("Indicators", card, new Vector2(0.5f, 1f), new Vector2(0.5f, 1f), new Vector2(0f, -262f), new Vector2(1180f, 130f));
            indicatorGroup = indicators.gameObject;
            brakeIndicator = Indicator("Brake", indicators, -300f, "브레이크  BRAKE", font);
            acceleratorIndicator = Indicator("Accelerator", indicators, 300f, "가속  ACCELERATOR", font);

            keysText = Block("Keys", card, 400f, 250f, font, 24, theme.text);
            keysText.alignment = TextAnchor.UpperLeft;
            warningText = Block("Warnings", card, 650f, 120f, font, 22, theme.warning);
            warningText.alignment = TextAnchor.UpperLeft;

            float width = 232f, gap = 12f, total = width * 5f + gap * 4f;
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
            RectTransform rect = UIBuild.Rect(name, card, new Vector2(0.5f, 1f), new Vector2(0.5f, 1f), new Vector2(0f, -top), new Vector2(1180f, height));
            return UIBuild.Label("Text", rect, "", font, size, color);
        }

        Image Indicator(string name, RectTransform parent, float x, string label, Font font)
        {
            RectTransform rect = UIBuild.Rect(name, parent, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(x, 0f), new Vector2(560f, 130f));
            Image image = UIBuild.Panel(rect, theme.RoundedPanel, theme.panel);
            Text text = UIBuild.Label("Label", rect, label, font, 40, theme.text);
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
                foreach (HoldButton button in buttons) if (button != null) button.ClearPressedHandlers();
            }
            if (IsOpen) Close();
        }

        void Subscribe()
        {
            if (subscribed) return;
            subscribed = true;
            for (int i = 0; i < buttons.Length; i++)
            {
                int index = i;
                if (buttons[i] != null) buttons[i].Pressed += () => actions[index]?.Invoke();
            }
        }

        void Start()
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
                    titleText.text = "페달 보정";
                    bodyText.text = "바닥에 둔 키보드를 발로 밟아 브레이크와 가속 페달로 사용합니다.\n" +
                                    "뒤꿈치는 바닥에 대고, 체중을 싣지 말고 가볍게 눌러 주세요.";
                    keysText.text = StatusText();
                    SetButtons(("보정 시작", () => StartCapture(Step.CaptureBrake)),
                               (pedals != null && pedals.Mapping != null ? "현재 설정 확인" : null, LoadCurrentMapping),
                               ("기본값으로 초기화", ResetToDefaults),
                               (pedals != null && pedals.PedalsEnabled ? "발 페달 끄기" : "발 페달 켜기", TogglePedals),
                               ("닫기 (Esc)", () => { MarkDone(); Close(); }));
                    break;

                case Step.CaptureBrake:
                case Step.CaptureAccelerator:
                    bool brake = next == Step.CaptureBrake;
                    titleText.text = brake ? "1단계: 브레이크" : "2단계: 가속";
                    bodyText.text = brake
                        ? "브레이크로 쓸 위치에 발을 올리고, 눌렀다 떼기를 " + attemptsPerPedal + "번 하세요."
                        : "가속 페달로 쓸 위치에 발을 올리고, 눌렀다 떼기를 " + attemptsPerPedal + "번 하세요.";
                    SetButtons(("이 단계 다시", () => StartCapture(next, keepOther: true)), ("취소 (Esc)", Close));
                    RefreshCapture();
                    break;

                case Step.Review:
                    titleText.text = "3단계: 키 확인";
                    bodyText.text = "제안된 키를 확인하세요. 양쪽에서 감지된 키는 표시됩니다. 필요하면 직접 편집한 뒤 실제 테스트를 진행하세요.";
                    SetButtons(("브레이크 키 편집", () => Go(Step.EditBrake)),
                               ("가속 키 편집", () => Go(Step.EditAccelerator)),
                               (brakeAnalysis != null ? (includeOccasional ? "1회 감지 키 제외" : "1회 감지 키 포함") : null, ToggleOccasional),
                               ("처음부터 다시", () => StartCapture(Step.CaptureBrake)),
                               ("실제 테스트", StartValidation));
                    RefreshReview();
                    break;

                case Step.EditBrake:
                case Step.EditAccelerator:
                    titleText.text = next == Step.EditBrake ? "브레이크 키 편집" : "가속 키 편집";
                    bodyText.text = "키를 누를 때마다 이 페달에 추가되거나 빠집니다. 다른 페달에 있던 키는 이 페달로 옮겨집니다 (한 키는 한 페달만).";
                    SetButtons(("편집 완료", () => Go(Step.Review)));
                    RefreshReview();
                    break;

                case Step.Validate:
                    titleText.text = "4단계: 실제 테스트";
                    SetButtons(("다시 테스트", StartValidation), ("키 편집", () => Go(Step.Review)), ("저장", Save));
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
                case PedalCalibrationStatus.Validated: status = "검증 완료"; break;
                case PedalCalibrationStatus.Unvalidated: status = "검증 안 됨 (운전에 사용되지 않음)"; break;
                case PedalCalibrationStatus.KeyboardChanged: status = "다른 키보드가 연결됨: 실제 테스트를 다시 하세요"; break;
                default: status = "설정 없음"; break;
            }
            string connection = pedals.Device.IsConnected ? "키보드 연결됨" : "키보드가 감지되지 않음";
            return $"현재 상태: {status}\n{connection} · 발 페달 {(pedals.PedalsEnabled ? "켬" : "끔")}";
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
                warningText.text = "키보드가 감지되지 않습니다. 연결을 확인하세요.";
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
            string current = recorder.IsPressing ? "누르는 중: " + Names(recorder.CurrentKeys) : "발을 완전히 떼고 다시 밟으세요";
            keysText.text = $"{current}\n지금까지 감지된 키 ({seen.Count}): {Names(seen)}";

            var warnings = new List<string>();
            if (recorder.Attempts.Any(a => a.ReleaseMissing.Count > 0))
                warnings.Add("떼는 입력이 보고되지 않은 키가 있습니다 (" + Names(recorder.Attempts.SelectMany(a => a.ReleaseMissing).Distinct()) + "). 키보드 문제일 수 있습니다.");
            if (recorder.Attempts.Any(a => a.KeyDowns.Values.Any(n => n > 1)))
                warnings.Add($"한 번의 누름 안에서 같은 키가 여러 번 눌렸습니다. 누르는 간격이 {releaseGapSeconds:0.00}초보다 짧으면 두 번이 한 번으로 합쳐질 수 있습니다.");
            warningText.text = string.Join("\n", warnings);
        }

        void RefreshReview()
        {
            var text = new StringBuilder();
            text.AppendLine($"브레이크 ({brakeSet.Count}): {Names(brakeSet)}");
            text.AppendLine($"가속 ({acceleratorSet.Count}): {Names(acceleratorSet)}");

            if (brakeAnalysis != null && acceleratorAnalysis != null)
            {
                text.AppendLine();
                text.AppendLine("키 · 브레이크 감지(누름 횟수) · 가속 감지(누름 횟수) · 비고");
                IEnumerable<int> keys = brakeAnalysis.Counts.Keys.Union(acceleratorAnalysis.Counts.Keys)
                    .OrderByDescending(k => Count(brakeAnalysis, k) + Count(acceleratorAnalysis, k)).Take(10);
                foreach (int key in keys)
                {
                    var notes = new List<string>();
                    if (ambiguous.Contains(key)) notes.Add(unresolved.Contains(key) ? "양쪽 감지 → 제외" : "양쪽 감지");
                    if (brakeAnalysis.ReleaseMissing.Contains(key) || acceleratorAnalysis.ReleaseMissing.Contains(key)) notes.Add("떼기 누락");
                    if (brakeSet.Contains(key)) notes.Add("→ 브레이크");
                    else if (acceleratorSet.Contains(key)) notes.Add("→ 가속");
                    else notes.Add("미사용");
                    text.AppendLine($"{Names(new[] { key })} · {Cell(brakeAnalysis, key)} · {Cell(acceleratorAnalysis, key)} · {string.Join(", ", notes)}");
                }
            }
            keysText.text = text.ToString();

            var warnings = new List<string>();
            if (unresolved.Count > 0) warnings.Add($"양쪽에서 비슷하게 감지되어 어느 페달에도 넣지 않은 키: {Names(unresolved)}");
            if ((brakeAnalysis?.PossibleRolloverLimit ?? false) || (acceleratorAnalysis?.PossibleRolloverLimit ?? false))
                warnings.Add("동시에 누른 키 중 일부가 보고되지 않는 키보드일 수 있습니다 (롤오버/고스팅). 한 키만 감지돼도 페달이 동작하도록 설계되어 있습니다.");
            if ((brakeAnalysis?.AttemptsWithRepeatedKeys ?? 0) + (acceleratorAnalysis?.AttemptsWithRepeatedKeys ?? 0) > 0)
                warnings.Add("일부 누름이 합쳐졌거나 키가 떨렸을 수 있습니다.");
            List<int> shortcuts = brakeSet.Concat(acceleratorSet).Where(IsShortcutKey).ToList();
            if (shortcuts.Count > 0) warnings.Add($"페달 사용 중에는 단축키로 동작하지 않는 키: {Names(shortcuts)} (주차 브레이크는 화면의 (P) 버튼)");
            if (brakeSet.Count == 0 || acceleratorSet.Count == 0) warnings.Add("브레이크와 가속 모두 키가 하나 이상 있어야 합니다.");
            warningText.text = string.Join("\n", warnings);
        }

        void RefreshValidation()
        {
            if (validation == null) return;
            switch (validation.Step)
            {
                case PedalValidationStep.PressBrake:
                    bodyText.text = $"브레이크 영역을 {validation.RequiredPresses}번 밟았다 떼세요.";
                    progressText.text = $"브레이크 {validation.CleanBrakePresses}/{validation.RequiredPresses}";
                    break;
                case PedalValidationStep.PressAccelerator:
                    bodyText.text = $"이제 가속 영역을 {validation.RequiredPresses}번 밟았다 떼세요.";
                    progressText.text = $"가속 {validation.CleanAcceleratorPresses}/{validation.RequiredPresses}";
                    break;
                case PedalValidationStep.Passed:
                    bodyText.text = "테스트 통과. 저장하면 다음 실행부터 바로 사용됩니다.";
                    progressText.text = "통과";
                    buttons[2].gameObject.SetActive(true);
                    break;
                case PedalValidationStep.Failed:
                    bodyText.text = "테스트 실패: " + validation.FailureReason;
                    progressText.text = "실패";
                    break;
            }
            warningText.text = $"잘못된 페달 {validation.WrongPedalPresses} · 놓친 입력 {validation.MissedPresses} · 미등록 키가 섞인 입력 {validation.PressesWithUnmappedKeys}";
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
                string conflict = brakeDown && acceleratorDown ? "\n충돌: 둘 다 눌림 → 브레이크 우선, 가속 차단" : "";
                keysText.text = $"브레이크 키: {Names(activeBrake)}\n가속 키: {Names(activeAccelerator)}\n미등록 키: {Names(scratch)}{conflict}";
            }
        }

        static bool IsExcluded(Key key) =>
            key == Key.None || key == Key.Escape || key == Key.LeftMeta || key == Key.RightMeta || key == Key.ContextMenu || key == Key.PrintScreen;

        static bool IsShortcutKey(int code) => Array.IndexOf(ShortcutKeyNames, ((Key)code).ToString()) >= 0;
#else
        static bool IsShortcutKey(int code) => false;
#endif

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
            return names.Count == 0 ? "없음" : string.Join(", ", names);
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
