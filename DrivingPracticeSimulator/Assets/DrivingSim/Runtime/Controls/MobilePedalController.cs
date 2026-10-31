using DrivingSim.UI;
using UnityEngine;

namespace DrivingSim.Controls
{
    /// <summary>Touchscreen pedals as an input source. Brake has priority over the accelerator.</summary>
    public class MobilePedalController : MonoBehaviour, IDrivingInputSource
    {
        [SerializeField] TouchPedalButton brakePedal;
        [SerializeField] TouchPedalButton acceleratorPedal;

        public void SetPedals(TouchPedalButton brake, TouchPedalButton accelerator)
        {
            brakePedal = brake;
            acceleratorPedal = accelerator;
        }

        public bool AnyPressed => (brakePedal != null && brakePedal.IsPressed) || (acceleratorPedal != null && acceleratorPedal.IsPressed);

        public void PollInput(float deltaTime, ref DrivingInputFrame frame)
        {
            float brake = brakePedal != null && brakePedal.isActiveAndEnabled ? brakePedal.Value : 0f;
            float throttle = acceleratorPedal != null && acceleratorPedal.isActiveAndEnabled ? acceleratorPedal.Value : 0f;
            if (brake > 0f) throttle = 0f;
            frame.Brake = Mathf.Max(frame.Brake, brake);
            frame.Throttle = Mathf.Max(frame.Throttle, throttle);
        }
    }
}
