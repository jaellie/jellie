using DrivingSim.Cameras;
using DrivingSim.Core;
using UnityEngine;

namespace DrivingSim.Vehicle
{
    /// <summary>
    /// Drives the cockpit visuals from the vehicle's state: steering wheel rotation (the same
    /// angle the physics uses), speedometer needle and readout, gear and parking-brake indicators.
    /// Also owns the eye anchor for the first-person camera and the mirrors.
    /// </summary>
    [DefaultExecutionOrder(50)]
    public class CockpitRig : MonoBehaviour
    {
        [SerializeField] VehicleController vehicle;
        [SerializeField] Transform eyeAnchor;
        [SerializeField] GameObject interiorRoot;
        [SerializeField] Transform steeringWheelSpin;
        [SerializeField] Transform speedNeedle;
        [SerializeField] TextMesh speedText;
        [SerializeField] TextMesh gearText;
        [SerializeField] TextMesh parkingBrakeText;
        [SerializeField] MirrorCamera[] mirrors = new MirrorCamera[0];

        [Header("Speedometer")]
        [Min(10f)] public float speedometerMaxKmh = 180f;
        [Range(90f, 300f)] public float speedometerSweepDeg = 240f;

        [Header("Indicator colors")]
        public Color gearActiveColor = new Color(0.94f, 0.71f, 0.16f);
        public Color gearInactiveColor = new Color(0.45f, 0.48f, 0.52f);

        int shownSpeed = -1;
        TransmissionGear shownGear = (TransmissionGear)(-1);
        int shownParkingBrake = -1;

        public Transform EyeAnchor => eyeAnchor;
        public VehicleController Vehicle => vehicle;

        public void Configure(VehicleController target, Transform eye, GameObject interior, Transform wheelSpin, Transform needle,
            TextMesh speed, TextMesh gear, TextMesh parkingBrake, MirrorCamera[] vehicleMirrors)
        {
            vehicle = target;
            eyeAnchor = eye;
            interiorRoot = interior;
            steeringWheelSpin = wheelSpin;
            speedNeedle = needle;
            speedText = speed;
            gearText = gear;
            parkingBrakeText = parkingBrake;
            mirrors = vehicleMirrors ?? new MirrorCamera[0];
        }

        /// <summary>Interior is hidden outside the cockpit view (saves draw calls and avoids TextMesh drawing through the body).</summary>
        public void SetInteriorVisible(bool visible)
        {
            if (interiorRoot != null && interiorRoot.activeSelf != visible) interiorRoot.SetActive(visible);
        }

        public void SetMirrorsLive(bool live)
        {
            foreach (MirrorCamera mirror in mirrors)
                if (mirror != null) mirror.SetLive(live);
        }

        void LateUpdate()
        {
            if (vehicle == null || interiorRoot == null || !interiorRoot.activeInHierarchy) return;

            // Clockwise as seen by the driver = negative rotation about the column's forward axis.
            if (steeringWheelSpin != null)
                steeringWheelSpin.localRotation = Quaternion.Euler(0f, 0f, -vehicle.SteeringWheelAngleDeg);

            float speedKmh = Mathf.Abs(vehicle.SignedSpeedKmh);
            if (speedNeedle != null)
                speedNeedle.localRotation = Quaternion.Euler(0f, 0f, -DialMath.NeedleAngle(speedKmh, speedometerMaxKmh, speedometerSweepDeg));

            int rounded = Mathf.RoundToInt(speedKmh);
            if (speedText != null && rounded != shownSpeed)
            {
                shownSpeed = rounded;
                speedText.text = rounded.ToString();
            }

            if (gearText != null && vehicle.Gear != shownGear)
            {
                shownGear = vehicle.Gear;
                gearText.text = FormatGear(shownGear);
            }

            int parking = vehicle.ParkingBrakeEngaged ? 1 : 0;
            if (parkingBrakeText != null && parking != shownParkingBrake)
            {
                shownParkingBrake = parking;
                parkingBrakeText.gameObject.SetActive(parking == 1);
            }
        }

        string FormatGear(TransmissionGear active)
        {
            string on = ColorUtility.ToHtmlStringRGB(gearActiveColor);
            string off = ColorUtility.ToHtmlStringRGB(gearInactiveColor);
            var builder = new System.Text.StringBuilder(64);
            for (int i = 0; i <= (int)TransmissionGear.D; i++)
            {
                var gear = (TransmissionGear)i;
                builder.Append("<color=#").Append(gear == active ? on : off).Append('>').Append(gear).Append("</color>");
                if (i < (int)TransmissionGear.D) builder.Append(' ');
            }
            return builder.ToString();
        }
    }
}
