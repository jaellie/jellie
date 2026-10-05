using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using DearMe.Content;
using DearMe.Language;
using DearMe.Story;
using static DearMe.Tests.Program;

namespace DearMe.Tests
{
    /// <summary>Static validation of every data file: references, markup, font coverage, reachability.</summary>
    public static class ContentTests
    {
        static ContentDatabase db;
        static HashSet<char> fontChars;
        static int koreanLines;

        public static void Run()
        {
            db = Data.Database();
            fontChars = new HashSet<char>(File.ReadAllText(Path.Combine(Data.Root, "Tests/font_charset.txt")));
            foreach (var e in db.Errors) Check(false, e);

            Check(db.Nodes.ContainsKey(db.StartNode), "start node exists");
            foreach (var node in db.Nodes.Values) ValidateNode(node);
            foreach (var drill in db.Drills.Values) ValidateDrill(drill);
            foreach (var doc in db.Documents.Values)
                foreach (var l in doc.lines) ValidateMarkup(l.ko, l.en, "document " + doc.id, l.style == "gap");
            foreach (var photo in db.Photos.Values)
            {
                Check(photo.states.Length > 0 && photo.states[0].id == "v1", $"photo {photo.id} starts with state v1");
                foreach (var s in photo.states)
                {
                    foreach (var d in s.details) ValidateMarkup(d.ko, d.en, $"photo {photo.id}/{s.id}");
                    foreach (var sh in s.shapes)
                    {
                        if (sh.label.Length > 0) ValidateMarkup(sh.label, sh.labelEn, $"photo {photo.id} label");
                        Check(ValidColor(sh.color), $"photo {photo.id} color {sh.color}");
                    }
                }
            }
            foreach (var room in db.Rooms.Values)
            {
                Check(db.Locations.ContainsKey(room.location), $"room {room.id} location");
                foreach (var o in room.objects)
                {
                    Check(db.Nodes.ContainsKey(o.node), $"room object {o.id} node '{o.node}'");
                    foreach (var c in o.visibleWhen) Check(StoryStateManager.IsValidCondition(c), $"room object {o.id} condition '{c}'");
                    Check(o.w > 0 && o.h > 0 && o.x >= 0 && o.y >= 0 && o.x + o.w <= 1.001f && o.y + o.h <= 1.001f, $"room object {o.id} rect inside 0..1");
                    CheckFont(o.labelKo + o.verbKo, "room object " + o.id);
                }
            }
            string art = Path.Combine(Data.Root, "Assets/DearMe/Resources/DearMe/Art");
            foreach (var loc in db.Locations.Values)
                if (loc.image.Length > 0) Check(File.Exists(Path.Combine(art, loc.image + ".png")), $"location {loc.id} art '{loc.image}.png' exists");
            foreach (var room in db.Rooms.Values)
                foreach (var o in room.objects)
                    if (o.image.Length > 0) Check(File.Exists(Path.Combine(art, o.image + ".png")), $"object {o.id} art '{o.image}.png' exists");
            foreach (var loc in db.Locations.Values)
            {
                Check(ValidColor(loc.top) && ValidColor(loc.bottom), $"location {loc.id} colors");
                foreach (var s in loc.shapes) Check(ValidColor(s.color), $"location {loc.id} shape color {s.color}");
            }
            foreach (var c in db.Characters.Values) { CheckFont(c.nameKo, "character " + c.id); Check(ValidColor(c.color), "character color " + c.id); }
            foreach (var s in db.Ui.Values) CheckFont(s.ko, "ui " + s.id);
            foreach (var p in db.Patterns.Values)
            {
                CheckFont(p.patternText + p.meaning, "pattern " + p.patternId);
                Check(p.englishMeaning.Length > 0, $"pattern {p.patternId} has English meaning");
            }

            CheckReachability();
            CheckRequiredUiStrings();

            Console.WriteLine($"     Korean lines in slice content: {koreanLines}");
            Check(koreanLines >= 100, $"at least 100 Korean lines (found {koreanLines})");

            var ryeogo = db.Patterns["ryeogo"];
            Check(ryeogo.recyclingChapters.Length >= 5 && ryeogo.exampleSentences.Length >= 5, "-(으)려고 하다 has recycling plan across chapters");
            int ryeogoDrills = db.Drills.Values.Count(d => d.patternId == "ryeogo");
            Check(ryeogoDrills >= 5, "-(으)려고 하다 has at least 5 drills");
            Check(new[] { "meaning", "substitution", "order", "context", "transform", "negative", "production" }
                .All(k => db.Drills.Values.Any(d => d.patternId == "ryeogo" && d.kind == k)), "every pipeline stage has a drill");
        }

        static void ValidateNode(StoryNode n)
        {
            string where = "node " + n.id;
            foreach (var e in n.effects) Check(StoryStateManager.IsValidEffect(e), $"{where} effect '{e}'");
            if (n.speaker.Length > 0) Check(db.Characters.ContainsKey(n.speaker), $"{where} speaker '{n.speaker}'");
            if (n.next.Length > 0) Check(db.Nodes.ContainsKey(n.next), $"{where} next '{n.next}'");

            switch (n.type)
            {
                case "line":
                    ValidateMarkup(n.ko, n.en, where);
                    Check(db.NextOf(n).Length > 0, $"{where} has a successor");
                    break;
                case "choice":
                    if (n.ko.Length > 0) ValidateMarkup(n.ko, n.en, where);
                    Check(n.choices.Length >= 2, $"{where} has at least two choices");
                    foreach (var c in n.choices)
                    {
                        ValidateMarkup(c.ko, c.en, where + " choice");
                        string next = c.next.Length > 0 ? c.next : db.NextOf(n);
                        Check(db.Nodes.ContainsKey(next), $"{where} choice target '{next}'");
                        foreach (var e in c.effects) Check(StoryStateManager.IsValidEffect(e), $"{where} choice effect '{e}'");
                        foreach (var w in c.when) Check(StoryStateManager.IsValidCondition(w), $"{where} choice condition '{w}'");
                    }
                    break;
                case "drill": Check(db.Drills.ContainsKey(n.drill), $"{where} drill '{n.drill}'"); break;
                case "document": Check(db.Documents.ContainsKey(n.document), $"{where} document '{n.document}'"); break;
                case "photo": Check(db.Photos.ContainsKey(n.photo), $"{where} photo '{n.photo}'"); break;
                case "explore":
                    Check(db.Rooms.ContainsKey(n.room), $"{where} room '{n.room}'");
                    Check(n.exitWhen.Length > 0, $"{where} has an exit condition");
                    foreach (var c in n.exitWhen) Check(StoryStateManager.IsValidCondition(c), $"{where} exit '{c}'");
                    break;
                case "transition":
                    Check(n.transition.to.Length == 0 || db.Locations.ContainsKey(n.transition.to), $"{where} location '{n.transition.to}'");
                    CheckFont(n.transition.titleKo, where);
                    foreach (var a in n.transition.ambience)
                        Check(new[] { "rain", "clock", "birds", "cafe", "street", "night" }.Contains(a), $"{where} ambience '{a}' is known");
                    break;
                case "branch":
                    foreach (var c in n.cases)
                    {
                        Check(db.Nodes.ContainsKey(c.next), $"{where} case target '{c.next}'");
                        foreach (var w in c.when) Check(StoryStateManager.IsValidCondition(w), $"{where} case condition '{w}'");
                    }
                    Check(db.Nodes.ContainsKey(db.NextOf(n)), $"{where} has a default target");
                    break;
                case "effect":
                case "return":
                    break;
                case "end":
                    CheckFont(n.titleKo + n.bodyKo, where);
                    break;
                default:
                    Check(false, $"{where} unknown type '{n.type}'");
                    break;
            }
        }

        static void ValidateDrill(DrillDef d)
        {
            string where = "drill " + d.id;
            if (d.patternId.Length > 0) Check(db.Patterns.ContainsKey(d.patternId), $"{where} pattern '{d.patternId}'");
            if (d.speaker.Length > 0) Check(db.Characters.ContainsKey(d.speaker), $"{where} speaker");
            if (d.referenceDocument.Length > 0) Check(db.Documents.ContainsKey(d.referenceDocument), $"{where} reference document");
            if (d.referencePhoto.Length > 0) Check(db.Photos.ContainsKey(d.referencePhoto), $"{where} reference photo");
            if (d.promptKo.Length > 0) ValidateMarkup(d.promptKo, d.promptEn, where + " prompt");
            if (d.introKo.Length > 0) ValidateMarkup(d.introKo, d.introEn, where + " intro");
            if (d.successKo.Length > 0) ValidateMarkup(d.successKo, d.successEn, where + " success");
            if (d.hintKo.Length > 0) ValidateMarkup(d.hintKo, d.hintEn, where + " hint");
            CheckFont(d.instructionKo, where);
            Check(d.instructionKo.Length > 0 && d.instructionEn.Length > 0, $"{where} has instructions");
            foreach (var e in d.successEffects) Check(StoryStateManager.IsValidEffect(e), $"{where} effect '{e}'");

            switch (d.kind)
            {
                case "meaning":
                case "comprehension":
                case "context":
                    Check(d.options.Length >= 2, $"{where} has options");
                    Check(d.options.Count(o => o.correct) == 1, $"{where} has exactly one correct option");
                    foreach (var o in d.options)
                    {
                        if (o.ko.Length > 0) ValidateMarkup(o.ko, o.en, where + " option");
                        else Check(o.en.Length > 0, $"{where} option needs text");
                        if (o.feedbackKo.Length > 0) ValidateMarkup(o.feedbackKo, o.feedbackEn, where + " feedback");
                        if (!o.correct) Check(o.feedbackKo.Length > 0, $"{where} wrong option explains why");
                    }
                    if (d.kind == "context") Check(d.options.Any(o => o.grammaticalOnly), $"{where} distinguishes grammatical vs natural");
                    break;
                case "substitution":
                    Check(d.items.Length >= 3, $"{where} has items");
                    foreach (var it in d.items)
                    {
                        Check(it.answer >= 0 && it.answer < it.options.Length, $"{where} item answer index");
                        CheckFont(it.who + it.baseKo + string.Concat(it.options), where);
                        if (it.feedbackKo.Length > 0) ValidateMarkup(it.feedbackKo, it.feedbackEn, where + " item feedback");
                    }
                    break;
                case "order":
                case "transform":
                case "negative":
                {
                    Check(d.chunks.Length >= 3 && d.answers.Length >= 1, $"{where} has chunks and answers");
                    foreach (var c in d.chunks) ValidateMarkup(c.ko, "-", where + " chunk", allowMissingEnglish: true);
                    foreach (var a in d.answers) Check(Buildable(d, a), $"{where} answer '{a}' can be built from chunks");
                    foreach (var alt in d.alternatives)
                    {
                        Check(Buildable(d, alt.answer), $"{where} alternative '{alt.answer}' can be built");
                        ValidateMarkup(alt.feedbackKo, alt.feedbackEn, where + " alternative");
                    }
                    Check(d.hintKo.Length > 0, $"{where} has a hint");
                    break;
                }
                case "production":
                    Check(d.slotsA.Length >= 2 && d.slotsB.Length >= 2, $"{where} has slots");
                    foreach (var c in d.slotsA.Concat(d.slotsB)) { ValidateMarkup(c.ko, c.en, where + " slot"); }
                    foreach (var p in d.pairs)
                    {
                        Check(p.a < d.slotsA.Length && p.b < d.slotsB.Length, $"{where} pair in range");
                        Check(new[] { "natural", "odd", "wrong" }.Contains(p.verdict), $"{where} verdict '{p.verdict}'");
                        if (p.feedbackKo.Length > 0) ValidateMarkup(p.feedbackKo, p.feedbackEn, where + " pair feedback");
                        foreach (var e in p.effects) Check(StoryStateManager.IsValidEffect(e), $"{where} pair effect '{e}'");
                    }
                    Check(d.pairs.Any(p => p.verdict == "natural"), $"{where} has a natural answer");
                    Check(d.pairs.Count(p => p.verdict == "natural" && p.effects.Length > 0) ==
                          d.pairs.Count(p => p.verdict == "natural"), $"{where} natural answers set story flags");
                    break;
                case "match":
                    Check(d.matchPairs.Length >= 3, $"{where} has pairs");
                    foreach (var m in d.matchPairs) ValidateMarkup(m.ko, m.en, where + " pair");
                    break;
                default:
                    Check(false, $"{where} unknown kind '{d.kind}'");
                    break;
            }
        }

        /// <summary>Brute-force: is there an ordering of distinct chunks that normalizes to the answer?</summary>
        static bool Buildable(DrillDef d, string answer)
        {
            string target = DrillEvaluator.Normalize(answer);
            var used = new bool[d.chunks.Length];
            var order = new List<int>();
            bool Search()
            {
                string built = DrillEvaluator.Normalize(DrillEvaluator.Assemble(d.chunks, order));
                if (built == target) return true;
                if (!target.StartsWith(built)) return false;
                for (int i = 0; i < d.chunks.Length; i++)
                {
                    if (used[i]) continue;
                    used[i] = true; order.Add(i);
                    if (Search()) return true;
                    used[i] = false; order.RemoveAt(order.Count - 1);
                }
                return false;
            }
            return Search();
        }

        static void ValidateMarkup(string ko, string en, string where, bool allowEmpty = false, bool allowMissingEnglish = false)
        {
            if (allowEmpty && string.IsNullOrEmpty(ko)) return;
            var errors = new List<string>();
            var tokens = KoreanMarkup.Parse(ko, errors);
            foreach (var e in errors) Check(false, $"{where}: {e}");
            Check(tokens.Count > 0 || ko.Contains('$'), $"{where}: empty Korean text");
            if (!allowMissingEnglish) Check(!string.IsNullOrWhiteSpace(en), $"{where}: missing English for '{ko}'");
            foreach (var t in tokens)
            {
                if (t.vocabId.Length > 0) Check(db.Vocab.ContainsKey(t.vocabId), $"{where}: unknown vocab '@{t.vocabId}'");
                if (t.patternId.Length > 0) Check(db.Patterns.ContainsKey(t.patternId), $"{where}: unknown pattern '#{t.patternId}'");
            }
            string plain = KoreanMarkup.ToPlainText(tokens);
            CheckFont(plain, where);
            if (plain.Any(c => c >= 0xAC00 && c <= 0xD7A3)) koreanLines++;
            // Glosses are shown in tooltips; make sure they are not accidentally Korean-only.
            foreach (var t in tokens)
                if (t.english.Length > 0)
                    CheckFont(t.english, where + " gloss");
        }

        static void CheckFont(string text, string where)
        {
            if (string.IsNullOrEmpty(text)) return;
            foreach (char c in text)
                if (c > ' ' && !fontChars.Contains(c))
                    Check(false, $"{where}: character '{c}' (U+{(int)c:X4}) is missing from the bundled font subset");
        }

        static bool ValidColor(string hex)
        {
            if (string.IsNullOrEmpty(hex) || hex[0] != '#' || (hex.Length != 7 && hex.Length != 9)) return false;
            return hex.Skip(1).All(Uri.IsHexDigit);
        }

        static void CheckReachability()
        {
            var seen = new HashSet<string>();
            var queue = new Queue<string>();
            void Push(string id) { if (!string.IsNullOrEmpty(id) && seen.Add(id)) queue.Enqueue(id); }
            Push(db.StartNode);
            while (queue.Count > 0)
            {
                if (!db.Nodes.TryGetValue(queue.Dequeue(), out var n)) continue;
                if (n.type != "end" && n.type != "return") Push(db.NextOf(n));
                foreach (var c in n.choices) Push(c.next.Length > 0 ? c.next : db.NextOf(n));
                foreach (var c in n.cases) Push(c.next);
                if (n.type == "explore" && db.Rooms.TryGetValue(n.room, out var room))
                    foreach (var o in room.objects) Push(o.node);
            }
            foreach (var id in db.Nodes.Keys) Check(seen.Contains(id), $"node '{id}' is unreachable");
            Check(db.Nodes.Values.Any(n => n.type == "end" && seen.Contains(n.id)), "an end node is reachable");
        }

        static void CheckRequiredUiStrings()
        {
            string[] required =
            {
                "title", "menu_new", "menu_continue", "menu_settings", "menu_resume", "menu_to_title", "settings_title",
                "settings_support", "support_0", "support_1", "support_2", "settings_text", "text_0", "text_1", "text_2", "text_3",
                "settings_sound", "settings_music", "settings_motion", "on", "off", "settings_reset", "confirm_reset",
                "confirm_new", "confirm_quit", "yes", "no", "close", "continue", "check", "clear", "reference_doc", "reference_photo",
                "fb_correct", "fb_almost", "fb_unnatural", "fb_wrong", "fb_reveal", "toast_memory", "save_recovered",
                "save_corrupt", "content_error", "end_return", "end_thanks", "sentence_hint", "menu_hint",
            };
            foreach (var id in required) Check(db.Ui.ContainsKey(id), $"ui string '{id}'");
        }
    }
}
