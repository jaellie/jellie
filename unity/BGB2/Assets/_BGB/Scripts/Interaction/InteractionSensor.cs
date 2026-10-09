using UnityEngine;
using UnityEngine.InputSystem;

namespace BGB2
{
    /// <summary>Finds the nearest Interactable in range, drives the bottom prompt and the "!" markers.</summary>
    public class InteractionSensor : MonoBehaviour
    {
        public Transform player;
        public InteractionPrompt prompt;
        public Interactable[] interactables;
        public Interactable Current { get; private set; }

        void Update()
        {
            Current = null;
            if (!PlayerController.InputLocked && player != null)
            {
                float best = float.MaxValue;
                foreach (var i in interactables)
                {
                    float d = Mathf.Abs(player.position.x - i.transform.position.x);
                    if (d <= i.range && d < best) { best = d; Current = i; }
                }
            }

            foreach (var i in interactables)
            {
                var m = i.GetComponentInChildren<ExclamationMarker>(true);
                if (m != null) m.SetState(Current == i, Current == i);   // visible, and softened when the prompt shows
            }

            if (Current != null) prompt.Show(Current.prompt.Get()); else prompt.Hide();

            var kb = Keyboard.current;
            if (Current != null && kb != null && kb.eKey.wasPressedThisFrame)
            {
                prompt.HideImmediately();               // hide the moment an interaction begins
                Current.Interact();
            }
        }
    }
}
