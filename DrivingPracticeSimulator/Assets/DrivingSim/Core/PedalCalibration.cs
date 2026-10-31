using System;
using System.Collections.Generic;
using System.Linq;

namespace DrivingSim.Core
{
    /// <summary>One foot press: every key seen between the first key down and all keys released.</summary>
    public sealed class PedalAttempt
    {
        public PedalAttempt(IEnumerable<int> keys, int maxSimultaneous, float durationSeconds)
        {
            Keys = new HashSet<int>(keys);
            MaxSimultaneous = maxSimultaneous;
            DurationSeconds = durationSeconds;
        }

        public HashSet<int> Keys { get; }
        public int MaxSimultaneous { get; }
        public float DurationSeconds { get; }
    }

    /// <summary>
    /// Splits a stream of key events into foot-press attempts. An attempt ends once every key has
    /// been released for <see cref="ReleaseGapSeconds"/>, so a foot that briefly lifts one key
    /// (bounce, ghosting) still counts as one press. Keys are opaque integer codes.
    /// </summary>
    public sealed class PedalAttemptRecorder
    {
        readonly HashSet<int> held = new HashSet<int>();
        readonly List<PedalAttempt> attempts = new List<PedalAttempt>();
        HashSet<int> current;
        int maxSimultaneous;
        float startTime;
        float releasedTime = -1f;

        public PedalAttemptRecorder(int requiredAttempts = 5, float releaseGapSeconds = 0.2f)
        {
            RequiredAttempts = Math.Max(1, requiredAttempts);
            ReleaseGapSeconds = Math.Max(0f, releaseGapSeconds);
        }

        public int RequiredAttempts { get; }
        public float ReleaseGapSeconds { get; }
        public IReadOnlyList<PedalAttempt> Attempts => attempts;
        public bool IsComplete => attempts.Count >= RequiredAttempts;
        public bool IsPressing => held.Count > 0;
        public IReadOnlyCollection<int> CurrentKeys => (IReadOnlyCollection<int>)current ?? Array.Empty<int>();

        public void KeyDown(int key, float time)
        {
            if (IsComplete) return;
            if (current == null)
            {
                current = new HashSet<int>();
                maxSimultaneous = 0;
                startTime = time;
            }
            held.Add(key);
            current.Add(key);
            maxSimultaneous = Math.Max(maxSimultaneous, held.Count);
            releasedTime = -1f;
        }

        public void KeyUp(int key, float time)
        {
            held.Remove(key);
            if (held.Count == 0 && current != null) releasedTime = time;
        }

        /// <summary>Returns true when an attempt was completed by this call.</summary>
        public bool Update(float time)
        {
            if (current == null || held.Count > 0 || releasedTime < 0f) return false;
            if (time - releasedTime < ReleaseGapSeconds) return false;

            attempts.Add(new PedalAttempt(current, maxSimultaneous, releasedTime - startTime));
            current = null;
            releasedTime = -1f;
            return true;
        }

        public void Reset()
        {
            held.Clear();
            attempts.Clear();
            current = null;
            releasedTime = -1f;
        }
    }

    public sealed class PedalKeyAnalysis
    {
        /// <summary>Keys seen in at least the minimum number of attempts: the proposed mapping.</summary>
        public List<int> Selected { get; } = new List<int>();

        /// <summary>Keys seen fewer times. Not mapped unless the player includes them.</summary>
        public List<int> Occasional { get; } = new List<int>();

        /// <summary>How many attempts each key appeared in.</summary>
        public Dictionary<int, int> Counts { get; } = new Dictionary<int, int>();

        public int AttemptCount { get; set; }
        public int MaxSimultaneous { get; set; }

        /// <summary>Heuristic only: the keyboard may drop keys when several are pressed (rollover/ghosting).</summary>
        public bool PossibleRolloverLimit { get; set; }
    }

    public static class PedalCalibrationAnalyzer
    {
        public static PedalKeyAnalysis Analyze(IReadOnlyList<PedalAttempt> attempts, int minOccurrences = 2)
        {
            var result = new PedalKeyAnalysis { AttemptCount = attempts.Count };
            foreach (PedalAttempt attempt in attempts)
            {
                foreach (int key in attempt.Keys)
                    result.Counts[key] = result.Counts.TryGetValue(key, out int n) ? n + 1 : 1;
                result.MaxSimultaneous = Math.Max(result.MaxSimultaneous, attempt.MaxSimultaneous);
            }

            int threshold = Math.Max(1, Math.Min(minOccurrences, Math.Max(attempts.Count, 1)));
            foreach (KeyValuePair<int, int> pair in result.Counts.OrderByDescending(p => p.Value).ThenBy(p => p.Key))
                (pair.Value >= threshold ? result.Selected : result.Occasional).Add(pair.Key);

            // A foot rarely hits exactly the same keys; if nothing recurs, fall back to the most frequent keys.
            if (result.Selected.Count == 0 && result.Counts.Count > 0)
            {
                int best = result.Counts.Values.Max();
                foreach (int key in result.Occasional.Where(k => result.Counts[k] == best).ToList())
                {
                    result.Selected.Add(key);
                    result.Occasional.Remove(key);
                }
            }

            result.PossibleRolloverLimit = DetectRolloverLimit(attempts);
            return result;
        }

        /// <summary>
        /// Flags keyboards that never report more than two simultaneous keys, or that cap at exactly
        /// six (USB boot-protocol 6KRO) in most attempts. A hint for the player, not a measurement.
        /// </summary>
        public static bool DetectRolloverLimit(IReadOnlyList<PedalAttempt> attempts)
        {
            if (attempts.Count == 0) return false;
            int max = attempts.Max(a => a.MaxSimultaneous);
            bool manyKeysPerPress = attempts.Average(a => a.Keys.Count) > max;
            if (max <= 2 && manyKeysPerPress) return true;
            int cappedAtSix = attempts.Count(a => a.MaxSimultaneous == 6);
            return cappedAtSix >= Math.Max(2, (attempts.Count + 1) / 2);
        }

        /// <summary>
        /// A key may belong to only one pedal. It stays with the pedal it appeared in more often;
        /// on a tie it is removed from both and reported as a conflict.
        /// </summary>
        public static List<int> ResolveConflicts(PedalKeyAnalysis brake, PedalKeyAnalysis accelerator)
        {
            var conflicts = new List<int>();
            foreach (int key in brake.Selected.Intersect(accelerator.Selected).ToList())
            {
                int b = brake.Counts.TryGetValue(key, out int bc) ? bc : 0;
                int a = accelerator.Counts.TryGetValue(key, out int ac) ? ac : 0;
                if (b > a) accelerator.Selected.Remove(key);
                else if (a > b) brake.Selected.Remove(key);
                else
                {
                    brake.Selected.Remove(key);
                    accelerator.Selected.Remove(key);
                    conflicts.Add(key);
                }
            }
            brake.Occasional.RemoveAll(k => accelerator.Selected.Contains(k));
            accelerator.Occasional.RemoveAll(k => brake.Selected.Contains(k));
            return conflicts;
        }
    }
}
