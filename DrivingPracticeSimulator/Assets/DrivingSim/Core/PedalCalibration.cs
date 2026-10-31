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
        /// <summary>Key-down events per key in this attempt (more than 1 = chatter, or two presses merged).</summary>
        public Dictionary<int, int> KeyDowns { get; } = new Dictionary<int, int>();
        /// <summary>Keys whose release was never reported (forced up after the stuck timeout).</summary>
        public HashSet<int> ReleaseMissing { get; } = new HashSet<int>();
        /// <summary>Time from the first to the last new key going down. Large values suggest presses were merged.</summary>
        public float OnsetSpreadSeconds { get; set; }
        /// <summary>Idle time before this attempt started (from the previous attempt's last release).</summary>
        public float GapBeforeSeconds { get; set; } = float.PositiveInfinity;
    }

    /// <summary>
    /// Splits a stream of key events into foot-press attempts. An attempt ends once every key has
    /// been released for <see cref="ReleaseGapSeconds"/>, so a foot that briefly lifts one key
    /// (bounce, ghosting) still counts as one press. Keys are opaque integer codes.
    /// </summary>
    public sealed class PedalAttemptRecorder
    {
        readonly Dictionary<int, float> held = new Dictionary<int, float>();
        readonly List<PedalAttempt> attempts = new List<PedalAttempt>();
        HashSet<int> current;
        Dictionary<int, int> currentDowns;
        HashSet<int> currentMissing;
        int maxSimultaneous;
        float startTime;
        float lastNewKeyTime;
        float releasedTime = -1f;
        float lastAttemptEnd = float.NegativeInfinity;

        public PedalAttemptRecorder(int requiredAttempts = 5, float releaseGapSeconds = 0.2f, float stuckKeySeconds = 3f)
        {
            RequiredAttempts = Math.Max(1, requiredAttempts);
            ReleaseGapSeconds = Math.Max(0f, releaseGapSeconds);
            StuckKeySeconds = Math.Max(0.5f, stuckKeySeconds);
        }

        public int RequiredAttempts { get; }
        /// <summary>Grouping interval: all keys must stay up this long before an attempt ends.</summary>
        public float ReleaseGapSeconds { get; }
        /// <summary>A key held longer than this during calibration is treated as a missed release.</summary>
        public float StuckKeySeconds { get; }
        public IReadOnlyList<PedalAttempt> Attempts => attempts;
        public bool IsComplete => attempts.Count >= RequiredAttempts;
        public bool IsPressing => held.Count > 0;
        public IReadOnlyCollection<int> CurrentKeys => (IReadOnlyCollection<int>)current ?? Array.Empty<int>();

        public void KeyDown(int key, float time)
        {
            if (IsComplete || held.ContainsKey(key)) return; // OS key repeat is not a new press
            if (current == null)
            {
                current = new HashSet<int>();
                currentDowns = new Dictionary<int, int>();
                currentMissing = new HashSet<int>();
                maxSimultaneous = 0;
                startTime = time;
                lastNewKeyTime = time;
            }
            held[key] = time;
            if (current.Add(key)) lastNewKeyTime = time;
            currentDowns[key] = currentDowns.TryGetValue(key, out int n) ? n + 1 : 1;
            maxSimultaneous = Math.Max(maxSimultaneous, held.Count);
            releasedTime = -1f;
        }

        public void KeyUp(int key, float time)
        {
            if (!held.Remove(key)) return;
            if (held.Count == 0 && current != null) releasedTime = time;
        }

        /// <summary>Returns true when an attempt was completed by this call.</summary>
        public bool Update(float time)
        {
            if (current == null) return false;

            // A release the keyboard never reported would block calibration forever.
            if (held.Count > 0)
            {
                List<int> stuck = null;
                foreach (KeyValuePair<int, float> pair in held)
                    if (time - pair.Value > StuckKeySeconds) (stuck ?? (stuck = new List<int>())).Add(pair.Key);
                if (stuck == null) return false;
                foreach (int key in stuck) { held.Remove(key); currentMissing.Add(key); }
                if (held.Count > 0) return false;
                releasedTime = time;
            }

            if (releasedTime < 0f || time - releasedTime < ReleaseGapSeconds) return false;

            var attempt = new PedalAttempt(current, maxSimultaneous, releasedTime - startTime)
            {
                OnsetSpreadSeconds = lastNewKeyTime - startTime,
                GapBeforeSeconds = startTime - lastAttemptEnd,
            };
            foreach (KeyValuePair<int, int> pair in currentDowns) attempt.KeyDowns[pair.Key] = pair.Value;
            attempt.ReleaseMissing.UnionWith(currentMissing);
            attempts.Add(attempt);
            lastAttemptEnd = releasedTime;
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
            lastAttemptEnd = float.NegativeInfinity;
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

        /// <summary>Total key-down events per key across all attempts.</summary>
        public Dictionary<int, int> KeyDowns { get; } = new Dictionary<int, int>();

        /// <summary>Keys whose release was missed at least once.</summary>
        public HashSet<int> ReleaseMissing { get; } = new HashSet<int>();

        /// <summary>Attempts where some key went down more than once: chatter, or two presses merged by the grouping interval.</summary>
        public int AttemptsWithRepeatedKeys { get; set; }

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
                bool repeated = false;
                foreach (KeyValuePair<int, int> pair in attempt.KeyDowns)
                {
                    result.KeyDowns[pair.Key] = (result.KeyDowns.TryGetValue(pair.Key, out int d) ? d : 0) + pair.Value;
                    repeated |= pair.Value > 1;
                }
                if (repeated) result.AttemptsWithRepeatedKeys++;
                result.ReleaseMissing.UnionWith(attempt.ReleaseMissing);
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

        /// <summary>Every key seen in both calibrations, mapped or not. Shown to the player as ambiguous.</summary>
        public static List<int> AmbiguousKeys(PedalKeyAnalysis brake, PedalKeyAnalysis accelerator) =>
            brake.Counts.Keys.Where(accelerator.Counts.ContainsKey).OrderBy(k => k).ToList();

        /// <summary>
        /// A key may belong to only one pedal. A key proposed for both stays with a pedal only if it
        /// appeared there at least <paramref name="dominanceMargin"/> more times; otherwise it is
        /// removed from both and returned as unresolved. Either way it remains flagged as ambiguous
        /// (<see cref="AmbiguousKeys"/>) so the player can review it.
        /// </summary>
        public static List<int> ResolveConflicts(PedalKeyAnalysis brake, PedalKeyAnalysis accelerator, int dominanceMargin = 2)
        {
            var conflicts = new List<int>();
            foreach (int key in brake.Selected.Intersect(accelerator.Selected).ToList())
            {
                int b = brake.Counts.TryGetValue(key, out int bc) ? bc : 0;
                int a = accelerator.Counts.TryGetValue(key, out int ac) ? ac : 0;
                if (b - a >= dominanceMargin) accelerator.Selected.Remove(key);
                else if (a - b >= dominanceMargin) brake.Selected.Remove(key);
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
