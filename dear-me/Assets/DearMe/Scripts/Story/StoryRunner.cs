using System;
using System.Collections.Generic;
using DearMe.Content;
using DearMe.Language;

namespace DearMe.Story
{
    public class DrillOutcome
    {
        public int attempts = 1;
        public string producedMarkup = "";
        public string producedEnglish = "";
        public string[] effects = new string[0];
    }

    /// <summary>
    /// What the runner needs from the presentation layer. Every method finishes by
    /// calling its callback exactly once; the runner ignores late or repeated calls.
    /// </summary>
    public interface IStoryPresenter
    {
        void ShowLine(DialogueLine line, Action done);
        void ShowChoices(DialogueLine prompt, IList<DialogueLine> options, Action<int> chosen);
        void ShowDrill(DrillDef drill, Action<DrillOutcome> done);
        void ShowDocument(DocumentDef document, Action closed);
        void ShowPhoto(PhotoDef photo, PhotoState state, Action closed);
        void ShowRoom(RoomDef room, IList<RoomObjectDef> visibleObjects, Action<RoomObjectDef> inspect);
        void PlayTransition(TransitionDef transition, Action done);
        void ShowEnd(StoryNode end, Action done);
    }

    /// <summary>
    /// Walks the story graph (the "DialogueManager" of the design doc). Knows nothing
    /// about Unity: content in, presenter calls out, state changes through StoryStateManager.
    /// </summary>
    public class StoryRunner
    {
        readonly ContentDatabase db;
        readonly StoryStateManager story;
        readonly IStoryPresenter presenter;

        /// <summary>Raised at stable nodes; the save system persists (nodeId, state) here.</summary>
        public event Action<string> Checkpoint;
        public event Action<string> Error;
        public event Action Finished;

        public string CurrentNodeId { get; private set; } = "";
        public bool IsRunning { get; private set; }
        int step;

        const int MaxSyncSteps = 1000;

        public StoryRunner(ContentDatabase db, StoryStateManager story, IStoryPresenter presenter)
        {
            this.db = db;
            this.story = story;
            this.presenter = presenter;
        }

        public void Start(string nodeId)
        {
            IsRunning = true;
            Go(nodeId, checkpoint: true);
        }

        public void Stop()
        {
            IsRunning = false;
            step++;
        }

        /// <summary>Wraps a presenter callback so only the first call for the current step counts.</summary>
        Action Once(Action action)
        {
            int myStep = ++step;
            return () =>
            {
                if (!IsRunning || myStep != step) return;
                step++;
                action();
            };
        }

        Action<T> Once<T>(Action<T> action)
        {
            int myStep = ++step;
            return value =>
            {
                if (!IsRunning || myStep != step) return;
                step++;
                action(value);
            };
        }

        void Go(string nodeId, bool checkpoint)
        {
            int guard = 0;
            string id = nodeId;
            while (IsRunning)
            {
                if (++guard > MaxSyncSteps) { Fail("Story loop without player input near '" + id + "'"); return; }
                if (string.IsNullOrEmpty(id) || !db.Nodes.TryGetValue(id, out var node))
                {
                    Fail("Missing story node '" + id + "' after '" + CurrentNodeId + "'");
                    return;
                }
                CurrentNodeId = node.id;
                bool stableEntry = checkpoint || node.type == "explore";
                checkpoint = false;
                if (stableEntry) Checkpoint?.Invoke(node.id);

                story.RecordHistory(node.id);
                story.Apply(node.effects);

                // Synchronous nodes continue in this loop; others hand control to the presenter.
                switch (node.type)
                {
                    case "effect":
                        id = db.NextOf(node);
                        continue;
                    case "branch":
                        id = ResolveBranch(node);
                        continue;
                    case "return":
                        id = story.State.exploreReturn;
                        if (string.IsNullOrEmpty(id)) id = db.NextOf(node);
                        continue;
                    case "explore":
                        if (node.exitWhen.Length > 0 && story.Evaluate(node.exitWhen))
                        {
                            story.State.exploreReturn = "";
                            id = db.NextOf(node);
                            checkpoint = true;
                            continue;
                        }
                        RunExplore(node);
                        return;
                    default:
                        RunPresented(node);
                        return;
                }
            }
        }

        string ResolveBranch(StoryNode node)
        {
            foreach (var c in node.cases)
                if (story.Evaluate(c.when)) return c.next;
            return db.NextOf(node);
        }

        void RunPresented(StoryNode node)
        {
            switch (node.type)
            {
                case "line":
                {
                    var line = BuildLine(node.id, node.speaker, node.ko, node.en);
                    story.Patterns.RecordLine(line);
                    presenter.ShowLine(line, Once(() => Go(db.NextOf(node), false)));
                    break;
                }
                case "choice":
                    RunChoice(node);
                    break;
                case "drill":
                    RunDrill(node);
                    break;
                case "document":
                {
                    if (!db.Documents.TryGetValue(node.document, out var doc)) { Fail("Missing document '" + node.document + "'"); return; }
                    foreach (var l in doc.lines) story.Patterns.RecordLine(BuildLine("", l.speaker, l.ko, l.en));
                    presenter.ShowDocument(doc, Once(() => Go(db.NextOf(node), true)));
                    break;
                }
                case "photo":
                {
                    if (!db.Photos.TryGetValue(node.photo, out var photo)) { Fail("Missing photo '" + node.photo + "'"); return; }
                    var state = db.PhotoStateOf(photo.id, story.PhotoStateOf(photo.id));
                    presenter.ShowPhoto(photo, state, Once(() => Go(db.NextOf(node), true)));
                    break;
                }
                case "transition":
                {
                    var t = node.transition;
                    if (t.to.Length > 0) story.RecordVisit(t.to);
                    if (t.ambience.Length > 0) story.State.ambience = new List<string>(t.ambience);
                    presenter.PlayTransition(t, Once(() => Go(db.NextOf(node), true)));
                    break;
                }
                case "end":
                    presenter.ShowEnd(node, Once(() =>
                    {
                        IsRunning = false;
                        Finished?.Invoke();
                    }));
                    break;
                default:
                    Fail("Unknown node type '" + node.type + "' on '" + node.id + "'");
                    break;
            }
        }

        void RunChoice(StoryNode node)
        {
            var visible = new List<ChoiceDef>();
            foreach (var c in node.choices)
                if (story.Evaluate(c.when)) visible.Add(c);
            if (visible.Count == 0) { Fail("Choice '" + node.id + "' has no available options"); return; }

            DialogueLine prompt = null;
            if (node.ko.Length > 0)
            {
                prompt = BuildLine(node.id, node.speaker, node.ko, node.en);
                story.Patterns.RecordLine(prompt);
            }
            var lines = new List<DialogueLine>();
            for (int i = 0; i < visible.Count; i++)
                lines.Add(BuildLine(node.id + "#" + i, "me", visible[i].ko, visible[i].en));

            presenter.ShowChoices(prompt, lines, Once<int>(index =>
            {
                if (index < 0 || index >= visible.Count) index = 0;
                var choice = visible[index];
                story.RecordChoice(node.id, Array.IndexOf(node.choices, choice));
                story.Patterns.RecordLine(lines[index]);
                story.Apply(choice.effects);
                Go(choice.next.Length > 0 ? choice.next : db.NextOf(node), true);
            }));
        }

        void RunDrill(StoryNode node)
        {
            if (!db.Drills.TryGetValue(node.drill, out var drill)) { Fail("Missing drill '" + node.drill + "'"); return; }
            presenter.ShowDrill(drill, Once<DrillOutcome>(outcome =>
            {
                outcome = outcome ?? new DrillOutcome();
                RecordPractice(drill);
                story.Apply(drill.successEffects);
                story.Apply(outcome.effects);
                if (drill.storeAs.Length > 0 && outcome.producedMarkup.Length > 0)
                {
                    StoryState.Set(story.State.vars, drill.storeAs, outcome.producedMarkup);
                    StoryState.Set(story.State.vars, drill.storeAs + "_en", outcome.producedEnglish);
                }
                Go(db.NextOf(node), true);
            }));
        }

        void RecordPractice(DrillDef drill)
        {
            if (drill.patternId.Length == 0) return;
            switch (drill.kind)
            {
                case "meaning":
                case "comprehension":
                case "context":
                case "match":
                    story.Patterns.Record(drill.patternId, PracticeKind.Recognition);
                    break;
                case "production":
                    story.Patterns.Record(drill.patternId, PracticeKind.Production);
                    story.Patterns.Record(drill.patternId, PracticeKind.ContextualUse);
                    break;
                default:
                    story.Patterns.Record(drill.patternId, PracticeKind.Production);
                    break;
            }
        }

        void RunExplore(StoryNode node)
        {
            if (!db.Rooms.TryGetValue(node.room, out var room)) { Fail("Missing room '" + node.room + "'"); return; }
            story.State.exploreReturn = node.id;
            var visible = new List<RoomObjectDef>();
            foreach (var o in room.objects)
                if (story.Evaluate(o.visibleWhen)) visible.Add(o);

            presenter.ShowRoom(room, visible, Once<RoomObjectDef>(obj =>
            {
                if (obj == null) { Go(node.id, false); return; }
                story.RecordInspection(obj.id);
                Go(obj.node, false);
            }));
        }

        public DialogueLine BuildLine(string id, string speaker, string markup, string english) =>
            KoreanMarkup.BuildLine(id, speaker, story.Substitute(markup), story.Substitute(english));

        void Fail(string message)
        {
            Error?.Invoke(message);
            IsRunning = false;
            Finished?.Invoke();
        }
    }
}
