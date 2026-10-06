using System;
using System.Collections.Generic;
using UnityEngine;

// Which letters Mom has found (saved with PlayerPrefs). F10 in game forgets them.
public class Discoveries
{
    const string Key = "mom-game-found-v1";
    readonly HashSet<string> found = new HashSet<string>();
    readonly List<string> order = new List<string>();
    public event Action<string> OnFound;

    public Discoveries()
    {
        string s = PlayerPrefs.GetString(Key, "");
        foreach (var id in s.Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries))
            if (Content.Get(id) != null && found.Add(id)) order.Add(id);
    }

    static bool WorldOn(string w) { return w == "home" || (w == "mall" && Content.MallOn) || (w == "past" && Content.PastOn); }

    public bool Exists(string id) { var d = Content.Get(id); return d != null && WorldOn(d.world); }
    public bool IsFound(string id) { return found.Contains(id); }

    public bool Add(string id)
    {
        if (!Exists(id) || !found.Add(id)) return false;
        order.Add(id);
        PlayerPrefs.SetString(Key, string.Join(",", order.ToArray()));
        PlayerPrefs.Save();
        if (OnFound != null) OnFound(id);
        return true;
    }

    public void ResetAll()
    {
        found.Clear(); order.Clear();
        PlayerPrefs.DeleteKey(Key);
        if (OnFound != null) OnFound(null);
    }

    public void Progress(out int got, out int total)
    {
        got = 0; total = 0;
        foreach (var d in Content.All) { if (!WorldOn(d.world)) continue; total++; if (found.Contains(d.id)) got++; }
    }

    public List<Disc> Found()
    {
        var l = new List<Disc>();
        foreach (var id in order) { var d = Content.Get(id); if (d != null && WorldOn(d.world)) l.Add(d); }
        return l;
    }
}
