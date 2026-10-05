using DearMe.Content;

namespace DearMe.Language
{
    public class TooltipContent
    {
        /// <summary>Korean headword or pattern, e.g. "신청하다" or "-(으)려고 하다". Empty for sentence tooltips.</summary>
        public string title = "";
        public string meaning = "";
        public string note = "";
        /// <summary>Full-sentence translation, shown on sentence hover or as a footer in detailed mode.</summary>
        public string sentence = "";
        public bool missingTranslation;
        public bool IsEmpty => title.Length == 0 && meaning.Length == 0 && sentence.Length == 0;
    }

    /// <summary>
    /// Builds tooltip text from data. Desktop hover, mobile tap and long-press all come
    /// through here, so both platforms always show the same content.
    /// </summary>
    public static class TooltipContentBuilder
    {
        public const string MissingMark = "—";

        public static TooltipContent ForToken(Token token, DialogueLine line, ContentDatabase db, bool detailed)
        {
            if (token == null || token.type == TokenType.Punctuation || !token.HasInfo)
                return ForSentence(line);

            var c = new TooltipContent();
            GrammarPattern pattern = null;
            VocabEntry vocab = null;
            if (token.patternId.Length > 0 && db != null) db.Patterns.TryGetValue(token.patternId, out pattern);
            if (token.vocabId.Length > 0 && db != null) db.Vocab.TryGetValue(token.vocabId, out vocab);

            if (pattern != null)
            {
                c.title = pattern.patternText;
                c.meaning = pattern.englishMeaning;
                c.note = token.optionalExplanation.Length > 0 ? token.optionalExplanation : pattern.explanation;
                if (detailed && pattern.exampleSentences.Length > 0)
                    c.note = Join(c.note, pattern.exampleSentences[0].ko + " — " + pattern.exampleSentences[0].en);
            }
            else if (vocab != null)
            {
                c.title = vocab.ko;
                c.meaning = token.english.Length > 0 ? token.english : vocab.en;
                c.note = token.optionalExplanation;
                if (detailed) c.note = Join(c.note, vocab.note);
            }
            else
            {
                c.title = token.korean;
                c.meaning = token.english;
                c.note = token.optionalExplanation;
            }

            if (c.meaning.Length == 0)
            {
                c.meaning = MissingMark;
                c.missingTranslation = true;
            }
            if (detailed && line != null) c.sentence = line.englishTranslation;
            return c;
        }

        public static TooltipContent ForSentence(DialogueLine line)
        {
            var c = new TooltipContent();
            if (line == null || line.englishTranslation.Length == 0)
            {
                c.sentence = MissingMark;
                c.missingTranslation = true;
            }
            else c.sentence = line.englishTranslation;
            return c;
        }

        static string Join(string a, string b)
        {
            if (string.IsNullOrEmpty(b)) return a ?? "";
            if (string.IsNullOrEmpty(a)) return b;
            return a + "\n" + b;
        }
    }
}
