using System.Collections.Generic;
using System.Text;
using DearMe.Content;

namespace DearMe.Language
{
    public enum Verdict
    {
        Correct,
        /// <summary>Grammatical, but not natural here (or not the form this task asks for).</summary>
        Unnatural,
        Incorrect,
    }

    public class DrillFeedback
    {
        public Verdict verdict;
        /// <summary>Close to an accepted answer (same pieces, different order).</summary>
        public bool almost;
        /// <summary>Empty means "use the generic line for this verdict" (ui.json fb_*).</summary>
        public string ko = "";
        public string en = "";
        public string[] effects = new string[0];
        /// <summary>The sentence the player produced, as markup, for drills that store it.</summary>
        public string producedMarkup = "";
        public string producedEnglish = "";
    }

    /// <summary>Pure answer checking for every drill kind. No UI, no randomness.</summary>
    public static class DrillEvaluator
    {
        public static DrillFeedback EvaluateOption(DrillDef drill, int index)
        {
            if (index < 0 || index >= drill.options.Length)
                return new DrillFeedback { verdict = Verdict.Incorrect };
            var o = drill.options[index];
            return new DrillFeedback
            {
                verdict = o.correct ? Verdict.Correct : o.grammaticalOnly ? Verdict.Unnatural : Verdict.Incorrect,
                ko = o.feedbackKo,
                en = o.feedbackEn,
                effects = o.effects,
                producedMarkup = o.ko,
                producedEnglish = o.en,
            };
        }

        public static DrillFeedback EvaluateSubstitution(SubstitutionItem item, int choice)
        {
            bool ok = choice == item.answer;
            return new DrillFeedback
            {
                verdict = ok ? Verdict.Correct : Verdict.Incorrect,
                ko = ok ? "" : item.feedbackKo,
                en = ok ? "" : item.feedbackEn,
            };
        }

        /// <summary>Joins chunks the way the player sees them, honoring glue (no space).</summary>
        public static string Assemble(Chunk[] chunks, IList<int> order)
        {
            var sb = new StringBuilder();
            for (int i = 0; i < order.Count; i++)
            {
                var c = chunks[order[i]];
                if (i > 0 && !c.glue) sb.Append(' ');
                sb.Append(KoreanMarkup.StripToPlain(c.ko));
            }
            return sb.ToString();
        }

        /// <summary>Same as <see cref="Assemble"/> but keeps markup so the result can be shown with tooltips.</summary>
        public static string AssembleMarkup(Chunk[] chunks, IList<int> order)
        {
            var sb = new StringBuilder();
            for (int i = 0; i < order.Count; i++)
            {
                var c = chunks[order[i]];
                if (i > 0 && !c.glue) sb.Append(' ');
                sb.Append(c.ko);
            }
            return sb.ToString();
        }

        public static string Normalize(string s)
        {
            var sb = new StringBuilder();
            foreach (char ch in KoreanMarkup.StripToPlain(s ?? ""))
                if (!char.IsWhiteSpace(ch) && ch != '.' && ch != '?' && ch != '!' && ch != ',') sb.Append(ch);
            return sb.ToString();
        }

        public static DrillFeedback EvaluateAssembly(DrillDef drill, IList<int> order)
        {
            string built = Normalize(Assemble(drill.chunks, order));
            string markup = AssembleMarkup(drill.chunks, order);

            foreach (var a in drill.answers)
                if (Normalize(a) == built)
                    return new DrillFeedback { verdict = Verdict.Correct, producedMarkup = markup };

            foreach (var alt in drill.alternatives)
                if (Normalize(alt.answer) == built)
                    return new DrillFeedback
                    {
                        verdict = Verdict.Unnatural, ko = alt.feedbackKo, en = alt.feedbackEn, producedMarkup = markup,
                    };

            bool almost = false;
            foreach (var a in drill.answers)
                if (SameLetters(Normalize(a), built)) almost = true;

            return new DrillFeedback
            {
                verdict = Verdict.Incorrect,
                almost = almost,
                ko = drill.hintKo,
                en = drill.hintEn,
                producedMarkup = markup,
            };
        }

        static bool SameLetters(string a, string b)
        {
            if (a.Length != b.Length) return false;
            var ca = a.ToCharArray();
            var cb = b.ToCharArray();
            System.Array.Sort(ca);
            System.Array.Sort(cb);
            return new string(ca) == new string(cb);
        }

        public static DrillFeedback EvaluateProduction(DrillDef drill, int a, int b)
        {
            string markup = "", english = "";
            if (a >= 0 && a < drill.slotsA.Length && b >= 0 && b < drill.slotsB.Length)
            {
                markup = drill.slotsA[a].ko + " " + drill.slotsB[b].ko;
                english = (drill.slotsB[b].en + " " + drill.slotsA[a].en).Trim();
            }

            foreach (var p in drill.pairs)
            {
                if (p.a != a || p.b != b) continue;
                var verdict = p.verdict == "natural" ? Verdict.Correct
                    : p.verdict == "wrong" ? Verdict.Incorrect
                    : Verdict.Unnatural;
                return new DrillFeedback
                {
                    verdict = verdict, ko = p.feedbackKo, en = p.feedbackEn, effects = p.effects,
                    producedMarkup = markup, producedEnglish = english,
                };
            }
            return new DrillFeedback
            {
                verdict = Verdict.Unnatural, ko = drill.hintKo, en = drill.hintEn, producedMarkup = markup, producedEnglish = english,
            };
        }

        /// <summary>Match pairs are authored in matching order; the UI shuffles only the display.</summary>
        public static bool EvaluateMatch(int leftIndex, int rightIndex) => leftIndex == rightIndex;
    }
}
