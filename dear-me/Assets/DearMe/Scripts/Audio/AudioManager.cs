using System.Collections.Generic;
using DearMe.Settings;
using UnityEngine;

namespace DearMe.Audio
{
    /// <summary>
    /// Ambience layers (rain, clock, café…), one-shot effects, and sparse music. Silence is a
    /// choice here: music only plays on the title screen; scenes rely on room sound.
    /// </summary>
    public class AudioManager : MonoBehaviour
    {
        GameSettings settings;
        readonly Dictionary<string, AudioClip> clips = new Dictionary<string, AudioClip>();
        readonly Dictionary<string, AudioSource> ambience = new Dictionary<string, AudioSource>();
        readonly HashSet<string> wanted = new HashSet<string>();
        AudioSource sfx;
        AudioSource music;
        bool musicWanted;

        const float AmbienceLevel = 0.55f;
        const float FadeSpeed = 0.8f; // volume units per second

        public void Init(GameSettings settings)
        {
            this.settings = settings;
            sfx = gameObject.AddComponent<AudioSource>();
            sfx.playOnAwake = false;
            music = gameObject.AddComponent<AudioSource>();
            music.playOnAwake = false;
            music.loop = true;
            music.volume = 0f;
        }

        AudioClip Clip(string id)
        {
            if (clips.TryGetValue(id, out var c)) return c;
            // Real assets win over placeholders when present.
            c = Resources.Load<AudioClip>("DearMe/Audio/" + id);
            if (c == null) c = ProceduralAudio.Create(id);
            if (c == null) Debug.LogWarning("[DearMe] No audio for '" + id + "'");
            clips[id] = c;
            return c;
        }

        public void SetAmbience(IEnumerable<string> ids)
        {
            wanted.Clear();
            if (ids != null) foreach (var id in ids) wanted.Add(id);
            foreach (var id in wanted)
            {
                if (ambience.ContainsKey(id)) continue;
                var clip = Clip(id);
                if (clip == null) continue;
                var src = gameObject.AddComponent<AudioSource>();
                src.clip = clip;
                src.loop = true;
                src.volume = 0f;
                src.playOnAwake = false;
                // Offset each layer so loops don't line up audibly.
                src.time = Random.Range(0f, clip.length * 0.9f);
                src.Play();
                ambience[id] = src;
            }
        }

        public void PlaySfx(string id)
        {
            var clip = Clip(id);
            if (clip != null && settings.soundVolume > 0f) sfx.PlayOneShot(clip, settings.soundVolume);
        }

        public void SetMusic(bool on)
        {
            musicWanted = on;
            if (on && music.clip == null) music.clip = Clip("pad");
            if (on && !music.isPlaying && music.clip != null) music.Play();
        }

        void Update()
        {
            float step = FadeSpeed * Mathf.Min(Time.unscaledDeltaTime, 0.1f);
            var finished = new List<string>();
            foreach (var kv in ambience)
            {
                float target = wanted.Contains(kv.Key) ? AmbienceLevel * settings.soundVolume : 0f;
                kv.Value.volume = Mathf.MoveTowards(kv.Value.volume, target, step);
                if (target == 0f && kv.Value.volume <= 0.001f) finished.Add(kv.Key);
            }
            foreach (var id in finished)
            {
                Destroy(ambience[id]);
                ambience.Remove(id);
            }

            float musicTarget = musicWanted ? 0.5f * settings.musicVolume : 0f;
            music.volume = Mathf.MoveTowards(music.volume, musicTarget, step * 0.5f);
            if (!musicWanted && music.isPlaying && music.volume <= 0.001f) music.Stop();
        }
    }
}
