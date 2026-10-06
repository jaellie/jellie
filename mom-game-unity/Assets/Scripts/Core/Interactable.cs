using System;
using System.Collections;
using UnityEngine;

// Something Mom can use with E / Space. If `discover` is set, it twinkles faintly (until found).
public class Interactable
{
    public string id;
    public Vector3 pos;            // world position of the thing (y = height of the hint target)
    public float reach = 1.2f;     // horizontal distance at which the hint shows
    public float hintLift = 0.45f; // hint bubble floats this far above pos
    public string discover;        // Disc id (twinkles until found)
    public Func<bool> enabled;     // optional: is it usable right now?
    public Func<IEnumerator> use;  // what happens
    public GameObject sparkle;
    public float phase;

    public bool Enabled { get { return enabled == null || enabled(); } }
    public Vector3 HintPos { get { return pos + Vector3.up * hintLift; } }
}
