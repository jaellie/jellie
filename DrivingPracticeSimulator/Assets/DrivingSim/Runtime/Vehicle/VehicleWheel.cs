using System;
using UnityEngine;

namespace DrivingSim.Vehicle
{
    public enum Axle
    {
        Front,
        Rear,
    }

    [Serializable]
    public class VehicleWheel
    {
        public WheelCollider collider;
        [Tooltip("Visual wheel transform. Should be a direct child of the vehicle root.")]
        public Transform visual;
        public Axle axle;
        public bool isLeft;

        // Pose captured in physics time, relative to the rigidbody, applied to the visual every frame.
        [NonSerialized] public Vector3 poseLocalPosition;
        [NonSerialized] public Quaternion poseLocalRotation = Quaternion.identity;
        [NonSerialized] public bool hasPose;

        public bool IsFront => axle == Axle.Front;
    }
}
