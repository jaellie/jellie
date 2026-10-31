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
    /// First-time setup for a floor keyboard used as pedals: five brake presses, five accelerator
    /// presses, then a live test with manual correction. It records key events only (it cannot know
    /// where the foot physically is), proposes keys that recur across presses, resolves keys claimed
    /// by both pedals, warns about likely rollover limits and saves the result. While open, driving
    /// input is blocked (brake held) and keyboard shortcuts are disabled. Esc cancels.
    /// </summary>
    public class PedalCalibrationWizard : MonoBehaviour
    {
        const string DonePrefsKey = "DrivingSim.PedalWizardDone";

        enum Step { Hidden, Intro, CaptureBrake, CaptureAccelerator, Review, EditBrake, EditAccelerator }

        [SerializeField] FootPedalKeyboardInput footPedals;
        [SerializeField] HudTheme theme;
        public bool openOnFirstRun = true;
        [Range(1, 10)] public int attemptsPerPedal = 5;
        [Range(1, 5)] public int minOccurrences = 2;
        [Range(0.05f, 1f)] public float releaseGapSeconds = 0.2f;

        [SerializeField] GameObject root;
        [SerializeField] Text titleText;
        [SerializeField] Text bodyText;
        [SerializeField] Text progressText;
        [SerializeField] Text keysText;
        [SerializeField] Text warningText;
        [SerializeField] GameObject liveGroup;
        [SerializeField] Image liveBrake;
        [SerializeField] Image liveAccelerator;
        [SerializeField] Text liveText;
        [SerializeField] HoldButton[] buttons = new HoldButton[5];
        [SerializeField] Text[] buttonLabels = new Text[5];

        readonly Action[] actions = new Action[5];
        Step step = Step.Hidden;
        PedalAttemptRecorder recorder;
        PedalKeyAnalysis brakeAnalysis;
        PedalKeyAnalysis acceleratorAnalysis;
        List<int> conflicts = new List<int>();
        readonly HashSet<int> brakeSet = new HashSet<int>();
        readonly HashSet<int> acceleratorSet = new HashSet<int>();
        bool includeOccasional;
        bool subscribed;

        public bool IsOpen => step != Step.Hidden;

        static readonly string[] ShortcutKeyNames =
        {
            "W", "A", "S", "D", "UpArrow", "DownArrow", "LeftArrow", "RightArrow", "Space", "Backspace",
            "Digit1", "Digit2", "Digit3", "Digit4", "Q", "E", "C", "V", "T", "Z", "X", "LeftBracket", "RightBracket",
            "Comma", "Period", "H", "L", "K", "F1", "LeftShift",
        };

        public static PedalCalibrationWizard Create(FootPedalKeyboardInput footPedals, HudTheme theme)
        {
            theme = theme != null ? theme : HudTheme.Default;
            Transform safe = DrivingHUDController.CreateCanvas("PedalCalibrationCanvas", 50);
            var wizard = safe.root.gameObject.AddComponent<PedalCalibrationWizard>();
            wizard.footPedals = footPedals;
            wizard.theme = theme;
            wizard.Build(safe);
            if (Application.isPlaying && wizard.isActiveAndEnabled) wizard.Subscribe();
            return wizard;
        }

        void Build(Transform safe)
        {
            Font font = theme.Font;
            RectTransform dim = UIBuild.Rect("Wizard", safe, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, Vector2.zero);
            UIBuild.Stretch(dim);
            UIBuild.Panel(dim, null, new Color(0f, 0f, 0f, 0.6f), raycast: true);
            root = dim.gameObject;

            RectTransform card = UIBuild.Rect("Card", dim, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f), Vector2.zero, new Vector2(1240f, 820f));
            UIBuild.Panel(card, theme.RoundedPanel, theme.panelStrong);

            titleText = Block("Title", card, 40f, 70f, font, 44, theme.text);
            titleText.fontStyle = FontStyle.Bold;
            bodyText = Block("Body", card, 120f, 120f, font, 28, theme.text);
            progressText = Block("Progress", card, 250f, 70f, font, 48, theme.accentBlue);
            keysText = Block("Keys", card, 330f, 150f, font, 26, theme.text);
            warningText = Block("Warnings", card, 490f, 110f, font, 24, theme.warning);

            RectTransform live = UIBuild.Rect("Live", card, new Vector2(0.5f, 1f), new Vector2(0.5f, 1f), new Vector2(0f, -250f), new Vector2(1100f, 80f));
            liveGroup = live.gameObject;
            liveBrake = LiveBar("Brake", live, -25f, "브레이크", theme.brakeRed, font);
            liveAccelerator = LiveBar("Accelerator", live, 15f, "가속", theme.acceleratorGreen, font);
            liveText = UIBuild.Label("LiveText", live, "", font, 24, theme.textMuted, TextAnchor.MiddleRight);

            float width = 224f, gap = 12f, total = width * 5f + gap * 4f;
            for (int i = 0; i < buttons.Length; i++)
            {
                float x = -total * 0.5f + width * 0.5f + i * (width + gap);
                buttons[i] = UIBuild.Button($"Button_{i}", card, new Vector2(0.5f, 0f), new Vector2(0.5f, 0f), new Vector2(x, 36f),
                    new Vector2(width, 84f), "", theme, 26, out buttonLabels[i]);
                buttonLabels[i].horizontalOverflow = HorizontalWrapMode.Wrap;
            }
            root.SetActive(false);
        }

        Text Block(string name, RectTransform card, float top, float height, Font font, int size, Color color)
        {
            RectTransform rect = UIBuild.Rect(name, card, new Vector2(0.5f, 1f), new Vector2(0.5f, 1f), new Vector2(0f, -top), new Vector2(1140f, height));
            return UIBuild.Label("Text", rect, "", font, size, color);
        }

        Image LiveBar(string name, Transform parent, float y, string label, Color color, Font font)
        {
            RectTransform labelRect = UIBuild.Rect(name + "Label", parent, new Vector2(0f, 0.5f), new Vector2(0f, 0.5f), new Vector2(0f, y), new Vector2(140f, 36f));
            UIBuild.Label("Text", labelRect, label, font, 24, theme.text, TextAnchor.MiddleLeft);
            RectTransform back = UIBuild.Rect(name + "Back", parent, new Vector2(0f, 0.5f), new Vector2(0f, 0.5f), new Vector2(150f, y), new Vector2(560f, 22f));
            UIBuild.Panel(back, theme.RoundedPanel, new Color(1f, 1f, 1f, 0.15f));
            RectTransform fillRect = UIBuild.Rect("Fill", back, new Vector2(0f, 0.5f), new Vector2(0f, 0.5f), Vector2.zero, new Vector2(560f, 22f));
            Image fill = UIBuild.Panel(fillRect, theme.RoundedPanel, color);
            fill.type = Image.Type.Filled;
            fill.fillMethod = Image.FillMethod.Horizontal;
            fill.fillAmount = 0f;
            return fill;
        }

        void OnEnable() => Subscribe();

        void OnDisable()
        {
            if (subscribed)
            {
                subscribed = false;
                for (int i = 0; i < buttons.Length; i++)
                    if (buttons[i] != null) buttons[i].ClearPressedHandlers();
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
            try { done = PlayerPrefs.GetInt(DonePrefsKey, 0) == 1; } catch (Exception) { }
            if (openOnFirstRun && !done && FootPedalKeyboardInput.KeyboardConnected && footPedals != null && !footPedals.HasMapping) Open();
        }

        public void Open()
        {
#if ENABLE_INPUT_SYSTEM
            DrivingInputGate.BlockDriving(this, blockKeyboardShortcuts: true);
            root.SetActive(true);
            Go(Step.Intro);
#else
            Debug.LogWarning("[PedalCalibration] The foot-pedal keyboard requires the Input System package (Active Input Handling).");
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
            try { PlayerPrefs.SetInt(DonePrefsKey, 1); } catch (Exception) { }
        }

        void Go(Step next)
        {
            step = next;
            for (int i = 0; i < actions.Length; i++) actions[i] = null;
            warningText.text = "";
            liveGroup.SetActive(next == Step.Review || next == Step.EditBrake || next == Step.EditAccelerator);
            progressText.text = "";
            keysText.text = "";

            switch (next)
            {
                case Step.Intro:
                    titleText.text = "발 페달 키보드 보정";
                    bodyText.text = "바닥에 둔 키보드를 발로 밟아 브레이크와 가속 페달로 사용합니다.\n" +
                                    "가운데 영역 = 브레이크, 오른쪽 영역 = 가속. 각 영역을 발로 " + attemptsPerPedal + "번씩 눌렀다 떼 주세요.";
                    SetButtons(("시작", () => StartCapture(Step.CaptureBrake)),
                               ("건너뛰기", () => { MarkDone(); Close(); }),
                               footPedals != null && footPedals.HasMapping ? ("저장된 설정 삭제", (Action)(() => { footPedals.ClearMapping(); Go(Step.Intro); })) : default);
                    break;

                case Step.CaptureBrake:
                case Step.CaptureAccelerator:
                    bool brake = next == Step.CaptureBrake;
                    titleText.text = brake ? "1단계: 브레이크 영역" : "2단계: 가속 영역";
                    bodyText.text = brake
                        ? "브레이크로 쓸 키보드 가운데 부분을 발로 밟았다가 완전히 떼세요. " + attemptsPerPedal + "회 반복합니다."
                        : "가속 페달로 쓸 키보드 오른쪽 부분을 발로 밟았다가 완전히 떼세요. " + attemptsPerPedal + "회 반복합니다.";
                    SetButtons(("이 단계 다시", () => StartCapture(next)), ("취소 (Esc)", Close));
                    RefreshCapture();
                    break;

                case Step.Review:
                    titleText.text = "3단계: 확인 및 테스트";
                    bodyText.text = "두 영역을 밟아 막대가 올바르게 움직이는지 확인하세요. 둘 다 밟으면 브레이크가 우선합니다.";
                    SetButtons(("브레이크 다시 보정", () => StartCapture(Step.CaptureBrake, keepOther: true)),
                               ("가속 다시 보정", () => StartCapture(Step.CaptureAccelerator, keepOther: true)),
                               ("브레이크 키 편집", () => Go(Step.EditBrake)),
                               ("가속 키 편집", () => Go(Step.EditAccelerator)),
                               ("저장", Save));
                    RefreshReview();
                    break;

                case Step.EditBrake:
                case Step.EditAccelerator:
                    titleText.text = next == Step.EditBrake ? "브레이크 키 편집" : "가속 키 편집";
                    bodyText.text = "키를 누를 때마다 이 페달에 추가되거나 빠집니다. (다른 페달에 있던 키는 옮겨집니다)";
                    SetButtons((includeOccasional ? "1회 감지 키 제외" : "1회 감지 키 포함", ToggleOccasional), ("편집 완료", () => Go(Step.Review)));
                    RefreshReview();
                    break;
            }
        }

        void SetButtons(params (string label, Action action)[] entries)
        {
            for (int i = 0; i < buttons.Length; i++)
            {
                bool used = i < entries.Length && entries[i].action != null;
                buttons[i].gameObject.SetActive(used);
                if (!used) continue;
                buttonLabels[i].text = entries[i].label;
                actions[i] = entries[i].action;
            }
        }

        void StartCapture(Step captureStep, bool keepOther = false)
        {
            recorder = new PedalAttemptRecorder(attemptsPerPedal, releaseGapSeconds);
            if (!keepOther)
            {
                if (captureStep == Step.CaptureBrake) { brakeAnalysis = null; acceleratorAnalysis = null; }
                else acceleratorAnalysis = null;
            }
            Go(captureStep);
        }

        void Update()
        {
#if ENABLE_INPUT_SYSTEM
            if (!IsOpen) return;
            Keyboard keyboard = Keyboard.current;
            if (keyboard == null) return;
            if (keyboard.escapeKey.wasPressedThisFrame) { Close(); return; }

            float now = Time.unscaledTime;
            if (step == Step.CaptureBrake || step == Step.CaptureAccelerator)
            {
                foreach (KeyControl key in keyboard.allKeys)
                {
                    if (key == null || IsExcluded(key.keyCode)) continue;
                    if (key.wasPressedThisFrame) recorder.KeyDown((int)key.keyCode, now);
                    if (key.wasReleasedThisFrame) recorder.KeyUp((int)key.keyCode, now);
                }
                if (recorder.Update(now)) OnAttemptCompleted();
                else RefreshCapture();
            }
            else if (step == Step.EditBrake || step == Step.EditAccelerator)
            {
                foreach (KeyControl key in keyboard.allKeys)
                {
                    if (key == null || IsExcluded(key.keyCode) || !key.wasPressedThisFrame) continue;
                    int code = (int)key.keyCode;
                    HashSet<int> target = step == Step.EditBrake ? brakeSet : acceleratorSet;
                    HashSet<int> other = step == Step.EditBrake ? acceleratorSet : brakeSet;
                    if (!target.Remove(code)) { target.Add(code); other.Remove(code); }
                }
                RefreshReview();
                UpdateLive(keyboard);
            }
            else if (step == Step.Review)
            {
                UpdateLive(keyboard);
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
            }
            RebuildSets();
            Go(Step.Review);
        }

        void RebuildSets()
        {
            brakeSet.Clear();
            acceleratorSet.Clear();
            conflicts = new List<int>();
            if (brakeAnalysis == null || acceleratorAnalysis == null) return;
            conflicts = PedalCalibrationAnalyzer.ResolveConflicts(brakeAnalysis, acceleratorAnalysis);
            foreach (int k in brakeAnalysis.Selected) brakeSet.Add(k);
            foreach (int k in acceleratorAnalysis.Selected) acceleratorSet.Add(k);
            if (includeOccasional)
            {
                foreach (int k in brakeAnalysis.Occasional) if (!acceleratorSet.Contains(k) && !conflicts.Contains(k)) brakeSet.Add(k);
                foreach (int k in acceleratorAnalysis.Occasional) if (!brakeSet.Contains(k) && !conflicts.Contains(k)) acceleratorSet.Add(k);
            }
        }

        void ToggleOccasional()
        {
            includeOccasional = !includeOccasional;
            RebuildSets();
            Go(step);
        }

        void RefreshCapture()
        {
            if (recorder == null) return;
            int done = recorder.Attempts.Count;
            var dots = new StringBuilder();
            for (int i = 0; i < recorder.RequiredAttempts; i++) dots.Append(i < done ? "● " : "○ ");
            progressText.text = dots.ToString().TrimEnd();

            var seen = new HashSet<int>();
            foreach (PedalAttempt attempt in recorder.Attempts) seen.UnionWith(attempt.Keys);
            string current = recorder.IsPressing ? "누르는 중: " + Names(recorder.CurrentKeys) : "발을 떼고 다시 밟으세요";
            keysText.text = $"{current}\n감지된 키 ({seen.Count}): {Names(seen)}";
        }

        void RefreshReview()
        {
            keysText.text = $"브레이크 ({brakeSet.Count}): {Names(brakeSet)}\n가속 ({acceleratorSet.Count}): {Names(acceleratorSet)}";
            var warnings = new List<string>();
            if (conflicts.Count > 0) warnings.Add($"양쪽에 같은 빈도로 눌린 키는 제외됨: {Names(conflicts)}");
            if ((brakeAnalysis != null && brakeAnalysis.PossibleRolloverLimit) || (acceleratorAnalysis != null && acceleratorAnalysis.PossibleRolloverLimit))
                warnings.Add("키보드가 동시에 누른 키를 일부 인식하지 못할 수 있습니다 (롤오버/고스팅). 테스트로 확인하세요.");
            if (brakeAnalysis != null && brakeAnalysis.Occasional.Count > 0 && !includeOccasional)
                warnings.Add($"브레이크 1회 감지 키 (미포함): {Names(brakeAnalysis.Occasional)}");
            if (acceleratorAnalysis != null && acceleratorAnalysis.Occasional.Count > 0 && !includeOccasional)
                warnings.Add($"가속 1회 감지 키 (미포함): {Names(acceleratorAnalysis.Occasional)}");
            List<int> shortcuts = brakeSet.Concat(acceleratorSet).Where(IsShortcutKey).ToList();
            if (shortcuts.Count > 0) warnings.Add($"페달 전용이 되어 단축키로 쓰지 않는 키: {Names(shortcuts)}");
            if (brakeSet.Count == 0 || acceleratorSet.Count == 0) warnings.Add("브레이크와 가속 모두 키가 하나 이상 있어야 저장할 수 있습니다.");
            warningText.text = string.Join("\n", warnings);
        }

#if ENABLE_INPUT_SYSTEM
        void UpdateLive(Keyboard keyboard)
        {
            int brakeDown = 0, acceleratorDown = 0;
            var unmapped = new List<int>();
            foreach (KeyControl key in keyboard.allKeys)
            {
                if (key == null || !key.isPressed || IsExcluded(key.keyCode)) continue;
                int code = (int)key.keyCode;
                if (brakeSet.Contains(code)) brakeDown++;
                else if (acceleratorSet.Contains(code)) acceleratorDown++;
                else unmapped.Add(code);
            }
            liveBrake.fillAmount = brakeDown > 0 ? 1f : 0f;
            liveAccelerator.fillAmount = brakeDown > 0 ? 0f : (acceleratorDown > 0 ? 1f : 0f);
            string status = $"브레이크 {brakeDown}키 · 가속 {acceleratorDown}키";
            if (brakeDown > 0 && acceleratorDown > 0) status += " · 브레이크 우선";
            if (unmapped.Count > 0) status += " · 미등록: " + Names(unmapped);
            liveText.text = status;
        }

        static bool IsExcluded(Key key) =>
            key == Key.None || key == Key.Escape || key == Key.LeftMeta || key == Key.RightMeta || key == Key.ContextMenu || key == Key.PrintScreen;

        static string Names(IEnumerable<int> keys)
        {
            Keyboard keyboard = Keyboard.current;
            var names = new List<string>();
            foreach (int code in keys)
            {
                var key = (Key)code;
                string display = keyboard != null ? keyboard[key].displayName : null;
                names.Add(string.IsNullOrEmpty(display) ? key.ToString() : display);
            }
            return names.Count == 0 ? "없음" : string.Join(", ", names);
        }

        static bool IsShortcutKey(int code) => Array.IndexOf(ShortcutKeyNames, ((Key)code).ToString()) >= 0;
#else
        static string Names(IEnumerable<int> keys) => string.Join(", ", keys);
        static bool IsShortcutKey(int code) => false;
#endif

        void Save()
        {
            if (brakeSet.Count == 0 || acceleratorSet.Count == 0 || footPedals == null)
            {
                RefreshReview();
                return;
            }
#if ENABLE_INPUT_SYSTEM
            var mapping = new PedalKeyMapping
            {
                brakeKeys = PedalKeyMapping.ToNames(brakeSet),
                acceleratorKeys = PedalKeyMapping.ToNames(acceleratorSet),
            };
            footPedals.SetMapping(mapping, save: true);
#endif
            MarkDone();
            Close();
        }
    }
}
