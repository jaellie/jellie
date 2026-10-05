using System.Collections.Generic;
using System.Text;

namespace DearMe.Content
{
    /// <summary>
    /// Parses the compact authoring markup used in the data files into tokens.
    ///
    ///   {surface|english}            word with a gloss
    ///   {surface|@vocabId}           word linked to vocabulary.json
    ///   {surface|#patternId}         grammar linked to grammar.json
    ///   {surface|gloss|PARTICLE}     explicit type (WORD, PARTICLE, GRAMMAR, PHRASE)
    ///   {surface|gloss|TYPE|note}    any extra text becomes optionalExplanation
    ///
    /// Plain text outside braces becomes untranslated word/punctuation tokens. Anything
    /// written without a space in between (e.g. "{신청|@신청하다}{하려고 해|#ryeogo}.")
    /// is glued into one unit that never wraps across lines.
    /// </summary>
    public static class KoreanMarkup
    {
        const string PunctuationChars = ".,?!…~:;'\"‘’“”()[]-—–·「」『』、。";

        public static bool IsPunctuation(char c) => PunctuationChars.IndexOf(c) >= 0;

        public static List<Token> Parse(string markup) => Parse(markup, null);

        public static List<Token> Parse(string markup, List<string> errors)
        {
            var tokens = new List<Token>();
            if (string.IsNullOrEmpty(markup)) return tokens;

            int i = 0;
            bool spaceBefore = true;
            var plain = new StringBuilder();

            while (i < markup.Length)
            {
                char c = markup[i];
                if (char.IsWhiteSpace(c))
                {
                    FlushPlain(plain, tokens, ref spaceBefore);
                    spaceBefore = true;
                    i++;
                    continue;
                }
                if (c == '{')
                {
                    int close = markup.IndexOf('}', i + 1);
                    if (close < 0)
                    {
                        errors?.Add("Unclosed '{' in: " + markup);
                        plain.Append(markup, i, markup.Length - i);
                        break;
                    }
                    FlushPlain(plain, tokens, ref spaceBefore);
                    var token = ParseBraced(markup.Substring(i + 1, close - i - 1), errors, markup);
                    if (token != null)
                    {
                        token.glue = !spaceBefore && tokens.Count > 0;
                        tokens.Add(token);
                        spaceBefore = false;
                    }
                    i = close + 1;
                    continue;
                }
                if (c == '}') errors?.Add("Stray '}' in: " + markup);
                else plain.Append(c);
                i++;
            }
            FlushPlain(plain, tokens, ref spaceBefore);
            return tokens;
        }

        /// <summary>Plain Korean text the tokens represent (what the player reads).</summary>
        public static string ToPlainText(List<Token> tokens)
        {
            var sb = new StringBuilder();
            for (int i = 0; i < tokens.Count; i++)
            {
                if (i > 0 && !tokens[i].glue) sb.Append(' ');
                sb.Append(tokens[i].korean);
            }
            return sb.ToString();
        }

        public static string StripToPlain(string markup) => ToPlainText(Parse(markup));

        public static DialogueLine BuildLine(string id, string speaker, string markup, string english)
        {
            var tokens = Parse(markup);
            return new DialogueLine
            {
                id = id ?? "",
                speaker = speaker ?? "",
                tokens = tokens,
                koreanText = ToPlainText(tokens),
                englishTranslation = english ?? "",
            };
        }

        static Token ParseBraced(string inner, List<string> errors, string context)
        {
            var parts = inner.Split('|');
            string surface = parts[0].Trim();
            if (surface.Length == 0)
            {
                errors?.Add("Empty token surface in: " + context);
                return null;
            }
            var token = new Token { korean = surface };
            bool explicitType = false;
            for (int p = 1; p < parts.Length; p++)
            {
                string part = parts[p].Trim();
                if (part.Length == 0) continue;
                if (part[0] == '@') token.vocabId = part.Substring(1);
                else if (part[0] == '#') token.patternId = part.Substring(1);
                else if (TryParseType(part, out var type)) { token.type = type; explicitType = true; }
                else if (token.english.Length == 0) token.english = part;
                else token.optionalExplanation = part;
            }
            if (!explicitType && token.patternId.Length > 0) token.type = TokenType.Grammar;
            return token;
        }

        static bool TryParseType(string s, out TokenType type)
        {
            switch (s)
            {
                case "WORD": type = TokenType.Word; return true;
                case "PARTICLE": type = TokenType.Particle; return true;
                case "GRAMMAR": type = TokenType.Grammar; return true;
                case "PHRASE": type = TokenType.Phrase; return true;
                case "PUNCTUATION": type = TokenType.Punctuation; return true;
            }
            type = TokenType.Word;
            return false;
        }

        // Splits a plain run into word and punctuation tokens, all glued after the first.
        static void FlushPlain(StringBuilder plain, List<Token> tokens, ref bool spaceBefore)
        {
            if (plain.Length == 0) return;
            string run = plain.ToString();
            plain.Clear();

            int start = 0;
            while (start < run.Length)
            {
                bool punct = IsPunctuation(run[start]);
                int end = start + 1;
                // Punctuation is split per character so "…" and "." stay separate; words stay whole.
                if (!punct)
                    while (end < run.Length && !IsPunctuation(run[end])) end++;

                tokens.Add(new Token
                {
                    korean = run.Substring(start, end - start),
                    type = punct ? TokenType.Punctuation : TokenType.Word,
                    glue = !spaceBefore && tokens.Count > 0,
                });
                spaceBefore = false;
                start = end;
            }
        }
    }
}
