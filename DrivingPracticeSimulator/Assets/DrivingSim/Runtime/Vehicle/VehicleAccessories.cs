using System;
using DrivingSim.Controls;
using DrivingSim.Core;
using UnityEngine;

namespace DrivingSim.Vehicle
{
    public enum WiperMode
    {
        Off,
        Intermittent,
        Low,
        High,
    }

    /// <summary>
    /// Turn signals (with steering auto-cancel), hazard lights, headlights and wipers.
    /// State lives here so the HUD and, later, driving evaluation can read it.
    /// </summary>
    public class VehicleAccessories : MonoBehaviour
    {
        [SerializeField] VehicleController vehicle;

        [Header("Lamps")]
        [SerializeField] Renderer[] leftIndicators = new Renderer[0];
        [SerializeField] Renderer[] rightIndicators = new Renderer[0];
        [SerializeField] Material indicatorOn;
        [SerializeField] Material indicatorOff;
        [SerializeField] Renderer[] headlightRenderers = new Renderer[0];
        [SerializeField] Material headlightOn;
        [SerializeField] Material headlightOff;
        [Tooltip("Optional real lights. Each costs a pixel light on mobile.")]
        [SerializeField] Light[] headlightLights = new Light[0];
        [Min(0.2f)] public float blinkPeriodSeconds = 0.8f;
        public bool autoCancelTurnSignal = true;

        [Header("Wipers")]
        [SerializeField] Transform[] wiperPivots = new Transform[0];
        public float wiperRestAngleDeg = -85f;
        public float wiperSweepDeg = 95f;

        readonly TurnSignalModel signals = new TurnSignalModel();
        float wiperPhase;
        float wiperPause;
        bool lastLeftLit, lastRightLit;
        bool headlights;

        public event Action<string> Feedback;
        public event Action Changed;

        public TurnSignal TurnSignal => signals.Signal;
        public bool Hazard => signals.Hazard;
        public bool HeadlightsOn => headlights;
        public WiperMode Wipers { get; private set; }
        public bool LeftLampLit { get; private set; }
        public bool RightLampLit { get; private set; }

        public void Configure(VehicleController target, Renderer[] left, Renderer[] right, Material on, Material off,
            Renderer[] heads, Material headOn, Material headOff, Light[] lights)
        {
            vehicle = target;
            leftIndicators = left;
            rightIndicators = right;
            indicatorOn = on;
            indicatorOff = off;
            headlightRenderers = heads;
            headlightOn = headOn;
            headlightOff = headOff;
            headlightLights = lights;
        }

        public void SetWiperPivots(Transform[] pivots) => wiperPivots = pivots ?? new Transform[0];

        void Start() => ApplyHeadlights();

        public void ApplyInput(in DrivingInputFrame input)
        {
            if (input.TurnSignalToggle < 0) ToggleTurnSignal(TurnSignal.Left);
            else if (input.TurnSignalToggle > 0) ToggleTurnSignal(TurnSignal.Right);
            if (input.ToggleHazard) ToggleHazard();
            if (input.ToggleHeadlights) ToggleHeadlights();
            if (input.CycleWipers) CycleWipers();
        }

        public void ToggleTurnSignal(TurnSignal signal)
        {
            signals.Toggle(signal);
            Feedback?.Invoke(signals.Signal == TurnSignal.Off ? "방향지시등 끔"
                : signals.Signal == TurnSignal.Left ? "좌측 방향지시등" : "우측 방향지시등");
            Changed?.Invoke();
        }

        public void ToggleHazard()
        {
            signals.ToggleHazard();
            Feedback?.Invoke(signals.Hazard ? "비상등 켬" : "비상등 끔");
            Changed?.Invoke();
        }

        public void ToggleHeadlights()
        {
            headlights = !headlights;
            ApplyHeadlights();
            Feedback?.Invoke(headlights ? "전조등 켬" : "전조등 끔");
            Changed?.Invoke();
        }

        public void CycleWipers()
        {
            Wipers = (WiperMode)(((int)Wipers + 1) % 4);
            Feedback?.Invoke(WiperName(Wipers));
            Changed?.Invoke();
        }

        public static string WiperName(WiperMode mode)
        {
            switch (mode)
            {
                case WiperMode.Intermittent: return "와이퍼 간헐";
                case WiperMode.Low: return "와이퍼 저속";
                case WiperMode.High: return "와이퍼 고속";
                default: return "와이퍼 끔";
            }
        }

        void Update()
        {
            signals.AutoCancel = autoCancelTurnSignal;
            if (vehicle != null && signals.UpdateSteering(vehicle.SteeringWheelAngleDeg))
            {
                Feedback?.Invoke("방향지시등 자동 해제");
                Changed?.Invoke();
            }

            bool phase = TurnSignalModel.BlinkPhase(Time.time, blinkPeriodSeconds);
            LeftLampLit = signals.LeftActive && phase;
            RightLampLit = signals.RightActive && phase;
            if (LeftLampLit != lastLeftLit) SetMaterial(leftIndicators, LeftLampLit ? indicatorOn : indicatorOff);
            if (RightLampLit != lastRightLit) SetMaterial(rightIndicators, RightLampLit ? indicatorOn : indicatorOff);
            lastLeftLit = LeftLampLit;
            lastRightLit = RightLampLit;

            UpdateWipers(Time.deltaTime);
        }

        void UpdateWipers(float dt)
        {
            if (wiperPivots.Length == 0) return;
            float cycleSeconds = Wipers == WiperMode.High ? 0.8f : 1.4f;
            if (Wipers == WiperMode.Off && wiperPhase <= 0f) return;

            if (wiperPause > 0f)
            {
                wiperPause -= dt;
            }
            else
            {
                wiperPhase += dt / cycleSeconds;
                if (wiperPhase >= 1f)
                {
                    wiperPhase = Wipers == WiperMode.Off ? 0f : wiperPhase - 1f;
                    if (Wipers == WiperMode.Intermittent) { wiperPhase = 0f; wiperPause = 3f; }
                }
            }

            float sweep = (1f - Mathf.Cos(wiperPhase * Mathf.PI * 2f)) * 0.5f;
            Quaternion rotation = Quaternion.Euler(0f, 0f, wiperRestAngleDeg + wiperSweepDeg * sweep);
            foreach (Transform pivot in wiperPivots)
                if (pivot != null) pivot.localRotation = rotation;
        }

        void ApplyHeadlights()
        {
            SetMaterial(headlightRenderers, headlights ? headlightOn : headlightOff);
            foreach (Light light in headlightLights)
                if (light != null) light.enabled = headlights;
        }

        static void SetMaterial(Renderer[] renderers, Material material)
        {
            if (material == null) return;
            foreach (Renderer renderer in renderers)
                if (renderer != null) renderer.sharedMaterial = material;
        }
    }
}
