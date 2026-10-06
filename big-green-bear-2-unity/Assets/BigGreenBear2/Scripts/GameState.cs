// GameState.cs — what the player has concluded so far. Saved in PlayerPrefs.
// "board" maps evidence id -> "bear" | "green". Conflicts are derived, never stored,
// and the game never says which side is right.
using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;

namespace BigGreenBear2
{
    [Serializable]
    class SaveData { public int phase; public string[] boardIds = new string[0]; public string[] boardSides = new string[0]; }

    public static class GameState
    {
        const string Key = "bgb2.save.v1";
        public static int Phase;                      // 0 one bear, 1 twins appear, 2 IDENTITY UNCERTAIN
        public static readonly Dictionary<string, string> Board = new Dictionary<string, string>();

        public static void Load()
        {
            Board.Clear();
            try
            {
                var s = JsonUtility.FromJson<SaveData>(PlayerPrefs.GetString(Key, "{}"));
                if (s == null) return;
                Phase = s.phase;
                for (int i = 0; i < s.boardIds.Length && i < s.boardSides.Length; i++) Board[s.boardIds[i]] = s.boardSides[i];
            }
            catch (Exception) { }
        }

        public static void Save()
        {
            var s = new SaveData { phase = Phase, boardIds = Board.Keys.ToArray(), boardSides = Board.Values.ToArray() };
            PlayerPrefs.SetString(Key, JsonUtility.ToJson(s));
            PlayerPrefs.Save();
        }

        public static void Place(string id, string side)
        {
            if (side == "bear" || side == "green") Board[id] = side; else Board.Remove(id);
            Save();
        }

        // Same trait, different value, same column -> CONFLICT (design prompt §24).
        public static HashSet<string> Conflicts()
        {
            var bad = new HashSet<string>();
            foreach (var side in new[] { "bear", "green" })
            {
                var ids = Board.Where(kv => kv.Value == side).Select(kv => Data.Get(kv.Key)).Where(e => e.trait != null).ToList();
                foreach (var a in ids)
                    foreach (var b in ids)
                        if (a != b && a.trait == b.trait && a.value != b.value) bad.Add(a.id);
            }
            return bad;
        }
    }
}
