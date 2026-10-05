using System;
using System.Collections.Generic;
using System.Linq;
using DearMe.Content;
using DearMe.Input;
using DearMe.Language;
using DearMe.Save;
using DearMe.Settings;
using DearMe.Story;
using static DearMe.Tests.Program;

namespace DearMe.Tests
{
    public static class MarkupTests
    {
        public static void Run()
        {
            var t = KoreanMarkup.Parse("이번 주에 {신청|@신청하다}{하려고 해|#ryeogo}.");
            Check(KoreanMarkup.ToPlainText(t) == "이번 주에 신청하려고 해.", "plain text round trip: " + KoreanMarkup.ToPlainText(t));
            Check(t.Count == 5, "token count " + t.Count);
            Check(t[2].vocabId == "신청하다" && !t[2].glue, "vocab token");
            Check(t[3].patternId == "ryeogo" && t[3].type == TokenType.Grammar && t[3].glue, "grammar token glued");
            Check(t[4].type == TokenType.Punctuation && t[4].glue, "punctuation glued");

            var p = KoreanMarkup.Parse("{에|at|PARTICLE} {x|gloss|WORD|note}");
            Check(p[0].type == TokenType.Particle && p[0].english == "at", "explicit type");
            Check(p[1].optionalExplanation == "note", "explanation");

            var q = KoreanMarkup.Parse("‘{나중에|later}.’");
            Check(KoreanMarkup.ToPlainText(q) == "‘나중에.’", "quotes stay attached: " + KoreanMarkup.ToPlainText(q));
            Check(q.Skip(1).All(x => x.glue), "quote unit is unbreakable");

            var errors = new List<string>();
            var bad = KoreanMarkup.Parse("{깨진 토큰|oops", errors);
            Check(errors.Count == 1 && KoreanMarkup.ToPlainText(bad).Contains("깨진"), "unclosed brace reported, text kept");

            Check(KoreanMarkup.Parse("").Count == 0 && KoreanMarkup.Parse(null).Count == 0, "empty input");
            Check(KoreanMarkup.ToPlainText(KoreanMarkup.Parse("Mixed {영어|English} and 한국어 A4 10월 7일, 17:00!"))
                  == "Mixed 영어 and 한국어 A4 10월 7일, 17:00!", "mixed scripts, numbers, punctuation");
        }
    }

    public static class DrillTests
    {
        public static void Run()
        {
            var db = Data.Database();

            var order = db.Drills["d_order"];
            var correct = IndexesFor(order, "이번 주에", "신청", "하려고", "해");
            var fb = DrillEvaluator.EvaluateAssembly(order, correct);
            Check(fb.verdict == Verdict.Correct, "order correct");
            Check(DrillEvaluator.Assemble(order.chunks, correct) == "이번 주에 신청하려고 해", "assembled spacing: " + DrillEvaluator.Assemble(order.chunks, correct));
            var scrambled = IndexesFor(order, "신청", "하려고", "이번 주에", "해");
            var fb2 = DrillEvaluator.EvaluateAssembly(order, scrambled);
            Check(fb2.verdict == Verdict.Incorrect && fb2.almost, "same pieces wrong order is 'almost'");
            Check(DrillEvaluator.EvaluateAssembly(order, new int[0]).verdict == Verdict.Incorrect, "empty answer");

            var trans = db.Drills["d_transform"];
            var alt = DrillEvaluator.EvaluateAssembly(trans, IndexesFor(trans, "응,", "여행", "할", "거야"));
            Check(alt.verdict == Verdict.Unnatural && alt.ko.Length > 0, "grammatical alternative gets a redirect, not 'wrong'");

            var ctx = db.Drills["d_context"];
            Check(Enumerable.Range(0, ctx.options.Length).Select(i => DrillEvaluator.EvaluateOption(ctx, i).verdict)
                  .OrderBy(v => v).SequenceEqual(new[] { Verdict.Correct, Verdict.Unnatural, Verdict.Incorrect }), "context drill: natural / grammatical-only / wrong");
            Check(DrillEvaluator.EvaluateOption(ctx, 99).verdict == Verdict.Incorrect, "out of range option");

            var prod = db.Drills["d_production"];
            var p = DrillEvaluator.EvaluateProduction(prod, 0, 0);
            Check(p.verdict == Verdict.Correct && p.producedMarkup.Contains("쓰려고") && p.producedEnglish == "planning to write my personal statement",
                  "production builds sentence + English: " + p.producedEnglish);
            Check(DrillEvaluator.EvaluateProduction(prod, 0, 1).verdict == Verdict.Incorrect, "meaningless combo is wrong");
            Check(DrillEvaluator.EvaluateProduction(prod, 2, 0).verdict == Verdict.Unnatural, "grammatical-but-awkward combo");

            var sub = db.Drills["d_substitution"];
            foreach (var item in sub.items)
            {
                Check(DrillEvaluator.EvaluateSubstitution(item, item.answer).verdict == Verdict.Correct, "substitution answer " + item.baseKo);
                Check(DrillEvaluator.EvaluateSubstitution(item, 1 - item.answer).verdict == Verdict.Incorrect, "substitution distractor " + item.baseKo);
            }
            // -려고 / -으려고 / ㄹ rule is actually what the answers encode.
            Check(sub.items.Single(i => i.baseKo.EndsWith("찍다")).options[sub.items.Single(i => i.baseKo.EndsWith("찍다")).answer].Contains("찍으려고"), "받침 → -으려고");
            Check(sub.items.Single(i => i.baseKo.EndsWith("만들다")).options[sub.items.Single(i => i.baseKo.EndsWith("만들다")).answer].Contains("만들려고"), "ㄹ stem → -려고");
        }

        public static int[] IndexesFor(DrillDef d, params string[] pieces)
        {
            var used = new HashSet<int>();
            return pieces.Select(piece =>
            {
                for (int i = 0; i < d.chunks.Length; i++)
                    if (!used.Contains(i) && KoreanMarkup.StripToPlain(d.chunks[i].ko) == piece) { used.Add(i); return i; }
                throw new Exception("no chunk " + piece);
            }).ToArray();
        }
    }

    public static class PatternTests
    {
        public static void Run()
        {
            var state = new StoryState { currentChapter = 1 };
            var tracker = new PatternTracker(state, Data.Database());
            var changes = new List<MasteryState>();
            tracker.MasteryChanged += (_, m) => changes.Add(m);

            tracker.Record("ryeogo", PracticeKind.Exposure);
            Check(tracker.Get("ryeogo").masteryState == MasteryState.Introduced, "introduced");
            tracker.Record("ryeogo", PracticeKind.Recognition);
            Check(tracker.Get("ryeogo").masteryState == MasteryState.Recognized, "recognized");
            tracker.Record("ryeogo", PracticeKind.Production);
            tracker.Record("ryeogo", PracticeKind.Production);
            Check(tracker.Get("ryeogo").masteryState == MasteryState.Practiced, "practiced");
            tracker.Record("ryeogo", PracticeKind.ContextualUse);
            Check(tracker.Get("ryeogo").masteryState == MasteryState.Used, "used");
            state.currentChapter = 2;
            tracker.Record("ryeogo", PracticeKind.Exposure);
            Check(tracker.Get("ryeogo").masteryState == MasteryState.Recycled, "recycled in a later chapter");
            for (int i = 0; i < 6; i++) tracker.Record("ryeogo", PracticeKind.ContextualUse);
            Check(tracker.Get("ryeogo").masteryState == MasteryState.Mastered, "mastered");
            Check(changes.SequenceEqual(new[] { MasteryState.Introduced, MasteryState.Recognized, MasteryState.Practiced, MasteryState.Used, MasteryState.Recycled, MasteryState.Mastered }), "monotonic progression");

            var line = KoreanMarkup.BuildLine("x", "", "{하려고|#ryeogo} {하려고|#ryeogo}", "x");
            int before = tracker.Get("ryeogo").exposureCount;
            tracker.RecordLine(line);
            Check(tracker.Get("ryeogo").exposureCount == before + 1, "one exposure per line");
        }
    }

    public static class StateTests
    {
        public static void Run()
        {
            var m = new StoryStateManager(Data.Database());
            var warnings = new List<string>();
            m.Warning += warnings.Add;

            m.Apply(new[] { "set:a", "clue:c1", "var:plan={x|y}", "phase:LetterFound", "chapter:1", "loop:1", "photo:photo_cafe=v2", "ending:e" });
            Check(m.HasFlag("a") && m.Evaluate("flag:a") && m.Evaluate("!flag:b"), "flags");
            Check(m.Evaluate("clue:c1") && m.Evaluate("var:plan") && m.GetVar("plan") == "{x|y}", "clues and vars");
            Check(m.Evaluate("phase>=LetterFound") && !m.Evaluate("phase>=MemoryChanged"), "phase compare");
            Check(m.Evaluate("loop==1") && m.Evaluate("loop>=1") && !m.Evaluate("loop>1"), "loop compare");
            Check(m.PhotoStateOf("photo_cafe") == "v2" && m.PhotoStateOf("other") == "v1", "photo memory");
            Check(m.Substitute("$plan$? 좋네.") == "{x|y}? 좋네." && m.Substitute("no vars") == "no vars" && m.Substitute("$open") == "$open", "substitution");

            m.Apply("set:loop.temp");
            m.Apply("loop:end");
            Check(m.State.currentLoop == 2 && !m.HasFlag("loop.temp") && m.HasFlag("a"), "loop end clears only loop.* flags");

            Check(warnings.Count == 0, "no warnings for valid content: " + string.Join(", ", warnings));
            m.Apply("bogus:thing");
            Check(!m.Evaluate("nonsense"), "unknown condition is false");
            Check(warnings.Count == 2, "unknown effect/condition reported");
            Check(!StoryStateManager.IsValidEffect("phase:Nope") && StoryStateManager.IsValidEffect("use:ryeogo"), "effect validation");

            for (int i = 0; i < StoryState.MaxHistory + 50; i++) m.RecordHistory("n" + i);
            Check(m.State.dialogueHistory.Count == StoryState.MaxHistory, "history is capped");
        }
    }

    /// <summary>A presenter that answers instantly, choosing with a seeded RNG.</summary>
    public class ScriptedPresenter : IStoryPresenter
    {
        readonly Random rng;
        readonly ContentDatabase db;
        public int Lines, Choices, Drills, Rooms;
        public bool Ended;
        public bool DoubleCall;
        public readonly List<string> Shown = new List<string>();
        readonly HashSet<string> inspected = new HashSet<string>();
        public Func<bool> StopWhen = () => false;

        public ScriptedPresenter(int seed, ContentDatabase db) { rng = new Random(seed); this.db = db; }

        void Call(Action a) { if (StopWhen()) return; a(); if (DoubleCall) a(); }

        public void ShowLine(DialogueLine line, Action done)
        {
            Lines++;
            Shown.Add(line.koreanText);
            Check(line.koreanText.Length > 0, "displayed line is not empty: " + line.id);
            Check(!line.koreanText.Contains("$"), "variables substituted: " + line.koreanText);
            Check(!line.englishTranslation.Contains("$"), "english variables substituted: " + line.englishTranslation);
            Call(done);
        }

        public void ShowChoices(DialogueLine prompt, IList<DialogueLine> options, Action<int> chosen)
        {
            Choices++;
            int pick = rng.Next(options.Count);
            if (StopWhen()) return;
            chosen(pick);
            if (DoubleCall) chosen((pick + 1) % options.Count);
        }

        public void ShowDrill(DrillDef drill, Action<DrillOutcome> done)
        {
            Drills++;
            var outcome = new DrillOutcome();
            if (drill.kind == "production")
            {
                var natural = drill.pairs.Where(p => p.verdict == "natural").ToList();
                var pair = natural[rng.Next(natural.Count)];
                var fb = DrillEvaluator.EvaluateProduction(drill, pair.a, pair.b);
                outcome.producedMarkup = fb.producedMarkup;
                outcome.producedEnglish = fb.producedEnglish;
                outcome.effects = fb.effects;
            }
            Call(() => done(outcome));
        }

        public void ShowDocument(DocumentDef document, Action closed) => Call(closed);
        public void ShowPhoto(PhotoDef photo, PhotoState state, Action closed) => Call(closed);

        public void ShowRoom(RoomDef room, IList<RoomObjectDef> visible, Action<RoomObjectDef> inspect)
        {
            Rooms++;
            Check(Rooms < 200, "explore terminates");
            // Prefer things not yet looked at, like a curious player would.
            var fresh = visible.Where(o => !inspected.Contains(o.id)).ToList();
            var pick = fresh.Count > 0 && rng.NextDouble() < 0.8 ? fresh[rng.Next(fresh.Count)] : visible[rng.Next(visible.Count)];
            inspected.Add(pick.id);
            if (StopWhen()) return;
            inspect(pick);
        }

        public void PlayTransition(TransitionDef transition, Action done) => Call(done);
        public void ShowEnd(StoryNode end, Action done) { Ended = true; Call(done); }
    }

    public static class PlaythroughTests
    {
        public static void Run()
        {
            var db = Data.Database();
            var endings = new HashSet<bool>();
            int minLines = int.MaxValue;
            for (int seed = 0; seed < 300; seed++)
            {
                var story = new StoryStateManager(db);
                var warnings = new List<string>();
                story.Warning += warnings.Add;
                var presenter = new ScriptedPresenter(seed, db) { DoubleCall = seed % 3 == 0 };
                var runner = new StoryRunner(db, story, presenter);
                var errors = new List<string>();
                runner.Error += errors.Add;
                int checkpoints = 0;
                runner.Checkpoint += _ => checkpoints++;
                runner.Start(db.StartNode);

                Check(errors.Count == 0, $"seed {seed}: {string.Join("; ", errors)}");
                Check(warnings.Count == 0, $"seed {seed}: {string.Join("; ", warnings)}");
                Check(presenter.Ended, $"seed {seed}: reached the end");
                var s = story.State;
                Check(s.phase >= StoryPhase.LetterFound, $"seed {seed}: letter found");
                Check(s.currentLoop == 2, $"seed {seed}: loop advanced to 2 (was {s.currentLoop})");
                Check(story.PhotoStateOf("photo_cafe") == "v2", $"seed {seed}: photo memory changed");
                Check(s.clues.Contains("note_1") && s.clues.Contains("deadline"), $"seed {seed}: clues");
                Check(s.inspectedObjects.Count >= 2, $"seed {seed}: inspected objects");
                Check(s.visitedLocations.Count >= 4, $"seed {seed}: visited locations");
                Check(story.GetVar("plan").Length > 0, $"seed {seed}: produced sentence stored");
                var ryeogo = story.Patterns.Get("ryeogo");
                Check(ryeogo.exposureCount >= 10, $"seed {seed}: -(으)려고 하다 exposures {ryeogo.exposureCount}");
                Check(ryeogo.recognitionCount >= 1 && ryeogo.productionCount >= 4, $"seed {seed}: recognition/production");
                Check(ryeogo.masteryState >= MasteryState.Used, $"seed {seed}: pattern reached USED ({ryeogo.masteryState})");
                Check(presenter.Drills >= 9, $"seed {seed}: drills {presenter.Drills}");
                Check(checkpoints >= 10, $"seed {seed}: checkpoints {checkpoints}");
                Check(s.choices.Count >= 5, $"seed {seed}: choices recorded");
                endings.Add(story.HasFlag("almost_submitted"));
                minLines = Math.Min(minLines, presenter.Lines);
                if (!presenter.Ended) break;
            }
            Check(endings.Count == 2, "both night choices (tried / delayed) were exercised");
            Console.WriteLine($"     shortest playthrough shows {minLines} dialogue lines");
        }
    }

    public static class SaveTests
    {
        public static void Run()
        {
            var db = Data.Database();
            var storage = new MemoryStorage();
            var saves = new SaveService(storage, new SystemTextJsonSerializer(), () => new DateTime(2026, 10, 5));

            Check(!saves.HasSave && saves.Load().status == LoadStatus.NoSave, "missing save");

            // Play until a random mid-story checkpoint, then "close the browser tab".
            for (int seed = 0; seed < 60; seed++)
            {
                storage.Values.Clear();
                var story = new StoryStateManager(db);
                var presenter = new ScriptedPresenter(seed, db);
                var runner = new StoryRunner(db, story, presenter);
                int stopAfter = 5 + seed * 3;
                int count = 0;
                runner.Checkpoint += id => { saves.Save(id, story.State); count++; };
                presenter.StopWhen = () => count >= stopAfter;
                runner.Start(db.StartNode);

                var loaded = saves.Load();
                Check(loaded.status == LoadStatus.Loaded, $"seed {seed}: load ok ({loaded.status})");
                var resumed = new StoryStateManager(db, loaded.data.state);
                var p2 = new ScriptedPresenter(seed + 1000, db);
                var r2 = new StoryRunner(db, resumed, p2);
                var errors = new List<string>();
                r2.Error += errors.Add;
                r2.Start(loaded.data.nodeId);
                Check(errors.Count == 0 && p2.Ended, $"seed {seed}: resumed from '{loaded.data.nodeId}' and finished ({string.Join(";", errors)})");
            }

            // Corrupt primary falls back to backup.
            storage.Values.Clear();
            var st = new StoryState { currentLoop = 1 };
            saves.Save("pro_explore", st);
            saves.Save("l1_title", st);
            storage.Values[SaveService.PrimaryKey] = "{ this is not json";
            var r = saves.Load();
            Check(r.status == LoadStatus.RecoveredFromBackup && r.data.nodeId == "pro_explore", "corrupt primary → backup");
            Check(saves.HasSave, "HasSave with only a valid backup");

            // Saving over a corrupt primary must not promote it to backup.
            saves.Save("st_title", st);
            Check(saves.Load().data.nodeId == "st_title", "new save after corruption");
            storage.Values[SaveService.PrimaryKey] = "";
            Check(saves.Load().data.nodeId == "pro_explore", "corrupt text never became the backup");

            storage.Values[SaveService.PrimaryKey] = "garbage";
            storage.Values[SaveService.BackupKey] = "{\"version\":1}";
            Check(saves.Load().status == LoadStatus.Corrupt, "both slots unusable → Corrupt");

            storage.Values.Clear();
            storage.Values[SaveService.PrimaryKey] = "{\"version\":0,\"nodeId\":\"l1_title\",\"state\":{\"visitedLocations\":[\"room_present\",\"cafe_2018\"]}}";
            var old = saves.Load();
            Check(old.status == LoadStatus.Migrated && old.data.version == SaveService.CurrentVersion && old.data.state.currentLoop == 1, "old save migrated");

            storage.Values[SaveService.PrimaryKey] = "{\"version\":99,\"nodeId\":\"x\",\"state\":{}}";
            Check(saves.Load().status == LoadStatus.Corrupt, "save from a newer build is not trusted");

            saves.DeleteAll();
            Check(!saves.HasSave, "reset / new game deletes saves");
            Check(storage.Flushes > 0, "saves are flushed (browser tab can close any time)");
        }
    }

    public static class InputTests
    {
        public static void Run()
        {
            var g = new InputGate();
            Check(!g.TryConsume(GameAction.Advance, 1.0, 1), "idle: no advance");
            g.SetState(InputState.WaitingForInput);
            Check(g.TryConsume(GameAction.Advance, 1.0, 2), "advance accepted");
            Check(!g.TryConsume(GameAction.Advance, 1.0, 2), "same frame rejected (mouse + touch from one press)");
            Check(!g.TryConsume(GameAction.Advance, 1.05, 3), "double click rejected");
            Check(g.TryConsume(GameAction.Advance, 1.5, 4), "later click accepted");
            g.SetState(InputState.Transitioning);
            Check(!g.TryConsume(GameAction.Advance, 3, 10) && !g.TryConsume(GameAction.Choose, 3, 11), "nothing during transitions");
            g.SetState(InputState.Choice);
            Check(!g.TryConsume(GameAction.Advance, 4, 12), "advance not allowed while choosing");
            Check(g.TryConsume(GameAction.Choose, 4, 13), "choice accepted");
            Check(!g.TryConsume(GameAction.Choose, 4.01, 14), "second choice from rapid taps rejected");
            g.SuspendUntil(10);
            Check(!g.TryConsume(GameAction.Choose, 9, 20), "suspended after focus loss");
            Check(g.TryConsume(GameAction.Choose, 10.5, 21), "resumes after suspension");
            g.Suspend();
            Check(!g.TryConsume(GameAction.Choose, 1000, 22), "tab hidden: nothing accepted");
            g.Resume(1000);
            Check(!g.TryConsume(GameAction.Choose, 1000.1, 23), "the click that refocuses the tab is ignored");
            Check(g.TryConsume(GameAction.Choose, 1000.5, 24), "input works again after the grace period");
            g.SetState(InputState.Locked);
            Check(!g.TryConsume(GameAction.Cancel, 20, 30), "locked blocks cancel");
        }
    }

    public static class SettingsTests
    {
        public static void Run()
        {
            var s = new GameSettings { textScaleIndex = 3, support = LanguageSupportLevel.Full, soundVolume = 0.25f, musicVolume = 0f, reducedMotion = true };
            var copy = new GameSettings();
            copy.Deserialize(s.Serialize());
            Check(copy.textScaleIndex == 3 && copy.support == LanguageSupportLevel.Full && Math.Abs(copy.soundVolume - 0.25f) < 1e-6 && copy.musicVolume == 0 && copy.reducedMotion, "round trip");
            var junk = new GameSettings();
            junk.Deserialize("text=99;support=7;sound=abc;;=;music=2");
            Check(junk.textScaleIndex == GameSettings.TextScales.Length - 1 && junk.support == LanguageSupportLevel.Low && junk.musicVolume == 1f, "malformed values clamp or fall back");
        }
    }
}
