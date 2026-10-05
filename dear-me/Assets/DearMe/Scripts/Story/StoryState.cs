using System;
using System.Collections.Generic;

namespace DearMe.Story
{
    /// <summary>The five large story phases (STATE_01 … STATE_05 in the design doc).</summary>
    public enum StoryPhase
    {
        Normal = 1,          // STATE_01_NORMAL
        LetterFound = 2,     // STATE_02_LETTER_FOUND
        MemoryChanged = 3,   // STATE_03_MEMORY_CHANGED
        FutureRevealed = 4,  // STATE_04_FUTURE_REVEALED
        FinalChoice = 5,     // STATE_05_FINAL_CHOICE
    }

    public enum MasteryState { None, Introduced, Recognized, Practiced, Used, Recycled, Mastered }

    public enum LanguageSupportLevel { Off = 0, Low = 1, Full = 2 }

    [Serializable]
    public class KeyValue
    {
        public string key = "";
        public string value = "";
    }

    [Serializable]
    public class ChoiceRecord
    {
        public string nodeId = "";
        public int index;
        public int loop;
    }

    [Serializable]
    public class PatternProgress
    {
        public string patternId = "";
        public int exposureCount;
        public int recognitionCount;
        public int productionCount;
        public int contextualUseCount;
        public List<int> chaptersSeen = new List<int>();
        public MasteryState masteryState = MasteryState.None;
    }

    /// <summary>
    /// Everything that must survive a save. One central object instead of booleans
    /// scattered across scripts; JsonUtility-friendly (lists, no dictionaries).
    /// </summary>
    [Serializable]
    public class StoryState
    {
        public StoryPhase phase = StoryPhase.Normal;
        public int currentLoop;
        public int currentChapter;
        public string currentLocation = "";
        public List<string> flags = new List<string>();
        public List<string> clues = new List<string>();
        public List<string> visitedLocations = new List<string>();
        public List<string> inspectedObjects = new List<string>();
        public List<string> dialogueHistory = new List<string>();
        public List<ChoiceRecord> choices = new List<ChoiceRecord>();
        public List<KeyValue> vars = new List<KeyValue>();
        public List<KeyValue> photoMemoryState = new List<KeyValue>();
        public List<PatternProgress> patterns = new List<PatternProgress>();
        public List<string> ambience = new List<string>();
        /// <summary>Explore node to return to when an object's inspection ends.</summary>
        public string exploreReturn = "";
        public string ending = "";

        public const int MaxHistory = 300;

        public static string Get(List<KeyValue> list, string key)
        {
            foreach (var kv in list) if (kv.key == key) return kv.value;
            return "";
        }

        public static void Set(List<KeyValue> list, string key, string value)
        {
            foreach (var kv in list)
                if (kv.key == key) { kv.value = value; return; }
            list.Add(new KeyValue { key = key, value = value });
        }
    }
}
