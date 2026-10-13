using System;
using UnityEngine;

namespace BGB2
{
    [Serializable]
    public class DialogueChoice
    {
        public LocalizedText text;
        public int nextNode = -1;              // index into nodes, -1 ends the conversation
    }

    [Serializable]
    public class DialogueNode
    {
        public string speakerId;               // "nini", "oliver"
        public Expression expression;          // portrait for this line
        public LocalizedText text;
        public int next = -1;                  // used when there are no choices
        public string setFlag;                 // flag set when the node is left
        public DialogueChoice[] choices;
    }

    /// <summary>Data-driven conversation. Conditions and events can be added as new fields without touching code.</summary>
    [CreateAssetMenu(menuName = "BGB2/Dialogue", fileName = "DLG_New")]
    public class DialogueDefinition : ScriptableObject
    {
        public DialogueNode[] nodes;
    }

    public enum Expression { Neutral, Worried, Surprised, Thinking }

    [Serializable]
    public class Speaker
    {
        public string id;
        public LocalizedText displayName;
        public Sprite portrait;                // fallback still
        public Sprite neutral, worried, surprised, thinking;   // per-line expressions (optional)

        public Sprite For(Expression e)
        {
            Sprite s = e == Expression.Worried ? worried : e == Expression.Surprised ? surprised : e == Expression.Thinking ? thinking : neutral;
            return s != null ? s : portrait;
        }
    }
}
