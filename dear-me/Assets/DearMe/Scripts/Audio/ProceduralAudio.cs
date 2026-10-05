using UnityEngine;

namespace DearMe.Audio
{
    /// <summary>
    /// Placeholder sounds synthesized at runtime, so the slice has rain, a clock and a café
    /// without shipping audio files. AudioManager prefers real clips in Resources/DearMe/Audio
    /// with the same names when they exist.
    /// </summary>
    public static class ProceduralAudio
    {
        const int Rate = 22050;

        public static AudioClip Create(string id)
        {
            switch (id)
            {
                case "rain": return Loop(id, 6f, Rain);
                case "clock": return Loop(id, 2f, Clock);
                case "birds": return Loop(id, 7f, Birds);
                case "cafe": return Loop(id, 6f, Cafe);
                case "street": return Loop(id, 6f, Street);
                case "night": return Loop(id, 4f, Crickets);
                case "pad": return Loop(id, 8f, Pad);
                case "shutter": return OneShot(id, 0.25f, Shutter);
                case "paper": return OneShot(id, 0.45f, Paper);
                case "bell": return OneShot(id, 1.4f, Bell);
                case "buzz": return OneShot(id, 0.9f, Buzz);
                case "tick": return OneShot(id, 0.12f, (d, r) => Tick(d, 0, 2100f, 0.5f));
                case "chime": return OneShot(id, 2.2f, Chime);
                case "tap": return OneShot(id, 0.06f, (d, r) => Tick(d, 0, 1500f, 0.15f));
                case "pencil": return OneShot(id, 0.3f, Pencil);
                case "soft_ok": return OneShot(id, 0.6f, (d, r) => Tone(d, 0, 0.6f, new[] { 660f, 990f }, 0.12f));
                case "soft_no": return OneShot(id, 0.4f, (d, r) => Tone(d, 0, 0.4f, new[] { 330f }, 0.08f));
            }
            return null;
        }

        delegate void Fill(float[] data, System.Random rng);

        static AudioClip Loop(string id, float seconds, Fill fill) => Make(id, seconds, fill, true);
        static AudioClip OneShot(string id, float seconds, Fill fill) => Make(id, seconds, fill, false);

        static AudioClip Make(string id, float seconds, Fill fill, bool loop)
        {
            int n = Mathf.CeilToInt(seconds * Rate);
            var data = new float[n];
            fill(data, new System.Random(id.GetHashCode()));
            if (loop) Crossfade(data, Rate / 10);
            for (int i = 0; i < n; i++) data[i] = Mathf.Clamp(data[i], -1f, 1f);
            var clip = AudioClip.Create("proc_" + id, n, 1, Rate, false);
            clip.SetData(data, 0);
            return clip;
        }

        // Blend the tail into the head so loops have no click at the seam.
        static void Crossfade(float[] d, int len)
        {
            len = Mathf.Min(len, d.Length / 4);
            for (int i = 0; i < len; i++)
            {
                float t = (float)i / len;
                d[i] = d[i] * t + d[d.Length - len + i] * (1f - t);
            }
        }

        static float Noise(System.Random r) => (float)(r.NextDouble() * 2.0 - 1.0);

        static void Rain(float[] d, System.Random r)
        {
            float lp = 0f, lp2 = 0f;
            for (int i = 0; i < d.Length; i++)
            {
                lp += (Noise(r) - lp) * 0.35f;
                lp2 += (lp - lp2) * 0.5f;
                d[i] = lp2 * 0.35f;
            }
            for (int k = 0; k < (int)(d.Length / (float)Rate * 18f); k++)
            {
                int start = r.Next(d.Length);
                float amp = 0.08f + (float)r.NextDouble() * 0.12f;
                for (int j = 0; j < 220 && start + j < d.Length; j++)
                    d[start + j] += Noise(r) * amp * Mathf.Exp(-j / 40f);
            }
        }

        static void Tick(float[] d, int at, float freq, float amp)
        {
            for (int j = 0; j < Rate / 20 && at + j < d.Length; j++)
            {
                float t = j / (float)Rate;
                d[at + j] += Mathf.Sin(2f * Mathf.PI * freq * t) * amp * Mathf.Exp(-t * 180f);
            }
        }

        static void Clock(float[] d, System.Random r)
        {
            Tick(d, 0, 2200f, 0.35f);
            Tick(d, Rate, 1800f, 0.3f);
        }

        static void Birds(float[] d, System.Random r)
        {
            for (int k = 0; k < 5; k++)
            {
                int start = r.Next(d.Length - Rate / 2);
                float f0 = 2600f + (float)r.NextDouble() * 1400f;
                int notes = 2 + r.Next(3);
                for (int n = 0; n < notes; n++)
                {
                    int s = start + n * Rate / 9;
                    for (int j = 0; j < Rate / 14 && s + j < d.Length; j++)
                    {
                        float t = j / (float)Rate;
                        float f = f0 + 900f * t * 14f;
                        d[s + j] += Mathf.Sin(2f * Mathf.PI * f * t) * 0.08f * Mathf.Sin(Mathf.PI * j / (Rate / 14f));
                    }
                }
            }
        }

        static void Cafe(float[] d, System.Random r)
        {
            float b = 0f;
            for (int i = 0; i < d.Length; i++)
            {
                b = b * 0.995f + Noise(r) * 0.02f;
                d[i] = b * 0.9f;
            }
            for (int k = 0; k < 3; k++) Tone(d, r.Next(d.Length - Rate), 0.5f, new[] { 3100f + r.Next(600), 4700f }, 0.05f);
        }

        static void Street(float[] d, System.Random r)
        {
            float b = 0f;
            for (int i = 0; i < d.Length; i++)
            {
                b = b * 0.997f + Noise(r) * 0.02f;
                float swell = 0.6f + 0.4f * Mathf.Sin(2f * Mathf.PI * i / d.Length);
                d[i] = b * swell;
            }
        }

        static void Crickets(float[] d, System.Random r)
        {
            for (int i = 0; i < d.Length; i++)
            {
                float t = i / (float)Rate;
                float pulse = Mathf.Max(0f, Mathf.Sin(2f * Mathf.PI * 22f * t)) * (Mathf.Sin(2f * Mathf.PI * 0.5f * t) > 0.2f ? 1f : 0f);
                d[i] = Mathf.Sin(2f * Mathf.PI * 4400f * t) * 0.025f * pulse;
            }
        }

        static void Pad(float[] d, System.Random r)
        {
            float[] chord = { 220f, 277.18f, 329.63f, 440f };
            for (int i = 0; i < d.Length; i++)
            {
                float t = i / (float)Rate;
                float v = 0f;
                foreach (float f in chord) v += Mathf.Sin(2f * Mathf.PI * f * t) * (0.5f + 0.5f * Mathf.Sin(2f * Mathf.PI * (0.05f + f / 9000f) * t));
                d[i] = v * 0.03f;
            }
        }

        static void Shutter(float[] d, System.Random r)
        {
            for (int burst = 0; burst < 2; burst++)
            {
                int s = burst * Rate / 12;
                for (int j = 0; j < Rate / 40 && s + j < d.Length; j++) d[s + j] += Noise(r) * 0.4f * Mathf.Exp(-j / 120f);
            }
        }

        static void Paper(float[] d, System.Random r)
        {
            float lp = 0f;
            for (int i = 0; i < d.Length; i++)
            {
                lp += (Noise(r) - lp) * 0.6f;
                float env = Mathf.Sin(Mathf.PI * i / d.Length);
                d[i] = (Noise(r) - lp) * 0.18f * env * (0.6f + 0.4f * Mathf.Sin(i * 0.002f));
            }
        }

        static void Bell(float[] d, System.Random r) => Tone(d, 0, 1.4f, new[] { 1760f, 2637f }, 0.12f);

        static void Buzz(float[] d, System.Random r)
        {
            for (int burst = 0; burst < 2; burst++)
            {
                int s = burst * (int)(Rate * 0.5f);
                for (int j = 0; j < (int)(Rate * 0.3f) && s + j < d.Length; j++)
                {
                    float t = j / (float)Rate;
                    d[s + j] += Mathf.Sign(Mathf.Sin(2f * Mathf.PI * 170f * t)) * 0.05f;
                }
            }
        }

        static void Chime(float[] d, System.Random r) => Tone(d, 0, 2.2f, new[] { 880f, 1318.5f, 1760f }, 0.07f);

        static void Pencil(float[] d, System.Random r)
        {
            for (int i = 0; i < d.Length; i++)
                d[i] = Noise(r) * 0.06f * Mathf.Sin(Mathf.PI * i / d.Length) * (0.5f + 0.5f * Mathf.Sin(i * 0.01f));
        }

        static void Tone(float[] d, int at, float seconds, float[] freqs, float amp)
        {
            int n = (int)(seconds * Rate);
            for (int j = 0; j < n && at + j < d.Length; j++)
            {
                float t = j / (float)Rate;
                float env = Mathf.Min(1f, t * 200f) * Mathf.Exp(-t * 3.2f / seconds);
                float v = 0f;
                foreach (float f in freqs) v += Mathf.Sin(2f * Mathf.PI * f * t);
                d[at + j] += v * amp * env;
            }
        }
    }
}
