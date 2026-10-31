using DrivingSim.Core;
using DrivingSim.Vehicle;
using UnityEngine;
using UnityEngine.UI;

namespace DrivingSim.UI
{
    /// <summary>
    /// Vertical P / R / N / D selector. A tap requests the gear through the vehicle, so the existing
    /// brake and speed interlocks still decide; the selected gear is shown in blue.
    /// </summary>
    public class GearSelectorUI : MonoBehaviour
    {
        [SerializeField] VehicleController vehicle;
        [SerializeField] HoldButton[] buttons = new HoldButton[4];
        [SerializeField] Text[] labels = new Text[4];
        [SerializeField] HudTheme theme;

        bool subscribed;

        public static GearSelectorUI Create(Transform parent, VehicleController vehicle, HudTheme theme, Vector2 position, Vector2 buttonSize, float spacing)
        {
            float height = buttonSize.y * 4f + spacing * 3f + 16f;
            RectTransform root = UIBuild.Rect("GearSelector", parent, new Vector2(1f, 0.5f), new Vector2(1f, 0.5f), position,
                new Vector2(buttonSize.x + 16f, height));
            UIBuild.Panel(root, theme.RoundedPanel, theme.panel);

            var selector = root.gameObject.AddComponent<GearSelectorUI>();
            selector.vehicle = vehicle;
            selector.theme = theme;
            for (int i = 0; i < 4; i++)
            {
                var gear = (TransmissionGear)i;
                float y = height * 0.5f - 8f - buttonSize.y * 0.5f - i * (buttonSize.y + spacing);
                selector.buttons[i] = UIBuild.Button($"Gear_{gear}", root, new Vector2(0.5f, 0.5f), new Vector2(0.5f, 0.5f),
                    new Vector2(0f, y), buttonSize, gear.ToString(), theme, 46, out selector.labels[i]);
                selector.labels[i].fontStyle = FontStyle.Bold;
            }
            if (Application.isPlaying && selector.isActiveAndEnabled) selector.Subscribe();
            return selector;
        }

        void OnEnable() => Subscribe();
        void OnDisable() => Unsubscribe();

        void Subscribe()
        {
            if (subscribed || vehicle == null) return;
            subscribed = true;
            for (int i = 0; i < buttons.Length; i++)
            {
                if (buttons[i] == null) continue;
                var gear = (TransmissionGear)i;
                buttons[i].Pressed += () => vehicle.RequestGear(gear);
            }
            vehicle.GearChanged += Refresh;
            Refresh(vehicle.Gear);
        }

        void Unsubscribe()
        {
            if (!subscribed || vehicle == null) return;
            subscribed = false;
            vehicle.GearChanged -= Refresh;
            // Button lambdas die with the buttons; they are only added once per subscription.
            foreach (HoldButton button in buttons)
                if (button != null) button.ClearPressedHandlers();
        }

        void Refresh(TransmissionGear active)
        {
            HudTheme t = theme != null ? theme : HudTheme.Default;
            for (int i = 0; i < buttons.Length; i++)
            {
                bool on = i == (int)active;
                if (buttons[i] != null) buttons[i].SetToggled(on);
                if (labels[i] != null) labels[i].color = on ? Color.white : t.textMuted;
            }
        }
    }
}
