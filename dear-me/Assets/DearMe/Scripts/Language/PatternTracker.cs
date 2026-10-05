using System.Collections.Generic;
using DearMe.Content;
using DearMe.Story;

namespace DearMe.Language
{
    public enum PracticeKind { Exposure, Recognition, Production, ContextualUse }

    /// <summary>
    /// Counts how a grammar pattern has been met and used, and derives an internal
    /// mastery state. The player never sees a "mastery bar"; this drives recycling
    /// decisions and debugging only.
    /// </summary>
    public class PatternTracker
    {
        readonly StoryState state;
        readonly ContentDatabase db;

        public event System.Action<string, MasteryState> MasteryChanged;

        public PatternTracker(StoryState state, ContentDatabase db)
        {
            this.state = state;
            this.db = db;
        }

        public PatternProgress Get(string patternId)
        {
            foreach (var p in state.patterns)
                if (p.patternId == patternId) return p;
            var created = new PatternProgress { patternId = patternId };
            state.patterns.Add(created);
            return created;
        }

        public void Record(string patternId, PracticeKind kind)
        {
            if (string.IsNullOrEmpty(patternId)) return;
            var p = Get(patternId);
            switch (kind)
            {
                case PracticeKind.Exposure: p.exposureCount++; break;
                case PracticeKind.Recognition: p.recognitionCount++; break;
                case PracticeKind.Production: p.productionCount++; break;
                case PracticeKind.ContextualUse: p.contextualUseCount++; break;
            }
            if (state.currentChapter > 0 && !p.chaptersSeen.Contains(state.currentChapter))
                p.chaptersSeen.Add(state.currentChapter);

            var next = Evaluate(p, IntroducedChapter(patternId));
            // Mastery never goes backwards: a later lapse is a reason to recycle, not to demote.
            if (next > p.masteryState)
            {
                p.masteryState = next;
                MasteryChanged?.Invoke(patternId, next);
            }
        }

        public void RecordLine(DialogueLine line)
        {
            // One exposure per pattern per line, even if a line contains it twice.
            var seen = new HashSet<string>();
            foreach (var t in line.tokens)
                if (t.patternId.Length > 0 && seen.Add(t.patternId))
                    Record(t.patternId, PracticeKind.Exposure);
        }

        int IntroducedChapter(string patternId) =>
            db != null && db.Patterns.TryGetValue(patternId, out var def) ? def.chapterIntroduced : 1;

        public static MasteryState Evaluate(PatternProgress p, int chapterIntroduced)
        {
            bool recycled = false;
            foreach (int c in p.chaptersSeen) if (c > chapterIntroduced) recycled = true;
            int meaningful = p.recognitionCount + p.productionCount + p.contextualUseCount;

            if (recycled && p.contextualUseCount >= 2 && meaningful >= 8) return MasteryState.Mastered;
            if (recycled && p.contextualUseCount >= 1) return MasteryState.Recycled;
            if (p.contextualUseCount >= 1 && p.productionCount >= 1) return MasteryState.Used;
            if (p.productionCount >= 2) return MasteryState.Practiced;
            if (p.recognitionCount >= 1) return MasteryState.Recognized;
            if (p.exposureCount >= 1) return MasteryState.Introduced;
            return MasteryState.None;
        }
    }
}
