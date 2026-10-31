using System.Collections.Generic;
using DrivingSim.Core;
using UnityEngine;

namespace DrivingSim.World
{
    /// <summary>One signal head: switches its lamp renderers between "on" and "off" materials.</summary>
    public class TrafficSignalHead : MonoBehaviour
    {
        [SerializeField] Renderer red, yellow, green;
        [SerializeField] Material redOn, yellowOn, greenOn, off;
        [SerializeField] bool mainApproach;

        public bool MainApproach => mainApproach;
        public SignalLamp Current { get; private set; } = (SignalLamp)(-1);

        public void Configure(Renderer redLamp, Renderer yellowLamp, Renderer greenLamp,
            Material redOnMat, Material yellowOnMat, Material greenOnMat, Material offMat, bool isMain)
        {
            red = redLamp; yellow = yellowLamp; green = greenLamp;
            redOn = redOnMat; yellowOn = yellowOnMat; greenOn = greenOnMat; off = offMat;
            mainApproach = isMain;
        }

        public void Show(SignalLamp lamp)
        {
            if (lamp == Current) return;
            Current = lamp;
            if (red != null) red.sharedMaterial = lamp == SignalLamp.Red ? redOn : off;
            if (yellow != null) yellow.sharedMaterial = lamp == SignalLamp.Yellow ? yellowOn : off;
            if (green != null) green.sharedMaterial = lamp == SignalLamp.Green ? greenOn : off;
        }
    }

    /// <summary>Runs the fixed-time plan of TestTownLayout.json for all heads of one intersection. Visual only.</summary>
    public class TrafficSignalController : MonoBehaviour
    {
        [SerializeField] List<TrafficSignalHead> heads = new List<TrafficSignalHead>();
        [SerializeField] TownSignalPhase[] phases;
        [SerializeField] float startOffsetSeconds;

        SignalCycle cycle;
        float elapsed;

        public void Configure(TownSignalPhase[] plan, IEnumerable<TrafficSignalHead> signalHeads, float offset = 0f)
        {
            phases = plan;
            heads = new List<TrafficSignalHead>(signalHeads);
            startOffsetSeconds = offset;
            cycle = null;
        }

        void OnEnable()
        {
            elapsed = startOffsetSeconds;
            Apply();
        }

        void Update()
        {
            elapsed += Time.deltaTime;
            Apply();
        }

        void Apply()
        {
            if (cycle == null)
            {
                if (phases == null || phases.Length == 0) return;
                cycle = new SignalCycle(phases);
            }
            cycle.At(elapsed, out SignalLamp main, out SignalLamp cross);
            foreach (TrafficSignalHead head in heads)
                if (head != null) head.Show(head.MainApproach ? main : cross);
        }
    }
}
