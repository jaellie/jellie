using System;
using System.Collections.Generic;
using System.IO;
using UnityEngine;

namespace BGB2
{
    /// <summary>Plain serializable runtime progress. Never holds scene objects (see STORY_BIBLE section 17 rules).</summary>
    [Serializable]
    public class GameState
    {
        public const int CurrentVersion = 1;

        public int version = CurrentVersion;
        public string scene = "BellVillage";
        public float playerX = 5.2f;
        public string language = "English";
        public List<string> flags = new List<string>();
        public List<string> evidence = new List<string>();
        public List<string> notes = new List<string>();

        public bool HasFlag(string f) => flags.Contains(f);
        public void SetFlag(string f) { if (!string.IsNullOrEmpty(f) && !flags.Contains(f)) flags.Add(f); }
        public bool HasEvidence(string id) => evidence.Contains(id);
    }

    /// <summary>Owns the single GameState instance and its JSON save file.</summary>
    public static class Game
    {
        public static GameState State { get; private set; } = new GameState();
        public static event Action EvidenceChanged;

        static string SavePath => Path.Combine(Application.persistentDataPath, "bgb2_save.json");

        public static bool AddEvidence(EvidenceDefinition def)
        {
            if (def == null || State.HasEvidence(def.id)) return false;
            State.evidence.Add(def.id);
            if (def.note != null && !string.IsNullOrEmpty(def.note.en) && !State.notes.Contains(def.id)) State.notes.Add(def.id);
            EvidenceChanged?.Invoke();
            Save();
            return true;
        }

        public static void Save()
        {
            try
            {
                State.language = Loc.Current.ToString();
                File.WriteAllText(SavePath, JsonUtility.ToJson(State, true));
            }
            catch (Exception e) { Debug.LogWarning("BGB2 save failed: " + e.Message); }
        }

        public static void Load()
        {
            try
            {
                if (!File.Exists(SavePath)) return;
                var loaded = JsonUtility.FromJson<GameState>(File.ReadAllText(SavePath));
                if (loaded != null && loaded.version <= GameState.CurrentVersion) State = loaded; // newer saves are ignored, not corrupted
                if (Enum.TryParse(State.language, out Language lang)) Loc.Set(lang);
            }
            catch (Exception e) { Debug.LogWarning("BGB2 load failed: " + e.Message); }
        }

        public static void Reset() { State = new GameState(); Save(); EvidenceChanged?.Invoke(); }
    }
}
