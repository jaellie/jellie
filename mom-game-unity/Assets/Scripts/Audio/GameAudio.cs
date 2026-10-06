using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

// All sound is synthesized in code (soft chimes, footsteps, rubber squeaks, waves, wind, cicadas,
// gentle pads). If a file exists in Assets/Resources/Audio/<key>.(mp3|wav|ogg) it is used instead:
// bgm_home bgm_mall bgm_past bgm_beach waves gulls cicadas wind chatter squeak chime voice_message
public class GameAudio : MonoBehaviour
{
    const int SR = 22050;
    readonly Dictionary<string, AudioClip> clips = new Dictionary<string, AudioClip>();
    readonly Dictionary<string, AudioSource> loops = new Dictionary<string, AudioSource>();
    readonly Dictionary<string, float> loopTarget = new Dictionary<string, float>();
    readonly Dictionary<string, float> loopLevel = new Dictionary<string, float> {
        { "bgm_home", 0.42f }, { "bgm_mall", 0.4f }, { "bgm_past", 0.42f }, { "bgm_beach", 0.4f },
        { "waves", 0.45f }, { "gulls", 0.3f }, { "cicadas", 0.16f }, { "wind", 0.25f }, { "chatter", 0.2f } };
    readonly HashSet<string> generating = new HashSet<string>();
    AudioSource oneShot;
    System.Random rng = new System.Random(3);
    float duck = 1f, duckTarget = 1f;

    void Awake()
    {
        oneShot = gameObject.AddComponent<AudioSource>();
        oneShot.playOnAwake = false; oneShot.spatialBlend = 0f;
        AudioListener.volume = 0.9f;
    }

    // ───────────────────────── one-shots ─────────────────────────
    public void Play(string name, float vol = 1f, float pitch = 1f)
    {
        try
        {
            var c = Clip(name);
            if (c == null) return;
            oneShot.pitch = pitch;
            oneShot.PlayOneShot(c, vol);
        }
        catch (Exception e) { Debug.LogWarning("[audio] " + e.Message); }
    }

    public void Squeak() { Play("squeak", 0.5f, 0.9f + (float)rng.NextDouble() * 0.3f); }

    public AudioClip Clip(string name)
    {
        AudioClip c;
        if (clips.TryGetValue(name, out c)) return c;
        c = Resources.Load<AudioClip>("Audio/" + name);
        if (c == null) c = Synth(name);
        clips[name] = c;
        return c;
    }

    public AudioClip VoiceFile(string file)
    {
        if (string.IsNullOrEmpty(file)) return null;
        string n = System.IO.Path.GetFileNameWithoutExtension(file);
        return Resources.Load<AudioClip>("Audio/" + n);
    }

    public void PlayVoice(AudioClip c)
    {
        if (c == null) return;
        duckTarget = 0.25f;
        oneShot.pitch = 1f; oneShot.PlayOneShot(c, 1f);
        StartCoroutine(Unduck(c.length));
    }
    IEnumerator Unduck(float after) { yield return new WaitForSeconds(after); duckTarget = 1f; }
    public void StopVoice() { oneShot.Stop(); duckTarget = 1f; }

    // ───────────────────────── loops ─────────────────────────
    public void SetLoops(params string[] keys)
    {
        var want = new HashSet<string>(keys);
        foreach (var k in new List<string>(loopTarget.Keys)) if (!want.Contains(k)) loopTarget[k] = 0f;
        foreach (var k in keys)
        {
            float lvl; if (!loopLevel.TryGetValue(k, out lvl)) lvl = 0.3f;
            loopTarget[k] = lvl;
            if (!loops.ContainsKey(k) && !generating.Contains(k)) StartCoroutine(StartLoop(k));
        }
    }

    IEnumerator StartLoop(string key)
    {
        generating.Add(key);
        AudioClip c = Resources.Load<AudioClip>("Audio/" + key);
        if (c == null)
        {
            // generate in chunks so the game never stutters
            int n; Func<int, float> gen = LoopGenerator(key, out n);
            var data = new float[n];
            for (int i = 0; i < n; i++)
            {
                data[i] = gen(i);
                if (i % 20000 == 19999) yield return null;
            }
            Normalize(data, 0.9f);
            c = AudioClip.Create(key, n, 1, SR, false);
            c.SetData(data, 0);
        }
        var src = gameObject.AddComponent<AudioSource>();
        src.clip = c; src.loop = true; src.volume = 0f; src.playOnAwake = false; src.spatialBlend = 0f;
        src.Play();
        loops[key] = src;
        generating.Remove(key);
    }

    void Update()
    {
        duck = Mathf.Lerp(duck, duckTarget, 1f - Mathf.Exp(-Time.deltaTime * 4f));
        foreach (var kv in loops)
        {
            float t; if (!loopTarget.TryGetValue(kv.Key, out t)) t = 0f;
            float mul = kv.Key.StartsWith("bgm") ? duck : 1f;
            kv.Value.volume = Mathf.Lerp(kv.Value.volume, t * mul, 1f - Mathf.Exp(-Time.deltaTime * 1.1f));
        }
    }

    // ───────────────────────── synthesis ─────────────────────────
    static void Normalize(float[] d, float peak)
    {
        float m = 0.0001f; for (int i = 0; i < d.Length; i++) m = Mathf.Max(m, Mathf.Abs(d[i]));
        float k = peak / m; for (int i = 0; i < d.Length; i++) d[i] *= k;
    }

    float Noise() { return (float)(rng.NextDouble() * 2.0 - 1.0); }
    static float Env(float t, float attack, float decay) { return t < attack ? t / attack : Mathf.Exp(-(t - attack) / decay); }
    static float Sine(float f, float t) { return Mathf.Sin(2f * Mathf.PI * f * t); }
    static float MidiHz(float m) { return 440f * Mathf.Pow(2f, (m - 69f) / 12f); }

    AudioClip Make(string name, float seconds, Func<float, float> f)
    {
        int n = Mathf.Max(1, (int)(seconds * SR));
        var d = new float[n];
        for (int i = 0; i < n; i++) d[i] = f(i / (float)SR);
        var c = AudioClip.Create(name, n, 1, SR, false);
        c.SetData(d, 0);
        return c;
    }

    // one-pole low-pass applied to white noise (cheap "soft" noise)
    Func<float> LpNoise(float cutoff)
    {
        float a = 1f - Mathf.Exp(-2f * Mathf.PI * cutoff / SR), y = 0f;
        return () => { y += a * (Noise() - y); return y * 3f; };
    }

    AudioClip Synth(string name)
    {
        switch (name)
        {
            case "step": { var n = LpNoise(420); return Make(name, 0.09f, t => n() * Env(t, 0.004f, 0.025f) * 0.5f); }
            case "stepSoft": { var n = LpNoise(300); return Make(name, 0.08f, t => n() * Env(t, 0.004f, 0.02f) * 0.28f); }
            case "sand": { var n = LpNoise(1800); return Make(name, 0.14f, t => n() * Env(t, 0.01f, 0.04f) * 0.4f); }
            case "squeak": return Make(name, 0.16f, t => Mathf.Sin(2f * Mathf.PI * (1100f * t + 1900f * t * t)) * Env(t, 0.012f, 0.05f) * 0.3f);
            case "chime": return Make(name, 1.8f, t => (Sine(1318.5f, t) * Env(t, 0.008f, 0.5f) * 0.35f + Sine(1975.5f, t - 0.09f) * Env(Mathf.Max(0, t - 0.09f), 0.008f, 0.45f) * 0.2f + Sine(2637f, t - 0.18f) * Env(Mathf.Max(0, t - 0.18f), 0.008f, 0.35f) * 0.12f));
            case "sparkle": return Make(name, 0.7f, t => (Sine(2093f, t) * Env(t, 0.004f, 0.18f) + Sine(2637f, t - 0.06f) * Env(Mathf.Max(0, t - 0.06f), 0.004f, 0.18f) + Sine(3136f, t - 0.12f) * Env(Mathf.Max(0, t - 0.12f), 0.004f, 0.18f)) * 0.14f);
            case "pop": return Make(name, 0.25f, t => Sine(380f + 500f * Mathf.Min(1f, t / 0.12f), t) * Env(t, 0.005f, 0.07f) * 0.5f);
            case "page": { var n = LpNoise(6000); return Make(name, 0.2f, t => (Noise() - n() * 0.9f) * Env(t, 0.01f, 0.05f) * 0.2f); }
            case "rustle": { var n = LpNoise(4000); return Make(name, 0.7f, t => Noise() * Env(Mathf.Repeat(t, 0.1f), 0.005f, 0.03f) * Mathf.Exp(-t * 2f) * 0.35f * (n() > -9f ? 1f : 0f)); }
            case "click": return Make(name, 0.05f, t => Mathf.Sign(Sine(1800f, t)) * Env(t, 0.001f, 0.01f) * 0.15f);
            case "door": { var n = LpNoise(250); return Make(name, 0.6f, t => (n() * 0.8f + Sine(90f, t) * 0.5f) * Env(t, 0.01f, 0.18f) * 0.6f); }
            case "curtain": { var n = LpNoise(2400); return Make(name, 1.6f, t => n() * (0.5f + 0.5f * Mathf.Sin(t * 9f)) * Mathf.Min(1f, t * 3f) * Mathf.Max(0f, 1f - t / 1.6f) * 0.2f); }
            case "water": return Make(name, 0.9f, t => Sine(600f + 900f * Mathf.Abs(Mathf.Sin(t * 53f)), t) * Env(Mathf.Repeat(t, 0.06f), 0.004f, 0.03f) * 0.18f);
            case "splash": { var n = LpNoise(900); return Make(name, 0.6f, t => n() * Env(t, 0.01f, 0.18f) * 0.5f); }
            case "coin": return Make(name, 0.6f, t => (Sine(2400f, t) * Env(t, 0.002f, 0.15f) + Sine(3200f, t - 0.07f) * Env(Mathf.Max(0, t - 0.07f), 0.002f, 0.2f)) * 0.2f);
            case "whoosh": { var n = LpNoise(700); return Make(name, 0.5f, t => n() * Mathf.Sin(Mathf.Clamp01(t / 0.5f) * Mathf.PI) * 0.4f); }
            case "flame": { var n = LpNoise(900); return Make(name, 0.5f, t => n() * Env(t, 0.01f, 0.1f) * 0.3f + Sine(660f, t - 0.05f) * Env(Mathf.Max(0, t - 0.05f), 0.01f, 0.2f) * 0.1f); }
            case "lid": return Make(name, 0.4f, t => (Sine(820f, t) + Sine(1230f, t)) * Env(t, 0.002f, 0.08f) * 0.16f);
            case "thud": { var n = LpNoise(400); return Make(name, 0.3f, t => (Sine(120f, t) * 0.6f + n() * 0.3f) * Env(t, 0.004f, 0.06f) * 0.8f); }
            case "sigh": { var n = LpNoise(600); return Make(name, 1.1f, t => n() * Mathf.Sin(Mathf.Clamp01(t / 1.1f) * Mathf.PI) * 0.18f); }
            case "dish": return Make(name, 0.8f, t => (Sine(1600f, t) * Env(t, 0.002f, 0.2f) + Sine(2100f, t - 0.05f) * Env(Mathf.Max(0, t - 0.05f), 0.002f, 0.2f)) * 0.12f);
            case "beep": return Make(name, 0.3f, t => (Mathf.Sign(Sine(2000f, t)) * (t < 0.06f || (t > 0.12f && t < 0.18f) ? 1f : 0f)) * 0.07f);
            case "dingdong": return Make(name, 1.8f, t => Sine(784f, t) * Env(t, 0.01f, 0.4f) * 0.3f + Sine(622f, t - 0.45f) * Env(Mathf.Max(0, t - 0.45f), 0.01f, 0.5f) * 0.3f);
            case "car": { var n = LpNoise(160); return Make(name, 1.0f, t => (n() * 0.4f + Mathf.Sign(Sine(55f, t)) * 0.05f) * Mathf.Min(1f, t * 3f) * 0.6f); }
            case "ring": return Make(name, 2.4f, t => (t < 0.8f ? Sine(Mathf.Floor(t * 20f) % 2 == 0 ? 1000f : 1250f, t) * 0.18f : 0f));
        }
        return null;
    }

    Func<int, float> LoopGenerator(string key, out int n)
    {
        switch (key)
        {
            case "waves": { n = SR * 8; var f = LpNoise(520); return i => f() * (0.55f + 0.45f * Mathf.Sin(2f * Mathf.PI * (i / (float)SR) / 8f)); }
            case "wind": { n = SR * 10; var f = LpNoise(380); return i => f() * (0.6f + 0.4f * Mathf.Sin(2f * Mathf.PI * (i / (float)SR) / 10f)); }
            case "chatter": { n = SR * 6; var f = LpNoise(900); var g = LpNoise(300); return i => (f() - g()) * (0.5f + 0.5f * Mathf.Sin(2f * Mathf.PI * (i / (float)SR) * (1f / 6f) * 4f)); }
            case "cicadas":
                {
                    n = SR * 8; var f = LpNoise(5600); var g = LpNoise(3800);
                    return i => { float t = i / (float)SR; float buzz = Mathf.Sign(Mathf.Sin(2f * Mathf.PI * 38f * t)) * 0.5f + 0.5f; return (f() - g()) * buzz * (0.6f + 0.4f * Mathf.Sin(2f * Mathf.PI * t / 8f)); };
                }
            case "gulls":
                {
                    n = SR * 14; var calls = new List<float>();
                    for (int k = 0; k < 4; k++) calls.Add(1.5f + k * 3.2f + (float)rng.NextDouble());
                    return i =>
                    {
                        float t = i / (float)SR, v = 0f;
                        foreach (var c0 in calls) for (int j = 0; j < 3; j++)
                        { float tt = t - (c0 + j * 0.28f); if (tt > 0f && tt < 0.26f) v += Mathf.Sin(2f * Mathf.PI * (1700f * tt - 700f * tt * tt)) * Env(tt, 0.03f, 0.08f) * 0.5f; }
                        return v;
                    };
                }
            default: return PadGenerator(key, out n);
        }
    }

    // gentle pad + music-box notes, looped seamlessly (every chord wraps around the buffer)
    Func<int, float> PadGenerator(string key, out int n)
    {
        float root = 60f, len = 4.8f; int[][] chords; bool radio = false;
        switch (key)
        {
            case "bgm_mall": root = 62; len = 3.6f; chords = new[] { new[] { 0, 4, 7, 14 }, new[] { 5, 9, 12, 16 }, new[] { -3, 0, 4, 9 }, new[] { 7, 11, 14, 17 } }; break;
            case "bgm_past": root = 57; len = 5.2f; radio = true; chords = new[] { new[] { 0, 3, 7, 10 }, new[] { 5, 8, 12, 15 }, new[] { -2, 2, 5, 9 }, new[] { 3, 7, 10, 14 } }; break;
            case "bgm_beach": root = 55; len = 6f; chords = new[] { new[] { 0, 4, 7, 11 }, new[] { 5, 9, 12, 16 }, new[] { -5, 0, 4, 7 }, new[] { -3, 0, 4, 7 } }; break;
            default: chords = new[] { new[] { 0, 4, 7, 11 }, new[] { -3, 0, 4, 7 }, new[] { 5, 9, 12, 16 }, new[] { 2, 5, 9, 12 } }; break;
        }
        n = (int)(len * 4f * SR);
        // pre-render the whole loop lazily: build the note list first, then evaluate per sample
        var notes = new List<float[]>(); // start, freq, amp, decay, kind
        var pent = new[] { 0, 2, 4, 7, 9 };
        var r = new System.Random(key.GetHashCode());
        for (int c = 0; c < 4; c++)
        {
            float t0 = c * len;
            for (int j = 0; j < chords[c].Length; j++)
                notes.Add(new[] { t0, MidiHz(root + chords[c][j] - 12 + (j == 0 ? -12 : 0)), 0.05f, len * 0.6f, 0f });
            for (int b = 0; b < 3; b++)
            {
                if (r.NextDouble() < 0.35) continue;
                float m = root + 12 + pent[r.Next(5)] + (r.NextDouble() < 0.3 ? 12 : 0);
                notes.Add(new[] { t0 + b * (len / 3f) + (float)r.NextDouble() * 0.3f, MidiHz(m), 0.04f, 0.9f, 1f });
            }
        }
        float total = len * 4f; float lp = 0f; float la = 1f - Mathf.Exp(-2f * Mathf.PI * (radio ? 900f : 1500f) / SR);
        return i =>
        {
            float t = i / (float)SR, v = 0f;
            foreach (var nt in notes)
            {
                float tt = t - nt[0]; if (tt < 0f) tt += total;   // wrap-around keeps the loop seamless
                if (tt > nt[3] * 2.4f) continue;
                if (nt[4] < 0.5f) { float e = tt < nt[3] * 0.6f ? tt / (nt[3] * 0.6f) : Mathf.Exp(-(tt - nt[3] * 0.6f) / (nt[3] * 0.5f)); v += Sine(nt[1], tt) * e * nt[2]; v += Sine(nt[1] * 2.003f, tt) * e * nt[2] * 0.2f; }
                else v += Sine(nt[1], tt) * Env(tt, 0.01f, nt[3] * 0.4f) * nt[2];
            }
            lp += la * (v - lp);
            return radio ? lp * 0.8f + Noise() * 0.004f : lp;
        };
    }
}
