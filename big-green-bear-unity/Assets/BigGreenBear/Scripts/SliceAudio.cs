// SliceAudio.cs — every sound is synthesized at startup (no audio files, $0).
//
//   theme    a slow music-box melody (same notes as the HTML version)
//   rain     filtered noise; volume follows rain intensity
//   crowd    a distant festival murmur; fades as the night empties
//   bell     the small green bell
//   monitor  a hospital heart-monitor beep. It does not belong here.
//            Played faintly under the rain at the first memory slip; most
//            players will hear it as a car, or a phone, or nothing at all.
//
// As memory reliability falls, a low-pass filter closes on the music: it
// starts to sound like it's coming from underwater.
using UnityEngine;

namespace BigGreenBear
{
    public class SliceAudio : MonoBehaviour
    {
        const int Rate = 44100;
        AudioSource music, rain, crowd, sfx;
        AudioLowPassFilter musicFilter;
        AudioClip bell, monitor, chime, flatline;
        float crowdTarget = 0.5f, musicTarget = 0.55f, rainLevel;
        float memory = 100f;
        float duck; // music dips under the memory slip

        public void Init()
        {
            music = MakeSource("Music", true);
            musicFilter = music.gameObject.AddComponent<AudioLowPassFilter>();
            musicFilter.cutoffFrequency = 22000f;
            rain = MakeSource("Rain", true);
            crowd = MakeSource("Crowd", true);
            sfx = MakeSource("Sfx", false);

            music.clip = Theme();
            rain.clip = Noise("rain", 4f, 0.55f, 0.35f);
            crowd.clip = Crowd();
            bell = Bell();
            monitor = Beep(1000f, 0.13f);
            chime = Beep(1320f, 0.06f);
            flatline = Beep(1000f, 4.5f);

            music.volume = 0f; rain.volume = 0f; crowd.volume = 0f;
            music.Play(); rain.Play(); crowd.Play();
        }

        AudioSource MakeSource(string name, bool loop)
        {
            var go = new GameObject("Audio_" + name);
            go.transform.SetParent(transform, false);
            var s = go.AddComponent<AudioSource>();
            s.loop = loop;
            s.playOnAwake = false;
            s.spatialBlend = 0f;
            return s;
        }

        public void SetRain(float r) => rainLevel = r;
        public void SetCrowd(float c) => crowdTarget = c;
        public void SetMusic(float m) => musicTarget = m;
        public void SetMemory(float m) => memory = m;
        public void SetDuck(float d) => duck = Mathf.Clamp01(d);

        public void Play(string id)
        {
            switch (id)
            {
                case "bell": sfx.PlayOneShot(bell, 0.55f); break;
                case "monitor": sfx.PlayOneShot(monitor, 0.09f); break;
                case "chime": sfx.PlayOneShot(chime, 0.12f); break;
                case "flatline": sfx.PlayOneShot(flatline, 0.07f); break;
            }
        }

        void Update()
        {
            float k = 1f - Mathf.Exp(-1.2f * Time.deltaTime);
            music.volume = Mathf.Lerp(music.volume, musicTarget * (1f - 0.7f * duck), k);
            rain.volume = Mathf.Lerp(rain.volume, Mathf.Clamp01(rainLevel) * 0.75f, k);
            crowd.volume = Mathf.Lerp(crowd.volume, crowdTarget * 0.35f, k);
            // 100 -> 22 kHz (clear) ... 0 -> 600 Hz (underwater)
            float cutoff = 600f * Mathf.Pow(36f, memory / 100f);
            cutoff *= Mathf.Lerp(1f, 0.25f, duck);
            musicFilter.cutoffFrequency = Mathf.Lerp(musicFilter.cutoffFrequency, cutoff, k);
        }

        /* ---------------- synthesis ---------------- */

        static AudioClip Make(string name, float[] data)
        {
            var clip = AudioClip.Create(name, data.Length, 1, Rate, false);
            clip.SetData(data, 0);
            return clip;
        }

        static AudioClip Noise(string name, float seconds, float smooth, float gain)
        {
            int n = (int)(seconds * Rate);
            var d = new float[n];
            var rnd = new System.Random(7);
            float lp = 0f, lp2 = 0f;
            for (int i = 0; i < n; i++)
            {
                float w = (float)(rnd.NextDouble() * 2 - 1);
                lp += (w - lp) * smooth;
                lp2 += (lp - lp2) * 0.6f;
                float drop = rnd.NextDouble() < 0.0006 ? (float)(rnd.NextDouble() * 0.6) : 0f;
                d[i] = (lp - lp2 * 0.5f) * gain + drop * 0.15f;
            }
            return Make(name, Crossfade(d, Rate / 4));
        }

        static AudioClip Crowd()
        {
            int n = 8 * Rate;
            var d = new float[n];
            var rnd = new System.Random(3);
            float brown = 0f, lp = 0f;
            for (int i = 0; i < n; i++)
            {
                brown = Mathf.Clamp(brown + (float)(rnd.NextDouble() * 2 - 1) * 0.02f, -1f, 1f);
                lp += (brown - lp) * 0.05f;
                float t = i / (float)Rate;
                float swell = 0.6f + 0.4f * Mathf.Sin(t * 0.8f) * Mathf.Sin(t * 0.37f + 1f);
                d[i] = lp * swell * 0.9f;
            }
            return Make("crowd", Crossfade(d, Rate / 2));
        }

        static AudioClip Bell()
        {
            int n = (int)(2.6f * Rate);
            var d = new float[n];
            float[] f = { 1760f, 4410f, 5920f };
            float[] a = { 0.6f, 0.25f, 0.12f };
            for (int i = 0; i < n; i++)
            {
                float t = i / (float)Rate;
                float s = 0f;
                for (int p = 0; p < f.Length; p++) s += Mathf.Sin(2 * Mathf.PI * f[p] * t) * a[p] * Mathf.Exp(-t * (1.6f + p * 1.4f));
                d[i] = s * Mathf.Min(1f, t * 400f);
            }
            return Make("bell", d);
        }

        static AudioClip Beep(float freq, float len)
        {
            int n = (int)(len * Rate);
            var d = new float[n];
            for (int i = 0; i < n; i++)
            {
                float t = i / (float)Rate;
                float env = Mathf.Min(1f, t * 300f) * Mathf.Min(1f, (len - t) * 300f);
                d[i] = Mathf.Sin(2 * Mathf.PI * freq * t) * env * 0.8f;
            }
            return Make("beep" + freq, d);
        }

        // [semitones from A4, beats]
        static readonly float[,] Melody =
        {
            {3,1},{7,1},{10,2},{8,1},{7,1},{5,2},
            {3,1},{5,1},{7,1},{3,1},{2,4},
            {0,1},{3,1},{7,2},{5,1},{3,1},{2,2},
            {0,1},{2,1},{3,1},{-2,1},{0,4},
        };

        static AudioClip Theme()
        {
            const float beat = 0.78f;
            float total = 2f * beat; // rest at the end of the phrase
            for (int i = 0; i < Melody.GetLength(0); i++) total += Melody[i, 1] * beat;
            int n = (int)(total * Rate);
            var d = new float[n];
            float at = 0f;
            for (int i = 0; i < Melody.GetLength(0); i++)
            {
                float freq = 440f * Mathf.Pow(2f, Melody[i, 0] / 12f);
                float len = Melody[i, 1] * beat * 1.8f;
                int start = (int)(at * Rate);
                for (int j = 0; j < (int)(len * Rate) && start + j < n; j++)
                {
                    float t = j / (float)Rate;
                    float env = Mathf.Min(1f, t * 200f) * Mathf.Exp(-t * 2.4f);
                    float s = Mathf.Sin(2 * Mathf.PI * freq * t) * 0.22f + Mathf.Sin(2 * Mathf.PI * freq * 2f * t) * 0.06f + Mathf.Sin(2 * Mathf.PI * freq * 3f * t) * 0.02f;
                    d[start + j] += s * env;
                }
                // a soft low note under each bar
                if (i % 3 == 0)
                {
                    float bass = freq / 4f;
                    for (int j = 0; j < (int)(beat * 3f * Rate) && start + j < n; j++)
                    {
                        float t = j / (float)Rate;
                        d[start + j] += Mathf.Sin(2 * Mathf.PI * bass * t) * 0.08f * Mathf.Exp(-t * 1.2f) * Mathf.Min(1f, t * 50f);
                    }
                }
                at += Melody[i, 1] * beat;
            }
            return Make("theme", Crossfade(d, Rate / 3));
        }

        // Blend the tail into the head, then drop the tail, so the loop is seamless.
        static float[] Crossfade(float[] d, int len)
        {
            len = Mathf.Min(len, d.Length / 2);
            for (int i = 0; i < len; i++)
            {
                float k = i / (float)len;
                int end = d.Length - len + i;
                d[i] = d[i] * k + d[end] * (1f - k);
            }
            var o = new float[d.Length - len];
            System.Array.Copy(d, o, o.Length);
            return o;
        }
    }
}
