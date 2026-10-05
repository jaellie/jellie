using System.Collections.Generic;
using System.Linq;
using DearMe.Content;
using DearMe.Layout;
using DearMe.Save;
using DearMe.Story;
using static DearMe.Tests.Program;

namespace DearMe.Tests
{
    public static class FlowLineTests
    {
        public static void Run()
        {
            var lineOf = new List<int>();
            var widths = new List<float>();

            // [이번][주에] [신청|하려고 해|.] — glued units never split.
            FlowLines.Break(new float[] { 40, 40, 30, 60, 5 }, new[] { false, false, false, true, true }, 100f, 8f, lineOf, widths);
            Check(lineOf.SequenceEqual(new[] { 0, 0, 1, 1, 1 }), "glued unit moves to next line as a whole: " + string.Join(",", lineOf));
            Check(widths.Count == 2 && widths[0] == 88f && widths[1] == 95f, "line widths include spacing only between units");

            FlowLines.Break(new float[] { 30, 500, 30 }, new[] { false, false, false }, 100f, 8f, lineOf, widths);
            Check(lineOf.SequenceEqual(new[] { 0, 1, 2 }), "overlong unit gets a line of its own");

            FlowLines.Break(new float[0], new bool[0], 100f, 8f, lineOf, widths);
            Check(lineOf.Count == 0 && widths.Count == 0, "empty line");

            FlowLines.Break(new float[] { 10, 10, 10 }, new[] { false, false, false }, 1f, 8f, lineOf, widths);
            Check(lineOf.SequenceEqual(new[] { 0, 1, 2 }), "zero-ish width still terminates");
        }
    }

    public static class SanitizerTests
    {
        public static void Run()
        {
            var node = new StoryNode { id = null, effects = null, choices = new ChoiceDef[] { null }, transition = null, cases = null };
            ContentSanitizer.Sanitize(node);
            Check(node.id == "" && node.effects.Length == 0 && node.cases.Length == 0, "strings and arrays");
            Check(node.transition != null && node.transition.ambience != null, "nested objects");
            Check(node.choices[0] != null && node.choices[0].effects != null, "null array elements replaced");

            var save = new SaveData { state = new StoryState { flags = null, patterns = new List<PatternProgress> { null, new PatternProgress { chaptersSeen = null } } } };
            ContentSanitizer.Sanitize(save);
            Check(save.state.flags != null && save.state.patterns.Count == 1 && save.state.patterns[0].chaptersSeen != null, "lists in saves");
            Check(ContentSanitizer.Sanitize<StoryNode>(null) == null, "null input");
        }
    }
}
