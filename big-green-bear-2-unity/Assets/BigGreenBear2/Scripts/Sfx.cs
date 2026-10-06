// Sfx.cs — section 30 hooks. Replace the synthesized ticks with real paper / pencil / clock samples later.
using UnityEngine;

namespace BigGreenBear2
{
    public static class Sfx
    {
        static AudioSource src;

        public static void Cue(string name)
        {
            float f; float d;
            switch (name)
            {
                case "shuffle": f = 180f; d = 0.05f; break;
                case "tap": f = 320f; d = 0.03f; break;
                case "pencil": f = 900f; d = 0.04f; break;
                case "chime": f = 660f; d = 0.6f; break;
                default: return;                       // "stop" = silence: the pencil just stops
            }
            if (src == null)
            {
                var go = new GameObject("Sfx");
                Object.DontDestroyOnLoad(go);
                src = go.AddComponent<AudioSource>();
            }
            int rate = 44100, n = (int)(rate * d);
            var data = new float[n];
            for (int i = 0; i < n; i++) data[i] = Mathf.Sin(2f * Mathf.PI * f * i / rate) * (1f - (float)i / n) * 0.05f;
            var clip = AudioClip.Create("cue", n, 1, rate, false);
            clip.SetData(data, 0);
            src.PlayOneShot(clip);
        }
    }
}
