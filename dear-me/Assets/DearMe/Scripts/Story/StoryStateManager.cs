using System;
using System.Collections.Generic;
using DearMe.Content;
using DearMe.Language;

namespace DearMe.Story
{
    /// <summary>
    /// Owns the <see cref="StoryState"/> and is the only thing that mutates it from content.
    /// Content talks to it through two tiny string languages:
    ///
    /// Conditions: flag:x  !flag:x  clue:x  var:x  loop>=N  loop==N  inspected>=N  phase>=LetterFound
    /// Effects:    set:x  unset:x  clue:x  var:x=value  phase:LetterFound  chapter:N  loop:N  loop:end
    ///             use:patternId  photo:photoId=stateId  notify:kind  sfx:name  ending:x
    /// </summary>
    public class StoryStateManager
    {
        public StoryState State { get; private set; }
        public PatternTracker Patterns { get; private set; }
        public TimeLoopManager Loops { get; private set; }
        readonly ContentDatabase db;

        public event Action<StoryPhase> PhaseChanged;
        public event Action<string, string> PhotoChanged;
        /// <summary>Quiet notices such as "memory" (shown as a subtle MEMORY UPDATED).</summary>
        public event Action<string> Notified;
        public event Action<string> SfxRequested;
        public event Action<string> Warning;

        public StoryStateManager(ContentDatabase db, StoryState state = null)
        {
            this.db = db;
            Reset(state ?? new StoryState());
        }

        public void Reset(StoryState state)
        {
            State = state;
            Patterns = new PatternTracker(state, db);
            Loops = new TimeLoopManager(state);
        }

        // ------------------------------------------------------------ queries

        public bool HasFlag(string flag) => State.flags.Contains(flag);

        public string GetVar(string name) => StoryState.Get(State.vars, name);

        public string PhotoStateOf(string photoId)
        {
            var s = StoryState.Get(State.photoMemoryState, photoId);
            return s.Length > 0 ? s : "v1";
        }

        public bool Evaluate(string[] conditions)
        {
            if (conditions == null) return true;
            foreach (var c in conditions)
                if (!Evaluate(c)) return false;
            return true;
        }

        public bool Evaluate(string condition)
        {
            if (string.IsNullOrWhiteSpace(condition)) return true;
            string c = condition.Trim();
            bool negate = c.StartsWith("!");
            if (negate) c = c.Substring(1);
            return negate ? !EvaluateRaw(c, condition) : EvaluateRaw(c, condition);
        }

        bool EvaluateRaw(string c, string original)
        {
            if (TrySplitPrefix(c, "flag:", out var flag)) return HasFlag(flag);
            if (TrySplitPrefix(c, "clue:", out var clue)) return State.clues.Contains(clue);
            if (TrySplitPrefix(c, "var:", out var v)) return GetVar(v).Length > 0;
            if (TryCompare(c, "loop", State.currentLoop, out bool loopResult)) return loopResult;
            if (TryCompare(c, "inspected", State.inspectedObjects.Count, out bool inspResult)) return inspResult;
            if (c.StartsWith("phase>="))
            {
                if (Enum.TryParse(c.Substring(7), out StoryPhase p)) return State.phase >= p;
            }
            Warning?.Invoke("Unknown condition: " + original);
            return false;
        }

        static bool TrySplitPrefix(string s, string prefix, out string rest)
        {
            if (s.StartsWith(prefix, StringComparison.Ordinal)) { rest = s.Substring(prefix.Length); return true; }
            rest = null;
            return false;
        }

        static bool TryCompare(string c, string name, int value, out bool result)
        {
            result = false;
            if (!c.StartsWith(name, StringComparison.Ordinal)) return false;
            string op = c.Substring(name.Length);
            string[] ops = { ">=", "<=", "==", ">", "<" };
            foreach (var o in ops)
            {
                if (!op.StartsWith(o, StringComparison.Ordinal)) continue;
                if (!int.TryParse(op.Substring(o.Length), out int n)) return false;
                switch (o)
                {
                    case ">=": result = value >= n; break;
                    case "<=": result = value <= n; break;
                    case "==": result = value == n; break;
                    case ">": result = value > n; break;
                    case "<": result = value < n; break;
                }
                return true;
            }
            return false;
        }

        public static bool IsValidCondition(string condition)
        {
            var probe = new StoryStateManager(new ContentDatabase());
            bool ok = true;
            probe.Warning += _ => ok = false;
            probe.Evaluate(condition);
            return ok;
        }

        // ------------------------------------------------------------ mutations

        public void SetFlag(string flag)
        {
            if (!State.flags.Contains(flag)) State.flags.Add(flag);
        }

        public void Apply(string[] effects)
        {
            if (effects == null) return;
            foreach (var e in effects) Apply(e);
        }

        public void Apply(string effect)
        {
            if (string.IsNullOrWhiteSpace(effect)) return;
            string e = effect.Trim();
            int colon = e.IndexOf(':');
            string verb = colon < 0 ? e : e.Substring(0, colon);
            string arg = colon < 0 ? "" : e.Substring(colon + 1);

            switch (verb)
            {
                case "set": SetFlag(arg); break;
                case "unset": State.flags.Remove(arg); break;
                case "clue": if (!State.clues.Contains(arg)) State.clues.Add(arg); break;
                case "var":
                {
                    int eq = arg.IndexOf('=');
                    if (eq > 0) StoryState.Set(State.vars, arg.Substring(0, eq), arg.Substring(eq + 1));
                    else Warning?.Invoke("Bad var effect: " + effect);
                    break;
                }
                case "phase":
                    if (Enum.TryParse(arg, out StoryPhase phase))
                    {
                        if (phase != State.phase) { State.phase = phase; PhaseChanged?.Invoke(phase); }
                    }
                    else Warning?.Invoke("Unknown phase: " + effect);
                    break;
                case "chapter":
                    if (int.TryParse(arg, out int ch)) State.currentChapter = ch;
                    else Warning?.Invoke("Bad chapter: " + effect);
                    break;
                case "loop":
                    if (arg == "end") Loops.EndLoop();
                    else if (int.TryParse(arg, out int loop)) Loops.SetLoop(loop);
                    else Warning?.Invoke("Bad loop: " + effect);
                    break;
                case "use": Patterns.Record(arg, PracticeKind.ContextualUse); break;
                case "photo":
                {
                    int eq = arg.IndexOf('=');
                    if (eq <= 0) { Warning?.Invoke("Bad photo effect: " + effect); break; }
                    string id = arg.Substring(0, eq), st = arg.Substring(eq + 1);
                    if (PhotoStateOf(id) != st)
                    {
                        StoryState.Set(State.photoMemoryState, id, st);
                        PhotoChanged?.Invoke(id, st);
                    }
                    break;
                }
                case "notify": Notified?.Invoke(arg); break;
                case "sfx": SfxRequested?.Invoke(arg); break;
                case "ending": State.ending = arg; break;
                default: Warning?.Invoke("Unknown effect: " + effect); break;
            }
        }

        public static bool IsValidEffect(string effect)
        {
            var probe = new StoryStateManager(new ContentDatabase());
            bool ok = true;
            probe.Warning += _ => ok = false;
            probe.Apply(effect);
            return ok;
        }

        public void RecordInspection(string objectId)
        {
            if (!State.inspectedObjects.Contains(objectId)) State.inspectedObjects.Add(objectId);
        }

        public void RecordVisit(string locationId)
        {
            State.currentLocation = locationId;
            if (!State.visitedLocations.Contains(locationId)) State.visitedLocations.Add(locationId);
        }

        public void RecordHistory(string nodeId)
        {
            State.dialogueHistory.Add(nodeId);
            if (State.dialogueHistory.Count > StoryState.MaxHistory)
                State.dialogueHistory.RemoveRange(0, State.dialogueHistory.Count - StoryState.MaxHistory);
        }

        public void RecordChoice(string nodeId, int index)
        {
            State.choices.Add(new ChoiceRecord { nodeId = nodeId, index = index, loop = State.currentLoop });
        }

        /// <summary>Replaces $name$ with story variables (e.g. the sentence the player built).</summary>
        public string Substitute(string text)
        {
            if (string.IsNullOrEmpty(text) || text.IndexOf('$') < 0) return text;
            var sb = new System.Text.StringBuilder();
            int i = 0;
            while (i < text.Length)
            {
                int start = text.IndexOf('$', i);
                if (start < 0) { sb.Append(text, i, text.Length - i); break; }
                int end = text.IndexOf('$', start + 1);
                if (end < 0) { sb.Append(text, i, text.Length - i); break; }
                sb.Append(text, i, start - i);
                sb.Append(GetVar(text.Substring(start + 1, end - start - 1)));
                i = end + 1;
            }
            return sb.ToString();
        }
    }

    /// <summary>Tracks which repetition of the day the player is in.</summary>
    public class TimeLoopManager
    {
        readonly StoryState state;
        public event Action<int> LoopStarted;

        public TimeLoopManager(StoryState state) { this.state = state; }

        public int CurrentLoop => state.currentLoop;

        public void SetLoop(int loop)
        {
            if (loop == state.currentLoop) return;
            state.currentLoop = loop;
            LoopStarted?.Invoke(loop);
        }

        /// <summary>Ends the current day. Flags written as "loop.*" belong to one day and are forgotten.</summary>
        public void EndLoop()
        {
            state.flags.RemoveAll(f => f.StartsWith("loop.", StringComparison.Ordinal));
            SetLoop(state.currentLoop + 1);
        }

        public List<ChoiceRecord> ChoicesInLoop(int loop) => state.choices.FindAll(c => c.loop == loop);
    }
}
