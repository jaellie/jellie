using System;
using UnityEngine;

namespace BGB2
{
    /// <summary>Anything the player can use (NPC, sign, door, clock). Behaviour is data: a dialogue and/or an evidence definition.</summary>
    public class Interactable : MonoBehaviour
    {
        public static event Action<Interactable> Activated;

        public string id;
        public LocalizedText prompt;
        public float range = 1.4f;
        public DialogueDefinition dialogue;          // talk
        public EvidenceDefinition evidence;          // examine and collect
        public string loadScene;                     // enter a building (scene transition is the next milestone)

        public void Interact() => Activated?.Invoke(this);
    }
}
